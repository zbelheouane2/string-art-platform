import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { db } from "@/lib/db";
import { AdminShell, dateFr } from "../AdminShell";

export const dynamic = "force-dynamic";

/** Libellés lisibles des opérations du journal. */
const ACTION_FR: Record<string, string> = {
  "admin.login": "Connexion",
  "admin.login_failed": "Connexion refusée",
  "order.created": "Nouvelle commande",
  "order.status": "État de commande changé",
  "orders.exported": "Export des commandes",
  "customers.exported": "Export des clients",
  "prices.saved": "Prix modifiés",
  "products.renamed": "Noms des articles modifiés",
  "stock.saved": "Stock modifié",
  "promo.created": "Code promo créé",
  "promo.enabled": "Code promo activé",
  "promo.disabled": "Code promo désactivé",
  "carrier.created": "Société de livraison ajoutée",
  "carrier.updated": "Société de livraison modifiée",
  "rates.saved": "Tarifs de livraison modifiés",
  "rates.imported": "Tarifs de livraison importés",
  "codes.created": "Codes d'activation créés",
  "announcement.saved": "Annonce modifiée",
  "announcement.scheduled": "Message programmé",
  "announcement.toggled": "Message programmé activé / en pause",
  "announcement.deleted": "Message programmé supprimé",
  "content.saved": "Textes modifiés",
  "faq.saved": "FAQ modifiée",
  "faq.added": "Question ajoutée à la FAQ",
  "contacts.saved": "Contacts modifiés",
  "seo.saved": "Référencement modifié",
  "image.replaced": "Photo remplacée",
  "image.reset": "Photo d'origine rétablie",
  "example.added": "Exemple avant/après ajouté",
  "review.submitted": "Avis reçu",
  "portrait.chosen": "Portrait validé par un client",
  "portraits.purged": "Anciens portraits effacés",
  "review.approve": "Avis publié",
  "review.reject": "Avis refusé",
  "review.delete": "Avis supprimé",
  "review.added": "Avis ajouté",
  "user.created": "Compte créé",
  "user.updated": "Compte modifié",
  "user.deleted": "Compte supprimé",
  "settings.google_sheet": "Liaison Google Sheets modifiée",
  "settings.google_sheet_test": "Liaison Google Sheets testée",
  "settings.google_sheet_secret": "Nouveau mot secret Google Sheets",
  "settings.google_sheet_resend": "Commandes renvoyées vers Google Sheets",
};

const who = (actor: string) => (actor === "admin" ? "Propriétaire" : actor === "system" ? "Site" : actor.replace(/^admin:/, ""));

/** Journal : qui a fait quoi et quand (sans données personnelles). */
export default async function JournalPage({ searchParams }: { searchParams: Promise<{ qui?: string }> }) {
  await requireAdmin("journal");
  const qui = (await searchParams).qui;
  const [entries, actors] = await Promise.all([
    db().auditLog.findMany({
      where: { action: { notIn: ["order.track.miss", "code.failed", "code.opened"] }, ...(qui ? { actor: qui } : {}) },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    db().auditLog.findMany({ where: { actor: { startsWith: "admin" } }, distinct: ["actor"], select: { actor: true } }),
  ]);
  return (
    <AdminShell title="Journal" current="/admin/journal" lead="Les 200 dernières opérations importantes, pour savoir qui a changé quoi.">
      <nav className="a-filters" aria-label="Filtrer par personne">
        <Link href="/admin/journal" aria-current={!qui ? "page" : undefined}>
          Tout
        </Link>
        {actors.map((a) => (
          <Link key={a.actor} href={`/admin/journal?qui=${encodeURIComponent(a.actor)}`} aria-current={qui === a.actor ? "page" : undefined}>
            {who(a.actor)}
          </Link>
        ))}
      </nav>
      <div className="a-table-wrap">
        <table className="a-table a-table-cards">
          <thead>
            <tr>
              <th>Date</th>
              <th>Qui</th>
              <th>Opération</th>
              <th>Sur</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id}>
                <td data-label="Date">{dateFr(e.createdAt)}</td>
                <td data-label="Qui">{who(e.actor)}</td>
                <td data-label="Opération">{ACTION_FR[e.action] ?? e.action}</td>
                <td data-label="Sur">
                  <code className="a-small">{e.target}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
