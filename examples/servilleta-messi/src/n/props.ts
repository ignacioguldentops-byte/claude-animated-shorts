// Our own flat 2D props for the Maradona short (ball, trophy, plate stacks, centre-of-gravity marker), drawn in canvas px.
import { Pen, INK } from "./toon";

/** football on a 256 x 256 canvas: white, five dark patches, plum ink */
export const fxBall = (p: Pen, spin = 0) => {
  const c = 128, R = 104;
  p.ell(c, c, R, R, "#fbfaf6", 14);
  p.clip([...Array(49)].map((_, i) => [c + R * Math.cos((i / 48) * Math.PI * 2), c + R * Math.sin((i / 48) * Math.PI * 2)] as [number, number]), () => {
    const pent = (x: number, y: number, r: number) => p.poly([...Array(5)].map((_, i) => {
      const a = spin + (i / 5) * Math.PI * 2 - Math.PI / 2; return [x + r * Math.cos(a), y + r * Math.sin(a)] as [number, number];
    }), "#2a2230", 0);
    pent(c, c, 30);
    for (let i = 0; i < 5; i++) { const a = spin + (i / 5) * Math.PI * 2 + Math.PI / 2; pent(c + 92 * Math.cos(a), c + 92 * Math.sin(a), 30); }
    // soft crescent on the shade side
    const g = p.g, gr = g.createRadialGradient(c - 30, c - 34, 20, c, c, R * 1.05);
    gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(0.75, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(70,60,120,0.35)");
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  });
  p.ell(c, c, R, R, null, 14);
};

/** generic golden cup (not any real trophy) on a 300 x 500 canvas */
export const fxCup = (p: Pen) => {
  const G = "#f2c443", D = "#c8901f";
  p.poly([[70, 470], [230, 470], [215, 420], [85, 420]], "#6b3d22", 9);
  p.poly([[110, 420], [190, 420], [170, 330], [130, 330]], G, 9);
  p.poly([[60, 90], [240, 90], [225, 210], [175, 300], [125, 300], [75, 210]], G, 10);
  p.poly([[150, 100], [225, 100], [214, 205], [172, 285], [150, 290]], D, 0);
  p.arc(52, 160, 40, 55, 100, 260, 16, INK); p.arc(52, 160, 40, 55, 100, 260, 9, G);
  p.arc(248, 160, 40, 55, -80, 80, 16, INK); p.arc(248, 160, 40, 55, -80, 80, 9, G);
  p.ell(150, 90, 92, 18, "#ffe08a", 9);
  p.ell(110, 170, 10, 34, "#fff6c8", 0);
};

/** stack of n plates on a 300 x 900 canvas (plates bottom at y = 880), leaning by `lean` radians about the base */
export const fxPlates = (p: Pen, n: number, lean: number) => {
  for (let i = 0; i < n; i++) {
    const y = 880 - i * 26, x = 150 + Math.sin(lean) * (880 - y) * 1.0 + (i % 2 ? 2 : -2);
    p.ell(x, y, 120, 20, i % 2 ? "#f7f4ec" : "#eceae2", 7);
    p.ell(x, y - 4, 70, 9, null, 3);
  }
};

/** white downward arrow: "low to the ground", 200 x 300 canvas */
export const fxCog = (p: Pen) => {
  p.line([[100, 40], [100, 210]], "#ffffff", 22);
  p.poly([[50, 180], [150, 180], [100, 275]], "#ffffff", 10);
};

/** confetti speck, 64 x 64 */
export const fxConfetti = (p: Pen, col: string) => { p.poly([[10, 22], [54, 14], [56, 40], [12, 48]], col, 4); };

/** speed lines, 400 x 200 */
export const fxSpeed = (p: Pen) => {
  for (let i = 0; i < 4; i++) p.stroke([[40 + i * 20, 40 + i * 40], [360 - i * 30, 40 + i * 40]], 10, "#ffffff");
};

/** "?" marks: the referee saw nothing, 200 x 260 */
export const fxQ = (p: Pen) => {
  p.arc(100, 80, 55, 50, 180, 400, 34, INK); p.arc(100, 80, 55, 50, 180, 400, 20, "#ffffff");
  p.line([[124, 128], [100, 150], [100, 178]], "#ffffff", 20);
  p.ell(100, 225, 17, 17, "#ffffff", 7);
};

/** camera flash in the crowd / sparkle: four-point white star, 128 x 128 */
export const fxFlash = (p: Pen) => {
  const g = p.g; g.fillStyle = "#ffffff"; g.beginPath();
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2, r = i % 2 ? 9 : 60; g.lineTo(64 + r * Math.cos(a), 64 + r * Math.sin(a)); }
  g.closePath(); g.fill(); g.beginPath(); g.arc(64, 64, 16, 0, Math.PI * 2); g.fill();
};

/** sleeping "z", 120 x 120 */
export const fxZ = (p: Pen) => { p.line([[30, 30], [90, 30], [30, 90], [90, 90]], "#ffffff", 13); };

/** height-difference bracket: two ticks and a double arrow between them, 120 x 400 */
export const fxBracket = (p: Pen) => {
  p.line([[20, 30], [100, 30]], "#ffffff", 12); p.line([[20, 370], [100, 370]], "#ffffff", 12); p.line([[60, 60], [60, 340]], "#ffffff", 10);
  p.poly([[36, 80], [84, 80], [60, 44]], "#ffffff", 6); p.poly([[36, 320], [84, 320], [60, 356]], "#ffffff", 6);
};

/** sweat drops flying off, 200 x 200 */
export const fxSweat = (p: Pen) => {
  for (const [x, y, r] of [[50, 60, 0.5], [120, 40, 0], [160, 100, -0.5]] as const) p.poly([[x, y - 26], [x + 13, y + 6], [x, y + 20], [x - 13, y + 6]].map(([a, b]) => [x + (a - x) * Math.cos(r) - (b - y) * Math.sin(r), y + (a - x) * Math.sin(r) + (b - y) * Math.cos(r)] as [number, number]), "#9fd4ff", 6);
};

// ---------------- props for "The Hair" ----------------
/** one curly black hair, 200 x 300 */
export const fxHair = (p: Pen) => { const h: [number, number][] = []; for (let i = 0; i <= 40; i++) { const t = i / 40; h.push([100 + 38 * Math.sin(t * 9.5) * (0.5 + 0.5 * t), 270 - t * 240]); } p.stroke(h, 9, "#120d0b"); };
/** fly, 120 x 100 (wings flap with t) */
export const fxFly = (p: Pen, t: number) => { const w = t ? 20 : 6; p.ell(42, 38 - w * 0.3, 20, 9 + w * 0.5, "#dff1ff", 4); p.ell(74, 38 - w * 0.3, 20, 9 + w * 0.5, "#dff1ff", 4); p.ell(58, 58, 20, 15, "#2a2430", 0); p.dot(74, 54, 5, "#d9463f"); };
/** halo ring, 400 x 160 */
export const fxHalo = (p: Pen) => { p.ell(200, 80, 170, 52, null, 0); const g = p.g; g.lineWidth = 34; g.strokeStyle = "#241726"; g.beginPath(); g.ellipse(200, 80, 170, 52, 0, 0, 6.3); g.stroke(); g.lineWidth = 22; g.strokeStyle = "#ffd75a"; g.stroke(); g.lineWidth = 6; g.strokeStyle = "#fff6c8"; g.beginPath(); g.ellipse(200, 76, 170, 52, 0, 3.4, 6.0); g.stroke(); };
/** candle flame, 80 x 120 */
export const fxFlame = (p: Pen, t: number) => { const s = 4 * Math.sin(t); p.poly([[40 + s, 8], [58, 60], [52, 96], [40, 108], [28, 96], [22, 60]], "#ffb02e", 0); p.poly([[40 + s * 0.6, 44], [49, 76], [40, 100], [31, 76]], "#fff3b0", 0); };
/** small bouquet, 260 x 300 */
export const fxFlowers = (p: Pen) => {
  for (const [x, y] of [[80, 150], [130, 110], [180, 150], [105, 190], [155, 195]] as const) p.stroke([[130, 290], [x, y]], 8, "#3f8a4a");
  for (const [x, y, c] of [[80, 140, "#f25c7a"], [130, 100, "#fbfbf6"], [182, 140, "#ffd75a"], [104, 186, "#62b5e5"], [158, 190, "#f25c7a"]] as const) { for (let i = 0; i < 6; i++) p.ell(x + 22 * Math.cos(i * 1.047), y + 22 * Math.sin(i * 1.047), 16, 16, c, 5); p.ell(x, y, 12, 12, "#e9a52c", 4); }
};
/** cobweb in a corner, 300 x 300 (corner at top-left) */
export const fxWeb = (p: Pen) => { for (let i = 0; i < 6; i++) { const a = (i / 5) * Math.PI / 2; p.stroke([[6, 6], [6 + 280 * Math.cos(a), 6 + 280 * Math.sin(a)]], 4, "#f4f0f8"); } for (const r of [70, 130, 190, 250]) { const pts: [number, number][] = []; for (let i = 0; i < 6; i++) { const a = (i / 5) * Math.PI / 2, rr = r * (i % 2 ? 0.93 : 1); pts.push([6 + rr * Math.cos(a), 6 + rr * Math.sin(a)]); } p.stroke(pts, 3.5, "#f4f0f8"); } };
/** empty trophy pedestal with a cobweb, 300 x 420 */
export const fxPedestal = (p: Pen) => {
  p.poly([[40, 410], [260, 410], [240, 360], [60, 360]], "#8a8496", 9); p.poly([[70, 360], [230, 360], [222, 130], [78, 130]], "#b9b4c4", 9); p.poly([[50, 130], [250, 130], [238, 92], [62, 92]], "#d6d2de", 9);
  p.stroke([[100, 170], [100, 330]], 7, "#8a8496"); p.stroke([[200, 170], [200, 330]], 7, "#8a8496");
  for (let i = 0; i < 5; i++) p.stroke([[150, 92], [70 + i * 40, 20 + Math.abs(i - 2) * 16]], 3.5, "#f4f0f8"); p.stroke([[78, 52], [110, 34], [150, 26], [190, 34], [224, 52]], 3.5, "#f4f0f8"); p.stroke([[100, 70], [150, 58], [200, 70]], 3.5, "#f4f0f8");
};
/** airliner, side view flying right, 1200 x 420 (white, sky-blue cheat line, lit windows) */
export const fxPlane = (p: Pen) => {
  p.poly([[640, 250], [470, 400], [400, 400], [520, 250]], "#d9dde6", 10);                                   // far wing
  p.poly([[120, 170], [40, 40], [110, 40], [240, 170]], "#62b5e5", 10);                                     // tail fin
  const body: [number, number][] = [[60, 190], [130, 160], [900, 150], [1040, 160], [1130, 200], [1150, 232], [1100, 262], [960, 280], [200, 280], [90, 240]];
  p.poly(body, "#f7f5ee", 12);
  p.clip(body, () => { p.band([[60, 246], [1160, 246]], "#62b5e5", 20, 0, "butt"); p.band([[60, 268], [1160, 268]], "#2b4fa8", 12, 0, "butt"); });
  for (let i = 0; i < 22; i++) p.poly([[230 + i * 34, 196], [250 + i * 34, 196], [250 + i * 34, 222], [230 + i * 34, 222]], i % 5 === 3 ? "#8fa3c8" : "#ffe08a", 4);
  p.poly([[1040, 186], [1096, 190], [1116, 210], [1050, 210]], "#8fd0f2", 5);                                  // cockpit
  p.poly([[560, 262], [360, 420], [280, 420], [440, 262]], "#eceae2", 10);                                     // near wing
  p.ell(470, 330, 62, 30, "#d9dde6", 9); p.ell(520, 330, 16, 26, "#2c2a38", 6);
  p.poly([[150, 220], [60, 270], [110, 276], [220, 236]], "#eceae2", 8);
};
/** arm + dot hand reaching down, 200 x 600 (hand at the bottom centre) */
export const fxHand = (p: Pen) => { p.stroke([[150, 0], [130, 300], [100, 540]], 30, "#3a3848"); p.dot(100, 548, 40, "#241726"); };
/** clock face with hands, 240 x 240 */
export const fxClock = (p: Pen, a: number) => {
  p.ell(120, 120, 104, 104, "#fff7e6", 12);
  for (let i = 0; i < 12; i++) { const t = (i * Math.PI) / 6; p.stroke([[120 + 78 * Math.cos(t), 120 + 78 * Math.sin(t)], [120 + 90 * Math.cos(t), 120 + 90 * Math.sin(t)]], i % 3 ? 5 : 9); }
  p.stroke([[120, 120], [120 + 74 * Math.cos(a), 120 + 74 * Math.sin(a)]], 8); p.stroke([[120, 120], [120 + 46 * Math.cos(a / 12), 120 + 46 * Math.sin(a / 12)]], 11); p.dot(120, 120, 9);
};
/** espresso cup on a saucer with steam, 300 x 300 */
export const fxEspresso = (p: Pen, t: number) => {
  p.ell(150, 250, 130, 30, "#fbf8f0", 9); p.poly([[70, 150], [230, 150], [212, 244], [88, 244]], "#fffdf6", 9); p.arc(238, 190, 30, 34, -80, 80, 12); p.ell(150, 150, 80, 20, "#4a2a18", 8); p.ell(140, 147, 44, 9, "#b07a4a", 0);
  for (const d of [-34, 0, 34]) { const s: [number, number][] = []; for (let i = 0; i <= 8; i++) s.push([150 + d + 12 * Math.sin(i * 0.9 + t + d), 122 - i * 13]); p.stroke(s, 8, "#ffffff"); }
};
/** gold coin, 120 x 120 */
export const fxCoin = (p: Pen) => { p.ell(60, 60, 50, 50, "#f2c64a", 9); p.ell(60, 60, 32, 32, null, 5); };
/** soft warm light patch (door light on the floor), 256 x 256 */
export const fxPatch = (p: Pen) => { const g = p.g, gr = g.createRadialGradient(128, 128, 10, 128, 128, 128); gr.addColorStop(0, "rgba(255,244,214,0.75)"); gr.addColorStop(0.6, "rgba(255,244,214,0.35)"); gr.addColorStop(1, "rgba(255,244,214,0)"); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); };
/** moon, 256 x 256 */
export const fxMoon = (p: Pen) => { p.ell(128, 128, 110, 110, "#fff6d8", 0); for (const [x, y, r] of [[90, 100, 22], [160, 150, 30], [140, 76, 12]] as const) p.ell(x, y, r, r, "#f0e2b6", 0); };
/** tumbleweed, 200 x 200 */
export const fxTumble = (p: Pen, a: number) => { for (let i = 0; i < 9; i++) { const t = a + i * 0.7; p.arc(100 + 14 * Math.cos(t * 1.3), 100 + 14 * Math.sin(t * 1.7), 60 + 10 * Math.sin(i), 54 + 10 * Math.cos(i), (t * 57) % 360, ((t * 57) % 360) + 250, 5, "#9a7a4a"); } };

// ---------------- "La servilleta" props ----------------
const hs2 = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
/** paper napkin seen flat, 400 x 400: embossed border, folds; `w` 0..1 = how much is written, `n` = signatures (0..3).
 *  The writing is scribble (no legible text). */
export const fxNapkin = (p: Pen, w = 0, n = 0, crumple = 0) => {
  const e: [number, number][] = [];
  for (let i = 0; i < 40; i++) { const t = i / 40, side = Math.floor(t * 4), u = (t * 4) % 1, j = 4 * Math.sin(i * 2.3) + crumple * 10 * Math.sin(i * 1.7);
    const pts = [[30 + u * 340, 30 + j], [370 + j, 30 + u * 340], [370 - u * 340, 370 + j], [30 + j, 370 - u * 340]]; e.push(pts[side] as [number, number]); }
  p.poly(e, "#fffdf8", 9);
  for (let i = 0; i < 30; i++) { const a = (i / 30) * Math.PI * 2; p.dot(200 + 150 * Math.cos(a), 200 + 150 * Math.sin(a), 3.2, "#efe6d6"); }
  p.stroke([[200, 40], [200, 360]], 2.5, "#ebe2d2"); p.stroke([[40, 200], [360, 200]], 2.5, "#ebe2d2");
  const ink = "#1f3f9a", lines = 7, tot = w * lines;
  for (let L = 0; L < lines; L++) {
    const fr = Math.max(0, Math.min(1, tot - L)); if (fr <= 0) break;
    const y = 82 + L * 30, x0 = 62, x1 = 62 + (L === lines - 1 ? 170 : 276) * fr, pts: [number, number][] = [];
    for (let x = x0; x <= x1; x += 5) pts.push([x, y + 5 * Math.sin(x * 0.45 + L * 3) + 2 * Math.sin(x * 1.3)]);
    if (pts.length > 1) p.stroke(pts, 3.4, ink);
  }
  for (let k = 0; k < Math.min(3, n); k++) {
    const cx = 92 + k * 108, cy = 322, pts: [number, number][] = [];
    for (let i = 0; i <= 26; i++) { const t = i / 26; pts.push([cx - 38 + t * 76, cy + 14 * Math.sin(t * 9 + k * 2) * (1 - t * 0.6) - 8 * t]); }
    p.stroke(pts, 3.6, ["#1f3f9a", "#241726", "#a5003c"][k]);
  }
};
/** golden ball award (our own generic design), 200 x 200 */
export const fxGoldBall = (p: Pen) => {
  p.ell(100, 100, 84, 84, "#f2c64a", 11);
  p.clip([...Array(49)].map((_, i) => [100 + 84 * Math.cos((i / 48) * Math.PI * 2), 100 + 84 * Math.sin((i / 48) * Math.PI * 2)] as [number, number]), () => {
    for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2 - Math.PI / 2; p.ell(100 + 62 * Math.cos(a), 100 + 62 * Math.sin(a), 20, 20, "#d9a53a", 0); }
    p.ell(100, 100, 24, 24, "#d9a53a", 0); p.ell(74, 70, 26, 18, "#fff3b0", 0, 0, 360, -0.6);
  });
  p.ell(100, 100, 84, 84, null, 11);
};
/** heap of gold coins, 500 x 400 (bottom at 392), height level k 0..1: a mound + coin stacks */
export const fxCoinPile = (p: Pen, k: number) => {
  const h = 50 + 300 * k, mound: [number, number][] = [];
  for (let i = 0; i <= 24; i++) { const t = i / 24, x = 30 + t * 440; mound.push([x, 392 - h * Math.pow(Math.sin(Math.PI * t), 0.8) * (0.9 + 0.1 * Math.sin(i * 2.7))]); }
  mound.push([470, 392], [30, 392]); p.poly(mound, "#e0a93a", 9);
  for (let i = 0; i < 18 + Math.round(k * 30); i++) { const t = 0.08 + 0.84 * hs2(i, 1), top = 392 - h * Math.pow(Math.sin(Math.PI * t), 0.8) * 0.9, yy = top + (392 - top) * hs2(i, 2) * 0.85, xx = 30 + t * 440;
    p.ell(xx, yy, 24, 10, "#f6d25e", 4); p.ell(xx, yy, 12, 4, null, 2); }
  for (const [x, n] of [[90, 3 + Math.round(k * 4)], [410, 2 + Math.round(k * 5)]] as const) for (let j = 0; j < n; j++) { p.poly([[x - 26, 392 - j * 12], [x + 26, 392 - j * 12], [x + 26, 380 - j * 12], [x - 26, 380 - j * 12]], "#f2c64a", 4); }
  p.ell(200, 392 - h * 0.8, 20, 7, "#fff3b0", 0);
};
/** fat white up arrow, 200 x 300 */
export const fxArrowUp = (p: Pen) => { p.poly([[100, 10], [190, 120], [135, 120], [135, 290], [65, 290], [65, 120], [10, 120]], "#7ee08a", 12); };
/** height chart stick, 140 x 1000 (bottom = floor) */
export const fxRuler = (p: Pen) => {
  p.poly([[20, 990], [120, 990], [120, 10], [20, 10]], "#fff6dc", 9);
  for (let i = 1; i < 20; i++) { const y = 990 - i * 49; p.stroke([[20, y], [i % 5 ? 60 : 92, y]], i % 5 ? 4 : 7); }
  p.poly([[20, 990], [120, 990], [120, 940], [20, 940]], "#f25c7a", 7);
};
/** glass dome highlight, 300 x 400 */
export const fxDome = (p: Pen) => {
  const g = p.g; g.globalAlpha = 0.85; p.arc(150, 170, 130, 150, 180, 360, 7, "#e8f6ff"); p.stroke([[20, 170], [20, 390]], 7, "#e8f6ff"); p.stroke([[280, 170], [280, 390]], 7, "#e8f6ff");
  p.arc(150, 170, 104, 124, 205, 250, 10, "#ffffff"); p.stroke([[50, 200], [50, 330]], 10, "#ffffff"); g.globalAlpha = 1;
};
/** tennis ball, 100 x 100 */
export const fxTennis = (p: Pen) => { p.ell(50, 50, 40, 40, "#d8ec3a", 7); p.arc(18, 50, 22, 30, -70, 70, 5, "#ffffff"); p.arc(82, 50, 22, 30, 110, 250, 5, "#ffffff"); };
/** tower of folded napkins, 300 x 900 (bottom at 890), n layers */
export const fxNapkinTower = (p: Pen, n: number) => {
  for (let i = 0; i < n; i++) { const y = 890 - i * 19, x = 150 + 6 * Math.sin(i * 1.7); p.poly([[x - 110, y], [x + 110, y], [x + 104, y - 18], [x - 104, y - 18]], i % 2 ? "#fffdf8" : "#f3eee4", 5); }
};
/** writing hand: sleeve + cuff + round hand gripping a pen, 300 x 600 (pen tip at x 150, y 590) */
export const fxPenHand = (p: Pen) => {
  p.poly([[300, 0], [300, 120], [250, 420], [200, 430], [170, 380], [210, 0]], "#4a4f63", 9);
  p.poly([[250, 400], [200, 432], [178, 392], [228, 362]], "#fbfbf6", 7);
  p.stroke([[150, 590], [222, 352]], 16, "#2c2f3a"); p.dot(150, 588, 7, "#1f3f9a");
  p.ell(196, 462, 50, 44, "#fbf1e6", 9);
  p.ell(166, 492, 20, 15, "#fbf1e6", 7);
};
