/**
 * Cliente HTTP de la app.
 *
 * Centraliza la URL base, el token de sesión, los tiempos de espera y la
 * traducción de errores, para que las pantallas solo tengan que preocuparse
 * por mostrar `error.message`.
 */
import { API_URL, TIMEOUTS } from '../config';

/** Error con el mensaje que ya viene listo para mostrar. */
export class ApiError extends Error {
  constructor(message, { status = 0, campos = null, esRed = false } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.campos = campos;
    this.esRed = esRed;
  }
}

let tokenActual = null;

/** Guarda el token que se enviará en las siguientes peticiones. */
export function setToken(token) {
  tokenActual = token ?? null;
}

export function getToken() {
  return tokenActual;
}

/**
 * Hace una petición a la API.
 * @param {string} path ruta relativa, p. ej. '/api/routine'
 * @param {{method?: string, body?: object, timeout?: number, auth?: boolean}} opciones
 */
export async function request(path, { method = 'GET', body, timeout = TIMEOUTS.normal, auth = true } = {}) {
  // Se arma la URL con `new URL` en vez de concatenar: si la base o la ruta
  // vinieran mal, revienta aquí con un mensaje claro en lugar de mandar una
  // petición a una dirección absurda tipo "[object Object]/api/...".
  let url;
  try {
    // Se le quita la barra inicial a la ruta para que no borre un posible
    // prefijo de la URL base (p. ej. https://servidor.com/gym).
    url = new URL(String(path).replace(/^\/+/, ''), `${API_URL}/`).toString();
  } catch {
    throw new ApiError(
      `La dirección del servidor no es válida (base "${API_URL}", ruta "${path}"). ` +
        'Revise "extra.apiUrl" en app.json.',
    );
  }

  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), timeout);

  let respuesta;
  try {
    respuesta = await fetch(url, {
      method,
      signal: controlador.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(auth && tokenActual ? { Authorization: `Bearer ${tokenActual}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    clearTimeout(temporizador);
    if (error.name === 'AbortError') {
      throw new ApiError('La conexión tardó demasiado. Revise su internet e intente de nuevo.', { esRed: true });
    }
    throw new ApiError(
      `No pudimos conectarnos con el servidor.\n\nRevise que esté encendido y que el celular esté en la misma red (${API_URL}).`,
      { esRed: true },
    );
  } finally {
    clearTimeout(temporizador);
  }

  let datos = null;
  try {
    datos = await respuesta.json();
  } catch {
    // Respuesta sin JSON: se trata más abajo según el código.
  }

  if (!respuesta.ok) {
    throw new ApiError(datos?.error ?? `Error del servidor (${respuesta.status}).`, {
      status: respuesta.status,
      campos: datos?.campos ?? null,
    });
  }

  return datos;
}

export const api = {
  get: (path, opciones) => request(path, { ...opciones, method: 'GET' }),
  post: (path, body, opciones) => request(path, { ...opciones, method: 'POST', body }),
  put: (path, body, opciones) => request(path, { ...opciones, method: 'PUT', body }),
  patch: (path, body, opciones) => request(path, { ...opciones, method: 'PATCH', body }),
  delete: (path, opciones) => request(path, { ...opciones, method: 'DELETE' }),
};
