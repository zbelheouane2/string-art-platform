"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { MAX_ZOOM, type Box, type Size, boxToParam, clampBox, panBy, zoomOf, zoomTo } from "@/lib/frame";

/**
 * Cadrage de la photo : le cercle montre exactement ce qui sera tendu sur la
 * planche. On déplace la photo au doigt ou à la souris, on zoome en pinçant,
 * à la molette, avec le curseur ou les boutons ; « Recentrer » revient au
 * cadrage proposé (visage centré).
 */
export function PhotoFramer({
  src,
  size,
  box,
  autoBox,
  onChange,
  busy,
}: {
  src: string;
  size: Size;
  box: Box;
  autoBox: Box;
  onChange: (b: Box) => void;
  busy?: boolean;
}) {
  const t = useTranslations("create.frame");
  const viewRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState(0);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ box: Box; dist: number; mid: { x: number; y: number } } | null>(null);
  const boxRef = useRef(box);
  boxRef.current = box;

  useEffect(() => {
    const el = viewRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setView(el.clientWidth));
    ro.observe(el);
    setView(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const scale = view ? view / box.side : 0;
  const zoom = zoomOf(box, size);

  const local = (e: { clientX: number; clientY: number }) => {
    const r = viewRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const startGesture = () => {
    const pts = [...pointers.current.values()];
    if (pts.length >= 2) {
      const [a, b] = pts;
      gesture.current = { box: boxRef.current, dist: Math.hypot(a.x - b.x, a.y - b.y), mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } };
    } else gesture.current = null;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, local(e));
    startGesture();
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev || !view) return;
    const p = local(e);
    pointers.current.set(e.pointerId, p);
    const pts = [...pointers.current.values()];
    if (pts.length >= 2 && gesture.current) {
      // Pincer : zoom autour du point entre les deux doigts, et déplacement de ce point.
      const [a, b] = pts;
      const g = gesture.current;
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const z = zoomOf(g.box, size) * (dist / Math.max(1, g.dist));
      let next = zoomTo(g.box, z, size, g.mid.x / view, g.mid.y / view);
      next = panBy(next, mid.x - g.mid.x, mid.y - g.mid.y, view / next.side, size);
      onChange(next);
    } else if (pts.length === 1) {
      onChange(panBy(boxRef.current, p.x - prev.x, p.y - prev.y, view / boxRef.current.side, size));
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    startGesture();
  };

  // Molette (ordinateur) : zoom autour du pointeur. Écouteur natif pour pouvoir bloquer le défilement de la page.
  const onWheel = useCallback(
    (e: WheelEvent) => {
      if (!view) return;
      e.preventDefault();
      const p = local(e);
      const b = boxRef.current;
      onChange(zoomTo(b, zoomOf(b, size) * Math.exp(-e.deltaY / 400), size, p.x / view, p.y / view));
    },
    [view, size, onChange],
  );
  useEffect(() => {
    const el = viewRef.current;
    if (!el) return;
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [onWheel]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = view / 20;
    const moves: Record<string, [number, number]> = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
    if (moves[e.key]) {
      e.preventDefault();
      onChange(panBy(box, moves[e.key][0], moves[e.key][1], scale, size));
    } else if (e.key === "+" || e.key === "=") onChange(zoomTo(box, zoom * 1.15, size));
    else if (e.key === "-") onChange(zoomTo(box, zoom / 1.15, size));
  };

  const recentred = Math.abs(box.x - autoBox.x) < 1 && Math.abs(box.y - autoBox.y) < 1 && Math.abs(box.side - autoBox.side) < 1;

  return (
    <div className="framer">
      <div
        ref={viewRef}
        className="framer-view"
        dir="ltr"
        role="group"
        tabIndex={0}
        aria-label={t("area")}
        aria-describedby="framer-help"
        data-busy={busy ? "true" : undefined}
        data-box={boxToParam(box)}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
      >
        {scale > 0 && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt=""
            draggable={false}
            className="framer-img"
            style={{ width: size.width * scale, height: size.height * scale, left: -box.x * scale, top: -box.y * scale }}
          />
        )}
        <span className="framer-ring" aria-hidden="true" />
      </div>
      <p id="framer-help" className="field-help">
        {t("help")}
      </p>
      <div className="framer-tools" dir="ltr">
        <button type="button" className="icon-btn framer-zoom-btn" aria-label={t("zoomOut")} onClick={() => onChange(zoomTo(box, zoom / 1.25, size))} disabled={zoom <= 1.001}>
          −
        </button>
        <input
          type="range"
          className="framer-slider"
          min={1}
          max={MAX_ZOOM}
          step={0.01}
          value={zoom}
          aria-label={t("zoom")}
          aria-valuetext={t("zoomValue", { z: zoom.toFixed(1) })}
          onChange={(e) => onChange(zoomTo(box, Number(e.target.value), size))}
        />
        <button type="button" className="icon-btn framer-zoom-btn" aria-label={t("zoomIn")} onClick={() => onChange(zoomTo(box, zoom * 1.25, size))} disabled={zoom >= MAX_ZOOM - 0.001}>
          +
        </button>
        <button type="button" className="btn btn-outline framer-recenter" onClick={() => onChange(clampBox(autoBox, size))} disabled={recentred}>
          {t("recenter")}
        </button>
      </div>
    </div>
  );
}
