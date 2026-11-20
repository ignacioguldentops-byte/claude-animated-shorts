// The world of "La trastienda": today's stadium, Madrid in 1902 (calle de Alcalá, the cloth shop and its back room, the
// waste ground by the bullring), a London pitch, the racecourse of the coronation tournament, and the cast as 2D cards
// standing in them. One instance per canvas; update(shot, frame) poses everything for that frame.
import * as THREE from "three";
import { Pool, Actor, Fx } from "./pool";
import { NOINK } from "./ink";
import { TONE, CHAR, untone } from "./shade";
import { LIGHTS, LOOK, LightK } from "./lights";
import { ctex, cloudHD } from "./paint";
import { Pen, figure, Char, Pose, fxContact, fxPuff, fxStars, fxNote } from "./toon";
import { fxBall, fxQ, fxFlash, fxConfetti } from "./props";
import { fxOldBall, fxFlatBall, fxEuroCup, fxCarriage, fxDog, fxCheese, fxAlps, fxBell, fxQuill, fxPoof, fxDot, fxLoco, fxTopHat, fxSteam, fxCabBack } from "./gearr";
import { SHOTS, B, V3, camAt, smooth, clamp01, lerp, ramp, lampsAt, HIT, NET, strikerX, hookBall, walkX, tramX, dribX, routeAt, mapPt, GOALS, founderAt, seat } from "./story";
import { buildStadium, buildStreet, buildShop, buildField, buildLondon, buildHipo, newRefs, Refs, LAMP_MATS, SX, IX, BX, FX, LX, HPX, HL, HW } from "./setsr";
import { MAP_MAD } from "./paintr";
import { JUAN, CARLOS, JUAN_HAT, CARLOS_HAT, CARLOS_SHOP, student, mad, bar, FOUNDER, KEEPER, gent, towns, KEEP, KING, OFFICER, REF, star, rival, GOALIE, fan, DOUBT } from "./castr";
const CKEY = new WeakMap<Char, string>();
const CC = new Map<string, Char>();
/** cast builders return fresh objects: memoise so cards share textures */
const memo = (k: string, make: () => Char) => { let c = CC.get(k); if (!c) { c = make(); CC.set(k, c); } return c; };
const STU = (i: number) => memo("st" + i, () => student(i)), MAD = (i: number) => memo("m" + i, () => mad(i)), BAR = (i: number) => memo("b" + i, () => bar(i)), GENT = (i: number) => memo("g" + i, () => gent(i));
const TOWN = (i: number) => memo("t" + i, () => towns(i)), STAR = (i: number) => memo("s" + i, () => star(i)), RIV = (i: number) => memo("r" + i, () => rival(i)), FAN = (i: number) => memo("f" + i, () => fan(i));
const BARE = (i: number) => memo("tb" + i, () => ({ ...towns(i), hat: undefined }));

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
const RX = HL + 6, RZ = HW + 5; // the rail round the 1902 pitch

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
    buildStadium(R, this.refs); buildStreet(R, this.refs); buildShop(R, this.refs); buildField(R, this.refs); buildLondon(R, this.refs); buildHipo(R, this.refs);
    for (let i = 0; i < 6; i++) { const l = new THREE.PointLight("#ffffff", 0, 8, 2); this.lamps.push(l); R.add(l); }
    { const n = 500, pos = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const a = hs(i, 1) * Math.PI * 2, e = 0.08 + hs(i, 2) * 1.3, r = 1000; pos[i * 3] = r * Math.cos(a) * Math.cos(e); pos[i * 3 + 1] = r * Math.sin(e); pos[i * 3 + 2] = r * Math.sin(a) * Math.cos(e); }
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      this.starPts = new THREE.Points(g, new THREE.PointsMaterial({ color: new THREE.Color(2.2, 2.2, 2.0), size: 2.6, sizeAttenuation: false, fog: false, depthWrite: false })); this.starPts.layers.set(NOINK); this.starPts.frustumCulled = false; R.add(this.starPts); }
    for (let i = 0; i < 400; i++) this.actors.push(new Actor(R));
    for (let i = 0; i < 520; i++) this.fxs.push(new Fx(R));
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
    const dust = (x: number, y: number, z: number, k: number, size = 0.7) => { const tt = (((k % 16) + 16) % 16) / 16; K(`puff|${Math.round(tt * 16)}`, 300, 260, (p) => fxPuff(p, tt), [x, y + 0.22 + tt * 0.2, z], size, size * 0.87, { soft: true }); };
    const steam = (p: V3, n: number, rise: number, drift: V3, s0: number, s1: number, dark = false, seed = 0) => { for (let i = 0; i < n; i++) { const tt = (f * 0.03 + i / n + seed) % 1, s = lerp(s0, s1, tt);
        K(dark ? "smoke" : "steam", 128, 128, (pp) => fxSteam(pp, dark), [p[0] + drift[0] * tt + 0.3 * Math.sin(i * 2.1 + tt * 5), p[1] + rise * tt, p[2] + drift[2] * tt + 0.3 * Math.cos(i * 1.3 + tt * 4)], s, s, { soft: true, glow: dark ? 0.9 : 1.2 }); } };
    /** the modern ball and the leather one of 1902 */
    const ball = (p: V3, s = 0.24) => { const sp = Math.round(f * 2) % 8; K(`ball|${sp}`, 256, 256, (pp) => fxBall(pp, sp * 0.4), p, s, s); };
    const oldBall = (p: V3, s = 0.26, rot = f * 0.5) => K("oldball", 120, 120, fxOldBall, p, s, s, { rot });
    const burst = (f0: number, p: V3, s = 0.9) => { if (f >= f0 && f < f0 + 8) { const k = pop(f0, 7); spark(p, 0.5 * s * k); } };
    /** how a figure at p turns to look at t, as this camera sees it */
    const turn = (p: number[], t: number[]): Pose => { const dx = t[0] - p[0], dz = t[1] - p[1], lat = dx * this.right.x + dz * this.right.z, dep = dx * this.camF.x + dz * this.camF.z;
      return Math.abs(lat) > Math.abs(dep) * 0.8 ? { facing: (lat > 0 ? 1 : -1) as 1 | -1 } : dep > 0 ? { back: true } : { facing: 0 }; };
    /** a figure of the crowd: no blink (its card is drawn once and kept), no contact blob */
    const crowdFig = (ch: Char, seed: number, pos: V3, pose: Pose, roll = 0) => this.fig(st, ch, seed, pos, pose, { shadow: false, roll });
    const idle = (j: number, lady: boolean): Pose => { const m = j % 6; return m === 0 ? { armR: "wave", expr: "smile" } : m === 1 ? { armL: "hip", armR: lady ? "hang" : "hip" } : m === 2 ? { armL: "chin", expr: "nervous" } : m === 3 ? (lady ? { armL: "up", holdL: "brolly", expr: "smile" } : { armR: "hang", holdR: "cane", expr: "smile" }) : m === 4 ? { armL: "hip", expr: "grin" } : { expr: "smile" }; };

    // ---- the people who fill each place ----
    /** the street: people walking both pavements, a few stopped in the roadway */
    const walkers = (x0: number, x1: number, skip?: (x: number, z: number) => boolean) => {
      for (let i = 0; i < 120; i++) { const sd = i % 2 ? 1 : -1, z = sd * (8.3 + 2.9 * hs(i, 1)), dir = hs(i, 2) > 0.5 ? 1 : -1, sp = 0.028 + 0.02 * hs(i, 3), base = SX - 250 + (i * 370) / 120 + 2 * hs(i, 4);
        const x = base + dir * sp * f; if (x < x0 || x > x1 || skip?.(x, z)) continue; if (sd < 0 && Math.abs(x - SX) < 7 && z < -10.3) continue; // not through the trestle and the bench of the shop
        const ch = TOWN(i % 31), lady = i % 31 % 3 === 1;
        G(ch, 500 + i, [x, 0.16, z], { legs: "walk", phase: f * 0.09 + i, ...turn([x, z], [x + dir, z]), expr: i % 3 ? "smile" : "neutral", ...(lady && i % 2 ? { armL: "up", holdL: "brolly" } : i % 4 === 0 ? { armR: "hang", holdR: "cane" } : i % 4 === 2 ? { armR: "hang", holdR: "bag" } : {}) }, { roll: 0.015 * Math.sin(f * 0.18 + i) }); }
    };
    /** cabs going away down the right-hand side of the street (seen from behind) */
    const cabs = () => { for (let i = 0; i < 4; i++) { const x = SX - 30 + i * 34 + 0.06 * f, k = Math.floor(f / 4 + i) % 2; if (x > SX + 112) continue; K(`cab|${k}`, 300, 380, (p) => fxCabBack(p, k), [x, 1.42 + 0.02 * k, 4.6 - (i % 2) * 0.5], 2.2, 2.8); } };
    const standers = (pts: [number, number, number][], at: number[]) => pts.forEach(([x, z, k], i) => G(TOWN(k), 640 + i, [x, Math.abs(z) > 7 ? 0.16 : 0, z], { ...turn([x, z], at), ...idle(k, k % 3 === 1) }));
    /** the waste ground: the onlookers behind the rope */
    const onlookers = (cheer = false) => { for (let i = 0; i < 26; i++) { const x = FX - 29 + i * 2.32 + 0.5 * hs(i, 1), z = -22.0 - 0.5 * hs(i, 2), k = (i * 7 + 3) % 31;
        crowdFig(TOWN(k), 300 + i, [x, cheer && i % 3 === 0 ? 0.08 * Math.abs(Math.sin(f / 3 + i)) : 0, z], { ...turn([x, z], [x, 0]), ...idle(i, k % 3 === 1) }, 0.02 * Math.sin(f * 0.06 + i)); }
      for (let i = 0; i < 9; i++) { const x = FX - 30 + i * 7.3 + 2 * hs(i, 5), z = 22.1, k = (i * 5 + 1) % 31; crowdFig(TOWN(k), 330 + i, [x, 0, z], { ...turn([x, z], [x, 0]), ...idle(i + 2, k % 3 === 1) }); } };
    /** the racecourse: spectators all along the white rail (the royal box and the goal mouths kept clear) */
    const rails = (o: { cheer?: boolean; south?: boolean } = {}) => {
      const put = (x: number, z: number, j: number) => { const k = (j * 7 + 2) % 31, up = !!o.cheer && (j + Math.floor(f / 5)) % 3 === 0;
        crowdFig(TOWN(k), 200 + j, [HPX + x, up ? 0.1 * Math.abs(Math.sin(f / 3 + j * 1.7)) : 0, z], { ...turn([HPX + x, z], [HPX + x * 0.5, z * 0.3]), ...(up ? { armL: "up", armR: "up", expr: "laugh" } : idle(j, k % 3 === 1)) }, 0.02 * Math.sin(f * 0.06 + j)); };
      let j = 0;
      for (let x = -RX + 1; x <= RX - 1; x += 1.25) { j++; if (Math.abs(x) < 5.6) continue; put(x + 0.3 * hs(j, 1), -(RZ + 0.9 + 0.5 * hs(j, 2)), j); }
      if (o.south !== false) for (let x = -RX + 1; x <= RX - 1; x += 1.7) { j++; put(x + 0.4 * hs(j, 1), RZ + 0.9 + 0.5 * hs(j, 2), j); }
      for (const sd of [-1, 1]) for (let z = -RZ + 1.5; z <= RZ - 1.5; z += 2.1) { j++; put(sd * (RX + 0.9 + 0.5 * hs(j, 2)), z, j); }
    };
    /** the royal box */
    const royal = (wave = true) => { const z = -(RZ + 5) + 2.5; crowdFig(KING, 190, [HPX, 2.2, z], { expr: "smile", armR: wave ? (Math.sin(f * 0.35) > 0 ? "wave" : "up") : "hang", armL: "hip" }); crowdFig(OFFICER, 191, [HPX - 1.8, 2.2, z - 0.3], { expr: "stern", armL: "hip" }); crowdFig(TOWN(1), 192, [HPX + 1.8, 2.2, z - 0.3], { expr: "smile", armR: "front", holdR: "flower" }); crowdFig(TOWN(4), 193, [HPX - 3.3, 2.2, z - 0.5], { expr: "smile", armR: "hang" }); crowdFig(TOWN(7), 194, [HPX + 3.3, 2.2, z - 0.5], { expr: "grin", armL: "wave" }); };
    /** the two elevens spread over the 1902 pitch (Madrid defend the west goal) */
    const elevens = (o: { skipM?: number[]; skipB?: number[]; keeper?: boolean } = {}) => {
      const FM: number[][] = [[-36, -14], [-36, 13], [-24, -22], [-22, 0], [-25, 21], [-10, -24], [-8, -9], [-7, 8], [-11, 24], [-3, -2]], FB: number[][] = [[36, -13], [36, 14], [24, -21], [22, 1], [25, 22], [10, -23], [9, -8], [7, 9], [11, 25], [3, 2]];
      const bx = HPX + 6 * Math.sin(f * 0.04), bz = 5 * Math.cos(f * 0.03);
      FM.forEach(([x, z], i) => { if (o.skipM?.includes(i)) return; const px = HPX + x + 1.6 * Math.sin(f * 0.05 + i), pz = z + 1.2 * Math.cos(f * 0.04 + i * 2); G(MAD(i), 60 + i, [px, hop(i, 0.04, 2), pz], { legs: "run", phase: f * 0.3 + i, ...turn([px, pz], [bx, bz]), armL: "front", armR: "front" }); });
      FB.forEach(([x, z], i) => { if (o.skipB?.includes(i)) return; const px = HPX + x + 1.6 * Math.sin(f * 0.05 + i + 2), pz = z + 1.2 * Math.cos(f * 0.04 + i * 2 + 1); G(i === 9 ? FOUNDER : BAR(i), 80 + i, [px, hop(i + 3, 0.04, 2), pz], { legs: "run", phase: f * 0.3 + i + 0.5, ...turn([px, pz], [bx, bz]), armL: "front", armR: "front" }); });
      if (o.keeper !== false) G(KEEPER, 59, [HPX - HL + 0.9, 0, 0], { ...turn([HPX - HL + 0.9, 0], [bx, bz]), armL: "low", armR: "low" }); G(BAR(10), 91, [HPX + HL - 0.9, 0, 0], { ...turn([HPX + HL - 0.9, 0], [bx, bz]), armL: "hip", armR: "hip" });
      G(REF, 58, [HPX + 2, 0, -6], { ...turn([HPX + 2, -6], [bx, bz]), armL: "hip" }); oldBall([bx, 0.13 + 0.3 * Math.abs(Math.sin(f * 0.2)), bz], 0.3);
    };
    /** today's stand: the block of real seats (row 0 at the front); `special` seats are filled by the caller */
    const SEAT0 = [-8.05, -7.25, -6.45, -5.65, -4.85, -4.05, -3.25, -2.45, -1.65, -0.45, 0.45, 1.3, 2.1, 2.9, 3.7, 4.5, 5.3, 6.1, 6.9, 7.7];
    const block = (o: { cheer?: number; skip?: number[] } = {}) => {
      for (let r = 0; r < 5; r++) { const xs = r === 0 ? SEAT0 : Array.from({ length: 21 }, (_, k) => -8.2 + 0.8 * k + (r % 2) * 0.4);
        xs.forEach((x, k) => { if (r === 0 && o.skip?.includes(x)) return; if (Math.abs(x) > 8.7) return; const j = r * 23 + k, up = o.cheer !== undefined && f >= o.cheer + (j % 7) && (j + Math.floor(f / 6)) % 3 !== 1, p = seat(r, x);
          crowdFig(FAN(j % 37), 700 + j, [p[0], p[1] + (up ? 0.07 * Math.abs(Math.sin(f / 3 + j)) : 0), p[2]], { legs: "sit", facing: 0, ...(up ? { armL: "up", armR: "up", expr: "laugh" } : j % 5 === 0 ? { armR: "front", holdR: "phone", expr: "smile" } : j % 5 === 1 ? { armL: "chin", expr: "nervous" } : j % 5 === 2 ? { armR: "wave", expr: "grin" } : j % 5 === 3 ? { armR: "front", holdR: "drink", expr: "smile" } : { expr: "smile" }) } as Pose); }); }
    };
    /** camera flashes going off up in the stands */
    const flashes = (n: number, cx: number, cz: number, spread: number, y0 = 4, y1 = 26) => { for (let i = 0; i < n; i++) { const t = Math.floor((f + i * 7) / 5), ph = (f + i * 7) % 5; if (ph > 2) continue; const an = hs(i * 31 + t, 1) * Math.PI * 2, rr = 0.75 + 0.25 * hs(i + t, 4), c = Math.cos(an), s = Math.sin(an), h = lerp(y0, y1, hs(i + t * 3, 2));
        const x = Math.sign(c) * Math.sqrt(Math.abs(c)) * (63 + h * 1.1) * rr, z = Math.sign(s) * Math.sqrt(Math.abs(s)) * (43 + h * 1.1) * rr; if (Math.hypot(x - cx, z - cz) > spread) continue; K("flash", 128, 128, fxFlash, [x, h + 1.5, z], 1.6, 1.6, { soft: true, glow: 3 }); } };
    const question = (p: V3, f0: number, s = 1) => { const kq = pop(f0, 10); if (kq > 0) K("q", 200, 250, fxQ, p, 0.3 * kq * s, 0.38 * kq * s, { rot: 0.12 * Math.sin(f * 0.2) }); };

    switch (id) {
      case 1: { // HOOK: he runs on to it, hits it, and it is in the top corner
        const xs = strikerX(u), hit = u >= HIT, in_ = u >= HIT + NET;
        G(STAR(0), 5, [xs + (hit ? 0.03 * (u - HIT) : 0), hit ? 0 : hop(0, 0.11, 2), 1.5], in_ ? { ...turn([xs, 1.5], [xs + 9, 1.5]), expr: "laugh", armL: "up", armR: "up" } : hit ? { ...turn([xs, 1.5], [xs + 9, 1.5]), expr: "stern", armL: "up", armR: "low", tilt: 8 } : { legs: "run", phase: u * 0.27, ...turn([xs, 1.5], [xs + 9, 1.5]), expr: "stern", armL: u % 6 < 3 ? "front" : "low", armR: u % 6 < 3 ? "low" : "front", sweat: 1 }, { roll: hit && !in_ ? -0.14 : -0.08 });
        if (!hit) for (const s of [0, 5]) dust(xs - 0.7 - s * 0.12, 0, 1.6, u * 2 + s, 0.55);
        ball(hookBall(u), 0.26); burst(a + HIT, [32.4, 0.4, 1.2], 1.4); if (u >= HIT && u < HIT + 8) dust(31.9, 0, 1.3, (u - HIT) * 2, 0.6);
        const kd = smooth(ramp(u, HIT + 1, HIT + NET));
        G(GOALIE, 6, [51.7, 0.55 * Math.sin(Math.PI * kd), -0.3 - 1.5 * kd], kd > 0 ? { ...turn([51.7, 0], [40, 0]), expr: "shock", armL: "up", armR: "up" } : { ...turn([51.7, 0], [40, 0]), armL: "low", armR: "low" }, { roll: -1.1 * kd, shadow: kd < 0.3 });
        G(RIV(0), 7, [xs - 2.3, hop(1, 0.08, 2), 0.2], { legs: "run", phase: u * 0.27 + 0.4, ...turn([xs - 1.9, 3.3], [xs + 9, 3.3]), expr: "pained", armL: "reach", armR: "front" });
        G(RIV(1), 8, [42.5, 0, -4.6], { ...turn([42.5, -4.6], [32, 1]), expr: hit ? "shock" : "stern", armL: "low", armR: "low" }); G(RIV(2), 9, [47.6, 0, -5.4], { ...turn([47.6, -5.4], [32, 1]), expr: hit ? "shock" : "stern", armL: hit ? "up" : "low", armR: "low" });
        G(STAR(1), 10, [38, 0, -7.5], { ...turn([38, -7.5], [50, 0]), expr: in_ ? "laugh" : "grin", armL: in_ ? "up" : "front", armR: in_ ? "up" : "front" }); G(STAR(2), 11, [45, 0, -9], { ...turn([45, -9], [52, 0]), expr: in_ ? "laugh" : "smile", armL: in_ ? "up" : "hang", armR: in_ ? "up" : "hang" });
        for (let r = 0; r < 2; r++) for (let i = 0; i < 30; i++) { const z = -17 + i * 1.17 + r * 0.5, j = r * 31 + i, up = in_ && (j + Math.floor(f / 3)) % 3 !== 0; crowdFig(FAN(j % 37), 100 + j, [63.4 + r * 1.3 - 0.012 * z * z, 1.25 + r * 0.7 + (up ? 0.1 * Math.abs(Math.sin(f / 2 + j)) : 0), z], { ...turn([63.4, z], [50, z]), ...(up ? { armL: "up", armR: "up", expr: "laugh" } : { armL: j % 3 ? "hang" : "chin", expr: "nervous" }) }); }
        flashes(in_ ? 40 : 14, 60, 0, 60);
        if (in_) this.conf(st, f, 50, 6, -2, 30, 16);
        break;
      }
      case 2: { // the old ball drops into Juan's hands; the two of them, and then the whole back room
        const got = a + 8, kd = ramp(f, a, got), wide = f >= B.tras - 4;
        G(JUAN, 5, [BX - 0.46, 0, -1.95], { facing: 0, expr: f < got ? "shock" : wide ? "grin" : "laugh", armL: "front", armR: "front", look: wide ? 0 : 0.3, headTilt: f < got ? -8 : 0 });
        G(CARLOS, 6, [BX + 0.5, 0, -1.95], { facing: 0, expr: f < got + 4 ? "shock" : wide ? "smile" : "laugh", armR: wide ? "point" : "front", holdR: wide ? undefined : "scissors", armL: wide ? "hip" : "hang", look: wide ? 0 : -0.5 });
        oldBall(f < got ? [BX - 0.46, 3.1 - 1.98 * kd * kd, -1.86] : [BX - 0.46, 1.12 + 0.012 * Math.sin(f * 0.2), -1.86], 0.3, f < got ? f * 0.6 : 0.3);
        burst(got, [BX - 0.42, 1.25, -1.8], 0.9);
        if (wide) spark([BX + 1.5, 2.3 + 0.1 * Math.sin(f * 0.2), -1.9], 0.1 * pop(B.tras, 9));
        break;
      }
      case 3: { // Madrid, 1902: the street
        walkers(SX - 70, SX + 118); cabs();
        standers([[SX - 20, -4.6, 0], [SX - 18.8, -4.2, 1], [SX + 6, 4.8, 2], [SX + 7.2, 5.2, 4], [SX + 30, -4.4, 6], [SX + 31.3, -4.9, 7], [SX + 52, 5, 3], [SX + 74, -4.6, 8], [SX + 75.2, -5, 10]], [SX - 40, 0]);
        break;
      }
      case 4: { // a ball flies in from nowhere and takes the gentleman's hat off
        const t0 = a + 16, t1 = a + 30, k = ramp(f, t0, t1), hitd = f >= t1, k2 = ramp(f, t1, t1 + 22), gx = SX - 20.6, lx = SX - 19.4, z = 9.7;
        G(hitd ? BARE(0) : TOWN(0), 5, [gx, 0.16, z], hitd ? { facing: 0, expr: f < t1 + 14 ? "shock" : "stern", armL: f < t1 + 14 ? "up" : "hip", armR: f > t1 + 14 ? "up" : "hang", holdR: "cane", headTilt: f < t1 + 8 ? -10 : 0 } : { facing: 0, expr: "smile", armR: "hang", holdR: "cane", armL: "hip", look: 0.6 });
        G(TOWN(1), 6, [lx, 0.16, z], hitd ? { facing: 0, expr: "laugh", armR: "mouth", armL: "up", holdL: "brolly", look: -1 } : { facing: 0, expr: "smile", armL: "up", holdL: "brolly", armR: "hang", look: -0.6 });
        if (f >= t0 && !hitd) oldBall([lerp(SX - 23.4, gx, k), 0.6 + 1.55 * k + 0.5 * Math.sin(Math.PI * k), lerp(6.4, z + 0.05, k)], 0.28);
        if (hitd) { oldBall([gx + 2.6 * k2, 2.15 - 1.9 * k2 * k2 + 0.4 * Math.abs(Math.sin(k2 * 7)) * (1 - k2), z - 1.2 * k2], 0.28); const kh = ramp(f, t1, t1 + 20); K("tophat", 200, 200, fxTopHat, [gx - 0.55 * kh, 2.25 + 0.75 * Math.sin(Math.PI * Math.min(1, kh * 1.05)) - 1.9 * kh * kh * kh, z + 0.25], 0.46, 0.46, { rot: -kh * 6 }); }
        burst(t1, [gx, 2.15, z - 0.05], 1.1);
        { const dk = Math.floor(f / 3) % 2, dx = SX - 22.2 + 0.085 * (f - t1 - 4); if (f > t1 + 4) K(`dog|${dk}`, 200, 140, (p) => fxDog(p, dk), [dx, 0.4 + 0.04 * dk, 8.0], 0.8, 0.56); }
        break;
      }
      case 5: case 6: { // the waste ground: students after a ball, the bullring over them
        onlookers(id === 6);
        steam([FX + 34, 8.3, -30.8], 5, 6, [3, 0, 0.5], 0.8, 3.2, true, 0.2);
        G(KEEP, 40, [FX + 33.3, 0, -26.2], { ...turn([FX + 33.3, -26.2], [FX, 0]), armL: "hip", armR: "front", holdR: "cup" });
        if (id === 5) {
          const bx = FX + 9 * Math.sin(f * 0.035), bz = 6 * Math.cos(f * 0.027), H: number[][] = [[-22, -6], [-14, 8], [-9, -9], [-3, 3], [4, -6], [9, 9], [14, -2], [20, 6], [24, -9], [-27, 0], [27, 1]];
          H.forEach(([x, z], i) => { const px = FX + x + (bx - FX - x) * 0.22, pz = z + (bz - z) * 0.22; G(STU(i), 10 + i, [px, hop(i, 0.05, 2), pz], { legs: "run", phase: f * 0.32 + i, ...turn([px, pz], [bx, bz]), armL: "front", armR: "front", expr: i % 2 ? "grin" : "stern" }); if ((f + i * 5) % 16 < 8) dust(px, 0, pz + 0.3, f + i * 5, 0.5); });
          oldBall([bx, 0.14 + 0.5 * Math.abs(Math.sin(f * 0.21)), bz], 0.3);
          { const dk = Math.floor(f / 3) % 2; K(`dog|${dk}`, 200, 140, (p) => fxDog(p, dk), [bx - 3.2, 0.42, bz + 2.5], 0.8, 0.56); }
        } else {
          const x = dribX(f), d = x - (FX - 15);
          G(STU(0), 10, [x, hop(0, 0.06, 2), 1.2], { legs: "run", phase: d / 0.55, ...turn([x, 1.2], [x + 5, 1.2]), expr: "grin", armL: "front", armR: "reach", sweat: 1 });
          G(STU(3), 13, [x - 1.45, hop(1, 0.06, 2), 0.1], { legs: "run", phase: d / 0.55 + 0.5, ...turn([x, 0.1], [x + 5, 0.1]), expr: "pained", armL: "reach", armR: "reach", sweat: 2 });
          const cx = FX - 1.6 - 0.035 * u; G(STU(5), 15, [cx, hop(2, 0.05, 2), -0.6], { legs: "run", phase: u * 0.3, ...turn([cx, -0.6], [cx - 5, -0.6]), expr: "stern", armL: "front", armR: "front" });
          oldBall([x + 0.62 + 0.12 * Math.sin(u * 0.6), 0.14 + 0.16 * Math.abs(Math.sin(u * 0.6)), 1.45], 0.3);
          for (const [dx, dz, s] of [[-0.5, 1.5, 0], [-1.9, 0.4, 7]]) dust(x + dx, 0, dz, u + s, 0.6);
          ([[-22, -7], [-12, -11], [8, -9], [16, -5], [24, -10]] as number[][]).forEach(([hx, hz], i) => G(STU(6 + i), 20 + i, [FX + hx + 0.02 * u, hop(i + 4, 0.04, 2), hz], { legs: "run", phase: u * 0.3 + i, ...turn([FX + hx, hz], [x, 1]), armL: "front", armR: "front" }));
        }
        break;
      }
      case 7: { // out of the tavern, pulling on their shirts; the landlord in his doorway
        const tx = FX + 31, tz = -27, T: number[][] = [[-0.85, 3.2], [0.85, 3.4]];
        T.forEach(([dx, dz], i) => { const t0 = a + 2 + i * 13, k = smooth(ramp(f, t0, t0 + 15)); if (f < t0) return; const x = tx + dx * k, z = tz - 0.2 + (dz + 0.2) * k, done = f >= t0 + 17;
          G(done ? MAD(i) : STU(i + 1), 10 + i, [x, done ? 0 : hop(i, 0.09, 2), z], done ? { facing: 0, expr: i === 1 ? "laugh" : "grin", armL: i === 0 ? "hip" : "up", armR: i === 0 ? "up" : "hip" } : { legs: "run", phase: u * 0.3 + i, facing: 0, expr: "pained", armL: "up", armR: "up", holdR: "shirt" });
          burst(t0 + 17, [x, 1.3, z + 0.1], 1.0); if (!done) dust(x, 0, z - 0.3, f - t0, 0.5); });
        if (f >= a + 24) { const kk = smooth(ramp(f, a + 24, a + 32)); G(KEEP, 40, [tx, 0, tz - 0.5 + 0.9 * kk], { facing: 0, expr: f > a + 34 ? "pained" : "stern", armR: "front", holdR: "cup", armL: "hip", headTilt: 6 * Math.sin(f * 0.3) }); }
        steam([tx + 3, 8.3, tz - 3.8], 5, 6, [3, 0, 0.5], 0.8, 3.2, true, 0.2);
        break;
      }
      case 8: { // the ball gives up
        const pf = a + 9, flat = f >= pf;
        G(STU(1), 11, [FX - 0.95, 0, -0.75], { facing: 1, expr: flat ? "shock" : "smile", armL: flat ? "up" : "hip", armR: flat ? "chin" : "hang", headTilt: 10 });
        G(STU(4), 14, [FX + 0.95, 0, -0.75], { facing: -1, expr: flat ? "pained" : "smile", armL: "hip", armR: flat ? "up" : "hip", headTilt: 10 });
        G(STU(2), 12, [FX, 0, -1.9], { facing: 0, expr: flat ? "dazed" : "grin", armL: flat ? "chin" : "hang", armR: "hang", headTilt: 12 });
        if (!flat) oldBall([FX, 0.14 + 0.45 * Math.abs(Math.cos((u / 9) * Math.PI * 0.5)) * (1 - u / 9), 0.15], 0.3, 0.2); else { K("flatball", 160, 90, fxFlatBall, [FX, 0.09, 0.15], 0.4, 0.22); for (let i = 0; i < 3; i++) dust(FX + (i - 1) * 0.25, 0, 0.2, (f - pf) * 1.2 + i * 2, 0.45); }
        onlookers();
        break;
      }
      case 9: { // the brothers come down the middle of the street
        const x = walkX(f), tip = f >= B.juan && f < B.juan + 14, hi = f >= B.carlos;
        G(JUAN_HAT, 5, [x, hop(0, 0.03, 4), -5.05], { legs: "walk", phase: u * 0.11, facing: 0, expr: tip ? "grin" : "smile", armR: tip ? "up" : "hang", armL: "hip" }, { roll: 0.02 * Math.sin(u * 0.22) });
        G(CARLOS_HAT, 6, [x + 0.3, hop(1, 0.03, 4), -3.95], { legs: "walk", phase: u * 0.11 + 0.5, facing: 0, expr: hi ? "grin" : "smile", armL: hi && f < B.carlos + 16 ? "wave" : "hang", armR: "hang", holdR: "cane" }, { roll: -0.02 * Math.sin(u * 0.22) });
        if (tip) spark([x - 0.2, 2.25, -5.0], 0.12 * pop(B.juan, 9)); if (hi && f < B.carlos + 14) spark([x + 0.6, 2.3, -3.9], 0.12 * pop(B.carlos, 9));
        walkers(x - 6, SX + 118); cabs();
        standers([[SX + 21, 4.6, 0], [SX + 22.3, 5.1, 1], [SX + 34, -7.9, 4], [SX + 44, 5.2, 6], [SX + 45.2, 4.7, 7], [SX + 60, -7.8, 3], [SX + 61.2, -8.2, 10]], [x, -4.5]);
        break;
      }
      case 10: { // the route on the map, drawn by a little train
        const N = 16, k = smooth(ramp(f, a + 3, b - 8));
        for (let i = 0; i <= N; i++) { if (i / N > k) break; const p = routeAt(i / N); K("dot", 64, 64, fxDot, [p[0], 0.805, p[2]], 0.045, 0.045, { flat: true }); }
        { const p = routeAt(k), p2 = routeAt(Math.min(1, k + 0.02)); K("loco", 200, 120, fxLoco, [p[0], 0.82, p[2] - 0.05], 0.2, 0.12, { flat: true, rot: Math.atan2(-(p2[2] - p[2]), p2[0] - p[0]) + Math.PI }); steam([p[0], 0.9, p[2] - 0.05], 2, 0.2, [0.1, 0, 0], 0.03, 0.09, false, 0.3); }
        if (k >= 1) { const m = mapPt(MAP_MAD); spark([m[0], 0.9, m[2]], 0.09 * pop(b - 8, 8)); }
        break;
      }
      case 11: { // the shop front: the brothers at their door
        G(JUAN, 5, [SX - 1.2, 0.16, -11.0], { facing: 0, expr: "grin", armL: "hip", armR: "hip" });
        G(CARLOS, 6, [SX + 1.2, 0.16, -11.0], { facing: 0, expr: "smile", armR: Math.sin(f * 0.3) > 0 ? "wave" : "up", armL: "hip" });
        { const lx = SX - 2.9 - 0.04 * u; G(TOWN(4), 7, [lx, 0.16, -10.2 + 0.006 * u], { legs: "walk", phase: u * 0.1, ...turn([lx, -10.2], [lx - 3, -10.2]), expr: "smile", armR: "hang", holdR: "bag", armL: "up", holdL: "brolly" }); }
        G(TOWN(14), 8, [SX + 4.6, 0.16, -10.2], { back: true, armL: "chin" }); G(TOWN(13), 9, [SX - 4.6, 0.16, -10.0], { back: true, armR: "point" });
        walkers(SX - 30, SX + 30, (x, z) => z > 0 || Math.abs(x - SX) < 6.5);
        { const ck = Math.floor(f / 4) % 2, cx = SX - 16 + 0.07 * u; if (u > 30) K(`carr|${ck}`, 760, 380, (p) => fxCarriage(p, ck), [cx - 6, 1.42, -6.2], 5.6, 2.8); }
        break;
      }
      case 12: case 13: { // the back room: the paper is signed, and the club exists
        const up = id === 13 && f >= a + 4, P: [Char, number, number, number][] = [[STU(1), -0.98, -2.0, 0], [JUAN, 0, -1.95, 0], [CARLOS, 0.98, -2.0, 0], [STU(0), -2.3, -0.95, 1], [STU(3), 2.3, -0.75, -1]];
        P.forEach(([ch, x, z, fc], i) => { const me = ch === JUAN, car = ch === CARLOS, hp = up ? hop(i, 0.07, 2) : 0;
          G(ch, 20 + i, [BX + x, hp, z], up ? { facing: fc as 0 | 1 | -1, expr: i % 2 ? "laugh" : "grin", armL: me ? "hip" : "up", armR: car ? "up" : "up", holdR: me ? "paper" : undefined }
            : { facing: fc as 0 | 1 | -1, expr: me ? "stern" : i % 2 ? "smile" : "nervous", armR: me ? "low" : car ? "chin" : "hang", armL: me ? "front" : i === 0 ? "hip" : "hang", headTilt: me ? 12 : 6, look: fc ? 0 : x < -0.1 ? 0.6 : x > 0.1 ? -0.6 : 0 }); });

        if (!up) K("quill", 140, 200, fxQuill, [BX + 0.1 + 0.03 * Math.sin(f * 0.9), 1.02, -0.74], 0.16, 0.23, { rot: 0.1 * Math.sin(f * 0.9) });
        if (up) { oldBall([BX + 1.42, 2.28 + hop(2, 0.07, 2), -1.98], 0.3, 0.3); spark([BX, 2.35, -1.9], 0.2 * pop(a + 4, 9)); spark([BX + 1.4, 2.6, -1.9], 0.12); this.conf(st, f, BX, 1.2, -1.4, 26, 5); }
        else oldBall([BX + 0.75, 0.93, -0.55], 0.28, 0.3);
        break;
      }
      case 14: { // the bolt of white runs out along the counter; and there he stands, all in white
        const done = f >= B.blanco + 2;
        G(CARLOS_SHOP, 6, [IX - 2.85, 0, -2.6], { facing: 0, expr: u > 6 ? "grin" : "smile", armR: u > 4 ? "point" : "front", armL: "hip", look: 0.6 });
        G(done ? MAD(0) : STU(1), 10, [IX + 3.4, 0.24, 0.3], done ? { facing: 0, expr: "grin", armL: "hip", armR: "hip" } : { facing: 0, expr: "nervous", armL: "reach", armR: "reach" });
        G(JUAN, 5, [IX + 2.45, 0, 0.6], { facing: 1, expr: done ? "grin" : "stern", armR: done ? "chin" : "reach", armL: "hip", look: 1 });
        burst(B.blanco + 2, [IX + 3.4, 1.5, 0.4], 1.6); if (done) spark([IX + 3.9, 2.2, 0.35], 0.12);
        break;
      }
      case 15: { // London: the gentlemen sit for their photograph
        const fl = B.londres + 34, after = f >= fl;
        ([[-1.2, -6.0, 0], [0, -6.1, 1], [1.2, -6.0, 2]] as number[][]).forEach(([x, z, i]) => G(GENT(i), 10 + i, [LX + x, 0, z], { facing: 0, expr: after ? (i === 1 ? "dazed" : "nervous") : "stern", armL: i === 1 ? "front" : "hip", holdL: i === 1 ? "cup" : undefined, armR: "hip", headTilt: after ? 6 : 0 }));
        ([[-0.6, -4.9, 3], [0.6, -4.9, 4]] as number[][]).forEach(([x, z, i]) => G(GENT(i), 10 + i, [LX + x, 0, z], { legs: "kneel", facing: 0, expr: after ? "dazed" : "stern", armL: "hip", armR: "hip" }));
        oldBall([LX, 0.14, -4.3], 0.3, 0.25);
        if (f >= fl - 1 && f < fl + 12) { const t = clamp01((f - fl + 1) / 13); K(`poof|${Math.round(t * 12)}`, 256, 256, (p) => fxPoof(p, t), [LX + 0.75, 0.75 + 0.4 * t, -1.6], 0.8, 0.8, { soft: true, glow: 2 }); }
        break;
      }
      case 16: { // the fan who cannot believe it
        const p = seat(0, 1.3), wow = f >= a + 16;
        block({ cheer: a - 30, skip: [0.45, 1.3, 2.1] });
        G(DOUBT, 5, p, { legs: "sit", facing: 0, expr: wow ? "shock" : "nervous", armL: wow ? "up" : "chin", armR: wow ? "up" : "hang", headTilt: wow ? -6 : 8 }, { shadow: false });
        question([p[0] + 0.08, p[1] + 1.52, p[2]], a + 6);
        flashes(16, 0, 55, 60, 6, 30);
        break;
      }
      case 17: { elevens(); rails({ cheer: true }); royal(); G(JUAN_HAT, 5, [HPX - 1.3, 0, -(RZ - 1.6)], { back: true, armR: "wave" }); G(CARLOS_HAT, 6, [HPX + 1.3, 0, -(RZ - 1.6)], { back: true, armL: "up" });
        for (let i = 0; i < 3; i++) { const ck = Math.floor(f / 4 + i) % 2; K(`carr|${ck}`, 760, 380, (p) => fxCarriage(p, ck), [HPX - 40 + i * 30 + 0.03 * u, 1.42, RZ + 8.6], 5.6, 2.8); }
        break; }
      case 18: { // the king in his box; the brothers and the cup they have had made
        royal(); rails({ south: false });
        G(JUAN_HAT, 5, [HPX - 0.64, 0, -(RZ - 2.6)], { facing: 0, expr: "grin", armL: "hip", armR: "hang" });
        G(CARLOS_HAT, 6, [HPX + 0.64, 0, -(RZ - 2.6)], { facing: 0, expr: "laugh", armL: "up", holdL: "trophy", armR: "hip" }, { roll: 0.03 * Math.sin(f * 0.3) });
        spark([HPX + 1.1, 2.2, -(RZ - 2.6)], 0.13 * (0.7 + 0.3 * Math.sin(f * 0.5))); this.conf(st, f, HPX, 3, -(RZ + 2), 22, 9);
        break;
      }
      case 19: { // the two sides, face to face
        const bob = 5 * Math.sin(f * 0.9);
        for (let i = 0; i < 5; i++) { G(MAD(i), 60 + i, [HPX - 1.05 - 1.02 * i, 0, -1.15 * i], { facing: 1, expr: i === 0 ? "grin" : i % 2 ? "stern" : "smile", armR: i === 0 ? [70, -10 + bob, -2] : "hip", armL: i === 0 ? "hip" : i % 2 ? "hip" : "hang", look: 1 });
          G(i === 0 ? FOUNDER : BAR(i), 80 + i, [HPX + 1.05 + 1.02 * i, 0, -1.15 * i], { facing: -1, expr: i === 0 ? "grin" : i % 2 ? "smile" : "stern", armL: i === 0 ? [70, -10 + bob, -2] : "hip", armR: i === 0 ? "hip" : i % 2 ? "hang" : "hip", look: -1 }); }
        G(REF, 58, [HPX, 0, -3.2], { facing: 0, expr: "stern", armL: "front", armR: "front" }); oldBall([HPX, 1.06, -3.1], 0.3, 0.3);
        spark([HPX, 1.15, 0], 0.1); rails({ south: false }); royal(false);
        break;
      }
      case 20: { // one, two, three: seen from behind the Madrid net
        const gx = HPX - HL; let kz = 0, lean = 0, last = -1;
        GOALS.forEach((g, i) => { const t = a + g.t, k = ramp(f, t - 9, t), prev = i ? GOALS[i - 1].z * 0.6 : 0;
          if (f >= t - 9) { last = i; kz = lerp(prev, g.z * 0.6, smooth(ramp(f, t - 8, t - 1))); lean = (g.z > 0 ? -1 : 1) * 0.5 * smooth(ramp(f, t - 7, t)) * (1 - ramp(f, t + 5, t + 11)); }
          if (f >= t - 9 && f < t) oldBall([lerp(gx + 17, gx - 1.15, k), lerp(1.0, g.y, k) + 1.2 * Math.sin(Math.PI * k), lerp(-g.z * 2.5, g.z, k)], 0.3);
          if (f >= t) { const d = clamp01((f - t) / 9); oldBall([gx - 1.15 + 0.2 * d, g.y * (1 - d * d) + 0.14, g.z], 0.3, i); burst(t, [gx - 1.0, g.y + 0.1, g.z], 1.5); } });
        const beaten = f >= a + GOALS[2].t + 7;
        G(KEEPER, 59, [gx + 0.9, beaten ? 0 : 0.22 * Math.abs(lean), kz], beaten ? { back: true, legs: "kneel", armL: "chin", armR: "chin", headTilt: 12 } : Math.abs(lean) > 0.05 ? { back: true, armL: "up", armR: "up" } : { back: true, armL: "low", armR: "low" }, { roll: lean });
        if (beaten) this.stars(st, gx + 0.9, 1.75, kz + 0.1, f);
        const joy = last >= 0 && f >= a + GOALS[last].t;
        ([[9, -2.3, 9], [10.5, 2.5, 6], [13.5, 0.2, 7]] as number[][]).forEach(([x, z, i], n) => G(i === 9 ? FOUNDER : BAR(i), 80 + i, [gx + x, joy ? hop(n, 0.12, 2) : 0, z], { facing: 0, expr: joy ? "laugh" : "grin", armL: joy ? "up" : "hip", armR: joy ? "up" : "hang" }));
        ([[5.0, -3.1, 0], [5.8, 3.2, 1]] as number[][]).forEach(([x, z, i]) => G(MAD(i), 60 + i, [gx + x, 0, z], { facing: 0, expr: joy ? "pained" : "stern", armL: joy ? "up" : "low", armR: joy ? "chin" : "low", headTilt: joy ? 10 : 0 }));
        rails({ cheer: joy });
        break;
      }
      case 21: case 22: { // the scorer: fair moustache, arms wide... and something Swiss about him
        const p = founderAt(id === 21 ? f : SHOTS[20].b), run = id === 21 && f < a + 58, sw = id === 22 && f >= a + 6;
        G(FOUNDER, 89, [p[0], run ? hop(0, 0.07, 2) : 0, p[2]], run ? { legs: "run", phase: u * 0.3, facing: 0, expr: "laugh", armL: "reach", armR: "reach" } : { facing: 0, expr: sw ? "laugh" : "grin", armL: "hip", armR: sw ? "up" : "hip", headTilt: sw ? -8 : 0 });
        (id === 21 ? [[-2.3, -2.6, 6], [2.2, -3.1, 7]] : [[-1.05, -2.0, 6], [1.05, -2.2, 7]] as number[][]).forEach(([dx, dz, i], n) => G(BAR(i), 80 + i, [p[0] + dx, hop(n + 1, 0.07, 2), p[2] + dz], run ? { legs: "run", phase: u * 0.3 + n * 0.4, facing: 0, expr: "laugh", armL: "up", armR: "up" } : { facing: 0, expr: "laugh", armL: "up", armR: n % 2 ? "up" : "wave" }));
        G(MAD(1), 61, [HPX - 37, 0, -15], { facing: 0, expr: "pained", armL: "hip", armR: "hip", headTilt: 14 }); G(MAD(3), 63, [HPX - 25, 0, -17], { facing: 0, expr: "dazed", armL: "chin", armR: "hang", headTilt: 12 }); G(MAD(4), 64, [HPX - 33, 0, -22], { legs: "kneel", facing: 0, expr: "pained", armL: "up", armR: "up" });
        rails({ cheer: true, south: false }); royal(false);
        if (sw) { const k = pop(a + 6, 9); K("alps", 512, 300, fxAlps, [p[0], 1.4 + 1.5 * k, p[2] - 6.5], 9 * k, 5.3 * k); K("cheese", 160, 130, fxCheese, [p[0] + 0.44, 1.7, p[2] + 0.05], 0.34 * k, 0.28 * k, { rot: 0.2 * Math.sin(f * 0.3) }); K("bell", 120, 150, fxBell, [p[0] + 0.02, 1.02, p[2] + 0.06], 0.2 * k, 0.25 * k, { rot: 0.25 * Math.sin(f * 0.5) });
          for (let i = 0; i < 4; i++) { const tt = ((f * 0.025 + i * 0.25) % 1), kn = i % 2; K(`note|${kn}|${i % 3}`, 240, 240, (pp) => fxNote(pp, kn, ["#23202a", "#b8362e", "#1f2f5c"][i % 3]), [p[0] - 0.7 + 0.4 * Math.sin(tt * 5 + i) - 0.5 * tt, 1.9 + 1.1 * tt, p[2] + 0.1], 0.22 + 0.1 * tt, 0.22 + 0.1 * tt, { rot: 0.3 * Math.sin(tt * 6 + i) }); } }
        break;
      }
      case 23: { // the long table of cups
        for (let i = 0; i < 15; i++) { const x = -9.8 + i * 1.4; K("eurocup", 200, 300, fxEuroCup, [x, 1.13, 0], 0.76, 1.14); if ((i + Math.floor(f / 4)) % 4 === 0) spark([x - 0.14, 1.5, 0.05], 0.16); }
        for (let i = 0; i < 12; i++) { const x = -9.9 + i * 1.8, up = (i + Math.floor(f / 5)) % 3 !== 0; G(STAR(i % 4 + (i > 3 ? 4 : 0)), 30 + i, [x, 0.32 + (up ? hop(i, 0.09, 2) : 0), -2.05], { facing: 0, expr: up ? "laugh" : "grin", armL: up ? "up" : "hip", armR: up ? "up" : "wave" }); }
        for (let i = 0; i < 56; i++) { const x = -32 + i * 1.15, up = (i + Math.floor(f / 4)) % 3 !== 0; crowdFig(FAN(i % 37), 100 + i, [x, 1.25 + (up ? 0.1 * Math.abs(Math.sin(f / 2 + i)) : 0), -43.6 - 0.006 * x * x], { facing: 0, ...(up ? { armL: "up", armR: "up", expr: "laugh" } : { armR: "wave", expr: "grin" }) }); }
        flashes(46, 0, -55, 70); this.conf(st, f, lerp(-6, 8, u / (b - a)), 6, 0, 46, 14);
        break;
      }
      default: { // the two founders in the stand, a hundred and some years on
        const sh = f >= B.clasico, yes = f >= B.clasico + 18, pj = seat(0, -0.45), pc = seat(0, 0.45), pd = seat(0, 1.3);
        block({ cheer: yes ? B.clasico + 18 : undefined, skip: [-0.45, 0.45, 1.3, 2.1] });
        G(JUAN_HAT, 5, [pj[0], pj[1] + (yes ? hop(0, 0.05, 2) : 0), pj[2]], { legs: "sit", facing: 0, expr: yes ? "laugh" : sh ? "grin" : "shock", armL: yes ? "up" : sh ? "up" : "chin", armR: yes ? "up" : sh ? "up" : "hang", look: yes ? 0 : sh ? 0.8 : -0.4, headTilt: sh && !yes ? -6 : 0 }, { shadow: false });
        G(CARLOS_HAT, 6, [pc[0], pc[1] + (yes ? hop(1, 0.05, 2) : 0), pc[2]], { legs: "sit", facing: 0, expr: yes ? "laugh" : sh ? "smile" : "shock", armL: yes ? "up" : sh ? "up" : "hang", armR: yes ? "up" : sh ? "up" : "point", look: yes ? 0 : sh ? -0.8 : 0.4 }, { shadow: false });
        G(DOUBT, 7, [pd[0], pd[1] + (yes ? hop(2, 0.05, 2) : 0), pd[2]], { legs: "sit", facing: 0, expr: yes ? "laugh" : f > a + 20 ? "shock" : "smile", armL: yes ? "up" : f > a + 20 ? "chin" : "hang", armR: yes ? "up" : "hang", look: yes ? 0 : -1 }, { shadow: false });
        if (!yes) question([pd[0] + 0.08, pd[1] + 1.52, pd[2]], a + 22);
        flashes(18, 0, 55, 60, 6, 30); if (yes) this.conf(st, f, 0.3, pj[1] + 3.5, 44.6, 40, 6);
        break;
      }
    }
    void [spark, lerp, smooth, b, NET, question, dust, IX, LX, steam, MAP_MAD];
    return st;
  }
  private conf(st: Stage, f: number, cx: number, cy: number, cz: number, n = 46, spread = 5) {
    const cols = ["#fbfbf6", "#f6c419", "#1f2f5c", "#6a4c9a", "#fbfbf6"];
    for (let i = 0; i < n; i++) { const t = ((f * 0.012 + hs(i, 3)) % 1), x = cx + (hs(i, 1) - 0.5) * spread + 0.3 * Math.sin(f * 0.1 + i), y = cy + 3.2 - t * 9, z = cz + (hs(i, 2) - 0.5) * spread * 0.7; if (y < 0.05) continue;
      this.card(st, `conf|${cols[i % 5]}`, 64, 64, (p) => fxConfetti(p, cols[i % 5]), [x, y, z], 0.16 + spread * 0.012, 0.16 + spread * 0.012, { rot: f * 0.2 + i }); }
  }
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
    this.hemi.color.set(L.sky); this.hemi.groundColor.set(L.ground); this.hemi.intensity = L.hemiI;
    this.sun.color.set(L.sunCol); this.sun.intensity = L.sunI;
    let Rr = THREE.MathUtils.clamp(dist * 1.15 + 7, 14, 95);
    if (s.light === "golden") Rr = Math.max(Rr, 30);
    if (id === 3 || id === 5 || id === 17 || id === 1 || id === 23 || id === 11) Rr = 95;
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
    untone(s.night ? "#141c4a" : s.fog ? "#b9c4d8" : L.fog, this.fog.color);
    this.fog.near = s.fog ? s.fog[0] : s.night ? 120 : 90; this.fog.far = s.fog ? s.fog[1] : s.night ? 700 : 900;
    const night = !!s.night, R = this.refs;
    for (const lm of LAMP_MATS) { const h = (lm.userData as { hot: [number, number, number] }).hot, k = night || s.indoor ? 1 : s.fog ? 0.9 : s.light === "golden" ? 0.6 : 0.3; lm.color.setRGB(h[0] * k, h[1] * k, h[2] * k); }
    for (const tn of R.tints) tn.m.color.setRGB(...tn[s.light]);
    R.stadium.visible = s.place === "stadium"; R.street.visible = s.place === "street"; R.shop.visible = s.place === "shop"; R.field.visible = s.place === "field"; R.london.visible = s.place === "london"; R.hipo.visible = s.place === "hipo";
    R.cups.visible = id === 23;
    R.tram.position.set(tramX(id, f), 0, 1.6);
    R.cloth.scale.x = id === 14 ? 0.02 + 2.3 * smooth(ramp(f, s.a + 4, s.a + 20)) : 0.02;
    R.deed.visible = !(id === 13 && f >= s.a + 4) && id !== 2;
    R.flags.forEach((g, i) => { const ud = g.userData as { b?: number }; if (ud.b === undefined) ud.b = g.rotation.y; g.rotation.y = ud.b + 0.3 * Math.sin(f * 0.11 + i * 1.3); });
    R.crowns.forEach((g, i) => { g.rotation.x = 0.14 * Math.sin(f * 0.08 + i * 1.1); });
    const roar = id === 1 || id === 23 || id === 20 || id === 21;
    for (const ct of R.crowds) ct.offset.y = roar ? 0.012 * Math.sin(f * 1.1) : 0.004 * Math.sin(f * 0.4);
    this.starPts.visible = night; this.starPts.position.copy(cam.position);
    const lamps = lampsAt(id, f);
    this.lamps.forEach((l, i) => { const d = lamps[i]; if (d) { l.position.set(...d.p); l.color.set(d.c); l.intensity = d.i; l.distance = d.d; } else l.intensity = 0; });
    scene.fog = this.fog; scene.background = null;
    this.sunDisc.visible = s.light === "golden";
    this.sunDisc.position.copy(cam.position).addScaledVector(this.sunDir, 900); this.sunDisc.scale.setScalar(2 * 900 * Math.tan(THREE.MathUtils.degToRad(1.7)));
    this.clouds.forEach((m, i) => {
      const a = (i / 10) * Math.PI * 2 + 0.3, d = 760 + (i % 3) * 60, w = 150 + (i % 4) * 36;
      m.position.set(cam.position.x + Math.cos(a + f * 0.00012) * d, 150 + (i % 4) * 46, cam.position.z + Math.sin(a + f * 0.00012) * d); m.scale.set(w, w / 2, 1);
      m.lookAt(cam.position.x, m.position.y, cam.position.z); (m.material as THREE.MeshBasicMaterial).map = this.cloudMaps[s.light === "golden" ? "golden" : "day"][i % 4]; m.visible = !night && !s.indoor;
      (m.material as THREE.MeshBasicMaterial).color.setScalar(s.fog ? 0.9 : 1.1);
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
