"use client";

import { useEffect } from "react";

/** Téléphone : fait apparaître l'onglet de la rubrique ouverte dans la barre qui défile. */
export function AdminNavScroll() {
  useEffect(() => {
    const nav = document.querySelector<HTMLElement>(".admin-top nav");
    const current = nav?.querySelector<HTMLElement>('a[aria-current="page"]');
    if (!nav || !current || nav.scrollWidth <= nav.clientWidth) return;
    nav.scrollLeft = current.offsetLeft - (nav.clientWidth - current.offsetWidth) / 2;
  }, []);
  return null;
}
