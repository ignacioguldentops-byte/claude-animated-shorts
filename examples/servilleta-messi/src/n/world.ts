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
import { fxBall, fxCup, fxConfetti, fxQ, fxFlash, fxZ, fxSweat, fxHair, fxFly, fxHalo, fxFlame, fxFlowers, fxWeb, fxPedestal, fxPlane, fxHand, fxClock, fxEspresso, fxCoin, fxPatch, fxMoon, fxTumble, fxNapkin, fxGoldBall, fxCoinPile, fxArrowUp, fxRuler, fxDome, fxTennis, fxNapkinTower, fxPenHand } from "./props";
import { FPS, SHOTS, W, V3, camAt, smooth, clamp01, lerp, ramp, lampsAt, c, NAP, DIR_AT, AG1_AT, AG2_AT, PERE_T, BAR, walkIn, kidX, GAVEL1, GAVEL2 } from "./story";
import { lam, add, box, ground, repT } from "./kit";
import { buildCafe, buildAlley, buildPlane, buildAuction, SetRefs, NIGHT_MATS, LAMP_MATS, CX, PZ, SHX, SHY, SHZ, AX, PED, LECT, AROWS, ACOLS } from "./sets";
import { GENNARO, GENNARO_APRON, GENNARO_OLD, DIEGO, DIEGO_TRACK, WIFE, NONNA, TOURIST, TOURIST2, folk, PERE, PERE_OLD, DIRECTOR, AGENT1, AGENT2, KID, KID_BARCA, STAR, STAR_ALBI, MATE_ALBI, AUCTIONEER, bigKid } from "./cast";
const GX = 52.5;
const CKEY = new WeakMap<Char, string>();
const outQ = (x: number) => 1 - (1 - clamp01(x)) ** 3;
void [FPS, SU, rep, rng, grassHD, facadeHD, fxPuff, fxStars, fxRing, fxBall, fxCup, fxSweat, INK, GENNARO, W, box, fxPlane, fxMoon, fxCloud, GENNARO_APRON, GENNARO_OLD, DIEGO, DIEGO_TRACK, WIFE, NONNA, fxZ, fxHair, fxHalo, fxFlame, fxFlowers, fxPedestal, fxHand, fxEspresso, fxTumble, CX, PZ, SHX, SHY, SHZ, outQ, fxCup];

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
    this.refs = buildCafe(R); buildAlley(R); buildPlane(R); buildAuction(R);
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
    const hop = (i: number, amp = 0.1, sp = 3) => amp * Math.abs(Math.sin(f / sp + i * 1.7));
    const G = (ch: Char, seed: number, pos: V3, pose: Pose = {}, o: Parameters<World["fig"]>[5] = {}) => this.fig(st, ch, seed, pos, pose, { f, ...o });
    const S = (ch: Char, seed: number, pos: V3, pose: Pose = {}) => this.fig(st, ch, seed, pos, { legs: "sit", ...pose }, { f, shadow: false });
    const spark = (p: V3, s: number) => this.spark(st, p[0], p[1], p[2], s, f);
    const napkinCard = (pos: V3, w: number, wr: number, n: number, o: Partial<FxPlace> = {}) => { const q = Math.round(wr * 28); this.card(st, `nap|${q}|${n}`, 400, 400, (p) => fxNapkin(p, q / 28, n), pos, w, w, o); };
    const coins = (cx: number, cy: number, cz: number, n: number, spread: number, rate = 0.02) => {
      for (let i = 0; i < n; i++) { const t = ((f * rate + hs(i, 3)) % 1), x = cx + (hs(i, 1) - 0.5) * spread, y = cy + 2.6 - t * 3.0, z = cz + (hs(i, 2) - 0.5) * spread * 0.5;
        if (y > 0.05) this.card(st, "coin", 120, 120, fxCoin, [x, y, z], 0.12, 0.12, { rot: f * 0.3 + i }); }
    };
    const bidders = (raise: number, cheer: boolean) => {
      let n = 0;
      for (const z of AROWS) for (const dx of ACOLS) {
        n++; if (hs(n, 7) < 0.18) continue;
        const up = raise > 0 && hs(n, 9) < 0.5 && f > 20 + hs(n, 4) * 60 * raise;
        S(folk(n * 5 + 2), 400 + n, [AX + dx, 0.17, z], { back: true, armR: up ? "up" : cheer && hs(n, 5) < 0.4 ? "up" : "hang", holdR: up ? "paddle" : undefined, armL: cheer && hs(n, 6) < 0.3 ? "up" : "hang" });
      }
    };
    switch (id) {
      case 1: { // hook: the napkin under the dome; paddles go up; the gavel
        napkinCard([PED[0], PED[1] + 0.17, PED[2] + 0.02], 0.3, 1, 3, { rot: 0.04 });
        this.card(st, "dome", 300, 400, fxDome, [PED[0], PED[1] + 0.28, PED[2] + 0.28], 0.56, 0.75, { glow: 1.2 });
        bidders(1, f > GAVEL1);
        const sl = f >= GAVEL1 - 4 && f < GAVEL1 + 2;
        G(AUCTIONEER, 61, [LECT[0], 0.3, LECT[2] - 0.38], { expr: f > GAVEL1 ? "grin" : "smile", facing: -1, armR: sl ? [40, -10, 6] : [46, -66, 6], holdR: "gavel", armL: "point" }, { shadow: false });
        if (f > 24) spark([PED[0] + 0.1, PED[1] + 0.3, PED[2] + 0.05], 0.12);
        if (f >= GAVEL1) { coins(AX + 0.3, 1.2, -2.0, 40, 6, 0.03); const t = (f - GAVEL1) / 12; if (t < 1) this.card(st, `burst|${Math.round(t * 12)}`, 500, 500, (p) => fxBurst(p, t), [LECT[0] + 0.25, 1.6, LECT[2]], 1.0, 1.0); }
        break;
      }
      case 2: { // the empty club bar; Pere polishes a glass; a tennis ball rolls by
        const pol = Math.sin(f * 0.45);
        G(PERE, 5, BAR, { expr: f > W.nothing ? "stern" : "smile", facing: 1, armR: "front", holdR: "glass", armL: [-24 + 6 * pol, 46 + 4 * pol, 14], holdL: "rag", headTilt: f > W.nothing ? 6 : 0 });
        this.card(st, "web", 300, 300, fxWeb, c(0.86, 2.06, -0.02), 0.45, 0.45);
        const tb = ramp(f, 120, 200); this.card(st, "tennis", 100, 100, fxTennis, c(lerp(1.6, -0.2, tb), 0.04 + 0.12 * Math.abs(Math.sin(tb * 9)) * (1 - tb), lerp(-0.4, -2.6, tb)), 0.08, 0.08, { rot: f * 0.3 });
        if (f > 196) for (const k of [0, 1]) { const tt = ramp(f, 196 + k * 4, 228); this.card(st, `fly|${f % 2}`, 120, 100, (p) => fxFly(p, f % 2), c(-1.4 + k * 0.3 + 0.08 * Math.sin(f * 0.5 + k), 1.85 + k * 0.1 + 0.05 * Math.sin(f * 0.7), -3.6 + tt * 0.3), 0.1, 0.085); }
        this.card(st, "patch", 256, 256, fxPatch, c(1.25, 0.012, -0.9), 1.5, 2.4, { flat: true, soft: true });
        break;
      }
      case 3: { // three serious men come in and sit down
        if (f < W.sit) {
          const ch = [DIRECTOR, AGENT1, AGENT2];
          for (let k = 2; k >= 0; k--) { const p = walkIn(k, f); if (p[2] < 1.6) G(ch[k], 21 + k, p, { legs: "walk", phase: (f - 236 - k * 12) / 15, facing: 0, expr: "stern" }); }
          G(PERE, 5, c(-0.75, 0, -3.75), { expr: f > 262 ? "shock" : "neutral", facing: 1, look: 1, armR: "front", holdR: "glass", sweat: f > 270 ? 1 : 0 }, { scale: 1 });
          this.card(st, "patch", 256, 256, fxPatch, c(1.25, 0.012, -0.9), 1.5, 2.4, { flat: true, soft: true });
        } else {
          S(DIRECTOR, 21, DIR_AT, { expr: "stern", facing: 0, armL: "front", armR: "front" });
          S(AGENT1, 22, AG1_AT, { expr: "stern", facing: 1, armR: "front", armL: "hang" });
          S(AGENT2, 23, AG2_AT, { expr: "stern", facing: -1, armL: "front", armR: "hang" });
          G(PERE, 5, c(0.25, 0, -3.3), { expr: "shock", facing: 1, sweat: 2, armR: "front", holdR: "pad" });
        }
        break;
      }
      case 4: { // one of them is Barça's sporting director
        S(DIRECTOR, 21, DIR_AT, { expr: f > W.barca ? "grin" : "stern", facing: 0, armL: "front", armR: f > W.barca ? "up" : "front", headTilt: f > W.barca ? -4 : 0 });
        S(AGENT1, 22, AG1_AT, { expr: "smile", facing: 1, armR: "front" });
        G(PERE, 5, PERE_T, { expr: f > W.barca ? "shock" : "nervous", facing: 1, look: 1, sweat: 2, armR: "front", holdR: "pad", armL: "mouth" });
        if (f > W.barca) for (let k = 0; k < 5; k++) if ((f + k * 4) % 14 < 7) spark(c(2.45 + 0.4 * Math.cos(k * 1.3 + f * 0.04), 1.55 + 0.3 * Math.sin(k * 2.1 + f * 0.05), -1.85), 0.12);
        break;
      }
      case 5: { // a 13-year-old who plays like nobody else: past three big kids
        const x = kidX(f), ph = (f - 433) / 7;
        G(KID, 31, [x, 0, 0], { legs: "run", phase: ph, facing: 1, expr: "grin", armL: "low", armR: "low" });
        const tp = 0.5 - 0.5 * Math.cos(2 * Math.PI * ph), bx = x + 0.22 + 0.14 * tp; this.ball(st, bx, 0.025 * Math.sin(Math.PI * tp), 0.06, f);
        for (const [k, gx] of [[0, -2.2], [1, -0.2], [2, 1.9]] as const) {
          // the kid's speed blows each big kid away, spinning up out of frame, before they can touch
          const u = x - gx, warn = clamp01((u + 2.0) / 0.6), s = clamp01((u + 1.35) / 0.4);
          if (s >= 1 && u > 0.2) continue;
          const y = 4.2 * Math.pow(s, 1.1) + (u > -0.95 ? 2.5 * (u + 0.95) : 0);
          G(bigKid(k), 41 + k, [gx + 1.1 * s, y, -0.35 - 0.15 * k - 1.2 * s], { legs: s > 0 ? "run" : warn > 0 ? "run" : "stand", phase: ph, facing: -1, expr: s > 0 ? "dazed" : warn > 0 ? "shock" : "stern", armL: s > 0 ? "up" : warn > 0 ? "reach" : "hip", armR: s > 0 ? "up" : "hang" }, { roll: -2.2 * s, scale: 1.12 });
          if (s > 0 && s < 0.9) this.stars(st, gx + 1.1 * s, y + 1.9, -0.4, f);
        }
        for (const gx of [-2.2, -0.2, 1.9]) if (x - gx > -1.4 && x - gx < -0.8) this.puffs(st, f, () => [gx, 0.1], 1, 10, 0.6);
        this.puffs(st, f, (fe) => [kidX(fe) - 0.15, 0.1], 5, 14, 0.4);
        break;
      }
      case 6: { // the size of a nine-year-old; the treatment costs a fortune
        if (f < 594) {
          for (let k = 0; k < 4; k++) G(bigKid(k + 1), 51 + k, [-1.2 + k * 0.72, 0, -0.2 + (k % 2) * 0.1], { expr: k % 2 ? "stern" : "neutral", facing: 1, armL: "hip", armR: k === 3 ? "chin" : "hang" }, { scale: 1.12 });
          const tip = ramp(f, 568, 580); G(KID, 31, [1.75, 0.04 * tip, 0.05], { expr: tip > 0.5 ? "nervous" : "stern", facing: -1, sweat: tip > 0.5 ? 1 : 0, armL: "hang", armR: tip > 0.5 ? "up" : "hang" });
          this.card(st, "ruler", 140, 1000, fxRuler, [2.12, 0.85, -0.05], 0.24, 1.7);
        } else {
          const k = smooth(ramp(f, 604, 658));
          G(KID, 31, [0, 0, 0], { expr: k > 0.5 ? "shock" : "neutral", facing: 1, armR: "front", holdR: "pills", sweat: k > 0.6 ? 2 : 0 });
          this.card(st, `pile|${Math.round(k * 24)}`, 500, 400, (p) => fxCoinPile(p, Math.round(k * 24) / 24), [1.0, 0.45 + 0.6 * k, -0.15], 1.5, 1.2);
          coins(0.9, 0.6, 0.1, 26, 1.6, 0.03);
        }
        break;
      }
      case 7: { // weeks of doubt; the agents threaten to take him to another club
        if (f < 719) {
          S(DIRECTOR, 21, DIR_AT, { expr: "nervous", facing: 0, armR: "chin", armL: "front", sweat: 1, headTilt: 6 * Math.sin(f * 0.12) });
          const a = (f - 671) * 0.6; this.card(st, `clock|${Math.round(a * 20)}`, 240, 240, (p) => fxClock(p, a), c(2.45, 1.82, -2.0), 0.3, 0.3);
          S(AGENT1, 22, AG1_AT, { expr: "stern", facing: 1, armR: "front" }); S(AGENT2, 23, AG2_AT, { expr: "stern", facing: -1, armL: "front" });
        } else {
          const up = smooth(ramp(f, 726, 740));
          S(DIRECTOR, 21, DIR_AT, { expr: f > 745 ? "shock" : "nervous", facing: 0, sweat: 2, armL: "front", armR: "front" });
          if (up < 0.5) S(AGENT1, 22, AG1_AT, { expr: "stern", facing: 1, armR: "front" });
          else G(AGENT1, 22, c(1.5, 0, -1.75), { expr: "stern", facing: -1, armR: f > W.otherClub - 10 ? "point" : "hip", armL: "hip" });
          S(AGENT2, 23, AG2_AT, { expr: f > W.otherClub ? "grin" : "stern", facing: -1, armL: f > 750 ? "mouth" : "front", holdL: f > 750 ? "phone" : undefined, armR: "hang" });
          G(PERE, 5, c(-0.1, 0, -3.4), { expr: "shock", facing: 1, look: 1, armR: "front", holdR: "pad", sweat: 1 });
        }
        break;
      }
      case 8: { // he asks for paper -> there is none
        if (f < 855) {
          const pat = f > 806 && f < 836, ask = f >= 836;
          S(DIRECTOR, 21, DIR_AT, { expr: ask ? "grin" : "nervous", facing: -1, armR: ask ? "up" : pat ? [-26 + 8 * Math.sin(f * 0.9), 30, 16] : "front", armL: pat ? [-22, 52 + 6 * Math.sin(f * 1.1), 14] : "front" });
          S(AGENT1, 22, AG1_AT, { expr: "stern", facing: 1, armR: "front" }); S(AGENT2, 23, AG2_AT, { expr: "neutral", facing: -1, armL: "front" });
          G(PERE, 5, PERE_T, { expr: "neutral", facing: 1, look: 1, armR: "front", holdR: "pad" });
        } else {
          const fl = f > 862;
          G(PERE, 5, PERE_T, { expr: fl ? "nervous" : "shock", facing: 0, sweat: 2, armR: fl ? "wave" : "front", holdR: fl ? undefined : "pad", armL: fl ? "wave" : "hang" });
          if (fl) { const t = ramp(f, 862, 888); this.card(st, "pad0", 120, 160, (p) => { p.poly([[10, 150], [110, 150], [110, 20], [10, 20]], "#fbf6e6", 6); p.poly([[10, 26], [110, 26], [110, 6], [10, 6]], "#c9373a", 5); }, c(1.42 + 0.3 * t, 1.1 - 0.9 * t * t, -1.95), 0.12, 0.16, { rot: t * 3 }); }
          this.card(st, `fly|${f % 2}`, 120, 100, (p) => fxFly(p, f % 2), c(1.6 + 0.15 * Math.sin(f * 0.2), 1.95 + 0.05 * Math.sin(f * 0.5), -2.0), 0.08, 0.07);
        }
        break;
      }
      case 9: { // looks left, looks right, gives him a napkin
        const look = f < W.left ? 0 : f < W.right - 4 ? -1 : f < W.napkin - 18 ? 1 : 0, out = f >= W.napkin - 12;
        G(PERE, 5, PERE_T, { expr: out ? "grin" : "nervous", look: out ? 0 : look, sweat: out ? 0 : 2, armR: out ? [30, -40, 10] : "hang", holdR: out ? "napkin" : undefined, armL: out ? "hip" : [-20, 40, 14], headTilt: out ? -5 : 0 });
        if (out) for (let k = 0; k < 4; k++) if ((f + k * 3) % 10 < 6) spark(c(1.32 + 0.18 * Math.cos(k * 1.6 + f * 0.1), 1.62 + 0.18 * Math.sin(k * 1.6 + f * 0.1), -1.98), 0.08);
        break;
      }
      case 10: { // the pen writes the commitment; three signatures
        const wr = smooth(ramp(f, 1003, 1082)), sg = f < W.sign + 2 ? 0 : f < W.sign + 10 ? 1 : f < W.sign + 18 ? 2 : 3;
        napkinCard(NAP, 0.36, wr, sg, { flat: true, rot: 0.06 });
        let tip: V3;
        if (f < 1086) { const L = Math.min(6, Math.floor(wr * 7)), fr = wr * 7 - L, nx = -0.115 + (L === 6 ? 0.15 : 0.25) * fr, nz = -0.105 + L * 0.027; tip = [NAP[0] + nx, NAP[1], NAP[2] + nz + 0.004 * Math.sin(f * 2.1)]; }
        else { const k = Math.min(2, sg), t = ((f - W.sign) % 8) / 8; tip = [NAP[0] - 0.09 + k * 0.097 + 0.06 * t, NAP[1], NAP[2] + 0.11]; }
        if (f < W.sign + 26) this.card(st, "penhand", 300, 600, fxPenHand, [tip[0] + 0.035, tip[1] + 0.16, tip[2] + 0.02], 0.13, 0.26, { rot: -0.15 });
        if (f >= W.sign + 20) spark([NAP[0] + 0.05, NAP[1] + 0.06, NAP[2]], 0.12);
        break;
      }
      case 11: { // wait: a signing on a napkin?
        napkinCard(NAP, 0.36, 1, 3, { flat: true, rot: 0.06 });
        if (f >= W.q) { const s = 1 + 0.25 * Math.exp(-(f - W.q) / 4) + 0.03 * Math.sin(f * 0.3); this.card(st, "q", 200, 260, fxQ, [NAP[0] + 0.02, NAP[1] + 0.2, NAP[2] - 0.02], 0.15 * s, 0.2 * s, { rot: -0.2 + 0.05 * Math.sin(f * 0.2) }); }
        S(DIRECTOR, 21, DIR_AT, { expr: "smile", facing: 0, armL: "front", armR: "front" });
        break;
      }
      case 12: { // Barça keeps the kid: keepie-ups (foot, foot, knee, head...), he grows past the ruler while the ball is up, traps it, then shows his back: MESSI 10
        const g = smooth(ramp(f, W.paid, W.paid + 34)), sc = 1 + 0.32 * g;
        const footY = (l: number) => (9 + 126 * l) * 0.00216 + 0.012;
        // touches: [frame, kind (0 left foot, 1 right knee, 2 head, 3 stall on the left foot), scale at that moment]
        const TCH: [number, number, number][] = [[1229, 0, 1], [1241, 0, 1], [1253, 1, 1], [1266, 2, 1], [1281, 0, 1], [1293, 0, 1], [1344, 3, 1.32]];
        const cp = (k: number, s2: number): [number, number] => k === 0 ? [-0.03 * s2, footY(1) * s2] : k === 1 ? [0.19 * s2, 0.53 * s2] : k === 2 ? [0.02 * s2, 1.3 * s2] : [-0.03 * s2, footY(0.7) * s2];
        let bx = -0.03, by = 0;
        if (f < TCH[0][0]) { const t = clamp01((f - 1214) / (TCH[0][0] - 1214)); by = lerp(1.7, footY(1), t * t); }
        else if (f >= 1344) { if (f < 1350) [bx, by] = cp(3, 1.32); else { const t = clamp01((f - 1350) / 5); bx = lerp(-0.04, 0.34, smooth(clamp01((f - 1350) / 9))); by = lerp(footY(0.7) * 1.32, 0, t * t); } }
        else { let i = 0; while (i < TCH.length - 2 && f >= TCH[i + 1][0]) i++;
          const [t0, k0, s0] = TCH[i], [t1, k1, s1] = TCH[i + 1], p0 = cp(k0, s0), p1 = cp(k1, s1), t = clamp01((f - t0) / (t1 - t0));
          const apex = i === 5 ? 3.8 : Math.max(p0[1], p1[1]) + (k1 === 2 ? 0.24 : 0.36), ctl = 2 * apex - (p0[1] + p1[1]) / 2;
          bx = lerp(p0[0], p1[0], t); by = (1 - t) * (1 - t) * p0[1] + 2 * t * (1 - t) * ctl + t * t * p1[1]; }
        const bump = (k: number) => TCH.filter(([, kk]) => kk === k).reduce((m, [tt]) => Math.max(m, clamp01(1 - Math.abs(f - tt) / 4.5)), 0);
        const stall = f >= 1338 && f < 1352 ? 0.7 * smooth(clamp01((f - 1338) / 5)) * (1 - smooth(clamp01((f - 1348) / 4))) : 0;
        const back = f >= 1351, up = f > W.paid - 4 && f < 1340;
        G(KID_BARCA, 31, [0, 0, 0], back ? { back: true, armL: "up", armR: "up", holdL: "finger", holdR: "finger" } :
          { expr: up ? (g > 0.2 && g < 0.95 ? "shock" : "laugh") : "grin", facing: 0, look: 0, liftL: Math.max(bump(0), stall), liftR: bump(1), headTilt: f > 1260 && f < 1272 ? -7 : 0,
            armL: up ? "up" : [62, 36, 6], armR: up ? "up" : [62, 36, 6] }, { scale: sc, sy: 1 + 0.05 * g * (1 - g) * 4 });
        this.ball(st, bx, by, 0.14, f);
        // the ruler from the doctor's scene: he outgrows it
        this.card(st, "ruler", 140, 1000, fxRuler, [0.66, 0.85, -0.08], 0.24, 1.7);
        if (f > W.paid && f < W.paid + 40) for (let k = 0; k < 6; k++) if ((f + k * 5) % 12 < 6) spark([0.42 * Math.cos(k * 1.3 + f * 0.05) - 0.05, 0.4 + 1.4 * g * hs(k, 2), 0.15], 0.16);
        if (f >= 1344 && f < 1350) spark([0.05, 0.45, 0.2], 0.14);
        this.conf(st, f, 0, 0, 0.5, 22, 5);
        break;
      }
      case 13: { // eight golden balls (they drop onto a pyramid, one per pop), then the World Cup in the black cloak
        const cup = f >= W.cup, j = hop(0, 0.18, 3.5);
        if (!cup) {
          G(STAR, 3, [-0.36, 0, 0], { expr: f < 1374 ? "grin" : "laugh", armR: "up", armL: "up", holdR: "finger", holdL: "finger", headTilt: -3 }, { scale: 0.97, sy: 1 + 0.015 * Math.sin(f * 0.4) });
          const SL: [number, number][] = [[0.36, 0], [0.63, 0], [0.9, 0], [0.495, 0.25], [0.765, 0.25], [0.495, 0.5], [0.765, 0.5], [0.63, 0.75]];
          SL.forEach(([sx, sy], i) => {
            const tl = 1372 + i * 5.5; if (f < tl - 8) return;
            const t = clamp01((f - (tl - 8)) / 8), y = sy + 0.135 + (1 - t * t) * 3.2, sq = f >= tl ? 1 + 0.2 * Math.exp(-(f - tl) / 2.2) * Math.cos((f - tl) * 1.4) : 1;
            this.card(st, "gball", 200, 200, fxGoldBall, [sx, y, 0.12 + i * 0.002], 0.27 * sq, 0.27 / sq);
            if (f >= tl && f < tl + 5) spark([sx + 0.1, sy + 0.32, 0.2], 0.15);
          });
          this.contact(st, 0.63, 0.12, 1.5);
          this.conf(st, f, 0, 0, 0.5, 30, 5);
        } else {
          this.fig(st, STAR_ALBI, 3, [0, j, 0], { expr: "laugh", armR: "up", holdR: "wcup", armL: "up" }, { f, scale: 0.97, sy: 1 + 0.03 * Math.sin(f / 3.5 * 2) });
          const mates: [number, number, number][] = [[-0.95, -0.5, 0], [0.95, -0.55, 1]];
          for (const [x, z, i] of mates) this.fig(st, MATE_ALBI(i), 211 + i, [x, hop(211 + i, 0.3, 3), z], { expr: i % 2 ? "laugh" : "grin", armL: "up", armR: "up" }, { f });
          this.conf(st, f, 0, 0, 0.5, 60, 6); this.flashes(st, f, 0.2);
          spark([0.42, 2.25 + j, 0.05], 0.3);
        }
        break;
      }
      case 14: { // 24 years later it went under the hammer in London
        napkinCard([PED[0], PED[1] + 0.17, PED[2] + 0.02], 0.3, 1, 3, { rot: 0.04 });
        this.card(st, "dome", 300, 400, fxDome, [PED[0], PED[1] + 0.28, PED[2] + 0.28], 0.56, 0.75, { glow: 1.2 });
        bidders(1, f > GAVEL2);
        const sl = f >= GAVEL2 - 4 && f < GAVEL2 + 2;
        G(AUCTIONEER, 61, [LECT[0], 0.3, LECT[2] - 0.38], { expr: f > GAVEL2 ? "grin" : "stern", facing: -1, armR: sl ? [40, -10, 6] : f > GAVEL2 - 26 ? [46, -66, 6] : "hang", holdR: "gavel", armL: f > GAVEL2 ? "up" : "point" }, { shadow: false });
        if (f >= GAVEL2) { const t = (f - GAVEL2) / 12; if (t < 1) this.card(st, `burst|${Math.round(t * 12)}`, 500, 500, (p) => fxBurst(p, t), [LECT[0] + 0.25, 1.6, LECT[2]], 1.0, 1.0); coins(LECT[0] - 0.5, 1.2, LECT[2] + 1.0, 24, 2.5, 0.035); }
        break;
      }
      default: { // years later: Pere guards every napkin
        if (f < W.keeps - 6) {
          G(PERE_OLD, 5, BAR, { expr: "smile", facing: 1, armR: "front", holdR: "stack", armL: "low", holdL: "rag" });
          const cust: [Char, number, number, number, Pose][] = [
            [TOURIST, 31, 2.2, -0.9, { expr: "grin", facing: -1, armR: "mouth", holdR: "camera" }], [TOURIST2, 32, 0.9, -1.6, { back: true, armL: "mouth", holdL: "phone" }],
            [folk(5), 25, 1.6, -2.6, { back: true, armR: "point" }], [folk(12), 29, 2.4, -3.3, { back: true }], [folk(15), 35, 0.4, -3.0, { back: true, armR: "up" }],
          ];
          for (const [ch, sd, x, z, pose] of cust) G(ch, sd, c(x, hop(sd, 0.02, 5), z), pose);
          this.card(st, "tower|30", 300, 900, (p) => fxNapkinTower(p, 30), c(-1.2, 1.67, -3.62), 0.34, 1.02);
        } else {
          const t = ramp(f, W.keeps, W.keeps + 20), n = 30 + Math.floor(ramp(f, W.keeps + 16, W.napkins) * 8);
          G(PERE_OLD, 5, c(-1.8, 0, -4.3), { expr: f > W.napkins ? "grin" : "smile", facing: 1, armR: f < W.keeps + 18 ? [lerp(9, 62, t), lerp(98, -16, t), 6] : "hip", holdR: f < W.keeps + 18 ? "napkin" : undefined, armL: [-26, 40, 14], holdL: "stack", headTilt: f > W.napkins ? -6 : 0 });
          this.card(st, `tower|${n}`, 300, 900, (p) => fxNapkinTower(p, n), c(-1.2, 1.67, -3.62), 0.34, 1.02);
          if (f > W.napkins) for (let k = 0; k < 3; k++) if ((f + k * 4) % 12 < 6) spark(c(-1.2 + 0.2 * Math.cos(k * 2 + f * 0.1), 2.15 + 0.2 * Math.sin(k * 2.1), -3.6), 0.1);
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
    if (s.place === "cafe" || s.place === "alley" || s.place === "auction") { this.fog.near = s.light === "night" ? 22 : 30; this.fog.far = s.light === "night" ? 150 : 260; }
    const night = s.light === "night";
    for (const nm of NIGHT_MATS) nm.m.emissiveIntensity = night ? nm.k : 0;
    for (const lm of LAMP_MATS) { const h = (lm.userData as { hot: [number, number, number] }).hot, k = night || s.place === "plane" ? 1 : 0.5; lm.color.setRGB(h[0] * k, h[1] * k, h[2] * k); }
    this.refs.wallOld.visible = s.wall === "old"; this.refs.wallNew.visible = s.wall !== "old";
    this.refs.shrine.visible = false; this.refs.shrineOld.visible = false;
    this.starPts.visible = night && s.place !== "plane" && s.place !== "cafe" && s.place !== "auction"; this.starPts.position.copy(cam.position);
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
    const roar = id === 13;
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

