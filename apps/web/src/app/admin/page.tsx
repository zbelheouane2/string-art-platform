import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { db } from "@/lib/db";
import { AdminShell, STATUS_FR, da, dateFr } from "./AdminShell";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  await requireAdmin();
  const since = new Date(Date.now() - 30 * 86_400_000);
  const [pending, month, revenue, promos, carriers, recent] = await Promise.all([
    db().order.count({ where: { status: "PENDING" } }),
    db().order.count({ where: { createdAt: { gte: since } } }),
    db().order.aggregate({ _sum: { totalMinor: true }, where: { createdAt: { gte: since }, status: { notIn: ["CANCELLED", "RETURNED"] } } }),
    db().promoCode.count({ where: { active: true } }),
    db().carrier.findMany({ where: { active: true }, select: { name: true } }),
    db().order.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { number: true, createdAt: true, totalMinor: true, status: true } }),
  ]);
  return (
    <AdminShell title="Tableau de bord" current="/admin">
      <ul className="a-stats">
        <li>
          <span>À confirmer</span>
          <strong>{pending}</strong>
          <Link href="/admin/commandes?etat=PENDING">Voir</Link>
        </li>
        <li>
          <span>Commandes (30 jours)</span>
          <strong>{month}</strong>
        </li>
        <li>
          <span>Montant (30 jours)</span>
          <strong>{da(revenue._sum.totalMinor ?? 0)}</strong>
        </li>
        <li>
          <span>Codes promo actifs</span>
          <strong>{promos}</strong>
          <Link href="/admin/promos">Gérer</Link>
        </li>
        <li>
          <span>Livraison</span>
          <strong className="a-small">{carriers.map((c) => c.name).join(", ") || "aucune société active"}</strong>
          <Link href="/admin/livraison">Gérer</Link>
        </li>
      </ul>
      <h2>Dernières commandes</h2>
      <table className="a-table">
        <thead>
          <tr>
            <th>Numéro</th>
            <th>Date</th>
            <th>Total</th>
            <th>État</th>
          </tr>
        </thead>
        <tbody>
          {recent.map((o) => (
            <tr key={o.number}>
              <td>{o.number}</td>
              <td>{dateFr(o.createdAt)}</td>
              <td>{da(o.totalMinor)}</td>
              <td>{STATUS_FR[o.status]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </AdminShell>
  );
}
