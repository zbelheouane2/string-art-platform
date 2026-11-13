"use client";

import { useActionState, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { WILAYAS } from "@/config/wilayas";
import { orderAction, type OrderState } from "./actions";

interface Props {
  /** Total affiché pour chaque quantité (index 0 = 1 kit), calculé côté serveur. */
  prices: string[];
  delivery: string[];
  payment: string[];
  maxQuantity: number;
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="field-group">
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}

export function OrderForm({ prices, delivery, payment, maxQuantity }: Props) {
  const t = useTranslations("order");
  const locale = useLocale();
  const [state, action, pending] = useActionState<OrderState, FormData>(orderAction, { fieldErrors: {}, formError: null, values: {} });
  const v = state.values;
  const [quantity, setQuantity] = useState(Number(v.quantity ?? 1));
  const [mode, setMode] = useState(v.delivery ?? delivery[0]);
  const err = (k: string) => (state.fieldErrors[k] ? t(`errors.${state.fieldErrors[k]}`) : undefined);
  const aria = (k: string) => (state.fieldErrors[k] ? { "aria-invalid": true, "aria-describedby": `${k}-error` } : {});

  return (
    <form action={action} className="order-form" noValidate>
      <input type="hidden" name="locale" value={locale} />

      <fieldset className="form-section">
        <legend>{t("sections.contact")}</legend>
        <Field id="fullName" label={t("fields.fullName")} error={err("fullName")}>
          <input id="fullName" name="fullName" className="field" autoComplete="name" defaultValue={v.fullName} required {...aria("fullName")} />
        </Field>
        <Field id="phone" label={t("fields.phone")} error={err("phone")}>
          <input id="phone" name="phone" className="field" type="tel" dir="ltr" inputMode="tel" autoComplete="tel" placeholder="05XX XX XX XX" defaultValue={v.phone} required {...aria("phone")} />
        </Field>
      </fieldset>

      <fieldset className="form-section">
        <legend>{t("sections.delivery")}</legend>
        <div className="choice-row">
          {delivery.map((d) => (
            <label key={d} className="choice">
              <input type="radio" name="delivery" value={d} checked={mode === d} onChange={() => setMode(d)} />
              <span>
                <strong>{t(`delivery.${d}.name`)}</strong>
                <small>{t(`delivery.${d}.text`)}</small>
              </span>
            </label>
          ))}
        </div>
        <Field id="wilaya" label={t("fields.wilaya")} error={err("wilaya")}>
          <select id="wilaya" name="wilaya" className="field" defaultValue={v.wilaya ?? ""} required {...aria("wilaya")}>
            <option value="" disabled>
              {t("fields.wilayaPick")}
            </option>
            {WILAYAS.map((w) => (
              <option key={w.code} value={w.code}>
                {w.code} · {locale === "ar" ? w.ar : w.fr}
              </option>
            ))}
          </select>
        </Field>
        <Field id="commune" label={t("fields.commune")} error={err("commune")}>
          <input id="commune" name="commune" className="field" autoComplete="address-level2" defaultValue={v.commune} required {...aria("commune")} />
        </Field>
        {mode.endsWith("_home") && (
          <Field id="address" label={t("fields.address")} error={err("address")}>
            <input id="address" name="address" className="field" autoComplete="street-address" defaultValue={v.address} required {...aria("address")} />
          </Field>
        )}
        <p className="field-help">{t("deliveryFees")}</p>
      </fieldset>

      <fieldset className="form-section">
        <legend>{t("sections.payment")}</legend>
        <div className="choice-row">
          {payment.map((p) => (
            <label key={p} className="choice">
              <input type="radio" name="payment" value={p} defaultChecked={(v.payment ?? payment[0]) === p} />
              <span>
                <strong>{t(`payment.${p}.name`)}</strong>
                <small>{t(`payment.${p}.text`)}</small>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend>{t("sections.summary")}</legend>
        <Field id="quantity" label={t("fields.quantity")} error={err("quantity")}>
          <select id="quantity" name="quantity" className="field field-short" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))}>
            {Array.from({ length: maxQuantity }, (_, i) => i + 1).map((q) => (
              <option key={q} value={q}>
                {q}
              </option>
            ))}
          </select>
        </Field>
        <Field id="note" label={t("fields.note")} error={err("note")}>
          <textarea id="note" name="note" className="field" rows={2} defaultValue={v.note} {...aria("note")} />
        </Field>
        <p className="order-total">
          <span>{t("total")}</span>
          <strong>{prices[quantity - 1]}</strong>
        </p>
      </fieldset>

      {state.formError && (
        <p className="field-error" role="alert">
          {t(`errors.${state.formError}`)}
        </p>
      )}
      {Object.keys(state.fieldErrors).length > 0 && (
        <p className="field-error" role="alert">
          {t("errors.check")}
        </p>
      )}
      <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={pending}>
        {pending ? t("sending") : t("submit")}
      </button>
      <p className="field-help">{t("privacy")}</p>
    </form>
  );
}
