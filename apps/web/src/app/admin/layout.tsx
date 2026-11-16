import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "@/styles/tokens.css";
import "./admin.css";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", display: "swap" });

export const metadata: Metadata = {
  title: "Admin — Deekra",
  robots: { index: false, follow: false },
};

/** Espace admin (français uniquement), séparé du site public. */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" dir="ltr" className={dmSans.variable}>
      <body className="admin">{children}</body>
    </html>
  );
}
