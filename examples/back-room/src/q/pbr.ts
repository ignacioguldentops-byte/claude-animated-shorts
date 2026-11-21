// Procedural PBR surfaces for the realistic world: every surface is an albedo + normal + roughness set computed from a
// height field (tileable value noise), so stone, plaster, timber, cloth, turf and metal catch the light like the real
// thing. Also the equirectangular skies used both as the backdrop and as the image-based light.
import * as THREE from "three";

// ---------------- tileable noise ----------------
const hash = (x: number, y: number, s: number) => { let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 1442695041)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
/** value noise, period p cells along both axes */
export const vn = (x: number, y: number, p: number, s = 0) => {
  const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  const x0 = ((xi % p) + p) % p, x1 = (x0 + 1) % p, y0 = ((yi % p) + p) % p, y1 = (y0 + 1) % p;
  const a = hash(x0, y0, s), b = hash(x1, y0, s), c = hash(x0, y1, s), d = hash(x1, y1, s);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
};
/** fractal noise 0..1: u, v in 0..1, base period p, o octaves */
export const fbm = (u: number, v: number, p: number, o = 4, s = 0) => { let a = 0, w = 0.5, t = 0; for (let i = 0; i < o; i++) { a += w * vn(u * p, v * p, p, s + i * 17); t += w; w *= 0.5; p *= 2; } return a / t; };
const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const sst = (a: number, b: number, x: number) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const hex = (h: string): [number, number, number] => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const mix3 = (a: number[], b: number[], t: number, o: Float32Array) => { o[1] = a[0] + (b[0] - a[0]) * t; o[2] = a[1] + (b[1] - a[1]) * t; o[3] = a[2] + (b[2] - a[2]) * t; };

export type Surf = { map: THREE.Texture; normalMap: THREE.Texture; roughnessMap: THREE.Texture };
const cache = new Map<string, Surf>();
/** f(u, v, o): o[0] height 0..1, o[1..3] albedo RGB 0..255, o[4] roughness 0..1. bump = normal strength. */
export const surf = (key: string, n: number, bump: number, f: (u: number, v: number, o: Float32Array) => void): Surf => {
  const hit = cache.get(key); if (hit) return hit;
  const H = new Float32Array(n * n), A = new Uint8Array(n * n * 4), R = new Uint8Array(n * n * 4), N = new Uint8Array(n * n * 4), o = new Float32Array(5);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const i = y * n + x; o[0] = 0.5; o[4] = 0.8; f((x + 0.5) / n, (y + 0.5) / n, o); H[i] = o[0];
    A[i * 4] = clamp(o[1], 0, 255); A[i * 4 + 1] = clamp(o[2], 0, 255); A[i * 4 + 2] = clamp(o[3], 0, 255); A[i * 4 + 3] = 255;
    const r = clamp(o[4]) * 255; R[i * 4] = 255; R[i * 4 + 1] = r; R[i * 4 + 2] = 0; R[i * 4 + 3] = 255; }
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const i = y * n + x, xl = y * n + ((x + n - 1) % n), xr = y * n + ((x + 1) % n), yd = ((y + n - 1) % n) * n + x, yu = ((y + 1) % n) * n + x;
    const dx = (H[xl] - H[xr]) * bump * n / 512, dy = (H[yd] - H[yu]) * bump * n / 512, l = 1 / Math.hypot(dx, dy, 1);
    N[i * 4] = (dx * l * 0.5 + 0.5) * 255; N[i * 4 + 1] = (dy * l * 0.5 + 0.5) * 255; N[i * 4 + 2] = (l * 0.5 + 0.5) * 255; N[i * 4 + 3] = 255; }
  const tx = (d: Uint8Array, srgb: boolean) => { const t = new THREE.DataTexture(d as unknown as BufferSource, n, n, THREE.RGBAFormat); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; t.anisotropy = 8; t.needsUpdate = true; return t; };
  const out = { map: tx(A, true), normalMap: tx(N, false), roughnessMap: tx(R, false) };
  cache.set(key, out); return out;
};
/** the same set repeated rx x ry times (clones share the pixel data) */
export const rep = (s: Surf, rx: number, ry: number): Surf => { const c = (t: THREE.Texture) => { const k = t.clone(); k.repeat.set(rx, ry); k.needsUpdate = true; return k; }; return { map: c(s.map), normalMap: c(s.normalMap), roughnessMap: c(s.roughnessMap) }; };

// ---------------- the surfaces ----------------
/** granite setts in running rows, worn smooth on top, damp in the joints (tile = 2 x 2 m: 10 x 16 stones) */
export const setts = () => surf("setts", 1024, 5, (u, v, o) => {
  const rows = 16, row = Math.floor(v * rows), cols = 10, uu = u * cols + (row % 2) * 0.5 + 0.13 * hash(row, 3, 1), col = Math.floor(uu), fx = uu - col, fy = v * rows - row;
  const id = hash(((col % cols) + cols) % cols, row, 7), ex = Math.min(fx, 1 - fx) * 1.6, ey = Math.min(fy, 1 - fy), e = Math.min(ex, ey), top = sst(0.03, 0.2, e), g = fbm(u, v, 64, 3, 5), big = fbm(u, v, 4, 3, 9);
  o[0] = top * (0.62 + 0.25 * id + 0.12 * g) + 0.06 * g;
  const base = [[122, 118, 114], [140, 134, 126], [104, 102, 104], [150, 140, 128], [112, 108, 100]][Math.floor(id * 5) % 5], k = 0.72 + 0.4 * g + 0.2 * (hash(col, row, 11) - 0.5);
  const j = 1 - top; o[1] = base[0] * k * (1 - 0.62 * j); o[2] = base[1] * k * (1 - 0.6 * j); o[3] = base[2] * k * (1 - 0.56 * j);
  const wet = sst(0.52, 0.7, big); o[4] = (0.78 - 0.3 * top * (0.5 + id * 0.5)) * (1 - 0.55 * wet) + 0.1 * j;
});
/** sandstone flags of a pavement (tile 3 x 3 m) */
export const flags = () => surf("flags", 1024, 3.5, (u, v, o) => {
  const rows = 5, row = Math.floor(v * rows), cols = 3, uu = u * cols + (row % 2) * 0.5, col = Math.floor(uu), fx = uu - col, fy = v * rows - row, e = Math.min(Math.min(fx, 1 - fx) * 1.7, Math.min(fy, 1 - fy)), top = sst(0.012, 0.05, e);
  const id = hash(((col % cols) + cols) % cols, row, 3), g = fbm(u, v, 96, 4, 2), st = fbm(u, v, 6, 4, 8);
  o[0] = top * (0.7 + 0.1 * id + 0.14 * g); const k = 0.8 + 0.3 * g - 0.25 * sst(0.55, 0.8, st) + 0.14 * (id - 0.5), j = 1 - top;
  o[1] = 196 * k * (1 - 0.6 * j); o[2] = 186 * k * (1 - 0.6 * j); o[3] = 166 * k * (1 - 0.58 * j); o[4] = 0.82 - 0.12 * top * id;
});
/** lime plaster / stucco: fine grain, damp stains, hairline cracks. Albedo is near white: tint with material.color (tile 4 m) */
export const stucco = () => surf("stucco", 1024, 1.1, (u, v, o) => {
  const g = fbm(u, v, 128, 4, 1), m = fbm(u, v, 5, 5, 4), cr = Math.abs(fbm(u, v, 9, 4, 12) - 0.5), crack = 1 - sst(0.0, 0.006, cr) * 1, streak = fbm(u * 6, v * 0.6, 8, 3, 21);
  o[0] = 0.5 + 0.3 * (g - 0.5) + 0.06 * (m - 0.5) - 0.4 * crack * sst(0.56, 0.66, m);
  const k = 0.92 + 0.1 * g - 0.05 * sst(0.55, 0.85, m) - 0.04 * sst(0.55, 0.9, streak) - 0.12 * crack * sst(0.6, 0.7, m);
  o[1] = 244 * k; o[2] = 240 * k; o[3] = 230 * k; o[4] = 0.92;
});
/** brick in running bond with recessed lime mortar (tile 2 x 2 m: 8 x 24 courses) */
export const brick = (key = "brick", base: number[][] = [[168, 78, 56], [150, 66, 48], [182, 96, 68], [140, 62, 50], [176, 86, 58]]) => surf(key, 1024, 5, (u, v, o) => {
  const rows = 24, row = Math.floor(v * rows), cols = 8, uu = u * cols + (row % 2) * 0.5, col = Math.floor(uu), fx = uu - col, fy = v * rows - row, e = Math.min(Math.min(fx, 1 - fx) * 3, Math.min(fy, 1 - fy)), top = sst(0.06, 0.16, e + 0.05 * (fbm(u, v, 128, 2, 3) - 0.5));
  const id = hash(((col % cols) + cols) % cols, row, 5), g = fbm(u, v, 160, 3, 7), c = base[Math.floor(id * base.length) % base.length], k = 0.82 + 0.3 * g + 0.2 * (hash(col, row, 9) - 0.5), soot = sst(0.5, 0.85, fbm(u, v, 4, 4, 30));
  o[0] = top * (0.7 + 0.2 * g + 0.08 * id); const j = 1 - top;
  o[1] = (c[0] * k * top + 214 * j * (0.8 + 0.2 * g)) * (1 - 0.22 * soot); o[2] = (c[1] * k * top + 204 * j * (0.8 + 0.2 * g)) * (1 - 0.22 * soot); o[3] = (c[2] * k * top + 186 * j * (0.8 + 0.2 * g)) * (1 - 0.2 * soot); o[4] = 0.9 - 0.08 * top;
});
/** clay pan tiles (tile 2 x 2 m: 8 channels x 5 courses): a real barrel profile in the normals */
export const pantile = () => surf("pantile", 1024, 9, (u, v, o) => {
  const cols = 8, fx = (u * cols) % 1, col = Math.floor(u * cols), rows = 5, vv = v * rows + 0.5 * 0, row = Math.floor(vv), fy = vv - row, barrel = Math.sqrt(Math.max(0, 1 - (2 * fx - 1) ** 2)), lap = sst(0.0, 0.06, fy);
  const id = hash(col, row, 4), g = fbm(u, v, 128, 3, 6), lichen = sst(0.62, 0.8, fbm(u, v, 12, 4, 15));
  o[0] = barrel * 0.7 + 0.25 * fy * 0 + 0.3 * (1 - fy) * 0.3 + 0.08 * g - 0.3 * (1 - lap);
  const base = [[196, 96, 58], [180, 82, 50], [208, 112, 66], [170, 78, 52]][Math.floor(id * 4) % 4], k = (0.72 + 0.3 * g + 0.18 * (id - 0.5)) * (0.55 + 0.45 * barrel) * (0.7 + 0.3 * lap);
  o[1] = base[0] * k * (1 - 0.4 * lichen) + 150 * lichen * 0.35; o[2] = base[1] * k * (1 - 0.3 * lichen) + 150 * lichen * 0.35; o[3] = base[2] * k * (1 - 0.4 * lichen) + 110 * lichen * 0.3; o[4] = 0.86;
});
/** slate scales of a mansard (tile 2 x 2 m) */
export const slate = () => surf("slate", 512, 5, (u, v, o) => {
  const rows = 12, row = Math.floor(v * rows), cols = 9, uu = u * cols + (row % 2) * 0.5, col = Math.floor(uu), fx = uu - col, fy = v * rows - row, id = hash(((col % cols) + cols) % cols, row, 2), g = fbm(u, v, 96, 3, 3);
  const edge = Math.min(Math.min(fx, 1 - fx) * 2.4, fy * 1.2); o[0] = sst(0.02, 0.1, edge) * (0.5 + 0.3 * (1 - fy)) + 0.1 * g; const k = 0.75 + 0.3 * g + 0.3 * (id - 0.5);
  o[1] = 92 * k; o[2] = 104 * k; o[3] = 124 * k; o[4] = 0.42 + 0.3 * g;
});
/** timber boards along v with grain and the odd knot. Near-white albedo modulation: tint with material.color.
 *  n boards per tile (tile ~1.2 m wide); gloss = varnish */
export const boards = (key: string, n = 6, gloss = 0.55, gap = 1) => surf(key, 1024, 3, (u, v, o) => {
  const b = Math.floor(u * n), fx = u * n - b, id = hash(b, 1, 3), vv = v + id * 7.3, grain = fbm(u * 3 + id * 5, vv * 0.5, 96, 4, 11 + b), ring = Math.sin((grain * 9 + fx * 2.5 + id * 6) * 6.283), fine = vn(u * 420, vv * 12, 512, 5);
  const kx = hash(b, 2, 8), ky = hash(b, 3, 8), dk = Math.hypot((fx - 0.2 - 0.6 * kx) * 1.0, ((v - ky + 1.5) % 1 - 0.5) * n * 0.9), knot = id > 0.55 ? 1 - sst(0.05, 0.16, dk) : 0, e = Math.min(fx, 1 - fx), top = gap ? sst(0.004, 0.02, e) : 1;
  o[0] = top * (0.7 + 0.05 * ring + 0.06 * fine - 0.12 * knot) ; const k = (0.8 + 0.1 * ring + 0.12 * (fine - 0.5) + 0.22 * (id - 0.5)) * (1 - 0.45 * knot) * (0.35 + 0.65 * top);
  o[1] = 255 * k; o[2] = 250 * k; o[3] = 244 * k; o[4] = gloss + 0.2 * (1 - top) + 0.12 * fine - 0.1 * ring * 0.3;
});
/** woven cloth: warp and weft threads (albedo near white: tint per bolt) */
export const weave = () => surf("weave", 256, 3.5, (u, v, o) => {
  const a = Math.sin(u * 6.283 * 48), b = Math.sin(v * 6.283 * 48), th = 0.5 + 0.25 * a * b + 0.12 * Math.sin(u * 6.283 * 96) * 0.5, g = fbm(u, v, 24, 3, 2);
  o[0] = th; const k = 0.82 + 0.18 * th + 0.1 * (g - 0.5); o[1] = 255 * k; o[2] = 255 * k; o[3] = 255 * k; o[4] = 0.95;
});
/** billiard-cloth felt / carpet pile (near white) */
export const felt = () => surf("felt", 256, 1.4, (u, v, o) => { const g = vn(u * 200, v * 200, 256, 3), m = fbm(u, v, 6, 3, 5); o[0] = g; const k = 0.84 + 0.2 * (g - 0.5) + 0.12 * (m - 0.5); o[1] = 255 * k; o[2] = 255 * k; o[3] = 255 * k; o[4] = 1; });
/** beaten earth: fine grit, pebbles half-buried, dry cracks, darker damp hollows (tile 4 m) */
export const earth = () => surf("earth", 1024, 4, (u, v, o) => {
  const g = fbm(u, v, 160, 4, 1), m = fbm(u, v, 5, 5, 3), cr = Math.abs(fbm(u, v, 14, 4, 20) - 0.5), crack = 1 - sst(0.0, 0.018, cr), cx = Math.floor(u * 36), cy = Math.floor(v * 36), px = hash(cx, cy, 2), py = hash(cx, cy, 3), pr = 0.1 + 0.3 * hash(cx, cy, 4), has = hash(cx, cy, 5) > 0.93 ? 1 : 0;
  const d = Math.hypot(u * 36 - cx - 0.2 - 0.6 * px, v * 36 - cy - 0.2 - 0.6 * py) / pr, peb = has * Math.sqrt(Math.max(0, 1 - d * d));
  o[0] = 0.4 + 0.25 * (g - 0.5) + 0.3 * (m - 0.5) + 0.45 * peb - 0.25 * crack * sst(0.45, 0.6, m);
  const k = 0.8 + 0.3 * (g - 0.5) + 0.3 * (m - 0.5) - 0.25 * crack * sst(0.45, 0.6, m), s = peb > 0 ? 1 : 0, pc = 120 + 50 * hash(cx, cy, 6);
  o[1] = (204 * k) * (1 - s) + pc * s * (0.7 + 0.3 * peb); o[2] = (170 * k) * (1 - s) + pc * 0.97 * s * (0.7 + 0.3 * peb); o[3] = (118 * k) * (1 - s) + pc * 0.9 * s * (0.7 + 0.3 * peb); o[4] = 0.95 - 0.25 * s;
});
/** soil and thatch under the grass blades; stripe = mown bands across u (2 bands per tile) */
export const turf = (key: string, stripe: number, c0 = [58, 120, 44], c1 = [78, 150, 54]) => surf(key, 1024, 3, (u, v, o) => {
  const g = fbm(u, v, 200, 3, 2), m = fbm(u, v, 7, 4, 6), bl = vn(u * 300, v * 90, 512, 9), band = stripe ? sst(0.47, 0.53, Math.abs((u % 1) - 0.5) * 2) : 0.5, t = clamp(band * stripe + (1 - stripe) * 0.5 + 0.35 * (m - 0.5));
  o[0] = 0.4 + 0.4 * (bl - 0.5) + 0.3 * (g - 0.5); mix3(c0, c1, t, o); const k = 0.8 + 0.4 * (g - 0.5) + 0.25 * (bl - 0.5); o[1] *= k; o[2] *= k; o[3] *= k; o[4] = 0.9;
});
/** poured concrete with shutter marks and stains (near white) */
export const concrete = () => surf("concrete", 512, 2, (u, v, o) => { const g = fbm(u, v, 128, 4, 3), m = fbm(u, v, 4, 5, 8), st = fbm(u * 5, v * 0.5, 8, 3, 2), line = sst(0.0, 0.01, Math.abs(((v * 4) % 1) - 0.5) - 0.49); o[0] = 0.5 + 0.3 * (g - 0.5) - 0.3 * line; const k = 0.82 + 0.2 * (g - 0.5) + 0.2 * (m - 0.5) - 0.12 * sst(0.5, 0.9, st) - 0.15 * line; o[1] = 236 * k; o[2] = 236 * k; o[3] = 238 * k; o[4] = 0.85; });
/** hand-tooled leather (near white) */
export const leather = () => surf("leather", 256, 3, (u, v, o) => { const c = Math.abs(fbm(u, v, 40, 3, 4) - 0.5) * 2, g = vn(u * 120, v * 120, 256, 2); o[0] = 0.3 + 0.6 * sst(0.02, 0.2, c) + 0.1 * g; const k = 0.78 + 0.22 * sst(0.0, 0.2, c) + 0.1 * (g - 0.5); o[1] = 255 * k; o[2] = 250 * k; o[3] = 244 * k; o[4] = 0.5 + 0.2 * g; });
/** brushed / galvanised metal micro-scratches (near white, use with metalness 1) */
export const brushed = () => surf("brushed", 256, 1.2, (u, v, o) => { const s = vn(u * 6, v * 300, 512, 3), m = fbm(u, v, 5, 4, 6); o[0] = s; const k = 0.86 + 0.14 * (m - 0.5) * 2 * 0.5 + 0.08 * (s - 0.5); o[1] = 255 * k; o[2] = 255 * k; o[3] = 255 * k; o[4] = 0.28 + 0.25 * m + 0.15 * s; });
/** old paper / parchment (near white) */
export const paperS = () => surf("paper", 256, 1, (u, v, o) => { const g = fbm(u, v, 64, 4, 2), m = fbm(u, v, 3, 4, 7); o[0] = g; const k = 0.9 + 0.12 * (g - 0.5) - 0.1 * sst(0.55, 0.85, m); o[1] = 255 * k; o[2] = 250 * k; o[3] = 236 * k; o[4] = 0.9; });

// ---------------- skies (equirectangular, 2048 x 1024) ----------------
export type SkyK = "day" | "golden" | "night" | "grey" | "room";
const skies = new Map<SkyK, THREE.CanvasTexture>();
export const skyTex = (k: SkyK): THREE.CanvasTexture => {
  let t = skies.get(k); if (t) return t;
  const W = 2048, Hh = 1024, cv = document.createElement("canvas"); cv.width = W; cv.height = Hh; const g = cv.getContext("2d")!, img = g.createImageData(W, Hh), d = img.data;
  const P: Record<SkyK, { top: number[]; mid: number[]; hor: number[]; gnd: number[]; cl: number[]; cs: number[]; cov: number; sun: [number, number]; sc: number[] }> = {
    day: { top: [38, 98, 190], mid: [92, 150, 222], hor: [196, 218, 238], gnd: [150, 150, 140], cl: [255, 255, 255], cs: [176, 190, 214], cov: 0.5, sun: [0.3, 0.72], sc: [255, 246, 226] },
    golden: { top: [72, 92, 150], mid: [226, 150, 110], hor: [255, 206, 140], gnd: [120, 96, 84], cl: [255, 214, 170], cs: [150, 120, 150], cov: 0.5, sun: [0.3, 0.56], sc: [255, 196, 120] },
    night: { top: [4, 8, 26], mid: [10, 18, 50], hor: [26, 40, 92], gnd: [16, 18, 30], cl: [34, 44, 84], cs: [14, 20, 46], cov: 0.42, sun: [0.3, 0.9], sc: [60, 80, 140] },
    grey: { top: [150, 164, 186], mid: [186, 196, 212], hor: [214, 220, 228], gnd: [150, 152, 150], cl: [236, 240, 246], cs: [160, 170, 188], cov: 0.72, sun: [0.3, 0.7], sc: [240, 240, 240] },
    room: { top: [240, 224, 196], mid: [226, 204, 170], hor: [200, 170, 130], gnd: [120, 92, 66], cl: [255, 240, 210], cs: [200, 170, 130], cov: 0, sun: [0.3, 0.8], sc: [255, 230, 190] },
  };
  const p = P[k];
  for (let y = 0; y < Hh; y++) { const el = 1 - (y + 0.5) / Hh * 2; // +1 zenith .. -1 nadir (sin-free: linear in elevation / 90)
    for (let x = 0; x < W; x++) { const u = x / W, i = (y * W + x) * 4; let r: number, gg: number, b: number;
      if (el < 0) { const t = sst(0, -0.25, el); r = p.hor[0] + (p.gnd[0] - p.hor[0]) * t; gg = p.hor[1] + (p.gnd[1] - p.hor[1]) * t; b = p.hor[2] + (p.gnd[2] - p.hor[2]) * t; }
      else { const t1 = sst(0, 0.22, el), t2 = sst(0.15, 0.85, el); r = p.hor[0] + (p.mid[0] - p.hor[0]) * t1 + (p.top[0] - p.mid[0]) * t2; gg = p.hor[1] + (p.mid[1] - p.hor[1]) * t1 + (p.top[1] - p.mid[1]) * t2; b = p.hor[2] + (p.mid[2] - p.hor[2]) * t1 + (p.top[2] - p.mid[2]) * t2;
        // the sun's glow
        const du = Math.min(Math.abs(u - p.sun[0]), 1 - Math.abs(u - p.sun[0])) * 2, dv = (1 - el) - (1 - p.sun[1]), ds = Math.hypot(du * 1.6, dv), gl = Math.exp(-ds * 7) * (k === "night" ? 0.2 : 0.55); r += (p.sc[0] - r) * gl; gg += (p.sc[1] - gg) * gl; b += (p.sc[2] - b) * gl;
        if (p.cov > 0) { // cumulus: fractal cover, lit tops, shaded bases, thinning towards the zenith and stretched at the horizon
          const sy = el * (2.4 - 1.3 * el), n = fbm(u, sy * 0.5, 8, 6, 3), n2 = fbm(u + 0.013, sy * 0.5 + 0.02, 8, 6, 3), c = sst(1 - p.cov, 1 - p.cov + 0.2, n) * sst(0.015, 0.1, el), sh = clamp(0.5 + (n - n2) * 9 + 0.3 * (n - (1 - p.cov)) * 3);
          const cr = p.cs[0] + (p.cl[0] - p.cs[0]) * sh, cg = p.cs[1] + (p.cl[1] - p.cs[1]) * sh, cb = p.cs[2] + (p.cl[2] - p.cs[2]) * sh, hz = 1 - sst(0, 0.14, el) * 0.0 - (1 - sst(0.0, 0.1, el)) * 0.6;
          r += (cr - r) * c * hz; gg += (cg - gg) * c * hz; b += (cb - b) * c * hz; }
        if (k === "night" && hash(x, y, 3) > 0.9993 && el > 0.05) { const s = 120 + 135 * hash(x, y, 4); r = Math.max(r, s); gg = Math.max(gg, s); b = Math.max(b, s); } }
      d[i] = r; d[i + 1] = gg; d[i + 2] = b; d[i + 3] = 255; } }
  g.putImageData(img, 0, 0);
  t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.mapping = THREE.EquirectangularReflectionMapping; t.wrapS = THREE.RepeatWrapping; t.needsUpdate = true; skies.set(k, t); return t;
};
export { hex, clamp, sst, hash };
