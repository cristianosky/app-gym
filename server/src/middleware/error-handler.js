/**
 * Manejo centralizado de errores y rutas inexistentes.
 *
 * Regla: al cliente solo le llega el mensaje de los errores que nosotros
 * creamos a propósito (AppError). Cualquier otro se registra completo en el
 * servidor y afuera sale un mensaje genérico, para no filtrar rutas de
 * ficheros, consultas SQL ni claves.
 */
import { AppError } from '../utils/app-error.js';
import { env } from '../config/env.js';

export function notFoundHandler(req, _res, next) {
  next(new AppError(404, `No existe la ruta ${req.method} ${req.path}.`));
}

// Express identifica el manejador de errores por sus cuatro parámetros.
// eslint-disable-next-line no-unused-vars
export function errorHandler(error, req, res, _next) {
  const esEsperado = error instanceof AppError || error?.name === 'AppError';
  const status = esEsperado ? error.status : 500;

  if (!esEsperado) {
    // eslint-disable-next-line no-console
    console.error(`[error] ${req.method} ${req.path}`, error);
  }

  const cuerpo = {
    ok: false,
    error: esEsperado ? error.message : 'Algo falló de nuestro lado. Intente de nuevo en un momento.',
  };

  if (esEsperado && error.extra) Object.assign(cuerpo, error.extra);
  if (!esEsperado && !env.isProduction) cuerpo.debug = error?.message;

  res.status(status).json(cuerpo);
}

/**
 * Envuelve un manejador async para que los rechazos de promesa lleguen al
 * manejador de errores en vez de quedar sin capturar.
 */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
