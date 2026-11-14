// The world of "The Hair": a Naples café + alley, a plane cabin, a night sky and the stadium bowl. Same look modules as
// the bridge short (two-tone world, lit cards, ink, lens, grade) plus real point lights and a night preset.
// update(id, f, cam, scene) poses everything for shot id at frame f (pure function of id + f).
import * as THREE from "three";
import { Pool, Actor, Fx, SU } from "./pool";
import { NOINK } from "./ink";
import { TONE, CHAR, untone } from "./shade";
import { LIGHTS, LOOK, LightK } from "./lights";
import { ctex, rep, rng, grassHD, facadeHD, cloudHD } from "./paint";
import { Pen, figure, Char, Pose, fxBurst, fxContact, fxPuff, fxStars, fxRing, fxCloud, INK } from "./toon";
import { fxBall, fxCup, fxConfetti, fxQ, fxFlash, fxZ, fxSweat, fxHair, fxFly, fxHalo, fxFlame, fxFlowers, fxWeb, fxPedestal, fxPlane, fxHand, fxClock, fxEspresso, fxCoin, fxPatch, fxMoon, fxTumble } from "./props";
import { FPS, SHOTS, W, V3, camAt, smooth, clamp01, lerp, ramp, lampsAt, AIR, XD, XG, ZS, nonnaAt, diegoWalkX, queueAt } from "./story";
import { lam, add, box, ground, repT } from "./kit";
import { buildCafe, buildAlley, buildPlane, SetRefs, NIGHT_MATS, LAMP_MATS, CX, PZ, SHX, SHY, SHZ } from "./sets";
import { GENNARO, GENNARO_APRON, GENNARO_OLD, DIEGO, DIEGO_TRACK, WIFE, NONNA, TOURIST, TOURIST2, folk } from "./cast";
const GX = 52.5;
const CKEY = new WeakMap<Char, string>();
const outQ = (x: number) => 1 - (1 - clamp01(x)) ** 3;
void [FPS, SU, rep, rng, grassHD, facadeHD, fxPuff, fxStars, fxRing, fxBall, fxCup, fxSweat, INK, GENNARO, W, XG, box, fxPlane, fxMoon, fxCloud, AIR];

// ---------------- painted textures ----------------
const pitchTex = () => ctex("pitch", 2100, 1360, (g) => {
  const S = 20; // px per metre
  for (let i = 0; i < 18; i++) { g.fillStyle = i % 2 ? "#3f7f34" : "#478c3a"; g.fillRect(i * 2100 / 18, 0, 2100 / 18 + 1, 1360); }
  const r = rng(7);
  for (let i = 0; i < 9000; i++) { g.fillStyle = r() < 0.5 ? "rgba(30,70,20,0.10)" : "rgba(170,220,120,0.10)"; g.fillRect(r() * 2100, r() * 1360, 3, 6); }
  g.strokeStyle = "#f4f6ee"; g.lineWidth = 0.14 * S;
  const X = (m: number) => 1050 + m * S, Z = (m: number) => 680 + m * S;
  g.strokeRect(X(-52.5), Z(-34), 105 * S, 68 * S);
  g.beginPath(); g.moveTo(X(0), Z(-34)); g.lineTo(X(0), Z(34)); g.stroke();
  g.beginPath(); g.arc(X(0), Z(0), 9.15 * S, 0, Math.PI * 2); g.stroke();
  for (const s of [-1, 1]) {
    g.strokeRect(s < 0 ? X(-52.5) : X(52.5 - 16.5), Z(-20.16), 16.5 * S, 40.32 * S);
    g.strokeRect(s < 0 ? X(-52.5) : X(52.5 - 5.5), Z(-9.16), 5.5 * S, 18.32 * S);
    g.beginPath(); g.arc(X(s * 41.5), Z(0), 9.15 * S, s < 0 ? -0.93 : Math.PI - 0.93, s < 0 ? 0.93 : Math.PI + 0.93); g.stroke();
    g.fillStyle = "#f4f6ee"; g.beginPath(); g.arc(X(s * 41.5), Z(0), 4, 0, Math.PI * 2); g.fill();
  }
  g.fillStyle = "#f4f6ee"; g.beginPath(); g.arc(X(0), Z(0), 5, 0, Math.PI * 2); g.fill();
});
const surroundTex = () => ctex("surround", 512, 512, (g, r) => {
  g.fillStyle = "#3d7a33"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 4000; i++) { g.fillStyle = r() < 0.5 ? "rgba(30,70,20,0.12)" : "rgba(170,220,120,0.10)"; g.fillRect(r() * 512, r() * 512, 3, 5); }
});
/** stepped terraces packed with people: bean heads + shirts big enough to read, fan blocks by colour, stair aisles */
const crowdTex = () => ctex("crowd", 2048, 1024, (g, r) => {
  const rows = 12, rh = 1024 / rows;
  const blocks = [["#8ec9ee", "#ffffff", "#8ec9ee", "#f4f3ee"], ["#ffffff", "#e8e4da", "#d64a3c", "#f4f3ee"], ["#2f8a4a", "#ffffff", "#d64a3c", "#f2c94c"], ["#8ec9ee", "#ffffff", "#f2c94c", "#8ec9ee"]];
  const skins = ["#fde3cc", "#f1c9a2", "#e2b088", "#fff0e0", "#c99067"], hairs = ["#2a1d16", "#4a3426", "#16100c", "#8a5a34", "#d6b46a"];
  for (let y = 0; y < rows; y++) {
    g.fillStyle = y % 2 ? "#5a5670" : "#625e7a"; g.fillRect(0, y * rh, 2048, rh);
    g.fillStyle = "#3d3a52"; g.fillRect(0, y * rh + rh * 0.84, 2048, rh * 0.16);
    for (let x = 6; x < 2048; x += 36 + r() * 8) {
      const blk = blocks[Math.floor(x / 512) % 4], c = blk[Math.floor(r() * blk.length)], up = r() < 0.22;
      const cx = x + 16, by = y * rh + rh * 0.86, hy = by - rh * 0.56 - (up ? 6 : 0);
      g.fillStyle = "#241726"; g.beginPath(); g.ellipse(cx, by - rh * 0.2, 17, rh * 0.3, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = c; g.beginPath(); g.ellipse(cx, by - rh * 0.2, 14, rh * 0.27, 0, 0, Math.PI * 2); g.fill();
      if (up) { g.strokeStyle = "#241726"; g.lineWidth = 5; g.beginPath(); g.moveTo(cx - 12, by - rh * 0.34); g.lineTo(cx - 20, hy - 18); g.moveTo(cx + 12, by - rh * 0.34); g.lineTo(cx + 20, hy - 18); g.stroke(); }
      g.fillStyle = "#241726"; g.beginPath(); g.arc(cx, hy, 16, 0, Math.PI * 2); g.fill();
      g.fillStyle = skins[Math.floor(r() * skins.length)]; g.beginPath(); g.arc(cx, hy, 13, 0, Math.PI * 2); g.fill();
      g.fillStyle = hairs[Math.floor(r() * hairs.length)]; g.beginPath(); g.arc(cx, hy - 2, 13, Math.PI * 1.05, Math.PI * 1.95); g.fill();
    }
    if (r() < 0.7) { const fx = r() * 1900, fy = y * rh + 2; g.fillStyle = "#241726"; g.fillRect(fx - 3, fy - 3, 96, 46);
      if (r() < 0.65) { g.fillStyle = "#8ec9ee"; g.fillRect(fx, fy, 90, 14); g.fillStyle = "#ffffff"; g.fillRect(fx, fy + 13, 90, 14); g.fillStyle = "#8ec9ee"; g.fillRect(fx, fy + 26, 90, 14); }
      else { g.fillStyle = "#2f8a4a"; g.fillRect(fx, fy, 30, 40); g.fillStyle = "#ffffff"; g.fillRect(fx + 30, fy, 30, 40); g.fillStyle = "#d64a3c"; g.fillRect(fx + 60, fy, 30, 40); } }
  }
  for (const ax of [0, 1024]) { g.fillStyle = "#cfc9bd"; g.fillRect(ax, 0, 44, 1024); for (let y = 0; y < 1024; y += rh / 2) { g.fillStyle = "#8d8a9a"; g.fillRect(ax, y, 44, 5); } }
});
/** the noon shadow of the roof on the pitch: hard curved edge + the spidery shadow of the hanging speaker rig */
const roofShadeTex = () => ctex("roofShade2", 1024, 512, (g) => {
  g.fillStyle = "#ffffff"; g.fillRect(0, 0, 1024, 512);
  g.fillStyle = "#6f78c4";
  g.beginPath(); g.moveTo(0, 0); g.lineTo(1024, 0); g.lineTo(1024, 296);
  for (let i = 32; i >= 0; i--) { const x = (i / 32) * 1024; g.lineTo(x, 300 + 26 * Math.cos((x / 1024 - 0.5) * 3.0)); }
  g.closePath(); g.fill();
  g.strokeStyle = "#6f78c4"; g.lineCap = "round"; // the "spider"
  g.fillStyle = "#6f78c4"; g.beginPath(); g.ellipse(560, 404, 26, 18, 0, 0, Math.PI * 2); g.fill();
  g.lineWidth = 5; for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + 0.2; g.beginPath(); g.moveTo(560, 404); g.lineTo(560 + Math.cos(a) * 250, 404 + Math.sin(a) * 110); g.stroke(); }
});
/** restaurant textures */
const checkTex = () => ctex("check", 256, 256, (g) => { for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { g.fillStyle = (x + y) % 2 ? "#e9dcc6" : "#7a2f3a"; g.fillRect(x * 64, y * 64, 64, 64); } });
const wallpaperTex = () => ctex("wallpaper", 256, 512, (g) => {
  g.fillStyle = "#a8433f"; g.fillRect(0, 0, 256, 512);
  for (let x = 0; x < 256; x += 64) { g.fillStyle = "#96383a"; g.fillRect(x, 0, 30, 512); }
  g.fillStyle = "#5a3324"; g.fillRect(0, 340, 256, 172); g.fillStyle = "#6e4230"; for (let x = 6; x < 256; x += 64) g.fillRect(x, 356, 52, 140);
  g.fillStyle = "#3d2218"; g.fillRect(0, 332, 256, 12);
});
const boardTex = () => ctex("boards", 1024, 64, (g) => {
  const cols = ["#d23b35", "#ffffff", "#1f4fa0", "#f2c230", "#2f8a4a", "#ffffff"];
  for (let i = 0; i < 12; i++) {
    g.fillStyle = cols[i % 6]; g.fillRect(i * 1024 / 12, 0, 1024 / 12, 64);
    g.fillStyle = cols[(i + 2) % 6]; g.fillRect(i * 1024 / 12 + 14, 22, 1024 / 12 - 28, 20); // abstract shapes, no brands
  }
});
const roofTex = () => ctex("roofband", 512, 128, (g) => {
  g.fillStyle = "#d9d6cf"; g.fillRect(0, 0, 512, 128);
  for (let x = 0; x < 512; x += 32) { g.fillStyle = "#b5b1aa"; g.fillRect(x, 0, 4, 128); }
});
const netTex = () => ctex("net2", 256, 256, (g) => {
  g.clearRect(0, 0, 256, 256); g.strokeStyle = "#ffffff"; g.lineWidth = 2;
  for (let i = 0; i <= 256; i += 32) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 256); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(256, i); g.stroke(); }
});
const dirtTex = () => ctex("dirt", 1024, 1024, (g, r) => {
  g.fillStyle = "#b98d5c"; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 900; i++) { const c = ["#a77c4e", "#c79c69", "#9c7247", "#cfa877"][Math.floor(r() * 4)]; g.fillStyle = c; g.beginPath(); g.ellipse(r() * 1024, r() * 1024, 10 + r() * 40, 6 + r() * 20, r() * 3, 0, Math.PI * 2); g.fill(); }
  for (let i = 0; i < 2500; i++) { g.fillStyle = r() < 0.5 ? "#7d5a3a" : "#e2c9a0"; g.fillRect(r() * 1024, r() * 1024, 3 + r() * 4, 3 + r() * 3); }
  g.fillStyle = "rgba(90,60,35,0.25)"; g.fillRect(300, 0, 60, 1024); g.fillRect(660, 0, 60, 1024); // wheel ruts
});
const tinTex = () => ctex("tin", 256, 256, (g, r) => {
  for (let x = 0; x < 256; x += 16) { g.fillStyle = "#9aa0a6"; g.fillRect(x, 0, 8, 256); g.fillStyle = "#7c8288"; g.fillRect(x + 8, 0, 8, 256); }
  for (let i = 0; i < 30; i++) { g.fillStyle = "rgba(150,80,40,0.35)"; g.beginPath(); g.ellipse(r() * 256, r() * 256, 8 + r() * 20, 5 + r() * 12, 0, 0, Math.PI * 2); g.fill(); }
});
const plasterTex = (key: string, col: string) => ctex("plaster" + key, 512, 512, (g, r) => {
  g.fillStyle = col; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 120; i++) { g.fillStyle = r() < 0.5 ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.06)"; g.beginPath(); g.ellipse(r() * 512, r() * 512, 10 + r() * 50, 6 + r() * 30, 0, 0, Math.PI * 2); g.fill(); }
});
const windowTex = () => ctex("window", 256, 256, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, "#ffe2a8"); gr.addColorStop(1, "#ffb067");
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  g.fillStyle = "#5a3b2a"; g.fillRect(122, 0, 12, 256); g.fillRect(0, 122, 256, 12);
});
const blanketTex = () => ctex("blanket", 256, 256, (g) => {
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { g.fillStyle = (x + y) % 2 ? "#c9473d" : "#e9d9b8"; g.fillRect(x * 32, y * 32, 32, 32); }
});

// ---------------- geometry helpers ----------------
// ---------------- staging types ----------------
type Place = { key: string; draw: (p: Pen) => void; x: number; y: number; z: number; scale: number; mirror?: boolean; roll?: number; faceUp?: boolean; sx?: number; sy?: number };
type FxPlace = { key: string; cw: number; ch: number; draw: (p: Pen) => void; x: number; y: number; z: number; w: number; h: number; flat?: boolean; rot?: number; soft?: boolean; glow?: number; tint?: string };
type Stage = { places: Place[]; fx: FxPlace[] };

const tier = (d: number): [number, number, number] =>
  d < 3.2 ? [1800, 3000, 3.0] : d < 6.5 ? [1080, 1800, 1.8] : d < 16 ? [480, 800, 0.8] : [240, 400, 0.4];
const q = (v: number, n = 120) => Math.round(v * n) / n;
const fkey = (o: object) => JSON.stringify(o, (_k, v) => (typeof v === "number" ? q(v) : v));
/** blinks: 4-frame lid curve every 0.5-2.3 s, deterministic per seed */
const LID = [0.5, 1, 1, 0.5];
const lidAt = (f: number, seed: number) => {
  let s = Math.round(-60 * hs(seed, 9));
  for (let n = 0; s <= f && n < 400; n++) { const k = f - s; if (k >= 0 && k < 4) return LID[k]; s += Math.round(15 + 54 * hs(seed * 31 + n, 13)); }
  return 0;
};
const hs = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
/** a point on the terraces: angle round the bowl, offset out from the pitch-side wall */
const standPt = (a: number, o: number): V3 => {
  const c = Math.cos(a), s = Math.sin(a), p = 4, k = Math.pow(Math.pow(Math.abs(c), p) + Math.pow(Math.abs(s), p), -1 / p);
  const x = c * k * 66, z = s * k * 46, L = Math.hypot(x, z);
  return [x * (1 + o / L), 3.4 + o * 0.74, z * (1 + o / L)];
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
  private cam: THREE.Vector3 = new THREE.Vector3(); private right = new THREE.Vector3(); private sunDir = new THREE.Vector3();
  private light = "day" as LightK;
  private lamps: THREE.PointLight[] = [];
  private refs!: SetRefs;
  private starPts!: THREE.Points;
  private lightAngle = -2;
  private crowdTex!: THREE.Texture; private bowl!: THREE.Mesh; private roofMesh!: THREE.Mesh; private roofShade!: THREE.Mesh;

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
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(1100, 48, 24), this.skyMat);
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
    this.buildStadium(R);
    this.refs = buildCafe(R); buildAlley(R); buildPlane(R);
    for (let i = 0; i < 6; i++) { const l = new THREE.PointLight("#ffffff", 0, 8, 2); this.lamps.push(l); R.add(l); }
    { const n = 500, pos = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const a = hs(i, 1) * Math.PI * 2, e = 0.08 + hs(i, 2) * 1.3, r = 900; pos[i * 3] = r * Math.cos(a) * Math.cos(e); pos[i * 3 + 1] = r * Math.sin(e); pos[i * 3 + 2] = r * Math.sin(a) * Math.cos(e); }
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      this.starPts = new THREE.Points(g, new THREE.PointsMaterial({ color: new THREE.Color(2.2, 2.2, 2.0), size: 2.6, sizeAttenuation: false, fog: false, depthWrite: false })); this.starPts.layers.set(NOINK); this.starPts.frustumCulled = false; R.add(this.starPts); }
    for (let i = 0; i < 96; i++) this.actors.push(new Actor(R));
    for (let i = 0; i < 240; i++) this.fxs.push(new Fx(R));
  }

  private buildStadium(R: THREE.Object3D) {
    const pitch = pitchTex(); pitch.anisotropy = 16;
    add(R, ground(-52.5 - 0.0, 52.5, -34, 34, 0), lam("pitch", () => ({ map: pitch })), false);
    const sur = repT(surroundTex());
    for (const [x0, x1, z0, z1] of [[-70, 70, -50, -34], [-70, 70, 34, 50], [-70, -52.5, -34, 34], [52.5, 70, -34, 34]])
      add(R, ground(x0, x1, z0, z1, -0.005, (x1 - x0) / 8, (z1 - z0) / 8), lam("surround", () => ({ map: sur })), false);
    // advertising boards (abstract colour blocks) around the pitch
    const bt = repT(boardTex());
    const bm = lam("boards", () => ({ map: bt }));
    for (const s of [-1, 1]) {
      add(R, box(-58, 0, s * 39 - 0.1, 58, 0.95, s * 39 + 0.1, 9.67), bm);
      add(R, box(s * 60 - 0.1, 0, -36, s * 60 + 0.1, 0.95, 36, 9.67), bm);
    }
    // the bowl: one sloped terrace ring from the boards to the rim, a fascia wall at the bottom, a roof band on top
    const N = 160, inner = (a: number): [number, number] => {
      const c = Math.cos(a), s = Math.sin(a), p = 4, k = Math.pow(Math.pow(Math.abs(c), p) + Math.pow(Math.abs(s), p), -1 / p);
      return [c * k * 66, s * k * 46];
    };
    const tiers: [number, number, number][] = [[0, 2.6, 0], [3, 22, 1], [27, 44, 1]]; // [out offset, y, terrace?]
    const pos: number[] = [], uv: number[] = [], idx: number[] = [], col: number[] = [];
    const rings = [[0, 2.6], [16, 14], [17.5, 15.5], [36, 33], [38, 33.5], [42, 41]];
    for (let i = 0; i <= N; i++) {
      const a = (i / N) * Math.PI * 2, [x, z] = inner(a), L = Math.hypot(x, z);
      rings.forEach(([o, y], j) => { pos.push(x * (1 + o / L), y, z * (1 + o / L)); uv.push((i / N) * 8, (o + y) / 14); const k = [1.05, 0.82, 0.3, 0.74, 0.34, 0.3][j]; col.push(k, k, k * 1.06); });
    }
    const M = rings.length;
    for (let i = 0; i < N; i++) for (let j = 0; j < M - 1; j++) { const a = i * M + j, b = (i + 1) * M + j; idx.push(a, b, a + 1, b, b + 1, a + 1); }
    const bowl = new THREE.BufferGeometry();
    bowl.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); bowl.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    bowl.setAttribute("color", new THREE.Float32BufferAttribute(col, 3)); bowl.setIndex(idx); bowl.computeVertexNormals();
    const ct = repT(crowdTex());
    const crowd = add(R, bowl, lam("crowd", () => ({ map: ct, side: THREE.DoubleSide, vertexColors: true })), true);
    void tiers; this.crowdTex = ct; this.bowl = crowd;
    // fascia wall under the first tier
    const fpos: number[] = [], fidx: number[] = [];
    for (let i = 0; i <= N; i++) { const a = (i / N) * Math.PI * 2, [x, z] = inner(a); fpos.push(x, 0, z, x, 2.6, z); }
    for (let i = 0; i < N; i++) { const a = i * 2; fidx.push(a, a + 2, a + 1, a + 2, a + 3, a + 1); }
    const fas = new THREE.BufferGeometry(); fas.setAttribute("position", new THREE.Float32BufferAttribute(fpos, 3)); fas.setIndex(fidx); fas.computeVertexNormals();
    add(R, fas, lam("fascia", () => ({ color: "#d8d2c4", side: THREE.DoubleSide })));
    // roof band (cantilever) round the top
    const rpos: number[] = [], ruv: number[] = [], ridx: number[] = [];
    for (let i = 0; i <= N; i++) { const a = (i / N) * Math.PI * 2, [x, z] = inner(a), L = Math.hypot(x, z); for (const [o, y] of [[30, 46], [44, 46], [44, 41]]) { rpos.push(x * (1 + o / L), y, z * (1 + o / L)); ruv.push(i / N * 80, y / 5); } }
    for (let i = 0; i < N; i++) for (let j = 0; j < 2; j++) { const a = i * 3 + j, b = (i + 1) * 3 + j; ridx.push(a, b, a + 1, b, b + 1, a + 1); }
    const roof = new THREE.BufferGeometry(); roof.setAttribute("position", new THREE.Float32BufferAttribute(rpos, 3)); roof.setAttribute("uv", new THREE.Float32BufferAttribute(ruv, 2)); roof.setIndex(ridx); roof.computeVertexNormals();
    const rt = repT(roofTex());
    this.roofMesh = add(R, roof, lam("roof", () => ({ map: rt, side: THREE.DoubleSide })));
    // floodlight masts on the rim
    for (const a of [0.6, 2.55, 3.75, 5.7]) { const [x, z] = inner(a), L = Math.hypot(x, z), k = 1 + 46 / L; add(R, box(x * k - 0.6, 30, z * k - 0.6, x * k + 0.6, 62, z * k + 0.6), lam("mast", () => ({ color: "#b9b4ac" }))); add(R, box(x * k - 3, 62, z * k - 1, x * k + 3, 66, z * k + 1), lam("lamps", () => ({ color: "#f1ede0" }))); }
    // corner flags
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      add(R, box(sx * 52.5 - 0.03, 0, sz * 34 - 0.03, sx * 52.5 + 0.03, 1.6, sz * 34 + 0.03), lam("post", () => ({ color: "#f7f7f2" })));
      add(R, box(sx * 52.5 - 0.02, 1.2, sz * 34, sx * 52.5 + 0.02, 1.6, sz * 34 + 0.5), lam("cflag", () => ({ color: "#f2c230" })));
    }
    // dugouts on the far touchline: bench + roof + back wall
    for (const dx of [-14, 14]) {
      add(R, box(dx - 5, 0, -37.6, dx + 5, 2.1, -37.4), lam("dugBack", () => ({ color: "#c9d6e2" })));
      add(R, box(dx - 5.2, 2.1, -37.7, dx + 5.2, 2.25, -35.6), lam("dugRoof", () => ({ color: "#2f5fae" })));
      for (const ex of [-5, 5]) add(R, box(dx + ex - 0.08, 0, -37.6, dx + ex + 0.08, 2.1, -35.8), lam("dugBack", () => ({ color: "#c9d6e2" })));
      add(R, box(dx - 4.6, 0.35, -37.2, dx + 4.6, 0.5, -36.7), lam("bench", () => ({ color: "#8a5a34" })));
    }
    // players' tunnel mouth in the fascia + big hanging banners (plain tricolours, no text)
    add(R, box(-4, 0, -46.6, 4, 2.4, -45.2), lam("tunnel", () => ({ color: "#2a2a34" })));
    const ban = (key: string, cols: string[]) => lam("ban" + key, () => ({ map: ctex("ban" + key, 96, 64, (g) => { cols.forEach((c, i) => { g.fillStyle = c; g.fillRect(0, (i * 64) / cols.length, 96, 64 / cols.length + 1); }); }) }));
    const bans: [number, string, string[]][] = [[-40, "a", ["#8ec9ee", "#ffffff", "#8ec9ee"]], [-24, "m", ["#2f8a4a", "#ffffff", "#d23b35"]], [22, "a", ["#8ec9ee", "#ffffff", "#8ec9ee"]], [38, "e", ["#ffffff", "#d23b35", "#ffffff"]]];
    for (const [bx, k, cols] of bans) for (const sz of [-1, 1]) add(R, box(bx - 4, 0.5, sz * 45.75 - 0.05, bx + 4, 2.4, sz * 45.75 + 0.05), ban(k, cols));
    // TV camera gantry on the near touchline
    add(R, box(-1.2, 0, 41, 1.2, 0.3, 43), lam("gantry", () => ({ color: "#5c5866" })));
    // noon shade thrown by the roof over the far third of the pitch (soft multiply band): gives the bowl depth
    const sh = new THREE.Mesh(ground(-72, 72, -50, 22, 0.012), new THREE.MeshBasicMaterial({ map: roofShadeTex(), blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.ZeroFactor, blendDst: THREE.SrcColorFactor, depthWrite: false, fog: false, toneMapped: false }));
    this.roofShade = sh;
    sh.layers.set(NOINK); sh.renderOrder = 0.2; R.add(sh);
    // goals: white posts + bar, net
    const post = lam("post", () => ({ color: "#f7f7f2" }));
    const nt = repT(netTex());
    const netM = new THREE.MeshLambertMaterial({ map: nt, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, depthWrite: true });
    for (const s of [-1, 1]) {
      const x = s * GX, d = s * 2.0;
      for (const z of [-3.66, 3.66]) add(R, box(x - 0.06, 0, z - 0.06, x + 0.06, 2.44, z + 0.06), post);
      add(R, box(x - 0.06, 2.38, -3.72, x + 0.06, 2.5, 3.72), post);
      const back = new THREE.PlaneGeometry(7.32, 2.44); back.rotateY(Math.PI / 2); back.translate(x + d, 1.22, 0);
      const top = new THREE.PlaneGeometry(2, 7.32); top.rotateX(-Math.PI / 2); top.translate(x + d / 2, 2.44, 0);
      const sideA = new THREE.PlaneGeometry(2, 2.44); sideA.translate(x + d / 2, 1.22, -3.66);
      const sideB = sideA.clone(); sideB.translate(0, 0, 7.32);
      for (const gg of [back, top, sideA, sideB]) {
        const uvA = gg.getAttribute("uv") as THREE.BufferAttribute; for (let i = 0; i < uvA.count; i++) uvA.setXY(i, uvA.getX(i) * 6, uvA.getY(i) * 2.5);
        const m = new THREE.Mesh(gg, netM); m.layers.set(NOINK); R.add(m);
      }
    }
  }

  // ---------------- staging ----------------
  private fig(st: Stage, ch: Char, seed: number, pos: V3, pose: Pose = {}, o: { scale?: number; roll?: number; sx?: number; sy?: number; shadow?: boolean; f?: number } = {}) {
    let ck = CKEY.get(ch); if (!ck) { ck = JSON.stringify(ch); CKEY.set(ch, ck); }
    const light = this.lightAngle, full: Pose = { blink: o.f !== undefined ? lidAt(o.f, seed) : 0, ...pose, light, seed };
    st.places.push({ key: `G|${ck}|${fkey(full)}`, x: pos[0], y: pos[1], z: pos[2], scale: o.scale ?? 1, roll: o.roll, sx: o.sx, sy: o.sy, draw: (p) => figure(p, ch, full) });
    if (o.shadow !== false) this.contact(st, pos[0], pos[2], (o.scale ?? 1) * (pose.legs === "kneel" ? 1.5 : 1), pos[1]);
  }
  /** seated passenger: row index (0 = Gennaro's row), dz from the cabin centre line */
  private sit(st: Stage, ch: Char, seed: number, row: number, dz: number, pose: Pose = {}, f?: number, dy = 0) {
    this.fig(st, ch, seed, [CX + row * 0.85 - 0.03, 0.17 + dy, PZ + dz], { legs: "sit", ...pose }, { shadow: false, f });
  }
  private card(st: Stage, key: string, cw: number, chh: number, draw: (p: Pen) => void, pos: V3, w: number, h: number, o: Partial<FxPlace> = {}) {
    st.fx.push({ key, cw, ch: chh, draw, x: pos[0], y: pos[1], z: pos[2], w, h, ...o });
  }
  /** the shrine's 2D parts: hair, flames, flowers. flames 0..1 = how many candles are lit */
  private shrineFx(st: Stage, f: number, hair: boolean, flames: number, flowers: boolean, old = false) {
    if (hair) this.card(st, "hair", 200, 300, fxHair, [SHX, SHY, SHZ + 0.012], 0.1, 0.15);
    const cands: [number, number, number][] = [[-0.38, 0.2, -4.82], [-0.24, 0.14, -4.82], [0.26, 0.16, -4.82], [0.4, 0.22, -4.82]];
    if (old) cands.push([-0.46, 0.12, -4.76], [-0.31, 0.2, -4.76], [-0.16, 0.1, -4.76], [0.12, 0.18, -4.76], [0.33, 0.1, -4.76], [0.47, 0.15, -4.76]);
    cands.forEach(([dx, h, z], i) => { if (i / 4 < flames || (i >= 4 && flames >= 1)) { const t = Math.round(f * 0.5 + i * 2) % 6; this.card(st, `flame|${t}`, 80, 120, (p) => fxFlame(p, t), [SHX + dx, 1.31 + h + 0.045, z + 0.005], 0.05, 0.075, { glow: 3.2 }); } });
    if (flowers) this.card(st, "flowers", 260, 300, fxFlowers, [SHX - 0.02, 1.53, -4.835], 0.22, 0.25);
  }
  private conf(st: Stage, f: number, cx: number, cy: number, cz: number, n = 46, spread = 5) {
    const cols = ["#62b5e5", "#fbfbf6", "#f2c64a", "#62b5e5", "#f25c7a"];
    for (let i = 0; i < n; i++) { const t = ((f * 0.012 + hs(i, 3)) % 1), x = cx + (hs(i, 1) - 0.5) * spread + 0.3 * Math.sin(f * 0.1 + i), y = cy + 3.2 - t * 4.2, z = cz + (hs(i, 2) - 0.5) * spread * 0.7;
      if (y > 0.05) this.card(st, `conf|${cols[i % 5]}`, 64, 64, (p) => fxConfetti(p, cols[i % 5]), [x, y, z], 0.09, 0.09, { rot: f * 0.2 + i }); }
  }

  private stage(id: number, f: number): Stage {
    const st: Stage = { places: [], fx: [] };
    const c = (x: number, y: number, z: number): V3 => [CX + x, y, z];
    const hop = (i: number, amp = 0.1, sp = 3) => amp * Math.abs(Math.sin(f / sp + i * 1.7));
    const G = (ch: Char, seed: number, pos: V3, pose: Pose = {}, o: Parameters<World["fig"]>[5] = {}) => this.fig(st, ch, seed, pos, pose, { f, ...o });
    const spark = (p: V3, s: number) => this.spark(st, p[0], p[1], p[2], s, f);
    const BAR: V3 = c(-1.7, 0, -4.3);
    switch (id) {
      case 1: { // hook: the famous café, then the hair
        const pol = Math.sin(f * 0.5);
        if (f < 44) G(GENNARO_APRON, 5, BAR, { expr: "smile", armR: "front", holdR: "cup", armL: [-24 + 6 * pol, 46 + 4 * pol, 14], holdL: "rag", facing: 1 });
        else G(GENNARO_APRON, 5, BAR, { expr: "grin", armR: "wave", armL: "hip", facing: 1 });
        const crowd: [Char, number, number, number, Pose][] = [
          [NONNA, 11, 1.05, -3.85, { legs: "kneel", armL: "pray", armR: "pray", back: true }], [folk(3, true), 23, 1.95, -3.7, { legs: "kneel", armL: "pray", armR: "pray", back: true }],
          [TOURIST, 31, 0.35, -3.2, { back: true, armR: "mouth", holdR: "camera" }], [TOURIST2, 32, 2.7, -3.0, { back: true, armL: "mouth", holdL: "phone" }],
          [folk(5, true), 25, 1.45, -2.9, { back: true, armR: "up" }], [folk(8), 28, 0.9, -2.3, { back: true }], [folk(12, true), 29, 2.15, -2.2, { back: true, armL: "up" }],
          [folk(15), 35, -0.2, -2.2, { back: true }], [folk(19, true), 36, 3.0, -4.0, { expr: "grin", facing: -1, armL: "point" }], [folk(22), 37, 0.2, -4.3, { expr: "shock", facing: 1 }],
        ];
        for (const [ch, sd, x, z, pose] of crowd) G(ch, sd, c(x, pose.legs === "kneel" ? 0 : hop(sd, 0.03, 5), z), pose);
        this.shrineFx(st, f, true, 1, true, true);
        for (let i = 0; i < 5; i++) if (hs(i * 3.1 + Math.floor(f / 3) * 7.7, 2) > 0.72) spark(c(0.2 + hs(i, 4) * 2.6, 1.45 + hs(i, 5) * 0.3, -2.3 - hs(i, 6) * 1.2), 0.3);
        if (f > 112) spark([SHX + 0.06, SHY + 0.07, SHZ + 0.03], 0.1);
        break;
      }
      case 2: { // macro: the hand plucks the hair off the headrest
        const down = ramp(f, 131, 146), up = smooth(ramp(f, 150, 172)), hy = 1.12 + up * 0.42, hx = XD - 0.2;
        this.card(st, "hair", 200, 300, fxHair, [hx, hy + (1 - Math.min(1, down * 2)) * 0, ZS + 0.01], 0.085, 0.127, { rot: 0.5 - up * 0.5 });
        this.card(st, "hand", 200, 600, fxHand, [hx - 0.01, hy + 0.33 + (1 - smooth(down)) * 0.3, ZS + 0.02], 0.19, 0.57, { rot: -0.1 });
        G(GENNARO, 5, [XD - 0.82, -0.3, ZS - 0.03], { expr: "shock", sweat: 2, look: 0 }, { shadow: false });
        if (f > 146) spark([hx + 0.05, hy + 0.08, ZS + 0.03], 0.11);
        break;
      }
      case 3: { // the alley; Gennaro waits at his door, a passer-by does not come in
        const px = 7.5 - (f - 176) * 0.12, wav = f > 196 && f < 216;
        G(GENNARO_APRON, 5, c(1.25, 0, 0.6), { expr: wav ? "grin" : "stern", armR: wav ? "wave" : "hang", armL: "low", holdL: "rag", facing: 1 });
        G(folk(4), 41, c(px, 0, 3.3), { legs: "walk", phase: (f - 176) / 16, facing: -1, expr: "neutral", armL: "mouth", holdL: "phone" });
        break;
      }
      case 4: { // empty café; even the flies turn back at the door
        G(GENNARO_APRON, 5, BAR, { expr: "stern", armR: "chin", facing: 1, headTilt: 6 });
        this.card(st, "web", 300, 300, fxWeb, c(0.86, 2.06, -0.02), 0.45, 0.45);
        if (f >= 258) for (const k of [0, 1]) {
          const tin = smooth(ramp(f, 258 + k * 5, 282 + k * 3)), tout = smooth(ramp(f, 292 + k * 3, 310));
          const z = 2.2 - tin * 2.1 + tout * 3.2, x = 1.2 + k * 0.22 + 0.06 * Math.sin(f * 0.6 + k * 2), y = 1.5 + k * 0.12 + 0.05 * Math.sin(f * 0.8 + k) + tout * 0.5;
          this.card(st, `fly|${f % 2}`, 120, 100, (p) => fxFly(p, f % 2), c(x, y, z), 0.17, 0.142, { rot: tout > 0 ? 0.4 : 0 });
        }
        this.card(st, "patch", 256, 256, fxPatch, c(1.25, 0.012, -0.9), 1.5, 2.4, { flat: true, soft: true });
        break;
      }
      case 5: { // night sky: the airliner crosses the moon
        const t = ramp(f, 316, 388), A0 = AIR;
        this.card(st, "moon", 256, 256, fxMoon, [A0[0] + 5, A0[1] + 9, A0[2] - 30], 9, 9, { soft: true, glow: 1.6 });
        this.card(st, "plane", 1200, 420, fxPlane, [A0[0] - 9 + t * 15, A0[1] - 2.5 + t * 4, A0[2]], 17, 5.95, { rot: 0.13 });
        for (let i = 0; i < 9; i++) { const d = 8 + (i % 3) * 14, x = A0[0] + ((hs(i, 1) * 60 - 30 - t * (14 - (i % 3) * 3)) ), y = A0[1] - 9 - hs(i, 2) * 9 + (i % 3) * 1.5;
          this.card(st, `ncloud|${i % 4}`, 512, 256, (p) => fxCloud(p, i % 4), [x, y, A0[2] + 12 - d], 16 + hs(i, 3) * 10, 8 + hs(i, 3) * 5, { soft: true, tint: i % 3 === 0 ? "#6f86d6" : "#4a5fb0" }); }
        break;
      }
      case 6: { // the man asleep in the seat in front; a saint
        const front = f >= 456, realise = f >= 444;
        const others: [number, number, number][] = [[-2, -0.56, 51], [-2, -1.07, 52], [-1, 1.07, 53], [-3, 1.07, 54], [-4, 0.56, 55], [-3, -1.07, 56], [-3, 0.56, 57], [-4, -0.56, 58], [-1, -1.07, 59]];
        for (const [row, dz, sd] of others) this.sit(st, folk(sd, false), sd, row, dz, { expr: sd % 2 ? "smile_closed" : "neutral", facing: front ? 0 : -1, back: false }, f);
        this.sit(st, DIEGO_TRACK, 3, 1, 0.56, { expr: "smile_closed", facing: front ? 0 : -1, headTilt: front ? 9 : -7, blink: 0 });
        if (!front) this.sit(st, GENNARO, 5, 0, 0.56, { expr: realise ? "shock" : f > 420 ? "neutral" : "smile", facing: -1, look: f > 420 ? -1 : 0.5, sweat: realise ? 1 : 0 }, f);
        else G(GENNARO, 5, [XG - 0.05, 0.5, ZS - 0.36], { expr: "shock", sweat: f > 480 ? 2 : 1, armL: f > 500 ? "pray" : "mouth", armR: f > 500 ? "pray" : "hang" }, { shadow: false, scale: 0.96 });
        for (let k = 0; k < 3; k++) { const t = ((f * 0.022 + k / 3) % 1); this.card(st, "z", 120, 120, fxZ, [XD - 0.05 + (front ? 0.24 : -0.2) + t * 0.12, 1.62 + t * 0.34, ZS + (front ? 0.02 : -0.02)], 0.07 + t * 0.05, 0.07 + t * 0.05, { rot: 0.2 }); }
        if (f >= 492) { const s = smooth(ramp(f, 492, 502)), b = 1 + 0.04 * Math.sin(f * 0.25); this.card(st, "halo", 400, 160, fxHalo, [XD - 0.02, 1.9 + 0.02 * Math.sin(f * 0.12), ZS + 0.02], 0.52 * s * b, 0.21 * s * b, { glow: 2.4 });
          for (let k = 0; k < 4; k++) if ((f + k * 5) % 14 < 7) spark([XD - 0.02 + 0.34 * Math.cos(k * 1.6 + f * 0.03), 1.82 + 0.22 * Math.sin(k * 2.1 + f * 0.05), ZS + 0.05], 0.09); }
        break;
      }
      case 7: { // too shy to say hello; two hours staring at the curly head
        if (f < 614) {
          const up = smooth(ramp(f, 556, 572)) * (1 - smooth(ramp(f, 588, 600))), sink = smooth(ramp(f, 592, 606));
          this.sit(st, DIEGO_TRACK, 3, 1, 0.56, { expr: "smile_closed", facing: -1, headTilt: -7, blink: 0 });
          this.sit(st, GENNARO, 5, 0, 0.56, { expr: up > 0.5 ? "whistle" : sink > 0.3 ? "nervous" : "nervous", facing: -1, look: -1, sweat: 2, armL: [lerp(9, 34, up), lerp(98, -58, up), 8] }, f, -0.1 * sink);
          for (const [row, dz, sd] of [[-2, -0.56, 51], [-2, -1.07, 52], [-1, 1.07, 53], [-3, 0.56, 57]]) this.sit(st, folk(sd), sd, row, dz, { expr: "smile_closed", facing: -1 }, f);
          for (let k = 0; k < 3; k++) { const t = ((f * 0.022 + k / 3) % 1); this.card(st, "z", 120, 120, fxZ, [XD - 0.25 + t * 0.12, 1.62 + t * 0.34, ZS - 0.02], 0.07 + t * 0.05, 0.07 + t * 0.05, { rot: 0.2 }); }
        } else if (f < 663) {
          this.sit(st, DIEGO_TRACK, 3, 1, 0.56, { back: true });
          this.sit(st, GENNARO, 5, 0, 0.56, { back: true }, undefined, 0.02);
          for (const [row, dz, sd] of [[4, 1.07, 54], [5, 0.56, 55], [3, -0.56, 60], [4, -1.07, 61]]) this.sit(st, folk(sd), sd, row, dz, { back: true });
          const a = (f - 614) * 0.55; this.card(st, `clock|${Math.round(a * 20)}`, 240, 240, (p) => fxClock(p, a), [XG + 0.35, 1.93, ZS - 0.12], 0.24, 0.24);
        } else if (f < 696) {
          G(GENNARO, 5, [XG - 0.03, 0.17, ZS], { legs: "sit", expr: "shock", sweat: f > 680 ? 2 : 1, blink: 0, look: 0 }, { shadow: false, f: undefined });
        } else {
          this.sit(st, DIEGO_TRACK, 3, 1, 0.56, { back: true });
          if ((f % 20) < 10) spark([XD + 0.02 + 0.1 * Math.sin(f), 1.52, ZS + 0.12], 0.07);
        }
        break;
      }
      case 8: { // landing; Maradona walks off; one black hair on the headrest
        if (f < 795) {
          const bump = f >= W.lands && f < W.lands + 10 ? 0.05 * Math.sin((f - W.lands) * 1.3) * (1 - (f - W.lands) / 10) : 0;
          for (const [row, dz, sd] of [[-2, -0.56, 51], [-2, -1.07, 52], [-1, 1.07, 53], [2, 1.07, 54], [3, 0.56, 55], [3, -1.07, 56], [4, -0.56, 58], [-1, -1.07, 59], [2, -0.56, 60], [5, 0.56, 62], [5, -1.07, 63]]) this.sit(st, folk(sd), sd, row, dz, { back: true }, undefined, bump * (1 + hs(sd, 2)));
          this.sit(st, GENNARO, 5, 0, 0.56, { back: true }, undefined, bump);
          if (f < 762) this.sit(st, DIEGO_TRACK, 3, 1, 0.56, { back: true }, undefined, bump);
          else { const t = ramp(f, 762, 772), x = Math.max(XD + 0.05, diegoWalkX(f)); G(DIEGO_TRACK, 3, [x, 0, lerp(ZS, PZ, smooth(t))], { back: true, legs: f > 768 ? "walk" : "stand", phase: (f - 768) / 14 }, { shadow: true }); }
        } else {
          this.card(st, "hair", 200, 300, fxHair, [XD - 0.2, 1.11, ZS + 0.01], 0.085, 0.127, { rot: 0.5 });
          const pk = smooth(ramp(f, 826, 852));
          G(GENNARO, 5, [XD - 0.82, -0.42 + 0.4 * pk, ZS - 0.02], { expr: "shock", look: 0, sweat: 1 }, { shadow: false });
          if (f > 858) spark([XD - 0.15, 1.2, ZS + 0.04], 0.12);
        }
        break;
      }
      case 9: { // looks left, looks right, slips it into his wallet
        const look = f < 896 ? 0 : f < 922 ? -1 : f < 944 ? 1 : 0, wal = f >= 944, done = f >= 968;
        G(GENNARO, 5, [XD - 0.25, 0, PZ], { expr: done ? "whistle" : "nervous", look: done ? 0.6 : look, sweat: done ? 0 : 2, armR: wal ? [-20, 40, 14] : [24, -40, 8], holdR: done ? undefined : "hair", armL: wal ? "front" : "hang", holdL: wal ? "wallet" : undefined, headTilt: done ? -6 : 0 });
        for (const [row, dz, sd] of [[-2, -0.56, 51], [-1, 1.07, 53], [-3, 0.56, 57]]) this.sit(st, folk(sd), sd, row, dz, { expr: "smile_closed" }, f);
        break;
      }
      case 10: { // back at the café: the golden frame, candles, flowers
        if (f >= 1012) {
          const hung = f >= 1040, fl = ramp(f, W.candles, W.candles + 16), flow = f >= W.flowers;
          G(GENNARO_APRON, 5, c(0.62, 0, -4.4), { expr: f > 1096 ? "grin" : "smile", facing: 1, armR: hung ? (f < W.flowers + 8 && f > W.candles - 6 ? "reach" : "hip") : "reach", holdR: hung ? (f > W.candles - 6 && f < W.candles + 18 ? "candle" : f >= W.candles + 18 && f < W.flowers ? "flower" : undefined) : "frame", armL: hung && f > 1098 ? "hip" : "hang" });
          this.shrineFx(st, f, hung, fl, flow);
          if (f >= 1040 && f < 1060) for (let k = 0; k < 5; k++) spark([SHX + 0.3 * Math.cos(k * 1.26 + f * 0.1), SHY + 0.34 * Math.sin(k * 1.26 + f * 0.1), SHZ + 0.05], 0.16 * (1 - (f - 1040) / 20));
        }
        break;
      }
      case 11: { // his wife: Gennaro, it's a hair
        const close = f >= 1146;
        G(WIFE, 8, c(0.72, 0, -4.3), { expr: "stern", facing: 1, armL: "hip", armR: close ? "point" : "hip", headTilt: close ? 5 : 0 });
        G(GENNARO_APRON, 5, c(2.22, 0, -4.3), { expr: "grin", facing: -1, armL: "point", armR: "hip" }, { sy: 1 + 0.015 * Math.sin(f * 0.4) });
        this.shrineFx(st, f, true, 1, true);
        break;
      }
      case 12: { // next morning: an old lady walks in and kneels
        const p = nonnaAt(f), kn = f >= W.kneels - 2;
        this.card(st, "patch", 256, 256, fxPatch, c(1.25, 0.012, -0.9), 1.5, 2.4, { flat: true, soft: true });
        if (f >= 1192) G(NONNA, 11, p, kn ? { legs: "kneel", armL: "pray", armR: "pray", expr: "smile_closed", facing: 1 } : { legs: "walk", phase: (f - 1196) / 15, armR: "front", holdR: "cane", expr: "smile", facing: -1 });
        G(GENNARO_APRON, 5, BAR, { expr: f > 1230 ? "shock" : "neutral", facing: 1, armR: "front", holdR: "cup", look: 1 });
        if (f >= 1250) G(folk(3, true), 23, c(1.25, 0, lerp(1.2, -1.6, smooth(ramp(f, 1250, 1273)))), { legs: "walk", phase: (f - 1250) / 14, expr: "shock", holdR: "flower", armR: "front" });
        this.shrineFx(st, f, true, 1, true);
        break;
      }
      case 13: { // by lunchtime the queue goes around the block
        for (let i = 0; i < 82; i++) {
          const p = queueAt(i), sd = 100 + i, ch = i % 9 === 4 ? TOURIST : i % 11 === 7 ? NONNA : i % 13 === 5 ? TOURIST2 : folk(i * 3 + 1, i % 2 === 0), back = i >= 3 + 37;
          const r = hs(i, 9), pose: Pose = { facing: back ? 1 : -1, expr: (["neutral", "smile", "grin", "stern", "smile_closed"] as const)[i % 5] };
          if (r < 0.18) { pose.armR = "front"; pose.holdR = "flower"; } else if (r < 0.3) { pose.armR = "front"; pose.holdR = "candle"; } else if (r < 0.4) { pose.armL = "mouth"; pose.holdL = "phone"; } else if (r < 0.48) pose.armR = "up";
          G(ch, sd, [p[0], hop(i, 0.025, 6), p[2]], pose, { f: undefined });
        }
        this.shrineFx(st, f, true, 1, true);
        break;
      }
      case 14: { // why would a whole city pray to a hair?
        this.shrineFx(st, f, true, 1, true);
        if (f >= W.why) { const s = 1 + 0.25 * Math.exp(-(f - W.why) / 4) + 0.03 * Math.sin(f * 0.3); this.card(st, "q", 200, 260, fxQ, [SHX + 0.31, SHY + 0.12, SHZ + 0.08], 0.2 * s, 0.26 * s, { rot: -0.2 + 0.05 * Math.sin(f * 0.2) }); }
        G(NONNA, 11, c(0.95, 0, -3.9), { legs: "kneel", armL: "pray", armR: "pray", back: true });
        G(folk(3, true), 23, c(2.05, 0, -3.85), { legs: "kneel", armL: "pray", armR: "pray", back: true });
        break;
      }
      case 15: { // before him: sad fans and an empty pedestal
        const fans: [number, number, number][] = [[-1.5, 0.3, 201], [-0.75, -0.1, 202], [0.0, 0.25, 203], [2.0, 0.1, 204], [2.7, -0.2, 205]];
        for (const [x, z, sd] of fans) this.fig(st, folk(sd * 3, true), sd, [x, 0, z], { expr: sd % 2 ? "stern" : "pained", headTilt: sd % 2 ? 8 : -8, facing: x < 0.9 ? 1 : -1, armL: sd === 203 ? "chin" : "hang" }, { f });
        this.card(st, "pedestal", 300, 420, fxPedestal, [0.95, 0.5, 0.05], 0.72, 1.0);
        this.contact(st, 0.95, 0.05, 1.3);
        const tx = -6 + (f - 1408) * 0.085; this.card(st, `tumble|${f % 12}`, 200, 200, (p) => fxTumble(p, f * 0.35), [tx, 0.28 + 0.12 * Math.abs(Math.sin(f * 0.2)), 1.3], 0.55, 0.55);
        this.card(st, `fly|${f % 2}`, 120, 100, (p) => fxFly(p, f % 2), [0.95 + 0.3 * Math.sin(f * 0.11), 1.25 + 0.08 * Math.sin(f * 0.23), 0.1], 0.1, 0.085);
        break;
      }
      case 16: { // with him: twice
        const two = f >= W.twice - 3, j = hop(0, 0.22, 3.5);
        this.fig(st, DIEGO, 3, [0, j, 0], { expr: "laugh", armR: "up", holdR: "trophy", armL: two ? "up" : "hip", holdL: two ? "trophy" : undefined }, { f, scale: 0.97, sy: 1 + 0.03 * Math.sin(f / 3.5 * 2) });
        const fans: [number, number, number][] = [[-1.5, -0.6, 201], [-0.8, -1.1, 202], [1.0, -1.0, 203], [1.7, -0.5, 204], [-2.3, -1.3, 205], [2.5, -1.4, 206], [0.1, -1.8, 207]];
        for (const [x, z, sd] of fans) this.fig(st, folk(sd * 3, true), sd, [x, hop(sd, 0.3, 3), z], { expr: sd % 2 ? "laugh" : "grin", armL: "up", armR: "up" }, { f });
        this.conf(st, f, 0, 0, 0.5, 60, 6);
        this.flashes(st, f, 0.2);
        if (f >= W.twice - 3 && f < W.twice + 9) { const t = (f - W.twice + 3) / 12; this.card(st, `burst|${Math.round(t * 12)}`, 500, 500, (p) => fxBurst(p, t), [-0.45, 2.1 + j, 0.05], 1.3, 1.3); }
        spark([0.45, 2.05 + j, 0.05], 0.3); if (two) spark([-0.45, 2.05 + j, 0.05], 0.3);
        break;
      }
      case 17: { // not a footballer: a miracle (the mural at night)
        const ppl: [number, number, number][] = [[-3.2, 1.2, 301], [-4.4, 3.3, 302], [-5.6, 2.2, 303], [-7.2, 1.4, 304], [-7.9, 3.4, 305], [-9.3, 2.4, 306], [-10.4, 1.5, 307], [-10.9, 3.5, 308]];
        for (const [x, z, sd] of ppl) G(sd === 304 ? NONNA : folk(sd * 3, true), sd, c(x, 0, z), sd > 305 ? { back: true, legs: "kneel", armL: "pray", armR: "pray" } : { back: true, armR: sd % 2 ? "up" : "hang" });
        for (let i = 0; i < 12; i++) { const t = Math.round(f * 0.5 + i * 2) % 6; this.card(st, `flame|${t}`, 80, 120, (p) => fxFlame(p, t), c(-13.55 + (i % 3) * 0.16, 0.2 + (i % 3) * 0.05, 0.9 + i * 0.3), 0.12, 0.18, { glow: 3 }); }
        if (f > 1600) for (let k = 0; k < 6; k++) if ((f + k * 7) % 18 < 8) spark(c(-13.7, 7.4 + 2.6 * Math.sin(k * 1.9 + f * 0.02), 2.45 + 2.0 * Math.cos(k * 1.3 + f * 0.03)), 0.5);
        break;
      }
      case 18: { // every miracle needs a relic
        this.shrineFx(st, f, true, 1, true);
        G(NONNA, 11, c(0.9, 0, -3.9), { legs: "kneel", armL: "pray", armR: "pray", back: true });
        G(folk(3, true), 23, c(2.1, 0, -3.85), { legs: "kneel", armL: "pray", armR: "pray", back: true });
        if (f >= W.relic - 2) { spark([SHX + 0.05, SHY + 0.08, SHZ + 0.04], 0.14); for (let k = 0; k < 6; k++) if ((f + k * 3) % 12 < 7) spark([SHX + 0.26 * Math.cos(k * 1.05 + f * 0.06), SHY + 0.3 * Math.sin(k * 1.05 + f * 0.06), SHZ + 0.05], 0.09); }
        break;
      }
      case 19: { // thirty years later: still on that wall
        this.shrineFx(st, f, true, 1, true, true);
        G(GENNARO_OLD, 5, BAR, { expr: "smile", facing: 1, armR: "front", holdR: "cup", armL: "low", holdL: "rag" });
        const crowd: [Char, number, number, number, Pose][] = [
          [TOURIST, 31, 0.7, -3.3, { back: true, armR: "mouth", holdR: "camera" }], [TOURIST2, 32, 2.3, -3.2, { back: true, armL: "mouth", holdL: "phone" }], [folk(5, true), 25, 1.5, -3.0, { back: true, armR: "up" }],
          [folk(9), 28, 0.2, -2.5, { back: true }], [folk(12, true), 29, 2.9, -2.4, { back: true, armL: "up" }], [folk(15), 35, 1.1, -2.2, { back: true, armR: "mouth", holdR: "phone" }], [folk(33), 38, 2.0, -1.9, { back: true }],
          [NONNA, 11, 1.45, -3.9, { legs: "kneel", armL: "pray", armR: "pray", back: true }],
        ];
        for (const [ch, sd, x, z, pose] of crowd) G(ch, sd, c(x, pose.legs === "kneel" ? 0 : hop(sd, 0.03, 5), z), pose);
        for (let i = 0; i < 5; i++) if (hs(i * 3.1 + Math.floor(f / 3) * 7.7, 2) > 0.7) spark(c(0.3 + hs(i, 4) * 2.4, 1.45 + hs(i, 5) * 0.3, -2.2 - hs(i, 6) * 1.2), 0.3);
        this.card(st, "patch", 256, 256, fxPatch, c(1.25, 0.012, -0.9), 1.5, 2.4, { flat: true, soft: true });
        break;
      }
      default: { // want a photo? one rule: first, you buy a coffee
        this.shrineFx(st, f, true, 1, true, true);
        this.card(st, "patch", 256, 256, fxPatch, c(1.25, 0.012, -0.9), 1.5, 2.4, { flat: true, soft: true });
        if (f < 1807) {
          const up = smooth(ramp(f, 1782, 1794));
          G(TOURIST, 31, c(1.28, 0, -2.4), { expr: "grin", armR: [lerp(9, -26, up), lerp(98, -4, up), 18], holdR: "camera", armL: up > 0.5 ? [-22, 2, 20] : "hang" });
          G(TOURIST2, 32, c(0.55, 0, -1.5), { expr: "smile", armL: "mouth", holdL: "phone", facing: 1 }); G(folk(12, true), 29, c(2.05, 0, -1.4), { expr: "grin", facing: -1 }); G(folk(9), 28, c(1.3, 0, -0.6), { expr: "neutral" });
          if (f >= 1798 && f < 1802) spark(c(1.2, 1.42, -2.5), 0.9);
        } else if (f < 1837) {
          const up = smooth(ramp(f, 1809, 1820));
          G(GENNARO_OLD, 5, BAR, { expr: "stern", facing: 1, armR: [lerp(9, 46, up), lerp(98, -66, up), 6], armL: "hip", headTilt: -4 });
        } else {
          const sl = outQ(ramp(f, 1840, 1864)), cx = lerp(-2.9, -1.74, sl);
          G(GENNARO_OLD, 5, BAR, { expr: f > 1866 ? "grin" : "smile", facing: 1, armR: "hip", armL: [lerp(9, 30, sl), 40, 10] });
          this.card(st, `esp|${Math.round(f * 0.25) % 7}`, 300, 300, (p) => fxEspresso(p, (Math.round(f * 0.25) % 7) * 0.9), c(cx, 1.245, -3.6), 0.2, 0.2);
          if (f >= 1870) { const t = ramp(f, 1870, 1880), b = t < 1 ? 0 : 0.03 * Math.abs(Math.sin((f - 1880) * 0.8)) * Math.max(0, 1 - (f - 1880) / 8); this.card(st, "coin", 120, 120, fxCoin, c(-1.5, 1.19 + (1 - t * t) * 0.5 + b, -3.52), 0.075, 0.075, { rot: f * 0.4 * (1 - t) }); }
        }
        break;
      }
    }
    return st;
  }

  private contact(st: Stage, x: number, z: number, s = 1, y = 0) {
    const cc = this.light === "day" ? "#55556e" : this.light === "night" ? "#3a3a66" : "#5e5070";
    st.fx.push({ key: `blob|contact|${cc}`, cw: 128, ch: 128, draw: (p) => fxContact(p, cc), x, y: y + 0.02, z, w: 0.6 * s, h: 0.45 * s, flat: true });
  }
  private ball(st: Stage, x: number, y: number, z: number, f: number, shadow = true) {
    const spin = Math.round((f * 0.35) % (Math.PI * 2 / 5) * 10) / 10;
    st.fx.push({ key: `ball|${spin}`, cw: 256, ch: 256, draw: (p) => fxBall(p, spin), x, y: y + 0.11, z, w: 0.24, h: 0.24 });
    if (shadow) this.contact(st, x, z, 0.45 * Math.max(0.3, 1 - y / 6));
  }

  /** camera flashes twinkling in the stands */
  private flashes(st: Stage, f: number, rate: number) {
    for (let i = 0; i < 90; i++) {
      if (hs(i * 7.3 + Math.floor(f / 2) * 13.1, 5) > rate) continue;
      const [x, y, z] = standPt(hs(i, 1) * Math.PI * 2, 3 + hs(i, 2) * 33);
      const sz = 3 + 3 * hs(i, 8); st.fx.push({ key: "flash", cw: 128, ch: 128, draw: fxFlash, x, y, z, w: sz, h: sz, soft: true, glow: 4, rot: i });
    }
  }
  private spark(st: Stage, x: number, y: number, z: number, s: number, f: number) {
    st.fx.push({ key: "flash", cw: 128, ch: 128, draw: fxFlash, x, y, z, w: s, h: s, soft: true, glow: 2.5, rot: f * 0.12 });
    st.fx.push({ key: "flash", cw: 128, ch: 128, draw: fxFlash, x: x + s * 0.55, y: y + s * 0.4, z, w: s * 0.4, h: s * 0.4, soft: true, glow: 2.5, rot: -f * 0.2 });
  }
  private puffs(st: Stage, f: number, at: (fe: number) => [number, number], every = 6, life = 16, size = 0.7) {
    for (let k = 0; k < Math.ceil(life / every); k++) {
      const fe = Math.floor((f - k * every) / every) * every, t = (f - fe) / life;
      if (t < 0 || t >= 1) continue;
      const [x, z] = at(fe);
      st.fx.push({ key: `puff|${Math.round(t * 16)}`, cw: 300, ch: 260, draw: (p) => fxPuff(p, t), x, y: 0.22 + t * 0.2, z, w: size, h: size * 0.87, soft: true });
    }
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
    cam.fov = c.fov; cam.near = 0.1; cam.far = 1500; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    cam.layers.enable(NOINK);
    const focus = new THREE.Vector3(...c.look), dist = cam.position.distanceTo(focus);
    // camera-relative sun, frozen per shot (from the shot's first camera)
    const c0 = camAt(id, s.a), fx = c0.look[0] - c0.pos[0], fz = c0.look[2] - c0.pos[2], fl = Math.hypot(fx, fz) || 1;
    const yaw = s.sun ? THREE.MathUtils.degToRad(s.sun[0]) : Math.atan2(fx / fl, fz / fl) - THREE.MathUtils.degToRad(L.az);
    const el = THREE.MathUtils.degToRad(s.sun ? s.sun[1] : L.el);
    this.sunDir.set(Math.sin(yaw) * Math.cos(el), Math.sin(el), Math.cos(yaw) * Math.cos(el)).normalize();
    this.cam.copy(cam.position); this.right.set(1, 0, 0).applyQuaternion(cam.quaternion);
    this.lightAngle = Math.round(Math.atan2(-this.sunDir.y, this.sunDir.dot(this.right)) / (Math.PI / 4)) * (Math.PI / 4);
    this.hemi.color.set(L.sky); this.hemi.groundColor.set(L.ground); this.hemi.intensity = L.hemiI;
    this.sun.color.set(L.sunCol); this.sun.intensity = L.sunI;
    let Rr = THREE.MathUtils.clamp(dist * 1.15 + 7, 12, 95);
    if (s.light === "golden") Rr = Math.max(Rr, 30);
    if (s.place === "alley") Rr = Math.max(Rr, 26);
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
    this.fog.near = s.place === "stadium" ? 90 : L.fogNear; this.fog.far = s.place === "stadium" ? 600 : L.fogFar;
    if (s.place === "plane") { this.fog.near = 60; this.fog.far = 900; }
    if (s.place === "air") { this.fog.near = 80; this.fog.far = 700; }
    if (s.place === "cafe" || s.place === "alley") { this.fog.near = s.light === "night" ? 22 : 30; this.fog.far = s.light === "night" ? 150 : 260; }
    const night = s.light === "night";
    for (const nm of NIGHT_MATS) nm.m.emissiveIntensity = night ? nm.k : 0;
    for (const lm of LAMP_MATS) { const h = (lm.userData as { hot: [number, number, number] }).hot, k = night || s.place === "plane" ? 1 : 0.5; lm.color.setRGB(h[0] * k, h[1] * k, h[2] * k); }
    this.refs.wallOld.visible = s.wall === "old"; this.refs.wallNew.visible = s.wall !== "old";
    this.refs.shrine.visible = !!s.shrine && !(id === 10 && f < 1040); this.refs.shrineOld.visible = !!s.old;
    this.starPts.visible = night && s.place !== "plane" && s.place !== "cafe"; this.starPts.position.copy(cam.position);
    const lamps = lampsAt(id, f);
    this.lamps.forEach((l, i) => { const d = lamps[i]; if (d) { l.position.set(...d.p); l.color.set(d.c); l.intensity = d.i; l.distance = d.d; } else l.intensity = 0; });
    scene.fog = this.fog; scene.background = null;
    this.sunDisc.visible = s.light === "golden";
    this.sunDisc.position.copy(cam.position).addScaledVector(this.sunDir, 900); this.sunDisc.scale.setScalar(2 * 900 * Math.tan(THREE.MathUtils.degToRad(1.7)));
    this.clouds.forEach((m, i) => {
      const a = (i / 10) * Math.PI * 2 + 0.3, d = 620 + (i % 3) * 60, w = 130 + (i % 4) * 30;
      m.position.set(cam.position.x + Math.cos(a) * d, 110 + (i % 4) * 40, cam.position.z + Math.sin(a) * d); m.scale.set(w, w / 2, 1);
      m.lookAt(cam.position.x, m.position.y, cam.position.z); (m.material as THREE.MeshBasicMaterial).map = this.cloudMaps[s.light === "golden" ? "golden" : "day"][i % 4]; m.visible = !night;
    });
    this.roofShade.visible = s.place === "stadium" && s.light === "day"; this.bowl.castShadow = this.roofMesh.castShadow = s.light === "day";
    const roar = id === 16;
    this.crowdTex.offset.y = roar ? 0.01 * Math.sin(f * 1.1) : 0.003 * Math.sin(f * 0.4);
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
      else m.rotation.set(0, yawA, p.roll ?? 0);
      m.scale.set((p.mirror ? -1 : 1) * p.scale * (p.sx ?? 1), p.scale * (p.sy ?? 1), p.scale);
      m.castShadow = s.light === "golden";
    }
    for (const { e, p } of fr) {
      e.use(!!p.soft); e.bind(); if (p.tint) { e.soft.color.set(p.tint).multiplyScalar(p.glow ?? 1); e.mat.color.set(p.tint).multiplyScalar(p.glow ?? 1); } else { e.soft.color.setScalar(p.glow ?? 1); e.mat.color.setScalar(p.glow ?? 1); }
      const m = e.mesh; m.visible = true; m.position.set(p.x, p.y, p.z); m.scale.set(p.w, p.h, 1);
      if (p.flat) m.rotation.set(-Math.PI / 2, 0, p.rot ?? 0);
      else { m.rotation.set(0, 0, 0); m.lookAt(cam.position); if (p.rot) m.rotateZ(p.rot); }
    }
    return focus;
  }
}

