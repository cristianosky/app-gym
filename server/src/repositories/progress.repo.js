/**
 * Progreso diario: qué días completó, saltó o dejó a medias, y qué ejercicios
 * marcó dentro de cada día.
 *
 * La app funciona sin conexión guardando en el dispositivo y sincroniza contra
 * estas filas cuando hay internet.
 */
import { db, toJson, fromJson } from '../db/index.js';

function toDay(row) {
  return {
    dayKey: row.day_key,
    planDay: row.plan_day,
    status: row.status,
    completed: fromJson(row.completed, {}),
    updatedAt: row.updated_at,
  };
}

/** Todos los días registrados del usuario, del más reciente al más antiguo. */
export function findAll(userId) {
  return db
    .prepare('SELECT * FROM progress_days WHERE user_id = ? ORDER BY day_key DESC')
    .all(userId)
    .map(toDay);
}

/**
 * Inserta o actualiza varios días de una vez.
 * Gana el registro con `updated_at` más nuevo, así una sincronización vieja
 * nunca pisa un cambio reciente hecho desde otro dispositivo.
 */
export function upsertMany(userId, dias) {
  const sentencia = db.prepare(
    `INSERT INTO progress_days (user_id, day_key, plan_day, status, completed, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id, day_key) DO UPDATE SET
       plan_day   = excluded.plan_day,
       status     = excluded.status,
       completed  = excluded.completed,
       updated_at = excluded.updated_at
     WHERE excluded.updated_at >= progress_days.updated_at`,
  );

  const ahora = Date.now();
  db.exec('BEGIN');
  try {
    for (const dia of dias) {
      sentencia.run(userId, dia.dayKey, dia.planDay, dia.status, toJson(dia.completed ?? {}), ahora);
    }
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }

  return findAll(userId);
}

/** Borra el progreso completo (se usa al regenerar la rutina desde cero). */
export function clear(userId) {
  db.prepare('DELETE FROM progress_days WHERE user_id = ?').run(userId);
}
