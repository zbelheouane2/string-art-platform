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
      {adminEnabled() ? <LoginForm /> : <p className="a-flash a-flash-error">L&apos;espace admin n&apos;est pas activé sur ce serveur (variable ADMIN_PASSWORD absente).</p>}
    </main>
  );
}
