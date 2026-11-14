// "Hand and Feet": timeline of the Maradona short, timed to voice/words.json (frame = word onset x 30).
// Camera grammar from the skill: cuts on big jumps, smootherstep glides, every hold creeps, flip kicks on impacts.
export const FPS = 30;
export const TOTAL = 1830;
export type V3 = [number, number, number];
export type Light = "day" | "golden";
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * u * (u * (u * 6 - 15) + 10); };
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const lerp3 = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

/** places: stadium at the origin (pitch 105 x 68, England's goal at x = +52.5), barrio and the bedroom far away */
export const BX = 3000; // Villa Fiorito street (road along z at x = BX)
export const RM: V3 = [3000, 0, 400]; // bedroom
export const GX = 52.5; // goal line

export type ShotDef = { id: number; a: number; b: number; light: Light; place: "stadium" | "barrio" | "room" };
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 194, light: "day", place: "stadium" },        // hook: Diego on the pitch
  { id: 2, a: 194, b: 310, light: "golden", place: "barrio" },    // dirt roads of Villa Fiorito
  { id: 3, a: 310, b: 368, light: "day", place: "room" },      // slept hugging his first football
  { id: 4, a: 368, b: 592, light: "day", place: "stadium" },      // captain, 114,000 people
  { id: 5, a: 592, b: 768, light: "day", place: "stadium" },      // ball floats up, keeper 20 cm taller
  { id: 6, a: 768, b: 874, light: "day", place: "stadium" },      // jumps, punches it in
  { id: 7, a: 874, b: 956, light: "day", place: "stadium" },      // referee didn't see a thing
  { id: 8, a: 956, b: 1046, light: "day", place: "stadium" },     // about to use his feet
  { id: 9, a: 1046, b: 1158, light: "day", place: "stadium" },    // picks up the ball in his own half
  { id: 10, a: 1158, b: 1296, light: "day", place: "stadium" },   // one, two, three, four, keeper
  { id: 11, a: 1296, b: 1422, light: "day", place: "stadium" },// 1.65 m, weight low
  { id: 12, a: 1422, b: 1618, light: "day", place: "room" }, // waiters and plate stacks
  { id: 13, a: 1618, b: 1686, light: "day", place: "stadium" },   // won the whole World Cup
  { id: 14, a: 1686, b: TOTAL, light: "day", place: "stadium" },  // hand / feet
];
export const XFADE: Record<number, number> = { 2: 8, 3: 8, 4: 8, 11: 8, 12: 8, 13: 6, 14: 8 };
export const FLASH_AT = 192;

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};

// ---------------- action beats (frames) ----------------
export const W = {
  dirtiest: 67, beautiful: 107, slept: 313, captain: 421, hundred: 511, floats: 658, taller: 756, jumps: 783, punch: 810, hand: 866,
  referee: 916, feet: 1037, starts: 1138, one: 1168, two: 1186, three: 1193, four: 1203, keeper: 1226, net: 1262,
  low: 1396, tall: 1471, short: 1552, whip: 1576, win: 1650, hand2: 1769, feet2: 1813,
};
export const RS: V3 = [3000, 0, 800]; // the restaurant (waiters)

// ---------------- shared motion ----------------
/** the solo run (shots 9-10): Diego's x along the pitch, from his own half to the box */
export const runX = (f: number) => Math.min(46.6, lerp(-8, 49, smooth((f - 1095) / 165) * 0.15 + clamp01((f - 1095) / 165) * 0.85));
/** defenders he passes (frame he passes them, their spot) */
const rawX = (f: number) => lerp(-8, 49, smooth((f - 1095) / 165) * 0.15 + clamp01((f - 1095) / 165) * 0.85);
export const BEATEN: { f: number; x: number; z: number }[] = [
  { f: W.one, x: rawX(W.one) + 1.2, z: -1.3 }, { f: W.two, x: rawX(W.two) + 1.2, z: 1.3 },
  { f: W.three, x: rawX(W.three) + 1.2, z: -1.4 }, { f: W.four, x: rawX(W.four) + 1.2, z: 1.2 },
];
/** the lobbed ball of shots 5-6 (kicked at 645, punched at W.punch) */
export const lobAt = (f: number): V3 => {
  const u = clamp01((f - 645) / (W.punch - 645));
  return [lerp(45.2, 50.3, u), 0.3 + 33.39 * u - 31.24 * u * u, lerp(-1.2, 0.5, u)];
};
/** kid Diego's z on the dirt road (runs toward the lens) */
export const kidZ = (f: number) => 11 - (f - 194) * 0.075;
/** waiters: the tall stack creeps, the short stack whips round its table */
export const tallX = (f: number) => RS[0] - 3.6 + (f - 1422) * 0.011;
export const shortAt = (f: number): V3 => {
  const u = smooth((f - (W.whip - 6)) / 30), a = Math.PI * 0.5 + u * Math.PI * 2;
  return [RS[0] + 2.6 + Math.cos(a) * 1.25, 0, RS[2] + 0.2 + Math.sin(a) * 1.25];
};

// ---------------- cameras ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
/** e = how the camera ARRIVES at this key: "s" smootherstep glide, "o" ease-out burst (whip), "cut" hard cut */
type Key = { f: number; pos: V3; look: V3; fov?: number; roll?: number; e?: "s" | "o" | "cut" };
const outE = (x: number) => { const u = clamp01(x); return 1 - (1 - u) ** 3.2; };
/** keys -> camera, then a creeping push-in toward the look point that restarts at every key (no static holds) */
const path = (keys: Key[], f: number, creep = 0.0016): Cam => {
  let i = 0;
  while (i < keys.length - 1 && f >= keys[i + 1].f) i++;
  const a = keys[i], b = keys[Math.min(i + 1, keys.length - 1)];
  let u = 0;
  if (a !== b && b.e !== "cut") u = b.e === "o" ? outE((f - a.f) / (b.f - a.f)) : smooth((f - a.f) / (b.f - a.f));
  const pos = lerp3(a.pos, b.pos, u), look = lerp3(a.look, b.look, u);
  const k = 1 - Math.min(0.22, creep * Math.max(0, f - a.f) * (a === b || b.e === "cut" ? 1 : 1 - u * 0.5));
  const p: V3 = [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k];
  return { pos: p, look, fov: lerp(a.fov ?? 40, b.fov ?? 40, u), roll: lerp(a.roll ?? 0, b.roll ?? 0, u) };
};
/** impact kicks: sign flips every frame, decays over 7 f */
const KICKS = [W.punch, W.net, W.one, W.two, W.three, W.four, W.keeper, W.feet, W.feet2, W.whip + 8, W.win, 148];
const kick = (f: number) => {
  for (const k of KICKS) { const d = f - k; if (d >= 0 && d < 7) return (d % 2 ? -1 : 1) * 0.07 * (1 - d / 7); }
  return 0;
};

export const camAt = (id: number, f: number): Cam => {
  let c: Cam;
  switch (id) {
    case 1: c = path([
      { f: 0, pos: [35.1, 0.22, 2.5], look: [35.75, 0.2, 0.9], fov: 40, roll: -0.05 },          // the ball under his boot
      { f: 6, pos: [35.1, 0.22, 2.5], look: [35.75, 0.2, 0.9], fov: 40, roll: -0.05 },
      { f: 40, pos: [34.9, 1.2, 3.3], look: [36, 1.36, 0.6], fov: 36, roll: 0.06 },               // crane up to the face
      { f: 60, pos: [34.95, 1.2, 3.2], look: [36, 1.36, 0.6], fov: 36, roll: 0.06 },
      { f: 70, pos: [35.75, 1.2, 2.7], look: [36.2, 1.42, 0.6], fov: 36, roll: -0.07, e: "o" },   // the hand
      { f: 100, pos: [35.77, 1.2, 2.6], look: [36.2, 1.42, 0.6], fov: 36, roll: -0.07 },
      { f: 110, pos: [35.2, 0.25, 2.7], look: [36, 0.3, 0.7], fov: 40, roll: 0.07, e: "o" },       // the feet
      { f: 142, pos: [35.3, 0.25, 2.6], look: [36, 0.3, 0.7], fov: 40, roll: 0.07 },
      { f: 158, pos: [34.5, 0.35, 3.9], look: [36.0, 1.55, 0.4], fov: 52, roll: 0.09, e: "o" },     // hero wide, the bowl towering
    ], f); break;
    case 2: { const z = kidZ(f); c = path([
      { f: 194, pos: [BX + 2.2, 7.5, z - 20], look: [BX, 2.0, z - 2], fov: 44, roll: -0.03 },     // over the tin roofs
      { f: 236, pos: [BX + 1.3, 0.85, z - 4.6], look: [BX - 0.1, 0.9, z], fov: 40, roll: -0.06 },  // down to the kid, tracking back
      { f: 280, pos: [BX + 1.0, 0.8, z - 4.2], look: [BX - 0.1, 0.85, z], fov: 40, roll: -0.05 },
      { f: 310, pos: [BX + 0.4, 0.6, z - 2.6], look: [BX - 0.1, 0.8, z], fov: 38, roll: 0.03 },
    ], f, 0); break; }
    case 3: c = path([
      { f: 300, pos: [RM[0] + 1.9, 2.0, RM[2] + 3.1], look: [RM[0] + 0.9, 1.5, RM[2] - 1.4], fov: 46, roll: 0.02 }, // the moonlit window
      { f: 316, pos: [RM[0] + 1.9, 2.0, RM[2] + 3.1], look: [RM[0] + 0.9, 1.5, RM[2] - 1.4], fov: 46, roll: 0.02 },
      { f: 346, pos: [RM[0] + 0.5, 1.7, RM[2] + 3.1], look: [RM[0] - 0.1, 0.8, RM[2] - 0.5], fov: 50, roll: 0.06 }, // glide to the bed
      { f: 368, pos: [RM[0] + 0.3, 1.6, RM[2] + 2.8], look: [RM[0] - 0.1, 0.78, RM[2] - 0.5], fov: 48, roll: 0.07 },
    ], f, 0.003); break;
    case 4: c = path([
      { f: 364, pos: [-42, 78, 82], look: [0, 0, 0], fov: 46, roll: 0 },                          // high over the bowl
      { f: 426, pos: [-3.1, 1.5, 4.4], look: [-1.3, 1.3, 0.6], fov: 38, roll: -0.04 },             // dive to the captain
      { f: 444, pos: [-3.0, 1.5, 4.3], look: [-1.3, 1.3, 0.6], fov: 38, roll: -0.04 },
      { f: 496, pos: [5.6, 1.45, 4.6], look: [4.6, 1.3, -1.0], fov: 38, roll: 0.04 },              // track along the English line
      { f: 506, pos: [5.7, 1.45, 4.6], look: [4.7, 1.3, -1.0], fov: 38, roll: 0.04 },
      { f: 520, pos: [1.0, 0.9, 10], look: [0.5, 9, -30], fov: 54, roll: -0.05, e: "o" },         // whip up to 114,000 people
      { f: 592, pos: [0.4, 2.2, 13], look: [0.5, 12, -30], fov: 54, roll: -0.02 },
    ], f, 0); break;
    case 5: { const b = lobAt(f); c = path([
      { f: 592, pos: [42.2, 0.5, 3.4], look: [45.6, 0.8, -1.4], fov: 42, roll: 0.05 },             // low behind the miskick
      { f: 646, pos: [42.6, 0.5, 3.0], look: [45.6, 0.8, -1.4], fov: 42, roll: 0.05 },
      { f: 660, pos: [44.6, 0.55, 4.6], look: b, fov: 24, roll: 0.09, e: "o" },                    // tilt up with the ball
      { f: 716, pos: [45.6, 0.6, 4.8], look: b, fov: 19, roll: 0.05 },
      { f: 732, pos: [47.3, 1.25, 5.6], look: [49.5, 1.5, 0.2], fov: 36, roll: -0.04, e: "o" },    // the two of them waiting under it
      { f: 748, pos: [47.4, 1.25, 5.5], look: [49.5, 1.5, 0.2], fov: 36, roll: -0.04 },
      { f: 757, pos: [48.7, 1.8, 3.4], look: [50.4, 1.92, -0.4], fov: 30, roll: 0.05, e: "o" },    // the keeper, smug
    ], f); break; }
    case 6: c = path([
      { f: 768, pos: [47.5, 0.32, 3.7], look: [50.4, 2.3, 0], fov: 48, roll: -0.08 },              // worm's eye: both leap
      { f: 804, pos: [47.9, 0.36, 3.4], look: [50.4, 2.5, 0], fov: 46, roll: -0.09 },
      { f: 810, pos: [48.5, 1.5, 3.5], look: [50.35, 2.5, 0.45], fov: 42, roll: 0.06, e: "o" },    // the fist on the ball
      { f: 824, pos: [48.6, 1.5, 3.3], look: [50.35, 2.5, 0.45], fov: 42, roll: 0.06 },
      { f: 834, pos: [49.4, 0.9, 4.4], look: [53.4, 1.0, 0.1], fov: 44, roll: -0.06, e: "o" },     // follow it into the net
      { f: 846, pos: [49.5, 0.9, 4.3], look: [53.4, 1.0, 0.1], fov: 44, roll: -0.06 },
      { f: 846, pos: [46.5, 1.3, 4.2], look: [47.7, 1.3, 1.2], fov: 32, roll: 0.05, e: "cut" },    // the sneaky look
      { f: 862, pos: [46.6, 1.3, 4.0], look: [47.7, 1.3, 1.2], fov: 32, roll: 0.05 },
      { f: 869, pos: [47.2, 1.2, 3.2], look: [47.92, 1.42, 1.2], fov: 34, roll: -0.06, e: "o" },    // the left hand
    ], f); break;
    case 7: c = path([
      { f: 874, pos: [44.4, 1.5, 7.4], look: [48.6, 1.3, -0.4], fov: 40, roll: -0.05 },            // England protests
      { f: 898, pos: [44.4, 1.5, 7.3], look: [48.6, 1.3, -0.4], fov: 40, roll: -0.05 },
      { f: 909, pos: [42.6, 1.5, 6.4], look: [39.6, 1.35, 2.0], fov: 36, roll: 0.05, e: "o" },     // whip to the referee
      { f: 956, pos: [41.9, 1.45, 5.4], look: [39.6, 1.35, 2.0], fov: 34, roll: 0.06 },
    ], f, 0.001); break;
    case 8: c = path([
      { f: 956, pos: [-0.9, 1.3, 3.1], look: [0.45, 1.34, 0], fov: 32, roll: 0.04 },               // his face
      { f: 1002, pos: [-0.8, 1.3, 2.9], look: [0.45, 1.34, 0], fov: 32, roll: 0.04 },
      { f: 1030, pos: [-0.5, 0.3, 2.3], look: [0.42, 0.24, 0.15], fov: 40, roll: 0.08 },           // crane down to the boots
      { f: 1046, pos: [-0.45, 0.3, 2.2], look: [0.42, 0.24, 0.15], fov: 40, roll: 0.08 },
    ], f, 0.001); break;
    case 9: { const x = runX(f); c = path([
      { f: 1046, pos: [-13, 10, 13], look: [-8, 0.5, 0], fov: 40, roll: 0 },                       // high over his own half
      { f: 1078, pos: [-10.2, 1.3, 5.2], look: [-8, 1.0, 0], fov: 40, roll: -0.05 },               // down for the turn
      { f: 1096, pos: [-10.0, 1.3, 5.0], look: [-8, 1.0, 0], fov: 40, roll: -0.05 },
      { f: 1125, pos: [x - 3.2, 1.2, 6.2], look: [x + 0.8, 1.0, 0], fov: 42, roll: 0.03 },         // and he's off
      { f: 1158, pos: [x + 1.2, 1.1, 5.6], look: [x + 0.5, 1.0, 0], fov: 42, roll: 0.05 },
    ], f, 0); break; }
    case 10: { const x = runX(f); c = path([
      { f: 1158, pos: [x + 1.2, 1.1, 5.6], look: [x + 0.5, 1.0, 0], fov: 42, roll: 0.05 },
      { f: 1206, pos: [x + 5.4, 0.8, 3.4], look: [x + 0.2, 1.05, 0], fov: 48, roll: 0.09 },        // swing round in front of him
      { f: 1228, pos: [x + 4.6, 0.8, 4.4], look: [x + 0.6, 1.0, 0], fov: 46, roll: 0.07 },
      { f: 1238, pos: [GX + 5.2, 1.1, 1.6], look: [GX - 4, 1.0, 0.2], fov: 34, roll: -0.05, e: "cut" }, // from behind the net
      { f: 1262, pos: [GX + 5.0, 1.1, 1.5], look: [GX - 4, 1.0, 0.2], fov: 34, roll: -0.05 },
      { f: 1272, pos: [GX - 2.0, 1.1, 6.6], look: [GX - 5.6, 1.3, 3.0], fov: 38, roll: 0.05, e: "o" }, // he wheels away
      { f: 1296, pos: [GX - 2.2, 1.1, 6.4], look: [GX - 5.5, 1.3, 3.4], fov: 38, roll: 0.05 },
    ], f, 0); break; }
    case 11: c = path([
      { f: 1290, pos: [0.5, 2.05, 4.4], look: [1.15, 2.05, -0.4], fov: 34, roll: 0.03 },            // the tall defender
      { f: 1314, pos: [0.5, 2.05, 4.3], look: [1.15, 2.05, -0.4], fov: 34, roll: 0.03 },
      { f: 1332, pos: [0.3, 1.25, 4.3], look: [0.1, 1.3, 0], fov: 36, roll: -0.03 },                // down to Diego
      { f: 1372, pos: [0.3, 1.25, 4.1], look: [0.1, 1.3, 0], fov: 36, roll: -0.03 },
      { f: 1392, pos: [0.25, 0.75, 3.3], look: [-0.2, 0.72, 0], fov: 34, roll: 0.05 },              // down to the hips
      { f: 1422, pos: [0.25, 0.72, 3.1], look: [-0.2, 0.7, 0], fov: 34, roll: 0.05 },
    ], f, 0.001); break;
    case 12: { const tx = tallX(f), s = shortAt(f); c = path([
      { f: 1418, pos: [tx + 0.5, 1.5, RS[2] + 6.0], look: [tx + 0.3, 1.5, RS[2] + 1.4], fov: 40, roll: -0.03 },
      { f: 1462, pos: [tx + 0.5, 1.5, RS[2] + 5.6], look: [tx + 0.3, 1.5, RS[2] + 1.4], fov: 40, roll: -0.03 },
      { f: 1476, pos: [tx + 0.9, 1.45, RS[2] + 5.0], look: [tx + 0.4, 1.95, RS[2] + 1.4], fov: 40, roll: 0.07, e: "o" }, // up the tall stack
      { f: 1500, pos: [tx + 0.9, 1.45, RS[2] + 4.9], look: [tx + 0.4, 1.95, RS[2] + 1.4], fov: 40, roll: 0.07 },
      { f: 1524, pos: [tx + 0.6, 1.3, RS[2] + 4.6], look: [tx + 0.2, 1.4, RS[2] + 1.4], fov: 36, roll: -0.03 },          // his sweating face
      { f: 1542, pos: [tx + 0.6, 1.3, RS[2] + 4.5], look: [tx + 0.2, 1.4, RS[2] + 1.4], fov: 36, roll: -0.03 },
      { f: 1553, pos: [RS[0] + 2.2, 1.4, RS[2] + 5.6], look: [s[0] * 0.5 + (RS[0] + 2.6) * 0.5, 1.25, RS[2] + 0.6], fov: 42, roll: 0.05, e: "o" }, // whip to the short stack
      { f: 1618, pos: [RS[0] + 2.4, 1.35, RS[2] + 4.9], look: [s[0] * 0.5 + (RS[0] + 2.6) * 0.5, 1.25, RS[2] + 0.6], fov: 40, roll: -0.04 },
    ], f, 0); break; }
    case 13: c = path([
      { f: 1612, pos: [-3.4, 0.5, 6.2], look: [0, 2.0, 0.2], fov: 48, roll: 0.08 },                 // low orbit round the champions
      { f: 1645, pos: [-0.6, 0.6, 6.4], look: [0, 2.1, 0.2], fov: 46, roll: 0.03 },
      { f: 1653, pos: [1.1, 1.9, 3.9], look: [0.2, 2.45, 0.3], fov: 40, roll: -0.06, e: "o" },    // the cup
      { f: 1686, pos: [1.5, 1.85, 4.1], look: [0.2, 2.4, 0.3], fov: 40, roll: -0.04 },
    ], f, 0); break;
    default: c = path([
      { f: 1680, pos: [-2.3, 0.4, 5.4], look: [0, 1.2, 0], fov: 44, roll: -0.05 },                 // the empty pitch at sunset
      { f: 1762, pos: [1.0, 1.2, 4.0], look: [0, 1.25, 0], fov: 38, roll: 0.03 },
      { f: 1771, pos: [0.7, 1.25, 2.5], look: [0.2, 1.4, 0], fov: 34, roll: -0.06, e: "o" },      // his hand
      { f: 1805, pos: [0.7, 1.25, 2.4], look: [0.2, 1.4, 0], fov: 34, roll: -0.06 },
      { f: 1814, pos: [0.5, 0.3, 2.3], look: [0.1, 0.22, 0.15], fov: 38, roll: 0.07, e: "o" },      // his feet
    ], f, 0.001);
  }
  const k = kick(f);
  if (k) { c.pos = [c.pos[0], c.pos[1] + k * 0.6, c.pos[2]]; c.roll += k * 0.3; }
  return c;
};

/** lens blur per shot: cInf px at 1080 wide; wides stay sharp */
export const dofAt = (f: number): { cInf: number; focus?: (f: number) => V3 } => {
  const id = shotAt(f).id;
  const tbl: Record<number, number> = { 1: 12, 2: 8, 3: 10, 4: 0, 5: 8, 6: 9, 7: 11, 8: 14, 9: 0, 10: 5, 11: 12, 12: 9, 13: 9, 14: 12 };
  if (id === 4) return { cInf: f > 410 && f < 510 ? 10 * smooth((f - 410) / 20) * (1 - smooth((f - 500) / 10)) : 0 };
  if (id === 5 && f > 650 && f < 728) return { cInf: 0 };
  if (id === 9) return { cInf: f > 1070 ? 6 * smooth((f - 1070) / 10) : 0 };
  if (id === 2) return { cInf: 8 * smooth((f - 215) / 20) };
  if (id === 10 && f >= 1238) return { cInf: f >= 1268 ? 8 : 0 };
  return { cInf: tbl[id] ?? 0 };
};

// ---------------- screen-space lighting (Main.tsx overlays): night washes with light pools, glows, vignette ----------------
export type Pool = { p: V3; r: number };
export type Glow = { p: V3; r: number; col: string; a: number };
export type Lighting = { wash?: { col: string; a: number }; pools: Pool[]; glows: Glow[]; vig: number; beams?: number; tint?: { col: string; a: number } };
export const lightingAt = (id: number, f: number): Lighting => {
  const L: Lighting = { pools: [], glows: [], vig: 0.35 };
  const pulse = (at: number, len = 10) => clamp01((f - at + 3) / 3) * (1 - clamp01((f - at - len) / 10) * 0.5);
  switch (id) {
    case 1:
      L.vig = 0.55; L.beams = 0.5;
      if (f >= 60 && f < 104) L.glows.push({ p: [36.36, 1.46, 0.6], r: 0.3, col: "#fff2b0", a: 0.5 * smooth((f - 60) / 8) });
      if (f >= 104 && f < 146) L.glows.push({ p: [36, 0.25, 0.9], r: 0.5, col: "#fff2b0", a: 0.5 });
      break;
    case 2: L.vig = 0.5; L.tint = { col: "#ffb060", a: 0.1 }; break;
    case 3:
      L.wash = { col: "#1a2a78", a: 0.8 }; L.vig = 0.6;
      L.pools.push({ p: [RM[0] - 0.1, 0.7, RM[2] - 0.5], r: 0.95 }, { p: [RM[0] + 1.3, 1.8, RM[2] - 1.4], r: 0.8 });
      L.glows.push({ p: [RM[0] + 1.3, 1.8, RM[2] - 1.4], r: 1.1, col: "#bcd4ff", a: 0.4 });
      break;
    case 4: L.vig = f < 420 ? 0.25 : 0.4; if (f > 505) L.beams = 0.5 * smooth((f - 505) / 15); break;
    case 5: L.vig = 0.4; if (f > 652 && f < 730) { const b = lobAt(f); L.glows.push({ p: [b[0] + 0.5, b[1] + 0.8, b[2] - 0.5], r: 2.4, col: "#fff6d8", a: 0.6 }); L.beams = 0.5; } break;
    case 6:
      L.vig = 0.45;
      if (f >= W.punch - 2 && f < 826) { L.wash = { col: "#161a55", a: 0.72 * pulse(W.punch, 10) }; L.pools.push({ p: [50.3, 2.5, 0.5], r: 1.5 }); L.glows.push({ p: [50.33, 2.62, 0.5], r: 0.6, col: "#fff2b0", a: 0.5 }); }
      if (f >= 864) L.glows.push({ p: [48.06, 1.46, 1.2], r: 0.3, col: "#fff2b0", a: 0.5 * smooth((f - 864) / 6) });
      break;
    case 7: L.vig = 0.45; break;
    case 8:
      L.vig = 0.5;
      if (f > 1022) { L.wash = { col: "#161a55", a: 0.6 * smooth((f - 1022) / 12) }; L.pools.push({ p: [0.35, 0.1, 0.25], r: 0.85 }); L.glows.push({ p: [0.3, 0.14, 0.3], r: 0.5, col: "#fff2b0", a: 0.5 * smooth((f - 1030) / 6) }); }
      break;
    case 9: L.vig = 0.3; break;
    case 10: L.vig = 0.4; if (f >= W.net && f < W.net + 14) L.tint = { col: "#ffffff", a: 0.5 * (1 - (f - W.net) / 14) }; break;
    case 11:
      L.wash = { col: "#141c62", a: 0.84 }; L.vig = 0.6;
      L.pools.push({ p: [-0.15, 1.0, 0], r: 0.78 }, { p: [1.15, 1.8, -0.4], r: 0.72 }, { p: [0.4, 0.0, -0.1], r: 1.0 });
      if (f > W.low - 12) L.glows.push({ p: [-0.2, 0.72, 0.1], r: 0.55, col: "#ff5040", a: 0.6 * (0.7 + 0.3 * Math.sin(f / 2.5)) });
      break;
    case 12: {
      L.wash = { col: "#3c1c46", a: 0.74 }; L.vig = 0.55;
      for (const dx of [-3.6, -0.6, 2.6, 5.6]) { L.pools.push({ p: [RS[0] + dx, 0.6, RS[2] + 0.2], r: 2.0 }); L.glows.push({ p: [RS[0] + dx, 2.75, RS[2] + 0.2], r: 0.55, col: "#ffd890", a: 0.85 }); }
      L.pools.push({ p: [tallX(f) + 0.2, 1.7, RS[2] + 1.4], r: 1.5 });
      const s = shortAt(f); L.pools.push({ p: [s[0], 1.1, s[2]], r: 1.3 });
      L.tint = { col: "#ff9a50", a: 0.1 };
      break; }
    case 13: L.vig = 0.4; L.beams = 0.7; L.glows.push({ p: [0.36, 2.68, 0.32], r: 0.75, col: "#ffe9a0", a: 0.5 + 0.3 * smooth((f - 1646) / 8) }); break;
    default: { // the lights go down: one spotlight on him
      const k = smooth((f - 1690) / 20);
      L.vig = 0.6; L.wash = { col: "#1c1a5e", a: 0.72 * k };
      if (f < 1809) L.pools.push({ p: [0, 1.0, 0], r: f > 1764 ? 0.8 : 1.15 }, { p: [0.1, 0.0, 0.1], r: 1.2 });
      else L.pools.push({ p: [0.15, 0.15, 0.2], r: 0.75 });
      if (f >= 1766 && f < 1808) L.glows.push({ p: [0.36, 1.46, 0], r: 0.3, col: "#fff2b0", a: 0.5 * smooth((f - 1766) / 6) });
      if (f >= 1811) L.glows.push({ p: [0.26, 0.14, 0.36], r: 0.4, col: "#fff2b0", a: 0.45 });
    }
  }
  return L;
};
