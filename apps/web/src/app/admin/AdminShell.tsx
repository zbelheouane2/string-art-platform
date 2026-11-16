import Link from "next/link";
import { logoutAction } from "./actions";

const NAV = [
  { href: "/admin", label: "Tableau de bord" },
  { href: "/admin/commandes", label: "Commandes" },
  { href: "/admin/prix", label: "Prix et options" },
  { href: "/admin/promos", label: "Codes promo" },
  { href: "/admin/livraison", label: "Livraison" },
];

export function AdminShell({ title, current, children }: { title: string; current: string; children: React.ReactNode }) {
  return (
    <div className="admin-shell">
      <header className="admin-top">
        <Link href="/admin" className="admin-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/visuels/marque/deekra-logo.webp" alt="" width={40} height={44} />
          <span>Deekra · admin</span>
        </Link>
        <nav aria-label="Admin">
          <ul>
            {NAV.map((n) => (
              <li key={n.href}>
                <Link href={n.href} aria-current={current === n.href ? "page" : undefined}>
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <form action={logoutAction}>
          <button type="submit" className="a-btn a-btn-ghost">
            Se déconnecter
          </button>
        </form>
      </header>
      <main className="admin-main">
        <h1>{title}</h1>
        {children}
      </main>
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
