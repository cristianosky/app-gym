/**
 * Conexión SQLite y migraciones.
 *
 * Usa el módulo `node:sqlite` incluido en Node (>=22.5) para no depender de
 * módulos nativos que hay que compilar en cada máquina. Toda la aplicación
 * accede a la base de datos a través de este módulo, así que cambiar de motor
 * solo implica reescribir este fichero y los repositorios.
 */
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { env } from '../config/env.js';

fs.mkdirSync(path.dirname(env.databaseFile), { recursive: true });

export const db = new DatabaseSync(env.databaseFile);

db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

/**
 * Migraciones incrementales. Añadir siempre al final, nunca modificar una
 * existente: `user_version` marca cuántas se han aplicado ya.
 */
const MIGRATIONS = [
  `
  CREATE TABLE users (
    id             TEXT PRIMARY KEY,
    username       TEXT NOT NULL UNIQUE,
    name           TEXT NOT NULL,
    pin_hash       TEXT NOT NULL,
    pin_salt       TEXT NOT NULL,
    failed_logins  INTEGER NOT NULL DEFAULT 0,
    locked_until   INTEGER,
    profile        TEXT NOT NULL,
    created_at     INTEGER NOT NULL,
    updated_at     INTEGER NOT NULL
  );

  CREATE TABLE routines (
    id          TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan        TEXT NOT NULL,
    source      TEXT NOT NULL,
    created_at  INTEGER NOT NULL
  );
  CREATE INDEX idx_routines_user ON routines(user_id, created_at DESC);

  CREATE TABLE nutrition_plans (
    id          TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan        TEXT NOT NULL,
    source      TEXT NOT NULL,
    created_at  INTEGER NOT NULL
  );
  CREATE INDEX idx_nutrition_user ON nutrition_plans(user_id, created_at DESC);

  CREATE TABLE progress_days (
    user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    day_key     TEXT NOT NULL,
    plan_day    INTEGER NOT NULL,
    status      TEXT NOT NULL,
    completed   TEXT NOT NULL,
    updated_at  INTEGER NOT NULL,
    PRIMARY KEY (user_id, day_key)
  );

  CREATE TABLE chat_messages (
    id          TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role        TEXT NOT NULL,
    content     TEXT NOT NULL,
    has_image   INTEGER NOT NULL DEFAULT 0,
    created_at  INTEGER NOT NULL
  );
  CREATE INDEX idx_chat_user ON chat_messages(user_id, created_at);
  `,
  `
  CREATE TABLE routine_shares (
    id            TEXT PRIMARY KEY,
    from_user_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan          TEXT NOT NULL,
    status        TEXT NOT NULL DEFAULT 'pending',
    created_at    INTEGER NOT NULL,
    resolved_at   INTEGER
  );
  CREATE INDEX idx_routine_shares_to ON routine_shares(to_user_id, status);
  `,
  `
  CREATE TABLE custom_exercises (
    id            TEXT PRIMARY KEY,
    user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name          TEXT NOT NULL,
    muscle_group  TEXT NOT NULL,
    equipment     TEXT NOT NULL,
    gif_url       TEXT NOT NULL,
    created_at    INTEGER NOT NULL
  );
  CREATE INDEX idx_custom_exercises_user ON custom_exercises(user_id, created_at DESC);
  `,
];

function runMigrations() {
  const { user_version: current } = db.prepare('PRAGMA user_version').get();

  for (let version = current; version < MIGRATIONS.length; version++) {
    db.exec('BEGIN');
    try {
      db.exec(MIGRATIONS[version]);
      db.exec(`PRAGMA user_version = ${version + 1}`);
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      throw new Error(`Migración ${version + 1} falló: ${error.message}`, { cause: error });
    }
  }
}

runMigrations();

/** Serializa un objeto a JSON para guardarlo en una columna TEXT. */
export const toJson = (value) => JSON.stringify(value ?? null);

/** Lee una columna TEXT con JSON, devolviendo `fallback` si está corrupta. */
export function fromJson(value, fallback = null) {
  if (value == null) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}
