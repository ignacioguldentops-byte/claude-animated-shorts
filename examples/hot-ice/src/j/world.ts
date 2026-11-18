// The world of "Hielo caliente": the valley above Calgary (hill, ice track, finish, snowy square) and the island (beach, barracks,
// village road). Same look modules as the earlier shorts (two-tone world, lit cards, ink, lens, grade) plus real point lights.
// update(id, f, cam, scene) poses everything for shot id at frame f (pure function of id + f).
import * as THREE from "three";
import { Pool, Actor, Fx } from "./pool";
import { NOINK } from "./ink";
import { TONE, CHAR, untone } from "./shade";
import { LIGHTS, LOOK, LightK } from "./lights";
import { ctex, cloudHD } from "./paint";
import { Pen, figure, Char, Pose, fxContact, fxPuff, fxStars, fxNote } from "./toon";
import { fxConfetti, fxQ, fxFlash } from "./props";
import { fxSnow, fxFlake, fxAurora, fxThought, fxIce, fxPuddle, fxBreath, fxCoinJ, fxBang, fxFire, fxSun, fxGull, fxSail, fxOuch } from "./gearj";
import { SHOTS, B, V3, camAt, smooth, clamp01, lerp, ramp, lampsAt, sledOf, sledWorld, SledState, S0, SF, SK, SSTOP } from "./story";
import { buildCalgary, buildIsland, buildSled, buildCart, Refs, LAMP_MATS, JX, RX, FIN_X, TOWN, ry } from "./setsj";
import { trackAt, beside, terrain, sNear } from "./track";
import { racer, racerBare, soldier, SINGER, winter, BROTHER_FAN, BIZ1, BIZ2, TOURIST, sprinter, cartKid, islander, fan, rival } from "./cast";
const CKEY = new WeakMap<Char, string>();
const CC = new Map<string, Char>();
/** cast builders return fresh objects: memoise so cards share textures */
const memo = (k: string, make: () => Char) => { let c = CC.get(k); if (!c) { c = make(); CC.set(k, c); } return c; };
const RACER = (i: number) => memo("r" + i, () => racer(i)), RBARE = (i: number) => memo("rb" + i, () => racerBare(i)), SOLD = (i: number) => memo("s" + i, () => soldier(i)), WINT = (i: number) => memo("w" + i, () => winter(i));
const SPR = (i: number) => memo("sp" + i, () => sprinter(i)), CKID = (i: number) => memo("ck" + i, () => cartKid(i)), ISL = (i: number) => memo("is" + i, () => islander(i)), FAN = (i: number) => memo("f" + i, () => fan(i)), RIV = (i: number) => memo("rv" + i, () => rival(i));
const CREW = [0, 4, 1, 2]; // pilot, his brother, the two other soldiers (the singer is the reserve and watches)

// ---------------- staging types ----------------
type Place = { key: string; draw: (p: Pen) => void; x: number; y: number; z: number; scale: number; mirror?: boolean; roll?: number; faceUp?: boolean; sx?: number; sy?: number };
type FxPlace = { key: string; cw: number; ch: number; draw: (p: Pen) => void; x: number; y: number; z: number; w: number; h: number; flat?: boolean; fixed?: boolean; rot?: number; soft?: boolean; glow?: number; tint?: string };
type Stage = { places: Place[]; fx: FxPlace[] };
type W = { pos: THREE.Vector3; up: THREE.Vector3; fwd: THREE.Vector3; F?: ReturnType<typeof trackAt> };

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
const SL = Math.atan(0.2);

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
  private refs: Refs = { tints: [], waves: [], foams: [], crowns: [], flags: [], crowds: [], carts: [], sleds: [], boat: new THREE.Group(), calgary: new THREE.Group(), island: new THREE.Group() };
  private starPts!: THREE.Points;
  private auroras: THREE.Mesh[] = [];
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
    buildCalgary(R, this.refs); buildIsland(R, this.refs);
    for (let i = 0; i < 2; i++) { const s = buildSled(i); s.matrixAutoUpdate = false; this.refs.sleds.push(s); R.add(s); }
    for (let i = 0; i < 6; i++) { const c = buildCart(i); this.refs.carts.push(c); R.add(c); }
    for (let i = 0; i < 6; i++) { const l = new THREE.PointLight("#ffffff", 0, 8, 2); this.lamps.push(l); R.add(l); }
    { const n = 500, pos = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const a = hs(i, 1) * Math.PI * 2, e = 0.08 + hs(i, 2) * 1.3, r = 1000; pos[i * 3] = r * Math.cos(a) * Math.cos(e); pos[i * 3 + 1] = r * Math.sin(e); pos[i * 3 + 2] = r * Math.sin(a) * Math.cos(e); }
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      this.starPts = new THREE.Points(g, new THREE.PointsMaterial({ color: new THREE.Color(2.2, 2.2, 2.0), size: 2.6, sizeAttenuation: false, fog: false, depthWrite: false })); this.starPts.layers.set(NOINK); this.starPts.frustumCulled = false; R.add(this.starPts); }
    for (let i = 0; i < 7; i++) { const k = i % 3, tex = ctex("aurora" + k, 512, 256, (g) => fxAurora(new Pen(g), k));
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending }));
      m.layers.set(NOINK); m.renderOrder = -0.5; m.frustumCulled = false; this.auroras.push(m); R.add(m); }
    for (let i = 0; i < 96; i++) this.actors.push(new Actor(R));
    for (let i = 0; i < 340; i++) this.fxs.push(new Fx(R));
  }

  // ---------------- staging ----------------
  private fig(st: Stage, ch: Char, seed: number, pos: V3, pose: Pose = {}, o: { scale?: number; roll?: number; sx?: number; sy?: number; shadow?: boolean; f?: number } = {}) {
    let ck = CKEY.get(ch); if (!ck) { ck = JSON.stringify(ch); CKEY.set(ch, ck); }
    const light = this.lightAngle, full: Pose = { blink: o.f !== undefined ? lidAt(o.f, seed) : 0, ...pose, light, seed };
    st.places.push({ key: `G|${ck}|${fkey(full)}`, x: pos[0], y: pos[1], z: pos[2], scale: o.scale ?? 1, roll: o.roll, sx: o.sx, sy: o.sy, draw: (p) => figure(p, ch, full) });
    if (o.shadow !== false) this.contact(st, pos[0], pos[2], (o.scale ?? 1) * (pose.legs === "kneel" ? 1.5 : 1), pos[1]);
  }
  private card(st: Stage, key: string, cw: number, chh: number, draw: (p: Pen) => void, pos: V3, w: number, h: number, o: Partial<FxPlace> = {}) {
    st.fx.push({ key, cw, ch: chh, draw, x: pos[0], y: pos[1], z: pos[2], w, h, ...o });
  }
  private conf(st: Stage, f: number, cx: number, cy: number, cz: number, n = 46, spread = 5) {
    const cols = ["#1f8a3a", "#f6c419", "#23202a", "#f6c419", "#fbfbf6"];
    for (let i = 0; i < n; i++) { const t = ((f * 0.012 + hs(i, 3)) % 1), x = cx + (hs(i, 1) - 0.5) * spread + 0.3 * Math.sin(f * 0.1 + i), y = cy + 3.2 - t * 4.2, z = cz + (hs(i, 2) - 0.5) * spread * 0.7;
      if (y > cy - 0.9) this.card(st, `conf|${cols[i % 5]}`, 64, 64, (p) => fxConfetti(p, cols[i % 5]), [x, y, z], 0.09, 0.09, { rot: f * 0.2 + i }); }
  }
  private setSled(i: number, w: W) {
    const G = this.refs.sleds[i], x = new THREE.Vector3().crossVectors(w.up, w.fwd).normalize(), y = new THREE.Vector3().crossVectors(w.fwd, x).normalize();
    G.matrix.makeBasis(x, y, w.fwd).setPosition(w.pos); G.matrixWorldNeedsUpdate = true; G.visible = true;
  }
  /** the sled with its four riders sitting in it */
  private riders(st: Stage, f: number, w: W, chars: Char[], seed0: number, pose: (i: number) => Pose, sled = 0) {
    this.setSled(sled, w);
    const side = w.fwd.dot(this.right), behind = w.fwd.dot(this.camF) > 0.55, facing = (side > 0.35 ? 1 : side < -0.35 ? -1 : 0) as 1 | 0 | -1;
    const ux = w.up.dot(this.right), uy = w.up.dot(this.camU) + 0.3, roll = Math.atan2(-ux, uy);
    [0.25, -0.3, -0.85, -1.4].forEach((z, i) => { const p = w.pos.clone().addScaledVector(w.fwd, z).addScaledVector(w.up, 0.06);
      this.fig(st, chars[i], seed0 + i, [p.x, p.y, p.z], { legs: "sit", facing, back: behind, armL: "front", armR: "front", ...pose(i) }, { roll, shadow: false, f }); });
  }

  private stage(id: number, f: number): Stage {
    const st: Stage = { places: [], fx: [] };
    const S = SHOTS[id - 1], a = S.a, b = S.b, u = f - a;
    const j = (x: number, y: number, z: number): V3 => [JX + x, y, z];
    const r = (x: number, y: number, z: number): V3 => [RX + x, y + ry(z), z];
    const t = (x: number, y: number, z: number): V3 => [TOWN[0] + x, y, TOWN[1] + z];
    const hop = (i: number, amp = 0.1, sp = 3) => amp * Math.abs(Math.sin(f / sp + i * 1.7));
    const G = (ch: Char, seed: number, pos: V3, pose: Pose = {}, o: Parameters<World["fig"]>[5] = {}) => this.fig(st, ch, seed, pos, pose, { f, ...o });
    const K = (key: string, cw: number, chh: number, draw: (p: Pen) => void, pos: V3, w: number, h2: number, o: Partial<FxPlace> = {}) => this.card(st, key, cw, chh, draw, pos, w, h2, o);
    const spark = (p: V3, s: number) => this.spark(st, p[0], p[1], p[2], s, f);
    const pop = (f0: number, n = 8) => { const tt = clamp01((f - f0) / n); return f < f0 ? 0 : 1 + 0.35 * Math.sin(tt * Math.PI) * (1 - tt); };
    const v = (p: THREE.Vector3, dy = 0): V3 => [p.x, p.y + dy, p.z];
    const snow = (ctr: V3, k = 1, n = 70, spread = 9) => { for (let i = 0; i < n * k; i++) { const tt = (f * 0.011 * (0.7 + 0.6 * hs(i, 5)) + hs(i, 3)) % 1, s = 0.045 + 0.05 * hs(i, 4);
      K("snow", 64, 64, fxSnow, [ctr[0] + (hs(i, 1) - 0.5) * spread + 0.25 * Math.sin(f * 0.06 + i), ctr[1] + 4.4 - tt * 5, ctr[2] + (hs(i, 2) - 0.5) * spread * 0.8], s, s, { soft: true }); } };
    const aurora = () => undefined;
    const iceSpray = (w: W, s = 1) => { const tt = (f % 6) / 6, p = w.pos.clone().addScaledVector(w.fwd, -1.7).addScaledVector(w.up, 0.25); K(`ice|${f % 6}`, 300, 200, (pp) => fxIce(pp, tt), v(p), 1.5 * s, 1.0 * s); };
    const dust = (x: number, y: number, z: number, k: number, size = 0.7) => { const tt = (k % 16) / 16; K(`puff|${k % 16}`, 300, 260, (p) => fxPuff(p, tt), [x, y + 0.22 + tt * 0.2, z], size, size * 0.87, { soft: true }); };
    const flashes = (rate: number) => { for (let i = 0; i < 70; i++) { if (hs(i * 7.3 + Math.floor(f / 2) * 13.1, 5) > rate) continue; const k = hs(i, 2), sz = 0.5 + 0.5 * hs(i, 8); K("flash", 128, 128, fxFlash, [24 + hs(i, 1) * 50, 1.6 + k * 5.6, -19.5 - k * 8.4 + 0.2], sz, sz, { soft: true, glow: 4, rot: i }); } };
    const gulls = (c: V3) => { for (let i = 0; i < 3; i++) { const k = Math.floor((f + i * 5) / 7) % 2; K(`gull|${k}`, 160, 80, (p) => fxGull(p, k), [c[0] - 9 + ((f * 0.05 + i * 6.5) % 18), c[1] + i * 1.3 + 0.3 * Math.sin(f * 0.1 + i), c[2] - i * 6], 1.5, 0.75); } };
    const STRIDE = 0.283, CH = CREW.map(RACER);
    const sled0 = sledOf(id, f), w0: W | undefined = sled0 ? sledWorld(sled0) : undefined;
    switch (id) {
      case 1: { // HOOK: the sled comes down the hill flat out
        this.riders(st, f, w0!, CH, 5, (i) => ({ expr: i === 0 ? "stern" : i === 3 ? "laugh" : "grin" })); iceSpray(w0!, 1.2);
        aurora(); snow(this.camPos(4), 0.5);
        break;
      }
      case 2: { // the beach: sun, palms, a tourist with a drink... and one snowflake
        const land = B.flake + 26, t0 = a + 6, k = ramp(f, t0, land), landed = f >= land, melt = ramp(f, land + 8, land + 20);
        const nose: V3 = j(0.7, 1.2, 4.86), fl: V3 = [nose[0] + 0.5 * (1 - k) + 0.12 * Math.sin(f * 0.25) * (1 - k), nose[1] + 2.9 * (1 - k), nose[2]];
        G(TOURIST, 3, j(0.7, 0.08, 4.75), { legs: "sit", expr: landed ? (f > land + 18 ? "nervous" : "shock") : "smile_closed", armR: "front", holdR: "drink", armL: landed ? "chin" : "hip", look: 0, headTilt: landed ? -8 : 5 * Math.sin(f * 0.06) }, { shadow: false });
        if (f >= t0 && melt < 1) K("flake", 200, 200, fxFlake, fl, 0.2 * (1 - melt), 0.2 * (1 - melt), { rot: f * 0.12 * (1 - k) });
        if (landed) { spark([nose[0] + 0.12, nose[1] + 0.1, nose[2] + 0.02], 0.12 * pop(land, 10)); const kq = pop(land + 6, 9); K("q", 200, 250, fxQ, j(0.72, 2.02, 4.75), 0.3 * kq, 0.38 * kq, { rot: 0.1 * Math.sin(f * 0.2) }); }
        G(CKID(1), 31, j(-2.5, 0, 4.5), { legs: "kneel", expr: "smile", facing: -1, armL: "low", armR: "low" });
        G(ISL(4), 32, j(11, 0, 10.4), { expr: "smile", armR: "hip", armL: "hang" }); G(ISL(2), 33, j(-9.5 + 0.012 * u, hop(1, 0.05, 4), 0.2), { legs: "run", phase: u * 0.07, facing: 1, expr: "laugh" });
        K("sun", 256, 256, fxSun, j(-60, 110, -700), 190, 190, { soft: true, glow: 1.5 }); K("sail", 200, 200, fxSail, j(16 - 0.01 * u, 2.4, -110), 9, 9); K("sail", 200, 200, fxSail, j(-40, 1.6, -210), 7, 7); gulls(j(0, 6.5, -10));
        break;
      }
      case 3: { // the big curve: up the wall, far too high, in slow motion
        const sh = sled0!.shake ?? 0, w = { ...w0!, pos: w0!.pos.clone().add(new THREE.Vector3(0.03 * sh * Math.sin(f * 2.1), 0.03 * sh * Math.sin(f * 2.7), 0)) };
        this.riders(st, f, w, CH, 5, (i) => ({ expr: u > 34 + i * 4 ? "shock" : i === 0 ? "stern" : "grin", sweat: u > 50 ? 2 : 0 })); iceSpray(w, 1.1);
        if (u > 30) { const p = w.pos.clone().addScaledVector(w.fwd, 1.0); spark(v(p, 0.05), 0.3 + 0.1 * Math.sin(f)); spark(v(w.pos.clone().addScaledVector(w.fwd, -1.2), 0.05), 0.22); }
        const kb = pop(a + 56, 9); if (kb > 0) K("bang", 120, 260, fxBang, v(w.pos.clone().addScaledVector(w.up, 1.9), 0.2), 0.26 * kb, 0.56 * kb, { rot: 0.2 });
        aurora(); snow(this.camPos(5), 0.5);
        break;
      }
      case 4: case 5: case 6: { // the village road on race day
        const q0 = f - B.jam, cz = (i: number) => -58 + 0.38 * q0 * (1 - 0.03 * i) - [0, 2.2, 4.1, 6.5, 12.5, 16.5][i], cx = (i: number) => [-1.3, 0.3, 1.5, -0.5, 1.2, -1.0][i] + 0.25 * Math.sin(f * 0.13 + i * 2);
        for (let i = 0; i < 6; i++) { const z = cz(i), x = cx(i); if (z < -75 || z > 40) continue;
          const C = this.refs.carts[i]; C.visible = true; C.position.set(RX + x, ry(z), z); C.rotation.set(z < 0 ? SL : 0, 0.1 * Math.sin(f * 0.13 + i * 2 + 1.5), 0.02 * Math.sin(f * 0.9 + i));
          G(CKID(i), 50 + i, [RX + x, ry(z) + 0.06, z - 0.15], { legs: "sit", back: id === 4, expr: i % 2 ? "laugh" : "grin", armL: i === 1 ? "up" : "front", armR: i === 1 ? "up" : "front", headTilt: 5 * Math.sin(f * 0.3 + i) }, { shadow: false });
          for (let k = 0; k < 3; k++) { const kk = (f + k * 5 + i * 3) % 16; dust(RX + x + (hs(i, k) - 0.5) * 0.4, ry(z - 0.9 - kk * 0.25), z - 0.9 - kk * 0.25, kk, 0.6); }
        }
        // neighbours along the road, cheering
        for (let i = 0; i < 22; i++) { const sd = i % 2 ? 1 : -1, z = -3 - i * 2.9 - (i % 3) * 0.5, x = sd * (3.3 + (i % 3) * 0.45);
          if (id === 6 && sd > 0 && z > -13 && z < -6) continue; if (id !== 4 && (z < -52)) continue;
          G(ISL(i), 100 + i, [RX + x, ry(z) + hop(i, 0.09, 2.6 + (i % 3) * 0.5), z], { facing: (id === 5 ? 0 : -sd) as 1 | 0 | -1, expr: i % 3 === 0 ? "laugh" : "grin", armL: i % 2 ? "up" : "wave", armR: i % 4 === 1 ? "hang" : "up", look: id === 5 ? -sd : 0 }); }
        if (id >= 5) { // the two businessmen
          const p1 = id === 5 ? r(3.7, 0, -9.7) : r(3.5, 0, -10.0), p2 = id === 5 ? r(4.6, 0, -9.2) : r(2.95, 0, -9.2), idea = f >= B.idea, kb = pop(B.idea, 10), wow = f >= B.idea + 16;
          G(BIZ1, 7, p1, id === 5 ? { facing: -1, expr: "grin", armR: "point", look: -1 } : { expr: wow ? "laugh" : "grin", armR: wow ? "up" : "point", armL: wow ? "up" : "hip", look: idea ? 1 : -1, headTilt: 4 * Math.sin(f * 0.2) }, { roll: wow ? 0.03 * Math.sin(f * 0.5) : 0 });
          G(BIZ2, 8, [p2[0], p2[1] + (wow ? hop(2, 0.08, 2.5) : 0), p2[2]], id === 5 ? { facing: -1, expr: "shock", armL: "chin" } : { expr: idea ? "laugh" : "neutral", armL: idea ? "up" : "chin", armR: idea ? "point" : "hip", look: idea ? 0 : -1, headTilt: idea ? -6 : 6 });
          if (id === 6 && kb > 0) { K("thought", 420, 360, fxThought, [p2[0] - 0.1, p2[1] + 2.9 + 0.03 * Math.sin(f * 0.15), p2[2] + 0.15], 1.3 * kb, 1.11 * kb); spark([p2[0] - 0.6, p2[1] + 3.5, p2[2] + 0.9], 0.16 * pop(B.idea + 4, 10)); }
        }
        K("sail", 200, 200, fxSail, [RX + 30, 2.4, 170], 9, 9); K("sail", 200, 200, fxSail, [RX - 46, 2, 260], 8, 8); if (id === 4) gulls([RX, ry(-60) + 9, -40]);
        break;
      }
      case 7: { // "no": the sprinters hear the plan and run for it
        const no = f >= B.no, run0 = B.no + 16, run = f >= run0, d = run ? 0.011 * (f - run0) ** 2 : 0;
        G(BIZ1, 7, j(-3.1, 0, 6.8), { facing: 1, expr: run ? "pained" : "grin", armR: run ? "hang" : "reach", holdR: "paper", armL: run ? "chin" : "hip", look: 1 });
        G(BIZ2, 8, j(-4.0, 0, 5.9), { facing: 1, expr: run ? "nervous" : "smile", armL: run ? "mouth" : "wave", look: 1 });
        for (let i = 0; i < 3; i++) { const x = -1.3 + i * 1.15 + d * (1 + 0.15 * i), z = 6.6 + 0.25 * i;
          G(SPR(i), 20 + i, j(x, run ? 0 : 0, z), run ? { legs: "run", phase: d / 0.6 + i * 0.3, facing: 1, expr: "shock", armL: "up", armR: "front" } : { facing: -1, expr: no ? "stern" : "neutral", look: -1, headTilt: no ? 9 * Math.sin((f - B.no) * 0.9 + i) : 0, armL: no && i === 1 ? "hip" : "hang", armR: no ? "hip" : "hang" });
          if (run) for (let k = 0; k < 2; k++) { const kk = (f + k * 8 + i * 3) % 16; dust(JX + x - 0.5 - kk * 0.1, 0, z, kk, 0.75); } }
        if (no && !run) [0, 1, 2].forEach((i) => { const kq = pop(B.no + i * 3, 8); K("bang", 120, 260, fxBang, j(-1.3 + i * 1.15, 2.45, 6.6 + 0.25 * i), 0.16 * kq, 0.34 * kq, { rot: -0.15 }); });
        K("sun", 256, 256, fxSun, j(700, 90, -260), 170, 170, { soft: true, glow: 1.4 }); K("sail", 200, 200, fxSail, j(60, 2.4, -90), 9, 9); gulls(j(10, 6, -4));
        break;
      }
      case 8: { // sunset parade ground: three soldiers snap to attention... and a reggae singer with his guitar
        for (let i = 0; i < 3; i++) { const sal = f >= a + 10 + i * 13; G(SOLD(i), 5 + i, j(-3.4 + 1.4 * i, sal ? 0.06 * Math.max(0, 1 - (f - (a + 10 + i * 13)) / 5) : 0, 18.4), { expr: i === 2 ? "nervous" : "stern", armR: sal ? [16, -50, 24] : "hang", armL: "hang", look: 0 }); }
        const strum = Math.floor(f / 5) % 2, hey = f >= B.reggae + 12;
        G(SINGER, 8, j(1.5, hop(0, 0.04, 5), 18.4), { expr: hey ? "laugh" : "grin", armR: "front", holdR: "guitar", armL: hey ? "wave" : strum ? "low" : "front", headTilt: 7 * Math.sin(f * 0.21) }, { roll: 0.035 * Math.sin(f * 0.21) });
        for (let i = 0; i < 4; i++) { const tt = ((f * 0.02 + i * 0.25) % 1), k = i % 2; K(`note|${k}|${i % 3}`, 240, 240, (p) => fxNote(p, k, ["#23202a", "#1f8a3a", "#d0342e"][i % 3]), j(2.1 + 0.5 * Math.sin(tt * 5 + i) + tt * 0.5, 1.7 + tt * 1.5, 18.3), 0.26, 0.26, { rot: 0.3 * Math.sin(tt * 6 + i) }); }
        gulls(j(0, 7.5, 30));
        break;
      }
      case 9: { // Calgary: the four of them, frozen, cross the square
        for (let i = 0; i < 5; i++) { const k = [0, 1, 2, 3, 5][i], d = 0.034 * u, px = -0.6 - d + i * 0.95, pz = 6.6 + (i % 2) * 0.35;
          G(WINT(k), 5 + k, t(px, 0, pz), { legs: "walk", phase: d / STRIDE + i * 0.27, facing: -1, expr: i === 3 ? "dazed" : "nervous", armL: "front", armR: "front", headTilt: 4 }, { roll: 0.025 * Math.sin(f * 1.7 + i) });
          if ((Math.floor(f / 14) + i) % 3 === 0) K("breath", 120, 90, fxBreath, t(px - 0.45, 1.75, pz + 0.05), 0.42, 0.3, { soft: true }); }
        G(FAN(1), 40, t(-1.0, 0, -2.6), { back: true, armR: "point" }); G(FAN(4), 41, t(0.4, 0, -2.4), { back: true }); G(FAN(6), 42, t(-5.6, hop(0, 0.07, 3), 2.2), { facing: 1, expr: "laugh", armL: "up", armR: "up" });
        G(FAN(3), 43, t(8.6 - 0.02 * u, 0, -1.5), { legs: "walk", phase: u * 0.07, facing: -1, expr: "smile" }); G(FAN(8), 44, t(-8.5 + 0.022 * u, 0, 4.4), { legs: "walk", phase: u * 0.078, facing: 1, expr: "smile", armR: "front" });
        snow(this.camPos(5), 1, 90, 11);
        break;
      }
      case 10: { // the stall: T-shirts for sale
        const sell = (k: number) => f >= a + 12 + k * 22;
        G(WINT(0), 5, t(-0.75, 0, -4.75), { expr: "laugh", armR: "wave", holdR: "shirt", armL: "hip", headTilt: 5 * Math.sin(f * 0.2) }, { shadow: false, roll: 0.02 * Math.sin(f * 0.4) });
        G(WINT(3), 8, t(0.85, hop(0, 0.05, 3), -4.75), { expr: "grin", armL: "wave", holdL: "shirt", armR: "up" }, { shadow: false });
        G(FAN(1), 40, t(-1.75, 0, -2.75), { back: true, armR: sell(0) ? "reach" : "hang" }); G(FAN(2), 41, t(1.8, 0, -2.6), { back: true, armL: sell(1) ? "up" : "hang" }); G(FAN(5), 42, t(-3.0, hop(2, 0.06, 3), -2.1), { facing: 1, expr: "laugh", armR: "up", look: 1 });
        G(WINT(1), 6, t(2.7 - 0.012 * u, 0, -3.1), { legs: "walk", phase: u * 0.045, facing: -1, expr: "nervous", armL: "front", holdL: "shirt", armR: "front" }, { roll: 0.02 * Math.sin(f * 1.6) });
        for (let k = 0; k < 3; k++) { const f0 = a + 14 + k * 22, tt = ramp(f, f0, f0 + 14); if (tt > 0 && tt < 1) K("coin", 120, 120, fxCoinJ, t(lerp(k % 2 ? 1.7 : -1.7, k % 2 ? 0.8 : -0.75, tt), 1.5 + 1.1 * Math.sin(Math.PI * tt), lerp(-2.9, -4.5, tt)), 0.15, 0.15, { rot: f * 0.5 }); if (f >= f0 + 14) spark(t(k % 2 ? 0.9 : -0.7, 1.85, -4.6), 0.14 * pop(f0 + 14, 10)); }
        snow(this.camPos(3.5), 1, 60, 7);
        break;
      }
      case 11: { // three days to go: a patch of ice
        const f1 = B.slip, d = Math.min(0.036 * u, 0.036 * (f1 - a)), px = 5.95 - d, fall = ramp(f, f1, f1 + 12), down = f >= f1 + 12;
        const y = down ? 0.3 : 0.75 * Math.sin(Math.PI * Math.min(1, fall * 1.15)) * (fall > 0 ? 1 : 0), roll = -1.5 * smooth(fall);
        K("puddle", 256, 160, fxPuddle, t(4.5, 0.03, 3.6), 1.7, 1.06, { flat: true });
        G(WINT(5), 7, t(px - 0.9 * smooth(fall), y, 3.6), fall > 0 ? { expr: down ? "dazed" : "shock", armL: "up", armR: "up", wide: 20 } : { legs: "walk", phase: d / STRIDE, facing: -1, expr: "smile", armR: "front", holdR: "shirt", armL: "hang" }, { roll, shadow: !down });
        if (down) { this.stars(st, TOWN[0] + 5.9, 0.95, TOWN[1] + 3.64, f); const ko = pop(f1 + 12, 10); if (f < f1 + 30) K("ouch", 200, 200, fxOuch, t(4.6, 0.5, 3.7), 0.9 * ko, 0.9 * ko, { rot: 0.3 }); }
        G(WINT(0), 5, t(2.4, 0, 4.6), { facing: 1, expr: fall > 0 ? "shock" : "smile", armL: fall > 0 ? "chin" : "hang", armR: fall > 0 ? "chin" : "hang", look: 1 }); G(WINT(3), 8, t(1.6, 0, 5.4), { facing: 1, expr: fall > 0 ? "shock" : "grin", armL: fall > 0 ? "up" : "hip", armR: fall > 0 ? "up" : "hang", look: 1 });
        snow(this.camPos(4), 1, 60, 8);
        break;
      }
      case 12: { // the grandstand: the brother cheering with his flag... and a helmet arrives
        const give = B.animar, up0 = give - 16, got = f >= give, late = f >= give + 24;
        const ZF = -17.98, icy = trackAt(sNear(33, -16)).p.y + 0.04;
        [30.4, 31.35, 32.3, 36.3, 37.25, 38.2, 39.15, 29.45].forEach((x, i) => G(FAN(i + 2), 40 + i, [x, got ? 0 : hop(i, 0.1, 2.6 + (i % 3) * 0.4), ZF - 0.12 * (i % 2)], got ? { facing: (x < 33.9 ? 1 : -1) as 1 | -1, expr: i % 2 ? "shock" : "grin", armL: i % 3 === 0 ? "chin" : "hang", look: x < 33.9 ? 1 : -1 } : { expr: i % 2 ? "laugh" : "grin", armL: "up", armR: i % 3 ? "up" : "wave" }));
        G(BROTHER_FAN, 9, [33.9, got ? 0 : hop(0, 0.14, 2.5), ZF], got ? { expr: late ? "nervous" : "shock", armL: "front", holdL: "helm", armR: late ? "chin" : "hang", holdR: late ? undefined : "flagJM", look: late ? 0 : -1, headTilt: late ? 0 : 10, sweat: late ? 2 : 0 } : { expr: "laugh", armR: "wave", holdR: "flagJM", armL: "up", headTilt: 6 * Math.sin(f * 0.3) }, { roll: got ? 0 : 0.04 * Math.sin(f * 0.4) });
        G(WINT(3), 8, [35.1, got ? 0 : hop(3, 0.12, 2.8), ZF], got ? { facing: -1, expr: "laugh", armL: "point", look: -1 } : { expr: "laugh", armL: "up", armR: "wave" });
        const kin = smooth(ramp(f, up0 - 4, up0 + 10)), rx = lerp(31.8, 33.55, kin);
        if (f >= up0 - 4) G(RACER(0), 5, [rx, icy, -16.72], kin < 1 ? { back: true, legs: "walk", phase: (rx - 31.8) / STRIDE, armR: "up", holdR: "helm" } : { back: true, armR: got ? "hang" : "up", holdR: got ? undefined : "helm" }, { shadow: false });
        if (got) { const kb = pop(give + 2, 9); K("bang", 120, 260, fxBang, [33.92, 2.55, ZF], 0.16 * kb, 0.35 * kb); }
        flashes(0.12); snow(this.camPos(3.5), 0.8, 60, 7);
        break;
      }
      case 13: { // the top of the track: four backs, one very long way down
        this.setSled(0, w0!); const F = trackAt(S0 + 4), turn = f >= B.q;
        ([[-0.66, 3.0, 0], [0.66, 3.0, 1], [-0.62, 1.85, 2], [0.62, 1.85, 3]] as number[][]).forEach(([lat, ds, i]) => { const p = beside(S0 + ds, lat, 0.03), me = i === 1 && turn;
          G(CH[i], 5 + i, p, me ? { facing: 1, expr: "nervous", sweat: 2, armL: "chin", look: 1 } : { back: true, armL: i === 3 ? "chin" : "hang" }, { roll: 0.02 * Math.sin(f * 1.9 + i * 2) }); });
        const kq = pop(B.q, 10); if (kq > 0) K("q", 200, 250, fxQ, [F.p.x, F.p.y + 2.9, F.p.z - 1.6], 0.42 * kq, 0.53 * kq, { rot: 0.12 * Math.sin(f * 0.2) });
        aurora(); snow(this.camPos(5), 0.7, 70, 9);
        break;
      }
      case 14: { // push start: they sprint beside it and jump in one after another
        const w = w0!, F = w.F as ReturnType<typeof trackAt>, dist = sled0!.s - S0, side = w.fwd.dot(this.right), fc = (side > 0 ? 1 : -1) as 1 | -1;
        this.setSled(0, w);
        const seats = [0.25, -0.3, -0.85, -1.4], runAt: [number, number][] = [[-0.66, 0.35], [0.66, -0.3], [-0.66, -0.95], [0, -2.2]], inAt = [30, 35, 40, 45];
        for (let i = 0; i < 4; i++) { const tin = ramp(u, inAt[i], inAt[i] + 5), seat = w.pos.clone().addScaledVector(w.fwd, seats[i]).addScaledVector(w.up, 0.06), run = w.pos.clone().addScaledVector(w.fwd, runAt[i][1]).addScaledVector(F.r, runAt[i][0]);
          if (tin >= 1) G(CH[i], 5 + i, v(seat), { legs: "sit", facing: fc, armL: "front", armR: "front", expr: i === 3 ? "laugh" : "grin" }, { shadow: false });
          else { const p = run.clone().lerp(seat, tin); G(CH[i], 5 + i, [p.x, p.y + 0.5 * Math.sin(Math.PI * tin), p.z], { legs: "run", phase: dist / 0.62 + i * 0.25, facing: fc, expr: "stern", armL: "reach", armR: "reach", sweat: u > 14 ? 1 : 0 }, { shadow: false }); } }
        if (u > 6 && u < 46) for (let k = 0; k < 2; k++) { const kk = (f + k * 8) % 16, p = w.pos.clone().addScaledVector(w.fwd, -2.6 - kk * 0.12); dust(p.x, p.y, p.z, kk, 0.7); }
        if (u > 44) iceSpray(w, 0.9);
        for (let i = 0; i < 6; i++) { const p = beside(S0 + 2 + i * 2.6, -4.7 - (i % 2) * 0.9, 0); G(FAN(i + 1), 40 + i, [p[0], terrain(p[0], p[2]) + hop(i, 0.12, 2.4 + (i % 3) * 0.4), p[2]], { expr: i % 2 ? "laugh" : "grin", armL: "up", armR: i % 3 ? "up" : "wave", look: -fc }); }
        aurora(); snow(this.camPos(5), 0.6, 70, 9);
        break;
      }
      case 15: { // flat out down the S-bends
        this.riders(st, f, w0!, CH, 5, () => ({})); iceSpray(w0!, 1.3);
        aurora(); snow(this.camPos(6), 0.5);
        break;
      }
      case 16: case 17: case 18: { // the crash: over it goes, sliding on its side, and they crawl out
        const w = w0!, F = w.F as ReturnType<typeof trackAt>, k = sled0!.side ?? 0, qq = f - B.vuelcan, stopped = qq > 82;
        if (id < 18) {
          this.riders(st, f, w, CH, 5, (i) => ({ expr: k > 0.5 ? (i % 2 ? "pained" : "shock") : "shock", armL: k > 0.5 ? "up" : "front", armR: k > 0.5 ? "up" : "front", sweat: 2 }));
          if (k >= 1 && !stopped) { for (let i = 0; i < 4; i++) { const hp = w.pos.clone().addScaledVector(w.fwd, 0.25 - i * 0.55).addScaledVector(w.up, 1.28); if ((f + i) % 2 === 0) spark(v(hp, -0.05), 0.22 + 0.12 * hs(f, i)); }
            const tt = (f % 6) / 6, ip = w.pos.clone().addScaledVector(w.fwd, 1.3).addScaledVector(w.up, 0.9); K(`ice|${f % 6}`, 300, 200, (pp) => fxIce(pp, tt), v(ip, -0.2), 1.4, 0.95); }
          if (qq >= 19 && qq < 30) { const kb = pop(B.vuelcan + 19, 9), ip = w.pos.clone().addScaledVector(w.up, 0.6); K("ouch", 200, 200, fxOuch, v(ip, 0.2), 1.6 * kb, 1.6 * kb, { rot: 0.4 }); }
          if (stopped) this.stars(st, w.pos.x - F.sg * F.r.x * 1.2, w.pos.y + 1.2, w.pos.z - F.sg * F.r.z * 1.2, f);
        } else { // out of the sled, one by one, onto their feet
          this.setSled(0, w);
          for (let i = 0; i < 4; i++) { const f0 = a + 3 + i * 5, upK = ramp(f, f0, f0 + 6), p = beside(SSTOP + 1.5 - i * 0.95, -F.sg * (0.62 + (i % 2) * 0.12), 0.03);
            G(CH[i], 5 + i, [p[0], p[1] + 0.16 * Math.sin(Math.PI * upK), p[2]], upK < 0.5 ? { legs: "kneel", expr: "dazed", armL: "low", armR: "low", headTilt: 8 * Math.sin(f * 0.3 + i) } : { expr: i === 0 ? (f > a + 20 ? "relief" : "pained") : i === 3 ? "dazed" : "pained", armL: i % 2 ? "chin" : "hang", armR: i === 0 ? "hip" : "hang", headTilt: 5 * Math.sin(f * 0.15 + i) }, { shadow: false }); }
          this.stars(st, beside(SSTOP - 1.65, -F.sg * 1.5, 0)[0], w.pos.y + 2.0, beside(SSTOP - 1.65, -F.sg * 1.5, 0)[2], f);
        }
        aurora(); snow(this.camPos(4), 0.6, 60, 8);
        break;
      }
      case 19: { // they walk it to the line; everybody is standing
        const w = w0!, F = w.F as ReturnType<typeof trackAt>, d = sled0!.s - (SF - 9), cheer = f >= B.publico - 20;
        this.setSled(0, w);
        ([[0.86, 0.5], [-0.86, 0.5], [0.3, -2.4], [-0.3, -2.4]] as number[][]).forEach(([lat, dz], i) => { const p = w.pos.clone().addScaledVector(w.fwd, dz).addScaledVector(F.r, lat);
          G(CH[i], 5 + i, [p.x, F.p.y + 0.05, p.z], { legs: "walk", phase: d / STRIDE + i * 0.27, expr: cheer ? (i === 0 ? "smile" : i === 3 ? "grin" : "relief") : i === 3 ? "dazed" : "pained", armL: i > 1 ? "front" : i === 1 ? "low" : cheer ? "wave" : "hang", armR: i > 1 ? "front" : i === 0 ? "low" : cheer ? "wave" : "hang", headTilt: cheer ? 0 : 8 }, { shadow: false }); });
        for (let i = 0; i < 9; i++) { const x = FIN_X - 9 + i * 1.05; G(FAN(i), 40 + i, [x, cheer ? hop(i, 0.12, 2.5 + (i % 3) * 0.4) : 0, -13.2], { facing: -1, expr: cheer ? (i % 2 ? "laugh" : "grin") : "nervous", armL: cheer ? "up" : "hang", armR: cheer ? (i % 3 ? "up" : "wave") : "chin" }); }
        for (let i = 0; i < 9; i++) { const x = FIN_X - 9.5 + i * 1.1; G(FAN(i + 9), 60 + i, [x, cheer ? hop(i + 4, 0.12, 2.7 + (i % 3) * 0.3) : 0, -18.75], { expr: cheer ? (i % 2 ? "grin" : "laugh") : "shock", armL: cheer ? (i % 3 ? "up" : "wave") : "chin", armR: cheer ? "up" : "hang" }); }
        if (cheer) flashes(0.2); snow(this.camPos(5), 0.8, 80, 10);
        break;
      }
      case 20: { // the results board: last
        [78.5, 79.5, 80.5, 81.5].forEach((x, i) => G(CH[i], 5 + i, [x, 0, -18.4], f > b - 16 && i === 0 ? { facing: 1, expr: "smile", look: 1 } : { back: true, armL: i === 3 ? "hip" : "hang" }, { roll: (i - 1.5) * 0.012 }));
        snow([80, 3.5, -17], 1, 90, 10);
        break;
      }
      case 21: { // six years later
        this.riders(st, f, w0!, CH, 5, (i) => ({ expr: i === 0 ? "stern" : "grin" })); iceSpray(w0!, 1.3);
        for (let i = 0; i < 9; i++) { const x = FIN_X - 6 + i * 1.5; G(FAN(i + 9), 60 + i, [x, hop(i + 4, 0.12, 2.5 + (i % 3) * 0.3), -18.75], { expr: i % 2 ? "grin" : "laugh", armL: "up", armR: i % 3 ? "up" : "wave" }); }
        flashes(0.25); this.conf(st, f, FIN_X + 2, 2.2, -16, 40, 9);
        break;
      }
      default: { // they beat them: the four past the line, the others rolling in with their mouths open
        this.setSled(0, w0!);
        const F = trackAt(SF + 16);
        ([[0.2, 16.4, 0], [-0.5, 17.5, 1], [0.6, 18.4, 2], [-0.2, 19.5, 3]] as number[][]).forEach(([lat, ds, i]) => { const p = beside(SF + ds, lat, 0.04);
          G(i === 3 || i === 1 ? RBARE(CREW[i]) : CH[i], 5 + i, [p[0], p[1] + hop(i, 0.26, 3 + (i % 2) * 0.5), p[2]], { expr: i % 2 ? "laugh" : "grin", armR: i === 0 ? "wave" : "up", holdR: i === 0 ? "flagJM" : i === 3 ? "helm" : undefined, armL: "up", headTilt: 6 * Math.sin(f * 0.25 + i) }, { shadow: true, roll: 0.03 * Math.sin(f * 0.3 + i) }); });
        const rs = SF - 20 + 26 * (1 - Math.exp(-u / 22)), rw = sledWorld({ s: rs, phi: 0 } as SledState);
        this.riders(st, f, rw, [0, 1, 2, 3].map(RIV), 70, (i) => ({ expr: u > 22 ? (i % 2 ? "dazed" : "shock") : "stern" }), 1);
        for (let i = 0; i < 9; i++) { const x = FIN_X + 7 + i * 1.5; G(FAN(i + 9), 60 + i, [x, hop(i + 4, 0.14, 2.5 + (i % 3) * 0.3), -18.75], { expr: i % 2 ? "grin" : "laugh", armL: "up", armR: i % 3 ? "up" : "wave" }); }
        for (let i = 0; i < 5; i++) { const f0 = a + 10 + i * 15, tt = ramp(f, f0, f0 + 22); if (tt > 0 && tt < 1) { const col = ["#f6c419", "#6af0b0", "#ff7a6a", "#f6c419", "#ffffff"][i]; K(`fire|${i}|${Math.round(tt * 22)}`, 256, 256, (p) => fxFire(p, tt, col), [FIN_X - 6 + i * 11, 26 + (i % 2) * 7, -70], 22, 22, { soft: true, glow: 2.2 }); } }
        flashes(0.25); this.conf(st, f, FIN_X + 17.5, 2.4, -16, 60, 7); void F;
        break;
      }
    }
    void [spark, lerp, smooth, b];
    return st;
  }
  /** a point d metres in front of the camera (for weather that should fill the frame) */
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
    this.sun.color.set(L.sunCol); this.sun.intensity = L.sunI;
    let Rr = THREE.MathUtils.clamp(dist * 1.15 + 7, 14, 95);
    if (s.light === "golden") Rr = Math.max(Rr, 30);
    if (s.place === "road" || s.place === "town") Rr = Math.max(Rr, 34);
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
    const snowy = s.place === "track" || s.place === "town";
    this.fog.near = snowy ? 60 : 90; this.fog.far = snowy ? (s.light === "night" ? 520 : 700) : 900;
    const night = s.light === "night";
    for (const lm of LAMP_MATS) { const h = (lm.userData as { hot: [number, number, number] }).hot, k = night ? 1 : s.light === "golden" ? 0.55 : 0.3; lm.color.setRGB(h[0] * k, h[1] * k, h[2] * k); }
    for (const tn of this.refs.tints) tn.m.color.setRGB(...tn[s.light]);
    this.refs.calgary.visible = snowy; this.refs.island.visible = !snowy;
    this.refs.sleds.forEach((g) => (g.visible = false)); this.refs.carts.forEach((g) => (g.visible = false));
    // living sets: sea, foam, palms, flags, crowd
    for (const w of this.refs.waves) w.offset.set(f * 0.0016, f * 0.0009 + 0.01 * Math.sin(f * 0.05));
    for (const fm of this.refs.foams) { const d = (fm.userData as { dir: number }).dir; fm.position.z = -d * (0.5 + 0.5 * Math.sin(f * 0.07)) * 0.9; (fm.material as THREE.MeshBasicMaterial).opacity = 0.75 + 0.25 * Math.sin(f * 0.07 + 1); }
    this.refs.crowns.forEach((g, i) => { g.rotation.z = 0.05 * Math.sin(f * 0.045 + i * 1.3); g.rotation.x = 0.04 * Math.sin(f * 0.037 + i * 2.1); });
    this.refs.flags.forEach((m, i) => { m.rotation.y = -0.5 + 0.3 * Math.sin(f * 0.16 + i * 0.9); m.scale.x = 0.92 + 0.08 * Math.sin(f * 0.23 + i); });
    const roar = id === 14 || id === 21 || id === 22 || (id === 19 && f >= B.publico - 20) || id === 1;
    for (const ct of this.refs.crowds) ct.offset.y = roar ? 0.012 * Math.sin(f * 1.1) : 0.003 * Math.sin(f * 0.4);
    this.refs.boat.position.y = -0.25 + 0.08 * Math.sin(f * 0.09); this.refs.boat.rotation.z = 0.05 * Math.sin(f * 0.07);
    this.starPts.visible = night; this.starPts.position.copy(cam.position);
    ([[-520, -760], [330, -900], [930, -160], [-860, 60], [120, 820], [-300, -980], [760, -640]] as number[][]).forEach(([x, z], i) => { const m = this.auroras[i]; m.visible = night && snowy;
      m.position.set(x + 30 * Math.sin(f * 0.012 + i), 290 + 16 * Math.sin(f * 0.02 + i * 2), z); m.scale.set(820, 360, 1); m.lookAt(cam.position);
      const g = 0.5 + 0.2 * Math.sin(f * 0.05 + i * 1.7); (m.material as THREE.MeshBasicMaterial).color.setRGB(...(i % 3 === 1 ? [0.5 * g, 0.3 * g, 0.9 * g] : [0.2 * g, 0.95 * g, 0.55 * g]) as [number, number, number]); });
    const lamps = lampsAt(id, f);
    this.lamps.forEach((l, i) => { const d = lamps[i]; if (d) { l.position.set(...d.p); l.color.set(d.c); l.intensity = d.i; l.distance = d.d; } else l.intensity = 0; });
    scene.fog = this.fog; scene.background = null;
    this.sunDisc.visible = s.light === "golden";
    this.sunDisc.position.copy(cam.position).addScaledVector(this.sunDir, 900); this.sunDisc.scale.setScalar(2 * 900 * Math.tan(THREE.MathUtils.degToRad(1.7)));
    this.clouds.forEach((m, i) => {
      const a = (i / 10) * Math.PI * 2 + 0.3, d = 760 + (i % 3) * 60, w = 150 + (i % 4) * 36;
      m.position.set(cam.position.x + Math.cos(a + f * 0.00012) * d, 150 + (i % 4) * 46 + (snowy ? 60 : 0), cam.position.z + Math.sin(a + f * 0.00012) * d); m.scale.set(w, w / 2, 1);
      m.lookAt(cam.position.x, m.position.y, cam.position.z); (m.material as THREE.MeshBasicMaterial).map = this.cloudMaps[s.light === "golden" ? "golden" : "day"][i % 4]; m.visible = !night;
    });
    // ---- cast ----
    const st = this.stage(id, f);
    const reqs: { a: Actor; p: Place }[] = [];
    this.actors.forEach((a) => (a.mesh.visible = false));
    this.fxs.forEach((x) => (x.mesh.visible = false));
    st.places.slice(0, this.actors.length).forEach((p, i) => {
      const a = this.actors[i], d = cam.position.distanceTo(new THREE.Vector3(p.x, p.y + 1.2 * p.scale, p.z)) / p.scale;
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
