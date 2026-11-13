import { getTranslations } from "next-intl/server";
import { Gallery } from "./Gallery";
import { Link } from "@/i18n/navigation";
import { PlusIcon } from "./Icons";
import { KitFacts } from "./KitFacts";
import { KitBuyBox } from "./KitBuyBox";
import { accessories } from "@/config/catalog";

const INCLUDES = ["board", "thread", "code", "guide", "card"] as const;
const ACCORDION = ["box", "photo", "app", "gift"] as const;

/** Album : chaque portrait en fil est suivi de sa photo de départ. */
const portrait = (name: string, alt: string) => [
  { src: `/visuels/${name}-fil.webp`, alt },
  { src: `/visuels/${name}-photo.webp`, alt: `${alt}Photo` },
];
const GALLERY = [
  ...portrait("monalisa", "monalisa"),
  { src: "/visuels/planche-plan.webp", alt: "board" },
  ...portrait("salah", "salah"),
  ...portrait("benmhidi", "benmhidi"),
  ...portrait("soi", "self"),
  ...portrait("femme", "woman"),
  ...portrait("haik", "haik"),
  ...portrait("touareg", "tuareg"),
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
          <KitFacts />
          <p className="shop-lead">{t("lead")}</p>
          <p className="shop-desc">{t("description")}</p>
          <h3>{t("includesTitle")}</h3>
          <ul className="check-list">
            {INCLUDES.map((k) => (
              <li key={k}>{t(`includes.${k}`)}</li>
            ))}
          </ul>
          {price && orderingOpen ? (
            <KitBuyBox accessories={accessories} />
          ) : (
            <button type="button" className="btn btn-primary btn-lg btn-block" disabled>
              {t("ctaSoon")}
            </button>
          )}
          <p className="shop-note">
            <Link href="/activer">{t("haveCode")}</Link>
          </p>
          <p className="shop-note">
            {t("abroad")} <Link href={{ pathname: "/commander", query: { cadeau: "1" } }}>{t("abroadGift")}</Link>
            {" · "}
            <Link href="/numerique">{t("abroadDigital")}</Link>
          </p>
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
