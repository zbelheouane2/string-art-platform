"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export interface GalleryImage {
  src: string;
  alt: string;
}

export function Gallery({ images }: { images: GalleryImage[] }) {
  const t = useTranslations("shop");
  const [i, setI] = useState(0);
  const go = (d: number) => setI((v) => (v + d + images.length) % images.length);
  return (
    <section className="gallery" aria-label={t("gallery")} aria-roledescription="carousel">
      <div className="gallery-main">
        <img key={images[i].src} src={images[i].src} alt={images[i].alt} width={900} height={900} />
        <span className="gallery-count" dir="ltr">{t("galleryCount", { current: i + 1, total: images.length })}</span>
        <button type="button" className="gallery-nav gallery-prev" onClick={() => go(-1)} aria-label={t("galleryPrev")}>
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <button type="button" className="gallery-nav gallery-next" onClick={() => go(1)} aria-label={t("galleryNext")}>
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </div>
      <div className="gallery-thumbs">
        {images.map((img, k) => (
          <button key={img.src} type="button" onClick={() => setI(k)} aria-current={k === i} aria-label={img.alt}>
            <img src={img.src} alt="" width={120} height={120} />
          </button>
        ))}
      </div>
    </section>
  );
}
