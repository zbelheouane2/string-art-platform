import type { SVGProps } from "react";

const base = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  focusable: false,
} as const;

export const MenuIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);

export const CloseIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const PlusIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const PauseIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M9 6v12M15 6v12" />
  </svg>
);

export const PlayIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M8 5.5v13l10-6.5z" />
  </svg>
);

export const ReplayIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4" />
  </svg>
);

/* Icônes fines des étapes « Comment ça marche » (dessin maison). */
const step = { ...base, width: 30, height: 30, strokeWidth: 1.3 } as const;

export const BoxOpenIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...step} {...p}>
    <path d="M4 10.5v7.2l8 3.3 8-3.3v-7.2" />
    <path d="M4 10.5l8 3.2 8-3.2M12 13.7V21" />
    <path d="M4 10.5L2.2 7l8-3.2L12 7M20 10.5L21.8 7l-8-3.2L12 7" />
  </svg>
);

export const PhoneCodeIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...step} {...p}>
    <rect x="6.5" y="2.5" width="11" height="19" rx="2.2" />
    <path d="M10.5 18.5h3" />
    <circle cx="9.3" cy="10.5" r="0.7" fill="currentColor" />
    <circle cx="12" cy="10.5" r="0.7" fill="currentColor" />
    <circle cx="14.7" cy="10.5" r="0.7" fill="currentColor" />
    <path d="M8.8 13.5h6.4" />
  </svg>
);

export const PhotoIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...step} {...p}>
    <rect x="3" y="4.5" width="18" height="15" rx="2" />
    <circle cx="12" cy="10.5" r="2.6" />
    <path d="M7 19.5c.8-2.8 2.7-4.2 5-4.2s4.2 1.4 5 4.2" />
  </svg>
);

export const VoiceIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...step} {...p}>
    <path d="M3.5 9.5h3l4.5-4v13l-4.5-4h-3z" />
    <path d="M15 9.2a4 4 0 010 5.6M17.8 6.6a7.6 7.6 0 010 10.8" />
  </svg>
);

export const FrameIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...step} {...p}>
    <circle cx="12" cy="3.2" r="0.9" />
    <path d="M11.3 3.8L5.5 9.5M12.7 3.8l5.8 5.7" />
    <rect x="4" y="9.5" width="16" height="11.5" rx="1.5" />
    <circle cx="12" cy="15.25" r="3" />
    <path d="M9.4 13.8l5.2 2.9M9.4 16.7l5.2-2.9" />
  </svg>
);

export const SpoolIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...step} {...p}>
    <path d="M6.5 4.5h11M6.5 19.5h11" />
    <path d="M8.5 4.5v15M15.5 4.5v15" />
    <path d="M8.5 8.5l7-1.5M8.5 12l7-1.5M8.5 15.5l7-1.5" />
    <path d="M3.5 21.5h17" />
  </svg>
);
