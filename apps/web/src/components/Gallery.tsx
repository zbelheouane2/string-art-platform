"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { AUTO_DELAY_MS } from "./AutoCarousel";
import { PauseIcon, PlayIcon } from "./Icons";

export interface GalleryImage {
  src: string;
  alt: string;
  /** Petite version pour la colonne de vignettes (sinon l'image elle-même). */
  thumb?: string;
}

/**
 * Galerie produit : grande image qui glisse (doigt, molette, clavier), flèches,
 * compteur. Ordinateur : colonne de vignettes verticale à gauche qui suit l'image
 * affichée. Téléphone : points sous l'image. Avance seule toutes les 4 s en boucle ;
 * après un clic ou un glissement, le compte repart de 4 s. Bouton pause sur l'image.
 */
export function Gallery({ images }: { images: GalleryImage[] }) {
  const t = useTranslations("shop");
  const listRef = useRef<HTMLUListElement>(null);
  const thumbsRef = useRef<HTMLDivElement>(null);
  const tc = useTranslations("carousel");
  const [paused, setPaused] = useState(false);
  // Tick incrémenté à chaque action : relance le compte de 4 s même si l'image ne change pas.
  const [tick, setTick] = useState(0);
  const [i, setI] = useState(0);

  // Suit la diapositive visible pendant le défilement.
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setI(Number((e.target as HTMLElement).dataset.index));
        }
      },
      { root: list, threshold: 0.6 },
    );
    list.querySelectorAll("li").forEach((li) => io.observe(li));
    return () => io.disconnect();
  }, []);

  // La vignette active reste visible dans sa colonne (sans faire défiler la page).
  useEffect(() => {
    const box = thumbsRef.current;
    const btn = box?.children[i] as HTMLElement | undefined;
    if (!box || !btn || box.scrollHeight <= box.clientHeight + 1) return;
    const top = btn.offsetTop - box.offsetTop;
    if (top < box.scrollTop || top + btn.offsetHeight > box.scrollTop + box.clientHeight) {
      box.scrollTo({ top: top - box.clientHeight / 2 + btn.offsetHeight / 2, behavior: "smooth" });
    }
  }, [i]);

  const go = useCallback(
    (k: number) => {
      const list = listRef.current;
      if (!list) return;
      const n = (k + images.length) % images.length;
      const slide = list.children[n] as HTMLElement;
      const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      list.scrollTo({ left: slide.offsetLeft - list.offsetLeft, behavior: smooth ? "smooth" : "auto" });
      setI(n);
    },
    [images.length],
  );

  // Défilement automatique : 4 s après la dernière image affichée ou la dernière action.
  useEffect(() => {
    if (paused || images.length < 2) return;
    const id = window.setTimeout(() => go(i + 1), AUTO_DELAY_MS);
    return () => window.clearTimeout(id);
  }, [i, tick, paused, go, images.length]);

  const act = (k: number) => {
    go(k);
    setTick((n) => n + 1);
  };

  return (
    <section className="gallery" aria-label={t("gallery")} aria-roledescription="carousel">
      <div className="gallery-main">
        <ul ref={listRef} className="gallery-track" dir="ltr" tabIndex={0} aria-label={t("gallery")}>
          {images.map((img, k) => (
            <li key={img.src} data-index={k} aria-roledescription="slide" aria-label={`${k + 1} / ${images.length}`}>
              <img src={img.src} alt={img.alt} width={900} height={900} loading={k === 0 ? "eager" : "lazy"} />
            </li>
          ))}
        </ul>
        <span className="gallery-count" dir="ltr" aria-live="polite">
          {t("galleryCount", { current: i + 1, total: images.length })}
        </span>
        <button type="button" className="gallery-nav gallery-prev" onClick={() => act(i - 1)} aria-label={t("galleryPrev")}>
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <button type="button" className="gallery-nav gallery-next" onClick={() => act(i + 1)} aria-label={t("galleryNext")}>
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <button
          type="button"
          className="gallery-toggle"
          aria-pressed={paused}
          aria-label={paused ? tc("play") : tc("pause")}
          data-play={tc("play")}
          data-pause={tc("pause")}
          onClick={() => setPaused((p) => !p)}
        >
          {paused ? <PlayIcon /> : <PauseIcon />}
        </button>
      </div>
      <div ref={thumbsRef} className="gallery-thumbs">
        {images.map((img, k) => (
          <button key={img.src} type="button" onClick={() => act(k)} aria-current={k === i} aria-label={`${t("gallery")} ${k + 1}`}>
            <img src={img.thumb ?? img.src} alt="" width={120} height={120} loading="lazy" />
          </button>
        ))}
      </div>
      <div className="gallery-dots" aria-hidden="true">
        {images.map((img, k) => (
          <span key={img.src} data-on={k === i ? "true" : undefined} />
        ))}
      </div>
    </section>
  );
}
