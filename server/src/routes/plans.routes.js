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
import {
  parseBody,
  routineDaysSchema,
  routineOrderSchema,
  alternativesQuerySchema,
  replaceExerciseSchema,
  catalogQuerySchema,
  addExerciseSchema,
  removeExerciseQuerySchema,
  shareRoutineSchema,
} from '../validation/schemas.js';
import {
  generateRoutine,
  getCurrentRoutine,
  syncRestDays,
  reorderRoutine,
  getAlternatives,
  replaceExercise,
  getCatalogForDay,
  addExercise,
  removeExercise,
} from '../services/routine.service.js';
import {
  shareRoutine,
  listPendingShares,
  acceptShare,
  rejectShare,
} from '../services/routine-share.service.js';
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

routineRouter.patch(
  '/order',
  asyncHandler(async (req, res) => {
    const { order } = parseBody(routineOrderSchema, req.body);
    const guardado = reorderRoutine(req.user.id, req.user.profile.trainingDays, order);
    res.json({
      ok: true,
      routine: guardado ? { plan: guardado.plan, source: guardado.source, createdAt: guardado.createdAt } : null,
    });
  }),
);

routineRouter.get(
  '/exercise/:exerciseId/alternativas',
  asyncHandler(async (req, res) => {
    const { day } = parseBody(alternativesQuerySchema, req.query);
    const alternativas = getAlternatives(req.user, day, req.params.exerciseId);
    res.json({ ok: true, alternativas });
  }),
);

routineRouter.patch(
  '/exercise',
  asyncHandler(async (req, res) => {
    const { day, exerciseId, replacementId } = parseBody(replaceExerciseSchema, req.body);
    const guardado = replaceExercise(req.user.id, day, exerciseId, replacementId);
    res.json({
      ok: true,
      routine: { plan: guardado.plan, source: guardado.source, createdAt: guardado.createdAt },
    });
  }),
);

routineRouter.get(
  '/exercise/catalogo',
  asyncHandler(async (req, res) => {
    const { day } = parseBody(catalogQuerySchema, req.query);
    const catalogo = getCatalogForDay(req.user, day);
    res.json({ ok: true, catalogo });
  }),
);

routineRouter.post(
  '/exercise',
  asyncHandler(async (req, res) => {
    const { day, exerciseId } = parseBody(addExerciseSchema, req.body);
    const guardado = addExercise(req.user.id, day, exerciseId);
    res.json({
      ok: true,
      routine: { plan: guardado.plan, source: guardado.source, createdAt: guardado.createdAt },
    });
  }),
);

routineRouter.delete(
  '/exercise',
  asyncHandler(async (req, res) => {
    const { day, exerciseId } = parseBody(removeExerciseQuerySchema, req.query);
    const guardado = removeExercise(req.user.id, day, exerciseId);
    res.json({
      ok: true,
      routine: { plan: guardado.plan, source: guardado.source, createdAt: guardado.createdAt },
    });
  }),
);

routineRouter.get(
  '/shares/pending',
  asyncHandler(async (req, res) => {
    res.json({ ok: true, shares: listPendingShares(req.user.id) });
  }),
);

routineRouter.post(
  '/shares',
  asyncHandler(async (req, res) => {
    const { username } = parseBody(shareRoutineSchema, req.body);
    const resultado = shareRoutine(req.user, username);
    res.json({ ok: true, ...resultado });
  }),
);

routineRouter.post(
  '/shares/:id/accept',
  asyncHandler(async (req, res) => {
    const guardado = acceptShare(req.user.id, req.params.id);
    res.json({
      ok: true,
      routine: { plan: guardado.plan, source: guardado.source, createdAt: guardado.createdAt },
    });
  }),
);

routineRouter.post(
  '/shares/:id/reject',
  asyncHandler(async (req, res) => {
    rejectShare(req.user.id, req.params.id);
    res.json({ ok: true });
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
