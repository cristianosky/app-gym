/**
 * Punto de entrada del servidor.
 */
import { networkInterfaces } from 'node:os';
import { createApp } from './app.js';
import { env } from './config/env.js';

const app = createApp();

const server = app.listen(env.PORT, () => {
  const red = obtenerIpLocal();
  // eslint-disable-next-line no-console
  console.log(
    [
      '',
      '  Mi Entrenamiento — API',
      `  Modo:   ${env.NODE_ENV}`,
      `  Rutina: ${env.models.routine}`,
      `  Comida: ${env.models.nutrition}`,
      `  Chat:   ${env.models.chat}`,
      `  Local:  http://localhost:${env.PORT}`,
      red ? `  Red:    http://${red}:${env.PORT}   ← use esta en la app del celular` : '',
      '',
    ]
      .filter(Boolean)
      .join('\n'),
  );
});

/** IP de la máquina en la red local, para conectar el celular al servidor. */
function obtenerIpLocal() {
  for (const interfaces of Object.values(networkInterfaces())) {
    for (const net of interfaces ?? []) {
      if (net.family === 'IPv4' && !net.internal) return net.address;
    }
  }
  return null;
}

/** Cierre ordenado para no dejar conexiones colgando al reiniciar. */
for (const señal of ['SIGINT', 'SIGTERM']) {
  process.on(señal, () => {
    server.close(() => process.exit(0));
  });
}
