/**
 * Convierte videos cortos de ejercicios en GIFs optimizados, usando ffmpeg.
 *
 * Uso normal:
 *   1. Deje sus videos en  assets/videos-ejercicios/  con el id del ejercicio
 *      como nombre del archivo, por ejemplo:  press-banca-barra.mp4
 *      (el id es el mismo que aparece en server/src/data/catalog/*.js)
 *   2. Corra:  npm run videos:gif
 *   3. Se generan los .gif en  assets/gifs/  y se regenera src/data/localGifs.js,
 *      así la app los muestra sin tocar nada más.
 *
 * SOLO acepta video: .mp4, .mov, .webm, .m4v. Cualquier otro formato (imágenes
 * incluidas) se rechaza y el script termina con error sin convertir nada: "no
 * debe aceptar ningún otro formato".
 *
 * Ajustes por variable de entorno (opcionales):
 *   GIF_FPS=15        cuadros por segundo del gif
 *   GIF_WIDTH=480     ancho en px (alto se calcula manteniendo proporción)
 *   GIF_MAXDUR=8      segundos máximos (recorta el resto para que pese poco)
 *   VIDEOS_SRC=...    carpeta de entrada (por defecto assets/videos-ejercicios)
 *   GIFS_OUT=...      carpeta de salida  (por defecto assets/gifs)
 */
import { readdirSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { tmpdir } from 'node:os';
import path from 'node:path';

const ejecutar = promisify(execFile);

const RAIZ = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const CARPETA_ENTRADA = process.env.VIDEOS_SRC
  ? path.resolve(process.env.VIDEOS_SRC)
  : path.join(RAIZ, 'assets', 'videos-ejercicios');
const CARPETA_SALIDA = process.env.GIFS_OUT
  ? path.resolve(process.env.GIFS_OUT)
  : path.join(RAIZ, 'assets', 'gifs');
const REGENERAR_REGISTRO = !process.env.GIFS_OUT; // solo si salimos a assets/gifs

// Único formato admitido: video. Nada más se acepta.
const EXTENSIONES_VIDEO = ['.mp4', '.mov', '.webm', '.m4v'];
// Archivos que no son media y no deben contar como "formato inválido".
const IGNORAR = new Set(['.gitkeep', '.ds_store', 'thumbs.db', 'desktop.ini', 'readme.md']);

const FPS = Number(process.env.GIF_FPS) || 15;
const ANCHO = Number(process.env.GIF_WIDTH) || 480;
const MAX_DUR = Number(process.env.GIF_MAXDUR) || 8;

function salirConError(mensaje) {
  console.error(`\n✗ ${mensaje}\n`);
  process.exit(1);
}

/** Confirma que ffmpeg está disponible en el sistema. */
async function verificarFfmpeg() {
  try {
    await ejecutar('ffmpeg', ['-version']);
  } catch {
    salirConError(
      'No se encontró ffmpeg. Instálelo y verifique que esté en el PATH.\n' +
        '  Windows:  winget install Gyan.FFmpeg\n' +
        '  Mac:      brew install ffmpeg\n' +
        '  Linux:    sudo apt install ffmpeg',
    );
  }
}

/**
 * Convierte un video a GIF con buena calidad y poco peso, usando paleta en dos
 * pasadas (palettegen + paletteuse), que es como ffmpeg saca gifs decentes.
 */
async function convertir(entrada, salida) {
  const paleta = path.join(tmpdir(), `paleta-${process.pid}-${Date.now()}.png`);
  const filtro = `fps=${FPS},scale=${ANCHO}:-1:flags=lanczos`;

  try {
    await ejecutar('ffmpeg', [
      '-y', '-t', String(MAX_DUR), '-i', entrada,
      '-vf', `${filtro},palettegen=stats_mode=diff`,
      paleta,
    ]);
    await ejecutar('ffmpeg', [
      '-y', '-t', String(MAX_DUR), '-i', entrada, '-i', paleta,
      '-lavfi', `${filtro} [x]; [x][1:v] paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle`,
      '-loop', '0',
      salida,
    ]);
  } finally {
    if (existsSync(paleta)) rmSync(paleta, { force: true });
  }
}

async function main() {
  await verificarFfmpeg();

  mkdirSync(CARPETA_ENTRADA, { recursive: true });
  mkdirSync(CARPETA_SALIDA, { recursive: true });

  const archivos = readdirSync(CARPETA_ENTRADA).filter(
    (f) => !f.startsWith('.') && !IGNORAR.has(f.toLowerCase()),
  );

  if (archivos.length === 0) {
    console.log(`No hay videos en ${path.relative(RAIZ, CARPETA_ENTRADA)}/.`);
    console.log('Deje ahí sus videos (mp4/mov/webm/m4v) con el id del ejercicio como nombre.');
    return;
  }

  // Regla estricta: si hay CUALQUIER cosa que no sea video, no se convierte nada.
  const invalidos = archivos.filter((f) => !EXTENSIONES_VIDEO.includes(path.extname(f).toLowerCase()));
  if (invalidos.length > 0) {
    salirConError(
      'Solo se aceptan videos (mp4, mov, webm, m4v). No se admite ningún otro formato.\n' +
        'Quite estos archivos de la carpeta y vuelva a intentar:\n' +
        invalidos.map((f) => `  - ${f}`).join('\n'),
    );
  }

  // Avisar (sin bloquear) si el nombre no coincide con un id del catálogo: la
  // app solo muestra ejemplos cuyo id existe en el catálogo.
  const { EXERCISES, BLOQUES } = await import(
    pathToFileURL(path.join(RAIZ, 'server', 'src', 'data', 'catalog.js'))
  );
  const idsCatalogo = new Set([...EXERCISES, ...BLOQUES].map((ex) => ex.id));

  console.log(`Convirtiendo ${archivos.length} video(s) a GIF (${ANCHO}px, ${FPS} fps, máx ${MAX_DUR}s)...\n`);

  const desconocidos = [];
  let convertidos = 0;
  for (const archivo of archivos) {
    const id = path.basename(archivo, path.extname(archivo));
    const entrada = path.join(CARPETA_ENTRADA, archivo);
    const salida = path.join(CARPETA_SALIDA, `${id}.gif`);
    if (!idsCatalogo.has(id)) desconocidos.push(archivo);

    process.stdout.write(`  • ${archivo}  →  ${id}.gif ... `);
    try {
      await convertir(entrada, salida);
      convertidos++;
      console.log('ok');
    } catch (error) {
      console.log('ERROR');
      console.error(`    ${error.shortMessage ?? error.message}`);
    }
  }

  console.log(`\nListo: ${convertidos}/${archivos.length} gif(s) generados en ${path.relative(RAIZ, CARPETA_SALIDA)}/.`);

  if (desconocidos.length > 0) {
    console.log('\n⚠ Estos nombres no coinciden con ningún id del catálogo (la app no los mostrará hasta corregir el nombre):');
    for (const f of desconocidos) console.log(`  - ${f}`);
  }

  if (REGENERAR_REGISTRO && convertidos > 0) {
    console.log('\nActualizando src/data/localGifs.js ...');
    await ejecutar('node', [path.join(RAIZ, 'scripts', 'generar-gifs.mjs')]).then(
      ({ stdout }) => process.stdout.write(stdout),
      (error) => console.error(error.stdout ?? error.message),
    );
  }
}

main().catch((error) => salirConError(error.message));
