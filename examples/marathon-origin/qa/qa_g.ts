// Frame checker for the origin-of-the-marathon short: runs the real staging and camera for every frame (no rendering) and reports
// figures cut by the frame edge, figures overlapping each other, figures inside solids, and the camera inside solids.
const fakeCtx: any = new Proxy({}, { get: (_t, k) => k === "createImageData" ? (w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h }) : k === "getImageData" ? (_x: number, _y: number, w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4) }) : k === "createLinearGradient" || k === "createRadialGradient" || k === "createPattern" || k === "createConicGradient" ? () => ({ addColorStop() {} }) : k === "measureText" ? () => ({ width: 10 }) : k === "canvas" ? { width: 8, height: 8 } : () => undefined, set: () => true });
(globalThis as any).document = { createElement: () => ({ width: 8, height: 8, style: {}, getContext: () => fakeCtx, addEventListener() {}, setAttribute() {} }) };
(globalThis as any).QA_FAST = true; (globalThis as any).window = globalThis;
import * as THREE from "three";
const { World } = await import("../src/g/world");
const { camAt, shotAt, TOTAL, ERA_SWITCH } = await import("../src/g/story");
const { H, HE } = await import("../src/g/geo");
const { SOLIDS } = await import("../src/g/real");
const w: any = new World(), cam = new THREE.PerspectiveCamera(50, 1080 / 1920, 0.1, 1700), v = new THREE.Vector3();
const out: Record<string, number[]> = {};
const flag = (k: string, f: number) => { (out[k] ??= []).push(f); };
const step = Number(process.argv[2] ?? 1);
for (let f = 0; f < TOTAL; f += step) {
  const id = shotAt(f).id, c = camAt(id, f); cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll); cam.fov = c.fov; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
  w.cam.copy(cam.position); w.right.set(1, 0, 0).applyQuaternion(cam.quaternion); w.camF.set(0, 0, -1).applyQuaternion(cam.quaternion);
  const SOL = SOLIDS.filter((s: any) => !(s.name.startsWith("A:") && f >= ERA_SWITCH) && !(s.name.startsWith("B:") && f < ERA_SWITCH));
  for (const s of SOL) if (c.pos[0] > s.x0 - 0.3 && c.pos[0] < s.x1 + 0.3 && c.pos[2] > s.z0 - 0.3 && c.pos[2] < s.z1 + 0.3 && c.pos[1] < s.y1 + 0.3) flag(`camera inside ${s.name}`, f);
  // the rail fences along the road (posts 1.3 m, rails at 0.55 and 1.05 m, 5.1 m either side of the centre line)

  { const gy = c.pos[0] > 3000 ? HE(c.pos[0], c.pos[2]) : H(c.pos[0], c.pos[2]); if (c.pos[1] < gy + 0.6) flag("camera at or under the ground", f); }
  const st = w.stage(id, f), figs = st.places.filter((p: any) => p.key.startsWith("G|") && !p.crowd);
  for (const p of figs) { const sc = p.scale ?? 1, lying = Math.abs(p.roll ?? 0) > 1;
    const rx = w.right.x, rz = w.right.z, pts = lying ? [[p.x + 0.1 * rx, p.y + 0.2, p.z + 0.1 * rz], [p.x - 1.95 * rx, p.y + 0.3, p.z - 1.95 * rz]] : [[p.x, p.y + 0.02, p.z], [p.x, p.y + 1.95 * sc, p.z], [p.x - 0.42 * sc, p.y + 1.1 * sc, p.z], [p.x + 0.42 * sc, p.y + 1.1 * sc, p.z]];
    let inn = 0, depth = 1e9; const ndc: number[][] = [];
    for (const q of pts) { v.set(q[0], q[1], q[2]).applyMatrix4(cam.matrixWorldInverse); depth = Math.min(depth, -v.z); v.set(q[0], q[1], q[2]).project(cam); ndc.push([v.x, v.y]); if (v.z < 1 && Math.abs(v.x) <= 1 && Math.abs(v.y) <= 1) inn++; }
    const name = `#${p.seed} ` + (p.key.match(/hair":\{"k":"(\w+)"/)?.[1] ?? "") + " " + (p.key.match(/"top":"(#\w+)"/)?.[1] ?? "");
    const hpx = Math.abs(ndc[0][1] - ndc[1][1]) * 960;
    if (depth < 0.6 && inn > 0) flag(`too close to lens: ${name}`, f);
    else if (inn > 0 && inn < pts.length && hpx > 150) flag(`cut by frame (${lying ? "lying" : ndc[0][1] < -1 ? "feet" : ndc[1][1] > 1 ? "head" : "side"}): ${name}`, f);
    if (!lying) for (const s of SOL) if (p.x > s.x0 - 0.2 && p.x < s.x1 + 0.2 && p.z > s.z0 - 0.2 && p.z < s.z1 + 0.2 && p.y < s.y1 - 0.05 && p.y + 1.8 > s.y0) flag(`inside ${s.name}: ${name}`, f);
    if (!lying && inn > 0) { const gy = p.x > 3000 ? HE(p.x, p.z) : H(p.x, p.z), seated = p.key.includes('"legs":"sit"'); if (!seated && p.y - gy > 0.45 && p.y < 3.0 + gy && Math.abs(p.y - 3.2) > 0.1) flag(`floating: ${name}`, f); if (p.y - gy < -0.25) flag(`sunk in the ground: ${name}`, f); }
  }
  for (let i = 0; i < figs.length; i++) for (let j = i + 1; j < figs.length; j++) { const a = figs[i], b = figs[j]; if (Math.abs(a.y - b.y) > 0.6) continue; if (Math.abs(a.roll ?? 0) > 1 || Math.abs(b.roll ?? 0) > 1) continue; if (Math.hypot(a.x - b.x, a.z - b.z) < 0.55) flag(`overlap: #${a.seed} / #${b.seed}`, f); }
}
const runs = (fs: number[]) => { const r: string[] = []; let s = fs[0], p = fs[0]; for (const x of fs.slice(1)) { if (x - p > step) { r.push(s === p ? `${s}` : `${s}-${p}`); s = x; } p = x; } r.push(s === p ? `${s}` : `${s}-${p}`); return r.join(" "); };
const keys = Object.keys(out).filter((k) => !(k.startsWith("cut by frame (side)") && out[k].length * step < 10)).sort((a, b) => out[a][0] - out[b][0]);
console.log(keys.length ? keys.map((k) => `${k}  [${out[k].length}]  ${runs(out[k])}`).join("\n") : "CLEAN: no figure cut, overlapping, floating or inside a solid; camera never inside a solid or under the ground");
