// Small painted props of "La trastienda": the old leather ball, the big-eared cup, a horse and carriage, a dog, Swiss things.
import { Pen } from "./toon";
const INK = "#241726";
/** a leather ball of 1902: brown panels and a lace (120 x 120) */
export const fxOldBall = (p: Pen) => { p.ell(60, 60, 48, 48, "#b9773e", 8); p.stroke([[24, 34], [60, 44], [96, 34]], 4, "#6a3e22"); p.stroke([[20, 80], [60, 72], [100, 80]], 4, "#6a3e22"); p.stroke([[60, 14], [60, 44]], 4, "#6a3e22"); p.stroke([[60, 72], [60, 106]], 4, "#6a3e22"); for (let i = 0; i < 4; i++) p.stroke([[50 + i * 7, 52], [50 + i * 7, 64]], 3, "#f1dca0"); p.ell(42, 36, 9, 5, "#d89a5a", 0); };
/** the same ball gone flat (160 x 90) */
export const fxFlatBall = (p: Pen) => { p.poly([[14, 70], [30, 40], [70, 30], [118, 36], [146, 62], [140, 78], [20, 80]], "#b9773e", 8); p.stroke([[40, 50], [76, 44], [116, 50]], 4, "#6a3e22"); p.stroke([[76, 34], [78, 76]], 4, "#6a3e22"); for (let i = 0; i < 4; i++) p.stroke([[64 + i * 7, 52], [64 + i * 7, 62]], 3, "#f1dca0"); };
/** the cup with the big ears, in silver (200 x 300) */
export const fxEuroCup = (p: Pen) => {
  for (const s of [-1, 1]) { const x = 100 + s * 40; p.stroke([[x, 84], [100 + s * 86, 70], [100 + s * 90, 130], [100 + s * 44, 176]], 20, INK); p.stroke([[x, 84], [100 + s * 86, 70], [100 + s * 90, 130], [100 + s * 44, 176]], 9, "#dfe6ee"); }
  p.poly([[52, 40], [148, 40], [140, 120], [124, 176], [112, 200], [112, 232], [88, 232], [88, 200], [76, 176], [60, 120]], "#e9eef4", 8);
  p.poly([[60, 232], [140, 232], [152, 282], [48, 282]], "#c9d2de", 8); p.ell(100, 40, 50, 12, "#f7fafc", 7);
  p.stroke([[72, 60], [78, 130], [92, 176]], 9, "#ffffff"); p.stroke([[130, 64], [124, 126]], 5, "#b3bfcc"); p.stroke([[60, 258], [140, 258]], 5, "#aab6c4");
};
/** a horse and an open carriage with its driver, seen from the side (760 x 380), heading right */
export const fxCarriage = (p: Pen, k: number) => {
  const leg = (x: number, a: number) => { p.stroke([[x, 250], [x + a, 300], [x + a * 0.4, 350]], 17, INK); p.stroke([[x, 250], [x + a, 300], [x + a * 0.4, 350]], 9, "#6a3e22"); p.ell(x + a * 0.4, 354, 9, 6, "#23202a", 0); };
  const s = k ? 16 : -16;
  leg(520, s); leg(640, -s); p.ell(580, 220, 92, 50, "#8a5a34", 9); leg(540, -s); leg(620, s);
  p.poly([[640, 196], [690, 110], [724, 116], [690, 230]], "#8a5a34", 9); p.poly([[684, 96], [740, 104], [754, 142], [726, 150], [700, 128]], "#8a5a34", 9); p.dot(726, 118, 5, INK); p.poly([[690, 92], [698, 70], [708, 94]], "#8a5a34", 6);
  p.stroke([[676, 104], [652, 150], [640, 190]], 12, "#3a2a1e"); p.stroke([[492, 210], [460, 250], [468, 300]], 12, "#3a2a1e");
  p.stroke([[560, 196], [330, 200]], 6, "#3a2a1e"); p.stroke([[700, 132], [420, 130]], 3, "#3a2a1e");
  p.poly([[60, 150], [330, 150], [350, 240], [40, 240]], "#23202a", 9); p.poly([[70, 80], [220, 80], [236, 150], [60, 150]], "#3a3438", 9); p.poly([[84, 94], [206, 94], [216, 142], [78, 142]], "#bfe0f0", 5);
  p.poly([[60, 150], [330, 150], [336, 176], [56, 176]], "#7a2630", 6);
  for (const x of [110, 290]) { p.ell(x, 290, 62, 62, null, 0); const g = p.g; g.lineWidth = 16; g.strokeStyle = INK; g.beginPath(); g.arc(x, 290, 58, 0, 6.3); g.stroke(); g.lineWidth = 7; g.strokeStyle = "#c9a86a"; g.stroke(); for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + (k ? 0.39 : 0); p.stroke([[x, 290], [x + 54 * Math.cos(a), 290 + 54 * Math.sin(a)]], 5, "#c9a86a"); } p.dot(x, 290, 11, INK); }
  // the driver on his box, in a top hat
  p.poly([[300, 60], [356, 60], [364, 150], [292, 150]], "#2c2a38", 8); p.ell(328, 38, 26, 26, "#f6c9a8", 7); p.poly([[306, -12], [350, -12], [352, 22], [304, 22]], "#23202a", 6); p.stroke([[294, 24], [362, 24]], 9, "#23202a"); p.stroke([[350, 92], [410, 120]], 9, "#2c2a38");
};
/** a little dog trotting (200 x 140), heading right */
export const fxDog = (p: Pen, k: number) => { const s = k ? 10 : -10; for (const [x, a] of [[60, s], [78, -s], [130, -s], [146, s]]) { p.stroke([[x, 84], [x + a, 124]], 13, INK); p.stroke([[x, 84], [x + a, 124]], 6, "#f1e3c4"); }
  p.ell(102, 76, 58, 28, "#f1e3c4", 7); p.ell(164, 52, 26, 22, "#f1e3c4", 7); p.poly([[150, 34], [142, 8], [166, 30]], "#8a5a34", 6); p.dot(172, 48, 4, INK); p.dot(188, 58, 5, INK); p.stroke([[46, 66], [22, 36 + s]], 9, INK); p.stroke([[46, 66], [22, 36 + s]], 4, "#f1e3c4"); p.ell(84, 70, 18, 12, "#8a5a34", 0); };
/** a wedge of holed cheese (160 x 130) */
export const fxCheese = (p: Pen) => { p.poly([[12, 96], [120, 22], [150, 60], [150, 110], [12, 118]], "#f6c419", 8); p.poly([[12, 96], [150, 60], [150, 110], [12, 118]], "#ffd75a", 6); for (const [x, y, r] of [[50, 100, 9], [92, 88, 12], [128, 92, 7], [70, 108, 5], [112, 104, 5]]) p.ell(x, y, r, r * 0.8, "#e0a814", 4); };
/** snowy peaks popping up behind him (512 x 300) */
export const fxAlps = (p: Pen) => { for (const [x, w, h, c] of [[110, 150, 200, "#8fa6c8"], [400, 160, 180, "#8fa6c8"], [256, 200, 270, "#a9bedc"]] as [number, number, number, string][]) { p.poly([[x - w, 300], [x, 300 - h], [x + w, 300]], c, 8); p.poly([[x - w * 0.3, 300 - h * 0.7], [x, 300 - h], [x + w * 0.3, 300 - h * 0.7], [x + w * 0.12, 300 - h * 0.62], [x, 300 - h * 0.72], [x - w * 0.14, 300 - h * 0.6]], "#fbfdff", 6); } };
/** a cow bell on its strap (120 x 150) */
export const fxBell = (p: Pen) => { p.poly([[30, 10], [90, 10], [84, 40], [36, 40]], "#7a2630", 6); p.poly([[34, 40], [86, 40], [104, 120], [16, 120]], "#e8c45a", 8); p.stroke([[44, 54], [36, 104]], 7, "#fff3b0"); p.dot(60, 128, 11, INK); };
/** a quill (140 x 200) */
export const fxQuill = (p: Pen) => { p.poly([[100, 10], [130, 40], [70, 130], [50, 136], [56, 116]], "#fbfaf2", 6); p.stroke([[116, 26], [40, 160]], 5, "#8a7a66"); p.stroke([[40, 160], [30, 186]], 6, INK); };
/** a magnesium flash on its tray: the puff (256 x 256) */
export const fxPoof = (p: Pen, t: number) => { const g = p.g; for (let i = 0; i < 7; i++) { const a = i * 0.9, r = 30 + 70 * t, x = 128 + r * Math.cos(a) * 0.8, y = 128 + r * Math.sin(a) * 0.7, rad = 44 * (1 - t * 0.5), gr = g.createRadialGradient(x, y, 2, x, y, rad); gr.addColorStop(0, `rgba(255,255,255,${0.95 * (1 - t)})`); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.beginPath(); g.arc(x, y, rad, 0, 6.3); g.fill(); } };
/** a dot of the route on the map (64 x 64) and the little train that draws it (200 x 120) */
export const fxDot = (p: Pen) => { p.ell(32, 32, 20, 20, "#b8362e", 7); };
export const fxLoco = (p: Pen) => { p.poly([[20, 40], [120, 40], [120, 90], [20, 90]], "#23202a", 7); p.poly([[120, 20], [180, 20], [180, 90], [120, 90]], "#7a2630", 7); p.poly([[132, 32], [168, 32], [168, 58], [132, 58]], "#bfe0f0", 4); p.poly([[36, 12], [60, 12], [56, 40], [40, 40]], "#23202a", 6); for (const x of [50, 96, 150]) { p.ell(x, 94, 18, 18, "#c9a86a", 7); p.dot(x, 94, 5, INK); } p.poly([[8, 70], [22, 60], [22, 92], [6, 92]], "#e8c45a", 5); };
/** a camera on its tripod (200 x 320) */
export const fxTripod = (p: Pen) => { for (const dx of [-60, 0, 60]) { p.stroke([[100, 120], [100 + dx, 310]], 12, INK); p.stroke([[100, 120], [100 + dx, 310]], 5, "#a87c48"); } p.poly([[50, 40], [150, 40], [150, 124], [50, 124]], "#6a3e22", 8); p.poly([[150, 60], [186, 50], [186, 114], [150, 104]], "#23202a", 6); p.ell(186, 82, 8, 20, "#bfe0f0", 5); p.poly([[30, 30], [56, 44], [56, 120], [30, 134]], "#23202a", 6); };
/** a top hat knocked into the air (200 x 200) */
export const fxTopHat = (p: Pen) => { p.ell(100, 150, 84, 18, "#23202a", 8); p.poly([[52, 150], [46, 44], [154, 44], [148, 150]], "#23202a", 8); p.ell(100, 44, 54, 12, "#3a3438", 6); p.stroke([[54, 128], [146, 128]], 12, "#7a2630"); p.stroke([[66, 60], [68, 112]], 7, "rgba(255,255,255,0.25)"); };
/** steam / smoke puff, soft (128 x 128) */
export const fxSteam = (p: Pen, dark = false) => { const g = p.g, gr = g.createRadialGradient(64, 64, 4, 64, 64, 60); gr.addColorStop(0, dark ? "rgba(120,118,132,0.75)" : "rgba(255,255,255,0.95)"); gr.addColorStop(0.55, dark ? "rgba(120,118,132,0.4)" : "rgba(245,248,255,0.6)"); gr.addColorStop(1, dark ? "rgba(120,118,132,0)" : "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); };
/** a cab seen from behind: the box, the rear window, two wheels on edge, the driver's top hat over the roof (300 x 380) */
export const fxCabBack = (p: Pen, k: number) => { for (const x of [44, 256]) { p.ell(x, 268, 20, 88, "#c9a86a", 9); p.ell(x, 268, 8, 62, "#3a2a1e", 0); }
  p.poly([[70, 110], [230, 110], [240, 300], [60, 300]], "#23202a", 9); p.poly([[84, 60], [216, 60], [230, 110], [70, 110]], "#3a3438", 9); p.poly([[112, 132], [188, 132], [188, 196], [112, 196]], "#bfe0f0", 6); p.poly([[60, 268], [240, 268], [240, 300], [60, 300]], "#7a2630", 6);
  p.poly([[128, 8 + k * 3], [172, 8 + k * 3], [174, 44 + k * 3], [126, 44 + k * 3]], "#23202a", 6); p.stroke([[116, 46 + k * 3], [184, 46 + k * 3]], 9, "#23202a"); p.ell(110, 250, 9, 9, "#fff3c0", 4); p.ell(190, 250, 9, 9, "#fff3c0", 4); };
