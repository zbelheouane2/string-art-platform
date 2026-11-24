import { getTranslations } from "next-intl/server";
import { getSetting, pickAnnouncement } from "@/lib/settings";

/** Bande d'annonce en haut de page : message programmé (offre d'occasion), sinon message permanent, sinon texte d'origine. */
export async function AnnouncementBar({ locale }: { locale: string }) {
  const a = pickAnnouncement(await getSetting("announcement"), locale);
  if (a.hidden) return null;
  const t = await getTranslations();
  return <p className="announcement">{a.text ?? t("announcement")}</p>;
}
