/**
 * Error con código HTTP, para diferenciar los fallos esperados (validación,
 * credenciales, permisos) de los bugs reales. El manejador de errores
 * responde con `message` solo si el error es de este tipo; cualquier otro se
 * registra en el servidor y al usuario le llega un mensaje genérico.
 */
export class AppError extends Error {
  /**
   * @param {number} status código HTTP
   * @param {string} message mensaje apto para mostrarle a la persona
   * @param {object} [extra] datos adicionales para el cliente (p. ej. `campos`)
   */
  constructor(status, message, extra = undefined) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.extra = extra;
  }
}

export const badRequest = (msg, extra) => new AppError(400, msg, extra);
export const unauthorized = (msg = 'Sesión no válida. Vuelva a iniciar sesión.') => new AppError(401, msg);
export const forbidden = (msg = 'No tiene permiso para hacer esto.') => new AppError(403, msg);
export const notFound = (msg = 'No encontramos lo que busca.') => new AppError(404, msg);
export const conflict = (msg, extra) => new AppError(409, msg, extra);
export const tooManyRequests = (msg, extra) => new AppError(429, msg, extra);
export const serviceUnavailable = (msg) => new AppError(503, msg);
