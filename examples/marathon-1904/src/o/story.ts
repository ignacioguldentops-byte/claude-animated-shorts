// "Media carrera en coche": timeline and the one continuous camera. Beats derive from timing.ts. There are no cuts:
// each beat hands the camera from one rig to the next with a blended flight (an arc over the land when the places are
// far apart), and every rig moves all the time.
import { LINES, TOTAL as TT } from "./timing";
import { roadZ, roadDir, onRoad, FINISH_X, TR, P, GATE_X } from "./geo";
import type { LightK } from "./lights";
import { getInputProps } from "remotion";
export const FPS = 30, TOTAL = TT;
export type V3 = [number, number, number];
export type Light = LightK;
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * u * (u * (u * 6 - 15) + 10); };
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const lerp3 = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
export const ramp = (f: number, a: number, b: number) => clamp01((f - a) / (b - a));
const L = (l: number) => LINES[l - 1][0], E = (l: number) => LINES[l - 1][1];
export const A = (l: number, t = 0) => Math.round(L(l) + (E(l) - L(l)) * t);
export const B = { coche: A(1, 0.8), sanluis: L(2) - 6, polvo: A(2, 0.6), agua: L(3) - 6, cartero: L(4) - 6, perros: A(4, 0.55), momento: L(5) - 6, veras: L(6) - 6, sube: A(6, 0.55), saluda: A(6, 0.8),
  averia: L(7) - 6, baja: A(7, 0.22), corre: A(7, 0.32), primero: A(7, 0.55), medalla: A(7, 0.8), ganador: L(8) - 6, cartero2: L(9) - 6, siesta: A(9, 0.5), cuarto: A(9, 0.82), end: TT };
export type ShotDef = { id: number; a: number; b: number; light: Light; place: string; sun?: [number, number]; night?: boolean; fog?: [number, number]; indoor?: boolean };
const SUN: [number, number] = [205, 54];
const cuts = [0, B.sanluis, B.agua, B.cartero, B.momento, B.veras, B.averia, B.ganador, B.cartero2, TT];
export const SHOTS: ShotDef[] = cuts.slice(0, -1).map((a, i) => ({ id: i + 1, a, b: cuts[i + 1], light: "day" as Light, place: "o", sun: SUN }));
export const XFADE: Record<number, number> = {};
export const FLASH_AT = -100;
export const FLASH2 = B.medalla + 10;   // the photographer's magnesium
export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number) => [{ id: shotAt(f).id, alpha: 1 }];
export { GATE_X };

// ---------------- what moves ----------------
/** a car: x along the road, dir -1 = heading west (towards the stadium), off = lateral offset, speed (m/frame) for the wheels */
export type CarS = { x: number; dir: number; off: number; v: number; on: boolean; steam: number };
const OFF = { x: 0, dir: 1, off: 0, v: 0, on: false, steam: 0 };
/** distance covered by f frames of motion that starts at speed v0 and eases to v1 over n frames */
const ease = (u: number, v0: number, v1: number, n: number) => { const k = Math.min(u, n), m = Math.max(0, u - n); return v0 * k + (v1 - v0) * k * k / (2 * n) + v1 * m; };
export const carsAt = (id: number, f: number): CarS[] => {
  const s = SHOTS[id - 1], u = f - s.a, c: CarS[] = [{ ...OFF }, { ...OFF }, { ...OFF }];
  if (id === 1) c[2] = { x: 300 - 0.3 * u, dir: -1, off: -1.2, v: 0.3, on: true, steam: 0 };
  if (id === 2 || id === 3) { const u2 = f - (B.sanluis + 80); c[0] = { x: GATE_X + 16 + 0.15 * u2, dir: 1, off: 1.1, v: 0.15, on: id === 2, steam: 0 }; c[1] = { x: GATE_X + 30 + 0.16 * u2, dir: 1, off: -1.0, v: 0.16, on: id === 2, steam: 0 }; }
  if (id === 5 || id === 6) { const stopF = B.veras + 50, goF = B.sube + 22, dx = f < stopF ? ease(f - (B.momento - 10), 0.32, 0.0, stopF - B.momento + 10) : ease(stopF - (B.momento - 10), 0.32, 0, stopF - B.momento + 10) + (f > goF ? ease(f - goF, 0, 0.34, 40) : 0);
    const v = f < stopF ? 0.32 * (1 - ramp(f, B.momento - 10, stopF)) : f > goF ? Math.min(0.34, 0.34 * (f - goF) / 40) : 0; const n = stopF - B.momento + 10; c[2] = { x: P.quit + 1.4 + 0.16 * n - dx, dir: -1, off: -1.2, v, on: true, steam: 0 }; }
  if (id === 7) { const stop = B.baja - 6, dx = ease(Math.min(f, stop) - s.a, 0.3, 0, stop - s.a); c[2] = { x: 200 - dx, dir: -1, off: 1.2, v: 0.3 * (1 - ramp(f, s.a, stop)), on: f < B.corre + 60, steam: ramp(f, s.a + 8, s.a + 30) }; }
  return c;
};
/** where a car is and which way it faces (heading angle for rotation.y) */
export const carPose = (c: CarS) => { const [px, , pz] = onRoad(c.x, c.off), [dx, dz] = roadDir(c.x), hx = dx * c.dir, hz = dz * c.dir; return { p: [px, 0, pz] as V3, th: Math.atan2(-hz, hx), hx, hz }; };
/** a point in the car's own frame (x forward, y up, z to its right-hand side seen from above the bonnet ... three's +z) */
export const carLocal = (c: CarS, lx: number, ly: number, lz: number): V3 => { const { p, th } = carPose(c), cs = Math.cos(th), sn = Math.sin(th); return [p[0] + lx * cs + lz * sn, ly, p[2] - lx * sn + lz * cs]; };
/** runners along the road: x at frame f for a runner who is at x0 at frame f0, speed v (signed, + = east) */
export const runX = (f: number, f0: number, x0: number, v: number) => x0 + v * (f - f0);
/** the pack that leaves the gate in beat 2 */
export const PACK: [number, number][] = [[0, -1.9], [-1.6, -0.6], [-2.4, -2.6], [-3.8, -1.3], [-4.6, 0.2], [-5.9, -2.2], [-7.2, -0.8], [-8.6, -2.9], [-9.4, 0.1], [-10.8, -1.6]];
export const packX = (f: number) => GATE_X + 3 + 0.125 * (f - (B.sanluis + 80));
/** beat 3: runners pass the well */
export const wellRunners = (f: number): { x: number; off: number; k: number; stop: boolean }[] => [0, 1, 2, 3].map((k) => { const x0 = P.well - 6 - k * 4.5, raw = x0 + 0.125 * (f - B.agua), stop = k === 1 && raw > P.well - 1.2 && raw < P.well + 7; const x = k === 1 ? (raw < P.well - 1.2 ? raw : raw < P.well + 7 ? P.well - 1.2 : raw - 8.2) : raw; return { x, off: k === 1 ? 2.2 : [-1.8, 0, -0.6, 1.2][k], k, stop }; });
/** beat 4: the postman along the road, then the runner and his dogs off into the corn */
export const carteroX = (f: number) => P.cartero - 12 + 0.14 * (f - B.cartero);
export const dogRun = (f: number): { p: V3; t: number } => { const t = f - B.perros; if (t < 0) { const x = P.dogs - 10 + 0.15 * (t + 0); const q = onRoad(x, -1.6); return { p: q, t }; } const q = onRoad(P.dogs - 10, -1.6), k = Math.min(1, t / 24), x = lerp(q[0] + 0.15 * 0, P.dogs, smooth(k)), z0 = onRoad(P.dogs, -1.6)[2]; return { p: [x, 0, t < 24 ? lerp(q[2], z0, smooth(k)) : z0 - 0.16 * (t - 24)], t }; };
/** beats 7-9 in the stadium: the runners on the north straight (x along the track, z of the lane) */
export const lorzTrack = (f: number) => 4 - 0.3 * (f - (B.primero - 8));
export const lorzAt = (f: number) => Math.max(FINISH_X - 3.6, lorzTrack(f));
export const hicksTrack = (f: number) => 14 - 0.127 * (f - B.ganador);
export const hicksAt = (f: number) => Math.max(FINISH_X - 2.6, hicksTrack(f));
export const carteroTrack = (f: number) => FINISH_X + 9 - 0.2 * (f - (B.cuarto - 30));
export const carteroAt = (f: number) => Math.max(FINISH_X - 2.4, carteroTrack(f));
export const LANE_Z = -26;
/** beat 7: where he lands when he hops out of the broken car, and his run west along the road */
export const lorzRoad = (f: number): V3 => { const c0 = carsAt(7, B.baja)[2], base = carLocal(c0, -0.6, 0, 1.7), t = f - B.corre; return t < 0 ? base : [base[0] - 0.2 * t, 0, lerp(base[2], onRoad(base[0] - 0.2 * t, -0.8)[2], ramp(t, 0, 12))]; };
/** the orchard spot of beat 9 and the tree he picks from */
export const NAP: V3 = [107.4, 0, roadZ(107.4) + 12.6];
export const TREE: V3 = [109, 0, roadZ(109) + 11];

// ---------------- the camera ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
type Rig = (f: number) => Cam;
type Key = { f: number; rig: Rig; blend: number; arc?: number };
const dolly = (f0: number, f1: number, p0: V3, p1: V3, l0: V3, l1: V3, fov0 = 50, fov1 = fov0, r0 = 0, r1 = 0): Rig => (f) => { const t = smooth(ramp(f, f0, f1)) * 0.6 + ramp(f, f0, f1) * 0.4; return { pos: lerp3(p0, p1, t), look: lerp3(l0, l1, t), fov: lerp(fov0, fov1, t), roll: lerp(r0, r1, t) }; };
const add3 = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
/** follow a moving subject: the camera sits at subject + offset (offset given along/side of the road at the subject) */
const follow = (subj: (f: number) => V3, f0: number, f1: number, o0: [number, number, number], o1: [number, number, number], lk0: V3 = [0, 1.1, 0], lk1: V3 = lk0, fov0 = 50, fov1 = fov0, r0 = 0.02, r1 = -0.02): Rig => (f) => {
  const s = subj(f), t = smooth(ramp(f, f0, f1)) * 0.6 + ramp(f, f0, f1) * 0.4, o = lerp3(o0, o1, t), [dx, dz] = roadDir(Math.max(GATE_X, s[0]));
  return { pos: [s[0] + dx * o[0] - dz * o[1], s[1] + o[2], s[2] + dz * o[0] + dx * o[1]], look: add3(s, lerp3(lk0, lk1, t)), fov: lerp(fov0, fov1, t), roll: lerp(r0, r1, t) }; };
/** follow along the track (x only) */
const track = (subj: (f: number) => V3, f0: number, f1: number, o0: V3, o1: V3, lk0: V3, lk1: V3, fov0 = 50, fov1 = fov0): Rig => (f) => { const s = subj(f), t = smooth(ramp(f, f0, f1)); return { pos: add3(s, lerp3(o0, o1, t)), look: add3(s, lerp3(lk0, lk1, t)), fov: lerp(fov0, fov1, t), roll: 0.02 * Math.sin(f * 0.05) }; };
const carC = (id: number, k = 2) => (f: number): V3 => { const c = carsAt(id, f)[k], { p } = carPose(c); return p; };
const KEYS: Key[] = [];
{ const b = B;
  // 1 HOOK: alongside the red car as it overtakes the runners, a man in the back seat waving; rising at the end
  KEYS.push({ f: 0, blend: 0, rig: follow(carC(1), 0, b.sanluis, [-10, 9.5, 2.0], [1.5, 9.5, 3.8], [0, 1.0, 0], [0.5, 1.0, 0], 46, 50) });
  // 2 the flight: up over the farmland to the stadium and the fair; then down to the gate and along with the pack in the dust
  KEYS.push({ f: b.sanluis, blend: 40, arc: 10, rig: dolly(b.sanluis, b.sanluis + 95, [215, 32, 6], [100, 26, 36], [60, 4, -30], [10, 2, -40], 54, 52, 0.04, -0.03) });
  KEYS.push({ f: b.sanluis + 80, blend: 42, arc: 9, rig: (f) => { const s: V3 = onRoad(packX(f), -1.0), [dx, dz] = roadDir(Math.max(GATE_X + 1, s[0])), t = smooth(ramp(f, b.sanluis + 80, b.agua)), al = lerp(-4, 9, t), sd = lerp(-11, -9.5, t), y = lerp(5.2, 2.4, t);
    return { pos: [s[0] + dx * al - dz * sd, y, s[2] + dz * al + dx * sd], look: [s[0] + dx * lerp(4, -2, t), 1.0, s[2] + dz * lerp(4, -2, t)], fov: 54, roll: 0.02 - 0.04 * t }; } });
  // 3 the well: round the well as the thirsty runner is turned away
  KEYS.push({ f: b.agua, blend: 34, arc: 5, rig: dolly(b.agua, b.cartero + 10, add3(onRoad(P.well - 8.5, -4.6), [0, 2.0, 0]), add3(onRoad(P.well - 3.0, -5.6), [0, 1.7, 0]), add3(onRoad(P.well - 1.2, 3.4), [0, 1.1, 0]), add3(onRoad(P.well + 0.4, 3.8), [0, 1.1, 0]), 48, 46, 0.02, -0.02) });
  // 4 alongside the postman, then off the road after the runner and the dogs
  KEYS.push({ f: b.cartero, blend: 30, arc: 6, rig: follow((f) => onRoad(carteroX(f), -1.5), b.cartero, b.perros, [5.5, 5.2, 1.1], [2.0, 4.8, 0.9], [0, 1.0, 0], [0.4, 1.0, 0], 46, 46) });
  KEYS.push({ f: b.perros - 6, blend: 26, rig: (f) => { const d = dogRun(f).p, t = ramp(f, b.perros, b.momento); return { pos: [d[0] + lerp(-1, 3, t), lerp(1.8, 4.6, t), d[2] + lerp(7.5, 10, t)], look: [d[0] - 0.8, 0.9, d[2] - 1.4], fov: 50, roll: -0.02 }; } });
  // 5 "Un momento... ¿y el del coche?": up and round to the man sitting on the fence
  KEYS.push({ f: b.momento, blend: 26, arc: 3, rig: dolly(b.momento, b.sube + 10, add3(onRoad(P.quit - 9, -4.2), [0, 2.2, 0]), add3(onRoad(P.quit - 13, -2.4), [0, 2.6, 0]), add3(onRoad(P.quit + 1.2, -3.8), [0, 1.1, 0]), add3(onRoad(P.quit + 0.8, -3.3), [0, 1.1, 0]), 48, 52) });
  // 6 the car stops, he jumps in, and they are off past the others
  KEYS.push({ f: b.sube + 4, blend: 30, rig: follow(carC(6), b.sube + 4, b.averia, [-7.5, 5.5, 1.1], [2.5, 7.0, 1.5], [0, 1.1, 0], [0, 1.0, 0], 48, 50) });
  // 7 the breakdown; he hops out and runs; the flight over the gate; the finish; the wreath and the photograph
  KEYS.push({ f: b.averia, blend: 28, rig: follow(carC(7), b.averia, b.corre, [-1.5, 8.5, 1.9], [-6.5, 8.0, 2.1], [0.4, 1.0, 0], [-1.6, 1.0, 0.8], 52, 54) });
  KEYS.push({ f: b.corre, blend: 18, rig: (f) => { const s = lorzRoad(f), t = ramp(f, b.corre, b.primero - 24); return { pos: [s[0] - lerp(7, 8.5, t), lerp(1.7, 2.6, t), s[2] + lerp(4.2, 2.4, t)], look: [s[0] - 0.5, 1.1, s[2]], fov: 50, roll: 0.02 }; } });
  KEYS.push({ f: b.primero - 24, blend: 30, arc: 14, rig: track((f) => [lorzAt(f), 0, LANE_Z], b.primero - 24, b.medalla + 30, [-7.5, 1.5, 6.2], [-4.0, 1.8, 8.6], [0, 1.1, 0], [-1.2, 1.2, 0.6], 50, 52) });
  KEYS.push({ f: b.medalla - 6, blend: 26, rig: dolly(b.medalla - 6, b.ganador + 8, [FINISH_X - 4, 1.6, -17.2], [FINISH_X - 6.5, 1.7, -18.2], [FINISH_X - 2.5, 1.2, -26.5], [FINISH_X - 4, 1.2, -27], 50, 46) });
  // 8 the real winner, held up by his trainers, all the way to the tape; the cheat being told off behind
  KEYS.push({ f: b.ganador, blend: 30, rig: track((f) => [hicksAt(f), 0, LANE_Z], b.ganador, b.ganador + 120, [-10, 1.6, 0.3], [-9, 1.6, 0.6], [0, 1.1, 0], [0, 1.1, 0], 50, 50) });
  KEYS.push({ f: b.ganador + 110, blend: 34, rig: track((f) => [hicksAt(f), 0, LANE_Z], b.ganador + 110, b.cartero2, [-8.0, 1.9, 4.2], [-9.5, 2.3, 5.6], [0, 1.0, 0], [-1.0, 1.0, 0], 52, 52) });
  // 9 out to the orchard: an apple, another, a nap while the others go by; back to the stadium: he is fourth
  KEYS.push({ f: b.cartero2, blend: 40, arc: 16, rig: dolly(b.cartero2, b.siesta + 30, [NAP[0] - 0.4, 1.6, NAP[2] + 5.0], [NAP[0] - 0.2, 1.9, NAP[2] + 6.2], [NAP[0] + 0.4, 1.1, NAP[2] - 0.4], [NAP[0] - 0.4, 0.5, NAP[2] - 0.6], 46, 46) });
  KEYS.push({ f: b.cuarto - 34, blend: 30, arc: 12, rig: track((f) => [carteroAt(f), 0, LANE_Z], b.cuarto - 34, TT, [-6.5, 1.6, 6.0], [-5.5, 2.6, 8.8], [0, 1.1, 0], [-0.8, 1.2, -0.6], 50, 52) });
}
const DBG = (getInputProps() as { cam?: { pos: V3; look: V3; fov?: number } }).cam;
export const camAt = (_id: number, f: number): Cam => {
  if (DBG) return { pos: DBG.pos, look: DBG.look, fov: DBG.fov ?? 50, roll: 0 };
  let i = 0; while (i + 1 < KEYS.length && f >= KEYS[i + 1].f) i++;
  const k = KEYS[i]; let c = k.rig(f);
  if (i > 0 && k.blend > 0 && f < k.f + k.blend) { const t = smooth((f - k.f) / k.blend), p = KEYS[i - 1].rig(f); c = { pos: lerp3(p.pos, c.pos, t), look: lerp3(p.look, c.look, t), fov: lerp(p.fov, c.fov, t), roll: lerp(p.roll, c.roll, t) }; const hump = (k.arc ?? 0) * Math.sin(Math.PI * t); c.pos[1] += hump; c.look[1] += hump * 0.85; }
  const sx = 0.012 * Math.sin(f * 0.11), sy = 0.008 * Math.sin(f * 0.17);
  return { ...c, pos: [c.pos[0] + sx, c.pos[1] + sy, c.pos[2]], roll: c.roll + 0.004 * Math.sin(f * 0.09) };
};
export const KICKS: number[] = [];
export const dofAt = (f: number): { cInf: number; focus?: (f: number) => V3 } => { const c = camAt(0, f), d = Math.hypot(c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]); return { cInf: c.pos[1] > 12 ? 0 : d < 9 ? 5 : d < 14 ? 3 : 0 }; };
export type Lamp = { p: V3; c: string; i: number; d: number };
export const lampsAt = (_id: number, _f: number): Lamp[] => [];
export type Pool = { p: V3; r: number };
export type Glow = { p: V3; r: number; col: string; a: number };
export type Lighting = { wash?: { col: string; a: number }; pools: Pool[]; glows: Glow[]; vig: number; beams?: number; tint?: { col: string; a: number } };
export const lightingAt = (_id: number, f: number): Lighting => ({ pools: [], glows: [], vig: 0.26, beams: camAt(0, f).pos[1] > 10 ? 0.22 : 0.12, tint: { col: "#f0c890", a: 0.05 } });
export { TR, P };
