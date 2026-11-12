/** Visuel provisoire : motif de fil classique (cardioïde) sur un cercle de clous. */
export function NailRing({ className = "ring" }: { className?: string }) {
  const n = 120;
  const pt = (i: number) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    return [50 + 44 * Math.cos(a), 50 + 44 * Math.sin(a)] as const;
  };
  const chords = Array.from({ length: n }, (_, i) => {
    const [x1, y1] = pt(i);
    const [x2, y2] = pt((i * 2) % n);
    return `M${x1.toFixed(2)} ${y1.toFixed(2)}L${x2.toFixed(2)} ${y2.toFixed(2)}`;
  }).join("");
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true" focusable="false">
      <path d={chords} fill="none" stroke="currentColor" strokeWidth="0.18" />
      {Array.from({ length: n }, (_, i) => {
        const [cx, cy] = pt(i);
        return <circle key={i} cx={cx} cy={cy} r="0.55" />;
      })}
    </svg>
  );
}
