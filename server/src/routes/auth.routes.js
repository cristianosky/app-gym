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

    // Responde de inmediato para que la app entre sin esperar a Gemini.
    // La rutina se genera en background; el front la obtiene con GET /plans/routine
    // y mientras tanto muestra "Estamos generando tu rutina...".
    res.status(201).json({ ok: true, user, token, generandoRutina: true });

    const completo = userRepo.findById(user.id);
    // skipIfExists: si la persona arma su propia rutina (p. ej. desde cero)
    // mientras Gemini responde, esa gana y no se pisa con la generada aquí.
    generateRoutine(completo, { skipIfExists: true }).catch((err) =>
      console.error('[registro] Error generando rutina en background:', err?.message ?? err),
    );
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
