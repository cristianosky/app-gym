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

/** Calentamiento y estiramiento: los añade el servidor, no la IA. */
export const WARMUP = BLOQUES.find((b) => b.id === 'calentamiento');
export const STRETCH = BLOQUES.find((b) => b.id === 'estiramiento');

const BY_ID = new Map([...EXERCISES, ...BLOQUES].map((ex) => [ex.id, ex]));

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
