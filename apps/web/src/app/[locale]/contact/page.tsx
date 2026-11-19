import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { WhatsAppIcon } from "@/components/ContactIcons";
import { PageShell } from "@/components/PageShell";
import { brand } from "@/config/brand";
import { pageMetadata } from "@/lib/seo";
import { displayPhone, ltr, whatsappUrl } from "@/lib/contact";
import { ContactForm } from "./ContactForm";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });
  return pageMetadata({ locale, path: "/contact", title: `${t("title")} — ${brand.name}`, description: t("lead") });
}

/**
 * Contact : pas de serveur de courrier pour l'instant, le formulaire prépare
 * un message WhatsApp que le client envoie lui-même (rien n'est stocké ici).
 */
export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("contact");
  const wa = whatsappUrl();
  return (
    <PageShell>
      <div className="contact-grid">
        <header className="contact-intro">
          <h1>{t("title")}</h1>
          <p>{t("lead")}</p>
          {wa && (
            <a className="contact-wa" href={wa} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon />
              <span>
                {t("whatsapp")} <strong dir="ltr">{ltr(displayPhone())}</strong>
              </span>
            </a>
          )}
          {brand.supportEmail && (
            <p>
              <a href={`mailto:${brand.supportEmail}`}>{brand.supportEmail}</a>
            </p>
          )}
          <p className="field-help">{t("hours")}</p>
        </header>
        {wa ? <ContactForm /> : <p className="form-card">{t("unavailable")}</p>}
      </div>
    </PageShell>
  );
}
