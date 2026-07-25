/**
 * Textos que rotan en la app (día de descanso, ánimo tras completar).
 * Se guardan aquí para que las pantallas queden limpias.
 */

export const MENSAJES_DESCANSO = [
  'El músculo crece cuando descansa. Hoy su trabajo es recuperarse.',
  'Descansar también es entrenar. Duerma bien, tome agua y coma su proteína.',
  'Hoy toca recargar. Mañana vuelve con más.',
  'La recuperación es parte del progreso. Disfrute su día libre.',
  'Sin descanso no hay cambio. Hoy dese permiso de parar.',
  'Su cuerpo está reparando lo que rompió esta semana. Déjelo trabajar.',
];

export const MENSAJES_COMPLETADO = [
  '¡Eso es! Un día menos de excusas.',
  '¡Bien ahí! Así se construye.',
  'Listo el pollo. Nos vemos mañana.',
  '¡Juicioso! Eso se va a notar.',
  'Otro día cumplido. Siga así.',
];

/** Escoge un mensaje del arreglo según la fecha, para que cambie cada día. */
export function mensajeDelDia(lista, fecha = new Date()) {
  return lista[fecha.getDate() % lista.length];
}
