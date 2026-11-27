import { getTranslations } from "next-intl/server";
import { reviews as configReviews, type Review } from "@/config/reviews";
import { db } from "@/lib/db";

/** Avis validés dans l'admin (12 plus récents), puis ceux de la configuration. */
async function publishedReviews(): Promise<Review[]> {
  try {
    const rows = await db().customerReview.findMany({ where: { status: "APPROVED" }, orderBy: { createdAt: "desc" }, take: 12 });
    return [...rows.map((r) => ({ name: r.name, place: r.place ?? undefined, rating: Math.min(5, Math.max(1, r.rating)) as Review["rating"], text: r.text, photo: r.photoUrl ?? undefined })), ...configReviews];
  } catch {
    return [...configReviews];
  }
}

/** Avis clients : rien n'est affiché tant qu'aucun avis n'est validé. */
export async function Reviews({ reviews }: { reviews?: readonly Review[] }) {
  reviews ??= await publishedReviews();
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
