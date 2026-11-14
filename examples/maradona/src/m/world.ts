// The Maradona short's world: Mexico City stadium bowl (pitch, crowd stands, goals, boards), a Villa Fiorito dirt street
// with low brick/plaster houses, and a small bedroom. Same look modules as the bridge short (two-tone world, lit cards,
// ink, lens, grade). update(id, f, cam, scene) poses everything for shot id at frame f (pure function of id + f).
import * as THREE from "three";
import { Pool, Actor, Fx, SU } from "./pool";
import { NOINK } from "./ink";
import { TONE, CHAR, twoTone, untone } from "./shade";
import { LIGHTS, LOOK } from "./lights";
import { ctex, rep, rng, grassHD, facadeHD, cloudHD } from "./paint";
import { Pen, bodyFront, bodySide, fxBurst, fxContact, fxPuff, fxStars, fxRing, fxCloud, Outfit, FrontOpts, SideOpts, INK } from "./toon";
import { fxBall, fxCup, fxPlates, fxCog, fxConfetti, fxSpeed, fxQ, fxFlash, fxZ, fxBracket, fxSweat } from "./props";
import { FPS, SHOTS, BX, RM, GX, W, V3, camAt, smooth, clamp01, runX, BEATEN, lerp, RS, lobAt, kidZ, tallX, shortAt } from "./story";

// ---------------- outfits ----------------
const HAIR = "#1d1310";
export const DIEGO: Outfit = { jacket: "#2d4ea8", pants: "#1f2433", boots: INK, hat: "hair", hair: HAIR, skin: "#f6d9b8", build: "stout", buttons: "none", shorts: "#f4f3ee", socks: "#f4f3ee", curly: true, num: "10" };
const DIEGO86: Outfit = { ...DIEGO, jacket: "#8ec9ee", stripes: "#fbfbf6", shorts: "#1f2433" }; // striped home shirt (final)
const ARG = (v: number): Outfit => ({ ...DIEGO, build: "adult", curly: false, num: String([3, 7, 11, 5, 2, 9][v % 6]), skin: ["#fbe3c8", "#f3d0b0", "#fde9d4"][v % 3], hair: ["#2a1d16", "#3b2a1c", "#16100c"][v % 3] });
const ENG = (v: number): Outfit => ({ buttons: "none", shorts: "#2b3a78", socks: "#f4f3ee", jacket: "#f4f3ee", pants: "#26315e", boots: INK, hat: "hair", hair: ["#b9884f", "#4a3020", "#d6b46a", "#2a1d16"][v % 4], skin: ["#fff0e0", "#fde3cc", "#ffeede", "#e8c3a0"][v % 4] });
const KEEPER: Outfit = { buttons: "none", shorts: "#2c2f36", socks: "#8d939b", jacket: "#8d939b", pants: "#2c2f36", boots: INK, hat: "hair", hair: "#6b4a30", skin: "#ffeede", moustache: undefined };
const REF: Outfit = { buttons: "none", shorts: "#1e1e24", socks: "#1e1e24", jacket: "#1e1e24", pants: "#1e1e24", boots: INK, hat: "hair", hair: "#22180f", skin: "#e2b48c", moustache: "#22180f" };
const KID: Outfit = { buttons: "none", curly: true, shorts: "#3b5b9a", socks: "#f6d9b8", jacket: "#8ec9ee", stripes: "#fbfbf6", pants: "#3b5b9a", boots: "#6b4a30", hat: "hair", hair: HAIR, skin: "#f6d9b8", build: "kid" };
const WAITER: Outfit = { jacket: "#f6f3ec", pants: "#22242c", boots: INK, hat: "hair", hair: "#3b2a1c", buttons: "#22242c", moustache: "#3b2a1c", skin: "#fde9d4" };

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
const mats = new Map<string, THREE.MeshLambertMaterial>();
const lam = (key: string, make: () => THREE.MeshLambertMaterialParameters) => {
  let m = mats.get(key);
  if (!m) { m = twoTone(new THREE.MeshLambertMaterial(make())); mats.set(key, m); }
  return m;
};
const add = (root: THREE.Object3D, geo: THREE.BufferGeometry, mat: THREE.Material, cast = true) => {
  const m = new THREE.Mesh(geo, mat); m.castShadow = cast; m.receiveShadow = true; root.add(m); return m;
};
/** box with UVs in metres / tile (so textures keep their scale) */
const box = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, tile = 0) => {
  const g = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0);
  g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  if (tile) {
    const uv = g.getAttribute("uv") as THREE.BufferAttribute, sx = x1 - x0, sy = y1 - y0, sz = z1 - z0;
    const dims: [number, number][] = [[sz, sy], [sz, sy], [sx, sz], [sx, sz], [sx, sy], [sx, sy]];
    for (let f = 0; f < 6; f++) for (let i = 0; i < 4; i++) { const k = f * 4 + i; uv.setXY(k, uv.getX(k) * dims[f][0] / tile, uv.getY(k) * dims[f][1] / tile); }
  }
  return g;
};
const ground = (x0: number, x1: number, z0: number, z1: number, y = 0, tu = 1, tv = 1) => {
  const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0); g.rotateX(-Math.PI / 2); g.translate((x0 + x1) / 2, y, (z0 + z1) / 2);
  const uv = g.getAttribute("uv") as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * tu, uv.getY(i) * tv);
  return g;
};
const repT = (t: THREE.Texture) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t; };

// ---------------- staging types ----------------
type Who = { o: Outfit; seed: number; okey: string; scale?: number };
type Place = { key: string; draw: (p: Pen) => void; x: number; y: number; z: number; scale: number; mirror?: boolean; roll?: number; faceUp?: boolean; sx?: number; sy?: number };
type FxPlace = { key: string; cw: number; ch: number; draw: (p: Pen) => void; x: number; y: number; z: number; w: number; h: number; flat?: boolean; rot?: number; soft?: boolean; glow?: number };
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
const who = (o: Outfit, seed: number, scale = 1): Who => ({ o, seed, okey: JSON.stringify(o), scale });

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
  private light = "day" as "day" | "golden";
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
    this.buildBarrio(R);
    this.buildRoom(R);
    this.buildResto(R);
    for (let i = 0; i < 40; i++) this.actors.push(new Actor(R));
    for (let i = 0; i < 150; i++) this.fxs.push(new Fx(R));
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

  private buildBarrio(R: THREE.Object3D) {
    const dt = repT(dirtTex());
    add(R, ground(BX - 60, BX + 60, -120, 120, 0, 24, 48), lam("dirt", () => ({ map: dt })), false);
    const r = rng(11);
    const walls = ["#e8c9a0", "#cfe0c4", "#f0c4b4", "#e6d7a8", "#bfd5e0"];
    const tin = repT(tinTex());
    for (const side of [-1, 1]) for (let i = 0; i < 18; i++) {
      const z = -80 + i * 9 + r() * 2, w = 6.5 + r() * 2, h = 2.8 + r() * 0.8, d = 6, x0 = BX + side * (5.5 + r() * 1.2);
      const brickWall = r() < 0.4;
      const tex = brickWall ? facadeHD(`fio${side}_${i}`, w, h, { wall: "#b5643f", shutter: ["#3f6fb5", "#5d7a3a", "#8c3b4a"][i % 3], door: true, brick: true })
        : facadeHD(`fio${side}_${i}`, w, h, { wall: walls[i % 5], shutter: ["#3f6fb5", "#5d7a3a", "#8c3b4a", "#b5653f"][i % 4], door: true });
      const xa = side < 0 ? x0 - d : x0, xb = side < 0 ? x0 : x0 + d;
      const body = box(xa, 0, z - w / 2, xb, h, z + w / 2);
      const mFront = twoTone(new THREE.MeshLambertMaterial({ map: tex }));
      const mSide = lam("plain" + (i % 5), () => ({ map: repT(plasterTex("" + (i % 5), walls[i % 5])) }));
      // face order px nx py ny pz nz: the street-facing face gets the facade
      const ms = [mSide, mSide, mSide, mSide, mSide, mSide]; ms[side < 0 ? 0 : 1] = mFront;
      const m = new THREE.Mesh(body, ms); m.castShadow = m.receiveShadow = true; R.add(m);
      if (side < 0) { const uvA = body.getAttribute("uv") as THREE.BufferAttribute; void uvA; }
      // tin roof, slightly sloped, overhanging the street
      const rg = box(Math.min(xa, xb) - (side < 0 ? 0 : 0.6), h, z - w / 2 - 0.2, Math.max(xa, xb) + (side < 0 ? 0.6 : 0), h + 0.12, z + w / 2 + 0.2, 2);
      const rm = add(R, rg, lam("tin", () => ({ map: tin })));
      rm.rotation.z = 0; void rm;
      // a tree or a pole every few houses
      if (i % 3 === 1) {
        const tx = BX + side * 4.6, tz = z + w / 2 + 0.5;
        add(R, box(tx - 0.15, 0, tz - 0.15, tx + 0.15, 2.6, tz + 0.15), lam("trunk", () => ({ color: "#6b4a30" })));
        for (let k = 0; k < 4; k++) { const sp = new THREE.SphereGeometry(1.1 + r() * 0.5, 16, 12); sp.translate(tx + (r() - 0.5) * 1.4, 3.2 + r() * 0.9, tz + (r() - 0.5) * 1.4); add(R, sp, lam("leaf", () => ({ color: "#5aa046" }))); }
      }
      if (i % 3 === 2) { const px = BX + side * 4.8; add(R, box(px - 0.1, 0, z - 0.1, px + 0.1, 6.5, z + 0.1), lam("pole", () => ({ color: "#7a6a58" }))); }
    }
    // overhead wires between the poles, a washing line, roof water tanks, a low fence
    for (const side of [-1, 1]) for (const h of [6.3, 5.9]) add(R, box(BX + side * 4.8 - 0.015, h, -80, BX + side * 4.8 + 0.015, h + 0.03, 80), lam("wire", () => ({ color: "#2a2430" })), false);
    add(R, box(BX - 4.6, 2.5, 13.99, BX + 4.6, 2.52, 14.01), lam("wire", () => ({ color: "#2a2430" })), false);
    ["#e8e4da", "#d64a3c", "#8ec9ee", "#f2c94c", "#e8e4da"].forEach((c, i) => add(R, box(BX - 3.4 + i * 1.5, 1.75, 13.98, BX - 2.7 + i * 1.5, 2.5, 14.02), lam("wash" + c, () => ({ color: c }))));
    for (let i = 0; i < 18; i += 2) for (const side of [-1, 1]) { const tz = -80 + i * 9 + 1; const cyl = new THREE.CylinderGeometry(0.55, 0.55, 1.0, 14); cyl.translate(BX + side * 8.5, 4.3, tz); add(R, cyl, lam("tank", () => ({ color: "#4a5a7a" }))); }
    for (let i = 0; i < 30; i++) add(R, box(BX + 4.95, 0, 9 + i * 0.35, BX + 5.05, 0.9 + (i % 3) * 0.08, 9.2 + i * 0.35), lam("fence", () => ({ color: "#8a6a48" })));
    // a café table + chairs for the waiters' corner
    const wood = lam("wood", () => ({ color: "#9a6a42" }));
    add(R, box(BX + 1.2, 0, -1.6, BX + 1.3, 0.72, -1.5), wood); add(R, box(BX + 0.7, 0.72, -2.1, BX + 1.8, 0.78, -1.0), wood);
    add(R, box(BX + 2.3, 0, -1.9, BX + 2.8, 0.45, -1.4), wood);
  }

  private buildRoom(R: THREE.Object3D) {
    const [x, , z] = RM;
    const wall = lam("roomWall", () => ({ map: repT(plasterTex("room", "#d8c9a8")) }));
    const A = (g: THREE.BufferGeometry, m: THREE.Material) => add(R, g, m, false);
    A(box(x - 3, -0.1, z - 3, x + 3, 0, z + 3.4), lam("floor", () => ({ map: repT(ctex("planks", 256, 256, (g) => { for (let i = 0; i < 4; i++) { g.fillStyle = i % 2 ? "#a77c4e" : "#9a7044"; g.fillRect(0, i * 64, 256, 64); g.fillStyle = "#5a3b22"; g.fillRect(0, i * 64, 256, 4); g.fillRect((i * 97) % 256, i * 64, 4, 64); } })) })));
    A(box(x - 3, 0, z - 1.6, x + 3, 3.2, z - 1.4, 2), wall);
    A(box(x - 3, 0, z - 1.6, x - 2.8, 3.2, z + 3.4, 2), wall);
    A(box(x + 2.8, 0, z - 1.6, x + 3, 3.2, z + 3.4, 2), wall);
    // window: night sky + moon, wooden frame, sill
    const wt = ctex("nightWin", 256, 256, (g) => { const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, "#27408f"); gr.addColorStop(1, "#6d8fe0"); g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
      g.fillStyle = "#fff8d8"; g.beginPath(); g.arc(176, 84, 34, 0, Math.PI * 2); g.fill(); g.fillStyle = "#ffffff"; for (const [sx, sy] of [[40, 50], [90, 120], [60, 190], [210, 180], [120, 40]]) g.fillRect(sx, sy, 5, 5); });
    const win = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.2), new THREE.MeshBasicMaterial({ map: wt, color: new THREE.Color(2.2, 2.2, 2.4) }));
    win.position.set(x + 1.3, 1.8, z - 1.39); R.add(win);
    const wood = lam("bedwood", () => ({ color: "#8a5a34" }));
    for (const [a0, b0, a1, b1] of [[0.66, 1.16, 1.94, 1.24], [0.66, 2.36, 1.94, 2.44], [0.66, 1.16, 0.74, 2.44], [1.86, 1.16, 1.94, 2.44], [1.27, 1.2, 1.33, 2.4], [0.7, 1.77, 1.9, 1.83]]) A(box(x + a0, b0, z - 1.42, x + a1, b1, z - 1.34), wood);
    A(box(x + 0.6, 1.1, z - 1.42, x + 2.0, 1.16, z - 1.22), wood);
    // bed
    A(box(x - 1.3, 0, z - 1.1, x + 1.0, 0.35, z - 0.1), wood);
    A(box(x - 1.38, 0, z - 1.15, x - 1.26, 1.0, z - 0.05), wood);
    A(box(x - 1.25, 0.35, z - 1.05, x + 0.95, 0.5, z - 0.15), lam("mattress", () => ({ color: "#efe9dc" })));
    A(box(x - 1.2, 0.5, z - 0.95, x - 0.7, 0.62, z - 0.25), lam("pillow", () => ({ color: "#f7f4ec" })));
    A(box(x - 0.45, 0.5, z - 1.08, x + 0.98, 0.6, z - 0.1), lam("blanket", () => ({ map: repT(blanketTex()) })));
    // bedside crate, shelf with tins, a pennant and a little rug
    A(box(x + 1.5, 0, z - 1.3, x + 2.2, 0.55, z - 0.7), wood);
    A(box(x - 2.6, 1.9, z - 1.42, x - 0.9, 1.96, z - 1.18), wood);
    ["#d64a3c", "#f2c94c", "#3d6fc4"].forEach((c, i) => A(box(x - 2.4 + i * 0.5, 1.96, z - 1.38, x - 2.15 + i * 0.5, 2.3 - i * 0.07, z - 1.22), lam("tin" + c, () => ({ color: c }))));
    A(box(x - 0.4, 2.2, z - 1.41, x + 0.3, 2.55, z - 1.39), lam("pennant", () => ({ map: ctex("pennant", 64, 32, (g) => { g.fillStyle = "#8ec9ee"; g.fillRect(0, 0, 64, 32); g.fillStyle = "#fff"; g.fillRect(0, 11, 64, 10); }) })));
    A(box(x - 1.0, 0.005, z + 0.2, x + 0.9, 0.02, z + 1.3), lam("rug", () => ({ map: ctex("rug", 64, 64, (g) => { g.fillStyle = "#3d6fc4"; g.fillRect(0, 0, 64, 64); g.fillStyle = "#f2c94c"; g.fillRect(6, 6, 52, 52); g.fillStyle = "#c9473d"; g.fillRect(14, 14, 36, 36); }) })));
  }

  /** the restaurant of the waiters: checker floor, wallpaper + wainscot, round tables with cloths, hanging lamps */
  private buildResto(R: THREE.Object3D) {
    const [x, , z] = RS;
    const A = (g: THREE.BufferGeometry, m: THREE.Material) => add(R, g, m, false);
    A(ground(x - 12, x + 12, z - 4, z + 8, 0, 24, 12), lam("check", () => ({ map: repT(checkTex()) })));
    const wp = lam("wallpaper", () => ({ map: repT(wallpaperTex()) }));
    const wg = new THREE.PlaneGeometry(24, 3.6); wg.translate(x, 1.8, z - 4); { const uvA = wg.getAttribute("uv") as THREE.BufferAttribute; for (let i = 0; i < uvA.count; i++) uvA.setX(i, uvA.getX(i) * 13); }
    A(wg, wp);
    A(box(x - 12, 3.6, z - 4.2, x + 12, 12, z - 4.01), lam("upperWall", () => ({ color: "#7a2f36" })));
    A(box(x - 12, 3.5, z - 4.05, x + 12, 3.7, z - 3.9), lam("restoWood2", () => ({ color: "#4a2a1c" })));
    const wood = lam("restoWood", () => ({ color: "#6e4230" })), cloth = lam("cloth", () => ({ color: "#f7f1e4" })), brass = lam("brass", () => ({ color: "#e0b050" }));
    // kitchen door with a porthole, picture frames
    A(box(x + 0.4, 0, z - 4.02, x + 1.7, 2.3, z - 3.92), lam("kdoor", () => ({ color: "#c9d6c4" })));
    const ph = new THREE.CylinderGeometry(0.22, 0.22, 0.06, 20); ph.rotateX(Math.PI / 2); ph.translate(x + 1.05, 1.6, z - 3.9); A(ph, lam("porthole", () => ({ color: "#ffe9a8" })));
    [[-5.2, "#f2c94c"], [-2.6, "#8ec9ee"], [4.2, "#57a05a"], [6.8, "#ef8a3a"]].forEach(([dx, c]) => { A(box(x + (dx as number) - 0.45, 1.55, z - 4.02, x + (dx as number) + 0.45, 2.25, z - 3.94), brass); A(box(x + (dx as number) - 0.36, 1.63, z - 3.95, x + (dx as number) + 0.36, 2.17, z - 3.92), lam("pic" + c, () => ({ color: c as string }))); });
    for (const dx of [-3.6, -0.6, 2.6, 5.6]) {
      const tz = z + 0.2;
      const leg = new THREE.CylinderGeometry(0.07, 0.07, 0.72, 10); leg.translate(x + dx, 0.36, tz); A(leg, wood);
      const top = new THREE.CylinderGeometry(0.72, 0.72, 0.06, 28); top.translate(x + dx, 0.75, tz); A(top, cloth);
      const skirt = new THREE.CylinderGeometry(0.72, 0.8, 0.3, 28, 1, true); skirt.translate(x + dx, 0.6, tz); A(skirt, lam("clothSkirt", () => ({ color: "#f7f1e4", side: THREE.DoubleSide })));
      const candle = new THREE.CylinderGeometry(0.03, 0.03, 0.2, 8); candle.translate(x + dx, 0.88, tz); A(candle, lam("candle", () => ({ color: "#fff6d8" })));
      for (const s of [-1, 1]) { A(box(x + dx + s * 1.05 - 0.2, 0, tz - 0.2, x + dx + s * 1.05 + 0.2, 0.45, tz + 0.2), wood); A(box(x + dx + s * 1.23 - 0.03, 0.45, tz - 0.2, x + dx + s * 1.23 + 0.03, 1.0, tz + 0.2), wood); }
      // hanging lamp: cord + shade + glowing bulb
      A(box(x + dx - 0.012, 3.0, tz - 0.012, x + dx + 0.012, 4.2, tz + 0.012), lam("cord", () => ({ color: "#2a2430" })));
      const shd = new THREE.ConeGeometry(0.42, 0.34, 20, 1, true); shd.translate(x + dx, 2.9, tz); A(shd, lam("lampShade", () => ({ color: "#2f7a6a", side: THREE.DoubleSide })));
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(6, 4.6, 2.4) })); bulb.position.set(x + dx, 2.74, tz); bulb.layers.set(NOINK); R.add(bulb);
    }
  }

  // ---------------- staging ----------------
  private person(w: Who, x: number, y: number, z: number, opts: { side?: boolean; mirror?: boolean; fo?: FrontOpts; so?: SideOpts; roll?: number; scale?: number; sx?: number; sy?: number }): Place {
    const light = this.lightAngle, seed = w.seed;
    const key = opts.side ? `S|${w.okey}|${fkey({ ...opts.so, light, seed })}` : `F|${w.okey}|${fkey({ ...opts.fo, light, seed })}`;
    return { key, x, y, z, scale: opts.scale ?? w.scale ?? 1, mirror: opts.mirror, roll: opts.roll, sx: opts.sx, sy: opts.sy,
      draw: (p) => (opts.side ? bodySide(p, w.o, { ...opts.so, light, seed }) : bodyFront(p, w.o, { ...opts.fo, light, seed })) };
  }
  private contact(st: Stage, x: number, z: number, s = 1, y = 0) {
    const cc = this.light === "day" ? "#55556e" : "#5e5070";
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

  private stage(id: number, f: number): Stage {
    const st: Stage = { places: [], fx: [] }, P = (p: Place) => st.places.push(p);
    const D = who(DIEGO, 3, 0.92), blink = (s: number) => lidAt(f, s);
    const hop = (i: number, amp = 0.1, sp = 3) => amp * Math.abs(Math.sin(f / sp + i * 1.7));
    switch (id) {
      case 1: { // hook: the ball, the face, the hand, the feet, then the whole bowl
        const hand = clamp01((f - 58) / 8) * (1 - clamp01((f - 100) / 6)), jug = f >= 104 && f < 150, cheer = smooth((f - 150) / 8);
        const ph = ((f - 104) / 14) % 1;
        P(this.person(D, 36, jug ? 0 : hop(0, 0.06 * cheer, 2.5), 0.6, { fo: { mode: jug ? "march" : "stand", phase: ph, lift: 70, expr: cheer > 0 ? "laugh" : jug ? "grin" : hand > 0.2 ? "smile_closed" : "smile", blink: blink(3), look: -0.3,
          wave: cheer > 0 ? cheer : hand > 0 ? hand : undefined, waveL: cheer > 0 ? cheer : undefined, tilt: hand * -3 },
          sy: 1 + 0.03 * Math.sin(f / 9) }));
        this.contact(st, 36, 0.6, 1);
        if (jug) this.ball(st, 36 + 0.12 * Math.sin(ph * 6.28), 0.2 + 0.5 * Math.abs(Math.sin(ph * 6.28)), 0.92, f);
        else this.ball(st, 35.75, 0, 0.95, f < 104 ? 0 : f);
        if (hand > 0.5) this.spark(st, 36.38, 1.5, 0.66, 0.3, f);
        if (jug) this.spark(st, 36.3, 0.5, 0.95, 0.22, f);
        P(this.person(who(ENG(1), 21), 41.6, 0, -2.6, { fo: { mode: "stand", expr: cheer > 0 ? "nervous" : "stern", blink: blink(21), look: -1 } })); this.contact(st, 41.6, -2.6);
        P(this.person(who(ENG(3), 23), 45, 0, -8.2, { fo: { mode: "stand", expr: "nervous", blink: blink(23), look: -1 } })); this.contact(st, 45, -8.2);
        P(this.person(who(ARG(2), 22), 38.6, hop(2, 0.12 * cheer), -6.6, { fo: { mode: "stand", expr: cheer > 0 ? "laugh" : "neutral", blink: blink(22), look: 1, wave: cheer > 0 ? 1 : undefined } })); this.contact(st, 38.6, -6.6);
        this.flashes(st, f, f > 146 ? 0.12 : 0.02);
        break;
      }
      case 2: { // kid Diego tearing down the dirt road, ball at his feet, friends chasing
        const t = (f - 194) / FPS, z = kidZ(f), ph = (t * 2.3) % 1;
        P(this.person(who(KID, 5), BX - 0.1, 0, z, { fo: { mode: "march", phase: ph, lift: 75, expr: "grin", blink: blink(5), look: 0 } }));
        this.contact(st, BX - 0.1, z, 0.8);
        this.ball(st, BX - 0.1 + 0.22 * Math.sin(t * 5), 0.32 * Math.abs(Math.sin(t * 2.3 * Math.PI)), z - 0.75, f);
        this.puffs(st, f, (fe) => [BX - 0.1, kidZ(fe) + 0.35], 6, 18, 0.8);
        const pals: [Outfit, number, number, number][] = [[{ ...KID, curly: false, jacket: "#d64a3c", hair: "#4a3020" }, 6, 1.1, 2.4], [{ ...KID, curly: false, jacket: "#57a05a", hair: "#16100c" }, 7, -1.4, 3.3]];
        pals.forEach(([o, sd, dx, dz], i) => {
          P(this.person(who(o, sd, 0.95), BX + dx, 0, z + dz, { fo: { mode: "march", phase: (ph + 0.3 + i * 0.25) % 1, lift: 70, expr: i ? "laugh" : "grin", blink: blink(sd), wave: i ? 1 : undefined } }));
          this.contact(st, BX + dx, z + dz, 0.8);
        });
        P(this.person(who(townsfolkLike(0), 41), BX + 3.7, 0, 5, { fo: { mode: "stand", expr: "smile", blink: blink(41), look: -0.5, wave: 0.6 + 0.4 * Math.sin(f / 5) } })); this.contact(st, BX + 3.7, 5);
        P(this.person(who(townsfolkLike(1), 42), BX - 3.9, 0, 0.5, { fo: { mode: "stand", expr: "laugh", blink: blink(42), look: 0.5 } })); this.contact(st, BX - 3.9, 0.5);
        break;
      }
      case 3: { // asleep under the moonlit window, hugging the ball
        const br = 1 + 0.025 * Math.sin(f / 9);
        P({ ...this.person(who(KID, 5), RM[0] + 0.55, 0.62, RM[2] - 0.45, { fo: { mode: "sit", expr: "relief", blink: 1, headTilt: 8 }, sy: br }), roll: Math.PI / 2 - 0.05, faceUp: true });
        st.fx.push({ key: "ballHug", cw: 256, ch: 256, draw: (p) => fxBall(p, 0.3), x: RM[0] + 0.12, y: 0.72, z: RM[2] - 0.28, w: 0.28, h: 0.28 });
        for (let k = 0; k < 3; k++) { const u = ((f / 45 + k / 3) % 1 + 1) % 1; st.fx.push({ key: "z", cw: 120, ch: 120, draw: fxZ, x: RM[0] - 0.75 + u * 0.5 + 0.06 * Math.sin(u * 9), y: 1.05 + u * 0.75, z: RM[2] - 0.5, w: 0.1 + 0.1 * u, h: 0.1 + 0.1 * u, rot: 0.2 * Math.sin(u * 7) }); }
        break;
      }
      case 4: { // the two teams lined up; Diego the captain in front; then 114,000 people
        for (let i = 0; i < 6; i++) {
          P(this.person(who(ARG(i), 30 + i), -3 - i * 1.2, hop(i, f > 500 ? 0.1 : 0), -0.2 - i * 0.35, { fo: { mode: "stand", expr: i % 2 ? "stern" : "neutral", blink: blink(30 + i), look: 0.3 } })); this.contact(st, -3 - i * 1.2, -0.2 - i * 0.35);
          P(this.person(who(ENG(i), 50 + i), 4 + i * 1.2, 0, -1.0 - i * 0.35, { fo: { mode: "stand", expr: i % 3 === 0 ? "stern" : i % 3 === 1 ? "nervous" : "neutral", blink: blink(50 + i), look: -0.3 } })); this.contact(st, 4 + i * 1.2, -1.0 - i * 0.35);
        }
        const cap = smooth((f - W.captain + 4) / 8);
        P(this.person(D, -1.4, 0, 0.6, { fo: { mode: "stand", expr: cap > 0.5 ? "grin" : "stern", blink: blink(3), look: 0.5, facing: 1, wave: cap > 0 ? cap : undefined }, sy: 1 + 0.05 * cap * Math.abs(Math.sin(f / 5)) })); this.contact(st, -1.4, 0.6);
        P(this.person(who(REF, 70), 1.4, 0, -0.4, { fo: { mode: "stand", expr: "neutral", blink: blink(70) } })); this.contact(st, 1.4, -0.4);
        this.ball(st, 1.9, 0, 0.1, 0);
        this.flashes(st, f, f > 500 ? 0.16 : 0.03);
        break;
      }
      case 5: { // the miskick, the ball hanging in the sky, keeper vs Diego under it
        const b = lobAt(f), kicked = f >= 645;
        const kph = lerp(0.5, 0.78, clamp01((f - 634) / 11));
        if (!kicked) P(this.person(who(ENG(2), 52), 45.0, 0, -1.3, { side: true, so: { mode: "march", phase: f < 634 ? ((f - 592) / 16) % 1 : kph, stride: f < 634 ? 0.5 : 1.2, stomp: 1.4, expr: "stern", blink: blink(52) } }));
        else P(this.person(who(ENG(2), 52), 45.0, 0, -1.3, { fo: { mode: "stand", expr: "shock", blink: 0, look: 0.6, waveL: 0.5, wave: 0.5 } }));
        this.contact(st, 45.0, -1.3);
        if (kicked) { const big = 1 + 1.3 * smooth((f - 652) / 10) * (1 - smooth((f - 722) / 8));
          st.fx.push({ key: `ball|${Math.round(((f * 0.35) % (Math.PI * 2 / 5)) * 10) / 10}`, cw: 256, ch: 256, draw: (p) => fxBall(p, Math.round(((f * 0.35) % (Math.PI * 2 / 5)) * 10) / 10), x: b[0], y: b[1] + 0.11, z: b[2], w: 0.24 * big, h: 0.24 * big });
          if (b[1] < 3) this.contact(st, b[0], b[2], 0.4); } else this.ball(st, lerp(43.2, 45.3, clamp01((f - 596) / 46)), 0, -1.15, f);
        if (f >= 645 && f < 655) st.fx.push({ key: `burst|${f - 645}`, cw: 500, ch: 500, draw: (p) => fxBurst(p, (f - 645) / 10, "#fff3b0", 8), x: 45.35, y: 0.3, z: -1.1, w: 0.9, h: 0.9 });
        const smug = f > W.taller - 6;
        P(this.person(who(KEEPER, 61, 1.18), 50.4, 0, -0.4, { fo: { mode: "stand", expr: smug ? "smile" : "stern", blink: blink(61), look: -0.6, wave: smug ? 0.7 : undefined, waveL: smug ? 0.7 : undefined, headTilt: smug ? -5 : 0 } }));
        this.contact(st, 50.4, -0.4, 1.1);
        P(this.person(D, 48.9, 0, 0.9, { fo: { mode: "stand", expr: f > 740 ? "stern" : "neutral", blink: blink(3), look: 0.6, headTilt: 4 } })); this.contact(st, 48.9, 0.9);
        if (f > 738) { const k = smooth((f - 738) / 6); st.fx.push({ key: "bracket", cw: 120, ch: 400, draw: fxBracket, x: 49.68, y: 1.76, z: 0.3, w: 0.13 * k, h: 0.42 * k }); }
        if (f > 648 && f < 732) for (const [cx, cy, cz, cw, sd] of [[46.5, 10.6, -9, 6, 1], [51.5, 7.6, -11, 5, 2], [43.5, 6.4, -8, 4, 3]]) st.fx.push({ key: `cloud|${sd}`, cw: 600, ch: 300, draw: (p) => fxCloud(p, sd), x: cx - (f - 648) * 0.01, y: cy, z: cz, w: cw, h: cw / 2, soft: true });
        this.flashes(st, f, 0.03);
        break;
      }
      case 6: { // the leap, the fist, the net, the sneaky look
        const sneak = f >= 846;
        const crouch = smooth((f - 772) / 8) * (1 - smooth((f - 783) / 4));
        const up = f < 810 ? 1.2 * Math.sin((Math.PI / 2) * clamp01((f - 783) / 27)) : 1.2 * (1 - smooth((f - 816) / 16));
        const hit = f >= W.punch;
        const kup = 0.62 * Math.sin(Math.PI * clamp01((f - 787) / 44));
        P(this.person(who(KEEPER, 61, 1.18), 51.0, kup, 0.3, { fo: { mode: kup > 0.05 ? "fall" : "stand", expr: hit ? "shock" : "stern", blink: blink(61), look: -0.4 }, sy: 1 - 0.1 * crouch, roll: hit ? -0.25 * smooth((f - W.punch) / 10) : 0 }));
        this.contact(st, 51.0, 0.3, 1.1 - kup * 0.5);
        if (!sneak) {
          P(this.person(D, 50.0, up, 0.5, { fo: { mode: "stand", expr: hit ? "grin" : "stern", blink: blink(3), look: 0.7, wave: f > W.jumps + 2 ? clamp01((f - W.jumps - 2) / 8) : undefined, tilt: up > 0.1 ? 8 : 0 }, sy: 1 - 0.14 * crouch + 0.08 * clamp01(up) * (hit ? 0 : 1) }));
          this.contact(st, 50.0, 0.5, 1 - up * 0.5);
        } else {
          const fist = smooth((f - 862) / 6);
          P(this.person(D, 47.7, hop(0, 0.05, 2.5) * (1 - fist), 1.2, { fo: { mode: "stand", expr: fist > 0.5 ? "smile" : "whistle", blink: blink(3), look: fist > 0.5 ? 0.2 : -1, wave: fist > 0 ? fist : undefined, headTilt: fist > 0.5 ? 4 : -4 } }));
          this.contact(st, 47.7, 1.2);
          if (fist > 0.6) this.spark(st, 48.08, 1.5, 1.26, 0.28, f);
        }
        const u = clamp01((f - W.punch) / 14), b = lobAt(f);
        if (!hit) this.ball(st, b[0], b[1], b[2], f);
        else this.ball(st, lerp(50.3, 54.0, u), lerp(2.45, 0.5, u * u) * (1 - 0.8 * smooth((f - 826) / 8)), lerp(0.5, 0.1, u), f);
        if (hit && f < W.punch + 12) st.fx.push({ key: `burst|${f - W.punch}`, cw: 500, ch: 500, draw: (p) => fxBurst(p, (f - W.punch) / 12), x: 50.3, y: 2.56, z: 0.6, w: 1.5, h: 1.5 });
        this.flashes(st, f, hit ? 0.12 : 0.02);
        break;
      }
      case 7: { // England protests, Diego tiptoes off, the referee saw nothing
        const pro: [number, number, number, FrontOpts][] = [
          [0, 48.2, -0.6, { expr: "shock", wave: 1, waveL: 1 }], [1, 49.5, 0.5, { expr: "pained", wave: 1 }], [3, 47.1, 0.6, { expr: "stern", wave: 0.6 + 0.4 * Math.sin(f / 3), look: -1 }]];
        pro.forEach(([v, x, z, fo], i) => { P(this.person(who(ENG(v), 80 + i), x, hop(i, 0.12, 2.6), z, { fo: { mode: "stand", blink: blink(80 + i), look: -0.6, ...fo } })); this.contact(st, x, z); });
        P(this.person(who(KEEPER, 61, 1.18), 50.6, hop(5, 0.1, 3), -1.4, { fo: { mode: "stand", expr: "pained", blink: blink(61), wave: 1, look: -0.8 } })); this.contact(st, 50.6, -1.4, 1.1);
        const dx = 46.4 - (f - 874) * 0.03;
        P(this.person(D, dx, 0, 2.2, { side: true, mirror: true, so: { mode: "march", phase: ((f - 874) / 22) % 1, stride: 0.45, stomp: 1.5, expr: "whistle", blink: blink(3) } })); this.contact(st, dx, 2.2);
        const sure = f > 934;
        P(this.person(who(REF, 70), 39.6, 0, 2.0, { fo: { mode: "stand", expr: sure ? "smile_closed" : f > W.referee - 4 ? "neutral" : "whistle", blink: blink(70), look: sure ? 0.4 : -1, facing: sure ? 0 : -1, waveL: sure ? smooth((f - 934) / 6) : undefined, headTilt: f > W.referee - 4 && !sure ? -8 : 0 } })); this.contact(st, 39.6, 2.0);
        if (f > W.referee - 6 && !sure) { const k = smooth((f - W.referee + 6) / 5); st.fx.push({ key: "q", cw: 200, ch: 260, draw: fxQ, x: 40.2, y: 2.0 + 0.04 * Math.sin(f / 4), z: 2.05, w: 0.34 * k, h: 0.44 * k, rot: -0.15 }); }
        P(this.person(who(ARG(1), 31), 37.2, 0, -3.5, { fo: { mode: "stand", expr: "smile", blink: blink(31), look: 1 } })); this.contact(st, 37.2, -3.5);
        this.flashes(st, f, 0.05);
        break;
      }
      case 8: { // his face ... then his boots, and the ball drops in
        const on = f >= 1037;
        P(this.person(D, 0.45, 0, 0, { fo: { mode: "stand", expr: on ? "grin" : f > 985 ? "smile_closed" : "smile", blink: blink(3), look: 0.2, headTilt: 3 * Math.sin(f / 14) }, sy: 1 + 0.02 * Math.sin(f / 8) })); this.contact(st, 0.45, 0);
        [[3.2, -3.4, 1], [4.7, -2.2, 3], [6.0, -4.0, 0]].forEach(([x, z, v], i) => { P(this.person(who(ENG(v), 50 + i), x, 0, z, { fo: { mode: "stand", expr: "nervous", blink: blink(50 + i), look: -1 } })); this.contact(st, x, z); });
        if (f > 1022) { const u = clamp01((f - 1022) / 14); this.ball(st, 0.2, on ? 0.1 * Math.abs(Math.sin((f - 1037) / 3)) * (1 - clamp01((f - 1037) / 9)) : 1.7 * (1 - u * u), 0.38, f); }
        if (on && f < 1046) { st.fx.push({ key: `burst|${f - 1037}`, cw: 500, ch: 500, draw: (p) => fxBurst(p, (f - 1037) / 9, "#fff3b0", 8), x: 0.24, y: 0.14, z: 0.3, w: 0.6, h: 0.6 }); this.spark(st, 0.5, 0.34, 0.4, 0.2, f); }
        break;
      }
      case 9: case 10: { // the turn in his own half, then the run past four, the keeper and the net
        const x = runX(f), ph = ((f - 1095) / 11) % 1;
        const behind = id === 10 && f >= 1238, away = id === 10 && f >= W.net;
        const zD = f > 1150 && f < 1238 ? 0.35 * Math.sin((f - 1150) / 8) : 0;
        if (f < 1078) { // waiting for the pass, two Englishmen closing
          P(this.person(D, -8, 0, 0, { fo: { mode: "stand", expr: "smile", blink: blink(3), look: -0.8 } }));
          this.ball(st, lerp(-13.5, -8.35, smooth((f - 1046) / 26)), 0, lerp(2.6, 0.3, smooth((f - 1046) / 26)), f);
        } else if (f < 1096) { // the pirouette
          const u = (f - 1078) / 18;
          P(this.person(D, -8, 0.05 * Math.sin(u * Math.PI), 0, { fo: { mode: "stand", expr: "grin", blink: 0, look: 0, tilt: 6 * Math.sin(u * 6.28) }, sx: Math.cos(u * Math.PI * 2) || 0.05 }));
          this.ball(st, -8 + 0.42 * Math.cos(u * 6.28 + 3.14), 0, 0.3 + 0.3 * Math.sin(u * 6.28 + 3.14), f);
          this.stars(st, -8, 1.95, 0.05, f);
        } else if (!behind) {
          P(this.person(D, x, 0, zD, { side: true, so: { mode: "march", phase: ph, stride: 1.4, stomp: 1.35, leanAdd: 9, expr: f > 1160 ? "grin" : "stern", blink: blink(3) } }));
          this.ball(st, x + 0.7 + 0.14 * Math.sin(ph * Math.PI * 2), 0.05 * Math.abs(Math.sin(ph * 6.28)), zD + 0.15, f);
          this.puffs(st, f, (fe) => [runX(fe) - 0.3, 0.05], 5, 15, 0.75);
          if (f > 1108) st.fx.push({ key: "speed", cw: 400, ch: 200, draw: fxSpeed, x: x - 1.35, y: 1.0, z: zD + 0.05, w: 1.3, h: 0.65, soft: true });
        } else if (!away) { // seen from behind the net: he strokes it in
          P(this.person(D, x, 0, 0.1, { fo: { mode: "march", phase: ph, lift: 80, expr: "grin", blink: blink(3) } }));
          const u = clamp01((f - 1249) / (W.net - 1249));
          this.ball(st, f < 1249 ? x + 0.55 : lerp(47.2, GX + 1.75, u), f < 1249 ? 0 : 0.15 + 1.0 * Math.sin(u * 1.9), lerp(0.25, 0.7, u), f);
        } else { // wheeling away
          const u = clamp01((f - W.net) / 34);
          P(this.person(D, 46.6 + u * 0.9, hop(0, 0.14, 2.6), 0.1 + u * 3.4, { fo: { mode: "march", phase: ph, lift: 70, expr: "laugh", blink: blink(3), wave: 1, waveL: 1 } }));
          this.ball(st, GX + 1.6, Math.max(0, 1.0 - (f - W.net) * 0.09), 0.7, f);
        }
        if (f < 1096 || !behind) this.contact(st, f < 1096 ? -8 : x, zD);
        else this.contact(st, away ? 46.6 + clamp01((f - W.net) / 34) * 0.9 : x, away ? 0.1 + clamp01((f - W.net) / 34) * 3.4 : 0.1);
        // the two who closed him down at the start: they lunge and crash into each other
        if (f < 1160) [[-6.2, 1.0, 0], [-6.7, -1.5, 3]].forEach(([tx, tz, v], i) => {
          const inn = smooth((f - 1050) / 28), crash = f >= 1088, k = smooth((f - 1084) / 8);
          const px = lerp(tx + 3.5, tx, inn) - k * (1.2 + i * 0.4), pz = lerp(tz * 2.2, tz, inn) * (1 - k * 0.9);
          P(this.person(who(ENG(v), 84 + i), px, 0, pz, { fo: { mode: crash ? "fall" : "stand", expr: crash ? "dazed" : "stern", blink: blink(84 + i), look: -1, tilt: crash ? 0 : -8 * inn }, roll: crash ? (i ? 1 : -1) * 0.6 : 0 }));
          this.contact(st, px, pz, 1.1);
          if (crash && i === 0) this.stars(st, px - 0.2, 1.7, pz, f + 9);
        });
        BEATEN.forEach((b, i) => {
          const down = f > b.f + 1, near = smooth((f - b.f + 22) / 20), sgn = i % 2 ? 1 : -1;
          const bz = down ? b.z + sgn * 0.5 * smooth((f - b.f) / 12) : b.z * (1 - 0.75 * near);
          P(this.person(who(ENG(i), 80 + i), b.x + (down ? -0.4 * smooth((f - b.f) / 12) : 0), down ? 0.25 * Math.sin(Math.PI * clamp01((f - b.f) / 12)) : 0, bz,
            { fo: { mode: down ? "fall" : "stand", expr: down ? "dazed" : near > 0.5 ? "stern" : "nervous", blink: blink(80 + i), look: -1, tilt: down ? 0 : -12 * near, wave: !down && near > 0.3 ? 0.4 : undefined, waveL: !down && near > 0.3 ? 0.4 : undefined },
              roll: down ? sgn * 0.9 * smooth((f - b.f) / 7) : 0, sy: down ? 1 : 1 - 0.08 * near }));
          this.contact(st, b.x, bz, 1.1);
          if (f >= b.f && f < b.f + 10) st.fx.push({ key: `burst|${f - b.f}`, cw: 500, ch: 500, draw: (p) => fxBurst(p, (f - b.f) / 10, "#fff3b0", 8), x: b.x - 0.5, y: 1.0, z: b.z * 0.4, w: 1.1, h: 1.1 });
          if (down && f < b.f + 60) this.stars(st, b.x - 0.4, 1.35, bz, f + i * 7);
        });
        if (id === 10) { // the keeper rushes out, dives, misses
          const kf = W.keeper, down = f > kf, out = smooth((f - 1196) / 26);
          const kx = lerp(48.5, 41.2, out), kz = down ? -0.2 - 1.5 * smooth((f - kf) / 10) : -0.2;
          P(this.person(who(KEEPER, 61, 1.18), kx, down ? 0.15 : 0, kz, { fo: { mode: down ? "fall" : "stand", expr: down ? "dazed" : "shock", blink: blink(61), wave: down ? undefined : 1, waveL: down ? undefined : 1, tilt: down ? 0 : -8 }, roll: down ? 1.25 * smooth((f - kf) / 6) : 0 }));
          this.contact(st, kx, kz, 1.2);
          if (f >= kf && f < kf + 10) st.fx.push({ key: `burst|${f - kf}`, cw: 500, ch: 500, draw: (p) => fxBurst(p, (f - kf) / 10, "#fff3b0", 8), x: kx, y: 0.9, z: -0.1, w: 1.2, h: 1.2 });
          if (down) this.stars(st, kx, 1.1, kz, f);
        }
        this.flashes(st, f, away ? 0.2 : 0.04);
        break;
      }
      case 11: { // night-blue explainer: small next to tall; the centre of gravity sits low
        const lowK = smooth((f - W.low + 14) / 10);
        P(this.person(D, -0.2, 0, 0, { fo: { mode: "stand", expr: f > 1340 ? "smile" : "neutral", blink: blink(3), look: 0.6, headTilt: f < 1372 ? 5 : 0 }, sy: 1 - 0.05 * lowK * (0.5 + 0.5 * Math.sin(f / 3)), sx: 1 + 0.03 * lowK })); this.contact(st, -0.2, 0);
        P(this.person(who(ENG(3), 90, 1.3), 1.15, 0, -0.4, { fo: { mode: "stand", expr: f > W.low ? "nervous" : "smile", blink: blink(90), look: -0.6, headTilt: -5 } })); this.contact(st, 1.15, -0.4, 1.2);
        if (f > 1336) { const k = smooth((f - 1336) / 6) * (1 - smooth((f - 1380) / 8)); if (k > 0.02) st.fx.push({ key: "bracket", cw: 120, ch: 400, draw: fxBracket, x: 0.5, y: 1.86, z: 0.12, w: 0.16 * k, h: 0.74 * k }); }
        if (lowK > 0) {
          st.fx.push({ key: "cogDot", cw: 100, ch: 100, draw: (p) => p.ell(50, 50, 34, 34, "#e8433a", 9), x: -0.2, y: 0.73, z: 0.08, w: 0.11 * lowK, h: 0.11 * lowK });
          st.fx.push({ key: "cog", cw: 200, ch: 300, draw: fxCog, x: -0.62, y: 0.42 - 0.06 * Math.abs(Math.sin(f / 4)), z: 0.08, w: 0.2 * lowK, h: 0.3 * lowK });
          const t = (((f - W.low) / 22) % 1 + 1) % 1; st.fx.push({ key: `ring|${Math.round(t * 22)}`, cw: 600, ch: 600, draw: (p) => fxRing(p, t), x: -0.2, y: 0.73, z: 0.06, w: 1.0, h: 1.0, soft: true });
        }
        break;
      }
      case 12: { // the restaurant: the tall stack creeps and wobbles, the short stack whips round a table
        const zT = RS[2] + 1.4, xT = tallX(f);
        const leanT = 0.11 * Math.sin(f / 6) * (f > W.tall - 10 ? 1 : 0.45);
        P(this.person(who(WAITER, 95), xT, 0, zT, { side: true, so: { mode: "march", phase: ((f - 1422) / 44) % 1, stride: 0.32, stomp: 1.0, expr: f > W.tall - 12 ? "shock" : "pained", blink: blink(95) } })); this.contact(st, xT, zT);
        st.fx.push({ key: `plT|${q(leanT, 60)}`, cw: 300, ch: 900, draw: (p) => fxPlates(p, 27, leanT), x: xT + 0.47, y: 1.58, z: zT - 0.06, w: 0.38, h: 1.14 });
        if (f > 1490 && Math.floor(f / 5) % 2 === 0) st.fx.push({ key: "sweat", cw: 200, ch: 200, draw: fxSweat, x: xT - 0.22, y: 1.72, z: zT + 0.06, w: 0.26, h: 0.26 });
        const s = shortAt(f), spin = clamp01((f - (W.whip - 6)) / 30), moving = spin > 0 && spin < 1;
        const o2 = { ...WAITER, moustache: undefined, hair: "#16100c" };
        if (moving) P(this.person(who(o2, 96), s[0], 0, s[2], { side: true, mirror: spin < 0.5, so: { mode: "march", phase: (spin * 6) % 1, stride: 1.2, stomp: 1.3, leanAdd: 10, expr: "grin", blink: 0 } }));
        else P(this.person(who(o2, 96), s[0], hop(0, spin >= 1 ? 0.05 : 0, 3), s[2], { fo: { mode: "stand", expr: f > W.short - 8 ? "grin" : "smile", blink: blink(96), wave: spin >= 1 ? 1 : undefined, look: -0.4 } }));
        this.contact(st, s[0], s[2]);
        st.fx.push({ key: "plS", cw: 300, ch: 900, draw: (p) => fxPlates(p, 4, 0), x: s[0] + (moving ? (spin < 0.5 ? -0.3 : 0.3) : 0.36), y: 1.58 + (moving ? 0.42 : 0), z: s[2] + 0.05, w: 0.38, h: 1.14 });
        if (moving) { this.puffs(st, f, (fe) => { const p = shortAt(fe); return [p[0], p[2]]; }, 3, 12, 0.7); st.fx.push({ key: "speed", cw: 400, ch: 200, draw: fxSpeed, x: s[0] + (spin < 0.5 ? 1.0 : -1.0), y: 1.1, z: s[2] + 0.02, w: 1.1, h: 0.55, soft: true }); }
        // diners
        const din: [number, number, Outfit, FrontOpts][] = [[-0.6 - 1.05, 43, townsfolkLike(0), { expr: "laugh" }], [-0.6 + 1.05, 44, townsfolkLike(1), { expr: "smile", look: -0.5 }], [5.6 - 1.05, 45, townsfolkLike(2), { expr: "shock", look: -1 }], [-3.6 + 1.05, 46, townsfolkLike(1), { expr: "lick" }]];
        din.forEach(([dx, sd, o, fo]) => P(this.person(who({ ...o, dress: undefined }, sd), RS[0] + dx, 0.42, RS[2] + 0.2, { fo: { mode: "sit", blink: blink(sd), ...fo } })));
        break;
      }
      case 13: { // champions: Diego on shoulders with the cup, team-mates leaping, confetti
        const D2 = who(DIEGO86, 4, 0.92), kit = (v: number) => ({ ...ARG(v), jacket: "#8ec9ee", stripes: "#fbfbf6", shorts: "#1f2433" });
        [[-1.9, -0.9, 3], [1.9, -0.8, 4], [-2.8, 0.4, 5], [2.9, 0.3, 0]].forEach(([x, z, v], i) => { P(this.person(who(kit(v), 33 + i), x, hop(i + 3, 0.3, 3.2), z, { fo: { mode: "stand", expr: i % 2 ? "laugh" : "grin", blink: blink(33 + i), wave: 1, waveL: i % 2 ? 1 : undefined } })); this.contact(st, x, z); });
        P(this.person(who(kit(1), 31), -0.6, 0, -0.2, { fo: { mode: "stand", expr: "laugh", blink: blink(31), wave: 1 } })); this.contact(st, -0.6, -0.2);
        P(this.person(who(kit(2), 32), 0.6, 0, -0.2, { fo: { mode: "stand", expr: "grin", blink: blink(32), waveL: 1 } })); this.contact(st, 0.6, -0.2);
        const bob = 0.05 * Math.sin(f / 4);
        P(this.person(D2, 0, 1.35 + bob, 0.25, { fo: { mode: "sit", expr: "laugh", blink: blink(4), wave: 1 } }));
        st.fx.push({ key: "cup", cw: 300, ch: 500, draw: fxCup, x: 0.36, y: 2.62 + bob, z: 0.32, w: 0.33, h: 0.55 });
        this.spark(st, 0.52, 2.86 + bob, 0.36, 0.24, f);
        for (let i = 0; i < 44; i++) {
          const cx = (hs(i, 1) - 0.5) * 7, cy = 5.5 - ((f - 1612) * (0.035 + 0.025 * hs(i, 2)) + hs(i, 3) * 5.5) % 5.5, cz = (hs(i, 4) - 0.5) * 3 + 0.8;
          const col = ["#8ec9ee", "#ffffff", "#f2c443"][i % 3];
          st.fx.push({ key: `conf|${col}`, cw: 64, ch: 64, draw: (p) => fxConfetti(p, col), x: cx + 0.2 * Math.sin(f / 6 + i), y: cy, z: cz, w: 0.11, h: 0.11, rot: f * 0.25 + i });
        }
        this.flashes(st, f, 0.22);
        break;
      }
      default: { // sunset, the empty pitch: the hand ... the feet
        const hand = smooth((f - (W.hand2 - 5)) / 6) * (1 - smooth((f - 1806) / 5)), feet = f >= 1808;
        P(this.person(D, 0, 0, 0, { fo: { mode: "stand", expr: feet ? "grin" : hand > 0.4 ? "smile_closed" : "smile", blink: blink(3), look: 0, wave: hand > 0 ? hand : undefined, headTilt: 3 * Math.sin(f / 16) }, sy: 1 + 0.02 * Math.sin(f / 8) }));
        this.contact(st, 0, 0);
        if (hand > 0.6) this.spark(st, 0.38, 1.5, 0.06, 0.28, f);
        const hopB = f >= 1800 && f < 1813 ? 0.4 * Math.sin(Math.PI * (f - 1800) / 13) : 0;
        this.ball(st, 0.26, hopB, 0.36, f >= 1800 && f < 1813 ? f : 0);
        if (f >= W.feet2 && f < W.feet2 + 10) st.fx.push({ key: `burst|${f - W.feet2}`, cw: 500, ch: 500, draw: (p) => fxBurst(p, (f - W.feet2) / 10, "#fff3b0", 8), x: 0.28, y: 0.14, z: 0.3, w: 0.6, h: 0.6 });
        if (feet) this.spark(st, 0.5, 0.36, 0.4, 0.2, f);
      }
    }
    return st;
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
    const yaw = Math.atan2(fx / fl, fz / fl) - THREE.MathUtils.degToRad(s.place === "room" ? 150 : L.az);
    const el = THREE.MathUtils.degToRad(s.place === "room" ? 40 : L.el);
    this.sunDir.set(Math.sin(yaw) * Math.cos(el), Math.sin(el), Math.cos(yaw) * Math.cos(el)).normalize();
    this.cam.copy(cam.position); this.right.set(1, 0, 0).applyQuaternion(cam.quaternion);
    this.lightAngle = Math.round(Math.atan2(-this.sunDir.y, this.sunDir.dot(this.right)) / (Math.PI / 4)) * (Math.PI / 4);
    this.hemi.color.set(L.sky); this.hemi.groundColor.set(L.ground); this.hemi.intensity = L.hemiI;
    this.sun.color.set(L.sunCol); this.sun.intensity = L.sunI;
    let Rr = THREE.MathUtils.clamp(dist * 1.15 + 7, 12, 95);
    if (s.light === "golden") Rr = Math.max(Rr, 30);
    if (id === 4 && f < 470) Rr = 95;
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
    if (s.place === "room") { this.fog.near = 40; this.fog.far = 400; }
    scene.fog = this.fog; scene.background = null;
    this.sunDisc.visible = s.light === "golden" && s.place !== "room";
    this.sunDisc.position.copy(cam.position).addScaledVector(this.sunDir, 900); this.sunDisc.scale.setScalar(2 * 900 * Math.tan(THREE.MathUtils.degToRad(1.7)));
    this.clouds.forEach((m, i) => {
      const a = (i / 10) * Math.PI * 2 + 0.3, d = 620 + (i % 3) * 60, w = 130 + (i % 4) * 30;
      m.position.set(cam.position.x + Math.cos(a) * d, 110 + (i % 4) * 40, cam.position.z + Math.sin(a) * d); m.scale.set(w, w / 2, 1);
      m.lookAt(cam.position.x, m.position.y, cam.position.z); (m.material as THREE.MeshBasicMaterial).map = this.cloudMaps[s.light][i % 4];
    });
    this.roofShade.visible = s.place === "stadium" && s.light === "day"; this.bowl.castShadow = this.roofMesh.castShadow = s.light === "day";
    const roar = (id === 4 && f > 500) || (id === 1 && f > 146) || (id === 10 && f > W.net) || id === 13 || (id === 6 && f > W.punch + 14 && f < 846);
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
      e.use(!!p.soft); e.bind(); e.soft.color.setScalar(p.glow ?? 1); e.mat.color.setScalar(p.glow ?? 1);
      const m = e.mesh; m.visible = true; m.position.set(p.x, p.y, p.z); m.scale.set(p.w, p.h, 1);
      if (p.flat) m.rotation.set(-Math.PI / 2, 0, p.rot ?? 0);
      else { m.rotation.set(0, 0, 0); m.lookAt(cam.position); if (p.rot) m.rotateZ(p.rot); }
    }
    return focus;
  }
}

const townsfolkLike = (v: number): Outfit => ({ jacket: ["#c25a7a", "#5a8fc2", "#d9a441"][v % 3], pants: "#3b3f52", boots: "#4a3426", hat: "hair", hair: "#3b2a1c", dress: "#c25a7a", skin: "#f1c9a2" });
void SU;
