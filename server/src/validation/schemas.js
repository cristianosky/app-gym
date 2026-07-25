/**
 * Esquemas de validación de todo lo que entra por la API.
 * Nada llega a la base de datos ni a la IA sin pasar por aquí.
 */
import { z } from 'zod';
import { GOAL_IDS, LEVEL_IDS, ENVIRONMENT_IDS, SEX_IDS, DIET_IDS } from '../data/options.js';
import { badRequest } from '../utils/app-error.js';

const texto = (max) => z.string().trim().max(max);

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, 'El usuario debe tener al menos 3 caracteres.')
  .max(20, 'El usuario no puede pasar de 20 caracteres.')
  .regex(/^[a-z0-9._-]+$/, 'Use solo letras, números, punto, guion o guion bajo.');

export const pinSchema = z
  .string()
  .regex(/^\d{4}$/, 'El PIN debe ser de 4 dígitos.');

/** Datos físicos y preferencias. Es lo que alimenta a la IA. */
export const profileSchema = z.object({
  weightKg: z.coerce
    .number()
    .min(30, 'El peso debe estar entre 30 y 300 kg.')
    .max(300, 'El peso debe estar entre 30 y 300 kg.'),
  heightCm: z.coerce
    .number()
    .int()
    .min(120, 'La estatura debe estar entre 120 y 230 cm.')
    .max(230, 'La estatura debe estar entre 120 y 230 cm.'),
  age: z.coerce
    .number()
    .int()
    .min(14, 'La edad debe estar entre 14 y 90 años.')
    .max(90, 'La edad debe estar entre 14 y 90 años.'),
  sex: z.enum(SEX_IDS),
  level: z.enum(LEVEL_IDS),
  environment: z.enum(ENVIRONMENT_IDS),

  goals: z
    .array(z.enum(GOAL_IDS))
    .min(1, 'Escoja al menos un objetivo.')
    .max(3, 'Máximo 3 objetivos: si escoge muchos, la rutina pierde foco.'),
  goalNote: texto(300).optional().default(''),

  trainingDays: z
    .array(z.number().int().min(1).max(7))
    .min(1, 'Escoja al menos un día para entrenar.')
    .max(7)
    .transform((dias) => [...new Set(dias)].sort((a, b) => a - b)),

  sessionMinutes: z.coerce.number().int().min(20).max(150).optional().default(60),

  injuries: texto(300).optional().default(''),
  diet: z.array(z.enum(DIET_IDS)).max(6).optional().default([]),
  foodNote: texto(300).optional().default(''),
});

/** Días de entrenamiento nuevos, para sincronizar los descansos de la rutina vigente. */
export const routineDaysSchema = z.object({
  trainingDays: profileSchema.shape.trainingDays,
});

/** Nuevo orden de las rutinas de entreno dentro de la semana vigente. */
export const routineOrderSchema = z.object({
  order: z.array(z.number().int().min(1).max(7)).min(1).max(7),
});

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Escriba su nombre.')
    .max(40, 'El nombre no puede pasar de 40 caracteres.'),
  username: usernameSchema,
  pin: pinSchema,
  profile: profileSchema,
});

export const loginSchema = z.object({
  username: usernameSchema,
  pin: pinSchema,
});

/** Paso previo del login: comprobar que el usuario existe antes de pedir el PIN. */
export const checkUsernameSchema = z.object({ username: usernameSchema });

export const changePinSchema = z.object({
  currentPin: pinSchema,
  newPin: pinSchema,
});

/** Estado de un día de entrenamiento que la app sincroniza con el servidor. */
export const progressDaySchema = z.object({
  dayKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha con formato YYYY-MM-DD.'),
  planDay: z.number().int().min(1).max(7),
  status: z.enum(['active', 'completed', 'skipped', 'rest']),
  completed: z.record(z.string(), z.literal(true)).default({}),
});

export const progressSyncSchema = z.object({
  days: z.array(progressDaySchema).max(400),
});

/**
 * Imagen adjunta al chat, en base64.
 *
 * El tope por imagen (~2,8 MB de base64 ≈ 2 MB de archivo) se escogió para que
 * 3 imágenes quepan de sobra en el límite de 12 MB del cuerpo de la petición
 * (ver `app.js`). La app además baja la calidad antes de enviar, así que en la
 * práctica cada foto pesa bastante menos.
 */
const imageSchema = z.object({
  mediaType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  data: z.string().min(1).max(2_800_000, 'La foto es muy pesada. Use una de menos de 2 MB.'),
});

export const chatSchema = z.object({
  message: z
    .string()
    .trim()
    .max(2000, 'El mensaje es muy largo.')
    .optional()
    .default(''),
  images: z.array(imageSchema).max(3, 'Máximo 3 imágenes por mensaje.').optional().default([]),
}).refine((v) => v.message.length > 0 || v.images.length > 0, {
  message: 'Escriba algo o adjunte una foto.',
  path: ['message'],
});

/**
 * Valida un cuerpo de petición y devuelve los datos ya normalizados.
 * Lanza un AppError 400 con el detalle por campo si algo no cuadra.
 */
export function parseBody(schema, body) {
  const result = schema.safeParse(body);
  if (result.success) return result.data;

  const campos = {};
  for (const issue of result.error.issues) {
    const clave = issue.path.join('.') || 'general';
    if (!campos[clave]) campos[clave] = issue.message;
  }

  const primerMensaje = Object.values(campos)[0] ?? 'Revise los datos enviados.';
  throw badRequest(primerMensaje, { campos });
}
