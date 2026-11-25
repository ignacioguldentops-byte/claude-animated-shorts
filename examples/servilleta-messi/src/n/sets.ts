// 3D sets for "The Hair": Naples café + alley (one connected place), plane cabin. Everything is boxes/quads with the
// painted textures of paint2.ts; the ink pass draws the geometry edges.
import * as THREE from "three";
import { NOINK } from "./ink";
import { ctex } from "./paint";
import { PAINT, facadePainter, FacadeOpt, SKYB } from "./paint2";
import { lam, add, box, ground, wall, ceil, repT } from "./kit";

export const CX = 3000;   // café / alley origin (x); café interior z -5..0, alley z 0.15..4.75
export const PZ = 400;    // plane cabin centre line z (cabin along x)
export const SHX = CX + 1.5, SHY = 1.8, SHZ = -4.93; // the hair (centre of the golden frame)
const T = (name: string) => { const p = PAINT[name]; return ctex("p2_" + name, p.w, p.h, p.draw); };
const TR = (name: string) => repT(T(name));
/** materials whose emissive (lit windows, lamps) is driven per shot: world.ts sets emissiveIntensity = night ? k : 0 */
export const NIGHT_MATS: { m: THREE.MeshLambertMaterial; k: number }[] = [];
export const LAMP_MATS: THREE.MeshBasicMaterial[] = [];
export type SetRefs = { wallOld: THREE.Mesh; wallNew: THREE.Mesh; shrine: THREE.Group; shrineOld: THREE.Group };

const hot = (c: [number, number, number]) => { const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(...c) }); LAMP_MATS.push(m); (m.userData as { hot: [number, number, number] }).hot = c; return m; };
const cyl = (r0: number, r1: number, h: number, x: number, y: number, z: number, seg = 16, open = false) => { const g = new THREE.CylinderGeometry(r0, r1, h, seg, 1, open); g.translate(x, y, z); return g; };

export function buildCafe(R: THREE.Object3D): SetRefs {
  const A = (g: THREE.BufferGeometry, m: THREE.Material, cast = false) => add(R, g, m, cast);
  const wood = lam("cWood", () => ({ color: "#7a4224" })), dwood = lam("cDWood", () => ({ color: "#4a2a1c" })), cream = lam("cCream", () => ({ color: "#f2e6cc" }));
  const brass = lam("cBrass", () => ({ color: "#e0a93a" })), iron = lam("cIron", () => ({ color: "#2c2a38" })), white = lam("cWhite", () => ({ color: "#fbf8f0" }));
  A(ground(CX - 3.5, CX + 3.5, -5, 0.15, 0.002, 7, 5.15), lam("cafeFloor", () => ({ map: TR("cafeFloor") })));
  // shell (thick, shadow-casting) + painted inner faces
  A(box(CX - 3.7, 0, -5.25, CX + 3.7, 3.5, -5.005), cream, true);
  A(box(CX - 3.75, 0, -5.25, CX - 3.505, 3.5, 0.15), cream, true); A(box(CX + 3.505, 0, -5.25, CX + 3.75, 3.5, 0.15), cream, true);
  const wallNew = A(wall(CX - 3.5, -5, CX + 3.5, -5, 0, 3.3), lam("cafeBack", () => ({ map: T("cafeBack") })));
  const wallOld = A(wall(CX - 3.5, -5, CX + 3.5, -5, 0, 3.3), lam("cafeBack0", () => ({ map: T("cafeBack0") })));
  A(wall(CX - 3.5, 0.15, CX - 3.5, -5, 0, 3.3), lam("cafeSide", () => ({ map: T("cafeSide") })));
  A(wall(CX + 3.5, -5, CX + 3.5, 0.15, 0, 3.3, -1), lam("cafeSideR", () => ({ map: TR("cafeSide") })));
  A(ceil(CX - 3.5, CX + 3.5, -5, 0.15, 3.3), lam("cCeil", () => ({ color: "#f1dfb6" })));
  for (const z of [-4.1, -2.6, -1.1]) A(box(CX - 3.5, 3.08, z - 0.09, CX + 3.5, 3.3, z + 0.09), dwood);
  // front wall with a window (x -2.6..-0.4, y 0.9..2.2) and the door (x 0.6..1.9, y < 2.3)
  const ext = lam("cExt", () => ({ map: TR("plasterExt") }));
  for (const [x0, x1, y0, y1] of [[-3.5, -2.6, 0, 3.3], [-2.6, -0.4, 0, 0.9], [-2.6, -0.4, 2.2, 3.3], [-0.4, 0.6, 0, 3.3], [0.6, 1.9, 2.3, 3.3], [1.9, 3.5, 0, 3.3]])
    A(box(CX + x0, y0, 0, CX + x1, y1, 0.15, 4), ext, true);
  const green = lam("cGreen", () => ({ color: "#2f7a5a" }));
  for (const [x0, x1, y0, y1] of [[-2.66, -0.34, 0.84, 0.92], [-2.66, -0.34, 2.18, 2.26], [-2.66, -2.58, 0.9, 2.2], [-0.42, -0.34, 0.9, 2.2], [-1.53, -1.47, 0.9, 2.2], [0.54, 0.62, 0, 2.3], [1.88, 1.96, 0, 2.3], [0.54, 1.96, 2.28, 2.36]])
    A(box(CX + x0, y0, -0.03, CX + x1, y1, 0.18), green);
  A(box(CX + 0.54, 0, 0.15, CX + 0.6, 2.28, 1.4), lam("doorWood", () => ({ map: T("doorWood") })));
  // bar counter + back counter + espresso machine
  A(box(CX - 3.4, 0, -4.0, CX - 0.5, 1.08, -3.35, 1), lam("counter", () => ({ map: TR("counterFront") })));
  A(box(CX - 3.45, 1.08, -4.06, CX - 0.44, 1.15, -3.29, 1.5), lam("marble", () => ({ map: TR("marble") })));
  A(box(CX - 3.45, 0, -5, CX - 0.4, 0.95, -4.62), wood); A(box(CX - 3.46, 0.95, -5, CX - 0.38, 1.0, -4.6), dwood);
  A(box(CX - 3.1, 1.0, -4.98, CX - 2.2, 1.56, -4.62), lam("espBody", () => ({ color: "#c9373a" })));
  A(wall(CX - 3.1, -4.615, CX - 2.2, -4.615, 1.0, 1.56), lam("espresso", () => ({ map: T("espresso") })));
  for (let i = 0; i < 5; i++) { A(cyl(0.045, 0.035, 0.07, CX - 3.0 + i * 0.17, 1.6, -4.8, 12), white); }
  // things on the bar: cups + saucers, a jar, a little bell
  for (const [dx, dz] of [[-1.0, -3.6], [-2.5, -3.7]]) { A(cyl(0.085, 0.085, 0.012, CX + dx, 1.157, dz, 16), white); A(cyl(0.045, 0.035, 0.065, CX + dx, 1.195, dz, 12), white); }
  A(cyl(0.07, 0.07, 0.2, CX - 3.1, 1.25, -3.65, 14), lam("cJar", () => ({ color: "#bfe3f5" }))); A(cyl(0.075, 0.075, 0.03, CX - 3.1, 1.365, -3.65, 14), brass);
  // bar stools
  for (const dx of [-2.9, -2.0, -1.1]) { A(cyl(0.17, 0.17, 0.07, CX + dx, 0.75, -3.0, 18), lam("cStool", () => ({ color: "#cf3a3a" }))); A(cyl(0.025, 0.025, 0.72, CX + dx, 0.36, -3.0, 8), iron); A(cyl(0.2, 0.22, 0.03, CX + dx, 0.015, -3.0, 18), iron); const ring = new THREE.TorusGeometry(0.13, 0.012, 6, 18); ring.rotateX(Math.PI / 2); ring.translate(CX + dx, 0.3, -3.0); A(ring, brass); }
  // tables + chairs near the front
  for (const [dx, dz] of [[2.45, -1.3], [-2.3, -1.25]]) {
    A(cyl(0.4, 0.4, 0.045, CX + dx, 0.75, dz, 24), lam("marble", () => ({ map: TR("marble") }))); A(cyl(0.03, 0.03, 0.73, CX + dx, 0.365, dz, 8), iron); A(cyl(0.2, 0.24, 0.03, CX + dx, 0.015, dz, 16), iron);
    for (const s of [-1, 1]) { const meet = dx > 0, cx = CX + dx + s * (meet ? 0.46 : 0.62), cz = dz + (meet ? -0.34 : 0); A(box(cx - 0.18, 0.42, cz - 0.18, cx + 0.18, 0.46, cz + 0.18), dwood); A(box(cx + s * 0.15, 0.46, cz - 0.18, cx + s * 0.18, 0.95, cz + 0.18), dwood); for (const a of [-1, 1]) for (const b of [-1, 1]) A(box(cx + a * 0.15 - 0.015, 0, cz + b * 0.15 - 0.015, cx + a * 0.15 + 0.015, 0.42, cz + b * 0.15 + 0.015), dwood); }
  }
  // third chair behind the meeting table (back towards the wall), cups on it, a napkin holder on the bar
  { const cx = CX + 2.45, dz = -1.92; A(box(cx - 0.18, 0.42, dz - 0.18, cx + 0.18, 0.46, dz + 0.18), dwood); A(box(cx - 0.18, 0.46, dz - 0.18, cx + 0.18, 0.95, dz - 0.15), dwood);
    for (const a of [-1, 1]) for (const b of [-1, 1]) A(box(cx + a * 0.15 - 0.015, 0, dz + b * 0.15 - 0.015, cx + a * 0.15 + 0.015, 0.42, dz + b * 0.15 + 0.015), dwood); }
  for (const [dx, dz] of [[2.2, -1.45], [2.72, -1.4], [2.45, -1.6]]) { A(cyl(0.07, 0.07, 0.01, CX + dx, 0.778, dz, 16), white); A(cyl(0.04, 0.032, 0.06, CX + dx, 0.813, dz, 12), white); }
  A(box(CX - 0.98, 1.15, -3.66, CX - 0.78, 1.33, -3.6), lam("cSteel", () => ({ color: "#b9c0c8" }))); A(box(CX - 0.98, 1.15, -3.5, CX - 0.78, 1.33, -3.44), lam("cSteel", () => ({ color: "#b9c0c8" })));
  A(box(CX - 0.96, 1.15, -3.6, CX - 0.8, 1.3, -3.5), lam("cNapkins", () => ({ color: "#fffdf8" })));
  // hanging lamps (bulbs are HDR -> bloom; the light itself comes from world.ts point lights)
  for (const [dx, dz] of [[-2.6, -3.68], [-1.2, -3.68], [0.9, -2.2]]) {
    A(box(CX + dx - 0.01, 2.62, dz - 0.01, CX + dx + 0.01, 3.3, dz + 0.01), iron);
    A(cyl(0.05, 0.3, 0.24, CX + dx, 2.52, dz, 20, true), lam("cShade", () => ({ color: "#1f6f6a", side: THREE.DoubleSide })));
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 8), hot([7, 5.2, 2.6])); b.position.set(CX + dx, 2.42, dz); b.layers.set(NOINK); R.add(b);
  }
  // shrine (3D parts): golden frame, lace shelf, candles; the "30 years later" extras
  const shrine = new THREE.Group(), shrineOld = new THREE.Group(); R.add(shrine, shrineOld);
  const S = (g: THREE.BufferGeometry, m: THREE.Material, G = shrine) => add(G, g, m, false);
  S(box(SHX - 0.19, SHY - 0.25, -5, SHX + 0.19, SHY + 0.25, -4.94), brass); S(box(SHX - 0.135, SHY - 0.195, -4.945, SHX + 0.135, SHY + 0.195, -4.93), lam("cPaper", () => ({ color: "#fff7e0" })));
  S(box(SHX - 0.5, 1.26, -5, SHX + 0.5, 1.31, -4.7), wood); S(box(SHX - 0.52, 1.2, -4.705, SHX + 0.52, 1.315, -4.69), white);
  for (const [dx, h] of [[-0.38, 0.2], [-0.24, 0.14], [0.26, 0.16], [0.4, 0.22]]) S(cyl(0.028, 0.028, h, SHX + dx, 1.31 + h / 2, -4.82, 10), lam("cCandle", () => ({ color: "#fff3d0" })));
  S(cyl(0.05, 0.035, 0.13, SHX - 0.02, 1.375, -4.84, 12), lam("cVase", () => ({ color: SKYB })));
  for (const [dx, h] of [[-0.46, 0.12], [-0.31, 0.2], [-0.16, 0.1], [0.12, 0.18], [0.33, 0.1], [0.47, 0.15]]) S(cyl(0.024, 0.024, h, SHX + dx, 1.31 + h / 2, -4.76, 10), lam("cCandle", () => ({ color: "#fff3d0" })), shrineOld);
  for (const [dx, c] of [[-0.62, SKYB], [0.62, "#fbfbf6"]] as [number, string][]) S(box(SHX + dx - 0.06, 1.15, -4.99, SHX + dx + 0.06, 2.35, -4.97), lam("cScarf" + c, () => ({ color: c })), shrineOld);
  for (const [dx, dy] of [[-0.42, 2.25], [0.44, 2.3], [-0.44, 1.75], [0.45, 1.72]]) { S(box(SHX + dx - 0.09, dy - 0.11, -4.99, SHX + dx + 0.09, dy + 0.11, -4.965), brass, shrineOld); S(box(SHX + dx - 0.06, dy - 0.08, -4.966, SHX + dx + 0.06, dy + 0.08, -4.96), lam("cPhoto", () => ({ color: "#bfe3f5" })), shrineOld); }
  return { wallOld, wallNew, shrine, shrineOld };
}

const FAC: FacadeOpt[] = [
  { wall: "#e6a56a", lite: "#f6cf9a", dark: "#b9743e", shutter: "#3f7a5a", seed: 1 },
  { wall: "#e88a7a", lite: "#f6b8a8", dark: "#b85a50", shutter: "#5a4a3a", seed: 2 },
  { wall: "#ecd08a", lite: "#f8e8b8", dark: "#c4a45a", shutter: "#3f6a8a", seed: 3 },
  { wall: "#d9785a", lite: "#f0a88a", dark: "#a8503a", shutter: "#3f7a5a", seed: 4 },
  { wall: "#f0c0a0", lite: "#fbe0cc", dark: "#c89070", shutter: "#7a4a3a", seed: 5 },
];
const FAC_SEEN = new Set<string>();
export function buildAlley(R: THREE.Object3D) {
  const A = (g: THREE.BufferGeometry, m: THREE.Material, cast = false) => add(R, g, m, cast);
  const iron = lam("cIron", () => ({ color: "#2c2a38" })), slab = lam("aSlab", () => ({ color: "#cfc4b4" }));
  A(ground(CX - 14, CX + 70, 0.15, 4.75, 0, 84 / 6, 4.6 / 6), lam("paving", () => ({ map: TR("paving") })));
  const facade = (x0: number, x1: number, h: number, side: 1 | -1, k: number, shop: number, y0 = 0) => {
    const o = { ...FAC[k % FAC.length], shop, seed: k * 3 + shop + 1 }, wm = x1 - x0, key = `fac_${k}_${shop}_${wm.toFixed(1)}_${h}`;
    const P = facadePainter(wm, h, o, false), Gp = facadePainter(wm, h, o, true);
    const sc = (p: typeof P, k: number): [number, number, (g: CanvasRenderingContext2D, r: () => number) => void] => [Math.round(p.w * k), Math.round(p.h * k), (g, r) => { g.save(); g.scale(k, k); p.draw(g, r); g.restore(); }];
    const fresh = !FAC_SEEN.has(key); FAC_SEEN.add(key);
    const m = lam(key, () => ({ map: ctex(key, ...sc(P, 0.56)), emissiveMap: ctex(key + "g", ...sc(Gp, 0.22)), emissive: new THREE.Color("#ffffff"), emissiveIntensity: 0 }));
    if (fresh) NIGHT_MATS.push({ m, k: 2.6 });
    const z = side > 0 ? 0.15 : 4.75;
    const g = side > 0 ? wall(x0, z + 0.004, x1, z + 0.004, y0, h) : wall(x1, z - 0.004, x0, z - 0.004, y0, h);
    if (y0) { const uv = g.getAttribute("uv") as THREE.BufferAttribute; uv.setY(0, y0 / h); uv.setY(1, y0 / h); }
    A(g, m);
    A(side > 0 ? box(x0, y0, -6, x1, h, 0.15) : box(x0, 0, 4.75, x1, h, 11), lam("aBody" + k, () => ({ color: o.dark })), true);
    // balcony slabs + rails where the painter put them
    const floors = Math.floor((h - 4.0) / 3.3), cols = Math.max(1, Math.round(wm / 2.7)), cw = wm / cols;
    if (Math.abs((x0 + x1) / 2 - CX) < 26) for (let fl = 0; fl < floors; fl++) for (let c = 0; c < cols; c++) {
      const cx = side > 0 ? x0 + (c + 0.5) * cw : x1 - (c + 0.5) * cw, y = h - ((h - (4.3 + fl * 3.3)) + 0.04) - 0.13, d = 0.42 * side;
      A(box(cx - 1.15, y, z, cx + 1.15, y + 0.12, z + d), slab, true);
      A(box(cx - 1.15, y + 0.95, z + d - 0.03 * side, cx + 1.15, y + 0.99, z + d), iron);
      for (const e of [-1.13, 1.13]) A(box(cx + e - 0.02, y + 0.12, z + d - 0.03 * side, cx + e + 0.02, y + 0.95, z + d), iron);
    }
  };
  // café side (z = 0.15): café building is x -3.5..3.5 (its ground floor is real geometry); then 9 m buildings of 5 types
  const TYPE = (t: number): [number, number, number] => [[14, 16, 14, 16, 14][t % 5], t % 5, t % 4];
  facade(CX - 3.5, CX + 3.5, 14, 1, 0, 0, 3.3);
  facade(CX - 14, CX - 3.5, 15, 1, 1, 1);
  for (let i = 0; i < 7; i++) { const [h, k, sh] = TYPE(i + 2); facade(CX + 3.5 + i * 9, CX + 12.5 + i * 9, h, 1, k, sh); }
  for (let i = 0; i < 9; i++) { const [h, k, sh] = TYPE(i + 3); facade(CX - 14 + i * 9, CX - 5 + i * 9, h, -1, k, sh); }
  // the mural wall closes the alley at x = CX - 14
  A(wall(CX - 13.99, 5.25, CX - 13.99, -0.35, 0, 13), lam("mural", () => ({ map: T("mural") })));
  A(box(CX - 20, 0, -6, CX - 14, 13, 11), lam("aBodyM", () => ({ color: "#c9ae78" })), true);
  // awning over the café front, round sign on a bracket
  const aw = new THREE.BoxGeometry(5.2, 0.05, 1.15); aw.rotateX(0.38); aw.translate(CX - 0.3, 2.72, 0.7);
  { const uv = aw.getAttribute("uv") as THREE.BufferAttribute; for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * 6); }
  A(aw, lam("awning", () => ({ map: TR("awning") })), true);
  A(box(CX + 2.75, 3.0, 0.15, CX + 2.79, 3.04, 0.95), iron);
  const sign = new THREE.Mesh(new THREE.CircleGeometry(0.34, 28), lam("sign", () => ({ map: T("sign"), side: THREE.DoubleSide }))); sign.rotation.y = Math.PI / 2; sign.position.set(CX + 2.77, 2.62, 0.72); R.add(sign);
  // bunting + laundry across the alley
  const bun = lam("bunting", () => ({ map: T("bunting"), alphaTest: 0.5, side: THREE.DoubleSide }));
  for (const [dx, y] of [[-9.5, 10.6], [-6.5, 4.9], [-2.5, 5.6], [2.2, 7.0], [6, 5.9], [10, 7.8], [15, 6.4], [21, 7.2], [28, 6.0], [36, 7.4]]) A(wall(CX + dx, 4.74, CX + dx + 0.6, 0.16, y - 0.36, y, 1.2), bun);
  for (const [dx, y] of [[8.5, 10.4], [17, 9.2], [26, 10.0], [34, 9.4]]) {
    A(box(CX + dx - 0.006, y, 0.16, CX + dx + 0.006, y + 0.012, 4.74), iron);
    for (let i = 0; i < 5; i++) { const c = ["#fbfbf6", SKYB, "#e9b93c", "#e07a9a", "#fbfbf6", "#57a05a"][(i + Math.round(dx + 20)) % 6]; A(box(CX + dx - 0.01, y - 0.62 - (i % 2) * 0.2, 0.7 + i * 0.78, CX + dx + 0.01, y, 1.25 + i * 0.78), lam("cl" + c, () => ({ color: c }))); }
  }
  // wall lanterns
  for (const [dx, s] of [[-9, 1], [-1.2, -1], [5.2, 1], [13, -1], [22, 1], [31, -1]]) {
    const z = s > 0 ? 0.15 : 4.75, zz = z + s * 0.5;
    A(box(CX + dx - 0.02, 4.3, Math.min(z, zz), CX + dx + 0.02, 4.34, Math.max(z, zz)), iron);
    A(box(CX + dx - 0.13, 3.82, zz - 0.13, CX + dx + 0.13, 3.86, zz + 0.13), iron); A(box(CX + dx - 0.15, 4.22, zz - 0.15, CX + dx + 0.15, 4.3, zz + 0.15), iron);
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.36, 0.2), hot([6.5, 4.6, 2.0])); b.position.set(CX + dx, 4.04, zz); b.layers.set(NOINK); R.add(b);
  }
  // crates of fruit by the café window, flower pots by the door
  const crate = lam("aCrate", () => ({ color: "#b0733a" }));
  for (const [dx, c] of [[-2.3, "#f29a2e"], [-1.55, "#d9463f"], [-0.8, "#e9d43c"]] as [number, string][]) {
    A(box(CX + dx - 0.32, 0, 0.3, CX + dx + 0.32, 0.4, 0.85), crate, true);
    for (let i = 0; i < 6; i++) { const s = new THREE.SphereGeometry(0.1, 10, 8); s.translate(CX + dx - 0.2 + (i % 3) * 0.2, 0.45, 0.45 + Math.floor(i / 3) * 0.22); A(s, lam("fr" + c, () => ({ color: c }))); }
  }
  for (const dx of [0.35, 2.2]) { A(cyl(0.2, 0.15, 0.36, CX + dx, 0.18, 0.42, 14), lam("aPot", () => ({ color: "#c9673a" })), true); const s = new THREE.SphereGeometry(0.3, 12, 10); s.translate(CX + dx, 0.6, 0.42); A(s, lam("aBush", () => ({ color: "#3f8a4a" })), true); }
}

export function buildPlane(R: THREE.Object3D) {
  const A = (g: THREE.BufferGeometry, m: THREE.Material, cast = false) => add(R, g, m, cast);
  A(ground(CX - 8, CX + 8, PZ - 1.6, PZ + 1.6, 0, 32, 6.4), lam("carpet", () => ({ map: TR("carpet") })));
  const cab = lam("cabin", () => ({ map: TR("cabin") }));
  A(wall(CX - 8, PZ - 1.6, CX + 8, PZ - 1.6, 0, 2.15, 16 / 3.4), cab); A(wall(CX + 8, PZ + 1.6, CX - 8, PZ + 1.6, 0, 2.15, 16 / 3.4), cab);
  A(ceil(CX - 8, CX + 8, PZ - 1.6, PZ + 1.6, 2.15), lam("pCeil", () => ({ color: "#ebe6da" })));
  A(box(CX - 8, 2.3, PZ - 1.8, CX + 8, 2.5, PZ + 1.8), lam("pCeil", () => ({ color: "#ebe6da" })), true);
  const bins = lam("bins", () => ({ map: TR("bins") }));
  for (const s of [-1, 1]) { const g = box(CX - 8, 1.72, PZ + s * 0.78, CX + 8, 2.15, PZ + s * 1.6, 0.85); A(g, bins); }
  const strip = new THREE.Mesh(new THREE.BoxGeometry(16, 0.02, 0.16), hot([2.2, 2.4, 3.2])); strip.position.set(CX, 2.14, PZ); strip.layers.set(NOINK); R.add(strip);
  const seat = lam("seat", () => ({ map: TR("seat") })), cover = lam("pCover", () => ({ color: "#f6f1e6" })), grey = lam("pGrey", () => ({ color: "#8f9bb0" }));
  for (let r = -6; r <= 6; r++) for (const dz of [-1.07, -0.56, 0.56, 1.07]) {
    if ((r === 2 || r === 3) && dz > 0) continue; // open space in front of Diego's row (room for the camera)
    const x = CX + r * 0.85, z = PZ + dz;
    A(box(x - 0.24, 0.26, z - 0.22, x + 0.22, 0.46, z + 0.22, 0.6), seat); A(box(x - 0.2, 0, z - 0.2, x + 0.16, 0.26, z + 0.2), grey);
    A(box(x - 0.34, 0.42, z - 0.22, x - 0.22, 1.2, z + 0.22, 0.6), seat);
    A(box(x - 0.35, 0.96, z - 0.2, x - 0.21, 1.22, z + 0.2), cover);
    for (const e of [-0.245, 0.245]) A(box(x - 0.24, 0.56, z + e - 0.025, x + 0.2, 0.62, z + e + 0.025), grey);
  }
  for (const s of [-1, 1]) { const x = CX + s * 6.25; A(box(x - 0.04, 0, PZ - 1.6, x + 0.04, 2.15, PZ - 0.42), lam("pWall", () => ({ color: "#d9d4c8" })), true); A(box(x - 0.04, 0, PZ + 0.42, x + 0.04, 2.15, PZ + 1.6), lam("pWall", () => ({ color: "#d9d4c8" })), true);
    A(s > 0 ? wall(x - 0.05, PZ + 0.42, x - 0.05, PZ - 0.42, 0, 2.0) : wall(x + 0.05, PZ - 0.42, x + 0.05, PZ + 0.42, 0, 2.0), lam("curtain", () => ({ map: T("curtain") }))); }
}

// ---------------- the auction room (London, 2024) ----------------
export const AX = 6000; // room x AX-5..AX+5, z -6..5; platform at the back (z < -4.2)
export const PED: [number, number, number] = [AX, 1.32, -5.0]; // top of the pedestal (napkin sits here)
export const LECT: [number, number, number] = [AX + 2.3, 0.3, -4.9];
export const AROWS = [-2.6, -1.5, -0.4, 0.7], ACOLS = [-3.4, -2.6, -1.8, -1.0, 1.0, 1.8, 2.6, 3.4];
export function buildAuction(R: THREE.Object3D) {
  const A = (g: THREE.BufferGeometry, m: THREE.Material, cast = false) => add(R, g, m, cast);
  const gold = lam("aGold", () => ({ color: "#e0a93a" })), dwood = lam("cDWood", () => ({ color: "#4a2a1c" })), wood = lam("cWood", () => ({ color: "#7a4224" }));
  A(ground(AX - 5, AX + 5, -6, 5, 0, 10 / 1.6, 11 / 1.6), lam("parquet", () => ({ map: TR("parquet") })));
  const wl = lam("auctionWall", () => ({ map: T("auctionWall") }));
  A(wall(AX - 5, -6, AX + 5, -6, 0, 4.5), wl);
  A(wall(AX - 5, 5, AX - 5, -6, 0, 4.5, 1.1), wl); A(wall(AX + 5, -6, AX + 5, 5, 0, 4.5, 1.1), wl); A(wall(AX + 5, 5, AX - 5, 5, 0, 4.5), wl);
  A(ceil(AX - 5, AX + 5, -6, 5, 4.5), lam("aCeil", () => ({ color: "#efe2c6" })));
  for (const z of [-4.5, -1.5, 1.5]) A(box(AX - 5, 4.3, z - 0.1, AX + 5, 4.5, z + 0.1), lam("aBeam", () => ({ color: "#d9c79e" })));
  // platform + velvet backdrop behind the pedestal
  A(box(AX - 4.2, 0, -6, AX + 4.2, 0.3, -4.2, 1), wood, true); A(box(AX - 4.22, 0.28, -4.24, AX + 4.22, 0.32, -4.18), gold);
  A(wall(AX - 1.4, -5.97, AX + 1.4, -5.97, 0.3, 3.6, 2.8 / 1.2, 3.3 / 1.2), lam("velvet", () => ({ map: TR("velvet") })));
  A(box(AX - 1.55, 3.55, -6, AX + 1.55, 3.75, -5.85), gold);
  for (const s of [-1, 1]) A(box(AX + s * 1.45 - 0.07, 0.3, -6, AX + s * 1.45 + 0.07, 3.6, -5.88), gold);
  // pedestal (column) + glass dome
  A(box(PED[0] - 0.32, 0.3, PED[2] - 0.32, PED[0] + 0.32, 0.42, PED[2] + 0.32), lam("aMarble", () => ({ map: TR("marble") })), true);
  A(box(PED[0] - 0.24, 0.42, PED[2] - 0.24, PED[0] + 0.24, PED[1] - 0.06, PED[2] + 0.24), lam("aMarble", () => ({ map: TR("marble") })), true);
  A(box(PED[0] - 0.3, PED[1] - 0.06, PED[2] - 0.3, PED[0] + 0.3, PED[1], PED[2] + 0.3), gold, true);
  A(box(PED[0] - 0.2, PED[1], PED[2] - 0.2, PED[0] + 0.2, PED[1] + 0.03, PED[2] + 0.2), lam("aCushion", () => ({ color: "#2b4fa8" })));
  const dome = new THREE.Mesh(cyl(0.27, 0.27, 0.5, PED[0], PED[1] + 0.28, PED[2], 28, true), new THREE.MeshBasicMaterial({ color: "#dff1ff", transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide }));
  dome.layers.set(NOINK); R.add(dome);
  // lectern
  A(box(LECT[0] - 0.36, 0.3, LECT[2] - 0.22, LECT[0] + 0.36, 1.32, LECT[2] + 0.22, 1), dwood, true);
  A(box(LECT[0] - 0.42, 1.32, LECT[2] - 0.3, LECT[0] + 0.42, 1.38, LECT[2] + 0.28), wood, true);
  A(box(LECT[0] - 0.3, 0.5, LECT[2] + 0.221, LECT[0] + 0.3, 1.15, LECT[2] + 0.23), gold);
  // rows of gilt chairs (seat 0.46)
  const red = lam("aSeat", () => ({ color: "#a8343f" }));
  for (const z of AROWS) for (const dx of ACOLS) {
    const x = AX + dx; A(box(x - 0.2, 0.42, z - 0.2, x + 0.2, 0.47, z + 0.2), red); A(box(x - 0.2, 0.47, z + 0.16, x + 0.2, 0.98, z + 0.2), red);
    for (const a of [-1, 1]) for (const b of [-1, 1]) A(box(x + a * 0.17 - 0.015, 0, z + b * 0.17 - 0.015, x + a * 0.17 + 0.015, 0.42, z + b * 0.17 + 0.015), gold);
  }
  // chandeliers
  for (const z of [-3.0, 0.0]) for (const dx of [-2.5, 2.5]) {
    A(box(AX + dx - 0.01, 3.7, z - 0.01, AX + dx + 0.01, 4.5, z + 0.01), gold);
    const ring = new THREE.TorusGeometry(0.42, 0.03, 6, 24); ring.rotateX(Math.PI / 2); ring.translate(AX + dx, 3.66, z); A(ring, gold);
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; const b = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), hot([7, 5.2, 2.6])); b.position.set(AX + dx + 0.42 * Math.cos(a), 3.74, z + 0.42 * Math.sin(a)); b.layers.set(NOINK); R.add(b); }
  }
}
