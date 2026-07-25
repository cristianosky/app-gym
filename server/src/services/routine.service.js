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
import { hydrate, WARMUP, STRETCH } from '../data/catalog.js';
import { aiRoutineSchema, ejerciciosValidos } from '../validation/ai-output.js';
import { buildFallbackRoutine } from './fallback-routine.js';
import * as planRepo from '../repositories/plan.repo.js';

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

      return {
        ...dia,
        rest: false,
        ejercicios: [
          { ...WARMUP, sets: 1, reps: '5-8 min', rest: 0, note: null },
          ...ejercicios,
          { ...STRETCH, sets: 1, reps: '5 min', rest: 0, note: null },
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
