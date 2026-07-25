/**
 * Reproductor de video LOCAL (offline) con expo-video.
 *
 * Se usa como demostración visual del ejercicio:
 *   - En la tarjeta (miniatura): sin controles, en bucle y silenciado, como un GIF.
 *   - En el detalle (grande): con controles nativos para pausar, subir volumen
 *     o ver en pantalla completa.
 *
 * Rellena el contenedor que lo envuelve (el contenedor define tamaño y esquinas).
 */
import React from 'react';
import { StyleSheet } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

export default function LocalVideo({
  source,
  controls = true,
  contentFit = 'cover',
  loop = true,
  muted = true,
  autoPlay = true,
  style,
}) {
  const player = useVideoPlayer(source, (p) => {
    p.loop = loop;
    p.muted = muted;
    if (autoPlay) p.play();
  });

  return (
    <VideoView
      style={[styles.fill, style]}
      player={player}
      nativeControls={controls}
      allowsFullscreen={controls}
      allowsPictureInPicture={false}
      contentFit={contentFit}
    />
  );
}

const styles = StyleSheet.create({
  fill: { width: '100%', height: '100%' },
});
