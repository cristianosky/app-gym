/**
 * Confirmaciones multiplataforma.
 *
 * react-native-web no implementa `Alert.alert` con botones (no hace nada, sin
 * avisar): en la versión web del build, cualquier confirmación con
 * Cancelar/Confirmar se queda muda y el botón parece no responder. Acá se
 * revienta a `window.confirm`/`window.alert` en web y se deja el comportamiento
 * nativo intacto en Android/iOS.
 */
import { Alert as AlertNativo, Platform } from 'react-native';

export const Alert = {
  alert(title, message, buttons) {
    if (Platform.OS !== 'web') {
      return AlertNativo.alert(title, message, buttons);
    }

    const opciones = buttons?.length ? buttons : [{ text: 'OK' }];
    const texto = [title, message].filter(Boolean).join('\n\n');

    if (opciones.length === 1) {
      window.alert(texto);
      opciones[0].onPress?.();
      return;
    }

    const cancelar = opciones.find((b) => b.style === 'cancel');
    const confirmar = opciones.find((b) => b.style !== 'cancel') ?? opciones[0];

    if (window.confirm(texto)) confirmar.onPress?.();
    else cancelar?.onPress?.();
  },
};
