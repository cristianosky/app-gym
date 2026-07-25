/**
 * Detalle ampliado de un ejercicio (modal).
 * Muestra la ilustración grande, cómo ejecutarlo paso a paso,
 * músculos trabajados y errores comunes a evitar.
 */
import React from 'react';
import { Modal, View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { colors, radius, spacing, font } from '../theme';
import ExerciseIllustration from '../illustrations/ExerciseIllustration';
import LocalVideo from './LocalVideo';
import { getLocalVideo } from '../data/localVideos';

const GROUP_LABEL = {
  pecho: 'Pecho', espalda: 'Espalda', pierna: 'Pierna', hombro: 'Hombro',
  brazo: 'Brazo', core: 'Core', cardio: 'Cardio', cuerpo: 'Full body',
};

export default function ExerciseDetailModal({ exercise, visible, onClose }) {
  if (!exercise) return null;
  const accent = colors[exercise.group] || colors.primary;
  const localVideo = getLocalVideo(exercise.localVideo);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xl }}>
            {/* Visual del ejercicio: video si existe, si no la animación */}
            {localVideo ? (
              <View style={styles.videoHero}>
                <LocalVideo source={localVideo} controls contentFit="cover" />
              </View>
            ) : (
              <View style={[styles.hero, { backgroundColor: colors.bg }]}>
                <ExerciseIllustration kind={exercise.illu} accent={accent} size={190} />
              </View>
            )}

            <View style={[styles.chip, { backgroundColor: accent + '22', borderColor: accent + '55' }]}>
              <Text style={[styles.chipText, { color: accent }]}>
                {GROUP_LABEL[exercise.group] || exercise.group}
              </Text>
            </View>

            <Text style={styles.title}>{exercise.name}</Text>

            {/* Prescripción */}
            <View style={styles.statsRow}>
              <Stat label="Series" value={String(exercise.sets)} />
              <Stat label="Reps" value={exercise.reps} />
              <Stat label="Descanso" value={exercise.rest > 0 ? `${exercise.rest}s` : '—'} />
            </View>

            <Section title="Cómo ejecutarlo" accent={accent}>
              {exercise.howto?.map((step, i) => (
                <View key={i} style={styles.stepRow}>
                  <View style={[styles.stepNum, { backgroundColor: accent }]}>
                    <Text style={styles.stepNumText}>{i + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </Section>

            <Section title="Músculos trabajados" accent={accent}>
              <Text style={styles.body}>{exercise.muscles}</Text>
            </Section>

            <Section title="Errores comunes" accent={colors.danger}>
              {exercise.errors?.map((err, i) => (
                <View key={i} style={styles.errRow}>
                  <Text style={[styles.errIcon, { color: colors.danger }]}>✕</Text>
                  <Text style={styles.body}>{err}</Text>
                </View>
              ))}
            </Section>
          </ScrollView>

          <Pressable onPress={onClose} style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.8 }]}>
            <Text style={styles.closeText}>Cerrar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function Stat({ label, value }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Section({ title, accent, children }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <View style={[styles.dot, { backgroundColor: accent }]} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing.lg, paddingTop: spacing.sm, maxHeight: '92%',
  },
  handle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: colors.border, marginBottom: spacing.md },
  hero: { borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md, marginBottom: spacing.md },
  videoHero: { borderRadius: radius.md, overflow: 'hidden', backgroundColor: '#000', aspectRatio: 16 / 9, marginBottom: spacing.md },
  chip: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, borderWidth: 1, marginBottom: spacing.sm },
  chipText: { fontSize: font.tiny, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  title: { color: colors.text, fontSize: font.h2, fontWeight: '800', marginBottom: spacing.md },
  statsRow: { flexDirection: 'row', backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { color: colors.text, fontSize: font.h3, fontWeight: '800' },
  statLabel: { color: colors.textMuted, fontSize: font.tiny, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  section: { marginBottom: spacing.lg },
  sectionHead: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  sectionTitle: { color: colors.text, fontSize: font.h3, fontWeight: '700' },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.sm },
  stepNum: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm, marginTop: 1 },
  stepNumText: { color: colors.bg, fontWeight: '900', fontSize: font.small },
  stepText: { flex: 1, color: colors.textMuted, fontSize: font.body, lineHeight: 21 },
  errRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  errIcon: { width: 20, fontWeight: '900', fontSize: font.body },
  body: { flex: 1, color: colors.textMuted, fontSize: font.body, lineHeight: 21 },
  closeBtn: { backgroundColor: colors.surfaceAlt, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center', marginVertical: spacing.md },
  closeText: { color: colors.text, fontSize: font.h3, fontWeight: '700' },
});
