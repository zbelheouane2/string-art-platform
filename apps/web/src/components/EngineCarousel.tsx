"use client";

import { useRef } from "react";

export interface EngineStep {
  key: string;
  title: string;
  text: string;
  /** Capture d'écran du site DeeKra (scripts/make-generator-shots.cjs). */
  img: string;
}

/**
 * Les 5 étapes du générateur, écrans du vrai site dans un téléphone, en carrousel horizontal : on fait glisser du doigt
 * (défilement aimanté), ou on utilise les flèches. En arabe, le sens s'inverse
 * de lui-même (la liste suit la direction de la page).
 */
export function EngineCarousel({ steps, labels }: { steps: EngineStep[]; labels: { prev: string; next: string; step: string } }) {
  const track = useRef<HTMLOListElement>(null);

  function move(dir: 1 | -1) {
    const el = track.current;
    if (!el) return;
    const card = el.querySelector("li");
    const rtl = getComputedStyle(el).direction === "rtl";
    const width = card ? card.getBoundingClientRect().width + 16 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * width * (rtl ? -1 : 1), behavior: "smooth" });
  }

  return (
    <div className="engine-carousel">
      <ol ref={track} className="engine-track" tabIndex={0}>
        {steps.map((s, i) => (
          <li key={s.key} className="engine-card" aria-label={`${labels.step} ${i + 1} / ${steps.length}`}>
            <div className="phone">
              <img src={s.img} alt="" loading="lazy" width={390} height={844} />
            </div>
            <span className="engine-num" aria-hidden="true">
              {i + 1}
            </span>
            <h3>{s.title}</h3>
            <p>{s.text}</p>
          </li>
        ))}
      </ol>
      <div className="engine-nav">
        <button type="button" className="icon-btn engine-arrow" onClick={() => move(-1)} aria-label={labels.prev}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>
        <button type="button" className="icon-btn engine-arrow" onClick={() => move(1)} aria-label={labels.next}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
