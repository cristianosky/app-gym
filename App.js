/**
 * Mi Entrenamiento — entrenador personal de Cristian.
 * App Android (Expo / React Native). Navegación por pestañas inferiores
 * sin librerías externas para mantenerla ligera y robusta.
 */
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, SafeAreaView, StatusBar, Platform, ActivityIndicator } from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { colors, font, spacing } from './src/theme';
import { WorkoutProvider, useWorkout } from './src/store/WorkoutStore';
import TodayScreen from './src/screens/TodayScreen';
import WeekScreen from './src/screens/WeekScreen';
import ProgressScreen from './src/screens/ProgressScreen';

const TABS = [
  { key: 'today', label: 'Hoy', icon: '🏋️', Screen: TodayScreen },
  { key: 'week', label: 'Semana', icon: '🗓️', Screen: WeekScreen },
  { key: 'progress', label: 'Progreso', icon: '📈', Screen: ProgressScreen },
];

function Shell() {
  const { hydrated } = useWorkout();
  const [tab, setTab] = useState('today');

  if (!hydrated) {
    return (
      <View style={[styles.root, styles.center]}>
        <Text style={styles.logo}>Mi Entrenamiento 💪</Text>
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
      </View>
    );
  }

  const Active = TABS.find((t) => t.key === tab).Screen;

  return (
    <View style={styles.root}>
      <View style={{ flex: 1 }}>
        <Active />
      </View>

      {/* Barra de navegación inferior con botones grandes */}
      <View style={styles.tabBar}>
        {TABS.map((t) => {
          const active = t.key === tab;
          return (
            <Pressable key={t.key} onPress={() => setTab(t.key)} style={styles.tab} hitSlop={6}>
              <Text style={[styles.tabIcon, active && styles.tabIconActive]}>{t.icon}</Text>
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{t.label}</Text>
              {active && <View style={styles.tabDot} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaView style={styles.safe}>
      <ExpoStatusBar style="light" />
      {Platform.OS === 'android' && <StatusBar backgroundColor={colors.bg} barStyle="light-content" />}
      <WorkoutProvider>
        <Shell />
      </WorkoutProvider>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  root: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  logo: { color: colors.text, fontSize: font.h2, fontWeight: '900' },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? spacing.lg : spacing.sm,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 4 },
  tabIcon: { fontSize: 22, opacity: 0.5 },
  tabIconActive: { opacity: 1 },
  tabLabel: { color: colors.textFaint, fontSize: font.tiny, fontWeight: '700', marginTop: 2 },
  tabLabelActive: { color: colors.primary },
  tabDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.primary, marginTop: 3 },
});
