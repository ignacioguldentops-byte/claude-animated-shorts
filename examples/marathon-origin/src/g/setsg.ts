// The Greek half of the world: terrain to the horizon, the road, walls, olive groves, cypresses, pines on the hills,
// farmhouses, the taverna (1896), the camp and the bay of Marathon with the Persian ships (490 BC), the village and
// start of 1896, Athens of 490 BC (wall, gate, agora, houses, the Acropolis with its temple) and of 1896 (the marble
// stadium, the ruined Parthenon). Things that belong to one era sit in refs.eraA (490 BC) or refs.eraB (1896).
import * as THREE from "three";
import { Batch, wmat, pmat, makeCrowd, Spot, Crowd, makeCup, solid, solidTag } from "./real";
import { surf, fbm, hash, stucco, pantile, boards } from "./pbr";
import { NOINK } from "./ink";
import { makeTreesV2, TSpec, TREE_T, vine, makeShrubs, Species } from "./trees";
import { terrain, greekW, strip, roadMat, stoneWall, limestone, heightTex, makeGrassH, GrassH } from "./ground";
import { H, roadZ, roadDir, onRoad, fromRoad, pathX, sst, fbm2, GATE_X, TAV_X, VILLAGE_X, CAMP_X, BEACH_X, SEA_X, ACRO, STAD, ARDET } from "./geo";
import { hoplite, athenian, greek, persian } from "./castg";
import { camAt, TOTAL } from "./story";
/** the camera's whole path: no tree or bush is planted where the lens would pass through its crown */
const CAMP: [number, number, number][] = []; for (let f = 0; f < TOTAL; f++) CAMP.push(camAt(0, f).pos);
const inPath = (x0: number, z0: number, x1: number, z1: number, y0: number, y1: number) => CAMP.some(([x, y, z]) => x > x0 && x < x1 && z > z0 && z < z1 && y > y0 && y < y1);
import { Char } from "./toon";
export type GRefs = { eraA: THREE.Group; eraB: THREE.Group; greece: THREE.Group; ships: { g: THREE.Group; x0: number; z0: number; v: number; oars: THREE.InstancedMesh; n: number; yaw: number }[]; sea: THREE.MeshStandardMaterial | null;
  grass: GrassH[]; crowds: { c: Crowd; era: "A" | "B" }[]; flags: THREE.Mesh[]; smoke: [number, number, number][]; cup: THREE.Group | null; tiles: { g: THREE.Group; x: number; z: number }[] };
export const newGRefs = (): GRefs => ({ eraA: new THREE.Group(), eraB: new THREE.Group(), greece: new THREE.Group(), ships: [], sea: null, grass: [], crowds: [], flags: [], smoke: [], cup: null, tiles: [] });
const R = (i: number, j: number, s = 0) => hash(i, j, 777 + s);
// ---------------- materials ----------------
export const marbleS = () => surf("marble", 1024, 1.2, (u, v, o) => { const g = fbm(u, v, 64, 4, 3), vein = Math.abs(fbm(u * 0.7 + v * 0.3, v, 6, 5, 11) - 0.5), vn2 = 1 - sst(0.0, 0.03, vein), m = fbm(u, v, 4, 4, 8);
  o[0] = 0.5 + 0.15 * (g - 0.5) - 0.2 * vn2; const k = 0.93 + 0.08 * (g - 0.5) + 0.06 * (m - 0.5) - 0.12 * vn2; o[1] = 240 * k; o[2] = 234 * k; o[3] = 222 * k; o[4] = 0.55; });
const M = () => ({ wash: wmat("whitewash", stucco(), 2.2, { color: "#fbf7ee" }), ochre: wmat("ochreWash", stucco(), 2.2, { color: "#ecd6aa" }), roof: wmat("pantileG", pantile(), 1.6), stone: wmat("limeBlk", limestone(), 1.6),
  marble: wmat("marbleW", marbleS(), 2.4), wood: wmat("boardsG", boards("boardsG", 6, 0.6), 1.4, { color: "#9a7650" }), dark: pmat("#3a2c22", 0.8), blue: pmat("#2f6fa8", 0.6), green: pmat("#3f6a4a", 0.6),
  bronze: pmat("#b8863a", 0.32, 0.85), leather: pmat("#8a5a34", 0.75), cloth: pmat("#e8dcc0", 0.9), red: pmat("#a8322a", 0.85), iron: pmat("#3a3a40", 0.5, 0.6), painted: pmat("#c8482e", 0.7), paintedB: pmat("#2f5f8a", 0.7) });
// a unit gable prism: base 1 x 1 at y = 0, ridge along x at y = 1
const PRISM = (() => { const g = new THREE.BufferGeometry(), p = [-0.5, 0, -0.5, 0.5, 0, -0.5, 0.5, 1, 0, -0.5, 1, 0, -0.5, 0, 0.5, 0.5, 0, 0.5]; const idx = [0, 3, 2, 0, 2, 1, 4, 5, 2, 4, 2, 3, 0, 4, 3, 1, 2, 5];
  const pos: number[] = [], nor: number[] = []; for (let t = 0; t < idx.length; t += 3) { const a = new THREE.Vector3(...p.slice(idx[t] * 3, idx[t] * 3 + 3)), b = new THREE.Vector3(...p.slice(idx[t + 1] * 3, idx[t + 1] * 3 + 3)), c = new THREE.Vector3(...p.slice(idx[t + 2] * 3, idx[t + 2] * 3 + 3)), n = b.clone().sub(a).cross(c.clone().sub(a)).normalize(); for (const v of [a, b, c]) { pos.push(v.x, v.y, v.z); nor.push(n.x, n.y, n.z); } }
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(pos.map((_v, i) => (i % 3 === 1 ? 0 : 0)).slice(0, (pos.length / 3) * 2), 2)); return g; })();
export const prism = (B: Batch, mat: THREE.Material, x: number, y: number, z: number, w: number, h: number, d: number, yaw = 0) => {
  const m = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, 0)), new THREE.Vector3(w, h, d)); B.put("prism", PRISM, mat, m); };
type Mats = ReturnType<typeof M>;
/** a whitewashed farmhouse with a tiled gable roof, a door, shuttered windows and a chimney */
export const house = (B: Batch, m: Mats, x: number, z: number, w: number, d: number, h: number, yaw: number, k: number, ochre = false) => {
  const y = H(x, z) - 0.4, c = Math.cos(yaw), s = Math.sin(yaw), P = (lx: number, lz: number) => [x + lx * c + lz * s, z - lx * s + lz * c] as [number, number];
  B.slab(ochre ? m.ochre : m.wash, x, y + (h + 0.4) / 2, z, w, h + 0.4, d, [0, yaw, 0]);
  prism(B, m.roof, x, y + h + 0.4, z, w + 0.6, 0.38 * d, d + 0.6, yaw);
  { const [dx, dz] = P(-w * 0.15, d / 2 + 0.03); B.slab(m.wood, dx, y + 0.4 + 1.0, dz, 1.0, 2.0, 0.12, [0, yaw, 0]); }
  for (const fx of [0.22, -0.4]) for (const sd of [1, -1]) { const [wx, wz] = P(fx * w, sd * (d / 2 + 0.04)); B.slab(k % 3 ? m.blue : m.green, wx, y + 0.4 + 1.65, wz, 0.9, 1.0, 0.1, [0, yaw, 0]); B.slab(m.dark, wx, y + 0.4 + 1.65, wz, 0.55, 0.7, 0.14, [0, yaw, 0]); }
  if (k % 2) { const [cx, cz] = P(w * 0.3, 0); B.slab(m.wash, cx, y + h + 0.9, cz, 0.6, 1.6, 0.6, [0, yaw, 0]); }
  solid("house", x - Math.max(w, d) / 2 - 0.3, z - Math.max(w, d) / 2 - 0.3, x + Math.max(w, d) / 2 + 0.3, z + Math.max(w, d) / 2 + 0.3, y + h + 0.4 + 0.38 * d);
};
/** a Doric temple on three steps; ruin = the Parthenon of 1896 (no roof, gaps in the colonnades, a broken pediment) */
const temple = (B: Batch, m: Mats, x: number, y: number, z: number, cols: [number, number], ruin: boolean) => {
  const sp = 2.6, W = (cols[0] - 1) * sp, D = (cols[1] - 1) * sp, ch = 7.6, rr = 0.62, mat = m.marble;
  for (let s = 0; s < 3; s++) B.box(mat, x - W / 2 - 2.4 + s * 0.5, y + s * 0.42, z - D / 2 - 2.4 + s * 0.5, x + W / 2 + 2.4 - s * 0.5, y + (s + 1) * 0.42, z + D / 2 + 2.4 - s * 0.5);
  const y0 = y + 1.26; let n = 0;
  const col = (cx: number, cz: number, hh: number) => { B.cyl(mat, cx, y0 + hh / 2, cz, rr, hh, undefined, undefined, rr); if (hh > ch - 0.1) { B.cyl(mat, cx, y0 + hh + 0.16, cz, rr * 1.35, 0.32); B.box(mat, cx - rr * 1.5, y0 + hh + 0.32, cz - rr * 1.5, cx + rr * 1.5, y0 + hh + 0.62, cz + rr * 1.5); } };
  for (let i = 0; i < cols[0]; i++) for (let j = 0; j < cols[1]; j++) { if (i > 0 && i < cols[0] - 1 && j > 0 && j < cols[1] - 1) continue; n++; const cx = x - W / 2 + i * sp, cz = z - D / 2 + j * sp;
    if (ruin && (j > 2 && j < cols[1] - 3) && (i === 0 ? R(i, j) < 0.55 : R(i, j, 2) < 0.6)) { if (R(i, j, 3) < 0.5) col(cx, cz, 1 + 3 * R(i, j, 4)); continue; } col(cx, cz, ch); }
  const ty = y0 + ch + 0.62; const span = (a: number, b: number) => { B.box(mat, x - W / 2 - 1, ty, a, x + W / 2 + 1, ty + 1.3, b); B.box(m.painted, x - W / 2 - 1, ty + 1.3, a, x + W / 2 + 1, ty + 1.9, b); };
  if (!ruin) { span(z - D / 2 - 1, z + D / 2 + 1); for (let i = 0; i < 2 * cols[0]; i++) B.box(m.paintedB, x - W / 2 - 0.8 + i * (W + 1.6) / (2 * cols[0]), ty + 1.35, z - D / 2 - 1.05, x - W / 2 - 0.5 + i * (W + 1.6) / (2 * cols[0]), ty + 1.85, z + D / 2 + 1.05);
    prism(B, m.roof, x, ty + 1.9, z, W + 2.6, 3.0, D + 2.4, Math.PI / 2); B.box(m.dark, x - W / 2 + 2, y0, z - D / 2 + 3, x + W / 2 - 2, y0 + ch, z + D / 2 - 3); }
  else { span(z - D / 2 - 1, z - D / 2 + 1.4); span(z + D / 2 - 1.4, z + D / 2 + 1); B.box(mat, x - W / 2 - 1, ty, z - D / 2 - 1, x - W / 2 + 1.4, ty + 1.3, z + D / 2 + 1); B.box(mat, x + W / 2 - 1.4, ty, z - D / 2 + 6, x + W / 2 + 1, ty + 1.3, z + D / 2 + 1);
    prism(B, mat, x, ty + 1.9, z - D / 2 - 0.2, W * 0.7, 2.4, 1.6, Math.PI / 2); }
  void n;
};
/** trireme: a long black hull with a ram and a painted eye, a striped sail, two banks of oars (animated) */
const trireme = (parent: THREE.Object3D, m: Mats, k: number) => {
  const g = new THREE.Group(), B = new Batch(), hull = pmat("#2a2420", 0.6), stripe = [m.painted, m.paintedB, pmat("#d8a03a", 0.6)][k % 3];
  B.box(hull, -15, -0.6, -2.2, 15, 1.4, 2.2).box(stripe, -15.05, 0.9, -2.25, 15.05, 1.25, 2.25);
  prism(B, hull, 15.9, -0.6, 0, 3.2, 2.0, 4.4, 0); B.box(m.bronze, 16.5, -0.5, -0.25, 19.0, -0.1, 0.25); B.slab(hull, -16.2, 1.6, 0, 3, 0.5, 3.6, [0, 0, 0.5]);
  B.cyl(pmat("#f4efe6", 0.5), 15.4, 0.7, 2.05, 0.38, 0.06, undefined, [Math.PI / 2, 0, 0]).cyl(pmat("#f4efe6", 0.5), 15.4, 0.7, -2.05, 0.38, 0.06, undefined, [Math.PI / 2, 0, 0]);
  B.cyl(m.wood, 0, 7, 0, 0.18, 12); B.cyl(m.wood, 0, 11.5, 0, 0.12, 9.5, undefined, [Math.PI / 2, 0, 0]);
  B.build(g);
  const cv = document.createElement("canvas"); cv.width = 256; cv.height = 256; const c2 = cv.getContext("2d")!; for (let i = 0; i < 8; i++) { c2.fillStyle = i % 2 ? ["#b8452e", "#2f4f7a", "#c9973f"][k % 3] : "#efe4cc"; c2.fillRect(i * 32, 0, 32, 256); }
  const st = new THREE.CanvasTexture(cv); st.colorSpace = THREE.SRGBColorSpace;
  const sail = new THREE.Mesh(new THREE.PlaneGeometry(9, 6.5, 8, 6), new THREE.MeshStandardMaterial({ map: st, side: THREE.DoubleSide, roughness: 0.9 })); sail.position.set(0.3, 8.2, 0); sail.rotation.y = Math.PI / 2;
  { const p = sail.geometry.attributes.position as THREE.BufferAttribute; for (let i = 0; i < p.count; i++) p.setZ(i, 0.9 * (1 - (p.getX(i) / 4.5) ** 2)); sail.geometry.computeVertexNormals(); }
  sail.castShadow = true; g.add(sail);
  const n = 50, oars = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.06, 0.06, 1, 5), m.wood, n); oars.castShadow = true; g.add(oars);
  g.traverse((o) => o.layers.set(NOINK)); parent.add(g); return { g, oars, n };
};
const flagTex = (kind: "gr" | "red") => { const cv = document.createElement("canvas"); cv.width = 270; cv.height = 180; const c = cv.getContext("2d")!;
  if (kind === "gr") { for (let i = 0; i < 9; i++) { c.fillStyle = i % 2 ? "#f8f8f4" : "#2a5fb0"; c.fillRect(0, i * 20, 270, 20); } c.fillStyle = "#2a5fb0"; c.fillRect(0, 0, 100, 100); c.fillStyle = "#f8f8f4"; c.fillRect(40, 0, 20, 100); c.fillRect(0, 40, 100, 20); }
  else { c.fillStyle = "#b8262e"; c.fillRect(0, 0, 270, 180); c.fillStyle = "#e8c45a"; c.fillRect(0, 75, 270, 30); }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t; };
export const flag = (parent: THREE.Object3D, refs: { flags: THREE.Mesh[] }, x: number, y: number, z: number, kind: "gr" | "red", s = 1, yaw = 0) => {
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05 * s, 0.06 * s, 6 * s, 8), pmat("#e9e4d8", 0.5)); pole.position.set(x, y + 3 * s, z); pole.castShadow = true; parent.add(pole);
  const mat = new THREE.MeshStandardMaterial({ map: flagTex(kind), side: THREE.DoubleSide, roughness: 0.85 }); const ph = { value: x * 0.37 + z };
  mat.onBeforeCompile = (sh) => { sh.uniforms.uT = TREE_T; sh.uniforms.uPh = ph; sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nuniform float uT; uniform float uPh;").replace("#include <begin_vertex>", "#include <begin_vertex>\nfloat fu = position.x / 1.5 + 0.5; transformed.z += fu * 0.28 * sin( uT * 6.0 - fu * 5.0 + uPh ); transformed.y -= fu * fu * 0.12;"); };
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(1.5 * s, 1.0 * s, 12, 4), mat); fl.position.set(x + 0.75 * s * Math.cos(yaw), y + 5.4 * s, z - 0.75 * s * Math.sin(yaw)); fl.rotation.y = yaw; fl.castShadow = true; parent.add(fl); refs.flags.push(fl);
  pole.layers.set(NOINK); fl.layers.set(NOINK); };
// ---------------- the whole of Greece ----------------
export const buildGreece = (root: THREE.Object3D, refs: GRefs) => {
  const G = refs.greece, A = refs.eraA, Bn = refs.eraB; root.add(G); G.add(A, Bn); const m = M();
  // terrain: a fine mesh over the valley and a coarse one to the horizon (sunk under the fine one)
  G.add(terrain(-430, -400, 930, 400, 2.5, H, greekW, 0, 2.5));
  G.add(terrain(-3400, -3400, 3800, 3400, 50, (x, z) => (x > -425 && x < 925 && z > -395 && z < 395 ? H(x, z) - 6 : H(x, z)), greekW, 0));
  // the sea of Marathon, and surf on the beach
  { const ws = surf("waves", 512, 3, (u, v, o) => { o[0] = 0.5 + 0.5 * (fbm(u, v, 8, 4, 3) - 0.5) + 0.3 * Math.sin((v * 12 + 2 * fbm(u, v, 3, 3, 5)) * 6.283) * 0.3; o[1] = 40; o[2] = 104; o[3] = 130; o[4] = 0.08; });
    const sm = new THREE.MeshStandardMaterial({ color: "#1d5874", roughness: 0.2, metalness: 0.0, normalMap: ws.normalMap, normalScale: new THREE.Vector2(1.5, 1.5), envMapIntensity: 0.75 });
    ws.normalMap.repeat.set(700, 700); refs.sea = sm; const sea = new THREE.Mesh(new THREE.PlaneGeometry(4400, 4400), sm); sea.rotation.x = -Math.PI / 2; sea.position.set(BEACH_X + 2200 - 20, -0.15, 0); sea.receiveShadow = true; sea.layers.set(NOINK); G.add(sea);
    const foam = new THREE.Mesh(new THREE.PlaneGeometry(10, 900, 1, 1), new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.35, depthWrite: false })); foam.rotation.x = -Math.PI / 2; foam.position.set(BEACH_X + 15, -0.05, 0); foam.layers.set(NOINK); G.add(foam); }
  // road, the Sparta path, the paths to the camp
  { const pts: [number, number][] = []; for (let x = GATE_X - 30; x <= CAMP_X + 28; x += 1.5) pts.push([x, roadZ(x)]); G.add(strip(pts, 6.4, roadMat(), H, 0.05, 8));
    const pp: [number, number][] = []; for (let z = -8; z >= -280; z -= 1.5) pp.push([pathX(z), z]); G.add(strip(pp, 2.4, roadMat(), H, 0.05, 4)); }
  const B = new Batch(), BA = new Batch(), BB = new Batch();
  // dry-stone walls along the road (gaps at the gate, the taverna, the village and the camp), and field terraces
  for (const sd of [-1, 1]) { let x = GATE_X + 6; while (x < CAMP_X - 6) { const L = 20 + 30 * R(Math.round(x), sd), x1 = Math.min(CAMP_X - 6, x + L); const gapT = Math.abs(x - TAV_X) < 16 || Math.abs(x1 - TAV_X) < 16, gapV = Math.abs(x - VILLAGE_X) < 26 || Math.abs(x1 - VILLAGE_X) < 26;
      if (!gapT && !gapV) { for (let xx = x; xx < x1; xx += 4) { const a = onRoad(xx, sd * 4.9), b = onRoad(Math.min(x1, xx + 4), sd * 4.9); stoneWall(B, m.stone, [a[0], a[2]], [b[0], b[2]], 0.85 + 0.2 * R(Math.round(xx), 3), H, Math.round(xx) + sd * 999); } }
      x = x1 + 3 + 4 * R(Math.round(x), sd + 5); } }
  for (let i = 0; i < 34; i++) { const x = GATE_X + 30 + R(i, 1) * (CAMP_X - GATE_X - 60), sd = R(i, 2) < 0.5 ? -1 : 1, off = sd * (24 + 70 * R(i, 3)), a = onRoad(x, off), L = 20 + 40 * R(i, 4), b = onRoad(x + L, off + sd * 4 * (R(i, 5) - 0.5));
    if (Math.abs(x - TAV_X) < 30 || Math.abs(x - VILLAGE_X) < 40) continue; for (let t = 0; t < L; t += 4) { const p = onRoad(x + t, off + (b[2] - a[2]) * 0), q = onRoad(Math.min(x + L, x + t + 4), off); stoneWall(B, m.stone, [p[0], p[2]], [q[0], q[2]], 0.7, H, i * 100 + t); } }
  // farmhouses scattered along the valley; the village of Marathon; the houses of Athens (both eras)
  const houses: [number, number][] = [];
  for (let i = 0; i < 30; i++) { const x = GATE_X + 50 + R(i, 11) * (CAMP_X - GATE_X - 80), sd = R(i, 12) < 0.5 ? -1 : 1, off = sd * (16 + 60 * R(i, 13)); if (Math.abs(x - TAV_X) < 22) continue; const p = onRoad(x, off), [dx, dz] = roadDir(x);
    house(B, m, p[0], p[2], 6 + 4 * R(i, 14), 5 + 3 * R(i, 15), 3 + 1.5 * R(i, 16), -Math.atan2(dz, dx) + (R(i, 17) < 0.5 ? 0 : Math.PI / 2), i, R(i, 18) < 0.25); houses.push([p[0], p[2]]); }
  for (let i = 0; i < 12; i++) { const off = (i % 2 ? 1 : -1) * (12 + 22 * R(i, 21)), x = VILLAGE_X - 30 + 60 * R(i, 22), p = onRoad(x, off); house(B, m, p[0], p[2], 6 + 3 * R(i, 23), 5 + 2 * R(i, 24), 3 + R(i, 25), R(i, 26) * 3, i + 3, R(i, 27) < 0.3); houses.push([p[0], p[2]]); }
  { // a little Byzantine chapel at the village (1896 and also older: it stays)
    const p = onRoad(VILLAGE_X + 14, -24); B.box(m.wash, p[0] - 3, p[1] - 0.4, p[2] - 4.5, p[0] + 3, p[1] + 4.2, p[2] + 4.5); const dome = new THREE.Mesh(new THREE.SphereGeometry(2.2, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), pmat("#b84a3a", 0.6)); dome.position.set(p[0], p[1] + 5.2, p[2]); dome.castShadow = true; dome.layers.set(NOINK); G.add(dome); B.cyl(m.wash, p[0], p[1] + 4.7, p[2], 2.3, 1.0); }
  // Athens, 490 BC: the city wall with towers across the valley, the gate, the agora with its stoa, houses
  solidTag("A"); { for (let z = -150; z <= 150; z += 4) { if (Math.abs(z) < 5) continue; const x = GATE_X - 3 + 0.02 * z * z / 10, y = H(x, z); BA.box(m.stone, x - 1.4, y - 1, z - 2, x + 1.4, y + 3.2, z + 2); BA.box(m.ochre, x - 1.2, y + 3.2, z - 2, x + 1.2, y + 6.4, z + 2);
      if (z % 8 === 0) BA.box(m.ochre, x - 1.25, y + 6.4, z - 0.6, x + 1.25, y + 7.2, z + 0.6); if (Math.abs(z % 40) < 2) { BA.box(m.stone, x - 3, y - 1, z - 3, x + 3, y + 4, z + 3); BA.box(m.ochre, x - 2.8, y + 4, z - 2.8, x + 2.8, y + 9, z + 2.8); } solid("wall", x - 1.5, z - 2, x + 1.5, z + 2, y + 7); }
    for (const s of [-1, 1]) { const z = s * 9, x = GATE_X - 3; BA.box(m.stone, x - 3.5, -1, z - 4, x + 3.5, 11, z + 4); for (let k = 0; k < 3; k++) for (const sx of [-1, 1]) BA.box(m.stone, x + sx * 3.1 - 0.4, 11, z - 3.6 + k * 3.2, x + sx * 3.1 + 0.4, 12.2, z - 2.4 + k * 3.2); BA.box(m.dark, x + 3.45, 6.5, z - 0.5, x + 3.6, 8.2, z + 0.5); solid("gate tower", x - 3.6, z - 4.1, x + 3.6, z + 4.1, 11); }
    BA.box(m.stone, GATE_X - 3.6, 7.2, -5.4, GATE_X - 2.4, 11, 5.4); BA.box(m.wood, GATE_X - 3.7, 6.8, -5.4, GATE_X - 2.3, 7.3, 5.4);
    // the stoa: a colonnade along the north side of the agora
    for (let i = 0; i < 14; i++) BA.cyl(m.marble, -48 + i * 4.6, 2.9, -22, 0.38, 5.8); BA.box(m.marble, -50, 5.8, -24, 14, 6.8, -20).box(m.ochre, -50, 0, -30, 14, 6.6, -28); prism(BA, m.roof, -18, 6.8, -25, 66, 1.6, 10.5); BA.box(m.marble, -50, -0.4, -30, 14, 0.1, -20); solid("stoa", -50, -30, 14, -21, 7);
    BA.box(m.marble, -20, 0, 8, -16, 1.2, 12); // the altar
    for (let i = 0; i < 60; i++) { const x = -200 + R(i, 31) * 190, z = (R(i, 32) < 0.5 ? -1 : 1) * (38 + R(i, 33) * 110); if (Math.hypot(x - ACRO[0], (z - ACRO[1]) * 1.6) < 95) continue; house(BA, m, x, z, 6 + 5 * R(i, 34), 6 + 4 * R(i, 35), 3 + 2 * R(i, 36), R(i, 37) < 0.5 ? 0 : Math.PI / 2, i + 7, R(i, 38) < 0.5); }
    for (let i = 0; i < 26; i++) { const x = -70 + R(i, 41) * 80, z = (R(i, 42) < 0.5 ? -1 : 1) * (28 + R(i, 43) * 12); if (z < 0 && z > -32) continue; house(BA, m, x, z, 5 + 3 * R(i, 44), 5 + 2 * R(i, 45), 3 + R(i, 46), 0, i + 2, R(i, 47) < 0.6); } }
  solidTag("");
  // the Acropolis: walls along its rim, a temple on top (painted and whole in 490 BC, the Parthenon in ruins in 1896)
  { const top = H(ACRO[0], ACRO[1]); for (let a = 0; a < 6.283; a += 0.08) { const x = ACRO[0] + 46 * Math.cos(a), z = ACRO[1] + 28 * Math.sin(a), y = H(x, z); B.box(m.stone, x - 2, y - 1.5, z - 2, x + 2, y + 3.4, z + 2); }
    temple(BA, m, ACRO[0] + 6, top - 0.3, ACRO[1], [6, 13], false); temple(BB, m, ACRO[0] + 6, top - 0.3, ACRO[1], [8, 17], true); }
  // 1896: the Panathenaic stadium in marble, packed; neoclassical houses round it
  const stadSpots: Spot[] = []; solidTag("B");
  { const R0 = STAD.w / 2, xc = STAD.x0 + R0, z0 = STAD.z, rows = 34, step = 1.4;
    const along = (s: number, off: number): [number, number] => { const Ls = STAD.x1 - xc; if (s < Ls) return [STAD.x1 - s, z0 - (R0 + off)]; const a = (s - Ls) / (R0 + off); if (a < Math.PI) return [xc - (R0 + off) * Math.sin(a), z0 - (R0 + off) * Math.cos(a)]; const s2 = s - Ls - Math.PI * (R0 + off); return [xc + s2, z0 + (R0 + off)]; };
    for (let k = 0; k < rows; k++) { const off = 2.4 + k * 0.82, y = 0.5 + k * 0.46, tot = 2 * (STAD.x1 - xc) + Math.PI * (R0 + off);
      for (let s = 0; s < tot; s += step) { const [x, z] = along(s, off), [x2, z2] = along(Math.min(tot, s + step), off), yaw = -Math.atan2(z2 - z, x2 - x); BB.slab(m.marble, (x + x2) / 2, y - 0.25 - (k ? 0 : 0.3), (z + z2) / 2, step + 0.05, 0.5 + (k ? 0 : 0.6), 0.84, [0, yaw, 0]);
        for (let q = 0; q < 2; q++) { const t = (q + 0.5) / 2, px = x + (x2 - x) * t, pz = z + (z2 - z) * t; stadSpots.push({ x: px + (Math.random() - 0.5) * 0.1, y: y + 0.02, z: pz, k: Math.floor(R(Math.round(s * 10), k, 5) * 12), ph: R(Math.round(s * 7), k, 6) }); } } }
    { const off = 2.4 + rows * 0.82, tot = 2 * (STAD.x1 - xc) + Math.PI * (R0 + off); for (let s = 0; s < tot; s += 2) { const [x, z] = along(s, off), [x2, z2] = along(Math.min(tot, s + 2), off); BB.slab(m.marble, (x + x2) / 2, rows * 0.46 + 0.6, (z + z2) / 2, 2.05, 1.2, 0.7, [0, -Math.atan2(z2 - z, x2 - x), 0]); } }
    for (const s of [-1, 1]) { const z = z0 + s * (R0 + 0.6); for (let x = xc; x < STAD.x1; x += 2) BB.box(m.marble, x, 0, z - 0.3, x + 2, 1.1, z + 0.3); solid("stadium parapet", xc - R0, z - 0.35, STAD.x1, z + 0.35, 1.1); }
    // the entrance: two pylons with flags, a crowd on the hillsides above
    for (const s of [-1, 1]) { BB.box(m.marble, STAD.x1 - 1, 0, z0 + s * (R0 + 1) - 2, STAD.x1 + 3, 9, z0 + s * (R0 + 1) + 2); flag(Bn, refs, STAD.x1 + 1, 9, z0 + s * (R0 + 1), "gr", 1.2); }
    for (let i = 0; i < 40; i++) { const x = -180 + R(i, 51) * 260, z = (R(i, 52) < 0.5 ? -1 : 1) * (70 + R(i, 53) * 90); if (x > -20 && Math.abs(z) < 90) continue; if (Math.hypot(x - ACRO[0], (z - ACRO[1]) * 1.6) < 100) continue; house(BB, m, x, z, 8 + 6 * R(i, 54), 7 + 4 * R(i, 55), 5 + 3 * R(i, 56), R(i, 57) < 0.5 ? 0 : Math.PI / 2, i + 11, R(i, 58) < 0.5); } }
  const stadCast: Char[] = []; for (let i = 0; i < 12; i++) stadCast.push(greek(i)); const crB = makeCrowd(stadCast, [{ expr: "smile" }, { expr: "laugh", armL: "up", armR: "up", holdR: "hatW" }], stadSpots, 3); Bn.add(crB.mesh); refs.crowds.push({ c: crB, era: "B" });
  // the camp of the Greeks at Marathon (490 BC): leather tents, shields on stands, spears, fires; the army on the beach
  const campSpots: Spot[] = []; solidTag("A");
  { for (let i = 0; i < 26; i++) { const x = CAMP_X - 18 + R(i, 61) * 40, z = roadZ(CAMP_X) + (R(i, 62) - 0.5) * 120; if (Math.abs(z - roadZ(CAMP_X)) < 7) continue; const y = H(x, z); prism(BA, m.leather, x, y - 0.1, z, 3.4, 2.2, 3.0, R(i, 63) * 3); solid("tent", x - 1.8, z - 1.8, x + 1.8, z + 1.8, y + 2.2); }
    for (let i = 0; i < 40; i++) { const x = CAMP_X - 10 + R(i, 64) * 30, z = roadZ(CAMP_X) + (R(i, 65) - 0.5) * 100; if (Math.abs(z - roadZ(CAMP_X)) < 6) continue; const y = H(x, z); BA.cyl(m.bronze, x, y + 0.6, z, 0.55, 0.1, undefined, [Math.PI / 2 - 0.25, R(i, 66) * 3, 0]); BA.rod(m.wood, [x + 0.3, y, z], [x + 0.6, y + 3.2, z + 0.2], 0.035); }
    for (let i = 0; i < 4; i++) { const x = CAMP_X + 2 + i * 6, z = roadZ(CAMP_X) + (i % 2 ? 22 : -24), y = H(x, z); for (let a = 0; a < 6.283; a += 0.7) BA.sph(m.stone, x + 0.7 * Math.cos(a), y + 0.1, z + 0.7 * Math.sin(a), 0.25, 0.18, 0.25); refs.smoke.push([x, y + 0.4, z]); }
    for (let blk = 0; blk < 8; blk++) { const zc = roadZ(CAMP_X) + (blk < 4 ? -1 : 1) * (22 + (blk % 4) * 24), xc = BEACH_X - 12 + 6 * R(blk, 75); for (let r = 0; r < 7; r++) for (let c = 0; c < 12; c++) { const x = xc - r * 1.05 + 0.2 * R(r, c, blk), z = zc + (c - 5.5) * 0.95 + 0.2 * R(c, r, blk); campSpots.push({ x, y: H(x, z), z, k: Math.floor(R(r * 12 + c, blk, 73) * 10), ph: R(r * 12 + c, blk, 74) }); } } }
  const campCast: Char[] = []; for (let i = 0; i < 10; i++) campCast.push(i < 8 ? hoplite(i) : athenian(i)); const crA = makeCrowd(campCast, [{ expr: "grin", armR: "up" }, { expr: "laugh", armL: "up", armR: "up" }], campSpots, 5); A.add(crA.mesh); refs.crowds.push({ c: crA, era: "A" });
  // the Persian fleet pulling away across the bay
  for (let k = 0; k < 11; k++) { const s = trireme(A, m, k), x0 = SEA_X + 40 + 30 * (k % 4) + 20 * R(k, 81), z0 = -180 + k * 34 + 10 * R(k, 82), yaw = -0.25 + 0.5 * R(k, 83); s.g.position.set(x0, 0, z0); s.g.rotation.y = yaw; refs.ships.push({ g: s.g, x0, z0, v: 0.05 + 0.03 * R(k, 84), oars: s.oars, n: s.n, yaw }); }
  solidTag("B");
  // the start of 1896 at the village: a table with the silver cup, flags, bunting, a rope across the road
  { const p = onRoad(VILLAGE_X - 4, 5.8); BB.box(m.wood, p[0] - 1.2, p[1], p[2] - 0.5, p[0] + 1.2, p[1] + 0.85, p[2] + 0.5); BB.box(pmat("#f4f0e6", 0.9), p[0] - 1.3, p[1] + 0.85, p[2] - 0.6, p[0] + 1.3, p[1] + 0.9, p[2] + 0.6);
    const cup = makeCup(pmat("#e6ebf0", 0.18, 1.0)); cup.scale.setScalar(0.42); cup.position.set(p[0], p[1] + 0.9, p[2]); cup.traverse((o) => o.layers.set(NOINK)); Bn.add(cup); refs.cup = cup; solid("table", p[0] - 1.3, p[2] - 0.6, p[0] + 1.3, p[2] + 0.6, p[1] + 1.4);
    for (const sd of [-1, 1]) { const q = onRoad(VILLAGE_X, sd * 5.6); flag(Bn, refs, q[0], q[1], q[2], "gr"); }
    const r = onRoad(VILLAGE_X, -4), r2 = onRoad(VILLAGE_X, 4); BB.rod(pmat("#e8dcc0", 0.9), [r[0], r[1] + 0.05, r[2]], [r2[0], r2[1] + 0.05, r2[2]], 0.03); }
  // the taverna of 1896: a whitewashed house with blue shutters, a pergola with a vine, tables, barrels, amphorae
  { const p = onRoad(TAV_X, 11), [dx, dz] = roadDir(TAV_X), yaw = -Math.atan2(dz, dx); house(B, m, p[0], p[2] + 3, 11, 7, 3.6, yaw, 1);
    for (const lx of [-5, -1.5, 2, 5.5]) for (const lz of [-3.6, -6.4]) { const q = onRoad(TAV_X + lx, 11 + lz); BB.cyl(m.wood, q[0], q[1] + 1.25, q[2], 0.08, 2.6); }
    for (const lz of [-3.6, -6.4]) { const a = onRoad(TAV_X - 5.4, 11 + lz), b = onRoad(TAV_X + 5.9, 11 + lz); BB.rod(m.wood, [a[0], a[1] + 2.55, a[2]], [b[0], b[1] + 2.55, b[2]], 0.07); }
    for (const lx of [-5, -2.5, 0, 2.5, 5]) { const a = onRoad(TAV_X + lx, 7.2), b = onRoad(TAV_X + lx, 4.4); BB.rod(m.wood, [a[0], a[1] + 2.62, a[2]], [b[0], b[1] + 2.62, b[2]], 0.05); }
    for (const [lx, lz] of [[-3.5, 5.6], [0.5, 5.4], [3.8, 5.8]]) { const q = onRoad(TAV_X + lx, lz); BB.cyl(m.wood, q[0], q[1] + 0.75, q[2], 0.55, 0.06).cyl(m.wood, q[0], q[1] + 0.37, q[2], 0.06, 0.75); for (const a of [0.8, 2.6, 4.4]) BB.box(m.wood, q[0] + 0.85 * Math.cos(a) - 0.2, q[1], q[2] + 0.85 * Math.sin(a) - 0.2, q[0] + 0.85 * Math.cos(a) + 0.2, q[1] + 0.45, q[2] + 0.85 * Math.sin(a) + 0.2); solid("taverna table", q[0] - 0.6, q[2] - 0.6, q[0] + 0.6, q[2] + 0.6, q[1] + 0.8); }
    for (let i = 0; i < 4; i++) { const q = onRoad(TAV_X - 6.5 + i * 0.9, 7.6); BB.cyl(m.wood, q[0], q[1] + 0.45, q[2], 0.36, 0.9).cyl(m.iron, q[0], q[1] + 0.2, q[2], 0.37, 0.05).cyl(m.iron, q[0], q[1] + 0.7, q[2], 0.37, 0.05); }
    { const a = onRoad(TAV_X - 5.6, 3.4), b = onRoad(TAV_X + 6.1, 7.4); vine(Bn, Math.min(a[0], b[0]), Math.min(a[2], b[2]), Math.max(a[0], b[0]), Math.max(a[2], b[2]), Math.max(a[1], b[1]) + 2.62); }
    solid("taverna", p[0] - 6, p[2] - 0.6, p[0] + 6, p[2] + 7, p[1] + 5); }
  solidTag("");
  // trees: olive groves in rows along the road, cypresses by the houses, stone pines and scrub on the hills, pines on
  // Ardettos and round the stadium. Planted per 80 m tile so whole tiles drop out of view.
  const tiles = new Map<string, TSpec[]>(), plant = (t: TSpec) => { const cr = Math.max(2.5, t.h * 0.42) + 1.2, ty = t.y ?? 0; if (inPath(t.x - cr, t.z - cr, t.x + cr, t.z + cr, ty - 1, ty + t.h + 2)) return; if (t.z < -4 && t.z > -300 && Math.abs(t.x - pathX(t.z)) < 6 + t.h * 0.35) return; if (t.h > 3) solid("tree crown", t.x - t.h * 0.3, t.z - t.h * 0.3, t.x + t.h * 0.3, t.z + t.h * 0.3, (t.y ?? 0) + t.h, (t.y ?? 0) + t.h * 0.35); const k = `${Math.floor(t.x / 80)}|${Math.floor(t.z / 80)}`; let l = tiles.get(k); if (!l) { l = []; tiles.set(k, l); } l.push(t); };
  const clear = (x: number, z: number, r: number) => houses.some(([hx, hz]) => Math.hypot(hx - x, hz - z) < r) || Math.abs(x - TAV_X) < 18 && Math.abs(z - roadZ(TAV_X) - 8) < 14 || (x > VILLAGE_X - 40 && x < VILLAGE_X + 40 && fromRoad(x, z) < 40) || x > CAMP_X - 30;
  let sd = 1; for (let x = GATE_X + 14; x < CAMP_X - 20; x += 7.5) for (const s of [-1, 1]) for (let off = 9; off < 95; off += 7.5) { sd++; const jx = x + 2.5 * (R(sd, 1) - 0.5), o2 = s * (off + 2 * (R(sd, 2) - 0.5)), p = onRoad(jx, o2); if (clear(p[0], p[2], 9) || R(sd, 3) < 0.08) continue; if (H(p[0], p[2]) - H(onRoad(jx, 0)[0], onRoad(jx, 0)[2]) > 10) continue;
    plant({ x: p[0], z: p[2], y: p[1] - 0.1, h: 4.2 + 2 * R(sd, 4), sp: "olive", seed: sd, lod: off < 20 ? 0 : off < 50 ? 1 : 2 }); }
  for (const [hx, hz] of houses) for (let k = 0; k < 2; k++) { const x = hx + 6 * (R(Math.round(hx), k) - 0.5) + 5, z = hz + 7 * (R(Math.round(hz), k + 3) - 0.5) + 4; plant({ x, z, y: H(x, z) - 0.1, h: 10 + 6 * R(Math.round(x), 9), sp: "cypress", seed: Math.round(x * 13 + z), lod: 1 }); }
  for (let i = 0; i < 40; i++) { const x = GATE_X + 20 + R(i, 91) * (CAMP_X - GATE_X - 40), s = R(i, 92) < 0.5 ? -1 : 1, p = onRoad(x, s * 6.4); if (clear(p[0], p[2], 6)) continue; plant({ x: p[0], z: p[2], y: p[1] - 0.1, h: 11 + 5 * R(i, 93), sp: "cypress", seed: 900 + i, lod: 0 }); }
  for (let i = 0; i < 2800; i++) { const x = -380 + R(i, 101) * 1300, z = (R(i, 102) - 0.5) * 760, dr = fromRoad(x, z); if (dr < 95 || x > BEACH_X - 20) continue; const h0 = H(x, z); if (Math.hypot(x - ACRO[0], (z - ACRO[1]) * 1.6) < 85) continue; if (x < 40 && Math.abs(z) < 150 && Math.hypot(x - ARDET[0], z - ARDET[1]) > 100) continue;
    plant({ x, z, y: h0 - 0.2, h: R(i, 103) < 0.35 ? 1.4 + 1.6 * R(i, 104) : 9 + 6 * R(i, 105), sp: R(i, 103) < 0.35 ? "oak" : "pine", seed: 2000 + i, lod: 2 }); }
  for (let i = 0; i < 140; i++) { const a = R(i, 111) * 6.283, r = 25 + 80 * Math.sqrt(R(i, 112)), x = ARDET[0] + r * Math.cos(a), z = ARDET[1] + r * Math.sin(a) * 0.8; if (z < STAD.z + STAD.w / 2 + 26) continue; plant({ x, z, y: H(x, z) - 0.2, h: 8 + 6 * R(i, 113), sp: "pine", seed: 4000 + i, lod: 1 }); }
  for (let i = 0; i < 90; i++) { const x = STAD.x0 - 10 + R(i, 121) * 200, z = -(STAD.w / 2 + 34 + R(i, 122) * 60); plant({ x, z, y: H(x, z) - 0.2, h: 8 + 6 * R(i, 123), sp: "pine", seed: 4500 + i, lod: 1 }); }
  for (let i = 0; i < 60; i++) { const a = R(i, 131) * 6.283, r = 50 + 40 * R(i, 132), x = ACRO[0] + r * Math.cos(a), z = ACRO[1] + r * Math.sin(a) * 0.7; plant({ x, z, y: H(x, z) - 0.2, h: 7 + 5 * R(i, 133), sp: R(i, 134) < 0.5 ? "olive" : "cypress", seed: 4800 + i, lod: 1 }); }
  const shrubs = new Map<string, { x: number; y: number; z: number; r: number; sp: Species; seed: number }[]>();
  for (let i = 0; i < 9000; i++) { const x = -380 + R(i, 141) * 1300, z = (R(i, 142) - 0.5) * 760, dr = fromRoad(x, z); if (dr < 12 || x > BEACH_X - 14 || (x < GATE_X + 4 && Math.abs(z) < 130 && Math.hypot(x - ARDET[0], z - ARDET[1]) > 90)) continue; if (Math.hypot(x - ACRO[0], (z - ACRO[1]) * 1.6) < 50) continue; if (clear(x, z, 7)) continue; if (z < -4 && z > -300 && Math.abs(x - pathX(z)) < 3.5) continue;
    const dens = dr < 90 ? 0.25 : 0.9; if (R(i, 143) > dens) continue; { const yy = H(x, z); if (inPath(x - 3, z - 3, x + 3, z + 3, yy - 1, yy + 4)) continue; } const k = `${Math.floor(x / 80)}|${Math.floor(z / 80)}`; let l = shrubs.get(k); if (!l) { l = []; shrubs.set(k, l); } l.push({ x, z, y: H(x, z) - 0.1, r: 0.5 + 0.9 * R(i, 144), sp: R(i, 145) < 0.6 ? "oak" : "olive", seed: i }); }
  for (const [k, list] of tiles) { const g = new THREE.Group(); makeTreesV2(g, list); const sb = shrubs.get(k); if (sb) { makeShrubs(g, sb); shrubs.delete(k); } G.add(g); const [tx, tz] = k.split("|").map(Number); refs.tiles.push({ g, x: tx * 80 + 40, z: tz * 80 + 40 }); }
  for (const [k, sb] of shrubs) { const g = new THREE.Group(); makeShrubs(g, sb); G.add(g); const [tx, tz] = k.split("|").map(Number); refs.tiles.push({ g, x: tx * 80 + 40, z: tz * 80 + 40 }); }
  B.build(G); BA.build(A); BB.build(Bn);
  // grass blades: dry Attic meadow round the camera (height map over the valley)
  const hm = heightTex(-420, -390, 920, 390, 2, H);
  const roadE = `( wp.x < ${GATE_X.toFixed(1)} ? 0.0 : wp.x > ${CAMP_X.toFixed(1)} ? ${roadZ(CAMP_X).toFixed(2)} : 16.0 * sin( ( wp.x - ${GATE_X.toFixed(1)} ) / 105.0 ) + 6.0 * sin( ( wp.x - ${GATE_X.toFixed(1)} ) / 41.0 ) )`;
  const mask = `( smoothstep( 3.5, 4.8, abs( wp.y - ${roadE} ) ) * ( 1.0 - 0.85 * smoothstep( ${(CAMP_X - 26).toFixed(1)}, ${(CAMP_X - 10).toFixed(1)}, wp.x ) ) * step( wp.x, ${(BEACH_X - 10).toFixed(1)} ) * smoothstep( ${(GATE_X + 2).toFixed(1)}, ${(GATE_X + 10).toFixed(1)}, wp.x ) * smoothstep( 9.0, 14.0, length( ( wp - vec2( ${TAV_X.toFixed(1)}, ${(roadZ(TAV_X) + 7).toFixed(1)} ) ) * vec2( 0.6, 1.0 ) ) ) * ( 1.0 - ( 1.0 - smoothstep( 1.0, 2.0, abs( wp.x - ( ${(GATE_X + 16).toFixed(1)} + 0.28 * max( 0.0, -wp.y - 12.0 ) + 6.0 * sin( -wp.y / 23.0 ) ) ) ) ) * step( wp.y, -8.0 ) ) )`;
  refs.grass.push(makeGrassH(170000, 24, hm, { h0: 0.12, h1: 0.6, w: 0.045, base: ["#6a6a34", "#7a7038", "#5c6430"], tip: ["#d8c27a", "#c8b468", "#b8b060", "#e0cc8a", "#9aa050"], flowers: 0.025, lean: 0.6, mask }));
  for (const g of refs.grass) G.add(g.mesh);
  void sst; void fbm2; void TREE_T; void persian;
};
