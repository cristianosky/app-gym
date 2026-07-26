/**
 * Vista semanal: el plan completo de los 7 días de un vistazo.
 * Cada día se puede tocar para desplegar la lista de ejercicios.
 * El día de hoy aparece resaltado, y se marca el estado (hecho/saltado).
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { colors, radius, spacing, font, family, shadow, alpha } from '../theme';
import { usePlan } from '../store/PlanStore';
import { weekdayIndex, currentWeekKeys } from '../utils/dates';
import Icon from '../components/Icon';
import SinRutina from '../components/SinRutina';
import ExerciseDetailModal from '../components/ExerciseDetailModal';
import AddExerciseModal from '../components/AddExerciseModal';

const DAY_NAMES = { 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado', 7: 'Domingo' };

export default function WeekScreen() {
  const { getDay, rutina } = usePlan();
  const todayIdx = weekdayIndex();
  const weekKeys = currentWeekKeys(); // claves Lunes..Domingo de esta semana
  const [open, setOpen] = useState(todayIdx);
  const [detalle, setDetalle] = useState(null);
  const [agregandoDia, setAgregandoDia] = useState(null);

  if (!rutina) return <SinRutina />;

  const diasEntreno = rutina.dias.filter((d) => !d.rest).length;

  return (
    <>
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.h1}>Su semana</Text>
      <Text style={styles.subtitle}>
        {rutina.nombre} · {diasEntreno} {diasEntreno === 1 ? 'día' : 'días'} de entrenamiento
      </Text>

      {rutina.dias.map((plan) => {
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
            <Pressable
              onPress={() => setOpen(expanded ? null : idx)}
              style={({ pressed }) => [styles.cardHead, pressed && styles.cardHeadPressed]}
              accessibilityRole="button"
              accessibilityState={{ expanded }}
            >
              <View style={[styles.dayIcon, { backgroundColor: alpha(accent, 0.16) }]}>
                <Icon set="mci" name={plan.icon} size={24} color={accent} />
              </View>

              <View style={{ flex: 1 }}>
                <View style={styles.titleRow}>
                  <Text style={styles.dayName}>{DAY_NAMES[idx]}</Text>
                  {isToday && (
                    <View style={[styles.todayTag, { backgroundColor: accent }]}>
                      <Text style={styles.todayTagText}>HOY</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.dayTitle, { color: accent }]}>{plan.title}</Text>
                <Text style={styles.dayMeta}>
                  {plan.rest ? 'Recuperación' : `${trainCount} ejercicios · ${plan.subtitle}`}
                </Text>
              </View>

              <StatusDot status={status} />
              <Icon
                name={expanded ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={colors.textFaint}
                style={{ marginLeft: spacing.xs }}
              />
            </Pressable>

            {expanded && !plan.rest && (
              <View style={styles.exList}>
                {plan.exercises.map((ex) => {
                  const exAccent = colors[ex.group] || colors.primary;
                  return (
                    <Pressable
                      key={ex.id}
                      onPress={() => setDetalle({ exercise: ex, day: idx })}
                      style={({ pressed }) => [styles.exRow, pressed && styles.exRowPressed]}
                      accessibilityRole="button"
                      accessibilityLabel={`Ver detalle de ${ex.name}`}
                    >
                      <View style={[styles.exDot, { backgroundColor: exAccent }]} />
                      <Text style={styles.exName} numberOfLines={1}>{ex.name}</Text>
                      <Text style={styles.exMeta}>{ex.sets}×{ex.reps}</Text>
                      <Icon name="chevron-forward" size={14} color={colors.textFaint} />
                    </Pressable>
                  );
                })}

                <Pressable
                  onPress={() => setAgregandoDia(idx)}
                  style={({ pressed }) => [styles.agregarRow, pressed && styles.exRowPressed]}
                  accessibilityRole="button"
                  accessibilityLabel={`Agregar ejercicio a ${DAY_NAMES[idx]}`}
                >
                  <Icon name="add-circle-outline" size={17} color={accent} />
                  <Text style={[styles.agregarText, { color: accent }]}>Agregar ejercicio</Text>
                </Pressable>
              </View>
            )}

            {expanded && plan.rest && (
              <View style={styles.exList}>
                <View style={styles.restNoteRow}>
                  <Icon set="mci" name="power-sleep" size={18} color={colors.rest} />
                  <Text style={styles.restNote}>Día de descanso. Camine, estírese y duerma bien.</Text>
                </View>
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>

    <ExerciseDetailModal
      exercise={detalle?.exercise}
      day={detalle?.day}
      visible={!!detalle}
      onClose={() => setDetalle(null)}
    />
    <AddExerciseModal
      visible={!!agregandoDia}
      day={agregandoDia}
      onClose={() => setAgregandoDia(null)}
      onAdded={() => setAgregandoDia(null)}
    />
    </>
  );
}

function StatusDot({ status }) {
  const map = {
    completed: { c: colors.success, icon: 'checkmark' },
    skipped: { c: colors.warning, icon: 'play-skip-forward' },
    rest: { c: colors.rest, icon: 'moon' },
    active: { c: colors.border, icon: null },
  };
  const s = map[status] || map.active;
  const filled = status === 'completed';
  return (
    <View style={[styles.statusDot, { borderColor: s.c, backgroundColor: filled ? s.c : 'transparent' }]}>
      {s.icon && <Icon name={s.icon} size={14} color={filled ? colors.onPrimary : s.c} />}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  h1: { color: colors.text, fontSize: font.h1, fontFamily: family.display },
  subtitle: { color: colors.textMuted, fontSize: font.body, fontFamily: family.body, marginBottom: spacing.lg },

  card: { backgroundColor: colors.surface, borderRadius: radius.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', ...shadow.card },
  cardHead: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, minHeight: 44 },
  cardHeadPressed: { backgroundColor: colors.surfaceAlt },
  dayIcon: { width: 48, height: 48, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 1, gap: 6 },
  dayName: { color: colors.textMuted, fontSize: font.small, fontFamily: family.bodyBold },
  todayTag: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: radius.pill },
  todayTagText: { color: colors.onPrimary, fontSize: 9, fontFamily: family.bodyBold, letterSpacing: 0.5 },
  optTag: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border },
  optTagText: { color: colors.textFaint, fontSize: 9, fontFamily: family.bodyBold, letterSpacing: 0.5 },
  dayTitle: { fontSize: font.h3, fontFamily: family.displaySemi },
  dayMeta: { color: colors.textFaint, fontSize: font.small, fontFamily: family.body, marginTop: 1 },

  statusDot: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginLeft: spacing.sm },

  exList: { borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.bg },
  exRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7, gap: 6, minHeight: 32 },
  exRowPressed: { opacity: 0.65 },
  exDot: { width: 7, height: 7, borderRadius: 4, marginRight: spacing.sm },
  exName: { flex: 1, color: colors.text, fontSize: font.body, fontFamily: family.body },
  exMeta: { color: colors.textMuted, fontSize: font.small, fontFamily: family.bodySemi },
  restNoteRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  restNote: { flex: 1, color: colors.textMuted, fontSize: font.body, fontFamily: family.body, lineHeight: 21 },

  agregarRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm + 2, marginTop: 2 },
  agregarText: { fontSize: font.small, fontFamily: family.bodyBold },
});
