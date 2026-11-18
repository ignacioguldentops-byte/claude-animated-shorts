// "Hielo caliente": timeline of the short. Every beat derives from timing.ts (start/end frame of each narrated line),
// so the picture re-times itself when the narration changes.
// Camera grammar from the skill: cuts on big jumps, ease-out glides, every hold creeps, kicks on impacts.
import { JX, RX, FIN_X, TOWN, ry } from "./setsj";
import { sNear, sledAt, trackAt, beside } from "./track";
import { LINES, TOTAL as TT } from "./timing";
import type { LightK } from "./lights";
import { getInputProps } from "remotion";
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
  isla: A(1, 0.2), flake: A(1, 0.4), volcar: A(1, 0.6), jam: L(2) - CUT, carr: A(2, 0.325), piensan: A(2, 0.615), idea: A(2, 0.8),
  velo: L(3) - CUT, no: A(3, 0.1), asi: A(3, 0.36), reggae: A(3, 0.72), calg: L(4) - CUT, vend: A(4, 0.42), tres: L(5) - CUT, slip: A(5, 0.2), herm: A(5, 0.43), animar: A(5, 0.72),
  espera: L(6) - CUT, q: A(6, 0.35), veras: L(7) - CUT, enton: L(8) - CUT, vuelcan: A(8, 0.27), cascos: A(8, 0.55), levan: L(9) - CUT, caminan: A(9, 0.22), publico: A(9, 0.6),
  ult: L(10) - CUT, seis: L(11) - CUT, ganaron: A(11, 0.5), end: TT,
};
export type Place = "track" | "town" | "beach" | "road";
/** sun: absolute [yaw deg, elevation deg] */
export type ShotDef = { id: number; a: number; b: number; light: Light; place: Place; sun?: [number, number] };
const MOON: [number, number] = [40, 55];
const mk = (id: number, a: number, b: number, place: Place, light: Light = "night", x: Partial<ShotDef> = {}): ShotDef => ({ id, a, b, place, light, sun: light === "night" ? MOON : undefined, ...x });
export const SHOTS: ShotDef[] = [
  mk(1, 0, B.isla, "track"),                         // HOOK: this Olympic sled...
  mk(2, B.isla, B.volcar, "beach", "day"),           // ...comes from an island where it has never snowed
  mk(3, B.volcar, B.jam, "track"),                   // and it is about to flip at 130 km/h
  mk(4, B.jam, B.carr, "road", "day"),               // Jamaica, 1987
  mk(5, B.carr, B.piensan, "road", "day"),           // two businessmen watch a pushcart race
  mk(6, B.piensan, B.velo, "road", "day"),           // and think: this is a sled without ice
  mk(7, B.velo, B.asi, "beach", "day"),              // no sprinter says yes
  mk(8, B.asi, B.calg, "beach", "golden", { sun: [205, 16] }),           // so they recruit soldiers... and a reggae singer
  mk(9, B.calg, B.vend, "town", "day"),              // months later they are in Calgary
  mk(10, B.vend, B.tres, "town", "day"),             // selling T-shirts to be able to compete
  mk(11, B.tres, B.herm, "town", "day"),             // three days before the race one gets hurt
  mk(12, B.herm, B.espera, "track"),                 // the pilot's brother steps in: he had only come to cheer
  mk(13, B.espera, B.veras, "track"),                // wait: and they race with that?
  mk(14, B.veras, B.enton, "track"),                 // at the start they are the seventh fastest in the world
  mk(15, B.enton, B.vuelcan, "track"),               // and then...
  mk(16, B.vuelcan, B.cascos, "track"),              // they flip
  mk(17, B.cascos, B.levan, "track"),                // helmets scraping the ice
  mk(18, B.levan, B.caminan, "track"),               // they get up
  mk(19, B.caminan, B.ult, "track"),                 // and walk to the finish, the whole crowd on its feet
  mk(20, B.ult, B.seis, "track"),                    // they finished last
  mk(21, B.seis, B.ganaron, "track", "day"),      // six years later they came back
  mk(22, B.ganaron, TT, "track", "day"),          // and beat the United States
];
export const XFADE: Record<number, number> = { 4: 10, 9: 12, 12: 10, 21: 12 };
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
const S = (id: number) => SHOTS[id - 1];
const j = (x: number, y: number, z: number): V3 => [JX + x, y, z];
const r = (x: number, y: number, z: number): V3 => [RX + x, y, z];
const t = (x: number, y: number, z: number): V3 => [TOWN[0] + x, y, TOWN[1] + z];
// ---------------- the sled's run ----------------
export const S0 = sNear(0, -155.6), SH = sNear(-4, -81), SK = sNear(-14, -31), SF = sNear(FIN_X, -16), S15 = sNear(-4.5, -121) - 4;
const v3 = (p: { x: number; y: number; z: number }, dy = 0): V3 => [p.x, p.y + dy, p.z];
/** how high the sled rides up the wall of a banked curve */
export const ride = (s: number) => trackAt(s).b * 1.05;
export type SledState = { s: number; phi: number; side?: number; shake?: number };
/** the sled of the island at frame f (undefined when it is not on screen) */
export const sledOf = (id: number, f: number): SledState | undefined => {
  const a = S(id).a, u = f - a;
  switch (id) {
    case 1: { const s = SH - 40 + 1.2 * u; return { s, phi: ride(s) }; }
    case 3: { const s = SK - 10 + 0.5 * u - 0.0026 * u * u; return { s, phi: 0.95 + 0.72 * smooth(u / 70) + 0.04 * Math.sin(u * 0.9), shake: ramp(u, 40, 80) }; }
    case 13: return { s: S0 + 4.2, phi: 0 };
    case 14: { const s = S0 + 0.2 + 25 * Math.pow(u / (S(14).b - a), 1.6); return { s, phi: ride(s) }; }
    case 15: { const s = S15 + 1.15 * u; return { s, phi: ride(s) }; }
    case 16: case 17: case 18: { // one continuous crash: up the wall, over, sliding on its side to a stop
      const q = f - B.vuelcan, s = q <= 20 ? SK - 8 + 0.75 * q : SK + 7 + 0.75 * (q - 20) - (0.75 * (q - 20) ** 2) / 124, sEnd = SK + 7 + 0.75 * 62 - (0.75 * 62 * 62) / 124;
      return { s: q > 82 ? sEnd : s, phi: 1.25 + 0.45 * ramp(q, 0, 11), side: ramp(q, 11, 19) };
    }
    case 19: return { s: SF - 9 + 0.06 * u, phi: 0 };
    case 21: return { s: SF - 42 + 1.05 * u, phi: 0 };
    case 22: return { s: SF + 13, phi: 0 };
  }
  return undefined;
};
/** where the sled is in the world: on the wall (phi), or tipped on its side on the floor (side 0..1) */
export const sledWorld = (st: SledState) => {
  const w = sledAt(st.s, st.phi), F = w.F;
  if (!st.side) return w;
  const k = st.side, upS = F.r.clone().multiplyScalar(-F.sg), posS = F.p.clone().addScaledVector(F.r, F.sg * 0.87).addScaledVector(F.n, 0.36);
  const pos = w.pos.clone().lerp(posS, k); pos.y = w.pos.y + (posS.y - w.pos.y) * k * k;
  return { pos, up: w.up.clone().lerp(upS, k).normalize(), fwd: w.fwd, F };
};
export const SSTOP = sledOf(18, 100000)!.s;
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
    const p = keys[i - 1], d = k.d ?? 14, tt = (f - (k.f - d)) / d, e = k.e === "s" ? smooth(tt) : outE(tt);
    const hold0 = Math.max(0, (k.f - d) - p.f), z0 = 1 - Math.min(0.14, hold0 * creep);
    const pp = lerp3(p.look, p.pos, z0);
    pos = lerp3(pp, k.pos, e); look = lerp3(p.look, k.look, e); fov = lerp(p.fov ?? 40, fov, e); roll = lerp(p.roll ?? 0, roll, e);
    return { pos, look, fov, roll };
  }
  const hold = Math.max(0, f - k.f), z = 1 - Math.min(0.14, hold * creep);
  pos = lerp3(look, pos, z);
  return { pos, look, fov, roll };
};
export const KICKS: number[] = [B.vuelcan + 19, B.vuelcan + 23, B.slip + 12, B.flake + 26, B.seis + 40];
const kick = (f: number) => { for (const k of KICKS) { const d = f - k; if (d >= 0 && d < 7) return (d % 2 ? -1 : 1) * 0.035 * (1 - d / 7); } return 0; };
const sledP = (id: number, f: number, dy = 0.5): V3 => v3(sledWorld(sledOf(id, f)!).pos, dy);
const inner = (s: number) => -trackAt(s).sg;

const DBG = (getInputProps() as { cam?: { pos: V3; look: V3; fov?: number } }).cam;
export const camAt = (id: number, f: number): Cam => {
  if (DBG) return { pos: DBG.pos, look: DBG.look, fov: DBG.fov ?? 50, roll: 0 };
  let cam: Cam; const Sh = S(id), a = Sh.a, b = Sh.b, u = f - a;
  switch (id) {
    case 1: { // HOOK: travelling backwards down the ice channel just ahead of the sled, which gains on us
      const st = sledOf(1, f)!, k = smooth(u / (b - a)), bank = trackAt(st.s).b * trackAt(st.s).sg;
      cam = { pos: beside(st.s + lerp(7.5, 3.4, k), 0, 0.8), look: sledP(1, f, 0.5), fov: lerp(50, 60, k), roll: -0.1 * bank }; break; }
    case 2: cam = path([ // the beach: a tourist in the sun, and one snowflake
      { f: a, pos: j(0.2, 1.9, 9.6), look: j(0.7, 1.2, 3.4), fov: 54, roll: -0.02 },
      { f: b, d: b - a, e: "s", pos: j(0.5, 1.3, 7.3), look: j(0.7, 1.05, 3.9), fov: 44, roll: 0.01 },
    ], f); break;
    case 3: { // the big curve, low in the channel ahead of the sled: it climbs the wall in slow motion
      const st = sledOf(3, f)!, k = smooth(u / (b - a)), d = lerp(9.5, 5.2, k);
      cam = { pos: beside(st.s + d, inner(SK) * 0.5, lerp(0.7, 0.5, k)), look: sledP(3, f, 0.35), fov: lerp(54, 46, k), roll: 0.03 + 0.06 * k }; break; }
    case 4: cam = path([ // Jamaica, 1987: over the village road, down to the sea
      { f: a, pos: r(1.6, ry(-78) + 8.2, -78), look: r(0, 2.5, 6), fov: 52, roll: 0.02 },
      { f: b, d: b - a, e: "s", pos: r(0.9, ry(-58) + 3.4, -58), look: r(0, 1.2, -6), fov: 50, roll: -0.02 },
    ], f); break;
    case 5: cam = path([ // the pushcart race comes down at us
      { f: a, pos: r(-0.7, ry(-12) + 0.6, -12), look: r(0.1, ry(-30) + 0.9, -30), fov: 50, roll: -0.03 },
      { f: b, d: b - a, e: "s", pos: r(-0.9, ry(-6) + 0.7, -6), look: r(0.4, ry(-22) + 1.0, -22), fov: 56, roll: 0.03 },
    ], f); break;
    case 6: cam = path([ // the two businessmen at the roadside
      { f: a, pos: r(-0.9, ry(-12.6) + 1.7, -12.6), look: r(3.3, ry(-9.6) + 1.45, -9.6), fov: 48, roll: 0.02 },
      { f: B.idea + 6, d: 16, pos: r(-0.4, ry(-12.2) + 1.8, -12.2), look: r(3.2, ry(-9.6) + 2.0, -9.55), fov: 50, roll: -0.02 },
    ], f); break;
    case 7: cam = path([ // along the beach: the sprinters hear the idea
      { f: a, pos: j(-8.8, 1.5, 10.2), look: j(-2.3, 1.2, 6.5), fov: 52, roll: -0.02 },
      { f: b, d: b - a, e: "s", pos: j(-8.0, 1.45, 9.9), look: j(0.2, 1.2, 6.6), fov: 44, roll: 0.02 },
    ], f); break;
    case 8: cam = path([ // sunset on the parade ground: along the line of soldiers, ending on the singer
      { f: a, pos: j(-4.6, 1.5, 13.8), look: j(-3.0, 1.4, 18.4), fov: 46, roll: -0.02 },
      { f: B.reggae + 4, d: B.reggae + 4 - a - 6, e: "s", pos: j(1.0, 1.5, 14.3), look: j(1.5, 1.45, 18.4), fov: 42, roll: 0.02 },
    ], f); break;
    case 9: cam = path([ // Calgary: the square, the hill with the track, the mountains
      { f: a, pos: t(2.5, 3.4, 15), look: t(-2.5, 4.6, -20), fov: 54, roll: 0.02 },
      { f: b, d: b - a, e: "s", pos: t(0.2, 2.2, 14.2), look: t(-0.9, 1.9, -6), fov: 54, roll: -0.02 },
    ], f); break;
    case 10: cam = path([ // the stall
      { f: a, pos: t(1.4, 1.75, 1.6), look: t(0.1, 1.55, -4.6), fov: 48, roll: 0.02 },
      { f: b, d: b - a, e: "s", pos: t(0.5, 1.65, 0.6), look: t(0, 1.5, -4.6), fov: 44, roll: -0.02 },
    ], f); break;
    case 11: cam = path([ // an icy patch on the square
      { f: a, pos: t(5.6, 1.5, 9.6), look: t(4.7, 1.0, 3.6), fov: 48, roll: -0.02 },
      { f: B.slip + 14, d: 10, pos: t(5.2, 0.8, 9.0), look: t(4.6, 0.6, 3.6), fov: 50, roll: 0.03 },
    ], f); break;
    case 12: cam = path([ // the grandstand: the brother with his flag
      { f: a, pos: [34.95, 2.0, -12.7], look: [34.15, 1.25, -17.9], fov: 50, roll: 0.02 },
      { f: B.animar + 8, d: 18, pos: [34.55, 1.9, -13.1], look: [34.05, 1.3, -17.9], fov: 48, roll: -0.02 },
    ], f); break;
    case 13: cam = path([ // the top of the track: from behind the four, up and over the drop
      { f: a, pos: [0.9, 26.3, -155.3], look: [0, 25.4, -148], fov: 52, roll: 0.03 },
      { f: b, d: b - a, e: "s", pos: [0.4, 29.4, -153.4], look: [-0.6, 15, -122], fov: 64, roll: -0.03 },
    ], f, 0); break;
    case 14: { // push start: travelling beside them, then it lets them go down the hill
      const k = u / (b - a), cs = S0 + 1.6 + 0.8 * (sledOf(14, f)!.s - S0);
      cam = { pos: beside(cs, lerp(3.9, 3.3, k), lerp(2.1, 2.7, k)), look: sledP(14, f, 0.6), fov: lerp(50, 54, k), roll: -0.02 + 0.04 * smooth(u / 80) }; break; }
    case 15: { // chase down the S-bends
      const s = sledOf(15, f)!.s, p = v3(sledAt(s - 6, 0.55 * ride(s - 6)).pos, 2.4), q = sledP(15, f, 0.5), ah = sledAt(s + 6, 0.5 * ride(s + 6)).pos, bank = trackAt(s).b * trackAt(s).sg;
      cam = { pos: p, look: [lerp(q[0], ah.x, 0.3), lerp(q[1], ah.y + 0.4, 0.3), lerp(q[2], ah.z, 0.3)], fov: 60, roll: -0.16 * bank }; break; }
    case 16: { // the big curve again, from further back: this time it goes over
      const st = sledOf(16, f)!;
      cam = { pos: beside(st.s + 8.5 - 0.08 * u, inner(SK) * 0.6, 0.75), look: sledP(16, f, 0.4), fov: 52, roll: 0.07 }; break; }
    case 17: { // low in the channel, ahead of the sled sliding on its side
      const st = sledOf(17, f)!, s = st.s, d = lerp(5.0, 4.0, smooth(u / (b - a))), w = sledWorld(st), lk = w.pos.clone().addScaledVector(w.up, 0.45);
      cam = { pos: beside(s + d, inner(SK) * 0.95, 0.5), look: [lk.x, lk.y + 0.3, lk.z], fov: 50, roll: -0.05 }; break; }
    case 18: cam = path([ // it has stopped: they crawl out
      { f: a, pos: beside(SSTOP + 0.4, inner(SK) * 7.4, 1.9), look: v3(sledAt(SSTOP + 0.05).pos, 0.9), fov: 57, roll: 0.03 },
      { f: b, d: b - a, e: "s", pos: beside(SSTOP + 0.1, inner(SK) * 6.9, 1.8), look: v3(sledAt(SSTOP + 0.05).pos, 1.0), fov: 56, roll: 0 },
    ], f); break;
    case 19: cam = path([ // walking to the line, the crowd on its feet
      { f: a, pos: [FIN_X + 0.6, 2.4, -15.4], look: [FIN_X - 8.6, 1.25, -16.05], fov: 50, roll: -0.02 },
      { f: B.publico + 10, d: 40, e: "s", pos: [FIN_X + 2.4, 2.6, -15.0], look: [FIN_X - 6.4, 1.5, -16.3], fov: 52, roll: 0.02 },
      { f: b, d: b - B.publico - 12, e: "s", pos: [FIN_X + 4.4, 4.4, -14.2], look: [FIN_X - 5, 2.4, -17.2], fov: 56, roll: -0.01 },
    ], f); break;
    case 20: cam = path([ // the results board
      { f: a, pos: [80, 1.7, -12.4], look: [80, 8.3, -21.9], fov: 64, roll: 0.02 },
      { f: b - 8, d: b - a - 12, e: "s", pos: [79.6, 1.7, -12.4], look: [78.75, 4.9, -21.9], fov: 36, roll: -0.01 },
    ], f, 0); break;
    case 21: { // six years later: travelling ahead of the sled, which blasts past us at the line
      const st = sledOf(21, f)!, k = smooth(u / (b - a));
      cam = { pos: beside(Math.min(st.s + 8, SF + 2.5), 2.1, 1.25), look: sledP(21, f, 0.45), fov: lerp(50, 60, k), roll: -0.04 + 0.08 * k }; break; }
    default: cam = path([ // the four of them celebrating past the line; the rivals roll in behind
      { f: a, pos: [FIN_X + 21.8, 1.7, -12.4], look: [FIN_X + 16.6, 1.55, -16.1], fov: 54, roll: 0.02 },
      { f: b - 6, d: b - a - 36, e: "s", pos: [FIN_X + 27, 7.4, -8.2], look: [FIN_X + 11, 4.6, -19.5], fov: 58, roll: -0.02 },
    ], f); break;
  }
  // hand-held life: a slow sway on every shot
  const k = kick(f), sw = id === 15 || id === 1 || id === 21 ? 0.4 : 1, sx = sw * 0.014 * Math.sin(f * 0.11 + id), sy = sw * 0.009 * Math.sin(f * 0.17 + id * 2);
  const shake = id === 15 ? 0.02 * Math.sin(f * 1.9) : id === 17 ? 0.012 * Math.sin(f * 2.3) * (1 - ramp(f, a, b)) : 0;
  const roll = cam.roll + 0.004 * Math.sin(f * 0.09 + id);
  return { ...cam, roll, pos: [cam.pos[0] + sx, cam.pos[1] + k + sy + shake, cam.pos[2]], look: [cam.look[0], cam.look[1] + k * 0.6 + shake * 0.5, cam.look[2]] };
};

/** lens blur per beat: cInf px at 1080 (0 = sharp), optional focus point (default: the camera's look point) */
export const dofAt = (f: number): { cInf: number; focus?: (f: number) => V3 } => {
  const id = shotAt(f).id;
  if (id === 4 || id === 9 || id === 13 || id === 20) return { cInf: 0 };
  if (id === 1 || id === 15 || id === 21 || id === 5) return { cInf: 5 };
  return { cInf: 8 };
};

// ---------------- real scene lights (point lights, max 6) + screen-space finishing ----------------
export type Lamp = { p: V3; c: string; i: number; d: number };
export const lampsAt = (id: number, f: number): Lamp[] => {
  const s = S(id), Lm: Lamp[] = [];
  if (s.light !== "night") return Lm;
  const st = sledOf(id, f);
  if (st) { const w = sledWorld(st), p = w.pos; Lm.push({ p: [p.x, p.y + 4.5, p.z], c: "#eef4ff", i: 9, d: 26 }, { p: [p.x + 6, p.y + 6, p.z + 5], c: "#fff0d8", i: 6, d: 30 }, { p: [p.x - 7, p.y + 6, p.z - 5], c: "#dfe9ff", i: 6, d: 30 }); }
  if (id === 12) Lm.push({ p: [33.6, 5.5, -15.5], c: "#fff0d8", i: 9, d: 18 }, { p: [29, 8, -21], c: "#eef4ff", i: 6, d: 22 }, { p: [39, 8, -21], c: "#eef4ff", i: 6, d: 22 });
  if (id === 13) Lm.push({ p: [0, 28.5, -150], c: "#eef4ff", i: 8, d: 40 }, { p: [0, 27.5, -154.5], c: "#fff0d8", i: 5, d: 12 });
  if (id === 20) Lm.push({ p: [80, 6, -15], c: "#eef4ff", i: 9, d: 24 }, { p: [80, 9, -19], c: "#fff0d8", i: 5, d: 16 });
  if (id === 19) Lm.push({ p: [FIN_X - 4, 7, -12], c: "#fff0d8", i: 8, d: 30 }, { p: [FIN_X + 2, 7, -22], c: "#eef4ff", i: 7, d: 30 });
  return Lm.slice(0, 6);
};
export type Pool = { p: V3; r: number };
export type Glow = { p: V3; r: number; col: string; a: number };
export type Lighting = { wash?: { col: string; a: number }; pools: Pool[]; glows: Glow[]; vig: number; beams?: number; tint?: { col: string; a: number } };
export const lightingAt = (id: number, f: number): Lighting => {
  const s = S(id), Lg: Lighting = { pools: [], glows: [], vig: s.light === "night" ? 0.5 : 0.3 };
  if (id === 19 || id === 22) Lg.beams = 0.3;
  if (id === 2 || id === 7) Lg.beams = 0.22;
  if (id === 8) Lg.beams = 0.3;
  void f;
  return Lg;
};
export { j as J3, r as R3, t as T3 };
