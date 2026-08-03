/**
 * Límites de peticiones.
 *
 * Dos frentes distintos:
 *   - Ingreso: frena la fuerza bruta contra el PIN desde una misma IP
 *     (complementa el bloqueo por usuario de `auth.service.js`).
 *   - IA: cada llamada a Gemini cuesta dinero, así que se limita por usuario.
 */
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { env } from '../config/env.js';

const mensaje = (texto) => ({ ok: false, error: texto });

/**
 * Identifica por usuario autenticado; si no lo hay, por IP.
 * `ipKeyGenerator` normaliza las IPv6 al bloque /64: sin eso, alguien con un
 * rango IPv6 podría saltarse el límite cambiando de dirección en cada petición.
 */
const porUsuarioOIp = (req) => req.user?.id ?? ipKeyGenerator(req.ip);

export const loginLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: env.isProduction ? 20 : 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: mensaje('Demasiados intentos desde esta conexión. Espere unos minutos.'),
});

export const registerLimiter = rateLimit({
  windowMs: 60 * 60_000,
  limit: env.isProduction ? 5 : 50,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: mensaje('Se crearon muchas cuentas desde esta conexión. Intente más tarde.'),
});

/** Generar rutina o plan de comidas: caro, se limita fuerte. */
export const generateLimiter = rateLimit({
  windowMs: 60 * 60_000,
  limit: env.isProduction ? 10 : 100,
  keyGenerator: porUsuarioOIp,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: mensaje('Ha generado planes muchas veces seguidas. Espere un rato antes de volver a intentarlo.'),
});

/** Subir videos para convertir a GIF: la conversión con ffmpeg cuesta CPU. */
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: env.isProduction ? 20 : 200,
  keyGenerator: porUsuarioOIp,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: mensaje('Subió muchos videos seguidos. Espere un momento antes de intentar de nuevo.'),
});

/** Chat: más permisivo, pero con techo. */
export const chatLimiter = rateLimit({
  windowMs: 10 * 60_000,
  limit: env.isProduction ? 40 : 200,
  keyGenerator: porUsuarioOIp,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: mensaje('Va muy rápido con el asistente. Espere un momento y siga preguntando.'),
});
