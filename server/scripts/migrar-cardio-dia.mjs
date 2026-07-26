/**
 * Migración puntual: reemplaza el calentamiento/cierre genérico de las
 * rutinas ya guardadas por el bloque de cardio específico de cada día de la
 * semana (ver `warmupStretchForDay` en `../src/data/catalog.js`).
 *
 * Solo toca la rutina VIGENTE de cada usuario (la fila más reciente por
 * user_id) — el histórico de regeneraciones se deja tal cual.
 *
 * Uso: node scripts/migrar-cardio-dia.mjs
 */
import { db, toJson, fromJson } from '../src/db/index.js';
import { warmupStretchForDay } from '../src/data/catalog.js';

function bloque(block, reps) {
  return { ...block, sets: 1, reps, rest: 0, note: null };
}

const filas = db
  .prepare(
    `SELECT r.* FROM routines r
     INNER JOIN (
       SELECT user_id, MAX(created_at) AS max_created
       FROM routines GROUP BY user_id
     ) latest ON r.user_id = latest.user_id AND r.created_at = latest.max_created`,
  )
  .all();

let usuariosActualizados = 0;
let diasActualizados = 0;

for (const fila of filas) {
  const plan = fromJson(fila.plan);
  if (!plan?.dias) continue;

  let cambio = false;

  const dias = plan.dias.map((dia) => {
    if (dia.rest || !dia.ejercicios?.length) return dia;

    const primero = dia.ejercicios[0];
    const ultimo = dia.ejercicios[dia.ejercicios.length - 1];
    if (!primero?.isWarmup || !ultimo?.isStretch) return dia;

    const { warmup, stretch } = warmupStretchForDay(dia.dia);
    const nuevoPrimero = bloque(warmup.block, warmup.reps);
    const nuevoUltimo = bloque(stretch.block, stretch.reps);

    if (primero.id === nuevoPrimero.id && primero.reps === nuevoPrimero.reps
        && ultimo.id === nuevoUltimo.id && ultimo.reps === nuevoUltimo.reps) {
      return dia;
    }

    cambio = true;
    diasActualizados++;
    const medio = dia.ejercicios.slice(1, -1);
    return { ...dia, ejercicios: [nuevoPrimero, ...medio, nuevoUltimo] };
  });

  if (!cambio) continue;

  db.prepare('UPDATE routines SET plan = ? WHERE id = ?').run(toJson({ ...plan, dias }), fila.id);
  usuariosActualizados++;
}

console.log(`Rutinas vigentes revisadas: ${filas.length}`);
console.log(`Usuarios actualizados: ${usuariosActualizados}`);
console.log(`Días actualizados: ${diasActualizados}`);
