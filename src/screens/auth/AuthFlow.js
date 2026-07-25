/**
 * Navegación del flujo de entrada: bienvenida, ingreso y registro.
 * Es un cambio de estado simple porque solo son tres pantallas sin historial.
 */
import React, { useState } from 'react';
import WelcomeScreen from './WelcomeScreen';
import LoginScreen from './LoginScreen';
import RegisterScreen from './RegisterScreen';

export default function AuthFlow() {
  const [pantalla, setPantalla] = useState('bienvenida');

  if (pantalla === 'ingreso') {
    return (
      <LoginScreen
        onVolver={() => setPantalla('bienvenida')}
        onIrARegistro={() => setPantalla('registro')}
      />
    );
  }

  if (pantalla === 'registro') {
    return <RegisterScreen onVolver={() => setPantalla('bienvenida')} />;
  }

  return (
    <WelcomeScreen
      onRegistrar={() => setPantalla('registro')}
      onIngresar={() => setPantalla('ingreso')}
    />
  );
}
