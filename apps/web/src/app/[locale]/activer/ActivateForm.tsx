"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { activateAction, type ActivateState } from "./actions";

/** Met en forme la saisie au fil de la frappe : XXXX-XXXX en majuscules. */
function formatTyping(raw: string): string {
  const clean = raw.toUpperCase().replace(/[^0-9A-Z]/g, "").slice(0, 8);
  return clean.length > 4 ? `${clean.slice(0, 4)}-${clean.slice(4)}` : clean;
}

export function ActivateForm() {
  const t = useTranslations("activate");
  const locale = useLocale();
  const [state, action, pending] = useActionState<ActivateState, FormData>(activateAction, { error: null, value: "" });

  return (
    <form action={action} className="form-card" noValidate>
      <input type="hidden" name="locale" value={locale} />
      <label htmlFor="code" className="field-label">
        {t("label")}
      </label>
      <input
        id="code"
        name="code"
        className="field code-input"
        dir="ltr"
        inputMode="text"
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        placeholder="XXXX-XXXX"
        defaultValue={state.value}
        maxLength={12}
        required
        aria-invalid={state.error ? true : undefined}
        aria-describedby={state.error ? "code-error" : "code-help"}
        onInput={(e) => {
          const el = e.currentTarget;
          el.value = formatTyping(el.value);
        }}
      />
      {state.error ? (
        <p id="code-error" className="field-error" role="alert">
          {t(`errors.${state.error}`)}
        </p>
      ) : (
        <p id="code-help" className="field-help">
          {t("help")}
        </p>
      )}
      <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={pending}>
        {pending ? t("checking") : t("submit")}
      </button>
    </form>
  );
}
