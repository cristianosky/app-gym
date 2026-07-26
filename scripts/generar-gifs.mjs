/**
 * Genera src/data/localGifs.js a partir de lo que haya en assets/gifs/.
 *
 * No hay que tocar ningún catálogo ni componente para usar un ejemplo local:
 * solo suba el archivo a assets/gifs/<id-del-ejercicio>.<ext> (el id es el
 * mismo que aparece en server/src/data/catalog/*.js) y corra:
 *   npm run gifs
 *
 * Acepta video (.mp4, .mov, .webm, .m4v) o imagen (.gif, .jpg, .jpeg, .png,
 * .webp). El componente que lo muestra decide cómo reproducirlo según el tipo.
 *
 * Regenera el archivo completo cada vez, así que no lo edite a mano.
 */
import { readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const RAIZ = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const CARPETA_GIFS = path.join(RAIZ, 'assets', 'gifs');
const SALIDA = path.join(RAIZ, 'src', 'data', 'localGifs.js');

const EXTENSIONES_VIDEO = ['.mp4', '.mov', '.webm', '.m4v'];
const EXTENSIONES_IMAGEN = ['.gif', '.jpg', '.jpeg', '.png', '.webp'];

const { EXERCISES, BLOQUES } = await import(
  pathToFileURL(path.join(RAIZ, 'server', 'src', 'data', 'catalog.js'))
);
const catalogo = [...EXERCISES, ...BLOQUES];
const idsCatalogo = new Set(catalogo.map((ex) => ex.id));

mkdirSync(CARPETA_GIFS, { recursive: true });
const archivos = readdirSync(CARPETA_GIFS);

const encontrados = [];
const desconocidos = [];
for (const archivo of archivos) {
  const ext = path.extname(archivo).toLowerCase();
  const tipo = EXTENSIONES_VIDEO.includes(ext) ? 'video' : EXTENSIONES_IMAGEN.includes(ext) ? 'imagen' : null;
  if (!tipo) continue; // README.md y cualquier otra cosa que no sea media

  const id = path.basename(archivo, ext);
  if (idsCatalogo.has(id)) encontrados.push({ id, archivo, tipo });
  else desconocidos.push(archivo);
}
encontrados.sort((a, b) => a.id.localeCompare(b.id));

const lineas = encontrados
  .map(({ id, archivo, tipo }) => `  '${id}': { tipo: '${tipo}', fuente: require('../../assets/gifs/${archivo}') },`)
  .join('\n');

const contenido = `/**
 * Registro de ejemplos locales (video o imagen), generado por scripts/generar-gifs.mjs.
 * NO EDITE ESTE ARCHIVO A MANO: sus cambios se pierden al regenerarlo.
 *
 * Para agregar uno: copie <id-del-ejercicio>.<ext> en assets/gifs/ (video:
 * mp4/mov/webm/m4v, imagen: gif/jpg/jpeg/png/webp) y corra \`npm run gifs\`.
 */
export const LOCAL_GIFS = {
${lineas}
};

/** Devuelve { tipo: 'video'|'imagen', fuente } del ejemplo local, o null si no existe. */
export function getLocalGif(id) {
  if (!id) return null;
  return LOCAL_GIFS[id] || null;
}
`;

writeFileSync(SALIDA, contenido);

console.log(`Listo: ${encontrados.length} ejemplo(s) registrados en src/data/localGifs.js`);
if (desconocidos.length > 0) {
  console.log(`\nIgnorados (el nombre no coincide con ningún id del catálogo):`);
  for (const f of desconocidos) console.log(`  - ${f}`);
}
const idsEncontrados = new Set(encontrados.map((e) => e.id));
const faltantes = catalogo.filter((ex) => !idsEncontrados.has(ex.id));
console.log(`\nFaltan ${faltantes.length} de ${catalogo.length} ejercicios por tener ejemplo local:`);
for (const ex of faltantes) console.log(`  - ${ex.id}`);
