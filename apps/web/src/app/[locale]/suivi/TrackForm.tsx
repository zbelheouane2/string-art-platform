"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { formatPrice } from "@/lib/price";
import { trackAction, type TrackState } from "./actions";
import { ReviewForm } from "./ReviewForm";

const STEPS = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED"] as const;

export function TrackForm() {
  const t = useTranslations("track");
  const locale = useLocale();
  const [state, action, pending] = useActionState<TrackState, FormData>(trackAction, { result: null, values: { number: "", phone: "" } });
  const r = state.result;
  const failed = r && !r.ok ? r.error : null;
  return (
    <div className="track">
      <form action={action} className="form-card track-form" noValidate>
        <div className="field-pair">
          <div className="field-group">
            <label htmlFor="t-number" className="field-label">
              {t("number")}
            </label>
            <input id="t-number" name="number" className="field" dir="ltr" placeholder="DK-XXXXXX" defaultValue={state.values.number} required autoCapitalize="characters" />
          </div>
          <div className="field-group">
            <label htmlFor="t-phone" className="field-label">
              {t("phone")}
            </label>
            <input id="t-phone" name="phone" className="field" type="tel" dir="ltr" inputMode="tel" placeholder="05XX XX XX XX" defaultValue={state.values.phone} required />
          </div>
        </div>
        {failed && (
          <p className="field-error" role="alert">
            {t(`errors.${failed}`)}
          </p>
        )}
        <button type="submit" className="btn btn-primary btn-block" disabled={pending}>
          {pending ? t("searching") : t("submit")}
        </button>
        <p className="field-help">{t("help")}</p>
      </form>

      {r?.ok && (
        <section className="form-card track-result" aria-live="polite">
          <p className="order-number">
            {t("order")} <strong dir="ltr">{r.number}</strong>
          </p>
          {r.status === "CANCELLED" || r.status === "RETURNED" ? (
            <p className="track-status">{t(`status.${r.status}`)}</p>
          ) : (
            <ol className="track-steps">
              {STEPS.map((s, i) => {
                const reached = STEPS.indexOf(r.status as (typeof STEPS)[number]) >= i;
                return (
                  <li key={s} data-done={reached} aria-current={r.status === s ? "step" : undefined}>
                    {t(`status.${s}`)}
                  </li>
                );
              })}
            </ol>
          )}
          <p className="field-help">
            {t("placed", {
              date: new Intl.DateTimeFormat(locale === "ar" ? "ar-u-nu-latn" : locale, { day: "numeric", month: "long", year: "numeric" }).format(new Date(r.createdAt)),
              total: formatPrice({ amountMinor: r.totalMinor, currency: r.currency }, locale),
            })}
          </p>
        </section>
      )}
      {r?.ok && r.status === "DELIVERED" && <ReviewForm number={r.number} phone={state.values.phone} />}
    </div>
  );
}
