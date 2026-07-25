/**
 * Aplicación Express: middlewares globales y montaje de rutas.
 * Se separa de `index.js` para poder levantarla en las pruebas sin abrir puerto.
 */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { notFoundHandler, errorHandler } from './middleware/error-handler.js';
import { authRouter } from './routes/auth.routes.js';
import { meRouter } from './routes/me.routes.js';
import { routineRouter, nutritionRouter } from './routes/plans.routes.js';
import { chatRouter } from './routes/chat.routes.js';
import { progressRouter } from './routes/progress.routes.js';
import { optionsRouter } from './routes/options.routes.js';

export function createApp() {
  const app = express();

  // Detrás de un proxy (Railway, Render, Nginx) para que el rate limit vea la
  // IP real del cliente y no la del proxy.
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(cors({ origin: env.corsOrigins }));
  // El límite alto es por las fotos del chat, que llegan en base64.
  app.use(express.json({ limit: '12mb' }));
  app.use(morgan(env.isProduction ? 'combined' : 'dev'));

  app.get('/health', (_req, res) => {
    res.json({ ok: true, service: 'mi-entrenamiento-api', models: env.models });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/options', optionsRouter);
  app.use('/api/me', meRouter);
  app.use('/api/routine', routineRouter);
  app.use('/api/nutrition', nutritionRouter);
  app.use('/api/chat', chatRouter);
  app.use('/api/progress', progressRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
