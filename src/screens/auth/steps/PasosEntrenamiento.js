/**
 * Pasos 3, 4 y 5 del registro: nivel y lugar, objetivos, y días de entreno.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, spacing, font, family, radius, alpha } from '../../../theme';
import SelectCard from '../../../components/SelectCard';
import FormField from '../../../components/FormField';
import Icon from '../../../components/Icon';
import { TituloPaso } from './PasosPersonales';

const MAXIMO_OBJETIVOS = 3;

/** Paso 3: experiencia y dónde entrena. */
export function PasoNivelLugar({ datos, actualizar, errores, opciones }) {
  return (
    <View>
      <TituloPaso
        titulo="Su experiencia"
        descripcion="Para no mandarle ejercicios que todavía no le convienen."
      />

      <Text style={styles.etiqueta}>¿Cuánto lleva entrenando?</Text>
      {opciones.levels.map((nivel) => (
        <SelectCard
          key={nivel.id}
          title={nivel.label}
          description={nivel.description}
          icon={nivel.icon}
          iconSet={nivel.iconSet}
          selected={datos.level === nivel.id}
          onPress={() => actualizar({ level: nivel.id })}
        />
      ))}
      {errores.level ? <Text style={styles.error}>{errores.level}</Text> : null}

      <Text style={[styles.etiqueta, { marginTop: spacing.lg }]}>¿Dónde va a entrenar?</Text>
      {opciones.environments.map((lugar) => (
        <SelectCard
          key={lugar.id}
          title={lugar.label}
          description={lugar.description}
          icon={lugar.icon}
          iconSet={lugar.iconSet}
          selected={datos.environment === lugar.id}
          onPress={() => actualizar({ environment: lugar.id })}
          accent={colors.secondary}
        />
      ))}
      {errores.environment ? <Text style={styles.error}>{errores.environment}</Text> : null}
    </View>
  );
}

/** Paso 4: objetivos (hasta tres, el primero manda). */
export function PasoObjetivos({ datos, actualizar, errores, opciones }) {
  const alternar = (id) => {
    const actuales = datos.goals;
    if (actuales.includes(id)) {
      actualizar({ goals: actuales.filter((g) => g !== id) });
      return;
    }
    if (actuales.length >= MAXIMO_OBJETIVOS) return;
    actualizar({ goals: [...actuales, id] });
  };

  const lleno = datos.goals.length >= MAXIMO_OBJETIVOS;

  return (
    <View>
      <TituloPaso
        titulo="¿Qué quiere lograr?"
        descripcion={`Escoja hasta ${MAXIMO_OBJETIVOS}. El primero que marque es el que manda en su rutina.`}
      />

      {datos.goals.length > 0 && (
        <View style={styles.resumenObjetivos}>
          <Text style={styles.resumenTitulo}>Su orden de prioridad</Text>
          {datos.goals.map((id, i) => {
            const goal = opciones.goals.find((g) => g.id === id);
            return (
              <View key={id} style={styles.prioridadFila}>
                <View style={styles.prioridadNum}>
                  <Text style={styles.prioridadNumText}>{i + 1}</Text>
                </View>
                <Text style={styles.prioridadTexto}>{goal?.label ?? id}</Text>
                <Pressable
                  onPress={() => alternar(id)}
                  hitSlop={10}
                  accessibilityLabel={`Quitar ${goal?.label}`}
                  accessibilityRole="button"
                >
                  <Icon name="close-circle" size={20} color={colors.textFaint} />
                </Pressable>
              </View>
            );
          })}
        </View>
      )}

      {opciones.goals.map((goal) => {
        const seleccionado = datos.goals.includes(goal.id);
        return (
          <SelectCard
            key={goal.id}
            title={goal.label}
            description={goal.description}
            icon={goal.icon}
            iconSet={goal.iconSet}
            selected={seleccionado}
            onPress={() => alternar(goal.id)}
            accent={colors[goal.accent] ?? colors.primary}
            // Al llegar al tope, los no seleccionados se atenúan.
            style={!seleccionado && lleno ? { opacity: 0.5 } : undefined}
          />
        );
      })}

      {errores.goals ? <Text style={styles.error}>{errores.goals}</Text> : null}

      <View style={{ marginTop: spacing.lg }}>
        <FormField
          label="¿Algo más que quiera lograr? (opcional)"
          value={datos.goalNote}
          onChangeText={(v) => actualizar({ goalNote: v })}
          placeholder="Ej.: quiero bajar la barriga antes de diciembre"
          maxLength={300}
          multiline
          hint="Escríbalo con sus palabras. El asistente lo tiene en cuenta al armar la rutina."
        />
      </View>
    </View>
  );
}

/** Paso 5: días de la semana, duración y lesiones. */
export function PasoDias({ datos, actualizar, errores, opciones }) {
  const alternarDia = (id) => {
    const actuales = datos.trainingDays;
    actualizar({
      trainingDays: actuales.includes(id)
        ? actuales.filter((d) => d !== id)
        : [...actuales, id].sort((a, b) => a - b),
    });
  };

  const duraciones = [30, 45, 60, 75, 90];

  return (
    <View>
      <TituloPaso
        titulo="¿Qué días entrena?"
        descripcion="Marque solo los días a los que de verdad puede ir. Es mejor 3 días cumplidos que 6 en el papel."
      />

      <View style={styles.diasFila}>
        {opciones.weekdays.map((dia) => {
          const activo = datos.trainingDays.includes(dia.id);
          return (
            <Pressable
              key={dia.id}
              onPress={() => alternarDia(dia.id)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: activo }}
              accessibilityLabel={dia.label}
              style={({ pressed }) => [styles.diaChip, activo && styles.diaChipActivo, pressed && { opacity: 0.8 }]}
            >
              <Text style={[styles.diaTexto, activo && styles.diaTextoActivo]}>{dia.short}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.contador}>
        {datos.trainingDays.length === 0
          ? 'Sin días seleccionados'
          : `${datos.trainingDays.length} ${datos.trainingDays.length === 1 ? 'día' : 'días'} a la semana`}
      </Text>
      {errores.trainingDays ? <Text style={styles.error}>{errores.trainingDays}</Text> : null}

      <Text style={[styles.etiqueta, { marginTop: spacing.xl }]}>¿Cuánto tiempo tiene por sesión?</Text>
      <View style={styles.duracionFila}>
        {duraciones.map((minutos) => {
          const activo = datos.sessionMinutes === minutos;
          return (
            <Pressable
              key={minutos}
              onPress={() => actualizar({ sessionMinutes: minutos })}
              accessibilityRole="radio"
              accessibilityState={{ selected: activo }}
              accessibilityLabel={`${minutos} minutos`}
              style={({ pressed }) => [styles.duracionChip, activo && styles.duracionChipActivo, pressed && { opacity: 0.8 }]}
            >
              <Text style={[styles.duracionTexto, activo && styles.duracionTextoActivo]}>{minutos} min</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ marginTop: spacing.xl }}>
        <FormField
          label="¿Alguna lesión o molestia? (opcional)"
          value={datos.injuries}
          onChangeText={(v) => actualizar({ injuries: v })}
          placeholder="Ej.: me duele la rodilla derecha al bajar"
          maxLength={300}
          multiline
          hint="Con esto evitamos los ejercicios que le puedan doler y le proponemos otros."
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  etiqueta: {
    color: colors.textMuted,
    fontSize: font.small,
    fontFamily: family.bodySemi,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
  },
  error: { color: colors.danger, fontSize: font.small, fontFamily: family.bodyMedium, marginTop: 4 },

  resumenObjetivos: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  resumenTitulo: {
    color: colors.textFaint,
    fontSize: font.tiny,
    fontFamily: family.bodyBold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  prioridadFila: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  prioridadNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prioridadNumText: { color: colors.onPrimary, fontSize: font.tiny, fontFamily: family.bodyBold },
  prioridadTexto: { flex: 1, color: colors.text, fontSize: font.body, fontFamily: family.bodyMedium },

  diasFila: { flexDirection: 'row', gap: 6, justifyContent: 'space-between' },
  diaChip: {
    flex: 1,
    aspectRatio: 0.82,
    maxWidth: 52,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  diaChipActivo: { backgroundColor: colors.primary, borderColor: colors.primary },
  diaTexto: { color: colors.textMuted, fontSize: font.h3, fontFamily: family.display },
  diaTextoActivo: { color: colors.onPrimary },
  contador: { color: colors.textFaint, fontSize: font.small, fontFamily: family.bodyMedium, marginTop: spacing.sm },

  duracionFila: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  duracionChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    minHeight: 44,
    justifyContent: 'center',
  },
  duracionChipActivo: { backgroundColor: alpha(colors.secondary, 0.16), borderColor: colors.secondary },
  duracionTexto: { color: colors.textMuted, fontSize: font.body, fontFamily: family.bodySemi },
  duracionTextoActivo: { color: colors.secondary },
});
