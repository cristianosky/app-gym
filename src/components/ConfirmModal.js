/**
 * Confirmación genérica con el estilo de la app, en vez del Alert nativo del
 * sistema (que en Android/iOS/web se ve distinto y no combina con el tema
 * oscuro). Úsela para preguntar "¿seguro?" antes de una acción importante.
 */
import React from 'react';
import { Modal, View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing, font, family, alpha } from '../theme';
import Icon from './Icon';
import Button from './Button';

export default function ConfirmModal({
  visible,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  icon = 'help-circle-outline',
  destructive = false,
}) {
  const acento = destructive ? colors.danger : colors.warning;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={[styles.iconWrap, { backgroundColor: alpha(acento, 0.14) }]}>
            <Icon set="mci" name={icon} size={34} color={acento} />
          </View>

          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.sub}>{message}</Text> : null}

          <View style={styles.acciones}>
            <Button label={cancelText} variant="secondary" onPress={onClose} style={styles.boton} />
            <Button
              label={confirmText}
              variant={destructive ? 'danger' : 'primary'}
              onPress={onConfirm}
              style={styles.boton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', padding: spacing.lg },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.xl },
  iconWrap: {
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: { color: colors.text, fontSize: font.h2, fontFamily: family.display, textAlign: 'center', marginBottom: spacing.sm },
  sub: { color: colors.textMuted, fontSize: font.body, fontFamily: family.body, textAlign: 'center', lineHeight: 21, marginBottom: spacing.lg },
  acciones: { gap: spacing.sm },
  boton: {},
});
