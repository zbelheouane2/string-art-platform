import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { InfoPage, infoPageMetadata } from "@/components/InfoPage";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return infoPageMetadata(locale, "terms");
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <InfoPage page="terms" locale={locale} />;
}
