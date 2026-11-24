import { getTranslations } from "next-intl/server";
import { brand } from "@/config/brand";
import { getContacts } from "@/lib/settings";
import { INFO_PAGES, type InfoPageKey } from "@/config/infoPages";
import { Link } from "@/i18n/navigation";
import { displayPhone, ltr, socialLinks, whatsappUrl } from "@/lib/contact";
import { MailIcon, SOCIAL_ICONS, WhatsAppIcon } from "./ContactIcons";
import { ConsentSettingsButton } from "./Analytics";
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
  const c = await getContacts();
  const wa = whatsappUrl(c.whatsapp);
  const social = socialLinks({ instagram: c.instagram, facebook: c.facebook, tiktok: c.tiktok });
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
            <li>
              <Link href="/activer">{t("links.code")}</Link>
            </li>
            <li>
              <Link href="/guide/demo">{t("links.guideDemo")}</Link>
            </li>
            <li>
              <Link href={{ pathname: "/commander", query: { cadeau: "1" } }}>{t("links.giftAbroad")}</Link>
            </li>
            <li>
              <Link href="/numerique">{t("links.digital")}</Link>
            </li>
          </ul>
        </nav>
        <nav aria-labelledby="footer-info">
          <h2 id="footer-info">{t("info")}</h2>
          <ul>
            <li>
              <Link href="/kit">{t("infoLinks.kitPage")}</Link>
            </li>
            {(Object.keys(INFO_PAGES) as InfoPageKey[]).map((k) => (
              <li key={k}>
                <Link href={INFO_PAGES[k]}>{t(`infoLinks.${k}`)}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <div id="contact">
          <h2>{t("contact")}</h2>
          <p>{t("contactText")}</p>
          <ul className="footer-contact">
            {wa && (
              <li>
                <a href={wa} target="_blank" rel="noopener noreferrer">
                  <WhatsAppIcon />
                  {t("whatsapp", { phone: ltr(displayPhone(c.whatsapp)) })}
                </a>
              </li>
            )}
            {c.supportEmail && (
              <li>
                <a href={`mailto:${c.supportEmail}`}>
                  <MailIcon />
                  {c.supportEmail}
                </a>
              </li>
            )}
          </ul>
          {social.length > 0 && (
            <>
              <h2 className="footer-social-title">{t("social")}</h2>
              <ul className="footer-social">
                {social.map(({ key, url }) => {
                  const Icon = SOCIAL_ICONS[key];
                  return (
                    <li key={key}>
                      <a href={url} target="_blank" rel="noopener noreferrer" aria-label={t(`socialNames.${key}`)}>
                        <Icon width={22} height={22} />
                      </a>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
        <div className="footer-lang">
          <LanguageSwitcher />
        </div>
      </div>
      <div className="wrap footer-bottom">
        <p>
          {t("rights", { year: new Date().getFullYear(), brand: brand.name })}
          <ConsentSettingsButton />
        </p>
      </div>
    </footer>
  );
}
