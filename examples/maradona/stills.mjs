import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import fs from "fs";
const [out, frames, scale = "0.5"] = process.argv.slice(2);
const B = fs.readFileSync(".env.sh", "utf8").split("=")[1].trim();
const serveUrl = await bundle({ entryPoint: "src/index.tsx" });
const comp = await selectComposition({ serveUrl, id: "MaradonaShort", browserExecutable: B, chromiumOptions: { gl: "swangle" } });
for (const f of frames.split(",").map(Number)) {
  await renderStill({ serveUrl, composition: comp, frame: f, output: `${out}${f}.jpg`, imageFormat: "jpeg", jpegQuality: 85, scale: Number(scale), browserExecutable: B, chromiumOptions: { gl: "swangle" } });
  console.log("ok", f);
}
