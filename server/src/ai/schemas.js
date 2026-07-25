/**
 * Esquemas que la IA está obligada a respetar (salida estructurada de Gemini).
 *
 * A diferencia de la API de Anthropic, aquí no hace falta `additionalProperties`
 * ni envolver el esquema en un `json_schema` con nombre: basta con pasar este
 * objeto directo en `config.responseSchema` junto con
 * `config.responseMimeType = 'application/json'`.
 */
import { Type } from '@google/genai';

const ACENTOS = ['pecho', 'espalda', 'pierna', 'hombro', 'brazo', 'core', 'cardio', 'cuerpo', 'rest'];

/** Un ejercicio escogido por la IA: solo referencia + prescripción. */
const prescripcion = {
  type: Type.OBJECT,
  properties: {
    exerciseId: {
      type: Type.STRING,
      description: 'Id exacto tomado del catálogo entregado. No inventar ids.',
    },
    sets: { type: Type.INTEGER, description: 'Número de series, entre 1 y 6.' },
    reps: {
      type: Type.STRING,
      description: 'Repeticiones o duración: "10-12", "15", "30 s", "12 min".',
    },
    rest: { type: Type.INTEGER, description: 'Descanso entre series en segundos (0 si no aplica).' },
    note: {
      type: Type.STRING,
      description: 'Ajuste corto para esta persona. Cadena vacía si no hace falta.',
    },
  },
  required: ['exerciseId', 'sets', 'reps', 'rest', 'note'],
};

const diaEntrenamiento = {
  type: Type.OBJECT,
  properties: {
    dia: { type: Type.INTEGER, description: '1 = lunes … 7 = domingo.' },
    titulo: { type: Type.STRING, description: 'Ej.: "Pecho y tríceps". Máximo 24 caracteres.' },
    subtitulo: { type: Type.STRING, description: 'Frase corta de apoyo. Máximo 40 caracteres.' },
    acento: { type: Type.STRING, enum: ACENTOS, description: 'Grupo dominante del día.' },
    descanso: { type: Type.BOOLEAN, description: 'true si ese día no se entrena.' },
    ejercicios: {
      type: Type.ARRAY,
      description: 'Vacío si descanso es true. Si no, entre 4 y 8 ejercicios.',
      items: prescripcion,
    },
  },
  required: ['dia', 'titulo', 'subtitulo', 'acento', 'descanso', 'ejercicios'],
};

export const ROUTINE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    nombrePlan: { type: Type.STRING, description: 'Nombre corto del plan. Máximo 32 caracteres.' },
    resumen: {
      type: Type.STRING,
      description: 'Dos o tres frases explicándole a la persona por qué este plan le sirve.',
    },
    consejos: {
      type: Type.ARRAY,
      description: 'Entre 3 y 5 consejos prácticos y concretos.',
      items: { type: Type.STRING },
    },
    dias: {
      type: Type.ARRAY,
      description: 'Exactamente 7 elementos, del día 1 al 7, en orden.',
      items: diaEntrenamiento,
    },
  },
  required: ['nombrePlan', 'resumen', 'consejos', 'dias'],
};

const comida = {
  type: Type.OBJECT,
  properties: {
    nombre: { type: Type.STRING, description: 'Nombre del plato. Máximo 40 caracteres.' },
    descripcion: { type: Type.STRING, description: 'Una frase de cómo se prepara.' },
    ingredientes: {
      type: Type.ARRAY,
      description: 'Ingredientes con cantidad, ej.: "1 taza de arroz".',
      items: { type: Type.STRING },
    },
    calorias: { type: Type.INTEGER, description: 'Calorías aproximadas del plato.' },
    proteina: { type: Type.INTEGER, description: 'Gramos de proteína aproximados.' },
    tip: { type: Type.STRING, description: 'Consejo corto. Cadena vacía si no hace falta.' },
  },
  required: ['nombre', 'descripcion', 'ingredientes', 'calorias', 'proteina', 'tip'],
};

const bloqueComida = {
  type: Type.OBJECT,
  properties: {
    momento: {
      type: Type.STRING,
      enum: ['desayuno', 'media-manana', 'almuerzo', 'media-tarde', 'cena'],
    },
    hora: { type: Type.STRING, description: 'Hora sugerida, ej.: "7:00 a. m.".' },
    comida,
  },
  required: ['momento', 'hora', 'comida'],
};

const diaComidas = {
  type: Type.OBJECT,
  properties: {
    dia: { type: Type.INTEGER, description: '1 = lunes … 7 = domingo.' },
    bloques: {
      type: Type.ARRAY,
      description: 'Los 5 momentos del día, en orden.',
      items: bloqueComida,
    },
  },
  required: ['dia', 'bloques'],
};

export const NUTRITION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    resumen: { type: Type.STRING, description: 'Dos frases explicando el enfoque del plan.' },
    caloriasObjetivo: { type: Type.INTEGER, description: 'Calorías diarias objetivo.' },
    proteinaObjetivo: { type: Type.INTEGER, description: 'Gramos de proteína diarios objetivo.' },
    aguaLitros: { type: Type.NUMBER, description: 'Litros de agua al día.' },
    dias: {
      type: Type.ARRAY,
      description: 'Exactamente 7 elementos, del día 1 al 7, cada uno con un menú distinto (nada repetido en la semana).',
      items: diaComidas,
    },
    consejos: {
      type: Type.ARRAY,
      description: 'Entre 3 y 5 consejos de alimentación.',
      items: { type: Type.STRING },
    },
    listaMercado: {
      type: Type.ARRAY,
      description: 'Entre 15 y 25 productos para la lista del mercado de toda la semana.',
      items: { type: Type.STRING },
    },
  },
  required: ['resumen', 'caloriasObjetivo', 'proteinaObjetivo', 'aguaLitros', 'dias', 'consejos', 'listaMercado'],
};
