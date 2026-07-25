/**
 * Icono SVG unificado para toda la app (sin emojis).
 * Envuelve @expo/vector-icons, que ya viene incluido con Expo, así que no
 * añade peso a la app. `set` elige la familia de iconos; por defecto usa
 * Ionicons, que cubre casi todo el lenguaje visual de la app.
 */
import React from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Feather from '@expo/vector-icons/Feather';
import { colors } from '../theme';

const SETS = {
  ion: Ionicons,
  mci: MaterialCommunityIcons,
  feather: Feather,
};

export default function Icon({ name, set = 'ion', size = 22, color = colors.text, style }) {
  const Cmp = SETS[set] || Ionicons;
  return <Cmp name={name} size={size} color={color} style={style} />;
}
