// The world of "Sin límite": a cricket ground in 1939 (and today), a quay with a liner, a station with a train, and the
// cast as 2D cards standing in them. One instance per canvas; update(shot, frame) poses everything for that frame.
import * as THREE from "three";
import { Pool, Actor, Fx } from "./pool";
import { NOINK } from "./ink";
import { TONE, CHAR, untone } from "./shade";
import { LIGHTS, LOOK, LightK } from "./lights";
import { ctex, cloudHD } from "./paint";
import { Pen, figure, Char, Pose, fxContact, fxPuff, fxStars } from "./toon";
import { fxQ, fxFlash, fxZ, fxWeb, fxCup, fxMoon, fxFly, fxCoin, fxConfetti } from "./props";
import { fxCBall, fxTock, fxRain, fxDrop, fxStorm, fxDay, fxSteam, fxRipple, fxWatch, fxGull } from "./geark";
import { SHOTS, B, V3, camAt, smooth, clamp01, lerp, ramp, lampsAt, ballAt, bowlerZ, trainX, runZ, CREASE, RUNX, BENCH } from "./story";
import { buildGround, buildHarbour, buildStation, newRefs, Refs, LAMP_MATS, HX, TX, WK, GANG, SHIP, PAV_X } from "./setsk";
import { eng, engBat, saf, safBat, CAP_E, CAP_S, UMP, OLD, OLD_NOW, spect, fanNow, staff, OFFICER, MASTER } from "./castk";
const CKEY = new WeakMap<Char, string>();
const CC = new Map<string, Char>();
/** cast builders return fresh objects: memoise so cards share textures */
const memo = (k: string, make: () => Char) => { let c = CC.get(k); if (!c) { c = make(); CC.set(k, c); } return c; };
const ENG = (i: number) => memo("e" + i, () => eng(i)), ENGB = (i: number) => memo("eb" + i, () => engBat(i)), SAF = (i: number) => memo("s" + i, () => saf(i)), SAFB = (i: number) => memo("sb" + i, () => safBat(i));
const SPE = (i: number) => memo("sp" + i, () => spect(i)), NOW = (i: number) => memo("n" + i, () => fanNow(i)), STF = (i: number) => memo("st" + i, () => staff(i)), OLDM = (k: number) => memo("old" + k, () => OLD(k));

// ---------------- staging types ----------------
type Place = { key: string; draw: (p: Pen) => void; x: number; y: number; z: number; scale: number; mirror?: boolean; roll?: number; faceUp?: boolean; sx?: number; sy?: number };
type FxPlace = { key: string; cw: number; ch: number; draw: (p: Pen) => void; x: number; y: number; z: number; w: number; h: number; flat?: boolean; fixed?: boolean; rot?: number; soft?: boolean; glow?: number; tint?: string };
type Stage = { places: Place[]; fx: FxPlace[] };

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

export class World {
  root = new THREE.Group();
  private pool = new Pool();
  private actors: Actor[] = [];
  private fxs: Fx[] = [];
  private sun: THREE.DirectionalLight; private hemi: THREE.HemisphereLight;
  private sky: THREE.Mesh; private skyMat: THREE.ShaderMaterial;
  private fog = new THREE.Fog("#bccbec", 25, 420);
  private clouds: THREE.Mesh[] = [];
  private cloudMaps: Record<"day" | "golden", THREE.Texture[]>;
  private sunDisc: THREE.Sprite;
  private cam: THREE.Vector3 = new THREE.Vector3(); private right = new THREE.Vector3(); private camU = new THREE.Vector3(); private camF = new THREE.Vector3(); private sunDir = new THREE.Vector3();
  private light = "day" as LightK;
  private lamps: THREE.PointLight[] = [];
  private refs: Refs = newRefs();
  private starPts!: THREE.Points;
  private lightAngle = -2;

  constructor() {
    const R = this.root;
    this.skyMat = new THREE.ShaderMaterial({
      uniforms: { c0: { value: new THREE.Color() }, c1: { value: new THREE.Color() }, c2: { value: new THREE.Color() }, c3: { value: new THREE.Color() }, c4: { value: new THREE.Color() }, e: { value: new THREE.Vector4() } },
      vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: `uniform vec3 c0, c1, c2, c3, c4; uniform vec4 e; varying vec3 vP;
        void main(){ float el = asin(clamp(normalize(vP).y, -1.0, 1.0));
          vec3 c = mix(c0, c1, smoothstep(0.0, e.x, el)); c = mix(c, c2, smoothstep(e.x, e.y, el));
          c = mix(c, c3, smoothstep(e.y, e.z, el)); c = mix(c, c4, smoothstep(e.z, e.w, el)); gl_FragColor = vec4(c, 1.0); }`,
      side: THREE.BackSide, depthWrite: false, fog: false,
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(1300, 48, 24), this.skyMat);
    this.sky.renderOrder = -1; this.sky.frustumCulled = false; this.sky.layers.set(NOINK); R.add(this.sky);
    const disc = ctex("sunDisc", 128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, "#fff"); gr.addColorStop(0.7, "#fff"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
    this.sunDisc = new THREE.Sprite(new THREE.SpriteMaterial({ map: disc, color: new THREE.Color(5.0, 3.6, 2.0), fog: false, depthWrite: false }));
    this.sunDisc.layers.set(NOINK); this.sunDisc.frustumCulled = false; R.add(this.sunDisc);
    this.hemi = new THREE.HemisphereLight("#cfe6ff", "#6c5c8c", 0.5);
    this.sun = new THREE.DirectionalLight("#fff0d6", 2.6);
    this.sun.castShadow = true; this.sun.shadow.mapSize.set(2048, 2048);
    R.add(this.hemi, this.sun, this.sun.target);
    this.cloudMaps = { day: [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.day.cloud)), golden: [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.golden.cloud)) };
    for (let i = 0; i < 10; i++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: this.cloudMaps.day[i % 4], color: new THREE.Color(1.1, 1.1, 1.1), transparent: true, depthWrite: false, fog: false }));
      m.layers.set(NOINK); this.clouds.push(m); R.add(m);
    }
    buildGround(R, this.refs); buildHarbour(R, this.refs); buildStation(R, this.refs);
    for (let i = 0; i < 6; i++) { const l = new THREE.PointLight("#ffffff", 0, 8, 2); this.lamps.push(l); R.add(l); }
    { const n = 500, pos = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const a = hs(i, 1) * Math.PI * 2, e = 0.08 + hs(i, 2) * 1.3, r = 1000; pos[i * 3] = r * Math.cos(a) * Math.cos(e); pos[i * 3 + 1] = r * Math.sin(e); pos[i * 3 + 2] = r * Math.sin(a) * Math.cos(e); }
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      this.starPts = new THREE.Points(g, new THREE.PointsMaterial({ color: new THREE.Color(2.2, 2.2, 2.0), size: 2.6, sizeAttenuation: false, fog: false, depthWrite: false })); this.starPts.layers.set(NOINK); this.starPts.frustumCulled = false; R.add(this.starPts); }
    for (let i = 0; i < 330; i++) this.actors.push(new Actor(R));
    for (let i = 0; i < 420; i++) this.fxs.push(new Fx(R));
  }

  // ---------------- staging ----------------
  private fig(st: Stage, ch: Char, seed: number, pos: V3, pose: Pose = {}, o: { scale?: number; roll?: number; sx?: number; sy?: number; shadow?: boolean; f?: number; faceUp?: boolean } = {}) {
    let ck = CKEY.get(ch); if (!ck) { ck = JSON.stringify(ch); CKEY.set(ch, ck); }
    const light = this.lightAngle, full: Pose = { blink: o.f !== undefined ? lidAt(o.f, seed) : 0, ...pose, light, seed };
    st.places.push({ key: `G|${ck}|${fkey(full)}`, x: pos[0], y: pos[1], z: pos[2], scale: o.scale ?? 1, roll: o.roll, sx: o.sx, sy: o.sy, faceUp: o.faceUp, draw: (p) => figure(p, ch, full) });
    if (o.shadow !== false) this.contact(st, pos[0], pos[2], (o.scale ?? 1) * (pose.legs === "kneel" ? 1.5 : 1), pos[1]);
  }
  private card(st: Stage, key: string, cw: number, chh: number, draw: (p: Pen) => void, pos: V3, w: number, h: number, o: Partial<FxPlace> = {}) {
    st.fx.push({ key, cw, ch: chh, draw, x: pos[0], y: pos[1], z: pos[2], w, h, ...o });
  }

  private stage(id: number, f: number): Stage {
    const st: Stage = { places: [], fx: [] };
    const S = SHOTS[id - 1], a = S.a, b = S.b, u = f - a;
    const hop = (i: number, amp = 0.1, sp = 3) => amp * Math.abs(Math.sin(f / sp + i * 1.7));
    const G = (ch: Char, seed: number, pos: V3, pose: Pose = {}, o: Parameters<World["fig"]>[5] = {}) => this.fig(st, ch, seed, pos, pose, { f, ...o });
    const K = (key: string, cw: number, chh: number, draw: (p: Pen) => void, pos: V3, w: number, h2: number, o: Partial<FxPlace> = {}) => this.card(st, key, cw, chh, draw, pos, w, h2, o);
    const spark = (p: V3, s: number) => this.spark(st, p[0], p[1], p[2], s, f);
    const pop = (f0: number, n = 8) => { const tt = clamp01((f - f0) / n); return f < f0 ? 0 : 1 + 0.35 * Math.sin(tt * Math.PI) * (1 - tt); };
    const dust = (x: number, y: number, z: number, k: number, size = 0.7) => { const tt = (k % 16) / 16; K(`puff|${k % 16}`, 300, 260, (p) => fxPuff(p, tt), [x, y + 0.22 + tt * 0.2, z], size, size * 0.87, { soft: true }); };
    const zzz = (p: V3, seed = 0) => { for (let i = 0; i < 3; i++) { const tt = ((f * 0.022 + i / 3 + seed * 0.37) % 1); K("z", 120, 120, fxZ, [p[0] + 0.25 + 0.3 * tt + 0.06 * Math.sin(tt * 9), p[1] + 0.2 + 0.9 * tt, p[2]], 0.12 + 0.16 * tt, 0.12 + 0.16 * tt, { rot: 0.2 * Math.sin(tt * 7) }); } };
    const ball = (p: V3 | undefined, s = 0.15) => { if (p) K("cball", 120, 120, fxCBall, p, s, s, { rot: f * 0.8 }); };
    const tock = (f0: number, p: V3, s = 0.9) => { const k = pop(f0, 7); if (f >= f0 && f < f0 + 8) { K("tock", 200, 200, fxTock, p, s * k, s * k, { rot: 0.3 }); spark([p[0], p[1], p[2]], 0.2 * k); } };
    const rain = (k: number) => { const n = Math.round(46 * k); for (let i = 0; i < n; i++) { const d = 3.2 + 9 * hs(i, 1), c = this.camPos(d), tt = (f * (0.085 + 0.03 * hs(i, 4)) + hs(i, 3)) % 1, w = 1.0 + d * 0.16;
        K(`rain|${i % 4}`, 256, 512, (p) => fxRain(p, i % 4), [c[0] + (hs(i, 5) - 0.5) * (2 + d * 1.1) + this.right.x * 0, c[1] + 4.6 - tt * 6.4, c[2] + (hs(i, 6) - 0.5) * (2 + d * 1.1)], w, w * 2, { tint: "#dfeaff" }); } };
    const ripples = (c: V3, n: number, spread: number) => { for (let i = 0; i < n; i++) { const tt = (f * 0.06 + hs(i, 7)) % 1, s = 0.12 + 0.3 * tt; K("ripple", 128, 64, fxRipple, [c[0] + (hs(i + Math.floor(f * 0.06 + hs(i, 7)) * 13, 1) - 0.5) * spread, 0.2, c[2] + (hs(i + Math.floor(f * 0.06 + hs(i, 7)) * 13, 2) - 0.5) * spread], s, s * 0.5, { flat: true }); } };
    const steam = (p: V3, n: number, rise: number, drift: V3, s0: number, s1: number, dark = false, seed = 0) => { for (let i = 0; i < n; i++) { const tt = (f * 0.03 + i / n + seed) % 1, s = lerp(s0, s1, tt);
        K(dark ? "smoke" : "steam", 128, 128, (pp) => fxSteam(pp, dark), [p[0] + drift[0] * tt + 0.3 * Math.sin(i * 2.1 + tt * 5), p[1] + rise * tt, p[2] + drift[2] * tt + 0.3 * Math.cos(i * 1.3 + tt * 4)], s, s, { soft: true, glow: dark ? 0.9 : 1.2 }); } };
    const days = (n: number, f0: number, y: number, z: number, size: number, gap: number, step = 0) => { for (let i = 0; i < n; i++) { const k = pop(f0 + i * step, 9); if (k > 0) K("day", 160, 160, fxDay, [(i - (n - 1) / 2) * gap, y + 0.25 * Math.sin(f * 0.08 + i), z], size * k, size * k, { rot: 0.12 * Math.sin(f * 0.05 + i) }); } };
    const STRIDE = 0.283;
    // ---- the people who fill the ground ----
    /** the field (x, z, which player): two slips, gully, short leg, square leg, mid-on, mid-off, fine leg, third man */
    const FLD: Record<string, [number, number, number]> = { slip1: [2.1, WK + 2.7, 5], slip2: [3.3, WK + 3.3, 9], gully: [5.6, WK + 1.2, 7], shortleg: [-3.2, 7.4, 6], squareleg: [-14, 11.5, 11], midon: [-5, -13, 12], midoff: [8.5, -15, 13], fineleg: [-6.5, 40, 10], thirdman: [7, 44, 8] };
    /** how a figure at p turns to look at t, as this camera sees it */
    const turn = (p: number[], t: number[]): Pose => { const dx = t[0] - p[0], dz = t[1] - p[1], lat = dx * this.right.x + dz * this.right.z, dep = dx * this.camF.x + dz * this.camF.z;
      return Math.abs(lat) > Math.abs(dep) * 0.8 ? { facing: (lat > 0 ? 1 : -1) as 1 | -1 } : dep > 0 ? { back: true } : { facing: 0 }; };
    const fielders = (o: { skip?: string[]; move?: Record<string, [number, number]>; ready?: boolean; each?: (name: string, i: number) => Pose } = {}) => {
      Object.keys(FLD).forEach((name, i) => { if (o.skip?.includes(name)) return; const [x0, z0, who] = FLD[name], [x, z] = o.move?.[name] ?? [x0, z0];
        G(SAF(who), 40 + i, [x, 0, z], { ...turn([x, z], [-0.3, CREASE]), armL: o.ready ? "low" : i % 2 ? "hip" : "hang", armR: o.ready ? "low" : i % 3 ? "hang" : "hip", ...(o.each?.(name, i) ?? {}) }, { roll: 0.02 * Math.sin(f * 0.05 + i * 1.9) }); });
    };
    /** a figure of the crowd: no blink (its card is drawn once and kept), no contact blob */
    const crowdFig = (ch: Char, seed: number, pos: V3, pose: Pose, roll = 0) => this.fig(st, ch, seed, pos, pose, { shadow: false, roll });
    /** the people standing along the fence, between the pickets and the stand: one every `step` degrees from c0 - half to c0 + half */
    const ring = (c0: number, half: number, o: { step?: number; cheer?: boolean; wet?: number; now?: boolean } = {}) => {
      const step = o.step ?? 0.95;
      for (let i = Math.ceil((c0 - half) / step); i * step <= c0 + half; i++) { const deg = (((i * step) % 360) + 360) % 360, j = ((i % 400) + 400) % 400;
        if ((deg > 161.5 && deg < 195.5) || (deg > 246 && deg < 295) || (deg > 75.5 && deg < 84.5)) continue; // the pavilion, the north end, the old man's bench
        const an = (deg * Math.PI) / 180, r = 67.2 + 0.7 * hs(j, 3), x = r * Math.cos(an), z = r * Math.sin(an);
        const front = -x * (this.cam.x - x) - z * (this.cam.z - z) > 0, m = Math.floor(hs(j, 5) * 6), ch = o.now ? NOW(j % 19) : SPE(j % 23);
        const up = !!o.cheer && (j + Math.floor(f / 5)) % 3 === 0, wet = o.wet !== undefined && f >= o.wet + (j % 9) * 2;
        const pose: Pose = wet ? { armL: "up", holdL: "brolly", armR: "hang", expr: "nervous" } : up ? { armL: "up", armR: "up", expr: "laugh" } : m === 0 ? { armR: "wave", expr: "smile" } : m === 1 ? { armL: "hip", armR: "hip" } : m === 2 ? { armL: "chin", expr: "nervous" } : m === 3 ? { armR: "front", holdR: "cup", expr: "smile" } : m === 4 ? { armL: "front", holdL: "paper" } : { expr: "smile" };
        crowdFig(ch, 200 + j, [x, o.cheer ? 0.1 * Math.abs(Math.sin(f / 3 + j * 1.7)) : 0, z], front ? { ...pose, facing: 0 } : { ...pose, back: true }, 0.02 * Math.sin(f * 0.06 + j));
      }
    };
    /** the pavilion: members and players along the balcony, members on the benches by the flower boxes */
    const pav = (o: { now?: boolean; near?: boolean } = {}) => { const fr: Pose = this.cam.x > PAV_X + 6 ? { facing: 0 } : { back: true }, P = (i: number) => (o.now ? NOW(i % 19) : SPE((i * 3 + 1) % 23));
      for (let i = 0; i < 14; i++) { const z = -14.3 + i * 2.2, pl = Math.abs(z) < 3.5;
        crowdFig(pl ? (o.now ? NOW(i) : ENG(3 + (i % 5))) : P(i), 300 + i, [PAV_X + 2.3, 4.45, z], { ...fr, armL: i % 3 ? "hang" : "hip", armR: i % 4 === 1 ? "wave" : i % 4 === 2 ? "front" : "hang", holdR: i % 4 === 2 ? "cup" : undefined, expr: i % 2 ? "smile" : "neutral" }); }
      for (const sz of [-1, 1]) for (let i = 0; i < 10; i++) { const z = sz * (5.2 + i * 1.16); if (o.near && Math.abs(z) < 8.2) continue; const m = (i + (sz > 0 ? 2 : 0)) % 5;
        crowdFig(P(i + (sz > 0 ? 11 : 0)), 320 + i + (sz > 0 ? 10 : 0), [PAV_X + 5.45, 0.16, z], { legs: "sit", ...fr, ...(m === 0 ? { expr: "smile_closed", headTilt: 12 } : m === 1 ? { armR: "front", holdR: "cup", expr: "smile" } : m === 2 ? { armL: "front", holdL: "paper" } : m === 3 ? { armR: "wave", expr: "grin" } : { armL: "chin" }) } as Pose); }
    };
    /** the north end: people in front of the marquees and at the drinks stall (umbrellas up from frame `wet`) */
    const north = (wet?: number) => { const pts: number[][] = [[-31.5, -74.6], [-29.6, -75.2], [-27.2, -74.4], [-24.6, -75.1], [-22.4, -74.5], [-12.9, -72.4], [-11.2, -72.6], [22.6, -74.6], [24.9, -75.2], [27.3, -74.3], [29.8, -75], [31.9, -74.5], [-18, -73.8], [17.6, -73.9]];
      pts.forEach(([x, z], i) => { const fr: Pose = this.cam.z > z ? { facing: 0 } : { back: true }, w = wet !== undefined && f >= wet + (i % 5) * 3;
        crowdFig(SPE((i * 5 + 2) % 23), 350 + i, [x, 0, z], { ...fr, ...(w ? { armL: "up", holdL: "brolly", expr: "nervous" } : i % 3 === 0 ? { armR: "front", holdR: "cup", expr: "smile" } : i % 3 === 1 ? { armL: "hip", expr: "smile" } : { armR: "wave", expr: "grin" }) } as Pose); });
    };
    /** gulls wheeling over the stands */
    const gulls = (n = 7) => { for (let i = 0; i < n; i++) { const an = f * 0.0035 * (i % 2 ? 1 : -1) + i * 0.9, r = 62 + 14 * hs(i, 2), k = Math.floor(f / 4 + i) % 2; K(`gull|${k}`, 120, 80, (p) => fxGull(p, k), [r * Math.cos(an), 21 + 9 * hs(i, 4) + 1.5 * Math.sin(f * 0.05 + i), r * Math.sin(an)], 2.6, 1.7); } };
    /** the two elevens standing well back to watch the toss */
    const teams = () => { for (let i = 0; i < 11; i++) { const z = -7 + i * 1.4, x = -15 - (i % 2) * 1.3;
        G(z < 0 ? ENG(1 + i) : SAF(i - 3), 60 + i, [x, 0, z], { ...turn([x, z], [0, 0]), expr: i % 3 ? "smile" : "grin", armL: i % 3 === 0 ? "hip" : "hang", armR: i % 4 === 2 ? "hip" : "hang", holdR: i % 4 === 1 ? "bat" : undefined }, { roll: 0.02 * Math.sin(f * 0.07 + i) }); } };
    /** the field set for wide shots: batsmen, bowler, keeper, the whole field and both umpires */
    const field = (o: { bowler?: boolean; striker?: boolean; now?: boolean } = {}) => {
      if (o.striker !== false) G(ENGB(0), 5, [-0.3, 0, CREASE], { facing: 0, armR: "low", holdR: "bat", armL: "hip" });
      G(ENGB(1), 6, [-1.5, 0, -WK + 0.7], { facing: 0, armR: "hang", holdR: "bat", armL: "hip" });
      G(UMP, 7, [-0.95, 0, -WK - 1.7], { armL: "hang" }); G(UMP, 8, [-19, 0, CREASE + 1.5], { ...turn([-19, CREASE + 1.5], [-0.3, CREASE]), armL: "hip" });
      G(SAF(4), 9, [0.55, 0, WK + 1.6], { legs: "kneel", armL: "front", armR: "front" });
      fielders({ ready: true });
      if (o.bowler !== false) G(SAF(0), 4, [RUNX, 0, -24], { armR: "hang", holdR: "cball", back: true });
    };
    const bench = (who: Char, k: number, wake: number) => { // the man on his bench, his cups, his cobweb, his neighbour
      const awake = f >= wake, [bx, , bz] = BENCH;
      G(who, 3, [bx, 0.14, bz - 0.04], awake ? { legs: "sit", expr: f < wake + 10 ? "dazed" : "nervous", armL: "chin", armR: "hang", look: 0, headTilt: f < wake + 10 ? 8 : 0 } : { legs: "sit", expr: "smile_closed", armL: "hang", armR: "front", headTilt: 13 + 3 * Math.sin(f * 0.09) }, { shadow: false, roll: awake ? 0 : 0.03 * Math.sin(f * 0.09) });
      if (!awake) zzz([bx, 1.55, bz - 0.06], k);
      for (let i = 0; i < 5; i++) K("cup", 120, 120, fxCup, [bx + 0.82 + (i % 2) * 0.02, 0.56 + i * 0.105, bz - 0.06], 0.2, 0.2, { rot: 0.06 * Math.sin(i * 2.1) });
      K("web", 300, 300, fxWeb, [bx - 0.52, 1.22, bz + 0.1], 0.5, 0.5, { rot: 0.2 }); K("web", 300, 300, fxWeb, [bx + 0.62, 0.86, bz + 0.12], 0.36, 0.36, { rot: -1.2 });
      const kk = Math.floor(f / 3) % 2; K(`fly|${kk}`, 120, 80, (p) => fxFly(p, kk), [bx + 0.45 * Math.cos(f * 0.21), 1.9 + 0.12 * Math.sin(f * 0.33), bz - 0.1 + 0.2 * Math.sin(f * 0.21)], 0.12, 0.08);
    };
    switch (id) {
      case 1: { // HOOK: the bowler lets it go, the ball flies the length of the pitch, the bat comes down on it
        const rel = a + 16, hit = rel + 18, bz = f < rel ? bowlerZ(u + 14, 30) : -WK - 0.3 + Math.min(1.4, 0.09 * (f - rel));
        G(SAF(0), 4, [RUNX, f < rel ? hop(0, 0.05, 2) : 0, bz], f < rel ? { legs: "run", phase: (bz + 25) / 0.62, back: true, armR: f > rel - 5 ? "up" : "front", holdR: "cball", armL: "front" } : { back: true, armR: "low", armL: "hip" });
        ball(ballAt(f, rel, 18), 0.17);
        const done = f >= hit;
        G(ENGB(0), 5, [-0.3, 0, CREASE], { facing: 0, expr: done ? (f > hit + 6 ? "grin" : "stern") : "stern", armR: done ? [-26, 60, 12] : "low", holdR: "bat", armL: done ? "hip" : "front", headTilt: done ? -4 : 6 }, { roll: done ? 0 : -0.04 });
        tock(hit, [-0.05, 0.62, CREASE - 0.4]);
        if (done) { const k = clamp01((f - hit) / 10); ball([0.12 * k, 0.6 * (1 - k) * (1 - k) + 0.085, CREASE - 0.45 - 0.5 * k], 0.17); }
        G(SAF(4), 9, [0.6, 0, WK + 1.6], { legs: "kneel", expr: "stern", armL: "front", armR: "front" });
        G(ENGB(1), 6, [-1.5, 0, -WK + 0.7], { back: true, armR: "hang", holdR: "bat" }); G(UMP, 7, [-0.95, 0, -WK - 1.7], { back: true });
        fielders({ ready: true, each: () => ({ expr: "stern" }) }); ring(90, 30, { cheer: f >= hit + 3 }); gulls();
        if (f > rel + 10 && f < rel + 16) dust(-0.1, 0, 3.6, (f - rel - 10) * 2, 0.5);
        break;
      }
      case 2: { bench(OLDM(2), 0, 1e9); G(SPE(3), 21, [BENCH[0] - 0.95, 0.14, BENCH[2] - 0.04], { legs: "sit", expr: "smile_closed", armL: "hang", armR: "hang", headTilt: -12 }, { shadow: false, roll: -0.05 }); zzz([BENCH[0] - 1.1, 1.5, BENCH[2] - 0.06], 2); break; }
      case 3: { // three watches, one after another
        const w = (k: number) => f >= a + 5 + k * 9;
        G(ENGB(0), 5, [-0.3, 0, CREASE], w(0) ? { facing: 1, expr: "nervous", armR: "front", holdR: "watch", armL: "hang", holdL: "bat", look: 0.4, headTilt: 10, sweat: 1 } : { facing: 1, armR: "low", holdR: "bat", armL: "hip" });
        G(SAF(4), 9, [0.5, 0, WK + 1.5], w(1) ? { facing: 1, expr: "nervous", armR: "front", holdR: "watch", headTilt: 10 } : { legs: "kneel", facing: 1, armL: "front", armR: "front" });
        G(UMP, 8, [-2.6, 0, WK + 0.05], w(2) ? { expr: "stern", armR: "front", holdR: "watch", headTilt: 10 } : { armL: "hip" });
        w(2) && spark([-2.5, 1.2, WK + 0.1], 0.14 * pop(a + 23, 9));
        fielders({ skip: ["gully", "shortleg"] }); ring(172, 28); pav(); gulls();
        break;
      }
      case 4: { // the quay: the officer checks his watch, the liner sounds its horn
        const horn = B.barco + 24, [sx, , sz] = SHIP;
        G(OFFICER, 5, [HX - 3.2, hop(0, 0.03, 3), 8.2], { facing: -1, expr: f > horn ? "shock" : "stern", armR: "front", holdR: "watch", armL: "hip", headTilt: f > horn ? -10 : 8, look: f > horn ? -0.5 : 0.3 });
        [0.34, 0.62].forEach((t0, i) => { const tt = clamp01(t0 + 0.0022 * u), zz = GANG.z - (tt - 0.5) * GANG.len * Math.cos(GANG.a), yy = GANG.y + (tt - 0.5) * GANG.len * Math.sin(GANG.a);
          G(SPE(1 + i * 4), 30 + i, [sx + GANG.x + (i ? 0.25 : -0.25), yy + 0.1, sz + zz], { legs: "walk", phase: u * 0.07 + i, back: true, armR: "hang", holdR: "case" }, { shadow: false }); });
        G(STF(0), 32, [HX + 13.4, 0, 10.2], { facing: -1, armL: "hip", armR: "hang" }); G(SPE(6), 33, [HX - 9.2, 0, 11.8], { facing: 1, expr: "smile", armR: "wave" }); G(SPE(2), 34, [HX - 10.2, 0, 11.3], { facing: 1, expr: "grin", armL: "up" });
        for (const fx of [-13, 5]) steam([sx + fx, 25.2, sz], 7, 13, [-9, 0, 1], 2.4, 7, true, fx);
        if (f >= horn) { const k = clamp01((f - horn) / 26); steam([sx + 5 + 2.4, 21, sz + 1], 6, 5 + 4 * k, [3, 0, 5], 1.2, 4.4, false, 0.4); K("flash", 128, 128, fxFlash, [sx + 7.6, 21.2, sz + 1.6], 2.2 * pop(horn, 9), 2.2 * pop(horn, 9), { soft: true, glow: 3 }); }
        break;
      }
      case 5: { field(); ([[-60, 6], [-58, 3.4], [-55.5, 5.2]] as number[][]).forEach(([x, z], i) => G(ENG(4 + i), 70 + i, [x + 0.03 * u, 0, z], { legs: "walk", phase: u * 0.1 + i, ...turn([x, z], [x + 9, z]) })); ring(0, 180, { step: 1.9 }); pav(); north(); gulls(); break; }
      case 6: { // the captains shake on it; the umpire between them
        const sh = f >= a + 12, bob = 5 * Math.sin(f * 0.9);
        G(UMP, 7, [-1.9, 0, 0], { expr: "smile", armL: "hip", armR: "hang", look: Math.sin(f * 0.08) });
        G(CAP_E, 5, [-0.1, 0, -0.84], { facing: -1, expr: sh ? "grin" : "smile", armL: sh ? [70, -10 + bob, -2] : "hang", armR: "hip", look: -1 });
        G(CAP_S, 6, [-0.1, 0, 0.84], { facing: 1, expr: sh ? "grin" : "smile", armR: sh ? [70, -10 + bob, -2] : "hang", armL: "hip", look: 1 });
        if (sh) spark([-0.05, 1.2, 0], 0.13 * pop(a + 12, 9));
        teams(); ring(180, 30); pav(); gulls();
        break;
      }
      case 7: { // the coin goes up... and then the umpire's watch goes over his shoulder: no time limit
        const c0 = a + 3, tc = ramp(f, c0, c0 + 20), w0 = a + 26, thr = B.limite + 44, tw = ramp(f, thr, thr + 18), laugh = f >= thr + 10;
        G(UMP, 7, [-1.3, 0, 0], f < w0 ? { expr: "smile", armR: tc > 0 && tc < 1 ? "up" : "front", armL: "hip", headTilt: -8 * Math.sin(Math.PI * tc) } : f < thr ? { expr: "stern", armR: "front", holdR: "watch", armL: "hip", headTilt: 9 } : { expr: "laugh", armR: tw < 1 ? [40, -84, 8] : "hip", armL: "hip", headTilt: -6 });
        if (tc > 0 && tc < 1) K("coin", 120, 120, fxCoin, [-0.92, 1.7 + 1.5 * Math.sin(Math.PI * tc), 0.12], 0.13, 0.13 * Math.abs(Math.cos(f * 0.9)) + 0.02);
        if (tw > 0 && tw < 1) { K("watchFly", 120, 120, fxWatch, [-1.6 - 2.6 * tw, 2.2 + 2.4 * Math.sin(Math.PI * tw) - 1.9 * tw, -0.3 - 2.2 * tw], 0.2, 0.2, { rot: f * 0.7 }); }
        if (tw >= 1 && f < thr + 30) dust(-4.2, 0, -2.5, (f - thr - 18) * 1.3, 0.6);
        G(CAP_E, 5, [-0.45, 0, -0.95], { facing: -1, expr: laugh ? "laugh" : "smile", armL: laugh ? "up" : "hang", armR: "hip", look: -1, headTilt: laugh ? -6 : 0 });
        G(CAP_S, 6, [-0.45, 0, 0.95], { facing: 1, expr: laugh ? "laugh" : "smile", armR: laugh ? "point" : "hang", armL: "hip", look: 1 });
        teams(); ring(180, 30); pav(); gulls();
        break;
      }
      case 8: case 9: case 10: { // the days go by: the same ball, bowled again and again
        const n = id === 8 ? 1 : id === 9 ? 3 : 6;
        if (id < 10) { const per = 26, v = ((f - SHOTS[7].a) % per + per) % per, rel = f - v + 14, bz = v < 14 ? bowlerZ(v + 16, 30) : -WK - 0.3 + Math.min(1.0, 0.08 * (v - 14)), hit = rel + 12;
          G(SAF(id === 8 ? 0 : 3), 4, [RUNX, v < 14 ? hop(0, 0.05, 2) : 0, bz], v < 14 ? { legs: "run", phase: (bz + 25) / 0.62, back: true, armR: v > 9 ? "up" : "front", armL: "front" } : { back: true, armR: "low", armL: "hip" });
          ball(ballAt(f, rel, 12), 0.2); tock(hit, [-0.05, 0.62, CREASE - 0.4], 1.6);
          G(ENGB(0), 5, [-0.3, 0, CREASE], { facing: 0, armR: f >= hit && f < hit + 8 ? [-26, 60, 12] : "low", holdR: "bat", armL: "hip" });
          G(ENGB(1), 6, [-1.5, 0, -WK + 0.7], { back: true, armR: "hang", holdR: "bat" }); G(UMP, 7, [-0.95, 0, -WK - 1.7], { back: true });
          G(SAF(4), 9, [0.55, 0, WK + 1.6], { legs: "kneel", armL: "front", armR: "front" });
          fielders({ ready: v < 14, move: { squareleg: [-6, 3], midoff: [4.6, -14], midon: [-8.5, -13], gully: [4.4, WK + 1.4] } }); ring(90, 24); gulls();
        } else K("moon", 256, 256, fxMoon, [-40, 70, 300], 34, 34, { soft: true, glow: 1.6 });
        days(n, SHOTS[id - 1].a + 2, 9.6, 20, 2.5, 3.1);
        break;
      }
      case 11: { // tea
        const tz = 15.05, sip = (i: number) => 0.5 + 0.5 * Math.sin(f * 0.13 + i * 1.9);
        G(ENG(1), 20, [-32.1, 0, tz], { expr: "grin", armR: sip(0) > 0.6 ? "eat" : "front", holdR: "burger", armL: "hip", headTilt: 4 * Math.sin(f * 0.2) });
        G(SAF(0), 21, [-31.0, 0, tz - 0.1], { expr: "smile", armR: sip(1) > 0.7 ? "mouth" : "front", holdR: "cup", armL: "hang", look: 1 });
        G(UMP, 22, [-29.9, 0, tz], { expr: "smile_closed", armR: [-34, 30, 12], holdR: "teapot", armL: "hip", headTilt: 8 });
        G(ENGB(2), 23, [-28.8, 0, tz - 0.1], { expr: "laugh", armL: sip(3) > 0.7 ? "mouth" : "front", holdL: "cup", armR: "hang", holdR: "bat", look: -1 });
        G(SAF(2), 24, [-27.7, 0, tz], { expr: "grin", armR: "front", holdR: "cup", armL: "wave", look: -1 });
        steam([-30.25, 1.12, 16], 3, 0.7, [0.1, 0, 0], 0.12, 0.34, false, 0.2); steam([-28.5, 0.95, 16.25], 2, 0.5, [0.05, 0, 0], 0.1, 0.26, false, 0.6);
        G(STF(1), 25, [-34.4 + 0.012 * u, 0, 17.6], { legs: "walk", phase: u * 0.08, facing: 1, armR: "front", holdR: "plate", armL: "hang" });
        ring(232, 34); north(); gulls(5);
        break;
      }
      case 12: { // Sunday
        G(ENG(2), 20, [-2.2, 0.2, 2.7], { legs: "sit", expr: "smile_closed", armL: "hip", armR: "hang", headTilt: -8 }, { shadow: false }); zzz([-2.2, 1.5, 2.7], 0);
        G(SAF(1), 21, [2.3, 0.2, 2.3], { legs: "sit", expr: "smile_closed", armL: "front", holdL: "paper", armR: "hang", headTilt: 10 }, { shadow: false });
        G(SAF(3), 22, [-2.1, 0.2, -2.5], { legs: "sit", expr: "relief", armR: "front", holdR: "drink", armL: "hip" }, { shadow: false });
        G(ENGB(0), 5, [0.2, 0.06, 0.9], { expr: "smile_closed", armL: "up", armR: "up" }, { roll: 1.52, faceUp: true, shadow: false }); zzz([0.8, 0.3, 0.5], 1);
        G(UMP, 7, [-0.4, 0.06, -1.0], { expr: "smile_closed", armL: "hip", armR: "hip" }, { roll: -1.5, faceUp: true, shadow: false }); zzz([-1.0, 0.3, -1.4], 2);
        G(SAF(0), 4, [1.6, 0.06, -2.3], { expr: "smile_closed", armL: "hang", armR: "chin" }, { roll: 1.5, faceUp: true, shadow: false });
        ball([0.9, 0.09, 2.0], 0.16);
        break;
      }
      case 13: { // wait...
        const wake = a + 8; bench(OLDM(2), 0, wake);
        G(SPE(3), 21, [BENCH[0] - 0.95, 0.14, BENCH[2] - 0.04], { legs: "sit", expr: "smile_closed", armL: "hang", armR: "hang", headTilt: -12 }, { shadow: false, roll: -0.05 });
        const kq = pop(B.q, 10); if (kq > 0) K("q", 200, 250, fxQ, [BENCH[0] + 0.1, 2.12, BENCH[2] - 0.05], 0.3 * kq, 0.38 * kq, { rot: 0.12 * Math.sin(f * 0.2) });
        break;
      }
      case 14: { // he blocks it and stays exactly where he is
        const r1 = a + 10, r2 = a + 54, hit = (r: number) => r + 16, h1 = hit(r1), h2 = hit(r2), last = f >= h2 ? h2 : f >= h1 ? h1 : -1e9, sinceHit = f - last, blocking = sinceHit >= 0 && sinceHit < 9;
        G(ENGB(0), 5, [-0.3, 0, CREASE], blocking ? { facing: 1, expr: "stern", armR: [-22, 64, 12], holdR: "bat", armL: "front" } : sinceHit > 0 && sinceHit < 60 ? { facing: 1, expr: sinceHit > 20 ? "whistle" : "grin", armR: "low", holdR: "bat", armL: "hip", look: 0.5, headTilt: -5 } : { facing: 1, expr: "stern", armR: "low", holdR: "bat", armL: "front", headTilt: 6 });
        for (const r of [r1, r2]) { ball(ballAt(f, r, 16), 0.14); tock(hit(r), [-0.02, 0.6, CREASE - 0.42]);
          if (f >= hit(r) && f < hit(r) + 44) { const k = clamp01((f - hit(r)) / 12), kr = clamp01((f - hit(r) - 12) / 32); ball([0.05, 0.075 + 0.55 * (1 - k) * (1 - k) + (k < 1 ? 0.12 * Math.abs(Math.sin(k * 6)) * (1 - k) : 0), CREASE - 0.5 - 0.5 * k - 0.5 * kr], 0.14); } }
        G(SAF(4), 9, [0.5, 0, WK + 1.5], { legs: "kneel", facing: 1, expr: sinceHit > 6 && sinceHit < 50 ? "pained" : "stern", armL: "front", armR: "front" });
        G(SAF(6), 11, [-2.7, 0, 7.7], { facing: 1, expr: f > h1 + 10 ? "relief_open" : "neutral", armL: f > h1 + 10 ? "mouth" : "low", armR: "low", headTilt: 6 });
        fielders({ skip: ["shortleg", "gully", "slip1", "slip2"], ready: !blocking && sinceHit > 40, move: { squareleg: [-14, 14] } }); ring(178, 28); pav(); gulls();
        break;
      }
      case 15: { // the bowler comes in one more time; the bat again; he keels over
        const rel = a + 38, bz = (f < rel ? bowlerZ(u - 4, 34) : -WK - 0.3 + Math.min(0.3, 0.07 * (f - rel))) - 0.7, hit = rel + 16, fall0 = B.mientras + 62, fall = ramp(f, fall0, fall0 + 10);
        G(SAF(0), 4, [RUNX, fall > 0 ? 0.28 * fall : f < rel ? hop(0, 0.05, 2) : 0, bz + 0.15 * smooth(fall)], fall > 0 ? { expr: "dazed", armL: "up", armR: "up" } : f < rel ? { legs: "run", phase: (bz + 25) / 0.62, facing: -1, expr: "pained", sweat: 2, armL: f > rel - 6 ? "up" : "front", armR: "front" } : { facing: -1, expr: f >= hit ? "shock" : "nervous", sweat: 2, armL: "low", armR: "low", headTilt: 10 }, { roll: 1.5 * smooth(fall), shadow: fall < 0.5 });
        ball(ballAt(f, rel, 16), 0.15); if (f >= hit && f < hit + 9) { const kb = pop(hit, 8); K("tock", 200, 200, fxTock, [0.2, 1.9, bz + 2.6], 0.5 * kb, 0.5 * kb, { rot: 0.4 }); }
        if (fall >= 1) this.stars(st, RUNX, 0.95, bz + 1.6, f);
        G(UMP, 7, [-0.95, 0, -WK - 2.3], { facing: -1, expr: fall >= 1 ? "shock" : "stern", armL: "hip", look: fall >= 1 ? 0.6 : 0 });
        G(ENGB(1), 6, [-1.5, 0, -WK + 3.2], { facing: 1, expr: fall >= 1 ? "laugh" : "grin", armR: "hang", holdR: "bat", armL: "hip" });
        fielders({ skip: ["slip1", "slip2", "gully", "shortleg"], ready: f < rel, each: () => (fall >= 1 ? { expr: "shock", armL: "chin" } : {}) }); ring(200, 30); pav(); gulls();
        break;
      }
      case 16: case 17: { // ten to get out... twice... for each side
        const rows = id === 16 ? 1 : 4, X = [-64.6, -62.4, -60.2, -58.0];
        for (let r = 0; r < rows; r++) { const k = id === 16 || r === 0 ? 1 : pop(a + [0, 2, 16, 26][r], 9); if (k <= 0) continue;
          for (let i = 0; i < 10; i++) { const who = r < 2 ? ENGB(i) : SAFB(i), z = 5.2 - i * 1.155, m = (i + r) % 5, seed = 50 + r * 10 + i;
            const pose: Pose = m === 0 ? { expr: "relief_open", armL: "mouth", armR: "hang", holdR: "bat" } : m === 1 ? { expr: "nervous", armL: "front", holdL: "watch", armR: "hang", holdR: "bat", headTilt: 10 } : m === 2 ? { expr: "smile_closed", armL: "hang", armR: "hang", holdR: "bat", headTilt: 12 + 2 * Math.sin(f * 0.1 + i) } : m === 3 ? { expr: "neutral", armL: "front", holdL: "paper", armR: "hang", holdR: "bat", headTilt: 8 } : { expr: "smile", armL: "front", holdL: "cup", armR: "hang", holdR: "bat" };
            G(who, seed, [X[r], 0, z], pose, { scale: k }); if (m === 2 && r === 0) zzz([X[r], 1.5, z], i); } }
        pav({ near: true }); if (id === 17) { ring(180, 44); gulls(); }
        break;
      }
      case 18: { // two of them fly up and down the pitch; everybody on their feet
        const z = runZ(f), dz = runZ(f + 1) - z, mv = Math.abs(dz) > 0.02, fc = (dz < 0 ? 1 : -1) as 1 | -1;
        G(ENGB(0), 5, [-0.62, mv ? hop(0, 0.06, 2) : 0, z], mv ? { legs: "run", phase: z / 0.6, facing: fc, expr: "grin", armR: "reach", holdR: "bat", armL: "front", sweat: 1 } : { facing: 1, expr: "laugh", armR: "up", holdR: "bat", armL: "up" });
        G(ENGB(1), 6, [0.78, mv ? hop(1, 0.06, 2) : 0, -z], mv ? { legs: "run", phase: -z / 0.6 + 0.5, facing: (-fc) as 1 | -1, expr: "laugh", armL: "reach", holdL: "bat", armR: "front" } : { facing: -1, expr: "grin", armL: "up", holdL: "bat", armR: "up" });
        if (mv) for (const zz of [z, -z]) { const kk = (f + (zz > 0 ? 0 : 8)) % 16; dust(zz === z ? -0.62 : 0.78, 0, zz + (dz < 0 === (zz === z) ? 0.5 : -0.5), kk, 0.5); }
        G(UMP, 7, [-2.2, 0, -WK - 0.4], { facing: 1, armL: "hip", look: 1 }); G(SAF(4), 9, [0.5, 0, WK + 1.6], { facing: 1, expr: "pained", armL: "up", armR: "up" }); G(SAF(0), 4, [RUNX + 0.9, 0, -WK - 2.2], { facing: 1, expr: "pained", armL: "chin", armR: "hip" });
        G(SAF(14), 13, [-9 - 0.12 * u, hop(3, 0.05, 2), 3 - 0.05 * u], { legs: "run", phase: u * 0.5, back: true, armL: "front", armR: "front" });
        fielders({ each: (_n, i) => ({ expr: i % 2 ? "pained" : "shock", armL: i % 2 ? "up" : "chin" }) }); ring(180, 30, { cheer: true }); pav(); if (f < a + 68) gulls();
        if (f >= a + 68) { const lx = -8.6 + ((70 + 19 * (884 / 21)) / 1024) * 17.2; spark([lx, 9.83, -77.9], 0.55 * (0.6 + 0.4 * Math.sin(f * 0.5))); }
        break;
      }
      case 19: { // one drop on his nose... and then the sky comes down
        const d0 = a + 2, land = a + 12, kd = ramp(f, d0, land), wet = f >= land, run = f >= a + 20, d = run ? 0.13 * (f - a - 20) : 0;
        G(ENGB(0), 5, [-0.3 - d * 0.9, run ? hop(0, 0.05, 2) : 0, CREASE + d * 0.12], run ? { legs: "run", phase: d / 0.6, facing: 1, expr: "shock", armL: "up", armR: "up", holdR: "bat" } : { facing: 0, expr: wet ? "shock" : "neutral", armR: "low", holdR: "bat", armL: wet ? "chin" : "hip", headTilt: -12, look: 0 });
        if (kd > 0 && kd < 1) K("drop", 80, 120, fxDrop, [-0.24, 3.4 - 1.86 * kd, CREASE + 0.03], 0.1, 0.15);
        if (wet && f < land + 9) spark([-0.22, 1.56, CREASE + 0.04], 0.16 * pop(land, 8));
        G(SAF(4), 9, [0.5 - d, run ? hop(1, 0.05, 2) : 0, WK + 1.5 + d * 0.1], run ? { legs: "run", phase: d / 0.6 + 0.3, facing: 1, expr: "shock", armL: "up", armR: "up" } : { legs: "kneel", armL: "front", armR: "front" });
        const off = (ch: Char, seed: number, x: number, z: number, i: number, bat = false) => { const sp = 1.0 - 0.012 * x; // the ones nearer the pavilion run faster: nobody catches anybody
          G(ch, seed, [x - d * sp, run ? hop(i + 2, 0.05, 2) : 0, z + d * 0.1 * (z > 0 ? -1 : 1)], run ? { legs: "run", phase: d / 0.6 + i * 0.3, ...turn([x, z], [x - 10, z]), expr: "shock", armL: "up", armR: bat ? "front" : "up", holdR: bat ? "bat" : undefined } : { ...turn([x, z], [-0.3, CREASE]), armL: "low", armR: bat ? "hang" : "low", holdR: bat ? "bat" : undefined }); };
        off(ENGB(1), 6, -1.5, -WK + 0.7, 1, true); off(SAF(0), 4, RUNX, -WK - 3, 2);
        Object.keys(FLD).forEach((n, i) => { const [x, z, who] = FLD[n]; off(SAF(who), 40 + i, n === "shortleg" ? -3.2 : x, n === "shortleg" ? 9.8 : z, i + 3); });
        ring(232, 42, { wet: land + 4 }); north(land + 4);
        G(UMP, 7, [-0.95, 0, -WK - 1.7], wet ? { expr: "stern", armL: "up", holdL: "brolly", armR: "hip" } : { armL: "hip" });
        // the ground staff run the cover out from the north end
        const cz = lerp(-34, 0, smooth(ramp(f, a + 18, b - 2)));
        if (f >= a + 18) for (const sx of [-1, 1]) G(STF(sx > 0 ? 0 : 1), 30 + sx, [sx * 3.0, hop(sx, 0.05, 2), cz + 9.6], { legs: "run", phase: (cz + 34) / 0.6 + (sx > 0 ? 0.4 : 0), back: false, facing: 0, expr: "pained", armL: sx > 0 ? "low" : "hang", armR: sx > 0 ? "hang" : "low" });
        if (f >= land + 2) { rain(ramp(f, land + 2, land + 14)); ripples([0, 0, 6], 10, 16); K("storm0", 512, 256, (p) => fxStorm(p, 0), [-30, 60, -160], 260, 120, { soft: true }); K("storm1", 512, 256, (p) => fxStorm(p, 1), [60, 70, -200], 300, 130, { soft: true }); }
        break;
      }
      case 20: { // the train, in steam
        const wh = f >= a + 30;
        G(MASTER, 5, [TX + 18.9, 1.0, 0.45], { facing: -1, expr: wh ? "whistle" : "stern", armR: "front", holdR: "watch", armL: wh ? "up" : "hip", headTilt: wh ? -6 : 8 });
        G(SPE(5), 30, [TX - 2 + 0.02 * u, 1.0, 5.6], { legs: "walk", phase: u * 0.09, facing: 1, armR: "hang", holdR: "case" }); G(SPE(7), 31, [TX - 3.2 + 0.02 * u, 1.0, 6.3], { legs: "walk", phase: u * 0.09 + 0.5, facing: 1, armL: "hang", holdL: "bag" });
        steam([TX + 15.9, 4.9, -1.8], 8, 9, [-7, 0, 1.5], 1.0, 5.2, true, 0); steam([TX + 15.4, 0.9, -0.5], 3, 1.2, [2.2, 0, 1.2], 0.4, 1.5, false, 0.3); steam([TX + 12.4, 4.0, -1.8], 2, 3, [-2, 0, 0], 0.4, 1.4, false, 0.7);
        rain(0.5);
        break;
      }
      case 21: { // down the platform, bags and bats, and onto the tail of the train
        const d = trainX(f), Y = 1.13, bx = TX - 35.2 + d, zc = -1.8;
        G(ENG(2), 20, [bx + 0.45, Y, zc - 0.43], { expr: "laugh", armL: "wave", armR: "hip" }, { shadow: false }); G(ENG(3), 21, [bx + 0.45, Y, zc + 0.43], { expr: f > a + 40 ? "shock" : "grin", armL: f > a + 38 ? "up" : "hang", armR: "hip" }, { shadow: false });
        const runner = (ch: Char, seed: number, x0: number, board: number, spot: [number, number], hold: Pose) => { const xr = TX + x0 + 0.24 * u, kb = smooth(ramp(f, board, board + 9)), sx = bx + spot[0], sz = zc + spot[1];
          if (kb >= 1) G(ch, seed, [sx, Y, sz], { facing: -1, expr: "relief", armL: "wave", armR: "hang", ...hold, legs: "stand" }, { shadow: false });
          else { const x = lerp(xr, sx, kb), z = lerp(1.25, sz, kb); G(ch, seed, [x, 1.0 + (Y - 1.0) * kb + 0.75 * Math.sin(Math.PI * kb) + (kb > 0 ? 0 : hop(seed, 0.05, 2)), z], { legs: "run", phase: (0.24 * u) / 0.6 + seed, facing: 1, expr: kb > 0 ? "shock" : "pained", sweat: 2, armL: kb > 0 ? "reach" : "front", armR: "front", ...hold }, { shadow: kb <= 0 });
            if (kb <= 0) { const kk = (f + seed * 3) % 16; dust(x - 0.5, 1.0, z, kk, 0.5); } } };
        runner(ENG(1), 22, -41.5, a + 20, [-0.55, -0.86], { holdR: "case" }); runner(SAF(2), 23, -42.7, a + 30, [-0.55, 0], { holdR: "bat" }); runner(ENGB(0), 5, -45.2, a + 44, [-0.55, 0.86], { holdR: "case", holdL: "bat" });
        G(MASTER, 24, [TX - 29.5, 1.0, 3.2], { facing: -1, expr: "whistle", armR: "up", armL: "hip" });
        steam([TX + 15.9 + d, 4.9, -1.8], 8, 10, [-16, 0, 2], 1.2, 7, true, 0); rain(0.5);
        break;
      }
      case 22: { // nobody left but the umpire: off come the bails
        const off = f >= B.empate, sh = f >= B.empate + 10;
        G(UMP, 7, [-0.8, 0, WK + 0.2], { facing: 0, expr: sh ? "relief" : "stern", armL: [-10, 34, 14], holdL: "brolly", armR: sh ? "wave" : off ? "front" : f > B.empate - 10 ? "low" : "hang", headTilt: sh ? -6 : 8 });
        if (off && f < B.empate + 10) spark([0, 0.8, WK], 0.16 * pop(B.empate, 8));
        rain(0.3); ripples([1, 0, 6], 8, 14);
        break;
      }
      case 23: { field({ now: true }); ring(0, 180, { step: 1.9, now: true, cheer: true }); pav({ now: true }); gulls(); days(5, B.hoy + 8, 21, -34, 5.2, 7.4, 9); this.conf(st, f, 0, 14, -20, 30, 40); break; }
      default: { // today: his great-grandson, same bench, same patience
        const wake = B.aun + 36; bench(OLD_NOW, 3, wake);
        G(NOW(3), 21, [BENCH[0] - 0.95, 0.14, BENCH[2] - 0.04], { legs: "sit", expr: f >= wake ? "laugh" : "smile", armR: "front", holdR: "phone", armL: "hang", look: f >= wake ? 1 : 0, headTilt: 8 }, { shadow: false });
        const kq = pop(wake + 6, 10); if (kq > 0) K("q", 200, 250, fxQ, [BENCH[0] + 0.1, 2.12, BENCH[2] - 0.05], 0.3 * kq, 0.38 * kq, { rot: 0.12 * Math.sin(f * 0.2) });
        break;
      }
    }
    void [spark, lerp, smooth, b, STRIDE, fxMoon];
    return st;
  }
  private conf(st: Stage, f: number, cx: number, cy: number, cz: number, n = 46, spread = 5) {
    const cols = ["#e2453c", "#f6c419", "#3f8fc9", "#57a05a", "#fbfbf6"];
    for (let i = 0; i < n; i++) { const t = ((f * 0.012 + hs(i, 3)) % 1), x = cx + (hs(i, 1) - 0.5) * spread + 0.3 * Math.sin(f * 0.1 + i), y = cy + 3.2 - t * 9, z = cz + (hs(i, 2) - 0.5) * spread * 0.7;
      this.card(st, `conf|${cols[i % 5]}`, 64, 64, (p) => fxConfetti(p, cols[i % 5]), [x, y, z], 0.5, 0.5, { rot: f * 0.2 + i }); }
  }
  private camPos(d: number): V3 { return [this.cam.x + this.camF.x * d, this.cam.y + this.camF.y * d - 1.2, this.cam.z + this.camF.z * d]; }

  private contact(st: Stage, x: number, z: number, s = 1, y = 0) {
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

  update(id: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const s = SHOTS[id - 1], L = LIGHTS[s.light], K = LOOK[s.light];
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
    this.hemi.color.set(L.sky); this.hemi.groundColor.set(L.ground); this.hemi.intensity = L.hemiI;
    this.sun.color.set(L.sunCol); this.sun.intensity = L.sunI * (s.rain ? 1 - 0.45 * s.rain : 1);
    let Rr = THREE.MathUtils.clamp(dist * 1.15 + 7, 14, 95);
    if (s.light === "golden") Rr = Math.max(Rr, 30);
    if (id === 5 || id === 23 || id === 17 || id === 19 || id === 22) Rr = 95;
    this.sun.position.copy(focus).addScaledVector(this.sunDir, 220); this.sun.target.position.copy(focus);
    const sc = this.sun.shadow.camera; sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = 20; sc.far = 480; sc.updateProjectionMatrix();
    this.sun.shadow.bias = L.bias; this.sun.shadow.normalBias = L.normalBias * (Rr / 12);
    TONE.uLitCol.value.set(...L.lit); TONE.uShadeCol.value.set(...L.shade); TONE.uShadeLift.value.set(...L.lift);
    TONE.uLambert.value = L.lambert; TONE.uSideK.value = L.sideK; TONE.uTerm.value = L.term; TONE.uBounce.value.set(...K.bounce); TONE.uSat.value = K.sat;
    CHAR.uCharTint.value.set(...L.charTint); CHAR.uCharShade.value = L.charShade; CHAR.uGrad.value = L.charGrad; CHAR.uBodyGrad.value = L.bodyGrad; CHAR.uSideTint.value.set(...L.sideTint);
    const su = this.skyMat.uniforms;
    K.sky.c.forEach((h, i) => untone(h, su["c" + i].value));
    const e = K.sky.e.map((deg) => THREE.MathUtils.degToRad(deg)); su.e.value.set(e[1], e[2], e[3], e[4]);
    this.sky.position.copy(cam.position);
    untone(L.fog, this.fog.color);
    this.fog.near = 90; this.fog.far = s.rain ? 520 : 900;
    const night = s.light === "night", R = this.refs;
    for (const lm of LAMP_MATS) { const h = (lm.userData as { hot: [number, number, number] }).hot, k = night ? 1 : s.light === "golden" ? 0.55 : 0.3; lm.color.setRGB(h[0] * k, h[1] * k, h[2] * k); }
    for (const tn of R.tints) tn.m.color.setRGB(...tn[s.light]);
    R.ground.visible = s.place === "ground"; R.harbour.visible = s.place === "harbour"; R.station.visible = s.place === "station";
    R.tea.visible = id === 11; R.sunday.visible = id === 12; R.floods.visible = !!s.now;
    R.cover.visible = id === 19 ? f >= s.a + 18 : id === 22; R.cover.position.z = id === 19 ? lerp(-34, 0, smooth(ramp(f, s.a + 18, s.b - 2))) : 0;
    R.bails[1].visible = !(id === 22 && f >= B.empate); R.bails[0].visible = true;
    R.stands.forEach((m) => (m.material = R.crowdMats[s.now ? 1 : id === 22 || id === 10 ? 2 : 0])); // after the draw, and at night, the stands are empty
    R.vintage.visible = !s.now;
    R.flags.forEach((g, i) => { const ud = g.userData as { b?: number }; if (ud.b === undefined) ud.b = g.rotation.y; g.rotation.y = ud.b + (s.rain ? 0.5 : 0.3) * Math.sin(f * 0.11 + i * 1.3); });
    R.train.position.x = TX + (id === 21 ? trainX(f) : 0);
    // the pavilion clock: it races while the days go by
    const tm = id >= 8 && id <= 10 ? (f - SHOTS[7].a) * 0.42 : id === 14 || id === 15 ? f * 0.02 : 1.2 + id * 0.9 + f * 0.0006;
    R.hands[0].rotation.x = -tm / 12; R.hands[1].rotation.x = -tm;
    // living sets: sea, palms, crowd
    for (const w of R.waves) w.offset.set(f * 0.0016, f * 0.0009 + 0.01 * Math.sin(f * 0.05));
    R.crowns.forEach((g, i) => { g.rotation.z = (s.rain ? 0.1 : 0.05) * Math.sin(f * 0.045 + i * 1.3); g.rotation.x = 0.04 * Math.sin(f * 0.037 + i * 2.1); });
    const roar = id === 1 || id === 18 || id === 23;
    for (const ct of R.crowds) ct.offset.y = roar ? 0.012 * Math.sin(f * 1.1) : 0.003 * Math.sin(f * 0.4);
    R.ship.position.y = 0.12 * Math.sin(f * 0.05); R.ship.rotation.x = 0.004 * Math.sin(f * 0.04);
    this.starPts.visible = night; this.starPts.position.copy(cam.position);
    const lamps = lampsAt(id, f);
    this.lamps.forEach((l, i) => { const d = lamps[i]; if (d) { l.position.set(...d.p); l.color.set(d.c); l.intensity = d.i; l.distance = d.d; } else l.intensity = 0; });
    scene.fog = this.fog; scene.background = null;
    this.sunDisc.visible = s.light === "golden" && !s.rain;
    this.sunDisc.position.copy(cam.position).addScaledVector(this.sunDir, 900); this.sunDisc.scale.setScalar(2 * 900 * Math.tan(THREE.MathUtils.degToRad(1.7)));
    this.clouds.forEach((m, i) => {
      const a = (i / 10) * Math.PI * 2 + 0.3, d = 760 + (i % 3) * 60, w = 150 + (i % 4) * 36;
      m.position.set(cam.position.x + Math.cos(a + f * 0.00012) * d, 150 + (i % 4) * 46, cam.position.z + Math.sin(a + f * 0.00012) * d); m.scale.set(w, w / 2, 1);
      m.lookAt(cam.position.x, m.position.y, cam.position.z); (m.material as THREE.MeshBasicMaterial).map = this.cloudMaps[s.light === "golden" ? "golden" : "day"][i % 4]; m.visible = !night;
      (m.material as THREE.MeshBasicMaterial).color.setScalar(s.rain ? 1.1 - 0.5 * s.rain : 1.1);
    });
    // ---- cast ----
    const st = this.stage(id, f);
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
      m.castShadow = s.light === "golden";
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
