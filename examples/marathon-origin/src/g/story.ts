// "Cómo nació el maratón": timeline, where everyone is, and the one continuous camera (no cuts). Beats derive from
// timing.ts. Shot 1: Marathon and Athens, 490 BC. Shot 2: the same valley in 1896 (the switch happens while the camera
// looks at the hills of the Sparta path). Shot 3: England, 1908 (reached through a bank of cloud).
import { LINES, TOTAL as TT } from "./timing";
import { roadZ, roadDir, onRoad, H, HE, pathX, GATE_X, TAV_X, VILLAGE_X, CAMP_X, BEACH_X, ACRO, STAD, ENG, CASTLE, WCITY } from "./geo";
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
export const B = { hook: 0, grecia: L(2) - 8, mensajero: A(2, 0.52), llega: L(3) - 10, grita: A(3, 0.3), cae: A(3, 0.78), momento: L(4) - 4, herodoto: A(4, 0.18), levanta: A(4, 0.38), esparta: A(4, 0.5), siglos: A(4, 0.78),
  veras: L(5) - 10, breal: A(5, 0.45), trofeo: A(5, 0.82), bang: E(5) - 4, gano: L(6) - 6, taberna: A(6, 0.52), copa: A(6, 0.7), sigue: A(6, 0.88), estadio: L(7) - 6, londres: A(7, 0.32), windsor: A(7, 0.52), palco: A(7, 0.76),
  medida: L(8) - 6, meta: A(8, 0.5), reina: A(8, 0.82), end: TT };
export const ERA_SWITCH = B.siglos + 20, ENG_SWITCH = B.londres + 22;
export type ShotDef = { id: number; a: number; b: number; light: Light; place: string; sun?: [number, number]; night?: boolean; fog?: [number, number]; indoor?: boolean };
const cuts = [0, ERA_SWITCH, ENG_SWITCH, TT];
export const SHOTS: ShotDef[] = [{ id: 1, a: 0, b: cuts[1], light: "day", place: "g", sun: [235, 48] }, { id: 2, a: cuts[1], b: cuts[2], light: "day", place: "g", sun: [235, 50] }, { id: 3, a: cuts[2], b: TT, light: "day", place: "e", sun: [210, 42] }];
export const XFADE: Record<number, number> = {};
export const FLASH_AT = -100, FLASH2 = -100;
export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number) => [{ id: shotAt(f).id, alpha: 1 }];

// ---------------- where everyone is ----------------
export const STOP: V3 = [22, 0, 3];
/** the messenger: out of the camp at a run, a long fast stretch down the valley (seen from high), into the agora */
export const messX = (f: number) => { if (f < 250) return 714 - 0.19 * f; if (f < 336) return lerp(714 - 0.19 * 250, 64, ease(ramp(f, 250, 336)) * 0.9 + ramp(f, 250, 336) * 0.1); return lerp(64, STOP[0], 1 - (1 - ramp(f, 336, B.llega + 18)) ** 2); };
export const messAt = (f: number): { p: V3; mode: "run" | "stand" | "fall" | "lie" | "up" | "path"; k: number; facing: number } => {
  if (f < B.llega + 18) { const x = messX(f), z = x > GATE_X ? roadZ(x) + 0.6 : lerp(0.6, STOP[2], ramp(x, GATE_X, STOP[0])); return { p: [x, x > 3000 ? 0 : H(x, z), z], mode: "run", k: 0, facing: -1 }; }
  if (f < B.cae) return { p: [STOP[0], H(STOP[0], STOP[2]), STOP[2]], mode: "stand", k: 0, facing: 0 };
  if (f < B.cae + 16) return { p: [STOP[0], H(STOP[0], STOP[2]), STOP[2]], mode: "fall", k: ramp(f, B.cae, B.cae + 16), facing: 0 };
  if (f < B.levanta) return { p: [STOP[0], H(STOP[0], STOP[2]), STOP[2]], mode: "lie", k: 1, facing: 0 };
  if (f < B.levanta + 12) return { p: [STOP[0], H(STOP[0], STOP[2]), STOP[2]], mode: "up", k: ramp(f, B.levanta, B.levanta + 12), facing: 0 };
  const t0 = B.levanta + 22; if (f < t0) return { p: [STOP[0], H(STOP[0], STOP[2]), STOP[2]], mode: "stand", k: 1, facing: 1 };
  const t1 = t0 + 26; if (f < t1) { const x = lerp(STOP[0], GATE_X + 14, ramp(f, t0, t1)), z = lerp(STOP[2], -6, ramp(f, t0, t1)); return { p: [x, H(x, z), z], mode: "run", k: 0, facing: 1 }; }
  const z = lerp(-8, -150, ramp(f, t1, B.veras + 20) * 0.75 + ease(ramp(f, t1, B.veras + 20)) * 0.25), x = pathX(z); return { p: [x, H(x, z), z], mode: "path", k: 0, facing: 1 };
};
export const HIST0: V3 = [4, 0, 12], HIST1: V3 = [17.6, 0, 6.6];
export const histAt = (f: number): V3 => { const t = ease(ramp(f, B.herodoto - 20, B.herodoto + 50)); const x = lerp(HIST0[0], HIST1[0], t), z = lerp(HIST0[2], HIST1[2], t); return [x, H(x, z), z]; };
// 1896: the runners at the start, the winner on the road, at the taverna, into the stadium
export const START_X = VILLAGE_X - 3;
export const RUNNERS96 = 13;
export const runner96At = (i: number, f: number): V3 => { const row = i % 2, col = Math.floor(i / 2), off = -2.6 + col * 0.95 + row * 0.45, x0 = START_X - row * 1.3; if (f < B.bang) return onRoad(x0, off);
  const v = 0.215; return onRoad(x0 - v * (f - B.bang) * (1 - 0.15 * ramp(f, B.bang, B.bang + 30)), off * 0.8); };
export const LOUIS_I = 5;
export const TAV_STOP: V3 = onRoad(TAV_X + 1.2, 4.0);
export const louisAt = (f: number): { p: V3; mode: "run" | "stop" | "drink" | "track"; facing: number } => {
  const t1 = B.gano + 30, t2 = B.taberna - 6;
  if (f < t1) return { p: runner96At(LOUIS_I, f), mode: "run", facing: -1 };
  const x1 = runner96At(LOUIS_I, t1)[0];
  if (f < t2) { const x = lerp(x1, TAV_STOP[0] + 1.5, ease(ramp(f, t1, t2)) * 0.85 + ramp(f, t1, t2) * 0.15), off = lerp(0.6, 4.0, ramp(f, t2 - 18, t2)); return { p: onRoad(x, off), mode: "run", facing: -1 }; }
  if (f < t2 + 6) return { p: TAV_STOP, mode: "stop", facing: -1 };
  if (f < B.sigue) return { p: TAV_STOP, mode: "drink", facing: 0 };
  const t3 = B.estadio - 10;
  if (f < t3) { const u = ramp(f, B.sigue, t3), x = lerp(TAV_STOP[0], GATE_X + 4, u * u * (3 - 2 * u) * 0.9 + u * 0.1), off = lerp(4.0, 0.6, ramp(f, B.sigue, B.sigue + 14)); return { p: x > GATE_X ? onRoad(x, off) : [x, 0, 0], mode: "run", facing: -1 }; }
  const x = lerp(GATE_X + 4, -30, ramp(f, t3, B.londres + 10)); return { p: [x, H(x, 4), 4], mode: "track", facing: -1 };
};
// England: the start on the castle lawn, the leader along the avenue, into the stadium, the finish at the royal box
export const START08: V3 = [ENG + 30, 0, 0];
export const ROYAL: V3 = [WCITY.x, 0, WCITY.z - 54];
export const FIN: V3 = [WCITY.x, 0, WCITY.z - 46];
export const RUN08 = 9;
export const runner08At = (i: number, f: number): V3 => { const row = i % 3, col = Math.floor(i / 3), z = -2.4 + col * 1.6 + row * 0.5, x0 = START08[0] + row * 1.2; const bang = B.windsor + 8;
  if (f < bang) return [x0, HE(x0, z), z]; const x = x0 + 0.23 * (f - bang); return [x, HE(x, z), z * 0.85]; };
export const leaderAt = (f: number): { p: V3; mode: "run" | "fin"; } => {
  const bang = B.windsor + 8, tEnter = B.medida + 6, tFin = B.meta + 6, xEnter = FIN[0] + 40;
  if (f < B.palco - 6) { const p = runner08At(0, f); return { p, mode: "run" }; }
  if (f < tEnter) { const x0 = runner08At(0, B.palco - 6)[0], x = lerp(x0, xEnter + 30, ease(ramp(f, B.palco - 6, tEnter))); const z = lerp(0, FIN[2], ramp(x, xEnter - 30, xEnter + 30)); return { p: [x, HE(x, z), z], mode: "run" }; }
  if (f < tFin) { const x = lerp(xEnter, FIN[0] - 0.5, ramp(f, tEnter, tFin)), z = FIN[2]; return { p: [x, HE(x, z) + 0.04, z], mode: "run" }; }
  const x = FIN[0] - 0.5 - 2.2 * ease(ramp(f, tFin, tFin + 20)); return { p: [x, HE(x, FIN[2]) + 0.04, FIN[2]], mode: "fin" }; void bang; };

// ---------------- the camera ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
type Rig = (f: number) => Cam;
type Key = { f: number; rig: Rig; blend: number; arc?: number };
const add3 = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const dolly = (f0: number, f1: number, p0: V3, p1: V3, l0: V3, l1: V3, fov0 = 50, fov1 = fov0, r0 = 0, r1 = 0): Rig => (f) => { const t = smooth(ramp(f, f0, f1)) * 0.6 + ramp(f, f0, f1) * 0.4; return { pos: lerp3(p0, p1, t), look: lerp3(l0, l1, t), fov: lerp(fov0, fov1, t), roll: lerp(r0, r1, t) }; };
/** follow a subject: offset in a frame aligned with heading (ax = along heading, sd = to its left, y up) */
const follow = (subj: (f: number) => V3, head: (f: number) => [number, number], f0: number, f1: number, o0: V3, o1: V3, lk0: V3 = [0, 1.1, 0], lk1: V3 = lk0, fov0 = 50, fov1 = fov0, roll = 0): Rig => (f) => {
  const s = subj(f), t = smooth(ramp(f, f0, f1)) * 0.6 + ramp(f, f0, f1) * 0.4, o = lerp3(o0, o1, t), [hx, hz] = head(f), lx = -hz, lz = hx, lk = lerp3(lk0, lk1, t);
  return { pos: [s[0] + hx * o[0] + lx * o[2], s[1] + o[1], s[2] + hz * o[0] + lz * o[2]], look: [s[0] + hx * lk[0] + lx * lk[2], s[1] + lk[1], s[2] + hz * lk[0] + lz * lk[2]], fov: lerp(fov0, fov1, t), roll }; };
const WEST: (f: number) => [number, number] = () => [-1, 0], EAST: (f: number) => [number, number] = () => [1, 0];
const roadWest = (x: number): [number, number] => { const [dx, dz] = roadDir(Math.min(CAMP_X, Math.max(GATE_X, x))); return [-dx, -dz]; };
const KEYS: Key[] = [];
{ const b = B, M = (f: number) => messAt(f).p;
  // HOOK: beside the messenger as he sprints out of the camp, the army cheering behind; he passes the lens
  KEYS.push({ f: 0, blend: 0, rig: follow(M, (f) => roadWest(messAt(f).p[0]), 0, b.grecia, [3.0, 1.35, -4.8], [-3.2, 1.7, -5.0], [0.6, 1.0, 0], [0.0, 1.1, 0], 50, 52, 0.02) });
  // GRECIA: the camera rises over the camp and turns to the bay: the Persian fleet pulling away, the army on the beach
  KEYS.push({ f: b.grecia, blend: 46, arc: 6, rig: dolly(b.grecia, b.mensajero, [CAMP_X - 26, 16, roadZ(CAMP_X) + 30], [CAMP_X - 8, 34, roadZ(CAMP_X) + 52], [BEACH_X + 30, 2, roadZ(CAMP_X) - 6], [BEACH_X + 120, 0, roadZ(CAMP_X) - 30], 54, 56) });
  // MENSAJERO: a long flight down the valley high above him, then down to the gate of Athens
  KEYS.push({ f: b.mensajero, blend: 40, arc: 10, rig: (f) => { const p = M(f), rw = roadWest(p[0]), kk = ramp(p[0], 140, 70), hl = Math.hypot(lerp(rw[0], -1, kk), lerp(rw[1], 0, kk)), hx = lerp(rw[0], -1, kk) / hl, hz = lerp(rw[1], 0, kk) / hl, t = ramp(f, b.mensajero, b.llega); return { pos: [p[0] - hx * lerp(-40, 14, t) + hz * lerp(24, 1.2, t), p[1] + lerp(46, 5.2, t * t), p[2] - hz * lerp(-40, 14, t) - hx * lerp(24, 1.2, t)], look: [p[0] + hx * lerp(30, 4, t), p[1] + lerp(0, 1.4, t), p[2] + hz * lerp(30, 4, t)], fov: lerp(58, 50, t), roll: 0 }; } });
  // LLEGA: in front of him as he bursts through the gate into the agora; round him as he shouts, the Acropolis behind
  KEYS.push({ f: b.llega - 34, blend: 44, arc: 9, rig: (f) => { const p = M(f), t = ramp(f, b.llega, b.cae - 6), a = lerp(-0.08, 1.0, ease(t)), r = lerp(6.5, 4.6, t); return { pos: [p[0] - r * Math.cos(a), p[1] + lerp(1.4, 0.9, t), p[2] + r * Math.sin(a)], look: [p[0], p[1] + lerp(1.2, 1.5, t), p[2]], fov: 50, roll: 0 }; } });
  KEYS.push({ f: b.cae - 6, blend: 24, rig: dolly(b.cae - 6, b.momento + 10, add3(STOP, [-5.4, 1.5, 1.9]), add3(STOP, [-4.4, 1.15, 0.9]), add3(STOP, [1.6, 0.85, 0]), add3(STOP, [1.0, 0.75, 0]), 50, 48) });
  // UN MOMENTO / HERODOTO: pull back to bring the historian in from the stoa; the messenger gets up
  KEYS.push({ f: b.momento + 10, blend: 30, rig: dolly(b.momento + 10, b.esparta, add3(STOP, [-4.2, 1.8, 7.4]), add3(STOP, [-6.4, 2.2, 8.2]), add3(STOP, [-1.4, 0.8, 0.9]), add3(STOP, [-1.2, 1.0, 0.4]), 50, 52) });
  // ESPARTA: he runs out through the gate and up the path into the pines; the camera climbs after him and rises
  KEYS.push({ f: b.esparta, blend: 34, arc: 3, rig: (f) => { const p = M(f), t = ramp(f, b.esparta, b.veras), out = ramp(f, b.esparta + 18, b.esparta + 48); return { pos: [p[0] + lerp(-7.5, 3, ramp(f, b.esparta + 10, b.esparta + 60)), p[1] + lerp(2.4, 14, t * t) + 2.5 * Math.sin(Math.PI * ramp(f, b.esparta + 14, b.esparta + 50)), p[2] + lerp(1.2, 11 + 8 * t, out)], look: [p[0] + lerp(4, 0, ramp(f, b.esparta, b.esparta + 44)), p[1] + lerp(1.2, 1.5, t), p[2] + lerp(0, -5, t)], fov: lerp(50, 54, t), roll: 0 }; } });
  // VERAS (1896): over the hills and down the valley to the start at the village of Marathon
  KEYS.push({ f: b.veras, blend: 60, arc: 30, rig: dolly(b.veras, b.breal, onRoad(START_X - 22, 14, 9), onRoad(START_X - 8, 9, 3.2), onRoad(START_X + 2, -1, 1.2), onRoad(START_X - 1, -3, 1.2), 52, 50) });
  // BREAL: along the line of runners to the linguist with his silver cup and the starter with his pistol
  KEYS.push({ f: b.breal, blend: 30, rig: dolly(b.breal, b.bang + 8, onRoad(START_X - 11, 4.4, 1.7), onRoad(START_X - 10, 0.4, 1.8), onRoad(START_X - 4, 7.6, 1.3), onRoad(START_X, 0.6, 1.2), 46, 52) });
  // GANO: tracking the winner as the field runs off, then fast and high down the valley to the taverna
  KEYS.push({ f: b.gano - 10, blend: 30, rig: (f) => { const p = louisAt(f).p, [hx, hz] = roadWest(p[0]), t = ramp(f, b.gano, b.taberna - 8); return { pos: [p[0] - hx * lerp(-6, -18, t) + hz * lerp(3.2, 12, t), p[1] + lerp(1.4, 18, t * (2 - t)), p[2] - hz * lerp(-6, -18, t) - hx * lerp(3.2, 12, t)], look: [p[0] + hx * lerp(-1, 6, t), p[1] + 1.1, p[2] + hz * lerp(-1, 6, t)], fov: lerp(50, 56, t), roll: 0 }; } });
  // TABERNA: down under the vine: the taverner hands him a glass, he drinks it off, and he is away again
  KEYS.push({ f: b.taberna - 8, blend: 30, rig: dolly(b.taberna - 8, b.sigue + 4, add3(TAV_STOP, [-4.4, 1.5, -3.6]), add3(TAV_STOP, [-2.4, 1.35, -3.4]), add3(TAV_STOP, [0.6, 1.2, 0.8]), add3(TAV_STOP, [0.3, 1.25, 0.6]), 48, 46) });
  // ESTADIO: after him to Athens and into the marble stadium full of people
  KEYS.push({ f: b.sigue + 4, blend: 30, arc: 12, rig: (f) => { const p = louisAt(f).p, t = ramp(f, b.estadio - 14, b.londres), fl = 1 - ramp(f, b.estadio - 24, b.estadio + 4); return { pos: [p[0] + lerp(7.5, 5.0, t), p[1] + lerp(2.6, 2.4, t) + 24 * fl * ramp(f, b.sigue, b.sigue + 20), p[2] + lerp(4.0, 12.0, t)], look: [p[0] - lerp(12, 22, t), p[1] + lerp(2.2, 6.5, t), p[2] - lerp(2, 24, t)], fov: 56, roll: 0 }; } });
  // LONDRES: up out of the stadium into the clouds ... and down through them over England to the castle
  KEYS.push({ f: b.londres - 14, blend: 30, rig: (f) => { const t = ramp(f, b.londres - 14, ENG_SWITCH); return { pos: [lerp(-20, -10, t), lerp(14, 260, t * t), lerp(14, 40, t)], look: [lerp(-60, -40, t), lerp(10, 300, t), lerp(0, 30, t)], fov: 56, roll: 0 }; } });
  KEYS.push({ f: ENG_SWITCH, blend: 0, rig: dolly(ENG_SWITCH, b.windsor, [ENG + 200, 240, 60], [START08[0] + 34, 3.6, 1.2], [ENG + 80, 160, 20], [START08[0] - 20, 6, -22], 56, 50) });
  // WINDSOR: the start on the lawn below the castle; the gun; they are off down the avenue
  KEYS.push({ f: b.windsor, blend: 22, rig: dolly(b.windsor, b.palco - 10, [START08[0] + 34, 3.6, 1.2], [START08[0] + 30, 2.4, 0.8], [START08[0] - 20, 6, -22], [START08[0] - 4, 2.4, -3], 50, 50) });
  // PALCO: a fast flight down the avenue and over the stands to the royal box
  KEYS.push({ f: b.palco - 10, blend: 36, arc: 18, rig: dolly(b.palco - 10, b.medida + 6, add3(ROYAL, [10, 7, 30]), add3(ROYAL, [4, 4.5, 16]), add3(ROYAL, [0, 5.5, 0]), add3(ROYAL, [0, 5.0, 0]), 50, 48) });
  // MEDIDA / META: the runner comes down the straight; we run with him to the line in front of the queen
  KEYS.push({ f: b.medida + 6, blend: 30, rig: (f) => { const p = leaderAt(f).p, t = ramp(f, b.medida + 6, b.meta + 6); return { pos: [p[0] - lerp(6.5, 4.5, t), p[1] + lerp(1.4, 1.5, t), p[2] + lerp(3.4, 5.8, t)], look: [p[0] + 0.5, p[1] + 1.3, p[2] - lerp(0, 2, t)], fov: 50, roll: 0 }; } });
  // REINA: round the runner to the royal box, the queen waving; up and back over the stadium to the end
  KEYS.push({ f: b.meta + 6, blend: 30, rig: (f) => { const t = ramp(f, b.meta + 6, TT), a = lerp(0.2, 1.1, ease(t)), r = lerp(7, 15, t * t); return { pos: [FIN[0] + r * Math.sin(a) - 3, HE(FIN[0], FIN[2]) + lerp(1.6, 8, t * t), FIN[2] + r * Math.cos(a)], look: [FIN[0] - 3.6, lerp(1.6, 3.6, t), FIN[2] - lerp(1.5, 4.5, t)], fov: lerp(48, 56, t), roll: 0 }; } });
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
export const dofAt = (f: number): { cInf: number; focus?: (f: number) => V3 } => { const c = camAt(0, f), d = Math.hypot(c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]); return { cInf: c.pos[1] - (c.pos[0] > 3000 ? HE(c.pos[0], c.pos[2]) : H(c.pos[0], c.pos[2])) > 12 ? 0 : d < 9 ? 5 : d < 14 ? 3 : 0 }; };
export type Lamp = { p: V3; c: string; i: number; d: number };
export const lampsAt = (_id: number, _f: number): Lamp[] => [];
export type Pool = { p: V3; r: number };
export type Glow = { p: V3; r: number; col: string; a: number };
export type Lighting = { wash?: { col: string; a: number }; pools: Pool[]; glows: Glow[]; vig: number; beams?: number; tint?: { col: string; a: number } };
/** the cloud bank between Athens and England whites the frame out for a moment */
export const cloudWhite = (f: number) => Math.max(0, 1 - Math.abs(f - ENG_SWITCH) / 14) ** 0.7;
export const lightingAt = (_id: number, f: number): Lighting => { const w = cloudWhite(f); return { pools: [], glows: [], vig: 0.24, beams: 0.1, tint: w > 0.01 ? { col: "#f4f6fb", a: Math.min(1, w * 1.05) } : { col: "#f0c890", a: 0.04 } }; };
export const KICKS: number[] = [];
export { GATE_X, TAV_X, VILLAGE_X, CAMP_X, BEACH_X, ACRO, STAD, ENG, CASTLE, WCITY, onRoad, roadZ };
