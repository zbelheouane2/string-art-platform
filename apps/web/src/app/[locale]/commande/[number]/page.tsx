import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageShell } from "@/components/PageShell";
import { brand } from "@/config/brand";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/price";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "confirmation" });
  return { title: `${t("title")} — ${brand.name}`, robots: { index: false } };
}

/** Confirmation : numéro, montant et suite. Aucune donnée personnelle affichée. */
export default async function ConfirmationPage({ params }: { params: Promise<{ locale: string; number: string }> }) {
  const { locale, number } = await params;
  setRequestLocale(locale);
  if (!/^DK-[0-9A-Z]{6}$/.test(number)) notFound();
  const order = await db().order.findUnique({
    where: { number },
    select: { number: true, totalMinor: true, deliveryFeeMinor: true, currency: true, shippingAddress: true, payments: { select: { paymentMethod: { select: { code: true } } } } },
  });
  if (!order) notFound();
  const t = await getTranslations("confirmation");
  const cod = order.payments[0]?.paymentMethod.code === "cod";
  const gift = Boolean((order.shippingAddress as { gift?: unknown } | null)?.gift);
  return (
    <PageShell narrow>
      <header className="flow-head">
        <p className="eyebrow">{t("eyebrow")}</p>
        <h1>{t("title")}</h1>
        <p>{t("lead")}</p>
      </header>
      <div className="form-card">
        <p className="order-number">
          {t("number")} <strong dir="ltr">{order.number}</strong>
        </p>
        <p className="order-total">
          <span>{order.deliveryFeeMinor === null ? t("total") : t("totalWithDelivery")}</span>
          <strong>{formatPrice({ amountMinor: order.totalMinor, currency: order.currency }, locale)}</strong>
        </p>
        <ol className="num-list">
          <li>{gift ? t("next.giftCall") : t("next.call")}</li>
          <li>{cod ? (gift ? t("next.giftCod") : t("next.cod")) : t("next.paid")}</li>
          <li>{t("next.code")}</li>
        </ol>
      </div>
      <p className="flow-aside">
        <Link href="/guide/demo">{t("tryGuide")}</Link>
      </p>
    </PageShell>
  );
}
