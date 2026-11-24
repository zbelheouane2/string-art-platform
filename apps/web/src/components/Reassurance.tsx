import { getTranslations } from "next-intl/server";
import { policies } from "@/config/policies";
import { Link } from "@/i18n/navigation";
import { getContacts } from "@/lib/settings";
import { displayPhone, ltr, whatsappUrl } from "@/lib/contact";
import { CashIcon, ShieldIcon, TruckIcon, WhatsAppIcon } from "./ContactIcons";

/** Engagements affichés sous le bouton d'achat : délai, paiement, garantie, contact. */
export async function Reassurance() {
  const t = await getTranslations("reassure");
  const c = await getContacts();
  const wa = whatsappUrl(c.whatsapp);
  const { min, max } = policies.deliveryDays;
  return (
    <ul className="reassure" aria-label={t("label")}>
      <li>
        <TruckIcon />
        <Link href="/livraison">{t("delivery", { min, max })}</Link>
      </li>
      <li>
        <CashIcon />
        <span>{t("cod")}</span>
      </li>
      <li>
        <ShieldIcon />
        <Link href="/retours">{t("guarantee")}</Link>
      </li>
      {wa && (
        <li>
          <WhatsAppIcon />
          <a href={wa} target="_blank" rel="noopener noreferrer">
            {t("help", { phone: ltr(displayPhone(c.whatsapp)) })}
          </a>
        </li>
      )}
    </ul>
  );
}
