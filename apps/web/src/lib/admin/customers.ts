import "server-only";
import { db } from "@/lib/db";
import { groupCustomers } from "./customerGroups";

/** Clients regroupés par téléphone, à partir des 10 000 dernières commandes. */
export async function customerList() {
  const orders = await db().order.findMany({
    orderBy: { createdAt: "desc" },
    take: 10_000,
    select: { number: true, status: true, totalMinor: true, createdAt: true, shippingAddress: true, customer: { select: { fullName: true, phone: true, email: true } } },
  });
  return groupCustomers(
    orders.map((o) => ({
      number: o.number,
      status: o.status,
      totalMinor: o.totalMinor,
      createdAt: o.createdAt,
      fullName: o.customer.fullName,
      phone: o.customer.phone,
      email: o.customer.email,
      wilaya: String((o.shippingAddress as { wilaya?: string }).wilaya ?? ""),
    })),
  );
}
