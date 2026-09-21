"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

import { ShareIcon } from "@/components/sharing/share-icon";
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
        aria-label={copy.trigger}
        title={copy.trigger}
        onClick={() => setOpen(true)}
        className={`bts-share-action writing-share-trigger ${featured ? "writing-share-trigger-featured" : ""}`}
      >
        <ShareIcon />
        <span className="writing-share-trigger-label">{copy.trigger}</span>
      </button>
      {open ? <ShareComposer copy={copy} onClose={() => setOpen(false)} source={source} /> : null}
    </>
  );
}

export function ShareArticleTrigger({ copy, featured = false, source }: { copy: WritingShareDictionary; featured?: boolean; source: WritingShareSource }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label={copy.articleTrigger}
        title={copy.articleTrigger}
        onClick={() => setOpen(true)}
        className={`bts-share-action writing-share-trigger ${featured ? "writing-share-trigger-featured" : ""}`}
      >
        <ShareIcon />
        <span className="writing-share-trigger-label">{copy.articleTrigger}</span>
      </button>
      {open ? <ShareComposer copy={copy} onClose={() => setOpen(false)} source={source} /> : null}
    </>
  );
}
