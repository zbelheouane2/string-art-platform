/**
 * Données de référence : marchés, produits, moyens de paiement et de livraison.
 * Aucun prix n'est créé ici : les tarifs ne sont pas encore validés.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, ProductKind } from "../src/generated/prisma/client";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

async function main() {
  const markets = [
    { code: "DZ", name: "Algérie", currency: "DZD", defaultLocale: "fr" },
    { code: "FR", name: "France", currency: "EUR", defaultLocale: "fr" },
  ];
  for (const m of markets) {
    await db.market.upsert({ where: { code: m.code }, update: m, create: m });
  }

  const products = [
    { slug: "kit-portrait-50", kind: ProductKind.KIT, names: { fr: "Kit portrait 50 × 50 cm", en: "Portrait kit 50 × 50 cm", ar: "عُدّة صورة 50 × 50 سم" } },
    { slug: "code-supplementaire", kind: ProductKind.EXTRA_CODE, names: { fr: "Code supplémentaire", en: "Extra code", ar: "رمز إضافي" } },
    { slug: "tableau-fini-50", kind: ProductKind.ARTWORK, names: { fr: "Tableau réalisé pour vous", en: "Artwork made for you", ar: "لوحة منجزة لك" } },
  ];
  for (const p of products) {
    await db.product.upsert({ where: { slug: p.slug }, update: p, create: p });
  }

  const payments = [
    { code: "cod", provider: "cash_on_delivery", markets: ["DZ"] },
    { code: "cib_edahabia", provider: "satim", markets: ["DZ"] },
    { code: "card", provider: "to_choose", markets: ["FR"] },
  ];
  for (const p of payments) {
    const method = await db.paymentMethod.upsert({
      where: { code: p.code },
      update: { provider: p.provider },
      create: { code: p.code, provider: p.provider },
    });
    for (const code of p.markets) {
      const market = await db.market.findUniqueOrThrow({ where: { code } });
      await db.marketPaymentMethod.upsert({
        where: { marketId_paymentMethodId: { marketId: market.id, paymentMethodId: method.id } },
        update: {},
        create: { marketId: market.id, paymentMethodId: method.id },
      });
    }
  }

  const dz = await db.market.findUniqueOrThrow({ where: { code: "DZ" } });
  for (const code of ["yalidine_home", "yalidine_desk"]) {
    await db.deliveryMethod.upsert({
      where: { marketId_code: { marketId: dz.id, code } },
      update: {},
      create: { marketId: dz.id, code, provider: "yalidine" },
    });
  }
  console.log("Données de référence en place.");
}

main().finally(() => db.$disconnect());
