import { currentAdmin, isAdmin } from "@/lib/admin/auth";
import { customerList } from "@/lib/admin/customers";
import { xlsxResponse } from "@/lib/admin/excel";
import { db } from "@/lib/db";

/** Export Excel des clients. Réservé à l'administrateur, tracé dans le journal. */
export async function GET() {
  if (!(await isAdmin("customers"))) return new Response("Non autorisé", { status: 401 });
  const list = await customerList();
  const me = await currentAdmin();
  await db().auditLog.create({ data: { actor: me!.actor, action: "customers.exported", target: "clients", meta: { count: list.length } } });
  return xlsxResponse(
    `clients-${new Date().toISOString().slice(0, 10)}.xlsx`,
    "Clients",
    ["Nom", "Téléphone", "E-mail", "Wilaya", "Commandes", "Montant (DA)", "Première commande", "Dernière commande", "N° dernière commande"],
    list.map((c) => [c.fullName, c.phone, c.email, c.wilaya, c.orders, c.spentMinor / 100, c.firstAt.toISOString().slice(0, 10), c.lastAt.toISOString().slice(0, 10), c.lastNumber]),
  );
}
