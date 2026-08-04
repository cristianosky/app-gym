/**
 * Reglas sobre los días de progreso que no dependen de React.
 *
 * Se separan del store para poder razonarlas (y probarlas) sueltas: son las
 * que deciden si un día quedó realmente a medias o si solo se olvidó cerrarlo.
 */
import { daysBetween } from './dates';

/** Fracción de ejercicios a partir de la cual se asume que sí entrenó. */
export const UMBRAL_OLVIDO = 0.5;

/**
 * Cuántos días hacia atrás se revisan. Acotado a propósito: al reinstalar la
 * app o entrar tras un parón largo no tiene por qué reescribirse el historial
 * entero, solo lo reciente.
 */
export const VENTANA_OLVIDO = 14;

/**
 * Días ya pasados que quedaron en curso pero con más de la mitad de los
 * ejercicios marcados: casi con seguridad se entrenó y se olvidó cerrarlos.
 *
 * @param {Record<string, {planDay:number,status:string,completed:Object}>} progreso
 * @param {(planDay:number) => {rest:boolean,exercises:Array}|null} planDe rutina de ese día
 * @param {string} hoyKey clave del día en curso; hoy y el futuro nunca cuentan
 * @returns {string[]} claves de día, de la más antigua a la más reciente
 */
export function diasOlvidados(progreso, planDe, hoyKey, ventana = VENTANA_OLVIDO) {
  const olvidados = [];

  for (const [key, dia] of Object.entries(progreso ?? {})) {
    // El día de hoy sigue abierto: todavía puede terminarlo a mano.
    if (key >= hoyKey) continue;
    // 'completed', 'skipped' y 'rest' ya son decisiones tomadas, no se tocan.
    if (dia?.status !== 'active') continue;
    if (daysBetween(hoyKey, key) > ventana) continue;

    const plan = planDe(dia.planDay);
    if (!plan || plan.rest) continue;

    const ejercicios = plan.exercises ?? [];
    if (ejercicios.length === 0) continue;

    // Solo cuentan los ejercicios que siguen en el plan: al regenerar la
    // rutina quedan marcas de ejercicios que ya no existen, y esas no deben
    // inflar el conteo.
    const marcados = dia.completed ?? {};
    const hechos = ejercicios.filter((ex) => marcados[ex.id]).length;

    if (hechos > ejercicios.length * UMBRAL_OLVIDO) olvidados.push(key);
  }

  return olvidados.sort();
}
