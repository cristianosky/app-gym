/**
 * Burbuja de mensaje del asistente.
 *
 * El texto del asistente llega en párrafos separados por saltos de línea (le
 * pedimos que no use markdown), así que se pinta tal cual con buen interlineado
 * para que se lea cómodo en el celular.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing, font, family, alpha } from '../theme';
import Icon from './Icon';

export default function ChatBubble({ role, content, hasImage }) {
  const esUsuario = role === 'user';

  return (
    <View style={[styles.fila, esUsuario ? styles.filaUsuario : styles.filaAsistente]}>
      {!esUsuario && (
        <View style={styles.avatar}>
          <Icon set="mci" name="robot-outline" size={17} color={colors.secondary} />
        </View>
      )}

      <View style={[styles.burbuja, esUsuario ? styles.burbujaUsuario : styles.burbujaAsistente]}>
        {hasImage && (
          <View style={styles.adjunto}>
            <Icon name="image" size={14} color={esUsuario ? alpha(colors.onPrimary, 0.7) : colors.textFaint} />
            <Text style={[styles.adjuntoText, esUsuario && { color: alpha(colors.onPrimary, 0.7) }]}>
              Foto adjunta
            </Text>
          </View>
        )}
        <Text style={[styles.texto, esUsuario && styles.textoUsuario]} selectable>
          {content}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fila: { flexDirection: 'row', marginBottom: spacing.md, gap: spacing.sm, alignItems: 'flex-end' },
  filaUsuario: { justifyContent: 'flex-end', paddingLeft: spacing.xxl },
  filaAsistente: { justifyContent: 'flex-start', paddingRight: spacing.xl },

  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: alpha(colors.secondary, 0.14),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },

  burbuja: { borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 3, flexShrink: 1 },
  burbujaUsuario: { backgroundColor: colors.primary, borderBottomRightRadius: radius.sm },
  burbujaAsistente: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: radius.sm,
  },

  texto: { color: colors.text, fontSize: font.body, fontFamily: family.body, lineHeight: 22 },
  textoUsuario: { color: colors.onPrimary, fontFamily: family.bodyMedium },

  adjunto: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 5 },
  adjuntoText: { color: colors.textFaint, fontSize: font.tiny, fontFamily: family.bodyMedium },
});
