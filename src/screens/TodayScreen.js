/**
 * Pantalla principal "Hoy".
 * Detecta automáticamente la rutina del día, muestra los ejercicios con su
 * demostración visual, barra de progreso, y permite marcar o saltar el día.
 */
import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { colors, radius, spacing, font, shadow } from '../theme';
import { useWorkout } from '../store/WorkoutStore';
import { dayKey, longDate } from '../utils/dates';
import { REST_MESSAGES } from '../data/routine';
import ProgressBar from '../components/ProgressBar';
import ExerciseCard from '../components/ExerciseCard';
import ExerciseDetailModal from '../components/ExerciseDetailModal';
import SkipModal from '../components/SkipModal';

export default function TodayScreen() {
  const { getDay, toggleExercise, completeDay, skipDay, resetDay } = useWorkout();
  const today = new Date();
  const key = dayKey(today);
  const day = getDay(key, today);
  const plan = day.plan;

  const [detail, setDetail] = useState(null);
  const [skipOpen, setSkipOpen] = useState(false);

  const exercises = plan?.exercises ?? [];
  const total = exercises.length;
  const doneCount = useMemo(
    () => exercises.filter((e) => day.completed[e.id]).length,
    [exercises, day.completed],
  );
  const progress = total > 0 ? doneCount / total : 0;
  const accent = colors[plan?.accent] || colors.primary;

  // ---- Día de descanso ----
  if (plan?.rest) {
    const msg = REST_MESSAGES[today.getDate() % REST_MESSAGES.length];
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Header />
        <View style={[styles.restCard]}>
          <Text style={styles.restEmoji}>😴</Text>
          <Text style={styles.restTitle}>Día de descanso</Text>
          <Text style={styles.restMsg}>{msg}</Text>
          <View style={styles.restTips}>
            <Tip icon="💧" text="Hidrátate bien durante el día" />
            <Tip icon="🥩" text="Prioriza proteína en tus comidas" />
            <Tip icon="🛌" text="Duerme 7–8 horas para recuperar" />
          </View>
        </View>
      </ScrollView>
    );
  }

  const isCompleted = day.status === 'completed';
  const isSkipped = day.status === 'skipped';

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Header />

        {/* Tarjeta de la rutina del día */}
        <View style={[styles.planCard, { borderColor: accent + '55' }]}>
          <View style={styles.planTop}>
            <Text style={styles.planIcon}>{plan.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.planLabel}>RUTINA DE HOY</Text>
              <Text style={styles.planTitle}>{plan.title}</Text>
              <Text style={styles.planSub}>{plan.subtitle}</Text>
            </View>
          </View>

          {isSkipped ? (
            <View style={[styles.statusPill, { backgroundColor: colors.warning + '22' }]}>
              <Text style={[styles.statusText, { color: colors.warning }]}>⏭️ Día saltado</Text>
            </View>
          ) : (
            <>
              <View style={styles.progressRow}>
                <Text style={styles.progressLabel}>
                  {doneCount}/{total} ejercicios
                </Text>
                <Text style={[styles.progressPct, { color: accent }]}>{Math.round(progress * 100)}%</Text>
              </View>
              <ProgressBar value={progress} color={accent} />
              {isCompleted && (
                <View style={[styles.statusPill, { backgroundColor: colors.success + '22', marginTop: spacing.md }]}>
                  <Text style={[styles.statusText, { color: colors.success }]}>✅ ¡Entrenamiento completado!</Text>
                </View>
              )}
            </>
          )}
        </View>

        {/* Lista de ejercicios */}
        {exercises.map((ex) => (
          <ExerciseCard
            key={ex.id}
            exercise={ex}
            done={!!day.completed[ex.id]}
            onToggle={() => toggleExercise(key, ex.id, today)}
            onPress={() => setDetail(ex)}
          />
        ))}

        {/* Acciones */}
        <View style={styles.actions}>
          {isSkipped ? (
            <Pressable onPress={() => resetDay(key)} style={({ pressed }) => [styles.btn, styles.btnGhost, pressed && styles.pressed]}>
              <Text style={styles.btnGhostText}>↩️ Retomar entrenamiento</Text>
            </Pressable>
          ) : (
            <>
              {!isCompleted && (
                <Pressable onPress={() => completeDay(key, today)} style={({ pressed }) => [styles.btn, { backgroundColor: accent }, pressed && styles.pressed]}>
                  <Text style={styles.btnText}>✓ Terminar entrenamiento</Text>
                </Pressable>
              )}
              <Pressable onPress={() => setSkipOpen(true)} style={({ pressed }) => [styles.btn, styles.btnWarn, pressed && styles.pressed]}>
                <Text style={[styles.btnText, { color: colors.warning }]}>⏭️ Saltar día</Text>
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>

      <ExerciseDetailModal exercise={detail} visible={!!detail} onClose={() => setDetail(null)} />
      <SkipModal
        visible={skipOpen}
        dayTitle={plan.title}
        onClose={() => setSkipOpen(false)}
        onSkip={() => { skipDay(key, 'skip', today); setSkipOpen(false); }}
        onMove={() => { skipDay(key, 'move', today); setSkipOpen(false); }}
      />
    </View>
  );
}

function Header() {
  return (
    <View style={styles.header}>
      <Text style={styles.greeting}>¡Hola, Cristian! 💪</Text>
      <Text style={styles.date}>{capitalize(longDate())}</Text>
    </View>
  );
}

function Tip({ icon, text }) {
  return (
    <View style={styles.tip}>
      <Text style={styles.tipIcon}>{icon}</Text>
      <Text style={styles.tipText}>{text}</Text>
    </View>
  );
}

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  header: { marginBottom: spacing.lg },
  greeting: { color: colors.text, fontSize: font.h1, fontWeight: '900' },
  date: { color: colors.textMuted, fontSize: font.body, marginTop: 2 },

  planCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.lg, borderWidth: 1, ...shadow.card },
  planTop: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  planIcon: { fontSize: 40, marginRight: spacing.md },
  planLabel: { color: colors.textFaint, fontSize: font.tiny, fontWeight: '800', letterSpacing: 1 },
  planTitle: { color: colors.text, fontSize: font.h2, fontWeight: '900' },
  planSub: { color: colors.textMuted, fontSize: font.small },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 },
  progressLabel: { color: colors.textMuted, fontSize: font.small, fontWeight: '600' },
  progressPct: { fontSize: font.h3, fontWeight: '900' },
  statusPill: { borderRadius: radius.pill, paddingVertical: 8, alignItems: 'center' },
  statusText: { fontWeight: '800', fontSize: font.body },

  actions: { marginTop: spacing.sm },
  btn: { borderRadius: radius.md, paddingVertical: spacing.md + 2, alignItems: 'center', marginBottom: spacing.md },
  btnText: { color: colors.bg, fontSize: font.h3, fontWeight: '800' },
  btnWarn: { backgroundColor: colors.warning + '18', borderWidth: 1, borderColor: colors.warning + '55' },
  btnGhost: { backgroundColor: colors.surfaceAlt },
  btnGhostText: { color: colors.text, fontSize: font.h3, fontWeight: '700' },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },

  restCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.xl, alignItems: 'center', ...shadow.card },
  restEmoji: { fontSize: 64, marginBottom: spacing.sm },
  restTitle: { color: colors.rest, fontSize: font.h2, fontWeight: '900', marginBottom: spacing.sm },
  restMsg: { color: colors.textMuted, fontSize: font.body, textAlign: 'center', lineHeight: 22, marginBottom: spacing.xl },
  restTips: { alignSelf: 'stretch', gap: spacing.sm },
  tip: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.md },
  tipIcon: { fontSize: 22, marginRight: spacing.md },
  tipText: { color: colors.text, fontSize: font.body, flex: 1 },
});
