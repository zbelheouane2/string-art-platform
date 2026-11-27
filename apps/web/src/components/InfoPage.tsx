import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { brand } from "@/config/brand";
import { getContacts } from "@/lib/settings";
import { INFO_PAGES, type InfoPageKey } from "@/config/infoPages";
import { policies } from "@/config/policies";
import { Link } from "@/i18n/navigation";
import { displayPhone, ltr, whatsappUrl } from "@/lib/contact";
import { seoMetadata } from "@/lib/seoServer";
import { WhatsAppIcon } from "./ContactIcons";
import { PageShell } from "./PageShell";

type Section = { h: string; p: string[] };

/** Remplace {brand}, {min}, {max}, {report}, {refund} dans les textes bruts. */
function fill(text: string): string {
  const values: Record<string, string | number> = {
    brand: brand.name,
    min: policies.deliveryDays.min,
    max: policies.deliveryDays.max,
    report: policies.reportDays,
    refund: policies.refundDays,
  };
  return text.replace(/\{(\w+)\}/g, (m, k: string) => String(values[k] ?? m));
}

function formatDate(iso: string, locale: string): string {
  const tag = locale === "ar" ? "ar-u-nu-latn" : locale;
  return new Intl.DateTimeFormat(tag, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));
}

export async function infoPageMetadata(locale: string, page: InfoPageKey): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: `legal.${page}` });
  return seoMetadata({ locale, path: INFO_PAGES[page], title: `${t("title")} — ${brand.name}`, description: t("lead") });
}

/** Gabarit commun : titre, sections, vendeur, contact, autres pages. */
export async function InfoPage({ page, locale }: { page: InfoPageKey; locale: string }) {
  const t = await getTranslations("legal");
  const tf = await getTranslations("footer.infoLinks");
  const sections = t.raw(`${page}.sections`) as Section[];
  const c = await getContacts();
  const wa = whatsappUrl(c.whatsapp);
  const seller = [
    ["brand", brand.name],
    ["status", t("seller.statusValue")],
    ["anpdp", c.anpdp],
    ["email", c.supportEmail],
    ["sales", wa ? ltr(displayPhone(c.whatsapp)) : ""],
  ].filter(([, v]) => v);

  return (
    <PageShell narrow>
      <article className="info-page">
        <header className="flow-head">
          <h1>{t(`${page}.title`)}</h1>
          <p>{t(`${page}.lead`)}</p>
          <p className="info-updated">{t("updated", { date: formatDate(policies.updated, locale) })}</p>
        </header>
        {sections.map((s) => (
          <section key={s.h} className="info-section">
            <h2>{fill(s.h)}</h2>
            {s.p.map((p) => (
              <p key={p}>{fill(p)}</p>
            ))}
          </section>
        ))}
        <section className="info-section info-seller" aria-labelledby="seller-title">
          <h2 id="seller-title">{t("seller.title")}</h2>
          <dl>
            {seller.map(([k, v]) => (
              <div key={k}>
                <dt>{t(`seller.${k}`)}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </section>
        {wa && (
          <section className="form-card info-contact" aria-labelledby="contact-title">
            <h2 id="contact-title">{t("contactTitle")}</h2>
            <p>{t("contactText")}</p>
            <a className="btn btn-primary" href={wa} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon />
              {t("contactCta")}
            </a>
          </section>
        )}
        <nav className="info-related" aria-labelledby="related-title">
          <h2 id="related-title">{t("related")}</h2>
          <ul>
            {(Object.keys(INFO_PAGES) as InfoPageKey[])
              .filter((k) => k !== page)
              .map((k) => (
                <li key={k}>
                  <Link href={INFO_PAGES[k]}>{tf(k)}</Link>
                </li>
              ))}
          </ul>
        </nav>
      </article>
    </PageShell>
  );
}
