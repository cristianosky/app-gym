/**
 * Registro e ingreso.
 *
 * El ingreso son dos pasos en la app (usuario → PIN), así que se expone
 * `check-username` para validar el usuario antes de pedir el PIN.
 */
import { Router } from 'express';
import { asyncHandler } from '../middleware/error-handler.js';
import { loginLimiter, registerLimiter } from '../middleware/rate-limit.js';
import { parseBody, registerSchema, loginSchema, checkUsernameSchema } from '../validation/schemas.js';
import * as authService from '../services/auth.service.js';
import { generateRoutine } from '../services/routine.service.js';
import * as userRepo from '../repositories/user.repo.js';

export const authRouter = Router();

authRouter.post(
  '/register',
  registerLimiter,
  asyncHandler(async (req, res) => {
    const datos = parseBody(registerSchema, req.body);
    const { user, token } = await authService.register(datos);

    // La primera rutina se genera al vuelo: la persona entra a la app y ya
    // tiene su plan listo, sin una pantalla de espera extra.
    const completo = userRepo.findById(user.id);
    const { plan, source, aviso } = await generateRoutine(completo);

    res.status(201).json({ ok: true, user, token, routine: { plan, source }, aviso });
  }),
);

authRouter.post(
  '/check-username',
  loginLimiter,
  asyncHandler(async (req, res) => {
    const { username } = parseBody(checkUsernameSchema, req.body);
    res.json({ ok: true, ...authService.checkUsername(username) });
  }),
);

authRouter.post(
  '/login',
  loginLimiter,
  asyncHandler(async (req, res) => {
    const datos = parseBody(loginSchema, req.body);
    const { user, token } = await authService.login(datos);
    res.json({ ok: true, user, token });
  }),
);
