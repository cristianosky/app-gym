/**
 * Todas las llamadas a la API, en un solo sitio.
 * Las pantallas nunca escriben rutas a mano.
 */
import { api } from './client';
import { TIMEOUTS } from '../config';

export const auth = {
  /** Catálogos de objetivos, niveles, etc. para el registro. */
  opciones: () => api.get('/api/options', { auth: false }),

  /** Paso 1 del ingreso: ¿existe este usuario? */
  verificarUsuario: (username) => api.post('/api/auth/check-username', { username }, { auth: false }),

  /** Crea la cuenta y devuelve el token. La rutina se genera en background. */
  registrar: (datos) => api.post('/api/auth/register', datos, { auth: false }),

  ingresar: (username, pin) => api.post('/api/auth/login', { username, pin }, { auth: false }),
};

export const perfil = {
  obtener: () => api.get('/api/me'),
  actualizar: (profile) => api.patch('/api/me/profile', profile),
  cambiarPin: (currentPin, newPin) => api.post('/api/me/pin', { currentPin, newPin }),
};

export const rutina = {
  obtener: () => api.get('/api/routine'),
  generar: () => api.post('/api/routine/generate', undefined, { timeout: TIMEOUTS.ia }),
  actualizarDias: (trainingDays) => api.patch('/api/routine/days', { trainingDays }),
};

export const comidas = {
  obtener: () => api.get('/api/nutrition'),
  generar: () => api.post('/api/nutrition/generate', undefined, { timeout: TIMEOUTS.ia }),
};

export const asistente = {
  historial: () => api.get('/api/chat'),
  preguntar: (message, images = []) =>
    api.post('/api/chat', { message, images }, { timeout: TIMEOUTS.ia }),
  limpiar: () => api.delete('/api/chat'),
};

export const progreso = {
  obtener: () => api.get('/api/progress'),
  sincronizar: (days) => api.put('/api/progress', { days }),
};
