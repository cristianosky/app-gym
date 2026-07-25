/**
 * Indicador de progreso del registro: "Paso 3 de 6".
 * Muestra el número además de los puntos, porque contar puntitos en una
 * pantalla pequeña es incómodo.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, font, family, radius } from '../theme';

export default function StepDots({ total, current }) {
  return (
    <View style={styles.wrap} accessibilityLabel={`Paso ${current + 1} de ${total}`}>
      <View style={styles.dots}>
        {Array.from({ length: total }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === current && styles.dotActive,
              i < current && styles.dotDone,
            ]}
          />
        ))}
      </View>
      <Text style={styles.label}>
        Paso {current + 1} de {total}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm, marginBottom: spacing.lg },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { flex: 1, height: 4, borderRadius: radius.pill, backgroundColor: colors.border },
  dotDone: { backgroundColor: colors.primaryDark },
  dotActive: { backgroundColor: colors.primary },
  label: { color: colors.textFaint, fontSize: font.tiny, fontFamily: family.bodySemi, letterSpacing: 0.5 },
});
