"use client";

import { useState } from "react";

import { deleteWritingArticleAction } from "@/app/admin/writing/actions";

export function WritingDeleteControl({ articleId, expectedUpdatedAt, title }: { articleId: string; expectedUpdatedAt: string; title: string }) {
  const [submitting, setSubmitting] = useState(false);
  const displayTitle = title || "Untitled draft";

  return (
    <section aria-labelledby="writing-danger-title" className="mt-12 border border-red-300/20 bg-red-300/[0.025] p-5 sm:p-6">
      <p className="font-mono text-[0.65rem] font-black uppercase tracking-[0.18em] text-red-200/80">Danger zone</p>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-5">
        <div>
          <h2 id="writing-danger-title" className="font-black text-white">Delete this article</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">This permanently removes the draft or published article and its related Writing discussion records.</p>
        </div>
        <form
          action={deleteWritingArticleAction}
          onSubmit={(event) => {
            if (!window.confirm(`Permanently delete “${displayTitle}”? This cannot be undone.`)) {
              event.preventDefault();
              return;
            }
            setSubmitting(true);
          }}
        >
          <input type="hidden" name="articleId" value={articleId} />
          <input type="hidden" name="expectedUpdatedAt" value={expectedUpdatedAt} />
          <input type="hidden" name="expectedTitle" value={title} />
          <button type="submit" disabled={submitting} className="min-h-11 rounded-full border border-red-300/35 px-5 text-sm font-bold text-red-100 transition hover:border-red-200 hover:bg-red-200/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red-200 disabled:cursor-wait disabled:opacity-50">
            {submitting ? "Deleting…" : "Delete article"}
          </button>
        </form>
      </div>
    </section>
  );
}
