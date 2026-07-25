/**
 * Modal de confirmación para saltar el entrenamiento de hoy.
 * Ofrece dos caminos:
 *   - Mover: la rutina de hoy pasa a mañana (se recorre el plan).
 *   - Saltar: se marca como saltada y mañana sigue su rutina normal.
 */
import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, radius, spacing, font, family, alpha } from '../theme';
import Icon from './Icon';

export default function SkipModal({ visible, dayTitle, onClose, onSkip, onMove }) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Icon set="mci" name="help-circle-outline" size={34} color={colors.warning} />
          </View>
          <Text style={styles.title}>¿Saltar el día de hoy?</Text>
          <Text style={styles.sub}>
            Hoy te toca <Text style={styles.bold}>{dayTitle}</Text>. Elige qué hacer con esta rutina:
          </Text>

          <Pressable onPress={onMove} style={({ pressed }) => [styles.option, styles.optionPrimary, pressed && styles.pressed]}>
            <View style={[styles.optIconWrap, { backgroundColor: alpha(colors.warning, 0.16) }]}>
              <Icon name="arrow-forward" size={18} color={colors.warning} />
            </View>
            <View style={styles.optBody}>
              <Text style={styles.optTitle}>Mover al día siguiente</Text>
              <Text style={styles.optDesc}>Recorre el plan: harás esta rutina mañana.</Text>
            </View>
          </Pressable>

          <Pressable onPress={onSkip} style={({ pressed }) => [styles.option, pressed && styles.pressed]}>
            <View style={[styles.optIconWrap, { backgroundColor: colors.surfaceHigh }]}>
              <Icon name="play-skip-forward-outline" size={18} color={colors.textMuted} />
            </View>
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
  iconWrap: { alignSelf: 'center', width: 64, height: 64, borderRadius: 32, backgroundColor: alpha(colors.warning, 0.14), alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  title: { color: colors.text, fontSize: font.h2, fontFamily: family.display, textAlign: 'center', marginBottom: spacing.sm },
  sub: { color: colors.textMuted, fontSize: font.body, fontFamily: family.body, textAlign: 'center', lineHeight: 21, marginBottom: spacing.lg },
  bold: { color: colors.text, fontFamily: family.bodyBold },
  option: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border,
  },
  optionPrimary: { borderColor: alpha(colors.warning, 0.5), backgroundColor: alpha(colors.warning, 0.08) },
  pressed: { opacity: 0.75 },
  optIconWrap: { width: 38, height: 38, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  optBody: { flex: 1 },
  optTitle: { color: colors.text, fontSize: font.h3, fontFamily: family.bodySemi, marginBottom: 2 },
  optDesc: { color: colors.textMuted, fontSize: font.small, fontFamily: family.body, lineHeight: 18 },
  cancel: { paddingVertical: spacing.sm, alignItems: 'center', marginTop: spacing.xs, minHeight: 44, justifyContent: 'center' },
  cancelText: { color: colors.textFaint, fontSize: font.body, fontFamily: family.bodySemi },
});
