/**
 * Compartir la rutina vigente con otro usuario, por su nombre de usuario.
 *
 * La otra persona recibe una solicitud y decide si la acepta (ver
 * `SharedRoutineRequests`); no se comparte de inmediato sin su confirmación.
 */
import React, { useCallback, useState } from 'react';
import { Modal, View, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { colors, spacing, font, family, radius, alpha } from '../theme';
import Icon from './Icon';
import Button from './Button';
import FormField from './FormField';
import { usePlan } from '../store/PlanStore';

export default function ShareRoutineModal({ visible, onClose }) {
  const { compartirRutina } = usePlan();
  const [username, setUsername] = useState('');
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(null);

  const cerrarYReiniciar = useCallback(() => {
    setUsername('');
    setError(null);
    setEnviado(null);
    onClose();
  }, [onClose]);

  const enviar = useCallback(async () => {
    if (!username.trim()) {
      setError('Escriba el usuario de la otra persona.');
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      const respuesta = await compartirRutina(username.trim());
      setEnviado(respuesta.to);
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }, [username, compartirRutina]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={cerrarYReiniciar}>
      <View style={styles.backdrop}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.sheetWrap}>
          <View style={styles.sheet}>
            <View style={styles.handle} />

            {enviado ? (
              <View style={styles.centro}>
                <View style={styles.iconoExito}>
                  <Icon name="checkmark-circle" size={44} color={colors.success} />
                </View>
                <Text style={styles.tituloExito}>Solicitud enviada</Text>
                <Text style={styles.descripcionCentro}>
                  {enviado.name} podrá aceptar o rechazar su rutina desde su app.
                </Text>
                <Button label="Listo" onPress={cerrarYReiniciar} style={{ alignSelf: 'stretch', marginTop: spacing.lg }} />
              </View>
            ) : (
              <>
                <Text style={styles.titulo}>Compartir rutina</Text>
                <Text style={styles.descripcion}>
                  Escriba el usuario de la persona con la que quiere compartir su rutina actual. Le llegará
                  una solicitud para aceptarla.
                </Text>

                <FormField
                  label="Usuario"
                  value={username}
                  onChangeText={(v) => {
                    setUsername(v);
                    if (error) setError(null);
                  }}
                  placeholder="usuario"
                  autoCapitalize="none"
                  error={error}
                  autoFocus
                  returnKeyType="send"
                  onSubmitEditing={enviar}
                />

                <Button
                  label="Enviar solicitud"
                  icon="share-social"
                  onPress={enviar}
                  loading={enviando}
                  style={{ alignSelf: 'stretch' }}
                />
                <Button label="Cancelar" variant="ghost" onPress={cerrarYReiniciar} style={{ alignSelf: 'stretch' }} />
              </>
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

  titulo: { color: colors.text, fontSize: font.h1, fontFamily: family.display },
  descripcion: {
    color: colors.textMuted,
    fontSize: font.body,
    fontFamily: family.body,
    lineHeight: 20,
    marginTop: 4,
    marginBottom: spacing.lg,
  },

  centro: { alignItems: 'center' },
  descripcionCentro: {
    color: colors.textMuted,
    fontSize: font.body,
    fontFamily: family.body,
    textAlign: 'center',
    lineHeight: 21,
  },
  iconoExito: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: alpha(colors.success, 0.12),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  tituloExito: { color: colors.text, fontSize: font.h2, fontFamily: family.display, marginBottom: spacing.sm },
});
