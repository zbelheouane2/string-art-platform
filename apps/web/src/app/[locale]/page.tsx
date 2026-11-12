import { readFile } from "node:fs/promises";
import path from "node:path";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { PlusIcon } from "@/components/Icons";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { StickyBar } from "@/components/StickyBar";
import { WeavingBoard } from "@/components/WeavingBoard";
import { NAIL_COUNT, type DemoPortrait } from "@/lib/board";

const STEPS = ["order", "photo", "choose", "make"] as const;
const KIT = ["board", "thread", "code", "guide"] as const;
const FAQ = ["skills", "photo", "privacy", "time", "payment"] as const;

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

  return (
    <>
      <a className="skip" href="#main">
        {t("a11y.skip")}
      </a>
      <p className="announcement">{t("announcement")}</p>
      <SiteHeader />
      <main id="main">
        <section className="hero" aria-labelledby="hero-title">
          <div className="wrap">
            <div className="hero-copy">
              <h1 id="hero-title">{t("hero.title")}</h1>
              <p className="hero-lead">{t("hero.lead")}</p>
              <div className="hero-actions" id="hero-actions">
                <a className="btn btn-primary" href="#kit">
                  {t("hero.cta")}
                </a>
                <a className="btn btn-quiet" href="#how">
                  {t("hero.secondary")}
                </a>
              </div>
            </div>
            <WeavingBoard demo={demo} />
          </div>
        </section>

        <section className="section section-plaster" id="how" aria-labelledby="how-title">
          <div className="wrap">
            <div className="section-head">
              <h2 id="how-title">{t("how.title")}</h2>
              <p>{t("how.lead")}</p>
            </div>
            <ol className="steps">
              {STEPS.map((s) => (
                <li key={s}>
                  <h3>{t(`how.steps.${s}.title`)}</h3>
                  <p>{t(`how.steps.${s}.text`)}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="section" id="kit" aria-labelledby="kit-title">
          <div className="wrap">
            <div className="section-head">
              <h2 id="kit-title">{t("kit.title")}</h2>
              <p>{t("kit.lead")}</p>
            </div>
            <div className="kit-grid">
              <dl className="kit-list">
                {KIT.map((k) => (
                  <div key={k}>
                    <dt>{t(`kit.items.${k}.title`)}</dt>
                    <dd>{t(`kit.items.${k}.text`)}</dd>
                  </div>
                ))}
              </dl>
              <div className="figures section-plaster">
                <h3>{t("kit.numbersTitle")}</h3>
                <dl>
                  <div>
                    <dt>{t("kit.lines")}</dt>
                    <dd>{format.number(demo.lines)}</dd>
                  </div>
                  <div>
                    <dt>{t("kit.length")}</dt>
                    <dd>{format.number(Math.round(demo.thread_length_m))}</dd>
                  </div>
                  <div>
                    <dt>{t("kit.nails")}</dt>
                    <dd>{format.number(NAIL_COUNT)}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </section>

        <section className="section gift" id="gift" aria-labelledby="gift-title">
          <div className="wrap">
            <h2 id="gift-title">{t("gift.title")}</h2>
            <p>{t("gift.text")}</p>
            <a className="btn btn-light" href="#kit">
              {t("gift.cta")}
            </a>
          </div>
        </section>

        <section className="section" id="faq" aria-labelledby="faq-title">
          <div className="wrap">
            <div className="section-head">
              <h2 id="faq-title">{t("faq.title")}</h2>
            </div>
            <div className="faq-list">
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
      <StickyBar watchId="hero-actions" />
    </>
  );
}
