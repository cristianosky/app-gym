/** Barra de progreso animada y reutilizable. */
import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import { colors, radius } from '../theme';

export default function ProgressBar({ value = 0, color = colors.primary, height = 10, track = colors.surfaceAlt }) {
  const w = useRef(new Animated.Value(0)).current;
  const pct = Math.max(0, Math.min(1, value));

  useEffect(() => {
    Animated.spring(w, { toValue: pct, friction: 9, tension: 60, useNativeDriver: false }).start();
  }, [pct, w]);

  return (
    <View style={[styles.track, { height, backgroundColor: track }]}>
      <Animated.View
        style={{
          height,
          borderRadius: radius.pill,
          backgroundColor: color,
          width: w.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: '100%', borderRadius: radius.pill, overflow: 'hidden' },
});
