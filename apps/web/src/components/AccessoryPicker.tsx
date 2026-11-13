"use client";

import { useLocale, useTranslations } from "next-intl";
import type { Accessory } from "@/config/catalog";
import { formatPrice } from "@/lib/price";

/** Dessins originaux (pas de photo produit pour l'instant). */
function Illustration({ icon }: { icon: Accessory["icon"] }) {
  return icon === "stand" ? (
    <svg viewBox="0 0 64 64" width="56" height="56" aria-hidden="true">
      <rect x="14" y="8" width="36" height="36" rx="3" fill="#fff" stroke="#a9803f" strokeWidth="2" />
      <circle cx="32" cy="26" r="11" fill="none" stroke="#2a1f1a" strokeWidth="1.2" strokeDasharray="1.5 1.5" />
      <path d="M22 44 L14 60 M42 44 L50 60 M32 44 L32 58" stroke="#a9803f" strokeWidth="3" strokeLinecap="round" />
    </svg>
  ) : (
    <svg viewBox="0 0 64 64" width="56" height="56" aria-hidden="true">
      <path d="M32 6c4 6 5 9 0 15-5-6-4-9 0-15z" fill="#e8a33a" />
      <rect x="18" y="24" width="28" height="34" rx="4" fill="#2a1f1a" />
      <rect x="22" y="36" width="20" height="10" rx="1.5" fill="#f6ece2" />
      <path d="M32 21v4" stroke="#2a1f1a" strokeWidth="1.5" />
    </svg>
  );
}

/**
 * Options du kit (support, bougie…) avec un interrupteur à droite.
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
  if (accessories.length === 0) return null;
  return (
    <div className="accessories">
      <p className="accessories-title">{t("title")}</p>
      <ul>
        {accessories.map((a) => {
          const on = selected.includes(a.slug);
          const id = `acc-${a.slug}`;
          return (
            <li key={a.slug} className="accessory" data-on={on}>
              <Illustration icon={a.icon} />
              <div className="accessory-text">
                <span className="accessory-tag">{t(`tags.${a.icon}`)}</span>
                <label htmlFor={id}>{a.names[locale] ?? a.names.fr}</label>
                <span className="accessory-price">{a.price ? `+ ${formatPrice(a.price, locale)}` : t("soon")}</span>
              </div>
              <button
                id={id}
                type="button"
                role="switch"
                className="switch"
                aria-checked={on}
                disabled={!a.price}
                onClick={() => onChange(on ? selected.filter((s) => s !== a.slug) : [...selected, a.slug])}
              >
                <span className="visually-hidden">{a.names[locale] ?? a.names.fr}</span>
              </button>
              {on && name && <input type="hidden" name={name} value={a.slug} />}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
