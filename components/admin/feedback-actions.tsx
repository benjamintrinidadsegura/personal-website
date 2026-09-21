"use client";

import { useActionState, useRef, useState } from "react";

import { manageFeedbackAction } from "@/app/admin/feedback/actions";
import type { AdminFeedback, FeedbackAdminActionResult } from "@/types/feedback";

const initialState: FeedbackAdminActionResult | null = null;

export function FeedbackAdminActions({ feedback }: { feedback: AdminFeedback }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const deleteTrigger = useRef<HTMLButtonElement>(null);
  const [state, formAction, pending] = useActionState(manageFeedbackAction, initialState);
  const [confirmation, setConfirmation] = useState("");

  const hiddenFields = (action: "mark_read" | "archive" | "delete", confirmationValue = "") => (
    <>
      <input type="hidden" name="feedbackId" value={feedback.id} />
      <input type="hidden" name="expectedStatus" value={feedback.status} />
      <input type="hidden" name="action" value={action} />
      <input type="hidden" name="confirmation" value={confirmationValue} />
    </>
  );

  return (
    <div className="mt-8 border-t border-white/10 pt-7">
      <div className="flex flex-wrap gap-3">
        {feedback.status === "new" ? (
          <form action={formAction}>
            {hiddenFields("mark_read")}
            <button disabled={pending} className="min-h-11 rounded-full border border-[#35d0e5]/50 px-5 font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#35d0e5] disabled:opacity-60">Mark read</button>
          </form>
        ) : null}
        {feedback.status !== "archived" ? (
          <form action={formAction}>
            {hiddenFields("archive")}
            <button disabled={pending} className="min-h-11 rounded-full border border-white/20 px-5 font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#35d0e5] disabled:opacity-60">Archive</button>
          </form>
        ) : null}
        <button
          ref={deleteTrigger}
          type="button"
          onClick={() => {
            setConfirmation("");
            dialog.current?.showModal();
          }}
          className="min-h-11 rounded-full border border-red-400/50 px-5 font-bold text-red-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red-300"
        >
          Delete permanently
        </button>
      </div>
      {state ? <p role="status" aria-live="polite" className={`mt-5 text-sm ${state.ok ? "text-emerald-300" : "text-[#ffb36f]"}`}>{state.message}</p> : null}

      <dialog
        ref={dialog}
        onClose={() => deleteTrigger.current?.focus()}
        aria-labelledby="feedback-delete-title"
        aria-describedby="feedback-delete-description"
        className="m-auto w-[min(92vw,34rem)] border border-white/20 bg-[#071826] p-0 text-white backdrop:bg-black/75"
      >
        <form action={formAction} className="p-6 sm:p-8">
          {hiddenFields("delete", confirmation)}
          <h2 id="feedback-delete-title" className="text-2xl font-black">Delete this feedback permanently?</h2>
          <p id="feedback-delete-description" className="mt-4 leading-7 text-slate-300">This removes the private message and cannot be undone. Archiving keeps it available privately.</p>
          <label htmlFor="feedback-delete-confirmation" className="mt-6 block font-bold">Type DELETE to confirm</label>
          <input
            id="feedback-delete-confirmation"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            pattern="DELETE"
            required
            autoComplete="off"
            className="mt-2 min-h-12 w-full rounded-lg border border-red-400/40 bg-[#04111b] px-3"
          />
          <div className="mt-7 flex flex-wrap gap-3">
            <button disabled={pending || confirmation !== "DELETE"} className="min-h-11 rounded-full bg-red-300 px-5 font-black text-[#260707] disabled:opacity-50">{pending ? "Deleting …" : "Delete permanently"}</button>
            <button type="button" onClick={() => dialog.current?.close()} className="min-h-11 rounded-full border border-white/20 px-5 font-bold">Cancel</button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
