/**
 * Sincronización del progreso.
 *
 * La app es la fuente inmediata de verdad (funciona sin internet) y el
 * servidor guarda una copia para que el progreso sobreviva a un cambio de
 * celular o a reinstalar la app.
 */
import { Router } from 'express';
import { asyncHandler } from '../middleware/error-handler.js';
import { requireAuth } from '../middleware/auth.js';
import { parseBody, progressSyncSchema } from '../validation/schemas.js';
import * as progressRepo from '../repositories/progress.repo.js';

export const progressRouter = Router();

progressRouter.use(requireAuth);

progressRouter.get('/', (req, res) => {
  res.json({ ok: true, days: progressRepo.findAll(req.user.id) });
});

progressRouter.put(
  '/',
  asyncHandler(async (req, res) => {
    const { days } = parseBody(progressSyncSchema, req.body);
    res.json({ ok: true, days: progressRepo.upsertMany(req.user.id, days) });
  }),
);

progressRouter.delete('/', (req, res) => {
  progressRepo.clear(req.user.id);
  res.json({ ok: true, days: [] });
});
