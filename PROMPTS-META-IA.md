# Prompts para generar los videos de ejercicios (Meta AI)

Lista única (sin repetir ejercicios que aparecen en varios días).
Cada video sirve para todos los días donde se use ese ejercicio.

Flujo de uso en la app:
1. Genera el video y guárdalo en `assets/videos/` con el nombre indicado.
2. Regístralo en `src/data/localVideos.js` con su clave.
3. Añade `localVideo: 'clave'` al ejercicio en `src/data/routine.js`.

---

## Cómo lograr que sea SIEMPRE la misma persona

Meta AI no fija el personaje solo con texto. Usa uno de estos métodos:

- **Imagen → video (recomendado):** genera UNA imagen del personaje con el bloque
  de abajo, y luego usa "Animar" sobre esa misma imagen para cada ejercicio.
- **"Imagine me":** sube tus selfies en la app de Meta AI y pide los ejercicios
  con tu propia cara.
- **Texto:** pega el bloque de personaje IDÉNTICO al inicio de cada prompt.

---

## BLOQUE DE PERSONAJE (pegar igual en cada prompt)

```
Un hombre latino de 27 años, 1.78 m, complexión atlética delgada, piel morena clara,
pelo negro corto, barba corta recortada, sin tatuajes. Lleva camiseta deportiva
negra ajustada, shorts grises y zapatillas blancas. Misma persona siempre.
Gimnasio moderno con luz cálida, fondo desenfocado. Video realista, vertical 9:16,
movimiento lento y controlado en bucle, sin texto ni logos.
Está haciendo:
```

Para crear la imagen base, cambia "Está haciendo:" por
"de pie en el gimnasio, retrato de cuerpo entero".

---

## Movimientos (uno por prompt, tras el bloque de personaje)

### Calentamiento y estiramiento (compartidos)
- `calentamiento` → `calentamiento.mp4`
  movilidad articular y trote suave para calentar.
- `estiramiento` → `estiramiento-final.mp4`
  estiramientos estáticos suaves de vuelta a la calma.

### Pecho + Tríceps
- `press-pecho` → `press-pecho-maquina.mp4`
  press de pecho en máquina sentado, empuja los agarres al frente y vuelve despacio.
- `press-inclinado` → `press-inclinado-mancuernas.mp4`
  press inclinado con mancuernas en banco a 45°, sube juntando las mancuernas.
- `aperturas-pecdeck` → `aperturas-pecdeck.mp4`
  aperturas en máquina Pec Deck, junta los brazos al frente apretando el pecho.
- `triceps-polea` → `triceps-extension-polea.mp4`
  extensión de tríceps en polea con barra, codos pegados, extiende hacia abajo.
- `triceps-patada` → `triceps-patada-mancuerna.mp4`
  patada de tríceps con mancuerna, torso inclinado, extiende el brazo hacia atrás.

### Espalda + Bíceps
- `jalon-pecho` → `jalon-al-pecho.mp4`
  jalón al pecho en polea alta, baja la barra al pecho con los codos atrás.
- `remo-maquina` → `remo-maquina-sentado.mp4`
  remo sentado en máquina, tira hacia el abdomen juntando las escápulas.
- `remo-mancuerna` → `remo-mancuerna-una-mano.mp4`
  remo con una mancuerna apoyando rodilla en banco, tira hacia la cadera.
- `pullover` → `pullover-polea.mp4`
  pullover en polea alta, brazos casi rectos, lleva la barra hacia los muslos en arco.
- `curl-barra` → `curl-biceps-barra.mp4`
  curl de bíceps con barra de pie, codos pegados, sube y baja controlando.
- `curl-martillo` → `curl-martillo-mancuernas.mp4`
  curl martillo con mancuernas, palmas enfrentadas, sube y baja.

### Pierna + Glúteo
- `prensa-pierna` → `prensa-pierna.mp4`
  prensa de pierna sentado, baja a 90° y empuja con los talones.
- `sentadilla-smith` → `sentadilla-smith.mp4`
  sentadilla en máquina Smith, baja con el pecho arriba hasta muslos paralelos.
- `extension-cuadriceps` → `extension-cuadriceps.mp4`
  extensión de cuádriceps en máquina, estira las piernas apretando el muslo.
- `curl-femoral` → `curl-femoral-tumbado.mp4`
  curl femoral tumbado boca abajo, lleva los talones a los glúteos.
- `hip-thrust` → `hip-thrust.mp4`
  hip thrust con la espalda en un banco y barra sobre la cadera, sube la cadera apretando glúteos.
- `pantorrilla` → `elevacion-pantorrilla.mp4`
  elevación de pantorrilla de pie, sube sobre las puntas y baja estirando.

### Hombro + Abdomen
- `press-hombro` → `press-hombro-mancuernas.mp4`  (ya existe en la app)
  press militar con mancuernas sentado, empuja arriba desde las orejas.
- `elevaciones-laterales` → `elevaciones-laterales.mp4`
  elevaciones laterales con mancuernas, sube los brazos a los lados hasta los hombros.
- `deltoides-posterior` → `deltoides-posterior-pajaros.mp4`
  pájaros para deltoides posterior en máquina invertida, abre los brazos atrás.
- `encogimientos` → `encogimientos-trapecio.mp4`
  encogimientos de trapecio con mancuernas, sube los hombros hacia las orejas.
- `plancha` → `plancha-abdominal.mp4`
  plancha abdominal sobre antebrazos, cuerpo en línea recta, isométrico.
- `crunch` → `crunch-maquina.mp4`
  crunch abdominal en máquina, enrolla el torso al frente apretando el abdomen.
- `elevacion-piernas` → `elevacion-piernas-colgado.mp4`
  elevación de piernas colgado de una barra, sube las rodillas al pecho.

### Full Body + HIIT
- `peso-muerto-rumano` → `peso-muerto-rumano-mancuernas.mp4`
  peso muerto rumano con mancuernas, lleva la cadera atrás bajando las mancuernas, espalda recta.
- `superserie-brazo` → `superserie-biceps-triceps.mp4`
  curl de bíceps con mancuernas seguido de extensión de tríceps en polea, sin pausa.
- `hiit-cinta` → `hiit-cinta.mp4`
  HIIT en cinta, alterna sprint fuerte y caminata suave, sudando.

### Cardio + Core
- `cardio-cinta` → `cardio-cinta.mp4`
  corriendo en cinta a ritmo moderado, postura erguida. (sirve para Día 1 y Día 4)
- `cardio-eliptica` → `cardio-eliptica.mp4`
  en elíptica usando brazos y piernas, ritmo constante.
- `cardio-continuo` → `cardio-continuo.mp4`
  cardio constante en bici de gimnasio, ritmo estable.
- `mountain-climbers` → `mountain-climbers.mp4`
  mountain climbers en plancha alta, rodillas al pecho alternando rápido.
- `bicicleta-abdominal` → `bicicleta-abdominal.mp4`
  crunch bicicleta tumbado, codo hacia la rodilla contraria alternando.

---

## Notas
- Un movimiento por prompt (no mezclar).
- Generar vertical 9:16 y clips cortos (4-6 s) para que el loop quede limpio.
- Si la cara cambia entre videos, animar siempre desde la misma imagen base.
