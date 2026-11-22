// Look-development sheet for the cast: run cycles (side and front), the whole cast, expressions.
import React, { useLayoutEffect, useRef } from "react";
import { AbsoluteFill } from "remotion";
import { Pen, figure, Char, Pose } from "./toon";
import { inkOutline } from "./outline";
import * as C from "./castg";
type Cell = [Char, Pose];
const L = -2.0;
const rows: Cell[][] = [
  [0, 1, 2, 3, 4, 5].map((i) => [C.MESSENGER, { legs: "run", facing: 1, phase: i / 6, expr: "determined", sweat: 1 }]),
  [[C.MESSENGER, { legs: "run", facing: 0, phase: 0, expr: "pant" }], [C.MESSENGER, { legs: "run", facing: 0, phase: 0.25, expr: "pant" }], [C.MESSENGER, { legs: "run", facing: 0, phase: 0.5, expr: "pant" }],
    [C.MESSENGER, { legs: "run", facing: -1, phase: 0.3, expr: "proud", armL: "up", armR: "up" }], [C.hoplite(0), { legs: "walk", facing: 1, phase: 0.2, expr: "grin", armR: "hang", holdR: "spear", armL: "front", holdL: "shield" }], [C.hoplite(1), { legs: "walk", facing: -1, phase: 0.7, expr: "stern" }]],
  [[C.hoplite(2), { expr: "laugh", armR: "up", holdR: "spear", armL: "front", holdL: "shield" }], [C.hoplite(3), { expr: "proud", armL: "up", armR: "up" }], [C.persian(0), { expr: "angry", armL: "point" }], [C.persian(1), { expr: "shock", facing: 1 }], [C.HISTORIAN, { expr: "stern", armR: [50, 34, 6], holdR: "scroll", armL: "chin" }], [C.athenian(1), { expr: "shock", armL: "up", armR: "up" }]],
  [[C.LINGUIST, { expr: "proud", armR: [54, 30, 6], holdR: "cupS", armL: "hip" }], [C.WATERMAN, { expr: "laugh", armR: "eat", holdR: "glass" }], [C.runner96(0), { legs: "run", facing: 1, phase: 0.1, expr: "pained" }], [C.runner96(1), { legs: "run", facing: -1, phase: 0.6, expr: "pant" }], [C.greek(0), { expr: "laugh", armR: "up", holdR: "flagGR" }], [C.TAVERNER, { expr: "grin", armR: "front", holdR: "jug" }]],
  [[C.officer(0), { legs: "run", facing: 1, phase: 0.4, expr: "laugh" }], [C.STARTER, { expr: "determined", armR: "up", holdR: "pistol" }], [C.RUNNER08, { legs: "run", facing: 1, phase: 0.8, expr: "pant", sweat: 2 }], [C.steward(0), { expr: "nervous", armL: "point" }], [C.QUEEN, { expr: "smile", armR: "wave" }], [C.gent08(1), { expr: "grin", armR: "up", holdR: "hatW" }]],
  [[C.athenian(0), { expr: "laugh" }], [C.athenian(4), { expr: "grin", armR: "wave" }], [C.greek(2), { expr: "smile_closed", armL: "up", holdL: "hatW" }], [C.greek(1), { expr: "shock" }], [C.lady08(0), { expr: "laugh", armR: "wave" }], [C.runner96(3), { legs: "walk", facing: 1, phase: 0.3, expr: "neutral" }]],
];
export const Sheet: React.FC = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const cv = ref.current!, g = cv.getContext("2d")!; g.fillStyle = "#cfd8c4"; g.fillRect(0, 0, 1080, 1920);
    const k = 0.3, cw = 180, chh = 300;
    rows.forEach((row, r) => row.forEach(([ch, pose], i) => {
      const o = document.createElement("canvas"); o.width = 600 * k; o.height = 1000 * k; const og = o.getContext("2d")!; og.setTransform(k, 0, 0, k, 0, 0);
      figure(new Pen(og), ch, { light: L, seed: 7 + i + r * 10, ...pose }); inkOutline(o, 4.2 * k);
      g.fillStyle = (r + i) % 2 ? "#d8e0cc" : "#c8d2bc"; g.fillRect(i * cw, r * 320, cw, 320); g.drawImage(o, i * cw, r * 320 + 10, cw, chh);
    }));
  }, []);
  return <AbsoluteFill><canvas ref={ref} width={1080} height={1920} /></AbsoluteFill>;
};
