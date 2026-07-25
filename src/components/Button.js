/**
 * Botones de la app.
 *
 * Todos cumplen el mínimo de 52 px de alto para que se puedan tocar cómodo con
 * una mano en el gimnasio, y bloquean el toque mientras hay algo cargando para
 * que nadie mande la misma petición dos veces.
 */
import React from 'react';
import { Pressable, Text, ActivityIndicator, StyleSheet, View } from 'react-native';
import { colors, radius, spacing, font, family, alpha } from '../theme';
import Icon from './Icon';

/**
 * @param {object} props
 * @param {'primary'|'secondary'|'ghost'|'danger'} [props.variant]
 */
export default function Button({
  label,
  onPress,
  icon,
  iconSet = 'ion',
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  accent,
}) {
  const bloqueado = disabled || loading;
  const paleta = colorePorVariante(variant, accent);

  return (
    <Pressable
      onPress={bloqueado ? undefined : onPress}
      disabled={bloqueado}
      accessibilityRole="button"
      accessibilityState={{ disabled: bloqueado, busy: loading }}
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.base,
        paleta.contenedor,
        pressed && !bloqueado && styles.pressed,
        bloqueado && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={paleta.texto} size="small" />
      ) : (
        <View style={styles.contenido}>
          {icon && <Icon name={icon} set={iconSet} size={19} color={paleta.texto} />}
          <Text style={[styles.texto, { color: paleta.texto }]} numberOfLines={1}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

function colorePorVariante(variant, accent) {
  const principal = accent ?? colors.primary;

  switch (variant) {
    case 'secondary':
      return {
        contenedor: { backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border },
        texto: colors.text,
      };
    case 'ghost':
      return { contenedor: { backgroundColor: 'transparent' }, texto: colors.textMuted };
    case 'danger':
      return {
        contenedor: {
          backgroundColor: alpha(colors.danger, 0.12),
          borderWidth: 1,
          borderColor: alpha(colors.danger, 0.4),
        },
        texto: colors.danger,
      };
    default:
      return { contenedor: { backgroundColor: principal }, texto: colors.onPrimary };
  }
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.lg,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contenido: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  texto: { fontSize: font.h3, fontFamily: family.bodyBold },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.45 },
});
