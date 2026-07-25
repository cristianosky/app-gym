/**
 * Sistema de diseño central de la app "Mi Entrenamiento".
 *
 * Paleta OLED energética (naranja de acción + cian eléctrico de apoyo)
 * sobre fondo casi negro, pensada para máximo contraste y legibilidad
 * bajo las luces del gimnasio y con poco brillo de pantalla.
 *
 * Tipografía deportiva: Barlow Condensed para titulares (alta densidad,
 * carácter atlético) y Barlow para texto de lectura.
 */

export const colors = {
  // Fondos (escala OLED: cada nivel se distingue ~2-3% en luminosidad)
  bg: '#080B12',
  bgElevated: '#0D121C',
  surface: '#141A26',
  surfaceAlt: '#1C2436',
  surfaceHigh: '#252F46',
  border: '#262F44',
  borderStrong: '#38455F',

  // Texto
  text: '#F5F7FA',
  textMuted: '#9AA7BD',
  textFaint: '#5E6B84',
  onPrimary: '#0A0806',

  // Acentos principales
  primary: '#FF6B35',      // Naranja energético — CTA principal, foco de hoy
  primaryDark: '#D9491C',
  primarySoft: '#FF8F63',
  secondary: '#22D3EE',    // Cian eléctrico — información / apoyo
  secondaryDark: '#0E7490',
  accent: '#A855F7',       // Violeta — insignias / logros

  // Estados
  success: '#34D399',
  successDark: '#0F9D6B',
  warning: '#FBBF24',
  danger: '#FB7185',
  rest: '#60A5FA',

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

/** Añade un canal alfa (00–FF) a un color hexadecimal de 6 dígitos. */
export function alpha(hex, opacity) {
  const a = Math.round(Math.max(0, Math.min(1, opacity)) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${a}`;
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 40,
};

export const radius = {
  sm: 12,
  md: 18,
  lg: 24,
  xl: 28,
  pill: 999,
};

/** Familias tipográficas cargadas vía @expo-google-fonts. */
export const family = {
  displayBlack: 'BarlowCondensed_800ExtraBold',
  display: 'BarlowCondensed_700Bold',
  displaySemi: 'BarlowCondensed_600SemiBold',
  body: 'Barlow_400Regular',
  bodyMedium: 'Barlow_500Medium',
  bodySemi: 'Barlow_600SemiBold',
  bodyBold: 'Barlow_700Bold',
};

export const font = {
  // Tamaños con jerarquía clara para lectura rápida en el celular
  display: 40,
  h1: 30,
  h2: 23,
  h3: 18,
  body: 15,
  small: 13,
  tiny: 11,
};

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.32,
    shadowRadius: 14,
    elevation: 6,
  },
  raised: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 22,
    elevation: 10,
  },
  glow: (color) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 6,
  }),
};

/** Duraciones estándar de transición/micro-interacción (ms). */
export const motion = {
  fast: 150,
  base: 220,
  slow: 320,
};

export const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 };
