"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

/** Barre d'achat : apparaît quand le bouton du haut n'est plus visible. */
export function StickyBar({ watchId, price }: { watchId: string; price: string | null }) {
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
      <a className="btn btn-primary" href="#acheter">
        {price ? t("cta") : t("ctaSoon")}
      </a>
    </div>
  );
}
