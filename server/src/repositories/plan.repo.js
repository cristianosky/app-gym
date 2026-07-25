/**
 * Guardado de rutinas y planes de comida.
 *
 * Ambas tablas tienen la misma forma (usuario + JSON del plan + origen), así
 * que comparten repositorio. Se guarda el histórico: cada regeneración crea
 * una fila nueva y la vigente es siempre la más reciente.
 */
import { db, toJson, fromJson } from '../db/index.js';
import { newId } from '../utils/id.js';

const TABLAS = {
  rutina: { tabla: 'routines', prefijo: 'rtn' },
  nutricion: { tabla: 'nutrition_plans', prefijo: 'ntr' },
};

function config(tipo) {
  const c = TABLAS[tipo];
  if (!c) throw new Error(`Tipo de plan desconocido: ${tipo}`);
  return c;
}

function toPlan(row) {
  if (!row) return null;
  return {
    id: row.id,
    plan: fromJson(row.plan),
    source: row.source,
    createdAt: row.created_at,
  };
}

/**
 * Guarda un plan nuevo.
 * @param {'rutina'|'nutricion'} tipo
 * @param {string} userId
 * @param {object} plan contenido completo del plan
 * @param {'ia'|'respaldo'} source cómo se generó
 */
export function save(tipo, userId, plan, source) {
  const { tabla, prefijo } = config(tipo);
  const id = newId(prefijo);

  db.prepare(`INSERT INTO ${tabla} (id, user_id, plan, source, created_at) VALUES (?, ?, ?, ?, ?)`).run(
    id,
    userId,
    toJson(plan),
    source,
    Date.now(),
  );

  return { id, plan, source, createdAt: Date.now() };
}

/** Plan vigente (el más reciente) o null si nunca ha generado uno. */
export function findCurrent(tipo, userId) {
  const { tabla } = config(tipo);
  const row = db
    .prepare(`SELECT * FROM ${tabla} WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`)
    .get(userId);
  return toPlan(row);
}

/** Cuántos planes de ese tipo ha generado el usuario (para limitar abusos). */
export function countSince(tipo, userId, desdeMs) {
  const { tabla } = config(tipo);
  const row = db
    .prepare(`SELECT COUNT(*) AS total FROM ${tabla} WHERE user_id = ? AND created_at > ?`)
    .get(userId, desdeMs);
  return row?.total ?? 0;
}
