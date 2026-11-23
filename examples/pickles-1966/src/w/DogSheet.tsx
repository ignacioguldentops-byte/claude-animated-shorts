import React, { useLayoutEffect, useRef } from "react";
import { AbsoluteFill } from "remotion";
import { Pen } from "./toon";
import { inkOutline } from "./outline";
import { drawDog, DogPose } from "./dog";
const cells: DogPose[] = [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875].map((ph) => ({ mode: "walk", phase: ph, facing: 1 } as DogPose))
  .concat([{ mode: "sniff", phase: 0.1, facing: 1 }, { mode: "sniff", phase: 0.3, facing: -1 }, { mode: "dig", phase: 0.1 }, { mode: "dig", phase: 0.3 }, { mode: "sit", facing: 1 }, { mode: "beg", facing: 1 }, { mode: "stand", facing: 1, alert: true }, { mode: "sit", facing: 0 }, { mode: "beg", facing: 0 }, { mode: "walk", phase: 0.3, facing: -1 }]);
export const DogSheet: React.FC = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => { const cv = ref.current!, g = cv.getContext("2d")!; g.fillStyle = "#cfd8c4"; g.fillRect(0, 0, 1080, 1920);
    const k = 0.45, cw = 270, chh = 330;
    cells.forEach((o, i) => { const c = document.createElement("canvas"); c.width = 600 * k; c.height = 1000 * k; const cg = c.getContext("2d")!; cg.setTransform(k, 0, 0, k, 0, 0); drawDog(new Pen(cg), o); inkOutline(c, 4.2 * k);
      const x = (i % 4) * cw, y = Math.floor(i / 4) * chh; g.fillStyle = i % 2 ? "#d8e0cc" : "#c8d2bc"; g.fillRect(x, y, cw, chh); g.drawImage(c, 0, 1000 * k * 0.45, 600 * k, 1000 * k * 0.55, x, y + 20, cw, cw * 0.55 / 0.6 * 1.0); }); }, []);
  return <AbsoluteFill><canvas ref={ref} width={1080} height={1920} /></AbsoluteFill>;
};
