import { brand } from "@/config/brand";
import { wilayaName } from "@/config/wilayas";
import { whatsappUrl } from "@/lib/contact";
import { formatPrice } from "@/lib/price";

/**
 * Confirmation manuelle d'une commande par WhatsApp (avant l'API WhatsApp
 * Business) : l'admin ouvre wa.me avec un message prérempli dans la langue de
 * la commande, puis passe la commande en « Confirmée » d'un clic.
 */
export interface ConfirmationInput {
  number: string;
  locale: string;
  /** Nom complet de la personne à contacter ; seul le prénom est repris. */
  fullName: string;
  phone: string;
  /** Articles : quantité et nom par langue. */
  items: { quantity: number; names: Record<string, string> }[];
  totalMinor: number;
  currency: string;
  /** Frais de livraison encore inconnus (total sans livraison). */
  deliveryPending?: boolean;
  wilaya: string;
  /** Cadeau : on écrit à l'acheteur, le colis va au destinataire. */
  giftRecipient?: string | null;
}

/**
 * Numéro au format international sans « + » pour wa.me. Numéro algérien
 * local (05/06/07…) → 213XXXXXXXXX ; numéro déjà international conservé.
 */
export function waNumber(phone: string): string | null {
  const raw = phone.replace(/[\s.\-()]/g, "");
  const dz = /^(?:\+213|00213|213|0)([567]\d{8})$/.exec(raw);
  if (dz) return `213${dz[1]}`;
  const intl = /^(?:\+|00)([1-9]\d{7,14})$/.exec(raw);
  return intl ? intl[1] : null;
}

const firstName = (full: string) => full.trim().split(/\s+/)[0] ?? "";

function itemsText(items: ConfirmationInput["items"], lang: "fr" | "ar" | "en"): string {
  return items.map((i) => `${i.quantity} × ${i.names[lang] ?? i.names.fr ?? ""}`).join(", ");
}

/** Message prérempli : prénom, kit, prix, wilaya, demande de confirmation. */
export function confirmationMessage(o: ConfirmationInput): string {
  const lang = o.locale === "ar" ? "ar" : o.locale === "en" ? "en" : "fr";
  const name = firstName(o.fullName);
  const kit = itemsText(o.items, lang);
  const price = formatPrice({ amountMinor: o.totalMinor, currency: o.currency }, lang);
  const wilaya = wilayaName(o.wilaya, lang) ?? o.wilaya;
  if (lang === "ar") {
    return [
      `السلام عليكم ${name}،`,
      `شكرا على طلبك من ${brand.name} (رقم الطلب ${o.number}).`,
      `الطلب: ${kit}${o.giftRecipient ? ` (هدية إلى ${o.giftRecipient})` : ""}`,
      `المبلغ الإجمالي: ${price}${o.deliveryPending ? " + التوصيل" : ""}`,
      `الولاية: ${wilaya}`,
      `هل تؤكد الطلب؟ أجب بـ «نعم» من فضلك.`,
    ].join("\n");
  }
  if (lang === "en") {
    return [
      `Hello ${name},`,
      `Thank you for your ${brand.name} order (${o.number}).`,
      `Order: ${kit}${o.giftRecipient ? ` (gift for ${o.giftRecipient})` : ""}`,
      `Total: ${price}${o.deliveryPending ? " + delivery" : ""}`,
      `Wilaya: ${wilaya}`,
      `Can you confirm your order? Just reply "yes".`,
    ].join("\n");
  }
  return [
    `Bonjour ${name},`,
    `Merci pour votre commande ${brand.name} (n° ${o.number}).`,
    `Commande : ${kit}${o.giftRecipient ? ` (cadeau pour ${o.giftRecipient})` : ""}`,
    `Total : ${price}${o.deliveryPending ? " + livraison" : ""}`,
    `Wilaya : ${wilaya}`,
    `Pouvez-vous confirmer votre commande ? Répondez simplement « oui ».`,
  ].join("\n");
}

/** Lien wa.me prêt à ouvrir, ou null si le numéro est inutilisable. */
export function confirmationLink(o: ConfirmationInput): string | null {
  const number = waNumber(o.phone);
  return number ? whatsappUrl(number, confirmationMessage(o)) : null;
}
