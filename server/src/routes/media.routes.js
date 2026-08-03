/**
 * Subida de un video que se convierte en GIF.
 *
 * El video llega como cuerpo binario (no multipart), así que no hace falta
 * ninguna librería de subida: `express.raw` entrega el Buffer y el servicio se
 * encarga de validar que sea video y convertirlo. Requiere sesión.
 */
import { Router } from 'express';
import express from 'express';
import { asyncHandler } from '../middleware/error-handler.js';
import { requireAuth } from '../middleware/auth.js';
import { uploadLimiter } from '../middleware/rate-limit.js';
import { convertVideoToGif } from '../services/media.service.js';
import { badRequest } from '../utils/app-error.js';
import { env } from '../config/env.js';

export const mediaRouter = Router();

/**
 * Lee el cuerpo binario con un tope de tamaño, traduciendo el error de
 * "demasiado grande" a un 400 con mensaje claro en vez de un 500 genérico.
 */
const leerBinario = express.raw({ type: () => true, limit: `${env.maxUploadMb}mb` });
function recibirVideo(req, res, next) {
  leerBinario(req, res, (error) => {
    if (error) {
      if (error.type === 'entity.too.large' || error.status === 413 || error.statusCode === 413) {
        return next(badRequest(`El video supera el máximo de ${env.maxUploadMb} MB. Use uno más corto o de menor calidad.`));
      }
      return next(error);
    }
    return next();
  });
}

mediaRouter.post(
  '/gif',
  requireAuth,
  uploadLimiter,
  recibirVideo,
  asyncHandler(async (req, res) => {
    const buffer = req.body;
    if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
      throw badRequest('No llegó ningún archivo. Escoja un video e intente de nuevo.');
    }

    const declaredType = String(req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
    const gif = await convertVideoToGif(buffer, { declaredType });
    res.status(201).json({ ok: true, gif });
  }),
);
