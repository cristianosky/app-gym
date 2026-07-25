/**
 * Guardado y verificación del PIN de 4 dígitos.
 *
 * Un PIN de 4 dígitos solo tiene 10.000 combinaciones, así que el hash por sí
 * solo no basta: la protección real está en el bloqueo por intentos fallidos
 * que aplica `auth.service.js`. Aun así lo guardamos con scrypt (lento a
 * propósito) y sal única, para que una filtración de la base de datos no
 * revele los PIN directamente.
 *
 * Usamos scrypt de `node:crypto` en vez de bcrypt/argon2 para no depender de
 * módulos nativos que haya que compilar en cada máquina.
 */
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);

const KEY_LENGTH = 64;
const SALT_LENGTH = 16;
// Parámetros recomendados por OWASP para scrypt interactivo.
const SCRYPT_OPTIONS = { N: 2 ** 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

/** El PIN debe ser exactamente 4 dígitos. */
export function isValidPinFormat(pin) {
  return typeof pin === 'string' && /^\d{4}$/.test(pin);
}

/** PIN demasiado obvio: lo rechazamos en el registro. */
const WEAK_PINS = new Set([
  '0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999',
  '1234', '4321', '0123', '3210', '1212', '2121', '1010', '2000', '2020', '2024',
  '2025', '2026', '1122', '6969',
]);

export function isWeakPin(pin) {
  return WEAK_PINS.has(pin);
}

/**
 * Genera sal + hash para un PIN nuevo.
 * @returns {Promise<{hash: string, salt: string}>} ambos en hexadecimal
 */
export async function hashPin(pin) {
  const salt = randomBytes(SALT_LENGTH);
  const derived = await scryptAsync(pin, salt, KEY_LENGTH, SCRYPT_OPTIONS);
  return { hash: derived.toString('hex'), salt: salt.toString('hex') };
}

/**
 * Compara un PIN con el hash guardado, en tiempo constante.
 * @returns {Promise<boolean>}
 */
export async function verifyPin(pin, hashHex, saltHex) {
  try {
    const salt = Buffer.from(saltHex, 'hex');
    const expected = Buffer.from(hashHex, 'hex');
    const derived = await scryptAsync(pin, salt, KEY_LENGTH, SCRYPT_OPTIONS);
    return expected.length === derived.length && timingSafeEqual(expected, derived);
  } catch {
    return false;
  }
}
