/**
 * Pestaña de comida: el plan de alimentación de la semana.
 *
 * Se genera con IA la primera vez que se abre y queda guardado en el celular.
 * Cada día trae un menú distinto (no se repite el mismo plato dos veces en la
 * semana), para que la persona no se aburra comiendo lo mismo todos los días.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, radius, spacing, font, family, shadow, alpha } from '../theme';
import Icon from '../components/Icon';
import Button from '../components/Button';
import { usePlan } from '../store/PlanStore';
import { weekdayIndex } from '../utils/dates';

const DIAS_SEMANA = [
  { id: 1, short: 'L', label: 'Lunes' },
  { id: 2, short: 'M', label: 'Martes' },
  { id: 3, short: 'X', label: 'Miércoles' },
  { id: 4, short: 'J', label: 'Jueves' },
  { id: 5, short: 'V', label: 'Viernes' },
  { id: 6, short: 'S', label: 'Sábado' },
  { id: 7, short: 'D', label: 'Domingo' },
];

export default function FoodScreen() {
  const { comidas, cargarComidas } = usePlan();

  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [diaActivo, setDiaActivo] = useState(weekdayIndex());
  const [abierto, setAbierto] = useState(0);

  const generar = useCallback(
    async ({ forzar = false } = {}) => {
      setCargando(true);
      setError(null);
      try {
        await cargarComidas({ forzar });
      } catch (err) {
        setError(err.message);
      } finally {
        setCargando(false);
      }
    },
    [cargarComidas],
  );

  // Solo se genera solo la primera vez; después se usa lo guardado.
  useEffect(() => {
    if (!comidas && !cargando && !error) generar();
  }, [comidas, cargando, error, generar]);

  if (cargando && !comidas) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" color={colors.success} />
        <Text style={styles.centroTitulo}>Le estamos armando el plan de comidas</Text>
        <Text style={styles.centroTexto}>
          Un menú distinto para cada día de la semana. Un momentico.
        </Text>
      </View>
    );
  }

  if (!comidas) {
    return (
      <View style={styles.centro}>
        <View style={styles.iconoVacio}>
          <Icon name="restaurant-outline" size={40} color={colors.success} />
        </View>
        <Text style={styles.centroTitulo}>Sin plan de comidas todavía</Text>
        <Text style={styles.centroTexto}>{error ?? 'Toque el botón para que el asistente se lo arme.'}</Text>
        <Button label="Armar mi plan" icon="sparkles" onPress={() => generar()} style={styles.botonVacio} />
      </View>
    );
  }

  const dia = comidas.dias.find((d) => d.dia === diaActivo) ?? comidas.dias[0];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.h1}>Su comida</Text>
      <Text style={styles.subtitle}>{comidas.resumen}</Text>

      {/* Metas del día (aplican todos los días) */}
      <View style={styles.metasRow}>
        <Meta valor={comidas.caloriasObjetivo} unidad="kcal" label="Al día" color={colors.primary} icon="flame" />
        <Meta valor={comidas.proteinaObjetivo} unidad="g" label="Proteína" color={colors.secondary} icon="barbell" />
        <Meta valor={comidas.aguaLitros} unidad="L" label="Agua" color={colors.rest} icon="water" />
      </View>

      {/* Selector de día */}
      <View style={styles.diasFila}>
        {DIAS_SEMANA.map((d) => {
          const activo = d.id === diaActivo;
          return (
            <Pressable
              key={d.id}
              onPress={() => {
                setDiaActivo(d.id);
                setAbierto(0);
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected: activo }}
              accessibilityLabel={d.label}
              style={({ pressed }) => [styles.diaChip, activo && styles.diaChipActivo, pressed && { opacity: 0.8 }]}
            >
              <Text style={[styles.diaTexto, activo && styles.diaTextoActivo]}>{d.short}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Momentos del día escogido */}
      {dia?.bloques.map((bloque, i) => {
        const expandido = abierto === i;
        const plato = bloque.comida;

        return (
          <View key={bloque.momento} style={styles.card}>
            <Pressable
              onPress={() => setAbierto(expandido ? null : i)}
              accessibilityRole="button"
              accessibilityState={{ expanded: expandido }}
              style={({ pressed }) => [styles.cardHead, pressed && { backgroundColor: colors.surfaceAlt }]}
            >
              <View style={styles.momentoIcono}>
                <Icon name={bloque.icon} size={22} color={colors.success} />
              </View>

              <View style={{ flex: 1 }}>
                <View style={styles.momentoTituloRow}>
                  <Text style={styles.momentoTitulo}>{bloque.titulo}</Text>
                  {bloque.hora ? <Text style={styles.momentoHora}>{bloque.hora}</Text> : null}
                </View>
                <Text style={styles.momentoPlato} numberOfLines={1}>
                  {plato.nombre}
                </Text>
              </View>

              <Icon name={expandido ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textFaint} />
            </Pressable>

            {expandido && (
              <View style={styles.cardBody}>
                <Text style={styles.platoNombre}>{plato.nombre}</Text>
                <Text style={styles.platoDescripcion}>{plato.descripcion}</Text>

                <View style={styles.macrosRow}>
                  <View style={styles.macro}>
                    <Text style={styles.macroValor}>{plato.calorias}</Text>
                    <Text style={styles.macroLabel}>kcal</Text>
                  </View>
                  <View style={styles.macro}>
                    <Text style={styles.macroValor}>{plato.proteina} g</Text>
                    <Text style={styles.macroLabel}>proteína</Text>
                  </View>
                </View>

                <Text style={styles.seccionTitulo}>Qué necesita</Text>
                {plato.ingredientes.map((ing, idx) => (
                  <View key={idx} style={styles.ingredienteRow}>
                    <View style={styles.ingredienteDot} />
                    <Text style={styles.ingredienteText}>{ing}</Text>
                  </View>
                ))}

                {plato.tip ? (
                  <View style={styles.tipBox}>
                    <Icon name="bulb-outline" size={16} color={colors.warning} />
                    <Text style={styles.tipText}>{plato.tip}</Text>
                  </View>
                ) : null}
              </View>
            )}
          </View>
        );
      })}

      {/* Consejos */}
      {comidas.consejos?.length ? (
        <View style={styles.bloque}>
          <Text style={styles.bloqueTitulo}>Consejos</Text>
          {comidas.consejos.map((consejo, i) => (
            <View key={i} style={styles.consejoRow}>
              <Icon name="checkmark-circle" size={17} color={colors.success} style={{ marginTop: 1 }} />
              <Text style={styles.consejoText}>{consejo}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* Lista de mercado (para toda la semana) */}
      {comidas.listaMercado?.length ? (
        <View style={styles.bloque}>
          <Text style={styles.bloqueTitulo}>Lista del mercado de la semana</Text>
          <View style={styles.mercadoWrap}>
            {comidas.listaMercado.map((item, i) => (
              <View key={i} style={styles.mercadoChip}>
                <Text style={styles.mercadoText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.aviso}>
        <Icon name="medical-outline" size={16} color={colors.textFaint} />
        <Text style={styles.avisoText}>
          Esto es una guía, no una consulta médica. Si tiene alguna condición de salud, consúltelo con un profesional.
        </Text>
      </View>

      <Button
        label="Cambiar el plan de comidas"
        icon="refresh"
        variant="secondary"
        onPress={() => generar({ forzar: true })}
        loading={cargando}
        style={{ marginTop: spacing.lg }}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </ScrollView>
  );
}

function Meta({ valor, unidad, label, color, icon }) {
  return (
    <View style={styles.meta}>
      <Icon name={icon} size={18} color={color} style={{ marginBottom: 4 }} />
      <Text style={[styles.metaValor, { color }]}>
        {valor}
        <Text style={styles.metaUnidad}> {unidad}</Text>
      </Text>
      <Text style={styles.metaLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  h1: { color: colors.text, fontSize: font.h1, fontFamily: family.display },
  subtitle: {
    color: colors.textMuted,
    fontSize: font.body,
    fontFamily: family.body,
    marginTop: 4,
    marginBottom: spacing.lg,
    lineHeight: 21,
  },

  centro: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  centroTitulo: {
    color: colors.text,
    fontSize: font.h2,
    fontFamily: family.display,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  centroTexto: {
    color: colors.textMuted,
    fontSize: font.body,
    fontFamily: family.body,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 21,
  },
  iconoVacio: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: alpha(colors.success, 0.12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonVacio: { alignSelf: 'stretch', marginTop: spacing.xl },

  metasRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  meta: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    ...shadow.card,
  },
  metaValor: { fontSize: font.h3, fontFamily: family.bodyBold },
  metaUnidad: { fontSize: font.small, fontFamily: family.bodyMedium },
  metaLabel: { color: colors.textMuted, fontSize: font.tiny, fontFamily: family.bodyMedium, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },

  diasFila: { flexDirection: 'row', gap: 6, justifyContent: 'space-between', marginBottom: spacing.lg },
  diaChip: {
    flex: 1,
    aspectRatio: 0.9,
    maxWidth: 48,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  diaChipActivo: { backgroundColor: colors.success, borderColor: colors.success },
  diaTexto: { color: colors.textMuted, fontSize: font.h3, fontFamily: family.display },
  diaTextoActivo: { color: colors.onPrimary },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadow.card,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.md, minHeight: 44 },
  momentoIcono: {
    width: 46,
    height: 46,
    borderRadius: radius.sm,
    backgroundColor: alpha(colors.success, 0.14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  momentoTituloRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  momentoTitulo: { color: colors.text, fontSize: font.h3, fontFamily: family.bodySemi },
  momentoHora: { color: colors.textFaint, fontSize: font.small, fontFamily: family.body },
  momentoPlato: { color: colors.textMuted, fontSize: font.small, fontFamily: family.body, marginTop: 1 },

  cardBody: { paddingHorizontal: spacing.md, paddingBottom: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md },

  platoNombre: { color: colors.text, fontSize: font.h3, fontFamily: family.display },
  platoDescripcion: { color: colors.textMuted, fontSize: font.body, fontFamily: family.body, marginTop: 4, lineHeight: 21 },

  macrosRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md, marginBottom: spacing.md },
  macro: { backgroundColor: colors.surfaceAlt, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, alignItems: 'center', flex: 1 },
  macroValor: { color: colors.text, fontSize: font.h3, fontFamily: family.bodyBold },
  macroLabel: { color: colors.textMuted, fontSize: font.tiny, fontFamily: family.bodyMedium, textTransform: 'uppercase', letterSpacing: 0.5 },

  seccionTitulo: {
    color: colors.textMuted,
    fontSize: font.tiny,
    fontFamily: family.bodyBold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  ingredienteRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 5 },
  ingredienteDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.success },
  ingredienteText: { color: colors.textMuted, fontSize: font.body, fontFamily: family.body, flex: 1 },

  tipBox: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: alpha(colors.warning, 0.1),
    borderRadius: radius.sm,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  tipText: { color: colors.textMuted, fontSize: font.small, fontFamily: family.body, flex: 1, lineHeight: 18 },

  bloque: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.md, ...shadow.card },
  bloqueTitulo: { color: colors.text, fontSize: font.h3, fontFamily: family.bodySemi, marginBottom: spacing.md },
  consejoRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  consejoText: { color: colors.textMuted, fontSize: font.body, fontFamily: family.body, flex: 1, lineHeight: 20 },

  mercadoWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  mercadoChip: { backgroundColor: colors.surfaceAlt, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 7 },
  mercadoText: { color: colors.textMuted, fontSize: font.small, fontFamily: family.bodyMedium },

  aviso: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start', marginTop: spacing.lg, paddingHorizontal: spacing.xs },
  avisoText: { color: colors.textFaint, fontSize: font.small, fontFamily: family.body, flex: 1, lineHeight: 17 },
  error: { color: colors.danger, fontSize: font.small, fontFamily: family.bodyMedium, marginTop: spacing.md, textAlign: 'center' },
});
