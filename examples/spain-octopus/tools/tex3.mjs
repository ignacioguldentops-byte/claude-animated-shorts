import { build } from "esbuild"; import { createRequire } from 'module'; const { chromium } = createRequire('/opt/node-tools/node_modules/playwright/index.js')('/opt/node-tools/node_modules/playwright/index.js'); import fs from "fs";
const [out, names, k = "0.3"] = process.argv.slice(2);
await build({ entryPoints: ["tools/tex3.ts"], bundle: true, outfile: "out/tex3.js", format: "iife", logLevel: "error" });
const b = await chromium.launch(); const pg = await b.newPage();
await pg.setContent("<html><body></body></html>"); await pg.addScriptTag({ path: "out/tex3.js" });
const url = await pg.evaluate(([n, kk]) => window.tex(n.split(","), Number(kk)), [names, k]);
fs.writeFileSync(out, Buffer.from(url.split(",")[1], "base64")); await b.close();
