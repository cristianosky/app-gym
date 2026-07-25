/**
 * Utilidades de fecha en español, sin dependencias externas.
 * Toda la app usa la "clave de día" YYYY-MM-DD como identificador
 * de una jornada concreta para guardar progreso en el storage.
 */

const DIAS = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
];

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

/** Clave única de un día concreto: "2026-06-26" */
export function dayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Índice de rutina 1..7 (Lunes=1 ... Domingo=7).
 * El plan de entrenamiento se organiza con esta numeración.
 */
export function weekdayIndex(date = new Date()) {
  const js = date.getDay(); // 0=Domingo
  return js === 0 ? 7 : js;
}

/** Nombre del día: "Lunes" */
export function weekdayName(date = new Date()) {
  return DIAS[date.getDay()];
}

/** Fecha larga: "viernes 26 de junio" */
export function longDate(date = new Date()) {
  const dia = DIAS[date.getDay()].toLowerCase();
  return `${dia} ${date.getDate()} de ${MESES[date.getMonth()]}`;
}

/** Devuelve las claves de día de la semana actual (Lunes→Domingo). */
export function currentWeekKeys(date = new Date()) {
  const idx = weekdayIndex(date); // 1..7
  const monday = new Date(date);
  monday.setDate(date.getDate() - (idx - 1));
  const keys = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    keys.push(dayKey(d));
  }
  return keys;
}

/** Diferencia en días entre dos claves (a - b). */
export function daysBetween(keyA, keyB) {
  const a = new Date(keyA + 'T00:00:00');
  const b = new Date(keyB + 'T00:00:00');
  return Math.round((a - b) / 86400000);
}
