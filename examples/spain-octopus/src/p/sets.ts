// 3D sets for "El pulpo": a Galician plaza with Manolo's octopus stall, and the aquarium hall with Paul's tank.
// Boxes/quads with the painted textures of paint3.ts; the ink pass draws the geometry edges.
import * as THREE from "three";
import { ctex } from "./paint";
import { PAINT3, housePainter, HouseOpt } from "./paint3";
import { lam, add, box, ground, wall, ceil, repT } from "./kit";

export const CX = 3000;        // plaza origin: stall at z -3..-0.2, plaza z -3..15, x +-13
export const AX = 3300;        // aquarium hall: x +-6, z -4..6; tank behind the wall z = -4
export const TANK: [number, number, number] = [AX, 1.9, -5.2]; // where Paul floats
const T = (name: string) => { const p = PAINT3[name]; return ctex("p3_" + name, p.w, p.h, p.draw); };
const TR = (name: string) => repT(T(name));
/** materials whose emissive (lit windows) is driven per shot: world.ts sets emissiveIntensity = night ? k : 0 */
export const NIGHT_MATS: { m: THREE.MeshLambertMaterial; k: number }[] = [];
export const LAMP_MATS: THREE.MeshBasicMaterial[] = [];
export type SetRefs = { fest: THREE.Group; screen: THREE.Group; flags: THREE.Group; lids: THREE.Group };
const hot = (c: [number, number, number]) => { const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(...c) }); LAMP_MATS.push(m); (m.userData as { hot: [number, number, number] }).hot = c; return m; };
const cyl = (r0: number, r1: number, h: number, x: number, y: number, z: number, seg = 20, open = false) => { const g = new THREE.CylinderGeometry(r0, r1, h, seg, 1, open); g.translate(x, y, z); return g; };

const HOUSES: HouseOpt[] = [
  { stone: true, wall: "#b9b3a8", trim: "#d8d2c6", door: "#2f6f5a", gallery: 1, ground: "pulpo", seed: 3 },
  { stone: false, wall: "#f1ede4", trim: "#aaa39a", door: "#7a2f2a", gallery: 0, ground: "arch", seed: 5 },
  { stone: true, wall: "#c4b9a4", trim: "#e2dccf", door: "#2f4f8a", gallery: 2, ground: "shop", seed: 8 },
  { stone: false, wall: "#efe6d2", trim: "#b0a89c", door: "#2f6f5a", gallery: 1, ground: "shop", seed: 11 },
  { stone: true, wall: "#aeb0b4", trim: "#d2d4d6", door: "#7a2f2a", gallery: 0, ground: "arch", seed: 14 },
];
/** bunting line between two points (texture strip hanging below the line) */
const bunt = (G: THREE.Object3D, tex: string, x0: number, y0: number, z0: number, x1: number, y1: number, z1: number) => {
  const L = Math.hypot(x1 - x0, z1 - z0), g = new THREE.BufferGeometry(), n = 10, pos: number[] = [], uv: number[] = [], idx: number[] = [];
  for (let i = 0; i <= n; i++) { const t = i / n, sag = 0.5 * Math.sin(Math.PI * t), x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t - sag, z = z0 + (z1 - z0) * t; pos.push(x, y, z, x, y - 0.42, z); uv.push(t * L / 5.4, 1, t * L / 5.4, 0); }
  for (let i = 0; i < n; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, lam("bunt_" + tex, () => ({ map: TR(tex), transparent: true, alphaTest: 0.5, side: THREE.DoubleSide }))); G.add(m);
};

export function buildPlaza(R: THREE.Object3D): SetRefs {
  const A = (g: THREE.BufferGeometry, m: THREE.Material, cast = false, G: THREE.Object3D = R) => add(G, g, m, cast);
  const wood = lam("pWood", () => ({ color: "#8a5a34" })), dwood = lam("pDWood", () => ({ color: "#5a3a24" })), iron = lam("pIron", () => ({ color: "#2c2a38" }));
  const copper = lam("pCopper", () => ({ color: "#d07a3c" })), white = lam("pWhite", () => ({ color: "#fbf8f0" })), stone = lam("pStone", () => ({ color: "#bdb6aa" }));
  A(ground(CX - 13, CX + 13, -3, 15, 0, 26 / 4, 18 / 4), lam("granite", () => ({ map: TR("granite") })));
  // houses round the plaza. face: which way the front looks
  const house = (a0: number, a1: number, fixed: number, face: "s" | "n" | "e" | "w", h: number, k: number, ground?: HouseOpt["ground"]) => {
    const o = { ...HOUSES[k % HOUSES.length], seed: k * 5 + 2, ...(ground ? { ground } : {}) }, wm = a1 - a0, key = `house_${k}_${wm.toFixed(1)}_${h}_${o.ground}`;
    const P = housePainter(wm, h, o, false), Gp = housePainter(wm, h, o, true);
    const sc = (p: typeof P, s: number): [number, number, (g: CanvasRenderingContext2D, r: () => number) => void] => [Math.round(p.w * s), Math.round(p.h * s), (g, r) => { g.save(); g.scale(s, s); p.draw(g, r); g.restore(); }];
    const m = lam(key, () => ({ map: ctex(key, ...sc(P, 0.56)), emissiveMap: ctex(key + "g", ...sc(Gp, 0.22)), emissive: new THREE.Color("#ffffff"), emissiveIntensity: 0 }));
    NIGHT_MATS.push({ m, k: 2.6 });
    const e = 0.004, body = lam("hBody" + k, () => ({ color: o.wall }));
    if (face === "s") { A(wall(a0, fixed + e, a1, fixed + e, 0, h), m); A(box(a0, 0, fixed - 7, a1, h, fixed), body, true); }
    if (face === "n") { A(wall(a1, fixed - e, a0, fixed - e, 0, h), m); A(box(a0, 0, fixed, a1, h, fixed + 7), body, true); }
    if (face === "e") { A(wall(fixed + e, a1, fixed + e, a0, 0, h), m); A(box(fixed - 7, 0, a0, fixed, h, a1), body, true); }
    if (face === "w") { A(wall(fixed - e, a0, fixed - e, a1, 0, h), m); A(box(fixed, 0, a0, fixed + 7, h, a1), body, true); }
  };
  house(CX - 13, CX - 4.5, -3, "s", 12.6, 2); house(CX - 4.5, CX + 4.5, -3, "s", 9.6, 0, "pulpo"); house(CX + 4.5, CX + 13, -3, "s", 13.2, 3);
  house(-3, 6, CX - 13, "e", 12.8, 1); house(6, 15, CX - 13, "e", 10.2, 4);
  house(-3, 6, CX + 13, "w", 10.4, 4); house(6, 15, CX + 13, "w", 13.0, 2);
  house(CX - 13, CX - 4, 15, "n", 13.0, 3); house(CX - 4, CX + 5, 15, "n", 10.0, 1); house(CX + 5, CX + 13, 15, "n", 12.4, 0, "shop");
  // ---- Manolo's stall ----
  const aw = new THREE.BoxGeometry(6.8, 0.05, 2.9); aw.rotateX(0.2); aw.translate(CX, 2.78, -1.5);
  { const uv = aw.getAttribute("uv") as THREE.BufferAttribute; for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * 7); }
  A(aw, lam("awningG", () => ({ map: TR("awningG") })), true);
  const val = new THREE.BoxGeometry(6.8, 0.3, 0.03); val.translate(CX, 2.34, -0.08);
  { const uv = val.getAttribute("uv") as THREE.BufferAttribute; for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * 7); }
  A(val, lam("awningG", () => ({ map: TR("awningG") })));
  for (const sx of [-1, 1]) A(box(CX + sx * 3.3 - 0.05, 0, -0.2, CX + sx * 3.3 + 0.05, 2.5, -0.1), dwood, true);
  // counter (wood top, plank front)
  A(box(CX - 2.0, 0, -1.05, CX + 2.0, 0.86, -0.5, 1.2), lam("woodFront", () => ({ map: TR("woodTop"), color: "#b08a6a" })), true);
  A(box(CX - 2.1, 0.86, -1.1, CX + 2.1, 0.93, -0.42, 1.5), lam("woodTop", () => ({ map: TR("woodTop") })), true);
  // copper cauldrons on burners, either side of the counter
  const lids = new THREE.Group(); R.add(lids);
  for (const sx of [-1, 1]) {
    const x = CX + sx * 2.85, z = -0.75;
    A(cyl(0.3, 0.36, 0.42, x, 0.21, z), iron, true);
    A(cyl(0.52, 0.4, 0.62, x, 0.73, z, 28), copper, true);
    A(cyl(0.56, 0.56, 0.05, x, 1.05, z, 28), lam("pCopper2", () => ({ color: "#e89a54" })));
    A(cyl(0.48, 0.48, 0.02, x, 1.07, z, 28), lam("broth", () => ({ color: "#7a3550" })));
    for (const s of [-1, 1]) A(box(x + s * 0.56 - 0.03, 0.9, z - 0.08, x + s * 0.65 + 0.03, 0.96, z + 0.08), iron);
    A(cyl(0.6, 0.6, 0.05, x, 1.11, z, 28), lam("pLid", () => ({ color: "#c9cdd4" })), false, lids); A(cyl(0.06, 0.06, 0.08, x, 1.17, z, 10), iron, false, lids);
  }
  // on the counter: stack of wooden plates, oil bottle, paprika tin, salt bowl
  for (let i = 0; i < 5; i++) A(cyl(0.17, 0.15, 0.025, CX - 1.55, 0.945 + i * 0.027, -0.78, 18), i % 2 ? wood : lam("pWood2", () => ({ color: "#b98a54" })));
  A(cyl(0.045, 0.05, 0.26, CX + 1.6, 1.06, -0.85, 12), lam("oil", () => ({ color: "#6a8a2a" }))); A(cyl(0.02, 0.03, 0.08, CX + 1.6, 1.23, -0.85, 8), lam("oilTop", () => ({ color: "#d9c25a" })));
  A(box(CX + 1.3, 0.93, -0.92, CX + 1.42, 1.1, -0.8), lam("tin", () => ({ color: "#c8302a" }))); A(cyl(0.08, 0.05, 0.06, CX + 1.05, 0.96, -0.82, 14), white);
  // string of bulbs along the awning front
  for (let i = 0; i < 11; i++) { const x = CX - 3.1 + i * 0.62, y = 2.2 - 0.07 * Math.sin((i / 10) * Math.PI); const b = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), hot([3.4, 2.4, 1.1])); b.position.set(x, y, -0.06); R.add(b); }
  // terrace: long table with a bench (used by the last shot), barrel tables
  A(box(CX - 1.7, 0.72, 2.3, CX + 1.7, 0.78, 3.1, 1.5), lam("woodTop", () => ({ map: TR("woodTop") })), true);
  for (const sx of [-1.5, 1.5]) for (const z of [2.42, 2.98]) A(box(CX + sx - 0.04, 0, z - 0.04, CX + sx + 0.04, 0.72, z + 0.04), dwood, true);
  for (const [bx, bz] of [[-6.2, 1.2], [6.4, 4.6], [-7.5, 5.5]]) { A(cyl(0.34, 0.3, 0.95, CX + bx, 0.475, bz, 16), wood, true); for (const y of [0.2, 0.75]) A(cyl(0.36, 0.36, 0.05, CX + bx, y, bz, 16), iron); A(cyl(0.45, 0.45, 0.04, CX + bx, 0.97, bz, 18), dwood, true); }
  // fountain in the middle of the plaza (stone basin + column)
  A(cyl(1.5, 1.6, 0.5, CX - 7.5, 0.25, 10.5, 24), stone, true); A(cyl(1.3, 1.3, 0.04, CX - 7.5, 0.5, 10.5, 24), lam("water", () => ({ color: "#6fc0e0" })));
  A(cyl(0.2, 0.28, 1.5, CX - 7.5, 1.0, 10.5, 12), stone, true); A(cyl(0.6, 0.3, 0.2, CX - 7.5, 1.8, 10.5, 16), stone, true);
  // wall lanterns
  for (const [x, z, dx, dz] of [[CX - 7, -3, 0, 1], [CX + 7, -3, 0, 1], [CX - 13, 4, 1, 0], [CX + 13, 4, -1, 0], [CX - 13, 11, 1, 0], [CX + 13, 11, -1, 0]]) {
    A(box(x + dx * 0.2 - 0.03 - Math.abs(dx) * 0.2, 3.5, z + dz * 0.2 - 0.03 - Math.abs(dz) * 0.2, x + dx * 0.2 + 0.03 + Math.abs(dx) * 0.2, 3.54, z + dz * 0.2 + 0.03 + Math.abs(dz) * 0.2), iron);
    A(box(x + dx * 0.4 - 0.1, 3.1, z + dz * 0.4 - 0.1, x + dx * 0.4 + 0.1, 3.42, z + dz * 0.4 + 0.1), hot([3.0, 2.0, 0.9]));
    A(box(x + dx * 0.4 - 0.13, 3.42, z + dz * 0.4 - 0.13, x + dx * 0.4 + 0.13, 3.48, z + dz * 0.4 + 0.13), iron);
  }
  // ---- festival dressing (toggled): podium with a red carpet, bunting ----
  const fest = new THREE.Group(); R.add(fest);
  A(box(CX + 4.6, 0, 0.4, CX + 8.2, 0.42, 2.8), wood, true, fest); A(box(CX + 4.75, 0.42, 0.55, CX + 8.05, 0.44, 2.65), lam("carpet", () => ({ color: "#b8302e" })), false, fest);
  A(box(CX + 4.3, 0, 1.2, CX + 4.6, 0.21, 2.0), wood, true, fest);
  for (const [z, y] of [[0.6, 6.4], [5, 7.2], [10, 6.8]]) bunt(fest, "pennants", CX - 13, y, z, CX + 13, y - 0.3, z + 1.5);
  bunt(fest, "pennants", CX - 13, 6.2, 12, CX + 13, 6.9, 2);
  // ---- the night of the final (toggled): Spanish flags across the plaza + the big screen over the stall ----
  const flags = new THREE.Group(); R.add(flags);
  for (const [z, y] of [[1.5, 6.9], [6, 7.4], [11, 7.1]]) bunt(flags, "pennantsES", CX - 13, y, z, CX + 13, y - 0.2, z + 1);
  const screen = new THREE.Group(); R.add(screen);
  A(box(CX - 2.75, 3.45, -2.95, CX + 2.75, 6.65, -2.8), lam("scrFrame", () => ({ color: "#23232c" })), true, screen);
  for (const sx of [-1, 1]) A(box(CX + sx * 3.3 - 0.35, 3.6, -2.95, CX + sx * 3.3 + 0.35, 5.0, -2.6), lam("speaker", () => ({ color: "#2c2a38" })), true, screen);
  return { fest, screen, flags, lids };
}

export function buildAqua(R: THREE.Object3D) {
  const A = (g: THREE.BufferGeometry, m: THREE.Material, cast = false) => add(R, g, m, cast);
  const navy = lam("aqNavy", () => ({ color: "#1c2f5c" })), teal = lam("aqTeal", () => ({ color: "#27b0a6" })), brass = lam("aqBrass", () => ({ color: "#d9a53a" }));
  A(ground(AX - 6, AX + 6, -4, 6, 0, 6, 5), lam("aquaFloor", () => ({ map: TR("aquaFloor") })));
  // back wall with the tank opening x +-2.0, y 0.8..3.4
  const wm = lam("aquaWall", () => ({ map: TR("aquaWall") }));
  A(wall(AX - 6, -4, AX - 2.0, -4, 0, 4.2), wm); A(wall(AX + 2.0, -4, AX + 6, -4, 0, 4.2), wm);
  A(box(AX - 6, 0, -4.4, AX - 2.0, 4.2, -4.004), navy); A(box(AX + 2.0, 0, -4.4, AX + 6, 4.2, -4.004), navy);
  A(box(AX - 2.0, 0, -4.4, AX + 2.0, 0.8, -4), teal); A(box(AX - 2.0, 3.4, -4.4, AX + 2.0, 4.2, -4), navy);
  for (const [x0, y0, x1, y1] of [[-2.12, 0.68, 2.12, 0.8], [-2.12, 3.4, 2.12, 3.52], [-2.12, 0.8, -2.0, 3.4], [2.0, 0.8, 2.12, 3.4]]) A(box(AX + x0, y0, -4.02, AX + x1, y1, -3.9), brass, true);
  A(wall(AX - 1.6, -3.93, AX + 1.6, -3.93, 3.6, 4.16), lam("aquaSign", () => ({ map: T("aquaSign") })));
  // the tank: unlit painted back (glows), sand floor, blue sides
  const back = new THREE.Mesh(wall(AX - 3.4, -6.6, AX + 3.4, -6.6, 0.4, 3.8), new THREE.MeshBasicMaterial({ map: T("tankBack"), color: new THREE.Color(1.25, 1.25, 1.25) })); R.add(back);
  const sand = new THREE.Mesh(box(AX - 3.4, 0.5, -6.6, AX + 3.4, 0.8, -4.4), new THREE.MeshBasicMaterial({ color: new THREE.Color("#ead9a6").multiplyScalar(1.1) })); R.add(sand);
  for (const sx of [-1, 1]) { const m = new THREE.Mesh(box(AX + sx * 3.4 - 0.05, 0.4, -6.6, AX + sx * 3.4 + 0.05, 3.8, -4.4), new THREE.MeshBasicMaterial({ color: "#1f7ab8" })); R.add(m); }
  // hall: side walls, ceiling, a rope barrier in front of the tank
  A(wall(AX - 6, 6, AX - 6, -4, 0, 4.2, 2.5), wm); A(wall(AX + 6, -4, AX + 6, 6, 0, 4.2, 2.5), wm);
  A(ceil(AX - 6, AX + 6, -4, 6, 4.2), lam("aqCeil", () => ({ color: "#141a30" })));
  for (const x of [-2.7, -0.9, 0.9, 2.7]) { A(cyl(0.035, 0.035, 0.9, AX + x, 0.45, -2.7, 10), brass, true); A(cyl(0.12, 0.14, 0.04, AX + x, 0.02, -2.7, 12), brass); const k = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), brass); k.position.set(AX + x, 0.93, -2.7); R.add(k); }
  for (const x of [-1.8, 0, 1.8]) A(box(AX + x - 0.9, 0.78, -2.715, AX + x + 0.9, 0.83, -2.685), lam("rope", () => ({ color: "#b8302e" })));
  for (const x of [-3, 0, 3]) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), hot([2.2, 2.6, 3.0])); b.position.set(AX + x, 4.12, -1.5); R.add(b); }
}
