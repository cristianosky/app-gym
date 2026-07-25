/**
 * Registro de videos locales (offline) incluidos en la app.
 *
 * Para usar un video propio en un ejercicio:
 *   1. Copia tu archivo .mp4 en  assets/videos/
 *   2. Regístralo aquí con una clave corta, p. ej.:
 *        'press-pecho': require('../../assets/videos/press-pecho.mp4'),
 *   3. En src/data/routine.js, agrega al ejercicio:  localVideo: 'press-pecho'
 *
 * Si un ejercicio tiene `localVideo`, la app reproduce ESE video (sin internet)
 * en lugar del de YouTube.
 */
export const LOCAL_VIDEOS = {
  // Press de hombro con mancuernas (video generado por Cristian)
  'press-hombro': require('../../assets/videos/press-hombro-mancuernas.mp4'),
};

/** Devuelve el require() del video local o null si no existe. */
export function getLocalVideo(key) {
  if (!key) return null;
  return LOCAL_VIDEOS[key] || null;
}
