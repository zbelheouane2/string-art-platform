"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { useLocale, useTranslations } from "next-intl";
import { OTHER_COMMUNE, communesOf } from "@/config/communes";
import { WILAYAS } from "@/config/wilayas";
import { QuantityStepper, useCart } from "@/components/Cart";
import type { CheckoutAccessory } from "@/lib/orders";
import { formatPrice, type Price } from "@/lib/price";
import { promoDiscount, type PromoRule } from "@/lib/promoRules";
import { encodeLines } from "@/lib/shopTypes";
import { orderAction, type OrderState } from "./actions";
import { checkPromoAction } from "./promoAction";

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
  /** Engagements (délai, paiement, échange, WhatsApp) rappelés juste avant le bouton. */
  trust?: ReactNode;
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
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

export function OrderForm({
  price,
  rates,
  delivery,
  payment,
  maxQuantity,
  giftDefault = false,
  accessories = [],
  optionsDefault = [],
  trust,
}: Props) {
  const t = useTranslations("order");
  const locale = useLocale();
  const [state, action, pending] = useActionState<OrderState, FormData>(
    orderAction,
    { fieldErrors: {}, formError: null, values: {} },
  );
  const v = state.values;
  const formRef = useRef<HTMLFormElement>(null);
  // Après un envoi refusé : on amène le premier champ en erreur à l'écran et on y place le curseur.
  useEffect(() => {
    const first = formRef.current?.querySelector<HTMLElement>(
      '[aria-invalid="true"]',
    );
    if (!first) return;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches;
    first.scrollIntoView({
      block: "center",
      behavior: smooth ? "smooth" : "auto",
    });
    first.focus({ preventScroll: true });
  }, [state]);
  const [gift, setGift] = useState(v.gift ? v.gift === "on" : giftDefault);
  const [mode, setMode] = useState(v.delivery ?? delivery[0]);
  const [wilaya, setWilaya] = useState(v.wilaya ?? "");
  const [commune, setCommune] = useState(v.commune ?? "");
  const communes = communesOf(wilaya);
  const fee = wilaya ? (rates[mode]?.[wilaya] ?? null) : null;
  const money = (amountMinor: number) =>
    formatPrice({ amountMinor, currency: price.currency }, locale);
  // Articles : ceux du panier (partagé avec le tiroir). Panier vide = 1 kit.
  // Les options passées dans l'adresse (?options=…) ou renvoyées après une erreur sont ajoutées.
  const cart = useCart();
  const kitSlug = cart.catalog?.kit.slug ?? "kit-portrait-50";
  const seeded = useRef(false);
  useEffect(() => {
    if (!cart.ready || seeded.current) return;
    seeded.current = true;
    const next = { ...cart.lines };
    if (v.quantity) next[kitSlug] = Number(v.quantity) || 1;
    if (!next[kitSlug]) next[kitSlug] = 1;
    const extra =
      v.options !== undefined
        ? v.options.split(",").filter(Boolean)
        : optionsDefault;
    for (const part of extra) {
      const [slug, q] = part.split(":");
      if (accessories.some((a) => a.slug === slug))
        next[slug] = Math.max(next[slug] ?? 0, Number(q ?? 1) || 1);
    }
    cart.replace(next);
  }, [cart, kitSlug, v.quantity, v.options, optionsDefault, accessories]);
  const quantity = cart.lines[kitSlug] ?? 1;
  const optionLines = Object.fromEntries(
    accessories
      .filter((a) => cart.lines[a.slug])
      .map((a) => [a.slug, cart.lines[a.slug]]),
  );
  const extras = accessories.reduce(
    (sum, a) => sum + a.price.amountMinor * (optionLines[a.slug] ?? 0),
    0,
  );
  const items = price.amountMinor * quantity;
  const subtotal = items + extras;

  // Code promo : vérifié par le serveur pour l'affichage, revérifié à la commande.
  const [promoInput, setPromoInput] = useState(v.promo ?? "");
  const [promo, setPromo] = useState<PromoRule | null>(null);
  const [promoError, setPromoError] = useState<string | null>(
    state.fieldErrors.promo ??
      (state.formError?.startsWith("promo") ? state.formError : null),
  );
  const [checking, startCheck] = useTransition();
  const applyPromo = (code: string) =>
    startCheck(async () => {
      const r = await checkPromoAction(code);
      if (r.ok) {
        setPromo(r.rule);
        setPromoError(null);
      } else {
        setPromo(null);
        setPromoError(r.error);
      }
    });
  const discount = promo ? promoDiscount(promo, subtotal, price.currency) : 0;
  const [summaryOpen, setSummaryOpen] = useState(false);
  const err = (k: string) =>
    state.fieldErrors[k] ? t(`errors.${state.fieldErrors[k]}`) : undefined;
  const aria = (k: string) =>
    state.fieldErrors[k]
      ? { "aria-invalid": true, "aria-describedby": `${k}-error` }
      : {};

  return (
    <div className="checkout">
      <form
        ref={formRef}
        action={action}
        id="order-form"
        className="order-form checkout-main"
        noValidate
      >
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="quantity" value={quantity} />
        <input type="hidden" name="options" value={encodeLines(optionLines)} />
        <input type="hidden" name="promo" value={promo?.code ?? ""} />

        <label className="choice gift-toggle">
          <input
            type="checkbox"
            name="gift"
            checked={gift}
            onChange={(e) => setGift(e.target.checked)}
          />
          <span>
            <strong>{t("gift.toggle")}</strong>
            <small>{t("gift.toggleText")}</small>
          </span>
        </label>

        {gift && (
          <fieldset className="form-section">
            <legend>{t("sections.buyer")}</legend>
            <Field
              id="buyerName"
              label={t("fields.fullName")}
              error={err("buyerName")}
            >
              <input
                id="buyerName"
                name="buyerName"
                className="field"
                autoComplete="name"
                defaultValue={v.buyerName}
                required
                {...aria("buyerName")}
              />
            </Field>
            <Field
              id="buyerPhone"
              label={t("fields.buyerPhone")}
              error={err("buyerPhone")}
            >
              <input
                id="buyerPhone"
                name="buyerPhone"
                className="field"
                type="tel"
                dir="ltr"
                inputMode="tel"
                autoComplete="tel"
                placeholder="+33 6 12 34 56 78"
                defaultValue={v.buyerPhone}
                required
                {...aria("buyerPhone")}
              />
            </Field>
            <Field
              id="buyerEmail"
              label={t("fields.buyerEmail")}
              error={err("buyerEmail")}
            >
              <input
                id="buyerEmail"
                name="buyerEmail"
                className="field"
                type="email"
                dir="ltr"
                autoComplete="email"
                defaultValue={v.buyerEmail}
                {...aria("buyerEmail")}
              />
            </Field>
          </fieldset>
        )}

        <fieldset className="form-section">
          <legend>
            {gift ? t("sections.recipient") : t("sections.contact")}
          </legend>
          {gift && (
            <p className="field-help form-lead">{t("gift.recipientHelp")}</p>
          )}
          <div className="field-pair">
            <Field
              id="fullName"
              label={t("fields.fullName")}
              error={err("fullName")}
            >
              <input
                id="fullName"
                name="fullName"
                className="field"
                autoComplete="name"
                defaultValue={v.fullName}
                required
                {...aria("fullName")}
              />
            </Field>
            <Field id="phone" label={t("fields.phone")} error={err("phone")}>
              <input
                id="phone"
                name="phone"
                className="field"
                type="tel"
                dir="ltr"
                inputMode="tel"
                autoComplete="tel"
                placeholder="05XX XX XX XX"
                defaultValue={v.phone}
                required
                {...aria("phone")}
              />
            </Field>
          </div>
        </fieldset>

        <fieldset className="form-section">
          <legend>{t("sections.delivery")}</legend>
          <div className="choice-row choice-compact">
            {delivery.map((d) => (
              <label key={d} className="choice">
                <input
                  type="radio"
                  name="delivery"
                  value={d}
                  checked={mode === d}
                  onChange={() => setMode(d)}
                />
                <span>
                  <strong>{t(`delivery.${d}.name`)}</strong>
                  <small>{t(`delivery.${d}.text`)}</small>
                </span>
              </label>
            ))}
          </div>
          <div className="field-pair">
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
            <Field
              id="commune"
              label={t("fields.commune")}
              error={err("commune")}
            >
              <select
                id="commune"
                name="commune"
                className="field"
                value={commune}
                onChange={(e) => setCommune(e.target.value)}
                disabled={!wilaya}
                required
                {...aria("commune")}
              >
                <option value="" disabled>
                  {wilaya ? t("fields.communePick") : t("fields.communeFirst")}
                </option>
                {communes.map(([fr, ar]) => (
                  <option key={fr} value={fr}>
                    {locale === "ar" ? ar : fr}
                  </option>
                ))}
                {wilaya && (
                  <option value={OTHER_COMMUNE}>
                    {t("fields.communeOther")}
                  </option>
                )}
              </select>
            </Field>
          </div>
          {commune === OTHER_COMMUNE && (
            <Field id="communeOther" label={t("fields.communeOtherLabel")}>
              <input
                id="communeOther"
                name="communeOther"
                className="field"
                autoComplete="address-level2"
                defaultValue={v.communeOther}
                required
              />
            </Field>
          )}
          <p className="field-help" aria-live="polite">
            {!wilaya
              ? t("feePickWilaya")
              : fee === null
                ? t("deliveryFees")
                : t("feeKnown", { fee: money(fee) })}
          </p>
        </fieldset>

        {payment.length === 1 ? (
          <input type="hidden" name="payment" value={payment[0]} />
        ) : (
          <fieldset className="form-section">
            <legend>{t("sections.payment")}</legend>
            {gift && (
              <p className="field-help form-lead">{t("gift.paymentHelp")}</p>
            )}
            <div className="choice-row">
              {payment.map((p) => (
                <label key={p} className="choice">
                  <input
                    type="radio"
                    name="payment"
                    value={p}
                    defaultChecked={(v.payment ?? payment[0]) === p}
                  />
                  <span>
                    <strong>{t(`payment.${p}.name`)}</strong>
                    <small>{t(`payment.${p}.text`)}</small>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        <fieldset className="form-section">
          <legend>{t("sections.more")}</legend>
          {gift && (
            <Field
              id="giftMessage"
              label={t("fields.giftMessage")}
              error={err("giftMessage")}
            >
              <textarea
                id="giftMessage"
                name="giftMessage"
                className="field"
                rows={3}
                maxLength={200}
                defaultValue={v.giftMessage}
                {...aria("giftMessage")}
              />
            </Field>
          )}
          <details
            className="form-more"
            open={Boolean(v.note || state.fieldErrors.note)}
          >
            <summary>{t("fields.note")}</summary>
            <Field id="note" label={t("fields.note")} error={err("note")}>
              <textarea
                id="note"
                name="note"
                className="field"
                rows={2}
                defaultValue={v.note}
                {...aria("note")}
              />
            </Field>
          </details>
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
        {trust}
        <button
          type="submit"
          className="btn btn-primary btn-lg btn-block"
          disabled={pending}
        >
          {pending ? t("sending") : t("submit")}
        </button>
        <p className="field-help">{t("privacy")}</p>
      </form>

      {/* Récapitulatif fixe à droite (ordinateur), repliable au-dessus du formulaire (téléphone). */}
      <aside
        className="checkout-summary"
        aria-labelledby="summary-title"
        data-open={summaryOpen ? "true" : undefined}
      >
        <button
          type="button"
          className="summary-toggle"
          aria-expanded={summaryOpen}
          aria-controls="summary-body"
          onClick={() => setSummaryOpen((o) => !o)}
        >
          <span>{summaryOpen ? t("summaryHide") : t("summaryShow")}</span>
          <strong>{money(subtotal - discount + (fee ?? 0))}</strong>
        </button>
        <div id="summary-body" className="summary-body">
          <h2 id="summary-title" className="summary-title">
            {t("sections.summary")}
          </h2>
          <ul className="summary-items">
            {cart.catalog &&
              [cart.catalog.kit, ...cart.catalog.accessories]
                .filter((it) =>
                  it.slug === kitSlug ? true : optionLines[it.slug],
                )
                .map((it) => {
                  const q =
                    it.slug === kitSlug ? quantity : optionLines[it.slug];
                  const name =
                    it.names[locale as "fr" | "en" | "ar"] ?? it.names.fr;
                  return (
                    <li key={it.slug} className="summary-item">
                      <span className="summary-thumb">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={it.thumb} alt="" width={64} height={64} />
                        <span className="summary-qty" aria-hidden="true">
                          {q}
                        </span>
                      </span>
                      <span className="summary-name">
                        <strong>{name}</strong>
                        <span className="summary-controls">
                          <QuantityStepper
                            item={it}
                            quantity={q}
                            max={cart.catalog?.maxQuantity ?? maxQuantity}
                            onChange={(n) => cart.set(it.slug, Math.max(1, n))}
                          />
                          {it.slug !== kitSlug && (
                            <button
                              type="button"
                              className="link-btn"
                              onClick={() => cart.set(it.slug, 0)}
                            >
                              {t("removeItem")}
                            </button>
                          )}
                        </span>
                      </span>
                      <span className="summary-price">
                        {money(it.price.amountMinor * q)}
                      </span>
                    </li>
                  );
                })}
          </ul>
          {accessories.some((a) => !optionLines[a.slug]) && (
            <div className="summary-add">
              {accessories
                .filter((a) => !optionLines[a.slug])
                .map((a) => (
                  <button
                    key={a.slug}
                    type="button"
                    className="cart-suggest-btn"
                    onClick={() => cart.set(a.slug, 1)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/visuels/options/${a.icon === "stand" ? "support" : "bougie"}-vignette.webp`}
                      alt=""
                      width={40}
                      height={40}
                    />
                    <span>
                      {a.names[locale as "fr" | "en" | "ar"] ?? a.names.fr}
                    </span>
                    <b>+ {money(a.price.amountMinor)}</b>
                  </button>
                ))}
            </div>
          )}
          <div className="promo">
            {promo ? (
              <p className="promo-applied" role="status">
                <span>{t("promoApplied", { code: promo.code })}</span>
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => {
                    setPromo(null);
                    setPromoInput("");
                  }}
                >
                  {t("removeItem")}
                </button>
              </p>
            ) : (
              <>
                <label htmlFor="promo-code" className="visually-hidden">
                  {t("promoLabel")}
                </label>
                <div className="promo-row">
                  <input
                    id="promo-code"
                    className="field"
                    placeholder={t("promoLabel")}
                    value={promoInput}
                    autoComplete="off"
                    autoCapitalize="characters"
                    maxLength={40}
                    aria-invalid={promoError ? true : undefined}
                    aria-describedby={promoError ? "promo-error" : undefined}
                    onChange={(e) => setPromoInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (promoInput.trim()) applyPromo(promoInput);
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-outline promo-btn"
                    disabled={!promoInput.trim() || checking}
                    onClick={() => applyPromo(promoInput)}
                  >
                    {t("promoApply")}
                  </button>
                </div>
                {promoError && (
                  <p id="promo-error" className="field-error">
                    {t(`errors.${promoError}`)}
                  </p>
                )}
              </>
            )}
          </div>
          <dl className="order-lines">
            <div>
              <dt>{t("subtotal")}</dt>
              <dd>{money(subtotal)}</dd>
            </div>
            {discount > 0 && promo && (
              <div className="line-discount">
                <dt>{t("lineDiscount", { code: promo.code })}</dt>
                <dd>− {money(discount)}</dd>
              </div>
            )}
            <div>
              <dt>
                {t("lineDelivery")}
                <small>{t(`delivery.${mode}.name`)}</small>
              </dt>
              <dd aria-live="polite">
                {!wilaya
                  ? t("feeAfterWilaya")
                  : fee === null
                    ? t("feeLater")
                    : money(fee)}
              </dd>
            </div>
          </dl>
          <p className="order-total">
            <span>
              {fee === null ? t("total") : t("totalWithDelivery")}
              {payment.length === 1 && payment[0] === "cod" && (
                <small>{t("totalCod")}</small>
              )}
            </span>
            <strong>{money(subtotal - discount + (fee ?? 0))}</strong>
          </p>
        </div>
      </aside>
    </div>
  );
}
