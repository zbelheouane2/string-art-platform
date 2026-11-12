import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function NotFound() {
  const t = await getTranslations("notFound");
  return (
    <main className="wrap not-found">
      <h1>{t("title")}</h1>
      <Link className="btn btn-primary" href="/">
        {t("back")}
      </Link>
    </main>
  );
}
