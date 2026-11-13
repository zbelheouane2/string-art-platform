"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { NAILS_PER_SECTOR, SECTORS, nailLabel, nailPositions } from "@/lib/board";
import { SPEED, clampStep, parseProgress, progressKey, remainingMinutes, stepCount } from "@/lib/guide";
import { SPEECH_LANG, stepPhrase } from "@/lib/voice";

const POSITIONS = nailPositions();

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wakeLock = useRef<WakeLockSentinel | null>(null);

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
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const size = canvas.clientWidth || 360;
    const dpr = window.devicePixelRatio || 1;
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
  }, [sequence, step, total]);

  const done = step >= total;
  const from = done ? null : nailLabel(sequence[step]);
  const to = done ? null : nailLabel(sequence[step + 1]);

  return (
    <div className="guide">
      <div className="guide-board">
        <canvas ref={canvasRef} className="guide-canvas" role="img" aria-label={t("boardAlt")} />
      </div>

      <div className="guide-panel">
        <div className="guide-now" aria-live="polite" aria-atomic="true">
          {done ? (
            <p className="guide-done">{t("done")}</p>
          ) : (
            <>
              <p className="guide-count">{t("thread", { n: step + 1, total })}</p>
              <p className="guide-move" dir="ltr">
                <span className="guide-from">{from}</span>
                <span aria-hidden="true" className="guide-arrow">
                  →
                </span>
                <span className="visually-hidden"> {t("to")} </span>
                <span className="guide-to">{to}</span>
              </p>
            </>
          )}
        </div>

        <progress className="guide-progress" max={total} value={step} aria-label={t("progress")} />
        <p className="guide-meta">
          {t("percent", { p: Math.floor((step / Math.max(1, total)) * 100) })} ·{" "}
          {t("remaining", { min: remainingMinutes(sequence, step, secondsPerStep) })}
        </p>

        <div className="guide-controls">
          <button type="button" className="btn btn-outline guide-btn" onClick={() => goTo(step - 1)} disabled={step === 0}>
            {t("prev")}
          </button>
          <button type="button" className="btn btn-primary btn-lg guide-play" onClick={() => setPlaying((p) => !p)} disabled={done} aria-pressed={playing}>
            {playing ? t("pause") : step === 0 ? t("start") : t("resume")}
          </button>
          <button type="button" className="btn btn-outline guide-btn" onClick={() => goTo(step + 1)} disabled={done}>
            {t("next")}
          </button>
        </div>
        <button type="button" className="btn btn-outline btn-block" onClick={() => speak(step)} disabled={!voiceOn}>
          {t("repeat")}
        </button>

        <div className="guide-settings">
          <label className="field-label" htmlFor="guide-speed">
            {t("speed", { s: secondsPerStep })}
          </label>
          <input
            id="guide-speed"
            type="range"
            min={SPEED.min}
            max={SPEED.max}
            step={1}
            value={secondsPerStep}
            onChange={(e) => setSecondsPerStep(Number(e.target.value))}
          />
          <label className="toggle">
            <input type="checkbox" checked={voiceOn} onChange={(e) => setVoiceOn(e.target.checked)} />
            <span>{t("voice")}</span>
          </label>
          {voiceOn && voiceMissing && <p className="field-help">{t("voiceMissing")}</p>}

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
      </div>
    </div>
  );
}
