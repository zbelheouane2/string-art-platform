"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

/** Barre d'action mobile : apparaît quand les boutons du haut ne sont plus visibles. */
export function StickyBar({ watchId }: { watchId: string }) {
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
      <strong>{t("name")}</strong>
      <a className="btn btn-primary" href="#kit">
        {t("cta")}
      </a>
    </div>
  );
}
