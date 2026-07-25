/**
 * Pasos 1 y 2 del registro: quién es y sus datos físicos.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, font, family } from '../../../theme';
import FormField from '../../../components/FormField';
import SelectCard from '../../../components/SelectCard';

/** Encabezado común de cada paso. */
export function TituloPaso({ titulo, descripcion }) {
  return (
    <View style={styles.encabezado}>
      <Text style={styles.titulo}>{titulo}</Text>
      {descripcion ? <Text style={styles.descripcion}>{descripcion}</Text> : null}
    </View>
  );
}

/** Paso 1: nombre y usuario. */
export function PasoIdentidad({ datos, actualizar, errores }) {
  return (
    <View>
      <TituloPaso
        titulo="¿Cómo se llama?"
        descripcion="Así lo saludamos en la app y así le habla el asistente."
      />

      <FormField
        label="Su nombre"
        value={datos.name}
        onChangeText={(v) => actualizar({ name: v })}
        placeholder="Cristian"
        maxLength={40}
        autoCapitalize="words"
        error={errores.name}
        autoFocus
      />

      <FormField
        label="Usuario para ingresar"
        value={datos.username}
        onChangeText={(v) => actualizar({ username: v.toLowerCase().replace(/[^a-z0-9._-]/g, '') })}
        placeholder="cristian23"
        maxLength={20}
        autoCapitalize="none"
        error={errores.username}
        hint="Solo letras, números, punto, guion o guion bajo. Es con lo que va a entrar."
      />
    </View>
  );
}

/** Paso 2: edad, sexo, peso y estatura. */
export function PasoCuerpo({ datos, actualizar, errores, opciones }) {
  return (
    <View>
      <TituloPaso
        titulo="Sus datos"
        descripcion="Con esto calculamos sus calorías y ajustamos las cargas de la rutina."
      />

      <View style={styles.fila}>
        <View style={styles.mitad}>
          <FormField
            label="Peso"
            value={datos.weightKg}
            onChangeText={(v) => actualizar({ weightKg: v.replace(/[^0-9.]/g, '') })}
            placeholder="75"
            keyboardType="decimal-pad"
            maxLength={5}
            suffix="kg"
            error={errores.weightKg}
          />
        </View>
        <View style={styles.mitad}>
          <FormField
            label="Estatura"
            value={datos.heightCm}
            onChangeText={(v) => actualizar({ heightCm: v.replace(/[^0-9]/g, '') })}
            placeholder="175"
            keyboardType="number-pad"
            maxLength={3}
            suffix="cm"
            error={errores.heightCm}
          />
        </View>
      </View>

      <FormField
        label="Edad"
        value={datos.age}
        onChangeText={(v) => actualizar({ age: v.replace(/[^0-9]/g, '') })}
        placeholder="28"
        keyboardType="number-pad"
        maxLength={2}
        suffix="años"
        error={errores.age}
      />

      <Text style={styles.etiqueta}>Sexo</Text>
      <Text style={styles.nota}>Solo se usa para calcular su gasto de calorías.</Text>
      {opciones.sexes.map((sexo) => (
        <SelectCard
          key={sexo.id}
          title={sexo.label}
          selected={datos.sex === sexo.id}
          onPress={() => actualizar({ sex: sexo.id })}
          compact
        />
      ))}
      {errores.sex ? <Text style={styles.error}>{errores.sex}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  encabezado: { marginBottom: spacing.lg },
  titulo: { color: colors.text, fontSize: font.h1, fontFamily: family.display },
  descripcion: { color: colors.textMuted, fontSize: font.body, fontFamily: family.body, marginTop: 4, lineHeight: 21 },

  fila: { flexDirection: 'row', gap: spacing.md },
  mitad: { flex: 1 },

  etiqueta: {
    color: colors.textMuted,
    fontSize: font.small,
    fontFamily: family.bodySemi,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  nota: { color: colors.textFaint, fontSize: font.small, fontFamily: family.body, marginBottom: spacing.sm },
  error: { color: colors.danger, fontSize: font.small, fontFamily: family.bodyMedium, marginTop: 4 },
});
