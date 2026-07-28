/**
 * Reloj local para lo que se ve en pantalla.
 *
 * Los cronómetros de la sesión se calculan con marcas de tiempo (Date.now()),
 * no contando ticks: así siguen bien aunque el celular apague la pantalla o la
 * app se quede en segundo plano. Este hook solo obliga a repintar de vez en
 * cuando, y se queda quieto cuando no hay nada corriendo para no gastar batería.
 */
import { useEffect, useState } from 'react';

export default function useTick(activo = true, ms = 500) {
  const [ahora, setAhora] = useState(() => Date.now());

  useEffect(() => {
    if (!activo) return;
    setAhora(Date.now());
    const id = setInterval(() => setAhora(Date.now()), ms);
    return () => clearInterval(id);
  }, [activo, ms]);

  return ahora;
}
