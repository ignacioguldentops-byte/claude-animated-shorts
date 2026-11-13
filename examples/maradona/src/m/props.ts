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

/** red dot with a downward arrow: the centre of gravity marker, 200 x 300 canvas */
export const fxCog = (p: Pen) => {
  p.line([[100, 40], [100, 210]], "#ffffff", 16);
  p.poly([[60, 190], [140, 190], [100, 270]], "#ffffff", 9);
  p.ell(100, 40, 34, 34, "#e8433a", 9);
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
