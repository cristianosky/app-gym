/**
 * Validación de lo que devuelve la IA.
 *
 * Aunque usamos salida estructurada (la API obliga al modelo a respetar el
 * esquema JSON), seguimos validando aquí: los ids de ejercicio y los rangos
 * numéricos no los puede garantizar el esquema, y nunca guardamos en la base
 * de datos algo que no hayamos revisado.
 */
import { z } from 'zod';
import { isValidExerciseId } from '../data/catalog.js';

const ACENTOS = ['pecho', 'espalda', 'pierna', 'hombro', 'brazo', 'core', 'cardio', 'cuerpo', 'rest'];

const prescripcionSchema = z.object({
  exerciseId: z.string().refine(isValidExerciseId, 'Ejercicio fuera del catálogo'),
  sets: z.number().int().min(1).max(6),
  reps: z.string().trim().min(1).max(20),
  rest: z.number().int().min(0).max(300),
  note: z.string().trim().max(200).default(''),
});

const diaSchema = z.object({
  dia: z.number().int().min(1).max(7),
  titulo: z.string().trim().min(1).max(40),
  subtitulo: z.string().trim().max(60).default(''),
  acento: z.enum(ACENTOS),
  descanso: z.boolean(),
  // Los ejercicios inválidos se descartan uno a uno en vez de tumbar el plan
  // entero: si la IA se equivoca en un id, el resto de la rutina sigue sirviendo.
  ejercicios: z.array(z.unknown()).max(12),
});

export const aiRoutineSchema = z.object({
  nombrePlan: z.string().trim().min(1).max(60),
  resumen: z.string().trim().min(1).max(600),
  consejos: z.array(z.string().trim().min(1).max(300)).max(8).default([]),
  dias: z.array(diaSchema).length(7, 'La rutina debe traer los 7 días'),
});

/** Filtra los ejercicios válidos de un día, descartando los que no cuadren. */
export function ejerciciosValidos(lista) {
  const validos = [];
  for (const item of lista ?? []) {
    const parsed = prescripcionSchema.safeParse(item);
    if (parsed.success) validos.push(parsed.data);
  }
  return validos;
}

const comidaSchema = z.object({
  nombre: z.string().trim().min(1).max(80),
  descripcion: z.string().trim().max(400).default(''),
  ingredientes: z.array(z.string().trim().min(1).max(120)).max(20).default([]),
  calorias: z.number().int().min(0).max(3000),
  proteina: z.number().int().min(0).max(300),
  tip: z.string().trim().max(200).default(''),
});

const bloqueSchema = z.object({
  momento: z.enum(['desayuno', 'media-manana', 'almuerzo', 'media-tarde', 'cena']),
  hora: z.string().trim().max(20).default(''),
  comida: comidaSchema,
});

const diaComidasSchema = z.object({
  dia: z.number().int().min(1).max(7),
  bloques: z.array(bloqueSchema).min(3).max(6),
});

export const aiNutritionSchema = z.object({
  resumen: z.string().trim().min(1).max(600),
  caloriasObjetivo: z.number().int().min(1200).max(6000),
  proteinaObjetivo: z.number().int().min(40).max(400),
  aguaLitros: z.number().min(1).max(8),
  dias: z.array(diaComidasSchema).length(7, 'El plan de comidas debe traer los 7 días'),
  consejos: z.array(z.string().trim().min(1).max(300)).max(8).default([]),
  listaMercado: z.array(z.string().trim().min(1).max(80)).max(30).default([]),
});
