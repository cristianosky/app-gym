/**
 * Sistema de diseño central de la app.
 * Paleta oscura con acentos energéticos, pensada para buen contraste
 * y legibilidad bajo las luces del gimnasio.
 */

export const colors = {
  // Fondos
  bg: '#0B1120',          // Fondo principal (azul casi negro)
  surface: '#151E32',     // Tarjetas
  surfaceAlt: '#1E2A44',  // Tarjetas secundarias / inputs
  border: '#26334D',

  // Texto
  text: '#F1F5F9',        // Texto principal
  textMuted: '#94A3B8',   // Texto secundario
  textFaint: '#64748B',   // Texto terciario

  // Acentos
  primary: '#22D3EE',     // Cian eléctrico (acción principal)
  primaryDark: '#0E7490',
  accent: '#A855F7',      // Violeta (energía)
  success: '#34D399',     // Verde (completado)
  warning: '#FBBF24',     // Ámbar (saltar)
  danger: '#FB7185',      // Rosa/rojo (peligro)
  rest: '#60A5FA',        // Azul suave (descanso)

  // Por grupo muscular (acentos de tarjeta)
  pecho: '#F472B6',
  espalda: '#38BDF8',
  pierna: '#A3E635',
  hombro: '#FB923C',
  brazo: '#C084FC',
  core: '#FBBF24',
  cardio: '#F87171',
  cuerpo: '#2DD4BF',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  pill: 999,
};

export const font = {
  // Tamaños con buena jerarquía para lectura rápida en el celular
  h1: 28,
  h2: 22,
  h3: 18,
  body: 15,
  small: 13,
  tiny: 11,
};

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
};
