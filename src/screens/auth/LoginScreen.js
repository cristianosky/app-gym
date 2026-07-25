/**
 * Ingreso en dos pasos: primero el usuario, después el PIN.
 *
 * Separarlo en dos pantallas permite saludar por el nombre antes de pedir el
 * PIN ("Hola, Cristian"), que confirma que escribió bien el usuario, y deja el
 * teclado numérico solo enfocado en los 4 dígitos.
 */
import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { colors, spacing, font, family, alpha, radius } from '../../theme';
import Icon from '../../components/Icon';
import Button from '../../components/Button';
import FormField from '../../components/FormField';
import PinPad, { PIN_LENGTH } from '../../components/PinPad';
import { useAuth } from '../../store/AuthStore';
import * as endpoints from '../../api/endpoints';

export default function LoginScreen({ onVolver, onIrARegistro }) {
  const { ingresar } = useAuth();

  const [paso, setPaso] = useState('usuario');
  const [username, setUsername] = useState('');
  const [nombre, setNombre] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);

  const continuarConUsuario = useCallback(async () => {
    const limpio = username.trim().toLowerCase();
    if (limpio.length < 3) {
      setError('Escriba su usuario.');
      return;
    }

    setCargando(true);
    setError(null);
    try {
      const respuesta = await endpoints.auth.verificarUsuario(limpio);
      if (!respuesta.exists) {
        setError('No encontramos ese usuario. Revíselo o cree una cuenta.');
        return;
      }
      setNombre(respuesta.name);
      setUsername(limpio);
      setPaso('pin');
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, [username]);

  const entrar = useCallback(async () => {
    if (pin.length !== PIN_LENGTH) return;

    setCargando(true);
    setError(null);
    try {
      await ingresar(username, pin);
      // Al entrar, el árbol de la app cambia solo: no hay que navegar.
    } catch (err) {
      setError(err.message);
      setPin('');
    } finally {
      setCargando(false);
    }
  }, [ingresar, username, pin]);

  const volverAUsuario = () => {
    setPaso('usuario');
    setPin('');
    setError(null);
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Button
          label={paso === 'usuario' ? 'Volver' : 'Cambiar de usuario'}
          icon="chevron-back"
          variant="ghost"
          onPress={paso === 'usuario' ? onVolver : volverAUsuario}
          style={styles.back}
        />

        {paso === 'usuario' ? (
          <View>
            <Text style={styles.title}>Ingresar</Text>
            <Text style={styles.subtitle}>Escriba su usuario para continuar.</Text>

            <FormField
              label="Usuario"
              value={username}
              onChangeText={(v) => {
                setUsername(v.toLowerCase().replace(/\s/g, ''));
                setError(null);
              }}
              placeholder="cristian23"
              autoCapitalize="none"
              maxLength={20}
              autoFocus
              error={error}
              returnKeyType="go"
              onSubmitEditing={continuarConUsuario}
            />

            <Button label="Continuar" icon="arrow-forward" onPress={continuarConUsuario} loading={cargando} />

            <View style={styles.registroRow}>
              <Text style={styles.registroText}>¿No tiene cuenta?</Text>
              <Button label="Crear una" variant="ghost" onPress={onIrARegistro} style={styles.registroBtn} />
            </View>
          </View>
        ) : (
          <View style={styles.pinPaso}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{nombre.charAt(0).toUpperCase()}</Text>
            </View>
            <Text style={styles.saludo}>Hola, {nombre}</Text>
            <Text style={styles.subtitle}>Escriba su PIN de {PIN_LENGTH} dígitos.</Text>

            {error ? (
              <View style={styles.errorBox}>
                <Icon name="alert-circle" size={16} color={colors.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.pinPadWrap}>
              <PinPad
                value={pin}
                onChange={(v) => {
                  setPin(v);
                  if (error) setError(null);
                }}
                onComplete={entrar}
                error={Boolean(error)}
                disabled={cargando}
              />
            </View>

            <Button
              label="Entrar"
              icon="log-in-outline"
              onPress={entrar}
              loading={cargando}
              disabled={pin.length !== PIN_LENGTH}
            />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, flexGrow: 1, justifyContent: 'center' },
  back: { alignSelf: 'flex-start', paddingHorizontal: 0, marginBottom: spacing.lg },

  title: { color: colors.text, fontSize: font.h1, fontFamily: family.display },
  subtitle: {
    color: colors.textMuted,
    fontSize: font.body,
    fontFamily: family.body,
    marginTop: 4,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },

  registroRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: spacing.md },
  registroText: { color: colors.textMuted, fontSize: font.body, fontFamily: family.body },
  registroBtn: { paddingHorizontal: spacing.sm, minHeight: 44 },

  pinPaso: { alignItems: 'center' },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: alpha(colors.primary, 0.16),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarText: { color: colors.primary, fontSize: 32, fontFamily: family.displayBlack },
  saludo: { color: colors.text, fontSize: font.h1, fontFamily: family.display },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: alpha(colors.danger, 0.12),
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: { color: colors.danger, fontSize: font.small, fontFamily: family.bodyMedium, flex: 1 },

  pinPadWrap: { marginBottom: spacing.xl },
});
