"use client";

import { useState, useTransition } from "react";
import { loadEchoFounderReply, saveEchoFounderReply } from "@/app/admin/echowall/actions";

export function EchoFounderEditor({ echoId, editable }: { echoId: string; editable: boolean }) {
  const [pending, start] = useTransition();
  const [loaded, setLoaded] = useState(false);
  const [existing, setExisting] = useState(false);
  const [body, setBody] = useState("");
  const [status, setStatus] = useState("");
  const id = `founder-reply-${echoId}`;
  function save(remove: boolean) {
    start(async () => {
      const result = await saveEchoFounderReply(echoId, remove ? null : body);
      setStatus(result.ok ? (remove ? "Founder reply removed." : "Founder reply saved.") : "The reply could not be changed.");
      if (result.ok) {
        setExisting(!remove);
        if (remove) setBody("");
      }
    });
  }
  return <div className="mt-4 border-t border-white/15 pt-3">
    {!loaded ? <button type="button" className="min-h-11 underline" disabled={pending} onClick={() => start(async () => {
      const result = await loadEchoFounderReply(echoId);
      if (result.ok) {
        setBody(result.reply ?? "");
        setExisting(!!result.reply);
        setLoaded(true);
        setStatus("");
      } else setStatus("The Founder reply could not be loaded.");
    })}>Manage Founder reply</button> : <>
      <label className="block font-bold" htmlFor={id}>BTSHQ Founder reply</label>
      <textarea id={id} rows={3} value={body} onChange={(event) => setBody(event.target.value)} readOnly={!editable}
        maxLength={500} className="my-2 w-full rounded-lg border border-white/25 bg-[#04111b] p-3" />
      <div className="flex flex-wrap gap-4">
        {editable && <button type="button" className="min-h-11 underline" disabled={pending || !body.trim()} onClick={() => save(false)}>Save reply</button>}
        {existing && <label className="flex flex-wrap items-center gap-2">
          <button type="button" className="min-h-11 text-rose-200 underline" disabled={pending} onClick={() => save(true)}>Remove reply</button>
        </label>}
      </div>
    </>}
    {status && <p role="status" className="text-sm text-slate-300">{status}</p>}
  </div>;
}
