import "server-only";
import { cache } from "react";
import { brand } from "@/config/brand";
import { db } from "@/lib/db";
import { announcementSchema, contactsSchema, faqSchema, googleSheetSchema, imagesSchema, seoSchema, type Announcement, type Contacts, type FaqSettings, type GoogleSheetSettings, type SeoOverrides } from "./settingsSchemas";

export * from "./settingsSchemas";

/**
 * Réglages modifiables dans l'espace admin (table Setting, une ligne JSON par
 * réglage). Chaque réglage a un schéma et une valeur par défaut : si la base
 * ne répond pas ou si la valeur est invalide, le site garde la valeur par
 * défaut (variables d'environnement, fichiers de traduction) et reste en ligne.
 */
const DEFAULTS = {
  announcement: { base: { fr: "", en: "", ar: "" }, scheduled: [], hidden: false } as Announcement,
  contacts: {
    whatsapp: brand.whatsapp,
    supportEmail: brand.supportEmail,
    instagram: brand.social.instagram,
    facebook: brand.social.facebook,
    tiktok: brand.social.tiktok,
    anpdp: brand.legal.anpdp,
  } as Contacts,
  googleSheet: {
    url: process.env.ORDER_SHEET_URL ?? "",
    secret: process.env.ORDER_SHEET_SECRET ?? "",
    enabled: !!process.env.ORDER_SHEET_URL,
    syncStatus: false,
    lastTestAt: null,
    lastTestOk: null,
  } as GoogleSheetSettings,
  images: {} as Record<string, string>,
  seo: {} as SeoOverrides,
  faq: { hidden: [], extra: [] } as FaqSettings,
};

const SCHEMAS = { announcement: announcementSchema, contacts: contactsSchema, googleSheet: googleSheetSchema, images: imagesSchema, seo: seoSchema, faq: faqSchema };
export type SettingKey = keyof typeof DEFAULTS;
type SettingValue<K extends SettingKey> = (typeof DEFAULTS)[K];

/** Lecture d'un réglage (une fois par requête), avec repli sur la valeur par défaut. */
export const getSetting = cache(async <K extends SettingKey>(key: K): Promise<SettingValue<K>> => {
  try {
    const row = await db().setting.findUnique({ where: { key } });
    if (!row) return DEFAULTS[key];
    const merged = key === "images" || key === "seo" ? row.value : { ...DEFAULTS[key], ...(row.value as object) };
    const parsed = SCHEMAS[key].safeParse(merged);
    return parsed.success ? (parsed.data as SettingValue<K>) : DEFAULTS[key];
  } catch {
    return DEFAULTS[key];
  }
});

export async function saveSetting<K extends SettingKey>(key: K, value: SettingValue<K>, updatedBy: string): Promise<void> {
  const parsed = SCHEMAS[key].parse(value);
  await db().setting.upsert({ where: { key }, update: { value: parsed as object, updatedBy }, create: { key, value: parsed as object, updatedBy } });
}

export const getContacts = () => getSetting("contacts");

/** Adresse d'une photo du site : celle choisie dans l'admin, sinon celle d'origine. */
export async function siteImage(slot: string, fallback: string): Promise<string> {
  return (await getSetting("images"))[slot] || fallback;
}
