/**
 * Vista de progreso: racha de días entrenados, total de la semana,
 * porcentaje de cumplimiento y desglose completados vs. saltados.
 */
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors, radius, spacing, font, shadow } from '../theme';
import { useWorkout } from '../store/WorkoutStore';
import ProgressBar from '../components/ProgressBar';
import { weekdayIndex } from '../utils/dates';
import { WEEK } from '../data/routine';

const DAY_LETTER = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

export default function ProgressScreen() {
  const { weekStats, streak, getDay } = useWorkout();
  const stats = weekStats();
  const racha = streak();
  const todayIdx = weekdayIndex();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.h1}>Tu progreso</Text>
      <Text style={styles.subtitle}>Recomposición en marcha 🔥</Text>

      {/* Racha destacada */}
      <View style={[styles.streakCard]}>
        <Text style={styles.streakEmoji}>🔥</Text>
        <Text style={styles.streakNum}>{racha}</Text>
        <Text style={styles.streakLabel}>{racha === 1 ? 'día de racha' : 'días de racha'}</Text>
        <Text style={styles.streakHint}>
          {racha === 0 ? 'Entrena hoy para empezar tu racha' : '¡Sigue así, no rompas la cadena!'}
        </Text>
      </View>

      {/* Tarjetas de métricas */}
      <View style={styles.metricsRow}>
        <Metric value={stats.completed} label="Completados" color={colors.success} />
        <Metric value={stats.skipped} label="Saltados" color={colors.warning} />
        <Metric value={`${stats.trainingDays}`} label="Días de plan" color={colors.primary} />
      </View>

      {/* Cumplimiento semanal */}
      <View style={styles.card}>
        <View style={styles.cardHead}>
          <Text style={styles.cardTitle}>Cumplimiento de la semana</Text>
          <Text style={[styles.bigPct, { color: complianceColor(stats.compliance) }]}>{stats.compliance}%</Text>
        </View>
        <ProgressBar value={stats.compliance / 100} color={complianceColor(stats.compliance)} height={12} />
        <Text style={styles.cardHint}>
          {stats.completed} de {stats.completed + stats.skipped || 0} entrenamientos realizados esta semana
        </Text>
      </View>

      {/* Mapa de la semana */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Esta semana</Text>
        <View style={styles.weekDots}>
          {stats.keys.map((k, i) => {
            const dayIdx = i + 1;
            const plan = WEEK[dayIdx];
            const st = plan?.rest ? 'rest' : getDay(k).status;
            const isToday = dayIdx === todayIdx;
            return (
              <View key={k} style={styles.dotCol}>
                <View style={[styles.dot, dotStyle(st), isToday && styles.dotToday]}>
                  <Text style={[styles.dotIcon, { color: dotIconColor(st) }]}>{dotIcon(st)}</Text>
                </View>
                <Text style={[styles.dotLabel, isToday && { color: colors.text, fontWeight: '800' }]}>{DAY_LETTER[i]}</Text>
              </View>
            );
          })}
        </View>
        <View style={styles.legend}>
          <LegendItem color={colors.success} text="Hecho" />
          <LegendItem color={colors.warning} text="Saltado" />
          <LegendItem color={colors.rest} text="Descanso" />
          <LegendItem color={colors.border} text="Pendiente" />
        </View>
      </View>

      <Text style={styles.footer}>Constancia &gt; perfección. Cada día cuenta. 💪</Text>
    </ScrollView>
  );
}

function Metric({ value, label, color }) {
  return (
    <View style={styles.metric}>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function LegendItem({ color, text }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{text}</Text>
    </View>
  );
}

const complianceColor = (p) => (p >= 80 ? colors.success : p >= 50 ? colors.warning : colors.danger);
const dotIcon = (s) => (s === 'completed' ? '✓' : s === 'skipped' ? '✕' : s === 'rest' ? '○' : '');
const dotIconColor = (s) => (s === 'completed' ? colors.bg : s === 'skipped' ? colors.warning : s === 'rest' ? colors.rest : colors.textFaint);
function dotStyle(s) {
  if (s === 'completed') return { backgroundColor: colors.success, borderColor: colors.success };
  if (s === 'skipped') return { borderColor: colors.warning };
  if (s === 'rest') return { borderColor: colors.rest };
  return { borderColor: colors.border };
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  h1: { color: colors.text, fontSize: font.h1, fontWeight: '900' },
  subtitle: { color: colors.textMuted, fontSize: font.body, marginBottom: spacing.lg },

  streakCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.xl, alignItems: 'center', marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.warning + '44', ...shadow.card },
  streakEmoji: { fontSize: 40 },
  streakNum: { color: colors.warning, fontSize: 56, fontWeight: '900', lineHeight: 60 },
  streakLabel: { color: colors.text, fontSize: font.h3, fontWeight: '700' },
  streakHint: { color: colors.textMuted, fontSize: font.small, marginTop: spacing.sm, textAlign: 'center' },

  metricsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  metric: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, alignItems: 'center', ...shadow.card },
  metricValue: { fontSize: font.h1, fontWeight: '900' },
  metricLabel: { color: colors.textMuted, fontSize: font.tiny, marginTop: 2, textAlign: 'center' },

  card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.lg, marginBottom: spacing.lg, ...shadow.card },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  cardTitle: { color: colors.text, fontSize: font.h3, fontWeight: '700', marginBottom: spacing.sm },
  bigPct: { fontSize: font.h1, fontWeight: '900' },
  cardHint: { color: colors.textFaint, fontSize: font.small, marginTop: spacing.sm },

  weekDots: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs, marginBottom: spacing.md },
  dotCol: { alignItems: 'center' },
  dot: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  dotToday: { transform: [{ scale: 1.12 }] },
  dotIcon: { fontSize: 15, fontWeight: '900' },
  dotLabel: { color: colors.textMuted, fontSize: font.small },

  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 5 },
  legendText: { color: colors.textMuted, fontSize: font.small },

  footer: { color: colors.textFaint, fontSize: font.small, textAlign: 'center', marginTop: spacing.sm, fontStyle: 'italic' },
});
