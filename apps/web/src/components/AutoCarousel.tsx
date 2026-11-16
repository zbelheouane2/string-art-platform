"use client";

import { Children, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { PauseIcon, PlayIcon } from "./Icons";

/** Délai entre deux diapositives (retour du propriétaire : 5 s maximum). */
export const AUTO_DELAY_MS = 5000;

/**
 * Rangée de cartes qui défile seule : glisser au doigt (défilement aimanté),
 * flèches, points et bouton pause. Avance toutes les 5 s, s'arrête au survol,
 * au focus, hors écran, sur demande ou si l'utilisateur préfère moins de mouvement.
 * Quand toutes les cartes tiennent à l'écran (ordinateur), les commandes disparaissent.
 * Le sens suit celui de la page (arabe : de droite à gauche).
 */
export function AutoCarousel({
  label,
  className,
  itemLabels,
  children,
}: {
  label: string;
  className?: string;
  /** Nom accessible de chaque carte, par ex. « Étape 2 / 5 ». */
  itemLabels?: string[];
  children: ReactNode;
}) {
  const t = useTranslations("carousel");
  const items = Children.toArray(children);
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLOListElement>(null);
  const [index, setIndex] = useState(0);
  const [pages, setPages] = useState(1);
  const [hover, setHover] = useState(false);
  const [offscreen, setOffscreen] = useState(true);
  const [userPaused, setUserPaused] = useState(false);
  const [reduced, setReduced] = useState(false);

  /** Largeur d'un pas (carte + écart) et nombre de positions possibles. */
  const measure = useCallback(() => {
    const el = track.current;
    const first = el?.children[0] as HTMLElement | undefined;
    const second = el?.children[1] as HTMLElement | undefined;
    if (!el || !first) return { step: 1, pages: 1 };
    const step = second ? Math.abs(second.offsetLeft - first.offsetLeft) : first.offsetWidth;
    const overflow = el.scrollWidth - el.clientWidth;
    return { step, pages: overflow > 4 ? Math.round(overflow / step) + 1 : 1 };
  }, []);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const update = () => setPages(measure().pages);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    const onScroll = () => {
      const { step, pages: p } = measure();
      setIndex(Math.min(p - 1, Math.round(Math.abs(el.scrollLeft) / step)));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    const io = new IntersectionObserver(([e]) => setOffscreen(!e.isIntersecting), { threshold: 0.4 });
    if (root.current) io.observe(root.current);
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onMq = () => setReduced(mq.matches);
    mq.addEventListener("change", onMq);
    return () => {
      ro.disconnect();
      io.disconnect();
      el.removeEventListener("scroll", onScroll);
      mq.removeEventListener("change", onMq);
    };
  }, [measure]);

  const go = useCallback(
    (k: number) => {
      const el = track.current;
      if (!el) return;
      const { step, pages: p } = measure();
      const next = ((k % p) + p) % p;
      const rtl = getComputedStyle(el).direction === "rtl";
      el.scrollTo({ left: next * step * (rtl ? -1 : 1), behavior: reduced ? "auto" : "smooth" });
      setIndex(next);
    },
    [measure, reduced],
  );

  // Minuterie : la jauge du point actif se remplit en 5 s, puis on avance (en pause, la jauge s'arrête).
  const playing = pages > 1 && !hover && !offscreen && !userPaused && !reduced;

  return (
    <div
      ref={root}
      className={`auto-carousel${className ? ` ${className}` : ""}`}
      data-auto-carousel
      data-controls={pages > 1 ? "true" : undefined}
      data-playing={playing ? "true" : undefined}
      style={{ ["--auto-delay" as string]: `${AUTO_DELAY_MS}ms` }}
      role="region"
      aria-roledescription={t("roledescription")}
      aria-label={label}
      onPointerEnter={(e) => e.pointerType === "mouse" && setHover(true)}
      onPointerLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node | null) && setHover(false)}
    >
      <ol ref={track} className="auto-track" tabIndex={0} aria-label={label}>
        {items.map((child, k) => (
          <li key={k} className="auto-item" aria-label={itemLabels?.[k]}>
            {child}
          </li>
        ))}
      </ol>
      <div className="auto-controls">
        <button type="button" className="icon-btn auto-arrow" data-auto-prev onClick={() => go(index - 1)} aria-label={t("prev")}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>
        <div className="auto-dots">
          {Array.from({ length: pages }, (_, k) => (
            <button
              key={k}
              type="button"
              className="auto-dot"
              data-auto-dot={k}
              aria-label={t("goTo", { n: k + 1, total: pages })}
              aria-current={k === index ? "true" : undefined}
              onClick={() => go(k)}
            >
              {k === index && !reduced && <span key={index} className="auto-fill" onAnimationEnd={() => go(index + 1)} />}
            </button>
          ))}
        </div>
        <button type="button" className="icon-btn auto-arrow" data-auto-next onClick={() => go(index + 1)} aria-label={t("next")}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <button
          type="button"
          className="icon-btn auto-toggle"
          data-auto-toggle
          data-play={t("play")}
          data-pause={t("pause")}
          aria-pressed={userPaused}
          aria-label={userPaused ? t("play") : t("pause")}
          onClick={() => setUserPaused((p) => !p)}
        >
          {userPaused ? <PlayIcon /> : <PauseIcon />}
        </button>
      </div>
    </div>
  );
}
