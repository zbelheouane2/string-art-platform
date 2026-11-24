"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { submitReviewAction, type ReviewState } from "./reviewAction";

/** Formulaire d'avis, affiché sous le suivi quand la commande est livrée. */
export function ReviewForm({ number, phone }: { number: string; phone: string }) {
  const t = useTranslations("reviews.form");
  const locale = useLocale();
  const [state, action, pending] = useActionState<ReviewState, FormData>(submitReviewAction, { status: "idle" });
  if (state.status === "sent" || state.status === "already") {
    return (
      <section className="form-card" aria-live="polite">
        <p role="status">{state.status === "sent" ? t("thanks") : t("errors.already")}</p>
      </section>
    );
  }
  return (
    <form action={action} className="form-card review-form" aria-labelledby="review-title">
      <h2 id="review-title">{t("formTitle")}</h2>
      <p className="field-help">{t("formLead")}</p>
      <input type="hidden" name="number" value={number} />
      <input type="hidden" name="phone" value={phone} />
      <input type="hidden" name="locale" value={locale} />
      <div className="field-pair">
        <div className="field-group">
          <label htmlFor="r-name" className="field-label">
            {t("name")}
          </label>
          <input id="r-name" name="name" className="field" required maxLength={40} autoComplete="given-name" />
        </div>
        <div className="field-group">
          <label htmlFor="r-place" className="field-label">
            {t("place")}
          </label>
          <input id="r-place" name="place" className="field" maxLength={60} />
        </div>
      </div>
      <fieldset className="field-group review-stars-input">
        <legend className="field-label">{t("ratingLabel")}</legend>
        {[5, 4, 3, 2, 1].map((n) => (
          <label key={n}>
            <input type="radio" name="rating" value={n} required defaultChecked={n === 5} />
            <span aria-hidden="true">{"★".repeat(n)}</span>
            <span className="visually-hidden">{t("star", { n })}</span>
          </label>
        ))}
      </fieldset>
      <div className="field-group">
        <label htmlFor="r-text" className="field-label">
          {t("text")}
        </label>
        <textarea id="r-text" name="text" className="field" rows={4} required minLength={10} maxLength={800} />
      </div>
      {(state.status === "invalid" || state.status === "notAllowed") && (
        <p className="field-error" role="alert">
          {t(`errors.${state.status}`)}
        </p>
      )}
      <button type="submit" className="btn btn-primary btn-block" disabled={pending}>
        {pending ? t("sending") : t("submit")}
      </button>
    </form>
  );
}
