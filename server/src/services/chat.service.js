/**
 * Asistente de chat.
 *
 * Mantiene una ventana de los últimos mensajes como contexto y le inyecta a
 * Gemini los datos del perfil, para que las respuestas estén ajustadas a la
 * persona (su peso, su nivel, sus lesiones) sin que ella tenga que repetirlos.
 *
 * Las fotos se envían a Gemini en la petición pero no se guardan: en el
 * historial queda solo la marca de que ese mensaje traía imagen.
 */
import { genai, MODELS, extractText, fueBloqueadaPorSeguridad, toFriendlyAiError } from '../ai/client.js';
import { COACH_SYSTEM, coachContext } from '../ai/prompts.js';
import * as chatRepo from '../repositories/chat.repo.js';
import { serviceUnavailable } from '../utils/app-error.js';

/** Texto que se guarda cuando la persona manda una foto sin escribir nada. */
const TEXTO_SOLO_FOTO = '(foto adjunta)';

/** El historial se guarda como 'user'/'assistant'; Gemini espera 'user'/'model'. */
const comoRolDeGemini = (role) => (role === 'assistant' ? 'model' : 'user');

/** Construye las partes del turno actual: primero las fotos, luego el texto. */
function partesDelTurno(mensaje, imagenes) {
  const partes = imagenes.map((img) => ({
    inlineData: { mimeType: img.mediaType, data: img.data },
  }));

  partes.push({
    text: mensaje || 'Mire esta foto y dígame qué opina. Responda sobre gimnasio o alimentación.',
  });

  return partes;
}

/**
 * Envía un mensaje al asistente y devuelve su respuesta.
 * @param {object} user usuario completo
 * @param {{message: string, images: Array<{mediaType: string, data: string}>}} entrada
 * @returns {Promise<{pregunta: object, respuesta: object}>}
 */
export async function ask(user, { message, images }) {
  const historial = chatRepo.recentForPrompt(user.id);

  const contents = [
    ...historial.map((m) => ({ role: comoRolDeGemini(m.role), parts: [{ text: m.content }] })),
    { role: 'user', parts: partesDelTurno(message, images) },
  ];

  const contexto = coachContext(user.name, user.profile);
  const system = contexto ? `${COACH_SYSTEM}\n\n---\n\n${contexto}` : COACH_SYSTEM;

  let texto;
  try {
    const response = await genai.models.generateContent({
      model: MODELS.chat,
      contents,
      config: {
        systemInstruction: system,
        maxOutputTokens: 2000,
      },
    });

    if (fueBloqueadaPorSeguridad(response)) {
      throw serviceUnavailable('No puedo responder eso. Pregúnteme sobre entrenamiento o alimentación.');
    }

    texto = extractText(response);
    if (!texto) throw new Error('Respuesta vacía del modelo');
  } catch (error) {
    if (error?.status === 503) throw error;
    throw toFriendlyAiError(error, 'el asistente de chat');
  }

  // Solo guardamos cuando la respuesta llegó bien, para que un fallo no deje
  // la conversación con una pregunta colgando sin contestar.
  const pregunta = chatRepo.append(user.id, {
    role: 'user',
    content: message || TEXTO_SOLO_FOTO,
    hasImage: images.length > 0,
  });
  const respuesta = chatRepo.append(user.id, { role: 'assistant', content: texto });

  return { pregunta, respuesta };
}

/** Historial completo para pintar la conversación al abrir la pestaña. */
export function history(userId) {
  return chatRepo.findAll(userId);
}

/** Borra la conversación. */
export function clearHistory(userId) {
  chatRepo.clear(userId);
}
