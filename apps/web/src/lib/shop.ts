import "server-only";
import { accessories as accessoryCatalog, kitOffer } from "@/config/catalog";
import { commerce } from "@/config/commerce";
import { checkoutOptions } from "./orders";
import type { ShopCatalog, ShopItem } from "./shopTypes";

const KIT_THUMB = "/visuels/kit/bureau-vignette.webp";
const optionThumb = (icon: "stand" | "candle") => `/visuels/options/${icon === "stand" ? "support" : "bougie"}-vignette.webp`;
const KIT_NAMES = { fr: "Kit portrait 50 × 50 cm", en: "50 × 50 cm portrait kit", ar: "طقم بورتريه 50 × 50 سم" };

/**
 * Catalogue du panier : prix lus en base (ceux que l'admin modifie), avec repli
 * sur la configuration si la base ne répond pas (le panier reste affichable ;
 * la commande, elle, relit toujours la base).
 */
export async function shopCatalog(): Promise<ShopCatalog | null> {
  const base = { maxQuantity: commerce.maxQuantity, orderingOpen: kitOffer.orderingOpen, provisional: kitOffer.provisional };
  try {
    const o = await checkoutOptions();
    if (o) {
      const kit: ShopItem = { slug: o.product.slug, kind: "kit", names: { ...KIT_NAMES, ...(o.product.names as Partial<ShopItem["names"]>) }, price: o.price, thumb: KIT_THUMB };
      return { ...base, kit, accessories: o.accessories.map((a) => ({ slug: a.slug, kind: "accessory", names: a.names, price: a.price, thumb: optionThumb(a.icon), icon: a.icon })) };
    }
  } catch {
    // Base indisponible : repli sur la configuration.
  }
  if (!kitOffer.price) return null;
  return {
    ...base,
    kit: { slug: kitOffer.slug, kind: "kit", names: KIT_NAMES, price: kitOffer.price, thumb: KIT_THUMB },
    accessories: accessoryCatalog.flatMap((a) => (a.price ? [{ slug: a.slug, kind: "accessory" as const, names: a.names, price: a.price, thumb: optionThumb(a.icon), icon: a.icon }] : [])),
  };
}
