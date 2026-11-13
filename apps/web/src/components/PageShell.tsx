import { getTranslations } from "next-intl/server";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

/** Gabarit des pages du parcours (code, création, guide, commande). */
export async function PageShell({ children, narrow = false }: { children: React.ReactNode; narrow?: boolean }) {
  const t = await getTranslations("a11y");
  return (
    <>
      <a className="skip" href="#main">
        {t("skip")}
      </a>
      <SiteHeader />
      <main id="main" className="flow-page">
        <div className={narrow ? "wrap flow-wrap narrow" : "wrap flow-wrap"}>{children}</div>
      </main>
      <SiteFooter />
    </>
  );
}
