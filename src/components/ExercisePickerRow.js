/**
 * Fila de ejercicio para los selectores (cambiar/agregar): miniatura con el
 * ejemplo real si existe, nombre, músculos que trabaja y una flecha o un
 * spinner mientras se aplica.
 */
import React from 'react';
import { View, Text, Image, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, radius, spacing, font, family } from '../theme';
import { API_URL } from '../config';
import Icon from './Icon';
import LocalVideo from './LocalVideo';
import ExerciseIllustration from '../illustrations/ExerciseIllustration';
import { getLocalVideo } from '../data/localVideos';
import { getLocalGif } from '../data/localGifs';

export default function ExercisePickerRow({ exercise, onPress, disabled, loading, accessibilityLabel }) {
  const accent = colors[exercise.group] || colors.primary;
  const localVideo = getLocalVideo(exercise.localVideo);
  const localGif = getLocalGif(exercise.id);

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? exercise.name}
      style={({ pressed }) => [styles.fila, pressed && !disabled && styles.filaPressed, loading && styles.filaCargando]}
    >
      <View style={[styles.miniatura, { backgroundColor: colors.bg }]}>
        {localVideo ? (
          <LocalVideo source={localVideo} controls={false} contentFit="cover" />
        ) : localGif?.tipo === 'video' ? (
          <LocalVideo source={localGif.fuente} controls={false} contentFit="cover" />
        ) : localGif ? (
          <Image source={localGif.fuente} style={styles.miniaturaImg} resizeMode="cover" />
        ) : exercise.gifUrl ? (
          <Image source={{ uri: `${API_URL}${exercise.gifUrl}` }} style={styles.miniaturaImg} resizeMode="cover" />
        ) : (
          <ExerciseIllustration kind={exercise.illu} accent={accent} size={40} />
        )}
      </View>

      <View style={styles.filaTextos}>
        <Text style={styles.filaTitulo} numberOfLines={1}>{exercise.name}</Text>
        <Text style={styles.filaDesc} numberOfLines={1}>
          {exercise.custom ? 'Su ejercicio' : exercise.muscles}
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator size="small" color={accent} />
      ) : (
        <Icon name="chevron-forward" size={18} color={colors.textFaint} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm + 2,
    marginBottom: spacing.sm,
    minHeight: 68,
  },
  filaPressed: { opacity: 0.75 },
  filaCargando: { opacity: 0.6 },
  miniatura: { width: 52, height: 52, borderRadius: radius.sm, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  miniaturaImg: { width: '100%', height: '100%' },
  filaTextos: { flex: 1 },
  filaTitulo: { color: colors.text, fontSize: font.body, fontFamily: family.bodySemi },
  filaDesc: { color: colors.textMuted, fontSize: font.small, fontFamily: family.body, marginTop: 2 },
});
