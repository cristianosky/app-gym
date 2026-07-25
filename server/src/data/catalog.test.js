/**
 * Pruebas del catálogo de ejercicios.
 *
 * Es la fuente de verdad de toda la app, así que estas pruebas cuidan las
 * invariantes que romperían la experiencia: ids repetidos, animaciones
 * inexistentes o fichas incompletas.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  EXERCISES, WARMUP, STRETCH, getExercise, isValidExerciseId,
  exercisesForEnv, catalogForPrompt, hydrate,
} from './catalog.js';

/** Claves de animación que existen en src/illustrations/ExerciseIllustration.js. */
const ILUSTRACIONES = new Set([
  'curl', 'press', 'inclinepress', 'fly', 'pushdown', 'kickback', 'pulldown', 'row',
  'legpress', 'squat', 'legext', 'legcurl', 'hipthrust', 'calf', 'shoulderpress',
  'lateralraise', 'shrug', 'plank', 'crunch', 'legraise', 'hinge', 'run', 'hiit',
  'warmup', 'stretch',
]);

const GRUPOS = new Set(['pecho', 'espalda', 'pierna', 'hombro', 'brazo', 'core', 'cardio', 'cuerpo']);
const ENTORNOS = new Set(['gimnasio', 'casa', 'peso-corporal']);
const NIVELES = new Set(['principiante', 'intermedio', 'avanzado']);

test('no hay ids repetidos', () => {
  const ids = EXERCISES.map((e) => e.id);
  const unicos = new Set(ids);
  assert.equal(unicos.size, ids.length, `ids repetidos: ${ids.filter((id, i) => ids.indexOf(id) !== i)}`);
});

test('cada ejercicio tiene la ficha completa', () => {
  for (const ex of EXERCISES) {
    assert.ok(ex.id, 'falta id');
    assert.ok(ex.name?.length > 3, `nombre corto en ${ex.id}`);
    assert.ok(GRUPOS.has(ex.group), `grupo inválido en ${ex.id}: ${ex.group}`);
    assert.ok(ILUSTRACIONES.has(ex.illu), `animación inexistente en ${ex.id}: ${ex.illu}`);
    assert.ok(NIVELES.has(ex.level), `nivel inválido en ${ex.id}: ${ex.level}`);
    assert.ok(Array.isArray(ex.envs) && ex.envs.length > 0, `sin entornos en ${ex.id}`);
    assert.ok(ex.envs.every((e) => ENTORNOS.has(e)), `entorno inválido en ${ex.id}`);
    assert.ok(Array.isArray(ex.howto) && ex.howto.length >= 2, `pocos pasos en ${ex.id}`);
    assert.ok(Array.isArray(ex.errors) && ex.errors.length >= 1, `sin errores comunes en ${ex.id}`);
    assert.ok(ex.muscles?.length > 3, `sin músculos en ${ex.id}`);
  }
});

test('los ids de YouTube tienen forma válida o son null', () => {
  for (const ex of EXERCISES) {
    if (ex.video === null) continue;
    assert.match(ex.video, /^[A-Za-z0-9_-]{11}$/, `id de video raro en ${ex.id}: ${ex.video}`);
  }
});

test('hay ejercicios suficientes para armar una rutina en cada entorno', () => {
  for (const entorno of ENTORNOS) {
    const disponibles = exercisesForEnv(entorno);
    assert.ok(disponibles.length >= 10, `solo ${disponibles.length} ejercicios para ${entorno}`);

    // Sin al menos un empuje, una tracción y una pierna no hay rutina decente.
    const grupos = new Set(disponibles.map((e) => e.group));
    for (const necesario of ['pecho', 'espalda', 'pierna', 'core']) {
      assert.ok(grupos.has(necesario), `falta ${necesario} para el entorno ${entorno}`);
    }
  }
});

test('el calentamiento y el estiramiento existen y sirven en todos los entornos', () => {
  assert.ok(WARMUP?.isWarmup, 'falta el bloque de calentamiento');
  assert.ok(STRETCH?.isStretch, 'falta el bloque de estiramiento');
  for (const entorno of ENTORNOS) {
    assert.ok(WARMUP.envs.includes(entorno));
    assert.ok(STRETCH.envs.includes(entorno));
  }
});

test('busca por id y valida los que no existen', () => {
  assert.equal(getExercise('plancha')?.name, 'Plancha abdominal');
  assert.equal(getExercise('no-existe'), null);
  assert.equal(isValidExerciseId('plancha'), true);
  assert.equal(isValidExerciseId('press-de-banca-inventado'), false);
  // Los bloques fijos también son ids válidos.
  assert.equal(isValidExerciseId('calentamiento'), true);
});

test('el resumen para el prompt trae una línea por ejercicio con los 6 campos', () => {
  const texto = catalogForPrompt('gimnasio');
  const lineas = texto.split('\n');

  assert.equal(lineas.length, exercisesForEnv('gimnasio').length);
  for (const linea of lineas) {
    assert.equal(linea.split(' | ').length, 6, `línea mal formada: ${linea}`);
  }
});

test('hidratar une la prescripción de la IA con la ficha del catálogo', () => {
  const resultado = hydrate({ exerciseId: 'prensa-pierna', sets: 4, reps: '12', rest: 90, note: 'Baje despacio' });

  assert.equal(resultado.name, 'Prensa de piernas (leg press)');
  assert.equal(resultado.sets, 4);
  assert.equal(resultado.reps, '12');
  assert.equal(resultado.rest, 90);
  assert.equal(resultado.note, 'Baje despacio');
  assert.ok(Array.isArray(resultado.howto), 'debe traer la técnica del catálogo');
});

test('hidratar devuelve null si la IA inventó un id', () => {
  assert.equal(hydrate({ exerciseId: 'press-inventado-9000', sets: 3, reps: '10', rest: 60 }), null);
});
