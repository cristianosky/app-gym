# GIFs de ejercicios

Para que un ejercicio muestre su GIF como ejemplo (en la tarjeta y en el
detalle), suba el archivo aquí con el **nombre exacto** de la lista de abajo
y corra:

```bash
npm run gifs
```

Eso regenera `src/data/localGifs.js` con lo que encuentre en esta carpeta.
No hace falta tocar ningún catálogo ni componente — el nombre del archivo
es lo único que importa. Puede subir los GIFs de a poco, uno por uno, y
correr `npm run gifs` cada vez.

Formato: `.gif`, buscando idealmente clips cortos y en bucle (loop) de la
técnica correcta, vistos de frente o de tres cuartos.

## Lista de ejercicios (77)

### Pecho
- `press-pecho-maquina.gif` — Press de pecho en máquina
- `press-banca-barra.gif` — Press de banca con barra
- `press-inclinado-mancuernas.gif` — Press inclinado con mancuernas
- `mariposa-maquina.gif` — Mariposa en máquina (Pec Deck)
- `cruce-poleas.gif` — Cruce de poleas (crossover)
- `flexiones-pecho.gif` — Flexiones de pecho
- `press-declinado.gif` — Press declinado en máquina
- `press-pecho-mancuernas.gif` — Press de pecho con mancuernas en banca plana

### Espalda
- `jalon-al-pecho.gif` — Jalón al pecho en polea
- `remo-maquina.gif` — Remo sentado en máquina
- `remo-mancuerna-unilateral.gif` — Remo con mancuerna a un brazo
- `pullover-polea.gif` — Pullover en polea
- `remo-barra.gif` — Remo con barra
- `dominadas-asistidas.gif` — Dominadas en la máquina asistida
- `face-pull.gif` — Face pull en polea
- `jalon-cerrado.gif` — Jalón cerrado en polea
- `remo-bajo-polea.gif` — Remo bajo en polea
- `remo-hammer.gif` — Remo en máquina Hammer
- `remo-trx.gif` — Remo en TRX

### Pierna
- `prensa-pierna.gif` — Prensa de piernas (leg press)
- `sentadilla-smith.gif` — Sentadilla en Smith
- `sentadilla-libre.gif` — Sentadilla libre con barra
- `sentadilla-peso-corporal.gif` — Sentadilla sin peso
- `estocadas.gif` — Estocadas con mancuernas
- `extension-cuadriceps.gif` — Extensiones de cuádriceps
- `curl-femoral.gif` — Curl femoral acostado
- `peso-muerto-rumano.gif` — Peso muerto rumano con mancuernas
- `hip-thrust.gif` — Empuje de cadera (hip thrust)
- `puente-gluteo.gif` — Puente de glúteo en colchoneta
- `elevacion-talones.gif` — Elevación de talones (pantorrilla)
- `hack-squat.gif` — Sentadilla Hack (Hack Squat)
- `curl-femoral-sentado.gif` — Curl femoral sentado
- `maquina-aductores.gif` — Máquina de aductores
- `maquina-abductores.gif` — Máquina de abductores
- `patada-gluteo-maquina.gif` — Patada de glúteo en máquina
- `peso-muerto.gif` — Peso muerto convencional con barra
- `step-up.gif` — Step up (subida al banco)
- `salto-al-cajon.gif` — Salto al cajón (box jump)
- `patada-gluteo-banda.gif` — Patada de glúteo con banda
- `pull-through.gif` — Pull through en polea

### Hombro
- `press-militar-mancuernas.gif` — Press militar con mancuernas
- `elevaciones-laterales.gif` — Elevaciones laterales
- `vuelos-posteriores.gif` — Vuelos posteriores (deltoide posterior)
- `encogimientos-trapecio.gif` — Encogimientos de trapecio
- `press-hombro-maquina.gif` — Press de hombro en máquina
- `elevaciones-frontales.gif` — Elevaciones frontales

### Brazo
- `extension-triceps-polea.gif` — Extensión de tríceps en polea
- `patada-triceps.gif` — Patada de tríceps con mancuerna
- `fondos-banca.gif` — Fondos de tríceps en banca
- `extension-triceps-cabeza.gif` — Extensión de tríceps sobre la cabeza
- `fondos-asistidos-maquina.gif` — Fondos asistidos en máquina
- `curl-biceps-barra.gif` — Curl de bíceps con barra
- `curl-martillo.gif` — Curl martillo con mancuernas
- `curl-polea.gif` — Curl de bíceps en polea
- `curl-maquina.gif` — Curl de bíceps en máquina
- `curl-scott.gif` — Curl Scott (predicador)

### Core
- `plancha.gif` — Plancha abdominal
- `crunch-maquina.gif` — Abdominales en máquina
- `elevacion-piernas.gif` — Elevación de piernas en silla romana
- `crunch-bicicleta.gif` — Abdominales tipo bicicleta
- `mountain-climbers.gif` — Escaladores (mountain climbers)
- `plancha-lateral.gif` — Plancha lateral
- `banco-abdominal.gif` — Abdominales en banco
- `hiperextension-lumbar.gif` — Hiperextensión lumbar
- `slam-ball.gif` — Slam ball (balón contra el piso)

### Cardio (y bloques del servidor)
- `cardio-caminadora.gif` — Cardio en caminadora
- `ciclismo-eliptica.gif` — Elíptica o bicicleta estática
- `hiit-intervalos.gif` — HIIT por intervalos
- `caminata-inclinada.gif` — Caminata inclinada en la caminadora
- `bicicleta-estatica.gif` — Bicicleta estática
- `bicicleta-reclinada.gif` — Bicicleta reclinada
- `spinning.gif` — Bicicleta de spinning
- `escaladora.gif` — Escaladora (stepmill)
- `maquina-remo-cardio.gif` — Máquina de remo (rowing)
- `battle-rope-olas.gif` — Battle rope (cuerdas ondulantes)
- `calentamiento.gif` — Calentamiento (bloque que se añade al inicio de cada sesión)
- `estiramiento.gif` — Estiramiento final (bloque que se añade al final de cada sesión)

---

Esta lista sale del catálogo (`server/src/data/catalog/*.js`); si se agrega
un ejercicio nuevo ahí, agréguelo también aquí o simplemente corra
`npm run gifs` después de subir su GIF con el id correcto.
