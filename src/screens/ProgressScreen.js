/**
 * Vista de progreso: racha de días entrenados, total de la semana,
 * porcentaje de cumplimiento y desglose completados vs. saltados.
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors, radius, spacing, font, family, shadow, alpha } from '../theme';
import { Alert } from '../utils/alert';
import { usePlan } from '../store/PlanStore';
import { useAuth } from '../store/AuthStore';
import ProgressBar from '../components/ProgressBar';
import Button from '../components/Button';
import Icon from '../components/Icon';
import EditProfileModal from './EditProfileModal';
import ChangePinModal from './ChangePinModal';
import { weekdayIndex } from '../utils/dates';

const DAY_LETTER = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

export default function ProgressScreen() {
  const { weekStats, streak, getDay, getDayPlan, rutina } = usePlan();
  const stats = weekStats();
  const racha = streak();
  const todayIdx = weekdayIndex();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.h1}>Su progreso</Text>
      <Text style={styles.subtitle}>{rutina?.nombre ?? 'Su plan en marcha'}</Text>

      {/* Racha destacada */}
      <View style={styles.streakCard}>
        <View style={[styles.streakIconWrap, { backgroundColor: alpha(colors.warning, 0.16) }]}>
          <Icon set="mci" name="fire" size={36} color={colors.warning} />
        </View>
        <Text style={styles.streakNum}>{racha}</Text>
        <Text style={styles.streakLabel}>{racha === 1 ? 'día de racha' : 'días de racha'}</Text>
        <Text style={styles.streakHint}>
          {racha === 0 ? 'Entrene hoy para arrancar su racha' : 'Siga así, no rompa la cadena'}
        </Text>
      </View>

      {/* Tarjetas de métricas */}
      <View style={styles.metricsRow}>
        <Metric icon="checkmark-circle" value={stats.completed} label="Completados" color={colors.success} />
        <Metric icon="play-skip-forward" value={stats.skipped} label="Saltados" color={colors.warning} />
        <Metric icon="calendar" value={`${stats.trainingDays}`} label="Días de plan" color={colors.primary} />
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
            const plan = getDayPlan(dayIdx);
            const st = plan?.rest ? 'rest' : getDay(k).status;
            const isToday = dayIdx === todayIdx;
            return (
              <View key={k} style={styles.dotCol}>
                <View style={[styles.dot, dotStyle(st), isToday && styles.dotToday]}>
                  {dotIcon(st) && <Icon name={dotIcon(st)} size={14} color={dotIconColor(st)} />}
                </View>
                <Text style={[styles.dotLabel, isToday && { color: colors.text, fontFamily: family.bodyBold }]}>{DAY_LETTER[i]}</Text>
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

      <SeccionCuenta />

      <View style={styles.footerRow}>
        <Icon set="mci" name="dumbbell" size={14} color={colors.textFaint} />
        <Text style={styles.footer}>Más vale constante que perfecto. Cada día cuenta.</Text>
      </View>
    </ScrollView>
  );
}

/**
 * Acciones de la cuenta.
 *
 * Regenerar la rutina se pone aquí y no en un ajuste escondido porque es la
 * acción que la gente busca cuando cambia de peso o de objetivo.
 */
function SeccionCuenta() {
  const { regenerarRutina, cargando, origenRutina } = usePlan();
  const { user, cerrarSesion } = useAuth();
  const [error, setError] = useState(null);
  const [editandoPerfil, setEditandoPerfil] = useState(false);
  const [cambiandoPin, setCambiandoPin] = useState(false);

  const regenerar = () => {
    Alert.alert(
      'Armar la rutina de nuevo',
      'El asistente le va a armar una rutina nueva con sus datos actuales. La que tiene ahora se reemplaza. ¿Sigue?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Armar de nuevo',
          onPress: async () => {
            setError(null);
            try {
              await regenerarRutina();
            } catch (err) {
              setError(err.message);
            }
          },
        },
      ],
    );
  };

  const salir = () => {
    Alert.alert('Cerrar sesión', '¿Seguro que quiere salir? Su progreso queda guardado.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: cerrarSesion },
    ]);
  };

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Su cuenta</Text>

      <View style={styles.cuentaFila}>
        <View style={styles.cuentaAvatar}>
          <Text style={styles.cuentaAvatarText}>{(user?.name ?? '?').charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cuentaNombre}>{user?.name}</Text>
          <Text style={styles.cuentaUsuario}>@{user?.username}</Text>
        </View>
      </View>

      <View style={styles.cuentaAcciones}>
        <Button
          label={origenRutina === 'respaldo' ? 'Personalizar mi rutina con IA' : 'Armar mi rutina de nuevo'}
          icon="sparkles"
          variant={origenRutina === 'respaldo' ? 'primary' : 'secondary'}
          onPress={regenerar}
          loading={cargando}
        />
        <Button label="Editar mi perfil" icon="person-outline" variant="secondary" onPress={() => setEditandoPerfil(true)} />
        <Button label="Cambiar mi PIN" icon="lock-closed-outline" variant="secondary" onPress={() => setCambiandoPin(true)} />
        <Button label="Cerrar sesión" icon="log-out-outline" variant="ghost" onPress={salir} />
      </View>

      {error ? <Text style={styles.cuentaError}>{error}</Text> : null}

      <EditProfileModal visible={editandoPerfil} onClose={() => setEditandoPerfil(false)} />
      <ChangePinModal visible={cambiandoPin} onClose={() => setCambiandoPin(false)} />
    </View>
  );
}

function Metric({ icon, value, label, color }) {
  return (
    <View style={styles.metric}>
      <Icon name={icon} size={18} color={color} style={{ marginBottom: 4 }} />
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
const dotIcon = (s) => (s === 'completed' ? 'checkmark' : s === 'skipped' ? 'close' : s === 'rest' ? 'moon' : null);
const dotIconColor = (s) => (s === 'completed' ? colors.onPrimary : s === 'skipped' ? colors.warning : s === 'rest' ? colors.rest : colors.textFaint);
function dotStyle(s) {
  if (s === 'completed') return { backgroundColor: colors.success, borderColor: colors.success };
  if (s === 'skipped') return { borderColor: colors.warning };
  if (s === 'rest') return { borderColor: colors.rest };
  return { borderColor: colors.border };
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  h1: { color: colors.text, fontSize: font.h1, fontFamily: family.display },
  subtitle: { color: colors.textMuted, fontSize: font.body, fontFamily: family.body, marginBottom: spacing.lg },

  streakCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.xl, alignItems: 'center', marginBottom: spacing.lg, borderWidth: 1, borderColor: alpha(colors.warning, 0.3), ...shadow.card },
  streakIconWrap: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  streakNum: { color: colors.warning, fontSize: 60, fontFamily: family.displayBlack, lineHeight: 64 },
  streakLabel: { color: colors.text, fontSize: font.h3, fontFamily: family.bodySemi },
  streakHint: { color: colors.textMuted, fontSize: font.small, fontFamily: family.body, marginTop: spacing.sm, textAlign: 'center' },

  metricsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  metric: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, alignItems: 'center', ...shadow.card },
  metricValue: { fontSize: font.h1, fontFamily: family.display },
  metricLabel: { color: colors.textMuted, fontSize: font.tiny, fontFamily: family.bodyMedium, marginTop: 2, textAlign: 'center' },

  card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.lg, marginBottom: spacing.lg, ...shadow.card },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  cardTitle: { color: colors.text, fontSize: font.h3, fontFamily: family.bodySemi, marginBottom: spacing.sm },
  bigPct: { fontSize: font.h1, fontFamily: family.display },
  cardHint: { color: colors.textFaint, fontSize: font.small, fontFamily: family.body, marginTop: spacing.sm },

  weekDots: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs, marginBottom: spacing.md },
  dotCol: { alignItems: 'center' },
  dot: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  dotToday: { transform: [{ scale: 1.12 }] },
  dotLabel: { color: colors.textMuted, fontSize: font.small, fontFamily: family.body },

  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 5 },
  legendText: { color: colors.textMuted, fontSize: font.small, fontFamily: family.body },

  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: spacing.sm },
  footer: { color: colors.textFaint, fontSize: font.small, fontFamily: family.body, textAlign: 'center' },

  cuentaFila: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  cuentaAcciones: { gap: spacing.sm, marginTop: spacing.md },
  cuentaAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: alpha(colors.primary, 0.16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  cuentaAvatarText: { color: colors.primary, fontSize: font.h2, fontFamily: family.displayBlack },
  cuentaNombre: { color: colors.text, fontSize: font.h3, fontFamily: family.bodySemi },
  cuentaUsuario: { color: colors.textFaint, fontSize: font.small, fontFamily: family.body },
  cuentaError: { color: colors.danger, fontSize: font.small, fontFamily: family.bodyMedium, marginTop: spacing.sm },
});
