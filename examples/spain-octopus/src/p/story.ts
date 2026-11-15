// "El pulpo": timeline of the short. Every beat derives from timing.ts (start/end frame of each narrated line),
// so the picture re-times itself when the narration changes.
// Camera grammar from the skill: cuts on big jumps, ease-out glides, every hold creeps, kicks on impacts.
import { CX, AX, TANK } from "./sets";
import { LINES, TOTAL as TT } from "./timing";
import type { LightK } from "./lights";
export const FPS = 30;
export const TOTAL = TT;
export type V3 = [number, number, number];
export type Light = LightK;
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * u * (u * (u * 6 - 15) + 10); };
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const lerp3 = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
/** ramp 0..1 between two frames */
export const ramp = (f: number, a: number, b: number) => clamp01((f - a) / (b - a));

const L = (l: number) => LINES[l - 1][0], E = (l: number) => LINES[l - 1][1];
/** frame at fraction t of narrated line l (1-based) */
export const A = (l: number, t = 0) => Math.round(L(l) + (E(l) - L(l)) * t);
const CUT = 3; // the picture cuts 3 frames before the line starts
export const B = {
  hookB: A(1, 0.5), aPulpo: A(1, 0.84), final0: L(2) - CUT, manolo: L(3) - CUT, forty: A(3, 0.3), aqua: L(4) - CUT, paul: A(4, 0.55),
  boxes: L(5) - CUT, mussel: A(5, 0.6), opens: L(6) - CUT, gana: A(6, 0.7), mont: L(7) - CUT, m2: A(7, 0.36), m5: A(7, 0.58), laugh: L(8) - CUT, suerte: A(8, 0.55),
  semi: L(9) - CUT, yPaul: L(10) - CUT, elige: A(10, 0.5), mob: L(11) - CUT, plancha: A(11, 0.55), guards: L(12) - CUT, sign: L(13) - CUT, cartel: A(13, 0.45),
  finalN: L(14) - CUT, mejillon: A(14, 0.42), again: L(15) - CUT, goal: L(16) - CUT, iniesta: A(16, 0.42), champs: A(16, 0.58), wait: L(17) - CUT, como: A(17, 0.25),
  veras: L(18) - CUT, colores: A(18, 0.3), rayas: A(18, 0.6), bandera: L(19) - CUT, amarilla: A(19, 0.6), luck: L(20) - CUT, una: A(20, 0.38), igual: L(21) - CUT, pueblo: A(21, 0.12),
  ofrec: A(21, 0.5), fiesta: A(21, 0.8), guest: L(22) - CUT, plato: L(23) - CUT, platoIn: L(23) + 6, end: TT,
};

export type Place = "plaza" | "aqua" | "stadium";
/** sun: absolute [yaw deg, elevation deg] (yaw 0 = light comes from +z, 90 = from +x) */
export type ShotDef = { id: number; a: number; b: number; light: Light; place: Place; sun?: [number, number]; fest?: boolean; night?: boolean; lids?: boolean };
const SUN: [number, number] = [38, 52], MOON: [number, number] = [40, 55];
const mk = (id: number, a: number, b: number, place: Place, light: Light, x: Partial<ShotDef> = {}): ShotDef => ({ id, a, b, place, light, sun: place === "plaza" ? (light === "night" ? MOON : SUN) : place === "aqua" ? MOON : undefined, ...x });
export const SHOTS: ShotDef[] = [
  mk(1, 0, B.hookB, "plaza", "day", { fest: true }),            // the town famous for cooking octopus
  mk(2, B.hookB, B.final0, "plaza", "day", { fest: true }),     // ...made an octopus its honorary friend
  mk(3, B.final0, B.manolo, "stadium", "night"),                // all because of the World Cup final
  mk(4, B.manolo, B.aqua, "plaza", "day"),                      // this is Manolo
  mk(5, B.aqua, B.boxes, "aqua", "night"),                      // a German aquarium: Paul
  mk(6, B.boxes, B.mont, "aqua", "night"),                      // two boxes, two flags, a mussel in each
  mk(7, B.mont, B.laugh, "aqua", "night"),                      // one right, two, five in a row
  mk(8, B.laugh, B.semi, "plaza", "day"),                       // Manolo laughs: luck
  mk(9, B.semi, B.mob, "aqua", "night"),                        // semi-final: and Paul picks Spain
  mk(10, B.mob, B.guards, "aqua", "night"),                     // half of Germany wants him grilled
  mk(11, B.guards, B.sign, "aqua", "night"),                    // bodyguards
  mk(12, B.sign, B.finalN, "plaza", "day", { lids: true }),     // no octopus today
  mk(13, B.finalN, B.mejillon, "plaza", "night", { night: true, lids: true }), // the final: the whole plaza
  mk(14, B.mejillon, B.again, "aqua", "night"),                 // ...hanging on a mussel
  mk(15, B.again, B.goal, "aqua", "night"),                     // Paul picks Spain again
  mk(16, B.goal, B.champs, "stadium", "night"),                 // minute 116
  mk(17, B.champs, B.wait, "stadium", "night"),                 // world champions
  mk(18, B.wait, B.veras, "aqua", "night"),                     // wait: how?
  mk(19, B.veras, B.luck, "aqua", "night"),                     // octopuses see no colour, but bright stripes...
  mk(20, B.luck, B.igual, "aqua", "night"),                     // or pure luck: 1 in 256
  mk(21, B.igual, B.ofrec, "plaza", "day", { fest: true }),     // honorary friend
  mk(22, B.ofrec, B.guest, "plaza", "day", { fest: true }),     // 30,000 euros
  mk(23, B.guest, TT, "plaza", "day", { fest: true }),          // as a guest. Not as a dish.
];
export const XFADE: Record<number, number> = { 5: 8, 13: 8, 21: 8 };
export const FLASH_AT = B.final0;
export const FLASH2 = B.champs;

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};
const c = (x: number, y: number, z: number): V3 => [CX + x, y, z];
const q = (x: number, y: number, z: number): V3 => [AX + x, y, z];

// ---------------- shared positions ----------------
export const PAUL_HOME: V3 = q(0, 2.5, -5.25);
export const BOX_L: V3 = q(-0.92, 1.33, -5.0), BOX_R: V3 = q(0.92, 1.33, -5.0);
/** Paul gliding from home to a box (side -1 / +1), k = 0..1 */
export const paulTo = (side: number, k: number): V3 => lerp3(PAUL_HOME, q(side * 0.4, 1.74, -5.12), smooth(k));
export const PORTRAIT: V3 = c(7.0, 0.44 + 0.86, 1.25);
export const SCREEN: V3 = c(0, 5.05, -2.77);
export const BOWL: V3 = c(0.3, 1.12, 2.72);

// ---------------- cameras ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
type Key = { f: number; pos: V3; look: V3; fov?: number; roll?: number; e?: "s" | "o" | "cut"; d?: number };
const outE = (x: number) => { const u = clamp01(x); return 1 - (1 - u) ** 3.2; };
/** keys: each key is where the camera has ARRIVED at f (travelling for d frames before it; "cut" = jump at f) */
const path = (keys: Key[], f: number, creep = 0.0018): Cam => {
  let i = 0; while (i + 1 < keys.length && f >= keys[i + 1].f - (keys[i + 1].e === "cut" ? 0 : keys[i + 1].d ?? 14)) i++;
  const k = keys[i];
  let pos = k.pos, look = k.look, fov = k.fov ?? 40, roll = k.roll ?? 0;
  if (i > 0 && k.e !== "cut" && f < k.f) {
    const p = keys[i - 1], d = k.d ?? 14, t = (f - (k.f - d)) / d, e = k.e === "s" ? smooth(t) : outE(t);
    const hold0 = Math.max(0, (k.f - d) - p.f), z0 = 1 - Math.min(0.14, hold0 * creep);
    const pp = lerp3(p.look, p.pos, z0);
    pos = lerp3(pp, k.pos, e); look = lerp3(p.look, k.look, e); fov = lerp(p.fov ?? 40, fov, e); roll = lerp(p.roll ?? 0, roll, e);
    return { pos, look, fov, roll };
  }
  const hold = Math.max(0, f - k.f), z = 1 - Math.min(0.14, hold * creep);
  pos = lerp3(look, pos, z);
  return { pos, look, fov, roll };
};
export const KICKS: number[] = [B.aPulpo, B.gana, B.m2, B.m5, B.elige + 8, B.plancha, B.cartel + 6, B.iniesta + 12, B.champs, B.platoIn + 10];
const kick = (f: number) => { for (const k of KICKS) { const d = f - k; if (d >= 0 && d < 7) return (d % 2 ? -1 : 1) * 0.045 * (1 - d / 7); } return 0; };
const TK: V3 = q(0, 1.95, -5.2); // tank centre

export const camAt = (id: number, f: number): Cam => {
  let cam: Cam; const S = SHOTS[id - 1], a = S.a;
  switch (id) {
    case 1: cam = path([ // the octopus comes out of the copper pot -> the whole stall
      { f: a, pos: c(0.9, 1.55, 3.7), look: c(2.35, 1.5, -0.9), fov: 52, roll: 0.03 },
      { f: a + 44, d: 22, pos: c(-0.6, 2.3, 8.6), look: c(1.3, 1.8, -1.0), fov: 58, roll: 0 },
    ], f); break;
    case 2: cam = path([ // the podium: the mayor and the portrait -> crash zoom on the portrait
      { f: a, pos: c(5.4, 2.9, 7.8), look: c(6.5, 1.25, 1.4), fov: 46 },
      { f: B.aPulpo + 4, d: 12, pos: c(6.75, 1.5, 3.9), look: [PORTRAIT[0], 1.42, PORTRAIT[2]], fov: 40, roll: -0.03 },
    ], f); break;
    case 3: cam = path([ // the cup under the floodlights
      { f: a, pos: [1.3, 0.5, 3.9], look: [0, 1.25, 0], fov: 50, roll: 0.05 },
      { f: a + 40, d: 36, e: "s", pos: [-0.9, 0.62, 3.1], look: [0, 1.3, 0], fov: 46, roll: -0.03 },
    ], f, 0.003); break;
    case 4: cam = path([ // Manolo at his counter -> the stall and its queue
      { f: a, pos: c(0.55, 1.42, 1.5), look: c(0, 1.3, -1.4), fov: 40 },
      { f: B.forty + 14, d: 18, pos: c(-3.6, 1.95, 5.6), look: c(0.3, 1.5, -1.2), fov: 56, roll: -0.02 },
    ], f); break;
    case 5: cam = path([ // the aquarium hall -> Paul in his tank
      { f: a, pos: q(-2.6, 1.7, 5.2), look: q(0.2, 2.0, -5), fov: 58, roll: 0.03 },
      { f: B.paul + 6, d: 26, e: "s", pos: q(0.3, 2.2, -1.7), look: q(0, 2.42, -5.2), fov: 50, roll: 0 },
    ], f); break;
    case 6: cam = path([ // the two boxes -> macro on a mussel -> Paul opens one
      { f: a, pos: q(0, 1.7, -0.4), look: q(0, 1.75, -5.1), fov: 50 },
      { f: B.mussel, e: "cut", pos: q(-0.55, 1.5, -3.3), look: q(-0.92, 1.36, -5.0), fov: 40, roll: 0.04 },
      { f: B.opens, e: "cut", pos: q(0.35, 1.85, -1.3), look: q(-0.25, 1.75, -5.1), fov: 46 },
      { f: B.gana + 6, d: 10, pos: q(0.1, 1.8, -2.0), look: q(-0.45, 1.7, -5.1), fov: 46, roll: -0.03 },
    ], f); break;
    case 7: cam = path([ // montage: three predictions from three angles
      { f: a, pos: q(-1.3, 1.5, -1.4), look: q(0.1, 1.85, -5.1), fov: 50, roll: -0.04 },
      { f: B.m2, e: "cut", pos: q(1.4, 2.3, -1.5), look: q(-0.1, 1.8, -5.1), fov: 50, roll: 0.05 },
      { f: B.m5, e: "cut", pos: q(0, 1.75, 0.7), look: q(0, 2.1, -5.1), fov: 50 },
    ], f, 0.0028); break;
    case 8: cam = path([ // Manolo and the little TV
      { f: a, pos: c(0.02, 1.4, 1.6), look: c(0, 1.25, -1.1), fov: 46 },
      { f: B.suerte + 4, d: 10, pos: c(0.2, 1.45, 1.0), look: c(0.2, 1.32, -1.4), fov: 44, roll: 0.03 },
    ], f); break;
    case 9: cam = path([ // Germany vs Spain: wide with the press -> close on Paul -> he goes right
      { f: a, pos: q(0, 1.75, 1.0), look: q(0, 2.0, -5.1), fov: 50 },
      { f: B.yPaul, e: "cut", pos: q(-0.2, 2.3, -2.1), look: q(0, 2.45, -5.2), fov: 44, roll: -0.03 },
      { f: B.elige + 10, d: 12, pos: q(0.2, 1.9, -1.5), look: q(0.35, 1.8, -5.1), fov: 46, roll: 0.03 },
    ], f); break;
    case 10: cam = path([ // the mob with frying pans; Paul hides
      { f: a, pos: q(-1.3, 2.45, 2.0), look: q(0.2, 1.45, -4.6), fov: 56, roll: -0.05 },
      { f: B.plancha + 8, d: 12, pos: q(0.3, 1.9, -2.3), look: q(0.9, 1.5, -5.4), fov: 42, roll: 0.03 },
    ], f); break;
    case 11: cam = path([ // two bodyguards and a very cool octopus
      { f: a, pos: q(0.2, 1.3, 0.7), look: q(0, 1.8, -4.4), fov: 52, roll: 0.02 },
      { f: a + 44, d: 30, e: "s", pos: q(0, 1.55, -0.3), look: q(0, 2.0, -5.0), fov: 50 },
    ], f); break;
    case 12: cam = path([ // Manolo hangs the sign -> the sign
      { f: a, pos: c(-1.5, 1.6, 4.4), look: c(0.2, 1.5, -0.2), fov: 50 },
      { f: B.cartel + 10, d: 12, pos: c(0.15, 1.75, 1.9), look: c(0.02, 1.82, -0.05), fov: 42, roll: -0.03 },
    ], f); break;
    case 13: cam = path([ // the night of the final: the plaza under the big screen
      { f: a, pos: c(1.6, 1.7, 12.2), look: c(0, 3.3, -2.8), fov: 52, roll: 0.02 },
      { f: S.b - 6, d: 40, e: "s", pos: c(0.7, 1.95, 10.2), look: c(0, 3.6, -2.8), fov: 48, roll: 0 },
    ], f); break;
    case 14: cam = path([ // macro: the mussel in the Spanish box
      { f: a, pos: q(0.4, 1.55, -3.2), look: q(0.92, 1.38, -5.0), fov: 40, roll: -0.04 },
      { f: S.b - 4, d: 30, e: "s", pos: q(0.6, 1.5, -3.6), look: q(0.92, 1.42, -5.0), fov: 36, roll: 0 },
    ], f); break;
    case 15: cam = path([ // Spain again
      { f: a, pos: q(-0.5, 1.9, -1.6), look: q(0.4, 1.8, -5.1), fov: 46, roll: 0.03 },
    ], f, 0.003); break;
    case 16: cam = path([ // behind the number 6: the shot -> the net
      { f: a, pos: [40.6, 1.25, 4.6], look: [49.5, 1.2, -0.6], fov: 46, roll: 0.03 },
      { f: B.iniesta + 6, e: "cut", pos: [45.6, 1.15, 7.2], look: [50.2, 1.25, 0.6], fov: 50, roll: -0.04 },
    ], f, 0.003); break;
    case 17: cam = path([ // the cup goes up
      { f: a, pos: [1.0, 0.6, 4.4], look: [0, 1.9, 0], fov: 54, roll: 0.05 },
      { f: a + 40, d: 30, e: "s", pos: [-0.8, 0.7, 3.6], look: [0, 2.0, 0], fov: 50, roll: -0.03 },
    ], f, 0.003); break;
    case 18: cam = path([ // wait: how?
      { f: a, pos: q(0.5, 2.3, -1.8), look: q(0, 2.45, -5.2), fov: 46, roll: -0.05 },
      { f: B.como + 30, d: 30, e: "s", pos: q(-0.3, 2.0, -1.2), look: q(0, 2.55, -5.2), fov: 50, roll: 0.04 },
    ], f); break;
    case 19: cam = path([ // octopus vision: two flags lose their colour -> the yellow stripe
      { f: a, pos: q(0, 1.95, -1.5), look: q(0, 2.05, -5.2), fov: 50 },
      { f: B.bandera, e: "cut", pos: q(-0.7, 1.9, -2.2), look: q(0.2, 2.2, -5.1), fov: 44, roll: 0.04 },
      { f: B.amarilla + 12, d: 26, e: "s", pos: q(0.0, 2.2, -2.5), look: q(0.36, 2.5, -5.1), fov: 40, roll: 0 },
    ], f); break;
    case 20: cam = path([ // eight coins
      { f: a, pos: q(-0.4, 1.6, -1.2), look: q(0, 2.2, -5.2), fov: 52, roll: 0.03 },
      { f: B.una + 20, d: 26, e: "s", pos: q(0.2, 1.9, -1.6), look: q(0, 2.3, -5.2), fov: 48, roll: -0.02 },
    ], f); break;
    case 21: cam = path([ // the ceremony again, from the crowd
      { f: a, pos: c(3.0, 2.9, 7.8), look: c(6.4, 1.3, 1.4), fov: 50, roll: -0.03 },
      { f: B.pueblo + 26, d: 24, e: "s", pos: c(4.6, 2.5, 6.6), look: c(6.6, 1.4, 1.3), fov: 46, roll: 0 },
    ], f); break;
    case 22: cam = path([ // the businessman and his briefcase
      { f: a, pos: c(2.3, 1.45, 6.0), look: c(3.65, 1.35, 3.0), fov: 46, roll: 0.03 },
      { f: B.fiesta, d: 16, pos: c(-0.6, 1.9, 7.4), look: c(3.2, 1.7, 0.6), fov: 54, roll: 0 },
    ], f); break;
    default: cam = path([ // the guest of honour at the long table -> the dish
      { f: a, pos: c(-0.1, 1.5, 6.1), look: c(-0.1, 1.2, 2.6), fov: 46 },
      { f: B.plato, e: "cut", pos: c(0.0, 1.25, 5.0), look: c(0.02, 1.05, 2.8), fov: 50, roll: 0.03 },
    ], f, 0.0024); break;
  }
  const k = kick(f);
  return { ...cam, pos: [cam.pos[0], cam.pos[1] + k, cam.pos[2]], look: [cam.look[0], cam.look[1] + k * 0.6, cam.look[2]] };
};

/** lens blur per beat: cInf px at 1080 (0 = sharp), optional focus point (default: the camera's look point) */
export const dofAt = (f: number): { cInf: number; focus?: (f: number) => V3 } => {
  const id = shotAt(f).id;
  switch (id) {
    case 1: return f < B.hookB - 26 ? { cInf: 10 } : { cInf: 0 };
    case 2: return f < B.aPulpo - 8 ? { cInf: 5 } : { cInf: 10 };
    case 3: return { cInf: 10 };
    case 4: return f < B.forty ? { cInf: 10 } : { cInf: 0 };
    case 5: return f < B.paul - 20 ? { cInf: 0 } : { cInf: 8, focus: () => TK };
    case 6: return f >= B.mussel && f < B.opens ? { cInf: 14 } : { cInf: 8, focus: () => TK };
    case 8: return { cInf: 9 };
    case 12: return f < B.cartel ? { cInf: 4 } : { cInf: 10 };
    case 13: return { cInf: 0 };
    case 14: return { cInf: 14 };
    case 16: return { cInf: 6 };
    case 17: return { cInf: 9 };
    case 21: return { cInf: 6 };
    case 22: return { cInf: 6 };
    case 23: return { cInf: 9 };
    default: return { cInf: 8, focus: () => TK };
  }
};

// ---------------- real scene lights (point lights, max 6) + screen-space finishing ----------------
export type Lamp = { p: V3; c: string; i: number; d: number };
const flick = (f: number, s: number) => 1 + 0.1 * Math.sin(f * 0.9 + s) + 0.06 * Math.sin(f * 2.3 + s * 3);
export const lampsAt = (id: number, f: number): Lamp[] => {
  const s = SHOTS[id - 1], night = s.light === "night", Lm: Lamp[] = [];
  if (s.place === "plaza") {
    Lm.push({ p: c(0, 2.1, -0.3), c: "#ffc070", i: night ? 3.2 : 1.1, d: 9 });
    if (night) {
      Lm.push({ p: SCREEN.map((v, i) => (i === 2 ? v + 2.2 : v)) as V3, c: "#8fd8ff", i: 6.5 * flick(f, 1), d: 20 });
      for (const [x, z] of [[-7, -2.4], [7, -2.4], [-12.4, 4], [12.4, 4]]) Lm.push({ p: c(x, 3.2, z), c: "#ffb45a", i: 5.0, d: 14 });
    }
  } else if (s.place === "aqua") {
    Lm.push({ p: q(0, 2.3, -3.3), c: "#7fe0ff", i: 4.2, d: 11 });
    Lm.push({ p: q(-2.6, 2.0, -3.5), c: "#7fe0ff", i: 2.0, d: 8 }, { p: q(2.6, 2.0, -3.5), c: "#7fe0ff", i: 2.0, d: 8 });
    Lm.push({ p: q(0, 3.9, -0.8), c: "#ffd9a0", i: 2.4, d: 9 }, { p: q(-3, 3.9, 1.5), c: "#ffd9a0", i: 1.6, d: 9 }, { p: q(3, 3.9, 1.5), c: "#ffd9a0", i: 1.6, d: 9 });
  } else {
    const x = id === 16 ? 47 : 0;
    Lm.push({ p: [x - 3, 5, 6], c: "#fff4e0", i: 9, d: 30 }, { p: [x + 4, 5, 5], c: "#fff4e0", i: 8, d: 30 }, { p: [x, 6, -5], c: "#e8f0ff", i: 6, d: 30 });
  }
  return Lm.slice(0, 6);
};
export type Pool = { p: V3; r: number };
export type Glow = { p: V3; r: number; col: string; a: number };
export type Lighting = { wash?: { col: string; a: number }; pools: Pool[]; glows: Glow[]; vig: number; beams?: number; tint?: { col: string; a: number } };
/** screen-space finishing only (vignette, glows on emitters, shafts); the light itself is real (lampsAt + presets) */
export const lightingAt = (id: number, f: number): Lighting => {
  const s = SHOTS[id - 1], Lg: Lighting = { pools: [], glows: [], vig: s.light === "night" ? 0.5 : 0.3 };
  if (s.place === "aqua") { Lg.glows.push({ p: TK, r: 2.6, col: "#8fe6ff", a: 0.28 }); Lg.vig = 0.55; if (id === 19) Lg.glows.push({ p: q(0.4, 2.55, -5.1), r: 0.9, col: "#fff2a0", a: 0.6 * ramp(f, B.rayas, B.rayas + 16) }); if (id === 5) Lg.beams = 0.3; }
  if (id === 2) { Lg.glows.push({ p: PORTRAIT, r: 1.3, col: "#ffe6a0", a: 0.5 * ramp(f, B.aPulpo, B.aPulpo + 10) }); Lg.beams = 0.4 * ramp(f, B.aPulpo, B.aPulpo + 12); }
  if (id === 13) Lg.glows.push({ p: SCREEN, r: 4, col: "#9fe0ff", a: 0.4 });
  if (id === 3 || id === 17) { Lg.beams = 0.45; Lg.glows.push({ p: [0, id === 3 ? 1.3 : 2.5, 0], r: 1.2, col: "#ffe6a0", a: 0.45 }); }
  if (id === 21) Lg.glows.push({ p: PORTRAIT, r: 1.2, col: "#ffe6a0", a: 0.3 });
  void TANK;
  return Lg;
};
