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
 * Options du kit (support, bougie…). Deux grandes zones par carte : à gauche
 * (photo, nom, « En savoir plus ») un clic ouvre la fenêtre de détail ; à droite
 * (prix + interrupteur) un clic ajoute ou retire l'option.
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
              {/* Toute la partie gauche (photo + texte) ouvre la fenêtre « En savoir plus ». */}
              <button type="button" className="accessory-main" onClick={() => show(a)} aria-haspopup="dialog">
                <span className="accessory-thumb">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo(a.icon, "vignette")} alt="" width={64} height={64} loading="lazy" />
                </span>
                <span className="accessory-text">
                  <span className="accessory-tag">{t(`tags.${a.icon}`)}</span>
                  <span className="accessory-name">{label(a)}</span>
                  <span className="accessory-more">{t("more")}</span>
                </span>
              </button>
              {/* Toute la partie droite (prix + interrupteur) ajoute ou retire l'option. */}
              <button
                id={id}
                type="button"
                role="switch"
                className="accessory-toggle"
                aria-checked={on}
                aria-label={label(a)}
                disabled={!a.price}
                onClick={() => toggle(a)}
              >
                <span className="accessory-price" aria-hidden="true">
                  {a.price ? `+ ${formatPrice(a.price, locale)}` : t("soon")}
                </span>
                <span className="switch" aria-hidden="true" />
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
