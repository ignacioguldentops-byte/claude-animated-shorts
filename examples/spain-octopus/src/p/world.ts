// The world of "El pulpo": a Galician plaza, an aquarium hall and the stadium bowl. Same look modules as
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
import { fxPaul, PaulO, fxBox, FlagK, fxTick, fxFlag, fxNoPulpo, fxShopSign, fxPortrait, fxScreen, fxTV, fxCooked, fxPlate, fxBubble, fxWeed, fxRock, fxRays, fxBill, fxSteam, fxBowlPaul, fxPulpoCoin } from "./paul";
import { FPS, SHOTS, B, V3, camAt, smooth, clamp01, lerp, ramp, lampsAt, PAUL_HOME, BOX_L, BOX_R, paulTo, PORTRAIT, SCREEN, BOWL } from "./story";
import { lam, add, box, ground, repT } from "./kit";
import { buildPlaza, buildAqua, SetRefs, NIGHT_MATS, LAMP_MATS, CX, AX } from "./sets";
import { MANOLO, KEEPER, REPORTER, GUARD, GUARD2, MAYOR, BOSS, PLAYER6, spain, KEEPER_ES, dutch, KEEPER_NL, folk } from "./cast";
const GX = 52.5;
const CKEY = new WeakMap<Char, string>();
const outQ = (x: number) => 1 - (1 - clamp01(x)) ** 3;
void [FPS, SU, rep, rng, grassHD, facadeHD, fxPuff, fxStars, fxRing, fxCloud, INK, box, lerp];

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
    this.refs = buildPlaza(R); buildAqua(R);
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
  private card(st: Stage, key: string, cw: number, chh: number, draw: (p: Pen) => void, pos: V3, w: number, h: number, o: Partial<FxPlace> = {}) {
    st.fx.push({ key, cw, ch: chh, draw, x: pos[0], y: pos[1], z: pos[2], w, h, ...o });
  }
  private conf(st: Stage, f: number, cx: number, cy: number, cz: number, n = 46, spread = 5) {
    const cols = ["#c8102e", "#fbfbf6", "#f6c419", "#c8102e", "#f6c419"];
    for (let i = 0; i < n; i++) { const t = ((f * 0.012 + hs(i, 3)) % 1), x = cx + (hs(i, 1) - 0.5) * spread + 0.3 * Math.sin(f * 0.1 + i), y = cy + 3.2 - t * 4.2, z = cz + (hs(i, 2) - 0.5) * spread * 0.7;
      if (y > 0.05) this.card(st, `conf|${cols[i % 5]}`, 64, 64, (p) => fxConfetti(p, cols[i % 5]), [x, y, z], 0.09, 0.09, { rot: f * 0.2 + i }); }
  }

  private stage(id: number, f: number): Stage {
    const st: Stage = { places: [], fx: [] };
    const S = SHOTS[id - 1], a = S.a;
    const c = (x: number, y: number, z: number): V3 => [CX + x, y, z];
    const q = (x: number, y: number, z: number): V3 => [AX + x, y, z];
    const hop = (i: number, amp = 0.1, sp = 3) => amp * Math.abs(Math.sin(f / sp + i * 1.7));
    const G = (ch: Char, seed: number, pos: V3, pose: Pose = {}, o: Parameters<World["fig"]>[5] = {}) => this.fig(st, ch, seed, pos, pose, { f, ...o });
    const K = (key: string, cw: number, chh: number, draw: (p: Pen) => void, pos: V3, w: number, h: number, o: Partial<FxPlace> = {}) => this.card(st, key, cw, chh, draw, pos, w, h, o);
    const spark = (p: V3, s: number) => this.spark(st, p[0], p[1], p[2], s, f);
    const pop = (f0: number, n = 8) => { const t = clamp01((f - f0) / n); return f < f0 ? 0 : 1 + 0.35 * Math.sin(t * Math.PI) * (1 - t); };
    const clap = (i: number): Pose => (Math.floor(f / 4 + i) % 2 ? { armL: "pray", armR: "pray" } : { armL: "front", armR: "front" });
    // ---- Paul + tank dressing ----
    const paul = (pos: V3, o: PaulO, w = 1.3, x: Partial<FxPlace> = {}) => {
      const oo: PaulO = { ...o, t: Math.round(((f * 0.022) % 1) * 12) / 12, blink: o.expr === undefined || o.expr === "idle" ? lidAt(f, 77) > 0.5 : false };
      K("paul|" + JSON.stringify(oo), 800, 800, (p) => fxPaul(p, oo), [pos[0], pos[1] + 0.03 * Math.sin(f * 0.11), pos[2]], w, w, x);
    };
    const boxK = (side: -1 | 1, k: FlagK, lid = 0, mus = true, dy = 0) => { const lq = Math.round(lid * 6) / 6, b = side < 0 ? BOX_L : BOX_R; K(`box|${k}|${lq}|${mus}`, 420, 480, (p) => fxBox(p, k, lq, mus), [b[0], b[1] + dy, b[2]], 0.78, 0.89); };
    const tank = (rocks = true) => {
      if (rocks) { K("rock|0", 500, 300, (p) => fxRock(p, 0), q(-1.55, 1.2, -6.0), 1.5, 0.9); K("rock|1", 500, 300, (p) => fxRock(p, 1), q(1.6, 1.12, -5.5), 1.3, 0.78); }
      const wt = Math.round(((f * 0.012) % 1) * 16) / 16 * Math.PI * 2;
      K(`weed|${wt.toFixed(2)}|a`, 200, 600, (p) => fxWeed(p, wt), q(-1.82, 1.5, -5.7), 0.48, 1.44); K(`weed|${wt.toFixed(2)}|b`, 200, 600, (p) => fxWeed(p, wt + 1.5, "#57b05a"), q(1.86, 1.4, -5.9), 0.42, 1.26);
      for (let i = 0; i < 9; i++) { const t = (f * 0.011 + hs(i, 2)) % 1, s = 0.05 + 0.08 * hs(i, 3); K("bubble", 120, 120, fxBubble, q((hs(i, 1) - 0.5) * 3.6 + 0.05 * Math.sin(f * 0.2 + i), 0.9 + t * 2.4, -4.75 - hs(i, 4) * 0.6), s, s); }
      K("rays", 400, 800, fxRays, q(-0.6, 2.3, -4.6), 1.6, 3.0, { soft: true, glow: 0.55 });
    };
    const tick = (pos: V3, s: number, f0: number) => { const k = pop(f0); if (k > 0) K("tick", 200, 200, (p) => fxTick(p), pos, s * k, s * k); };
    /** visitors in the hall with their backs to us; kind per seed */
    const hall = (n: number, kind: "town" | "de" | "mix", pose: (i: number) => Pose = () => ({})) => {
      const spots: [number, number][] = [[-1.7, -2.0], [1.5, -1.8], [-0.5, -1.5], [0.7, -0.9], [-2.3, -1.0], [2.4, -0.7], [-1.2, -0.3], [1.6, 0.2], [0.1, 0.3], [-2.6, 0.5]];
      for (let i = 0; i < Math.min(n, spots.length); i++) G(folk(40 + i * 3, kind === "mix" ? (i % 2 ? "de" : "town") : kind), 60 + i, q(spots[i][0], 0, spots[i][1]), { back: true, ...pose(i) });
    };
    const keeper = (pose: Pose) => G(KEEPER, 9, q(2.9, 0, -3.3), { facing: -1, ...pose });
    // ---- plaza dressing ----
    const steam = (x: number, z: number, y = 1.5) => { const t = Math.round(((f * 0.03) % 1) * 10) / 10 * Math.PI * 2; K(`steam|${t.toFixed(2)}`, 200, 400, (p) => fxSteam(p, t), [x, y + 0.08 * Math.sin(f * 0.1), z], 0.5, 1.0, { soft: true }); };
    const stall = (steaming = true) => { K("shopSign", 400, 400, fxShopSign, c(0, 3.62, -2.9), 0.9, 0.9); if (steaming) { steam(CX - 2.85, -1.0); steam(CX + 2.85, -1.0, 1.7); } };
    const MAN: V3 = c(0, 0, -1.5);
    const ceremony = (medalOn: boolean, back = true) => {
      K(`portrait|${medalOn}`, 560, 760, (p) => fxPortrait(p, medalOn), PORTRAIT, 1.27, 1.72);
      G(MAYOR, 12, c(5.75, 0.44, 1.45), medalOn ? { facing: 1, expr: "grin", ...clap(1) } : { facing: 1, expr: "smile", armR: "reach", holdR: "medal" });
      const cr: [number, number][] = [[4.1, 3.5], [5.3, 3.9], [6.4, 3.6], [7.5, 4.0], [8.6, 3.6], [4.8, 5.0], [6.0, 5.3], [7.2, 5.0], [8.3, 5.4], [3.4, 4.6], [9.4, 4.7]];
      cr.forEach(([x, z], i) => G(i === 1 ? MANOLO : folk(20 + i * 7, "town"), 100 + i, c(x, medalOn ? hop(i, 0.05, 4) : 0, z), { back, ...(medalOn ? clap(i) : {}) }));
    };
    switch (id) {
      case 1: { // the copper pot: Manolo lifts a cooked octopus, then the whole stall on fiesta day
        const up = smooth(ramp(f, a + 2, a + 20)), t = Math.round(f * 0.5) % 6;
        G(MANOLO, 5, c(1.95, 0, -1.35), { facing: 1, expr: "grin", armR: "up", holdR: "hook", armL: "hip" });
        K(`cooked|${t}`, 400, 560, (p) => fxCooked(p, t), c(2.85, 1.25 + up * 0.72, -0.74), 0.62, 0.87);
        stall(); if (f < a + 30) spark(c(2.6, 2.3, -0.6), 0.16);
        const cr: [number, number, number][] = [[-6.9, 1.5, 1], [-5.6, 1.0, -1], [-6.3, 2.0, 0], [5.7, 4.9, 1], [7.1, 4.4, -1], [-1.0, 1.1, 0], [0.4, 1.4, 0], [-7.9, 6.0, 1], [-2.6, 3.4, 1], [3.2, 2.2, -1]];
        cr.forEach(([x, z, fc], i) => G(folk(11 + i * 5, "town"), 30 + i, c(x, 0, z), i === 5 || i === 6 ? { back: true } : { facing: fc as -1 | 0 | 1, expr: i % 2 ? "grin" : "smile", armR: "front", holdR: i % 3 ? "plate" : "cup" }));
        break;
      }
      case 2: { // the mayor hangs a medal on the portrait of... an octopus
        const on = f >= B.aPulpo - 6;
        ceremony(on); stall();
        if (on) { spark([PORTRAIT[0] + 0.42, PORTRAIT[1] + 0.48, PORTRAIT[2] + 0.05], 0.3 * pop(B.aPulpo - 6, 10)); this.conf(st, f - (B.aPulpo - 6), CX + 6.6, 1.3, 1.9, 34, 4.5); }
        break;
      }
      case 3: { // the cup on the centre spot, flashes all round
        K("cup", 300, 500, fxCup, [0, 0.62, 0], 0.72, 1.2); this.contact(st, 0, 0, 1.1);
        this.ball(st, 0.95, 0, 0.5, 0); this.flashes(st, f, 0.2); spark([0.18, 1.0, 0.1], 0.3); spark([-0.2, 0.75, 0.1], 0.16);
        break;
      }
      case 4: { // Manolo cuts octopus with scissors; then his stall and the queue
        const snip = Math.sin(f * 0.9) > 0 ? 4 : 0;
        G(MANOLO, 5, MAN, { expr: f < B.forty ? "smile" : "grin", armR: [-26 + snip, 40, 14], holdR: "scissors", armL: "front", holdL: "plate" });
        stall();
        if (f >= B.forty - 4) {
          [[-0.5, 0.5], [0.45, 1.2], [-0.35, 2.0], [0.6, 2.8]].forEach(([x, z], i) => G(folk(13 + i * 9, "town"), 40 + i, c(x, 0, z), { back: true }));
          const wx = -2.2 - (f - B.forty) * 0.03; G(folk(71, "town"), 48, c(wx, 0, 2.6), { legs: "walk", phase: (f - a) / 15, facing: -1, expr: "grin", armR: "front", holdR: "plate" });
          G(folk(33, "town"), 49, c(-6.9, 0, 1.6), { facing: 1, armR: "front", holdR: "cup" }); G(folk(52, "town"), 50, c(-5.6, 0, 1.1), { facing: -1, expr: "grin" });
        }
        break;
      }
      case 5: { // a German aquarium: visitors, the keeper, and Paul waving
        tank(); paul(PAUL_HOME, f < B.paul ? { expr: "idle", look: Math.sin(f * 0.08) } : { expr: "happy", pose: "wave" }, 1.3);
        hall(9, "mix", (i) => (i === 2 ? { armR: "point" } : i === 5 ? { armL: "mouth", holdL: "phone" } : {}));
        keeper({ expr: "smile", armR: "point" });
        if (f >= B.paul) spark(q(0.7, 3.0, -4.9), 0.2 * pop(B.paul, 10));
        break;
      }
      case 6: { // two boxes, two flags, a mussel in each. The one he opens first wins.
        const drop = 1 - smooth(ramp(f, a, a + 16)), go = ramp(f, B.opens + 2, B.opens + 16), lid = ramp(f, B.opens + 14, B.opens + 24), ate = f >= B.opens + 24;
        tank(); boxK(-1, "de", lid, !ate, drop * 1.9); boxK(1, "en", 0, true, drop * 1.9 + (drop > 0 ? 0.2 * drop : 0));
        if (f < B.opens) paul(PAUL_HOME, { expr: "idle", look: Math.sin(f * 0.16), lookY: 1 }, 1.25);
        else paul(paulTo(-1, go), { pose: "reachL", expr: ate ? "happy" : go < 1 ? "idle" : "eat", look: -1, mussel: ate }, 1.25);
        if (f >= B.mussel && f < B.opens) spark(q(-0.8, 1.52, -4.9), 0.12);
        tick(q(-0.92, 2.25, -4.85), 0.5, B.gana);
        if (f < B.mussel || f >= B.opens) { hall(5, "mix"); keeper(f >= B.gana ? { expr: "grin", armR: "up", armL: "up" } : { expr: "neutral", armR: "chin" }); }
        break;
      }
      case 7: { // one right. Two. Five in a row.
        const beat = f < B.m2 ? 0 : f < B.m5 ? 1 : 2, b0 = [a, B.m2, B.m5][beat], side = (beat === 1 ? 1 : -1) as -1 | 1;
        const flags: [FlagK, FlagK][] = [["de", "au"], ["gh", "de"], ["de", "ar"]], go = ramp(f, b0, b0 + 8), lid = ramp(f, b0 + 6, b0 + 13), ate = f >= b0 + 13;
        tank(); boxK(-1, flags[beat][0], side < 0 ? lid : 0, !(ate && side < 0)); boxK(1, flags[beat][1], side > 0 ? lid : 0, !(ate && side > 0));
        paul(paulTo(side, go), { pose: side < 0 ? "reachL" : "reachR", expr: ate ? "happy" : "eat", look: side, mussel: ate }, 1.25);
        const n = beat === 0 ? 1 : beat === 1 ? 2 : 5;
        for (let i = 0; i < n; i++) tick(q(-0.9 + i * 0.45, 3.02, -4.7), 0.38, beat < 2 ? (i < beat ? -99 : b0 + 14) : i < 2 ? -99 : b0 + 10 + (i - 2) * 4);
        hall(7, "mix", (i) => (i % 3 === 0 ? { armR: "mouth", holdR: "camera" } : i % 3 === 1 ? { armR: "up" } : {}));
        for (let i = 0; i < 4; i++) if (hs(i * 3.1 + Math.floor(f / 3) * 7.7, 2) > 0.7) spark(q(-2 + i * 1.3 + hs(i, 4), 1.5 + hs(i, 5) * 0.3, -1.2 - hs(i, 6)), 0.34);
        keeper({ expr: "grin", ...clap(0) });
        break;
      }
      case 8: { // Manolo watches it on the little TV: "luck"
        const bah = f >= B.suerte;
        G(MANOLO, 5, c(0.42, 0, -1.5), { expr: bah ? "grin" : "laugh", look: bah ? 0 : -1, facing: bah ? 0 : -1, armR: bah ? "wave" : "hip", armL: "hip", headTilt: bah ? 6 : 0 }, { roll: bah ? 0 : 0.03 * Math.sin(f * 0.8) });
        K("tv", 520, 440, fxTV, c(-0.4, 1.14, -0.76), 0.5, 0.423);
        const t = Math.round(((f * 0.022) % 1) * 12) / 12; K(`scr|tv|${t}`, 800, 450, (p) => fxScreen(p, "de", "en", -1, t, "happy"), c(-0.438, 1.129, -0.745), 0.33, 0.186, { glow: 1.5 });
        stall(); G(folk(13, "town"), 40, c(1.75, 0, 0.3), { back: true, armR: "front", holdR: "plate" });
        break;
      }
      case 9: { // semi-final: Germany or Spain. And Paul... picks Spain.
        const go = ramp(f, B.elige, B.elige + 12), lid = ramp(f, B.elige + 10, B.elige + 20), ate = f >= B.elige + 20, picked = f >= B.elige;
        tank(); boxK(-1, "de", 0, true); boxK(1, "es", lid, !ate);
        if (!picked) paul([PAUL_HOME[0] + (f < B.yPaul ? -0.28 * smooth(ramp(f, a + 8, a + 30)) : 0.2 * Math.sin((f - B.yPaul) * 0.2)), PAUL_HOME[1], PAUL_HOME[2]], { expr: "think", look: f < B.yPaul ? -1 : Math.sin((f - B.yPaul) * 0.2) > 0 ? 1 : -1 }, 1.25);
        else paul(paulTo(1, go), { pose: "reachR", expr: ate ? "happy" : "eat", look: 1, mussel: ate }, 1.25);
        hall(8, "de", (i) => (picked && f > B.elige + 14 ? { armL: "up", armR: "up" } : i % 3 === 0 ? { armR: "mouth", holdR: "camera" } : {}));
        G(REPORTER, 21, q(-2.75, 0, -3.2), { facing: 1, expr: picked && f > B.elige + 14 ? "shock" : "smile", armR: "front", holdR: "mic" });
        keeper(picked && f > B.elige + 14 ? { expr: "shock", sweat: 2, armL: "up", armR: "up" } : { expr: "nervous", armR: "chin" });
        if (ate) spark(q(1.1, 2.3, -4.8), 0.3 * pop(B.elige + 20));
        break;
      }
      case 10: { // Spain wins, and half of Germany wants him on the grill
        const jit = 0.02 * Math.sin(f * 2.1);
        tank(false); K("rock|0", 500, 300, (p) => fxRock(p, 0), q(-1.55, 1.2, -6.0), 1.5, 0.9);
        paul(q(1.25 + jit, 1.62, -5.75), { expr: "scared", pose: "hide", sweat: true }, 1.15);
        K("rock|1", 500, 300, (p) => fxRock(p, 1), q(1.5, 1.2, -5.45), 1.7, 1.02);
        const mob: [number, number][] = [[-1.9, -2.2], [-0.7, -2.4], [0.5, -2.2], [1.7, -2.4], [-1.3, -1.3], [0.0, -1.2], [1.2, -1.4], [-2.5, -0.9], [2.4, -0.8], [-0.6, -0.2], [0.8, -0.1]];
        mob.forEach(([x, z], i) => { const wv = Math.sin(f * 0.5 + i * 1.9) * 14; G(folk(80 + i * 3, "de"), 120 + i, q(x, hop(i, 0.07, 2.5), z), { back: true, armR: [40 + (i % 2) * 10, -78 + wv, 10], holdR: i % 2 ? "fork" : "pan", armL: i % 3 === 0 ? [44, -70 - wv, 10] : "hip", holdL: i % 3 === 0 ? "fork" : undefined }); });
        break;
      }
      case 11: { // the Spanish president jokes about sending him bodyguards
        tank(); paul(PAUL_HOME, { expr: "shades", pose: "idle" }, 1.3);
        G(GUARD, 31, q(-0.62, 0, -3.3), { expr: "stern", armL: "front", armR: "front", look: Math.sin(f * 0.07) > 0 ? -1 : 0 });
        G(GUARD2, 32, q(0.62, 0, -3.3), { expr: "stern", armL: "hip", armR: "chin", look: Math.sin(f * 0.07) > 0 ? 0 : 1 });
        G(folk(47, "de"), 33, q(-2.3, 0, -0.9), { back: true, armR: "front", holdR: "pan" }); G(folk(50, "de"), 34, q(2.2, 0, -1.1), { back: true });
        break;
      }
      case 12: { // and Manolo hangs a sign: no octopus today
        const up = smooth(ramp(f, a + 4, B.cartel)), hung = f >= B.cartel, sw = hung ? 0.12 * Math.sin((f - B.cartel) * 0.35) * Math.exp(-(f - B.cartel) / 22) : 0;
        K("noPulpo", 400, 460, fxNoPulpo, c(lerp(0.55, 0.02, up), lerp(1.3, 1.86, up), lerp(0.25, -0.03, up)), 0.5, 0.575, { rot: sw });
        G(MANOLO, 5, c(0.85, 0, 0.3), hung ? { facing: -1, expr: "stern", armL: "hip", armR: "hip" } : { facing: -1, expr: "neutral", armR: "reach", armL: "up" });
        K("shopSign", 400, 400, fxShopSign, c(0, 3.62, -2.9), 0.9, 0.9);
        [[-1.5, 1.0], [-2.3, 1.5], [-0.9, 1.9]].forEach(([x, z], i) => G(folk(13 + i * 9, "town"), 40 + i, c(x, 0, z), { facing: 1, expr: hung ? "shock" : "neutral", armR: "front", holdR: "cup" }));
        break;
      }
      case 13: { // the final: the whole plaza under the big screen
        const t = Math.round(((f * 0.022) % 1) * 12) / 12;
        K(`scr|big|${t}`, 800, 450, (p) => fxScreen(p, "es", "nl", 0, t, "think"), SCREEN, 5.3, 2.98, { glow: 1.7 });
        for (let i = 0; i < 40; i++) { const row = Math.floor(i / 8), col = i % 8, x = -4.6 + col * 1.3 + (row % 2) * 0.6 + 0.3 * (hs(i, 1) - 0.5), z = 1.2 + row * 1.5 + 0.4 * hs(i, 2);
          G(i === 3 ? MANOLO : folk(200 + i * 3, "es"), 300 + i, c(x, hop(i, 0.03, 5), z), { back: true, ...(i % 5 === 0 ? { armR: "up", holdR: "flagES" } : i % 7 === 1 ? { armL: "up", armR: "up" } : {}) }); }
        break;
      }
      case 14: { // ...hanging on a mussel
        tank(); boxK(-1, "nl", 0, true); boxK(1, "es", 0, true);
        spark(q(1.02, 1.55, -4.85), 0.14); if (Math.floor(f / 5) % 2) spark(q(0.8, 1.48, -4.85), 0.07);
        break;
      }
      case 15: { // Paul picks Spain again
        const go = ramp(f, a, a + 12), lid = ramp(f, a + 10, a + 18), ate = f >= a + 18;
        tank(); boxK(-1, "nl", 0, true); boxK(1, "es", lid, !ate);
        paul(paulTo(1, go), { pose: "reachR", expr: ate ? "happy" : "eat", look: 1, mussel: ate }, 1.25);
        tick(q(0.92, 2.3, -4.85), 0.5, a + 22); if (ate) spark(q(1.2, 2.5, -4.8), 0.3);
        keeper({ expr: "grin", ...clap(0) });
        break;
      }
      case 16: { // minute 116: the number 6 hits it on the bounce
        const k0 = B.iniesta - 6, net = k0 + 9, cut = B.iniesta + 6;
        const bp = (ff: number): V3 => {
          if (ff < k0) { const u = (ff - a) / Math.max(1, k0 - a); return [42.4 + u * 2.9, 0.12 + 1.5 * Math.abs(Math.cos(u * Math.PI * 1.5)) * (1 - u * 0.75), 3.4 - u * 1.3]; }
          const u = clamp01((ff - k0) / 9); return [45.3 + u * 7.4, 0.3 + 0.55 * Math.sin(u * 2.4), 2.1 - u * 4.6];
        };
        const b = bp(f);
        if (f < cut) {
          G(PLAYER6, 6, [44.7, 0, 2.2], { back: true, legs: "run", phase: f < k0 ? (f - a) / 9 : 0.3, armL: [40, -20, 8], armR: [44, 30, 8] });
          G(dutch(0), 61, [46.9, 0, -0.4], { facing: -1, legs: "run", phase: (f - a) / 8, expr: "shock" }); G(dutch(1), 62, [43.4, 0, 4.9], { back: true, legs: "run", phase: (f - a) / 8 });
          G(KEEPER_NL, 63, [50.9, f >= k0 ? 0.25 : 0, 0.7 - 1.2 * smooth(ramp(f, k0, net))], { facing: -1, armL: "up", armR: "up", expr: "shock" }, { roll: -1.1 * smooth(ramp(f, k0 + 1, net)) });
          this.ball(st, b[0], b[1], b[2], f); if (f >= k0 && f < k0 + 5) K("burst|" + (f - k0), 500, 500, (p) => fxBurst(p, (f - k0) / 5), [45.3, 0.4, 2.1], 1.2, 1.2);
        } else {
          const run = (f - cut) * 0.12;
          this.ball(st, 53.5, 0.12, -2.5, 0, false);
          G(KEEPER_NL, 63, [51.6, 0.2, -0.6], { facing: 1, expr: "pained" }, { roll: -1.45 });
          G(PLAYER6, 6, [48.3 - run * 0.3, hop(1, 0.06, 2), 3.6 + run * 0.35], { legs: "run", phase: (f - cut) / 7, expr: "laugh", armL: "up", armR: "up", facing: 0 });
          G(spain(1), 64, [49.6 - run * 0.2, 0, 2.2 + run * 0.3], { legs: "run", phase: (f - cut) / 7 + 0.4, expr: "laugh", armR: "up", facing: 1 }); G(dutch(2), 65, [50.8, 0, 1.4], { facing: -1, expr: "pained", armL: "chin" });
          this.flashes(st, f, 0.25);
        }
        break;
      }
      case 17: { // world champions: the cup goes up
        G(KEEPER_ES, 70, [0, hop(0, 0.14, 3), 0], { expr: "laugh", armL: "up", armR: "up" }); K("cup", 300, 500, fxCup, [0, 2.72 + hop(0, 0.14, 3), 0.06], 0.5, 0.83); spark([0.16, 3.0, 0.1], 0.2);
        const team: [number, number][] = [[-1.1, -0.2], [1.1, -0.2], [-1.9, 0.3], [1.9, 0.3], [-0.6, -0.9], [0.6, -0.9], [-1.5, -1.0], [1.5, -1.0]];
        team.forEach(([x, z], i) => G(spain(i), 71 + i, [x, hop(i + 1, 0.16, 2.6), z], { expr: i % 2 ? "laugh" : "grin", armL: i % 3 ? "up" : "wave", armR: "up", facing: x < 0 ? 1 : -1 }));
        this.conf(st, f - a + 40, 0, 1.4, 0.6, 46, 6); this.flashes(st, f, 0.3);
        for (let i = 0; i < 3; i++) { const f0 = a + 4 + i * 16, t = (f - f0) / 14; if (t >= 0 && t < 1) K(`fw|${i}|${Math.round(t * 14)}`, 500, 500, (p) => fxBurst(p, t, ["#f6c419", "#ff5a4a", "#ffffff"][i], 14, 30, 240), [(i - 1) * 3.2, 5.6 + i * 0.5, -6], 3.4, 3.4, { glow: 2 }); }
        break;
      }
      case 18: { // wait. How does an octopus get eight out of eight?
        tank(); paul(PAUL_HOME, f < B.como ? { expr: "happy", pose: "wave" } : { expr: "think", pose: "shrug", look: 1, lookY: -1 }, 1.25);
        for (let i = 0; i < 8; i++) { const an = (-70 + i * 20) * Math.PI / 180; tick(q(Math.sin(an) * 0.66, 2.42 + Math.cos(an) * 0.78, -4.75), 0.24, a + 2 + i * 3); }
        const qk = pop(B.como, 10); if (qk > 0) K("q", 200, 250, fxQ, q(0.5 + 0.03 * Math.sin(f * 0.3), 1.72, -4.7), 0.36 * qk, 0.45 * qk, { rot: 0.15 * Math.sin(f * 0.2) });
        break;
      }
      case 19: { // octopuses see no colour, but bright stripes pull them in. And Spain's flag is one huge yellow stripe.
        const grey = f >= B.colores, gl = Math.round(clamp01((f - B.rayas) / 14) * 4) / 4 * (f >= B.amarilla ? 0.75 + 0.25 * Math.abs(Math.sin((f - B.amarilla) * 0.35)) > 0.87 ? 1 : 0.75 : 0.75);
        const drift = 0.28 * smooth(ramp(f, B.rayas, B.rayas + 40));
        tank(false);
        paul(q(-0.46 + drift, 2.05 + drift * 0.6, -5.2), f < B.colores ? { expr: "idle", look: 1 } : f < B.rayas ? { expr: "think", look: 1 } : { expr: "wow", pose: "reachR" }, 1.05);
        K(`flag|es|${grey}|${gl}`, 600, 400, (p) => fxFlag(p, "es", grey, gl), q(0.4, 2.55, -5.1), 0.8, 0.533, { rot: 0.03 * Math.sin(f * 0.1), glow: gl > 0 ? 1.25 : 1 });
        K(`flag|nl|${grey}`, 600, 400, (p) => fxFlag(p, "nl", grey), q(0.4, 1.6, -5.1), 0.8, 0.533, { rot: -0.03 * Math.sin(f * 0.1) });
        if (f >= B.colores && f < B.colores + 6) spark(q(0.4, 2.1, -4.9), 0.5);
        if (f >= B.rayas) { spark(q(0.7, 2.62, -4.95), 0.16); if (f >= B.amarilla) spark(q(0.12, 2.5, -4.95), 0.12); }
        break;
      }
      case 20: { // or pure luck: one in two hundred and fifty-six
        tank(); paul(PAUL_HOME, { expr: f < B.una + 30 ? "idle" : "smug", pose: "shrug", lookY: -1 }, 1.25);
        for (let i = 0; i < 8; i++) {
          const an = (-70 + i * 20) * Math.PI / 180, x = Math.sin(an) * 0.66, y0 = 2.42 + Math.cos(an) * 0.78, f0 = a + 3 + i * 4, land = f0 + 16;
          if (f < f0) continue;
          if (f < land) { const u = (f - f0) / 16, y = y0 - 0.9 + 0.9 * u + 0.5 * Math.sin(u * Math.PI), sq = Math.abs(Math.cos((f - f0) * 0.9)); K("pcoin", 160, 160, fxPulpoCoin, q(x, y, -4.75), 0.22 * (0.12 + 0.88 * sq), 0.22); }
          else tick(q(x, y0, -4.75), 0.24, land);
        }
        if (f >= a + 3 + 7 * 4 + 16) spark(q(0, 3.35, -4.7), 0.3);
        break;
      }
      case 21: { // never mind: Manolo's town made him its honorary friend
        ceremony(true); stall(); this.conf(st, f - a + 30, CX + 6.4, 1.3, 2.4, 40, 5); spark([PORTRAIT[0] + 0.42, PORTRAIT[1] + 0.48, PORTRAIT[2] + 0.05], 0.22);
        break;
      }
      case 22: { // ...and 30,000 euros were offered to bring him to the octopus festival
        G(BOSS, 15, c(3.5, 0, 3.0), { facing: 1, expr: "grin", armR: "front", holdR: "case", armL: "point" });
        for (let i = 0; i < 9; i++) { const t = ((f - a) * 0.02 + hs(i, 3)) % 1; K("bill", 160, 100, fxBill, c(3.3 + (hs(i, 1) - 0.3) * 1.6 + 0.2 * Math.sin(f * 0.12 + i), 1.2 + t * 2.0, 3.05 + (hs(i, 2) - 0.5) * 0.6), 0.26, 0.16, { rot: f * 0.08 + i * 2 }); }
        K("portrait|true", 560, 760, (p) => fxPortrait(p, true), PORTRAIT, 1.27, 1.72);
        G(MAYOR, 12, c(5.75, 0.44, 1.45), { facing: -1, expr: "stern", armL: "hip", armR: "hip" });
        G(MANOLO, 5, c(1.6, 0, 1.4), { facing: 1, expr: "shock", armL: "hip" }); stall();
        [[5.4, 4.4], [6.8, 4.9], [8.0, 4.3]].forEach(([x, z], i) => G(folk(20 + i * 7, "town"), 100 + i, c(x, 0, z), { back: i < 3, facing: -1, expr: "shock" }));
        break;
      }
      default: { // as a guest. Not as a dish.
        const dish = f >= B.plato, inK = smooth(ramp(f, B.plato + 2, B.platoIn + 8)), seen = f >= B.platoIn + 10, away = smooth(ramp(f, B.platoIn + 30, B.platoIn + 40));
        const po: PaulO = !dish ? { expr: "smug", napkin: true, medal: true, pose: "wave" } : seen ? { expr: "scared", napkin: true, medal: true, sweat: true, look: -1, lookY: 1 } : { expr: "happy", napkin: true, medal: true };
        const oo: PaulO = { ...po, t: Math.round(((f * 0.022) % 1) * 12) / 12 };
        K("bowl|" + JSON.stringify(oo), 800, 800, (p) => fxBowlPaul(p, oo), [BOWL[0] + (seen ? 0.012 * Math.sin(f * 2.2) : 0), BOWL[1], BOWL[2]], 0.74, 0.74);
        G(MANOLO, 5, c(-0.6, 0, 2.0), !dish ? { expr: "grin", armR: "up", holdR: "cup", armL: "hip" } : away > 0 ? { expr: "whistle", look: -1, armL: "hip", armR: "hip", headTilt: -5 } : seen ? { expr: "shock", sweat: 1, armR: "front" } : { expr: "grin", armR: "front" });
        G(folk(27, "town"), 110, c(-1.75, 0, 2.0), { facing: 1, expr: "grin", ...(dish ? {} : clap(0)) }); G(folk(41, "town"), 111, c(1.7, 0, 2.0), { facing: -1, expr: dish && seen ? "shock" : "grin", ...(dish ? {} : clap(1)) });
        if (dish) K("plate", 560, 300, fxPlate, c(lerp(-1.5, -0.3, inK) - away * 1.4, 0.89 + away * 0.25, 2.98), 0.5, 0.268);
        stall();
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
    if (s.place === "plaza") Rr = Math.max(Rr, 26);
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
    if (s.place === "plaza") { this.fog.near = s.light === "night" ? 22 : 30; this.fog.far = s.light === "night" ? 150 : 260; }
    if (s.place === "aqua") { this.fog.near = 60; this.fog.far = 900; }
    const night = s.light === "night";
    for (const nm of NIGHT_MATS) nm.m.emissiveIntensity = night ? nm.k : 0;
    for (const lm of LAMP_MATS) { const h = (lm.userData as { hot: [number, number, number] }).hot, k = night ? 1 : 0.5; lm.color.setRGB(h[0] * k, h[1] * k, h[2] * k); }
    this.refs.fest.visible = !!s.fest; this.refs.screen.visible = this.refs.flags.visible = !!s.night; this.refs.lids.visible = !!s.lids;
    this.starPts.visible = night && s.place !== "aqua"; this.starPts.position.copy(cam.position);
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
    const roar = id === 16 || id === 17;
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

