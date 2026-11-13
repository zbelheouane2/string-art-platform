"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/** Barre d'achat : apparaît quand le bouton du haut n'est plus visible. */
export function StickyBar({ watchId, price, orderingOpen = false }: { watchId: string; price: string | null; orderingOpen?: boolean }) {
  const t = useTranslations("sticky");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = document.getElementById(watchId);
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0));
    io.observe(el);
    return () => io.disconnect();
  }, [watchId]);

  return (
    <div className="sticky-bar" data-visible={visible} aria-hidden={!visible} inert={!visible}>
      <img src="/visuels/martyr-fil.webp" alt="" width={48} height={48} className="sticky-thumb" />
      <div className="sticky-text">
        <strong>{t("name")}</strong>
        {price && <span>{price}</span>}
      </div>
      {price && orderingOpen ? (
        <Link className="btn btn-primary" href="/commander">
          {t("cta")}
        </Link>
      ) : (
        <a className="btn btn-primary" href="#acheter">
          {t("ctaSoon")}
        </a>
      )}
    </div>
  );
}
