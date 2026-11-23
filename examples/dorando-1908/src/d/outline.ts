// Bold outer ink line round every character card: the silhouette (alpha) is tinted ink and stamped round the figure
// under it, so arms, legs, hats and props get one continuous caricature contour whatever was drawn inside.
let tmp: HTMLCanvasElement | null = null;
export const INK_OUT = "#241726";
export const inkOutline = (cv: HTMLCanvasElement, px: number) => {
  if (px < 0.6) return;
  const w = cv.width, h = cv.height;
  if (!tmp) tmp = document.createElement("canvas");
  if (tmp.width !== w || tmp.height !== h) { tmp.width = w; tmp.height = h; }
  const t = tmp.getContext("2d")!, g = cv.getContext("2d")!;
  t.setTransform(1, 0, 0, 1, 0, 0); t.globalCompositeOperation = "source-over"; t.clearRect(0, 0, w, h); t.drawImage(cv, 0, 0);
  t.globalCompositeOperation = "source-in"; t.fillStyle = INK_OUT; t.fillRect(0, 0, w, h); t.globalCompositeOperation = "source-over";
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = "destination-over";
  const n = px > 6 ? 16 : 12;
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; g.drawImage(tmp, Math.round(px * Math.cos(a)), Math.round(px * Math.sin(a))); }
  g.restore();
};
