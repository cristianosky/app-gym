/**
 * Teclado numérico para el PIN de 4 dígitos.
 *
 * Se usa un teclado propio en vez del del sistema porque:
 *   - las teclas quedan grandes y en la parte baja de la pantalla, cómodas
 *     para escribir con una mano;
 *   - no aparece ni desaparece el teclado del sistema moviendo el diseño;
 *   - se controla que solo entren dígitos.
 *
 * El PIN nunca se muestra: se pintan puntos que se llenan.
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Vibration, Platform } from 'react-native';
import { colors, radius, spacing, font, family, alpha, motion } from '../theme';
import Icon from './Icon';

const TECLAS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', null, '0', 'borrar'];
const LONGITUD = 4;

/**
 * @param {object} props
 * @param {string} props.value PIN actual
 * @param {(pin: string) => void} props.onChange
 * @param {() => void} [props.onComplete] se llama al llegar a 4 dígitos
 * @param {boolean} [props.error] pinta los puntos en rojo y los sacude
 */
export default function PinPad({ value, onChange, onComplete, error = false, disabled = false }) {
  const sacudida = useRef(new Animated.Value(0)).current;
  const yaCompletado = useRef(false);

  // Al fallar, los puntos se sacuden: refuerza el error sin depender del color.
  useEffect(() => {
    if (!error) return;
    if (Platform.OS !== 'web') Vibration.vibrate(60);

    Animated.sequence([
      Animated.timing(sacudida, { toValue: 1, duration: 55, useNativeDriver: true }),
      Animated.timing(sacudida, { toValue: -1, duration: 55, useNativeDriver: true }),
      Animated.timing(sacudida, { toValue: 0.6, duration: 55, useNativeDriver: true }),
      Animated.timing(sacudida, { toValue: 0, duration: 55, useNativeDriver: true }),
    ]).start();
  }, [error, sacudida]);

  // Avisar una sola vez cuando se completan los 4 dígitos.
  useEffect(() => {
    if (value.length === LONGITUD && !yaCompletado.current) {
      yaCompletado.current = true;
      onComplete?.();
    }
    if (value.length < LONGITUD) yaCompletado.current = false;
  }, [value, onComplete]);

  const pulsar = (tecla) => {
    if (disabled) return;

    if (tecla === 'borrar') {
      onChange(value.slice(0, -1));
      return;
    }
    if (value.length >= LONGITUD) return;
    onChange(value + tecla);
  };

  const colorPunto = error ? colors.danger : colors.primary;
  const desplazamiento = sacudida.interpolate({ inputRange: [-1, 1], outputRange: [-9, 9] });

  return (
    <View style={styles.wrap}>
      <Animated.View
        style={[styles.dots, { transform: [{ translateX: desplazamiento }] }]}
        accessibilityLabel={`PIN: ${value.length} de ${LONGITUD} dígitos`}
      >
        {Array.from({ length: LONGITUD }).map((_, i) => {
          const lleno = i < value.length;
          return (
            <View
              key={i}
              style={[
                styles.dot,
                lleno && { backgroundColor: colorPunto, borderColor: colorPunto },
                error && { borderColor: colors.danger },
              ]}
            />
          );
        })}
      </Animated.View>

      <View style={styles.grid}>
        {TECLAS.map((tecla, i) =>
          tecla === null ? (
            <View key={`vacio-${i}`} style={styles.key} />
          ) : (
            <Pressable
              key={tecla}
              onPress={() => pulsar(tecla)}
              disabled={disabled}
              accessibilityRole="button"
              accessibilityLabel={tecla === 'borrar' ? 'Borrar último dígito' : `Número ${tecla}`}
              style={({ pressed }) => [
                styles.key,
                tecla !== 'borrar' && styles.keyFilled,
                pressed && !disabled && styles.keyPressed,
                disabled && styles.keyDisabled,
              ]}
            >
              {tecla === 'borrar' ? (
                <Icon name="backspace-outline" size={24} color={colors.textMuted} />
              ) : (
                <Text style={styles.keyText}>{tecla}</Text>
              )}
            </Pressable>
          ),
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  dots: { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.xl },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    backgroundColor: 'transparent',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.md,
    maxWidth: 300,
  },
  key: {
    width: 82,
    height: 66,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyFilled: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  keyPressed: { backgroundColor: alpha(colors.primary, 0.18), transform: [{ scale: 0.97 }] },
  keyDisabled: { opacity: 0.4 },
  keyText: { color: colors.text, fontSize: 27, fontFamily: family.display },
});

export const PIN_LENGTH = LONGITUD;
export const DURACION_ANIMACION = motion.fast;
