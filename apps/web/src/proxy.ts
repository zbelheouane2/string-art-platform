import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Tout sauf l'API, l'espace admin (en français, sans préfixe de langue), les images de la médiathèque, les fichiers internes de Next et les fichiers statiques.
  matcher: "/((?!api|admin|media|_next|_vercel|.*\\..*).*)",
};
