/**
 * Acceso a la tabla `users`. Ningún otro módulo escribe SQL de usuarios.
 */
import { db, toJson, fromJson } from '../db/index.js';
import { newId } from '../utils/id.js';

/** Convierte una fila cruda de SQLite al objeto que usa la aplicación. */
function toUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    name: row.name,
    pinHash: row.pin_hash,
    pinSalt: row.pin_salt,
    failedLogins: row.failed_logins,
    lockedUntil: row.locked_until,
    profile: fromJson(row.profile, {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Versión sin datos sensibles, la única que sale hacia el cliente. */
export function toPublicUser(user) {
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    profile: user.profile,
    createdAt: user.createdAt,
  };
}

const selectByUsername = db.prepare('SELECT * FROM users WHERE username = ?');
const selectById = db.prepare('SELECT * FROM users WHERE id = ?');

/** El nombre de usuario se guarda y se busca siempre en minúsculas. */
export const normalizeUsername = (username) => String(username ?? '').trim().toLowerCase();

export function findByUsername(username) {
  return toUser(selectByUsername.get(normalizeUsername(username)));
}

export function findById(id) {
  return toUser(selectById.get(id));
}

export function usernameExists(username) {
  const row = db.prepare('SELECT 1 FROM users WHERE username = ?').get(normalizeUsername(username));
  return Boolean(row);
}

/**
 * Crea un usuario nuevo.
 * @param {{username: string, name: string, pinHash: string, pinSalt: string, profile: object}} datos
 */
export function create({ username, name, pinHash, pinSalt, profile }) {
  const now = Date.now();
  const id = newId('usr');

  db.prepare(
    `INSERT INTO users (id, username, name, pin_hash, pin_salt, profile, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, normalizeUsername(username), name.trim(), pinHash, pinSalt, toJson(profile), now, now);

  return findById(id);
}

/** Reemplaza el perfil completo (peso, altura, objetivos, días…). */
export function updateProfile(id, profile) {
  db.prepare('UPDATE users SET profile = ?, updated_at = ? WHERE id = ?').run(
    toJson(profile),
    Date.now(),
    id,
  );
  return findById(id);
}

/** Suma un intento fallido y devuelve cuántos lleva. */
export function registerFailedLogin(id, lockedUntil) {
  db.prepare(
    'UPDATE users SET failed_logins = failed_logins + 1, locked_until = ?, updated_at = ? WHERE id = ?',
  ).run(lockedUntil ?? null, Date.now(), id);
  return findById(id).failedLogins;
}

/** Borra el contador de intentos tras un ingreso correcto. */
export function clearFailedLogins(id) {
  db.prepare(
    'UPDATE users SET failed_logins = 0, locked_until = NULL, updated_at = ? WHERE id = ?',
  ).run(Date.now(), id);
}

/** Cambia el PIN y limpia el bloqueo. */
export function updatePin(id, { pinHash, pinSalt }) {
  db.prepare(
    `UPDATE users SET pin_hash = ?, pin_salt = ?, failed_logins = 0, locked_until = NULL, updated_at = ?
     WHERE id = ?`,
  ).run(pinHash, pinSalt, Date.now(), id);
}
