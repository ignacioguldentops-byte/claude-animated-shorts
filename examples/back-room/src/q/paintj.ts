// Painted textures of "Hielo caliente": snow, ice, the Rockies panorama, winter crowd, chalets, the island's sea, sand, hills and houses.
import * as THREE from "three";
import { ctex, rng } from "./paint";
type G = CanvasRenderingContext2D;
type R = () => number;
const INKC = "#241726";
const pick = <T,>(r: R, a: T[]) => a[Math.floor(r() * a.length) % a.length];
const blot = (g: G, r: R, w: number, h: number, n: number, cols: string[], s0: number, s1: number, a = 0.3) => {
  for (let i = 0; i < n; i++) { g.globalAlpha = a * (0.4 + 0.6 * r()); g.fillStyle = pick(r, cols); const s = s0 + (s1 - s0) * r(); g.beginPath(); g.ellipse(r() * w, r() * h, s, s * (0.35 + 0.5 * r()), r() * 3.14, 0, 6.3); g.fill(); }
  g.globalAlpha = 1;
};
const poly = (g: G, pts: number[][], fill: string | CanvasGradient | null, ink = 0, col = INKC) => {
  g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath();
  if (fill) { g.fillStyle = fill; g.fill(); } if (ink) { g.lineWidth = ink; g.strokeStyle = col; g.lineJoin = "round"; g.stroke(); }
};
const rr = (g: G, x: number, y: number, w: number, h: number, fill: string | null, ink = 0, rad = 0) => { g.beginPath(); if (rad) g.roundRect(x, y, w, h, rad); else g.rect(x, y, w, h); if (fill) { g.fillStyle = fill; g.fill(); } if (ink) { g.lineWidth = ink; g.strokeStyle = INKC; g.stroke(); } };

export const snowTex = () => ctex("jSnow", 512, 512, (g, r) => {
  g.fillStyle = "#e4ecf8"; g.fillRect(0, 0, 512, 512);
  blot(g, r, 512, 512, 150, ["#d2dff2", "#f5f9ff", "#dae5f5", "#c9d8ee"], 14, 70, 0.4);
  for (let i = 0; i < 260; i++) { g.fillStyle = r() < 0.5 ? "#ffffff" : "#c3d3ec"; g.fillRect(r() * 512, r() * 512, 2 + r() * 2, 2 + r() * 2); }
});
export const iceTex = () => ctex("jIce", 256, 512, (g, r) => {
  const gr = g.createLinearGradient(0, 0, 256, 0); gr.addColorStop(0, "#c4e2f6"); gr.addColorStop(0.5, "#eaf6fe"); gr.addColorStop(1, "#c4e2f6"); g.fillStyle = gr; g.fillRect(0, 0, 256, 512);
  for (let i = 0; i < 70; i++) { g.globalAlpha = 0.25 + 0.4 * r(); g.strokeStyle = pick(r, ["#b3d6f0", "#ffffff", "#a9cdea", "#d8eefb"]); g.lineWidth = 1.5 + r() * 6; const x = r() * 256, y = r() * 512, l = 80 + r() * 300; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 8, y + l); g.stroke(); g.beginPath(); g.moveTo(x, y - 512); g.lineTo(x + (r() - 0.5) * 8, y + l - 512); g.stroke(); }
  g.globalAlpha = 0.8; for (const x of [112, 144]) { g.strokeStyle = "#9cc4e6"; g.lineWidth = 3; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 512); g.stroke(); } g.globalAlpha = 1;
  for (const x of [34, 222]) { g.fillStyle = "#4f8fd0"; g.fillRect(x - 3, 0, 6, 512); } for (const x of [70, 186]) { g.fillStyle = "rgba(120,170,220,0.7)"; g.fillRect(x - 1.5, 0, 3, 512); }
  for (const y of [0, 256]) { g.fillStyle = "rgba(100,150,205,0.75)"; g.fillRect(0, y, 256, 5); g.fillStyle = "rgba(255,255,255,0.8)"; g.fillRect(0, y + 5, 256, 3); }
});
/** outer shell of the track: v 1..0.86 rim (red and white blocks), below it the wall with a blue band and panels */
export const shellTex = () => ctex("jShell", 256, 256, (g, r) => {
  g.fillStyle = "#b4bdce"; g.fillRect(0, 0, 256, 256);
  blot(g, r, 256, 256, 30, ["#a3adc2", "#c6cede"], 10, 40, 0.3);
  for (let x = 0; x < 256; x += 64) { g.fillStyle = "#8f99b0"; g.fillRect(x, 36, 3, 220); }
  g.fillStyle = "#3f6fb8"; g.fillRect(0, 44, 256, 16); g.fillStyle = "#f4f7fd"; g.fillRect(0, 60, 256, 5);
  for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? "#f7f5ee" : "#d0342e"; g.fillRect(i * 32, 0, 32, 36); }
  g.fillStyle = "#241726"; g.fillRect(0, 34, 256, 4);
  g.fillStyle = "#eef3fb"; for (let x = 0; x < 256; x += 22) { g.beginPath(); g.ellipse(x + 10, 256, 18, 30 + 20 * r(), 0, 0, 6.3); g.fill(); }
});

type MPal = { lit: string; shade: string; sLit: string; sShade: string; line: string };
const peaks = (g: G, W: number, H: number, seed: number, baseY: number, amp: number, n: number, P: MPal, snowK: number) => {
  const q = rng(seed), pk: number[][] = [], vl: number[][] = [];
  for (let i = 0; i < n; i++) { pk.push([((i + 0.5 + (q() - 0.5) * 0.5) * W) / n, baseY - amp * (0.4 + 0.6 * q())]); vl.push([((i + 1 + (q() - 0.5) * 0.3) * W) / n, baseY + amp * (0.05 + 0.2 * q())]); }
  g.fillStyle = P.shade; g.fillRect(0, baseY, W, H - baseY);
  const jag = pk.map(() => [q(), q(), q(), q(), q(), q()]);
  for (const off of [-W, 0, W]) pk.forEach(([px0, py], i) => {
    const px = px0 + off, L = [vl[(i + n - 1) % n][0] + off - (i === 0 ? W : 0), vl[(i + n - 1) % n][1]], Rv = [vl[i][0] + off, vl[i][1]], J = jag[i];
    const foot = [px + (J[0] - 0.35) * 60, H];
    poly(g, [L, [px, py], foot, [L[0], H]], P.shade); poly(g, [[px, py], Rv, [Rv[0], H], foot], P.lit);
    // snow cap with a toothed lower edge
    const k = snowK * (0.75 + 0.5 * J[1]), at = (a: number[], t: number) => [px + (a[0] - px) * t, py + (a[1] - py) * t], pL = at(L, k), pR = at(Rv, k), mid = [px + (foot[0] - px) * k * 0.9, py + (H - py) * k * 0.42];
    const teeth = (a: number[], b: number[], m: number, s: number) => { const o: number[][] = []; for (let j = 1; j < m; j++) { const t = j / m; o.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t + (j % 2 ? 1 : -1) * s * (0.5 + J[(j + 2) % 6])]); } return o; };
    poly(g, [[px, py], pL, ...teeth(pL, mid, 6, amp * 0.07), mid], P.sShade); poly(g, [[px, py], mid, ...teeth(mid, pR, 6, amp * 0.07), pR], P.sLit);
    g.strokeStyle = P.line; g.lineWidth = 2.5; g.lineCap = "round"; g.beginPath(); g.moveTo(px, py); g.lineTo(px + (foot[0] - px) * 0.5, py + (H - py) * 0.5); g.stroke();
    for (let j = 0; j < 3; j++) { const t = 0.2 + 0.25 * j + 0.1 * J[j], a = at(Rv, t * k * 1.3), s = amp * 0.05 * (0.6 + J[j + 3]); poly(g, [[a[0] - s * 2.4, a[1] + s * 1.6], [a[0] - s * 0.6, a[1] - s * 0.2], [a[0] - s * 1.2, a[1] + s * 2.4]], P.lit); }
  });
};
/** 360-degree snowy mountains, transparent sky: far range, nearer range, a forested ridge fading into the snow */
export const rockiesTex = () => ctex("jRockies", 4096, 768, (g) => {
  g.clearRect(0, 0, 4096, 768);
  peaks(g, 4096, 768, 11, 400, 330, 8, { lit: "#c4d1ec", shade: "#8fa2cf", sLit: "#fbfcff", sShade: "#cbd7f0", line: "#7d90c0" }, 0.6);
  g.fillStyle = "rgba(190,206,236,0.35)"; g.fillRect(0, 300, 4096, 468);
  peaks(g, 4096, 768, 23, 540, 190, 13, { lit: "#8797c4", shade: "#5c6c9c", sLit: "#eef3fc", sShade: "#a9b9de", line: "#4a5a8a" }, 0.42);
  const q = rng(5), top = (x: number) => 640 + 26 * Math.sin((x / 4096) * Math.PI * 2 * 5 + 1) + 14 * Math.sin((x / 4096) * Math.PI * 2 * 13);
  const gr = g.createLinearGradient(0, 600, 0, 768); gr.addColorStop(0, "#2f4a5c"); gr.addColorStop(0.55, "#48647a"); gr.addColorStop(1, "#c9d8ec");
  g.fillStyle = gr; g.beginPath(); g.moveTo(0, 768);
  for (let x = 0; x <= 4096; x += 16) { const y = top(x), hgt = 14 + 26 * q(); g.lineTo(x, y); g.lineTo(x + 8, y - hgt); } g.lineTo(4096, 768); g.closePath(); g.fill();
  for (let i = 0; i < 260; i++) { const x = q() * 4096, y = top(x) + 20 + q() * 90; g.fillStyle = "rgba(226,236,250,0.5)"; g.beginPath(); g.ellipse(x, y, 10 + q() * 30, 3 + q() * 5, 0, 0, 6.3); g.fill(); }
});
/** the island's green hills (half panorama on the land side) */
export const hillsTex = () => ctex("jHills", 4096, 768, (g) => {
  g.clearRect(0, 0, 4096, 768); const q = rng(8), W = 4096;
  const band = (y0: number, a1: number, f1: number, a2: number, f2: number, ph: number, col: string, col2: string, bump: number) => {
    const top = (x: number) => y0 + a1 * Math.sin((x / W) * 6.283 * f1 + ph) + a2 * Math.sin((x / W) * 6.283 * f2 + ph * 2.1);
    const gr = g.createLinearGradient(0, y0 - a1 - a2, 0, 768); gr.addColorStop(0, col); gr.addColorStop(1, col2); g.fillStyle = gr;
    g.beginPath(); g.moveTo(0, 768); for (let x = 0; x <= W; x += 8) g.lineTo(x, top(x)); g.lineTo(W, 768); g.closePath(); g.fill();
    if (bump) for (let x = 0; x < W; x += bump * 0.9) { const rad = bump * (0.6 + 0.7 * q()); g.beginPath(); g.arc(x, top(x) + rad * 0.35, rad, 0, 6.3); g.fill(); }
    return top;
  };
  band(330, 70, 2, 30, 5, 0.6, "#9fd0cf", "#8cc7b6", 0);
  band(430, 60, 3, 26, 7, 2.1, "#6dbb8e", "#5fb07a", 14);
  const t3 = band(540, 44, 4, 20, 9, 4.0, "#3f9a58", "#58b060", 22);
  for (let i = 0; i < 420; i++) { const x = q() * W, y = t3(x) + 14 + q() * 190; g.fillStyle = pick(q, ["rgba(110,200,100,0.55)", "rgba(40,120,70,0.5)", "rgba(150,215,110,0.45)"]); g.beginPath(); g.ellipse(x, y, 12 + q() * 26, 8 + q() * 14, 0, 0, 6.3); g.fill(); }
  for (let i = 0; i < 46; i++) { const x = q() * W, y = t3(x) + 60 + q() * 120, c = pick(q, ["#f6d24a", "#f25c7a", "#3fb0c9", "#f7f5ee", "#f29a2e"]); g.fillStyle = c; g.fillRect(x, y, 22, 14); g.fillStyle = "#b0503a"; g.beginPath(); g.moveTo(x - 4, y); g.lineTo(x + 11, y - 10); g.lineTo(x + 26, y); g.closePath(); g.fill(); }
  for (let i = 0; i < 60; i++) { const x = q() * W, y = t3(x) - 4 + q() * 30; g.strokeStyle = "#2f6a40"; g.lineWidth = 3; g.beginPath(); g.moveTo(x, y + 30); g.lineTo(x + 3, y); g.stroke(); g.fillStyle = "#2f7f4a"; for (let k = 0; k < 6; k++) { const a = -2.9 + k * 0.55; g.beginPath(); g.ellipse(x + 3 + 13 * Math.cos(a), y + 9 * Math.sin(a) + 2, 12, 3.5, a, 0, 6.3); g.fill(); } }
});
/** rows of people in winter clothes (beanies, scarves), 2048 x 768, 9 rows */
export const crowdWinterTex = () => ctex("jCrowd", 2048, 768, (g, r) => {
  const rows = 9, rh = 768 / rows, coats = ["#d0342e", "#3f8fc9", "#7a5a9a", "#f29a2e", "#2f7a8a", "#e07a9a", "#57a05a", "#f6c419", "#f4f1ea", "#3a4a8a"];
  const skins = ["#fde3cc", "#f1c9a2", "#e2b088", "#fff0e0", "#c99067", "#8f5d3e"];
  for (let y = 0; y < rows; y++) {
    g.fillStyle = y % 2 ? "#4e5672" : "#56607e"; g.fillRect(0, y * rh, 2048, rh); g.fillStyle = "#39405a"; g.fillRect(0, y * rh + rh * 0.86, 2048, rh * 0.14);
    for (let x = 4; x < 2048; x += 38 + r() * 8) {
      const c = pick(r, coats), up = r() < 0.3, cx = x + 17, by = y * rh + rh * 0.88, hy = by - rh * 0.56 - (up ? 5 : 0);
      g.fillStyle = INKC; g.beginPath(); g.ellipse(cx, by - rh * 0.2, 18, rh * 0.31, 0, 0, 6.3); g.fill(); g.fillStyle = c; g.beginPath(); g.ellipse(cx, by - rh * 0.2, 15, rh * 0.28, 0, 0, 6.3); g.fill();
      if (up) { g.strokeStyle = INKC; g.lineWidth = 6; g.beginPath(); g.moveTo(cx - 13, by - rh * 0.34); g.lineTo(cx - 22, hy - 20); g.moveTo(cx + 13, by - rh * 0.34); g.lineTo(cx + 22, hy - 20); g.stroke(); g.fillStyle = pick(r, coats); g.beginPath(); g.arc(cx - 22, hy - 22, 6, 0, 6.3); g.arc(cx + 22, hy - 22, 6, 0, 6.3); g.fill(); }
      g.fillStyle = INKC; g.beginPath(); g.arc(cx, hy, 17, 0, 6.3); g.fill(); g.fillStyle = pick(r, skins); g.beginPath(); g.arc(cx, hy, 14, 0, 6.3); g.fill();
      const hc = pick(r, coats); g.fillStyle = hc; g.beginPath(); g.arc(cx, hy - 3, 14.5, Math.PI * 1.02, Math.PI * 1.98); g.fill(); g.fillStyle = "#f4f1ea"; g.fillRect(cx - 15, hy - 5, 30, 5); g.beginPath(); g.arc(cx, hy - 19, 5, 0, 6.3); g.fill();
      g.fillStyle = pick(r, coats); g.fillRect(cx - 12, hy + 12, 24, 7);
    }
    if (r() < 0.75) { const fx = r() * 1900, fy = y * rh + 1, k = Math.floor(r() * 4); g.fillStyle = INKC; g.fillRect(fx - 3, fy - 3, 86, 44);
      const cs = [["#d0342e", "#f7f5ee", "#d0342e"], ["#1f8a3a", "#f6c419", "#23202a"], ["#f7f5ee", "#3f6fb8", "#f7f5ee"], ["#f6c419", "#3f6fb8", "#d0342e"]][k]; cs.forEach((c, i) => { g.fillStyle = c; if (k % 2) g.fillRect(fx, fy + (i * 38) / 3, 80, 38 / 3 + 1); else g.fillRect(fx + (i * 80) / 3, fy, 80 / 3 + 1, 38); }); }
  }
});
/** abstract colour boards round the finish (no brands) */
export const boardsTex = () => ctex("jBoards", 1024, 64, (g) => {
  const cols = ["#d23b35", "#ffffff", "#1f4fa0", "#f2c230", "#2f8a4a", "#ffffff"];
  for (let i = 0; i < 12; i++) { g.fillStyle = cols[i % 6]; g.fillRect((i * 1024) / 12, 0, 1024 / 12, 64); g.fillStyle = cols[(i + 2) % 6]; g.beginPath(); g.moveTo((i * 1024) / 12 + 14, 46); g.lineTo((i * 1024) / 12 + 42, 16); g.lineTo((i * 1024) / 12 + 70, 46); g.closePath(); g.fill(); }
});
export const checkerTex = () => ctex("jChecker", 256, 64, (g) => { for (let y = 0; y < 2; y++) for (let x = 0; x < 8; x++) { g.fillStyle = (x + y) % 2 ? "#f7f5ee" : "#23202a"; g.fillRect(x * 32, y * 32, 32, 32); } });
/** chalet front, 8 x 5 m: planks, stone base, shuttered windows with flower boxes, a door, snow on the sills */
export const chaletTex = (k: number) => ctex("jChalet" + k, 640, 400, (g, r) => {
  const wood = ["#a8693c", "#96582f", "#b97a45", "#8a5230"][k % 4], sh = ["#2f7a5a", "#a8343a", "#2f5f9a", "#c98a2a"][k % 4];
  g.fillStyle = wood; g.fillRect(0, 0, 640, 400);
  for (let y = 0; y < 400; y += 26) { g.fillStyle = "rgba(60,30,14,0.45)"; g.fillRect(0, y, 640, 3); for (let i = 0; i < 6; i++) { g.fillStyle = r() < 0.5 ? "rgba(255,220,170,0.12)" : "rgba(60,30,14,0.14)"; g.fillRect(r() * 640, y + 4, 40 + r() * 120, 20); } }
  g.fillStyle = "#b9b4ac"; g.fillRect(0, 336, 640, 64); for (let i = 0; i < 40; i++) rr(g, r() * 640 - 20, 338 + r() * 44, 30 + r() * 36, 16 + r() * 12, pick(r, ["#a8a39c", "#cbc6bd", "#9a958e"]), 2, 6);
  const win = (x: number, y: number, w: number, h: number) => {
    rr(g, x - w * 0.42 - 4, y - 2, w * 0.42, h + 4, sh, 4); rr(g, x + w + 4, y - 2, w * 0.42, h + 4, sh, 4);
    for (const sx of [x - w * 0.42 - 4, x + w + 4]) for (let j = 1; j < 5; j++) { g.fillStyle = "rgba(0,0,0,0.25)"; g.fillRect(sx + 4, y + (j * h) / 5, w * 0.42 - 8, 3); }
    rr(g, x - 5, y - 5, w + 10, h + 10, "#f4efe4", 4); const gl = g.createLinearGradient(0, y, 0, y + h); gl.addColorStop(0, "#ffe9a8"); gl.addColorStop(1, "#ffc46a"); rr(g, x, y, w, h, gl as unknown as string, 3);
    g.fillStyle = "#f4efe4"; g.fillRect(x + w / 2 - 2, y, 4, h); g.fillRect(x, y + h / 2 - 2, w, 4);
    rr(g, x - 10, y + h + 6, w + 20, 16, "#6e3a1a", 3); for (let j = 0; j < 5; j++) { g.fillStyle = pick(r, ["#e2453c", "#f25c7a", "#f6c419"]); g.beginPath(); g.arc(x + (j + 0.5) * (w / 5), y + h + 5, 7, 0, 6.3); g.fill(); }
    g.fillStyle = "#f6f9ff"; g.beginPath(); g.roundRect(x - 12, y - 14, w + 24, 12, 6); g.fill();
  };
  for (const x of [70, 290, 510]) win(x, 50, 62, 78);
  win(90, 212, 70, 84); win(480, 212, 70, 84);
  rr(g, 272, 200, 96, 136, "#5a3320", 5, 10); rr(g, 284, 214, 72, 50, "#ffd98a", 3, 6); g.fillStyle = "#e9b93c"; g.beginPath(); g.arc(352, 280, 6, 0, 6.3); g.fill();
  g.fillStyle = "#f6f9ff"; g.beginPath(); g.roundRect(262, 186, 116, 14, 7); g.fill();
  g.fillStyle = "#f6f9ff"; for (let x = 0; x < 640; x += 30) { g.beginPath(); g.ellipse(x + 15, 400, 24, 10 + 10 * r(), 0, 0, 6.3); g.fill(); }
});
export const plankTex = (key: string, col: string) => ctex("jPlank" + key, 256, 256, (g, r) => {
  g.fillStyle = col; g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 32) { g.fillStyle = "rgba(40,20,10,0.4)"; g.fillRect(0, y, 256, 3); for (let i = 0; i < 4; i++) { g.fillStyle = r() < 0.5 ? "rgba(255,230,190,0.12)" : "rgba(40,20,10,0.14)"; g.fillRect(r() * 256, y + 5, 30 + r() * 90, 22); } }
});
/** a T-shirt on a hanger (cut-out), k = colourway */
export const tshirtTex = (k: number) => ctex("jTee" + k, 256, 256, (g) => {
  g.clearRect(0, 0, 256, 256); const c = ["#23202a", "#f6c419", "#1f8a3a", "#f7f5ee"][k % 4], c2 = ["#f6c419", "#23202a", "#f6c419", "#1f8a3a"][k % 4], c3 = ["#1f8a3a", "#1f8a3a", "#23202a", "#f6c419"][k % 4];
  poly(g, [[20, 70], [84, 36], [108, 52], [148, 52], [172, 36], [236, 70], [212, 116], [184, 102], [184, 238], [72, 238], [72, 102], [44, 116]], c, 8);
  g.strokeStyle = INKC; g.lineWidth = 6; g.beginPath(); g.arc(128, 44, 22, 0.1, Math.PI - 0.1); g.stroke(); g.beginPath(); g.moveTo(128, 30); g.lineTo(128, 4); g.stroke();
  g.fillStyle = c2; g.fillRect(88, 130, 80, 12); g.fillStyle = c3; g.fillRect(88, 148, 80, 12);
  poly(g, [[92, 118], [150, 118], [166, 106], [140, 98], [100, 104]], c2, 0);
});
export const flagTex = (k: number) => ctex("jFlag" + k, 192, 128, (g) => {
  const W = 192, H = 128, bars = (cs: string[], vert: boolean) => cs.forEach((c, i) => { g.fillStyle = c; if (vert) g.fillRect((i * W) / cs.length, 0, W / cs.length + 1, H); else g.fillRect(0, (i * H) / cs.length, W, H / cs.length + 1); });
  switch (k % 8) {
    case 0: g.fillStyle = "#1f8a3a"; g.fillRect(0, 0, W, H); poly(g, [[0, 0], [W / 2, H / 2], [0, H]], "#1c1a20"); poly(g, [[W, 0], [W / 2, H / 2], [W, H]], "#1c1a20"); g.strokeStyle = "#f6c419"; g.lineWidth = 22; g.beginPath(); g.moveTo(0, 0); g.lineTo(W, H); g.moveTo(W, 0); g.lineTo(0, H); g.stroke(); break;
    case 1: g.fillStyle = "#d0342e"; g.fillRect(0, 0, W, H); g.fillStyle = "#fff"; g.fillRect(80, 28, 32, 72); g.fillRect(60, 48, 72, 32); break;
    case 2: bars(["#d0342e", "#f7f5ee", "#d0342e"], false); break;
    case 3: bars(["#1f8a3a", "#f7f5ee", "#d0342e"], true); break;
    case 4: bars(["#d0342e", "#f7f5ee", "#d0342e"], true); g.fillStyle = "#d0342e"; g.beginPath(); g.arc(96, 64, 22, 0, 6.3); g.fill(); break;
    case 5: for (let i = 0; i < 7; i++) { g.fillStyle = i % 2 ? "#f7f5ee" : "#d0342e"; g.fillRect(0, (i * H) / 7, W, H / 7 + 1); } g.fillStyle = "#2f4fa0"; g.fillRect(0, 0, 84, 70); g.fillStyle = "#fff"; for (let y = 0; y < 3; y++) for (let x = 0; x < 4; x++) { g.beginPath(); g.arc(12 + x * 20, 12 + y * 22, 4, 0, 6.3); g.fill(); } break;
    case 6: bars(["#23202a", "#d0342e", "#f6c419"], false); break;
    default: bars(["#2f4fa0", "#f7f5ee", "#d0342e"], true); break;
  }
  g.strokeStyle = INKC; g.lineWidth = 6; g.strokeRect(0, 0, W, H);
});
/** results board: rows of flag + time bar, the island's flag last with no time; no text at all */
export const resultsTex = () => ctex("jResults", 512, 640, (g) => {
  g.fillStyle = "#1b2140"; g.fillRect(0, 0, 512, 640); g.strokeStyle = "#3a4a8a"; g.lineWidth = 10; g.strokeRect(5, 5, 502, 630);
  const flag = (k: number, x: number, y: number) => { const t = flagTex(k).image as HTMLCanvasElement; g.drawImage(t, x, y, 84, 56); };
  [1, 6, 7, 2, 3, 4, 5, 0].forEach((k, i) => {
    const y = 22 + i * 76; g.fillStyle = i === 7 ? "#3a2a50" : "#262e58"; g.fillRect(18, y, 476, 64); flag(k, 28, y + 4);
    for (let d = 0; d < 13; d++) { const on = i < 7 ? d < 12 - i : false; g.fillStyle = on ? "#ffd75a" : i === 7 && d % 2 === 0 ? "#d0342e" : "#3a4470"; g.beginPath(); g.arc(140 + d * 27, y + 32, i === 7 ? 6 : 9, 0, 6.3); g.fill(); }
  });
});

// ---------------- the island ----------------
export const sandTex = () => ctex("jSand", 512, 512, (g, r) => {
  g.fillStyle = "#f4dfae"; g.fillRect(0, 0, 512, 512); blot(g, r, 512, 512, 130, ["#ecd198", "#fbecc6", "#e6c88a", "#f8e6b8"], 12, 60, 0.4);
  for (let i = 0; i < 700; i++) { g.fillStyle = r() < 0.5 ? "#d9b877" : "#fff6dc"; g.fillRect(r() * 512, r() * 512, 2 + r() * 2, 2); }
  for (let i = 0; i < 10; i++) { const x = r() * 512, y = r() * 512; g.fillStyle = pick(r, ["#f7b7a8", "#fbf6ea", "#e9a88a"]); g.beginPath(); g.ellipse(x, y, 5, 4, r() * 3, 0, 6.3); g.fill(); }
});
/** the sea from the shore (v = 0) to the horizon (v = 1): turquoise shallows to deep blue */
export const seaTex = () => ctex("jSea", 64, 1024, (g) => {
  const gr = g.createLinearGradient(0, 1024, 0, 0); gr.addColorStop(0, "#9cf0e0"); gr.addColorStop(0.03, "#58dccf"); gr.addColorStop(0.1, "#25bfc8"); gr.addColorStop(0.3, "#1795c4"); gr.addColorStop(0.65, "#1670b4"); gr.addColorStop(1, "#1a5ca4");
  g.fillStyle = gr; g.fillRect(0, 0, 64, 1024);
});
/** wave glints and little crests (see-through), tiles */
export const wavesTex = () => ctex("jWaves", 512, 512, (g, r) => {
  g.clearRect(0, 0, 512, 512); g.lineCap = "round";
  for (let i = 0; i < 60; i++) { const x = r() * 512, y = r() * 512, w = 20 + r() * 50; g.strokeStyle = r() < 0.7 ? "rgba(255,255,255,0.75)" : "rgba(170,245,240,0.8)"; g.lineWidth = 2.5 + r() * 2.5; for (const ox of [-512, 0, 512]) { g.beginPath(); g.moveTo(x + ox - w / 2, y); g.quadraticCurveTo(x + ox, y - 7, x + ox + w / 2, y); g.stroke(); } }
});
/** foam at the water's edge (see-through): v = 0 is the wet sand side */
export const foamTex = () => ctex("jFoam", 512, 128, (g, r) => {
  g.clearRect(0, 0, 512, 128); g.fillStyle = "rgba(255,255,255,0.95)"; g.beginPath(); g.moveTo(0, 0);
  for (let x = 0; x <= 512; x += 32) g.lineTo(x, 30 + 12 * Math.sin((x / 512) * 6.283 * 3)); g.lineTo(512, 0); g.closePath(); g.fill();
  for (let x = 0; x <= 512; x += 16) { g.beginPath(); g.arc(x, 78 + 12 * Math.sin((x / 512) * 6.283 * 3), 15 + 5 * Math.sin(x), 0, 6.3); g.fill(); }
  g.fillRect(0, 28, 512, 50); g.globalCompositeOperation = "destination-out"; for (let i = 0; i < 40; i++) { g.beginPath(); g.ellipse(r() * 512, 20 + r() * 50, 6 + r() * 16, 3 + r() * 5, 0, 0, 6.3); g.fill(); } g.globalCompositeOperation = "source-over";
});
export const lawnTex = () => ctex("jLawn", 512, 512, (g, r) => {
  g.fillStyle = "#5fb24a"; g.fillRect(0, 0, 512, 512); blot(g, r, 512, 512, 140, ["#4ea040", "#74c25a", "#57aa46", "#86cc66"], 10, 46, 0.45);
  for (let i = 0; i < 1500; i++) { g.fillStyle = r() < 0.5 ? "rgba(30,90,30,0.25)" : "rgba(190,235,130,0.3)"; g.fillRect(r() * 512, r() * 512, 3, 7); }
  for (let i = 0; i < 26; i++) { g.fillStyle = pick(r, ["#f25c7a", "#f6d24a", "#fbf6ea"]); g.beginPath(); g.arc(r() * 512, r() * 512, 3.5, 0, 6.3); g.fill(); }
});
export const roadTex = () => ctex("jRoad", 512, 512, (g, r) => {
  g.fillStyle = "#b9a58a"; g.fillRect(0, 0, 512, 512); blot(g, r, 512, 512, 120, ["#a8947a", "#c9b79c", "#9f8b72", "#d3c2a8"], 12, 60, 0.4);
  for (let i = 0; i < 900; i++) { g.fillStyle = r() < 0.5 ? "#8d7a62" : "#e2d3ba"; g.fillRect(r() * 512, r() * 512, 3 + r() * 3, 3); }
  g.fillStyle = "rgba(90,70,50,0.22)"; g.fillRect(150, 0, 46, 512); g.fillRect(316, 0, 46, 512);
  for (let i = 0; i < 5; i++) { g.fillStyle = "rgba(80,62,44,0.5)"; g.beginPath(); g.ellipse(r() * 512, r() * 512, 20 + r() * 26, 10 + r() * 10, r(), 0, 6.3); g.fill(); }
});
export const tinTex = () => ctex("jTin", 256, 256, (g, r) => {
  for (let x = 0; x < 256; x += 16) { g.fillStyle = "#a9b0b8"; g.fillRect(x, 0, 8, 256); g.fillStyle = "#858c94"; g.fillRect(x + 8, 0, 8, 256); }
  for (let i = 0; i < 26; i++) { g.fillStyle = "rgba(170,90,40,0.4)"; g.beginPath(); g.ellipse(r() * 256, r() * 256, 8 + r() * 22, 5 + r() * 12, 0, 0, 6.3); g.fill(); }
});
export const thatchTex = () => ctex("jThatch", 256, 256, (g, r) => {
  g.fillStyle = "#c9a85a"; g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 28) { g.fillStyle = "rgba(90,60,20,0.5)"; g.fillRect(0, y + 24, 256, 4); for (let x = 0; x < 256; x += 5) { g.strokeStyle = pick(r, ["#b8944a", "#dcc078", "#a8843e", "#e6cf8a"]); g.lineWidth = 3; g.beginPath(); g.moveTo(x + r() * 3, y); g.lineTo(x + r() * 4 - 2, y + 26); g.stroke(); } }
});
/** a wooden house front on the island, 5 x 2.8 m: painted boards, a door, a louvred window, trim */
export const shackTex = (k: number) => ctex("jShack" + k, 500, 280, (g, r) => {
  const col = ["#3fb0c9", "#f29a2e", "#f25c7a", "#7fc97a", "#f6d24a", "#b98ad6", "#f4efe0"][k % 7], trim = ["#f7f5ee", "#2f7a5a", "#f7f5ee", "#a8343a", "#2f5f9a", "#f7f5ee", "#2f7a8a"][k % 7];
  g.fillStyle = col; g.fillRect(0, 0, 500, 280);
  for (let x = 0; x < 500; x += 28) { g.fillStyle = "rgba(0,0,0,0.16)"; g.fillRect(x, 0, 3, 280); if (r() < 0.4) { g.fillStyle = "rgba(255,255,255,0.14)"; g.fillRect(x + 3, 0, 25, 280); } }
  blot(g, r, 500, 280, 30, ["rgba(0,0,0,1)", "rgba(255,255,255,1)"], 10, 40, 0.07);
  const dx = k % 2 ? 300 : 110; rr(g, dx - 8, 68, 106, 212, trim, 5); rr(g, dx, 76, 90, 204, ["#7a4a2a", "#2f7a5a", "#a8343a"][k % 3], 4); g.fillStyle = "#e9b93c"; g.beginPath(); g.arc(dx + 74, 186, 6, 0, 6.3); g.fill(); for (let j = 1; j < 4; j++) { g.fillStyle = "rgba(0,0,0,0.2)"; g.fillRect(dx + 8, 76 + j * 50, 74, 4); }
  const wx = k % 2 ? 80 : 310; rr(g, wx - 8, 82, 126, 106, trim, 5); rr(g, wx, 90, 110, 90, "#2c3a4a", 4); for (let j = 0; j < 6; j++) { g.fillStyle = trim; g.fillRect(wx + 4, 94 + j * 15, 102, 8); } g.fillStyle = trim; g.fillRect(wx + 52, 90, 6, 90);
  g.fillStyle = trim; g.fillRect(0, 0, 500, 14); g.fillStyle = "rgba(0,0,0,0.18)"; g.fillRect(0, 14, 500, 8);
  g.fillStyle = "#8a7a66"; g.fillRect(0, 266, 500, 14);
});
/** barracks: a long cream building with green doors and shutters, 12 x 3.4 m */
export const barracksTex = () => ctex("jBarracks", 1200, 340, (g, r) => {
  g.fillStyle = "#f1e6c8"; g.fillRect(0, 0, 1200, 340); blot(g, r, 1200, 340, 60, ["#e6d8b4", "#fbf2da"], 20, 80, 0.4);
  g.fillStyle = "#5f7a3a"; g.fillRect(0, 286, 1200, 54); g.fillStyle = "#4a6030"; g.fillRect(0, 282, 1200, 6);
  for (let i = 0; i < 5; i++) { const x = 60 + i * 232;
    if (i % 2 === 0) { rr(g, x, 92, 104, 248, "#f7f5ee", 5); rr(g, x + 8, 100, 88, 240, "#3f6a3a", 4); g.fillStyle = "#e9b93c"; g.beginPath(); g.arc(x + 80, 220, 6, 0, 6.3); g.fill(); }
    else { rr(g, x - 6, 96, 130, 120, "#f7f5ee", 5); rr(g, x, 102, 118, 108, "#2c3a4a", 4); for (let j = 0; j < 7; j++) { g.fillStyle = "#3f6a3a"; g.fillRect(x + 4, 106 + j * 15, 110, 8); } }
  }
  g.fillStyle = "#b0503a"; g.fillRect(0, 0, 1200, 20);
});
/** palm crown: fronds radiating from the centre (cut-out) */
export const palmTex = (k: number) => ctex("jPalm" + k, 512, 512, (g, r) => {
  g.clearRect(0, 0, 512, 512); const n = 9;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 6.283 + (k ? 0.35 : 0) + (r() - 0.5) * 0.2, len = 200 + r() * 44, droop = 70 + r() * 50, c = pick(r, ["#2f8a3a", "#3f9a46", "#267a34", "#4aa84e"]);
    const pt = (t: number) => [256 + Math.cos(a) * len * t, 236 + Math.sin(a) * len * t * 0.8 + droop * t * t];
    for (const pass of [0, 1]) for (let j = 2; j <= 20; j++) { const t = j / 20, [x, y] = pt(t), [x0, y0] = pt(t - 0.05), dx = x - x0, dy = y - y0, l = Math.hypot(dx, dy) || 1, w = 46 * Math.sin(Math.PI * Math.min(1, t * 1.15)) + 6;
      for (const s of [-1, 1]) { g.strokeStyle = pass ? c : INKC; g.lineWidth = pass ? 7 : 14; g.lineCap = "round"; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (-dy / l) * s * w + (dx / l) * 14, y + (dx / l) * s * w + (dy / l) * 14 + 6); g.stroke(); } }
    g.strokeStyle = "#1f6a2c"; g.lineWidth = 5; g.beginPath(); for (let j = 0; j <= 20; j++) { const [x, y] = pt(j / 20); if (j) g.lineTo(x, y); else g.moveTo(x, y); } g.stroke();
  }
  for (const [x, y] of [[240, 250], [270, 256], [256, 270]]) { g.fillStyle = INKC; g.beginPath(); g.arc(x, y, 17, 0, 6.3); g.fill(); g.fillStyle = "#8a5a34"; g.beginPath(); g.arc(x, y, 13, 0, 6.3); g.fill(); }
});
export const trunkTex = () => ctex("jTrunk", 64, 256, (g, r) => {
  g.fillStyle = "#a8845a"; g.fillRect(0, 0, 64, 256); for (let y = 0; y < 256; y += 18) { g.fillStyle = "#7d5f3c"; g.fillRect(0, y, 64, 5); g.fillStyle = "rgba(255,235,190,0.2)"; g.fillRect(0, y + 6, 64, 5 + r() * 4); }
});
/** banana plant (cut-out) */
export const bananaTex = () => ctex("jBanana", 256, 384, (g, r) => {
  g.clearRect(0, 0, 256, 384); g.strokeStyle = INKC; g.lineWidth = 22; g.lineCap = "round"; g.beginPath(); g.moveTo(128, 380); g.lineTo(128, 200); g.stroke(); g.strokeStyle = "#7fae4a"; g.lineWidth = 14; g.beginPath(); g.moveTo(128, 380); g.lineTo(128, 200); g.stroke();
  for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.42 + (r() - 0.5) * 0.1, l = 150 + r() * 40, ex = 128 + Math.cos(a) * l, ey = 210 + Math.sin(a) * l + Math.abs(i - 3) * 22, mx = 128 + Math.cos(a) * l * 0.5, my = 210 + Math.sin(a) * l * 0.55, nx = -(ey - 210) / l, ny = (ex - 128) / l;
    poly(g, [[128, 210], [mx + nx * 26, my + ny * 26], [ex, ey], [mx - nx * 26, my - ny * 26]], pick(r, ["#3f9a46", "#57b04e", "#2f8a3a"]), 7); g.strokeStyle = "#1f6a2c"; g.lineWidth = 3; g.beginPath(); g.moveTo(128, 210); g.lineTo(ex, ey); g.stroke(); }
});
/** sled livery, u along the hull (0 tail .. 1 nose), v round the belly: black with green and gold stripes */
export const liveryTex = (k = 0) => ctex("jLivery" + k, 512, 128, (g) => {
  const [base, a, b] = k ? ["#2f4fa0", "#f7f5ee", "#d0342e"] : ["#23202a", "#f6c419", "#1f8a3a"];
  g.fillStyle = base; g.fillRect(0, 0, 512, 128);
  for (const y of [30, 98]) { g.fillStyle = a; g.fillRect(0, y - 9, 512, 18); g.fillStyle = b; g.fillRect(0, y + 9, 512, 8); }
  poly(g, [[380, 0], [512, 0], [512, 128], [380, 128], [430, 64]], a); poly(g, [[420, 0], [512, 0], [512, 128], [420, 128], [470, 64]], b); poly(g, [[462, 0], [512, 0], [512, 128], [462, 128], [500, 64]], base);
});
export const umbrellaTex = () => ctex("jUmb", 256, 64, (g) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? "#f7f5ee" : "#e2453c"; g.fillRect(i * 32, 0, 32, 64); } });
export const towelTex = () => ctex("jTowel", 128, 256, (g) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? "#f7f5ee" : "#3fb0c9"; g.fillRect(0, i * 32, 128, 32); } });
export const stripeTex = (key: string, a: string, b: string) => ctex("jStripe" + key, 256, 64, (g) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? a : b; g.fillRect(i * 32, 0, 32, 64); } });
void THREE;
