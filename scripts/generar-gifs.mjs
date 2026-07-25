/**
 * Genera src/data/localGifs.js a partir de lo que haya en assets/gifs/.
 *
 * No hay que tocar ningún catálogo ni componente para usar un GIF: solo
 * suba el archivo a assets/gifs/<id-del-ejercicio>.gif (el id es el mismo
 * que aparece en server/src/data/catalog/*.js) y corra:
 *   npm run gifs
 *
 * Regenera el archivo completo cada vez, así que no lo edite a mano.
 */
import { readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const RAIZ = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const CARPETA_GIFS = path.join(RAIZ, 'assets', 'gifs');
const SALIDA = path.join(RAIZ, 'src', 'data', 'localGifs.js');

const { EXERCISES, WARMUP, STRETCH } = await import(
  path.join(RAIZ, 'server', 'src', 'data', 'catalog.js')
);
const catalogo = [...EXERCISES, WARMUP, STRETCH];
const idsCatalogo = new Set(catalogo.map((ex) => ex.id));

mkdirSync(CARPETA_GIFS, { recursive: true });
const archivos = readdirSync(CARPETA_GIFS).filter((f) => f.toLowerCase().endsWith('.gif'));

const encontrados = [];
const desconocidos = [];
for (const archivo of archivos) {
  const id = archivo.slice(0, -4);
  if (idsCatalogo.has(id)) encontrados.push(id);
  else desconocidos.push(archivo);
}
encontrados.sort();

const lineas = encontrados
  .map((id) => `  '${id}': require('../../assets/gifs/${id}.gif'),`)
  .join('\n');

const contenido = `/**
 * Registro de GIFs locales, generado por scripts/generar-gifs.mjs.
 * NO EDITE ESTE ARCHIVO A MANO: sus cambios se pierden al regenerarlo.
 *
 * Para agregar un GIF: copie <id-del-ejercicio>.gif en assets/gifs/ y
 * corra \`npm run gifs\`.
 */
export const LOCAL_GIFS = {
${lineas}
};

/** Devuelve el require() del GIF local o null si no existe. */
export function getLocalGif(id) {
  if (!id) return null;
  return LOCAL_GIFS[id] || null;
}
`;

writeFileSync(SALIDA, contenido);

console.log(`Listo: ${encontrados.length} GIF(s) registrados en src/data/localGifs.js`);
if (desconocidos.length > 0) {
  console.log(`\nIgnorados (el nombre no coincide con ningún id del catálogo):`);
  for (const f of desconocidos) console.log(`  - ${f}`);
}
const faltantes = catalogo.filter((ex) => !encontrados.includes(ex.id));
console.log(`\nFaltan ${faltantes.length} de ${catalogo.length} ejercicios por tener GIF.`);
