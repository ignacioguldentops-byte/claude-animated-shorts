// "Al revés" (the wrong-way run): timeline of the short. Every beat derives from timing.ts (start/end frame of each narrated line),
// so the picture re-times itself when the narration changes.
// Camera grammar from the skill: cuts on big jumps, ease-out glides, every hold creeps, kicks on impacts.
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
  arrive: A(1, 0.46), celeb: A(1, 0.62), gift: A(1, 0.77), hero: L(2) - CUT, duros: A(2, 0.5), game: L(3) - CUT, suelto: A(3, 0.33), recoge: A(3, 0.5), gira: A(3, 0.7), corre: A(3, 0.86),
  nadie: L(4) - CUT, gritan: A(4, 0.36), cree: L(5) - CUT, fondo: L(6) - CUT, lanza: A(6, 0.42), rival: L(7) - CUT, gracias: A(7, 0.62), espera: L(8) - CUT, como: A(8, 0.24),
  veras: L(9) - CUT, giro: A(9, 0.16), casco: A(9, 0.5), ruido: A(9, 0.62), adren: A(9, 0.74), norte: A(9, 0.86), mejor: L(10) - CUT, jugada: A(10, 0.36), antes: A(10, 0.8),
  carta: L(11) - CUT, otro: A(11, 0.42), y1929: A(11, 0.78), club: L(12) - CUT, risa: A(12, 0.7), veinte: L(13) - CUT, mundo: L(14) - CUT, reves: A(14, 0.55), end: TT,
};
export type Place = "stadium";
export type ShotDef = { id: number; a: number; b: number; light: Light; place: Place; sun?: [number, number] };
const mk = (id: number, a: number, b: number, light: Light = "day"): ShotDef => ({ id, a, b, place: "stadium", light, sun: light === "golden" ? [200, 16] : [150, 52] });
export const SHOTS: ShotDef[] = [
  mk(1, 0, B.arrive),            // he ran sixty metres
  mk(2, B.arrive, B.gift),       // reached the end zone, celebrated
  mk(3, B.gift, B.hero),         // ...and gave the other team two points
  mk(4, B.hero, B.game),         // Jim Marshall, one of the toughest
  mk(5, B.game, B.recoge),       // Minnesota v San Francisco: a loose ball
  mk(6, B.recoge, B.nadie),      // he picks it up, spins, and runs
  mk(7, B.nadie, B.gritan),      // nobody catches him
  mk(8, B.gritan, B.cree),       // his team-mates yell from the sideline
  mk(9, B.cree, B.fondo),        // he thinks they are cheering
  mk(10, B.fondo, B.rival),      // throws the ball into the stands
  mk(11, B.rival, B.espera),     // a rival thanks him
  mk(12, B.espera, B.veras),     // wait: how?
  mk(13, B.veras, B.mejor),      // he spun; helmet, noise, adrenaline: he lost his bearings
  mk(14, B.mejor, B.carta),      // his team won anyway, thanks to a play he had forced
  mk(15, B.carta, B.y1929, "golden"), // a letter from another player
  mk(16, B.y1929, B.club),       // ...who had done the same in 1929
  mk(17, B.club, B.veinte, "golden"), // welcome to the club
  mk(18, B.veinte, B.mundo),     // twenty seasons without missing a game
  mk(19, B.mundo, TT),           // remembered for the sixty metres he ran backwards
];
export const XFADE: Record<number, number> = { 15: 8, 16: 8, 17: 8 };
export const FLASH_AT = B.hero;
export const FLASH2 = B.mejor;
export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};

// ---------------- shared positions / motion (field: x = +-45.72 goal lines, purple end zone at -x, sidelines z = +-24.4) ----------------
export const GOAL = -45.72, PICK: V3 = [14.6, 0, 1.0], EZ: V3 = [-49.6, 0, 0], BENCH_Z = -27.6, BOARD: V3 = [-59.92, 7.45, 0];
/** Marshall's x in the running shots */
export const runX = (id: number, f: number) => {
  const s = SHOTS[id - 1], u = (f - s.a) / (s.b - s.a);
  if (id === 1) return lerp(12, -30, u);
  if (id === 7) return lerp(7, -14, u);
  if (id === 9) return lerp(-17, -27, u);
  if (id === 16) return lerp(6, -9, u);
  if (id === 19) return lerp(-18, -23, u);
  return 0;
};
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
export const KICKS: number[] = [B.celeb, B.gift + 12, B.duros, B.duros + 14, B.suelto, B.gracias + 16, B.como, B.jugada + 14, B.reves + 20];
const kick = (f: number) => { for (const k of KICKS) { const d = f - k; if (d >= 0 && d < 7) return (d % 2 ? -1 : 1) * 0.045 * (1 - d / 7); } return 0; };

export const camAt = (id: number, f: number): Cam => {
  let cam: Cam; const S = SHOTS[id - 1], a = S.a, mx = runX(id, f), bob = 0.03 * Math.sin(f * 0.9);
  switch (id) {
    case 1: cam = { pos: [mx - 0.5, 1.25 + bob, 4.5], look: [mx - 0.7, 1.2, 0], fov: 46, roll: 0.03 }; break;
    case 2: cam = path([
      { f: a, pos: [-46.2, 1.0, 2.7], look: [-49.6, 1.25, 0], fov: 50, roll: -0.03 },
      { f: B.celeb + 4, d: 10, pos: [-47.2, 0.6, 2.9], look: [-49.6, 1.7, 0], fov: 50, roll: 0.04 },
    ], f, 0.003); break;
    case 3: cam = path([
      { f: a, pos: [-46.6, 1.4, 0.9], look: [-59.5, 5.6, 0], fov: 52 },
      { f: B.gift + 16, d: 10, pos: [-48.2, 1.9, 0.6], look: [-59.9, 6.4, 0], fov: 48, roll: -0.03 },
    ], f); break;
    case 4: cam = path([
      { f: a, pos: [1.0, 0.55, 3.3], look: [0, 1.3, 0], fov: 48, roll: 0.04 },
      { f: B.duros - 6, d: 14, pos: [0.6, 0.6, 4.6], look: [0, 1.25, 0], fov: 50, roll: 0 },
      { f: B.duros + 52, d: 14, e: "s", pos: [-0.4, 0.7, 3.6], look: [0, 1.35, 0], fov: 46, roll: -0.03 },
    ], f, 0.003); break;
    case 5: cam = path([
      { f: a, pos: [16.5, 6.2, 14.5], look: [18.2, 0.8, 0], fov: 50, roll: -0.02 },
      { f: B.suelto + 6, d: 10, pos: [16.2, 1.3, 5.0], look: [15.4, 0.5, 1.0], fov: 44, roll: 0.03 },
    ], f); break;
    case 6: cam = path([
      { f: a, pos: [15.7, 1.2, 4.9], look: [14.6, 1.0, 1.0], fov: 46 },
      { f: B.gira, d: 10, pos: [14.9, 1.3, 4.3], look: [14.6, 1.15, 1.0], fov: 44, roll: 0.04 },
      { f: S.b, d: S.b - B.corre, pos: [10.4, 1.4, 5.6], look: [8.6, 1.1, 1.0], fov: 50, roll: -0.03 },
    ], f); break;
    case 7: cam = { pos: [mx + 6, 8.5, 22], look: [mx + 4.6, 0.8, 0], fov: 54, roll: 0.02 }; break;
    case 8: cam = path([
      { f: a, pos: [-2.9, 1.6, -18.6], look: [-3.2, 1.2, -26.4], fov: 58, roll: 0.03 },
    ], f, 0.003); break;
    case 9: cam = { pos: [mx - 0.3, 1.3 + bob, 3.6], look: [mx - 0.4, 1.25, 0], fov: 44, roll: -0.03 }; break;
    case 10: cam = path([
      { f: a, pos: [-43.4, 1.5, 6.4], look: [-50.2, 1.8, 0], fov: 50 },
      { f: B.lanza + 8, d: 10, pos: [-44.2, 1.2, 5.8], look: [-52, 2.8, 0.3], fov: 52, roll: 0.03 },
    ], f); break;
    case 11: cam = path([
      { f: a, pos: [-46.9, 1.35, 4.4], look: [-48.9, 1.3, 0], fov: 46 },
      { f: B.gracias + 18, d: 10, pos: [-48.6, 1.45, 2.9], look: [-49.4, 1.45, 0], fov: 42, roll: 0.04 },
    ], f); break;
    case 12: cam = path([
      { f: a, pos: [-49.4, 1.5, 2.4], look: [-49.6, 1.6, 0], fov: 42, roll: -0.05 },
      { f: B.como, e: "cut", pos: [-16.5, 78, 0.6], look: [-16.5, 0, 0], fov: 56, roll: Math.PI / 2 },
    ], f, 0.0012); break;
    case 13: cam = path([
      { f: a, pos: [15.6, 1.3, 4.8], look: [14.6, 1.15, 1.0], fov: 46, roll: 0.03 },
      { f: B.casco, e: "cut", pos: [14.75, 1.5, 3.1], look: [14.6, 1.52, 1.0], fov: 46, roll: -0.04 },
      { f: B.norte, e: "cut", pos: [15.0, 1.5, 3.9], look: [14.6, 1.95, 1.0], fov: 46, roll: 0.03 },
    ], f, 0.0026); break;
    case 14: cam = path([
      { f: a, pos: [-46.8, 1.5, -0.9], look: [-59.5, 5.4, 0], fov: 52, roll: 0.03 },
      { f: B.jugada, e: "cut", pos: [20.2, 1.4, 6.8], look: [20.0, 1.0, 0], fov: 48, roll: -0.03 },
    ], f); if (f >= B.jugada + 26) { const ex = 22 + (f - (B.jugada + 26)) * 0.3, k = smooth(ramp(f, B.jugada + 26, B.jugada + 40)); cam = { pos: [lerp(20.2, ex + 0.8, k), 1.4, 6.8], look: [lerp(20.0, ex + 0.3, k), 1.05, lerp(0, 1.0, k)], fov: 48, roll: -0.03 }; } break;
    case 15: cam = path([
      { f: a, pos: [1.4, 1.6, -21.5], look: [-0.9, 1.0, -27.2], fov: 50 },
      { f: B.otro + 10, d: 30, e: "s", pos: [-0.3, 1.25, -23.8], look: [-0.9, 1.05, -27.2], fov: 44, roll: -0.02 },
    ], f); break;
    case 16: cam = { pos: [mx + 0.6, 1.3 + bob, 5.8], look: [mx, 1.2, 0], fov: 48, roll: -0.04 }; break;
    case 17: cam = path([
      { f: a, pos: [-0.75, 1.2, -24.9], look: [-0.85, 1.12, -26.6], fov: 42, roll: 0.03 },
      { f: B.risa + 4, d: 12, pos: [-0.5, 1.35, -24.0], look: [-0.9, 1.25, -27.2], fov: 44, roll: 0 },
    ], f); break;
    case 18: cam = path([
      { f: a, pos: [1.6, 1.15, 4.3], look: [0, 1.2, 0], fov: 46, roll: 0.02 },
      { f: S.b, d: S.b - a, e: "s", pos: [-1.6, 1.3, 3.9], look: [0, 1.25, 0], fov: 44, roll: -0.02 },
    ], f); break;
    default: cam = path([
      { f: a, pos: [-17.4, 1.9, 6.6], look: [-20.4, 1.0, 0.6], fov: 50, roll: 0.02 },
      { f: B.reves, e: "cut", pos: [-46.8, 1.35, 4.2], look: [-48.9, 1.3, 0], fov: 46, roll: -0.03 },
    ], f, 0.0024); break;
  }
  const k = kick(f);
  return { ...cam, pos: [cam.pos[0], cam.pos[1] + k, cam.pos[2]], look: [cam.look[0], cam.look[1] + k * 0.6, cam.look[2]] };
};

/** lens blur per beat: cInf px at 1080 (0 = sharp) */
export const dofAt = (f: number): { cInf: number; focus?: (f: number) => V3 } => {
  const id = shotAt(f).id;
  if (id === 7 || (id === 12 && f >= B.como) || (id === 5 && f < B.suelto)) return { cInf: 0 };
  if (id === 3 || id === 14) return { cInf: 4 };
  return { cInf: id === 1 || id === 9 || id === 16 ? 9 : 8 };
};
export type Lamp = { p: V3; c: string; i: number; d: number };
export const lampsAt = (_id: number, _f: number): Lamp[] => [];
export type Pool = { p: V3; r: number };
export type Glow = { p: V3; r: number; col: string; a: number };
export type Lighting = { wash?: { col: string; a: number }; pools: Pool[]; glows: Glow[]; vig: number; beams?: number; tint?: { col: string; a: number } };
export const lightingAt = (id: number, f: number): Lighting => {
  const Lg: Lighting = { pools: [], glows: [], vig: 0.3 };
  if (id === 16) { Lg.tint = { col: "#a8763a", a: 0.42 }; Lg.vig = 0.6; }
  if (id === 14 && f >= B.jugada) Lg.tint = { col: "#5a78d0", a: 0.14 };
  if (id === 13) Lg.vig = 0.5;
  if (id === 4) Lg.beams = 0.4;
  if (id === 15 || id === 17) Lg.beams = 0.35;
  return Lg;
};
