// The world of "El Fenómeno y la final": the hotel, the clinic, the dressing room (setsf.ts) and the stadium of
// "La trastienda" (setsq.ts) in one three.js scene, with the cast as 2D cards standing (or lying) in them, a real 3D
// ball, and confetti. update(shot, frame) shows the shot's place, lights it and poses everyone.
import * as THREE from "three";
import { Pool, Actor, Fx } from "./pool";
import { NOINK } from "./ink";
import { CHAR, untone } from "./shade";
import { skyTex, SkyK } from "./pbr";
import { LIGHTS, LightK } from "./lights";
import { Pen, figure, Char, Pose } from "./toon";
import { TREE_T } from "./trees";
import { newBallMat } from "./real";
import { fxConfetti } from "./props";
import { buildFenomeno, newFRefs, FRefs } from "./setsf";
import { buildStadium, newRefs, Refs } from "./setsq";
import { SHOTS, B, V3, camAt, lerp, ramp, ease, CUTS, Walker, BED_A, BED_B, ROOM, CORR, R9_ROOM, SIT_AT, LIE_AT, POV_AT, AROUND, LB_RUN, MATE_RUN, R9_EXAM, EXAM, COACH_AT, OFF_RUN, R9_IN, DOC_IN, VPLAYERS, VEST, VDOOR_X, doorOpen,
  HEAD_AT, NET98, R9_98, FRA10_RUN, ballAt98, SHOOT, NET02, R9_RUN02, GER_RUN, ballAt02, PL } from "./story";
import { R9_HOTEL, R9_GOWN, R9_KIT, R9_2002, LB_HOTEL, mate, bra, BRA_GK, COACH, OFFICIAL, DOCTOR, NURSE, fra, FRA10, ger, GER_GK } from "./castf";
const CKEY = new WeakMap<Char, string>(), CC = new Map<string, Char>();
const memo = (k: string, make: () => Char) => { let c = CC.get(k); if (!c) { c = make(); CC.set(k, c); } return c; };
type Place = { seed?: number; key: string; draw: (p: Pen) => void; x: number; y: number; z: number; scale: number; mirror?: boolean; roll?: number; faceUp?: boolean; flat?: number };
type FxPlace = { key: string; cw: number; ch: number; draw: (p: Pen) => void; x: number; y: number; z: number; w: number; h: number; flat?: boolean; fixed?: boolean; rot?: number; soft?: boolean; glow?: number };
type Stage = { places: Place[]; fx: FxPlace[]; balls: V3[] };
const tier = (d: number): [number, number, number] => d < 3.2 ? [1800, 3000, 3.0] : d < 7 ? [1200, 2000, 2.0] : d < 18 ? [720, 1200, 1.2] : [360, 600, 0.6]; // cards never upscaled on screen
const q = (v: number, n = 120) => Math.round(v * n) / n;
const fkey = (o: object) => JSON.stringify(o, (_k, v) => (typeof v === "number" ? q(v) : v));
const LID = [0.5, 1, 1, 0.5];
const hs = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
const lidAt = (f: number, seed: number) => { let s = Math.round(-60 * hs(seed, 9)); for (let n = 0; s <= f && n < 400; n++) { const k = f - s; if (k >= 0 && k < 4) return LID[k]; s += Math.round(15 + 54 * hs(seed * 31 + n, 13)); } return 0; };
/** per place: hemisphere fill, environment map and strength, the key light [colour, intensity, yaw, elevation], fog, sky */
const LOOK: Record<string, { hemi: number; env: SkyK; ei: number; key: [string, number, number, number]; shadow: boolean; fog: [string, number, number]; sky: boolean; hemiC: string }> = {
  hotel: { hemi: 0.85, env: "room", ei: 0.7, key: ["#ffe0b4", 1.35, -90, 28], shadow: false, fog: ["#d8c8b0", 60, 400], sky: false, hemiC: "#fff4e6" },
  clinic: { hemi: 0.9, env: "room", ei: 0.62, key: ["#eef6ff", 1.0, 90, 35], shadow: false, fog: ["#c8d8d8", 60, 400], sky: false, hemiC: "#f4f8ff" },
  vest: { hemi: 0.9, env: "room", ei: 0.6, key: ["#f4f8ff", 0.9, 20, 60], shadow: false, fog: ["#c8ccd0", 60, 400], sky: false, hemiC: "#f4f8ff" },
  stadium: { hemi: 0.42, env: "night", ei: 0.75, key: ["#f6f8ff", 2.5, 35, 52], shadow: true, fog: ["#141c4a", 140, 700], sky: true, hemiC: "#c8d4ff" } };
const ARM_HEAD: [number, number, number] = [-6, -60, 44]; // both hands on the head
export class World {
  root = new THREE.Group();
  private pool = new Pool();
  private actors: Actor[] = [];
  private fxs: Fx[] = [];
  private balls: THREE.Mesh[] = [];
  private sun: THREE.DirectionalLight; private hemi = new THREE.HemisphereLight("#fff4e6", "#6a5040", 0);
  private sky: THREE.Mesh; private skyMat: THREE.MeshBasicMaterial; private envs: Partial<Record<SkyK, THREE.Texture>> = {}; private pmrem: THREE.PMREMGenerator | null = null;
  private fog = new THREE.Fog("#1b2a5e", 24, 120);
  private right = new THREE.Vector3(); private camF = new THREE.Vector3(); private sunDir = new THREE.Vector3();
  private lightAngle = -2;
  private F: FRefs = newFRefs(); private Q: Refs = newRefs();
  constructor() {
    const R = this.root;
    this.skyMat = new THREE.MeshBasicMaterial({ map: skyTex("night"), side: THREE.BackSide, depthWrite: false, fog: false });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(900, 64, 32), this.skyMat); this.sky.renderOrder = -1; this.sky.frustumCulled = false; this.sky.layers.set(NOINK); R.add(this.sky);
    this.sun = new THREE.DirectionalLight("#fff0d6", 1); this.sun.shadow.mapSize.set(4096, 4096); this.sun.shadow.radius = 3;
    R.add(this.sun, this.sun.target, this.hemi);
    buildFenomeno(R, this.F);
    buildStadium(R, this.Q); this.Q.cups.visible = false;
    { const sg = new THREE.SphereGeometry(1, 28, 18), mn = newBallMat(); for (let i = 0; i < 2; i++) { const m = new THREE.Mesh(sg, mn); m.castShadow = true; m.receiveShadow = true; m.visible = false; m.layers.set(NOINK); R.add(m); this.balls.push(m); } }
    for (let i = 0; i < 80; i++) this.actors.push(new Actor(R));
    for (let i = 0; i < 70; i++) this.fxs.push(new Fx(R));
  }
  private fig(st: Stage, ch: Char, seed: number, pos: V3, pose: Pose = {}, o: { scale?: number; roll?: number; f?: number; faceUp?: boolean; flat?: number } = {}) {
    let ck = CKEY.get(ch); if (!ck) { ck = JSON.stringify(ch); CKEY.set(ch, ck); }
    const full: Pose = { blink: o.f !== undefined ? lidAt(o.f, seed) : 0, ...pose, light: this.lightAngle, seed };
    st.places.push({ seed, key: `G|${ck}|${fkey(full)}`, x: pos[0], y: pos[1], z: pos[2], scale: o.scale ?? 1, roll: o.roll, faceUp: o.faceUp, flat: o.flat, draw: (p) => figure(p, ch, full) });
  }
  private stage(id: number, f: number): Stage {
    const st: Stage = { places: [], fx: [], balls: [] }, place = SHOTS[id - 1].place;
    const G = (ch: Char, seed: number, pos: V3, pose: Pose = {}, o: Parameters<World["fig"]>[5] = {}) => this.fig(st, ch, seed, pos, pose, { f, ...o });
    const lat = (p: number[], t: number[]) => { const dx = t[0] - p[0], dz = t[1] - p[1]; return { lat: dx * this.right.x + dz * this.right.z, dep: dx * this.camF.x + dz * this.camF.z }; };
    const turn = (p: number[], t: number[]): Pose => { const { lat: l, dep } = lat(p, t); return Math.abs(l) > Math.abs(dep) * 0.8 ? { facing: (l > 0 ? 1 : -1) as 1 | -1 } : dep > 0 ? { back: true } : { facing: 0 }; };
    const walkPose = (w: Walker, seed: number, extra: Pose = {}): Pose => w.walk ? { legs: w.speed > 0.11 ? "run" : "walk", phase: f * (w.speed > 0.11 ? 0.08 : 0.05) + seed * 0.37, ...turn([w.p[0], w.p[2]], [w.p[0] + w.h[0] * 5, w.p[2] + w.h[1] * 5]), ...extra } : extra;
    const SIT_Y = -0.15, BED_SIT = -0.04, LIE_Y = 0.63;
    const [ax, , az] = BED_A, [bx, , bz] = BED_B;
    if (place === "hotel") {
      if (id === 1) {
        // the striker: tossing the ball by the wardrobe; he walks to his bed, sits, lies down; his own eyes for the faces
        if (f < B.comer + 4) { const p = R9_ROOM(f).p, ph = (f % 26) / 26, up = Math.sin(Math.PI * ph); G(R9_HOTEL, 1, p, { ...(f > B.final - 12 ? { facing: 1 as const } : { facing: 0 as const }), expr: f > B.final - 12 ? "proud" : "grin", armL: "front", armR: "front", look: up * 0.8 });
          const cx = this.camF.x, cz = this.camF.z; st.balls.push([p[0] - cx * 0.25, 1.0 + 0.62 * up, p[2] - cz * 0.25]); }
        else if (f < SIT_AT) { const w = R9_ROOM(f); G(R9_HOTEL, 1, w.p, walkPose(w, 1, { expr: "smile", armL: "hang", armR: "front", holdR: "ball" })); }
        else if (f < LIE_AT) G(R9_HOTEL, 1, [ax + 0.78, BED_SIT, az + 0.42], { legs: "sit", facing: 0, expr: "smile_closed", blink: 0, armL: "low", armR: "low", headTilt: 0.1 });
        else if (f < POV_AT) G(R9_HOTEL, 1, [ax, LIE_Y, az + 1.02], { facing: 0, expr: "smile_closed", blink: f > LIE_AT + 8 ? 1 : 0, armL: "hang", armR: "hang", headTilt: 0.12 }, { flat: 0 });
        // his room-mate: on the other bed with a magazine; then one of the faces at the foot of the bed
        if (f < POV_AT) G(LB_HOTEL, 2, [bx, LIE_Y, bz + 1.02], { facing: 0, expr: "smile", armL: "front", armR: "front", holdR: "paper" }, { flat: 0.08 });
        else { const sh = ramp(f, POV_AT, POV_AT + 20); const who: [Char, number, Pose][] = [[memo("m0", () => mate(0)), 3, { expr: "shock", armL: "mouth", armR: "hang" }], [memo("m1", () => mate(1)), 4, { expr: sh > 0.5 ? "nervous" : "shock", armL: "hip", armR: "chin" }], [LB_HOTEL, 2, { expr: "pained", armL: "front", armR: "front" }]];
          who.forEach(([c, seed, pose], i) => G(c, seed, AROUND[i], { facing: 0, ...pose, headTilt: (i - 1) * 0.12 }, { faceUp: true })); }
      } else {
        // flashback: he sleeps; the seizure (a tremble); his room-mate leaps up, runs out, shouts in the corridor; two team-mates come running
        const tr = f > B.convulsion - 6 ? 1 : 0, j = tr ? 0.018 * Math.sin(f * 2.7) : 0;
        G(R9_HOTEL, 1, [ax + j, LIE_Y, az + 1.02], { facing: 0, expr: tr ? "pained" : "smile_closed", blink: 1, armL: tr && f % 6 < 3 ? "low" : "hang", armR: tr && f % 6 >= 3 ? "low" : "hang", headTilt: tr ? 0.25 * Math.sin(f * 1.9) : 0.12 }, { flat: tr ? 0.05 * Math.sin(f * 2.3) : 0 });
        if (f < B.companero - 8) { const shocked = f > B.convulsion + 4; G(LB_HOTEL, 2, [bx - 0.45, BED_SIT, bz + 0.38], { legs: "sit", ...(shocked ? turn([bx - 0.45, bz + 0.38], [ax, az]) : { facing: 0 }), expr: shocked ? "shock" : "smile", armL: shocked ? "up" : "front", armR: shocked ? "up" : "front", holdR: shocked ? undefined : "paper" }); }
        else { const w = LB_RUN(f), out = f > B.companero + 58; G(LB_HOTEL, 2, w.p, out ? { ...turn([w.p[0], w.p[2]], [w.p[0] - 5, w.p[2]]), expr: "shock", armL: f % 16 < 8 ? "up" : "wave", armR: f % 16 < 8 ? "wave" : "up" } : walkPose(w, 2, { expr: "shock", armL: "front", armR: "front" })); }
        MATE_RUN.forEach((m, i) => { if (f < B.grito - 10 + i * 6) return; const w = m(f); G(memo("m" + (i + 2), () => mate(i + 2)), 5 + i, w.p, w.walk ? walkPose(w, 5 + i, { expr: "shock", armL: "front", armR: "front" }) : { ...turn([w.p[0], w.p[2]], [ROOM.x + 1.9, ROOM.z]), expr: "shock", armL: "hang", armR: "mouth" }); });
      }
    } else if (place === "clinic") {
      G(R9_GOWN, 1, R9_EXAM, { legs: "sit", facing: 0, expr: "dazed", armL: "low", armR: "chin", headTilt: 0.12 + 0.04 * Math.sin(f * 0.05) });
      G(DOCTOR, 20, [EXAM[0] + 1.6, 0, EXAM[2] + 0.55], { ...turn([EXAM[0] + 1.6, EXAM[2] + 0.55], [R9_EXAM[0], R9_EXAM[2]]), expr: "stern", armR: "up", holdR: "film", armL: "hip" });
      G(NURSE, 21, [EXAM[0] - 1.05, 0, EXAM[2] + 0.75], { ...turn([EXAM[0] - 1.05, EXAM[2] + 0.75], [R9_EXAM[0], R9_EXAM[2]]), expr: "nervous", armL: "front", holdL: "paper", armR: "hang" });
    } else if (place === "vest") {
      const R9p = R9_IN(f).p, inside = f > B.entra - 20, happy = f > B.normal + 2;
      // the coach hands over the team sheet, then turns to the door
      G(COACH, 30, COACH_AT, { ...(inside ? turn([COACH_AT[0], COACH_AT[2]], [R9p[0], R9p[2]]) : turn([COACH_AT[0], COACH_AT[2]], [VDOOR_X + 0.35, VEST.z + 2.75])), expr: happy ? "relief" : inside ? "shock" : "stern", armR: f < B.sin + 4 ? "front" : happy ? "up" : "chin", holdR: f < B.sin + 2 ? "paper" : undefined, armL: "hip" });
      { const w = OFF_RUN(f); if (w.p[2] < VEST.z + 6.0) G(OFFICIAL, 31, w.p, w.walk ? walkPose(w, 31, { expr: "neutral", armL: "front", holdL: "paper", armR: "hang" }) : { ...turn([w.p[0], w.p[2]], [COACH_AT[0], COACH_AT[2]]), expr: "neutral", armL: "front", holdL: f > B.sin ? "paper" : undefined, armR: "hang" }); }
      // the team in kit, waiting; they cheer when they see the scans are clean
      VPLAYERS.forEach((p, i) => { const c = memo("b" + i, () => bra(i)), lookAt = inside ? [R9p[0], R9p[2]] : [COACH_AT[0], COACH_AT[2]]; const hop = happy ? 0.06 * Math.max(0, Math.sin(f * 0.4 + i * 1.3)) : 0;
        G(c, 40 + i, [p[0], hop, p[2]], { ...turn([p[0], p[2]], lookAt), expr: happy ? (i % 2 ? "laugh" : "grin") : inside ? "shock" : i % 2 ? "nervous" : "stern", armL: happy ? "up" : i % 2 ? "hip" : "hang", armR: happy ? (i % 2 ? "up" : "wave") : "hang" }); });
      // he walks in with the scans held up; the doctor behind him
      if (inside) { const w = R9_IN(f); G(R9_HOTEL, 1, w.p, w.walk ? walkPose(w, 1, { expr: "determined", armR: "front", holdR: "film", armL: "hang" }) : { facing: 0, expr: happy ? "grin" : "determined", armR: f > B.resultados - 8 && f < B.jugar - 6 ? "up" : "front", holdR: f < B.jugar - 6 ? "film" : undefined, armL: f > B.jugar - 6 ? "up" : "hang", holdL: undefined });
        const d = DOC_IN(f); if (f > B.entra - 6) G(DOCTOR, 20, d.p, d.walk ? walkPose(d, 20, { expr: "smile", armL: "hang", armR: "hang" }) : { ...turn([d.p[0], d.p[2]], [VDOOR_X - 0.6, VEST.z + 1.2]), expr: "smile", armL: "hip", armR: "point" }); }
    } else {
      // ===== the stadium =====
      if (id === 5) {
        const GX = -PL, scored = f > NET98, gana = f > B.gana - 4;
        G(R9_KIT, 1, R9_98, gana ? { legs: "kneel", facing: 0, expr: "pained", armL: "low", armR: "low", headTilt: 0.32 } : { facing: 0, expr: scored ? "pained" : "determined", armL: scored ? ARM_HEAD : "hip", armR: scored ? ARM_HEAD : "hang", headTilt: scored ? 0.1 : 0 });
        const w = FRA10_RUN(f), jump = Math.max(0, Math.sin(Math.PI * ramp(f, HEAD_AT - 7, HEAD_AT + 7))) * 0.55;
        G(FRA10, 50, [w.p[0], jump, w.p[2]], jump > 0.01 ? { ...turn([w.p[0], w.p[2]], [GX, 0.4]), expr: "determined", armL: "up", armR: "wave", legs: "run", phase: 0.3 } : scored ? walkPose(w, 50, { expr: "laugh", armL: "up", armR: "up" }) : walkPose(w, 50, { expr: "determined", armL: "hang", armR: "hang" }));
        { const t = ramp(f, HEAD_AT + 1, NET98 + 4), dive = ease(t); G(BRA_GK, 51, [GX + 0.85, 0.32 * Math.sin(Math.PI * Math.min(1, t * 1.2)), 0.1 - 0.95 * dive], { facing: 0, expr: dive > 0.3 ? "pained" : "determined", armL: dive > 0.1 ? "up" : "front", armR: dive > 0.1 ? "up" : "front" }, { roll: 1.25 * dive, faceUp: false }); }
        const others: [Char, number, V3, Pose][] = [[memo("b1", () => bra(1)), 52, [GX + 3.3, 0, -1.55], { expr: "determined", armL: "hang", armR: "hang" }], [memo("f2", () => fra(2)), 53, [GX + 4.9, 0, -1.9], { expr: scored ? "laugh" : "determined", armL: scored ? "up" : "hang", armR: scored ? "up" : "hang" }],
          [memo("b3", () => bra(3)), 54, [GX + 6.6, 0, -2.9], { expr: scored ? "pained" : "nervous", armL: "hip", armR: "hip" }], [memo("f4", () => fra(4)), 55, [GX + 5.4, 0, -3.1], { expr: scored ? "laugh" : "determined", armL: scored ? "up" : "hang", armR: scored ? "up" : "hang" }]];
        for (const [c, seed, p, pose] of others) { const hop = scored && pose.expr === "laugh" ? Math.max(0, Math.sin(f * 0.45 + seed)) * 0.25 : 0; const j2 = seed === 52 ? Math.max(0, Math.sin(Math.PI * ramp(f, HEAD_AT - 6, HEAD_AT + 8))) * 0.35 : 0; G(c, seed, [p[0], hop + j2, p[2]], { ...turn([p[0], p[2]], [GX + 2, 0.3]), ...pose }); }
        const bp = ballAt98(f); if (bp) st.balls.push(bp);
      } else {
        const GX2 = PL, cup = f > B.copa - 4, scored = f > NET02;
        if (!cup) {
          const w = R9_RUN02(f); G(R9_2002, 1, w.p, scored ? walkPose(w, 1, { expr: "laugh", armL: "wave", armR: "wave" }) : f > SHOOT - 3 && f < SHOOT + 6 ? { ...turn([w.p[0], w.p[2]], [GX2, 0]), legs: "run", phase: 0.25, expr: "determined", armL: "front", armR: "hang" } : walkPose(w, 1, { expr: "determined", armL: "front", armR: "hang" }));
          const g = GER_RUN(f); G(memo("g0", () => ger(0)), 60, g.p, f > SHOOT + 4 ? { ...turn([g.p[0], g.p[2]], [GX2, 0]), expr: "pained", armL: ARM_HEAD, armR: ARM_HEAD } : walkPose(g, 60, { expr: "determined", armL: "front", armR: "hang" }));
          const t = ramp(f, SHOOT + 2, NET02 + 4), dive = ease(t); G(GER_GK, 61, [GX2 - 0.85, 0.3 * Math.sin(Math.PI * Math.min(1, t * 1.2)), 0.3 - 1.0 * dive], { facing: 0, expr: dive > 0.3 ? "pained" : "determined", armL: dive > 0.1 ? "up" : "front", armR: dive > 0.1 ? "up" : "front" }, { roll: -1.25 * dive });
          st.balls.push(ballAt02(f));
        } else {
          // after the flash: the cup held high among his team-mates, confetti falling
          const c0: V3 = [GX2 - 11.1, 0, 1.6];
          G(R9_2002, 1, c0, { facing: 0, expr: "laugh", armL: [-14, -96, 30], armR: [-14, -96, 30], holdR: "wcup" });
          const ring: [number, number][] = [[-0.9, -0.45], [0.95, -0.5], [-0.4, -1.15], [0.5, -1.25], [-1.6, -1.0], [1.65, -1.05]];
          ring.forEach(([dx, dz], i) => { const hop = Math.max(0, Math.sin(f * 0.42 + i * 1.7)) * 0.22; G(memo("b" + (i + 4), () => bra(i + 4)), 70 + i, [c0[0] + dx, hop, c0[2] + dz], { ...turn([c0[0] + dx, c0[2] + dz], [c0[0], c0[2]]), expr: i % 2 ? "laugh" : "grin", armL: "up", armR: i % 3 ? "up" : "wave" }); });
          const t0 = B.copa - 4, cols = ["#f2c64a", "#f6d21a", "#2f8a3a", "#fbfaf2", "#1f4fa8"];
          for (let i = 0; i < 48; i++) { const sp = 0.025 + 0.02 * hs(i, 1), y = 5.2 - ((f - t0) * sp + 4.6 * hs(i, 2)) % 4.9, x = c0[0] - 3.2 + 6.4 * hs(i, 3) + 0.3 * Math.sin(f * 0.05 + i), z = c0[2] - 2.6 + 5.0 * hs(i, 4);
            st.fx.push({ key: "cf" + (i % 5), cw: 64, ch: 64, draw: (p) => fxConfetti(p, cols[i % 5]), x, y, z, w: 0.09, h: 0.09, rot: f * 0.15 * (hs(i, 5) - 0.5) + i, glow: 1.3 }); }
        }
      }
    }
    return st;
  }
  update(id: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene, gl?: THREE.WebGLRenderer) {
    const s = SHOTS[id - 1], L = LIGHTS[s.light as LightK], P = LOOK[s.place];
    const c = camAt(id, f);
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll); cam.fov = c.fov; cam.near = 0.05; cam.far = 1500; cam.updateProjectionMatrix(); cam.updateMatrixWorld(); cam.layers.enable(NOINK);
    const focus = new THREE.Vector3(...c.look);
    const yaw = THREE.MathUtils.degToRad(P.key[2]), el = THREE.MathUtils.degToRad(P.key[3]);
    this.sunDir.set(Math.sin(yaw) * Math.cos(el), Math.sin(el), Math.cos(yaw) * Math.cos(el)).normalize();
    this.right.set(1, 0, 0).applyQuaternion(cam.quaternion); this.camF.set(0, 0, -1).applyQuaternion(cam.quaternion);
    this.lightAngle = Math.round(Math.atan2(-this.sunDir.y, this.sunDir.dot(this.right)) / (Math.PI / 4)) * (Math.PI / 4);
    this.sun.color.set(P.key[0]); this.sun.intensity = P.key[1]; this.sun.castShadow = P.shadow; this.hemi.intensity = P.hemi; this.hemi.color.set(P.hemiC);
    if (gl) { if (!this.pmrem) this.pmrem = new THREE.PMREMGenerator(gl); let e = this.envs[P.env]; if (!e) { e = this.pmrem.fromEquirectangular(skyTex(P.env)).texture; this.envs[P.env] = e; } scene.environment = e; scene.environmentIntensity = P.ei; }
    this.skyMat.map = skyTex("night"); this.sky.visible = P.sky; this.sky.position.copy(cam.position);
    const Rr = s.place === "stadium" ? 30 : 14; this.sun.position.copy(focus).addScaledVector(this.sunDir, 200); this.sun.target.position.copy(focus);
    const sc = this.sun.shadow.camera; sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = 20; sc.far = 500; sc.updateProjectionMatrix();
    this.sun.shadow.bias = L.bias; this.sun.shadow.normalBias = L.normalBias * (Rr / 12);
    CHAR.uCharTint.value.set(...L.charTint); CHAR.uCharShade.value = L.charShade; CHAR.uGrad.value = L.charGrad; CHAR.uBodyGrad.value = L.bodyGrad; CHAR.uSideTint.value.set(...L.sideTint);
    untone(P.fog[0], this.fog.color); this.fog.near = P.fog[1]; this.fog.far = P.fog[2]; scene.fog = this.fog; scene.background = null;
    // only this shot's place exists for the renderer (its lights included)
    for (const [k, g] of Object.entries(this.F.groups)) g.visible = k === s.place;
    const Q = this.Q; Q.stadium.visible = s.place === "stadium";
    { const dx = c.look[0] - c.pos[0], dz = c.look[2] - c.pos[2], dl = Math.hypot(dx, dz) || 1, k = Math.min(dl, 7) / dl; for (const g of Q.grass) { g.g.mesh.visible = s.place === "stadium"; if (s.place === "stadium") g.g.follow(c.pos[0] + dx * k, c.pos[2] + dz * k); } }
    { const roar = id === 5 ? (f > NET98 ? 1 : 0.45) : id === 6 ? (f > NET02 ? 1 : 0.5) : 0.2; for (const p of Q.people) p.c.tick(f, roar); }
    Q.flags.forEach((g, i) => { const ud = g.userData as { b?: number }; if (ud.b === undefined) ud.b = g.rotation.y; g.rotation.y = ud.b + 0.3 * Math.sin(f * 0.11 + i * 1.3); });
    TREE_T.value = f / 30;
    if (this.F.vDoor) this.F.vDoor.rotation.y = -1.35 * doorOpen(f);
    void CUTS; void ease; void lerp; void CORR; void HEAD_AT; void SHOOT;
    // ---- cast ----
    const st = this.stage(id, f);
    this.balls.forEach((m) => (m.visible = false)); st.balls.slice(0, this.balls.length).forEach((p, i) => { const m = this.balls[i]; m.visible = true; m.position.set(...p); m.scale.setScalar(0.11); m.rotation.set(f * 0.3, f * 0.17, 0.4); });
    const reqs: { a: Actor; p: Place }[] = [];
    this.actors.forEach((a) => (a.mesh.visible = false)); this.fxs.forEach((x) => (x.mesh.visible = false));
    st.places.slice(0, this.actors.length).forEach((p, i) => { const a = this.actors[i], d = cam.position.distanceTo(new THREE.Vector3(p.x, p.y + 1.0 * p.scale, p.z)) / p.scale; const [w, h, k] = tier(d); a.r = this.pool.req(p.key, w, h, k, p.draw); reqs.push({ a, p }); });
    const fr: { e: Fx; p: FxPlace }[] = [];
    st.fx.slice(0, this.fxs.length).forEach((p, i) => { const e = this.fxs[i]; e.r = this.pool.req(p.key, p.cw, p.ch, 1, p.draw); fr.push({ e, p }); });
    this.pool.flush();
    for (const { a, p } of reqs) { a.bind(); const m = a.mesh; m.visible = true; m.position.set(p.x, p.y, p.z); const yawA = Math.atan2(cam.position.x - p.x, cam.position.z - p.z);
      if (p.flat !== undefined) m.rotation.set(-Math.PI / 2, 0, p.flat);
      else if (p.faceUp) { m.rotation.set(0, 0, 0); m.lookAt(cam.position); m.rotateZ(p.roll ?? 0); } else { m.rotation.set(0, 0, 0); m.rotateY(yawA); m.rotateZ(p.roll ?? 0); }
      m.scale.set((p.mirror ? -1 : 1) * p.scale, p.scale, p.scale); m.castShadow = true; }
    for (const { e, p } of fr) { e.use(!!p.soft); e.bind(); e.soft.color.setScalar(p.glow ?? 1); e.mat.color.setScalar(p.glow ?? 1); const m = e.mesh; m.visible = true; m.position.set(p.x, p.y, p.z); m.scale.set(p.w, p.h, 1);
      if (p.flat) m.rotation.set(-Math.PI / 2, 0, p.rot ?? 0); else if (p.fixed) m.rotation.set(0, 0, p.rot ?? 0); else { m.rotation.set(0, 0, 0); m.lookAt(cam.position); if (p.rot) m.rotateZ(p.rot); } }
    return focus;
  }
}
