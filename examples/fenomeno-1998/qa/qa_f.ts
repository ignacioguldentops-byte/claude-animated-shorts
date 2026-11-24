// Frame checker for the Fenómeno short: runs the real staging and camera for every frame (no rendering) and reports figures
// cut by the frame edge, overlapping, inside solids, floating or sunk, and the camera inside solids, walls or the floor.
const fakeCtx: any = new Proxy({}, { get: (_t, k) => k === "createImageData" ? (w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h }) : k === "getImageData" ? (_x: number, _y: number, w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4) }) : k === "createLinearGradient" || k === "createRadialGradient" || k === "createPattern" || k === "createConicGradient" ? () => ({ addColorStop() {} }) : k === "measureText" ? () => ({ width: 10 }) : typeof k === "string" && /^[a-z]/.test(k) && !["canvas", "fillStyle", "strokeStyle", "lineWidth", "globalAlpha", "font", "lineCap", "lineJoin", "globalCompositeOperation", "filter", "shadowBlur", "shadowColor", "textAlign", "textBaseline", "imageSmoothingEnabled", "miterLimit"].includes(k) ? () => fakeCtx : undefined, set: () => true });
(globalThis as any).document = { createElement: () => ({ width: 8, height: 8, style: {}, getContext: () => fakeCtx, addEventListener() {}, setAttribute() {} }) };
(globalThis as any).QA_FAST = true; (globalThis as any).window = globalThis;
import * as THREE from "three";
const { World } = await import("../src/f/world");
const { camAt, layersAt, SHOTS, TOTAL, ROOM, CORR, CLIN, VEST } = await import("../src/f/story");
const { SOLIDS } = await import("../src/f/real");
const w: any = new World(), cam = new THREE.PerspectiveCamera(50, 1080 / 1920, 0.1, 1700), v = new THREE.Vector3();
const out: Record<string, number[]> = {};
const flag = (k: string, f: number) => { (out[k] ??= []).push(f); };
const step = Number(process.argv[2] ?? 1);
const ROOMS: Record<string, { x: number; z: number; w: number; d: number; h: number }[]> = { hotel: [ROOM, CORR], clinic: [CLIN], vest: [VEST, { x: VEST.x + 2.6, z: VEST.z + 10.6, w: 2.2, d: 14.6, h: 2.8 }] };
const inside = (Rs: any[], x: number, z: number, y: number, m: number) => Rs.some((R) => Math.abs(x - R.x) <= R.w / 2 - m && Math.abs(z - R.z) <= R.d / 2 - m && y <= R.h - m);
const inPlace = (s: any, place: string) => { const x = (s.x0 + s.x1) / 2; return place === "hotel" ? x > 285 && x < 315 : place === "clinic" ? x > 330 && x < 350 : place === "vest" ? x > 370 && x < 395 : Math.abs(x) < 130; };
for (let f = 0; f < TOTAL; f += step) for (const L of layersAt(f)) {
  const id = L.id, place = SHOTS[id - 1].place, c = camAt(id, f), tag = `[${id}]`; cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll); cam.fov = c.fov; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
  w.right.set(1, 0, 0).applyQuaternion(cam.quaternion); w.camF.set(0, 0, -1).applyQuaternion(cam.quaternion);
  const SOL = SOLIDS.filter((s: any) => inPlace(s, place));
  for (const s of SOL) if (c.pos[0] > s.x0 - 0.25 && c.pos[0] < s.x1 + 0.25 && c.pos[2] > s.z0 - 0.25 && c.pos[2] < s.z1 + 0.25 && c.pos[1] < s.y1 + 0.25) flag(`${tag} camera inside ${s.name}`, f);
  if (c.pos[1] < 0.3) flag(`${tag} camera at the floor`, f);
  const R = ROOMS[place]; if (R && !inside(R, c.pos[0], c.pos[2], c.pos[1], 0.25)) flag(`${tag} camera outside the room walls`, f);
  const st = w.stage(id, f), figs = st.places.filter((p: any) => p.key.startsWith("G|"));
  for (const p of figs) { const sc = p.scale ?? 1, isDog = p.key.startsWith("G|dog"), hh = isDog ? 1.05 * sc : 1.95 * sc, ww = isDog ? 0.55 * sc : 0.42 * sc;
    const pts = [[p.x, p.y + 0.02, p.z], [p.x, p.y + hh, p.z], [p.x - ww, p.y + hh * 0.56, p.z], [p.x + ww, p.y + hh * 0.56, p.z]];
    let inn = 0, depth = 1e9; const ndc: number[][] = [];
    for (const q of pts) { v.set(q[0], q[1], q[2]).applyMatrix4(cam.matrixWorldInverse); depth = Math.min(depth, -v.z); v.set(q[0], q[1], q[2]).project(cam); ndc.push([v.x, v.y]); if (v.z < 1 && Math.abs(v.x) <= 1 && Math.abs(v.y) <= 1) inn++; }
    const name = isDog ? "Pickles" : `#${p.seed} ` + (p.key.match(/hair":\{"k":"(\w+)"/)?.[1] ?? "") + " " + (p.key.match(/"top":"(#\w+)"/)?.[1] ?? "");
    const hpx = Math.abs(ndc[0][1] - ndc[1][1]) * 960;
    if (depth < 0.5 && inn > 0) flag(`${tag} too close to lens: ${name}`, f);
    else if (inn > 0 && inn < pts.length && hpx > 150) flag(`${tag} cut by frame (${ndc[0][1] < -1 ? "feet" : ndc[1][1] > 1 ? "head" : "side"}): ${name}`, f);
    const lying = p.flat !== undefined || p.faceUp || !!p.roll, seated = p.key.includes('"legs":"sit"') || lying;
    if (!seated) for (const s of SOL) if (p.x > s.x0 - 0.15 && p.x < s.x1 + 0.15 && p.z > s.z0 - 0.15 && p.z < s.z1 + 0.15 && p.y < s.y1 - 0.05 && p.y + 1.5 > s.y0) flag(`${tag} inside ${s.name}: ${name}`, f);
    if (R && !inside(R, p.x, p.z, 0, 0.2)) flag(`${tag} in the wall: ${name}`, f);
    if (inn > 0 && !seated && p.y > 0.6) flag(`${tag} floating: ${name}`, f); if (p.y < -0.25) flag(`${tag} sunk: ${name}`, f);
  }
  for (let i = 0; i < figs.length; i++) for (let j = i + 1; j < figs.length; j++) { const a = figs[i], b = figs[j]; if (Math.abs(a.y - b.y) > 0.6) continue; if (Math.hypot(a.x - b.x, a.z - b.z) < 0.5) flag(`${tag} overlap: #${a.seed} / #${b.seed}`, f); }
}
const runs = (fs: number[]) => { const r: string[] = []; let s = fs[0], p = fs[0]; for (const x of fs.slice(1)) { if (x - p > step) { r.push(s === p ? `${s}` : `${s}-${p}`); s = x; } p = x; } r.push(s === p ? `${s}` : `${s}-${p}`); return r.join(" "); };
const keys = Object.keys(out).filter((k) => !(k.includes("cut by frame (side)") && out[k].length * step < 10)).sort((a, b) => out[a][0] - out[b][0]);
console.log(keys.length ? keys.map((k) => `${k}  [${out[k].length}]  ${runs(out[k])}`).join("\n") : "CLEAN: no figure cut, overlapping, floating or inside a solid; camera never inside a solid, a wall or the floor");
