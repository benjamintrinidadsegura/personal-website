"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";

import { moderateWritingCommentAction } from "@/app/admin/writing/comments/actions";
import {
  commentModerationReasonCodes,
  commentModerationStates,
  type CommentModerationReasonCode,
  type CommentModerationState,
  type WritingCommentForModeration,
} from "@/types/comment-moderation";

const stateLabels: Record<CommentModerationState, string> = {
  visible: "Visible",
  held: "Held",
  spam: "Spam",
  removed: "Removed",
};

const reasonLabels: Record<CommentModerationReasonCode, string> = {
  spam: "Spam",
  harassment: "Harassment",
  personal_data: "Personal data",
  off_topic: "Off-topic",
  other: "Other",
  correction: "Correction / moderation mistake",
};

const stateStyles: Record<CommentModerationState, string> = {
  visible: "border-emerald-300/40 text-emerald-300",
  held: "border-[#ffb36d]/50 bg-[#ffb36d]/[0.06] text-[#ffca96]",
  spam: "border-red-300/50 bg-red-300/[0.06] text-red-200",
  removed: "border-slate-400/40 text-slate-300",
};

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Berlin",
});

type Feedback = { tone: "success" | "error"; message: string } | null;

function defaultTarget(current: CommentModerationState): CommentModerationState {
  return current === "visible" ? "held" : "visible";
}

function transitionCopy(current: CommentModerationState, target: CommentModerationState): string {
  if (target === "visible") return `Restore this ${stateLabels[current].toLowerCase()} comment to the public Discussion?`;
  if (current === "visible") return `Hide this public comment as ${stateLabels[target]}? The content is retained for Studio moderation.`;
  return `Move this hidden comment from ${stateLabels[current]} to ${stateLabels[target]}?`;
}

function failureMessage(code: string): string {
  if (code === "STALE") return "This comment changed elsewhere. Current moderation data is being refreshed.";
  if (code === "UNAVAILABLE") return "This comment is no longer available for moderation.";
  if (code === "UNAUTHORIZED") return "Your moderation session is no longer authorized.";
  if (code === "NO_CHANGE") return "The comment is already in that moderation state.";
  return "The moderation change could not be completed. Please try again.";
}

function WritingCommentModerationCard({
  comment,
  onFeedback,
}: {
  comment: WritingCommentForModeration;
  onFeedback: (feedback: Feedback) => void;
}) {
  const router = useRouter();
  const initialTarget = defaultTarget(comment.moderationState);
  const [target, setTarget] = useState<CommentModerationState>(initialTarget);
  const [reason, setReason] = useState<CommentModerationReasonCode | "">(initialTarget === "visible" ? "correction" : "");
  const [confirmation, setConfirmation] = useState<{ target: CommentModerationState; reason: CommentModerationReasonCode } | null>(null);
  const [pending, startTransition] = useTransition();
  const reviewButtonRef = useRef<HTMLButtonElement | null>(null);
  const availableTargets = useMemo(() => commentModerationStates.filter((state) => state !== comment.moderationState), [comment.moderationState]);

  function changeTarget(next: CommentModerationState) {
    setTarget(next);
    setReason(next === "visible" ? "correction" : "");
    setConfirmation(null);
    onFeedback(null);
  }

  function cancelConfirmation() {
    setConfirmation(null);
    window.setTimeout(() => reviewButtonRef.current?.focus(), 0);
  }

  function reviewTransition(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reason || target === comment.moderationState) return;
    onFeedback(null);
    setConfirmation({ target, reason });
  }

  function confirmTransition() {
    if (!confirmation) return;
    const selected = confirmation;
    setConfirmation(null);
    onFeedback(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("commentId", comment.id);
      formData.set("expectedVersion", comment.version);
      formData.set("targetState", selected.target);
      formData.set("reasonCode", selected.reason);
      const result = await moderateWritingCommentAction(null, formData);
      if (result.ok) {
        onFeedback({ tone: "success", message: `Comment changed to ${stateLabels[result.newState]}.` });
        router.refresh();
      } else {
        onFeedback({ tone: "error", message: failureMessage(result.code) });
        if (result.code === "STALE" || result.code === "UNAVAILABLE") router.refresh();
      }
      window.setTimeout(() => reviewButtonRef.current?.focus(), 0);
    });
  }

  if (comment.isAuthorDeleted) {
    return (
      <article className="border border-white/10 bg-white/[0.015] p-5 sm:p-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-black text-slate-300">Deleted comment</h4>
            <span className="rounded-full border border-slate-500/40 px-2 py-1 font-mono text-[0.65rem] font-black uppercase tracking-[0.14em] text-slate-400">Author-deleted</span>
          </div>
          <time dateTime={comment.createdAt} className="font-mono text-xs text-slate-500">{dateFormatter.format(new Date(comment.createdAt))}</time>
        </header>
        <p className="mt-4 text-sm text-slate-500">Identity and content were removed by the owner. This structural tombstone cannot be moderated or restored.</p>
      </article>
    );
  }

  return (
    <article className="border border-white/15 bg-white/[0.02] p-5 sm:p-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="break-words font-black text-white">{comment.displayName}</h4>
            {comment.identity === "guest" ? <span className="rounded-full border border-white/20 px-2 py-1 font-mono text-[0.65rem] font-black tracking-[0.14em] text-slate-300">GUEST</span> : null}
            {comment.isAuthor ? <span className="rounded-full border border-[#35d0e5]/50 px-2 py-1 font-mono text-[0.65rem] font-black tracking-[0.14em] text-[#35d0e5]">AUTHOR</span> : null}
            {comment.editedAt ? <span className="font-mono text-[0.65rem] font-black tracking-[0.14em] text-slate-500">EDITED</span> : null}
          </div>
          <time dateTime={comment.createdAt} className="mt-2 block font-mono text-xs text-slate-500">{dateFormatter.format(new Date(comment.createdAt))}</time>
        </div>
        <span className={`rounded-full border px-3 py-1 font-mono text-xs font-black uppercase tracking-[0.14em] ${stateStyles[comment.moderationState]}`}>
          {stateLabels[comment.moderationState]}
        </span>
      </header>

      <p className="mt-5 whitespace-pre-wrap break-words leading-7 text-slate-200 [overflow-wrap:anywhere]">{comment.body}</p>
      {comment.latestReasonCode ? (
        <p className="mt-4 text-sm text-slate-400"><span className="font-bold text-slate-300">Latest reason:</span> {reasonLabels[comment.latestReasonCode]}</p>
      ) : null}

      <form onSubmit={reviewTransition} className="mt-6 grid gap-4 border-t border-white/10 pt-5 sm:grid-cols-2">
        <label className="block text-sm font-bold text-slate-200">
          Target state
          <select
            value={target}
            disabled={pending}
            onChange={(event) => changeTarget(event.target.value as CommentModerationState)}
            className="mt-2 min-h-12 w-full rounded-lg border border-white/15 bg-[#04111b] px-3 text-white outline-none focus-visible:border-[#35d0e5] focus-visible:ring-2 focus-visible:ring-[#35d0e5]/30"
          >
            {availableTargets.map((state) => <option key={state} value={state}>{stateLabels[state]}</option>)}
          </select>
        </label>
        <label className="block text-sm font-bold text-slate-200">
          Reason <span className="text-slate-400">(required)</span>
          <select
            value={reason}
            required
            disabled={pending}
            onChange={(event) => setReason(event.target.value as CommentModerationReasonCode | "")}
            className="mt-2 min-h-12 w-full rounded-lg border border-white/15 bg-[#04111b] px-3 text-white outline-none focus-visible:border-[#35d0e5] focus-visible:ring-2 focus-visible:ring-[#35d0e5]/30"
          >
            <option value="" disabled>Select a reason</option>
            {commentModerationReasonCodes.map((code) => <option key={code} value={code}>{reasonLabels[code]}</option>)}
          </select>
        </label>
        <div className="sm:col-span-2">
          <button ref={reviewButtonRef} type="submit" disabled={pending} className="min-h-11 rounded-full border border-[#35d0e5]/50 px-5 font-black text-[#35d0e5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35d0e5]/70 disabled:cursor-wait disabled:opacity-60">
            Review transition
          </button>
        </div>
      </form>

      {confirmation ? (
        <div role="group" aria-labelledby={`comment-confirmation-${comment.id}`} className="mt-5 border-l-2 border-[#ffb36d] bg-[#ffb36d]/[0.05] p-4">
          <p id={`comment-confirmation-${comment.id}`} className="font-bold text-white">Confirm moderation change</p>
          <p className="mt-2 text-sm leading-6 text-slate-300">{transitionCopy(comment.moderationState, confirmation.target)}</p>
          <p className="mt-2 text-sm text-slate-400">Reason: {reasonLabels[confirmation.reason]}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" disabled={pending} onClick={confirmTransition} className="min-h-11 rounded-full bg-[#35d0e5] px-5 font-black text-[#041018] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35d0e5]/70">Confirm change</button>
            <button type="button" disabled={pending} onClick={cancelConfirmation} className="min-h-11 rounded-full border border-white/20 px-5 font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35d0e5]/70">Cancel</button>
          </div>
        </div>
      ) : null}

      {pending ? <p role="status" aria-live="polite" className="mt-4 text-sm text-slate-300">Updating comment moderation…</p> : null}
    </article>
  );
}

export function WritingCommentModerationList({ comments }: { comments: WritingCommentForModeration[] }) {
  const [feedback, setFeedback] = useState<Feedback>(null);
  const feedbackRef = useRef<HTMLParagraphElement | null>(null);

  function announce(next: Feedback) {
    setFeedback(next);
    if (next) window.setTimeout(() => feedbackRef.current?.focus(), 0);
  }

  if (comments.length === 0) {
    return <p className="border-l-2 border-[#35d0e5] p-5 text-slate-300">No comments yet.</p>;
  }

  return (
    <>
      {feedback ? (
        <p ref={feedbackRef} tabIndex={-1} role={feedback.tone === "error" ? "alert" : "status"} aria-live="polite" className={`mb-4 border-l-2 p-4 text-sm outline-none ${feedback.tone === "error" ? "border-[#ffb36d] text-[#ffb36d]" : "border-emerald-300 text-emerald-300"}`}>
          {feedback.message}
        </p>
      ) : null}
      <ol className="grid gap-4">
        {comments.map((comment) => <li key={`${comment.id}:${comment.version}`}><WritingCommentModerationCard comment={comment} onFeedback={announce} /></li>)}
      </ol>
    </>
  );
}
