/**
 * Pantalla de bienvenida: primer contacto con la app.
 * Dos caminos claros y nada más, para no marear a quien apenas la abre.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, font, family, radius, alpha } from '../../theme';
import Icon from '../../components/Icon';
import Button from '../../components/Button';

export default function WelcomeScreen({ onRegistrar, onIngresar }) {
  return (
    <View style={styles.screen}>
      <View style={styles.hero}>
        <View style={styles.logoWrap}>
          <Icon set="mci" name="dumbbell" size={48} color={colors.primary} />
        </View>
        <Text style={styles.title}>Mi Entrenamiento</Text>
        <Text style={styles.subtitle}>
          Su rutina y su plan de comidas, armados a la medida por inteligencia artificial.
        </Text>
      </View>

      <View style={styles.features}>
        <Feature
          icon="barbell-outline"
          title="Rutina personalizada"
          text="Según su peso, estatura, nivel y los días que pueda entrenar."
        />
        <Feature
          icon="restaurant-outline"
          title="Plan de comidas"
          text="Con comida colombiana de verdad y de la que se consigue fácil."
        />
        <Feature
          icon="chatbubbles-outline"
          title="Asistente 24/7"
          text="Pregúntele lo que sea del gym. Hasta le puede mandar fotos."
        />
      </View>

      <View style={styles.actions}>
        <Button label="Crear mi cuenta" icon="arrow-forward" onPress={onRegistrar} />
        <Button label="Ya tengo cuenta" variant="secondary" onPress={onIngresar} />
      </View>
    </View>
  );
}

function Feature({ icon, title, text }) {
  return (
    <View style={styles.feature}>
      <View style={styles.featureIcon}>
        <Icon name={icon} size={20} color={colors.secondary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureText}>{text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg, justifyContent: 'space-between' },
  hero: { alignItems: 'center', marginTop: spacing.xxl },
  logoWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: alpha(colors.primary, 0.14),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: { color: colors.text, fontSize: font.display, fontFamily: family.displayBlack, letterSpacing: 0.5 },
  subtitle: {
    color: colors.textMuted,
    fontSize: font.body,
    fontFamily: family.body,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
  },

  features: { gap: spacing.md, marginVertical: spacing.xl },
  feature: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: alpha(colors.secondary, 0.12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTitle: { color: colors.text, fontSize: font.body, fontFamily: family.bodySemi },
  featureText: { color: colors.textMuted, fontSize: font.small, fontFamily: family.body, marginTop: 1, lineHeight: 18 },

  actions: { gap: spacing.md, marginBottom: spacing.lg },
});
