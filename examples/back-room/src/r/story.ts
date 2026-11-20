// "La trastienda": timeline of the short. Every beat derives from timing.ts (start/end frame of each narrated line),
// so the picture re-times itself when the narration changes.
// Camera grammar from the skill: cuts on big jumps, ease-out glides, every hold creeps, kicks on impacts.
import { SX, IX, BX, MX, FX, LX, HPX, PL, HL, SEATS } from "./setsr";
import { MAP_BCN, MAP_MAD } from "./paintr";
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
  fund: A(1, 0.24), tras: A(1, 0.56), madrid: L(2) - CUT, rareza: A(2, 0.19), est: A(2, 0.43), toros: A(2, 0.63), taberna: A(2, 0.84),
  falta: L(3) - CUT, llegan: L(4) - CUT, juan: A(4, 0.3), carlos: A(4, 0.38), bcn: A(4, 0.43), tienda: A(4, 0.62),
  su: L(5) - CUT, nace: A(5, 0.52), unif: L(6) - CUT, blanco: A(6, 0.28), londres: A(6, 0.44), espera: L(7) - CUT,
  veras: L(8) - CUT, rey: A(8, 0.4), rival: A(8, 0.7), barca: A(8, 0.86), pierde: L(9) - CUT, gol: A(9, 0.37), suizo: A(9, 0.8),
  asi: L(10) - CUT, fundado: A(10, 0.57), clasico: A(10, 0.83), end: TT,
};
export type Place = "stadium" | "street" | "shop" | "field" | "london" | "hipo";
/** sun: absolute [yaw deg, elevation deg]; night: floodlit stadium (day light under a night sky); fog: [near, far] */
export type ShotDef = { id: number; a: number; b: number; light: Light; place: Place; sun?: [number, number]; night?: boolean; fog?: [number, number]; indoor?: boolean };
const mk = (id: number, a: number, b: number, place: Place, light: Light = "day", x: Partial<ShotDef> = {}): ShotDef => ({ id, a, b, place, light, ...x });
const FLOOD: Partial<ShotDef> = { night: true, sun: [200, 66] };
const ROOM: Partial<ShotDef> = { indoor: true, sun: [20, 60] };
export const SHOTS: ShotDef[] = [
  mk(1, 0, B.fund, "stadium", "day", FLOOD),                         // HOOK: Real Madrid...
  mk(2, B.fund, B.madrid, "shop", "day", ROOM),                      // ...was founded by two Catalans, in the back room of a cloth shop
  mk(3, B.madrid, B.rareza, "street", "day", { sun: [300, 44] }),                               // Madrid, 1902
  mk(4, B.rareza, B.est, "street", "day", { sun: [205, 46] }),                                  // football is an English oddity
  mk(5, B.est, B.toros, "field"),                                    // some students play on waste ground
  mk(6, B.toros, B.taberna, "field"),                                // beside the bullring
  mk(7, B.taberna, B.falta, "field"),                                // and change in a tavern
  mk(8, B.falta, B.llegan, "field"),                                 // they lack everything
  mk(9, B.llegan, B.bcn, "street", "golden", { sun: [70, 24] }),     // until the Padrós brothers arrive: Juan and Carlos
  mk(10, B.bcn, B.tienda, "shop", "day", ROOM),                      // born in Barcelona
  mk(11, B.tienda, B.su, "street", "day", { sun: [25, 42] }),                                  // owners of a cloth shop in calle de Alcalá
  mk(12, B.su, B.nace, "shop", "day", ROOM),                         // in its back room, among bolts of cloth
  mk(13, B.nace, B.unif, "shop", "day", ROOM),                       // Madrid Football Club is born
  mk(14, B.unif, B.londres, "shop", "day", ROOM),                    // the kit? white
  mk(15, B.londres, B.espera, "london", "day", { fog: [14, 150], sun: [140, 40] }), // like a team of London gentlemen
  mk(16, B.espera, B.veras, "stadium", "day", FLOOD),                // wait, the best is still to come
  mk(17, B.veras, B.rey, "hipo"),                                    // that same year they set up a tournament
  mk(18, B.rey, B.rival, "hipo"),                                    // for the king's coronation
  mk(19, B.rival, B.pierde, "hipo"),                                 // first opponents: Barcelona
  mk(20, B.pierde, B.gol, "hipo"),                                   // Madrid lose three-one
  mk(21, B.gol, B.suizo, "hipo"),                                    // and one goal is scored by the founder of Barça
  mk(22, B.suizo, B.asi, "hipo"),                                    // who was Swiss
  mk(23, B.asi, B.fundado, "stadium", "day", FLOOD),                 // so began the club with the most European Cups
  mk(24, B.fundado, TT, "stadium", "day", FLOOD),                    // founded by two Catalans, losing its first Clásico
];
export const XFADE: Record<number, number> = { 3: 8, 5: 8, 17: 8, 23: 10 };
/** white flashes: the cut out of the hook, and the photographer's magnesium in London */
export const FLASH_AT = B.fund;
export const FLASH2 = B.londres + 34;
export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};
const S = (id: number) => SHOTS[id - 1];

// ---------------- things that move, shared by camera and staging ----------------
/** the hook: the striker runs on to the ball, hits it at HIT and it is in the top corner NET frames later */
export const HIT = 13, NET = 11;
export const strikerX = (f: number) => 21 + 10.2 * (smooth(ramp(f, -6, HIT)) * 0.4 + ramp(f, -6, HIT) * 0.6);
export const hookBall = (f: number): V3 => { if (f < HIT) return [32.2, 0.11, 1.15]; const k = clamp01((f - HIT) / NET); if (k < 1) return [lerp(32.2, 53.4, k), 0.11 + 2.0 * k + 1.2 * Math.sin(Math.PI * k), lerp(1.15, -2.7, k)]; const d = clamp01((f - HIT - NET) / 8); return [53.4 + 0.5 * d, 2.1 - 2.0 * d * d, -2.7]; };
/** the brothers coming down the street (shot 9): x of the pair */
export const walkX = (f: number) => SX + 16 - 0.05 * (f - S(9).a);
/** the tram: x at frame f of each street shot */
export const tramX = (id: number, f: number) => (id === 3 ? SX + 60 - 0.16 * (f - S(3).a) : id === 9 ? SX + 64 - 0.12 * (f - S(9).a) : id === 4 ? SX - 150 : SX + 150);
/** two students fighting for the ball along the waste ground (shot 6): x of the ball carrier */
export const dribX = (f: number) => FX - 15 + 0.2 * (f - S(6).a);
/** route on the map: world point at fraction k from Barcelona to Madrid */
export const mapPt = (m: [number, number]): V3 => [MX - 1.4 + m[0] * 2.8, 0.8, -1.05 + m[1] * 2.1];
export const routeAt = (k: number): V3 => { const a = mapPt(MAP_BCN), b = mapPt(MAP_MAD); return [lerp(a[0], b[0], k), 0.8, lerp(a[2], b[2], k) + 0.12 * Math.sin(Math.PI * k)]; };
/** the three goals of shot 20: frames (from the start of the shot) at which each ball hits the net, and where */
export const GOALS: { t: number; y: number; z: number }[] = [{ t: 9, y: 1.8, z: -1.15 }, { t: 25, y: 0.55, z: 1.25 }, { t: 41, y: 1.45, z: 0.2 }];
/** the founder's run after he scores (shots 21 and 22): his position */
export const founderAt = (f: number): V3 => { const u = f - S(21).a, k = ramp(u, 12, 58); return [HPX - 31 + 1.2 * k, 0, -10 + 13.5 * (smooth(k) * 0.4 + k * 0.6)]; };
/** seat (row r, x) of the block of real seats: where a seated figure goes */
export const seat = (r: number, x: number): V3 => [x, SEATS.y0 + r * SEATS.dy + 0.16, SEATS.z0 + r + 0.1];

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
/** impacts: the strike, the ball on the table, the hat, the flat ball, the three goals */
export const KICKS: number[] = [HIT, HIT + NET, B.fund + 8, B.rareza + 30, B.falta + 9, B.nace + 4, ...GOALS.map((g) => B.pierde + g.t), B.suizo + 6];
const kick = (f: number) => { for (const k of KICKS) { const d = f - k; if (d >= 0 && d < 7) return (d % 2 ? -1 : 1) * 0.03 * (1 - d / 7); } return 0; };

const DBG = (getInputProps() as { cam?: { pos: V3; look: V3; fov?: number } }).cam;
export const camAt = (id: number, f: number): Cam => {
  if (DBG) return { pos: DBG.pos, look: DBG.look, fov: DBG.fov ?? 50, roll: 0 };
  let cam: Cam; const Sh = S(id), a = Sh.a, b = Sh.b, u = f - a;
  const i3 = (x: number, y: number, z: number): V3 => [IX + x, y, z], b3 = (x: number, y: number, z: number): V3 => [BX + x, y, z], s3 = (x: number, y: number, z: number): V3 => [SX + x, y, z];
  const f3 = (x: number, y: number, z: number): V3 => [FX + x, y, z], h3 = (x: number, y: number, z: number): V3 => [HPX + x, y, z];
  switch (id) {
    case 1: { // HOOK: beside the striker as he runs on to it, then round with the ball into the top corner
      const xs = strikerX(u), k = smooth(ramp(u, HIT - 2, HIT + NET - 2)), bl = hookBall(u);
      cam = { pos: [lerp(xs + 2.7, 44.5, k), lerp(0.42, 1.15, k), lerp(4.5, 5.2, k)], look: [lerp(xs + 0.5, Math.min(bl[0], 53), k), lerp(1.2, 1.7, k), lerp(1.4, bl[2], k)], fov: lerp(52, 46, k), roll: -0.05 + 0.08 * k }; break; }
    case 2: cam = path([ // the old ball drops into their hands: tight on the two brothers, then back to show the room full of cloth
      { f: a, pos: b3(0.15, 1.5, 2.1), look: b3(0.02, 1.38, -1.95), fov: 38, roll: 0.03 },
      { f: B.tras - 6, d: 1, pos: b3(0.15, 1.5, 2.1), look: b3(0.02, 1.38, -1.95), fov: 38, roll: 0.03 },
      { f: B.tras + 26, d: 30, e: "s", pos: b3(-0.7, 1.75, 3.7), look: b3(0.0, 1.2, -1.6), fov: 56, roll: -0.02 },
    ], f); break;
    case 3: cam = path([ // Madrid: down over the street towards the stone gate
      { f: a, pos: s3(-78, 19, 3.4), look: s3(60, 6, 0), fov: 52, roll: 0.03 },
      { f: b, d: b - a, e: "s", pos: s3(-44, 5.2, 4.6), look: s3(60, 6.5, -1), fov: 50, roll: -0.02 },
    ], f, 0); break;
    case 4: cam = path([ // a gentleman, a lady, and a ball that has no business there
      { f: a, pos: s3(-19.3, 1.55, 3.9), look: s3(-20.0, 1.5, 9.6), fov: 46, roll: -0.02 },
      { f: b, d: b - a, e: "s", pos: s3(-19.8, 1.5, 4.6), look: s3(-20.0, 1.55, 9.6), fov: 44, roll: 0.02 },
    ], f); break;
    case 5: cam = path([ // the waste ground under the bullring, from above
      { f: a, pos: f3(34, 17, 50), look: f3(-6, 3, -34), fov: 52, roll: 0.03 },
      { f: b, d: b - a, e: "s", pos: f3(20, 6.5, 32), look: f3(-6, 4.5, -34), fov: 52, roll: -0.02 },
    ], f, 0); break;
    case 6: { // low alongside the two who fight for the ball, the arches behind them
      const x = dribX(f);
      cam = { pos: f3(x - FX + 2.6, 0.85, 7.6), look: f3(x - FX + 0.4, 1.3, 0.4), fov: 52, roll: 0.02 * Math.sin(u * 0.2) }; break; }
    case 7: cam = path([ // out of the tavern door, one after another
      { f: a, pos: f3(30.6, 1.55, -15.2), look: f3(31.2, 1.6, -27), fov: 52, roll: 0.02 },
      { f: b, d: b - a, e: "s", pos: f3(31.5, 1.45, -16.2), look: f3(31.2, 1.55, -27), fov: 50, roll: -0.02 },
    ], f); break;
    case 8: cam = path([ // the ball gives up
      { f: a, pos: f3(1.0, 2.7, 5.6), look: f3(0, 0.8, -0.4), fov: 46, roll: -0.02 },
      { f: b, d: b - a, e: "s", pos: f3(0.5, 2.4, 5.0), look: f3(0, 0.75, -0.4), fov: 44, roll: 0.02 },
    ], f); break;
    case 9: { // the brothers come down the middle of the street: low in front of them, backing away
      const x = walkX(f) - SX, k = smooth(u / (b - a));
      cam = { pos: s3(x - 4.6 + 0.9 * k, lerp(0.8, 1.15, k), -3.4), look: s3(x, lerp(1.55, 1.45, k), -4.5), fov: lerp(50, 44, k), roll: 0.03 - 0.05 * k }; break; }
    case 10: { // the map: the route from the coast to the middle
      const m = routeAt(0.5), k = smooth(u / (b - a));
      cam = { pos: [MX + 0.12, 0.8 + lerp(5.7, 5.1, k), 0.7], look: [MX + lerp(0.1, 0.16, k), 0.8, -0.04], fov: 44, roll: 0.2 - 0.05 * k }; void m; break; }
    case 11: cam = path([ // the shop front, from across the street and in to the door
      { f: a, pos: s3(2.4, 1.9, 2.6), look: s3(0, 2.7, -12), fov: 56, roll: 0.03 },
      { f: b, d: b - a, e: "s", pos: s3(0.5, 1.6, -5.2), look: s3(0, 2.0, -12), fov: 52, roll: -0.02 },
    ], f, 0); break;
    case 12: cam = path([ // the back room: past the piles of cloth to the table
      { f: a, pos: b3(-3.0, 1.15, 2.9), look: b3(-0.6, 1.0, -1.2), fov: 50, roll: 0.03 },
      { f: b, d: b - a, e: "s", pos: b3(0.5, 1.6, 2.7), look: b3(-0.1, 1.1, -1.4), fov: 48, roll: -0.02 },
    ], f, 0); break;
    case 13: cam = path([ // the paper goes up
      { f: a, pos: b3(0.4, 1.45, 2.9), look: b3(0, 1.3, -1.95), fov: 46, roll: -0.02 },
      { f: a + 12, d: 10, pos: b3(0.3, 1.5, 3.3), look: b3(0, 1.5, -1.95), fov: 50, roll: 0.02 },
      { f: b, d: b - a - 14, e: "s", pos: b3(0.1, 1.6, 3.8), look: b3(0, 1.45, -1.9), fov: 54, roll: -0.01 },
    ], f); break;
    case 14: cam = path([ // the white cloth runs out along the counter; then the fitting stand
      { f: a, pos: i3(-0.5, 1.55, 1.7), look: i3(-1.9, 1.12, -1.7), fov: 50, roll: 0.03 },
      { f: B.blanco - 9, d: 1, pos: i3(-0.6, 1.5, 1.5), look: i3(-1.8, 1.12, -1.7), fov: 50, roll: 0.02 },
      { f: B.blanco, d: 9, pos: i3(1.5, 1.4, 4.0), look: i3(2.95, 1.3, 0.3), fov: 50, roll: -0.02 },
    ], f); break;
    case 15: cam = path([ // London: the team sits for its photograph
      { f: a, pos: [LX + 0.9, 1.5, 3.2], look: [LX, 1.15, -5.6], fov: 46, roll: 0.02 },
      { f: b, d: b - a, e: "s", pos: [LX + 0.2, 1.4, 2.2], look: [LX, 1.2, -5.6], fov: 44, roll: -0.02 },
    ], f); break;
    case 16: { const p = seat(0, 0); cam = path([ // the fan who cannot believe it
      { f: a, pos: [2.4, p[1] + 1.3, 37.5], look: [1.3, p[1] + 0.95, p[2]], fov: 46, roll: -0.02 },
      { f: a + 22, d: 12, pos: [1.8, p[1] + 1.2, 38.5], look: [1.3, p[1] + 1.05, p[2]], fov: 40, roll: 0.02 },
    ], f); break; }
    case 17: cam = path([ // the racecourse dressed for the coronation
      { f: a, pos: h3(66, 27, 64), look: h3(-6, 3, -34), fov: 52, roll: 0.03 },
      { f: b, d: b - a, e: "s", pos: h3(34, 9.5, 46), look: h3(-6, 5, -38), fov: 52, roll: -0.02 },
    ], f, 0); break;
    case 18: cam = path([ // the king in his box, the brothers and their cup below
      { f: a, pos: h3(0.5, 1.45, -29.4), look: h3(-0.05, 2.5, -38.8), fov: 54, roll: 0.02 },
      { f: b, d: b - a, e: "s", pos: h3(0.1, 1.5, -30.2), look: h3(-0.05, 2.7, -38.8), fov: 50, roll: -0.02 },
    ], f); break;
    case 19: cam = path([ // the whites... and across to the stripes
      { f: a, pos: h3(-0.6, 1.5, 7.2), look: h3(0, 1.2, -0.6), fov: 50, roll: 0.02 },
      { f: B.barca - 10, d: 1, pos: h3(-0.4, 1.45, 6.6), look: h3(0, 1.2, -0.6), fov: 50, roll: 0.02 },
      { f: B.barca, d: 10, pos: h3(2.3, 1.4, 3.4), look: h3(1.25, 1.4, -0.2), fov: 42, roll: -0.02 },
    ], f); break;
    case 20: cam = path([ // from behind the net: one, two, three
      { f: a, pos: h3(-HL - 3.7, 1.35, 0.35), look: h3(-HL + 3, 1.2, 0), fov: 54, roll: 0.02 },
      { f: b, d: b - a, e: "s", pos: h3(-HL - 3.2, 1.25, 0.1), look: h3(-HL + 3, 1.15, 0), fov: 50, roll: -0.02 },
    ], f); break;
    case 21: { // the scorer runs at us with his arms out
      const p = founderAt(f), k = smooth(u / (b - a));
      cam = { pos: [p[0] + 1.0 - 0.6 * k, lerp(0.9, 1.25, k), p[2] + lerp(5.6, 3.6, k)], look: [p[0], 1.35, p[2]], fov: lerp(52, 46, k), roll: -0.03 + 0.05 * k }; break; }
    case 22: { const p = founderAt(S(21).b); cam = path([ // ...who was Swiss
      { f: a, pos: [p[0] + 0.5, 1.4, p[2] + 3.3], look: [p[0], 1.5, p[2]], fov: 44, roll: 0.02 },
      { f: a + 12, d: 9, pos: [p[0] + 0.3, 1.45, p[2] + 3.9], look: [p[0], 1.9, p[2]], fov: 50, roll: -0.02 },
    ], f); break; }
    case 23: { // along the table of cups
      const k = smooth(u / (b - a)) * 0.5 + (u / (b - a)) * 0.5, x = lerp(-9.2, 5.6, k);
      cam = { pos: [x, lerp(1.55, 1.95, k), 3.2], look: [x + 3.4, 1.2, -0.3], fov: 50, roll: 0.02 - 0.04 * k }; break; }
    default: { const p = seat(0, 0); cam = path([ // the two founders in the stand, among the grandchildren of their club
      { f: a, pos: [-0.9, p[1] + 1.3, 37.9], look: [0.4, p[1] + 0.95, p[2]], fov: 44, roll: 0.02 },
      { f: B.clasico + 16, d: B.clasico + 16 - a, e: "s", pos: [0.5, p[1] + 1.2, 38.6], look: [0.4, p[1] + 1.0, p[2]], fov: 42, roll: -0.01 },
      { f: TT, d: 34, e: "s", pos: [0.6, p[1] + 2.0, 34.8], look: [0.3, p[1] + 2.9, p[2]], fov: 52, roll: 0.02 },
    ], f); break; }
  }
  // hand-held life: a slow sway on every shot
  const k = kick(f), sw = id === 1 || id === 6 || id === 9 || id === 21 || id === 10 ? 0.4 : 1, sx = sw * 0.014 * Math.sin(f * 0.11 + id), sy = sw * 0.009 * Math.sin(f * 0.17 + id * 2);
  const shake = id === 6 || id === 21 ? 0.012 * Math.sin(f * 1.9) : 0;
  const roll = cam.roll + 0.004 * Math.sin(f * 0.09 + id);
  return { ...cam, roll, pos: [cam.pos[0] + sx, cam.pos[1] + k + sy + shake, cam.pos[2]], look: [cam.look[0], cam.look[1] + k * 0.6 + shake * 0.5, cam.look[2]] };
};

/** lens blur per beat: cInf px at 1080 (0 = sharp), optional focus point (default: the camera's look point) */
export const dofAt = (f: number): { cInf: number; focus?: (f: number) => V3 } => {
  const id = shotAt(f).id;
  if (id === 3 || id === 5 || id === 17 || id === 10 || id === 11 || id === 20) return { cInf: 0 };
  if (id === 1 || id === 6 || id === 9 || id === 21 || id === 23 || id === 19) return { cInf: 4 };
  if (id === 2 || id === 12 || id === 13 || id === 14) return { cInf: 5 };
  return { cInf: 7 };
};

// ---------------- real scene lights (point lights, max 6) + screen-space finishing ----------------
export type Lamp = { p: V3; c: string; i: number; d: number };
export const lampsAt = (id: number, f: number): Lamp[] => {
  const Lm: Lamp[] = []; void f;
  if (id === 2 || id === 12 || id === 13) Lm.push({ p: [BX - 1.0, 1.4, -0.7], c: "#ffb45a", i: 5, d: 7 }, { p: [BX + 0.3, 2.1, -0.9], c: "#ffd08a", i: 4, d: 8 });
  if (id === 14) Lm.push({ p: [IX - 2.4, 2.3, -0.9], c: "#ffd08a", i: 4, d: 8 }, { p: [IX + 1.6, 2.3, -0.9], c: "#ffd08a", i: 4, d: 8 }, { p: [IX - 0.4, 2.4, 1.6], c: "#ffd08a", i: 4, d: 8 });
  return Lm.slice(0, 6);
};
export type Pool = { p: V3; r: number };
export type Glow = { p: V3; r: number; col: string; a: number };
export type Lighting = { wash?: { col: string; a: number }; pools: Pool[]; glows: Glow[]; vig: number; beams?: number; tint?: { col: string; a: number } };
export const lightingAt = (id: number, f: number): Lighting => {
  const s = S(id), Lg: Lighting = { pools: [], glows: [], vig: s.night ? 0.42 : 0.3 }; void f;
  if (id === 2 || id === 12 || id === 13) { Lg.wash = { col: "#4a3a6e", a: 0.42 }; Lg.pools.push({ p: [BX, 1.2, -1.4], r: 3.4 }); Lg.glows.push({ p: [BX - 1.0, 1.1, -1.0], r: 1.1, col: "#ffc070", a: 0.55 }, { p: [BX + 0.3, 2.56, -1.2], r: 0.8, col: "#ffd9a0", a: 0.4 }); Lg.vig = 0.42; }
  if (id === 14) { Lg.wash = { col: "#5a4a70", a: 0.22 }; Lg.pools.push({ p: [IX - 1.6, 1.3, -1.2], r: 4 }, { p: [IX + 3.2, 1.3, 0.3], r: 3 }); for (const [x, y, z] of [[-2.4, 2.46, -0.9], [1.6, 2.46, -0.9], [-0.4, 2.56, 1.6]]) Lg.glows.push({ p: [IX + x, y, z], r: 0.7, col: "#ffd9a0", a: 0.4 }); }
  if (id === 10) Lg.vig = 0.4;
  if (id === 3 || id === 5 || id === 17) Lg.beams = 0.2;
  if (id === 9 || id === 11) Lg.beams = 0.25;
  if (id === 15) Lg.tint = { col: "#8fa0c0", a: 0.16 };
  if (s.night) Lg.beams = 0.3;
  return Lg;
};
export { PL, HL };
