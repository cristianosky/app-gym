/**
 * Estado vacío cuando todavía no hay rutina descargada.
 *
 * Pasa en dos casos: la primera vez que se abre la app sin conexión, o si la
 * generación falló. En ambos, lo útil es un botón para volver a intentarlo,
 * no un mensaje de error a secas.
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import * as endpoints from '../api/endpoints';
import { colors, spacing, font, family, alpha } from '../theme';
import Icon from './Icon';
import Button from './Button';
import { usePlan } from '../store/PlanStore';

export default function SinRutina() {
  const { regenerarRutina, descargar, cargando, generandoRutina } = usePlan();
  const [error, setError] = useState(null);
  const [comprobando, setComprobando] = useState(false);

  const reintentar = async () => {
    setError(null);
    try {
      await descargar();
      await regenerarRutina();
    } catch (err) {
      setError(err.message);
    }
  };

  const comprobar = async () => {
    setComprobando(true);
    try {
      await descargar();
    } finally {
      setComprobando(false);
    }
  };

  if (generandoRutina) {
    return (
      <View style={styles.screen}>
        <ActivityIndicator size="large" color={colors.primary} style={styles.spinner} />
        <Text style={styles.title}>Estamos preparando su rutina</Text>
        <Text style={styles.text}>
          El asistente está armando su plan personalizado. Esto toma unos segundos.
        </Text>
        <Button
          label="Comprobar si ya está lista"
          icon="refresh"
          variant="secondary"
          onPress={comprobar}
          loading={comprobando}
          style={styles.boton}
        />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.iconWrap}>
        <Icon set="mci" name="clipboard-text-outline" size={44} color={colors.primary} />
      </View>

      <Text style={styles.title}>Todavía no tiene rutina</Text>
      <Text style={styles.text}>
        {error ??
          'No pudimos traer su plan. Revise que tenga internet y toque el botón para que el asistente se la arme.'}
      </Text>

      <Button
        label="Armar mi rutina"
        icon="sparkles"
        onPress={reintentar}
        loading={cargando}
        style={styles.boton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: alpha(colors.primary, 0.12),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: { color: colors.text, fontSize: font.h2, fontFamily: family.display, textAlign: 'center' },
  text: {
    color: colors.textMuted,
    fontSize: font.body,
    fontFamily: family.body,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  boton: { alignSelf: 'stretch' },
  spinner: { marginBottom: spacing.lg },
});
