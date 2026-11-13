import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageShell } from "@/components/PageShell";
import { brand } from "@/config/brand";
import { Link } from "@/i18n/navigation";

const INCLUDES = ["code", "software", "voice", "template", "materials"] as const;
const STEPS = ["buy", "print", "build", "thread"] as const;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "digital" });
  return { title: `${t("title")} — ${brand.name}`, description: t("lead") };
}

/**
 * Offre 100 % numérique pour la diaspora : code + logiciel + guide vocal +
 * gabarit imprimable de la planche. Paiement en ligne pas encore ouvert
 * (encaissement en devises à valider) : la page présente l'offre et renvoie
 * vers l'option « offrir un kit à un proche en Algérie ».
 */
export default async function DigitalPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("digital");
  return (
    <PageShell narrow>
      <header className="flow-head">
        <p className="eyebrow">{t("eyebrow")}</p>
        <h1>{t("title")}</h1>
        <p>{t("lead")}</p>
      </header>
      <div className="form-card">
        <h2 className="studio-title">{t("includesTitle")}</h2>
        <ul className="check-list">
          {INCLUDES.map((k) => (
            <li key={k}>{t(`includes.${k}`)}</li>
          ))}
        </ul>
        <h2 className="studio-title">{t("stepsTitle")}</h2>
        <ol className="num-list">
          {STEPS.map((k) => (
            <li key={k}>{t(`steps.${k}`)}</li>
          ))}
        </ol>
        <p className="shop-price">{t("price")}</p>
        <button type="button" className="btn btn-primary btn-lg btn-block" disabled>
          {t("soon")}
        </button>
        <p className="field-help">{t("soonHelp")}</p>
      </div>
      <p className="flow-aside">
        {t("meanwhile")} <Link href={{ pathname: "/commander", query: { cadeau: "1" } }}>{t("giftLink")}</Link>
        {" · "}
        <Link href="/guide/demo">{t("demoLink")}</Link>
      </p>
    </PageShell>
  );
}
