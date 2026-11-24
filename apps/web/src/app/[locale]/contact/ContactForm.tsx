"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { whatsappUrl } from "@/lib/contact";

/** Prépare le message et l'ouvre dans WhatsApp (rien n'est envoyé au site). */
export function ContactForm({ whatsapp }: { whatsapp: string }) {
  const t = useTranslations("contact");
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="form-card contact-form"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        const name = String(data.get("name") ?? "").trim();
        const order = String(data.get("order") ?? "").trim();
        const message = String(data.get("message") ?? "").trim();
        if (message.length < 5) return setError(t("errorMessage"));
        setError(null);
        const text = [name && `${t("fields.name")} : ${name}`, order && `${t("fields.order")} : ${order}`, message].filter(Boolean).join("\n");
        const url = whatsappUrl(whatsapp, text);
        if (url) window.open(url, "_blank", "noopener,noreferrer");
      }}
    >
      <div className="field-pair">
        <div className="field-group">
          <label htmlFor="c-name" className="field-label">
            {t("fields.name")}
          </label>
          <input id="c-name" name="name" className="field" autoComplete="name" maxLength={80} />
        </div>
        <div className="field-group">
          <label htmlFor="c-order" className="field-label">
            {t("fields.order")}
          </label>
          <input id="c-order" name="order" className="field" dir="ltr" placeholder="DK-XXXXXX" maxLength={12} />
        </div>
      </div>
      <div className="field-group">
        <label htmlFor="c-message" className="field-label">
          {t("fields.message")}
        </label>
        <textarea
          id="c-message"
          name="message"
          className="field"
          rows={5}
          maxLength={800}
          required
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "c-message-error" : undefined}
        />
        {error && (
          <p id="c-message-error" className="field-error">
            {error}
          </p>
        )}
      </div>
      <button type="submit" className="btn btn-primary btn-block">
        {t("send")}
      </button>
      <p className="field-help">{t("privacy")}</p>
    </form>
  );
}
