import { Pen } from "../src/p/toon";
import * as A from "../src/p/paul";
import * as B from "../src/p/props";
(window as any).sheet = (items: [string, any[], number, number][], k = 0.5) => {
  const W = items.reduce((s, it) => s + it[2] + 20, 0), H = Math.max(...items.map((it) => it[3]));
  const cv = document.createElement("canvas"); cv.width = Math.round(W * k); cv.height = Math.round(H * k);
  const g = cv.getContext("2d")!; g.fillStyle = "#3f8fc9"; g.fillRect(0, 0, cv.width, cv.height);
  let x = 0;
  for (const [name, args, w] of items) { g.setTransform(k, 0, 0, k, x * k, 0); ((A as any)[name] ?? (B as any)[name])(new Pen(g), ...args); x += w + 20; }
  return cv.toDataURL("image/jpeg", 0.9);
};
