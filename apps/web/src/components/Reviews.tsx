import { getTranslations } from "next-intl/server";
import { reviews as allReviews, type Review } from "@/config/reviews";

/** Avis clients : rien n'est affiché tant que la liste (config/reviews.ts) est vide. */
export async function Reviews({ reviews = allReviews }: { reviews?: readonly Review[] }) {
  if (reviews.length === 0) return null;
  const t = await getTranslations("reviews");
  return (
    <section className="section bg-cream" id="avis" aria-labelledby="reviews-title">
      <div className="wrap">
        <header className="section-head center" data-reveal>
          <h2 id="reviews-title">{t("title")}</h2>
        </header>
        <ul className="review-grid">
          {reviews.map((r, i) => (
            <li key={`${r.name}-${i}`} className="review-card" data-reveal style={{ ["--i" as string]: i % 3 }}>
              {r.photo && <img src={r.photo} alt={t("photoAlt", { name: r.name })} width={600} height={600} loading="lazy" />}
              <p className="review-stars" role="img" aria-label={t("rating", { n: r.rating })}>
                {"★".repeat(r.rating)}
                <span aria-hidden="true">{"★".repeat(5 - r.rating)}</span>
              </p>
              <blockquote>{r.text}</blockquote>
              <p className="review-name">
                {r.name}
                {r.place && ` · ${r.place}`}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
