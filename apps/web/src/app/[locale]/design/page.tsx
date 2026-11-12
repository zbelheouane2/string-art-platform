import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { BeforeAfter } from "@/components/BeforeAfter";
import { Gallery } from "@/components/Gallery";
import { PlusIcon } from "@/components/Icons";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Logo } from "@/components/Logo";

/**
 * Page interne du système de design : chaque composant isolé, avec ses états.
 * Désactivée par défaut ; ENABLE_DESIGN_PAGE=1 pour l'afficher (jamais indexée).
 */
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Système de design", robots: { index: false, follow: false } };

const COLORS = [
  "bg", "surface", "surface-sand", "surface-blush", "surface-beige", "border", "border-strong", "border-input",
  "text", "text-muted", "inverse", "accent", "accent-hover", "danger", "success", "brass",
];
const TYPE = [
  ["h1", "Titre H1 avec un accent", "h1"],
  ["h2", "Titre de section H2", "h2"],
  ["h3", "Titre de carte H3", "h3"],
  ["lead", "Texte d'introduction, 18 px.", "p"],
  ["base", "Texte courant, 16 px, pour les paragraphes.", "p"],
  ["sm", "Petit texte, 14 px, pour les notes.", "p"],
] as const;
const SHADOWS = ["pop", "card", "hero", "sticky"];
const RADII = ["sm", "md", "lg", "xl", "2xl", "pill"];

export default async function DesignPage({ params }: { params: Promise<{ locale: string }> }) {
  if (process.env.ENABLE_DESIGN_PAGE !== "1") notFound();
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="wrap ds">
      <h1>Système de design</h1>
      <p className="ds-note">Jetons : replica/design/tokens.json. Fiches : replica/design/components.md.</p>

      <section aria-labelledby="ds-colors">
        <h2 id="ds-colors">Couleurs</h2>
        <ul className="ds-swatches">
          {COLORS.map((c) => (
            <li key={c}>
              <span className="ds-swatch" style={{ background: `var(--color-${c})` }} />
              <code>{c}</code>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="ds-type">
        <h2 id="ds-type">Typographie</h2>
        <p className="eyebrow">Sur-titre</p>
        {TYPE.map(([k, text, Tag]) => (
          <div key={k} className="ds-row">
            <code>{k}</code>
            {Tag === "h1" ? (
              <h1>
                Titre H1 avec <em>un accent</em>
              </h1>
            ) : (
              <Tag style={{ fontSize: `var(--text-${k})` }}>{text}</Tag>
            )}
          </div>
        ))}
      </section>

      <section aria-labelledby="ds-buttons">
        <h2 id="ds-buttons">Boutons</h2>
        <div className="ds-flex">
          <button type="button" className="btn btn-primary btn-lg">Principal</button>
          <button type="button" className="btn btn-outline btn-lg">Contour</button>
          <button type="button" className="btn btn-primary btn-lg" disabled>Désactivé</button>
          <button type="button" className="btn btn-primary">Taille normale</button>
          <button type="button" className="icon-btn" aria-label="Bouton icône">
            <PlusIcon />
          </button>
        </div>
      </section>

      <section aria-labelledby="ds-shapes">
        <h2 id="ds-shapes">Arrondis et ombres</h2>
        <div className="ds-flex">
          {RADII.map((r) => (
            <div key={r} className="ds-box" style={{ borderRadius: `var(--radius-${r})` }}>
              <code>{r}</code>
            </div>
          ))}
        </div>
        <div className="ds-flex">
          {SHADOWS.map((s) => (
            <div key={s} className="ds-box ds-box-white" style={{ boxShadow: `var(--shadow-${s})` }}>
              <code>{s}</code>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="ds-small">
        <h2 id="ds-small">Petits éléments</h2>
        <div className="ds-flex">
          <span className="badge ds-static">Pastille</span>
          <Logo />
          <LanguageSwitcher />
        </div>
        <ul className="check-list">
          <li>Liste à coches</li>
          <li>Deuxième élément</li>
        </ul>
        <ol className="num-steps">
          <li>
            <h3>Étape numérotée</h3>
            <p>Texte de l&apos;étape.</p>
          </li>
        </ol>
      </section>

      <section aria-labelledby="ds-faq">
        <h2 id="ds-faq">Accordéon</h2>
        <div className="faq-list">
          <details>
            <summary>
              Question fermée
              <PlusIcon />
            </summary>
            <p>Réponse.</p>
          </details>
          <details open>
            <summary>
              Question ouverte
              <PlusIcon />
            </summary>
            <p>Réponse visible.</p>
          </details>
        </div>
      </section>

      <section aria-labelledby="ds-media" className="ds-media">
        <h2 id="ds-media">Médias</h2>
        <div className="split">
          <BeforeAfter photo="/visuels/astronaute-photo.webp" thread="/visuels/astronaute-fil.webp" />
          <Gallery
            images={[
              { src: "/visuels/astronaute-fil.webp", alt: "Rendu 1" },
              { src: "/visuels/chat-fil.webp", alt: "Rendu 2" },
            ]}
          />
        </div>
      </section>
    </main>
  );
}
