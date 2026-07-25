import { randomUUID } from 'node:crypto';

/**
 * Identificador único con prefijo legible, para saber de un vistazo a qué
 * tabla pertenece un id cuando aparece en un log.
 * @param {string} prefix p. ej. 'usr', 'rtn', 'msg'
 */
export function newId(prefix) {
  return `${prefix}_${randomUUID().replaceAll('-', '')}`;
}
