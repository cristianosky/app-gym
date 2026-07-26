/**
 * Catálogo de ejercicios: única fuente de verdad de la app.
 *
 * ¿Por qué existe?
 * La IA NO inventa ejercicios: escoge identificadores de este catálogo y solo
 * decide series, repeticiones, descanso y el orden. Así garantizamos que:
 *   - el botón "Ver ejemplo" siempre tiene video o animación que mostrar,
 *   - los nombres y la técnica están revisados (nada de datos alucinados),
 *   - la respuesta de la IA es pequeña, rápida y barata.
 *
 * Campos de un ejercicio:
 *   id         clave estable que usa la IA (no cambiarla nunca)
 *   name       nombre en español colombiano, como se dice en el gimnasio
 *   group      grupo muscular → color de la tarjeta (ver src/theme.js de la app)
 *   illu       clave de la animación de respaldo (src/illustrations)
 *   video      id de YouTube o null (si es null la app muestra la animación)
 *   equipment  maquina | barra | mancuernas | polea | peso-corporal | cardio | ninguno
 *   envs       dónde se puede hacer: gimnasio | casa | peso-corporal
 *   pattern    patrón de movimiento (sirve para equilibrar la rutina)
 *   level      principiante | intermedio | avanzado
 *   compound   true si es multiarticular (van primero en la sesión)
 *   muscles    músculos trabajados
 *   howto      pasos de ejecución
 *   errors     errores comunes
 *   tips       consejo opcional
 *   smartfit   nota práctica sobre cómo hacerlo en una sede Smart Fit
 */
import { PECHO } from './catalog/pecho.js';
import { ESPALDA } from './catalog/espalda.js';
import { PIERNA } from './catalog/pierna.js';
import { HOMBRO, BRAZO } from './catalog/hombro-brazo.js';
import { CORE, CARDIO, BLOQUES } from './catalog/core-cardio.js';

/** Ejercicios que la IA puede escoger para el cuerpo de la sesión. */
export const EXERCISES = Object.freeze([
  ...PECHO,
  ...ESPALDA,
  ...PIERNA,
  ...HOMBRO,
  ...BRAZO,
  ...CORE,
  ...CARDIO,
]);

/** Calentamiento y estiramiento genéricos: respaldo para sábado y domingo. */
export const WARMUP = BLOQUES.find((b) => b.id === 'calentamiento');
export const STRETCH = BLOQUES.find((b) => b.id === 'estiramiento');

const BY_ID = new Map([...EXERCISES, ...BLOQUES].map((ex) => [ex.id, ex]));

/**
 * Calentamiento y cierre de cardio, fijos por día de la semana (lunes=1 ...
 * viernes=5). Sábado y domingo no tienen entrada aquí y usan el genérico.
 */
const CALENTAMIENTO_ID_POR_DIA = {
  1: 'calentamiento-caminadora',
  2: 'calentamiento-bicicleta',
  3: 'calentamiento-caminadora',
  4: 'calentamiento-bicicleta',
  5: 'calentamiento-eliptica-caminadora',
};

const FINAL_POR_DIA = {
  1: { id: 'final-caminadora', reps: '15 min' },
  2: { id: 'final-bicicleta', reps: '15-20 min' },
  3: { id: 'final-bicicleta', reps: '15 min' },
  4: { id: 'final-caminadora', reps: '15 min' },
  5: { id: 'final-libre', reps: '20 min' },
};

/**
 * Bloques de calentamiento y cierre que le corresponden a un día de la
 * semana (1=lunes ... 7=domingo), con la duración ya lista para mostrar.
 * @param {number} dia
 * @returns {{ warmup: {block: object, reps: string}, stretch: {block: object, reps: string} }}
 */
export function warmupStretchForDay(dia) {
  const calentamientoId = CALENTAMIENTO_ID_POR_DIA[dia];
  const final = FINAL_POR_DIA[dia];

  return {
    warmup: calentamientoId
      ? { block: getExercise(calentamientoId), reps: '7 min' }
      : { block: WARMUP, reps: '5-8 min' },
    stretch: final
      ? { block: getExercise(final.id), reps: final.reps }
      : { block: STRETCH, reps: '5 min' },
  };
}

/** Busca un ejercicio por id. Devuelve null si no existe. */
export function getExercise(id) {
  return BY_ID.get(id) ?? null;
}

/** ¿Existe ese id en el catálogo? */
export function isValidExerciseId(id) {
  return BY_ID.has(id);
}

/**
 * Ejercicios disponibles según dónde entrena la persona.
 * @param {'gimnasio'|'casa'|'peso-corporal'} entorno
 */
export function exercisesForEnv(entorno) {
  return EXERCISES.filter((ex) => ex.envs.includes(entorno));
}

/**
 * Ejercicios que trabajan el mismo grupo muscular que uno dado, para
 * reemplazarlo cuando la máquina no está, está ocupada o no le gusta a la
 * persona, sin perder el objetivo de ese día. Los del mismo patrón de
 * movimiento (empuje, tracción, etc.) van primero: son el reemplazo más fiel.
 */
export function alternativesFor(exerciseId, entorno) {
  const actual = getExercise(exerciseId);
  if (!actual) return [];

  const candidatos = EXERCISES.filter(
    (ex) => ex.id !== exerciseId && ex.group === actual.group && ex.envs.includes(entorno),
  );
  const mismoPatron = candidatos.filter((ex) => ex.pattern === actual.pattern);
  const otroPatron = candidatos.filter((ex) => ex.pattern !== actual.pattern);
  return [...mismoPatron, ...otroPatron];
}

/**
 * Resumen compacto del catálogo para meterlo en el prompt de la IA.
 * Solo lo mínimo que necesita para escoger bien: id, nombre, grupo, patrón,
 * equipo y nivel. La ficha completa la añade el servidor después.
 */
export function catalogForPrompt(entorno) {
  return exercisesForEnv(entorno)
    .map((ex) => `${ex.id} | ${ex.name} | ${ex.group} | ${ex.pattern} | ${ex.equipment} | ${ex.level}`)
    .join('\n');
}

/**
 * Convierte la elección de la IA en un ejercicio completo para la app.
 * @param {{exerciseId: string, sets: number, reps: string, rest: number, note?: string}} prescripcion
 * @returns {object|null} ejercicio listo para pintar, o null si el id no existe
 */
export function hydrate(prescripcion) {
  const base = getExercise(prescripcion.exerciseId);
  if (!base) return null;

  return {
    ...base,
    sets: prescripcion.sets,
    reps: prescripcion.reps,
    rest: prescripcion.rest,
    note: prescripcion.note ?? null,
  };
}
