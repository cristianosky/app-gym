/**
 * Ilustraciones animadas de cada ejercicio.
 *
 * Todo es SVG vectorial dibujado en el dispositivo (react-native-svg), así que
 * funciona 100% offline en el gimnasio: no depende de GIFs externos ni de red.
 * Cada figura repite en bucle el gesto principal del movimiento para que
 * Cristian vea de un vistazo la técnica.
 *
 * Mejoras de la animación:
 *   - Atleta con torso con forma, articulaciones y sombra en el suelo.
 *   - Mancuernas y barras dibujadas (no simples círculos).
 *   - Brillo que pulsa sobre el músculo trabajado en cada contracción.
 *   - Flechas de movimiento que laten.
 *   - Ritmo de repetición natural con una pausa en la contracción.
 *
 * `kind` viene de routine.js (campo `illu`). Si no hay coincidencia, se usa
 * una figura genérica de "atleta".
 */

import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { G, Circle, Line, Rect, Path, Ellipse } from 'react-native-svg';
import { colors } from '../theme';

const AG = Animated.createAnimatedComponent(G);
const ACircle = Animated.createAnimatedComponent(Circle);

const SKIN = '#DCE3EE';   // cuerpo (claro, resalta sobre el fondo oscuro)
const METAL = '#9FB0C6';  // barras / mangos
const PLATE = '#475569';  // discos secundarios
const DARK = '#3A4A63';   // estructura de máquinas / suelo
const LW = 12;            // grosor de las extremidades

/**
 * Bucle de repetición con pausa en la contracción + un "pulso" continuo
 * independiente para brillos y flechas.
 */
function useReps({ duration = 1300, hold = 220, easing = Easing.inOut(Easing.cubic) } = {}) {
  const t = useRef(new Animated.Value(0)).current;       // 0 = inicio · 1 = contracción
  const pulse = useRef(new Animated.Value(0)).current;   // late para brillos/flechas
  useEffect(() => {
    const rep = Animated.loop(
      Animated.sequence([
        Animated.timing(t, { toValue: 1, duration, easing, useNativeDriver: false }),
        Animated.delay(hold),
        Animated.timing(t, { toValue: 0, duration, easing, useNativeDriver: false }),
        Animated.delay(hold),
      ]),
    );
    const beat = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 650, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 0, duration: 650, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
      ]),
    );
    rep.start();
    beat.start();
    return () => { rep.stop(); beat.stop(); };
  }, [t, pulse, duration, hold, easing]);
  return { t, pulse };
}

const lerp = (v, a, b) => v.interpolate({ inputRange: [0, 1], outputRange: [a, b] });

/* ----------------------------- primitivas ----------------------------- */

const Limb = (p) => <Line stroke={SKIN} strokeWidth={p.lw || LW} strokeLinecap="round" {...p} />;
const Joint = ({ cx, cy, r = 6 }) => <Circle cx={cx} cy={cy} r={r} fill={SKIN} />;

const Head = ({ cx, cy, r = 15, fill = SKIN }) => (
  <G>
    <Circle cx={cx} cy={cy} r={r} fill={fill} />
    <Circle cx={cx + r * 0.32} cy={cy - r * 0.22} r={r * 0.45} fill="#FFFFFF" opacity={0.14} />
  </G>
);

/** Torso con forma (hombros anchos, cintura estrecha) — vista frontal. */
const TorsoFront = ({ cx = 110, top = 64, bottom = 122, sh = 24, wa = 15 }) => (
  <Path
    d={`M ${cx - sh} ${top} Q ${cx} ${top - 5} ${cx + sh} ${top} L ${cx + wa} ${bottom} Q ${cx} ${bottom + 6} ${cx - wa} ${bottom} Z`}
    fill={SKIN}
  />
);

/** Suelo + sombra del atleta. */
const Ground = ({ cx = 110, y = 182, rx = 42 }) => (
  <G>
    <Ellipse cx={cx} cy={y} rx={rx} ry={6} fill="#000000" opacity={0.28} />
    <Line x1={24} y1={y + 2} x2={196} y2={y + 2} stroke={DARK} strokeWidth={4} strokeLinecap="round" />
  </G>
);

/** Brillo del músculo trabajado: se enciende en la contracción. */
const Glow = ({ t, cx, cy, r = 18, color, lo = false }) => (
  <ACircle
    cx={cx}
    cy={cy}
    r={r}
    fill={color}
    opacity={t.interpolate({ inputRange: [0, 1], outputRange: lo ? [0.42, 0] : [0, 0.42] })}
  />
);

/** Mancuerna (mango + dos discos del color del acento). */
const Dumbbell = ({ cx, cy, a = 0, accent, s = 1 }) => {
  const hw = 15 * s, pw = 8 * s, ph = 20 * s;
  return (
    <G rotation={a} originX={cx} originY={cy}>
      <Rect x={cx - hw} y={cy - 3} width={hw * 2} height={6} rx={3} fill={METAL} />
      <Rect x={cx - hw - pw / 2} y={cy - ph / 2} width={pw} height={ph} rx={3} fill={accent} />
      <Rect x={cx + hw - pw / 2} y={cy - ph / 2} width={pw} height={ph} rx={3} fill={accent} />
    </G>
  );
};

/** Barra olímpica con discos. */
const Barbell = ({ cx, cy, w = 96, accent, ph = 26 }) => {
  const h = w / 2, pw = 9;
  return (
    <G>
      <Rect x={cx - h} y={cy - 3} width={w} height={6} rx={3} fill={METAL} />
      <Rect x={cx - h - 2} y={cy - ph / 2} width={pw} height={ph} rx={3} fill={accent} />
      <Rect x={cx - h + pw} y={cy - ph / 2 + 3} width={7} height={ph - 6} rx={3} fill={PLATE} />
      <Rect x={cx + h - pw + 2} y={cy - ph / 2} width={pw} height={ph} rx={3} fill={accent} />
      <Rect x={cx + h - pw - 5} y={cy - ph / 2 + 3} width={7} height={ph - 6} rx={3} fill={PLATE} />
    </G>
  );
};

/** Estructura de máquina (respaldo, plataforma...). */
const Frame = (p) => <Rect rx={4} fill={DARK} {...p} />;

/** Flechas de movimiento que laten suavemente. */
const Arrows = ({ pulse, children }) => (
  <AG opacity={pulse.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.85] })}>{children}</AG>
);
const Arrow = ({ d, color }) => <Path d={d} stroke={color} strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" />;

/* ------------------------------- poses -------------------------------- */
/* Cada pose recibe (t, accent, pulse). */

function PoseCurl(t, a, pulse) {
  // Curl de bíceps (frontal): antebrazos suben hacia los hombros.
  return (
    <G>
      <Ground />
      <Glow t={t} cx={92} cy={92} r={15} color={a} />
      <Glow t={t} cx={128} cy={92} r={15} color={a} />
      <Limb x1={110} y1={118} x2={92} y2={172} />
      <Limb x1={110} y1={118} x2={128} y2={172} />
      <Joint cx={92} cy={172} r={7} />
      <Joint cx={128} cy={172} r={7} />
      <TorsoFront />
      <Head cx={110} cy={44} />
      <Limb x1={92} y1={70} x2={82} y2={108} />
      <Limb x1={128} y1={70} x2={138} y2={108} />
      <Joint cx={82} cy={108} />
      <Joint cx={138} cy={108} />
      <AG rotation={lerp(t, 0, -148)} originX={82} originY={108}>
        <Limb x1={82} y1={108} x2={82} y2={148} />
        <Dumbbell cx={82} cy={150} accent={a} s={0.8} />
      </AG>
      <AG rotation={lerp(t, 0, 148)} originX={138} originY={108}>
        <Limb x1={138} y1={108} x2={138} y2={148} />
        <Dumbbell cx={138} cy={150} accent={a} s={0.8} />
      </AG>
    </G>
  );
}

function PosePress(t, a, pulse) {
  // Press de pecho en máquina (lateral): empuje al frente.
  const dx = lerp(t, 0, 34);
  return (
    <G>
      <Ground cx={134} />
      <Frame x={150} y={66} width={12} height={78} />
      <Glow t={t} cx={118} cy={98} r={19} color={a} />
      <Head cx={122} cy={70} />
      <Limb x1={122} y1={84} x2={124} y2={132} />
      <Limb x1={124} y1={132} x2={152} y2={150} />
      <Limb x1={124} y1={132} x2={150} y2={172} />
      <AG x={dx}>
        <Limb x1={120} y1={94} x2={78} y2={100} />
        <Joint cx={78} cy={100} />
        <Frame x={66} y={78} width={9} height={46} fill={a} />
      </AG>
      <Arrows pulse={pulse}>
        <Arrow d="M64 60 h28 m-8 -7 l8 7 l-8 7" color={a} />
      </Arrows>
    </G>
  );
}

function PoseFly(t, a, pulse) {
  // Aperturas / pec deck (frontal): los brazos se juntan al frente.
  return (
    <G>
      <Ground />
      <Glow t={t} cx={110} cy={88} r={22} color={a} />
      <Limb x1={110} y1={120} x2={94} y2={172} />
      <Limb x1={110} y1={120} x2={126} y2={172} />
      <Joint cx={94} cy={172} r={7} />
      <Joint cx={126} cy={172} r={7} />
      <TorsoFront top={66} bottom={122} />
      <Head cx={110} cy={46} />
      <AG rotation={lerp(t, 0, 56)} originX={110} originY={74}>
        <Limb x1={110} y1={74} x2={64} y2={92} />
        <Dumbbell cx={62} cy={92} a={20} accent={a} s={0.7} />
      </AG>
      <AG rotation={lerp(t, 0, -56)} originX={110} originY={74}>
        <Limb x1={110} y1={74} x2={156} y2={92} />
        <Dumbbell cx={158} cy={92} a={-20} accent={a} s={0.7} />
      </AG>
    </G>
  );
}

function PosePushdown(t, a, pulse) {
  // Extensión de tríceps en polea (lateral): el antebrazo baja.
  return (
    <G>
      <Ground cx={120} />
      <Frame x={150} y={8} width={8} height={42} />
      <Glow t={t} cx={133} cy={96} r={14} color={a} />
      <Head cx={120} cy={56} />
      <Limb x1={120} y1={70} x2={120} y2={130} />
      <Limb x1={120} y1={130} x2={104} y2={172} />
      <Limb x1={120} y1={130} x2={132} y2={172} />
      <Limb x1={120} y1={80} x2={140} y2={108} />
      <Joint cx={140} cy={108} />
      <AG rotation={lerp(t, -72, 0)} originX={140} originY={108}>
        <Limb x1={140} y1={108} x2={140} y2={150} />
        <Frame x={128} y={148} width={24} height={8} fill={a} />
      </AG>
      <Arrows pulse={pulse}>
        <Arrow d="M165 100 v34 m-7 -8 l7 8 l7 -8" color={a} />
      </Arrows>
    </G>
  );
}

function PoseKickback(t, a, pulse) {
  // Patada de tríceps (lateral): el antebrazo se extiende atrás.
  return (
    <G>
      <Ground cx={140} />
      <Glow t={t} cx={120} cy={104} r={14} color={a} lo />
      <Head cx={70} cy={70} />
      <Limb x1={82} y1={78} x2={150} y2={96} />
      <Limb x1={150} y1={96} x2={150} y2={172} />
      <Limb x1={120} y1={88} x2={120} y2={120} />
      <Joint cx={120} cy={120} />
      <AG rotation={lerp(t, 72, 0)} originX={120} originY={120}>
        <Limb x1={120} y1={120} x2={150} y2={138} />
        <Dumbbell cx={152} cy={140} a={28} accent={a} s={0.7} />
      </AG>
    </G>
  );
}

function PosePulldown(t, a, pulse) {
  // Jalón al pecho (frontal): la barra baja al pecho.
  return (
    <G>
      <Ground />
      <Frame x={106} y={6} width={8} height={22} />
      <Glow t={t} cx={110} cy={112} r={22} color={a} />
      <Limb x1={110} y1={140} x2={94} y2={176} />
      <Limb x1={110} y1={140} x2={126} y2={176} />
      <Joint cx={94} cy={176} r={7} />
      <Joint cx={126} cy={176} r={7} />
      <TorsoFront top={86} bottom={140} sh={22} />
      <Head cx={110} cy={70} />
      <AG y={lerp(t, 0, 48)}>
        <Limb x1={110} y1={92} x2={74} y2={32} />
        <Limb x1={110} y1={92} x2={146} y2={32} />
        <Barbell cx={110} cy={30} w={104} accent={a} ph={22} />
      </AG>
      <Arrows pulse={pulse}>
        <Arrow d="M175 50 v40 m-7 -8 l7 8 l7 -8" color={a} />
      </Arrows>
    </G>
  );
}

function PoseRow(t, a, pulse) {
  // Remo sentado (lateral): el agarre se tira hacia el abdomen.
  const dx = lerp(t, 0, -34);
  return (
    <G>
      <Ground cx={120} />
      <Glow t={t} cx={106} cy={104} r={17} color={a} />
      <Head cx={96} cy={70} />
      <Limb x1={96} y1={84} x2={96} y2={130} />
      <Limb x1={96} y1={130} x2={150} y2={130} />
      <Limb x1={150} y1={130} x2={150} y2={168} />
      <Joint cx={150} cy={130} />
      <AG x={dx}>
        <Limb x1={98} y1={96} x2={150} y2={108} />
        <Joint cx={150} cy={108} />
        <Frame x={150} y={94} width={9} height={28} fill={a} />
      </AG>
      <Arrows pulse={pulse}>
        <Arrow d="M150 58 h-28 m8 -7 l-8 7 l8 7" color={a} />
      </Arrows>
    </G>
  );
}

function PoseLegpress(t, a, pulse) {
  // Prensa de pierna (lateral): las piernas empujan la plataforma.
  const dx = lerp(t, 0, 26);
  const dy = lerp(t, 0, -14);
  return (
    <G>
      <Ground cx={90} y={150} rx={36} />
      <Glow t={t} cx={124} cy={100} r={18} color={a} />
      <Head cx={56} cy={96} />
      <Limb x1={68} y1={100} x2={96} y2={108} />
      <Joint cx={96} cy={108} />
      <AG x={dx} y={dy}>
        <Limb x1={96} y1={108} x2={150} y2={92} />
        <Joint cx={150} cy={92} />
        <Limb x1={150} y1={92} x2={150} y2={140} />
        <Frame x={150} y={66} width={12} height={84} />
        <Rect x={158} y={70} width={6} height={76} rx={3} fill={a} />
      </AG>
      <Arrows pulse={pulse}>
        <Arrow d="M186 96 l16 4 l-16 4" color={a} />
      </Arrows>
    </G>
  );
}

function PoseSquat(t, a, pulse) {
  // Sentadilla (frontal): el cuerpo baja y sube con la barra.
  const dy = lerp(t, 0, 26);
  return (
    <G>
      <Ground />
      <Glow t={t} cx={97} cy={138} r={16} color={a} />
      <Glow t={t} cx={123} cy={138} r={16} color={a} />
      <AG y={dy}>
        <Barbell cx={110} cy={58} w={92} accent={a} />
        <Head cx={110} cy={46} />
        <TorsoFront top={64} bottom={112} sh={20} wa={14} />
        <Limb x1={90} y1={66} x2={132} y2={66} lw={10} />
      </AG>
      <AG rotation={lerp(t, 0, 18)} originX={110} originY={112}>
        <Limb x1={110} y1={112} x2={84} y2={150} />
      </AG>
      <AG rotation={lerp(t, 0, -18)} originX={110} originY={112}>
        <Limb x1={110} y1={112} x2={136} y2={150} />
      </AG>
      <Joint cx={84} cy={150} />
      <Joint cx={136} cy={150} />
      <Limb x1={84} y1={150} x2={84} y2={178} />
      <Limb x1={136} y1={150} x2={136} y2={178} />
    </G>
  );
}

function PoseLegext(t, a, pulse) {
  // Extensión de cuádriceps (lateral): la pantorrilla sube.
  return (
    <G>
      <Ground cx={110} />
      <Frame x={68} y={68} width={12} height={68} />
      <Glow t={t} cx={104} cy={104} r={15} color={a} />
      <Head cx={70} cy={60} />
      <Limb x1={82} y1={96} x2={120} y2={104} />
      <Joint cx={120} cy={104} />
      <AG rotation={lerp(t, 62, 0)} originX={120} originY={104}>
        <Limb x1={120} y1={104} x2={120} y2={150} />
        <Frame x={110} y={146} width={18} height={9} fill={a} />
      </AG>
      <Arrows pulse={pulse}>
        <Arrow d="M150 150 v-34 m-7 8 l7 -8 l7 8" color={a} />
      </Arrows>
    </G>
  );
}

function PoseLegcurl(t, a, pulse) {
  // Curl femoral tumbado (lateral): el talón sube al glúteo.
  return (
    <G>
      <Ground cx={110} y={150} rx={48} />
      <Glow t={t} cx={158} cy={120} r={14} color={a} />
      <Head cx={60} cy={120} />
      <Limb x1={72} y1={124} x2={140} y2={124} />
      <Limb x1={140} y1={124} x2={172} y2={124} />
      <Joint cx={172} cy={124} />
      <AG rotation={lerp(t, 0, -88)} originX={172} originY={124}>
        <Limb x1={172} y1={124} x2={172} y2={90} />
        <Frame x={162} y={84} width={18} height={9} fill={a} />
      </AG>
      <Arrows pulse={pulse}>
        <Arrow d="M196 120 v-26 m-6 7 l6 -7 l6 7" color={a} />
      </Arrows>
    </G>
  );
}

function PoseHipthrust(t, a, pulse) {
  // Empuje de cadera (lateral): la cadera sube apretando glúteo.
  const dy = lerp(t, 18, -8);
  return (
    <G>
      <Ground cx={140} />
      <Frame x={42} y={90} width={42} height={12} />
      <Glow t={t} cx={124} cy={116} r={16} color={a} />
      <Head cx={56} cy={82} />
      <AG y={dy}>
        <Limb x1={70} y1={100} x2={128} y2={112} />
        <Barbell cx={126} cy={104} w={40} accent={a} ph={20} />
      </AG>
      <Limb x1={128} y1={112} x2={150} y2={150} />
      <Limb x1={150} y1={150} x2={150} y2={178} />
      <Joint cx={150} cy={150} />
      <Arrows pulse={pulse}>
        <Arrow d="M170 118 v-26 m-6 7 l6 -7 l6 7" color={a} />
      </Arrows>
    </G>
  );
}

function PoseCalf(t, a, pulse) {
  // Elevación de pantorrilla (frontal): el cuerpo sube sobre las puntas.
  const dy = lerp(t, 0, -18);
  return (
    <G>
      <Ground />
      <Glow t={t} cx={97} cy={150} r={12} color={a} />
      <Glow t={t} cx={123} cy={150} r={12} color={a} />
      <AG y={dy}>
        <Head cx={110} cy={46} />
        <TorsoFront top={62} bottom={118} sh={20} />
        <Limb x1={92} y1={70} x2={80} y2={110} />
        <Limb x1={128} y1={70} x2={140} y2={110} />
        <Dumbbell cx={78} cy={114} a={90} accent={a} s={0.7} />
        <Dumbbell cx={142} cy={114} a={90} accent={a} s={0.7} />
        <Limb x1={110} y1={118} x2={96} y2={166} />
        <Limb x1={110} y1={118} x2={124} y2={166} />
      </AG>
      <Arrows pulse={pulse}>
        <Arrow d="M158 150 v-30 m-6 7 l6 -7 l6 7" color={a} />
      </Arrows>
    </G>
  );
}

function PoseShoulderpress(t, a, pulse) {
  // Press de hombro (frontal): mancuernas suben sobre la cabeza.
  return (
    <G>
      <Ground />
      <Glow t={t} cx={90} cy={80} r={14} color={a} />
      <Glow t={t} cx={130} cy={80} r={14} color={a} />
      <Limb x1={110} y1={126} x2={94} y2={176} />
      <Limb x1={110} y1={126} x2={126} y2={176} />
      <Joint cx={94} cy={176} r={7} />
      <Joint cx={126} cy={176} r={7} />
      <TorsoFront top={72} bottom={126} />
      <Head cx={110} cy={56} />
      <AG y={lerp(t, 0, -34)}>
        <Limb x1={110} y1={82} x2={78} y2={78} />
        <Limb x1={110} y1={82} x2={142} y2={78} />
        <Dumbbell cx={72} cy={76} accent={a} s={0.8} />
        <Dumbbell cx={148} cy={76} accent={a} s={0.8} />
      </AG>
      <Arrows pulse={pulse}>
        <Arrow d="M110 30 v-16 m-7 8 l7 -8 l7 8" color={a} />
      </Arrows>
    </G>
  );
}

function PoseLateralraise(t, a, pulse) {
  // Elevaciones laterales (frontal): los brazos suben a los lados.
  return (
    <G>
      <Ground />
      <Glow t={t} cx={90} cy={76} r={14} color={a} />
      <Glow t={t} cx={130} cy={76} r={14} color={a} />
      <Limb x1={110} y1={122} x2={94} y2={174} />
      <Limb x1={110} y1={122} x2={126} y2={174} />
      <Joint cx={94} cy={174} r={7} />
      <Joint cx={126} cy={174} r={7} />
      <TorsoFront top={62} bottom={122} />
      <Head cx={110} cy={44} />
      <AG rotation={lerp(t, 12, -74)} originX={110} originY={74}>
        <Limb x1={110} y1={74} x2={66} y2={96} />
        <Dumbbell cx={64} cy={96} a={28} accent={a} s={0.7} />
      </AG>
      <AG rotation={lerp(t, -12, 74)} originX={110} originY={74}>
        <Limb x1={110} y1={74} x2={154} y2={96} />
        <Dumbbell cx={156} cy={96} a={-28} accent={a} s={0.7} />
      </AG>
    </G>
  );
}

function PoseShrug(t, a, pulse) {
  // Encogimientos (frontal): los hombros suben hacia las orejas.
  return (
    <G>
      <Ground />
      <Glow t={t} cx={92} cy={68} r={13} color={a} />
      <Glow t={t} cx={128} cy={68} r={13} color={a} />
      <Limb x1={110} y1={120} x2={94} y2={174} />
      <Limb x1={110} y1={120} x2={126} y2={174} />
      <Joint cx={94} cy={174} r={7} />
      <Joint cx={126} cy={174} r={7} />
      <TorsoFront top={66} bottom={120} />
      <Head cx={110} cy={46} />
      <AG y={lerp(t, 0, -11)}>
        <Limb x1={86} y1={70} x2={82} y2={134} />
        <Limb x1={134} y1={70} x2={138} y2={134} />
        <Dumbbell cx={82} cy={140} accent={a} s={0.8} />
        <Dumbbell cx={138} cy={140} accent={a} s={0.8} />
      </AG>
      <Arrows pulse={pulse}>
        <Arrow d="M110 36 v-12 m-6 6 l6 -6 l6 6" color={a} />
      </Arrows>
    </G>
  );
}

function PosePlank(t, a, pulse) {
  // Plancha (lateral): cuerpo en línea con leve oscilación de control.
  const dy = lerp(t, 0, 3);
  return (
    <G>
      <Ground cx={120} y={172} rx={56} />
      <Glow t={t} cx={114} cy={128} r={16} color={a} />
      <AG y={dy}>
        <Head cx={60} cy={120} />
        <Limb x1={72} y1={124} x2={150} y2={140} />
        <Limb x1={150} y1={140} x2={172} y2={168} />
        <Joint cx={150} cy={140} />
        <Limb x1={72} y1={124} x2={72} y2={168} />
        <Joint cx={72} cy={168} />
      </AG>
    </G>
  );
}

function PoseCrunch(t, a, pulse) {
  // Crunch abdominal (lateral): el torso se enrolla hacia las rodillas.
  return (
    <G>
      <Ground cx={120} y={174} rx={50} />
      <Glow t={t} cx={132} cy={146} r={15} color={a} />
      <Limb x1={150} y1={150} x2={120} y2={120} />
      <Limb x1={120} y1={120} x2={120} y2={172} />
      <Joint cx={120} cy={120} />
      <AG rotation={lerp(t, 0, 34)} originX={150} originY={150}>
        <Limb x1={150} y1={150} x2={80} y2={150} />
        <Head cx={66} cy={150} />
      </AG>
    </G>
  );
}

function PoseLegraise(t, a, pulse) {
  // Elevación de piernas colgado (lateral): rodillas suben al pecho.
  return (
    <G>
      <Frame x={48} y={12} width={124} height={7} />
      <Glow t={t} cx={110} cy={118} r={15} color={a} />
      <Limb x1={110} y1={22} x2={110} y2={50} />
      <Head cx={110} cy={64} />
      <Limb x1={110} y1={80} x2={110} y2={124} />
      <Joint cx={110} cy={124} />
      <AG rotation={lerp(t, 0, -95)} originX={110} originY={124}>
        <Limb x1={110} y1={124} x2={110} y2={166} />
        <Joint cx={110} cy={166} r={7} />
      </AG>
      <Arrows pulse={pulse}>
        <Arrow d="M150 150 v-30 m-6 7 l6 -7 l6 7" color={a} />
      </Arrows>
    </G>
  );
}

function PoseHinge(t, a, pulse) {
  // Peso muerto rumano (lateral): la cadera va atrás y baja la carga.
  return (
    <G>
      <Ground cx={108} />
      <Glow t={t} cx={120} cy={120} r={16} color={a} />
      <Limb x1={110} y1={130} x2={104} y2={178} />
      <Limb x1={110} y1={130} x2={120} y2={178} />
      <Joint cx={110} cy={130} />
      <AG rotation={lerp(t, 0, 60)} originX={110} originY={130}>
        <Limb x1={110} y1={130} x2={110} y2={70} />
        <Head cx={110} cy={56} />
        <Limb x1={110} y1={84} x2={110} y2={128} />
        <Dumbbell cx={92} cy={130} accent={a} s={0.7} />
        <Dumbbell cx={128} cy={130} accent={a} s={0.7} />
      </AG>
    </G>
  );
}

function PoseRun(t) {
  // Cardio (lateral): figura corriendo, brazos y piernas alternan + rebote.
  const a = colors.cardio;
  const bob = t.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -7, 0] });
  return (
    <G>
      <Ground cx={112} />
      <AG y={bob}>
        <Head cx={110} cy={48} />
        <Limb x1={110} y1={64} x2={118} y2={116} />
        <AG rotation={lerp(t, -28, 28)} originX={114} originY={84}>
          <Limb x1={114} y1={84} x2={140} y2={108} />
          <Joint cx={140} cy={108} />
        </AG>
        <AG rotation={lerp(t, 28, -28)} originX={114} originY={84}>
          <Limb x1={114} y1={84} x2={88} y2={108} />
          <Joint cx={88} cy={108} />
        </AG>
        <AG rotation={lerp(t, -34, 30)} originX={118} originY={116}>
          <Limb x1={118} y1={116} x2={96} y2={168} />
        </AG>
        <AG rotation={lerp(t, 34, -30)} originX={118} originY={116}>
          <Limb x1={118} y1={116} x2={140} y2={168} />
        </AG>
      </AG>
      <Arrows pulse={t}>
        <Arrow d="M150 66 h22 m-8 -5 l8 5 l-8 5" color={a} />
        <Arrow d="M150 84 h16" color={a} />
        <Arrow d="M150 100 h26 m-8 -5 l8 5 l-8 5" color={a} />
      </Arrows>
    </G>
  );
}

function PoseWarmup(t, a) {
  // Calentamiento (frontal): círculos de brazos / movilidad.
  return (
    <G>
      <Ground />
      <Limb x1={110} y1={120} x2={94} y2={174} />
      <Limb x1={110} y1={120} x2={126} y2={174} />
      <Joint cx={94} cy={174} r={7} />
      <Joint cx={126} cy={174} r={7} />
      <TorsoFront top={62} bottom={120} />
      <Head cx={110} cy={44} />
      <AG rotation={lerp(t, -40, 220)} originX={110} originY={72}>
        <Limb x1={110} y1={72} x2={150} y2={72} />
        <Dumbbell cx={152} cy={72} accent={a} s={0.55} />
      </AG>
      <AG rotation={lerp(t, 140, -220)} originX={110} originY={72}>
        <Limb x1={110} y1={72} x2={70} y2={72} />
        <Dumbbell cx={68} cy={72} accent={a} s={0.55} />
      </AG>
    </G>
  );
}

function PoseStretch(t, a) {
  // Estiramiento (lateral): flexión suave hacia adelante.
  return (
    <G>
      <Ground cx={110} />
      <Limb x1={110} y1={130} x2={100} y2={178} />
      <Limb x1={110} y1={130} x2={120} y2={178} />
      <Joint cx={110} cy={130} />
      <AG rotation={lerp(t, 12, 64)} originX={110} originY={130}>
        <Limb x1={110} y1={130} x2={110} y2={70} />
        <Head cx={110} cy={56} />
        <Limb x1={110} y1={84} x2={122} y2={128} />
      </AG>
    </G>
  );
}

const POSES = {
  curl: PoseCurl,
  press: PosePress,
  inclinepress: PosePress,
  fly: PoseFly,
  pushdown: PosePushdown,
  kickback: PoseKickback,
  pulldown: PosePulldown,
  row: PoseRow,
  legpress: PoseLegpress,
  squat: PoseSquat,
  legext: PoseLegext,
  legcurl: PoseLegcurl,
  hipthrust: PoseHipthrust,
  calf: PoseCalf,
  shoulderpress: PoseShoulderpress,
  lateralraise: PoseLateralraise,
  shrug: PoseShrug,
  plank: PosePlank,
  crunch: PoseCrunch,
  legraise: PoseLegraise,
  hinge: PoseHinge,
  run: PoseRun,
  hiit: PoseRun,
  warmup: PoseWarmup,
  stretch: PoseStretch,
};

/**
 * Componente público.
 * @param {string} kind    clave de la ilustración
 * @param {string} accent  color de acento (del grupo muscular)
 * @param {number} size    alto/ancho del lienzo
 */
export default function ExerciseIllustration({ kind, accent = colors.primary, size = 150 }) {
  const cardio = kind === 'run' || kind === 'hiit';
  const { t, pulse } = useReps(
    cardio
      ? { duration: 520, hold: 0, easing: Easing.inOut(Easing.sin) }
      : kind === 'warmup'
      ? { duration: 1600, hold: 0, easing: Easing.inOut(Easing.sin) }
      : undefined,
  );
  const Pose = POSES[kind] || PoseWarmup;
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 220 200">
        {Pose(t, accent, pulse)}
      </Svg>
    </View>
  );
}
