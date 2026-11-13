import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageShell } from "@/components/PageShell";
import { brand } from "@/config/brand";
import { Link } from "@/i18n/navigation";
import { ActivateForm } from "./ActivateForm";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "activate" });
  return { title: `${t("title")} — ${brand.name}`, robots: { index: false } };
}

export default async function ActivatePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("activate");
  return (
    <PageShell narrow>
      <header className="flow-head">
        <p className="eyebrow">{t("eyebrow")}</p>
        <h1>{t("title")}</h1>
        <p>{t("lead")}</p>
      </header>
      <ActivateForm />
      <p className="flow-aside">
        {t("noKit")} <Link href="/commander">{t("order")}</Link>
        {" · "}
        <Link href="/guide/demo">{t("demo")}</Link>
      </p>
    </PageShell>
  );
}
