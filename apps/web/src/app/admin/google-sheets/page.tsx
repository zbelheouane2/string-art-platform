import { randomBytes } from "node:crypto";
import { requireAdmin } from "@/lib/admin/auth";
import { db } from "@/lib/db";
import { SHEET_COLUMNS, sheetScript } from "@/lib/notify/sheetScript";
import { getSetting } from "@/lib/settings";
import { newSheetSecretAction, resendMissingAction, saveSheetAction, testSheetAction } from "../_actions/settings";
import { AdminShell, Flash, dateFr } from "../AdminShell";
import { CopyButton } from "../_ui/CopyButton";

export const dynamic = "force-dynamic";

/** Liaison avec la Google Sheet des commandes : guide pas à pas, réglages, test et renvoi. */
export default async function GoogleSheetsPage({ searchParams }: { searchParams: Promise<{ ok?: string; erreur?: string }> }) {
  await requireAdmin("settings");
  const q = await searchParams;
  const cfg = await getSetting("googleSheet");
  // Premier passage : un mot secret est proposé, il sera enregistré avec le formulaire.
  const secret = cfg.secret || randomBytes(18).toString("base64url");
  const script = sheetScript(secret);
  const [missing, sent] = await Promise.all([db().order.count({ where: { sheetSentAt: null } }), db().order.count({ where: { sheetSentAt: { not: null } } })]);
  const state = !cfg.enabled || !cfg.url ? "off" : cfg.lastTestOk === false ? "error" : cfg.lastTestOk ? "ok" : "untested";
  const STATE = {
    off: { label: "Désactivée", text: "Les commandes ne sont pas envoyées dans une Google Sheet. Suivez les étapes ci-dessous pour la brancher." },
    untested: { label: "Activée, pas encore testée", text: "Cliquez sur « Tester la liaison » pour vérifier que Google répond." },
    ok: { label: "Active et vérifiée", text: "Chaque nouvelle commande arrive dans votre feuille en quelques secondes." },
    error: { label: "Erreur au dernier test", text: "Google n'a pas répondu correctement. Revoyez les étapes 2 à 5." },
  }[state];

  return (
    <AdminShell
      title="Google Sheets"
      current="/admin/google-sheets"
      lead="Recevez chaque commande du site comme une nouvelle ligne dans votre Google Sheet, pour la suivre sur votre téléphone ou la partager. Aucun compte développeur n'est nécessaire."
    >
      <Flash ok={q.ok} error={q.erreur} />

      <section className={`a-card a-sheet-status a-sheet-${state}`} aria-labelledby="sheet-state">
        <div>
          <p className="a-muted a-small">État de la liaison</p>
          <h2 id="sheet-state">{STATE.label}</h2>
          <p>{STATE.text}</p>
          {cfg.lastTestAt && <p className="a-muted a-small">Dernier test : {dateFr(new Date(cfg.lastTestAt))}</p>}
        </div>
        <ul className="a-mini-stats">
          <li>
            <strong>{sent}</strong>
            <span>commandes envoyées</span>
          </li>
          <li>
            <strong>{missing}</strong>
            <span>pas encore dans la feuille</span>
          </li>
        </ul>
        <div className="a-actions">
          <form action={testSheetAction}>
            <button type="submit" className="a-btn" disabled={!cfg.url}>
              Tester la liaison
            </button>
          </form>
          {missing > 0 && cfg.enabled && cfg.url && (
            <form action={resendMissingAction}>
              <button type="submit" className="a-btn a-btn-ghost">
                Envoyer les {Math.min(missing, 50)} commandes manquantes
              </button>
            </form>
          )}
        </div>
      </section>

      <section className="a-card" aria-labelledby="sheet-steps">
        <h2 id="sheet-steps">Mise en place (10 minutes, une seule fois)</h2>
        <ol className="a-steps">
          <li>
            <strong>Créez une Google Sheet</strong> (par exemple « Commandes DeeKra ») depuis{" "}
            <a href="https://sheets.new" target="_blank" rel="noopener noreferrer">
              sheets.new
            </a>
            .
          </li>
          <li>
            <strong>Collez le script.</strong> Dans la feuille : menu <em>Extensions → Apps Script</em>. Effacez tout, puis collez ce script (il contient déjà votre mot secret).
            <div className="a-code">
              <div className="a-code-head">
                <span>Script Google Apps Script</span>
                <CopyButton text={script} label="Copier le script" />
              </div>
              <pre>{script}</pre>
            </div>
          </li>
          <li>
            <strong>Enregistrez</strong> le script (icône disquette).
          </li>
          <li>
            <strong>Publiez-le :</strong> <em>Déployer → Nouveau déploiement → Application Web</em>. Exécuter en tant que : <em>Moi</em>. Qui a accès : <em>Tout le monde</em>. Acceptez l&apos;autorisation demandée par Google.
          </li>
          <li>
            <strong>Copiez l&apos;adresse</strong> de l&apos;application Web (elle se termine par <code>/exec</code>), collez-la ci-dessous, puis cliquez sur <em>Enregistrer</em> et <em>Tester la liaison</em>.
          </li>
        </ol>
      </section>

      <form action={saveSheetAction} className="a-card a-stack" aria-labelledby="sheet-form">
        <h2 id="sheet-form">Réglages</h2>
        <label className="a-field">
          <span>Adresse de l&apos;application Web Google</span>
          <input name="url" type="url" className="a-input" defaultValue={cfg.url} placeholder="https://script.google.com/macros/s/…/exec" />
        </label>
        <input type="hidden" name="secret" value={secret} />
        <label className="a-check">
          <input type="checkbox" name="enabled" defaultChecked={cfg.enabled} />
          <span>
            <strong>Envoyer chaque nouvelle commande dans la feuille</strong>
            <br />
            <span className="a-muted">Une ligne par commande : client, téléphone, wilaya, articles, total…</span>
          </span>
        </label>
        <label className="a-check">
          <input type="checkbox" name="syncStatus" defaultChecked={cfg.syncStatus} />
          <span>
            <strong>Mettre à jour la colonne « Statut »</strong>
            <br />
            <span className="a-muted">Quand une commande passe à Confirmée, Expédiée, Livrée… dans l&apos;admin, la feuille suit.</span>
          </span>
        </label>
        <div>
          <button type="submit" className="a-btn">
            Enregistrer
          </button>
        </div>
      </form>

      <details className="a-card">
        <summary>
          <strong>Colonnes de la feuille</strong>
        </summary>
        <p className="a-muted">La première ligne est ajoutée automatiquement. Si vous gardez une ancienne feuille, ajoutez les colonnes manquantes dans cet ordre :</p>
        <p className="a-cols">
          {[...SHEET_COLUMNS.map(([, h]) => h), "Statut"].map((h) => (
            <span key={h} className="a-tag">
              {h}
            </span>
          ))}
        </p>
      </details>

      <details className="a-card">
        <summary>
          <strong>Sécurité : mot secret</strong>
        </summary>
        <p className="a-muted">Le mot secret, déjà inclus dans le script, empêche quelqu&apos;un qui connaîtrait l&apos;adresse d&apos;ajouter de fausses lignes. Changez-le si vous pensez qu&apos;il a été vu : il faudra ensuite recoller le script et le redéployer.</p>
        <form action={newSheetSecretAction}>
          <button type="submit" className="a-btn a-btn-ghost">
            Générer un nouveau mot secret
          </button>
        </form>
      </details>
    </AdminShell>
  );
}
