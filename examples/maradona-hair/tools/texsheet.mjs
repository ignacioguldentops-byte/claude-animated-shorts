import { build } from "esbuild"; import { createRequire } from 'module'; const { chromium } = createRequire('/opt/node-tools/node_modules/playwright/index.js')('/opt/node-tools/node_modules/playwright/index.js'); import fs from "fs";
const [out, itemsJson, k = "0.8"] = process.argv.slice(2);
await build({ entryPoints: ["tools/texsheet.ts"], bundle: true, outfile: "out/texsheet.js", format: "iife", logLevel: "error" });
const b = await chromium.launch(); const pg = await b.newPage();
await pg.setContent("<html><body></body></html>"); await pg.addScriptTag({ path: "out/texsheet.js" });
const url = await pg.evaluate(([it, kk]) => window.tex(it, Number(kk)), [itemsJson, k]);
fs.writeFileSync(out, Buffer.from(url.split(",")[1], "base64")); await b.close();
