/**
 * Prix mis en valeur : le montant en grand, la devise (DA, د.ج, DZD…) plus petite.
 * Reçoit le prix déjà formaté (formatPrice) et sépare simplement chiffres et devise,
 * quel que soit l'ordre selon la langue.
 */
export function PriceTag({ value, className }: { value: string; className?: string }) {
  const m = value.match(/^(\D*?)\s*([\d\s  .,]*\d)\s*(\D*)$/);
  if (!m) return <p className={className}>{value}</p>;
  const [, before, amount, after] = m;
  return (
    <p className={`price-tag${className ? ` ${className}` : ""}`}>
      {before && <span className="price-tag-cur">{before}</span>}
      <span className="price-tag-amount">{amount}</span>
      {after && <span className="price-tag-cur">{after}</span>}
    </p>
  );
}
