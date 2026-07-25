/**
 * Editar perfil: peso, estatura, nivel, dónde entrena, objetivos, días y
 * alimentación.
 *
 * Reutiliza los mismos componentes de paso del registro (`auth/steps/*`) en
 * una sola pantalla con scroll, en vez de repetirlos: son el mismo formulario,
 * solo que aquí ya viene lleno y sin la parte de identidad ni de PIN.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, View, Text, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { colors, spacing, font, family, radius, alpha } from '../theme';
import Icon from '../components/Icon';
import Button from '../components/Button';
import { PasoCuerpo } from './auth/steps/PasosPersonales';
import { PasoNivelLugar, PasoObjetivos, PasoDias } from './auth/steps/PasosEntrenamiento';
import { PasoComida } from './auth/steps/PasosFinales';
import { useAuth } from '../store/AuthStore';
import { usePlan } from '../store/PlanStore';
import * as endpoints from '../api/endpoints';

/** Perfil del servidor (números) → formulario (texto), como espera cada paso. */
function perfilAFormulario(profile) {
  return {
    weightKg: String(profile.weightKg ?? ''),
    heightCm: String(profile.heightCm ?? ''),
    age: String(profile.age ?? ''),
    sex: profile.sex ?? '',
    level: profile.level ?? '',
    environment: profile.environment ?? '',
    goals: profile.goals ?? [],
    goalNote: profile.goalNote ?? '',
    trainingDays: profile.trainingDays ?? [],
    sessionMinutes: profile.sessionMinutes ?? 60,
    injuries: profile.injuries ?? '',
    diet: profile.diet ?? [],
    foodNote: profile.foodNote ?? '',
  };
}

function validar(datos) {
  const errores = {};
  const peso = Number(datos.weightKg);
  const altura = Number(datos.heightCm);
  const edad = Number(datos.age);

  if (!peso || peso < 30 || peso > 300) errores.weightKg = 'Entre 30 y 300 kg.';
  if (!altura || altura < 120 || altura > 230) errores.heightCm = 'Entre 120 y 230 cm.';
  if (!edad || edad < 14 || edad > 90) errores.age = 'Entre 14 y 90 años.';
  if (!datos.sex) errores.sex = 'Escoja una opción.';
  if (!datos.level) errores.level = 'Escoja su nivel.';
  if (!datos.environment) errores.environment = 'Escoja dónde va a entrenar.';
  if (datos.goals.length === 0) errores.goals = 'Escoja al menos un objetivo.';
  if (datos.trainingDays.length === 0) errores.trainingDays = 'Marque al menos un día.';

  return errores;
}

export default function EditProfileModal({ visible, onClose }) {
  const { user, actualizarPerfil } = useAuth();
  const { regenerarRutina } = usePlan();

  const [opciones, setOpciones] = useState(null);
  const [datos, setDatos] = useState(null);
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  // Cada vez que se abre, se parte de los datos guardados en el servidor.
  useEffect(() => {
    if (!visible || !user?.profile) return;
    setDatos(perfilAFormulario(user.profile));
    setErrores({});
    setError(null);
  }, [visible, user]);

  useEffect(() => {
    if (!visible || opciones) return;
    endpoints.auth.opciones().then((r) => setOpciones(r.options)).catch((err) => setError(err.message));
  }, [visible, opciones]);

  const actualizar = useCallback((cambios) => {
    setDatos((previo) => ({ ...previo, ...cambios }));
    setErrores((previo) => {
      const siguiente = { ...previo };
      for (const clave of Object.keys(cambios)) delete siguiente[clave];
      return siguiente;
    });
  }, []);

  const contexto = useMemo(
    () => (datos ? { datos, actualizar, errores, opciones } : null),
    [datos, actualizar, errores, opciones],
  );

  const guardar = useCallback(async () => {
    const problemas = validar(datos);
    if (Object.keys(problemas).length > 0) {
      setErrores(problemas);
      setError('Revise los campos marcados en rojo.');
      return;
    }

    setGuardando(true);
    setError(null);
    try {
      await actualizarPerfil({
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
      });

      onClose();
      Alert.alert(
        'Perfil actualizado',
        'Quedó guardado. ¿Quiere que le arme la rutina de nuevo con estos datos?',
        [
          { text: 'Más tarde', style: 'cancel' },
          { text: 'Armar de nuevo', onPress: () => regenerarRutina().catch(() => {}) },
        ],
      );
    } catch (err) {
      setError(err.message);
      if (err.campos) setErrores((previo) => ({ ...previo, ...err.campos }));
    } finally {
      setGuardando(false);
    }
  }, [datos, actualizarPerfil, onClose, regenerarRutina]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Text style={styles.headerTitulo}>Editar perfil</Text>
          <Button label="Cerrar" variant="ghost" onPress={onClose} style={styles.headerBtn} />
        </View>

        {!contexto ? (
          <View style={styles.centro}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <PasoCuerpo {...contexto} />
            <Separador />
            <PasoNivelLugar {...contexto} />
            <Separador />
            <PasoObjetivos {...contexto} />
            <Separador />
            <PasoDias {...contexto} />
            <Separador />
            <PasoComida {...contexto} />

            {error ? (
              <View style={styles.errorBox}>
                <Icon name="alert-circle" size={18} color={colors.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
          </ScrollView>
        )}

        {contexto ? (
          <View style={styles.footer}>
            <Button label="Guardar cambios" icon="checkmark-circle" onPress={guardar} loading={guardando} />
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Separador() {
  return <View style={styles.separador} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.bgElevated,
  },
  headerTitulo: { color: colors.text, fontSize: font.h2, fontFamily: family.display },
  headerBtn: { paddingHorizontal: 0, minHeight: 40 },

  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  separador: { height: 1, backgroundColor: colors.border, marginVertical: spacing.xl },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: alpha(colors.danger, 0.12),
    borderRadius: radius.sm,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  errorText: { color: colors.danger, fontSize: font.small, fontFamily: family.bodyMedium, flex: 1, lineHeight: 18 },

  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bgElevated,
  },
});
