/**
 * Convierte un video subido por la persona en un GIF optimizado.
 *
 * Reglas:
 *   - SOLO se aceptan videos. Se valida por partida doble: el Content-Type
 *     declarado y, sobre todo, un sondeo real con ffprobe (que no se puede
 *     falsear cambiándole la extensión al archivo). Cualquier otra cosa se
 *     rechaza con 400: "no se admite ningún otro formato".
 *   - El GIF se recorta a los primeros segundos para que pese poco.
 *
 * El resultado se guarda en `<uploadsDir>/gifs/` y se sirve como archivo
 * estático en `/media/gifs/<id>.gif` (ver app.js).
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { writeFile, mkdir, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { env } from '../config/env.js';
import { newId } from '../utils/id.js';
import { badRequest } from '../utils/app-error.js';

const ejecutar = promisify(execFile);

const FPS = 15;
const ANCHO = 480; // px; el alto se calcula manteniendo la proporción
const MAX_DUR = 8; // s: recorta el resto para que el gif no pese de más

const GIFS_DIR = path.join(env.uploadsDir, 'gifs');

/** Content-Types de video que aceptamos como "declarados" desde el navegador. */
const TIPOS_VIDEO = new Set([
  'video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v', 'video/m4v', 'video/x-matroska',
]);

/**
 * Sondea el archivo con ffprobe para confirmar que es un VIDEO de verdad y no
 * una imagen fija. No basta con "tiene un stream de video": ffmpeg modela una
 * imagen suelta (png/jpg/webp...) como un stream de video de un solo cuadro, así
 * que además se exige un contenedor de video y una duración real. Esto atrapa
 * también los intentos de subir una imagen mintiendo en el Content-Type.
 */
async function esVideoReal(archivo) {
  try {
    const { stdout } = await ejecutar('ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=format_name,duration:stream=codec_type',
      '-of', 'json',
      archivo,
    ]);
    const info = JSON.parse(stdout);
    const formato = String(info.format?.format_name ?? '').toLowerCase();
    const duracion = Number(info.format?.duration);
    const tieneStreamVideo = (info.streams ?? []).some((s) => s.codec_type === 'video');

    // Formatos que en realidad son imagen fija o secuencia de imágenes.
    const esImagen = /(_pipe|image2|^gif$|^png$|^jpeg$|^webp$|^bmp$|^tiff$)/.test(formato);

    return tieneStreamVideo && !esImagen && Number.isFinite(duracion) && duracion > 0.2;
  } catch {
    return false;
  }
}

/**
 * Convierte el buffer de un video en un GIF y lo deja servido en /media/gifs.
 * @param {Buffer} buffer contenido del archivo subido
 * @param {{declaredType?: string}} [opciones] Content-Type declarado por el cliente
 * @returns {Promise<{file: string, url: string, bytes: number, width: number, fps: number}>}
 */
export async function convertVideoToGif(buffer, { declaredType } = {}) {
  // 1) Rechazo rápido por el tipo declarado (imágenes, pdf, etc.).
  //    'application/octet-stream' se deja pasar a la validación real con ffprobe,
  //    porque algunos navegadores no mandan un tipo de video claro.
  if (declaredType && declaredType !== 'application/octet-stream' && !TIPOS_VIDEO.has(declaredType)) {
    throw badRequest('Solo se aceptan videos (mp4, mov, webm, m4v). No se admite ningún otro formato.');
  }

  await mkdir(GIFS_DIR, { recursive: true });

  const id = newId('gif');
  const temporal = path.join(tmpdir(), `${id}.upload`);
  const paleta = path.join(tmpdir(), `${id}.png`);
  const salida = path.join(GIFS_DIR, `${id}.gif`);

  await writeFile(temporal, buffer);

  try {
    // 2) Validación real: no basta con la extensión ni el Content-Type, tiene
    //    que ser un video de verdad (contenedor de video con duración).
    if (!(await esVideoReal(temporal))) {
      throw badRequest('El archivo no es un video válido. Solo se aceptan videos (mp4, mov, webm, m4v).');
    }

    // 3) Conversión a GIF con paleta en dos pasadas (mejor color, menor peso).
    const filtro = `fps=${FPS},scale=${ANCHO}:-1:flags=lanczos`;
    await ejecutar('ffmpeg', [
      '-y', '-t', String(MAX_DUR), '-i', temporal,
      '-vf', `${filtro},palettegen=stats_mode=diff`,
      paleta,
    ]);
    await ejecutar('ffmpeg', [
      '-y', '-t', String(MAX_DUR), '-i', temporal, '-i', paleta,
      '-lavfi', `${filtro} [x]; [x][1:v] paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle`,
      '-loop', '0',
      salida,
    ]);

    const { size } = await stat(salida);
    return { file: `${id}.gif`, url: `/media/gifs/${id}.gif`, bytes: size, width: ANCHO, fps: FPS };
  } finally {
    await rm(temporal, { force: true });
    await rm(paleta, { force: true });
  }
}
