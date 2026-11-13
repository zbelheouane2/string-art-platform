/**
 * PDF vectoriel à l'échelle 1:1 depuis les SVG de scripts/planche-impression.py.
 * Usage : node scripts/planche-impression-pdf.cjs DOSSIER
 */
const { chromium } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");

(async () => {
  const dir = process.argv[2];
  const b = await chromium.launch();
  const p = await b.newPage();
  for (const [svgName, size] of [["planche-50x50-impression.svg", 520], ["planche-50x50-coupe.svg", 500]]) {
    const svg = fs.readFileSync(path.join(dir, svgName), "utf-8");
    await p.setContent(`<!doctype html><html><head><style>@page{size:${size}mm ${size}mm;margin:0}html,body{margin:0;padding:0}svg{display:block}</style></head><body>${svg}</body></html>`);
    await p.pdf({ path: path.join(dir, svgName.replace(".svg", ".pdf")), width: `${size}mm`, height: `${size}mm`, printBackground: true, pageRanges: "1" });
  }
  await b.close();
  console.log("pdf ok");
})();
