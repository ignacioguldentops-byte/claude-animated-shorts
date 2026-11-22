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
import { buildGreece, newGRefs, GRefs } from "./setsg";
import { buildEngland, newERefs, ERefs } from "./setse";
import { SHOTS, B, V3, camAt, clamp01, lerp, ramp, ease, messAt, histAt, STOP, runner96At, RUNNERS96, LOUIS_I, louisAt, TAV_STOP, START_X, runner08At, RUN08, leaderAt, ROYAL, FIN, ERA_SWITCH, ENG_SWITCH, cloudWhite } from "./story";
import { H, HE, onRoad, roadZ, roadDir, GATE_X, CAMP_X, TAV_X, ENG, WCITY, STAD } from "./geo";
import { MESSENGER, hoplite, athenian, HISTORIAN, LINGUIST, WATERMAN, runner96, greek, officer, STARTER, TAVERNER, RUNNER08, runner08, steward, QUEEN, lady08, gent08 } from "./castg";
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
  private G: GRefs = newGRefs(); private E: ERefs = newERefs();
  constructor() {
    const R = this.root;
    this.skyMat = new THREE.MeshBasicMaterial({ map: skyTex("day"), side: THREE.BackSide, depthWrite: false, fog: false });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(5000, 64, 32), this.skyMat); this.sky.renderOrder = -1; this.sky.frustumCulled = false; this.sky.layers.set(NOINK); R.add(this.sky);
    this.hemi = new THREE.HemisphereLight("#cfe6ff", "#6c5c8c", 0.0);
    this.sun = new THREE.DirectionalLight("#fff0d6", 3.6); this.sun.castShadow = true; this.sun.shadow.mapSize.set(4096, 4096); this.sun.shadow.radius = 3;
    R.add(this.hemi, this.sun, this.sun.target);
    buildGreece(R, this.G); buildEngland(R, this.E);
    // a bank of cloud over Athens and over England for the crossing
    const maps = [0, 1, 2, 3].map((k) => cloudHD(k));
    for (let i = 0; i < 140; i++) { const eng = i >= 70, j = i % 70, m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: maps[i % 4], color: new THREE.Color(1.15, 1.15, 1.17), transparent: true, depthWrite: false, fog: false }));
      const x = (eng ? ENG + 80 : -20) + (hs(j, 1) - 0.5) * 300, y = 150 + 160 * hs(j, 2), z = 30 + (hs(j, 3) - 0.5) * 260, s = 60 + 90 * hs(j, 4); m.position.set(x, y, z); m.scale.set(s, s * 0.55, 1); m.layers.set(NOINK); m.renderOrder = 2; this.cloudBank.push(m); R.add(m); }
    for (let i = 0; i < 400; i++) this.actors.push(new Actor(R));
    for (let i = 0; i < 400; i++) this.fxs.push(new Fx(R));
  }
  private fig(st: Stage, ch: Char, seed: number, pos: V3, pose: Pose = {}, o: { scale?: number; roll?: number; sx?: number; sy?: number; f?: number; faceUp?: boolean; crowd?: boolean } = {}) {
    let ck = CKEY.get(ch); if (!ck) { ck = JSON.stringify(ch); CKEY.set(ch, ck); }
    const full: Pose = { blink: o.f !== undefined ? lidAt(o.f, seed) : 0, ...pose, light: this.lightAngle, seed };
    st.places.push({ seed, crowd: o.crowd, key: `G|${ck}|${fkey(full)}`, x: pos[0], y: pos[1], z: pos[2], scale: o.scale ?? 1, roll: o.roll, sx: o.sx, sy: o.sy, faceUp: o.faceUp, draw: (p) => figure(p, ch, full) });
  }
  private card(st: Stage, key: string, cw: number, chh: number, draw: (p: Pen) => void, pos: V3, w: number, h: number, o: Partial<FxPlace> = {}) { st.fx.push({ key, cw, ch: chh, draw, x: pos[0], y: pos[1], z: pos[2], w, h, ...o }); }
  private stage(id: number, f: number): Stage {
    const st: Stage = { places: [], fx: [] };
    const G = (ch: Char, seed: number, pos: V3, pose: Pose = {}, o: Parameters<World["fig"]>[5] = {}) => this.fig(st, ch, seed, pos, pose, { f, ...o });
    const K = (key: string, cw: number, chh: number, draw: (p: Pen) => void, pos: V3, w: number, h2: number, o: Partial<FxPlace> = {}) => this.card(st, key, cw, chh, draw, pos, w, h2, o);
    const turn = (p: number[], t: number[]): Pose => { const dx = t[0] - p[0], dz = t[1] - p[1], lat = dx * this.right.x + dz * this.right.z, dep = dx * this.camF.x + dz * this.camF.z;
      return Math.abs(lat) > Math.abs(dep) * 0.8 ? { facing: (lat > 0 ? 1 : -1) as 1 | -1 } : dep > 0 ? { back: true } : { facing: 0 }; };
    const runPose = (p: V3, hx: number, hz: number, seed: number, extra: Pose = {}): Pose => ({ legs: "run", phase: f * 0.075 + seed * 0.37, ...turn([p[0], p[2]], [p[0] + hx * 5, p[2] + hz * 5]), ...extra });
    const dust = (x: number, y: number, z: number, k: number, size = 0.5) => { const tt = (((k % 16) + 16) % 16) / 16; K(`puff|${Math.round(tt * 16)}`, 300, 260, (p) => fxPuff(p, tt), [x, y + 0.18 + tt * 0.25, z], size * (0.6 + tt), size * 0.87 * (0.6 + tt), { soft: true }); };
    const smoke = (p: V3, n: number, seed = 0) => { for (let i = 0; i < n; i++) { const tt = (f * 0.012 + i / n + seed) % 1, s = lerp(0.6, 3.2, tt); K("smokeL", 128, 128, (pp) => fxSteam(pp, false), [p[0] + 0.8 * Math.sin(i * 2.1 + tt * 3) + 2.5 * tt, p[1] + 6 * tt, p[2] + 0.6 * Math.cos(i * 1.3 + tt * 2)], s, s, { soft: true, glow: 0.62 }); } };
    const ground = (x: number, z: number): V3 => [x, x > 3000 ? HE(x, z) : H(x, z), z];
    if (id === 1) {
      // ---- 490 BC ----
      const m = messAt(f), p = m.p, [dx, dz] = roadDir(Math.min(CAMP_X, Math.max(GATE_X, p[0])));
      if (m.mode === "run" || m.mode === "path") { const hd: [number, number] = m.mode === "path" ? [0.25, -1] : p[0] > GATE_X ? [-dx, -dz] : [-1, (STOP[2] - 0.6) * 0.03]; G(MESSENGER, 1, [p[0], p[1] + 0.05 * Math.abs(Math.sin(f * 0.47)), p[2]], runPose(p, hd[0], hd[1], 1, { expr: m.mode === "path" ? "pant" : "determined", sweat: 1 }), { roll: 0.025 * Math.sin(f * 0.47) });
        if (f % 5 < 3 && p[0] < 3000) dust(p[0] - hd[0] * 0.5, p[1], p[2] - hd[1] * 0.5, f, 0.4); }
      else if (m.mode === "stand") G(MESSENGER, 1, p, f < B.momento ? { expr: f < B.grita ? "pant" : "laugh", armL: "up", armR: f < B.grita ? "up" : Math.sin(f * 0.3) > 0 ? "up" : "wave", sweat: 2, facing: 0 } : { ...turn([p[0], p[2]], [GATE_X, -10]), expr: "nervous", armL: "hip", armR: "chin" });
      else if (m.mode === "fall") { const r = this.right; G(MESSENGER, 1, [p[0] + r.x * 0.95 * m.k, lerp(p[1], p[1] + 0.24, m.k), p[2] + r.z * 0.95 * m.k], { expr: "dazed", armL: "up", armR: "hang" }, { roll: 1.5 * ease(m.k), faceUp: m.k > 0.5 }); }
      else if (m.mode === "lie") { const r = this.right; G(MESSENGER, 1, [p[0] + r.x * 0.95, p[1] + 0.24, p[2] + r.z * 0.95], { expr: f < B.levanta - 30 ? "dazed" : "nervous", armL: "up", armR: "hang", blink: f < B.levanta - 30 ? 1 : 0 }, { roll: 1.5, faceUp: true }); }
      else { const r = this.right, k = 1 - m.k; G(MESSENGER, 1, [p[0] + r.x * 0.95 * k, p[1] + 0.24 * k + 0.25 * Math.sin(Math.PI * m.k), p[2] + r.z * 0.95 * k], { expr: "shock", armL: "up", armR: "up" }, { roll: 1.5 * k, faceUp: k > 0.5 }); }
      // the army cheering him off at the camp
      if (f < B.mensajero + 30) for (let i = 0; i < 10; i++) { const x = CAMP_X - 6 + i * 2.4, sd = -1, pp = onRoad(Math.min(x, CAMP_X), sd * (4.2 + 2.2 * hs(i, 3))); const xx = x > CAMP_X ? x : pp[0], zz = x > CAMP_X ? roadZ(CAMP_X) + sd * (4.2 + 2.2 * hs(i, 3)) : pp[2], q = ground(xx, zz);
        const up = Math.sin(f * 0.21 + i) > 0; G(memo("hop" + i, () => hoplite(i)), 10 + i, q, { ...turn([q[0], q[2]], [p[0], p[2]]), expr: up ? "laugh" : "grin", armR: up ? "up" : "wave", holdR: i % 3 === 0 ? "spear" : undefined, armL: i % 3 === 0 ? "front" : "up", holdL: i % 3 === 0 ? "shield" : undefined }); }
      if (f < B.mensajero + 60) for (const sp of this.G.smoke) smoke(sp, 6, sp[0] * 0.01);
      // Athens: guards at the gate, the citizens of the agora, the historian
      if (f > B.mensajero) {
        for (const s of [-1, 1]) { const q = ground(GATE_X - 7, s * 5.4); G(memo("guard" + s, () => hoplite(s > 0 ? 5 : 6)), 30 + s, q, { ...turn([q[0], q[2]], [STOP[0], STOP[2]]), expr: f > B.cae ? "shock" : "stern", armR: "hang", holdR: "spear", armL: "front", holdL: "shield" }); }
        for (let i = 0; i < 18; i++) { const sd = i % 2 ? 1 : -1, k = i >> 1, a0 = sd * (0.45 + k * 0.13 + 0.05 * hs(i, 4)), r0 = 4.6 + (k % 2) * 1.3 + 0.3 * hs(i, 5), a1 = sd * (0.1 + k * 0.1), r1 = k % 2 ? 3.9 : 2.85;
          // they rush in round him when he falls, and scatter back when he jumps up again
          const gt = ease(ramp(f, B.cae + 4, B.cae + 36)) * (1 - ease(ramp(f, B.levanta - 2, B.levanta + 18))), a = lerp(a0, a1, gt), r = lerp(r0, r1, gt), q = ground(STOP[0] + r * Math.cos(a), STOP[2] + r * Math.sin(a)), moving = (f > B.cae + 4 && f < B.cae + 44) || (f > B.levanta - 2 && f < B.levanta + 20); const arrived = f > B.llega + 10, shocked = f > B.cae, up = f > B.levanta;
          G(memo("ath" + i, () => athenian(i)), 40 + i, q, { ...(moving ? { legs: "walk" as const, phase: f * 0.06 + i * 0.3 } : {}), ...turn([q[0], q[2]], up && f > B.esparta + 10 ? [GATE_X, -20] : [STOP[0], STOP[2]]), expr: up ? (i % 2 ? "shock" : "nervous") : shocked ? "shock" : arrived ? (i % 3 ? "laugh" : "grin") : "neutral", armL: shocked && !up ? "up" : arrived && !shocked && i % 2 ? "up" : "hang", armR: up && i % 3 === 0 ? "point" : shocked && !up ? "mouth" : arrived && !shocked ? "wave" : "hang" }); }
        if (f > B.herodoto - 24) { const hp = histAt(f), walking = f < B.herodoto + 50; G(HISTORIAN, 60, hp, walking ? { legs: "walk", phase: f * 0.04, ...turn([hp[0], hp[2]], [STOP[0], STOP[2]]), expr: "stern", armR: [50, 34, 6], holdR: "scroll", armL: "chin" } : { ...turn([hp[0], hp[2]], [STOP[0], STOP[2]]), expr: f > B.esparta ? "proud" : "stern", armR: [50, 34, 6], holdR: "scroll", armL: f > B.levanta + 10 ? "point" : "chin" }); }
      }
    } else if (id === 2) {
      // ---- 1896 ----
      for (let i = 0; i < RUNNERS96; i++) { if (i === LOUIS_I) continue; const p = runner96At(i, f); if (f > B.taberna + 40) break; const ch = memo("r96" + i, () => runner96(i)), [dx, dz] = roadDir(p[0]);
        if (f < B.bang) G(ch, 100 + i, p, { ...turn([p[0], p[2]], [p[0] - 5, p[2]]), expr: i % 3 ? "determined" : "nervous", armL: i % 4 === 0 ? "hip" : "hang", armR: i % 4 === 1 ? "chin" : "hang" });
        else { G(ch, 100 + i, [p[0], p[1] + 0.05 * Math.abs(Math.sin(f * 0.47 + i)), p[2]], runPose(p, -dx, -dz, 100 + i, { expr: i % 2 ? "determined" : "pained" })); if ((f + i * 3) % 6 < 2) dust(p[0] + dx * 0.4, p[1], p[2] + dz * 0.4, f + i, 0.35); } }
      { const l = louisAt(f), p = l.p, [dx, dz] = roadDir(Math.max(GATE_X, p[0]));
        if (l.mode === "run" || l.mode === "track") { G(WATERMAN, 120, [p[0], p[1] + 0.05 * Math.abs(Math.sin(f * 0.47)), p[2]], runPose(p, l.mode === "track" ? -1 : -dx, l.mode === "track" ? 0 : -dz, 120, { expr: f < B.bang ? "determined" : l.mode === "track" ? "laugh" : "determined", sweat: 1 })); if (f % 5 < 2 && l.mode === "run") dust(p[0] + dx * 0.4, p[1], p[2] + dz * 0.4, f, 0.38); }
        else if (f < B.bang) G(WATERMAN, 120, runner96At(LOUIS_I, f), { ...turn([p[0], p[2]], [p[0] - 5, p[2]]), expr: "proud", armL: "hip", armR: "hang" });
        else if (l.mode === "stop") G(WATERMAN, 120, p, { ...turn([p[0], p[2]], [TAV_STOP[0] + 0.6, TAV_STOP[2] + 1.4]), expr: "pant", armR: "reach", armL: "hip", sweat: 2 });
        else G(WATERMAN, 120, p, { facing: 0, expr: f < B.copa ? "grin" : "laugh", armR: "eat", holdR: "glass", armL: f < B.copa ? "hip" : "up", sweat: 1 });
        if (l.mode === "track") for (const s of [-1, 1]) { const q = ground(p[0] + (s > 0 ? -1.0 : 0.9), p[2] - (s > 0 ? 1.5 : 3.0)); G(memo("off" + s, () => officer(s > 0 ? 1 : 2)), 130 + s, [q[0], q[1] + 0.05 * Math.abs(Math.sin(f * 0.47 + s)), q[2]], runPose(q, -1, 0, 130 + s, { expr: "laugh" })); } }
      if (f < B.gano + 40) { const lp = onRoad(START_X - 4, 7.6), sp = onRoad(START_X + 1.6, 4.8);
        G(LINGUIST, 140, lp, { ...turn([lp[0], lp[2]], [START_X - 4, roadZ(START_X)]), expr: f > B.trofeo ? "proud" : "smile", armR: f > B.trofeo ? "point" : "hip", armL: "hip" });
        G(STARTER, 141, sp, { ...turn([sp[0], sp[2]], [START_X - 6, roadZ(START_X)]), expr: f > B.bang - 30 ? "determined" : "smile", armR: f > B.bang - 40 ? "up" : "hang", holdR: "pistol", armL: "hip" });
        if (f >= B.bang && f < B.bang + 22) { const k = (f - B.bang) / 22; K(`puff|${Math.round(k * 16)}`, 300, 260, (pp) => fxPuff(pp, k), [sp[0] + 0.2, sp[1] + 2.3 + 0.4 * k, sp[2]], 0.5 + 0.6 * k, 0.45 + 0.5 * k, { soft: true }); }
        for (let i = 0; i < 16; i++) { const sd = i % 2 ? 1 : -1, x = START_X - 12 + (i >> 1) * 3.3 + 1.2 * hs(i, 2), q = onRoad(x, sd * (6.3 + 1.4 * hs(i, 3) + (i % 4 > 1 ? 1.3 : 0))); if (Math.hypot(q[0] - lp[0], q[2] - lp[2]) < 1.2 || Math.hypot(q[0] - sp[0], q[2] - sp[2]) < 1.2) continue;
          const go = f > B.bang; G(memo("gr" + i, () => greek(i)), 150 + i, q, { ...turn([q[0], q[2]], go ? [START_X - 30, roadZ(START_X - 30)] : [START_X, roadZ(START_X)]), expr: go ? "laugh" : "smile", armR: go ? "up" : i % 3 === 0 ? "wave" : "hang", holdR: i % 5 === 0 ? "flagGR" : i % 5 === 2 && go ? "hatW" : undefined, armL: go && i % 2 ? "up" : "hang" }); } }
      if (f > B.gano + 20 && f < B.estadio) { const tp = onRoad(TAV_X + 2.3, 4.9); G(TAVERNER, 160, tp, { ...turn([tp[0], tp[2]], [TAV_STOP[0], TAV_STOP[2]]), expr: f > B.copa ? "laugh" : "grin", armR: f < B.taberna + 6 ? "front" : "hip", holdR: f < B.taberna + 6 ? "glass" : undefined, armL: "hip" });
        for (const [k, lx, lz] of [[0, -3.5, 6.4], [1, 0.5, 6.2], [2, 3.8, 6.6]] as number[][]) { const q = onRoad(TAV_X + lx - 0.95, lz + 0.35); G(memo("tv" + k, () => greek(k + 20)), 161 + k, [q[0], q[1] - 0.2, q[2]], { legs: "sit", ...turn([q[0], q[2]], [TAV_STOP[0], TAV_STOP[2]]), expr: f > B.copa ? "laugh" : "smile", armR: f > B.copa ? "up" : "front", holdR: "glass" }); } }
    } else {
      // ---- England, 1908 ----
      const bang = B.windsor + 8;
      if (f < B.palco + 20) for (let i = 0; i < RUN08; i++) { const p = runner08At(i, f), ch = i === 0 ? RUNNER08 : memo("r08" + i, () => runner08(i)); if (f < bang) G(ch, 200 + i, p, { ...turn([p[0], p[2]], [p[0] + 5, p[2]]), expr: i % 2 ? "determined" : "nervous", armL: "hang", armR: i % 3 ? "hang" : "hip" });
        else G(ch, 200 + i, [p[0], p[1] + 0.05 * Math.abs(Math.sin(f * 0.47 + i)), p[2]], runPose(p, 1, 0, 200 + i, { expr: "determined" })); }
      if (f < B.palco) { const sp = ground(ENG + 33, 6.4); G(memo("st0", () => steward(0)), 220, sp, { ...turn([sp[0], sp[2]], [ENG + 30, 0]), expr: "determined", armR: f > bang - 30 ? "up" : "hang", holdR: "pistol", armL: "hip" }); if (f >= bang && f < bang + 22) { const k = (f - bang) / 22; K(`puff|${Math.round(k * 16)}`, 300, 260, (pp) => fxPuff(pp, k), [sp[0] + 0.2, sp[1] + 2.3 + 0.4 * k, sp[2]], 0.5 + 0.6 * k, 0.45 + 0.5 * k, { soft: true }); } }
      if (f > B.palco - 40) {
        const done = f > B.meta + 6, rz = ROYAL[2] + 3.2, ry = 3.2;
        G(QUEEN, 230, [ROYAL[0], ry, rz], { facing: 0, expr: done ? "laugh" : "smile", armR: done ? (Math.sin(f * 0.25) > 0 ? "wave" : "up") : "hang", armL: "hip" });
        G(memo("rl1", () => lady08(5)), 231, [ROYAL[0] - 2.2, ry, rz - 0.6], { facing: 1, expr: done ? "laugh" : "smile", armL: done ? "up" : "hang" }); G(memo("rg1", () => gent08(3)), 232, [ROYAL[0] + 2.3, ry, rz - 0.5], { facing: -1, expr: done ? "grin" : "smile", armR: done ? "up" : "hang", holdR: done ? "hatW" : undefined });
        G(memo("rl2", () => lady08(2)), 233, [ROYAL[0] + 4.6, ry, rz - 0.9], { facing: -1, expr: "smile", armR: "wave" }); G(memo("rg2", () => gent08(6)), 234, [ROYAL[0] - 4.5, ry, rz - 0.9], { facing: 1, expr: done ? "laugh" : "smile", armL: "up" });
        for (const s of [-1, 1]) { const q = ground(FIN[0] + s * 5.2, FIN[2] - 3.4); G(memo("stw" + s, () => steward(s > 0 ? 1 : 2)), 240 + s, q, { ...turn([q[0], q[2]], [FIN[0] + 6, FIN[2]]), expr: done ? "laugh" : "nervous", armR: done ? "up" : "front", holdR: s > 0 ? "watch" : undefined }); }
        const l = leaderAt(f), p = l.p; if (f > B.palco - 6) { if (l.mode === "run") G(RUNNER08, 200, [p[0], p[1] + 0.05 * Math.abs(Math.sin(f * 0.47)), p[2]], runPose(p, -1, 0, 200, { expr: "pant", sweat: 2 })); else G(RUNNER08, 200, p, { facing: 0, expr: f < B.meta + 30 ? "pant" : "proud", armL: "up", armR: "up", sweat: 2 }); }
        for (let i = 1; i < 3; i++) { const x = FIN[0] + 40 + (f - (B.meta + 26 + i * 16)) * -0.3; if (x > FIN[0] + 48 || x < FIN[0] - 4) continue; const q = ground(x, FIN[2] + i * 1.2); G(memo("r08" + i, () => runner08(i)), 200 + i, q, runPose(q, -1, 0, 200 + i, { expr: "pant", sweat: 1 })); }
      }
    }
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
    const groundY = c.pos[0] > 3000 ? HE(c.pos[0], c.pos[2]) : H(c.pos[0], c.pos[2]), high = c.pos[1] - groundY;
    const Rr = THREE.MathUtils.clamp(Math.max(dist * 1.2 + 10, high * 1.6), 16, 140);
    this.sun.position.copy(focus).addScaledVector(this.sunDir, 400); this.sun.target.position.copy(focus);
    const sc = this.sun.shadow.camera; sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = 50; sc.far = 900; sc.updateProjectionMatrix();
    this.sun.shadow.bias = L.bias; this.sun.shadow.normalBias = L.normalBias * (Rr / 12);
    CHAR.uCharTint.value.set(...L.charTint); CHAR.uCharShade.value = L.charShade; CHAR.uGrad.value = L.charGrad; CHAR.uBodyGrad.value = L.bodyGrad; CHAR.uSideTint.value.set(...L.sideTint);
    this.sky.position.copy(cam.position);
    untone("#c9d6e6", this.fog.color); scene.fog = this.fog; scene.background = null;
    // regions, eras, tree tiles, grass
    const inEng = c.pos[0] > 3000; this.G.greece.visible = !inEng; this.E.eng.visible = inEng;
    this.G.eraA.visible = f < ERA_SWITCH; this.G.eraB.visible = f >= ERA_SWITCH;
    const vis = (t: { g: THREE.Group; x: number; z: number }, r: number) => { const d = Math.hypot(t.x - c.pos[0], t.z - c.pos[2]); t.g.visible = d < r + high * 2; };
    for (const t of this.G.tiles) vis(t, 620); for (const t of this.E.tiles) vis(t, 720);
    { const dx = c.look[0] - c.pos[0], dz = c.look[2] - c.pos[2], dl = Math.hypot(dx, dz) || 1, k = Math.min(dl, 9) / dl; for (const g of [...this.G.grass, ...this.E.grass]) { g.follow(c.pos[0] + dx * k, c.pos[2] + dz * k); g.mesh.visible = high < 30; } }
    TREE_T.value = f / 30;
    for (const cr of this.G.crowds) cr.c.tick(f, cr.era === "B" ? (louisAt(f).mode === "track" ? 1 : 0.4) : f < B.mensajero ? 1 : 0.3);
    for (const cr of this.E.crowds) cr.tick(f, f > B.meta ? 1 : f > B.windsor + 8 && f < B.palco ? 0.8 : 0.4);
    for (const sh of this.G.ships) { const x = sh.x0 + sh.v * f, z = sh.z0 + 0.3 * sh.v * f; sh.g.position.set(x, 0.12 * Math.sin(f * 0.05 + sh.x0), z); sh.g.rotation.set(0.01 * Math.sin(f * 0.07 + sh.z0), sh.yaw, 0.015 * Math.sin(f * 0.06 + sh.x0));
      const Mx = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(1, 6, 1), Pp = new THREE.Vector3(), Eu = new THREE.Euler(); let k = 0;
      for (const sd of [-1, 1]) for (let i = 0; i < sh.n / 2; i++) { const a = 0.45 * Math.sin(f * 0.22 + sh.x0), lx = -11 + i * 0.95; Eu.set(sd * (1.05 + 0.15 * Math.cos(f * 0.22 + sh.x0)), a, 0, "YXZ"); Q.setFromEuler(Eu); Pp.set(lx, 0.9, sd * 2.25).add(new THREE.Vector3(0, -2.6, sd * 2.6).applyQuaternion(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, a, 0))).multiplyScalar(1)); Mx.compose(Pp, Q, S); sh.oars.setMatrixAt(k++, Mx); }
      sh.oars.instanceMatrix.needsUpdate = true; }
    if (this.G.sea && this.G.sea.normalMap) this.G.sea.normalMap.offset.set(f * 0.0006, f * 0.00025);
    // the cloud crossing
    const cw = cloudWhite(f), cloudsOn = f > B.londres - 40 && f < B.windsor + 10; for (const m of this.cloudBank) { m.visible = cloudsOn; if (cloudsOn) m.lookAt(cam.position); }
    void cw; void STAD; void WCITY; void clamp01; void ramp;
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
void ctex; void fxDust; void figure; void ENG_SWITCH;
