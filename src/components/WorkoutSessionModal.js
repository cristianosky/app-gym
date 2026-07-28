/**
 * Modo entrenamiento: acompaña el entreno serie por serie.
 *
 * La idea es poder dejar el celular en la banca y solo tocar un botón grande
 * cuando se termina la serie:
 *   1. muestra el ejercicio actual con su demostración y la serie que va,
 *   2. al marcar "Terminé la serie" arranca el descanso con cuenta regresiva,
 *   3. cuando el descanso llega a cero pasa solo a la siguiente serie,
 *   4. al acabar la última serie avisa "ejercicio terminado" y espera a que la
 *      persona toque "Siguiente" para continuar con el que sigue.
 *
 * Arriba siempre se ve el tiempo que lleva y cuánto falta para terminar el día.
 * El estado vive en `store/SessionStore`: esta pantalla solo lo muestra, así se
 * puede minimizar y volver sin perder nada.
 */
import React from 'react';
import {
  Modal, View, Text, Image, Pressable, StyleSheet, ScrollView,
  SafeAreaView, StatusBar, Platform,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, radius, spacing, font, family, alpha, shadow } from '../theme';
import ExerciseIllustration from '../illustrations/ExerciseIllustration';
import LocalVideo from './LocalVideo';
import Icon from './Icon';
import { getLocalVideo } from '../data/localVideos';
import { getLocalGif } from '../data/localGifs';
import { usePlan } from '../store/PlanStore';
import { useSesion, DESCANSO_EXTRA } from '../store/SessionStore';
import { segundosRestantes, reloj, tiempoAproximado } from '../utils/entrenamiento';
import useTick from '../utils/useTick';

export default function WorkoutSessionModal() {
  const { getDay } = usePlan();
  const {
    sesion, abierta, ejercicios, actual, proximo,
    terminarSerie, siguienteEjercicio, sumarDescanso, saltarDescanso,
    minimizar, terminar, salir,
  } = useSesion();

  const ahora = useTick(Boolean(sesion) && abierta);

  if (!sesion) return null;

  const plan = getDay(sesion.key).plan;
  const accent = colors[plan?.accent] || colors.primary;

  const { fase, indice, serie, finFase, inicioFase, inicio } = sesion;
  const seriesTotales = Math.max(1, actual?.sets ?? 1);

  const transcurrido = Math.floor((ahora - inicio) / 1000);
  const restanteFase = finFase ? Math.max(0, (finFase - ahora) / 1000) : 0;
  const totalFase = finFase ? Math.max(1, (finFase - inicioFase) / 1000) : 1;
  const progresoFase = finFase ? 1 - restanteFase / totalFase : 0;
  const enFase = Math.floor((ahora - inicioFase) / 1000);

  // `serie` ya apunta a la que falta hacer, así que las hechas son una menos.
  const faltante = segundosRestantes(ejercicios.slice(indice), serie - 1) + Math.round(restanteFase);
  const hechos = fase === 'fin' ? ejercicios.length : indice;
  const avance = ejercicios.length > 0 ? hechos / ejercicios.length : 1;

  return (
    <Modal visible={abierta} animationType="slide" onRequestClose={minimizar} statusBarTranslucent>
      <SafeAreaView style={styles.screen}>
        <View style={styles.header}>
          <Pressable
            onPress={minimizar}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Minimizar el entrenamiento y seguir viéndolo abajo"
            style={({ pressed }) => [styles.iconoHeader, pressed && { opacity: 0.7 }]}
          >
            <Icon name="chevron-down" size={26} color={colors.textMuted} />
          </Pressable>

          <View style={styles.headerCentro}>
            <Text style={styles.headerLabel}>EN ENTRENAMIENTO</Text>
            <Text style={styles.headerTitulo} numberOfLines={1}>{plan?.title}</Text>
          </View>

          <View style={styles.tiempoTotal}>
            <Icon name="time-outline" size={14} color={colors.textMuted} />
            <Text style={styles.tiempoTotalText}>{reloj(transcurrido)}</Text>
          </View>
        </View>

        {fase === 'fin' ? (
          <Final transcurrido={transcurrido} hechos={ejercicios.length} accent={accent} onTerminar={terminar} />
        ) : (
          <ScrollView contentContainerStyle={styles.contenido} showsVerticalScrollIndicator={false}>
            <View style={styles.avanceFila}>
              <Text style={styles.avanceText}>
                Ejercicio {Math.min(indice + 1, ejercicios.length)} de {ejercicios.length}
              </Text>
              <Text style={[styles.avanceFalta, { color: accent }]}>
                Falta {tiempoAproximado(faltante)}
              </Text>
            </View>
            <View style={styles.avanceBarra}>
              <View style={[styles.avanceRelleno, { width: `${Math.round(avance * 100)}%`, backgroundColor: accent }]} />
            </View>

            {fase === 'ejercicio-terminado' ? (
              <EjercicioTerminado
                ejercicio={actual}
                proximo={proximo}
                accent={accent}
                onSiguiente={siguienteEjercicio}
              />
            ) : fase === 'descanso' ? (
              <Descanso
                restante={restanteFase}
                progreso={progresoFase}
                cambioDeEjercicio={sesion.cambio}
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
                progreso={progresoFase}
                accent={accent}
                siguiente={proximo}
                onTerminarSerie={terminarSerie}
              />
            )}

            <Pressable
              onPress={salir}
              accessibilityRole="button"
              accessibilityLabel="Salir del modo entrenamiento"
              style={({ pressed }) => [styles.salirBtn, pressed && { opacity: 0.7 }]}
            >
              <Text style={styles.salirBtnText}>Salir del entrenamiento</Text>
            </Pressable>
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}

/** Fase de trabajo: el ejercicio que toca hacer ahora mismo. */
function Trabajo({
  ejercicio, serie, seriesTotales, enFase, restante, progreso, accent, siguiente, onTerminarSerie,
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

/** Aviso entre ejercicios: se hizo la última serie y hay que confirmar el paso. */
function EjercicioTerminado({ ejercicio, proximo, accent, onSiguiente }) {
  return (
    <>
      <View style={[styles.hechoIcono, { backgroundColor: alpha(colors.success, 0.16) }]}>
        <Icon name="checkmark-circle" size={64} color={colors.success} />
      </View>

      <Text style={styles.hechoTitulo}>¡Ejercicio terminado!</Text>
      <Text style={styles.hechoNombre} numberOfLines={2}>{ejercicio?.name}</Text>

      {proximo ? (
        <>
          <View style={[styles.proximoCard, { borderColor: alpha(accent, 0.35) }]}>
            <Text style={styles.proximoLabel}>VAMOS AL SIGUIENTE</Text>
            <Text style={styles.proximoNombre} numberOfLines={2}>{proximo.name}</Text>
            <Text style={styles.proximoMeta}>
              {proximo.sets} {proximo.sets > 1 ? 'series' : 'serie'} · {proximo.reps}
            </Text>
          </View>

          <Pressable
            onPress={onSiguiente}
            accessibilityRole="button"
            accessibilityLabel={`Siguiente ejercicio: ${proximo.name}`}
            style={({ pressed }) => [styles.botonGrande, { backgroundColor: accent }, pressed && styles.presionado]}
          >
            <Text style={styles.botonGrandeText}>Siguiente</Text>
            <Icon name="arrow-forward" size={24} color={colors.onPrimary} />
          </Pressable>
        </>
      ) : (
        <>
          <Text style={styles.hechoUltimo}>Era el último ejercicio del día.</Text>
          <Pressable
            onPress={onSiguiente}
            accessibilityRole="button"
            accessibilityLabel="Terminar el entrenamiento"
            style={({ pressed }) => [styles.botonGrande, { backgroundColor: colors.success }, pressed && styles.presionado]}
          >
            <Text style={styles.botonGrandeText}>Terminar entrenamiento</Text>
            <Icon name="arrow-forward" size={24} color={colors.onPrimary} />
          </Pressable>
        </>
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
          accessibilityLabel={`Sumar ${DESCANSO_EXTRA} segundos de descanso`}
          style={({ pressed }) => [styles.botonSecundario, pressed && styles.presionado]}
        >
          <Icon name="add" size={18} color={colors.text} />
          <Text style={styles.botonSecundarioText}>{DESCANSO_EXTRA} s más</Text>
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
  iconoHeader: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginLeft: -spacing.sm },
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

  hechoIcono: {
    width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center',
    marginTop: spacing.lg, marginBottom: spacing.lg,
  },
  hechoTitulo: { color: colors.success, fontSize: font.h1, fontFamily: family.display, textAlign: 'center' },
  hechoNombre: {
    color: colors.textMuted, fontSize: font.body, fontFamily: family.body,
    textAlign: 'center', marginBottom: spacing.xl,
  },
  hechoUltimo: {
    color: colors.textMuted, fontSize: font.body, fontFamily: family.body,
    textAlign: 'center', marginBottom: spacing.xl,
  },

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

  salirBtn: { paddingVertical: spacing.md, marginTop: spacing.lg, minHeight: 44, justifyContent: 'center' },
  salirBtnText: {
    color: colors.textFaint, fontSize: font.small, fontFamily: family.bodySemi,
    textDecorationLine: 'underline', textAlign: 'center',
  },

  final: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  finalIcono: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  finalTitulo: { color: colors.text, fontSize: font.h1, fontFamily: family.display, marginBottom: spacing.sm, textAlign: 'center' },
  finalTexto: {
    color: colors.textMuted, fontSize: font.body, fontFamily: family.body,
    textAlign: 'center', lineHeight: 22, marginBottom: spacing.xl,
  },
});
