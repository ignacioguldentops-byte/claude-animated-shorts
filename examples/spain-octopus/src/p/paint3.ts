// Painted textures for "El pulpo": Galician plaza (granite, white galleries) and the aquarium hall.
import { rc, el, ln, pg, mottle, vgrad, INKC } from "./kit";
type G = CanvasRenderingContext2D;
export type Painter = { w: number; h: number; draw: (g: G, r: () => number) => void };

export type HouseOpt = { stone: boolean; wall: string; trim: string; door: string; gallery: number; ground: "arch" | "shop" | "pulpo"; seed: number };
/** Galician house front, wm x hm metres at 200 px/m. glow = only the lit windows (emissive map). */
export const housePainter = (wm: number, hm: number, o: HouseOpt, glow: boolean): Painter => ({ w: Math.round(wm * 200), h: Math.round(hm * 200), draw: (g, r0) => {
  const M = 200, Wp = wm * M, Hp = hm * M, Y = (m: number) => (hm - m) * M;
  let s = o.seed * 7919 + 13; const r = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  const GF = 3.5, FL = 3.0, floors = Math.max(1, Math.floor((hm - GF - 0.7) / FL)), cols = Math.max(2, Math.round(wm / 2.5)), cw = Wp / cols;
  if (glow) { g.fillStyle = "#000"; g.fillRect(0, 0, Wp, Hp); }
  else {
    g.fillStyle = o.wall; g.fillRect(0, 0, Wp, Hp);
    if (o.stone) { // granite ashlar: staggered blocks with tone variation
      for (let row = 0, y = 0; y < Hp; row++, y += 0.46 * M) { let x = -((row % 2) * 0.5 + r() * 0.2) * M; while (x < Wp) { const bw = (0.75 + r() * 0.6) * M, k = r(); g.fillStyle = k < 0.33 ? "rgba(255,255,255,0.1)" : k < 0.66 ? "rgba(60,50,70,0.1)" : "rgba(120,100,80,0.07)"; g.fillRect(x, y, bw, 0.46 * M); g.strokeStyle = "rgba(50,40,60,0.38)"; g.lineWidth = 3; g.strokeRect(x, y, bw, 0.46 * M); x += bw; } }
      mottle(g, r0, 0, 0, Wp, Hp, 40, ["#8a9a6a", "#6a6a7a", "#d8d2c4"], 40, 160, 0.14);
    } else { mottle(g, r0, 0, 0, Wp, Hp, 50, ["#ffffff", "#d8cfc0", "#c9c0b2"], 60, 220, 0.2);
      for (const x of [0, Wp - 0.5 * M]) for (let y = 0, k = 0; y < Hp; y += 0.5 * M, k++) rc(g, x + (k % 2 ? 0 : x ? -0.12 * M : 0), y, (k % 2 ? 0.5 : 0.62) * M, 0.5 * M, o.trim, 3); }
    g.fillStyle = vgrad(g, Y(GF), Hp, "rgba(40,20,60,0)", "rgba(40,20,60,0.22)"); g.fillRect(0, Y(GF), Wp, Hp);
  }
  const pane = (x: number, y: number, w: number, h: number, lit: boolean) => {
    if (glow) { if (lit) { const gg = g.createLinearGradient(0, y, 0, y + h); gg.addColorStop(0, "#ffe2a0"); gg.addColorStop(1, "#ffa848"); g.fillStyle = gg; g.fillRect(x + 4, y + 4, w - 8, h - 8); } return; }
    rc(g, x, y, w, h, "#2b3a5e", 4); g.fillStyle = "rgba(190,220,240,0.35)"; g.beginPath(); g.moveTo(x + 4, y + h - 4); g.lineTo(x + 4, y + h * 0.3); g.lineTo(x + w * 0.7, y + 4); g.lineTo(x + w - 4, y + 4); g.lineTo(x + w - 4, y + h * 0.2); g.closePath(); g.fill();
  };
  for (let fl = 0; fl < floors; fl++) {
    const yb = Y(GF + 0.75 + fl * FL), gal = fl >= floors - o.gallery;
    if (gal) { // glazed white gallery across the whole front
      const x0 = 0.25 * M, w = Wp - 0.5 * M, h = 2.3 * M, n = Math.round(w / (0.55 * M)), pw = w / n;
      if (!glow) { g.fillStyle = "rgba(30,15,40,0.25)"; g.fillRect(x0 + 6, yb + 6, w, 30); rc(g, x0 - 10, yb - h - 16, w + 20, h + 34, "#f6f4ee", 6); }
      for (let i = 0; i < n; i++) { const lit = r() < 0.45; for (const [py, ph] of [[0.08, 0.2], [0.3, 0.42], [0.74, 0.2]]) pane(x0 + i * pw + 8, yb - h + py * h, pw - 16, ph * h, lit); }
      if (!glow) { rc(g, x0 - 22, yb - h - 40, w + 44, 28, "#e9e6dc", 5); rc(g, x0 - 22, yb + 4, w + 44, 26, "#e9e6dc", 5); }
      continue;
    }
    for (let c = 0; c < cols; c++) {
      const cx = (c + 0.5) * cw, ww = 1.05 * M, wh = 1.9 * M, lit = r() < 0.5, balc = r() < 0.55, pot = r() < 0.5;
      if (!glow) { rc(g, cx - ww / 2 - 22, yb - wh - 26, ww + 44, wh + 40, o.trim, 5); rc(g, cx - ww / 2, yb - wh, ww, wh, "#f6f4ee", 5); }
      for (const sx of [0, 1]) for (const sy of [0, 1, 2]) pane(cx - ww / 2 + 10 + sx * (ww / 2 - 4), yb - wh + 10 + sy * (wh - 16) / 3, ww / 2 - 16, (wh - 16) / 3 - 8, lit);
      if (glow) continue;
      if (balc) { const bw = ww * 1.7; rc(g, cx - bw / 2, yb + 6, bw, 22, "#b8b2a8", 5); rc(g, cx - bw / 2 + 6, yb - 0.9 * M, bw - 12, 10, "#2a2538", 0); for (let k = 0; k <= 12; k++) ln(g, [[cx - bw / 2 + 10 + k * (bw - 20) / 12, yb - 0.9 * M], [cx - bw / 2 + 10 + k * (bw - 20) / 12, yb + 6]], 5, "#2a2538");
        if (pot) for (const px of [-0.3, 0.3]) { const x = cx + px * bw; pg(g, [[x - 24, yb - 34], [x + 24, yb - 34], [x + 18, yb + 4], [x - 18, yb + 4]], "#c9673a", 4); for (let k = 0; k < 5; k++) el(g, x - 22 + k * 11, yb - 48 - (k % 2) * 12, 15, 15, k % 2 ? "#3f8a4a" : "#57a05a", 3); el(g, x, yb - 66, 8, 8, ["#f25c7a", "#e94a3a", "#f2c64a"][Math.floor(r() * 3)], 2.5); } }
      else rc(g, cx - ww / 2 - 30, yb, ww + 60, 22, "#b8b2a8", 5);
    }
  }
  if (glow) return;
  // roof: terracotta tiles + eave
  rc(g, -10, -10, Wp + 20, 0.5 * M, "#c0603c", 5); for (let x = 0; x < Wp; x += 36) { g.fillStyle = (x / 36) % 2 ? "rgba(255,200,150,0.25)" : "rgba(80,20,20,0.18)"; g.fillRect(x, 0, 36, 0.5 * M - 10); }
  rc(g, -10, 0.5 * M - 12, Wp + 20, 30, o.trim, 5); g.fillStyle = "rgba(30,15,40,0.2)"; g.fillRect(0, 0.5 * M + 18, Wp, 26);
  // ground floor
  rc(g, -10, Y(GF) - 14, Wp + 20, 28, o.trim, 5);
  if (o.ground === "arch") { const n = Math.max(1, Math.round(wm / 3)), aw = Wp / n; for (let i = 0; i < n; i++) { const x = i * aw + aw * 0.14, w = aw * 0.72; g.beginPath(); g.moveTo(x, Hp); g.lineTo(x, Y(1.9)); g.arc(x + w / 2, Y(1.9), w / 2, Math.PI, 0); g.lineTo(x + w, Hp); g.closePath(); g.fillStyle = "#2a2434"; g.fill(); g.lineWidth = 7; g.strokeStyle = INKC; g.stroke();
      rc(g, x + w * 0.2, Y(2.0), w * 0.6, 2.0 * M, i % 2 ? o.door : "#3a3044", 5); if (i % 2) { rc(g, x + w * 0.27, Y(1.8), w * 0.2, 0.8 * M, null, 3.5); rc(g, x + w * 0.53, Y(1.8), w * 0.2, 0.8 * M, null, 3.5); } else for (let q = 1; q < 9; q++) ln(g, [[x + w * 0.2 + 6, Y(2.0) + q * 2.0 * M / 9], [x + w * 0.8 - 6, Y(2.0) + q * 2.0 * M / 9]], 3, "rgba(255,255,255,0.12)"); } }
  else if (o.ground === "shop") { const n = Math.max(1, Math.round(wm / 3.2)), sw = Wp / n; for (let i = 0; i < n; i++) { const x = i * sw + sw * 0.12, w = sw * 0.76;
      if (i % 2) { rc(g, x + w * 0.2, Y(2.6), w * 0.6, 2.6 * M, o.door, 6); rc(g, x + w * 0.27, Y(2.35), w * 0.46, 0.9 * M, "#2b3a5e", 4, 4); rc(g, x + w * 0.27, Y(1.3), w * 0.46, 1.05 * M, null, 4, 4); el(g, x + w * 0.72, Y(1.3), 10, 10, "#d9a53a", 3); }
      else { rc(g, x, Y(2.7), w, 1.9 * M, "#2b3a5e", 6); g.fillStyle = "rgba(190,220,240,0.3)"; g.fillRect(x + 8, Y(2.7) + 8, w * 0.4, 1.9 * M - 16); rc(g, x - 16, Y(3.15), w + 32, 0.42 * M, ["#3f8a4a", "#b8402e", "#2f5f9a"][i % 3], 5); for (let q = 0; q < 4; q++) el(g, x + 60 + q * (w - 120) / 3, Y(0.95), 34, 30, ["#f29a2e", "#e9d43c", "#d9463f", "#57a05a"][q], 4); rc(g, x, Y(0.8), w, 0.8 * M, o.trim, 5); } } }
  else { // the pulpería: wide dark doorway with strings of peppers, a shuttered window, a blackboard
    const dx = Wp * 0.5 - 1.0 * M; rc(g, dx, Y(2.7), 2.0 * M, 2.7 * M, "#2a2028", 7); rc(g, dx - 20, Y(2.86), 2.0 * M + 40, 30, "#8a5a34", 5);
    for (const [x, n] of [[dx + 50, 6], [dx + 2.0 * M - 50, 5]]) for (let k = 0; k < n; k++) el(g, x + (k % 2 ? 8 : -8), Y(2.6) + k * 36, 16, 22, k % 3 ? "#d0342e" : "#e9b93c", 3.5);
    for (const wx of [Wp * 0.17, Wp * 0.83]) { rc(g, wx - 0.75 * M, Y(2.5), 1.5 * M, 1.5 * M, "#2b3a5e", 6); for (const sd of [-1, 1]) { rc(g, wx + sd * 1.1 * M - 0.35 * M, Y(2.5), 0.7 * M, 1.5 * M, o.door, 5); for (let k = 1; k < 9; k++) ln(g, [[wx + sd * 1.1 * M - 0.35 * M + 8, Y(2.5) + k * 1.5 * M / 9], [wx + sd * 1.1 * M + 0.35 * M - 8, Y(2.5) + k * 1.5 * M / 9]], 2.5, "rgba(20,10,30,0.45)"); } rc(g, wx - 0.85 * M, Y(1.0), 1.7 * M, 24, "#b8b2a8", 5); ln(g, [[wx, Y(2.5)], [wx, Y(1.0)]], 5); }
  }
  rc(g, -10, Hp - 60, Wp + 20, 70, "#77717c", 5);
} });

export const PAINT3: Record<string, Painter> = {
  // plaza ground: big granite slabs, 4 m tile
  granite: { w: 1024, h: 1024, draw: (g, r) => {
    g.fillStyle = "#b7b0a6"; g.fillRect(0, 0, 1024, 1024); mottle(g, r, 0, 0, 1024, 1024, 60, ["#d2ccc2", "#9c958e", "#a9a2a8"], 30, 120, 0.3);
    for (let row = 0; row < 4; row++) { let x = -(row % 2) * 128 - r() * 60; while (x < 1024) { const w = 190 + r() * 130; g.fillStyle = `rgba(${r() < 0.5 ? "255,255,255" : "50,40,70"},${0.05 + r() * 0.07})`; g.fillRect(x, row * 256, w, 256); g.strokeStyle = "rgba(60,50,70,0.5)"; g.lineWidth = 5; g.strokeRect(x, row * 256, w, 256); x += w; } }
    for (let i = 0; i < 500; i++) { g.fillStyle = r() < 0.5 ? "rgba(255,255,255,0.3)" : "rgba(40,30,50,0.25)"; g.fillRect(r() * 1024, r() * 1024, 3, 3); }
  } },
  awningG: { w: 256, h: 256, draw: (g) => { for (let i = 0; i < 4; i++) { g.fillStyle = i % 2 ? "#fbf8f0" : "#2f6fb8"; g.fillRect(i * 64, 0, 64, 256); } g.strokeStyle = "rgba(36,23,38,0.35)"; g.lineWidth = 3; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, 256); g.stroke(); } } },
  woodTop: { w: 512, h: 512, draw: (g, r) => { g.fillStyle = "#b9824e"; g.fillRect(0, 0, 512, 512); for (let i = 0; i < 4; i++) { g.fillStyle = `rgba(${i % 2 ? "255,220,170" : "70,30,10"},0.12)`; g.fillRect(0, i * 128, 512, 128); ln(g, [[0, i * 128], [512, i * 128]], 5, "rgba(50,25,20,0.6)"); for (let k = 0; k < 5; k++) { const y = i * 128 + 16 + r() * 96; ln(g, [[r() * 200, y], [200 + r() * 300, y + r() * 10 - 5]], 2.5, "rgba(70,35,15,0.3)"); } } } },
  // festival bunting strip (no text): alternating pennants
  pennants: { w: 2048, h: 160, draw: (g) => { g.clearRect(0, 0, 2048, 160); ln(g, [[0, 10], [2048, 10]], 6); const C = ["#d0342e", "#f6c419", "#2f6fb8", "#fbf8f0", "#57a05a", "#f29a2e"]; for (let i = 0; i < 16; i++) pg(g, [[i * 128 + 10, 12], [i * 128 + 118, 12], [i * 128 + 64, 150]], C[i % 6], 5); } },
  pennantsES: { w: 2048, h: 160, draw: (g) => { g.clearRect(0, 0, 2048, 160); ln(g, [[0, 10], [2048, 10]], 6); for (let i = 0; i < 16; i++) { const x = i * 128 + 12; rc(g, x, 12, 104, 30, "#c8102e", 0); rc(g, x, 42, 104, 60, "#f6c419", 0); rc(g, x, 102, 104, 30, "#c8102e", 0); rc(g, x, 12, 104, 120, null, 5); } } },
  // the tank's painted back: 6.8 m x 3.4 m at 400 px/m
  tankBack: { w: 2720, h: 1360, draw: (g, r) => {
    const gr = g.createLinearGradient(0, 0, 0, 1360); gr.addColorStop(0, "#7fe6f2"); gr.addColorStop(0.45, "#2fa6dc"); gr.addColorStop(1, "#135a9e"); g.fillStyle = gr; g.fillRect(0, 0, 2720, 1360);
    for (let i = 0; i < 9; i++) { const x = 100 + i * 300 + r() * 80, w = 60 + r() * 90; const rg = g.createLinearGradient(0, 0, 0, 1100); rg.addColorStop(0, "rgba(230,255,255,0.4)"); rg.addColorStop(1, "rgba(230,255,255,0)"); g.fillStyle = rg; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + w, 0); g.lineTo(x + w + 220, 1100); g.lineTo(x + 120, 1100); g.closePath(); g.fill(); }
    // far rocks
    g.fillStyle = "rgba(20,70,130,0.55)"; g.beginPath(); g.moveTo(0, 1360); g.lineTo(0, 900); g.lineTo(240, 700); g.lineTo(520, 820); g.lineTo(700, 1040); g.lineTo(1200, 1120); g.lineTo(1700, 1040); g.lineTo(2000, 760); g.lineTo(2300, 640); g.lineTo(2720, 860); g.lineTo(2720, 1360); g.closePath(); g.fill();
    // corals + weeds
    const coral = (x: number, y: number, k: number, col: string) => { for (let i = 0; i < 5; i++) { const a = -1.2 + i * 0.6, x1 = x + Math.sin(a) * 150 * k, y1 = y - Math.cos(a) * 190 * k; ln(g, [[x, y], [(x + x1) / 2 + 20 * k, (y + y1) / 2], [x1, y1]], 44 * k, INKC); ln(g, [[x, y], [(x + x1) / 2 + 20 * k, (y + y1) / 2], [x1, y1]], 30 * k, col); el(g, x1, y1, 24 * k, 24 * k, col, 6); } };
    coral(330, 1240, 1.2, "#f27a9a"); coral(2380, 1230, 1.4, "#f29a4a"); coral(1800, 1290, 0.8, "#c98af0"); coral(900, 1300, 0.7, "#f2c64a");
    for (let i = 0; i < 9; i++) { const x = 80 + r() * 2560, h = 260 + r() * 300; ln(g, [[x, 1330], [x + 40, 1330 - h * 0.5], [x - 20, 1330 - h]], 32, INKC); ln(g, [[x, 1330], [x + 40, 1330 - h * 0.5], [x - 20, 1330 - h]], 20, r() < 0.5 ? "#2f9a6a" : "#57b05a"); }
    for (let i = 0; i < 7; i++) { const x = 200 + r() * 2300, y = 180 + r() * 500, s = 1 + r(); g.fillStyle = "rgba(20,60,120,0.4)"; g.beginPath(); g.ellipse(x, y, 46 * s, 20 * s, 0, 0, 7); g.fill(); g.beginPath(); g.moveTo(x + 40 * s, y); g.lineTo(x + 76 * s, y - 22 * s); g.lineTo(x + 76 * s, y + 22 * s); g.closePath(); g.fill(); }
    const sg = g.createLinearGradient(0, 1250, 0, 1360); sg.addColorStop(0, "rgba(234,217,166,0)"); sg.addColorStop(1, "rgba(234,217,166,1)"); g.fillStyle = sg; g.fillRect(0, 1250, 2720, 110);
  } },
  // hall floor: dark glossy tiles (2 m tile)
  aquaFloor: { w: 512, h: 512, draw: (g, r) => { g.fillStyle = "#24345c"; g.fillRect(0, 0, 512, 512); for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) { g.fillStyle = (x + y) % 2 ? "rgba(120,200,230,0.1)" : "rgba(0,0,20,0.14)"; g.fillRect(x * 256, y * 256, 256, 256); g.strokeStyle = "rgba(10,10,30,0.6)"; g.lineWidth = 5; g.strokeRect(x * 256, y * 256, 256, 256); } mottle(g, r, 0, 0, 512, 512, 14, ["#5fd0e8", "#101830"], 30, 110, 0.12); } },
  // hall wall: deep blue with a wave band and round portholes of glowing water (4 m x 4.2 m)
  aquaWall: { w: 800, h: 840, draw: (g, r) => {
    g.fillStyle = "#1c2f5c"; g.fillRect(0, 0, 800, 840); mottle(g, r, 0, 0, 800, 840, 20, ["#2a4480", "#131f40"], 60, 200, 0.25);
    g.beginPath(); g.moveTo(0, 700); for (let x = 0; x <= 800; x += 20) g.lineTo(x, 690 + 16 * Math.sin(x / 800 * Math.PI * 8)); g.lineTo(800, 840); g.lineTo(0, 840); g.closePath(); g.fillStyle = "#27b0a6"; g.fill(); g.lineWidth = 6; g.strokeStyle = INKC; g.stroke();
    for (const [x, y, rr] of [[220, 330, 120], [590, 420, 90]]) { el(g, x, y, rr + 18, rr + 18, "#d9a53a", 7); const gg = g.createRadialGradient(x - rr * 0.3, y - rr * 0.3, 10, x, y, rr); gg.addColorStop(0, "#9ff0f6"); gg.addColorStop(1, "#1f86c8"); el(g, x, y, rr, rr, gg, 6); g.fillStyle = "#f29a4a"; g.beginPath(); g.ellipse(x + 10, y + 10, rr * 0.3, rr * 0.14, 0, 0, 7); g.fill(); g.beginPath(); g.moveTo(x + 10 + rr * 0.26, y + 10); g.lineTo(x + 10 + rr * 0.5, y + 10 - rr * 0.16); g.lineTo(x + 10 + rr * 0.5, y + 10 + rr * 0.16); g.closePath(); g.fill(); for (let i = 0; i < 4; i++) { const a = i * 1.57; el(g, x + (rr + 9) * Math.cos(a + 0.78), y + (rr + 9) * Math.sin(a + 0.78), 5, 5, "#8a6a2a", 0); } }
  } },
  // board over the tank: waves and three fish, no text (3.2 m x 0.56 m)
  aquaSign: { w: 1280, h: 224, draw: (g) => { rc(g, 6, 6, 1268, 212, "#f2c64a", 10, 30); for (let i = 0; i < 3; i++) { const x = 330 + i * 300, y = 112; g.fillStyle = ["#2f6fb8", "#e2453c", "#27b0a6"][i]; g.beginPath(); g.ellipse(x, y, 80, 42, 0, 0, 7); g.fill(); g.lineWidth = 7; g.strokeStyle = INKC; g.stroke(); pg(g, [[x + 70, y], [x + 130, y - 46], [x + 130, y + 46]], ["#2f6fb8", "#e2453c", "#27b0a6"][i], 7); el(g, x - 40, y - 10, 10, 10, "#ffffff", 4); } ln(g, [[60, 150], [110, 120], [160, 150], [210, 120]], 10, "#2f6fb8"); ln(g, [[1070, 150], [1120, 120], [1170, 150], [1220, 120]], 10, "#2f6fb8"); } },
};
