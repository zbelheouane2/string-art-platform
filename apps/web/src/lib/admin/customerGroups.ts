/**
 * Liste des clients : une fiche par numéro de téléphone (le site crée une
 * fiche client à chaque commande). Les commandes annulées ou retournées ne
 * comptent pas dans le montant dépensé.
 */
export interface CustomerOrder {
  number: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  wilaya: string;
  status: string;
  totalMinor: number;
  createdAt: Date;
}

export interface CustomerSummary {
  key: string;
  fullName: string;
  phone: string;
  email: string;
  wilaya: string;
  orders: number;
  spentMinor: number;
  firstAt: Date;
  lastAt: Date;
  lastNumber: string;
}

const LOST = new Set(["CANCELLED", "RETURNED"]);

export function groupCustomers(orders: CustomerOrder[]): CustomerSummary[] {
  const map = new Map<string, CustomerSummary>();
  for (const o of [...orders].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())) {
    const key = o.phone?.replace(/\D/g, "") || `nom:${o.fullName.trim().toLowerCase()}`;
    const c = map.get(key);
    const spent = LOST.has(o.status) ? 0 : o.totalMinor;
    if (!c) {
      map.set(key, { key, fullName: o.fullName, phone: o.phone ?? "", email: o.email ?? "", wilaya: o.wilaya, orders: 1, spentMinor: spent, firstAt: o.createdAt, lastAt: o.createdAt, lastNumber: o.number });
    } else {
      // La commande la plus récente donne le nom, l'e-mail et la wilaya à jour.
      Object.assign(c, { fullName: o.fullName, email: o.email || c.email, wilaya: o.wilaya || c.wilaya, orders: c.orders + 1, spentMinor: c.spentMinor + spent, lastAt: o.createdAt, lastNumber: o.number });
    }
  }
  return [...map.values()].sort((a, b) => b.lastAt.getTime() - a.lastAt.getTime());
}
