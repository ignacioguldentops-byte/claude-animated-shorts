// The Maradona short's world: Mexico City stadium bowl (pitch, crowd stands, goals, boards), a Villa Fiorito dirt street
// with low brick/plaster houses, and a small bedroom. Same look modules as the bridge short (two-tone world, lit cards,
// ink, lens, grade). update(id, f, cam, scene) poses everything for shot id at frame f (pure function of id + f).
import * as THREE from "three";
import { Pool, Actor, Fx, SU } from "./pool";
import { NOINK } from "./ink";
import { TONE, CHAR, twoTone, untone } from "./shade";
import { LIGHTS, LOOK } from "./lights";
import { ctex, rep, rng, grassHD, facadeHD, cloudHD } from "./paint";
import { Pen, bodyFront, bodySide, fxBurst, fxContact, Outfit, FrontOpts, SideOpts, INK } from "./toon";
import { fxBall, fxCup, fxPlates, fxCog, fxConfetti, fxSpeed, fxQ } from "./props";
import { FPS, SHOTS, BX, RM, GX, W, V3, camAt, smooth, clamp01, runX, BEATEN, lerp } from "./story";

// ---------------- outfits ----------------
const HAIR = "#1d1310";
export const DIEGO: Outfit = { jacket: "#2d4ea8", pants: "#1f2433", boots: INK, hat: "hair", hair: HAIR, skin: "#e9b98f", build: "stout", buttons: "none" };
const DIEGO86: Outfit = { ...DIEGO, jacket: "#8ec9ee", stripes: "#fbfbf6", pants: "#1f2433" }; // striped home shirt (final)
const ARG = (v: number): Outfit => ({ ...DIEGO, build: "adult", skin: ["#f1c9a2", "#e2b088", "#f5d2b0"][v % 3], hair: ["#2a1d16", "#3b2a1c", "#16100c"][v % 3] });
const ENG = (v: number): Outfit => ({ buttons: "none", jacket: "#f4f3ee", pants: "#26315e", boots: INK, hat: "hair", hair: ["#b9884f", "#4a3020", "#d6b46a", "#2a1d16"][v % 4], skin: ["#ffe2c2", "#f5c9a0", "#ffdcc0", "#c99067"][v % 4] });
const KEEPER: Outfit = { buttons: "none", jacket: "#8d939b", pants: "#2c2f36", boots: INK, hat: "hair", hair: "#6b4a30", skin: "#ffdcc0", moustache: undefined };
const REF: Outfit = { buttons: "none", jacket: "#1e1e24", pants: "#1e1e24", boots: INK, hat: "hair", hair: "#22180f", skin: "#c99067", moustache: "#22180f" };
const KID: Outfit = { buttons: "none", jacket: "#e9e1cf", pants: "#3b5b9a", boots: "#6b4a30", hat: "hair", hair: HAIR, skin: "#e9b98f", build: "kid" };
const WAITER: Outfit = { jacket: "#f6f3ec", pants: "#22242c", boots: INK, hat: "hair", hair: "#3b2a1c", buttons: "#22242c", moustache: "#3b2a1c", skin: "#f1c9a2" };

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
/** stepped terraces packed with people: rows of shirts + heads, blue/white flags here and there */
const crowdTex = () => ctex("crowd", 1024, 1024, (g, r) => {
  const rows = 16, rh = 1024 / rows;
  const shirts = ["#e8e4da", "#d64a3c", "#f2c94c", "#3d6fc4", "#8ec9ee", "#f4f3ee", "#57a05a", "#ef8a3a", "#c25a7a", "#2b2b3a", "#ffffff", "#8ec9ee"];
  const skins = ["#f1c9a2", "#d9a074", "#b9805a", "#f5d6b8", "#8e5a3a"];
  for (let y = 0; y < rows; y++) {
    g.fillStyle = "#7d7a86"; g.fillRect(0, y * rh, 1024, rh);
    g.fillStyle = "#5c5866"; g.fillRect(0, y * rh + rh * 0.82, 1024, rh * 0.18);
    for (let x = 0; x < 1024; x += 13 + r() * 4) {
      const c = shirts[Math.floor(r() * shirts.length)];
      g.fillStyle = c; g.beginPath(); g.ellipse(x + 6, y * rh + rh * 0.66, 7, 11, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = skins[Math.floor(r() * skins.length)]; g.beginPath(); g.arc(x + 6, y * rh + rh * 0.36, 6, 0, Math.PI * 2); g.fill();
      g.fillStyle = r() < 0.5 ? "#2a1d16" : "#4a3426"; g.fillRect(x + 1, y * rh + rh * 0.2, 10, 4);
    }
    if (r() < 0.6) { // a flag held up: sky blue / white / sky blue, or plain colours
      const fx = r() * 960, fy = y * rh + 4;
      if (r() < 0.6) { g.fillStyle = "#8ec9ee"; g.fillRect(fx, fy, 54, 12); g.fillStyle = "#ffffff"; g.fillRect(fx, fy + 12, 54, 12); g.fillStyle = "#8ec9ee"; g.fillRect(fx, fy + 24, 54, 12); }
      else { g.fillStyle = ["#d64a3c", "#2f8a4a", "#f2c94c"][Math.floor(r() * 3)]; g.fillRect(fx, fy, 50, 34); }
    }
  }
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
const netTex = () => ctex("net", 256, 256, (g) => {
  g.clearRect(0, 0, 256, 256); g.strokeStyle = "#ffffff"; g.lineWidth = 3;
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
type Place = { key: string; draw: (p: Pen) => void; x: number; y: number; z: number; scale: number; mirror?: boolean; roll?: number; faceUp?: boolean };
type FxPlace = { key: string; cw: number; ch: number; draw: (p: Pen) => void; x: number; y: number; z: number; w: number; h: number; flat?: boolean; rot?: number; soft?: boolean };
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
    for (let i = 0; i < 40; i++) this.actors.push(new Actor(R));
    for (let i = 0; i < 70; i++) this.fxs.push(new Fx(R));
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
    const pos: number[] = [], uv: number[] = [], idx: number[] = [];
    const rings = [[0, 2.6], [16, 14], [17.5, 15.5], [36, 33], [38, 33.5], [42, 41]];
    for (let i = 0; i <= N; i++) {
      const a = (i / N) * Math.PI * 2, [x, z] = inner(a), L = Math.hypot(x, z);
      rings.forEach(([o, y], j) => { pos.push(x * (1 + o / L), y, z * (1 + o / L)); uv.push((i / N) * 11, (o + y) / 18); });
    }
    const M = rings.length;
    for (let i = 0; i < N; i++) for (let j = 0; j < M - 1; j++) { const a = i * M + j, b = (i + 1) * M + j; idx.push(a, b, a + 1, b, b + 1, a + 1); }
    const bowl = new THREE.BufferGeometry();
    bowl.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); bowl.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    bowl.setIndex(idx); bowl.computeVertexNormals();
    const ct = repT(crowdTex());
    const crowd = add(R, bowl, lam("crowd", () => ({ map: ct, side: THREE.DoubleSide })), true);
    void tiers; void crowd;
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
    add(R, roof, lam("roof", () => ({ map: rt, side: THREE.DoubleSide })));
    // floodlight masts on the rim
    for (const a of [0.6, 2.55, 3.75, 5.7]) { const [x, z] = inner(a), L = Math.hypot(x, z), k = 1 + 46 / L; add(R, box(x * k - 0.6, 30, z * k - 0.6, x * k + 0.6, 62, z * k + 0.6), lam("mast", () => ({ color: "#b9b4ac" }))); add(R, box(x * k - 3, 62, z * k - 1, x * k + 3, 66, z * k + 1), lam("lamps", () => ({ color: "#f1ede0" }))); }
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
    // a café table + chairs for the waiters' corner
    const wood = lam("wood", () => ({ color: "#9a6a42" }));
    add(R, box(BX + 1.2, 0, -1.6, BX + 1.3, 0.72, -1.5), wood); add(R, box(BX + 0.7, 0.72, -2.1, BX + 1.8, 0.78, -1.0), wood);
    add(R, box(BX + 2.3, 0, -1.9, BX + 2.8, 0.45, -1.4), wood);
  }

  private buildRoom(R: THREE.Object3D) {
    const [x, , z] = RM;
    const wall = lam("roomWall", () => ({ map: repT(plasterTex("room", "#cfe0c4")) }));
    add(R, box(x - 3, -0.1, z - 3, x + 3, 0, z + 3), lam("floor", () => ({ color: "#a77c4e" })), false);
    add(R, box(x - 3, 0, z - 1.6, x + 3, 3, z - 1.4), wall);
    add(R, box(x - 3, 0, z - 1.6, x - 2.8, 3, z + 3), wall);
    add(R, box(x + 2.8, 0, z - 1.6, x + 3, 3, z + 3), wall);
    const win = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.9), new THREE.MeshBasicMaterial({ map: windowTex(), color: new THREE.Color(1.6, 1.4, 1.2), toneMapped: true }));
    win.position.set(x + 1.3, 1.8, z - 1.39); R.add(win);
    const wood = lam("bedwood", () => ({ color: "#8a5a34" }));
    add(R, box(x - 1.3, 0, z - 1.1, x + 1.0, 0.35, z - 0.1), wood);
    add(R, box(x - 1.35, 0, z - 1.15, x - 1.25, 0.9, z - 0.05), wood);
    add(R, box(x - 1.25, 0.35, z - 1.05, x + 0.95, 0.5, z - 0.15), lam("mattress", () => ({ color: "#efe9dc" })));
    add(R, box(x - 1.2, 0.5, z - 0.95, x - 0.75, 0.62, z - 0.25), lam("pillow", () => ({ color: "#f7f4ec" })));
    add(R, box(x - 0.45, 0.5, z - 1.08, x + 0.98, 0.58, z - 0.12), lam("blanket", () => ({ map: repT(blanketTex()) })));
    add(R, box(x + 1.6, 0, z - 1.3, x + 2.2, 0.6, z - 0.8), wood);
  }

  // ---------------- staging ----------------
  private person(w: Who, x: number, y: number, z: number, opts: { side?: boolean; mirror?: boolean; fo?: FrontOpts; so?: SideOpts; roll?: number; scale?: number }): Place {
    const light = this.lightAngle, seed = w.seed;
    const key = opts.side ? `S|${w.okey}|${fkey({ ...opts.so, light, seed })}` : `F|${w.okey}|${fkey({ ...opts.fo, light, seed })}`;
    return { key, x, y, z, scale: opts.scale ?? w.scale ?? 1, mirror: opts.mirror, roll: opts.roll,
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

  private stage(id: number, f: number): Stage {
    const st: Stage = { places: [], fx: [] }, P = (p: Place) => st.places.push(p);
    const D = who(DIEGO, 3, 0.92), blink = (s: number) => lidAt(f, s);
    switch (id) {
      case 1: { // hook: Diego in the blue shirt, ball at his feet, the bowl roaring behind
        P(this.person(D, 36, 0, 0.6, { fo: { mode: "stand", expr: f < 100 ? "smile_closed" : "grin", blink: blink(3), look: -0.3, facing: -1 } }));
        this.contact(st, 36, 0.6, 1); this.ball(st, 35.55, 0, 1.0, 0);
        P(this.person(who(ENG(1), 21), 41, 0, -4, { fo: { mode: "stand", expr: "stern", blink: blink(21), look: -1 } })); this.contact(st, 41, -4);
        P(this.person(who(ARG(2), 22), 30.5, 0, -6, { fo: { mode: "stand", expr: "neutral", blink: blink(22), look: 1 } })); this.contact(st, 30.5, -6);
        break;
      }
      case 2: { // kid Diego kicking a ball up the dirt road
        const t = (f - 194) / FPS, kz = -2 + t * 1.1;
        P(this.person(who(KID, 5), BX - 0.3, 0, kz, { side: true, mirror: true, so: { mode: "march", phase: (t * 1.6) % 1, stride: 0.6, expr: "grin", blink: blink(5) } }));
        this.contact(st, BX - 0.3, kz, 0.8);
        const bh = Math.abs(Math.sin(t * Math.PI * 1.6)) * 0.5;
        this.ball(st, BX - 0.3, bh, kz + 0.75, f);
        P(this.person(who(townsfolkLike(0), 41), BX + 3.5, 0, 6, { fo: { mode: "stand", expr: "smile", blink: blink(41), look: -0.5 } })); this.contact(st, BX + 3.5, 6);
        break;
      }
      case 3: { // asleep, hugging the ball
        P({ ...this.person(who(KID, 5), RM[0] + 0.55, 0.6, RM[2] - 0.45, { fo: { mode: "sit", expr: "relief", blink: 1, headTilt: 8 } }), roll: Math.PI / 2 - 0.05, faceUp: true });
        st.fx.push({ key: "ballHug", cw: 256, ch: 256, draw: (p) => fxBall(p, 0.3), x: RM[0] + 0.12, y: 0.7, z: RM[2] - 0.28, w: 0.28, h: 0.28 });
        break;
      }
      case 4: { // the two teams lined up; Diego the captain in front
        for (let i = 0; i < 6; i++) {
          P(this.person(who(ARG(i), 30 + i), -3 - i * 1.2, 0, -0.2 - i * 0.35, { fo: { mode: "stand", expr: i % 2 ? "stern" : "neutral", blink: blink(30 + i), look: 0.3 } })); this.contact(st, -3 - i * 1.2, -0.2 - i * 0.35);
          P(this.person(who(ENG(i), 50 + i), 4 + i * 1.2, 0, -1.0 - i * 0.35, { fo: { mode: "stand", expr: i % 2 ? "stern" : "neutral", blink: blink(50 + i), look: -0.3 } })); this.contact(st, 4 + i * 1.2, -1.0 - i * 0.35);
        }
        P(this.person(D, -1.4, 0, 0.6, { fo: { mode: "stand", expr: f > W.captain - 2 ? "smile" : "stern", blink: blink(3), look: 0.5, facing: 1 } })); this.contact(st, -1.4, 0.6);
        P(this.person(who(REF, 70), 1.4, 0, -0.4, { fo: { mode: "stand", expr: "neutral", blink: blink(70) } })); this.contact(st, 1.4, -0.4);
        this.ball(st, 1.9, 0, 0.1, 0);
        break;
      }
      case 5: { // keeper vs Diego, ball looping up between them
        const u = clamp01((f - W.floats) / 120);
        const bx = lerp(44.5, 49.6, u), by = 1.0 + 6.5 * Math.sin(Math.PI * u * 0.85) * (1 - u * 0.25), bz = 0.4;
        P(this.person(who(KEEPER, 61, 1.05), 50.4, 0, -0.4, { fo: { mode: "stand", expr: f > W.taller - 3 ? "smile" : "stern", blink: blink(61), look: -0.6, wave: f > 700 ? 0.6 : undefined } }));
        this.contact(st, 50.4, -0.4, 1.1);
        P(this.person(D, 48.6, 0, 0.9, { fo: { mode: "stand", expr: "stern", blink: blink(3), look: 0.6 } })); this.contact(st, 48.6, 0.9);
        P(this.person(who(ENG(2), 52), 46.5, 0, -2.4, { fo: { mode: "stand", expr: "nervous", blink: blink(52), look: 1 } })); this.contact(st, 46.5, -2.4);
        if (f >= W.floats - 20) this.ball(st, bx, by, bz, f);
        break;
      }
      case 6: { // the jump and the punch
        const up = Math.sin(Math.PI * clamp01((f - W.jumps) / 40)) * 0.75;
        const hit = f >= W.punch;
        P(this.person(who(KEEPER, 61, 1.05), 50.9, Math.sin(Math.PI * clamp01((f - W.jumps - 6) / 40)) * 0.35, -0.6, { fo: { mode: "stand", expr: hit ? "shock" : "stern", blink: blink(61), look: -0.4, wave: 1 } }));
        this.contact(st, 50.9, -0.6, 1.1);
        P(this.person(D, 50.1, up, 0.5, { fo: { mode: "stand", expr: hit ? "grin" : "stern", blink: blink(3), look: 0.7, wave: f > W.jumps + 6 ? 1 : undefined, tilt: 6 } }));
        this.contact(st, 50.1, 0.5, 1 - up * 0.5);
        const u = clamp01((f - W.punch) / 16);
        const bx = hit ? lerp(50.3, 54.0, u) : lerp(48.6, 50.3, clamp01((f - 768) / (W.punch - 768))), by = hit ? lerp(2.45, 0.6, u * u) : lerp(5.0, 2.45, clamp01((f - 768) / (W.punch - 768)));
        this.ball(st, bx, by, hit ? lerp(0.5, 0.2, u) : 0.5, f);
        if (f >= W.punch && f < W.punch + 12) st.fx.push({ key: `burst|${f - W.punch}`, cw: 500, ch: 500, draw: (p) => fxBurst(p, (f - W.punch) / 12), x: 50.3, y: 2.45, z: 0.6, w: 1.2, h: 1.2 });
        break;
      }
      case 7: { // the referee, calm, looking the wrong way
        P(this.person(who(REF, 70), 43.5, 0, -14.2, { fo: { mode: "stand", expr: "neutral", blink: blink(70), look: -1, facing: -1 } })); this.contact(st, 43.5, -14.2);
        if (f > W.referee) st.fx.push({ key: "q", cw: 200, ch: 260, draw: fxQ, x: 44.15, y: 2.05 + 0.03 * Math.sin(f / 4), z: -14.0, w: 0.32, h: 0.42 });
        break;
      }
      case 8: { // feet + ball
        P(this.person(D, 0.45, 0, 0, { fo: { mode: "stand", expr: "stern", blink: blink(3), look: 0.2 } })); this.contact(st, 0.45, 0);
        const roll = Math.max(0, f - 990) * 0.02;
        this.ball(st, 0.05 + Math.sin(roll * 3) * 0.08, 0, 0.45, f);
        break;
      }
      case 9: case 10: { // the run
        const x = runX(f), ph = ((f - 1095) / 13) % 1;
        P(this.person(D, x, 0, 0, { side: true, so: { mode: "march", phase: ph, stride: 1.3, stomp: 1.3, expr: "stern", blink: blink(3) } })); this.contact(st, x, 0);
        this.ball(st, x + 0.65 + 0.12 * Math.sin(ph * Math.PI * 2), 0, 0.15, f);
        BEATEN.forEach((b, i) => {
          const down = f > b.f + 2, k = clamp01((f - b.f) / 10);
          const lunge = Math.min(1.2, Math.max(0, (f - b.f + 25) / 25)) * (i % 2 ? -1 : 1);
          P(this.person(who(ENG(i), 80 + i), b.x, 0, b.z + (down ? 0 : lunge * 0.3), { fo: { mode: down ? "fall" : "stand", expr: down ? "dazed" : "nervous", blink: blink(80 + i), look: -1, tilt: down ? 0 : -10 * k }, roll: down ? (i % 2 ? 1 : -1) * 0.5 * smooth((f - b.f) / 6) : 0 }));
          this.contact(st, b.x, b.z, 1.1);
          if (f >= b.f && f < b.f + 10) st.fx.push({ key: `burst|${f - b.f}`, cw: 500, ch: 500, draw: (p) => fxBurst(p, (f - b.f) / 10, "#fff3b0", 8), x: b.x - 0.6, y: 1.0, z: b.z, w: 0.9, h: 0.9 });
        });
        if (id === 10) {
          const kf = W.keeper, down = f > kf + 6;
          P(this.person(who(KEEPER, 61, 1.05), 50.6, 0, -0.3, { fo: { mode: down ? "fall" : "stand", expr: down ? "dazed" : "shock", blink: blink(61), wave: down ? undefined : 1 }, roll: down ? -0.8 : 0 }));
          this.contact(st, 50.6, -0.3, 1.1);
        }
        if (f > 1140 && f < 1230) st.fx.push({ key: "speed", cw: 400, ch: 200, draw: fxSpeed, x: x - 1.3, y: 1.0, z: 0.05, w: 1.2, h: 0.6, soft: true });
        break;
      }
      case 11: { // short and low next to a tall defender; centre of gravity
        P(this.person(D, -0.2, 0, 0, { fo: { mode: "stand", expr: "neutral", blink: blink(3), look: 0.4 } })); this.contact(st, -0.2, 0);
        P(this.person(who(ENG(3), 90, 1.12), 1.2, 0, -0.4, { fo: { mode: "stand", expr: "stern", blink: blink(90), look: -0.5 } })); this.contact(st, 1.2, -0.4, 1.1);
        if (f > W.low - 30) st.fx.push({ key: "cog", cw: 200, ch: 300, draw: fxCog, x: -0.2, y: 0.95 - 0.2 * smooth((f - W.low + 30) / 20), z: 0.08, w: 0.2, h: 0.3 });
        break;
      }
      case 12: { // waiter with a tall stack crawls round the corner, the short stack whips round
        const xT = BX - 2.85, xS = BX - 1.15;
        const leanT = 0.08 * Math.sin(f / 7) * (f > W.tall ? 1 : 0.3);
        P(this.person(who(WAITER, 95), xT, 0, 0, { fo: { mode: "stand", expr: f > W.tall ? "nervous" : "neutral", blink: blink(95), wave: 0.2 } })); this.contact(st, xT, 0);
        st.fx.push({ key: `plT|${q(leanT, 50)}`, cw: 300, ch: 900, draw: (p) => fxPlates(p, 26, leanT), x: xT + 0.42, y: 1.6, z: 0.05, w: 0.38, h: 1.14 });
        const spin = f > W.whip - 4 ? Math.min(1, (f - W.whip + 4) / 14) : 0;
        const dx = Math.sin(spin * Math.PI) * 0.45, sh = f > W.short - 10;
        P(this.person(who({ ...WAITER, moustache: undefined, hair: "#16100c" }, 96), xS + dx, 0, -spin * 0.4, { fo: { mode: spin > 0 && spin < 1 ? "stroll" : "stand", phase: spin * 2, expr: sh ? "grin" : "neutral", blink: blink(96), wave: 0.2, facing: spin > 0.5 ? -1 : 1 }, mirror: spin > 0.5 }));
        this.contact(st, xS + dx, -spin * 0.4);
        st.fx.push({ key: "plS", cw: 300, ch: 900, draw: (p) => fxPlates(p, 4, 0), x: xS + dx + (spin > 0.5 ? -0.42 : 0.42), y: 1.6, z: 0.05 - spin * 0.4, w: 0.38, h: 1.14 });
        if (spin > 0 && spin < 1) st.fx.push({ key: "speed", cw: 400, ch: 200, draw: fxSpeed, x: xS + dx - 0.7, y: 1.2, z: 0.1, w: 1.0, h: 0.5, soft: true });
        break;
      }
      case 13: { // champions: Diego on shoulders with the cup
        const D2 = who(DIEGO86, 4, 0.92);
        P(this.person(who({ ...ARG(1), jacket: "#8ec9ee", stripes: "#fbfbf6", pants: "#1f2433" }, 31), -0.6, 0, -0.2, { fo: { mode: "stand", expr: "laugh", blink: blink(31), wave: 1 } })); this.contact(st, -0.6, -0.2);
        P(this.person(who({ ...ARG(2), jacket: "#8ec9ee", stripes: "#fbfbf6", pants: "#1f2433" }, 32), 0.6, 0, -0.2, { fo: { mode: "stand", expr: "grin", blink: blink(32), wave: 1 } })); this.contact(st, 0.6, -0.2);
        P(this.person(D2, 0, 1.35 + 0.04 * Math.sin(f / 5), 0.25, { fo: { mode: "sit", expr: "laugh", blink: blink(4), wave: 1 } }));
        st.fx.push({ key: "cup", cw: 300, ch: 500, draw: fxCup, x: 0.42, y: 2.95 + 0.04 * Math.sin(f / 5), z: 0.3, w: 0.42, h: 0.7 });
        for (let i = 0; i < 26; i++) {
          const cx = (hs(i, 1) - 0.5) * 5, cy = 5 - ((f - 1618) * (0.03 + 0.02 * hs(i, 2)) + hs(i, 3) * 4) % 5, cz = (hs(i, 4) - 0.5) * 2 + 0.6;
          const col = ["#8ec9ee", "#ffffff", "#f2c443"][i % 3];
          st.fx.push({ key: `conf|${col}`, cw: 64, ch: 64, draw: (p) => fxConfetti(p, col), x: cx, y: cy, z: cz, w: 0.1, h: 0.1, rot: f * 0.2 + i });
        }
        break;
      }
      default: { // hand ... feet
        const hand = f >= W.hand2 - 3 && f < W.feet2 - 8, feet = f >= W.feet2 - 8;
        P(this.person(D, -8, 0, 0, { fo: { mode: "stand", expr: hand ? "smile_closed" : feet ? "grin" : "neutral", blink: blink(3), look: 0, wave: hand ? 1 : undefined } }));
        this.contact(st, -8, 0);
        const bounce = feet ? Math.abs(Math.sin((f - W.feet2 + 8) / 5)) * 0.6 : 0;
        this.ball(st, -7.65, bounce, 0.3, f);
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
      m.scale.set((p.mirror ? -1 : 1) * p.scale, p.scale, p.scale);
      m.castShadow = s.light === "golden";
    }
    for (const { e, p } of fr) {
      e.use(!!p.soft); e.bind();
      const m = e.mesh; m.visible = true; m.position.set(p.x, p.y, p.z); m.scale.set(p.w, p.h, 1);
      if (p.flat) m.rotation.set(-Math.PI / 2, 0, p.rot ?? 0);
      else { m.rotation.set(0, 0, 0); m.lookAt(cam.position); if (p.rot) m.rotateZ(p.rot); }
    }
    return focus;
  }
}

const townsfolkLike = (v: number): Outfit => ({ jacket: ["#c25a7a", "#5a8fc2", "#d9a441"][v % 3], pants: "#3b3f52", boots: "#4a3426", hat: "hair", hair: "#3b2a1c", dress: "#c25a7a", skin: "#f1c9a2" });
void SU;
