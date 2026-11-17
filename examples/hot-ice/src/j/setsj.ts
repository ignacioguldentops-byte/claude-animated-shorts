// 3D sets of "Hielo caliente": the valley above Calgary (hill, ice track, finish, stands, a snowy square with chalets) and the
// island (beach with palms and a barracks behind it, a village road running down a hill to the sea). Boxes, sweeps and painted
// textures; the ink pass draws the geometry edges.
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { NOINK } from "./ink";
import { rng } from "./paint";
import { PAINT } from "./paint2";
import { ctex } from "./paint";
import { lam, add, box, ground, wall, repT } from "./kit";
import { terrain, buildTrackGeo, trackAt, sNear, TRACK_LEN } from "./track";
import * as P from "./paintj";

export const JX = 5000;   // the beach: sea for z < -6, sand to z = 16, the barracks behind
export const RX = 7400;   // the village road: runs down the hill along +z to the sea
export const FIN_X = 44;  // finish line on the valley floor (track runs along +x at z = -16)
export const TOWN: [number, number] = [62, 34];
/** height of the village hill under the road */
export const ry = (z: number) => (z < 0 ? -z * 0.2 : 0);
export const LAMP_MATS: THREE.MeshBasicMaterial[] = [];
const hot = (c: [number, number, number]) => { const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(...c) }); LAMP_MATS.push(m); (m.userData as { hot: [number, number, number] }).hot = c; return m; };
const cyl = (r0: number, r1: number, h: number, x: number, y: number, z: number, seg = 12, open = false) => { const g = new THREE.CylinderGeometry(r0, r1, h, seg, 1, open); g.translate(x, y, z); return g; };
const sph = (r: number, x: number, y: number, z: number, sx = 1, sy = 1, sz = 1, seg = 14) => { const g = new THREE.SphereGeometry(r, seg, Math.max(6, Math.round(seg * 0.7))); g.scale(sx, sy, sz); g.translate(x, y, z); return g; };
const PT = (name: string) => { const p = PAINT[name]; return ctex("p2_" + name, p.w, p.h, p.draw); };
const tiled = (t: THREE.Texture, x: number, y: number) => { const c = t.clone(); c.wrapS = c.wrapT = THREE.RepeatWrapping; c.repeat.set(x, y); c.anisotropy = 8; c.needsUpdate = true; return c; };
const col = (key: string, c: string, x: THREE.MeshLambertMaterialParameters = {}) => lam("j_" + key + c, () => ({ color: c, ...x }));
/** a box turned about its own centre, then moved */
const rbox = (w: number, h: number, d: number, rx: number, ry2: number, rz: number, x: number, y: number, z: number) => { const g = new THREE.BoxGeometry(w, h, d); g.rotateX(rx); g.rotateZ(rz); g.rotateY(ry2); g.translate(x, y, z); return g; };
const quad = (a: number[], b: number[], c: number[], d: number[], tu = 1, tv = 1) => { // a,b bottom (left, right), c,d top (right, left)
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute([...a, ...b, ...c, ...d], 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, tu, 0, tu, tv, 0, tv], 2)); g.setIndex([0, 1, 2, 0, 2, 3]); g.computeVertexNormals(); return g;
};
export type Tint = { m: THREE.MeshBasicMaterial; day: [number, number, number]; golden: [number, number, number]; night: [number, number, number] };
export type Refs = {
  tints: Tint[]; waves: THREE.Texture[]; foams: THREE.Mesh[]; crowns: THREE.Object3D[]; flags: THREE.Mesh[]; crowds: THREE.Texture[];
  carts: THREE.Group[]; sleds: THREE.Group[]; boat: THREE.Object3D; calgary: THREE.Group; island: THREE.Group;
};

// ---------------- the sled ----------------
const sstep = (a: number, b: number, x: number) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
export function buildSled(k: number) {
  const G = new THREE.Group(), ST: [number, number, number][] = [[-1.75, 0.24, 0.34], [-1.5, 0.32, 0.44], [-0.6, 0.36, 0.5], [0.5, 0.36, 0.5], [1.0, 0.34, 0.48], [1.4, 0.28, 0.42], [1.7, 0.17, 0.3], [1.88, 0.04, 0.1]];
  const y0 = (z: number) => 0.12 + 0.14 * sstep(1.1, 1.88, z), NJ = 12;
  const loft = (st: [number, number, number][], ring: (z: number, w: number, h: number, t: number) => [number, number]) => {
    const p: number[] = [], uv: number[] = [], idx: number[] = [];
    st.forEach(([z, w, h]) => { for (let j = 0; j <= NJ; j++) { const [x, y] = ring(z, w, h, j / NJ); p.push(x, y, z); uv.push((z + 1.75) / 3.63, j / NJ); } });
    for (let i = 0; i < st.length - 1; i++) for (let j = 0; j < NJ; j++) { const a = i * (NJ + 1) + j, b = (i + 1) * (NJ + 1) + j; idx.push(a, b, a + 1, b, b + 1, a + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
  };
  const skin = lam("sledSkin" + k, () => ({ map: P.liveryTex(k), side: THREE.DoubleSide }));
  add(G, loft(ST, (z, w, h, t) => { const th = Math.PI + Math.PI * t; return [w * Math.cos(th), y0(z) + h * (1 + Math.sin(th))]; }), skin, true);
  const CW: [number, number, number][] = [[0.5, 0.36, 0.26], [1.0, 0.34, 0.23], [1.4, 0.28, 0.17], [1.7, 0.17, 0.1], [1.88, 0.04, 0.02]];
  add(G, loft(CW, (z, w, hc, t) => { const th = Math.PI * t, rim = y0(z) + (ST.find((s) => s[0] === z)?.[2] ?? 0.5); return [w * Math.cos(th), rim + hc * Math.sin(th)]; }), skin, true);
  const steel = col("steel", "#c9d2de"), dark = col("sdark", "#2c2a38");
  for (const sx of [-0.25, 0.25]) for (const [z0, z1] of [[0.75, 1.5], [-1.55, -0.8]]) { add(G, box(sx - 0.025, 0, z0, sx + 0.025, 0.05, z1), steel, true); for (const zz of [z0 + 0.12, z1 - 0.12]) add(G, box(sx - 0.02, 0.05, zz - 0.03, sx + 0.02, 0.2, zz + 0.03), dark); }
  for (const sx of [-1, 1]) add(G, box(sx * 0.34, 0.6, -1.3, sx * 0.62, 0.65, -1.24), steel);
  add(G, box(-0.3, 0.52, -1.92, 0.3, 0.57, -1.86), steel); for (const sx of [-0.28, 0.28]) add(G, box(sx - 0.02, 0.52, -1.9, sx + 0.02, 0.57, -1.7), steel);
  G.visible = false;
  return G;
}
/** a wooden pushcart */
export function buildCart(k: number) {
  const G = new THREE.Group(), wood = col("cart", ["#b0733a", "#8a5230", "#c98a4a", "#9a6238", "#b97a45"][k % 5]), paint = col("cartP", ["#e2453c", "#3f8fc9", "#f6c419", "#57a05a", "#f25c7a"][k % 5]), tyre = col("tyre", "#2c2a38");
  add(G, box(-0.26, 0.24, -0.75, 0.26, 0.3, 0.75), wood, true); add(G, box(-0.28, 0.3, -0.75, 0.28, 0.62, -0.68), paint, true); add(G, box(-0.45, 0.17, 0.5, 0.45, 0.24, 0.6), wood); add(G, box(-0.45, 0.17, -0.6, 0.45, 0.24, -0.5), wood);
  for (const sx of [-0.47, 0.47]) for (const z of [0.55, -0.55]) { const w = new THREE.CylinderGeometry(0.17, 0.17, 0.08, 12); w.rotateZ(Math.PI / 2); w.translate(sx, 0.17, z); add(G, w, tyre, true); const hb = new THREE.CylinderGeometry(0.06, 0.06, 0.1, 8); hb.rotateZ(Math.PI / 2); hb.translate(sx, 0.17, z); add(G, hb, paint); }
  add(G, box(-0.28, 0.3, -0.7, -0.24, 0.42, 0.3), paint); add(G, box(0.24, 0.3, -0.7, 0.28, 0.42, 0.3), paint);
  G.visible = false;
  return G;
}

// ---------------- Calgary ----------------
export function buildCalgary(R: THREE.Object3D, refs: Refs) {
  const Gp = new THREE.Group(); R.add(Gp); refs.calgary = Gp;
  const A = (g: THREE.BufferGeometry, m: THREE.Material | THREE.Material[], cast = false) => add(Gp, g, m as THREE.Material, cast);
  // snow terrain
  { const g = new THREE.PlaneGeometry(1000, 1000, 250, 250); g.rotateX(-Math.PI / 2); g.translate(30, 0, -60);
    const pos = g.getAttribute("position") as THREE.BufferAttribute, uv = g.getAttribute("uv") as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), z = pos.getZ(i); pos.setY(i, terrain(x, z)); uv.setXY(i, x / 14, z / 14); }
    g.computeVertexNormals(); A(g, lam("jSnow", () => ({ map: repT(P.snowTex()) }))); }
  // the Rockies all around
  { const m = new THREE.MeshBasicMaterial({ map: tiled(P.rockiesTex(), 3, 1), alphaTest: 0.5, side: THREE.BackSide, fog: false });
    const c = new THREE.Mesh(new THREE.CylinderGeometry(600, 600, 250, 96, 1, true), m); c.position.set(30, 121, -60); c.layers.set(NOINK); Gp.add(c);
    refs.tints.push({ m, day: [1, 1, 1], golden: [1.12, 0.88, 0.8], night: [0.5, 0.6, 1.05] }); }
  // the ice track
  { const { ice, shell } = buildTrackGeo();
    A(ice, lam("jIce", () => ({ map: repT(P.iceTex()), side: THREE.DoubleSide })), false); A(shell, lam("jShell", () => ({ map: repT(P.shellTex()), side: THREE.DoubleSide })), true); }
  const wood = lam("jWood", () => ({ map: repT(P.plankTex("a", "#9a6238")) })), dwood = col("dw", "#5a3320"), snow = col("snow", "#f1f5fc"), iron = col("iron", "#2c2a38"), grey = col("grey", "#b9c0cc");
  const mast = (x: number, z: number, h = 14, yaw = 0) => {
    const y = terrain(x, z); A(box(x - 0.16, y, z - 0.16, x + 0.16, y + h, z + 0.16), grey, true);
    A(rbox(2.6, 1.3, 0.3, 0, yaw, 0, x, y + h + 0.5, z), iron, true);
    const b = new THREE.Mesh(rbox(2.3, 1.05, 0.12, 0, yaw, 0, x + Math.sin(yaw) * 0.2, y + h + 0.5, z + Math.cos(yaw) * 0.2), hot([5.5, 5.6, 5.0])); b.layers.set(NOINK); Gp.add(b);
  };
  // start house on the hill top
  { const y = 24.4;
    A(box(-3.3, y, -171, 3.3, y + 4.2, -170.6, 2), wood, true); for (const sx of [-1, 1]) A(box(sx * 3.1 - 0.12, y, -171, sx * 3.1 + 0.12, y + 3.6, -161, 2), wood, true);
    A(rbox(7.6, 0.2, 12, -0.1, 0, 0, 0, y + 4.3, -165.2), dwood, true); A(rbox(7.9, 0.34, 12.3, -0.1, 0, 0, 0, y + 4.58, -165.2), snow, true);
    for (const sx of [-1.75, 1.75]) A(box(sx - 0.09, y, -156.1, sx + 0.09, y + 3.0, -155.9), iron, true);
    A(box(-1.9, y + 2.6, -156.12, 1.9, y + 3.1, -155.88), lam("jCheck", () => ({ map: tiled(P.checkerTex(), 2, 1), side: THREE.DoubleSide })), true);
    [[-0.6, [5, 0.5, 0.4]], [0, [5, 0.5, 0.4]], [0.6, [0.6, 5, 1.2]]].forEach(([dx, c]) => { const b = new THREE.Mesh(sph(0.13, dx as number, y + 3.35, -156), hot(c as [number, number, number])); b.layers.set(NOINK); Gp.add(b); });
    A(box(-0.9, y + 3.18, -156.14, 0.9, y + 3.55, -155.86), iron);
    mast(7, -160, 10, -1.2); mast(-7, -150, 10, 1.9);
  }
  // floodlight masts down the hill and round the big curve
  ([[9, -122, -1.6], [-10, -100, 1.6], [10, -78, -1.6], [-11, -60, 1.3], [-24, -34, 1.6], [-2, -6, 2.9], [22, -28, 0], [52, -30, 0.2], [84, -29, -0.3], [30, -7, 3.14], [70, -7, 3.14]] as [number, number, number][]).forEach(([x, z, a]) => mast(x, z, 13, a));
  // crowd behind boards on the outside of the big curve
  const crowd = tiled(P.crowdWinterTex(), 1, 1); refs.crowds.push(crowd);
  const crowdM = lam("jCrowd", () => ({ map: crowd, side: THREE.DoubleSide })), boardsM = lam("jBoards", () => ({ map: repT(P.boardsTex()), side: THREE.DoubleSide }));
  { const s0 = sNear(-8, -52), s1 = sNear(2, -16.5), strip = (lat: number, y0: number, y1: number, tu: number, tv0: number, tv1: number) => {
      const p: number[] = [], uv: number[] = [], idx: number[] = []; let n = 0;
      for (let s = s0; s <= s1; s += 1.0) { const F = trackAt(s), q = F.p.clone().addScaledVector(F.r, F.sg * lat), gy = terrain(q.x, q.z); p.push(q.x, gy + y0, q.z, q.x, gy + y1, q.z); uv.push((s - s0) / tu, tv0, (s - s0) / tu, tv1); n++; }
      for (let i = 0; i < n - 1; i++) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 2, a + 3, a + 1); }
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g; };
    A(strip(5.0, 0, 1.0, 9, 0, 1), boardsM, true); A(strip(5.9, 0.25, 2.75, 30, 0, 2 / 9), crowdM); A(strip(6.7, 1.0, 3.5, 30, 2 / 9, 4 / 9), crowdM); A(strip(7.5, 1.75, 4.25, 30, 4 / 9, 6 / 9), crowdM); A(strip(7.9, 0, 4.4, 9, 0, 1), col("standBack", "#56607e"), true); }
  // finish: grandstand (north), boards and standing crowd (south), arch, results board, flags
  { A(quad([24, 1.25, -19.6], [74, 1.25, -19.6], [74, 7.4, -28.2], [24, 7.4, -28.2], 1.8, 1), crowdM);
    A(box(24, 0, -19.9, 74, 1.25, -19.6, 9), boardsM, true); A(box(24, 0, -28.6, 74, 8.0, -28.2), col("standBack", "#56607e"), true);
    for (const x of [24, 74]) A(box(x - 0.15, 0, -28.4, x + 0.15, 7.6, -19.8), col("standBack", "#56607e"), true);
    A(rbox(52, 0.25, 9.6, 0.1, 0, 0, 49, 10.4, -24.6), col("standRoof", "#3a4a8a"), true); A(rbox(52.4, 0.4, 9.9, 0.1, 0, 0, 49, 10.75, -24.6), snow, true);
    for (let x = 25; x <= 73; x += 8) { A(box(x - 0.12, 0, -28.5, x + 0.12, 10.8, -28.25), iron); const b = new THREE.Mesh(box(x + 3.4, 9.9, -22.6, x + 4.6, 10.0, -22.2), hot([4, 4, 3.4])); b.layers.set(NOINK); Gp.add(b); }
    A(box(14, 0, -12.5, 96, 1.0, -12.3, 9), boardsM, true); A(quad([96, 0.3, -11.6], [14, 0.3, -11.6], [14, 2.7, -11.6], [96, 2.7, -11.6], 3, 2 / 9), crowdM); A(quad([96, 1.1, -10.7], [14, 1.1, -10.7], [14, 3.5, -10.7], [96, 3.5, -10.7], 3, 2 / 9), crowdM);
    const ck = lam("jCheck", () => ({ map: tiled(P.checkerTex(), 2, 1), side: THREE.DoubleSide }));
    for (const z of [-19.3, -12.9]) A(box(FIN_X - 0.4, 0, z - 0.35, FIN_X + 0.4, 5.4, z + 0.35), col("arch", "#3a4a8a"), true);
    A(box(FIN_X - 0.45, 4.5, -19.7, FIN_X + 0.45, 5.5, -12.5), ck, true); A(box(FIN_X - 0.55, 5.5, -19.8, FIN_X + 0.55, 5.72, -12.4), snow, true);
    A(quad([FIN_X + 0.25, 0.53, -17.2], [FIN_X + 0.25, 0.53, -14.8], [FIN_X - 0.25, 0.53, -14.8], [FIN_X - 0.25, 0.53, -17.2], 2, 0.5), ck);
    // results board on two poles at the east end
    for (const x of [77.2, 82.8]) A(box(x - 0.14, 0, -22.2, x + 0.14, 4, -21.9), iron, true);
    A(box(76.4, 3.6, -22.3, 83.6, 12.6, -21.9), iron, true); A(wall(76.7, -21.88, 83.3, -21.88, 3.9, 12.3), lam("jResults", () => ({ map: P.resultsTex() }))); A(box(76.3, 12.6, -22.4, 83.7, 12.85, -21.8), snow);
    for (let i = 0; i < 12; i++) { const x = 18 + i * 6.6, z = -9.6; A(cyl(0.05, 0.06, 7.2, x, 3.6, z, 8), grey, true);
      const f = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.13).translate(0.87, 0, 0), lam("jFlag" + (i % 8), () => ({ map: P.flagTex(i % 8), side: THREE.DoubleSide }))); f.position.set(x, 6.5, z); f.castShadow = true; Gp.add(f); refs.flags.push(f); }
  }
  // pines (merged)
  { const r = rng(77), gs: THREE.BufferGeometry[] = [], ws: THREE.BufferGeometry[] = [], ts: THREE.BufferGeometry[] = [];
    const smp: [number, number][] = []; for (let s = 0; s < TRACK_LEN; s += 3) { const F = trackAt(s); smp.push([F.p.x, F.p.z]); }
    let n = 0;
    for (let tries = 0; tries < 4000 && n < 330; tries++) {
      const near = tries % 3 > 0, x = near ? -70 + r() * 150 : -200 + r() * 430, z = near ? -265 + r() * 280 : -330 + r() * 440;
      if (smp.some(([a, b]) => (a - x) ** 2 + (b - z) ** 2 < (near ? 49 : 70))) continue;
      if (x > 8 && x < 100 && z > -34 && z < -2) continue; if (x > 30 && x < 100 && z > -2 && z < 70) continue; if (Math.abs(x) < 9 && z < -146 && z > -178) continue;
      if (x > -32 && x < 12 && z > -58 && z < -6) continue;
      const y = terrain(x, z), k = 0.8 + r() * 0.9; n++;
      ts.push(cyl(0.16 * k, 0.2 * k, 1.2 * k, x, y + 0.6 * k, z, 6));
      [[1.7, 2.3, 0.9], [1.3, 2.0, 2.1], [0.9, 1.8, 3.2]].forEach(([rad, h, b]) => {
        const c = new THREE.ConeGeometry(rad * k, h * k, 7); c.rotateY(r() * 6); c.translate(x, y + (b + h / 2) * k, z); gs.push(c);
        const w = new THREE.ConeGeometry((rad * 0.62 + 0.06) * k, h * 0.62 * k, 7); w.rotateY(r() * 6); w.translate(x, y + (b + h - h * 0.31 + 0.05) * k, z); ws.push(w);
      });
    }
    A(mergeGeometries(gs), col("pine", "#2f6a50"), true); A(mergeGeometries(ws), snow, false); A(mergeGeometries(ts), col("trunk", "#6e4a2e"), false);
  }
  // the snowy square: chalets, a church, the T-shirt stall, lamps, a snowman
  const chalet = (x: number, z: number, rot: number, k: number, w = 8, d = 7, h = 4.8) => {
    const C = new THREE.Group(); C.position.set(x, 0, z); C.rotation.y = rot; Gp.add(C);
    const front = lam("jChalet" + k, () => ({ map: P.chaletTex(k) })), side = lam("jPlankC" + k, () => ({ map: repT(P.plankTex("c" + k, ["#a8693c", "#96582f", "#b97a45", "#8a5230"][k % 4])) }));
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0), [front, front, side, side, front, front]); body.castShadow = true; body.receiveShadow = true; C.add(body);
    const rh = 2.7, hw = w / 2 + 0.7, sl = Math.hypot(hw, rh), ang = Math.atan2(rh, hw);
    for (const zz of [d / 2, -d / 2]) { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute([-w / 2, h, zz, w / 2, h, zz, 0, h + rh * (w / 2) / hw, zz], 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 2, 0, 1, 1], 2)); g.setIndex(zz > 0 ? [0, 1, 2] : [1, 0, 2]); g.computeVertexNormals(); add(C, g, side, true); }
    for (const sg of [-1, 1]) { add(C, rbox(sl + 0.3, 0.2, d + 1.4, 0, 0, -sg * ang, (sg * hw) / 2, h + rh / 2 - 0.12, 0), dwood, true); add(C, rbox(sl + 0.42, 0.32, d + 1.5, 0, 0, -sg * ang, (sg * hw) / 2, h + rh / 2 + 0.14, 0), snow, true); }
    add(C, box(w * 0.2, h + 0.6, -d * 0.25, w * 0.2 + 0.7, h + 3.0, -d * 0.25 + 0.7), col("chim", "#b9b4ac"), true); add(C, box(w * 0.2 - 0.08, h + 3.0, -d * 0.25 - 0.08, w * 0.2 + 0.78, h + 3.22, -d * 0.25 + 0.78), snow);
    add(C, box(-w / 2 - 0.3, 0, d / 2, w / 2 + 0.3, 0.16, d / 2 + 0.7), snow);
  };
  const [tx, tz] = TOWN;
  chalet(tx - 15, tz - 17, 0, 0); chalet(tx - 1, tz - 22, 0, 1, 10, 7.5, 5.4); chalet(tx + 14.5, tz - 16.5, 0, 2); chalet(tx - 21, tz + 2, Math.PI / 2, 3, 7.5, 6.5, 4.6); chalet(tx + 22, tz + 3, -Math.PI / 2, 0, 7.5, 6.5, 4.6);
  chalet(tx - 30, tz - 26, 0.3, 2, 7, 6, 4.4); chalet(tx + 31, tz - 24, -0.25, 3, 7, 6, 4.4);
  { const cx = tx + 6, cz = tz - 36, stone = col("church", "#e6dfd0"); A(box(cx - 4, 0, cz - 7, cx + 4, 6, cz + 7), stone, true); A(box(cx - 2, 0, cz + 7, cx + 2, 12, cz + 11), stone, true);
    const sp = new THREE.ConeGeometry(3.1, 8, 4); sp.rotateY(Math.PI / 4); sp.translate(cx, 16, cz + 9); A(sp, col("spire", "#3a4a6a"), true); const ss = new THREE.ConeGeometry(1.9, 4.9, 4); ss.rotateY(Math.PI / 4); ss.translate(cx, 17.6, cz + 9); A(ss, snow);
    A(rbox(6.2, 0.3, 14.6, 0, 0, 0.75, cx - 2.2, 7.9, cz), col("spire", "#3a4a6a"), true); A(rbox(6.2, 0.3, 14.6, 0, 0, -0.75, cx + 2.2, 7.9, cz), col("spire", "#3a4a6a"), true); A(rbox(6.3, 0.3, 14.8, 0, 0, 0.75, cx - 2.2, 8.2, cz), snow); A(rbox(6.3, 0.3, 14.8, 0, 0, -0.75, cx + 2.2, 8.2, cz), snow); }
  { // the stall (faces +z)
    const sx = tx, sz = tz - 4, awn = lam("jAwn", () => ({ map: tiled(P.stripeTex("jm", "#f6c419", "#1f8a3a"), 3, 1) }));
    A(box(sx - 1.9, 0, sz - 0.4, sx + 1.9, 1.0, sz + 0.4, 1.2), wood, true); A(box(sx - 2.0, 1.0, sz - 0.48, sx + 2.0, 1.08, sz + 0.48), dwood, true);
    for (const dx of [-1.95, 1.95]) for (const dz of [-1.5, 0.9]) A(box(sx + dx - 0.06, 0, sz + dz - 0.06, sx + dx + 0.06, dz < 0 ? 3.5 : 3.0, sz + dz + 0.06), dwood, true);
    A(box(sx - 1.95, 0.2, sz - 1.56, sx + 1.95, 3.4, sz - 1.48, 1.2), wood, true);
    A(rbox(4.6, 0.08, 3.0, 0.2, 0, 0, sx, 3.3, sz - 0.3), awn, true); A(rbox(4.7, 0.2, 3.1, 0.2, 0, 0, sx, 3.46, sz - 0.3), snow, true);
    const tee = (x: number, y: number, z: number, k: number, s = 0.78) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(s, s), lam("jTee" + k, () => ({ map: P.tshirtTex(k), alphaTest: 0.5, side: THREE.DoubleSide }))); m.position.set(x, y, z); Gp.add(m); };
    [-1.35, -0.45, 0.45, 1.35].forEach((dx, i) => tee(sx + dx, 2.62, sz - 1.44, i));
    for (const sd of [-1, 1]) { const x0 = sx + sd * 2.5, x1 = sx + sd * 3.9; for (const x of [x0, x1]) A(box(x - 0.04, 0, sz + 0.2 - 0.04, x + 0.04, 2.05, sz + 0.2 + 0.04), iron, true); A(box(Math.min(x0, x1), 2.0, sz + 0.18, Math.max(x0, x1), 2.05, sz + 0.22), iron); [0.25, 0.7, 1.15].forEach((d, i) => tee(x0 + sd * d, 1.62, sz + 0.2 + i * 0.01, (i + (sd > 0 ? 1 : 2)) % 4, 0.74)); }
    [[-1.3, "#23202a"], [-0.8, "#f6c419"], [1.2, "#1f8a3a"]].forEach(([dx, c]) => { for (let i = 0; i < 3; i++) A(box(sx + (dx as number) - 0.2, 1.08 + i * 0.05, sz - 0.2, sx + (dx as number) + 0.2, 1.125 + i * 0.05, sz + 0.2), col("fold", i === 1 ? "#f7f5ee" : (c as string))); });
    A(box(sx + 0.3, 1.08, sz - 0.1, sx + 0.62, 1.24, sz + 0.14), col("tin", "#8f9bb0"));
    // lamp posts with a string of lights
    const posts: [number, number][] = [[sx - 5.2, sz + 3], [sx + 5.4, sz + 3]];
    posts.forEach(([x, z]) => { A(cyl(0.06, 0.09, 3.6, x, 1.8, z, 8), iron, true); A(box(x - 0.2, 3.6, z - 0.2, x + 0.2, 3.66, z + 0.2), iron); const b = new THREE.Mesh(box(x - 0.15, 3.25, z - 0.15, x + 0.15, 3.6, z + 0.15), hot([4.6, 3.6, 1.8])); b.layers.set(NOINK); Gp.add(b); A(box(x - 0.24, 3.66, z - 0.24, x + 0.24, 3.78, z + 0.24), snow); });
    for (let i = 1; i < 14; i++) { const t = i / 14, x = posts[0][0] + (posts[1][0] - posts[0][0]) * t, y = 3.5 - 0.9 * Math.sin(Math.PI * t); const b = new THREE.Mesh(sph(0.07, x, y, sz + 3, 1, 1, 1, 8), hot([[4, 1, 0.8], [4, 3.2, 0.8], [0.8, 3.6, 1.2], [1, 2, 4.4]][i % 4] as [number, number, number])); b.layers.set(NOINK); Gp.add(b); }
    // snowman, bench, snow heaps
    const mx = sx + 6.6, mz = sz + 4.4; A(sph(0.5, mx, 0.45, mz), snow, true); A(sph(0.36, mx, 1.15, mz), snow, true); A(sph(0.26, mx, 1.68, mz), snow, true); A(cyl(0.2, 0.2, 0.24, mx, 2.02, mz), iron, true); A(cyl(0.3, 0.3, 0.03, mx, 1.9, mz), iron);
    { const c = new THREE.ConeGeometry(0.05, 0.24, 8); c.rotateX(Math.PI / 2); c.translate(mx, 1.68, mz + 0.34); A(c, col("carrot", "#f29a2e")); A(box(mx - 0.3, 1.38, mz - 0.3, mx + 0.3, 1.48, mz + 0.3), col("scarfR", "#d0342e")); for (const e of [-0.09, 0.09]) A(sph(0.03, mx + e, 1.76, mz + 0.24), iron); }
    const bx = sx - 6.4, bz = sz + 5; A(box(bx - 0.9, 0.4, bz - 0.22, bx + 0.9, 0.46, bz + 0.22), dwood, true); A(box(bx - 0.9, 0.46, bz - 0.24, bx + 0.9, 0.9, bz - 0.18), dwood, true); for (const e of [-0.8, 0.8]) A(box(bx + e - 0.04, 0, bz - 0.2, bx + e + 0.04, 0.4, bz + 0.2), iron); A(box(bx - 0.92, 0.46, bz - 0.2, bx + 0.92, 0.54, bz + 0.24), snow);
    for (const [hx, hz, hs] of [[sx - 9, sz + 1, 1.3], [sx + 9.5, sz + 1.5, 1.6], [sx - 3.6, sz - 2.4, 0.8], [sx + 3.9, sz - 2.2, 0.9], [sx + 12, sz + 7, 1.2], [sx - 12, sz + 8, 1.4]]) A(sph(1, hx, 0, hz, hs, hs * 0.42, hs * 0.8), snow, true);
  }
}

// ---------------- the island ----------------
export function buildIsland(R: THREE.Object3D, refs: Refs) {
  const Gp = new THREE.Group(); R.add(Gp); refs.island = Gp;
  const A = (g: THREE.BufferGeometry, m: THREE.Material | THREE.Material[], cast = false) => add(Gp, g, m as THREE.Material, cast);
  const wood = lam("jWoodI", () => ({ map: repT(P.plankTex("i", "#b0733a")) })), dwood = col("dw", "#5a3320"), white = col("white", "#f7f5ee"), iron = col("iron", "#2c2a38");
  const sand = lam("jSand", () => ({ map: repT(P.sandTex()) })), lawn = lam("jLawn", () => ({ map: repT(P.lawnTex()) })), tin = lam("jTin", () => ({ map: repT(P.tinTex()) })), tinR = lam("jTinR", () => ({ map: repT(P.tinTex()), color: "#d98a6a" }));
  const seaM = new THREE.MeshBasicMaterial({ map: P.seaTex() }); refs.tints.push({ m: seaM, day: [1, 1, 1], golden: [1.15, 0.8, 0.62], night: [0.3, 0.35, 0.7] });
  const wavesT = tiled(P.wavesTex(), 90, 64); refs.waves.push(wavesT);
  const wavesM = new THREE.MeshBasicMaterial({ map: wavesT, transparent: true, depthWrite: false, opacity: 0.8 });
  const foamM = () => new THREE.MeshBasicMaterial({ map: tiled(P.foamTex(), 44, 1), transparent: true, depthWrite: false });
  const sea = (cx: number, zShore: number, dir: 1 | -1) => { // dir -1: sea towards -z
    const z0 = dir < 0 ? zShore - 900 : zShore, z1 = dir < 0 ? zShore : zShore + 900, g = ground(cx - 700, cx + 700, z0, z1, -0.03);
    if (dir > 0) { const uv = g.getAttribute("uv") as THREE.BufferAttribute; for (let i = 0; i < uv.count; i++) uv.setY(i, 1 - uv.getY(i)); }
    const m = new THREE.Mesh(g, seaM); m.layers.set(NOINK); Gp.add(m);
    const w = new THREE.Mesh(ground(cx - 700, cx + 700, z0, z1, 0), wavesM); w.layers.set(NOINK); w.renderOrder = 0.1; Gp.add(w);
    A(ground(cx - 300, cx + 300, Math.min(zShore, zShore - dir * 3.2), Math.max(zShore, zShore - dir * 3.2), 0.004), col("wet", "#dcc592"));
    const fg = ground(cx - 300, cx + 300, zShore - 1.4, zShore + 1.4, 0.014, 1, 1);
    if (dir > 0) { const uv = fg.getAttribute("uv") as THREE.BufferAttribute; for (let i = 0; i < uv.count; i++) uv.setY(i, 1 - uv.getY(i)); }
    const f = new THREE.Mesh(fg, foamM()); f.layers.set(NOINK); f.renderOrder = 0.2; (f.userData as { dir: number }).dir = dir; Gp.add(f); refs.foams.push(f);
  };
  const hills = (cx: number, cz: number, th0: number) => { const m = new THREE.MeshBasicMaterial({ map: tiled(P.hillsTex(), 1.4, 1), alphaTest: 0.5, side: THREE.BackSide, fog: false });
    const c = new THREE.Mesh(new THREE.CylinderGeometry(430, 430, 190, 64, 1, true, th0, Math.PI), m); c.position.set(cx, 93, cz); c.layers.set(NOINK); Gp.add(c); refs.tints.push({ m, day: [1, 1, 1], golden: [1.1, 0.82, 0.66], night: [0.3, 0.38, 0.7] }); };
  const palm = (x: number, y: number, z: number, h: number, lx: number, lz: number, k: number) => {
    const top = new THREE.Vector3(x + lx * h * 0.3, y + h, z + lz * h * 0.3), cv = new THREE.QuadraticBezierCurve3(new THREE.Vector3(x, y - 0.2, z), new THREE.Vector3(x + lx * h * 0.02, y + h * 0.55, z + lz * h * 0.02), top);
    const tg = new THREE.TubeGeometry(cv, 10, 0.17, 7); { const uv = tg.getAttribute("uv") as THREE.BufferAttribute; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getY(i), uv.getX(i) * h * 0.9); }
    A(tg, lam("jTrunk", () => ({ map: repT(P.trunkTex()) })), true);
    const C = new THREE.Group(); C.position.copy(top); Gp.add(C); refs.crowns.push(C);
    const m = lam("jPalm" + (k % 2), () => ({ map: P.palmTex(k % 2), alphaTest: 0.5, side: THREE.DoubleSide }));
    for (let i = 0; i < 3; i++) { const pl = new THREE.Mesh(new THREE.PlaneGeometry(h * 0.82, h * 0.82), m); pl.rotation.y = (i * Math.PI) / 3 + k; pl.position.y = -h * 0.04; pl.castShadow = true; C.add(pl); }
  };
  const banana = (x: number, y: number, z: number, s = 1) => { const m = lam("jBanana", () => ({ map: P.bananaTex(), alphaTest: 0.5, side: THREE.DoubleSide })); for (let i = 0; i < 2; i++) { const pl = new THREE.Mesh(new THREE.PlaneGeometry(1.9 * s, 2.85 * s), m); pl.position.set(x, y + 1.42 * s, z); pl.rotation.y = i * 1.57 + 0.4; pl.castShadow = true; Gp.add(pl); } };

  // ---- the beach ----
  A(ground(JX - 300, JX + 300, -6, 16, 0, 600 / 6, 22 / 6), sand); A(ground(JX - 300, JX + 300, 16, 260, 0.001, 600 / 7, 244 / 7), lawn);
  sea(JX, -6, -1); hills(JX, 0, -Math.PI / 2);
  A(sph(1, JX + 290, -4, -90, 150, 46, 80, 24), col("headland", "#4aa058"), false); A(sph(1, JX - 420, -4, -520, 110, 26, 60, 20), col("isle", "#7fb8b0"), false);
  ([[-9.5, 12.8, 6.5, -0.2, -0.6], [-4.2, 10, 5.6, 0.3, -0.5], [5.5, 8.4, 7, 0.2, -0.6], [9.2, 5.2, 5.8, -0.3, -0.7], [14.5, 10, 6.4, 0.4, -0.4], [-12.5, 11, 7.2, -0.4, -0.5], [-17, 6, 6, 0.2, -0.7], [20.5, 7, 6.6, -0.2, -0.6], [27, 11, 7, 0.3, -0.5], [-24, 12, 6.8, -0.3, -0.5],
    [-2.9, 0.6, 6.8, -0.35, -0.5], [4.3, -0.8, 7.4, 0.3, -0.45], [-6.2, -2.2, 6.2, -0.2, -0.6], [8.2, -1.8, 6.0, 0.35, -0.5], [6.4, 21.6, 7.6, 0.2, -0.2], [-10, 23, 7, -0.3, -0.2], [17.5, 22, 7.3, 0.3, -0.2], [-20, 21, 6.6, 0.2, -0.3], [34, 8, 6.2, -0.4, -0.5], [-32, 9, 6.4, 0.4, -0.5], [42, 12, 7, 0.2, -0.5], [-40, 13, 7.2, -0.2, -0.5]] as number[][]).forEach(([x, z, h, lx, lz], i) => palm(JX + x, 0, z, h, lx, lz, i));
  { // thatched beach bar
    const bx = JX + 11, bz = 13; for (const dx of [-1.7, 1.7]) for (const dz of [-1.7, 1.7]) A(cyl(0.09, 0.1, 2.6, bx + dx, 1.3, bz + dz, 8), dwood, true);
    const roof = new THREE.ConeGeometry(3.3, 1.9, 4); roof.rotateY(Math.PI / 4); roof.translate(bx, 3.5, bz); A(roof, lam("jThatch", () => ({ map: repT(P.thatchTex()) })), true);
    A(box(bx - 1.7, 0, bz - 1.75, bx + 1.7, 1.05, bz - 1.45, 1.2), wood, true); A(box(bx - 1.8, 1.05, bz - 1.85, bx + 1.8, 1.12, bz - 1.35), dwood, true);
    [["#e2453c", -1.1], ["#57a05a", -0.6], ["#f6c419", 0.2], ["#3fb0c9", 0.9]].forEach(([c, dx]) => { A(cyl(0.05, 0.06, 0.26, bx + (dx as number), 1.25, bz - 1.6, 8), col("bottle", c as string)); A(cyl(0.02, 0.02, 0.1, bx + (dx as number), 1.42, bz - 1.6, 6), col("bottle", c as string)); });
    for (const dx of [-1, 0, 1]) { A(cyl(0.17, 0.17, 0.06, bx + dx, 0.72, bz - 2.4, 12), col("stool", "#e2453c"), true); A(cyl(0.03, 0.03, 0.7, bx + dx, 0.35, bz - 2.4, 6), iron); }
  }
  { // lounger, parasol, little table, towel, ball, sandcastle
    const lx = JX + 0.7, lz = 3.2, tw = lam("jTowel", () => ({ map: P.towelTex() }));
    A(box(lx - 0.36, 0.3, lz - 0.2, lx + 0.36, 0.38, lz + 1.5), tw, true); A(rbox(0.72, 0.08, 1.0, -0.9, 0, 0, lx, 0.72, lz - 0.48), tw, true); for (const dx of [-0.32, 0.32]) for (const dz of [-0.1, 1.4]) A(box(lx + dx - 0.03, 0, lz + dz - 0.03, lx + dx + 0.03, 0.3, lz + dz + 0.03), white);
    A(cyl(0.035, 0.035, 2.5, lx + 1.25, 1.25, lz - 0.3, 8), white, true); const um = new THREE.ConeGeometry(1.55, 0.55, 14); um.translate(lx + 1.25, 2.55, lz - 0.3); A(um, lam("jUmb", () => ({ map: tiled(P.umbrellaTex(), 2, 1), side: THREE.DoubleSide })), true);
    A(cyl(0.28, 0.28, 0.04, lx - 0.95, 0.5, lz + 0.5, 14), wood, true); A(cyl(0.03, 0.03, 0.5, lx - 0.95, 0.25, lz + 0.5, 6), dwood);
    A(sph(0.24, JX - 1.6, 0.24, 1.2), lam("jBall", () => ({ map: tiled(P.stripeTex("ball", "#f7f5ee", "#e2453c"), 2, 1) })), true);
    const sc = col("castle", "#e9cf94"); A(cyl(0.3, 0.36, 0.34, JX - 3.0, 0.17, 3.8, 10), sc, true); A(cyl(0.14, 0.17, 0.3, JX - 3.0, 0.49, 3.8, 8), sc, true); for (const [dx, dz] of [[-0.36, 0.2], [0.36, 0.2], [0, -0.38]]) { A(cyl(0.1, 0.12, 0.3, JX - 3.0 + dx, 0.15, 3.8 + dz, 8), sc, true); const c = new THREE.ConeGeometry(0.11, 0.16, 8); c.translate(JX - 3.0 + dx, 0.38, 3.8 + dz); A(c, sc); }
    A(box(JX - 5.2, 0.005, 1.6, JX - 4.2, 0.02, 3.4), lam("jTowel2", () => ({ map: tiled(P.stripeTex("tw", "#f6c419", "#f25c7a"), 1, 1) })));
  }
  const boat = (x: number, y: number, z: number, rot: number, c: string, c2: string) => { const B = new THREE.Group(); B.position.set(x, y, z); B.rotation.y = rot; Gp.add(B);
    const h = new THREE.SphereGeometry(1, 14, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2); h.scale(2.3, 0.62, 0.66); h.translate(0, 0.62, 0); add(B, h, col("boat", c, { side: THREE.DoubleSide }), true);
    const rim = new THREE.TorusGeometry(1, 0.035, 5, 28); rim.rotateX(Math.PI / 2); rim.scale(2.3, 1, 0.66); rim.translate(0, 0.62, 0); add(B, rim, col("boat2", c2)); for (const dx of [-0.9, 0.2, 1.1]) add(B, box(dx - 0.12, 0.42, -0.55, dx + 0.12, 0.47, 0.55), col("boat2", c2)); return B; };
  boat(JX - 7.5, 0, -3.0, 0.5, "#f6d24a", "#1f8a3a"); boat(JX + 16, 0, -2.6, -0.35, "#e2453c", "#f7f5ee"); refs.boat = boat(JX - 12, -0.25, -26, 0.2, "#3fb0c9", "#f6d24a");
  { // barracks, parade ground, flag, water tank
    A(ground(JX - 17, JX + 17, 15.5, 24.4, 0.006, 34 / 5, 9 / 5), lam("jRoad", () => ({ map: repT(P.roadTex()) })));
    const front = lam("jBarracks", () => ({ map: P.barracksTex() })), plain = col("barr", "#f1e6c8");
    const b = new THREE.Mesh(new THREE.BoxGeometry(26, 3.4, 5).translate(JX, 1.7, 28.6), [plain, plain, plain, plain, plain, front]); b.castShadow = true; b.receiveShadow = true; Gp.add(b);
    A(rbox(27.4, 0.14, 3.6, -0.36, 0, 0, JX, 4.05, 27.6), tinR, true); A(rbox(27.4, 0.14, 3.6, 0.36, 0, 0, JX, 4.05, 30.4), tinR, true);
    A(rbox(27, 0.1, 2.2, 0.2, 0, 0, JX, 3.1, 25.2), tinR, true); A(box(JX - 13, 0, 24.3, JX + 13, 0.16, 26.1), col("slab", "#cfc4b0"), true);
    for (let x = -12.6; x <= 12.7; x += 3.6) A(cyl(0.07, 0.07, 2.75, JX + x, 1.53, 24.5, 8), white, true);
    for (let x = -16; x <= 16; x += 1.6) for (const z of [15.6, 24.2]) if (Math.abs(x) > 1.5 || z > 20) A(sph(0.16, JX + x, 0.1, z, 1, 0.8, 1, 8), white, true);
    const fx = JX + 9.2, fz = 21.2; A(cyl(0.05, 0.07, 7.6, fx, 3.8, fz, 8), white, true); A(cyl(0.3, 0.36, 0.3, fx, 0.15, fz, 10), col("slab", "#cfc4b0"), true); A(sph(0.09, fx, 7.62, fz, 1, 1, 1, 8), col("gold", "#e9b93c"));
    const f = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 1.53).translate(1.18, 0, 0), lam("jFlag0", () => ({ map: P.flagTex(0), side: THREE.DoubleSide }))); f.position.set(fx, 6.7, fz); f.castShadow = true; Gp.add(f); refs.flags.push(f);
    const wx = JX - 20.5, wz = 29; for (const dx of [-0.9, 0.9]) for (const dz of [-0.9, 0.9]) A(cyl(0.06, 0.06, 4.6, wx + dx, 2.3, wz + dz, 6), iron, true); A(cyl(1.3, 1.3, 1.8, wx, 5.5, wz, 14), tin, true); const cn = new THREE.ConeGeometry(1.4, 0.6, 14); cn.translate(wx, 6.7, wz); A(cn, tinR, true);
    banana(JX - 14.5, 0, 25.4); banana(JX + 14.6, 0, 25.6, 1.1); banana(JX + 21, 0, 19, 0.9);
  }

  // ---- the village road ----
  const SL = Math.atan(0.2), slopeQuad = (x0: number, x1: number, z0: number, z1: number, dy: number, tu: number, tv: number) => quad([x0, ry(z1) + dy, z1], [x1, ry(z1) + dy, z1], [x1, ry(z0) + dy, z0], [x0, ry(z0) + dy, z0], tu, tv);
  A(slopeQuad(RX - 260, RX + 260, -230, 0, 0, 520 / 7, 230 / 7), lawn); A(ground(RX - 260, RX + 260, 0, 44, 0, 520 / 7, 44 / 7), lawn); A(ground(RX - 300, RX + 300, 44, 60, 0.002, 600 / 6, 16 / 6), sand);
  const road = lam("jRoad2", () => ({ map: repT(P.roadTex()) }));
  A(slopeQuad(RX - 2.7, RX + 2.7, -230, 0, 0.03, 1, 230 / 5.4), road); A(ground(RX - 2.7, RX + 2.7, 0, 46, 0.03, 1, 46 / 5.4), road);
  sea(RX, 60, 1); hills(RX, -40, Math.PI / 2);
  for (let i = 0; i < 14; i++) {
    const sd = i % 2 ? 1 : -1, zc = -6 - Math.floor(i / 2) * 12.5 - (sd > 0 ? 5 : 0), xc = RX + sd * (6.6 + (i % 3) * 0.9), y = ry(zc + 2.6), w = 5, h = 2.8, d = 4.4;
    const C = new THREE.Group(); C.position.set(xc, y, zc); C.rotation.y = sd > 0 ? -Math.PI / 2 : Math.PI / 2; Gp.add(C);
    const front = lam("jShack" + (i % 7), () => ({ map: P.shackTex(i % 7) })), cc = ["#3fb0c9", "#f29a2e", "#f25c7a", "#7fc97a", "#f6d24a", "#b98ad6", "#f4efe0"][i % 7], side = lam("jShackS" + (i % 7), () => ({ map: repT(P.plankTex("s" + (i % 7), cc)) }));
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0), [side, side, side, side, front, side]); body.castShadow = true; body.receiveShadow = true; C.add(body);
    add(C, box(-w / 2 - 0.1, -3, -d / 2 - 0.1, w / 2 + 0.1, 0, d / 2 + 0.1), col("found", "#b9ae9c"), true);
    add(C, rbox(w + 0.9, 0.1, d + 1.3, 0.16, 0, 0, 0, h + 0.38, 0.1), i % 3 ? tin : tinR, true);
    add(C, rbox(2.6, 0.08, 1.5, 0.22, 0, 0, i % 2 ? 1.0 : -0.9, 2.45, d / 2 + 0.7), i % 3 ? tinR : tin, true); for (const dx of [-1.1, 1.1]) add(C, cyl(0.05, 0.05, 2.3, (i % 2 ? 1.0 : -0.9) + dx, 1.15, d / 2 + 1.3, 6), white, true);
    add(C, box((i % 2 ? 1.0 : -0.9) - 0.7, -0.5, d / 2, (i % 2 ? 1.0 : -0.9) + 0.7, 0.02, d / 2 + 1.4), col("found", "#b9ae9c"), true);
    banana(xc + sd * 1.2, ry(zc + 3.4), zc + 3.4, 0.9 + (i % 3) * 0.12);
    palm(RX + sd * (13 + (i % 4) * 3.2), ry(zc - 3), zc - 3, 6.4 + (i % 3) * 0.9, sd * 0.2, 0.3, i);
  }
  for (let i = 0; i < 16; i++) { const sd = i % 2 ? 1 : -1, z = -150 + (i % 8) * 9 - 20 * (i % 3), x = RX + sd * (9 + (i * 7) % 26); palm(x, ry(z), z, 6 + (i % 4) * 0.8, sd * 0.25, 0.25, i + 3); }
  for (let i = 0; i < 9; i++) { const sd = i % 2 ? 1 : -1, z = 8 + i * 4.2, x = RX + sd * (5.5 + (i * 5) % 22); palm(x, 0, z, 6 + (i % 3), sd * 0.2, 0.4, i + 1); }
  // power poles and wires down the right side, bunting across the road
  for (let i = 0; i < 6; i++) { const z = -4 - i * 22, x = RX + 3.6, y = ry(z); A(cyl(0.08, 0.1, 7, x, y + 3.5, z, 8), dwood, true); A(box(x - 0.7, y + 6.3, z - 0.05, x + 0.7, y + 6.42, z + 0.05), dwood);
    if (i < 5) for (const dx of [-0.6, 0.6]) A(rbox(0.025, 0.025, 22 / Math.cos(SL), SL, 0, 0, x + dx, y + 6.5 + 2.2, z - 11), iron); }
  const bun = lam("bunting", () => ({ map: PT("bunting"), alphaTest: 0.5, side: THREE.DoubleSide }));
  for (const z of [-3, -19, -36, -55]) { const y = ry(z) + 4.3; A(wall(RX - 3.5, z, RX + 3.5, z, y - 0.42, y, 1.4), bun); for (const sx of [-3.5, 3.5]) A(cyl(0.05, 0.05, 4.4, RX + sx, ry(z) + 2.2, z, 6), dwood, true); }
  // finish line, straw bales, tyres, a fence
  A(quad([RX - 2.7, ry(-2) + 0.05, -2], [RX + 2.7, ry(-2) + 0.05, -2], [RX + 2.7, ry(-2.8) + 0.05, -2.8], [RX - 2.7, ry(-2.8) + 0.05, -2.8], 3, 1), lam("jCheck2", () => ({ map: tiled(P.checkerTex(), 1, 1) })));
  for (const [dx, z] of [[-3.3, -1], [3.4, -1.6], [-3.4, 3], [3.3, 4], [-3.2, -9], [3.5, -12]]) { const c = new THREE.CylinderGeometry(0.42, 0.42, 0.9, 12); c.rotateZ(Math.PI / 2); c.translate(RX + dx, ry(z) + 0.42, z); A(c, col("bale", "#e6c45a"), true); }
  for (const [dx, z] of [[-3.3, -5], [3.3, -7.5], [3.4, 1.2]]) { const t = new THREE.TorusGeometry(0.28, 0.11, 6, 14); t.rotateY(Math.PI / 2); t.translate(RX + dx, ry(z) + 0.39, z); A(t, col("tyre", "#2c2a38"), true); }
  for (let i = 0; i < 26; i++) { const z = -26 - i * 0.55, x = RX - 3.3; A(box(x - 0.03, ry(z), z - 0.14, x + 0.03, ry(z) + 0.85, z + 0.14), white, true); }
  boat(RX - 9, 0, 55, 0.4, "#f25c7a", "#f7f5ee"); boat(RX + 12, 0, 54, -0.3, "#f6d24a", "#1f8a3a");
}
