// Building blocks of the realistic world: materials whose textures are laid out in world metres (so thousands of
// instanced boxes share one seamless surface), a batcher for those boxes and cylinders, grass made of blades,
// trees made of leaf cards, and crowds of little flat people drawn with the same painter as the cast.
import * as THREE from "three";
import { Surf, hash } from "./pbr";
import { NOINK } from "./ink";
import { Pen, figure, Char, Pose } from "./toon";

// ---------------- world-space UV materials ----------------
const WM = new Map<string, THREE.MeshStandardMaterial>();
/** PBR material: textures repeat every `tile` metres in world space, whatever the mesh's own UVs */
export const wmat = (key: string, s: Surf | null, tile: number, p: THREE.MeshStandardMaterialParameters = {}) => {
  let m = WM.get(key); if (m) return m;
  m = new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0, ...(s ? { map: s.map, normalMap: s.normalMap, roughnessMap: s.roughnessMap, roughness: 1 } : {}), ...p });
  if (s) { const ws = { value: 1 / tile };
    m.onBeforeCompile = (sh) => { sh.uniforms.uWS = ws;
      sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nuniform float uWS;").replace("#include <fog_vertex>", `#include <fog_vertex>
      { vec4 wP = vec4( transformed, 1.0 ); vec3 wN = objectNormal;
        #ifdef USE_INSTANCING
          wP = instanceMatrix * wP; wN = mat3( instanceMatrix ) * wN;
        #endif
        wP = modelMatrix * wP; wN = normalize( mat3( modelMatrix ) * wN ); wP.xyz -= floor( cameraPosition / 3000.0 + 0.5 ) * 3000.0;
        vec3 aN = abs( wN ); vec2 wuv = ( aN.y > aN.x && aN.y > aN.z ) ? wP.xz : ( aN.x > aN.z ? vec2( wP.z, wP.y ) : wP.xy ); wuv *= uWS;
        #ifdef USE_MAP
          vMapUv = wuv;
        #endif
        #ifdef USE_NORMALMAP
          vNormalMapUv = wuv;
        #endif
        #ifdef USE_ROUGHNESSMAP
          vRoughnessMapUv = wuv;
        #endif
      }`); };
    m.customProgramCacheKey = () => "wuv"; }
  WM.set(key, m); return m;
};
/** plain coloured PBR material */
export const pmat = (c: string, rough = 0.8, metal = 0, p: THREE.MeshStandardMaterialParameters = {}) => wmat(`p${c}|${rough}|${metal}|${JSON.stringify(p)}`, null, 1, { color: c, roughness: rough, metalness: metal, ...p });

// ---------------- instanced boxes and cylinders ----------------
type Inst = { m: THREE.Matrix4; c?: string };
const UBOX = new THREE.BoxGeometry(1, 1, 1), UCYL = new THREE.CylinderGeometry(1, 1, 1, 16), USPH = new THREE.SphereGeometry(1, 14, 10);
const _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _e = new THREE.Euler(), _c = new THREE.Color();
export class Batch {
  private g = new Map<string, { mat: THREE.Material; geo: THREE.BufferGeometry; list: Inst[] }>();
  private put(kind: string, geo: THREE.BufferGeometry, mat: THREE.Material, m: THREE.Matrix4, c?: string) { const e0 = m.elements, det = m.determinant(); if (!(Math.abs(det) > 1e-12) || e0.some((v) => !Number.isFinite(v))) return; /* a box of no thickness would shade as NaN */ const k = kind + mat.uuid; let e = this.g.get(k); if (!e) { e = { mat, geo, list: [] }; this.g.set(k, e); } e.list.push({ m, c }); }
  /** axis-aligned box from corner to corner; rot = Euler XYZ about its centre */
  box(mat: THREE.Material, x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, c?: string, rot?: [number, number, number]) {
    _p.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); _s.set(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0)); _q.setFromEuler(rot ? _e.set(rot[0], rot[1], rot[2]) : _e.set(0, 0, 0));
    this.put("b", UBOX, mat, new THREE.Matrix4().compose(_p, _q, _s), c); return this; }
  /** box given by centre, size and rotation */
  slab(mat: THREE.Material, x: number, y: number, z: number, w: number, h: number, d: number, rot: [number, number, number] = [0, 0, 0], c?: string) {
    _p.set(x, y, z); _s.set(w, h, d); _q.setFromEuler(_e.set(rot[0], rot[1], rot[2], "YXZ")); this.put("b", UBOX, mat, new THREE.Matrix4().compose(_p, _q, _s), c); return this; }
  /** cylinder of radius r and height h centred on (x, y, z); rot = Euler XYZ (z = pi/2 lays it along x, x = pi/2 along z) */
  cyl(mat: THREE.Material, x: number, y: number, z: number, r: number, h: number, c?: string, rot?: [number, number, number], rz = r) {
    _p.set(x, y, z); _s.set(r, h, rz); _q.setFromEuler(rot ? _e.set(rot[0], rot[1], rot[2]) : _e.set(0, 0, 0)); this.put("c", UCYL, mat, new THREE.Matrix4().compose(_p, _q, _s), c); return this; }
  /** rod between two points */
  rod(mat: THREE.Material, a: number[], b: number[], r: number, c?: string) { const d = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), l = d.length(); _q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
    _p.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2); _s.set(r, l, r); this.put("c", UCYL, mat, new THREE.Matrix4().compose(_p, _q, _s), c); return this; }
  sph(mat: THREE.Material, x: number, y: number, z: number, rx: number, ry = rx, rz = rx, c?: string) { _p.set(x, y, z); _s.set(rx, ry, rz); _q.identity(); this.put("s", USPH, mat, new THREE.Matrix4().compose(_p, _q, _s), c); return this; }
  build(parent: THREE.Object3D, cast = true) {
    for (const e of this.g.values()) { const im = new THREE.InstancedMesh(e.geo, e.mat, e.list.length); const col = e.list.some((i) => i.c);
      e.list.forEach((it, i) => { im.setMatrixAt(i, it.m); if (col) im.setColorAt(i, _c.set(it.c ?? "#ffffff")); });
      im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; im.castShadow = cast; im.receiveShadow = true; im.computeBoundingSphere(); im.computeBoundingBox(); parent.add(im); }
    this.g.clear();
  }
}

// ---------------- grass ----------------
export type Grass = { mesh: THREE.InstancedMesh; follow: (x: number, z: number) => void };
/** n blades over a disc of radius R that follows a point (snapped to whole metres so the lawn never swims); blades
 *  shrink to nothing at the rim. h0..h1 blade height, w width at the base, cols = base and tip colours to pick from */
/** mask: GLSL expression of `wp` (world xz of the blade) giving 0..1 (blades shrink to nothing where it is 0) */
export const makeGrass = (n: number, R: number, o: { h0: number; h1: number; w: number; base: string[]; tip: string[]; flowers?: number; stripe?: number; lean?: number; mask?: string; rough?: number }): Grass => {
  const seg = 3, pos: number[] = [], col: number[] = [], idx: number[] = [], nor: number[] = [];
  for (let i = 0; i <= seg; i++) { const t = i / seg, w = 0.5 * (1 - t * 0.85), bend = 0.22 * t * t; pos.push(-w, t, bend, w, t, bend); col.push(t, t, t, t, t, t); nor.push(0, 1, 0.25, 0, 1, 0.25); if (i < seg) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("aT", new THREE.Float32BufferAttribute(col.filter((_v, i) => i % 3 === 0), 1)); g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3)); g.setIndex(idx);
  const cen = { value: new THREE.Vector2() }, rad = { value: R }, stripe = { value: o.stripe ?? 0 };
  const m = new THREE.MeshStandardMaterial({ roughness: o.rough ?? 0.62, metalness: 0, side: THREE.DoubleSide });
  m.customProgramCacheKey = () => "grass" + (o.mask ?? "");
  m.onBeforeCompile = (sh) => { sh.uniforms.uCen = cen; sh.uniforms.uRad = rad; sh.uniforms.uStripe = stripe;
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nattribute float aT; attribute vec3 aBase; attribute vec3 aTip; uniform vec2 uCen; uniform float uRad; uniform float uStripe; varying vec3 vGC;")
      .replace("#include <begin_vertex>", `#include <begin_vertex>
      { vec3 ip = instanceMatrix[3].xyz; float d = length( ip.xz - uCen ); float k = 1.0 - smoothstep( uRad * 0.55, uRad, d ); vec2 wp = ( modelMatrix * vec4( ip, 1.0 ) ).xz; k *= clamp( ${o.mask ?? "1.0"}, 0.0, 1.0 ); transformed.y *= k; transformed.x *= step( 0.02, k ); transformed.z *= k; vGC = mix( aBase, aTip, aT * aT ) * ( 0.55 + 0.45 * aT );
        if ( uStripe > 0.0 ) { float wx = ( modelMatrix * vec4( ip, 1.0 ) ).x - floor( cameraPosition.x / 3000.0 + 0.5 ) * 3000.0; float bd = smoothstep( 0.47, 0.53, abs( fract( wx / uStripe ) - 0.5 ) * 2.0 ); vGC *= mix( 0.8, 1.12, bd ); } }`);
    sh.fragmentShader = sh.fragmentShader.replace("#include <common>", "#include <common>\nvarying vec3 vGC;").replace("#include <color_fragment>", "#include <color_fragment>\n diffuseColor.rgb *= vGC;").replace("#include <normal_fragment_maps>", "normal = normalize( vNormal );"); };
  const im = new THREE.InstancedMesh(g, m, n), M = new THREE.Matrix4(), base = new Float32Array(n * 3), tip = new Float32Array(n * 3), cb = new THREE.Color(), ct = new THREE.Color();
  for (let i = 0; i < n; i++) { const a = hash(i, 1, 1) * Math.PI * 2, r = R * Math.sqrt(hash(i, 2, 1)), x = r * Math.cos(a), z = r * Math.sin(a), h = o.h0 + (o.h1 - o.h0) * hash(i, 3, 1) ** 1.5;
    _p.set(x, 0, z); _q.setFromEuler(_e.set((hash(i, 5, 1) - 0.5) * (o.lean ?? 0.5), hash(i, 4, 1) * Math.PI * 2, (hash(i, 6, 1) - 0.5) * (o.lean ?? 0.5), "YXZ")); _s.set(o.w * (0.7 + 0.6 * hash(i, 7, 1)), h, h); M.compose(_p, _q, _s); im.setMatrixAt(i, M);
    const fl = o.flowers && hash(i, 9, 1) < o.flowers; cb.set(o.base[Math.floor(hash(i, 8, 1) * o.base.length)]); ct.set(fl ? ["#ffffff", "#ffe066", "#f4a6c8", "#ffffff"][Math.floor(hash(i, 10, 1) * 4)] : o.tip[Math.floor(hash(i, 11, 1) * o.tip.length)]);
    cb.convertSRGBToLinear(); ct.convertSRGBToLinear(); base.set([cb.r, cb.g, cb.b], i * 3); tip.set([ct.r, ct.g, ct.b], i * 3); }
  g.setAttribute("aBase", new THREE.InstancedBufferAttribute(base, 3)); g.setAttribute("aTip", new THREE.InstancedBufferAttribute(tip, 3));
  im.castShadow = false; im.receiveShadow = true; im.frustumCulled = false; im.layers.set(NOINK);
  return { mesh: im, follow: (x, z) => { const sx = Math.round(x), sz = Math.round(z); im.position.set(sx, 0, sz); cen.value.set(x - sx, z - sz); } };
};

// ---------------- trees ----------------
let LEAF: THREE.CanvasTexture | null = null;
const leafTex = () => { if (LEAF) return LEAF; const cv = document.createElement("canvas"); cv.width = cv.height = 256; const g = cv.getContext("2d")!;
  for (let i = 0; i < 150; i++) { const a = hash(i, 1, 5) * 6.283, r = 112 * Math.sqrt(hash(i, 2, 5)), x = 128 + r * Math.cos(a), y = 128 + r * Math.sin(a), s = 9 + 9 * hash(i, 3, 5), v = 150 + 105 * hash(i, 4, 5);
    g.fillStyle = `rgb(${v * 0.82},${v},${v * 0.72})`; g.beginPath(); g.ellipse(x, y, s, s * 0.5, hash(i, 5, 5) * 3.14, 0, 6.3); g.fill(); g.strokeStyle = `rgba(0,0,0,0.25)`; g.lineWidth = 1; g.stroke(); }
  LEAF = new THREE.CanvasTexture(cv); LEAF.colorSpace = THREE.SRGBColorSpace; LEAF.anisotropy = 4; return LEAF; };
export type TreeSpec = { x: number; z: number; h: number; k: number; slim?: boolean; y?: number };
/** all the trees of a set: trunks and boughs as cylinders, crowns as clouds of leaf cards */
export const makeTrees = (parent: THREE.Object3D, specs: TreeSpec[], bark: THREE.Material, greens: string[] = ["#4f8a3a", "#5f9e42", "#3f7a36", "#6aa84a", "#7fb04e"]) => {
  const B = new Batch(), cards: { p: THREE.Vector3; s: number; c: string; i: number }[] = [];
  specs.forEach((t, ti) => { const y0 = t.y ?? 0, th = t.h * (t.slim ? 0.3 : 0.45); B.cyl(bark, t.x, y0 + th / 2, t.z, t.h * 0.03, th, undefined, undefined, t.h * 0.03);
    const cy = y0 + t.h * (t.slim ? 0.6 : 0.68), rx = t.h * (t.slim ? 0.13 : 0.33), ry = t.h * (t.slim ? 0.42 : 0.3), n = t.slim ? 70 : 130, col = greens[(t.k + ti) % greens.length];
    if (!t.slim) for (let b = 0; b < 4; b++) { const a = b * 1.57 + ti; B.rod(bark, [t.x, y0 + th * 0.8, t.z], [t.x + rx * 0.6 * Math.cos(a), cy - ry * 0.2, t.z + rx * 0.6 * Math.sin(a)], t.h * 0.012); }
    for (let i = 0; i < n; i++) { const u = hash(i, ti, 21) * 2 - 1, a = hash(i, ti, 22) * 6.283, rr = Math.cbrt(0.35 + 0.65 * hash(i, ti, 23)), sq = Math.sqrt(1 - u * u);
      cards.push({ p: new THREE.Vector3(t.x + rx * rr * sq * Math.cos(a), cy + ry * rr * u, t.z + rx * rr * sq * Math.sin(a)), s: t.h * (t.slim ? 0.2 : 0.26) * (0.7 + 0.6 * hash(i, ti, 24)), c: col, i: i + ti * 131 }); } });
  B.build(parent);
  const geo = new THREE.PlaneGeometry(1, 1), m = new THREE.MeshStandardMaterial({ map: leafTex(), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.75 });
  // shade every card with the normal of the crown it belongs to (pointing up and outwards), not its own flat normal
  m.onBeforeCompile = (sh) => { sh.vertexShader = sh.vertexShader.replace("#include <beginnormal_vertex>", "vec3 objectNormal = normalize( vec3( position.x * 0.6, 0.8, 0.5 ) );"); };
  const im = new THREE.InstancedMesh(geo, m, cards.length), M = new THREE.Matrix4(), cc = new THREE.Color();
  cards.forEach((c, i) => { _q.setFromEuler(_e.set((hash(c.i, 1, 31) - 0.5) * 1.6, hash(c.i, 2, 31) * 6.283, (hash(c.i, 3, 31) - 0.5) * 1.2, "YXZ")); _s.set(c.s, c.s, c.s); M.compose(c.p, _q, _s); im.setMatrixAt(i, M); cc.set(c.c).multiplyScalar(0.75 + 0.5 * hash(c.i, 4, 31)); im.setColorAt(i, cc); });
  im.castShadow = true; im.receiveShadow = true; im.computeBoundingSphere(); im.layers.set(NOINK); parent.add(im); return im;
};

// ---------------- crowds of flat people ----------------
export type Spot = { x: number; y: number; z: number; k: number; ph: number; s?: number };
export type Crowd = { mesh: THREE.InstancedMesh; tick: (f: number, cheer: number) => void };
const CW = 150, CH = 250, COLS = 16;
/** the people of a stand: each spot shows cast member k (two poses each: watching and arms up). They turn to the
 *  camera like every card of the cast, and bob when the crowd cheers. */
export const makeCrowd = (cast: Char[], poses: [Pose, Pose], spots: Spot[], seed = 0): Crowd => {
  const rows = Math.ceil((cast.length * 2) / COLS), cv = document.createElement("canvas"); cv.width = CW * COLS; cv.height = CH * rows; const g = cv.getContext("2d")!;
  cast.forEach((ch, i) => { for (let p = 0; p < 2; p++) { const c = i * 2 + p, cx = (c % COLS) * CW, cy = Math.floor(c / COLS) * CH; g.setTransform(0.25, 0, 0, 0.25, cx, cy); figure(new Pen(g), ch, { ...poses[p], seed: i + seed, light: -2 }); } });
  g.setTransform(1, 0, 0, 1, 0, 0);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4; tex.generateMipmaps = true;
  const geo = new THREE.PlaneGeometry(1.296, 2.16); geo.translate(0, (975 - 500) * 0.00216, 0);
  const n = spots.length, cell = new Float32Array(n * 2), ph = new Float32Array(n);
  const time = { value: 0 }, cheer = { value: 0 };
  const m = new THREE.MeshBasicMaterial({ map: tex, alphaTest: 0.5, side: THREE.DoubleSide });
  m.onBeforeCompile = (sh) => { sh.uniforms.uT = time; sh.uniforms.uCheer = cheer; sh.uniforms.uGrid = { value: new THREE.Vector2(COLS, rows) };
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nattribute vec2 aCell; attribute float aPh; uniform float uT; uniform float uCheer; uniform vec2 uGrid;")
      .replace("#include <uv_vertex>", `#include <uv_vertex>
        float up = step( 0.5, fract( aPh * 7.13 + floor( uT / 9.0 + aPh * 3.0 ) * 0.37 ) ) * step( 0.25, uCheer * ( 0.6 + aPh ) );
        vMapUv = ( vec2( aCell.x + up, aCell.y ) + vec2( uv.x, uv.y ) ) / uGrid; vMapUv.y = 1.0 - ( aCell.y + 1.0 - uv.y ) / uGrid.y;`)
      .replace("#include <project_vertex>", `vec3 ip = instanceMatrix[3].xyz; float sc = length( instanceMatrix[0].xyz ); vec3 wc = ( modelMatrix * vec4( ip, 1.0 ) ).xyz;
        vec2 dir = normalize( cameraPosition.xz - wc.xz ); vec3 rgt = vec3( dir.y, 0.0, -dir.x );
        float bob = uCheer * up * 0.12 * abs( sin( uT * 0.5 + aPh * 40.0 ) ) + 0.012 * sin( uT * 0.11 + aPh * 31.0 );
        vec3 wp = wc + rgt * transformed.x * sc + vec3( 0.0, transformed.y * sc + bob, 0.0 );
        vec4 mvPosition = viewMatrix * vec4( wp, 1.0 ); gl_Position = projectionMatrix * mvPosition;`); };
  const im = new THREE.InstancedMesh(geo, m, n), M = new THREE.Matrix4();
  spots.forEach((s, i) => { _p.set(s.x, s.y, s.z); _q.identity(); const sc = s.s ?? 1; _s.set(sc, sc, sc); M.compose(_p, _q, _s); im.setMatrixAt(i, M); const c = (s.k % cast.length) * 2; cell[i * 2] = c % COLS; cell[i * 2 + 1] = Math.floor(c / COLS); ph[i] = s.ph; });
  geo.setAttribute("aCell", new THREE.InstancedBufferAttribute(cell, 2)); geo.setAttribute("aPh", new THREE.InstancedBufferAttribute(ph, 1));
  im.frustumCulled = false; im.castShadow = false; im.receiveShadow = false; im.layers.set(NOINK);
  return { mesh: im, tick: (f, c) => { time.value = f; cheer.value = c; } };
};

// ---------------- real props: the two footballs and the silver cup ----------------
let OLDB: THREE.MeshStandardMaterial | null = null, NEWB: THREE.MeshStandardMaterial | null = null;
/** the leather ball of 1902: brown panels, stitched seams, a lace */
export const oldBallMat = (leather: Surf) => { if (OLDB) return OLDB; const W = 512, H = 256, cv = document.createElement("canvas"); cv.width = W; cv.height = H; const g = cv.getContext("2d")!;
  g.fillStyle = "#a8683a"; g.fillRect(0, 0, W, H); for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${hash(i, 1, 3) > 0.5 ? "70,36,16" : "214,150,96"},${0.05 + 0.1 * hash(i, 2, 3)})`; g.beginPath(); g.ellipse(hash(i, 3, 3) * W, hash(i, 4, 3) * H, 6 + 22 * hash(i, 5, 3), 4 + 8 * hash(i, 6, 3), hash(i, 7, 3) * 3, 0, 6.3); g.fill(); }
  g.strokeStyle = "#5a3018"; g.lineWidth = 5; for (let k = 0; k < 6; k++) { const x = (k + 0.5) * W / 6; g.beginPath(); g.moveTo(x, 0); for (let y = 0; y <= H; y += 8) g.lineTo(x + 26 * Math.sin((y / H) * Math.PI * 2 + k), y); g.stroke(); }
  g.strokeStyle = "#e8d6a8"; g.lineWidth = 4; for (let k = 0; k < 7; k++) { g.beginPath(); g.moveTo(W * 0.5 - 22, H * 0.36 + k * 11); g.lineTo(W * 0.5 + 22, H * 0.36 + k * 11); g.stroke(); } g.strokeStyle = "#5a3018"; g.lineWidth = 5; g.strokeRect(W * 0.5 - 4, H * 0.33, 8, 86);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; const n = leather.normalMap.clone(); n.repeat.set(6, 3); n.needsUpdate = true;
  OLDB = new THREE.MeshStandardMaterial({ map: t, normalMap: n, roughness: 0.62 }); return OLDB; };
/** today's ball: white with dark pentagons at the twelve vertices of an icosahedron */
export const newBallMat = () => { if (NEWB) return NEWB; const W = 512, H = 256, cv = document.createElement("canvas"); cv.width = W; cv.height = H; const g = cv.getContext("2d")!, img = g.createImageData(W, H), d = img.data, ph = (1 + Math.sqrt(5)) / 2, V: number[][] = [];
  for (const a of [-1, 1]) for (const b of [-ph, ph]) { V.push([0, a, b], [a, b, 0], [b, 0, a]); } const nl = Math.hypot(1, ph);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const th = (y + 0.5) / H * Math.PI, fi = (x + 0.5) / W * Math.PI * 2, dx = Math.sin(th) * Math.cos(fi), dy = Math.cos(th), dz = Math.sin(th) * Math.sin(fi); let best = -1, sec = -1; for (const v of V) { const dt = (dx * v[0] + dy * v[1] + dz * v[2]) / nl; if (dt > best) { sec = best; best = dt; } else if (dt > sec) sec = dt; }
    const i = (y * W + x) * 4, pent = best > 0.93, seam = best - sec < 0.012 && !pent, c = pent ? 30 : seam ? 150 : 246; d[i] = c; d[i + 1] = c; d[i + 2] = pent ? 36 : c; d[i + 3] = 255; }
  g.putImageData(img, 0, 0); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; NEWB = new THREE.MeshStandardMaterial({ map: t, roughness: 0.35 }); return NEWB; };
/** the cup with the big ears, turned on a lathe, with its two handles */
export const makeCup = (silver: THREE.Material) => { const G = new THREE.Group(), pts: THREE.Vector2[] = [];
  for (const [r, y] of [[0.0, 0], [0.19, 0], [0.2, 0.03], [0.17, 0.06], [0.1, 0.1], [0.06, 0.16], [0.045, 0.3], [0.06, 0.4], [0.12, 0.47], [0.2, 0.62], [0.235, 0.82], [0.25, 1.0], [0.255, 1.06], [0.235, 1.06], [0.22, 0.84], [0.18, 0.64], [0.1, 0.5], [0.0, 0.48]]) pts.push(new THREE.Vector2(r, y));
  const body = new THREE.Mesh(new THREE.LatheGeometry(pts, 28), silver); body.castShadow = true; body.receiveShadow = true; G.add(body);
  for (const s of [-1, 1]) { const h = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.028, 8, 22, Math.PI * 1.25), silver); h.scale.set(0.8, 1.15, 1); h.rotation.z = s > 0 ? -Math.PI * 0.62 : Math.PI * 0.62 - Math.PI * 1.25 + Math.PI; h.position.set(s * 0.25, 0.74, 0); if (s < 0) h.rotation.z = Math.PI * 0.37; h.castShadow = true; G.add(h); }
  return G; };

// ---------------- crops in rows (corn) ----------------
let CORN: THREE.CanvasTexture | null = null;
const cornTex = () => { if (CORN) return CORN; const cv = document.createElement("canvas"); cv.width = 256; cv.height = 512; const g = cv.getContext("2d")!;
  g.strokeStyle = "#5f8a34"; g.lineWidth = 9; g.beginPath(); g.moveTo(128, 512); g.lineTo(130, 40); g.stroke();
  for (let i = 0; i < 11; i++) { const y = 470 - i * 40, s = i % 2 ? 1 : -1, l = 100 - i * 4; g.strokeStyle = ["#6a9a3a", "#7aa846", "#5a8a32", "#8ab050"][i % 4]; g.lineWidth = 14 - i * 0.6; g.beginPath(); g.moveTo(129, y); g.quadraticCurveTo(129 + s * l * 0.6, y - 60, 129 + s * l, y + 10 + i * 2); g.stroke(); }
  for (let i = 0; i < 2; i++) { g.fillStyle = "#c9b45a"; g.beginPath(); g.ellipse(140 - i * 22, 250 + i * 50, 12, 38, 0.25 - i * 0.5, 0, 6.3); g.fill(); g.strokeStyle = "#8aa850"; g.lineWidth = 3; g.stroke(); }
  g.strokeStyle = "#d8c070"; g.lineWidth = 4; for (let i = 0; i < 7; i++) { g.beginPath(); g.moveTo(130, 44); g.lineTo(130 + (i - 3) * 14, 4 + Math.abs(i - 3) * 6); g.stroke(); }
  CORN = new THREE.CanvasTexture(cv); CORN.colorSpace = THREE.SRGBColorSpace; CORN.anisotropy = 4; return CORN; };
/** corn plants on a grid (rows `dz` apart, plants `dx` apart) inside a disc of radius R that follows the camera, snapped to
 *  the grid so the rows never swim; mask = GLSL expression of wp (world xz) */
export const makeCorn = (R: number, dx: number, dz: number, h: number, mask: string): Grass => {
  const pts: number[][] = []; for (let x = -R; x <= R; x += dx) for (let z = -R; z <= R; z += dz) if (x * x + z * z < R * R) pts.push([x, z]);
  const g = new THREE.PlaneGeometry(1, 1); g.translate(0, 0.5, 0); const g2 = g.clone().rotateY(Math.PI / 2); const geo = mergeTwo(g, g2);
  const cen = { value: new THREE.Vector2() }, rad = { value: R };
  const m = new THREE.MeshStandardMaterial({ map: cornTex(), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.7 }); m.customProgramCacheKey = () => "corn" + mask;
  m.onBeforeCompile = (sh) => { sh.uniforms.uCen = cen; sh.uniforms.uRad = rad;
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nuniform vec2 uCen; uniform float uRad;").replace("#include <beginnormal_vertex>", "vec3 objectNormal = normalize( vec3( position.x * 0.5, 0.9, 0.4 ) );")
      .replace("#include <begin_vertex>", `#include <begin_vertex>
      { vec3 ip = instanceMatrix[3].xyz; float d = length( ip.xz - uCen ); vec2 wp = ( modelMatrix * vec4( ip, 1.0 ) ).xz; float k = ( 1.0 - smoothstep( uRad * 0.7, uRad, d ) ) * clamp( ${mask}, 0.0, 1.0 ); transformed *= step( 0.05, k ) * ( 0.6 + 0.4 * k ); }`); };
  const im = new THREE.InstancedMesh(geo, m, pts.length), Mx = new THREE.Matrix4();
  pts.forEach(([x, z], i) => { const hh = h * (0.85 + 0.3 * hash(i, 1, 9)); _p.set(x + 0.08 * (hash(i, 2, 9) - 0.5), 0, z + 0.08 * (hash(i, 3, 9) - 0.5)); _q.setFromEuler(_e.set(0, hash(i, 4, 9) * 3, (hash(i, 5, 9) - 0.5) * 0.12)); _s.set(hh * 0.5, hh, hh * 0.5); Mx.compose(_p, _q, _s); im.setMatrixAt(i, Mx); });
  im.castShadow = true; im.receiveShadow = true; im.frustumCulled = false; im.layers.set(NOINK);
  return { mesh: im, follow: (x, z) => { const sx = Math.round(x / dx) * dx, sz = Math.round(z / dz) * dz; im.position.set(sx, 0, sz); cen.value.set(x - sx, z - sz); } };
};
const mergeTwo = (a: THREE.BufferGeometry, b: THREE.BufferGeometry) => { const g = new THREE.BufferGeometry(); for (const k of ["position", "normal", "uv"]) { const A = a.getAttribute(k) as THREE.BufferAttribute, Bb = b.getAttribute(k) as THREE.BufferAttribute; const arr = new Float32Array(A.array.length + Bb.array.length); arr.set(A.array as Float32Array); arr.set(Bb.array as Float32Array, A.array.length); g.setAttribute(k, new THREE.BufferAttribute(arr, A.itemSize)); }
  const ia = Array.from(a.getIndex()!.array), ib = Array.from(b.getIndex()!.array).map((v) => v + (a.getAttribute("position") as THREE.BufferAttribute).count); g.setIndex([...ia, ...ib]); return g; };

// ---------------- solids: what characters and the camera must never pass through ----------------
export type Solid = { x0: number; z0: number; x1: number; z1: number; y0: number; y1: number; name: string };
export const SOLIDS: Solid[] = [];
export const solid = (name: string, x0: number, z0: number, x1: number, z1: number, y1: number, y0 = 0) => { SOLIDS.push({ name, x0: Math.min(x0, x1), x1: Math.max(x0, x1), z0: Math.min(z0, z1), z1: Math.max(z0, z1), y0, y1 }); };
