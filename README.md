# Mi Entrenamiento

App de gimnasio en español colombiano, pensada para quien entrena en Smart Fit.
La rutina y el plan de comidas los arma **Gemini** a la medida de cada persona.

- **App**: React Native con Expo (Android, iOS y web)
- **Servidor**: Node + Express + SQLite
- **IA**: API de Gemini (Google) — modelo por defecto `gemini-flash-latest`

---

## Qué hace

| Pestaña | Qué encuentra |
|---|---|
| **Hoy** | La sesión del día con sus ejercicios, series y repeticiones. Cada ejercicio abre una ficha con **Ver ejemplo** (video), cómo se hace, músculos, errores comunes y una nota de cómo hacerlo en Smart Fit. |
| **Semana** | Los 7 días del plan de un vistazo, desplegables. |
| **Comida** | Desayuno, media mañana, almuerzo, onces y comida, con 2 opciones cada uno, calorías, proteína y lista del mercado. |
| **Asistente** | Chat con Gemini sobre gimnasio y alimentación. Acepta fotos (una máquina, su postura, un plato, una etiqueta). |
| **Progreso** | Racha, cumplimiento semanal, y desde aquí regenera la rutina o cierra sesión. |

### Registro e ingreso

Registro en 7 pasos cortos: nombre y usuario → peso, estatura, edad y sexo →
nivel y dónde entrena → objetivos → días y duración → alimentación → PIN.
Para entrar: usuario, *Continuar*, y el PIN de 4 dígitos.

### Objetivos disponibles

Se pueden combinar hasta 3 (el primero manda) y además hay un campo libre para
escribirlo con sus palabras:

bajar de peso · ganar masa muscular · bajar grasa y ganar músculo ·
ganar fuerza · marcar el abdomen · glúteos y piernas ·
pecho, brazos y hombros · mejorar la condición física ·
salud y coger el hábito · postura y espalda

---

## Cómo se arranca

Hacen falta **dos procesos**: el servidor y la app.

### 1. Servidor

```bash
cd server
npm install
copy .env.example .env      # en Mac/Linux: cp .env.example .env
```

Abra `server/.env` y ponga:

```bash
# Su clave de https://aistudio.google.com/apikey
GEMINI_API_KEY=AIzaSy...

# Secreto para firmar las sesiones. Genérelo con:
#   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
JWT_SECRET=...
```

> El repositorio ya trae un `server/.env` con un `JWT_SECRET` generado.
> Ponga ahí su `GEMINI_API_KEY`: sin una clave válida el servidor funciona,
> pero entrega la rutina de respaldo, y el asistente y el plan de comidas no
> responden.

```bash
npm run dev     # o: npm start
```

Al arrancar imprime la IP de la red local. Esa es la que usa el celular:

```
  Local:  http://localhost:4000
  Red:    http://192.168.1.7:4000   ← use esta en la app del celular
```

### 2. App

En otra terminal, desde la raíz del proyecto:

```bash
npm install
npm start
```

Escanee el código QR con Expo Go. **La app encuentra el servidor sola**: usa la
misma IP en la que Expo está sirviendo el bundle. Solo tienen que estar en la
misma red wifi.

Para apuntar a un servidor ya publicado, póngalo en `app.json`:

```json
"extra": { "apiUrl": "https://mi-servidor.com" }
```

---

## Cómo está armado

```
app-gym/
├─ App.js                    Pestañas + puerta de sesión
├─ src/
│  ├─ config.js              Detecta la URL del servidor
│  ├─ api/                   Cliente HTTP y endpoints
│  ├─ store/
│  │  ├─ AuthStore.js        Sesión (token guardado en el celular)
│  │  └─ PlanStore.js        Rutina, comidas y progreso
│  ├─ screens/
│  │  ├─ auth/               Bienvenida, ingreso y registro por pasos
│  │  ├─ TodayScreen.js      Hoy
│  │  ├─ WeekScreen.js       Semana
│  │  ├─ FoodScreen.js       Comida
│  │  ├─ CoachScreen.js      Asistente
│  │  └─ ProgressScreen.js   Progreso + cuenta
│  ├─ components/            Botones, PinPad, tarjetas, chat, video…
│  ├─ illustrations/         Animaciones SVG de respaldo
│  └─ theme.js               Colores, tipografía, espaciado
└─ server/
   └─ src/
      ├─ app.js              Express y rutas
      ├─ ai/                 Prompts, esquemas y cliente de Gemini
      ├─ data/
      │  ├─ catalog.js       Catálogo de ejercicios (fuente de verdad)
      │  ├─ catalog/         Ejercicios por grupo muscular
      │  └─ options.js       Objetivos, niveles, dietas…
      ├─ services/           Rutina, comidas, chat, PIN, métricas
      ├─ repositories/       Acceso a SQLite
      ├─ routes/             Endpoints HTTP
      └─ validation/         Esquemas de entrada y de salida de la IA
```

### La decisión de diseño clave: catálogo cerrado

**La IA no inventa ejercicios.** El servidor le pasa un catálogo con los
ejercicios ya revisados (`server/src/data/catalog/`) y Gemini solo escoge
identificadores y decide series, repeticiones, descanso y el orden.

Por qué importa:

- **"Ver ejemplo" nunca queda roto**: cada ejercicio ya tiene su video o su
  animación asociada.
- **Nada de datos inventados**: los nombres, la técnica y los errores comunes
  están escritos y revisados, no generados.
- **Rápido y barato**: la respuesta de la IA es pequeña porque solo trae
  referencias, y el servidor le pega la ficha completa después.

Para agregar un ejercicio, edítelo en `server/src/data/catalog/` y queda
disponible de inmediato, sin publicar una versión nueva de la app.

### Si la IA falla

La rutina tiene **respaldo**: si la API de Gemini no responde, el servidor arma
un plan con plantillas propias (`server/src/services/fallback-routine.js`) según
los días que entrena, su nivel y su objetivo. La app avisa que es la versión base
y ofrece el botón para regenerarla.

El plan de comidas **no** tiene respaldo automático, a propósito: inventarle
comidas a alguien sin criterio nutricional sería peor que pedirle que lo intente
más tarde.

---

## Seguridad

- El PIN se guarda con **scrypt** y sal única. Nunca en texto plano.
- Un PIN de 4 dígitos son solo 10.000 combinaciones, así que hay **bloqueo
  escalonado** por intentos fallidos (1, 5, 15 y 60 minutos) además del límite
  por IP.
- Se rechazan los PIN obvios (1234, 0000, años…).
- Las sesiones son JWT firmados, guardados en el dispositivo. El PIN no se
  guarda nunca.
- Las **fotos del chat no se almacenan**: se le mandan a Gemini en el momento y
  en el historial solo queda la marca de que ese mensaje traía imagen.
- Límites de peticiones separados para ingreso, registro, generación de planes
  (que cuesta dinero) y chat.
- `server/.env` y `server/data/` están en `.gitignore`.

---

## Endpoints

| Método | Ruta | Qué hace |
|---|---|---|
| `GET` | `/health` | Estado del servidor |
| `GET` | `/api/options` | Objetivos, niveles, dietas y días (para el registro) |
| `GET` | `/api/options/exercises` | Catálogo completo de ejercicios |
| `POST` | `/api/auth/register` | Crea la cuenta y genera la primera rutina |
| `POST` | `/api/auth/check-username` | ¿Existe este usuario? (paso 1 del ingreso) |
| `POST` | `/api/auth/login` | Usuario + PIN → token |
| `GET` | `/api/me` | Perfil actual |
| `PATCH` | `/api/me/profile` | Actualiza peso, objetivos, días… |
| `POST` | `/api/me/pin` | Cambia el PIN |
| `GET` `POST` | `/api/routine` · `/api/routine/generate` | Rutina vigente / generar una nueva |
| `GET` `POST` | `/api/nutrition` · `/api/nutrition/generate` | Plan de comidas |
| `GET` `POST` `DELETE` | `/api/chat` | Historial / preguntar / borrar |
| `GET` `PUT` `DELETE` | `/api/progress` | Sincronizar el progreso |

Todas las rutas menos `/health`, `/api/options` y `/api/auth/*` piden
`Authorization: Bearer <token>`.

---

## Notas

- El servidor usa el módulo `node:sqlite` incluido en Node (hace falta **Node
  22.5 o superior**), para no depender de módulos nativos que haya que compilar.
  Node imprime un aviso de "experimental" al arrancar: es normal.
- La base de datos es un archivo en `server/data/app.db`. Para empezar de cero,
  bórrelo y reinicie el servidor.
- Los videos de los ejercicios son de YouTube y se cargan solo al tocar
  **Ver ejemplo**, para no gastar datos. Los ejercicios sin video muestran la
  animación y ofrecen buscarlo en YouTube.
- Para incluir videos propios que funcionen sin internet, vea las instrucciones
  en `src/data/localVideos.js`.
