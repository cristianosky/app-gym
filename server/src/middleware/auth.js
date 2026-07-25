/**
 * Sesión mediante JWT. El token viaja en `Authorization: Bearer <token>`.
 */
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { unauthorized } from '../utils/app-error.js';
import * as userRepo from '../repositories/user.repo.js';

/** Firma un token para un usuario. */
export function signToken(user) {
  return jwt.sign({ sub: user.id, username: user.username }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

/**
 * Middleware: exige token válido y deja el usuario en `req.user`.
 * Rechaza también los tokens de usuarios ya borrados.
 */
export function requireAuth(req, _res, next) {
  const header = req.get('authorization') ?? '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(unauthorized('Falta el token de sesión.'));
  }

  let payload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET);
  } catch (error) {
    const expirado = error.name === 'TokenExpiredError';
    return next(unauthorized(expirado ? 'La sesión venció. Ingrese de nuevo.' : 'Sesión no válida.'));
  }

  const user = userRepo.findById(payload.sub);
  if (!user) {
    return next(unauthorized('La cuenta ya no existe.'));
  }

  req.user = user;
  return next();
}
