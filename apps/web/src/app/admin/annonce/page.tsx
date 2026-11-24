import { requireAdmin } from "@/lib/admin/auth";
import { originalMessages } from "@/lib/content";
import { LOCALES } from "@/lib/contentTools";
import { getSetting, pickAnnouncement } from "@/lib/settings";
import { addScheduledAction, saveAnnouncementAction, toggleScheduledAction } from "../_actions/content";
import { AdminShell, Flash } from "../AdminShell";
import { Texts3 } from "../_ui/Texts3";

export const dynamic = "force-dynamic";

const day = (iso: string | null) => (iso ? new Intl.DateTimeFormat("fr", { dateStyle: "medium", timeZone: "Africa/Algiers" }).format(new Date(iso)) : "…");

/** Bande d'annonce en haut du site : message permanent et messages programmés (fêtes, promos, délais). */
export default async function AnnouncementPage({ searchParams }: { searchParams: Promise<{ ok?: string; erreur?: string }> }) {
  await requireAdmin("announcement");
  const q = await searchParams;
  const a = await getSetting("announcement");
  const originals = Object.fromEntries(await Promise.all(LOCALES.map(async (l) => [l, String((await originalMessages(l)).announcement ?? "")] as const)));
  const now = pickAnnouncement(a, "fr");
  const now2 = new Date();
  return (
    <AdminShell title="Annonce" current="/admin/annonce" lead="La bande colorée tout en haut du site. Utilisez-la pour une promo, une fête ou un délai de livraison.">
      <Flash ok={q.ok} error={q.erreur} />
      <div className="a-card">
        <p className="a-muted a-small">Affiché maintenant (français)</p>
        <p className="a-announce-preview">{now.hidden ? <em>Bande masquée</em> : (now.text ?? originals.fr)}</p>
      </div>

      <form action={saveAnnouncementAction} className="a-card a-stack">
        <h2>Message permanent</h2>
        <p className="a-muted">Laissez vide pour garder le texte d&apos;origine (en gris).</p>
        <Texts3 prefix="base" values={a.base} placeholders={originals} />
        <label className="a-check">
          <input type="checkbox" name="hidden" defaultChecked={a.hidden} />
          <span>Masquer complètement la bande d&apos;annonce</span>
        </label>
        <div>
          <button type="submit" className="a-btn">
            Enregistrer
          </button>
        </div>
      </form>

      <section className="a-card">
        <h2>Messages programmés</h2>
        <p className="a-muted">Pendant ses dates, un message programmé remplace le message permanent. Idéal pour une offre d&apos;occasion : créez le code promo (Codes promo et offres) avec les mêmes dates, puis annoncez-le ici.</p>
        {a.scheduled.length === 0 ? (
          <p className="a-muted">Aucun message programmé.</p>
        ) : (
          <ul className="a-sched">
            {a.scheduled.map((s) => {
              const live = s.active && (!s.startsAt || new Date(s.startsAt) <= now2) && (!s.endsAt || new Date(s.endsAt) >= now2);
              const past = !!s.endsAt && new Date(s.endsAt) < now2;
              return (
                <li key={s.id}>
                  <div>
                    <strong>{s.label}</strong> <span className={`a-pill${live ? " a-pill-on" : ""}`}>{live ? "en ligne" : past ? "terminé" : s.active ? "à venir" : "en pause"}</span>
                    <br />
                    <span className="a-muted a-small">
                      du {day(s.startsAt)} au {day(s.endsAt)}
                    </span>
                    <p>{s.texts.fr || s.texts.ar || s.texts.en}</p>
                  </div>
                  <div className="a-actions">
                    <form action={toggleScheduledAction}>
                      <input type="hidden" name="id" value={s.id} />
                      <button type="submit" className="a-btn a-btn-sm a-btn-ghost">
                        {s.active ? "Mettre en pause" : "Réactiver"}
                      </button>
                    </form>
                    <form action={toggleScheduledAction}>
                      <input type="hidden" name="id" value={s.id} />
                      <input type="hidden" name="delete" value="1" />
                      <button type="submit" className="a-btn a-btn-sm a-btn-ghost">
                        Supprimer
                      </button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <form action={addScheduledAction} className="a-card a-stack">
        <h2>Programmer un message</h2>
        <div className="a-grid">
          <label>
            Nom (pour vous)
            <input name="label" className="a-input" placeholder="ex. Fête des mères" maxLength={60} required />
          </label>
          <label>
            Du
            <input name="startsAt" type="date" className="a-input" />
          </label>
          <label>
            Au (inclus)
            <input name="endsAt" type="date" className="a-input" />
          </label>
        </div>
        <Texts3 prefix="s" placeholders={{ fr: "ex. Fête des mères : −10 % avec le code MAMAN", ar: "", en: "" }} />
        <div>
          <button type="submit" className="a-btn">
            Programmer
          </button>
        </div>
      </form>
    </AdminShell>
  );
}
