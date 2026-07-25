/**
 * Pruebas de los cálculos corporales.
 * Los valores esperados se sacaron a mano con las fórmulas publicadas.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { imc, categoriaImc, metabolismoBasal, gastoDiario, resumenCorporal } from './metrics.js';

test('calcula el IMC', () => {
  // 82 / (1,75^2) = 26,8
  assert.equal(imc(82, 175), 26.8);
  assert.equal(imc(60, 165), 22);
});

test('clasifica el IMC según los cortes de la OMS', () => {
  assert.equal(categoriaImc(17), 'bajo peso');
  assert.equal(categoriaImc(22), 'peso normal');
  assert.equal(categoriaImc(24.9), 'peso normal');
  assert.equal(categoriaImc(25), 'sobrepeso');
  assert.equal(categoriaImc(31), 'obesidad grado 1');
  assert.equal(categoriaImc(36), 'obesidad grado 2');
  assert.equal(categoriaImc(41), 'obesidad grado 3');
});

test('calcula el metabolismo basal por Mifflin-St Jeor', () => {
  const base = { weightKg: 82, heightCm: 175, age: 28 };
  // 10*82 + 6,25*175 - 5*28 = 1773,75  →  hombre +5, mujer -161
  assert.equal(metabolismoBasal({ ...base, sex: 'hombre' }), 1779);
  assert.equal(metabolismoBasal({ ...base, sex: 'mujer' }), 1613);
  // Sin decirlo se usa el promedio de las dos fórmulas.
  assert.equal(metabolismoBasal({ ...base, sex: 'prefiero-no-decir' }), 1696);
});

test('el gasto diario sube con los días de entrenamiento', () => {
  const perfil = { weightKg: 82, heightCm: 175, age: 28, sex: 'hombre' };

  const uno = gastoDiario({ ...perfil, trainingDays: [1] });
  const tres = gastoDiario({ ...perfil, trainingDays: [1, 3, 5] });
  const cinco = gastoDiario({ ...perfil, trainingDays: [1, 2, 3, 4, 5] });
  const seis = gastoDiario({ ...perfil, trainingDays: [1, 2, 3, 4, 5, 6] });

  assert.ok(uno < tres, 'más días debería dar más gasto');
  assert.ok(tres < cinco);
  assert.ok(cinco < seis);
});

test('el resumen trae los cuatro números que usa el prompt', () => {
  const resumen = resumenCorporal({
    weightKg: 82, heightCm: 175, age: 28, sex: 'hombre', trainingDays: [1, 2, 3, 4, 5],
  });

  assert.deepEqual(Object.keys(resumen).sort(), ['categoriaImc', 'gastoDiario', 'imc', 'metabolismoBasal']);
  assert.equal(resumen.imc, 26.8);
  assert.equal(resumen.categoriaImc, 'sobrepeso');
});
