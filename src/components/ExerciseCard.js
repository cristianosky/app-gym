/**
 * Tarjeta de un ejercicio en la pantalla "Hoy".
 * Muestra ilustración animada, datos clave y un check grande para marcar.
 * Tocar el cuerpo de la tarjeta abre el detalle ampliado.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, radius, spacing, font, shadow } from '../theme';
import ExerciseIllustration from '../illustrations/ExerciseIllustration';
import LocalVideo from './LocalVideo';
import { getLocalVideo } from '../data/localVideos';

const GROUP_LABEL = {
  pecho: 'Pecho', espalda: 'Espalda', pierna: 'Pierna', hombro: 'Hombro',
  brazo: 'Brazo', core: 'Core', cardio: 'Cardio', cuerpo: 'Full body',
};

export default function ExerciseCard({ exercise, done, onToggle, onPress }) {
  const accent = colors[exercise.group] || colors.primary;
  const localVideo = getLocalVideo(exercise.localVideo);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, done && styles.cardDone, pressed && styles.pressed]}
    >
      {/* Franja de color del grupo muscular */}
      <View style={[styles.stripe, { backgroundColor: accent }]} />

      <View style={[styles.illu, { backgroundColor: colors.bg }]}>
        {localVideo ? (
          <LocalVideo source={localVideo} controls={false} contentFit="cover" />
        ) : (
          <ExerciseIllustration kind={exercise.illu} accent={accent} size={88} />
        )}
      </View>

      <View style={styles.info}>
        <Text style={[styles.name, done && styles.strike]} numberOfLines={2}>
          {exercise.name}
        </Text>

        <View style={styles.chips}>
          <View style={[styles.chip, { backgroundColor: accent + '22', borderColor: accent + '55' }]}>
            <Text style={[styles.chipText, { color: accent }]}>{GROUP_LABEL[exercise.group] || exercise.group}</Text>
          </View>
        </View>

        <Text style={styles.meta}>
          <Text style={styles.metaStrong}>{exercise.sets}</Text>
          {exercise.sets > 1 ? ' series · ' : ' · '}
          <Text style={styles.metaStrong}>{exercise.reps}</Text>
          {exercise.rest > 0 ? `  ·  ⏱ ${exercise.rest}s` : ''}
        </Text>
      </View>

      {/* Check grande (fácil de tocar con una mano) */}
      <Pressable
        onPress={onToggle}
        hitSlop={10}
        style={({ pressed }) => [
          styles.check,
          { borderColor: done ? colors.success : colors.border, backgroundColor: done ? colors.success : 'transparent' },
          pressed && { opacity: 0.6 },
        ]}
      >
        <Text style={[styles.checkMark, { color: done ? colors.bg : colors.textFaint }]}>
          {done ? '✓' : ''}
        </Text>
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
  info: { flex: 1, paddingRight: spacing.sm },
  name: { color: colors.text, fontSize: font.h3, fontWeight: '700', marginBottom: 5 },
  strike: { textDecorationLine: 'line-through', color: colors.textMuted },
  chips: { flexDirection: 'row', marginBottom: 6 },
  chip: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: radius.pill, borderWidth: 1 },
  chipText: { fontSize: font.tiny, fontWeight: '700' },
  meta: { color: colors.textMuted, fontSize: font.small },
  metaStrong: { color: colors.text, fontWeight: '700' },
  check: {
    width: 42, height: 42, borderRadius: radius.pill, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  checkMark: { fontSize: 22, fontWeight: '900', lineHeight: 24 },
});
