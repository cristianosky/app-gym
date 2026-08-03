/**
 * Crear un ejercicio propio: nombre, grupo muscular, equipo y un video corto
 * (obligatorio) que se convierte en GIF. Al guardar, queda en la biblioteca
 * de la persona y se agrega de una vez al día que estaba armando.
 */
import React, { useCallback, useState } from 'react';
import { Modal, View, Text, ScrollView, Pressable, Image, ActivityIndicator, Platform, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, radius, spacing, font, family, alpha } from '../theme';
import { API_URL } from '../config';
import Icon from './Icon';
import Button from './Button';
import FormField from './FormField';
import { usePlan } from '../store/PlanStore';
import * as endpoints from '../api/endpoints';

const GRUPOS = [
  { id: 'pecho', label: 'Pecho' },
  { id: 'espalda', label: 'Espalda' },
  { id: 'pierna', label: 'Pierna' },
  { id: 'hombro', label: 'Hombro' },
  { id: 'brazo', label: 'Brazo' },
  { id: 'core', label: 'Core' },
  { id: 'cardio', label: 'Cardio' },
];

const EQUIPOS = [
  { id: 'maquina', label: 'Máquina' },
  { id: 'barra', label: 'Barra' },
  { id: 'mancuernas', label: 'Mancuernas' },
  { id: 'polea', label: 'Polea' },
  { id: 'peso-corporal', label: 'Peso corporal' },
  { id: 'cardio', label: 'Cardio' },
  { id: 'ninguno', label: 'Ninguno' },
];

const estadoInicial = { name: '', group: null, equipment: null };

export default function CreateExerciseModal({ visible, day, onClose, onCreated }) {
  const { crearEjercicioPropio, agregarEjercicio } = usePlan();

  const [datos, setDatos] = useState(estadoInicial);
  const [gif, setGif] = useState(null);
  const [subiendoVideo, setSubiendoVideo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  const reiniciar = useCallback(() => {
    setDatos(estadoInicial);
    setGif(null);
    setSubiendoVideo(false);
    setGuardando(false);
    setError(null);
  }, []);

  const cerrar = useCallback(() => {
    reiniciar();
    onClose();
  }, [reiniciar, onClose]);

  const escogerVideo = useCallback(async () => {
    setError(null);

    if (Platform.OS !== 'web') {
      const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permiso.granted) {
        setError('Necesitamos permiso para acceder a sus videos. Actívelo en los ajustes.');
        return;
      }
    }

    const resPicker = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['videos'], quality: 1 });
    if (resPicker.canceled) return;

    const activo = resPicker.assets?.[0];
    if (!activo?.uri) {
      setError('No pudimos leer el video. Intente con otro.');
      return;
    }

    setSubiendoVideo(true);
    setGif(null);
    try {
      const blob = await (await fetch(activo.uri)).blob();
      const contentType = activo.mimeType || blob.type || 'application/octet-stream';
      const { gif: convertido } = await endpoints.medios.videoAGif(blob, contentType);
      setGif(convertido);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubiendoVideo(false);
    }
  }, []);

  const guardar = useCallback(async () => {
    if (!datos.name.trim()) {
      setError('Escriba el nombre del ejercicio.');
      return;
    }
    if (!datos.group) {
      setError('Escoja el grupo muscular que trabaja.');
      return;
    }
    if (!datos.equipment) {
      setError('Escoja el equipo que usa.');
      return;
    }
    if (!gif) {
      setError('Suba un video del ejercicio antes de guardarlo.');
      return;
    }

    setGuardando(true);
    setError(null);
    try {
      const { exercise } = await crearEjercicioPropio(datos.name.trim(), datos.group, datos.equipment, gif.url);
      await agregarEjercicio(day, exercise.id);
      reiniciar();
      onCreated?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }, [datos, gif, day, crearEjercicioPropio, agregarEjercicio, reiniciar, onCreated]);

  const urlGif = gif ? `${API_URL}${gif.url}` : null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={cerrar}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Crear ejercicio</Text>
          <Text style={styles.sub}>Queda guardado en sus ejercicios para usarlo cuando quiera.</Text>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.md }}>
            <FormField
              label="Nombre"
              value={datos.name}
              onChangeText={(v) => setDatos((d) => ({ ...d, name: v }))}
              placeholder="Ej.: Remo en banco con liga"
              maxLength={60}
            />

            <Text style={styles.etiqueta}>Grupo muscular</Text>
            <View style={styles.chips}>
              {GRUPOS.map((g) => {
                const activo = datos.group === g.id;
                const accent = colors[g.id] || colors.primary;
                return (
                  <Pressable
                    key={g.id}
                    onPress={() => setDatos((d) => ({ ...d, group: g.id }))}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: activo }}
                    style={({ pressed }) => [
                      styles.chip,
                      activo && { backgroundColor: alpha(accent, 0.18), borderColor: accent },
                      pressed && { opacity: 0.8 },
                    ]}
                  >
                    <Text style={[styles.chipText, activo && { color: accent }]}>{g.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={[styles.etiqueta, { marginTop: spacing.md }]}>Equipo</Text>
            <View style={styles.chips}>
              {EQUIPOS.map((eq) => {
                const activo = datos.equipment === eq.id;
                return (
                  <Pressable
                    key={eq.id}
                    onPress={() => setDatos((d) => ({ ...d, equipment: eq.id }))}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: activo }}
                    style={({ pressed }) => [styles.chip, activo && styles.chipActivo, pressed && { opacity: 0.8 }]}
                  >
                    <Text style={[styles.chipText, activo && styles.chipTextActivo]}>{eq.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={[styles.etiqueta, { marginTop: spacing.md }]}>Video (obligatorio)</Text>
            {subiendoVideo ? (
              <View style={styles.videoBox}>
                <ActivityIndicator color={colors.primary} />
                <Text style={styles.videoBoxText}>Convirtiendo su video a GIF…</Text>
              </View>
            ) : gif ? (
              <View style={styles.videoListo}>
                <Image source={{ uri: urlGif }} style={styles.preview} resizeMode="cover" />
                <Pressable onPress={escogerVideo} style={({ pressed }) => [styles.cambiarVideoBtn, pressed && { opacity: 0.8 }]}>
                  <Icon name="refresh" size={15} color={colors.primary} />
                  <Text style={styles.cambiarVideoText}>Cambiar video</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable onPress={escogerVideo} style={({ pressed }) => [styles.videoBox, styles.videoBoxVacio, pressed && { opacity: 0.8 }]}>
                <Icon set="mci" name="video-plus-outline" size={28} color={colors.primary} />
                <Text style={styles.videoBoxText}>Escoger video del ejercicio</Text>
              </Pressable>
            )}

            {error ? <Text style={styles.error}>{error}</Text> : null}
          </ScrollView>

          <Button label="Crear y agregar al día" icon="checkmark-circle" onPress={guardar} loading={guardando} style={{ alignSelf: 'stretch', marginTop: spacing.sm }} />
          <Pressable onPress={cerrar} style={({ pressed }) => [styles.cerrar, pressed && { opacity: 0.7 }]}>
            <Text style={styles.cerrarText}>Cancelar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
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
    maxHeight: '90%',
  },
  handle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: colors.border, marginBottom: spacing.md },
  title: { color: colors.text, fontSize: font.h2, fontFamily: family.display, textAlign: 'center', marginBottom: spacing.sm },
  sub: { color: colors.textMuted, fontSize: font.body, fontFamily: family.body, textAlign: 'center', lineHeight: 21, marginBottom: spacing.md },

  etiqueta: {
    color: colors.textMuted,
    fontSize: font.small,
    fontFamily: family.bodySemi,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    minHeight: 40,
    justifyContent: 'center',
  },
  chipActivo: { backgroundColor: alpha(colors.primary, 0.16), borderColor: colors.primary },
  chipText: { color: colors.textMuted, fontSize: font.small, fontFamily: family.bodySemi },
  chipTextActivo: { color: colors.primary },

  videoBox: {
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    minHeight: 110,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  videoBoxVacio: { borderStyle: 'dashed' },
  videoBoxText: { color: colors.textMuted, fontSize: font.small, fontFamily: family.bodyMedium, textAlign: 'center', paddingHorizontal: spacing.md },

  videoListo: { alignItems: 'center', gap: spacing.sm },
  preview: { width: '100%', height: 160, borderRadius: radius.md, backgroundColor: colors.bg },
  cambiarVideoBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 32 },
  cambiarVideoText: { color: colors.primary, fontSize: font.small, fontFamily: family.bodyBold },

  error: { color: colors.danger, fontSize: font.small, fontFamily: family.bodyMedium, textAlign: 'center', marginTop: spacing.md },

  cerrar: { paddingVertical: spacing.sm, alignItems: 'center', minHeight: 44, justifyContent: 'center', marginTop: spacing.xs },
  cerrarText: { color: colors.textFaint, fontSize: font.body, fontFamily: family.bodySemi },
});
