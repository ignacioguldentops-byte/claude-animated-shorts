// Painted textures of "La trastienda": Madrid in 1902 (the waste ground by the bullring, the tavern, calle de Alcalá and the
// cloth shop, the shop's shelves and back room), the map on the counter, the London skyline, the racecourse, today's stadium.
import { ctex } from "./paint";
type G = CanvasRenderingContext2D;
type R = () => number;
const INKC = "#241726";
const pick = <T,>(r: R, a: T[]) => a[Math.floor(r() * a.length) % a.length];
const blot = (g: G, r: R, w: number, h: number, n: number, cols: string[], s0: number, s1: number, a = 0.3) => {
  for (let i = 0; i < n; i++) { g.globalAlpha = a * (0.4 + 0.6 * r()); g.fillStyle = pick(r, cols); const s = s0 + (s1 - s0) * r(); g.beginPath(); g.ellipse(r() * w, r() * h, s, s * (0.35 + 0.5 * r()), r() * 3.14, 0, 6.3); g.fill(); }
  g.globalAlpha = 1;
};
const rr = (g: G, x: number, y: number, w: number, h: number, fill: string | CanvasGradient | null, ink = 0, rad = 0) => { g.beginPath(); if (rad) g.roundRect(x, y, w, h, rad); else g.rect(x, y, w, h); if (fill) { g.fillStyle = fill; g.fill(); } if (ink) { g.lineWidth = ink; g.strokeStyle = INKC; g.stroke(); } };
const poly = (g: G, pts: number[][], fill: string | null, ink = 0, close = true) => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); if (close) g.closePath(); if (fill) { g.fillStyle = fill; g.fill(); } if (ink) { g.lineWidth = ink; g.strokeStyle = INKC; g.lineJoin = "round"; g.lineCap = "round"; g.stroke(); } };
const disc = (g: G, x: number, y: number, rad: number, fill: string | null, ink = 0) => { g.beginPath(); g.arc(x, y, rad, 0, 6.3); if (fill) { g.fillStyle = fill; g.fill(); } if (ink) { g.lineWidth = ink; g.strokeStyle = INKC; g.stroke(); } };
const vg = (g: G, y0: number, y1: number, c0: string, c1: string) => { const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, c0); gr.addColorStop(1, c1); return gr; };
/** an arch: rectangle with a round (or horseshoe) top */
const arch = (g: G, x: number, y: number, w: number, h: number, fill: string, ink = 0, shoe = 0) => { g.beginPath(); g.moveTo(x, y + h); g.lineTo(x, y + w / 2); g.arc(x + w / 2, y + w / 2, w / 2 * (1 + shoe), Math.PI * (1 + shoe * 0.35), -Math.PI * shoe * 0.35); g.lineTo(x + w, y + h); g.closePath(); g.fillStyle = fill; g.fill(); if (ink) { g.lineWidth = ink; g.strokeStyle = INKC; g.stroke(); } };

/** mown football turf: light and dark bands, no daisies (tile = 11 m, bands along v) */
export const turfTex = () => ctex("rTurf", 512, 512, (g, r) => {
  for (let i = 0; i < 2; i++) { g.fillStyle = i ? "#5bb548" : "#4ba23c"; g.fillRect(i * 256, 0, 256, 512); }
  blot(g, r, 512, 512, 140, ["#47983a", "#68bf52", "#55aa42", "#74c65a"], 8, 36, 0.28);
  for (let i = 0; i < 2600; i++) { g.fillStyle = r() < 0.5 ? "rgba(26,84,28,0.22)" : "rgba(196,238,138,0.26)"; g.fillRect(r() * 512, r() * 512, 2.4, 7); }
});
/** rough meadow grass of 1902 (racecourse, London), tile = 8 m */
export const meadowTex = () => ctex("rMeadow", 512, 512, (g, r) => {
  g.fillStyle = "#6aa84a"; g.fillRect(0, 0, 512, 512); blot(g, r, 512, 512, 220, ["#5c9a40", "#7dba58", "#8cc060", "#52903a", "#9cc468", "#b3b86a"], 10, 50, 0.4);
  for (let i = 0; i < 2600; i++) { g.fillStyle = r() < 0.5 ? "rgba(36,90,30,0.3)" : "rgba(214,236,140,0.3)"; g.fillRect(r() * 512, r() * 512, 2.4, 6 + r() * 6); }
  for (let i = 0; i < 60; i++) { const x = r() * 512, y = r() * 512; g.fillStyle = "rgba(40,100,32,0.55)"; for (let b = -2; b <= 2; b++) g.fillRect(x + b * 2.4, y - 6 + Math.abs(b) * 2, 1.8, 10 - Math.abs(b) * 2); }
  for (let i = 0; i < 40; i++) disc(g, r() * 512, r() * 512, 2.2, pick(r, ["#fbfaf2", "#f6c419", "#f6c419", "#e9a0c0"]));
});
/** the waste ground: beaten ochre earth, stones, tufts (tile = 8 m) */
export const dirtTex = () => ctex("rDirt", 512, 512, (g, r) => {
  g.fillStyle = "#d2a868"; g.fillRect(0, 0, 512, 512); blot(g, r, 512, 512, 260, ["#c4975a", "#dcb678", "#b88a50", "#e6c488", "#cfa264", "#a87c48"], 10, 56, 0.42);
  for (let i = 0; i < 900; i++) { g.fillStyle = r() < 0.5 ? "rgba(110,76,40,0.25)" : "rgba(250,226,170,0.3)"; g.fillRect(r() * 512, r() * 512, 2 + r() * 5, 2); }
  for (let i = 0; i < 70; i++) { const x = r() * 512, y = r() * 512, s = 2 + r() * 5; g.fillStyle = "rgba(60,40,30,0.5)"; g.beginPath(); g.ellipse(x, y + 1, s + 1, s * 0.7 + 1, 0, 0, 6.3); g.fill(); g.fillStyle = pick(r, ["#a89a8a", "#c4b8a6", "#8f8478"]); g.beginPath(); g.ellipse(x, y, s, s * 0.7, 0, 0, 6.3); g.fill(); }
  for (let i = 0; i < 26; i++) { const x = r() * 512, y = r() * 512; g.fillStyle = "rgba(96,130,60,0.8)"; for (let b = -2; b <= 2; b++) g.fillRect(x + b * 2.6, y - 7 + Math.abs(b) * 2, 2, 11 - Math.abs(b) * 2); }
});
/** the old bullring: brick, two storeys of horseshoe arches under a tiled cornice (tile = one bay 6 m wide, 15 m high) */
export const bullringTex = () => ctex("rBull", 512, 1024, (g, r) => {
  g.fillStyle = "#b5563a"; g.fillRect(0, 0, 512, 1024); blot(g, r, 512, 1024, 140, ["#a84a30", "#c4664a", "#9c4028", "#cf7458"], 12, 50, 0.35);
  g.strokeStyle = "rgba(70,30,22,0.35)"; g.lineWidth = 2; for (let y = 0; y < 1024; y += 16) { g.beginPath(); g.moveTo(0, y); g.lineTo(512, y); g.stroke(); for (let x = (y / 16) % 2 ? 0 : 20; x < 512; x += 40) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 16); g.stroke(); } }
  // pilasters at the bay edges, string courses, the cornice
  for (const x of [0, 472]) rr(g, x, 60, 40, 964, "#c8704e", 3);
  rr(g, 0, 0, 512, 64, "#c0603c", 3); for (let i = 0; i < 13; i++) arch(g, i * 40 - 4, 8, 40, 60, "#a8482c", 2);
  rr(g, 0, 64, 512, 22, "#f1e3c4", 3); rr(g, 0, 470, 512, 26, "#f1e3c4", 3); rr(g, 0, 496, 512, 12, "#8f3a26", 0);
  // upper storey: a pair of horseshoe arches with cream surrounds
  for (const x of [84, 284]) { arch(g, x - 16, 150, 176, 300, "#f1e3c4", 4, 0.12); arch(g, x, 172, 144, 278, "#3a2530", 4, 0.12); rr(g, x - 16, 440, 176, 14, "#f1e3c4", 3); for (let i = 0; i < 5; i++) rr(g, x + 8 + i * 28, 388, 10, 52, "#f1e3c4", 2); rr(g, x, 384, 144, 8, "#f1e3c4", 2); }
  // lower storey: one big horseshoe gate
  arch(g, 100, 560, 312, 464, "#f1e3c4", 4, 0.1); arch(g, 128, 596, 256, 428, "#2c1c26", 4, 0.1);
  for (let i = 0; i < 9; i++) { g.fillStyle = i % 2 ? "#b5563a" : "#f1e3c4"; g.beginPath(); const a0 = Math.PI * (1.04 + i * 0.102), a1 = a0 + Math.PI * 0.102; g.arc(256, 724, 160, a0, a1); g.arc(256, 724, 136, a1, a0, true); g.closePath(); g.fill(); }
  // tile diamonds between the arches
  for (const [x, y] of [[256, 250], [50, 780], [462, 780]]) { poly(g, [[x, y - 26], [x + 20, y], [x, y + 26], [x - 20, y]], "#3f8fc9", 3); disc(g, x, y, 6, "#f6c419", 2); }
});
/** the tavern front (10 x 5 m): whitewash, ochre plinth, the door standing open, two grilled windows, a jug for a sign */
export const tavernTex = () => ctex("rTavern", 1024, 512, (g, r) => {
  g.fillStyle = "#f4ecd6"; g.fillRect(0, 0, 1024, 512); blot(g, r, 1024, 512, 90, ["#e9dfc4", "#fbf6e6", "#dcd0b0"], 14, 70, 0.4);
  rr(g, 0, 400, 1024, 112, "#c97a42", 4); blot(g, r, 1024, 512, 20, ["#b56a36"], 10, 40, 0.3);
  // door
  rr(g, 418, 150, 188, 362, "#6a4428", 6); rr(g, 434, 166, 156, 346, "#2a1a20", 4); poly(g, [[434, 166], [480, 190], [480, 512], [434, 512]], "#8a5a34", 4); for (let y = 230; y < 500; y += 70) rr(g, 440, y, 34, 6, "#5a3a22");
  arch(g, 404, 96, 216, 70, "#c97a42", 5);
  // windows with iron grilles and flower pots
  for (const x of [120, 730]) { rr(g, x - 12, 168, 204, 184, "#c97a42", 5); rr(g, x, 180, 180, 160, "#33485e", 4); for (let i = 1; i < 5; i++) rr(g, x + i * 36 - 3, 180, 6, 160, "#23202a"); for (let i = 1; i < 4; i++) rr(g, x, 180 + i * 40 - 3, 180, 6, "#23202a");
    rr(g, x - 20, 352, 220, 16, "#e9dfc4", 4); for (let i = 0; i < 3; i++) { rr(g, x + 14 + i * 60, 322, 36, 30, "#b5563a", 3); disc(g, x + 32 + i * 60, 310, 16, "#3f8a3a", 3); disc(g, x + 26 + i * 60, 304, 6, pick(r, ["#e2453c", "#f25c7a", "#f6c419"])); disc(g, x + 40 + i * 60, 312, 5, pick(r, ["#e2453c", "#fbfaf2"])); } }
  // the sign: a wine jug on a board
  rr(g, 452, 30, 120, 60, "#3a2a20", 5, 8); poly(g, [[496, 44], [528, 44], [536, 62], [528, 80], [496, 80], [488, 62]], "#c97a42", 3); g.strokeStyle = "#c97a42"; g.lineWidth = 5; g.beginPath(); g.arc(540, 60, 10, -1.2, 1.2); g.stroke();
  // roof tiles along the top
  for (let i = 0; i < 26; i++) { g.fillStyle = i % 2 ? "#b5563a" : "#c4664a"; g.beginPath(); g.arc(i * 40 + 20, 0, 22, 0, Math.PI); g.fill(); g.strokeStyle = INKC; g.lineWidth = 3; g.stroke(); }
});
/** low house fronts of the outskirts (tile 12 x 6 m) */
export const hovelTex = (k: number) => ctex("rHovel" + k, 1024, 512, (g, r) => {
  const wallc = ["#f1e6cc", "#e9cfa6", "#f4ecd6", "#e2bfa0"][k % 4]; g.fillStyle = wallc; g.fillRect(0, 0, 1024, 512); blot(g, r, 1024, 512, 80, ["#d8c8a8", "#fbf3e0", "#c9b48c"], 14, 70, 0.4);
  rr(g, 0, 420, 1024, 92, ["#a86a4a", "#8a7a66", "#b5563a", "#7a8a8a"][k % 4], 4);
  for (let i = 0; i < 4; i++) { const x = 60 + i * 250; if (i === (k % 3) + 1) { rr(g, x, 190, 120, 322, "#6a4428", 5); rr(g, x + 12, 204, 96, 308, pick(r, ["#3f6a52", "#7a3a2a", "#3a4a6a"]), 4); disc(g, x + 94, 360, 6, "#e8c45a", 2); }
    else { rr(g, x, 150, 130, 170, "#8a6a4a", 5); rr(g, x + 10, 160, 110, 150, "#33485e", 4); rr(g, x + 62, 160, 6, 150, "#fbf6e6"); rr(g, x + 10, 232, 110, 6, "#fbf6e6"); for (const sx of [-34, 132]) rr(g, x + sx, 150, 32, 170, pick(r, ["#3f6a52", "#7a3a2a", "#3a5a7a"]), 4); } }
  for (let i = 0; i < 26; i++) { g.fillStyle = i % 2 ? "#b5563a" : "#c4664a"; g.beginPath(); g.arc(i * 40 + 20, 0, 22, 0, Math.PI); g.fill(); g.strokeStyle = INKC; g.lineWidth = 3; g.stroke(); }
});
/** bolts of cloth seen end-on in pigeonholes (a patch w x h at x, y) */
const BOLT = ["#e2453c", "#f6c419", "#3f8fc9", "#57a05a", "#f25c7a", "#f29a2e", "#7a5a9a", "#2fb0a0", "#fbfaf2", "#1f2f5c", "#b5563a", "#e9dcc6", "#8a2a4a", "#c9d8ea", "#3a6a4a", "#f1c9a2"];
const bolts = (g: G, r: R, x: number, y: number, w: number, h: number, rad: number) => {
  for (let yy = y + h - rad; yy > y + rad * 0.6; yy -= rad * 1.75) for (let xx = x + rad + r() * 4; xx < x + w - rad * 0.8; xx += rad * 2.05) {
    const c = pick(r, BOLT); disc(g, xx, yy, rad, c, 3); g.strokeStyle = "rgba(36,23,38,0.45)"; g.lineWidth = 2; g.beginPath(); for (let a = 0; a < 15; a += 0.3) { const rd = rad * 0.86 * (a / 15); g.lineTo(xx + rd * Math.cos(a), yy + rd * Math.sin(a)); } g.stroke(); disc(g, xx, yy, rad * 0.16, "#e9dcc6", 2);
  }
};
/** the shop front of the cloth merchants (12 x 5.2 m): dark green joinery, gilt trim, two windows full of cloth, the door, a sign of scrolls */
export const shopTex = () => ctex("rShop", 2048, 888, (g, r) => {
  const GR = "#1f4a3a", GD = "#e8c45a";
  g.fillStyle = GR; g.fillRect(0, 0, 2048, 888); blot(g, r, 2048, 888, 60, ["#255846", "#183c2e"], 20, 90, 0.35);
  // fascia: gilt frame, scrolls and a pair of scissors instead of letters
  rr(g, 40, 30, 1968, 150, "#16332a", 6, 10); rr(g, 60, 48, 1928, 114, null, 0); g.strokeStyle = GD; g.lineWidth = 6; g.strokeRect(60, 48, 1928, 114);
  for (let i = 0; i < 9; i++) { const x = 190 + i * 208; if (i === 4) continue; g.strokeStyle = GD; g.lineWidth = 7; g.lineCap = "round"; g.beginPath(); for (let a = 0; a < 9; a += 0.25) g.lineTo(x + (10 + a * 4) * Math.cos(a) * (i % 2 ? 1 : -1), 105 + (6 + a * 3) * Math.sin(a)); g.stroke(); }
  g.strokeStyle = GD; g.lineWidth = 9; g.beginPath(); g.moveTo(960, 70); g.lineTo(1080, 140); g.moveTo(1088, 70); g.lineTo(968, 140); g.stroke(); disc(g, 958, 142, 16, null, 0); g.lineWidth = 7; g.beginPath(); g.arc(958, 142, 15, 0, 6.3); g.stroke(); g.beginPath(); g.arc(1090, 142, 15, 0, 6.3); g.stroke();
  // pilasters
  for (const x of [20, 690, 1270, 1940]) { rr(g, x, 190, 88, 698, "#255846", 5); rr(g, x + 14, 210, 60, 560, null, 0); g.strokeStyle = GD; g.lineWidth = 4; g.strokeRect(x + 14, 210, 60, 560); rr(g, x - 8, 180, 104, 26, GD, 4); rr(g, x - 8, 800, 104, 88, "#16332a", 4); }
  // the two windows
  for (const x of [124, 1374]) { rr(g, x, 210, 550, 560, "#fff3c8", 6); g.fillStyle = vg(g, 210, 770, "#fff6d8", "#e9c98a"); g.fillRect(x + 6, 216, 538, 548);
    bolts(g, r, x + 20, 480, 300, 280, 34); // a stack of bolts
    // lengths of cloth draped from a rail
    for (let i = 0; i < 6; i++) { const c = pick(r, BOLT), xx = x + 30 + i * 84; poly(g, [[xx, 240], [xx + 72, 240], [xx + 78, 430 + r() * 40], [xx + 40, 450 + r() * 30], [xx - 4, 430 + r() * 40]], c, 4); g.strokeStyle = "rgba(36,23,38,0.25)"; g.lineWidth = 3; for (const dx of [18, 38, 56]) { g.beginPath(); g.moveTo(xx + dx, 246); g.lineTo(xx + dx + 3, 420); g.stroke(); } }
    rr(g, x + 16, 232, 518, 12, "#8a5a34", 3);
    // a dressmaker's form in a white shirt
    const mx = x + 430; rr(g, mx - 5, 620, 10, 130, "#5a3320", 3); poly(g, [[mx - 46, 760], [mx + 46, 760], [mx + 30, 744], [mx - 30, 744]], "#5a3320", 3); poly(g, [[mx - 52, 500], [mx - 30, 478], [mx + 30, 478], [mx + 52, 500], [mx + 44, 628], [mx - 44, 628]], "#fbfaf2", 4); disc(g, mx, 468, 12, "#c9a86a", 3); for (let i = 0; i < 4; i++) disc(g, mx, 510 + i * 28, 4, "#c9d2de", 1);
    rr(g, x, 210, 550, 560, null, 6); rr(g, x + 272, 210, 6, 560, GR); g.fillStyle = "rgba(255,255,255,0.22)"; poly(g, [[x + 40, 216], [x + 150, 216], [x + 20, 520], [x + 6, 520], [x + 6, 300]], "rgba(255,255,255,0.2)");
    rr(g, x - 10, 770, 570, 118, "#16332a", 5); rr(g, x + 14, 792, 522, 74, null, 0); g.strokeStyle = GD; g.lineWidth = 4; g.strokeRect(x + 14, 792, 522, 74); }
  // the door: two glazed leaves
  rr(g, 790, 200, 468, 688, "#16332a", 6); for (const x of [806, 1030]) { rr(g, x, 220, 212, 668, "#255846", 5); rr(g, x + 22, 246, 168, 380, "#fff0c0", 4); g.fillStyle = "rgba(255,255,255,0.3)"; poly(g, [[x + 30, 252], [x + 90, 252], [x + 34, 420]], "rgba(255,255,255,0.3)"); rr(g, x + 22, 660, 168, 190, null, 0); g.strokeStyle = GD; g.lineWidth = 4; g.strokeRect(x + 22, 660, 168, 190); }
  disc(g, 1006, 560, 10, GD, 3); disc(g, 1042, 560, 10, GD, 3);
});
/** upper floors of the Madrid street houses (tile 12 x 4 m: one floor, four balconies) */
export const madridTex = (k: number) => ctex("rMad" + k, 1024, 340, (g, r) => {
  const wallc = ["#f1dcc0", "#e9c9a6", "#f4e8d0", "#d8b8a0", "#e6d6c6", "#f0cfb0"][k % 6], trim = ["#fbf6e6", "#f4ecd6", "#e9dcc6"][k % 3];
  g.fillStyle = wallc; g.fillRect(0, 0, 1024, 340); blot(g, r, 1024, 340, 50, ["#fbf3e0", "#c9b090", "#e0c8a6"], 14, 60, 0.3);
  rr(g, 0, 300, 1024, 40, trim, 3); rr(g, 0, 0, 1024, 14, trim, 3);
  for (let i = 0; i < 4; i++) { const x = 64 + i * 256;
    rr(g, x - 14, 52, 156, 232, trim, 4); arch(g, x, 40, 128, 244, trim, 4); rr(g, x + 8, 76, 112, 208, "#33485e", 4); rr(g, x + 60, 76, 6, 208, trim); rr(g, x + 8, 150, 112, 6, trim);
    const sh = pick(r, ["#3f6a52", "#6a4a3a", "#3a5a7a", "#7a3a2a"]); if (r() < 0.7) for (const sx of [8, 84]) { rr(g, x + sx, 76, 36, 208, sh, 3); for (let y = 90; y < 276; y += 16) rr(g, x + sx + 5, y, 26, 4, "rgba(0,0,0,0.25)"); }
    if (r() < 0.4) poly(g, [[x + 8, 76], [x + 120, 76], [x + 110, 170], [x + 70, 150], [x + 30, 176]], "#fbfaf2", 3); // a curtain
    // iron balcony
    rr(g, x - 34, 286, 196, 12, "#3a3438", 3); rr(g, x - 30, 214, 188, 6, "#23202a"); for (let j = 0; j <= 12; j++) rr(g, x - 30 + j * 15.3, 214, 4, 74, "#23202a"); for (let j = 0; j < 6; j++) { g.strokeStyle = "#23202a"; g.lineWidth = 3; g.beginPath(); g.arc(x - 14 + j * 31, 252, 10, 0, 6.3); g.stroke(); }
    if (r() < 0.5) for (let j = 0; j < 3; j++) { disc(g, x - 10 + j * 70, 206, 14, "#3f8a3a", 3); disc(g, x - 14 + j * 70, 200, 5, pick(r, ["#e2453c", "#f25c7a", "#f6c419", "#fbfaf2"])); }
  }
});
/** ground floor of the street houses: shops under awnings, doorways (tile 12 x 5.2 m) */
export const arcadeTex = (k: number) => ctex("rArc" + k, 1024, 444, (g, r) => {
  const base = ["#8a7a66", "#6a5a4a", "#7a6a5a", "#5a5248"][k % 4]; g.fillStyle = base; g.fillRect(0, 0, 1024, 444); blot(g, r, 1024, 444, 40, ["#9a8a76", "#5a4a3c"], 14, 60, 0.3);
  rr(g, 0, 0, 1024, 26, "#f4ecd6", 3);
  for (let i = 0; i < 3; i++) { const x = 40 + i * 340, c = pick(r, ["#7a2630", "#1f2f5c", "#3a2a20", "#5a3a22", "#2f4a3a"]);
    rr(g, x, 60, 280, 384, c, 5); rr(g, x + 16, 120, 248, 250, "#fff0c0", 4); g.fillStyle = vg(g, 120, 370, "#fff6d8", "#d9b98a"); g.fillRect(x + 20, 124, 240, 242);
    if (i === 1) { rr(g, x + 90, 120, 100, 324, "#2a1a20", 4); rr(g, x + 96, 128, 88, 316, shade2(c), 3); }
    else for (let j = 0; j < 5; j++) { const y = 340 - (j % 3) * 60; disc(g, x + 46 + j * 48, y, 18, pick(r, ["#c97a42", "#e8c45a", "#b5563a", "#fbfaf2", "#3f8fc9", "#57a05a"]), 3); rr(g, x + 30 + j * 48, y + 18, 34, 6, "#5a3320"); }
    rr(g, x + 16, 72, 248, 36, "rgba(0,0,0,0.3)", 0, 6); for (let j = 0; j < 7; j++) rr(g, x + 34 + j * 32, 84, 20, 10, "#e8c45a", 0, 4); // a sign of blocks, no letters
    // striped awning
    const ac = pick(r, ["#b8362e", "#2f6a4a", "#1f2f5c", "#c97a42"]); for (let j = 0; j < 8; j++) poly(g, [[x - 10 + j * 37.5, 108], [x - 10 + (j + 1) * 37.5, 108], [x - 22 + (j + 1) * 40.5, 176], [x - 22 + j * 40.5, 176]], j % 2 ? ac : "#fbf6e6", 2);
    for (let j = 0; j < 8; j++) { g.fillStyle = j % 2 ? ac : "#fbf6e6"; g.beginPath(); g.arc(x - 2 + j * 40.5, 176, 20, 0, Math.PI); g.fill(); g.strokeStyle = INKC; g.lineWidth = 2; g.stroke(); } }
});
const shade2 = (c: string) => { const n = parseInt(c.slice(1), 16), f = (v: number) => Math.round(v * 0.7); return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`; };
/** slate mansard with dormers (tile 12 x 3 m) */
export const mansardTex = () => ctex("rMansard", 1024, 256, (g, r) => {
  g.fillStyle = "#5f6f86"; g.fillRect(0, 0, 1024, 256); for (let y = 0; y < 256; y += 20) for (let x = (y / 20) % 2 ? 0 : 16; x < 1024; x += 32) { g.fillStyle = pick(r, ["#56667c", "#6a7a92", "#4e5e74", "#62728a"]); g.beginPath(); g.moveTo(x, y); g.lineTo(x + 32, y); g.lineTo(x + 32, y + 14); g.arc(x + 16, y + 14, 16, 0, Math.PI); g.closePath(); g.fill(); g.strokeStyle = "rgba(30,34,50,0.5)"; g.lineWidth = 2; g.stroke(); }
  rr(g, 0, 236, 1024, 20, "#f4ecd6", 3); rr(g, 0, 0, 1024, 12, "#3a4458", 3);
  for (let i = 0; i < 4; i++) { const x = 84 + i * 256; rr(g, x, 70, 96, 150, "#f4ecd6", 4); arch(g, x + 12, 86, 72, 134, "#33485e", 3); poly(g, [[x - 14, 76], [x + 48, 30], [x + 110, 76]], "#4e5e74", 4); }
});
/** cobbles with tram rails (tile 6 m across the street, 6 m along): rails at u = 0.25 and 0.75 */
export const setsTex = () => ctex("rSetts", 512, 512, (g, r) => {
  g.fillStyle = "#8f8a86"; g.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 22) for (let x = (y / 22) % 2 ? -18 : 0; x < 512; x += 36) { g.fillStyle = pick(r, ["#9a958f", "#a8a29a", "#86817c", "#b3ada4", "#7c7772", "#a09088"]); g.beginPath(); g.roundRect(x + 2, y + 2, 32, 18, 6); g.fill(); g.strokeStyle = "rgba(40,34,44,0.55)"; g.lineWidth = 2; g.stroke(); g.fillStyle = "rgba(255,255,255,0.14)"; g.fillRect(x + 6, y + 5, 16, 3); }
  blot(g, r, 512, 512, 30, ["#6a655f", "#b9b3a8"], 14, 50, 0.22);
});
/** flagstone pavement (tile 4 m) */
export const paveTex = () => ctex("rPave", 512, 512, (g, r) => {
  g.fillStyle = "#cfc6b4"; g.fillRect(0, 0, 512, 512); for (let y = 0; y < 512; y += 64) for (let x = (y / 64) % 2 ? -64 : 0; x < 512; x += 128) { g.fillStyle = pick(r, ["#d8cfbc", "#c6bca8", "#e0d8c6", "#bdb39e"]); g.fillRect(x + 2, y + 2, 124, 60); g.strokeStyle = "rgba(60,50,50,0.5)"; g.lineWidth = 3; g.strokeRect(x + 2, y + 2, 124, 60); }
  blot(g, r, 512, 512, 30, ["#a89e8a", "#ece4d2"], 10, 40, 0.25);
});
/** shelving full of bolts of cloth (tile 4 x 3 m: five shelves) */
export const shelfTex = () => ctex("rShelf", 1024, 768, (g, r) => {
  g.fillStyle = "#3a2418"; g.fillRect(0, 0, 1024, 768);
  for (let s = 0; s < 5; s++) { const y = 20 + s * 150; for (let c = 0; c < 4; c++) { const x = 12 + c * 253; g.fillStyle = "#2a1810"; g.fillRect(x, y, 241, 132);
      if ((s + c) % 4 === 3) { // bolts lying flat, seen from the side
        for (let j = 0; j < 4; j++) { const cc = pick(r, BOLT); rr(g, x + 10, y + 100 - j * 30, 220, 28, cc, 3, 12); g.strokeStyle = "rgba(36,23,38,0.25)"; g.lineWidth = 2; for (let k = 1; k < 6; k++) { g.beginPath(); g.moveTo(x + 10 + k * 37, y + 102 - j * 30); g.lineTo(x + 10 + k * 37, y + 126 - j * 30); g.stroke(); } }
      } else bolts(g, r, x + 2, y + 2, 238, 130, 26 + (s % 2) * 6); }
    rr(g, 0, y + 132, 1024, 18, "#8a5a34", 3); g.fillStyle = "rgba(255,230,180,0.2)"; g.fillRect(0, y + 134, 1024, 4); }
  for (let c = 0; c <= 4; c++) rr(g, c * 253 - (c === 4 ? 12 : 0), 0, 12, 768, "#6a4428", 3);
  rr(g, 0, 0, 1024, 20, "#8a5a34", 3);
});
/** the back room wall (tile 3 x 3 m): striped paper over dark panelling */
export const paperTex = () => ctex("rPaper", 768, 768, (g, r) => {
  for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? "#c9a878" : "#d8ba8a"; g.fillRect(i * 48, 0, 48, 768); }
  for (let i = 0; i < 16; i++) for (let y = 30; y < 500; y += 80) { const x = i * 48 + 24; g.fillStyle = "rgba(122,38,48,0.5)"; poly(g, [[x, y - 12], [x + 8, y], [x, y + 12], [x - 8, y]], "rgba(122,38,48,0.45)"); }
  blot(g, r, 768, 768, 30, ["#b8946a", "#e6cfa0"], 20, 80, 0.2);
  rr(g, 0, 520, 768, 248, "#5a3320", 4); rr(g, 0, 506, 768, 22, "#7a4a2c", 3); for (let i = 0; i < 4; i++) { rr(g, 22 + i * 192, 560, 148, 180, "#6a3e26", 3); rr(g, 36 + i * 192, 574, 120, 152, "#4e2c1c", 2); }
  rr(g, 0, 0, 768, 16, "#7a4a2c", 3);
});
/** an old paper map of the peninsula, no lettering (1024 x 768): the route is drawn by the staging */
export const MAP_BCN: [number, number] = [0.845, 0.3], MAP_MAD: [number, number] = [0.45, 0.47];
export const mapTex = () => ctex("rMap", 1024, 768, (g, r) => {
  g.fillStyle = "#b9d3d6"; g.fillRect(0, 0, 1024, 768); blot(g, r, 1024, 768, 60, ["#a8c6cc", "#c9e0e0", "#9fbcc6"], 30, 120, 0.4);
  g.strokeStyle = "rgba(60,100,120,0.35)"; g.lineWidth = 3; for (let i = 0; i < 70; i++) { const x = r() * 1024, y = r() * 768; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 14, y - 8, x + 28, y); g.stroke(); }
  const P: number[][] = [[0.08, 0.15], [0.2, 0.1], [0.36, 0.12], [0.52, 0.11], [0.62, 0.15], [0.76, 0.15], [0.9, 0.14], [0.94, 0.19], [0.9, 0.25], [0.84, 0.31], [0.76, 0.4], [0.71, 0.52], [0.75, 0.6], [0.7, 0.67], [0.66, 0.75], [0.58, 0.83], [0.48, 0.84], [0.4, 0.87], [0.34, 0.93], [0.29, 0.87], [0.21, 0.81], [0.12, 0.83], [0.06, 0.81], [0.08, 0.72], [0.05, 0.62], [0.09, 0.5], [0.07, 0.36], [0.04, 0.25], [0.03, 0.17]];
  const path = () => { g.beginPath(); const n = P.length; for (let i = 0; i <= n; i++) { const a = P[i % n], b = P[(i + 1) % n], mx = (a[0] + b[0]) / 2 * 1024, my = (a[1] + b[1]) / 2 * 768; if (!i) g.moveTo(mx, my); else g.quadraticCurveTo(a[0] * 1024, a[1] * 768, mx, my); } g.closePath(); };
  g.save(); g.translate(6, 8); path(); g.fillStyle = "rgba(40,70,90,0.4)"; g.fill(); g.restore();
  path(); g.fillStyle = "#f1e3bc"; g.fill(); g.save(); g.clip(); blot(g, r, 1024, 768, 90, ["#e6d4a4", "#fbf0d0", "#dcc690", "#cfe0a8", "#e9cf9a"], 30, 110, 0.5);
  // ranges of little mountains and a few rivers
  for (const [x0, y0, n, dx, dy] of [[0.56, 0.17, 9, 0.038, 0.0], [0.2, 0.2, 7, 0.04, 0.004], [0.3, 0.42, 6, 0.04, -0.01], [0.42, 0.7, 6, 0.04, 0.014], [0.6, 0.36, 5, 0.02, 0.04]]) for (let i = 0; i < n; i++) { const x = (x0 + i * dx) * 1024 + r() * 8, y = (y0 + i * dy) * 768 + r() * 8; poly(g, [[x - 16, y + 12], [x, y - 14], [x + 16, y + 12]], "#c9a86a", 3); poly(g, [[x - 5, y - 4], [x, y - 14], [x + 6, y - 3]], "#fbfaf2", 0); }
  g.strokeStyle = "#7fb0c4"; g.lineWidth = 5; g.lineCap = "round"; for (const pts of [[[0.74, 0.34], [0.62, 0.26], [0.5, 0.2], [0.4, 0.2]], [[0.07, 0.6], [0.2, 0.58], [0.34, 0.55], [0.5, 0.52]], [[0.3, 0.86], [0.4, 0.76], [0.52, 0.72]], [[0.07, 0.4], [0.2, 0.36], [0.36, 0.34]]]) { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x * 1024, y * 768) : g.moveTo(x * 1024, y * 768))); g.stroke(); }
  g.restore(); path(); g.strokeStyle = INKC; g.lineWidth = 6; g.lineJoin = "round"; g.stroke();
  // islands, a compass rose, a border
  for (const [x, y, s] of [[0.93, 0.52, 26], [0.97, 0.47, 14], [0.86, 0.6, 12]]) { g.beginPath(); g.ellipse(x * 1024, y * 768, s, s * 0.6, 0.4, 0, 6.3); g.fillStyle = "#f1e3bc"; g.fill(); g.strokeStyle = INKC; g.lineWidth = 5; g.stroke(); }
  { const cx = 150, cy = 650; for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2, l = i % 2 ? 34 : 64; poly(g, [[cx + l * Math.cos(a), cy + l * Math.sin(a)], [cx + 12 * Math.cos(a + 0.6), cy + 12 * Math.sin(a + 0.6)], [cx + 12 * Math.cos(a - 0.6), cy + 12 * Math.sin(a - 0.6)]], i % 4 === 0 ? "#b8362e" : "#f1e3bc", 3); } disc(g, cx, cy, 9, "#e8c45a", 3); }
  g.strokeStyle = "#7a5a3a"; g.lineWidth = 14; g.strokeRect(7, 7, 1010, 754); g.strokeStyle = "#f1e3bc"; g.lineWidth = 4; g.strokeRect(18, 18, 988, 732);
  // the two cities
  for (const [m, c] of [[MAP_BCN, "#3f6fb0"], [MAP_MAD, "#b8362e"]] as [[number, number], string][]) { disc(g, m[0] * 1024, m[1] * 768, 15, "#fbfaf2", 5); disc(g, m[0] * 1024, m[1] * 768, 7, c); }
});
/** a skyline cut-out, hazy: k = 0 London (clock tower, dome, bridge towers, chimneys), k = 1 Madrid (domes, spires, low roofs) */
export const skylineTex = (k: number) => ctex("rSky" + k, 2048, 512, (g, r) => {
  g.clearRect(0, 0, 2048, 512);
  const lay = (col: string, base: number, hmin: number, hmax: number, seed: number) => { g.fillStyle = col; let x = -10; let i = seed; while (x < 2048) { const w = 40 + r() * 70, h = hmin + r() * (hmax - hmin); g.fillRect(x, 512 - base - h, w, base + h); if (r() < 0.5) { g.beginPath(); g.moveTo(x - 4, 512 - base - h); g.lineTo(x + w / 2, 512 - base - h - w * 0.3); g.lineTo(x + w + 4, 512 - base - h); g.fill(); } if (r() < 0.45) g.fillRect(x + w * 0.3, 512 - base - h - 26, 10, 30); x += w; i++; } };
  if (k === 0) {
    lay("#93a3c0", 60, 60, 150, 1);
    g.fillStyle = "#7f8fb0"; // the clock tower
    g.fillRect(480, 120, 74, 392); g.beginPath(); g.moveTo(470, 124); g.lineTo(517, 20); g.lineTo(564, 124); g.fill(); g.fillRect(468, 190, 98, 16); disc(g, 517, 160, 24, "#e9eef8"); g.strokeStyle = "#5a6a8a"; g.lineWidth = 4; g.beginPath(); g.moveTo(517, 160); g.lineTo(517, 144); g.moveTo(517, 160); g.lineTo(530, 166); g.stroke();
    g.fillStyle = "#7f8fb0"; g.fillRect(300, 300, 190, 212); for (let i = 0; i < 9; i++) g.fillRect(300 + i * 22, 280, 8, 30);
    // the dome
    g.fillRect(1090, 300, 220, 212); g.beginPath(); g.arc(1200, 300, 84, Math.PI, 0); g.fill(); g.fillRect(1190, 180, 20, 50); g.fillRect(1196, 150, 8, 40);
    // the bridge with its two towers
    for (const x of [1500, 1720]) { g.fillRect(x, 210, 64, 302); g.beginPath(); g.moveTo(x - 8, 214); g.lineTo(x + 32, 140); g.lineTo(x + 72, 214); g.fill(); } g.fillRect(1500, 300, 284, 12); g.fillRect(1380, 400, 540, 14); g.strokeStyle = "#7f8fb0"; g.lineWidth = 6; g.beginPath(); g.moveTo(1380, 400); g.quadraticCurveTo(1450, 380, 1500, 250); g.moveTo(1920, 400); g.quadraticCurveTo(1850, 380, 1784, 250); g.stroke();
    lay("#6f7f9f", 30, 30, 100, 2);
  } else {
    lay("#c9b8a8", 50, 40, 120, 3);
    g.fillStyle = "#b8a494"; for (const [x, w, h] of [[360, 120, 190], [1040, 150, 230], [1620, 110, 170]]) { g.fillRect(x, 512 - h, w, h); g.beginPath(); g.arc(x + w / 2, 512 - h, w * 0.4, Math.PI, 0); g.fill(); g.fillRect(x + w / 2 - 5, 512 - h - w * 0.4 - 40, 10, 44); }
    for (const [x, h] of [[700, 300], [1400, 260], [180, 240]]) { g.fillRect(x, 512 - h + 60, 44, h); g.beginPath(); g.moveTo(x - 6, 512 - h + 64); g.lineTo(x + 22, 512 - h - 40); g.lineTo(x + 50, 512 - h + 64); g.fill(); }
    lay("#a8907c", 26, 26, 80, 4);
  }
});
/** the stone gate at the end of the street (cut-out, 44 x 22 m): three round arches between two square doors, statues on top */
export const gateTex = () => ctex("rGate", 2048, 1024, (g, r) => {
  g.clearRect(0, 0, 2048, 1024); const st = "#e6dccb";
  rr(g, 60, 300, 1928, 724, st, 8); blot(g, r, 2048, 1024, 60, ["#d8ccb8", "#f4ecdc", "#c9bca6"], 20, 100, 0.3); g.clearRect(0, 0, 2048, 296); g.clearRect(0, 0, 56, 1024); g.clearRect(1992, 0, 56, 1024);
  rr(g, 30, 250, 1988, 70, "#f1e8d8", 8); rr(g, 620, 130, 808, 130, st, 8); poly(g, [[600, 134], [1024, 30], [1448, 134]], "#f1e8d8", 8);
  for (const x of [200, 1848]) { disc(g, x, 214, 34, st, 6); rr(g, x - 26, 150, 52, 50, st, 6); } for (const x of [760, 1288]) poly(g, [[x - 40, 130], [x, 60], [x + 40, 130]], st, 6);
  for (const x of [690, 1024, 1358]) { g.save(); g.globalCompositeOperation = "destination-out"; arch(g, x - 120, 470, 240, 560, "#000"); g.restore(); g.strokeStyle = INKC; g.lineWidth = 8; g.beginPath(); g.moveTo(x - 120, 1024); g.lineTo(x - 120, 590); g.arc(x, 590, 120, Math.PI, 0); g.lineTo(x + 120, 1024); g.stroke(); }
  for (const x of [300, 1748]) { g.save(); g.globalCompositeOperation = "destination-out"; g.fillRect(x - 100, 620, 200, 410); g.restore(); g.strokeStyle = INKC; g.lineWidth = 8; g.strokeRect(x - 100, 620, 200, 410); }
  for (const x of [120, 480, 520, 860, 1188, 1528, 1568, 1928]) { rr(g, x - 22, 330, 44, 694, "#f1e8d8", 6); rr(g, x - 32, 320, 64, 30, "#f1e8d8", 6); }
});
/** the tram of 1902 (6.4 x 2.5 m side): cream over deep red, a row of windows with heads behind them */
export const tramTex = () => ctex("rTram", 1024, 400, (g, r) => {
  g.clearRect(0, 0, 1024, 400); rr(g, 10, 20, 1004, 370, "#f4e6c0", 8, 22); rr(g, 10, 230, 1004, 160, "#9a2a2a", 8, 14); rr(g, 10, 20, 1004, 44, "#c9a86a", 6, 18);
  for (let i = 0; i < 7; i++) { const x = 44 + i * 136; rr(g, x, 84, 112, 126, "#bfe0f0", 6, 8); if (r() < 0.75) { disc(g, x + 56, 168, 26, pick(r, ["#fbd3b8", "#f6c9a8", "#eebfa0"]), 4); rr(g, x + 30, 190, 52, 20, pick(r, ["#2c2a38", "#7a2630", "#5a4c40"]), 4, 8); rr(g, x + 28, 132, 56, 16, pick(r, ["#23202a", "#e9d9a8", "#3a3438"]), 4, 6); } g.fillStyle = "rgba(255,255,255,0.3)"; poly(g, [[x + 6, 90], [x + 40, 90], [x + 12, 150], [x + 6, 150]], "rgba(255,255,255,0.3)"); }
  g.strokeStyle = "#e8c45a"; g.lineWidth = 6; g.strokeRect(34, 250, 956, 110); for (let i = 0; i < 5; i++) disc(g, 140 + i * 186, 306, 16, "#e8c45a", 4);
});
/** a goal net (alpha between the cords) */
export const netTex = () => ctex("rNet", 256, 256, (g) => {
  g.clearRect(0, 0, 256, 256); g.strokeStyle = "rgba(255,255,255,0.95)"; g.lineWidth = 2; for (let i = -8; i <= 16; i++) { g.beginPath(); g.moveTo(i * 32, 0); g.lineTo(i * 32 + 256, 256); g.stroke(); g.beginPath(); g.moveTo(i * 32, 0); g.lineTo(i * 32 - 256, 256); g.stroke(); }
});
/** the royal box: crimson hangings with a gold fringe and a crown (8 x 2.4 m) */
export const royalTex = () => ctex("rRoyal", 1024, 300, (g) => {
  g.fillStyle = "#a81e2e"; g.fillRect(0, 0, 1024, 300); for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? "rgba(0,0,0,0.14)" : "rgba(255,255,255,0.08)"; g.fillRect(i * 64, 0, 64, 300); }
  for (let i = 0; i < 8; i++) { g.fillStyle = "#c2283a"; g.beginPath(); g.arc(i * 128 + 64, 0, 74, 0, Math.PI); g.fill(); g.strokeStyle = "#e8c45a"; g.lineWidth = 8; g.stroke(); }
  rr(g, 0, 262, 1024, 38, "#e8c45a", 4); for (let i = 0; i < 52; i++) rr(g, i * 20 + 4, 270, 6, 30, "#c9a24a");
  const cx = 512, cy = 170; poly(g, [[cx - 70, cy + 40], [cx - 84, cy - 30], [cx - 40, cy + 4], [cx, cy - 50], [cx + 40, cy + 4], [cx + 84, cy - 30], [cx + 70, cy + 40]], "#e8c45a", 6); rr(g, cx - 72, cy + 36, 144, 22, "#f6d67a", 5); for (const [dx, dy] of [[-84, -34], [0, -56], [84, -34]]) disc(g, cx + dx, cy + dy, 10, "#fbfaf2", 4); for (const dx of [-40, 0, 40]) disc(g, cx + dx, cy + 47, 6, dx ? "#3f8fc9" : "#e2453c", 2);
});
/** advertising boards of today: plain blocks of colour, no lettering (tile 12 x 1 m) */
export const boardTex = () => ctex("rBoard", 1024, 96, (g) => {
  const cs = ["#1f2f5c", "#fbfaf2", "#e8c45a", "#fbfaf2", "#1f2f5c", "#6a4c9a", "#fbfaf2", "#1f2f5c"]; cs.forEach((c, i) => { g.fillStyle = c; g.fillRect(i * 128, 0, 128, 96); g.fillStyle = "rgba(255,255,255,0.25)"; g.fillRect(i * 128 + 14, 34, 100, 10); g.fillRect(i * 128 + 30, 54, 68, 8); });
  g.strokeStyle = INKC; g.lineWidth = 5; g.strokeRect(0, 0, 1024, 96);
});
/** rows of plastic seats seen from the front (tile 6 x 1 m) */
export const seatTex = () => ctex("rSeat", 768, 128, (g) => {
  g.fillStyle = "#2a3350"; g.fillRect(0, 0, 768, 128); for (let i = 0; i < 12; i++) { rr(g, i * 64 + 6, 14, 52, 96, i % 5 === 2 ? "#fbfaf2" : "#2f4fa8", 4, 12); g.fillStyle = "rgba(255,255,255,0.2)"; g.fillRect(i * 64 + 14, 24, 36, 8); }
});
/** white-painted boarding (stands of 1902, rails), tile 2 m */
export const boardingTex = () => ctex("rBoarding", 256, 256, (g, r) => {
  g.fillStyle = "#f4efe2"; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 8; i++) { g.fillStyle = pick(r, ["#f7f3e8", "#ece5d4", "#fbf8f0"]); g.fillRect(i * 32 + 1, 0, 30, 256); g.fillStyle = "rgba(90,70,60,0.35)"; g.fillRect(i * 32, 0, 2, 256); }
  blot(g, r, 256, 256, 14, ["#d8ceb8"], 6, 20, 0.3);
});
/** a Persian-ish rug (3 x 2 m) */
export const rugTex = () => ctex("rRug", 768, 512, (g) => {
  g.fillStyle = "#8a2a3a"; g.fillRect(0, 0, 768, 512); rr(g, 24, 24, 720, 464, "#1f2f5c", 6); rr(g, 54, 54, 660, 404, "#a83a44", 5);
  for (let i = 0; i < 9; i++) for (let j = 0; j < 5; j++) { const x = 104 + i * 70, y = 100 + j * 78; poly(g, [[x, y - 22], [x + 22, y], [x, y + 22], [x - 22, y]], (i + j) % 2 ? "#e8c45a" : "#f1e3c4", 3); disc(g, x, y, 6, "#1f2f5c"); }
  for (let i = 0; i < 39; i++) { g.fillStyle = "#f1e3c4"; g.fillRect(i * 20 + 2, 0, 6, 16); g.fillRect(i * 20 + 2, 496, 6, 16); }
});
/** the founding paper on the table: ruled lines and a seal, nothing legible (0.5 x 0.7 m) */
export const deedTex = () => ctex("rDeed", 256, 360, (g, r) => {
  g.fillStyle = "#fbf3dc"; g.fillRect(0, 0, 256, 360); g.strokeStyle = "#8a7a66"; g.lineWidth = 3; g.strokeRect(6, 6, 244, 348);
  g.strokeStyle = "#3a3048"; g.lineWidth = 3; g.lineCap = "round"; for (let y = 60; y < 250; y += 22) { g.beginPath(); let x = 28; g.moveTo(x, y); while (x < 220 - r() * 40) { x += 6; g.lineTo(x, y + (r() - 0.5) * 6); } g.stroke(); }
  rr(g, 70, 26, 116, 14, "#3a3048", 0, 6); disc(g, 196, 304, 22, "#b8362e", 3); g.strokeStyle = "#3a3048"; g.lineWidth = 4; g.beginPath(); g.moveTo(30, 310); g.bezierCurveTo(60, 270, 80, 340, 110, 300); g.bezierCurveTo(120, 286, 140, 320, 150, 300); g.stroke();
});
/** a framed picture for the walls: a landscape (k) */
export const frameTex = (k: number) => ctex("rFrame" + k, 256, 200, (g) => {
  rr(g, 0, 0, 256, 200, "#c9a24a", 6); rr(g, 18, 18, 220, 164, k % 2 ? "#bfe0f0" : "#f6d7a8", 4); g.fillStyle = k % 2 ? "#57a05a" : "#c97a42"; g.beginPath(); g.moveTo(18, 182); g.lineTo(18, 130); g.quadraticCurveTo(90, 80, 150, 126); g.quadraticCurveTo(200, 100, 238, 120); g.lineTo(238, 182); g.fill(); disc(g, 190, 60, 18, "#fbf3c4");
});
