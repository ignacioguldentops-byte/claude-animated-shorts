// Look development for trees v2: a slope of Attic trees (olive, cypress, stone pine) and an English oak and plane,
// lit by the sun and the sky (same light as the film), seen from three distances.
import React, { useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, getInputProps } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { EffectComposer, N8AO } from "@react-three/postprocessing";
import { ToneMappingEffect, ToneMappingMode } from "postprocessing";
import { skyTex, turf } from "./pbr";
import { wmat } from "./real";
import { makeTreesV2, TSpec } from "./trees";
import { NOINK } from "./ink";
const Inner: React.FC<{ view: number }> = ({ view }) => {
  const { scene, camera, gl } = useThree();
  const root = useMemo(() => { const R = new THREE.Group();
    const sky = new THREE.Mesh(new THREE.SphereGeometry(900, 48, 24), new THREE.MeshBasicMaterial({ map: skyTex("day"), side: THREE.BackSide, depthWrite: false })); R.add(sky);
    const sun = new THREE.DirectionalLight("#fff2de", 3.6); sun.position.set(-60, 90, 50); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); const sc = sun.shadow.camera; sc.left = sc.bottom = -40; sc.right = sc.top = 40; sc.near = 10; sc.far = 300; sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.04; R.add(sun);
    const g = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), wmat("labTurf", turf("labTurf", 0, [92, 112, 52], [118, 132, 64]), 3)); g.rotation.x = -Math.PI / 2; g.receiveShadow = true; R.add(g);
    const T: TSpec[] = [{ x: -6, z: 0, h: 5, sp: "olive", seed: 1 }, { x: 0, z: -2, h: 5.5, sp: "olive", seed: 2 }, { x: 6, z: 1, h: 4.6, sp: "olive", seed: 3 }, { x: -12, z: -10, h: 14, sp: "cypress", seed: 4 }, { x: -9, z: -12, h: 11, sp: "cypress", seed: 5 },
      { x: 12, z: -14, h: 13, sp: "pine", seed: 6 }, { x: 0, z: -22, h: 15, sp: "oak", seed: 7 }, { x: 20, z: -26, h: 16, sp: "plane", seed: 8 }, { x: -22, z: -28, h: 18, sp: "poplar", seed: 9 }];
    for (let i = 0; i < 40; i++) T.push({ x: -60 + i * 3.1, z: -55 - 6 * Math.sin(i), h: 6 + 6 * Math.abs(Math.sin(i * 1.7)), sp: (["olive", "cypress", "pine", "olive"] as const)[i % 4], seed: 20 + i, lod: 2 });
    makeTreesV2(R, T); return R; }, []);
  useMemo(() => { const pm = new THREE.PMREMGenerator(gl); scene.environment = pm.fromEquirectangular(skyTex("day")).texture; scene.environmentIntensity = 0.9; }, [gl, scene]);
  const cam = camera as THREE.PerspectiveCamera; const V = [[[0, 1.6, 9], [0, 2.6, 0]], [[-2, 5, 26], [0, 5, -6]], [[3, 1.5, 4.2], [0, 2.2, -2]]][view];
  cam.position.set(...(V[0] as [number, number, number])); cam.lookAt(...(V[1] as [number, number, number])); cam.layers.enable(NOINK); cam.fov = 50; cam.near = 0.1; cam.far = 1500; cam.updateProjectionMatrix();
  return <><primitive object={root} dispose={null} /><EffectComposer multisampling={4}><N8AO aoRadius={1.6} distanceFalloff={1.2} intensity={2.6} quality="medium" halfRes color="#1a1626" /><primitive object={useMemo(() => new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }), [])} dispose={null} /></EffectComposer></>;
};
export const TreeLab: React.FC = () => { const view = (getInputProps() as { view?: number }).view ?? 0;
  return <AbsoluteFill><ThreeCanvas width={1080} height={1920} shadows gl={{ antialias: false, stencil: false }} camera={{ fov: 50, near: 0.1, far: 1500 }}><Inner view={view} /></ThreeCanvas></AbsoluteFill>; };
