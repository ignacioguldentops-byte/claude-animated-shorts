// Paul the octopus and the props of "El pulpo" (our own flat 2D drawings, canvas px).
import { Pen, INK, ellPts, rrect, thickAngle } from "./toon";
type P2 = [number, number];
const rad = (d: number) => (d * Math.PI) / 180;
const BODY = "#f0683a", BODY_SH = "#c9452c", SPOT = "#ffa477", SUCK = "#ffe0cc";

/** tapered round stroke with an ink rim */
const taper = (p: Pen, pts: P2[], w0: number, w1: number, fill: string, ol = 8) => {
  const g = p.g; g.lineCap = "round"; g.lineJoin = "round";
  for (const pass of [0, 1]) for (let i = 0; i < pts.length - 1; i++) {
    const w = w0 + (w1 - w0) * (i / Math.max(1, pts.length - 2));
    g.beginPath(); g.moveTo(pts[i][0], pts[i][1]); g.lineTo(pts[i + 1][0], pts[i + 1][1]);
    g.lineWidth = pass ? w : w + ol * 2; g.strokeStyle = pass ? fill : INK; g.stroke();
  }
};
/** one arm: starts at (bx, by) heading a0 (deg, 0 = down, + = to the right), curls by `curl` deg over its length */
const arm = (bx: number, by: number, a0: number, len: number, curl: number, wob: number, n = 16): P2[] => {
  const pts: P2[] = [[bx, by]]; let x = bx, y = by;
  for (let i = 1; i <= n; i++) {
    const s = i / n, a = rad(a0 + curl * Math.pow(s, 1.4) + wob * Math.sin(s * 5) * s);
    x += Math.sin(a) * len / n; y += Math.cos(a) * len / n; pts.push([x, y]);
  }
  return pts;
};
export type PaulO = {
  expr?: "idle" | "happy" | "scared" | "shades" | "wow" | "think" | "eat" | "smug";
  pose?: "idle" | "reachL" | "reachR" | "shrug" | "cheer" | "hide" | "wave";
  /** animation phase (0..1 loops) */ t?: number; look?: number; lookY?: number; medal?: boolean; napkin?: boolean; sweat?: boolean; blink?: boolean; mussel?: boolean;
};
/** Paul on a 800 x 800 canvas, head centre (400, 300) */
export const fxPaul = (p: Pen, o: PaulO = {}) => {
  const t = (o.t ?? 0) * Math.PI * 2, pose = o.pose ?? "idle", expr = o.expr ?? "idle", cx = 400, cy = 300 + (pose === "hide" ? 60 : 0);
  const w = (i: number, k = 1) => 14 * k * Math.sin(t + i * 1.3);
  // [base x, a0, len, curl]
  let A: [number, number, number, number][] = [
    [-112, -78, 250, -70], [-78, -50, 235, -95], [-42, -24, 215, -80], [-14, -8, 200, -60],
    [14, 8, 200, 60], [42, 24, 215, 80], [78, 50, 235, 95], [112, 78, 250, 70],
  ];
  if (pose === "reachL") { A[0] = [-118, -98, 330, 30]; A[1] = [-84, -78, 300, -34]; }
  if (pose === "reachR") { A[7] = [118, 98, 330, -30]; A[6] = [84, 78, 300, 34]; }
  if (pose === "shrug") { A[0] = [-120, -108, 230, -72]; A[7] = [120, 108, 230, 72]; }
  if (pose === "cheer") { A[0] = [-118, -138, 270, 40]; A[7] = [118, 138, 270, -40]; A[1] = [-90, -112, 240, -50]; A[6] = [90, 112, 240, 50]; }
  if (pose === "wave") { A[7] = [118, 132 + w(0, 0.9), 260, -46]; }
  if (pose === "hide") A = A.map(([bx, a0, len, curl]) => [bx * 0.9, a0 * 1.1, len * 0.72, curl * 1.9] as [number, number, number, number]);
  const reach = pose === "reachL" || pose === "reachR";
  const arms = A.map(([bx, a0, len, curl], i) => arm(cx + bx, cy + 118 - Math.abs(bx) * 0.22, a0 + w(i, 0.35), len, curl + w(i + 3), (reach && len > 290 ? 26 : 9) * Math.sin(t + i)));
  // back arms (darker), then front arms with suckers
  for (const i of [1, 6, 3, 4]) taper(p, arms[i], 44, 11, BODY_SH);
  for (const i of [0, 7, 2, 5]) {
    taper(p, arms[i], 46, 14, BODY);
    const a = arms[i], sgn = i < 4 ? 1 : -1;
    for (let k = 3; k < a.length - 1; k += 2) { const dx = a[k + 1][0] - a[k][0], dy = a[k + 1][1] - a[k][1], L = Math.hypot(dx, dy) || 1, ww = 46 - 34 * (k / a.length); p.dot(a[k][0] + sgn * (-dy / L) * ww * 0.22, a[k][1] + sgn * (dx / L) * ww * 0.22, ww * 0.15, SUCK); }
  }
  if (o.mussel) { const e = arms[pose === "reachL" ? 0 : 7][16]; mussel(p, e[0], e[1] - 6, 0.55, 1); }
  // head: tall rounded bean
  const light = -2.2, head: P2[] = [];
  for (let i = 0; i < 72; i++) { const a = (i / 72) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a), k = s < 0 ? 1.06 : 0.9; head.push([cx + 178 * k * c, cy + (s < 0 ? 196 : 150) * s]); }
  p.shadedFill(head, BODY, BODY_SH, light, 180);
  p.clip(head, () => { for (const [x, y, r] of [[-96, -118, 22], [-52, -150, 14], [84, -128, 18], [118, -84, 12], [-128, -62, 11], [30, -166, 10]]) p.ell(cx + x, cy + y, r, r * 0.8, SPOT, 0); });
  p.inkRing(head, 9, thickAngle(light));
  // face
  const ex = 44, ey = cy + 6, lx = (o.look ?? 0) * 13, ly = (o.lookY ?? 0) * 10;
  if (expr === "shades") {
    p.poly(rrect(cx - 104, ey - 30, cx - 6, ey + 30, 14), "#16141c", 7); p.poly(rrect(cx + 6, ey - 30, cx + 104, ey + 30, 14), "#16141c", 7); p.stroke([[cx - 8, ey - 12], [cx + 8, ey - 12]], 8);
    for (const s of [-1, 1]) p.stroke([[cx + s * 72 - 16, ey - 14], [cx + s * 72 - 2, ey + 8]], 6, "rgba(255,255,255,0.5)");
  } else if (expr === "happy" || o.blink) {
    for (const s of [-1, 1]) p.arc(cx + s * ex, ey + 8, 30, 26, 200, 340, 9);
  } else {
    const big = expr === "scared" || expr === "wow" ? 1.2 : 1, rx = 37 * big, ry = 44 * big;
    for (const s of [-1, 1]) {
      p.ell(cx + s * ex * big, ey, rx, ry, "#ffffff", 8);
      if (expr === "wow") { p.clip(ellPts(cx + s * ex * big, ey, rx - 6, ry - 6), () => { p.poly([[cx + s * ex * big - 40, ey - 12], [cx + s * ex * big + 40, ey - 12], [cx + s * ex * big + 40, ey + 12], [cx + s * ex * big - 40, ey + 12]], "#f6c419", 0); }); p.dot(cx + s * ex * big - 10, ey - 18, 6, "#ffffff"); }
      else { const pr = expr === "scared" ? 8 : 15; p.dot(cx + s * ex * big + lx, ey + ly + (expr === "think" ? -10 : 0), pr); p.dot(cx + s * ex * big + lx - pr * 0.35, ey + ly - pr * 0.4 + (expr === "think" ? -10 : 0), pr * 0.3, "#ffffff"); }
    }
    if (expr === "smug") for (const s of [-1, 1]) p.poly([[cx + s * ex - 44, ey - 52], [cx + s * ex + 44, ey - 52], [cx + s * ex + 44, ey - 10], [cx + s * ex - 44, ey - 14]], BODY, 0), p.stroke([[cx + s * ex - 40, ey - 13], [cx + s * ex + 40, ey - 10]], 8);
  }
  const my = cy + 76;
  if (expr === "happy" || expr === "smug") p.arc(cx, my - 14, 34, 24, 20, 160, 8);
  else if (expr === "scared") { const pts: P2[] = []; for (let i = 0; i <= 12; i++) pts.push([cx - 34 + i * 5.7, my + 5 * Math.sin(i * 1.6)]); p.stroke(pts, 7); }
  else if (expr === "eat" || expr === "wow") p.ell(cx, my, 18, expr === "wow" ? 22 : 15, "#7a1f2a", 7);
  else if (expr === "think") p.stroke([[cx - 20, my + 2], [cx + 22, my - 6]], 8);
  else p.arc(cx, my - 10, 22, 14, 25, 155, 8);
  if (o.sweat) for (const [x, y] of [[-150, -70], [158, -30]]) p.poly([[cx + x, cy + y - 26], [cx + x + 15, cy + y + 6], [cx + x, cy + y + 18], [cx + x - 15, cy + y + 6]], "#bfe6ff", 6);
  if (o.napkin) p.poly([[cx - 66, cy + 128], [cx + 66, cy + 128], [cx, cy + 232]], "#fbfbf6", 8);
  if (o.medal) { p.stroke([[cx - 70, cy + 120], [cx, cy + 196], [cx + 70, cy + 120]], 20, INK); p.stroke([[cx - 70, cy + 120], [cx, cy + 196], [cx + 70, cy + 120]], 11, "#d0442e"); p.ell(cx, cy + 210, 34, 34, "#f2c64a", 8); p.ell(cx, cy + 210, 19, 19, "#ffe9a0", 4); }
};

/** mussel: dark shell, orange meat when open (0..1) */
const mussel = (p: Pen, x: number, y: number, k = 1, open = 1) => {
  const sh = (dy: number, fill: string) => p.poly([[x - 46 * k, y + dy], [x - 20 * k, y - 20 * k + dy], [x + 24 * k, y - 22 * k + dy], [x + 48 * k, y + 2 * k + dy], [x + 18 * k, y + 16 * k + dy], [x - 22 * k, y + 15 * k + dy]], fill, 6 * k);
  if (open > 0.1) { sh(8 * k, "#1d2440"); p.ell(x + 2 * k, y + 2 * k, 26 * k, 11 * k, "#f29a3a", 4 * k); sh(-16 * k * open, "#2c3760"); }
  else sh(0, "#2c3760");
  p.stroke([[x - 24 * k, y - 8 * k - 16 * k * open], [x + 10 * k, y - 13 * k - 16 * k * open]], 4 * k, "#5a6aa0");
};
export const fxMussel = (p: Pen, open = 1) => mussel(p, 150, 110, 2, open);

export type FlagK = "es" | "de" | "nl" | "en" | "ar" | "gh" | "au";
const lum = (h: string) => { const n = parseInt(h.slice(1), 16), v = Math.round(0.3 * (n >> 16) + 0.59 * ((n >> 8) & 255) + 0.11 * (n & 255)).toString(16).padStart(2, "0"); return "#" + v + v + v; };
/** flag in the rect; grey = how an octopus sees it (no hue, only brightness) */
export const flag = (p: Pen, k: FlagK, x: number, y: number, w: number, h: number, grey = false, ol = 7) => {
  const C = (c: string) => (grey ? lum(c) : c), bar = (y0: number, y1: number, c: string) => p.poly([[x, y + h * y0], [x + w, y + h * y0], [x + w, y + h * y1], [x, y + h * y1]], C(c), 0);
  if (k === "es") { bar(0, 0.25, "#c8102e"); bar(0.25, 0.75, "#f6c419"); bar(0.75, 1, "#c8102e"); if (!grey) { p.poly(rrect(x + w * 0.24, y + h * 0.36, x + w * 0.37, y + h * 0.62, 4), "#b5462c", 2.5); p.dot(x + w * 0.305, y + h * 0.36, w * 0.03, "#d9a53a"); } }
  else if (k === "de") { bar(0, 1 / 3, "#1c1a20"); bar(1 / 3, 2 / 3, "#d0202a"); bar(2 / 3, 1, "#f6c419"); }
  else if (k === "nl") { bar(0, 1 / 3, "#b8202e"); bar(1 / 3, 2 / 3, "#ffffff"); bar(2 / 3, 1, "#24468e"); }
  else if (k === "en") { bar(0, 1, "#ffffff"); p.poly([[x + w * 0.42, y], [x + w * 0.58, y], [x + w * 0.58, y + h], [x + w * 0.42, y + h]], C("#c8102e"), 0); bar(0.38, 0.62, "#c8102e"); }
  else if (k === "ar") { bar(0, 1 / 3, "#78b4e6"); bar(1 / 3, 2 / 3, "#ffffff"); bar(2 / 3, 1, "#78b4e6"); p.dot(x + w / 2, y + h / 2, h * 0.1, C("#f2b632")); }
  else if (k === "gh") { bar(0, 1 / 3, "#c8102e"); bar(1 / 3, 2 / 3, "#f6c419"); bar(2 / 3, 1, "#1f7a3a"); p.poly([...Array(10)].map((_, i) => { const a = -Math.PI / 2 + (i * Math.PI) / 5, r = h * (i % 2 ? 0.06 : 0.14); return [x + w / 2 + r * Math.cos(a), y + h / 2 + r * Math.sin(a)] as P2; }), C("#1c1a20"), 0); }
  else { bar(0, 1, "#24468e"); p.poly([[x, y], [x + w * 0.45, y], [x + w * 0.45, y + h * 0.5], [x, y + h * 0.5]], C("#2f55a8"), 0); p.stroke([[x, y], [x + w * 0.45, y + h * 0.5]], h * 0.07, C("#ffffff")); p.stroke([[x + w * 0.45, y], [x, y + h * 0.5]], h * 0.07, C("#ffffff")); for (const [sx, sy] of [[0.72, 0.25], [0.86, 0.45], [0.74, 0.72], [0.62, 0.5], [0.23, 0.76]]) p.dot(x + w * sx, y + h * sy, h * 0.045, C("#ffffff")); }
  if (ol) p.poly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], null, ol);
};
/** big flag card (600 x 400); glow marks the bright stripe for the octopus-vision shot */
export const fxFlag = (p: Pen, k: FlagK, grey = false, glow = 0) => {
  flag(p, k, 20, 20, 560, 360, grey, 10);
  if (glow > 0 && k === "es") { const g = p.g; g.save(); g.globalAlpha = glow; g.fillStyle = "#fff6c0"; g.fillRect(25, 20 + 90 + 4, 550, 172); g.restore(); p.poly([[20, 20], [580, 20], [580, 380], [20, 380]], null, 10); }
};

/** the clear box with a flag on its front and a mussel inside (420 x 480). lid 0..1 = how far it is open */
export const fxBox = (p: Pen, k: FlagK, lid = 0, hasMussel = true, grey = false) => {
  const g = p.g, x0 = 50, x1 = 370, y0 = 150, y1 = 440;
  g.fillStyle = "rgba(205,238,250,0.42)"; g.fillRect(x0, y0, x1 - x0, y1 - y0);
  if (hasMussel) mussel(p, 210, 196, 0.9, 0);
  flag(p, k, 86, 236, 248, 166, grey, 7);
  p.poly([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], null, 9);
  p.stroke([[x0 + 18, y0 + 20], [x0 + 18, y1 - 30]], 7, "rgba(255,255,255,0.7)"); p.stroke([[x1 - 22, y0 + 40], [x1 - 22, y0 + 110]], 6, "rgba(255,255,255,0.5)");
  // lid hinged on the left
  const a = -lid * 1.25, c = Math.cos(a), s = Math.sin(a), L = (x: number, y: number): P2 => [x0 - 8 + (x * c - y * s), y0 - 6 + (x * s + y * c)];
  p.poly([L(0, -22), L(336, -22), L(336, 0), L(0, 0)], "rgba(190,232,248,0.85)", 8);
  p.ell(L(168, -30)[0], L(168, -30)[1], 16, 10, "#e8c45a", 6);
};
/** green tick / red cross stamp (200 x 200) */
export const fxTick = (p: Pen, ok = true) => {
  p.ell(100, 100, 84, 84, ok ? "#4fc36a" : "#e2453c", 10);
  if (ok) p.stroke([[60, 104], [90, 134], [144, 70]], 22, "#ffffff"); else { p.stroke([[66, 66], [134, 134]], 22, "#ffffff"); p.stroke([[134, 66], [66, 134]], 22, "#ffffff"); }
};
/** octopus pictogram (simple, for signs/banners), centre (x, y), size k */
const picto = (p: Pen, x: number, y: number, k: number, col: string, eyes = true) => {
  for (let i = 0; i < 6; i++) { const a0 = -50 + i * 20, pts = arm(x + (i - 2.5) * 13 * k, y + 22 * k, a0, 62 * k, a0 * 1.5, 0, 8); p.stroke(pts, 11 * k, col); }
  p.ell(x, y - 8 * k, 44 * k, 46 * k, col, 0);
  if (eyes) for (const s of [-1, 1]) { p.dot(x + s * 15 * k, y - 4 * k, 9 * k, "#ffffff"); p.dot(x + s * 15 * k, y - 4 * k, 4 * k, INK); }
};
/** "no octopus today": wooden board hanging from a string, prohibition circle over the pictogram (400 x 460) */
export const fxNoPulpo = (p: Pen) => {
  p.stroke([[110, 100], [200, 18], [290, 100]], 6, "#6a4a2c");
  p.poly(rrect(30, 90, 370, 440, 18), "#f3e2c0", 10); p.stroke([[50, 130], [350, 126]], 3, "rgba(120,80,40,0.35)"); p.stroke([[50, 400], [350, 404]], 3, "rgba(120,80,40,0.35)");
  picto(p, 200, 262, 1.55, "#e0603a");
  p.ell(200, 265, 138, 138, null, 0); const g = p.g; g.lineWidth = 26; g.strokeStyle = "#d0202a"; g.beginPath(); g.arc(200, 265, 132, 0, 7); g.stroke();
  p.stroke([[108, 172], [292, 358]], 26, "#d0202a");
};
/** round shop sign with the pictogram (400 x 400) */
export const fxShopSign = (p: Pen) => { p.ell(200, 200, 186, 186, "#24468e", 12); p.ell(200, 200, 158, 158, "#fbf3e2", 6); picto(p, 200, 196, 1.75, "#e0603a"); };
/** Paul's portrait in a golden frame on an easel, with a medal on the corner (560 x 760) */
export const fxPortrait = (p: Pen, medal = true) => {
  p.stroke([[150, 520], [70, 750]], 16, "#6a4a2c"); p.stroke([[410, 520], [490, 750]], 16, "#6a4a2c"); p.stroke([[280, 500], [280, 740]], 14, "#5a3d24");
  p.poly(rrect(60, 40, 500, 540, 14), "#e9b93c", 12); p.poly(rrect(102, 82, 458, 498, 6), "#9fd8ee", 8);
  const g = p.g; g.save(); g.beginPath(); g.rect(106, 86, 348, 408); g.clip(); g.translate(280 - 400 * 0.5, 96); g.scale(0.5, 0.5); fxPaul(p, { expr: "happy", pose: "wave" }); g.restore();
  p.poly(rrect(102, 82, 458, 498, 6), null, 8);
  if (medal) { p.stroke([[420, 60], [452, 190], [488, 64]], 22, INK); p.stroke([[420, 60], [452, 190], [488, 64]], 13, "#d0442e"); p.ell(452, 212, 40, 40, "#f2c64a", 9); p.ell(452, 212, 22, 22, "#ffe9a0", 4); }
};
/** what the TV / big screen shows: the tank with the two boxes and Paul (800 x 450). side: -1 left box, 0 centre, 1 right box */
export const fxScreen = (p: Pen, left: FlagK, right: FlagK, side: number, t = 0, expr: PaulO["expr"] = "idle") => {
  const g = p.g, gr = g.createLinearGradient(0, 0, 0, 450); gr.addColorStop(0, "#5fd0e8"); gr.addColorStop(1, "#1d6fb0"); g.fillStyle = gr; g.fillRect(0, 0, 800, 450);
  g.fillStyle = "#e8d8a8"; g.fillRect(0, 392, 800, 58);
  for (const [x, k] of [[60, left], [520, right]] as [number, FlagK][]) { g.save(); g.translate(x, 150); g.scale(0.56, 0.56); fxBox(p, k, (side < 0 && x < 300) || (side > 0 && x > 300) ? 1 : 0); g.restore(); }
  g.save(); g.translate(400 + side * 150 - 400 * 0.42, 130); g.scale(0.42, 0.42); fxPaul(p, { t, expr, pose: side < 0 ? "reachL" : side > 0 ? "reachR" : "idle", look: side }); g.restore();
  p.poly([[0, 0], [800, 0], [800, 450], [0, 450]], null, 14);
};
/** small TV set for Manolo's counter (520 x 440); the screen itself is a separate glowing card */
export const fxTV = (p: Pen) => {
  p.stroke([[200, 60], [140, 6]], 7, INK); p.stroke([[300, 60], [370, 10]], 7, INK);
  p.poly(rrect(20, 56, 500, 410, 26), "#8a5a3a", 11); p.poly(rrect(48, 84, 392, 380, 16), "#1c2030", 8);
  for (const y of [120, 190]) p.ell(446, y, 22, 22, "#e8dcc0", 6); for (let i = 0; i < 5; i++) p.stroke([[420, 260 + i * 22], [472, 260 + i * 22]], 6, "#5a3a24");
  p.stroke([[90, 418], [70, 436]], 12, INK); p.stroke([[430, 418], [450, 436]], 12, INK);
};
/** cooked octopus hanging from the hook, steaming (400 x 560): no face, just a purple bundle of curled arms */
export const fxCooked = (p: Pen, t = 0) => {
  const C = "#b8517c", D = "#8e3760";
  for (let i = 0; i < 7; i++) { const a0 = -42 + i * 14, pts = arm(200 + (i - 3) * 20, 250, a0, 250, a0 * 3.2 + 30 * Math.sin(t + i), 6); taper(p, pts, 36, 12, i % 2 ? D : C); if (!(i % 2)) for (let k = 3; k < pts.length - 1; k += 2) p.dot(pts[k][0] + 5, pts[k][1], 4.5, "#f6dfe6"); }
  p.ell(200, 190, 88, 100, C, 9); p.clip(ellPts(200, 190, 84, 96), () => p.ell(240, 220, 80, 90, D, 0)); p.ell(200, 190, 88, 100, null, 9);
  p.stroke([[200, 96], [200, 20]], 9, "#b9c0c8"); p.arc(200, 100, 16, 18, 0, 200, 9, "#b9c0c8");
};
/** wooden plate of pulpo á feira seen from the front-top (560 x 300): slices, paprika, oil, toothpicks */
export const fxPlate = (p: Pen) => {
  p.ell(280, 170, 262, 112, "#b97a3e", 11); p.ell(280, 162, 222, 88, "#dba566", 6);
  for (let i = 0; i < 13; i++) { const a = i * 2.4, r = 40 + (i % 4) * 34, x = 280 + r * 1.7 * Math.cos(a) * 0.62, y = 160 + r * 0.62 * Math.sin(a); p.ell(x, y, 34, 22, "#f4e6dc", 5); p.arc(x, y, 34, 22, 160, 380, 8, "#a8456e"); p.dot(x - 6, y - 2, 3, "#d0442e"); p.dot(x + 10, y + 4, 3, "#d0442e"); }
  for (const [x, y] of [[190, 120], [330, 100], [280, 180]]) { p.stroke([[x, y], [x + 16, y - 88]], 5, "#e9d6a8"); }
  for (let i = 0; i < 26; i++) p.dot(110 + ((i * 97) % 340), 110 + ((i * 53) % 110), 2.6, "#d0442e");
};
/** bubble (120 x 120) */
export const fxBubble = (p: Pen) => { p.ell(60, 60, 44, 44, "rgba(210,244,255,0.35)", 0); const g = p.g; g.lineWidth = 6; g.strokeStyle = "rgba(235,250,255,0.95)"; g.beginPath(); g.arc(60, 60, 44, 0, 7); g.stroke(); p.arc(60, 60, 30, 30, 200, 260, 8, "#ffffff"); };
/** seaweed frond (200 x 600), sways with t */
export const fxWeed = (p: Pen, t = 0, col = "#2f9a6a") => {
  for (const [bx, ph, h] of [[70, 0, 520], [110, 1.3, 430], [140, 2.2, 330]]) { const pts: P2[] = []; for (let i = 0; i <= 14; i++) pts.push([bx + 26 * Math.sin(i * 0.7 + ph + t) * (i / 14), 590 - (i / 14) * h]); taper(p, pts, 30, 8, col, 6); }
};
/** rock (500 x 300) */
export const fxRock = (p: Pen, seed = 0) => {
  const pts: P2[] = [[20, 290], [50, 150 - seed * 20], [150, 60 + seed * 30], [270, 30], [380, 90 - seed * 20], [470, 190], [485, 290]];
  p.poly(pts, "#7c86a8", 10); p.clip(pts, () => { p.poly([[270, 30], [380, 90], [470, 190], [485, 290], [300, 290], [330, 140]], "#5f6890", 0); p.ell(150, 150, 46, 26, "#93a0c2", 0); });
  p.poly(pts, null, 10); for (const [x, y, r] of [[120, 250, 20], [400, 262, 16]]) p.ell(x, y, r, r * 0.6, "#e07a9a", 5);
};
/** light shafts in the water (400 x 800, soft additive) */
export const fxRays = (p: Pen) => { const g = p.g; for (const [x, w] of [[60, 60], [170, 90], [300, 50]]) { const gr = g.createLinearGradient(0, 0, 0, 800); gr.addColorStop(0, "rgba(220,255,255,0.5)"); gr.addColorStop(1, "rgba(220,255,255,0)"); g.fillStyle = gr; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + w, 0); g.lineTo(x + w + 90, 800); g.lineTo(x + 40, 800); g.closePath(); g.fill(); } };
/** banknote (160 x 100) */
export const fxBill = (p: Pen) => { p.poly(rrect(8, 14, 152, 86, 8), "#8fd69a", 6); p.ell(80, 50, 20, 20, "#c9f0cf", 4); p.stroke([[24, 30], [44, 30]], 5, "#3f8a4a"); p.stroke([[116, 70], [136, 70]], 5, "#3f8a4a"); };
/** steam wisp (200 x 400) */
export const fxSteam = (p: Pen, t = 0) => { for (const [x, ph] of [[70, 0], [130, 1.7]]) { const pts: P2[] = []; for (let i = 0; i <= 12; i++) pts.push([x + 22 * Math.sin(i * 0.8 + ph + t), 380 - i * 29]); p.stroke(pts, 16, "rgba(255,255,255,0.5)"); } };
/** frying pan with a fork crossed (for the angry mob), 300 x 300 */
export const fxGrill = (p: Pen) => { p.stroke([[70, 250], [150, 170]], 20, INK); p.stroke([[70, 250], [150, 170]], 10, "#3a2a22"); p.ell(190, 120, 96, 86, "#4a4f5c", 10); p.ell(190, 120, 70, 62, "#2c303a", 0); p.arc(190, 120, 82, 72, 200, 250, 8, "#aab2c0"); };
/** Paul in a round glass bowl on the table (800 x 800) */
export const fxBowlPaul = (p: Pen, o: PaulO = {}) => {
  const g = p.g, bowl = ellPts(400, 440, 330, 320);
  p.poly([[250, 742], [550, 742], [520, 700], [280, 700]], "#cfeaf6", 9);
  g.fillStyle = "rgba(200,236,250,0.5)"; g.beginPath(); bowl.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fill();
  p.clip(bowl, () => { const gr = g.createLinearGradient(0, 230, 0, 760); gr.addColorStop(0, "#7fdcf2"); gr.addColorStop(1, "#2f8fd0"); g.fillStyle = gr; g.fillRect(60, 230, 680, 540);
    g.save(); g.translate(400 - 400 * 0.6, 250); g.scale(0.6, 0.6); fxPaul(p, o); g.restore(); });
  p.poly(bowl, null, 10); p.ell(400, 150, 210, 40, "rgba(220,244,252,0.7)", 9);
  p.arc(400, 440, 290, 280, 200, 250, 12, "rgba(255,255,255,0.8)"); p.arc(400, 440, 290, 280, 300, 320, 10, "rgba(255,255,255,0.6)");
};
/** gold coin with the octopus pictogram (160 x 160) */
export const fxPulpoCoin = (p: Pen) => { p.ell(80, 80, 68, 68, "#f2c64a", 9); p.ell(80, 80, 52, 52, "#ffe08a", 4); picto(p, 80, 82, 0.62, "#c98a1c", false); };
