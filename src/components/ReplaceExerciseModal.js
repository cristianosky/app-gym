/**
 * Lista de ejercicios equivalentes para cambiar uno del día (la máquina no
 * está, está ocupada, o simplemente no le gusta a la persona). Solo se
 * ofrecen ejercicios del mismo grupo muscular, así no se pierde el objetivo
 * de la sesión, y se conservan las series/repeticiones/descanso ya armados.
 *
 * Se priorizan los que ya tienen video o GIF local: así la persona ve de una
 * cómo se hace el reemplazo, en vez de cambiarlo por uno que solo tiene la
 * animación genérica.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Modal, View, Text, Image, ScrollView, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, radius, spacing, font, family } from '../theme';
import Icon from './Icon';
import LocalVideo from './LocalVideo';
import ExerciseIllustration from '../illustrations/ExerciseIllustration';
import { getLocalVideo } from '../data/localVideos';
import { getLocalGif } from '../data/localGifs';
import { usePlan } from '../store/PlanStore';

export default function ReplaceExerciseModal({ visible, day, exercise, onClose, onReplaced }) {
  const { alternativasPara, reemplazarEjercicio } = usePlan();
  const [alternativas, setAlternativas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [cambiando, setCambiando] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!visible || !exercise) return;
    setError(null);
    setCargando(true);
    alternativasPara(day, exercise.id)
      .then(setAlternativas)
      .catch((err) => setError(err.message))
      .finally(() => setCargando(false));
  }, [visible, day, exercise, alternativasPara]);

  // Con ejemplo visual primero; si ninguno tiene, mejor mostrarlos todos que
  // dejar la lista vacía.
  const opciones = useMemo(() => {
    const conEjemplo = alternativas.filter((alt) => getLocalVideo(alt.localVideo) || getLocalGif(alt.id));
    return conEjemplo.length > 0 ? conEjemplo : alternativas;
  }, [alternativas]);

  if (!exercise) return null;

  const elegir = async (alternativa) => {
    if (cambiando) return;
    setCambiando(alternativa.id);
    setError(null);
    try {
      await reemplazarEjercicio(day, exercise.id, alternativa.id);
      onReplaced?.();
    } catch (err) {
      setError(err.message);
      setCambiando(null);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Cambiar ejercicio</Text>
          <Text style={styles.sub}>
            Reemplace <Text style={styles.bold}>{exercise.name}</Text> por otro que trabaje lo mismo.
          </Text>

          {cargando ? (
            <ActivityIndicator color={colors.primary} style={styles.spinner} />
          ) : opciones.length === 0 ? (
            <View style={styles.vacio}>
              <Icon set="mci" name="dumbbell" size={30} color={colors.textFaint} />
              <Text style={styles.vacioText}>
                No encontramos otro ejercicio disponible para reemplazar este.
              </Text>
            </View>
          ) : (
            <ScrollView style={styles.lista} showsVerticalScrollIndicator={false}>
              {opciones.map((alt) => (
                <AlternativaRow
                  key={alt.id}
                  exercise={alt}
                  disabled={Boolean(cambiando)}
                  cambiando={cambiando === alt.id}
                  onPress={() => elegir(alt)}
                />
              ))}
            </ScrollView>
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable onPress={onClose} style={({ pressed }) => [styles.cerrar, pressed && { opacity: 0.7 }]}>
            <Text style={styles.cerrarText}>Cancelar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function AlternativaRow({ exercise, onPress, disabled, cambiando }) {
  const accent = colors[exercise.group] || colors.primary;
  const localVideo = getLocalVideo(exercise.localVideo);
  const localGif = getLocalGif(exercise.id);

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={`Cambiar por ${exercise.name}`}
      style={({ pressed }) => [styles.fila, pressed && !disabled && styles.filaPressed, cambiando && styles.filaCambiando]}
    >
      <View style={[styles.miniatura, { backgroundColor: colors.bg }]}>
        {localVideo ? (
          <LocalVideo source={localVideo} controls={false} contentFit="cover" />
        ) : localGif?.tipo === 'video' ? (
          <LocalVideo source={localGif.fuente} controls={false} contentFit="cover" />
        ) : localGif ? (
          <Image source={localGif.fuente} style={styles.miniaturaImg} resizeMode="cover" />
        ) : (
          <ExerciseIllustration kind={exercise.illu} accent={accent} size={40} />
        )}
      </View>

      <View style={styles.filaTextos}>
        <Text style={styles.filaTitulo} numberOfLines={1}>{exercise.name}</Text>
        <Text style={styles.filaDesc} numberOfLines={1}>{exercise.muscles}</Text>
      </View>

      {cambiando ? (
        <ActivityIndicator size="small" color={accent} />
      ) : (
        <Icon name="chevron-forward" size={18} color={colors.textFaint} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    maxHeight: '80%',
  },
  handle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: colors.border, marginBottom: spacing.md },
  title: { color: colors.text, fontSize: font.h2, fontFamily: family.display, textAlign: 'center', marginBottom: spacing.sm },
  sub: { color: colors.textMuted, fontSize: font.body, fontFamily: family.body, textAlign: 'center', lineHeight: 21, marginBottom: spacing.md },
  bold: { color: colors.text, fontFamily: family.bodyBold },

  spinner: { marginVertical: spacing.xl },
  vacio: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
  vacioText: { color: colors.textMuted, fontSize: font.body, fontFamily: family.body, textAlign: 'center', paddingHorizontal: spacing.lg },

  lista: { marginBottom: spacing.sm },

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
  filaCambiando: { opacity: 0.6 },
  miniatura: { width: 52, height: 52, borderRadius: radius.sm, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  miniaturaImg: { width: '100%', height: '100%' },
  filaTextos: { flex: 1 },
  filaTitulo: { color: colors.text, fontSize: font.body, fontFamily: family.bodySemi },
  filaDesc: { color: colors.textMuted, fontSize: font.small, fontFamily: family.body, marginTop: 2 },

  error: { color: colors.danger, fontSize: font.small, fontFamily: family.bodyMedium, textAlign: 'center', marginBottom: spacing.sm },

  cerrar: { paddingVertical: spacing.sm, alignItems: 'center', minHeight: 44, justifyContent: 'center' },
  cerrarText: { color: colors.textFaint, fontSize: font.body, fontFamily: family.bodySemi },
});
