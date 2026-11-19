import type { MetadataRoute } from "next";
import { site } from "@/config/site";

/**
 * Consignes aux moteurs de recherche : tout le site public, sauf l'admin, l'API
 * et les pages personnelles (commande, code, portrait, guide, suivi).
 */
export default function robots(): MetadataRoute.Robots {
  const privatePages = ["commander", "commande", "activer", "creer", "guide", "suivi", "design"];
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/", ...privatePages.map((p) => `/*/${p}`)] }],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
