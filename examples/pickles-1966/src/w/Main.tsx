// "The Bridge That Fell for a Song": our original 67 s short in the flat-characters-in-a-3D-toon-world style.
// One three.js world (world.ts) posed per frame from the story timeline (story.ts). Post chain (look-match pass):
//   InkPass (world ink lines, own pass) -> lens blur pre + main (thin-lens DOF per shot from dofAt) ->
//   [bloom (emissive only) + NEUTRAL tone mapping + colour grade] (one merged EffectPass), MSAA 4.
// Ink runs before the DOF so lines blur with what they belong to; bloom after the DOF so glows defocus with their
// source; the grade is display-referred, so it comes after tone mapping. Every pixel-sized parameter is specified at
// 1080x1920 and scaled with the output size, so stills at --scale 0.5 and the 1440x2560 final match.
// Place changes crossfade by stacking a second canvas for the fade frames; the hook ends on a 4-frame white flash.
import React, { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { AbsoluteFill, continueRender, delayRender, getInputProps, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { EffectComposer, N8AO } from "@react-three/postprocessing";
import { BlendFunction, BloomEffect, ToneMappingEffect, ToneMappingMode } from "postprocessing";
import { World } from "./world";
import { InkPass, noInkFallback } from "./ink";
import { LensBlur, GrainEffect } from "./lensblur";
import { GradeEffect, GRADES, GRADE_STRENGTH, gradeFor } from "./grade";

import { TOTAL, FLASH_AT, FLASH2, SHOTS, layersAt, dofAt, camAt, lightingAt } from "./story";

export const MAD_FRAMES = TOTAL;

/** A/B switches for test stills only (Remotion inputProps `{ post: { ink: false, ... } }`); everything is on by default. */
type PostToggles = { ink: boolean; lens: boolean; pre: boolean; bloom: boolean; grade: boolean; grain: boolean; ao: boolean };
const toggles = (): PostToggles => ({ ink: false, lens: true, pre: true, bloom: true, grade: true, grain: false, ao: true, ...((getInputProps() as { post?: Partial<PostToggles> }).post ?? {}) });

/** Bloom for emissive sources only (depth.md 6.4). Its MIP chain always starts at 540x960 (half of 1080x1920),
 *  whatever the output size, so the glow keeps the same size relative to the frame (e-fold ~30 px at 1080p,
 *  ~1.5 % of the frame height) at 540, 1080 and 1440 widths. ADD blend: HDR-safe (SCREEN darkens values > 1). */
const makeBloom = () => {
  const b = new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.5, luminanceThreshold: 1.0, luminanceSmoothing: 0.2, mipmapBlur: true, levels: 6, radius: 0.6 });
  const mip = b.mipmapBlurPass;
  const setSize = mip.setSize.bind(mip);
  mip.setSize = (w: number, h: number) => setSize(Math.round((1920 * w) / Math.max(h, 1)), 1920);
  return b;
};

const fwd = new THREE.Vector3(), fpt = new THREE.Vector3();


const Inner: React.FC<{ id: number }> = ({ id }) => {
  const f = useCurrentFrame();
  const { camera, scene, gl } = useThree();
  const world = useMemo(() => new World(), []);
  const target = useMemo(() => new THREE.Vector3(), []);
  const on = useMemo(toggles, []);
  const fx = useMemo(() => ({
    ink: new InkPass(scene, camera as THREE.PerspectiveCamera),
    lens: new LensBlur({ maxCoC: 24, nearScale: 1.2 }),
    bloom: makeBloom(),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
    grade: new GradeEffect(GRADES.day, GRADE_STRENGTH.day),
    grain: new GrainEffect({ amount: 0.025, cellPx: 1.5 }), // film grain, OFF by default (inputProps post.grain): the reference measures no grain and it quadruples the file size
  }), [camera, scene]);
  useEffect(() => () => { (fx.ink as unknown as { dispose?: () => void }).dispose?.(); }, [fx]);
  const post = useMemo(() => (
    <EffectComposer multisampling={4}>
      {on.ao ? <N8AO aoRadius={1.6} distanceFalloff={1.2} intensity={2.6} quality="medium" halfRes color="#1a1626" /> : <></>}
      {on.ink ? <primitive object={fx.ink} dispose={null} /> : null}
      {on.lens && on.pre ? <primitive object={fx.lens.pre} dispose={null} /> : null}
      {on.lens ? <primitive object={fx.lens.main} dispose={null} /> : null}
      {on.bloom ? <primitive object={fx.bloom} dispose={null} /> : null}
      <primitive object={fx.tone} dispose={null} />
      {on.grade ? <primitive object={fx.grade} dispose={null} /> : null}
      {on.grain ? <primitive object={fx.grain} dispose={null} /> : null}
    </EffectComposer>
  ), [fx, on]);
  const cam = camera as THREE.PerspectiveCamera;
  target.copy(world.update(id, f, cam, scene, gl));
  noInkFallback(world.root);
  // thin-lens focus: distance along the view axis to the shot's focus point (default: the camera's look target)
  const d = dofAt(id, f);
  cam.getWorldDirection(fwd);
  fpt.copy(target);
  fx.lens.focus = Math.max(0.3, fpt.sub(cam.position).dot(fwd));
  fx.lens.cInf = d.cInf;
  gradeFor(fx.grade, SHOTS[id - 1].light);
  fx.grain.seed = f; // deterministic per frame
  return (
    <>
      <primitive object={world.root} dispose={null} />
      {post}
    </>
  );
};

/** test stills only: inputProps `{ post: { dpr: 0.5 } }` forces the WebGL buffer size (R3F clamps dpr to >= 1 by default) */
const dprOverride = () => (getInputProps() as { post?: { dpr?: number } }).post?.dpr;
/** screen-space lighting over the 3D canvas: a multiply night wash with light pools cut out of it (they light the
 *  characters too), additive glows on hands / lamps / the cup, slanted light shafts and a vignette. */
const pcam = new THREE.PerspectiveCamera(40, 1080 / 1920, 0.1, 1500), pv = new THREE.Vector3();
const Lights: React.FC<{ id: number }> = ({ id }) => {
  const f = useCurrentFrame();
  const c = camAt(id, f), L = lightingAt(id, f);
  pcam.position.set(...c.pos); pcam.up.set(0, 1, 0); pcam.lookAt(...c.look); pcam.rotateZ(c.roll); pcam.fov = c.fov; pcam.updateProjectionMatrix(); pcam.updateMatrixWorld();
  const proj = (p: [number, number, number], r: number) => {
    pv.set(...p).applyMatrix4(pcam.matrixWorldInverse); const depth = -pv.z;
    pv.set(...p).project(pcam);
    return { x: (pv.x * 0.5 + 0.5) * 1080, y: (1 - (pv.y * 0.5 + 0.5)) * 1920, r: depth > 0.05 ? (r * 960) / (Math.tan((c.fov * Math.PI) / 360) * depth) : 0 };
  };
  const full: React.CSSProperties = { position: "absolute", left: 0, top: 0, width: "100%", height: "100%" };
  const u = `l${id}`;
  return (
    <>
      <svg viewBox="0 0 1080 1920" style={{ ...full, mixBlendMode: "multiply" }}>
        <defs>
          <radialGradient id={`${u}h`}><stop offset="0" stopColor="#000" stopOpacity="1" /><stop offset="0.45" stopColor="#000" stopOpacity="0.95" /><stop offset="1" stopColor="#000" stopOpacity="0" /></radialGradient>
          <radialGradient id={`${u}v`} cx="0.5" cy="0.46" r="0.75"><stop offset="0.45" stopColor="#1b1440" stopOpacity="0" /><stop offset="1" stopColor="#1b1440" stopOpacity={L.vig} /></radialGradient>
          <mask id={`${u}m`}><rect width="1080" height="1920" fill="#fff" />
            {L.pools.map((p, i) => { const q = proj(p.p, p.r); return q.r > 0 ? <circle key={i} cx={q.x} cy={q.y} r={q.r} fill={`url(#${u}h)`} /> : null; })}
          </mask>
        </defs>
        {L.wash ? <rect width="1080" height="1920" fill={L.wash.col} opacity={L.wash.a} mask={`url(#${u}m)`} /> : null}
        <rect width="1080" height="1920" fill={`url(#${u}v)`} />
      </svg>
      <svg viewBox="0 0 1080 1920" style={{ ...full, mixBlendMode: "screen" }}>
        <defs>
          {L.glows.map((g, i) => <radialGradient key={i} id={`${u}g${i}`}><stop offset="0" stopColor={g.col} stopOpacity={g.a} /><stop offset="0.35" stopColor={g.col} stopOpacity={g.a * 0.45} /><stop offset="1" stopColor={g.col} stopOpacity="0" /></radialGradient>)}
          <linearGradient id={`${u}b`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff4d0" stopOpacity={0.5 * (L.beams ?? 0)} /><stop offset="1" stopColor="#fff4d0" stopOpacity="0" /></linearGradient>
          <filter id={`${u}f`}><feGaussianBlur stdDeviation="14" /></filter>
        </defs>
        {L.beams ? <g filter={`url(#${u}f)`} transform={`rotate(${-18 + 1.5 * Math.sin(f / 30)} 900 -200)`}>
          {[0, 1, 2, 3, 4].map((i) => <polygon key={i} points={`${420 + i * 150},-200 ${500 + i * 150},-200 ${330 + i * 190 + 12 * Math.sin(f / 20 + i)},1500 ${130 + i * 190 + 12 * Math.sin(f / 20 + i)},1500`} fill={`url(#${u}b)`} opacity={0.5 + 0.5 * ((i * 37) % 3) / 2} />)}
        </g> : null}
        {L.glows.map((g, i) => { const q = proj(g.p, g.r); return q.r > 0 ? <circle key={i} cx={q.x} cy={q.y} r={q.r} fill={`url(#${u}g${i})`} /> : null; })}
        {L.tint ? <rect width="1080" height="1920" fill={L.tint.col} opacity={L.tint.a} /> : null}
      </svg>
    </>
  );
};
const ShotView: React.FC<{ id: number; alpha: number }> = ({ id, alpha }) => (
  <AbsoluteFill style={{ opacity: alpha }}>
    <ThreeCanvas width={1080} height={1920} {...(dprOverride() ? { dpr: dprOverride() } : {})} shadows gl={{ antialias: false, stencil: false, powerPreference: "high-performance", toneMappingExposure: 1.0 }}
      camera={{ fov: 40, near: 0.2, far: 1500 }}>
      <Inner id={id} />
    </ThreeCanvas>
    <Lights id={id} />
  </AbsoluteFill>
);

export const PicklesShort: React.FC = () => {
  const f = useCurrentFrame();
  const fa = f >= FLASH2 ? FLASH2 : FLASH_AT;
  const flash = f >= fa && f < fa + 4 ? [1, 0.75, 0.45, 0.2][f - fa] : 0;
  return (
    <AbsoluteFill style={{ background: "#101018" }}>
      {layersAt(f).map((l, i) => <ShotView key={i ? "over" : "base"} id={l.id} alpha={l.alpha} />)}
      {flash > 0 && <AbsoluteFill style={{ background: "#ffffff", opacity: flash }} />}
    </AbsoluteFill>
  );
};
