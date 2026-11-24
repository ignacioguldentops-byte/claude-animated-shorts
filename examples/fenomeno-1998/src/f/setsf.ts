// The places of "El Fenómeno y la final" (France 1998): the hotel room the striker shares with his left-back (twin
// beds, the afternoon sun through the curtains), the hotel corridor, the clinic where they test him, and the dressing
// room under the stadium with its tunnel. The stadium itself is the one from "La trastienda" (setsq.ts), lit for night.
import * as THREE from "three";
import { Batch, wmat, pmat, solid } from "./real";
import * as S from "./pbr";
import { NOINK } from "./ink";
import { makeShrubs } from "./trees";
export const ROOM = { x: 300, z: 0, w: 5.4, d: 6.0, h: 2.9 }, CORR = { x: 300, z: 4.4, w: 18, d: 2.2, h: 2.8 }, CLIN = { x: 340, z: 0, w: 5.0, d: 5.6, h: 2.9 }, VEST = { x: 380, z: 0, w: 9.0, d: 7.0, h: 3.2 };
export const BED_A: [number, number, number] = [ROOM.x - 1.25, 0, ROOM.z - 2.0], BED_B: [number, number, number] = [ROOM.x + 1.15, 0, ROOM.z - 2.0];
export const RDOOR_X = ROOM.x + 1.9; // the room's door to the corridor (centre x), in the south wall
export const EXAM: [number, number, number] = [CLIN.x - 0.6, 0, CLIN.z - 1.0], VDOOR_X = VEST.x + 2.6;
export type FRefs = { lights: { l: THREE.PointLight; place: string; i: number }[]; groups: Record<string, THREE.Group>; doorLeaf: THREE.Object3D | null; vDoor: THREE.Object3D | null };
export const newFRefs = (): FRefs => ({ lights: [], groups: {}, doorLeaf: null, vDoor: null });
const R = (i: number, j: number, s = 0) => S.hash(i, j, 555 + s);
const M = { stucco: (c: string) => wmat("stucco" + c, S.stucco(), 3, { color: c }), brick: () => wmat("brickW", S.brick("brickW", [[150, 78, 58], [132, 66, 50], [162, 92, 66], [120, 62, 50], [142, 84, 62]]), 2),
  wood: (c: string, tile = 1.2) => wmat("wood" + c + tile, S.boards("wood", 5, 0.62), tile, { color: c }), floor: (c: string) => wmat("floor" + c, S.boards("floor", 7, 0.36), 1.3, { color: c }),
  cloth: (c: string) => wmat("cloth" + c, S.weave(), 0.22, { color: c }), felt: (c: string) => wmat("felt" + c, S.felt(), 0.3, { color: c }), leather: (c: string) => wmat("leather" + c, S.leather(), 0.3, { color: c }),
  brass: () => wmat("brass", S.brushed(), 0.4, { color: "#d9a94a", metalness: 1, roughness: 0.3 }), iron: () => pmat("#1c1c22", 0.5, 0.7), white: () => pmat("#f4f2ea", 0.5), conc: () => wmat("concW", S.concrete(), 1.2, { color: "#b9b6ae" }),
  asph: () => wmat("asphW", S.concrete(), 2.5, { color: "#4a4a50", roughness: 0.95 }), slate: () => wmat("slateW", S.slate(), 1.6), glass: () => new THREE.MeshPhysicalMaterial({ color: "#e8f2f6", roughness: 0.04, metalness: 0, transparent: true, opacity: 0.18, envMapIntensity: 1.6, depthWrite: false }) };
const lamp = (place: string, refs: FRefs, parent: THREE.Object3D, x: number, y: number, z: number, col: string, i: number, d: number, bulb = 0.12, shadow = false) => {
  if (i > 0) { const l = new THREE.PointLight(col, i, d, 2); l.position.set(x, y, z); l.castShadow = shadow; if (shadow) { l.shadow.mapSize.set(1024, 1024); l.shadow.bias = -0.002; l.shadow.radius = 4; } parent.add(l); refs.lights.push({ l, place, i }); }
  if (bulb) { const b = new THREE.Mesh(new THREE.SphereGeometry(bulb, 12, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(3.0) })); b.position.set(x, y, z); b.layers.set(NOINK); parent.add(b); } };
const tex = (key: string, w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) => { const cv = document.createElement("canvas"); cv.width = w; cv.height = h; draw(cv.getContext("2d")!); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.name = key; return t; };
/** sheets of stamps under glass: rows of little perforated pictures (no lettering) */
const stampTex = (k: number) => tex("stamps" + k, 512, 384, (g) => { g.fillStyle = "#efe6d0"; g.fillRect(0, 0, 512, 384); const cols = ["#b8342e", "#2f5f9a", "#3f7a3a", "#c98a2a", "#6a3a7a", "#2a7a7a"];
  for (let r = 0; r < 5; r++) for (let c = 0; c < 7; c++) { const x = 22 + c * 68, y = 24 + r * 70, col = cols[(c + r + k) % 6]; g.fillStyle = "#fbf7ea"; g.fillRect(x - 3, y - 3, 58, 62); g.fillStyle = col; g.fillRect(x, y, 52, 56);
    g.fillStyle = "#fbf7ea"; g.beginPath(); g.ellipse(x + 26, y + 26, 14, 17, 0, 0, 6.3); g.fill(); g.fillStyle = col; g.beginPath(); g.ellipse(x + 26, y + 22, 7, 8, 0, 0, 6.3); g.fill(); g.fillRect(x + 16, y + 30, 20, 14); g.fillStyle = "#fbf7ea"; g.fillRect(x + 6, y + 47, 40, 4);
    g.fillStyle = "#efe6d0"; for (let i = 0; i < 9; i++) { g.beginPath(); g.arc(x - 3 + i * 7.2, y - 3, 2, 0, 6.3); g.fill(); g.beginPath(); g.arc(x - 3 + i * 7.2, y + 59, 2, 0, 6.3); g.fill(); } } });
const booksTex = () => tex("books", 512, 256, (g) => { let x = 0; let i = 0; while (x < 512) { const w = 10 + 18 * R(i, 1), h = 170 + 70 * R(i, 2); g.fillStyle = ["#6a2a22", "#2a3a5a", "#3a5a3a", "#7a5a2a", "#4a2a3a", "#d8c8a0", "#2a2a2a"][Math.floor(R(i, 3) * 7)]; g.fillRect(x, 256 - h, w - 1, h);
  g.fillStyle = "rgba(230,200,120,0.8)"; g.fillRect(x + 2, 256 - h + 14, w - 5, 3); g.fillRect(x + 2, 256 - h + 30, w - 5, 2); g.fillStyle = "rgba(0,0,0,0.25)"; g.fillRect(x + w - 3, 256 - h, 2, h); x += w; i++; } });
export const newsTex = () => tex("news", 512, 512, (g) => { g.fillStyle = "#e9e4d6"; g.fillRect(0, 0, 512, 512); g.fillStyle = "#2a2a2e"; g.fillRect(20, 18, 472, 44); for (let c = 0; c < 4; c++) for (let l = 0; l < 34; l++) { if (c === 1 && l > 3 && l < 13) continue; g.fillStyle = `rgba(40,40,46,${0.45 + 0.3 * R(c, l)})`; g.fillRect(20 + c * 120, 80 + l * 12, 100 * (0.6 + 0.4 * R(l, c, 3)), 5); }
  g.fillStyle = "#8a8a90"; g.fillRect(140, 128, 100, 110); g.fillStyle = "#5a5a62"; g.beginPath(); g.ellipse(190, 175, 30, 36, 0, 0, 6.3); g.fill(); });
const pictureTex = (k0: number) => tex("pic" + k0, 256, 320, (g) => { const k = ((k0 % 3) + 3) % 3; const gr = g.createLinearGradient(0, 0, 0, 320); gr.addColorStop(0, ["#8aa8c8", "#c8b88a", "#9ab88a"][k % 3]); gr.addColorStop(1, ["#4a6a3a", "#7a5a3a", "#3a5a6a"][k % 3]); g.fillStyle = gr; g.fillRect(0, 0, 256, 320);
  g.fillStyle = "rgba(255,255,255,0.7)"; for (let i = 0; i < 6; i++) { g.beginPath(); g.ellipse(40 + i * 36, 220 + 10 * Math.sin(i), 10, 26, 0, 0, 6.3); g.fill(); } g.fillStyle = "#3a6a2a"; g.fillRect(0, 260, 256, 60); });
// ---------------- room shell helper: floor, walls with panelling and plaster, cornice, ceiling ----------------
const room = (B: Batch, x0: number, z0: number, x1: number, z1: number, h: number, o: { floor: THREE.Material; wall: THREE.Material; panel: THREE.Material; dado: number; ceil: THREE.Material; skip?: string[] }) => {
  B.box(o.floor, x0, -0.2, z0, x1, 0, z1); B.box(o.ceil, x0, h, z0, x1, h + 0.2, z1);
  const walls: [string, number, number, number, number][] = [["n", x0, z0 - 0.3, x1, z0], ["s", x0, z1, x1, z1 + 0.3], ["w", x0 - 0.3, z0, x0, z1], ["e", x1, z0, x1 + 0.3, z1]];
  for (const [k, a, b, c, d] of walls) { if (o.skip?.includes(k)) continue; B.box(o.wall, a, 0, b, c, h, d); const ix = k === "w" ? 0.06 : k === "e" ? -0.06 : 0, iz = k === "n" ? 0.06 : k === "s" ? -0.06 : 0;
    B.box(o.panel, a + (k === "e" ? -0.06 : 0) + (k === "w" ? 0 : 0), 0, b + (k === "s" ? -0.06 : 0), c + (k === "w" ? 0.06 : 0), o.dado, d + (k === "n" ? 0.06 : 0));
    B.box(o.panel, a + ix * 1.5 - (k === "e" ? 0.04 : 0), o.dado, b + iz * 1.5 - (k === "s" ? 0.04 : 0), c + ix * 1.5 + (k === "w" ? 0.04 : 0), o.dado + 0.08, d + iz * 1.5 + (k === "n" ? 0.04 : 0));
    B.box(o.panel, a + ix * 2 - (k === "e" ? 0.08 : 0), h - 0.3, b + iz * 2 - (k === "s" ? 0.08 : 0), c + ix * 2 + (k === "w" ? 0.08 : 0), h, d + iz * 2 + (k === "n" ? 0.08 : 0)); } };
// ---------------- textures of our own (no lettering, no logos) ----------------
/** a football shirt on a transparent canvas: body, sleeves, collar and cuffs, a big number on the back */
const shirtTex = (top: string, trim: string, num: string, numC: string) => tex("shirt" + top + num, 256, 288, (g) => {
  g.clearRect(0, 0, 256, 288); const sh: [number, number][] = [[78, 18], [104, 10], [128, 26], [152, 10], [178, 18], [246, 62], [222, 118], [196, 100], [196, 280], [60, 280], [60, 100], [34, 118], [10, 62]];
  g.beginPath(); sh.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fillStyle = top; g.fill(); g.lineWidth = 6; g.strokeStyle = "#241726"; g.stroke();
  g.strokeStyle = trim; g.lineWidth = 9; g.beginPath(); g.moveTo(80, 20); g.quadraticCurveTo(128, 50, 176, 20); g.stroke(); for (const [a, b, c, d] of [[246, 62, 222, 118], [10, 62, 34, 118]]) { g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.stroke(); }
  g.fillStyle = "rgba(0,0,0,0.08)"; g.fillRect(60, 230, 136, 50); if (num) { g.font = "bold 120px Arial"; g.textAlign = "center"; g.fillStyle = numC; g.strokeStyle = "#241726"; g.lineWidth = 5; g.fillText(num, 128, 200); g.strokeText(num, 128, 200); } });
/** striped hotel wallpaper */
const paperTex = () => tex("wallpaper", 256, 256, (g) => { g.fillStyle = "#efe6cf"; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? "rgba(150,160,110,0.22)" : "rgba(200,180,130,0.12)"; g.fillRect(i * 32, 0, i % 2 ? 10 : 22, 256); }
  for (let y = 16; y < 256; y += 64) for (let x = 16; x < 256; x += 64) { g.fillStyle = "rgba(170,150,90,0.25)"; g.beginPath(); g.ellipse(x, y, 4, 7, 0, 0, 6.3); g.fill(); } });
/** a corridor carpet runner: claret with a gold border and a repeating medallion */
const runnerTex = () => tex("runner", 256, 512, (g) => { g.fillStyle = "#7a1e28"; g.fillRect(0, 0, 256, 512); g.fillStyle = "#c9a24a"; g.fillRect(0, 0, 20, 512); g.fillRect(236, 0, 20, 512); g.fillStyle = "#5a1218"; g.fillRect(26, 0, 6, 512); g.fillRect(224, 0, 6, 512);
  for (let y = 64; y < 512; y += 128) { g.strokeStyle = "#c9a24a"; g.lineWidth = 6; g.beginPath(); g.moveTo(128, y - 44); g.lineTo(178, y); g.lineTo(128, y + 44); g.lineTo(78, y); g.closePath(); g.stroke(); g.fillStyle = "#e8c45a"; g.beginPath(); g.arc(128, y, 10, 0, 6.3); g.fill(); } });
/** the brain-wave trace on the EEG screen, and an MRI scan on the light box */
const waveTex = () => tex("eeg", 512, 320, (g) => { g.fillStyle = "#0e2a24"; g.fillRect(0, 0, 512, 320); g.strokeStyle = "rgba(120,255,190,0.18)"; g.lineWidth = 1; for (let x = 0; x < 512; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 320); g.stroke(); } for (let y = 0; y < 320; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(512, y); g.stroke(); }
  for (let k = 0; k < 6; k++) { g.strokeStyle = k % 2 ? "#7dffb8" : "#bfffe0"; g.lineWidth = 2.5; g.beginPath(); for (let x = 0; x <= 512; x += 3) { const y = 30 + k * 50 + 9 * Math.sin(x * 0.11 + k) + 5 * Math.sin(x * 0.37 + k * 2) + 3 * Math.sin(x * 0.9 + k); x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); } });
const scanTex = () => tex("mri", 512, 384, (g) => { g.fillStyle = "#0a0c12"; g.fillRect(0, 0, 512, 384); for (let k = 0; k < 2; k++) { const cx = 128 + k * 256, cy = 192; const gr = g.createRadialGradient(cx, cy, 10, cx, cy, 110); gr.addColorStop(0, "#d8dce4"); gr.addColorStop(0.7, "#9aa0ac"); gr.addColorStop(1, "#20242c"); g.fillStyle = gr;
  g.beginPath(); g.ellipse(cx, cy, 92, 112, 0, 0, 6.3); g.fill(); g.strokeStyle = "#e8ecf4"; g.lineWidth = 6; g.stroke(); g.strokeStyle = "rgba(40,44,54,0.8)"; g.lineWidth = 3; for (let i = 0; i < 9; i++) { g.beginPath(); g.moveTo(cx + 70 * Math.cos(i), cy + 80 * Math.sin(i)); g.quadraticCurveTo(cx + 20 * Math.sin(i * 3), cy + 15 * Math.cos(i * 2), cx + 50 * Math.cos(i + 2), cy + 60 * Math.sin(i + 2)); g.stroke(); }
  g.fillStyle = "#3a3f4a"; g.beginPath(); g.ellipse(cx - 18, cy, 10, 22, 0, 0, 6.3); g.ellipse(cx + 18, cy, 10, 22, 0, 0, 6.3); g.fill(); } });
/** the coach's tactics board: a green pitch, white lines, yellow and blue magnets */
const tacticsTex = () => tex("tactics", 512, 360, (g) => { g.fillStyle = "#f4f6f8"; g.fillRect(0, 0, 512, 360); g.fillStyle = "#3f8a4a"; g.fillRect(24, 24, 464, 312); g.strokeStyle = "#f4f6f8"; g.lineWidth = 4; g.strokeRect(36, 36, 440, 288); g.beginPath(); g.moveTo(256, 36); g.lineTo(256, 324); g.stroke(); g.beginPath(); g.arc(256, 180, 44, 0, 6.3); g.stroke();
  g.strokeRect(36, 110, 60, 140); g.strokeRect(416, 110, 60, 140); const P = [[70, 180], [130, 80], [130, 150], [130, 210], [130, 280], [200, 120], [200, 240], [190, 180], [260, 110], [270, 250], [320, 180]];
  P.forEach(([x, y], i) => { g.fillStyle = i ? "#f6d21a" : "#7a8a9a"; g.beginPath(); g.arc(x, y, 13, 0, 6.3); g.fill(); g.strokeStyle = "#241726"; g.lineWidth = 3; g.stroke(); }); g.strokeStyle = "#e2453c"; g.lineWidth = 5; g.beginPath(); g.moveTo(200, 120); g.quadraticCurveTo(300, 60, 360, 150); g.stroke(); });
/** white wall tiles with grey grout */
const tileS = (key: string, c: string, n: number) => tex(key, 256, 256, (g) => { g.fillStyle = "#9aa2aa"; g.fillRect(0, 0, 256, 256); const s = 256 / n; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const k = R(i, j, 41); g.fillStyle = c; g.fillRect(i * s + 2, j * s + 2, s - 4, s - 4); g.fillStyle = `rgba(255,255,255,${0.08 + 0.1 * k})`; g.fillRect(i * s + 4, j * s + 4, s * 0.5, s * 0.2); } });
const tmat = (t: THREE.Texture, rx: number, ry: number, rough = 0.35) => { const k = t.clone(); k.wrapS = k.wrapT = THREE.RepeatWrapping; k.repeat.set(rx, ry); k.needsUpdate = true; return new THREE.MeshStandardMaterial({ map: k, roughness: rough }); };
const plane = (G: THREE.Object3D, t: THREE.Texture, w: number, h: number, x: number, y: number, z: number, ry = 0, emiss = 0, cut = false) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: t, roughness: 0.6, side: THREE.DoubleSide, transparent: false, alphaTest: cut ? 0.4 : 0, ...(emiss ? { emissive: new THREE.Color("#ffffff"), emissiveMap: t, emissiveIntensity: emiss } : {}) }));
  m.position.set(x, y, z); m.rotation.y = ry; m.layers.set(NOINK); m.receiveShadow = true; G.add(m); return m; };
/** a wall with one door opening (along x at z, from x0 to x1) */
const wallDoor = (B: Batch, mat: THREE.Material, x0: number, x1: number, z0: number, z1: number, h: number, dx0: number, dx1: number, dh = 2.1) => { B.box(mat, x0, 0, z0, dx0, h, z1); B.box(mat, dx1, 0, z0, x1, h, z1); B.box(mat, dx0, dh, z0, dx1, h, z1); };
/** a panelled hotel door with frame and brass handle, closed (in the wall plane) or as a leaf for an open door */
const doorLeaf = (B: Batch, wood: THREE.Material, brass: THREE.Material, x: number, z: number, nz: number) => { B.box(wood, x - 0.45, 0, z - 0.03, x + 0.45, 2.08, z + 0.03); for (const [y0, y1] of [[0.25, 0.95], [1.15, 1.9]]) for (const s of [-1, 1]) B.box(wood, x + s * 0.2 - 0.15, y0, z + nz * 0.035, x + s * 0.2 + 0.15, y1, z + nz * 0.05); B.sph(brass, x + 0.34, 1.0, z + nz * 0.07, 0.035); };
const frame = (B: Batch, m: THREE.Material, x: number, z: number, nz: number, w = 0.9, h = 2.1) => { B.box(m, x - w / 2 - 0.08, 0, z, x - w / 2, h + 0.08, z + nz * 0.06); B.box(m, x + w / 2, 0, z, x + w / 2 + 0.08, h + 0.08, z + nz * 0.06); B.box(m, x - w / 2 - 0.08, h, z, x + w / 2 + 0.08, h + 0.08, z + nz * 0.06); };

export const buildFenomeno = (root: THREE.Object3D, refs: FRefs) => {
  const mk = (k: string) => { const g = new THREE.Group(); g.name = k; root.add(g); refs.groups[k] = g; return g; };
  const brass = M.brass(), white = M.white();
  // ===== the hotel: the twin room and the corridor outside it =====
  { const G = mk("hotel"), B = new Batch(), x0 = ROOM.x - ROOM.w / 2, x1 = ROOM.x + ROOM.w / 2, z0 = ROOM.z - ROOM.d / 2, z1 = ROOM.z + ROOM.d / 2, h = ROOM.h;
    const wp = tmat(paperTex(), 3, 1.2, 0.8), paint = M.stucco("#f4eee0"), oak = M.wood("#7a4e2e", 1.0), dark = M.wood("#4a2e1c", 1.0), carpet = M.felt("#b8a080");
    room(B, x0, z0, x1, z1, h, { floor: carpet, wall: wp, panel: paint, dado: 0.85, ceil: M.stucco("#f6f1e4"), skip: ["s", "w"] });
    // west wall with the tall window (afternoon sun), curtains, sheer
    B.box(wp, x0 - 0.3, 0, z0, x0, 0.9, z1); B.box(wp, x0 - 0.3, 2.45, z0, x0, h, z1); B.box(wp, x0 - 0.3, 0.9, z0, x0, 2.45, -1.25); B.box(wp, x0 - 0.3, 0.9, 0.85, x0, 2.45, z1);
    B.box(paint, x0, 0, z0, x0 + 0.05, 0.85, z1); B.box(paint, x0, 0.85, z0, x0 + 0.09, 0.93, z1); B.box(paint, x0, h - 0.25, z0, x0 + 0.12, h, z1);
    B.box(pmat("#fff4dc", 0.05, 0, { emissive: new THREE.Color("#fff0d0"), emissiveIntensity: 2.2 }), x0 - 0.3, 0.9, -1.25, x0 - 0.26, 2.45, 0.85);
    for (const z of [-1.25, -0.2, 0.85]) B.box(white, x0 - 0.2, 0.9, z - 0.04, x0 - 0.1, 2.45, z + 0.04); for (const y of [0.9, 1.7, 2.45]) B.box(white, x0 - 0.2, y - 0.04, -1.25, x0 - 0.1, y + 0.04, 0.85); B.box(white, x0 - 0.05, 0.86, -1.4, x0 + 0.18, 0.92, 1.0);
    for (const s of [-1, 1]) for (let i = 0; i < 7; i++) { const zc = (s < 0 ? -1.55 : 1.15) + i * 0.07 * s; B.cyl(M.cloth("#8a3a3a"), x0 + 0.14, 1.32, zc, 0.06, 2.64, undefined, undefined, 0.05); }
    B.cyl(brass, x0 + 0.14, 2.66, -0.2, 0.02, 3.4, undefined, [Math.PI / 2, 0, 0]);
    { const sheer = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.55), new THREE.MeshStandardMaterial({ color: "#fffaf0", transparent: true, opacity: 0.45, roughness: 1, side: THREE.DoubleSide, depthWrite: false })); sheer.position.set(x0 + 0.08, 1.68, -0.2); sheer.rotation.y = Math.PI / 2; sheer.layers.set(NOINK); G.add(sheer); }
    // the south wall with the door to the corridor (open, leaf swung into the room)
    wallDoor(B, wp, x0 - 0.3, x1 + 0.3, z1, z1 + 0.3, h, RDOOR_X - 0.45, RDOOR_X + 0.45); B.box(paint, x0, 0, z1 - 0.05, RDOOR_X - 0.53, 0.85, z1); B.box(paint, RDOOR_X + 0.53, 0, z1 - 0.05, x1, 0.85, z1);
    frame(B, white, RDOOR_X, z1, -1); frame(B, white, RDOOR_X, z1 + 0.3, 1);
    { const L = new THREE.Group(), b2 = new Batch(); doorLeaf(b2, oak, brass, -0.45, 0, 1); b2.build(L); L.position.set(RDOOR_X + 0.45, 0, z1 - 0.02); L.rotation.y = -1.3; G.add(L); refs.doorLeaf = L; }
    // the twin beds: upholstered headboards, white sheets, a green throw, pillows; the nightstand and its lamp between them
    for (const [bx, k] of [[BED_A[0], 0], [BED_B[0], 1]] as [number, number][]) { const bz0 = z0, bz1 = z0 + 2.05;
      B.box(dark, bx - 0.52, 0, bz0 + 0.05, bx + 0.52, 0.32, bz1); B.box(M.cloth("#f6f3ec"), bx - 0.48, 0.32, bz0 + 0.08, bx + 0.48, 0.55, bz1 - 0.02); B.box(M.cloth("#fbf9f4"), bx - 0.5, 0.5, bz0 + 0.6, bx + 0.5, 0.58, bz1 + 0.01);
      B.box(M.cloth("#3f6a4a"), bx - 0.51, 0.52, bz0 + 1.35, bx + 0.51, 0.6, bz0 + 1.75); B.box(M.cloth("#e9e2d2"), bx - 0.51, 0.3, bz1 - 0.01, bx + 0.51, 0.58, bz1 + 0.02);
      B.sph(M.cloth("#fbf9f4"), bx - 0.22, 0.62, bz0 + 0.3, 0.22, 0.09, 0.17).sph(M.cloth("#fbf9f4"), bx + 0.22, 0.62, bz0 + 0.3, 0.22, 0.09, 0.17);
      B.box(M.cloth("#6a7a5a"), bx - 0.56, 0, z0, bx + 0.56, 1.25, z0 + 0.08); B.box(dark, bx - 0.6, 1.2, z0, bx + 0.6, 1.3, z0 + 0.1); for (let i = 0; i < 5; i++) B.sph(brass, bx - 0.44 + i * 0.22, 1.1, z0 + 0.085, 0.018);
      solid("bed " + "AB"[k], bx - 0.52, bz0, bx + 0.52, bz1, 0.6); }
    { const nx = ROOM.x - 0.05; B.box(dark, nx - 0.32, 0, z0 + 0.02, nx + 0.32, 0.6, z0 + 0.46); B.box(oak, nx - 0.3, 0.32, z0 + 0.46, nx + 0.3, 0.55, z0 + 0.47); B.sph(brass, nx, 0.44, z0 + 0.49, 0.02);
      B.cyl(brass, nx, 0.68, z0 + 0.22, 0.07, 0.16).cyl(brass, nx, 0.86, z0 + 0.22, 0.012, 0.3); const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.16, 0.2, 18, 1, true), pmat("#fff2d8", 0.8, 0, { emissive: new THREE.Color("#ffd89a"), emissiveIntensity: 0.9, side: THREE.DoubleSide })); shade.position.set(nx, 1.07, z0 + 0.22); G.add(shade);
      B.box(pmat("#2a2a30", 0.4), nx + 0.08, 0.6, z0 + 0.1, nx + 0.24, 0.66, z0 + 0.22); solid("nightstand", nx - 0.32, z0, nx + 0.32, z0 + 0.46, 0.7); lamp("room", refs, G, nx, 1.0, z0 + 0.35, "#ffd9a0", 0.6, 3, 0); }
    // pictures over the beds, a mirror, the ceiling light
    for (const [px, k] of [[BED_A[0], 1], [BED_B[0], 2]] as [number, number][]) { plane(G, pictureTex(k), 0.62, 0.48, px, 1.85, z0 + 0.04); B.box(brass, px - 0.35, 1.58, z0 + 0.01, px + 0.35, 2.12, z0 + 0.03); }
    B.cyl(white, ROOM.x, h - 0.05, ROOM.z, 0.18, 0.06); { const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), pmat("#fff6e6", 0.4, 0, { emissive: new THREE.Color("#fff0d0"), emissiveIntensity: 1.2 })); bowl.position.set(ROOM.x, h - 0.06, ROOM.z); G.add(bowl); }
    lamp("room", refs, G, ROOM.x, h - 0.5, ROOM.z, "#ffe8c8", 2.2, 7, 0);
    // the wardrobe on the east wall, the yellow number 9 hung on its door; the dresser with the television
    { const wx = x1 - 0.6; B.box(oak, wx, 0, -0.95, x1, 2.25, 0.75); B.box(dark, wx - 0.02, 0.05, -0.93, wx, 2.2, -0.12); B.box(dark, wx - 0.02, 0.05, -0.08, wx, 2.2, 0.73); B.box(oak, wx - 0.05, 2.25, -1.0, x1, 2.32, 0.8); for (const z of [-0.18, -0.02]) B.box(brass, wx - 0.06, 1.0, z - 0.01, wx - 0.03, 1.3, z + 0.01);
      B.rod(brass, [wx - 0.08, 1.92, 0.33], [wx - 0.02, 1.98, 0.33], 0.01); const sh = plane(G, shirtTex("#f6d21a", "#2f8a3a", "9", "#1f4fa8"), 0.62, 0.7, wx - 0.07, 1.55, 0.33, -Math.PI / 2, 0, true); sh.rotation.z = 0.04; solid("wardrobe", wx, -0.95, x1, 0.75, 2.3);
      B.box(oak, x1 - 0.5, 0, 1.05, x1, 0.78, 2.15); B.box(dark, x1 - 0.52, 0.42, 1.08, x1 - 0.5, 0.72, 2.12); B.box(pmat("#1c1c22", 0.35), x1 - 0.45, 0.78, 1.25, x1 - 0.1, 1.2, 1.95); solid("dresser", x1 - 0.5, 1.05, x1, 2.15, 1.2);
      plane(G, tex("tvpitch", 256, 192, (g) => { const gr = g.createLinearGradient(0, 0, 0, 192); gr.addColorStop(0, "#1c3a6a"); gr.addColorStop(0.35, "#2a4a7a"); gr.addColorStop(0.36, "#3f9a4a"); gr.addColorStop(1, "#2f7a3a"); g.fillStyle = gr; g.fillRect(0, 0, 256, 192); g.strokeStyle = "rgba(255,255,255,0.7)"; g.lineWidth = 3; g.beginPath(); g.moveTo(40, 192); g.lineTo(128, 70); g.lineTo(216, 192); g.stroke(); g.fillStyle = "#f6d21a"; for (const [x, y] of [[110, 120], [150, 140], [90, 160]]) g.fillRect(x, y, 6, 14); }), 0.66, 0.38, x1 - 0.445, 1.0, 1.6, -Math.PI / 2, 0.9); }
    // a writing desk and chair under the window... no: by the window, south of it; the kit bag, boots, a rug
    B.box(oak, x0, 0.72, 1.2, x0 + 0.55, 0.76, 2.4); for (const [dx, dz] of [[0.05, 1.25], [0.5, 1.25], [0.05, 2.35], [0.5, 2.35]]) B.box(dark, x0 + dx - 0.025, 0, dz - 0.025, x0 + dx + 0.025, 0.72, dz + 0.025); solid("desk", x0, 1.2, x0 + 0.55, 2.4, 0.8);
    B.box(white, x0 + 0.15, 0.76, 1.5, x0 + 0.4, 0.765, 1.85); B.cyl(pmat("#2a6a9a", 0.5), x0 + 0.3, 0.84, 2.15, 0.04, 0.16);
    { const kx = ROOM.x - 0.6; B.cyl(pmat("#1f4fa8", 0.7), kx, 0.16, 2.55, 0.16, 0.7, undefined, [0, 0, Math.PI / 2]); B.box(pmat("#f6d21a", 0.7), kx - 0.36, 0.14, 2.39, kx + 0.36, 0.18, 2.71); solid("kit bag", kx - 0.36, 2.38, kx + 0.36, 2.72, 0.34); }
    for (const dz of [0, 0.14]) B.box(pmat("#1c1c22", 0.4), BED_B[0] + 0.62, 0, -0.6 + dz, BED_B[0] + 0.9, 0.09, -0.52 + dz);
    B.box(M.felt("#8a3a3a"), ROOM.x - 0.85, 0, -0.95, ROOM.x + 0.75, 0.008, 1.2); B.box(M.felt("#c9a24a"), ROOM.x - 0.75, 0.008, -0.85, ROOM.x + 0.65, 0.012, 1.1);
    makeShrubs(G, [{ x: x0 + 0.35, y: 0.5, z: z1 - 0.4, r: 0.3, sp: "plane", seed: 31 }]); B.cyl(M.wood("#6a3a22"), x0 + 0.35, 0.22, z1 - 0.4, 0.2, 0.44);
    // ---- the corridor ----
    const c0 = CORR.x - CORR.w / 2, c1 = CORR.x + CORR.w / 2, cz0 = CORR.z - CORR.d / 2, cz1 = CORR.z + CORR.d / 2, ch = CORR.h;
    room(B, c0, cz0, c1, cz1, ch, { floor: M.wood("#5a3a22", 1.2), wall: wp, panel: paint, dado: 0.95, ceil: M.stucco("#f6f1e4"), skip: ["n", "w"] });
    B.box(paint, c0, 0, cz0, RDOOR_X - 0.53, 0.95, cz0 + 0.05); B.box(paint, RDOOR_X + 0.53, 0, cz0, c1, 0.95, cz0 + 0.05); B.box(paint, c0, ch - 0.22, cz0, c1, ch, cz0 + 0.1);
    { const rn = new THREE.Mesh(new THREE.PlaneGeometry(CORR.w - 0.6, 1.3), tmat(runnerTex(), 1, (CORR.w - 0.6) / 2.6, 0.9)); rn.rotation.set(-Math.PI / 2, 0, Math.PI / 2); rn.position.set(CORR.x, 0.006, CORR.z); rn.layers.set(NOINK); rn.receiveShadow = true; G.add(rn); }
    // the far end: a tall window (west), a console with flowers (east)
    B.box(wp, c0 - 0.3, 0, cz0, c0, ch, cz1); B.box(pmat("#fff4dc", 0.05, 0, { emissive: new THREE.Color("#fff0d0"), emissiveIntensity: 2.0 }), c0 - 0.02, 0.6, CORR.z - 0.5, c0 + 0.01, 2.4, CORR.z + 0.5); for (const z of [-0.5, 0, 0.5]) B.box(white, c0, 0.6, CORR.z + z - 0.03, c0 + 0.06, 2.4, CORR.z + z + 0.03);
    B.box(oak, c1 - 0.45, 0.8, CORR.z - 0.6, c1, 0.85, CORR.z + 0.6); B.box(dark, c1 - 0.42, 0, CORR.z - 0.55, c1 - 0.38, 0.8, CORR.z + 0.55); plane(G, pictureTex(5), 0.9, 0.7, c1 - 0.04, 1.7, CORR.z, -Math.PI / 2); makeShrubs(G, [{ x: c1 - 0.22, y: 1.05, z: CORR.z, r: 0.25, sp: "olive", seed: 7 }]);
    // doors down both sides (ours stands open), sconces and pictures between them
    const DN = [294.9, 298.4, 305.4], DS = [293.2, 296.7, 300.2, 303.7, 307.2];
    for (const x of DN) { doorLeaf(B, oak, brass, x, cz0 + 0.04, 1); frame(B, white, x, cz0, 1); }
    for (const x of DS) { if (x === 300.2 || x === 303.7) { B.box(pmat("#2a2420", 0.9), x - 0.45, 0, cz1 - 0.02, x + 0.45, 2.1, cz1); const L = new Batch(), gL = new THREE.Group(); doorLeaf(L, oak, brass, -0.45, 0, -1); L.build(gL); gL.position.set(x + 0.45, 0, cz1 - 0.02); gL.rotation.y = -1.2; G.add(gL); } else doorLeaf(B, oak, brass, x, cz1 - 0.04, -1); frame(B, white, x, cz1, -1); }
    for (let x = c0 + 1.2; x < c1 - 0.5; x += 1.75) for (const [z, nz] of [[cz0, 1], [cz1, -1]] as [number, number][]) { const near = [...(nz > 0 ? [...DN, RDOOR_X] : DS)].some((d) => Math.abs(d - x) < 0.75); if (near) continue;
      B.box(brass, x - 0.05, 1.7, z + nz * 0.02, x + 0.05, 1.9, z + nz * 0.06); const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 0.14, 12, 1, true), pmat("#fff2d8", 0.8, 0, { emissive: new THREE.Color("#ffd89a"), emissiveIntensity: 1.4, side: THREE.DoubleSide })); sh.position.set(x, 1.98, z + nz * 0.12); G.add(sh);
      if (Math.round(x * 10) % 3 === 0) lamp("corr", refs, G, x, 2.0, z + nz * 0.3, "#ffd9a0", 1.6, 4.5, 0); plane(G, pictureTex(Math.round(x)), 0.5, 0.4, x, 1.35, z + nz * 0.03, nz > 0 ? 0 : Math.PI); }
    for (let x = c0 + 2; x < c1; x += 4) { B.cyl(white, x, ch - 0.04, CORR.z, 0.16, 0.05); lamp("corr", refs, G, x, ch - 0.35, CORR.z, "#ffe6c0", 1.4, 5, 0.08); }
    B.build(G); }
  // ===== the clinic: the examination room =====
  { const G = mk("clinic"), B = new Batch(), x0 = CLIN.x - CLIN.w / 2, x1 = CLIN.x + CLIN.w / 2, z0 = CLIN.z - CLIN.d / 2, z1 = CLIN.z + CLIN.d / 2, h = CLIN.h;
    const tiles = tmat(tileS("ctile", "#e8ecee", 8), CLIN.w / 1.2, CLIN.d / 1.2, 0.3), wall = M.stucco("#dfece6"), steel = pmat("#c9d0d6", 0.3, 0.8), mint = pmat("#9fd0c4", 0.6);
    room(B, x0, z0, x1, z1, h, { floor: tiles, wall, panel: pmat("#b8d4cc", 0.5), dado: 1.0, ceil: M.stucco("#f2f4f2") });
    // the examination couch: chrome frame, mint mattress, paper roll, a step
    { const [ex, , ez] = EXAM; B.box(steel, ex - 1.0, 0.18, ez - 0.36, ex + 1.0, 0.24, ez + 0.36); for (const [dx, dz] of [[-0.9, -0.3], [0.9, -0.3], [-0.9, 0.3], [0.9, 0.3]]) B.cyl(steel, ex + dx, 0.38, ez + dz, 0.025, 0.4); B.box(pmat("#3a3f46", 0.6), ex - 0.95, 0.0, ez - 0.32, ex + 0.95, 0.18, ez + 0.32);
      B.box(mint, ex - 1.0, 0.58, ez - 0.38, ex + 1.0, 0.74, ez + 0.38); B.box(mint, ex - 1.0, 0.74, ez - 0.38, ex - 0.6, 0.9, ez + 0.38, undefined, [0, 0, -0.25]); B.box(pmat("#fbfbf8", 0.9), ex - 0.55, 0.745, ez - 0.26, ex + 1.0, 0.75, ez + 0.26); B.cyl(pmat("#fbfbf8", 0.9), ex + 1.04, 0.66, ez, 0.06, 0.56, undefined, [Math.PI / 2, 0, 0]);
      B.box(steel, ex - 0.2, 0, ez + 0.4, ex + 0.3, 0.18, ez + 0.75); solid("exam couch", ex - 1.05, ez - 0.4, ex + 1.1, ez + 0.4, 0.75); }
    // the EEG machine on its cart, its screen of waves; leads to a cap on a hook
    { const mx = EXAM[0] + 1.75, mz = EXAM[2] - 0.6; B.box(pmat("#e8ecee", 0.4), mx - 0.35, 0.1, mz - 0.3, mx + 0.35, 1.0, mz + 0.3); for (const [dx, dz] of [[-0.3, -0.25], [0.3, -0.25], [-0.3, 0.25], [0.3, 0.25]]) B.sph(pmat("#2a2a30", 0.6), mx + dx, 0.05, mz + dz, 0.05);
      B.box(pmat("#c0c6cc", 0.4), mx - 0.33, 0.55, mz + 0.3, mx + 0.33, 0.6, mz + 0.32); for (let i = 0; i < 6; i++) B.cyl(pmat(["#e2453c", "#f6c419", "#3f8fc9", "#57a05a", "#fbfaf2", "#f29a2e"][i], 0.5), mx - 0.25 + i * 0.1, 0.8, mz + 0.31, 0.015, 0.02, undefined, [Math.PI / 2, 0, 0]);
      B.box(pmat("#2a2e36", 0.4), mx - 0.38, 1.0, mz - 0.12, mx + 0.38, 1.52, mz + 0.06, undefined, [-0.12, 0, 0]); plane(G, waveTex(), 0.68, 0.43, mx, 1.27, mz + 0.1, 0, 1.4).rotation.x = -0.12; solid("EEG cart", mx - 0.38, mz - 0.32, mx + 0.38, mz + 0.34, 1.55);
      for (let i = 0; i < 5; i++) B.rod(pmat(["#e2453c", "#f6c419", "#3f8fc9", "#57a05a", "#fbfaf2"][i], 0.5), [mx - 0.2 + i * 0.1, 0.8, mz + 0.33], [mx - 0.5 + i * 0.03, 0.55 - 0.05 * i, mz + 0.55], 0.008); }
    // the light box with the scans, a glass cabinet, the sink and mirror, the window with blinds, a desk, a stool, a screen
    plane(G, scanTex(), 1.1, 0.8, CLIN.x + 0.9, 1.65, z0 + 0.05, 0, 1.1); B.box(steel, CLIN.x + 0.3, 1.2, z0, CLIN.x + 1.5, 2.1, z0 + 0.04);
    { const cx = x0 + 0.25; B.box(pmat("#f4f6f6", 0.4), x0, 0, -0.6, x0 + 0.45, 2.0, 0.9); B.box(M.glass(), cx + 0.2, 1.0, -0.55, cx + 0.22, 1.95, 0.85); for (const y of [1.05, 1.4, 1.75]) { B.box(pmat("#e8ecee", 0.4), x0, y - 0.01, -0.58, x0 + 0.42, y + 0.01, 0.88); for (let i = 0; i < 7; i++) B.cyl(pmat(["#c9e4f2", "#a85a2a", "#f4f4f0", "#7fc98a", "#e8c45a"][i % 5], 0.2, 0, i % 2 ? {} : { transparent: true, opacity: 0.8 }), x0 + 0.2, y + 0.08, -0.45 + i * 0.19, 0.04, 0.14 + 0.04 * (i % 3)); } solid("cabinet", x0, -0.6, x0 + 0.45, 0.9, 2.0); }
    B.box(pmat("#f6f8f8", 0.2), x0, 0.8, 1.4, x0 + 0.5, 0.9, 2.1); B.cyl(steel, x0 + 0.1, 1.05, 1.75, 0.015, 0.3); B.box(pmat("#cfe0ea", 0.04, 0.9), x0 + 0.01, 1.2, 1.45, x0 + 0.02, 1.9, 2.05); solid("sink", x0, 1.4, x0 + 0.5, 2.1, 0.9);
    B.box(pmat("#e8f2fa", 0.05, 0, { emissive: new THREE.Color("#eef6ff"), emissiveIntensity: 1.8 }), x1 - 0.02, 0.95, -1.4, x1 + 0.01, 2.3, 0.4); for (let y = 1.0; y < 2.3; y += 0.08) B.slab(pmat("#f4f6f6", 0.5), x1 - 0.07, y, -0.5, 0.012, 0.06, 1.8, [0, 0, 0.6]);
    B.box(pmat("#f4f6f6", 0.4), x1 - 0.7, 0.72, 0.9, x1, 0.76, 2.2); B.box(pmat("#d8dde0", 0.5), x1 - 0.68, 0, 0.92, x1 - 0.62, 0.72, 2.18); B.box(pmat("#fbf6e6", 0.9), x1 - 0.55, 0.76, 1.3, x1 - 0.25, 0.765, 1.7); B.cyl(pmat("#2a2a30", 0.4), x1 - 0.35, 0.82, 1.9, 0.04, 0.12); solid("desk", x1 - 0.7, 0.9, x1, 2.2, 0.8);
    B.cyl(steel, CLIN.x + 0.9, 0.3, 1.0, 0.025, 0.6).cyl(pmat("#2a2e36", 0.5), CLIN.x + 0.9, 0.62, 1.0, 0.18, 0.06); for (let a = 0; a < 5; a++) B.rod(steel, [CLIN.x + 0.9, 0.05, 1.0], [CLIN.x + 0.9 + 0.25 * Math.cos(a * 1.257), 0.02, 1.0 + 0.25 * Math.sin(a * 1.257)], 0.012);
    for (let i = 0; i < 3; i++) { const sx = x0 + 0.9 + i * 0.52, rot = i % 2 ? 0.35 : -0.35; B.slab(pmat("#bcd8e4", 0.7), sx, 0.95, z1 - 0.6 + (i % 2) * 0.1, 0.5, 1.7, 0.04, [0, rot, 0]); B.slab(steel, sx, 1.82, z1 - 0.6 + (i % 2) * 0.1, 0.52, 0.04, 0.05, [0, rot, 0]); } solid("screen", x0 + 0.6, z1 - 0.8, x0 + 2.2, z1 - 0.4, 1.8);
    for (const [lx, lz] of [[CLIN.x - 0.8, -0.6], [CLIN.x + 1.0, 1.2]]) { B.box(pmat("#f6f8fa", 0.3, 0, { emissive: new THREE.Color("#f4f8ff"), emissiveIntensity: 1.6 }), lx - 0.55, h - 0.04, lz - 0.28, lx + 0.55, h, lz + 0.28); lamp("clinic", refs, G, lx, h - 0.4, lz, "#eef4ff", 2.6, 6, 0); }
    B.build(G); }
  // ===== the dressing room under the stadium, and the tunnel out =====
  { const G = mk("vest"), B = new Batch(), x0 = VEST.x - VEST.w / 2, x1 = VEST.x + VEST.w / 2, z0 = VEST.z - VEST.d / 2, z1 = VEST.z + VEST.d / 2, h = VEST.h;
    const tw = tmat(tileS("vtile", "#f2f4f4", 10), 3, 1, 0.25), floor = tmat(tileS("vfloor", "#7a8a9a", 6), VEST.w / 1.5, VEST.d / 1.5, 0.4), upper = M.stucco("#eef0ec"), pine = M.wood("#c08a50", 0.8), steel = pmat("#c9d0d6", 0.3, 0.8);
    room(B, x0, z0, x1, z1, h, { floor, wall: upper, panel: tw, dado: 1.6, ceil: M.stucco("#f4f4f2"), skip: ["s"] });
    wallDoor(B, upper, x0 - 0.3, x1 + 0.3, z1, z1 + 0.3, h, VDOOR_X - 0.6, VDOOR_X + 0.6, 2.25); B.box(tw, x0, 0, z1 - 0.06, VDOOR_X - 0.6, 1.6, z1); B.box(tw, VDOOR_X + 0.6, 0, z1 - 0.06, x1, 1.6, z1); frame(B, steel, VDOOR_X, z1, -1, 1.2, 2.25);
    // benches and wooden cubicles round three walls, a shirt on every hook, boots and bags under the benches
    const nums = ["2", "4", "3", "5", "6", "8", "10", "7", "18", "20", "11", "13", "1"]; let ni = 0;
    const run = (ax: number, az: number, bx: number, bz: number, nx: number, nz: number) => { const L = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / L, uz = (bz - az) / L, n = Math.floor(L / 0.95);
      for (let i = 0; i <= n; i++) { const px = ax + ux * i * 0.95, pz = az + uz * i * 0.95; B.box(pine, px - (uz ? 0.02 : 0) - nx * 0.0, 0.45, pz - (ux ? 0.02 : 0), px + (uz ? 0.02 : 0) + nx * 0.5, 2.3, pz + (ux ? 0.02 : 0) + nz * 0.5); }
      for (let i = 0; i < n; i++) { const px = ax + ux * (i + 0.5) * 0.95, pz = az + uz * (i + 0.5) * 0.95; B.box(steel, px - 0.02, 1.95, pz - 0.02, px + 0.02 + nx * 0.12, 1.99, pz + 0.02 + nz * 0.12);
        const t = nums[ni++ % nums.length], sh = plane(G, shirtTex("#f6d21a", "#2f8a3a", t, "#1f4fa8"), 0.5, 0.56, px + nx * 0.1, 1.68, pz + nz * 0.1, Math.atan2(nx, nz), 0, true); void sh;
        B.box(pmat("#1c1c22", 0.4), px - 0.12 + nx * 0.1, 0, pz - 0.12 + nz * 0.1, px + 0.12 + nx * 0.25, 0.08, pz + 0.12 + nz * 0.25); if (i % 3 === 1) B.cyl(pmat(["#1f4fa8", "#2f8a3a"][i % 2], 0.7), px + nx * 0.25, 0.22, pz + nz * 0.25, 0.14, 0.55, undefined, ux ? [0, 0, Math.PI / 2] : [Math.PI / 2, 0, 0]); }
      B.box(pine, Math.min(ax, bx) - (uz ? 0 : 0), 0.4, Math.min(az, bz), Math.max(ax, bx) + nx * 0.48 + (uz ? 0 : 0), 0.46, Math.max(az, bz) + nz * 0.48); for (let i = 0; i <= n; i++) { const px = ax + ux * i * 0.95, pz = az + uz * i * 0.95; B.box(steel, px + nx * 0.2 - 0.02, 0, pz + nz * 0.2 - 0.02, px + nx * 0.2 + 0.02, 0.4, pz + nz * 0.2 + 0.02); }
      solid("bench", Math.min(ax, ax + nx * 0.5, bx), Math.min(az, az + nz * 0.5, bz), Math.max(bx, bx + nx * 0.5, ax), Math.max(bz, bz + nz * 0.5, az), 0.46); };
    run(x0 + 0.6, z0, x1 - 0.6, z0, 0, 1); run(x0, z0 + 0.6, x0, z1 - 1.2, 1, 0); run(x1, z0 + 0.6, x1, z1 - 2.0, -1, 0); run(x0 + 1.1, z1, VDOOR_X - 0.95, z1, 0, -1);
    // the tactics board on its easel, the massage table, a crate of bottles, towels, the clock-less wall, strip lights
    { const tx = VEST.x - 1.4, tz = z0 + 1.35; plane(G, tacticsTex(), 1.3, 0.92, tx, 1.55, tz + 0.03, 0); B.box(steel, tx - 0.68, 1.06, tz - 0.02, tx + 0.68, 2.04, tz + 0.02); for (const s of [-1, 1]) B.rod(steel, [tx + s * 0.55, 1.1, tz], [tx + s * 0.62, 0, tz - 0.3 + 0.0], 0.02); B.rod(steel, [tx, 1.1, tz], [tx, 0, tz - 0.45], 0.02); solid("tactics board", tx - 0.7, tz - 0.45, tx + 0.7, tz + 0.08, 2.05); }
    { const mx = x0 + 1.55, mz = -0.2; B.box(pmat("#2a3a5a", 0.5), mx - 0.35, 0.65, mz - 0.95, mx + 0.35, 0.8, mz + 0.95); for (const [dx, dz] of [[-0.3, -0.9], [0.3, -0.9], [-0.3, 0.9], [0.3, 0.9]]) B.cyl(steel, mx + dx, 0.33, mz + dz, 0.025, 0.66); B.box(M.cloth("#fbfaf2"), mx - 0.3, 0.8, mz - 0.6, mx + 0.3, 0.84, mz - 0.2); solid("massage table", mx - 0.36, mz - 0.96, mx + 0.36, mz + 0.96, 0.85); }
    { const cx = VDOOR_X + 1.0, cz = z1 - 0.75; B.box(pmat("#2f6a9a", 0.5), cx - 0.25, 0, cz - 0.2, cx + 0.25, 0.3, cz + 0.2); for (let i = 0; i < 6; i++) B.cyl(pmat("#e8f2fa", 0.1, 0, { transparent: true, opacity: 0.85 }), cx - 0.16 + (i % 3) * 0.16, 0.42, cz - 0.1 + Math.floor(i / 3) * 0.2, 0.035, 0.24); solid("crate", cx - 0.25, cz - 0.2, cx + 0.25, cz + 0.2, 0.55); }
    for (let i = 0; i < 4; i++) B.box(M.cloth(i % 2 ? "#fbfaf2" : "#2f8a3a"), x1 - 0.55, 0.85 + i * 0.07, z1 - 1.3, x1 - 0.1, 0.92 + i * 0.07, z1 - 0.8); B.box(pine, x1 - 0.6, 0, z1 - 1.35, x1, 0.85, z1 - 0.75); solid("towels", x1 - 0.6, z1 - 1.35, x1, z1 - 0.75, 1.15);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { const lx = x0 + 1.8 + i * 2.7, lz = z0 + 2 + j * 3; B.box(pmat("#f8faff", 0.3, 0, { emissive: new THREE.Color("#f4f8ff"), emissiveIntensity: 2.2 }), lx - 0.7, h - 0.06, lz - 0.08, lx + 0.7, h, lz + 0.08); if (i !== 1 || j) lamp("vest", refs, G, lx, h - 0.45, lz, "#f2f6ff", 2.2, 7, 0); }
    // the tunnel to the pitch: grey walls, strip lights, a bright mouth at the far end
    { const tx0 = VDOOR_X - 1.1, tx1 = VDOOR_X + 1.1, tz0 = z1 + 0.3, tz1 = z1 + 14, th = 2.8, conc = M.conc();
      B.box(conc, tx0 - 0.3, 0, tz0, tx0, th, tz1).box(conc, tx1, 0, tz0, tx1 + 0.3, th, tz1).box(conc, tx0 - 0.3, th, tz0, tx1 + 0.3, th + 0.3, tz1).box(pmat("#3a4250", 0.6), tx0, -0.2, tz0, tx1, 0, tz1);
      B.box(pmat("#2f6a4a", 0.9), tx0 + 0.3, 0.004, tz0, tx1 - 0.3, 0.012, tz1); for (let z = tz0 + 1; z < tz1; z += 2.2) { B.box(pmat("#f8faff", 0.3, 0, { emissive: new THREE.Color("#f4f8ff"), emissiveIntensity: 2.0 }), VDOOR_X - 0.5, th - 0.05, z - 0.06, VDOOR_X + 0.5, th, z + 0.06); }
      B.box(pmat("#e8f2ff", 0.1, 0, { emissive: new THREE.Color("#eaf2ff"), emissiveIntensity: 3.2 }), tx0, 0, tz1 - 0.05, tx1, th, tz1); lamp("vest", refs, G, VDOOR_X, 2.3, z1 + 3, "#eef4ff", 1.4, 6, 0); }
    { const L = new Batch(), gL = new THREE.Group(); L.box(pmat("#8a97a6", 0.4, 0.5), 0, 0, -0.03, 1.2, 2.2, 0.03); L.box(steel, 1.0, 0.95, 0.03, 1.12, 1.0, 0.08); L.build(gL); gL.position.set(VDOOR_X - 0.6, 0, z1 + 0.12); gL.rotation.y = 0; G.add(gL); refs.vDoor = gL; }
    B.build(G); }
};
