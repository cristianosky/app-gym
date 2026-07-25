/**
 * Detalle ampliado de un ejercicio.
 *
 * La pieza central es "Ver ejemplo": estando en el gimnasio, lo que más se
 * necesita es ver el movimiento, no leerlo. Por eso el video se abre con un
 * botón grande arriba del todo, antes que cualquier texto.
 *
 * Orden de lo que se muestra como ejemplo:
 *   1. video local (funciona sin internet),
 *   2. video de YouTube (se carga solo al tocar, para no gastar datos),
 *   3. animación del movimiento (siempre disponible, sin conexión).
 */
import React, { useState } from 'react';
import { Modal, View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { colors, radius, spacing, font, family, alpha } from '../theme';
import ExerciseIllustration from '../illustrations/ExerciseIllustration';
import LocalVideo from './LocalVideo';
import VideoPlayer from './VideoPlayer';
import Icon from './Icon';
import { getLocalVideo } from '../data/localVideos';

const GROUP_LABEL = {
  pecho: 'Pecho', espalda: 'Espalda', pierna: 'Pierna', hombro: 'Hombro',
  brazo: 'Brazo', core: 'Core', cardio: 'Cardio', cuerpo: 'Cuerpo completo',
};

export default function ExerciseDetailModal({ exercise, visible, onClose }) {
  const [mostrarVideo, setMostrarVideo] = useState(false);

  if (!exercise) return null;

  const accent = colors[exercise.group] || colors.primary;
  const videoLocal = getLocalVideo(exercise.localVideo);
  const hayEjemplo = Boolean(videoLocal || exercise.video);

  const cerrar = () => {
    setMostrarVideo(false);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={cerrar}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xl }}>
            {/* --- Ejemplo del movimiento --- */}
            {videoLocal ? (
              <View style={styles.videoHero}>
                <LocalVideo source={videoLocal} controls contentFit="cover" />
              </View>
            ) : mostrarVideo ? (
              <View style={styles.videoWrap}>
                <VideoPlayer videoId={exercise.video} query={`${exercise.name} técnica gimnasio`} />
              </View>
            ) : (
              <View style={[styles.hero, { backgroundColor: colors.bg }]}>
                <ExerciseIllustration kind={exercise.illu} accent={accent} size={180} />
              </View>
            )}

            {!videoLocal && !mostrarVideo && (
              <Pressable
                onPress={() => setMostrarVideo(true)}
                accessibilityRole="button"
                accessibilityLabel={hayEjemplo ? 'Ver ejemplo en video' : 'Buscar ejemplo en YouTube'}
                style={({ pressed }) => [
                  styles.verEjemplo,
                  { backgroundColor: accent },
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Icon name="play-circle" size={22} color={colors.onPrimary} />
                <Text style={styles.verEjemploText}>
                  {hayEjemplo ? 'Ver ejemplo en video' : 'Buscar ejemplo en YouTube'}
                </Text>
              </Pressable>
            )}

            <View style={[styles.chip, { backgroundColor: alpha(accent, 0.16), borderColor: alpha(accent, 0.4) }]}>
              <Text style={[styles.chipText, { color: accent }]}>
                {GROUP_LABEL[exercise.group] || exercise.group}
              </Text>
            </View>

            <Text style={styles.title}>{exercise.name}</Text>

            <View style={styles.statsRow}>
              <Stat icon="layers-outline" label="Series" value={String(exercise.sets)} />
              <Stat icon="repeat-outline" label="Reps" value={exercise.reps} />
              <Stat icon="time-outline" label="Descanso" value={exercise.rest > 0 ? `${exercise.rest}s` : '—'} />
            </View>

            {/* Ajuste que el asistente escribió para esta persona en concreto. */}
            {exercise.note ? (
              <Aviso
                icon="sparkles"
                color={colors.secondary}
                titulo="Para usted"
                texto={exercise.note}
              />
            ) : null}

            {exercise.smartfit ? (
              <Aviso
                icon="location-outline"
                color={colors.primary}
                titulo="En el gimnasio"
                texto={exercise.smartfit}
              />
            ) : null}

            <Section title="Cómo se hace" accent={accent}>
              {exercise.howto?.map((paso, i) => (
                <View key={i} style={styles.stepRow}>
                  <View style={[styles.stepNum, { backgroundColor: accent }]}>
                    <Text style={styles.stepNumText}>{i + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{paso}</Text>
                </View>
              ))}
            </Section>

            <Section title="Músculos que trabaja" accent={accent} icon="body-outline">
              <Text style={styles.body}>{exercise.muscles}</Text>
            </Section>

            <Section title="Errores comunes" accent={colors.danger} icon="alert-circle-outline">
              {exercise.errors?.map((err, i) => (
                <View key={i} style={styles.errRow}>
                  <Icon name="close" size={16} color={colors.danger} style={styles.errIcon} />
                  <Text style={styles.body}>{err}</Text>
                </View>
              ))}
            </Section>

            {exercise.tips ? (
              <Section title="Consejo" accent={colors.warning} icon="bulb-outline">
                <Text style={styles.body}>{exercise.tips}</Text>
              </Section>
            ) : null}
          </ScrollView>

          <Pressable onPress={cerrar} style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.8 }]}>
            <Text style={styles.closeText}>Cerrar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function Stat({ icon, label, value }) {
  return (
    <View style={styles.stat}>
      <Icon name={icon} size={16} color={colors.textMuted} style={{ marginBottom: 3 }} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

/** Recuadro destacado (nota del asistente o tip del gimnasio). */
function Aviso({ icon, color, titulo, texto }) {
  return (
    <View style={[styles.aviso, { backgroundColor: alpha(color, 0.1), borderColor: alpha(color, 0.3) }]}>
      <Icon name={icon} size={17} color={color} style={{ marginTop: 1 }} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.avisoTitulo, { color }]}>{titulo}</Text>
        <Text style={styles.avisoTexto}>{texto}</Text>
      </View>
    </View>
  );
}

function Section({ title, accent, icon, children }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        {icon ? (
          <Icon name={icon} size={17} color={accent} style={{ marginRight: 8 }} />
        ) : (
          <View style={[styles.dot, { backgroundColor: accent }]} />
        )}
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
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    maxHeight: '92%',
  },
  handle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: colors.border, marginBottom: spacing.md },

  hero: { borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md },
  videoHero: { borderRadius: radius.md, overflow: 'hidden', backgroundColor: '#000', aspectRatio: 16 / 9, marginBottom: spacing.md },
  videoWrap: { marginBottom: spacing.md },

  verEjemplo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    minHeight: 52,
  },
  verEjemploText: { color: colors.onPrimary, fontSize: font.h3, fontFamily: family.bodyBold },

  chip: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, borderWidth: 1, marginBottom: spacing.sm },
  chipText: { fontSize: font.tiny, fontFamily: family.bodyBold, textTransform: 'uppercase', letterSpacing: 0.5 },
  title: { color: colors.text, fontSize: font.h2, fontFamily: family.display, marginBottom: spacing.md },

  statsRow: { flexDirection: 'row', backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { color: colors.text, fontSize: font.h3, fontFamily: family.bodyBold },
  statLabel: { color: colors.textMuted, fontSize: font.tiny, fontFamily: family.bodyMedium, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },

  aviso: {
    flexDirection: 'row',
    gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  avisoTitulo: { fontSize: font.tiny, fontFamily: family.bodyBold, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 3 },
  avisoTexto: { color: colors.textMuted, fontSize: font.small, fontFamily: family.body, lineHeight: 19 },

  section: { marginBottom: spacing.lg },
  sectionHead: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  sectionTitle: { color: colors.text, fontSize: font.h3, fontFamily: family.bodySemi },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.sm },
  stepNum: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm, marginTop: 1 },
  stepNumText: { color: colors.onPrimary, fontFamily: family.bodyBold, fontSize: font.small },
  stepText: { flex: 1, color: colors.textMuted, fontSize: font.body, fontFamily: family.body, lineHeight: 21 },
  errRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  errIcon: { width: 20, marginTop: 2 },
  body: { flex: 1, color: colors.textMuted, fontSize: font.body, fontFamily: family.body, lineHeight: 21 },

  closeBtn: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginVertical: spacing.md,
    minHeight: 48,
    justifyContent: 'center',
  },
  closeText: { color: colors.text, fontSize: font.h3, fontFamily: family.bodySemi },
});
