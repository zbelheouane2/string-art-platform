/**
 * Plan de la planche du kit, dessiné à partir de la géométrie du moteur
 * (services/engine/boards/board-50x50-240-v1.json) : planche 500 mm, cercle de
 * 470 mm, 240 clous, secteurs A-D de 60 clous dans le sens horaire, A1 à 9 h.
 * Les repères (A1…D60) sont donc exactement ceux que le guide vocal annonce.
 */
const BOARD = 500;
const CENTER = BOARD / 2;
const NAIL_RADIUS = 470 / 2;
const NAILS = 240;
const SECTORS = ["A", "B", "C", "D"] as const;
const PER_SECTOR = NAILS / SECTORS.length;
const START_DEG = 180;
/** Fond de chaque secteur, comme sur la planche : A et C noirs, B et D blancs. */
const DARK = [true, false, true, false];
/** Coin de chaque secteur dans le carré (A en haut à gauche, puis sens horaire). */
const CORNERS = [
  [0, 0],
  [CENTER, 0],
  [CENTER, CENTER],
  [0, CENTER],
] as const;

const INK = "#161412";
const PAPER = "#f6f3ee";

function angle(i: number) {
  return ((START_DEG - (i + 0.5) * (360 / NAILS)) * Math.PI) / 180;
}

function at(r: number, a: number) {
  return [CENTER + r * Math.cos(a), CENTER - r * Math.sin(a)] as const;
}

export function BoardPlan({ className, label }: { className?: string; label?: string }) {
  const nails = Array.from({ length: NAILS }, (_, i) => {
    const a = angle(i);
    const sector = Math.floor(i / PER_SECTOR);
    const n = (i % PER_SECTOR) + 1;
    const [x, y] = at(NAIL_RADIUS, a);
    const [tx, ty] = at(NAIL_RADIUS + 7.2, a);
    let rot = (-a * 180) / Math.PI;
    if (Math.cos(a) < 0) rot += 180;
    const ink = DARK[sector] ? PAPER : INK;
    const strong = n % 10 === 0 || n === 1;
    return (
      <g key={i}>
        <circle cx={x.toFixed(2)} cy={y.toFixed(2)} r="1.1" fill={ink} />
        <text
          x={tx.toFixed(2)}
          y={ty.toFixed(2)}
          transform={`rotate(${rot.toFixed(2)} ${tx.toFixed(2)} ${ty.toFixed(2)})`}
          fill={ink}
          fontSize={strong ? 3.6 : 2.9}
          fontWeight={strong ? 700 : 400}
          textAnchor="middle"
          dominantBaseline="central"
        >
          {n}
        </text>
      </g>
    );
  });

  return (
    <svg
      viewBox={`0 0 ${BOARD} ${BOARD}`}
      className={className}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      <defs>
        <clipPath id="board-clip">
          <rect width={BOARD} height={BOARD} rx="9" />
        </clipPath>
      </defs>
      <g clipPath="url(#board-clip)">
        {CORNERS.map(([x, y], s) => (
          <rect key={s} x={x} y={y} width={CENTER} height={CENTER} fill={DARK[s] ? INK : PAPER} />
        ))}
        <circle cx={CENTER} cy={CENTER} r={NAIL_RADIUS - 4} fill={PAPER} />
        <circle cx={CENTER} cy={CENTER} r={NAIL_RADIUS - 4} fill="none" stroke={INK} strokeOpacity="0.25" strokeWidth="0.6" />
      </g>
      <rect width={BOARD} height={BOARD} rx="9" fill="none" stroke={INK} strokeOpacity="0.3" strokeWidth="1" />
      {nails}
      {SECTORS.map((s, k) => {
        const [x, y] = CORNERS[k];
        const cx = x === 0 ? 22 : BOARD - 22;
        const cy = y === 0 ? 28 : BOARD - 16;
        return (
          <text key={s} x={cx} y={cy} fill={DARK[k] ? PAPER : INK} fontSize="20" style={{ fontFamily: "var(--font-display)" }} textAnchor="middle">
            {s}
          </text>
        );
      })}
      <text x={CENTER} y={CENTER} fill={INK} fontSize="46" fontWeight="700" letterSpacing="1" textAnchor="middle" dominantBaseline="central">
        50 × 50 cm
      </text>
      <text x={CENTER} y={CENTER + 40} fill={INK} fillOpacity="0.6" fontSize="13" letterSpacing="3" textAnchor="middle">
        240 · A1 → D60
      </text>
    </svg>
  );
}
