import { getTranslations } from "next-intl/server";
import { Gallery } from "./Gallery";
import { PlusIcon } from "./Icons";

const INCLUDES = ["board", "thread", "code", "guide", "card"] as const;
const ACCORDION = ["box", "photo", "app", "gift"] as const;

/** Album : chaque portrait en fil est suivi de sa photo de départ. */
const portrait = (name: string, alt: string) => [
  { src: `/visuels/${name}-fil.webp`, alt },
  { src: `/visuels/${name}-photo.webp`, alt: `${alt}Photo` },
];
const GALLERY = [
  { src: "/visuels/martyr-fil.webp", alt: "thread" },
  { src: "/visuels/planche-plan.webp", alt: "board" },
  { src: "/visuels/devidoir.webp", alt: "spool" },
  { src: "/visuels/martyr-photo.webp", alt: "photo" },
  ...portrait("salah", "salah"),
  ...portrait("benmhidi", "benmhidi"),
  ...portrait("soi", "self"),
  ...portrait("haik", "haik"),
  ...portrait("grandpere", "grandpa"),
  ...portrait("fillette", "girl"),
  ...portrait("bebe", "baby"),
  ...portrait("couple", "couple"),
  ...portrait("chat", "pet"),
];

/** Bloc d'achat (accueil et page du kit) : galerie qui glisse + colonne d'infos collante. */
export async function ProductSection({
  price,
  provisional = false,
  orderingOpen = false,
  headingLevel = 2,
}: {
  price: string | null;
  provisional?: boolean;
  orderingOpen?: boolean;
  headingLevel?: 1 | 2;
}) {
  const t = await getTranslations("shop");
  const Heading = headingLevel === 1 ? "h1" : "h2";
  return (
    <section className="section bg-cream product" id="acheter" aria-labelledby="shop-title">
      <div className="wrap shop-grid">
        <div data-reveal>
          <Gallery
            images={GALLERY.map((g) => ({ src: g.src, alt: t(`galleryAlt.${g.alt}`) }))}
          />
        </div>
        <div className="shop-info" data-reveal style={{ ["--i" as string]: 1 }}>
          <Heading id="shop-title">{t("title")}</Heading>
          <p className="shop-price">{price ?? t("priceSoon")}</p>
          {price && provisional && <p className="shop-price-note">{t("priceProvisional")}</p>}
          <p className="shop-lead">{t("lead")}</p>
          <p className="shop-desc">{t("description")}</p>
          <h3>{t("includesTitle")}</h3>
          <ul className="check-list">
            {INCLUDES.map((k) => (
              <li key={k}>{t(`includes.${k}`)}</li>
            ))}
          </ul>
          <button type="button" className="btn btn-primary btn-lg btn-block" disabled={!price || !orderingOpen}>
            {price && orderingOpen ? t("cta") : t("ctaSoon")}
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
