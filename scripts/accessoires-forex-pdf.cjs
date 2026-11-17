/**
 * PDF vectoriels 1:1 depuis les SVG de scripts/accessoires-forex.py (un par SVG, taille lue dans le SVG).
 * Usage : node scripts/accessoires-forex-pdf.cjs DOSSIER
 */
const { chromium } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");

function svgs(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? svgs(path.join(dir, e.name)) : e.name.endsWith(".svg") ? [path.join(dir, e.name)] : []);
}

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  for (const file of svgs(process.argv[2])) {
    const svg = fs.readFileSync(file, "utf-8");
    const [, w, h] = /width="([\d.]+)mm" height="([\d.]+)mm"/.exec(svg);
    await p.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>@page{size:${w}mm ${h}mm;margin:0}html,body{margin:0;padding:0}svg{display:block}</style></head><body>${svg}</body></html>`);
    await p.pdf({ path: file.replace(/\.svg$/, ".pdf"), width: `${w}mm`, height: `${h}mm`, printBackground: true, pageRanges: "1" });
  }
  await b.close();
  console.log("pdf ok");
})();
