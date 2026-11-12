import { readFile } from "node:fs/promises";
import path from "node:path";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { BeforeAfter } from "@/components/BeforeAfter";
import { PlusIcon } from "@/components/Icons";
import { NailRing } from "@/components/NailRing";
import { ProductSection } from "@/components/ProductSection";
import { Reveal } from "@/components/Reveal";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { StepsCarousel } from "@/components/StepsCarousel";
import { StickyBar } from "@/components/StickyBar";
import { WeavingBoard } from "@/components/WeavingBoard";
import { brand } from "@/config/brand";
import { kitOffer } from "@/config/catalog";
import { howSteps } from "@/config/howSteps";
import { Link } from "@/i18n/navigation";
import type { DemoPortrait } from "@/lib/board";

const TRUST = ["cod", "delivery", "voice", "nails"] as const;
const PROOF = ["cod", "nails", "voice"] as const;
const GIFTS = [
  { key: "couples", name: null },
  { key: "parents", name: "photographe" },
  { key: "grandparents", name: null },
  { key: "pets", name: "chat" },
  { key: "memory", name: null },
  { key: "self", name: "astronaute" },
] as const;
const WHAT_STEPS = ["photo", "model", "thread"] as const;
const WHAT_CHIPS = ["box", "nails", "voice"] as const;
const GIFT_STEPS = ["box", "choose", "make"] as const;
const FAQ = ["who", "skills", "photo", "time", "privacy", "payment"] as const;

async function loadDemo(): Promise<DemoPortrait> {
  const file = path.join(process.cwd(), "public", "demo", "portrait-demo.json");
  return JSON.parse(await readFile(file, "utf-8"));
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
        {/* Héros : carte visuelle (pastille + médaillon) et texte avec ligne de preuves. */}
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
                <Link className="btn btn-outline btn-lg" href="/kit">
                  {t("hero.secondary")}
                </Link>
              </div>
              <ul className="proof">
                {PROOF.map((k) => (
                  <li key={k}>{t(`hero.proof.${k}`)}</li>
                ))}
              </ul>
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

        {/* Comment ça marche : carrousel, grande image + onglets à icônes. */}
        <section className="section bg-cream" id="comment" aria-labelledby="how-title">
          <div className="wrap">
            <header className="section-head center" data-reveal>
              <p className="eyebrow">{t("kit.how.eyebrow")}</p>
              <h2 id="how-title">{t("kit.how.title")}</h2>
              <p>{t("kit.how.lead")}</p>
            </header>
            <div data-reveal>
              <StepsCarousel id="how-home" title={t("kit.how.eyebrow")} steps={howSteps(t, locale)} />
            </div>
          </div>
        </section>

        {/* Idées cadeaux : en-tête scindé, cartes-liens avec petite œuvre superposée. */}
        <section className="section bg-cream" id="cadeaux" aria-labelledby="gifts-title">
          <div className="wrap">
            <header className="section-head split-head" data-reveal>
              <div>
                <p className="eyebrow">{t("gifts.eyebrow")}</p>
                <h2 id="gifts-title">{t("gifts.title")}</h2>
              </div>
              <p>{t("gifts.lead")}</p>
            </header>
            <ul className="gift-grid">
              {GIFTS.map((g, i) => (
                <li key={g.key} data-reveal style={{ ["--i" as string]: i % 3 }}>
                  <a className="gift-card" href="#acheter">
                    <div className="gift-img">
                      {g.name ? <img src={`/visuels/${g.name}-photo.webp`} alt="" width={600} height={600} loading="lazy" /> : <NailRing />}
                      <span className="gift-placeholder">{t("gifts.placeholder")}</span>
                      {g.name && (
                        <span className="gift-art" aria-hidden="true">
                          <img src={`/visuels/${g.name}-fil.webp`} alt="" width={240} height={240} loading="lazy" />
                        </span>
                      )}
                    </div>
                    <h3>{t(`gifts.items.${g.key}.title`)}</h3>
                    <p>{t(`gifts.items.${g.key}.text`)}</p>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Dans la boîte : avant/après, étapes, encadré matériaux, puces, lien vers le kit. */}
        <section className="section bg-sand" id="contenu" aria-labelledby="what-title">
          <div className="wrap split">
            <div data-reveal>
              <BeforeAfter photo="/visuels/astronaute-photo.webp" thread="/visuels/astronaute-fil.webp" />
              <p className="ba-hint-below">{t("what.slider.hint")}</p>
            </div>
            <div>
              <header className="section-head" data-reveal>
                <p className="eyebrow">{t("what.eyebrow")}</p>
                <h2 id="what-title">{t("what.title")}</h2>
              </header>
              <ol className="num-steps soft">
                {WHAT_STEPS.map((s, i) => (
                  <li key={s} data-reveal style={{ ["--i" as string]: i }}>
                    <h3>{t(`what.steps.${s}.title`)}</h3>
                    <p>{t(`what.steps.${s}.text`)}</p>
                  </li>
                ))}
              </ol>
              <div className="premium" data-reveal>
                <span className="premium-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3.5" y="3.5" width="17" height="17" rx="1.5" />
                    <circle cx="12" cy="12" r="5.5" />
                  </svg>
                </span>
                <div>
                  <h3>{t("what.premiumTitle")}</h3>
                  <p>{t("what.premiumText")}</p>
                </div>
              </div>
              <ul className="chips" data-reveal>
                {WHAT_CHIPS.map((c) => (
                  <li key={c}>{t(`what.chips.${c}`)}</li>
                ))}
              </ul>
              <Link className="btn btn-outline btn-lg" href="/kit">
                {t("what.more")}
              </Link>
            </div>
          </div>
        </section>

        {/* L'offrir : 3 étapes et bandeau blanc. */}
        <section className="section bg-blush" aria-labelledby="howgift-title">
          <div className="wrap">
            <header className="section-head center" data-reveal>
              <p className="eyebrow">{t("howGift.eyebrow")}</p>
              <h2 id="howgift-title">{t("howGift.title")}</h2>
              <p>{t("howGift.lead")}</p>
            </header>
            <ol className="num-steps soft cols-3">
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
                <p>{t("howGift.togetherText2")}</p>
              </div>
              <a className="btn btn-primary btn-lg" href="#acheter">
                {t("howGift.cta")}
              </a>
            </div>
          </div>
        </section>

        <ProductSection price={price} />

        {/* FAQ : intro avec bouton contour, accordéon. */}
        <section className="section bg-sand" id="faq" aria-labelledby="faq-title">
          <div className="wrap faq-grid">
            <header className="section-head" data-reveal>
              <p className="eyebrow">{t("faq.eyebrow")}</p>
              <h2 id="faq-title">{t("faq.title")}</h2>
              <p>{t("faq.lead")}</p>
              <a className="btn btn-outline btn-lg faq-contact" href={brand.supportEmail ? `mailto:${brand.supportEmail}` : "#contact"}>
                {t("faq.contact")}
              </a>
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

        {/* Appel final : œuvre ronde + titre, prix, bouton. */}
        <section className="section bg-cream final" aria-labelledby="final-title">
          <div className="wrap final-inner" data-reveal>
            <img src="/visuels/astronaute-fil.webp" alt="" width={240} height={240} loading="lazy" className="final-img" />
            <div className="final-content">
              <h2 id="final-title">{t("final.title")}</h2>
              <p>
                {t("final.priceLine")} · {price ?? t("shop.priceSoon")}
              </p>
              <p>{t("final.text")}</p>
              <a className="btn btn-primary btn-lg" href="#acheter">
                {t("final.cta")}
              </a>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
      <StickyBar watchId="hero-actions" price={price} />
      <Reveal />
    </>
  );
}
