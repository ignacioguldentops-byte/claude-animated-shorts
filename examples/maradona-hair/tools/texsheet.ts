import { PAINT, facadePainter } from "../src/h/paint2";
import { rng } from "../src/h/paint";
(window as any).tex = (name: string, k: number) => {
  const P = name.startsWith("facade") ? facadePainter(8, 14, { wall: "#e6a56a", lite: "#f6cf9a", dark: "#b9743e", shutter: "#3f7a5a", shop: 0, seed: 3 }, name.endsWith("G")) : PAINT[name];
  const cv = document.createElement("canvas"); cv.width = P.w; cv.height = P.h; P.draw(cv.getContext("2d")!, rng(7));
  const o = document.createElement("canvas"); o.width = Math.round(P.w * k); o.height = Math.round(P.h * k); const g = o.getContext("2d")!; g.fillStyle = "#555"; g.fillRect(0, 0, o.width, o.height); g.drawImage(cv, 0, 0, o.width, o.height);
  return o.toDataURL("image/jpeg", 0.88);
};
