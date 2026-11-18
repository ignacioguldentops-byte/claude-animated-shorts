// Painted textures of "Sin límite": the cricket ground (mown outfield, pitch, picket fence, 1930s crowd, pavilion, scoreboard),
// the liner at the quay and the station with its train.
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
const poly = (g: G, pts: number[][], fill: string | null, ink = 0) => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); if (fill) { g.fillStyle = fill; g.fill(); } if (ink) { g.lineWidth = ink; g.strokeStyle = INKC; g.lineJoin = "round"; g.stroke(); } };
const disc = (g: G, x: number, y: number, rad: number, fill: string, ink = 0) => { g.beginPath(); g.arc(x, y, rad, 0, 6.3); g.fillStyle = fill; g.fill(); if (ink) { g.lineWidth = ink; g.strokeStyle = INKC; g.stroke(); } };

/** mown outfield: light and dark bands (tile = 16 m across, bands run along v) */
export const outfieldTex = () => ctex("kOut", 512, 512, (g, r) => {
  for (let i = 0; i < 4; i++) { g.fillStyle = i % 2 ? "#63b84c" : "#52a640"; g.fillRect(i * 128, 0, 128, 512); }
  blot(g, r, 512, 512, 120, ["#4c9c3c", "#70c258", "#5aae46", "#7fca62"], 8, 40, 0.3);
  for (let i = 0; i < 1800; i++) { g.fillStyle = r() < 0.5 ? "rgba(30,90,30,0.22)" : "rgba(200,240,140,0.28)"; g.fillRect(r() * 512, r() * 512, 3, 7); }
});
/** the pitch: rolled straw-coloured strip, creases at both ends (u across 3.05 m, v along 24 m) */
export const pitchTex = () => ctex("kPitch", 256, 1024, (g, r) => {
  g.fillStyle = "#d9c489"; g.fillRect(0, 0, 256, 1024); blot(g, r, 256, 1024, 160, ["#cdb679", "#e4d29c", "#c4ab6c", "#ead9a8"], 8, 46, 0.4);
  for (let i = 0; i < 500; i++) { g.fillStyle = "rgba(120,96,50,0.18)"; g.fillRect(r() * 256, r() * 1024, 2, 10 + r() * 22); }
  blot(g, r, 256, 1024, 30, ["#b79a5a"], 14, 30, 0.35);
  g.fillStyle = "#fbfaf2"; const px = 1024 / 24; // pixels per metre along
  for (const z of [12 - 10.06, 12 + 10.06]) { const y = z * px, d = z < 12 ? 1 : -1; g.fillRect(34, y - 3, 188, 6); g.fillRect(0, y + d * 1.22 * px - 3, 256, 6); g.fillRect(34, y - (d > 0 ? 0 : 2.44 * px) - (d > 0 ? 1.22 * px : -1.22 * px), 6, 2.44 * px); g.fillRect(216, y - (d > 0 ? 0 : 2.44 * px) - (d > 0 ? 1.22 * px : -1.22 * px), 6, 2.44 * px); }
});
/** white picket fence (alpha between the pales) */
export const fenceTex = () => ctex("kFence", 256, 128, (g) => {
  g.clearRect(0, 0, 256, 128);
  for (let i = 0; i < 8; i++) { const x = i * 32 + 5; poly(g, [[x, 128], [x, 26], [x + 11, 8], [x + 22, 26], [x + 22, 128]], "#fbfaf2", 4); }
  rr(g, 0, 50, 256, 12, "#f1eee4", 3); rr(g, 0, 98, 256, 12, "#f1eee4", 3);
});
/** a summer crowd of the 1930s: hats, light suits and dresses, row after row */
export const crowd39Tex = (k = 0) => ctex("kCrowd" + k, 2048, 768, (g, r) => {
  const rows = 9, rh = 768 / rows;
  const coats = k ? ["#e2453c", "#3f8fc9", "#f6c419", "#57a05a", "#f25c7a", "#f29a2e", "#7a5a9a", "#2fb0a0", "#f7f5ee"] : ["#e9dcc6", "#c9b79c", "#8a7a66", "#f4f1ea", "#a8b8c8", "#d9a8a0", "#7a8a9a", "#b9c9a0", "#5f6a7a", "#e8c9a0"];
  const hats = k ? ["#e2453c", "#3f8fc9", "#f6c419", "#f7f5ee", "#57a05a"] : ["#e9d9a8", "#f4f1ea", "#6a5a4a", "#8a7f86", "#d9c9a0", "#3a3438"];
  const skins = ["#fde3cc", "#f1c9a2", "#e2b088", "#fff0e0", "#c99067", "#8f5d3e"];
  for (let y = 0; y < rows; y++) {
    g.fillStyle = y % 2 ? "#7a6a5a" : "#86755f"; g.fillRect(0, y * rh, 2048, rh); g.fillStyle = "#5a4c40"; g.fillRect(0, y * rh + rh * 0.86, 2048, rh * 0.14);
    for (let x = 4; x < 2048; x += 38 + r() * 8) {
      const c = pick(r, coats), cx = x + 17, by = y * rh + rh * 0.88, hy = by - rh * 0.56, hat = r() < (k ? 0.45 : 0.8);
      g.fillStyle = INKC; g.beginPath(); g.ellipse(cx, by - rh * 0.2, 18, rh * 0.31, 0, 0, 6.3); g.fill(); g.fillStyle = c; g.beginPath(); g.ellipse(cx, by - rh * 0.2, 15, rh * 0.28, 0, 0, 6.3); g.fill();
      disc(g, cx, hy, 17, INKC); disc(g, cx, hy, 14, pick(r, skins));
      if (hat) { const hc = pick(r, hats); g.fillStyle = INKC; g.beginPath(); g.ellipse(cx, hy - 9, 25, 7, 0, 0, 6.3); g.fill(); g.fillStyle = hc; g.beginPath(); g.ellipse(cx, hy - 9, 22, 5, 0, 0, 6.3); g.fill(); rr(g, cx - 13, hy - 24, 26, 15, INKC, 0, 6); rr(g, cx - 10, hy - 22, 20, 12, hc, 0, 5); }
      else { g.fillStyle = pick(r, ["#5a3b22", "#2a1d16", "#c9a24a", "#8a7f86"]); g.beginPath(); g.arc(cx, hy - 4, 14, Math.PI, 0); g.fill(); }
    }
  }
});
/** the pavilion front: cream boards, tall windows and doors, a veranda rail; k = 0 ground floor, 1 upper floor */
export const pavilionTex = (k: number) => ctex("kPav" + k, 1024, 256, (g, r) => {
  g.fillStyle = "#f3e7c9"; g.fillRect(0, 0, 1024, 256); for (let y = 0; y < 256; y += 22) { g.fillStyle = "rgba(150,120,70,0.18)"; g.fillRect(0, y, 1024, 2); }
  blot(g, r, 1024, 256, 40, ["#e6d6b0", "#fbf2da"], 20, 70, 0.3);
  for (let i = 0; i < 8; i++) { const x = 30 + i * 124;
    if (k === 0 && (i === 3 || i === 4)) { rr(g, x + 8, 50, 92, 206, "#3a6a4a", 5); rr(g, x + 16, 60, 34, 90, "#9cc6ea", 3); rr(g, x + 58, 60, 34, 90, "#9cc6ea", 3); disc(g, x + 52, 170, 4, "#e8c45a"); }
    else { rr(g, x + 14, 44, 80, 132, "#27303d", 5); rr(g, x + 20, 50, 68, 120, "#8fb8d8", 0); g.fillStyle = "rgba(255,255,255,0.35)"; g.fillRect(x + 24, 54, 22, 112); g.fillStyle = "#fbfaf2"; g.fillRect(x + 52, 50, 4, 120); g.fillRect(x + 20, 108, 68, 4); rr(g, x + 8, 176, 92, 10, "#fbfaf2", 3); for (const sx of [0, 80]) rr(g, x + 2 + sx, 44, 14, 132, "#2f6a4a", 3); }
  }
  rr(g, 0, 0, 1024, 18, "#c9453a", 4); rr(g, 0, 236, 1024, 20, "#b9a680", 3);
});
/** red corrugated / tiled roof */
export const roofTex = () => ctex("kRoof", 256, 256, (g, r) => {
  g.fillStyle = "#c9453a"; g.fillRect(0, 0, 256, 256); for (let x = 0; x < 256; x += 16) { g.fillStyle = "rgba(90,20,20,0.35)"; g.fillRect(x, 0, 3, 256); g.fillStyle = "rgba(255,190,160,0.25)"; g.fillRect(x + 7, 0, 3, 256); }
  blot(g, r, 256, 256, 30, ["#a8362e", "#de6a52"], 10, 40, 0.3);
});
/** scoreboard face: black board in a white frame, two rows of lamps; the top row lacks its last few lamps (k = 1: lit to the end) */
export const scoreTex = (k = 0) => ctex("kScore" + k, 1024, 512, (g) => {
  rr(g, 0, 0, 1024, 512, "#fbfaf2", 0); rr(g, 22, 22, 980, 468, "#1c1a22", 6);
  const row = (y: number, n: number, lit: number, col: string) => { for (let i = 0; i < n; i++) { const x = 70 + i * (884 / (n - 1)); disc(g, x, y, 17, i < lit ? col : "#7a7590", 3); if (i < lit) { g.fillStyle = "rgba(255,255,255,0.5)"; g.beginPath(); g.arc(x - 5, y - 5, 5, 0, 6.3); g.fill(); } } };
  // two little caps mark whose row it is
  for (const [y, c] of [[150, "#1f2f5c"], [350, "#1f6b3a"]] as [number, string][]) { g.fillStyle = INKC; g.beginPath(); g.arc(88, y - 62, 30, Math.PI, 0); g.fill(); g.fillStyle = c; g.beginPath(); g.arc(88, y - 62, 25, Math.PI, 0); g.fill(); rr(g, 86, y - 68, 44, 8, c, 3, 3); }
  row(150, 22, k ? 22 : 19, "#ffd75a"); row(350, 22, 22, "#ffd75a");
  rr(g, 60, 235, 904, 6, "#fbfaf2");
});
/** liner hull: black plates, red boot-topping, two rows of portholes (u along 120 m) */
export const hullTex = () => ctex("kHull", 2048, 256, (g, r) => {
  g.fillStyle = "#23222c"; g.fillRect(0, 0, 2048, 256); g.fillStyle = "#b8362e"; g.fillRect(0, 214, 2048, 42); g.fillStyle = "#f7f5ee"; g.fillRect(0, 0, 2048, 22);
  for (let x = 0; x < 2048; x += 64) { g.fillStyle = "rgba(255,255,255,0.05)"; g.fillRect(x, 22, 2, 192); }
  for (const y of [64, 118]) for (let x = 30; x < 2048; x += 46) { disc(g, x, y, 8, "#e8c45a", 3); disc(g, x - 2, y - 2, 3, "#fff6d0"); }
  blot(g, r, 2048, 256, 60, ["#3a3844", "#15141a"], 20, 80, 0.25);
  for (let i = 0; i < 40; i++) { g.fillStyle = "rgba(160,70,40,0.25)"; g.fillRect(r() * 2048, 150 + r() * 60, 5, 20 + r() * 40); }
});
/** white superstructure with a row of square windows */
export const cabinTex = () => ctex("kCabin", 1024, 128, (g) => {
  g.fillStyle = "#f7f5ee"; g.fillRect(0, 0, 1024, 128); for (let x = 16; x < 1024; x += 44) { rr(g, x, 36, 26, 40, "#27303d", 3, 4); g.fillStyle = "#9cc6ea"; g.fillRect(x + 4, 40, 18, 32); }
  g.fillStyle = "#c9c4b6"; g.fillRect(0, 108, 1024, 6); g.fillStyle = "#8a5a34"; g.fillRect(0, 0, 1024, 10);
});
/** quay stones */
export const quayTex = () => ctex("kQuay", 512, 512, (g, r) => {
  g.fillStyle = "#a9a39a"; g.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 8; y++) for (let x = 0; x < 5; x++) { const ox = (y % 2) * 52; g.fillStyle = pick(r, ["#b3ada3", "#9f998f", "#a8a297", "#bdb7ac"]); g.fillRect(x * 104 + ox - 52, y * 64, 102, 62); }
  g.fillStyle = "rgba(60,54,48,0.5)"; for (let y = 0; y < 8; y++) g.fillRect(0, y * 64 + 62, 512, 3);
  blot(g, r, 512, 512, 60, ["#8f897f", "#c9c3b8"], 8, 40, 0.3);
});
/** railway carriage side: maroon below, cream above, a row of windows (u along 17 m) */
export const carriageTex = () => ctex("kCarriage", 1024, 160, (g) => {
  g.fillStyle = "#7a2630"; g.fillRect(0, 0, 1024, 160); g.fillStyle = "#f1e3c0"; g.fillRect(0, 22, 1024, 70); g.fillStyle = "#e8c45a"; g.fillRect(0, 92, 1024, 4); g.fillRect(0, 18, 1024, 4);
  for (let i = 0; i < 9; i++) { const x = 34 + i * 108; rr(g, x, 30, 76, 54, "#27303d", 4, 6); g.fillStyle = "#b9d6ea"; g.fillRect(x + 5, 35, 66, 44); g.fillStyle = "rgba(255,255,255,0.4)"; g.fillRect(x + 9, 38, 18, 38); g.fillStyle = "#c9a86a"; g.fillRect(x + 5, 35, 66, 8); }
  g.fillStyle = "#23202a"; g.fillRect(0, 146, 1024, 14);
});
/** station building: cream wall, brick base, arched doors and windows */
export const stationTex = () => ctex("kStation", 1024, 320, (g, r) => {
  g.fillStyle = "#efe2c2"; g.fillRect(0, 0, 1024, 320); blot(g, r, 1024, 320, 50, ["#e2d2ac", "#f9efd6"], 20, 70, 0.3);
  g.fillStyle = "#a8583e"; g.fillRect(0, 250, 1024, 70); for (let y = 250; y < 320; y += 14) for (let x = (y / 14) % 2 ? 0 : 20; x < 1024; x += 40) { g.fillStyle = "rgba(60,20,10,0.3)"; g.fillRect(x, y, 2, 14); g.fillRect(0, y, 1024, 2); }
  for (let i = 0; i < 6; i++) { const x = 40 + i * 166, door = i === 1 || i === 4; g.fillStyle = INKC; g.beginPath(); g.moveTo(x, door ? 320 : 230); g.lineTo(x, 110); g.arc(x + 50, 110, 50, Math.PI, 0); g.lineTo(x + 100, door ? 320 : 230); g.closePath(); g.fill();
    g.fillStyle = door ? "#3a6a4a" : "#8fb8d8"; g.beginPath(); g.moveTo(x + 7, door ? 320 : 223); g.lineTo(x + 7, 110); g.arc(x + 50, 110, 43, Math.PI, 0); g.lineTo(x + 93, door ? 320 : 223); g.closePath(); g.fill();
    g.fillStyle = "#fbfaf2"; g.fillRect(x + 47, 66, 6, door ? 254 : 157); if (!door) g.fillRect(x + 7, 150, 86, 6); }
  g.fillStyle = "#c9453a"; g.fillRect(0, 0, 1024, 20);
});
/** ballast with sleepers (u along the track) */
export const ballastTex = () => ctex("kBallast", 512, 256, (g, r) => {
  g.fillStyle = "#8a8378"; g.fillRect(0, 0, 512, 256); for (let i = 0; i < 2600; i++) { g.fillStyle = pick(r, ["#6f695f", "#a39c90", "#7d766b", "#b9b2a6"]); g.fillRect(r() * 512, r() * 256, 4, 4); }
  for (let x = 10; x < 512; x += 64) { rr(g, x, 46, 26, 164, "#5a4030", 3); g.fillStyle = "rgba(255,255,255,0.08)"; g.fillRect(x + 4, 50, 6, 156); }
});
/** clock face without numerals: ticks only */
export const clockTex = () => ctex("kClock", 256, 256, (g) => {
  g.clearRect(0, 0, 256, 256); disc(g, 128, 128, 122, "#3a3438"); disc(g, 128, 128, 108, "#fffdf2");
  g.strokeStyle = INKC; g.lineCap = "round"; for (let i = 0; i < 12; i++) { const a = (i / 12) * 6.283, l = i % 3 === 0 ? 24 : 12; g.lineWidth = i % 3 === 0 ? 9 : 5; g.beginPath(); g.moveTo(128 + 98 * Math.sin(a), 128 - 98 * Math.cos(a)); g.lineTo(128 + (98 - l) * Math.sin(a), 128 - (98 - l) * Math.cos(a)); g.stroke(); }
});
/** corrugated shed wall with big doors */
export const shedTex = () => ctex("kShed", 1024, 256, (g, r) => {
  g.fillStyle = "#8f9aa8"; g.fillRect(0, 0, 1024, 256); for (let x = 0; x < 1024; x += 14) { g.fillStyle = "rgba(30,40,60,0.25)"; g.fillRect(x, 0, 3, 256); }
  for (let i = 0; i < 4; i++) { const x = 60 + i * 250; rr(g, x, 70, 150, 186, "#6a4a34", 5); g.fillStyle = "rgba(0,0,0,0.25)"; g.fillRect(x + 73, 70, 4, 186); }
  blot(g, r, 1024, 256, 50, ["#a8583e", "#6f7a88"], 10, 50, 0.25); g.fillStyle = "#5a6470"; g.fillRect(0, 0, 1024, 16);
});
/** teak deck planks */
export const deckTex = () => ctex("kDeck", 256, 256, (g, r) => {
  g.fillStyle = "#c9a26a"; g.fillRect(0, 0, 256, 256); for (let y = 0; y < 256; y += 16) { g.fillStyle = "rgba(70,40,20,0.4)"; g.fillRect(0, y, 256, 2); }
  blot(g, r, 256, 256, 30, ["#b98f58", "#d9b47c"], 8, 30, 0.3);
});
/** white table cloth with a blue check border */
export const clothTex = () => ctex("kCloth", 256, 256, (g) => {
  g.fillStyle = "#fbfaf2"; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 8; i++) { g.fillStyle = "rgba(63,143,201,0.35)"; g.fillRect(i * 32, 0, 12, 256); g.fillRect(0, i * 32, 256, 12); }
});
