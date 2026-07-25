/**
 * Dirección del servidor.
 *
 * En desarrollo se deduce sola: Expo sabe en qué host está sirviendo el bundle
 * y el servidor vive en esa misma máquina. Así el celular se conecta sin tener
 * que escribir la IP a mano cada vez que se cambie de red.
 *
 * Para apuntar a un servidor publicado, ponga la URL en app.json:
 *   "extra": { "apiUrl": "https://mi-servidor.com" }
 *
 * Todo lo que viene de `expo-constants` o de `app.json` se trata como dato no
 * confiable: según la plataforma y la versión de Expo, esos campos pueden
 * llegar vacíos, con otro tipo o incluso como objeto. Si no se valida, la app
 * termina pidiendo URLs como "[object Object]/api/..." sin ninguna pista de por
 * qué. Por eso aquí se comprueba cada valor y se avisa en la consola.
 */
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const PUERTO_POR_DEFECTO = 4000;

/** Devuelve el valor solo si es una cadena con contenido; si no, null. */
function comoTexto(valor) {
  return typeof valor === 'string' && valor.trim().length > 0 ? valor.trim() : null;
}

/** Devuelve el valor solo si es un puerto válido; si no, null. */
function comoPuerto(valor) {
  const numero = Number(valor);
  return Number.isInteger(numero) && numero > 0 && numero < 65536 ? numero : null;
}

const extra = Constants.expoConfig?.extra ?? {};
const PUERTO = comoPuerto(extra.apiPort) ?? PUERTO_POR_DEFECTO;

/**
 * Host donde corre el bundler de Expo (sin puerto).
 * `hostUri` viene como "192.168.1.7:8081"; nos interesa solo la parte del host.
 */
function hostDelBundler() {
  const candidatos = [
    Constants.expoConfig?.hostUri,
    Constants.expoGoConfig?.debuggerHost,
    Constants.manifest2?.extra?.expoGo?.debuggerHost,
  ];

  for (const candidato of candidatos) {
    const texto = comoTexto(candidato);
    if (!texto) continue;

    const host = texto.split(':')[0];
    if (host && host !== 'localhost' && host !== '127.0.0.1') return host;
  }
  return null;
}

/** Host desde el que se abrió la app en el navegador (solo web). */
function hostDelNavegador() {
  if (Platform.OS !== 'web') return null;
  if (typeof window === 'undefined') return null;
  return comoTexto(window.location?.hostname);
}

function resolverUrl() {
  // 1. URL explícita en app.json: es la que manda.
  const configurada = comoTexto(extra.apiUrl);
  if (configurada) return configurada.replace(/\/+$/, '');

  // 2. La IP de la máquina donde corre Expo (el caso normal en el celular).
  const host = hostDelBundler() ?? hostDelNavegador();
  if (host) return `http://${host}:${PUERTO}`;

  // 3. Emulador de Android: 10.0.2.2 es el localhost de la máquina anfitriona.
  if (Platform.OS === 'android') return `http://10.0.2.2:${PUERTO}`;

  return `http://localhost:${PUERTO}`;
}

/**
 * Comprueba que lo resuelto sea de verdad una URL absoluta.
 * Si no lo es, avisa fuerte y usa un valor que al menos no rompa el `fetch`.
 */
function validar(url) {
  if (typeof url === 'string' && /^https?:\/\/[^/\s]+/.test(url)) return url;

  const respaldo = `http://localhost:${PUERTO}`;
  console.error(
    `[config] La URL del servidor quedó inválida (${JSON.stringify(url)}). ` +
      `Se usará ${respaldo}. Revise "extra.apiUrl" en app.json.`,
  );
  return respaldo;
}

export const API_URL = validar(resolverUrl());

// Se imprime una vez al arrancar: cuando algo no conecta, esto es lo primero
// que hay que mirar.
if (__DEV__) {
  console.log(`[config] Servidor: ${API_URL}`);
}

/** Cuánto espera la app antes de dar por perdida una petición (ms). */
export const TIMEOUTS = {
  normal: 15_000,
  // Generar rutina o plan de comidas implica esperar a la IA.
  ia: 90_000,
};
