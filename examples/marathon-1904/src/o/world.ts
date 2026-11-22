// The world of "La trastienda": today's stadium, Madrid in 1902 (calle de Alcalá, the cloth shop and its back room, the
// waste ground by the bullring), a London pitch, the racecourse of the coronation tournament, and the cast as 2D cards
// standing in them. One instance per canvas; update(shot, frame) poses everything for that frame.
import * as THREE from "three";
import { Pool, Actor, Fx } from "./pool";
import { NOINK } from "./ink";
import { CHAR, untone } from "./shade";
import { skyTex, SkyK, leather } from "./pbr";
import { oldBallMat, newBallMat } from "./real";
import { LIGHTS, LOOK, LightK } from "./lights";
import { ctex, cloudHD } from "./paint";
import { Pen, figure, Char, Pose, fxContact, fxPuff, fxStars } from "./toon";
import { fxQ, fxFlash, fxConfetti, fxZ } from "./props";
import { fxDog, fxSteam, fxApple, fxFour, fxWreath, fxDust, fxDrop, fxBark } from "./gearr";
import { SHOTS, B, V3, camAt, smooth, clamp01, lerp, ramp, lampsAt, carsAt, CarS, carPose, carLocal, PACK, packX, wellRunners, carteroX, dogRun, lorzTrack, hicksTrack, carteroTrack, LANE_Z, NAP, TREE, lorzRoad } from "./story";
import { newRefs, LAMP_MATS } from "./setsq";
import { buildWorld, newORefs, ORefs } from "./setso";
import { onRoad, roadDir, FINISH_X, P, GATE_X } from "./geo";
import { runner, LORZ, CARTERO, HICKS, TAU, trainer, official, ORGANIZER, driver, LADY, PHOTOG } from "./casto";
const CKEY = new WeakMap<Char, string>();
const CC = new Map<string, Char>();
/** cast builders return fresh objects: memoise so cards share textures */
const memo = (k: string, make: () => Char) => { let c = CC.get(k); if (!c) { c = make(); CC.set(k, c); } return c; };


// ---------------- staging types ----------------
type Place = { seed?: number; crowd?: boolean; key: string; draw: (p: Pen) => void; x: number; y: number; z: number; scale: number; mirror?: boolean; roll?: number; faceUp?: boolean; sx?: number; sy?: number };
type FxPlace = { key: string; cw: number; ch: number; draw: (p: Pen) => void; x: number; y: number; z: number; w: number; h: number; flat?: boolean; fixed?: boolean; rot?: number; soft?: boolean; glow?: number; tint?: string };
type Stage = { places: Place[]; fx: FxPlace[]; balls: { k: number; p: V3; s: number; rot: number }[] };

const tier = (d: number): [number, number, number] =>
  d < 3.2 ? [1800, 3000, 3.0] : d < 6.5 ? [1080, 1800, 1.8] : d < 16 ? [480, 800, 0.8] : [240, 400, 0.4];
const q = (v: number, n = 120) => Math.round(v * n) / n;
const fkey = (o: object) => JSON.stringify(o, (_k, v) => (typeof v === "number" ? q(v) : v));
/** blinks: 4-frame lid curve every 0.5-2.3 s, deterministic per seed */
const LID = [0.5, 1, 1, 0.5];
const hs = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
const lidAt = (f: number, seed: number) => {
  let s = Math.round(-60 * hs(seed, 9));
  for (let n = 0; s <= f && n < 400; n++) { const k = f - s; if (k >= 0 && k < 4) return LID[k]; s += Math.round(15 + 54 * hs(seed * 31 + n, 13)); }
  return 0;
};
const REAL_SHADOWS = true; // the cards cast their own shadows now: no painted contact blobs


export class World {
  root = new THREE.Group();
  private pool = new Pool();
  private actors: Actor[] = [];
  private fxs: Fx[] = [];
  private sun: THREE.DirectionalLight; private hemi: THREE.HemisphereLight;
  private sky: THREE.Mesh; private skyMat: THREE.MeshBasicMaterial; private envs: Partial<Record<SkyK, THREE.Texture>> = {}; private pmrem: THREE.PMREMGenerator | null = null;
  private fog = new THREE.Fog("#bccbec", 25, 420);
  private clouds: THREE.Mesh[] = [];
  private cloudMaps: Record<"day" | "golden", THREE.Texture[]>;
  private sunDisc: THREE.Sprite;
  private cam: THREE.Vector3 = new THREE.Vector3(); private right = new THREE.Vector3(); private camU = new THREE.Vector3(); private camF = new THREE.Vector3(); private sunDir = new THREE.Vector3();
  private light = "day" as LightK;
  private lamps: THREE.PointLight[] = [];
  private refs: ORefs = newORefs(newRefs());
  private starPts!: THREE.Points;
  private balls: THREE.Mesh[][] = [[], []];
  private lightAngle = -2;

  constructor() {
    const R = this.root;
    this.skyMat = new THREE.MeshBasicMaterial({ map: skyTex("day"), side: THREE.BackSide, depthWrite: false, fog: false });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(1300, 64, 32), this.skyMat);
    this.sky.renderOrder = -1; this.sky.frustumCulled = false; this.sky.layers.set(NOINK); R.add(this.sky);
    const disc = ctex("sunDisc", 128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, "#fff"); gr.addColorStop(0.7, "#fff"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
    this.sunDisc = new THREE.Sprite(new THREE.SpriteMaterial({ map: disc, color: new THREE.Color(5.0, 3.6, 2.0), fog: false, depthWrite: false }));
    this.sunDisc.layers.set(NOINK); this.sunDisc.frustumCulled = false; R.add(this.sunDisc);
    this.hemi = new THREE.HemisphereLight("#cfe6ff", "#6c5c8c", 0.5);
    this.sun = new THREE.DirectionalLight("#fff0d6", 2.6);
    this.sun.castShadow = true; this.sun.shadow.mapSize.set(4096, 4096); this.sun.shadow.radius = 3;
    R.add(this.hemi, this.sun, this.sun.target);
    this.cloudMaps = { day: [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.day.cloud)), golden: [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.golden.cloud)) };
    for (let i = 0; i < 10; i++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: this.cloudMaps.day[i % 4], color: new THREE.Color(1.1, 1.1, 1.1), transparent: true, depthWrite: false, fog: false }));
      m.layers.set(NOINK); this.clouds.push(m); R.add(m);
    }
    buildWorld(R, this.refs);
    for (let i = 0; i < 6; i++) { const l = new THREE.PointLight("#ffffff", 0, 8, 2); this.lamps.push(l); R.add(l); }
    { const n = 500, pos = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const a = hs(i, 1) * Math.PI * 2, e = 0.08 + hs(i, 2) * 1.3, r = 1000; pos[i * 3] = r * Math.cos(a) * Math.cos(e); pos[i * 3 + 1] = r * Math.sin(e); pos[i * 3 + 2] = r * Math.sin(a) * Math.cos(e); }
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      this.starPts = new THREE.Points(g, new THREE.PointsMaterial({ color: new THREE.Color(2.2, 2.2, 2.0), size: 2.6, sizeAttenuation: false, fog: false, depthWrite: false })); this.starPts.layers.set(NOINK); this.starPts.frustumCulled = false; R.add(this.starPts); }
    { const sg = new THREE.SphereGeometry(1, 24, 16), mo = oldBallMat(leather()), mn = newBallMat(); for (let i = 0; i < 6; i++) for (let k = 0; k < 2; k++) { if (k === 1 && i > 0) continue; const m = new THREE.Mesh(sg, k ? mn : mo); m.castShadow = true; m.receiveShadow = true; m.visible = false; R.add(m); this.balls[k].push(m); } }
    for (let i = 0; i < 400; i++) this.actors.push(new Actor(R));
    for (let i = 0; i < 520; i++) this.fxs.push(new Fx(R));
  }

  // ---------------- staging ----------------
  private fig(st: Stage, ch: Char, seed: number, pos: V3, pose: Pose = {}, o: { scale?: number; roll?: number; sx?: number; sy?: number; shadow?: boolean; f?: number; faceUp?: boolean; crowd?: boolean } = {}) {
    let ck = CKEY.get(ch); if (!ck) { ck = JSON.stringify(ch); CKEY.set(ch, ck); }
    const light = this.lightAngle, full: Pose = { blink: o.f !== undefined ? lidAt(o.f, seed) : 0, ...pose, light, seed };
    st.places.push({ seed, crowd: o.crowd, key: `G|${ck}|${fkey(full)}`, x: pos[0], y: pos[1], z: pos[2], scale: o.scale ?? 1, roll: o.roll, sx: o.sx, sy: o.sy, faceUp: o.faceUp, draw: (p) => figure(p, ch, full) });
    if (o.shadow !== false) this.contact(st, pos[0], pos[2], (o.scale ?? 1) * (pose.legs === "kneel" ? 1.5 : 1), pos[1]);
  }
  private card(st: Stage, key: string, cw: number, chh: number, draw: (p: Pen) => void, pos: V3, w: number, h: number, o: Partial<FxPlace> = {}) {
    st.fx.push({ key, cw, ch: chh, draw, x: pos[0], y: pos[1], z: pos[2], w, h, ...o });
  }

  private stage(id: number, f: number): Stage {
    const st: Stage = { places: [], fx: [], balls: [] };
    const S = SHOTS[id - 1], a = S.a, b = S.b, u = f - a;
    const hop = (i: number, amp = 0.1, sp = 3) => amp * Math.abs(Math.sin(f / sp + i * 1.7));
    const G = (ch: Char, seed: number, pos: V3, pose: Pose = {}, o: Parameters<World["fig"]>[5] = {}) => this.fig(st, ch, seed, pos, pose, { f, ...o });
    const K = (key: string, cw: number, chh: number, draw: (p: Pen) => void, pos: V3, w: number, h2: number, o: Partial<FxPlace> = {}) => this.card(st, key, cw, chh, draw, pos, w, h2, o);
    const spark = (p: V3, s: number) => this.spark(st, p[0], p[1], p[2], s, f);
    const pop = (f0: number, n = 8) => { const tt = clamp01((f - f0) / n); return f < f0 ? 0 : 1 + 0.35 * Math.sin(tt * Math.PI) * (1 - tt); };
    const dust = (x: number, y: number, z: number, k: number, size = 0.7) => { const tt = (((k % 16) + 16) % 16) / 16; K(`puff|${Math.round(tt * 16)}`, 300, 260, (p) => fxPuff(p, tt), [x, y + 0.22 + tt * 0.2, z], size, size * 0.87, { soft: true }); };
    const steam = (p: V3, n: number, rise: number, drift: V3, s0: number, s1: number, dark = false, seed = 0) => { for (let i = 0; i < n; i++) { const tt = (f * 0.03 + i / n + seed) % 1, s = lerp(s0, s1, tt);
        K(dark ? "smoke" : "steam", 128, 128, (pp) => fxSteam(pp, dark), [p[0] + drift[0] * tt + 0.3 * Math.sin(i * 2.1 + tt * 5), p[1] + rise * tt, p[2] + drift[2] * tt + 0.3 * Math.cos(i * 1.3 + tt * 4)], s, s, { soft: true, glow: dark ? 0.9 : 1.2 }); } };
    /** the modern ball and the leather one of 1902 */
    const ball = (p: V3, s = 0.24) => { st.balls.push({ k: 1, p, s, rot: f * 0.5 }); };
    const oldBall = (p: V3, s = 0.26, rot = f * 0.5) => { st.balls.push({ k: 0, p, s, rot }); };
    const burst = (f0: number, p: V3, s = 0.9) => { if (f >= f0 && f < f0 + 8) { const k = pop(f0, 7); spark(p, 0.5 * s * k); } };
    /** how a figure at p turns to look at t, as this camera sees it */
    const turn = (p: number[], t: number[]): Pose => { const dx = t[0] - p[0], dz = t[1] - p[1], lat = dx * this.right.x + dz * this.right.z, dep = dx * this.camF.x + dz * this.camF.z;
      return Math.abs(lat) > Math.abs(dep) * 0.8 ? { facing: (lat > 0 ? 1 : -1) as 1 | -1 } : dep > 0 ? { back: true } : { facing: 0 }; };
    /** a figure of the crowd: no blink (its card is drawn once and kept), no contact blob */
    const crowdFig = (ch: Char, seed: number, pos: V3, pose: Pose, roll = 0) => this.fig(st, ch, seed, pos, pose, { shadow: false, roll, crowd: true });
    const zzz = (p: V3, seed = 0) => { for (let i = 0; i < 3; i++) { const tt = ((f * 0.022 + i / 3 + seed * 0.37) % 1); K("z", 120, 120, fxZ, [p[0] + 0.25 + 0.3 * tt + 0.06 * Math.sin(tt * 9), p[1] + 0.2 + 0.9 * tt, p[2]], 0.12 + 0.16 * tt, 0.12 + 0.16 * tt, { rot: 0.2 * Math.sin(tt * 7) }); } };
    const idle = (j: number, lady: boolean): Pose => { const m = j % 6; return m === 0 ? { armR: "wave", expr: "smile" } : m === 1 ? { armL: "hip", armR: lady ? "hang" : "hip" } : m === 2 ? { armL: "chin", expr: "nervous" } : m === 3 ? (lady ? { armL: "up", holdL: "brolly", expr: "smile" } : { armR: "hang", holdR: "cane", expr: "smile" }) : m === 4 ? { armL: "hip", expr: "grin" } : { expr: "smile" }; };

    // ---- the marathon ----
    const RUN = (i: number) => memo("ru" + i, () => runner(i)), TRN = (i: number) => memo("tr" + i, () => trainer(i)), OFC = (i: number) => memo("of" + i, () => official(i)), DRV = (i: number) => memo("dr" + i, () => driver(i));
    /** a runner on the road heading east (dir 1) or west (-1): turns the way he runs, bobs, kicks up dust */
    const roadRunner = (ch: Char, seed: number, x: number, off: number, dir: number, extra: Pose = {}) => { const p = onRoad(x, off), [dx, dz] = roadDir(Math.max(GATE_X, x));
      G(ch, seed, [p[0], hop(seed, 0.06, 2), p[2]], { legs: "run", phase: f * 0.29 + seed * 0.37, ...turn([p[0], p[2]], [p[0] + dir * dx * 5, p[2] + dir * dz * 5]), expr: "pained", sweat: 1, armL: "front", armR: "front", ...extra }, { roll: 0.03 * Math.sin(f * 0.29 + seed) });
      if ((f + seed * 5) % 14 < 6) dust(p[0] - dir * dx * 0.4, 0, p[2], f + seed * 3, 0.45); };
    /** someone sitting in a car (lx forward, lz across, in the car's frame) */
    const inCar = (c: CarS, ch: Char, seed: number, lx: number, lz: number, pose: Pose, dy = 0) => { const p = carLocal(c, lx, 0.92 + dy, lz); G(ch, seed, p, { legs: "sit", ...turn([p[0], p[2]], [p[0] + carPose(c).hx * 5, p[2] + carPose(c).hz * 5]), ...pose }, { shadow: false, roll: 0.02 * Math.sin(f * 0.6 + seed) }); };
    /** the dust a moving car leaves behind it: puffs dropped where the car was a moment ago */
    const carDust = (k: number, n = 16) => { for (let j = 0; j < Math.min(n, 12); j++) { const age = j * 3 + (f % 3), c = carsAt(id, f - age)[k]; if (!c.on || c.v < 0.04) continue; const p = carLocal(c, -1.9 - 0.1 * age, 0.3 + 0.03 * age, (hs(j, Math.floor((f - age) / 3)) - 0.5) * 1.4), s = 0.55 + 0.075 * age;
        K("dust", 128, 128, fxDust, p, s, s, { soft: true, glow: 1.05 }); } };
    const crowdCheer = (k: number) => k;
    const apple = (p: V3, bite = false) => K(`apple|${bite}`, 100, 100, (pp) => fxApple(pp, bite), p, 0.16, 0.16);
    const tapeX = FINISH_X;
    switch (id) {
      case 1: { // HOOK: the red car overtaking the runners, a man in the back seat waving at them
        const c = carsAt(1, f)[2]; inCar(c, DRV(0), 30, 0.15, 0.33, { expr: "grin", armL: "front", armR: "front" }); inCar(c, LORZ, 5, -1.05, 0, { expr: "laugh", armR: Math.sin(f * 0.45) > 0 ? "wave" : "up", armL: "hip" }, 0.05);
        ([[292, 1.5, 0], [282, 2.2, 1], [276, 1.1, 2]] as number[][]).forEach(([x0, off, i]) => roadRunner(RUN(i), 40 + i, x0 - 0.12 * f, off, -1, { expr: f > (x0 - 300) / -0.18 + 4 ? "shock" : "pained", sweat: 2 }));
        carDust(2, 18); break; }
      case 2: { // the pack leaves the gate behind the officials' cars and their dust
        PACK.forEach(([al, off], i) => roadRunner(RUN(i + 3), 50 + i, packX(f) + al, off, 1, { expr: i % 3 ? "stern" : "pained" }));
        const cs = carsAt(2, f); for (const k of [0, 1]) { inCar(cs[k], DRV(k + 1), 31 + k, 0.15, 0.33, { expr: "smile", armL: "front", armR: "front" }); inCar(cs[k], OFC(k), 33 + k, 0.15, -0.33, { expr: "smile", armR: "wave" }); carDust(k, 18); }
        G(OFC(2), 36, [GATE_X - 3, 0, -32.2], { ...turn([GATE_X - 3, -32.2], [GATE_X + 10, -26]), expr: "smile", armR: "wave", armL: "hip" });
        break; }
      case 3: { // the well: one thirsty runner stops, the organiser and his stopwatch send him on
        const [ox, , oz] = onRoad(P.well + 0.6, 5.2), rs = wellRunners(f), st = rs[1].stop;
        G(ORGANIZER, 20, [ox, 0, oz], { ...turn([ox, oz], st ? onRoad(P.well - 1.2, 2.2).filter((_, i) => i !== 1) : [ox - 5, oz - 2]), expr: st ? "stern" : "smile", armR: "front", holdR: "watch", armL: st ? (Math.sin(f * 0.5) > 0 ? "point" : "hip") : "hip", headTilt: st ? 6 * Math.sin(f * 0.4) : 8 });
        rs.forEach((r) => r.stop ? G(RUN(10), 60 + r.k, onRoad(r.x, r.off), { ...turn([onRoad(r.x, r.off)[0], onRoad(r.x, r.off)[2]], [ox, oz]), expr: "lick", sweat: 2, armL: "reach", armR: "chin", headTilt: 8 }) : roadRunner(RUN(10 + r.k), 60 + r.k, r.x, r.off, 1, { sweat: 2, expr: r.k === 1 ? "pained" : "nervous" }));
        if (st) { const q = onRoad(rs[1].x, rs[1].off); K("drop", 80, 120, fxDrop, [q[0], 2.05 + 0.04 * Math.sin(f * 0.3), q[2]], 0.12, 0.18); }
        break; }
      case 4: { // the postman in his cut-off trousers; a runner chased off into the corn by dogs
        roadRunner(CARTERO, 7, carteroX(f), -1.5, 1, { expr: "grin", sweat: 1 }); roadRunner(RUN(14), 70, carteroX(f) - 5.5, 1.2, 1); roadRunner(RUN(15), 71, carteroX(f) - 9, -0.4, 1);
        const d = dogRun(f), p = d.p, north = d.t > 12; G(TAU, 8, [p[0], hop(8, 0.07, 2), p[2]], { legs: "run", phase: f * 0.36, ...turn([p[0], p[2]], north ? [p[0], p[2] - 5] : [p[0] + 5, p[2]]), expr: d.t > 0 ? "shock" : "pained", sweat: 2, armL: d.t > 0 ? "up" : "front", armR: d.t > 0 ? "up" : "front" });
        if (d.t > -40) for (let k = 0; k < 3; k++) { const back = 2.2 + k * 1.5, dp: V3 = north ? [p[0] + (k - 1) * 0.9, 0.42, p[2] + back] : [p[0] - back, 0.42, p[2] + (k - 1) * 0.7], dk = Math.floor(f / 3 + k) % 2;
          K(`dog|${dk}`, 200, 140, (pp) => fxDog(pp, dk), [dp[0], dp[1] + 0.05 * dk, dp[2]], 0.8, 0.56); if ((f + k * 7) % 18 < 5) K("bark", 120, 120, fxBark, [dp[0] + 0.3, 1.0, dp[2]], 0.3, 0.3, { rot: 0.3 }); dust(dp[0], 0, dp[2], f + k * 4, 0.4); }
        break; }
      case 5: case 6: { // on the fence; the car stops; he jumps in; off past the others, waving
        const c = carsAt(id, f)[2], fence = onRoad(P.quit, -5.1), seat = carLocal(c, -1.05, 0.97, 0), j0 = B.sube, j = ramp(f, j0, j0 + 14);
        inCar(c, DRV(0), 30, 0.15, 0.33, { expr: f > j0 ? "shock" : "smile", armL: "front", armR: "front" });
        if (f < j0) G(LORZ, 5, [fence[0], 0.75, fence[2]], { legs: "sit", facing: 0, expr: f < B.momento + 30 ? "dazed" : "grin", sweat: 2, armL: f > B.veras + 40 ? "wave" : "chin", armR: "hang", headTilt: 10 }, { shadow: false });
        else if (j < 1) G(LORZ, 5, [lerp(fence[0], seat[0], j), lerp(0.75, seat[1], j) + 1.3 * Math.sin(Math.PI * j), lerp(fence[2], seat[2], j)], { legs: "run", phase: j * 3, facing: 0, expr: "laugh", armL: "up", armR: "up" }, { shadow: false, roll: -0.4 * Math.sin(Math.PI * j) });
        else inCar(c, LORZ, 5, -1.05, 0, { expr: "laugh", armR: Math.sin(f * 0.45) > 0 ? "wave" : "up", armL: "hip" }, 0.05);
        if (id === 5 && f > B.momento + 22) { const kq = pop(B.momento + 22, 10); K("q", 200, 250, fxQ, [fence[0] + 0.1, 2.35, fence[2]], 0.3 * kq, 0.38 * kq, { rot: 0.12 * Math.sin(f * 0.2) }); }
        if (id === 6) ([[345, 2.0, 0], [338, 2.6, 1], [331, 1.7, 2]] as number[][]).forEach(([x0, off, i]) => roadRunner(i === 1 ? CARTERO : RUN(16 + i), 80 + i, x0 - 0.12 * (f - B.veras), off, -1, { expr: c.x < x0 - 0.12 * (f - B.veras) ? "shock" : "pained", sweat: 2 }));
        carDust(2, 16); break; }
      case 7: { // the radiator boils over; he hops out and runs; then the stadium: first through the tape; the wreath and the photograph
        const c = carsAt(7, f)[2];
        if (c.on) { inCar(c, DRV(0), 30, 0.15, 0.33, { expr: f > B.baja ? "shock" : "nervous", armL: f > B.baja ? "up" : "front", armR: "front" }); const hp = carLocal(c, 1.55, 1.2, 0), fw = carLocal(c, 3.2, 1.2, 0); steam(hp, 7, 1.4, [fw[0] - hp[0], 0, fw[2] - hp[2]], 0.18, 0.7, false, 0.1); carDust(2, 12); }
        if (f < B.baja) { if (c.on) inCar(c, LORZ, 5, -1.05, 0, { expr: f > B.averia + 25 ? "shock" : "laugh", armR: "wave", armL: "hip" }, 0.05); }
        else if (f < B.primero - 10) { const seat = carLocal(carsAt(7, B.baja)[2], -1.05, 0.97, 0), land = lorzRoad(B.corre), j = ramp(f, B.baja, B.baja + 12), s = f < B.corre ? null : lorzRoad(f);
          if (!s) G(LORZ, 5, [lerp(seat[0], land[0], j), lerp(seat[1], 0, j) + 1.0 * Math.sin(Math.PI * j), lerp(seat[2], land[2], j)], { legs: "run", phase: j * 3, facing: 0, expr: "grin", armL: "up", armR: "up" }, { shadow: j > 0.9 });
          else G(LORZ, 5, [s[0], hop(5, 0.08, 2), s[2]], { legs: "run", phase: f * 0.33, ...turn([s[0], s[2]], [s[0] - 5, s[2]]), expr: "grin", armL: "front", armR: "front", sweat: 1 }); }
        if (f >= B.primero - 26) { const x = Math.max(FINISH_X - 3.6, lorzTrack(f)), done = lorzTrack(f) <= FINISH_X + 0.2;
          G(LORZ, 6, [x, done ? 0 : hop(6, 0.08, 2), LANE_Z], done ? { facing: 0, expr: "laugh", armL: "up", armR: "up" } : { legs: "run", phase: f * 0.33, ...turn([x, LANE_Z], [x - 5, LANE_Z]), expr: "grin", armL: "front", armR: "front", sweat: 1 });
          G(OFC(0), 37, [FINISH_X, 1.08, -32.1], { facing: 0, expr: done ? "grin" : "stern", armR: done ? "up" : "front", holdR: "watch", armL: "hip" }, { shadow: false });
          G(OFC(1), 38, [FINISH_X - 2.6, 0, -30.9], { ...turn([FINISH_X - 2.6, -30.9], [x, LANE_Z]), expr: done ? "laugh" : "smile", armL: done ? "up" : "hip", armR: done ? "up" : "hip" });
          G(PHOTOG, 39, [FINISH_X + 4.6, 0, -18.1], { ...turn([FINISH_X + 4.6, -18.1], [FINISH_X - 3.6, LANE_Z]), expr: "grin", armR: "up", holdR: "camera", armL: "front" });
          const lk = smooth(ramp(f, B.medalla - 34, B.medalla - 6)), lp: V3 = [lerp(FINISH_X - 7.5, FINISH_X - 4.9, lk), 0, lerp(-19.8, -24.6, lk)];
          G(LADY, 40, lp, { legs: lk > 0 && lk < 1 ? "walk" : "stand", phase: f * 0.1, ...turn([lp[0], lp[2]], [FINISH_X - 3.6, LANE_Z]), expr: "smile", armR: f > B.medalla - 8 ? "up" : "front", armL: "hip" });
          if (f > B.medalla - 8) { const kw = pop(B.medalla - 8, 10); K("wreath", 240, 240, fxWreath, [FINISH_X - 3.6, 2.35 - 0.3 * ramp(f, B.medalla, B.medalla + 14), LANE_Z + 0.05], 1.1 * kw, 1.1 * kw); }
          if (f >= B.primero - 26) crowdCheer(1); }
        break; }
      case 8: { // the real winner, held up by two trainers; the man from the car is being told off
        const x = Math.max(FINISH_X - 2.6, hicksTrack(f)), done = hicksTrack(f) <= FINISH_X + 0.2, sway = Math.sin(f * 0.21);
        G(HICKS, 9, [x, 0.02, LANE_Z], { legs: done ? "stand" : "walk", phase: f * 0.12, facing: 0, expr: "dazed", sweat: 2, armL: "up", armR: "up", headTilt: 12 + 6 * sway }, { roll: 0.08 * sway });
        G(TRN(0), 41, [x + 0.15, 0, LANE_Z + 0.98], { legs: done ? "stand" : "walk", phase: f * 0.12 + 0.5, facing: 0, expr: "pained", armL: "reach", armR: "front", holdR: "drink", headTilt: -6 });
        G(TRN(1), 42, [x + 0.15, 0, LANE_Z - 0.98], { legs: done ? "stand" : "walk", phase: f * 0.12, facing: 0, expr: "nervous", armR: "reach", armL: "front", sweat: 1 });
        G(LORZ, 6, [FINISH_X - 11.5, 0, -19.4], { ...turn([FINISH_X - 11.5, -19.4], [FINISH_X - 10, -19.2]), expr: "nervous", armL: "chin", armR: "hang", headTilt: 8 });
        G(OFC(1), 38, [FINISH_X - 10.1, 0, -19.2], { ...turn([FINISH_X - 10.1, -19.2], [FINISH_X - 11.5, -19.4]), expr: "stern", armR: Math.sin(f * 0.4) > 0 ? "point" : "front", armL: "hip" });
        G(OFC(0), 37, [FINISH_X, 1.08, -32.1], { facing: 0, expr: done ? "shock" : "stern", armR: "front", holdR: "watch", armL: done ? "up" : "hip" }, { shadow: false });
        G(PHOTOG, 39, [FINISH_X + 4.6, 0, -18.1], { ...turn([FINISH_X + 4.6, -18.1], [x, LANE_Z]), expr: "nervous", armR: "front", holdR: "camera", armL: "hang" });
        break; }
      default: { // the orchard, the nap, the others going by; then the stadium: he comes in fourth
        if (f < B.cuarto - 20) { const nap = f >= B.siesta - 12, eatK = Math.floor((f - B.cartero2) / 18) % 2;
          if (!nap) { G(CARTERO, 7, NAP, { facing: 0, expr: eatK ? "laugh" : "grin", armR: eatK ? "eat" : "up", armL: "front", headTilt: eatK ? 0 : -10 }); const R = this.right, F = this.camF, ax = eatK ? 0.05 : 0.41, af = eatK ? 0.15 : 0.05; apple([NAP[0] + R.x * ax - F.x * af, eatK ? 1.62 : 1.58, NAP[2] + R.z * ax - F.z * af], eatK === 1); }
          else { const rx = this.right.x * 0.95, rz = this.right.z * 0.95; G(CARTERO, 7, [NAP[0] + rx, 0.26, NAP[2] + rz], { expr: "smile_closed", armL: "hip", armR: "front", headTilt: -8 }, { roll: 1.5, faceUp: true, shadow: false }); zzz([NAP[0] - rx * 0.9, 0.6, NAP[2] - rz * 0.9], 0); apple([NAP[0] + rx * 1.6, 0.12, NAP[2] + rz * 1.6 + 0.3], true); }
          ([[132, 1.6, 0], [138, 2.4, 1], [143, 1.2, 2]] as number[][]).forEach(([x0, off, i]) => roadRunner(RUN(18 + i), 90 + i, x0 - 0.14 * (f - B.siesta + 10), off, -1));
        }
        if (f >= B.cuarto - 40) { const x = Math.max(FINISH_X - 2.4, carteroTrack(f)), done = carteroTrack(f) <= FINISH_X + 0.2;
          G(CARTERO, 7, [x, done ? 0 : hop(7, 0.07, 2), LANE_Z], done ? { facing: 0, expr: "laugh", armL: "up", armR: "eat" } : { legs: "run", phase: f * 0.3, ...turn([x, LANE_Z], [x - 5, LANE_Z]), expr: "grin", armL: "front", armR: "eat" }); apple([x + 0.2, 1.62, LANE_Z + 0.15], true);
          G(OFC(1), 38, [FINISH_X - 2.6, 0, -30.9], { ...turn([FINISH_X - 2.6, -30.9], [x, LANE_Z]), expr: "grin", armR: "up", armL: "hip" }); if (done) { const k4 = pop(B.cuarto + 6, 9); K("four", 180, 240, fxFour, [FINISH_X - 2.2, 2.75, -30.7], 0.75 * k4, 1.0 * k4); }
          ([[FINISH_X - 6.0, -17.4, 0], [FINISH_X - 7.9, -18.3, 1], [FINISH_X - 9.8, -17.2, 2]] as number[][]).forEach(([px, pz, i]) => G(i === 0 ? HICKS : RUN(20 + i), 95 + i, [px + this.right.x * 0.95, 0.24, pz + this.right.z * 0.95], { expr: "dazed", armL: "hang", armR: "up" }, { roll: 1.5, faceUp: true, shadow: false }));
        }
        break; }
    }
    void [crowdCheer, tapeX, TRN, NAP];

    return st;
  }
  private conf(st: Stage, f: number, cx: number, cy: number, cz: number, n = 46, spread = 5) {
    const cols = ["#fbfbf6", "#f6c419", "#1f2f5c", "#6a4c9a", "#fbfbf6"];
    for (let i = 0; i < n; i++) { const t = ((f * 0.012 + hs(i, 3)) % 1), x = cx + (hs(i, 1) - 0.5) * spread + 0.3 * Math.sin(f * 0.1 + i), y = cy + 3.2 - t * 9, z = cz + (hs(i, 2) - 0.5) * spread * 0.7; if (y < 0.05) continue;
      this.card(st, `conf|${cols[i % 5]}`, 64, 64, (p) => fxConfetti(p, cols[i % 5]), [x, y, z], 0.16 + spread * 0.012, 0.16 + spread * 0.012, { rot: f * 0.2 + i }); }
  }
  private contact(st: Stage, x: number, z: number, s = 1, y = 0) {
    if (REAL_SHADOWS) return;
    const cc = this.light === "day" ? "#55556e" : this.light === "night" ? "#3a3a66" : "#5e5070";
    st.fx.push({ key: `blob|contact|${cc}`, cw: 128, ch: 128, draw: (p) => fxContact(p, cc), x, y: y + 0.02, z, w: 0.6 * s, h: 0.45 * s, flat: true });
  }
  private spark(st: Stage, x: number, y: number, z: number, s: number, f: number) {
    st.fx.push({ key: "flash", cw: 128, ch: 128, draw: fxFlash, x, y, z, w: s, h: s, soft: true, glow: 2.5, rot: f * 0.12 });
    st.fx.push({ key: "flash", cw: 128, ch: 128, draw: fxFlash, x: x + s * 0.55, y: y + s * 0.4, z, w: s * 0.4, h: s * 0.4, soft: true, glow: 2.5, rot: -f * 0.2 });
  }
  private stars(st: Stage, x: number, y: number, z: number, f: number) {
    const t = ((f * 0.04) % 1 + 1) % 1;
    st.fx.push({ key: `stars|${Math.round(t * 24)}`, cw: 420, ch: 220, draw: (p) => fxStars(p, t), x, y, z, w: 0.75, h: 0.4 });
  }

  update(id: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene, gl?: THREE.WebGLRenderer) {
    const s = SHOTS[id - 1], L = LIGHTS[s.light], K = LOOK[s.night ? "night" : s.light];
    this.light = s.light;
    const c = camAt(id, f);
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll);
    cam.fov = c.fov; cam.near = 0.1; cam.far = 1700; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    cam.layers.enable(NOINK);
    const focus = new THREE.Vector3(...c.look), dist = cam.position.distanceTo(focus);
    // camera-relative sun, frozen per shot (from the shot's first camera)
    const c0 = camAt(id, s.a), fx = c0.look[0] - c0.pos[0], fz = c0.look[2] - c0.pos[2], fl = Math.hypot(fx, fz) || 1;
    const yaw = s.sun ? THREE.MathUtils.degToRad(s.sun[0]) : Math.atan2(fx / fl, fz / fl) - THREE.MathUtils.degToRad(L.az);
    const el = THREE.MathUtils.degToRad(s.sun ? s.sun[1] : L.el);
    this.sunDir.set(Math.sin(yaw) * Math.cos(el), Math.sin(el), Math.cos(yaw) * Math.cos(el)).normalize();
    this.cam.copy(cam.position); this.right.set(1, 0, 0).applyQuaternion(cam.quaternion); this.camU.set(0, 1, 0).applyQuaternion(cam.quaternion); this.camF.set(0, 0, -1).applyQuaternion(cam.quaternion);
    this.lightAngle = Math.round(Math.atan2(-this.sunDir.y, this.sunDir.dot(this.right)) / (Math.PI / 4)) * (Math.PI / 4);
    // physically based light: the sun, and the sky as an image-based light
    const P = s.indoor ? { c: "#ffe6c4", i: 1.5, sky: "room" as SkyK, env: "room" as SkyK, ei: 1.0 } : s.night ? { c: "#f4f6ff", i: 2.6, sky: "night" as SkyK, env: "grey" as SkyK, ei: 0.45 }
      : s.fog ? { c: "#eef2fa", i: 1.5, sky: "grey" as SkyK, env: "grey" as SkyK, ei: 1.0 } : s.light === "golden" ? { c: "#ffb672", i: 4.4, sky: "golden" as SkyK, env: "golden" as SkyK, ei: 0.8 } : { c: "#fff2de", i: 3.6, sky: "day" as SkyK, env: "day" as SkyK, ei: 0.9 };
    this.hemi.intensity = 0; this.sun.color.set(P.c); this.sun.intensity = P.i;
    if (gl) { if (!this.pmrem) this.pmrem = new THREE.PMREMGenerator(gl); let e = this.envs[P.env]; if (!e) { e = this.pmrem.fromEquirectangular(skyTex(P.env)).texture; this.envs[P.env] = e; } scene.environment = e; scene.environmentIntensity = P.ei; }
    const skyRot = yaw - Math.atan2(-Math.cos(0.3 * Math.PI * 2), Math.sin(0.3 * Math.PI * 2));
    this.skyMat.map = skyTex(P.sky); this.sky.rotation.y = skyRot; scene.environmentRotation.y = skyRot; this.sky.visible = !s.indoor;
    let Rr = THREE.MathUtils.clamp(dist * 1.15 + 7, 14, 95);
    if (s.light === "golden") Rr = Math.max(Rr, 30);
    if (id === 3 || id === 5 || id === 17 || id === 1 || id === 23 || id === 11) Rr = 95;
    this.sun.position.copy(focus).addScaledVector(this.sunDir, 220); this.sun.target.position.copy(focus);
    const sc = this.sun.shadow.camera; sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = 20; sc.far = 480; sc.updateProjectionMatrix();
    this.sun.shadow.bias = L.bias; this.sun.shadow.normalBias = L.normalBias * (Rr / 12);
    CHAR.uCharTint.value.set(...L.charTint); CHAR.uCharShade.value = L.charShade; CHAR.uGrad.value = L.charGrad; CHAR.uBodyGrad.value = L.bodyGrad; CHAR.uSideTint.value.set(...L.sideTint);
    this.sky.position.copy(cam.position);
    untone(s.night ? "#141c4a" : s.fog ? "#b9c4d8" : L.fog, this.fog.color);
    this.fog.near = s.fog ? s.fog[0] : s.night ? 120 : 90; this.fog.far = s.fog ? s.fog[1] : s.night ? 700 : 900;
    const night = !!s.night, R = this.refs;
    for (const lm of LAMP_MATS) { const h = (lm.userData as { hot: [number, number, number] }).hot, k = night || s.indoor ? 1 : s.fog ? 0.9 : s.light === "golden" ? 0.6 : 0.3; lm.color.setRGB(h[0] * k, h[1] * k, h[2] * k); }
    for (const tn of R.tints) tn.m.color.setRGB(...tn[s.light]);
    { const dx = c.look[0] - c.pos[0], dz = c.look[2] - c.pos[2], dl = Math.hypot(dx, dz) || 1, k = Math.min(dl, 9) / dl; R.grass.forEach((g, gi) => { g.g.follow(c.pos[0] + dx * k, c.pos[2] + dz * k); g.g.mesh.visible = gi === 0 || (gi === 1 ? c.pos[0] > 110 && c.look[0] > 120 : c.pos[0] > 200 && c.look[0] > 210); }); }
    { const inStad = c.look[0] < 70; const cheer = !inStad ? 0.3 : id === 7 ? (lorzTrack(f) <= FINISH_X + 4 ? 1 : 0.5) : id === 8 ? 0.55 : id === 9 ? (carteroTrack(f) <= FINISH_X + 3 ? 1 : 0.5) : id === 2 ? 0.7 : 0.3; for (const p of R.people) p.c.tick(f, cheer); }
    carsAt(id, f).forEach((cs, i) => { const car = R.cars[i]; car.g.visible = cs.on; if (!cs.on) return; const { p, th } = carPose(cs); car.g.position.set(p[0], 0.0 + 0.012 * Math.sin(f * 1.7 + i) * Math.min(1, cs.v * 6), p[2]); car.g.rotation.set(0, th, 0.006 * Math.sin(f * 1.3 + i) * Math.min(1, cs.v * 6)); car.wheels.forEach((wh) => (wh.rotation.z = -(cs.x * cs.dir) / 0.45)); });
    { const brk = id === 7 ? lorzTrack(f) : id === 8 || id === 9 ? -1e9 : 1e9, v = id === 7 ? 0.3 : id === 8 ? 0.127 : 0.2, t = brk <= FINISH_X ? (FINISH_X - brk) / v : -1; R.tape.forEach((tp, i) => { const a = t < 0 ? 0 : Math.min(1.3, t * 0.12); tp.rotation.y = (i ? 1 : -1) * a; const fall = id === 8 ? smooth(clamp01((f - B.ganador) / 24)) : id === 9 ? 1 : 0; tp.rotation.z = (i ? 1 : -1) * 0.6 * Math.min(1, Math.max(0, t) * 0.05) * (1 - fall); tp.position.y = 1.22 - 1.19 * fall; }); }
    R.tripod.visible = id >= 7; R.tripod.position.set(FINISH_X + 4.0, 0, -18.4); R.tripod.rotation.y = Math.atan2(-((LANE_Z) - (-18.4)), (FINISH_X - 3.6) - (FINISH_X + 4.0));
    R.bigWheel.rotation.z = f * 0.0016; R.mill.rotation.z = -f * 0.09; R.bucket.rotation.z = 0.05 * Math.sin(f * 0.07);
    R.flags.forEach((g, i) => { const ud = g.userData as { b?: number }; if (ud.b === undefined) ud.b = g.rotation.y; g.rotation.y = ud.b + 0.3 * Math.sin(f * 0.11 + i * 1.3); });
    R.crowns.forEach((g, i) => { g.rotation.x = 0.14 * Math.sin(f * 0.08 + i * 1.1); });
    const roar = id === 1 || id === 23 || id === 20 || id === 21;
    for (const ct of R.crowds) ct.offset.y = roar ? 0.012 * Math.sin(f * 1.1) : 0.004 * Math.sin(f * 0.4);
    this.starPts.visible = night; this.starPts.position.copy(cam.position);
    const lamps = lampsAt(id, f);
    this.lamps.forEach((l, i) => { const d = lamps[i]; if (d) { l.position.set(...d.p); l.color.set(d.c); l.intensity = d.i * 1.6; l.distance = d.d * 1.5; l.decay = 2; } else l.intensity = 0; });
    scene.fog = this.fog; scene.background = null;
    this.sunDisc.visible = false;
    this.sunDisc.position.copy(cam.position).addScaledVector(this.sunDir, 900); this.sunDisc.scale.setScalar(2 * 900 * Math.tan(THREE.MathUtils.degToRad(1.7)));
    this.clouds.forEach((m, i) => {
      const a = (i / 10) * Math.PI * 2 + 0.3, d = 760 + (i % 3) * 60, w = 150 + (i % 4) * 36;
      m.position.set(cam.position.x + Math.cos(a + f * 0.00012) * d, 150 + (i % 4) * 46, cam.position.z + Math.sin(a + f * 0.00012) * d); m.scale.set(w, w / 2, 1);
      m.lookAt(cam.position.x, m.position.y, cam.position.z); (m.material as THREE.MeshBasicMaterial).map = this.cloudMaps[s.light === "golden" ? "golden" : "day"][i % 4]; m.visible = false;
      (m.material as THREE.MeshBasicMaterial).color.setScalar(s.fog ? 0.9 : 1.1);
    });
    // ---- cast ----
    const st = this.stage(id, f);
    { const used = [0, 0]; for (const m of [...this.balls[0], ...this.balls[1]]) m.visible = false; for (const bl of st.balls) { const m = this.balls[bl.k][used[bl.k]++]; if (!m) continue; m.visible = true; m.position.set(...bl.p); m.scale.setScalar(bl.s * 0.5); m.rotation.set(bl.rot, bl.rot * 0.6, 0.4); } }
    const reqs: { a: Actor; p: Place }[] = [];
    this.actors.forEach((a) => (a.mesh.visible = false));
    this.fxs.forEach((x) => (x.mesh.visible = false));
    st.places.slice(0, this.actors.length).forEach((p, i) => {
      const a = this.actors[i], d = cam.position.distanceTo(new THREE.Vector3(p.x, p.y + 1.2 * p.scale, p.z)) / p.scale / (cam.fov < 20 ? 40 / cam.fov / 4 : 1);
      const [w, h, k] = tier(d);
      a.r = this.pool.req(p.key, w, h, k, p.draw);
      reqs.push({ a, p });
    });
    const fr: { e: Fx; p: FxPlace }[] = [];
    st.fx.slice(0, this.fxs.length).forEach((p, i) => { const e = this.fxs[i]; e.r = this.pool.req(p.key, p.cw, p.ch, 1, p.draw); fr.push({ e, p }); });
    this.pool.flush();
    for (const { a, p } of reqs) {
      a.bind();
      const m = a.mesh; m.visible = true; m.position.set(p.x, p.y, p.z);
      const yawA = Math.atan2(cam.position.x - p.x, cam.position.z - p.z);
      if (p.faceUp) { m.rotation.set(0, 0, 0); m.lookAt(cam.position); m.rotateZ(p.roll ?? 0); }
      else { m.rotation.set(0, 0, 0); m.rotateY(yawA); m.rotateZ(p.roll ?? 0); }
      m.scale.set((p.mirror ? -1 : 1) * p.scale * (p.sx ?? 1), p.scale * (p.sy ?? 1), p.scale);
      m.castShadow = true;
    }
    for (const { e, p } of fr) {
      e.use(!!p.soft); e.bind(); if (p.tint) { e.soft.color.set(p.tint).multiplyScalar(p.glow ?? 1); e.mat.color.set(p.tint).multiplyScalar(p.glow ?? 1); } else { e.soft.color.setScalar(p.glow ?? 1); e.mat.color.setScalar(p.glow ?? 1); }
      const m = e.mesh; m.visible = true; m.position.set(p.x, p.y, p.z); m.scale.set(p.w, p.h, 1);
      if (p.flat) m.rotation.set(-Math.PI / 2, 0, p.rot ?? 0);
      else if (p.fixed) m.rotation.set(0, 0, p.rot ?? 0);
      else { m.rotation.set(0, 0, 0); m.lookAt(cam.position); if (p.rot) m.rotateZ(p.rot); }
    }
    return focus;
  }
}
