import "server-only";
import { randomInt } from "node:crypto";
import { accessories as accessoryCatalog } from "@/config/catalog";
import { commerce } from "@/config/commerce";
import { CODE_ALPHABET } from "./codes";
import { db } from "./db";
import type { ValidOrder } from "./orderSchema";
import { orderRow, sendOrderToSheet } from "./notify/orderSheet";
import { paymentProvider } from "./payments";
import type { Price } from "./price";

export interface CheckoutOptions {
  marketId: string;
  product: { id: string; slug: string; names: Record<string, string> };
  price: Price;
  delivery: string[];
  payment: string[];
  /** Frais connus : mode de livraison → wilaya → montant (unité mineure). */
  rates: Record<string, Record<string, number>>;
  /** Options proposables (actives et avec un prix sur ce marché, dans la devise du kit). */
  accessories: CheckoutAccessory[];
}

export interface CheckoutAccessory {
  id: string;
  slug: string;
  icon: "stand" | "candle";
  names: { fr: string; en: string; ar: string };
  price: Price;
}

/**
 * Ce que le client peut choisir sur un marché : prix du kit, modes de livraison
 * et moyens de paiement actifs (et dont l'adaptateur est configuré).
 * Renvoie null si le kit n'a pas de prix sur ce marché (vente fermée).
 */
export async function checkoutOptions(marketCode = commerce.defaultMarket): Promise<CheckoutOptions | null> {
  const market = await db().market.findUnique({
    where: { code: marketCode },
    include: {
      deliveryMethods: { where: { active: true }, orderBy: { code: "asc" }, include: { rates: true } },
      paymentMethods: { where: { active: true }, include: { paymentMethod: true } },
    },
  });
  if (!market?.active) return null;
  const product = await db().product.findUnique({ where: { slug: commerce.kitSlug } });
  if (!product?.active) return null;
  const price = await db().price.findUnique({ where: { productId_marketId: { productId: product.id, marketId: market.id } } });
  if (!price) return null;
  const payment = market.paymentMethods
    .filter((m) => paymentProvider(m.paymentMethod.provider))
    .map((m) => m.paymentMethod.code)
    .sort((a, b) => (a === "cod" ? -1 : b === "cod" ? 1 : a.localeCompare(b)));
  if (payment.length === 0 || market.deliveryMethods.length === 0) return null;
  const extras = await db().product.findMany({
    where: { kind: "ACCESSORY", active: true },
    include: { prices: { where: { marketId: market.id, currency: price.currency } } },
  });
  // Ordre et icône du catalogue ; une option sans prix sur ce marché n'est pas proposée.
  const accessories = accessoryCatalog.flatMap((a): CheckoutAccessory[] => {
    const p = extras.find((e) => e.slug === a.slug);
    if (!p?.prices[0]) return [];
    return [{ id: p.id, slug: a.slug, icon: a.icon, names: p.names as CheckoutAccessory["names"], price: { amountMinor: p.prices[0].amountMinor, currency: p.prices[0].currency } }];
  });
  return {
    marketId: market.id,
    product: { id: product.id, slug: product.slug, names: product.names as Record<string, string> },
    price: { amountMinor: price.amountMinor, currency: price.currency },
    // Domicile d'abord, puis bureau.
    delivery: market.deliveryMethods.map((d) => d.code).sort((a, b) => Number(b.endsWith("_home")) - Number(a.endsWith("_home"))),
    payment,
    rates: Object.fromEntries(
      market.deliveryMethods.map((d) => [d.code, Object.fromEntries(d.rates.filter((r) => r.currency === price.currency).map((r) => [r.zone, r.amountMinor]))]),
    ),
    accessories,
  };
}

function orderNumber(): string {
  let s = "";
  for (let i = 0; i < 6; i++) s += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  return `DK-${s}`;
}

export type CreateOrderResult = { ok: true; number: string; redirect: string | null } | { ok: false; error: "closed" | "delivery" | "payment" | "unavailable" };

/**
 * Enregistre une commande déjà validée par `orderSchema`. Le prix vient
 * toujours de la base, jamais du navigateur.
 */
export async function createOrder(input: ValidOrder, baseUrl: string): Promise<CreateOrderResult> {
  const options = await checkoutOptions();
  if (!options) return { ok: false, error: "closed" };
  if (!options.delivery.includes(input.delivery)) return { ok: false, error: "delivery" };
  if (!options.payment.includes(input.payment)) return { ok: false, error: "payment" };
  // Options : uniquement celles proposées avec un prix ; une par commande (pas multipliée par la quantité de kits).
  const extras = input.options.map((slug) => options.accessories.find((a) => a.slug === slug));
  if (extras.some((a) => !a)) return { ok: false, error: "unavailable" };
  const chosen = extras as CheckoutAccessory[];

  const [delivery, method] = await Promise.all([
    db().deliveryMethod.findUniqueOrThrow({ where: { marketId_code: { marketId: options.marketId, code: input.delivery } } }),
    db().paymentMethod.findUniqueOrThrow({ where: { code: input.payment } }),
  ]);
  const provider = paymentProvider(method.provider);
  if (!provider) return { ok: false, error: "payment" };

  // Frais de livraison lus en base ; inconnus = confirmés par téléphone (null).
  const fee = options.rates[input.delivery]?.[input.wilaya] ?? null;
  const extrasTotal = chosen.reduce((sum, a) => sum + a.price.amountMinor, 0);
  const total = options.price.amountMinor * input.quantity + extrasTotal + (fee ?? 0);
  const order = await db().$transaction(async (tx) => {
    // Le client est la personne qui passe la commande : l'acheteur pour un cadeau, sinon le destinataire.
    const customer = await tx.customer.create({
      data: input.buyer
        ? { fullName: input.buyer.name, phone: input.buyer.phone, locale: input.locale }
        : { fullName: input.fullName, phone: input.phone, locale: input.locale },
    });
    for (let attempt = 0; ; attempt++) {
      const number = orderNumber();
      if (attempt < 5 && (await tx.order.findUnique({ where: { number }, select: { id: true } }))) continue;
      return tx.order.create({
        data: {
          number,
          customerId: customer.id,
          marketId: options.marketId,
          deliveryMethodId: delivery.id,
          currency: options.price.currency,
          deliveryFeeMinor: fee,
          totalMinor: total,
          shippingAddress: {
            recipient: { fullName: input.fullName, phone: input.phone },
            wilaya: input.wilaya,
            commune: input.commune,
            note: input.note,
            gift: input.buyer ? { buyerEmail: input.buyer.email, message: input.giftMessage } : null,
          },
          items: {
            create: [
              { productId: options.product.id, quantity: input.quantity, unitPriceMinor: options.price.amountMinor },
              ...chosen.map((a) => ({ productId: a.id, quantity: 1, unitPriceMinor: a.price.amountMinor })),
            ],
          },
          payments: { create: { paymentMethodId: method.id, amountMinor: total, currency: options.price.currency } },
        },
        include: { payments: true },
      });
    }
  });

  const start = await provider.start({
    orderId: order.id,
    orderNumber: order.number,
    amountMinor: total,
    currency: order.currency,
    locale: input.locale,
    returnUrl: `${baseUrl}/${input.locale}/commande/${order.number}`,
  });
  if (start.kind === "redirect") {
    await db().payment.update({ where: { id: order.payments[0].id }, data: { providerRef: start.providerRef } });
  }
  const sheet = await sendOrderToSheet(
    orderRow({
      number: order.number,
      createdAt: order.createdAt.toISOString(),
      fullName: input.fullName,
      phone: input.phone,
      wilayaCode: input.wilaya,
      commune: input.commune,
      delivery: input.delivery,
      payment: input.payment,
      quantity: input.quantity,
      options: chosen.map((a) => a.names.fr).join(" ; "),
      deliveryFee: fee === null ? null : fee / 100,
      total: total / 100,
      currency: order.currency,
      note: input.note,
      locale: input.locale,
      gift: input.buyer ? "oui" : "non",
      buyerName: input.buyer?.name ?? "",
      buyerPhone: input.buyer?.phone ?? "",
      buyerEmail: input.buyer?.email ?? "",
      giftMessage: input.giftMessage,
    }),
  );
  // Journal sans données personnelles : numéro, montant et état de l'envoi vers la feuille.
  await db().auditLog.create({ data: { actor: "system", action: "order.created", target: order.number, meta: { totalMinor: total, payment: input.payment, sheet } } });
  if (sheet === "failed") console.error(`commande ${order.number} : envoi vers la Google Sheet échoué (commande bien enregistrée en base)`);
  return { ok: true, number: order.number, redirect: start.kind === "redirect" ? start.url : null };
}
