/**
 * Registro de videos locales (sin internet) incluidos en la app.
 *
 * Para usar un video propio en un ejercicio:
 *   1. Copie su archivo .mp4 en  assets/videos/
 *   2. Regístrelo aquí con una clave corta, por ejemplo:
 *        'press-pecho': require('../../assets/videos/press-pecho.mp4'),
 *   3. En el catálogo del servidor (server/src/data/catalog/*.js) agregue al
 *      ejercicio el campo:  localVideo: 'press-pecho'
 *
 * Si un ejercicio tiene `localVideo`, la app reproduce ESE video (funciona sin
 * internet) en lugar del de YouTube.
 */
export const LOCAL_VIDEOS = {
  // 'press-hombro': require('../../assets/videos/press-hombro-mancuernas.mp4'),
};

/** Devuelve el require() del video local o null si no existe. */
export function getLocalVideo(key) {
  if (!key) return null;
  return LOCAL_VIDEOS[key] || null;
}
