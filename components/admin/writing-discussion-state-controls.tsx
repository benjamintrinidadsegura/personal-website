"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

import { setWritingDiscussionStateAction } from "@/app/admin/writing/comments/actions";
import type { DiscussionState } from "@/types/comments";
import type { WritingDiscussionModerationContext } from "@/types/comment-moderation";

const stateDetails: Record<DiscussionState, { label: string; description: string }> = {
  open: {
    label: "Open",
    description: "Visible comments stay public. New comments and eligible owner controls are available.",
  },
  closed: {
    label: "Closed",
    description: "Visible comments stay public. New comments stop, while eligible owners retain controls.",
  },
  disabled: {
    label: "Disabled",
    description: "The public Discussion section disappears. Comments are retained and are not bulk-moderated.",
  },
};

type Feedback = { tone: "success" | "error"; message: string } | null;

function failureMessage(code: string): string {
  if (code === "STALE") return "Discussion changed elsewhere. Current moderation data is being refreshed.";
  if (code === "UNAUTHORIZED") return "Your moderation session is no longer authorized.";
  if (code === "NO_CHANGE") return "Discussion is already in that state.";
  if (code === "UNAVAILABLE") return "Discussion is no longer available for this article.";
  return "Discussion could not be updated. Please try again.";
}

function confirmationCopy(current: DiscussionState, target: DiscussionState): string {
  if (target === "disabled") {
    return "Disable Discussion? The entire public Discussion section will disappear, including existing visible comments. All comments are retained.";
  }
  if (target === "closed" && current === "disabled") {
    return "Set Discussion to Closed? Existing visible comments will return publicly, but new comments will remain unavailable.";
  }
  return "Close Discussion? Existing visible comments remain public, but new comments can no longer be submitted.";
}

export function WritingDiscussionStateControls({ context }: { context: WritingDiscussionModerationContext }) {
  const router = useRouter();
  const [confirmation, setConfirmation] = useState<DiscussionState | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [pending, startTransition] = useTransition();
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  function restoreFocus() {
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  }

  function requestState(target: DiscussionState, trigger: HTMLButtonElement) {
    triggerRef.current = trigger;
    setFeedback(null);
    if (target === "open") {
      submitState(target);
      return;
    }
    setConfirmation(target);
  }

  function cancelConfirmation() {
    setConfirmation(null);
    restoreFocus();
  }

  function submitState(target: DiscussionState) {
    setConfirmation(null);
    setFeedback(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("articleId", context.articleId);
      formData.set("expectedVersion", context.explicitVersion ?? "");
      formData.set("targetState", target);
      const result = await setWritingDiscussionStateAction(null, formData);
      if (result.ok) {
        setFeedback({ tone: "success", message: `Discussion is now ${stateDetails[result.newState].label}.` });
        router.refresh();
      } else {
        setFeedback({ tone: "error", message: failureMessage(result.code) });
        if (result.code === "STALE" || result.code === "UNAVAILABLE") router.refresh();
      }
      restoreFocus();
    });
  }

  return (
    <div className="border border-white/15 bg-white/[0.02] p-5 sm:p-6">
      <fieldset disabled={pending}>
        <legend className="text-lg font-black text-white">Discussion state</legend>
        <div className="mt-4 rounded-lg border border-[#35d0e5]/25 bg-[#35d0e5]/[0.04] p-4">
          <p className="font-mono text-xs font-black uppercase tracking-[0.18em] text-[#35d0e5]">
            Current: {stateDetails[context.state].label}
            {context.state === "open" && context.explicitVersion === null ? " · Default" : ""}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-300">{stateDetails[context.state].description}</p>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {(["open", "closed", "disabled"] as const).map((state) => (
            <button
              key={state}
              type="button"
              aria-pressed={context.state === state}
              disabled={pending || context.state === state}
              onClick={(event) => requestState(state, event.currentTarget)}
              className={`min-h-12 rounded-lg border px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35d0e5]/70 disabled:cursor-not-allowed ${
                context.state === state
                  ? "border-[#35d0e5]/60 bg-[#35d0e5]/10 text-white"
                  : state === "disabled"
                    ? "border-red-300/35 text-red-100 hover:border-red-300/70"
                    : "border-white/15 text-slate-200 hover:border-white/35"
              }`}
            >
              <span className="block font-black">{stateDetails[state].label}</span>
              <span className="mt-1 block text-xs leading-5 text-slate-400">
                {state === "open" ? "Public and accepting comments" : state === "closed" ? "Public, no new comments" : "Completely hidden publicly"}
              </span>
            </button>
          ))}
        </div>
      </fieldset>

      {confirmation ? (
        <div role="group" aria-labelledby="discussion-state-confirmation" className="mt-5 border-l-2 border-[#ffb36d] bg-[#ffb36d]/[0.05] p-4">
          <p id="discussion-state-confirmation" className="font-bold text-white">Confirm state change</p>
          <p className="mt-2 text-sm leading-6 text-slate-300">{confirmationCopy(context.state, confirmation)}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={pending}
              onClick={() => submitState(confirmation)}
              className={`min-h-11 rounded-full px-5 font-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35d0e5]/70 ${confirmation === "disabled" ? "bg-red-200 text-red-950" : "bg-[#35d0e5] text-[#041018]"}`}
            >
              Confirm {stateDetails[confirmation].label}
            </button>
            <button type="button" disabled={pending} onClick={cancelConfirmation} className="min-h-11 rounded-full border border-white/20 px-5 font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35d0e5]/70">
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {pending ? <p role="status" aria-live="polite" className="mt-4 text-sm text-slate-300">Updating Discussion…</p> : null}
      {feedback ? (
        <p role={feedback.tone === "error" ? "alert" : "status"} aria-live="polite" className={`mt-4 text-sm ${feedback.tone === "error" ? "text-[#ffb36d]" : "text-emerald-300"}`}>
          {feedback.message}
        </p>
      ) : null}
    </div>
  );
}
