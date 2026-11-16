// Extra sets for "La puerta de atrás": the Madeira bedroom and the phone booth in the street.
import * as THREE from "three";
import { NOINK } from "./ink";
import { ctex } from "./paint";
import { PAINT } from "./paint2";
import "./paint4";
import { lam, add, box, ground, wall, ceil, repT } from "./kit";
import { CX, LAMP_MATS } from "./sets";
export const HX = CX + 600;                     // bedroom: x +-2.2, z -3..0.4 (open towards +z)
export const BOOTH: [number, number, number] = [CX + 5.6, 0, 1.25]; // phone booth on the café side of the street
const T = (name: string) => { const p = PAINT[name]; return ctex("p4_" + name, p.w, p.h, p.draw); };
const hot = (c: [number, number, number]) => { const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(...c) }); LAMP_MATS.push(m); (m.userData as { hot: [number, number, number] }).hot = c; return m; };
export function buildRoom(R: THREE.Object3D) {
  const A = (g: THREE.BufferGeometry, m: THREE.Material, cast = false) => add(R, g, m, cast);
  const wood = lam("rWood", () => ({ color: "#7a4a2a" })), plaster = lam("rPlaster", () => ({ color: "#9fc4cf" }));
  A(ground(HX - 2.2, HX + 2.2, -3, 1.2, 0.002, 4.4 / 1.6, 4.2 / 1.6), lam("roomFloor", () => ({ map: repT(T("roomFloor")) })));
  A(wall(HX - 2.2, -3, HX + 2.2, -3, 0, 2.5), lam("roomBack", () => ({ map: T("roomBack") })));
  A(box(HX - 2.4, 0, -3.2, HX + 2.4, 2.7, -3.004), plaster, true);
  A(box(HX - 2.4, 0, -3.2, HX - 2.204, 2.7, 1.2), plaster, true); A(box(HX + 2.204, 0, -3.2, HX + 2.4, 2.7, 1.2), plaster, true);
  A(ceil(HX - 2.2, HX + 2.2, -3, 1.2, 2.5), lam("rTin", () => ({ color: "#8f979c" })));
  for (const z of [-2.4, -1.4, -0.4]) A(box(HX - 2.2, 2.38, z - 0.05, HX + 2.2, 2.5, z + 0.05), wood);
  // two bunk beds against the side walls: frame, mattresses, blankets, pillows
  for (const [sx, cols] of [[-1, ["#c9473f", "#3f8fc9"]], [1, ["#e9b93c", "#57a05a"]]] as [number, string[]][]) {
    const x0 = sx < 0 ? HX - 2.15 : HX + 1.25, x1 = x0 + 0.9;
    for (const [px, pz] of [[x0, -2.9], [x1, -2.9], [x0, -1.0], [x1, -1.0]]) A(box(px - 0.04, 0, pz - 0.04, px + 0.04, 1.75, pz + 0.04), wood, true);
    [0.35, 1.2].forEach((y, k) => { A(box(x0, y, -2.9, x1, y + 0.1, -1.0), wood, true); A(box(x0 + 0.03, y + 0.1, -2.87, x1 - 0.03, y + 0.24, -1.03), lam("rMat", () => ({ color: "#f1ecdc" })), true);
      A(box(x0 + 0.02, y + 0.24, -2.3, x1 - 0.02, y + 0.31, -1.03), lam("rBl" + cols[k], () => ({ color: cols[k] })), true); A(box(x0 + 0.12, y + 0.24, -2.84, x1 - 0.12, y + 0.33, -2.45), lam("rPil", () => ({ color: "#fbf8f0" })), true); });
    A(box(x0 + (sx < 0 ? 0.86 : 0), 0.45, -1.06, x0 + (sx < 0 ? 0.9 : 0.04), 1.2, -1.0), wood);
  }
  // rug, a small stool, the hanging bulb
  A(box(HX - 0.8, 0.003, -2.3, HX + 0.8, 0.012, -1.0), lam("rRug", () => ({ color: "#b0503a" })));
  A(box(HX - 0.02, 2.05, -1.72, HX + 0.02, 2.5, -1.68), lam("rCord", () => ({ color: "#2c2a38" })));
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 10), hot([3.4, 2.5, 1.2])); b.position.set(HX, 2.0, -1.7); R.add(b);
}
export function buildBooth(R: THREE.Object3D) {
  const A = (g: THREE.BufferGeometry, m: THREE.Material, cast = false) => add(R, g, m, cast);
  const [bx, , bz] = BOOTH, fr = lam("bFrame", () => ({ color: "#1f6f8a" }));
  for (const sx of [-0.5, 0.5]) for (const sz of [-0.5, 0.5]) A(box(bx + sx - 0.04, 0, bz + sz - 0.04, bx + sx + 0.04, 2.3, bz + sz + 0.04), fr, true);
  A(box(bx - 0.58, 2.3, bz - 0.58, bx + 0.58, 2.5, bz + 0.58), fr, true); A(box(bx - 0.56, 0, bz - 0.56, bx + 0.56, 0.06, bz + 0.56), lam("bFloor", () => ({ color: "#5c5866" })));
  A(box(bx - 0.5, 0.06, bz - 0.54, bx + 0.5, 0.75, bz - 0.5), fr); A(box(bx - 0.54, 0.06, bz - 0.5, bx - 0.5, 0.75, bz + 0.5), fr); A(box(bx + 0.5, 0.06, bz - 0.5, bx + 0.54, 0.75, bz + 0.5), fr);
  const glass = new THREE.MeshBasicMaterial({ color: new THREE.Color("#bfe6ff"), transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide });
  for (const [x0, z0, x1, z1] of [[-0.5, -0.5, 0.5, -0.5], [-0.5, 0.5, -0.5, -0.5], [0.5, -0.5, 0.5, 0.5]]) { const m = new THREE.Mesh(wall(bx + x0, bz + z0, bx + x1, bz + z1, 0.75, 2.3), glass); m.layers.set(NOINK); R.add(m); }
  A(box(bx - 0.2, 1.1, bz - 0.5, bx + 0.2, 1.65, bz - 0.36), lam("bPhone", () => ({ color: "#2c2f3a" })), true); A(box(bx - 0.14, 1.3, bz - 0.36, bx + 0.14, 1.52, bz - 0.33), lam("bKeys", () => ({ color: "#c9cdd4" })));
  const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.04, 0.7), hot([3.0, 3.0, 2.6])); bulb.position.set(bx, 2.28, bz); R.add(bulb);
}
