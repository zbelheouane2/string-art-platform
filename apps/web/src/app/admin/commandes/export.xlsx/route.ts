import { currentAdmin, isAdmin } from "@/lib/admin/auth";
import { xlsxResponse } from "@/lib/admin/excel";
import { wilayaName } from "@/config/wilayas";
import { db } from "@/lib/db";
import { STATUS_FR } from "../../AdminShell";

type Address = { recipient?: { fullName?: string; phone?: string }; wilaya?: string; commune?: string; note?: string; gift?: unknown };

/** Export Excel des commandes (5 000 au plus, filtre par état facultatif). Réservé à l'administrateur. */
export async function GET(req: Request) {
  if (!(await isAdmin("ordersExport"))) return new Response("Non autorisé", { status: 401 });
  const etat = new URL(req.url).searchParams.get("etat");
  const orders = await db().order.findMany({
    where: etat && etat in STATUS_FR ? { status: etat as never } : {},
    orderBy: { createdAt: "desc" },
    take: 5000,
    include: { customer: true, deliveryMethod: true, items: { include: { product: true } } },
  });
  const me = await currentAdmin();
  await db().auditLog.create({ data: { actor: me!.actor, action: "orders.exported", target: etat ?? "toutes", meta: { count: orders.length } } });
  const rows = orders.map((o) => {
    const a = o.shippingAddress as Address;
    return [
      o.number,
      o.createdAt.toISOString().slice(0, 16).replace("T", " "),
      STATUS_FR[o.status],
      a.recipient?.fullName ?? o.customer.fullName,
      a.recipient?.phone ?? o.customer.phone ?? "",
      `${a.wilaya ?? ""} - ${wilayaName(a.wilaya ?? "", "fr") ?? ""}`,
      a.commune ?? "",
      o.deliveryMethod?.code ?? "",
      o.items.map((i) => `${i.quantity} × ${(i.product.names as { fr: string }).fr}`).join(" ; "),
      o.promoCode ?? "",
      o.discountMinor / 100,
      o.deliveryFeeMinor === null ? null : o.deliveryFeeMinor / 100,
      o.totalMinor / 100,
      o.currency,
      a.gift ? "oui" : "non",
      a.note ?? "",
    ];
  });
  const day = new Date().toISOString().slice(0, 10);
  return xlsxResponse(`commandes-${day}.xlsx`, "Commandes", ["Commande", "Date (UTC)", "État", "Nom", "Téléphone", "Wilaya", "Commune", "Livraison", "Articles", "Code promo", "Remise", "Frais de livraison", "Total", "Devise", "Cadeau", "Remarque"], rows);
}
