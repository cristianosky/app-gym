/**
 * Generación de la rutina semanal.
 *
 * Flujo: prompt → Gemini (salida estructurada) → validación → se rellenan los
 * ejercicios con la ficha completa del catálogo → se guarda.
 * Si algo falla en el camino, se entrega la rutina de respaldo del servidor
 * en vez de dejar a la persona sin plan.
 */
import { genai, MODELS, extractText } from '../ai/client.js';
import { routinePrompt } from '../ai/prompts.js';
import { ROUTINE_SCHEMA } from '../ai/schemas.js';
import { hydrate, getExercise, alternativesFor, warmupStretchForDay } from '../data/catalog.js';
import { aiRoutineSchema, ejerciciosValidos } from '../validation/ai-output.js';
import { buildFallbackRoutine } from './fallback-routine.js';
import * as planRepo from '../repositories/plan.repo.js';
import { badRequest, notFound } from '../utils/app-error.js';

/** Mínimo de ejercicios para que un día de entrenamiento se considere válido. */
const MINIMO_POR_DIA = 3;

/**
 * Convierte el plan crudo (ids + prescripción) en el plan que consume la app,
 * con la ficha completa de cada ejercicio y los bloques de calentamiento y
 * estiramiento añadidos por el servidor.
 */
function armarPlan(crudo) {
  const dias = crudo.dias
    .slice()
    .sort((a, b) => a.dia - b.dia)
    .map((dia) => {
      if (dia.descanso) {
        return { ...dia, ejercicios: [], rest: true };
      }

      const prescripciones = ejerciciosValidos(dia.ejercicios);
      const ejercicios = prescripciones.map(hydrate).filter(Boolean);
      const { warmup, stretch } = warmupStretchForDay(dia.dia);

      return {
        ...dia,
        rest: false,
        ejercicios: [
          { ...warmup.block, sets: 1, reps: warmup.reps, rest: 0, note: null },
          ...ejercicios,
          { ...stretch.block, sets: 1, reps: stretch.reps, rest: 0, note: null },
        ],
      };
    });

  return { ...crudo, dias };
}

/** ¿El plan tiene suficiente contenido para entregárselo a la persona? */
function planUtilizable(plan, diasEsperados) {
  const entrenamientos = plan.dias.filter((d) => !d.rest);
  if (entrenamientos.length === 0) return false;

  // Descontamos calentamiento y estiramiento, que los pone el servidor.
  const todosCompletos = entrenamientos.every((d) => d.ejercicios.length - 2 >= MINIMO_POR_DIA);
  const coincidenDias = entrenamientos.length >= Math.min(diasEsperados, 1);

  return todosCompletos && coincidenDias;
}

/** Pide la rutina a Gemini. Lanza si la API falla o no devuelve texto. */
async function pedirAGemini(name, perfil) {
  const { system, user } = routinePrompt(name, perfil);

  const response = await genai.models.generateContent({
    model: MODELS.routine,
    contents: user,
    config: {
      systemInstruction: system,
      responseMimeType: 'application/json',
      responseSchema: ROUTINE_SCHEMA,
      maxOutputTokens: 16000,
    },
  });

  const texto = extractText(response);
  if (!texto) throw new Error('Gemini devolvió una respuesta vacía o bloqueada');

  return JSON.parse(texto);
}

/**
 * Genera y guarda la rutina del usuario.
 * @param {object} user usuario completo (con `profile`)
 * @returns {Promise<{plan: object, source: 'ia'|'respaldo', aviso: string|null}>}
 */
export async function generateRoutine(user) {
  const perfil = user.profile;
  let aviso = null;

  try {
    const crudo = await pedirAGemini(user.name, perfil);
    const validado = aiRoutineSchema.parse(crudo);
    const plan = armarPlan(validado);

    if (planUtilizable(plan, perfil.trainingDays.length)) {
      const guardado = planRepo.save('rutina', user.id, plan, 'ia');
      return { plan: guardado.plan, source: 'ia', aviso: null };
    }

    // eslint-disable-next-line no-console
    console.warn('[rutina] El plan de la IA quedó incompleto; se usa el de respaldo.');
    aviso = 'El asistente entregó un plan incompleto, así que le armamos la versión base. Puede regenerarla cuando quiera.';
  } catch (error) {
    // Un fallo de red o de la API no debe dejar a la persona sin rutina:
    // se registra y se sigue con el plan de respaldo.
    // eslint-disable-next-line no-console
    console.error('[rutina] Falló la generación con IA:', error?.status ?? '', error?.message ?? error);
    aviso = 'No pudimos conectarnos con el asistente, así que le dejamos la rutina base. Regenérela más tarde para personalizarla.';
  }

  const respaldo = armarPlan(buildFallbackRoutine(perfil));
  const guardado = planRepo.save('rutina', user.id, respaldo, 'respaldo');
  return { plan: guardado.plan, source: 'respaldo', aviso };
}

/** Rutina vigente o null si todavía no ha generado ninguna. */
export function getCurrentRoutine(userId) {
  return planRepo.findCurrent('rutina', userId);
}

/**
 * Prende o apaga días según lo que la persona marcó, sin tocar la IA.
 * Al apagar un día no se borran sus ejercicios (quedan guardados en el
 * plan aunque no se muestren), así que si la persona lo vuelve a marcar
 * como entreno, se reactiva con lo que ya tenía. Solo se queda en
 * descanso permanente un día que nunca tuvo ejercicios (porque la IA lo
 * armó como descanso desde el principio) — para ese caso sigue existiendo
 * `regenerarRutina`.
 */
export function syncRestDays(userId, trainingDays) {
  const actual = planRepo.findCurrent('rutina', userId);
  if (!actual) return null;

  const dias = actual.plan.dias.map((dia) => {
    const entrenaEsteDia = trainingDays.includes(dia.dia);

    if (entrenaEsteDia) {
      if (!dia.rest || dia.ejercicios?.length === 0) return dia;
      return { ...dia, rest: false };
    }

    if (dia.rest) return dia;
    return { ...dia, rest: true };
  });

  const plan = { ...actual.plan, dias };
  return planRepo.save('rutina', userId, plan, actual.source);
}

/**
 * Cambia qué rutina de entreno le toca a cada día de la semana, sin tocar
 * la IA ni el calendario: cada día de la semana sigue siendo el mismo
 * (lunes sigue siendo lunes), solo se reparte distinto el contenido entre
 * los días que la persona entrena.
 * @param {string} userId
 * @param {number[]} trainingDays días de entreno vigentes en el perfil
 * @param {number[]} order permutación de `trainingDays`: la posición i dice
 *   qué día (su contenido original) pasa a ocupar el i-ésimo día de entreno.
 */
export function reorderRoutine(userId, trainingDays, order) {
  const actual = planRepo.findCurrent('rutina', userId);
  if (!actual) return null;

  const diasEntreno = [...trainingDays].sort((a, b) => a - b);
  const mismoConjunto = order.length === diasEntreno.length && diasEntreno.every((d) => order.includes(d));
  if (!mismoConjunto) {
    throw badRequest('El orden debe incluir exactamente los días que entrena, sin repetir ninguno.');
  }

  const contenidoPorDia = new Map(actual.plan.dias.map((dia) => [dia.dia, dia]));

  const dias = actual.plan.dias.map((dia) => {
    const posicion = diasEntreno.indexOf(dia.dia);
    if (posicion === -1) return dia;
    return { ...contenidoPorDia.get(order[posicion]), dia: dia.dia };
  });

  const plan = { ...actual.plan, dias };
  return planRepo.save('rutina', userId, plan, actual.source);
}

/**
 * Ejercicios equivalentes a uno del día vigente (mismo grupo muscular,
 * disponibles en el entorno de la persona, y que no estén ya ese día).
 */
export function getAlternatives(user, day, exerciseId) {
  const actual = planRepo.findCurrent('rutina', user.id);
  if (!actual) return [];

  const dia = actual.plan.dias.find((d) => d.dia === day);
  if (!dia) return [];

  const usados = new Set(dia.ejercicios.map((ex) => ex.id));
  return alternativesFor(exerciseId, user.profile.environment).filter((ex) => !usados.has(ex.id));
}

/**
 * Cambia un ejercicio del día por otro que trabaje el mismo grupo muscular,
 * conservando las series/repeticiones/descanso que ya tenía asignados (el
 * cambio es de "qué máquina", no de "cuánto entrenar").
 */
export function replaceExercise(userId, day, exerciseId, replacementId) {
  const actual = planRepo.findCurrent('rutina', userId);
  if (!actual) throw notFound('Todavía no tiene una rutina guardada.');

  const dia = actual.plan.dias.find((d) => d.dia === day);
  if (!dia) throw badRequest('Ese día no existe en su rutina.');

  const objetivo = dia.ejercicios.find((ex) => ex.id === exerciseId);
  if (!objetivo || objetivo.isWarmup || objetivo.isStretch) {
    throw badRequest('Ese ejercicio no se puede reemplazar.');
  }

  const reemplazo = getExercise(replacementId);
  if (!reemplazo) throw badRequest('El ejercicio de reemplazo no existe.');
  if (reemplazo.group !== objetivo.group) {
    throw badRequest('El reemplazo debe trabajar el mismo grupo muscular.');
  }
  if (dia.ejercicios.some((ex) => ex.id === replacementId)) {
    throw badRequest('Ese ejercicio ya está en el día.');
  }

  const nuevo = hydrate({
    exerciseId: replacementId,
    sets: objetivo.sets,
    reps: objetivo.reps,
    rest: objetivo.rest,
    note: objetivo.note,
  });

  const dias = actual.plan.dias.map((d) => {
    if (d.dia !== day) return d;
    return { ...d, ejercicios: d.ejercicios.map((ex) => (ex.id === exerciseId ? nuevo : ex)) };
  });

  const plan = { ...actual.plan, dias };
  return planRepo.save('rutina', userId, plan, actual.source);
}
