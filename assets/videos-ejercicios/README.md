# Videos de ejercicios → GIF

Deje aquí los **videos cortos** que muestran cada ejercicio y conviértalos a GIF con:

```bash
npm run videos:gif
```

## Reglas

- **Solo video**: `.mp4`, `.mov`, `.webm`, `.m4v`. Cualquier otro formato (imágenes
  incluidas) hace que el script se detenga con error sin convertir nada.
- El **nombre del archivo** debe ser el `id` del ejercicio del catálogo
  (ver `server/src/data/catalog/*.js`). Ejemplo: `press-banca-barra.mp4`.
- Videos cortos (unos segundos): el GIF se recorta a los primeros 8 s por defecto.

## Qué hace el comando

1. Convierte cada video a un GIF optimizado (paleta en dos pasadas) en `assets/gifs/`.
2. Regenera `src/data/localGifs.js` para que la app lo muestre, sin tocar nada más.

## Ajustes opcionales (variables de entorno)

| Variable | Default | Qué hace |
|----------|---------|----------|
| `GIF_FPS` | `15` | Cuadros por segundo |
| `GIF_WIDTH` | `480` | Ancho en px (alto proporcional) |
| `GIF_MAXDUR` | `8` | Segundos máximos del GIF |

Los videos fuente de esta carpeta **no** se incluyen en la app (solo los GIF resultantes).
