/**
 * Reproductor de video de demostración (YouTube).
 *
 * Para no cargar el WebView hasta que haga falta, primero muestra la miniatura
 * del video con un botón de play; al tocarlo, monta el reproductor y reproduce.
 * Siempre ofrece además un enlace para abrirlo directo en la app de YouTube.
 *
 * Todos los IDs de video fueron verificados como incrustables (oEmbed) al
 * construir la app. Si alguno dejara de estar disponible, el botón "Abrir en
 * YouTube" hace una búsqueda del ejercicio como respaldo.
 */
import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, Image, Linking, ActivityIndicator, StyleSheet } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import { colors, radius, spacing, font } from '../theme';

export default function VideoPlayer({ videoId, query }) {
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(true);

  const openYouTube = useCallback(() => {
    const url = videoId
      ? `https://www.youtube.com/watch?v=${videoId}`
      : `https://www.youtube.com/results?search_query=${encodeURIComponent(query || '')}`;
    Linking.openURL(url).catch(() => {});
  }, [videoId, query]);

  return (
    <View>
      {videoId && active ? (
        <View style={styles.playerWrap}>
          {loading && <ActivityIndicator style={styles.loader} color={colors.primary} size="large" />}
          <YoutubePlayer
            height={200}
            play
            videoId={videoId}
            onReady={() => setLoading(false)}
            webViewProps={{ allowsInlineMediaPlayback: true }}
          />
        </View>
      ) : videoId ? (
        <Pressable onPress={() => setActive(true)} style={({ pressed }) => [styles.thumb, pressed && { opacity: 0.85 }]}>
          <Image
            source={{ uri: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` }}
            style={styles.thumbImg}
            resizeMode="cover"
          />
          <View style={styles.overlay}>
            <View style={styles.playBtn}>
              <Text style={styles.playIcon}>▶</Text>
            </View>
          </View>
        </Pressable>
      ) : null}

      <Pressable onPress={openYouTube} style={({ pressed }) => [styles.ytLink, pressed && { opacity: 0.7 }]}>
        <Text style={styles.ytLinkText}>{videoId ? '▶ Abrir en YouTube' : '🔍 Buscar video en YouTube'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  playerWrap: { borderRadius: radius.md, overflow: 'hidden', backgroundColor: '#000', minHeight: 200, justifyContent: 'center' },
  loader: { position: 'absolute', alignSelf: 'center', zIndex: 1 },
  thumb: { borderRadius: radius.md, overflow: 'hidden', backgroundColor: '#000', aspectRatio: 16 / 9 },
  thumbImg: { width: '100%', height: '100%' },
  overlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.28)' },
  playBtn: {
    width: 62, height: 62, borderRadius: 31, backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 2, borderColor: '#fff', alignItems: 'center', justifyContent: 'center',
  },
  playIcon: { color: '#fff', fontSize: 24, marginLeft: 4 },
  ytLink: { marginTop: spacing.sm, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: radius.sm, backgroundColor: colors.surfaceAlt },
  ytLinkText: { color: colors.primary, fontSize: font.body, fontWeight: '700' },
});
