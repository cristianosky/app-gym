/**
 * Historial del asistente.
 *
 * Solo se guarda el texto: las fotos se le mandan a Gemini en el momento pero
 * no se almacenan, para no llenar la base de datos ni conservar imágenes de la
 * persona más tiempo del necesario. En el historial queda la marca `hasImage`.
 */
import { db } from '../db/index.js';
import { newId } from '../utils/id.js';

/** Cuántos mensajes previos se le mandan a Gemini como contexto. */
export const VENTANA_CONTEXTO = 20;

function toMessage(row) {
  return {
    id: row.id,
    role: row.role,
    content: row.content,
    hasImage: Boolean(row.has_image),
    createdAt: row.created_at,
  };
}

/**
 * Añade un mensaje al historial.
 * @param {'user'|'assistant'} role
 */
export function append(userId, { role, content, hasImage = false }) {
  const id = newId('msg');
  const ahora = Date.now();

  db.prepare(
    'INSERT INTO chat_messages (id, user_id, role, content, has_image, created_at) VALUES (?, ?, ?, ?, ?, ?)',
  ).run(id, userId, role, content, hasImage ? 1 : 0, ahora);

  return { id, role, content, hasImage, createdAt: ahora };
}

/** Historial completo en orden cronológico (para pintar la conversación). */
export function findAll(userId, limite = 100) {
  return db
    .prepare('SELECT * FROM chat_messages WHERE user_id = ? ORDER BY created_at DESC LIMIT ?')
    .all(userId, limite)
    .map(toMessage)
    .reverse();
}

/** Últimos mensajes en el formato 'role/content' que espera el prompt de Gemini. */
export function recentForPrompt(userId) {
  return db
    .prepare('SELECT * FROM chat_messages WHERE user_id = ? ORDER BY created_at DESC LIMIT ?')
    .all(userId, VENTANA_CONTEXTO)
    .reverse()
    .map((row) => ({ role: row.role, content: row.content }));
}

/** Borra toda la conversación del usuario. */
export function clear(userId) {
  db.prepare('DELETE FROM chat_messages WHERE user_id = ?').run(userId);
}
