/**
 * Tarjeta seleccionable del registro (objetivos, nivel, dónde entrena).
 *
 * La selección no se indica solo con color: también cambia el borde y aparece
 * un chulo, para que se distinga sin depender de ver bien los colores.
 */
import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { colors, radius, spacing, font, family, alpha } from '../theme';
import Icon from './Icon';

export default function SelectCard({
  title,
  description,
  icon,
  iconSet = 'ion',
  selected = false,
  onPress,
  accent = colors.primary,
  compact = false,
  style,
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={title}
      accessibilityHint={description}
      style={({ pressed }) => [
        styles.card,
        compact && styles.compact,
        selected && { borderColor: accent, backgroundColor: alpha(accent, 0.1) },
        pressed && styles.pressed,
        style,
      ]}
    >
      {icon && (
        <View style={[styles.iconWrap, { backgroundColor: alpha(accent, selected ? 0.2 : 0.1) }]}>
          <Icon name={icon} set={iconSet} size={compact ? 20 : 23} color={accent} />
        </View>
      )}

      <View style={styles.texts}>
        <Text style={[styles.title, selected && { color: colors.text }]} numberOfLines={2}>
          {title}
        </Text>
        {description ? (
          <Text style={styles.description} numberOfLines={2}>
            {description}
          </Text>
        ) : null}
      </View>

      <View style={[styles.check, selected && { backgroundColor: accent, borderColor: accent }]}>
        {selected && <Icon name="checkmark" size={16} color={colors.onPrimary} />}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    minHeight: 68,
  },
  compact: { minHeight: 56, padding: spacing.sm + 2 },
  pressed: { opacity: 0.8 },
  iconWrap: { width: 44, height: 44, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  texts: { flex: 1 },
  title: { color: colors.text, fontSize: font.body, fontFamily: family.bodySemi },
  description: { color: colors.textMuted, fontSize: font.small, fontFamily: family.body, marginTop: 2, lineHeight: 18 },
  check: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
