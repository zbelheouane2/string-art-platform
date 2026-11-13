import { getTranslations } from "next-intl/server";
import { brand } from "@/config/brand";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Logo } from "./Logo";

const LINKS = [
  ["acheter", "kit"],
  ["comment", "how"],
  ["cadeaux", "gift"],
  ["faq", "faq"],
] as const;

export async function SiteFooter() {
  const t = await getTranslations("footer");
  return (
    <footer className="site-footer">
      <div className="wrap footer-grid">
        <div className="footer-brand">
          <Logo tone="dark" />
          <p>{t("tagline")}</p>
        </div>
        <nav aria-labelledby="footer-menu">
          <h2 id="footer-menu">{t("menu")}</h2>
          <ul>
            {LINKS.map(([href, key]) => (
              <li key={key}>
                <Link href={{ pathname: "/", hash: href }}>{t(`links.${key}`)}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-labelledby="footer-info">
          <h2 id="footer-info">{t("info")}</h2>
          <ul>
            <li>
              <Link href="/kit">{t("infoLinks.kitPage")}</Link>
            </li>
            <li>
              <Link href={{ pathname: "/", hash: "faq" }}>{t("infoLinks.privacy")}</Link>
            </li>
            <li>
              <Link href={{ pathname: "/", hash: "faq" }}>{t("infoLinks.payment")}</Link>
            </li>
          </ul>
        </nav>
        <div id="contact">
          <h2>{t("contact")}</h2>
          <p>{t("contactText")}</p>
          {brand.supportEmail && <a href={`mailto:${brand.supportEmail}`}>{brand.supportEmail}</a>}
        </div>
        <div className="footer-lang">
          <LanguageSwitcher />
        </div>
      </div>
      <div className="wrap footer-bottom">
        <p>{t("rights", { year: new Date().getFullYear(), brand: brand.name })}</p>
      </div>
    </footer>
  );
}
