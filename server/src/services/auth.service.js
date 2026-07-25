/**
 * Registro e ingreso con usuario + PIN de 4 dígitos.
 *
 * Como el PIN solo tiene 10.000 combinaciones, la defensa principal contra
 * fuerza bruta es el bloqueo temporal por intentos fallidos, que crece de
 * forma escalonada. El hash con scrypt (ver `pin.js`) protege los datos si
 * alguien llegara a leer la base de datos.
 */
import * as userRepo from '../repositories/user.repo.js';
import { hashPin, verifyPin, isWeakPin } from './pin.js';
import { signToken } from '../middleware/auth.js';
import { badRequest, conflict, unauthorized, tooManyRequests } from '../utils/app-error.js';

/** A partir del 5º fallo se bloquea; cada tanda de fallos bloquea más tiempo. */
const MAX_INTENTOS = 5;
const BLOQUEOS_MINUTOS = [1, 5, 15, 60];

function minutosDeBloqueo(fallos) {
  const tanda = Math.floor((fallos - MAX_INTENTOS) / MAX_INTENTOS);
  return BLOQUEOS_MINUTOS[Math.min(tanda, BLOQUEOS_MINUTOS.length - 1)];
}

function describirEspera(ms) {
  const minutos = Math.ceil(ms / 60_000);
  return minutos <= 1 ? 'un minuto' : `${minutos} minutos`;
}

/**
 * Crea la cuenta y devuelve el token de sesión.
 * @param {{name: string, username: string, pin: string, profile: object}} datos
 */
export async function register({ name, username, pin, profile }) {
  if (isWeakPin(pin)) {
    throw badRequest('Ese PIN es muy fácil de adivinar. Escoja otro.', {
      campos: { pin: 'Evite PIN como 1234 o 0000.' },
    });
  }

  if (userRepo.usernameExists(username)) {
    throw conflict('Ese usuario ya está registrado. Pruebe con otro.', {
      campos: { username: 'Usuario no disponible.' },
    });
  }

  const { hash, salt } = await hashPin(pin);
  const user = userRepo.create({ username, name, pinHash: hash, pinSalt: salt, profile });

  return { user: userRepo.toPublicUser(user), token: signToken(user) };
}

/** Comprueba si un usuario existe (paso 1 del ingreso). */
export function checkUsername(username) {
  const user = userRepo.findByUsername(username);
  return user ? { exists: true, name: user.name } : { exists: false };
}

/**
 * Verifica usuario + PIN y devuelve el token.
 * El mensaje de error no revela si falló el usuario o el PIN.
 */
export async function login({ username, pin }) {
  const credencialesInvalidas = () =>
    unauthorized('Usuario o PIN incorrecto.');

  const user = userRepo.findByUsername(username);
  if (!user) {
    // Gastamos tiempo igualmente para no delatar por la demora que el usuario no existe.
    await hashPin(pin);
    throw credencialesInvalidas();
  }

  if (user.lockedUntil && user.lockedUntil > Date.now()) {
    throw tooManyRequests(
      `Demasiados intentos fallidos. Intente de nuevo en ${describirEspera(user.lockedUntil - Date.now())}.`,
      { lockedUntil: user.lockedUntil },
    );
  }

  const correcto = await verifyPin(pin, user.pinHash, user.pinSalt);

  if (!correcto) {
    const fallos = user.failedLogins + 1;
    const bloquear = fallos >= MAX_INTENTOS && fallos % MAX_INTENTOS === 0;
    const lockedUntil = bloquear ? Date.now() + minutosDeBloqueo(fallos) * 60_000 : null;
    userRepo.registerFailedLogin(user.id, lockedUntil);

    if (lockedUntil) {
      throw tooManyRequests(
        `Demasiados intentos fallidos. Intente de nuevo en ${describirEspera(lockedUntil - Date.now())}.`,
        { lockedUntil },
      );
    }

    const restantes = MAX_INTENTOS - (fallos % MAX_INTENTOS);
    throw unauthorized(
      restantes <= 2
        ? `Usuario o PIN incorrecto. Le quedan ${restantes} intentos.`
        : 'Usuario o PIN incorrecto.',
    );
  }

  userRepo.clearFailedLogins(user.id);
  return { user: userRepo.toPublicUser(user), token: signToken(user) };
}

/** Cambia el PIN comprobando primero el actual. */
export async function changePin(user, { currentPin, newPin }) {
  const correcto = await verifyPin(currentPin, user.pinHash, user.pinSalt);
  if (!correcto) {
    throw unauthorized('El PIN actual no es correcto.');
  }
  if (isWeakPin(newPin)) {
    throw badRequest('Ese PIN es muy fácil de adivinar. Escoja otro.', {
      campos: { newPin: 'Evite PIN como 1234 o 0000.' },
    });
  }

  const { hash, salt } = await hashPin(newPin);
  userRepo.updatePin(user.id, { pinHash: hash, pinSalt: salt });
}
