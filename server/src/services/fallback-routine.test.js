/**
 * Pruebas de la rutina de respaldo.
 *
 * Es la red de seguridad cuando la IA falla, así que tiene que dar un plan
 * usable para cualquier combinación de días, nivel, objetivo y entorno.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildFallbackRoutine } from './fallback-routine.js';
import { isValidExerciseId, getExercise } from '../data/catalog.js';

const perfilBase = {
  weightKg: 82,
  heightCm: 175,
  age: 28,
  sex: 'hombre',
  level: 'principiante',
  environment: 'gimnasio',
  goals: ['recomposicion'],
  trainingDays: [1, 3, 5],
  sessionMinutes: 60,
};

test('siempre devuelve los 7 días en orden', () => {
  const plan = buildFallbackRoutine(perfilBase);

  assert.equal(plan.dias.length, 7);
  assert.deepEqual(plan.dias.map((d) => d.dia), [1, 2, 3, 4, 5, 6, 7]);
});

test('respeta exactamente los días escogidos', () => {
  for (const dias of [[1], [2, 5], [1, 3, 5], [1, 2, 4, 6], [1, 2, 3, 4, 5], [1, 2, 3, 4, 5, 6], [1, 2, 3, 4, 5, 6, 7]]) {
    const plan = buildFallbackRoutine({ ...perfilBase, trainingDays: dias });

    const entrenados = plan.dias.filter((d) => !d.descanso).map((d) => d.dia);
    assert.deepEqual(entrenados, dias, `no coincide para ${dias}`);

    const descansos = plan.dias.filter((d) => d.descanso);
    for (const dia of descansos) {
      assert.equal(dia.ejercicios.length, 0, 'un día de descanso no debe traer ejercicios');
      assert.equal(dia.acento, 'rest');
    }
  }
});

test('todos los ejercicios existen en el catálogo', () => {
  for (const entorno of ['gimnasio', 'casa', 'peso-corporal']) {
    const plan = buildFallbackRoutine({ ...perfilBase, environment: entorno, trainingDays: [1, 2, 3, 4, 5] });

    for (const dia of plan.dias) {
      for (const ex of dia.ejercicios) {
        assert.ok(isValidExerciseId(ex.exerciseId), `id inválido: ${ex.exerciseId}`);
      }
    }
  }
});

test('solo usa ejercicios disponibles en el entorno de la persona', () => {
  for (const entorno of ['casa', 'peso-corporal']) {
    const plan = buildFallbackRoutine({ ...perfilBase, environment: entorno, trainingDays: [1, 2, 3] });

    for (const dia of plan.dias) {
      for (const ex of dia.ejercicios) {
        const ficha = getExercise(ex.exerciseId);
        assert.ok(
          ficha.envs.includes(entorno),
          `${ex.exerciseId} no se puede hacer en ${entorno}`,
        );
      }
    }
  }
});

test('cada día de entrenamiento trae al menos 3 ejercicios sin repetir', () => {
  for (const entorno of ['gimnasio', 'casa', 'peso-corporal']) {
    const plan = buildFallbackRoutine({ ...perfilBase, environment: entorno, trainingDays: [1, 2, 3, 4, 5] });

    for (const dia of plan.dias.filter((d) => !d.descanso)) {
      assert.ok(dia.ejercicios.length >= 3, `${entorno} día ${dia.dia}: solo ${dia.ejercicios.length} ejercicios`);

      const ids = dia.ejercicios.map((e) => e.exerciseId);
      assert.equal(new Set(ids).size, ids.length, `ejercicio repetido en ${entorno} día ${dia.dia}`);
    }
  }
});

test('la prescripción cambia según el objetivo principal', () => {
  const fuerza = buildFallbackRoutine({ ...perfilBase, goals: ['fuerza'] });
  const grasa = buildFallbackRoutine({ ...perfilBase, goals: ['bajar-grasa'] });

  const compuestoDeFuerza = fuerza.dias
    .flatMap((d) => d.ejercicios)
    .find((e) => getExercise(e.exerciseId)?.compound);

  // Fuerza: pocas repeticiones y descansos largos.
  assert.equal(compuestoDeFuerza.reps, '5-6');
  assert.equal(compuestoDeFuerza.rest, 120);

  // Bajar grasa: más repeticiones y descansos cortos.
  const cualquieraDeGrasa = grasa.dias
    .flatMap((d) => d.ejercicios)
    .find((e) => getExercise(e.exerciseId)?.group === 'pecho');
  assert.equal(cualquieraDeGrasa.reps, '15');
  assert.equal(cualquieraDeGrasa.rest, 45);
});

test('los valores de series, repeticiones y descanso caen en rangos válidos', () => {
  const plan = buildFallbackRoutine({ ...perfilBase, trainingDays: [1, 2, 3, 4, 5, 6] });

  for (const dia of plan.dias) {
    for (const ex of dia.ejercicios) {
      assert.ok(ex.sets >= 1 && ex.sets <= 6, `series fuera de rango: ${ex.sets}`);
      assert.ok(ex.reps.length > 0 && ex.reps.length <= 20, `reps raras: ${ex.reps}`);
      assert.ok(ex.rest >= 0 && ex.rest <= 300, `descanso fuera de rango: ${ex.rest}`);
      assert.equal(typeof ex.note, 'string');
    }
  }
});

test('trae nombre, resumen y consejos para mostrar en la app', () => {
  const plan = buildFallbackRoutine(perfilBase);

  assert.ok(plan.nombrePlan.length > 0);
  assert.ok(plan.resumen.length > 20);
  assert.ok(plan.consejos.length >= 3);
});

test('un principiante no recibe ejercicios avanzados si hay alternativa', () => {
  const plan = buildFallbackRoutine({ ...perfilBase, level: 'principiante', trainingDays: [1, 2, 3] });

  const avanzados = plan.dias
    .flatMap((d) => d.ejercicios)
    .map((e) => getExercise(e.exerciseId))
    .filter((ex) => ex.level === 'avanzado');

  assert.equal(avanzados.length, 0, `le tocaron avanzados: ${avanzados.map((e) => e.id)}`);
});
