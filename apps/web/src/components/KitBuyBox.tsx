"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { Accessory } from "@/config/catalog";
import { Link } from "@/i18n/navigation";
import { AccessoryPicker } from "./AccessoryPicker";

/** Options + bouton « Commander » : les options choisies suivent dans la commande. */
export function KitBuyBox({ accessories }: { accessories: readonly Accessory[] }) {
  const t = useTranslations("shop");
  const [selected, setSelected] = useState<string[]>([]);
  return (
    <>
      <AccessoryPicker accessories={accessories} selected={selected} onChange={setSelected} />
      <Link
        href={{ pathname: "/commander", query: selected.length ? { options: selected.join(",") } : {} }}
        className="btn btn-primary btn-lg btn-block"
      >
        {t("cta")}
      </Link>
    </>
  );
}
