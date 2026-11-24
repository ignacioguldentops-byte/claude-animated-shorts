// "El Fenómeno y la final": timeline, where everyone is, and the camera of each place. Beats derive from timing.ts.
// Six shots joined by short crossfades while both cameras keep moving:
// 1 hook in the hotel room (ball, the number 9; the nap; waking up surrounded: a point-of-view shot from the pillow)
// 2 the same afternoon, earlier: the seizure, the room-mate runs out shouting for help into the corridor
// 3 the clinic (tests)  ·  4 the dressing room (team sheet without him; he walks in with the scans)
// 5 the 1998 final (a header, 3-0)  ·  6 the 2002 final (he scores, the cup, confetti)
import { LINES, TOTAL as TT } from "./timing";
import { ROOM, CORR, CLIN, VEST, BED_A, BED_B, RDOOR_X, EXAM, VDOOR_X } from "./setsf";
import { PL } from "./setsq";
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
  mejor: A(1, 0.42), final: A(1, 0.8), comer: L(2), siesta: A(2, 0.36), despiertas: A(2, 0.56), rodeado: A(2, 0.72),
  francia: L(3), dormia: A(3, 0.3), convulsion: A(3, 0.55), companero: A(3, 0.66), grito: A(3, 0.88),
  nada: A(4, 0.12), clinica: A(4, 0.3), pruebas: A(4, 0.48), entrenador: A(4, 0.62), sin: A(4, 0.88),
  momento: L(5), antes: A(5, 0.22), entra: A(5, 0.4), resultados: A(5, 0.6), normal: A(5, 0.76), jugar: A(5, 0.92),
  juega: L(6), brasil: A(6, 0.2), zidane: A(6, 0.45), cabeza: A(6, 0.64), gana: A(6, 0.84),
  veras: L(7), otra: A(7, 0.3), marco: A(7, 0.5), copa: A(7, 0.78), end: TT };
export const CUTS = [0, cut(2, 3), cut(3, 4), A(4, 0.56), L(6) + 24, cut(6, 7), TT];
export type Place = "hotel" | "clinic" | "vest" | "stadium";
export type ShotDef = { id: number; a: number; b: number; light: LightK; place: Place };
export const SHOTS: ShotDef[] = [
  { id: 1, a: CUTS[0], b: CUTS[1], light: "day", place: "hotel" }, { id: 2, a: CUTS[1], b: CUTS[2], light: "day", place: "hotel" }, { id: 3, a: CUTS[2], b: CUTS[3], light: "day", place: "clinic" },
  { id: 4, a: CUTS[3], b: CUTS[4], light: "day", place: "vest" }, { id: 5, a: CUTS[4], b: CUTS[5], light: "day", place: "stadium" }, { id: 6, a: CUTS[5], b: TT, light: "day", place: "stadium" }];
export const XF = 14;
export const FLASH_AT = -100, FLASH2 = B.copa - 4;
export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number) => { for (let i = 1; i < SHOTS.length; i++) { const c = SHOTS[i].a; if (f >= c - XF / 2 && f < c + XF / 2) return [{ id: SHOTS[i - 1].id, alpha: 1 }, { id: SHOTS[i].id, alpha: smooth((f - (c - XF / 2)) / XF) }]; } return [{ id: shotAt(f).id, alpha: 1 }]; };

// ---------------- where everyone is ----------------
const path = (pts: [number, number, number][], f: number): V3 => {
  if (f <= pts[0][0]) return [pts[0][1], 0, pts[0][2]]; for (let i = 1; i < pts.length; i++) if (f <= pts[i][0]) { const a = pts[i - 1], b = pts[i], t = (f - a[0]) / (b[0] - a[0]), u = 0.15 * ease(t) + 0.85 * t; return [lerp(a[1], b[1], u), 0, lerp(a[2], b[2], u)]; }
  const l = pts[pts.length - 1]; return [l[1], 0, l[2]]; };
const moving = (pts: [number, number, number][], f: number) => { for (let i = 1; i < pts.length; i++) if (f > pts[i - 1][0] && f < pts[i][0] && Math.hypot(pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]) > 0.05) return true; return false; };
const head = (pts: [number, number, number][], f: number): [number, number] => { const a = path(pts, f - 3), b = path(pts, f + 3), dx = b[0] - a[0], dz = b[2] - a[2], d = Math.hypot(dx, dz); return d > 1e-4 ? [dx / d, dz / d] : [0, 0]; };
export type Walker = { p: V3; walk: boolean; h: [number, number]; speed: number };
const walker = (pts: [number, number, number][]) => (f: number): Walker => { const a = path(pts, f - 1), b = path(pts, f + 1); return { p: path(pts, f), walk: moving(pts, f), h: head(pts, f), speed: Math.hypot(b[0] - a[0], b[2] - a[2]) * 15 }; };
// 1 the room: he juggles the ball by the wardrobe (the 9 hangs on its door), walks to his bed, sits, lies down
const [AX, , AZ] = BED_A, [BX, , BZ] = BED_B;
export const R9_ROOM = walker([[B.comer + 4, ROOM.x + 1.15, ROOM.z + 0.9], [B.siesta - 30, AX + 0.85, AZ + 0.55], [B.siesta - 22, AX + 0.78, AZ + 0.4]]);
export const SIT_AT = B.siesta - 20, LIE_AT = B.siesta - 4;
/** the faces round the bed in the point-of-view shot (they stand at the foot of the bed) */
export const POV_AT = B.despiertas - 4;
export const AROUND: V3[] = [[AX - 0.56, 0, AZ + 1.38], [AX + 0.04, 0, AZ + 1.68], [AX + 0.66, 0, AZ + 1.32]];
// 2 the seizure, the room-mate running out to the corridor, team-mates running to the door
export const LB_RUN = walker([[B.companero - 8, BX - 0.8, BZ + 1.15], [B.companero + 14, BX - 0.2, BZ + 2.7], [B.companero + 30, RDOOR_X - 0.2, ROOM.z + 1.7], [B.companero + 48, RDOOR_X - 0.15, ROOM.z + 3.3], [B.companero + 60, RDOOR_X - 0.15, CORR.z - 0.05]]);
export const MATE_RUN = [walker([[B.grito - 8, 300.2, CORR.z + 0.75], [B.grito + 4, 300.2, CORR.z + 0.55], [B.grito + 22, RDOOR_X - 0.62, CORR.z + 0.3]]), walker([[B.grito - 2, 303.7, CORR.z + 0.75], [B.grito + 10, 303.7, CORR.z + 0.55], [B.grito + 30, RDOOR_X + 0.62, CORR.z + 0.32]])];
// 3 the clinic: he sits on the couch in a gown; the doctor reads the scans
export const R9_EXAM: V3 = [EXAM[0] + 0.2, 0.13, EXAM[2] + 0.45];
// 4 the dressing room: the coach hands the sheet to the official, who leaves; he comes in through the same door
export const COACH_AT: V3 = [VDOOR_X - 0.85, 0, VEST.z + 2.3];
export const OFF_RUN = walker([[B.entrenador - 6, VDOOR_X + 0.35, VEST.z + 2.75], [B.sin + 6, VDOOR_X + 0.35, VEST.z + 2.75], [B.sin + 30, VDOOR_X, VEST.z + 4.4], [B.sin + 46, VDOOR_X, VEST.z + 6.2]]);
export const R9_IN = walker([[B.entra - 26, VDOOR_X, VEST.z + 6.0], [B.entra + 4, VDOOR_X, VEST.z + 3.0], [B.resultados - 4, VDOOR_X - 0.15, VEST.z + 1.65]]);
export const DOC_IN = walker([[B.entra - 8, VDOOR_X, VEST.z + 6.0], [B.entra + 24, VDOOR_X + 0.1, VEST.z + 3.05], [B.resultados + 6, VDOOR_X + 0.55, VEST.z + 1.9]]);
export const VPLAYERS: V3[] = [[VDOOR_X - 1.3, 0, VEST.z + 1.75], [VDOOR_X + 1.0, 0, VEST.z + 1.55], [VDOOR_X - 1.55, 0, VEST.z + 0.35], [VDOOR_X + 1.25, 0, VEST.z + 0.15]];
export const doorOpen = (f: number) => Math.max(ease(ramp(f, B.sin + 14, B.sin + 24)) * (1 - ease(ramp(f, B.sin + 52, B.sin + 62))), ease(ramp(f, B.entra - 30, B.entra - 18)));
// 5 1998: the corner, the header, the keeper beaten; he stands in the box, then sinks to his knees
const GX = -PL;
export const HEAD_AT = B.zidane - 4, NET98 = HEAD_AT + 8;
export const R9_98: V3 = [GX + 8.5, 0, 5.75];
export const FRA10_RUN = walker([[HEAD_AT - 40, GX + 10.5, -4.4], [HEAD_AT - 6, GX + 3.4, 0.25], [HEAD_AT + 6, GX + 3.1, 0.3], [HEAD_AT + 40, GX + 8.5, -3.0]]);
export const ballAt98 = (f: number): V3 | null => {
  if (f < HEAD_AT - 22) return null; const hp: V3 = [GX + 3.1, 2.28, 0.35];
  if (f <= HEAD_AT) { const t = ramp(f, HEAD_AT - 22, HEAD_AT), a: V3 = [GX + 9.5, 6.5, 13.0]; return [lerp(a[0], hp[0], t), lerp(a[1], hp[1], t) + 1.6 * Math.sin(Math.PI * t), lerp(a[2], hp[2], t)]; }
  if (f <= NET98) { const t = ramp(f, HEAD_AT, NET98); return [lerp(hp[0], GX - 0.9, t), lerp(hp[1], 1.15, t), lerp(hp[2], 1.85, t)]; }
  const t = ramp(f, NET98, NET98 + 14); return [GX - 1.15 + 0.2 * t, Math.max(0.11, 1.15 - 1.3 * t), 1.9]; };
// 6 2002: he runs in on goal with the ball, shoots past the keeper, wheels away; after the flash, the cup
const GX2 = PL;
export const SHOOT = B.marco - 8, NET02 = SHOOT + 9;
export const R9_RUN02 = walker([[B.veras - 30, GX2 - 15.5, -5.6], [SHOOT, GX2 - 9.2, -2.2], [SHOOT + 8, GX2 - 8.6, -1.9], [B.copa - 14, GX2 - 11.2, 1.6]]);
export const GER_RUN = walker([[B.veras - 30, GX2 - 15.0, -7.4], [SHOOT, GX2 - 9.6, -3.6], [SHOOT + 30, GX2 - 9.4, -3.2]]);
export const ballAt02 = (f: number): V3 => { const r = R9_RUN02(f).p;
  if (f < SHOOT) { const h = R9_RUN02(f).h; return [r[0] + h[0] * 0.55 + 0.05, 0.11 + 0.06 * Math.abs(Math.sin(f * 0.35)), r[2] + h[1] * 0.55 + 0.25]; }
  if (f <= NET02) { const t = ramp(f, SHOOT, NET02), a = R9_RUN02(SHOOT).p; return [lerp(a[0] + 0.6, GX2 + 0.8, t), 0.11 + 0.9 * t + 0.4 * Math.sin(Math.PI * t), lerp(a[2] + 0.2, 2.2, t)]; }
  const t = ramp(f, NET02, NET02 + 14); return [GX2 + 1.0 - 0.2 * t, Math.max(0.11, 1.0 - 1.0 * t), 2.3]; };
export { ROOM, CORR, CLIN, VEST, BED_A, BED_B, RDOOR_X, EXAM, VDOOR_X, PL };

// ---------------- the camera ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
type Rig = (f: number) => Cam;
type Key = { f: number; rig: Rig; blend: number; arc?: number };
const dolly = (f0: number, f1: number, p0: V3, p1: V3, l0: V3, l1: V3, fov0 = 50, fov1 = fov0, r0 = 0, r1 = 0): Rig => (f) => { const t = smooth(ramp(f, f0, f1)) * 0.6 + ramp(f, f0, f1) * 0.4; return { pos: lerp3(p0, p1, t), look: lerp3(l0, l1, t), fov: lerp(fov0, fov1, t), roll: lerp(r0, r1, t) }; };
const KEYS: Record<number, Key[]> = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
{ const b = B, rx = ROOM.x, rz = ROOM.z;
  // 1 HOOK: in close on him tossing the ball, the yellow 9 on the wardrobe beside him; then over his bed as he lies down;
  //   then his own eyes opening: up from the pillow at the worried faces
  KEYS[1].push({ f: 0, blend: 0, rig: dolly(-6, b.comer, [rx - 0.35, 1.42, rz + 2.62], [rx - 0.55, 1.5, rz + 2.55], [rx + 1.2, 0.98, rz + 0.8], [rx + 1.55, 1.05, rz + 0.5], 50, 52) });
  KEYS[1].push({ f: b.comer, blend: 40, arc: 0.15, rig: dolly(b.comer, SIT_AT + 6, [rx - 0.4, 1.6, rz + 2.5], [rx - 0.3, 1.9, rz + 1.6], [rx + 0.9, 1.1, rz + 0.4], [AX + 0.6, 0.85, AZ + 0.3], 50, 50) });
  KEYS[1].push({ f: SIT_AT + 6, blend: 30, rig: dolly(SIT_AT + 6, POV_AT, [AX + 0.1, 2.5, AZ + 1.75], [AX + 0.02, 2.62, AZ + 1.25], [AX + 0.02, 0.55, AZ - 0.25], [AX, 0.55, AZ - 0.45], 50, 52) });
  KEYS[1].push({ f: POV_AT, blend: 0, rig: dolly(POV_AT, CUTS[1] + 10, [AX, 0.8, AZ - 0.55], [AX + 0.02, 0.82, AZ - 0.48], [AX + 0.03, 1.55, AZ + 1.4], [AX + 0.05, 1.68, AZ + 1.5], 64, 60, 0.05, -0.03) });
  // 2 THE SEIZURE: the two beds from the door side; he trembles; his room-mate leaps up and runs out; through the door, the corridor
  KEYS[2].push({ f: CUTS[1] - 10, blend: 0, rig: dolly(CUTS[1] - 10, b.convulsion + 10, [AX + 0.75, 2.45, AZ + 2.3], [AX + 0.6, 2.4, AZ + 2.0], [AX + 0.1, 0.6, AZ + 0.05], [AX + 0.1, 0.6, AZ - 0.1], 52, 52) });
  KEYS[2].push({ f: b.convulsion + 10, blend: 36, rig: dolly(b.convulsion + 10, b.companero + 20, [AX + 0.95, 2.1, AZ + 2.6], [rx + 0.35, 1.85, rz + 1.2], [BX - 0.6, 0.85, BZ + 0.3], [BX - 0.2, 1.0, BZ + 1.8], 50, 50) });
  KEYS[2].push({ f: b.companero + 20, blend: 36, rig: dolly(b.companero + 20, CUTS[2] + 10, [rx + 0.35, 1.75, rz + 0.9], [RDOOR_X - 0.45, 1.6, rz + 0.55], [RDOOR_X - 0.1, 1.25, rz + 3.2], [RDOOR_X - 0.05, 1.3, CORR.z], 50, 48) });
  // 3 CLINIC: from the brain waves on the screen to him on the couch, dazed
  const [ex, , ez] = EXAM;
  KEYS[3].push({ f: CUTS[2] - 10, blend: 0, rig: dolly(CUTS[2] - 10, CUTS[3] + 10, [CLIN.x + 0.95, 1.5, CLIN.z + 2.3], [CLIN.x + 0.25, 1.4, CLIN.z + 2.3], [ex + 1.2, 1.15, ez - 0.2], [ex + 0.35, 1.0, ez + 0.4], 50, 50) });
  // 4 DRESSING ROOM: looking south at the door: the sheet handed over; the door again: he walks in with the scans
  KEYS[4].push({ f: CUTS[3] - 10, blend: 0, rig: dolly(CUTS[3] - 10, b.entra, [VDOOR_X - 1.0, 1.75, VEST.z - 2.2], [VDOOR_X - 0.75, 1.62, VEST.z - 1.3], [VDOOR_X - 0.1, 1.25, VEST.z + 3.2], [VDOOR_X, 1.3, VEST.z + 3.0], 50, 50) });
  KEYS[4].push({ f: b.entra, blend: 40, rig: dolly(b.entra, CUTS[4] + 10, [VDOOR_X - 0.75, 1.62, VEST.z - 1.3], [VDOOR_X - 0.6, 1.5, VEST.z - 1.15], [VDOOR_X, 1.3, VEST.z + 3.0], [VDOOR_X - 0.15, 0.98, VEST.z + 1.65], 50, 52) });
  // 5 1998: low in the box behind him; the header goes in over his shoulder; in on his face as France win
  KEYS[5].push({ f: CUTS[4] - 10, blend: 0, rig: dolly(CUTS[4] - 10, NET98 + 16, [GX + 11.2, 1.55, 7.6], [GX + 10.6, 1.5, 7.2], [GX + 3.0, 1.35, 0.6], [GX + 2.8, 1.35, 0.8], 48, 48) });
  KEYS[5].push({ f: NET98 + 16, blend: 44, arc: 0.1, rig: dolly(NET98 + 16, CUTS[5] + 10, [GX + 10.6, 1.5, 7.2], [GX + 10.6, 1.25, 7.0], [GX + 2.8, 1.35, 0.8], [R9_98[0], 0.95, R9_98[2]], 48, 46) });
  // 6 2002: running alongside him with the ball; behind him as he shoots; he wheels away towards us; after the flash, the cup
  const R = (f: number) => R9_RUN02(f).p;
  KEYS[6].push({ f: CUTS[5] - 10, blend: 0, rig: (f) => { const p = R(f); return { pos: [p[0] - 1.2, 1.45, p[2] + 4.4], look: [p[0] + 0.7, 0.95, p[2] + 0.1], fov: 48, roll: 0 }; } });
  KEYS[6].push({ f: SHOOT - 20, blend: 22, rig: (f) => { const t = ramp(f, SHOOT - 20, NET02 + 10); return { pos: [GX2 - 13.4 + 0.5 * t, 1.6, -3.9 + 0.2 * t], look: [lerp(GX2 - 6.0, GX2 - 0.5, t), 1.0, lerp(-1.2, 1.0, t)], fov: 46, roll: 0 }; } });
  KEYS[6].push({ f: NET02 + 10, blend: 30, rig: (f) => { const p = R(f), t = ramp(f, NET02 + 10, B.copa - 4); return { pos: [lerp(GX2 - 12.6, GX2 - 13.4, t), 1.55, lerp(2.4, 4.6, t)], look: [p[0] + 0.3, 1.1, p[2]], fov: 48, roll: 0 }; } });
  KEYS[6].push({ f: B.copa - 4, blend: 0, rig: dolly(B.copa - 4, TT, [GX2 - 12.4, 1.5, 4.5], [GX2 - 12.9, 2.0, 5.5], [GX2 - 11.1, 1.25, 1.6], [GX2 - 11.1, 1.35, 1.5], 48, 50) });
}
export const camAt = (id: number, f: number): Cam => {
  const K = KEYS[id]; let i = 0; for (let j = 0; j < K.length; j++) if (f >= K[j].f) i = j;
  const k = K[i]; let c = k.rig(f);
  if (i > 0 && k.blend > 0 && f < k.f + k.blend) { const t = smooth((f - k.f) / k.blend), p = K[i - 1].rig(f); c = { pos: lerp3(p.pos, c.pos, t), look: lerp3(p.look, c.look, t), fov: lerp(p.fov, c.fov, t), roll: lerp(p.roll, c.roll, t) }; const hump = (k.arc ?? 0) * Math.sin(Math.PI * t); c.pos[1] += hump; c.look[1] += hump * 0.85; }
  return c;
};
export const dofAt = (id: number, f: number): { cInf: number } => { const c = camAt(id, f), d = Math.hypot(c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]); return { cInf: d < 3 ? 1.6 : d < 6 ? 1.1 : 0.7 }; }; // light touch only (user: never blurry)
export type Pool = { p: V3; r: number };
export type Glow = { p: V3; r: number; col: string; a: number };
export type Lighting = { wash?: { col: string; a: number }; pools: Pool[]; glows: Glow[]; vig: number; beams?: number; tint?: { col: string; a: number } };
export const lightingAt = (id: number, f: number): Lighting => {
  const place = SHOTS[id - 1].place;
  if (place === "hotel") { // the nap: the picture darkens as his eyes close, and opens again on the faces
    const sleep = id === 1 ? ease(ramp(f, LIE_AT + 12, POV_AT - 2)) * (1 - ease(ramp(f, POV_AT, POV_AT + 16))) : 0;
    return { pools: [], glows: [], vig: 0.26 + 0.6 * sleep + (id === 1 && f >= POV_AT ? 0.25 * (1 - ramp(f, POV_AT, POV_AT + 30)) : 0), beams: id === 1 ? 0.3 : 0.22, wash: sleep > 0.01 ? { col: "#000000", a: 0.95 * sleep } : undefined, tint: { col: id === 2 ? "#9ab0d0" : "#f0c890", a: id === 2 ? 0.06 : 0.05 } }; }
  if (place === "clinic") return { pools: [], glows: [], vig: 0.24, tint: { col: "#a8d0e0", a: 0.05 } };
  if (place === "vest") return { pools: [], glows: [], vig: 0.24, tint: { col: "#d8e4f0", a: 0.03 } };
  const shine = id === 6 ? ease(ramp(f, B.copa - 4, B.copa + 10)) : 0;
  return { pools: [], glows: shine > 0 ? [{ p: [GX2 - 11.1, 2.6, 1.6], r: 0.6, col: "#ffd27a", a: 0.45 * shine }] : [], vig: 0.3, tint: { col: "#2a3a8a", a: 0.03 } };
};
