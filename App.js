/**
 * Mi Entrenamiento — app de gimnasio con rutina y plan de comidas generados
 * con inteligencia artificial.
 *
 * Estructura:
 *   AuthProvider   → sesión guardada en el celular
 *     PlanProvider → rutina, comidas y progreso
 *       Shell      → si no hay sesión muestra el registro/ingreso; si la hay,
 *                    las 5 pestañas de la app
 *
 * La navegación por pestañas es propia (sin librerías externas) para mantener
 * la app liviana, que es lo que importa en celulares de gama media.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, SafeAreaView, StatusBar, Platform, ActivityIndicator } from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import {
  Barlow_400Regular,
  Barlow_500Medium,
  Barlow_600SemiBold,
  Barlow_700Bold,
} from '@expo-google-fonts/barlow';
import {
  BarlowCondensed_600SemiBold,
  BarlowCondensed_700Bold,
  BarlowCondensed_800ExtraBold,
} from '@expo-google-fonts/barlow-condensed';
import { colors, family, font, spacing, radius } from './src/theme';
import { AuthProvider, useAuth } from './src/store/AuthStore';
import { PlanProvider, usePlan } from './src/store/PlanStore';
import Icon from './src/components/Icon';
import AuthFlow from './src/screens/auth/AuthFlow';
import TodayScreen from './src/screens/TodayScreen';
import WeekScreen from './src/screens/WeekScreen';
import FoodScreen from './src/screens/FoodScreen';
import CoachScreen from './src/screens/CoachScreen';
import ProgressScreen from './src/screens/ProgressScreen';

SplashScreen.preventAutoHideAsync().catch(() => {});

const TABS = [
  { key: 'hoy', label: 'Hoy', icon: 'barbell-outline', iconActive: 'barbell', Screen: TodayScreen },
  { key: 'semana', label: 'Semana', icon: 'calendar-outline', iconActive: 'calendar', Screen: WeekScreen },
  { key: 'comida', label: 'Comida', icon: 'restaurant-outline', iconActive: 'restaurant', Screen: FoodScreen },
  { key: 'asistente', label: 'Asistente', icon: 'chatbubbles-outline', iconActive: 'chatbubbles', Screen: CoachScreen },
  { key: 'progreso', label: 'Progreso', icon: 'stats-chart-outline', iconActive: 'stats-chart', Screen: ProgressScreen },
];

/** Pantalla de carga con la marca, mientras se restaura la sesión. */
function Cargando() {
  return (
    <View style={[styles.root, styles.center]}>
      <Icon set="mci" name="dumbbell" size={40} color={colors.primary} />
      <Text style={styles.logo}>Mi Entrenamiento</Text>
      <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.md }} />
    </View>
  );
}

/** Pestañas de la app, una vez la persona ya entró. */
function MainTabs() {
  const { hidratado } = usePlan();
  const [tab, setTab] = useState('hoy');

  if (!hidratado) return <Cargando />;

  const Activa = TABS.find((t) => t.key === tab).Screen;

  return (
    <View style={styles.root}>
      <View style={{ flex: 1 }}>
        <Activa />
      </View>

      <View style={styles.tabBar}>
        {TABS.map((t) => {
          const activa = t.key === tab;
          return (
            <Pressable
              key={t.key}
              onPress={() => setTab(t.key)}
              style={({ pressed }) => [styles.tab, pressed && styles.tabPressed]}
              hitSlop={6}
              accessibilityRole="tab"
              accessibilityState={{ selected: activa }}
              accessibilityLabel={t.label}
            >
              {activa && <View style={styles.tabActiveBg} />}
              <Icon
                name={activa ? t.iconActive : t.icon}
                size={21}
                color={activa ? colors.primary : colors.textFaint}
              />
              <Text style={[styles.tabLabel, activa && styles.tabLabelActive]} numberOfLines={1}>
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** Decide qué mostrar según haya sesión o no. */
function Shell() {
  const { autenticado, cargando } = useAuth();

  if (cargando) return <Cargando />;
  if (!autenticado) return <AuthFlow />;
  return <MainTabs />;
}

export default function App() {
  const [fontsLoaded, fontsError] = useFonts({
    Barlow_400Regular,
    Barlow_500Medium,
    Barlow_600SemiBold,
    Barlow_700Bold,
    BarlowCondensed_600SemiBold,
    BarlowCondensed_700Bold,
    BarlowCondensed_800ExtraBold,
  });

  const onLayoutRoot = useCallback(async () => {
    if (fontsLoaded || fontsError) {
      await SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontsError]);

  useEffect(() => {
    onLayoutRoot();
  }, [onLayoutRoot]);

  if (!fontsLoaded && !fontsError) {
    return null;
  }

  return (
    <SafeAreaView style={styles.safe} onLayout={onLayoutRoot}>
      <ExpoStatusBar style="light" />
      {Platform.OS === 'android' && <StatusBar backgroundColor={colors.bg} barStyle="light-content" />}
      <AuthProvider>
        <PlanProvider>
          <Shell />
        </PlanProvider>
      </AuthProvider>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  root: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  logo: { color: colors.text, fontSize: font.h2, fontFamily: family.display },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.bgElevated,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.xs,
    paddingBottom: Platform.OS === 'ios' ? spacing.lg : spacing.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 2,
    borderRadius: radius.md,
    gap: 3,
    minHeight: 48,
  },
  tabPressed: { opacity: 0.7 },
  tabActiveBg: {
    position: 'absolute',
    top: 0,
    left: spacing.sm,
    right: spacing.sm,
    height: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  tabLabel: { color: colors.textFaint, fontSize: font.tiny, fontFamily: family.bodySemi, marginTop: 1 },
  tabLabelActive: { color: colors.primary },
});
