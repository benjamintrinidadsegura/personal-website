import Link from "next/link";

import { retryWritingNewsletterPreparationAction } from "@/app/admin/writing/actions";
import { writingNewsletterCopy } from "@/data/i18n/writing-newsletter";
import type { Locale } from "@/lib/i18n/config";
import type { WritingNewsletterPreparationStatus } from "@/types/newsletter";

function statusMessage(status: WritingNewsletterPreparationStatus, locale: Locale): string {
  const copy = writingNewsletterCopy[locale];
  if (status === "created") return copy.prepared;
  if (status === "reused_draft") return copy.reused;
  if (status === "existing_sending") return copy.sending;
  if (status === "existing_sent") return copy.sent;
  if (status === "existing_failed") return copy.failedEdition;
  return copy.preparationFailed;
}

export function WritingNewsletterStatus({
  articleId,
  articleSlug,
  editionId,
  locale,
  status,
}: {
  articleId: string;
  articleSlug: string;
  editionId?: string;
  locale: Locale;
  status: WritingNewsletterPreparationStatus;
}) {
  const copy = writingNewsletterCopy[locale];
  const failed = status === "failed";
  return (
    <aside role={failed ? "alert" : "status"} className={`mt-8 flex flex-wrap items-center justify-between gap-4 border-l-2 p-4 ${failed ? "border-[#ff9a3d] bg-[#ff9a3d]/[0.035] text-[#ffcfaa]" : "border-[#35d0e5] bg-[#35d0e5]/[0.035] text-slate-200"}`}>
      <p className="font-bold">{statusMessage(status, locale)}</p>
      {editionId ? <Link href={`/admin/newsletter/${editionId}`} className="inline-flex min-h-11 items-center font-black text-[#35d0e5] underline">{copy.open}</Link> : null}
      {failed ? (
        <form action={retryWritingNewsletterPreparationAction}>
          <input type="hidden" name="articleId" value={articleId} />
          <input type="hidden" name="expectedSlug" value={articleSlug} />
          <input type="hidden" name="locale" value={locale} />
          <button className="min-h-11 rounded-full border border-[#ff9a3d]/50 px-4 text-sm font-black text-white hover:border-[#ff9a3d]">{copy.retry}</button>
        </form>
      ) : null}
    </aside>
  );
}
