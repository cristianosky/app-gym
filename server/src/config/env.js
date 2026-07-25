/**
 * Carga y valida la configuración del servidor.
 *
 * Falla al arrancar (fail fast) si falta algo obligatorio, en vez de dejar
 * que el error aparezca a mitad de una petición del usuario.
 */
import 'dotenv/config';
import path from 'node:path';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),

  GEMINI_API_KEY: z.string().min(1, 'Falta GEMINI_API_KEY (ver server/.env.example)'),

  // Modelo por defecto para todo. Se puede afinar por función más abajo:
  // la rutina y el plan de comidas se generan pocas veces y conviene calidad;
  // el chat se usa mucho más, así que ahí un modelo más barato puede valer.
  GEMINI_MODEL: z.string().min(1).default('gemini-flash-latest'),
  GEMINI_MODEL_ROUTINE: z.string().min(1).optional(),
  GEMINI_MODEL_NUTRITION: z.string().min(1).optional(),
  GEMINI_MODEL_CHAT: z.string().min(1).optional(),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET debe tener al menos 32 caracteres'),
  JWT_EXPIRES_IN: z.string().min(1).default('30d'),

  DATABASE_PATH: z.string().min(1).default('./data/app.db'),
  CORS_ORIGIN: z.string().min(1).default('*'),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const detalle = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
  // eslint-disable-next-line no-console
  console.error(`\nConfiguración inválida en server/.env:\n${detalle}\n`);
  process.exit(1);
}

const raw = parsed.data;

export const env = Object.freeze({
  ...raw,
  isProduction: raw.NODE_ENV === 'production',
  /** Modelo a usar en cada función; si no se define uno, cae al general. */
  models: Object.freeze({
    routine: raw.GEMINI_MODEL_ROUTINE ?? raw.GEMINI_MODEL,
    nutrition: raw.GEMINI_MODEL_NUTRITION ?? raw.GEMINI_MODEL,
    chat: raw.GEMINI_MODEL_CHAT ?? raw.GEMINI_MODEL,
  }),
  databaseFile: path.isAbsolute(raw.DATABASE_PATH)
    ? raw.DATABASE_PATH
    : path.resolve(process.cwd(), raw.DATABASE_PATH),
  corsOrigins: raw.CORS_ORIGIN === '*' ? '*' : raw.CORS_ORIGIN.split(',').map((s) => s.trim()),
});
