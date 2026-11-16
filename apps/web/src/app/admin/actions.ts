"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { clientFingerprint } from "@/lib/clientIp";
import { db } from "@/lib/db";
import {
  ADMIN_COOKIE,
  adminEnabled,
  clearLoginFailures,
  encodeAdminSession,
  loginBlocked,
  passwordMatches,
  recordLoginFailure,
  requireAdmin,
} from "@/lib/admin/auth";
import { normalizePromo } from "@/lib/promoRules";
import { parseRateFile, type RateRow } from "@/lib/shipping/rateFile";
import { currentRates, diffRates, saveRates, type RateChange } from "@/lib/shipping/saveRates";
import { rateFileToCsv } from "@/lib/shipping/spreadsheet";
import { WILAYAS } from "@/config/wilayas";

const audit = (action: string, target: string, meta: object = {}) => db().auditLog.create({ data: { actor: "admin", action, target, meta } });
const go = (path: string, msg: { ok?: string; erreur?: string }): never => redirect(`${path}?${new URLSearchParams(msg as Record<string, string>)}`);
/** Le site public relit prix, options et tarifs à chaque page : on vide les caches. */
const refreshSite = () => revalidatePath("/", "layout");

/* ---------------- Connexion ---------------- */

export async function loginAction(_: string | null, form: FormData): Promise<string | null> {
  if (!adminEnabled()) return "L'espace admin n'est pas activé (mot de passe non configuré sur le serveur).";
  const fp = await clientFingerprint();
  if (loginBlocked(fp)) return "Trop d'essais. Réessayez dans 15 minutes.";
  if (!passwordMatches(String(form.get("password") ?? ""))) {
    recordLoginFailure(fp);
    await audit("admin.login_failed", "admin");
    return "Mot de passe incorrect.";
  }
  clearLoginFailures(fp);
  (await cookies()).set(ADMIN_COOKIE, encodeAdminSession(), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 12 * 3600,
  });
  await audit("admin.login", "admin");
  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  (await cookies()).delete(ADMIN_COOKIE);
  redirect("/admin/connexion");
}

/* ---------------- Commandes ---------------- */

const STATUSES = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"] as const;

export async function setOrderStatusAction(form: FormData): Promise<void> {
  await requireAdmin();
  const number = String(form.get("number") ?? "");
  const status = z.enum(STATUSES).safeParse(form.get("status"));
  if (!status.success || !/^DK-[0-9A-Z]{6}$/.test(number)) go("/admin/commandes", { erreur: "État invalide." });
  await db().order.update({ where: { number }, data: { status: status.data! } });
  await audit("order.status", number, { status: status.data });
  go("/admin/commandes", { ok: `Commande ${number} mise à jour.` });
}

/* ---------------- Prix et options ---------------- */

const priceInput = z.coerce.number().int().min(0).max(10_000_000);

export async function savePricesAction(form: FormData): Promise<void> {
  await requireAdmin();
  const market = await db().market.findUniqueOrThrow({ where: { code: "DZ" } });
  const products = await db().product.findMany({ where: { kind: { in: ["KIT", "ACCESSORY"] } } });
  for (const p of products) {
    const raw = form.get(`price_${p.slug}`);
    if (raw === null) continue;
    const active = form.get(`active_${p.slug}`) === "on";
    if (String(raw).trim() === "") {
      if (p.kind === "KIT") go("/admin/prix", { erreur: "Le kit doit avoir un prix." });
      await db().price.deleteMany({ where: { productId: p.id, marketId: market.id } });
    } else {
      const amount = priceInput.safeParse(String(raw).replace(/\s/g, ""));
      if (!amount.success) go("/admin/prix", { erreur: `Prix invalide pour « ${(p.names as { fr: string }).fr} ».` });
      const data = { amountMinor: amount.data! * 100, currency: market.currency };
      await db().price.upsert({ where: { productId_marketId: { productId: p.id, marketId: market.id } }, update: data, create: { ...data, productId: p.id, marketId: market.id } });
    }
    if (p.kind === "ACCESSORY") await db().product.update({ where: { id: p.id }, data: { active } });
  }
  await audit("prices.saved", "DZ");
  refreshSite();
  go("/admin/prix", { ok: "Prix enregistrés. Le site affiche déjà les nouveaux prix." });
}

/* ---------------- Codes promo ---------------- */

const promoSchema = z
  .object({
    code: z.string().transform((v, ctx) => normalizePromo(v) ?? (ctx.addIssue({ code: "custom", message: "Code : 3 à 30 lettres, chiffres, - ou _." }), z.NEVER)),
    kind: z.enum(["PERCENT", "FIXED"]),
    scope: z.enum(["KIT", "ORDER", "SHIPPING"]),
    value: z.coerce.number().int("Valeur : nombre entier.").min(1, "Valeur : au moins 1."),
    minOrder: z.string().optional(),
    startsAt: z.string().optional(),
    endsAt: z.string().optional(),
    maxUses: z.string().optional(),
    maxUsesPerPhone: z.string().optional(),
    note: z.string().trim().max(200).optional(),
  })
  .refine((p) => p.kind !== "PERCENT" || p.value <= (p.scope === "SHIPPING" ? 100 : 90), { message: "Pourcentage : 90 % au plus sur les articles, 100 % sur la livraison." });

const optInt = (v: string | undefined) => (v && v.trim() !== "" ? Math.max(0, Math.round(Number(v.replace(/\s/g, "")))) : null);
const optDate = (v: string | undefined, endOfDay = false) => (v ? new Date(`${v}T${endOfDay ? "23:59:59" : "00:00:00"}+01:00`) : null);

export async function createPromoAction(form: FormData): Promise<void> {
  await requireAdmin();
  const parsed = promoSchema.safeParse(Object.fromEntries(form.entries()));
  if (!parsed.success) go("/admin/promos", { erreur: parsed.error!.issues[0].message });
  const p = parsed.data!;
  if (await db().promoCode.findUnique({ where: { code: p.code } })) go("/admin/promos", { erreur: `Le code ${p.code} existe déjà.` });
  const startsAt = optDate(p.startsAt);
  const endsAt = optDate(p.endsAt, true);
  if (startsAt && endsAt && endsAt < startsAt) go("/admin/promos", { erreur: "La date de fin est avant la date de début." });
  const minOrder = optInt(p.minOrder);
  await db().promoCode.create({
    data: {
      code: p.code,
      kind: p.kind,
      scope: p.scope,
      value: p.kind === "FIXED" ? p.value * 100 : p.value,
      currency: p.kind === "FIXED" ? "DZD" : null,
      minOrderMinor: minOrder === null ? null : minOrder * 100,
      startsAt,
      endsAt,
      maxUses: optInt(p.maxUses) || null,
      maxUsesPerPhone: optInt(p.maxUsesPerPhone) || null,
      note: p.note || null,
    },
  });
  await audit("promo.created", p.code);
  go("/admin/promos", { ok: `Code ${p.code} créé.` });
}

export async function togglePromoAction(form: FormData): Promise<void> {
  await requireAdmin();
  const code = normalizePromo(String(form.get("code") ?? ""));
  if (!code) go("/admin/promos", { erreur: "Code inconnu." });
  const p = await db().promoCode.findUnique({ where: { code: code! } });
  if (!p) go("/admin/promos", { erreur: "Code inconnu." });
  await db().promoCode.update({ where: { code: code! }, data: { active: !p!.active } });
  await audit(p!.active ? "promo.disabled" : "promo.enabled", code!);
  go("/admin/promos", { ok: `Code ${code} ${p!.active ? "désactivé" : "activé"}.` });
}

/* ---------------- Livraison ---------------- */

const carrierCode = z.string().regex(/^[a-z][a-z0-9]{1,29}$/, "Identifiant : lettres minuscules et chiffres, sans espace (ex. « yalidine »).");

export async function addCarrierAction(form: FormData): Promise<void> {
  await requireAdmin();
  const code = carrierCode.safeParse(String(form.get("code") ?? "").trim().toLowerCase());
  const name = String(form.get("name") ?? "").trim().slice(0, 60);
  const logo = String(form.get("logoUrl") ?? "").trim();
  if (!code.success) go("/admin/livraison", { erreur: code.error!.issues[0].message });
  if (name.length < 2) go("/admin/livraison", { erreur: "Indiquez le nom de la société." });
  if (logo && !/^(https:\/\/|\/)[^\s"'<>]{1,300}$/.test(logo)) go("/admin/livraison", { erreur: "Logo : adresse https:// ou chemin commençant par /." });
  if (await db().carrier.findUnique({ where: { code: code.data! } })) go("/admin/livraison", { erreur: "Cette société existe déjà." });
  const market = await db().market.findUniqueOrThrow({ where: { code: "DZ" } });
  await db().$transaction([
    db().carrier.create({ data: { code: code.data!, name, logoUrl: logo || null, active: false } }),
    ...["home", "desk"].map((k) =>
      db().deliveryMethod.upsert({
        where: { marketId_code: { marketId: market.id, code: `${code.data}_${k}` } },
        update: { provider: code.data!, active: true },
        create: { marketId: market.id, code: `${code.data}_${k}`, provider: code.data!, active: true },
      }),
    ),
  ]);
  await audit("carrier.created", code.data!);
  go(`/admin/livraison/${code.data}`, { ok: `${name} ajoutée (inactive). Ajoutez ses tarifs puis activez-la.` });
}

export async function updateCarrierAction(form: FormData): Promise<void> {
  await requireAdmin();
  const code = carrierCode.safeParse(String(form.get("code") ?? ""));
  if (!code.success) go("/admin/livraison", { erreur: "Société inconnue." });
  const c = await db().carrier.findUnique({ where: { code: code.data! } });
  if (!c) go("/admin/livraison", { erreur: "Société inconnue." });
  const back = `/admin/livraison/${c!.code}`;
  const name = String(form.get("name") ?? c!.name).trim().slice(0, 60) || c!.name;
  const logo = String(form.get("logoUrl") ?? "").trim();
  if (logo && !/^(https:\/\/|\/)[^\s"'<>]{1,300}$/.test(logo)) go(back, { erreur: "Logo : adresse https:// ou chemin commençant par /." });
  const active = form.get("active") === "on";
  const home = form.get("home") === "on";
  const desk = form.get("desk") === "on";
  if (active && !home && !desk) go(back, { erreur: "Une société active doit proposer le domicile, le bureau ou les deux." });
  if (!active && (await db().carrier.count({ where: { active: true, code: { not: c!.code } } })) === 0) {
    go(back, { erreur: "Il faut au moins une société active : sinon plus personne ne peut commander." });
  }
  await db().carrier.update({ where: { code: c!.code }, data: { name, logoUrl: logo || null, active } });
  await db().deliveryMethod.updateMany({ where: { provider: c!.code, code: { endsWith: "_home" } }, data: { active: home } });
  await db().deliveryMethod.updateMany({ where: { provider: c!.code, code: { endsWith: "_desk" } }, data: { active: desk } });
  await audit("carrier.updated", c!.code, { active, home, desk });
  refreshSite();
  go(back, { ok: "Société enregistrée." });
}

/** Tableau des tarifs modifié à la main (69 wilayas × domicile / bureau). */
export async function saveRatesTableAction(form: FormData): Promise<void> {
  await requireAdmin();
  const code = carrierCode.safeParse(String(form.get("code") ?? ""));
  if (!code.success || !(await db().carrier.findUnique({ where: { code: code.data } }))) go("/admin/livraison", { erreur: "Société inconnue." });
  const back = `/admin/livraison/${code.data}`;
  const rows: RateRow[] = [];
  for (const w of WILAYAS) {
    const cell = (k: string) => {
      const v = String(form.get(`${k}_${w.code}`) ?? "").replace(/\s/g, "");
      if (v === "") return null;
      const n = Number(v);
      return Number.isInteger(n) && n >= 0 && n <= 100_000 ? n : NaN;
    };
    const home = cell("home");
    const desk = cell("desk");
    if (Number.isNaN(home) || Number.isNaN(desk)) go(back, { erreur: `Montant invalide pour la wilaya ${w.code} - ${w.fr}.` });
    rows.push({ zone: w.code, home, desk });
  }
  const r = await saveRates(db(), code.data!, rows, "admin");
  await audit("rates.saved", code.data!, r);
  refreshSite();
  go(back, { ok: `Tarifs enregistrés (${r.set} montants).` });
}

export type RatePreview =
  | { ok: true; fileName: string; rows: RateRow[]; changes: RateChange[]; unchanged: number }
  | { ok: false; errors: string[] };

/** Étape 1 de l'import : lit le fichier et montre les changements, sans rien enregistrer. */
export async function previewRateFileAction(_: RatePreview | null, form: FormData): Promise<RatePreview> {
  await requireAdmin();
  const code = carrierCode.safeParse(String(form.get("code") ?? ""));
  const file = form.get("file");
  if (!code.success) return { ok: false, errors: ["Société inconnue."] };
  if (!(file instanceof File) || file.size === 0) return { ok: false, errors: ["Choisissez un fichier Excel (.xlsx) ou CSV."] };
  if (file.size > 2 * 1024 * 1024) return { ok: false, errors: ["Fichier trop lourd (2 Mo au plus)."] };
  if (!/\.(xlsx|csv|txt)$/i.test(file.name)) return { ok: false, errors: ["Format accepté : .xlsx ou .csv."] };
  let csv: string;
  try {
    csv = await rateFileToCsv(file.name, await file.arrayBuffer());
  } catch {
    return { ok: false, errors: ["Fichier illisible. Enregistrez-le en .xlsx ou en .csv puis réessayez."] };
  }
  const parsed = parseRateFile(csv);
  if (!parsed.ok) return { ok: false, errors: parsed.errors.slice(0, 20) };
  const changes = diffRates(await currentRates(db(), code.data), parsed.rows);
  return { ok: true, fileName: file.name, rows: parsed.rows, changes, unchanged: parsed.rows.length * 2 - changes.length };
}

/** Étape 2 de l'import : enregistre les lignes vérifiées à l'étape 1. */
export async function applyRateFileAction(form: FormData): Promise<void> {
  await requireAdmin();
  const code = carrierCode.safeParse(String(form.get("code") ?? ""));
  if (!code.success) go("/admin/livraison", { erreur: "Société inconnue." });
  const back = `/admin/livraison/${code.data}`;
  const rows = z
    .array(z.object({ zone: z.string().refine((z0) => WILAYAS.some((w) => w.code === z0)), home: z.number().int().min(0).max(100_000).nullable(), desk: z.number().int().min(0).max(100_000).nullable() }))
    .max(WILAYAS.length)
    .safeParse(JSON.parse(String(form.get("rows") ?? "[]")));
  if (!rows.success) go(back, { erreur: "Import invalide, recommencez." });
  const r = await saveRates(db(), code.data!, rows.data!, `fichier:${String(form.get("fileName") ?? "").slice(0, 80)}`);
  await audit("rates.imported", code.data!, r);
  refreshSite();
  go(back, { ok: `Import terminé : ${r.set} montants enregistrés, ${r.cleared} supprimés.` });
}
