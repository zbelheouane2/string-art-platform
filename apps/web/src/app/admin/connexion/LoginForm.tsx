"use client";

import { useActionState } from "react";
import { loginAction } from "../actions";

export function LoginForm() {
  const [error, action, pending] = useActionState(loginAction, null);
  return (
    <form action={action} className="a-card a-stack">
      <label htmlFor="login">Identifiant</label>
      <input id="login" name="login" autoComplete="username" autoCapitalize="none" spellCheck={false} className="a-input" placeholder="admin" aria-describedby="login-hint" />
      <p id="login-hint" className="a-muted a-small">
        Propriétaire : « admin » ou laissez vide. Employé : l&apos;identifiant donné par l&apos;administrateur.
      </p>
      <label htmlFor="password">Mot de passe</label>
      <input id="password" name="password" type="password" autoComplete="current-password" required className="a-input" aria-invalid={error ? true : undefined} aria-describedby={error ? "login-error" : undefined} />
      {error && (
        <p id="login-error" className="a-error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="a-btn" disabled={pending}>
        {pending ? "Connexion…" : "Se connecter"}
      </button>
    </form>
  );
}
