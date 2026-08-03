/**
 * Subir un video corto de un ejercicio y convertirlo en GIF.
 *
 * Pensado sobre todo para la web (Expo Web): la persona escoge un video, se
 * sube al servidor y este lo devuelve ya convertido a GIF. Solo se aceptan
 * videos; si escoge otra cosa, el servidor responde con error y se muestra.
 */
import React, { useState } from 'react';
import { Modal, View, Text, Image, Pressable, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, radius, spacing, font, family, alpha } from '../theme';
import { API_URL } from '../config';
import * as endpoints from '../api/endpoints';
import Icon from './Icon';
import Button from './Button';

/** Convierte un tamaño en bytes a un texto corto (KB/MB). */
function tamano(bytes) {
  if (!bytes) return '';
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

export default function VideoGifUploader({ visible, onClose }) {
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState(null);
  const [resultado, setResultado] = useState(null); // { url, bytes }

  const reiniciar = () => {
    setError(null);
    setResultado(null);
    setSubiendo(false);
  };

  const cerrar = () => {
    reiniciar();
    onClose?.();
  };

  const escogerYSubir = async () => {
    setError(null);

    // En web no hace falta permiso; en el celular sí para la galería.
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

    setSubiendo(true);
    setResultado(null);
    try {
      // El picker entrega una URI (en web es un blob:); la volvemos a leer como
      // Blob para mandarla como cuerpo binario de la petición.
      const blob = await (await fetch(activo.uri)).blob();
      const contentType = activo.mimeType || blob.type || 'application/octet-stream';
      const { gif } = await endpoints.medios.videoAGif(blob, contentType);
      setResultado(gif);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubiendo(false);
    }
  };

  const urlCompleta = resultado ? `${API_URL}${resultado.url}` : null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={cerrar}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Subir video → GIF</Text>
          <Text style={styles.sub}>
            Escoja un video corto del ejercicio y lo convertimos en GIF. Solo se aceptan videos
            (mp4, mov, webm, m4v); no se admite ningún otro formato.
          </Text>

          {subiendo ? (
            <View style={styles.centro}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.cargandoText}>Convirtiendo su video a GIF…</Text>
            </View>
          ) : resultado ? (
            <View style={styles.centro}>
              <View style={styles.previewWrap}>
                <Image source={{ uri: urlCompleta }} style={styles.preview} resizeMode="contain" />
              </View>
              <Text style={styles.listoText}>
                <Icon name="checkmark-circle" size={15} color={colors.success} /> ¡Listo! GIF generado{resultado.bytes ? ` · ${tamano(resultado.bytes)}` : ''}
              </Text>
              <Button label="Subir otro video" icon="refresh" variant="secondary" onPress={reiniciar} style={styles.boton} />
            </View>
          ) : (
            <View style={styles.centro}>
              <View style={styles.iconWrap}>
                <Icon set="mci" name="video-plus-outline" size={40} color={colors.primary} />
              </View>
              <Button label="Escoger video" icon="cloud-upload-outline" onPress={escogerYSubir} style={styles.boton} />
            </View>
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable onPress={cerrar} style={({ pressed }) => [styles.cerrar, pressed && { opacity: 0.7 }]}>
            <Text style={styles.cerrarText}>Cerrar</Text>
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
    maxHeight: '88%',
  },
  handle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: colors.border, marginBottom: spacing.md },
  title: { color: colors.text, fontSize: font.h2, fontFamily: family.display, textAlign: 'center', marginBottom: spacing.sm },
  sub: { color: colors.textMuted, fontSize: font.body, fontFamily: family.body, textAlign: 'center', lineHeight: 21, marginBottom: spacing.lg },

  centro: { alignItems: 'center', paddingVertical: spacing.md, gap: spacing.md },
  iconWrap: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: alpha(colors.primary, 0.12),
    alignItems: 'center', justifyContent: 'center',
  },
  cargandoText: { color: colors.textMuted, fontSize: font.body, fontFamily: family.body, textAlign: 'center' },

  previewWrap: {
    width: '100%', height: 220, borderRadius: radius.md, overflow: 'hidden',
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border,
  },
  preview: { width: '100%', height: '100%' },
  listoText: { color: colors.text, fontSize: font.body, fontFamily: family.bodySemi, textAlign: 'center' },

  boton: { alignSelf: 'stretch' },
  error: { color: colors.danger, fontSize: font.small, fontFamily: family.bodyMedium, textAlign: 'center', marginTop: spacing.md },

  cerrar: { paddingVertical: spacing.sm, alignItems: 'center', minHeight: 44, justifyContent: 'center', marginTop: spacing.sm },
  cerrarText: { color: colors.textFaint, fontSize: font.body, fontFamily: family.bodySemi },
});
