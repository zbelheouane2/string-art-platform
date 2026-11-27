import { requireAdmin } from "@/lib/admin/auth";
import { displayPhone } from "@/lib/contact";
import { getContacts } from "@/lib/settings";
import { saveContactsAction } from "../_actions/content";
import { AdminShell, Flash } from "../AdminShell";

export const dynamic = "force-dynamic";

/** Coordonnées affichées sur le site : WhatsApp, e-mail, réseaux sociaux, mention ANPDP. */
export default async function ContactsPage({ searchParams }: { searchParams: Promise<{ ok?: string; erreur?: string }> }) {
  await requireAdmin("contacts");
  const q = await searchParams;
  const c = await getContacts();
  return (
    <AdminShell title="Contacts et réseaux" current="/admin/contacts" lead="Coordonnées affichées dans le pied de page, la page contact et les pages légales. Un champ vide n'est pas affiché.">
      <Flash ok={q.ok} error={q.erreur} />
      <form action={saveContactsAction} className="a-card">
        <div className="a-grid">
          <label>
            Numéro WhatsApp
            <input name="whatsapp" className="a-input" inputMode="tel" defaultValue={c.whatsapp ? displayPhone(c.whatsapp) : ""} placeholder="0771 70 40 33" />
          </label>
          <label>
            E-mail de contact
            <input name="supportEmail" type="email" className="a-input" defaultValue={c.supportEmail} />
          </label>
          <label>
            Instagram
            <input name="instagram" type="url" className="a-input" defaultValue={c.instagram} placeholder="https://instagram.com/…" />
          </label>
          <label>
            Facebook
            <input name="facebook" type="url" className="a-input" defaultValue={c.facebook} placeholder="https://facebook.com/…" />
          </label>
          <label>
            TikTok
            <input name="tiktok" type="url" className="a-input" defaultValue={c.tiktok} placeholder="https://tiktok.com/@…" />
          </label>
          <label>
            Récépissé ANPDP (loi 18-07)
            <input name="anpdp" className="a-input" defaultValue={c.anpdp} />
          </label>
          <div className="a-span">
            <button type="submit" className="a-btn">
              Enregistrer
            </button>
          </div>
        </div>
      </form>
    </AdminShell>
  );
}
