/**
 * Catálogos que necesita la app para pintar el registro.
 *
 * Se sirven desde el servidor para no duplicar los textos en la app: si
 * mañana se añade un objetivo nuevo, aparece sin publicar otra versión.
 * La app trae una copia local por si no hay conexión al abrirla.
 */
import { Router } from 'express';
import { GOALS, LEVELS, ENVIRONMENTS, SEXES, DIETS, WEEKDAYS } from '../data/options.js';
import { EXERCISES } from '../data/catalog.js';

export const optionsRouter = Router();

optionsRouter.get('/', (_req, res) => {
  res.json({
    ok: true,
    options: { goals: GOALS, levels: LEVELS, environments: ENVIRONMENTS, sexes: SEXES, diets: DIETS, weekdays: WEEKDAYS },
  });
});

/** Catálogo completo de ejercicios, por si la app quiere mostrarlo aparte. */
optionsRouter.get('/exercises', (_req, res) => {
  res.json({ ok: true, exercises: EXERCISES });
});
