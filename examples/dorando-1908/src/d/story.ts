// "Te quitan la medalla": Dorando Pietri, London 1908, all inside the stadium, one continuous camera.
import { LINES, TOTAL as TT } from "./timing";
import { HE, WCITY } from "./geo";
import type { LightK } from "./lights";
import { getInputProps } from "remotion";
export const FPS = 30, TOTAL = TT;
export type V3 = [number, number, number];
export type Light = LightK;
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * u * (u * (u * 6 - 15) + 10); };
export const ease = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const lerp3 = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
export const ramp = (f: number, a: number, b: number) => clamp01((f - a) / (b - a));
const L = (l: number) => LINES[l - 1][0], E = (l: number) => LINES[l - 1][1];
export const A = (l: number, t = 0) => Math.round(L(l) + (E(l) - L(l)) * t);
export const B = { hook: 0, londres: L(2) - 6, gira: A(2, 0.62), cae: L(3) - 4, momento: L(4) - 4, jueces: A(4, 0.3), meta: E(4) - 14, veras: L(5) - 6, hayes: A(5, 0.25), descal: A(5, 0.55), oro: A(5, 0.8), reina: L(6) - 8, copa: A(6, 0.55), end: TT };
export type ShotDef = { id: number; a: number; b: number; light: Light; place: string; sun?: [number, number]; night?: boolean; fog?: [number, number]; indoor?: boolean };
export const SHOTS: ShotDef[] = [{ id: 1, a: 0, b: TT, light: "day", place: "e", sun: [205, 44] }];
export const XFADE: Record<number, number> = {};
export const FLASH_AT = -100, FLASH2 = -100;
export const shotAt = (_f: number) => SHOTS[0];
export const layersAt = (_f: number) => [{ id: 1, alpha: 1 }];
// ---- places on the north straight of the 1908 stadium ----
export const X0 = WCITY.x, LANE = WCITY.z - 46, FIN: V3 = [X0, 0, LANE], TUN: V3 = [X0 + 42, 0, WCITY.z - 55.4], ROYAL: V3 = [X0, 3.2, WCITY.z - 58.4];
const g = (x: number, z: number): V3 => [x, HE(x, z) + 0.04, z];
/** where Dorando is, what he is doing (k = 0..1 within a fall or a rise) */
export type DM = { p: V3; mode: "walk" | "fall" | "lie" | "up" | "held" | "stand" | "cup"; k: number; dir: number };
const FALLS: [number, number][] = [[B.cae + 8, B.cae + 40], [B.cae + 82, B.cae + 116], [B.cae + 156, B.momento + 22]];
export const dorAt = (f: number): DM => {
  const xs: [number, number][] = [[0, X0 + 42], [60, X0 + 41], [B.londres, X0 + 34], [B.gira - 10, X0 + 30], [B.gira + 30, X0 + 35], [B.gira + 60, X0 + 33], [B.cae + 8, X0 + 28], [B.cae + 82, X0 + 22], [B.cae + 156, X0 + 16], [B.jueces + 16, X0 + 16], [B.meta, X0 - 0.6], [TT, X0 - 1.2]];
  let x = xs[0][1]; for (let i = 0; i + 1 < xs.length; i++) if (f >= xs[i][0] && f < xs[i + 1][0]) { const t = (f - xs[i][0]) / (xs[i + 1][0] - xs[i][0]); x = lerp(xs[i][1], xs[i + 1][1], t); break; } if (f >= xs[xs.length - 1][0]) x = xs[xs.length - 1][1];
  const z = f < 60 ? lerp(TUN[2] + 0.6, LANE, ease(f / 60)) : LANE, p = g(x, z), dir = f > B.gira - 10 && f < B.gira + 30 ? 1 : -1;
  if (f >= B.reina - 30) { const t = ease(ramp(f, B.reina - 30, B.reina + 10)), q = g(lerp(X0 - 1.2, X0 - 0.4, t), lerp(LANE, ROYAL[2] + 4.4, t)); return { p: q, mode: f < B.reina + 10 ? "walk" : "cup", k: 0, dir: -1 }; }
  for (const [a, b] of FALLS) { if (f >= a && f < a + 12) return { p, mode: "fall", k: (f - a) / 12, dir }; if (f >= a + 12 && f < b) return { p, mode: "lie", k: 1, dir }; if (f >= b && f < b + 12 && b < B.jueces) return { p, mode: "up", k: (f - b) / 12, dir }; }
  if (f >= B.jueces + 16 && f < B.meta + 10) return { p, mode: "held", k: 0, dir: -1 };
  if (f >= B.meta + 10) return { p, mode: "stand", k: 0, dir: -1 };
  return { p, mode: "walk", k: 0, dir };
};
export const hayesAt = (f: number): V3 => { const t = ramp(f, B.hayes, B.hayes + 80); const z = lerp(TUN[2] + 0.6, LANE + 1.6, ramp(f, B.hayes, B.hayes + 14)), x = lerp(X0 + 42, X0 - 6, t * (2 - t)); return g(x, z); };
// ---- the camera ----
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
type Rig = (f: number) => Cam;
type Key = { f: number; rig: Rig; blend: number; arc?: number };
const add3 = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const dolly = (f0: number, f1: number, p0: V3, p1: V3, l0: V3, l1: V3, fov0 = 50, fov1 = fov0): Rig => (f) => { const t = smooth(ramp(f, f0, f1)) * 0.6 + ramp(f, f0, f1) * 0.4; return { pos: lerp3(p0, p1, t), look: lerp3(l0, l1, t), fov: lerp(fov0, fov1, t), roll: 0 }; };
const KEYS: Key[] = [];
{ const b = B, D = (f: number) => dorAt(f).p;
  // HOOK: down out of the roaring stands to the tunnel as he staggers out of it
  KEYS.push({ f: 0, blend: 0, rig: dolly(0, b.londres + 10, [X0 + 26, 14, LANE + 26], [X0 + 30, 1.7, LANE + 7.5], add3(TUN, [0, 4, 0]), [X0 + 36, 1.2, LANE], 54, 50) });
  // LONDRES / GIRA: alongside him; he turns the wrong way and back
  KEYS.push({ f: b.londres + 10, blend: 30, rig: (f) => { const p = D(f), t = ramp(f, b.londres + 10, b.cae); return { pos: [p[0] + lerp(-3, 2, t), p[1] + lerp(1.7, 1.4, t), p[2] + lerp(7.2, 6.2, t)], look: [p[0] + lerp(-1, 0, t), p[1] + 1.05, p[2]], fov: 50, roll: 0 }; } });
  // CAE: round him as he falls, gets up, falls again
  KEYS.push({ f: b.cae, blend: 26, rig: (f) => { const p = D(f), t = ramp(f, b.cae, b.momento), a = lerp(0.35, -0.55, t), r = lerp(6.2, 5.2, t); return { pos: [p[0] + r * Math.sin(a), p[1] + lerp(1.4, 1.1, t), p[2] + r * Math.cos(a)], look: [p[0], p[1] + 0.7, p[2]], fov: 50, roll: 0 }; } });
  // JUECES: ahead of them as the two officials hold him up to the line
  KEYS.push({ f: b.momento, blend: 30, rig: (f) => { const p = D(f), t = ramp(f, b.momento, b.veras); return { pos: [p[0] - lerp(5.5, 7, t), p[1] + lerp(1.5, 1.8, t), p[2] + lerp(4.2, 5.6, t)], look: [p[0] - 0.5, p[1] + 1.0, p[2] - 0.3], fov: 50, roll: 0 }; } });
  // VERAS: back and up: the American comes in and wins; the protest
  KEYS.push({ f: b.veras, blend: 34, rig: dolly(b.veras, b.reina - 10, [X0 - 8, 2.8, LANE + 15], [X0 - 3, 2.3, LANE + 11], [X0 + 3.5, 1.2, LANE], [X0 + 0.5, 1.2, LANE - 0.5], 54, 50) });
  // REINA: low under the royal box, the queen hands down the cup; rise up over the stadium to finish
  KEYS.push({ f: b.reina - 10, blend: 30, rig: (f) => { const t = ramp(f, b.reina - 10, TT); return { pos: [X0 + lerp(-3.6, 2.6, t), lerp(1.3, 4.5, t * t), ROYAL[2] + lerp(10, 15, t)], look: [X0 + lerp(-0.6, 0, t), lerp(2.8, 3.6, t), ROYAL[2] + lerp(2, 0, t)], fov: lerp(50, 54, t), roll: 0 }; } });
}
const DBG = (getInputProps() as { cam?: { pos: V3; look: V3; fov?: number } }).cam;
export const camAt = (_id: number, f: number): Cam => {
  if (DBG) return { pos: DBG.pos, look: DBG.look, fov: DBG.fov ?? 50, roll: 0 };
  let i = 0; while (i + 1 < KEYS.length && f >= KEYS[i + 1].f) i++;
  const k = KEYS[i]; let c = k.rig(f);
  if (i > 0 && k.blend > 0 && f < k.f + k.blend) { const t = smooth((f - k.f) / k.blend), p = KEYS[i - 1].rig(f); c = { pos: lerp3(p.pos, c.pos, t), look: lerp3(p.look, c.look, t), fov: lerp(p.fov, c.fov, t), roll: lerp(p.roll, c.roll, t) }; const hump = (k.arc ?? 0) * Math.sin(Math.PI * t); c.pos[1] += hump; c.look[1] += hump * 0.85; }
  return { ...c, pos: [c.pos[0] + 0.012 * Math.sin(f * 0.11), c.pos[1] + 0.008 * Math.sin(f * 0.17), c.pos[2]], roll: c.roll + 0.004 * Math.sin(f * 0.09) };
};
export const dofAt = (f: number): { cInf: number; focus?: (f: number) => V3 } => { const c = camAt(0, f), d = Math.hypot(c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]); return { cInf: d < 9 ? 4 : d < 14 ? 2 : 0 }; };
export type Lamp = { p: V3; c: string; i: number; d: number };
export const lampsAt = (_id: number, _f: number): Lamp[] => [];
export type Pool = { p: V3; r: number };
export type Glow = { p: V3; r: number; col: string; a: number };
export type Lighting = { wash?: { col: string; a: number }; pools: Pool[]; glows: Glow[]; vig: number; beams?: number; tint?: { col: string; a: number } };
export const lightingAt = (_id: number, _f: number): Lighting => ({ pools: [], glows: [], vig: 0.24, beams: 0.08, tint: { col: "#f0c890", a: 0.04 } });
export const KICKS: number[] = [];
