/**
 * Sesión del usuario.
 *
 * Guarda el token y el perfil en el dispositivo para que la persona no tenga
 * que volver a ingresar cada vez que abre la app. El PIN nunca se guarda.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setToken } from '../api/client';
import * as endpoints from '../api/endpoints';

const CLAVE_SESION = 'mi-entrenamiento:sesion:v1';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(null);
  const [cargando, setCargando] = useState(true);

  /** Deja la sesión activa tanto en memoria como en el disco. */
  const guardarSesion = useCallback(async (nuevoToken, nuevoUser) => {
    setToken(nuevoToken);
    setTokenState(nuevoToken);
    setUser(nuevoUser);
    try {
      await AsyncStorage.setItem(CLAVE_SESION, JSON.stringify({ token: nuevoToken, user: nuevoUser }));
    } catch (error) {
      console.warn('No se pudo guardar la sesión:', error?.message);
    }
  }, []);

  const cerrarSesion = useCallback(async () => {
    setToken(null);
    setTokenState(null);
    setUser(null);
    try {
      await AsyncStorage.removeItem(CLAVE_SESION);
    } catch (error) {
      console.warn('No se pudo borrar la sesión:', error?.message);
    }
  }, []);

  // Al abrir la app: recuperar la sesión guardada y confirmar que sigue viva.
  useEffect(() => {
    (async () => {
      try {
        const crudo = await AsyncStorage.getItem(CLAVE_SESION);
        if (!crudo) return;

        const { token: guardado, user: usuarioGuardado } = JSON.parse(crudo);
        if (!guardado) return;

        // Mostramos de una la sesión guardada para no dejar la app en blanco...
        setToken(guardado);
        setTokenState(guardado);
        setUser(usuarioGuardado);

        // ...y en segundo plano confirmamos que el token siga siendo válido.
        try {
          const { user: fresco } = await endpoints.perfil.obtener();
          setUser(fresco);
          await AsyncStorage.setItem(CLAVE_SESION, JSON.stringify({ token: guardado, user: fresco }));
        } catch (error) {
          // Token vencido o cuenta borrada: se cierra sesión. Si fue un fallo
          // de red, se conserva para poder usar la app sin conexión.
          if (error?.status === 401) await cerrarSesion();
        }
      } catch (error) {
        console.warn('No se pudo restaurar la sesión:', error?.message);
      } finally {
        setCargando(false);
      }
    })();
  }, [cerrarSesion]);

  const registrar = useCallback(
    async (datos) => {
      const respuesta = await endpoints.auth.registrar(datos);
      await guardarSesion(respuesta.token, respuesta.user);
      return respuesta;
    },
    [guardarSesion],
  );

  const ingresar = useCallback(
    async (username, pin) => {
      const respuesta = await endpoints.auth.ingresar(username, pin);
      await guardarSesion(respuesta.token, respuesta.user);
      return respuesta;
    },
    [guardarSesion],
  );

  const actualizarPerfil = useCallback(
    async (profile) => {
      const respuesta = await endpoints.perfil.actualizar(profile);
      await guardarSesion(token, respuesta.user);
      return respuesta;
    },
    [guardarSesion, token],
  );

  const valor = useMemo(
    () => ({
      user,
      token,
      cargando,
      autenticado: Boolean(token && user),
      registrar,
      ingresar,
      cerrarSesion,
      actualizarPerfil,
    }),
    [user, token, cargando, registrar, ingresar, cerrarSesion, actualizarPerfil],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
