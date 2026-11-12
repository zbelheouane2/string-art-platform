import { getTranslations } from "next-intl/server";
import { Gallery } from "./Gallery";
import { PlusIcon } from "./Icons";

const INCLUDES = ["board", "thread", "code", "guide"] as const;
const ACCORDION = ["box", "photo", "app", "gift"] as const;

/** Bloc d'achat (accueil et page du kit) : galerie qui glisse + colonne d'infos collante. */
export async function ProductSection({ price, headingLevel = 2 }: { price: string | null; headingLevel?: 1 | 2 }) {
  const t = await getTranslations("shop");
  const Heading = headingLevel === 1 ? "h1" : "h2";
  return (
    <section className="section bg-cream product" id="acheter" aria-labelledby="shop-title">
      <div className="wrap shop-grid">
        <div data-reveal>
          <Gallery
            images={[
              { src: "/visuels/astronaute-fil.webp", alt: t("galleryAlt.thread") },
              { src: "/visuels/devidoir.webp", alt: t("galleryAlt.spool") },
              { src: "/visuels/astronaute-photo.webp", alt: t("galleryAlt.photo") },
              { src: "/visuels/chat-fil.webp", alt: t("galleryAlt.pet") },
              { src: "/visuels/chat-photo.webp", alt: t("galleryAlt.petPhoto") },
              { src: "/visuels/photographe-fil.webp", alt: t("galleryAlt.portrait") },
              { src: "/visuels/photographe-photo.webp", alt: t("galleryAlt.portraitPhoto") },
            ]}
          />
        </div>
        <div className="shop-info" data-reveal style={{ ["--i" as string]: 1 }}>
          <Heading id="shop-title">{t("title")}</Heading>
          <p className="shop-price">{price ?? t("priceSoon")}</p>
          <p className="shop-lead">{t("lead")}</p>
          <p className="shop-desc">{t("description")}</p>
          <h3>{t("includesTitle")}</h3>
          <ul className="check-list">
            {INCLUDES.map((k) => (
              <li key={k}>{t(`includes.${k}`)}</li>
            ))}
          </ul>
          <button type="button" className="btn btn-primary btn-lg btn-block" disabled={!price}>
            {price ? t("cta") : t("ctaSoon")}
          </button>
          <p className="shop-note">{t("payment")}</p>
          <div className="faq-list shop-accordion">
            {ACCORDION.map((k) => (
              <details key={k}>
                <summary>
                  {t(`accordion.${k}.q`)}
                  <PlusIcon />
                </summary>
                <p>{t(`accordion.${k}.a`)}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
