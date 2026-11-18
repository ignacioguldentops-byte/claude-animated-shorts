// 3D sets of "Sin límite": the cricket ground at Durban in 1939 (oval, pitch, pavilion with its clock, stands, scoreboard,
// palms, the sea behind), the quay with the liner, and the station with the train. Boxes, ribbons and painted textures;
// the ink pass draws the geometry edges.
import * as THREE from "three";
import { NOINK } from "./ink";
import { lam, add, box, ground, wall, repT } from "./kit";
import * as P from "./paintj";
import * as Q from "./paintk";

export const HX = 3000;   // the quay: sea for z < 0, the liner alongside
export const TX = 6000;   // the station: platform for z > 0, the track just below it
export const WK = 10.06;  // wickets at z = +-WK; the striker bats at +z, the bowler comes from -z
export const PAV_X = -74; // front of the pavilion
/** the bench of the man who has seen every ball: on the walkway between the picket fence and the stand, south end */
export const BENCH: [number, number, number] = [12, 0, 66.75];
export const LAMP_MATS: THREE.MeshBasicMaterial[] = [];
const hot = (c: [number, number, number]) => { const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(...c) }); LAMP_MATS.push(m); (m.userData as { hot: [number, number, number] }).hot = c; return m; };
const cyl = (r0: number, r1: number, h: number, x: number, y: number, z: number, seg = 12) => { const g = new THREE.CylinderGeometry(r0, r1, h, seg, 1); g.translate(x, y, z); return g; };
/** cylinder lying along x (axle, boiler) or z */
const cylX = (r: number, len: number, x: number, y: number, z: number, seg = 16) => { const g = new THREE.CylinderGeometry(r, r, len, seg); g.rotateZ(Math.PI / 2); g.translate(x, y, z); return g; };
const cylZ = (r: number, len: number, x: number, y: number, z: number, seg = 16) => { const g = new THREE.CylinderGeometry(r, r, len, seg); g.rotateX(Math.PI / 2); g.translate(x, y, z); return g; };
const sph = (r: number, x: number, y: number, z: number, sx = 1, sy = 1, sz = 1, seg = 14) => { const g = new THREE.SphereGeometry(r, seg, Math.max(6, Math.round(seg * 0.7))); g.scale(sx, sy, sz); g.translate(x, y, z); return g; };
const tiled = (t: THREE.Texture, x: number, y: number) => { const c = t.clone(); c.wrapS = c.wrapT = THREE.RepeatWrapping; c.repeat.set(x, y); c.anisotropy = 8; c.needsUpdate = true; return c; };
const col = (key: string, c: string, x: THREE.MeshLambertMaterialParameters = {}) => lam("k_" + key + c, () => ({ color: c, ...x }));
const rbox = (w: number, h: number, d: number, rx: number, ry2: number, rz: number, x: number, y: number, z: number) => { const g = new THREE.BoxGeometry(w, h, d); g.rotateX(rx); g.rotateZ(rz); g.rotateY(ry2); g.translate(x, y, z); return g; };
const quad = (a: number[], b: number[], c: number[], d: number[], tu = 1, tv = 1) => {
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute([...a, ...b, ...c, ...d], 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, tu, 0, tu, tv, 0, tv], 2)); g.setIndex([0, 1, 2, 0, 2, 3]); g.computeVertexNormals(); return g;
};
/** vertical ribbon along a plan polyline (closed or open), u in metres / tile */
const ribbon = (pts: [number, number][], y0: number, y1: number, tile: number, closed = true) => {
  const pos: number[] = [], uv: number[] = [], idx: number[] = []; let u = 0; const n = pts.length + (closed ? 1 : 0);
  for (let i = 0; i < n; i++) { const [x, z] = pts[i % pts.length]; if (i) { const [px, pz] = pts[(i - 1) % pts.length]; u += Math.hypot(x - px, z - pz); } pos.push(x, y0, z, x, y1, z); uv.push(u / tile, 0, u / tile, 1); }
  for (let i = 0; i < n - 1; i++) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
};
const flat = (pts: [number, number][], y: number) => { const s = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z))); const g = new THREE.ShapeGeometry(s); g.rotateX(-Math.PI / 2); g.translate(0, y, 0); return g; };

export type Tint = { m: THREE.MeshBasicMaterial; day: [number, number, number]; golden: [number, number, number]; night: [number, number, number] };
export type Refs = {
  tints: Tint[]; waves: THREE.Texture[]; foams: THREE.Mesh[]; crowns: THREE.Object3D[]; crowds: THREE.Texture[];
  ground: THREE.Group; harbour: THREE.Group; station: THREE.Group; train: THREE.Group; ship: THREE.Group;
  hands: THREE.Object3D[]; bails: THREE.Object3D[]; cover: THREE.Object3D; floods: THREE.Group; tea: THREE.Group; sunday: THREE.Group;
  stands: THREE.Mesh[]; crowdMats: THREE.Material[];
};
export const newRefs = (): Refs => ({ tints: [], waves: [], foams: [], crowns: [], crowds: [], ground: new THREE.Group(), harbour: new THREE.Group(), station: new THREE.Group(), train: new THREE.Group(), ship: new THREE.Group(),
  hands: [], bails: [], cover: new THREE.Group(), floods: new THREE.Group(), tea: new THREE.Group(), sunday: new THREE.Group(), stands: [], crowdMats: [] });

/** the gangway, in the ship's own coordinates: centre, slope and length (its low end is on the quay) */
export const GANG = { x: -10, y: 4.6, z: 13.3, a: 0.639, len: 15.44 };
export const SHIP: [number, number, number] = [HX + 4, 0, -10.5];
// shared makers --------------------------------------------------------------------------------------------------------
const seaKit = (Gp: THREE.Group, refs: Refs) => {
  const seaM = new THREE.MeshBasicMaterial({ map: P.seaTex() }); refs.tints.push({ m: seaM, day: [1, 1, 1], golden: [1.15, 0.8, 0.62], night: [0.3, 0.35, 0.7] });
  const wavesT = tiled(P.wavesTex(), 90, 64); refs.waves.push(wavesT);
  const wavesM = new THREE.MeshBasicMaterial({ map: wavesT, transparent: true, depthWrite: false, opacity: 0.8 });
  /** sea towards -z from zShore */
  return (cx: number, zShore: number) => {
    const m = new THREE.Mesh(ground(cx - 700, cx + 700, zShore - 900, zShore, -0.03), seaM); m.layers.set(NOINK); Gp.add(m);
    const w = new THREE.Mesh(ground(cx - 700, cx + 700, zShore - 900, zShore, 0), wavesM); w.layers.set(NOINK); w.renderOrder = 0.1; Gp.add(w);
  };
};
const hillsKit = (Gp: THREE.Group, refs: Refs) => (cx: number, cz: number, th0: number, tint: [number, number, number] = [1, 1, 1]) => {
  const m = new THREE.MeshBasicMaterial({ map: tiled(P.hillsTex(), 1.4, 1), alphaTest: 0.5, side: THREE.BackSide, fog: false });
  const c = new THREE.Mesh(new THREE.CylinderGeometry(430, 430, 190, 64, 1, true, th0, Math.PI), m); c.position.set(cx, 93, cz); c.layers.set(NOINK); Gp.add(c);
  refs.tints.push({ m, day: tint, golden: [1.1 * tint[0], 0.82 * tint[1], 0.66 * tint[2]], night: [0.3, 0.38, 0.7] });
};
const palmKit = (Gp: THREE.Group, refs: Refs) => (x: number, y: number, z: number, h: number, lx: number, lz: number, k: number) => {
  const top = new THREE.Vector3(x + lx * h * 0.3, y + h, z + lz * h * 0.3), cv = new THREE.QuadraticBezierCurve3(new THREE.Vector3(x, y - 0.2, z), new THREE.Vector3(x + lx * h * 0.02, y + h * 0.55, z + lz * h * 0.02), top);
  const tg = new THREE.TubeGeometry(cv, 10, 0.17, 7); { const uv = tg.getAttribute("uv") as THREE.BufferAttribute; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getY(i), uv.getX(i) * h * 0.9); }
  add(Gp, tg, lam("jTrunk", () => ({ map: repT(P.trunkTex()) })), true);
  const C = new THREE.Group(); C.position.copy(top); Gp.add(C); refs.crowns.push(C);
  const m = lam("jPalm" + (k % 2), () => ({ map: P.palmTex(k % 2), alphaTest: 0.5, side: THREE.DoubleSide }));
  for (let i = 0; i < 3; i++) { const pl = new THREE.Mesh(new THREE.PlaneGeometry(h * 0.82, h * 0.82), m); pl.rotation.y = (i * Math.PI) / 3 + k; pl.position.y = -h * 0.04; pl.castShadow = true; C.add(pl); }
};
const white = () => col("white", "#fbfaf2"), iron = () => col("iron", "#2c2a38"), dwood = () => col("dw", "#5a3320");

// ---------------- the cricket ground ----------------
export function buildGround(R: THREE.Object3D, refs: Refs) {
  const Gp = refs.ground; R.add(Gp);
  const A = (g: THREE.BufferGeometry, m: THREE.Material, cast = false) => add(Gp, g, m, cast);
  const W = white(), I = iron(), wood = lam("kWood", () => ({ map: repT(P.plankTex("k", "#b0733a")) }));
  // turf, pitch, creases, rope
  A(ground(-420, 420, -135, 420, 0, 840 / 16, 555 / 16), lam("kOut", () => ({ map: repT(Q.outfieldTex()) })));
  A(ground(-1.52, 1.52, -12, 12, 0.012), lam("kPitch", () => ({ map: Q.pitchTex() })));
  { const t = new THREE.TorusGeometry(63, 0.09, 6, 160); t.rotateX(Math.PI / 2); t.translate(0, 0.08, 0); A(t, W); }
  // wickets: three stumps and two bails at each end
  for (const sd of [-1, 1]) {
    for (const dx of [-0.115, 0, 0.115]) A(cyl(0.021, 0.021, 0.71, dx, 0.355, sd * WK, 8), col("stump", "#e9cf94"), true);
    const b = new THREE.Group(); for (const dx of [-0.058, 0.058]) add(b, box(dx - 0.055, 0.712, sd * WK - 0.012, dx + 0.055, 0.735, sd * WK + 0.012), col("bail", "#c9a86a"), true); Gp.add(b); refs.bails.push(b);
  }
  // picket fence and the stands behind it
  { const f = new THREE.Mesh(new THREE.CylinderGeometry(66, 66, 1.0, 120, 1, true), lam("kFence", () => ({ map: tiled(Q.fenceTex(), 200, 1), alphaTest: 0.5, side: THREE.DoubleSide }))); f.position.y = 0.5; f.castShadow = true; f.receiveShadow = true; Gp.add(f); }
  const crowd = tiled(Q.crowd39Tex(0), 1, 1), crowdNow = tiled(Q.crowd39Tex(1), 1, 1); refs.crowds.push(crowd, crowdNow);
  const cm = lam("kCrowd", () => ({ map: crowd, side: THREE.DoubleSide })), cmNow = lam("kCrowdNow", () => ({ map: crowdNow, side: THREE.DoubleSide })); refs.crowdMats.push(cm, cmNow);
  const fascia = lam("kFascia", () => ({ map: repT(P.plankTex("f", "#efe6d0")), side: THREE.DoubleSide })), back = col("standBack", "#8a7a66", { side: THREE.DoubleSide }), roofM = lam("kRoof", () => ({ map: repT(Q.roofTex()), side: THREE.DoubleSide }));
  const seg = (a0: number, a1: number, roof: boolean) => { // angles in degrees, atan2(z, x)
    const p = (r: number, a: number, y: number) => [r * Math.cos((a * Math.PI) / 180), y, r * Math.sin((a * Math.PI) / 180)];
    const r0 = 69.5, r1 = 82;
    for (let j = 0; j < 4; j++) { const b0 = a0 + ((a1 - a0) * j) / 4, b1 = a0 + ((a1 - a0) * (j + 1)) / 4; // four facets: the front follows the curve of the fence
      const m = A(quad(p(r0, b1, 1.5), p(r0, b0, 1.5), p(r1, b0, 8.2), p(r1, b1, 8.2), 0.4, 1), cm); refs.stands.push(m);
      A(quad(p(r0, b1, 0), p(r0, b0, 0), p(r0, b0, 1.5), p(r0, b1, 1.5), 1.5, 0.4), fascia, true);
      A(quad(p(r1, b0, 0), p(r1, b1, 0), p(r1, b1, 9.4), p(r1, b0, 9.4)), back, true); }
    for (const a of [a0, a1]) A(quad(p(r0, a, 0), p(r1, a, 0), p(r1, a, 8.2), p(r0, a, 1.5)), back, true);
    if (roof) { A(quad(p(r0 + 2, a1, 11.2), p(r0 + 2, a0, 11.2), p(r1 + 0.6, a0, 12.6), p(r1 + 0.6, a1, 12.6), 6, 3), roofM, true);
      for (const a of [a0 + 1, (a0 + a1) / 2, a1 - 1]) { const q = p(r0 + 2.4, a, 0); A(cyl(0.09, 0.09, 9.8, q[0], 6.3, q[2], 6), W, true); } }
  };
  for (let a = -64; a < 160; a += 25) seg(a, a + 23, Math.round((a + 64) / 25) % 2 === 0);
  for (let a = 197; a < 245; a += 25) seg(a, a + 23, a === 197);
  // the bench on the walkway
  { const [bx, , bz] = BENCH; A(box(bx - 1.5, 0.4, bz - 0.25, bx + 1.5, 0.46, bz + 0.25, 1), wood, true); A(box(bx - 1.5, 0.52, bz + 0.25, bx + 1.5, 1.0, bz + 0.31, 1), wood, true); for (const dx of [-1.4, 1.4]) { A(box(bx + dx - 0.04, 0, bz - 0.22, bx + dx + 0.04, 0.4, bz - 0.14), I); A(box(bx + dx - 0.04, 0, bz + 0.24, bx + dx + 0.04, 1.0, bz + 0.32), I); } }
  // sight screens
  for (const sd of [-1, 1]) { A(box(-3.6, 0.5, sd * 60.5 - 0.1, 3.6, 5.2, sd * 60.5 + 0.1), W, true); for (const dx of [-3.4, 3.4]) A(cyl(0.3, 0.3, 0.16, dx, 0.3, sd * 60.5, 10), I); }
  // scoreboard to the north, on stilts in front of the palms
  { const z = -78; A(box(-9, 4.2, z - 1.2, 9, 12.4, z), col("sbBack", "#3a3438"), true); A(wall(-8.6, z + 0.03, 8.6, z + 0.03, 4.6, 12.0), lam("kScore", () => ({ map: Q.scoreTex(0), side: THREE.DoubleSide })));
    const r = new THREE.ConeGeometry(11.5, 2.6, 4); r.rotateY(Math.PI / 4); r.scale(1, 1, 0.35); r.translate(0, 13.7, z - 0.6); A(r, roofM, true);
    for (const x of [-8, -2.7, 2.7, 8]) A(box(x - 0.2, 0, z - 0.9, x + 0.2, 4.2, z - 0.5), dwood(), true); A(box(-9.4, 4.0, z - 1.4, 9.4, 4.25, z + 0.5), wood, true); }
  // pavilion to the west: two floors, a veranda, red roof and the clock tower
  { const x0 = PAV_X - 12, x1 = PAV_X, zw = 17;
    A(box(x0, 0, -zw, x1, 4.2, zw), col("pavBody", "#efe2c2"), true); A(wall(x1 + 0.02, zw, x1 + 0.02, -zw, 0, 4.2), lam("kPav0", () => ({ map: Q.pavilionTex(0), side: THREE.DoubleSide })));
    A(box(x0, 4.2, -zw, x1 - 2.6, 8.2, zw), col("pavBody", "#efe2c2"), true); A(wall(x1 - 2.58, zw, x1 - 2.58, -zw, 4.2, 8.2), lam("kPav1", () => ({ map: Q.pavilionTex(1), side: THREE.DoubleSide })));
    A(box(x1 - 2.7, 4.2, -zw - 0.3, x1 + 3.4, 4.45, zw + 0.3), col("verFloor", "#b9a680"), true);                       // balcony / veranda roof
    for (let z = -zw; z <= zw + 0.01; z += 3.4) { A(cyl(0.09, 0.09, 4.2, x1 + 3.1, 2.1, z, 8), W, true); A(cyl(0.07, 0.07, 3.7, x1 + 3.1, 6.3, z, 8), W, true); }
    A(box(x1 + 3.0, 5.2, -zw, x1 + 3.2, 5.3, zw), W); A(box(x1 + 3.0, 4.75, -zw, x1 + 3.2, 4.82, zw), W);
    A(rbox(8.4, 0.3, 2 * zw + 2, 0, 0, 0.42, x1 - 2.2, 9.4, 0), roofM, true); A(rbox(8.4, 0.3, 2 * zw + 2, 0, 0, -0.42, x1 - 9.6, 9.4, 0), roofM, true); A(rbox(7.2, 0.25, 2 * zw + 1.2, 0, 0, 0.16, x1 + 0.6, 8.05, 0), roofM, true);
    for (const sz of [-1, 1]) A(box(x0, 8.2, sz * zw - 0.15, x1 - 2.6, 10.7, sz * zw + 0.15), col("pavBody", "#efe2c2"));
    // steps down to the grass
    for (let i = 0; i < 4; i++) A(box(x1 + 3.4 + i * 0.4, 0, -3.2, x1 + 3.8 + i * 0.4, 0.6 - i * 0.15, 3.2), col("step", "#d9cdb0"), true);
    // clock tower
    const tx = x1 - 6;
    A(box(tx - 1.9, 8.6, -1.9, tx + 1.9, 15.4, 1.9), col("tower", "#f6eeda"), true); const cap = new THREE.ConeGeometry(3.1, 2.8, 4); cap.rotateY(Math.PI / 4); cap.translate(tx, 16.8, 0); A(cap, roofM, true); A(cyl(0.05, 0.05, 2.2, tx, 19.2, 0, 6), I);
    const face = new THREE.Mesh(new THREE.CircleGeometry(1.5, 28), lam("kClock", () => ({ map: Q.clockTex(), alphaTest: 0.5 }))); face.rotation.y = Math.PI / 2; face.position.set(tx + 1.93, 13, 0); Gp.add(face);
    for (const [len, w] of [[0.85, 0.16], [1.25, 0.1]] as [number, number][]) { const h = new THREE.Group(); const g = new THREE.BoxGeometry(0.05, len, w); g.translate(0, len / 2 - 0.1, 0); add(h, g, I, false); h.position.set(tx + 1.99, 13, 0); Gp.add(h); refs.hands.push(h); }
  }
  // tea on the grass: a long table with its cloth, pot, cups and cake
  { const T = refs.tea; Gp.add(T); const tx = -30, tz = 16, cloth = lam("kCloth", () => ({ map: repT(Q.clothTex()) }));
    add(T, box(tx - 2.6, 0.72, tz - 0.55, tx + 2.6, 0.78, tz + 0.55, 1), cloth, true); add(T, box(tx - 2.62, 0.38, tz + 0.55, tx + 2.62, 0.78, tz + 0.57, 1), cloth); add(T, box(tx - 2.62, 0.38, tz - 0.57, tx + 2.62, 0.78, tz - 0.55, 1), cloth);
    for (const dx of [-2.4, 2.4]) for (const dz of [-0.45, 0.45]) add(T, box(tx + dx - 0.04, 0, tz + dz - 0.04, tx + dx + 0.04, 0.72, tz + dz + 0.04), dwood());
    add(T, sph(0.17, tx - 0.3, 0.95, tz, 1, 0.85, 1), W, true); add(T, cyl(0.05, 0.03, 0.1, tx - 0.3, 1.12, tz, 8), col("lid", "#d0342e")); add(T, rbox(0.22, 0.04, 0.04, 0, 0, 0.5, tx - 0.05, 1.0, tz), W);
    for (let i = 0; i < 7; i++) { const x = tx - 2.1 + i * 0.7, z = tz + (i % 2 ? 0.28 : -0.28); if (Math.abs(x - tx + 0.3) < 0.3) continue; add(T, cyl(0.055, 0.04, 0.08, x, 0.83, z, 10), W, true); add(T, cyl(0.09, 0.09, 0.012, x, 0.787, z, 12), col("saucer", "#cfe0f0")); }
    for (const [dx, r] of [[1.2, 0.24], [1.2, 0.17]] as number[][]) add(T, cyl(r, r, 0.03, tx + dx, r > 0.2 ? 0.86 : 1.0, tz, 14), W, true); add(T, cyl(0.02, 0.02, 0.3, tx + 1.2, 0.9, tz, 6), I); add(T, sph(0.08, tx + 1.2, 1.09, tz, 1, 0.7, 1), col("cake", "#f25c7a"));
    for (const dx of [-1.6, 0.5, 2.0]) { add(T, cyl(0.15, 0.15, 0.012, tx + dx, 0.787, tz - 0.05, 12), W); for (let k = 0; k < 3; k++) add(T, rbox(0.11, 0.035, 0.08, 0, k, 0, tx + dx - 0.06 + k * 0.06, 0.81 + k * 0.012, tz - 0.05), col("sandw", k % 2 ? "#f6e3b0" : "#9ccf7a")); }
  }
  // Sunday: deck chairs and a parasol out in the middle
  { const S = refs.sunday; Gp.add(S); const cv = (k: number) => lam("kDeckCh" + k, () => ({ map: tiled(P.stripeTex("dc" + k, "#f7f5ee", ["#e2453c", "#3f8fc9", "#f6c419"][k % 3]), 1, 3) }));
    ([[-2.2, 2.6], [2.3, 2.2], [-2.1, -2.6]] as number[][]).forEach(([x, z], k) => { add(S, rbox(0.62, 0.03, 1.25, -0.72, 0, 0, x, 0.52, z), cv(k), true); for (const dx of [-0.31, 0.31]) { add(S, rbox(0.04, 0.04, 1.5, -0.72, 0, 0, x + dx, 0.55, z), dwood(), true); add(S, rbox(0.04, 0.04, 1.1, 0.75, 0, 0, x + dx, 0.36, z + 0.05), dwood()); } });
    add(S, cyl(0.035, 0.035, 2.5, 3.4, 1.25, 2.9, 8), W, true); const um = new THREE.ConeGeometry(1.5, 0.5, 14); um.translate(3.4, 2.55, 2.9); add(S, um, lam("jUmb", () => ({ map: tiled(P.umbrellaTex(), 2, 1), side: THREE.DoubleSide })), true);
  }
  // the heavy roller, the covers for the rain
  { A(cylX(0.62, 1.7, 15, 0.62, -28, 20), col("roller", "#8f9aa8"), true); for (const dx of [-0.92, 0.92]) A(box(15 + dx - 0.04, 0.58, -28, 15 + dx + 0.04, 0.66, -25.4), I, true); A(box(14.05, 0.9, -25.5, 15.95, 0.98, -25.4), I, true); for (const dx of [-0.92, 0.92]) A(box(15 + dx - 0.04, 0.62, -25.48, 15 + dx + 0.04, 0.96, -25.4), I); }
  { const C = refs.cover; Gp.add(C); add(C, box(-2.5, 0.02, -9.2, 2.5, 0.08, 9.2), col("cover", "#a9c2d2"), true); for (let z = -8; z <= 8; z += 4) add(C, box(-2.52, 0.081, z - 0.05, 2.52, 0.09, z + 0.05), col("coverSeam", "#7f9db2")); }
  // floodlights of today
  { const F = refs.floods; Gp.add(F); for (const [x, z] of [[30, -88], [-30, -88], [84, 36], [-84, 44]]) { add(F, cyl(0.5, 0.8, 44, x, 22, z, 8), col("mast", "#c9d2de"), true); const ry = Math.atan2(-x, -z);
      add(F, rbox(9, 5.4, 0.5, -0.25, ry, 0, x, 46, z), col("mastHead", "#3a3d4a"), true); for (let i = 0; i < 4; i++) for (let k = 0; k < 3; k++) { const b = new THREE.Mesh(rbox(1.5, 1.2, 0.2, -0.25, ry, 0, x + Math.cos(ry) * (i - 1.5) * 2.05 + Math.sin(ry) * 0.36, 44.5 + k * 1.55, z - Math.sin(ry) * (i - 1.5) * 2.05 + Math.cos(ry) * 0.36), hot([5, 5, 4.4])); b.layers.set(NOINK); F.add(b); } } }
  // palms round the ground, the sea to the north, hills inland
  const palm = palmKit(Gp, refs);
  for (let i = 0; i < 46; i++) { const a = (i / 46) * Math.PI * 2 + 0.07, r = 90 + (i % 4) * 5.5; if (Math.abs(Math.cos(a) * r + 80) < 16 && Math.abs(Math.sin(a) * r) < 22) continue; palm(Math.cos(a) * r, 0, Math.sin(a) * r, 8.5 + (i % 5) * 1.1, 0.3 * Math.sin(i * 1.7), 0.3 * Math.cos(i * 2.3), i); }
  for (let i = 0; i < 9; i++) palm(-52 + i * 13 + (i % 2) * 3, 0, -104 - (i % 3) * 6, 9 + (i % 3), 0.2 * Math.sin(i), -0.3, i + 3);
  A(ground(-420, 420, -135, -128, 0.004, 120, 1), lam("jSand", () => ({ map: repT(P.sandTex()) })));
  seaKit(Gp, refs)(0, -134); hillsKit(Gp, refs)(0, 0, -Math.PI / 2);
  A(sph(1, 300, -4, -330, 150, 40, 80, 24), col("headland", "#4aa058"));
}

// ---------------- the quay and the liner ----------------
export function buildHarbour(R: THREE.Object3D, refs: Refs) {
  const Gp = refs.harbour; R.add(Gp);
  const A = (g: THREE.BufferGeometry, m: THREE.Material, cast = false) => add(Gp, g, m, cast);
  const W = white(), I = iron(), stone = lam("kQuay", () => ({ map: repT(Q.quayTex()) }));
  A(ground(HX - 300, HX + 300, 0, 300, 0, 600 / 5, 300 / 5), stone); A(wall(HX - 300, 0, HX + 300, 0, -4, 0, 120, 1), lam("kQuayW", () => ({ map: repT(Q.quayTex()), side: THREE.DoubleSide, color: "#b9b3a8" })));
  seaKit(Gp, refs)(HX, 0); hillsKit(Gp, refs)(HX, 0, -Math.PI / 2, [0.85, 0.9, 1]);
  for (let i = 0; i < 9; i++) { const x = HX - 40 + i * 11; A(cyl(0.22, 0.28, 0.5, x, 0.25, 1.0, 10), I, true); A(cyl(0.34, 0.3, 0.12, x, 0.56, 1.0, 10), I, true); }
  // sheds, crates, a crane
  A(box(HX - 60, 0, 24, HX + 70, 7.5, 40), col("shedB", "#8f9aa8"), true); A(wall(HX - 60, 23.97, HX + 70, 23.97, 0, 7.5, 3, 1), lam("kShed", () => ({ map: repT(Q.shedTex()), side: THREE.DoubleSide }))); A(rbox(132, 0.3, 9.4, 0.35, 0, 0, HX + 5, 8.9, 28.2), lam("jTin", () => ({ map: repT(P.tinTex()) })), true); A(rbox(132, 0.3, 9.4, -0.35, 0, 0, HX + 5, 8.9, 36.8), lam("jTin", () => ({ map: repT(P.tinTex()) })), true);
  const crate = lam("kCrate", () => ({ map: repT(P.plankTex("c", "#b98a52")) }));
  ([[14, 9, 1.2], [15.4, 9.3, 0.9], [14.6, 9.1, 0.8], [-13, 12, 1.4], [-11.2, 12.4, 1.0], [22, 15, 1.1], [-22, 7, 1.0]] as number[][]).forEach(([x, z, s], i) => A(box(HX + x - s / 2, i === 2 ? 1.2 : 0, z - s / 2, HX + x + s / 2, (i === 2 ? 1.2 : 0) + s, z + s / 2, 1), crate, true));
  { const cx = HX - 34, cz = 12; for (const [dx, dz] of [[-2, -2], [2, -2], [-2, 2], [2, 2]]) A(box(cx + dx - 0.2, 0, cz + dz - 0.2, cx + dx + 0.2, 13, cz + dz + 0.2), col("crane", "#c9862e"), true); A(box(cx - 2.6, 13, cz - 2.6, cx + 2.6, 15.6, cz + 2.6), col("craneCab", "#e2a23c"), true); A(rbox(1.0, 1.0, 26, 0.5, 0, 0, cx, 21.4, cz - 11), col("crane", "#c9862e"), true); A(cyl(0.03, 0.03, 12, cx, 21.5, cz - 22.6, 4), I); }
  // lamp posts along the quay
  for (let i = 0; i < 5; i++) { const x = HX - 30 + i * 16; A(cyl(0.07, 0.1, 5, x, 2.5, 5.4, 8), I, true); const b = new THREE.Mesh(sph(0.26, x, 5.15, 5.4), hot([4.6, 3.8, 2.2])); b.layers.set(NOINK); Gp.add(b); }
  // the liner
  const S = refs.ship; Gp.add(S); S.position.set(...SHIP);
  const N = 30, half = (t: number) => 7.4 * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(t), t > 0 ? 2.4 : 3.2)), 0.55);
  const side: [number, number][] = []; for (let i = 0; i <= N; i++) { const t = 1 - (2 * i) / N; side.push([t * 62, half(t)]); }
  const outline: [number, number][] = [...side, ...side.slice(1, -1).reverse().map(([x, z]) => [x, -z] as [number, number])];
  add(S, ribbon(outline, -3, 9.2, 252 / 2), lam("kHull", () => ({ map: tiled(Q.hullTex(), 1, 1), side: THREE.DoubleSide })), true); add(S, flat(outline, 9.2), lam("kDeck", () => ({ map: repT(Q.deckTex()) })), false);
  add(S, ribbon(outline.map(([x, z]) => [x * 0.995, z * 0.98] as [number, number]), 9.2, 10.2, 252), W, true);
  const cabin = lam("kCabin", () => ({ map: repT(Q.cabinTex()) }));
  add(S, box(-36, 9.2, -5.6, 34, 12.2, 5.6, 12), cabin, true); add(S, box(-37, 12.2, -6.3, 35, 12.4, 6.3), W, true); add(S, box(-28, 12.4, -4.6, 27, 15, 4.6, 12), cabin, true); add(S, box(-29, 15, -5.1, 28, 15.2, 5.1), W, true);
  add(S, box(17, 15.2, -4.2, 26, 17.8, 4.2, 12), cabin, true); add(S, box(16.4, 17.8, -5.2, 26.8, 18.0, 5.2), W, true);
  for (const x of [-13, 5]) { add(S, cyl(2.3, 2.5, 9.5, x, 19.9, 0, 18), col("funnel", "#e9b44a"), true); add(S, cyl(2.34, 2.34, 2.2, x, 23.6, 0, 18), col("funnelTop", "#23222c"), true); add(S, cyl(2.4, 2.4, 0.3, x, 21.6, 0, 18), col("funnelBand", "#b8362e")); }
  for (const x of [-48, 44]) { add(S, cyl(0.16, 0.24, 17, x, 17.7, 0, 8), col("mast", "#c9a86a"), true); add(S, rbox(0.14, 0.14, 9, 0, 0, 0.9, x + (x < 0 ? 3.2 : -3.2), 14, 0), col("mast", "#c9a86a")); }
  for (let i = 0; i < 6; i++) for (const sz of [-1, 1]) { const x = -30 + i * 10.4; add(S, sph(1, x, 13.4, sz * 5.9, 2.6, 0.75, 0.8, 10), col("boat", "#f7f5ee"), true); add(S, box(x - 2.4, 13.75, sz * 5.9 - 0.75, x + 2.4, 13.9, sz * 5.9 + 0.75), col("boatCover", "#c9862e")); }
  for (const sz of [-1, 1]) for (let i = 0; i < 44; i++) { const x = -34 + i * 1.6; add(S, cyl(0.03, 0.03, 1.0, x, 12.9, sz * 6.25, 4), W); } for (const sz of [-1, 1]) add(S, box(-36, 13.35, sz * 6.25 - 0.03, 35, 13.42, sz * 6.25 + 0.03), W);
  // gangway from the quay up to the main deck
  { const g = new THREE.BoxGeometry(1.5, 0.14, GANG.len); g.rotateX(GANG.a); g.translate(GANG.x, GANG.y, GANG.z); add(S, g, lam("kGang", () => ({ map: repT(P.plankTex("g", "#c9a26a")) })), true);
    for (const dx of [-0.75, 0.75]) { const r = new THREE.BoxGeometry(0.05, 0.05, GANG.len); r.rotateX(GANG.a); r.translate(GANG.x + dx, GANG.y + 1.0, GANG.z); add(S, r, W); for (let k = 0; k < 7; k++) { const t = (k + 0.5) / 7, z = GANG.z + (t - 0.5) * GANG.len * Math.cos(GANG.a), y = GANG.y - (t - 0.5) * GANG.len * Math.sin(GANG.a); add(S, cyl(0.025, 0.025, 1.0, GANG.x + dx, y + 0.5, z, 4), W); } } }
}

// ---------------- the station and the train ----------------
export function buildStation(R: THREE.Object3D, refs: Refs) {
  const Gp = refs.station; R.add(Gp);
  const A = (g: THREE.BufferGeometry, m: THREE.Material, cast = false) => add(Gp, g, m, cast);
  const W = white(), I = iron(), stone = lam("kQuay", () => ({ map: repT(Q.quayTex()) }));
  A(ground(TX - 400, TX + 400, -400, 0, 0, 800 / 16, 400 / 16), lam("kVeld", () => ({ map: repT(Q.outfieldTex()), color: "#d9cf8a" })));
  A(ground(TX - 400, TX + 400, -4.3, 0.2, 0.02, 800 / 2.4, 1), lam("kBallast", () => ({ map: repT(Q.ballastTex()) })));
  for (const z of [-1.08, -2.52]) A(box(TX - 400, 0.02, z - 0.04, TX + 400, 0.2, z + 0.04), col("rail", "#8f9aa8"), true);
  A(box(TX - 80, 0, 0, TX + 80, 1.0, 9, 5), stone, true); A(box(TX - 80, 1.0, 0, TX + 80, 1.03, 0.5), col("edge", "#fbfaf2"));
  A(ground(TX - 400, TX + 400, 9, 400, 0, 800 / 5, 391 / 5), lam("kYard", () => ({ map: repT(P.roadTex()) })));
  // station building, canopy on iron columns
  A(box(TX - 34, 1.0, 9, TX + 34, 7.2, 16), col("stBody", "#efe2c2"), true); A(wall(TX - 34, 8.97, TX + 34, 8.97, 1.0, 7.2, 3, 1), lam("kStation", () => ({ map: repT(Q.stationTex()), side: THREE.DoubleSide })));
  A(rbox(70, 0.3, 5, 0.5, 0, 0, TX, 8.3, 10.9), lam("kRoof", () => ({ map: repT(Q.roofTex()), side: THREE.DoubleSide })), true); A(rbox(70, 0.3, 5, -0.5, 0, 0, TX, 8.3, 14.6), lam("kRoof", () => ({ map: repT(Q.roofTex()), side: THREE.DoubleSide })), true);
  A(rbox(66, 0.18, 7.4, -0.1, 0, 0, TX, 5.55, 5.1), lam("jTin", () => ({ map: repT(P.tinTex()), side: THREE.DoubleSide })), false);
  for (let x = -30; x <= 30; x += 10) { A(cyl(0.11, 0.14, 4.9, TX + x, 3.45, 1.9, 8), col("colG", "#2f6a4a"), true); A(rbox(1.5, 0.08, 0.08, 0, 0, 0.7, TX + x + 0.55, 5.25, 1.9), col("colG", "#2f6a4a")); A(rbox(1.5, 0.08, 0.08, 0, 0, -0.7, TX + x - 0.55, 5.25, 1.9), col("colG", "#2f6a4a")); }
  for (let x = -25; x <= 25; x += 10) { const b = new THREE.Mesh(sph(0.2, TX + x, 4.9, 3.4), hot([4.6, 3.8, 2.2])); b.layers.set(NOINK); Gp.add(b); A(cyl(0.015, 0.015, 0.5, TX + x, 5.2, 3.4, 4), I); }
  // hanging clock, benches, a trolley of trunks, milk churns
  { const f = new THREE.Mesh(new THREE.CircleGeometry(0.5, 20), lam("kClock", () => ({ map: Q.clockTex(), alphaTest: 0.5, side: THREE.DoubleSide }))); f.position.set(TX + 4, 4.3, 3.0); f.rotation.y = Math.PI; Gp.add(f); A(cyl(0.02, 0.02, 0.8, TX + 4, 5.1, 3.05, 4), I); A(cylZ(0.54, 0.12, TX + 4, 4.3, 3.07, 20), I); }
  const wood = lam("kWood", () => ({ map: repT(P.plankTex("k", "#b0733a")) }));
  for (const x of [-18, 16]) { A(box(TX + x - 1, 1.42, 7.9, TX + x + 1, 1.48, 8.4, 1), wood, true); A(box(TX + x - 1, 1.5, 8.38, TX + x + 1, 1.95, 8.44, 1), wood, true); for (const dx of [-0.9, 0.9]) A(box(TX + x + dx - 0.04, 1.0, 7.95, TX + x + dx + 0.04, 1.42, 8.4), I); }
  { const x = TX - 8, z = 6.4; A(box(x - 1.1, 1.3, z - 0.6, x + 1.1, 1.38, z + 0.6, 1), wood, true); for (const dx of [-0.8, 0.8]) A(cylZ(0.3, 0.1, x + dx, 1.3, z + 0.66, 12), I, true);
    ([[-0.5, 0.5, "#6a4a2c"], [0.45, 0.42, "#3f5f8a"], [-0.1, 0.36, "#8a3a2e"]] as [number, number, string][]).forEach(([dx, h, c], i) => A(box(x + dx - 0.42, 1.38 + (i === 2 ? 0.5 : 0), z - 0.3, x + dx + 0.42, 1.38 + (i === 2 ? 0.5 : 0) + h, z + 0.3), col("trunk", c), true)); }
  for (const dx of [0, 0.5, 0.25]) A(cyl(0.2, 0.24, 0.6, TX + 24 + dx, 1.3 + (dx === 0.25 ? 0 : 0), 7.6 - (dx === 0.25 ? 0.42 : 0), 10), col("churn", "#c9d2de"), true);
  // water tower and a few thorn trees on the veld, hills beyond
  { const x = TX + 46, z = -16; for (const [dx, dz] of [[-1.4, -1.4], [1.4, -1.4], [-1.4, 1.4], [1.4, 1.4]]) A(cyl(0.12, 0.12, 6, x + dx, 3, z + dz, 6), I, true); A(cyl(2.4, 2.4, 3, x, 7.5, z, 16), col("tank", "#a8583e"), true); const c = new THREE.ConeGeometry(2.6, 1, 16); c.translate(x, 9.5, z); A(c, col("tankR", "#6a4030"), true); }
  const palm = palmKit(Gp, refs); for (let i = 0; i < 12; i++) palm(TX - 70 + i * 13 + (i % 3) * 4, 0, -24 - (i % 4) * 12, 7 + (i % 3), 0.25 * Math.sin(i * 2), -0.2, i);
  for (let i = 0; i < 6; i++) palm(TX - 60 + i * 24, 0, 22 + (i % 2) * 6, 8 + (i % 3), 0.2, 0.2, i + 1);
  hillsKit(Gp, refs)(TX, 0, Math.PI / 2, [1.05, 0.95, 0.75]); hillsKit(Gp, refs)(TX, 0, -Math.PI / 2, [1.05, 0.95, 0.75]);
  // the train: tender + engine ahead (+x), two carriages, an open balcony at the tail
  const T = refs.train; Gp.add(T); T.position.set(TX, 0, 0);
  const zc = -1.8, car = lam("kCarriage", () => ({ map: repT(Q.carriageTex()), side: THREE.DoubleSide })), carEnd = col("carEnd", "#7a2630"), roofC = col("carRoof", "#d9d2c0"), blk = col("blk", "#23222c"), green = col("loco", "#2f9a5c"), brass = col("brass", "#e8c45a"), red = col("buffer", "#c9382e");
  for (const x0 of [-34, -16.6]) { const x1 = x0 + 16.8;
    add(T, box(x0, 1.1, zc - 1.4, x1, 3.7, zc + 1.4), carEnd, true); for (const sz of [-1, 1]) add(T, wall(sz > 0 ? x0 : x1, zc + sz * 1.41, sz > 0 ? x1 : x0, zc + sz * 1.41, 1.1, 3.7), car);
    add(T, cylX(1.5, 16.9, (x0 + x1) / 2, 2.95, zc, 20).scale(1, 0.62, 0.98).translate(0, 1.2, -zc * 0.02 + 0), roofC, true); add(T, box(x0 + 0.4, 0.75, zc - 1.2, x1 - 0.4, 1.1, zc + 1.2), blk);
    for (const dx of [1.8, 3.4, 13.4, 15.0]) for (const sz of [-1, 1]) add(T, cylZ(0.48, 0.14, x0 + dx, 0.66, zc + sz * 0.72, 14), blk, true); }
  // tail balcony
  add(T, box(-36.2, 1.0, zc - 1.4, -34, 1.12, zc + 1.4), blk, true); for (const sz of [-1, 1]) { add(T, box(-36.2, 1.95, zc + sz * 1.36 - 0.03, -34, 2.0, zc + sz * 1.36 + 0.03), brass); for (let k = 0; k < 4; k++) add(T, cyl(0.025, 0.025, 0.9, -36.15 + k * 0.7, 1.55, zc + sz * 1.36, 4), brass); }
  for (const dz of [-1.36, -0.5, 0.5, 1.36]) add(T, cyl(0.025, 0.025, 0.9, -36.17, 1.55, zc + dz, 4), brass); for (const [z0, z1] of [[-1.36, -0.5], [0.5, 1.36]]) add(T, box(-36.2, 1.95, zc + z0, -36.14, 2.0, zc + z1), brass);
  add(T, box(-34.05, 3.55, zc - 1.45, -36.4, 3.68, zc + 1.45), roofC, true); for (const sz of [-1, 1]) add(T, cyl(0.03, 0.03, 2.5, -36.25, 2.3, zc + sz * 1.38, 4), blk);
  add(T, box(-36.9, 0.55, zc - 0.5, -36.2, 0.7, zc + 0.5), blk); add(T, box(-36.9, 0.3, zc - 0.5, -36.55, 0.42, zc + 0.5), blk);
  // tender and engine
  add(T, box(0.6, 1.0, zc - 1.3, 5.4, 3.0, zc + 1.3), green, true); add(T, box(0.9, 3.0, zc - 1.0, 5.1, 3.25, zc + 1.0), blk, true); for (const dx of [1.5, 3.0, 4.5]) for (const sz of [-1, 1]) add(T, cylZ(0.5, 0.14, dx, 0.68, zc + sz * 0.72, 14), blk, true);
  add(T, box(6.0, 1.2, zc - 1.35, 8.4, 3.9, zc + 1.35), green, true); add(T, box(5.8, 3.9, zc - 1.5, 8.7, 4.05, zc + 1.5), blk, true); for (const sz of [-1, 1]) add(T, box(6.5, 2.7, zc + sz * 1.36, 7.9, 3.5, zc + sz * 1.37), col("cabWin", "#27303d"));
  add(T, cylX(1.08, 7.2, 12.0, 2.5, zc, 20), green, true); add(T, cylX(1.12, 1.2, 16.1, 2.5, zc, 20), blk, true); add(T, cylX(0.5, 0.1, 16.75, 2.5, zc, 14), col("smokeDoor", "#3a3844"));
  add(T, cyl(0.3, 0.38, 1.1, 15.9, 4.05, zc, 12), blk, true); add(T, cyl(0.4, 0.3, 0.2, 15.9, 4.65, zc, 12), brass); add(T, sph(0.46, 12.4, 3.65, zc, 1, 0.9, 1), brass, true); add(T, sph(0.36, 10.2, 3.6, zc, 1, 0.8, 1), green, true);
  for (const x of [9.6, 11.9, 14.2]) add(T, cylX(1.1, 0.12, x, 2.5, zc, 20), brass);
  add(T, box(8.4, 1.05, zc - 1.3, 17.3, 1.3, zc + 1.3), blk, true); add(T, box(17.2, 0.8, zc - 1.4, 17.5, 1.35, zc + 1.4), red, true); for (const sz of [-1, 1]) add(T, cylX(0.2, 0.4, 17.7, 1.08, zc + sz * 0.85, 10), blk);
  for (const x of [9.4, 11.4, 13.4]) for (const sz of [-1, 1]) { add(T, cylZ(0.88, 0.16, x, 0.9, zc + sz * 0.76, 20), col("wheelR", "#e2453c"), true); add(T, cylZ(0.2, 0.2, x, 0.9, zc + sz * 0.8, 10), blk); }
  for (const x of [15.4, 16.6]) for (const sz of [-1, 1]) add(T, cylZ(0.45, 0.14, x, 0.47, zc + sz * 0.72, 14), blk, true);
  for (const sz of [-1, 1]) { add(T, box(9.4, 0.84, zc + sz * 0.92, 13.4, 0.96, zc + sz * 0.96), col("rod", "#c9d2de")); add(T, cylX(0.32, 1.5, 15.2, 1.45, zc + sz * 1.05, 12), blk, true); }
  { const g = new THREE.BoxGeometry(1.3, 0.1, 2.5); g.rotateZ(-0.6); g.translate(18.0, 0.55, zc); add(T, g, red, true); }
}
