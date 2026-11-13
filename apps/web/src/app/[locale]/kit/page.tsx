import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
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
import { formatPrice } from "@/lib/price";
import { howSteps } from "@/config/howSteps";
import { Link } from "@/i18n/navigation";
import type { DemoPortrait } from "@/lib/board";

const WHAT = ["kit", "model", "voice"] as const;
const EXAMPLES = [
  { key: "portrait", name: "astronaute" },
  { key: "pet", name: "chat" },
  { key: "group", name: "photographe" },
] as const;
const APP = [
  { key: "site", img: null },
  { key: "code", img: null },
  { key: "photo", img: "/visuels/astronaute-photo.webp" },
  { key: "preview", img: "/visuels/astronaute-fil.webp" },
  { key: "thread", img: "/visuels/chat-fil.webp" },
] as const;
const APP_CHIPS = ["voice", "speed", "pause", "progress"] as const;
const GIFT_CHIPS = ["code", "cod", "langs"] as const;
const WHY = ["engine", "face", "nails", "voice", "cod", "privacy"] as const;
const STATS = ["nails", "size", "langs", "labels"] as const;
const FAQ = ["who", "skills", "photo", "time", "privacy", "payment"] as const;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "kit.meta" });
  return { title: t("title", { brand: brand.name }), description: t("description") };
}

async function loadDemo(): Promise<DemoPortrait> {
  const file = path.join(process.cwd(), "public", "demo", "portrait-demo.json");
  return JSON.parse(await readFile(file, "utf-8"));
}

export default async function KitPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const demo = await loadDemo();
  const price = kitOffer.price ? formatPrice(kitOffer.price, locale) : null;

  return (
    <>
      <a className="skip" href="#main">
        {t("a11y.skip")}
      </a>
      <p className="announcement">{t("announcement")}</p>
      <SiteHeader />
      <main id="main">
        <div id="hero-actions" />
        <ProductSection price={price} provisional={kitOffer.provisional} orderingOpen={kitOffer.orderingOpen} headingLevel={1} />

        {/* Qu'est-ce que c'est : la planche animée tient le rôle de la vidéo. */}
        <section className="section bg-sand" aria-labelledby="kit-what-title">
          <div className="wrap split">
            <div className="kit-video" data-reveal>
              <WeavingBoard demo={demo} />
            </div>
            <div>
              <header className="section-head" data-reveal>
                <p className="eyebrow">{t("kit.what.eyebrow")}</p>
                <h2 id="kit-what-title">{t("kit.what.title")}</h2>
                <p>{t("kit.what.lead")}</p>
              </header>
              <ol className="num-steps soft">
                {WHAT.map((s, i) => (
                  <li key={s} data-reveal style={{ ["--i" as string]: i }}>
                    <h3>{t(`kit.what.steps.${s}.title`)}</h3>
                    <p>{t(`kit.what.steps.${s}.text`)}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* Ma photo va-t-elle rendre bien : grand avant/après + mini exemples. */}
        <section className="section bg-cream" aria-labelledby="kit-check-title">
          <div className="wrap split">
            <div data-reveal>
              <BeforeAfter photo="/visuels/astronaute-photo.webp" thread="/visuels/astronaute-fil.webp" />
              <p className="ba-hint-below">{t("what.slider.hint")}</p>
            </div>
            <div>
              <header className="section-head" data-reveal>
                <p className="eyebrow">{t("kit.check.eyebrow")}</p>
                <h2 id="kit-check-title">{t("kit.check.title")}</h2>
                <p>{t("kit.check.lead")}</p>
              </header>
              <ul className="mini-examples">
                {EXAMPLES.map((e, i) => (
                  <li key={e.key} data-reveal style={{ ["--i" as string]: i }}>
                    <BeforeAfter
                      compact
                      photo={`/visuels/${e.name}-photo.webp`}
                      thread={`/visuels/${e.name}-fil.webp`}
                      label={`${t("what.slider.label")} : ${t(`kit.check.examples.${e.key}`)}`}
                    />
                    <b>{t(`kit.check.examples.${e.key}`)}</b>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Comment ça marche : carrousel, grande image + onglets à icônes. */}
        <section className="section bg-sand" id="comment" aria-labelledby="kit-how-title">
          <div className="wrap">
            <header className="section-head center" data-reveal>
              <p className="eyebrow">{t("kit.how.eyebrow")}</p>
              <h2 id="kit-how-title">{t("kit.how.title")}</h2>
              <p>{t("kit.how.lead")}</p>
            </header>
            <div data-reveal>
              <StepsCarousel id="how-kit" title={t("kit.how.eyebrow")} steps={howSteps(t, locale)} />
            </div>
          </div>
        </section>

        {/* Le guide sur téléphone : fond foncé, captures, puces, bouton. */}
        <section className="section bg-inverse" aria-labelledby="kit-app-title">
          <div className="wrap">
            <header className="section-head app-head" data-reveal>
              <p className="eyebrow">{t("kit.app.eyebrow")}</p>
              <h2 id="kit-app-title">{t("kit.app.title")}</h2>
              <p>{t("kit.app.lead")}</p>
            </header>
            <ol className="app-grid">
              {APP.map((s, i) => (
                <li key={s.key} data-reveal style={{ ["--i" as string]: i }}>
                  <div className="phone">
                    <div className="phone-screen">
                      {s.img ? (
                        <img src={s.img} alt="" width={300} height={300} loading="lazy" />
                      ) : s.key === "code" ? (
                        <span className="phone-code" dir="ltr">
                          ••••-••••
                        </span>
                      ) : (
                        <NailRing />
                      )}
                    </div>
                  </div>
                  <div className="app-title">
                    <span aria-hidden="true">{i + 1}</span>
                    <h3>{t(`kit.app.steps.${s.key}.title`)}</h3>
                  </div>
                  <p>{t(`kit.app.steps.${s.key}.text`)}</p>
                </li>
              ))}
            </ol>
            <div className="app-footer" data-reveal>
              <ul className="chips chips-dark">
                {APP_CHIPS.map((c) => (
                  <li key={c}>{t(`kit.app.chips.${c}`)}</li>
                ))}
              </ul>
              <div className="app-cta">
                <span>{t("kit.app.note")}</span>
                <button type="button" className="btn btn-primary btn-lg" disabled>
                  {t("kit.app.cta")}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Pour offrir : image + texte, puces, bouton. */}
        <section className="section bg-blush" aria-labelledby="kit-gift-title">
          <div className="wrap feature" data-reveal>
            <img src="/visuels/photographe-fil.webp" alt="" width={600} height={600} loading="lazy" />
            <div>
              <p className="eyebrow">{t("kit.gift.eyebrow")}</p>
              <h2 id="kit-gift-title">{t("kit.gift.title")}</h2>
              <p className="feature-lead">{t("kit.gift.lead")}</p>
              <ul className="chips">
                {GIFT_CHIPS.map((c) => (
                  <li key={c}>{t(`kit.gift.chips.${c}`)}</li>
                ))}
              </ul>
              <Link className="btn btn-primary btn-lg" href={{ pathname: "/", hash: "cadeaux" }}>
                {t("kit.gift.cta")}
              </Link>
            </div>
          </div>
        </section>

        {/* Pourquoi nous : 6 cartes + caractéristiques chiffrées du kit. */}
        <section className="section bg-sand" aria-labelledby="kit-why-title">
          <div className="wrap">
            <header className="section-head center" data-reveal>
              <p className="eyebrow">{t("kit.why.eyebrow")}</p>
              <h2 id="kit-why-title">{t("kit.why.title")}</h2>
              <p>{t("kit.why.lead")}</p>
            </header>
            <ol className="why-grid">
              {WHY.map((k, i) => (
                <li key={k} className="why-card" data-reveal style={{ ["--i" as string]: i % 3 }}>
                  <span className="num-badge" aria-hidden="true">
                    {i + 1}
                  </span>
                  <h3>{t(`kit.why.items.${k}.title`)}</h3>
                  <p>{t(`kit.why.items.${k}.text`)}</p>
                  <p className="why-compare">{t(`kit.why.items.${k}.compare`)}</p>
                </li>
              ))}
            </ol>
            <dl className="stats" data-reveal>
              {STATS.map((k) => (
                <div key={k}>
                  <dt dir="ltr">{t(`kit.why.stats.${k}.value`)}</dt>
                  <dd>{t(`kit.why.stats.${k}.label`)}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="section bg-sand faq-band" id="faq" aria-labelledby="faq-title">
          <div className="wrap faq-grid">
            <header className="section-head" data-reveal>
              <p className="eyebrow">{t("faq.eyebrow")}</p>
              <h2 id="faq-title">{t("kit.faqTitle")}</h2>
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
      </main>
      <SiteFooter />
      <StickyBar watchId="hero-actions" price={price} orderingOpen={kitOffer.orderingOpen} />
      <Reveal />
    </>
  );
}
