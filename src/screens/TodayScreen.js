/**
 * Pantalla principal "Hoy".
 * Detecta automáticamente la rutina del día, muestra los ejercicios con su
 * demostración visual, barra de progreso, y permite marcar o saltar el día.
 */
import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, RefreshControl } from 'react-native';
import { colors, radius, spacing, font, family, shadow, alpha } from '../theme';
import { usePlan } from '../store/PlanStore';
import { dayKey, longDate } from '../utils/dates';
import { MENSAJES_DESCANSO, mensajeDelDia } from '../data/messages';
import Icon from '../components/Icon';
import ProgressBar from '../components/ProgressBar';
import ExerciseCard from '../components/ExerciseCard';
import ExerciseDetailModal from '../components/ExerciseDetailModal';
import SkipModal from '../components/SkipModal';
import SinRutina from '../components/SinRutina';

export default function TodayScreen() {
  const {
    getDay, toggleExercise, completeDay, skipDay, resetDay,
    rutina, origenRutina, nombre, descargar, cargando,
  } = usePlan();

  // TEMPORAL — solo para probar: fuerza "hoy" a lunes 27/07/2026.
  // Para volver a la fecha real, deje solo `const today = new Date();`.
  const today = new Date(2026, 6, 27);
  // const today = new Date();
  const key = dayKey(today);

  const [detail, setDetail] = useState(null);
  const [skipOpen, setSkipOpen] = useState(false);

  const day = getDay(key, today);
  const plan = day.plan;
  const exercises = plan?.exercises ?? [];
  const total = exercises.length;

  // Los hooks van todos antes de cualquier `return` condicional.
  const doneCount = useMemo(
    () => exercises.filter((e) => day.completed[e.id]).length,
    [exercises, day.completed],
  );

  if (!rutina) return <SinRutina />;

  const progress = total > 0 ? doneCount / total : 0;
  const accent = colors[plan?.accent] || colors.primary;
  const refrescar = (
    <RefreshControl refreshing={cargando} onRefresh={descargar} tintColor={colors.primary} />
  );

  // ---- Día de descanso ----
  if (plan?.rest) {
    const msg = mensajeDelDia(MENSAJES_DESCANSO, today);
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} refreshControl={refrescar}>
        <Header nombre={nombre} />
        <View style={styles.restCard}>
          <View style={[styles.restIconWrap, { backgroundColor: alpha(colors.rest, 0.16) }]}>
            <Icon set="mci" name="power-sleep" size={44} color={colors.rest} />
          </View>
          <Text style={styles.restTitle}>Día de descanso</Text>
          <Text style={styles.restMsg}>{msg}</Text>
          <View style={styles.restTips}>
            <Tip icon="water-outline" text="Tome agua durante todo el día" />
            <Tip icon="nutrition-outline" text="No se salte la proteína en las comidas" />
            <Tip icon="bed-outline" text="Duerma de 7 a 8 horas para recuperar" />
          </View>
        </View>
      </ScrollView>
    );
  }

  const isCompleted = day.status === 'completed';
  const isSkipped = day.status === 'skipped';

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={refrescar}
      >
        <Header nombre={nombre} />

        {/* La rutina de respaldo no está personalizada: hay que decirlo. */}
        {origenRutina === 'respaldo' && (
          <View style={styles.avisoRespaldo}>
            <Icon name="information-circle" size={18} color={colors.warning} />
            <Text style={styles.avisoRespaldoText}>
              Esta es la rutina base. Vaya a Progreso y regenérela para que el asistente se la ajuste a usted.
            </Text>
          </View>
        )}

        {/* Tarjeta de la rutina del día */}
        <View style={[styles.planCard, { borderColor: alpha(accent, 0.35) }]}>
          <View style={styles.planTop}>
            <View style={[styles.planIconWrap, { backgroundColor: alpha(accent, 0.16) }]}>
              <Icon set="mci" name={plan.icon} size={26} color={accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.planLabel}>LO DE HOY</Text>
              <Text style={styles.planTitle}>{plan.title}</Text>
              <Text style={styles.planSub}>{plan.subtitle}</Text>
            </View>
          </View>

          {isSkipped ? (
            <View style={[styles.statusPill, { backgroundColor: alpha(colors.warning, 0.14) }]}>
              <Icon name="play-skip-forward" size={16} color={colors.warning} />
              <Text style={[styles.statusText, { color: colors.warning }]}>Día saltado</Text>
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
                <View style={[styles.statusPill, { backgroundColor: alpha(colors.success, 0.14), marginTop: spacing.md }]}>
                  <Icon name="checkmark-circle" size={16} color={colors.success} />
                  <Text style={[styles.statusText, { color: colors.success }]}>¡Entrenamiento cumplido!</Text>
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
              <Icon name="arrow-undo-outline" size={19} color={colors.text} />
              <Text style={styles.btnGhostText}>Retomar el entrenamiento</Text>
            </Pressable>
          ) : (
            <>
              {!isCompleted && (
                <Pressable onPress={() => completeDay(key, today)} style={({ pressed }) => [styles.btn, { backgroundColor: accent }, pressed && styles.pressed]}>
                  <Icon name="checkmark-circle" size={20} color={colors.onPrimary} />
                  <Text style={styles.btnText}>Terminar el entrenamiento</Text>
                </Pressable>
              )}
              <Pressable onPress={() => setSkipOpen(true)} style={({ pressed }) => [styles.btn, styles.btnWarn, pressed && styles.pressed]}>
                <Icon name="play-skip-forward-outline" size={19} color={colors.warning} />
                <Text style={[styles.btnText, { color: colors.warning }]}>Saltar día</Text>
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>

      <ExerciseDetailModal exercise={detail} day={day.planDay} visible={!!detail} onClose={() => setDetail(null)} />
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

function Header({ nombre }) {
  const primerNombre = nombre?.split(' ')[0] ?? '';
  return (
    <View style={styles.header}>
      <View style={styles.greetingRow}>
        <Text style={styles.greeting} numberOfLines={1}>
          {primerNombre ? `¡Hola, ${primerNombre}!` : '¡Hola!'}
        </Text>
        <Icon set="mci" name="dumbbell" size={22} color={colors.primary} />
      </View>
      <Text style={styles.date}>{capitalize(longDate())}</Text>
    </View>
  );
}

function Tip({ icon, text }) {
  return (
    <View style={styles.tip}>
      <View style={styles.tipIconWrap}>
        <Icon name={icon} size={18} color={colors.rest} />
      </View>
      <Text style={styles.tipText}>{text}</Text>
    </View>
  );
}

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  header: { marginBottom: spacing.lg },
  greetingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  greeting: { color: colors.text, fontSize: font.h1, fontFamily: family.display, flexShrink: 1 },
  date: { color: colors.textMuted, fontSize: font.body, fontFamily: family.body, marginTop: 2 },

  avisoRespaldo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: alpha(colors.warning, 0.1),
    borderWidth: 1,
    borderColor: alpha(colors.warning, 0.3),
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  avisoRespaldoText: { color: colors.textMuted, fontSize: font.small, fontFamily: family.body, flex: 1, lineHeight: 18 },

  planCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.lg, borderWidth: 1, ...shadow.card },
  planTop: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  planIconWrap: { width: 52, height: 52, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  planLabel: { color: colors.textFaint, fontSize: font.tiny, fontFamily: family.bodyBold, letterSpacing: 1 },
  planTitle: { color: colors.text, fontSize: font.h2, fontFamily: family.display },
  planSub: { color: colors.textMuted, fontSize: font.small, fontFamily: family.body },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 },
  progressLabel: { color: colors.textMuted, fontSize: font.small, fontFamily: family.bodySemi },
  progressPct: { fontSize: font.h3, fontFamily: family.display },
  statusPill: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: radius.pill, paddingVertical: 9 },
  statusText: { fontFamily: family.bodyBold, fontSize: font.body },

  actions: { marginTop: spacing.sm },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderRadius: radius.md, paddingVertical: spacing.md + 2, marginBottom: spacing.md, minHeight: 52 },
  btnText: { color: colors.onPrimary, fontSize: font.h3, fontFamily: family.bodyBold },
  btnWarn: { backgroundColor: alpha(colors.warning, 0.12), borderWidth: 1, borderColor: alpha(colors.warning, 0.4) },
  btnGhost: { backgroundColor: colors.surfaceAlt },
  btnGhostText: { color: colors.text, fontSize: font.h3, fontFamily: family.bodySemi },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },

  restCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.xl, alignItems: 'center', ...shadow.card },
  restIconWrap: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  restTitle: { color: colors.rest, fontSize: font.h2, fontFamily: family.display, marginBottom: spacing.sm },
  restMsg: { color: colors.textMuted, fontSize: font.body, fontFamily: family.body, textAlign: 'center', lineHeight: 22, marginBottom: spacing.xl },
  restTips: { alignSelf: 'stretch', gap: spacing.sm },
  tip: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.md, gap: spacing.md },
  tipIconWrap: { width: 34, height: 34, borderRadius: radius.sm, backgroundColor: alpha(colors.rest, 0.14), alignItems: 'center', justifyContent: 'center' },
  tipText: { color: colors.text, fontSize: font.body, fontFamily: family.bodyMedium, flex: 1 },
});
