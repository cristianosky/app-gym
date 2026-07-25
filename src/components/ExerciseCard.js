/**
 * Tarjeta de un ejercicio en la pantalla "Hoy".
 * Muestra ilustración animada, datos clave y un check grande para marcar.
 * Tocar el cuerpo de la tarjeta abre el detalle ampliado.
 */
import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { colors, radius, spacing, font, family, shadow, alpha } from '../theme';
import ExerciseIllustration from '../illustrations/ExerciseIllustration';
import LocalVideo from './LocalVideo';
import Icon from './Icon';
import { getLocalVideo } from '../data/localVideos';
import { getLocalGif } from '../data/localGifs';

const GROUP_LABEL = {
  pecho: 'Pecho', espalda: 'Espalda', pierna: 'Pierna', hombro: 'Hombro',
  brazo: 'Brazo', core: 'Core', cardio: 'Cardio', cuerpo: 'Full body',
};

export default function ExerciseCard({ exercise, done, onToggle, onPress }) {
  const accent = colors[exercise.group] || colors.primary;
  const localVideo = getLocalVideo(exercise.localVideo);
  const localGif = getLocalGif(exercise.id);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, done && styles.cardDone, pressed && styles.pressed]}
      accessibilityRole="button"
    >
      {/* Franja de color del grupo muscular */}
      <View style={[styles.stripe, { backgroundColor: accent }]} />

      <View style={[styles.illu, { backgroundColor: colors.bg }]}>
        {localVideo ? (
          <LocalVideo source={localVideo} controls={false} contentFit="cover" />
        ) : localGif ? (
          <Image source={localGif} style={styles.gif} resizeMode="cover" />
        ) : (
          <ExerciseIllustration kind={exercise.illu} accent={accent} size={88} />
        )}
      </View>

      <View style={styles.info}>
        <Text style={[styles.name, done && styles.strike]} numberOfLines={2}>
          {exercise.name}
        </Text>

        <View style={styles.chips}>
          <View style={[styles.chip, { backgroundColor: alpha(accent, 0.14), borderColor: alpha(accent, 0.35) }]}>
            <Text style={[styles.chipText, { color: accent }]}>{GROUP_LABEL[exercise.group] || exercise.group}</Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.meta}>
            <Text style={styles.metaStrong}>{exercise.sets}</Text>
            {exercise.sets > 1 ? ' series · ' : ' · '}
            <Text style={styles.metaStrong}>{exercise.reps}</Text>
          </Text>
          {exercise.rest > 0 && (
            <View style={styles.restMeta}>
              <Icon name="time-outline" size={13} color={colors.textMuted} />
              <Text style={styles.meta}>{exercise.rest}s</Text>
            </View>
          )}
        </View>
      </View>

      {/* Check grande (fácil de tocar con una mano) */}
      <Pressable
        onPress={onToggle}
        hitSlop={10}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done }}
        accessibilityLabel={done ? 'Marcado como completado' : 'Marcar como completado'}
        style={({ pressed }) => [
          styles.check,
          { borderColor: done ? colors.success : colors.border, backgroundColor: done ? colors.success : 'transparent' },
          pressed && { opacity: 0.6 },
        ]}
      >
        {done && <Icon name="checkmark" size={24} color={colors.onPrimary} />}
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadow.card,
  },
  cardDone: { opacity: 0.62 },
  pressed: { transform: [{ scale: 0.99 }] },
  stripe: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 5 },
  illu: {
    width: 88, height: 88, borderRadius: radius.sm, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center', marginRight: spacing.md, marginLeft: spacing.xs,
  },
  gif: { width: '100%', height: '100%' },
  info: { flex: 1, paddingRight: spacing.sm },
  name: { color: colors.text, fontSize: font.h3, fontFamily: family.bodySemi, marginBottom: 5 },
  strike: { textDecorationLine: 'line-through', color: colors.textMuted },
  chips: { flexDirection: 'row', marginBottom: 6 },
  chip: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: radius.pill, borderWidth: 1 },
  chipText: { fontSize: font.tiny, fontFamily: family.bodyBold },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  restMeta: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  meta: { color: colors.textMuted, fontSize: font.small, fontFamily: family.body },
  metaStrong: { color: colors.text, fontFamily: family.bodyBold },
  check: {
    width: 44, height: 44, borderRadius: radius.pill, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
});
