import * as THREE from "three";
import { Batch, pmat } from "./real";
import { NOINK } from "./ink";
import { TREE_T } from "./trees";
const PRISM = (() => { const g = new THREE.BufferGeometry(), p = [-0.5, 0, -0.5, 0.5, 0, -0.5, 0.5, 1, 0, -0.5, 1, 0, -0.5, 0, 0.5, 0.5, 0, 0.5]; const idx = [0, 3, 2, 0, 2, 1, 4, 5, 2, 4, 2, 3, 0, 4, 3, 1, 2, 5];
  const pos: number[] = [], nor: number[] = []; for (let t = 0; t < idx.length; t += 3) { const a = new THREE.Vector3(...p.slice(idx[t] * 3, idx[t] * 3 + 3)), b = new THREE.Vector3(...p.slice(idx[t + 1] * 3, idx[t + 1] * 3 + 3)), c = new THREE.Vector3(...p.slice(idx[t + 2] * 3, idx[t + 2] * 3 + 3)), n = b.clone().sub(a).cross(c.clone().sub(a)).normalize(); for (const v of [a, b, c]) { pos.push(v.x, v.y, v.z); nor.push(n.x, n.y, n.z); } }
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(pos.map((_v, i) => (i % 3 === 1 ? 0 : 0)).slice(0, (pos.length / 3) * 2), 2)); return g; })();
export const prism = (B: Batch, mat: THREE.Material, x: number, y: number, z: number, w: number, h: number, d: number, yaw = 0) => {
  const m = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, 0)), new THREE.Vector3(w, h, d)); B.put("prism", PRISM, mat, m); };
const flagTex = (kind: "gr" | "red") => { const cv = document.createElement("canvas"); cv.width = 270; cv.height = 180; const c = cv.getContext("2d")!;
  if (kind === "gr") { for (let i = 0; i < 9; i++) { c.fillStyle = i % 2 ? "#f8f8f4" : "#2a5fb0"; c.fillRect(0, i * 20, 270, 20); } c.fillStyle = "#2a5fb0"; c.fillRect(0, 0, 100, 100); c.fillStyle = "#f8f8f4"; c.fillRect(40, 0, 20, 100); c.fillRect(0, 40, 100, 20); }
  else { c.fillStyle = "#b8262e"; c.fillRect(0, 0, 270, 180); c.fillStyle = "#e8c45a"; c.fillRect(0, 75, 270, 30); }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t; };
export const flag = (parent: THREE.Object3D, refs: { flags: THREE.Mesh[] }, x: number, y: number, z: number, kind: "gr" | "red", s = 1, yaw = 0) => {
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05 * s, 0.06 * s, 6 * s, 8), pmat("#e9e4d8", 0.5)); pole.position.set(x, y + 3 * s, z); pole.castShadow = true; parent.add(pole);
  const mat = new THREE.MeshStandardMaterial({ map: flagTex(kind), side: THREE.DoubleSide, roughness: 0.85 }); const ph = { value: x * 0.37 + z };
  mat.onBeforeCompile = (sh) => { sh.uniforms.uT = TREE_T; sh.uniforms.uPh = ph; sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nuniform float uT; uniform float uPh;").replace("#include <begin_vertex>", "#include <begin_vertex>\nfloat fu = position.x / 1.5 + 0.5; transformed.z += fu * 0.28 * sin( uT * 6.0 - fu * 5.0 + uPh ); transformed.y -= fu * fu * 0.12;"); };
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(1.5 * s, 1.0 * s, 12, 4), mat); fl.position.set(x + 0.75 * s * Math.cos(yaw), y + 5.4 * s, z - 0.75 * s * Math.sin(yaw)); fl.rotation.y = yaw; fl.castShadow = true; parent.add(fl); refs.flags.push(fl);
  pole.layers.set(NOINK); fl.layers.set(NOINK); };
