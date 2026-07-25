/**
 * Perfil del usuario que tiene la sesión abierta.
 */
import { Router } from 'express';
import { asyncHandler } from '../middleware/error-handler.js';
import { requireAuth } from '../middleware/auth.js';
import { parseBody, profileSchema, changePinSchema } from '../validation/schemas.js';
import * as userRepo from '../repositories/user.repo.js';
import * as authService from '../services/auth.service.js';

export const meRouter = Router();

meRouter.use(requireAuth);

meRouter.get('/', (req, res) => {
  res.json({ ok: true, user: userRepo.toPublicUser(req.user) });
});

meRouter.patch(
  '/profile',
  asyncHandler(async (req, res) => {
    const profile = parseBody(profileSchema, req.body);
    const actualizado = userRepo.updateProfile(req.user.id, profile);

    // Cambiar peso, objetivos o días afecta la rutina, pero no la regeneramos
    // sola: puede costar dinero y la persona quizá solo corrigió su peso.
    res.json({
      ok: true,
      user: userRepo.toPublicUser(actualizado),
      aviso: 'Perfil actualizado. Regenere su rutina para que tenga en cuenta los cambios.',
    });
  }),
);

meRouter.post(
  '/pin',
  asyncHandler(async (req, res) => {
    const datos = parseBody(changePinSchema, req.body);
    await authService.changePin(req.user, datos);
    res.json({ ok: true, mensaje: 'PIN actualizado.' });
  }),
);
