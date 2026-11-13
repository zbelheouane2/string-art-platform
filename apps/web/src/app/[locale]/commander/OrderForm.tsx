"use client";

import { useActionState, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { OTHER_COMMUNE, communesOf } from "@/config/communes";
import { WILAYAS } from "@/config/wilayas";
import { AccessoryPicker } from "@/components/AccessoryPicker";
import type { CheckoutAccessory } from "@/lib/orders";
import { formatPrice, type Price } from "@/lib/price";
import { orderAction, type OrderState } from "./actions";

interface Props {
  /** Prix unitaire du kit (lu en base). Le serveur recalcule tout à la validation. */
  price: Price;
  /** Frais connus : mode de livraison → wilaya → montant. */
  rates: Record<string, Record<string, number>>;
  delivery: string[];
  payment: string[];
  maxQuantity: number;
  /** Ouvre le formulaire en mode « cadeau pour un proche en Algérie ». */
  giftDefault?: boolean;
  /** Options proposées (prix lus en base). */
  accessories?: CheckoutAccessory[];
  /** Options déjà choisies sur la fiche du kit. */
  optionsDefault?: string[];
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

export function OrderForm({ price, rates, delivery, payment, maxQuantity, giftDefault = false, accessories = [], optionsDefault = [] }: Props) {
  const t = useTranslations("order");
  const locale = useLocale();
  const [state, action, pending] = useActionState<OrderState, FormData>(orderAction, { fieldErrors: {}, formError: null, values: {} });
  const v = state.values;
  const [quantity, setQuantity] = useState(Number(v.quantity ?? 1));
  const [gift, setGift] = useState(v.gift ? v.gift === "on" : giftDefault);
  const [mode, setMode] = useState(v.delivery ?? delivery[0]);
  const [wilaya, setWilaya] = useState(v.wilaya ?? "");
  const [commune, setCommune] = useState(v.commune ?? "");
  const communes = communesOf(wilaya);
  const fee = wilaya ? (rates[mode]?.[wilaya] ?? null) : null;
  const money = (amountMinor: number) => formatPrice({ amountMinor, currency: price.currency }, locale);
  const [options, setOptions] = useState<string[]>(v.options !== undefined ? v.options.split(",").filter(Boolean) : optionsDefault);
  const chosen = accessories.filter((a) => options.includes(a.slug));
  const items = price.amountMinor * quantity;
  const extras = chosen.reduce((sum, a) => sum + a.price.amountMinor, 0);
  const err = (k: string) => (state.fieldErrors[k] ? t(`errors.${state.fieldErrors[k]}`) : undefined);
  const aria = (k: string) => (state.fieldErrors[k] ? { "aria-invalid": true, "aria-describedby": `${k}-error` } : {});

  return (
    <form action={action} className="order-form" noValidate>
      <input type="hidden" name="locale" value={locale} />

      <label className="choice gift-toggle">
        <input type="checkbox" name="gift" checked={gift} onChange={(e) => setGift(e.target.checked)} />
        <span>
          <strong>{t("gift.toggle")}</strong>
          <small>{t("gift.toggleText")}</small>
        </span>
      </label>

      {gift && (
        <fieldset className="form-section">
          <legend>{t("sections.buyer")}</legend>
          <Field id="buyerName" label={t("fields.fullName")} error={err("buyerName")}>
            <input id="buyerName" name="buyerName" className="field" autoComplete="name" defaultValue={v.buyerName} required {...aria("buyerName")} />
          </Field>
          <Field id="buyerPhone" label={t("fields.buyerPhone")} error={err("buyerPhone")}>
            <input id="buyerPhone" name="buyerPhone" className="field" type="tel" dir="ltr" inputMode="tel" autoComplete="tel" placeholder="+33 6 12 34 56 78" defaultValue={v.buyerPhone} required {...aria("buyerPhone")} />
          </Field>
          <Field id="buyerEmail" label={t("fields.buyerEmail")} error={err("buyerEmail")}>
            <input id="buyerEmail" name="buyerEmail" className="field" type="email" dir="ltr" autoComplete="email" defaultValue={v.buyerEmail} {...aria("buyerEmail")} />
          </Field>
        </fieldset>
      )}

      <fieldset className="form-section">
        <legend>{gift ? t("sections.recipient") : t("sections.contact")}</legend>
        {gift && <p className="field-help form-lead">{t("gift.recipientHelp")}</p>}
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
          <select
            id="wilaya"
            name="wilaya"
            className="field"
            value={wilaya}
            onChange={(e) => {
              setWilaya(e.target.value);
              setCommune("");
            }}
            required
            {...aria("wilaya")}
          >
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
          <select id="commune" name="commune" className="field" value={commune} onChange={(e) => setCommune(e.target.value)} disabled={!wilaya} required {...aria("commune")}>
            <option value="" disabled>
              {wilaya ? t("fields.communePick") : t("fields.communeFirst")}
            </option>
            {communes.map(([fr, ar]) => (
              <option key={fr} value={fr}>
                {locale === "ar" ? ar : fr}
              </option>
            ))}
            {wilaya && <option value={OTHER_COMMUNE}>{t("fields.communeOther")}</option>}
          </select>
        </Field>
        {commune === OTHER_COMMUNE && (
          <Field id="communeOther" label={t("fields.communeOtherLabel")}>
            <input id="communeOther" name="communeOther" className="field" autoComplete="address-level2" defaultValue={v.communeOther} required />
          </Field>
        )}
        <p className="field-help" aria-live="polite">
          {!wilaya ? t("feePickWilaya") : fee === null ? t("deliveryFees") : t("feeKnown", { fee: money(fee) })}
        </p>
      </fieldset>

      <fieldset className="form-section">
        <legend>{t("sections.payment")}</legend>
        {gift && <p className="field-help form-lead">{t("gift.paymentHelp")}</p>}
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
        <AccessoryPicker accessories={accessories} selected={options} onChange={setOptions} name="options" />
        {gift && (
          <Field id="giftMessage" label={t("fields.giftMessage")} error={err("giftMessage")}>
            <textarea id="giftMessage" name="giftMessage" className="field" rows={3} maxLength={200} defaultValue={v.giftMessage} {...aria("giftMessage")} />
          </Field>
        )}
        <Field id="note" label={t("fields.note")} error={err("note")}>
          <textarea id="note" name="note" className="field" rows={2} defaultValue={v.note} {...aria("note")} />
        </Field>
        <dl className="order-lines">
          <div>
            <dt>{t("lineItems", { count: quantity })}</dt>
            <dd>{money(items)}</dd>
          </div>
          {chosen.map((a) => (
            <div key={a.slug}>
              <dt>{a.names[locale as "fr" | "en" | "ar"] ?? a.names.fr}</dt>
              <dd>{money(a.price.amountMinor)}</dd>
            </div>
          ))}
          <div>
            <dt>{t("lineDelivery")}</dt>
            <dd>{fee === null ? t("feeLater") : money(fee)}</dd>
          </div>
        </dl>
        <p className="order-total">
          <span>{fee === null ? t("total") : t("totalWithDelivery")}</span>
          <strong>{money(items + extras + (fee ?? 0))}</strong>
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
