import "server-only";
import { randomInt } from "node:crypto";
import { accessories as accessoryCatalog } from "@/config/catalog";
import { commerce } from "@/config/commerce";
import { NOT_SERVED, deliveryFee } from "@/lib/shipping/fee";
import { CODE_ALPHABET } from "./codes";
import { db } from "./db";
import type { ValidOrder } from "./orderSchema";
import { orderRow, sendOrderToSheet } from "./notify/orderSheet";
import { paymentProvider } from "./payments";
import { findPromo, promoUsesByPhone } from "./promo";
import { promoDiscount, promoMinimumMet } from "./promoRules";
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
  /** Sociétés de livraison actives et leurs modes (code du mode à domicile / au bureau). */
  carriers: CheckoutCarrier[];
}

export interface CheckoutCarrier {
  code: string;
  name: string;
  logoUrl: string | null;
  home: string | null;
  desk: string | null;
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
export async function checkoutOptions(
  marketCode = commerce.defaultMarket,
): Promise<CheckoutOptions | null> {
  const market = await db().market.findUnique({
    where: { code: marketCode },
    include: {
      deliveryMethods: {
        where: { active: true },
        orderBy: { code: "asc" },
        include: { rates: true },
      },
      paymentMethods: {
        where: { active: true },
        include: { paymentMethod: true },
      },
    },
  });
  if (!market?.active) return null;
  const product = await db().product.findUnique({
    where: { slug: commerce.kitSlug },
  });
  if (!product?.active) return null;
  const price = await db().price.findUnique({
    where: {
      productId_marketId: { productId: product.id, marketId: market.id },
    },
  });
  if (!price) return null;
  const payment = market.paymentMethods
    .filter((m) => paymentProvider(m.paymentMethod.provider))
    .map((m) => m.paymentMethod.code)
    .sort((a, b) => (a === "cod" ? -1 : b === "cod" ? 1 : a.localeCompare(b)));
  // Seules les sociétés actives (espace admin) proposent leurs modes de livraison.
  const activeCarriers = await db().carrier.findMany({
    where: { active: true },
    orderBy: { createdAt: "asc" },
  });
  const methods = market.deliveryMethods.filter((d) =>
    activeCarriers.some((c) => c.code === d.provider),
  );
  const carriers: CheckoutCarrier[] = activeCarriers
    .map((c) => ({
      code: c.code,
      name: c.name,
      logoUrl: c.logoUrl,
      home:
        methods.find((d) => d.provider === c.code && d.code.endsWith("_home"))
          ?.code ?? null,
      desk:
        methods.find((d) => d.provider === c.code && d.code.endsWith("_desk"))
          ?.code ?? null,
    }))
    .filter((c) => c.home || c.desk);
  if (payment.length === 0 || methods.length === 0) return null;
  const extras = await db().product.findMany({
    where: { kind: "ACCESSORY", active: true },
    include: {
      prices: { where: { marketId: market.id, currency: price.currency } },
    },
  });
  // Ordre et icône du catalogue ; une option sans prix sur ce marché n'est pas proposée.
  const accessories = accessoryCatalog.flatMap((a): CheckoutAccessory[] => {
    const p = extras.find((e) => e.slug === a.slug);
    if (!p?.prices[0]) return [];
    return [
      {
        id: p.id,
        slug: a.slug,
        icon: a.icon,
        names: p.names as CheckoutAccessory["names"],
        price: {
          amountMinor: p.prices[0].amountMinor,
          currency: p.prices[0].currency,
        },
      },
    ];
  });
  return {
    marketId: market.id,
    product: {
      id: product.id,
      slug: product.slug,
      names: product.names as Record<string, string>,
    },
    price: { amountMinor: price.amountMinor, currency: price.currency },
    // Domicile d'abord, puis bureau.
    delivery: methods
      .map((d) => d.code)
      .sort(
        (a, b) => Number(b.endsWith("_home")) - Number(a.endsWith("_home")),
      ),
    payment,
    rates: Object.fromEntries(
      methods.map((d) => [
        d.code,
        Object.fromEntries(
          d.rates
            .filter((r) => r.currency === price.currency)
            .map((r) => [r.zone, r.amountMinor]),
        ),
      ]),
    ),
    accessories,
    carriers,
  };
}

class PromoUsedUp extends Error {}

function orderNumber(): string {
  let s = "";
  for (let i = 0; i < 6; i++)
    s += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  return `DK-${s}`;
}

export type CreateOrderResult =
  | { ok: true; number: string; redirect: string | null }
  | {
      ok: false;
      error:
        | "closed"
        | "delivery"
        | "payment"
        | "unavailable"
        | "promoInvalid"
        | "promoExpired"
        | "promoMinimum"
        | "promoPerPhone"
        | "deliveryArea";
    };

/**
 * Enregistre une commande déjà validée par `orderSchema`. Le prix vient
 * toujours de la base, jamais du navigateur.
 */
export async function createOrder(
  input: ValidOrder,
  baseUrl: string,
): Promise<CreateOrderResult> {
  const options = await checkoutOptions();
  if (!options) return { ok: false, error: "closed" };
  if (!options.delivery.includes(input.delivery))
    return { ok: false, error: "delivery" };
  if (!options.payment.includes(input.payment))
    return { ok: false, error: "payment" };
  // Options : uniquement celles proposées avec un prix, chacune avec sa quantité (panier).
  const extras = input.options.map((o) => ({
    a: options.accessories.find((a) => a.slug === o.slug),
    quantity: o.quantity,
  }));
  if (extras.some((e) => !e.a)) return { ok: false, error: "unavailable" };
  const chosen = extras as { a: CheckoutAccessory; quantity: number }[];
  // Code promo relu en base (jamais le montant envoyé par le navigateur).
  const promo = input.promo ? await findPromo(input.promo) : null;
  if (promo && !promo.ok) return { ok: false, error: promo.error };

  const [delivery, method] = await Promise.all([
    db().deliveryMethod.findUniqueOrThrow({
      where: {
        marketId_code: { marketId: options.marketId, code: input.delivery },
      },
    }),
    db().paymentMethod.findUniqueOrThrow({ where: { code: input.payment } }),
  ]);
  const provider = paymentProvider(method.provider);
  if (!provider) return { ok: false, error: "payment" };

  // Frais de livraison lus en base ; wilaya absente de la grille du mode = non desservie.
  const quote = deliveryFee(options.rates, input.delivery, input.wilaya);
  if (quote === NOT_SERVED) return { ok: false, error: "deliveryArea" };
  const fee: number | null = quote;
  const extrasTotal = chosen.reduce(
    (sum, e) => sum + e.a.price.amountMinor * e.quantity,
    0,
  );
  const subtotal = options.price.amountMinor * input.quantity + extrasTotal;
  const basket = {
    kitMinor: options.price.amountMinor * input.quantity,
    itemsMinor: subtotal,
    feeMinor: fee,
  };
  if (promo?.ok && !promoMinimumMet(promo.rule, basket))
    return { ok: false, error: "promoMinimum" };
  // Plafond par client : même numéro de téléphone (celui de l'acheteur pour un cadeau).
  const customerPhone = input.buyer ? input.buyer.phone : input.phone;
  if (
    promo?.ok &&
    promo.maxUsesPerPhone !== null &&
    (await promoUsesByPhone(promo.rule.code, customerPhone)) >=
      promo.maxUsesPerPhone
  )
    return { ok: false, error: "promoPerPhone" };
  const discount = promo?.ok
    ? promoDiscount(promo.rule, basket, options.price.currency)
    : 0;
  const total = subtotal - discount + (fee ?? 0);
  const order = await db()
    .$transaction(async (tx) => {
      // Utilisation du code comptée dans la même transaction (plafond respecté même en cas de commandes simultanées).
      if (promo?.ok) {
        const used = await tx.promoCode.updateMany({
          where: {
            code: promo.rule.code,
            active: true,
            OR: [
              { maxUses: null },
              { uses: { lt: tx.promoCode.fields.maxUses } },
            ],
          },
          data: { uses: { increment: 1 } },
        });
        if (used.count === 0) throw new PromoUsedUp();
      }
      // Le client est la personne qui passe la commande : l'acheteur pour un cadeau, sinon le destinataire.
      const customer = await tx.customer.create({
        data: input.buyer
          ? {
              fullName: input.buyer.name,
              phone: input.buyer.phone,
              locale: input.locale,
            }
          : {
              fullName: input.fullName,
              phone: input.phone,
              locale: input.locale,
            },
      });
      for (let attempt = 0; ; attempt++) {
        const number = orderNumber();
        if (
          attempt < 5 &&
          (await tx.order.findUnique({
            where: { number },
            select: { id: true },
          }))
        )
          continue;
        return tx.order.create({
          data: {
            number,
            customerId: customer.id,
            marketId: options.marketId,
            deliveryMethodId: delivery.id,
            currency: options.price.currency,
            deliveryFeeMinor: fee,
            totalMinor: total,
            promoCode: promo?.ok ? promo.rule.code : null,
            discountMinor: discount,
            shippingAddress: {
              recipient: { fullName: input.fullName, phone: input.phone },
              wilaya: input.wilaya,
              commune: input.commune,
              note: input.note,
              gift: input.buyer
                ? { buyerEmail: input.buyer.email, message: input.giftMessage }
                : null,
            },
            items: {
              create: [
                {
                  productId: options.product.id,
                  quantity: input.quantity,
                  unitPriceMinor: options.price.amountMinor,
                },
                ...chosen.map((e) => ({
                  productId: e.a.id,
                  quantity: e.quantity,
                  unitPriceMinor: e.a.price.amountMinor,
                })),
              ],
            },
            payments: {
              create: {
                paymentMethodId: method.id,
                amountMinor: total,
                currency: options.price.currency,
              },
            },
          },
          include: { payments: true },
        });
      }
    })
    .catch((e: unknown) => {
      if (e instanceof PromoUsedUp) return null;
      throw e;
    });
  if (!order) return { ok: false, error: "promoExpired" };

  const start = await provider.start({
    orderId: order.id,
    orderNumber: order.number,
    amountMinor: total,
    currency: order.currency,
    locale: input.locale,
    returnUrl: `${baseUrl}/${input.locale}/commande/${order.number}`,
  });
  if (start.kind === "redirect") {
    await db().payment.update({
      where: { id: order.payments[0].id },
      data: { providerRef: start.providerRef },
    });
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
      options: chosen
        .map((e) =>
          e.quantity > 1 ? `${e.a.names.fr} ×${e.quantity}` : e.a.names.fr,
        )
        .join(" ; "),
      promo: promo?.ok ? promo.rule.code : "",
      discount: discount / 100,
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
  await db().auditLog.create({
    data: {
      actor: "system",
      action: "order.created",
      target: order.number,
      meta: { totalMinor: total, payment: input.payment, sheet },
    },
  });
  if (sheet === "failed")
    console.error(
      `commande ${order.number} : envoi vers la Google Sheet échoué (commande bien enregistrée en base)`,
    );
  return {
    ok: true,
    number: order.number,
    redirect: start.kind === "redirect" ? start.url : null,
  };
}
