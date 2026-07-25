/**
 * Pasos 6 y 7 del registro: alimentación y creación del PIN.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, font, family, radius, alpha } from '../../../theme';
import SelectCard from '../../../components/SelectCard';
import FormField from '../../../components/FormField';
import PinPad, { PIN_LENGTH } from '../../../components/PinPad';
import Icon from '../../../components/Icon';
import { TituloPaso } from './PasosPersonales';

/** Paso 6: restricciones y gustos de comida. */
export function PasoComida({ datos, actualizar, opciones }) {
  const alternar = (id) => {
    const actuales = datos.diet;
    actualizar({
      diet: actuales.includes(id) ? actuales.filter((d) => d !== id) : [...actuales, id],
    });
  };

  return (
    <View>
      <TituloPaso
        titulo="Su alimentación"
        descripcion="Para armarle el plan de comidas. Si no aplica ninguna, siga derecho."
      />

      {opciones.diets.map((dieta) => (
        <SelectCard
          key={dieta.id}
          title={dieta.label}
          description={dieta.description}
          selected={datos.diet.includes(dieta.id)}
          onPress={() => alternar(dieta.id)}
          accent={colors.success}
          compact
        />
      ))}

      <View style={{ marginTop: spacing.lg }}>
        <FormField
          label="¿Algo que no le guste o no pueda comer? (opcional)"
          value={datos.foodNote}
          onChangeText={(v) => actualizar({ foodNote: v })}
          placeholder="Ej.: no me gusta el pescado, soy alérgico al maní"
          maxLength={300}
          multiline
        />
      </View>
    </View>
  );
}

/** Paso 7: crear y confirmar el PIN. */
export function PasoPin({ datos, actualizar, errores }) {
  const confirmando = datos.pin.length === PIN_LENGTH;
  const valor = confirmando ? datos.pinConfirmacion : datos.pin;
  const campo = confirmando ? 'pinConfirmacion' : 'pin';

  return (
    <View style={styles.centro}>
      <TituloPaso
        titulo={confirmando ? 'Repita su PIN' : 'Cree su PIN'}
        descripcion={
          confirmando
            ? 'Escríbalo otra vez para confirmar que no se le olvide.'
            : `${PIN_LENGTH} dígitos. Es con lo que va a entrar a la app, así que no use 1234 ni su año de nacimiento.`
        }
      />

      {errores.pin ? (
        <View style={styles.errorBox}>
          <Icon name="alert-circle" size={16} color={colors.danger} />
          <Text style={styles.errorText}>{errores.pin}</Text>
        </View>
      ) : null}

      {confirmando && !errores.pin ? (
        <View style={styles.avisoBox}>
          <Icon name="lock-closed" size={16} color={colors.success} />
          <Text style={styles.avisoText}>PIN creado. Confírmelo para terminar.</Text>
        </View>
      ) : null}

      <PinPad
        value={valor}
        onChange={(v) => actualizar({ [campo]: v })}
        error={Boolean(errores.pin)}
      />

      {confirmando ? (
        <Text
          style={styles.rehacer}
          onPress={() => actualizar({ pin: '', pinConfirmacion: '' })}
          accessibilityRole="button"
        >
          Cambiar el PIN
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  centro: { alignItems: 'center' },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: alpha(colors.danger, 0.12),
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
    alignSelf: 'stretch',
  },
  errorText: { color: colors.danger, fontSize: font.small, fontFamily: family.bodyMedium, flex: 1 },
  avisoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: alpha(colors.success, 0.12),
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
    alignSelf: 'stretch',
  },
  avisoText: { color: colors.success, fontSize: font.small, fontFamily: family.bodyMedium, flex: 1 },
  rehacer: {
    color: colors.textMuted,
    fontSize: font.body,
    fontFamily: family.bodySemi,
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
    textDecorationLine: 'underline',
  },
});
