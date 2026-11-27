import Link from "next/link";
import { currentAdmin } from "@/lib/admin/auth";
import { can, ROLE_FR, type Permission } from "@/lib/admin/permissions";
import { logoutAction } from "./actions";
import { AdminNavScroll } from "./AdminNavScroll";

/** Menu de l'admin, par rubrique. Chaque entrée n'apparaît qu'aux rôles qui y ont droit. */
const NAV: { group: string; items: { href: string; label: string; perm: Permission }[] }[] = [
  {
    group: "Ventes",
    items: [
      { href: "/admin", label: "Tableau de bord", perm: "dashboard" },
      { href: "/admin/commandes", label: "Commandes", perm: "orders" },
      { href: "/admin/clients", label: "Clients", perm: "customers" },
      { href: "/admin/statistiques", label: "Statistiques", perm: "stats" },
    ],
  },
  {
    group: "Catalogue",
    items: [
      { href: "/admin/prix", label: "Prix et options", perm: "prices" },
      { href: "/admin/stock", label: "Stock", perm: "stock" },
      { href: "/admin/promos", label: "Codes promo et offres", perm: "promos" },
      { href: "/admin/livraison", label: "Livraison", perm: "delivery" },
      { href: "/admin/codes", label: "Codes d'activation", perm: "codes" },
    ],
  },
  {
    group: "Contenu du site",
    items: [
      { href: "/admin/annonce", label: "Annonce", perm: "announcement" },
      { href: "/admin/faq", label: "FAQ", perm: "faq" },
      { href: "/admin/avis", label: "Avis clients", perm: "reviews" },
      { href: "/admin/textes", label: "Textes du site", perm: "content" },
      { href: "/admin/photos", label: "Photos", perm: "media" },
      { href: "/admin/contacts", label: "Contacts et réseaux", perm: "contacts" },
      { href: "/admin/referencement", label: "Référencement Google", perm: "seo" },
    ],
  },
  {
    group: "Réglages",
    items: [
      { href: "/admin/google-sheets", label: "Google Sheets", perm: "settings" },
      { href: "/admin/comptes", label: "Comptes", perm: "users" },
      { href: "/admin/journal", label: "Journal", perm: "journal" },
    ],
  },
];

export async function AdminShell({ title, current, children, lead }: { title: string; current: string; children: React.ReactNode; lead?: React.ReactNode }) {
  const me = await currentAdmin();
  const role = me?.role ?? "EMPLOYEE";
  const groups = NAV.map((g) => ({ ...g, items: g.items.filter((i) => can(role, i.perm)) })).filter((g) => g.items.length > 0);
  return (
    <div className="admin-shell">
      <header className="admin-top">
        <Link href="/admin" className="admin-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/visuels/marque/deekra-logo.webp" alt="" width={40} height={44} />
          <span>Deekra · admin</span>
        </Link>
        {me && (
          <p className="admin-who">
            {me.name} <span className="a-pill">{ROLE_FR[me.role]}</span>
          </p>
        )}
        <form action={logoutAction}>
          <button type="submit" className="a-btn a-btn-ghost">
            Se déconnecter
          </button>
        </form>
      </header>
      <div className="admin-body">
        <nav aria-label="Admin" className="admin-nav">
          {groups.map((g) => (
            <div key={g.group} className="admin-nav-group">
              <p className="admin-nav-title">{g.group}</p>
              <ul>
                {g.items.map((n) => (
                  <li key={n.href}>
                    <Link href={n.href} aria-current={current === n.href ? "page" : undefined}>
                      {n.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
        <AdminNavScroll />
        <main className="admin-main">
          <h1>{title}</h1>
          {lead && <p className="a-lead">{lead}</p>}
          {children}
        </main>
      </div>
    </div>
  );
}

/** Montant en dinars, lisible (« 4 900 DA »). */
export function da(amountMinor: number | null | undefined): string {
  if (amountMinor === null || amountMinor === undefined) return "—";
  return `${new Intl.NumberFormat("fr").format(amountMinor / 100)} DA`;
}

export function dateFr(d: Date | null | undefined): string {
  return d ? new Intl.DateTimeFormat("fr", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Algiers" }).format(d) : "—";
}

/** Message de retour après une action (?ok=… ou ?erreur=…). */
export function Flash({ ok, error }: { ok?: string; error?: string }) {
  if (error) return <p className="a-flash a-flash-error" role="alert">{error}</p>;
  if (ok) return <p className="a-flash" role="status">{ok}</p>;
  return null;
}

export const STATUS_FR: Record<string, string> = {
  PENDING: "À confirmer",
  CONFIRMED: "Confirmée",
  SHIPPED: "Expédiée",
  DELIVERED: "Livrée",
  CANCELLED: "Annulée",
  RETURNED: "Retournée",
};
