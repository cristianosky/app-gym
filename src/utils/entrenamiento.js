/**
 * Cálculos de tiempo del modo entrenamiento.
 *
 * Las repeticiones vienen del asistente como texto libre ("10-12", "40 s",
 * "15 min"), así que aquí se interpretan para poder cronometrar las series
 * que van por tiempo y estimar cuánto falta para terminar el día.
 */

/** Descanso por defecto cuando el ejercicio no trae uno (en segundos). */
export const DESCANSO_POR_DEFECTO = 60;

/** Segundos que se asumen por repetición cuando no hay otra referencia. */
const SEGUNDOS_POR_REP = 3.5;

/** Duración de una serie cuando no se puede deducir nada del texto. */
const TRABAJO_POR_DEFECTO = 40;

/**
 * Segundos que dura la serie si las repeticiones están dadas por tiempo.
 * @returns {number|null} null si son repeticiones normales ("10-12").
 */
export function duracionDeReps(reps) {
  if (typeof reps !== 'string') return null;
  const m = reps.match(/(\d+)\s*(segundos?|seg|s|minutos?|min|m)\b/i);
  if (!m) return null;
  const cantidad = Number(m[1]);
  const enMinutos = /^m/i.test(m[2]);
  return enMinutos ? cantidad * 60 : cantidad;
}

/** Cuánto se demora una serie: por tiempo si lo dice, si no por número de reps. */
export function segundosDeSerie(ejercicio) {
  const porTiempo = duracionDeReps(ejercicio?.reps);
  if (porTiempo) return porTiempo;

  // "10-12" → se toma el número más alto, que es el esfuerzo real.
  const numeros = String(ejercicio?.reps ?? '').match(/\d+/g);
  if (numeros?.length) {
    const reps = Math.max(...numeros.map(Number));
    if (reps > 0) return Math.round(reps * SEGUNDOS_POR_REP);
  }
  return TRABAJO_POR_DEFECTO;
}

/** Descanso real de un ejercicio (0 sí que significa "sin descanso"). */
export function segundosDeDescanso(ejercicio) {
  if (ejercicio?.rest === 0) return 0;
  return ejercicio?.rest ?? DESCANSO_POR_DEFECTO;
}

/**
 * Estimación de lo que falta para terminar, en segundos.
 * @param {object[]} ejercicios los que quedan, empezando por el actual
 * @param {number} seriesHechasDelActual series ya terminadas del primero de la lista
 */
export function segundosRestantes(ejercicios, seriesHechasDelActual = 0) {
  return ejercicios.reduce((total, ejercicio, i) => {
    const series = Math.max(0, (ejercicio.sets ?? 1) - (i === 0 ? seriesHechasDelActual : 0));
    const trabajo = segundosDeSerie(ejercicio) * series;
    // Entre series hay descanso, pero después de la última se pasa al siguiente
    // ejercicio: por eso los descansos son uno menos que las series.
    const descanso = segundosDeDescanso(ejercicio) * Math.max(0, series - 1);
    return total + trabajo + descanso;
  }, 0);
}

/** 125 → "2:05" (siempre con dos dígitos en los segundos). */
export function reloj(segundos) {
  const s = Math.max(0, Math.round(segundos));
  const min = Math.floor(s / 60);
  return `${min}:${String(s % 60).padStart(2, '0')}`;
}

/** Texto corto y redondeado para "cuánto falta": "~12 min", "menos de 1 min". */
export function tiempoAproximado(segundos) {
  if (segundos < 60) return 'menos de 1 min';
  const min = Math.round(segundos / 60);
  return `~${min} min`;
}
