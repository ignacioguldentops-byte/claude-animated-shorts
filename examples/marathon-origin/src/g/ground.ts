// The ground of the film: terrain meshes over H() with five blended surfaces (dry Attic meadow / English turf, earth,
// limestone, sand, and a forest canopy seen from far away), the dirt roads and paths draped over it, dry-stone
// walls, and grass blades that follow the terrain (height map in a texture).
import * as THREE from "three";
import { surf, fbm, vn, hash, earth, turf } from "./pbr";
import { NOINK } from "./ink";
import { Batch, wmat } from "./real";
import { H, sst, fbm2, fromRoad, roadZ, roadDir, GATE_X, CAMP_X, BEACH_X, SEA_X, ACRO, STAD, TAV_X, VILLAGE_X, pathX, ENG } from "./geo";
const clamp = (x: number, a = 0, b = 255) => Math.max(a, Math.min(b, x));
// ---------------- surfaces ----------------
export const dryMeadow = () => surf("dryMeadow", 1024, 3, (u, v, o) => { const g = fbm(u, v, 220, 3, 2), m = fbm(u, v, 6, 4, 6), st = vn(u * 420, v * 120, 512, 9), p = fbm(u, v, 24, 3, 13);
  const gold = [196, 168, 96], green = [128, 132, 66], soil = [150, 120, 84], t = sst(0.35, 0.7, m + 0.3 * (p - 0.5)), bare = sst(0.62, 0.78, p) * 0.6;
  for (let c = 0; c < 3; c++) o[c + 1] = (gold[c] * t + green[c] * (1 - t)) * (1 - bare) + soil[c] * bare;
  const k = 0.78 + 0.45 * (st - 0.5) + 0.3 * (g - 0.5); o[1] *= k; o[2] *= k; o[3] *= k; o[0] = 0.45 + 0.4 * (st - 0.5) + 0.2 * (g - 0.5); o[4] = 0.92; });
export const limestone = () => surf("limestone", 1024, 6, (u, v, o) => { const g = fbm(u, v, 64, 4, 3), m = fbm(u, v, 5, 4, 8), cr = Math.abs(fbm(u, v, 12, 4, 21) - 0.5), crack = 1 - sst(0.0, 0.02, cr), lich = sst(0.6, 0.75, fbm(u, v, 18, 3, 33));
  o[0] = 0.5 + 0.35 * (g - 0.5) + 0.2 * (m - 0.5) - 0.35 * crack; const k = 0.82 + 0.3 * (g - 0.5) + 0.12 * (m - 0.5) - 0.3 * crack;
  o[1] = (172 * (1 - lich) + 130 * lich) * k; o[2] = (164 * (1 - lich) + 132 * lich) * k; o[3] = (150 * (1 - lich) + 100 * lich) * k; o[4] = 0.8; });
export const sand = () => surf("sand", 1024, 2, (u, v, o) => { const g = fbm(u, v, 300, 3, 4), rip = Math.sin((v * 46 + 2.5 * fbm(u, v, 4, 3, 7)) * 6.283) * 0.5 + 0.5, m = fbm(u, v, 6, 3, 9);
  o[0] = 0.4 + 0.25 * rip + 0.2 * (g - 0.5); const k = 0.9 + 0.12 * (g - 0.5) + 0.08 * rip + 0.1 * (m - 0.5); o[1] = 226 * k; o[2] = 204 * k; o[3] = 160 * k; o[4] = 0.95; });
/** a pine forest seen from above: dark round crowns, sunlit tops, gaps of dry ground */
export const canopyOld = () => surf("canopyOld", 1024, 9, (u, v, o) => { let best = 9, best2 = 9, id = 0; const N = 26, cx = Math.floor(u * N), cy = Math.floor(v * N);
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const gx = cx + i, gy = cy + j, wx = ((gx % N) + N) % N, wy = ((gy % N) + N) % N, px = gx + 0.2 + 0.6 * hash(wx, wy, 1), py = gy + 0.2 + 0.6 * hash(wx, wy, 2), d = Math.hypot(u * N - px, v * N - py) / (0.45 + 0.25 * hash(wx, wy, 3)); if (d < best) { best2 = best; best = d; id = hash(wx, wy, 4); } else if (d < best2) best2 = d; }
  const crown = 1 - sst(0.75, 1.05, best), top = Math.max(0, 1 - best) , g = fbm(u, v, 200, 3, 5);
  o[0] = crown * (0.4 + 0.6 * Math.sqrt(top)) + 0.1 * g; const k = 0.55 + 0.55 * top + 0.2 * (g - 0.5), tone = 0.85 + 0.3 * id;
  o[1] = (62 * k * tone) * crown + 118 * (1 - crown); o[2] = (84 * k * tone) * crown + 104 * (1 - crown); o[3] = (44 * k * tone) * crown + 66 * (1 - crown); o[4] = 0.9; });
export const canopy = () => surf("scrub", 1024, 6, (u, v, o) => { const b = fbm(u, v, 22, 4, 3), b2 = fbm(u, v, 60, 3, 7), g = fbm(u, v, 200, 3, 5), m = fbm(u, v, 4, 4, 9);
  const bush = sst(0.38, 0.5, b * 0.75 + b2 * 0.25), top = sst(0.45, 0.72, b * 0.75 + b2 * 0.25), soil = sst(0.55, 0.7, m);
  o[0] = 0.3 + 0.55 * bush * (0.6 + 0.4 * top) + 0.1 * g; const k = 0.75 + 0.35 * top + 0.25 * (g - 0.5);
  const gC = [54, 72, 36], dC = [150 - 30 * soil, 132 - 28 * soil, 92 - 20 * soil];
  o[1] = (gC[0] * k) * bush + dC[0] * (0.85 + 0.2 * g) * (1 - bush); o[2] = (gC[1] * k) * bush + dC[1] * (0.85 + 0.2 * g) * (1 - bush); o[3] = (gC[2] * k) * bush + dC[2] * (0.85 + 0.2 * g) * (1 - bush); o[4] = 0.92; });
export const lushTurf = () => turf("lushTurf", 0, [66, 120, 46], [92, 148, 58]);
// ---------------- terrain material: 5 surfaces mixed by per-vertex weights ----------------
type S5 = { tex: THREE.Texture[]; nrm: THREE.Texture[]; tile: number[] };
const SURF5 = (): S5 => { const s = [dryMeadow(), earth(), limestone(), sand(), canopy(), lushTurf()]; return { tex: s.map((x) => x.map), nrm: s.map((x) => x.normalMap), tile: [5, 4, 6, 4, 14, 4] }; };
export const groundMat = (lush: number) => {
  const S = SURF5(), m = new THREE.MeshStandardMaterial({ roughness: 0.92, metalness: 0 });
  m.onBeforeCompile = (sh) => {
    S.tex.forEach((t, i) => { sh.uniforms[`tA${i}`] = { value: t }; sh.uniforms[`tN${i}`] = { value: S.nrm[i] }; }); sh.uniforms.uLush = { value: lush };
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nattribute vec4 aW; attribute float aF; varying vec4 vW4; varying float vF; varying vec3 vWP; varying vec3 vWN;")
      .replace("#include <fog_vertex>", "#include <fog_vertex>\nvW4 = aW; vF = aF; vWP = ( modelMatrix * vec4( transformed, 1.0 ) ).xyz; vWN = normalize( mat3( modelMatrix ) * objectNormal );");
    const decl = S.tex.map((_t, i) => `uniform sampler2D tA${i}; uniform sampler2D tN${i};`).join("\n");
    sh.fragmentShader = sh.fragmentShader.replace("#include <common>", `#include <common>\n${decl}\nuniform float uLush; varying vec4 vW4; varying float vF; varying vec3 vWP; varying vec3 vWN;
      vec4 tA( int i, vec2 p ) { ${S.tile.map((tl, i) => `if ( i == ${i} ) return texture2D( tA${i}, p / ${tl.toFixed(1)} );`).join(" ")} return vec4( 1.0 ); }
      vec4 tN( int i, vec2 p ) { ${S.tile.map((tl, i) => `if ( i == ${i} ) return texture2D( tN${i}, p / ${tl.toFixed(1)} );`).join(" ")} return vec4( 0.5, 0.5, 1.0, 1.0 ); }`)
      .replace("#include <map_fragment>", `vec2 gp = vWP.xz - floor( cameraPosition.xz / 3000.0 + 0.5 ) * 3000.0; vec2 gp2 = gp * 0.37 + vec2( 0.31, 0.77 );
        float wG = max( 0.0, 1.0 - vW4.x - vW4.y - vW4.z - vF ), wsum = wG + vW4.x + vW4.y + vW4.z + vF + 1e-4;
        vec4 grassC = mix( mix( tA( 0, gp ), tA( 0, gp2 * 3.1 ), 0.35 ), mix( tA( 5, gp ), tA( 5, gp2 * 2.7 ), 0.3 ), uLush );
        vec4 cA = ( grassC * wG + mix( tA( 1, gp ), tA( 1, gp2 * 2.3 ), 0.3 ) * vW4.x + tA( 2, gp ) * vW4.y + tA( 3, gp ) * vW4.z + tA( 4, gp ) * vF ) / wsum;
        vec3 nT = ( mix( tN( 0, gp ), tN( 5, gp ), uLush ).xyz * wG + tN( 1, gp ).xyz * vW4.x + tN( 2, gp ).xyz * vW4.y + tN( 3, gp ).xyz * vW4.z + tN( 4, gp ).xyz * vF ) / wsum;
        diffuseColor.rgb *= cA.rgb;`)
      .replace("#include <normal_fragment_maps>", `{ vec3 tn = nT * 2.0 - 1.0; tn.xy *= 1.3; vec3 Nw = normalize( vWN ); vec3 Tw = normalize( vec3( 1.0, 0.0, 0.0 ) - Nw * Nw.x ); vec3 Bw = cross( Nw, Tw );
        vec3 nw = normalize( Tw * tn.x + Bw * tn.y + Nw * tn.z ); normal = normalize( ( viewMatrix * vec4( nw, 0.0 ) ).xyz ); }`);
  };
  m.customProgramCacheKey = () => "ground5"; return m;
};
// ---------------- terrain meshes ----------------
/** weights: x earth, y rock, z sand; w unused; f forest canopy */
type WFn = (x: number, z: number, h: number, slope: number) => [number, number, number, number];
export const terrain = (x0: number, z0: number, x1: number, z1: number, step: number, Hf: (x: number, z: number) => number, wf: WFn, lush: number, skirt = 0) => {
  const nx = Math.round((x1 - x0) / step) + 1, nz = Math.round((z1 - z0) / step) + 1, pos = new Float32Array(nx * nz * 3), aW = new Float32Array(nx * nz * 4), aF = new Float32Array(nx * nz), idx: number[] = [];
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const x = x0 + i * step, z = z0 + j * step, k = j * nx + i, h = Hf(x, z); pos.set([x, h, z], k * 3); }
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const k = j * nx + i, x = pos[k * 3], z = pos[k * 3 + 2], hl = pos[(j * nx + Math.max(0, i - 1)) * 3 + 1], hr = pos[(j * nx + Math.min(nx - 1, i + 1)) * 3 + 1], hd = pos[(Math.max(0, j - 1) * nx + i) * 3 + 1], hu = pos[(Math.min(nz - 1, j + 1) * nx + i) * 3 + 1];
    const sl = Math.hypot((hr - hl) / (2 * step), (hu - hd) / (2 * step)), w = wf(x, z, pos[k * 3 + 1], sl); aW.set([w[0], w[1], w[2], 0], k * 4); aF[k] = w[3];
    if (skirt && (i === 0 || j === 0 || i === nx - 1 || j === nz - 1)) pos[k * 3 + 1] -= skirt; }
  for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) { const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("aW", new THREE.BufferAttribute(aW, 4)); g.setAttribute("aF", new THREE.BufferAttribute(aF, 1)); g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, groundMat(lush)); m.receiveShadow = true; m.castShadow = false; m.layers.set(NOINK); return m; };
/** how the Greek ground is dressed */
export const greekW: WFn = (x, z, h, sl) => {
  const dr = fromRoad(x, z), n = fbm2(x / 30, z / 30, 3, 41), n2 = fbm2(x / 90, z / 90, 3, 43);
  let earthW = 0.25 * sst(0.55, 0.8, n) + 0.55 * (1 - sst(5, 9, dr)) * (x > GATE_X - 4 && x < CAMP_X + 30 ? 1 : 0) + 0.2 * sst(0.6, 0.8, n2) * (1 - sst(60, 110, dr));
  const city = (1 - sst(GATE_X - 2, GATE_X + 6, x)) * (1 - sst(110, 160, Math.abs(z))) * (1 - sst(60, 90, Math.hypot(x - ACRO[0], (z - ACRO[1]) * 1.6))); earthW = Math.max(earthW, 0.85 * city * (1 - sst(3, 9, h)));
  { const pd = Math.abs(x - pathX(z)); if (z < -10 && z > -260) earthW = Math.max(earthW, 0.85 * (1 - sst(1.0, 2.2, pd))); }
  const rock = Math.min(1, sst(1.0, 1.7, sl) + 0.45 * sst(0.66, 0.78, fbm2(x / 50, z / 50, 3, 51)) * sst(60, 120, dr) + 0.95 * sst(60, 30, Math.hypot(x - ACRO[0], (z - ACRO[1]) * 1.6)) * sst(0.3, 0.6, sl));
  earthW = Math.max(earthW, 0.7 * sst(CAMP_X - 30, CAMP_X - 12, x) * (x < 3000 ? 1 : 0) * (1 - sst(200, 260, Math.abs(z))));
  const sandW = sst(BEACH_X - 8, BEACH_X + 4, x) * (x < 3000 ? 1 : 0) * (1 - sst(0.25, 0.45, sl));
  const forest = Math.min(1, sst(70, 170, dr) * (0.75 + 0.6 * fbm2(x / 70, z / 70, 3, 61)) + 0.8 * sst(0.3, 0.9, fbm2(x / 30, z / 30, 2, 63)) * sst(40, 90, dr)) * (1 - 0.7 * rock) * (1 - sandW) * (x < 3000 ? 1 : 0);
  const far = sst(450, 800, Math.hypot(x - 250, z * 1.4)) * (x < 3000 ? 1 : 0);
  return [Math.min(1, earthW) * (1 - sandW) * (1 - far), Math.min(rock, 1 - 0.6 * far) * (1 - sandW), sandW, Math.max(forest, 0.85 * far)];
};
export const engW: WFn = (x, z, _h, sl) => { const n = fbm2(x / 30, z / 30, 3, 71); return [0.15 * sst(0.6, 0.8, n), sst(0.6, 0.9, sl) * 0.5, 0, 0]; };
// ---------------- roads, paths, walls ----------------
export const dirtRoad = () => surf("dirtRoad", 1024, 5, (u, v, o) => { const g = fbm(u, v, 180, 4, 1), m = fbm(u, v, 6, 4, 3), rut = Math.max(Math.exp(-(((u - 0.3) * 18) ** 2)), Math.exp(-(((u - 0.7) * 18) ** 2))), mid = Math.exp(-(((u - 0.5) * 10) ** 2)) * sst(0.5, 0.7, fbm(u, v, 30, 3, 9));
  const cx = Math.floor(u * 40), cy = Math.floor(v * 40), pr = 0.15 + 0.25 * hash(cx, cy, 4), d = Math.hypot(u * 40 - cx - 0.5, v * 40 - cy - 0.5) / pr, peb = (hash(cx, cy, 5) > 0.85 ? 1 : 0) * Math.sqrt(Math.max(0, 1 - d * d));
  o[0] = 0.45 + 0.25 * (g - 0.5) - 0.3 * rut + 0.4 * peb + 0.15 * mid; const k = 0.85 + 0.25 * (g - 0.5) + 0.1 * (m - 0.5) - 0.12 * rut;
  o[1] = (212 * k) * (1 - peb) + 170 * peb + -40 * mid; o[2] = (180 * k) * (1 - peb) + 162 * peb - 20 * mid; o[3] = (128 * k) * (1 - peb) + 140 * peb - 40 * mid; o[4] = 0.95; });
/** a strip of width w draped over the ground along a centre line (x, z)(t), v measured in metres */
export const strip = (pts: [number, number][], w: number, mat: THREE.Material, Hf: (x: number, z: number) => number, lift = 0.05, across = 6) => {
  const pos: number[] = [], uv: number[] = [], idx: number[] = []; let len = 0;
  pts.forEach(([x, z], i) => { const [xa, za] = pts[Math.max(0, i - 1)], [xb, zb] = pts[Math.min(pts.length - 1, i + 1)], dx = xb - xa, dz = zb - za, l = Math.hypot(dx, dz) || 1, nx = -dz / l, nz = dx / l; if (i) len += Math.hypot(x - pts[i - 1][0], z - pts[i - 1][1]);
    for (let k = 0; k <= across; k++) { const t = k / across - 0.5, px = x + nx * t * w, pz = z + nz * t * w; pos.push(px, Hf(px, pz) + lift, pz); uv.push(k / across, len / w); }
    if (i) { const a = (i - 1) * (across + 1), b = i * (across + 1); for (let k = 0; k < across; k++) idx.push(a + k, b + k, a + k + 1, a + k + 1, b + k, b + k + 1); } });
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat); m.receiveShadow = true; m.layers.set(NOINK); return m; };
export const roadMat = () => { const s = dirtRoad(); const m = new THREE.MeshStandardMaterial({ map: s.map, normalMap: s.normalMap, roughnessMap: s.roughnessMap, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }); return m; };
/** a dry-stone wall from a to b: courses of irregular limestone blocks with a row of capstones */
export const stoneWall = (B: Batch, mat: THREE.Material, a: [number, number], b: [number, number], hgt: number, Hf: (x: number, z: number) => number, seed: number) => {
  const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L, yaw = -Math.atan2(dz, dx); let s = 0, k = 0;
  while (s < L) { const w = 0.35 + 0.4 * hash(k, seed, 1); const cx = a[0] + ux * (s + w / 2), cz = a[1] + uz * (s + w / 2), y0 = Hf(cx, cz) - 0.15; let y = y0, row = 0;
    while (y < y0 + hgt + 0.1) { const hh = 0.18 + 0.14 * hash(k, row, seed), off = (row % 2) * 0.17, ww = w * (0.8 + 0.3 * hash(k, row + 9, seed)), d = 0.5 - 0.06 * row + 0.1 * hash(k, row, seed + 5);
      B.slab(mat, cx + ux * off, y + hh / 2, cz + uz * off, ww, hh, d, [(hash(k, row, 3) - 0.5) * 0.12, yaw + (hash(k, row, 4) - 0.5) * 0.15, (hash(k, row, 5) - 0.5) * 0.12]); y += hh * 0.92; row++; }
    s += w; k++; } };
// ---------------- grass blades over a height map ----------------
export type GrassH = { mesh: THREE.InstancedMesh; follow: (x: number, z: number) => void };
export const heightTex = (x0: number, z0: number, x1: number, z1: number, step: number, Hf: (x: number, z: number) => number) => {
  const nx = Math.round((x1 - x0) / step) + 1, nz = Math.round((z1 - z0) / step) + 1, d = new Float32Array(nx * nz * 4);
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) d[(j * nx + i) * 4] = Hf(x0 + i * step, z0 + j * step);
  const t = new THREE.DataTexture(d, nx, nz, THREE.RGBAFormat, THREE.FloatType); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true;
  return { tex: t, o: new THREE.Vector4(x0, z0, step, 0), n: new THREE.Vector2(nx, nz) }; };
export const makeGrassH = (n: number, R: number, hm: ReturnType<typeof heightTex>, o: { h0: number; h1: number; w: number; base: string[]; tip: string[]; flowers?: number; lean?: number; mask?: string; rough?: number }): GrassH => {
  const seg = 3, pos: number[] = [], col: number[] = [], idx: number[] = [], nor: number[] = [];
  for (let i = 0; i <= seg; i++) { const t = i / seg, w = 0.5 * (1 - t * 0.85), bend = 0.22 * t * t; pos.push(-w, t, bend, w, t, bend); col.push(t, t); nor.push(0, 1, 0.25, 0, 1, 0.25); if (i < seg) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("aT", new THREE.Float32BufferAttribute(col, 1)); g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3)); g.setIndex(idx);
  const cen = { value: new THREE.Vector2() }, rad = { value: R };
  const m = new THREE.MeshStandardMaterial({ roughness: o.rough ?? 0.7, metalness: 0, side: THREE.DoubleSide });
  m.customProgramCacheKey = () => "grassH" + (o.mask ?? "");
  m.onBeforeCompile = (sh) => { sh.uniforms.uCen = cen; sh.uniforms.uRad = rad; sh.uniforms.uHM = { value: hm.tex }; sh.uniforms.uHO = { value: hm.o }; sh.uniforms.uHN = { value: hm.n };
    sh.vertexShader = sh.vertexShader.replace("#include <common>", `#include <common>\nattribute float aT; attribute vec3 aBase; attribute vec3 aTip; uniform vec2 uCen; uniform float uRad; uniform sampler2D uHM; uniform vec4 uHO; uniform vec2 uHN; varying vec3 vGC;
      float hAt( vec2 p ) { vec2 q = ( p - uHO.xy ) / uHO.z; vec2 i = floor( q ), f = q - i; vec2 s = 1.0 / uHN;
        float a = texture2D( uHM, ( i + 0.5 ) * s ).r, b = texture2D( uHM, ( i + vec2( 1.5, 0.5 ) ) * s ).r, c = texture2D( uHM, ( i + vec2( 0.5, 1.5 ) ) * s ).r, d = texture2D( uHM, ( i + 1.5 ) * s ).r;
        return mix( mix( a, b, f.x ), mix( c, d, f.x ), f.y ); }`)
      .replace("#include <begin_vertex>", `#include <begin_vertex>
      { vec3 ip = instanceMatrix[3].xyz; float d = length( ip.xz - uCen ); float k = 1.0 - smoothstep( uRad * 0.55, uRad, d ); vec2 wp = ( modelMatrix * vec4( ip, 1.0 ) ).xz;
        vec2 rel = ( wp - uHO.xy ) / uHO.z; k *= step( 0.0, rel.x ) * step( rel.x, uHN.x - 2.0 ) * step( 0.0, rel.y ) * step( rel.y, uHN.y - 2.0 ); k *= clamp( ${o.mask ?? "1.0"}, 0.0, 1.0 );
        transformed.y *= k; transformed.x *= step( 0.02, k ); transformed.z *= k; vGC = mix( aBase, aTip, aT * aT ) * ( 0.55 + 0.45 * aT ); transformed.y += hAt( wp ) / max( 1e-3, length( instanceMatrix[1].xyz ) ); }`);
    sh.fragmentShader = sh.fragmentShader.replace("#include <common>", "#include <common>\nvarying vec3 vGC;").replace("#include <color_fragment>", "#include <color_fragment>\n diffuseColor.rgb *= vGC;").replace("#include <normal_fragment_maps>", "normal = normalize( vNormal );"); };
  const im = new THREE.InstancedMesh(g, m, n), M = new THREE.Matrix4(), base = new Float32Array(n * 3), tip = new Float32Array(n * 3), cb = new THREE.Color(), ct = new THREE.Color(), P = new THREE.Vector3(), Q = new THREE.Quaternion(), Sc = new THREE.Vector3(), E = new THREE.Euler();
  for (let i = 0; i < n; i++) { const a = hash(i, 1, 1) * Math.PI * 2, r = R * Math.sqrt(hash(i, 2, 1)), h = o.h0 + (o.h1 - o.h0) * hash(i, 3, 1) ** 1.5;
    P.set(r * Math.cos(a), 0, r * Math.sin(a)); Q.setFromEuler(E.set((hash(i, 5, 1) - 0.5) * (o.lean ?? 0.5), hash(i, 4, 1) * Math.PI * 2, (hash(i, 6, 1) - 0.5) * (o.lean ?? 0.5), "YXZ")); Sc.set(o.w * (0.7 + 0.6 * hash(i, 7, 1)), h, h); M.compose(P, Q, Sc); im.setMatrixAt(i, M);
    const fl = o.flowers && hash(i, 9, 1) < o.flowers; cb.set(o.base[Math.floor(hash(i, 8, 1) * o.base.length)]); ct.set(fl ? ["#ffffff", "#ffe066", "#f4a6c8", "#d8b4f0"][Math.floor(hash(i, 10, 1) * 4)] : o.tip[Math.floor(hash(i, 11, 1) * o.tip.length)]);
    cb.convertSRGBToLinear(); ct.convertSRGBToLinear(); base.set([cb.r, cb.g, cb.b], i * 3); tip.set([ct.r, ct.g, ct.b], i * 3); }
  g.setAttribute("aBase", new THREE.InstancedBufferAttribute(base, 3)); g.setAttribute("aTip", new THREE.InstancedBufferAttribute(tip, 3));
  im.castShadow = false; im.receiveShadow = true; im.frustumCulled = false; im.layers.set(NOINK);
  return { mesh: im, follow: (x, z) => { const sx = Math.round(x), sz = Math.round(z); im.position.set(sx, 0, sz); cen.value.set(x - sx, z - sz); } };
};
void clamp; void roadZ; void roadDir; void SEA_X; void STAD; void TAV_X; void VILLAGE_X; void ENG; void wmat;
