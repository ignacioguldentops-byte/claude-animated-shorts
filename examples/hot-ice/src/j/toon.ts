// Our own flat 2D cartoon cast (riflemen, officer, townsfolk, kid, parent) + 2D effects, drawn on a canvas.
// Construction v2 (characters.md, our own cast): superellipse heads (pointed crown 1.75 / full jaw 2.3, chin taper,
// seeded side bulge + tilt), bean torsos, single-stroke limbs with ink-dot hands, a thick-thin plum outline weighted
// away from the light, soft painted crescents, deadpan lidded eyes, no blush, no catchlights.
// Design space 600 x 1000 units (soles at y = 975); the canvas transform scales it.
export const INK = "#241726";
export const SKIN = "#ffe2c2";
const WHITE = "#ffffff";
const MOUTH = "#5a1e28";
const TONGUE = "#e86e78";
type C3 = [number, number, number];
const SH_SKIN: C3 = [0.96, 0.86, 0.84]; // measured shadow/lit ratio on skin heads
const SH_CLOTH: C3 = [0.64, 0.66, 0.74]; // torsos: lit side -> far side ~0.65
const SH_FELT: C3 = [0.62, 0.62, 0.7];

export type Build = "adult" | "stout" | "kid";
export type Outfit = {
  jacket: string; pants: string; boots: string; hat?: string | null; belt?: string | null; buttons?: string; rifle?: boolean;
  sash?: string; sword?: boolean; moustache?: string; skin?: string; head?: number; cap?: string; hair?: string; dress?: string;
  build?: Build; stripes?: string; num?: string; socks?: string; shorts?: string; curly?: boolean;
};
type P2 = [number, number];

const rad = (d: number) => (d * Math.PI) / 180;
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
export const mul = (c: string, m: C3) => {
  const n = parseInt(c.slice(1), 16);
  const ch = (v: number, k: number) => Math.min(255, Math.round(v * k)).toString(16).padStart(2, "0");
  return `#${ch((n >> 16) & 255, m[0])}${ch((n >> 8) & 255, m[1])}${ch(n & 255, m[2])}`;
};
export const shade = (c: string, k: number) => mul(c, [k, k, k]);
export const mix = (a: string, b: string, t: number) => {
  const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(((A >> s) & 255) * (1 - t) + ((B >> s) & 255) * t).toString(16).padStart(2, "0");
  return `#${ch(16)}${ch(8)}${ch(0)}`;
};
/** deterministic per-character random in [0, 1) */
const rnd = (seed: number, k: number) => { const x = Math.sin(seed * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
const rotPts = (pts: P2[], a: number, cx: number, cy: number): P2[] =>
  pts.map(([x, y]) => [cx + (x - cx) * Math.cos(a) - (y - cy) * Math.sin(a), cy + (x - cx) * Math.sin(a) + (y - cy) * Math.cos(a)]);
const rotAbout = (q: P2, a: number, c: P2): P2 => rotPts([q], a, c[0], c[1])[0];
const lerp2 = (a: P2, b: P2, t: number): P2 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
/** smooth curve from a through (near) k to b, as a polyline */
const curve = (a: P2, k: P2, b: P2, n = 10): P2[] => {
  const c: P2 = [2 * k[0] - (a[0] + b[0]) / 2, 2 * k[1] - (a[1] + b[1]) / 2], out: P2[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, s = 1 - t;
    out.push([s * s * a[0] + 2 * s * t * c[0] + t * t * b[0], s * s * a[1] + 2 * s * t * c[1] + t * t * b[1]]);
  }
  return out;
};

export const RIFLEMAN: Outfit = { jacket: "#357650", pants: "#3d4440", boots: INK, hat: "shako", belt: "#f1efe6", buttons: "#d9dde0", rifle: true };
export const OFFICER: Outfit = { ...RIFLEMAN, hat: "shako_tall", buttons: "#e8c45a", sash: "#c0353a", sword: true, moustache: "#4a3020", rifle: false, belt: null, build: "stout" };
export const KID: Outfit = { jacket: "#f08a2c", pants: "#3b5b9a", boots: "#f4f1ea", hat: "cap", cap: "#e2453c", build: "kid" };
export const PARENT: Outfit = { jacket: "#7b5ac9", pants: "#3b3f52", boots: "#5a3b2a", hat: "hair", hair: "#5a3b2a" };
export const SKINS = [SKIN, "#f5c9a0", "#ecd0b6", "#c99067"];

export const soldier = (v = 0, extra: Partial<Outfit> = {}): Outfit => {
  const o: Outfit = { ...RIFLEMAN, skin: SKINS[v % 4] };
  if (v % 4 === 1) o.moustache = "#4a3426";
  if (v % 4 === 3) o.moustache = "#2a201a";
  return { ...o, ...extra };
};

export const townsfolk = (v = 0): Outfit => {
  const coats = ["#3f6fb5", "#8c3b4a", "#5d7a3a", "#b5653f", "#2f5f6a", "#7b5ac9"];
  const o: Outfit = { jacket: coats[v % 6], pants: "#3b3f52", boots: "#4a3426", skin: SKINS[v % 4] };
  return v % 2 ? { ...o, hat: "bonnet", dress: ["#d9a441", "#c25a7a", "#5a8fc2"][v % 3] } : { ...o, hat: "tophat" };
};

export class Pen {
  g: CanvasRenderingContext2D;
  ol = 12;
  /** [angle, cx, cy] rotation about (cx, cy), optional post-translation [.., dx, dy] */
  rot: number[] | null = null;
  constructor(g: CanvasRenderingContext2D) { this.g = g; }
  P(x: number, y: number): P2 {
    if (!this.rot) return [x, y];
    const r = this.rot, a = r[0], cx = r[1], cy = r[2], dx = r.length > 3 ? r[3] : 0, dy = r.length > 4 ? r[4] : 0, c = Math.cos(a), s = Math.sin(a);
    return [cx + (x - cx) * c - (y - cy) * s + dx, cy + (x - cx) * s + (y - cy) * c + dy];
  }
  path(pts: P2[], close: boolean) {
    const g = this.g;
    g.beginPath();
    pts.forEach((p, i) => { const [x, y] = this.P(p[0], p[1]); if (i) g.lineTo(x, y); else g.moveTo(x, y); });
    if (close) g.closePath();
  }
  /** filled shape with an ink outline; fill=null draws the outline only */
  poly(pts: P2[], fill: string | null, ol?: number) {
    const g = this.g, w = ol ?? this.ol;
    this.path(pts, true);
    if (fill) { g.fillStyle = fill; g.fill(); }
    if (w) { g.lineWidth = w; g.strokeStyle = INK; g.lineJoin = "round"; g.stroke(); }
  }
  ell(cx: number, cy: number, rx: number, ry: number, fill: string | null, ol?: number, a0 = 0, a1 = 360, rot = 0) {
    this.poly(ellPts(cx, cy, rx, ry, a0, a1, rot), fill, ol);
  }
  /** thick round-capped limb with an ink rim (effects, rope) */
  line(pts: P2[], fill: string, w: number, ink = true) {
    const g = this.g;
    g.lineCap = "round"; g.lineJoin = "round";
    if (ink) { this.path(pts, false); g.strokeStyle = INK; g.lineWidth = w + 2 * this.ol * 0.9; g.stroke(); }
    this.path(pts, false); g.strokeStyle = fill; g.lineWidth = w; g.stroke();
  }
  stroke(pts: P2[], w: number, fill = INK) {
    const g = this.g;
    g.lineCap = "round"; g.lineJoin = "round";
    this.path(pts, false); g.strokeStyle = fill; g.lineWidth = w; g.stroke();
  }
  arc(cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, w: number, fill = INK) {
    const pts: P2[] = [];
    for (let i = 0; i <= 24; i++) pts.push([cx + rx * Math.cos(rad(a0 + ((a1 - a0) * i) / 24)), cy + ry * Math.sin(rad(a0 + ((a1 - a0) * i) / 24))]);
    this.stroke(pts, w, fill);
  }
  dot(cx: number, cy: number, r: number, fill = INK) {
    const [x, y] = this.P(cx, cy);
    this.g.beginPath(); this.g.arc(x, y, r, 0, Math.PI * 2); this.g.fillStyle = fill; this.g.fill();
  }
  /** draw with a closed shape as clip */
  clip(pts: P2[], fn: () => void) { const g = this.g; g.save(); this.path(pts, true); g.clip(); fn(); g.restore(); }
  /** flat fill + soft crescent on the side away from the light (light = canvas angle the light comes FROM).
   *  Radial ramp centred `shift` R toward the light: flat out to ~0.6 R on the far side, full shadow by ~0.8 R. */
  shadedFill(pts: P2[], base: string, shadow: string, light: number, R: number, shift = 0.45, r0 = 1.05, r1 = 1.25) {
    const g = this.g, n = pts.length;
    let cx = 0, cy = 0;
    for (const [x, y] of pts) { cx += x / n; cy += y / n; }
    const [gx, gy] = this.P(cx + Math.cos(light) * shift * R, cy + Math.sin(light) * shift * R);
    const gr = g.createRadialGradient(gx, gy, 0, gx, gy, r1 * R);
    gr.addColorStop(0, base); gr.addColorStop(r0 / r1, base); gr.addColorStop(1, shadow);
    this.path(pts, true); g.fillStyle = gr; g.fill();
  }
  /** broad gradient across a shape along the light: lit edge = base, far edge = shadow (torsos, coats) */
  gradFill(pts: P2[], base: string, shadow: string, light: number, flat = 0.22) {
    const g = this.g, dx = Math.cos(light), dy = Math.sin(light), n = pts.length;
    let cx = 0, cy = 0, lo = Infinity, hi = -Infinity;
    for (const [x, y] of pts) { cx += x / n; cy += y / n; const d = x * dx + y * dy; lo = Math.min(lo, d); hi = Math.max(hi, d); }
    const dc = cx * dx + cy * dy;
    const [ax, ay] = this.P(cx + dx * (hi - dc), cy + dy * (hi - dc)), [bx, by] = this.P(cx + dx * (lo - dc), cy + dy * (lo - dc));
    const gr = g.createLinearGradient(ax, ay, bx, by);
    gr.addColorStop(0, base); gr.addColorStop(flat, base); gr.addColorStop(1, shadow);
    this.path(pts, true); g.fillStyle = gr; g.fill();
  }
  /** thick-thin ink ring: w(θ) = w0 (1 + k cos(θ − thick)), θ from the contour centroid (canvas angles) */
  inkRing(pts: P2[], w0: number, thick: number, k = 0.45, col = INK) {
    const n = pts.length;
    let cx = 0, cy = 0;
    for (const [x, y] of pts) { cx += x / n; cy += y / n; }
    const out: P2[] = [], inn: P2[] = [];
    pts.forEach((q, i) => {
      const a = pts[(i + n - 1) % n], b = pts[(i + 1) % n];
      let nx = b[1] - a[1], ny = a[0] - b[0]; // outward normal for clockwise-on-screen contours
      const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
      const h = 0.5 * w0 * (1 + k * Math.cos(Math.atan2(q[1] - cy, q[0] - cx) - thick));
      out.push([q[0] + nx * h, q[1] + ny * h]); inn.push([q[0] - nx * h, q[1] - ny * h]);
    });
    const g = this.g;
    const trace = (r: P2[]) => { r.forEach(([x0, y0], i) => { const [x, y] = this.P(x0, y0); if (i) g.lineTo(x, y); else g.moveTo(x, y); }); g.closePath(); };
    g.beginPath(); trace(out); trace(inn.reverse());
    g.fillStyle = col; g.fill("evenodd");
  }
  /** flat strap with a thin ink rim (cross belts, sash, rifle, handles) */
  band(pts: P2[], fill: string, w: number, rim: number, cap: CanvasLineCap = "butt") {
    const g = this.g; g.lineCap = cap; g.lineJoin = "round";
    this.path(pts, false); g.strokeStyle = INK; g.lineWidth = w + 2 * rim; g.stroke();
    this.path(pts, false); g.strokeStyle = fill; g.lineWidth = w; g.stroke();
    g.lineCap = "round";
  }
}

export const ellPts = (cx: number, cy: number, rx: number, ry: number, a0 = 0, a1 = 360, rot = 0, n = 48): P2[] => {
  const r = rad(rot), pts: P2[] = [];
  for (let i = 0; i <= n; i++) {
    const a = rad(a0 + ((a1 - a0) * i) / n), x = rx * Math.cos(a), y = ry * Math.sin(a);
    pts.push([cx + x * Math.cos(r) - y * Math.sin(r), cy + x * Math.sin(r) + y * Math.cos(r)]);
  }
  return pts;
};

export const rrect = (x0: number, y0: number, x1: number, y1: number, r: number, n = 8): P2[] => {
  const pts: P2[] = [];
  for (const [cx, cy, a] of [[x1 - r, y0 + r, -90], [x1 - r, y1 - r, 0], [x0 + r, y1 - r, 90], [x0 + r, y0 + r, 180]])
    for (let i = 0; i <= n; i++) pts.push([cx + r * Math.cos(rad(a + (90 * i) / n)), cy + r * Math.sin(rad(a + (90 * i) / n))]);
  return pts;
};

/** tapered stroke, thick end at a: brows, moustache halves */
const taper = (p: Pen, a: P2, b: P2, wa: number, wb: number, col = INK) => {
  const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
  p.poly([[a[0] + nx * wa / 2, a[1] + ny * wa / 2], [b[0] + nx * wb / 2, b[1] + ny * wb / 2],
    [b[0] - nx * wb / 2, b[1] - ny * wb / 2], [a[0] - nx * wa / 2, a[1] - ny * wa / 2]], col, 0);
  p.dot(a[0], a[1], wa / 2, col); p.dot(b[0], b[1], wb / 2, col);
};

// ---------------- contours ----------------
export type Blob = { a: number; b: number; nTop: number; nBot: number; egg: number; asym: number; rot: number; noise: number; seed: number };

/** superellipse "bean": separate crown / jaw exponents, egg taper (neg = narrower chin), one-side bulge, soft noise.
 *  Points run right -> down -> left -> up (clockwise on screen). */
export const blobPts = (cx: number, cy: number, B: Blob, n = 72): P2[] => {
  const ph = [rnd(B.seed, 11), rnd(B.seed, 12), rnd(B.seed, 13)].map((v) => v * Math.PI * 2);
  const pts: P2[] = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2, c = Math.cos(t), s = Math.sin(t), e = 2 / (s < 0 ? B.nTop : B.nBot);
    let X = Math.sign(c) * Math.abs(c) ** e;
    const Y = Math.sign(s) * Math.abs(s) ** e;
    X *= (1 + B.egg * Y) * (1 + B.asym * Math.sign(X));
    const r = 1 + B.noise * (Math.cos(2 * t + ph[0]) + 0.7 * Math.cos(3 * t + ph[1]) + 0.5 * Math.cos(4 * t + ph[2]));
    const x = B.a * X * r, y = B.b * Y * r;
    pts.push([cx + x * Math.cos(B.rot) - y * Math.sin(B.rot), cy + x * Math.sin(B.rot) + y * Math.cos(B.rot)]);
  }
  return pts;
};

/** measured head: H/W 0.94, slightly pointed crown (1.75), fuller jaw (2.3), chin taper -0.12, 8 % bulge to the facing side */
export const headBlob = (seed: number, a = 118, facing = 0): Blob => ({
  a, b: a * (0.94 + 0.08 * (rnd(seed, 1) - 0.5)),
  nTop: 1.75 + 0.3 * (rnd(seed, 2) - 0.5), nBot: 2.3 + 0.3 * (rnd(seed, 3) - 0.5),
  egg: -0.12 + 0.06 * (rnd(seed, 4) - 0.5),
  asym: (0.06 + 0.04 * rnd(seed, 5)) * (facing || (rnd(seed, 6) < 0.5 ? -1 : 1)),
  rot: rad(8 * (rnd(seed, 7) - 0.5)), noise: 0.008, seed,
});

/** thickest outline direction: away from the light, pulled toward the ground (64 deg measured for upper-left light) */
export const thickAngle = (light: number) => Math.atan2(-Math.sin(light) + 0.8, -Math.cos(light));
const DEF_LIGHT = rad(-120);

// ---------------- faces ----------------
export type Expr = "neutral" | "stern" | "grin" | "laugh" | "whistle" | "nervous" | "shock" | "relief" | "relief_open" | "dazed"
  | "pained" | "smile" | "smile_closed" | "lick";
type EyeK = "dot" | "small" | "lid" | "slit" | "happy" | "dash" | "squeeze" | "shock" | "shockHalf" | "spiral";
type MouthK = "dash" | "frown" | "smirk" | "smile" | "smileWide" | "grin" | "laugh" | "o" | "O" | "wave" | "teeth" | "lick";
/** eyes [back, front], brows [inner, outer] offsets in u (+ = down), mouth kind */
const FACE: Record<Expr, { eye: [EyeK, EyeK]; brow: [number, number]; mouth: MouthK }> = {
  neutral: { eye: ["lid", "lid"], brow: [0, -1], mouth: "dash" },
  stern: { eye: ["lid", "lid"], brow: [3, -2], mouth: "frown" },
  grin: { eye: ["happy", "happy"], brow: [-3, -3], mouth: "grin" },
  laugh: { eye: ["squeeze", "squeeze"], brow: [-4, -4], mouth: "laugh" },
  whistle: { eye: ["dash", "dash"], brow: [-2, -4], mouth: "o" },
  nervous: { eye: ["small", "small"], brow: [-3, 2], mouth: "wave" },
  shock: { eye: ["shock", "shock"], brow: [-7, -6], mouth: "O" },
  relief: { eye: ["happy", "happy"], brow: [-2, 1], mouth: "smileWide" },
  relief_open: { eye: ["happy", "happy"], brow: [-2, 1], mouth: "grin" },
  dazed: { eye: ["spiral", "spiral"], brow: [-3, 2], mouth: "wave" },
  pained: { eye: ["squeeze", "lid"], brow: [-3, 2], mouth: "teeth" },
  smile: { eye: ["dot", "dot"], brow: [0, -1], mouth: "smirk" },
  smile_closed: { eye: ["happy", "happy"], brow: [0, -1], mouth: "smile" },
  lick: { eye: ["dot", "dot"], brow: [0, -1], mouth: "lick" },
};
const halfLid = (k: EyeK): EyeK => (k === "dot" || k === "small" ? "lid" : k === "lid" ? "slit" : k === "shock" ? "shockHalf" : k);
const eyeKind = (k: EyeK, lid: number): EyeK =>
  lid >= 1 && k !== "happy" && k !== "squeeze" && k !== "spiral" ? "dash" : lid > 0 ? halfLid(k) : k;
const lidOf = (b: boolean | number | undefined) => (b === true ? 1 : Number(b) || 0);

const eye = (p: Pen, kind: EyeK, x: number, ey: number, u: number, side: number, look: number, skin: string) => {
  const lx = x + look * 3 * u, lw = 3.8 * u;
  switch (kind) {
    case "dot": p.ell(lx, ey, 3.8 * u, 5.5 * u, INK, 0); break;
    case "small": p.ell(lx, ey, 3 * u, 4.4 * u, INK, 0); break;
    case "lid": p.ell(lx, ey - u, 7 * u, 6 * u, INK, 0, 0, 180); p.stroke([[x - 9 * u, ey - u], [x + 9 * u, ey - u]], lw); break;
    case "slit": p.ell(lx, ey, 7 * u, 2.6 * u, INK, 0, 0, 180); p.stroke([[x - 9 * u, ey], [x + 9 * u, ey]], lw); break;
    case "happy": p.arc(x, ey + 3 * u, 8 * u, 6 * u, 200, 340, lw); break;
    case "dash": p.stroke([[x - 8.5 * u, ey], [x + 8.5 * u, ey]], lw); break;
    case "squeeze": p.stroke([[x + 6 * u * side, ey - 5 * u], [x - 6 * u * side, ey], [x + 6 * u * side, ey + 5 * u]], lw); break;
    case "shock": case "shockHalf":
      p.ell(x, ey, 11 * u, 11 * u, WHITE, 2.6 * u); p.dot(lx - side * 1.5 * u, ey + 1.5 * u, 3 * u);
      if (kind === "shockHalf") { p.ell(x, ey, 11 * u, 11 * u, skin, 0, 180, 360); p.stroke([[x - 11 * u, ey], [x + 11 * u, ey]], 2.6 * u); }
      break;
    default: {
      const s: P2[] = [];
      for (let t = 1; t < 15; t++) s.push([x + Math.cos(t * 0.9) * t * 0.55 * u, ey + Math.sin(t * 0.9) * t * 0.55 * u]);
      p.stroke(s, 2.4 * u);
    }
  }
};

/** open "D" mouth with a white teeth band (+ tongue) */
const dmouth = (p: Pen, mx: number, y: number, rx: number, ry: number, u: number, tongue = false) => {
  p.ell(mx, y, rx, ry, MOUTH, 0, 0, 180);
  p.clip([[mx - rx, y], [mx + rx, y], [mx + rx, y + 3 * u], [mx - rx, y + 3 * u]], () => p.ell(mx, y, rx, ry, WHITE, 0, 0, 180));
  if (tongue) p.ell(mx + 2 * u, y + 0.62 * ry, 0.4 * rx, 0.28 * ry, TONGUE, 0);
  p.ell(mx, y, rx, ry, null, 3 * u, 0, 180);
};

const mouth = (p: Pen, kind: MouthK, mx: number, my: number, u: number, k = 1) => {
  const mw = 4 * u;
  switch (kind) {
    case "dash": p.stroke([[mx - 5.5 * u * k, my], [mx + 5.5 * u * k, my - 0.8 * u]], mw); break;
    case "frown": p.arc(mx, my + 3 * u, 6.5 * u * k, 3.5 * u, 200, 340, mw); break;
    case "smirk": p.arc(mx + u, my - 3 * u, 7 * u * k, 4 * u, 10, 150, mw); break;
    case "smile": p.arc(mx, my - 3 * u, 8 * u * k, 4.5 * u, 20, 160, mw); break;
    case "smileWide": p.arc(mx, my - 4 * u, 11 * u * k, 6 * u, 15, 165, mw); break;
    case "grin": dmouth(p, mx, my - u, 12 * u * k, 8 * u, u); break;
    case "laugh": dmouth(p, mx, my, 16 * u * k, 11 * u, u, true); break;
    case "o": p.ell(mx + 4 * u, my, 3.5 * u, 4 * u, MOUTH, 2.8 * u); break;
    case "O": p.ell(mx, my + 2 * u, 9 * u * k, 11 * u, MOUTH, 3.2 * u); break;
    case "wave": { const s: P2[] = []; for (let i = 0; i <= 12; i++) s.push([mx - 9 * u * k + i * 1.5 * u * k, my + 1.5 * u * Math.sin(i * 1.3)]); p.stroke(s, 3 * u); break; }
    case "teeth":
      p.poly([[mx - 12 * u * k, my - 4 * u], [mx + 12 * u * k, my - 4 * u], [mx + 11 * u * k, my + 4 * u], [mx - 11 * u * k, my + 4 * u]], WHITE, 3 * u);
      for (const j of [-1, 0, 1]) p.stroke([[mx + j * 6 * u * k, my - 4 * u], [mx + j * 6 * u * k, my + 4 * u]], 1.5 * u);
      break;
    case "lick": p.arc(mx, my - 3 * u, 8 * u * k, 4.5 * u, 20, 160, mw); p.ell(mx + 6 * u * k, my + 3 * u, 3.6 * u, 4.6 * u, TONGUE, 2.4 * u); break;
  }
};

/** face v2 (front / 3-4). u = 1 % of the head path width W. Eyes 26u apart on the centre line, brows 20u up, mouth 20u
 *  down, everything slid toward the facing side. No blush, no catchlights. */
const faceFront = (p: Pen, cx: number, cy: number, W: number, expr: Expr, facing: number, look: number, lid: number, brim: boolean,
  skin: string, moustache?: string, stout = false, bw = 1) => {
  const u = W / 100, F = FACE[expr], fx = cx + 7 * u * facing;
  const ex = (F.eye[0] === "shock" ? 12 : 13) * u, ey = cy;
  for (const side of [-1, 1]) {
    const x = fx + side * ex;
    const kind = eyeKind(F.eye[(facing ? side === facing : side > 0) ? 1 : 0], lid);
    eye(p, kind, x, ey, u, side, look, skin);
    const [dI, dO] = F.brow, by = ey - (brim ? 17 : 20) * u;
    if (kind === "shock" || kind === "shockHalf") p.arc(x, by - 6 * u, 9 * u, 3 * u, 200, 340, 4 * u);
    else taper(p, [x - side * (8.5 + 1.5 * (bw - 1)) * u, by + dI * u], [x + side * (8.5 + 2.5 * (bw - 1)) * u, by + dO * u], 5 * u * bw, 2.5 * u * bw);
  }
  const mx = cx + 8 * u * facing, my = cy + 20 * u;
  mouth(p, F.mouth, mx, my, u);
  if (moustache) for (const s of [-1, 1])
    taper(p, [mx + s * 1.5 * u, cy + 12.5 * u], [mx + s * (stout ? 19 : 15) * u, cy + (stout ? 10.5 : 15) * u], stout ? 5.5 * u : 4.5 * u, 1.6 * u, moustache);
  if (expr === "nervous") p.ell(cx + 40 * u * (facing || 1), cy - 22 * u, 3 * u, 5 * u, "#9fd4ff", 2 * u);
};

/** profile face (facing screen-right): one eye, brow, nose tick, mouth near the front edge; no skin bump nose, no ear */
const faceSide = (p: Pen, hx: number, hy: number, W: number, expr: Expr, lid: number, brim: boolean, skin: string, moustache?: string, stout = false) => {
  const u = W / 100, F = FACE[expr], ex = hx + 27 * u, ey = hy;
  const kind = eyeKind(F.eye[1], lid);
  eye(p, kind, ex, ey, u, 1, 0.6, skin);
  const by = ey - (brim ? 17 : 20) * u, [dI, dO] = F.brow;
  if (kind === "shock" || kind === "shockHalf") p.arc(ex, by - 6 * u, 9 * u, 3 * u, 200, 340, 4 * u);
  else taper(p, [ex + 8 * u, by + dI * u], [ex - 7 * u, by - u + dO * u], 5 * u, 2.5 * u);
  p.stroke([[hx + 44 * u, hy + 4 * u], [hx + 47.5 * u, hy + 9 * u], [hx + 43 * u, hy + 10 * u]], 3 * u);
  mouth(p, F.mouth, hx + 33 * u, hy + 21 * u, u, 0.62);
  if (moustache) taper(p, [hx + 41 * u, hy + 13.5 * u], [hx + 25 * u, hy + (stout ? 11.5 : 16) * u], stout ? 5.5 * u : 4.5 * u, 1.6 * u, moustache);
  if (expr === "nervous") p.ell(hx - 30 * u, hy - 24 * u, 3 * u, 5 * u, "#9fd4ff", 2 * u);
};

// ---------------- hats ----------------
const BONNET = "#e9cf8f", BONNET_BRIM = "#d6b46a";
/** parts of a hat that sit behind the head (bonnet) */
const hatBehind = (p: Pen, o: Outfit, H: Blob, cx: number, hc: number, light: number, thick: number, ow: number, side: boolean) => {
  if (o.curly && o.hair) { // big curly mane: a ring of ink-rimmed bumps round the crown and down past the ears
    const u = H.a / 50, mx = cx - (side ? 22 * u : 0), my = hc - 0.16 * H.b, ra = 1.1 * H.a, rb = 1.08 * H.b;
    const bumps: [number, number, number][] = [];
    for (let i = 0; i <= 13; i++) { const an = rad((side ? 128 : 152) + i * ((side ? 214 : 236) / 13)); bumps.push([mx + ra * Math.cos(an), my + rb * Math.sin(an), (21 + 5 * rnd(H.seed + i, 31)) * u]); }
    for (const [x, y, r] of bumps) p.ell(x, y, r + ow * 0.8, r + ow * 0.8, INK, 0);
    for (const [x, y, r] of bumps) p.ell(x, y, r, r, o.hair, 0);
    p.ell(mx, my, ra, rb, o.hair, 0);
    for (let i = 0; i < 5; i++) { const an = rad(215 + i * 28); p.arc(mx + 0.72 * ra * Math.cos(an), my + 0.72 * rb * Math.sin(an), 13 * u, 11 * u, 200 + i * 20, 330 + i * 20, 2.2 * u, shade(o.hair, 1.9)); }
    return;
  }
  if (o.hat !== "bonnet") return;
  const bb = blobPts(cx - (side ? 12 : 0) * (H.a / 50), hc - 0.07 * 2 * H.b, { ...H, a: H.a * 1.17, b: H.b * 1.13, asym: 0, egg: 0.04, seed: H.seed + 3 });
  p.shadedFill(bb, BONNET, mul(BONNET, SH_CLOTH), light, H.a * 1.17);
  p.inkRing(bb, ow * 0.85, thick);
};

const hatOn = (p: Pen, o: Outfit, hp: P2[], H: Blob, cx: number, hc: number, light: number, seed: number, facing: number, side: boolean) => {
  const W = 2 * H.a, HH = 2 * H.b, u = W / 100, crown = hc - H.b, ow = 0.85 * 5 * u;
  const a = H.rot + rad(4 * (rnd(seed, 20) - 0.5)); // tilt with the head, +-2 deg extra
  const R = (pts: P2[]) => rotPts(pts, a, cx, hc);
  const sag = (yb: number, wb: number): P2[] => {
    const base: P2[] = [];
    for (let i = 0; i <= 12; i++) { const t = i / 12; base.push([cx + wb * (2 * t - 1), yb + 3 * u * (1 - (2 * t - 1) ** 2)]); }
    return base;
  };
  if (o.hat === "shako" || o.hat === "shako_tall") {
    const tall = o.hat === "shako_tall", yb = crown + 0.25 * HH, ht = (tall ? 0.66 : 0.56) * HH, wb = 46 * u, wt = 52 * u;
    const body = R([...sag(yb, wb).reverse(), [cx - wt, yb - ht], [cx + wt, yb - ht]]);
    p.shadedFill(body, "#3a3d47", "#24262d", light, wt, 0.4);
    if (tall) p.clip(body, () => p.band(R([[cx - wt - 5 * u, yb - ht + 0.07 * HH], [cx + wt + 5 * u, yb - ht + 0.07 * HH]]), "#e8c45a", 0.06 * HH, 1.5 * u));
    p.poly(body, null, ow);
    const deg = (a * 180) / Math.PI;
    if (side) {
      p.poly(R([[cx + 36 * u, yb - 1 * u], [cx + 60 * u, yb + 8 * u], [cx + 34 * u, yb + 6 * u]]), "#16171b", 2.5 * u);
      const [tx, ty] = R([[cx + 24 * u, yb - ht - 6 * u]])[0];
      p.ell(tx, ty, 7 * u, 7 * u, "#2b7a4b", 2.5 * u);
    } else {
      const [px, py] = R([[cx + 3 * u * facing, yb + 3 * u]])[0];
      p.ell(px, py, 34 * u, 0.045 * HH, "#16171b", 2.5 * u, 0, 180, deg); // peak
      const [bx, by] = R([[cx, yb - 0.45 * ht]])[0];
      p.ell(bx, by, 7 * u, 6 * u, tall ? "#e8c45a" : "#c9ccd2", 2 * u, 0, 360, deg); // badge plate
      p.arc(bx, by, 3.5 * u, 2.8 * u, 200, 500, 1.6 * u);
      const [tx, ty] = R([[cx, yb - ht - 6 * u]])[0];
      p.ell(tx, ty, 7 * u, 7 * u, "#2b7a4b", 2.5 * u); // green tuft
    }
  } else if (o.hat === "cap" || o.hat === "hair") {
    const cut = crown + (o.hat === "cap" ? 0.3 : o.curly ? 0.25 : 0.31) * HH;
    const keep = (x: number, y: number) => y < cut || (side && o.hat === "hair" && x < cx - 6 * u && y < hc + 0.42 * H.b);
    // start the arc at the first kept point after a dropped one, so the kept run is contiguous and the cut closes it
    const n = hp.length, startIdx = Math.max(0, hp.findIndex(([x, y], i) => keep(x, y) && !keep(hp[(i + n - 1) % n][0], hp[(i + n - 1) % n][1])));
    const arc = [...hp.slice(startIdx), ...hp.slice(0, startIdx)].filter(([x, y]) => keep(x, y))
      .map(([x, y]) => [cx + (x - cx) * 1.03, hc + (y - hc) * 1.03] as P2);
    if (arc.length < 3) return;
    if (o.hat === "hair") { // scalloped lower edge
      const [x0, y0] = arc[arc.length - 1], [x1, y1] = arc[0];
      if (side && o.curly) arc.push([x0 - 12 * u, y0 + 5 * u], [cx + 6 * u, y0 + 2 * u], [cx - 14 * u, y0 + 7 * u], [cx - 30 * u, y0 + 4 * u], [cx - 40 * u, (y0 + y1) / 2 + 6 * u]);
      else for (let i = 1; i < 6; i++) arc.push([x0 + ((x1 - x0) * i) / 6, y0 + ((y1 - y0) * i) / 6 + (i % 2 ? 4 * u : 0)]);
    }
    const col = o.hat === "cap" ? o.cap! : o.hair!;
    if (o.curly) { // fringe only: flat fill, ink only on the scalloped hairline (the mane behind carries the silhouette)
      p.poly(arc, col, 0);
      p.stroke([...arc.slice(-6), arc[0]], ow * 0.7);
    } else {
    p.shadedFill(arc, col, mul(col, SH_FELT), light, H.a, 0.35);
    p.poly(arc, null, ow);
    }
    if (o.curly && false) { // curls: overlapping ink-rimmed bumps round the crown
      for (let i = 0; i < 9; i++) { const an = rad(188 + i * 20.5); p.ell(cx + 0.97 * H.a * Math.cos(an), hc + 0.95 * H.b * Math.sin(an), 19 * u, 19 * u, col, ow * 0.75); }
      for (let i = 0; i < 8; i++) { const an = rad(198 + i * 20.5); p.ell(cx + 0.74 * H.a * Math.cos(an), hc + 0.78 * H.b * Math.sin(an), 20 * u, 18 * u, col, 0); }
    }
    if (o.hat === "hair" && !o.curly) {
      const s = side ? -1 : facing || 1;
      p.stroke([[cx + s * 10 * u, cut - 30 * u], [cx + s * 2 * u, cut - 12 * u]], 1.2 * u);
    }
    if (o.hat === "cap") {
      const deg = (a * 180) / Math.PI;
      if (side) p.poly(R([[cx + 40 * u, cut - 2 * u], [cx + 74 * u, cut + 4 * u], [cx + 40 * u, cut + 6 * u]]), shade(col, 0.8), ow);
      else {
        const s = facing || (rnd(seed, 21) < 0.5 ? -1 : 1), [px, py] = R([[cx + s * 4 * u, cut + 1.5 * u]])[0];
        p.ell(px, py, 32 * u, 0.06 * HH, shade(col, 0.8), ow, 0, 180, deg);
      }
    }
  } else if (o.hat === "tophat") {
    const yb = crown + 0.22 * HH, ht = 0.8 * HH, wb = 0.31 * W, wt = 0.33 * W, col = "#2e2a36";
    const body = R([...sag(yb, wb).reverse(), [cx - wt, yb - ht], [cx + wt, yb - ht]]);
    p.shadedFill(body, col, mul(col, SH_FELT), light, wt, 0.4);
    p.clip(body, () => p.band(R([[cx - wt - 4 * u, yb - 0.13 * HH], [cx + wt + 4 * u, yb - 0.13 * HH]]), shade(o.jacket, 0.9), 0.14 * HH, 0.8 * u));
    p.poly(body, null, ow);
    const [bx, by] = R([[cx, yb + 1 * u]])[0];
    p.ell(bx, by, 0.45 * W, 0.05 * HH, "#1d1b22", ow, 0, 360, (a * 180) / Math.PI);
  } else if (o.hat === "bonnet") {
    const [bx, by] = R([[cx + (side ? 6 * u : 0), crown + 0.16 * HH]])[0];
    p.arc(bx, by, 0.5 * W, 0.2 * HH, 200, 340, 7 * u, BONNET_BRIM);
    p.arc(bx, by, 0.5 * W + 3.5 * u, 0.2 * HH + 3.5 * u, 200, 340, 1.2 * u);
    const cy = hc + H.b * 0.98;
    p.stroke([[cx - 14 * u, cy - 4 * u], [cx, cy + 2 * u], [cx + 14 * u, cy - 4 * u]], 2 * u, BONNET_BRIM);
  }
};

// ---------------- bodies ----------------
export type Arms = [P2[], P2[]];
/** held prop; for the hammer the number is the strike 0 (raised) .. 1 (struck) */
export type Prop = null | "icecream" | "shako" | ["hammer", number];

const BUILD: Record<Build, { a: number; torso: number; legs: number; tw: number }> = {
  adult: { a: 118, torso: 1.1, legs: 1.4, tw: 0.8 },
  stout: { a: 118, torso: 1.15, legs: 1.32, tw: 0.92 },
  kid: { a: 112, torso: 0.85, legs: 1.0, tw: 0.72 },
};

export type FrontOpts = {
  phase?: number; expr?: Expr; mode?: "march" | "stroll" | "stand" | "sit" | "fall"; look?: number; blink?: boolean | number; lift?: number;
  prop?: Prop; tilt?: number; headTilt?: number; wave?: number; waveL?: number;
  /** canvas angle the key light comes FROM (painted crescent + thick outline side) */
  light?: number; facing?: -1 | 0 | 1; seed?: number;
};

const footStroke = (p: Pen, a: P2, b: P2, w: number, col: string) => {
  if (col !== INK) p.stroke([a, b], w + 3, INK);
  p.stroke([a, b], w, col);
};

/** footballer leg: bare skin with an ink rim, sock on the lower part (outfits with `socks`); plain stick leg otherwise */
const kitLeg = (p: Pen, pts: P2[], w: number, o: Outfit, col: string, far = false) => {
  if (!o.socks) { p.stroke(pts, w, col); return; }
  const skin = o.skin ?? SKIN, k = far ? 0.8 : 1, cut = Math.max(1, Math.round((pts.length - 1) * 0.55));
  p.stroke(pts, w * 1.9, INK); p.stroke(pts, w * 1.9 - 5, shade(skin, k));
  const low = pts.length === 3 ? [lerp2(pts[1], pts[2], 0.25), pts[2]] : pts.slice(cut);
  p.stroke(low, w * 1.9 - 5, shade(o.socks, k));
};
export const bodyFront = (p: Pen, o: Outfit, opts: FrontOpts) => {
  const { phase = 0, expr = "neutral", mode = "march", look = 0, blink = false, lift = 60, prop = null, tilt = 0, headTilt = 0, wave, waveL,
    light = DEF_LIGHT, facing = 0, seed = 1 } = opts;
  const Bd = BUILD[o.build ?? "adult"], skin = o.skin ?? SKIN, two = Math.PI * 2, lid = lidOf(blink);
  const H = headBlob(seed, Bd.a, facing), W = 2 * H.a, HH = 2 * H.b, u = W / 100;
  const tall = (1 + Bd.torso + Bd.legs) * HH, sole = 975;
  // body bob 5 % (march) / 3 % (stroll) of the height, lowest at contact (phase 0 and 0.5)
  const bob = mode === "march" ? 0.025 * tall * Math.cos(2 * two * phase) : mode === "stroll" ? 0.015 * tall * Math.cos(2 * two * phase) : 0;
  const torsoBot = mode === "sit" ? sole - 0.2 * HH : sole - Bd.legs * HH + bob;
  const chin = torsoBot - Bd.torso * HH, hc = chin - H.b, crown = hc - H.b, hipY = torsoBot - 0.12 * HH;
  const thick = thickAngle(light), ow = 5 * u;
  const legCol = mix(o.pants, INK, 0.55), armCol = mix(o.jacket, INK, 0.5), footCol = o.boots;
  const legW = 5.8 * u, footW = 7.5 * u;
  // ---- legs + feet (not rotated) ----
  p.rot = null;
  if (mode === "sit") {
    for (const side of [-1, 1]) {
      const h: P2 = [300 + side * 15 * u, hipY], k: P2 = [300 + side * 36 * u, hipY + 0.2 * HH], f: P2 = [300 + side * 44 * u, sole - 8 * u];
      kitLeg(p, curve(h, k, f), legW, o, legCol);
      footStroke(p, [f[0] - side * 2 * u, f[1]], [f[0] + side * 12 * u, f[1] - 5 * u], footW, footCol);
    }
  } else if (mode === "fall") {
    const legs: [P2, P2, P2][] = [
      [[300 - 15 * u, hipY], [300 - 46 * u, hipY + 0.5 * HH], [300 - 70 * u, hipY + 0.72 * HH]],
      [[300 + 15 * u, hipY], [300 + 50 * u, hipY + 0.45 * HH], [300 + 76 * u, hipY + 0.22 * HH]],
    ];
    legs.forEach(([h, k, f], i) => {
      kitLeg(p, curve(h, k, f), legW, o, legCol);
      footStroke(p, f, [f[0] + (i ? 14 : -14) * u, f[1] + (i ? -6 : 4) * u], footW, footCol);
    });
  } else if (o.dress) {
    for (const side of [-1, 1]) {
      const fx = 300 + side * 12 * u, fy = sole - 4 * u;
      p.stroke([[fx, sole - 0.4 * HH], [fx + side * u, fy]], legW, legCol);
      footStroke(p, [fx - side * 3 * u, fy], [fx + side * 12 * u, fy + u], footW, footCol);
    }
  } else {
    const L = mode === "march" ? lift * 1.25 : mode === "stroll" ? lift * 0.55 : 0;
    for (const [side, ph] of [[-1, 0], [1, 0.5]] as const) {
      const up = Math.max(0, Math.sin(two * (phase + ph))) * L;
      const hx = 300 + side * 15 * u, fx = 300 + side * 22 * u, fy = sole - 4 * u - up;
      const k: P2 = [(hx + fx) / 2 + side * (1.5 * u + up * 0.16), (hipY + fy) / 2 - up * 0.08];
      kitLeg(p, curve([hx, hipY], k, [fx, fy]), legW, o, legCol);
      footStroke(p, [fx - side * 3 * u, fy], [fx + side * 13 * u, fy + 0.5 * u], footW, footCol);
    }
  }
  if (o.shorts && mode !== "sit") p.poly([[300 - 31 * u, hipY - 0.12 * HH], [300 + 31 * u, hipY - 0.12 * HH], [300 + 36 * u, hipY + 0.36 * HH], [300 + 5 * u, hipY + 0.36 * HH],
    [300, hipY + 0.2 * HH], [300 - 5 * u, hipY + 0.36 * HH], [300 - 36 * u, hipY + 0.36 * HH]], o.shorts, 3.2 * u);
  // ---- upper body: rotates about the hips (tilt + a small weight-shift sway on every step) ----
  const sway = mode === "march" ? 1.6 * Math.sin(two * phase) : mode === "stroll" ? 1.0 * Math.sin(two * phase) : 0;
  const A = tilt + sway;
  p.rot = A ? [rad(A), 300, hipY] : null;
  const dress = !!o.dress && mode !== "sit" && mode !== "fall";
  const T: Blob = { a: ((Bd.tw / 2) * W) / 1.06, b: 0.5 * (torsoBot - (chin - 0.25 * HH)), nTop: 2.2, nBot: 2.6, egg: o.build === "stout" ? 0.17 : 0.12,
    asym: 0.04 * facing, rot: 0, noise: 0.006, seed: seed + 7 };
  const tcx = 300 + 3 * u * facing, tcy = torsoBot - T.b, tp = blobPts(tcx, tcy, T);
  const sh = (side: number): P2 => [tcx + side * 0.85 * T.a, chin + 0.12 * HH];
  const hang = (side: number, fwd: number): [P2, P2, P2] => {
    const S = sh(side), ex = tcx + side * (1.12 * T.a + 4 * u);
    const hx = ex + side * 3 * u - side * 6 * u * Math.max(0, fwd) + side * 4 * u * Math.max(0, -fwd);
    return [S, [ex, S[1] + 0.48 * HH], [hx, chin + 1.04 * HH - Math.abs(fwd) * 9 * u]];
  };
  const sw = mode === "march" || mode === "stroll" ? Math.sin(two * phase) : 0;
  // rifle at the order: butt by the right hip, held by the hanging right hand, muzzle past the crown
  const R0: P2 = [300 + 47 * u, torsoBot + 0.12 * HH], R1: P2 = [300 + 64 * u, crown - 0.32 * HH];
  const rifle = !!o.rifle && (mode === "march" || mode === "stand" || mode === "stroll");
  type Arm = { pts: [P2, P2, P2]; front: boolean };
  const arms: Arm[] = [];
  if (mode === "sit") for (const side of [-1, 1]) arms.push({ pts: [sh(side), [tcx + side * (1.1 * T.a + 6 * u), sh(side)[1] + 0.4 * HH], [tcx + side * (1.2 * T.a + 10 * u), torsoBot + 0.04 * HH]], front: false });
  else if (mode === "fall") for (const side of [-1, 1]) arms.push({ pts: [sh(side), [tcx + side * (1.15 * T.a + 12 * u), sh(side)[1] - 0.25 * HH], [tcx + side * (1.3 * T.a + 24 * u), sh(side)[1] - 0.68 * HH]], front: false });
  else {
    const raised = (side: number, w: number): [P2, P2, P2] => { // w: 0 = hanging .. 1 = hand high and wide of the head
      const h = hang(side, 0), S = sh(side), k = clamp(w, 0, 1);
      return [S, lerp2(h[1], [tcx + side * (1.1 * T.a + 26 * u), S[1] - 0.3 * HH], k), lerp2(h[2], [tcx + side * (1.15 * T.a + 62 * u), S[1] - 0.95 * HH], k)];
    };
    if (waveL !== undefined) arms.push({ pts: raised(-1, waveL), front: false });
    else arms.push({ pts: prop === "shako" ? hang(-1, 0) : hang(-1, -sw), front: false });
    if (rifle) {
      const G = lerp2(R0, R1, 0.1);
      arms.push({ pts: [sh(1), [tcx + 1.12 * T.a + 5 * u, sh(1)[1] + 0.45 * HH], G], front: false });
    } else if (wave !== undefined) {
      arms.push({ pts: raised(1, wave), front: false });
    } else if (prop === "icecream") {
      const S = sh(1);
      arms.push({ pts: [S, [tcx + 1.05 * T.a + 4 * u, S[1] + 0.45 * HH], [tcx + 0.5 * T.a, S[1] + 0.4 * HH]], front: true });
    } else if (Array.isArray(prop)) {
      const S = sh(1), k = clamp(prop[1], 0, 1);
      const E = lerp2([tcx + 1.1 * T.a + 10 * u, S[1] - 0.15 * HH], [tcx + 1.2 * T.a + 10 * u, S[1] + 0.3 * HH], k);
      const Hd = lerp2([tcx + 1.15 * T.a + 14 * u, S[1] - 0.55 * HH], [tcx + 1.45 * T.a + 22 * u, S[1] + 0.35 * HH], k);
      arms.push({ pts: [S, E, Hd], front: true });
    } else arms.push({ pts: hang(1, sw), front: false });
  }
  const drawArm = (a: Arm) => { p.stroke(curve(a.pts[0], a.pts[1], a.pts[2]), 5.2 * u, armCol); p.dot(a.pts[2][0], a.pts[2][1], 5.5 * u); };
  // behind the body: rifle, sword, arms
  if (rifle) {
    p.band([R0, R1], "#7a4b2a", 5 * u, 1.5 * u, "round");
    p.band([lerp2(R0, R1, 0.6), R1], "#8d949c", 2.4 * u, 1.2 * u, "round");
  }
  if (o.sword && mode !== "sit") {
    const s0: P2 = [tcx - 0.75 * T.a, torsoBot - 0.2 * HH];
    p.band([s0, [s0[0] - Math.sin(rad(25)) * 0.8 * HH, s0[1] + Math.cos(rad(25)) * 0.8 * HH]], "#c9ccd2", 3 * u, 1.2 * u, "round");
  }
  for (const a of arms) if (!a.front) drawArm(a);
  // torso / dress: shaded fill -> clothing clipped to it -> thick-thin ink ring
  if (dress) {
    const D: Blob = { a: 0.5 * W * 0.98, b: 0.5 * ((sole - 0.35 * HH) - (chin - 0.2 * HH)), nTop: 2.0, nBot: 3.0, egg: 0.35, asym: 0.03 * facing, rot: 0, noise: 0.006, seed: seed + 9 };
    const dp = blobPts(300, sole - 0.35 * HH - D.b, D);
    p.gradFill(dp, o.dress!, mul(o.dress!, SH_CLOTH), light);
    p.inkRing(dp, ow, thick);
    const Sw: Blob = { a: 0.37 * W, b: 0.3 * HH, nTop: 2.2, nBot: 2.4, egg: 0.1, asym: 0, rot: 0, noise: 0.006, seed: seed + 8 };
    const sp = blobPts(300, chin + 0.12 * HH, Sw);
    p.gradFill(sp, o.jacket, mul(o.jacket, SH_CLOTH), light);
    p.inkRing(sp, ow * 0.9, thick);
  } else {
    p.gradFill(tp, o.jacket, mul(o.jacket, SH_CLOTH), light);
    p.clip(tp, () => {
      if (o.num) { const g = p.g, [nx, ny] = p.P(tcx, tcy + 0.1 * T.b); g.save(); g.font = `900 ${Math.round(0.62 * T.b)}px Arial, sans-serif`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = o.stripes ? "#1f2433" : "#f4f3ee"; g.fillText(o.num, nx, ny); g.restore(); }
    if (o.stripes) for (let k = -3; k <= 3; k++) if (k % 2 === 0) p.band([[tcx + k * 0.3 * T.a, chin - 0.3 * HH], [tcx + k * 0.3 * T.a, torsoBot + 0.1 * HH]], o.stripes, 0.15 * T.a, 0, "butt");
      if (o.belt) {
        for (const s of [-1, 1]) p.band([[tcx - s * 0.75 * T.a, chin - 0.05 * HH], [tcx + s * 0.8 * T.a, torsoBot - 0.1 * HH]], o.belt!, 5.5 * u, 1.8 * u);
        const xc = tcx + 0.025 * T.a, yc = chin - 0.05 * HH + (torsoBot - 0.1 * HH - (chin - 0.05 * HH)) * (0.75 / 1.55);
        p.poly([[xc - 3.5 * u, yc - 3.5 * u], [xc + 3.5 * u, yc - 3.5 * u], [xc + 3.5 * u, yc + 3.5 * u], [xc - 3.5 * u, yc + 3.5 * u]], "#d9dde0", 1.5 * u);
      }
      if (o.sash) p.band([[tcx - 1.3 * T.a, torsoBot - 0.32 * HH], [tcx + 1.3 * T.a, torsoBot - 0.32 * HH]], o.sash, 0.13 * HH, 1.8 * u);
      if (o.buttons !== "none") for (let i = 0; i < 4; i++) {
        const y = chin + 0.12 * HH + i * 0.2 * HH;
        if (o.sash && Math.abs(y - (torsoBot - 0.32 * HH)) < 0.08 * HH) continue;
        p.dot(tcx + 2 * u * facing, y, 2.2 * u + 0.8 * u, INK); p.dot(tcx + 2 * u * facing, y, 2.2 * u, o.buttons ?? shade(o.jacket, 0.7));
      }
    });
    if (o.sash) { const s = facing || 1; p.poly([[tcx + s * 0.55 * T.a, torsoBot - 0.3 * HH], [tcx + s * 0.75 * T.a, torsoBot + 0.05 * HH], [tcx + s * 0.45 * T.a, torsoBot + 0.02 * HH]], o.sash, 1.6 * u); }
    p.inkRing(tp, ow, thick);
  }
  // in front of the body: hands holding props
  for (const a of arms) if (a.front) {
    drawArm(a);
    const [hx, hy] = a.pts[2];
    if (prop === "icecream") {
      p.poly([[hx - 8 * u, hy - 12 * u], [hx + 8 * u, hy - 12 * u], [hx, hy + 7 * u]], "#e0a35a", 1.8 * u);
      p.ell(hx, hy - 19 * u, 11 * u, 10 * u, "#f7c6d9", 2.2 * u);
      p.dot(hx, hy, 5.5 * u);
    } else if (Array.isArray(prop)) {
      const ang = rad(-70 + 105 * clamp(prop[1], 0, 1));
      const Rh = (pts: P2[]) => rotPts(pts, ang, hx, hy);
      p.band(Rh([[hx, hy + 12 * u], [hx, hy - 44 * u]]), "#8a5a34", 5 * u, 1.5 * u, "round");
      p.poly(Rh([[hx - 12 * u, hy - 58 * u], [hx + 20 * u, hy - 58 * u], [hx + 20 * u, hy - 42 * u], [hx - 12 * u, hy - 42 * u]]), "#7d848c", 2.2 * u);
      p.dot(hx, hy, 5.5 * u);
    }
  }
  if (prop === "shako") { // carried by the left hand
    const [hx, hy] = arms[0].pts[2];
    p.poly([[hx - 14 * u, hy + 3 * u], [hx + 14 * u, hy + 3 * u], [hx + 16 * u, hy + 30 * u], [hx - 16 * u, hy + 30 * u]], "#3a3d47", 2.2 * u);
    p.ell(hx, hy + 31 * u, 3.5 * u, 3.5 * u, "#2b7a4b", 1.5 * u);
    p.dot(hx, hy, 5.5 * u);
  }
  // ---- head: rotates with the body, plus its own tilt about the chin ----
  const Ah = A + headTilt, [cpx, cpy] = rotAbout([300, chin], rad(A), [300, hipY]);
  p.rot = Ah ? [rad(Ah), 300, chin, cpx - 300, cpy - chin] : null;
  hatBehind(p, o, H, 300, hc, light, thick, ow, false);
  const hp = blobPts(300, hc, H);
  p.shadedFill(hp, skin, mul(skin, SH_SKIN), light, H.a);
  p.inkRing(hp, ow, thick);
  hatOn(p, o, hp, H, 300, hc, light, seed, facing, false);
  const brim = !!o.hat && o.hat !== "hair" && o.hat !== "bonnet" && o.hat !== "cap";
  faceFront(p, 300, hc, W, expr, facing, look, lid, brim, skin, o.moustache, o.build === "stout");
  p.rot = null;
};

export type SideOpts = {
  phase?: number; expr?: Expr; mode?: "march" | "stand" | "swing" | "push"; blink?: boolean | number; stomp?: number; pose?: number; leanAdd?: number;
  /** step length as a multiple of 0.8 m (370 units): matches 1.6 m/s at 2 steps/s; scale by the view's foreshortening */
  stride?: number; light?: number; seed?: number;
  /** push mode: where the hands land at pose 1, in final canvas units (e.g. the swing kid's back) */
  hand?: [number, number];
};

/** two-bone leg, knee bending forward (+x) */
const ik = (hip: P2, ank: P2, l1: number, l2: number): P2 => {
  const dx = ank[0] - hip[0], dy = ank[1] - hip[1], d = clamp(Math.hypot(dx, dy), 1, l1 + l2 - 0.01);
  const A = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1)), k = Math.atan2(dy, dx) - A;
  return [hip[0] + l1 * Math.cos(k), hip[1] + l1 * Math.sin(k)];
};

/** hip height of the seated kid in `swing` mode (design units); swingKid seats the torso bottom on the plank */
const SWING_HIP = 733;

/** side view facing screen-right; march footfalls land at phase 0 (near foot) and 0.5 (far foot), like the front view.
 *  The stance foot is planted: it slides back at exactly the walking speed while the hip rises and falls over it. */
export const bodySide = (p: Pen, o: Outfit, opts: SideOpts) => {
  const { phase = 0, expr = "neutral", mode = "march", blink = false, stomp = 1, pose = 0, stride = 1, light = DEF_LIGHT, seed = 1 } = opts;
  const Bd = BUILD[o.build ?? "adult"], skin = o.skin ?? SKIN, two = Math.PI * 2, lid = lidOf(blink);
  const H: Blob = { ...headBlob(seed, Bd.a, 1), asym: 0.12, rot: rad(3 + 3 * (rnd(seed, 7) - 0.5)) };
  const W = 2 * H.a, HH = 2 * H.b, u = W / 100, sole = 975, ankY = sole - 4 * u;
  const thick = thickAngle(light), ow = 5 * u;
  const legLen = (Bd.legs + 0.12) * HH - 4 * u, l1 = legLen / 2, l2 = legLen / 2;
  const nearCol = mix(o.pants, INK, 0.55), farCol = mix(o.pants, INK, 0.75), footCol = o.boots;
  type LegS = { ank: P2; pitch: number; near: boolean };
  const legs: LegS[] = [];
  let hipY = ankY - legLen * 0.995, lean = 0, nearFwd = 0;
  if (mode === "march") {
    const S = 370 * stride, liftH = Math.max(22, 40 + 70 * (stomp - 1));
    const st = (ph: number) => {
      const c = (((phase + ph) % 1) + 1) % 1;
      if (c < 0.5) { const s = c / 0.5; return { x: S / 2 - S * s, h: 0, stance: true, s }; }
      const s = (c - 0.5) / 0.5; // swing: cycloid in world space, so the foot leaves and lands at zero ground speed
      return { x: -S / 2 + S * s - (S / Math.PI) * Math.sin(2 * Math.PI * s), h: liftH * Math.sin(Math.PI * s), stance: false, s };
    };
    const nL = st(0), fL = st(0.5), stance = nL.stance ? nL : fL;
    const Leff = legLen * (1 - 0.035 * Math.sin(Math.PI * stance.s));
    hipY = ankY - Math.sqrt(Math.max(1, Leff * Leff - stance.x * stance.x));
    for (const [L, near] of [[fL, false], [nL, true]] as const)
      legs.push({ ank: [300 + L.x, ankY - L.h], pitch: L.stance ? 0 : rad(35 * Math.sin(Math.PI * L.s) * (1 - 1.6 * L.s)), near });
    lean = 4 + 3 * Math.cos(2 * two * phase); // 7 deg at contact, 1 deg at passing
    nearFwd = nL.x / (S / 2);
  } else if (mode === "push") {
    hipY = ankY - 0.87 * legLen;
    legs.push({ ank: [300 - 0.5 * legLen, ankY], pitch: rad(-8), near: false }, { ank: [300 + 0.32 * legLen, ankY], pitch: 0, near: true });
    lean = 14 * pose;
  } else if (mode === "swing") {
    hipY = SWING_HIP;
    const a = rad(60 * pose);
    for (const [dx, near] of [[-6, false], [0, true]] as const) {
      const knee: P2 = [300 + l1 * 0.98 + dx * u, hipY + 6 * u];
      legs.push({ ank: [knee[0] + l2 * Math.sin(a), knee[1] + l2 * Math.cos(a)], pitch: -a * 0.5, near });
    }
  } else {
    legs.push({ ank: [300 - 4 * u, ankY], pitch: 0, near: false }, { ank: [300 + 4 * u, ankY], pitch: 0, near: true });
  }
  lean += opts.leanAdd ?? 0;
  const torsoBot = hipY + 0.12 * HH, chin = torsoBot - Bd.torso * HH, hc = chin - H.b, crown = hc - H.b, hip: P2 = [300, hipY];
  p.rot = null;
  for (const L of legs) {
    const knee = mode === "swing" ? ([300 + l1 * 0.98 + (L.near ? 0 : -6 * u), hipY + 6 * u] as P2) : ik(hip, L.ank, l1, l2);
    const hp0: P2 = [300 + (L.near ? 0 : -5 * u), hipY];
    kitLeg(p, [hp0, knee, L.ank], 5.8 * u, o, L.near ? nearCol : farCol, !L.near);
    const c = Math.cos(L.pitch), s = Math.sin(L.pitch);
    footStroke(p, [L.ank[0] - 3 * u * c, L.ank[1] - 3 * u * s], [L.ank[0] + 13 * u * c, L.ank[1] + 13 * u * s + 0.5 * u],
      7.5 * u, L.near ? footCol : footCol === INK ? INK : shade(footCol, 0.82));
  }
  if (o.shorts && mode !== "swing") p.poly([[300 - 24 * u, hipY - 0.12 * HH], [300 + 22 * u, hipY - 0.12 * HH], [300 + 27 * u, hipY + 0.34 * HH], [300 - 26 * u, hipY + 0.34 * HH]], o.shorts, 3.2 * u);
  // ---- upper body leans about the hip ----
  p.rot = lean ? [rad(lean), 300, hipY] : null;
  const T: Blob = { a: (o.build === "stout" ? 0.36 : 0.31) * W, b: 0.5 * (torsoBot - (chin - 0.25 * HH)), nTop: 2.2, nBot: 2.5, egg: 0.1, asym: 0.06,
    rot: 0, noise: 0.006, seed: seed + 7 };
  const tcx = 300 + 2 * u, tcy = torsoBot - T.b, tp = blobPts(tcx, tcy, T);
  const armCol = mix(o.jacket, INK, 0.5), farArm = mix(o.jacket, INK, 0.68);
  const S: P2 = [tcx + 0.05 * T.a, chin + 0.14 * HH], aLen = 0.95 * HH;
  const swingArm = (ang: number): [P2, P2, P2] => {
    const e: P2 = [S[0] + Math.sin(ang) * aLen * 0.5, S[1] + Math.cos(ang) * aLen * 0.5], a2 = ang + rad(16) * Math.sign(ang || 1);
    return [S, e, [e[0] + Math.sin(a2) * aLen * 0.5, e[1] + Math.cos(a2) * aLen * 0.5]];
  };
  const rifle = !!o.rifle && (mode === "march" || mode === "stand");
  const B0: P2 = [tcx + 0.72 * T.a, chin + 0.58 * HH], B1: P2 = [tcx - 0.95 * T.a - 22 * u, crown - 0.4 * HH];
  let near: [P2, P2, P2], far: [P2, P2, P2] | null;
  if (mode === "swing") { near = [S, [S[0] + 12 * u, S[1] - 0.16 * HH], [300 + 6 * u, chin - 0.3 * HH]]; far = [S, [S[0] + 8 * u, S[1] - 0.18 * HH], [300 + 2 * u, chin - 0.36 * HH]]; }
  else if (mode === "push") {
    const reach = 0.55 * HH + 0.45 * HH * pose;
    let hN: P2 = [S[0] + reach, S[1] + 0.06 * HH];
    if (opts.hand) {
      // target is in final canvas units; the arm is drawn inside the lean rotation, so undo it
      const th = -rad(lean), dx = opts.hand[0] - 300, dy = opts.hand[1] - hipY;
      const tg: P2 = [300 + dx * Math.cos(th) - dy * Math.sin(th), hipY + dx * Math.sin(th) + dy * Math.cos(th)];
      hN = [hN[0] + (tg[0] - hN[0]) * pose, hN[1] + (tg[1] - hN[1]) * pose];
    }
    near = [S, [(S[0] + hN[0]) / 2, (S[1] + hN[1]) / 2 + 0.06 * HH], hN];
    far = [S, [(S[0] + hN[0]) / 2 - 4 * u, (S[1] + hN[1]) / 2 - 0.02 * HH], [hN[0] - 6 * u, hN[1] - 0.08 * HH]];
  } else if (rifle) { near = [S, [S[0] - 4 * u, S[1] + 0.42 * HH], B0]; far = mode === "march" ? swingArm(rad(30) * nearFwd) : swingArm(0); }
  else { near = swingArm(rad(-30) * nearFwd); far = mode === "march" ? swingArm(rad(30) * nearFwd) : null; }
  if (far) { p.stroke(curve(far[0], far[1], far[2]), 5.2 * u, farArm); p.dot(far[2][0], far[2][1], 5.5 * u); }
  p.gradFill(tp, o.jacket, mul(o.jacket, SH_CLOTH), light);
  p.clip(tp, () => {
    if (o.stripes) for (let k = -3; k <= 3; k++) if (k % 2 === 0) p.band([[tcx + k * 0.3 * T.a, chin - 0.3 * HH], [tcx + k * 0.3 * T.a, torsoBot + 0.1 * HH]], o.stripes, 0.15 * T.a, 0, "butt");
    if (o.belt) p.band([[tcx - 0.65 * T.a, chin - 0.05 * HH], [tcx + 0.75 * T.a, torsoBot - 0.1 * HH]], o.belt!, 5.5 * u, 1.8 * u);
    if (o.sash) p.band([[tcx - 1.3 * T.a, torsoBot - 0.32 * HH], [tcx + 1.3 * T.a, torsoBot - 0.32 * HH]], o.sash, 0.13 * HH, 1.8 * u);
    if (!o.dress && o.buttons !== "none") for (let i = 0; i < 3; i++) { const y = chin + 0.16 * HH + i * 0.24 * HH; p.dot(tcx + 0.8 * T.a, y, 3 * u, INK); p.dot(tcx + 0.8 * T.a, y, 2.2 * u, o.buttons ?? shade(o.jacket, 0.7)); }
  });
  p.inkRing(tp, ow, thick);
  if (rifle) {
    p.band([B0, B1], "#7a4b2a", 5 * u, 1.5 * u, "round");
    p.band([lerp2(B0, B1, 0.6), B1], "#8d949c", 2.4 * u, 1.2 * u, "round");
  }
  p.stroke(curve(near[0], near[1], near[2]), 5.2 * u, armCol); p.dot(near[2][0], near[2][1], 5.5 * u);
  // ---- head ----
  const hx = 300 + 4 * u;
  hatBehind(p, o, H, hx, hc, light, thick, ow, true);
  const hp = blobPts(hx, hc, H);
  p.shadedFill(hp, skin, mul(skin, SH_SKIN), light, H.a);
  p.inkRing(hp, ow, thick);
  hatOn(p, o, hp, H, hx, hc, light, seed, 1, true);
  const brim = !!o.hat && o.hat !== "hair" && o.hat !== "bonnet" && o.hat !== "cap";
  faceSide(p, hx, hc, W, expr, lid, brim, skin, o.moustache, o.build === "stout");
  p.rot = null;
};

/** rope + seat + seated kid on a 700 x 2300 canvas; the pivot is design (350, 20); kid drawn at 0.92 scale */
export const swingKid = (p: Pen, o: Outfit, kick: number, expr: Expr, light = DEF_LIGHT, blink: number = 0) => {
  const rope = 1830, k = 1.1, HH = 2 * headBlob(5, BUILD[o.build ?? "adult"].a, 1).b;
  // two ropes from the pivot to the ends of a wide plank, the kid framed between them: a single rope behind the kid
  // ended at the cap and read as a hanging. Far rope behind the kid, near rope drawn over (clear of the face).
  const seat = rope + 18, x0 = 150, x1 = 550;
  p.line([[350, 20], [x0 + 16, seat + 4]], "#a07a4c", 10);
  p.poly(rrect(x0, seat, x1, seat + 36, 10), "#b5653f", 9);
  const g = p.g;
  g.save();
  g.translate(350 - 300 * k, rope + 18 - (SWING_HIP + 0.12 * HH) * k);
  g.scale(k, k);
  bodySide(new Pen(g), o, { expr, mode: "swing", pose: kick, light, seed: 5, blink });
  g.restore();
  p.line([[350, 20], [x1 - 16, seat + 4]], "#a07a4c", 10);
};

// ---------------- effects ----------------
export const fxNote = (p: Pen, kind: number, col = "#1f2a44") => {
  p.ell(70, 200, 46, 34, col, 8, 0, 360, -20);
  p.stroke([[110, 190], [110, 40]], 14);
  if (kind === 0) p.poly([[110, 40], [170, 70], [170, 110], [110, 82]], col, 8);
  else {
    p.ell(150, 170, 40, 30, col, 8, 0, 360, -20);
    p.stroke([[186, 160], [186, 20]], 14);
    p.poly([[110, 40], [186, 20], [186, 50], [110, 70]], col, 8);
  }
};

/** spark / impact star on a 500 x 500 canvas; t in 0..1 */
export const fxBurst = (p: Pen, t: number, col = "#fff3b0", rays = 10, r0 = 40, r1 = 230) => {
  const c = 250, e = 1 - (1 - t) ** 3;
  for (let i = 0; i < rays; i++) {
    const a = rad((i * 360) / rays + 7 * (i % 2)), ra = r0 + (r1 - r0) * e * (0.75 + 0.25 * (i % 2));
    p.poly([[c + r0 * 0.5 * Math.cos(a + 0.18), c + r0 * 0.5 * Math.sin(a + 0.18)], [c + ra * Math.cos(a), c + ra * Math.sin(a)],
      [c + r0 * 0.5 * Math.cos(a - 0.18), c + r0 * 0.5 * Math.sin(a - 0.18)]], col, Math.max(3, 8 * (1 - t)));
  }
  if (t < 0.5) p.ell(c, c, r0 * (1.4 - t), r0 * (1.4 - t), WHITE, 8);
};

/** water splash crown on an 800 x 800 canvas; t in 0..1 */
export const fxSplash = (p: Pen, t: number) => {
  const c = 400, size = 800, rise = Math.sin(Math.min(1, t * 1.3) * Math.PI);
  const blue = "#bfe8ff", deep = "#6cc0f0";
  if (rise > 0.02) {
    const pts: P2[] = [];
    for (let i = 0; i < 19; i++) {
      const h = (i % 2 ? 260 : 130) * rise * (0.7 + 0.3 * Math.sin(i * 1.7));
      pts.push([c - 330 + (660 * i) / 18, size - 120 - h]);
    }
    p.poly([...pts, [c + 330, size - 90], [c - 330, size - 90]], blue, 10);
    p.ell(c, size - 100, 360, 46, deep, 10);
  }
  for (let i = 0; i < 8; i++) {
    const a = rad(200 + i * 18), d = 120 + 380 * t, y = size - 160 + d * Math.sin(a) + 520 * t * t, r = 26 * (1 - t) + 6;
    if (t > 0.08 && y < size - 40) p.ell(c + d * Math.cos(a), y, r, r * 1.25, blue, 7);
  }
};

/** dust puff on a 300 x 300 canvas; t in 0..1 */
export const fxPuff = (p: Pen, t: number) => {
  for (let i = 0; i < 5; i++) {
    const a = rad(160 + i * 55), d = 40 + 70 * t, r = (34 + 20 * (i % 2)) * (1 - 0.6 * t);
    p.ell(150 + d * Math.cos(a), 180 + d * 0.45 * Math.sin(a), r, r * 0.8, `rgba(238,225,205,${(1 - t).toFixed(3)})`, 0);
  }
};

/** circling stars on a 420 x 210 canvas */
export const fxStars = (p: Pen, t: number) => {
  for (let i = 0; i < 4; i++) {
    const a = t * Math.PI * 2 + (i * Math.PI) / 2, x = 210 + 150 * Math.cos(a), y = 110 + 40 * Math.sin(a), pts: P2[] = [];
    for (let k = 0; k < 10; k++) { const r = k % 2 ? 14 : 34, b = rad(k * 36 - 90); pts.push([x + r * Math.cos(b), y + r * Math.sin(b)]); }
    p.poly(pts, "#ffd84a", 6);
  }
};

/** three jittering strain ticks on a 300 x 300 canvas */
export const fxCreak = (p: Pen, t: number) => {
  const j = 6 * Math.sin(t * 40);
  for (const a of [-30, 0, 30]) {
    const b = rad(a - 90);
    p.stroke([[150 + 70 * Math.cos(b) + j, 230 + 70 * Math.sin(b)], [150 + 100 * Math.cos(b) + 10 + j, 230 + 100 * Math.sin(b)],
      [150 + 130 * Math.cos(b) + j, 230 + 130 * Math.sin(b)]], 10);
  }
};

/** flat water ring (drawn top-down) on a 600 x 600 canvas; t in 0..1 */
export const fxRing = (p: Pen, t: number) => {
  // thin light water rings (white crest, pale blue trailing rings), thinning as they spread
  const g = p.g;
  for (let k = 0; k < 3; k++) {
    const u = t - k * 0.22;
    if (u <= 0 || u >= 1) continue;
    g.beginPath(); g.ellipse(300, 300, 60 + 230 * u, 60 + 230 * u, 0, 0, Math.PI * 2);
    g.strokeStyle = k === 0 ? "#f6fcff" : "#cfe8fa"; g.lineWidth = 9 * (1 - u) + 3; g.stroke();
  }
};

/** text-free sign on a 700 x 520 canvas: "no marching in step on the bridge". A bridge (deck + arch + piers), four
 *  identical pairs of marching legs in the same stride (in step), a bold red X over all of it. */
export const fxSign = (p: Pen) => {
  const g = p.g, RED = "#d42f2f";
  p.poly(rrect(14, 14, 686, 506, 40), "#f6ecd2", 0);
  p.poly(rrect(14, 14, 686, 506, 40), null, 14);
  // bridge: deck, stone arch underneath, two piers
  p.poly(rrect(70, 352, 630, 384, 8), "#8a5a3a", 9);
  g.beginPath(); g.moveTo(112, 470); g.quadraticCurveTo(350, 300, 588, 470);
  g.strokeStyle = INK; g.lineWidth = 16; g.lineCap = "round"; g.stroke();
  for (const x of [88, 612]) p.poly(rrect(x - 16, 384, x + 16, 470, 4), "#8a5a3a", 9);
  // four identical soldiers' legs mid-stride: same leg forward on every one = in step
  for (const x of [150, 278, 406, 534]) {
    p.poly(rrect(x - 30, 150, x + 30, 214, 14), "#357650", 9);                  // coat hem
    p.stroke([[x - 8, 210], [x + 34, 262], [x + 46, 338]], 15, INK);           // front leg
    p.stroke([[x + 6, 210], [x - 12, 274], [x - 36, 336]], 15, INK);           // back leg
    p.poly(rrect(x + 30, 330, x + 74, 350, 9), INK, 0);                          // boots point forward
    p.poly(rrect(x - 52, 328, x - 8, 348, 9), INK, 0);
  }
  // big red X
  for (const [a, b] of [[[96, 70], [604, 452]], [[604, 70], [96, 452]]] as [[number, number], [number, number]][]) {
    p.stroke([a, b], 58, "#ffffff");
    p.stroke([a, b], 42, RED);
  }
};

/** soft cartoon cloud on a 600 x 300 canvas */
export const fxCloud = (p: Pen, seed: number) => {
  const blobs: [number, number, number][] = [[150, 190, 80], [250, 150, 105], [360, 160, 95], [450, 195, 70], [300, 210, 90]];
  for (const [x, y, r] of blobs) p.ell(x + ((seed * 37) % 20) - 10, y, r, r * 0.8, "#ffffff", 0);
  p.ell(300, 235, 230, 40, "#ffffff", 0);
};

/** cast shadow on a 128 x 256 canvas: dark soft contact pool at the feet (y 205) and a softer tail that runs up the
 *  canvas = away from the sun, fading with distance; multiply colour (sRGB-encoded linear ratio), white = no change */
export const fxShadow = (p: Pen, col: string) => {
  const g = p.g;
  g.fillStyle = WHITE; g.fillRect(0, 0, 128, 256);
  g.save(); g.filter = "blur(9px)";
  const lg = g.createLinearGradient(0, 205, 0, 22);
  lg.addColorStop(0, mix(col, WHITE, 0.08)); lg.addColorStop(0.55, mix(col, WHITE, 0.3)); lg.addColorStop(1, mix(col, WHITE, 0.85));
  g.fillStyle = lg;
  g.beginPath(); g.moveTo(40, 205); g.bezierCurveTo(36, 120, 46, 50, 64, 30); g.bezierCurveTo(82, 50, 92, 120, 88, 205); g.closePath(); g.fill();
  g.fillStyle = col; g.beginPath(); g.ellipse(64, 205, 30, 17, 0, 0, Math.PI * 2); g.fill();
  g.restore();
};

/** tight contact shadow right under the feet on a 128 x 128 canvas: dark core, short fall-off (multiply colour) */
export const fxContact = (p: Pen, col: string) => {
  const g = p.g;
  g.fillStyle = WHITE; g.fillRect(0, 0, 128, 128);
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  for (const [r, k] of [[0, 0], [0.32, 0.02], [0.5, 0.22], [0.66, 0.58], [0.82, 0.88], [1, 1]] as const) gr.addColorStop(r, mix(col, WHITE, k));
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
};

/** floating wooden plank, side-on, on a 320 x 110 canvas */
export const fxPlank = (p: Pen) => {
  p.poly(rrect(14, 30, 306, 78, 10), "#a8744a", 9);
  p.line([[40, 46], [150, 44], [270, 50]], "#7d5234", 4);
  p.line([[60, 62], [200, 64], [284, 60]], "#7d5234", 4);
  p.dot(36, 54, 5, INK); p.dot(284, 54, 5, INK);
};

/** floating marching drum (no text) on a 260 x 240 canvas: white shell, red hoops, ink zig-zag cord */
export const fxDrum = (p: Pen) => {
  p.poly(rrect(40, 70, 220, 190, 16), "#f1ece0", 9);
  p.poly(rrect(32, 58, 228, 86, 12), "#c9373a", 8);
  p.poly(rrect(32, 176, 228, 204, 12), "#c9373a", 8);
  p.line([[52, 88], [82, 172], [112, 88], [142, 172], [172, 88], [202, 172]], INK, 6);
  p.ell(130, 58, 98, 18, "#f7f3ea", 8);
};

/** soft ground contact blob on a 128 x 128 canvas, multiply colour (sRGB-encoded linear ratio) in the centre */
export const fxBlob = (p: Pen, col: string) => {
  const g = p.g;
  g.fillStyle = WHITE; g.fillRect(0, 0, 128, 128);
  // soft contact shadow: flat core, then a long smooth (roughly gaussian) fall-off to white = no change
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  for (const [r, k] of [[0, 0], [0.5, 0.04], [0.64, 0.18], [0.76, 0.42], [0.87, 0.72], [0.95, 0.92], [1, 1]] as const) gr.addColorStop(r, mix(col, WHITE, k));
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
};

// ===================== figure v3: richer cast =====================
// White bean heads, bigger features, glasses, hats, moustaches, patterned clothes with garments, held props, kneel/sit.
export type ArmK = "hang" | "hip" | "up" | "wave" | "front" | "chin" | "point" | "pray" | "mouth" | "reach" | "low" | "eat" | "ear" | "mic" | [number, number] | [number, number, number];
export type Hold = "cup" | "camera" | "wallet" | "hair" | "frame" | "cane" | "flower" | "coin" | "rag" | "candle" | "phone" | "bag" | "trophy" | "tweezer" | "pan" | "fork" | "mic" | "scissors" | "plate" | "medal" | "case" | "hook" | "flagES" | "flagDE" | "burger" | "bagP" | "handset" | "ball" | "cupT" | "flagJM" | "guitar" | "shirt" | "helm" | "drink" | "paper";
export type Char = {
  skin?: string; build?: Build; head?: number;
  hair?: { k: "curly" | "short" | "bun" | "bald" | "side" | "long" | "tuft" | "quiff" | "dreads"; c: string };
  brows?: number; studs?: string;
  hat?: { k: "coppola" | "scarf" | "beanie" | "bucket" | "cap" | "chef" | "boina" | "helmet" | "tam" | "straw"; c: string; c2?: string; c3?: string };
  glasses?: "round" | "sun"; stache?: string; stubble?: boolean; earring?: string;
  top: string; pat?: { k: "v" | "h" | "check" | "dots" | "flower"; c: string };
  apron?: string; vest?: string; bow?: string; tie?: string; collar?: string; scarf?: [string, string]; num?: string; buttons?: string;
  pocket?: boolean; necklace?: string; skirt?: string;
  legs: string; shoes?: string; socks?: string; shorts?: string; bare?: boolean;
};
export type Pose = {
  expr?: Expr; facing?: -1 | 0 | 1; look?: number; blink?: number; tilt?: number; headTilt?: number;
  legs?: "stand" | "walk" | "run" | "kneel" | "sit"; phase?: number; armL?: ArmK; armR?: ArmK; holdL?: Hold; holdR?: Hold;
  back?: boolean; sweat?: number; light?: number; seed?: number; wide?: number;
};
// hand [dx outward, dy down] in u from the shoulder, elbow bulge outward
const ARMS: Record<string, [number, number, number]> = {
  hang: [9, 98, 6], hip: [0, 62, 34], up: [46, -80, 10], wave: [64, -46, 2], front: [-30, 46, 14], chin: [-22, 0, 20], point: [82, 8, -6],
  pray: [-37, 32, 12], mouth: [-25, -12, 20], reach: [74, -16, -2], low: [-18, 74, 10],
  // drawn over the head (the hand and what it holds stay visible): eating, a phone at the ear, a microphone under the chin
  eat: [-20, 8, 18], ear: [22, -46, 14], mic: [-24, 16, 18],
};
const LATE = new Set(["eat", "ear", "mic"]);
const holdDraw = (p: Pen, k: Hold, x: number, y: number, u: number, s: number) => {
  const o = 2 * u;
  switch (k) {
    case "cup":
      p.ell(x, y + 5 * u, 15 * u, 4 * u, "#f6f1e6", o); p.poly([[x - 9 * u, y - 9 * u], [x + 9 * u, y - 9 * u], [x + 7 * u, y + 4 * u], [x - 7 * u, y + 4 * u]], "#fffdf6", o);
      p.arc(x + s * 10 * u, y - 3 * u, 4 * u, 4 * u, s > 0 ? -90 : 90, s > 0 ? 90 : 270, 2 * u); p.ell(x, y - 9 * u, 9 * u, 2.6 * u, "#4a2a18", 1.6 * u);
      for (const d of [-3, 3]) p.stroke([[x + d * u, y - 14 * u], [x + (d + 3) * u, y - 19 * u], [x + d * u, y - 24 * u]], 1.6 * u, "#ffffff"); break;
    case "camera":
      p.poly(rrect(x - 17 * u, y - 12 * u, x + 17 * u, y + 10 * u, 3 * u), "#3a3d4a", o); p.poly(rrect(x - 12 * u, y - 17 * u, x - 2 * u, y - 11 * u, u), "#3a3d4a", o);
      p.ell(x + 2 * u, y - u, 8.5 * u, 8.5 * u, "#8fb8d8", o); p.ell(x + 2 * u, y - u, 4 * u, 4 * u, "#27303d", 0); p.dot(x + 12 * u, y - 7 * u, 2 * u, "#ffd75a"); break;
    case "wallet": p.poly(rrect(x - 14 * u, y - 9 * u, x + 14 * u, y + 10 * u, 3 * u), "#8a5630", o); p.stroke([[x - 14 * u, y - 2 * u], [x + 14 * u, y - 2 * u]], 1.5 * u); p.dot(x + 8 * u, y + 3 * u, 2 * u, "#e8c45a"); break;
    case "hair": { const h: P2[] = []; for (let i = 0; i <= 14; i++) h.push([x + (2.5 * Math.sin(i * 1.5)) * u, y - i * 2.3 * u]); p.stroke(h, 1.7 * u, "#14100e"); break; }
    case "tweezer": p.stroke([[x, y], [x + s * 3 * u, y - 22 * u]], 2 * u, "#b9c0c8"); p.stroke([[x + s * 5 * u, y], [x + s * 3 * u, y - 22 * u]], 2 * u, "#b9c0c8"); break;
    case "frame": p.poly(rrect(x - 15 * u, y - 19 * u, x + 15 * u, y + 15 * u, 2 * u), "#e9b93c", o); p.poly(rrect(x - 9 * u, y - 13 * u, x + 9 * u, y + 9 * u, u), "#fff6dc", 1.5 * u);
      p.stroke([[x - 2 * u, y + 5 * u], [x + 2 * u, y], [x - 2 * u, y - 4 * u], [x + 2 * u, y - 9 * u]], 1.4 * u, "#14100e"); break;
    case "cane": p.stroke([[x, y - 4 * u], [x + s * 3 * u, y + 120 * u]], 4.4 * u, "#7a4b2a"); p.arc(x - s * 5 * u, y - 4 * u, 5 * u, 6 * u, 180, 360, 4.4 * u, "#7a4b2a"); break;
    case "flower": p.stroke([[x, y + 4 * u], [x + s * 2 * u, y - 20 * u]], 2.4 * u, "#3f8a4a"); for (let i = 0; i < 5; i++) p.ell(x + s * 2 * u + 6 * u * Math.cos(i * 1.256), y - 24 * u + 6 * u * Math.sin(i * 1.256), 4.6 * u, 4.6 * u, "#f25c7a", 1.4 * u); p.dot(x + s * 2 * u, y - 24 * u, 3 * u, "#ffd75a"); break;
    case "coin": p.ell(x, y - 6 * u, 7 * u, 7 * u, "#f2c64a", o); p.arc(x, y - 6 * u, 3.5 * u, 3.5 * u, 200, 420, 1.3 * u, "#a87a1c"); break;
    case "rag": p.poly([[x - 12 * u, y - 4 * u], [x + 10 * u, y - 7 * u], [x + 14 * u, y + 12 * u], [x + 2 * u, y + 8 * u], [x - 9 * u, y + 15 * u]], "#f4f0e6", o); break;
    case "candle": p.poly(rrect(x - 4 * u, y - 20 * u, x + 4 * u, y + 4 * u, u), "#fff3d0", o); p.ell(x, y - 26 * u, 3.5 * u, 6 * u, "#ffb02e", 1.2 * u); break;
    case "phone": p.poly(rrect(x - 8 * u, y - 18 * u, x + 8 * u, y + 8 * u, 2 * u), "#2c2f3a", o); p.poly(rrect(x - 5.5 * u, y - 14 * u, x + 5.5 * u, y + 3 * u, u), "#9fd6f2", 0); break;
    case "bag": p.arc(x, y + 2 * u, 9 * u, 12 * u, 180, 360, 2.4 * u); p.poly(rrect(x - 15 * u, y + 2 * u, x + 15 * u, y + 30 * u, 3 * u), "#c9473f", o); break;
    case "pan": p.stroke([[x, y], [x + s * 4 * u, y - 26 * u]], 5 * u, "#3a2a22"); p.ell(x + s * 6 * u, y - 44 * u, 22 * u, 20 * u, "#4a4f5c", o); p.ell(x + s * 6 * u, y - 44 * u, 15 * u, 13.5 * u, "#2c303a", 0); p.arc(x + s * 6 * u, y - 44 * u, 18 * u, 16 * u, 200, 250, 2 * u, "#aab2c0"); break;
    case "fork": p.stroke([[x, y + 4 * u], [x + s * 2 * u, y - 30 * u]], 2.6 * u, "#c9ced6"); for (const d of [-4, 0, 4]) p.stroke([[x + s * 2 * u + d * u, y - 30 * u], [x + s * 2.5 * u + d * 1.2 * u, y - 44 * u]], 2 * u, "#c9ced6"); p.stroke([[x + s * 2 * u - 4 * u, y - 30 * u], [x + s * 2 * u + 4 * u, y - 30 * u]], 2 * u, "#c9ced6"); break;
    case "mic": p.stroke([[x, y + 6 * u], [x + s * 3 * u, y - 16 * u]], 4.5 * u, "#2c2f3a"); p.ell(x + s * 4 * u, y - 24 * u, 8 * u, 9 * u, "#e2453c", o); p.poly(rrect(x + s * 1.5 * u - 6 * u, y - 14 * u, x + s * 1.5 * u + 6 * u, y - 5 * u, u), "#f4f1ea", 1.5 * u); break;
    case "scissors": for (const d of [-1, 1]) { p.stroke([[x + d * 3 * u, y - 2 * u], [x - d * 5 * u, y - 34 * u]], 2.6 * u, "#c9ced6"); p.ell(x + d * 5 * u, y + 3 * u, 4.5 * u, 5.5 * u, null, 2.4 * u); } p.dot(x, y - 12 * u, 1.8 * u, "#6a6f7a"); break;
    case "plate": p.ell(x, y - 2 * u, 26 * u, 8 * u, "#c98a4a", o); p.ell(x, y - 3.5 * u, 21 * u, 5.6 * u, "#e0a868", 0); for (let i = 0; i < 7; i++) { const a = i * 0.9, px = x + 13 * u * Math.cos(a), py = y - 4.5 * u + 3.2 * u * Math.sin(a); p.ell(px, py, 4.2 * u, 2.6 * u, "#f3e6dc", 1.2 * u); p.arc(px, py, 4.2 * u, 2.6 * u, 180, 360, 1.5 * u, "#a8456e"); } p.dot(x, y - 5 * u, 1.3 * u, "#d0442e"); p.dot(x + 6 * u, y - 3 * u, 1.3 * u, "#d0442e"); break;
    case "medal": p.stroke([[x - 7 * u, y - 30 * u], [x, y - 8 * u], [x + 7 * u, y - 30 * u]], 4 * u, "#d0442e"); p.ell(x, y, 10 * u, 10 * u, "#f2c64a", o); p.ell(x, y, 5.5 * u, 5.5 * u, "#ffe9a0", 1.2 * u); break;
    case "case": p.arc(x, y + 2 * u, 7 * u, 8 * u, 180, 360, 2.4 * u); p.poly(rrect(x - 20 * u, y + 2 * u, x + 20 * u, y + 30 * u, 3 * u), "#6a4a2c", o); p.poly(rrect(x - 15 * u, y - 4 * u, x + 15 * u, y + 5 * u, u), "#7fc98a", 1.5 * u); p.stroke([[x - 15 * u, y + 0.5 * u], [x + 15 * u, y + 0.5 * u]], 1.2 * u, "#3f8a4a"); p.dot(x, y + 14 * u, 2.4 * u, "#e8c45a"); break;
    case "hook": p.stroke([[x, y + 6 * u], [x + s * 2 * u, y - 40 * u]], 3 * u, "#8a6a4a"); p.arc(x + s * 7 * u, y - 40 * u, 5 * u, 6 * u, 180, 380, 2.6 * u, "#b9c0c8"); break;
    case "flagJM": { p.stroke([[x, y + 8 * u], [x + s * 1 * u, y - 50 * u]], 2.6 * u, "#8a6a4a"); const x0 = x + s * 1 * u, w = s * 40 * u, yt = y - 50 * u, yb = y - 24 * u, R: P2[] = [[x0, yt], [x0 + w, yt + u], [x0 + w, yb + u], [x0, yb]];
      p.poly(R, "#1f8a3a", 0); p.poly([[x0, yt], [x0 + w / 2, (yt + yb) / 2], [x0, yb]], "#1c1a20", 0); p.poly([[x0 + w, yt + u], [x0 + w / 2, (yt + yb) / 2], [x0 + w, yb + u]], "#1c1a20", 0);
      p.stroke([[x0, yt], [x0 + w, yb + u]], 4.4 * u, "#f6c419"); p.stroke([[x0 + w, yt + u], [x0, yb]], 4.4 * u, "#f6c419"); p.poly(R, null, 1.6 * u); break; }
    case "guitar": { const gx = x - s * 6 * u, gy = y + 4 * u; p.stroke([[gx, gy], [gx + s * 44 * u, gy - 30 * u]], 6 * u, INK); p.stroke([[gx, gy], [gx + s * 44 * u, gy - 30 * u]], 3.4 * u, "#6e3a1a"); p.ell(gx - s * 10 * u, gy + 8 * u, 21 * u, 17 * u, "#d99a4a", o); p.ell(gx - s * 26 * u, gy + 18 * u, 15 * u, 13 * u, "#d99a4a", o); p.ell(gx - s * 12 * u, gy + 9 * u, 6 * u, 6 * u, "#3a2416", 0); p.poly(rrect(gx + s * 40 * u - 5 * u, gy - 36 * u, gx + s * 40 * u + 7 * u, gy - 26 * u, 2 * u), "#3a2416", 1.4 * u); break; }
    case "shirt": { const T: P2[] = [[x - 20 * u, y - 4 * u], [x - 8 * u, y - 10 * u], [x, y - 6 * u], [x + 8 * u, y - 10 * u], [x + 20 * u, y - 4 * u], [x + 15 * u, y + 6 * u], [x + 10 * u, y + 3 * u], [x + 10 * u, y + 30 * u], [x - 10 * u, y + 30 * u], [x - 10 * u, y + 3 * u], [x - 15 * u, y + 6 * u]];
      p.poly(T, "#23202a", o); p.stroke([[x - 7 * u, y + 12 * u], [x + 7 * u, y + 12 * u]], 4 * u, "#f6c419"); p.stroke([[x - 7 * u, y + 18 * u], [x + 7 * u, y + 18 * u]], 4 * u, "#1f8a3a"); break; }
    case "helm": { const hp2 = ellPts(x, y - 4 * u, 17 * u, 15 * u, 180, 360); p.poly([...hp2, [x + 17 * u, y + 6 * u], [x - 17 * u, y + 6 * u]], "#23202a", o); p.stroke([[x, y - 18 * u], [x, y + 5 * u]], 7 * u, "#f6c419"); p.stroke([[x - 6 * u, y - 16 * u], [x - 6 * u, y + 5 * u]], 3 * u, "#1f8a3a"); p.stroke([[x + 6 * u, y - 16 * u], [x + 6 * u, y + 5 * u]], 3 * u, "#1f8a3a"); break; }
    case "drink": p.poly([[x - 8 * u, y - 16 * u], [x + 8 * u, y - 16 * u], [x + 5 * u, y + 6 * u], [x - 5 * u, y + 6 * u]], "#ffb347", o); p.stroke([[x + 2 * u, y - 16 * u], [x + 9 * u, y - 30 * u]], 2 * u, "#e2453c"); p.ell(x - 9 * u, y - 17 * u, 5 * u, 5 * u, "#e9d43c", 1.4 * u); break;
    case "paper": p.poly([[x - 14 * u, y - 26 * u], [x + 14 * u, y - 24 * u], [x + 13 * u, y + 6 * u], [x - 15 * u, y + 4 * u]], "#fbf6e6", o); p.poly([[x - 9 * u, y - 6 * u], [x + 8 * u, y - 6 * u], [x + 10 * u, y - 12 * u], [x + 2 * u, y - 16 * u], [x - 8 * u, y - 13 * u]], "#23202a", 0); p.stroke([[x - 10 * u, y - 3 * u], [x + 10 * u, y - 3 * u]], 1.6 * u, "#8f9bb0"); break;
    case "flagES": case "flagDE": { p.stroke([[x, y + 8 * u], [x + s * 1 * u, y - 44 * u]], 2.6 * u, "#8a6a4a"); const x0 = x + s * 1 * u, w = s * 34 * u, cs = k === "flagES" ? ["#c8102e", "#f6c419", "#f6c419", "#c8102e"] : ["#1c1a20", "#1c1a20", "#d0202a", "#f6c419"], hh = k === "flagES" ? [0, 6, 12, 18, 24] : [0, 4, 8, 16, 24];
      if (k === "flagDE") { for (let i = 0; i < 3; i++) p.poly([[x0, y - 44 * u + i * 8 * u], [x0 + w, y - 43 * u + i * 8 * u], [x0 + w, y - 35 * u + i * 8 * u], [x0, y - 36 * u + i * 8 * u]], ["#1c1a20", "#d0202a", "#f6c419"][i], 0); }
      else for (let i = 0; i < 4; i++) p.poly([[x0, y - 44 * u + hh[i] * u], [x0 + w, y - 43 * u + hh[i] * u], [x0 + w, y - 43 * u + hh[i + 1] * u], [x0, y - 44 * u + hh[i + 1] * u]], cs[i], 0);
      p.poly([[x0, y - 44 * u], [x0 + w, y - 43 * u], [x0 + w, y - 19 * u], [x0, y - 20 * u]], null, 1.6 * u); break; }
    case "burger": p.ell(x, y - 2 * u, 15 * u, 5 * u, "#d99a4a", o); p.poly(rrect(x - 15 * u, y - 9 * u, x + 15 * u, y - 3 * u, 2 * u), "#6e3a1a", 1.6 * u); p.poly(rrect(x - 16 * u, y - 12 * u, x + 16 * u, y - 8.5 * u, 1.5 * u), "#57a05a", 1.4 * u); p.ell(x, y - 12 * u, 15 * u, 10 * u, "#e0a04e", o, 180, 360); p.stroke([[x - 15 * u, y - 12 * u], [x + 15 * u, y - 12 * u]], 1.6 * u); break;
    case "bagP": p.poly([[x - 13 * u, y - 22 * u], [x + 13 * u, y - 24 * u], [x + 15 * u, y + 12 * u], [x - 14 * u, y + 13 * u]], "#d9b68a", o); p.poly([[x - 13 * u, y - 22 * u], [x - 9 * u, y - 28 * u], [x - 4 * u, y - 22 * u], [x + 2 * u, y - 29 * u], [x + 7 * u, y - 23 * u], [x + 13 * u, y - 24 * u]], "#c9a274", 1.6 * u); p.ell(x + 2 * u, y - 2 * u, 6 * u, 5 * u, "#b98a5a", 0); break;
    case "handset": p.arc(x + s * 3 * u, y - 16 * u, 6 * u, 16 * u, s > 0 ? -70 : 110, s > 0 ? 70 : 250, 7 * u, "#23232c"); p.dot(x + s * 5 * u, y - 31 * u, 5 * u, "#23232c"); p.dot(x + s * 5 * u, y - 1 * u, 5 * u, "#23232c"); p.stroke([[x + s * 5 * u, y + 2 * u], [x + s * 9 * u, y + 14 * u], [x + s * 5 * u, y + 26 * u], [x + s * 10 * u, y + 40 * u]], 1.6 * u, "#23232c"); break;
    case "ball": p.ell(x, y - 6 * u, 15 * u, 15 * u, "#fbfaf6", o); for (const [dx, dy] of [[0, -6], [-9, -13], [9, -13], [-8, 3], [8, 3]]) p.ell(x + dx * u, y + dy * u, 4 * u, 4 * u, "#2a2230", 0); p.ell(x, y - 6 * u, 15 * u, 15 * u, null, o); break;
    case "cupT": p.poly([[x - 14 * u, y - 52 * u], [x + 14 * u, y - 52 * u], [x + 9 * u, y - 26 * u], [x + 3 * u, y - 19 * u], [x + 3 * u, y - 8 * u], [x + 10 * u, y - 3 * u], [x - 10 * u, y - 3 * u], [x - 3 * u, y - 8 * u], [x - 3 * u, y - 19 * u], [x - 9 * u, y - 26 * u]], "#f2c64a", o); for (const d of [-1, 1]) p.arc(x + d * 15 * u, y - 41 * u, 6 * u, 8 * u, d > 0 ? -90 : 90, d > 0 ? 90 : 270, 2.4 * u); p.stroke([[x - 7 * u, y - 46 * u], [x - 5 * u, y - 32 * u]], 2.2 * u, "#fff3b0"); break;
    case "trophy": p.poly([[x - 12 * u, y - 46 * u], [x + 12 * u, y - 46 * u], [x + 8 * u, y - 22 * u], [x + 2.5 * u, y - 16 * u], [x + 2.5 * u, y - 6 * u], [x + 9 * u, y - 2 * u], [x - 9 * u, y - 2 * u], [x - 2.5 * u, y - 6 * u], [x - 2.5 * u, y - 16 * u], [x - 8 * u, y - 22 * u]], "#f2c64a", o);
      for (const d of [-1, 1]) p.arc(x + d * 13 * u, y - 36 * u, 5 * u, 7 * u, d > 0 ? -90 : 90, d > 0 ? 90 : 270, 2.2 * u); p.stroke([[x - 6 * u, y - 40 * u], [x - 4 * u, y - 28 * u]], 2 * u, "#fff3b0"); break;
  }
};
export const figure = (p: Pen, c: Char, q: Pose = {}) => {
  const { expr = "neutral", facing = 0, look = 0, blink = 0, tilt = 0, headTilt = 0, legs = "stand", phase = 0, light = DEF_LIGHT, seed = 1, back = false } = q;
  const Bd = BUILD[c.build ?? "adult"], skin = c.skin ?? "#fbf7f2", two = Math.PI * 2, g = p.g;
  const H = headBlob(seed, Bd.a * (c.head ?? 1), back ? 0 : facing), W = 2 * H.a, HH = 2 * H.b, u = W / 100, sole = 975;
  const walk = legs === "walk" || legs === "run";
  const bob = walk ? (legs === "run" ? 0.03 : 0.018) * (1 + Bd.torso + Bd.legs) * HH * Math.cos(2 * two * phase) : 0;
  const torsoBot = legs === "kneel" ? sole - 0.46 * HH : legs === "sit" ? sole - 0.6 * HH : sole - Bd.legs * HH + bob;
  const chin = torsoBot - Bd.torso * HH, hc = chin - H.b, crown = hc - H.b, hipY = torsoBot - 0.12 * HH;
  const thick = thickAngle(light), ow = 5.6 * u, legW = 6 * u, footW = 8 * u, shoes = c.shoes ?? INK;
  const legCol = mix(c.legs, INK, 0.3), armCol = mix(c.top, INK, 0.5);
  p.rot = null;
  const drawLeg = (pts: P2[]) => {
    if (c.bare) { p.stroke(pts, legW * 1.9, INK); p.stroke(pts, legW * 1.9 - 5, skin); if (c.socks) p.stroke(pts.slice(Math.floor(pts.length * 0.55)), legW * 1.9 - 5, c.socks); }
    else p.stroke(pts, legW, legCol);
  };
  const foot = (a: P2, b: P2) => { if (shoes !== INK) p.stroke([a, b], footW + 3, INK); p.stroke([a, b], footW, shoes); };
  if (legs === "kneel") for (const s of [-1, 1]) { const h: P2 = [300 + s * 15 * u, hipY], k: P2 = [300 + s * 21 * u, sole - 5 * u], f: P2 = [300 + s * 60 * u, sole - 5 * u]; drawLeg([h, k]); drawLeg([k, f]); foot(f, [f[0] + s * 8 * u, f[1] - 7 * u]); }
  else if (legs === "sit") for (const s of [-1, 1]) { const h: P2 = [300 + s * 15 * u, hipY], k: P2 = [300 + s * 30 * u, hipY + 0.16 * HH], f: P2 = [300 + s * 33 * u, sole - 5 * u]; drawLeg(curve(h, k, f)); foot([f[0] - s * 2 * u, f[1]], [f[0] + s * 12 * u, f[1] - 3 * u]); }
  else {
    const L = walk ? (legs === "run" ? 72 : 40) : 0;
    for (const [s, ph] of [[-1, 0], [1, 0.5]] as const) {
      const sn = Math.sin(two * (phase + ph)), up = Math.max(0, sn) * L;
      const hx = 300 + s * 15 * u, fx = 300 + s * (22 + (walk ? 0 : q.wide ?? 0)) * u + (walk ? facing * 12 * u * Math.cos(two * (phase + ph)) : 0), fy = sole - 4 * u - up;
      const k: P2 = [(hx + fx) / 2 + s * (1.5 * u + up * 0.16), (hipY + fy) / 2 - up * 0.08];
      drawLeg(curve([hx, hipY], k, [fx, fy]));
      const out = facing || s; foot([fx - out * 3 * u, fy], [fx + out * 13 * u, fy + 0.5 * u]);
    }
  }
  if (c.shorts && legs !== "sit") p.poly([[300 - 31 * u, hipY - 0.12 * HH], [300 + 31 * u, hipY - 0.12 * HH], [300 + 36 * u, hipY + 0.36 * HH], [300 + 5 * u, hipY + 0.36 * HH],
    [300, hipY + 0.2 * HH], [300 - 5 * u, hipY + 0.36 * HH], [300 - 36 * u, hipY + 0.36 * HH]], c.shorts, 3.2 * u);
  const sway = walk ? 1.4 * Math.sin(two * phase) : 0, A = tilt + sway;
  p.rot = A ? [rad(A), 300, hipY] : null;
  const T: Blob = { a: ((Bd.tw / 2) * W) / 1.06, b: 0.5 * (torsoBot - (chin - 0.25 * HH)), nTop: 2.2, nBot: 2.6, egg: c.build === "stout" ? 0.17 : 0.12, asym: 0.04 * facing, rot: 0, noise: 0.006, seed: seed + 7 };
  const tcx = 300 + 3 * u * facing, tcy = torsoBot - T.b, tp = blobPts(tcx, tcy, T), top = chin - 0.3 * HH, bot = torsoBot + 0.1 * HH;
  if (c.skirt) {
    const yb = Math.min(sole - 0.4 * HH, torsoBot + 0.6 * HH), sp: P2[] = [[tcx - 0.8 * T.a, tcy], [tcx + 0.8 * T.a, tcy], ...curve([tcx + 0.98 * T.a, torsoBot - 0.1 * HH], [tcx + 1.3 * T.a, yb - 0.2 * HH], [tcx + 1.28 * T.a, yb]),
      [tcx + 0.6 * T.a, yb + 5 * u], [tcx, yb + 2 * u], [tcx - 0.6 * T.a, yb + 5 * u], ...curve([tcx - 1.28 * T.a, yb], [tcx - 1.3 * T.a, yb - 0.2 * HH], [tcx - 0.98 * T.a, torsoBot - 0.1 * HH])];
    p.gradFill(sp, c.skirt, mul(c.skirt, SH_CLOTH), light); p.poly(sp, null, ow * 0.85);
  }
  const sh = (s: number): P2 => [tcx + s * 0.82 * T.a, chin + 0.14 * HH];
  const sw = walk ? Math.sin(two * phase) : 0;
  const mkArm = (s: number, a: ArmK | undefined) => {
    const [dx, dy, b] = Array.isArray(a) ? [a[0], a[1], a[2] ?? 8] : ARMS[a ?? "hang"], S = sh(s), hang = !a || a === "hang", fwd = s * sw * (hang ? 1 : 0);
    const Hd: P2 = [S[0] + s * (dx + (hang ? 8 - 6 * Math.max(0, fwd) + 4 * Math.max(0, -fwd) : 0)) * u, S[1] + dy * u - Math.abs(fwd) * 9 * u];
    const E: P2 = [(S[0] + Hd[0]) / 2 + s * b * u, (S[1] + Hd[1]) / 2 + (dy < 20 ? Math.abs(b) * 0.5 * u : 0)];
    return { pts: [S, E, Hd] as [P2, P2, P2], front: dx < -8, s, late: !back && typeof a === "string" && LATE.has(a) };
  };
  const arms = [{ ...mkArm(-1, q.armL), hold: q.holdL }, { ...mkArm(1, q.armR), hold: q.holdR }];
  const drawArm = (a: typeof arms[0]) => {
    if (a.hold === "cane") holdDraw(p, "cane", a.pts[2][0], a.pts[2][1], u, a.s);
    p.stroke(curve(a.pts[0], a.pts[1], a.pts[2]), 5.4 * u, armCol); p.dot(a.pts[2][0], a.pts[2][1], 6 * u);
    if (a.hold && a.hold !== "cane") holdDraw(p, a.hold, a.pts[2][0], a.pts[2][1] - 5 * u, u * 1.45, a.s);
  };
  for (const a of arms) if (!a.front && !a.late) drawArm(a);
  // torso: flat fill -> pattern -> garments -> form shade -> ink ring
  p.path(tp, true); g.fillStyle = c.top; g.fill();
  p.clip(tp, () => {
    const P_ = c.pat;
    if (P_?.k === "v") for (let k = -4; k <= 4; k++) p.band([[tcx + k * 0.27 * T.a, top], [tcx + k * 0.27 * T.a, bot]], P_.c, 0.12 * T.a, 0, "butt");
    if (P_?.k === "h") for (let k = 0; k < 9; k++) p.band([[tcx - 1.3 * T.a, top + (k + 0.5) * 0.19 * HH], [tcx + 1.3 * T.a, top + (k + 0.5) * 0.19 * HH]], P_.c, 0.085 * HH, 0, "butt");
    if (P_?.k === "check") { for (let k = -4; k <= 4; k++) p.band([[tcx + k * 0.25 * T.a, top], [tcx + k * 0.25 * T.a, bot]], P_.c, 2.2 * u, 0, "butt"); for (let k = 0; k < 10; k++) p.band([[tcx - 1.3 * T.a, top + k * 0.15 * HH], [tcx + 1.3 * T.a, top + k * 0.15 * HH]], P_.c, 2.2 * u, 0, "butt"); }
    if (P_?.k === "dots") for (let j = 0; j < 9; j++) for (let k = -3; k <= 3; k++) p.dot(tcx + (k + (j % 2) * 0.5) * 0.3 * T.a, top + j * 0.16 * HH, 2.6 * u, P_.c);
    if (P_?.k === "flower") for (let j = 0; j < 7; j++) for (let k = -2; k <= 2; k++) { const fx = tcx + (k + (j % 2) * 0.5) * 0.42 * T.a, fy = top + (j + 0.4) * 0.2 * HH; for (let i = 0; i < 5; i++) p.dot(fx + 3.6 * u * Math.cos(i * 1.256), fy + 3.6 * u * Math.sin(i * 1.256), 2.5 * u, P_.c); p.dot(fx, fy, 2 * u, "#ffe07a"); }
    if (!back) {
      if (c.vest) for (const s of [-1, 1]) p.poly([[tcx + s * 0.3 * T.a, top], [tcx + s * 1.4 * T.a, top], [tcx + s * 1.4 * T.a, bot], [tcx + s * 0.1 * T.a, bot], [tcx + s * 0.1 * T.a, tcy + 0.25 * T.b]], c.vest, 1.8 * u);
      if (c.apron) { p.poly(rrect(tcx - 0.66 * T.a, tcy - 0.42 * T.b, tcx + 0.66 * T.a, bot + 20 * u, 6 * u), c.apron, 2 * u); for (const s of [-1, 1]) p.band([[tcx + s * 0.5 * T.a, tcy - 0.42 * T.b], [tcx + s * 0.3 * T.a, top]], c.apron, 5 * u, 1.6 * u); p.arc(tcx, tcy + 0.3 * T.b, 0.34 * T.a, 0.2 * T.b, 0, 180, 1.8 * u); }
      if (c.collar) for (const s of [-1, 1]) p.poly([[tcx, chin + 0.02 * HH], [tcx + s * 22 * u, chin - 0.04 * HH], [tcx + s * 17 * u, chin + 0.17 * HH]], c.collar, 1.8 * u);
      if (c.tie) p.poly([[tcx - 4 * u, chin + 0.04 * HH], [tcx + 4 * u, chin + 0.04 * HH], [tcx + 7 * u, chin + 0.5 * HH], [tcx, chin + 0.6 * HH], [tcx - 7 * u, chin + 0.5 * HH]], c.tie, 1.8 * u);
      if (c.buttons) for (let i = 0; i < 4; i++) { const y = chin + 0.2 * HH + i * 0.2 * HH; p.dot(tcx + 2 * u * facing, y, 3.2 * u, INK); p.dot(tcx + 2 * u * facing, y, 2.2 * u, c.buttons); }
      if (c.pocket) { p.poly(rrect(tcx + 0.28 * T.a, tcy - 0.12 * T.b, tcx + 0.62 * T.a, tcy + 0.1 * T.b, 2 * u), mix(c.vest ?? c.top, "#ffffff", 0.12), 1.5 * u); }
      if (c.necklace) for (let i = 0; i <= 8; i++) { const a = rad(20 + i * 17.5); p.dot(tcx + 24 * u * Math.cos(a), chin + 0.02 * HH + 14 * u * Math.sin(a), 2.4 * u, c.necklace); }
    }
    if (c.num) { const [nx, ny] = p.P(tcx, tcy + 0.12 * T.b); g.save(); g.font = `900 ${Math.round(0.62 * T.b)}px Arial, sans-serif`; g.textAlign = "center"; g.textBaseline = "middle"; g.lineWidth = 2.4 * u; g.strokeStyle = INK; g.fillStyle = "#ffffff"; g.strokeText(c.num, nx, ny); g.fillText(c.num, nx, ny); g.restore(); }
    // form shade toward the far side + a soft light rim just inside it
    const lx = Math.cos(light), ly = Math.sin(light), [ax, ay] = p.P(tcx + lx * T.a, tcy + ly * T.b), [bx, by] = p.P(tcx - lx * T.a, tcy - ly * T.b);
    const lg = g.createLinearGradient(ax, ay, bx, by);
    lg.addColorStop(0, "rgba(255,250,235,0.10)"); lg.addColorStop(0.3, "rgba(46,26,66,0)"); lg.addColorStop(0.86, "rgba(46,26,66,0.36)"); lg.addColorStop(0.95, "rgba(46,26,66,0.2)"); lg.addColorStop(1, "rgba(46,26,66,0.3)");
    p.path(tp, true); g.fillStyle = lg; g.fill();
  });
  p.inkRing(tp, ow, thick);
  if (!back && c.bow) { const y = chin + 0.1 * HH; for (const s of [-1, 1]) p.poly([[tcx, y], [tcx + s * 17 * u, y - 9 * u], [tcx + s * 17 * u, y + 9 * u]], c.bow, 2 * u); p.ell(tcx, y, 4.5 * u, 5 * u, c.bow, 2 * u); }
  if (c.scarf) { const y = chin + 0.08 * HH, [c1, c2] = c.scarf; p.band([[tcx - 0.8 * T.a, y - 2 * u], [tcx, y + 5 * u], [tcx + 0.8 * T.a, y - 2 * u]], c1, 15 * u, 2 * u, "round");
    const tx = tcx + 0.42 * T.a; p.poly(rrect(tx - 9 * u, y, tx + 9 * u, y + 0.62 * HH, 2 * u), c1, 2 * u); for (let i = 0; i < 4; i++) p.band([[tx - 8 * u, y + (0.1 + i * 0.14) * HH], [tx + 8 * u, y + (0.1 + i * 0.14) * HH]], c2, 0.06 * HH, 0, "butt"); }
  for (const a of arms) if (a.front && !a.late) drawArm(a);
  // ---- head ----
  const Ah = A + headTilt, [cpx, cpy] = rotAbout([300, chin], rad(A), [300, hipY]);
  p.rot = Ah ? [rad(Ah), 300, chin, cpx - 300, cpy - chin] : null;
  const hk = c.hair?.k, hcol = c.hair?.c ?? "#2a1d16", f = back ? 0 : facing, cx = 300;
  const bumps = (a0: number, a1: number, n: number, ra: number, rb: number, my: number, r0: number) => {
    const bs: [number, number, number][] = [];
    for (let i = 0; i <= n; i++) { const an = rad(a0 + (i * (a1 - a0)) / n); bs.push([cx + ra * Math.cos(an), my + rb * Math.sin(an), (r0 + 5 * rnd(seed + i, 31)) * u]); }
    for (const [x, y, r] of bs) p.ell(x, y, r + ow * 0.8, r + ow * 0.8, INK, 0);
    for (const [x, y, r] of bs) p.ell(x, y, r, r, hcol, 0);
  };
  const curls = (n: number, my: number, ra: number, rb: number, a0: number, da: number) => { for (let i = 0; i < n; i++) { const an = rad(a0 + i * da); p.arc(cx + ra * Math.cos(an), my + rb * Math.sin(an), 13 * u, 11 * u, 200 + i * 37, 330 + i * 37, 3 * u, mix(hcol, "#b98a6a", 0.55)); } };
  // behind the head
  if (hk === "curly") { const my = hc - 0.16 * H.b, ra = 1.1 * H.a, rb = 1.08 * H.b; bumps(152, 388, 13, ra, rb, my, 21); p.ell(cx, my, ra, rb, hcol, 0); curls(5, my, 0.72 * ra, 0.72 * rb, 215, 28); }
  if (hk === "long") { const lb = blobPts(cx, hc + 0.2 * H.b, { ...H, a: H.a * 1.16, b: H.b * 1.28, egg: 0.1, asym: 0, seed: seed + 3 }); p.shadedFill(lb, hcol, mul(hcol, SH_FELT), light, H.a * 1.2); p.inkRing(lb, ow * 0.85, thick); }
  if (hk === "dreads") { for (let i = 0; i < 9; i++) { const k = (i - 4) / 4, x0 = cx + k * 0.9 * H.a, len = (1.25 + 0.25 * rnd(seed + i, 61) - 0.25 * Math.abs(k)) * HH, sw = 5 * u * Math.sin(i * 1.7 + seed);
      const pts: P2[] = [[x0 * 0.6 + cx * 0.4, crown + 0.2 * HH], [x0 + k * 10 * u, crown + 0.55 * HH], [x0 + k * 16 * u + sw, crown + len * 0.8], [x0 + k * 14 * u - sw, crown + len]]; p.stroke(pts, 15 * u + ow * 1.6, INK); p.stroke(pts, 15 * u, hcol);
      for (let j = 1; j < 5; j++) { const yy = crown + 0.4 * HH + (len - 0.4 * HH) * j / 5; p.stroke([[x0 + k * 14 * u - 6 * u, yy], [x0 + k * 14 * u + 6 * u, yy + 2 * u]], 1.6 * u, mix(hcol, "#b98a6a", 0.4)); } } }
  if (hk === "bun") { p.ell(cx - f * 8 * u, crown - 8 * u, 30 * u, 27 * u, hcol, ow * 0.85); p.arc(cx - f * 8 * u, crown - 10 * u, 16 * u, 13 * u, 200, 330, 2.2 * u, shade(hcol, 1.9)); }
  if (hk === "bald") { bumps(-8, 36, 2, 0.97 * H.a, 0.97 * H.b, hc, 7); bumps(144, 188, 2, 0.97 * H.a, 0.97 * H.b, hc, 7); }
  if (c.hat?.k === "scarf") { const sb = blobPts(cx, hc + 0.06 * H.b, { ...H, a: H.a * 1.13, b: H.b * 1.12, asym: 0, egg: 0.02, seed: seed + 3 }); p.shadedFill(sb, c.hat.c, mul(c.hat.c, SH_CLOTH), light, H.a * 1.13); p.inkRing(sb, ow * 0.85, thick); }
  const hp = blobPts(cx, hc, H);
  p.shadedFill(hp, skin, mul(skin, [0.9, 0.87, 0.96]), light, H.a);
  p.inkRing(hp, ow, thick);
  const capPts = (cutK: number, scale = 1.03, slant = 0): P2[] => {
    const keep = ([x, y]: P2) => y < crown + (cutK + slant * (x - cx) / H.a) * HH, n = hp.length;
    const st = Math.max(0, hp.findIndex((q0, i) => keep(q0) && !keep(hp[(i + n - 1) % n])));
    return [...hp.slice(st), ...hp.slice(0, st)].filter(keep).map(([x, y]) => [cx + (x - cx) * scale, hc + (y - hc) * scale] as P2);
  };
  const scallop = (arc: P2[], k = 6, d = 4) => { const [x0, y0] = arc[arc.length - 1], [x1, y1] = arc[0]; for (let i = 1; i < k; i++) arc.push([x0 + ((x1 - x0) * i) / k, y0 + ((y1 - y0) * i) / k + (i % 2 ? d * u : 0)]); return arc; };
  if (back) {
    if (hk === "curly") { const my = hc - 0.1 * H.b, ra = 1.1 * H.a, rb = 1.1 * H.b; bumps(0, 360, 20, ra, rb, my, 21); p.ell(cx, my, ra, rb, hcol, 0); curls(9, my, 0.6 * ra, 0.6 * rb, 0, 40); curls(5, my, 0.25 * ra, 0.25 * rb, 20, 72); }
    else if (hk && hk !== "bald") { const arc = capPts(0.78, 1.03); p.shadedFill(arc, hcol, mul(hcol, SH_FELT), light, H.a, 0.35); p.poly(arc, null, ow * 0.9); }
  } else {
    if (hk === "curly") { const arc = scallop(capPts(0.26), 6, 5); p.poly(arc, hcol, 0); p.stroke([...arc.slice(-6), arc[0]], ow * 0.7); }
    if (hk === "short" || hk === "bun" || hk === "long" || hk === "dreads") { const arc = scallop(capPts(0.3)); p.shadedFill(arc, hcol, mul(hcol, SH_FELT), light, H.a, 0.35); p.poly(arc, null, ow * 0.9); p.stroke([[cx + (f || 1) * 10 * u, crown + 0.02 * HH], [cx + (f || 1) * 3 * u, crown + 0.2 * HH]], 1.4 * u); }
    if (hk === "side") { const arc = capPts(0.25, 1.03, 0.13 * (f || 1)); p.shadedFill(arc, hcol, mul(hcol, SH_FELT), light, H.a, 0.35); p.poly(arc, null, ow * 0.9); p.stroke([[cx - (f || 1) * 30 * u, crown + 0.02 * HH], [cx - (f || 1) * 22 * u, crown + 0.17 * HH]], 1.6 * u); }
    if (hk === "quiff") { // faded sides, a gelled top swept up to a peak on the facing side
      const d = f || 1, a = H.a, fade = capPts(0.43, 1.012), fc = mix(hcol, skin, 0.45);
      void fade; p.clip(hp, () => { for (const sg of [-1, 1]) p.poly([[cx + sg * 0.6 * a, crown + 0.1 * HH], [cx + sg * 1.1 * a, crown + 0.1 * HH], [cx + sg * 1.1 * a, crown + 0.47 * HH], [cx + sg * 0.8 * a, crown + 0.45 * HH], [cx + sg * 0.72 * a, crown + 0.3 * HH]], fc, ow * 0.55); });
      const X = (k: number) => cx + d * k * a, Y = (k: number) => crown + k * HH;
      const topE: P2[] = [[X(-0.74), Y(0.2)], [X(-0.76), Y(0.06)], [X(-0.6), Y(-0.06)], [X(-0.42), Y(-0.09)], [X(-0.3), Y(-0.06)], [X(-0.14), Y(-0.14)], [X(0.0), Y(-0.1)], [X(0.18), Y(-0.2)], [X(0.3), Y(-0.14)], [X(0.52), Y(-0.26)], [X(0.6), Y(-0.13)], [X(0.76), Y(-0.1)], [X(0.8), Y(0.05)], [X(0.76), Y(0.2)]];
      const line: P2[] = [[X(0.56), Y(0.18)], [X(0.3), Y(0.13)], [X(0.08), Y(0.18)], [X(-0.2), Y(0.13)], [X(-0.52), Y(0.18)]];
      const shp = [...topE, ...line]; p.shadedFill(shp, hcol, mul(hcol, SH_FELT), light, H.a, 0.35); p.poly(shp, null, ow * 0.9);
      p.stroke([[X(0.1), Y(-0.02)], [X(0.36), Y(-0.09)], [X(0.52), Y(-0.06)]], 3 * u, mix(hcol, "#ffffff", 0.45));
      p.stroke([[X(-0.3), Y(0.02)], [X(-0.12), Y(-0.03)]], 2.2 * u, mix(hcol, "#ffffff", 0.3));
    }
    if (hk === "tuft") p.arc(cx + 4 * u, crown - 2 * u, 9 * u, 12 * u, 150, 400, 3 * u, hcol);
  }
  {
    const ht = c.hat;
    if (ht) {
      const hc2 = ht.c2 ?? shade(ht.c, 0.8);
      if (ht.k === "coppola") {
        const body = ellPts(cx + 3 * u * f, crown + 0.22 * HH, 64 * u, 0.32 * HH, 176, 364), base: P2[] = []; for (let i = 0; i <= 10; i++) { const t = i / 10; base.push([cx + 3 * u * f + 62 * u * (1 - 2 * t), crown + 0.22 * HH + 4 * u * (1 - (2 * t - 1) ** 2)]); }
        const shp = [...body, ...base]; p.shadedFill(shp, ht.c, mul(ht.c, SH_FELT), light, 64 * u, 0.4);
        p.clip(shp, () => { for (let k = -5; k <= 5; k++) { p.stroke([[cx + k * 13 * u, crown - 0.2 * HH], [cx + k * 13 * u + 8 * u, crown + 0.3 * HH]], 1.3 * u, hc2); } for (let k = 0; k < 5; k++) p.arc(cx, crown + 0.6 * HH, 90 * u, (0.4 + k * 0.11) * HH, 200, 340, 1.3 * u, hc2); });
        p.poly(shp, null, ow * 0.9); p.ell(cx + (f || 0.6) * 16 * u, crown + 0.245 * HH, 46 * u, 0.055 * HH, shade(ht.c, 0.78), ow * 0.8, 0, 180); p.ell(cx + 3 * u * f, crown - 0.085 * HH, 5 * u, 3 * u, hc2, 1.6 * u);
      } else if (ht.k === "beanie") {
        const dome = capPts(0.34, 1.09), yb = crown + 0.34 * HH; p.shadedFill(dome, ht.c, mul(ht.c, SH_FELT), light, H.a, 0.35);
        p.clip(dome, () => { for (let k = -6; k <= 6; k++) p.arc(cx + k * 17 * u, yb, Math.abs(k) * 4 * u + 2, 0.5 * HH, 180, 360, 1.6 * u, shade(ht.c, 0.72)); p.stroke([[cx - 34 * u, crown + 0.1 * HH], [cx - 22 * u, crown + 0.03 * HH]], 5 * u, "rgba(255,255,255,0.45)"); });
        p.poly(dome, null, ow * 0.9); const band: P2[] = []; for (let i = 0; i <= 12; i++) { const t = i / 12; band.push([cx + 1.1 * H.a * (2 * t - 1), yb - 2 * u + 5 * u * (1 - (2 * t - 1) ** 2)]); }
        p.band(band, hc2, 0.11 * HH, 2.2 * u, "round"); for (let k = -5; k <= 5; k++) p.stroke([[cx + k * 19 * u, yb - 0.05 * HH], [cx + k * 19 * u, yb + 0.05 * HH]], 1.4 * u, shade(hc2, 0.75));
      } else if (ht.k === "scarf") {
        const arc = capPts(0.3, 1.07); const [x0, y0] = arc[arc.length - 1], [x1, y1] = arc[0]; for (let i = 1; i < 8; i++) { const t = i / 8; arc.push([x0 + (x1 - x0) * t, y0 + (y1 - y0) * t - 9 * u * Math.sin(Math.PI * t)]); }
        p.shadedFill(arc, ht.c, mul(ht.c, SH_CLOTH), light, H.a, 0.35); p.clip(arc, () => { for (let j = 0; j < 6; j++) for (let k = -5; k <= 5; k++) p.dot(cx + (k + (j % 2) * 0.5) * 22 * u, crown + j * 13 * u, 2.6 * u, hc2); }); p.poly(arc, null, ow * 0.85);
        const ky = hc + H.b * 0.99; for (const s of [-1, 1]) p.poly([[cx, ky], [cx + s * 18 * u, ky - 5 * u], [cx + s * 20 * u, ky + 13 * u]], ht.c, 2 * u); p.ell(cx, ky + 2 * u, 5 * u, 5 * u, ht.c, 2 * u);
      } else if (ht.k === "bucket") {
        const yb = crown + 0.27 * HH, body: P2[] = [[cx - 53 * u, yb], [cx - 40 * u, crown - 0.12 * HH], [cx + 40 * u, crown - 0.12 * HH], [cx + 53 * u, yb]];
        p.ell(cx, yb, 80 * u, 0.075 * HH, shade(ht.c, 0.86), ow * 0.85); p.shadedFill(body, ht.c, mul(ht.c, SH_FELT), light, 50 * u, 0.4); p.poly(body, null, ow * 0.85); p.band([[cx - 50 * u, yb - 0.06 * HH], [cx + 50 * u, yb - 0.06 * HH]], hc2, 0.07 * HH, 1.4 * u);
      } else if (ht.k === "cap") {
        const dome = capPts(0.3, 1.06); p.shadedFill(dome, ht.c, mul(ht.c, SH_FELT), light, H.a, 0.35); p.poly(dome, null, ow * 0.9);
        p.ell(cx + (f || 0.5) * 22 * u, crown + 0.31 * HH, 44 * u, 0.07 * HH, hc2, ow * 0.85, 0, 180); p.ell(cx, crown - 0.03 * HH, 4 * u, 3 * u, hc2, 1.5 * u);
      } else if (ht.k === "boina") {
        const dome = capPts(0.27, 1.1).map(([x, y]) => [x + (f || 0.6) * 5 * u, y - 2 * u] as P2), yb = crown + 0.27 * HH;
        const shp: P2[] = [...dome]; { const [x0, y0] = dome[dome.length - 1], [x1, y1] = dome[0]; for (let i = 1; i < 8; i++) { const t = i / 8; shp.push([x0 + (x1 - x0) * t + (f || 0.6) * 8 * u * Math.sin(Math.PI * t), y0 + (y1 - y0) * t + 6 * u * Math.sin(Math.PI * t)]); } }
        p.shadedFill(shp, ht.c, mul(ht.c, SH_FELT), light, H.a, 0.35); p.clip(shp, () => p.stroke([[cx - 36 * u, crown + 0.08 * HH], [cx - 22 * u, crown + 0.0 * HH]], 5 * u, "rgba(255,255,255,0.28)"));
        p.poly(shp, null, ow * 0.9); p.stroke([[cx + (f || 0.6) * 5 * u, crown - 0.045 * HH], [cx + (f || 0.6) * 9 * u, crown - 0.1 * HH]], 3 * u, INK); void yb;
      } else if (ht.k === "helmet") {
        const a = H.a, dome = capPts(back ? 0.86 : 0.37, 1.1), c3 = ht.c3 ?? hc2;
        if (!back) for (const sg of [-1, 1]) p.poly([[cx + sg * 1.1 * a, crown + 0.3 * HH], [cx + sg * 0.74 * a, crown + 0.33 * HH], [cx + sg * 0.7 * a, crown + 0.66 * HH], [cx + sg * 0.93 * a, crown + 0.84 * HH], [cx + sg * 1.12 * a, crown + 0.62 * HH]], ht.c, ow * 0.85);
        p.shadedFill(dome, ht.c, mul(ht.c, SH_FELT), light, H.a, 0.35);
        p.clip(dome, () => { p.stroke([[cx, crown - 0.2 * HH], [cx, crown + HH]], 26 * u, c3); p.stroke([[cx, crown - 0.2 * HH], [cx, crown + HH]], 13 * u, hc2); p.stroke([[cx - 40 * u, crown + 0.12 * HH], [cx - 26 * u, crown + 0.04 * HH]], 6 * u, "rgba(255,255,255,0.5)"); });
        p.poly(dome, null, ow * 0.9);
      } else if (ht.k === "tam") {
        const dome = capPts(0.3, 1.2).map(([x, y]) => [x - (f || 0.5) * 6 * u, y - 0.12 * HH] as P2), shp: P2[] = [...dome]; { const [x0, y0] = dome[dome.length - 1], [x1, y1] = dome[0]; for (let i = 1; i < 8; i++) { const t = i / 8; shp.push([x0 + (x1 - x0) * t, y0 + (y1 - y0) * t + 0.12 * HH + 5 * u * Math.sin(Math.PI * t)]); } }
        p.shadedFill(shp, "#d0342e", mul("#d0342e", SH_FELT), light, H.a, 0.35);
        p.clip(shp, () => { p.stroke([[cx - 1.4 * H.a, crown + 0.02 * HH], [cx + 1.4 * H.a, crown + 0.02 * HH]], 0.13 * HH, "#f6c419"); p.stroke([[cx - 1.4 * H.a, crown + 0.15 * HH], [cx + 1.4 * H.a, crown + 0.15 * HH]], 0.13 * HH, "#1f8a3a"); p.stroke([[cx - 1.4 * H.a, crown + 0.29 * HH], [cx + 1.4 * H.a, crown + 0.29 * HH]], 0.12 * HH, "#23202a"); });
        p.poly(shp, null, ow * 0.9);
      } else if (ht.k === "straw") {
        const yb = crown + 0.26 * HH, body: P2[] = [[cx - 50 * u, yb], [cx - 40 * u, crown - 0.1 * HH], [cx + 40 * u, crown - 0.1 * HH], [cx + 50 * u, yb]];
        p.ell(cx, yb, 96 * u, 0.085 * HH, shade(ht.c, 0.9), ow * 0.85); p.shadedFill(body, ht.c, mul(ht.c, SH_FELT), light, 50 * u, 0.4); p.poly(body, null, ow * 0.85); p.band([[cx - 48 * u, yb - 0.06 * HH], [cx + 48 * u, yb - 0.06 * HH]], hc2, 0.07 * HH, 1.4 * u);
      } else if (ht.k === "chef") {
        const yb = crown + 0.2 * HH; p.poly([[cx - 44 * u, yb], [cx - 46 * u, yb - 0.3 * HH], [cx + 46 * u, yb - 0.3 * HH], [cx + 44 * u, yb]], ht.c, ow * 0.85);
        for (const k of [-1, 0, 1]) p.ell(cx + k * 34 * u, yb - 0.38 * HH, 28 * u, 22 * u, ht.c, ow * 0.85); p.ell(cx, yb - 0.3 * HH, 44 * u, 14 * u, ht.c, 0);
      }
    }
    if (!back) {
    const brim = !!ht && ht.k !== "scarf", fu = W * 1.08 / 100, fx = cx + 7 * fu * f, ex = 13 * fu, gr = 15.5 * fu;
    if (c.glasses === "round") for (const s of [-1, 1]) p.ell(fx + s * (ex + 2.5 * fu), hc, gr, gr, "#f2f8ff", 0);
    faceFront(p, cx, hc, W * 1.08, expr, f, look, blink, brim, c.glasses === "round" ? "#f2f8ff" : skin, undefined, false, c.brows ?? 1);
    if (c.glasses) {
      const gx = (s: number) => fx + s * (ex + 2.5 * fu);
      for (const s of [-1, 1]) { p.ell(gx(s), hc, gr, gr, c.glasses === "sun" ? "#2b2636" : null, 3.4 * fu); if (c.glasses === "sun") p.stroke([[gx(s) - 7 * fu, hc - 6 * fu], [gx(s) - 1 * fu, hc - 9 * fu]], 2.2 * fu, "#8f8aa8"); else p.arc(gx(s), hc, gr - 4 * fu, gr - 4 * fu, 205, 250, 2 * fu, "#9cc6ea"); }
      p.stroke([[gx(-1) + gr, hc - 2 * fu], [gx(1) - gr, hc - 2 * fu]], 3 * fu);
      for (const s of [-1, 1]) p.stroke([[gx(s) + s * gr, hc - 2 * fu], [cx + s * 0.97 * H.a, hc - 6 * fu]], 2.6 * fu);
    }
    if (c.stache) { const mx = cx + 8 * fu * f, my = hc + 13 * fu; for (const s of [-1, 1]) { const pts = curve([mx + s * 1 * fu, my], [mx + s * 14 * fu, my + 7 * fu], [mx + s * 27 * fu, my - 4 * fu], 8); pts.forEach((q0, i) => { if (i) taper(p, pts[i - 1], q0, (9 - i * 0.85) * fu + 3 * fu, (9 - (i + 1) * 0.85) * fu + 3 * fu, INK); }); pts.forEach((q0, i) => { if (i) taper(p, pts[i - 1], q0, (9 - i * 0.85) * fu, (9 - (i + 1) * 0.85) * fu, c.stache!); }); } }
    if (c.stubble) for (let i = 0; i < 14; i++) p.dot(cx + (rnd(seed + i, 41) - 0.5) * 70 * fu + 6 * fu * f, hc + (24 + rnd(seed + i, 42) * 18) * fu, 1.3 * fu, "#8a7f86");
    if (c.studs) for (const s of [-1, 1]) { const ex2 = cx + s * 0.985 * H.a, ey2 = hc + 0.3 * H.b; p.poly([[ex2, ey2 - 6 * u], [ex2 + 5 * u, ey2], [ex2, ey2 + 6 * u], [ex2 - 5 * u, ey2]], c.studs, 1.5 * u); }
    if (c.earring) p.ell(cx - (f || 1) * 0.96 * H.a, hc + 0.3 * H.b, 5 * u, 5 * u, c.earring, 1.6 * u);
    for (let i = 0; i < (q.sweat ?? 0); i++) { const sx = cx + (i % 2 ? -1 : 1) * (0.72 + 0.08 * i) * H.a, sy = hc - (0.45 - 0.22 * i) * H.b; p.poly([[sx, sy - 9 * u], [sx + 5.5 * u, sy + 2 * u], [sx, sy + 7 * u], [sx - 5.5 * u, sy + 2 * u]], "#a8dcff", 2 * u); }
    }
  }
  p.rot = null;
  for (const a of arms) if (a.late) drawArm(a);
};
