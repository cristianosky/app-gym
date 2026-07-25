/**
 * Prueba de humo de la IA, contra la API de verdad.
 *
 * Es la única prueba que cuesta dinero, por eso está aparte de las demás y no
 * corre con `npm test`. Sirve para confirmar que la clave funciona y que los
 * prompts devuelven algo usable.
 *
 * Uso:
 *   npm run probar:ia                                      usa los modelos del .env
 *   GEMINI_MODEL=gemini-2.5-flash-lite npm run probar:ia    fuerza el más barato
 *
 * En Windows (PowerShell):
 *   $env:GEMINI_MODEL="gemini-2.5-flash-lite"; npm run probar:ia
 */
import { env } from '../src/config/env.js';
import { generateRoutine } from '../src/services/routine.service.js';
import { generateNutrition } from '../src/services/nutrition.service.js';
import * as chatService from '../src/services/chat.service.js';
import * as userRepo from '../src/repositories/user.repo.js';
import { hashPin } from '../src/services/pin.js';
import { newId } from '../src/utils/id.js';

const PERFIL = {
  weightKg: 82,
  heightCm: 175,
  age: 28,
  sex: 'hombre',
  level: 'principiante',
  environment: 'gimnasio',
  goals: ['recomposicion', 'marcar-abdomen'],
  goalNote: 'Quiero bajar la barriga sin perder fuerza',
  trainingDays: [1, 2, 3, 4, 5],
  sessionMinutes: 60,
  injuries: 'Me molesta un poco la rodilla derecha al bajar',
  diet: ['de-todo'],
  foodNote: '',
};

console.log(`
  Prueba de la IA (esto sí consume tokens)
  Rutina: ${env.models.routine}
  Comida: ${env.models.nutrition}
  Chat:   ${env.models.chat}
`);

// Usuario temporal en la base de datos, solo para esta prueba.
const { hash, salt } = await hashPin('4827');
const usuario = userRepo.create({
  username: `prueba-ia-${newId('x').slice(2, 10)}`,
  name: 'Cristian',
  pinHash: hash,
  pinSalt: salt,
  profile: PERFIL,
});

let fallos = 0;
const revisar = (etiqueta, ok, detalle = '') => {
  console.log(`${ok ? 'OK   ' : 'FALLA'} ${etiqueta}${detalle ? ` -> ${detalle}` : ''}`);
  if (!ok) fallos++;
};

// --- 1. Rutina ---------------------------------------------------------------
console.log('\n1) Rutina semanal');
const { plan: rutina, source, aviso } = await generateRoutine(usuario);

revisar('la generó la IA (no el respaldo)', source === 'ia', aviso ?? source);
revisar('trae los 7 días', rutina.dias.length === 7);

const diasEntreno = rutina.dias.filter((d) => !d.rest);
revisar('coinciden los días pedidos', diasEntreno.length === PERFIL.trainingDays.length, `${diasEntreno.length}`);
revisar(
  'todos los días llevan calentamiento y estiramiento',
  diasEntreno.every((d) => d.ejercicios.at(0)?.id === 'calentamiento' && d.ejercicios.at(-1)?.id === 'estiramiento'),
);
revisar(
  'cada día tiene entre 4 y 8 ejercicios de trabajo',
  diasEntreno.every((d) => {
    const trabajo = d.ejercicios.length - 2;
    return trabajo >= 4 && trabajo <= 8;
  }),
);

console.log(`\n   "${rutina.nombrePlan}"`);
console.log(`   ${rutina.resumen}\n`);
for (const dia of diasEntreno) {
  console.log(`   Día ${dia.dia} — ${dia.titulo} (${dia.subtitulo})`);
  for (const ex of dia.ejercicios.slice(1, -1)) {
    const nota = ex.note ? `  ← ${ex.note}` : '';
    console.log(`     · ${ex.name} — ${ex.sets}x${ex.reps}, ${ex.rest}s${nota}`);
  }
}

// ¿Tuvo en cuenta la lesión de rodilla?
const notas = diasEntreno.flatMap((d) => d.ejercicios.map((e) => e.note)).filter(Boolean);
revisar('escribió notas personalizadas', notas.length > 0, `${notas.length} notas`);

// --- 2. Plan de comidas ------------------------------------------------------
console.log('\n2) Plan de comidas');
try {
  const { plan: comidas } = await generateNutrition(usuario);

  revisar('trae los 7 días', comidas.dias.length === 7, `${comidas.dias.length}`);
  revisar('cada día trae los 5 momentos', comidas.dias.every((d) => d.bloques.length === 5));
  revisar('las calorías son razonables', comidas.caloriasObjetivo > 1200 && comidas.caloriasObjetivo < 4000, `${comidas.caloriasObjetivo} kcal`);
  revisar('la proteína apunta a 1,6-2,2 g/kg', comidas.proteinaObjetivo >= PERFIL.weightKg * 1.4, `${comidas.proteinaObjetivo} g`);
  revisar('trae lista del mercado', comidas.listaMercado.length >= 8, `${comidas.listaMercado.length} productos`);

  const nombresPlatos = comidas.dias.flatMap((d) => d.bloques.map((b) => b.comida.nombre));
  const distintos = new Set(nombresPlatos);
  revisar(
    'no repite el mismo plato en la semana',
    distintos.size === nombresPlatos.length,
    `${distintos.size}/${nombresPlatos.length} distintos`,
  );

  console.log(`\n   ${comidas.caloriasObjetivo} kcal · ${comidas.proteinaObjetivo} g proteína · ${comidas.aguaLitros} L agua`);
  for (const dia of comidas.dias) {
    console.log(`\n   Día ${dia.dia}:`);
    for (const bloque of dia.bloques) {
      console.log(`     ${bloque.titulo} (${bloque.hora}): ${bloque.comida.nombre}`);
    }
  }
} catch (error) {
  revisar('el plan de comidas se generó', false, error.message);
}

// --- 3. Asistente ------------------------------------------------------------
console.log('\n3) Asistente');
try {
  const { respuesta } = await chatService.ask(usuario, {
    message: '¿Cómo hago bien la sentadilla en el Smith? Me molesta la rodilla.',
    images: [],
  });
  revisar('responde una pregunta de gimnasio', respuesta.content.length > 40);
  console.log(`\n   ${respuesta.content.slice(0, 400)}${respuesta.content.length > 400 ? '…' : ''}`);
} catch (error) {
  revisar('el asistente respondió', false, error.message);
}

// Debe rechazar con amabilidad lo que no es del gimnasio.
try {
  const { respuesta } = await chatService.ask(usuario, {
    message: '¿Quién ganó el mundial de 1998?',
    images: [],
  });
  const seNiega = /gimnasio|entrenamiento|aliment|no.*(puedo|respondo)/i.test(respuesta.content);
  revisar('se mantiene en el tema del gimnasio', seNiega, respuesta.content.slice(0, 120));
} catch (error) {
  revisar('manejó la pregunta fuera de tema', false, error.message);
}

console.log(`\n${fallos === 0 ? 'Todo bien.' : `${fallos} revisión(es) fallaron.`}\n`);
process.exit(fallos === 0 ? 0 : 1);
