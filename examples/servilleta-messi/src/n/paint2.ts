// Painted surfaces for "The Hair": Naples café, alley, plane cabin. Flat colour fields + ink lines + painterly mottle.
import { rc, el, ln, pg, mottle, vgrad, INKC } from "./kit";
type G = CanvasRenderingContext2D;
type Painter = { w: number; h: number; draw: (g: G, r: () => number) => void };
export const SKYB = "#62b5e5";
const hs = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };

const plaster = (g: G, r: () => number, x: number, y: number, w: number, h: number, col: string, lite: string, dark: string, s = 1) => {
  g.fillStyle = col; g.fillRect(x, y, w, h);
  mottle(g, r, x, y, w, h, Math.round((w * h) / 9000 / s), [lite, dark, lite], 30 * s, 130 * s, 0.22);
  mottle(g, r, x, y, w, h, Math.round((w * h) / 30000 / s), [dark], 8 * s, 26 * s, 0.2);
};
const bottle = (g: G, x: number, yb: number, w: number, h: number, col: string, kind: number, label: string) => {
  const nk = w * (kind === 1 ? 0.3 : 0.36), sh = h * (kind === 2 ? 0.42 : 0.6);
  g.beginPath(); g.moveTo(x - w / 2, yb); g.lineTo(x - w / 2, yb - sh);
  g.quadraticCurveTo(x - w / 2, yb - sh - h * 0.14, x - nk / 2, yb - sh - h * 0.2); g.lineTo(x - nk / 2, yb - h); g.lineTo(x + nk / 2, yb - h); g.lineTo(x + nk / 2, yb - sh - h * 0.2);
  g.quadraticCurveTo(x + w / 2, yb - sh - h * 0.14, x + w / 2, yb - sh); g.lineTo(x + w / 2, yb); g.closePath();
  g.fillStyle = col; g.fill(); g.lineWidth = 4; g.strokeStyle = INKC; g.lineJoin = "round"; g.stroke();
  rc(g, x - nk / 2 - 2, yb - h - 8, nk + 4, 12, "#d9b24a", 3, 2);
  rc(g, x - w / 2 + 4, yb - sh * 0.75, w - 8, sh * 0.45, label, 2.5, 2);
  ln(g, [[x - w * 0.28, yb - sh * 0.95], [x - w * 0.28, yb - sh - h * 0.05]], 4, "rgba(255,255,255,0.5)");
};
const frame = (g: G, x: number, y: number, w: number, h: number, kind: number, gold = "#d9a53a") => {
  g.fillStyle = "rgba(30,15,40,0.22)"; g.fillRect(x + 8, y + 10, w, h);
  rc(g, x, y, w, h, gold, 4, 3); rc(g, x + w * 0.12, y + h * 0.12, w * 0.76, h * 0.76, kind === 1 ? "#bfe3f5" : kind === 2 ? "#f6ead0" : "#cfe8c8", 3);
  const cx = x + w / 2, cy = y + h / 2, s = Math.min(w, h) * 0.2;
  if (kind === 0) { el(g, cx, cy, s, s, "#fbfbf6", 3); pg(g, [[cx - s * 0.4, cy - s * 0.3], [cx + s * 0.4, cy - s * 0.3], [cx + s * 0.5, cy + s * 0.3], [cx, cy + s * 0.6], [cx - s * 0.5, cy + s * 0.3]], INKC, 0); }
  if (kind === 1) { pg(g, [[cx - s * 1.6, cy + s], [cx - s * 0.5, cy - s * 0.8], [cx - s * 0.1, cy - s * 0.4], [cx + s * 0.4, cy - s], [cx + s * 1.6, cy + s]], "#6a6aa8", 3); g.fillStyle = "#2f7fc0"; g.fillRect(x + w * 0.13, cy + s, w * 0.74, h * 0.37 - s); }
  if (kind === 2) { rc(g, cx - s * 0.7, cy - s * 0.4, s * 1.4, s, "#fffdf6", 3, 3); el(g, cx + s * 0.9, cy, s * 0.35, s * 0.35, null, 3); el(g, cx, cy + s * 0.75, s * 1.2, s * 0.25, "#fffdf6", 3); }
};
const boards = (g: G, x: number, y: number, w: number, h: number, col: string, step: number, r: () => number) => {
  g.fillStyle = col; g.fillRect(x, y, w, h);
  mottle(g, r, x, y, w, h, Math.round(w * h / 12000), ["#ffffff", "#000000"], 20, 90, 0.07);
  for (let bx = x; bx < x + w; bx += step) ln(g, [[bx, y + 4], [bx, y + h - 4]], 3.5, "rgba(20,10,30,0.55)");
};

// a two-handled club cup on a wooden plinth
const cupT = (g: G, x: number, yb: number, sc: number, col: string) => {
  rc(g, x - 26 * sc, yb - 30 * sc, 52 * sc, 30 * sc, "#3e2416", 3, 3);
  for (const s2 of [-1, 1]) { g.beginPath(); g.ellipse(x + s2 * 34 * sc, yb - 98 * sc, 13 * sc, 19 * sc, 0, 0, 6.3); g.lineWidth = 13 * sc; g.strokeStyle = INKC; g.stroke(); g.lineWidth = 6 * sc; g.strokeStyle = col; g.stroke(); }
  pg(g, [[x - 9 * sc, yb - 30 * sc], [x + 9 * sc, yb - 30 * sc], [x + 5 * sc, yb - 56 * sc], [x - 5 * sc, yb - 56 * sc]], col, 3);
  pg(g, [[x - 34 * sc, yb - 124 * sc], [x + 34 * sc, yb - 124 * sc], [x + 27 * sc, yb - 84 * sc], [x + 9 * sc, yb - 58 * sc], [x - 9 * sc, yb - 58 * sc], [x - 27 * sc, yb - 84 * sc]], col, 3.5);
  ln(g, [[x - 20 * sc, yb - 116 * sc], [x - 13 * sc, yb - 80 * sc]], 5 * sc, "rgba(255,255,255,0.65)");
};
// clear tube of three tennis balls
const tubeT = (g: G, x: number, yb: number) => {
  rc(g, x - 22, yb - 150, 44, 150, "#e3f0ee", 3.5, 8);
  for (let i = 0; i < 3; i++) { el(g, x, yb - 25 - i * 46, 19, 19, "#d6e84a", 3); g.strokeStyle = "rgba(255,255,255,0.85)"; g.lineWidth = 3; g.beginPath(); g.arc(x - 26, yb - 25 - i * 46, 24, -0.6, 0.6); g.stroke(); }
  rc(g, x - 25, yb - 166, 50, 20, "#2f7a5a", 3, 5);
};
const cafeBackDraw = (g: G, r: () => number, niche: boolean) => {
    const M = 400, Y = (m: number) => (3.3 - m) * M;
    // tennis-club bar: sage walls, walnut panelling, a clay-red rail
    plaster(g, r, 0, 0, 2800, 1320, "#9cc29a", "#bcd9b4", "#78a27c");
    g.fillStyle = vgrad(g, 0, 400, "rgba(30,60,40,0.22)", "rgba(30,60,40,0)"); g.fillRect(0, 0, 2800, 400);
    boards(g, 0, Y(1.05), 2800, 1.05 * M, "#6a3c22", 72, r);
    rc(g, -10, Y(1.12), 2820, 34, "#d9773e", 4); rc(g, -10, Y(0.14), 2820, 0.14 * M + 10, "#3e2416", 4);
    for (let x = 60; x < 2800; x += 360) rc(g, x, Y(0.92), 240, 250, null, 3, 6);
    // the club's trophy cabinet behind the bar
    const sx = 0.2 * M, sw = 2.9 * M, sy = Y(2.8), shh = 1.62 * M;
    g.fillStyle = "rgba(30,15,40,0.25)"; g.fillRect(sx + 16, sy + 18, sw, shh);
    rc(g, sx, sy, sw, shh, "#4a2a18", 5, 6); rc(g, sx + 22, sy + 22, sw - 44, shh - 44, "#f1e2c0", 4);
    mottle(g, r, sx + 22, sy + 22, sw - 44, shh - 44, 40, ["#fff6dc", "#d6c29a"], 30, 120, 0.3);
    const metals = ["#f2c64a", "#e9b93c", "#cfd6de", "#d9a05a"];
    for (let s = 0; s < 3; s++) {
      const yb = sy + 22 + (s + 1) * ((shh - 44) / 3) - 16;
      let x = sx + 70, k = s;
      while (x < sx + sw - 90) {
        const t = (k + Math.floor(r() * 2)) % 5; k++;
        if (t === 0 || t === 3) { const sc = 0.95 + r() * 0.45; cupT(g, x + 40 * sc, yb, sc, metals[Math.floor(r() * metals.length)]); x += 92 * sc + 24; }
        else if (t === 1) { tubeT(g, x + 24, yb); tubeT(g, x + 74, yb); x += 120; }
        else if (t === 2) { frame(g, x, yb - 150, 120, 150, Math.floor(r() * 3), "#4a2a18"); x += 140; }
        else { for (let i = 0; i < 3; i++) el(g, x + 22 + i * 40, yb - 20, 20, 20, "#d6e84a", 3); for (let i = 0; i < 2; i++) el(g, x + 42 + i * 40, yb - 56, 20, 20, "#d6e84a", 3); el(g, x + 62, yb - 92, 20, 20, "#d6e84a", 3); x += 150; }
      }
      rc(g, sx + 10, yb, sw - 20, 20, "#6a3c22", 4);
    }
    // glass doors: two mullions and glints
    for (const fx of [sx + sw / 3, sx + (2 * sw) / 3]) rc(g, fx - 8, sy + 10, 16, shh - 20, "#4a2a18", 3);
    g.strokeStyle = "rgba(255,255,255,0.35)"; g.lineWidth = 14; for (let i = 0; i < 6; i++) { const x0 = sx + 80 + i * 190; g.beginPath(); g.moveTo(x0, sy + shh - 40); g.lineTo(x0 + 120, sy + 40); g.stroke(); }
    rc(g, sx - 16, sy - 30, sw + 32, 40, "#6a3c22", 5, 4);
    // pennant string above the shelves
    const py = Y(3.05);
    ln(g, [[40, py], [sx + sw + 60, py + 26]], 3);
    for (let i = 0; i < 14; i++) { const x = 70 + i * 86, y = py + i * 1.9; pg(g, [[x, y], [x + 62, y + 1.5], [x + 31, y + 78]], i % 2 ? "#fbfbf6" : "#d9773e", 3.5); }
    // clock
    const cx = 3.62 * M, cy = Y(2.62);
    g.fillStyle = "rgba(30,15,40,0.22)"; g.beginPath(); g.arc(cx + 8, cy + 10, 92, 0, 6.3); g.fill();
    el(g, cx, cy, 92, 92, "#2f7a5a", 5); el(g, cx, cy, 74, 74, "#fbfbf6", 4);
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; ln(g, [[cx + 58 * Math.cos(a), cy + 58 * Math.sin(a)], [cx + 68 * Math.cos(a), cy + 68 * Math.sin(a)]], i % 3 ? 3 : 5); }
    ln(g, [[cx, cy], [cx + 28, cy - 34]], 6); ln(g, [[cx, cy], [cx - 8, cy - 56]], 4); el(g, cx, cy, 6, 6, INKC, 0);
    if (niche) {
    // years later: the right half of the wall is covered with framed paper napkins
    for (let j = 0; j < 5; j++) for (let i = 0; i < 8; i++) {
      const x = 3.72 * M + i * 0.4 * M + (j % 2) * 18 + (hs(i, j) - 0.5) * 16, y = Y(3.05) + j * 0.39 * M + (hs(j, i) - 0.5) * 14, w = 120 + hs(i * 3, j) * 26, h = 112 + hs(i, j * 5) * 22;
      if (y + h > Y(1.12) - 10) continue;
      g.fillStyle = "rgba(30,15,40,0.22)"; g.fillRect(x + 7, y + 9, w, h);
      rc(g, x, y, w, h, (i + j) % 3 ? "#d9a53a" : "#8f5230", 4, 3);
      const nx = x + 14, ny = y + 14, nw = w - 28, nh = h - 28; rc(g, nx, ny, nw, nh, "#fffdf8", 3, 2);
      for (let k = 0; k < 4; k++) { const yy = ny + 14 + k * (nh - 24) / 4; ln(g, [[nx + 8, yy], [nx + 8 + (nw - 16) * (0.5 + 0.5 * hs(i + k, j)), yy + 3]], 2.5, ["#1f3f9a", "#241726", "#a5003c"][(i + j + k) % 3]); }
    }
    } else {
    // an old painting of the club's clay court where the napkin frames will go
    { const x = 4.45 * M, y = Y(2.55), w = 440, h = 330; g.fillStyle = "rgba(30,15,40,0.22)"; g.fillRect(x + 10, y + 12, w, h); rc(g, x, y, w, h, "#8f5230", 5, 4); rc(g, x + 34, y + 34, w - 68, h - 68, "#bfe3f5", 4);
      pg(g, [[x + 36, y + 300], [x + 404, y + 300], [x + 350, y + 150], [x + 90, y + 150]], "#d9773e", 4);
      ln(g, [[x + 70, y + 290], [x + 108, y + 160]], 3, "#ffffff"); ln(g, [[x + 370, y + 290], [x + 332, y + 160]], 3, "#ffffff"); ln(g, [[x + 96, y + 196], [x + 344, y + 196]], 3, "#ffffff");
      rc(g, x + 60, y + 214, 320, 26, "rgba(40,40,60,0.55)", 3); ln(g, [[x + 60, y + 214], [x + 380, y + 214]], 4, "#ffffff");
      el(g, x + 330, y + 90, 26, 26, "#fff3b0", 3); for (const d of [0, 1, 2]) el(g, x + 120 + d * 60, y + 120, 34, 18, "#3f8a4a", 3); }
    // crossed rackets
    for (const s2 of [-1, 1]) { const cx2 = 6.62 * M + s2 * 40, cy2 = Y(2.0); g.save(); g.translate(cx2, cy2); g.rotate(s2 * 0.5); el(g, 0, -70, 46, 62, "#f4f1ea", 5); for (let k = -2; k <= 2; k++) { ln(g, [[k * 16, -126], [k * 16, -14]], 1.5, "#b9b6bd"); ln(g, [[-40, -70 + k * 20], [40, -70 + k * 20]], 1.5, "#b9b6bd"); } rc(g, -8, -10, 16, 110, "#c9373a", 4, 4); g.restore(); }
    }
    // pictures around
    if (!niche) { frame(g, 4.0 * M, Y(2.55), 150, 190, 0); frame(g, 6.0 * M, Y(2.7), 210, 160, 1); frame(g, 4.02 * M, Y(1.85), 130, 130, 2, "#8f5230"); }
    rc(g, 6.55 * M, Y(1.5), 44, 64, "#f6ecd2", 3.5, 4); el(g, 6.55 * M + 22, Y(1.5) + 32, 7, 7, "#8f5230", 2.5);
    ln(g, [[1400, 40], [1430, 130], [1412, 190], [1452, 260]], 2.5, "rgba(90,40,20,0.5)"); ln(g, [[2600, 60], [2580, 150], [2610, 220]], 2.5, "rgba(90,40,20,0.5)");
  };

export const PAINT: Record<string, Painter> = {
  // auction house wall: 10 m x 4.5 m, 220 px/m: deep red damask, wainscot, gilt frames with landscapes
  auctionWall: { w: 2200, h: 990, draw: (g, r) => {
    const M = 220, Y = (m: number) => (4.5 - m) * M;
    g.fillStyle = "#8f2a34"; g.fillRect(0, 0, 2200, 990); mottle(g, r, 0, 0, 2200, 990, 160, ["#a8343f", "#6e1d27"], 30, 120, 0.25);
    for (let y = 30; y < Y(1.0); y += 90) for (let x = 30 + ((y / 90) % 2) * 45; x < 2200; x += 90) { pg(g, [[x, y - 16], [x + 10, y], [x, y + 16], [x - 10, y]], "rgba(255,210,150,0.13)", 0); }
    boards(g, 0, Y(1.0), 2200, 1.0 * M, "#4a2a1c", 110, r); rc(g, -10, Y(1.06), 2220, 22, "#d9a53a", 4); rc(g, -10, Y(0.12), 2220, 40, "#2a1a14", 4);
    for (let x = 60; x < 2200; x += 240) rc(g, x, Y(0.86), 160, 130, null, 3, 6);
    const land = (x: number, y: number, w: number, h: number, k: number) => {
      g.fillStyle = "rgba(20,10,20,0.3)"; g.fillRect(x + 10, y + 12, w, h); rc(g, x, y, w, h, "#d9a53a", 5, 3); rc(g, x + 22, y + 22, w - 44, h - 44, ["#bfe3f5", "#f6d6a0", "#cfe8c8"][k], 4);
      pg(g, [[x + 24, y + h - 24], [x + 24, y + h * 0.62], [x + w * 0.35, y + h * 0.4], [x + w * 0.6, y + h * 0.58], [x + w - 24, y + h * 0.45], [x + w - 24, y + h - 24]], ["#6a8a5a", "#a8743e", "#5a7aa8"][k], 3);
      el(g, x + w * 0.72, y + h * 0.3, 18, 18, "#fff3b0", 3);
    };
    land(140, Y(3.9), 420, 300, 0); land(700, Y(4.1), 260, 360, 1); land(1240, Y(4.1), 260, 360, 2); land(1640, Y(3.9), 420, 300, 1);
  } },
  parquet: { w: 512, h: 512, draw: (g, r) => {
    for (let y = 0; y < 8; y++) for (let x = 0; x < 4; x++) { const c = ["#8a5a34", "#7a4b2a", "#946640", "#6e4226"][Math.floor(r() * 4)]; g.fillStyle = c; g.fillRect(x * 128 + (y % 2) * 64, y * 64, 128, 64); g.fillRect(x * 128 + (y % 2) * 64 - 512, y * 64, 128, 64); }
    mottle(g, r, 0, 0, 512, 512, 30, ["#b07a4a", "#4a2a18"], 20, 80, 0.15);
    for (let y = 0; y <= 8; y++) ln(g, [[0, y * 64], [512, y * 64]], 3, "rgba(36,23,38,0.6)");
    for (let y = 0; y < 8; y++) for (let x = 0; x <= 4; x++) ln(g, [[x * 128 + (y % 2) * 64, y * 64], [x * 128 + (y % 2) * 64, y * 64 + 64]], 3, "rgba(36,23,38,0.6)");
  } },
  velvet: { w: 512, h: 512, draw: (g, r) => {
    g.fillStyle = "#6e1d27"; g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 8; i++) { const x = i * 64; const gr = g.createLinearGradient(x, 0, x + 64, 0); gr.addColorStop(0, "rgba(20,5,10,0.45)"); gr.addColorStop(0.5, "rgba(255,180,170,0.12)"); gr.addColorStop(1, "rgba(20,5,10,0.45)"); g.fillStyle = gr; g.fillRect(x, 0, 64, 512); }
    mottle(g, r, 0, 0, 512, 512, 20, ["#8f2a34"], 20, 80, 0.2);
  } },
  // café back wall: 7 m x 3.3 m, 400 px/m. Bottle shelves on the left (behind the bar), shrine niche on the right.
  cafeBack: { w: 2800, h: 1320, draw: (g, r) => cafeBackDraw(g, r, true) },
  cafeBack0: { w: 2800, h: 1320, draw: (g, r) => cafeBackDraw(g, r, false) },
  sign: { w: 512, h: 512, draw: (g) => {
    el(g, 256, 256, 250, 250, "#2f7a5a", 0); el(g, 256, 256, 212, 212, "#fbf3e2", 10); el(g, 256, 256, 244, 244, null, 12);
    rc(g, 150, 190, 180, 130, "#fffdf6", 12, 18); el(g, 350, 250, 34, 40, null, 12); el(g, 256, 350, 150, 26, "#fffdf6", 12); el(g, 240, 196, 80, 16, "#5a3018", 8);
    for (const d of [-36, 0, 36]) ln(g, [[240 + d, 160], [252 + d, 130], [236 + d, 100]], 10, "#8a8090");
  } },
  // café side wall: 5.2 m x 3.3 m, 300 px/m
  cafeSide: { w: 1560, h: 990, draw: (g, r) => {
    const M = 300, Y = (m: number) => (3.3 - m) * M;
    plaster(g, r, 0, 0, 1560, 990, "#9cc29a", "#bcd9b4", "#78a27c", 0.75);
    g.fillStyle = vgrad(g, 0, 300, "rgba(30,60,40,0.22)", "rgba(30,60,40,0)"); g.fillRect(0, 0, 1560, 300);
    boards(g, 0, Y(1.05), 1560, 1.05 * M, "#6a3c22", 54, r);
    rc(g, -10, Y(1.12), 1580, 26, "#d9773e", 3.5); rc(g, -10, Y(0.14), 1580, 0.14 * M + 10, "#3e2416", 3.5);
    for (let x = 50; x < 1560; x += 270) rc(g, x, Y(0.92), 180, 188, null, 2.5, 5);
    // a big window onto the clay courts
    { const x = 560, y = Y(2.75), w = 640, h = 1.5 * M;
      g.fillStyle = "rgba(30,15,40,0.22)"; g.fillRect(x + 10, y + 12, w, h);
      rc(g, x - 18, y - 18, w + 36, h + 36, "#fbf8f0", 5, 4);
      g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
      g.fillStyle = vgrad(g, y, y + h, "#8fd0f2", "#d8f0fa"); g.fillRect(x, y, w, h);
      for (let i = 0; i < 9; i++) el(g, x + i * 80 + 20, y + h * 0.42 + (i % 2) * 10, 60, 46, i % 2 ? "#4f9a52" : "#3f8a4a", 3);
      rc(g, x - 10, y + h * 0.5, w + 20, h * 0.5, "#d9773e", 0); mottle(g, r, x, y + h * 0.5, w, h * 0.5, 20, ["#e98a50", "#c0602e"], 20, 80, 0.3);
      ln(g, [[x + 60, y + h], [x + 150, y + h * 0.55]], 4, "#ffffff"); ln(g, [[x + w - 60, y + h], [x + w - 150, y + h * 0.55]], 4, "#ffffff"); ln(g, [[x + 150, y + h * 0.55], [x + w - 150, y + h * 0.55]], 4, "#ffffff");
      rc(g, x + 70, y + h * 0.68, w - 140, 34, "rgba(40,40,60,0.45)", 3); ln(g, [[x + 70, y + h * 0.68], [x + w - 70, y + h * 0.68]], 5, "#ffffff");
      el(g, x + w * 0.62, y + h * 0.84, 9, 9, "#d6e84a", 2.5);
      g.restore();
      for (const fx of [x + w / 2]) rc(g, fx - 9, y, 18, h, "#fbf8f0", 4); rc(g, x, y + h * 0.33 - 8, w, 16, "#fbf8f0", 4); }
    frame(g, 150, Y(2.5), 150, 190, 1, "#4a2a18"); frame(g, 340, Y(2.2), 120, 120, 0, "#4a2a18");
    // racket rack
    rc(g, 1270, Y(2.2), 230, 18, "#6a3c22", 3.5);
    for (let i = 0; i < 3; i++) { const cx2 = 1310 + i * 75, cy2 = Y(2.2) + 20; el(g, cx2, cy2 + 60, 30, 42, "#f4f1ea", 4); for (let k = -1; k <= 1; k++) { ln(g, [[cx2 + k * 12, cy2 + 22], [cx2 + k * 12, cy2 + 98]], 1.5, "#b9b6bd"); ln(g, [[cx2 - 26, cy2 + 60 + k * 16], [cx2 + 26, cy2 + 60 + k * 16]], 1.5, "#b9b6bd"); } rc(g, cx2 - 6, cy2 + 100, 12, 70, ["#c9373a", "#2f6fb0", "#2f7a5a"][i], 3, 4); }
    rc(g, 1250, Y(1.6), 260, 16, "#6a3c22", 3.5); for (let i = 0; i < 4; i++) cupT(g, 1290 + i * 62, Y(1.6), 0.5, ["#f2c64a", "#cfd6de", "#e9b93c", "#d9a05a"][i]);
  } },
  cafeFloor: { w: 512, h: 512, draw: (g, r) => {
    // Barcelona hydraulic tiles: cream ground, clay flower, green corner quarter-circles
    for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) {
      const X0 = x * 256, Y0 = y * 256, cx = X0 + 128, cy = Y0 + 128;
      g.fillStyle = "#efe3c8"; g.fillRect(X0, Y0, 256, 256); mottle(g, r, X0, Y0, 256, 256, 10, ["#fff7e2", "#d6c6a4"], 20, 70, 0.3);
      for (const [qx, qy] of [[X0, Y0], [X0 + 256, Y0], [X0, Y0 + 256], [X0 + 256, Y0 + 256]]) { g.fillStyle = "#2f5a48"; g.beginPath(); g.arc(qx, qy, 64, 0, 6.3); g.fill(); g.fillStyle = "#efe3c8"; g.beginPath(); g.arc(qx, qy, 40, 0, 6.3); g.fill(); g.fillStyle = "#c0603a"; g.beginPath(); g.arc(qx, qy, 22, 0, 6.3); g.fill(); }
      for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; g.fillStyle = "#c0603a"; g.beginPath(); g.ellipse(cx + 40 * Math.cos(a), cy + 40 * Math.sin(a), 38, 17, a, 0, 6.3); g.fill(); }
      g.fillStyle = "#2f5a48"; g.beginPath(); g.arc(cx, cy, 18, 0, 6.3); g.fill(); g.fillStyle = "#e9b93c"; g.beginPath(); g.arc(cx, cy, 8, 0, 6.3); g.fill();
    }
    g.strokeStyle = "rgba(60,40,40,0.55)"; g.lineWidth = 3; for (const k of [0, 256, 512]) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k, 512); g.moveTo(0, k); g.lineTo(512, k); g.stroke(); }
  } },
  counterFront: { w: 512, h: 512, draw: (g, r) => {
    // club-green panelled bar with white piping (like court lines) and a brass foot rail
    g.fillStyle = "#2f6a4a"; g.fillRect(0, 0, 512, 512); mottle(g, r, 0, 0, 512, 512, 30, ["#3f8a5e", "#1f4a34"], 20, 110, 0.25);
    rc(g, 36, 70, 440, 330, "#357552", 5, 8); ln(g, [[60, 94], [452, 94], [452, 376], [60, 376], [60, 94]], 6, "#f4f1ea"); ln(g, [[256, 94], [256, 376]], 6, "#f4f1ea");
    rc(g, -10, 430, 532, 90, "#3e2416", 5); rc(g, -10, 448, 532, 16, "#d9a53a", 3.5); rc(g, -10, -10, 532, 52, "#6a3c22", 5);
    g.strokeStyle = INKC; g.lineWidth = 5; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 512); g.moveTo(512, 0); g.lineTo(512, 512); g.stroke();
  } },
  marble: { w: 512, h: 512, draw: (g, r) => {
    g.fillStyle = "#efe6dc"; g.fillRect(0, 0, 512, 512); mottle(g, r, 0, 0, 512, 512, 30, ["#ffffff", "#cdbfb6"], 30, 120, 0.4);
    for (let i = 0; i < 9; i++) { let x = r() * 512, y = r() * 512; const pts = [[x, y]]; for (let k = 0; k < 6; k++) { x += 20 + r() * 60; y += (r() - 0.5) * 70; pts.push([x, y]); } ln(g, pts, 2 + r() * 2, "rgba(120,100,110,0.35)"); }
  } },
  espresso: { w: 800, h: 520, draw: (g, r) => {
    rc(g, 10, 60, 780, 450, "#aab3bd", 6, 26); mottle(g, r, 10, 60, 780, 450, 20, ["#dfe4e8", "#7a8490"], 30, 120, 0.25);
    rc(g, 60, 20, 680, 70, "#d6dbe0", 5, 10); for (let i = 0; i < 6; i++) { rc(g, 90 + i * 108, -28, 78, 56, "#fffdf6", 4, 8); }
    rc(g, 60, 130, 680, 150, "#dfe4e8", 5, 12); ln(g, [[80, 150], [720, 150]], 6, "rgba(255,255,255,0.8)");
    el(g, 400, 205, 52, 52, "#fff7e6", 5); ln(g, [[400, 205], [428, 180]], 5); for (let i = 0; i < 8; i++) { const a = Math.PI * (0.75 + i * 0.21); ln(g, [[400 + 38 * Math.cos(a), 205 + 38 * Math.sin(a)], [400 + 46 * Math.cos(a), 205 + 46 * Math.sin(a)]], 3); }
    for (const x of [150, 250, 550, 650]) el(g, x, 205, 24, 24, x < 400 ? "#2c2a38" : "#e9b93c", 4);
    for (const x of [220, 580]) { rc(g, x - 60, 290, 120, 46, "#aab2ba", 5, 8); rc(g, x - 44, 336, 88, 30, "#2c2a38", 4, 6); ln(g, [[x + 30, 352], [x + 130, 372]], 16); ln(g, [[x + 30, 352], [x + 130, 372]], 9, "#2c2a38"); }
    rc(g, 50, 440, 700, 50, "#aab2ba", 5, 6); for (let x = 70; x < 740; x += 26) ln(g, [[x, 452], [x, 480]], 3);
    ln(g, [[760, 150], [776, 320], [770, 400]], 9); ln(g, [[760, 150], [776, 320], [770, 400]], 4, "#dfe4e8");
  } },
  plasterExt: { w: 1024, h: 1024, draw: (g, r) => { plaster(g, r, 0, 0, 1024, 1024, "#9cc29a", "#bcd9b4", "#78a27c"); } },
  paving: { w: 2048, h: 2048, draw: (g, r) => {
    g.fillStyle = "#6f7288"; g.fillRect(0, 0, 2048, 2048);
    const rows = 12, rh = 2048 / rows;
    for (let j = 0; j < rows; j++) {
      const n = 4, off = (j % 2) * 256 + (r() - 0.5) * 60;
      for (let i = -1; i <= n; i++) {
        const x = i * 512 + off, c = ["#7b7e95", "#676a82", "#8588a0", "#5e6178", "#73768e"][Math.floor(r() * 5)];
        g.fillStyle = c; g.fillRect(x, j * rh, 512, rh);
        mottle(g, r, x, j * rh, 512, rh, 10, ["#a0a3ba", "#4a4c62"], 20, 90, 0.22);
        ln(g, [[x + 14, j * rh + 12], [x + 498, j * rh + 12]], 5, "rgba(255,255,255,0.13)");
        ln(g, [[x, j * rh], [x, (j + 1) * rh]], 6, "#2a2538");
      }
      ln(g, [[0, j * rh], [2048, j * rh]], 6, "#2a2538");
    }
  } },
  bunting: { w: 2048, h: 160, draw: (g) => {
    g.clearRect(0, 0, 2048, 160);
    ln(g, [[0, 14], [2048, 14]], 6);
    for (let i = 0; i < 16; i++) pg(g, [[i * 128 + 8, 14], [i * 128 + 120, 14], [i * 128 + 64, 150]], i % 2 ? "#fbfbf6" : "#2f8a4a", 6);
  } },
  awning: { w: 256, h: 256, draw: (g) => { for (let i = 0; i < 4; i++) { g.fillStyle = i % 2 ? "#fbf3e2" : "#cf3a3a"; g.fillRect(i * 64, 0, 64, 256); } g.strokeStyle = "rgba(36,23,38,0.35)"; g.lineWidth = 3; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, 256); g.stroke(); } } },
  doorWood: { w: 256, h: 512, draw: (g, r) => { boards(g, 0, 0, 256, 512, "#6a3c22", 64, r); rc(g, 20, 30, 216, 200, null, 4, 6); rc(g, 20, 270, 216, 210, null, 4, 6); el(g, 216, 262, 10, 10, "#d9a53a", 3); } },
  // the mural wall that closes the alley: 5.6 m x 13 m, 180 px/m
  mural: { w: 1008, h: 2340, draw: (g, r) => {
    const M = 180, Y = (m: number) => (13 - m) * M;
    plaster(g, r, 0, 0, 1008, 2340, "#ecd9a8", "#f8ecc8", "#c9ae78");
    // painted panel
    g.beginPath(); g.moveTo(40, Y(1.9)); for (let i = 0; i <= 20; i++) g.lineTo(40 + (r() - 0.5) * 22, Y(1.9 + i * 0.44)); for (let i = 0; i <= 10; i++) g.lineTo(40 + i * 93, Y(10.7) + (r() - 0.5) * 22);
    for (let i = 0; i <= 20; i++) g.lineTo(968 + (r() - 0.5) * 22, Y(10.7 - i * 0.44)); g.closePath();
    const sg = g.createLinearGradient(0, Y(10.7), 0, Y(1.9)); sg.addColorStop(0, "#3f8fd0"); sg.addColorStop(1, "#8fd0f2"); g.fillStyle = sg; g.fill();
    g.save(); g.clip();
    const cx = 504, hy = Y(7.3), R = 290;
    for (let i = 0; i < 24; i++) { const a = i * Math.PI / 12; pg(g, [[cx, hy], [cx + 1500 * Math.cos(a - 0.05), hy + 1500 * Math.sin(a - 0.05)], [cx + 1500 * Math.cos(a + 0.05), hy + 1500 * Math.sin(a + 0.05)]], "rgba(255,255,255,0.2)", 0); }
    el(g, cx, hy, R * 1.1, R * 1.1, "#d8ec3a", 12);
    g.beginPath(); g.ellipse(cx - R * 1.55, hy, R * 0.9, R * 1.05, 0, -1.0, 1.0); g.lineWidth = 22; g.strokeStyle = "#ffffff"; g.stroke();
    g.beginPath(); g.ellipse(cx + R * 1.55, hy, R * 0.9, R * 1.05, 0, Math.PI - 1.0, Math.PI + 1.0); g.stroke();
    rc(g, cx - 380, Y(2.6), 760, 120, "#2f8a4a", 8, 10);
    g.restore();
    mottle(g, r, 40, Y(10.7), 928, 8.8 * M, 120, ["#ffffff", "#20304a"], 14, 60, 0.09);
    for (let i = 0; i < 7; i++) { let x = 80 + r() * 850, y = Y(10.5) + r() * 1400; const pts = [[x, y]]; for (let k = 0; k < 5; k++) { x += (r() - 0.5) * 60; y += 40 + r() * 50; pts.push([x, y]); } ln(g, pts, 2.5, "rgba(60,40,30,0.45)"); }
    // top floor windows + cornice, base band
    for (const x of [200, 640]) { rc(g, x, Y(12.6), 170, 250, "#2a3350", 6); rc(g, x - 80, Y(12.6), 78, 250, "#3f7a5a", 5); rc(g, x + 172, Y(12.6), 78, 250, "#3f7a5a", 5); for (let k = 1; k < 9; k++) { ln(g, [[x - 74, Y(12.6) + k * 27], [x - 8, Y(12.6) + k * 27]], 2.5); ln(g, [[x + 178, Y(12.6) + k * 27], [x + 244, Y(12.6) + k * 27]], 2.5); } }
    rc(g, -10, Y(11.1), 1028, 30, "#d9c08a", 5); rc(g, -10, Y(1.3), 1028, 1.3 * M + 10, "#b9a27a", 5);
    mottle(g, r, 0, Y(1.3), 1008, 240, 20, ["#8a765a"], 20, 80, 0.3);
  } },
  // plane cabin wall: 4 window panels (0.85 m each) x 2.15 m high, 600 px/m
  cabin: { w: 2040, h: 1290, draw: (g, r) => {
    g.fillStyle = "#e4dfd2"; g.fillRect(0, 0, 2040, 1290); mottle(g, r, 0, 0, 2040, 1290, 60, ["#f6f2e8", "#bdb6a6"], 40, 160, 0.2);
    g.fillStyle = vgrad(g, 0, 300, "rgba(60,60,110,0.3)", "rgba(60,60,110,0)"); g.fillRect(0, 0, 2040, 300);
    rc(g, -10, 880, 2060, 420, "#b9c4d6", 5); mottle(g, r, 0, 880, 2040, 410, 30, ["#d6deea", "#8f9bb0"], 30, 120, 0.25); rc(g, -10, 866, 2060, 26, "#8f9bb0", 4);
    for (let i = 0; i < 4; i++) {
      const x = i * 510, cx = x + 255, cy = 520;
      ln(g, [[x, 0], [x, 1290]], 5, "rgba(36,23,38,0.6)");
      rc(g, cx - 120, cy - 170, 240, 340, "#f4f0e6", 5, 100); rc(g, cx - 92, cy - 142, 184, 284, "#0d1740", 5, 80);
      g.save(); g.beginPath(); g.roundRect(cx - 92, cy - 142, 184, 284, 80); g.clip();
      const ng = g.createLinearGradient(0, cy - 142, 0, cy + 142); ng.addColorStop(0, "#0a1236"); ng.addColorStop(1, "#27408f"); g.fillStyle = ng; g.fillRect(cx - 92, cy - 142, 184, 284);
      for (let k = 0; k < 7; k++) { g.fillStyle = "#fff6d8"; g.beginPath(); g.arc(cx - 80 + r() * 160, cy - 130 + r() * 200, 2 + r() * 3, 0, 6.3); g.fill(); }
      if (i === 1) { g.fillStyle = "#fff3c8"; g.beginPath(); g.arc(cx + 30, cy - 50, 30, 0, 6.3); g.fill(); g.fillStyle = "#0f1a48"; g.beginPath(); g.arc(cx + 44, cy - 58, 26, 0, 6.3); g.fill(); }
      el(g, cx - 60, cy + 120, 110, 40, "rgba(160,180,230,0.5)", 0); el(g, cx + 70, cy + 140, 90, 34, "rgba(160,180,230,0.4)", 0);
      const sh = [0.0, 0.0, 0.55, 0.2][i]; if (sh) { rc(g, cx - 96, cy - 146, 192, 290 * sh, "#f7f3ea", 4); ln(g, [[cx - 30, cy - 146 + 290 * sh - 14], [cx + 30, cy - 146 + 290 * sh - 14]], 6, "#b9b2a2"); }
      g.restore(); rc(g, cx - 92, cy - 142, 184, 284, null, 5, 80);
      ln(g, [[cx - 104, cy - 120], [cx - 104, cy + 60]], 6, "rgba(255,255,255,0.7)");
    }
  } },
  seat: { w: 512, h: 512, draw: (g, r) => {
    g.fillStyle = "#2f5fb0"; g.fillRect(0, 0, 512, 512); mottle(g, r, 0, 0, 512, 512, 24, ["#4f86d8", "#1c3a7a"], 30, 120, 0.3);
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { const cx = x * 64 + (y % 2) * 32 + 16, cy = y * 64 + 32; pg(g, [[cx, cy - 12], [cx + 9, cy], [cx, cy + 12], [cx - 9, cy]], y % 2 ? "#e9b93c" : "#8fc0f2", 0); }
  } },
  bins: { w: 512, h: 512, draw: (g, r) => {
    g.fillStyle = "#ebe6da"; g.fillRect(0, 0, 512, 512); mottle(g, r, 0, 0, 512, 512, 20, ["#fbf8f0", "#c4bdae"], 40, 140, 0.25);
    rc(g, 14, 40, 484, 400, "#f1ece0", 5, 30); rc(g, 206, 380, 100, 26, "#b9b2a2", 4, 10); ln(g, [[40, 70], [470, 70]], 7, "rgba(255,255,255,0.8)");
    rc(g, -10, 470, 532, 60, "#cfc8b8", 4); for (const x of [128, 384]) { el(g, x, 492, 16, 12, "#fff3c0", 3.5); }
  } },
  carpet: { w: 256, h: 256, draw: (g, r) => {
    g.fillStyle = "#27305e"; g.fillRect(0, 0, 256, 256); mottle(g, r, 0, 0, 256, 256, 16, ["#3a4688", "#161c3e"], 20, 60, 0.4);
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { const cx = x * 64 + 32, cy = y * 64 + 32; g.strokeStyle = (x + y) % 2 ? "#c9473f" : "#e9b93c"; g.lineWidth = 4; g.strokeRect(cx - 14, cy - 14, 28, 28); }
  } },
  curtain: { w: 512, h: 1024, draw: (g, r) => {
    g.fillStyle = "#5a3f9a"; g.fillRect(0, 0, 512, 1024);
    for (let i = 0; i < 9; i++) { const x = i * 58 + 10; const gr = g.createLinearGradient(x, 0, x + 58, 0); gr.addColorStop(0, "rgba(20,10,50,0.5)"); gr.addColorStop(0.5, "rgba(255,255,255,0.12)"); gr.addColorStop(1, "rgba(20,10,50,0.5)"); g.fillStyle = gr; g.fillRect(x, 0, 58, 1024); ln(g, [[x, 0], [x + (r() - 0.5) * 10, 1024]], 3.5, "rgba(36,23,38,0.6)"); }
    rc(g, -10, -10, 532, 60, "#3a2a6a", 5);
  } },
};

// ---------------- Naples facades ----------------
export type FacadeOpt = { wall: string; lite: string; dark: string; shutter: string; shop?: number; seed: number };
/** facade wm x hm metres at 200 px/m. glow = true paints only the lit windows (emissive map). */
export const facadePainter = (wm: number, hm: number, o: FacadeOpt, glow: boolean): Painter => ({ w: Math.round(wm * 200), h: Math.round(hm * 200), draw: (g, r0) => {
  const M = 200, Wp = wm * M, Hp = hm * M, Y = (m: number) => (hm - m) * M;
  let s = o.seed * 7919 + 13; const r = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  if (glow) { g.fillStyle = "#000"; g.fillRect(0, 0, Wp, Hp); }
  else {
    plaster(g, r0, 0, 0, Wp, Hp, o.wall, o.lite, o.dark);
    g.fillStyle = vgrad(g, Y(3.6), Hp, "rgba(40,20,60,0)", "rgba(40,20,60,0.25)"); g.fillRect(0, Y(3.6), Wp, Hp);
  }
  const floors = Math.floor((hm - 4.0) / 3.3), cols = Math.max(1, Math.round(wm / 2.7)), cw = Wp / cols;
  for (let fl = 0; fl < floors; fl++) for (let c = 0; c < cols; c++) {
    const cx = (c + 0.5) * cw, yb = Y(4.3 + fl * 3.3), ww = 1.0 * M, wh = 2.1 * M, lit = r() < 0.5, open = r() < 0.7, pot = r() < 0.4, cloth = r();
    if (glow) { if (lit) { const gg = g.createLinearGradient(0, yb - wh, 0, yb); gg.addColorStop(0, "#ffd98a"); gg.addColorStop(1, "#ff9c3a"); g.fillStyle = gg; g.fillRect(cx - ww / 2 + 8, yb - wh + 8, ww - 16, wh - 16); g.fillStyle = "#000"; g.fillRect(cx - 4, yb - wh, 8, wh); g.fillRect(cx - ww / 2, yb - wh * 0.55, ww, 8); g.fillRect(cx - ww / 2, yb - 0.95 * M, ww, 0.95 * M); } continue; }
    // stains under the sill
    g.fillStyle = "rgba(60,40,50,0.12)"; g.fillRect(cx - ww * 0.5, yb, ww * 0.25, 120 + r() * 160); g.fillRect(cx + ww * 0.2, yb, ww * 0.2, 80 + r() * 200);
    rc(g, cx - ww / 2 - 14, yb - wh - 20, ww + 28, wh + 20, o.lite, 5);                      // surround
    rc(g, cx - ww / 2, yb - wh, ww, wh, "#27304e", 5);
    g.fillStyle = "rgba(240,230,200,0.5)"; g.fillRect(cx - ww / 2 + 6, yb - wh + 6, ww * 0.34, wh * 0.9);                          // curtain hint
    ln(g, [[cx, yb - wh], [cx, yb]], 5); ln(g, [[cx - ww / 2, yb - wh * 0.55], [cx + ww / 2, yb - wh * 0.55]], 4);
    for (const sd of [-1, 1]) {                                                              // louvred shutters
      const sx = open ? cx + sd * (ww / 2 + 0.5 * ww * 0.5) - ww * 0.25 : cx + (sd < 0 ? -ww / 2 : 0), sw2 = ww * 0.5;
      rc(g, sx, yb - wh, sw2, wh, o.shutter, 5);
      for (let k = 1; k < 14; k++) ln(g, [[sx + 8, yb - wh + k * wh / 14], [sx + sw2 - 8, yb - wh + k * wh / 14]], 2.5, "rgba(20,10,30,0.5)");
    }
    // balcony: slab + iron railing
    const bw = ww * 2.3, by = yb + 8;
    rc(g, cx - bw / 2, by, bw, 26, "#cfc4b4", 5);
    rc(g, cx - bw / 2 + 6, by - 0.95 * M, bw - 12, 12, "#2a2538", 0);
    for (let k = 0; k <= 16; k++) ln(g, [[cx - bw / 2 + 10 + k * (bw - 20) / 16, by - 0.95 * M], [cx - bw / 2 + 10 + k * (bw - 20) / 16, by]], 5, "#2a2538");
    if (pot) for (const px of [-0.3, 0.32]) { const x = cx + px * bw; pg(g, [[x - 26, by - 40], [x + 26, by - 40], [x + 20, by], [x - 20, by]], "#c9673a", 4); for (let k = 0; k < 5; k++) el(g, x - 24 + k * 12, by - 54 - (k % 2) * 14, 16, 16, k % 2 ? "#3f8a4a" : "#57a05a", 3); if (r() < 0.6) el(g, x, by - 74, 8, 8, "#f25c7a", 2.5); }
    if (cloth < 0.35) { const x0 = cx - bw / 2 + 20; for (let k = 0; k < 4; k++) { const cl = ["#fbfbf6", SKYB, "#e9b93c", "#e07a9a", "#fbfbf6"][Math.floor(r() * 5)]; rc(g, x0 + k * (bw - 60) / 4, by - 0.9 * M + 6, (bw - 60) / 4 - 10, 100 + r() * 60, cl, 4, 4); } }
  }
  if (glow) return;
  // cornice, string courses, drainpipe, cables, ground floor
  rc(g, -10, -10, Wp + 20, 60, o.lite, 5); rc(g, -10, 46, Wp + 20, 22, o.dark, 4);
  rc(g, -10, Y(3.95), Wp + 20, 26, o.lite, 5);
  ln(g, [[Wp - 46, 70], [Wp - 46, Hp]], 20); ln(g, [[Wp - 46, 70], [Wp - 46, Hp]], 11, "#7a8a8a");
  ln(g, [[0, Y(7.2)], [Wp * 0.4, Y(6.95)], [Wp, Y(7.3)]], 4); ln(g, [[0, Y(10.2)], [Wp * 0.6, Y(10.0)], [Wp, Y(10.4)]], 3.5);
  g.fillStyle = "rgba(50,30,60,0.2)"; g.fillRect(0, Y(3.8), Wp, 3.8 * M);
  const sh = o.shop ?? 0, n = Math.max(1, Math.round(wm / 3.2)), sw = Wp / n;
  for (let i = 0; i < n; i++) {
    const x = i * sw + sw * 0.14, w = sw * 0.72, k = (sh + i) % 4, yb = Hp;
    if (k === 0) { rc(g, x, Y(2.9), w, 2.9 * M, "#8f9aa6", 6); for (let q = 1; q < 16; q++) ln(g, [[x + 6, Y(2.9) + q * 2.9 * M / 16], [x + w - 6, Y(2.9) + q * 2.9 * M / 16]], 3.5, "rgba(20,10,30,0.5)"); pg(g, [[x + w * 0.3, yb - 200], [x + w * 0.5, yb - 300], [x + w * 0.7, yb - 180], [x + w * 0.52, yb - 120]], "rgba(240,90,120,0.6)", 0); }
    else if (k === 1) { g.beginPath(); g.moveTo(x, yb); g.lineTo(x, Y(1.9)); g.arc(x + w / 2, Y(1.9), w / 2, Math.PI, 0); g.lineTo(x + w, yb); g.closePath(); g.fillStyle = "#3a2a22"; g.fill(); g.lineWidth = 6; g.strokeStyle = INKC; g.stroke(); rc(g, x + 10, Y(2.0), w / 2 - 12, 2.0 * M, "#6e3f24", 5); rc(g, x + w / 2 + 2, Y(2.0), w / 2 - 12, 2.0 * M, "#6e3f24", 5); for (const dx of [0.25, 0.75]) { rc(g, x + w * dx - 50, Y(1.7), 100, 110, null, 3.5, 4); rc(g, x + w * dx - 50, Y(0.95), 100, 150, null, 3.5, 4); } }
    else if (k === 2) { rc(g, x, Y(2.7), w, 2.7 * M, "#2a3350", 6); rc(g, x - 20, Y(3.25), w + 40, 0.5 * M, "#3f8a4a", 5); for (let q = 0; q < 6; q++) pg(g, [[x - 20 + q * (w + 40) / 6, Y(2.75)], [x - 20 + (q + 1) * (w + 40) / 6, Y(2.75)], [x - 20 + (q + 0.5) * (w + 40) / 6, Y(2.75) + 44]], q % 2 ? "#fbf3e2" : "#3f8a4a", 4);
      for (let q = 0; q < 3; q++) { rc(g, x + 20 + q * (w - 40) / 3, Y(0.75), (w - 40) / 3 - 14, 0.75 * M - 8, "#b0733a", 5); for (let e = 0; e < 4; e++) el(g, x + 44 + q * (w - 40) / 3 + e * 34, Y(0.75) - 4, 20, 20, ["#f29a2e", "#d9463f", "#e9d43c", "#57a05a"][(q + e) % 4], 3.5); } }
    else { rc(g, x + w * 0.2, Y(2.5), w * 0.6, 2.5 * M, o.shutter, 6); rc(g, x + w * 0.27, Y(2.3), w * 0.46, 0.9 * M, null, 4, 4); rc(g, x + w * 0.27, Y(1.25), w * 0.46, 1.05 * M, null, 4, 4); el(g, x + w * 0.72, Y(1.3), 10, 10, "#d9a53a", 3); rc(g, x - 10, Y(2.2), w * 0.16, 0.7 * M, "#f6ecd2", 4); }
  }
  rc(g, -10, Hp - 70, Wp + 20, 80, "#6a6278", 5);
} });
