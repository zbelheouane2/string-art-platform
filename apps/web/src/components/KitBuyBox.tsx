"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { Accessory } from "@/config/catalog";
import { AccessoryPicker } from "./AccessoryPicker";
import { useCart } from "./Cart";

/** Options + bouton « Ajouter au panier » : le kit et les options choisies vont au panier, qui s'ouvre. */
export function KitBuyBox({ accessories }: { accessories: readonly Accessory[] }) {
  const t = useTranslations("cart");
  const { add, catalog } = useCart();
  const [selected, setSelected] = useState<string[]>([]);
  const kit = catalog?.kit.slug ?? "kit-portrait-50";
  return (
    <>
      <AccessoryPicker accessories={accessories} selected={selected} onChange={setSelected} />
      <button
        type="button"
        className="btn btn-primary btn-lg btn-block"
        data-add-to-cart
        onClick={() => {
          add({ [kit]: 1, ...Object.fromEntries(selected.map((s) => [s, 1])) });
          setSelected([]);
        }}
      >
        {t("addToCart")}
      </button>
    </>
  );
}
