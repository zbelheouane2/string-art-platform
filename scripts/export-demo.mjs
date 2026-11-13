// Exporte une démo HTML hors ligne du site (à ouvrir par double-clic).
// Prérequis : le site tourne sur http://localhost:3000 (npm run build && npm start dans apps/web).
// Usage : node scripts/export-demo.mjs <dossier-de-sortie>
import { createRequire } from "node:module";
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
const web = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../apps/web");
const { chromium } = require(path.join(web, "node_modules/playwright"));
const BASE = "http://localhost:3000";
const out = path.resolve(process.argv[2] ?? "demo-html");

const PAGES = [
  ["/fr", "index.html", "fr"], ["/fr/kit", "kit.html", "fr"],
  ["/en", "en.html", "en"], ["/en/kit", "en-kit.html", "en"],
  ["/ar", "ar.html", "ar"], ["/ar/kit", "ar-kit.html", "ar"],
];
const FILE_OF = Object.fromEntries(PAGES.map(([p, f]) => [p, f]));
const demo = readFileSync(path.join(web, "public/demo/portrait-demo.json"), "utf-8");
const msgs = Object.fromEntries(["fr", "en", "ar"].map((l) => [l, JSON.parse(readFileSync(path.join(web, `messages/${l}.json`), "utf-8"))]));

mkdirSync(path.join(out, "assets/media"), { recursive: true });
cpSync(path.join(web, "public/visuels"), path.join(out, "visuels"), { recursive: true });
for (const f of readdirSync(path.join(web, ".next/static/media"))) cpSync(path.join(web, ".next/static/media", f), path.join(out, "assets/media", f));

const runtime = (locale) => `
(() => {
  const D = document, root = D.documentElement;
  root.classList.add("js");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const T = ${JSON.stringify(msgs[locale].hero)};
  const nf = new Intl.NumberFormat(${JSON.stringify(locale)});
  const fill = (s, v) => s.replace(/\\{(\\w+)\\}/g, (_, k) => v[k]);

  // Apparitions au défilement
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
  D.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));

  // Menu latéral
  const burger = D.querySelector(".header-start .icon-btn"), drawer = D.getElementById("nav-drawer");
  const ICON_MENU = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
  const ICON_CLOSE = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  if (burger && drawer) {
    const set = (open) => { drawer.hidden = !open; burger.setAttribute("aria-expanded", open); burger.innerHTML = open ? ICON_CLOSE : ICON_MENU; };
    set(false);
    burger.addEventListener("click", () => set(drawer.hidden));
    drawer.addEventListener("click", (e) => { if (e.target.closest("a")) set(false); });
    D.addEventListener("keydown", (e) => { if (e.key === "Escape") set(false); });
  }
  // Menu de langue : fermer au clic à côté
  D.addEventListener("click", (e) => D.querySelectorAll("details.lang-menu[open]").forEach((d) => { if (!d.contains(e.target)) d.open = false; }));

  // Avant / après
  D.querySelectorAll("figure.ba").forEach((fig) => {
    const r = fig.querySelector(".ba-range");
    const upd = () => fig.style.setProperty("--pos", r.value + "%");
    r.value = 50; upd();
    let touched = false;
    r.addEventListener("input", () => { touched = true; upd(); });
    if (fig.hasAttribute("data-ba-hint") && !reduce) {
      const io2 = new IntersectionObserver(([e]) => {
        if (!e.isIntersecting) return; io2.disconnect();
        const t0 = performance.now();
        const step = (now) => { if (touched) return; const k = Math.min(1, (now - t0) / 2400); r.value = 50 - 28 * Math.sin(k * Math.PI * 2); upd(); if (k < 1) requestAnimationFrame(step); else { r.value = 50; upd(); } };
        requestAnimationFrame(step);
      }, { threshold: 0.6 });
      io2.observe(fig);
    }
  });

  // Carrousel « Comment ça marche »
  D.querySelectorAll("[data-steps]").forEach((root) => {
    const tabs = [...root.querySelectorAll("[data-step-tab]")], slides = [...root.querySelectorAll("[data-step-slide]")];
    const panel = root.querySelector("[data-step-panel]"), count = root.querySelector(".steps-count"), toggle = root.querySelector("[data-steps-toggle]");
    const rtl = () => !!root.closest("[dir=rtl]");
    const n = tabs.length; let i = 0, user = false, off = true;
    const ICON_PAUSE = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M9 6v12M15 6v12"/></svg>';
    const ICON_PLAY = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z"/></svg>';
    const sync = () => { if (user || off) root.dataset.paused = "true"; else delete root.dataset.paused; };
    const go = (k, focus) => {
      i = (k + n) % n;
      tabs.forEach((t, j) => {
        const on = j === i; t.setAttribute("aria-selected", on); t.tabIndex = on ? 0 : -1;
        const bar = t.querySelector(".steps-bar"); bar.innerHTML = "";
        if (on) { const f = D.createElement("span"); f.className = "steps-fill"; f.addEventListener("animationend", () => go(i + 1)); bar.appendChild(f); }
      });
      slides.forEach((s, j) => { if (j === i) { s.dataset.active = "true"; s.removeAttribute("aria-hidden"); } else { delete s.dataset.active; s.setAttribute("aria-hidden", "true"); } });
      if (count) count.textContent = (i + 1) + " / " + n;
      const t = tabs[i];
      panel.setAttribute("aria-labelledby", t.id);
      panel.querySelector(".steps-num").textContent = t.dataset.num;
      const h = panel.querySelector("h3"), p = panel.querySelector("p:not(.steps-num)");
      const h2 = h.cloneNode(); h2.textContent = t.dataset.title; h.replaceWith(h2);
      const p2 = p.cloneNode(); p2.textContent = t.dataset.text; p.replaceWith(p2);
      if (focus) t.focus();
    };
    tabs.forEach((t, j) => t.addEventListener("click", () => go(j)));
    root.querySelector("[role=tablist]").addEventListener("keydown", (e) => {
      const fwd = rtl() ? "ArrowLeft" : "ArrowRight", back = rtl() ? "ArrowRight" : "ArrowLeft";
      if (e.key === fwd) go(i + 1, true); else if (e.key === back) go(i - 1, true); else if (e.key === "Home") go(0, true); else if (e.key === "End") go(n - 1, true); else return;
      e.preventDefault();
    });
    if (toggle) toggle.addEventListener("click", () => {
      user = !user; sync(); toggle.setAttribute("aria-pressed", user);
      toggle.setAttribute("aria-label", user ? toggle.dataset.play : toggle.dataset.pause); toggle.innerHTML = user ? ICON_PLAY : ICON_PAUSE;
    });
    const stage = root.querySelector(".steps-stage"); let x0 = null;
    stage.addEventListener("pointerdown", (e) => (x0 = e.clientX));
    stage.addEventListener("pointerup", (e) => { if (x0 === null) return; const dx = e.clientX - x0; x0 = null; if (Math.abs(dx) < 40) return; go(i + ((rtl() ? dx > 0 : dx < 0) ? 1 : -1)); });
    new IntersectionObserver(([e]) => { off = !e.isIntersecting; sync(); }, { threshold: 0.35 }).observe(root);
    go(0);
  });

  // Galerie qui glisse
  D.querySelectorAll(".gallery").forEach((g) => {
    const list = g.querySelector(".gallery-track"), slides = [...list.children], count = g.querySelector(".gallery-count"), thumbs = [...g.querySelectorAll(".gallery-thumbs button")];
    let i = 0;
    const show = (n) => { i = n; count.textContent = (n + 1) + " / " + slides.length; thumbs.forEach((t, k) => t.setAttribute("aria-current", k === n)); };
    const go = (k) => { const n = (k + slides.length) % slides.length; list.scrollTo({ left: slides[n].offsetLeft - list.offsetLeft, behavior: reduce ? "auto" : "smooth" }); show(n); };
    new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) show(slides.indexOf(e.target)); }), { root: list, threshold: 0.6 }).observe && slides.forEach((s) => new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) show(slides.indexOf(e.target)); }), { root: list, threshold: 0.6 }).observe(s));
    g.querySelector(".gallery-prev").addEventListener("click", () => go(i - 1));
    g.querySelector(".gallery-next").addEventListener("click", () => go(i + 1));
    thumbs.forEach((t, k) => t.addEventListener("click", () => go(k)));
    show(0);
  });

  // Barre d'achat collante
  const bar = D.querySelector(".sticky-bar"), watch = D.getElementById("hero-actions");
  if (bar && watch) {
    const vis = (v) => { bar.dataset.visible = v; bar.setAttribute("aria-hidden", !v); bar.inert = !v; };
    vis(false);
    new IntersectionObserver(([e]) => vis(!e.isIntersecting && e.boundingClientRect.top < 0)).observe(watch);
  }

  // Planche : vraie séquence du moteur, tissée fil après fil
  const DEMO = ${demo};
  const SECT = ["A", "B", "C", "D"], label = (n) => SECT[Math.floor(n / 60)] + ((n % 60) + 1);
  const P = { pause: '<path d="M9 6v12M15 6v12"/>', play: '<path d="M8 5.5v13l10-6.5z"/>', replay: '<path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4"/>' };
  const icon = (k) => '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + P[k] + "</svg>";
  D.querySelectorAll("figure.plaque").forEach((fig) => {
    const cv = fig.querySelector("canvas"), ctx = cv.getContext("2d"), st = fig.querySelector(".plaque-status strong"), seg = fig.querySelector(".plaque-status span"), btn = fig.querySelector(".plaque-bar .icon-btn");
    const total = DEMO.sequence.length - 1;
    let drawn = 0, playing = !reduce, raf = 0;
    const DPR = () => Math.min(Math.max(devicePixelRatio || 1, 2), 3);
    const geo = () => { const size = cv.getBoundingClientRect().width; return { size, r: size * 0.455, c: size / 2 }; };
    const reset = () => { const { size, r, c } = geo(), dpr = DPR(); cv.width = Math.round(size * dpr); cv.height = Math.round(size * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, size, size); ctx.fillStyle = "#a9803f"; const nr = Math.max(1, size / 420); for (const [x, y] of DEMO.nails) { ctx.beginPath(); ctx.arc(c + x * r, c + y * r, nr, 0, 7); ctx.fill(); } };
    const lines = (a, b) => { const { size, r, c } = geo(); const dpr = DPR(), al = Math.min(1, 1.3 * 0.95 * 0.12 / (470 / (2 * r * dpr))); ctx.strokeStyle = "rgba(20,18,16," + al.toFixed(3) + ")"; ctx.lineWidth = 1 / dpr; for (let k = a; k < b; k++) { const [ax, ay] = DEMO.nails[DEMO.sequence[k]], [bx, by] = DEMO.nails[DEMO.sequence[k + 1]]; ctx.beginPath(); ctx.moveTo(c + ax * r, c + ay * r); ctx.lineTo(c + bx * r, c + by * r); ctx.stroke(); } };
    const status = () => { const k = Math.max(1, drawn); st.textContent = fill(T.progress, { current: nf.format(drawn), total: nf.format(total) }); seg.textContent = fill(T.segment, { from: label(DEMO.sequence[k - 1]), to: label(DEMO.sequence[Math.min(k, total)]) }); const done = drawn >= total; const kind = done ? "replay" : playing ? "pause" : "play"; btn.innerHTML = icon(kind); const lab = done ? T.replay : playing ? T.pause : T.play; btn.setAttribute("aria-label", lab); btn.title = lab; };
    const loop = () => { let last = performance.now(), budget = 0; const per = total / 16000; const tick = (now) => { budget += (now - last) * per; last = now; const target = Math.min(total, drawn + Math.floor(budget)); budget -= target - drawn; if (target > drawn) { lines(drawn, target); drawn = target; status(); } if (drawn >= total) { playing = false; status(); return; } if (playing) raf = requestAnimationFrame(tick); }; raf = requestAnimationFrame(tick); };
    btn.addEventListener("click", () => { if (drawn >= total) { reset(); drawn = 0; playing = true; status(); loop(); } else { playing = !playing; status(); if (playing) loop(); else cancelAnimationFrame(raf); } });
    new ResizeObserver(() => { reset(); lines(0, drawn); }).observe(cv);
    reset();
    if (reduce) { lines(0, total); drawn = total; } else loop();
    status();
  });
})();`;

const b = await chromium.launch();
for (const [url, file, locale] of PAGES) {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, locale });
  const p = await ctx.newPage();
  await p.goto(BASE + url, { waitUntil: "networkidle" });
  await p.locator(".header-start .icon-btn").click();
  await p.waitForSelector("#nav-drawer");
  const html = await p.evaluate(() => {
    const doc = document.documentElement.cloneNode(true);
    doc.querySelectorAll("script, link, next-route-announcer, nextjs-portal, noscript").forEach((n) => n.remove());
    doc.classList.remove("js");
    doc.querySelectorAll(".is-visible").forEach((n) => n.classList.remove("is-visible"));
    doc.querySelectorAll("[style*='opacity'], [style*='transform']").forEach((n) => { if (!n.matches('[data-reveal]')) return; });
    const dr = doc.querySelector("#nav-drawer"); if (dr) dr.setAttribute("hidden", "");
    return "<!doctype html>\n" + doc.outerHTML;
  });
  const css = await p.evaluate(async () => {
    const hrefs = [...document.querySelectorAll('link[rel="stylesheet"]')].map((l) => l.href);
    return (await Promise.all(hrefs.map((h) => fetch(h).then((r) => r.text())))).join("\n");
  });
  await ctx.close();
  let page = html
    .replace(/href="(\/(?:fr|en|ar)(?:\/kit)?)(#[\w-]*)?"/g, (_, p1, h) => `href="${FILE_OF[p1]}${h ?? ""}"`)
    .replace(/href="\/"/g, 'href="index.html"')
    .replace(/(src|href)="\/visuels\//g, '$1="visuels/')
    .replace(/<link[^>]*>/g, "")
    .replace("</head>", `<link rel="icon" href="data:image/png;base64,${readFileSync(path.join(web, "public/visuels/marque/icone-32.png")).toString("base64")}"></head>`);
  const style = css.replace(/url\((?:\/_next\/static|\.\.)\/media\//g, "url(assets/media/");
  const banner = `<p style="margin:0;padding:.5rem 1rem;background:#fff3cd;color:#2a1f1a;font:500 13px/1.4 system-ui,sans-serif;text-align:center">${locale === "ar" ? "نسخة تجريبية للعرض فقط — الطلب غير مفعّل" : locale === "en" ? "Demo version for review only — ordering is not active" : "Version de démonstration — la commande n'est pas active"}</p>`;
  page = page
    .replace("</head>", `<style>${style}</style></head>`)
    .replace(/<body([^>]*)>/, `<body$1>${banner}`)
    .replace("</body>", `<script>${runtime(locale)}</script></body>`);
  // Images et polices intégrées dans la page : elle s'affiche même ouverte seule
  // (aperçu d'un zip, téléphone, fichier copié sans ses dossiers).
  const MIME = { webp: "image/webp", png: "image/png", jpg: "image/jpeg", svg: "image/svg+xml", woff2: "font/woff2", woff: "font/woff" };
  const cache = new Map();
  const inline = (rel) => {
    if (!cache.has(rel)) {
      const f = path.join(out, rel);
      cache.set(rel, existsSync(f) ? `data:${MIME[rel.split(".").pop()] ?? "application/octet-stream"};base64,${readFileSync(f).toString("base64")}` : rel);
    }
    return cache.get(rel);
  };
  // Chaque image n'est stockée qu'une fois (table en tête de page) puis posée sur
  // toutes les balises qui l'utilisent ; les chemins relatifs restent en secours.
  const used = [...new Set([...page.matchAll(/src="(visuels\/[^"]+)"/g)].map((m) => m[1]))];
  const table = Object.fromEntries(used.map((rel) => [rel, inline(rel)]));
  const setImgs = `<script>(()=>{const T=${JSON.stringify(table)};document.querySelectorAll("img").forEach((i)=>{const k=i.getAttribute("src");if(T[k])i.src=T[k];});})();</script>`;
  page = page
    .replace(/url\((assets\/media\/[^)]+)\)/g, (_, rel) => `url(${inline(rel)})`)
    .replace("</body>", `${setImgs}</body>`);
  writeFileSync(path.join(out, file), page);
  console.log(file, Math.round(page.length / 1024) + " Ko");
}
await b.close();
writeFileSync(path.join(out, "LISEZ-MOI.txt"), "Démo hors ligne du site.\nOuvrez index.html (français), ar.html (arabe) ou en.html (anglais) par double-clic.\nChaque page contient ses images et ses polices : elle s'affiche même ouverte seule.\nLes polices et images sont incluses ; aucune connexion n'est nécessaire.\n");
