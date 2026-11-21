// Realistic sets, part 2: the cloth shop and its back room, the desk with the map, the waste ground by the bullring
// with its tavern, the London pitch, and the racecourse of the coronation tournament.
import * as THREE from "three";
import { lam, add, ground, wall, ceil } from "./kit";
import * as Q from "./paintk";
import * as T from "./paintr";
import * as S from "./pbr";
import { wmat, pmat, Batch } from "./real";
import { towns } from "./castr";
import { Refs, M, kit, glow, tiled, quad, tri, Quads, PEN, IX, BX, MX, FX, LX, HPX, HL, HW } from "./setsq";
import type { Spot, TreeSpec } from "./real";

const BOLTS = ["#d8433a", "#eebc1e", "#3f86c2", "#4f9a56", "#e85a7a", "#ea932c", "#7a5a9a", "#2fa89a", "#1f2f5c", "#b5563a", "#e9dcc6", "#8a2a4a", "#f4f2ea", "#c9d8ea", "#3a6a4a", "#d9a8a0"];
const bc = (i: number, j = 0) => BOLTS[Math.floor(S.hash(i, j, 77) * 16) % 16];

/** shelving against a wall: o = one end at floor level, along = unit direction of the wall (x or z), n = unit normal into
 *  the room. Timber uprights and boards; every pigeonhole holds bolts of cloth end-on, or folded lengths laid flat. */
const shelving = (B: Batch, ox: number, oz: number, len: number, ax: "x" | "z", ns: number, h = 3.2, seed = 0) => {
  const wood = M.wood("#6a4428"), back = M.wood("#3a2418"), dep = 0.46, cols = Math.max(1, Math.round(len / 0.95)), cw = len / cols, rows = 5, rh = (h - 0.14) / rows, cl = M.clothI();
  // local (u along the wall, y, d out from the wall) -> world box
  const bx = (m: THREE.Material, u0: number, y0: number, d0: number, u1: number, y1: number, d1: number, c?: string) => ax === "x" ? B.box(m, ox + u0, y0, oz + ns * d0, ox + u1, y1, oz + ns * d1, c) : B.box(m, ox + ns * d0, y0, oz + u0, ox + ns * d1, y1, oz + u1, c);
  const cy = (u: number, y: number, d: number, r: number, l: number, c: string) => ax === "x" ? B.cyl(cl, ox + u, y, oz + ns * d, r, l, c, [Math.PI / 2, 0, 0]) : B.cyl(cl, ox + ns * d, y, oz + u, r, l, c, [0, 0, Math.PI / 2]);
  const core = (u: number, y: number, d: number, r: number) => ax === "x" ? B.cyl(pmat("#d9c9a0", 0.9), ox + u, y, oz + ns * d, r, 0.02, undefined, [Math.PI / 2, 0, 0]) : B.cyl(pmat("#d9c9a0", 0.9), ox + ns * d, y, oz + u, r, 0.02, undefined, [0, 0, Math.PI / 2]);
  bx(back, 0, 0, 0, len, h, 0.03);
  for (let c = 0; c <= cols; c++) bx(wood, c * cw - 0.025, 0, 0.03, c * cw + 0.025, h, dep);
  for (let r = 0; r <= rows; r++) bx(wood, 0, 0.1 + r * rh - 0.02, 0.03, len, 0.1 + r * rh + 0.02, dep + 0.02);
  bx(wood, 0, 0, 0.03, len, 0.1, dep - 0.04); bx(wood, -0.03, h - 0.02, 0, len + 0.03, h + 0.1, dep + 0.06);
  for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) { const id = c * 31 + r * 7 + seed * 101, u0 = c * cw + 0.04, y0 = 0.12 + r * rh, kind = S.hash(id, 1, 5);
    if (kind < 0.24) { const n = 3 + Math.floor(S.hash(id, 2, 5) * 3), th = Math.min(0.1, (rh - 0.1) / n); for (let q = 0; q < n; q++) bx(cl, u0 + 0.03, y0 + q * th, 0.06, u0 + cw - 0.11, y0 + (q + 0.9) * th, dep - 0.02 - 0.04 * S.hash(id, q, 9), bc(id, q)); }
    else { const rad = 0.105 + 0.03 * S.hash(id, 3, 5), per = Math.max(2, Math.floor((cw - 0.08) / (rad * 2.04))), lv = Math.max(1, Math.floor((rh - 0.08) / (rad * 1.8))); let q = 0;
      for (let l = 0; l < lv; l++) for (let p = 0; p < per - (l % 2); p++, q++) { if (S.hash(id, q, 11) < 0.12) continue; const u = u0 + rad + p * (cw - 0.08 - 2 * rad) / Math.max(1, per - 1) * (per > 1 ? 1 : 0) + (l % 2) * rad, y = y0 + rad + l * rad * 1.76, ln = dep - 0.1 - 0.08 * S.hash(id, q, 12);
        cy(u, y, 0.05 + ln / 2, rad, ln, bc(id, q + 20)); core(u, y, 0.05 + ln + 0.005, rad * 0.22); } } }
};
/** bolts of cloth stacked on the floor, along x or z */
const pile = (B: Batch, x: number, z: number, n: number, k: number, alongX = true, y0 = 0) => { let i = 0; for (let lv = 0; lv < 3 && i < n; lv++) for (let j = 0; j < 3 - lv && i < n; j++, i++) { const off = (j - (2 - lv) / 2) * 0.3;
    B.cyl(M.clothI(), alongX ? x : x + off, y0 + 0.14 + lv * 0.25, alongX ? z + off : z, 0.14, 1.5, bc(k, i), alongX ? [0, 0, Math.PI / 2] : [Math.PI / 2, 0, 0]); } };
/** a hanging lamp: brass rod, enamelled shade, a glowing globe */
const lampH = (Gp: THREE.Group, B: Batch, x: number, y: number, z: number, top: number) => { B.cyl(M.brass(), x, (top + y) / 2 + 0.1, z, 0.012, top - y - 0.2); B.cyl(M.brass(), x, y + 0.2, z, 0.05, 0.08);
  const cn = new THREE.ConeGeometry(0.36, 0.22, 20, 1, true); cn.translate(x, y + 0.08, z); add(Gp, cn, lam("qShadeG", () => ({ color: "#2f6a4a", side: THREE.DoubleSide, roughness: 0.25, metalness: 0.3 })), true); glow(Gp, new THREE.SphereGeometry(0.12, 14, 10).translate(x, y - 0.03, z), [3.4, 2.8, 1.7]); };
/** a turned table or chair leg */
const leg = (B: Batch, m: THREE.Material, x: number, z: number, h: number, r = 0.035) => { B.cyl(m, x, h / 2, z, r, h); B.cyl(m, x, h * 0.78, z, r * 1.6, h * 0.1); B.cyl(m, x, h * 0.3, z, r * 1.4, h * 0.08); };
const chair = (B: Batch, x: number, z: number, face: number) => { const w = M.wood("#5a3320"); B.box(w, x - 0.22, 0.44, z - 0.22, x + 0.22, 0.48, z + 0.22); for (const a of [-0.19, 0.19]) for (const b of [-0.19, 0.19]) B.cyl(w, x + a, 0.22, z + b, 0.02, 0.44);
  for (const a of [-0.19, 0.19]) B.cyl(w, x + a, 0.8, z - face * 0.2, 0.02, 0.7); for (const y of [0.78, 0.98, 1.12]) B.box(w, x - 0.2, y, z - face * 0.21, x + 0.2, y + 0.07, z - face * 0.19); };

// ---------------- the shop, its back room, the desk with the map ----------------
export function buildShop(R: THREE.Object3D, refs: Refs) {
  const Gp = refs.shop; R.add(Gp); const { A } = kit(Gp, refs), B = new Batch();
  const floorM = M.floor("#b8844c"), wd = M.wood("#6a3e22"), top = M.wood("#a8743e"), wall0 = M.stucco("#e6d6b6"), brass = M.brass();
  const rug = lam("qRug", () => ({ map: T.rugTex(), roughness: 1, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  // --- the shop ---
  { const x0 = IX - 5.5, x1 = IX + 5.5;
    A(ground(x0, x1, -4, 4.2, 0), floorM); A(ceil(x0, x1, -4, 4.2, 3.6), wall0); A(wall(x0, -4.02, x1, -4.02, 0, 3.6), wall0); A(wall(x0, 4.2, x0, -4, 0, 3.6), wall0); A(wall(x1, -4, x1, 4.2, 0, 3.6), wall0);
    shelving(B, x0, -4, 8.85, "x", 1, 3.2, 1); shelving(B, x0, -3.5, 7.6, "z", 1, 3.2, 2); shelving(B, x1, -3.5, 7.6, "z", -1, 3.2, 3);
    B.box(M.wood("#7a4a2c"), x0, 3.3, -4, x1, 3.42, -3.44); B.box(M.wood("#7a4a2c"), x0, 3.3, -4, x0 + 0.56, 3.42, 4.2); B.box(M.wood("#7a4a2c"), x1 - 0.56, 3.3, -4, x1, 3.42, 4.2);
    // the doorway to the back room, with its velvet curtain on a brass rail
    B.box(pmat("#120c12", 1), IX + 3.4, 0, -4.01, IX + 4.9, 2.55, -3.96).box(wd, IX + 3.3, 0, -4, IX + 3.42, 2.65, -3.84).box(wd, IX + 4.88, 0, -4, IX + 5.0, 2.65, -3.84).box(wd, IX + 3.3, 2.55, -4, IX + 5.0, 2.68, -3.84).cyl(brass, IX + 4.15, 2.5, -3.82, 0.018, 1.6, undefined, [0, 0, Math.PI / 2]);
    for (let i = 0; i < 6; i++) B.cyl(M.cloth(i % 2 ? "#7a1f2c" : "#96283a"), IX + 3.52 + i * 0.13, 1.28, -3.8 + 0.02 * (i % 2), 0.075, 2.4);
    // the counter: panelled front, a thick top, a brass foot rail
    B.box(wd, IX - 3.8, 0.08, -2.0, IX + 1.8, 0.92, -1.1).box(top, IX - 3.9, 0.92, -2.08, IX + 1.9, 0.98, -1.02).box(M.wood("#4a2c1a"), IX - 3.82, 0, -2.02, IX + 1.82, 0.08, -1.08).cyl(brass, IX - 1.0, 0.16, -0.98, 0.02, 5.5, undefined, [0, 0, Math.PI / 2]);
    for (let x = IX - 3.6; x < IX + 1.5; x += 1.08) { B.box(M.wood("#7a4a2c"), x, 0.16, -1.1, x + 0.9, 0.84, -1.08); B.box(M.wood("#5a3320"), x + 0.08, 0.24, -1.08, x + 0.82, 0.76, -1.065); }
    // on the counter: bolts, the brass till, shears, a yardstick
    ([[-3.25, -1.72, 0, "#3f86c2"], [-3.25, -1.46, 0, "#eebc1e"], [-3.25, -1.59, 0.23, "#d8433a"], [0.95, -1.74, 0, "#4f9a56"], [0.95, -1.48, 0, "#e85a7a"], [0.95, -1.61, 0.23, "#7a5a9a"]] as [number, number, number, string][]).forEach(([dx, z, up, c]) => B.cyl(M.clothI(), IX + dx, 1.1 + up, z, 0.12, 1.15, c, [0, 0, Math.PI / 2]));
    B.box(brass, IX + 0.0, 0.98, -1.88, IX + 0.5, 1.16, -1.44).box(brass, IX + 0.03, 1.16, -1.86, IX + 0.47, 1.3, -1.62).box(M.wood("#4a2c1a"), IX - 0.02, 0.98, -1.9, IX + 0.52, 1.02, -1.42).box(pmat("#f4f0e0", 0.6), IX + 0.08, 1.3, -1.82, IX + 0.42, 1.46, -1.78);
    for (let r = 0; r < 3; r++) for (let q = 0; q < 5; q++) B.cyl(pmat("#f4f0e0", 0.4), IX + 0.08 + q * 0.085, 1.19 + r * 0.035, -1.58 + r * 0.04, 0.03, 0.02);
    B.box(M.wood("#e8cf8a"), IX - 1.95, 0.985, -1.2, IX - 0.95, 0.998, -1.16).box(M.metal("#c9d2de", 0.25), IX - 0.7, 0.985, -1.5, IX - 0.38, 0.995, -1.47, undefined, [0, 0.5, 0]).box(M.metal("#c9d2de", 0.25), IX - 0.7, 0.985, -1.5, IX - 0.38, 0.995, -1.47, undefined, [0, -0.3, 0]);
    // the bolt of white cloth and the length that runs out of it along the counter
    B.cyl(M.cloth("#f4f2ea"), IX - 2.5, 1.11, -1.55, 0.13, 0.9, undefined, [Math.PI / 2, 0, 0]); { const C = refs.cloth; C.position.set(IX - 2.5, 0.986, -1.55); Gp.add(C); const g = new THREE.BoxGeometry(1, 0.012, 0.86); g.translate(0.5, 0, 0); add(C, g, M.cloth("#f4f2ea"), true); }
    // a dressmaker's form, the fitting stand and its cheval mirror, a ladder on the shelves, piles of bolts, a rug
    { const mx = IX - 4.4, mz = -0.6; B.cyl(wd, mx, 0.5, mz, 0.03, 1.0).cyl(wd, mx, 0.03, mz, 0.28, 0.06).sph(M.cloth("#e9dcc6"), mx, 1.32, mz, 0.26, 0.38, 0.19).cyl(wd, mx, 1.72, mz, 0.07, 0.1); }
    B.cyl(M.wood("#7a4a2c"), IX + 3.4, 0.12, 0.3, 0.62, 0.24).cyl(M.wood("#5a3320"), IX + 3.4, 0.03, 0.3, 0.66, 0.06);
    B.box(brass, IX + 4.78, 0.2, -0.52, IX + 4.86, 2.3, -0.44).box(brass, IX + 4.78, 0.2, 0.64, IX + 4.86, 2.3, 0.72).box(brass, IX + 4.78, 2.22, -0.52, IX + 4.86, 2.3, 0.72).box(pmat("#e8eef4", 0.03, 1), IX + 4.8, 0.3, -0.44, IX + 4.83, 2.22, 0.64);
    for (const dx of [0, 0.5]) B.rod(wd, [IX - 0.6 + dx, 0, -3.0], [IX - 0.6 + dx, 3.1, -3.5], 0.03); for (let i = 1; i < 8; i++) B.rod(wd, [IX - 0.6, i * 0.38, -3.0 - i * 0.062], [IX - 0.1, i * 0.38, -3.0 - i * 0.062], 0.02);
    pile(B, IX - 4.3, -2.9, 6, 0); pile(B, IX + 1.9, -3.0, 5, 3); pile(B, IX - 4.5, 1.6, 6, 7, false); pile(B, IX + 4.4, 2.2, 5, 5, false);
    A(ground(IX - 1.6, IX + 2.4, -0.4, 2.2, 0.01), rug);
    lampH(Gp, B, IX - 2.4, 2.5, -0.9, 3.6); lampH(Gp, B, IX + 1.6, 2.5, -0.9, 3.6); lampH(Gp, B, IX - 0.4, 2.6, 1.6, 3.6);
  }
  // --- the back room ---
  { const x0 = BX - 4.2, x1 = BX + 4.2, paper = lam("qPaper", () => { const t = tiled(T.paperTex(), 2.6, 0.66); t.offset.y = 0.34; return { map: t, roughness: 0.95, side: THREE.DoubleSide }; });
    A(ground(x0, x1, -3.6, 4, 0), floorM); A(ceil(x0, x1, -3.6, 4, 3.0), wall0); A(wall(x0, -3.62, x1, -3.62, 0, 3), wall0); A(wall(x0, 4, x0, -3.6, 0, 3), wall0); A(wall(x1, -3.6, x1, 4, 0.9, 3), paper); A(wall(BX + 2.1, -3.6, x1, -3.6, 0.9, 3, 0.25, 1), paper);
    shelving(B, x0, -3.6, 6.3, "x", 1, 2.9, 4); shelving(B, x0, -3.1, 7.0, "z", 1, 2.9, 5);
    // wainscot under the paper on the right-hand wall and beside the door
    const wain = M.wood("#5a3320"); B.box(wain, x1 - 0.04, 0, -3.6, x1, 0.9, 4).box(M.wood("#7a4a2c"), x1 - 0.07, 0.86, -3.6, x1, 0.96, 4); for (let z = -3.4; z < 3.8; z += 0.92) B.box(M.wood("#6a3e26"), x1 - 0.06, 0.14, z, x1 - 0.04, 0.78, z + 0.74);
    B.box(wain, BX + 2.1, 0, -3.6, x1, 0.9, -3.56).box(M.wood("#7a4a2c"), BX + 2.1, 0.86, -3.6, x1, 0.96, -3.53);
    // the door to the shop (a curtain), pictures, the wall clock, the coat rack and its hats
    B.box(pmat("#120c12", 1), BX + 2.25, 0, -3.61, BX + 3.4, 2.4, -3.57); for (let i = 0; i < 5; i++) B.cyl(M.cloth(i % 2 ? "#7a1f2c" : "#96283a"), BX + 2.4 + i * 0.15, 1.2, -3.5, 0.08, 2.3); B.cyl(M.brass(), BX + 2.8, 2.4, -3.5, 0.018, 1.3, undefined, [0, 0, Math.PI / 2]);
    for (const [dz, k] of [[0.2, 0], [1.9, 1]]) { B.box(M.brass(), x1 - 0.06, 1.72, dz - 0.44, x1 - 0.02, 2.42, dz + 0.44); A(wall(x1 - 0.065, dz - 0.36, x1 - 0.065, dz + 0.36, 1.8, 2.34), lam("qFrame" + k, () => ({ map: T.frameTex(k), roughness: 0.6, side: THREE.DoubleSide }))); }
    { const cx = x1 - 0.06, cz = -1.6; B.box(wain, cx - 0.1, 1.15, cz - 0.2, cx + 0.02, 2.56, cz + 0.2); const face = new THREE.Mesh(new THREE.CircleGeometry(0.17, 24), lam("qClock", () => ({ map: Q.clockTex(), alphaTest: 0.5, roughness: 0.5 }))); face.rotation.y = -Math.PI / 2; face.position.set(cx - 0.105, 2.3, cz); Gp.add(face); B.cyl(M.brass(), cx - 0.11, 1.5, cz, 0.06, 0.02, undefined, [0, 0, Math.PI / 2]).box(M.brass(), cx - 0.112, 1.5, cz - 0.008, cx - 0.108, 2.05, cz + 0.008); }
    { const rx = x1 - 0.55, rz = 0.9, w2 = M.wood("#4a2c1a"); B.cyl(w2, rx, 0.95, rz, 0.03, 1.9).cyl(w2, rx, 0.03, rz, 0.24, 0.06); for (let i = 0; i < 4; i++) B.rod(w2, [rx, 1.75, rz], [rx + 0.2 * Math.cos(i * 1.57), 1.9, rz + 0.2 * Math.sin(i * 1.57)], 0.014);
      B.cyl(M.felt("#1c1a20"), rx + 0.2, 2.02, rz, 0.11, 0.2).cyl(M.felt("#1c1a20"), rx + 0.2, 1.92, rz, 0.19, 0.02).sph(M.felt("#4a3e34"), rx - 0.2, 1.99, rz, 0.12, 0.1, 0.12).cyl(M.felt("#4a3e34"), rx - 0.2, 1.93, rz, 0.18, 0.02); }
    // the table: a green baize top, the paper, ink, the oil lamp, cups
    const tz = -0.9, tw = M.wood("#6a3e22"); B.box(tw, BX - 1.5, 0.7, tz - 0.62, BX + 1.5, 0.78, tz + 0.62).box(M.felt("#2f6a4a"), BX - 1.4, 0.78, tz - 0.52, BX + 1.4, 0.788, tz + 0.52).box(tw, BX - 1.42, 0.56, tz - 0.54, BX + 1.42, 0.7, tz + 0.54);
    for (const dx of [-1.36, 1.36]) for (const dz of [-0.5, 0.5]) leg(B, tw, BX + dx, tz + dz, 0.7, 0.04);
    { const D = refs.deed; D.position.set(BX - 0.08, 0.792, tz + 0.12); Gp.add(D); const g = new THREE.PlaneGeometry(0.42, 0.58); g.rotateX(-Math.PI / 2); add(D, g, lam("qDeed", () => ({ map: T.deedTex(), roughness: 0.9 })), false); }
    B.cyl(pmat("#16161c", 0.08, 0.3), BX + 0.42, 0.83, tz + 0.2, 0.05, 0.08).cyl(brass, BX + 0.42, 0.875, tz + 0.2, 0.03, 0.02);
    B.cyl(brass, BX - 1.0, 0.81, tz - 0.1, 0.12, 0.05).cyl(brass, BX - 1.0, 0.9, tz - 0.1, 0.07, 0.14).cyl(brass, BX - 1.0, 0.98, tz - 0.1, 0.085, 0.03); glow(Gp, new THREE.SphereGeometry(0.1, 12, 10).scale(0.8, 1.4, 0.8).translate(BX - 1.0, 1.13, tz - 0.1), [3.4, 2.7, 1.4]);
    for (const [dx, dz] of [[0.95, -0.25], [1.15, 0.2]]) { B.cyl(pmat("#f8f6f0", 0.15), BX + dx, 0.825, tz + dz, 0.042, 0.07).cyl(pmat("#f8f6f0", 0.15), BX + dx, 0.794, tz + dz, 0.075, 0.012); }
    ([[-1.12, 0.32, 0], [-1.12, 0.06, 0], [-1.12, 0.19, 0.18]] as number[][]).forEach(([dx, dz, up], i) => B.cyl(M.clothI(), BX + dx, 0.89 + up, tz + dz, 0.1, 0.62, ["#3f86c2", "#eebc1e", "#d8433a"][i], [0, 0, Math.PI / 2]));
    chair(B, BX - 1.95, tz - 0.86, 1); chair(B, BX + 1.95, tz - 0.86, 1);
    // bolts stood on end in the corners, piles on the floor, a crate, the rug
    ([[-3.55, -2.95, 0.1, 0], [-3.2, -3.0, -0.08, 3], [-2.85, -2.96, 0.05, 6], [1.75, -3.25, -0.07, 8], [-3.6, 2.3, 0.08, 5], [-3.3, 2.6, -0.1, 9]] as number[][]).forEach(([dx, dz, tl, k]) => B.cyl(M.clothI(), BX + dx, 0.8, dz, 0.13, 1.6, bc(k, 40), [0, 0, tl]));
    pile(B, BX - 3.4, 1.2, 6, 6); pile(B, BX + 3.3, 2.4, 5, 9, false); pile(B, BX + 0.9, -3.0, 3, 4);
    B.box(M.wood("#c99a5a"), BX + 3.0, 0, -2.6, BX + 3.9, 0.7, -1.9); for (const y of [0.1, 0.56]) B.box(M.wood("#a87c48"), BX + 2.98, y, -2.62, BX + 3.92, y + 0.08, -1.88); B.cyl(M.cloth("#f4f2ea"), BX + 3.45, 0.84, -2.25, 0.13, 1.1, undefined, [0, 0, Math.PI / 2]);
    A(ground(BX - 2.2, BX + 2.2, -2.2, 0.8, 0.01), rug);
    lampH(Gp, B, BX + 0.3, 2.62, tz - 0.6, 3.0);
  }
  // --- the desk with the map ---
  { A(ground(MX - 4, MX + 4, -3, 3, 0.78), M.floor("#a8743e")); A(ground(MX - 1.4, MX + 1.4, -1.05, 1.05, 0.79), lam("qMap", () => ({ map: T.mapTex(), roughness: 0.92, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })));
    B.cyl(M.clothI(), MX - 1.9, 0.92, 0.1, 0.14, 1.5, "#3f86c2", [Math.PI / 2, 0, 0]).cyl(M.clothI(), MX - 2.2, 0.92, 0.3, 0.14, 1.5, "#eebc1e", [Math.PI / 2, 0, 0]).cyl(pmat("#16161c", 0.08, 0.3), MX + 1.75, 0.83, -0.7, 0.07, 0.1).box(brass, MX + 1.55, 0.785, 0.3, MX + 2.25, 0.8, 0.36).cyl(brass, MX + 1.8, 0.79, 1.0, 0.13, 0.02).box(M.metal("#c9d2de", 0.25), MX - 1.9, 0.785, -1.3, MX - 1.5, 0.795, -1.26, undefined, [0, 0.4, 0]); }
  B.build(Gp);
}

// ---------------- the waste ground by the bullring ----------------
export function buildField(R: THREE.Object3D, refs: Refs) {
  const Gp = refs.field; R.add(Gp); const { A, pennant, hills, skyline, grass, trees } = kit(Gp, refs), B = new Batch();
  A(ground(FX - 420, FX + 420, -420, 420, 0), M.earth());
  grass("field", 9000, 26, { h0: 0.08, h1: 0.3, w: 0.022, base: ["#8a8444", "#9a8a4a", "#7a7a3c"], tip: ["#d9c880", "#c4b868", "#e2d290", "#b0a85a"], lean: 1.2 });
  // stones half-buried in the dust
  for (let i = 0; i < 520; i++) { const a = S.hash(i, 1, 40) * 6.283, r = 4 + 60 * S.hash(i, 2, 40), s = 0.04 + 0.1 * S.hash(i, 3, 40) ** 2; B.sph(M.stone(["#a89a8a", "#c4b8a6", "#8f8478", "#b9a890"][i % 4]), FX + r * Math.cos(a), s * 0.25, r * Math.sin(a) * 0.6, s * (1 + S.hash(i, 4, 40)), s * 0.6, s); }
  // two goals of poles with a rope for a bar; pegs and a rope round the pitch
  const pole = M.wood("#a87c48"), rope = pmat("#d9cdb0", 0.95);
  for (const sd of [-1, 1]) { const x = FX + sd * 30; for (const z of [-3.6, 3.6]) B.cyl(pole, x, 1.25, z, 0.06, 2.5); B.rod(rope, [x, 2.42, -3.6], [x, 2.3, 0], 0.02).rod(rope, [x, 2.3, 0], [x, 2.42, 3.6], 0.02); }
  for (let x = -34; x <= 34; x += 4) for (const z of [-21, 21]) { B.cyl(pole, FX + x, 0.35, z, 0.03, 0.7); if (x < 34) B.rod(rope, [FX + x, 0.62, z], [FX + x + 2, 0.55, z], 0.012).rod(rope, [FX + x + 2, 0.55, z], [FX + x + 4, 0.62, z], 0.012); }
  // the bullring: thirty-eight bays of brick with real horseshoe arches, a gallery behind them, a tiled lip, flags
  { const cx = FX - 8, cz = -74, rad = 36, h = 15, nb = 38, wb = (2 * Math.PI * rad) / nb, sh = new THREE.Shape(); sh.moveTo(-wb / 2 - 0.02, 0); sh.lineTo(wb / 2 + 0.02, 0); sh.lineTo(wb / 2 + 0.02, h); sh.lineTo(-wb / 2 - 0.02, h); sh.lineTo(-wb / 2 - 0.02, 0);
    const arch = (x: number, y0: number, w: number, hh: number, shoe: number) => { const p = new THREE.Path(), r = w / 2 * (1 + shoe), cyy = y0 + hh; p.moveTo(x - w / 2, y0); p.lineTo(x - w / 2, cyy - 0.2); p.absarc(x, cyy, r, Math.PI + 0.35 * shoe * 6, -0.35 * shoe * 6, true); p.lineTo(x + w / 2, y0); p.lineTo(x - w / 2, y0); sh.holes.push(p); };
    arch(0, 0, 3.1, 4.4, 0.08); arch(-1.35, 8.9, 1.5, 2.5, 0.08); arch(1.35, 8.9, 1.5, 2.5, 0.08);
    const bay = new THREE.ExtrudeGeometry(sh, { depth: 1.1, bevelEnabled: false, curveSegments: 14 }), im = new THREE.InstancedMesh(bay, M.brick(), nb), Mx = new THREE.Matrix4(), stone = M.stone("#efe3c8");
    for (let i = 0; i < nb; i++) { const a = (i / nb) * Math.PI * 2, th = Math.atan2(-Math.cos(a), -Math.sin(a)), px = cx + rad * Math.cos(a), pz = cz + rad * Math.sin(a); Mx.makeRotationY(th); Mx.setPosition(px, 0, pz); im.setMatrixAt(i, Mx);
      const ab = a + Math.PI / nb, bxp = cx + (rad + 0.12) * Math.cos(ab), bzp = cz + (rad + 0.12) * Math.sin(ab); B.slab(stone, bxp, h / 2, bzp, 0.62, h, 0.5, [0, th, 0]); B.slab(stone, bxp, 8.2, bzp, 0.8, 0.5, 0.62, [0, th, 0]);
      for (const s of [-1, 1]) { B.slab(stone, px + s * 1.7 * Math.cos(th), 4.3, pz - s * 1.7 * Math.sin(th), 0.5, 0.26, 1.24, [0, th, 0]); }
      B.slab(stone, px, 8.5, pz, wb, 0.3, 1.3, [0, th, 0]); B.slab(stone, px, 8.9 - 0.12, pz, wb * 0.9, 0.12, 1.4, [0, th, 0]);
      for (let q = 0; q < 6; q++) { const bxq = px + (-1.9 + q * 0.76 + (q > 2 ? 0 : 0)) * Math.cos(th), bzq = pz - (-1.9 + q * 0.76) * Math.sin(th); if (Math.abs(-1.9 + q * 0.76) < 0.05) continue; B.slab(stone, bxq - 0.9 * Math.sin(th), 9.45, bzq - 0.9 * Math.cos(th), 0.06, 1.0, 0.06, [0, th, 0]); }
      B.slab(M.iron(), px - 0.95 * Math.sin(th), 9.95, pz - 0.95 * Math.cos(th), wb * 0.8, 0.05, 0.05, [0, th, 0]); }
    im.castShadow = true; im.receiveShadow = true; im.computeBoundingSphere(); Gp.add(im);
    const inner = new THREE.CylinderGeometry(rad - 3.4, rad - 3.4, h, 76, 1, true); inner.translate(cx, h / 2, cz); A(inner, M.brickD(), false); const gal = new THREE.RingGeometry(rad - 3.4, rad - 1.0, 76); gal.rotateX(-Math.PI / 2); gal.translate(cx, 8.75, cz); A(gal, M.stone("#b9a890"), true);
    const corn = new THREE.CylinderGeometry(rad + 0.6, rad + 0.35, 0.7, 76, 1, false); corn.translate(cx, h + 0.35, cz); A(corn, stone, true);
    const lip = new THREE.CylinderGeometry(rad - 5.5, rad + 0.75, 2.4, 76, 1, true); lip.translate(cx, h + 1.9, cz); A(lip, wmat("pantileD", S.pantile(), 2, { side: THREE.DoubleSide }), true);
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; pennant(cx + (rad - 1) * Math.cos(a), h + 0.7, cz + (rad - 1) * Math.sin(a), 5.2, 2.2, PEN[i % 2 ? 0 : 1], -a + 0.5); }
    // the gate block with its tall horseshoe door
    const gs = new THREE.Shape(); gs.moveTo(-6, 0); gs.lineTo(6, 0); gs.lineTo(6, h + 3.2); gs.lineTo(-6, h + 3.2); gs.lineTo(-6, 0); { const p = new THREE.Path(); p.moveTo(-2.5, 0); p.lineTo(-2.5, 6.6); p.absarc(0, 7.0, 2.8, Math.PI + 0.3, -0.3, true); p.lineTo(2.5, 0); p.lineTo(-2.5, 0); gs.holes.push(p); }
    const gg = new THREE.ExtrudeGeometry(gs, { depth: 3.2, bevelEnabled: false, curveSegments: 20 }); gg.translate(cx, 0, cz + rad - 1.2); A(gg, M.brick(), true);
    B.box(stone, cx - 6.4, h + 3.2, cz + rad - 1.4, cx + 6.4, h + 4.0, cz + rad + 2.2).box(stone, cx - 6.2, 0, cz + rad + 1.9, cx - 5.4, h + 3.2, cz + rad + 2.1).box(stone, cx + 5.4, 0, cz + rad + 1.9, cx + 6.2, h + 3.2, cz + rad + 2.1).box(stone, cx - 6, 10.6, cz + rad + 1.95, cx + 6, 11.1, cz + rad + 2.1);
    B.box(M.wood("#4a2c1a"), cx - 2.6, 0, cz + rad - 0.4, cx + 2.6, 9.8, cz + rad - 0.2); for (const sx of [-1, 1]) for (let q = 0; q < 4; q++) B.box(M.wood("#5a3622"), cx + sx * 1.3 - 1.0, 0.4 + q * 1.5, cz + rad - 0.22, cx + sx * 1.3 + 1.0, 1.6 + q * 1.5, cz + rad - 0.16);
    for (const [x, y] of [[-4.2, 13], [4.2, 13], [0, 14.6]]) { B.box(pmat("#3f86c2", 0.3), cx + x - 0.5, y - 0.5, cz + rad + 1.98, cx + x + 0.5, y + 0.5, cz + rad + 2.04, undefined, [0, 0, Math.PI / 4]); B.sph(pmat("#eebc1e", 0.3), cx + x, y, cz + rad + 2.06, 0.16); } }
  // the tavern: whitewash over an ochre plinth, a real doorway and grilled windows, a roof of pantiles, barrels, a table
  const house = (hx: number, hz: number, w: number, hgt: number, col: string, plinth: string, door: number, wins: number[], k: number) => { const st = M.stucco("#ffffff"), tl = M.tile(), d = 7, z = hz;
    // front wall with openings: door at x = door (1.3 wide, 2.5 high), windows at wins (1.1 wide, 1.3 high from 1.25)
    const cuts = [...wins.map((x) => ({ x, w: 1.1, y0: 1.25, y1: 2.55 })), { x: door, w: 1.3, y0: 0, y1: 2.5 }].sort((a, b) => a.x - b.x); let xa = hx - w / 2;
    for (const c of cuts) { B.box(st, xa, 0, z - 0.4, hx + c.x - c.w / 2, hgt, z, col); B.box(st, hx + c.x - c.w / 2, c.y1, z - 0.4, hx + c.x + c.w / 2, hgt, z, col); if (c.y0 > 0) B.box(st, hx + c.x - c.w / 2, 0, z - 0.4, hx + c.x + c.w / 2, c.y0, z, col); xa = hx + c.x + c.w / 2; }
    B.box(st, xa, 0, z - 0.4, hx + w / 2, hgt, z, col); B.box(st, hx - w / 2, 0, z - d, hx - w / 2 + 0.4, hgt, z - 0.4, col).box(st, hx + w / 2 - 0.4, 0, z - d, hx + w / 2, hgt, z - 0.4, col).box(st, hx - w / 2, 0, z - d, hx + w / 2, hgt, z - d + 0.4, col);
    B.box(st, hx - w / 2 - 0.03, 0, z, hx + w / 2 + 0.03, 0.9, z + 0.04, plinth); B.box(pmat("#18121a", 1), hx - w / 2 + 0.4, 0, z - 3.2, hx + w / 2 - 0.4, hgt, z - 3.0);
    // door leaf standing open, stone step, lintel beam
    B.slab(M.wood("#6a4428"), hx + door - 0.62, 1.25, z - 0.72, 0.06, 2.5, 1.2, [0, 0.25, 0]).box(M.stone("#b9a890"), hx + door - 0.8, 0, z, hx + door + 0.8, 0.12, z + 0.35).box(M.wood("#5a3a22"), hx + door - 0.85, 2.5, z - 0.06, hx + door + 0.85, 2.72, z + 0.05);
    for (const wx of wins) { B.box(M.wood("#5a3a22"), hx + wx - 0.62, 1.17, z - 0.1, hx + wx + 0.62, 1.25, z + 0.1).box(M.glass(), hx + wx - 0.55, 1.25, z - 0.32, hx + wx + 0.55, 2.55, z - 0.3); for (let q = 0; q < 5; q++) B.cyl(M.iron(), hx + wx - 0.44 + q * 0.22, 1.9, z - 0.06, 0.012, 1.3); for (const y of [1.55, 2.25]) B.box(M.iron(), hx + wx - 0.55, y, z - 0.07, hx + wx + 0.55, y + 0.02, z - 0.05);
      for (let q = 0; q < 3; q++) { B.cyl(pmat("#b5563a", 0.9), hx + wx - 0.34 + q * 0.34, 1.34, z + 0.06, 0.08, 0.16); B.sph(pmat("#4f8a3a", 0.9), hx + wx - 0.34 + q * 0.34, 1.52, z + 0.06, 0.13, 0.12, 0.13); B.sph(pmat(["#d8433a", "#e85a7a", "#eebc1e"][(q + k) % 3], 0.8), hx + wx - 0.3 + q * 0.34, 1.6, z + 0.1, 0.05); } }
    // gable roof of pantiles with a ridge, eaves beams
    const rl = d / 2 / Math.cos(0.5) + 0.5; B.slab(tl, hx, hgt + 0.95, z - d / 4 + 0.25, w + 0.8, 0.12, rl, [0.5, 0, 0]).slab(tl, hx, hgt + 0.95, z - 3 * d / 4 - 0.25, w + 0.8, 0.12, rl, [-0.5, 0, 0]).cyl(pmat("#b5563a", 0.9), hx, hgt + 1.95, z - d / 2, 0.14, w + 0.8, undefined, [0, 0, Math.PI / 2]);
    for (const sx of [-1, 1]) A(tri([hx + sx * (w / 2 - 0.01), hgt, z], [hx + sx * (w / 2 - 0.01), hgt, z - d], [hx + sx * (w / 2 - 0.01), hgt + 1.92, z - d / 2]), lam("qGable" + col, () => ({ color: col, side: THREE.DoubleSide, roughness: 0.95 })), true);
    for (let x = hx - w / 2; x <= hx + w / 2 + 0.01; x += w / 8) B.box(M.wood("#5a3a22"), x - 0.05, hgt - 0.14, z, x + 0.05, hgt, z + 0.45); };
  { const tx = FX + 31, tz = -27; house(tx, tz, 10, 5, "#f4ecd8", "#c47a44", 0, [-3.1, 3.1], 0);
    B.box(M.brick(), tx + 2.6, 5.4, tz - 4.2, tx + 3.4, 8.1, tz - 3.4).box(M.stone("#b9a890"), tx + 2.5, 8.1, tz - 4.3, tx + 3.5, 8.25, tz - 3.3);
    // the sign: a board with a painted jug on an iron bracket
    B.box(M.iron(), tx - 0.02, 3.5, tz, tx + 0.02, 3.54, tz + 0.8).rod(M.iron(), [tx, 3.5, tz + 0.75], [tx, 3.28, tz + 0.75], 0.008).sph(pmat("#b5563a", 0.45), tx, 3.1, tz + 0.75, 0.16, 0.19, 0.16).cyl(pmat("#b5563a", 0.45), tx, 3.3, tz + 0.75, 0.06, 0.1);
    const cask = M.wood("#8a5a34", 0.5); for (const [dx, dz, up] of [[-3.9, 0.9, 0], [-3.0, 0.9, 0], [-3.45, 0.9, 1]]) { B.cyl(cask, tx + dx, 0.42 + up * 0.74, tz + dz, 0.42, 1.0, undefined, [Math.PI / 2, 0, 0]); for (const o of [-0.36, 0.36]) B.cyl(M.iron(), tx + dx, 0.42 + up * 0.74, tz + dz + o, 0.435, 0.05, undefined, [Math.PI / 2, 0, 0]); }
    B.cyl(cask, tx + 3.9, 0.45, tz + 1.0, 0.4, 0.9); for (const y of [0.2, 0.7]) B.cyl(M.iron(), tx + 3.9, y, tz + 1.0, 0.41, 0.05);
    B.box(M.wood("#6a3e22"), tx + 6.0, 0.7, tz + 1.4, tx + 8.0, 0.76, tz + 2.4); for (const dx of [6.1, 7.9]) for (const dz of [1.5, 2.3]) B.box(M.wood("#5a3320"), tx + dx - 0.04, 0, tz + dz - 0.04, tx + dx + 0.04, 0.7, tz + dz + 0.04); B.cyl(pmat("#b5563a", 0.5), tx + 7.0, 0.89, tz + 1.9, 0.11, 0.26); for (const dx of [6.6, 7.4]) B.cyl(pmat("#f8f6f0", 0.2), tx + dx, 0.8, tz + 2.0, 0.04, 0.09);
    // the washing line: white shirts
    const lx0 = tx - 13, lx1 = tx - 6.5, lz = tz + 2.5; for (const x of [lx0, lx1]) B.cyl(pole, x, 1.3, lz, 0.05, 2.6); B.rod(rope, [lx0, 2.5, lz], [lx1, 2.5, lz], 0.01);
    for (let i = 0; i < 5; i++) { const x = lx0 + 0.8 + i * 1.2, F = new THREE.Group(); F.position.set(x, 2.48, lz); Gp.add(F); refs.crowns.push(F); const cm = M.cloth("#f4f2ea"); add(F, new THREE.BoxGeometry(0.68, 0.82, 0.015).translate(0, -0.41, 0), cm, true); add(F, new THREE.BoxGeometry(0.28, 0.28, 0.015).translate(-0.48, -0.16, 0), cm, true); add(F, new THREE.BoxGeometry(0.28, 0.28, 0.015).translate(0.48, -0.16, 0), cm, true); } }
  // low houses of the outskirts, a paling fence, a hay cart, poplars
  { const HC = ["#f1e6cc", "#e9cfa6", "#f4ecd6", "#e2bfa0"], PC = ["#a86a4a", "#8a7a66", "#b5563a", "#7a8a8a"]; ([[52, -33], [65, -34], [78, -33], [92, -36], [-62, -40], [-75, -38], [-88, -41], [-104, -44], [108, -40]] as number[][]).forEach(([x, z], k) => house(FX + x, z, 12, 5.2 + (k % 3) * 0.5, HC[k % 4], PC[k % 4], [-3, 2.5, 0, 3.4][k % 4], k % 2 ? [-0.2, -4] : [-3.8, 4.2], k + 1));
    for (let x = FX - 120; x < FX + 120; x += 0.24) { const hh = 1.25 + 0.2 * S.hash(Math.round(x * 10), 1, 60); B.box(M.wood(["#a87c48", "#96703e", "#b88a54"][Math.round(x * 4) % 3 < 0 ? 0 : Math.abs(Math.round(x * 4)) % 3]), x, 0, 34, x + 0.19, hh, 34.03); } B.box(M.wood("#96703e"), FX - 120, 0.4, 34.03, FX + 120, 0.5, 34.07).box(M.wood("#96703e"), FX - 120, 1.0, 34.03, FX + 120, 1.1, 34.07);
    { const cx = FX - 40, cz = -26, w2 = M.wood("#8a6238"); B.box(M.wood("#c99a5a"), cx - 1.6, 0.9, cz - 0.9, cx + 1.6, 1.0, cz + 0.9).box(w2, cx - 1.6, 1.0, cz - 0.9, cx + 1.6, 1.5, cz - 0.84).box(w2, cx - 1.6, 1.0, cz + 0.84, cx + 1.6, 1.5, cz + 0.9);
      for (const sz of [-1, 1]) { B.cyl(w2, cx - 0.4, 0.75, cz + sz * 1.0, 0.75, 0.08, undefined, [Math.PI / 2, 0, 0]); B.cyl(M.iron(), cx - 0.4, 0.75, cz + sz * 1.0, 0.12, 0.14, undefined, [Math.PI / 2, 0, 0]); for (let q = 0; q < 6; q++) B.rod(w2, [cx - 0.4, 0.75, cz + sz * 1.05], [cx - 0.4 + 0.72 * Math.cos(q * 1.047), 0.75 + 0.72 * Math.sin(q * 1.047), cz + sz * 1.05], 0.025); }
      B.rod(w2, [cx + 1.6, 0.95, cz - 0.5], [cx + 3.6, 0.4, cz - 0.5], 0.04).rod(w2, [cx + 1.6, 0.95, cz + 0.5], [cx + 3.6, 0.4, cz + 0.5], 0.04).sph(pmat("#d8b85a", 1), cx - 0.2, 1.5, cz, 1.4, 0.65, 0.85); }
    const tr: TreeSpec[] = []; for (let i = 0; i < 16; i++) { const x = FX - 130 + i * 17 + (i % 3) * 3; tr.push({ x, z: -52 - (i % 4) * 7 - (Math.abs(x - FX + 8) < 48 ? 70 : 0), h: 13 + (i % 4) * 2, k: i, slim: i % 3 !== 1 }); } for (let i = 0; i < 9; i++) tr.push({ x: FX - 100 + i * 26, z: 44 + (i % 3) * 6, h: 12 + (i % 3) * 2, k: i + 2, slim: i % 2 === 0 }); trees(tr, ["#5a7a3a", "#6a8a40", "#4f7036", "#7a9648"]); }
  skyline(1, FX + 80, -230, FX + 520, -230, 110, [1, 0.95, 0.9]); skyline(1, FX - 520, -250, FX - 60, -250, 100, [0.95, 0.95, 1]); hills(FX, 0, [0.8, 0.85, 1]);
  B.build(Gp);
}

// ---------------- London: a pitch in the fog under the skyline ----------------
export function buildLondon(R: THREE.Object3D, refs: Refs) {
  const Gp = refs.london; R.add(Gp); const { A, gasLamp, skyline, grass, trees } = kit(Gp, refs), B = new Batch();
  A(ground(LX - 300, LX + 300, -300, 300, 0), wmat("meadowL", S.turf("meadowL", 0, [52, 96, 44], [70, 118, 52]), 6));
  grass("london", 90000, 13, { h0: 0.05, h1: 0.16, w: 0.016, base: ["#2c5a28", "#335f2c"], tip: ["#5a9a44", "#6aa64c", "#4f8c3e"], flowers: 0.006, lean: 0.8 });
  { const g = new THREE.Group(); g.position.set(LX, 0, -9); g.rotation.y = Math.PI / 2; Gp.add(g); kit(g as THREE.Group, refs).goal(0, 1, true); }
  const wp = M.paint("#f1eee4", 0.6); for (let x = -40; x <= 40; x += 4) { B.box(wp, LX + x - 0.05, 0, -16.05, LX + x + 0.05, 1.05, -15.95); if (x < 40) B.box(wp, LX + x, 0.92, -16.03, LX + x + 4, 1.0, -15.97).box(wp, LX + x, 0.5, -16.03, LX + x + 4, 0.57, -15.97); }
  for (const x of [-9, 9, -27, 27]) gasLamp(B, LX + x, -17, 4.6);
  // a terrace of brick houses with lit windows and chimney pots
  for (let i = 0; i < 9; i++) { const x = LX - 72 + i * 18, h = 9 + (i % 3) * 2; B.box(M.brickD(), x - 8.8, 0, -62, x + 8.8, h, -50); B.slab(M.slate(), x, h + 1.7, -53, 18, 0.2, 7.4, [0.5, 0, 0]).slab(M.slate(), x, h + 1.7, -59, 18, 0.2, 7.4, [-0.5, 0, 0]);
    for (const dx of [-5, 3]) { B.box(M.brickD(), x + dx, h, -57, x + dx + 1.2, h + 4.6, -55.8); for (const q of [0.3, 0.9]) B.cyl(pmat("#b5563a", 0.9), x + dx + q, h + 4.95, -56.4, 0.16, 0.7); }
    for (const dx of [-6, -2, 2, 6]) for (const y of [2.2, 5.6]) { B.box(M.stone("#d9d0c0"), x + dx - 0.85, y - 0.15, -50, x + dx + 0.85, y, -49.8).box(M.stone("#d9d0c0"), x + dx - 0.85, y + 1.9, -50, x + dx + 0.85, y + 2.1, -49.85); glow(Gp, new THREE.BoxGeometry(1.4, 1.9, 0.04).translate(x + dx, y + 0.95, -49.96), (i + dx + y) % 3 < 1 ? [0.5, 0.45, 0.4] : [1.8, 1.5, 0.9]); B.box(M.white(), x + dx - 0.03, y, -49.95, x + dx + 0.03, y + 1.9, -49.9).box(M.white(), x + dx - 0.7, y + 0.92, -49.95, x + dx + 0.7, y + 0.98, -49.9); }
    B.box(M.paint(["#1f2f4c", "#5a2630", "#2f4a3a"][i % 3], 0.4), x - 0.6, 0, -49.98, x + 0.6, 2.2, -49.9); }
  const tr: TreeSpec[] = []; for (let i = 0; i < 12; i++) tr.push({ x: LX - 66 + i * 12, z: -30 - (i % 3) * 6, h: 10 + (i % 3) * 2, k: i + 2, slim: i % 4 === 0 }); trees(tr, ["#3f6a3a", "#4a7a40", "#35603a"]);
  skyline(0, LX - 260, -150, LX + 260, -150, 130, [0.95, 1, 1.1]); B.build(Gp);
}

// ---------------- the racecourse: the coronation tournament ----------------
export function buildHipo(R: THREE.Object3D, refs: Refs) {
  const Gp = refs.hipo; R.add(Gp); const { A, marks, goal, pennant, hills, skyline, grass, people, trees } = kit(Gp, refs), B = new Batch();
  A(ground(HPX - 420, HPX + 420, -420, 420, 0), wmat("meadowH", S.turf("meadowH", 0, [70, 124, 48], [104, 152, 62]), 6));
  grass("hipo", 110000, 15, { h0: 0.05, h1: 0.2, w: 0.016, base: ["#3a6a2a", "#42702c"], tip: ["#7ab850", "#8cc45a", "#6aaa46", "#a8c46a"], flowers: 0.012, lean: 0.9 });
  marks(HPX, HL, HW, 0.16); goal(HPX - HL, -1, true); goal(HPX + HL, 1, true);
  // the white rail round the pitch
  const RX = HL + 6, RZ = HW + 5, wp = M.paint("#f1eee4", 0.6); const rail = (x0: number, z0: number, x1: number, z1: number) => { const n = Math.round(Math.hypot(x1 - x0, z1 - z0) / 2.4); for (let i = 0; i <= n; i++) { const x = HPX + x0 + ((x1 - x0) * i) / n, z = z0 + ((z1 - z0) * i) / n; B.box(wp, x - 0.05, 0, z - 0.05, x + 0.05, 1.08, z + 0.05); } B.rod(wp, [HPX + x0, 1.03, z0], [HPX + x1, 1.03, z1], 0.04).rod(wp, [HPX + x0, 0.58, z0], [HPX + x1, 0.58, z1], 0.03); };
  rail(-RX, -RZ, RX, -RZ); rail(-RX, RZ, RX, RZ); rail(-RX, -RZ, -RX, RZ); rail(RX, -RZ, RX, RZ);
  // the grandstand: a timber stand of ten benches under a boarded roof on posts, bunting, the royal box in the middle
  { const z0 = -(RZ + 5), x0 = HPX - 40, x1 = HPX + 40, rows = 10, run = 1.2, rise = 0.72, bd = M.paint("#f1eee4", 0.65), tw = M.wood("#9a7448"), spots: Spot[] = [];
    B.box(bd, x0, 0, z0 - 0.06, x1, 1.8, z0);
    for (let r = 0; r < rows; r++) { const z = z0 - r * run, y = 1.8 + r * rise; B.box(tw, x0, y - 0.06, z - run, x1, y, z).box(M.wood("#7a5a38"), x0, y - rise, z - run - 0.03, x1, y, z - run).box(tw, x0, y + 0.4, z - run + 0.1, x1, y + 0.45, z - run + 0.42);
      for (let x = x0 + 0.5; x < x1; x += 0.62) { if (Math.abs(x - HPX) < 5 && r < 3) continue; const h = S.hash(Math.round(x * 10), r, 70); if (h < 0.06) continue; spots.push({ x, y: y - 0.02, z: z - run + 0.5, k: Math.floor(S.hash(Math.round(x * 10), r, 71) * 31), ph: S.hash(Math.round(x * 10), r, 72), s: 0.78 }); } }
    const zb = z0 - rows * run, yt = 1.8 + rows * rise; B.box(bd, x0, 0, zb - 0.1, x1, yt + 4.4, zb); for (const x of [x0, x1]) { B.box(bd, x - 0.06, 0, zb, x + 0.06, 1.8, z0); for (let r = 0; r < rows; r++) B.box(bd, x - 0.06, 1.8 + r * rise, zb, x + 0.06, 1.8 + (r + 1) * rise, z0 - (r + 1) * run); }
    const ry = (z: number) => 11.2 + (z0 + 2.4 - z) * (2.4 / (rows * run + 3)); B.slab(M.tile(), HPX, (ry(z0 + 2.4) + ry(zb - 0.6)) / 2, (z0 + 2.4 + zb - 0.6) / 2, 82, 0.14, Math.hypot(rows * run + 3, 2.4), [Math.atan2(2.4, rows * run + 3), 0, 0]);
    A(wall(x0 - 1, z0 + 2.4, x1 + 1, z0 + 2.4, 10.5, 11.2, 14, 1), lam("qBuntH", () => ({ map: tiled(Q.buntingTex(), 14, 1), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.9 })), true); B.box(bd, x0 - 1, 11.2, z0 + 2.3, x1 + 1, 11.5, z0 + 2.45);
    for (let x = x0; x <= x1 + 0.1; x += 8) { if (Math.abs(x - HPX) > 6) { B.cyl(bd, x, 5.6, z0 + 2.2, 0.11, 11.2); B.rod(bd, [x, 9.6, z0 + 2.2], [x + 1.6, 11.1, z0 + 2.2], 0.05).rod(bd, [x, 9.6, z0 + 2.2], [x - 1.6, 11.1, z0 + 2.2], 0.05); pennant(x, 13.4, zb, 4.4, 2.4, PEN[Math.abs(Math.round(x / 8)) % 6], 0.4); } B.cyl(bd, x, (yt + ry(zb)) / 2, zb + 0.2, 0.09, ry(zb) - yt); B.rod(tw, [x, ry(z0 + 2.2) - 0.1, z0 + 2.2], [x, ry(zb) - 0.1, zb], 0.07); }
    B.rod(bd, [x0, 2.75, z0 - 0.05], [x1, 2.75, z0 - 0.05], 0.04); for (let x = x0; x <= x1; x += 1) B.box(bd, x - 0.025, 1.8, z0 - 0.08, x + 0.025, 2.75, z0 - 0.02);
    people("hipo", Array.from({ length: 31 }, (_, i) => towns(i)), [{ facing: 0, expr: "smile" }, { facing: 0, expr: "laugh", armL: "up", armR: "up" }], spots);
    // the royal box: crimson velvet with a gold fringe, gilt posts, a canopy with its crown
    const velvet = M.cloth("#a01c2c"), gold = M.brass(); B.box(bd, HPX - 4.4, 0, z0, HPX + 4.4, 2.2, z0 + 3.2); A(wall(HPX - 4.4, z0 + 3.22, HPX + 4.4, z0 + 3.22, 0.1, 2.2), lam("qRoyal", () => ({ map: T.royalTex(), roughness: 0.95, side: THREE.DoubleSide })));
    B.box(gold, HPX - 4.4, 2.2, z0 + 3.1, HPX + 4.4, 2.3, z0 + 3.22).box(velvet, HPX - 4.4, 2.3, z0 + 3.12, HPX + 4.4, 2.62, z0 + 3.2); for (const dx of [-4.3, 4.3]) for (const dz of [0.1, 3.1]) { B.cyl(gold, HPX + dx, 4.4, z0 + dz, 0.08, 4.4); B.sph(gold, HPX + dx, 6.75, z0 + dz, 0.16); }
    B.slab(velvet, HPX, 6.7, z0 + 1.6, 9.6, 0.16, 4.2, [0.12, 0, 0]); for (let q = 0; q < 12; q++) { B.box(velvet, HPX - 4.8 + q * 0.8, 5.95, z0 + 3.68, HPX - 4.0 + q * 0.8, 6.5, z0 + 3.72); B.sph(gold, HPX - 4.4 + q * 0.8, 5.9, z0 + 3.7, 0.07); }
    B.cyl(gold, HPX, 7.25, z0 + 1.6, 0.5, 0.5); for (let q = 0; q < 6; q++) B.sph(gold, HPX + 0.5 * Math.cos(q * 1.047), 7.62, z0 + 1.6 + 0.5 * Math.sin(q * 1.047), 0.11); B.sph(pmat("#d8433a", 0.3), HPX, 7.75, z0 + 1.6, 0.2);
    for (const dx of [-5.6, 5.6]) pennant(HPX + dx, 0, z0 + 3.6, 10, 3.0, dx < 0 ? "#e2453c" : "#f6c419", 0.3);
  }
  // marquees of striped canvas, poplars, the town on the horizon
  { const canvas = M.cloth("#f4efe0"); for (const [tx, c] of [[-34, "#d8433a"], [0, "#eebc1e"], [34, "#3f86c2"]] as [number, string][]) { const x = HPX + tx, tz = RZ + 16, hw = 6.5, hd = 4.2; const cone = new THREE.ConeGeometry(1, 3.2, 4, 1, true); cone.rotateY(Math.PI / 4); cone.scale(hw * 1.5, 1, hd * 1.5); cone.translate(x, 4.8, tz); A(cone, lam("qTent" + c, () => ({ map: tiled(Q.tentTex(c), 4, 1), side: THREE.DoubleSide, roughness: 0.95 })), true);
      B.box(canvas, x - hw, 0, tz + hd - 0.03, x + hw, 3.2, tz + hd).box(canvas, x - hw, 0, tz - hd, x - hw + 0.03, 3.2, tz + hd).box(canvas, x + hw - 0.03, 0, tz - hd, x + hw, 3.2, tz + hd); for (const dx of [-hw, 0, hw]) B.cyl(wp, x + dx, 1.6, tz - hd, 0.07, 3.2); pennant(x, 6.2, tz, 2.2, 1.2, c, 0.3); }
    const tr: TreeSpec[] = []; for (let i = 0; i < 26; i++) tr.push({ x: HPX - 150 + i * 12, z: -(RZ + 34) - (i % 3) * 5, h: 15 + (i % 4) * 2, k: i, slim: true }); for (let i = 0; i < 20; i++) tr.push({ x: HPX - 140 + i * 15, z: RZ + 40 + (i % 3) * 7, h: 12 + (i % 3) * 2, k: i + 1, slim: i % 3 === 0 });
    for (const sd of [-1, 1]) for (let i = 0; i < 6; i++) tr.push({ x: HPX + sd * (RX + 22 + (i % 2) * 8), z: -40 + i * 16, h: 13 + (i % 3) * 2, k: i + 3, slim: i % 2 === 0 }); trees(tr); }
  skyline(1, HPX - 420, 250, HPX + 420, 250, 100, [1, 0.95, 0.9], 2); hills(HPX, 0, [0.8, 0.86, 1]);
  B.build(Gp);
  void [quad, Quads];
}
