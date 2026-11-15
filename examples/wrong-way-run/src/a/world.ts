// The world of "Al revés": the stadium bowl with an American football field. Same look modules as
// the earlier shorts (two-tone world, lit cards, ink, lens, grade) plus real point lights and a night preset.
// update(id, f, cam, scene) poses everything for shot id at frame f (pure function of id + f).
import * as THREE from "three";
import { Pool, Actor, Fx, SU } from "./pool";
import { NOINK } from "./ink";
import { TONE, CHAR, untone } from "./shade";
import { LIGHTS, LOOK, LightK } from "./lights";
import { ctex, rep, rng, grassHD, facadeHD, cloudHD } from "./paint";
import { Pen, figure, Char, Pose, fxBurst, fxContact, fxPuff, fxStars, fxRing, fxCloud, INK } from "./toon";
import { fxBall, fxCup, fxConfetti, fxQ, fxFlash } from "./props";
import { fxFootball, fxScore, fxCompass, fxClubCard, fxEnvelope, fxDash, fxSwirl, fxRoar, fxLeaf, fxWeather, fxThumb } from "./gear";
import { FPS, SHOTS, B, V3, camAt, smooth, clamp01, lerp, ramp, lampsAt, runX, PICK, EZ, BENCH_Z, BOARD } from "./story";
import { lam, add, box, ground, repT } from "./kit";
import { NIGHT_MATS, LAMP_MATS } from "./sets";
import { MARSHALL, MARSHALL_BARE, MARSHALL_OLD, MARSHALL_OLD_BARE, viking, niner, NINER_OLD, OLDTIMER, oldmate, COACH, REF, POSTMAN } from "./cast";
const GX = 52.5;
const CKEY = new WeakMap<Char, string>();
const outQ = (x: number) => 1 - (1 - clamp01(x)) ** 3;
void [FPS, SU, rep, rng, grassHD, facadeHD, fxPuff, fxStars, fxRing, fxCloud, INK, box, lerp];

// ---------------- painted textures ----------------
const pitchTex = () => ctex("gridiron2", 2400, 1066, (g) => {
  // 120 x 53.3 yards at 20 px/yd: purple end zone on the left (-x), red on the right (drawn flipped in y: the plane maps canvas-top to +z)
  g.translate(0, 1066); g.scale(1, -1);
  for (let i = 0; i < 24; i++) { g.fillStyle = i % 2 ? "#4c9f48" : "#57ae50"; g.fillRect(i * 100, 0, 100, 1066); }
  const ez = (x: number, col: string) => { g.save(); g.beginPath(); g.rect(x, 0, 200, 1066); g.clip(); g.fillStyle = col; g.fillRect(x, 0, 200, 1066); g.strokeStyle = "rgba(255,255,255,0.3)"; g.lineWidth = 22; for (let k = -8; k < 10; k++) { g.beginPath(); g.moveTo(x + k * 110, 1066); g.lineTo(x + k * 110 + 420, 0); g.stroke(); } g.restore(); };
  ez(0, "#5a3a9a"); ez(2200, "#c4202e");
  g.strokeStyle = "#f7f7f2"; g.fillStyle = "#f7f7f2";
  for (let x = 200; x <= 2200; x += 100) { g.lineWidth = x === 200 || x === 2200 ? 14 : 7; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 1066); g.stroke(); }
  for (let x = 220; x < 2200; x += 20) if (x % 100) for (const y of [14, 372, 694, 1052]) g.fillRect(x - 2, y - 12, 4, 24);
  g.font = "bold 92px Arial, Helvetica, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
  for (let k = 1; k <= 9; k++) { const n = String((k <= 5 ? k : 10 - k) * 10), x = 200 + k * 200; g.fillText(n, x, 900); g.save(); g.translate(x, 166); g.rotate(Math.PI); g.fillText(n, 0, 0); g.restore(); }
  g.lineWidth = 16; g.strokeRect(8, 8, 2384, 1050);
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
type FxPlace = { key: string; cw: number; ch: number; draw: (p: Pen) => void; x: number; y: number; z: number; w: number; h: number; flat?: boolean; fixed?: boolean; yaw?: number; rot?: number; soft?: boolean; glow?: number; tint?: string };
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
    
    for (let i = 0; i < 6; i++) { const l = new THREE.PointLight("#ffffff", 0, 8, 2); this.lamps.push(l); R.add(l); }
    { const n = 500, pos = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const a = hs(i, 1) * Math.PI * 2, e = 0.08 + hs(i, 2) * 1.3, r = 900; pos[i * 3] = r * Math.cos(a) * Math.cos(e); pos[i * 3 + 1] = r * Math.sin(e); pos[i * 3 + 2] = r * Math.sin(a) * Math.cos(e); }
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      this.starPts = new THREE.Points(g, new THREE.PointsMaterial({ color: new THREE.Color(2.2, 2.2, 2.0), size: 2.6, sizeAttenuation: false, fog: false, depthWrite: false })); this.starPts.layers.set(NOINK); this.starPts.frustumCulled = false; R.add(this.starPts); }
    for (let i = 0; i < 96; i++) this.actors.push(new Actor(R));
    for (let i = 0; i < 240; i++) this.fxs.push(new Fx(R));
  }

  private buildStadium(R: THREE.Object3D) {
    const pitch = pitchTex(); pitch.anisotropy = 16;
    add(R, ground(-58, 58, -34, 34, 0), lam("turf", () => ({ color: "#4f9f48" })), false);
    add(R, ground(-54.86, 54.86, -24.38, 24.38, 0.006), lam("pitch", () => ({ map: pitch })), false);
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
    // team benches on both sidelines, water coolers
    for (const [sz, col] of [[-1, "#5a3a9a"], [1, "#c4202e"]] as [number, string][]) {
      add(R, box(-9, 0.4, sz * 27.6 - 0.25, 9, 0.47, sz * 27.6 + 0.25), lam("bench", () => ({ color: "#8a5a34" })));
      for (const bx of [-8.6, -3, 3, 8.6]) add(R, box(bx - 0.06, 0, sz * 27.6 - 0.2, bx + 0.06, 0.4, sz * 27.6 + 0.2), lam("benchLeg", () => ({ color: "#5c5866" })));
      add(R, box(10.2, 0, sz * 27.6 - 0.3, 10.9, 0.9, sz * 27.6 + 0.3), lam("cooler" + sz, () => ({ color: col })));
      add(R, box(10.25, 0.9, sz * 27.6 - 0.25, 10.85, 1.0, sz * 27.6 + 0.25), lam("coolerTop", () => ({ color: "#f7f5ee" })));
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
    // H goalposts on the goal lines (as in 1964), pylons, the scoreboard behind the purple end zone
    const post = lam("post", () => ({ color: "#f7f7f2" }));
    for (const s of [-1, 1]) {
      const x = s * 45.72;
      for (const z of [-2.82, 2.82]) add(R, box(x - 0.07, 0, z - 0.07, x + 0.07, 9.2, z + 0.07), post);
      add(R, box(x - 0.07, 2.98, -2.82, x + 0.07, 3.12, 2.82), post);
      for (const ex of [45.72, 54.86]) for (const z of [-24.38, 24.38]) add(R, box(s * ex - 0.08, 0, z - 0.08, s * ex + 0.08, 0.45, z + 0.08), lam("pylon", () => ({ color: "#f2742c" })));
    }
    const dark = lam("sbDark", () => ({ color: "#2a2f3a" }));
    for (const z of [-3, 3]) add(R, box(-60.4, 0, z - 0.25, -59.9, 5.2, z + 0.25), dark);
    add(R, box(-60.5, 5.3, -3.3, -60.0, 9.6, 3.3), dark);
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
    const cols = ["#5a3a9a", "#fbfbf6", "#f6c419", "#5a3a9a", "#fbfbf6"];
    for (let i = 0; i < n; i++) { const t = ((f * 0.012 + hs(i, 3)) % 1), x = cx + (hs(i, 1) - 0.5) * spread + 0.3 * Math.sin(f * 0.1 + i), y = cy + 3.2 - t * 4.2, z = cz + (hs(i, 2) - 0.5) * spread * 0.7;
      if (y > 0.05) this.card(st, `conf|${cols[i % 5]}`, 64, 64, (p) => fxConfetti(p, cols[i % 5]), [x, y, z], 0.09, 0.09, { rot: f * 0.2 + i }); }
  }

  private stage(id: number, f: number): Stage {
    const st: Stage = { places: [], fx: [] };
    const S = SHOTS[id - 1], a = S.a, mx = runX(id, f);
    const hop = (i: number, amp = 0.1, sp = 3) => amp * Math.abs(Math.sin(f / sp + i * 1.7));
    const G = (ch: Char, seed: number, pos: V3, pose: Pose = {}, o: Parameters<World["fig"]>[5] = {}) => this.fig(st, ch, seed, pos, pose, { f, ...o });
    const K = (key: string, cw: number, chh: number, draw: (p: Pen) => void, pos: V3, w: number, h: number, o: Partial<FxPlace> = {}) => this.card(st, key, cw, chh, draw, pos, w, h, o);
    const spark = (p: V3, s: number) => this.spark(st, p[0], p[1], p[2], s, f);
    const pop = (f0: number, n = 8) => { const t = clamp01((f - f0) / n); return f < f0 ? 0 : 1 + 0.35 * Math.sin(t * Math.PI) * (1 - t); };
    const ball = (pos: V3, ang = 0, s = 1) => { const aq = Math.round(ang * 6) / 6; K(`fb|${aq}`, 240, 160, (p) => fxFootball(p, aq), pos, 0.44 * s, 0.293 * s); };
    const run = (ph = 0): Pose => ({ legs: "run", phase: (f - a) / 7 + ph });
    const score = (x: number, y: number, flash = 0) => K(`score|${x}|${y}|${flash}`, 800, 500, (p) => fxScore(p, x, y, flash), BOARD, 6.0, 3.75, { fixed: true, yaw: Math.PI / 2 });
    const dust = (x0: number, dir: number) => this.puffs(st, f, (fe) => [x0 + dir * 0.0 + (fe - f) * 0.0, 0.2], 5, 14, 0.6);
    /** the purple bench: coach + five players reacting */
    const bench = (wild: boolean) => {
      G(COACH, 40, [-3.9, wild ? hop(0, 0.08, 2.5) : 0, -26.3], wild ? { expr: "shock", facing: 1, armR: "point", armL: "up" } : { expr: "stern", armL: "hip", armR: "hip" });
      [[-5.7, 0], [-4.8, 1], [-3.0, 2], [-2.2, 3], [-1.4, 4], [-0.6, 5]].forEach(([x, i]) => G(viking(i + 1), 41 + i, [x, wild ? hop(i, 0.12, 2.2 + (i % 3) * 0.4) : 0, -26.5 + (i % 2) * 0.25], wild ? { expr: i % 2 ? "shock" : "pained", facing: 1, armR: i % 3 === 0 ? "up" : "point", armL: i % 2 ? "up" : "point" } : { expr: "neutral" }));
    };
    const dashes = (n: number, lead = true) => { for (let i = 0; i < n; i++) { const x = 12.4 - i * 3.3, last = i === n - 1 && lead; K(last ? "dashH" : "dash", 300, 120, (p) => fxDash(p, last), [x, 0.03, 0], last ? 5.4 : 2.5, last ? 2.6 : 1.5, { flat: true }); } };
    switch (id) {
      case 1: { // cold open: he runs, ball under his arm, two team-mates chasing
        G(MARSHALL, 5, [mx, 0, 0], { ...run(), facing: -1, expr: "grin", armR: "front", holdR: "football", armL: [30, 30, 10] });
        G(viking(1), 21, [mx + 3.4, 0, 1.6], { ...run(0.3), facing: -1, expr: "shock", armL: "up", armR: "up" }); G(viking(2), 22, [mx + 5.2, 0, -1.8], { ...run(0.6), facing: -1, expr: "pained", armR: "reach", armL: "up" });
        this.puffs(st, f, (fe) => [runX(1, fe) + 0.5, 0.15], 5, 14, 0.55); bench(true);
        break;
      }
      case 2: { // into the end zone: the ball goes up, arms up
        const inK = smooth(ramp(f, a, a + 14)), x = lerp(-45.2, EZ[0], inK), cel = f >= B.celeb, t = (f - B.celeb) / 22;
        G(MARSHALL, 5, [x, cel ? hop(0, 0.16, 2.6) : 0, 0], cel ? { expr: "laugh", armL: "up", armR: "up" } : { ...run(), facing: -1, expr: "grin", armR: "front", holdR: "football" });
        if (cel) ball([EZ[0] - 0.5 - t * 1.2, 2.3 + 3.2 * Math.sin(Math.min(1, t) * Math.PI * 0.9), 0.2], f * 0.5); if (cel) spark([EZ[0] + 0.5, 2.5, 0.2], 0.3 * pop(B.celeb, 10));
        this.flashes(st, f, 0.12); score(27, 17);
        break;
      }
      case 3: { // the scoreboard: two points... for the other team
        const fl = f >= B.gift + 12; score(27, fl ? 19 : 17, fl && Math.floor((f - B.gift) / 4) % 2 ? 1 : 0);
        G(MARSHALL, 5, [-52.6, 0, 0.5], fl ? { back: true, armL: "hang", armR: "hang" } : { back: true, armL: "up", armR: "up" });
        if (fl) spark([-59.6, 6.6, 3.2], 1.2 * pop(B.gift + 12, 10));
        break;
      }
      case 4: { // Jim Marshall: rivals bounce off him
        G(MARSHALL_BARE, 5, [0, 0, 0], { expr: "stern", armL: "hip", armR: "front", holdR: "helmetP" });
        [[1, B.duros, 31], [-1, B.duros + 14, 32]].forEach(([sd, f0, seed]) => { const hit = f >= f0, t = hit ? (f - f0) / 14 : 0, x = hit ? sd * (0.56 + Math.min(1, t) * 0.2) : sd * (0.56 + (f0 - f) * 0.34);
          if (x * sd < 7) G(niner(seed), seed, [x, hit ? 0.35 * Math.sin(Math.min(1, t) * Math.PI) : 0, 0.15 * sd], hit ? { expr: "dazed", armL: "up", armR: "up" } : { ...run(seed), facing: -sd as -1 | 1, expr: "stern" }, { roll: hit ? -sd * Math.min(1, t) * 0.4 : 0, scale: 0.92 });
          if (hit && t < 0.4) K("burst|" + Math.round(t * 20), 500, 500, (p) => fxBurst(p, t / 0.4), [sd * 0.6, 1.2, 0.2], 1.1, 1.1); if (hit) this.stars(st, sd * 0.8, 1.95, 0.2, f); });
        this.flashes(st, f, 0.1);
        break;
      }
      case 5: { // the line of scrimmage: the quarterback is hit, the ball pops loose
        const rush = smooth(ramp(f, B.suelto - 12, B.suelto)), hit = f >= B.suelto, t = (f - B.suelto) / 16;
        for (let i = 0; i < 5; i++) { G(viking(i + 2), 50 + i, [17.3, 0, (i - 2) * 1.6], { expr: "stern", facing: 1, armL: "front", armR: "front" }); G(niner(i + 2), 60 + i, [18.9, 0, (i - 2) * 1.6], { expr: "stern", facing: -1, armL: "front", armR: "front" }); }
        G(niner(1), 66, [21.4, hit ? 0.25 : 0, 0], hit ? { expr: "dazed", armL: "up", armR: "up" } : { expr: "nervous", armR: "up", holdR: "football", facing: -1 }, { roll: hit ? Math.min(1, t) * 1.3 : 0 });
        G(MARSHALL, 5, [lerp(17.3, 20.7, rush), 0, 2.6 - rush * 2.2], { ...run(), facing: 1, expr: "stern", armL: "reach", armR: "reach" });
        if (hit) { const u = Math.min(1, t); ball([lerp(21, PICK[0], u), 0.16 + 1.5 * Math.abs(Math.sin(u * Math.PI * 2)) * (1 - u), lerp(0.2, PICK[2], u)], f * 0.6); if (t < 0.35) K("burst|" + Math.round(t * 20), 500, 500, (p) => fxBurst(p, t / 0.35), [21, 1.1, 0.2], 1.3, 1.3); this.stars(st, 21.4, 1.2, 0.2, f); }
        G(REF, 70, [19.5, 0, -7.5], { expr: "neutral" });
        break;
      }
      case 6: { // he scoops it up, spins... and takes off
        const got = f >= a + 8, spin = f >= B.gira && f < B.corre, go = f >= B.corre, x = go ? PICK[0] - (f - B.corre) * 0.2 : PICK[0];
        if (!got) ball([PICK[0] - 0.25, 0.16, PICK[2] + 0.1], 0.3);
        G(MARSHALL, 5, [x, 0, PICK[2]], go ? { ...run(), facing: -1, expr: "grin", armR: "front", holdR: "football" } : spin ? { expr: "dazed", armR: "front", holdR: "football", facing: Math.floor((f - B.gira) / 3) % 2 ? 1 : -1 } : got ? { expr: "grin", armR: "front", holdR: "football" } : { legs: "kneel", armL: "low", armR: "low", expr: "shock" }, { sx: spin ? Math.cos((f - B.gira) * 0.85) : 1 });
        if (spin) { const t = Math.round((f * 0.5) % 6.28 * 4) / 4; K(`swirl|${t}`, 400, 300, (p) => fxSwirl(p, t), [PICK[0], 0.9, PICK[2] + 0.2], 1.5, 1.1); }
        if (go) this.puffs(st, f, (fe) => [PICK[0] - (fe - B.corre) * 0.2 + 0.5, PICK[2]], 5, 14, 0.6);
        G(niner(3), 62, [18.4, 0, -1.4], { expr: "shock", facing: -1 }); G(viking(3), 52, [17.0, 0, 3.2], { expr: go ? "shock" : "neutral", facing: -1, ...(go ? { armL: "up", armR: "up" } : {}) });
        break;
      }
      case 7: { // nobody catches him: his own team chases, the others just watch
        G(MARSHALL, 5, [mx, 0, 0], { ...run(), facing: -1, expr: "grin", armR: "front", holdR: "football" });
        [[5.5, 2.0], [7.6, -1.6], [9.4, 0.6]].forEach(([dx, z], i) => G(viking(i + 1), 21 + i, [mx + dx, 0, z], { ...run(i * 0.3), facing: -1, expr: "shock", armL: "up", armR: i % 2 ? "reach" : "up" }));
        [[13, -5], [16.5, 4.5], [19, -1], [22, 6.5]].forEach(([x, z], i) => G(niner(i + 2), 60 + i, [x, 0, z], { expr: i % 2 ? "shock" : "grin", facing: -1, armL: i % 2 ? "chin" : "hip", armR: "hip" }));
        G(niner(0), 77, [mx + 12, 0, -2.2], { ...run(0.5), facing: -1, expr: "grin" });
        this.puffs(st, f, (fe) => [runX(7, fe) + 0.5, 0], 5, 14, 0.6); bench(true);
        break;
      }
      case 8: bench(true); break;
      case 9: { // he thinks they are cheering him on
        G(MARSHALL, 5, [mx, 0, 0], { ...run(), facing: -1, expr: "laugh", armR: "front", holdR: "football", armL: "wave" });
        this.puffs(st, f, (fe) => [runX(9, fe) + 0.5, 0.15], 5, 14, 0.55); spark([mx - 0.5, 2.0, 0.3], 0.16);
        G(viking(1), 21, [mx + 4.2, 0, 1.4], { ...run(0.3), facing: -1, expr: "pained", armL: "up", armR: "up" });
        break;
      }
      case 10: { // he reaches the end and throws the ball into the stands, happy
        const inK = smooth(ramp(f, a, a + 16)), x = lerp(-44.8, EZ[0], inK), thr = f >= B.lanza, t = (f - B.lanza) / 20;
        G(MARSHALL, 5, [x, thr ? hop(0, 0.14, 2.6) : 0, 0], thr ? (t < 0.5 ? { back: true, armR: "up", armL: "hip" } : { expr: "laugh", armL: "up", armR: "up" }) : { ...run(), facing: -1, expr: "grin", armR: "front", holdR: "football" });
        if (thr && t < 1.4) ball([EZ[0] - 0.6 - t * 12, 2.3 + 5.5 * Math.sin(Math.min(1.4, t) * 1.6), 0.2 + t * 1.2], f * 0.6, 1 + t * 0.6);
        this.flashes(st, f, 0.14); score(27, 17);
        break;
      }
      case 11: { // then a rival walks up... and thanks him
        const walk = smooth(ramp(f, a, B.gracias - 8)), th = f >= B.gracias, drop = f >= B.gracias + 16;
        G(MARSHALL, 5, [EZ[0], 0, 0], drop ? { expr: "shock", sweat: 2, armL: "hang", armR: "hang" } : th ? { expr: "neutral", armL: "hip", armR: "hip", look: 1 } : { expr: "laugh", armL: "up", armR: "up" }, { sy: drop ? 0.97 : 1 });
        G(niner(0), 77, [lerp(-44.6, -48.2, walk), 0, 0.3], th ? { expr: "grin", facing: -1, armL: "reach", armR: "hip" } : { legs: "walk", phase: (f - a) / 14, facing: -1, expr: "grin" });
        if (th) { const k = pop(B.gracias, 8); K("thumb", 260, 300, fxThumb, [-48.0, 2.15, 0.5], 0.42 * k, 0.48 * k, { rot: 0.1 * Math.sin(f * 0.3) }); }
        score(27, 19);
        if (drop) K("q", 200, 250, fxQ, [EZ[0] - 0.1, 2.25, 0.2], 0.36 * pop(B.gracias + 16), 0.45 * pop(B.gracias + 16));
        break;
      }
      case 12: { // wait: how does a professional go the wrong way?
        if (f < B.como) { G(MARSHALL, 5, [EZ[0], 0, 0], { expr: "shock", sweat: 2 }); K("q", 200, 250, fxQ, [EZ[0] + 0.42, 2.0, 0.2], 0.3, 0.38, { rot: 0.15 * Math.sin(f * 0.3) }); }
        else {
          const n = Math.min(18, 1 + Math.floor((f - B.como) / 2.2)); dashes(n);
          K("fbflat", 240, 160, (p) => fxFootball(p, 0), [PICK[0] + 2.2, 0.04, 0], 5.0, 3.3, { flat: true, rot: Math.PI / 2 });
          const k = pop(B.como + 44, 10); if (k > 0) K("qflat", 200, 250, fxQ, [-16, 0.05, 11], 9 * k, 11.2 * k, { flat: true, rot: Math.PI / 2 });
          for (const [x, col] of [[35, "ok"], [-35, "no"]] as [number, string][]) void [x, col];
        }
        break;
      }
      case 13: { // he spun on the spot; helmet, noise, adrenaline: he lost his north
        if (f < B.casco) { const sp = (f - a) * 0.42; G(MARSHALL, 5, [PICK[0], 0, PICK[2]], { expr: "dazed", armR: "front", holdR: "football", facing: Math.sin(sp) > 0 ? 1 : -1 }, { sx: Math.cos(sp) }); const t = Math.round((f * 0.35) % 6.28 * 4) / 4; K(`swirl|${t}`, 400, 300, (p) => fxSwirl(p, t), [PICK[0], 0.9, PICK[2] + 0.2], 1.6, 1.2); }
        else if (f < B.norte) {
          G(MARSHALL, 5, [PICK[0], 0, PICK[2]], { expr: "dazed", sweat: f >= B.adren ? 2 : 0, look: Math.sin(f * 0.4) > 0 ? 1 : -1 }, { roll: 0.05 * Math.sin(f * 0.5) });
          if (f >= B.ruido) for (const sd of [-1, 1]) { const k = Math.floor(f / 3) % 2; K(`roar|${k}`, 300, 200, (p) => fxRoar(p, k), [PICK[0] + sd * 0.38, 1.9, PICK[2] + 0.25], 0.3, 0.2, { rot: sd * 0.3 }); }
          if (f >= B.adren) this.stars(st, PICK[0], 2.05, PICK[2] + 0.2, f);
        } else {
          const t = f - B.norte, ang = t < 26 ? t * (1.1 - t * 0.02) : 26 * (1.1 - 26 * 0.02) + 0.06 * Math.sin((t - 26) * 0.6) * Math.exp(-(t - 26) / 12), end = -Math.PI / 2;
          const aq = Math.round((t < 26 ? ang : end + 0.3 * Math.sin((t - 26) * 0.6) * Math.exp(-(t - 26) / 12)) * 12) / 12;
          G(MARSHALL, 5, [PICK[0], 0, PICK[2]], { expr: t < 26 ? "dazed" : "grin", armR: "front", holdR: "football", look: t < 26 ? 0 : -1 });
          K(`compass|${aq}`, 400, 400, (p) => fxCompass(p, aq), [PICK[0], 2.35, PICK[2] + 0.25], 0.8, 0.8); if (t >= 26) spark([PICK[0] - 0.42, 2.4, PICK[2] + 0.3], 0.2);
        }
        break;
      }
      case 14: { // his team won anyway, thanks to a play he himself had forced minutes earlier
        if (f < B.jugada) {
          score(27, 22); G(MARSHALL_BARE, 5, [-52.8, hop(0, 0.1, 3), 0.3], { back: true, armL: "up", armR: "up" });
          G(viking(1), 21, [-51.9, hop(1, 0.14, 2.6), 1.5], { back: true, armL: "up", armR: "up" }); G(viking(2), 22, [-51.9, hop(2, 0.14, 2.8), -1.0], { back: true, armL: "up", armR: "wave" });
        } else {
          const f0 = B.jugada, hitF = f0 + 14, hit = f >= hitF, t = (f - hitF) / 14, scoop = hitF + 12, go = f >= scoop, ex = go ? 22 + (f - scoop) * 0.3 : 22;
          G(niner(1), 66, [20.6, hit ? 0.25 : 0, 0], hit ? { expr: "dazed", armL: "up", armR: "up" } : { expr: "nervous", armR: "up", holdR: "football", facing: -1 }, { roll: hit ? Math.min(1, t) * 1.35 : 0 });
          G(MARSHALL, 5, [hit ? 20.0 : lerp(17.2, 20.0, smooth(ramp(f, f0, hitF))), 0, 0.2], hit ? { expr: "stern", armL: "hip", armR: "hip", facing: 1 } : { ...run(), facing: 1, expr: "stern", armL: "reach", armR: "reach" });
          if (hit && !go) { const u = Math.min(1, t); ball([lerp(20.8, 22, u), 0.16 + 1.2 * Math.abs(Math.sin(u * Math.PI)), 1.0], f * 0.6); }
          if (hit && t < 0.35) K("burst|" + Math.round(t * 20), 500, 500, (p) => fxBurst(p, t / 0.35), [20.5, 1.1, 0.3], 1.3, 1.3);
          G(viking(0), 81, [go ? ex : 22.3, 0, 1.0], go ? { ...run(), facing: 1, expr: "laugh", armR: "front", holdR: "football" } : { expr: "shock", facing: -1 });
          if (go) this.puffs(st, f, (fe) => [22 + (fe - scoop) * 0.3 - 0.5, 1.0], 5, 14, 0.6);
          G(niner(4), 64, [24.5, 0, -2.0], { expr: "shock", facing: -1 });
        }
        break;
      }
      case 15: { // that week, a letter
        const pk = smooth(ramp(f, a + 6, B.otro - 12)), given = f >= B.otro - 10;
        G(MARSHALL_BARE, 5, [-0.9, 0.1, BENCH_Z + 0.35], given ? { legs: "sit", expr: f >= B.otro + 16 ? "smile" : "neutral", armL: "front", armR: "front", holdR: "letter", look: -1 } : { legs: "sit", expr: "neutral", armL: "hip", look: 1 }, { shadow: false });
        K("helm", 100, 100, (p) => { p.ell(50, 56, 40, 36, "#5a3a9a", 8, 180, 380); p.stroke([[12, 58], [92, 60]], 6); p.stroke([[50, 18], [52, 56]], 9, "#ffffff"); }, [-2.0, 0.66, BENCH_Z + 0.2], 0.4, 0.4);
        G(POSTMAN, 90, [lerp(4.5, 0.25, pk), 0, BENCH_Z + 1.0], given ? { expr: "smile", facing: -1, armR: "wave" } : { legs: "walk", phase: (f - a) / 14, facing: -1, expr: "smile", armL: "front" });
        if (!given) K("env", 300, 200, fxEnvelope, [lerp(4.5, 0.25, pk) - 0.42, 1.0, BENCH_Z + 1.1], 0.3, 0.2);
        break;
      }
      case 16: { // ...from a player who had done the same thing in 1929
        G(OLDTIMER, 5, [mx, 0, 0], { ...run(), facing: -1, expr: "grin", armR: "front", holdR: "football" });
        G(oldmate(1), 21, [mx + 3.2, 0, 1.4], { ...run(0.3), facing: -1, expr: "shock", armL: "up", armR: "up" }); G(oldmate(2), 22, [mx + 5.0, 0, -1.2], { ...run(0.6), facing: -1, expr: "pained", armL: "up", armR: "reach" });
        this.puffs(st, f, (fe) => [runX(16, fe) + 0.5, 0.15], 5, 14, 0.55);
        break;
      }
      case 17: { // it said: welcome to the club
        const lol = f >= B.risa;
        G(MARSHALL_BARE, 5, [-0.9, 0.1, BENCH_Z + 0.35], { legs: "sit", expr: lol ? "laugh" : "smile", armL: "front", armR: "front" }, { shadow: false, roll: lol ? 0.04 * Math.sin(f * 0.8) : 0 });
        const k = pop(a + 2, 10); K("club", 700, 480, fxClubCard, [-0.86, lol ? 0.9 : 0.98, -26.55], 0.56 * k * (lol ? 0.85 : 1), 0.384 * k * (lol ? 0.85 : 1), { rot: 0.04 * Math.sin(f * 0.1) });
        if (!lol) spark([-0.58, 1.18, -26.45], 0.12);
        break;
      }
      case 18: { // twenty seasons without missing a single game: snow, sun, rain
        const u = (f - a) / (S.b - a), old = u > 0.62, wk = u < 0.34 ? 0 : u < 0.67 ? 2 : 1;
        G(old ? MARSHALL_OLD : MARSHALL, 5, [0, 0, 0], { expr: "stern", armL: "hip", armR: "hip" });
        if (wk === 2) K("sun", 160, 160, (p) => fxWeather(p, 2), [1.1, 3.1, -1], 1.0, 1.0, { rot: f * 0.03, glow: 1.4 });
        else for (let i = 0; i < 26; i++) { const t = ((f * (wk ? 0.05 : 0.016) + hs(i, 3)) % 1); K("wx|" + wk, 160, 160, (p) => fxWeather(p, wk), [(hs(i, 1) - 0.5) * 5 + (wk ? 0 : 0.3 * Math.sin(f * 0.05 + i)), 3.4 - t * 3.6, (hs(i, 2) - 0.5) * 3], wk ? 0.07 : 0.13, wk ? 0.11 : 0.13, { rot: wk ? 0 : f * 0.05 + i }); }
        for (let i = 0; i < 7; i++) { const t = ((f - a) * 0.014 + i / 7) % 1; K("leaf", 200, 220, fxLeaf, [2.6 - t * 5.2, 0.5 + 2.0 * Math.sin(t * Math.PI) + 0.3 * Math.sin(i * 2.1), 0.9 + (i % 3) * 0.3], 0.3, 0.33, { rot: t * 5 + i }); }
        break;
      }
      default: { // but the world remembers the sixty metres he ran the wrong way
        if (f < B.reves) {
          dashes(18, true);
          G(MARSHALL_OLD_BARE, 5, [mx, 0, 0.9], { legs: "walk", phase: (f - a) / 15, facing: -1, expr: "smile", armL: "wave", armR: "front", holdR: "helmetP" });
          this.flashes(st, f, 0.12);
        } else {
          const th = f >= B.reves + 20;
          G(MARSHALL_OLD_BARE, 5, [EZ[0], th ? hop(0, 0.05, 4) : 0, 0], th ? { expr: "laugh", armL: "hip", armR: "wave" } : { expr: "smile", armL: "hip", armR: "front", holdR: "helmetP" });
          G(NINER_OLD, 77, [-48.1, 0, 0.3], { expr: th ? "laugh" : "grin", facing: -1, armL: th ? "reach" : "hip", armR: "hip" });
          if (th) { const k = pop(B.reves + 20, 8); K("thumb", 260, 300, fxThumb, [-48.35, 2.2, 0.5], 0.42 * k, 0.48 * k, { rot: 0.1 * Math.sin(f * 0.3) }); }
          this.flashes(st, f, 0.2); score(0, 0);
        }
        break;
      }
    }
    void [dust, lerp];
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
    const night = s.light === "night";
    for (const nm of NIGHT_MATS) nm.m.emissiveIntensity = night ? nm.k : 0;
    for (const lm of LAMP_MATS) { const h = (lm.userData as { hot: [number, number, number] }).hot, k = night ? 1 : 0.5; lm.color.setRGB(h[0] * k, h[1] * k, h[2] * k); }
    this.starPts.visible = night; this.starPts.position.copy(cam.position);
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
    const roar = true;
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
      else if (p.fixed) m.rotation.set(0, p.yaw ?? 0, p.rot ?? 0);
      else { m.rotation.set(0, 0, 0); m.lookAt(cam.position); if (p.rot) m.rotateZ(p.rot); }
    }
    return focus;
  }
}

