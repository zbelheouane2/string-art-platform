import { z } from "zod";

/** Schémas des réglages de l'admin (sans accès à la base : testables). */
const texts = z.object({ fr: z.string().max(300), en: z.string().max(300), ar: z.string().max(300) });

export const announcementSchema = z.object({
  /** Message permanent (vide dans une langue : le texte d'origine du site est gardé). */
  base: texts,
  /** Messages programmés (offres d'occasion : Aïd, Fête des mères…), prioritaires pendant leurs dates. */
  scheduled: z
    .array(
      z.object({
        id: z.string(),
        label: z.string().max(60),
        texts,
        startsAt: z.string().nullable(),
        endsAt: z.string().nullable(),
        active: z.boolean(),
      }),
    )
    .max(30),
  /** Masquer complètement la bande d'annonce. */
  hidden: z.boolean(),
});
export type Announcement = z.infer<typeof announcementSchema>;

export const contactsSchema = z.object({
  whatsapp: z.string().max(20),
  supportEmail: z.string().max(120),
  instagram: z.string().max(300),
  facebook: z.string().max(300),
  tiktok: z.string().max(300),
  anpdp: z.string().max(80),
});
export type Contacts = z.infer<typeof contactsSchema>;

export const googleSheetSchema = z.object({
  url: z.string().max(400),
  secret: z.string().max(120),
  enabled: z.boolean(),
  /** Mettre aussi à jour la colonne « Statut » quand l'état d'une commande change. */
  syncStatus: z.boolean(),
  lastTestAt: z.string().nullable(),
  lastTestOk: z.boolean().nullable(),
});
export type GoogleSheetSettings = z.infer<typeof googleSheetSchema>;

/** Photos du site remplacées dans l'admin : emplacement → adresse de l'image. */
export const imagesSchema = z.record(z.string(), z.string().max(300));

/** Référencement par page : chemin (« », « /kit »…) → langue → titre et description pour Google. */
export const seoSchema = z.record(z.string(), z.record(z.string(), z.object({ title: z.string().max(70), description: z.string().max(170) })));
export type SeoOverrides = z.infer<typeof seoSchema>;

/** Questions ajoutées à la FAQ (après celles d'origine) et questions d'origine masquées. */
export const faqSchema = z.object({
  hidden: z.array(z.string()).max(20),
  extra: z.array(z.object({ id: z.string(), q: texts, a: z.object({ fr: z.string().max(1500), en: z.string().max(1500), ar: z.string().max(1500) }) })).max(30),
});
export type FaqSettings = z.infer<typeof faqSchema>;

/** Message de la bande d'annonce à afficher maintenant, ou null (texte d'origine). */
export function pickAnnouncement(a: Announcement, locale: string, now = new Date()): { text: string | null; hidden: boolean } {
  if (a.hidden) return { text: null, hidden: true };
  const key = (["fr", "en", "ar"].includes(locale) ? locale : "fr") as "fr" | "en" | "ar";
  const live = a.scheduled.find((s) => s.active && (!s.startsAt || new Date(s.startsAt) <= now) && (!s.endsAt || new Date(s.endsAt) >= now) && s.texts[key].trim());
  if (live) return { text: live.texts[key].trim(), hidden: false };
  return { text: a.base[key].trim() || null, hidden: false };
}

