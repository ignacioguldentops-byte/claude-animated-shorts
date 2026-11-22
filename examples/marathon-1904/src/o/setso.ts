// The world of "Media carrera en coche": the stadium of the 1904 Games with its wooden grandstand, the fair's white
// palaces and observation wheel behind it, and the farmland outside the east gate: a dirt road with rail fences and
// telegraph poles, wheat and corn, an orchard, a well, a farm with barn, windmill and silo, rolling hills. One
// continuous world: the camera flies between places instead of cutting.
import * as THREE from "three";
import { lam, add, ground } from "./kit";
import * as S from "./pbr";
import { wmat, pmat, Batch, makeCorn, solid, Spot, TreeSpec } from "./real";
import { towns } from "./castr";
import { Refs, M, kit, glow, quad, tri, Quads, PEN } from "./setsq";
import { GATE_X, ROAD_W, roadZ, onRoad, roadDir, TR, FINISH_X, P, WHEAT_GLSL, CORN_GLSL } from "./geo";

export type Car = { g: THREE.Group; wheels: THREE.Object3D[]; hood: THREE.Object3D };
export type ORefs = Refs & { world: THREE.Group; cars: Car[]; tape: THREE.Object3D[]; bigWheel: THREE.Object3D; mill: THREE.Object3D; tripod: THREE.Group; bucket: THREE.Object3D };

/** an open touring car of 1904, built along +x (front), axle line z; wheels radius .45 */
export const makeCar = (paint: string): Car => {
  const g = new THREE.Group(), B = new Batch(), body = pmat(paint, 0.22, 0.15, { envMapIntensity: 1.4 }), black = pmat("#16161a", 0.35, 0.3), brass = M.brass(), leather = M.leather("#5a2a1c"), wood = M.wood("#8a5a34", 0.5);
  B.box(black, -1.75, 0.5, -0.5, 1.7, 0.62, 0.5)                                     // chassis
    .box(body, -1.55, 0.62, -0.68, 0.9, 1.05, 0.68).box(body, 0.9, 0.7, -0.42, 1.62, 1.12, 0.42)   // tub and bonnet
    .box(body, 0.92, 1.12, -0.4, 1.6, 1.16, 0.4, undefined, [0, 0, 0])
    .box(brass, 1.62, 0.66, -0.4, 1.74, 1.26, 0.4).box(pmat("#2a2a2e", 0.6, 0.5), 1.735, 0.74, -0.33, 1.75, 1.18, 0.33)   // radiator
    .box(body, 0.75, 1.05, -0.68, 0.9, 1.5, 0.68)                                      // dashboard
    .box(leather, -0.25, 1.05, -0.6, 0.55, 1.2, 0.6).box(leather, -0.32, 1.05, -0.62, -0.18, 1.62, 0.62)   // front bench and back
    .box(leather, -1.45, 1.05, -0.6, -0.65, 1.2, 0.6).box(body, -1.6, 1.05, -0.68, -1.45, 1.78, 0.68).box(leather, -1.5, 1.2, -0.6, -1.4, 1.72, 0.6)   // rear tonneau
    .box(body, -1.6, 1.05, 0.62, 0.75, 1.32, 0.68).box(body, -1.6, 1.05, -0.68, 0.75, 1.32, -0.62)   // sides
    .box(black, -1.0, 0.52, 0.66, 0.95, 0.56, 0.95).box(black, -1.0, 0.52, -0.95, 0.95, 0.56, -0.66)   // running boards
    .cyl(black, 0.62, 1.42, 0.35, 0.025, 0.7, undefined, [0, 0, -0.6]);                // steering column
  for (const sz of [-1, 1]) { // fenders: four slats bent over each wheel
    for (const wx of [-1.2, 1.2]) for (let k = 0; k < 5; k++) { const a = Math.PI * (0.1 + 0.8 * k / 4), x = wx - 0.6 * Math.cos(a), y = 0.5 + 0.58 * Math.sin(a); B.slab(black, x, y, sz * 0.8, 0.34, 0.03, 0.26, [0, 0, Math.PI / 2 - a]); }
    B.cyl(brass, 1.62, 1.12, sz * 0.52, 0.11, 0.22, undefined, [0, 0, Math.PI / 2]).sph(pmat("#fff6d8", 0.1, 0, { emissive: "#fff0c0", emissiveIntensity: 0.4 }), 1.74, 1.12, sz * 0.52, 0.02, 0.09, 0.09)   // lamps
      .cyl(brass, 1.2, 1.0, sz * 0.62, 0.012, 0.3, undefined, [0, 0, 0]); }
  B.cyl(brass, 0.95, 1.38, 0.58, 0.035, 0.32, undefined, [0, 0, -1.2]).sph(black, 0.8, 1.3, 0.58, 0.07);   // bulb horn
  B.build(g);
  const sw = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.018, 8, 24), wood); sw.position.set(0.44, 1.62, 0.35); sw.rotation.set(0, Math.PI / 2, 0.55); sw.castShadow = true; g.add(sw);
  const wheels: THREE.Object3D[] = [];
  for (const wx of [-1.2, 1.2]) for (const sz of [-1, 1]) { const w = new THREE.Group(); w.position.set(wx, 0.45, sz * 0.8); const wb = new Batch();
    for (let s = 0; s < 12; s++) { const a = s * Math.PI / 6; wb.rod(wood, [0, 0, 0], [0.39 * Math.cos(a), 0.39 * Math.sin(a), 0], 0.018); }
    wb.cyl(brass, 0, 0, 0, 0.07, 0.14, undefined, [Math.PI / 2, 0, 0]); wb.build(w);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.028, 8, 32), wood), tyre = new THREE.Mesh(new THREE.TorusGeometry(0.43, 0.045, 10, 36), pmat("#e8e4d6", 0.8)); rim.castShadow = tyre.castShadow = true; w.add(rim, tyre); g.add(w); wheels.push(w); }
  const hood = new THREE.Group(); hood.position.set(1.25, 1.16, 0); g.add(hood);
  return { g, wheels, hood };
};

export function buildWorld(R: THREE.Object3D, refs: ORefs) {
  const Gp = refs.world; R.add(Gp); const { A, pennant, people, trees, grass } = kit(Gp, refs), B = new Batch();
  const wood = M.wood("#9a7448"), wdark = M.wood("#6a4a2e"), white = M.paint("#f1eee4", 0.55), red = M.paint("#a8332a", 0.6);
  // ---------------- the land: one terrain mesh, flat round the road and the stadium, hills beyond ----------------
  { const N = 220, Wd = 1800, g = new THREE.PlaneGeometry(Wd, Wd, N, N); g.rotateX(-Math.PI / 2); g.translate(250, 0, 0); const pa = g.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), z = pa.getZ(i), dx = Math.max(-140 - x, 0, x - 760), dz = Math.max(-150 - z, 0, z - 120), d = Math.hypot(dx, dz) + Math.max(0, Math.abs(z + 26) - 140) * 0.4;
      const h = S.sst(60, 420, d) * (4 + 22 * S.fbm((x + 900) / 1800, (z + 900) / 1800, 4, 4, 7)); pa.setY(i, h - 0.02); }
    g.computeVertexNormals(); A(g, wmat("dryturf", S.turf("dryturf", 0, [118, 132, 62], [150, 150, 78]), 5), false); }
  grass("o", 150000, 26, { h0: 0.06, h1: 0.24, w: 0.018, base: ["#5a6a2c", "#667030", "#4f6428"], tip: ["#a8b058", "#b8b460", "#94a84c", "#c8c070"], flowers: 0.008, lean: 0.9,
    mask: `( 1.0 - step( 75.0, wp.x ) * ( 1.0 - smoothstep( 4.2, 5.2, abs( wp.y - ( -26.0 + 12.0 * sin( max( 0.0, wp.x - 80.0 ) / 60.0 ) * min( 1.0, max( 0.0, wp.x - 80.0 ) / 30.0 ) ) ) ) ) ) * ( 1.0 - ${WHEAT_GLSL} ) * ( 1.0 - ${CORN_GLSL} ) * ( 1.0 - step( 21.6, length( vec2( max( abs( wp.x ) - 45.0, 0.0 ), wp.y ) ) ) * ( 1.0 - step( 30.4, length( vec2( max( abs( wp.x ) - 45.0, 0.0 ), wp.y ) ) ) ) ) * ( 1.0 - step( 32.0, -wp.y ) * step( -wp.y, 52.0 ) * step( abs( wp.x ), 56.0 ) ) * ( 1.0 - step( 32.0, wp.y ) * step( wp.y, 44.0 ) * step( abs( wp.x ), 46.0 ) )` });
  grass("o", 70000, 40, { h0: 0.8, h1: 1.25, w: 0.014, base: ["#8a7a38", "#9a8440"], tip: ["#e8c86a", "#f0d47a", "#dab45a", "#f4dc8a"], lean: 0.45, mask: WHEAT_GLSL, rough: 0.7 });
  { const c = makeCorn(34, 0.42, 0.95, 2.3, CORN_GLSL); Gp.add(c.mesh); refs.grass.push({ place: "o", g: c }); }
  // ground under the crops, the road with its ruts and verges
  { const wheatG = new Quads(), cornG = new Quads(), road = new Quads(), rut = new Quads(), verge = new Quads();
    for (let x = GATE_X - 2; x < 720; x += 2) { const a = (o: number, y: number) => onRoad(x, o, y), b = (o: number, y: number) => onRoad(x + 2, o, y);
      road.add(a(-ROAD_W / 2, 0.02), a(ROAD_W / 2, 0.02), b(ROAD_W / 2, 0.02), b(-ROAD_W / 2, 0.02));
      for (const o of [-1.25, 1.25]) rut.add(a(o - 0.32, 0.026), a(o + 0.32, 0.026), b(o + 0.32, 0.026), b(o - 0.32, 0.026));
      for (const s of [-1, 1]) verge.add(a(s * ROAD_W / 2, 0.02), a(s * (ROAD_W / 2 + 1.1), 0.015), b(s * (ROAD_W / 2 + 1.1), 0.015), b(s * ROAD_W / 2, 0.02));
      if (x >= 150) wheatG.add(a(5, 0.012), a(80, 0.012), b(80, 0.012), b(5, 0.012));
      if (x >= 240 && x < 420) cornG.add(a(-72, 0.012), a(-5, 0.012), b(-5, 0.012), b(-72, 0.012)); }
    const uvw = (q: Quads) => { const g = q.geo(); g.setAttribute("uv", new THREE.Float32BufferAttribute(new Array((q.p.length / 3) * 2).fill(0), 2)); return g; };
    A(uvw(wheatG), wmat("wheatground", S.earth(), 4, { color: "#d8b86a" })); A(uvw(cornG), wmat("cornground", S.earth(), 4, { color: "#8a6a48" }));
    A(uvw(road), wmat("road", S.earth(), 5, { color: "#e2c8a0" })); A(uvw(rut), wmat("rut", S.earth(), 2, { color: "#b0906a" })); A(uvw(verge), wmat("verge", S.earth(), 3, { color: "#c8b080" })); }
  // ---------------- the stadium of 1904 ----------------
  { const { L, r0, r1 } = TR, sh = new THREE.Shape(), hole = new THREE.Path();
    const loop = (p: THREE.Shape | THREE.Path, r: number) => { p.moveTo(-L, -r); p.lineTo(L, -r); p.absarc(L, 0, r, -Math.PI / 2, Math.PI / 2, false); p.lineTo(-L, r); p.absarc(-L, 0, r, Math.PI / 2, Math.PI * 1.5, false); };
    loop(sh, r1); loop(hole, r0); sh.holes.push(hole); const tg = new THREE.ShapeGeometry(sh, 48); tg.rotateX(-Math.PI / 2); tg.translate(0, 0.03, 0); A(tg, wmat("cinder", S.cinder(), 1.2, { color: "#b8704e" }));
    // the chute from the gate onto the north straight
    A(ground(L, GATE_X + 2, -r1, -r0, 0.03), wmat("cinder", S.cinder(), 1.2, { color: "#b8704e" }));
    const line = M.line(); for (let k = 0; k <= 6; k++) { const z = -(r0 + k * (r1 - r0) / 6); A(ground(-L, L, z - 0.04, z + 0.04, 0.04), line); }
    A(ground(FINISH_X - 0.1, FINISH_X + 0.1, -r1, -r0, 0.045), line);
    // the finish: two posts and the tape (it breaks in two)
    for (const z of [-r0 + 0.4, -r1 - 0.4]) { B.cyl(white, FINISH_X, 0.8, z, 0.06, 1.6); B.sph(white, FINISH_X, 1.64, z, 0.09); solid("finish post", FINISH_X - 0.1, z - 0.1, FINISH_X + 0.1, z + 0.1, 1.7); }
    for (const s of [0, 1]) { const t = new THREE.Group(); t.position.set(FINISH_X, 1.22, s ? -r0 + 0.4 : -r1 - 0.4); const len = (r1 - r0 + 0.8) / 2; const m = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.05, len).translate(0, 0, s ? -len / 2 : len / 2), pmat("#f4f2ea", 0.7)); m.castShadow = true; t.add(m); Gp.add(t); refs.tape.push(t); }
    // the judges' platform in front of the grandstand
    { const x = FINISH_X, z = -32; B.box(wood, x - 1.6, 0, z - 0.9, x + 1.6, 1.0, z + 0.9).box(white, x - 1.7, 1.0, z - 1.0, x + 1.7, 1.08, z + 1.0); for (let i = 0; i <= 8; i++) B.box(white, x - 1.6 + i * 0.4 - 0.02, 1.08, z + 0.92, x - 1.6 + i * 0.4 + 0.02, 1.9, z + 0.96); B.box(white, x - 1.65, 1.86, z + 0.9, x + 1.65, 1.94, z + 0.98);
      for (const s of [-1, 1]) B.box(white, x + s * 1.65 - 0.02, 1.08, z - 0.95, x + s * 1.65 + 0.02, 1.9, z + 0.95); B.box(wood, x + 1.6, 0, z - 0.3, x + 2.6, 0.5, z + 0.3).box(wood, x + 1.6, 0.5, z - 0.3, x + 2.1, 1.0, z + 0.3); solid("judges", x - 1.7, z - 1.0, x + 2.6, z + 1.0, 1.0); }
    // grandstand north: ten rows of benches under a pitched roof on posts, bunting, pennants, a dignitaries' box
    const z0 = -33.5, rows = 11, run = 1.15, rise = 0.66, x0 = -52, x1 = 52, spots: Spot[] = [];
    B.box(white, x0, 0, z0 - 0.08, x1, 1.6, z0); solid("grandstand", x0, z0 - rows * run - 0.3, x1, z0, 9);
    for (let r = 0; r < rows; r++) { const z = z0 - r * run, y = 1.6 + r * rise; B.box(wood, x0, y - 0.06, z - run, x1, y, z).box(wdark, x0, y - rise, z - run - 0.03, x1, y, z - run).box(wood, x0, y + 0.42, z - run + 0.08, x1, y + 0.47, z - run + 0.42);
      for (let x = x0 + 0.5; x < x1; x += 0.58) { const h = S.hash(Math.round(x * 10), r, 70); if (h < 0.05 || (Math.abs(x - FINISH_X) < 3.2 && r < 3)) continue; spots.push({ x, y: y - 0.02, z: z - run + 0.5, k: Math.floor(S.hash(Math.round(x * 10), r, 71) * 31), ph: S.hash(Math.round(x * 10), r, 72), s: 0.78 }); } }
    const zb = z0 - rows * run, yt = 1.6 + rows * rise; B.box(white, x0, 0, zb - 0.12, x1, yt + 4.6, zb); for (const x of [x0, x1]) { B.box(white, x - 0.08, 0, zb, x + 0.08, 1.6, z0); for (let r = 0; r < rows; r++) B.box(white, x - 0.08, 1.6 + r * rise, zb, x + 0.08, 1.6 + (r + 1) * rise, z0 - (r + 1) * run); }
    const ry = (z: number) => 11.6 + (z0 + 2.4 - z) * (2.6 / (rows * run + 3)); B.slab(M.tile(), 0, (ry(z0 + 2.4) + ry(zb - 0.6)) / 2, (z0 + 2.4 + zb - 0.6) / 2, x1 - x0 + 2, 0.16, Math.hypot(rows * run + 3, 2.6), [Math.atan2(2.6, rows * run + 3), 0, 0]);
    A(quad([x0 - 1, 10.9, z0 + 2.4], [x1 + 1, 10.9, z0 + 2.4], [x1 + 1, 11.6, z0 + 2.4], [x0 - 1, 11.6, z0 + 2.4]), lam("oBunt", () => ({ map: (() => { const t = M.cloth("#ffffff").map!.clone(); return t; })(), color: "#c83a32", side: THREE.DoubleSide, roughness: 0.9 })), true);
    for (let x = x0; x < x1; x += 2.4) { const c = ["#c8342e", "#f4f2ea", "#2f4f9a"][Math.abs(Math.round(x / 2.4)) % 3]; A(tri([x, 10.9, z0 + 2.42], [x + 2.4, 10.9, z0 + 2.42], [x + 1.2, 10.1, z0 + 2.42]), lam("oFes" + c, () => ({ color: c, side: THREE.DoubleSide, roughness: 0.9 })), true); }
    for (let x = x0; x <= x1 + 0.1; x += 8) { B.cyl(white, x, 5.7, z0 + 2.2, 0.12, 11.4); B.rod(white, [x, 9.8, z0 + 2.2], [x + 1.6, 11.2, z0 + 2.2], 0.05).rod(white, [x, 9.8, z0 + 2.2], [x - 1.6, 11.2, z0 + 2.2], 0.05); pennant(x, 13.6, zb, 4.6, 2.4, PEN[Math.abs(Math.round(x / 8)) % 6], 0.4); solid("stand post", x - 0.15, z0 + 2.05, x + 0.15, z0 + 2.35, 11.4); }
    B.rod(white, [x0, 2.6, z0 - 0.05], [x1, 2.6, z0 - 0.05], 0.04); for (let x = x0; x <= x1; x += 1) B.box(white, x - 0.025, 1.6, z0 - 0.08, x + 0.025, 2.6, z0 - 0.02);
    // the dignitaries' box: red, white and blue drapes over the rail, gilt posts, a canopy
    { const xa = FINISH_X - 3, xb = FINISH_X + 3; for (let i = 0; i < 6; i++) B.box(M.cloth(["#c8342e", "#f4f2ea", "#2f4f9a"][i % 3]), xa + i, 1.6, z0 + 0.02, xa + i + 1, 2.6, z0 + 0.06); B.slab(M.cloth("#c8342e"), FINISH_X, 5.4, z0 - 1.2, 6.6, 0.12, 3.4, [0.15, 0, 0]); for (const x of [xa, xb]) B.cyl(M.brass(), x, 3.5, z0 + 0.2, 0.06, 3.8); }
    people("o", Array.from({ length: 31 }, (_, i) => towns(i)), [{ facing: 0, expr: "smile" }, { facing: 0, expr: "laugh", armL: "up", armR: "up" }], spots);
    // south bleachers, open to the sun
    { const sp: Spot[] = [], zs = 33.5; for (let r = 0; r < 7; r++) { const z = zs + r * 1.0, y = 0.6 + r * 0.5; B.box(wood, -40, y - 0.06, z, 40, y, z + 1.0).box(wdark, -40, 0, z + 0.95, 40, y, z + 1.0);
        for (let x = -39.5; x < 40; x += 0.6) { if (S.hash(Math.round(x * 10), r, 80) < 0.25) continue; sp.push({ x, y: y - 0.02, z: z + 0.45, k: Math.floor(S.hash(Math.round(x * 10), r, 81) * 31), ph: S.hash(Math.round(x * 10), r, 82), s: 0.78 }); } }
      solid("bleachers", -40, zs, 40, zs + 7.2, 4); people("o", Array.from({ length: 31 }, (_, i) => towns((i * 7 + 3) % 31)), [{ facing: 0, expr: "smile" }, { facing: 0, expr: "laugh", armL: "up", armR: "up" }], sp); }
    // the white picket fence round the ground, the gate onto the road
    { const fr = 34.5; for (let t = 0; t < 1; t += 1 / 460) { const per = 4 * 45 + 2 * Math.PI * fr, s = t * per; let x: number, z: number, a: number;
        if (s < 90) { x = -45 + s; z = -fr; a = 0; } else if (s < 90 + Math.PI * fr) { const q = (s - 90) / fr - Math.PI / 2; x = 45 + fr * Math.cos(q); z = fr * Math.sin(q); a = q + Math.PI / 2; } else if (s < 180 + Math.PI * fr) { x = 45 - (s - 90 - Math.PI * fr); z = fr; a = Math.PI; } else { const q = (s - 180 - Math.PI * fr) / fr + Math.PI / 2; x = -45 + fr * Math.cos(q); z = fr * Math.sin(q); a = q + Math.PI / 2; }
        if (Math.abs(z + 26) < 5 && x > 60) continue; if (z < -33 && Math.abs(x) < 53) continue; if (z > 33 && Math.abs(x) < 41) continue; B.slab(white, x, 0.6, z, 0.09, 1.2, 0.05, [0, -a, 0]); }
      for (const z of [-30.6, -21.4]) { B.box(white, GATE_X - 0.5, 0, z - 0.5, GATE_X + 0.5, 5.2, z + 0.5); B.sph(white, GATE_X, 5.5, z, 0.42); solid("gate pillar", GATE_X - 0.5, z - 0.5, GATE_X + 0.5, z + 0.5, 5.2); }
      B.box(white, GATE_X - 0.35, 4.4, -30.6, GATE_X + 0.35, 5.0, -21.4); for (let i = 0; i < 7; i++) B.box(M.cloth(PEN[i % 6]), GATE_X + 0.36, 4.0, -30 + i * 1.25, GATE_X + 0.4, 4.4, -29.1 + i * 1.25);
      pennant(GATE_X, 5.8, -30.6, 3, 1.4, "#c8342e", 0.2); pennant(GATE_X, 5.8, -21.4, 3, 1.4, "#2f4f9a", 0.2); }
    trees([[-70, -60], [-60, 52], [70, 55], [-95, 5], [100, 45], [60, -70], [-30, -68], [20, -72], [-110, -40]].map(([x, z], i) => ({ x, z, h: 13 + (i % 3) * 3, k: i })));
  }
  // ---------------- the fair beyond: white palaces, a great dome, the observation wheel ----------------
  { const stuc = M.stucco("#f6f0e2"), dark = pmat("#3a3440", 0.7);
    const palace = (cx: number, cz: number, w: number, d: number, h: number) => { B.box(stuc, cx - w / 2, 0, cz - d / 2, cx + w / 2, h, cz + d / 2); B.box(stuc, cx - w / 2 - 0.6, h, cz - d / 2 - 0.6, cx + w / 2 + 0.6, h + 1.4, cz + d / 2 + 0.6);
      for (let x = cx - w / 2 + 2; x < cx + w / 2 - 1; x += 3.2) { B.cyl(stuc, x, h / 2, cz + d / 2 + 1.2, 0.55, h); B.box(dark, x + 0.7, 2, cz + d / 2 - 0.05, x + 2.5, h - 3, cz + d / 2 + 0.05); } B.box(stuc, cx - w / 2, h - 0.8, cz + d / 2, cx + w / 2, h, cz + d / 2 + 1.9); };
    palace(-175, 40, 80, 30, 16); palace(-160, -110, 70, 28, 15); palace(-250, -30, 60, 40, 18);
    { const cx = -205, cz = -20; B.cyl(stuc, cx, 14, cz, 16, 28).cyl(stuc, cx, 29, cz, 17, 2); for (let i = 0; i < 28; i++) { const a = i / 28 * Math.PI * 2; B.cyl(stuc, cx + 17.5 * Math.cos(a), 14, cz + 17.5 * Math.sin(a), 0.7, 26); }
      B.sph(wmat("domeTile", S.pantile(), 3, { color: "#e8d8c0" }), cx, 30, cz, 15.5, 13, 15.5).cyl(stuc, cx, 44, cz, 2.5, 4).sph(M.brass(), cx, 47, cz, 1.6); }
    { const W = new THREE.Group(); W.position.set(-130, 40, -175); Gp.add(W); refs.bigWheel = W; const wb = new Batch(), st = M.metal("#d8dce4", 0.4);
      for (const z of [-2, 2]) { const t = new THREE.Mesh(new THREE.TorusGeometry(36, 0.4, 6, 96), st); t.position.z = z; W.add(t); const t2 = new THREE.Mesh(new THREE.TorusGeometry(30, 0.25, 6, 96), st); t2.position.z = z; W.add(t2); for (let i = 0; i < 36; i++) { const a = i / 36 * Math.PI * 2; wb.rod(st, [0, 0, z], [36 * Math.cos(a), 36 * Math.sin(a), z], 0.12); } }
      for (let i = 0; i < 36; i++) { const a = i / 36 * Math.PI * 2; wb.box(pmat(["#c8342e", "#2f4f9a", "#e8c45a"][i % 3], 0.5), 37.5 * Math.cos(a) - 1, 37.5 * Math.sin(a) - 3.2, -1.4, 37.5 * Math.cos(a) + 1, 37.5 * Math.sin(a) - 1.4, 1.4); }
      wb.cyl(st, 0, 0, 0, 1.2, 6, undefined, [Math.PI / 2, 0, 0]); wb.build(W);
      for (const s of [-1, 1]) for (const z of [-4, 4]) B.rod(st, [-130 + s * 22, 0, -175 + z], [-130, 40, -175 + z * 0.4], 0.5); }
  }
  // ---------------- the country ----------------
  // rail fences along both sides, a gap at the well and at the orchard gate
  { const rail = M.wood("#8a6a48", 0.8); for (let x = 92; x < 700; x += 3) { for (const s of [-1, 1]) { const off = s * (ROAD_W / 2 + 1.6); if (s > 0 && Math.abs(x - P.well) < 6) continue; if (s > 0 && Math.abs(x - 132) < 3) continue; if (s < 0 && Math.abs(x - P.dogs) < 4) continue;
      const a = onRoad(x, off), b = onRoad(x + 3, off); B.cyl(rail, a[0], 0.65, a[2], 0.07, 1.3); for (const y of [0.55, 1.05]) B.rod(rail, [a[0], y, a[2]], [b[0], y + 0.05 * Math.sin(x), b[2]], 0.045); } } }
  // telegraph poles with cross arms, insulators and four sagging wires
  { const pole = M.wood("#6a5038", 0.8), ins = pmat("#d8e2e8", 0.1, 0, { transparent: true, opacity: 0.9 }), wire = pmat("#2a2a2e", 0.5, 0.5); let prev: number[] | null = null;
    for (let x = 132; x < 720; x += 36) { const [px, , pz] = onRoad(x, -(ROAD_W / 2 + 3.2)); B.cyl(pole, px, 4.6, pz, 0.13, 9.2); const [dx, dz] = roadDir(x), nx = -dz, nz = dx; B.slab(pole, px, 8.6, pz, 0.12, 0.12, 2.0, [0, Math.atan2(nx, nz), 0]);
      solid("pole", px - 0.15, pz - 0.15, px + 0.15, pz + 0.15, 9.2);
      for (const k of [-0.85, -0.3, 0.3, 0.85]) { B.cyl(ins, px + nx * k, 8.76, pz + nz * k, 0.05, 0.14); if (prev) { const ax = prev[0] + prev[2] * k, az = prev[1] + prev[3] * k, bx = px + nx * k, bz = pz + nz * k; B.rod(wire, [ax, 8.82, az], [(ax + bx) / 2, 8.2, (az + bz) / 2], 0.012).rod(wire, [(ax + bx) / 2, 8.2, (az + bz) / 2], [bx, 8.82, bz], 0.012); } }
      prev = [px, pz, nx, nz]; } }
  // the well: a ring of stone, two posts, a little shingled roof, the windlass, its rope and bucket; a trough
  { const [wx, , wz] = onRoad(P.well, ROAD_W / 2 + 3.3), st = M.stone("#b8aa98"); const ring = new THREE.CylinderGeometry(0.9, 0.95, 0.9, 24, 1, true); ring.translate(wx, 0.45, wz); A(ring, wmat("wellStone", S.brick("wellStone", [[150, 140, 128], [128, 120, 110], [170, 160, 146]]), 1.4), true);
    B.cyl(st, wx, 0.92, wz, 0.98, 0.08).cyl(pmat("#1a2228", 0.1, 0.2), wx, 0.5, wz, 0.82, 0.02); for (const s of [-1, 1]) B.box(wdark, wx + s * 0.95 - 0.07, 0, wz - 0.07, wx + s * 0.95 + 0.07, 2.4, wz + 0.07);
    B.slab(M.slate(), wx, 2.65, wz - 0.45, 2.5, 0.08, 1.15, [0.6, 0, 0]).slab(M.slate(), wx, 2.65, wz + 0.45, 2.5, 0.08, 1.15, [-0.6, 0, 0]).cyl(wood, wx, 1.75, wz, 0.08, 1.9, undefined, [0, 0, Math.PI / 2]).box(M.iron(), wx + 0.95, 1.4, wz - 0.02, wx + 1.0, 1.75, wz + 0.02).cyl(M.iron(), wx + 1.0, 1.4, wz + 0.1, 0.02, 0.2, undefined, [Math.PI / 2, 0, 0]);
    const bk = new THREE.Group(); bk.position.set(wx, 1.7, wz); Gp.add(bk); refs.bucket = bk; const bb = new Batch(); bb.rod(M.cloth("#c8b890"), [0, 0, 0], [0, -0.5, 0], 0.012).cyl(wood, 0, -0.68, 0, 0.17, 0.3).cyl(M.iron(), 0, -0.58, 0, 0.175, 0.03).cyl(M.iron(), 0, -0.78, 0, 0.175, 0.03); bb.build(bk);
    B.box(wood, wx + 1.6, 0, wz - 0.4, wx + 3.4, 0.55, wz + 0.4).box(pmat("#6a8aa0", 0.05, 0.2), wx + 1.7, 0.5, wz - 0.3, wx + 3.3, 0.52, wz + 0.3);
    solid("well", wx - 1.0, wz - 1.0, wx + 1.0, wz + 1.0, 2.8); solid("trough", wx + 1.6, wz - 0.4, wx + 3.4, wz + 0.4, 0.55); }
  // the orchard: apple trees in rows, red apples in the crowns and in the grass
  { const specs: TreeSpec[] = [], ap = pmat("#c8281e", 0.35, 0, { envMapIntensity: 1.2 }), ap2 = pmat("#d84a24", 0.4), leaf = M.wood("#4a3a22");
    for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) { const x = 100 + i * 9 + (j % 2) * 4, z = roadZ(x) + 11 + j * 8.5; specs.push({ x, z, h: 6.2 + ((i + j) % 3) * 0.6, k: i + j }); solid("apple tree", x - 0.3, z - 0.3, x + 0.3, z + 0.3, 6); }
    trees(specs, ["#4f8a3a", "#5a9a40", "#467e36"]);
    specs.forEach((t, ti) => { for (let k = 0; k < 26; k++) { const u = S.hash(k, ti, 41) * 2 - 1, a = S.hash(k, ti, 42) * 6.283, rr = 0.92, sq = Math.sqrt(1 - u * u), rx = t.h * 0.33, ryy = t.h * 0.3, cy = t.h * 0.68;
        B.sph(k % 3 ? ap : ap2, t.x + rx * rr * sq * Math.cos(a), cy + ryy * rr * u * 0.8 - 0.15, t.z + rx * rr * sq * Math.sin(a), 0.07); }
      for (let k = 0; k < 7; k++) B.sph(ap2, t.x + 2.6 * (S.hash(k, ti, 43) - 0.5), 0.06, t.z + 2.6 * (S.hash(k, ti, 44) - 0.5), 0.07, 0.06, 0.07); void leaf; });
    { const [gx, , gz] = onRoad(132, ROAD_W / 2 + 1.6); B.box(wood, gx - 1.3, 0.2, gz - 0.05, gx + 1.3, 0.3, gz + 0.05).box(wood, gx - 1.3, 1.0, gz - 0.05, gx + 1.3, 1.1, gz + 0.05); }
    // a ladder against a tree and a basket of apples
    B.rod(wood, [109.5, 0, roadZ(109) + 9.7], [109.9, 3.3, roadZ(109) + 10.6], 0.04).rod(wood, [110.2, 0, roadZ(109) + 9.6], [110.6, 3.3, roadZ(109) + 10.5], 0.04); for (let k = 1; k < 8; k++) B.rod(wood, [109.5 + 0.05 * k, k * 0.42, roadZ(109) + 9.7 + 0.11 * k], [110.2 + 0.05 * k, k * 0.42, roadZ(109) + 9.6 + 0.11 * k], 0.02);
    { const bx = 121, bz = roadZ(121) + 9; B.cyl(M.wood("#b88a4a", 0.9), bx, 0.22, bz, 0.32, 0.44); for (let k = 0; k < 9; k++) B.sph(ap, bx + 0.2 * Math.cos(k * 0.7), 0.46 + 0.04 * (k % 2), bz + 0.2 * Math.sin(k * 0.7), 0.075); solid("basket", bx - 0.32, bz - 0.32, bx + 0.32, bz + 0.32, 0.5); } }
  // the farm: a white clapboard house with a porch, a red barn with a gambrel roof, a silo, a windmill pump, hay
  { const fx = P.farmX, fz = P.farmZ, clap = wmat("clap", S.boards("clap", 10, 0.6, 1), 1.0, { color: "#f2eee4" }), shing = M.slate();
    // house
    B.box(clap, fx - 6, 0, fz - 4, fx + 6, 6.4, fz + 4); B.slab(shing, fx, 7.7, fz + 2.1, 12.8, 0.18, 5.2, [-0.6, 0, 0]).slab(shing, fx, 7.7, fz - 2.1, 12.8, 0.18, 5.2, [0.6, 0, 0]); for (const sx of [-1, 1]) A(tri([fx + sx * 6, 6.4, fz - 4], [fx + sx * 6, 6.4, fz + 4], [fx + sx * 6, 9.0, fz]), lam("gableW", () => ({ color: "#f2eee4", side: THREE.DoubleSide, roughness: 0.9 })), true);
    for (let i = 0; i < 4; i++) for (const y of [1.2, 4.2]) { const x = fx - 4.5 + i * 3; if (y < 2 && i === 1) continue; B.box(M.glass(), x - 0.5, y, fz + 4.0, x + 0.5, y + 1.5, fz + 4.04).box(white, x - 0.6, y - 0.08, fz + 4.02, x + 0.6, y, fz + 4.12).box(M.paint("#2f4a3a", 0.6), x - 0.95, y, fz + 4.02, x - 0.58, y + 1.5, fz + 4.08).box(M.paint("#2f4a3a", 0.6), x + 0.58, y, fz + 4.02, x + 0.95, y + 1.5, fz + 4.08); }
    B.box(M.paint("#6a2a22", 0.5), fx - 2.0, 0, fz + 4.0, fx - 1.0, 2.3, fz + 4.06).box(wood, fx - 6.2, 0, fz + 4, fx + 6.2, 0.4, fz + 6.4).slab(shing, fx, 3.2, fz + 5.3, 12.6, 0.12, 2.8, [-0.25, 0, 0]); for (let x = fx - 6; x <= fx + 6.01; x += 2.4) B.cyl(white, x, 1.6, fz + 6.2, 0.07, 2.6);
    B.box(M.brick(), fx + 3.5, 6, fz - 1, fx + 4.3, 10.2, fz - 0.2); solid("house", fx - 6.2, fz - 4, fx + 6.2, fz + 6.4, 9);
    // barn
    { const bx = fx + 30, bz = fz - 12, sh = new THREE.Shape(); sh.moveTo(-7, 0); sh.lineTo(7, 0); sh.lineTo(7, 6); sh.lineTo(5, 9.5); sh.lineTo(0, 11); sh.lineTo(-5, 9.5); sh.lineTo(-7, 6); sh.lineTo(-7, 0);
      const eg = new THREE.ExtrudeGeometry(sh, { depth: 16, bevelEnabled: false }); eg.translate(bx, 0, bz - 8); A(eg, wmat("barnRed", S.boards("barn", 8, 0.75, 1), 1.2, { color: "#a8332a" }), true);
      for (const [a, b, c, d] of [[[-7.4, 5.8], [-5.2, 9.7]], [[-5.2, 9.7], [0, 11.3]], [[0, 11.3], [5.2, 9.7]], [[5.2, 9.7], [7.4, 5.8]]].map(([p, q]) => [p[0], p[1], q[0], q[1]])) { const mx = (a + c) / 2, my = (b + d) / 2, l = Math.hypot(c - a, d - b); B.slab(shing, bx + mx, my + 0.12, bz, l + 0.3, 0.16, 16.8, [0, 0, Math.atan2(d - b, c - a)]); }
      B.box(white, bx - 2.6, 0, bz + 8.0, bx + 2.6, 4.6, bz + 8.08); B.rod(white, [bx - 2.6, 0, bz + 8.1], [bx + 2.6, 4.6, bz + 8.1], 0.08).rod(white, [bx + 2.6, 0, bz + 8.1], [bx - 2.6, 4.6, bz + 8.1], 0.08); B.box(white, bx - 1, 7, bz + 8.0, bx + 1, 8.6, bz + 8.08);
      solid("barn", bx - 7, bz - 8, bx + 7, bz + 8.2, 11);
      B.cyl(M.metal("#b8c0c8", 0.5), bx + 11, 7, bz - 2, 3, 14).sph(M.metal("#b8c0c8", 0.4), bx + 11, 14, bz - 2, 3.05, 2.2, 3.05); solid("silo", bx + 8, bz - 5, bx + 14, bz + 1, 16);
      for (let i = 0; i < 4; i++) { const hx = bx - 12 + i * 4.2, hz = bz + 14 + (i % 2) * 2; B.sph(pmat("#d8b860", 1), hx, 1.3, hz, 1.8, 1.6, 1.8); solid("hay", hx - 1.8, hz - 1.8, hx + 1.8, hz + 1.8, 2.9); } }
    // windmill pump: a lattice tower and a turning wheel of blades with its tail
    { const mx = fx - 22, mz = fz + 18, mt = M.metal("#9aa4ae", 0.55); for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) B.rod(mt, [mx + a * 1.4, 0, mz + b * 1.4], [mx + a * 0.25, 12, mz + b * 0.25], 0.06);
      for (let y = 1.5; y < 12; y += 2) { const w = 1.4 - (1.15 * y) / 12; for (const [a, b, c, d] of [[-1, -1, 1, -1], [1, -1, 1, 1], [1, 1, -1, 1], [-1, 1, -1, -1]]) B.rod(mt, [mx + a * w, y, mz + b * w], [mx + c * w, y, mz + d * w], 0.035); }
      solid("windmill", mx - 1.5, mz - 1.5, mx + 1.5, mz + 1.5, 13);
      const head = new THREE.Group(); head.position.set(mx, 12.4, mz); Gp.add(head); const wheel = new THREE.Group(); wheel.position.set(0, 0, 0.6); head.add(wheel); refs.mill = wheel; const hb = new Batch(), bl = M.metal("#e8ecf0", 0.4);
      for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2; hb.slab(bl, 1.25 * Math.cos(a), 1.25 * Math.sin(a), 0, 1.5, 0.32, 0.02, [0.35, 0, a]); } const hub = new THREE.Mesh(new THREE.TorusGeometry(2.0, 0.05, 6, 40), bl); wheel.add(hub); hb.build(wheel);
      const tb = new Batch(); tb.box(mt, -0.1, -0.1, -2.6, 0.1, 0.1, 0.4).slab(M.paint("#a8332a", 0.6), 0, 0, -2.8, 0.03, 1.3, 1.4); tb.build(head); }
    // a hay cart by the barn, fence round the yard
    for (let x = fx - 30; x < fx + 50; x += 3) { B.cyl(wdark, x, 0.6, fz + 22, 0.06, 1.2); B.rod(wdark, [x, 1.0, fz + 22], [x + 3, 1.0, fz + 22], 0.04).rod(wdark, [x, 0.5, fz + 22], [x + 3, 0.5, fz + 22], 0.04); }
    trees([[fx - 14, fz - 6], [fx + 8, fz - 14], [fx - 30, fz - 20], [fx + 56, fz + 6]].map(([x, z], i) => ({ x, z, h: 14 + i * 2, k: i + 3 })));
  }
  // lone trees and hedges along the far edges of the fields; distant farms
  { const tr: TreeSpec[] = []; for (let i = 0; i < 26; i++) { const x = 160 + i * 22 + 7 * S.hash(i, 1, 50), side = i % 2 ? 1 : -1, z = roadZ(x) + side * (side > 0 ? 86 : 78) + 8 * S.hash(i, 2, 50); tr.push({ x, z, h: 10 + 6 * S.hash(i, 3, 50), k: i, slim: i % 5 === 0 }); } trees(tr); }
  { const tr: TreeSpec[] = []; for (let i = 0; i < 10; i++) { const x = 300 + i * 40 + 10 * S.hash(i, 9, 51); tr.push({ x, z: roadZ(x) - 11 - 3 * S.hash(i, 7, 51), h: 12 + 5 * S.hash(i, 8, 51), k: i + 2 }); } trees(tr); tr.forEach((t) => { solid("roadside tree", t.x - 0.4, t.z - 0.4, t.x + 0.4, t.z + 0.4, t.h); const r = t.h * 0.36; solid("tree canopy", t.x - r, t.z - r, t.x + r, t.z + r, t.h * 1.0, t.h * 0.3); }); }
  B.build(Gp);
  // the photographer's camera on its tripod at the finish
  { const T = refs.tripod; Gp.add(T); const tb = new Batch(), w2 = M.wood("#8a5a34", 0.5); for (const [a, b] of [[0.45, 0], [-0.25, 0.4], [-0.25, -0.4]]) tb.rod(w2, [0, 1.3, 0], [a, 0, b], 0.025); tb.box(M.wood("#5a3622", 0.4), -0.22, 1.3, -0.2, 0.22, 1.62, 0.2).box(pmat("#16161a", 0.6), 0.22, 1.35, -0.16, 0.5, 1.58, 0.16).cyl(M.brass(), 0.55, 1.46, 0, 0.09, 0.12, undefined, [0, 0, Math.PI / 2]).cyl(pmat("#0a0a10", 0.05, 0.6), 0.62, 1.46, 0, 0.07, 0.02, undefined, [0, 0, Math.PI / 2]); tb.build(T); }
  for (let i = 0; i < 3; i++) { const c = makeCar(["#1c1c22", "#2a4a3a", "#8a1e1e"][i]); Gp.add(c.g); refs.cars.push(c); }
}
export const newORefs = (base: Refs): ORefs => ({ ...base, world: new THREE.Group(), cars: [], tape: [], bigWheel: new THREE.Group(), mill: new THREE.Group(), tripod: new THREE.Group(), bucket: new THREE.Group() });
