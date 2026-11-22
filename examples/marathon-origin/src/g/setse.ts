// England, 1908: a green park to the horizon, the castle on its mound (round tower, curtain walls with battlements,
// corner towers), the lawn where the race starts, an avenue of oaks, and the stadium of 1908 (cinder track, stands
// with roofs, the royal box with its red canopy). Same building blocks as Greece.
import * as THREE from "three";
import { Batch, wmat, pmat, makeCrowd, Spot, Crowd, solid } from "./real";
import { hash, boards } from "./pbr";
import { NOINK } from "./ink";
import { makeTreesV2, TSpec } from "./trees";
import { terrain, engW, strip, roadMat, limestone, heightTex, makeGrassH, GrassH } from "./ground";
import { HE, ENG, CASTLE, WCITY, sst } from "./geo";
import { gent08, lady08, steward } from "./castg";
import { Char } from "./toon";
import { flag, prism } from "./setsg";
import { camAt, TOTAL } from "./story";
const CAMP: [number, number, number][] = []; for (let f = 0; f < TOTAL; f++) CAMP.push(camAt(0, f).pos);
const inPath = (x0: number, z0: number, x1: number, z1: number, y0: number, y1: number) => CAMP.some(([x, y, z]) => x > x0 && x < x1 && z > z0 && z < z1 && y > y0 && y < y1);
export type ERefs = { eng: THREE.Group; grass: GrassH[]; crowds: Crowd[]; flags: THREE.Mesh[]; tiles: { g: THREE.Group; x: number; z: number }[] };
export const newERefs = (): ERefs => ({ eng: new THREE.Group(), grass: [], crowds: [], flags: [], tiles: [] });
const R = (i: number, j: number, s = 0) => hash(i, j, 991 + s);
/** the oval of the 1908 stadium: straights along x, track inner edge */
export const WC = { L: 150, R: 42, lane: 8 };
export const wcPoint = (s: number, off: number): [number, number] => { // s along the inner edge from the north-east corner, anticlockwise seen from above
  const L = WC.L, r = WC.R + off, x0 = WCITY.x - L / 2, x1 = WCITY.x + L / 2, z = WCITY.z, tot = 2 * L + 2 * Math.PI * r; s = ((s % tot) + tot) % tot;
  if (s < L) return [x1 - s, z - r]; s -= L; if (s < Math.PI * r) { const a = s / r; return [x0 - r * Math.sin(a), z - r * Math.cos(a)]; } s -= Math.PI * r; if (s < L) return [x0 + s, z + r]; s -= L; const a = s / r; return [x1 + r * Math.sin(a), z + r * Math.cos(a)]; };
export const buildEngland = (root: THREE.Object3D, refs: ERefs) => {
  const E = refs.eng; root.add(E);
  const stone = wmat("castleStone", limestone(), 2.0, { color: "#c9c4b8" }), dark = pmat("#2a2a30", 0.7), red = pmat("#a8222a", 0.8), gold = pmat("#d8a838", 0.3, 0.8), wood = wmat("boardsE", boards("boardsE", 6, 0.6), 1.4, { color: "#7a5a3a" }), white = pmat("#f2efe6", 0.6), green = pmat("#2f5a3a", 0.7), roofM = pmat("#4a4e58", 0.6, 0.2);
  E.add(terrain(ENG - 320, -560, ENG + 980, 560, 4, HE, engW, 1, 2));
  E.add(terrain(ENG - 4000, -4000, ENG + 4600, 4000, 70, (x, z) => (x > ENG - 315 && x < ENG + 975 && z > -555 && z < 555 ? HE(x, z) - 6 : HE(x, z) + 50 * sst(900, 2600, Math.hypot(x - ENG - 300, z))), (x, z, h, sl) => { const w = engW(x, z, h, sl); return [w[0], w[1], 0, Math.min(1, sst(700, 1400, Math.hypot(x - ENG - 300, z)) * 0.9)]; }, 1));
  const B = new Batch();
  // the castle: curtain walls with battlements round the mound, square corner towers, the round tower on top, a gate
  const cx = CASTLE[0], cz = CASTLE[1], X0 = cx - 95, X1 = cx + 55, Z0 = cz - 70, Z1 = cz + 48;
  const wall = (ax: number, az: number, bx: number, bz: number, hgt: number) => { const L = Math.hypot(bx - ax, bz - az), n = Math.ceil(L / 3); for (let i = 0; i < n; i++) { const t0 = i / n, t1 = (i + 1) / n, x = ax + (bx - ax) * (t0 + t1) / 2, z = az + (bz - az) * (t0 + t1) / 2, y = HE(x, z) - 1, yaw = -Math.atan2(bz - az, bx - ax);
      B.slab(stone, x, y + hgt / 2, z, L / n + 0.05, hgt, 2.6, [0, yaw, 0]); if (i % 2 === 0) B.slab(stone, x, y + hgt + 0.6, z, L / n * 0.55, 1.2, 2.6, [0, yaw, 0]); if (i % 3 === 1) B.slab(dark, x, y + hgt * 0.6, z, 0.6, 1.6, 2.7, [0, yaw, 0]); } };
  wall(X0, Z0, X1, Z0, 12); wall(X0, Z1, X1, Z1, 12); wall(X0, Z0, X0, Z1, 12); wall(X1, Z0, X1, cz - 8, 12); wall(X1, cz + 8, X1, Z1, 12);
  { const y = HE(X1, cz) - 1; B.box(stone, X1 - 3, y + 8, cz - 8, X1 + 3, y + 16, cz + 8); B.box(dark, X1 + 2.9, y, cz - 3.2, X1 + 3.1, y + 7.4, cz + 3.2); for (let k = -3; k <= 3; k++) B.box(stone, X1 + 2.2, y + 16, cz + k * 2.3 - 0.6, X1 + 3.2, y + 17.3, cz + k * 2.3 + 0.6); }
  solid("castle wall", X1 - 1.4, Z0, X1 + 1.4, cz - 8, 16); solid("castle wall", X1 - 1.4, cz + 8, X1 + 1.4, Z1, 16); solid("castle wall", X0, Z1 - 1.4, X1, Z1 + 1.4, 16);
  for (const [x, z] of [[X0, Z0], [X1, Z0], [X0, Z1], [X1, Z1], [X1, cz - 10], [X1, cz + 10]]) { const y = HE(x, z) - 1, w = 9; B.box(stone, x - w / 2, y, z - w / 2, x + w / 2, y + 19, z + w / 2); B.box(stone, x - w / 2 - 0.5, y + 17.4, z - w / 2 - 0.5, x + w / 2 + 0.5, y + 19, z + w / 2 + 0.5); for (let k = 0; k < 4; k++) B.box(dark, x - 0.15 + (k % 2 ? 0 : (k ? -1 : 1) * (w / 2)), y + 9, z - 0.15 + (k % 2 ? (k === 1 ? -1 : 1) * (w / 2) : 0), x + 0.15 + (k % 2 ? 0 : (k ? -1 : 1) * (w / 2)), y + 12, z + 0.15 + (k % 2 ? (k === 1 ? -1 : 1) * (w / 2) : 0)); for (let k = 0; k < 4; k++) for (let j = 0; j < 3; j++) { const a = k * Math.PI / 2; B.box(stone, x + (w / 2 - 0.6) * Math.cos(a) - 0.6 + (j - 1) * 2.8 * Math.sin(a), y + 19, z + (w / 2 - 0.6) * Math.sin(a) - 0.6 + (j - 1) * 2.8 * Math.cos(a), x + (w / 2 - 0.6) * Math.cos(a) + 0.6 + (j - 1) * 2.8 * Math.sin(a), y + 20.4, z + (w / 2 - 0.6) * Math.sin(a) + 0.6 + (j - 1) * 2.8 * Math.cos(a)); }
    for (let k = 0; k < 3; k++) B.box(dark, x + w / 2 - 0.1, y + 6 + k * 4, z - 0.4, x + w / 2 + 0.1, y + 7.6 + k * 4, z + 0.4); solid("castle tower", x - w / 2, z - w / 2, x + w / 2, z + w / 2, y + 20); }
  { const y = HE(cx, cz), r = 12; B.cyl(stone, cx, y + 9, cz, r, 22, undefined, undefined, r); for (let a = 0; a < 6.283; a += 0.42) B.box(stone, cx + (r - 0.6) * Math.cos(a) - 0.9, y + 20, cz + (r - 0.6) * Math.sin(a) - 0.9, cx + (r - 0.6) * Math.cos(a) + 0.9, y + 21.6, cz + (r - 0.6) * Math.sin(a) + 0.9);
    for (let a = 0.2; a < 6.283; a += 0.9) B.box(dark, cx + r * Math.cos(a) - 0.4, y + 12, cz + r * Math.sin(a) - 0.4, cx + r * Math.cos(a) + 0.4, y + 14, cz + r * Math.sin(a) + 0.4); flag(E, refs, cx, y + 20, cz, "red", 1.6); solid("round tower", cx - r, cz - r, cx + r, cz + r, y + 22); }
  B.box(stone, X0 + 20, HE(X0 + 20, Z0 + 20), Z0 + 14, X0 + 60, HE(X0 + 20, Z0 + 20) + 14, Z0 + 30); B.box(roofM, X0 + 20, HE(X0 + 20, Z0 + 20) + 14, Z0 + 14, X0 + 60, HE(X0 + 20, Z0 + 20) + 15, Z0 + 30);
  // the start lawn, the avenue (gravel), the stadium approach
  { const pts: [number, number][] = []; for (let x = X1 + 4; x <= WCITY.x - WC.L / 2 - WC.R - 18; x += 2) pts.push([x, 0]); E.add(strip(pts, 7, roadMat(), HE, 0.05, 8)); }
  for (const s of [-1, 1]) for (let x = X1 + 30; x < WCITY.x - WC.L / 2 - WC.R - 30; x += 16) { const z = s * 4.2; B.cyl(white, x, HE(x, z) + 0.45, z, 0.06, 0.9); if (x + 16 < WCITY.x - 130) B.rod(white, [x, HE(x, z) + 0.85, z], [x + 16, HE(x + 16, z) + 0.85, z], 0.02); }
  const spots: Spot[] = [];
  for (let i = 0; i < 700; i++) { const x = X1 + 12 + R(i, 1) * (WCITY.x - WC.L / 2 - WC.R - X1 - 50), s = R(i, 2) < 0.5 ? -1 : 1, z = s * (5.4 + 3 * R(i, 3)); spots.push({ x, y: HE(x, z), z, k: Math.floor(R(i, 4) * 12), ph: R(i, 5) }); }
  for (let i = 0; i < 300; i++) { const x = X1 + 6 + R(i, 6) * 40, z = -(8 + R(i, 7) * 34); spots.push({ x, y: HE(x, z), z, k: Math.floor(R(i, 8) * 12), ph: R(i, 9) }); }
  // the stadium of 1908: stands round the oval, roofs on the long sides, the royal box on the north side
  const st: Spot[] = [];
  { const rows = 26, tot = (off: number) => 2 * WC.L + 2 * Math.PI * (WC.R + off);
    for (let k = 0; k < rows; k++) { const off = WC.lane + 6 + k * 0.85, y = 0.6 + k * 0.5, T = tot(off), step = 2;
      for (let s = 0; s < T; s += step) { const [x, z] = wcPoint(s, off), [x2, z2] = wcPoint(s + step, off), yaw = -Math.atan2(z2 - z, x2 - x); if (Math.abs(x - WCITY.x - WC.L / 2 - WC.R - off) < 9 && Math.abs(z - WCITY.z) < 9) continue;
        B.slab(k % 2 ? wood : pmat("#6a5a48", 0.8), (x + x2) / 2, y - 0.25, (z + z2) / 2, step + 0.05, 0.5, 0.88, [0, yaw, 0]); for (let q = 0; q < 3; q++) { const t = (q + 0.5) / 3; st.push({ x: x + (x2 - x) * t, y: y + 0.02, z: z + (z2 - z) * t, k: Math.floor(R(Math.round(s), k, 3) * 12), ph: R(Math.round(s * 3), k, 4) }); } } }
    for (const sd of [-1, 1]) { const zr = WCITY.z + sd * (WC.R + WC.lane + 6 + rows * 0.85 + 1), zf = WCITY.z + sd * (WC.R + WC.lane + 8); B.box(roofM, WCITY.x - WC.L / 2, 17, Math.min(zr, zf) - 1, WCITY.x + WC.L / 2, 17.6, Math.max(zr, zf) + 1);
      for (let x = WCITY.x - WC.L / 2; x <= WCITY.x + WC.L / 2; x += 12) { B.cyl(pmat("#5a5e68", 0.5, 0.4), x, 8.5, zf, 0.25, 17); B.cyl(pmat("#5a5e68", 0.5, 0.4), x, 8.5, zr, 0.3, 17); }
      B.box(pmat("#6a5a48", 0.8), WCITY.x - WC.L / 2 - 4, 0, Math.min(zr, zr + sd * 2), WCITY.x + WC.L / 2 + 4, 15, Math.max(zr, zr + sd * 2)); }
    // the royal box: a raised dais with a red and gold canopy at the finish (north side, middle)
    const bx = WCITY.x, bz = WCITY.z - (WC.R + WC.lane + 6.5); B.box(red, bx - 8, 0, bz - 6, bx + 8, 3.2, bz - 1); B.box(white, bx - 8.2, 3.2, bz - 1.3, bx + 8.2, 4.1, bz - 1); B.box(gold, bx - 8.3, 4.1, bz - 1.35, bx + 8.3, 4.25, bz - 0.95);
    for (const x of [-8, 8]) B.cyl(gold, bx + x, 6.6, bz - 1.2, 0.18, 5); B.box(red, bx - 8.6, 9, bz - 6.5, bx + 8.6, 9.8, bz - 0.6); B.box(gold, bx - 8.7, 9.8, bz - 0.8, bx + 8.7, 10.2, bz - 0.5);
    for (let i = 0; i < 9; i++) B.slab(red, bx - 8 + i * 2, 8.7, bz - 0.5, 1.6, 0.8, 0.1, [0, 0, 0], undefined); prism(B, red, bx, 9.8, bz - 3.5, 17.4, 1.6, 6.4, 0); B.cyl(gold, bx, 11.75, bz - 3.5, 0.75, 0.55); for (let a = 0; a < 6.283; a += 0.785) B.sph(gold, bx + 0.75 * Math.cos(a), 12.1, bz - 3.5 + 0.75 * Math.sin(a), 0.16); B.sph(gold, bx, 12.35, bz - 3.5, 0.55, 0.45, 0.55).sph(red, bx, 12.0, bz - 3.5, 0.62, 0.3, 0.62).sph(gold, bx, 12.95, bz - 3.5, 0.18);
    flag(E, refs, bx - 10, 10, bz - 1.5, "red", 1); flag(E, refs, bx + 10, 10, bz - 1.5, "red", 1); solid("royal box", bx - 9, bz - 7, bx + 9, bz - 0.5, 10);
    // the cinder track and the grass inside it, the finish line in front of the royal box
    const trk = new THREE.Shape(); for (let s = 0; s <= tot(WC.lane); s += 2) { const [x, z] = wcPoint(s, WC.lane); if (s === 0) trk.moveTo(x - WCITY.x, -(z - WCITY.z)); else trk.lineTo(x - WCITY.x, -(z - WCITY.z)); }
    const hole = new THREE.Path(); for (let s = 0; s <= tot(0); s += 2) { const [x, z] = wcPoint(s, 0); if (s === 0) hole.moveTo(x - WCITY.x, -(z - WCITY.z)); else hole.lineTo(x - WCITY.x, -(z - WCITY.z)); } trk.holes.push(hole);
    const tg = new THREE.ShapeGeometry(trk, 4); tg.rotateX(-Math.PI / 2); const tm = new THREE.Mesh(tg, pmat("#9a5a3e", 0.95)); tm.position.set(WCITY.x, HE(WCITY.x, WCITY.z) + 0.04, WCITY.z); tm.receiveShadow = true; tm.layers.set(NOINK); E.add(tm);
    B.box(white, bx - 0.12, HE(bx, bz) + 0.05, WCITY.z - WC.R - WC.lane, bx + 0.12, HE(bx, bz) + 0.07, WCITY.z - WC.R); for (const z of [WCITY.z - WC.R - WC.lane - 0.4, WCITY.z - WC.R + 0.4]) { B.cyl(white, bx, 0.8, z, 0.05, 1.6); solid("finish post", bx - 0.1, z - 0.1, bx + 0.1, z + 0.1, 1.7); } }
  const castE: Char[] = []; for (let i = 0; i < 12; i++) castE.push(i % 3 === 0 ? lady08(i) : i % 5 === 1 ? steward(i) : gent08(i));
  const c1 = makeCrowd(castE, [{ expr: "smile" }, { expr: "laugh", armL: "up", armR: "up", holdR: "hatW" }], st, 9), c2 = makeCrowd(castE, [{ expr: "smile", armR: "wave" }, { expr: "laugh", armL: "up", armR: "up" }], spots, 11); E.add(c1.mesh, c2.mesh); refs.crowds.push(c1, c2);
  // trees: oaks along the avenue, belts of oak, plane and poplar round the park and beyond (the horizon is woods)
  const tiles = new Map<string, TSpec[]>(), plant = (t: TSpec) => { const cr = Math.max(2.5, t.h * 0.42) + 1.2, ty = t.y ?? 0; if (inPath(t.x - cr, t.z - cr, t.x + cr, t.z + cr, ty - 1, ty + t.h + 2)) return; solid("tree crown", t.x - t.h * 0.3, t.z - t.h * 0.3, t.x + t.h * 0.3, t.z + t.h * 0.3, ty + t.h, ty + t.h * 0.35); const k = `${Math.floor(t.x / 100)}|${Math.floor(t.z / 100)}`; let l = tiles.get(k); if (!l) { l = []; tiles.set(k, l); } l.push(t); };
  for (const s of [-1, 1]) for (let x = X1 + 64; x < WCITY.x - WC.L / 2 - WC.R - 26; x += 13) { const z = s * (11 + 2 * R(Math.round(x), s)); plant({ x, z, y: HE(x, z) - 0.2, h: 15 + 5 * R(Math.round(x), s + 4), sp: "oak", seed: Math.round(x) * 3 + s, lod: 0 }); }
  for (let i = 0; i < 900; i++) { const x = ENG - 300 + R(i, 21) * 1250, z = (R(i, 22) - 0.5) * 1100; if (x > X0 - 30 && x < WCITY.x + WC.L / 2 + WC.R + 50 && Math.abs(z) < 150) continue; if (x > X0 - 20 && x < X1 + 20 && z > Z0 - 20 && z < Z1 + 20) continue;
    plant({ x, z, y: HE(x, z) - 0.2, h: 12 + 9 * R(i, 23), sp: (["oak", "plane", "poplar", "oak"] as const)[Math.floor(R(i, 24) * 4)], seed: 7000 + i, lod: Math.abs(z) < 250 ? 1 : 2 }); }
  for (const [k, list] of tiles) { const g = new THREE.Group(); makeTreesV2(g, list); E.add(g); const [tx, tz] = k.split("|").map(Number); refs.tiles.push({ g, x: tx * 100 + 50, z: tz * 100 + 50 }); }
  B.build(E);
  const hm = heightTex(ENG - 310, -550, ENG + 970, 550, 2, HE);
  refs.grass.push(makeGrassH(150000, 22, hm, { h0: 0.06, h1: 0.22, w: 0.04, base: ["#2f5a24", "#3a6a2a"], tip: ["#6a9a3e", "#7aaa48", "#88b450", "#5a8a36"], flowers: 0.01, lean: 0.4,
    mask: `( 1.0 - smoothstep( 3.2, 4.2, 4.0 - abs( wp.y ) ) * step( wp.x, ${(WCITY.x - WC.L / 2 - WC.R - 18).toFixed(1)} ) ) * ( 1.0 - step( abs( wp.y ), ${(WC.R + WC.lane + 4).toFixed(1)} ) * step( abs( wp.x - ${WCITY.x.toFixed(1)} ), ${(WC.L / 2 + WC.R + WC.lane + 4).toFixed(1)} ) * ( 1.0 - step( abs( wp.y ), ${(WC.R - 1).toFixed(1)} ) * step( abs( wp.x - ${WCITY.x.toFixed(1)} ), ${(WC.L / 2).toFixed(1)} ) ) )` }));
  for (const g of refs.grass) E.add(g.mesh);
};
