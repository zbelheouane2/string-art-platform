"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

export interface GalleryImage {
  src: string;
  alt: string;
}

/**
 * Galerie produit qui glisse : défilement aimanté (doigt, molette, clavier),
 * flèches rondes, compteur et vignettes cliquables.
 */
export function Gallery({ images }: { images: GalleryImage[] }) {
  const t = useTranslations("shop");
  const listRef = useRef<HTMLUListElement>(null);
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
        <button type="button" className="gallery-nav gallery-prev" onClick={() => go(i - 1)} aria-label={t("galleryPrev")}>
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <button type="button" className="gallery-nav gallery-next" onClick={() => go(i + 1)} aria-label={t("galleryNext")}>
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </div>
      <div className="gallery-thumbs">
        {images.map((img, k) => (
          <button key={img.src} type="button" onClick={() => go(k)} aria-current={k === i} aria-label={`${t("gallery")} ${k + 1}`}>
            <img src={img.src} alt="" width={120} height={120} loading="lazy" />
          </button>
        ))}
      </div>
    </section>
  );
}
