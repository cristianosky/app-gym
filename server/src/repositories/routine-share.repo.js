/**
 * Solicitudes para compartir la rutina vigente con otro usuario.
 *
 * Se guarda una foto del plan tal como está al compartirlo (no una
 * referencia viva a la rutina del remitente).
 */
import { db, toJson, fromJson } from '../db/index.js';
import { newId } from '../utils/id.js';

function toShare(row) {
  if (!row) return null;
  return {
    id: row.id,
    fromUserId: row.from_user_id,
    toUserId: row.to_user_id,
    plan: fromJson(row.plan),
    status: row.status,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at,
    fromUsername: row.from_username,
    fromName: row.from_name,
  };
}

/**
 * Crea una solicitud pendiente. Si ya había una pendiente del mismo
 * remitente hacia el mismo destinatario, la reemplaza en vez de acumular
 * duplicados.
 */
export function create(fromUserId, toUserId, plan) {
  db.prepare(
    `DELETE FROM routine_shares WHERE from_user_id = ? AND to_user_id = ? AND status = 'pending'`,
  ).run(fromUserId, toUserId);

  const id = newId('shr');
  db.prepare(
    `INSERT INTO routine_shares (id, from_user_id, to_user_id, plan, status, created_at)
     VALUES (?, ?, ?, ?, 'pending', ?)`,
  ).run(id, fromUserId, toUserId, toJson(plan), Date.now());

  return findById(id);
}

export function findById(id) {
  const row = db.prepare('SELECT * FROM routine_shares WHERE id = ?').get(id);
  return toShare(row);
}

/** Solicitudes pendientes recibidas por un usuario, con quién las envió. */
export function findPendingFor(userId) {
  const rows = db
    .prepare(
      `SELECT rs.*, u.username AS from_username, u.name AS from_name
       FROM routine_shares rs
       JOIN users u ON u.id = rs.from_user_id
       WHERE rs.to_user_id = ? AND rs.status = 'pending'
       ORDER BY rs.created_at DESC`,
    )
    .all(userId);
  return rows.map(toShare);
}

export function resolve(id, status) {
  db.prepare('UPDATE routine_shares SET status = ?, resolved_at = ? WHERE id = ?').run(
    status,
    Date.now(),
    id,
  );
}
