"use client";

import { useActionState } from "react";
import { loginAction } from "../actions";

export function LoginForm() {
  const [error, action, pending] = useActionState(loginAction, null);
  return (
    <form action={action} className="a-card a-stack">
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
