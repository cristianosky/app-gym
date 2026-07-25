/**
 * Modal de confirmación para saltar el entrenamiento de hoy.
 * Ofrece dos caminos:
 *   - Mover: la rutina de hoy pasa a mañana (se recorre el plan).
 *   - Saltar: se marca como saltada y mañana sigue su rutina normal.
 */
import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, radius, spacing, font } from '../theme';

export default function SkipModal({ visible, dayTitle, onClose, onSkip, onMove }) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.emoji}>🤔</Text>
          <Text style={styles.title}>¿Saltar el día de hoy?</Text>
          <Text style={styles.sub}>
            Hoy te toca <Text style={styles.bold}>{dayTitle}</Text>. Elige qué hacer con esta rutina:
          </Text>

          <Pressable onPress={onMove} style={({ pressed }) => [styles.option, styles.optionPrimary, pressed && styles.pressed]}>
            <Text style={styles.optIcon}>➡️</Text>
            <View style={styles.optBody}>
              <Text style={styles.optTitle}>Mover al día siguiente</Text>
              <Text style={styles.optDesc}>Recorre el plan: harás esta rutina mañana.</Text>
            </View>
          </Pressable>

          <Pressable onPress={onSkip} style={({ pressed }) => [styles.option, pressed && styles.pressed]}>
            <Text style={styles.optIcon}>⏭️</Text>
            <View style={styles.optBody}>
              <Text style={styles.optTitle}>Solo saltar</Text>
              <Text style={styles.optDesc}>Se marca como saltada y mañana sigue lo normal.</Text>
            </View>
          </Pressable>

          <Pressable onPress={onClose} style={({ pressed }) => [styles.cancel, pressed && { opacity: 0.7 }]}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', padding: spacing.lg },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.xl },
  emoji: { fontSize: 40, textAlign: 'center', marginBottom: spacing.sm },
  title: { color: colors.text, fontSize: font.h2, fontWeight: '800', textAlign: 'center', marginBottom: spacing.sm },
  sub: { color: colors.textMuted, fontSize: font.body, textAlign: 'center', lineHeight: 21, marginBottom: spacing.lg },
  bold: { color: colors.text, fontWeight: '700' },
  option: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border,
  },
  optionPrimary: { borderColor: colors.warning + '88', backgroundColor: colors.warning + '14' },
  pressed: { opacity: 0.75 },
  optIcon: { fontSize: 24, marginRight: spacing.md },
  optBody: { flex: 1 },
  optTitle: { color: colors.text, fontSize: font.h3, fontWeight: '700', marginBottom: 2 },
  optDesc: { color: colors.textMuted, fontSize: font.small, lineHeight: 18 },
  cancel: { paddingVertical: spacing.sm, alignItems: 'center', marginTop: spacing.xs },
  cancelText: { color: colors.textFaint, fontSize: font.body, fontWeight: '600' },
});
