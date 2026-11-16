// Props of "La puerta de atrás" (our own flat 2D drawings, canvas px).
import { Pen, INK, rrect, ellPts } from "./toon";
type P2 = [number, number];
/** a burger on its wrapping paper, 400 x 320 */
export const fxBurger = (p: Pen) => {
  p.poly([[20, 300], [70, 236], [330, 232], [384, 296], [300, 312], [110, 314]], "#f1e6cf", 9); p.stroke([[90, 262], [150, 292]], 5, "#d9c9a8"); p.stroke([[300, 262], [250, 296]], 5, "#d9c9a8");
  p.ell(200, 250, 130, 40, "#d99a4a", 10); p.poly(rrect(66, 196, 334, 238, 16), "#6e3a1a", 9);
  p.poly([[60, 196], [110, 222], [160, 194], [220, 222], [280, 194], [340, 198], [334, 176], [66, 176]], "#f6c419", 8);
  p.poly(rrect(58, 158, 342, 184, 12), "#57a05a", 8);
  const top: P2[] = [[64, 160]]; for (let i = 0; i <= 20; i++) { const t = Math.PI * (1 - i / 20); top.push([200 + 136 * Math.cos(t), 160 - 118 * Math.sin(t)]); } p.poly(top, "#e0a04e", 10);
  p.clip(top, () => p.ell(250, 150, 110, 70, "#c98a3c", 0)); p.poly(top, null, 10);
  for (const [x, y] of [[140, 96], [200, 70], [262, 96], [170, 128], [234, 130], [200, 104]]) p.ell(x, y, 9, 5, "#fbf3e2", 0);
};
/** a woman's silhouette in a cap with a question mark, 300 x 440 */
export const fxWho = (p: Pen, k = 0) => {
  const C = ["#3a3f6a", "#4a3f6a", "#3a4a6a"][k % 3];
  p.poly([[60, 440], [70, 300], [110, 250], [190, 250], [230, 300], [240, 440]], C, 9); p.ell(150, 170, 78, 84, C, 9); p.poly([[70, 130], [150, 76], [234, 130], [250, 150], [60, 150]], C, 9);
  p.arc(150, 170, 28, 26, 180, 400, 22, "#fff3c0"); p.stroke([[162, 196], [150, 208], [150, 222]], 20, "#fff3c0"); p.dot(150, 252, 12, "#fff3c0");
};
/** sleeping head on a pillow, 300 x 200 */
export const fxSleeper = (p: Pen, hair: string, k = 0) => {
  p.ell(150, 110, 78, 70, "#fbf6f0", 9); p.clip(ellPts(150, 110, 74, 66), () => p.poly([[60, 30], [240, 30], [240, 86 + k * 6], [60, 96 - k * 6]], hair, 0)); p.ell(150, 110, 78, 70, null, 9);
  for (const s of [-1, 1]) p.arc(150 + s * 28, 122, 16, 10, 20, 160, 7); p.arc(150, 148, 10, 5, 20, 160, 6);
};
/** tear drop, 80 x 120 */
export const fxTear = (p: Pen) => { p.poly([[40, 8], [66, 70], [40, 108], [14, 70]], "#bfe6ff", 7); p.stroke([[30, 66], [36, 84]], 5, "#ffffff"); };
/** rain streak, 40 x 240 (soft) */
export const fxRain = (p: Pen) => { const g = p.g, gr = g.createLinearGradient(0, 0, 0, 240); gr.addColorStop(0, "rgba(200,225,255,0)"); gr.addColorStop(1, "rgba(200,225,255,0.85)"); g.strokeStyle = gr; g.lineWidth = 7; g.lineCap = "round"; g.beginPath(); g.moveTo(28, 6); g.lineTo(12, 232); g.stroke(); };
/** stomach rumble squiggle, 240 x 120 */
export const fxRumble = (p: Pen, k = 0) => { for (let j = 0; j < 2; j++) { const pts: P2[] = []; for (let i = 0; i <= 8; i++) pts.push([14 + i * 26, 36 + j * 46 + (i % 2 ? -14 : 14) * (k ? -1 : 1)]); p.stroke(pts, 14, INK); p.stroke(pts, 7, "#ffffff"); } };
/** warm light spilling from the open door onto the street, 256 x 256 (soft, flat) */
export const fxSpill = (p: Pen) => { const g = p.g, gr = g.createRadialGradient(128, 30, 10, 128, 60, 200); gr.addColorStop(0, "rgba(255,200,120,0.85)"); gr.addColorStop(1, "rgba(255,200,120,0)"); g.fillStyle = gr; g.beginPath(); g.moveTo(88, 0); g.lineTo(168, 0); g.lineTo(256, 256); g.lineTo(0, 256); g.closePath(); g.fill(); };
/** knock lines, 200 x 200 */
export const fxKnock = (p: Pen) => { for (let i = 0; i < 5; i++) { const a = -1.2 + i * 0.6; p.stroke([[100 + 40 * Math.cos(a), 100 + 40 * Math.sin(a)], [100 + 86 * Math.cos(a), 100 + 86 * Math.sin(a)]], 14, INK); p.stroke([[100 + 40 * Math.cos(a), 100 + 40 * Math.sin(a)], [100 + 86 * Math.cos(a), 100 + 86 * Math.sin(a)]], 7, "#fff3b0"); } };
/** heart, 160 x 150 */
export const fxHeart = (p: Pen) => { const pts: P2[] = []; for (let i = 0; i <= 40; i++) { const t = (i / 40) * Math.PI * 2; pts.push([80 + 4.2 * 16 * Math.sin(t) ** 3, 70 - 4.2 * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))]); } p.poly(pts, "#e2453c", 8); };
