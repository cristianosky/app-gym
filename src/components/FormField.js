/**
 * Campo de texto con etiqueta, sufijo y mensaje de error.
 *
 * El error se muestra pegado al campo (no en un aviso arriba) para que se vea
 * de una qué hay que corregir, y el borde cambia además del color del texto.
 */
import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors, radius, spacing, font, family } from '../theme';
import Icon from './Icon';

export default function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  hint,
  suffix,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  maxLength,
  multiline = false,
  autoFocus = false,
  onSubmitEditing,
  returnKeyType,
}) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>

      <View style={[styles.inputWrap, error && styles.inputWrapError, multiline && styles.multilineWrap]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textFaint}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          maxLength={maxLength}
          multiline={multiline}
          autoFocus={autoFocus}
          onSubmitEditing={onSubmitEditing}
          returnKeyType={returnKeyType}
          style={[styles.input, multiline && styles.multiline]}
          accessibilityLabel={label}
        />
        {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
      </View>

      {error ? (
        <View style={styles.mensajeRow}>
          <Icon name="alert-circle" size={14} color={colors.danger} />
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.lg },
  label: {
    color: colors.textMuted,
    fontSize: font.small,
    fontFamily: family.bodySemi,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    minHeight: 54,
  },
  multilineWrap: { minHeight: 96, alignItems: 'flex-start', paddingVertical: spacing.sm },
  inputWrapError: { borderColor: colors.danger },
  input: { flex: 1, color: colors.text, fontSize: font.h3, fontFamily: family.body, paddingVertical: spacing.sm },
  multiline: { textAlignVertical: 'top', minHeight: 80 },
  suffix: { color: colors.textMuted, fontSize: font.body, fontFamily: family.bodySemi, marginLeft: spacing.sm },
  mensajeRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  error: { color: colors.danger, fontSize: font.small, fontFamily: family.bodyMedium, flex: 1 },
  hint: { color: colors.textFaint, fontSize: font.small, fontFamily: family.body, marginTop: 6 },
});
