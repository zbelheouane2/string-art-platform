import { requireAdmin } from "@/lib/admin/auth";
import { IMAGE_SLOTS } from "@/config/imageSlots";
import { db } from "@/lib/db";
import { getSetting } from "@/lib/settings";
import { addExampleAction, replaceSlotAction, updateExampleAction } from "../_actions/media";
import { AdminShell, Flash } from "../AdminShell";
import { Texts3 } from "../_ui/Texts3";

export const dynamic = "force-dynamic";

/* eslint-disable @next/next/no-img-element */

/** Photos du site : exemples avant/après de la fiche du kit et images remplaçables des pages. */
export default async function PhotosPage({ searchParams }: { searchParams: Promise<{ ok?: string; erreur?: string }> }) {
  await requireAdmin("media");
  const q = await searchParams;
  const [examples, images] = await Promise.all([db().showcaseExample.findMany({ orderBy: [{ position: "asc" }, { createdAt: "asc" }] }), getSetting("images")]);
  const pages = [...new Set(IMAGE_SLOTS.map((s) => s.page))];
  return (
    <AdminShell title="Photos" current="/admin/photos" lead="Images JPEG, PNG ou WebP de 3 Mo au plus. Pour un avant/après, utilisez deux images carrées avec le même cadrage (le portrait en fil vient du générateur).">
      <Flash ok={q.ok} error={q.erreur} />

      <section className="a-card">
        <h2>Exemples avant / après (fiche du kit)</h2>
        <ul className="a-examples">
          {examples.map((e, i) => {
            const labels = e.labels as Record<string, string>;
            return (
              <li key={e.id} className={e.active ? undefined : "a-off"}>
                <div className="a-pair">
                  <img src={e.photoUrl} alt="Photo" width={96} height={96} />
                  <img src={e.threadUrl} alt="Portrait en fil" width={96} height={96} />
                </div>
                <form action={updateExampleAction} className="a-stack">
                  <input type="hidden" name="id" value={e.id} />
                  <input type="hidden" name="op" value="save" />
                  <Texts3 prefix={`label_${e.id}`} values={labels} max={40} />
                  <div>
                    <button type="submit" className="a-btn a-btn-sm">
                      Enregistrer la légende
                    </button>
                  </div>
                </form>
                <div className="a-actions">
                  {(
                    [
                      ["up", "↑ Monter"],
                      ["down", "↓ Descendre"],
                      ["toggle", e.active ? "Masquer" : "Afficher"],
                      ["delete", "Supprimer"],
                    ] as const
                  ).map(([op, label]) =>
                    (op === "up" && i === 0) || (op === "down" && i === examples.length - 1) ? null : (
                      <form key={op} action={updateExampleAction}>
                        <input type="hidden" name="id" value={e.id} />
                        <input type="hidden" name="op" value={op} />
                        <button type="submit" className="a-btn a-btn-sm a-btn-ghost">
                          {label}
                        </button>
                      </form>
                    ),
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        <form action={addExampleAction} className="a-stack a-add">
          <h3>Ajouter un exemple</h3>
          <div className="a-grid">
            <label>
              Photo d&apos;origine
              <input type="file" name="photo" accept="image/jpeg,image/png,image/webp" required className="a-input" />
            </label>
            <label>
              Portrait en fil
              <input type="file" name="thread" accept="image/jpeg,image/png,image/webp" required className="a-input" />
            </label>
          </div>
          <Texts3 prefix="label" max={40} placeholders={{ fr: "ex. Mariage", ar: "", en: "" }} />
          <div>
            <button type="submit" className="a-btn">
              Ajouter l&apos;exemple
            </button>
          </div>
        </form>
      </section>

      {pages.map((page) => (
        <section key={page} className="a-card">
          <h2>Photos : {page}</h2>
          <ul className="a-slots">
            {IMAGE_SLOTS.filter((s) => s.page === page).map((s) => {
              const changed = !!images[s.slot];
              return (
                <li key={s.slot} id={s.slot}>
                  <img src={images[s.slot] || s.fallback} alt="" width={160} height={160} loading="lazy" />
                  <p>
                    {s.label} {changed && <span className="a-pill a-pill-on">remplacée</span>}
                  </p>
                  <form action={replaceSlotAction} className="a-stack">
                    <input type="hidden" name="slot" value={s.slot} />
                    <label className="visually-hidden" htmlFor={`f-${s.slot}`}>
                      Nouvelle image : {s.label}
                    </label>
                    <input id={`f-${s.slot}`} type="file" name="file" accept="image/jpeg,image/png,image/webp" required className="a-input a-input-sm" />
                    <button type="submit" className="a-btn a-btn-sm">
                      Remplacer
                    </button>
                  </form>
                  {changed && (
                    <form action={replaceSlotAction}>
                      <input type="hidden" name="slot" value={s.slot} />
                      <input type="hidden" name="reset" value="1" />
                      <button type="submit" className="a-btn a-btn-sm a-btn-ghost">
                        Rétablir l&apos;originale
                      </button>
                    </form>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </AdminShell>
  );
}
