import { readFile } from "node:fs/promises";
import path from "node:path";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { BeforeAfter } from "@/components/BeforeAfter";
import { Gallery } from "@/components/Gallery";
import { PlusIcon } from "@/components/Icons";
import { Reveal } from "@/components/Reveal";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { StickyBar } from "@/components/StickyBar";
import { WeavingBoard } from "@/components/WeavingBoard";
import { kitOffer } from "@/config/catalog";
import type { DemoPortrait } from "@/lib/board";

const TRUST = ["cod", "delivery", "voice", "nails"] as const;
const GIFTS = [
  { key: "couples", img: null },
  { key: "parents", img: "/visuels/photographe-fil.webp" },
  { key: "grandparents", img: null },
  { key: "pets", img: "/visuels/chat-fil.webp" },
  { key: "memory", img: null },
  { key: "self", img: "/visuels/astronaute-fil.webp" },
] as const;
const WHAT_STEPS = ["photo", "model", "thread"] as const;
const GIFT_STEPS = ["box", "choose", "make"] as const;
const INCLUDES = ["board", "thread", "code", "guide"] as const;
const FAQ = ["who", "skills", "photo", "time", "privacy", "payment"] as const;

async function loadDemo(): Promise<DemoPortrait> {
  const file = path.join(process.cwd(), "public", "demo", "portrait-demo.json");
  return JSON.parse(await readFile(file, "utf-8"));
}

/** Visuel provisoire : motif de fil classique (cardioïde) sur un cercle de clous. */
function NailRing() {
  const n = 120;
  const pt = (i: number) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    return [50 + 44 * Math.cos(a), 50 + 44 * Math.sin(a)] as const;
  };
  const chords = Array.from({ length: n }, (_, i) => {
    const [x1, y1] = pt(i);
    const [x2, y2] = pt((i * 2) % n);
    return `M${x1.toFixed(2)} ${y1.toFixed(2)}L${x2.toFixed(2)} ${y2.toFixed(2)}`;
  }).join("");
  return (
    <svg viewBox="0 0 100 100" className="ring" aria-hidden="true" focusable="false">
      <path d={chords} fill="none" stroke="currentColor" strokeWidth="0.18" />
      {Array.from({ length: n }, (_, i) => {
        const [cx, cy] = pt(i);
        return <circle key={i} cx={cx} cy={cy} r="0.55" />;
      })}
    </svg>
  );
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const format = await getFormatter();
  const demo = await loadDemo();
  const price = kitOffer.price
    ? format.number(kitOffer.price.amountMinor / 100, { style: "currency", currency: kitOffer.price.currency })
    : null;

  return (
    <>
      <a className="skip" href="#main">
        {t("a11y.skip")}
      </a>
      <p className="announcement">{t("announcement")}</p>
      <SiteHeader />
      <main id="main">
        {/* Héros : visuel arrondi avec badge et médaillon, puis le texte. */}
        <section className="hero" aria-labelledby="hero-title">
          <div className="wrap hero-grid">
            <div className="hero-media" data-reveal>
              <span className="badge">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="8" width="18" height="13" rx="1.5" />
                  <path d="M12 8v13M3 12h18M12 8c-2-4-6-4-6-1.5S9 8 12 8zm0 0c2-4 6-4 6-1.5S15 8 12 8z" />
                </svg>
                {t("hero.badge")}
              </span>
              <WeavingBoard demo={demo} />
              <figure className="medallion">
                <img src="/visuels/astronaute-photo.webp" alt={t("hero.medallion")} width={300} height={300} />
              </figure>
            </div>
            <div className="hero-copy" data-reveal style={{ ["--i" as string]: 1 }}>
              <p className="eyebrow">{t("hero.eyebrow")}</p>
              <h1 id="hero-title">
                {t("hero.titleStart")} <em>{t("hero.titleAccent")}</em>
              </h1>
              <p className="hero-lead">{t("hero.lead")}</p>
              <div className="hero-actions" id="hero-actions">
                <a className="btn btn-primary btn-lg" href="#acheter">
                  {t("hero.cta")}
                </a>
                <a className="btn btn-outline btn-lg" href="#comment">
                  {t("hero.secondary")}
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="trust" aria-label={t("trust.cod")}>
          <div className="marquee">
            {[0, 1].map((copy) => (
              <ul key={copy} className="marquee-track" aria-hidden={copy === 1 ? true : undefined}>
                {[...TRUST, ...TRUST].map((k, i) => (
                  <li key={`${k}-${i}`} aria-hidden={i >= TRUST.length ? true : undefined}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M5 12.5l4.5 4.5L19 7.5" />
                    </svg>
                    {t(`trust.${k}`)}
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </section>

        <section className="section bg-cream" id="cadeaux" aria-labelledby="gifts-title">
          <div className="wrap">
            <header className="section-head center" data-reveal>
              <p className="eyebrow">{t("gifts.eyebrow")}</p>
              <h2 id="gifts-title">{t("gifts.title")}</h2>
              <p>{t("gifts.lead")}</p>
            </header>
            <ul className="gift-grid">
              {GIFTS.map((g, i) => (
                <li key={g.key} className="gift-card" data-reveal style={{ ["--i" as string]: i % 3 }}>
                  <div className="gift-img">
                    {g.img ? <img src={g.img} alt="" width={600} height={600} loading="lazy" /> : <NailRing />}
                    <span className="gift-placeholder">{t("gifts.placeholder")}</span>
                  </div>
                  <h3>{t(`gifts.items.${g.key}.title`)}</h3>
                  <p>{t(`gifts.items.${g.key}.text`)}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="section bg-sand" id="comment" aria-labelledby="what-title">
          <div className="wrap split">
            <div data-reveal>
              <BeforeAfter photo="/visuels/astronaute-photo.webp" thread="/visuels/astronaute-fil.webp" />
            </div>
            <div>
              <header className="section-head" data-reveal>
                <p className="eyebrow">{t("what.eyebrow")}</p>
                <h2 id="what-title">{t("what.title")}</h2>
              </header>
              <ol className="num-steps">
                {WHAT_STEPS.map((s, i) => (
                  <li key={s} data-reveal style={{ ["--i" as string]: i }}>
                    <h3>{t(`what.steps.${s}.title`)}</h3>
                    <p>{t(`what.steps.${s}.text`)}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section className="section bg-blush" aria-labelledby="howgift-title">
          <div className="wrap">
            <header className="section-head center" data-reveal>
              <p className="eyebrow">{t("howGift.eyebrow")}</p>
              <h2 id="howgift-title">{t("howGift.title")}</h2>
              <p>{t("howGift.lead")}</p>
            </header>
            <ol className="num-steps cols-3">
              {GIFT_STEPS.map((s, i) => (
                <li key={s} data-reveal style={{ ["--i" as string]: i }}>
                  <h3>{t(`howGift.steps.${s}.title`)}</h3>
                  <p>{t(`howGift.steps.${s}.text`)}</p>
                </li>
              ))}
            </ol>
            <div className="together" data-reveal>
              <img src="/visuels/photographe-fil.webp" alt="" width={600} height={600} loading="lazy" />
              <div>
                <h3>{t("howGift.togetherTitle")}</h3>
                <p>{t("howGift.togetherText")}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="section bg-cream" id="acheter" aria-labelledby="shop-title">
          <div className="wrap shop-grid">
            <div data-reveal>
              <Gallery
              images={[
                { src: "/visuels/astronaute-fil.webp", alt: t("gifts.placeholder") },
                { src: "/visuels/astronaute-photo.webp", alt: t("gifts.placeholder") },
                { src: "/visuels/chat-fil.webp", alt: t("gifts.placeholder") },
                { src: "/visuels/photographe-fil.webp", alt: t("gifts.placeholder") },
              ]}
              />
            </div>
            <div className="shop-info" data-reveal style={{ ["--i" as string]: 1 }}>
              <h2 id="shop-title">{t("shop.title")}</h2>
              <p className="shop-lead">{t("shop.lead")}</p>
              <p className="shop-price">{price ?? t("shop.priceSoon")}</p>
              <h3>{t("shop.includesTitle")}</h3>
              <ul className="check-list">
                {INCLUDES.map((k) => (
                  <li key={k}>{t(`shop.includes.${k}`)}</li>
                ))}
              </ul>
              <button type="button" className="btn btn-primary btn-lg btn-block" disabled={!price}>
                {price ? t("shop.cta") : t("shop.ctaSoon")}
              </button>
              <p className="shop-note">{t("shop.payment")}</p>
            </div>
          </div>
        </section>

        <section className="section bg-sand" id="faq" aria-labelledby="faq-title">
          <div className="wrap faq-grid">
            <header className="section-head" data-reveal>
              <p className="eyebrow">{t("faq.eyebrow")}</p>
              <h2 id="faq-title">{t("faq.title")}</h2>
              <p>{t("faq.lead")}</p>
            </header>
            <div className="faq-list" data-reveal style={{ ["--i" as string]: 1 }}>
              {FAQ.map((q) => (
                <details key={q}>
                  <summary>
                    {t(`faq.items.${q}.q`)}
                    <PlusIcon />
                  </summary>
                  <p>{t(`faq.items.${q}.a`)}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="section bg-cream final" aria-labelledby="final-title">
          <div className="wrap final-inner" data-reveal>
            <img src="/visuels/astronaute-fil.webp" alt="" width={240} height={240} loading="lazy" className="final-img" />
            <h2 id="final-title">{t("final.title")}</h2>
            <p>{t("final.text")}</p>
            <a className="btn btn-primary btn-lg" href="#acheter">
              {t("final.cta")}
            </a>
          </div>
        </section>
      </main>
      <SiteFooter />
      <StickyBar watchId="hero-actions" price={price} />
      <Reveal />
    </>
  );
}
