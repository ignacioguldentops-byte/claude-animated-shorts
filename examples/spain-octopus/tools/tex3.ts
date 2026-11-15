import { PAINT3, housePainter } from "../src/p/paint3";
import { rng } from "../src/p/paint";
(window as any).tex = (names: string[], k: number) => {
  const P = names.map((name) => name.startsWith("house") ? housePainter(8.5, 9.5, [{ stone: true, wall: "#b9b3a8", trim: "#d8d2c6", door: "#2f6f5a", gallery: 1, ground: "pulpo" as const, seed: 3 }, { stone: false, wall: "#f1ede4", trim: "#aaa39a", door: "#7a2f2a", gallery: 0, ground: "arch" as const, seed: 5 }, { stone: true, wall: "#c4b9a4", trim: "#e2dccf", door: "#2f4f8a", gallery: 2, ground: "shop" as const, seed: 8 }][Number(name[5])], name.endsWith("G")) : PAINT3[name]);
  const H = Math.max(...P.map((p) => p.h)), W = P.reduce((s, p) => s + p.w + 20, 0);
  const o = document.createElement("canvas"); o.width = Math.round(W * k); o.height = Math.round(H * k); const g = o.getContext("2d")!; g.fillStyle = "#555"; g.fillRect(0, 0, o.width, o.height);
  let x = 0; for (const p of P) { const cv = document.createElement("canvas"); cv.width = p.w; cv.height = p.h; p.draw(cv.getContext("2d")!, rng(7)); g.drawImage(cv, x * k, 0, p.w * k, p.h * k); x += p.w + 20; }
  return o.toDataURL("image/jpeg", 0.88);
};
