"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { NAILS_PER_SECTOR, SECTORS, nailLabel, nailPositions } from "@/lib/board";
import { SPEED, clampStep, parseProgress, progressKey, remainingMinutes, stepCount } from "@/lib/guide";
import { SPEECH_LANG, stepPhrase } from "@/lib/voice";
import { GuideMusic } from "@/components/GuideMusic";

const POSITIONS = nailPositions();
/** Niveaux de zoom de la planche ; au-delà de 1, la vue suit le clou à atteindre. */
const ZOOMS = [1, 1.5, 2, 3] as const;
const ZOOM_KEY = "dk-guide-zoom";
/** Vitesses proposées : 1× = un fil toutes les SPEED.default secondes. */
const SPEEDS = [0.5, 1, 1.5, 2] as const;
const secondsFor = (factor: number) => Math.round((SPEED.default / factor) * 10) / 10;

/** Choisit une voix de synthèse dans la langue demandée, si l'appareil en a une. */
function pickVoice(lang: string): SpeechSynthesisVoice | null {
  if (typeof speechSynthesis === "undefined") return null;
  const voices = speechSynthesis.getVoices();
  const prefix = lang.slice(0, 2);
  return voices.find((v) => v.lang === lang) ?? voices.find((v) => v.lang.startsWith(prefix)) ?? null;
}

/**
 * Guide de réalisation : annonce chaque clou à voix haute, avance tout seul au
 * rythme choisi, se met en pause, revient en arrière, garde l'écran allumé et
 * mémorise l'avancement sur l'appareil (reprise après fermeture).
 */
export function VoiceGuide({ portraitId, sequence }: { portraitId: string; sequence: number[] }) {
  const t = useTranslations("guide");
  const locale = useLocale();
  const total = stepCount(sequence);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [secondsPerStep, setSecondsPerStep] = useState<number>(SPEED.default);
  const [voiceOn, setVoiceOn] = useState(true);
  const [restored, setRestored] = useState(false);
  const [voiceMissing, setVoiceMissing] = useState(false);
  const [jump, setJump] = useState("");
  const [zoom, setZoom] = useState<number>(1);
  const [boxSize, setBoxSize] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const wakeLock = useRef<WakeLockSentinel | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [musicOpen, setMusicOpen] = useState(false);
  const settingsRef = useRef<HTMLDetailsElement>(null);
  // Sur grand écran, le plan de la planche est visible d'emblée dans la colonne de droite.
  useEffect(() => {
    if (settingsRef.current && window.matchMedia("(min-width: 60rem)").matches) settingsRef.current.open = true;
  }, []);
  const speakingTimer = useRef<number | undefined>(undefined);

  // Reprise : avancement sauvegardé sur cet appareil.
  useEffect(() => {
    let saved = null;
    try {
      saved = localStorage.getItem(progressKey(portraitId));
    } catch {
      /* stockage indisponible (navigation privée) : on part du début */
    }
    const p = parseProgress(saved, sequence);
    setStep(p.step);
    setSecondsPerStep(p.secondsPerStep);
    setVoiceOn(p.voice);
    setRestored(true);
  }, [portraitId, sequence]);

  useEffect(() => {
    if (!restored) return;
    try {
      localStorage.setItem(progressKey(portraitId), JSON.stringify({ step, secondsPerStep, voice: voiceOn }));
    } catch {
      /* ignoré */
    }
  }, [restored, portraitId, step, secondsPerStep, voiceOn]);

  // Zoom gardé sur l'appareil, comme l'avancement.
  useEffect(() => {
    try {
      const z = Number(localStorage.getItem(ZOOM_KEY));
      if ((ZOOMS as readonly number[]).includes(z)) setZoom(z);
    } catch {
      /* ignoré */
    }
  }, []);
  const chooseZoom = (z: number) => {
    setZoom(z);
    try {
      localStorage.setItem(ZOOM_KEY, String(z));
    } catch {
      /* ignoré */
    }
  };

  // La planche suit la taille de l'écran (téléphone, tablette, ordinateur, rotation).
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => setBoxSize(Math.round(vp.clientWidth)));
    ro.observe(vp);
    return () => ro.disconnect();
  }, []);

  // Voix disponible dans la langue de la page ?
  useEffect(() => {
    if (typeof speechSynthesis === "undefined") return setVoiceMissing(true);
    const check = () => setVoiceMissing(speechSynthesis.getVoices().length > 0 && !pickVoice(SPEECH_LANG[locale]));
    check();
    speechSynthesis.addEventListener("voiceschanged", check);
    return () => speechSynthesis.removeEventListener("voiceschanged", check);
  }, [locale]);

  const speak = useCallback(
    (s: number) => {
      if (!voiceOn || typeof speechSynthesis === "undefined") return;
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(stepPhrase(sequence, s, locale));
      // La musique baisse pendant l'annonce ; filet de sécurité si la fin n'est jamais signalée.
      const release = () => {
        window.clearTimeout(speakingTimer.current);
        setSpeaking(false);
      };
      setSpeaking(true);
      window.clearTimeout(speakingTimer.current);
      speakingTimer.current = window.setTimeout(release, 8000);
      u.onend = release;
      u.onerror = release;
      u.lang = SPEECH_LANG[locale] ?? "fr-FR";
      const voice = pickVoice(u.lang);
      if (voice) u.voice = voice;
      u.rate = secondsPerStep <= 4 ? 1.15 : 1;
      speechSynthesis.speak(u);
    },
    [voiceOn, sequence, locale, secondsPerStep],
  );

  // Lecture automatique : annonce, puis passe au fil suivant après le délai choisi.
  useEffect(() => {
    if (!playing) return;
    speak(step);
    if (step >= total) {
      setPlaying(false);
      return;
    }
    const timer = window.setTimeout(() => setStep((s) => Math.min(s + 1, total)), secondsPerStep * 1000);
    return () => window.clearTimeout(timer);
  }, [playing, step, total, secondsPerStep, speak]);

  // Écran allumé pendant la lecture (si le navigateur le permet).
  useEffect(() => {
    if (!playing || !("wakeLock" in navigator)) return;
    let cancelled = false;
    navigator.wakeLock
      .request("screen")
      .then((lock) => {
        if (cancelled) lock.release();
        else wakeLock.current = lock;
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      wakeLock.current?.release().catch(() => {});
      wakeLock.current = null;
    };
  }, [playing]);

  useEffect(() => () => void (typeof speechSynthesis !== "undefined" && speechSynthesis.cancel()), []);

  const goTo = useCallback(
    (s: number) => {
      const next = clampStep(s, sequence);
      setStep(next);
      if (!playing) speak(next);
    },
    [sequence, playing, speak],
  );

  // Raccourcis clavier : espace, flèches (selon le sens de lecture), R pour répéter.
  useEffect(() => {
    const rtl = document.documentElement.dir === "rtl";
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("input, select, textarea, button")) return;
      if (e.key === " ") {
        e.preventDefault();
        setPlaying((p) => !p);
      } else if (e.key === (rtl ? "ArrowLeft" : "ArrowRight")) goTo(step + 1);
      else if (e.key === (rtl ? "ArrowRight" : "ArrowLeft")) goTo(step - 1);
      else if (e.key.toLowerCase() === "r") speak(step);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goTo, speak, step]);

  // Dessin de la planche : fils déjà tendus, fil en cours, clou à atteindre.
  useEffect(() => {
    const canvas = canvasRef.current;
    const vp = viewportRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !vp) return;
    const view = boxSize || vp.clientWidth || 360;
    const size = Math.round(view * zoom);
    canvas.style.inlineSize = `${size}px`;
    canvas.style.blockSize = `${size}px`;
    const dpr = Math.min(window.devicePixelRatio || 1, zoom > 1 ? 2 : 3);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const r = size / 2 - 22;
    const at = (i: number) => [size / 2 + POSITIONS[i][0] * r, size / 2 + POSITIONS[i][1] * r] as const;
    const styles = getComputedStyle(canvas);
    const ink = styles.getPropertyValue("--color-text").trim() || "#2a1f1a";
    const accent = styles.getPropertyValue("--color-accent").trim() || "#a8322d";
    const brass = styles.getPropertyValue("--color-brass").trim() || "#a9803f";

    ctx.clearRect(0, 0, size, size);
    ctx.lineWidth = 0.5;
    ctx.strokeStyle = ink;
    ctx.globalAlpha = 0.16;
    ctx.beginPath();
    for (let k = 0; k < step; k++) {
      const [x1, y1] = at(sequence[k]);
      const [x2, y2] = at(sequence[k + 1]);
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;

    ctx.fillStyle = brass;
    for (let i = 0; i < POSITIONS.length; i++) {
      const [x, y] = at(i);
      ctx.beginPath();
      ctx.arc(x, y, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = ink;
    ctx.font = "600 13px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    SECTORS.forEach((s, k) => {
      const [x, y] = POSITIONS[k * NAILS_PER_SECTOR + NAILS_PER_SECTOR / 2];
      ctx.fillText(s, size / 2 + x * (r + 13), size / 2 + y * (r + 13));
    });

    if (step < total) {
      // Zoom : la vue se place sur le fil en cours (milieu entre départ et arrivée, arrivée visible).
      if (zoom > 1) {
        const [ax, ay] = at(sequence[step + 1]);
        const [bx, by] = at(sequence[step]);
        const cx = Math.abs(ax - bx) < view * 0.8 ? (ax + bx) / 2 : ax;
        const cy = Math.abs(ay - by) < view * 0.8 ? (ay + by) / 2 : ay;
        const rtl = getComputedStyle(vp).direction === "rtl";
        const left = cx - view / 2;
        vp.scrollTo({ left: rtl ? -(size - view - left) : left, top: cy - view / 2 });
      }
      const [x1, y1] = at(sequence[step]);
      const [x2, y2] = at(sequence[step + 1]);
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(x2, y2, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = ink;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x1, y1, 5, 0, Math.PI * 2);
      ctx.stroke();
    }
  }, [sequence, step, total, zoom, boxSize]);

  const done = step >= total;
  const target = done ? null : sequence[step + 1];
  const upcoming = done ? [] : sequence.slice(step + 1, step + 4).map(nailLabel);
  const num = (n: number) => new Intl.NumberFormat(locale === "ar" ? "ar-DZ-u-nu-latn" : locale).format(n);
  const decimal = (x: number) => String(x).replace(".", locale === "en" ? "." : ",");

  return (
    <div className="guide">
      <div className="guide-main">
        <div className="guide-speeds" dir="ltr" role="group" aria-label={t("speedLabel")}>
          {SPEEDS.map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={Math.abs(secondsPerStep - secondsFor(f)) < 0.05}
              aria-label={t("speedX", { x: decimal(f), s: decimal(secondsFor(f)) })}
              onClick={() => setSecondsPerStep(secondsFor(f))}
            >
              {decimal(f)}×
            </button>
          ))}
        </div>

        <GuideRing target={target} label={t("nextNail")} doneLabel={t("doneShort")} onNext={() => goTo(step + 1)} nextHint={target === null ? "" : t("nextTap", { nail: nailLabel(target) })} />

        <div className="guide-now" aria-live="polite" aria-atomic="true">
          {done ? (
            <p className="guide-done">{t("done")}</p>
          ) : (
            <>
              <p className="visually-hidden">{t("thread", { n: step + 1, total })}</p>
              <p className="guide-upcoming" dir="ltr" aria-label={t("upcoming", { list: upcoming.join(", ") })}>
                {upcoming.map((n, i) => (
                  <span key={i} className={i === 0 ? "is-next" : undefined}>
                    {i > 0 && <span aria-hidden="true" className="guide-arrow"> → </span>}
                    {n}
                  </span>
                ))}
              </p>
            </>
          )}
        </div>

        <div className="guide-progress-wrap">
          <progress className="guide-progress" max={total} value={step} aria-label={t("progress")} />
          <p className="guide-count" dir="ltr">
            {t("count", { n: num(Math.min(step + 1, total)), total: num(total) })}
          </p>
          <p className="guide-meta">
            {t("percent", { p: Math.floor((step / Math.max(1, total)) * 100) })} · {t("remaining", { min: remainingMinutes(sequence, step, secondsPerStep) })}
          </p>
        </div>

        <div className="guide-controls" dir="ltr">
          <button type="button" className="guide-round" onClick={() => speak(step)} disabled={!voiceOn || done} aria-label={t("repeat")}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" />
            </svg>
          </button>
          <button type="button" className="guide-play" onClick={() => setPlaying((p) => !p)} disabled={done} aria-pressed={playing} aria-label={playing ? t("pause") : step === 0 ? t("start") : t("resume")}>
            {playing ? (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <rect x="7" y="5" width="3.2" height="14" rx="1" />
                <rect x="13.8" y="5" width="3.2" height="14" rx="1" />
              </svg>
            ) : (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M8 5.5v13l10.5-6.5z" />
              </svg>
            )}
          </button>
          <button type="button" className="guide-round" onClick={() => setMusicOpen((o) => !o)} aria-expanded={musicOpen} aria-controls="guide-music-panel" aria-label={t("musicTitle")}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 18V5l11-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="17" cy="16" r="3" />
            </svg>
          </button>
        </div>
        <p className="guide-state" aria-hidden="true">
          {playing ? t("pause") : step === 0 ? t("start") : t("resume")}
        </p>

        <div id="guide-music-panel" hidden={!musicOpen}>
          <GuideMusic ducked={speaking} />
        </div>

        <button type="button" className="btn btn-outline btn-block guide-back" onClick={() => goTo(step - 1)} disabled={step === 0}>
          {t("back")}
        </button>
      </div>

      <details ref={settingsRef} className="guide-settings">
        <summary>{t("settings")}</summary>
        <div className="guide-settings-body">
          <div className="guide-board">
            <div ref={viewportRef} className="guide-viewport" data-zoomed={zoom > 1 ? "true" : undefined}>
              <canvas ref={canvasRef} className="guide-canvas" role="img" aria-label={t("boardAlt")} />
            </div>
            <div className="guide-zoom" role="group" aria-label={t("zoom")}>
              {ZOOMS.map((z) => (
                <button key={z} type="button" aria-pressed={zoom === z} onClick={() => chooseZoom(z)} aria-label={t("zoomTo", { z: decimal(z) })}>
                  {decimal(z)}×
                </button>
              ))}
            </div>
          </div>

          <label className="toggle">
            <input type="checkbox" checked={voiceOn} onChange={(e) => setVoiceOn(e.target.checked)} />
            <span>{t("voice")}</span>
          </label>
          {voiceOn && voiceMissing && <p className="field-help">{t("voiceMissing")}</p>}

          <button type="button" className="btn btn-outline btn-block" onClick={() => goTo(step + 1)} disabled={done}>
            {t("next")}
          </button>

          <form
            className="guide-jump"
            onSubmit={(e) => {
              e.preventDefault();
              const n = Number(jump);
              if (Number.isInteger(n) && n >= 1) goTo(n - 1);
              setJump("");
            }}
          >
            <label className="field-label" htmlFor="guide-jump">
              {t("lost")}
            </label>
            <div className="jump-row">
              <input
                id="guide-jump"
                className="field"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder={t("jumpPlaceholder")}
                value={jump}
                onChange={(e) => setJump(e.target.value.replace(/\D/g, ""))}
              />
              <button type="submit" className="btn btn-outline">
                {t("jump")}
              </button>
            </div>
          </form>
          <p className="field-help">{t("keys")}</p>
        </div>
      </details>
    </div>
  );
}

/**
 * Anneau de la planche en 4 quarts (A en haut à gauche, puis B, C, D dans le
 * sens horaire, comme sur la planche) : le quart du prochain clou est en
 * couleur et un point marque sa place exacte. Le centre annonce le clou ;
 * le toucher passe au clou suivant.
 */
function GuideRing({ target, label, doneLabel, onNext, nextHint }: { target: number | null; label: string; doneLabel: string; onNext: () => void; nextHint: string }) {
  const sector = target === null ? -1 : Math.floor(target / NAILS_PER_SECTOR);
  const C = 100;
  const R = 78;
  const W = 34;
  // Quart k : de 180° - 90k à 90° - 90k (angles mathématiques, y vers le haut), petit jour entre les quarts.
  const arc = (k: number) => {
    const gap = 1.6;
    const a0 = ((180 - 90 * k - gap) * Math.PI) / 180;
    const a1 = ((90 - 90 * k + gap) * Math.PI) / 180;
    const p = (a: number, r: number) => `${(C + r * Math.cos(a)).toFixed(2)} ${(C - r * Math.sin(a)).toFixed(2)}`;
    const ro = R + W / 2;
    const ri = R - W / 2;
    return `M ${p(a0, ro)} A ${ro} ${ro} 0 0 1 ${p(a1, ro)} L ${p(a1, ri)} A ${ri} ${ri} 0 0 0 ${p(a0, ri)} Z`;
  };
  const dot = target === null ? null : POSITIONS[target];
  return (
    <div className="guide-ring" dir="ltr">
      <svg viewBox="0 0 200 200" aria-hidden="true" className="guide-ring-svg">
        {SECTORS.map((s, k) => (
          <path key={s} d={arc(k)} className={k === sector ? "ring-q is-on" : "ring-q"} />
        ))}
        {dot && <circle cx={C + dot[0] * R} cy={C + dot[1] * R} r="5" className="ring-dot" />}
      </svg>
      {SECTORS.map((s, k) => (
        <span key={s} className={`ring-letter ring-letter-${s}${k === sector ? " is-on" : ""}`} aria-hidden="true">
          {s}
        </span>
      ))}
      <button type="button" className="ring-center" onClick={onNext} disabled={target === null} aria-label={nextHint || doneLabel}>
        {target === null ? (
          <span className="ring-done">{doneLabel}</span>
        ) : (
          <>
            <span className="ring-caption">{label}</span>
            <span className="ring-nail">{nailLabel(target)}</span>
          </>
        )}
      </button>
    </div>
  );
}
