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
  for (let i = 0; i < 46; i++) { const x = r() * 512, y = r() * 512; g.fillStyle = "rgba(40,110,36,0.5)"; for (let b = -2; b <= 2; b++) g.fillRect(x + b * 2.2, y - 5 + Math.abs(b) * 1.5, 1.6, 8 - Math.abs(b) * 1.5); }
  for (let i = 0; i < 34; i++) { const x = r() * 512, y = r() * 512; g.fillStyle = "rgba(255,255,255,0.9)"; g.beginPath(); g.arc(x, y, 2.3, 0, 6.3); g.fill(); g.fillStyle = "#f6c419"; g.beginPath(); g.arc(x, y, 0.9, 0, 6.3); g.fill(); }
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
/** a summer crowd, row after row (tile = 20 m across, 16 rows up the stand): k = 0 the 1930s (boaters, cloche hats, light suits,
 *  pastel dresses, parasols), k = 1 today (caps, bright shirts, little flags). An aisle of steps every 10 m. */
export const crowd39Tex = (k = 0) => ctex("kCrowd" + k, 2048, 1024, (g, r) => {
  const now = k === 1 || k === 3, empty = k === 2, old = k === 4;
  const rows = 16, rh = 1024 / rows, pw = 62;
  const coats = k === 3 ? ["#fbfaf2", "#f7f5ee", "#fbfaf2", "#eef0f6", "#fbfaf2", "#1f2f5c", "#f7f5ee", "#e8c45a", "#fbfaf2", "#6a4c9a"] : old ? ["#2c2a38", "#3a3438", "#4a4250", "#5a4c40", "#23202a", "#6a5a4a", "#f4efe2", "#7a2630", "#3a4660", "#d8c7a6", "#2f4a3a", "#e7b3ae"] : now ? ["#e2453c", "#3f8fc9", "#f6c419", "#57a05a", "#f25c7a", "#f29a2e", "#7a5a9a", "#2fb0a0", "#f7f5ee"] : ["#f4efe2", "#e9dcc6", "#d8c7a6", "#f7f5ee", "#a9bfd6", "#e7b3ae", "#8f9fb2", "#bcd2a4", "#5f6a7a", "#f0d2a0", "#c98b86", "#fbf3d0", "#7c8f6e", "#d0463c", "#3f6fb0", "#e8b83a", "#4f9a6a", "#f7f5ee", "#fbfaf2"];
  const hats = k === 3 ? ["#fbfaf2", "#1f2f5c", "#f7f5ee", "#e8c45a"] : old ? ["#23202a", "#23202a", "#f0dfa6", "#3a3438", "#f7f3e6", "#6a5a4a", "#23202a"] : now ? ["#e2453c", "#3f8fc9", "#f6c419", "#f7f5ee", "#57a05a"] : ["#f0dfa6", "#f7f3e6", "#6a5a4a", "#e9d9a8", "#d9c9a0", "#3a3438", "#f4c9c4", "#cfe0f0"];
  const bands = ["#7a2630", "#1f2f5c", "#1f6b3a", "#23202a", "#b8362e"];
  const skins = ["#fde3cc", "#f1c9a2", "#e2b088", "#fff0e0", "#c99067", "#8f5d3e"];
  const sun = now ? ["#e2453c", "#3f8fc9", "#f6c419", "#f7f5ee"] : ["#f6d7d2", "#fbf3c4", "#f7f5ee", "#cfe6f4", "#e9c9e6", "#d7ecc4"];
  for (let y = 0; y < rows; y++) {
    const y0 = y * rh;
    g.fillStyle = y % 2 ? "#6b5a4b" : "#76634f"; g.fillRect(0, y0, 2048, rh); g.fillStyle = "#4a3d33"; g.fillRect(0, y0 + rh * 0.88, 2048, rh * 0.12);
    for (let i = 0; i < 2048 / pw; i++) {
      const x = i * pw + (y % 2 ? pw / 2 : 0), cx = x + pw / 2 + (r() - 0.5) * 8;
      if (Math.abs(((cx + 1024) % 1024) - 512) < 44) continue;               // the aisle
      if (r() < (empty ? 0.955 : 0.05)) { if (empty) { g.fillStyle = "#a98a62"; g.fillRect(x + 3, y0 + rh * 0.62, pw - 6, 7); g.fillStyle = "#8f7350"; g.fillRect(x + 3, y0 + rh * 0.3, pw - 6, 6); } continue; } // an empty seat now and then (k = 2: nearly all)
      const c = pick(r, coats), by = y0 + rh * 0.9, hy = by - rh * 0.52, lady = r() < 0.34, up = r() < (now ? 0.16 : 0.07);
      // shoulders
      g.fillStyle = INKC; g.beginPath(); g.ellipse(cx, by - rh * 0.12, 25, rh * 0.3, 0, 0, 6.3); g.fill(); g.fillStyle = c; g.beginPath(); g.ellipse(cx, by - rh * 0.12, 22, rh * 0.27, 0, 0, 6.3); g.fill();
      if (!lady && !now && r() < 0.6) { g.fillStyle = "#fbfaf2"; g.beginPath(); g.moveTo(cx - 6, by - rh * 0.3); g.lineTo(cx + 6, by - rh * 0.3); g.lineTo(cx, by - rh * 0.1); g.fill(); g.fillStyle = pick(r, bands); g.fillRect(cx - 2, by - rh * 0.28, 4, rh * 0.2); }
      if (up) { g.strokeStyle = INKC; g.lineWidth = 9; g.lineCap = "round"; g.beginPath(); g.moveTo(cx + 18, by - rh * 0.3); g.lineTo(cx + 27, hy - 20); g.stroke(); g.strokeStyle = c; g.lineWidth = 5; g.stroke();
        if (now) { rr(g, cx + 26, hy - 40, 20, 14, pick(r, sun), 2); } else disc(g, cx + 28, hy - 24, 6, "#fbfaf2", 2); }
      // head
      disc(g, cx, hy, 16, INKC); disc(g, cx, hy, 13.5, pick(r, skins));
      const t = r();
      if (empty || (lady && t < 0.32 && !now)) { // a parasol over her
        const pc = pick(r, sun); g.fillStyle = INKC; g.beginPath(); g.ellipse(cx, hy - 20, 36, 19, 0, Math.PI, 0); g.fill(); g.fillStyle = pc; g.beginPath(); g.ellipse(cx, hy - 20, 33, 16, 0, Math.PI, 0); g.fill();
        g.strokeStyle = "rgba(60,30,40,0.35)"; g.lineWidth = 2; for (const dx of [-17, 0, 17]) { g.beginPath(); g.moveTo(cx, hy - 36); g.lineTo(cx + dx, hy - 20); g.stroke(); }
      } else if (lady) { // cloche or a wide summer hat, hair showing
        g.fillStyle = pick(r, ["#5a3b22", "#2a1d16", "#c9a24a", "#8a5a34", "#b9772e"]); g.beginPath(); g.arc(cx, hy + 1, 15, Math.PI * 0.9, Math.PI * 0.1); g.fill();
        if (t < 0.75) { const hc = pick(r, hats); g.fillStyle = INKC; g.beginPath(); g.ellipse(cx, hy - 7, t < 0.5 ? 27 : 19, 8, 0, 0, 6.3); g.fill(); g.fillStyle = hc; g.beginPath(); g.ellipse(cx, hy - 7, t < 0.5 ? 24 : 16, 6, 0, 0, 6.3); g.fill(); g.fillStyle = INKC; g.beginPath(); g.arc(cx, hy - 8, 14, Math.PI, 0); g.fill(); g.fillStyle = hc; g.beginPath(); g.arc(cx, hy - 8, 11.5, Math.PI, 0); g.fill(); disc(g, cx + 8, hy - 11, 3.5, pick(r, ["#e2453c", "#f6c419", "#f25c7a"])); }
      } else if (t < (now ? 0.5 : 0.82)) { // boater / panama / cap
        const hc = pick(r, hats);
        if (now || t < 0.14) { g.fillStyle = INKC; g.beginPath(); g.arc(cx, hy - 5, 16, Math.PI, 0); g.fill(); g.fillStyle = hc; g.beginPath(); g.arc(cx, hy - 5, 13.5, Math.PI, 0); g.fill(); rr(g, cx - 2, hy - 9, 22, 6, hc, 2, 3); }
        else { g.fillStyle = INKC; g.beginPath(); g.ellipse(cx, hy - 8, 25, 7, 0, 0, 6.3); g.fill(); g.fillStyle = hc; g.beginPath(); g.ellipse(cx, hy - 8, 22.5, 5, 0, 0, 6.3); g.fill(); rr(g, cx - 13, hy - 23, 26, 15, INKC, 0, 5); rr(g, cx - 10.5, hy - 21, 21, 12, hc, 0, 4); g.fillStyle = pick(r, bands); g.fillRect(cx - 10.5, hy - 13, 21, 4); }
      } else { g.fillStyle = pick(r, ["#5a3b22", "#2a1d16", "#c9a24a", "#8a7f86", "#e9e6ee"]); g.beginPath(); g.arc(cx, hy - 3, 13.5, Math.PI, 0); g.fill(); }
    }
    // the aisle: steps and a hand rail
    for (const ax of [512, 1536]) { g.fillStyle = y % 2 ? "#cdbf9f" : "#b9aa88"; g.fillRect(ax - 34, y0, 68, rh); g.fillStyle = "rgba(60,40,30,0.4)"; g.fillRect(ax - 34, y0 + rh - 5, 68, 5); g.fillStyle = "#fbfaf2"; g.fillRect(ax - 3, y0, 6, rh); }
  }
});
/** bunting: a string of little pennants (alpha between them) */
export const buntingTex = () => ctex("kBunting", 512, 64, (g) => {
  g.clearRect(0, 0, 512, 64); const cols = ["#e2453c", "#fbfaf2", "#3f8fc9", "#f6c419", "#57a05a", "#fbfaf2", "#f29a2e", "#1f2f5c"];
  g.fillStyle = "#3a3438"; g.fillRect(0, 2, 512, 5);
  for (let i = 0; i < 8; i++) poly(g, [[i * 64 + 6, 6], [i * 64 + 58, 6], [i * 64 + 32, 60]], cols[i], 4);
});
/** a street front of the town: plastered walls, shuttered windows, a balcony, shop awnings on the ground floor (k = colour) */
export const townTex = (k: number) => ctex("kTown" + k, 768, 512, (g, r) => {
  const wallc = ["#f1e3c0", "#e7c9b0", "#dfe6ea", "#f4eeda", "#d9c7a0", "#e9b9a0"][k % 6], trim = ["#fbfaf2", "#fbfaf2", "#8f9fb2", "#c9453a", "#fbfaf2", "#fbfaf2"][k % 6], shut = ["#2f6a4a", "#3b5b9a", "#7a2630", "#2f6a4a", "#5a4c40", "#3b5b9a"][k % 6];
  g.fillStyle = wallc; g.fillRect(0, 0, 768, 512); blot(g, r, 768, 512, 60, ["#ffffff", "#c9b28a"], 20, 80, 0.16);
  const floors = 4, fh = 512 / floors;
  for (let fl = 0; fl < floors; fl++) { const y = fl * fh;
    rr(g, 0, y + fh - 10, 768, 10, trim, 3);
    for (let i = 0; i < 6; i++) { const x = 20 + i * 126;
      if (fl === floors - 1) { // shops: door or window under an awning
        rr(g, x + 10, y + 34, 96, fh - 44, i % 3 === 1 ? "#5a3320" : "#27303d", 4); if (i % 3 !== 1) { g.fillStyle = "#9cc6ea"; g.fillRect(x + 16, y + 40, 84, fh - 60); g.fillStyle = "rgba(255,255,255,0.35)"; g.fillRect(x + 20, y + 44, 22, fh - 68); }
        const ac = [["#e2453c", "#fbfaf2"], ["#3f8fc9", "#fbfaf2"], ["#57a05a", "#fbf3c4"]][(i + k) % 3]; for (let s = 0; s < 8; s++) { g.fillStyle = ac[s % 2]; g.fillRect(x + 2 + s * 14, y + 14, 14, 24); } rr(g, x + 2, y + 14, 112, 24, null, 3);
      } else { // arched window with shutters, sometimes a balcony rail
        g.fillStyle = INKC; g.beginPath(); g.moveTo(x + 22, y + fh - 26); g.lineTo(x + 22, y + 44); g.arc(x + 58, y + 44, 36, Math.PI, 0); g.lineTo(x + 94, y + fh - 26); g.closePath(); g.fill();
        g.fillStyle = r() < 0.25 ? "#ffe9a0" : "#8fb8d8"; g.beginPath(); g.moveTo(x + 27, y + fh - 30); g.lineTo(x + 27, y + 44); g.arc(x + 58, y + 44, 31, Math.PI, 0); g.lineTo(x + 89, y + fh - 30); g.closePath(); g.fill();
        g.fillStyle = trim; g.fillRect(x + 56, y + 14, 4, fh - 44); g.fillRect(x + 27, y + 62, 62, 4);
        for (const sx of [2, 96]) rr(g, x + sx, y + 30, 20, fh - 56, shut, 3);
        if ((i + fl) % 3 === 0) { rr(g, x + 4, y + fh - 40, 110, 6, "#2c2a38", 0); for (let b = 0; b < 9; b++) g.fillRect(x + 6 + b * 13, y + fh - 40, 3, 26); rr(g, x, y + fh - 16, 118, 7, "#2c2a38", 0); }
      }
    }
  }
  rr(g, 0, 0, 768, 16, trim, 4);
});
/** the square: the strips either side of the match pitch, cut shorter and paler, old pitches showing (20 x 26 m) */
export const squareTex = () => ctex("kSquare", 512, 640, (g, r) => {
  for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? "#86c860" : "#79bd55"; g.fillRect(i * 64, 0, 64, 640); }
  blot(g, r, 512, 640, 80, ["#93d06a", "#6fb24e", "#a4d67a"], 8, 34, 0.3);
  for (const x of [96, 416]) { g.globalAlpha = 0.5; g.fillStyle = "#c9c684"; g.fillRect(x - 36, 40, 72, 560); g.globalAlpha = 1; g.fillStyle = "rgba(251,250,242,0.55)"; for (const y of [84, 556]) g.fillRect(x - 30, y, 60, 3); }
  for (let i = 0; i < 900; i++) { g.fillStyle = r() < 0.5 ? "rgba(40,100,30,0.2)" : "rgba(220,250,170,0.3)"; g.fillRect(r() * 512, r() * 640, 2, 6); }
});
/** a marquee roof: broad stripes */
export const tentTex = (c: string) => ctex("kTent" + c, 256, 64, (g) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? "#fbfaf2" : c; g.fillRect(i * 32, 0, 32, 64); } g.fillStyle = "rgba(0,0,0,0.08)"; g.fillRect(0, 44, 256, 20); });
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
