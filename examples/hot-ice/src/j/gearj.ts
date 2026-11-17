// Props and effects of "Hielo caliente" (our own flat 2D drawings, canvas px).
import { Pen, INK, rrect, ellPts } from "./toon";
type P2 = [number, number];
/** soft snow flake for the falling snow, 64 x 64 */
export const fxSnow = (p: Pen) => { const g = p.g, gr = g.createRadialGradient(32, 32, 2, 32, 32, 30); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.5, "rgba(255,255,255,0.85)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); };
/** the one crisp snowflake of the hook, 200 x 200 */
export const fxFlake = (p: Pen) => {
  for (const pass of [0, 1]) for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a), w = pass ? 9 : 20, col = pass ? "#ffffff" : "#7fb6e6";
    p.stroke([[100, 100], [100 + 84 * c, 100 + 84 * s]], w, col);
    for (const d of [0.45, 0.72]) for (const sd of [-1, 1]) { const bx = 100 + 84 * d * c, by = 100 + 84 * d * s, a2 = a + sd * 0.9; p.stroke([[bx, by], [bx + 24 * Math.cos(a2), by + 24 * Math.sin(a2)]], w * 0.8, col); } }
};
/** aurora curtain (soft), 512 x 256 */
export const fxAurora = (p: Pen, k = 0) => {
  const g = p.g;
  for (let x = 0; x < 512; x += 4) { const t = x / 512, top = 40 + 50 * Math.sin(t * 6.3 * (1.2 + k * 0.4) + k) + 22 * Math.sin(t * 6.3 * 4.3 + k * 2), len = 120 + 70 * Math.sin(t * 6.3 * 2.6 + k * 1.3), a = 0.75 * Math.sin(Math.PI * t) ** 0.7 * (0.55 + 0.45 * Math.sin(t * 6.3 * 9 + k * 5));
    const gr = g.createLinearGradient(0, top, 0, top + len); gr.addColorStop(0, "rgba(255,255,255,0)"); gr.addColorStop(0.25, `rgba(255,255,255,${Math.max(0, a).toFixed(3)})`); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(x, top, 4, len); }
};
/** thought bubble with a sled on a white slope, 420 x 360 */
export const fxThought = (p: Pen) => {
  p.ell(60, 330, 16, 16, "#ffffff", 8); p.ell(96, 286, 26, 24, "#ffffff", 8);
  const b: P2[] = []; for (let i = 0; i < 40; i++) { const a = (i / 40) * Math.PI * 2, r = 1 + 0.07 * Math.sin(a * 7); b.push([232 + 176 * r * Math.cos(a), 150 + 132 * r * Math.sin(a)]); } p.poly(b, "#ffffff", 9);
  p.clip(b, () => { p.poly([[40, 230], [420, 150], [420, 300], [40, 300]], "#d6e8fa", 0); });
  p.poly([[120, 196], [300, 158], [336, 136], [318, 116], [262, 110], [150, 134], [124, 160]], "#23202a", 8); p.stroke([[150, 150], [300, 122]], 12, "#f6c419"); p.stroke([[154, 166], [304, 138]], 7, "#1f8a3a");
  p.stroke([[118, 212], [330, 168]], 9, "#8f9bb0"); for (const [x, y] of [[176, 118], [214, 110], [250, 102]]) p.ell(x, y, 17, 17, "#f6c419", 6);
  for (const [x, y] of [[110, 90], [330, 70], [370, 200], [150, 250]]) { for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI; p.stroke([[x - 13 * Math.cos(a), y - 13 * Math.sin(a)], [x + 13 * Math.cos(a), y + 13 * Math.sin(a)]], 5, "#7fb6e6"); } }
};
/** ice shards kicked up by the runners, 300 x 200; t 0..1 */
export const fxIce = (p: Pen, t: number) => {
  for (let i = 0; i < 9; i++) { const a = Math.PI + (i / 8) * Math.PI, d = 30 + 120 * t * (0.6 + 0.4 * ((i * 37) % 10) / 10), x = 150 + d * Math.cos(a), y = 170 + d * 0.8 * Math.sin(a) + 60 * t * t, s = (15 - 9 * t) * (0.7 + ((i * 13) % 7) / 10);
    p.poly([[x, y - s], [x + s * 0.8, y], [x, y + s], [x - s * 0.8, y]], i % 2 ? "#ffffff" : "#cfeaff", 4); }
};
/** frozen puddle on the ground, 256 x 160 (flat) */
export const fxPuddle = (p: Pen) => { p.ell(128, 80, 116, 66, "#bfe3fa", 7); p.stroke([[70, 60], [120, 48]], 8, "#ffffff"); p.stroke([[150, 100], [190, 90]], 6, "#ffffff"); };
/** breath cloud, 120 x 90 (soft) */
export const fxBreath = (p: Pen) => { const g = p.g; for (const [x, y, r] of [[40, 50, 26], [70, 40, 30], [88, 56, 20]]) { const gr = g.createRadialGradient(x, y, 2, x, y, r); gr.addColorStop(0, "rgba(255,255,255,0.8)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 120, 90); } };
/** speed lines, 400 x 200 */
export const fxWhoosh = (p: Pen) => { for (let i = 0; i < 5; i++) p.stroke([[20 + i * 26, 24 + i * 38], [380 - ((i * 53) % 90), 24 + i * 38]], 9 - i, "#ffffff"); };
/** a coin, 120 x 120 */
export const fxCoinJ = (p: Pen) => { p.ell(60, 60, 50, 50, "#f2c64a", 9); p.ell(60, 60, 32, 32, null, 5); };
/** exclamation mark, 120 x 260 */
export const fxBang = (p: Pen) => { p.poly([[36, 16], [84, 16], [74, 170], [46, 170]], "#ffd75a", 9); p.ell(60, 222, 22, 22, "#ffd75a", 9); };
/** firework burst, 256 x 256 (soft); t 0..1 */
export const fxFire = (p: Pen, t: number, col: string) => { const g = p.g; g.lineCap = "round"; for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2, r0 = 20 + 60 * t, r1 = 30 + 96 * t; g.strokeStyle = col; g.globalAlpha = Math.max(0, 1 - t); g.lineWidth = 7 * (1 - 0.5 * t); g.beginPath(); g.moveTo(128 + r0 * Math.cos(a), 128 + r0 * Math.sin(a)); g.lineTo(128 + r1 * Math.cos(a), 128 + r1 * Math.sin(a) + 20 * t * t); g.stroke(); } g.globalAlpha = 1; };
/** sun disc with rays for the beach, 256 x 256 (soft) */
export const fxSun = (p: Pen) => { const g = p.g, gr = g.createRadialGradient(128, 128, 20, 128, 128, 126); gr.addColorStop(0, "rgba(255,250,220,1)"); gr.addColorStop(0.3, "rgba(255,236,160,0.9)"); gr.addColorStop(1, "rgba(255,220,120,0)"); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); };
/** a seagull, 160 x 80; flap 0/1 */
export const fxGull = (p: Pen, k: number) => { const d = k ? 18 : -6; p.stroke([[20, 40 + d], [58, 30], [80, 44], [102, 30], [140, 40 + d]], 13, INK); p.stroke([[20, 40 + d], [58, 30], [80, 44], [102, 30], [140, 40 + d]], 6, "#ffffff"); };
/** a little sailing boat far out, 200 x 200 */
export const fxSail = (p: Pen) => { p.poly([[40, 150], [160, 150], [140, 178], [60, 178]], "#e2453c", 7); p.stroke([[100, 150], [100, 30]], 6); p.poly([[106, 36], [106, 140], [166, 140]], "#ffffff", 6); p.poly([[94, 50], [94, 140], [50, 140]], "#f6d24a", 6); };
/** leg cast + bandage icon for the hurt one, 200 x 200 */
export const fxOuch = (p: Pen) => { for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + 0.3; p.stroke([[100 + 36 * Math.cos(a), 100 + 36 * Math.sin(a)], [100 + 86 * Math.cos(a), 100 + 86 * Math.sin(a)]], 16, INK); p.stroke([[100 + 36 * Math.cos(a), 100 + 36 * Math.sin(a)], [100 + 86 * Math.cos(a), 100 + 86 * Math.sin(a)]], 8, "#ff6a4a"); } };
void [rrect, ellPts];
