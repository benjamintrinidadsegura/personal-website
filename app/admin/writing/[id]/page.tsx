import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { WritingDiscussionAdmin, WritingDiscussionAdminFallback } from "@/components/admin/writing-discussion-admin";
import { WritingForm } from "@/components/admin/writing-form";
import { requireAdminPage } from "@/lib/admin/authorization";
import { mapAdminWritingArticle } from "@/lib/writing/domain";

export const metadata = { title: "Edit Writing | BTS Studio", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminWritingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { supabase } = await requireAdminPage(true);
  const id = (await params).id;
  if (!/^[0-9a-f-]{36}$/iu.test(id)) notFound();
  const { data, error } = await supabase.rpc("get_writing_article_for_admin", { p_id: id });
  const article = !error && Array.isArray(data) && data[0] ? mapAdminWritingArticle(data[0]) : null;
  if (!article) notFound();

  return (
    <div className="min-h-svh px-4 py-8 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-[90rem]">
        <nav aria-label="Breadcrumb" className="font-mono text-xs text-slate-400"><Link href="/admin" className="inline-flex min-h-11 items-center hover:text-white">BTS Studio</Link> / <Link href="/admin/writing" className="inline-flex min-h-11 items-center hover:text-white">Writing</Link> / <span aria-current="page" className="text-[#35d0e5]">{article.title || "Draft"}</span></nav>
        <header className="mt-2 flex flex-wrap items-end justify-between gap-2 border-b border-white/10 pb-4">
          <div className="min-w-0"><p className="font-mono text-xs uppercase tracking-[0.2em] text-[#35d0e5]">Writing Studio</p><h1 className="mt-2 break-words text-2xl font-black text-white sm:text-3xl">{article.title || "New Writing draft"}</h1></div>
          {article.slug ? <Link href={`/writing/${article.slug}`} className="inline-flex min-h-11 items-center text-sm font-bold text-[#35d0e5] hover:text-white">Open public article</Link> : null}
        </header>
        <WritingForm article={article} />
        <Suspense fallback={<WritingDiscussionAdminFallback />}>
          <WritingDiscussionAdmin articleId={article.id} published={article.status === "published"} />
        </Suspense>
      </div>
    </div>
  );
}
