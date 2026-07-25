/**
 * Cliente de la API de Gemini (Google GenAI).
 *
 * Un solo cliente para toda la app. El SDK ya reintenta automáticamente los
 * errores transitorios (429 y 5xx) en las llamadas a `generateContent`.
 */
import { GoogleGenAI, ApiError } from '@google/genai';
import { env } from '../config/env.js';
import { serviceUnavailable } from '../utils/app-error.js';

export const genai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

/**
 * Modelo de cada función. Se configuran en el .env; si no se especifican, las
 * tres usan `GEMINI_MODEL`.
 */
export const MODELS = env.models;

/**
 * Traduce un fallo de la API de Gemini a un error entendible para la persona.
 * Devuelve siempre un AppError; el detalle técnico queda en el log.
 */
export function toFriendlyAiError(error, accion) {
  // eslint-disable-next-line no-console
  console.error(`[ia] Falló ${accion}:`, error?.status ?? '', error?.message ?? error);

  if (error instanceof ApiError) {
    if (error.status === 429) {
      return serviceUnavailable('El asistente está muy solicitado ahora. Intente en un minuto.');
    }
    if (error.status === 401 || error.status === 403) {
      return serviceUnavailable('La app no tiene bien configurada la clave del asistente.');
    }
    if (error.status >= 500) {
      return serviceUnavailable('El asistente no pudo responder. Intente de nuevo.');
    }
  }
  if (error?.name === 'TypeError' || error?.cause) {
    return serviceUnavailable('No pudimos conectarnos con el asistente. Revise su conexión.');
  }
  return serviceUnavailable('El asistente no pudo responder. Intente de nuevo.');
}

/**
 * ¿Se cortó la respuesta por un filtro de seguridad?
 * Con esto, no bloqueado, cuenta como "terminó bien" (STOP o MAX_TOKENS).
 */
export function fueBloqueadaPorSeguridad(response) {
  const razon = response?.candidates?.[0]?.finishReason;
  return razon === 'SAFETY' || razon === 'RECITATION' || razon === 'PROHIBITED_CONTENT' || razon === 'BLOCKLIST';
}

/**
 * Extrae el texto de una respuesta de Gemini.
 * Devuelve null si no vino texto (bloqueada o vacía).
 */
export function extractText(response) {
  const texto = response?.text;
  return typeof texto === 'string' && texto.trim().length > 0 ? texto.trim() : null;
}
