"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

/** Curseur photo ↔ portrait en fil (le rendu vient du moteur, même recadrage). */
export function BeforeAfter({
  photo,
  thread,
  compact = false,
  round = false,
  hint = false,
  label,
}: {
  photo: string;
  thread: string;
  compact?: boolean;
  /** Cadre rond, comme la planche. */
  round?: boolean;
  /** À la première apparition, le curseur fait un aller-retour pour montrer qu'il glisse. */
  hint?: boolean;
  label?: string;
}) {
  const t = useTranslations("what.slider");
  const [pos, setPos] = useState(50);
  const ref = useRef<HTMLElement>(null);
  const touched = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!hint || !el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const D = 2400;
        const step = (now: number) => {
          if (touched.current) return;
          const k = Math.min(1, (now - start) / D);
          // 50 → 22 → 78 → 50, en douceur.
          setPos(50 - 28 * Math.sin(k * Math.PI * 2));
          if (k < 1) raf = requestAnimationFrame(step);
          else setPos(50);
        };
        raf = requestAnimationFrame(step);
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [hint]);

  const cls = ["ba", compact && "ba-compact", round && "ba-round"].filter(Boolean).join(" ");
  return (
    <figure ref={ref} className={cls} data-ba-hint={hint ? "" : undefined} dir="ltr" style={{ ["--pos" as string]: `${pos}%` }}>
      <img src={thread} alt="" className="ba-img" width={900} height={900} />
      <img src={photo} alt="" className="ba-img ba-top" width={900} height={900} />
      {!compact && <span className="ba-tag ba-tag-start">{t("photo")}</span>}
      {!compact && <span className="ba-tag ba-tag-end">{t("thread")}</span>}
      <span className="ba-handle" aria-hidden="true" />
      <input
        type="range"
        min={0}
        max={100}
        value={pos}
        onChange={(e) => {
          touched.current = true;
          setPos(Number(e.target.value));
        }}
        aria-label={label ?? t("label")}
        className="ba-range"
      />
    </figure>
  );
}
