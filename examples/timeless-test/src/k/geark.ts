// Small painted props and effects of "Sin límite": the ball, the knock of the bat, rain, a storm cloud, day counters.
import { Pen } from "./toon";
const INK = "#241726";
/** red leather ball with its seam (120 x 120) */
export const fxCBall = (p: Pen) => { p.ell(60, 60, 46, 46, "#c2372e", 8); p.stroke([[38, 22], [50, 60], [38, 98]], 5, "#fbe9d0"); p.stroke([[52, 18], [64, 60], [52, 102]], 5, "#fbe9d0"); p.ell(78, 40, 8, 5, "#e8766a", 0); };
/** "tock": short knock lines (200 x 200) */
export const fxTock = (p: Pen) => { for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2 + 0.2; p.stroke([[100 + 38 * Math.cos(a), 100 + 38 * Math.sin(a)], [100 + 84 * Math.cos(a), 100 + 84 * Math.sin(a)]], 13, INK); p.stroke([[100 + 38 * Math.cos(a), 100 + 38 * Math.sin(a)], [100 + 84 * Math.cos(a), 100 + 84 * Math.sin(a)]], 7, "#fff3b0"); } };
/** a sheet of slanted rain streaks (256 x 512) */
export const fxRain = (p: Pen, k: number) => { const g = p.g; g.lineCap = "round"; for (let i = 0; i < 26; i++) { const v = Math.sin((i + 1) * 127.1 + k * 311.7) * 43758.5453, r = v - Math.floor(v), v2 = Math.sin((i + 1) * 269.5 + k * 183.3) * 43758.5453, r2 = v2 - Math.floor(v2), x = r * 256, y = r2 * 512, l = 46 + 60 * r;
    g.strokeStyle = `rgba(215,232,255,${0.28 + 0.3 * r2})`; g.lineWidth = 2 + 1.6 * r; g.beginPath(); g.moveTo(x, y); g.lineTo(x - l * 0.22, y + l); g.stroke(); } };
/** one fat drop (80 x 120) */
export const fxDrop = (p: Pen) => { p.poly([[40, 8], [62, 66], [58, 90], [40, 104], [22, 90], [18, 66]], "#9fd0f5", 7); p.ell(32, 74, 6, 10, "#e6f4ff", 0); };
/** dark storm cloud, soft (512 x 256) */
export const fxStorm = (p: Pen, k: number) => { const g = p.g; for (let i = 0; i < 9; i++) { const v = Math.sin((i + 1) * 91.7 + k * 17.3) * 43758.5453, r = v - Math.floor(v), x = 70 + i * 46, y = 120 + 40 * (r - 0.5), rad = 62 + 40 * r, gr = g.createRadialGradient(x, y, 6, x, y, rad);
    gr.addColorStop(0, "rgba(58,64,92,0.95)"); gr.addColorStop(0.6, "rgba(70,78,108,0.7)"); gr.addColorStop(1, "rgba(70,78,108,0)"); g.fillStyle = gr; g.beginPath(); g.arc(x, y, rad, 0, 6.3); g.fill(); } };
/** a little sun for counting days (160 x 160); lit = false: a grey used-up one */
export const fxDay = (p: Pen, lit = true) => { for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; p.stroke([[80 + 50 * Math.cos(a), 80 + 50 * Math.sin(a)], [80 + 70 * Math.cos(a), 80 + 70 * Math.sin(a)]], 12, INK); p.stroke([[80 + 50 * Math.cos(a), 80 + 50 * Math.sin(a)], [80 + 70 * Math.cos(a), 80 + 70 * Math.sin(a)]], 6, lit ? "#ffd75a" : "#b9b3bd"); } p.ell(80, 80, 38, 38, lit ? "#ffd75a" : "#d9d5dd", 8); };
/** steam / smoke puff, soft (128 x 128) */
export const fxSteam = (p: Pen, dark = false) => { const g = p.g, gr = g.createRadialGradient(64, 64, 4, 64, 64, 60); gr.addColorStop(0, dark ? "rgba(120,118,132,0.75)" : "rgba(255,255,255,0.95)"); gr.addColorStop(0.55, dark ? "rgba(120,118,132,0.4)" : "rgba(245,248,255,0.6)"); gr.addColorStop(1, dark ? "rgba(120,118,132,0)" : "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); };
/** a pocket watch flying through the air (120 x 120) */
export const fxWatch = (p: Pen) => { p.stroke([[60, 20], [74, 4], [96, 10]], 5, "#c9a24a"); p.ell(60, 66, 40, 40, "#f2c64a", 8); p.ell(60, 66, 28, 28, "#fffdf6", 4); p.stroke([[60, 66], [60, 46]], 5, INK); p.stroke([[60, 66], [74, 72]], 5, INK); p.ell(60, 22, 8, 6, "#f2c64a", 4); };
/** ripple ring of a drop in a puddle (128 x 64) */
export const fxRipple = (p: Pen) => { const g = p.g; g.strokeStyle = "rgba(235,245,255,0.9)"; g.lineWidth = 5; g.beginPath(); g.ellipse(64, 32, 54, 22, 0, 0, 6.3); g.stroke(); };
