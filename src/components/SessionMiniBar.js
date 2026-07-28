/**
 * Barra fija del entrenamiento en curso.
 *
 * Cuando se minimiza el modo entrenamiento, la sesión no se cierra: queda esta
 * barra encima de las pestañas, con el ejercicio actual y el cronómetro
 * corriendo, para poder mirar la comida o la semana sin perder el hilo.
 * Tocarla vuelve a abrir el entrenamiento.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, radius, spacing, font, family, alpha, shadow } from '../theme';
import Icon from './Icon';
import { usePlan } from '../store/PlanStore';
import { useSesion } from '../store/SessionStore';
import { reloj } from '../utils/entrenamiento';
import useTick from '../utils/useTick';

export default function SessionMiniBar() {
  const { getDay } = usePlan();
  const { sesion, abierta, actual, proximo, abrir } = useSesion();

  const visible = Boolean(sesion) && !abierta;
  const ahora = useTick(visible);

  if (!visible) return null;

  const accent = colors[getDay(sesion.key).plan?.accent] || colors.primary;
  const { fase, serie, finFase, inicioFase } = sesion;
  const restante = finFase ? Math.max(0, (finFase - ahora) / 1000) : 0;
  const seriesTotales = Math.max(1, actual?.sets ?? 1);

  const vista = {
    descanso: {
      color: colors.rest,
      icono: 'timer-sand',
      titulo: 'Descanso',
      detalle: sesion.cambio ? `Sigue: ${actual?.name ?? ''}` : `Va la serie ${serie} de ${seriesTotales}`,
      derecha: reloj(restante),
    },
    'ejercicio-terminado': {
      color: colors.success,
      icono: 'check-circle',
      titulo: '¡Ejercicio terminado!',
      detalle: proximo ? `Vamos al siguiente: ${proximo.name}` : 'Toque para terminar',
      derecha: null,
    },
    fin: {
      color: colors.success,
      icono: 'trophy',
      titulo: '¡Entrenamiento terminado!',
      detalle: 'Toque para guardarlo',
      derecha: null,
    },
    trabajo: {
      color: accent,
      icono: 'dumbbell',
      titulo: actual?.name ?? 'Entrenando',
      detalle: `Serie ${serie} de ${seriesTotales}${finFase ? '' : ` · ${actual?.reps ?? ''}`}`,
      derecha: finFase ? reloj(restante) : reloj(Math.floor((ahora - inicioFase) / 1000)),
    },
  }[fase] ?? null;

  if (!vista) return null;

  return (
    <Pressable
      onPress={abrir}
      accessibilityRole="button"
      accessibilityLabel="Volver al entrenamiento en curso"
      style={({ pressed }) => [styles.barra, { borderColor: alpha(vista.color, 0.4) }, pressed && styles.presionada]}
    >
      <View style={[styles.franja, { backgroundColor: vista.color }]} />

      <View style={[styles.iconoWrap, { backgroundColor: alpha(vista.color, 0.16) }]}>
        <Icon set="mci" name={vista.icono} size={20} color={vista.color} />
      </View>

      <View style={styles.texto}>
        <Text style={[styles.titulo, { color: vista.color }]} numberOfLines={1}>{vista.titulo}</Text>
        <Text style={styles.detalle} numberOfLines={1}>{vista.detalle}</Text>
      </View>

      {vista.derecha && (
        <Text style={[styles.tiempo, { color: vista.color }]}>{vista.derecha}</Text>
      )}
      <Icon name="chevron-up" size={20} color={colors.textMuted} style={{ marginLeft: spacing.sm }} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  barra: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: spacing.sm,
    paddingLeft: spacing.md,
    paddingRight: spacing.md,
    overflow: 'hidden',
    ...shadow.card,
  },
  presionada: { opacity: 0.9 },
  franja: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  iconoWrap: {
    width: 38, height: 38, borderRadius: radius.sm,
    alignItems: 'center', justifyContent: 'center', marginRight: spacing.md,
  },
  texto: { flex: 1 },
  titulo: { fontSize: font.body, fontFamily: family.bodyBold },
  detalle: { color: colors.textMuted, fontSize: font.small, fontFamily: family.body, marginTop: 1 },
  tiempo: { fontSize: font.h2, fontFamily: family.displayBlack, marginLeft: spacing.sm },
});
