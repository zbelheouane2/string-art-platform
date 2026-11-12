"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

/** Curseur photo ↔ portrait en fil (le rendu vient du moteur, même recadrage). */
export function BeforeAfter({
  photo,
  thread,
  compact = false,
  label,
}: {
  photo: string;
  thread: string;
  compact?: boolean;
  label?: string;
}) {
  const t = useTranslations("what.slider");
  const [pos, setPos] = useState(50);
  return (
    <figure className={compact ? "ba ba-compact" : "ba"} dir="ltr" style={{ ["--pos" as string]: `${pos}%` }}>
      <img src={thread} alt="" className="ba-img" width={900} height={900} />
      <img src={photo} alt="" className="ba-img ba-top" width={900} height={900} />
      {!compact && <span className="ba-tag ba-tag-start">{t("photo")}</span>}
      {!compact && <span className="ba-tag ba-tag-end">{t("thread")}</span>}
      <span className="ba-handle" aria-hidden="true" />
      <input
        type="range"
        min={0}
        max={100}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        aria-label={label ?? t("label")}
        className="ba-range"
      />
    </figure>
  );
}
