import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Alexandria, DM_Sans, DM_Serif_Display, Noto_Naskh_Arabic } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { brand } from "@/config/brand";
import { direction, routing } from "@/i18n/routing";
import "@/styles/globals.css";

const dmSerif = DM_Serif_Display({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-dm-serif",
  display: "swap",
});
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", display: "swap" });
const naskh = Noto_Naskh_Arabic({ weight: ["500", "600"], subsets: ["arabic"], variable: "--font-naskh", display: "swap" });
const alexandria = Alexandria({ subsets: ["arabic", "latin"], variable: "--font-alexandria", display: "swap" });

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: t("title", { brand: brand.name }),
    description: t("description"),
    alternates: { languages: Object.fromEntries(routing.locales.map((l) => [l, `/${l}`])) },
  };
}

export const viewport: Viewport = { themeColor: "#2a1f1a" };

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const fonts = [dmSerif, dmSans, naskh, alexandria].map((f) => f.variable).join(" ");
  return (
    <html lang={locale} dir={direction(locale)} className={fonts} suppressHydrationWarning>
      <body>
        {/* Active les animations d'apparition seulement si JavaScript tourne (évite le contenu invisible). */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
