/**
 * Génère les maquettes d'écrans de téléphone du carrousel « Comment ça marche »
 * (étapes : code, photo, guide vocal) pour chaque langue, en 1000 × 1000 WebP.
 * Dessin maison aux couleurs du site ; s'appuie sur le site lancé en local
 * (polices et visuels) : node scripts/make-step-mockups.cjs [http://localhost:3000]
 */
const { chromium } = require("playwright");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const BASE = process.argv[2] || "http://localhost:3000";
const OUT = path.join(__dirname, "../apps/web/public/visuels/etapes");
const BRAND = process.env.NEXT_PUBLIC_BRAND_NAME || "DeeKra";

const T = {
  fr: {
    lang: "FR", welcome: "Bienvenue", codeTitle: "Entrez le code de votre kit", codeText: "Il est imprimé sur la carte glissée dans la boîte.",
    validate: "Valider le code", codeNote: "Un code = un portrait", photoTitle: "Cadrez le visage", preview: "Aperçu en fil",
    back: "Retour", next: "Suivant", nail: "Clou suivant", lost: "Revenir d'un clou", speed: "Vitesse",
  },
  en: {
    lang: "EN", welcome: "Welcome", codeTitle: "Enter your kit code", codeText: "It is printed on the card inside the box.",
    validate: "Confirm code", codeNote: "One code = one portrait", photoTitle: "Frame the face", preview: "Thread preview",
    back: "Back", next: "Next", nail: "Next nail", lost: "Go back one nail", speed: "Speed",
  },
  ar: {
    lang: "ع", welcome: "مرحبًا", codeTitle: "أدخل رمز العدة", codeText: "تجده مطبوعًا على البطاقة داخل العلبة.",
    validate: "تأكيد الرمز", codeNote: "رمز واحد = بورتريه واحد", photoTitle: "ضع الوجه في الإطار", preview: "معاينة بالخيط",
    back: "رجوع", next: "التالي", nail: "المسمار التالي", lost: "الرجوع مسمارًا واحدًا", speed: "السرعة",
  },
};

const ICON = (d, s = 22) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;

function ring() {
  let dots = "";
  for (let k = 0; k < 120; k++) {
    const a = (k / 120) * Math.PI * 2;
    dots += `<circle cx="${500 + 430 * Math.cos(a)}" cy="${500 + 430 * Math.sin(a)}" r="3.2"/>`;
  }
  return `<svg class="ring" viewBox="0 0 1000 1000" fill="#d9c7b7">${dots}</svg>`;
}

const css = `
.mk{position:fixed;inset:0;z-index:99999;display:grid;place-items:center;background:#fff}
.stage{position:relative;width:1000px;height:1000px;overflow:hidden;display:grid;place-items:center;
  background:radial-gradient(circle at 50% 42%,#f6ece2 0,#eadbcd 70%);font-family:var(--font-body);color:#2a1f1a}
.ring{position:absolute;inset:0;width:100%;height:100%}
.phone{position:relative;width:420px;height:860px;border-radius:60px;background:#1d1612;padding:14px;transform:rotate(-4deg);
  box-shadow:0 40px 80px rgb(42 31 26/.28),0 8px 20px rgb(42 31 26/.18)}
.scr{position:relative;height:100%;border-radius:47px;background:#fffaf5;overflow:hidden;display:flex;flex-direction:column;padding:16px 26px 26px}
.notch{position:absolute;top:12px;left:50%;translate:-50% 0;width:110px;height:30px;border-radius:20px;background:#1d1612}
.status{display:flex;justify-content:space-between;font:600 15px/1 var(--font-body);padding:6px 8px 0;direction:ltr}
.bar{display:flex;align-items:center;justify-content:space-between;margin-top:26px}
.logo{height:84px;width:auto;display:block}
.pill{border:1px solid #d9c7b7;border-radius:999px;padding:5px 12px;font:700 13px/1 var(--font-body)}
.eb{margin-top:42px;color:#a8322d;font:700 13px/1 var(--font-body);letter-spacing:.08em;text-transform:uppercase}
h1{font:400 34px/1.12 var(--font-display);margin:12px 0 10px}
p{color:#5a4a40;font-size:16px;line-height:1.5;margin:0}
.input{margin-top:34px;height:62px;border:2px solid #a8322d;border-radius:999px;display:flex;align-items:center;justify-content:center;
  font:700 26px/1 var(--font-body);letter-spacing:.14em;direction:ltr;background:#fff}
.input span{color:#c9b8aa}.caret{width:2px;height:28px;background:#a8322d;margin-inline:2px}
.btn{height:56px;border-radius:999px;display:flex;align-items:center;justify-content:center;gap:10px;font:700 17px/1 var(--font-body)}
.pri{background:#a8322d;color:#fffaf5}.out{border:1.5px solid #2a1f1a}
.card{margin-top:auto;border-radius:20px;background:#f3ded3;padding:18px;display:flex;gap:14px;align-items:center}
.card b{display:block;font:700 15px/1.3 var(--font-body);color:#2a1f1a}
.steps3{margin-top:auto;display:flex;align-items:center;justify-content:center;gap:8px;direction:ltr}
.steps3 span{width:34px;height:34px;border-radius:50%;border:1px solid #d9c7b7;display:grid;place-items:center;font:700 14px/1 var(--font-body)}
.steps3 .on{background:#a8322d;border-color:#a8322d;color:#fffaf5}.steps3 i{width:40px;height:1px;background:#d9c7b7}
.chip{width:58px;height:40px;border-radius:8px;background:#fffaf5;border:1px dashed #a8322d;display:grid;place-items:center;color:#a8322d;font:700 11px/1 var(--font-body);direction:ltr}
.crop{position:relative;margin-top:22px;aspect-ratio:1;border-radius:22px;overflow:hidden}
.crop img{width:100%;height:100%;object-fit:cover}
.crop .c{position:absolute;inset:11%;border-radius:50%;border:2px dashed #fffaf5;box-shadow:0 0 0 400px rgb(42 31 26/.55)}
.tools{display:flex;justify-content:center;gap:14px;margin-top:18px}
.tools span{width:48px;height:48px;border-radius:50%;border:1px solid #d9c7b7;display:grid;place-items:center;background:#fff}
.prev{display:flex;align-items:center;gap:12px;margin-top:18px;font:600 15px/1 var(--font-body)}
.prev img{width:56px;height:56px;border-radius:50%;object-fit:cover;border:1px solid #d9c7b7}
.row{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:auto}
.speeds{display:flex;gap:8px;margin-top:34px;direction:ltr;justify-content:center}
.speeds span{padding:8px 12px;border-radius:999px;border:1px solid #d9c7b7;font:700 14px/1 var(--font-body)}
.speeds .on{background:#2a1f1a;color:#fffaf5;border-color:#2a1f1a}
.dial{position:relative;width:290px;height:290px;margin:30px auto 0;direction:ltr}
.dial svg{position:absolute;inset:0}
.dial .q{position:absolute;font:400 28px/1 var(--font-display)}
.dial .ctr{position:absolute;inset:78px;border-radius:50%;background:#fffaf5;display:grid;place-items:center;align-content:center;box-shadow:0 6px 18px rgb(42 31 26/.15)}
.ctr small{font:600 12px/1 var(--font-body);color:#5a4a40;margin-bottom:4px}
.ctr b{font:400 50px/1 var(--font-display);color:#a8322d}
.next{text-align:center;margin-top:18px;color:#5a4a40;font:600 15px/1 var(--font-body);direction:ltr}
.prog{margin-top:22px;direction:ltr}.prog div{height:6px;border-radius:6px;background:#eadbcd;overflow:hidden}
.prog div i{display:block;height:100%;width:18%;background:#a8322d}
.prog span{display:block;text-align:center;margin-top:8px;font:700 14px/1 var(--font-body)}
.ctrl{display:flex;align-items:center;justify-content:center;gap:26px;margin-top:auto;direction:ltr}
.ctrl .play{width:70px;height:70px;border-radius:50%;background:#a8322d;color:#fffaf5;display:grid;place-items:center}
.lost{margin-top:16px;height:48px;font-size:15px}
`;

const head = (t, dir) => `<div class="notch"></div><div class="status"><span>9:41</span><span>●●● ▮</span></div>
  <div class="bar" dir="${dir}"><img class="logo" src="${BASE}/visuels/marque/deekra-entete.webp" alt="${BRAND}"><span class="pill">${t.lang}</span></div>`;

const screens = {
  code: (t, dir) => `${head(t, dir)}
    <p class="eb">${t.welcome}</p><h1>${t.codeTitle}</h1><p>${t.codeText}</p>
    <div class="input">7K3P-4A9<i class="caret"></i><span>_</span></div>
    <div class="btn pri" style="margin-top:16px">${t.validate}</div>
    <div class="card" style="margin-top:28px"><span class="chip">7K3P-4A9X</span><b>${t.codeNote}</b></div>
    <div class="steps3"><span class="on">1</span><i></i><span>2</span><i></i><span>3</span></div>`,
  photo: (t, dir) => `${head(t, dir)}
    <h1 style="margin-top:34px">${t.photoTitle}</h1>
    <div class="crop"><img src="/visuels/photographe-photo.webp"><span class="c"></span></div>
    <div class="tools">
      <span>${ICON('<path d="M12 16V4M7 9l5-5 5 5M5 20h14"/>', 20)}</span>
      <span>${ICON('<path d="M20 12a8 8 0 11-2.3-5.6M20 4v4h-4"/>', 20)}</span>
      <span>${ICON('<path d="M12 5v14M5 12h14"/>', 20)}</span>
      <span>${ICON('<path d="M5 12h14"/>', 20)}</span>
    </div>
    <div class="prev"><img src="/visuels/photographe-fil.webp">${t.preview}</div>
    <div class="row"><div class="btn out">${t.back}</div><div class="btn pri">${t.next}</div></div>`,
  voice: (t, dir) => `${head(t, dir)}
    <div class="speeds"><span>0,5×</span><span class="on">1×</span><span>1,5×</span><span>2×</span></div>
    <div class="dial">
      <svg viewBox="0 0 290 290"><circle cx="145" cy="145" r="128" fill="#eadbcd"/>
        <path d="M145 145 L145 17 A128 128 0 0 1 273 145 Z" fill="#a8322d"/>
        <path d="M145 17v256M17 145h256" stroke="#fffaf5" stroke-width="4"/></svg>
      <span class="q" style="left:-6px;top:-4px">A</span><span class="q" style="right:-6px;top:-4px;color:#a8322d">B</span>
      <span class="q" style="left:-6px;bottom:-4px">D</span><span class="q" style="right:-6px;bottom:-4px">C</span>
      <div class="ctr"><small>${t.nail}</small><b>B27</b></div>
    </div>
    <p class="next">B27 → D14 → A3</p>
    <div class="prog"><div><i></i></div><span>642 / 3 600</span></div>
    <div class="ctrl">
      <span>${ICON('<path d="M11 7l-5 5 5 5M18 7l-5 5 5 5"/>', 28)}</span>
      <span class="play">${ICON('<path d="M9 6v12M15 6v12"/>', 30)}</span>
      <span>${ICON('<path d="M9 18V5l11-2v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>', 28)}</span>
    </div>
    <div class="btn out lost">${t.lost}</div>`,
};

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1000, height: 1000 } });
  for (const [loc, t] of Object.entries(T)) {
    const dir = loc === "ar" ? "rtl" : "ltr";
    await p.goto(`${BASE}/${loc}`);
    for (const [key, fn] of Object.entries(screens)) {
      await p.evaluate(
        ({ css, html, dir }) => {
          document.getElementById("mk")?.remove();
          const s = document.createElement("style"); s.textContent = css; document.head.appendChild(s);
          const d = document.createElement("div"); d.id = "mk"; d.className = "mk";
          d.innerHTML = `<div class="stage">${html}</div>`; d.dir = dir; document.body.appendChild(d);
        },
        { css, html: ring() + `<div class="phone"><div class="scr">${fn(t, dir)}</div></div>`, dir },
      );
      await p.evaluate(() => Promise.all([...document.querySelectorAll("#mk img")].map((i) => i.decode())));
      await p.evaluate(() => document.fonts.ready);
      const png = path.join(OUT, `${key}-${loc}.png`);
      await p.locator("#mk .stage").screenshot({ path: png });
      execFileSync("python3", ["-c", `from PIL import Image;import os;Image.open('${png}').convert('RGB').save('${png.replace(".png", ".webp")}',quality=82);os.remove('${png}')`]);
      if (process.env.SCREEN_DIR) {
        // Écran seul, à plat (pour l'incruster sur une photo).
        await p.evaluate(() => { document.querySelector("#mk .phone").style.transform = "none"; document.querySelector("#mk .scr").style.borderRadius = "0"; });
        await p.locator("#mk .scr").screenshot({ path: path.join(process.env.SCREEN_DIR, `ecran-${key}-${loc}.png`) });
      }
      console.log(key, loc);
    }
  }
  await b.close();
})();
