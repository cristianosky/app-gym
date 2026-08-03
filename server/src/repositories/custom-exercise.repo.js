/**
 * Ejercicios propios: los que cada persona crea a mano (con su video) para
 * armar la rutina manualmente. Viven aparte del catálogo cerrado y son
 * privados de quien los crea.
 */
import { db } from '../db/index.js';
import { newId } from '../utils/id.js';

function toExercise(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    group: row.muscle_group,
    equipment: row.equipment,
    gifUrl: row.gif_url,
    createdAt: row.created_at,
  };
}

export function create({ userId, name, group, equipment, gifUrl }) {
  const id = newId('cex');
  db.prepare(
    `INSERT INTO custom_exercises (id, user_id, name, muscle_group, equipment, gif_url, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, userId, name, group, equipment, gifUrl, Date.now());
  return findById(id);
}

export function findById(id) {
  const row = db.prepare('SELECT * FROM custom_exercises WHERE id = ?').get(id);
  return toExercise(row);
}

/** Igual que `findById`, pero solo devuelve algo si además es del dueño indicado. */
export function findByIdForUser(id, userId) {
  const row = db.prepare('SELECT * FROM custom_exercises WHERE id = ? AND user_id = ?').get(id, userId);
  return toExercise(row);
}

export function listForUser(userId) {
  const rows = db
    .prepare('SELECT * FROM custom_exercises WHERE user_id = ? ORDER BY created_at DESC')
    .all(userId);
  return rows.map(toExercise);
}
