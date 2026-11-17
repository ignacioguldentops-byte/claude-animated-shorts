// "La puerta de atrás": timeline of the short. Every beat derives from timing.ts (start/end frame of each narrated line),
// so the picture re-times itself when the narration changes.
// Camera grammar from the skill: cuts on big jumps, ease-out glides, every hold creeps, kicks on impacts.
import { CX, PZ, BENCH } from "./sets";
import { HX, BOOTH } from "./sets2";
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
const CUT = 3;
export const B = {
  tv: A(1, 0.22), tres: A(1, 0.5), burger: A(1, 0.7), antes: L(2) - CUT, cuarto: A(2, 0.14), doce: A(2, 0.36), madre: A(2, 0.62), futb: A(2, 0.9),
  llama: L(3) - CUT, lloron: A(3, 0.12), hambre: A(3, 0.42), asi: L(4) - CUT, puerta: A(4, 0.36), sobra: A(4, 0.84), abren: L(5) - CUT, edna: A(5, 0.5),
  dan: L(6) - CUT, sinp: A(6, 0.55), espera: L(7) - CUT, porque: A(7, 0.25), veras: L(8) - CUT, todo: A(8, 0.36), nunca: A(8, 0.56),
  dijo: L(9) - CUT, devol: A(9, 0.45), una: L(10) - CUT, paula: A(10, 0.25), siva: A(10, 0.68), deudas: L(11) - CUT, misma: L(12) - CUT, knock: A(12, 0.5), end: TT,
};
export const AIR: V3 = [CX, 400, 800];
export type Place = "stadium" | "street" | "home" | "air" | "plane";
/** sun: absolute [yaw deg, elevation deg]; open = the burger place's door is open and lit */
export type ShotDef = { id: number; a: number; b: number; light: Light; place: Place; sun?: [number, number]; open?: boolean; rain?: number };
const MOON: [number, number] = [40, 55];
const mk = (id: number, a: number, b: number, place: Place, x: Partial<ShotDef> = {}): ShotDef => ({ id, a, b, place, light: "night", sun: place === "stadium" ? undefined : MOON, ...x });
export const SHOTS: ShotDef[] = [
  mk(1, 0, B.tres, "stadium"),                       // one of the richest footballers asks for help on TV
  mk(2, B.tres, B.burger, "stadium"),                // to find three women
  mk(3, B.burger, B.antes, "street", { rain: 1 }),   // he owed them a burger
  mk(4, B.antes, B.doce, "home"),                    // a boy from Madeira, one room, three siblings
  mk(5, B.doce, B.madre, "air"),                     // at twelve he left for Lisbon alone
  mk(6, B.madre, B.llama, "plane"),                  // a thousand kilometres from his mother
  mk(7, B.llama, B.hambre, "street", { rain: 1 }),   // he called her crying: the cry-baby
  mk(8, B.hambre, B.asi, "street"),                  // and at night, hunger
  mk(9, B.asi, B.abren, "street"),                   // the back door of a burger place
  mk(10, B.abren, B.dan, "street", { open: true }),  // three employees; one was called Edna
  mk(11, B.dan, B.espera, "street", { open: true }), // they gave them what was left; no questions
  mk(12, B.espera, B.veras, "street", { rain: 1 }),  // wait: why look for them twenty years later?
  mk(13, B.veras, B.nunca, "stadium", { light: "golden" }), // that boy ended up winning everything
  mk(14, B.nunca, B.dijo, "street", { rain: 0.6 }),  // but he never forgot that door
  mk(15, B.dijo, B.una, "street"),                   // he wanted to take them to dinner
  mk(16, B.una, B.deudas, "street"),                 // one turned up: Paula
  mk(17, B.deudas, B.misma, "street"),               // some debts are not paid with money
  mk(18, B.misma, TT, "street"),                     // ...but by knocking on the same door again
];
export const XFADE: Record<number, number> = { 3: 10, 4: 12, 5: 10, 7: 10, 12: 10, 13: 10, 14: 12, 15: 10, 18: 8 };
export const FLASH_AT = -100;
export const FLASH2 = 100000;
export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};
const c = (x: number, y: number, z: number): V3 => [CX + x, y, z];
const pl = (x: number, y: number, z: number): V3 => [CX + x, y, PZ + z];
const h = (x: number, y: number, z: number): V3 => [HX + x, y, z];
// ---------------- shared positions ----------------
export const DOOR: V3 = c(1.25, 0, 0.15), CURB: V3 = c(3.5, 0, 1.2), SEAT: V3 = pl(0.14, 0.17, 0.56), WIN: V3 = h(-0.45, 0, -2.55);
/** the three boys walking to the door (shot 8): x of the middle one */
export const walkX = (f: number) => { const s = SHOTS[7]; return lerp(6.3, 4.75, (f - s.a) / (s.b - s.a)); };
/** where people sit on the bench (z just in front of its edge) and where things rest on it */
export const BENCH_Z = BENCH.z1 + 0.05, BENCH_TOP = BENCH.top, BENCH_MID = (BENCH.z0 + BENCH.z1) / 2;
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
export const KICKS: number[] = [13, B.burger, B.puerta + 6, B.puerta + 14, B.knock, B.knock + 8];
const kick = (f: number) => { for (const k of KICKS) { const d = f - k; if (d >= 0 && d < 7) return (d % 2 ? -1 : 1) * 0.03 * (1 - d / 7); } return 0; };

export const camAt = (id: number, f: number): Cam => {
  let cam: Cam; const S = SHOTS[id - 1], a = S.a;
  switch (id) {
    case 1: cam = path([ // HOOK: the camera rushes in on the star lifting a cup -> close: he speaks into a microphone
      { f: a, pos: [-2.2, 0.45, 8.6], look: [0, 1.9, 0], fov: 56, roll: 0.06 },
      { f: a + 13, d: 13, pos: [-0.8, 0.6, 3.7], look: [0, 2.0, 0], fov: 54, roll: 0.03 },
      { f: B.tv, e: "cut", pos: [0.55, 1.62, 2.7], look: [0, 1.55, 0], fov: 42, roll: -0.02 },
    ], f, 0.0026); break;
    case 2: cam = path([ // three women he cannot find
      { f: a, pos: [0.3, 1.25, 4.2], look: [0, 2.1, 0], fov: 52, roll: 0.02 },
    ], f, 0.003); break;
    case 3: cam = path([ // a burger on the stone bench, in the rain
      { f: a, pos: c(4.35, 0.84, 2.55), look: c(3.5, 0.5, BENCH_MID), fov: 40, roll: -0.03 },
      { f: S.b, d: S.b - a, e: "s", pos: c(4.05, 0.78, 2.15), look: c(3.5, 0.52, BENCH_MID), fov: 38, roll: 0 },
    ], f); break;
    case 4: cam = path([ // the room in Madeira: sleeping siblings -> the boy at the window
      { f: a, pos: h(0.9, 1.5, 0.4), look: h(-1.25, 1.25, -2.6), fov: 50, roll: 0.02 },
      { f: S.b, d: S.b - a, e: "s", pos: h(0.15, 1.45, -0.9), look: h(-0.45, 1.42, -2.8), fov: 44, roll: -0.02 },
    ], f); break;
    case 5: cam = path([ // a small plane crosses the moon
      { f: a, pos: [AIR[0], AIR[1], AIR[2] + 40], look: [AIR[0], AIR[1] + 2, AIR[2]], fov: 44, roll: -0.04 },
    ], f, 0.0012); break;
    case 6: cam = path([ // the boy alone in his seat
      { f: a, pos: pl(0.55, 1.5, -1.52), look: pl(0.22, 1.2, 0.56), fov: 54, roll: 0.03 },
      { f: S.b, d: S.b - a, e: "s", pos: pl(0.32, 1.38, -1.1), look: pl(0.1, 1.3, 0.56), fov: 44, roll: 0 },
    ], f); break;
    case 7: cam = path([ // the phone booth in the rain: he calls home
      { f: a, pos: [BOOTH[0] + 0.5, 1.5, BOOTH[2] + 3.4], look: [BOOTH[0], 1.25, BOOTH[2]], fov: 44, roll: -0.02 },
      { f: S.b, d: S.b - a, e: "s", pos: [BOOTH[0] + 0.12, 1.36, BOOTH[2] + 2.2], look: [BOOTH[0], 1.22, BOOTH[2]], fov: 40, roll: 0 },
    ], f); break;
    case 8: { const mx = walkX(f); cam = { pos: c(mx - 3.4, 1.3, 3.6), look: c(mx - 0.1, 1.15, 2.4), fov: 46, roll: 0.02 }; break; }
    case 9: cam = path([ // three boys in front of a closed door
      { f: a, pos: c(2.6, 1.5, 4.5), look: c(1.25, 1.35, 0.3), fov: 50 },
      { f: B.puerta + 4, d: 16, pos: c(2.5, 1.95, 3.9), look: c(1.2, 1.3, 0.3), fov: 46, roll: -0.03 },
    ], f); break;
    case 10: cam = path([ // the door opens: three employees -> Edna
      { f: a, pos: c(1.6, 2.15, 3.7), look: c(1.3, 1.45, -0.3), fov: 46 },
      { f: B.edna, e: "cut", pos: c(1.48, 1.66, 1.35), look: c(0.98, 1.6, -0.35), fov: 50, roll: 0.03 },
    ], f, 0.0026); break;
    case 11: cam = path([ // from inside: the bag goes out to the boys -> the three of them eating on the bench
      { f: a, pos: c(1.3, 1.6, -1.7), look: c(1.25, 1.3, 0.95), fov: 50, roll: -0.02 },
      { f: B.sinp, e: "cut", pos: c(3.6, 1.02, 4.68), look: c(3.6, 0.82, BENCH_Z), fov: 57, roll: 0.02 },
    ], f, 0.0022); break;
    case 12: cam = path([ // the empty bench, twenty years of rain
      { f: a, pos: c(3.6, 1.02, 4.68), look: c(3.6, 0.82, BENCH_Z), fov: 57, roll: 0.02 },
      { f: S.b, d: S.b - a, e: "s", pos: c(3.1, 2.7, 4.6), look: c(3.45, 0.55, BENCH_MID), fov: 54, roll: -0.02 },
    ], f); break;
    case 13: cam = path([ // the cup
      { f: a, pos: [1.0, 0.6, 4.2], look: [0, 2.1, 0], fov: 54, roll: 0.04 },
      { f: S.b, d: S.b - a, e: "s", pos: [-0.7, 0.75, 3.6], look: [0, 2.15, 0], fov: 50, roll: -0.03 },
    ], f); break;
    case 14: cam = path([ // the door today: shut, dark
      { f: a, pos: c(3.0, 1.6, 4.5), look: c(1.3, 1.4, 0.2), fov: 50, roll: 0.02 },
      { f: S.b, d: S.b - a, e: "s", pos: c(2.0, 1.45, 3.4), look: c(1.3, 1.35, 0.2), fov: 44, roll: 0 },
    ], f); break;
    case 15: cam = path([ // the man with the flower
      { f: a, pos: c(2.6, 1.7, 4.7), look: c(1.3, 1.5, 1.0), fov: 48, roll: -0.02 },
      { f: B.devol + 4, d: 14, pos: c(1.9, 1.6, 3.6), look: c(1.3, 1.5, 1.2), fov: 42, roll: 0.02 },
    ], f); break;
    case 16: cam = path([ // Paula walks into the lamplight
      { f: a, pos: c(1.8, 1.6, 5.4), look: c(1.95, 1.5, 1.3), fov: 50, roll: 0.02 },
      { f: B.siva, d: 30, e: "s", pos: c(1.95, 1.6, 4.7), look: c(1.95, 1.45, 1.3), fov: 46, roll: 0 },
    ], f); break;
    case 17: cam = path([ // the two of them on the bench with a paper bag
      { f: a, pos: c(3.56, 1.12, 4.6), look: c(3.54, 0.94, BENCH_Z), fov: 51, roll: -0.02 },
    ], f, 0.0024); break;
    default: cam = path([ // the same door again -> up over the street
      { f: a, pos: c(1.75, 1.4, 4.4), look: c(1.5, 1.3, 0.3), fov: 46, roll: 0.02 },
      { f: S.b - 4, d: S.b - 4 - (B.knock + 12), e: "s", pos: c(5.4, 6.4, 4.0), look: c(1.0, 1.6, 0.9), fov: 56, roll: -0.02 },
    ], f); break;
  }
  const k = kick(f);
  return { ...cam, pos: [cam.pos[0], cam.pos[1] + k, cam.pos[2]], look: [cam.look[0], cam.look[1] + k * 0.6, cam.look[2]] };
};

/** lens blur per beat: cInf px at 1080 (0 = sharp), optional focus point (default: the camera's look point) */
export const dofAt = (f: number): { cInf: number; focus?: (f: number) => V3 } => {
  const id = shotAt(f).id;
  if (id === 5) return { cInf: 0 };
  if (id === 3) return { cInf: 14 };
  if (id === 18) return f < B.knock + 12 ? { cInf: 8 } : { cInf: 0 };
  if (id === 12) return { cInf: 5 };
  if (id === 4 || id === 7) return { cInf: 7 };
  return { cInf: 9 };
};

// ---------------- real scene lights (point lights, max 6) + screen-space finishing ----------------
export type Lamp = { p: V3; c: string; i: number; d: number };
const flick = (f: number, s: number) => 1 + 0.08 * Math.sin(f * 0.9 + s) + 0.05 * Math.sin(f * 2.3 + s * 3);
/** how far the door is open / lit in shot 18 (0..1) */
export const doorK = (id: number, f: number) => (id === 10 || id === 11 ? 1 : id === 18 ? ramp(f, B.knock + 14, B.knock + 30) : 0);
export const lampsAt = (id: number, f: number): Lamp[] => {
  const s = SHOTS[id - 1], Lm: Lamp[] = [];
  if (s.place === "street") {
    Lm.push({ p: c(-1.2, 3.9, 4.25), c: "#ffb45a", i: 5.5, d: 14 }, { p: c(5.2, 3.9, 0.65), c: "#ffb45a", i: 5.5, d: 14 }, { p: c(13, 3.9, 4.25), c: "#ffb45a", i: 5.0, d: 14 });
    const k = doorK(id, f);
    if (k > 0) Lm.push({ p: c(1.25, 1.7, 0.7), c: "#ffc070", i: 3.6 * k, d: 7 }, { p: c(0.9, 2.3, -2.2), c: "#ffc070", i: 2.6 * k, d: 8 });
    if (id === 7) Lm.push({ p: [BOOTH[0], 2.1, BOOTH[2]], c: "#e8f0ff", i: 2.6 * flick(f, 1), d: 5 });
    if (id === 3) Lm.push({ p: c(3.6, 1.3, 1.7), c: "#ffd9a0", i: 1.6, d: 4 });
  } else if (s.place === "home") {
    Lm.push({ p: h(0, 1.95, -1.7), c: "#ffc070", i: 1.5 * flick(f, 2), d: 6 }, { p: h(-0.4, 1.5, -2.5), c: "#9fb8ff", i: 1.8, d: 5 });
  } else if (s.place === "plane") {
    for (const dx of [-3.2, 0.4, 4]) Lm.push({ p: pl(dx, 1.9, 0), c: "#cfd8ff", i: 1.0, d: 8 });
    Lm.push({ p: pl(0.25, 1.6, 1.0), c: "#ffe2b0", i: 1.1, d: 4 });
  } else if (s.place === "stadium" && s.light === "night") {
    Lm.push({ p: [-3, 5, 6], c: "#fff4e0", i: 9, d: 30 }, { p: [4, 5, 5], c: "#fff4e0", i: 8, d: 30 }, { p: [0, 6, -5], c: "#e8f0ff", i: 6, d: 30 });
  }
  return Lm.slice(0, 6);
};
export type Pool = { p: V3; r: number };
export type Glow = { p: V3; r: number; col: string; a: number };
export type Lighting = { wash?: { col: string; a: number }; pools: Pool[]; glows: Glow[]; vig: number; beams?: number; tint?: { col: string; a: number } };
export const lightingAt = (id: number, f: number): Lighting => {
  const s = SHOTS[id - 1], Lg: Lighting = { pools: [], glows: [], vig: s.light === "night" ? 0.55 : 0.35 };
  if (s.place === "street") {
    for (const p of [c(-1.2, 3.9, 4.25), c(5.2, 3.9, 0.65)]) Lg.glows.push({ p, r: 0.9, col: "#ffcf80", a: 0.45 });
    const k = doorK(id, f); if (k > 0) Lg.glows.push({ p: c(1.25, 1.3, 0.2), r: 1.5, col: "#ffcf80", a: 0.4 * k });
    if (id === 7) Lg.glows.push({ p: [BOOTH[0], 1.7, BOOTH[2]], r: 1.1, col: "#e8f0ff", a: 0.35 });
    if (id === 12 || id === 14) Lg.tint = { col: "#3a4a8a", a: 0.12 };
  }
  if (id === 1 || id === 2) Lg.beams = 0.4;
  if (id === 13) Lg.beams = 0.45;
  if (id === 4) Lg.glows.push({ p: h(-0.35, 1.4, -2.95), r: 0.9, col: "#9fb8ff", a: 0.35 }, { p: h(0, 2.0, -1.7), r: 0.5, col: "#ffcf80", a: 0.4 });
  if (id === 5) Lg.glows.push({ p: [AIR[0] + 5, AIR[1] + 9, AIR[2] - 30], r: 9, col: "#dfe8ff", a: 0.4 });
  return Lg;
};
