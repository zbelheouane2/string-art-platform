import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageShell } from "@/components/PageShell";
import { VoiceGuide } from "@/components/VoiceGuide";
import { brand } from "@/config/brand";
import { Link, redirect } from "@/i18n/navigation";
import { commerce } from "@/config/commerce";
import type { DemoPortrait } from "@/lib/board";
import { portraitSequence, purgedPortrait } from "@/lib/portraits";
import { currentCodeId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "guide" });
  return { title: `${t("title")} — ${brand.name}`, robots: { index: false } };
}

async function demoPortrait() {
  const file = path.join(process.cwd(), "public", "demo", "portrait-demo.json");
  const demo: DemoPortrait = JSON.parse(await readFile(file, "utf-8"));
  return { id: "demo", sequence: demo.sequence, lines: demo.lines, threadLengthM: demo.thread_length_m, saved: null };
}

/**
 * Guide de réalisation. `demo` : portrait de démonstration, ouvert à tous.
 * Sinon, seul l'appareil qui a ouvert le code du portrait y a accès.
 */
export default async function GuidePage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  let portrait;
  if (id === "demo") {
    portrait = await demoPortrait();
  } else {
    const codeId = await currentCodeId();
    portrait = codeId ? await portraitSequence(codeId, id) : null;
    if (!portrait && codeId && (await purgedPortrait(codeId, id))) return <PurgedPortrait />;
    if (!portrait) redirect({ href: "/activer", locale });
  }
  const t = await getTranslations("guide");
  return (
    <PageShell>
      <header className="flow-head guide-head">
        <h1>{t("title")}</h1>
        <p>{t("lead", { lines: portrait!.lines, meters: Math.round(portrait!.threadLengthM) })}</p>
      </header>
      <VoiceGuide portraitId={portrait!.id} sequence={portrait!.sequence} serverProgress={portrait!.saved} syncUrl={id === "demo" ? null : `/api/generations/${portrait!.id}/progress`} />
    </PageShell>
  );
}

/** Portrait terminé dont les instructions ont été effacées après le délai prévu. */
async function PurgedPortrait() {
  const t = await getTranslations("guide");
  return (
    <PageShell>
      <header className="flow-head guide-head">
        <h1>{t("purgedTitle")}</h1>
        <p>{t("purgedText", { days: commerce.finishedPortraitRetentionDays })}</p>
        <p>
          <Link href="/kit" className="btn btn-primary">
            {t("purgedCta")}
          </Link>
        </p>
      </header>
    </PageShell>
  );
}
