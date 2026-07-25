/**
 * Registro de GIFs locales, generado por scripts/generar-gifs.mjs.
 * NO EDITE ESTE ARCHIVO A MANO: sus cambios se pierden al regenerarlo.
 *
 * Para agregar un GIF: copie <id-del-ejercicio>.gif en assets/gifs/ y
 * corra `npm run gifs`.
 */
export const LOCAL_GIFS = {

};

/** Devuelve el require() del GIF local o null si no existe. */
export function getLocalGif(id) {
  if (!id) return null;
  return LOCAL_GIFS[id] || null;
}
