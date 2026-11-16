import type { SVGProps } from "react";

/** Pictogrammes des engagements et des contacts (traits simples, couleur du texte). */
const base = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  focusable: false,
} as const;

type P = SVGProps<SVGSVGElement>;

export const TruckIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M2.5 6.5h11v10h-11zM13.5 10h4l3 3.5v3h-7" />
    <circle cx="6.5" cy="17.5" r="1.8" />
    <circle cx="17" cy="17.5" r="1.8" />
  </svg>
);

export const CashIcon = (p: P) => (
  <svg {...base} {...p}>
    <rect x="2.5" y="6" width="19" height="12" rx="1.5" />
    <circle cx="12" cy="12" r="2.6" />
    <path d="M6 9.5v5M18 9.5v5" />
  </svg>
);

export const ShieldIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.2-7.5 9.5-4.3-1.3-7.5-4.9-7.5-9.5V6z" />
    <path d="M8.8 12.2l2.2 2.2 4.3-4.6" />
  </svg>
);

export const WhatsAppIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4 20l1.2-4.1A8.3 8.3 0 1112 20.3a8.3 8.3 0 01-4-1.1z" />
    <path d="M9.2 8.6c.3-.6.9-.6 1.1 0l.6 1.5-.8.9c.6 1.2 1.6 2.2 2.9 2.9l.9-.8 1.5.6c.6.2.6.8 0 1.1-.8.6-1.9.7-2.9.2a8 8 0 01-3.5-3.5c-.5-1-.4-2.1.2-2.9z" />
  </svg>
);

export const MailIcon = (p: P) => (
  <svg {...base} {...p}>
    <rect x="3" y="5.5" width="18" height="13" rx="1.5" />
    <path d="M3.5 6.5L12 13l8.5-6.5" />
  </svg>
);

export const InstagramIcon = (p: P) => (
  <svg {...base} {...p}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
    <circle cx="12" cy="12" r="3.8" />
    <circle cx="17" cy="7" r="0.6" fill="currentColor" />
  </svg>
);

export const FacebookIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M14 21v-7.5h2.6l.4-3H14V8.8c0-.9.3-1.5 1.6-1.5H17V4.6c-.3 0-1.2-.1-2.3-.1-2.3 0-3.7 1.4-3.7 3.9v2.1H8.5v3H11V21" />
  </svg>
);

export const TikTokIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M14 3.5v11.2a3.6 3.6 0 11-3.6-3.6M14 3.5c.4 2.6 2.2 4.4 5 4.6" />
  </svg>
);

export const SOCIAL_ICONS: Record<string, (p: P) => React.ReactElement> = {
  instagram: InstagramIcon,
  facebook: FacebookIcon,
  tiktok: TikTokIcon,
};
