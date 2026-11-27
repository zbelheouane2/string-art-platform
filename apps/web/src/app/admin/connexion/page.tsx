import { redirect } from "next/navigation";
import { adminEnabled, isAdmin } from "@/lib/admin/auth";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await isAdmin()) redirect("/admin");
  return (
    <main className="admin-login">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/visuels/marque/deekra-logo.webp" alt="Deekra" width={101} height={110} />
      <h1>Espace admin</h1>
      {!adminEnabled() && <p className="a-flash a-flash-error">Accès du propriétaire non activé sur ce serveur (variable ADMIN_PASSWORD absente). Les comptes employés restent utilisables.</p>}
      <LoginForm />
    </main>
  );
}
