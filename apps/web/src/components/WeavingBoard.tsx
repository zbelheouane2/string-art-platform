"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { NAILS_PER_SECTOR, SECTORS, nailLabel, type DemoPortrait } from "@/lib/board";
import { PauseIcon, PlayIcon, ReplayIcon } from "./Icons";

const DURATION_MS = 16000;
const THREAD = "rgba(26, 25, 22, 0.2)";
const NAIL = "#a9803f";

/**
 * Tisse le portrait de démonstration fil après fil, dans l'ordre exact
 * calculé par le moteur. C'est la vraie séquence, pas une illustration.
 */
export function WeavingBoard({ demo }: { demo: DemoPortrait }) {
  const t = useTranslations("hero");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawnRef = useRef(0);
  const [count, setCount] = useState(0);
  const [playing, setPlaying] = useState(true);
  const total = demo.sequence.length - 1;

  const geometry = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const size = canvas.getBoundingClientRect().width;
    const radius = size * 0.455;
    return { canvas, ctx, size, radius, c: size / 2 };
  }, []);

  const drawLines = useCallback(
    (from: number, to: number) => {
      const g = geometry();
      if (!g) return;
      const { ctx, radius, c } = g;
      ctx.strokeStyle = THREAD;
      ctx.lineWidth = Math.max(0.45, g.size / 1100);
      ctx.beginPath();
      for (let k = from; k < to; k++) {
        const [ax, ay] = demo.nails[demo.sequence[k]];
        const [bx, by] = demo.nails[demo.sequence[k + 1]];
        ctx.moveTo(c + ax * radius, c + ay * radius);
        ctx.lineTo(c + bx * radius, c + by * radius);
      }
      ctx.stroke();
    },
    [demo, geometry],
  );

  const reset = useCallback(() => {
    const g = geometry();
    if (!g) return;
    const { canvas, ctx, size, radius, c } = g;
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = NAIL;
    const r = Math.max(1, size / 420);
    for (const [x, y] of demo.nails) {
      ctx.beginPath();
      ctx.arc(c + x * radius, c + y * radius, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [demo, geometry]);

  // Taille du canevas et redessin après redimensionnement.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      reset();
      drawLines(0, drawnRef.current);
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [reset, drawLines]);

  // Mouvement réduit : le portrait apparaît terminé.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      reset();
      drawLines(0, total);
      drawnRef.current = total;
      setCount(total);
      setPlaying(false);
    }
  }, [reset, drawLines, total]);

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    let frame = 0;
    const perMs = total / DURATION_MS;
    let budget = 0;
    const tick = (now: number) => {
      budget += (now - last) * perMs;
      last = now;
      const target = Math.min(total, drawnRef.current + Math.floor(budget));
      budget -= target - drawnRef.current;
      if (target > drawnRef.current) {
        drawLines(drawnRef.current, target);
        drawnRef.current = target;
      }
      if (++frame % 4 === 0 || target === total) setCount(target);
      if (target >= total) {
        setPlaying(false);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, drawLines, total]);

  const replay = () => {
    reset();
    drawnRef.current = 0;
    setCount(0);
    setPlaying(true);
  };

  const done = count >= total;
  const k = Math.max(1, count);
  const from = nailLabel(demo.sequence[k - 1]);
  const to = nailLabel(demo.sequence[k]);
  const format = useFormatter();
  const fmt = { format: (n: number) => format.number(n) };

  return (
    <figure className="plaque" style={{ margin: 0 }}>
      <div className="plaque-canvas" dir="ltr">
        <canvas ref={canvasRef} role="img" aria-label={t("boardLabel")} />
        {SECTORS.map((s, i) => {
          const [x, y] = demo.nails[i * NAILS_PER_SECTOR + NAILS_PER_SECTOR / 2];
          return (
            <span
              key={s}
              className="sector-label"
              aria-hidden="true"
              style={{ left: `${50 + x * 49}%`, top: `${50 + y * 49}%`, transform: "translate(-50%, -50%)" }}
            >
              {s}
            </span>
          );
        })}
      </div>
      <figcaption>
        <div className="plaque-bar">
          <p className="plaque-status">
            <strong>{t("progress", { current: fmt.format(count), total: fmt.format(total) })}</strong>
            <span>{t("segment", { from, to })}</span>
          </p>
          {done ? (
            <button type="button" className="icon-btn" onClick={replay} aria-label={t("replay")} title={t("replay")}>
              <ReplayIcon />
            </button>
          ) : (
            <button
              type="button"
              className="icon-btn"
              onClick={() => setPlaying((v) => !v)}
              aria-label={playing ? t("pause") : t("play")}
              title={playing ? t("pause") : t("play")}
            >
              {playing ? <PauseIcon /> : <PlayIcon />}
            </button>
          )}
        </div>
        <p className="plaque-credit">{t("credit")}</p>
      </figcaption>
    </figure>
  );
}
