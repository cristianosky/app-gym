/**
 * Sesión de entrenamiento en curso.
 *
 * Vive aparte de la pantalla porque la sesión no se puede perder: se puede
 * minimizar para ver otra pestaña, el celular se puede bloquear y la app se
 * puede recargar; al volver, el entreno sigue donde iba. Por eso:
 *   - el estado se guarda en el celular en cada cambio,
 *   - los tiempos se guardan como instantes (Date.now()), no como segundos
 *     que haya que ir contando, así el descanso sigue corriendo con la app
 *     cerrada y al volver se ve el tiempo real.
 *
 * Fases: 'trabajo' → 'descanso' → 'trabajo' … y al acabar las series de un
 * ejercicio 'ejercicio-terminado' (espera a que la persona toque "Siguiente")
 * hasta llegar a 'fin'.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform, Vibration } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePlan } from './PlanStore';
import { useAuth } from './AuthStore';
import { dayKey } from '../utils/dates';
import { duracionDeReps, segundosDeDescanso } from '../utils/entrenamiento';

// Ojo: no reutilizar 'mi-entrenamiento:sesion:v1', que es la sesión del
// usuario en AuthStore. Esta clave guarda el entrenamiento en curso.
const CLAVE_CACHE = 'mi-entrenamiento:entrenamiento:v1';

/** Lo que suma el botón "+15 s" del descanso. */
export const DESCANSO_EXTRA = 15;

const vibrar = (patron) => {
  if (Platform.OS !== 'web') Vibration.vibrate(patron);
};

const SesionContext = createContext(null);

export function SesionProvider({ children }) {
  const { getDay, marcarEjercicio, completeDay, hidratado } = usePlan();
  const { autenticado } = useAuth();

  const [sesion, setSesion] = useState(null);
  const [hidratada, setHidratada] = useState(false);

  // Las acciones se disparan desde botones y temporizadores; leer el estado de
  // una referencia evita quedarse con una versión vieja por el cierre.
  const sesionRef = useRef(null);
  sesionRef.current = sesion;

  // --- Persistencia -------------------------------------------------------

  useEffect(() => {
    (async () => {
      try {
        const crudo = await AsyncStorage.getItem(CLAVE_CACHE);
        const guardada = crudo ? JSON.parse(crudo) : null;
        // Una sesión de otro día ya no sirve: cada día es su propio entreno.
        if (guardada?.key === dayKey(new Date())) setSesion(guardada);
      } catch (err) {
        console.warn('No se pudo leer la sesión guardada:', err?.message);
      } finally {
        setHidratada(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!hidratada) return;
    if (sesion) AsyncStorage.setItem(CLAVE_CACHE, JSON.stringify(sesion)).catch(() => {});
    else AsyncStorage.removeItem(CLAVE_CACHE).catch(() => {});
  }, [hidratada, sesion]);

  // Al cerrar sesión en la app no puede quedar un entreno colgado de otra cuenta.
  useEffect(() => {
    if (hidratada && !autenticado) setSesion(null);
  }, [hidratada, autenticado]);

  // --- Ejercicios de la sesión -------------------------------------------

  // Se guardan los ids, no los ejercicios: así los datos (series, reps, video)
  // salen siempre de la rutina vigente aunque se haya cambiado un ejercicio.
  const ejercicios = useMemo(() => {
    if (!sesion || !hidratado) return [];
    const dia = getDay(sesion.key);
    const porId = new Map((dia.plan?.exercises ?? []).map((ex) => [ex.id, ex]));
    return sesion.ids.map((id) => porId.get(id)).filter(Boolean);
  }, [sesion, getDay, hidratado]);

  const ejerciciosRef = useRef(ejercicios);
  ejerciciosRef.current = ejercicios;

  // --- Cambios de fase ----------------------------------------------------

  /** Estado de una fase de trabajo (con cuenta regresiva si las reps van por tiempo). */
  const conTrabajo = useCallback((s, indice, ahora) => {
    const duracion = duracionDeReps(ejerciciosRef.current[indice]?.reps);
    return {
      ...s,
      indice,
      fase: 'trabajo',
      inicioFase: ahora,
      finFase: duracion ? ahora + duracion * 1000 : null,
    };
  }, []);

  /** Estado de un descanso; si el ejercicio no lleva descanso, pasa derecho. */
  const conDescanso = useCallback((s, indice, segundos, ahora) => {
    if (segundos <= 0) return conTrabajo(s, indice, ahora);
    return { ...s, indice, fase: 'descanso', inicioFase: ahora, finFase: ahora + segundos * 1000 };
  }, [conTrabajo]);

  const iniciar = useCallback((key, listaEjercicios, completados = {}) => {
    const pendientes = listaEjercicios.filter((ex) => !completados[ex.id]);
    const ahora = Date.now();
    const base = {
      key,
      ids: pendientes.map((ex) => ex.id),
      indice: 0,
      serie: 1,
      inicio: ahora,
      abierta: true,
      cambio: false,
    };

    if (pendientes.length === 0) {
      setSesion({ ...base, fase: 'fin', inicioFase: ahora, finFase: null });
      return;
    }
    const duracion = duracionDeReps(pendientes[0].reps);
    setSesion({
      ...base,
      fase: 'trabajo',
      inicioFase: ahora,
      finFase: duracion ? ahora + duracion * 1000 : null,
    });
  }, []);

  /** Cierra la serie actual: descansa, o da el ejercicio por terminado. */
  const terminarSerie = useCallback(() => {
    const s = sesionRef.current;
    const lista = ejerciciosRef.current;
    if (!s || s.fase === 'fin' || s.fase === 'ejercicio-terminado') return;

    const ejercicio = lista[s.indice];
    if (!ejercicio) return;

    const ahora = Date.now();
    const totalSeries = Math.max(1, ejercicio.sets ?? 1);
    vibrar(40);

    if (s.serie < totalSeries) {
      const siguiente = { ...s, serie: s.serie + 1, cambio: false };
      setSesion(conDescanso(siguiente, s.indice, segundosDeDescanso(ejercicio), ahora));
      return;
    }

    // Última serie: el ejercicio queda marcado y se espera el "Siguiente".
    marcarEjercicio(s.key, ejercicio.id, true);
    vibrar([0, 120, 90, 220]);
    setSesion({ ...s, fase: 'ejercicio-terminado', inicioFase: ahora, finFase: null });
  }, [conDescanso, marcarEjercicio]);

  /** Botón "Siguiente" de la pantalla de ejercicio terminado. */
  const siguienteEjercicio = useCallback(() => {
    const s = sesionRef.current;
    const lista = ejerciciosRef.current;
    if (!s || s.fase !== 'ejercicio-terminado') return;

    const ahora = Date.now();
    const siguiente = s.indice + 1;
    if (siguiente >= lista.length) {
      setSesion({ ...s, fase: 'fin', inicioFase: ahora, finFase: null });
      return;
    }
    const base = { ...s, serie: 1, cambio: true };
    setSesion(conDescanso(base, siguiente, segundosDeDescanso(lista[s.indice]), ahora));
  }, [conDescanso]);

  /** Se acabó el tiempo de la fase: el descanso arranca la serie, el trabajo por tiempo la cierra. */
  const vencerFase = useCallback(() => {
    const s = sesionRef.current;
    if (!s?.finFase || Date.now() < s.finFase) return;

    if (s.fase === 'descanso') {
      vibrar([0, 90, 70, 90]);
      setSesion(conTrabajo(s, s.indice, Date.now()));
    } else if (s.fase === 'trabajo') {
      terminarSerie();
    }
  }, [conTrabajo, terminarSerie]);

  // Un solo temporizador, puesto justo para cuando vence la fase.
  useEffect(() => {
    if (!sesion?.finFase || ejercicios.length === 0) return;
    const id = setTimeout(vencerFase, Math.max(0, sesion.finFase - Date.now()));
    return () => clearTimeout(id);
  }, [sesion?.finFase, sesion?.fase, ejercicios.length, vencerFase]);

  // Al volver del segundo plano los temporizadores llegan tarde: se revisa a mano.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') vencerFase();
    });
    return () => sub.remove();
  }, [vencerFase]);

  // --- Acciones sueltas ---------------------------------------------------

  const sumarDescanso = useCallback(() => {
    const s = sesionRef.current;
    if (!s || s.fase !== 'descanso') return;
    setSesion({ ...s, finFase: (s.finFase ?? Date.now()) + DESCANSO_EXTRA * 1000 });
  }, []);

  const saltarDescanso = useCallback(() => {
    const s = sesionRef.current;
    if (!s || s.fase !== 'descanso') return;
    setSesion(conTrabajo(s, s.indice, Date.now()));
  }, [conTrabajo]);

  const abrir = useCallback(() => {
    const s = sesionRef.current;
    if (s) setSesion({ ...s, abierta: true });
  }, []);

  const minimizar = useCallback(() => {
    const s = sesionRef.current;
    if (s) setSesion({ ...s, abierta: false });
  }, []);

  /** Cierra la sesión dando el día por cumplido. */
  const terminar = useCallback(() => {
    const s = sesionRef.current;
    if (s) completeDay(s.key);
    setSesion(null);
  }, [completeDay]);

  /** Abandona la sesión; lo ya marcado se conserva. */
  const salir = useCallback(() => setSesion(null), []);

  const valor = useMemo(
    () => ({
      sesion,
      hidratada,
      activa: Boolean(sesion),
      abierta: Boolean(sesion?.abierta),
      ejercicios,
      actual: sesion ? ejercicios[sesion.indice] ?? null : null,
      proximo: sesion ? ejercicios[sesion.indice + 1] ?? null : null,
      iniciar,
      terminarSerie,
      siguienteEjercicio,
      sumarDescanso,
      saltarDescanso,
      abrir,
      minimizar,
      terminar,
      salir,
    }),
    [
      sesion, hidratada, ejercicios, iniciar, terminarSerie, siguienteEjercicio,
      sumarDescanso, saltarDescanso, abrir, minimizar, terminar, salir,
    ],
  );

  return <SesionContext.Provider value={valor}>{children}</SesionContext.Provider>;
}

export function useSesion() {
  const ctx = useContext(SesionContext);
  if (!ctx) throw new Error('useSesion debe usarse dentro de <SesionProvider>');
  return ctx;
}
