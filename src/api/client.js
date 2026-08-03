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
 * Arma la URL absoluta a partir de la base y la ruta relativa.
 * Se usa `new URL` en vez de concatenar: si la base o la ruta vinieran mal,
 * revienta aquí con un mensaje claro en lugar de pedir "[object Object]/api/...".
 */
function construirUrl(path) {
  try {
    // Se le quita la barra inicial a la ruta para que no borre un posible
    // prefijo de la URL base (p. ej. https://servidor.com/gym).
    return new URL(String(path).replace(/^\/+/, ''), `${API_URL}/`).toString();
  } catch {
    throw new ApiError(
      `La dirección del servidor no es válida (base "${API_URL}", ruta "${path}"). ` +
        'Revise "extra.apiUrl" en app.json.',
    );
  }
}

/** `fetch` con tiempo de espera y traducción de los errores de red. */
async function fetchConTimeout(url, opciones, timeout) {
  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), timeout);
  try {
    return await fetch(url, { ...opciones, signal: controlador.signal });
  } catch (error) {
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
}

/** Lee la respuesta como JSON y lanza ApiError si el estado no es 2xx. */
async function procesarRespuesta(respuesta) {
  let datos = null;
  try {
    datos = await respuesta.json();
  } catch {
    // Respuesta sin JSON: se trata según el código.
  }

  if (!respuesta.ok) {
    throw new ApiError(datos?.error ?? `Error del servidor (${respuesta.status}).`, {
      status: respuesta.status,
      campos: datos?.campos ?? null,
    });
  }
  return datos;
}

/**
 * Hace una petición a la API.
 * @param {string} path ruta relativa, p. ej. '/api/routine'
 * @param {{method?: string, body?: object, timeout?: number, auth?: boolean}} opciones
 */
export async function request(path, { method = 'GET', body, timeout = TIMEOUTS.normal, auth = true } = {}) {
  const url = construirUrl(path);
  const respuesta = await fetchConTimeout(
    url,
    {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(auth && tokenActual ? { Authorization: `Bearer ${tokenActual}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    },
    timeout,
  );
  return procesarRespuesta(respuesta);
}

/**
 * Sube un archivo binario (p. ej. un video) como cuerpo crudo de la petición.
 * No usa JSON: el servidor lo recibe con `express.raw` y decide según el
 * Content-Type. Devuelve el JSON de respuesta.
 * @param {string} path ruta relativa, p. ej. '/api/media/gif'
 * @param {Blob|ArrayBuffer|Uint8Array} data contenido del archivo
 * @param {{contentType?: string, timeout?: number, auth?: boolean}} opciones
 */
export async function uploadBinary(path, data, { contentType = 'application/octet-stream', timeout = TIMEOUTS.upload, auth = true } = {}) {
  const url = construirUrl(path);
  const respuesta = await fetchConTimeout(
    url,
    {
      method: 'POST',
      headers: {
        'Content-Type': contentType,
        ...(auth && tokenActual ? { Authorization: `Bearer ${tokenActual}` } : {}),
      },
      body: data,
    },
    timeout,
  );
  return procesarRespuesta(respuesta);
}

export const api = {
  get: (path, opciones) => request(path, { ...opciones, method: 'GET' }),
  post: (path, body, opciones) => request(path, { ...opciones, method: 'POST', body }),
  put: (path, body, opciones) => request(path, { ...opciones, method: 'PUT', body }),
  patch: (path, body, opciones) => request(path, { ...opciones, method: 'PATCH', body }),
  delete: (path, opciones) => request(path, { ...opciones, method: 'DELETE' }),
};
