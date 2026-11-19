import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageShell } from "@/components/PageShell";
import { brand } from "@/config/brand";
import { TrackForm } from "./TrackForm";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "track" });
  return { title: `${t("title")} — ${brand.name}`, robots: { index: false } };
}

export default async function TrackPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("track");
  return (
    <PageShell narrow>
      <header className="flow-head">
        <h1>{t("title")}</h1>
        <p>{t("lead")}</p>
      </header>
      <TrackForm />
    </PageShell>
  );
}
