# Mi Entrenamiento 💪

App **Android nativa** (React Native + Expo) que funciona como el entrenador
personal diario de Cristian. Objetivo: **recomposición corporal** (bajar grasa
y ganar músculo) entrenando 5–6 días por semana en Smart Fit.

Todo en español, diseño oscuro mobile-first con botones grandes para usar con
una mano en el gimnasio, y **funciona 100% offline** (las demostraciones de cada
ejercicio son ilustraciones SVG animadas dibujadas en el dispositivo, no GIFs de
internet). El progreso se guarda en el teléfono con AsyncStorage.

---

## ▶️ Cómo probarla en tu celular (lo más rápido)

1. Instala **Expo Go** desde la Play Store en tu Android.
2. En la computadora, dentro de la carpeta del proyecto:
   ```bash
   npm install
   npm start
   ```
3. Escanea el **código QR** que aparece en la terminal con la app Expo Go.
   La app se abre en tu teléfono. Cualquier cambio en el código se recarga solo.

> Tu PC y tu teléfono deben estar en la misma red Wi-Fi.

---

## 📦 Generar el APK instalable (para tenerla sin la PC)

Se usa **EAS Build** (servicio de Expo en la nube, no necesitas Android Studio):

```bash
npm install -g eas-cli
eas login                      # crea una cuenta gratis de Expo si no tienes
eas build -p android --profile preview
```

Al terminar te da un enlace para descargar el **.apk**; lo instalas directo en el
teléfono. (La primera vez EAS crea el `eas.json` automáticamente.)

---

## 🗂️ Estructura del proyecto

```
gym/
├── App.js                          # Shell: navegación por pestañas inferiores
├── index.js                        # Punto de entrada de Expo
├── app.json                        # Config de la app (nombre, icono, Android)
├── src/
│   ├── theme.js                    # Colores, espaciado, tipografía (design system)
│   ├── data/
│   │   └── routine.js              # ⭐ El plan completo de 7 días (editable)
│   ├── store/
│   │   └── WorkoutStore.js         # Estado global + persistencia (AsyncStorage)
│   ├── utils/
│   │   └── dates.js                # Fechas en español, semana, claves de día
│   ├── illustrations/
│   │   └── ExerciseIllustration.js # Demos animadas SVG por tipo de ejercicio
│   ├── components/
│   │   ├── ProgressBar.js
│   │   ├── ExerciseCard.js         # Tarjeta de ejercicio con check
│   │   ├── ExerciseDetailModal.js  # Detalle: cómo hacerlo, músculos, errores
│   │   └── SkipModal.js            # Confirmación de "Saltar día"
│   └── screens/
│       ├── TodayScreen.js          # Pantalla "Hoy"
│       ├── WeekScreen.js           # Vista semanal (los 7 días)
│       └── ProgressScreen.js       # Racha, cumplimiento, estadísticas
└── assets/                         # Iconos
```

---

## 🏋️ La rutina (recomposición · Smart Fit)

| Día | Enfoque | |
|-----|---------|--|
| Lunes | **Pecho + Tríceps** + cardio corto | 🫁 |
| Martes | **Espalda + Bíceps** + cardio corto | 🦅 |
| Miércoles | **Pierna + Glúteo** | 🦵 |
| Jueves | **Hombro + Abdomen** + cardio | 🏔️ |
| Viernes | **Full body / debilidades** + HIIT | ⚡ |
| Sábado | **Cardio + Core** (opcional) | 🔥 |
| Domingo | **Descanso** | 😴 |

Cada día incluye **calentamiento** al inicio y **estiramiento** al final.
Solo usa máquinas, poleas, mancuernas y barras típicas de Smart Fit.

### ✏️ ¿Quieres cambiar la rutina?
Todo el plan vive en **`src/data/routine.js`**. Puedes editar ejercicios, series,
repeticiones, descansos o textos sin tocar nada más. El campo `illu` elige qué
animación se muestra (las opciones están al final de
`src/illustrations/ExerciseIllustration.js`).

---

## ✨ Funciones

- **Pantalla "Hoy":** detecta automáticamente la rutina según el día de la semana,
  saludo personalizado, barra de progreso y check por ejercicio.
- **Demostración visual** animada de cada movimiento (SVG, offline).
- **Video de demostración de YouTube** en el detalle de cada ejercicio: muestra
  la miniatura y, al tocarla, reproduce un tutorial real incrustado (con botón
  para abrirlo en la app de YouTube). Los ~30 videos fueron verificados como
  incrustables. *(Requiere internet solo para el video; el resto funciona offline.)*
- **Detalle de ejercicio:** pasos de ejecución, músculos trabajados y errores
  comunes (toca cualquier tarjeta).
- **Saltar día:** con confirmación y dos opciones — *mover* la rutina al día
  siguiente (recorre el plan) o *solo saltar*.
- **Vista semanal:** el plan de los 7 días, desplegable, con el día de hoy
  resaltado y el estado de cada jornada.
- **Progreso:** racha de días entrenados, cumplimiento semanal (%), completados
  vs. saltados y mapa visual de la semana.
- **Memoria persistente:** recuerda tu progreso aunque cierres la app.

---

## 🛠️ Stack

- React Native `0.85` + **Expo SDK 56**
- `react-native-svg` — ilustraciones animadas
- `react-native-youtube-iframe` + `react-native-webview` — videos de demostración
- `@react-native-async-storage/async-storage` — persistencia local
- Sin librería de navegación externa (pestañas propias, app más ligera)
"# app-gym" 
