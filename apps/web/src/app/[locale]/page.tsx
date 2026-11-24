import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Metadata } from "next";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { FaqList } from "@/components/FaqList";
import { getContacts, getSetting } from "@/lib/settings";
import { slotFallback } from "@/config/imageSlots";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BeforeAfter } from "@/components/BeforeAfter";
import { GiftIcon, HeartThreadIcon } from "@/components/Icons";
import { NailRing } from "@/components/NailRing";
import { ProductSection } from "@/components/ProductSection";
import { Reveal } from "@/components/Reveal";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { Reviews } from "@/components/Reviews";
import { StepsCarousel } from "@/components/StepsCarousel";
import { StickyBar } from "@/components/StickyBar";
import { WeavingBoard } from "@/components/WeavingBoard";
import { brand } from "@/config/brand";
import { kitOffer } from "@/config/catalog";
import { formatPrice } from "@/lib/price";
import { shopCatalog } from "@/lib/shop";
import { howSteps } from "@/config/howSteps";
import { Link } from "@/i18n/navigation";
import type { DemoPortrait } from "@/lib/board";
import { seoMetadata } from "@/lib/seoServer";
import { JsonLd } from "@/components/JsonLd";
import { kitProductJsonLd, organizationJsonLd } from "@/lib/structuredData";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return seoMetadata({ locale, path: "", title: t("title", { brand: brand.name }), description: t("description") });
}

const TRUST = ["cod", "delivery", "voice", "nails"] as const;
const PROOF = ["cod", "nails", "voice"] as const;
const GIFTS = [
  { key: "couples", name: "couple" },
  { key: "parents", name: "haik" },
  { key: "grandparents", name: "fillette" },
  { key: "pets", name: "chat" },
  { key: "memory", name: "benmhidi" },
  { key: "self", name: "soi" },
  { key: "occasion", name: "bebe", occasions: ["birth", "birthday", "wedding", "memory", "other"] },
] as const;
const INTRO = ["gift", "hobby"] as const;

async function loadDemo(): Promise<DemoPortrait> {
  const file = path.join(process.cwd(), "public", "demo", "portrait-demo.json");
  return JSON.parse(await readFile(file, "utf-8"));
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const demo = await loadDemo();
  // Prix lus en base (modifiables dans l'admin), repli sur la configuration.
  const catalog = await shopCatalog();
  // Photos remplacées dans l'admin (rubrique Photos), sinon celles d'origine.
  const images = await getSetting("images");
  const im = (slot: string) => images[slot] || slotFallback(slot);
  const price = catalog ? formatPrice(catalog.kit.price, locale) : null;
  const extras = catalog?.accessories.map((a) => ({ slug: a.slug, icon: a.icon!, names: a.names, price: a.price })) ?? [];

  return (
    <>
      <a className="skip" href="#main">
        {t("a11y.skip")}
      </a>
      <AnnouncementBar locale={locale} />
      <SiteHeader />
      <main id="main">
        <JsonLd data={organizationJsonLd(locale, await getContacts())} />
        {catalog && <JsonLd data={kitProductJsonLd(catalog, locale, t("meta.description"))} />}
        {/* Héros : carte visuelle (pastille + médaillon) et texte avec ligne de preuves. */}
        <section className="hero" aria-labelledby="hero-title">
          <div className="wrap hero-grid">
            <div className="hero-media">
              <span className="badge">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="8" width="18" height="13" rx="1.5" />
                  <path d="M12 8v13M3 12h18M12 8c-2-4-6-4-6-1.5S9 8 12 8zm0 0c2-4 6-4 6-1.5S15 8 12 8z" />
                </svg>
                {t("hero.badge")}
              </span>
              <WeavingBoard demo={demo} />
              <figure className="medallion">
                <img src={im("home.medallion")} alt={t("hero.medallion")} width={300} height={300} />
              </figure>
            </div>
            <div className="hero-copy">
              <h1 id="hero-title">
                {t("hero.titleStart")} <em>{t("hero.titleAccent")}</em>
              </h1>
              <p className="hero-lead">{t("hero.lead")}</p>
              <p className="hero-price">
                <strong>{price ?? t("shop.priceSoon")}</strong>
                <span>{t("hero.priceNote")}</span>
              </p>
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

        {/* Qu'est-ce que c'est : deux blocs (cadeau, loisir) et une photo. */}
        <section className="section bg-sand" id="decouvrir" aria-labelledby="intro-title">
          <div className="wrap">
            <div className="intro-card" data-reveal>
              <div className="intro-copy">
                <h2 id="intro-title">{t("home.intro.title", { brand: brand.name })}</h2>
                {INTRO.map((k) => (
                  <div key={k} className="intro-block">
                    <span className="intro-icon" aria-hidden="true">
                      {k === "gift" ? <GiftIcon /> : <HeartThreadIcon />}
                    </span>
                    <div>
                      <h3>{t(`home.intro.${k}.title`)}</h3>
                      <p>{t(`home.intro.${k}.text`)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <img className="intro-img" src={im("home.intro")} alt={t("home.intro.imgAlt")} width={1000} height={1000} loading="lazy" />
            </div>
          </div>
        </section>

        {/* Comment ça marche : carrousel, grande image + onglets à icônes. */}
        <section className="section bg-cream" id="comment" aria-labelledby="how-title">
          <div className="wrap">
            <header className="section-head center" data-reveal>
              <h2 id="how-title">{t("kit.how.title")}</h2>
              <p>{t("kit.how.lead")}</p>
            </header>
            <div data-reveal>
              <StepsCarousel id="how-home" title={t("kit.how.eyebrow")} steps={howSteps(t, locale)} />
            </div>
          </div>
        </section>

        {/* De la photo au fil : carte avec texte et grand curseur rond photo ↔ fil. */}
        <section className="section bg-cream transform" aria-labelledby="transform-title">
          <div className="wrap">
            <div className="transform-card" data-reveal>
              <div className="transform-copy">
                <h2 id="transform-title">{t("home.transform.title")}</h2>
                <p className="transform-text">{t("home.transform.text")}</p>
                <a className="btn btn-primary btn-lg" href="#acheter">
                  {t("home.transform.cta")}
                </a>
              </div>
              <div className="transform-media">
                <BeforeAfter photo={im("home.transform.photo")} thread={im("home.transform.thread")} round hint />
                <p className="ba-hint-below">{t("what.slider.hint")}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Vers la fiche du kit : grande carte entièrement cliquable (photo, titre, bouton). */}
        <section className="section bg-cream" aria-labelledby="kitcard-title">
          <div className="wrap">
            <Link href="/kit" className="kit-card" data-reveal>
              <img src={im("home.kitCard")} alt={t("home.kitCard.alt")} width={1000} height={1000} loading="lazy" />
              <span className="kit-card-body">
                <span className="kit-card-eyebrow">{t("home.kitCard.eyebrow")}</span>
                <span className="kit-card-title" id="kitcard-title" role="heading" aria-level={2}>
                  {t("home.kitCard.title")}
                </span>
                <span className="kit-card-text">{t("home.kitCard.text")}</span>
                <span className="btn btn-primary btn-lg kit-card-cta">
                  {t("home.kitCard.cta")}
                  <span aria-hidden="true"> →</span>
                </span>
              </span>
            </Link>
          </div>
        </section>

        <ProductSection accessories={extras} price={price} provisional={kitOffer.provisional} orderingOpen={catalog?.orderingOpen ?? false} />

        {/* Idées cadeaux : en-tête scindé, cartes-liens avec petite œuvre superposée. */}
        <section className="section bg-cream" id="cadeaux" aria-labelledby="gifts-title">
          <div className="wrap">
            <header className="section-head split-head" data-reveal>
              <div>
                <h2 id="gifts-title">{t("gifts.title")}</h2>
              </div>
              <p>{t("gifts.lead")}</p>
            </header>
            <ul className="gift-grid">
              {GIFTS.map((g, i) => (
                <li key={g.key} data-reveal style={{ ["--i" as string]: i % 3 }} className={"occasions" in g ? "gift-wide" : undefined}>
                  <a className="gift-card" href="#acheter">
                    <div className="gift-img">
                      {g.name ? <img src={im(`gifts.${g.key}.photo`)} alt="" width={600} height={600} loading="lazy" /> : <NailRing />}
                      <span className="gift-placeholder">{t("gifts.placeholder")}</span>
                      {g.name && (
                        <span className="gift-art" aria-hidden="true">
                          <img src={im(`gifts.${g.key}.thread`)} alt="" width={240} height={240} loading="lazy" />
                        </span>
                      )}
                    </div>
                    <h3>{t(`gifts.items.${g.key}.title`)}</h3>
                    <p>{t(`gifts.items.${g.key}.text`)}</p>
                    {"occasions" in g && (
                      <ul className="gift-occasions">
                        {g.occasions.map((o) => (
                          <li key={o}>{t(`gifts.items.${g.key}.occasions.${o}`)}</li>
                        ))}
                      </ul>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Avis clients : masqués tant qu'il n'y a pas de vrais avis (config/reviews.ts). */}
        <Reviews />

        {/* FAQ : intro avec bouton contour, accordéon. */}
        <section className="section bg-sand" id="faq" aria-labelledby="faq-title">
          <div className="wrap faq-grid">
            <header className="section-head" data-reveal>
              <h2 id="faq-title">{t("faq.title")}</h2>
              <p>{t("faq.lead")}</p>
              <Link className="btn btn-outline btn-lg faq-contact" href="/contact">
                {t("faq.contact")}
              </Link>
            </header>
            <div className="faq-list" data-reveal style={{ ["--i" as string]: 1 }}>
              <FaqList locale={locale} />
            </div>
          </div>
        </section>

        {/* Appel final : œuvre ronde + titre, prix, bouton. */}
        <section className="section bg-cream final" aria-labelledby="final-title">
          <div className="wrap final-inner" data-reveal>
            <img src={im("home.final")} alt="" width={240} height={240} loading="lazy" className="final-img" />
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
      <StickyBar watchId="hero-actions" price={price} orderingOpen={catalog?.orderingOpen ?? false} />
      <Reveal />
    </>
  );
}
