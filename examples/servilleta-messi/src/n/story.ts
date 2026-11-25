// "La servilleta": timeline of the short, timed to voice_n (timing.ts: [start, end] frame of each narrated clause).
// Same camera grammar as the hair short: cuts on big jumps, ease-out glides, every hold creeps, flip kicks on impacts.
import { CX } from "./sets";
import { AX, PED, LECT } from "./sets";
import type { LightK } from "./lights";
import { TOTAL as T_ } from "./timing";
export const FPS = 30;
export const TOTAL = T_;
export type V3 = [number, number, number];
export type Light = LightK;
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * u * (u * (u * 6 - 15) + 10); };
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const lerp3 = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
export const ramp = (f: number, a: number, b: number) => clamp01((f - a) / (b - a));

export type Place = "cafe" | "auction" | "stadium" | "alley" | "plane" | "air";
export type ShotDef = { id: number; a: number; b: number; light: Light; place: Place; sun?: [number, number]; wall?: "old" | "new"; shrine?: boolean; old?: boolean };
const SUN: [number, number] = [60, 65];
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 108, light: "night", place: "auction" },                       // hook: a napkin sold for almost a million
  { id: 2, a: 108, b: 228, light: "day", place: "cafe", sun: SUN, wall: "old" },     // Pere, nothing ever happens
  { id: 3, a: 228, b: 366, light: "day", place: "cafe", sun: SUN, wall: "old" },     // three serious men sit down
  { id: 4, a: 366, b: 433, light: "day", place: "cafe", sun: SUN, wall: "old" },     // one is Barça's director
  { id: 5, a: 433, b: 549, light: "golden", place: "stadium" },                       // a kid who plays like nobody else
  { id: 6, a: 549, b: 671, light: "golden", place: "stadium" },                       // size of a nine-year-old; treatment = fortune
  { id: 7, a: 671, b: 797, light: "day", place: "cafe", sun: SUN, wall: "old" },     // weeks of doubt; the agents threaten
  { id: 8, a: 797, b: 888, light: "day", place: "cafe", sun: SUN, wall: "old" },     // he asks for paper: there is none
  { id: 9, a: 888, b: 997, light: "day", place: "cafe", sun: SUN, wall: "old" },     // left, right, a napkin
  { id: 10, a: 997, b: 1133, light: "day", place: "cafe", sun: SUN, wall: "old" },   // writing + three signatures
  { id: 11, a: 1133, b: 1224, light: "day", place: "cafe", sun: SUN, wall: "old" },  // wait: a signing on a napkin?
  { id: 12, a: 1224, b: 1362, light: "day", place: "stadium" },                       // Barça kept the kid, paid the treatment
  { id: 13, a: 1362, b: 1461, light: "day", place: "stadium" },                       // eight golden balls + a World Cup
  { id: 14, a: 1461, b: 1566, light: "night", place: "auction" },                    // 24 years later: auctioned in London
  { id: 15, a: 1566, b: TOTAL, light: "day", place: "cafe", sun: SUN, wall: "new" }, // Pere keeps every napkin now
];
export const XFADE: Record<number, number> = { 5: 8, 7: 8, 12: 8, 14: 8, 15: 10 };
export const FLASH_AT = 104;
export const FLASH2 = 1421; // into "y un Mundial"

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};

// ---------------- action beats (frames, from the narration) ----------------
export const W = {
  million: 66, sold: 40, pere: 108, nothing: 190, december: 250, sit: 292, three: 323, director: 380, barca: 410,
  kid: 470, plays: 505, nine: 568, treat: 600, fortune: 640, weeks: 690, threat: 740, otherClub: 765,
  paper: 820, noPaper: 860, left: 890, right: 927, napkin: 966, write: 1005, messi: 1066, sign: 1091,
  wait: 1133, q: 1168, youSee: 1224, kept: 1268, paid: 1310, eight: 1385, cup: 1424, years: 1461, auctioned: 1528,
  andPere: 1566, still: 1600, keeps: 1640, napkins: 1678,
};
export const c = (x: number, y: number, z: number): V3 => [CX + x, y, z];
export const TABLE: V3 = c(2.45, 0.775, -1.3);
export const NAP: V3 = [CX + 2.45, 0.784, -1.36];
export const DIR_AT: V3 = c(2.45, 0.17, -1.92), AG1_AT: V3 = c(1.99, 0.17, -1.64), AG2_AT: V3 = c(2.91, 0.17, -1.64), PERE_T: V3 = c(1.42, 0, -2.08);
export const BAR: V3 = c(-1.7, 0, -4.3);
/** the three men walking in through the door (shot 3): k = 0 director, 1, 2 agents */
export const walkIn = (k: number, f: number): V3 => { const t = ramp(f, 236 + k * 12, 292 + k * 6); return c(1.25 + (k - 1) * 0.12, 0, lerp(2.2, -0.45, t)); };
/** the kid dribbling (shot 5) */
export const kidX = (f: number) => lerp(-5.2, 3.6, ramp(f, 433, 549));

// ---------------- cameras ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
type Key = { f: number; pos: V3; look: V3; fov?: number; roll?: number; e?: "s" | "o" | "cut"; d?: number };
const outE = (x: number) => { const u = clamp01(x); return 1 - (1 - u) ** 3.2; };
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
export const GAVEL1 = 86, GAVEL2 = W.auctioned;
export const KICKS: number[] = [GAVEL1, W.sit + 2, W.noPaper, W.napkin, W.sign + 20, W.cup, GAVEL2, W.napkins];
const kick = (f: number) => { for (const k of KICKS) { const d = f - k; if (d >= 0 && d < 7) return (d % 2 ? -1 : 1) * 0.045 * (1 - d / 7); } return 0; };
const P = PED;

export const camAt = (id: number, f: number): Cam => {
  let cam: Cam;
  switch (id) {
    case 1: cam = path([ // the napkin under the dome -> pull back over the bidding room
      { f: 0, pos: [P[0] + 0.12, P[1] + 0.2, P[2] + 0.85], look: [P[0], P[1] + 0.16, P[2]], fov: 40, roll: 0.03 },
      { f: 62, d: 50, e: "s", pos: [AX + 0.9, 2.45, 2.6], look: [AX + 1.0, 1.15, -3.9], fov: 58, roll: -0.02 },
    ], f); break;
    case 2: cam = path([ // the empty club bar -> Pere polishing a glass
      { f: 108, pos: c(2.8, 1.75, -0.45), look: c(-1.3, 1.1, -4.3), fov: 58 },
      { f: 186, d: 20, pos: c(-0.55, 1.5, -2.25), look: c(-1.7, 1.38, -4.3), fov: 42 },
    ], f); break;
    case 3: cam = path([ // the door: three men walk in -> the table, three serious faces
      { f: 228, pos: c(-0.4, 1.45, -2.9), look: c(1.25, 1.25, 0.1), fov: 50 },
      { f: W.sit, e: "cut", pos: c(2.45, 1.45, -0.12), look: c(2.45, 1.1, -1.7), fov: 62 },
      { f: 360, d: 50, e: "s", pos: c(2.4, 1.42, -0.2), look: c(2.45, 1.12, -1.75), fov: 58 },
    ], f); break;
    case 4: cam = path([ // one of them is Barça's sporting director
      { f: 366, pos: c(2.25, 1.3, -0.75), look: c(2.45, 1.22, -1.92), fov: 44 },
      { f: 420, d: 40, e: "s", pos: c(2.4, 1.28, -1.0), look: c(2.45, 1.24, -1.92), fov: 40, roll: 0.02 },
    ], f); break;
    case 5: { const x = kidX(f); cam = path([{ f: 433, pos: [x + 0.4, 0.85, 4.3], look: [x + 0.2, 0.75, 0], fov: 46 }], f, 0); cam = { ...cam, pos: [x + 0.4, 0.85, 4.3], look: [x + 0.3, 0.75, 0] }; break; }
    case 6: cam = path([ // line-up with the ruler -> the treatment and the pile of coins
      { f: 549, pos: [0.6, 1.15, 5.2], look: [0.6, 0.95, 0], fov: 44 },
      { f: 588, d: 30, e: "s", pos: [1.3, 1.0, 3.6], look: [1.6, 0.85, 0], fov: 44 },
      { f: 594, e: "cut", pos: [0.45, 1.05, 3.3], look: [0.45, 0.85, 0], fov: 48 },
      { f: 660, d: 40, e: "s", pos: [0.45, 1.5, 4.4], look: [0.45, 1.05, 0], fov: 50 },
    ], f); break;
    case 7: cam = path([ // weeks of doubt (clock) -> the agents threaten
      { f: 671, pos: c(2.45, 1.4, -0.3), look: c(2.45, 1.35, -1.9), fov: 50 },
      { f: 719, e: "cut", pos: c(-0.2, 1.6, -0.2), look: c(2.2, 1.1, -1.6), fov: 58 },
      { f: 790, d: 50, e: "s", pos: c(0.1, 1.55, -0.25), look: c(2.2, 1.1, -1.65), fov: 54 },
    ], f); break;
    case 8: cam = path([ // the director asks for paper -> Pere: there is none
      { f: 797, pos: c(2.3, 1.78, -0.25), look: c(2.2, 1.12, -1.9), fov: 56 },
      { f: 855, e: "cut", pos: c(1.15, 1.48, -1.15), look: c(1.42, 1.42, -2.08), fov: 40 },
    ], f); break;
    case 9: cam = path([ // left, right, the napkin
      { f: 888, pos: c(1.12, 1.48, -1.12), look: c(1.42, 1.42, -2.08), fov: 40 },
      { f: W.left + 2, d: 6, pos: c(1.0, 1.48, -1.2), look: c(1.42, 1.44, -2.08), fov: 36, roll: 0.04 },
      { f: W.right, d: 6, pos: c(1.24, 1.48, -1.08), look: c(1.42, 1.44, -2.08), fov: 36, roll: -0.04 },
      { f: W.napkin, d: 10, pos: c(0.85, 1.5, -0.7), look: c(1.42, 1.5, -2.08), fov: 50 },
    ], f); break;
    case 10: cam = path([ // macro: the pen on the napkin, then the signatures
      { f: 997, pos: [NAP[0] + 0.05, 1.32, NAP[2] + 0.42], look: NAP, fov: 44, roll: 0.02 },
      { f: 1080, d: 70, e: "s", pos: [NAP[0], 1.22, NAP[2] + 0.3], look: NAP, fov: 42 },
      { f: 1125, d: 30, e: "s", pos: [NAP[0] - 0.05, 1.3, NAP[2] + 0.36], look: NAP, fov: 44, roll: -0.02 },
    ], f); break;
    case 11: cam = path([ // wait: a signing on a napkin?
      { f: 1133, pos: [NAP[0] + 0.3, 1.2, NAP[2] + 0.55], look: [NAP[0], 0.92, NAP[2]], fov: 46, roll: -0.06 },
      { f: 1205, d: 50, e: "s", pos: [NAP[0] - 0.3, 1.16, NAP[2] + 0.52], look: [NAP[0], 0.88, NAP[2]], fov: 44, roll: 0.05 },
    ], f); break;
    case 12: cam = path([ // the kid in Barça colours -> he grows
      { f: 1224, pos: [0.2, 0.95, 3.4], look: [0, 0.8, 0], fov: 46 },
      { f: 1300, d: 20, pos: [0.0, 0.9, 3.0], look: [0, 0.9, 0], fov: 46 },
      { f: 1356, d: 50, e: "s", pos: [0.0, 1.3, 4.2], look: [0, 1.2, 0], fov: 50 },
    ], f); break;
    case 13: cam = path([ // hero low angle: eight golden balls, then the World Cup
      { f: 1362, pos: [1.0, 0.6, 3.9], look: [0, 1.75, 0], fov: 52, roll: 0.05 },
      { f: W.cup, e: "cut", pos: [-0.7, 0.6, 3.3], look: [0, 1.8, 0], fov: 48, roll: -0.04 },
    ], f, 0.003); break;
    case 14: cam = path([ // the auction room, then the gavel
      { f: 1461, pos: [AX - 1.2, 2.2, 3.0], look: [AX + 0.4, 1.1, -4.0], fov: 54 },
      { f: 1508, d: 40, e: "s", pos: [AX - 0.6, 1.8, 0.8], look: [AX + 0.6, 1.2, -4.4], fov: 50 },
      { f: 1516, e: "cut", pos: [LECT[0] - 1.0, 1.75, LECT[2] + 1.9], look: [LECT[0] - 0.2, 1.55, LECT[2]], fov: 46 },
    ], f); break;
    default: cam = path([ // years later: the wall of framed napkins -> old Pere guards every napkin
      { f: 1566, pos: c(1.7, 2.0, -3.65), look: c(1.6, 2.0, -5.0), fov: 50 },
      { f: 1624, d: 54, e: "s", pos: c(1.0, 1.85, -0.45), look: c(0.6, 1.45, -4.6), fov: 58 },
      { f: W.keeps - 6, e: "cut", pos: c(-1.25, 1.62, -2.2), look: c(-1.45, 1.55, -4.0), fov: 52 },
      { f: 1720, d: 60, e: "s", pos: c(-1.35, 1.6, -2.5), look: c(-1.45, 1.55, -4.0), fov: 50 },
    ], f, 0.0024); break;
  }
  const k = kick(f);
  return { ...cam, pos: [cam.pos[0], cam.pos[1] + k, cam.pos[2]], look: [cam.look[0], cam.look[1] + k * 0.6, cam.look[2]] };
};

/** light lens blur only (user rule: never blurry) */
export const dofAt = (f: number): { cInf: number; focus?: (f: number) => V3 } => {
  const id = shotAt(f).id;
  if (id === 1) return f < 50 ? { cInf: 5, focus: () => [P[0], P[1] + 0.16, P[2]] } : { cInf: 0 };
  if (id === 10 || id === 11) return { cInf: 5, focus: () => NAP };
  if (id === 4 || id === 9) return { cInf: 4 };
  if (id === 13) return { cInf: 4 };
  return { cInf: 0 };
};

// ---------------- real scene lights (point lights, max 6) + screen-space finishing ----------------
export type Lamp = { p: V3; c: string; i: number; d: number };
const CAFE_LAMPS: V3[] = [c(-2.6, 2.3, -3.68), c(-1.2, 2.3, -3.68), c(0.9, 2.3, -2.2)];
export const lampsAt = (id: number, f: number): Lamp[] => {
  const s = SHOTS[id - 1], L: Lamp[] = [];
  if (s.place === "cafe") {
    for (const p of CAFE_LAMPS) L.push({ p, c: "#ffc070", i: 1.25, d: 8 });
    L.push({ p: c(1.25, 1.6, -0.6), c: "#e6eeff", i: 1.8, d: 7 });
    L.push({ p: c(2.45, 2.2, -1.4), c: "#ffd9a0", i: 1.2, d: 5 });
  } else if (s.place === "auction") {
    L.push({ p: [P[0], 3.2, P[2] + 0.9], c: "#fff0c8", i: 5.0, d: 6 });
    for (const [dx, z] of [[-2.5, -3.0], [2.5, -3.0], [-2.5, 0], [2.5, 0]]) L.push({ p: [AX + dx, 3.5, z], c: "#ffc070", i: 2.6, d: 9 });
    L.push({ p: [LECT[0], 2.2, LECT[2] + 1.0], c: "#ffd9a0", i: 1.6, d: 4 });
    void f;
  }
  return L.slice(0, 6);
};
export type Pool = { p: V3; r: number };
export type Glow = { p: V3; r: number; col: string; a: number };
export type Lighting = { wash?: { col: string; a: number }; pools: Pool[]; glows: Glow[]; vig: number; beams?: number; tint?: { col: string; a: number } };
export const lightingAt = (id: number, f: number): Lighting => {
  const s = SHOTS[id - 1], L: Lighting = { pools: [], glows: [], vig: s.light === "night" ? 0.45 : 0.28 };
  if (s.place === "cafe") for (const p of CAFE_LAMPS) L.glows.push({ p, r: 0.7, col: "#ffcf80", a: 0.28 });
  if (s.place === "auction") { L.glows.push({ p: [P[0], P[1] + 0.18, P[2]], r: 0.55, col: "#fff0c0", a: 0.55 }); L.beams = 0.4; }
  if (id === 4) { L.beams = 0.45 * ramp(f, W.barca - 14, W.barca); L.glows.push({ p: c(2.45, 1.6, -1.92), r: 0.7, col: "#ffe08a", a: 0.4 * ramp(f, W.barca - 14, W.barca) }); }
  if (id === 9 && f >= W.napkin) { L.glows.push({ p: c(1.32, 1.62, -2.0), r: 0.35, col: "#fff0c0", a: 0.6 * ramp(f, W.napkin, W.napkin + 8) }); L.beams = 0.4 * ramp(f, W.napkin, W.napkin + 10); }
  if (id === 10 && f >= W.sign + 18) L.glows.push({ p: NAP, r: 0.3, col: "#fff0c0", a: 0.4 * ramp(f, W.sign + 18, W.sign + 30) });
  if (id === 13) { L.beams = 0.45; L.vig = 0.25; }
  if (id === 12 && f >= W.paid) L.beams = 0.4 * ramp(f, W.paid, W.paid + 16);
  if (id === 15) L.glows.push({ p: c(1.9, 2.1, -4.95), r: 1.6, col: "#ffe6a0", a: 0.22 });
  return L;
};
