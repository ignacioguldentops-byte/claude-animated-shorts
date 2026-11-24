// Trees v2: branching trunks and limbs (tapered tubes with a bark texture per species), leaf-cluster cards at the
// branch tips (twig sprays painted per species: olive, Italian cypress, stone pine, oak, plane, poplar), crown normals
// for a soft volume, darker interiors, and a little wind in the leaves. lod 0 near, 1 mid, 2 far (fewer, larger cards).
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { surf, fbm, hash } from "./pbr";
import { NOINK } from "./ink";

export type Species = "olive" | "cypress" | "pine" | "oak" | "plane" | "poplar";
export type TSpec = { x: number; z: number; h: number; sp: Species; seed: number; y?: number; lod?: number; lean?: number };
/** seconds, set by the world every frame (deterministic wind) */
export const TREE_T = { value: 0 };
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const sst = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const mkR = (seed: number) => { let s = (seed * 2654435761) >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; };

// ---------------- bark ----------------
const BARK: Record<Species, [number, number, number]> = { olive: [126, 116, 98], cypress: [112, 88, 70], pine: [138, 84, 60], oak: [96, 82, 66], plane: [176, 168, 146], poplar: [160, 156, 146] };
const barkMats = new Map<Species, THREE.MeshStandardMaterial>();
const barkMat = (sp: Species) => { let m = barkMats.get(sp); if (m) return m;
  const s = surf("bark2_" + sp, 512, 8, (u, v, o) => {
    const [r, g, b] = BARK[sp], fis = Math.abs(fbm(u, v * 0.16, 10, 4, 3 + sp.length) - 0.5) * 2, ridge = Math.min(1, fis * 3.0), n = fbm(u, v, 48, 3, 9), m2 = fbm(u, v, 4, 3, 11);
    let k = 0.42 + 0.58 * ridge + 0.16 * (n - 0.5), h = ridge * 0.8 + 0.2 * n;
    if (sp === "plane") { const pt = fbm(u, v * 0.5, 3, 3, 21); k = 0.86 + 0.18 * (n - 0.5); o[1] = r * k * (pt > 0.5 ? 1 : 0.78); o[2] = g * k * (pt > 0.55 ? 1.03 : 0.86); o[3] = b * k * (pt > 0.5 ? 0.9 : 0.72); o[0] = 0.4 + 0.3 * pt; o[4] = 0.8; return; }
    if (sp === "pine") { const pl = fbm(u, v * 0.5, 7, 3, 31), plate = sst(0.42, 0.52, pl); k = 0.46 + 0.5 * plate * (0.5 + 0.5 * ridge) + 0.12 * n; h = plate * 0.7 + 0.3 * n; }
    if (sp === "olive") { const tw = Math.abs(fbm(u + v * 0.35, v * 0.2, 9, 4, 41) - 0.5) * 2; k = 0.4 + 0.6 * Math.min(1, tw * 2.6) + 0.14 * (n - 0.5); h = tw; }
    o[0] = h; o[1] = r * k; o[2] = g * k; o[3] = b * k * (0.94 + 0.12 * m2); o[4] = 0.93;
  });
  m = new THREE.MeshStandardMaterial({ map: s.map, normalMap: s.normalMap, roughnessMap: s.roughnessMap, normalScale: new THREE.Vector2(1.4, 1.4) });
  barkMats.set(sp, m); return m; };

// ---------------- leaf-cluster atlases (2 x 2 sprays of 512 px) ----------------
type G2 = CanvasRenderingContext2D;
const leaf = (g: G2, x: number, y: number, a: number, len: number, wid: number, top: string, under: string, edge: string, lobes = 0) => {
  g.save(); g.translate(x, y); g.rotate(a); g.beginPath();
  if (lobes) { for (let i = 0; i <= 24; i++) { const t = i / 24, r = Math.sin(Math.PI * t) * wid * (1 + 0.28 * Math.sin(t * Math.PI * lobes * 2)); g.lineTo(t * len, -r); } for (let i = 24; i >= 0; i--) { const t = i / 24, r = Math.sin(Math.PI * t) * wid * (1 + 0.28 * Math.sin(t * Math.PI * lobes * 2 + 0.6)); g.lineTo(t * len, r); } }
  else { g.moveTo(0, 0); g.quadraticCurveTo(len * 0.45, -wid * 1.25, len, 0); g.quadraticCurveTo(len * 0.45, wid * 1.25, 0, 0); }
  g.closePath(); const gr = g.createLinearGradient(0, -wid, 0, wid); gr.addColorStop(0, top); gr.addColorStop(0.55, top); gr.addColorStop(1, under); g.fillStyle = gr; g.fill();
  g.lineWidth = Math.max(1.2, wid * 0.12); g.strokeStyle = edge; g.stroke(); g.beginPath(); g.moveTo(len * 0.05, 0); g.lineTo(len * 0.9, 0); g.lineWidth = Math.max(0.8, wid * 0.08); g.strokeStyle = "rgba(235,240,215,0.45)"; g.stroke(); g.restore(); };
const jit = (c: number[], r: () => number, k = 0.18) => { const m = 1 + (r() - 0.5) * k; return `rgb(${Math.round(c[0] * m)},${Math.round(c[1] * m)},${Math.round(c[2] * m)})`; };
const drawSpray = (g: G2, sp: Species, q: number) => {
  const r = mkR(97 + q * 13 + sp.length * 7);
  if (sp === "olive") { const st: [number, number][] = []; for (let i = 0; i <= 20; i++) { const t = i / 20; st.push([30 * Math.sin(t * 2.4 + q), 236 - t * 450]); }
    g.lineWidth = 7; g.strokeStyle = "#6a5a44"; g.beginPath(); st.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke();
    for (let i = 2; i < 21; i++) for (const sd of [-1, 1]) { if (r() < 0.12) continue; const [x, y] = st[Math.min(20, i)], a = -Math.PI / 2 + sd * (0.55 + 0.35 * r()), sil = r() < 0.4;
      leaf(g, x, y, a, 100 + 40 * r(), 13 + 6 * r(), sil ? jit([168, 176, 148], r) : jit([86, 104, 64], r), jit([178, 186, 160], r), "#2f3a22"); }
    for (let i = 0; i < 6; i++) leaf(g, (r() - 0.5) * 120, (r() - 0.5) * 300, r() * 6.3, 90 + 30 * r(), 12 + 5 * r(), jit([96, 112, 72], r), jit([170, 178, 150], r), "#2f3a22"); }
  else if (sp === "pine") { for (let b = 0; b < 3; b++) { const cx = -120 + b * 120 + (r() - 0.5) * 40, cy = 40 + (r() - 0.5) * 80;
      g.lineWidth = 9; g.strokeStyle = "#6a4630"; g.beginPath(); g.moveTo(cx, cy + 40); g.lineTo(cx + (r() - 0.5) * 30, 250); g.stroke();
      for (let i = 0; i < 150; i++) { const a = -Math.PI * (0.02 + 0.96 * r()), L = 110 + 120 * r(), x1 = cx + L * Math.cos(a), y1 = cy + L * Math.sin(a) * 0.82;
        const gr = g.createLinearGradient(cx, cy, x1, y1); gr.addColorStop(0, "#2f4522"); gr.addColorStop(1, jit([108, 140, 70], r, 0.3)); g.strokeStyle = gr; g.lineWidth = 3.2 + 1.6 * r(); g.beginPath(); g.moveTo(cx, cy); g.quadraticCurveTo((cx + x1) / 2, (cy + y1) / 2 - 10, x1, y1); g.stroke(); } } }
  else if (sp === "cypress") { const spray = (x: number, y: number, a: number, L: number, w: number, d: number) => { const x1 = x + L * Math.cos(a), y1 = y + L * Math.sin(a);
      g.lineCap = "round"; g.strokeStyle = d === 0 ? jit([62, 92, 48], r, 0.25) : jit([40, 64, 34], r, 0.2); g.lineWidth = w; g.beginPath(); g.moveTo(x, y); g.lineTo(x1, y1); g.stroke();
      if (d < 3) for (let i = 1; i <= 4; i++) { const t = i / 5, sx = x + (x1 - x) * t, sy = y + (y1 - y) * t; spray(sx, sy, a + (i % 2 ? 0.75 : -0.75) + (r() - 0.5) * 0.3, L * 0.48, w * 0.72, d + 1); } };
    for (let k = 0; k < 3; k++) spray(-80 + k * 80 + (r() - 0.5) * 40, 250, -Math.PI / 2 + (r() - 0.5) * 0.5, 330 + 80 * r(), 18, 0); }
  else { const lob = sp === "oak" ? 3 : sp === "plane" ? 2 : 0, top = sp === "poplar" ? [104, 140, 66] : sp === "plane" ? [78, 118, 52] : [66, 104, 44];
    g.lineWidth = 6; g.strokeStyle = "#5a4834"; g.beginPath(); g.moveTo(0, 250); g.quadraticCurveTo(40, 0, -20, -200); g.stroke();
    for (let i = 0; i < 16; i++) { const t = i / 16, x = 40 * Math.sin(t * 3) - 10, y = 230 - t * 420, a = -Math.PI / 2 + (i % 2 ? 1 : -1) * (0.6 + 0.6 * r());
      leaf(g, x, y, a, (sp === "poplar" ? 80 : 120) + 50 * r(), (sp === "poplar" ? 34 : 38) + 12 * r(), jit(top, r), jit([top[0] + 50, top[1] + 46, top[2] + 30], r), "#22341a", lob); } }
};
const atlases = new Map<Species, THREE.CanvasTexture>();
const atlas = (sp: Species) => { let t = atlases.get(sp); if (t) return t;
  const cv = document.createElement("canvas"); cv.width = cv.height = 1024; const g = cv.getContext("2d")!;
  for (let q = 0; q < 4; q++) { g.save(); g.translate((q % 2) * 512 + 256, Math.floor(q / 2) * 512 + 256); g.beginPath(); g.rect(-256, -256, 512, 512); g.clip(); drawSpray(g, sp, q); g.restore(); }
  t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; atlases.set(sp, t); return t; };

// ---------------- growth ----------------
type Seg = { a: THREE.Vector3; b: THREE.Vector3; r0: number; r1: number };
type Card = { p: THREE.Vector3; s: number; q: THREE.Quaternion; n: THREE.Vector3; ao: number; tone: number };
const rotTo = (d: THREE.Vector3, ang: number, around: number) => { // tilt d by ang toward a random azimuth `around`
  const side = V(Math.cos(around), 0, Math.sin(around)); side.sub(d.clone().multiplyScalar(side.dot(d))).normalize(); if (!isFinite(side.x)) side.set(1, 0, 0);
  return d.clone().multiplyScalar(Math.cos(ang)).add(side.multiplyScalar(Math.sin(ang))).normalize(); };
const grow = (t: TSpec): { segs: Seg[]; cards: Card[] } => {
  const r = mkR(t.seed * 7919 + 13), segs: Seg[] = [], tips: THREE.Vector3[] = [], h = t.h, lod = t.lod ?? 0, base = V(t.x, t.y ?? 0, t.z);
  const limb = (p: THREE.Vector3, d: THREE.Vector3, len: number, rad: number, depth: number, spread: number, up: number, kids: [number, number], shrink = 0.72) => {
    const n = Math.max(1, Math.round(len / 0.9)); let a = p.clone(), dir = d.clone();
    for (let i = 0; i < n; i++) { dir = dir.clone().add(V((r() - 0.5) * 0.25, up * 0.15, (r() - 0.5) * 0.25)).normalize(); const b = a.clone().add(dir.clone().multiplyScalar(len / n)); segs.push({ a, b, r0: rad * (1 - 0.25 * i / n), r1: rad * (1 - 0.25 * (i + 1) / n) }); a = b; }
    if (depth <= 0 || rad < 0.012) { tips.push(a); return; }
    const k = kids[0] + Math.floor(r() * (kids[1] - kids[0] + 1)), az0 = r() * 6.283;
    for (let j = 0; j < k; j++) limb(a, rotTo(dir, spread * (0.7 + 0.6 * r()), az0 + (j * 6.283) / k), len * (shrink + 0.15 * (r() - 0.5)), rad * 0.66, depth - 1, spread, up, kids, shrink);
    if (r() < 0.5) tips.push(a.clone()); };
  let crownC = base.clone().add(V(0, 0.68 * h, 0)), crownR = V(0.42 * h, 0.3 * h, 0.42 * h), cardN = 5, cardS = 0.7, upBias = 0.35, cluster = 0.5;
  const leanD = V(Math.cos(t.seed), 0, Math.sin(t.seed)).multiplyScalar(t.lean ?? 0);
  if (t.sp === "olive") { // short gnarled trunk that splits low into crooked limbs; a wide, open, silvery crown
    const tr = 0.05 * h, th = 0.28 * h; let p = base.clone(); for (let i = 0; i < 3; i++) { const q = p.clone().add(V((r() - 0.5) * 0.35, th / 3, (r() - 0.5) * 0.35)); segs.push({ a: p, b: q, r0: tr * (1.15 - i * 0.08), r1: tr * (1.07 - i * 0.08) }); p = q; }
    const n = 3 + Math.floor(r() * 2); for (let j = 0; j < n; j++) limb(p, rotTo(V(0, 1, 0), 0.75 + 0.3 * r(), (j * 6.283) / n + r()), 0.3 * h, tr * 0.62, lod > 1 ? 2 : 3, 0.62, 0.25, [2, 3]);
    crownC = base.clone().add(V(0, 0.62 * h, 0)); crownR = V(0.48 * h, 0.3 * h, 0.48 * h); cardN = 15; cardS = 0.075 * h + 0.14; cluster = 0.13 * h; }
  else if (t.sp === "cypress") { // a straight trunk dressed from the foot to the tip in upturned sprays: a dark flame
    const tr = 0.028 * h; segs.push({ a: base.clone(), b: base.clone().add(V(0, 0.96 * h, 0)).add(leanD), r0: tr, r1: tr * 0.25 });
    const step = lod > 1 ? 0.4 : 0.22; for (let y = 0.06 * h; y < 0.97 * h; y += step) { const w = 0.11 * h * Math.pow(1 - y / h, 0.75) + 0.12, nn = lod > 1 ? 2 : 3;
      for (let j = 0; j < nn; j++) { const a = r() * 6.283, p = base.clone().add(V(0, y, 0)).add(leanD.clone().multiplyScalar(y / h)), d = V(Math.cos(a), 1.4, Math.sin(a)).normalize(), b = p.clone().add(d.multiplyScalar(w * 1.1));
        segs.push({ a: p, b, r0: tr * 0.25, r1: tr * 0.1 }); tips.push(b); if (r() < 0.6) tips.push(p.clone().lerp(b, 0.5)); } }
    crownC = base.clone().add(V(0, 0.5 * h, 0)); crownR = V(0.1 * h + 0.3, 0.5 * h, 0.1 * h + 0.3); cardN = 5; cardS = 0.7 + 0.035 * h; upBias = 0.1; cluster = 0.32; }
  else if (t.sp === "pine") { // stone pine: a tall bare trunk, limbs fanning up, a flat umbrella of needles
    const tr = 0.026 * h, top = base.clone().add(V(0, 0.6 * h, 0)).add(leanD.clone().multiplyScalar(0.6 * h)); segs.push({ a: base.clone(), b: base.clone().lerp(top, 0.5).add(V((r() - 0.5) * 0.4, 0, (r() - 0.5) * 0.4)), r0: tr, r1: tr * 0.92 }); segs.push({ a: segs[0].b, b: top, r0: tr * 0.92, r1: tr * 0.8 });
    const n = 4 + Math.floor(r() * 3); for (let j = 0; j < n; j++) limb(top, rotTo(V(0, 1, 0), 0.65 + 0.35 * r(), (j * 6.283) / n + r()), 0.2 * h, tr * 0.6, lod > 1 ? 2 : 3, 0.55, -0.1, [2, 3], 0.66);
    crownC = top.clone().add(V(0, 0.2 * h, 0)); crownR = V(0.42 * h, 0.12 * h, 0.42 * h); cardN = 15; cardS = 0.08 * h + 0.3; upBias = 1.2; cluster = 0.08 * h; }
  else if (t.sp === "poplar") { const tr = 0.03 * h; let p = base.clone(); const q = p.clone().add(V(0, 0.25 * h, 0)); segs.push({ a: p, b: q, r0: tr, r1: tr * 0.9 }); p = q;
    for (let j = 0; j < 7; j++) limb(p.clone().add(V(0, j * 0.08 * h, 0)), rotTo(V(0, 1, 0), 0.25 + 0.15 * r(), r() * 6.283), 0.45 * h - j * 0.04 * h, tr * 0.5, 2, 0.3, 0.6, [2, 2], 0.7);
    crownC = base.clone().add(V(0, 0.6 * h, 0)); crownR = V(0.15 * h, 0.4 * h, 0.15 * h); cardN = 10; cardS = 0.06 * h + 0.3; cluster = 0.07 * h; }
  else { // oak / plane: a stout trunk, four or five heavy limbs, a big rounded crown
    const tr = 0.04 * h, th = 0.34 * h, p = base.clone().add(V((r() - 0.5) * 0.3, th, (r() - 0.5) * 0.3)); segs.push({ a: base.clone(), b: p, r0: tr * 1.2, r1: tr });
    const n = 4 + Math.floor(r() * 2); for (let j = 0; j < n; j++) limb(p, rotTo(V(0, 1, 0), 0.55 + 0.3 * r(), (j * 6.283) / n + r()), 0.26 * h, tr * 0.62, lod > 1 ? 2 : 3, 0.55, 0.3, [2, 3]);
    crownC = base.clone().add(V(0, 0.66 * h, 0)); crownR = V(0.4 * h, 0.32 * h, 0.4 * h); cardN = 13; cardS = 0.075 * h + 0.3; cluster = 0.1 * h; }
  const nMul = lod === 0 ? 1 : lod === 1 ? 0.8 : t.sp === "pine" ? 1.0 : 0.7, sMul = lod === 0 ? 1 : lod === 1 ? 1.3 : t.sp === "pine" ? 1.6 : 2.5, cards: Card[] = [], E = new THREE.Euler();
  for (const tp of tips) { const nn = Math.max(1, Math.round(cardN * nMul * (0.7 + 0.6 * r())));
    for (let k = 0; k < nn; k++) { const p = tp.clone().add(V((r() - 0.5) * 2 * cluster, (r() - 0.5) * 1.2 * cluster, (r() - 0.5) * 2 * cluster)); const rel = p.clone().sub(crownC).divide(crownR), d = rel.length();
      const n = rel.clone().normalize().add(V(0, upBias, 0)).add(V((r() - 0.5) * 0.4, 0, (r() - 0.5) * 0.4)).normalize();
      if (t.sp === "pine") E.set(-Math.PI / 2 + (r() - 0.5) * 0.9, r() * 6.283, (r() - 0.5) * 0.6, "YXZ"); else if (t.sp === "cypress" || t.sp === "poplar") E.set((r() - 0.5) * 0.5, r() * 6.283, (r() - 0.5) * 0.4, "YXZ"); else E.set((r() - 0.5) * 1.7, r() * 6.283, (r() - 0.5) * 1.3, "YXZ");
      cards.push({ p, s: cardS * sMul * (0.75 + 0.5 * r()), q: new THREE.Quaternion().setFromEuler(E), n, ao: Math.min(1, Math.max(0, d)), tone: r() }); } }
  return { segs, cards };
};

// ---------------- meshes ----------------
const tube = (s: Seg, radial: number) => { const d = s.b.clone().sub(s.a), len = d.length(); if (len < 1e-4) return null;
  const g = new THREE.CylinderGeometry(s.r1, s.r0, len, radial, 1, true); g.translate(0, len / 2, 0);
  const uv = g.attributes.uv as THREE.BufferAttribute, k = Math.max(1, Math.round((6.283 * s.r0) / 0.35)); for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * k, uv.getY(i) * len / 0.7);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), d.normalize())); g.translate(s.a.x, s.a.y, s.a.z); g.deleteAttribute("normal"); g.computeVertexNormals(); return g; };
const LEAF_TONE: Record<Species, [string, string]> = { olive: ["#8c9870", "#b7bc9a"], cypress: ["#3f5c34", "#55763f"], pine: ["#5c7a40", "#7c9650"], oak: ["#5d8a3e", "#86a552"], plane: ["#6a9446", "#93b35c"], poplar: ["#7aa04c", "#a2bc62"] };
const leafMat = (sp: Species, depth: boolean) => {
  const map = atlas(sp), m = depth ? new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map, alphaTest: 0.45, side: THREE.DoubleSide }) : new THREE.MeshStandardMaterial({ map, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.78 });
  m.onBeforeCompile = (sh) => { sh.uniforms.uT = TREE_T;
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nattribute vec3 aN; attribute vec3 aW; uniform float uT;")
      .replace("#include <uv_vertex>", "#include <uv_vertex>\n#ifdef USE_MAP\nvMapUv = vMapUv * 0.5 + vec2( mod( aW.z, 2.0 ), floor( aW.z / 2.0 ) ) * 0.5;\n#endif")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nfloat wf = sin( uT * 1.7 + aW.y ) * 0.6 + sin( uT * 3.1 + aW.y * 2.3 ) * 0.4; transformed += vec3( wf, 0.3 * wf, -0.5 * wf ) * aW.x;");
    if (!depth) sh.vertexShader = sh.vertexShader.replace("#include <beginnormal_vertex>", "vec3 objectNormal = aN;"); };
  return m; };
export const makeTreesV2 = (parent: THREE.Object3D, specs: TSpec[]) => {
  const bySp = new Map<Species, TSpec[]>(); for (const t of specs) { const l = bySp.get(t.sp); if (l) l.push(t); else bySp.set(t.sp, [t]); }
  const out: THREE.Object3D[] = [];
  for (const [sp, list] of bySp) {
    const geos: THREE.BufferGeometry[] = [], cards: Card[] = [];
    for (const t of list) { const { segs, cards: cs } = grow(t); const radial = (t.lod ?? 0) > 1 ? 5 : 8; for (const s of segs) { const g = tube(s, s.r0 > 0.08 ? radial + 2 : radial); if (g) geos.push(g); } cards.push(...cs); }
    if (geos.length) { const bark = new THREE.Mesh(mergeGeometries(geos), barkMat(sp)); bark.castShadow = true; bark.receiveShadow = true; bark.layers.set(NOINK); parent.add(bark); out.push(bark); geos.forEach((g) => g.dispose()); }
    const geo = new THREE.PlaneGeometry(1, 1), n = cards.length, aN = new Float32Array(n * 3), aW = new Float32Array(n * 3);
    const im = new THREE.InstancedMesh(geo, leafMat(sp, false), n), M = new THREE.Matrix4(), S = V(), col = new THREE.Color(), [c0, c1] = LEAF_TONE[sp], C0 = new THREE.Color(c0), C1 = new THREE.Color(c1);
    cards.forEach((c, i) => { S.set(c.s, c.s, c.s); M.compose(c.p, c.q, S); im.setMatrixAt(i, M); const ln = c.n.clone().applyQuaternion(c.q.clone().invert()); aN.set([ln.x, ln.y, ln.z], i * 3);
      aW.set([0.012 + 0.03 * c.ao, hash(i, 3, 5) * 30, Math.floor(hash(i, 7, 5) * 4)], i * 3);
      col.setRGB(1, 1, 1).lerp(C0.clone().lerp(C1, c.tone), 0.18).multiplyScalar((0.82 + 0.36 * c.tone) * (0.55 + 0.45 * sst(0.1, 1.0, c.ao))); im.setColorAt(i, col); });
    geo.setAttribute("aN", new THREE.InstancedBufferAttribute(aN, 3)); geo.setAttribute("aW", new THREE.InstancedBufferAttribute(aW, 3));
    im.customDepthMaterial = leafMat(sp, true); im.castShadow = true; im.receiveShadow = true; im.computeBoundingSphere(); im.layers.set(NOINK); parent.add(im); out.push(im);
  }
  return out;
};
/** a vine over a pergola: leaf sprays lying across the beams, a few hanging down at the edges */
export const vine = (parent: THREE.Object3D, x0: number, z0: number, x1: number, z1: number, y: number) => {
  const r = mkR(4242), cards: Card[] = [], E = new THREE.Euler();
  const n = Math.round((x1 - x0) * (z1 - z0) * 12);
  for (let i = 0; i < n; i++) { const p = V(x0 + r() * (x1 - x0), y + 0.05 + 0.25 * r(), z0 + r() * (z1 - z0)), edge = Math.min(p.x - x0, x1 - p.x, p.z - z0, z1 - p.z) < 0.5 && r() < 0.5;
    if (edge) { p.y -= 0.3 + 0.5 * r(); E.set((r() - 0.5) * 0.6, r() * 6.283, (r() - 0.5) * 0.4, "YXZ"); } else E.set(-Math.PI / 2 + (r() - 0.5) * 1.0, r() * 6.283, (r() - 0.5) * 0.6, "YXZ");
    cards.push({ p, s: 0.32 + 0.22 * r(), q: new THREE.Quaternion().setFromEuler(E), n: V((r() - 0.5) * 0.3, 1, (r() - 0.5) * 0.3).normalize(), ao: 0.4 + 0.6 * r(), tone: r() }); }
  const geo = new THREE.PlaneGeometry(1, 1), aN = new Float32Array(n * 3), aW = new Float32Array(n * 3), im = new THREE.InstancedMesh(geo, leafMat("plane", false), n), M = new THREE.Matrix4(), S = V(), col = new THREE.Color();
  cards.forEach((c, i) => { S.set(c.s, c.s, c.s); M.compose(c.p, c.q, S); im.setMatrixAt(i, M); const ln = c.n.clone().applyQuaternion(c.q.clone().invert()); aN.set([ln.x, ln.y, ln.z], i * 3); aW.set([0.015, hash(i, 3, 9) * 30, Math.floor(hash(i, 7, 9) * 4)], i * 3); col.setScalar(0.75 + 0.4 * c.tone); im.setColorAt(i, col); });
  geo.setAttribute("aN", new THREE.InstancedBufferAttribute(aN, 3)); geo.setAttribute("aW", new THREE.InstancedBufferAttribute(aW, 3));
  im.customDepthMaterial = leafMat("plane", true); im.castShadow = true; im.receiveShadow = true; im.computeBoundingSphere(); im.layers.set(NOINK); parent.add(im); return im; };
/** low Mediterranean scrub (kermes oak, mastic, broom): leaf sprays heaped into rounded bushes, no wood showing */
export const makeShrubs = (parent: THREE.Object3D, list: { x: number; y: number; z: number; r: number; sp: Species; seed: number }[]) => {
  const bySp = new Map<Species, typeof list>(); for (const s of list) { const l = bySp.get(s.sp); if (l) l.push(s); else bySp.set(s.sp, [s]); }
  for (const [sp, l] of bySp) { const cards: Card[] = [];
    for (const b of l) { const r = mkR(b.seed * 31 + 7), n = Math.max(3, Math.round(4 + b.r * 5)), c = V(b.x, b.y + b.r * 0.55, b.z);
      for (let k = 0; k < n; k++) { const a = r() * 6.283, u = r() * 0.9, p = V(b.x + Math.cos(a) * b.r * u, b.y + b.r * (0.25 + 0.6 * r()), b.z + Math.sin(a) * b.r * u), rel = p.clone().sub(c), E = new THREE.Euler((r() - 0.5) * 1.6, r() * 6.283, (r() - 0.5) * 1.2, "YXZ");
        cards.push({ p, s: b.r * (0.9 + 0.5 * r()), q: new THREE.Quaternion().setFromEuler(E), n: rel.normalize().add(V(0, 0.5, 0)).normalize(), ao: 0.45 + 0.55 * (p.y - b.y) / (b.r * 0.85), tone: r() }); } }
    const geo = new THREE.PlaneGeometry(1, 1), n = cards.length, aN = new Float32Array(n * 3), aW = new Float32Array(n * 3), im = new THREE.InstancedMesh(geo, leafMat(sp, false), n), M = new THREE.Matrix4(), S = V(), col = new THREE.Color();
    cards.forEach((c, i) => { S.set(c.s, c.s, c.s); M.compose(c.p, c.q, S); im.setMatrixAt(i, M); const ln = c.n.clone().applyQuaternion(c.q.clone().invert()); aN.set([ln.x, ln.y, ln.z], i * 3); aW.set([0.008, hash(i, 3, 13) * 30, Math.floor(hash(i, 7, 13) * 4)], i * 3); col.setScalar((0.72 + 0.36 * c.tone) * (0.55 + 0.45 * Math.min(1, c.ao))); im.setColorAt(i, col); });
    geo.setAttribute("aN", new THREE.InstancedBufferAttribute(aN, 3)); geo.setAttribute("aW", new THREE.InstancedBufferAttribute(aW, 3));
    im.customDepthMaterial = leafMat(sp, true); im.castShadow = true; im.receiveShadow = true; im.computeBoundingSphere(); im.layers.set(NOINK); parent.add(im); }
};
