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
import {
  hydrate,
  getExercise,
  alternativesFor,
  exercisesForEnv,
  warmupStretchForDay,
  EXERCISES,
} from '../data/catalog.js';
import { aiRoutineSchema, ejerciciosValidos } from '../validation/ai-output.js';
import { buildFallbackRoutine } from './fallback-routine.js';
import * as planRepo from '../repositories/plan.repo.js';
import * as customExerciseRepo from '../repositories/custom-exercise.repo.js';
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
 * @param {object} [opciones]
 * @param {boolean} [opciones.skipIfExists=false] si ya hay una rutina guardada,
 *   no la pisa (devuelve el plan generado sin guardarlo). Lo usa la generación
 *   en background del registro: si en esos segundos la persona armó su propia
 *   rutina (por ejemplo, una desde cero), esa debe ganar y no ser reemplazada.
 * @returns {Promise<{plan: object, source: 'ia'|'respaldo', aviso: string|null}>}
 */
export async function generateRoutine(user, { skipIfExists = false } = {}) {
  const perfil = user.profile;
  const yaTieneRutina = () => skipIfExists && Boolean(planRepo.findCurrent('rutina', user.id));
  let aviso = null;

  try {
    const crudo = await pedirAGemini(user.name, perfil);
    const validado = aiRoutineSchema.parse(crudo);
    const plan = armarPlan(validado);

    if (planUtilizable(plan, perfil.trainingDays.length)) {
      if (yaTieneRutina()) return { plan, source: 'ia', aviso: null };
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
  if (yaTieneRutina()) return { plan: respaldo, source: 'respaldo', aviso };
  const guardado = planRepo.save('rutina', user.id, respaldo, 'respaldo');
  return { plan: guardado.plan, source: 'respaldo', aviso };
}

/** Rutina vigente o null si todavía no ha generado ninguna. */
export function getCurrentRoutine(userId) {
  return planRepo.findCurrent('rutina', userId);
}

/** Textos base de una rutina que la persona arma a mano (sin IA). */
const RUTINA_MANUAL_META = {
  nombrePlan: 'Mi rutina',
  resumen:
    'Esta rutina la está armando usted. En la vista semanal, toque "Agregar ejercicio" ' +
    'en cada día para ir sumando lo que quiera entrenar. El calentamiento y el ' +
    'estiramiento ya vienen puestos en cada sesión.',
  consejos: [
    'Empiece por los ejercicios grandes (pecho, espalda, pierna) y deje el aislamiento de brazos y hombro para el final.',
    'Apunte a entre 4 y 6 ejercicios por día: la sesión queda completa sin alargarse de más.',
    'Anote el peso que usa en cada ejercicio; la idea es ir subiendo de a poquito semana a semana.',
    'Si un día le queda muy flojo o muy pesado, ajústelo quitando o agregando ejercicios cuando quiera.',
  ],
};

/** Aspecto de un día de rutina manual que todavía no tiene ejercicios propios. */
const DIA_MANUAL_VACIO = { titulo: 'Entrenamiento libre', subtitulo: 'Arme su sesión', acento: 'cuerpo' };

/** Nombre visible de cada grupo muscular, para titular los días manuales. */
const GRUPO_LABEL = {
  pecho: 'Pecho', espalda: 'Espalda', pierna: 'Pierna', hombro: 'Hombro',
  brazo: 'Brazo', core: 'Core', cardio: 'Cardio',
};

/**
 * Reetiqueta un día de una rutina manual según los ejercicios reales que tiene
 * (título, subtítulo y color de acento), para que no se quede como
 * "Entrenamiento libre" genérico a medida que la persona lo arma. No se usa en
 * rutinas de IA/respaldo: esas ya traen sus propios títulos pensados.
 */
function reetiquetarDiaManual(dia) {
  const cuerpo = dia.ejercicios.filter((ex) => !ex.isWarmup && !ex.isStretch);
  if (cuerpo.length === 0) return { ...dia, ...DIA_MANUAL_VACIO };

  const conteo = {};
  for (const ex of cuerpo) conteo[ex.group] = (conteo[ex.group] ?? 0) + 1;
  const principales = Object.entries(conteo)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([grupo]) => grupo);

  return {
    ...dia,
    titulo: principales.map((g) => GRUPO_LABEL[g] ?? g).join(' y '),
    subtitulo: `${cuerpo.length} ${cuerpo.length === 1 ? 'ejercicio' : 'ejercicios'}`,
    acento: principales[0],
  };
}

/**
 * Crea una rutina en blanco para que la persona la arme a mano, sin pasar por
 * la IA. Cada día de entrenamiento entra solo con el calentamiento y el
 * estiramiento; los ejercicios los agrega la persona desde la app con el flujo
 * de "Agregar ejercicio". Los días que no marca como entreno quedan en descanso.
 * @param {object} user usuario completo (con `profile`)
 * @returns {{plan: object, source: 'manual', createdAt: number}}
 */
export function createBlankRoutine(user) {
  const diasEntreno = user.profile.trainingDays;

  const dias = [];
  for (let dia = 1; dia <= 7; dia++) {
    if (!diasEntreno.includes(dia)) {
      dias.push({ dia, titulo: 'Descanso', subtitulo: 'Recuperación', acento: 'rest', descanso: true, rest: true, ejercicios: [] });
      continue;
    }

    const { warmup, stretch } = warmupStretchForDay(dia);
    dias.push({
      dia,
      ...DIA_MANUAL_VACIO,
      descanso: false,
      rest: false,
      ejercicios: [
        { ...warmup.block, sets: 1, reps: warmup.reps, rest: 0, note: null },
        { ...stretch.block, sets: 1, reps: stretch.reps, rest: 0, note: null },
      ],
    });
  }

  const plan = { ...RUTINA_MANUAL_META, dias };
  const guardado = planRepo.save('rutina', user.id, plan, 'manual');
  return { plan: guardado.plan, source: 'manual', createdAt: guardado.createdAt };
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
 * Convierte un ejercicio propio (guardado en `custom_exercises`) a la misma
 * forma que un ejercicio del catálogo, para que la app no tenga que saber de
 * dónde salió cada uno. Como el video es obligatorio al crearlo, no necesita
 * `illu` real: ese campo solo es el respaldo si el GIF no carga.
 */
function toBaseExercise(customEx) {
  return {
    id: customEx.id,
    name: customEx.name,
    group: customEx.group,
    illu: 'personalizado',
    video: null,
    gifUrl: customEx.gifUrl,
    equipment: customEx.equipment,
    envs: ['gimnasio', 'casa', 'peso-corporal'],
    pattern: 'personalizado',
    level: 'intermedio',
    compound: false,
    muscles: '',
    howto: [],
    errors: [],
    smartfit: null,
    custom: true,
  };
}

/** Busca un ejercicio primero en el catálogo cerrado y, si no está, entre los propios del usuario. */
function findExerciseBase(userId, exerciseId) {
  const delCatalogo = getExercise(exerciseId);
  if (delCatalogo) return delCatalogo;

  const propio = customExerciseRepo.findByIdForUser(exerciseId, userId);
  return propio ? toBaseExercise(propio) : null;
}

/**
 * Crea un ejercicio propio (con su video ya convertido a GIF) para que la
 * persona lo use al armar la rutina a mano. No entra al catálogo cerrado ni
 * lo ve la IA: solo lo puede usar quien lo creó.
 */
export function createCustomExercise(userId, { name, group, equipment, gifUrl }) {
  const fila = customExerciseRepo.create({ userId, name, group, equipment, gifUrl });
  return toBaseExercise(fila);
}

/**
 * Ejercicios equivalentes a uno del día vigente (mismo grupo muscular,
 * disponibles en el entorno de la persona, y que no estén ya ese día).
 * Incluye tanto los del catálogo cerrado como los propios de la persona.
 */
export function getAlternatives(user, day, exerciseId) {
  const actual = planRepo.findCurrent('rutina', user.id);
  if (!actual) return [];

  const dia = actual.plan.dias.find((d) => d.dia === day);
  if (!dia) return [];

  const objetivo = dia.ejercicios.find((ex) => ex.id === exerciseId);
  if (!objetivo) return [];

  const usados = new Set(dia.ejercicios.map((ex) => ex.id));

  // El objetivo puede ser un ejercicio propio (no está en el catálogo cerrado):
  // en ese caso `alternativesFor` no encuentra nada, así que se arma la lista
  // de alternativas del catálogo a partir del grupo muscular directamente.
  const delCatalogo = getExercise(exerciseId)
    ? alternativesFor(exerciseId, user.profile.environment)
    : EXERCISES.filter((ex) => ex.group === objetivo.group && ex.envs.includes(user.profile.environment));

  const propios = customExerciseRepo
    .listForUser(user.id)
    .map(toBaseExercise)
    .filter((ex) => ex.id !== exerciseId && ex.group === objetivo.group);

  return [...delCatalogo, ...propios].filter((ex) => !usados.has(ex.id));
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

  const reemplazo = findExerciseBase(userId, replacementId);
  if (!reemplazo) throw badRequest('El ejercicio de reemplazo no existe.');
  if (reemplazo.group !== objetivo.group) {
    throw badRequest('El reemplazo debe trabajar el mismo grupo muscular.');
  }
  if (dia.ejercicios.some((ex) => ex.id === replacementId)) {
    throw badRequest('Ese ejercicio ya está en el día.');
  }

  const nuevo = { ...reemplazo, sets: objetivo.sets, reps: objetivo.reps, rest: objetivo.rest, note: objetivo.note };

  const dias = actual.plan.dias.map((d) => {
    if (d.dia !== day) return d;
    const actualizado = { ...d, ejercicios: d.ejercicios.map((ex) => (ex.id === exerciseId ? nuevo : ex)) };
    return actual.source === 'manual' ? reetiquetarDiaManual(actualizado) : actualizado;
  });

  const plan = { ...actual.plan, dias };
  return planRepo.save('rutina', userId, plan, actual.source);
}

/** Con qué series/reps/descanso arranca un ejercicio agregado a mano. */
const PRESCRIPCION_POR_DEFECTO = { sets: 3, reps: '10-12', rest: 60 };

/**
 * Ejercicios que la persona puede agregar al día vigente: disponibles en su
 * entorno y que todavía no estén ese día. Incluye los del catálogo cerrado
 * y los propios que la persona haya creado con su video.
 */
export function getCatalogForDay(user, day) {
  const actual = planRepo.findCurrent('rutina', user.id);
  const dia = actual?.plan.dias.find((d) => d.dia === day);
  const usados = new Set(dia?.ejercicios.map((ex) => ex.id) ?? []);

  const delCatalogo = exercisesForEnv(user.profile.environment);
  const propios = customExerciseRepo.listForUser(user.id).map(toBaseExercise);
  return [...delCatalogo, ...propios].filter((ex) => !usados.has(ex.id));
}

/**
 * Agrega un ejercicio al día, con una prescripción base (la persona puede
 * ajustarla luego regenerando o cambiándolo). Se inserta antes del
 * estiramiento final, no al final del arreglo. Sirve tanto para ejercicios
 * del catálogo cerrado como para ejercicios propios.
 */
export function addExercise(userId, day, exerciseId) {
  const actual = planRepo.findCurrent('rutina', userId);
  if (!actual) throw notFound('Todavía no tiene una rutina guardada.');

  const dia = actual.plan.dias.find((d) => d.dia === day);
  if (!dia) throw badRequest('Ese día no existe en su rutina.');

  const nuevoBase = findExerciseBase(userId, exerciseId);
  if (!nuevoBase) throw badRequest('Ese ejercicio no existe.');
  if (dia.ejercicios.some((ex) => ex.id === exerciseId)) {
    throw badRequest('Ese ejercicio ya está en el día.');
  }

  const nuevo = { ...nuevoBase, ...PRESCRIPCION_POR_DEFECTO, note: null };
  const indiceEstiramiento = dia.ejercicios.findIndex((ex) => ex.isStretch);
  const ejercicios = [...dia.ejercicios];
  ejercicios.splice(indiceEstiramiento === -1 ? ejercicios.length : indiceEstiramiento, 0, nuevo);

  const dias = actual.plan.dias.map((d) => {
    if (d.dia !== day) return d;
    const actualizado = { ...d, ejercicios };
    return actual.source === 'manual' ? reetiquetarDiaManual(actualizado) : actualizado;
  });
  const plan = { ...actual.plan, dias };
  return planRepo.save('rutina', userId, plan, actual.source);
}

/**
 * Quita un ejercicio del día. No se puede dejar el día sin ningún
 * ejercicio real (calentamiento y estiramiento no cuentan), para no dejar
 * una sesión vacía por accidente.
 */
export function removeExercise(userId, day, exerciseId) {
  const actual = planRepo.findCurrent('rutina', userId);
  if (!actual) throw notFound('Todavía no tiene una rutina guardada.');

  const dia = actual.plan.dias.find((d) => d.dia === day);
  if (!dia) throw badRequest('Ese día no existe en su rutina.');

  const objetivo = dia.ejercicios.find((ex) => ex.id === exerciseId);
  if (!objetivo || objetivo.isWarmup || objetivo.isStretch) {
    throw badRequest('Ese ejercicio no se puede quitar.');
  }

  const restantes = dia.ejercicios.filter((ex) => ex.isWarmup || ex.isStretch || ex.id !== exerciseId);
  const quedanReales = restantes.some((ex) => !ex.isWarmup && !ex.isStretch);
  if (!quedanReales) {
    throw badRequest('No puede dejar el día sin ningún ejercicio. Agregue otro antes de quitar este.');
  }

  const dias = actual.plan.dias.map((d) => {
    if (d.dia !== day) return d;
    const actualizado = { ...d, ejercicios: restantes };
    return actual.source === 'manual' ? reetiquetarDiaManual(actualizado) : actualizado;
  });
  const plan = { ...actual.plan, dias };
  return planRepo.save('rutina', userId, plan, actual.source);
}
