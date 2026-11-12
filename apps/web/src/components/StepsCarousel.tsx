"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { BoxOpenIcon, FrameIcon, PauseIcon, PhoneCodeIcon, PhotoIcon, PlayIcon, VoiceIcon } from "@/components/Icons";
import { NailRing } from "@/components/NailRing";

const ICONS = { box: BoxOpenIcon, code: PhoneCodeIcon, photo: PhotoIcon, voice: VoiceIcon, frame: FrameIcon } as const;

export interface Step {
  key: string;
  icon: keyof typeof ICONS;
  img: string | null;
  title: string;
  text: string;
}

/**
 * Carrousel « Comment ça marche » : une grande image qui change avec l'étape,
 * une rangée d'onglets à icônes et la légende de l'étape active.
 * Avance seul (la barre de progression de l'onglet actif sert de minuterie),
 * se met en pause au survol, au focus, hors écran ou sur demande ; glisse au doigt.
 * Sans animation si l'utilisateur a demandé moins de mouvement.
 */
export function StepsCarousel({ id, title, steps }: { id: string; title: string; steps: Step[] }) {
  const t = useTranslations("carousel");
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [offscreen, setOffscreen] = useState(true);
  const root = useRef<HTMLDivElement>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const startX = useRef<number | null>(null);
  const n = steps.length;

  const go = (k: number, focus = false) => {
    const next = (k + n) % n;
    setI(next);
    if (focus) tabs.current[next]?.focus();
  };

  // Ne défile pas quand le carrousel n'est pas à l'écran.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setOffscreen(!e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const isRtl = () => root.current?.closest("[dir=rtl]") !== null;

  const onKey = (e: React.KeyboardEvent) => {
    const fwd = isRtl() ? "ArrowLeft" : "ArrowRight";
    const back = isRtl() ? "ArrowRight" : "ArrowLeft";
    if (e.key === fwd) go(i + 1, true);
    else if (e.key === back) go(i - 1, true);
    else if (e.key === "Home") go(0, true);
    else if (e.key === "End") go(n - 1, true);
    else return;
    e.preventDefault();
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (startX.current === null) return;
    const dx = e.clientX - startX.current;
    startX.current = null;
    if (Math.abs(dx) < 40) return;
    const forward = isRtl() ? dx > 0 : dx < 0;
    go(i + (forward ? 1 : -1));
  };

  const step = steps[i];

  return (
    <div
      ref={root}
      className="steps"
      data-steps
      data-paused={paused || offscreen ? "true" : undefined}
      role="group"
      aria-roledescription={t("roledescription")}
      aria-label={title}
    >
      <div
        className="steps-stage"
        onPointerDown={(e) => (startX.current = e.clientX)}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (startX.current = null)}
      >
        {steps.map((s, k) => (
          <div key={s.key} className="steps-slide" data-step-slide aria-hidden={k !== i} data-active={k === i ? "true" : undefined}>
            {s.img ? <img src={s.img} alt="" width={600} height={600} loading={k === 0 ? undefined : "lazy"} draggable={false} /> : <NailRing className="steps-ring" />}
          </div>
        ))}
        <span className="steps-count" dir="ltr" aria-hidden="true">
          {i + 1} / {n}
        </span>
        <button
          type="button"
          className="steps-toggle"
          data-steps-toggle
          data-play={t("play")}
          data-pause={t("pause")}
          aria-pressed={paused}
          aria-label={paused ? t("play") : t("pause")}
          onClick={() => setPaused((p) => !p)}
        >
          {paused ? <PlayIcon /> : <PauseIcon />}
        </button>
      </div>

      <div className="steps-side">
        <div className="steps-tabs" role="tablist" aria-label={t("tablist")} onKeyDown={onKey}>
          {steps.map((s, k) => {
            const Icon = ICONS[s.icon];
            const active = k === i;
            return (
              <button
                key={s.key}
                ref={(el) => {
                  tabs.current[k] = el;
                }}
                type="button"
                role="tab"
                id={`${id}-tab-${k}`}
                aria-selected={active}
                aria-controls={`${id}-panel`}
                tabIndex={active ? 0 : -1}
                className="steps-tab"
                data-step-tab
                data-title={s.title}
                data-text={s.text}
                data-num={t("stepOf", { n: k + 1, total: n })}
                onClick={() => go(k)}
              >
                <span className="steps-icon">
                  <Icon />
                </span>
                <span className="steps-label">{s.title}</span>
                <span className="steps-bar" aria-hidden="true">
                  {active && <span key={`${i}`} className="steps-fill" onAnimationEnd={() => go(i + 1)} />}
                </span>
              </button>
            );
          })}
        </div>

        <div className="steps-panel" role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-tab-${i}`} data-step-panel>
          <p className="steps-num">{t("stepOf", { n: i + 1, total: n })}</p>
          <h3 key={`h${i}`}>{step.title}</h3>
          <p key={`p${i}`}>{step.text}</p>
        </div>
      </div>
    </div>
  );
}
