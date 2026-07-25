/**
 * Rutina de entrenamiento y plan de alimentación.
 *
 * Los dos siguen el mismo patrón: GET devuelve el vigente (o null si nunca se
 * ha generado) y POST /generate crea uno nuevo con la IA.
 */
import { Router } from 'express';
import { asyncHandler } from '../middleware/error-handler.js';
import { requireAuth } from '../middleware/auth.js';
import { generateLimiter } from '../middleware/rate-limit.js';
import { parseBody, routineDaysSchema } from '../validation/schemas.js';
import { generateRoutine, getCurrentRoutine, syncRestDays } from '../services/routine.service.js';
import { generateNutrition, getCurrentNutrition } from '../services/nutrition.service.js';

export const routineRouter = Router();
routineRouter.use(requireAuth);

routineRouter.get('/', (req, res) => {
  const actual = getCurrentRoutine(req.user.id);
  res.json({
    ok: true,
    routine: actual ? { plan: actual.plan, source: actual.source, createdAt: actual.createdAt } : null,
  });
});

routineRouter.post(
  '/generate',
  generateLimiter,
  asyncHandler(async (req, res) => {
    const { plan, source, aviso } = await generateRoutine(req.user);
    res.json({ ok: true, routine: { plan, source, createdAt: Date.now() }, aviso });
  }),
);

routineRouter.patch(
  '/days',
  asyncHandler(async (req, res) => {
    const { trainingDays } = parseBody(routineDaysSchema, req.body);
    const guardado = syncRestDays(req.user.id, trainingDays);
    res.json({
      ok: true,
      routine: guardado ? { plan: guardado.plan, source: guardado.source, createdAt: guardado.createdAt } : null,
    });
  }),
);

export const nutritionRouter = Router();
nutritionRouter.use(requireAuth);

nutritionRouter.get('/', (req, res) => {
  const actual = getCurrentNutrition(req.user.id);
  res.json({
    ok: true,
    nutrition: actual ? { plan: actual.plan, source: actual.source, createdAt: actual.createdAt } : null,
  });
});

nutritionRouter.post(
  '/generate',
  generateLimiter,
  asyncHandler(async (req, res) => {
    const { plan, source } = await generateNutrition(req.user);
    res.json({ ok: true, nutrition: { plan, source, createdAt: Date.now() } });
  }),
);
