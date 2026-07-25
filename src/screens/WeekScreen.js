/**
 * Vista semanal: el plan completo de los 7 días de un vistazo.
 * Cada día se puede tocar para desplegar la lista de ejercicios.
 * El día de hoy aparece resaltado, y se marca el estado (hecho/saltado).
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { colors, radius, spacing, font, shadow } from '../theme';
import { WEEK_LIST } from '../data/routine';
import { useWorkout } from '../store/WorkoutStore';
import { weekdayIndex, currentWeekKeys } from '../utils/dates';

const DAY_NAMES = { 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado', 7: 'Domingo' };

export default function WeekScreen() {
  const { getDay } = useWorkout();
  const todayIdx = weekdayIndex();
  const weekKeys = currentWeekKeys(); // claves Lunes..Domingo de esta semana
  const [open, setOpen] = useState(todayIdx);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.h1}>Tu semana</Text>
      <Text style={styles.subtitle}>Plan de recomposición · 5 días + 1 opcional</Text>

      {WEEK_LIST.map((plan) => {
        const idx = plan.day;
        const accent = colors[plan.accent] || colors.primary;
        const isToday = idx === todayIdx;
        const expanded = open === idx;

        // Estado real de esa fecha en la semana actual
        const dayState = getDay(weekKeys[idx - 1]);
        const status = plan.rest ? 'rest' : dayState.status;
        const trainCount = plan.exercises.filter((e) => !e.isWarmup && !e.isStretch).length;

        return (
          <View key={idx} style={[styles.card, isToday && { borderColor: accent, borderWidth: 2 }]}>
            <Pressable onPress={() => setOpen(expanded ? null : idx)} style={styles.cardHead}>
              <View style={[styles.dayIcon, { backgroundColor: accent + '22' }]}>
                <Text style={styles.dayIconText}>{plan.icon}</Text>
              </View>

              <View style={{ flex: 1 }}>
                <View style={styles.titleRow}>
                  <Text style={styles.dayName}>{DAY_NAMES[idx]}</Text>
                  {isToday && <View style={[styles.todayTag, { backgroundColor: accent }]}><Text style={styles.todayTagText}>HOY</Text></View>}
                  {plan.optional && <View style={styles.optTag}><Text style={styles.optTagText}>OPCIONAL</Text></View>}
                </View>
                <Text style={[styles.dayTitle, { color: accent }]}>{plan.title}</Text>
                <Text style={styles.dayMeta}>
                  {plan.rest ? 'Recuperación' : `${trainCount} ejercicios · ${plan.subtitle}`}
                </Text>
              </View>

              <StatusDot status={status} />
            </Pressable>

            {expanded && !plan.rest && (
              <View style={styles.exList}>
                {plan.exercises.map((ex) => {
                  const exAccent = colors[ex.group] || colors.primary;
                  return (
                    <View key={ex.id} style={styles.exRow}>
                      <View style={[styles.exDot, { backgroundColor: exAccent }]} />
                      <Text style={styles.exName} numberOfLines={1}>{ex.name}</Text>
                      <Text style={styles.exMeta}>{ex.sets}×{ex.reps}</Text>
                    </View>
                  );
                })}
              </View>
            )}

            {expanded && plan.rest && (
              <View style={styles.exList}>
                <Text style={styles.restNote}>Día de descanso activo. Camina, estírate y duerme bien. 🌙</Text>
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

function StatusDot({ status }) {
  const map = {
    completed: { c: colors.success, t: '✓' },
    skipped: { c: colors.warning, t: '⏭' },
    rest: { c: colors.rest, t: '○' },
    active: { c: colors.border, t: '' },
  };
  const s = map[status] || map.active;
  return (
    <View style={[styles.statusDot, { borderColor: s.c, backgroundColor: status === 'completed' ? s.c : 'transparent' }]}>
      <Text style={[styles.statusDotText, { color: status === 'completed' ? colors.bg : s.c }]}>{s.t}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  h1: { color: colors.text, fontSize: font.h1, fontWeight: '900' },
  subtitle: { color: colors.textMuted, fontSize: font.body, marginBottom: spacing.lg },

  card: { backgroundColor: colors.surface, borderRadius: radius.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', ...shadow.card },
  cardHead: { flexDirection: 'row', alignItems: 'center', padding: spacing.md },
  dayIcon: { width: 48, height: 48, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  dayIconText: { fontSize: 26 },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 1, gap: 6 },
  dayName: { color: colors.textMuted, fontSize: font.small, fontWeight: '700' },
  todayTag: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: radius.pill },
  todayTagText: { color: colors.bg, fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  optTag: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border },
  optTagText: { color: colors.textFaint, fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  dayTitle: { fontSize: font.h3, fontWeight: '800' },
  dayMeta: { color: colors.textFaint, fontSize: font.small, marginTop: 1 },

  statusDot: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginLeft: spacing.sm },
  statusDotText: { fontSize: 14, fontWeight: '900' },

  exList: { borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.bg },
  exRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7 },
  exDot: { width: 7, height: 7, borderRadius: 4, marginRight: spacing.sm },
  exName: { flex: 1, color: colors.text, fontSize: font.body },
  exMeta: { color: colors.textMuted, fontSize: font.small, fontWeight: '600' },
  restNote: { color: colors.textMuted, fontSize: font.body, paddingVertical: spacing.sm, lineHeight: 21 },
});
