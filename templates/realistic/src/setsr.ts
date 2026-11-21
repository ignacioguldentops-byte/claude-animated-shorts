// 3D sets of "La trastienda": today's stadium, calle de Alcalá in 1902 with the cloth shop, the shop and its back room,
// the waste ground by the old bullring with its tavern, a map on a desk, a London pitch, and the racecourse of the
// coronation tournament. Boxes, ribbons and painted textures; the ink pass draws the geometry edges.
import * as THREE from "three";
import { NOINK } from "./ink";
import { lam, add, box, ground, wall, ceil, repT } from "./kit";
import * as P from "./paintj";
import * as Q from "./paintk";
import * as T from "./paintr";

export const SX = 3000;    // the street: runs along x, the shop on the north side (z = -12) at x = SX
export const IX = 6000;    // the shop: x +-5.5, z -4..3.2 (open towards +z)
export const BX = IX + 30; // the back room: x +-4.2, z -3.6..3
export const MX = IX + 60; // the desk with the map
export const FX = 9000;    // the waste ground: goals at x = FX +- 30, the bullring to the north, the tavern to the north-east
export const LX = 12000;   // London
export const HPX = 15000;  // the racecourse: pitch 100 x 64 along x, the grandstand on the north side
export const PL = 52.5, PW = 34;       // today's pitch, half length and half width
export const HL = 50, HW = 32;         // the 1902 pitch
export const SEATS = { z0: 43, y0: 1.74, dy: 0.544, rows: 5 }; // the block of real seats in the south stand (x +-9)
export const LAMP_MATS: THREE.MeshBasicMaterial[] = [];
const hot = (c: [number, number, number]) => { const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(...c) }); LAMP_MATS.push(m); (m.userData as { hot: [number, number, number] }).hot = c; return m; };
const cyl = (r0: number, r1: number, h: number, x: number, y: number, z: number, seg = 12) => { const g = new THREE.CylinderGeometry(r0, r1, h, seg, 1); g.translate(x, y, z); return g; };
const cylX = (r: number, len: number, x: number, y: number, z: number, seg = 16) => { const g = new THREE.CylinderGeometry(r, r, len, seg); g.rotateZ(Math.PI / 2); g.translate(x, y, z); return g; };
const cylZ = (r: number, len: number, x: number, y: number, z: number, seg = 16) => { const g = new THREE.CylinderGeometry(r, r, len, seg); g.rotateX(Math.PI / 2); g.translate(x, y, z); return g; };
const sph = (r: number, x: number, y: number, z: number, sx = 1, sy = 1, sz = 1, seg = 14) => { const g = new THREE.SphereGeometry(r, seg, Math.max(6, Math.round(seg * 0.7))); g.scale(sx, sy, sz); g.translate(x, y, z); return g; };
const tiled = (t: THREE.Texture, x: number, y: number) => { const c = t.clone(); c.wrapS = c.wrapT = THREE.RepeatWrapping; c.repeat.set(x, y); c.anisotropy = 8; c.needsUpdate = true; return c; };
const col = (key: string, c: string, x: THREE.MeshStandardMaterialParameters = {}) => lam("r_" + key + c, () => ({ color: c, ...x }));
const rbox = (w: number, h: number, d: number, rx: number, ry2: number, rz: number, x: number, y: number, z: number) => { const g = new THREE.BoxGeometry(w, h, d); g.rotateX(rx); g.rotateZ(rz); g.rotateY(ry2); g.translate(x, y, z); return g; };
const quad = (a: number[], b: number[], c: number[], d: number[], tu = 1, tv = 1, u0 = 0) => {
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute([...a, ...b, ...c, ...d], 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute([u0, 0, u0 + tu, 0, u0 + tu, tv, u0, tv], 2)); g.setIndex([0, 1, 2, 0, 2, 3]); g.computeVertexNormals(); return g;
};
const tri = (a: number[], b: number[], c: number[]) => { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute([...a, ...b, ...c], 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 1, 0, 0.5, 1], 2)); g.setIndex([0, 1, 2]); g.computeVertexNormals(); return g; };
const rod = (p: number[], q: number[], rad: number, seg = 6) => { const a = new THREE.Vector3(p[0], p[1], p[2]), b = new THREE.Vector3(q[0], q[1], q[2]), d = b.clone().sub(a), g = new THREE.CylinderGeometry(rad, rad, d.length(), seg, 1);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize())); g.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2); return g; };
const ring = (r0: number, r1: number, x: number, y: number, z: number, a0 = 0, a1 = Math.PI * 2) => { const g = new THREE.RingGeometry(r0, r1, 48, 1, a0, a1 - a0); g.rotateX(-Math.PI / 2); g.translate(x, y, z); return g; };

export type Tint = { m: THREE.MeshBasicMaterial; day: [number, number, number]; golden: [number, number, number]; night: [number, number, number] };
export type Refs = {
  tints: Tint[]; crowds: THREE.Texture[]; flags: THREE.Object3D[]; crowns: THREE.Object3D[];
  stadium: THREE.Group; street: THREE.Group; shop: THREE.Group; field: THREE.Group; london: THREE.Group; hipo: THREE.Group;
  tram: THREE.Group; cloth: THREE.Object3D; cups: THREE.Group; deed: THREE.Object3D; sagBall: THREE.Object3D;
};
export const newRefs = (): Refs => ({ tints: [], crowds: [], flags: [], crowns: [], stadium: new THREE.Group(), street: new THREE.Group(), shop: new THREE.Group(), field: new THREE.Group(), london: new THREE.Group(), hipo: new THREE.Group(),
  tram: new THREE.Group(), cloth: new THREE.Group(), cups: new THREE.Group(), deed: new THREE.Group(), sagBall: new THREE.Group() });
const NETM: THREE.MeshBasicMaterial[] = [];
const white = () => col("white", "#fbfaf2"), iron = () => col("iron", "#2c2a38"), dwood = () => col("dw", "#5a3320"), brass = () => col("brass", "#e8c45a");
const PEN = ["#e2453c", "#f6c419", "#3f8fc9", "#fbfaf2", "#57a05a", "#f29a2e"];
/** makers shared by the sets (each bound to one group) */
const kit = (Gp: THREE.Group, refs: Refs) => {
  const A = (g: THREE.BufferGeometry, m: THREE.Material, cast = false) => add(Gp, g, m, cast);
  const W = white(), I = iron();
  const line = lam("rLine", () => ({ color: "#fbfaf2", polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }));
  /** a pennant on a pole; it sways (refs.flags) */
  const pennant = (x: number, y: number, z: number, h: number, w: number, c: string, ry = 0) => { A(cyl(0.05, 0.07, h, x, y + h / 2, z, 6), W, false);
    const F = new THREE.Group(); F.position.set(x, y + h - w * 0.36, z); F.rotation.y = ry; Gp.add(F); refs.flags.push(F); add(F, tri([0, w * 0.3, 0], [0, -w * 0.3, 0], [w, 0, 0]), col("pen", c, { side: THREE.DoubleSide }), false); return F; };
  const leaf = [col("tree0", "#3f8a3a"), col("tree1", "#57a05a"), col("tree2", "#2f7a4a"), col("tree3", "#6fb24e"), col("tree4", "#8fb85a")], bark = col("bark", "#6a4a32");
  const tree = (x: number, z: number, h: number, k: number, slim = false) => { A(cyl(h * 0.03, h * 0.045, h * 0.5, x, h * 0.25, z, 7), bark, false); const m = leaf[k % 5];
    if (slim) { A(sph(h * 0.16, x, h * 0.62, z, 1, 2.5, 1, 9), m, true); return; }
    A(sph(h * 0.3, x, h * 0.66, z, 1.15, 0.9, 1.15, 10), m, true); A(sph(h * 0.22, x + h * 0.2, h * 0.56, z + h * 0.08, 1, 0.9, 1, 9), m, false); A(sph(h * 0.2, x - h * 0.18, h * 0.6, z - h * 0.1, 1, 0.9, 1, 9), m, false); A(sph(h * 0.17, x + h * 0.04, h * 0.84, z - h * 0.03, 1, 0.9, 1, 9), m, false); };
  /** pitch markings for a pitch centred on cx: outline, halfway line, centre circle, both areas, spots */
  const marks = (cx: number, L: number, Wd: number, w = 0.14) => { const y = 0.014, G = (x0: number, x1: number, z0: number, z1: number) => A(ground(cx + x0, cx + x1, z0, z1, y), line);
    G(-L - w / 2, L + w / 2, -Wd - w / 2, -Wd + w / 2); G(-L - w / 2, L + w / 2, Wd - w / 2, Wd + w / 2); for (const x of [-L, 0, L]) G(x - w / 2, x + w / 2, -Wd, Wd);
    A(ring(9.15 - w / 2, 9.15 + w / 2, cx, y, 0), line); A(ring(0, 0.22, cx, y, 0), line);
    for (const sd of [-1, 1]) { for (const [d, hw] of [[16.5, 20.16], [5.5, 9.16]]) { G(Math.min(sd * L, sd * (L - d)), Math.max(sd * L, sd * (L - d)), -hw - w / 2, -hw + w / 2); G(Math.min(sd * L, sd * (L - d)), Math.max(sd * L, sd * (L - d)), hw - w / 2, hw + w / 2); G(sd * (L - d) - w / 2, sd * (L - d) + w / 2, -hw, hw); }
      A(ring(0, 0.2, cx + sd * (L - 11), y, 0), line); } };
  /** a goal on the line x: posts, bar and a net falling away behind (sd = +1: the net goes towards +x) */
  const goal = (x: number, sd: number, net = true, wood = false) => { const pm = wood ? col("post", "#c9a86a") : W, r = wood ? 0.07 : 0.06;
    for (const z of [-3.66, 3.66]) A(cyl(r, r, 2.44, x, 1.22, z, 10), pm, true); A(cylZ(r, 7.44, x, 2.44, 0, 10), pm, true);
    if (!net) return; const nm = NETM[0] ?? (NETM[0] = new THREE.MeshBasicMaterial({ map: tiled(T.netTex(), 3, 1.2), alphaTest: 0.4, side: THREE.DoubleSide, color: new THREE.Color(0.95, 0.95, 0.95) })), nmS = NETM[1] ?? (NETM[1] = new THREE.MeshBasicMaterial({ map: tiled(T.netTex(), 0.9, 1.2), alphaTest: 0.4, side: THREE.DoubleSide, color: new THREE.Color(0.95, 0.95, 0.95) })), d = 2.0 * sd;
    A(quad([x + d, 0, -3.66], [x + d, 0, 3.66], [x + d * 0.4, 2.44, 3.66], [x + d * 0.4, 2.44, -3.66]), nm); A(quad([x, 2.44, -3.66], [x, 2.44, 3.66], [x + d * 0.4, 2.44, 3.66], [x + d * 0.4, 2.44, -3.66]), nmS);
    for (const z of [-3.66, 3.66]) { A(quad([x, 0, z], [x + d, 0, z], [x + d * 0.4, 2.44, z], [x, 2.44, z]), nmS); A(rod([x + d * 0.4, 2.44, z], [x + d, 0, z], 0.03), pm); A(rod([x, 2.44, z], [x + d * 0.4, 2.44, z], 0.03), pm); } };
  /** a gas lamp post with a glowing lantern */
  const gasLamp = (x: number, z: number, h = 4.2) => { A(cyl(0.06, 0.11, h, x, h / 2, z, 8), I, true); A(cyl(0.16, 0.16, 0.1, x, 0.05, z, 8), I); A(rbox(0.9, 0.05, 0.05, 0, 0, 0, x, h * 0.86, z), I);
    const gl = new THREE.Mesh(cyl(0.2, 0.13, 0.46, x, h + 0.25, z, 6), hot([2.6, 2.1, 1.2])); gl.layers.set(NOINK); Gp.add(gl); const cp = new THREE.ConeGeometry(0.3, 0.26, 6); cp.translate(x, h + 0.61, z); A(cp, I); };
  /** hills on the horizon */
  const hills = (cx: number, cz: number, th0: number, tint: [number, number, number]) => { const m = new THREE.MeshBasicMaterial({ map: tiled(P.hillsTex(), 1.4, 1), alphaTest: 0.5, side: THREE.BackSide, fog: false });
    const c = new THREE.Mesh(new THREE.CylinderGeometry(430, 430, 150, 64, 1, true, th0, Math.PI * 2), m); c.position.set(cx, 70, cz); c.layers.set(NOINK); Gp.add(c); refs.tints.push({ m, day: tint, golden: [1.1 * tint[0], 0.82 * tint[1], 0.66 * tint[2]], night: [0.3, 0.38, 0.7] }); };
  /** a hazy skyline cut-out on a wall from (x0, z0) to (x1, z1) */
  const skyline = (k: number, x0: number, z0: number, x1: number, z1: number, h: number, tint: [number, number, number] = [1, 1, 1], tu = 1) => { const m = new THREE.MeshBasicMaterial({ map: tiled(T.skylineTex(k), tu, 1), transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, fog: true });
    const w = new THREE.Mesh(wall(x0, z0, x1, z1, 0, h), m); w.layers.set(NOINK); Gp.add(w); refs.tints.push({ m, day: tint, golden: [1.1 * tint[0], 0.85 * tint[1], 0.7 * tint[2]], night: [0.3, 0.38, 0.7] }); };
  return { A, W, I, pennant, tree, marks, goal, gasLamp, hills, skyline };
};

// ---------------- today's stadium ----------------
export function buildStadium(R: THREE.Object3D, refs: Refs) {
  const Gp = refs.stadium; R.add(Gp); const { A, W, I, marks, goal } = kit(Gp, refs);
  A(ground(-75, 75, -52, 52, 0, 150 / 11, 104 / 11), lam("rTurf", () => ({ map: repT(T.turfTex()) })));
  marks(0, PL, PW); goal(-PL, -1); goal(PL, 1);
  // advertising boards and the track behind them
  const bm = (n: number) => lam("rBoard" + n, () => ({ map: tiled(T.boardTex(), n, 1), side: THREE.DoubleSide }));
  A(wall(-58, -38.5, 58, -38.5, 0, 1, 10, 1), bm(10)); A(wall(58, 38.5, -58, 38.5, 0, 1, 10, 1), bm(10)); A(wall(-58, 38.5, -58, -38.5, 0, 1, 6, 1), bm(6)); A(wall(58, -38.5, 58, 38.5, 0, 1, 6, 1), bm(6));
  // the bowl: a rounded rectangle resampled evenly along its edge
  const N = 72, fine: number[][] = [], A0 = 61, B0 = 41;
  for (let i = 0; i <= 720; i++) { const a = (i / 720) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a); fine.push([Math.sign(c) * Math.sqrt(Math.abs(c)), Math.sign(s) * Math.sqrt(Math.abs(s))]); }
  const len: number[] = [0]; for (let i = 1; i <= 720; i++) len.push(len[i - 1] + Math.hypot((fine[i][0] - fine[i - 1][0]) * (A0 + 10), (fine[i][1] - fine[i - 1][1]) * (B0 + 10)));
  const U: number[][] = []; { let j = 0; for (let i = 0; i <= N; i++) { const t = (i / N) * len[720]; while (j < 719 && len[j + 1] < t) j++; const k = (t - len[j]) / Math.max(1e-6, len[j + 1] - len[j]); U.push([fine[j][0] + (fine[j + 1][0] - fine[j][0]) * k, fine[j][1] + (fine[j + 1][1] - fine[j][1]) * k]); } }
  const p = (i: number, off: number, y: number) => [U[i][0] * (A0 + off), y, U[i][1] * (B0 + off)];
  const crowd = tiled(Q.crowd39Tex(3), 1, 1); refs.crowds.push(crowd);
  const cm = lam("rCrowd", () => ({ map: crowd, side: THREE.DoubleSide })), conc = col("conc", "#3a4058", { side: THREE.DoubleSide }), dark = col("roofDark", "#1c2236", { side: THREE.DoubleSide }), steel = col("steel", "#c9d2de", { side: THREE.DoubleSide });
  const du = len[720] / N / 20;
  for (let i = 0; i < N; i++) { const j = i + 1, u0 = i * du;
    A(quad(p(j, 2, 1.2), p(i, 2, 1.2), p(i, 20, 11), p(j, 20, 11), du, 1, u0), cm);                          // lower tier
    A(quad(p(j, 2, 0), p(i, 2, 0), p(i, 2, 1.2), p(j, 2, 1.2)), conc);
    A(quad(p(j, 20, 11), p(i, 20, 11), p(i, 18.5, 15.5), p(j, 18.5, 15.5)), conc);                            // the ring of boxes
    { const g = new THREE.Mesh(quad(p(j, 19.6, 12.2), p(i, 19.6, 12.2), p(i, 19.2, 13.6), p(j, 19.2, 13.6)), hot([2.4, 2.0, 1.4])); g.layers.set(NOINK); Gp.add(g); }
    A(quad(p(j, 18.5, 15.5), p(i, 18.5, 15.5), p(i, 40, 35), p(j, 40, 35), du, 1, u0 + 0.37), cm);            // upper tier
    A(quad(p(j, 40, 35), p(i, 40, 35), p(i, 40, 46), p(j, 40, 46)), dark);
    A(quad(p(j, 4, 42), p(i, 4, 42), p(i, 44, 47), p(j, 44, 47)), dark);                                     // the roof
    A(quad(p(j, 4, 42), p(i, 4, 42), p(i, 4, 43.2), p(j, 4, 43.2)), steel);
    { const g = new THREE.Mesh(quad(p(j, 5, 41.9), p(i, 5, 41.9), p(i, 8.5, 42.3), p(j, 8.5, 42.3)), hot([5, 5, 4.6])); g.layers.set(NOINK); Gp.add(g); }
    if (i % 6 === 0) A(rod(p(i, 40, 35), p(i, 6, 42.4), 0.25), steel);
    if (i % 9 === 4) { const g = new THREE.Mesh(quad(p(j, 19, 15.6), p(i, 19, 15.6), p(i, 19, 17.4), p(j, 19, 17.4)), hot([1.2, 1.6, 3.2])); g.layers.set(NOINK); Gp.add(g); } // screens, no picture
  }
  // a block of real seats at the front of the south stand, for the close shots
  { const { z0, y0, dy, rows } = SEATS, sm = lam("rSeat", () => ({ map: tiled(T.seatTex(), 3, 1), side: THREE.DoubleSide }));
    A(box(-9.4, 0, z0 - 1.6, 9.4, y0 - 0.5, z0 - 0.5), col("blockFront", "#1f2f5c"), false); A(box(-9.4, y0 - 0.95, z0 - 1.62, 9.4, y0 - 0.8, z0 - 1.6), brass(), false); { const g = new THREE.Mesh(box(-9.4, 0.25, z0 - 1.62, 9.4, 0.5, z0 - 1.6), hot([2.2, 2.2, 2.6])); g.layers.set(NOINK); Gp.add(g); } A(box(-9.4, y0 - 0.5, z0 - 0.62, 9.4, y0 + 0.08, z0 - 0.5), col("blockFront", "#1f2f5c"), false); A(box(-9.4, y0 + 0.08, z0 - 0.64, 9.4, y0 + 0.14, z0 - 0.48), col("railTop", "#e9eef4"), false);
    ["#fbfaf2", "#6a4c9a", "#fbfaf2", "#e8c45a", "#fbfaf2", "#1f2f5c", "#fbfaf2", "#6a4c9a", "#fbfaf2", "#e8c45a"].forEach((c, i) => { const x = -8.3 + i * 1.84; A(box(x - 0.7, y0 - 0.42, z0 - 0.66, x + 0.7, y0 + 0.06, z0 - 0.64), col("banner", c), false); if (c === "#fbfaf2") A(box(x - 0.7, y0 - 0.24, z0 - 0.665, x + 0.7, y0 - 0.14, z0 - 0.66), col("banner", i % 4 ? "#1f2f5c" : "#e8c45a"), false); });
    for (let r = 0; r < rows; r++) { const y = y0 + r * dy, z = z0 + r; A(box(-9.4, 0, z - 0.5, 9.4, y, z + 0.5), conc, false); A(wall(9.4, z + 0.36, -9.4, z + 0.36, y + 0.12, y + 1.0, 1, 1), sm); A(box(-9.4, y + 0.38, z - 0.1, 9.4, y + 0.46, z + 0.34), col("seatPan", "#2f4fa8"), false); }
    for (const x of [-9.4, 9.4]) for (let r = 0; r < rows; r++) A(box(x - 0.6, 0, z0 + r - 0.5, x + 0.6, y0 + r * dy - 0.25, z0 + r + 0.5), col("stair", "#c9d2de"), false);
  }
  // the long table of cups on the grass
  { const C = refs.cups; Gp.add(C); add(C, box(-10.5, 0, -0.7, 10.5, 0.5, 0.7), col("podium", "#fbfaf2"), true); add(C, box(-10.6, 0.5, -0.8, 10.6, 0.57, 0.8), col("podiumTop", "#1f2f5c"), true); add(C, box(-10.52, 0.2, 0.7, 10.52, 0.3, 0.72), brass()); add(C, box(-10.4, 0, -2.6, 10.4, 0.32, -1.5), col("riser", "#e9eef4"), true); add(C, box(-11.6, 0, -1.9, 11.6, 0.12, 1.9), col("carpet", "#1f2f5c"), false); }
  void [W, I];
}

// ---------------- calle de Alcalá, 1902 ----------------
export function buildStreet(R: THREE.Object3D, refs: Refs) {
  const Gp = refs.street; R.add(Gp); const { A, W, I, tree, gasLamp, pennant } = kit(Gp, refs);
  A(ground(SX - 260, SX + 260, -7, 7, 0, 520 / 6, 14 / 6), lam("rSetts", () => ({ map: repT(T.setsTex()) })));
  for (const z of [-2.3, -0.9, 0.9, 2.3]) A(box(SX - 260, 0, z - 0.04, SX + 260, 0.02, z + 0.04), col("rail", "#4a4654"), false);
  const pave = lam("rPave", () => ({ map: repT(T.paveTex()) }));
  for (const sd of [-1, 1]) { A(box(SX - 260, 0, sd > 0 ? 7 : -12, SX + 120, 0.16, sd > 0 ? 12 : -7, 4), pave, false); }
  A(ground(SX + 120, SX + 320, -90, 90, 0.004, 200 / 6, 180 / 6), pave); A(ground(SX - 260, SX + 120, -90, -12, 0.002, 60, 12), pave); A(ground(SX - 260, SX + 120, 12, 90, 0.002, 60, 12), pave);
  // the houses: ground floor of shops, floors of balconies, a slate mansard
  const mans = lam("rMans", () => ({ map: repT(T.mansardTex()), side: THREE.DoubleSide }));
  const TINT = ["#ffffff", "#ffe0c0", "#ffd2bc", "#eaf2d8", "#fbe9b0", "#e2ecf8", "#ffd9d0", "#f4f0e0"];
  const house = (cx: number, w: number, floors: number, k: number, sd: number, shop = false) => { const tint = TINT[(k * 3 + (sd > 0 ? 1 : 0)) % 8], z = sd * 12, x0 = cx - w / 2, x1 = cx + w / 2, h = 5.2 + floors * 4, a = sd < 0 ? x0 : x1, b = sd < 0 ? x1 : x0, tu = Math.max(1, Math.round(w / 12));
    A(box(x0, 0, sd < 0 ? z - 14 : z, x1, h + 2.2, sd < 0 ? z : z + 14), col("core", "#d8c8b0"), true);
    A(wall(a, z - sd * 0.02, b, z - sd * 0.02, 0, 5.2, shop ? 1 : tu, 1), shop ? lam("rShopF", () => ({ map: T.shopTex(), side: THREE.DoubleSide })) : lam("rArc" + (k % 4) + tu, () => ({ map: tiled(T.arcadeTex(k % 4), tu, 1), side: THREE.DoubleSide })));
    if (k % 3 === 0 && !shop) { const dx = (k % 2 ? x0 + 2.6 : x1 - 2.6), dz = z + sd * 2.6, sl = col("slate", "#5f6f86"); A(cyl(2.4, 2.4, 3.2, dx, h + 4.2, dz, 14), col("drum", "#f4ecd6"), true); A(sph(2.6, dx, h + 5.8, dz, 1, 1.15, 1, 14), sl, true); A(cyl(0.5, 0.6, 1.3, dx, h + 9.2, dz, 8), col("drum", "#f4ecd6"), true); const sp = new THREE.ConeGeometry(0.6, 2.2, 8); sp.translate(dx, h + 10.9, dz); A(sp, sl, true); }
    A(wall(a, z - sd * 0.02, b, z - sd * 0.02, 5.2, h, tu, floors), lam("rMadF" + (k % 6) + tu + floors + tint, () => ({ map: tiled(T.madridTex(k % 6), tu, floors), side: THREE.DoubleSide, color: tint })));
    A(box(x0 - 0.2, h - 0.25, z - sd * 0.6, x1 + 0.2, h + 0.1, z + sd * 0.2), col("cornice", "#f4ecd6"), true);
    A(quad([a, h, z], [b, h, z], [b, h + 3, z + sd * 1.6], [a, h + 3, z + sd * 1.6], tu, 1), mans, true);
    for (let x = x0 + 3; x < x1 - 1; x += 7) A(box(x - 0.5, h + 3, z + sd * 3, x + 0.5, h + 5.2, z + sd * 4), col("chimney", "#b5563a"), true); };
  let k = 0; const row = (sd: number, x: number, list: [number, number][]) => { for (const [w, fl] of list) { if (!(sd < 0 && Math.abs(x + w / 2 - SX) < 1)) house(x + w / 2, w, fl, k++, sd); else house(SX, w, fl, 2, sd, true); x += w + 0.01; } };
  row(-1, SX - 246.08, [[36, 4], [24, 3], [36, 5], [24, 4], [36, 3], [24, 4], [36, 5], [24, 3], [12, 3], [24, 5], [36, 4], [24, 3], [36, 4]]);
  row(1, SX - 252, [[24, 4], [36, 3], [24, 5], [36, 4], [24, 3], [36, 5], [36, 4], [24, 3], [36, 5], [24, 4], [36, 3], [12, 4]]);
  // the shop's own dressing: a hanging sign, two lamps by the door, bolts of cloth on a trestle, a bench
  { const z = -12; A(rbox(0.06, 0.06, 1.3, 0, 0, 0, SX - 6.4, 4.4, z + 0.65), I); A(cylZ(0.5, 0.06, SX - 6.4, 3.7, z + 1.05, 20), brass(), true); A(cylZ(0.36, 0.08, SX - 6.4, 3.7, z + 1.05, 20), col("signIn", "#1f4a3a"));
    for (const dx of [-2.9, 2.9]) { A(rbox(0.05, 0.05, 0.5, 0, 0, 0, SX + dx, 3.3, z + 0.25), I); const gl = new THREE.Mesh(cyl(0.16, 0.1, 0.36, SX + dx, 3.05, z + 0.5, 6), hot([2.6, 2.1, 1.2])); gl.layers.set(NOINK); Gp.add(gl); }
    A(box(SX - 5.6, 0.16, z + 0.5, SX - 3.6, 0.9, z + 1.3), col("trestle", "#8a5a34"), true); ["#e2453c", "#f6c419", "#3f8fc9", "#fbfaf2", "#57a05a"].forEach((c, i) => A(cylX(0.13, 1.7, SX - 4.6, 1.03 + (i > 2 ? 0.24 : 0), z + 0.66 + (i > 2 ? (i - 3) * 0.28 + 0.12 : i * 0.26), 10), col("bolt", c), true));
    A(box(SX + 3.7, 0.56, z + 0.5, SX + 5.5, 0.62, z + 0.95), col("bench", "#8a5a34"), true); for (const dx of [3.8, 5.4]) A(box(SX + dx - 0.04, 0.16, z + 0.52, SX + dx + 0.04, 0.56, z + 0.93), I); }
  // lamps, trees in their grilles, the tram wire
  for (let x = SX - 248; x < SX + 116; x += 16) { gasLamp(x, -7.5); gasLamp(x + 8, 7.5); }
  for (let x = SX - 236; x < SX + 110; x += 24) { if (Math.abs(x - SX) > 9) tree(x + 4, -9.6, 7.5, (x / 24) | 0); tree(x - 8, 9.6, 8, ((x / 24) | 0) + 2); }
  for (let x = SX - 250; x < SX + 130; x += 30) { A(cyl(0.07, 0.1, 6.6, x, 3.3, -7.3, 6), I, true); A(rod([x, 6.4, -7.3], [x, 6.2, 1.6], 0.03), I); }
  A(rod([SX - 260, 6.2, 1.6], [SX + 140, 6.2, 1.6], 0.025), I);
  { const bunt = lam("rBuntS", () => ({ map: tiled(Q.buntingTex(), 5, 1), alphaTest: 0.5, side: THREE.DoubleSide })); for (let x = SX - 236; x < SX + 116; x += 22) { A(wall(x, -12, x, 12, 9.0, 9.9, 1, 1), bunt, false); A(rod([x, 9.9, -12], [x, 9.9, 12], 0.02), I); } }
  // the tram
  { const Tm = refs.tram; Gp.add(Tm); const tm = lam("rTram", () => ({ map: T.tramTex(), alphaTest: 0.5, side: THREE.DoubleSide }));
    add(Tm, box(-3.1, 0.55, -1.0, 3.1, 2.9, 1.0), col("tramBody", "#f4e6c0"), true); add(Tm, wall(-3.2, 1.02, 3.2, 1.02, 0.45, 2.95), tm); add(Tm, wall(3.2, -1.02, -3.2, -1.02, 0.45, 2.95), tm);
    add(Tm, box(-3.5, 2.9, -1.15, 3.5, 3.05, 1.15), col("tramRoof", "#c9a86a"), true); add(Tm, box(-3.7, 0.4, -0.9, -3.1, 1.5, 0.9), col("tramEnd", "#9a2a2a"), true); add(Tm, box(3.1, 0.4, -0.9, 3.7, 1.5, 0.9), col("tramEnd", "#9a2a2a"), true);
    for (const x of [-1.8, 1.8]) for (const z of [-0.9, 0.9]) add(Tm, cylZ(0.42, 0.12, x, 0.42, z, 14), I, true); add(Tm, rod([0, 3.05, 0], [-2.2, 6.2, 0.1], 0.03), I); const lampT = new THREE.Mesh(sph(0.16, 3.72, 1.9, 0, 0.5, 1, 1, 8), hot([2.6, 2.2, 1.4])); lampT.layers.set(NOINK); Tm.add(lampT); }
  // the plaza at the east end: the stone gate, trees, a fountain
  { const gx = SX + 200; const m = lam("rGate", () => ({ map: T.gateTex(), alphaTest: 0.5, side: THREE.DoubleSide })); A(wall(gx, -24, gx, 24, 0, 24), m, true);
    for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; tree(gx - 20 + 62 * Math.cos(a) * 0.8, 70 * Math.sin(a), 11 + (i % 3) * 2, i); }
    A(cyl(5, 5.4, 0.7, SX + 150, 0.35, 0, 24), col("fount", "#e6dccb"), true); A(cyl(4.6, 4.6, 0.1, SX + 150, 0.66, 0, 24), col("fountW", "#7fc4dc")); A(cyl(0.5, 0.8, 2.6, SX + 150, 1.6, 0, 10), col("fount", "#e6dccb"), true); A(sph(1.1, SX + 150, 3.2, 0, 1, 0.5, 1, 12), col("fount", "#e6dccb"), true);
    for (const [x, z, c] of [[SX + 126, -30, 0], [SX + 126, 30, 2], [SX + 176, -34, 4], [SX + 176, 34, 1]]) pennant(x, 0, z, 9, 2.2, PEN[c], 0.6); }
  void W;
}

// ---------------- the shop, its back room, the desk with the map ----------------
export function buildShop(R: THREE.Object3D, refs: Refs) {
  const Gp = refs.shop; R.add(Gp); const { A, W, I } = kit(Gp, refs);
  const floor = lam("rFloor", () => ({ map: repT(P.plankTex("rf", "#a8733e")) })), shelf = (tu: number) => lam("rShelf" + tu, () => ({ map: tiled(T.shelfTex(), tu, 1), side: THREE.DoubleSide })), wood = lam("rCounter", () => ({ map: repT(P.plankTex("rc", "#6a3e22")) })), top = lam("rTop", () => ({ map: repT(P.plankTex("rt", "#b8834a")) }));
  const BOLTS = ["#e2453c", "#f6c419", "#3f8fc9", "#57a05a", "#f25c7a", "#f29a2e", "#7a5a9a", "#2fb0a0", "#1f2f5c", "#b5563a", "#e9dcc6", "#8a2a4a"], bolt = (c: string) => col("bolt", c);
  const lampH = (x: number, y: number, z: number) => { A(cyl(0.012, 0.012, 3.4 - y, x, (3.4 + y) / 2, z, 5), I); const cn = new THREE.ConeGeometry(0.34, 0.22, 12, 1, true); cn.translate(x, y + 0.08, z); A(cn, col("shade", "#2f6a4a", { side: THREE.DoubleSide })); const gl = new THREE.Mesh(sph(0.13, x, y - 0.04, z, 1, 1, 1, 10), hot([3.2, 2.6, 1.5])); gl.layers.set(NOINK); Gp.add(gl); };
  const pile = (x: number, z: number, n: number, k: number, along = true) => { let i = 0; for (let lv = 0; lv < 3 && i < n; lv++) for (let j = 0; j < 3 - lv && i < n; j++, i++) { const off = (j - (2 - lv) / 2) * 0.3; A(along ? cylX(0.14, 1.5, x, 0.14 + lv * 0.25, z + off, 10) : cylZ(0.14, 1.5, x + off, 0.14 + lv * 0.25, z, 10), bolt(BOLTS[(k + i * 5) % 12]), true); } };
  // --- the shop ---
  { const x0 = IX - 5.5, x1 = IX + 5.5;
    A(ground(x0, x1, -4, 4.2, 0, 11 / 2, 8.2 / 2), floor); A(ceil(x0, x1, -4, 4.2, 3.4), col("ceil", "#f1e3c4")); A(wall(x0, -4, x1, -4, 0, 3.2, 11 / 4, 1), shelf(2.75)); A(wall(x0, 4.2, x0, -4, 0, 3.2, 2, 1), shelf(2)); A(wall(x1, -4, x1, 4.2, 0, 3.2, 2, 1), shelf(2));
    for (const [a, b, c, d] of [[x0, -4, x1, -4], [x0, 4.2, x0, -4], [x1, -4, x1, 4.2]]) A(wall(a, b, c, d, 3.2, 3.4), col("cornice", "#7a4a2c"));
    // the doorway to the back room, with its curtain
    A(box(IX + 3.4, 0, -4.02, IX + 4.9, 2.5, -3.9), col("doorway", "#1c1420"), false); A(box(IX + 3.3, 0, -3.92, IX + 3.42, 2.6, -3.84), dwood()); A(box(IX + 4.88, 0, -3.92, IX + 5.0, 2.6, -3.84), dwood()); A(box(IX + 3.3, 2.5, -3.92, IX + 5.0, 2.62, -3.84), dwood());
    for (let i = 0; i < 5; i++) A(cyl(0.09, 0.11, 2.3, IX + 3.56 + i * 0.16, 1.3, -3.83, 6), col("curtain", i % 2 ? "#8a2a3a" : "#a8323e"), false);
    // the counter
    A(box(IX - 3.8, 0, -2.0, IX + 1.8, 0.92, -1.1, 1), wood, true); A(box(IX - 3.9, 0.92, -2.08, IX + 1.9, 0.98, -1.02, 1), top, true); for (let x = IX - 3.5; x < IX + 1.6; x += 1.06) A(box(x, 0.14, -1.09, x + 0.86, 0.8, -1.07), col("panel", "#7a4a2c"));
    // on the counter: bolts, the till, shears, a measuring stick
    [[-3.2, "#3f8fc9"], [-3.2, "#f6c419"], [0.9, "#e2453c"], [0.9, "#57a05a"], [0.9, "#f25c7a"]].forEach(([dx, c], i) => A(cylX(0.12, 1.2, IX + (dx as number), 1.1 + (i === 1 || i === 4 ? 0.22 : 0), i === 1 ? -1.6 : i === 4 ? -1.57 : -1.72 + (i === 3 ? 0.26 : 0), 10), bolt(c as string), true));
    A(box(IX + 0.0, 0.98, -1.86, IX + 0.5, 1.3, -1.46), brass(), true); A(box(IX + 0.04, 1.3, -1.82, IX + 0.46, 1.46, -1.64), col("till", "#c9a24a"), true); A(box(IX - 1.9, 0.985, -1.2, IX - 0.9, 0.995, -1.16), col("rule", "#f1dca0"));
    // the bolt of white cloth and the length that rolls out of it along the counter
    A(cylZ(0.13, 0.9, IX - 2.5, 1.11, -1.55, 12), W, true); { const C = refs.cloth; C.position.set(IX - 2.5, 0.986, -1.55); Gp.add(C); const g = new THREE.BoxGeometry(1, 0.012, 0.86); g.translate(0.5, 0, 0); add(C, g, W, false); }
    // a dressmaker's form, the fitting stand with its mirror, a ladder on the shelves, piles of bolts
    { const mx = IX - 4.5, mz = -0.6; A(cyl(0.03, 0.03, 1.0, mx, 0.5, mz, 6), dwood()); A(cyl(0.26, 0.3, 0.06, mx, 0.03, mz, 10), dwood()); A(sph(0.27, mx, 1.3, mz, 1, 1.35, 0.72, 12), col("form", "#e9dcc6"), true); A(cyl(0.07, 0.07, 0.1, mx, 1.7, mz, 8), dwood()); }
    A(cyl(0.6, 0.66, 0.24, IX + 3.4, 0.12, 0.3, 20), col("stand", "#7a4a2c"), true); A(box(IX + 4.9, 0.2, -0.5, IX + 5.0, 2.3, 0.7), col("mirrorF", "#c9a24a"), true); A(box(IX + 4.86, 0.3, -0.4, IX + 4.9, 2.2, 0.6), col("mirror", "#cfe6f4"));
    for (const dx of [0, 0.5]) A(rod([IX - 0.6 + dx, 0, -3.2], [IX - 0.6 + dx, 3.1, -3.92], 0.03), dwood()); for (let i = 1; i < 8; i++) A(rod([IX - 0.6, i * 0.38, -3.2 - i * 0.088], [IX - 0.1, i * 0.38, -3.2 - i * 0.088], 0.022), dwood());
    pile(IX - 4.4, -3.0, 6, 0); pile(IX + 1.9, -3.2, 5, 3); pile(IX - 4.6, 1.6, 6, 7, false); pile(IX + 4.5, 2.2, 5, 5, false);
    A(ground(IX - 1.6, IX + 2.4, -0.4, 2.2, 0.01), lam("rRug", () => ({ map: T.rugTex(), polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })));
    lampH(IX - 2.4, 2.5, -0.9); lampH(IX + 1.6, 2.5, -0.9); lampH(IX - 0.4, 2.6, 1.6);
  }
  // --- the back room ---
  { const x0 = BX - 4.2, x1 = BX + 4.2, paper = (tu: number) => lam("rPaper" + tu, () => ({ map: tiled(T.paperTex(), tu, 1), side: THREE.DoubleSide }));
    A(ground(x0, x1, -3.6, 4, 0, 8.4 / 2, 7.6 / 2), floor); A(ceil(x0, x1, -3.6, 4, 3.0), col("ceil", "#f1e3c4")); A(wall(x0, -3.6, BX + 2.1, -3.6, 0, 3, 1.575, 1), shelf(1.575)); A(wall(BX + 2.1, -3.6, x1, -3.6, 0, 3, 0.7, 1), paper(0.7)); A(wall(x0, 4, x0, -3.6, 0, 3, 2, 1), shelf(2)); A(wall(x1, -3.6, x1, 4, 0, 3, 2.5, 1), paper(2.5));
    // the window on the yard, the door to the shop, pictures, the clock, the coat rack
    A(box(BX + 2.2, 0, -3.62, BX + 3.4, 2.4, -3.56), col("doorway", "#1c1420")); for (let i = 0; i < 4; i++) A(cyl(0.09, 0.11, 2.2, BX + 2.4 + i * 0.16, 1.2, -3.5, 6), col("curtain", i % 2 ? "#8a2a3a" : "#a8323e"));
    for (const [dz, k] of [[0.2, 0], [1.9, 1]]) A(wall(x1 - 0.02, dz - 0.4, x1 - 0.02, dz + 0.4, 1.75, 2.38), lam("rFrame" + k, () => ({ map: T.frameTex(k), side: THREE.DoubleSide })));
    // a line of lengths of cloth across the room, bolts stood on end in the corners and laid on the table
    ([[-3.7, -3.2, 0.12, 0], [-3.3, -3.3, -0.1, 3], [-2.9, -3.25, 0.06, 6], [1.75, -3.3, -0.08, 8], [-3.8, 2.3, 0.1, 5], [-3.4, 2.6, -0.12, 9]] as number[][]).forEach(([dx, dz, tl, k]) => { const g = new THREE.CylinderGeometry(0.13, 0.13, 1.6, 12); g.rotateZ(tl); g.translate(BX + dx, 0.82, dz); A(g, bolt(["#e2453c", "#f6c419", "#3f8fc9", "#57a05a", "#f25c7a", "#f29a2e", "#2fb0a0", "#fbfaf2", "#e9dcc6", "#b5563a"][k % 10]), true); });
    ([[-1.15, 0.32, "#3f8fc9"], [-1.15, 0.05, "#f6c419"], [-1.15, 0.19, "#e2453c"], [1.1, -0.3, "#fbfaf2"]] as [number, number, string][]).forEach(([dx, dz, c], i) => A(cylX(0.1, 0.6, BX + dx, 0.89 + (i === 2 ? 0.17 : 0), -0.9 + dz, 10), bolt(c), true));
    { const cx = x1 - 0.03, cz = -1.6; const face = new THREE.Mesh(new THREE.CircleGeometry(0.3, 24), lam("rClock", () => ({ map: Q.clockTex(), alphaTest: 0.5 }))); face.rotation.y = -Math.PI / 2; face.position.set(cx, 2.2, cz); Gp.add(face); A(box(cx - 0.02, 1.2, cz - 0.16, cx + 0.03, 1.9, cz + 0.16), dwood()); A(cyl(0.07, 0.07, 0.02, cx - 0.04, 1.36, cz, 10), brass()); }
    { const rx = x1 - 0.5, rz = 0.9; A(cyl(0.03, 0.03, 1.9, rx, 0.95, rz, 6), dwood()); A(cyl(0.22, 0.26, 0.05, rx, 0.03, rz, 10), dwood()); for (let i = 0; i < 4; i++) A(rod([rx, 1.75, rz], [rx + 0.2 * Math.cos(i * 1.57), 1.9, rz + 0.2 * Math.sin(i * 1.57)], 0.015), dwood());
      A(cyl(0.11, 0.12, 0.2, rx + 0.2, 2.0, rz, 12), col("hatB", "#23202a"), true); A(cyl(0.19, 0.19, 0.02, rx + 0.2, 1.9, rz, 14), col("hatB", "#23202a")); A(sph(0.12, rx - 0.2, 1.98, rz, 1, 0.8, 1, 10), col("hatC", "#5a4c40")); A(cyl(0.18, 0.18, 0.02, rx - 0.2, 1.92, rz, 14), col("hatC", "#5a4c40")); }
    // the table: green baize, the paper, ink, the oil lamp
    const tz = -0.9; A(box(BX - 1.5, 0.7, tz - 0.62, BX + 1.5, 0.78, tz + 0.62, 1), wood, true); A(box(BX - 1.42, 0.78, tz - 0.54, BX + 1.42, 0.79, tz + 0.54), col("baize", "#2f6a4a")); for (const dx of [-1.36, 1.36]) for (const dz of [-0.5, 0.5]) A(box(BX + dx - 0.05, 0, tz + dz - 0.05, BX + dx + 0.05, 0.7, tz + dz + 0.05), dwood());
    { const D = refs.deed; D.position.set(BX - 0.08, 0.795, tz + 0.12); Gp.add(D); const g = new THREE.PlaneGeometry(0.42, 0.58); g.rotateX(-Math.PI / 2); add(D, g, lam("rDeed", () => ({ map: T.deedTex() })), false); }
    A(cyl(0.05, 0.06, 0.08, BX + 0.42, 0.83, tz + 0.2, 10), col("ink", "#23202a"), true); A(cyl(0.11, 0.13, 0.05, BX - 1.0, 0.815, tz - 0.1, 12), brass(), true); A(cyl(0.05, 0.09, 0.16, BX - 1.0, 0.92, tz - 0.1, 10), brass()); { const gl = new THREE.Mesh(sph(0.1, BX - 1.0, 1.1, tz - 0.1, 0.8, 1.3, 0.8, 10), hot([3.4, 2.7, 1.4])); gl.layers.set(NOINK); Gp.add(gl); }
    for (const [dx, dz] of [[0.95, -0.25], [1.15, 0.2]]) { A(cyl(0.045, 0.035, 0.07, BX + dx, 0.825, tz + dz, 10), W, true); A(cyl(0.075, 0.075, 0.01, BX + dx, 0.795, tz + dz, 12), col("saucer", "#cfe0f0")); }
    // chairs with their backs to the wall, bolts everywhere, a crate, a rug
    for (const dx of [-1.9, 1.9]) { A(box(BX + dx - 0.24, 0.44, tz - 1.1, BX + dx + 0.24, 0.5, tz - 0.62), dwood(), true); A(box(BX + dx - 0.24, 0.5, tz - 1.14, BX + dx + 0.24, 1.2, tz - 1.08), dwood(), true); for (const a of [-0.2, 0.2]) for (const b of [-1.06, -0.66]) A(box(BX + dx + a - 0.025, 0, tz + b - 0.025, BX + dx + a + 0.025, 0.44, tz + b + 0.025), dwood()); }
    pile(BX - 3.5, -2.9, 6, 2); pile(BX - 3.5, 1.2, 6, 6); pile(BX + 3.4, 2.4, 5, 9, false); pile(BX + 0.9, -3.1, 3, 4);
    A(box(BX + 3.0, 0, -2.6, BX + 3.9, 0.7, -1.9, 1), lam("rCrate", () => ({ map: repT(P.plankTex("rk", "#c99a5a")) })), true); A(cylX(0.13, 1.1, BX + 3.45, 0.84, -2.25, 10), bolt("#fbfaf2"), true);
    A(ground(BX - 2.2, BX + 2.2, -2.2, 0.8, 0.01), lam("rRug", () => ({ map: T.rugTex(), polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })));
    lampH(BX + 0.3, 2.6, tz - 0.3);
  }
  // --- the desk with the map ---
  { A(ground(MX - 4, MX + 4, -3, 3, 0.78, 4, 3), top); A(ground(MX - 1.4, MX + 1.4, -1.05, 1.05, 0.79), lam("rMap", () => ({ map: T.mapTex(), polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })));
    A(cylZ(0.14, 1.5, MX - 2.1, 0.92, 0.1, 12), bolt("#3f8fc9"), true); A(cylZ(0.14, 1.5, MX - 2.4, 0.92, 0.3, 12), bolt("#f6c419"), true); A(cyl(0.07, 0.08, 0.1, MX + 1.8, 0.83, -0.7, 10), col("ink", "#23202a"), true); A(box(MX + 1.6, 0.785, 0.3, MX + 2.3, 0.8, 0.36), col("rule", "#f1dca0")); A(cyl(0.13, 0.13, 0.02, MX + 1.9, 0.79, 1.0, 16), brass()); }
}

// ---------------- the waste ground by the bullring ----------------
export function buildField(R: THREE.Object3D, refs: Refs) {
  const Gp = refs.field; R.add(Gp); const { A, W, I, tree, goal, pennant, hills, skyline } = kit(Gp, refs);
  A(ground(FX - 420, FX + 420, -420, 420, 0, 840 / 8, 840 / 8), lam("rDirt", () => ({ map: repT(T.dirtTex()) })));
  // two goals of poles with a rope for a bar; pegs and a rope round the pitch
  for (const sd of [-1, 1]) { const x = FX + sd * 30; for (const z of [-3.6, 3.6]) A(cyl(0.06, 0.08, 2.5, x, 1.25, z, 8), col("pole", "#a87c48"), true); A(rod([x, 2.42, -3.6], [x, 2.3, 0], 0.025), col("rope", "#e9dcc6")); A(rod([x, 2.3, 0], [x, 2.42, 3.6], 0.025), col("rope", "#e9dcc6")); }
  for (let x = -34; x <= 34; x += 4) for (const z of [-21, 21]) { A(cyl(0.035, 0.035, 0.7, FX + x, 0.35, z, 5), col("pole", "#a87c48")); if (x < 34) A(rod([FX + x, 0.62, z], [FX + x + 4, 0.62, z], 0.015), col("rope", "#e9dcc6")); }
  void goal;
  // the bullring: brick drum of arches, a tiled lip, flags
  { const cx = FX - 8, cz = -74, rad = 36, h = 15; const m = lam("rBull", () => ({ map: tiled(T.bullringTex(), 38, 1), side: THREE.DoubleSide })); const c = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad, h, 76, 1, true), m); c.position.set(cx, h / 2, cz); c.castShadow = true; c.receiveShadow = true; Gp.add(c);
    const lip = new THREE.CylinderGeometry(rad - 5, rad + 0.6, 2.2, 76, 1, true); lip.translate(cx, h + 1.1, cz); A(lip, lam("rTile", () => ({ map: repT(Q.roofTex()), side: THREE.DoubleSide })), true);
    const band = new THREE.CylinderGeometry(rad + 0.5, rad + 0.5, 0.5, 76, 1, true); band.translate(cx, h, cz); A(band, col("lipBand", "#f1e3c4", { side: THREE.DoubleSide }));
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; pennant(cx + (rad - 1) * Math.cos(a), h + 1.6, cz + (rad - 1) * Math.sin(a), 4.2, 2.2, PEN[i % 2 ? 0 : 1], -a + 0.5); }
    // the main gate block
    A(box(cx - 6, 0, cz + rad - 1, cx + 6, h + 3, cz + rad + 2), col("gateBlk", "#b5563a"), true); A(box(cx - 6.4, h + 3, cz + rad - 1.2, cx + 6.4, h + 3.8, cz + rad + 2.2), col("lipBand", "#f1e3c4"), true); A(box(cx - 2.6, 0, cz + rad + 1.9, cx + 2.6, 7.4, cz + rad + 2.06), col("gateDark", "#2c1c26")); A(cylZ(2.6, 0.16, cx, 7.4, cz + rad + 1.98, 24), col("gateDark", "#2c1c26")); }
  // the tavern: whitewash under a tiled roof, barrels, a table, the washing line of shirts
  { const tx = FX + 31, tz = -27, tile = lam("rTile", () => ({ map: repT(Q.roofTex()), side: THREE.DoubleSide }));
    A(box(tx - 5, 0, tz - 7, tx + 5, 5, tz), col("tavBody", "#f4ecd6"), true); A(wall(tx - 5, tz + 0.02, tx + 5, tz + 0.02, 0, 5), lam("rTavern", () => ({ map: T.tavernTex(), side: THREE.DoubleSide })));
    A(rbox(11, 0.25, 4.6, 0.5, 0, 0, tx, 6.0, tz - 1.6), tile, true); A(rbox(11, 0.25, 4.6, -0.5, 0, 0, tx, 6.0, tz - 5.4), tile, true); for (const dx of [-5, 5]) A(tri([tx + dx, 5, tz], [tx + dx, 5, tz - 7], [tx + dx, 7.0, tz - 3.5]), col("tavBody", "#f4ecd6", { side: THREE.DoubleSide }));
    A(box(tx + 2.6, 5.4, tz - 4.2, tx + 3.4, 8, tz - 3.4), col("chimney", "#b5563a"), true);
    for (const [dx, dz, up] of [[-3.9, 0.9, 0], [-3.0, 0.9, 0], [-3.45, 0.9, 1]]) A(cylZ(0.42, 1.0, tx + dx, 0.42 + up * 0.74, tz + dz, 14), col("barrel", "#8a5a34"), true); for (const dx of [-3.9, -3.0]) for (const dz of [0.55, 1.25]) A(cylZ(0.435, 0.06, tx + dx, 0.42, tz + dz, 14), I);
    A(cyl(0.4, 0.4, 0.9, tx + 3.9, 0.45, tz + 1.0, 14), col("barrel", "#8a5a34"), true); for (const y of [0.2, 0.7]) A(cyl(0.41, 0.41, 0.06, tx + 3.9, y, tz + 1.0, 14), I);
    A(box(tx + 6.0, 0.7, tz + 1.4, tx + 8.0, 0.76, tz + 2.4, 1), lam("rCounter", () => ({ map: repT(P.plankTex("rc", "#6a3e22")) })), true); for (const dx of [6.1, 7.9]) for (const dz of [1.5, 2.3]) A(box(tx + dx - 0.04, 0, tz + dz - 0.04, tx + dx + 0.04, 0.7, tz + dz + 0.04), dwood()); A(cyl(0.1, 0.13, 0.26, tx + 7.0, 0.89, tz + 1.9, 10), col("jug", "#b5563a"), true); for (const dx of [6.6, 7.4]) A(cyl(0.045, 0.035, 0.09, tx + dx, 0.8, tz + 2.0, 8), W);
    // the washing line: white shirts
    const lx0 = tx - 13, lx1 = tx - 6.5, lz = tz + 2.5; for (const x of [lx0, lx1]) A(cyl(0.05, 0.06, 2.6, x, 1.3, lz, 6), col("pole", "#a87c48"), true); A(rod([lx0, 2.5, lz], [lx1, 2.5, lz], 0.012), col("rope", "#e9dcc6"));
    for (let i = 0; i < 5; i++) { const x = lx0 + 0.8 + i * 1.2; const F = new THREE.Group(); F.position.set(x, 2.48, lz); Gp.add(F); refs.crowns.push(F); add(F, box(-0.34, -0.82, -0.01, 0.34, 0, 0.01), W, true); add(F, box(-0.62, -0.3, -0.01, -0.34, -0.02, 0.01), W, false); add(F, box(0.34, -0.3, -0.01, 0.62, -0.02, 0.01), W, false); } }
  // low houses of the outskirts, a wooden fence, a cart, poplars
  { const tile = lam("rTile", () => ({ map: repT(Q.roofTex()), side: THREE.DoubleSide })); let k = 0;
    const hovel = (cx: number, cz: number, w: number) => { const m = lam("rHovel" + (k % 4), () => ({ map: T.hovelTex(k % 4), side: THREE.DoubleSide })); k++; A(box(cx - w / 2, 0, cz - 7, cx + w / 2, 6, cz), col("hovBody", "#e9dcc0"), true); A(wall(cx - w / 2, cz + 0.02, cx + w / 2, cz + 0.02, 0, 6), m); A(rbox(w + 0.8, 0.25, 4.8, 0.5, 0, 0, cx, 7.0, cz - 1.6), tile, true); A(rbox(w + 0.8, 0.25, 4.8, -0.5, 0, 0, cx, 7.0, cz - 5.4), tile, true); };
    for (const [x, z, w] of [[52, -33, 12], [65, -34, 12], [78, -33, 12], [92, -36, 12], [-62, -40, 12], [-75, -38, 12], [-88, -41, 12], [-104, -44, 12], [108, -40, 12]]) hovel(FX + x, z, w);
    const fm = lam("rFenceW", () => ({ map: tiled(P.plankTex("rfw", "#a87c48"), 60, 1), side: THREE.DoubleSide })); A(wall(FX - 120, 34, FX + 120, 34, 0, 1.5, 1, 1), fm, true);
    { const cx = FX - 40, cz = -26; A(box(cx - 1.6, 0.9, cz - 0.9, cx + 1.6, 1.0, cz + 0.9, 1), lam("rCrate", () => ({ map: repT(P.plankTex("rk", "#c99a5a")) })), true); A(box(cx - 1.6, 1.0, cz - 0.9, cx + 1.6, 1.5, cz - 0.84), dwood()); A(box(cx - 1.6, 1.0, cz + 0.84, cx + 1.6, 1.5, cz + 0.9), dwood()); for (const sz of [-1, 1]) { A(cylZ(0.75, 0.1, cx - 0.4, 0.75, cz + sz * 1.0, 16), dwood(), true); A(cylZ(0.12, 0.14, cx - 0.4, 0.75, cz + sz * 1.0, 8), I); } A(rod([cx + 1.6, 0.95, cz - 0.5], [cx + 3.6, 0.4, cz - 0.5], 0.04), dwood()); A(rod([cx + 1.6, 0.95, cz + 0.5], [cx + 3.6, 0.4, cz + 0.5], 0.04), dwood());
      A(sph(0.9, cx - 0.2, 1.5, cz, 1.5, 0.7, 0.9, 10), col("hay", "#e8c45a"), true); }
    for (let i = 0; i < 16; i++) tree(FX - 130 + i * 17 + (i % 3) * 3, -52 - (i % 4) * 7 - (Math.abs(FX - 130 + i * 17 - FX + 8) < 48 ? 70 : 0), 13 + (i % 4) * 2, i, i % 3 !== 1);
    for (let i = 0; i < 9; i++) tree(FX - 100 + i * 26, 44 + (i % 3) * 6, 12 + (i % 3) * 2, i + 2, i % 2 === 0); }
  skyline(1, FX + 80, -230, FX + 520, -230, 110, [1, 0.95, 0.9]); skyline(1, FX - 520, -250, FX - 60, -250, 100, [0.95, 0.95, 1]); hills(FX, 0, 0, [0.8, 0.85, 1]);
  void [W, I];
}

// ---------------- London: a pitch in the fog under the skyline ----------------
export function buildLondon(R: THREE.Object3D, refs: Refs) {
  const Gp = refs.london; R.add(Gp); const { A, W, tree, goal, gasLamp, skyline } = kit(Gp, refs);
  A(ground(LX - 300, LX + 300, -300, 300, 0, 600 / 8, 600 / 8), lam("rMeadow", () => ({ map: repT(T.meadowTex()) })));
  { const g = new THREE.Group(); g.position.set(LX, 0, -9); g.rotation.y = Math.PI / 2; Gp.add(g); const k2 = kit(g as THREE.Group, refs); k2.goal(0, 1); }
  for (let x = -40; x <= 40; x += 4) { A(cyl(0.05, 0.05, 1.0, LX + x, 0.5, -16, 6), W, true); if (x < 40) { A(rod([LX + x, 0.95, -16], [LX + x + 4, 0.95, -16], 0.03), W); A(rod([LX + x, 0.55, -16], [LX + x + 4, 0.55, -16], 0.025), W); } }
  for (const x of [-9, 9, -27, 27]) gasLamp(LX + x, -17, 4.6);
  for (let i = 0; i < 12; i++) tree(LX - 66 + i * 12, -30 - (i % 3) * 6, 10 + (i % 3) * 2, i + 2, i % 4 === 0);
  // a terrace of brick houses with chimneys behind the trees, then the skyline in the haze
  for (let i = 0; i < 9; i++) { const x = LX - 72 + i * 18, h = 9 + (i % 3) * 2; A(box(x - 8.8, 0, -62, x + 8.8, h, -50), col("ldnBrick", i % 2 ? "#8a5a4a" : "#7a4e42"), true); A(rbox(18, 0.3, 8, 0.5, 0, 0, x, h + 1.6, -53), col("ldnRoof", "#4a4a5a"), true); for (const dx of [-5, 3]) A(box(x + dx, h, -57, x + dx + 1.2, h + 4.4, -55.8), col("ldnBrick", "#7a4e42"), true);
    for (const dx of [-6, -2, 2, 6]) for (const y of [2.2, 5.6]) { const w = new THREE.Mesh(wall(x + dx - 0.7, -49.96, x + dx + 0.7, -49.96, y, y + 1.9), hot([1.8, 1.5, 0.9])); w.layers.set(NOINK); Gp.add(w); } }
  skyline(0, LX - 260, -150, LX + 260, -150, 130, [0.95, 1, 1.1]);
}

// ---------------- the racecourse: the coronation tournament ----------------
export function buildHipo(R: THREE.Object3D, refs: Refs) {
  const Gp = refs.hipo; R.add(Gp); const { A, W, I, tree, marks, goal, pennant, hills, skyline } = kit(Gp, refs);
  A(ground(HPX - 420, HPX + 420, -420, 420, 0, 840 / 8, 840 / 8), lam("rMeadow", () => ({ map: repT(T.meadowTex()) })));
  marks(HPX, HL, HW, 0.16); goal(HPX - HL, -1); goal(HPX + HL, 1);
  // the white rail round the pitch
  const RX = HL + 6, RZ = HW + 5; const rail = (x0: number, z0: number, x1: number, z1: number) => { const n = Math.round(Math.hypot(x1 - x0, z1 - z0) / 3.5); for (let i = 0; i <= n; i++) A(cyl(0.05, 0.05, 1.05, HPX + x0 + ((x1 - x0) * i) / n, 0.52, z0 + ((z1 - z0) * i) / n, 6), W, true); A(rod([HPX + x0, 1.03, z0], [HPX + x1, 1.03, z1], 0.035), W); A(rod([HPX + x0, 0.58, z0], [HPX + x1, 0.58, z1], 0.028), W); };
  rail(-RX, -RZ, RX, -RZ); rail(-RX, RZ, RX, RZ); rail(-RX, -RZ, -RX, RZ); rail(RX, -RZ, RX, RZ);
  // the grandstand on the north side: boarded front, a tier of spectators, a roof on posts, bunting, the royal box in the middle
  { const z0 = -(RZ + 5), z1 = z0 - 13, x0 = HPX - 40, x1 = HPX + 40, bd = lam("rBoarding", () => ({ map: repT(T.boardingTex()), side: THREE.DoubleSide })), crowd = tiled(Q.crowd39Tex(4), 1, 1); refs.crowds.push(crowd);
    const cm = lam("rCrowd02", () => ({ map: crowd, side: THREE.DoubleSide })), roofM = lam("rTile", () => ({ map: repT(Q.roofTex()), side: THREE.DoubleSide })), bunt = lam("rBunt", () => ({ map: tiled(Q.buntingTex(), 14, 1), alphaTest: 0.5, side: THREE.DoubleSide }));
    A(wall(x0, z0, x1, z0, 0, 1.8, 40, 0.9), bd, true); A(quad([x0, 1.8, z0], [x1, 1.8, z0], [x1, 9, z1], [x0, 9, z1], 4, 1), cm); A(wall(x1, z1, x0, z1, 0, 13, 40, 6), bd, true); for (const x of [x0, x1]) A(quad([x, 0, z0], [x, 0, z1], [x, 9, z1], [x, 1.8, z0], 6, 3), bd, true);
    A(quad([x0 - 1, 11.2, z0 + 2.4], [x1 + 1, 11.2, z0 + 2.4], [x1 + 1, 13.6, z1 - 0.6], [x0 - 1, 13.6, z1 - 0.6], 12, 3), roofM, true); A(wall(x0 - 1, z0 + 2.4, x1 + 1, z0 + 2.4, 10.5, 11.2), bunt); A(wall(x0 - 1, z0 + 2.4, x1 + 1, z0 + 2.4, 11.2, 11.5, 40, 0.15), bd);
    for (let x = x0; x <= x1 + 0.1; x += 8) { if (Math.abs(x - HPX) > 6) A(cyl(0.11, 0.11, 11.2, x, 5.6, z0 + 2.2, 8), W, true); if (Math.abs(x - HPX) > 6) pennant(x, 13.4, z1, 4.4, 2.4, PEN[Math.abs(Math.round(x / 8)) % 6], 0.4); }
    A(rod([x0, 2.75, z0 - 0.05], [x1, 2.75, z0 - 0.05], 0.04), W); for (let x = x0; x <= x1; x += 2) A(cyl(0.03, 0.03, 0.95, x, 2.28, z0 - 0.05, 5), W);
    // the royal box: it stands out from the stand under its own canopy
    A(box(HPX - 4.4, 0, z0, HPX + 4.4, 2.2, z0 + 3.2), col("royalBase", "#f4efe2"), true); A(wall(HPX - 4.4, z0 + 3.22, HPX + 4.4, z0 + 3.22, 0.1, 2.2), lam("rRoyal", () => ({ map: T.royalTex(), side: THREE.DoubleSide })));
    A(box(HPX - 4.4, 2.2, z0 + 3.1, HPX + 4.4, 2.62, z0 + 3.2), col("royalRail", "#e8c45a"), true); for (const dx of [-4.3, 4.3]) for (const dz of [0.1, 3.1]) A(cyl(0.09, 0.09, 4.4, HPX + dx, 4.4, z0 + dz, 8), brass(), true);
    A(rbox(9.6, 0.2, 4.2, 0.12, 0, 0, HPX, 6.7, z0 + 1.6), col("canopy", "#a81e2e"), true); A(wall(HPX - 4.8, z0 + 3.7, HPX + 4.8, z0 + 3.7, 5.9, 6.5, 1, 0.25), lam("rRoyalV", () => ({ map: tiled(T.royalTex(), 1, 0.25), side: THREE.DoubleSide })));
    { const cn = new THREE.ConeGeometry(0.7, 0.8, 8); cn.translate(HPX, 7.4, z0 + 1.6); A(cn, brass(), true); A(sph(0.22, HPX, 7.95, z0 + 1.6, 1, 1, 1, 8), brass()); }
    for (const dx of [-5.6, 5.6]) pennant(HPX + dx, 0, z0 + 3.6, 10, 3.0, dx < 0 ? "#e2453c" : "#f6c419", 0.3);
  }
  // marquees, the paddock rail, poplars, the carriage park, the town on the horizon
  { const tentR = (c: string) => lam("rTent" + c, () => ({ map: tiled(Q.tentTex(c), 4, 1), side: THREE.DoubleSide })), canvas = col("canvas", "#fbf6e6", { side: THREE.DoubleSide });
    for (const [tx, c] of [[-34, "#e2453c"], [0, "#f6c419"], [34, "#3f8fc9"]] as [number, string][]) { const x = HPX + tx, tz = RZ + 16, hw = 6.5, hd = 4.2; const cone = new THREE.ConeGeometry(1, 3.2, 4, 1, true); cone.rotateY(Math.PI / 4); cone.scale(hw * 1.5, 1, hd * 1.5); cone.translate(x, 4.8, tz); A(cone, tentR(c), true);
      A(wall(x - hw, tz + hd, x + hw, tz + hd, 0, 3.2), canvas, true); A(wall(x - hw, tz - hd, x - hw, tz + hd, 0, 3.2), canvas, true); A(wall(x + hw, tz + hd, x + hw, tz - hd, 0, 3.2), canvas, true); for (const dx of [-hw, 0, hw]) A(cyl(0.07, 0.07, 3.2, x + dx, 1.6, tz - hd, 6), W, true); pennant(x, 6.2, tz, 2.2, 1.2, c, 0.3); }
    for (let i = 0; i < 26; i++) tree(HPX - 150 + i * 12, -(RZ + 34) - (i % 3) * 5, 15 + (i % 4) * 2, i, true);
    for (let i = 0; i < 20; i++) tree(HPX - 140 + i * 15, RZ + 40 + (i % 3) * 7, 12 + (i % 3) * 2, i + 1, i % 3 === 0);
    for (const sd of [-1, 1]) for (let i = 0; i < 6; i++) tree(HPX + sd * (RX + 22 + (i % 2) * 8), -40 + i * 16, 13 + (i % 3) * 2, i + 3, i % 2 === 0); }
  skyline(1, HPX - 420, 250, HPX + 420, 250, 100, [1, 0.95, 0.9], 2); hills(HPX, 0, 0, [0.8, 0.86, 1]);
  void [I];
}
