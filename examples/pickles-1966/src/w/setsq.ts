// Realistic sets, part 1: shared materials, today's stadium, and calle de Alcalá in 1902 with the cloth shop.
// Same layout and coordinates as the first (toon) version, so cameras and staging are unchanged; every surface is now
// a physically based material and the detail is real geometry (terraces, trusses, windows, balconies, shop fittings).
import * as THREE from "three";
import { NOINK } from "./ink";
import { lam, add, ground, wall } from "./kit";
import * as P from "./paintj";
import * as Q from "./paintk";
import * as T from "./paintr";
import * as S from "./pbr";
import { wmat, pmat, Batch, makeGrass, makeTrees, makeCrowd, makeCup, Grass, Crowd, Spot, TreeSpec } from "./real";
import { fan, towns } from "./castr";

export const SX = 3000, IX = 6000, BX = IX + 30, MX = IX + 60, FX = 9000, LX = 12000, HPX = 15000;
export const PL = 52.5, PW = 34, HL = 50, HW = 32;
export const SEATS = { z0: 43, y0: 1.74, dy: 0.544, rows: 5 };
export const LAMP_MATS: THREE.MeshBasicMaterial[] = [];
export const hot = (c: [number, number, number]) => { const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(...c) }); LAMP_MATS.push(m); (m.userData as { hot: [number, number, number] }).hot = c; return m; };
export const glow = (Gp: THREE.Object3D, g: THREE.BufferGeometry, c: [number, number, number]) => { const m = new THREE.Mesh(g, hot(c)); m.layers.set(NOINK); Gp.add(m); return m; };
export const tiled = (t: THREE.Texture, x: number, y: number) => { const c = t.clone(); c.wrapS = c.wrapT = THREE.RepeatWrapping; c.repeat.set(x, y); c.anisotropy = 8; c.needsUpdate = true; return c; };
export const quad = (a: number[], b: number[], c: number[], d: number[], tu = 1, tv = 1, u0 = 0) => {
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute([...a, ...b, ...c, ...d], 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute([u0, 0, u0 + tu, 0, u0 + tu, tv, u0, tv], 2)); g.setIndex([0, 1, 2, 0, 2, 3]); g.computeVertexNormals(); return g;
};
export const tri = (a: number[], b: number[], c: number[]) => { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute([...a, ...b, ...c], 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 1, 0, 0.5, 1], 2)); g.setIndex([0, 1, 2]); g.computeVertexNormals(); return g; };
const ringG = (r0: number, r1: number, x: number, y: number, z: number) => { const g = new THREE.RingGeometry(r0, r1, 64); g.rotateX(-Math.PI / 2); g.translate(x, y, z); return g; };
/** many quads in one geometry */
export class Quads { p: number[] = []; i: number[] = []; add(a: number[], b: number[], c: number[], d: number[]) { const n = this.p.length / 3; this.p.push(...a, ...b, ...c, ...d); this.i.push(n, n + 1, n + 2, n, n + 2, n + 3); }
  geo() { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(this.p, 3)); g.setIndex(this.i); g.computeVertexNormals(); return g; } }

export type Tint = { m: THREE.MeshBasicMaterial; day: [number, number, number]; golden: [number, number, number]; night: [number, number, number] };
export type Refs = {
  tints: Tint[]; crowds: THREE.Texture[]; flags: THREE.Object3D[]; crowns: THREE.Object3D[];
  stadium: THREE.Group; street: THREE.Group; shop: THREE.Group; field: THREE.Group; london: THREE.Group; hipo: THREE.Group;
  tram: THREE.Group; cloth: THREE.Object3D; cups: THREE.Group; deed: THREE.Object3D; sagBall: THREE.Object3D;
  grass: { place: string; g: Grass }[]; people: { place: string; c: Crowd }[];
};
export const newRefs = (): Refs => ({ tints: [], crowds: [], flags: [], crowns: [], stadium: new THREE.Group(), street: new THREE.Group(), shop: new THREE.Group(), field: new THREE.Group(), london: new THREE.Group(), hipo: new THREE.Group(),
  tram: new THREE.Group(), cloth: new THREE.Group(), cups: new THREE.Group(), deed: new THREE.Group(), sagBall: new THREE.Group(), grass: [], people: [] });

// ---------------- shared materials ----------------
export const M = {
  stucco: (c: string) => wmat("stucco" + c, S.stucco(), 4, { color: c }),
  stone: (c = "#d9d0c0") => wmat("stone" + c, S.concrete(), 3, { color: c, roughness: 0.9 }),
  conc: (c = "#aab0b8") => wmat("conc" + c, S.concrete(), 3, { color: c }),
  brick: () => wmat("brick", S.brick(), 2),
  brickD: () => wmat("brickD", S.brick("brickD", [[122, 78, 66], [108, 68, 58], [134, 88, 72], [98, 62, 56]]), 2),
  tile: () => wmat("pantile", S.pantile(), 2),
  slate: () => wmat("slate", S.slate(), 2),
  wood: (c: string, tile = 1.2) => wmat("wood" + c + tile, S.boards("wood", 5, 0.62), tile, { color: c }),
  floor: (c: string) => wmat("floor" + c, S.boards("floor", 7, 0.36), 1.3, { color: c }),
  paint: (c: string, rough = 0.45) => wmat("paint" + c + rough, S.boards("paintw", 4, rough, 0), 1.6, { color: c }),
  cloth: (c: string) => wmat("cloth" + c, S.weave(), 0.22, { color: c }),
  clothI: () => wmat("clothI", S.weave(), 0.22, {}),
  felt: (c: string) => wmat("felt" + c, S.felt(), 0.3, { color: c }),
  earth: () => wmat("earth", S.earth(), 4),
  setts: () => wmat("setts", S.setts(), 2),
  flags: () => wmat("flags", S.flags(), 3),
  leather: (c: string) => wmat("leather" + c, S.leather(), 0.3, { color: c }),
  metal: (c: string, rough = 0.35) => wmat("metal" + c + rough, S.brushed(), 0.5, { color: c, metalness: 1, roughness: rough }),
  iron: () => pmat("#1c1c22", 0.5, 0.7),
  brass: () => wmat("brass", S.brushed(), 0.4, { color: "#d9a94a", metalness: 1 }),
  glass: () => pmat("#18222e", 0.06, 0.2),
  white: () => pmat("#f4f2ea", 0.5),
  bark: () => wmat("bark", S.boards("bark", 9, 0.9), 0.8, { color: "#6a5240" }),
  line: () => lam("qLine", () => ({ color: "#f2f2ea", roughness: 0.95, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 })),
};
const PEN = ["#e2453c", "#f6c419", "#3f8fc9", "#fbfaf2", "#57a05a", "#f29a2e"];
/** makers shared by the sets (each bound to one group) */
export const kit = (Gp: THREE.Group, refs: Refs) => {
  const A = (g: THREE.BufferGeometry, m: THREE.Material, cast = false) => add(Gp, g, m, cast);
  /** a pennant on a pole; it sways (refs.flags) */
  const pennant = (x: number, y: number, z: number, h: number, w: number, c: string, ry = 0) => { const pole = new THREE.CylinderGeometry(0.05, 0.07, h, 8); pole.translate(x, y + h / 2, z); A(pole, M.white(), true);
    const F = new THREE.Group(); F.position.set(x, y + h - w * 0.36, z); F.rotation.y = ry; Gp.add(F); refs.flags.push(F); add(F, tri([0, w * 0.3, 0], [0, -w * 0.3, 0], [w, 0, 0]), lam("qPen" + c, () => ({ color: c, side: THREE.DoubleSide, roughness: 0.9 })), true); return F; };
  /** pitch markings for a pitch centred on cx */
  const marks = (cx: number, L: number, Wd: number, w = 0.14) => { const y = 0.014, G = (x0: number, x1: number, z0: number, z1: number) => A(ground(cx + x0, cx + x1, z0, z1, y), M.line());
    G(-L - w / 2, L + w / 2, -Wd - w / 2, -Wd + w / 2); G(-L - w / 2, L + w / 2, Wd - w / 2, Wd + w / 2); for (const x of [-L, 0, L]) G(x - w / 2, x + w / 2, -Wd, Wd);
    A(ringG(9.15 - w / 2, 9.15 + w / 2, cx, y, 0), M.line()); A(ringG(0, 0.22, cx, y, 0), M.line());
    for (const sd of [-1, 1]) { for (const [d, hw] of [[16.5, 20.16], [5.5, 9.16]]) { G(Math.min(sd * L, sd * (L - d)), Math.max(sd * L, sd * (L - d)), -hw - w / 2, -hw + w / 2); G(Math.min(sd * L, sd * (L - d)), Math.max(sd * L, sd * (L - d)), hw - w / 2, hw + w / 2); G(sd * (L - d) - w / 2, sd * (L - d) + w / 2, -hw, hw); }
      A(ringG(0, 0.2, cx + sd * (L - 11), y, 0), M.line()); } };
  /** a goal on the line x with its net (sd = +1: the net goes towards +x) */
  const goal = (x: number, sd: number, wood = false) => { const pm = wood ? M.paint("#f4f2ea", 0.55) : pmat("#f6f6f2", 0.25, 0.1), r = wood ? 0.07 : 0.06, B = new Batch();
    for (const z of [-3.66, 3.66]) B.cyl(pm, x, 1.22, z, r, 2.44); B.cyl(pm, x, 2.44, 0, r, 7.44, undefined, [Math.PI / 2, 0, 0]);
    const d = 2.0 * sd; for (const z of [-3.66, 3.66]) { B.rod(pm, [x + d * 0.4, 2.44, z], [x + d, 0, z], 0.03); B.rod(pm, [x, 2.44, z], [x + d * 0.4, 2.44, z], 0.03); B.rod(pm, [x + d, 0.03, z], [x, 0.03, z], 0.025); } B.rod(pm, [x + d, 0.03, -3.66], [x + d, 0.03, 3.66], 0.025); B.rod(pm, [x + d * 0.4, 2.44, -3.66], [x + d * 0.4, 2.44, 3.66], 0.03); B.build(Gp);
    const nt = (rx: number, ry: number) => { const k = "qNet" + rx + "|" + ry; return NETS.get(k) ?? (NETS.set(k, new THREE.MeshBasicMaterial({ map: tiled(T.netTex(), rx, ry), alphaTest: 0.35, side: THREE.DoubleSide, color: new THREE.Color(0.92, 0.92, 0.92) })), NETS.get(k)!); };
    A(quad([x + d, 0, -3.66], [x + d, 0, 3.66], [x + d * 0.4, 2.44, 3.66], [x + d * 0.4, 2.44, -3.66]), nt(5, 2)); A(quad([x, 2.44, -3.66], [x, 2.44, 3.66], [x + d * 0.4, 2.44, 3.66], [x + d * 0.4, 2.44, -3.66]), nt(5, 0.6));
    for (const z of [-3.66, 3.66]) A(quad([x, 0, z], [x + d, 0, z], [x + d * 0.4, 2.44, z], [x, 2.44, z]), nt(1.4, 2)); };
  /** a cast-iron gas lamp with a glowing lantern */
  const gasLamp = (B: Batch, x: number, z: number, h = 4.2, y = 0) => { const I = M.iron(); B.cyl(I, x, y + h / 2, z, 0.055, h); B.cyl(I, x, y + 0.25, z, 0.13, 0.5); B.cyl(I, x, y + 0.9, z, 0.085, 0.12); B.cyl(I, x, y + h * 0.8, z, 0.07, 0.1); B.box(I, x - 0.42, y + h * 0.86, z - 0.02, x + 0.42, y + h * 0.89, z + 0.02);
    B.cyl(I, x, y + h + 0.02, z, 0.16, 0.05); B.cyl(I, x, y + h + 0.58, z, 0.2, 0.05); const cp = new THREE.ConeGeometry(0.26, 0.24, 6); cp.translate(x, y + h + 0.73, z); A(cp, I, true);
    const gl = new THREE.CylinderGeometry(0.19, 0.12, 0.5, 6); gl.translate(x, y + h + 0.3, z); glow(Gp, gl, [2.6, 2.1, 1.2]); };
  const hills = (cx: number, cz: number, tint: [number, number, number]) => { const m = new THREE.MeshBasicMaterial({ map: tiled(P.hillsTex(), 1.4, 1), alphaTest: 0.5, side: THREE.BackSide, fog: true });
    const c = new THREE.Mesh(new THREE.CylinderGeometry(430, 430, 110, 64, 1, true), m); c.position.set(cx, 50, cz); c.layers.set(NOINK); Gp.add(c); refs.tints.push({ m, day: tint, golden: [1.1 * tint[0], 0.82 * tint[1], 0.66 * tint[2]], night: [0.3, 0.38, 0.7] }); };
  const skyline = (k: number, x0: number, z0: number, x1: number, z1: number, h: number, tint: [number, number, number] = [1, 1, 1], tu = 1) => { const m = new THREE.MeshBasicMaterial({ map: tiled(T.skylineTex(k), tu, 1), transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, fog: true });
    const w = new THREE.Mesh(wall(x0, z0, x1, z1, 0, h), m); w.layers.set(NOINK); Gp.add(w); refs.tints.push({ m, day: tint, golden: [1.1 * tint[0], 0.85 * tint[1], 0.7 * tint[2]], night: [0.3, 0.38, 0.7] }); };
  const grass = (place: string, n: number, R: number, o: Parameters<typeof makeGrass>[2]) => { const g = makeGrass(n, R, o); Gp.add(g.mesh); refs.grass.push({ place, g }); return g; };
  const people = (place: string, cast: Parameters<typeof makeCrowd>[0], poses: Parameters<typeof makeCrowd>[1], spots: Spot[]) => { const c = makeCrowd(cast, poses, spots); Gp.add(c.mesh); refs.people.push({ place, c }); return c; };
  const trees = (specs: TreeSpec[], greens?: string[]) => makeTrees(Gp, specs, M.bark(), greens);
  return { A, pennant, marks, goal, gasLamp, hills, skyline, grass, people, trees };
};
const NETS = new Map<string, THREE.MeshBasicMaterial>();
export { PEN };

// ---------------- today's stadium ----------------
export function buildStadium(R: THREE.Object3D, refs: Refs) {
  const Gp = refs.stadium; R.add(Gp); const { A, marks, goal, grass, people } = kit(Gp, refs), B = new Batch();
  // the pitch: mown bands, the lines, blades of grass round the camera
  A(ground(-75, 75, -52, 52, 0), wmat("turfS", S.turf("turfS", 1), 11));
  marks(0, PL, PW); goal(-PL, -1); goal(PL, 1);
  grass("stadium", 110000, 15, { h0: 0.035, h1: 0.075, w: 0.014, base: ["#2f6a26", "#356f2a"], tip: ["#5fae42", "#6cba4a", "#58a63e"], stripe: 11, lean: 0.5 });
  // LED boards round the pitch and the apron behind them
  const led = (n: number) => { const k = "qLed" + n; let m = LEDS.get(k); if (!m) { m = new THREE.MeshBasicMaterial({ map: tiled(T.boardTex(), n, 1), side: THREE.DoubleSide, color: new THREE.Color(1.5, 1.5, 1.6) }); LEDS.set(k, m); } return m; };
  for (const [a, b, c, d, n] of [[-58, -38.5, 58, -38.5, 10], [58, 38.5, -58, 38.5, 10], [-58, 38.5, -58, -38.5, 6], [58, -38.5, 58, 38.5, 6]] as number[][]) { const w = new THREE.Mesh(wall(a, b, c, d, 0.05, 1.0, n, 1), led(n)); w.layers.set(NOINK); Gp.add(w); }
  B.box(pmat("#16181e", 0.5), -58.1, 0, -38.7, 58.1, 0.06, -38.5).box(pmat("#16181e", 0.5), -58.1, 0, 38.5, 58.1, 0.06, 38.7);
  A(ground(-64, 64, -44, -38.6, 0.01), M.conc("#5a6470")); A(ground(-64, 64, 38.6, 44, 0.01), M.conc("#5a6470")); A(ground(-64, -58.1, -38.6, 38.6, 0.01), M.conc("#5a6470")); A(ground(58.1, 64, -38.6, 38.6, 0.01), M.conc("#5a6470"));
  // the bowl: a rounded rectangle resampled evenly along its edge
  const N = 72, fine: number[][] = [], A0 = 61, B0 = 41;
  for (let i = 0; i <= 720; i++) { const a = (i / 720) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a); fine.push([Math.sign(c) * Math.sqrt(Math.abs(c)), Math.sign(s) * Math.sqrt(Math.abs(s))]); }
  const len: number[] = [0]; for (let i = 1; i <= 720; i++) len.push(len[i - 1] + Math.hypot((fine[i][0] - fine[i - 1][0]) * (A0 + 10), (fine[i][1] - fine[i - 1][1]) * (B0 + 10)));
  const U: number[][] = []; { let j = 0; for (let i = 0; i <= N; i++) { const t = (i / N) * len[720]; while (j < 719 && len[j + 1] < t) j++; const k = (t - len[j]) / Math.max(1e-6, len[j + 1] - len[j]); U.push([fine[j][0] + (fine[j + 1][0] - fine[j][0]) * k, fine[j][1] + (fine[j + 1][1] - fine[j][1]) * k]); } }
  const p = (i: number, off: number, y: number) => [U[i][0] * (A0 + off), y, U[i][1] * (B0 + off)];
  const pm = (i: number, t: number, off: number, y: number) => { const a = p(i, off, y), b = p(i + 1, off, y); return [a[0] + (b[0] - a[0]) * t, y, a[2] + (b[2] - a[2]) * t]; };
  // terraces: real steps (concrete treads, risers in the colour of the seats), a spectator on every seat
  const treads = new Quads(), risers = new Quads(), walls = new Quads(), dark = new Quads(), skin = new Quads(), spots: Spot[] = [];
  const TIERS = [{ o0: 2, y0: 1.2, rows: 18, run: 1.0, rise: 0.544 }, { o0: 18.5, y0: 15.5, rows: 21, run: 1.02, rise: 0.93 }];
  for (let i = 0; i < N; i++) { const j = i + 1, wdt = Math.hypot(p(j, 10, 0)[0] - p(i, 10, 0)[0], p(j, 10, 0)[2] - p(i, 10, 0)[2]);
    TIERS.forEach((tr, ti) => { for (let r = 0; r < tr.rows; r++) { const o = tr.o0 + r * tr.run, y = tr.y0 + r * tr.rise;
        treads.add(p(j, o, y), p(i, o, y), p(i, o + tr.run, y), p(j, o + tr.run, y)); risers.add(p(j, o + tr.run, y), p(i, o + tr.run, y), p(i, o + tr.run, y + tr.rise), p(j, o + tr.run, y + tr.rise));
        const ns = Math.max(2, Math.round(wdt / 0.56)); for (let s = 0; s < ns; s++) { const q = pm(i, (s + 0.5) / ns, o + 0.55, y), h = S.hash(i * 97 + s, r + ti * 31, 3); if (h < 0.05) continue; if (ti === 0 && r < 7 && q[2] > 0 && Math.abs(q[0]) < 10) continue;
          spots.push({ x: q[0], y: q[1], z: q[2], k: Math.floor(S.hash(i * 97 + s, r + ti * 31, 4) * 40), ph: S.hash(i * 97 + s, r + ti * 31, 5), s: 0.74 }); } }
      walls.add(p(j, tr.o0, tr.y0 - (ti ? 4.5 : 1.2)), p(i, tr.o0, tr.y0 - (ti ? 4.5 : 1.2)), p(i, tr.o0, tr.y0 + 0.9), p(j, tr.o0, tr.y0 + 0.9)); });
    dark.add(p(j, 20, 11), p(i, 20, 11), p(i, 18.5, 11), p(j, 18.5, 11)); dark.add(p(j, 40, 35), p(i, 40, 35), p(i, 40, 47), p(j, 40, 47));
    skin.add(p(j, 5, 42.6), p(i, 5, 42.6), p(i, 44, 47.4), p(j, 44, 47.4));
    // the ring of boxes between the tiers, lit from inside; the ribbon of light on the parapet
    glow(Gp, quad(p(j, 18.45, 12.0), p(i, 18.45, 12.0), p(i, 18.45, 13.9), p(j, 18.45, 13.9)), i % 3 === 1 ? [1.4, 1.5, 2.0] : [2.2, 1.9, 1.4]);
    glow(Gp, quad(p(j, 18.4, 14.9), p(i, 18.4, 14.9), p(i, 18.4, 15.25), p(j, 18.4, 15.25)), [1.6, 1.7, 2.6]);
    // roof trusses and the floodlights along the inner edge
    const st = M.metal("#c9d2de", 0.45); B.rod(st, p(i, 40.2, 34), p(i, 40.2, 47.4), 0.3); B.rod(st, p(i, 40.2, 47.2), p(i, 5, 43.0), 0.22); B.rod(st, p(i, 40.2, 42), p(i, 5, 42.5), 0.16);
    for (let k = 1; k < 5; k++) { const o1 = 40 - k * 7, o0 = 40 - (k - 1) * 7, ya = (o: number) => 47.4 - (40.2 - o) * (4.4 / 35.2), yb = (o: number) => 42 + (40.2 - o) * (0.5 / 35.2); B.rod(st, [...p(i, o0, yb(o0))], [...p(i, o1, ya(o1))], 0.09); B.rod(st, [...p(i, o1, ya(o1))], [...p(i, o1, yb(o1))], 0.08); }
    for (const o of [5, 16, 28, 40]) B.rod(st, p(i, o, 47.4 - (40.2 - o) * (4.4 / 35.2)), p(j, o, 47.4 - (40.2 - o) * (4.4 / 35.2)), 0.1);
    glow(Gp, quad(p(j, 5.2, 42.1), p(i, 5.2, 42.1), p(i, 7.6, 42.35), p(j, 7.6, 42.35)), [6, 6, 5.6]);
  }
  A(treads.geo(), M.conc("#8f96a0")); A(risers.geo(), pmat("#2a56b4", 0.4)); A(walls.geo(), M.conc("#c4cad2")); A(dark.geo(), pmat("#141a2a", 0.7, 0, { side: THREE.DoubleSide }));
  A(skin.geo(), lam("qRoofSkin", () => ({ color: "#e8eef6", side: THREE.DoubleSide, roughness: 0.6, emissive: "#2a3550", emissiveIntensity: 0.5 })));
  people("stadium", Array.from({ length: 40 }, (_, i) => fan(i)), [{ facing: 0, expr: "smile" }, { facing: 0, expr: "laugh", armL: "up", armR: "up" }], spots);
  // the block of real seats at the front of the south stand, for the close shots: tip-up seats, a glass front, banners
  { const { z0, y0, dy, rows } = SEATS, blue = pmat("#2456b8", 0.32), steel = M.metal("#c9d2de", 0.3), cc = M.conc("#9aa1aa"), navy = pmat("#1f2f5c", 0.6);
    B.box(navy, -9.6, 0, z0 - 1.6, 9.6, y0 - 0.5, z0 - 0.5);
    for (let r = 0; r < rows + 2; r++) { const y = y0 + r * dy, z = z0 + r; B.box(cc, -9.6, 0, z - 0.5, 9.6, y, z + 0.5);
      for (let x = -9.2; x < 9.3; x += 0.5) { if (r >= rows) continue; B.box(blue, x - 0.21, y + 0.4, z + 0.3, x + 0.21, y + 0.95, z + 0.36, undefined, [-0.12, 0, 0]); B.box(blue, x - 0.21, y + 0.4, z - 0.08, x + 0.21, y + 0.46, z + 0.3); B.box(steel, x - 0.24, y, z + 0.3, x - 0.22, y + 0.42, z + 0.34); } }
    for (const x of [-9.6, 9.6]) for (let r = 0; r < rows + 2; r++) B.box(M.conc("#c4cad2"), x - 0.7, 0, z0 + r - 0.5, x + 0.7, y0 + r * dy - 0.27, z0 + r + 0.5);
    // glass balustrade on steel posts, cloth banners hung over it
    const glassT = lam("qGlassT", () => ({ color: "#bcd8ea", transparent: true, opacity: 0.28, roughness: 0.05, metalness: 0.1 }));
    A(new THREE.BoxGeometry(19.2, 0.62, 0.03).translate(0, y0 - 0.1, z0 - 0.56), glassT); B.box(steel, -9.6, y0 + 0.2, z0 - 0.6, 9.6, y0 + 0.25, z0 - 0.52); for (let x = -9.6; x <= 9.61; x += 1.92) B.box(steel, x - 0.03, y0 - 0.5, z0 - 0.6, x + 0.03, y0 + 0.22, z0 - 0.52);
    ["#f4f2ea", "#6a4c9a", "#f4f2ea", "#e8c45a", "#f4f2ea", "#1f2f5c", "#f4f2ea", "#6a4c9a", "#f4f2ea", "#e8c45a"].forEach((c, i) => { const x = -8.3 + i * 1.84; B.box(M.cloth(c), x - 0.7, y0 - 0.5, z0 - 0.64, x + 0.7, y0 + 0.12, z0 - 0.615); if (c === "#f4f2ea") B.box(M.cloth(i % 4 ? "#1f2f5c" : "#e8c45a"), x - 0.7, y0 - 0.26, z0 - 0.645, x + 0.7, y0 - 0.14, z0 - 0.64); });
    glow(Gp, new THREE.BoxGeometry(19.2, 0.22, 0.02).translate(0, 0.4, z0 - 1.61), [2.2, 2.2, 2.6]);
  }
  // the long table of cups on the grass: a white podium, a navy cloth, a carpet
  { const C = refs.cups; Gp.add(C); const b = new Batch(); { const silver = pmat("#f4f6fa", 0.16, 1, { envMapIntensity: 3.2 }); for (let i = 0; i < 15; i++) { const c = makeCup(silver); c.position.set(-9.8 + i * 1.4, 0.57, 0); c.scale.setScalar(1.05); C.add(c); } }
    b.box(pmat("#f4f4f0", 0.35), -10.5, 0, -0.7, 10.5, 0.5, 0.7).box(M.cloth("#1f2f5c"), -10.6, 0.5, -0.8, 10.6, 0.57, 0.8).box(M.brass(), -10.52, 0.2, 0.7, 10.52, 0.3, 0.72).box(pmat("#e9eef4", 0.4), -10.4, 0, -2.6, 10.4, 0.32, -1.5).box(M.felt("#1f2f5c"), -11.6, 0, -1.9, 11.6, 0.03, 1.9); b.build(C); }
  B.build(Gp);
}
const LEDS = new Map<string, THREE.MeshBasicMaterial>();

// ---------------- calle de Alcalá, 1902 ----------------
const HOUSE = ["#e9d2b0", "#f1e2c4", "#e2b89a", "#f4e9d2", "#d9c2a0", "#ead7c0", "#e6c4a8", "#dfd3bd", "#f0d9b8", "#d8b8a0"];
const SHUT = ["#3f6a52", "#6a4a3a", "#3a5a7a", "#7a3a2a", "#4a4a44"];
export function buildStreet(R: THREE.Object3D, refs: Refs) {
  const Gp = refs.street; R.add(Gp); const { A, gasLamp, pennant, trees } = kit(Gp, refs), B = new Batch();
  // roadway of setts with the tram rails let into it, kerbs, flagged pavements
  A(ground(SX - 260, SX + 260, -7, 7, 0), M.setts());
  for (const z of [-2.3, -0.9, 0.9, 2.3]) B.box(M.metal("#8a8f98", 0.3), SX - 260, 0, z - 0.035, SX + 260, 0.012, z + 0.035);
  for (const sd of [-1, 1]) { B.box(M.flags(), SX - 260, 0, sd > 0 ? 7.2 : -12, SX + 120, 0.16, sd > 0 ? 12 : -7.2); B.box(M.stone("#b9b3a8"), SX - 260, 0, sd > 0 ? 7 : -7.2, SX + 120, 0.17, sd > 0 ? 7.2 : -7); }
  A(ground(SX + 120, SX + 320, -90, 90, 0.004), M.flags()); A(ground(SX - 260, SX + 120, -90, -12, 0.002), M.flags()); A(ground(SX - 260, SX + 120, 12, 90, 0.002), M.flags());
  // the houses: real window openings, French windows with iron balconies, shutters, cornices, slate mansards with dormers
  const glass = M.glass(), ironM = M.iron(), stone = M.stone("#efe6d6");
  const house = (cx: number, w: number, floors: number, k: number, sd: number, shop = false) => {
    const z = sd * 12, x0 = cx - w / 2, x1 = cx + w / 2, h = 5.2 + floors * 4, col = HOUSE[(k * 3 + (sd > 0 ? 1 : 0)) % HOUSE.length], st = M.stucco("#ffffff"), bays = Math.round(w / 3), bw = w / bays, zo = (d: number) => z - sd * d, zi = (d: number) => z + sd * d;
    const bx = (m: THREE.Material, xa: number, ya: number, za: number, xb: number, yb: number, zb: number, c?: string) => B.box(m, xa, ya, Math.min(za, zb), xb, yb, Math.max(za, zb), c);
    // the block behind and the party walls
    bx(st, x0, 0, zi(0.6), x1, h, zi(14), col);
    for (let f = 0; f < floors; f++) { const y = 5.2 + f * 4;
      for (let b = 0; b < bays; b++) { const xa = x0 + b * bw, wm = bw / 2 - 0.72, sh = SHUT[(k + b + f) % 5], open = S.hash(k * 13 + b, f, 3);
        bx(st, xa, y, z, xa + wm, y + 4, zi(0.6), col); bx(st, xa + bw - wm, y, z, xa + bw, y + 4, zi(0.6), col); bx(st, xa + wm, y + 3.1, z, xa + bw - wm, y + 4, zi(0.6), col); bx(st, xa + wm, y, z, xa + bw - wm, y + 0.32, zi(0.6), col);
        // the French window: glass set back in the reveal, a white frame, a transom, a curtain behind
        bx(glass, xa + wm, y + 0.32, zi(0.36), xa + bw - wm, y + 3.1, zi(0.4)); const wf = M.white();
        bx(wf, xa + wm, y + 0.32, zi(0.3), xa + wm + 0.07, y + 3.1, zi(0.36)); bx(wf, xa + bw - wm - 0.07, y + 0.32, zi(0.3), xa + bw - wm, y + 3.1, zi(0.36)); bx(wf, xa + bw / 2 - 0.035, y + 0.32, zi(0.3), xa + bw / 2 + 0.035, y + 2.5, zi(0.36)); bx(wf, xa + wm, y + 2.46, zi(0.3), xa + bw - wm, y + 2.54, zi(0.36)); bx(wf, xa + wm, y + 3.03, zi(0.3), xa + bw - wm, y + 3.1, zi(0.36));
        if (open < 0.45) bx(M.cloth("#f4f0e4"), xa + wm + 0.08, y + 1.3 + open, zi(0.31), xa + bw - wm - 0.08, y + 3.0, zi(0.33));
        // stone surround and a little cornice over it
        bx(stone, xa + wm - 0.16, y + 0.32, zo(0.05), xa + wm, y + 3.26, zi(0.1)); bx(stone, xa + bw - wm, y + 0.32, zo(0.05), xa + bw - wm + 0.16, y + 3.26, zi(0.1)); bx(stone, xa + wm - 0.22, y + 3.2, zo(0.14), xa + bw - wm + 0.22, y + 3.38, zi(0.1));
        // louvred shutters folded back against the wall
        if (open > 0.25) for (const s of [-1, 1]) { const xs = s < 0 ? xa + wm - 0.62 : xa + bw - wm + 0.18; bx(M.paint(sh, 0.6), xs, y + 0.36, zo(0.07), xs + 0.44, y + 3.1, z, undefined); }
        // the balcony: a stone slab on brackets, an iron railing with balusters
        bx(stone, xa + wm - 0.35, y + 0.18, zo(0.62), xa + bw - wm + 0.35, y + 0.32, z); for (const s of [0.1, 0.9]) bx(stone, xa + wm - 0.3 + s * (bw - 2 * wm + 0.48), y - 0.1, zo(0.5), xa + wm - 0.18 + s * (bw - 2 * wm + 0.48), y + 0.18, z);
        const ra = xa + wm - 0.32, rb = xa + bw - wm + 0.32; bx(ironM, ra, y + 1.28, zo(0.6), rb, y + 1.33, zo(0.56)); bx(ironM, ra, y + 0.42, zo(0.6), rb, y + 0.45, zo(0.57));
        for (let q = 0; q <= 12; q++) { const xq = ra + ((rb - ra) * q) / 12; bx(ironM, xq - 0.012, y + 0.32, zo(0.59), xq + 0.012, y + 1.3, zo(0.57)); }
        for (const xe of [ra, rb]) bx(ironM, xe - 0.015, y + 0.32, zo(0.6), xe + 0.015, y + 1.3, z);
        if (S.hash(k + b * 7, f, 9) < 0.35) for (let q = 0; q < 3; q++) { B.cyl(pmat("#b5563a", 0.9), ra + 0.3 + q * 0.55, y + 0.44, zo(0.42), 0.1, 0.2); B.sph(pmat(["#4f8a3a", "#5f9e42"][q % 2], 0.9), ra + 0.3 + q * 0.55, y + 0.66, zo(0.42), 0.17, 0.15, 0.17); B.sph(pmat(["#e2453c", "#f25c7a", "#f6c419"][(q + b) % 3], 0.8), ra + 0.34 + q * 0.55, y + 0.76, zo(0.47), 0.06); }
      }
      bx(stone, x0 - 0.05, y - 0.14, zo(0.16), x1 + 0.05, y + 0.02, z);   // string course
    }
    // rusticated corner strips, the main cornice with its modillions
    for (const xe of [x0, x1 - 0.5]) for (let y = 5.3; y < h - 0.5; y += 0.8) bx(stone, xe, y, zo(0.07), xe + 0.5, y + 0.62, z);
    bx(stone, x0 - 0.25, h - 0.3, zo(0.7), x1 + 0.25, h + 0.12, z); bx(stone, x0 - 0.15, h - 0.62, zo(0.4), x1 + 0.15, h - 0.3, z); for (let x = x0 + 0.2; x < x1; x += 0.75) bx(stone, x, h - 0.6, zo(0.62), x + 0.22, h - 0.3, zo(0.38));
    // the mansard, its dormers and chimneys
    B.slab(M.slate(), cx, h + 1.55, zi(0.95), w, 0.14, 3.6, [sd * -1.05, 0, 0]); bx(M.slate(), x0, h + 3.1, zi(1.8), x1, h + 3.24, zi(9));
    for (let b = 0; b < bays; b += 1) { if ((b + k) % 2) continue; const xd = x0 + (b + 0.5) * bw; bx(stone, xd - 0.65, h + 0.5, zi(0.25), xd + 0.65, h + 2.2, zi(1.5)); bx(glass, xd - 0.42, h + 0.75, zi(0.21), xd + 0.42, h + 1.9, zi(0.26)); bx(wf2, xd - 0.03, h + 0.75, zi(0.19), xd + 0.03, h + 1.9, zi(0.22)); B.slab(M.slate(), xd, h + 2.42, zi(0.9), 1.6, 0.1, 1.5, [0, 0, 0]); }
    for (let x = x0 + 2.2; x < x1 - 1; x += 6.5) { bx(M.brick(), x - 0.55, h + 2, zi(4), x + 0.55, h + 5.4, zi(4.9)); bx(stone, x - 0.62, h + 5.4, zi(3.93), x + 0.62, h + 5.56, zi(4.97)); for (const dx of [-0.28, 0.28]) B.cyl(pmat("#b5563a", 0.9), x + dx, h + 5.9, zi(4.45), 0.14, 0.7); }
    if (k % 3 === 0 && !shop) { const dx = k % 2 ? x0 + 2.8 : x1 - 2.8, dz = zi(2.8); B.cyl(stone, dx, h + 4.2, dz, 2.5, 3.4); B.sph(M.slate(), dx, h + 5.9, dz, 2.7, 3.0, 2.7); B.cyl(stone, dx, h + 9.4, dz, 0.55, 1.4); B.cyl(M.slate(), dx, h + 10.9, dz, 0.5, 1.8, undefined, undefined, 0.5); B.sph(M.brass(), dx, h + 12, dz, 0.22); for (let q = 0; q < 8; q++) { const a = q * 0.785; bx(glass, dx + 2.5 * Math.cos(a) - 0.3, h + 3.2, dz + 2.5 * Math.sin(a) - 0.05, dx + 2.5 * Math.cos(a) + 0.3, h + 5.2, dz + 2.5 * Math.sin(a) + 0.05); } }
    if (shop) return;
    // ground floor: shops with timber fronts, plate glass, lit interiors, striped awnings; a carriage door now and then
    bx(stone, x0, 4.7, zo(0.12), x1, 5.2, zi(0.6)); const nb = Math.round(w / 6), sw = w / nb;
    for (let b = 0; b < nb; b++) { const xa = x0 + b * sw, fc = ["#5a2630", "#1f2f4c", "#3a2a20", "#2f4a3a", "#6a3e22", "#22323a"][(k * 2 + b) % 6], fm = M.paint(fc, 0.42), aw = ["#b8362e", "#2f6a4a", "#1f2f5c", "#c97a42", "#7a2630"][(k + b * 3) % 5];
      bx(st, xa, 0, z, xa + 0.5, 4.7, zi(0.6), col); bx(st, xa + sw - 0.5, 0, z, xa + sw, 4.7, zi(0.6), col); bx(stone, xa, 0, zo(0.04), xa + 0.5, 0.7, z); bx(stone, xa + sw - 0.5, 0, zo(0.04), xa + sw, 0.7, z);
      if ((b + k) % 4 === 3) { // a carriage door under a stone arch
        bx(M.wood("#5a3a22"), xa + 0.9, 0, zi(0.3), xa + sw - 0.9, 3.9, zi(0.42)); bx(stone, xa + 0.5, 3.9, z, xa + sw - 0.5, 4.7, zi(0.6)); bx(stone, xa + 0.5, 0, z, xa + 0.9, 3.9, zi(0.6)); bx(stone, xa + sw - 0.9, 0, z, xa + sw - 0.5, 3.9, zi(0.6)); for (let q = 0; q < 2; q++) for (let r = 0; r < 3; r++) bx(M.wood("#4a2e1a"), xa + 1.1 + q * (sw - 2.2) / 2 + 0.1, 0.3 + r * 1.2, zi(0.26), xa + 1.1 + (q + 1) * (sw - 2.2) / 2 - 0.1, 1.3 + r * 1.2, zi(0.3)); continue; }
      bx(fm, xa + 0.5, 0, zo(0.06), xa + sw - 0.5, 0.75, zi(0.3)); bx(fm, xa + 0.5, 3.6, zo(0.1), xa + sw - 0.5, 4.7, zi(0.3)); bx(M.brass(), xa + 0.7, 3.78, zo(0.12), xa + sw - 0.7, 3.84, zo(0.1)); bx(M.brass(), xa + 0.7, 4.46, zo(0.12), xa + sw - 0.7, 4.52, zo(0.1));
      for (const xp of [xa + 0.5, xa + sw - 0.72, xa + sw * 0.62]) bx(fm, xp, 0.75, zo(0.08), xp + 0.22, 3.6, zi(0.3));
      // plate glass with the goods behind it, lit warm; the shop door
      A(new THREE.BoxGeometry(sw * 0.62 - 0.72, 2.85, 0.03).translate(xa + 0.72 + (sw * 0.62 - 0.72) / 2, 2.175, zi(0.12)), lam("qShopGlass", () => ({ color: "#cfe0ea", transparent: true, opacity: 0.22, roughness: 0.04, metalness: 0.2 })));
      glow(Gp, new THREE.BoxGeometry(sw - 1.1, 2.85, 0.05).translate(xa + sw / 2, 2.175, zi(1.6)), [1.25, 1.0, 0.62]);
      for (let q = 0; q < 5; q++) { const gx = xa + 0.95 + q * (sw * 0.62 - 1.0) / 5, gh = 0.3 + 0.9 * S.hash(k * 7 + b, q, 2), gc = ["#c97a42", "#e8c45a", "#b5563a", "#f4f2ea", "#3f8fc9", "#57a05a", "#8a2a4a"][(q + b + k) % 7]; if (q % 2) B.cyl(pmat(gc, 0.6), gx, 0.95 + gh / 2, zi(0.7), 0.14, gh); else bx(pmat(gc, 0.7), gx - 0.16, 0.95, zi(0.5), gx + 0.16, 0.95 + gh, zi(0.85)); }
      bx(M.wood("#8a5a34"), xa + 0.72, 0.75, zi(0.3), xa + sw * 0.62, 0.95, zi(1.2));
      bx(fm, xa + sw * 0.62 + 0.22, 0, zi(0.2), xa + sw - 0.72, 3.0, zi(0.26)); bx(glass, xa + sw * 0.62 + 0.4, 1.1, zi(0.17), xa + sw - 0.9, 2.8, zi(0.2)); B.sph(M.brass(), xa + sw * 0.62 + 0.36, 1.05, zi(0.12), 0.045);
      // the awning on its iron arms, with a scalloped valance
      const am = lam("qAwn" + aw, () => ({ map: tiled(P.stripeTex("aw" + aw, "#f4efe2", aw), 6, 1), roughness: 0.95, side: THREE.DoubleSide })); const ax0 = xa + 0.55, ax1 = xa + sw - 0.55, zo2 = zo(1.9);
      A(quad([ax0, 3.55, z], [ax1, 3.55, z], [ax1, 2.75, zo2], [ax0, 2.75, zo2], 1, 1), am, true); A(quad([ax0, 2.75, zo2], [ax1, 2.75, zo2], [ax1, 2.5, zo2], [ax0, 2.5, zo2], 1, 0.2), am); for (const xe of [ax0, ax1]) { B.rod(ironM, [xe, 3.55, z], [xe, 2.75, zo2], 0.018); B.rod(ironM, [xe, 2.3, z], [xe, 2.75, zo2], 0.015); }
    }
  };
  const wf2 = M.white();
  let k = 0; const row = (sd: number, x: number, list: [number, number][]) => { for (const [w, fl] of list) { if (!(sd < 0 && Math.abs(x + w / 2 - SX) < 1)) house(x + w / 2, w, fl, k++, sd); else house(SX, w, fl, 2, sd, true); x += w + 0.01; } };
  row(-1, SX - 246.08, [[36, 4], [24, 3], [36, 5], [24, 4], [36, 3], [24, 4], [36, 5], [24, 3], [12, 3], [24, 5], [36, 4], [24, 3], [36, 4]]);
  row(1, SX - 252, [[24, 4], [36, 3], [24, 5], [36, 4], [24, 3], [36, 5], [36, 4], [24, 3], [36, 5], [24, 4], [36, 3], [12, 4]]);
  // ---- the cloth shop: dark green joinery with gilt mouldings, two windows dressed with cloth, a glazed door ----
  { const z = -12, zo = (d: number) => z + d, green = M.paint("#1d4a3a", 0.38), gd = M.brass(), st = M.stucco("#ffffff"), col = HOUSE[6];
    B.box(st, SX - 6, 0, z - 0.6, SX - 5.6, 5.2, z, col).box(st, SX + 5.6, 0, z - 0.6, SX + 6, 5.2, z, col);
    B.box(green, SX - 5.6, 4.05, z - 0.3, SX + 5.6, 5.2, zo(0.14)).box(gd, SX - 5.4, 4.2, zo(0.14), SX + 5.4, 4.26, zo(0.17)).box(gd, SX - 5.4, 5.0, zo(0.14), SX + 5.4, 5.06, zo(0.17)).box(gd, SX - 5.4, 4.2, zo(0.14), SX - 5.34, 5.06, zo(0.17)).box(gd, SX + 5.34, 4.2, zo(0.14), SX + 5.4, 5.06, zo(0.17));
    B.box(green, SX - 5.7, 5.2, z - 0.3, SX + 5.7, 5.34, zo(0.32)).box(green, SX - 5.6, 0, z - 0.3, SX + 5.6, 0.8, zo(0.1));
    // the sign: gilt scissors and scrolls, no lettering
    B.rod(gd, [SX - 0.45, 4.38, zo(0.2)], [SX + 0.4, 4.86, zo(0.2)], 0.028).rod(gd, [SX + 0.45, 4.38, zo(0.2)], [SX - 0.4, 4.86, zo(0.2)], 0.028); for (const sx of [-1, 1]) { const tr = new THREE.TorusGeometry(0.1, 0.025, 6, 16); tr.translate(SX + sx * 0.5, 4.33, zo(0.2)); A(tr, gd); for (let q = 1; q < 4; q++) { const sc = new THREE.TorusGeometry(0.16, 0.022, 6, 18, 4.6); sc.rotateZ(q * 1.3 * sx); sc.translate(SX + sx * (1.2 + q * 1.05), 4.63, zo(0.2)); A(sc, gd); } }
    for (const xp of [-5.6, -1.62, 1.25, 5.23]) { B.box(green, SX + xp, 0.8, z - 0.3, SX + xp + 0.37, 4.05, zo(0.12)); B.box(gd, SX + xp + 0.06, 0.95, zo(0.12), SX + xp + 0.09, 3.9, zo(0.14)); B.box(gd, SX + xp + 0.28, 0.95, zo(0.12), SX + xp + 0.31, 3.9, zo(0.14)); B.box(gd, SX + xp - 0.04, 4.0, zo(0.1), SX + xp + 0.41, 4.08, zo(0.16)); }
    const pane = lam("qShopGlass2", () => ({ color: "#dfeaf0", transparent: true, opacity: 0.12, roughness: 0.03, metalness: 0.3 }));
    for (const sx of [-1, 1]) { const xa = sx < 0 ? SX - 5.23 : SX + 1.62, xb = xa + 3.61;
      A(new THREE.BoxGeometry(3.61, 3.25, 0.03).translate((xa + xb) / 2, 2.425, zo(0.02)), pane); B.box(green, (xa + xb) / 2 - 0.03, 0.8, zo(0), (xa + xb) / 2 + 0.03, 4.05, zo(0.06));
      // inside the window: a floor, a back panel lit warm, bolts stacked and stood on end, lengths draped from a brass rail, a dressmaker's form
      B.box(M.wood("#8a5a34"), xa, 0.8, z - 1.5, xb, 0.9, z - 0.05); B.box(M.wood("#5a3a26"), xa, 0.9, z - 1.56, xb, 4.05, z - 1.5); glow(Gp, new THREE.BoxGeometry(3.2, 0.1, 0.1).translate((xa + xb) / 2, 3.95, z - 0.2), [3.0, 2.5, 1.5]);
      const BC = ["#e2453c", "#f6c419", "#3f8fc9", "#57a05a", "#f25c7a", "#f29a2e", "#7a5a9a", "#2fb0a0", "#f4f2ea", "#1f2f5c", "#b5563a", "#8a2a4a"];
      for (let lv = 0; lv < 3; lv++) for (let q = 0; q < 4 - lv; q++) B.cyl(M.clothI(), xa + 0.45 + (q + lv * 0.5) * 0.3, 1.04 + lv * 0.26, z - 0.75, 0.14, 1.0, BC[(q * 3 + lv * 5 + (sx > 0 ? 2 : 0)) % 12], [Math.PI / 2, 0, 0]);
      for (let q = 0; q < 3; q++) B.cyl(M.clothI(), xb - 0.5 - q * 0.34, 1.6, z - 1.1 - (q % 2) * 0.2, 0.13, 1.4, BC[(q * 4 + 1 + (sx > 0 ? 5 : 0)) % 12], [0.08 * (q - 1), 0, 0.06 * (q - 1)]);
      B.cyl(gd, (xa + xb) / 2, 3.75, z - 0.9, 0.02, 3.4, undefined, [0, 0, Math.PI / 2]); for (let q = 0; q < 5; q++) { const cx = xa + 0.5 + q * 0.66; B.box(M.clothI(), cx - 0.24, 2.3 + 0.25 * S.hash(q, sx + 2, 4), z - 0.93, cx + 0.24, 3.75, z - 0.87, BC[(q * 5 + (sx > 0 ? 3 : 7)) % 12]); }
      { const mx = sx < 0 ? xb - 0.95 : xa + 1.9, mz = z - 0.55; B.cyl(M.wood("#5a3320"), mx, 1.2, mz, 0.025, 0.7); B.cyl(M.wood("#5a3320"), mx, 0.93, mz, 0.2, 0.05); B.sph(M.cloth("#f4f2ea"), mx, 1.95, mz, 0.24, 0.42, 0.16); B.cyl(M.wood("#5a3320"), mx, 2.42, mz, 0.05, 0.1); }
    }
    // the door: two glazed leaves, brass handles, a fanlight
    B.box(green, SX - 1.25, 0, zo(-0.08), SX - 0.02, 3.3, zo(-0.02)).box(green, SX + 0.02, 0, zo(-0.08), SX + 1.25, 3.3, zo(-0.02)); for (const sx of [-1, 1]) { B.box(glass, SX + sx * 0.64 - 0.42, 1.2, zo(-0.02), SX + sx * 0.64 + 0.42, 3.0, zo(0)); B.sph(gd, SX + sx * 0.12, 1.15, zo(0.03), 0.045); B.box(gd, SX + sx * 0.64 - 0.42, 0.3, zo(-0.02), SX + sx * 0.64 + 0.42, 0.34, zo(0)); }
    B.box(glass, SX - 1.2, 3.35, zo(-0.06), SX + 1.2, 3.95, zo(-0.03)).box(green, SX - 1.25, 3.3, zo(-0.1), SX + 1.25, 3.36, zo(0.02));
    // outside: a hanging sign, two lamps, a trestle of bolts, a bench
    B.box(M.iron(), SX - 6.43, 4.36, zo(0), SX - 6.37, 4.42, zo(1.3)); B.cyl(gd, SX - 6.4, 3.75, zo(1.05), 0.5, 0.05, undefined, [Math.PI / 2, 0, 0]); B.cyl(green, SX - 6.4, 3.75, zo(1.05), 0.4, 0.07, undefined, [Math.PI / 2, 0, 0]);
    for (const dx of [-1.62, 1.62]) { B.box(M.iron(), SX + dx - 0.02, 3.5, zo(0.1), SX + dx + 0.02, 3.54, zo(0.6)); const gl = new THREE.CylinderGeometry(0.15, 0.1, 0.34, 6); gl.translate(SX + dx, 3.3, zo(0.55)); glow(Gp, gl, [2.6, 2.1, 1.2]); }
    B.box(M.wood("#8a5a34"), SX - 5.5, 0.85, zo(0.5), SX - 3.7, 0.9, zo(1.3)); for (const [dx, dz] of [[-5.4, 0.55], [-3.8, 0.55], [-5.4, 1.25], [-3.8, 1.25]]) B.box(M.wood("#6a4428"), SX + dx - 0.03, 0.16, zo(dz) - 0.03, SX + dx + 0.03, 0.85, zo(dz) + 0.03);
    ["#e2453c", "#f6c419", "#3f8fc9", "#f4f2ea", "#57a05a"].forEach((c, i) => B.cyl(M.clothI(), SX - 4.6, 1.03 + (i > 2 ? 0.24 : 0), zo(0.66 + (i > 2 ? (i - 3) * 0.28 + 0.12 : i * 0.26)), 0.13, 1.6, c, [0, 0, Math.PI / 2]));
    B.box(M.wood("#7a4e2c"), SX + 3.7, 0.56, zo(0.5), SX + 5.5, 0.62, zo(0.95)); for (const dx of [3.8, 5.4]) B.box(M.iron(), SX + dx - 0.03, 0.16, zo(0.52), SX + dx + 0.03, 0.56, zo(0.93));
  }
  // lamps, the tram wire on its poles, bunting across the street
  for (let x = SX - 248; x < SX + 116; x += 16) { gasLamp(B, x, -7.6, 4.2, 0.16); gasLamp(B, x + 8, 7.6, 4.2, 0.16); }
  for (let x = SX - 250; x < SX + 130; x += 30) { B.cyl(M.iron(), x, 3.3, -7.4, 0.07, 6.6); B.rod(M.iron(), [x, 6.4, -7.4], [x, 6.2, 1.6], 0.02); }
  B.rod(M.iron(), [SX - 260, 6.2, 1.6], [SX + 140, 6.2, 1.6], 0.018);
  { const bunt = lam("qBuntS", () => ({ map: tiled(Q.buntingTex(), 5, 1), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.9 })); for (let x = SX - 236; x < SX + 116; x += 22) { A(wall(x, -12, x, 12, 9.0, 9.9, 1, 1), bunt, true); B.rod(M.iron(), [x, 9.9, -12], [x, 9.9, 12], 0.012); } }
  const tr: TreeSpec[] = []; for (let x = SX - 236; x < SX + 110; x += 24) { if (Math.abs(x + 4 - SX) > 9) tr.push({ x: x + 4, z: -9.7, h: 7.5, k: (x / 24) | 0, y: 0.16 }); tr.push({ x: x - 8, z: 9.7, h: 8, k: ((x / 24) | 0) + 2, y: 0.16 }); }
  // the tram: cream over deep red, a clerestory roof, brass lamps, passengers at the windows
  { const Tm = refs.tram; Gp.add(Tm); const b = new Batch(), cream = pmat("#f1e3bc", 0.3), red = pmat("#8f2424", 0.28), wd = M.wood("#7a4e2c");
    b.box(red, -3.2, 0.5, -1.02, 3.2, 1.45, 1.02).box(cream, -3.2, 1.45, -1.02, 3.2, 1.6, 1.02).box(cream, -3.2, 2.6, -1.02, 3.2, 2.95, 1.02).box(M.wood("#c9a86a"), -3.5, 2.95, -1.12, 3.5, 3.03, 1.12).box(cream, -2.9, 3.03, -0.6, 2.9, 3.3, 0.6).box(M.wood("#c9a86a"), -3.0, 3.3, -0.7, 3.0, 3.36, 0.7);
    for (let i = 0; i <= 7; i++) { const x = -3.15 + i * 0.9; for (const z of [-1.0, 1.0]) b.box(cream, x - 0.05, 1.6, z - 0.03, x + 0.05, 2.6, z + 0.03); } b.box(M.brass(), -3.1, 1.4, -1.035, 3.1, 1.44, 1.035);
    for (const sx of [-1, 1]) { b.box(wd, sx * 3.2, 0.42, -0.95, sx * 3.85, 0.5, 0.95).box(red, sx * 3.82, 0.5, -0.95, sx * 3.88, 1.35, 0.95).box(M.iron(), sx * 3.2 - 0.02, 0.5, -0.9, sx * 3.2 + 0.02, 2.95, -0.86).box(M.iron(), sx * 3.2 - 0.02, 0.5, 0.86, sx * 3.2 + 0.02, 2.95, 0.9); glow(Tm, new THREE.SphereGeometry(0.13, 10, 8).translate(sx * 3.92, 1.0, 0), [2.6, 2.2, 1.4]); }
    for (const x of [-1.8, 1.8]) for (const z of [-0.8, 0.8]) { b.cyl(M.iron(), x, 0.42, z, 0.42, 0.12, undefined, [Math.PI / 2, 0, 0]); } b.box(M.iron(), -2.4, 0.3, -0.75, 2.4, 0.5, 0.75); b.rod(M.iron(), [0, 3.36, 0], [-2.2, 6.2, 0.05], 0.025);
    b.build(Tm); const inside = lam("qTramIn", () => ({ map: T.tramTex(), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.9 })); add(Tm, wall(-3.2, 0.9, 3.2, 0.9, 0.45, 2.95), inside); add(Tm, wall(3.2, -0.9, -3.2, -0.9, 0.45, 2.95), inside);
    const gl = lam("qTramGlass", () => ({ color: "#cfe0ea", transparent: true, opacity: 0.25, roughness: 0.05, metalness: 0.2 })); for (const z of [-1.01, 1.01]) add(Tm, new THREE.BoxGeometry(6.3, 1.0, 0.02).translate(0, 2.1, z), gl); }
  // the plaza at the east end: the stone gate (five openings, a pediment, figures on the cornice), a fountain, flagpoles
  { const gx = SX + 200, sh = new THREE.Shape(); sh.moveTo(-22, 0); sh.lineTo(22, 0); sh.lineTo(22, 15); sh.lineTo(-22, 15); sh.lineTo(-22, 0);
    for (const cz of [-7.2, 0, 7.2]) { const hole = new THREE.Path(); hole.moveTo(cz - 2.6, 0); hole.lineTo(cz - 2.6, 7.6); hole.absarc(cz, 7.6, 2.6, Math.PI, 0, true); hole.lineTo(cz + 2.6, 0); hole.lineTo(cz - 2.6, 0); sh.holes.push(hole); }
    for (const cz of [-15.6, 15.6]) { const hole = new THREE.Path(); hole.moveTo(cz - 2.1, 0); hole.lineTo(cz - 2.1, 8.2); hole.lineTo(cz + 2.1, 8.2); hole.lineTo(cz + 2.1, 0); hole.lineTo(cz - 2.1, 0); sh.holes.push(hole); }
    const eg = new THREE.ExtrudeGeometry(sh, { depth: 4.4, bevelEnabled: false, curveSegments: 20 }); eg.rotateY(Math.PI / 2); eg.translate(gx - 2.2, 0, 0); const gst = M.stone("#e6dccb"); A(eg, gst, true);
    B.box(gst, gx - 2.9, 15, -22.6, gx + 2.9, 16.2, 22.6).box(gst, gx - 2.5, 16.2, -11, gx + 2.5, 19.6, 11).box(gst, gx - 2.8, 19.6, -11.4, gx + 2.8, 20.2, 11.4);
    const ped = new THREE.Shape(); ped.moveTo(-9, 0); ped.lineTo(9, 0); ped.lineTo(0, 3.2); ped.lineTo(-9, 0); const pg = new THREE.ExtrudeGeometry(ped, { depth: 4.4, bevelEnabled: false }); pg.rotateY(Math.PI / 2); pg.translate(gx - 2.2, 20.2, 0); A(pg, gst, true);
    for (const z of [-19.6, -11.4, -3.6, 3.6, 11.4, 19.6]) for (const sx of [-1, 1]) { B.cyl(gst, gx + sx * 2.5, 7.3, z, 0.55, 13.4); B.box(gst, gx + sx * 2.5 - 0.75, 0, z - 0.75, gx + sx * 2.5 + 0.75, 1.0, z + 0.75); B.box(gst, gx + sx * 2.5 - 0.7, 14.0, z - 0.7, gx + sx * 2.5 + 0.7, 15, z + 0.7); }
    for (const z of [-19, -13, 13, 19]) { B.sph(gst, gx, 17.4, z, 0.7, 1.1, 0.7); B.sph(gst, gx, 18.8, z, 0.42); }
    B.cyl(gst, SX + 150, 0.35, 0, 5.2, 0.7).cyl(pmat("#4f9ab8", 0.05, 0.3), SX + 150, 0.67, 0, 4.7, 0.08).cyl(gst, SX + 150, 1.7, 0, 0.6, 2.8).cyl(gst, SX + 150, 3.2, 0, 1.6, 0.25).sph(gst, SX + 150, 3.9, 0, 0.5);
    for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; tr.push({ x: gx - 20 + 50 * Math.cos(a), z: 70 * Math.sin(a), h: 11 + (i % 3) * 2, k: i }); }
    for (const [x, z, c] of [[SX + 126, -30, 0], [SX + 126, 30, 2], [SX + 176, -34, 4], [SX + 176, 34, 1]]) pennant(x, 0, z, 9, 2.2, PEN[c], 0.6); }
  trees(tr); B.build(Gp);
  void [towns];
}
