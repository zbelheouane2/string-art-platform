import "server-only";
import type { PrismaClient } from "@/generated/prisma/client";

/**
 * Stock suivi (Product.stockQuantity non nul) : une commande confirmée retire
 * ses articles ; à 0, l'article passe en rupture (soldOut) et n'est plus proposé.
 * Une commande confirmée puis annulée les remet en stock.
 */
export async function decrementStock(db: PrismaClient, orderNumber: string): Promise<void> {
  await moveStock(db, orderNumber, -1);
}

export async function restoreStock(db: PrismaClient, orderNumber: string): Promise<void> {
  await moveStock(db, orderNumber, 1);
}

async function moveStock(db: PrismaClient, orderNumber: string, sign: 1 | -1): Promise<void> {
  const order = await db.order.findUnique({ where: { number: orderNumber }, include: { items: { include: { product: true } } } });
  if (!order) return;
  for (const item of order.items) {
    const q = item.product.stockQuantity;
    if (q === null) continue;
    const next = nextStock(q, sign * item.quantity);
    await db.product.update({ where: { id: item.productId }, data: { stockQuantity: next, ...(next === 0 ? { soldOut: true } : sign > 0 ? { soldOut: false } : {}) } });
  }
}

/** Nouveau stock, jamais négatif. */
export const nextStock = (current: number, delta: number) => Math.max(0, current + delta);
