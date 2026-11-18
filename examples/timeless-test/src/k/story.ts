// "Sin límite": timeline of the short. Every beat derives from timing.ts (start/end frame of each narrated line),
// so the picture re-times itself when the narration changes.
// Camera grammar from the skill: cuts on big jumps, ease-out glides, every hold creeps, kicks on impacts.
import { HX, TX, WK, PAV_X, BENCH } from "./setsk";
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
  diez: A(1, 0.22), sin: A(1, 0.45), barco: A(1, 0.68), sud: L(2) - CUT, ing: A(2, 0.3), limite: A(2, 0.6),
  dia: L(3) - CUT, tres: A(3, 0.2), seis: A(3, 0.34), comer: A(3, 0.47), dom: A(3, 0.79), espera: L(4) - CUT, q: A(4, 0.4),
  veras: L(5) - CUT, mientras: A(5, 0.57), diez2: L(6) - CUT, dos: A(6, 0.52), decimo: L(7) - CUT, llover: A(7, 0.73),
  barco2: L(8) - CUT, maletas: A(8, 0.5), largo: L(9) - CUT, empate: A(9, 0.62), hoy: L(10) - CUT, aun: A(10, 0.5), end: TT,
};
export type Place = "ground" | "harbour" | "station";
/** sun: absolute [yaw deg, elevation deg] */
export type ShotDef = { id: number; a: number; b: number; light: Light; place: Place; sun?: [number, number]; rain?: number; now?: boolean };
const MOON: [number, number] = [40, 55];
const mk = (id: number, a: number, b: number, place: Place, light: Light = "day", x: Partial<ShotDef> = {}): ShotDef => ({ id, a, b, place, light, sun: light === "night" ? MOON : undefined, ...x });
export const SHOTS: ShotDef[] = [
  mk(1, 0, B.diez, "ground", "golden", { sun: [205, 30] }),                 // HOOK: this cricket match...
  mk(2, B.diez, B.sin, "ground", "golden", { sun: [205, 30] }),             // ...has been going on for ten days
  mk(3, B.sin, B.barco, "ground", "golden", { sun: [205, 30] }),            // and it will end with no winner
  mk(4, B.barco, B.sud, "harbour", "golden", { sun: [25, 26] }),           // because one team has a boat to catch
  mk(5, B.sud, B.ing, "ground"),                        // South Africa, 1939
  mk(6, B.ing, B.limite, "ground"),                     // England and South Africa agree
  mk(7, B.limite, B.dia, "ground"),                     // to play with no time limit: until somebody wins
  mk(8, B.dia, B.tres, "ground", "day", { sun: [120, 62] }),          // a day goes by
  mk(9, B.tres, B.seis, "ground", "golden", { sun: [250, 13] }),      // three
  mk(10, B.seis, B.comer, "ground", "night"),           // six
  mk(11, B.comer, B.dom, "ground"),                     // they stop for lunch, they stop for tea
  mk(12, B.dom, B.espera, "ground"),                    // and on Sundays they rest
  mk(13, B.espera, B.veras, "ground"),                  // wait: how can it last so long?
  mk(14, B.veras, B.mientras, "ground"),                // in cricket the batsman does not have to run
  mk(15, B.mientras, B.diez2, "ground"),                // as long as he is not out he can stay for hours
  mk(16, B.diez2, B.dos, "ground"),                     // and ten of them have to be got out
  mk(17, B.dos, B.decimo, "ground"),                    // twice for each side
  mk(18, B.decimo, B.llover, "ground"),                 // day ten: England need forty-two runs
  mk(19, B.llover, B.barco2, "ground", "day", { rain: 1 }),            // and it starts to rain
  mk(20, B.barco2, B.maletas, "station", "golden", { rain: 0.4, sun: [75, 32] }),     // their boat leaves two days away by train
  mk(21, B.maletas, B.largo, "station", "golden", { rain: 0.4, sun: [300, 30] }),      // so they pack and go
  mk(22, B.largo, B.hoy, "ground", "golden", { rain: 0.25, sun: [205, 30] }),          // the longest match in history: a draw
  mk(23, B.hoy, B.aun, "ground", "day", { now: true }),                // today the longest ones last five days
  mk(24, B.aun, TT, "ground", "day", { now: true }),                   // and can still end in a draw
];
export const XFADE: Record<number, number> = { 5: 10, 9: 8, 10: 8, 11: 8, 23: 12 };
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
const h = (x: number, y: number, z: number): V3 => [HX + x, y, z];
const t = (x: number, y: number, z: number): V3 => [TX + x, y, z];

// ---------------- things that move, shared by camera and staging ----------------
export { BENCH };
/** crease where the striker stands, and the line of the bowler's run-up */
export const CREASE = WK - 1.22, RUNX = 0.95;
/** a delivery: release at f0, the ball reaches the bat n frames later (pitches two thirds of the way) */
export const ballAt = (f: number, f0: number, n = 16): V3 | undefined => {
  const k = (f - f0) / n; if (k < 0 || k > 1) return undefined;
  const z = lerp(-WK + 0.4, CREASE - 0.35, k), kb = 0.68, y = k < kb ? lerp(2.15, 0.09, (k / kb) ** 1.5) : 0.09 + 0.62 * Math.sin((Math.PI / 2) * ((k - kb) / (1 - kb)));
  return [lerp(RUNX - 0.25, -0.02, k), y, z];
};
/** the bowler along his run-up: u frames into a run of n frames that ends with the release */
export const bowlerZ = (u: number, n = 30) => lerp(-25, -WK - 0.3, smooth(clamp01(u / n)) * 0.35 + clamp01(u / n) * 0.65);
/** the train pulls out: metres travelled at frame f of shot 21 */
export const trainX = (f: number) => { const u = f - (S(21).a + 14); return u <= 0 ? 0 : 0.0052 * u * u; };
/** the two batsmen running between the wickets in shot 18: z of the striker (the other mirrors him) */
export const runZ = (f: number) => { const u = f - (S(18).a + 6), n = 30; if (u <= 0) return CREASE; const leg = Math.floor(u / n); if (leg >= 2) return CREASE; const k = smooth((u % n) / n) * 0.3 + ((u % n) / n) * 0.7; return leg === 0 ? lerp(CREASE, -CREASE, k) : lerp(-CREASE, CREASE, k); };

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
/** impacts: the bat in the hook, the horn, the two blocks, the collapse */
export const KICKS: number[] = [16 + 18, B.barco + 24, B.veras + 26, B.veras + 70, B.mientras + 62];
const kick = (f: number) => { for (const k of KICKS) { const d = f - k; if (d >= 0 && d < 7) return (d % 2 ? -1 : 1) * 0.03 * (1 - d / 7); } return 0; };

const DBG = (getInputProps() as { cam?: { pos: V3; look: V3; fov?: number } }).cam;
export const camAt = (id: number, f: number): Cam => {
  if (DBG) return { pos: DBG.pos, look: DBG.look, fov: DBG.fov ?? 50, roll: 0 };
  let cam: Cam; const Sh = S(id), a = Sh.a, b = Sh.b, u = f - a;
  switch (id) {
    case 1: { // HOOK: low down the pitch behind the ball, into the bat
      const rel = a + 16, bz = bowlerZ(u + 14, 30), bl = ballAt(Math.min(f, rel + 18), rel, 18), k = smooth(ramp(f, rel - 4, rel + 12));
      const zc = bl ? Math.min(bl[2] - 2.6, CREASE - 4.6) : bz - 3.4;
      cam = { pos: [lerp(2.2, 1.3, k), lerp(1.75, 0.8, k), zc], look: [lerp(RUNX, -0.1, k), lerp(1.25, 0.85, k), bl ? Math.min(bl[2] + 6, CREASE) : bz + 4], fov: lerp(54, 46, k), roll: -0.03 + 0.05 * k }; break; }
    case 2: cam = path([ // the man who has seen every ball
      { f: a, pos: [8.6, 1.7, 62.0], look: [11.9, 1.05, BENCH[2]], fov: 46, roll: 0.02 },
      { f: b, d: b - a, e: "s", pos: [10.4, 1.45, 63.4], look: [12.0, 1.12, BENCH[2]], fov: 40, roll: -0.02 },
    ], f); break;
    case 3: cam = path([ // batsman, keeper and umpire all look at their watches; the pavilion clock behind them
      { f: a, pos: [8.0, 1.4, 10.6], look: [-0.2, 1.05, 10.15], fov: 50, roll: -0.02 },
      { f: b, d: b - a, e: "s", pos: [7.2, 1.35, 10.4], look: [-0.2, 1.08, 10.15], fov: 48, roll: 0.02 },
    ], f); break;
    case 4: cam = path([ // the officer on the quay, then up the side of the liner
      { f: a, pos: h(-0.4, 1.5, 12.6), look: h(-3.2, 1.3, 8.2), fov: 46, roll: 0.02 },
      { f: a + 16, d: 1, pos: h(-0.4, 1.5, 12.6), look: h(-3.2, 1.3, 8.2), fov: 46, roll: 0.02 },
      { f: b, d: b - a - 18, e: "s", pos: h(8, 3.0, 21.5), look: h(1, 13, -10), fov: 70, roll: -0.03 },
    ], f, 0); break;
    case 5: cam = path([ // Durban: the whole ground from the air
      { f: a, pos: [84, 52, 46], look: [-30, 4, 0], fov: 50, roll: 0.03 },
      { f: b, d: b - a, e: "s", pos: [40, 17, 20], look: [-34, 5, 0], fov: 52, roll: -0.02 },
    ], f, 0); break;
    case 6: cam = path([ // the two captains shake on it
      { f: a, pos: [7.4, 1.6, 1.4], look: [0, 1.25, 0], fov: 46, roll: -0.02 },
      { f: b, d: b - a, e: "s", pos: [6.2, 1.5, -0.8], look: [0, 1.3, 0], fov: 42, roll: 0.02 },
    ], f); break;
    case 7: cam = path([ // the umpire tosses the coin... and then his watch
      { f: a, pos: [5.8, 1.55, 1.5], look: [-1.25, 1.4, 0], fov: 46, roll: 0.02 },
      { f: B.limite + 30, d: 14, pos: [5.4, 1.5, 1.0], look: [-1.3, 1.6, 0], fov: 46, roll: -0.01 },
      { f: b, d: 30, e: "s", pos: [6.4, 1.7, 2.2], look: [-1.2, 1.5, 0.1], fov: 50, roll: 0.02 },
    ], f); break;
    case 8: case 9: case 10: { // one camera for the days going by: behind the bowler's arm, creeping in
      const k = ramp(f, S(8).a, S(10).b);
      cam = { pos: [lerp(3.0, 2.3, k), lerp(4.2, 3.4, k), lerp(-30, -26, k)], look: [0, 1.0, 8], fov: 40, roll: 0.02 - 0.04 * k }; break; }
    case 11: cam = path([ // tea: along the table
      { f: a, pos: [-26.4, 1.55, 19.6], look: [-28.4, 1.05, 15.6], fov: 50, roll: 0.02 },
      { f: b, d: b - a, e: "s", pos: [-31.6, 1.45, 19.5], look: [-31.0, 1.08, 15.6], fov: 48, roll: -0.02 },
    ], f); break;
    case 12: cam = path([ // Sunday: everybody asleep in the middle
      { f: a, pos: [0.9, 7.6, 9.2], look: [0, 0.3, 0.3], fov: 46, roll: 0.03 },
      { f: b, d: b - a, e: "s", pos: [0.3, 6.6, 7.8], look: [0, 0.3, 0.1], fov: 44, roll: -0.02 },
    ], f); break;
    case 13: cam = path([ // wait...
      { f: a, pos: [10.0, 1.5, 62.8], look: [12, 1.12, BENCH[2]], fov: 42, roll: -0.02 },
      { f: B.q + 6, d: 12, pos: [10.8, 1.42, 63.6], look: [12.02, 1.4, BENCH[2]], fov: 36, roll: 0.02 },
    ], f); break;
    case 14: cam = path([ // he blocks it... and stays where he is
      { f: a, pos: [5.6, 1.3, 9.0], look: [-0.1, 0.95, 9.3], fov: 46, roll: -0.02 },
      { f: a + 44, d: 16, pos: [4.6, 1.25, 8.2], look: [-0.15, 1.0, 9.2], fov: 42, roll: 0.02 },
      { f: b, d: b - a - 50, e: "s", pos: [4.0, 1.2, 10.6], look: [-0.2, 1.0, 9.1], fov: 44, roll: -0.01 },
    ], f); break;
    case 15: { // beside the bowler all the way in: he bowls, hears the bat again, and drops
      const bz = bowlerZ(u - 4, 34) - 0.7, zz = Math.min(bz, -WK - 1.0), k2 = smooth(ramp(f, B.mientras + 58, B.mientras + 72));
      cam = { pos: [RUNX + 5.4 - 0.9 * smooth(u / (b - a)), 1.3, zz + 1.7 + 0.6 * k2], look: [RUNX, 1.0 - 0.3 * k2, zz + 0.2 + 0.75 * k2], fov: 50, roll: 0.02 }; break; }
    case 16: { // along the queue of padded-up batsmen
      const k = smooth(u / (b - a)), z = lerp(6.6, -5.0, k);
      cam = { pos: [-59.6, 1.45, z + 0.9], look: [-64.6, 1.1, z - 0.5], fov: 50, roll: 0.02 }; break; }
    case 17: cam = path([ // up and back: and the same again, and the other side
      { f: a, pos: [-57.5, 2.4, 8.5], look: [-63.6, 1.0, 0.5], fov: 54, roll: -0.02 },
      { f: b - 6, d: b - a - 8, e: "s", pos: [-46.5, 12.5, 12.5], look: [-61.4, 0.5, 0.2], fov: 54, roll: 0.02 },
    ], f, 0); break;
    case 18: { // they run: along the pitch with the striker, then the scoreboard, three lamps short
      const z = runZ(f), sb = a + 68;
      if (f < sb) cam = { pos: [6.4, 1.35, z * 0.72 + 1.2], look: [0, 1.0, z * 0.9], fov: 50, roll: 0.02 * Math.sin(u * 0.2) };
      else cam = path([{ f: sb, pos: [3, 11, 16], look: [0.5, 8.6, -78], fov: 13, roll: 0 }, { f: b, d: b - sb, e: "s", pos: [3, 11, 16], look: [4.9, 9.75, -78], fov: 6.6, roll: 0.01 }], f, 0);
      break; }
    case 19: cam = path([ // the first drop on his nose, then all of it
      { f: a, pos: [3.0, 1.45, 11.6], look: [-0.3, 1.25, 8.9], fov: 40, roll: 0.02 },
      { f: a + 17, d: 1, pos: [3.0, 1.45, 11.6], look: [-0.3, 1.25, 8.9], fov: 40, roll: 0.02 },
      { f: b, d: b - a - 19, e: "s", pos: [8.5, 6.5, 24], look: [-1, 1, 1], fov: 54, roll: -0.03 },
    ], f, 0); break;
    case 20: cam = path([ // the train in steam
      { f: a, pos: t(25.2, 2.1, 1.5), look: t(15.6, 2.4, -1.2), fov: 54, roll: 0.03 },
      { f: b, d: b - a, e: "s", pos: t(23.2, 1.8, 1.2), look: t(16.4, 2.1, -0.8), fov: 52, roll: -0.02 },
    ], f); break;
    case 21: { // down the platform after them as the tail of the train pulls away
      const d = trainX(f), k = smooth(u / (b - a));
      cam = { pos: t(-45.5 + 5.5 * k, lerp(1.9, 2.5, k), 4.4 - 0.9 * k), look: t(-35.4 + d * 0.55, 2.1, -0.9), fov: lerp(52, 46, k), roll: 0.02 - 0.04 * k }; break; }
    case 22: cam = path([ // the umpire alone: off come the bails
      { f: a, pos: [3.6, 1.35, 12.9], look: [-0.3, 1.1, WK + 0.1], fov: 44, roll: 0.02 },
      { f: B.empate + 6, d: 1, pos: [3.6, 1.35, 12.9], look: [-0.3, 1.1, WK + 0.1], fov: 44, roll: 0.02 },
      { f: b, d: b - B.empate - 8, e: "s", pos: [8.5, 7.5, 25], look: [-2, 1.2, 2], fov: 52, roll: -0.03 },
    ], f); break;
    case 23: cam = path([ // today
      { f: a, pos: [34, 34, 86], look: [0, 6, -14], fov: 54, roll: -0.03 },
      { f: b, d: b - a, e: "s", pos: [20, 15, 56], look: [0, 8, -20], fov: 50, roll: 0.02 },
    ], f, 0); break;
    default: cam = path([ // and his great-grandson, still waiting
      { f: a, pos: [8.8, 1.65, 62.2], look: [11.8, 1.1, BENCH[2]], fov: 46, roll: 0.02 },
      { f: a + 40, d: 30, e: "s", pos: [10.6, 1.45, 63.5], look: [12.0, 1.38, BENCH[2]], fov: 38, roll: -0.02 },
    ], f); break;
  }
  // hand-held life: a slow sway on every shot
  const k = kick(f), sw = id === 1 || id === 15 || id === 16 || id === 18 ? 0.4 : 1, sx = sw * 0.014 * Math.sin(f * 0.11 + id), sy = sw * 0.009 * Math.sin(f * 0.17 + id * 2);
  const shake = id === 18 && f < a + 68 ? 0.012 * Math.sin(f * 1.9) : 0;
  const roll = cam.roll + 0.004 * Math.sin(f * 0.09 + id);
  return { ...cam, roll, pos: [cam.pos[0] + sx, cam.pos[1] + k + sy + shake, cam.pos[2]], look: [cam.look[0], cam.look[1] + k * 0.6 + shake * 0.5, cam.look[2]] };
};

/** lens blur per beat: cInf px at 1080 (0 = sharp), optional focus point (default: the camera's look point) */
export const dofAt = (f: number): { cInf: number; focus?: (f: number) => V3 } => {
  const id = shotAt(f).id;
  if (id === 5 || id === 17 || id === 23 || id === 12 || (id === 18 && f >= S(18).a + 68)) return { cInf: 0 };
  if (id === 8 || id === 9 || id === 10) return { cInf: 3 };
  if (id === 1 || id === 15 || id === 16 || id === 18 || id === 21) return { cInf: 5 };
  return { cInf: 8 };
};

// ---------------- real scene lights (point lights, max 6) + screen-space finishing ----------------
export type Lamp = { p: V3; c: string; i: number; d: number };
export const lampsAt = (id: number, f: number): Lamp[] => {
  const Lm: Lamp[] = []; void f;
  if (id === 10) Lm.push({ p: [0, 9, 4], c: "#dfe9ff", i: 9, d: 60 }, { p: [3, 5, -18], c: "#dfe9ff", i: 7, d: 40 }, { p: [0, 7, 40], c: "#dfe9ff", i: 6, d: 50 });
  return Lm.slice(0, 6);
};
export type Pool = { p: V3; r: number };
export type Glow = { p: V3; r: number; col: string; a: number };
export type Lighting = { wash?: { col: string; a: number }; pools: Pool[]; glows: Glow[]; vig: number; beams?: number; tint?: { col: string; a: number } };
export const lightingAt = (id: number, f: number): Lighting => {
  const s = S(id), Lg: Lighting = { pools: [], glows: [], vig: s.light === "night" ? 0.5 : 0.3 };
  if (id === 2 || id === 3 || id === 13 || id === 24) Lg.beams = 0.25;
  if (id === 5 || id === 23) Lg.beams = 0.18;
  if (s.rain) { const k = id === 19 ? smooth(ramp(f, s.a + 14, s.a + 30)) : 1; Lg.tint = { col: "#33456e", a: 0.26 * s.rain * k + (id === 19 ? 0 : 0.04) }; }
  return Lg;
};
export { h as H3, t as T3, PAV_X };
