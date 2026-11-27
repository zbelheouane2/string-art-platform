import { requireAdmin } from "@/lib/admin/auth";
import { ADMIN_ONLY_FR, EMPLOYEE_SCOPE_FR, ROLE_FR } from "@/lib/admin/permissions";
import { MIN_PASSWORD } from "@/lib/admin/passwords";
import { db } from "@/lib/db";
import { createUserAction, deleteUserAction, updateUserAction } from "../_actions/users";
import { AdminShell, Flash, dateFr } from "../AdminShell";

export const dynamic = "force-dynamic";

/** Comptes de l'espace admin : création, rôle, mot de passe, désactivation. */
export default async function AccountsPage({ searchParams }: { searchParams: Promise<{ ok?: string; erreur?: string }> }) {
  await requireAdmin("users");
  const q = await searchParams;
  const users = await db().adminUser.findMany({ orderBy: { createdAt: "asc" } });
  return (
    <AdminShell title="Comptes" current="/admin/comptes" lead="Donnez un accès personnel à chaque personne qui vous aide. Chacun a son identifiant et son mot de passe ; le journal garde la trace de qui a fait quoi.">
      <Flash ok={q.ok} error={q.erreur} />
      <div className="a-two">
        <section className="a-card">
          <h2>Employé</h2>
          <ul className="a-list-ok">
            {EMPLOYEE_SCOPE_FR.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>
        <section className="a-card">
          <h2>Réservé à l&apos;administrateur</h2>
          <ul className="a-list-lock">
            {ADMIN_ONLY_FR.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>
      </div>

      <h2>Comptes existants</h2>
      <div className="a-table-wrap">
        <table className="a-table a-table-cards">
          <thead>
            <tr>
              <th>Personne</th>
              <th>Dernière connexion</th>
              <th>Rôle et accès</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td data-label="Personne">
                <strong>Propriétaire</strong>
                <br />
                <span className="a-muted">identifiant « admin », mot de passe du serveur</span>
              </td>
              <td data-label="Connexion">—</td>
              <td data-label="Rôle">
                <span className="a-pill a-pill-on">Administrateur</span> <span className="a-muted">toujours actif</span>
              </td>
            </tr>
            {users.map((u) => (
              <tr key={u.id}>
                <td data-label="Personne">
                  <strong>{u.name}</strong>
                  <br />
                  <span className="a-muted">identifiant « {u.login} »</span>
                </td>
                <td data-label="Connexion">{dateFr(u.lastLoginAt)}</td>
                <td data-label="Rôle">
                  <form action={updateUserAction} className="a-inline a-wrap">
                    <input type="hidden" name="id" value={u.id} />
                    <label className="visually-hidden" htmlFor={`role-${u.id}`}>
                      Rôle de {u.name}
                    </label>
                    <select id={`role-${u.id}`} name="role" defaultValue={u.role} className="a-input a-input-sm">
                      {Object.entries(ROLE_FR).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                    <label className="a-check-inline">
                      <input type="checkbox" name="active" defaultChecked={u.active} /> Actif
                    </label>
                    <label className="visually-hidden" htmlFor={`pw-${u.id}`}>
                      Nouveau mot de passe de {u.name}
                    </label>
                    <input id={`pw-${u.id}`} name="password" type="password" autoComplete="new-password" className="a-input a-input-sm" placeholder="Nouveau mot de passe" minLength={MIN_PASSWORD} />
                    <button type="submit" className="a-btn a-btn-sm">
                      Enregistrer
                    </button>
                  </form>
                  <form action={deleteUserAction} className="a-inline">
                    <input type="hidden" name="id" value={u.id} />
                    <button type="submit" className="a-btn a-btn-sm a-btn-ghost">
                      Supprimer
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form action={createUserAction} className="a-card">
        <h2>Créer un compte</h2>
        <div className="a-grid">
          <label>
            Prénom et nom
            <input name="name" className="a-input" required maxLength={60} />
          </label>
          <label>
            Identifiant
            <input name="login" className="a-input" required autoCapitalize="none" spellCheck={false} placeholder="ex. karim" pattern="[a-z0-9][a-z0-9._\-]{2,29}" />
          </label>
          <label>
            Mot de passe ({MIN_PASSWORD} caractères au moins)
            <input name="password" type="password" autoComplete="new-password" className="a-input" required minLength={MIN_PASSWORD} />
          </label>
          <label>
            Rôle
            <select name="role" className="a-input" defaultValue="EMPLOYEE">
              <option value="EMPLOYEE">Employé</option>
              <option value="ADMIN">Administrateur</option>
            </select>
          </label>
          <div>
            <button type="submit" className="a-btn">
              Créer le compte
            </button>
          </div>
        </div>
      </form>
    </AdminShell>
  );
}
