/**
 * Agregar un ejercicio nuevo al día. A diferencia de "Cambiar ejercicio", acá
 * se puede escoger cualquier ejercicio del catálogo (no solo del mismo grupo
 * muscular), porque agregar es sumar trabajo, no reemplazar el objetivo de
 * uno que ya está.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Modal, View, Text, TextInput, ScrollView, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, radius, spacing, font, family } from '../theme';
import Icon from './Icon';
import ExercisePickerRow from './ExercisePickerRow';
import CreateExerciseModal from './CreateExerciseModal';
import { usePlan } from '../store/PlanStore';

const GROUP_LABEL = {
  pecho: 'Pecho', espalda: 'Espalda', pierna: 'Pierna', hombro: 'Hombro',
  brazo: 'Brazo', core: 'Core', cardio: 'Cardio',
};
const GROUP_ORDER = ['pecho', 'espalda', 'pierna', 'hombro', 'brazo', 'core', 'cardio'];

export default function AddExerciseModal({ visible, day, onClose, onAdded }) {
  const { catalogoPara, agregarEjercicio } = usePlan();
  const [catalogo, setCatalogo] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [agregando, setAgregando] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [error, setError] = useState(null);
  const [creando, setCreando] = useState(false);

  useEffect(() => {
    if (!visible || !day) return;
    setError(null);
    setBusqueda('');
    setCargando(true);
    catalogoPara(day)
      .then(setCatalogo)
      .catch((err) => setError(err.message))
      .finally(() => setCargando(false));
  }, [visible, day, catalogoPara]);

  const grupos = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    const filtrados = texto ? catalogo.filter((ex) => ex.name.toLowerCase().includes(texto)) : catalogo;

    const porGrupo = {};
    for (const ex of filtrados) {
      if (!porGrupo[ex.group]) porGrupo[ex.group] = [];
      porGrupo[ex.group].push(ex);
    }
    return GROUP_ORDER.filter((g) => porGrupo[g]?.length).map((g) => ({ group: g, ejercicios: porGrupo[g] }));
  }, [catalogo, busqueda]);

  if (!day) return null;

  const elegir = async (ejercicio) => {
    if (agregando) return;
    setAgregando(ejercicio.id);
    setError(null);
    try {
      await agregarEjercicio(day, ejercicio.id);
      onAdded?.();
    } catch (err) {
      setError(err.message);
      setAgregando(null);
    }
  };

  return (
    <>
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Agregar ejercicio</Text>
          <Text style={styles.sub}>Entra con series y repeticiones base; luego lo puede ajustar.</Text>

          <Pressable
            onPress={() => setCreando(true)}
            accessibilityRole="button"
            accessibilityLabel="Crear un ejercicio propio con video"
            style={({ pressed }) => [styles.crearBtn, pressed && { opacity: 0.8 }]}
          >
            <Icon set="mci" name="video-plus-outline" size={19} color={colors.primary} />
            <Text style={styles.crearBtnText}>Crear ejercicio propio con video</Text>
          </Pressable>

          <View style={styles.buscador}>
            <Icon name="search" size={17} color={colors.textFaint} />
            <TextInput
              style={styles.buscadorInput}
              placeholder="Buscar ejercicio..."
              placeholderTextColor={colors.textFaint}
              value={busqueda}
              onChangeText={setBusqueda}
              autoCapitalize="none"
            />
          </View>

          {cargando ? (
            <ActivityIndicator color={colors.primary} style={styles.spinner} />
          ) : grupos.length === 0 ? (
            <View style={styles.vacio}>
              <Icon set="mci" name="dumbbell" size={30} color={colors.textFaint} />
              <Text style={styles.vacioText}>
                {busqueda
                  ? 'No encontramos ningún ejercicio con ese nombre.'
                  : 'Ya tiene todos los ejercicios disponibles agregados ese día.'}
              </Text>
            </View>
          ) : (
            <ScrollView style={styles.lista} showsVerticalScrollIndicator={false}>
              {grupos.map(({ group, ejercicios }) => (
                <View key={group} style={styles.grupo}>
                  <Text style={[styles.grupoTitulo, { color: colors[group] || colors.primary }]}>
                    {GROUP_LABEL[group] || group}
                  </Text>
                  {ejercicios.map((ex) => (
                    <ExercisePickerRow
                      key={ex.id}
                      exercise={ex}
                      disabled={Boolean(agregando)}
                      loading={agregando === ex.id}
                      onPress={() => elegir(ex)}
                      accessibilityLabel={`Agregar ${ex.name}`}
                    />
                  ))}
                </View>
              ))}
            </ScrollView>
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable onPress={onClose} style={({ pressed }) => [styles.cerrar, pressed && { opacity: 0.7 }]}>
            <Text style={styles.cerrarText}>Cancelar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>

    <CreateExerciseModal
      visible={creando}
      day={day}
      onClose={() => setCreando(false)}
      onCreated={() => {
        setCreando(false);
        onAdded?.();
      }}
    />
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    maxHeight: '85%',
  },
  handle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: colors.border, marginBottom: spacing.md },
  title: { color: colors.text, fontSize: font.h2, fontFamily: family.display, textAlign: 'center', marginBottom: spacing.sm },
  sub: { color: colors.textMuted, fontSize: font.body, fontFamily: family.body, textAlign: 'center', lineHeight: 21, marginBottom: spacing.md },

  crearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    paddingVertical: spacing.sm + 2,
    marginBottom: spacing.md,
    minHeight: 46,
  },
  crearBtnText: { color: colors.primary, fontSize: font.small, fontFamily: family.bodyBold },

  buscador: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    minHeight: 46,
  },
  buscadorInput: { flex: 1, color: colors.text, fontSize: font.body, fontFamily: family.body, paddingVertical: spacing.sm },

  spinner: { marginVertical: spacing.xl },
  vacio: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
  vacioText: { color: colors.textMuted, fontSize: font.body, fontFamily: family.body, textAlign: 'center', paddingHorizontal: spacing.lg },

  lista: { marginBottom: spacing.sm },
  grupo: { marginBottom: spacing.sm },
  grupoTitulo: {
    fontSize: font.small,
    fontFamily: family.bodyBold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
  },

  error: { color: colors.danger, fontSize: font.small, fontFamily: family.bodyMedium, textAlign: 'center', marginBottom: spacing.sm },

  cerrar: { paddingVertical: spacing.sm, alignItems: 'center', minHeight: 44, justifyContent: 'center' },
  cerrarText: { color: colors.textFaint, fontSize: font.body, fontFamily: family.bodySemi },
});
