/**
 * Pruebas del guardado del PIN.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hashPin, verifyPin, isValidPinFormat, isWeakPin } from './pin.js';

test('acepta solo 4 dígitos como formato de PIN', () => {
  assert.equal(isValidPinFormat('4827'), true);
  assert.equal(isValidPinFormat('482'), false, 'tres dígitos');
  assert.equal(isValidPinFormat('48270'), false, 'cinco dígitos');
  assert.equal(isValidPinFormat('48a7'), false, 'con letra');
  assert.equal(isValidPinFormat(''), false);
  assert.equal(isValidPinFormat(4827), false, 'debe ser cadena');
});

test('marca como débiles los PIN obvios', () => {
  for (const debil of ['1234', '0000', '1111', '2025', '4321']) {
    assert.equal(isWeakPin(debil), true, `${debil} debería ser débil`);
  }
  assert.equal(isWeakPin('4827'), false);
  assert.equal(isWeakPin('9163'), false);
});

test('el hash verifica el PIN correcto y rechaza los demás', async () => {
  const { hash, salt } = await hashPin('4827');

  assert.equal(await verifyPin('4827', hash, salt), true);
  assert.equal(await verifyPin('4828', hash, salt), false);
  assert.equal(await verifyPin('', hash, salt), false);
});

test('el mismo PIN produce hashes distintos (sal única)', async () => {
  const a = await hashPin('4827');
  const b = await hashPin('4827');

  assert.notEqual(a.hash, b.hash, 'dos hashes iguales significaría que falta la sal');
  assert.notEqual(a.salt, b.salt);
  // Aun siendo distintos, los dos deben verificar el mismo PIN.
  assert.equal(await verifyPin('4827', a.hash, a.salt), true);
  assert.equal(await verifyPin('4827', b.hash, b.salt), true);
});

test('no revienta con un hash o una sal corruptos', async () => {
  assert.equal(await verifyPin('4827', 'no-es-hex', 'tampoco'), false);
  assert.equal(await verifyPin('4827', '', ''), false);
});
