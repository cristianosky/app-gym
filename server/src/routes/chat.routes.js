/**
 * Asistente de chat.
 */
import { Router } from 'express';
import { asyncHandler } from '../middleware/error-handler.js';
import { requireAuth } from '../middleware/auth.js';
import { chatLimiter } from '../middleware/rate-limit.js';
import { parseBody, chatSchema } from '../validation/schemas.js';
import * as chatService from '../services/chat.service.js';

export const chatRouter = Router();

chatRouter.use(requireAuth);

chatRouter.get('/', (req, res) => {
  res.json({ ok: true, messages: chatService.history(req.user.id) });
});

chatRouter.post(
  '/',
  chatLimiter,
  asyncHandler(async (req, res) => {
    const entrada = parseBody(chatSchema, req.body);
    const { pregunta, respuesta } = await chatService.ask(req.user, entrada);
    res.json({ ok: true, pregunta, respuesta });
  }),
);

chatRouter.delete('/', (req, res) => {
  chatService.clearHistory(req.user.id);
  res.json({ ok: true });
});
