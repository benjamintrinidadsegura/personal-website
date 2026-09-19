"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

import type { WritingShareDictionary } from "@/data/i18n/writing-share";
import type { WritingShareSource } from "@/types/writing";

const ShareComposer = dynamic(() => import("@/components/writing/share/share-composer").then((module) => module.ShareComposer), {
  ssr: false,
  loading: () => <span className="text-xs text-slate-500" role="status">…</span>,
});

export function ShareThoughtTrigger({ copy, featured = false, source }: { copy: WritingShareDictionary; featured?: boolean; source: WritingShareSource }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`writing-share-trigger ${featured ? "writing-share-trigger-featured" : ""}`}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.5M8.2 13.2l7.6 4.5"/></svg>
        <span>{copy.trigger}</span>
      </button>
      {open ? <ShareComposer copy={copy} onClose={() => setOpen(false)} source={source} /> : null}
    </>
  );
}
