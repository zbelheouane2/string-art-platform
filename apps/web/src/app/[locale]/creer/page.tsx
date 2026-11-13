import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageShell } from "@/components/PageShell";
import { brand } from "@/config/brand";
import { commerce } from "@/config/commerce";
import { redirect } from "@/i18n/navigation";
import { codeState } from "@/lib/portraits";
import { currentCodeId } from "@/lib/session";
import { PortraitStudio } from "./PortraitStudio";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "create" });
  return { title: `${t("title")} — ${brand.name}`, robots: { index: false } };
}

export default async function CreatePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const codeId = await currentCodeId();
  const state = codeId ? await codeState(codeId) : null;
  if (!state || state.status === "DISABLED") redirect({ href: "/activer", locale });
  if (state!.chosenId) redirect({ href: `/guide/${state!.chosenId}`, locale });
  const t = await getTranslations("create");
  return (
    <PageShell>
      <header className="flow-head">
        <p className="eyebrow">{t("eyebrow")}</p>
        <h1>{t("title")}</h1>
        <p>{t("lead")}</p>
      </header>
      <PortraitStudio remaining={state!.remaining} maxBytes={commerce.maxPhotoBytes} />
    </PageShell>
  );
}
