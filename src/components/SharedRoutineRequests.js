/**
 * Solicitudes de rutina compartida, pendientes de aceptar o rechazar.
 * Aceptar reemplaza la rutina vigente por la que le compartieron.
 */
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, radius, spacing, font, family, alpha } from '../theme';
import { usePlan } from '../store/PlanStore';
import Icon from './Icon';
import ConfirmModal from './ConfirmModal';

export default function SharedRoutineRequests() {
  const { solicitudes, aceptarSolicitud, rechazarSolicitud } = usePlan();
  const [aceptando, setAceptando] = useState(null);

  if (!solicitudes || solicitudes.length === 0) return null;

  const confirmar = () => {
    const solicitud = aceptando;
    setAceptando(null);
    aceptarSolicitud(solicitud.id).catch(() => {});
  };

  return (
    <>
      <View style={styles.wrap}>
        {solicitudes.map((s) => (
          <View key={s.id} style={styles.card}>
            <View style={styles.head}>
              <View style={styles.iconWrap}>
                <Icon set="mci" name="share-variant" size={20} color={colors.primary} />
              </View>
              <Text style={styles.text}>
                <Text style={styles.bold}>{s.from.name}</Text> le compartió su rutina
              </Text>
            </View>

            <View style={styles.actions}>
              <Pressable
                onPress={() => rechazarSolicitud(s.id).catch(() => {})}
                style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={`Rechazar la rutina de ${s.from.name}`}
              >
                <Text style={styles.rechazar}>Rechazar</Text>
              </Pressable>
              <Pressable
                onPress={() => setAceptando(s)}
                style={({ pressed }) => [styles.btn, styles.btnPrimary, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={`Usar la rutina de ${s.from.name}`}
              >
                <Text style={styles.usar}>Usar esta rutina</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </View>

      <ConfirmModal
        visible={!!aceptando}
        onClose={() => setAceptando(null)}
        onConfirm={confirmar}
        icon="swap-horizontal"
        title="¿Reemplazar su rutina?"
        message={aceptando ? `Su rutina actual será reemplazada por la de ${aceptando.from.name}.` : ''}
        confirmText="Reemplazar"
        cancelText="Cancelar"
      />
    </>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm, marginBottom: spacing.lg },
  card: {
    backgroundColor: alpha(colors.primary, 0.08),
    borderWidth: 1,
    borderColor: alpha(colors.primary, 0.3),
    borderRadius: radius.md,
    padding: spacing.md,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: alpha(colors.primary, 0.16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, color: colors.text, fontSize: font.body, fontFamily: family.body },
  bold: { fontFamily: family.bodyBold },
  actions: { flexDirection: 'row', gap: spacing.sm },
  btn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 40,
  },
  btnPrimary: { backgroundColor: colors.primary, borderColor: colors.primary },
  pressed: { opacity: 0.8 },
  rechazar: { color: colors.textMuted, fontSize: font.small, fontFamily: family.bodyBold },
  usar: { color: colors.onPrimary, fontSize: font.small, fontFamily: family.bodyBold },
});
