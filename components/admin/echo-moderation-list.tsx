"use client";

import { useRef, useState, useTransition } from "react";
import { loadModerationHistory, moderateEchoAction, revealPrivateContact } from "@/app/admin/echowall/actions";
import type { AdminEcho, EchoModerationEvent, ModerationAction } from "@/types/echowall";

const labels: Record<ModerationAction, string> = { approve: "Approve", reject: "Reject", hide: "Hide", restore: "Restore", delete: "Delete", restore_deleted: "Restore from archive" };
const actionsByStatus = { pending: ["approve", "reject", "delete"], approved: ["hide", "delete"], hidden: ["restore", "delete"], rejected: ["delete"], deleted: ["restore_deleted"] } satisfies Record<AdminEcho["status"], ModerationAction[]>;
const reasonRequired: ModerationAction[] = ["reject", "hide", "delete", "restore_deleted"];
const dateFormatter = new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" });

export function EchoModerationList({ echoes }: { echoes: AdminEcho[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const [selected, setSelected] = useState<{ echo: AdminEcho; action: ModerationAction } | null>(null);
  const [contact, setContact] = useState<string | null>(null);
  const [history, setHistory] = useState<EchoModerationEvent[] | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function open(echo: AdminEcho, action: ModerationAction, button: HTMLButtonElement) { trigger.current = button; setSelected({ echo, action }); setFeedback(null); dialog.current?.showModal(); }
  function close() { dialog.current?.close(); setSelected(null); setContact(null); setHistory(null); setFeedback(null); trigger.current?.focus(); }
  function submit(formData: FormData) { startTransition(async () => { const result = await moderateEchoAction(formData); if (result.ok) { close(); window.location.reload(); } else setFeedback(result.message); }); }

  if (!echoes.length) return <p className="border-l-2 border-[#35d0e5] p-7 text-slate-300">Keine Einträge in diesem Status.</p>;
  return <>
    <ol className="grid gap-5">
      {echoes.map((echo) => <li key={echo.id}><article className="border border-white/15 bg-white/[0.02] p-5 sm:p-7">
        <header className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-mono text-xs uppercase tracking-[0.18em] text-[#35d0e5]">{echo.status} · {echo.category ?? "uncategorized"}</p><h2 className="mt-3 text-xl font-black text-white">{echo.display_name}</h2></div><time className="font-mono text-xs text-slate-500" dateTime={echo.created_at}>{dateFormatter.format(new Date(echo.created_at))}</time></header>
        <p className="mt-5 whitespace-pre-wrap break-words leading-7 text-slate-200 [overflow-wrap:anywhere]">{echo.message}</p>
        {echo.status === "deleted" ? <dl className="mt-7 grid gap-4 border-t border-white/10 pt-5 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div><dt className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-slate-500">Submitted</dt><dd className="mt-1 text-slate-200">{dateFormatter.format(new Date(echo.created_at))}</dd></div>
          <div><dt className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-slate-500">Deleted</dt><dd className="mt-1 text-slate-200">{echo.deleted_at ? dateFormatter.format(new Date(echo.deleted_at)) : "Not available"}</dd></div>
          <div><dt className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-slate-500">Previous status</dt><dd className="mt-1 capitalize text-slate-200">{echo.deletion_previous_status ?? "Not available"}</dd></div>
          <div><dt className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-slate-500">Deleted by</dt><dd className="mt-1 text-slate-200">{echo.deleted_by_current_admin === true ? "Current admin" : echo.deleted_by_current_admin === false ? "Another admin" : "Not available"}</dd></div>
          <div className="sm:col-span-2 lg:col-span-4"><dt className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-slate-500">Deletion reason</dt><dd className="mt-1 whitespace-pre-wrap break-words text-slate-200">{echo.deletion_reason ?? "Not available"}</dd></div>
        </dl> : null}
        <div className="mt-7 flex flex-wrap gap-3">{actionsByStatus[echo.status].map((action) => <button key={action} type="button" onClick={(event) => open(echo, action, event.currentTarget)} className={`min-h-11 rounded-full border px-4 font-bold ${action === "delete" ? "border-red-400/50 text-red-200" : "border-white/20 text-white hover:border-[#35d0e5]"}`}>{labels[action]}</button>)}
          {echo.status !== "deleted" && echo.has_private_contact ? <button type="button" onClick={(event) => { trigger.current = event.currentTarget; startTransition(async () => { const result = await revealPrivateContact(echo.id); setContact(result.ok ? result.email : result.message); setHistory(null); setSelected({ echo, action: "approve" }); dialog.current?.showModal(); }); }} className="min-h-11 rounded-full border border-white/20 px-4 font-bold text-white">Show private contact</button> : null}
          <button type="button" onClick={(event) => { trigger.current = event.currentTarget; startTransition(async () => { const result = await loadModerationHistory(echo.id); setHistory(result.ok ? result.events : []); setContact(result.ok ? null : result.message); setSelected({ echo, action: "approve" }); dialog.current?.showModal(); }); }} className="min-h-11 rounded-full border border-white/20 px-4 font-bold text-white">Load history</button>
        </div>
      </article></li>)}
    </ol>
    <dialog ref={dialog} onClose={() => { setContact(null); setHistory(null); trigger.current?.focus(); }} className="m-auto w-[min(92vw,36rem)] border border-white/20 bg-[#071826] p-0 text-white backdrop:bg-black/75">
      <div className="p-6 sm:p-8">{contact !== null ? <><h2 className="text-2xl font-black">Private contact</h2><p className="mt-5 break-all text-slate-200">{contact}</p></> : history !== null ? <><h2 className="text-2xl font-black">Moderation history</h2>{history.length ? <ol className="mt-5 space-y-4">{history.map((event, index) => <li key={`${event.created_at}-${index}`} className="border-l border-[#35d0e5] pl-4"><p className="font-bold">{event.action}: {event.previous_status} → {event.new_status}</p>{event.reason ? <p className="mt-1 text-sm text-slate-300 [overflow-wrap:anywhere]">{event.reason}</p> : null}<time className="mt-1 block text-xs text-slate-500">{new Date(event.created_at).toLocaleString("de-DE")}</time></li>)}</ol> : <p className="mt-5 text-slate-400">Keine Historie vorhanden.</p>}</> : selected ? <form action={submit}><h2 className="text-2xl font-black">{selected.action === "restore_deleted" ? "Restore from archive" : `${labels[selected.action]} echo?`}</h2><p className="mt-4 text-slate-300">{selected.action === "restore_deleted" ? "Der Beitrag wird als Hidden wiederhergestellt und bleibt zunächst nicht öffentlich." : `Status: ${selected.echo.status}. Diese Aktion wird protokolliert.`}</p><input type="hidden" name="echoId" value={selected.echo.id} /><input type="hidden" name="action" value={selected.action} /><input type="hidden" name="expectedStatus" value={selected.echo.status} /><label htmlFor="reason" className="mt-6 block font-bold">Reason {reasonRequired.includes(selected.action) ? "(required)" : "(optional)"}</label><textarea id="reason" name="reason" minLength={reasonRequired.includes(selected.action) ? 5 : undefined} maxLength={500} required={reasonRequired.includes(selected.action)} className="mt-2 min-h-28 w-full rounded-lg border border-white/15 bg-[#04111b] p-3" />{selected.action === "delete" ? <><label htmlFor="confirmation" className="mt-5 block font-bold">Type DELETE to confirm</label><input id="confirmation" name="confirmation" pattern="DELETE" required className="mt-2 min-h-12 w-full rounded-lg border border-red-400/40 bg-[#04111b] px-3" /></> : null}{feedback ? <p role="status" aria-live="polite" className="mt-4 text-[#ffb16a]">{feedback}</p> : null}<div className="mt-7 flex flex-wrap gap-3"><button disabled={pending} className="min-h-11 rounded-full bg-[#35d0e5] px-5 font-black text-[#041018]">{pending ? "Processing…" : `Confirm ${labels[selected.action]}`}</button><button type="button" onClick={close} className="min-h-11 rounded-full border border-white/20 px-5 font-bold">Cancel</button></div></form> : null}
        {(contact !== null || history !== null) ? <button type="button" onClick={close} className="mt-7 min-h-11 rounded-full border border-white/20 px-5 font-bold">Close</button> : null}</div>
    </dialog>
  </>;
}
