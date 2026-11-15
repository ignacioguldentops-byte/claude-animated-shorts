// Props of "Al revés" (our own flat 2D drawings, canvas px).
import { Pen, INK, rrect } from "./toon";
type P2 = [number, number];
/** American football, 240 x 160; a = tumble angle */
export const fxFootball = (p: Pen, a = 0) => {
  const g = p.g; g.save(); g.translate(120, 80); g.rotate(a); g.translate(-120, -80);
  const pts: P2[] = []; for (let i = 0; i <= 40; i++) { const t = (i / 40) * Math.PI * 2, c = Math.cos(t), s = Math.sin(t); pts.push([120 + 98 * c, 80 + 54 * s * Math.pow(Math.abs(Math.sin(t)), 0.25) * (1 - 0.18 * c * c)]); }
  p.poly(pts, "#8f4e24", 10); p.clip(pts, () => { p.ell(120, 120, 110, 40, "#6e3a1a", 0); for (const x of [44, 196]) p.stroke([[x, 20], [x + (x < 120 ? -8 : 8), 140]], 9, "#fbf6e6"); }); p.poly(pts, null, 10);
  p.stroke([[88, 56], [152, 56]], 6, "#fbf6e6"); for (let i = 0; i < 5; i++) p.stroke([[96 + i * 12, 46], [96 + i * 12, 66]], 5, "#fbf6e6");
  g.restore();
};
/** scoreboard face, 800 x 500: two rows = team colour lamp + big flip digits (no words) */
export const fxScore = (p: Pen, a: number, b: number, flash = 0) => {
  p.poly(rrect(10, 10, 790, 490, 24), "#23303a", 14);
  const row = (y: number, col: string, n: number, hot: boolean) => {
    p.ell(130, y, 62, 62, col, 9); p.ell(108, y - 22, 16, 12, "rgba(255,255,255,0.45)", 0);
    const s = String(n).padStart(2, "0");
    for (let i = 0; i < 2; i++) { const x = 300 + i * 220; p.poly(rrect(x, y - 88, x + 190, y + 88, 14), hot ? "#fff3b0" : "#f4efe0", 8); p.stroke([[x, y], [x + 190, y]], 5, "#8a8496");
      const g = p.g; g.fillStyle = INK; g.font = "bold 170px Arial, Helvetica, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(s[i], x + 95, y + 8); }
  };
  row(135, "#5a3a9a", a, false); row(365, "#c4202e", b, flash > 0);
};
/** compass, 400 x 400; needle angle a (0 = up) */
export const fxCompass = (p: Pen, a = 0) => {
  p.ell(200, 200, 180, 180, "#e8c45a", 12); p.ell(200, 200, 146, 146, "#fbf6e6", 7);
  for (let i = 0; i < 12; i++) { const t = (i / 12) * Math.PI * 2; p.stroke([[200 + 124 * Math.sin(t), 200 - 124 * Math.cos(t)], [200 + 140 * Math.sin(t), 200 - 140 * Math.cos(t)]], i % 3 ? 4 : 9, "#8a8496"); }
  const R = (x: number, y: number): P2 => [200 + x * Math.cos(a) - y * Math.sin(a), 200 + x * Math.sin(a) + y * Math.cos(a)];
  p.poly([R(-22, 0), R(0, -124), R(22, 0)], "#d0342e", 7); p.poly([R(-22, 0), R(0, 124), R(22, 0)], "#3a3d4a", 7); p.ell(200, 200, 16, 16, "#e8c45a", 6);
};
/** the letter: a membership card with two wrong-way arrows shaking hands, no words (700 x 480) */
export const fxClubCard = (p: Pen) => {
  p.poly(rrect(14, 14, 686, 466, 22), "#fbf6e6", 12); p.poly(rrect(40, 40, 660, 440, 12), null, 5);
  const uturn = (cx: number, col: string, flip: number) => { const pts: P2[] = [[cx - flip * 70, 330], [cx - flip * 70, 200]]; for (let i = 0; i <= 12; i++) { const t = Math.PI * (i / 12); pts.push([cx - flip * 70 * Math.cos(t), 200 - 70 * Math.sin(t)]); } pts.push([cx + flip * 70, 290]);
    p.stroke(pts, 44, INK); p.stroke(pts, 28, col); p.poly([[cx + flip * 70 - 46, 280], [cx + flip * 70 + 46, 280], [cx + flip * 70, 350]], col, 9); };
  uturn(210, "#8a5a34", 1); uturn(490, "#5a3a9a", -1);
  p.ell(350, 130, 44, 44, "#e8c45a", 8); p.poly([...Array(10)].map((_, i) => { const t = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? 14 : 30; return [350 + r * Math.cos(t), 130 + r * Math.sin(t)] as P2; }), "#fff3b0", 4);
  for (const x of [120, 580]) p.stroke([[x - 40, 400], [x + 40, 400]], 6, "#8a8496");
};
/** envelope, 300 x 200 */
export const fxEnvelope = (p: Pen) => { p.poly(rrect(10, 20, 290, 190, 10), "#fbf6e6", 9); p.stroke([[14, 26], [150, 120], [286, 26]], 7); p.poly(rrect(222, 36, 268, 84, 4), "#d0342e", 5); };
/** dashed arrow segment for the bird's-eye diagram, 300 x 120 (points left); head = draw the arrow head */
export const fxDash = (p: Pen, head = false) => {
  if (head) { p.poly([[10, 60], [150, 6], [150, 40], [290, 40], [290, 80], [150, 80], [150, 114]], "#ffe04a", 10); }
  else p.poly(rrect(30, 36, 270, 84, 10), "#ffe04a", 10);
};
/** orange pylon, 100 x 200 */
export const fxPylon = (p: Pen) => { p.poly(rrect(22, 14, 78, 190, 10), "#f2742c", 8); };
/** swirl (spin lines), 400 x 300; t rotates */
export const fxSwirl = (p: Pen, t = 0) => { for (let k = 0; k < 3; k++) { const pts: P2[] = []; for (let i = 0; i <= 20; i++) { const a = t + k * 2.1 + (i / 20) * 2.6; pts.push([200 + (150 - k * 30) * Math.cos(a), 150 + (70 - k * 14) * Math.sin(a)]); } p.stroke(pts, 14, INK); p.stroke(pts, 7, "#ffffff"); } };
/** noise zigzag ("the roar"), 300 x 200 */
export const fxRoar = (p: Pen, k = 0) => { for (let j = 0; j < 3; j++) { const pts: P2[] = []; for (let i = 0; i <= 8; i++) pts.push([20 + i * 32, 50 + j * 50 + (i % 2 ? -22 : 22) * (k ? -1 : 1)]); p.stroke(pts, 16, INK); p.stroke(pts, 8, ["#ffe04a", "#ff8a3a", "#ffe04a"][j]); } };
/** calendar leaf, 200 x 220 */
export const fxLeaf = (p: Pen) => { p.poly(rrect(14, 30, 186, 210, 10), "#fbf6e6", 8); p.poly(rrect(14, 30, 186, 78, 10), "#d0342e", 8); for (const x of [60, 140]) p.stroke([[x, 14], [x, 46]], 9, "#8a8496"); for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) p.dot(46 + c * 36, 110 + r * 34, 7, "#8a8496"); };
/** weather bits: 0 snowflake, 1 raindrop, 2 sun (160 x 160) */
export const fxWeather = (p: Pen, k: number) => {
  if (k === 0) { for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI; p.stroke([[80 - 60 * Math.cos(a), 80 - 60 * Math.sin(a)], [80 + 60 * Math.cos(a), 80 + 60 * Math.sin(a)]], 12, "#ffffff"); } }
  else if (k === 1) p.poly([[80, 14], [116, 96], [80, 140], [44, 96]], "#8fd0ff", 8);
  else { for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; p.stroke([[80 + 52 * Math.cos(a), 80 + 52 * Math.sin(a)], [80 + 74 * Math.cos(a), 80 + 74 * Math.sin(a)]], 10, "#ffd24a"); } p.ell(80, 80, 44, 44, "#ffe27a", 8); }
};
/** thumbs-up hand card, 260 x 300 */
export const fxThumb = (p: Pen) => { p.poly(rrect(60, 130, 210, 280, 30), "#fbf6f0", 10); p.poly(rrect(96, 20, 150, 170, 26), "#fbf6f0", 10); for (let i = 0; i < 3; i++) p.stroke([[150, 168 + i * 34], [206, 168 + i * 34]], 6, "#8a8496"); p.poly(rrect(20, 150, 70, 280, 8), "#c4202e", 10); };
