"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

interface Portrait {
  id: string;
  previewPng: string;
  lines: number;
  threadLengthM: number;
  warnings: string[];
  faceDetected: boolean;
}

const VARIANTS = ["doux", "standard", "contraste"] as const;
const ACCEPT = ["image/jpeg", "image/png", "image/webp"];

/** Studio : photo → réglage simple → calcul par le moteur → validation. */
export function PortraitStudio({ remaining: initialRemaining, maxBytes }: { remaining: number; maxBytes: number }) {
  const t = useTranslations("create");
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [variant, setVariant] = useState<(typeof VARIANTS)[number]>("standard");
  const [keepBackground, setKeepBackground] = useState(false);
  const [busy, setBusy] = useState<"generate" | "choose" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [portrait, setPortrait] = useState<Portrait | null>(null);
  const [remaining, setRemaining] = useState(initialRemaining);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => void (photoUrl && URL.revokeObjectURL(photoUrl)), [photoUrl]);

  function pick(f: File | undefined) {
    setError(null);
    setPortrait(null);
    if (!f) return;
    if (!ACCEPT.includes(f.type)) return setError("fileType");
    if (f.size > maxBytes) return setError("fileSize");
    setFile(f);
    setPhotoUrl(URL.createObjectURL(f));
  }

  async function generate() {
    if (!file) return;
    setBusy("generate");
    setError(null);
    const form = new FormData();
    form.set("photo", file);
    form.set("variant", variant);
    form.set("background", keepBackground ? "keep" : "light");
    try {
      const res = await fetch("/api/generations", { method: "POST", body: form });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (body.error === "noSession") return router.push("/activer");
        return setError(typeof body.error === "string" ? body.error : "engine");
      }
      setPortrait(body as Portrait);
      setRemaining((r) => Math.max(0, r - 1));
      requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch {
      setError("network");
    } finally {
      setBusy(null);
    }
  }

  async function choose() {
    if (!portrait) return;
    setBusy("choose");
    const res = await fetch(`/api/generations/${portrait.id}/choose`, { method: "POST" });
    if (res.ok) return router.push(`/guide/${portrait.id}`);
    setBusy(null);
    setError("engine");
  }

  return (
    <div className="studio">
      <section className="studio-step" aria-labelledby="studio-photo">
        <h2 id="studio-photo" className="studio-title">
          <span className="studio-num">1</span> {t("photo.title")}
        </h2>
        <label className="drop">
          <input type="file" accept={ACCEPT.join(",")} className="visually-hidden" onChange={(e) => pick(e.target.files?.[0])} />
          {photoUrl ? (
            <img src={photoUrl} alt={t("photo.alt")} className="drop-img" />
          ) : (
            <span className="drop-text">
              <strong>{t("photo.choose")}</strong>
              <span>{t("photo.hint")}</span>
            </span>
          )}
        </label>
        {photoUrl && <p className="field-help">{t("photo.change")}</p>}
      </section>

      <section className="studio-step" aria-labelledby="studio-style">
        <h2 id="studio-style" className="studio-title">
          <span className="studio-num">2</span> {t("style.title")}
        </h2>
        <fieldset className="choice-row">
          <legend className="visually-hidden">{t("style.title")}</legend>
          {VARIANTS.map((v) => (
            <label key={v} className="choice">
              <input type="radio" name="variant" value={v} checked={variant === v} onChange={() => setVariant(v)} />
              <span>
                <strong>{t(`style.${v}.name`)}</strong>
                <small>{t(`style.${v}.text`)}</small>
              </span>
            </label>
          ))}
        </fieldset>
        <label className="toggle">
          <input type="checkbox" checked={keepBackground} onChange={(e) => setKeepBackground(e.target.checked)} />
          <span>{t("style.keepBackground")}</span>
        </label>
      </section>

      <div className="studio-actions">
        <button type="button" className="btn btn-primary btn-lg btn-block" disabled={!file || busy !== null || remaining <= 0} onClick={generate}>
          {busy === "generate" ? t("generating") : portrait ? t("regenerate") : t("generate")}
        </button>
        <p className="field-help" aria-live="polite">
          {busy === "generate" ? t("generatingHint") : t("remaining", { count: remaining })}
        </p>
        {error && (
          <p className="field-error" role="alert">
            {t(`errors.${error}`)}
          </p>
        )}
      </div>

      {portrait && (
        <section className="studio-result" ref={resultRef} aria-labelledby="studio-result" tabIndex={-1}>
          <h2 id="studio-result" className="studio-title">
            <span className="studio-num">3</span> {t("result.title")}
          </h2>
          <div className="compare">
            {photoUrl && (
              <figure>
                <img src={photoUrl} alt={t("photo.alt")} />
                <figcaption>{t("result.before")}</figcaption>
              </figure>
            )}
            <figure>
              <img src={`data:image/png;base64,${portrait.previewPng}`} alt={t("result.alt")} />
              <figcaption>{t("result.after")}</figcaption>
            </figure>
          </div>
          <p className="result-facts">{t("result.facts", { lines: portrait.lines, meters: Math.round(portrait.threadLengthM) })}</p>
          {portrait.warnings.length > 0 && (
            <ul className="result-warnings">
              {portrait.warnings.map((w) => (
                <li key={w}>{t.has(`warnings.${w}`) ? t(`warnings.${w}`) : w}</li>
              ))}
            </ul>
          )}
          {!portrait.faceDetected && <p className="field-help">{t("result.noFace")}</p>}
          <button type="button" className="btn btn-primary btn-lg btn-block" disabled={busy !== null} onClick={choose}>
            {busy === "choose" ? t("result.choosing") : t("result.choose")}
          </button>
          <p className="field-help">{t("result.chooseHint")}</p>
        </section>
      )}
    </div>
  );
}
