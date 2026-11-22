// Painted textures for "La puerta de atrás": the burger place (inside wall + round sign) and the Madeira bedroom.
import { PAINT } from "./paint2";
import { rc, el, ln, pg, mottle, vgrad, INKC } from "./kit";
type G = CanvasRenderingContext2D;
const burger = (g: G, x: number, y: number, k: number) => {
  el(g, x, y + 30 * k, 92 * k, 30 * k, "#d99a4a", 7 * k); rc(g, x - 96 * k, y - 4 * k, 192 * k, 30 * k, "#6e3a1a", 7 * k, 12 * k);
  pg(g, [[x - 100 * k, y - 6 * k], [x - 60 * k, y + 12 * k], [x - 20 * k, y - 8 * k], [x + 30 * k, y + 12 * k], [x + 70 * k, y - 8 * k], [x + 100 * k, y - 4 * k], [x + 96 * k, y - 20 * k], [x - 96 * k, y - 20 * k]], "#f6c419", 6 * k);
  rc(g, x - 100 * k, y - 34 * k, 200 * k, 18 * k, "#57a05a", 6 * k, 9 * k);
  g.beginPath(); g.moveTo(x - 96 * k, y - 34 * k); g.bezierCurveTo(x - 90 * k, y - 120 * k, x + 90 * k, y - 120 * k, x + 96 * k, y - 34 * k); g.closePath(); g.fillStyle = "#e0a04e"; g.fill(); g.lineWidth = 7 * k; g.strokeStyle = INKC; g.stroke();
  for (const [dx, dy] of [[-40, -70], [0, -86], [42, -68], [-14, -56], [22, -52]]) el(g, x + dx * k, y + dy * k, 7 * k, 4 * k, "#fbf3e2", 0);
};
PAINT.burgerSign = { w: 512, h: 512, draw: (g) => { el(g, 256, 256, 250, 250, "#c8302a", 0); el(g, 256, 256, 212, 212, "#fff3d0", 10); el(g, 256, 256, 244, 244, null, 12); burger(g, 256, 290, 1.5); } };
// inside wall of the burger place: 7 m x 3.3 m at 400 px/m. Menu boards (pictures only), a kitchen pass, tiles.
PAINT.burgerBack = { w: 2800, h: 1320, draw: (g, r) => {
  g.fillStyle = "#f3e2c2"; g.fillRect(0, 0, 2800, 1320); mottle(g, r, 0, 0, 2800, 1320, 40, ["#ffffff", "#e2c9a0"], 80, 260, 0.2);
  for (let y = 760; y < 1320; y += 70) for (let x = 0; x < 2800; x += 70) { g.fillStyle = ((x + y) / 70) % 2 ? "#d0342e" : "#fbf3e2"; g.fillRect(x, y, 70, 70); g.strokeStyle = "rgba(36,23,38,0.35)"; g.lineWidth = 3; g.strokeRect(x, y, 70, 70); }
  rc(g, -10, 740, 2820, 26, "#8a5a34", 5);
  // menu boards
  for (let i = 0; i < 5; i++) { const x = 90 + i * 330; rc(g, x, 70, 290, 250, "#2c3a4a", 8, 14); rc(g, x + 14, 84, 262, 222, null, 4, 10);
    if (i % 3 === 0) burger(g, x + 145, 230, 0.85); else if (i % 3 === 1) { rc(g, x + 95, 180, 100, 110, "#d0342e", 6, 8); for (let k = 0; k < 6; k++) rc(g, x + 100 + k * 15, 110 + (k % 2) * 16, 12, 90, "#f6c419", 3); } else { pg(g, [[x + 105, 130], [x + 185, 130], [x + 172, 290], [x + 118, 290]], "#fbf3e2", 6); rc(g, x + 100, 116, 90, 18, "#d0342e", 5, 6); ln(g, [[x + 160, 116], [x + 176, 70]], 8, "#d0342e"); }
    for (let k = 0; k < 3; k++) el(g, x + 60 + k * 85, 300 - 0, 0, 0, null, 0); }
  // kitchen pass with warm lamps (behind the door, right side)
  rc(g, 1780, 330, 760, 380, "#3a3028", 9, 12); const gg = g.createLinearGradient(0, 340, 0, 700); gg.addColorStop(0, "#ffd98a"); gg.addColorStop(1, "#c96a2c"); rc(g, 1800, 350, 720, 340, gg, 5, 8);
  for (let i = 0; i < 3; i++) { ln(g, [[1920 + i * 240, 350], [1920 + i * 240, 410]], 6); pg(g, [[1880 + i * 240, 450], [1960 + i * 240, 450], [1940 + i * 240, 410], [1900 + i * 240, 410]], "#c9cdd4", 5); }
  rc(g, 1780, 690, 760, 34, "#c9cdd4", 6); for (let i = 0; i < 4; i++) burger(g, 1890 + i * 180, 650, 0.42);
  // soda machine, clock, a mop
  rc(g, 2590, 300, 170, 440, "#c9cdd4", 8, 10); for (let i = 0; i < 3; i++) { rc(g, 2606 + i * 48, 330, 40, 110, ["#d0342e", "#f29a2e", "#3f8fc9"][i], 4, 5); rc(g, 2618 + i * 48, 470, 16, 40, "#3a3d4a", 3); }
  el(g, 1650, 190, 80, 80, "#fbf3e2", 8); ln(g, [[1650, 190], [1650, 132]], 7); ln(g, [[1650, 190], [1694, 212]], 7);
  g.fillStyle = vgrad(g, 0, 1320, "rgba(40,20,60,0)", "rgba(40,20,60,0.18)"); g.fillRect(0, 0, 2800, 1320);
} };
// Madeira bedroom back wall: 4.4 m x 2.5 m at 400 px/m. Peeling plaster, a small window on the night sea, a football poster.
PAINT.roomBack = { w: 1760, h: 1000, draw: (g, r) => {
  g.fillStyle = "#9fc4cf"; g.fillRect(0, 0, 1760, 1000); mottle(g, r, 0, 0, 1760, 1000, 60, ["#c4dde2", "#7ea6b4", "#b9a98a"], 40, 200, 0.3);
  for (const [x, y, s] of [[260, 160, 1.2], [1500, 620, 1], [980, 90, 0.8]]) { g.fillStyle = "#d9c9a8"; g.beginPath(); g.ellipse(x, y, 90 * s, 50 * s, 0.3, 0, 7); g.fill(); g.strokeStyle = "rgba(60,50,60,0.4)"; g.lineWidth = 4; g.stroke(); }
  ln(g, [[1180, 0], [1210, 120], [1190, 220], [1240, 330]], 4, "rgba(60,50,60,0.5)");
  // window with night sea and moon
  rc(g, 520, 250, 460, 400, "#8a5a34", 9); const sky = g.createLinearGradient(0, 270, 0, 630); sky.addColorStop(0, "#1c2a6a"); sky.addColorStop(0.62, "#3c56b0"); sky.addColorStop(0.63, "#22408e"); sky.addColorStop(1, "#16306e"); rc(g, 544, 272, 412, 356, sky, 5);
  el(g, 850, 350, 44, 44, "#fff3c0", 0); g.fillStyle = "rgba(255,243,192,0.35)"; g.fillRect(820, 500, 60, 8); g.fillRect(806, 524, 88, 8); g.fillRect(826, 548, 48, 8);
  for (let i = 0; i < 14; i++) { g.fillStyle = "#fff"; g.fillRect(560 + r() * 380, 286 + r() * 190, 4, 4); }
  ln(g, [[750, 272], [750, 628]], 9, "#8a5a34"); ln(g, [[544, 450], [956, 450]], 9, "#8a5a34"); rc(g, 500, 650, 500, 26, "#a8703e", 6);
  // poster: a player kicking (silhouette), tape at the corners
  rc(g, 1180, 300, 300, 400, "#f6ecd2", 6); rc(g, 1196, 316, 268, 300, "#3f8fc9", 4); el(g, 1330, 400, 34, 34, "#fbf3e2", 5); ln(g, [[1330, 434], [1330, 520]], 16, "#d0342e"); ln(g, [[1330, 520], [1290, 590]], 12, "#fbf3e2"); ln(g, [[1330, 520], [1390, 560]], 12, "#fbf3e2"); ln(g, [[1330, 456], [1280, 490]], 10, "#d0342e"); ln(g, [[1330, 456], [1384, 470]], 10, "#d0342e"); el(g, 1420, 574, 22, 22, "#fbfbf6", 4);
  for (const [x, y] of [[1180, 300], [1480, 300]]) rc(g, x - 20, y - 12, 40, 24, "rgba(240,220,160,0.8)", 2);
  // shelf with a toy car and a medal
  rc(g, 120, 560, 300, 22, "#a8703e", 6); rc(g, 160, 510, 110, 50, "#d0342e", 5, 12); el(g, 186, 562, 16, 16, "#2c2a38", 4); el(g, 246, 562, 16, 16, "#2c2a38", 4); el(g, 350, 520, 26, 26, "#f2c64a", 5); ln(g, [[350, 494], [336, 440], [364, 440], [350, 494]], 6, "#3f8fc9");
  g.fillStyle = vgrad(g, 600, 1000, "rgba(40,20,60,0)", "rgba(40,20,60,0.3)"); g.fillRect(0, 600, 1760, 400);
} };
PAINT.roomFloor = { w: 512, h: 512, draw: (g, r) => { g.fillStyle = "#8a6240"; g.fillRect(0, 0, 512, 512); for (let i = 0; i < 6; i++) { g.fillStyle = `rgba(${i % 2 ? "255,220,170" : "50,20,10"},0.12)`; g.fillRect(i * 86, 0, 86, 512); ln(g, [[i * 86, 0], [i * 86, 512]], 5, "rgba(40,20,15,0.6)"); for (let k = 0; k < 3; k++) { const y = r() * 512; ln(g, [[i * 86 + 10, y], [i * 86 + 76, y]], 3, "rgba(40,20,15,0.4)"); } } } };

// ---- the street, repainted as Lisbon: calçada pavement, an azulejo panel at the end of the street, green-and-red bunting ----
PAINT.paving = { w: 2048, h: 2048, draw: (g, r) => {
  g.fillStyle = "#d8cfbc"; g.fillRect(0, 0, 2048, 2048); mottle(g, r, 0, 0, 2048, 2048, 60, ["#efe8d8", "#b9b0a0"], 40, 160, 0.3);
  g.strokeStyle = "rgba(60,50,60,0.28)"; g.lineWidth = 2.5; for (let i = 0; i <= 2048; i += 64) { g.beginPath(); g.moveTo(i + 6 * Math.sin(i), 0); g.lineTo(i - 6 * Math.sin(i), 2048); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(2048, i + 8 * Math.sin(i * 0.7)); g.stroke(); }
  for (let k = 0; k < 4; k++) { const y0 = k * 512 + 150; g.beginPath(); for (let x = 0; x <= 2048; x += 16) { const y = y0 + 70 * Math.sin((x / 2048) * Math.PI * 8); if (x) g.lineTo(x, y); else g.moveTo(x, y); } for (let x = 2048; x >= 0; x -= 16) g.lineTo(x, y0 + 150 + 70 * Math.sin((x / 2048) * Math.PI * 8)); g.closePath(); g.fillStyle = "#3a3840"; g.fill(); }
} };
PAINT.bunting = { w: 2048, h: 160, draw: (g) => { g.clearRect(0, 0, 2048, 160); ln(g, [[0, 14], [2048, 14]], 6); for (let i = 0; i < 16; i++) pg(g, [[i * 128 + 10, 16], [i * 128 + 118, 16], [i * 128 + 64, 150]], i % 2 ? "#c8302a" : "#2f8a4a", 5); } };
PAINT.mural = { w: 1008, h: 2340, draw: (g) => {
  g.fillStyle = "#f4f7fb"; g.fillRect(0, 0, 1008, 2340);
  for (let y = 0; y < 2340; y += 84) for (let x = 0; x < 1008; x += 84) { g.strokeStyle = "rgba(60,90,150,0.35)"; g.lineWidth = 3; g.strokeRect(x, y, 84, 84); }
  for (let i = 0; i < 12; i++) for (const y of [42, 2298]) { g.fillStyle = "#3f6fb8"; g.beginPath(); g.arc(42 + i * 84, y, 26, 0, 7); g.fill(); g.fillStyle = "#f4f7fb"; g.beginPath(); g.arc(42 + i * 84, y, 12, 0, 7); g.fill(); }
  // a caravel on the waves, in tile blue
  g.fillStyle = "#3f6fb8"; g.strokeStyle = "#24468e"; g.lineWidth = 10;
  pg(g, [[260, 1500], [760, 1500], [690, 1660], [330, 1660]], "#3f6fb8", 10); ln(g, [[500, 1500], [500, 900]], 18, "#24468e");
  pg(g, [[520, 930], [760, 1180], [520, 1440]], "#8fb0e0", 10); pg(g, [[480, 980], [300, 1240], [480, 1440]], "#c9d8f0", 10);
  for (let k = 0; k < 4; k++) { g.beginPath(); for (let x = 60; x <= 948; x += 12) { const y = 1760 + k * 110 + 26 * Math.sin(x / 60 + k); if (x > 60) g.lineTo(x, y); else g.moveTo(x, y); } g.strokeStyle = "#3f6fb8"; g.lineWidth = 14; g.stroke(); }
  el(g, 760, 620, 70, 70, "#f2c64a", 10);
  g.fillStyle = vgrad(g, 1700, 2340, "rgba(40,20,60,0)", "rgba(40,20,60,0.25)"); g.fillRect(0, 1700, 1008, 640);
} };
