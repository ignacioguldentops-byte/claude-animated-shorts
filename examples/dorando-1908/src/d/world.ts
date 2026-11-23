// The world of "Cómo nació el maratón": Greece (490 BC and 1896) and England (1908) as one three.js scene, and the
// cast as 2D cards standing in it. update(shot, frame) poses everything for that frame.
import * as THREE from "three";
import { Pool, Actor, Fx } from "./pool";
import { NOINK } from "./ink";
import { CHAR, untone } from "./shade";
import { skyTex, SkyK } from "./pbr";
import { LIGHTS, LightK } from "./lights";
import { ctex, cloudHD } from "./paint";
import { Pen, figure, Char, Pose, fxPuff } from "./toon";
import { fxDust, fxSteam } from "./gearr";
import { TREE_T } from "./trees";
import { buildEngland, newERefs, ERefs } from "./setse";
import { SHOTS, B, V3, camAt, lerp, ramp, ease, dorAt, hayesAt, FIN, ROYAL, TUN, LANE, X0 } from "./story";
import { HE } from "./geo";
import { RUNNER08, runner08, steward, QUEEN, lady08, gent08 } from "./castg";
const CKEY = new WeakMap<Char, string>(), CC = new Map<string, Char>();
const memo = (k: string, make: () => Char) => { let c = CC.get(k); if (!c) { c = make(); CC.set(k, c); } return c; };
type Place = { seed?: number; crowd?: boolean; key: string; draw: (p: Pen) => void; x: number; y: number; z: number; scale: number; mirror?: boolean; roll?: number; faceUp?: boolean; sx?: number; sy?: number };
type FxPlace = { key: string; cw: number; ch: number; draw: (p: Pen) => void; x: number; y: number; z: number; w: number; h: number; flat?: boolean; fixed?: boolean; rot?: number; soft?: boolean; glow?: number; tint?: string };
type Stage = { places: Place[]; fx: FxPlace[] };
const tier = (d: number): [number, number, number] => d < 3.2 ? [1800, 3000, 3.0] : d < 6.5 ? [1080, 1800, 1.8] : d < 16 ? [480, 800, 0.8] : [240, 400, 0.4];
const q = (v: number, n = 120) => Math.round(v * n) / n;
const fkey = (o: object) => JSON.stringify(o, (_k, v) => (typeof v === "number" ? q(v) : v));
const LID = [0.5, 1, 1, 0.5];
const hs = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
const lidAt = (f: number, seed: number) => { let s = Math.round(-60 * hs(seed, 9)); for (let n = 0; s <= f && n < 400; n++) { const k = f - s; if (k >= 0 && k < 4) return LID[k]; s += Math.round(15 + 54 * hs(seed * 31 + n, 13)); } return 0; };
const lerp3v = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
export class World {
  root = new THREE.Group();
  private pool = new Pool();
  private actors: Actor[] = [];
  private fxs: Fx[] = [];
  private sun: THREE.DirectionalLight; private hemi: THREE.HemisphereLight;
  private sky: THREE.Mesh; private skyMat: THREE.MeshBasicMaterial; private envs: Partial<Record<SkyK, THREE.Texture>> = {}; private pmrem: THREE.PMREMGenerator | null = null;
  private fog = new THREE.Fog("#c9d6e6", 260, 3400);
  private cloudBank: THREE.Mesh[] = [];
  private cam = new THREE.Vector3(); private right = new THREE.Vector3(); private camU = new THREE.Vector3(); private camF = new THREE.Vector3(); private sunDir = new THREE.Vector3();
  private lightAngle = -2;
  private E: ERefs = newERefs();
  constructor() {
    const R = this.root;
    this.skyMat = new THREE.MeshBasicMaterial({ map: skyTex("day"), side: THREE.BackSide, depthWrite: false, fog: false });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(5000, 64, 32), this.skyMat); this.sky.renderOrder = -1; this.sky.frustumCulled = false; this.sky.layers.set(NOINK); R.add(this.sky);
    this.hemi = new THREE.HemisphereLight("#cfe6ff", "#6c5c8c", 0.0);
    this.sun = new THREE.DirectionalLight("#fff0d6", 3.6); this.sun.castShadow = true; this.sun.shadow.mapSize.set(2048, 2048); this.sun.shadow.radius = 3;
    R.add(this.hemi, this.sun, this.sun.target);
    buildEngland(R, this.E);
    for (let i = 0; i < 400; i++) this.actors.push(new Actor(R));
    for (let i = 0; i < 400; i++) this.fxs.push(new Fx(R));
  }
  private fig(st: Stage, ch: Char, seed: number, pos: V3, pose: Pose = {}, o: { scale?: number; roll?: number; sx?: number; sy?: number; f?: number; faceUp?: boolean; crowd?: boolean } = {}) {
    let ck = CKEY.get(ch); if (!ck) { ck = JSON.stringify(ch); CKEY.set(ch, ck); }
    const full: Pose = { blink: o.f !== undefined ? lidAt(o.f, seed) : 0, ...pose, light: this.lightAngle, seed };
    st.places.push({ seed, crowd: o.crowd, key: `G|${ck}|${fkey(full)}`, x: pos[0], y: pos[1], z: pos[2], scale: o.scale ?? 1, roll: o.roll, sx: o.sx, sy: o.sy, faceUp: o.faceUp, draw: (p) => figure(p, ch, full) });
  }
  private card(st: Stage, key: string, cw: number, chh: number, draw: (p: Pen) => void, pos: V3, w: number, h: number, o: Partial<FxPlace> = {}) { st.fx.push({ key, cw, ch: chh, draw, x: pos[0], y: pos[1], z: pos[2], w, h, ...o }); }
  private stage(_id: number, f: number): Stage {
    const st: Stage = { places: [], fx: [] };
    const G = (ch: Char, seed: number, pos: V3, pose: Pose = {}, o: Parameters<World["fig"]>[5] = {}) => this.fig(st, ch, seed, pos, pose, { f, ...o });
    const turn = (p: number[], t: number[]): Pose => { const dx = t[0] - p[0], dz = t[1] - p[1], lat = dx * this.right.x + dz * this.right.z, dep = dx * this.camF.x + dz * this.camF.z;
      return Math.abs(lat) > Math.abs(dep) * 0.8 ? { facing: (lat > 0 ? 1 : -1) as 1 | -1 } : dep > 0 ? { back: true } : { facing: 0 }; };
    const gr = (x: number, z: number): V3 => [x, HE(x, z) + 0.04, z];
    const HAYES = memo("hayes", () => ({ ...RUNNER08, hair: { k: "short" as const, c: "#8a5a34" }, stache: undefined, band: undefined, shorts: "#1f2f5c", sash: "#b8262e" }));
    const d = dorAt(f), p = d.p, r = this.right;
    // Dorando
    if (d.mode === "walk") G(RUNNER08, 200, [p[0], p[1] + 0.03 * Math.abs(Math.sin(f * 0.3)), p[2]], { legs: "walk", phase: f * 0.045, ...turn([p[0], p[2]], [p[0] + d.dir * 5, p[2]]), expr: "pant", sweat: 2, armL: "hang", armR: "hang", headTilt: 10 * Math.sin(f * 0.07) }, { roll: 0.09 * Math.sin(f * 0.11) });
    else if (d.mode === "fall") G(RUNNER08, 200, [p[0] + r.x * 0.95 * d.k, p[1] + 0.24 * d.k, p[2] + r.z * 0.95 * d.k], { expr: "dazed", armL: "up", armR: "up" }, { roll: 1.5 * ease(d.k), faceUp: d.k > 0.5 });
    else if (d.mode === "lie") G(RUNNER08, 200, [p[0] + r.x * 0.95, p[1] + 0.24, p[2] + r.z * 0.95], { expr: "dazed", armL: "up", armR: "hang" }, { roll: 1.5, faceUp: true });
    else if (d.mode === "up") { const k = 1 - d.k; G(RUNNER08, 200, [p[0] + r.x * 0.95 * k, p[1] + 0.24 * k, p[2] + r.z * 0.95 * k], { expr: "pained", armL: "low", armR: "low" }, { roll: 1.5 * k, faceUp: k > 0.5 }); }
    else if (d.mode === "held") G(RUNNER08, 200, [p[0], p[1] + 0.05, p[2]], { legs: "walk", phase: f * 0.04, facing: 0, expr: "dazed", sweat: 2, armL: "up", armR: "up", headTilt: 14 }, { roll: 0.05 * Math.sin(f * 0.1) });
    else if (d.mode === "stand") G(RUNNER08, 200, p, { facing: 0, expr: f > B.descal ? "nervous" : "pant", sweat: 2, armL: "hang", armR: f > B.descal ? "chin" : "hang" });
    else G(RUNNER08, 200, p, { back: f < B.copa, facing: 0, expr: "proud", armR: f > B.copa ? "up" : "reach", holdR: f > B.copa ? "cupS" : undefined, armL: "hip" });
    // the two officials who hold him up (they come running from the line), and wait with him after
    if (f > B.cae + 120 && f < B.reina - 20) for (const s of [-1, 1]) { const t = ease(ramp(f, B.cae + 120, B.jueces + 16)), home = gr(FIN[0] + s * 3.2, FIN[2] - 3.6), at = gr(p[0] + 0.2, p[2] + s * 0.72), q: V3 = f < B.jueces + 16 ? lerp3v(home, at, t) : at;
      const moving = f < B.jueces + 16 && t > 0 && t < 1, held = f >= B.jueces + 16 && f < B.meta + 10;
      G(memo("stw" + s, () => steward(s > 0 ? 1 : 2)), 240 + s, q, { ...(moving || held ? { legs: "walk" as const, phase: f * 0.05 + s } : {}), ...turn([q[0], q[2]], [p[0], p[2]]), expr: held ? "determined" : "nervous", armR: held ? "reach" : "front", armL: held ? "reach" : "hang" }); }
    else if (f <= B.cae + 120) for (const s of [-1, 1]) { const q = gr(FIN[0] + s * 3.2, FIN[2] - 3.6); G(memo("stw" + s, () => steward(s > 0 ? 1 : 2)), 240 + s, q, { ...turn([q[0], q[2]], [p[0], p[2]]), expr: f > B.cae ? "shock" : "nervous", armR: f > B.gira - 20 && f < B.gira + 50 ? "point" : "hang", armL: "hip" }); }
    // the doctor in a top hat by the line
    { const q = gr(FIN[0] - 5.5, FIN[2] - 3.2); G(memo("doc", () => ({ ...gent08(2), hat: { k: "top" as const, c: "#23202a" } })), 250, q, { ...turn([q[0], q[2]], [p[0], p[2]]), expr: f > B.cae ? "shock" : "stern", armR: f > B.descal ? "point" : "hang", holdR: f > B.veras ? "paper" : "watch", armL: "hip" }); }
    // the American comes in and wins; he gets the medal
    if (f > B.hayes - 4 && f < B.reina - 20) { const h = hayesAt(f), done = f > B.hayes + 80;
      G(HAYES, 210, h, done ? { facing: 0, expr: f > B.oro ? "proud" : "laugh", armL: "up", armR: f > B.oro ? "up" : "up", holdR: f > B.oro ? "medal" : undefined } : { legs: "run", phase: f * 0.075, ...turn([h[0], h[2]], [h[0] - 5, h[2]]), expr: "determined", sweat: 1 }); }
    // the royal box
    { const done = f > B.reina; G(QUEEN, 230, ROYAL, { facing: 0, expr: done ? "smile" : f > B.meta ? "nervous" : "smile", armR: done && f < B.copa ? "reach" : f > B.copa ? "wave" : "hang", holdR: done && f < B.copa ? "cupS" : undefined, armL: "hip" });
      G(memo("rl1", () => lady08(5)), 231, [ROYAL[0] - 2.3, ROYAL[1], ROYAL[2] - 0.4], { facing: 1, expr: f > B.cae ? "shock" : "smile", armL: f > B.cae && f < B.meta ? "mouth" : "hang" });
      G(memo("rg1", () => gent08(3)), 232, [ROYAL[0] + 2.4, ROYAL[1], ROYAL[2] - 0.4], { facing: -1, expr: f > B.copa ? "grin" : "stern", armR: f > B.copa ? "up" : "hang", holdR: f > B.copa ? "hatW" : undefined });
      G(memo("rg2", () => gent08(6)), 234, [ROYAL[0] - 4.6, ROYAL[1], ROYAL[2] - 0.8], { facing: 1, expr: "smile", armL: f > B.copa ? "up" : "hang" }); }
    void TUN; void LANE; void X0;
    return st;
  }
  update(id: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene, gl?: THREE.WebGLRenderer) {
    const s = SHOTS[id - 1], L = LIGHTS[s.light as LightK];
    const c = camAt(id, f);
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll); cam.fov = c.fov; cam.near = 0.1; cam.far = 6000; cam.updateProjectionMatrix(); cam.updateMatrixWorld(); cam.layers.enable(NOINK);
    const focus = new THREE.Vector3(...c.look), dist = cam.position.distanceTo(focus);
    const yaw = THREE.MathUtils.degToRad(s.sun ? s.sun[0] : 200), el = THREE.MathUtils.degToRad(s.sun ? s.sun[1] : 45);
    this.sunDir.set(Math.sin(yaw) * Math.cos(el), Math.sin(el), Math.cos(yaw) * Math.cos(el)).normalize();
    this.cam.copy(cam.position); this.right.set(1, 0, 0).applyQuaternion(cam.quaternion); this.camU.set(0, 1, 0).applyQuaternion(cam.quaternion); this.camF.set(0, 0, -1).applyQuaternion(cam.quaternion);
    this.lightAngle = Math.round(Math.atan2(-this.sunDir.y, this.sunDir.dot(this.right)) / (Math.PI / 4)) * (Math.PI / 4);
    const P = { c: "#fff2de", i: 3.6, sky: "day" as SkyK, env: "day" as SkyK, ei: 0.9 };
    this.sun.color.set(P.c); this.sun.intensity = P.i;
    if (gl) { if (!this.pmrem) this.pmrem = new THREE.PMREMGenerator(gl); let e = this.envs[P.env]; if (!e) { e = this.pmrem.fromEquirectangular(skyTex(P.env)).texture; this.envs[P.env] = e; } scene.environment = e; scene.environmentIntensity = P.ei; }
    const skyRot = yaw - Math.atan2(-Math.cos(0.3 * Math.PI * 2), Math.sin(0.3 * Math.PI * 2));
    this.skyMat.map = skyTex(P.sky); this.sky.rotation.y = skyRot; scene.environmentRotation.y = skyRot;
    const groundY = HE(c.pos[0], c.pos[2]), high = c.pos[1] - groundY;
    const Rr = THREE.MathUtils.clamp(Math.max(dist * 1.2 + 10, high * 1.6), 16, 140);
    this.sun.position.copy(focus).addScaledVector(this.sunDir, 400); this.sun.target.position.copy(focus);
    const sc = this.sun.shadow.camera; sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = 50; sc.far = 900; sc.updateProjectionMatrix();
    this.sun.shadow.bias = L.bias; this.sun.shadow.normalBias = L.normalBias * (Rr / 12);
    CHAR.uCharTint.value.set(...L.charTint); CHAR.uCharShade.value = L.charShade; CHAR.uGrad.value = L.charGrad; CHAR.uBodyGrad.value = L.bodyGrad; CHAR.uSideTint.value.set(...L.sideTint);
    this.sky.position.copy(cam.position);
    untone("#c9d6e6", this.fog.color); scene.fog = this.fog; scene.background = null;
    // regions, eras, tree tiles, grass
    this.E.eng.visible = true;
    const vis = (t: { g: THREE.Group; x: number; z: number }, r: number) => { const d = Math.hypot(t.x - c.pos[0], t.z - c.pos[2]); t.g.visible = d < r + high * 2; };
    for (const t of this.E.tiles) vis(t, 720);
    { const dx = c.look[0] - c.pos[0], dz = c.look[2] - c.pos[2], dl = Math.hypot(dx, dz) || 1, k = Math.min(dl, 9) / dl; for (const g of this.E.grass) { g.follow(c.pos[0] + dx * k, c.pos[2] + dz * k); g.mesh.visible = high < 30; } }
    TREE_T.value = f / 30;
    for (const cr of this.E.crowds) cr.tick(f, f > B.meta - 30 && f < B.descal ? 1 : f < B.londres ? 0.8 : 0.45);
    // ---- cast ----
    const st = this.stage(id, f);
    const reqs: { a: Actor; p: Place }[] = [];
    this.actors.forEach((a) => (a.mesh.visible = false)); this.fxs.forEach((x) => (x.mesh.visible = false));
    st.places.slice(0, this.actors.length).forEach((p, i) => { const a = this.actors[i], d = cam.position.distanceTo(new THREE.Vector3(p.x, p.y + 1.2 * p.scale, p.z)) / p.scale; const [w, h, k] = tier(d); a.r = this.pool.req(p.key, w, h, k, p.draw); reqs.push({ a, p }); });
    const fr: { e: Fx; p: FxPlace }[] = [];
    st.fx.slice(0, this.fxs.length).forEach((p, i) => { const e = this.fxs[i]; e.r = this.pool.req(p.key, p.cw, p.ch, 1, p.draw); fr.push({ e, p }); });
    this.pool.flush();
    for (const { a, p } of reqs) { a.bind(); const m = a.mesh; m.visible = true; m.position.set(p.x, p.y, p.z); const yawA = Math.atan2(cam.position.x - p.x, cam.position.z - p.z);
      if (p.faceUp) { m.rotation.set(0, 0, 0); m.lookAt(cam.position); m.rotateZ(p.roll ?? 0); } else { m.rotation.set(0, 0, 0); m.rotateY(yawA); m.rotateZ(p.roll ?? 0); }
      m.scale.set((p.mirror ? -1 : 1) * p.scale * (p.sx ?? 1), p.scale * (p.sy ?? 1), p.scale); m.castShadow = true; }
    for (const { e, p } of fr) { e.use(!!p.soft); e.bind(); e.soft.color.setScalar(p.glow ?? 1); e.mat.color.setScalar(p.glow ?? 1); const m = e.mesh; m.visible = true; m.position.set(p.x, p.y, p.z); m.scale.set(p.w, p.h, 1);
      if (p.flat) m.rotation.set(-Math.PI / 2, 0, p.rot ?? 0); else if (p.fixed) m.rotation.set(0, 0, p.rot ?? 0); else { m.rotation.set(0, 0, 0); m.lookAt(cam.position); if (p.rot) m.rotateZ(p.rot); } }
    return focus;
  }
}
void ctex; void fxDust; void figure; void cloudHD; void lerp; void ramp;
