import { brand } from "@/config/brand";

/** Logo provisoire : le nom de marque souligné d'un fil qui passe par deux clous. */
export function Logo() {
  return (
    <span className="logo">
      <svg className="logo-thread" viewBox="0 0 120 16" aria-hidden="true" focusable="false">
        <path d="M4 12 C 30 2, 52 2, 60 9 S 96 15, 116 4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="4" cy="12" r="2.2" />
        <circle cx="116" cy="4" r="2.2" />
      </svg>
      <span className="logo-name">{brand.name}</span>
    </span>
  );
}
