import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { computeStats } from "@/lib/admin/statsCalc";
import { wilayaName } from "@/config/wilayas";
import { db } from "@/lib/db";
import { AdminShell, STATUS_FR, da } from "../AdminShell";

export const dynamic = "force-dynamic";

const PERIODS = [7, 30, 90, 365] as const;

/** Statistiques simples : ventes, panier moyen, jours, wilayas, articles, codes promo. */
export default async function StatsPage({ searchParams }: { searchParams: Promise<{ jours?: string }> }) {
  await requireAdmin("stats");
  const j = Number((await searchParams).jours);
  const days = (PERIODS as readonly number[]).includes(j) ? j : 30;
  const since = new Date(Date.now() - days * 86_400_000);
  const rows = await db().order.findMany({
    where: { createdAt: { gte: since } },
    select: { status: true, totalMinor: true, createdAt: true, promoCode: true, shippingAddress: true, items: { select: { quantity: true, product: { select: { kind: true, names: true } } } } },
  });
  const s = computeStats(
    rows.map((o) => ({
      status: o.status,
      totalMinor: o.totalMinor,
      createdAt: o.createdAt,
      promoCode: o.promoCode,
      wilaya: String((o.shippingAddress as { wilaya?: string }).wilaya ?? ""),
      items: o.items.map((i) => ({ kind: i.product.kind, name: (i.product.names as { fr: string }).fr, quantity: i.quantity })),
    })),
    days,
  );
  const max = Math.max(1, ...s.perDay.map((d) => d.orders));
  const ga = !!process.env.NEXT_PUBLIC_GA4_ID;
  return (
    <AdminShell title="Statistiques" current="/admin/statistiques" lead="Montants sans les commandes annulées ou retournées.">
      <nav className="a-filters" aria-label="Période">
        {PERIODS.map((p) => (
          <Link key={p} href={`/admin/statistiques?jours=${p}`} aria-current={days === p ? "page" : undefined}>
            {p === 365 ? "12 mois" : `${p} jours`}
          </Link>
        ))}
      </nav>
      <ul className="a-stats">
        <li>
          <span>Commandes</span>
          <strong>{s.orders}</strong>
        </li>
        <li>
          <span>Chiffre d&apos;affaires</span>
          <strong>{da(s.revenue)}</strong>
        </li>
        <li>
          <span>Panier moyen</span>
          <strong>{da(s.average)}</strong>
        </li>
        <li>
          <span>Kits vendus</span>
          <strong>{s.kits}</strong>
        </li>
        <li>
          <span>Taux de confirmation</span>
          <strong>{s.confirmRate === null ? "—" : `${s.confirmRate} %`}</strong>
        </li>
      </ul>

      <section className="a-card">
        <h2>Commandes par jour</h2>
        <div className="a-bars" role="img" aria-label={`Commandes par jour sur ${days} jours, au plus ${max} par jour`}>
          {s.perDay.map((d) => (
            <span key={d.day} style={{ ["--h" as string]: `${(d.orders / max) * 100}%` }} title={`${d.day} : ${d.orders} commande(s), ${da(d.revenue)}`} />
          ))}
        </div>
        <p className="a-muted a-small">
          Du {s.perDay[0]?.day} au {s.perDay[s.perDay.length - 1]?.day} · survolez une barre pour le détail.
        </p>
      </section>

      <div className="a-two">
        <StatTable title="Articles les plus commandés" rows={s.products.map(([k, v]) => [k, String(v)])} />
        <StatTable title="Wilayas" rows={s.byWilaya.map(([k, v]) => [`${k} - ${wilayaName(k, "fr") ?? ""}`, String(v)])} />
        <StatTable title="États des commandes" rows={s.byStatus.map(([k, v]) => [STATUS_FR[k] ?? k, String(v)])} />
        <StatTable title="Codes promo utilisés" rows={s.byPromo.map(([k, v]) => [k, String(v)])} />
      </div>

      <section className="a-card">
        <h2>Visites du site</h2>
        <p className="a-muted">
          {ga ? (
            <>
              Les visites sont mesurées par Google Analytics (avec l&apos;accord des visiteurs) :{" "}
              <a href="https://analytics.google.com/" target="_blank" rel="noopener noreferrer">
                ouvrir Google Analytics
              </a>
              .
            </>
          ) : (
            "La mesure des visites n'est pas encore activée (identifiant Google Analytics à ajouter sur le serveur : NEXT_PUBLIC_GA4_ID)."
          )}
        </p>
      </section>
    </AdminShell>
  );
}

function StatTable({ title, rows }: { title: string; rows: string[][] }) {
  return (
    <section className="a-card">
      <h2>{title}</h2>
      {rows.length === 0 ? (
        <p className="a-muted">Rien sur la période.</p>
      ) : (
        <table className="a-table">
          <tbody>
            {rows.map(([k, v]) => (
              <tr key={k}>
                <td>{k}</td>
                <td className="a-num">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
