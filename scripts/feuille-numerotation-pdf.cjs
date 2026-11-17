/**
 * PDF vectoriel 1:1 (540 x 540 mm) depuis le SVG de scripts/feuille-numerotation.py.
 * Usage : node scripts/feuille-numerotation-pdf.cjs DOSSIER
 */
const { chromium } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");

(async () => {
  const dir = process.argv[2];
  const size = 540;
  const svg = fs.readFileSync(path.join(dir, "feuille-numerotation-50x50.svg"), "utf-8");
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>@page{size:${size}mm ${size}mm;margin:0}html,body{margin:0;padding:0}svg{display:block}</style></head><body>${svg}</body></html>`);
  await p.pdf({ path: path.join(dir, "feuille-numerotation-50x50.pdf"), width: `${size}mm`, height: `${size}mm`, printBackground: true, pageRanges: "1" });
  await b.close();
  console.log("pdf ok");
})();
