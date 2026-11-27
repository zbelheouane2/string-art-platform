import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/**
 * Politique de sécurité du contenu : le navigateur n'exécute que les scripts
 * du site et des trois outils de mesure (Google, Meta, TikTok). Un script
 * injecté venant d'ailleurs, un formulaire envoyé vers un autre site ou une
 * balise <base> piégée sont refusés. Les scripts en ligne de Next.js restent
 * permis ('unsafe-inline') : sans cela le site ne s'afficherait plus.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "production" ? "" : " 'unsafe-eval'"} https://www.googletagmanager.com https://connect.facebook.net https://analytics.tiktok.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "media-src 'self' blob:",
  "connect-src 'self' https:",
  "frame-src 'self' https://www.facebook.com https://www.googletagmanager.com",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // HTTPS imposé : Render redirige déjà http → https ; HSTS dit au navigateur de ne plus jamais essayer http
  // (2 ans). Ignoré par les navigateurs sur http://localhost.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  // Admin : fichiers de tarifs (2 Mo) et images (3 Mo chacune, deux par exemple avant/après), vérifiés dans les actions.
  experimental: { serverActions: { bodySizeLimit: "7mb" } },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default withNextIntl(nextConfig);
