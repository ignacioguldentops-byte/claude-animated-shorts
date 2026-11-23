// "El perro que encontró la Copa": timeline, where everyone is, and the camera of each place. Beats derive from
// timing.ts. Five shots, joined by short crossfades while both cameras keep moving:
// 1 hook (the street at night, Pickles at the hedge) · 2 the exhibition hall (the theft) · 3 the chairman's office
// (parcel, letter, police) · 4 the street again (the walk, the find) · 5 the champions' banquet.
import { LINES, TOTAL as TT } from "./timing";
import { HALL, OFFICE, STREET, BANQ, VITRINE, DESK, BUSH, TABLE } from "./setsw";
import type { LightK } from "./lights";
export const FPS = 30, TOTAL = TT;
export type V3 = [number, number, number];
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * u * (u * (u * 6 - 15) + 10); };
export const ease = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const lerp3 = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
export const ramp = (f: number, a: number, b: number) => clamp01((f - a) / (b - a));
const L = (l: number) => LINES[l - 1][0], E = (l: number) => LINES[l - 1][1];
export const A = (l: number, t = 0) => Math.round(L(l) + (E(l) - L(l)) * t);
const cut = (a: number, b: number) => Math.round((E(a) + L(b)) / 2);
export const B = {
  londres: L(2), vitrina: A(2, 0.42), roba: A(2, 0.78), paquete: L(3), trozo: A(3, 0.42), carta: A(3, 0.66), policia: L(4), sospechoso: A(4, 0.3), nada: A(4, 0.62),
  momento: L(5), semana: A(5, 0.3), pickles: A(5, 0.85), veras: L(6), olfatea: A(6, 0.18), envuelta: A(6, 0.45), copa: A(6, 0.74), gano: L(7), banquete: A(7, 0.42), perro: A(7, 0.8), end: TT };
export const CUTS = [0, cut(1, 2), cut(2, 3), cut(4, 5), cut(6, 7), TT];
export type ShotDef = { id: number; a: number; b: number; light: LightK; place: "street" | "hall" | "office" | "banquet" };
export const SHOTS: ShotDef[] = [
  { id: 1, a: CUTS[0], b: CUTS[1], light: "night", place: "street" }, { id: 2, a: CUTS[1], b: CUTS[2], light: "day", place: "hall" }, { id: 3, a: CUTS[2], b: CUTS[3], light: "day", place: "office" },
  { id: 4, a: CUTS[3], b: CUTS[4], light: "night", place: "street" }, { id: 5, a: CUTS[4], b: TT, light: "day", place: "banquet" }];
export const XF = 14;
export const FLASH_AT = -100, FLASH2 = -100;
export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
/** the base layer is the outgoing shot until the middle of the fade; the incoming shot fades in over it */
export const layersAt = (f: number) => { for (let i = 1; i < SHOTS.length; i++) { const c = SHOTS[i].a; if (f >= c - XF / 2 && f < c + XF / 2) return [{ id: SHOTS[i - 1].id, alpha: 1 }, { id: SHOTS[i].id, alpha: smooth((f - (c - XF / 2)) / XF) }]; } return [{ id: shotAt(f).id, alpha: 1 }]; };

// ---------------- where everyone is ----------------
const path = (pts: [number, number, number][], f: number): V3 => { // [frame, x, z] keys, eased between
  if (f <= pts[0][0]) return [pts[0][1], 0, pts[0][2]]; for (let i = 1; i < pts.length; i++) if (f <= pts[i][0]) { const a = pts[i - 1], b = pts[i], t = (f - a[0]) / (b[0] - a[0]), u = 0.15 * ease(t) + 0.85 * t; return [lerp(a[1], b[1], u), 0, lerp(a[2], b[2], u)]; }
  const l = pts[pts.length - 1]; return [l[1], 0, l[2]]; };
const moving = (pts: [number, number, number][], f: number) => { for (let i = 1; i < pts.length; i++) if (f > pts[i - 1][0] && f < pts[i][0] && Math.hypot(pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]) > 0.05) return true; return false; };
const head = (pts: [number, number, number][], f: number): [number, number] => { const a = path(pts, f - 3), b = path(pts, f + 3), dx = b[0] - a[0], dz = b[2] - a[2], d = Math.hypot(dx, dz); return d > 1e-4 ? [dx / d, dz / d] : [0, 0]; };
export type Walker = { p: V3; walk: boolean; h: [number, number] };
const walker = (pts: [number, number, number][]) => (f: number): Walker => ({ p: path(pts, f), walk: moving(pts, f), h: head(pts, f) });
// hall: the thief comes in by the south door, takes the cup and walks out with it
const [VX, , VZ] = VITRINE;
export const GRAB = B.roba - 8, GRAB_END = GRAB + 26;
export const THIEF_AT = walker([[B.vitrina + 20, VX - 1.5, HALL.z + 8.6], [GRAB - 6, VX - 0.3, VZ + 1.05], [GRAB_END + 4, VX - 0.3, VZ + 1.05], [CUTS[2] + 20, VX - 1.4, HALL.z + 8.6]]);
export const GUARD_AT: V3 = [VX + 3.3, 0, VZ - 1.9];
// office
export const BOSS_AT: V3 = [DESK[0], 0, DESK[2] - 0.8];
export const DETS_IN = B.policia - 34;
export const SUSP_AT = walker([[DETS_IN + 4, OFFICE.x - 2.8, OFFICE.z + 5.6], [DETS_IN + 40, OFFICE.x - 2.0, OFFICE.z + 2.6], [B.sospechoso + 2, OFFICE.x + 0.05, DESK[2] + 2.0]]);
export const DET1_AT = walker([[DETS_IN - 16, OFFICE.x - 2.8, OFFICE.z + 5.6], [DETS_IN + 18, OFFICE.x - 2.6, OFFICE.z + 2.2], [B.sospechoso - 4, OFFICE.x - 0.8, DESK[2] + 2.25]]);
export const DET2_AT = walker([[DETS_IN + 24, OFFICE.x - 2.8, OFFICE.z + 5.6], [DETS_IN + 58, OFFICE.x - 1.2, OFFICE.z + 3.0], [B.sospechoso + 14, OFFICE.x + 0.9, DESK[2] + 2.3]]);
// street: house with the blue door, out of the gate, along the pavement to the hedge
const GATE_X = STREET.x - 35 - 4 + 4 * 9.2, DOOR_Z = -10.0, PAVE = -3.95;
export const OWNER_AT = walker([[CUTS[3] - 10, GATE_X, DOOR_Z + 0.5], [B.semana + 20, GATE_X, -5.4], [B.semana + 44, GATE_X + 0.9, PAVE], [B.olfatea - 6, BUSH[0] - 2.2, PAVE], [B.envuelta - 14, BUSH[0] - 0.95, PAVE + 0.1], [B.envuelta + 6, BUSH[0] + 0.55, PAVE + 0.3], [B.envuelta + 22, BUSH[0] + 0.52, BUSH[2] + 0.42]]);
export const DOG_AT = walker([[CUTS[3] - 10, GATE_X + 0.4, DOOR_Z + 1.3], [B.semana + 6, GATE_X + 0.4, -5.0], [B.semana + 16, GATE_X + 0.45, PAVE + 0.35], [B.semana + 30, GATE_X + 1.9, PAVE + 0.35], [B.olfatea - 30, BUSH[0] - 1.9, PAVE + 0.15], [B.olfatea - 6, BUSH[0] - 0.75, BUSH[2] + 0.45],
  [B.copa - 30, BUSH[0] - 0.75, BUSH[2] + 0.45], [B.copa - 10, BUSH[0] - 0.32, BUSH[2] + 0.95]]);
export const UNWRAP = B.copa - 12;
/** the street's pavements stand 0.12 m above the road; elsewhere the floor is at 0 */
export const floorAt = (x: number, z: number) => (x > 90 && x < 190 && Math.abs(z) > 3.1 && Math.abs(z) < 5.45 ? 0.12 : 0);
// banquet: Pickles on the chair across the table from the camera, next to the cup
export const DOG_CHAIR: V3 = [TABLE[0] + 0.42, 0.54, TABLE[2] + 1.22];
export { HALL, OFFICE, STREET, BANQ, VITRINE, DESK, BUSH, TABLE, GATE_X, PAVE };

// ---------------- the camera ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
type Rig = (f: number) => Cam;
type Key = { f: number; rig: Rig; blend: number; arc?: number };
const add3 = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const dolly = (f0: number, f1: number, p0: V3, p1: V3, l0: V3, l1: V3, fov0 = 50, fov1 = fov0, r0 = 0, r1 = 0): Rig => (f) => { const t = smooth(ramp(f, f0, f1)) * 0.6 + ramp(f, f0, f1) * 0.4; return { pos: lerp3(p0, p1, t), look: lerp3(l0, l1, t), fov: lerp(fov0, fov1, t), roll: lerp(r0, r1, t) }; };
const KEYS: Record<number, Key[]> = { 1: [], 2: [], 3: [], 4: [], 5: [] };
{ const b = B, bx = BUSH[0], bz = BUSH[2];
  // 1 HOOK: down at a dog's eye height on the night pavement, creeping in on Pickles nosing the hedge where something wrapped in paper lies
  KEYS[1].push({ f: 0, blend: 0, rig: dolly(-10, CUTS[1] + 10, [bx - 3.4, 0.75, bz + 3.0], [bx - 1.2, 0.6, bz + 2.35], [bx - 0.6, 0.5, bz + 0.1], [bx - 0.2, 0.4, bz], 50, 46, -0.03, 0.02) });
  // 2 HALL: in over the stamp cases and the visitors, down to the cup in its case; then from by the south door: the thief
  KEYS[2].push({ f: CUTS[1] - 10, blend: 0, rig: dolly(CUTS[1] - 10, b.vitrina, [HALL.x - 9.5, 4.2, HALL.z + 6.5], [VX - 1.6, 1.75, VZ + 3.0], [HALL.x - 2, 1.2, HALL.z - 3.5], [VX, 1.55, VZ], 54, 46) });
  KEYS[2].push({ f: b.vitrina + 26, blend: 40, arc: 0.6, rig: dolly(b.vitrina + 26, CUTS[2] + 10, [VX - 3.4, 1.6, VZ + 3.0], [VX - 3.9, 1.55, VZ + 3.6], [VX + 0.3, 1.25, VZ - 0.4], [VX - 0.4, 1.2, VZ + 0.8], 50, 50) });
  // 3 OFFICE: over the desk to the parcel, the piece of the cup and the letter; then the detectives bring their man in
  const [dx, , dz] = DESK;
  KEYS[3].push({ f: CUTS[2] - 10, blend: 0, rig: dolly(CUTS[2] - 10, b.carta + 10, [dx + 1.3, 1.75, dz + 3.6], [dx + 0.55, 1.4, dz + 1.75], [dx - 0.1, 1.05, dz - 0.4], [dx + 0.0, 1.15, dz - 0.6], 50, 46) });
  KEYS[3].push({ f: b.carta + 16, blend: 44, arc: 0.4, rig: dolly(b.carta + 16, CUTS[3] + 10, [dx + 2.0, 1.7, dz + 6.9], [dx + 1.0, 1.6, dz + 7.1], [dx + 0.2, 1.15, dz + 1.4], [dx - 0.2, 1.15, dz + 1.2], 52, 52) });
  // 4 STREET: the front door opens on Pickles; follow them along the pavement; the hedge; low on the find
  const O = (f: number) => OWNER_AT(f).p;
  KEYS[4].push({ f: CUTS[3] - 10, blend: 0, rig: (f) => { const p = O(f), t = ramp(f, CUTS[3] - 10, b.semana + 40); return { pos: [lerp(GATE_X + 2.2, p[0] + 3.4, t), lerp(1.25, 1.35, t), lerp(-2.1, -0.6, t)], look: [lerp(GATE_X, p[0] + 0.6, t), lerp(0.9, 0.85, t), lerp(-8.5, p[2] - 0.6, t)], fov: 50, roll: 0 }; } });
  KEYS[4].push({ f: b.semana + 40, blend: 30, rig: (f) => { const p = O(f), t = ramp(f, b.semana + 40, b.olfatea); return { pos: [p[0] + lerp(3.4, 2.6, t), lerp(1.35, 1.0, t), lerp(-0.6, -1.0, t)], look: [p[0] + lerp(0.6, 1.4, t), lerp(0.85, 0.6, t), p[2] - 0.6], fov: 50, roll: 0 }; } });
  KEYS[4].push({ f: b.olfatea, blend: 30, rig: dolly(b.olfatea, b.envuelta + 10, [bx - 0.2, 0.75, bz + 3.4], [bx + 0.3, 0.5, bz + 2.2], [bx - 0.5, 0.35, bz], [bx, 0.2, bz - 0.1], 50, 46) });
  KEYS[4].push({ f: b.envuelta + 10, blend: 34, arc: 0.3, rig: dolly(b.envuelta + 10, CUTS[4] + 10, [bx + 0.15, 0.6, bz + 3.4], [bx + 0.35, 1.25, bz + 4.2], [bx + 0.1, 0.42, bz + 0.6], [bx + 0.1, 0.62, bz + 0.6], 46, 48) });
  // 5 BANQUET: along the table among the champions; then across it to the guest of honour
  const [tx, , tz] = TABLE;
  KEYS[5].push({ f: CUTS[4] - 10, blend: 0, rig: dolly(CUTS[4] - 10, b.banquete + 20, [tx - 8.4, 2.4, tz - 0.4], [tx - 3.4, 1.9, tz - 0.2], [tx, 1.0, tz + 0.2], [tx + 2, 1.0, tz + 0.4], 50, 50) });
  KEYS[5].push({ f: b.banquete + 20, blend: 40, arc: 0.5, rig: dolly(b.banquete + 20, TT, [tx - 1.4, 1.6, tz - 3.6], [tx + 0.6, 1.22, tz - 2.2], [tx + 0.1, 1.0, tz + 0.6], [DOG_CHAIR[0] - 0.12, 1.0, DOG_CHAIR[2]], 50, 44) });
}
export const camAt = (id: number, f: number): Cam => {
  const K = KEYS[id]; let i = 0; for (let j = 0; j < K.length; j++) if (f >= K[j].f) i = j;
  const k = K[i]; let c = k.rig(f);
  if (i > 0 && k.blend > 0 && f < k.f + k.blend) { const t = smooth((f - k.f) / k.blend), p = K[i - 1].rig(f); c = { pos: lerp3(p.pos, c.pos, t), look: lerp3(p.look, c.look, t), fov: lerp(p.fov, c.fov, t), roll: lerp(p.roll, c.roll, t) }; const hump = (k.arc ?? 0) * Math.sin(Math.PI * t); c.pos[1] += hump; c.look[1] += hump * 0.85; }
  return c;
};
export const dofAt = (id: number, f: number): { cInf: number } => { const c = camAt(id, f), d = Math.hypot(c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]); return { cInf: d < 3 ? 1.6 : d < 6 ? 1.1 : 0.7 }; }; // light touch only: the user found the strong lens blur made the reel look soft
export type Pool = { p: V3; r: number };
export type Glow = { p: V3; r: number; col: string; a: number };
export type Lighting = { wash?: { col: string; a: number }; pools: Pool[]; glows: Glow[]; vig: number; beams?: number; tint?: { col: string; a: number } };
export const lightingAt = (id: number, f: number): Lighting => {
  const place = SHOTS[id - 1].place;
  if (place === "street") { const shine = id === 4 ? ease(ramp(f, UNWRAP, UNWRAP + 16)) * (0.85 + 0.15 * Math.sin(f * 0.3)) : 0;
    return { pools: [], glows: shine > 0 ? [{ p: [BUSH[0] + 0.1, 0.5, BUSH[2] + 0.65], r: 0.55, col: "#ffd27a", a: 0.55 * shine }] : [], vig: 0.34, tint: { col: "#2a3a8a", a: 0.03 } }; }
  if (place === "hall") return { pools: [], glows: [{ p: [VX, 1.5, VZ], r: 0.3, col: "#ffe2a0", a: f < GRAB + 6 ? 0.28 : 0 }], vig: 0.22, beams: 0.32, tint: { col: "#f0c890", a: 0.04 } };
  if (place === "office") return { pools: [], glows: [], vig: 0.26, beams: 0.14, tint: { col: "#f0c890", a: 0.05 } };
  return { pools: [], glows: [{ p: [TABLE[0], 1.25, TABLE[2]], r: 0.4, col: "#ffe2a0", a: 0.22 }], vig: 0.24, tint: { col: "#f0b880", a: 0.05 } };
};
