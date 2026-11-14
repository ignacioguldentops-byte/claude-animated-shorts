import { Pen, figure, Pose, Char } from "../src/h/toon";
import * as C from "../src/h/cast";
(window as any).sheet = (items: [string, Pose][], k = 0.8) => {
  const cv = document.createElement("canvas"); cv.width = Math.round(items.length * 600 * k); cv.height = Math.round(1000 * k);
  const g = cv.getContext("2d")!; g.fillStyle = "#7aa7d8"; g.fillRect(0, 0, cv.width, cv.height); g.fillStyle = "#5c9a4a"; g.fillRect(0, 960 * k, cv.width, 60);
  items.forEach(([name, pose], i) => {
    g.setTransform(k, 0, 0, k, i * 600 * k, 0);
    const c: Char = name.startsWith("folk") ? C.folk(Number(name.slice(4)), name.endsWith("f")) : (C as any)[name];
    figure(new Pen(g), c, { seed: i + 2, ...pose });
  });
  return cv.toDataURL("image/jpeg", 0.9);
};
