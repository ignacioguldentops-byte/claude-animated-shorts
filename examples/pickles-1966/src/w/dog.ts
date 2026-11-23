// Pickles: a black-and-white collie cross drawn in the cast's style (same ink, same light), on the figure canvas
// (600 x 1000 design units, ground at y = 975). Side view facing screen-right (mirror for left) or sitting front-on.
// Modes: walk (trot cycle), sniff (nose to the ground, tail going), dig (front paws scratching), sit, beg (sitting up,
// paws raised), stand. The outer ink line is added by the card pool like every character.
import { Pen, INK, mix, ellPts } from "./toon";
type P2 = [number, number];
export type DogPose = { mode: "walk" | "sniff" | "dig" | "sit" | "beg" | "stand"; phase?: number; facing?: 1 | -1 | 0; tongue?: boolean; blink?: number; light?: number; alert?: boolean };
const BLK = "#22202a", WHT = "#f7f4ee", PINK = "#e86e78", NOSE = "#141218", COLLAR = "#c8342e";
const tw = Math.PI * 2;
const rotP = (q: P2, a: number, c: P2): P2 => { const s = Math.sin(a), co = Math.cos(a); return [c[0] + (q[0] - c[0]) * co - (q[1] - c[1]) * s, c[1] + (q[0] - c[0]) * s + (q[1] - c[1]) * co]; };
/** a leg from hip to paw with a bend, filled fur colour with a white sock, and a round paw */
const leg = (p: Pen, hip: P2, knee: P2, paw: P2, w: number, col: string, sock: boolean) => {
  p.stroke([hip, knee, paw], w + 7, INK); p.stroke([hip, knee, paw], w, col);
  if (sock) { const m: P2 = [knee[0] + (paw[0] - knee[0]) * 0.35, knee[1] + (paw[1] - knee[1]) * 0.35]; p.stroke([m, paw], w, WHT); }
  p.ell(paw[0] + 6, paw[1] - 2, w * 0.75, w * 0.45, sock ? WHT : col, 3.5);
};
const head = (p: Pen, c: P2, tilt: number, o: DogPose, down = false) => {
  const R = (q: P2) => rotP(q, tilt, c), x = c[0], y = c[1];
  // far ear (behind), skull, snout, near ear, blaze, eye, nose, mouth
  p.poly([R([x - 40, y - 34]), R([x - 8, y - 70]), R([x + 6, y - 30])], BLK, 5);
  const skull = ellPts(x, y, 74, 62, 0, 360, tilt * 57.3); p.poly(skull, BLK, 6);
  const sn: P2[] = [R([x + 30, y - 6]), R([x + 104, y + 4]), R([x + 112, y + 26]), R([x + 100, y + 44]), R([x + 40, y + 46]), R([x + 20, y + 30])];
  p.poly(sn, WHT, 6);
  p.clip(skull, () => { p.poly([R([x + 4, y - 64]), R([x + 26, y - 64]), R([x + 44, y + 10]), R([x + 18, y + 14])], WHT, 0); });
  p.poly([R([x + 4, y - 64]), R([x + 26, y - 64]), R([x + 40, y - 4])], null, 0);
  const ear: P2[] = [R([x - 30, y - 50]), R([x + 4, y - 86]), R([x + 22, y - 52]), R([x + 8, y - 20])]; p.poly(ear, mix(BLK, "#4a3a44", 0.4), 5);
  const ex = R([x + 34, y - 18]); if ((o.blink ?? 0) > 0.5) p.stroke([[ex[0] - 9, ex[1]], [ex[0] + 9, ex[1] + 1]], 5); else { p.ell(ex[0], ex[1], 11, 12, WHT, 3); p.dot(ex[0] + 3, ex[1] + 1, 7, INK); p.dot(ex[0] + 5, ex[1] - 2, 2.6, WHT); }
  { const b = R([x + 26, y - 38]), b2 = R([x + 48, y - 34 + (o.alert ? -8 : 0)]); p.stroke([b, b2], 5, mix(BLK, "#8a7a86", 0.5)); }
  const nz = R([x + 108, y + 10]); p.ell(nz[0], nz[1], 16, 12, NOSE, 3); p.dot(nz[0] - 3, nz[1] - 5, 3.4, "#6a6a78");
  const m0 = R([x + 104, y + 28]), m1 = R([x + 70, y + 40]), m2 = R([x + 46, y + 30]); p.stroke([m0, m1, m2], 4.5);
  if (o.tongue) { const t0 = R([x + 66, y + 38]), t1 = R([x + 78, y + 70]); p.poly([[t0[0] - 10, t0[1]], [t0[0] + 12, t0[1]], [t1[0] + 10, t1[1]], [t1[0] - 8, t1[1] + 4]], PINK, 4); p.stroke([[t0[0] + 1, t0[1] + 4], [t1[0], t1[1] - 4]], 2.5, mix(PINK, INK, 0.3)); }
  void down;
};
export const drawDog = (p: Pen, o: DogPose) => {
  const ph = o.phase ?? 0, f = o.facing ?? 1, g = p.g;
  if (f === 0) { drawFront(p, o); return; }
  g.save(); if (f === -1) { g.translate(600, 0); g.scale(-1, 1); } g.translate(-48, 0);
  const mode = o.mode, s1 = Math.sin(tw * ph), c1 = Math.cos(tw * ph);
  const bob = mode === "walk" ? 8 * Math.abs(Math.sin(tw * ph)) : 0, sitting = mode === "sit" || mode === "beg";
  // body frame: hips and shoulders
  const sh: P2 = [400, (sitting ? 700 : 770) - bob], hip: P2 = [200, (sitting ? 880 : 778) - bob];
  // tail (behind): a plume with a white tip, wagging
  const wag = Math.sin(tw * ph * (mode === "walk" ? 1 : 2.4)) * (mode === "stand" ? 0.25 : 0.55), ta = -2.3 + wag, tb: P2 = [hip[0] - 18, hip[1] - 22];
  const tp: P2[] = []; for (let i = 0; i <= 8; i++) { const t = i / 8, a = ta + 0.6 * t; tp.push([tb[0] + 150 * t * Math.cos(a) * 0.9, tb[1] + 150 * t * Math.sin(a) * 0.9 - 30 * Math.sin(Math.PI * t)]); }
  p.stroke(tp, 34, INK); p.stroke(tp, 26, BLK); p.stroke(tp.slice(6), 24, WHT);
  // far legs (darker), body, near legs
  const legs = (near: boolean) => { const dk = near ? BLK : mix(BLK, "#000000", 0.4), o2 = near ? 0 : 0.5, w = 26;
    // back leg
    { const a = mode === "walk" ? 0.45 * Math.sin(tw * (ph + o2)) : mode === "dig" ? 0.1 : 0, lift = mode === "walk" ? Math.max(0, Math.cos(tw * (ph + o2))) * 26 : 0;
      if (sitting) { const k: P2 = [hip[0] + 70, hip[1] + 10], pw: P2 = [hip[0] + 96 + (near ? 0 : -14), 972]; leg(p, [hip[0] + (near ? 10 : -6), hip[1] - 20], k, pw, w, dk, near); }
      else { const pw: P2 = [hip[0] - 10 + 150 * Math.sin(a) * 0.6 + (near ? 0 : 18), 972 - lift], k: P2 = [hip[0] - 34 + 60 * Math.sin(a) * 0.4, hip[1] + 92 - lift * 0.4]; leg(p, [hip[0] + (near ? 6 : 22), hip[1] + 6], k, pw, w, dk, near); } }
    // front leg
    { let a = mode === "walk" ? -0.45 * Math.sin(tw * (ph + o2)) : 0, lift = mode === "walk" ? Math.max(0, -Math.cos(tw * (ph + o2))) * 30 : 0;
      if (mode === "dig") { a = 0.6 * Math.sin(tw * ph * 2.5 + (near ? 0 : Math.PI)); lift = Math.max(0, Math.sin(tw * ph * 2.5 + (near ? 0 : Math.PI))) * 50; }
      if (mode === "beg") { const pw: P2 = [sh[0] + 70, sh[1] + 40 + (near ? 0 : 14)], k: P2 = [sh[0] + 46, sh[1] + 70]; leg(p, [sh[0] + (near ? 0 : 14), sh[1] + 30], k, pw, w, dk, near); return; }
      const sx = sh[0] + (near ? -6 : 14), pw: P2 = [sx + 150 * Math.sin(a) * 0.55 + 10, 972 - lift], k: P2 = [sx + 6 + 40 * Math.sin(a), (sh[1] + pw[1]) / 2 + (mode === "dig" ? -10 : 0)]; leg(p, [sx, sh[1] + 20], k, pw, w, dk, near); } };
  legs(false);
  // body: a long rounded barrel from hips to chest, black back, white chest and belly
  const bp: P2[] = []; const cx = (sh[0] + hip[0]) / 2, cy = (sh[1] + hip[1]) / 2, ang = Math.atan2(sh[1] - hip[1], sh[0] - hip[0]), L = Math.hypot(sh[0] - hip[0], sh[1] - hip[1]) / 2 + 74;
  for (let i = 0; i < 48; i++) { const t = (i / 48) * tw, r = 1 + 0.08 * Math.cos(t) - 0.06 * Math.cos(2 * t); bp.push(rotP([cx + L * Math.cos(t) * r, cy + 78 * Math.sin(t) * (Math.cos(t) > 0 ? 1.06 : 0.95)], ang, [cx, cy])); }
  p.poly(bp, BLK, 7);
  p.clip(bp, () => { p.ell(sh[0] + 30, sh[1] + 60, 80, 66, WHT, 0, 0, 360, ang * 57.3); p.ell(cx + 10, cy + 90, 120, 34, WHT, 0, 0, 360, ang * 57.3);
    for (let i = 0; i < 9; i++) { const t = i / 9; p.stroke([rotP([cx - L * 0.7 + t * L * 1.2, cy - 50], ang, [cx, cy]), rotP([cx - L * 0.62 + t * L * 1.2, cy - 34], ang, [cx, cy])], 3, "#3a3640"); }
    p.ell(cx - 10, cy - 40, L * 0.9, 30, "rgba(255,255,255,0.08)", 0, 0, 360, ang * 57.3); });
  p.poly(bp, null, 7);
  legs(true);
  // collar and tag, then the head
  const hc: P2 = mode === "sniff" || mode === "dig" ? [sh[0] + 120, 880] : sitting ? [sh[0] + 30, sh[1] - 120] : [sh[0] + 80, sh[1] - 92];
  const neck: P2[] = [[sh[0] - 30, sh[1] - 40], [sh[0] + 40, sh[1] - 50], [hc[0] + 10, hc[1] + 40], [hc[0] - 50, hc[1] + 20]];
  p.poly(neck, BLK, 6); p.clip(neck, () => p.ell(sh[0] + 40, sh[1] - 10, 50, 40, WHT, 0));
  const cl0: P2 = [(sh[0] - 30 + hc[0] - 50) / 2 + 6, (sh[1] - 40 + hc[1] + 20) / 2], cl1: P2 = [(sh[0] + 40 + hc[0] + 10) / 2 + 4, (sh[1] - 50 + hc[1] + 40) / 2];
  p.stroke([cl0, cl1], 22, INK); p.stroke([cl0, cl1], 14, COLLAR); p.ell((cl0[0] + cl1[0]) / 2 + 4, (cl0[1] + cl1[1]) / 2 + 16, 9, 11, "#e8c45a", 3);
  const tilt = mode === "sniff" ? 0.55 + 0.06 * Math.sin(tw * ph * 3) : mode === "dig" ? 0.4 : sitting ? -0.08 : 0.04 * s1;
  head(p, hc, tilt, { ...o, tongue: o.tongue ?? (mode === "walk" || mode === "sit" || mode === "beg") });
  if (mode === "sniff") for (let i = 0; i < 3; i++) { const t = (ph * 3 + i / 3) % 1, x = hc[0] + 120 + 30 * t, y = hc[1] + 60 - 50 * t; p.arc(x, y, 10 + 8 * t, 6, 200, 340, 3, `rgba(36,23,38,${0.5 * (1 - t)})`); }
  void c1;
  g.restore();
};
/** sitting, facing the camera: ears both sides, the white blaze and chest, front paws together, tail sweeping */
const drawFront = (p: Pen, o: DogPose) => {
  const ph = o.phase ?? 0, wag = Math.sin(tw * ph * 2.4) * 0.6, beg = o.mode === "beg";
  const tp: P2[] = []; for (let i = 0; i <= 8; i++) { const t = i / 8, a = -0.4 + wag + 0.5 * t; tp.push([300 + 170 * t * Math.cos(a), 930 - 60 * t * Math.sin(Math.PI * t) - 10 * t]); }
  p.stroke(tp, 34, INK); p.stroke(tp, 26, BLK); p.stroke(tp.slice(6), 24, WHT);
  for (const s of [-1, 1]) p.ell(300 + s * 90, 930, 70, 46, BLK, 6);
  const body = ellPts(300, 800, 118, 150); p.poly(body, BLK, 7); p.clip(body, () => p.ell(300, 790, 66, 150, WHT, 0));
  for (const s of [-1, 1]) { if (beg) leg(p, [300 + s * 44, 760], [300 + s * 70, 700], [300 + s * 50, 650], 26, BLK, true); else leg(p, [300 + s * 44, 800], [300 + s * 46, 890], [300 + s * 40, 970], 26, BLK, true); }
  p.stroke([[226, 660], [374, 660]], 22, INK); p.stroke([[226, 660], [374, 660]], 14, COLLAR); p.ell(300, 680, 9, 11, "#e8c45a", 3);
  const hx = 300, hy = 560;
  for (const s of [-1, 1]) p.poly([[hx + s * 50, hy - 50], [hx + s * 108, hy - 70], [hx + s * 96, hy + 10], [hx + s * 64, hy - 8]], mix(BLK, "#4a3a44", 0.4), 5);
  const skull = ellPts(hx, hy, 86, 76); p.poly(skull, BLK, 6); p.clip(skull, () => { p.poly([[hx - 12, hy - 80], [hx + 12, hy - 80], [hx + 30, hy + 20], [hx - 30, hy + 20]], WHT, 0); });
  p.ell(hx, hy + 38, 46, 36, WHT, 6); p.ell(hx, hy + 14, 18, 13, NOSE, 3); p.dot(hx - 5, hy + 9, 3.4, "#6a6a78");
  p.stroke([[hx - 26, hy + 46], [hx, hy + 54], [hx + 26, hy + 46]], 4.5);
  if (o.tongue ?? true) { p.poly([[hx - 12, hy + 52], [hx + 12, hy + 52], [hx + 10, hy + 84], [hx - 8, hy + 86]], PINK, 4); p.stroke([[hx, hy + 56], [hx, hy + 80]], 2.5, mix(PINK, INK, 0.3)); }
  for (const s of [-1, 1]) { const ex = hx + s * 36, ey = hy - 14; if ((o.blink ?? 0) > 0.5) p.stroke([[ex - 9, ey], [ex + 9, ey]], 5); else { p.ell(ex, ey, 11, 12, WHT, 3); p.dot(ex, ey + 1, 7, INK); p.dot(ex + 3, ey - 2, 2.6, WHT); } p.stroke([[ex - 12, ey - 24], [ex + 10, ey - 26 - (o.alert ? 6 : 0)]], 5, mix(BLK, "#8a7a86", 0.5)); }
};
