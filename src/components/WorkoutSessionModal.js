/**
 * Modo entrenamiento: acompaña el entreno serie por serie.
 *
 * La idea es poder dejar el celular en la banca y solo tocar un botón grande
 * cuando se termina la serie:
 *   1. muestra el ejercicio actual con su demostración y la serie que va,
 *   2. al marcar "Terminé la serie" arranca el descanso con cuenta regresiva,
 *   3. cuando el descanso llega a cero pasa solo a la siguiente serie,
 *   4. al acabar la última serie marca el ejercicio como hecho y sigue con el
 *      siguiente, sin que la persona tenga que buscar nada en la lista.
 *
 * Arriba siempre se ve el tiempo que lleva y cuánto falta para terminar el día.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal, View, Text, Image, Pressable, StyleSheet, ScrollView,
  SafeAreaView, StatusBar, Platform, Vibration,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, radius, spacing, font, family, alpha, shadow } from '../theme';
import ExerciseIllustration from '../illustrations/ExerciseIllustration';
import LocalVideo from './LocalVideo';
import Icon from './Icon';
import { getLocalVideo } from '../data/localVideos';
import { getLocalGif } from '../data/localGifs';
import {
  duracionDeReps, segundosDeDescanso, segundosRestantes, reloj, tiempoAproximado,
} from '../utils/entrenamiento';

/** Cada cuánto se refresca la pantalla mientras corre el cronómetro. */
const TICK_MS = 500;

/** Lo que suma el botón "+15 s" del descanso. */
const DESCANSO_EXTRA = 15;

const vibrar = (patron) => {
  if (Platform.OS !== 'web') Vibration.vibrate(patron);
};

export default function WorkoutSessionModal({
  visible,
  exercises = [],
  completed = {},
  planTitle,
  accent = colors.primary,
  onExerciseDone,
  onFinish,
  onClose,
}) {
  // La sesión se arma al abrir y no se recalcula después: si al terminar una
  // serie la lista se reordenara sola, la persona perdería el hilo.
  const [lista, setLista] = useState([]);
  const [indice, setIndice] = useState(0);
  const [serie, setSerie] = useState(1);
  const [fase, setFase] = useState('trabajo'); // 'trabajo' | 'descanso' | 'fin'
  const [finFase, setFinFase] = useState(null); // instante en que termina la fase cronometrada
  const [inicioFase, setInicioFase] = useState(0);
  const [cambioDeEjercicio, setCambioDeEjercicio] = useState(false);
  const [ahora, setAhora] = useState(Date.now());

  const inicioSesion = useRef(Date.now());

  const actual = lista[indice] ?? null;
  const seriesTotales = Math.max(1, actual?.sets ?? 1);

  // --- Arranque y cronómetro ---------------------------------------------

  useEffect(() => {
    if (!visible) return;
    const pendientes = exercises.filter((ex) => !completed[ex.id]);
    const cola = pendientes.length > 0 ? pendientes : [];

    inicioSesion.current = Date.now();
    setLista(cola);
    setIndice(0);
    setSerie(1);
    setCambioDeEjercicio(false);
    setAhora(Date.now());

    if (cola.length === 0) {
      setFase('fin');
      setFinFase(null);
      return;
    }
    setFase('trabajo');
    setInicioFase(Date.now());
    const porTiempo = duracionDeReps(cola[0].reps);
    setFinFase(porTiempo ? Date.now() + porTiempo * 1000 : null);
    // `exercises`/`completed` se leen solo al abrir, a propósito.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  useEffect(() => {
    if (!visible || fase === 'fin') return;
    const id = setInterval(() => setAhora(Date.now()), TICK_MS);
    return () => clearInterval(id);
  }, [visible, fase]);

  // --- Transiciones -------------------------------------------------------

  const empezarTrabajo = useCallback((i) => {
    const siguiente = lista[i];
    const porTiempo = duracionDeReps(siguiente?.reps);
    setFase('trabajo');
    setInicioFase(Date.now());
    setFinFase(porTiempo ? Date.now() + porTiempo * 1000 : null);
  }, [lista]);

  const empezarDescanso = useCallback((segundos, iSiguiente) => {
    if (segundos <= 0) {
      empezarTrabajo(iSiguiente);
      return;
    }
    setFase('descanso');
    setInicioFase(Date.now());
    setFinFase(Date.now() + segundos * 1000);
  }, [empezarTrabajo]);

  /** Cierra la serie que se acaba de hacer y decide qué sigue. */
  const terminarSerie = useCallback(() => {
    if (!actual) return;
    vibrar(40);
    const descanso = segundosDeDescanso(actual);

    if (serie < seriesTotales) {
      setSerie(serie + 1);
      setCambioDeEjercicio(false);
      empezarDescanso(descanso, indice);
      return;
    }

    // Última serie: el ejercicio queda hecho.
    onExerciseDone?.(actual.id);
    const siguiente = indice + 1;
    if (siguiente >= lista.length) {
      setFase('fin');
      setFinFase(null);
      vibrar([0, 120, 90, 220]);
      return;
    }
    setIndice(siguiente);
    setSerie(1);
    setCambioDeEjercicio(true);
    empezarDescanso(descanso, siguiente);
  }, [actual, serie, seriesTotales, indice, lista.length, onExerciseDone, empezarDescanso]);

  // Fin del descanso → arranca sola la siguiente serie.
  useEffect(() => {
    if (fase !== 'descanso' || !finFase || ahora < finFase) return;
    vibrar([0, 90, 70, 90]);
    empezarTrabajo(indice);
  }, [fase, finFase, ahora, indice, empezarTrabajo]);

  // Series por tiempo (planchas, cardio): se cierran solas al llegar a cero.
  useEffect(() => {
    if (fase !== 'trabajo' || !finFase || ahora < finFase) return;
    terminarSerie();
  }, [fase, finFase, ahora, terminarSerie]);

  const sumarDescanso = () => setFinFase((fin) => (fin ?? Date.now()) + DESCANSO_EXTRA * 1000);
  const saltarDescanso = () => empezarTrabajo(indice);

  // --- Números que se muestran -------------------------------------------

  const transcurrido = Math.floor((ahora - inicioSesion.current) / 1000);
  const restanteFase = finFase ? Math.max(0, (finFase - ahora) / 1000) : 0;
  const totalFase = finFase ? Math.max(1, (finFase - inicioFase) / 1000) : 1;
  const enFase = Math.floor((ahora - inicioFase) / 1000);

  const faltante = useMemo(() => {
    if (fase === 'fin') return 0;
    // `serie` ya apunta a la que falta hacer, así que las hechas son una menos.
    return segundosRestantes(lista.slice(indice), serie - 1) + Math.round(restanteFase);
  }, [fase, lista, indice, serie, restanteFase]);

  const hechosEnSesion = fase === 'fin' ? lista.length : indice;
  const avance = lista.length > 0 ? hechosEnSesion / lista.length : 1;
  const siguienteEjercicio = lista[indice + 1] ?? null;

  const terminar = () => {
    onFinish?.();
    onClose?.();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <SafeAreaView style={styles.screen}>
        <View style={styles.header}>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Salir del modo entrenamiento"
            style={({ pressed }) => [styles.salir, pressed && { opacity: 0.7 }]}
          >
            <Icon name="chevron-down" size={24} color={colors.textMuted} />
          </Pressable>

          <View style={styles.headerCentro}>
            <Text style={styles.headerLabel}>EN ENTRENAMIENTO</Text>
            <Text style={styles.headerTitulo} numberOfLines={1}>{planTitle}</Text>
          </View>

          <View style={styles.tiempoTotal}>
            <Icon name="time-outline" size={14} color={colors.textMuted} />
            <Text style={styles.tiempoTotalText}>{reloj(transcurrido)}</Text>
          </View>
        </View>

        {fase === 'fin' ? (
          <Final transcurrido={transcurrido} hechos={lista.length} accent={accent} onTerminar={terminar} />
        ) : (
          <ScrollView contentContainerStyle={styles.contenido} showsVerticalScrollIndicator={false}>
            {/* Avance del día */}
            <View style={styles.avanceFila}>
              <Text style={styles.avanceText}>
                Ejercicio {Math.min(indice + 1, lista.length)} de {lista.length}
              </Text>
              <Text style={[styles.avanceFalta, { color: accent }]}>
                Falta {tiempoAproximado(faltante)}
              </Text>
            </View>
            <View style={styles.avanceBarra}>
              <View style={[styles.avanceRelleno, { width: `${Math.round(avance * 100)}%`, backgroundColor: accent }]} />
            </View>

            {fase === 'descanso' ? (
              <Descanso
                restante={restanteFase}
                progreso={1 - restanteFase / totalFase}
                cambioDeEjercicio={cambioDeEjercicio}
                proximo={actual}
                serie={serie}
                seriesTotales={seriesTotales}
                onSumar={sumarDescanso}
                onSaltar={saltarDescanso}
              />
            ) : (
              <Trabajo
                ejercicio={actual}
                serie={serie}
                seriesTotales={seriesTotales}
                enFase={enFase}
                restante={finFase ? restanteFase : null}
                progreso={finFase ? 1 - restanteFase / totalFase : 0}
                accent={accent}
                onTerminarSerie={terminarSerie}
                siguiente={siguienteEjercicio}
              />
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}

/** Fase de trabajo: el ejercicio que toca hacer ahora mismo. */
function Trabajo({
  ejercicio, serie, seriesTotales, enFase, restante, progreso, accent, onTerminarSerie, siguiente,
}) {
  if (!ejercicio) return null;
  const color = colors[ejercicio.group] || accent;
  const porTiempo = restante !== null;

  return (
    <>
      <Demostracion ejercicio={ejercicio} accent={color} />

      <Text style={styles.ejercicioNombre}>{ejercicio.name}</Text>

      <View style={styles.seriesFila}>
        {Array.from({ length: seriesTotales }, (_, i) => (
          <View
            key={i}
            style={[
              styles.seriePunto,
              i < serie - 1 && { backgroundColor: colors.success, borderColor: colors.success },
              i === serie - 1 && { borderColor: color, backgroundColor: alpha(color, 0.22) },
            ]}
          >
            <Text style={[styles.seriePuntoText, i === serie - 1 && { color }]}>{i + 1}</Text>
          </View>
        ))}
      </View>

      <Anillo progreso={porTiempo ? progreso : 0} color={color}>
        <Text style={styles.anilloLabel}>SERIE {serie} DE {seriesTotales}</Text>
        <Text style={[styles.anilloValor, { color: porTiempo ? color : colors.text }]}>
          {porTiempo ? reloj(restante) : ejercicio.reps}
        </Text>
        <Text style={styles.anilloPie}>
          {porTiempo ? 'aguante hasta cero' : `repeticiones · ${reloj(enFase)}`}
        </Text>
      </Anillo>

      <Pressable
        onPress={onTerminarSerie}
        accessibilityRole="button"
        accessibilityLabel={`Terminé la serie ${serie} de ${seriesTotales}`}
        style={({ pressed }) => [styles.botonGrande, { backgroundColor: color }, pressed && styles.presionado]}
      >
        <Icon name="checkmark-circle" size={24} color={colors.onPrimary} />
        <Text style={styles.botonGrandeText}>
          {serie < seriesTotales ? 'Terminé la serie' : 'Terminé el ejercicio'}
        </Text>
      </Pressable>

      {siguiente && (
        <Text style={styles.siguienteText} numberOfLines={1}>
          Después sigue: <Text style={styles.siguienteFuerte}>{siguiente.name}</Text>
        </Text>
      )}
    </>
  );
}

/** Fase de descanso: cuenta regresiva hasta la siguiente serie o ejercicio. */
function Descanso({
  restante, progreso, cambioDeEjercicio, proximo, serie, seriesTotales, onSumar, onSaltar,
}) {
  return (
    <>
      <View style={styles.descansoCabecera}>
        <Icon set="mci" name="timer-sand" size={20} color={colors.rest} />
        <Text style={styles.descansoTitulo}>Descanso</Text>
      </View>

      <Anillo progreso={progreso} color={colors.rest}>
        <Text style={styles.anilloLabel}>FALTA</Text>
        <Text style={[styles.anilloValor, { color: colors.rest }]}>{reloj(restante)}</Text>
        <Text style={styles.anilloPie}>y sigue solo</Text>
      </Anillo>

      <View style={[styles.proximoCard, { borderColor: alpha(colors.rest, 0.35) }]}>
        <Text style={styles.proximoLabel}>
          {cambioDeEjercicio ? 'SIGUIENTE EJERCICIO' : 'SIGUIENTE SERIE'}
        </Text>
        <Text style={styles.proximoNombre} numberOfLines={2}>{proximo?.name}</Text>
        <Text style={styles.proximoMeta}>
          Serie {serie} de {seriesTotales} · {proximo?.reps}
        </Text>
      </View>

      <View style={styles.descansoBotones}>
        <Pressable
          onPress={onSumar}
          accessibilityRole="button"
          accessibilityLabel="Sumar 15 segundos de descanso"
          style={({ pressed }) => [styles.botonSecundario, pressed && styles.presionado]}
        >
          <Icon name="add" size={18} color={colors.text} />
          <Text style={styles.botonSecundarioText}>15 s más</Text>
        </Pressable>

        <Pressable
          onPress={onSaltar}
          accessibilityRole="button"
          accessibilityLabel="Saltar el descanso y empezar ya"
          style={({ pressed }) => [styles.botonSecundario, styles.botonSaltar, pressed && styles.presionado]}
        >
          <Icon name="play" size={18} color={colors.rest} />
          <Text style={[styles.botonSecundarioText, { color: colors.rest }]}>Empezar ya</Text>
        </Pressable>
      </View>
    </>
  );
}

/** Pantalla final de la sesión. */
function Final({ transcurrido, hechos, accent, onTerminar }) {
  return (
    <View style={styles.final}>
      <View style={[styles.finalIcono, { backgroundColor: alpha(colors.success, 0.16) }]}>
        <Icon set="mci" name="trophy" size={48} color={colors.success} />
      </View>
      <Text style={styles.finalTitulo}>¡Entrenamiento terminado!</Text>
      <Text style={styles.finalTexto}>
        {hechos > 0
          ? `Hizo ${hechos} ${hechos === 1 ? 'ejercicio' : 'ejercicios'} en ${reloj(transcurrido)}. Buen trabajo.`
          : 'Ya tenía todo marcado. Buen trabajo.'}
      </Text>
      <Pressable
        onPress={onTerminar}
        accessibilityRole="button"
        style={({ pressed }) => [styles.botonGrande, { backgroundColor: accent, alignSelf: 'stretch' }, pressed && styles.presionado]}
      >
        <Icon name="checkmark-circle" size={24} color={colors.onPrimary} />
        <Text style={styles.botonGrandeText}>Guardar y cerrar</Text>
      </Pressable>
    </View>
  );
}

/** Demostración del movimiento: video local, GIF o animación. */
function Demostracion({ ejercicio, accent }) {
  const video = getLocalVideo(ejercicio.localVideo);
  const gif = getLocalGif(ejercicio.id);

  return (
    <View style={styles.demo}>
      {video ? (
        <LocalVideo source={video} controls={false} contentFit="cover" />
      ) : gif?.tipo === 'video' ? (
        <LocalVideo source={gif.fuente} controls={false} contentFit="cover" />
      ) : gif ? (
        <Image source={gif.fuente} style={styles.demoGif} resizeMode="cover" />
      ) : (
        <ExerciseIllustration kind={ejercicio.illu} accent={accent} size={120} />
      )}
    </View>
  );
}

/** Anillo de progreso con el número grande en el centro. */
function Anillo({ progreso, color, size = 216, grosor = 12, children }) {
  const radio = (size - grosor) / 2;
  const vuelta = 2 * Math.PI * radio;
  const avance = Math.max(0, Math.min(1, progreso || 0));

  return (
    <View style={[styles.anillo, { width: size, height: size }]}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={radio} stroke={colors.surfaceAlt} strokeWidth={grosor} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radio}
          stroke={color}
          strokeWidth={grosor}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${vuelta} ${vuelta}`}
          strokeDashoffset={vuelta * (1 - avance)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.anilloCentro}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  salir: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginLeft: -spacing.sm },
  headerCentro: { flex: 1, alignItems: 'center', paddingHorizontal: spacing.sm },
  headerLabel: { color: colors.textFaint, fontSize: font.tiny, fontFamily: family.bodyBold, letterSpacing: 1 },
  headerTitulo: { color: colors.text, fontSize: font.h3, fontFamily: family.display },
  tiempoTotal: { flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: 62, justifyContent: 'flex-end' },
  tiempoTotalText: { color: colors.textMuted, fontSize: font.small, fontFamily: family.bodyBold },

  contenido: { padding: spacing.lg, paddingBottom: spacing.xxl, alignItems: 'center' },

  avanceFila: { flexDirection: 'row', justifyContent: 'space-between', alignSelf: 'stretch', marginBottom: 6 },
  avanceText: { color: colors.textMuted, fontSize: font.small, fontFamily: family.bodySemi },
  avanceFalta: { fontSize: font.small, fontFamily: family.bodyBold },
  avanceBarra: {
    alignSelf: 'stretch', height: 6, borderRadius: 3,
    backgroundColor: colors.surfaceAlt, overflow: 'hidden', marginBottom: spacing.lg,
  },
  avanceRelleno: { height: '100%', borderRadius: 3 },

  demo: {
    width: '100%', height: 150, borderRadius: radius.md, overflow: 'hidden',
    backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
  },
  demoGif: { width: '100%', height: '100%' },

  ejercicioNombre: {
    color: colors.text, fontSize: font.h2, fontFamily: family.display,
    textAlign: 'center', marginBottom: spacing.sm,
  },

  seriesFila: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg, flexWrap: 'wrap', justifyContent: 'center' },
  seriePunto: {
    width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  seriePuntoText: { color: colors.textFaint, fontSize: font.small, fontFamily: family.bodyBold },

  anillo: { alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  anilloCentro: { alignItems: 'center', paddingHorizontal: spacing.lg },
  anilloLabel: { color: colors.textFaint, fontSize: font.tiny, fontFamily: family.bodyBold, letterSpacing: 1 },
  anilloValor: { fontSize: font.display, fontFamily: family.displayBlack, marginVertical: 2, textAlign: 'center' },
  anilloPie: { color: colors.textMuted, fontSize: font.small, fontFamily: family.body, textAlign: 'center' },

  botonGrande: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    alignSelf: 'stretch', borderRadius: radius.md, paddingVertical: spacing.lg, minHeight: 62,
    ...shadow.card,
  },
  botonGrandeText: { color: colors.onPrimary, fontSize: font.h2, fontFamily: family.display },
  presionado: { opacity: 0.85, transform: [{ scale: 0.99 }] },

  siguienteText: { color: colors.textMuted, fontSize: font.small, fontFamily: family.body, marginTop: spacing.md },
  siguienteFuerte: { color: colors.text, fontFamily: family.bodySemi },

  descansoCabecera: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg, marginTop: spacing.sm },
  descansoTitulo: { color: colors.rest, fontSize: font.h2, fontFamily: family.display },

  proximoCard: {
    alignSelf: 'stretch', backgroundColor: colors.surface, borderRadius: radius.md,
    borderWidth: 1, padding: spacing.lg, marginBottom: spacing.lg,
  },
  proximoLabel: { color: colors.textFaint, fontSize: font.tiny, fontFamily: family.bodyBold, letterSpacing: 1, marginBottom: 4 },
  proximoNombre: { color: colors.text, fontSize: font.h3, fontFamily: family.bodySemi },
  proximoMeta: { color: colors.textMuted, fontSize: font.small, fontFamily: family.body, marginTop: 3 },

  descansoBotones: { flexDirection: 'row', alignSelf: 'stretch', gap: spacing.md },
  botonSecundario: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs,
    backgroundColor: colors.surfaceAlt, borderRadius: radius.md, paddingVertical: spacing.md, minHeight: 52,
  },
  botonSaltar: { backgroundColor: alpha(colors.rest, 0.14), borderWidth: 1, borderColor: alpha(colors.rest, 0.4) },
  botonSecundarioText: { color: colors.text, fontSize: font.h3, fontFamily: family.bodySemi },

  final: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  finalIcono: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  finalTitulo: { color: colors.text, fontSize: font.h1, fontFamily: family.display, marginBottom: spacing.sm, textAlign: 'center' },
  finalTexto: {
    color: colors.textMuted, fontSize: font.body, fontFamily: family.body,
    textAlign: 'center', lineHeight: 22, marginBottom: spacing.xl,
  },
});
