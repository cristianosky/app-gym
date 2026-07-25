/**
 * Registro paso a paso.
 *
 * Se parte en 7 pasos cortos en vez de un formulario largo: en el celular un
 * formulario de 15 campos hace que la gente lo abandone. Cada paso se valida
 * antes de avanzar, así el error aparece donde se cometió y no al final.
 *
 * Al terminar, el servidor crea la cuenta y genera la primera rutina en la
 * misma petición, por eso el último paso muestra una espera explicada.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { colors, spacing, font, family, radius, alpha } from '../../theme';
import Icon from '../../components/Icon';
import Button from '../../components/Button';
import StepDots from '../../components/StepDots';
import { PasoIdentidad, PasoCuerpo } from './steps/PasosPersonales';
import { PasoNivelLugar, PasoObjetivos, PasoDias } from './steps/PasosEntrenamiento';
import { PasoComida, PasoPin } from './steps/PasosFinales';
import { PIN_LENGTH } from '../../components/PinPad';
import { useAuth } from '../../store/AuthStore';
import * as endpoints from '../../api/endpoints';

const DATOS_INICIALES = {
  name: '',
  username: '',
  weightKg: '',
  heightCm: '',
  age: '',
  sex: '',
  level: '',
  environment: '',
  goals: [],
  goalNote: '',
  trainingDays: [],
  sessionMinutes: 60,
  injuries: '',
  diet: [],
  foodNote: '',
  pin: '',
  pinConfirmacion: '',
};

/** Cada paso declara cómo se pinta y qué valida antes de dejar avanzar. */
const PASOS = [
  {
    id: 'identidad',
    Componente: PasoIdentidad,
    validar: (d) => {
      const errores = {};
      if (d.name.trim().length < 2) errores.name = 'Escriba su nombre.';
      if (d.username.length < 3) errores.username = 'El usuario debe tener al menos 3 caracteres.';
      return errores;
    },
  },
  {
    id: 'cuerpo',
    Componente: PasoCuerpo,
    validar: (d) => {
      const errores = {};
      const peso = Number(d.weightKg);
      const altura = Number(d.heightCm);
      const edad = Number(d.age);

      if (!peso || peso < 30 || peso > 300) errores.weightKg = 'Entre 30 y 300 kg.';
      if (!altura || altura < 120 || altura > 230) errores.heightCm = 'Entre 120 y 230 cm.';
      if (!edad || edad < 14 || edad > 90) errores.age = 'Entre 14 y 90 años.';
      if (!d.sex) errores.sex = 'Escoja una opción.';
      return errores;
    },
  },
  {
    id: 'nivel',
    Componente: PasoNivelLugar,
    validar: (d) => {
      const errores = {};
      if (!d.level) errores.level = 'Escoja su nivel.';
      if (!d.environment) errores.environment = 'Escoja dónde va a entrenar.';
      return errores;
    },
  },
  {
    id: 'objetivos',
    Componente: PasoObjetivos,
    validar: (d) => (d.goals.length === 0 ? { goals: 'Escoja al menos un objetivo.' } : {}),
  },
  {
    id: 'dias',
    Componente: PasoDias,
    validar: (d) =>
      d.trainingDays.length === 0 ? { trainingDays: 'Marque al menos un día.' } : {},
  },
  { id: 'comida', Componente: PasoComida, validar: () => ({}) },
  {
    id: 'pin',
    Componente: PasoPin,
    validar: (d) => {
      if (d.pin.length !== PIN_LENGTH) return { pin: `El PIN debe ser de ${PIN_LENGTH} dígitos.` };
      if (d.pinConfirmacion.length !== PIN_LENGTH) return { pin: 'Repita el PIN para confirmar.' };
      if (d.pin !== d.pinConfirmacion) return { pin: 'Los PIN no coinciden. Inténtelo otra vez.' };
      return {};
    },
  },
];

export default function RegisterScreen({ onVolver }) {
  const { registrar } = useAuth();

  const [opciones, setOpciones] = useState(null);
  const [errorOpciones, setErrorOpciones] = useState(null);
  const [paso, setPaso] = useState(0);
  const [datos, setDatos] = useState(DATOS_INICIALES);
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState(null);

  // Los catálogos vienen del servidor para no duplicar los textos en la app.
  const cargarOpciones = useCallback(async () => {
    setErrorOpciones(null);
    try {
      const respuesta = await endpoints.auth.opciones();
      setOpciones(respuesta.options);
    } catch (err) {
      setErrorOpciones(err.message);
    }
  }, []);

  useEffect(() => {
    cargarOpciones();
  }, [cargarOpciones]);

  const actualizar = useCallback((cambios) => {
    setDatos((previo) => ({ ...previo, ...cambios }));
    setErrores((previo) => {
      const siguiente = { ...previo };
      for (const clave of Object.keys(cambios)) delete siguiente[clave];
      // El error del PIN se limpia al tocar cualquiera de los dos campos.
      if ('pin' in cambios || 'pinConfirmacion' in cambios) delete siguiente.pin;
      return siguiente;
    });
  }, []);

  const enviar = useCallback(async () => {
    setEnviando(true);
    setErrorEnvio(null);
    try {
      await registrar({
        name: datos.name.trim(),
        username: datos.username,
        pin: datos.pin,
        profile: {
          weightKg: Number(datos.weightKg),
          heightCm: Number(datos.heightCm),
          age: Number(datos.age),
          sex: datos.sex,
          level: datos.level,
          environment: datos.environment,
          goals: datos.goals,
          goalNote: datos.goalNote.trim(),
          trainingDays: datos.trainingDays,
          sessionMinutes: datos.sessionMinutes,
          injuries: datos.injuries.trim(),
          diet: datos.diet,
          foodNote: datos.foodNote.trim(),
        },
      });
      // Al quedar autenticado, App.js cambia solo a la app principal.
    } catch (err) {
      setErrorEnvio(err.message);
      // Si el servidor señala un campo concreto, se vuelve a su paso.
      if (err.campos) {
        const claves = Object.keys(err.campos);
        const indice = PASOS.findIndex((p) => Object.keys(p.validar(datos)).length > 0);
        setErrores(err.campos);
        if (claves.includes('username') || claves.includes('name')) setPaso(0);
        else if (indice >= 0) setPaso(indice);
      }
    } finally {
      setEnviando(false);
    }
  }, [registrar, datos]);

  const siguiente = useCallback(() => {
    const problemas = PASOS[paso].validar(datos);
    if (Object.keys(problemas).length > 0) {
      setErrores(problemas);
      return;
    }
    if (paso === PASOS.length - 1) {
      enviar();
      return;
    }
    setPaso((p) => p + 1);
  }, [paso, datos, enviar]);

  const atras = useCallback(() => {
    setErrorEnvio(null);
    if (paso === 0) {
      onVolver();
      return;
    }
    setPaso((p) => p - 1);
  }, [paso, onVolver]);

  const esUltimo = paso === PASOS.length - 1;
  const { Componente } = PASOS[paso];

  const contexto = useMemo(
    () => ({ datos, actualizar, errores, opciones }),
    [datos, actualizar, errores, opciones],
  );

  if (enviando) {
    return <PantallaGenerando nombre={datos.name} />;
  }

  if (!opciones) {
    return <PantallaCargando error={errorOpciones} onReintentar={cargarOpciones} onVolver={onVolver} />;
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.topBar}>
        <Button label="Atrás" icon="chevron-back" variant="ghost" onPress={atras} style={styles.back} />
      </View>

      <View style={styles.stepsWrap}>
        <StepDots total={PASOS.length} current={paso} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Componente {...contexto} />

        {errorEnvio ? (
          <View style={styles.errorBox}>
            <Icon name="alert-circle" size={18} color={colors.danger} />
            <Text style={styles.errorText}>{errorEnvio}</Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label={esUltimo ? 'Crear mi cuenta' : 'Continuar'}
          icon={esUltimo ? 'checkmark-circle' : 'arrow-forward'}
          onPress={siguiente}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

/** Espera breve mientras se crea la cuenta en el servidor. */
function PantallaGenerando({ nombre }) {
  return (
    <View style={styles.esperaScreen}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.esperaTitulo}>Creando su cuenta</Text>
      <Text style={styles.esperaTexto}>
        {nombre ? `Un momento, ${nombre.split(' ')[0]}.` : 'Un momento.'}
      </Text>
    </View>
  );
}

/** Estado inicial mientras llegan los catálogos del servidor. */
function PantallaCargando({ error, onReintentar, onVolver }) {
  if (!error) {
    return (
      <View style={styles.esperaScreen}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.esperaTexto}>Conectando con el servidor…</Text>
      </View>
    );
  }

  return (
    <View style={styles.esperaScreen}>
      <View style={styles.errorIcono}>
        <Icon name="cloud-offline-outline" size={40} color={colors.danger} />
      </View>
      <Text style={styles.esperaTitulo}>No pudimos conectarnos</Text>
      <Text style={styles.esperaTexto}>{error}</Text>
      <View style={styles.esperaAcciones}>
        <Button label="Reintentar" icon="refresh" onPress={onReintentar} />
        <Button label="Volver" variant="secondary" onPress={onVolver} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  topBar: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  back: { alignSelf: 'flex-start', paddingHorizontal: 0 },
  stepsWrap: { paddingHorizontal: spacing.lg },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, flexGrow: 1 },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bgElevated,
  },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: alpha(colors.danger, 0.12),
    borderRadius: radius.sm,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  errorText: { color: colors.danger, fontSize: font.small, fontFamily: family.bodyMedium, flex: 1, lineHeight: 19 },

  esperaScreen: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  esperaTitulo: {
    color: colors.text,
    fontSize: font.h2,
    fontFamily: family.display,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  esperaTexto: {
    color: colors.textMuted,
    fontSize: font.body,
    fontFamily: family.body,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 21,
  },
  esperaLista: { marginTop: spacing.xl, gap: spacing.md, alignSelf: 'stretch', paddingHorizontal: spacing.md },
  esperaItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  esperaItemText: { color: colors.textMuted, fontSize: font.body, fontFamily: family.body, flex: 1 },
  esperaAcciones: { marginTop: spacing.xl, gap: spacing.md, alignSelf: 'stretch' },
  errorIcono: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: alpha(colors.danger, 0.12),
    alignItems: 'center',
    justifyContent: 'center',
  },
});
