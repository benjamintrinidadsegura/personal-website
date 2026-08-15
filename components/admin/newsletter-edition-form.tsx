"use client";

import { useActionState } from "react";

import { createNewsletterEditionAction } from "@/app/admin/newsletter/actions";

type Candidate = { id: string; title: string; excerpt: string; publishedAt: string };

export function NewsletterEditionForm({ candidates }: { candidates: Candidate[] }) {
  const [state, action, pending] = useActionState(createNewsletterEditionAction, null);
  return (
    <form action={action} className="mt-6 grid gap-5" noValidate>
      <label className="grid gap-2 text-sm font-bold text-slate-200">Published Writing
        <select name="writingArticleId" required className="min-h-12 border border-white/20 bg-[#071821] px-4 text-white"><option value="">Choose an article</option>{candidates.map((article) => <option key={article.id} value={article.id}>{article.title}</option>)}</select>
        {state?.fieldErrors?.article ? <span className="text-[#ffb36d]">{state.fieldErrors.article}</span> : null}
      </label>
      <label className="grid gap-2 text-sm font-bold text-slate-200">Subject <span className="font-normal text-slate-500">3–120 characters</span>
        <input name="subject" minLength={3} maxLength={120} required className="min-h-12 border border-white/20 bg-[#071821] px-4 text-white" />
        {state?.fieldErrors?.subject ? <span className="text-[#ffb36d]">{state.fieldErrors.subject}</span> : null}
      </label>
      <label className="grid gap-2 text-sm font-bold text-slate-200">Preheader <span className="font-normal text-slate-500">Optional · max 160 characters</span>
        <input name="preheader" maxLength={160} className="min-h-12 border border-white/20 bg-[#071821] px-4 text-white" />
        {state?.fieldErrors?.preheader ? <span className="text-[#ffb36d]">{state.fieldErrors.preheader}</span> : null}
      </label>
      <label className="grid gap-2 text-sm font-bold text-slate-200">Short introduction <span className="font-normal text-slate-500">Optional plain text · max 600 characters</span>
        <textarea name="introduction" maxLength={600} rows={4} className="border border-white/20 bg-[#071821] p-4 text-white" />
        {state?.fieldErrors?.introduction ? <span className="text-[#ffb36d]">{state.fieldErrors.introduction}</span> : null}
      </label>
      {state && !state.ok ? <p role="alert" className="border-l-2 border-[#ff9a3d] pl-4 text-sm text-[#ffcfaa]">{state.message}</p> : null}
      <p className="text-sm leading-6 text-slate-500">The article title, excerpt and canonical link are snapshotted now. The email layout is fixed and contains no arbitrary HTML.</p>
      <button disabled={pending} className="min-h-12 justify-self-start rounded-full bg-[#35d0e5] px-6 font-black text-[#041018] disabled:opacity-60">{pending ? "Creating…" : "Create edition"}</button>
    </form>
  );
}
