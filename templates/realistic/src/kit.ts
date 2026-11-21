// Small building + painting kit shared by world.ts and sets.ts.
import * as THREE from "three";
export const INKC = "#241726";
const mats = new Map<string, THREE.MeshStandardMaterial>();
/** a physically based material, cached by key (the name is kept from the toon kit) */
export const lam = (key: string, make: () => THREE.MeshStandardMaterialParameters) => {
  let m = mats.get(key);
  if (!m) { m = new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0, ...make() }); mats.set(key, m); }
  return m;
};
export const add = (root: THREE.Object3D, geo: THREE.BufferGeometry, mat: THREE.Material, cast = true) => {
  const m = new THREE.Mesh(geo, mat); m.castShadow = cast; m.receiveShadow = true; root.add(m); return m;
};
/** box with UVs in metres / tile (so textures keep their scale) */
export const box = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, tile = 0) => {
  const g = new THREE.BoxGeometry(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0));
  g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  if (tile) {
    const uv = g.getAttribute("uv") as THREE.BufferAttribute, sx = Math.abs(x1 - x0), sy = Math.abs(y1 - y0), sz = Math.abs(z1 - z0);
    const dims: [number, number][] = [[sz, sy], [sz, sy], [sx, sz], [sx, sz], [sx, sy], [sx, sy]];
    for (let f = 0; f < 6; f++) for (let i = 0; i < 4; i++) { const k = f * 4 + i; uv.setXY(k, uv.getX(k) * dims[f][0] / tile, uv.getY(k) * dims[f][1] / tile); }
  }
  return g;
};
export const ground = (x0: number, x1: number, z0: number, z1: number, y = 0, tu = 1, tv = 1) => {
  const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0); g.rotateX(-Math.PI / 2); g.translate((x0 + x1) / 2, y, (z0 + z1) / 2);
  const uv = g.getAttribute("uv") as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * tu, uv.getY(i) * tv);
  return g;
};
/** vertical quad from bottom-left (x0,z0) to bottom-right (x1,z1) as seen from its front, y0..y1; whole texture (x tu, tv) */
export const wall = (x0: number, z0: number, x1: number, z1: number, y0: number, y1: number, tu = 1, tv = 1) => {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute([x0, y0, z0, x1, y0, z1, x1, y1, z1, x0, y1, z0], 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, tu, 0, tu, tv, 0, tv], 2));
  g.setIndex([0, 1, 2, 0, 2, 3]); g.computeVertexNormals();
  return g;
};
/** horizontal quad facing down (ceilings) */
export const ceil = (x0: number, x1: number, z0: number, z1: number, y: number, tu = 1, tv = 1) => {
  const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0); g.rotateX(Math.PI / 2); g.translate((x0 + x1) / 2, y, (z0 + z1) / 2);
  const uv = g.getAttribute("uv") as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * tu, uv.getY(i) * tv);
  return g;
};
export const repT = (t: THREE.Texture) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t; };

// ---------------- canvas painting helpers (ink-outlined flat shapes) ----------------
type G = CanvasRenderingContext2D;
export const rc = (g: G, x: number, y: number, w: number, h: number, fill: string | CanvasGradient | null, ink = 4, r = 0) => {
  g.beginPath(); if (r) g.roundRect(x, y, w, h, r); else g.rect(x, y, w, h);
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (ink) { g.lineWidth = ink; g.strokeStyle = INKC; g.lineJoin = "round"; g.stroke(); }
};
export const el = (g: G, cx: number, cy: number, rx: number, ry: number, fill: string | CanvasGradient | null, ink = 4, a0 = 0, a1 = Math.PI * 2) => {
  g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, a0, a1);
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (ink) { g.lineWidth = ink; g.strokeStyle = INKC; g.stroke(); }
};
export const ln = (g: G, pts: number[][], w: number, col = INKC) => {
  g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.lineWidth = w; g.strokeStyle = col; g.lineCap = "round"; g.lineJoin = "round"; g.stroke();
};
export const pg = (g: G, pts: number[][], fill: string | CanvasGradient | null, ink = 4) => {
  g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath();
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (ink) { g.lineWidth = ink; g.strokeStyle = INKC; g.lineJoin = "round"; g.stroke(); }
};
/** painterly blotches: soft irregular patches of the given colours */
export const mottle = (g: G, r: () => number, x: number, y: number, w: number, h: number, n: number, cols: string[], s0: number, s1: number, a = 0.25) => {
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
  for (let i = 0; i < n; i++) {
    g.globalAlpha = a * (0.4 + 0.6 * r()); g.fillStyle = cols[Math.floor(r() * cols.length)];
    const s = s0 + (s1 - s0) * r(); g.beginPath(); g.ellipse(x + r() * w, y + r() * h, s, s * (0.35 + 0.5 * r()), r() * 3.14, 0, 6.3); g.fill();
  }
  g.restore();
};
export const vgrad = (g: G, y0: number, y1: number, c0: string, c1: string) => { const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, c0); gr.addColorStop(1, c1); return gr; };
