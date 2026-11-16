"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocale, useTranslations } from "next-intl";
import type { Accessory } from "@/config/catalog";
import { formatPrice } from "@/lib/price";

/** Photos de chaque option : vignette carrée et visuel de la fenêtre de détail. */
const PHOTO: Record<Accessory["icon"], string> = {
  stand: "support",
  candle: "bougie",
};
const photo = (icon: Accessory["icon"], kind: "vignette" | "detail") =>
  `/visuels/options/${PHOTO[icon]}-${kind}.webp`;

/**
 * Options du kit (support, bougie…) avec un interrupteur à droite. Un clic sur
 * la photo ou sur « En savoir plus » ouvre une fenêtre de détail.
 * Une option sans prix est affichée « bientôt » et ne peut pas être cochée.
 * `name` permet d'envoyer la sélection avec un formulaire.
 */
export function AccessoryPicker({
  accessories,
  selected,
  onChange,
  name,
}: {
  accessories: readonly Accessory[];
  selected: readonly string[];
  onChange: (slugs: string[]) => void;
  name?: string;
}) {
  const t = useTranslations("accessories");
  const locale = useLocale() as "fr" | "en" | "ar";
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState<Accessory | null>(null);
  // La fenêtre est rendue dans <body> : elle n'hérite pas des fondus des sections (data-reveal).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  // Ouverture une fois la fenêtre montée (un clic juste après le chargement suffit).
  useEffect(() => {
    if (open && mounted && dialog.current && !dialog.current.open) dialog.current.showModal();
  }, [open, mounted]);
  if (accessories.length === 0) return null;
  const label = (a: Accessory) => a.names[locale] ?? a.names.fr;
  const toggle = (a: Accessory) =>
    onChange(
      selected.includes(a.slug)
        ? selected.filter((s) => s !== a.slug)
        : [...selected, a.slug],
    );
  const show = (a: Accessory) => setOpen(a);

  return (
    <div className="accessories">
      <p className="accessories-title">{t("title")}</p>
      <ul>
        {accessories.map((a) => {
          const on = selected.includes(a.slug);
          const id = `acc-${a.slug}`;
          return (
            <li key={a.slug} className="accessory" data-on={on}>
              <button
                type="button"
                className="accessory-thumb"
                onClick={() => show(a)}
                aria-label={`${t("more")} : ${label(a)}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo(a.icon, "vignette")}
                  alt=""
                  width={64}
                  height={64}
                  loading="lazy"
                />
              </button>
              <div className="accessory-text">
                <span className="accessory-tag">{t(`tags.${a.icon}`)}</span>
                <label htmlFor={id}>{label(a)}</label>
                <span className="accessory-price">
                  {a.price ? `+ ${formatPrice(a.price, locale)}` : t("soon")}
                </span>
                <button
                  type="button"
                  className="accessory-more"
                  onClick={() => show(a)}
                  aria-haspopup="dialog"
                >
                  {t("more")}
                </button>
              </div>
              <button
                id={id}
                type="button"
                role="switch"
                className="switch"
                aria-checked={on}
                disabled={!a.price}
                onClick={() => toggle(a)}
              >
                <span className="visually-hidden">{label(a)}</span>
              </button>
              {on && name && <input type="hidden" name={name} value={a.slug} />}
            </li>
          );
        })}
      </ul>

      {mounted &&
        createPortal(
          <dialog
            ref={dialog}
            className="accessory-dialog"
            aria-labelledby="accessory-dialog-title"
            onClose={() => setOpen(null)}
            onClick={(e) =>
              e.target === e.currentTarget && dialog.current?.close()
            }
          >
            {open && (
              <div className="accessory-dialog-body">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo(open.icon, "detail")}
                  alt={t(`details.${open.icon}.alt`)}
                  width={480}
                  height={480}
                />
                <div className="accessory-dialog-text">
                  <h2 id="accessory-dialog-title">
                    {t(`details.${open.icon}.title`)}
                  </h2>
                  <p className="accessory-dialog-name">
                    {label(open)}
                    {open.price && (
                      <strong> · + {formatPrice(open.price, locale)}</strong>
                    )}
                  </p>
                  <p>{t(`details.${open.icon}.text`)}</p>
                  {open.price && (
                    <button
                      type="button"
                      className={`btn btn-block ${selected.includes(open.slug) ? "btn-outline" : "btn-primary"}`}
                      onClick={() => {
                        toggle(open);
                        dialog.current?.close();
                      }}
                    >
                      {selected.includes(open.slug) ? t("remove") : t("add")}
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  className="accessory-dialog-close"
                  onClick={() => dialog.current?.close()}
                  aria-label={t("close")}
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    aria-hidden="true"
                  >
                    <path
                      d="M6 6l12 12M18 6L6 18"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
            )}
          </dialog>,
          document.body,
        )}
    </div>
  );
}
