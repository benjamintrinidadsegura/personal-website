import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { WritingDiscussionAdmin, WritingDiscussionAdminFallback } from "@/components/admin/writing-discussion-admin";
import { WritingDeleteControl } from "@/components/admin/writing-delete-control";
import { WritingForm } from "@/components/admin/writing-form";
import { WritingTranslationsPanel } from "@/components/admin/writing-translations-panel";
import { requireAdminPage } from "@/lib/admin/authorization";
import { writingTranslationProviderConfiguration } from "@/lib/writing/openai-translation-provider";
import { mapAdminWritingArticle } from "@/lib/writing/domain";
import { mapWritingTranslationSummary } from "@/lib/writing/translations";

export const metadata = { title: "Edit Writing | BTS Studio", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminWritingDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ deleteError?: string; translationError?: string; translationImported?: string; translationGenerated?: string; translationGenerationError?: string }> }) {
  const { supabase } = await requireAdminPage(true);
  const id = (await params).id;
  if (!/^[0-9a-f-]{36}$/iu.test(id)) notFound();
  const { data, error } = await supabase.rpc("get_writing_article_for_admin", { p_id: id });
  const article = !error && Array.isArray(data) && data[0] ? mapAdminWritingArticle(data[0]) : null;
  if (!article) notFound();
  const translationResult = await supabase.rpc("list_writing_translation_statuses", { p_id: id });
  const translations = !translationResult.error && Array.isArray(translationResult.data)
    ? translationResult.data.map((row) => mapWritingTranslationSummary(row)).filter((row) => row !== null)
    : null;
  const feedback = await searchParams;

  return (
    <div className="min-h-svh px-4 py-8 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-[90rem]">
        <nav aria-label="Breadcrumb" className="font-mono text-xs text-slate-400"><Link href="/admin" className="inline-flex min-h-11 items-center hover:text-white">BTS Studio</Link> / <Link href="/admin/writing" className="inline-flex min-h-11 items-center hover:text-white">Writing</Link> / <span aria-current="page" className="text-[#35d0e5]">{article.title || "Draft"}</span></nav>
        <header className="mt-2 flex flex-wrap items-end justify-between gap-2 border-b border-white/10 pb-4">
          <div className="min-w-0"><p className="font-mono text-xs uppercase tracking-[0.2em] text-[#35d0e5]">Writing Studio</p><h1 className="mt-2 break-words text-2xl font-black text-white sm:text-3xl">{article.title || "New Writing draft"}</h1></div>
          {article.slug ? <Link href={`/writing/${article.slug}`} className="inline-flex min-h-11 items-center text-sm font-bold text-[#35d0e5] hover:text-white">Open public article</Link> : null}
        </header>
        {feedback.deleteError ? <p role="alert" className="mt-6 border-l-2 border-[#ffb36d] p-4 text-[#ffcfaa]">Deletion failed ({feedback.deleteError}). No article was removed.</p> : null}
        <WritingForm article={article} />
        <WritingTranslationsPanel articleId={article.id} feedback={{ imported: feedback.translationImported, error: feedback.translationError, generated: feedback.translationGenerated, generationError: feedback.translationGenerationError }} providerConfigured={writingTranslationProviderConfiguration().configured} slug={article.slug} sourceLocale={article.sourceLocale} sourceRevision={article.sourceRevision} statuses={translations} />
        <Suspense fallback={<WritingDiscussionAdminFallback />}>
          <WritingDiscussionAdmin articleId={article.id} published={article.status === "published"} />
        </Suspense>
        <WritingDeleteControl articleId={article.id} expectedUpdatedAt={article.updatedAt} title={article.title} />
      </div>
    </div>
  );
}
