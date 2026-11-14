// "The Hair": timeline of the short, timed to voice2/words.json (frame = word onset x 30).
// Camera grammar from the skill: cuts on big jumps, ease-out glides, every hold creeps, flip kicks on impacts.
import { CX, PZ, SHX, SHY, SHZ } from "./sets";
import type { LightK } from "./lights";
export const FPS = 30;
export const TOTAL = 1890;
export type V3 = [number, number, number];
export type Light = LightK;
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * u * (u * (u * 6 - 15) + 10); };
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const lerp3 = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
/** ramp 0..1 between two frames */
export const ramp = (f: number, a: number, b: number) => clamp01((f - a) / (b - a));

export const AIR: V3 = [CX, 400, 800];   // night sky (plane exterior)
export const XD = CX + 0.85, XG = CX, ZS = PZ + 0.56; // Diego's row, Gennaro's row, their seat line
export type Place = "cafe" | "alley" | "plane" | "air" | "stadium";
/** sun: absolute [yaw deg, elevation deg] (yaw 0 = light comes from +z, 90 = from +x) */
export type ShotDef = { id: number; a: number; b: number; light: Light; place: Place; sun?: [number, number]; wall?: "old" | "new"; shrine?: boolean; old?: boolean };
const SUN_ALLEY: [number, number] = [60, 65], MOON: [number, number] = [40, 55];
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 131, light: "day", place: "cafe", sun: SUN_ALLEY, wall: "new", shrine: true, old: true },   // hook: the famous café
  { id: 2, a: 131, b: 176, light: "night", place: "plane", sun: MOON },                                          // one hair off an airplane seat
  { id: 3, a: 176, b: 226, light: "day", place: "alley", sun: SUN_ALLEY, wall: "old" },                          // his name is Gennaro
  { id: 4, a: 226, b: 316, light: "day", place: "cafe", sun: SUN_ALLEY, wall: "old" },                           // so quiet even the flies...
  { id: 5, a: 316, b: 388, light: "night", place: "air", sun: MOON },                                            // flying home from Milan
  { id: 6, a: 388, b: 549, light: "night", place: "plane", sun: MOON },                                          // the man asleep in front / a saint
  { id: 7, a: 549, b: 730, light: "night", place: "plane", sun: MOON },                                          // too shy / stares for two hours
  { id: 8, a: 730, b: 880, light: "night", place: "plane", sun: MOON },                                          // lands, walks off, one hair
  { id: 9, a: 880, b: 984, light: "night", place: "plane", sun: MOON },                                          // looks left, right, wallet
  { id: 10, a: 984, b: 1110, light: "night", place: "cafe", sun: MOON, wall: "new", shrine: true },              // golden frame, candles, flowers
  { id: 11, a: 1110, b: 1170, light: "night", place: "cafe", sun: MOON, wall: "new", shrine: true },             // wife: it's a hair
  { id: 12, a: 1170, b: 1273, light: "day", place: "cafe", sun: SUN_ALLEY, wall: "new", shrine: true },          // old lady kneels
  { id: 13, a: 1273, b: 1351, light: "day", place: "alley", sun: SUN_ALLEY, wall: "new", shrine: true },         // queue round the block
  { id: 14, a: 1351, b: 1408, light: "night", place: "cafe", sun: MOON, wall: "new", shrine: true },             // why pray to a hair?
  { id: 15, a: 1408, b: 1518, light: "golden", place: "stadium" },                                               // never won the league
  { id: 16, a: 1518, b: 1565, light: "day", place: "stadium" },                                                  // with him, twice
  { id: 17, a: 1565, b: 1646, light: "night", place: "alley", sun: MOON, wall: "new", shrine: true },            // not a footballer: a miracle
  { id: 18, a: 1646, b: 1694, light: "night", place: "cafe", sun: MOON, wall: "new", shrine: true },             // needs a relic
  { id: 19, a: 1694, b: 1776, light: "day", place: "cafe", sun: SUN_ALLEY, wall: "new", shrine: true, old: true }, // thirty years later
  { id: 20, a: 1776, b: TOTAL, light: "day", place: "cafe", sun: SUN_ALLEY, wall: "new", shrine: true, old: true }, // first, you buy a coffee
];
export const XFADE: Record<number, number> = { 5: 8, 10: 8, 12: 8, 15: 8, 17: 8, 19: 10 };
export const FLASH_AT = 172;
export const FLASH2 = 1516; // into the title wins

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
  famous: 64, world: 96, oneHair: 114, picked: 131, seat: 165, gennaro: 198, quiet: 242, flies: 271, stopped: 287, night: 321,
  asleep: 388, front: 428, diego: 456, naples: 492, saint: 539, shy: 582, hello: 602, twoHours: 629, stares: 663, curly: 710,
  lands: 746, walks: 774, off: 785, there: 795, headrest: 809, single: 846, hair: 868, left: 902, right: 927, slips: 947, wallet: 971,
  back: 984, puts: 1014, frame: 1055, candles: 1074, flowers: 1094, wife: 1117, itsa: 1151, hair2: 1160, morning: 1185, lady: 1208,
  walksIn: 1216, kneels: 1239, lunch: 1273, queue: 1298, block: 1337, wait: 1351, why: 1358, pray: 1387, hair3: 1399, youSee: 1408,
  never: 1465, league: 1485, notOnce: 1497, withHim: 1518, twice: 1552, toThem: 1565, miracle: 1624, relic: 1681, thirty: 1707,
  still: 1749, wall: 1767, photo: 1798, rule: 1829, first: 1837, buy: 1859, coffee: 1867,
};
const c = (x: number, y: number, z: number): V3 => [CX + x, y, z];
const pl = (x: number, y: number, z: number): V3 => [CX + x, y, PZ + z];

// ---------------- shared motion ----------------
/** the old lady: from the door to the shrine */
export const nonnaAt = (f: number): V3 => { const t = smooth(ramp(f, 1196, 1238)); return c(lerp(1.25, 1.45, t), 0, lerp(0.9, -3.75, t)); };
/** Diego leaving down the aisle (shot 8) */
export const diegoWalkX = (f: number) => XD + 0.1 + ramp(f, 768, 800) * 5.2;
/** queue: n-th person's spot (serpentine: out of the door to +x on the café side, back on the other side) */
export const queueAt = (i: number): V3 => {
  if (i < 3) return c(1.3, 0, -0.4 - i * 0.75);
  const k = i - 3, n1 = 34;
  if (k < n1) return c(1.7 + k * 0.84, 0, 1.25 + 0.22 * Math.sin(k * 1.7));
  const j = k - n1; if (j < 3) return c(1.7 + n1 * 0.84 + 0.3, 0, 1.25 + (j + 1) * 0.62);
  return c(1.7 + n1 * 0.84 - (j - 3) * 0.84, 0, 3.55 + 0.2 * Math.sin(j * 2.1));
};

// ---------------- cameras ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
type Key = { f: number; pos: V3; look: V3; fov?: number; roll?: number; e?: "s" | "o" | "cut"; d?: number };
const outE = (x: number) => { const u = clamp01(x); return 1 - (1 - u) ** 3.2; };
/** keys: each key is where the camera has ARRIVED at f (travelling for d frames before it; "cut" = jump at f) */
const path = (keys: Key[], f: number, creep = 0.0018): Cam => {
  let i = 0; while (i + 1 < keys.length && f >= keys[i + 1].f - (keys[i + 1].e === "cut" ? 0 : keys[i + 1].d ?? 14)) i++;
  const k = keys[i], n = keys[i + 1];
  let pos = k.pos, look = k.look, fov = k.fov ?? 40, roll = k.roll ?? 0;
  if (i > 0 && k.e !== "cut" && f < k.f) {
    const p = keys[i - 1], d = k.d ?? 14, t = (f - (k.f - d)) / d, e = k.e === "s" ? smooth(t) : outE(t);
    // the previous key's hold creep has to be included so the move starts where the hold ended
    const hold0 = Math.max(0, (k.f - d) - p.f), z0 = 1 - Math.min(0.14, hold0 * creep);
    const pp = lerp3(p.look, p.pos, z0);
    pos = lerp3(pp, k.pos, e); look = lerp3(p.look, k.look, e); fov = lerp(p.fov ?? 40, fov, e); roll = lerp(p.roll ?? 0, roll, e);
    return { pos, look, fov, roll };
  }
  void n;
  const hold = Math.max(0, f - k.f), z = 1 - Math.min(0.14, hold * creep);
  pos = lerp3(look, pos, z);
  return { pos, look, fov, roll };
};
export const KICKS: number[] = [W.lands, 1040, 1518, W.twice, W.relic, W.coffee, 147, W.hair];
const kick = (f: number) => { for (const k of KICKS) { const d = f - k; if (d >= 0 && d < 7) return (d % 2 ? -1 : 1) * 0.045 * (1 - d / 7); } return 0; };

export const camAt = (id: number, f: number): Cam => {
  let cam: Cam;
  switch (id) {
    case 1: cam = path([ // the barman -> wide of the famous café -> crash zoom on the hair
      { f: 0, pos: c(-1.55, 1.5, -1.25), look: c(-1.7, 1.38, -4.3), fov: 40 },
      { f: 50, d: 18, pos: c(-2.9, 2.15, -0.55), look: c(0.3, 1.3, -4.5), fov: 62, roll: -0.03 },
      { f: 122, d: 12, pos: c(1.5, 1.82, -3.85), look: [SHX, SHY, SHZ], fov: 52 },
    ], f); break;
    case 2: cam = path([ // macro: the hand plucks the hair off the headrest
      { f: 131, pos: [XD + 0.8, 1.3, ZS + 0.42], look: [XD - 0.24, 1.14, ZS], fov: 54, roll: 0.05 },
      { f: 160, d: 10, pos: [XD + 0.7, 1.4, ZS + 0.3], look: [XD - 0.24, 1.3, ZS], fov: 54, roll: 0.02 },
    ], f, 0.003); break;
    case 3: cam = path([ // the alley -> Gennaro at his door
      { f: 176, pos: c(10.5, 2.0, 2.7), look: c(-6, 5.2, 2.2), fov: 60 },
      { f: 212, d: 22, e: "s", pos: c(3.9, 1.5, 2.6), look: c(1.3, 1.35, 0.5), fov: 36 },
    ], f); break;
    case 4: cam = path([ // empty café -> the flies at the door
      { f: 226, pos: c(2.7, 1.75, -0.6), look: c(-1.3, 1.1, -4.3), fov: 58 },
      { f: 262, d: 14, pos: c(0.45, 1.4, -1.7), look: c(1.25, 1.5, 0.3), fov: 42 },
    ], f); break;
    case 5: cam = path([ // night sky: the plane crosses the moon
      { f: 316, pos: [AIR[0], AIR[1], AIR[2] + 40], look: [AIR[0], AIR[1] + 2, AIR[2]], fov: 44, roll: -0.04 },
    ], f, 0.0012); break;
    case 6: cam = path([ // across the aisle: two rows -> front on Diego asleep -> halo
      { f: 388, pos: pl(0.42, 1.62, -1.52), look: [CX + 0.42, 1.3, ZS], fov: 64 },
      { f: 456, e: "cut", pos: [XD + 2.0, 1.45, ZS + 0.12], look: [XD - 0.02, 1.36, ZS], fov: 44 },
      { f: 500, d: 16, e: "s", pos: [XD + 2.05, 1.7, ZS - 0.2], look: [XD - 0.02, 1.55, ZS - 0.08], fov: 52, roll: 0.03 },
    ], f); break;
    case 7: cam = path([ // shy -> over his shoulder at the curly head -> his eyes -> the curls
      { f: 549, pos: pl(0.42, 1.6, -1.52), look: [CX + 0.42, 1.32, ZS], fov: 62 },
      { f: 614, e: "cut", pos: [XG - 1.0, 1.62, ZS - 0.34], look: [XD, 1.45, ZS + 0.06], fov: 46 },
      { f: 663, e: "cut", pos: [XG + 0.42, 1.36, ZS + 0.04], look: [XG - 0.02, 1.36, ZS], fov: 62 },
      { f: 696, e: "cut", pos: [XG - 0.05, 1.52, ZS], look: [XD - 0.02, 1.45, ZS], fov: 56 },
    ], f, 0.0026); break;
    case 8: cam = path([ // landing down the aisle -> Diego leaves -> the hair on the headrest
      { f: 730, pos: pl(-3.3, 1.62, 0), look: pl(2.5, 1.15, 0), fov: 52 },
      { f: 772, d: 14, pos: pl(-1.3, 1.55, 0), look: pl(4, 1.2, 0.1), fov: 46 },
      { f: 795, e: "cut", pos: [XD + 0.95, 1.36, ZS + 0.5], look: [XD - 0.23, 1.12, ZS], fov: 46, roll: 0.05 },
      { f: 850, d: 30, e: "s", pos: [XD + 0.45, 1.22, ZS + 0.22], look: [XD - 0.23, 1.11, ZS], fov: 38, roll: 0 },
    ], f); break;
    case 9: cam = path([ // Gennaro in the aisle: left, right, wallet
      { f: 880, pos: [XD + 1.9, 1.48, PZ + 0.02], look: [XD - 0.25, 1.36, PZ], fov: 40 },
      { f: 902, d: 6, pos: [XD + 1.75, 1.48, PZ + 0.2], look: [XD - 0.25, 1.4, PZ], fov: 36, roll: 0.04 },
      { f: 927, d: 6, pos: [XD + 1.75, 1.48, PZ - 0.2], look: [XD - 0.25, 1.4, PZ], fov: 36, roll: -0.04 },
      { f: 950, d: 10, pos: [XD + 1.95, 1.4, PZ + 0.03], look: [XD - 0.25, 1.22, PZ], fov: 42 },
    ], f); break;
    case 10: cam = path([ // night alley -> into the café -> the shrine
      { f: 984, pos: c(8.2, 1.7, 2.9), look: c(0.2, 3.2, 1.2), fov: 56 },
      { f: 1012, e: "cut", pos: c(1.1, 1.55, -1.5), look: c(1.1, 1.55, -4.9), fov: 46 },
      { f: 1078, d: 24, e: "s", pos: c(1.45, 1.6, -2.95), look: [SHX, 1.62, SHZ], fov: 50 },
    ], f); break;
    case 11: cam = path([ // wife and Gennaro either side of the shrine -> her deadpan
      { f: 1110, pos: c(1.45, 1.5, -0.6), look: c(1.45, 1.42, -4.6), fov: 50 },
      { f: 1151, d: 8, pos: c(0.95, 1.5, -2.6), look: c(0.72, 1.42, -4.3), fov: 46 },
    ], f); break;
    case 12: cam = path([ // morning door -> she walks to the shrine and kneels
      { f: 1170, pos: c(-0.7, 1.3, -3.3), look: c(1.25, 1.1, 0.2), fov: 44 },
      { f: 1242, d: 40, e: "s", pos: c(-0.3, 1.25, -1.5), look: c(1.45, 1.05, -4.4), fov: 48 },
    ], f); break;
    case 13: cam = path([ // the queue: from the door, rising over the alley
      { f: 1273, pos: c(-0.8, 1.5, 3.2), look: c(6, 1.25, 1.4), fov: 52 },
      { f: 1340, d: 50, e: "s", pos: c(-7.5, 8.6, 3.1), look: c(14, 0.2, 2.2), fov: 56, roll: 0.03 },
    ], f); break;
    case 14: cam = path([ // the hair in its frame: why?
      { f: 1351, pos: c(1.3, 1.72, -3.6), look: [SHX + 0.1, SHY, SHZ], fov: 52, roll: -0.06 },
      { f: 1392, d: 30, e: "s", pos: c(1.75, 1.82, -3.8), look: [SHX + 0.1, SHY + 0.03, SHZ], fov: 48, roll: 0.05 },
    ], f); break;
    case 15: cam = path([ // sad fans, empty pedestal
      { f: 1408, pos: [-3.6, 1.5, 7.2], look: [0.5, 1.1, 0], fov: 50 },
      { f: 1497, d: 8, pos: [0.5, 1.25, 2.6], look: [0.9, 0.95, 0], fov: 34, roll: -0.04 },
    ], f); break;
    case 16: cam = path([ // hero low angle: two cups
      { f: 1518, pos: [1.0, 0.55, 3.6], look: [0, 1.75, 0], fov: 50, roll: 0.05 },
      { f: 1552, d: 8, pos: [-0.6, 0.6, 3.0], look: [0, 1.8, 0], fov: 46, roll: -0.04 },
    ], f, 0.003); break;
    case 17: cam = path([ // night alley: up to the mural
      { f: 1565, pos: c(3.2, 1.45, 2.5), look: c(-13.9, 6.2, 2.45), fov: 50 },
      { f: 1630, d: 44, e: "s", pos: c(-5.2, 5.6, 2.45), look: c(-13.9, 7.6, 2.45), fov: 44 },
    ], f); break;
    case 18: cam = path([ // rush in on the relic
      { f: 1646, pos: c(1.35, 1.5, -0.9), look: [SHX, 1.6, SHZ], fov: 50 },
      { f: 1684, d: 30, pos: c(1.5, 1.78, -4.0), look: [SHX, SHY, SHZ], fov: 50 },
    ], f); break;
    case 19: cam = path([ // thirty years later: pull back over the crowd
      { f: 1694, pos: c(1.5, 1.78, -4.0), look: [SHX, SHY, SHZ], fov: 50 },
      { f: 1752, d: 48, e: "s", pos: c(0.5, 1.95, -0.9), look: c(1.3, 1.4, -4.6), fov: 56 },
    ], f); break;
    default: cam = path([ // tourist with a camera -> one rule -> the coffee
      { f: 1776, pos: c(1.6, 1.55, -4.55), look: c(1.25, 1.36, -2.4), fov: 52 },
      { f: 1807, e: "cut", pos: c(-1.55, 1.5, -1.4), look: c(-1.7, 1.42, -4.3), fov: 40 },
      { f: 1837, e: "cut", pos: c(-1.25, 1.42, -2.45), look: c(-1.7, 1.31, -3.95), fov: 42, roll: 0.03 },
    ], f, 0.0024); break;
  }
  const k = kick(f);
  return { ...cam, pos: [cam.pos[0], cam.pos[1] + k, cam.pos[2]], look: [cam.look[0], cam.look[1] + k * 0.6, cam.look[2]] };
};

/** lens blur per beat: cInf px at 1080 (0 = sharp), optional focus point */
export const dofAt = (f: number): { cInf: number; focus?: (f: number) => V3 } => {
  const id = shotAt(f).id;
  if (id === 1) return f < 34 ? { cInf: 12 } : f < 112 ? { cInf: 0 } : { cInf: 12 };
  if (id === 2) return { cInf: 14, focus: () => [XD - 0.2, 1.15, ZS] };
  if (id === 3) return f < 196 ? { cInf: 0 } : { cInf: 10 };
  if (id === 4) return f < 250 ? { cInf: 0 } : { cInf: 8 };
  if (id === 5) return { cInf: 0 };
  if (id === 6) return f < 456 ? { cInf: 10 } : { cInf: 12, focus: () => [XD, 1.35, ZS] };
  if (id === 7) return f < 614 ? { cInf: 10 } : f < 663 ? { cInf: 12, focus: () => [XD, 1.4, ZS] } : f < 696 ? { cInf: 8 } : { cInf: 12 };
  if (id === 8) return f < 795 ? { cInf: 6, focus: (ff) => [Math.min(XD + 4, XD + 0.1 + ramp(ff, 768, 800) * 5.2), 1.3, ZS - 0.4] } : { cInf: 14 };
  if (id === 9) return { cInf: 12 };
  if (id === 10) return f < 1012 ? { cInf: 0 } : { cInf: 9 };
  if (id === 11) return { cInf: 8 };
  if (id === 12) return { cInf: 7, focus: (ff) => { const p = nonnaAt(ff); return [p[0], 1.0, p[2]]; } };
  if (id === 13) return { cInf: 0 };
  if (id === 14) return { cInf: 14 };
  if (id === 15) return { cInf: 10 };
  if (id === 16) return { cInf: 10 };
  if (id === 17) return { cInf: 0 };
  if (id === 18) return { cInf: 10 };
  if (id === 19) return f < 1720 ? { cInf: 12 } : { cInf: 5, focus: () => c(1.3, 1.4, -3.4) };
  return f < 1807 ? { cInf: 9, focus: () => c(1.3, 1.4, -3.0) } : f < 1837 ? { cInf: 12 } : { cInf: 9, focus: () => c(-1.7, 1.25, -3.75) };
};

// ---------------- real scene lights (point lights, max 6) + screen-space finishing ----------------
export type Lamp = { p: V3; c: string; i: number; d: number };
const flick = (f: number, s: number) => 1 + 0.1 * Math.sin(f * 0.9 + s) + 0.06 * Math.sin(f * 2.3 + s * 3);
const CAFE_LAMPS: V3[] = [c(-2.6, 2.3, -3.68), c(-1.2, 2.3, -3.68), c(0.9, 2.3, -2.2)];
const LANTERNS: [number, number][] = [[-9, 0.65], [-1.2, 4.25], [5.2, 0.65], [13, 4.25], [22, 0.65], [31, 4.25]];
export const lampsAt = (id: number, f: number): Lamp[] => {
  const s = SHOTS[id - 1], night = s.light === "night", L: Lamp[] = [];
  if (s.place === "cafe") {
    for (const p of CAFE_LAMPS) L.push({ p, c: "#ffc070", i: night ? 2.4 : 1.25, d: 8 });
    const candles = id === 10 ? ramp(f, W.candles, W.candles + 14) : s.shrine ? 1 : 0;
    if (candles) L.push({ p: [SHX, 1.55, -4.55], c: "#ffa040", i: (night ? 2.2 : 1.0) * candles * flick(f, 1), d: 5 });
    if (!night) L.push({ p: c(1.25, 1.6, -0.6), c: "#e6eeff", i: 1.8, d: 7 });
    else L.push({ p: c(-1.5, 1.6, 1.0), c: "#ffb060", i: 1.6, d: 7 });
  } else if (s.place === "alley") {
    if (night) {
      for (const [dx, z] of LANTERNS.slice(0, 4)) L.push({ p: c(dx, 3.9, z), c: "#ffb45a", i: 5.5, d: 14 });
      L.push({ p: c(-12.4, 1.6, 2.45), c: "#ffa040", i: 4.5 * flick(f, 2), d: 14 });
      L.push({ p: c(0.5, 1.6, 1.0), c: "#ffc070", i: 2.2, d: 8 });
    }
  } else if (s.place === "plane") {
    for (const dx of [-3.2, 0.4, 4]) L.push({ p: pl(dx, 1.9, 0), c: "#cfd8ff", i: 1.3, d: 8 });
    const halo = id === 6 ? ramp(f, 494, 510) : 0;
    L.push({ p: [XD + 0.25, 1.85, ZS + 0.1], c: "#ffd27a", i: 0.9 + 1.6 * halo, d: 5 });
    L.push({ p: [XG + 0.3, 1.8, ZS + 0.1], c: "#ffe2b0", i: 0.8, d: 5 });
    if (id === 8 && f >= 795) L.push({ p: [XD - 0.1, 1.5, ZS + 0.25], c: "#fff0c0", i: 1.3 * ramp(f, 795, 830), d: 4 });
  }
  return L.slice(0, 6);
};
export type Pool = { p: V3; r: number };
export type Glow = { p: V3; r: number; col: string; a: number };
export type Lighting = { wash?: { col: string; a: number }; pools: Pool[]; glows: Glow[]; vig: number; beams?: number; tint?: { col: string; a: number } };
/** screen-space finishing only (vignette, glows on emitters, shafts); the light itself is real (lampsAt + presets) */
export const lightingAt = (id: number, f: number): Lighting => {
  const s = SHOTS[id - 1], L: Lighting = { pools: [], glows: [], vig: s.light === "night" ? 0.5 : 0.3 };
  const hairGlow = (a: number, r = 0.5) => L.glows.push({ p: [SHX, SHY, SHZ + 0.05], r, col: "#ffe6a0", a });
  if (s.place === "cafe") {
    for (const p of CAFE_LAMPS) L.glows.push({ p, r: 0.7, col: "#ffcf80", a: s.light === "night" ? 0.5 : 0.28 });
    if (s.shrine) hairGlow(id === 10 ? 0.5 * ramp(f, W.candles, W.candles + 14) : id === 14 || id === 18 ? 0.65 : 0.4, id === 18 ? 0.8 : 0.55);
    if (id === 12) L.beams = 0.5;
    if (id === 18) L.beams = 0.5 * ramp(f, 1660, 1684);
  }
  if (id === 2 || (id === 8 && f >= 795)) { L.glows.push({ p: [XD - 0.2, 1.12, ZS], r: 0.28, col: "#fff0c0", a: id === 2 ? 0.5 : 0.55 * ramp(f, 800, 840) }); L.beams = id === 2 ? 0.35 : 0.45 * ramp(f, 800, 840); }
  if (id === 6 && f >= 490) { L.glows.push({ p: [XD, 1.75, ZS], r: 0.6, col: "#ffe08a", a: 0.55 * ramp(f, 494, 510) }); L.beams = 0.5 * ramp(f, 494, 512); }
  if (id === 5) L.glows.push({ p: [AIR[0] + 5, AIR[1] + 9, AIR[2] - 30], r: 9, col: "#dfe8ff", a: 0.4 });
  if (id === 16) { L.beams = 0.45; L.vig = 0.25; }
  if (id === 15) L.tint = { col: "#2a3566", a: 0.1 };
  if (id === 17) { L.glows.push({ p: c(-13.8, 7.4, 2.45), r: 4.2, col: "#ffe08a", a: 0.5 * ramp(f, 1600, 1630) }); L.beams = 0.4 * ramp(f, 1606, 1634); }
  return L;
};
