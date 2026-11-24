import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { db } from "@/lib/db";
import { addReviewAction, moderateReviewAction } from "../_actions/reviews";
import { AdminShell, Flash, dateFr } from "../AdminShell";

export const dynamic = "force-dynamic";

const TABS = { PENDING: "À valider", APPROVED: "Publiés", REJECTED: "Refusés" } as const;

/** Avis clients : les avis laissés sur le site attendent ici d'être validés avant de paraître sur l'accueil. */
export default async function ReviewsPage({ searchParams }: { searchParams: Promise<{ etat?: string; ok?: string; erreur?: string }> }) {
  await requireAdmin("reviews");
  const q = await searchParams;
  const etat = (q.etat && q.etat in TABS ? q.etat : "PENDING") as keyof typeof TABS;
  const [reviews, counts] = await Promise.all([
    db().customerReview.findMany({ where: { status: etat }, orderBy: { createdAt: "desc" }, take: 200 }),
    db().customerReview.groupBy({ by: ["status"], _count: true }),
  ]);
  const count = (s: string) => counts.find((c) => c.status === s)?._count ?? 0;
  return (
    <AdminShell
      title="Avis clients"
      current="/admin/avis"
      lead="Après la livraison, le client peut laisser un avis depuis « Suivre ma commande ». Rien n'est publié avant votre validation. Les avis publiés apparaissent sur l'accueil, avec le prénom seulement."
    >
      <Flash ok={q.ok} error={q.erreur} />
      <nav className="a-filters" aria-label="Avis par état">
        {Object.entries(TABS).map(([k, v]) => (
          <Link key={k} href={`/admin/avis?etat=${k}`} aria-current={etat === k ? "page" : undefined}>
            {v} ({count(k)})
          </Link>
        ))}
      </nav>
      {reviews.length === 0 ? (
        <p className="a-muted">Aucun avis ici.</p>
      ) : (
        <ul className="a-reviews">
          {reviews.map((r) => (
            <li key={r.id} className="a-card">
              <p className="a-review-head">
                <strong>{r.name}</strong>
                {r.place && <span className="a-muted"> · {r.place}</span>}
                <span className="a-stars" aria-label={`${r.rating} sur 5`}>
                  {"★".repeat(r.rating)}
                  <span aria-hidden="true">{"★".repeat(5 - r.rating)}</span>
                </span>
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {r.photoUrl && <img src={r.photoUrl} alt="" width={120} height={120} className="a-review-photo" />}
              <blockquote dir="auto">{r.text}</blockquote>
              <p className="a-muted a-small">
                {dateFr(r.createdAt)} · {r.source === "admin" ? "saisi dans l'admin" : `commande ${r.orderNumber ?? "—"}`} · langue {r.locale}
              </p>
              <div className="a-actions">
                {(
                  [
                    ["approve", "Publier", r.status !== "APPROVED"],
                    ["reject", r.status === "APPROVED" ? "Retirer du site" : "Refuser", r.status !== "REJECTED"],
                    ["delete", "Supprimer", true],
                  ] as const
                ).map(([op, label, show]) =>
                  show ? (
                    <form key={op} action={moderateReviewAction}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="op" value={op} />
                      <input type="hidden" name="etat" value={etat} />
                      <button type="submit" className={`a-btn a-btn-sm${op === "approve" ? "" : " a-btn-ghost"}`}>
                        {label}
                      </button>
                    </form>
                  ) : null,
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      <form action={addReviewAction} className="a-card">
        <h2>Ajouter un avis reçu par message</h2>
        <p className="a-muted">Seulement un vrai avis, avec l&apos;accord du client. Il est publié tout de suite.</p>
        <div className="a-grid">
          <label>
            Prénom
            <input name="name" className="a-input" required maxLength={40} />
          </label>
          <label>
            Wilaya ou ville
            <input name="place" className="a-input" maxLength={60} />
          </label>
          <label>
            Note
            <select name="rating" className="a-input" defaultValue="5">
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} / 5
                </option>
              ))}
            </select>
          </label>
          <label>
            Langue de l&apos;avis
            <select name="locale" className="a-input" defaultValue="fr">
              <option value="fr">Français</option>
              <option value="ar">Arabe</option>
              <option value="en">Anglais</option>
            </select>
          </label>
          <label className="a-span">
            Avis
            <textarea name="text" className="a-input" rows={3} required minLength={10} maxLength={800} dir="auto" />
          </label>
          <label>
            Photo du portrait (facultatif)
            <input type="file" name="photo" accept="image/jpeg,image/png,image/webp" className="a-input" />
          </label>
          <div>
            <button type="submit" className="a-btn">
              Ajouter et publier
            </button>
          </div>
        </div>
      </form>
    </AdminShell>
  );
}
