"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useId, useRef, useState } from "react";

import { deleteOwnCommentAction, editOwnCommentAction } from "@/app/writing/comments/actions";
import { CommentBody } from "@/components/writing/comments/comment-body";
import type { WritingDictionary } from "@/data/i18n/writing";
import type {
  DeleteOwnCommentActionState,
  EditOwnCommentActionState,
} from "@/types/comments";

const editInitialState: EditOwnCommentActionState = null;
const deleteInitialState: DeleteOwnCommentActionState = null;

export function OwnedCommentControls({
  commentId,
  body,
  ownerVersion,
  canEdit,
  canDelete,
  copy,
}: {
  commentId: string;
  body: string;
  ownerVersion: string;
  canEdit: boolean;
  canDelete: boolean;
  copy: WritingDictionary["discussion"];
}) {
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [draft, setDraft] = useState(body);
  const [editState, editAction, editPending] = useActionState(editOwnCommentAction, editInitialState);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteOwnCommentAction, deleteInitialState);
  const editButton = useRef<HTMLButtonElement>(null);
  const deleteButton = useRef<HTMLButtonElement>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const confirmDeleteButton = useRef<HTMLButtonElement>(null);
  const feedback = useRef<HTMLDivElement>(null);
  const feedbackId = useId();
  const router = useRouter();

  useEffect(() => {
    if (editing) textarea.current?.focus();
  }, [editing]);

  useEffect(() => {
    if (confirmingDelete) confirmDeleteButton.current?.focus();
  }, [confirmingDelete]);

  useEffect(() => {
    if (!editState?.ok) return;
    document.getElementById("discussion-title")?.focus();
    router.refresh();
  }, [editState, router]);

  useEffect(() => {
    if (!deleteState?.ok) return;
    document.getElementById("discussion-title")?.focus();
    router.refresh();
  }, [deleteState, router]);

  useEffect(() => {
    if ((editState && !editState.ok) || (deleteState && !deleteState.ok)) {
      feedback.current?.focus();
    }
  }, [deleteState, editState]);

  const cancelEdit = () => {
    setDraft(body);
    setEditing(false);
    queueMicrotask(() => editButton.current?.focus());
  };
  const cancelDelete = () => {
    setConfirmingDelete(false);
    queueMicrotask(() => deleteButton.current?.focus());
  };

  const editError = editing && editState && !editState.ok ? copy.errors[editState.code] : "";
  const deleteError = confirmingDelete && deleteState && !deleteState.ok ? copy.errors[deleteState.code] : "";
  const bodyError = editing && editState && !editState.ok ? editState.fieldError : undefined;

  return <div>
    {editing ? <form action={editAction} noValidate className="space-y-4">
      <input type="hidden" name="commentId" value={commentId} />
      <input type="hidden" name="expectedVersion" value={ownerVersion} />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <label htmlFor={`edit-comment-${commentId}`} className="font-bold text-white">{copy.editTitle}</label>
        <span id={`edit-comment-count-${commentId}`} className="font-mono text-xs text-slate-500">{Array.from(draft).length} / 3000</span>
      </div>
      <textarea
        ref={textarea}
        id={`edit-comment-${commentId}`}
        name="body"
        required
        minLength={2}
        maxLength={3000}
        rows={7}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape" && !editPending) {
            event.preventDefault();
            cancelEdit();
          }
        }}
        aria-describedby={`edit-comment-count-${commentId} ${feedbackId}`}
        aria-invalid={bodyError ? true : undefined}
        className="w-full resize-y border border-white/15 bg-[#07192b] px-4 py-3 leading-7 text-white outline-none focus-visible:border-[#35d0e5]"
      />
      <p className="text-sm leading-6 text-slate-400">{copy.plainTextHelp}</p>
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={editPending} className="min-h-11 rounded-full bg-[#35d0e5] px-5 py-2 font-black text-[#041018] disabled:cursor-wait disabled:opacity-60">{editPending ? copy.saving : copy.save}</button>
        <button type="button" disabled={editPending} onClick={cancelEdit} className="min-h-11 rounded-full border border-white/15 px-5 py-2 font-bold text-slate-200 disabled:opacity-60">{copy.cancel}</button>
      </div>
    </form> : <CommentBody body={body} />}

    {!editing ? <div className="mt-4 flex flex-wrap gap-2 border-t border-white/10 pt-4">
        {canEdit ? <button ref={editButton} type="button" onClick={() => { setDraft(body); setConfirmingDelete(false); setEditing(true); }} className="min-h-11 rounded-full px-4 py-2 text-sm font-bold text-slate-300 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#35d0e5]">{copy.edit}</button> : null}
        {canDelete ? <button ref={deleteButton} type="button" onClick={() => { setEditing(false); setConfirmingDelete(true); }} className="min-h-11 rounded-full px-4 py-2 text-sm font-bold text-slate-300 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ff9a3d]">{copy.delete}</button> : null}
    </div> : null}

    {confirmingDelete ? <form action={deleteAction} className="mt-4 border-l-2 border-[#ff9a3d] p-4">
      <input type="hidden" name="commentId" value={commentId} />
      <input type="hidden" name="expectedVersion" value={ownerVersion} />
      <p className="font-bold text-white">{copy.deleteTitle}</p>
      <p className="mt-2 text-sm leading-6 text-slate-400">{copy.deleteBody}</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button ref={confirmDeleteButton} type="submit" disabled={deletePending} className="min-h-11 rounded-full bg-[#ff9a3d] px-5 py-2 font-black text-[#041018] disabled:cursor-wait disabled:opacity-60">{deletePending ? copy.deleting : copy.delete}</button>
        <button type="button" disabled={deletePending} onClick={cancelDelete} className="min-h-11 rounded-full border border-white/15 px-5 py-2 font-bold text-slate-200 disabled:opacity-60">{copy.cancel}</button>
      </div>
    </form> : null}

    <div ref={feedback} id={feedbackId} role="status" aria-live="polite" tabIndex={-1} className={(editError || deleteError) ? "mt-4 text-sm text-[#ffad63] outline-none" : "sr-only"}>
      {editError || deleteError || (editState?.ok ? copy.updated : deleteState?.ok ? copy.deletedStatus : "")}
    </div>
  </div>;
}
