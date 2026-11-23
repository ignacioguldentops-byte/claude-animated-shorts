// The world of "El perro que encontró la Copa": four closed places in one three.js scene, and the cast (and Pickles)
// as 2D cards standing in them. update(shot, frame) shows the shot's place, lights it and poses everyone.
import * as THREE from "three";
import { Pool, Actor, Fx } from "./pool";
import { NOINK } from "./ink";
import { CHAR, untone } from "./shade";
import { skyTex, SkyK } from "./pbr";
import { LIGHTS, LightK } from "./lights";
import { Pen, figure, Char, Pose } from "./toon";
import { drawDog, DogPose } from "./dog";
import { TREE_T } from "./trees";
import { buildPickles, newWRefs, WRefs } from "./setsw";
import { SHOTS, B, V3, camAt, lerp, ramp, ease, THIEF_AT, GUARD_AT, GRAB, GRAB_END, BOSS_AT, SUSP_AT, DET1_AT, DET2_AT, OWNER_AT, DOG_AT, UNWRAP, DOG_CHAIR, VITRINE, TABLE, BUSH, CUTS, Walker, floorAt } from "./story";
import { OWNER, THIEF, GUARD, CHAIRMAN, DET1, DET2, SUSPECT, visitor, player, waiter } from "./castw";
const CKEY = new WeakMap<Char, string>(), CC = new Map<string, Char>();
const memo = (k: string, make: () => Char) => { let c = CC.get(k); if (!c) { c = make(); CC.set(k, c); } return c; };
type Place = { seed?: number; key: string; draw: (p: Pen) => void; x: number; y: number; z: number; scale: number; mirror?: boolean; roll?: number; faceUp?: boolean; sx?: number; sy?: number };
type FxPlace = { key: string; cw: number; ch: number; draw: (p: Pen) => void; x: number; y: number; z: number; w: number; h: number; flat?: boolean; fixed?: boolean; rot?: number; soft?: boolean; glow?: number };
type Stage = { places: Place[]; fx: FxPlace[] };
const tier = (d: number): [number, number, number] => d < 3.2 ? [1800, 3000, 3.0] : d < 6.5 ? [1080, 1800, 1.8] : d < 16 ? [480, 800, 0.8] : [240, 400, 0.4];
const q = (v: number, n = 120) => Math.round(v * n) / n;
const fkey = (o: object) => JSON.stringify(o, (_k, v) => (typeof v === "number" ? q(v) : v));
const LID = [0.5, 1, 1, 0.5], OFFICE_DOOR_Z = 4.92;
const hs = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
const lidAt = (f: number, seed: number) => { let s = Math.round(-60 * hs(seed, 9)); for (let n = 0; s <= f && n < 400; n++) { const k = f - s; if (k >= 0 && k < 4) return LID[k]; s += Math.round(15 + 54 * hs(seed * 31 + n, 13)); } return 0; };
/** per place: environment map, its strength, the key light (window sun / moon), fog */
const LOOK: Record<string, { hemi: number; env: SkyK; ei: number; key: [string, number, number, number]; shadow: boolean; fog: [string, number, number]; sky: boolean }> = {
  hall: { hemi: 0.9, env: "room", ei: 0.8, key: ["#fff0d8", 1.3, 20, 52], shadow: false, fog: ["#d8c8b0", 60, 400], sky: false },
  office: { hemi: 0.8, env: "room", ei: 0.62, key: ["#f4f0ff", 0.9, 10, 40], shadow: false, fog: ["#c8b8a0", 60, 400], sky: false },
  street: { hemi: 0.3, env: "night", ei: 0.85, key: ["#9fb4ff", 1.1, 60, 40], shadow: true, fog: ["#1b2a5e", 24, 120], sky: true },
  banquet: { hemi: 0.9, env: "room", ei: 0.66, key: ["#ffe6c8", 1.0, 200, 50], shadow: false, fog: ["#d8c0a0", 60, 400], sky: false } };
export class World {
  root = new THREE.Group();
  private pool = new Pool();
  private actors: Actor[] = [];
  private fxs: Fx[] = [];
  private sun: THREE.DirectionalLight; private hemi = new THREE.HemisphereLight("#fff4e6", "#6a5040", 0);
  private sky: THREE.Mesh; private skyMat: THREE.MeshBasicMaterial; private envs: Partial<Record<SkyK, THREE.Texture>> = {}; private pmrem: THREE.PMREMGenerator | null = null;
  private fog = new THREE.Fog("#1b2a5e", 24, 120);
  private right = new THREE.Vector3(); private camF = new THREE.Vector3(); private sunDir = new THREE.Vector3();
  private lightAngle = -2;
  private W: WRefs = newWRefs();
  constructor() {
    const R = this.root;
    this.skyMat = new THREE.MeshBasicMaterial({ map: skyTex("night"), side: THREE.BackSide, depthWrite: false, fog: false });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(900, 64, 32), this.skyMat); this.sky.renderOrder = -1; this.sky.frustumCulled = false; this.sky.layers.set(NOINK); R.add(this.sky);
    this.sun = new THREE.DirectionalLight("#fff0d6", 1); this.sun.shadow.mapSize.set(4096, 4096); this.sun.shadow.radius = 3;
    R.add(this.sun, this.sun.target, this.hemi);
    buildPickles(R, this.W);
    for (let i = 0; i < 120; i++) this.actors.push(new Actor(R));
    for (let i = 0; i < 60; i++) this.fxs.push(new Fx(R));
  }
  private fig(st: Stage, ch: Char, seed: number, pos: V3, pose: Pose = {}, o: { scale?: number; roll?: number; f?: number; faceUp?: boolean } = {}) {
    let ck = CKEY.get(ch); if (!ck) { ck = JSON.stringify(ch); CKEY.set(ch, ck); }
    const full: Pose = { blink: o.f !== undefined ? lidAt(o.f, seed) : 0, ...pose, light: this.lightAngle, seed };
    st.places.push({ seed, key: `G|${ck}|${fkey(full)}`, x: pos[0], y: pos[1], z: pos[2], scale: o.scale ?? 1, roll: o.roll, faceUp: o.faceUp, draw: (p) => figure(p, ch, full) });
  }
  private stage(id: number, f: number): Stage {
    const st: Stage = { places: [], fx: [] }, place = SHOTS[id - 1].place;
    const G = (ch: Char, seed: number, pos: V3, pose: Pose = {}, o: Parameters<World["fig"]>[5] = {}) => this.fig(st, ch, seed, pos, pose, { f, ...o });
    const lat = (p: number[], t: number[]) => { const dx = t[0] - p[0], dz = t[1] - p[1]; return { lat: dx * this.right.x + dz * this.right.z, dep: dx * this.camF.x + dz * this.camF.z }; };
    const turn = (p: number[], t: number[]): Pose => { const { lat: l, dep } = lat(p, t); return Math.abs(l) > Math.abs(dep) * 0.8 ? { facing: (l > 0 ? 1 : -1) as 1 | -1 } : dep > 0 ? { back: true } : { facing: 0 }; };
    const walkPose = (w: Walker, seed: number, extra: Pose = {}): Pose => w.walk ? { legs: "walk", phase: f * 0.05 + seed * 0.37, ...turn([w.p[0], w.p[2]], [w.p[0] + w.h[0] * 5, w.p[2] + w.h[1] * 5]), ...extra } : extra;
    const dog = (pos: V3, o: DogPose, scale = 0.7) => { const { lat: l } = lat([pos[0], pos[2]], [pos[0] + (o.facing === 0 ? 0 : 1), pos[2]]); void l;
      const full: DogPose = { blink: lidAt(f, 77), ...o, light: this.lightAngle }; st.places.push({ seed: 77, key: `G|dog|${fkey(full)}`, x: pos[0], y: pos[1], z: pos[2], scale, draw: (p) => drawDog(p, full) }); };
    const dogFace = (p: V3, t: [number, number]): 1 | -1 => (lat([p[0], p[2]], t).lat >= 0 ? 1 : -1);
    const SIT_Y = -0.15, up = (p: V3): V3 => [p[0], p[1] + floorAt(p[0], p[2]), p[2]];
    if (place === "street") {
      const bx = BUSH[0], bz = BUSH[2];
      if (id === 1) { const p: V3 = up([bx - 0.75, 0, bz + 0.45]); dog(p, { mode: f < 120 ? "sniff" : "dig", phase: f * 0.05, facing: dogFace(p, [bx, bz]), alert: f > 120 }); }
      else {
        const o0 = OWNER_AT(f), d0 = DOG_AT(f), o = { ...o0, p: up(o0.p) }, d = { ...d0, p: up(d0.p) }, found = f > UNWRAP;
        // the owner: out of the door, along the pavement, stops; kneels to the bundle and unwraps it
        if (f < B.envuelta + 24) G(OWNER, 1, o.p, o.walk ? walkPose(o, 1, { expr: "smile", armL: "hip", armR: "hang" }) : { ...turn([o.p[0], o.p[2]], [d.p[0], d.p[2]]), expr: f > B.olfatea + 20 ? "nervous" : "smile", armL: "hip", armR: f > B.olfatea + 20 ? "chin" : "hang" });
        else G(OWNER, 1, o.p, { legs: "kneel", ...turn([o.p[0], o.p[2]], [bx + 0.1, bz + 0.65]), expr: found ? (f > B.copa + 10 ? "laugh" : "shock") : "nervous", armL: found ? "up" : "front", armR: found ? (f > B.copa + 10 ? "up" : "mouth") : "front", holdR: !found ? "paper" : undefined });
        // Pickles: trots ahead, nose down at the hedge, digs, then sits by the cup wagging
        const tgt: [number, number] = [bx, bz];
        if (f < B.olfatea - 6) dog(d.p, { mode: d.walk ? "walk" : "stand", phase: f * 0.075, facing: d.walk ? dogFace(d.p, [d.p[0] + d.h[0], d.p[2] + d.h[1]]) : dogFace(d.p, tgt), tongue: true });
        else if (f < B.envuelta) dog(d.p, { mode: "sniff", phase: f * 0.06, facing: dogFace(d.p, tgt) });
        else if (f < B.copa - 30) dog(d.p, { mode: "dig", phase: f * 0.09, facing: dogFace(d.p, tgt), alert: true });
        else if (d.walk) dog(d.p, { mode: "walk", phase: f * 0.075, facing: dogFace(d.p, [d.p[0] + d.h[0], d.p[2] + d.h[1]]), tongue: true });
        else dog(d.p, { mode: f > B.copa + 30 ? "beg" : "sit", facing: dogFace(d.p, [bx + 0.1, bz + 0.65]), tongue: true, alert: true });
      }
    } else if (place === "hall") {
      const [vx, , vz] = VITRINE;
      // the guard, asleep on his chair by the case
      G(GUARD, 10, [GUARD_AT[0], SIT_Y, GUARD_AT[2]], { legs: "sit", ...turn([GUARD_AT[0], GUARD_AT[2]], [vx, vz + 3]), expr: "smile_closed", blink: 1, headTilt: 0.18 + 0.03 * Math.sin(f * 0.08), armL: "low", armR: "low" });
      // two visitors admire the cup, then stroll off
      for (let i = 0; i < 2; i++) { const t = ramp(f, B.vitrina + 10 + i * 8, B.vitrina + 80 + i * 8), x = lerp(vx - 2.1 - i * 0.15, vx - 7.5 - i * 0.6, ease(t)), z = lerp(vz - 0.9 + i * 1.3, vz - 1.4 + i * 0.5, t), mv = t > 0 && t < 1;
        G(memo("vis" + i, () => visitor(i + 2)), 20 + i, [x, 0, z], mv ? { legs: "walk", phase: f * 0.05 + i, ...turn([x, z], [x - 5, z]), expr: "smile" } : { ...turn([x, z], [vx, vz]), expr: i ? "smile" : "proud", armR: i ? "point" : "hang", armL: i ? "hang" : "hip" }); }
      // the thief
      if (f > B.vitrina + 14) { const w = THIEF_AT(f), got = f > GRAB + 10, lifting = f > GRAB - 4 && f < GRAB_END;
        if (w.walk) G(THIEF, 30, w.p, walkPose(w, 30, { expr: got ? "grin" : "determined", armR: got ? "front" : "hang", holdR: got ? "trophy" : undefined, armL: "hang" }));
        else G(THIEF, 30, w.p, { ...turn([w.p[0], w.p[2]], [vx, vz]), expr: "determined", armL: lifting && f < GRAB + 12 ? "up" : "front", armR: lifting && f < GRAB + 12 ? "up" : "front", holdR: got ? "trophy" : undefined }); }
    } else if (place === "office") {
      const p = BOSS_AT, opened = f > B.trozo - 10, letter = f > B.carta - 8, police = f > B.policia;
      G(CHAIRMAN, 40, p, { facing: 0, expr: police ? (f > B.nada ? "angry" : "stern") : letter ? "shock" : opened ? "nervous" : "neutral", armL: police ? "hip" : letter ? "front" : "front", holdL: letter && !police ? "paper" : undefined, armR: police ? (f > B.nada ? "point" : "chin") : opened && !letter ? "mouth" : "front", headTilt: police ? 0 : 0.12 });
      for (const [ch, at, seed, role] of [[DET1, DET1_AT, 41, 0], [SUSPECT, SUSP_AT, 42, 1], [DET2, DET2_AT, 43, 2]] as [Char, (f: number) => Walker, number, number][]) { const w = at(f); if (w.p[2] > OFFICE_DOOR_Z) continue;
        const nada = f > B.nada, sp = SUSP_AT(f).p, look: Pose = role === 1 ? { facing: 0 } : turn([w.p[0], w.p[2]], role === 0 ? [sp[0] + 3, sp[2]] : [sp[0] - 3, sp[2]]);
        const still: Pose = role === 1 ? { ...look, expr: nada ? "grin" : "stern", armL: "low", armR: "low" } : { ...look, expr: nada ? "nervous" : "determined", armL: nada ? "hip" : "hang", armR: nada ? (role ? "front" : "chin") : "hang" };
        G(ch, seed, w.p, w.walk ? walkPose(w, seed, { expr: role === 1 ? "stern" : "determined", armL: role === 1 ? "low" : "hang", armR: role === 1 ? "low" : "hang" }) : still); }
    } else {
      const [tx, , tz] = TABLE, cheer = f > B.banquete, dogOn = f > B.perro - 30;
      for (let i = 0; i < 14; i++) for (const s of [-1, 1]) { if (s > 0 && i === 7) continue; if (s < 0 && i >= 4 && i <= 9) continue; const x = tx - 5.6 + i * 0.86, z = tz + s * 1.25, seed = 60 + i * 2 + (s > 0 ? 1 : 0), up = cheer && Math.sin(f * 0.11 + i * 1.7) > -0.2;
        const lookAt: number[] = dogOn ? [DOG_CHAIR[0], DOG_CHAIR[2]] : [x + (i % 3 - 1) * 0.9, tz];
        G(memo("pl" + i + s, () => player(i * 2 + (s > 0 ? 1 : 0))), seed, [x, SIT_Y + 0.04, z], { legs: "sit", ...turn([x, z], lookAt), expr: cheer ? (i % 3 ? "laugh" : "grin") : i % 2 ? "smile" : "laugh", armR: up ? "up" : "front", holdR: "glass", armL: i % 4 === 1 && cheer ? "up" : "hang" }); }
      for (let i = 0; i < 2; i++) { const x = tx - 5.8 + i * 11.4 + 0.5 * Math.sin(f * 0.01 + i), z = tz + 2.35; G(memo("wt" + i, () => waiter(i)), 90 + i, [x, 0, z], { ...turn([x, z], [x, tz]), expr: dogOn ? "shock" : "smile", armR: "front", holdR: "plate", armL: "hang" }); }
      dog([DOG_CHAIR[0], DOG_CHAIR[1], DOG_CHAIR[2]], { mode: f > B.perro + 8 ? "beg" : "sit", facing: 0, tongue: true, alert: f > B.perro }, 0.8);
    }
    return st;
  }
  update(id: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene, gl?: THREE.WebGLRenderer) {
    const s = SHOTS[id - 1], L = LIGHTS[s.light as LightK], P = LOOK[s.place];
    const c = camAt(id, f);
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll); cam.fov = c.fov; cam.near = 0.05; cam.far = 1200; cam.updateProjectionMatrix(); cam.updateMatrixWorld(); cam.layers.enable(NOINK);
    const focus = new THREE.Vector3(...c.look);
    const yaw = THREE.MathUtils.degToRad(P.key[2]), el = THREE.MathUtils.degToRad(P.key[3]);
    this.sunDir.set(Math.sin(yaw) * Math.cos(el), Math.sin(el), Math.cos(yaw) * Math.cos(el)).normalize();
    this.right.set(1, 0, 0).applyQuaternion(cam.quaternion); this.camF.set(0, 0, -1).applyQuaternion(cam.quaternion);
    this.lightAngle = Math.round(Math.atan2(-this.sunDir.y, this.sunDir.dot(this.right)) / (Math.PI / 4)) * (Math.PI / 4);
    this.sun.color.set(P.key[0]); this.sun.intensity = P.key[1]; this.sun.castShadow = P.shadow; this.hemi.intensity = P.hemi; this.hemi.color.set(s.place === "street" ? "#8fa4ff" : "#fff4e6");
    if (gl) { if (!this.pmrem) this.pmrem = new THREE.PMREMGenerator(gl); let e = this.envs[P.env]; if (!e) { e = this.pmrem.fromEquirectangular(skyTex(P.env)).texture; this.envs[P.env] = e; } scene.environment = e; scene.environmentIntensity = P.ei; }
    this.skyMat.map = skyTex("night"); this.sky.visible = P.sky; this.sky.position.copy(cam.position);
    const Rr = 26; this.sun.position.copy(focus).addScaledVector(this.sunDir, 200); this.sun.target.position.copy(focus);
    const sc = this.sun.shadow.camera; sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = 20; sc.far = 500; sc.updateProjectionMatrix();
    this.sun.shadow.bias = L.bias; this.sun.shadow.normalBias = L.normalBias * (Rr / 12);
    CHAR.uCharTint.value.set(...L.charTint); CHAR.uCharShade.value = L.charShade; CHAR.uGrad.value = L.charGrad; CHAR.uBodyGrad.value = L.bodyGrad; CHAR.uSideTint.value.set(...L.sideTint);
    untone(P.fog[0], this.fog.color); this.fog.near = P.fog[1]; this.fog.far = P.fog[2]; scene.fog = this.fog; scene.background = null;
    // only this shot's place exists for the renderer (its lights included)
    for (const [k, g] of Object.entries(this.W.groups)) g.visible = k === s.place;
    TREE_T.value = f / 30;
    for (const cr of this.W.crowds) cr.c.tick(f, cr.place === "banquet" ? (f > B.banquete ? 1 : 0.5) : 0.15);
    // the cup's story: in its case, gone; a piece in the parcel; the bundle, unwrapped; on the banquet table
    const [hallCup, streetCup] = this.W.trophies; hallCup.visible = f < GRAB + 10;
    if (this.W.glassCase) { const up = ease(ramp(f, GRAB - 2, GRAB + 8)) * (1 - ease(ramp(f, GRAB_END - 8, GRAB_END))); this.W.glassCase.position.y = 1.55 + 0.32 * up; }
    const found = f > UNWRAP; if (this.W.bundle) this.W.bundle.visible = !found; if (this.W.paperOpen) this.W.paperOpen.visible = found; streetCup.visible = found;
    if (found) { const k = ease(ramp(f, UNWRAP, UNWRAP + 20)); streetCup.rotation.y = 0.6 * (1 - k) + 0.15 * Math.sin(f * 0.02); }
    if (this.W.lining) this.W.lining.position.y = 0.92;
    void CUTS;
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
      m.scale.set((p.mirror ? -1 : 1) * p.scale, p.scale, p.scale); m.castShadow = true; }
    for (const { e, p } of fr) { e.use(!!p.soft); e.bind(); e.soft.color.setScalar(p.glow ?? 1); e.mat.color.setScalar(p.glow ?? 1); const m = e.mesh; m.visible = true; m.position.set(p.x, p.y, p.z); m.scale.set(p.w, p.h, 1);
      if (p.flat) m.rotation.set(-Math.PI / 2, 0, p.rot ?? 0); else if (p.fixed) m.rotation.set(0, 0, p.rot ?? 0); else { m.rotation.set(0, 0, 0); m.lookAt(cam.position); if (p.rot) m.rotateZ(p.rot); } }
    return focus;
  }
}
