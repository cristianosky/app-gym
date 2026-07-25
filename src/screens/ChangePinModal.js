/**
 * Cambiar el PIN: PIN actual → PIN nuevo → confirmar.
 *
 * Tres pasos cortos con el mismo teclado numérico del registro, para no
 * pedir todo en una sola pantalla ni arriesgarse a que se equivoque
 * escribiendo un PIN nuevo que no quería.
 */
import React, { useCallback, useState } from 'react';
import { Modal, View, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { colors, spacing, font, family, radius, alpha } from '../theme';
import Icon from '../components/Icon';
import Button from '../components/Button';
import PinPad, { PIN_LENGTH } from '../components/PinPad';
import * as endpoints from '../api/endpoints';

const PASOS = ['actual', 'nuevo', 'confirmar'];

const TEXTOS = {
  actual: { titulo: 'Su PIN actual', descripcion: 'Escriba el PIN con el que entra ahora.' },
  nuevo: { titulo: 'PIN nuevo', descripcion: `Escoja ${PIN_LENGTH} dígitos nuevos. Evite 1234 o 0000.` },
  confirmar: { titulo: 'Confírmelo', descripcion: 'Escriba otra vez el PIN nuevo.' },
};

const estadoInicial = { actual: '', nuevo: '', confirmar: '' };

export default function ChangePinModal({ visible, onClose }) {
  const [paso, setPaso] = useState(0);
  const [valores, setValores] = useState(estadoInicial);
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [listo, setListo] = useState(false);

  const cerrarYReiniciar = useCallback(() => {
    setPaso(0);
    setValores(estadoInicial);
    setError(null);
    setListo(false);
    onClose();
  }, [onClose]);

  const guardar = useCallback(async () => {
    setEnviando(true);
    setError(null);
    try {
      await endpoints.perfil.cambiarPin(valores.actual, valores.nuevo);
      setListo(true);
    } catch (err) {
      setError(err.message);
      // Se reinicia desde el PIN actual: si falló, lo más probable es que
      // se haya equivocado escribiéndolo.
      setPaso(0);
      setValores(estadoInicial);
    } finally {
      setEnviando(false);
    }
  }, [valores]);

  const avanzar = useCallback(() => {
    if (paso === 1 && valores.nuevo === valores.actual) {
      setError('El PIN nuevo debe ser distinto al actual.');
      setValores((v) => ({ ...v, nuevo: '' }));
      return;
    }

    if (paso === 2 && valores.confirmar !== valores.nuevo) {
      setError('Los PIN no coinciden. Empecemos de nuevo con el PIN nuevo.');
      setValores((v) => ({ ...v, nuevo: '', confirmar: '' }));
      setPaso(1);
      return;
    }

    setError(null);
    if (paso === PASOS.length - 1) {
      guardar();
      return;
    }
    setPaso((p) => p + 1);
  }, [paso, valores, guardar]);

  const clave = PASOS[paso];
  const texto = TEXTOS[clave];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={cerrarYReiniciar}>
      <View style={styles.backdrop}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheetWrap}>
          <View style={styles.sheet}>
            <View style={styles.handle} />

            {listo ? (
              <View style={styles.centro}>
                <View style={styles.iconoExito}>
                  <Icon name="checkmark-circle" size={44} color={colors.success} />
                </View>
                <Text style={styles.tituloExito}>PIN actualizado</Text>
                <Text style={styles.descripcion}>La próxima vez que entre, use su PIN nuevo.</Text>
                <Button label="Listo" onPress={cerrarYReiniciar} style={{ alignSelf: 'stretch', marginTop: spacing.lg }} />
              </View>
            ) : (
              <View style={styles.centro}>
                <Text style={styles.titulo}>{texto.titulo}</Text>
                <Text style={styles.descripcion}>{texto.descripcion}</Text>

                {error ? (
                  <View style={styles.errorBox}>
                    <Icon name="alert-circle" size={16} color={colors.danger} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                <View style={styles.pinPadWrap}>
                  <PinPad
                    value={valores[clave]}
                    onChange={(v) => {
                      setValores((prev) => ({ ...prev, [clave]: v }));
                      if (error) setError(null);
                    }}
                    onComplete={avanzar}
                    error={Boolean(error)}
                    disabled={enviando}
                  />
                </View>

                <Button
                  label={paso === PASOS.length - 1 ? 'Guardar PIN nuevo' : 'Continuar'}
                  icon={paso === PASOS.length - 1 ? 'checkmark-circle' : 'arrow-forward'}
                  onPress={avanzar}
                  loading={enviando}
                  disabled={valores[clave].length !== PIN_LENGTH}
                  style={{ alignSelf: 'stretch' }}
                />
                <Button label="Cancelar" variant="ghost" onPress={cerrarYReiniciar} style={{ alignSelf: 'stretch' }} />
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheetWrap: { width: '100%' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  handle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: colors.border, marginBottom: spacing.lg },

  centro: { alignItems: 'center' },
  titulo: { color: colors.text, fontSize: font.h1, fontFamily: family.display },
  descripcion: {
    color: colors.textMuted,
    fontSize: font.body,
    fontFamily: family.body,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: spacing.xl,
  },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: alpha(colors.danger, 0.12),
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    alignSelf: 'stretch',
  },
  errorText: { color: colors.danger, fontSize: font.small, fontFamily: family.bodyMedium, flex: 1 },

  pinPadWrap: { marginBottom: spacing.xl },

  iconoExito: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: alpha(colors.success, 0.12),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  tituloExito: { color: colors.text, fontSize: font.h2, fontFamily: family.display },
});
