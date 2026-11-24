"use server";

import { z } from "zod";
import { OWNER_UID, requireAdmin } from "@/lib/admin/auth";
import { audit, go, str } from "@/lib/admin/actionHelpers";
import { LOGIN_RE, MIN_PASSWORD, hashPassword, normalizeLogin } from "@/lib/admin/passwords";
import { db } from "@/lib/db";

const PAGE = "/admin/comptes";
const role = z.enum(["ADMIN", "EMPLOYEE"]);

export async function createUserAction(form: FormData): Promise<void> {
  const me = await requireAdmin("users");
  const login = normalizeLogin(str(form, "login", 40));
  const name = str(form, "name", 60);
  const password = String(form.get("password") ?? "");
  const r = role.safeParse(form.get("role"));
  if (!LOGIN_RE.test(login) || login === "admin") go(PAGE, { erreur: "Identifiant : 3 à 30 lettres minuscules, chiffres, point ou tiret (« admin » est réservé)." });
  if (name.length < 2) go(PAGE, { erreur: "Indiquez le prénom ou le nom de la personne." });
  if (password.length < MIN_PASSWORD) go(PAGE, { erreur: `Mot de passe : ${MIN_PASSWORD} caractères au moins.` });
  if (!r.success) go(PAGE, { erreur: "Rôle invalide." });
  if (await db().adminUser.findUnique({ where: { login } })) go(PAGE, { erreur: `L'identifiant « ${login} » existe déjà.` });
  await db().adminUser.create({ data: { login, name, role: r.data!, passwordHash: hashPassword(password) } });
  await audit(me.actor, "user.created", login, { role: r.data });
  go(PAGE, { ok: `Compte « ${login} » créé. Donnez-lui son identifiant et son mot de passe.` });
}

export async function updateUserAction(form: FormData): Promise<void> {
  const me = await requireAdmin("users");
  const id = str(form, "id", 40);
  const u = await db().adminUser.findUnique({ where: { id } });
  if (!u) go(PAGE, { erreur: "Compte introuvable." });
  const r = role.safeParse(form.get("role"));
  if (!r.success) go(PAGE, { erreur: "Rôle invalide." });
  const active = form.get("active") === "on";
  const password = String(form.get("password") ?? "");
  if (password && password.length < MIN_PASSWORD) go(PAGE, { erreur: `Mot de passe : ${MIN_PASSWORD} caractères au moins.` });
  if (me.uid === u!.id && (!active || r.data !== "ADMIN")) go(PAGE, { erreur: "Vous ne pouvez pas retirer vos propres droits." });
  // Rôle, mot de passe ou accès changés : les sessions ouvertes de ce compte sont fermées.
  const revoke = !active || r.data !== u!.role || !!password;
  await db().adminUser.update({
    where: { id: u!.id },
    data: { role: r.data!, active, ...(password ? { passwordHash: hashPassword(password) } : {}), ...(revoke ? { sessionVersion: { increment: 1 } } : {}) },
  });
  await audit(me.actor, "user.updated", u!.login, { role: r.data, active, passwordChanged: !!password });
  go(PAGE, { ok: `Compte « ${u!.login} » enregistré.` });
}

export async function deleteUserAction(form: FormData): Promise<void> {
  const me = await requireAdmin("users");
  const id = str(form, "id", 40);
  if (id === me.uid || id === OWNER_UID) go(PAGE, { erreur: "Vous ne pouvez pas supprimer votre propre compte." });
  const u = await db().adminUser.findUnique({ where: { id } });
  if (!u) go(PAGE, { erreur: "Compte introuvable." });
  await db().adminUser.delete({ where: { id } });
  await audit(me.actor, "user.deleted", u!.login);
  go(PAGE, { ok: `Compte « ${u!.login} » supprimé.` });
}
