import { getTranslations } from "next-intl/server";
import { brand } from "@/config/brand";
import { LanguageSwitcher } from "./LanguageSwitcher";

export async function SiteFooter() {
  const t = await getTranslations("footer");
  return (
    <footer className="site-footer">
      <div className="wrap">
        <p className="wordmark">{brand.name}</p>
        <p>{t("tagline")}</p>
        <LanguageSwitcher />
        <p>{t("rights", { year: new Date().getFullYear(), brand: brand.name })}</p>
      </div>
    </footer>
  );
}
