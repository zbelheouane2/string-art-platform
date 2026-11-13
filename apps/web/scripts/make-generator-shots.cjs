/**
 * Captures des écrans DeeKra pour le carrousel « Comment fonctionne notre
 * générateur » (page du kit), dans chaque langue. Nécessite le site
 * (BASE_URL, défaut http://localhost:3000), la base et le moteur.
 *
 *   node scripts/make-generator-shots.cjs
 *
 * Sortie : public/visuels/generateur/<étape>-<langue>.png (converties en
 * WebP ensuite par scripts/to-webp.py).
 */
const { chromium } = require("playwright");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const OUT = path.join(__dirname, "../public/visuels/generateur");
const HIDE = "nextjs-portal{display:none!important}";

function freshCode() {
  const out = path.join(require("node:os").tmpdir(), `code-${Date.now()}.csv`);
  execFileSync("npx", ["tsx", "scripts/create-codes.ts", "--count", "1", "--batch", `visuels-${Date.now()}`, "--out", out]);
  return fs.readFileSync(out, "utf-8").trim().split("\n")[1];
}

(async () => {
  const browser = await chromium.launch();
  for (const locale of ["fr", "en", "ar"]) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: "reduce" });
    const page = await ctx.newPage();
    const shot = async (name) => {
      await page.addStyleTag({ content: HIDE });
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(OUT, `${name}-${locale}.png`) });
    };

    await page.goto(`${BASE}/${locale}`);
    await shot("site");

    const code = freshCode();
    await page.goto(`${BASE}/${locale}/activer`);
    await page.locator("#code").fill(code);
    await shot("code");
    await page.locator("form button[type=submit]").click();
    await page.waitForURL(/\/creer$/);

    await page.locator('input[type="file"]').setInputFiles(path.join(__dirname, "../public/visuels/caftan-photo.webp"));
    await page.locator(".studio-step").first().scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollTo(0, document.querySelector(".studio")?.getBoundingClientRect().top + window.scrollY - 70));
    await shot("photo");

    await page.locator(".studio-actions button").click();
    await page.locator(".studio-result").waitFor({ timeout: 90000 });
    await page.evaluate(() => window.scrollTo(0, document.querySelector(".studio-result")?.getBoundingClientRect().top + window.scrollY - 70));
    await shot("preview");

    await page.goto(`${BASE}/${locale}/guide/demo`);
    await page.evaluate(() => localStorage.setItem("dk-guide:demo", JSON.stringify({ step: 1240, secondsPerStep: 7, voice: true })));
    await page.reload();
    await page.evaluate(() => window.scrollTo(0, document.querySelector(".guide-board")?.getBoundingClientRect().top + window.scrollY - 70));
    await shot("voice");
    await ctx.close();
  }
  await browser.close();
})();
