/**
 * Reordena qué rutina de entreno le toca a cada día de la semana.
 * El calendario no cambia (lunes sigue siendo lunes): solo se reparte
 * distinto el contenido entre los días que la persona ya entrena.
 */
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, spacing, font, family, radius } from '../theme';
import Icon from './Icon';
import ConfirmModal from './ConfirmModal';
import { usePlan } from '../store/PlanStore';

const DAY_NAMES = { 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado', 7: 'Domingo' };

export default function OrdenSemana() {
  const { rutina, reordenarRutina } = usePlan();

  const entrenos = (rutina?.dias ?? []).filter((d) => !d.rest).sort((a, b) => a.day - b.day);
  const diasSemana = entrenos.map((d) => d.day);

  const [orden, setOrden] = useState(diasSemana);
  const [guardando, setGuardando] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState(null);

  useEffect(() => {
    setOrden(diasSemana);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rutina]);

  if (entrenos.length < 2) return null;

  const porDia = new Map(entrenos.map((d) => [d.day, d]));
  const cambio = orden.some((d, i) => d !== diasSemana[i]);

  const mover = (indice, direccion) => {
    const destino = indice + direccion;
    if (destino < 0 || destino >= orden.length) return;
    const siguiente = [...orden];
    [siguiente[indice], siguiente[destino]] = [siguiente[destino], siguiente[indice]];
    setOrden(siguiente);
  };

  const guardar = async () => {
    setGuardando(true);
    try {
      await reordenarRutina(orden);
    } catch (err) {
      setErrorGuardar(err.message ?? 'Intente de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <View>
      <Text style={styles.etiqueta}>Orden de la semana</Text>
      <Text style={styles.descripcion}>
        Cambie qué rutina le toca cada día, sin perder el trabajo que ya armó el asistente.
      </Text>

      <View style={styles.lista}>
        {orden.map((diaId, i) => {
          const contenido = porDia.get(diaId);
          const accent = colors[contenido?.accent] || colors.primary;
          const weekday = diasSemana[i];
          return (
            <View key={weekday} style={styles.fila}>
              <View style={[styles.dot, { backgroundColor: accent }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.diaSemana}>{DAY_NAMES[weekday]}</Text>
                <Text style={styles.tituloRutina} numberOfLines={1}>{contenido?.title}</Text>
              </View>
              <View style={styles.flechas}>
                <Pressable
                  onPress={() => mover(i, -1)}
                  disabled={i === 0}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={`Subir ${contenido?.title}`}
                  style={({ pressed }) => [styles.flechaBtn, pressed && i !== 0 && { opacity: 0.7 }]}
                >
                  <Icon name="chevron-up" size={18} color={i === 0 ? colors.textFaint : colors.textMuted} />
                </Pressable>
                <Pressable
                  onPress={() => mover(i, 1)}
                  disabled={i === orden.length - 1}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={`Bajar ${contenido?.title}`}
                  style={({ pressed }) => [styles.flechaBtn, pressed && i !== orden.length - 1 && { opacity: 0.7 }]}
                >
                  <Icon name="chevron-down" size={18} color={i === orden.length - 1 ? colors.textFaint : colors.textMuted} />
                </Pressable>
              </View>
            </View>
          );
        })}
      </View>

      {cambio && (
        <Pressable
          onPress={guardar}
          disabled={guardando}
          accessibilityRole="button"
          style={({ pressed }) => [styles.guardarBtn, pressed && { opacity: 0.85 }, guardando && { opacity: 0.6 }]}
        >
          <Icon name="checkmark-circle" size={18} color={colors.onPrimary} />
          <Text style={styles.guardarTexto}>{guardando ? 'Guardando…' : 'Guardar este orden'}</Text>
        </Pressable>
      )}

      <ConfirmModal
        visible={Boolean(errorGuardar)}
        onClose={() => setErrorGuardar(null)}
        icon="alert-circle-outline"
        title="No se pudo guardar"
        message={errorGuardar}
        confirmText="Entendido"
        destructive
      />
    </View>
  );
}

const styles = StyleSheet.create({
  etiqueta: {
    color: colors.textMuted,
    fontSize: font.small,
    fontFamily: family.bodySemi,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.xs,
  },
  descripcion: { color: colors.textFaint, fontSize: font.small, fontFamily: family.body, marginBottom: spacing.md, lineHeight: 18 },

  lista: { gap: spacing.sm },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  diaSemana: { color: colors.textFaint, fontSize: font.tiny, fontFamily: family.bodyBold, textTransform: 'uppercase', letterSpacing: 0.5 },
  tituloRutina: { color: colors.text, fontSize: font.body, fontFamily: family.bodyMedium, marginTop: 1 },

  flechas: { gap: 2 },
  flechaBtn: { width: 34, height: 26, alignItems: 'center', justifyContent: 'center' },

  guardarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    minHeight: 48,
    marginTop: spacing.md,
  },
  guardarTexto: { color: colors.onPrimary, fontSize: font.body, fontFamily: family.bodyBold },
});
