/**
 * Rutina, plan de comidas y progreso.
 *
 * Funciona primero contra el dispositivo y luego sincroniza:
 *   - la rutina y el plan de comidas se guardan en el celular al descargarlos,
 *     así la app abre al instante y sirve aunque no haya señal en el gimnasio;
 *   - el progreso se marca de una en local y se envía al servidor en segundo
 *     plano, para que no se pierda si cambia de celular.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { dayKey, weekdayIndex, currentWeekKeys } from '../utils/dates';
import * as endpoints from '../api/endpoints';
import { useAuth } from './AuthStore';

const CLAVE_CACHE = 'mi-entrenamiento:plan:v2';

/** Icono de cada día según el grupo muscular dominante. */
const ICONO_POR_ACENTO = {
  pecho: 'weight-lifter',
  espalda: 'arm-flex',
  pierna: 'run-fast',
  hombro: 'arm-flex-outline',
  brazo: 'dumbbell',
  core: 'ab-testing',
  cardio: 'fire',
  cuerpo: 'lightning-bolt',
  rest: 'power-sleep',
};

/**
 * Traduce un día del servidor al formato que usan las pantallas.
 * Las pantallas trabajan con `title/subtitle/accent/exercises`, así que la
 * conversión se hace una sola vez aquí y no en cada componente.
 */
function normalizarDia(dia) {
  return {
    day: dia.dia,
    title: dia.titulo,
    subtitle: dia.subtitulo ?? '',
    accent: dia.acento,
    icon: ICONO_POR_ACENTO[dia.acento] ?? 'dumbbell',
    rest: Boolean(dia.rest ?? dia.descanso),
    exercises: dia.ejercicios ?? [],
  };
}

function normalizarPlan(plan) {
  if (!plan?.dias) return null;
  return {
    nombre: plan.nombrePlan,
    resumen: plan.resumen,
    consejos: plan.consejos ?? [],
    dias: plan.dias.map(normalizarDia),
  };
}

const PlanContext = createContext(null);

const estadoInicial = { rutina: null, comidas: null, progreso: {}, overrides: {} };

export function PlanProvider({ children }) {
  const { autenticado, user } = useAuth();

  const [rutina, setRutina] = useState(null);
  const [origenRutina, setOrigenRutina] = useState(null);
  const [comidas, setComidas] = useState(null);
  const [progreso, setProgreso] = useState({});
  const [overrides, setOverrides] = useState({});

  const [hidratado, setHidratado] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [generandoRutina, setGenerandoRutina] = useState(false);

  // Evita disparar varias sincronizaciones a la vez.
  const sincronizando = useRef(false);
  const pollingRutina = useRef(null);

  // --- Persistencia local -------------------------------------------------

  useEffect(() => {
    (async () => {
      try {
        const crudo = await AsyncStorage.getItem(CLAVE_CACHE);
        if (crudo) {
          const guardado = { ...estadoInicial, ...JSON.parse(crudo) };
          setRutina(guardado.rutina);
          setOrigenRutina(guardado.origenRutina ?? null);
          setComidas(guardado.comidas);
          setProgreso(guardado.progreso);
          setOverrides(guardado.overrides);
        }
      } catch (err) {
        console.warn('No se pudo leer el plan guardado:', err?.message);
      } finally {
        setHidratado(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!hidratado) return;
    const datos = { rutina, origenRutina, comidas, progreso, overrides };
    AsyncStorage.setItem(CLAVE_CACHE, JSON.stringify(datos)).catch((err) =>
      console.warn('No se pudo guardar el plan:', err?.message),
    );
  }, [hidratado, rutina, origenRutina, comidas, progreso, overrides]);

  // --- Descarga desde el servidor ----------------------------------------

  const detenerPolling = useCallback(() => {
    if (pollingRutina.current) {
      clearInterval(pollingRutina.current);
      pollingRutina.current = null;
    }
  }, []);

  const iniciarPolling = useCallback(() => {
    if (pollingRutina.current) return;
    pollingRutina.current = setInterval(async () => {
      try {
        const res = await endpoints.rutina.obtener();
        if (res.routine?.plan) {
          setRutina(normalizarPlan(res.routine.plan));
          setOrigenRutina(res.routine.source);
          setGenerandoRutina(false);
          detenerPolling();
        }
      } catch {
        // Sin conexión: seguir intentando en el próximo tick.
      }
    }, 4000);
  }, [detenerPolling]);

  const descargar = useCallback(async () => {
    if (!autenticado) return;
    setCargando(true);
    setError(null);
    try {
      const [resRutina, resProgreso] = await Promise.all([
        endpoints.rutina.obtener(),
        endpoints.progreso.obtener(),
      ]);

      if (resRutina.routine?.plan) {
        setRutina(normalizarPlan(resRutina.routine.plan));
        setOrigenRutina(resRutina.routine.source);
        setGenerandoRutina(false);
        detenerPolling();
      } else {
        // La rutina aún se está generando en background: arrancar polling.
        setGenerandoRutina(true);
        iniciarPolling();
      }

      const desdeServidor = {};
      for (const dia of resProgreso.days ?? []) {
        desdeServidor[dia.dayKey] = {
          planDay: dia.planDay,
          status: dia.status,
          completed: dia.completed ?? {},
        };
      }
      // El servidor manda solo para los días que la app no tiene todavía:
      // lo marcado en el celular es lo más reciente.
      setProgreso((previo) => ({ ...desdeServidor, ...previo }));
    } catch (err) {
      // Sin conexión seguimos con lo que hay guardado: no es un error fatal.
      setError(err.esRed ? null : err.message);
    } finally {
      setCargando(false);
    }
  }, [autenticado, iniciarPolling, detenerPolling]);

  // Limpia el polling al desmontar el provider.
  useEffect(() => () => detenerPolling(), [detenerPolling]);

  useEffect(() => {
    if (hidratado && autenticado) descargar();
  }, [hidratado, autenticado, descargar]);

  // Al cerrar sesión se limpia todo para no mezclar datos entre cuentas.
  useEffect(() => {
    if (!autenticado && hidratado) {
      setRutina(null);
      setOrigenRutina(null);
      setComidas(null);
      setProgreso({});
      setOverrides({});
      setGenerandoRutina(false);
      detenerPolling();
      AsyncStorage.removeItem(CLAVE_CACHE).catch(() => {});
    }
  }, [autenticado, hidratado, detenerPolling]);

  // --- Sincronización del progreso ---------------------------------------

  const sincronizarProgreso = useCallback(
    async (estado) => {
      if (!autenticado || sincronizando.current) return;
      sincronizando.current = true;
      try {
        const days = Object.entries(estado).map(([dayKey, dia]) => ({
          dayKey,
          planDay: dia.planDay,
          status: dia.status,
          completed: dia.completed ?? {},
        }));
        if (days.length > 0) await endpoints.progreso.sincronizar(days);
      } catch {
        // Se reintentará en el siguiente cambio; no molestamos a la persona.
      } finally {
        sincronizando.current = false;
      }
    },
    [autenticado],
  );

  /** Aplica un cambio en local y lo manda al servidor sin bloquear la interfaz. */
  const actualizarProgreso = useCallback(
    (transformacion) => {
      setProgreso((previo) => {
        const siguiente = transformacion(previo);
        sincronizarProgreso(siguiente);
        return siguiente;
      });
    },
    [sincronizarProgreso],
  );

  // --- Consulta del día ---------------------------------------------------

  /** Qué rutina (1..7) toca en una fecha, respetando los días movidos. */
  const planDayPara = useCallback(
    (key, fecha) => overrides[key] ?? weekdayIndex(fecha),
    [overrides],
  );

  const getDayPlan = useCallback(
    (indice) => rutina?.dias.find((d) => d.day === indice) ?? null,
    [rutina],
  );

  /** Estado completo de un día: qué toca, cómo va y qué lleva marcado. */
  const getDay = useCallback(
    (key, fecha = new Date()) => {
      const guardado = progreso[key];
      const planDay = guardado?.planDay ?? planDayPara(key, fecha);
      const plan = getDayPlan(planDay);
      const esDescanso = Boolean(plan?.rest);

      return {
        key,
        planDay,
        status: guardado?.status ?? (esDescanso ? 'rest' : 'active'),
        completed: guardado?.completed ?? {},
        plan,
      };
    },
    [progreso, planDayPara, getDayPlan],
  );

  // --- Acciones -----------------------------------------------------------

  const toggleExercise = useCallback(
    (key, exerciseId, fecha = new Date()) => {
      actualizarProgreso((previo) => {
        const dia = previo[key] ?? {
          planDay: overrides[key] ?? weekdayIndex(fecha),
          status: 'active',
          completed: {},
        };

        const completed = { ...dia.completed };
        if (completed[exerciseId]) delete completed[exerciseId];
        else completed[exerciseId] = true;

        const plan = getDayPlan(dia.planDay);
        const total = plan?.exercises?.length ?? 0;
        const hechos = Object.keys(completed).length;
        const status = total > 0 && hechos >= total ? 'completed' : 'active';

        return { ...previo, [key]: { ...dia, completed, status } };
      });
    },
    [actualizarProgreso, overrides, getDayPlan],
  );

  const completeDay = useCallback(
    (key, fecha = new Date()) => {
      actualizarProgreso((previo) => {
        const planDay = previo[key]?.planDay ?? overrides[key] ?? weekdayIndex(fecha);
        const plan = getDayPlan(planDay);
        const completed = {};
        for (const ex of plan?.exercises ?? []) completed[ex.id] = true;
        return { ...previo, [key]: { planDay, status: 'completed', completed } };
      });
    },
    [actualizarProgreso, overrides, getDayPlan],
  );

  /**
   * Saltar el día.
   * @param {'skip'|'move'} modo 'move' corre la rutina de hoy para mañana.
   */
  const skipDay = useCallback(
    (key, modo, fecha = new Date()) => {
      const planDay = progreso[key]?.planDay ?? overrides[key] ?? weekdayIndex(fecha);

      actualizarProgreso((previo) => ({
        ...previo,
        [key]: { planDay, status: 'skipped', completed: {} },
      }));

      if (modo === 'move') {
        const manana = new Date(fecha);
        manana.setDate(fecha.getDate() + 1);
        setOverrides((previo) => ({ ...previo, [dayKey(manana)]: planDay }));
      }
    },
    [actualizarProgreso, progreso, overrides],
  );

  const resetDay = useCallback(
    (key) => {
      actualizarProgreso((previo) => {
        const siguiente = { ...previo };
        delete siguiente[key];
        return siguiente;
      });
    },
    [actualizarProgreso],
  );

  /**
   * Pone en descanso, en la rutina ya guardada, los días que la persona dejó
   * de marcar como entreno. Es local (no llama a la IA), así que se puede
   * disparar solo con cambiar el perfil, sin preguntar.
   */
  const sincronizarDiasDescanso = useCallback(async (trainingDays) => {
    try {
      const respuesta = await endpoints.rutina.actualizarDias(trainingDays);
      if (respuesta.routine?.plan) {
        setRutina(normalizarPlan(respuesta.routine.plan));
        setOrigenRutina(respuesta.routine.source);
      }
      return respuesta;
    } catch {
      // Sin conexión o sin rutina aún: no es grave, se sincroniza en el próximo intento.
      return null;
    }
  }, []);

  /** Cambia qué rutina le toca a cada día de la semana, sin tocar la IA. */
  const reordenarRutina = useCallback(async (order) => {
    const respuesta = await endpoints.rutina.reordenar(order);
    if (respuesta.routine?.plan) {
      setRutina(normalizarPlan(respuesta.routine.plan));
      setOrigenRutina(respuesta.routine.source);
    }
    return respuesta;
  }, []);

  /** Ejercicios que trabajan el mismo grupo muscular, para reemplazar uno del día. */
  const alternativasPara = useCallback(async (day, exerciseId) => {
    const respuesta = await endpoints.rutina.alternativas(day, exerciseId);
    return respuesta.alternativas ?? [];
  }, []);

  /** Cambia un ejercicio del día por otro equivalente, sin tocar la IA. */
  const reemplazarEjercicio = useCallback(async (day, exerciseId, replacementId) => {
    const respuesta = await endpoints.rutina.reemplazarEjercicio(day, exerciseId, replacementId);
    if (respuesta.routine?.plan) {
      setRutina(normalizarPlan(respuesta.routine.plan));
      setOrigenRutina(respuesta.routine.source);
    }
    return respuesta;
  }, []);

  /** Ejercicios del catálogo disponibles para agregar a un día. */
  const catalogoPara = useCallback(async (day) => {
    const respuesta = await endpoints.rutina.catalogoPara(day);
    return respuesta.catalogo ?? [];
  }, []);

  /** Agrega un ejercicio nuevo al día, sin tocar la IA. */
  const agregarEjercicio = useCallback(async (day, exerciseId) => {
    const respuesta = await endpoints.rutina.agregarEjercicio(day, exerciseId);
    if (respuesta.routine?.plan) {
      setRutina(normalizarPlan(respuesta.routine.plan));
      setOrigenRutina(respuesta.routine.source);
    }
    return respuesta;
  }, []);

  /** Quita un ejercicio del día, sin tocar la IA. */
  const quitarEjercicio = useCallback(async (day, exerciseId) => {
    const respuesta = await endpoints.rutina.quitarEjercicio(day, exerciseId);
    if (respuesta.routine?.plan) {
      setRutina(normalizarPlan(respuesta.routine.plan));
      setOrigenRutina(respuesta.routine.source);
    }
    return respuesta;
  }, []);

  /** Vuelve a pedirle la rutina a la IA con el perfil actual. */
  const regenerarRutina = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const respuesta = await endpoints.rutina.generar();
      setRutina(normalizarPlan(respuesta.routine.plan));
      setOrigenRutina(respuesta.routine.source);
      return respuesta;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setCargando(false);
    }
  }, []);

  /** Descarga el plan de comidas; lo genera si todavía no existe. */
  const cargarComidas = useCallback(async ({ forzar = false } = {}) => {
    setError(null);
    const existente = forzar ? null : await endpoints.comidas.obtener().catch(() => null);

    if (existente?.nutrition?.plan) {
      setComidas(existente.nutrition.plan);
      return existente.nutrition.plan;
    }

    const respuesta = await endpoints.comidas.generar();
    setComidas(respuesta.nutrition.plan);
    return respuesta.nutrition.plan;
  }, []);

  // --- Estadísticas -------------------------------------------------------

  /** Resumen de la semana en curso. */
  const weekStats = useCallback(
    (fecha = new Date()) => {
      const keys = currentWeekKeys(fecha);
      const lunes = new Date(fecha);
      lunes.setDate(fecha.getDate() - (weekdayIndex(fecha) - 1));

      let completados = 0;
      let saltados = 0;
      let descansos = 0;
      let diasEntreno = 0;

      keys.forEach((key, i) => {
        const dia = new Date(lunes);
        dia.setDate(lunes.getDate() + i);
        const estado = getDay(key, dia);

        if (estado.plan?.rest) {
          descansos++;
          return;
        }
        diasEntreno++;
        if (estado.status === 'completed') completados++;
        else if (estado.status === 'skipped') saltados++;
      });

      const actuados = completados + saltados;
      return {
        keys,
        todayKey: dayKey(fecha),
        completed: completados,
        skipped: saltados,
        restDays: descansos,
        trainingDays: diasEntreno,
        compliance: actuados > 0 ? Math.round((completados / actuados) * 100) : 0,
      };
    },
    [getDay],
  );

  /** Días entrenados seguidos. Los descansos no rompen la racha. */
  const streak = useCallback(
    (fecha = new Date()) => {
      let cuenta = 0;
      const cursor = new Date(fecha);

      for (let i = 0; i < 60; i++) {
        const key = dayKey(cursor);
        const dia = getDay(key, new Date(cursor));
        const esHoy = key === dayKey(fecha);

        if (dia.plan?.rest) {
          // Día de descanso: ni suma ni resta.
        } else if (dia.status === 'completed') {
          cuenta++;
        } else if (esHoy && dia.status === 'active') {
          // Hoy sigue en curso: no cuenta todavía, pero no rompe la racha.
        } else {
          break;
        }
        cursor.setDate(cursor.getDate() - 1);
      }
      return cuenta;
    },
    [getDay],
  );

  const valor = useMemo(
    () => ({
      rutina,
      origenRutina,
      comidas,
      hidratado,
      cargando,
      error,
      generandoRutina,
      tieneRutina: Boolean(rutina),
      nombre: user?.name ?? '',
      getDay,
      getDayPlan,
      toggleExercise,
      completeDay,
      skipDay,
      resetDay,
      regenerarRutina,
      sincronizarDiasDescanso,
      reordenarRutina,
      alternativasPara,
      reemplazarEjercicio,
      catalogoPara,
      agregarEjercicio,
      quitarEjercicio,
      cargarComidas,
      descargar,
      weekStats,
      streak,
    }),
    [
      rutina, origenRutina, comidas, hidratado, cargando, error, generandoRutina, user,
      getDay, getDayPlan, toggleExercise, completeDay, skipDay, resetDay,
      regenerarRutina, sincronizarDiasDescanso, reordenarRutina, alternativasPara, reemplazarEjercicio,
      catalogoPara, agregarEjercicio, quitarEjercicio,
      cargarComidas, descargar, weekStats, streak,
    ],
  );

  return <PlanContext.Provider value={valor}>{children}</PlanContext.Provider>;
}

export function usePlan() {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error('usePlan debe usarse dentro de <PlanProvider>');
  return ctx;
}
