/**
 * Opciones del registro: objetivos, nivel, dónde entrena y preferencias de comida.
 *
 * La app pinta estas listas tal cual (para no duplicar textos) y la IA recibe
 * el campo `focus` de cada objetivo como guía al armar la rutina.
 */

/**
 * Objetivos que puede escoger la persona. Se pueden combinar varios:
 * el primero de la lista manda y los demás matizan.
 */
export const GOALS = Object.freeze([
  {
    id: 'bajar-grasa',
    label: 'Bajar de peso',
    short: 'Quemar grasa',
    description: 'Bajar grasa cuidando el músculo que ya tiene.',
    icon: 'fire',
    iconSet: 'mci',
    accent: 'cardio',
    focus:
      'Priorizar déficit calórico. Sesiones con circuitos o descansos cortos (45-60 s), ' +
      'bastante trabajo multiarticular y un bloque de cardio al final de cada sesión.',
  },
  {
    id: 'ganar-musculo',
    label: 'Ganar masa muscular',
    short: 'Hipertrofia',
    description: 'Aumentar el tamaño del músculo con volumen de entrenamiento.',
    icon: 'arm-flex',
    iconSet: 'mci',
    accent: 'pecho',
    focus:
      'Hipertrofia: 8-12 repeticiones, 3-4 series por ejercicio, descansos de 60-90 s. ' +
      'Poco cardio para no interferir con la recuperación.',
  },
  {
    id: 'recomposicion',
    label: 'Bajar grasa y ganar músculo',
    short: 'Recomposición',
    description: 'Las dos cosas al tiempo: menos grasa y más músculo.',
    icon: 'autorenew',
    iconSet: 'mci',
    accent: 'secondary',
    focus:
      'Recomposición corporal: fuerza e hipertrofia como base, con cardio moderado ' +
      '(10-15 min) al cierre. Descansos de 60 s.',
  },
  {
    id: 'fuerza',
    label: 'Ganar fuerza',
    short: 'Fuerza',
    description: 'Levantar más peso en los movimientos grandes.',
    icon: 'weight-lifter',
    iconSet: 'mci',
    accent: 'primary',
    focus:
      'Fuerza: 4-6 repeticiones en los básicos, descansos largos (90-120 s), ' +
      'priorizar multiarticulares al inicio de la sesión.',
  },
  {
    id: 'marcar-abdomen',
    label: 'Marcar el abdomen',
    short: 'Abdomen',
    description: 'Definir la zona media junto con bajar grasa.',
    icon: 'stomach',
    iconSet: 'mci',
    accent: 'core',
    focus:
      'Incluir core en casi todas las sesiones (2-3 ejercicios) y cardio para bajar ' +
      'el porcentaje de grasa. Recordar que el abdomen se marca en la cocina.',
  },
  {
    id: 'gluteos-piernas',
    label: 'Glúteos y piernas',
    short: 'Tren inferior',
    description: 'Levantar glúteo y fortalecer las piernas.',
    icon: 'shoe-print',
    iconSet: 'mci',
    accent: 'pierna',
    focus:
      'Más frecuencia de tren inferior (al menos 2 sesiones), con énfasis en cadera ' +
      '(hip thrust, peso muerto rumano, puente de glúteo).',
  },
  {
    id: 'tren-superior',
    label: 'Pecho, brazos y hombros',
    short: 'Tren superior',
    description: 'Desarrollar la parte de arriba del cuerpo.',
    icon: 'arm-flex-outline',
    iconSet: 'mci',
    accent: 'hombro',
    focus:
      'Más volumen de empuje y tracción de tren superior, con trabajo directo de ' +
      'brazo. Mantener al menos una sesión de pierna a la semana.',
  },
  {
    id: 'resistencia',
    label: 'Mejorar la condición física',
    short: 'Resistencia',
    description: 'Cansarse menos en el día a día y aguantar más.',
    icon: 'run-fast',
    iconSet: 'mci',
    accent: 'success',
    focus:
      'Resistencia: circuitos, descansos cortos (30-45 s), repeticiones altas (15-20) ' +
      'y bloques de cardio más largos.',
  },
  {
    id: 'salud-habito',
    label: 'Salud y coger el hábito',
    short: 'Salud',
    description: 'Empezar sin matarse y volverlo costumbre.',
    icon: 'heart-pulse',
    iconSet: 'mci',
    accent: 'rest',
    focus:
      'Sesiones cortas (45 min máximo), ejercicios sencillos y en máquina, progresión ' +
      'suave. La prioridad es que la persona vuelva mañana, no que quede muerta hoy.',
  },
  {
    id: 'postura-espalda',
    label: 'Postura y espalda',
    short: 'Postura',
    description: 'Aliviar la espalda si pasa el día sentado.',
    icon: 'human-handsup',
    iconSet: 'mci',
    accent: 'espalda',
    focus:
      'Priorizar tracción horizontal, face pull, core anti-extensión y glúteo. ' +
      'Evitar cargas altas en columna hasta que domine la técnica.',
  },
]);

const GOALS_BY_ID = new Map(GOALS.map((g) => [g.id, g]));

export const GOAL_IDS = GOALS.map((g) => g.id);

export function getGoal(id) {
  return GOALS_BY_ID.get(id) ?? null;
}

/** Nivel de experiencia entrenando. */
export const LEVELS = Object.freeze([
  {
    id: 'principiante',
    label: 'Principiante',
    description: 'Nunca he entrenado o llevo menos de 3 meses.',
    icon: 'leaf-outline',
    iconSet: 'ion',
  },
  {
    id: 'intermedio',
    label: 'Intermedio',
    description: 'Llevo entre 3 meses y 2 años entrenando.',
    icon: 'flame-outline',
    iconSet: 'ion',
  },
  {
    id: 'avanzado',
    label: 'Avanzado',
    description: 'Más de 2 años entrenando de forma constante.',
    icon: 'trophy-outline',
    iconSet: 'ion',
  },
]);

export const LEVEL_IDS = LEVELS.map((l) => l.id);

/** Dónde entrena, para filtrar el catálogo de ejercicios. */
export const ENVIRONMENTS = Object.freeze([
  {
    id: 'gimnasio',
    label: 'En el gimnasio',
    description: 'Smart Fit o similar: máquinas, poleas, mancuernas y barras.',
    icon: 'barbell-outline',
    iconSet: 'ion',
  },
  {
    id: 'casa',
    label: 'En la casa con mancuernas',
    description: 'Tengo mancuernas o bandas y algo de espacio.',
    icon: 'home-outline',
    iconSet: 'ion',
  },
  {
    id: 'peso-corporal',
    label: 'Solo con mi peso',
    description: 'Sin equipo: solo mi cuerpo y una colchoneta.',
    icon: 'body-outline',
    iconSet: 'ion',
  },
]);

export const ENVIRONMENT_IDS = ENVIRONMENTS.map((e) => e.id);

/** Sexo, únicamente para calcular el gasto calórico estimado. */
export const SEXES = Object.freeze([
  { id: 'hombre', label: 'Hombre' },
  { id: 'mujer', label: 'Mujer' },
  { id: 'prefiero-no-decir', label: 'Prefiero no decir' },
]);

export const SEX_IDS = SEXES.map((s) => s.id);

/** Preferencias de alimentación para el plan de comidas. */
export const DIETS = Object.freeze([
  { id: 'de-todo', label: 'Como de todo', description: 'Sin restricciones.' },
  { id: 'sin-carne-roja', label: 'Sin carne roja', description: 'Pollo, pescado y huevo sí.' },
  { id: 'vegetariano', label: 'Vegetariano', description: 'Sin carne ni pescado.' },
  { id: 'vegano', label: 'Vegano', description: 'Nada de origen animal.' },
  { id: 'sin-lactosa', label: 'Sin lactosa', description: 'Evito la leche y sus derivados.' },
  { id: 'sin-gluten', label: 'Sin gluten', description: 'Evito trigo, cebada y centeno.' },
]);

export const DIET_IDS = DIETS.map((d) => d.id);

/** Días de la semana (1 = lunes … 7 = domingo), como los usa la app. */
export const WEEKDAYS = Object.freeze([
  { id: 1, label: 'Lunes', short: 'L' },
  { id: 2, label: 'Martes', short: 'M' },
  { id: 3, label: 'Miércoles', short: 'X' },
  { id: 4, label: 'Jueves', short: 'J' },
  { id: 5, label: 'Viernes', short: 'V' },
  { id: 6, label: 'Sábado', short: 'S' },
  { id: 7, label: 'Domingo', short: 'D' },
]);
