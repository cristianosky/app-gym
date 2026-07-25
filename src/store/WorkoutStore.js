/**
 * Estado global de la app + persistencia en el dispositivo (AsyncStorage).
 *
 * Recuerda, aunque cierres la app:
 *   - qué ejercicios marcaste como completados en cada día
 *   - qué días completaste, saltaste o moviste
 *   - los overrides de plan cuando mueves una rutina al día siguiente
 *
 * Modelo persistido (clave única "mi-entrenamiento:v1"):
 * {
 *   days: {
 *     "2026-06-26": {
 *       planDay: 5,                 // qué rutina corresponde a ese día
 *       status: 'active'|'completed'|'skipped'|'rest',
 *       completed: { [exerciseId]: true }
 *     }
 *   },
 *   overrides: { "2026-06-27": 5 }   // rutina forzada para una fecha (al mover)
 * }
 */

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { dayKey, weekdayIndex, currentWeekKeys } from '../utils/dates';
import { getDayPlan } from '../data/routine';

const STORAGE_KEY = 'mi-entrenamiento:v1';
const WorkoutContext = createContext(null);

const emptyState = { days: {}, overrides: {} };

export function WorkoutProvider({ children }) {
  const [state, setState] = useState(emptyState);
  const [hydrated, setHydrated] = useState(false);

  // Cargar al iniciar
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setState({ ...emptyState, ...JSON.parse(raw) });
      } catch (e) {
        // Si el storage falla, arrancamos limpio (no rompemos la app)
        console.warn('No se pudo cargar el progreso:', e?.message);
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  // Guardar en cada cambio (una vez hidratado)
  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch((e) =>
      console.warn('No se pudo guardar el progreso:', e?.message),
    );
  }, [state, hydrated]);

  /** Qué rutina (1..7) corresponde a una fecha, respetando overrides. */
  function planDayForKey(key, date) {
    if (state.overrides[key]) return state.overrides[key];
    return weekdayIndex(date);
  }

  /** Estado de un día (con valores por defecto si nunca se tocó). */
  function getDay(key, date = new Date()) {
    const existing = state.days[key];
    const planDay = existing?.planDay ?? planDayForKey(key, date);
    const plan = getDayPlan(planDay);
    const isRest = !!plan?.rest;
    return {
      key,
      planDay,
      status: existing?.status ?? (isRest ? 'rest' : 'active'),
      completed: existing?.completed ?? {},
      plan,
    };
  }

  /** Marca/desmarca un ejercicio como hecho. */
  function toggleExercise(key, exerciseId, date = new Date()) {
    setState((prev) => {
      const day = prev.days[key] ?? {
        planDay: prev.overrides[key] ?? weekdayIndex(date),
        status: 'active',
        completed: {},
      };
      const completed = { ...day.completed };
      if (completed[exerciseId]) delete completed[exerciseId];
      else completed[exerciseId] = true;

      // Si completa todos los ejercicios → día completado
      const plan = getDayPlan(day.planDay);
      const total = plan?.exercises?.length ?? 0;
      const done = Object.keys(completed).length;
      const status = total > 0 && done >= total ? 'completed' : 'active';

      return { ...prev, days: { ...prev.days, [key]: { ...day, completed, status } } };
    });
  }

  /** Marca el día entero como completado (botón "Terminar entrenamiento"). */
  function completeDay(key, date = new Date()) {
    setState((prev) => {
      const planDay = prev.days[key]?.planDay ?? prev.overrides[key] ?? weekdayIndex(date);
      const plan = getDayPlan(planDay);
      const completed = {};
      (plan?.exercises ?? []).forEach((ex) => (completed[ex.id] = true));
      return { ...prev, days: { ...prev.days, [key]: { planDay, status: 'completed', completed } } };
    });
  }

  /**
   * Saltar el día de hoy.
   * @param {'skip'|'move'} mode
   *   'skip' → marca saltado y mañana sigue su rutina normal.
   *   'move' → marca saltado y mueve la rutina de hoy al día siguiente (override).
   */
  function skipDay(key, mode, date = new Date()) {
    setState((prev) => {
      const planDay = prev.days[key]?.planDay ?? prev.overrides[key] ?? weekdayIndex(date);
      const next = { ...prev, days: { ...prev.days, [key]: { planDay, status: 'skipped', completed: {} } } };

      if (mode === 'move') {
        const tomorrow = new Date(date);
        tomorrow.setDate(date.getDate() + 1);
        const tKey = dayKey(tomorrow);
        next.overrides = { ...prev.overrides, [tKey]: planDay };
      }
      return next;
    });
  }

  /** Reinicia el progreso de un día (volver a "activo"). */
  function resetDay(key) {
    setState((prev) => {
      const days = { ...prev.days };
      delete days[key];
      return { ...prev, days };
    });
  }

  /** Estadísticas de la semana actual. */
  function weekStats(date = new Date()) {
    const keys = currentWeekKeys(date);
    const todayKey = dayKey(date);
    let completed = 0, skipped = 0, restDays = 0, trainingDays = 0;

    keys.forEach((k, i) => {
      // Fecha real de esa casilla (Lunes + i)
      const d = new Date(date);
      d.setDate(date.getDate() - (weekdayIndex(date) - 1) + i);
      const day = getDay(k, d);
      if (day.plan?.rest) { restDays++; return; }
      trainingDays++;
      if (day.status === 'completed') completed++;
      else if (day.status === 'skipped') skipped++;
    });

    const acted = completed + skipped;
    const compliance = acted > 0 ? Math.round((completed / acted) * 100) : 0;
    return { keys, todayKey, completed, skipped, restDays, trainingDays, compliance };
  }

  /** Racha de días entrenados consecutivos (los descansos no la rompen). */
  function streak(date = new Date()) {
    let count = 0;
    const cursor = new Date(date);
    // Empezamos hoy y vamos hacia atrás
    for (let i = 0; i < 60; i++) {
      const k = dayKey(cursor);
      const day = getDay(k, new Date(cursor));
      const isToday = k === dayKey(date);

      if (day.plan?.rest) {
        // Día de descanso: neutral, no suma ni rompe
      } else if (day.status === 'completed') {
        count++;
      } else if (isToday && day.status === 'active') {
        // Hoy todavía en curso: no cuenta pero no rompe la racha
      } else {
        break; // día de entreno saltado o no hecho → corta la racha
      }
      cursor.setDate(cursor.getDate() - 1);
    }
    return count;
  }

  const value = useMemo(
    () => ({ state, hydrated, getDay, toggleExercise, completeDay, skipDay, resetDay, weekStats, streak }),
    [state, hydrated],
  );

  return <WorkoutContext.Provider value={value}>{children}</WorkoutContext.Provider>;
}

export function useWorkout() {
  const ctx = useContext(WorkoutContext);
  if (!ctx) throw new Error('useWorkout debe usarse dentro de <WorkoutProvider>');
  return ctx;
}
