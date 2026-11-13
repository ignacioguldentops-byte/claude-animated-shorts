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
  { id: 3, a: 310, b: 368, light: "golden", place: "room" },      // slept hugging his first football
  { id: 4, a: 368, b: 592, light: "day", place: "stadium" },      // captain, 114,000 people
  { id: 5, a: 592, b: 768, light: "day", place: "stadium" },      // ball floats up, keeper 20 cm taller
  { id: 6, a: 768, b: 874, light: "day", place: "stadium" },      // jumps, punches it in
  { id: 7, a: 874, b: 956, light: "day", place: "stadium" },      // referee didn't see a thing
  { id: 8, a: 956, b: 1046, light: "day", place: "stadium" },     // about to use his feet
  { id: 9, a: 1046, b: 1158, light: "day", place: "stadium" },    // picks up the ball in his own half
  { id: 10, a: 1158, b: 1296, light: "day", place: "stadium" },   // one, two, three, four, keeper
  { id: 11, a: 1296, b: 1422, light: "golden", place: "stadium" },// 1.65 m, weight low
  { id: 12, a: 1422, b: 1618, light: "golden", place: "barrio" }, // waiters and plate stacks
  { id: 13, a: 1618, b: 1686, light: "day", place: "stadium" },   // won the whole World Cup
  { id: 14, a: 1686, b: TOTAL, light: "day", place: "stadium" },  // hand / feet
];
export const XFADE: Record<number, number> = { 2: 8, 4: 8, 11: 8, 12: 8, 13: 6 };
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

// ---------------- the solo run (shots 9-10): Diego's x along the pitch ----------------
/** run from his own half (x = -8) to the goal (x = 50) between frames 1100 and 1250 */
export const runX = (f: number) => lerp(-8, 49, smooth((f - 1095) / 165) * 0.15 + clamp01((f - 1095) / 165) * 0.85);
/** defenders he passes (frame he passes them, their spot) */
export const BEATEN: { f: number; x: number; z: number }[] = [
  { f: W.one, x: runX(W.one) + 1.6, z: -1.6 }, { f: W.two, x: runX(W.two) + 1.6, z: 1.8 },
  { f: W.three, x: runX(W.three) + 1.6, z: -2.0 }, { f: W.four, x: runX(W.four) + 1.6, z: 1.6 },
];

// ---------------- cameras ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
type Key = { f: number; pos: V3; look: V3; fov?: number; roll?: number };
/** glide between keys with smootherstep, then a creeping push-in toward the look point (0.25 %/frame) */
const path = (keys: Key[], f: number, creep = 0.0025): Cam => {
  let a = keys[0], b = keys[0];
  for (let i = 0; i < keys.length - 1; i++) if (f >= keys[i].f) { a = keys[i]; b = keys[i + 1]; }
  if (f >= keys[keys.length - 1].f) a = b = keys[keys.length - 1];
  const u = a === b ? 0 : smooth((f - a.f) / (b.f - a.f));
  const pos = lerp3(a.pos, b.pos, u), look = lerp3(a.look, b.look, u);
  const k = 1 - Math.min(0.35, creep * Math.max(0, f - keys[0].f));
  const p: V3 = [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k];
  return { pos: p, look, fov: lerp(a.fov ?? 40, b.fov ?? 40, u), roll: lerp(a.roll ?? 0, b.roll ?? 0, u) };
};
/** impact kicks: sign flips every frame, decays over 7 f */
const KICKS = [W.punch + 2, W.net, W.one, W.two, W.three, W.four];
const kick = (f: number) => {
  for (const k of KICKS) { const d = f - k; if (d >= 0 && d < 7) return (d % 2 ? -1 : 1) * 0.06 * (1 - d / 7); }
  return 0;
};

export const camAt = (id: number, f: number): Cam => {
  const s = SHOTS[id - 1], t = f - s.a;
  let c: Cam;
  switch (id) {
    case 1: c = path([{ f: 0, pos: [30.5, 1.25, 5.4], look: [36, 1.5, 0.6], fov: 38, roll: 0.06 }, { f: 120, pos: [31.2, 1.2, 4.9], look: [36, 1.45, 0.6], fov: 36, roll: 0.07 }], f, 0.0018); break;
    case 2: c = path([{ f: 194, pos: [BX + 3.2, 1.5, -12], look: [BX, 1.1, -2], fov: 40, roll: -0.04 }, { f: 300, pos: [BX + 2.4, 1.3, -8.5], look: [BX, 1.0, -1.5], fov: 38, roll: -0.05 }], f); break;
    case 3: c = path([{ f: 310, pos: [RM[0] + 0.0, 2.1, RM[2] + 2.6], look: [RM[0] - 0.1, 0.7, RM[2] - 0.45], fov: 42, roll: 0.05 }], f, 0.004); break;
    case 4: c = path([
      { f: 368, pos: [-35, 46, 60], look: [8, 2, 0], fov: 44, roll: 0 },
      { f: 500, pos: [-6.5, 3.6, 12], look: [0.5, 1.5, 0], fov: 40, roll: -0.03 },
      { f: 592, pos: [-5.5, 3.3, 10.5], look: [0.5, 1.5, 0], fov: 39, roll: -0.04 }], f, 0); break;
    case 5: c = path([{ f: 592, pos: [42.5, 1.4, 10], look: [49.5, 2.0, 0.2], fov: 42, roll: 0.05 }, { f: 700, pos: [44.5, 1.5, 8], look: [50, 2.6, 0.2], fov: 40, roll: 0.07 }], f); break;
    case 6: c = path([{ f: 768, pos: [45.5, 1.0, 5.2], look: [50.5, 2.6, 0], fov: 46, roll: -0.07 }, { f: 830, pos: [46, 1.0, 4.4], look: [51, 2.5, 0], fov: 44, roll: -0.08 }], f); break;
    case 7: c = path([{ f: 874, pos: [40.6, 1.7, -11.5], look: [43.5, 1.6, -14.2], fov: 36, roll: 0.05 }], f, 0.003); break;
    case 8: c = path([{ f: 956, pos: [-1.6, 0.35, 2.4], look: [0.4, 0.5, 0.2], fov: 44, roll: 0.07 }], f, 0.004); break;
    case 9: { const x = runX(Math.max(f, 1095)); c = path([{ f: 1046, pos: [-14, 13, 22], look: [-8, 1, 0], fov: 40 }, { f: 1158, pos: [x - 7, 9, 19], look: [x + 2, 1, 0], fov: 40 }], f, 0); break; }
    case 10: { const x = runX(f); c = { pos: [x - 2.2, 2.2, 9.0], look: [x + 1.6, 1.1, 0], fov: 42, roll: 0.03 }; break; }
    case 11: c = path([{ f: 1296, pos: [0.4, 1.0, 5.6], look: [0.4, 1.0, 0], fov: 38, roll: 0 }, { f: 1380, pos: [0.4, 0.75, 4.6], look: [0.4, 0.85, 0], fov: 38, roll: 0.03 }], f); break;
    case 12: c = path([{ f: 1422, pos: [BX - 2.0, 1.6, 8.6], look: [BX - 2.0, 1.45, 0], fov: 40, roll: -0.03 }, { f: 1540, pos: [BX - 2.0, 1.55, 7.4], look: [BX - 2.0, 1.4, 0], fov: 40, roll: 0.03 }], f); break;
    case 13: c = path([{ f: 1618, pos: [-3.0, 0.8, 7.0], look: [0, 2.6, 0], fov: 44, roll: 0.06 }], f, 0.004); break;
    default: c = path([{ f: 1686, pos: [-8, 1.5, 5.4], look: [-8, 1.25, 0], fov: 38, roll: 0 }, { f: 1760, pos: [-8, 1.3, 4.6], look: [-8, 1.15, 0], fov: 38, roll: 0.03 }, { f: 1800, pos: [-8, 0.9, 4.2], look: [-8, 0.75, 0], fov: 38, roll: -0.04 }], f, 0.002);
  }
  const k = kick(f);
  if (k) { c.pos = [c.pos[0], c.pos[1] + k * 0.6, c.pos[2]]; c.roll += k * 0.3; }
  void t;
  return c;
};

/** lens blur per shot: cInf px at 1080 wide; wides stay sharp. focus = point to keep sharp (default: look target) */
export const dofAt = (f: number): { cInf: number; focus?: (f: number) => V3 } => {
  const id = shotAt(f).id;
  const tbl: Record<number, number> = { 1: 13, 2: 10, 3: 14, 4: 0, 5: 9, 6: 9, 7: 14, 8: 15, 9: 0, 10: 6, 11: 12, 12: 10, 13: 11, 14: 13 };
  if (id === 4) return { cInf: f > 470 ? 10 * smooth((f - 470) / 40) : 0 };
  return { cInf: tbl[id] ?? 0 };
};
