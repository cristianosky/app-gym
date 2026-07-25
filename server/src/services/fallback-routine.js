/**
 * Rutina de respaldo, armada por el servidor sin IA.
 *
 * Se usa cuando la API de Gemini falla o devuelve algo inválido: es preferible
 * entregar un plan sensato y decirle a la persona que es la versión básica, a
 * dejarla sin rutina. También sirve de red de seguridad para el primer arranque.
 *
 * La lógica es de plantillas por "cupos": cada día pide unos patrones de
 * movimiento y el motor busca en el catálogo el ejercicio que mejor encaje con
 * el sitio donde entrena y su nivel.
 */
import { exercisesForEnv } from '../data/catalog.js';

const NIVEL_ORDEN = { principiante: 0, intermedio: 1, avanzado: 2 };

/**
 * Plantillas por número de días de entrenamiento.
 * Cada cupo es `[grupo, patrón]`; `null` en el patrón significa "cualquiera".
 */
const PLANTILLAS = {
  1: [
    { titulo: 'Cuerpo completo', subtitulo: 'Toda la semana en una sesión', acento: 'cuerpo',
      cupos: [['pierna', 'rodilla'], ['pecho', 'empuje-horizontal'], ['espalda', 'traccion-vertical'],
              ['hombro', 'empuje-vertical'], ['pierna', 'cadera'], ['core', null], ['cardio', 'cardio']] },
  ],
  2: [
    { titulo: 'Cuerpo completo A', subtitulo: 'Empuje y pierna', acento: 'cuerpo',
      cupos: [['pierna', 'rodilla'], ['pecho', 'empuje-horizontal'], ['hombro', 'empuje-vertical'],
              ['brazo', 'aislamiento'], ['core', null], ['cardio', 'cardio']] },
    { titulo: 'Cuerpo completo B', subtitulo: 'Tracción y cadera', acento: 'espalda',
      cupos: [['pierna', 'cadera'], ['espalda', 'traccion-vertical'], ['espalda', 'traccion-horizontal'],
              ['brazo', 'aislamiento'], ['core', null], ['cardio', 'cardio']] },
  ],
  3: [
    { titulo: 'Empuje', subtitulo: 'Pecho, hombro y tríceps', acento: 'pecho',
      cupos: [['pecho', 'empuje-horizontal'], ['pecho', 'empuje-horizontal'], ['hombro', 'empuje-vertical'],
              ['hombro', 'aislamiento'], ['brazo', 'aislamiento'], ['cardio', 'cardio']] },
    { titulo: 'Tracción', subtitulo: 'Espalda y bíceps', acento: 'espalda',
      cupos: [['espalda', 'traccion-vertical'], ['espalda', 'traccion-horizontal'], ['espalda', 'traccion-horizontal'],
              ['brazo', 'aislamiento'], ['core', null], ['cardio', 'cardio']] },
    { titulo: 'Pierna', subtitulo: 'Cuádriceps, glúteo e isquios', acento: 'pierna',
      cupos: [['pierna', 'rodilla'], ['pierna', 'cadera'], ['pierna', 'rodilla'],
              ['pierna', 'aislamiento'], ['core', null], ['cardio', 'cardio']] },
  ],
  4: [
    { titulo: 'Pecho y tríceps', subtitulo: 'Empuje horizontal', acento: 'pecho',
      cupos: [['pecho', 'empuje-horizontal'], ['pecho', 'empuje-horizontal'], ['pecho', 'aislamiento'],
              ['brazo', 'aislamiento'], ['brazo', 'aislamiento'], ['cardio', 'cardio']] },
    { titulo: 'Espalda y bíceps', subtitulo: 'Tracción completa', acento: 'espalda',
      cupos: [['espalda', 'traccion-vertical'], ['espalda', 'traccion-horizontal'], ['espalda', 'traccion-horizontal'],
              ['brazo', 'aislamiento'], ['brazo', 'aislamiento'], ['cardio', 'cardio']] },
    { titulo: 'Pierna y glúteo', subtitulo: 'Tren inferior', acento: 'pierna',
      cupos: [['pierna', 'rodilla'], ['pierna', 'cadera'], ['pierna', 'rodilla'],
              ['pierna', 'aislamiento'], ['pierna', 'aislamiento'], ['core', null]] },
    { titulo: 'Hombro y core', subtitulo: 'Deltoides y zona media', acento: 'hombro',
      cupos: [['hombro', 'empuje-vertical'], ['hombro', 'aislamiento'], ['hombro', 'aislamiento'],
              ['core', null], ['core', null], ['cardio', 'cardio']] },
  ],
  5: [
    { titulo: 'Pecho y tríceps', subtitulo: 'Empuje horizontal', acento: 'pecho',
      cupos: [['pecho', 'empuje-horizontal'], ['pecho', 'empuje-horizontal'], ['pecho', 'aislamiento'],
              ['brazo', 'aislamiento'], ['brazo', 'aislamiento'], ['cardio', 'cardio']] },
    { titulo: 'Espalda y bíceps', subtitulo: 'Tracción completa', acento: 'espalda',
      cupos: [['espalda', 'traccion-vertical'], ['espalda', 'traccion-horizontal'], ['espalda', 'traccion-horizontal'],
              ['brazo', 'aislamiento'], ['brazo', 'aislamiento'], ['cardio', 'cardio']] },
    { titulo: 'Pierna y glúteo', subtitulo: 'Tren inferior completo', acento: 'pierna',
      cupos: [['pierna', 'rodilla'], ['pierna', 'cadera'], ['pierna', 'rodilla'],
              ['pierna', 'aislamiento'], ['pierna', 'aislamiento'], ['core', null]] },
    { titulo: 'Hombro y abdomen', subtitulo: 'Deltoides y core', acento: 'hombro',
      cupos: [['hombro', 'empuje-vertical'], ['hombro', 'aislamiento'], ['hombro', 'aislamiento'],
              ['core', null], ['core', null], ['cardio', 'cardio']] },
    { titulo: 'Cuerpo completo', subtitulo: 'Repaso y quema', acento: 'cuerpo',
      cupos: [['pierna', 'cadera'], ['pecho', 'empuje-horizontal'], ['espalda', 'traccion-vertical'],
              ['hombro', 'aislamiento'], ['core', null], ['cardio', 'cardio']] },
  ],
  6: [
    { titulo: 'Empuje A', subtitulo: 'Pecho, hombro y tríceps', acento: 'pecho',
      cupos: [['pecho', 'empuje-horizontal'], ['hombro', 'empuje-vertical'], ['pecho', 'aislamiento'],
              ['hombro', 'aislamiento'], ['brazo', 'aislamiento'], ['cardio', 'cardio']] },
    { titulo: 'Tracción A', subtitulo: 'Espalda y bíceps', acento: 'espalda',
      cupos: [['espalda', 'traccion-vertical'], ['espalda', 'traccion-horizontal'], ['espalda', 'aislamiento'],
              ['brazo', 'aislamiento'], ['brazo', 'aislamiento'], ['core', null]] },
    { titulo: 'Pierna A', subtitulo: 'Cuádriceps dominante', acento: 'pierna',
      cupos: [['pierna', 'rodilla'], ['pierna', 'rodilla'], ['pierna', 'cadera'],
              ['pierna', 'aislamiento'], ['core', null], ['cardio', 'cardio']] },
    { titulo: 'Empuje B', subtitulo: 'Volumen de hombro', acento: 'hombro',
      cupos: [['hombro', 'empuje-vertical'], ['pecho', 'empuje-horizontal'], ['hombro', 'aislamiento'],
              ['hombro', 'aislamiento'], ['brazo', 'aislamiento'], ['cardio', 'cardio']] },
    { titulo: 'Tracción B', subtitulo: 'Espesor de espalda', acento: 'espalda',
      cupos: [['espalda', 'traccion-horizontal'], ['espalda', 'traccion-vertical'], ['espalda', 'traccion-horizontal'],
              ['brazo', 'aislamiento'], ['core', null], ['cardio', 'cardio']] },
    { titulo: 'Pierna B', subtitulo: 'Glúteo e isquios', acento: 'pierna',
      cupos: [['pierna', 'cadera'], ['pierna', 'cadera'], ['pierna', 'aislamiento'],
              ['pierna', 'aislamiento'], ['core', null], ['cardio', 'cardio']] },
  ],
};

PLANTILLAS[7] = [...PLANTILLAS[6], PLANTILLAS[1][0]];

/** Series, repeticiones y descanso según el objetivo principal. */
function prescripcion(objetivoPrincipal, ejercicio) {
  if (ejercicio.group === 'cardio') {
    return { sets: 1, reps: objetivoPrincipal === 'bajar-grasa' ? '15 min' : '10 min', rest: 0 };
  }
  if (ejercicio.group === 'core') {
    return { sets: 3, reps: ejercicio.pattern === 'anti-extension' ? '40 s' : '15', rest: 45 };
  }

  switch (objetivoPrincipal) {
    case 'fuerza':
      return { sets: 4, reps: ejercicio.compound ? '5-6' : '8-10', rest: ejercicio.compound ? 120 : 75 };
    case 'bajar-grasa':
    case 'resistencia':
      return { sets: 3, reps: '15', rest: 45 };
    case 'ganar-musculo':
      return { sets: 4, reps: ejercicio.compound ? '8-10' : '10-12', rest: 75 };
    case 'salud-habito':
      return { sets: 3, reps: '12', rest: 60 };
    default:
      return { sets: ejercicio.compound ? 4 : 3, reps: '10-12', rest: 60 };
  }
}

/** Grupos con los que se puede sustituir un cupo cuando no hay del pedido. */
const GRUPOS_CERCANOS = {
  pecho: ['hombro', 'brazo'],
  hombro: ['pecho', 'brazo'],
  brazo: ['pecho', 'espalda', 'hombro'],
  espalda: ['brazo', 'hombro'],
  pierna: ['core'],
  core: ['pierna'],
  cardio: ['core'],
};

/** Ordena candidatos: primero los del nivel de la persona, luego compuestos. */
function ordenarPorAptitud(candidatos, techo) {
  return candidatos.slice().sort((a, b) => {
    const aptoA = NIVEL_ORDEN[a.level] <= techo ? 0 : 1;
    const aptoB = NIVEL_ORDEN[b.level] <= techo ? 0 : 1;
    if (aptoA !== aptoB) return aptoA - aptoB;
    return Number(b.compound) - Number(a.compound);
  });
}

/**
 * Escoge el ejercicio del catálogo que mejor llena un cupo.
 *
 * Va relajando el criterio hasta encontrar algo, porque en entornos con poco
 * equipo (entrenar solo con el peso del cuerpo) puede que no exista ningún
 * ejercicio del patrón exacto que pide la plantilla. Es mejor sustituirlo por
 * uno cercano que dejar el día corto.
 */
function escoger(disponibles, [grupo, patron], nivel, yaUsados) {
  const techo = NIVEL_ORDEN[nivel] ?? 0;
  const libres = disponibles.filter((ex) => !yaUsados.has(ex.id));

  const intentos = [
    // 1. Grupo y patrón exactos.
    (ex) => ex.group === grupo && (!patron || ex.pattern === patron),
    // 2. El grupo pedido, con cualquier patrón.
    (ex) => ex.group === grupo,
    // 3. Un grupo cercano.
    (ex) => (GRUPOS_CERCANOS[grupo] ?? []).includes(ex.group),
  ];

  for (const filtro of intentos) {
    const candidatos = ordenarPorAptitud(libres.filter(filtro), techo);
    if (candidatos.length > 0) return candidatos[0];
  }

  return null;
}

/**
 * Arma un plan completo sin usar IA.
 * @param {object} perfil perfil validado del usuario
 * @returns {object} plan con la misma forma que el generado por la IA
 */
/**
 * Escoge la familia de plantillas.
 *
 * Con poco equipo (entrenar solo con el peso del cuerpo) el catálogo no da
 * para un split de empuje/tracción/pierna: no hay suficientes ejercicios por
 * grupo. En ese caso se rota cuerpo completo A/B, que además es lo correcto
 * a nivel de entrenamiento.
 */
function escogerPlantilla(disponibles, cantidadDias) {
  const CATALOGO_MINIMO_PARA_SPLIT = 16;

  if (disponibles.length < CATALOGO_MINIMO_PARA_SPLIT) {
    return cantidadDias === 1 ? PLANTILLAS[1] : PLANTILLAS[2];
  }
  return PLANTILLAS[Math.min(cantidadDias, 7)] ?? PLANTILLAS[3];
}

export function buildFallbackRoutine(perfil) {
  const disponibles = exercisesForEnv(perfil.environment);
  const diasEntreno = perfil.trainingDays;
  const plantilla = escogerPlantilla(disponibles, diasEntreno.length);
  const objetivoPrincipal = perfil.goals[0];

  const dias = [];
  let indicePlantilla = 0;

  for (let dia = 1; dia <= 7; dia++) {
    if (!diasEntreno.includes(dia)) {
      dias.push({ dia, titulo: 'Descanso', subtitulo: 'Recuperación', acento: 'rest', descanso: true, ejercicios: [] });
      continue;
    }

    const sesion = plantilla[indicePlantilla % plantilla.length];
    indicePlantilla++;

    const usados = new Set();
    const ejercicios = [];

    for (const cupo of sesion.cupos) {
      const ejercicio = escoger(disponibles, cupo, perfil.level, usados);
      if (!ejercicio) continue;
      usados.add(ejercicio.id);
      ejercicios.push({ exerciseId: ejercicio.id, note: '', ...prescripcion(objetivoPrincipal, ejercicio) });
    }

    dias.push({
      dia,
      titulo: sesion.titulo,
      subtitulo: sesion.subtitulo,
      acento: sesion.acento,
      descanso: false,
      ejercicios,
    });
  }

  return {
    nombrePlan: 'Plan base',
    resumen:
      'Esta es la versión básica de su rutina, armada con la plantilla del entrenador. ' +
      'Cuando el asistente vuelva a estar disponible, puede regenerarla para que quede ' +
      'ajustada al detalle a sus objetivos.',
    consejos: [
      'Anote el peso que usa en cada ejercicio: si esta semana hizo 12 repeticiones limpias, la otra suba un poquito.',
      'Descanse el tiempo indicado. Si se queda charlando entre series pierde el estímulo.',
      'Antes de subir peso, asegúrese de que la técnica esté bien: mejor liviano y bien hecho.',
      'Duerma 7 u 8 horas: el músculo no crece en el gimnasio, crece cuando descansa.',
    ],
    dias,
  };
}
