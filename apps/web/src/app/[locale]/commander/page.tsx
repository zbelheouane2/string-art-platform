import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageShell } from "@/components/PageShell";
import { brand } from "@/config/brand";
import { commerce } from "@/config/commerce";
import { kitOffer } from "@/config/catalog";
import { checkoutOptions } from "@/lib/orders";
import { formatPrice } from "@/lib/price";
import { OrderForm } from "./OrderForm";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "order" });
  return { title: `${t("title")} — ${brand.name}`, robots: { index: false } };
}

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ cadeau?: string; options?: string }>;
}) {
  const { locale } = await params;
  const query = await searchParams;
  const gift = query.cadeau === "1";
  setRequestLocale(locale);
  const t = await getTranslations("order");
  const options = kitOffer.orderingOpen ? await checkoutOptions() : null;
  return (
    <PageShell narrow>
      <header className="flow-head">
        <p className="eyebrow">{t("eyebrow")}</p>
        <h1>{t("title")}</h1>
        {options && (
          <p>
            {options.product.names[locale] ?? options.product.names.fr} · {formatPrice(options.price, locale)}
            {kitOffer.provisional && ` (${t("provisional")})`}
          </p>
        )}
      </header>
      {options ? (
        <OrderForm
          price={options.price}
          rates={options.rates}
          delivery={options.delivery}
          payment={options.payment}
          maxQuantity={commerce.maxQuantity}
          giftDefault={gift}
          accessories={options.accessories}
          optionsDefault={(query.options ?? "").split(",").filter((s) => options.accessories.some((a) => a.slug === s))}
        />
      ) : (
        <p className="form-card">{t("closed")}</p>
      )}
    </PageShell>
  );
}
