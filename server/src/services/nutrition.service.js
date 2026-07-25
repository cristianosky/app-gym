/**
 * Generación del plan de alimentación.
 *
 * A diferencia de la rutina, aquí no hay catálogo cerrado: la IA propone los
 * platos. Lo que sí controlamos es la estructura (7 días, 5 momentos cada uno)
 * y que los números caigan en rangos razonables.
 *
 * Cada día trae un menú distinto (no 2 opciones fijas repetidas toda la
 * semana), para que la persona no coma lo mismo todos los días.
 *
 * Si la IA falla no hay respaldo automático: inventarle comidas a alguien sin
 * criterio nutricional sería peor que decirle que lo intente más tarde.
 */
import { genai, MODELS, extractText, toFriendlyAiError } from '../ai/client.js';
import { nutritionPrompt } from '../ai/prompts.js';
import { NUTRITION_SCHEMA } from '../ai/schemas.js';
import { aiNutritionSchema } from '../validation/ai-output.js';
import { resumenCorporal } from './metrics.js';
import * as planRepo from '../repositories/plan.repo.js';
import { serviceUnavailable } from '../utils/app-error.js';

const ORDEN_MOMENTOS = ['desayuno', 'media-manana', 'almuerzo', 'media-tarde', 'cena'];

const ETIQUETAS = {
  desayuno: { titulo: 'Desayuno', icon: 'sunny-outline' },
  'media-manana': { titulo: 'Media mañana', icon: 'cafe-outline' },
  almuerzo: { titulo: 'Almuerzo', icon: 'restaurant-outline' },
  'media-tarde': { titulo: 'Onces', icon: 'nutrition-outline' },
  cena: { titulo: 'Comida', icon: 'moon-outline' },
};

/** Ordena los momentos del día y les añade título e icono para la app. */
function armarDia(dia) {
  const bloques = dia.bloques
    .slice()
    .sort((a, b) => ORDEN_MOMENTOS.indexOf(a.momento) - ORDEN_MOMENTOS.indexOf(b.momento))
    .map((bloque) => ({
      ...bloque,
      ...(ETIQUETAS[bloque.momento] ?? { titulo: bloque.momento, icon: 'restaurant-outline' }),
    }));

  return { ...dia, bloques };
}

/** Ordena los 7 días y les añade título e icono a cada momento. */
function armarPlan(crudo, perfil) {
  const dias = crudo.dias.slice().sort((a, b) => a.dia - b.dia).map(armarDia);
  return { ...crudo, dias, cuerpo: resumenCorporal(perfil) };
}

/**
 * Genera y guarda el plan de comidas.
 * @param {object} user usuario completo (con `profile`)
 */
export async function generateNutrition(user) {
  const perfil = user.profile;
  const { system, user: userPrompt } = nutritionPrompt(user.name, perfil);

  let crudo;
  try {
    const response = await genai.models.generateContent({
      model: MODELS.nutrition,
      contents: userPrompt,
      config: {
        systemInstruction: system,
        responseMimeType: 'application/json',
        responseSchema: NUTRITION_SCHEMA,
        maxOutputTokens: 16000,
      },
    });

    const texto = extractText(response);
    if (!texto) throw new Error('Gemini devolvió una respuesta vacía o bloqueada');
    crudo = JSON.parse(texto);
  } catch (error) {
    throw toFriendlyAiError(error, 'la generación del plan de comidas');
  }

  const validado = aiNutritionSchema.safeParse(crudo);
  if (!validado.success) {
    // eslint-disable-next-line no-console
    console.error('[nutricion] La IA devolvió un plan inválido:', validado.error.issues.slice(0, 3));
    throw serviceUnavailable('El plan de comidas llegó incompleto. Intente generarlo de nuevo.');
  }

  const plan = armarPlan(validado.data, perfil);
  const guardado = planRepo.save('nutricion', user.id, plan, 'ia');
  return { plan: guardado.plan, source: 'ia' };
}

/** Plan de comidas vigente o null. */
export function getCurrentNutrition(userId) {
  return planRepo.findCurrent('nutricion', userId);
}
