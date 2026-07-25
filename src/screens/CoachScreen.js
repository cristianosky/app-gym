/**
 * Pestaña del asistente: chat con Claude sobre gimnasio y alimentación.
 *
 * Se pueden adjuntar fotos (la máquina que no sabe usar, un plato de comida,
 * una etiqueta nutricional). Las imágenes se comprimen antes de enviarlas para
 * no gastar los datos del celular, y no se guardan en el servidor.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Image, Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, radius, spacing, font, family, alpha } from '../theme';
import Icon from '../components/Icon';
import ChatBubble from '../components/ChatBubble';
import * as endpoints from '../api/endpoints';
import { usePlan } from '../store/PlanStore';

/** Preguntas de arranque, para que nadie se quede mirando un chat vacío. */
const SUGERENCIAS = [
  '¿Cómo hago bien la sentadilla?',
  '¿Qué como después de entrenar?',
  '¿La creatina sí sirve?',
  '¿Qué hago si la máquina está ocupada?',
  'Me duele la espalda al hacer peso muerto',
];

const MAX_IMAGENES = 3;

export default function CoachScreen() {
  const { nombre } = usePlan();

  const [mensajes, setMensajes] = useState([]);
  const [texto, setTexto] = useState('');
  const [imagenes, setImagenes] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [cargandoHistorial, setCargandoHistorial] = useState(true);
  const [error, setError] = useState(null);

  const scrollRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const respuesta = await endpoints.asistente.historial();
        setMensajes(respuesta.messages ?? []);
      } catch {
        // Sin historial se arranca en limpio: no vale la pena molestar con un error.
      } finally {
        setCargandoHistorial(false);
      }
    })();
  }, []);

  const irAlFinal = useCallback(() => {
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  }, []);

  useEffect(() => {
    if (mensajes.length > 0) irAlFinal();
  }, [mensajes.length, irAlFinal]);

  /** Abre la galería o la cámara y guarda la imagen en base64. */
  const adjuntar = useCallback(
    async (origen) => {
      if (imagenes.length >= MAX_IMAGENES) return;

      const permiso =
        origen === 'camara'
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permiso.granted) {
        Alert.alert(
          'Permiso necesario',
          origen === 'camara'
            ? 'Para tomar la foto necesitamos permiso de la cámara. Actívelo en los ajustes del celular.'
            : 'Para escoger la foto necesitamos permiso de sus fotos. Actívelo en los ajustes del celular.',
        );
        return;
      }

      const opciones = {
        mediaTypes: ['images'],
        base64: true,
        // Se baja la calidad a propósito: para que la IA vea la postura o el
        // plato no hace falta una foto de 4 MB, y así carga mucho más rápido.
        quality: 0.55,
      };

      const resultado =
        origen === 'camara'
          ? await ImagePicker.launchCameraAsync(opciones)
          : await ImagePicker.launchImageLibraryAsync(opciones);

      if (resultado.canceled) return;

      const activo = resultado.assets?.[0];
      if (!activo?.base64) return;

      const mediaType = activo.mimeType?.startsWith('image/') ? activo.mimeType : 'image/jpeg';
      setImagenes((previo) => [...previo, { mediaType, data: activo.base64, uri: activo.uri }]);
    },
    [imagenes.length],
  );

  const quitarImagen = (indice) => {
    setImagenes((previo) => previo.filter((_, i) => i !== indice));
  };

  const enviar = useCallback(
    async (mensajeDirecto) => {
      const contenido = (mensajeDirecto ?? texto).trim();
      if (!contenido && imagenes.length === 0) return;
      if (enviando) return;

      setEnviando(true);
      setError(null);

      // Se pinta de una la pregunta para que el chat se sienta inmediato.
      const provisional = {
        id: `local-${Date.now()}`,
        role: 'user',
        content: contenido || '(foto adjunta)',
        hasImage: imagenes.length > 0,
      };
      setMensajes((previo) => [...previo, provisional]);
      setTexto('');
      const adjuntas = imagenes;
      setImagenes([]);

      try {
        const respuesta = await endpoints.asistente.preguntar(
          contenido,
          adjuntas.map(({ mediaType, data }) => ({ mediaType, data })),
        );
        // Se reemplaza el provisional por los mensajes reales del servidor.
        setMensajes((previo) => [
          ...previo.filter((m) => m.id !== provisional.id),
          respuesta.pregunta,
          respuesta.respuesta,
        ]);
      } catch (err) {
        setMensajes((previo) => previo.filter((m) => m.id !== provisional.id));
        setTexto(contenido);
        setImagenes(adjuntas);
        setError(err.message);
      } finally {
        setEnviando(false);
      }
    },
    [texto, imagenes, enviando],
  );

  const limpiar = () => {
    Alert.alert('Borrar la conversación', '¿Seguro que quiere borrar todo el chat?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Borrar',
        style: 'destructive',
        onPress: async () => {
          try {
            await endpoints.asistente.limpiar();
            setMensajes([]);
          } catch (err) {
            setError(err.message);
          }
        },
      },
    ]);
  };

  const puedeEnviar = (texto.trim().length > 0 || imagenes.length > 0) && !enviando;
  const vacio = mensajes.length === 0 && !cargandoHistorial;

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <View style={styles.headerIcono}>
          <Icon set="mci" name="robot-outline" size={20} color={colors.secondary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitulo}>Asistente</Text>
          <Text style={styles.headerSub}>Pregúntele lo que sea del gym</Text>
        </View>
        {mensajes.length > 0 && (
          <Pressable
            onPress={limpiar}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Borrar la conversación"
            style={styles.headerBtn}
          >
            <Icon name="trash-outline" size={19} color={colors.textFaint} />
          </Pressable>
        )}
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.mensajes}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={irAlFinal}
      >
        {cargandoHistorial ? (
          <ActivityIndicator color={colors.secondary} style={{ marginTop: spacing.xl }} />
        ) : vacio ? (
          <Bienvenida nombre={nombre} onSugerencia={(s) => enviar(s)} />
        ) : (
          mensajes.map((m) => (
            <ChatBubble key={m.id} role={m.role} content={m.content} hasImage={m.hasImage} />
          ))
        )}

        {enviando && (
          <View style={styles.escribiendo}>
            <ActivityIndicator size="small" color={colors.secondary} />
            <Text style={styles.escribiendoText}>Está escribiendo…</Text>
          </View>
        )}

        {error ? (
          <View style={styles.errorBox}>
            <Icon name="alert-circle" size={16} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
      </ScrollView>

      {/* Vista previa de las fotos adjuntas */}
      {imagenes.length > 0 && (
        <View style={styles.adjuntasRow}>
          {imagenes.map((img, i) => (
            <View key={i} style={styles.adjuntaWrap}>
              <Image source={{ uri: img.uri }} style={styles.adjuntaImg} />
              <Pressable
                onPress={() => quitarImagen(i)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Quitar foto"
                style={styles.adjuntaQuitar}
              >
                <Icon name="close" size={13} color={colors.text} />
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <View style={styles.barra}>
        <Pressable
          onPress={() => adjuntar('galeria')}
          disabled={imagenes.length >= MAX_IMAGENES}
          accessibilityRole="button"
          accessibilityLabel="Adjuntar una foto de la galería"
          style={({ pressed }) => [
            styles.barraBtn,
            pressed && styles.barraBtnPressed,
            imagenes.length >= MAX_IMAGENES && styles.barraBtnDisabled,
          ]}
        >
          <Icon name="image-outline" size={21} color={colors.textMuted} />
        </Pressable>

        <Pressable
          onPress={() => adjuntar('camara')}
          disabled={imagenes.length >= MAX_IMAGENES}
          accessibilityRole="button"
          accessibilityLabel="Tomar una foto"
          style={({ pressed }) => [
            styles.barraBtn,
            pressed && styles.barraBtnPressed,
            imagenes.length >= MAX_IMAGENES && styles.barraBtnDisabled,
          ]}
        >
          <Icon name="camera-outline" size={21} color={colors.textMuted} />
        </Pressable>

        <TextInput
          value={texto}
          onChangeText={setTexto}
          placeholder="Escriba su pregunta…"
          placeholderTextColor={colors.textFaint}
          style={styles.input}
          multiline
          maxLength={2000}
          accessibilityLabel="Su pregunta"
        />

        <Pressable
          onPress={() => enviar()}
          disabled={!puedeEnviar}
          accessibilityRole="button"
          accessibilityLabel="Enviar"
          style={({ pressed }) => [
            styles.enviar,
            !puedeEnviar && styles.enviarDisabled,
            pressed && puedeEnviar && { opacity: 0.85 },
          ]}
        >
          <Icon name="arrow-up" size={21} color={colors.onPrimary} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

/** Pantalla inicial del chat con preguntas sugeridas. */
function Bienvenida({ nombre, onSugerencia }) {
  const primerNombre = nombre?.split(' ')[0];

  return (
    <View style={styles.bienvenida}>
      <View style={styles.bienvenidaIcono}>
        <Icon set="mci" name="robot-happy-outline" size={40} color={colors.secondary} />
      </View>
      <Text style={styles.bienvenidaTitulo}>
        {primerNombre ? `¿Qué tal, ${primerNombre}?` : '¿Qué tal?'}
      </Text>
      <Text style={styles.bienvenidaTexto}>
        Pregúnteme de ejercicios, técnica, comidas o suplementos. También puede mandarme una foto
        de una máquina, de su postura o de un plato de comida.
      </Text>

      <Text style={styles.bienvenidaEtiqueta}>Para arrancar</Text>
      {SUGERENCIAS.map((sugerencia) => (
        <Pressable
          key={sugerencia}
          onPress={() => onSugerencia(sugerencia)}
          accessibilityRole="button"
          style={({ pressed }) => [styles.sugerencia, pressed && { opacity: 0.75 }]}
        >
          <Text style={styles.sugerenciaText}>{sugerencia}</Text>
          <Icon name="arrow-forward" size={15} color={colors.textFaint} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.bgElevated,
  },
  headerIcono: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: alpha(colors.secondary, 0.14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitulo: { color: colors.text, fontSize: font.h3, fontFamily: family.bodySemi },
  headerSub: { color: colors.textFaint, fontSize: font.small, fontFamily: family.body },
  headerBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },

  mensajes: { padding: spacing.lg, paddingBottom: spacing.md, flexGrow: 1 },

  escribiendo: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingLeft: spacing.xl + spacing.sm },
  escribiendoText: { color: colors.textFaint, fontSize: font.small, fontFamily: family.body },

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

  bienvenida: { alignItems: 'center', paddingTop: spacing.lg },
  bienvenidaIcono: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: alpha(colors.secondary, 0.12),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  bienvenidaTitulo: { color: colors.text, fontSize: font.h2, fontFamily: family.display },
  bienvenidaTexto: {
    color: colors.textMuted,
    fontSize: font.body,
    fontFamily: family.body,
    textAlign: 'center',
    lineHeight: 21,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  bienvenidaEtiqueta: {
    alignSelf: 'flex-start',
    color: colors.textFaint,
    fontSize: font.tiny,
    fontFamily: family.bodyBold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  sugerencia: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
    minHeight: 48,
  },
  sugerenciaText: { color: colors.text, fontSize: font.body, fontFamily: family.body, flex: 1 },

  adjuntasRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  adjuntaWrap: { position: 'relative' },
  adjuntaImg: { width: 58, height: 58, borderRadius: radius.sm, backgroundColor: colors.surfaceAlt },
  adjuntaQuitar: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.surfaceHigh,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },

  barra: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? spacing.lg : spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bgElevated,
  },
  barraBtn: { width: 44, height: 44, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  barraBtnPressed: { backgroundColor: colors.surfaceAlt },
  barraBtnDisabled: { opacity: 0.35 },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: font.body,
    fontFamily: family.body,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm + 2,
    paddingBottom: spacing.sm + 2,
    maxHeight: 120,
    minHeight: 44,
  },
  enviar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enviarDisabled: { backgroundColor: colors.surfaceHigh },
});
