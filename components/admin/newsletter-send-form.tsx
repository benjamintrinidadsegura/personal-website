"use client";

import { useFormStatus } from "react-dom";
import { sendNewsletterEditionAction } from "@/app/admin/newsletter/actions";

function SendButton({ continuing }: { continuing: boolean }) {
  const { pending } = useFormStatus();
  return <button disabled={pending} className="min-h-12 rounded-full bg-[#ff9a3d] px-6 font-black text-[#041018] disabled:opacity-60">{pending ? "Delivering bounded batch…" : continuing ? "Continue safe delivery" : "Send this edition"}</button>;
}

export function NewsletterSendForm({ editionId, version, continuing }: { editionId: string; version: number; continuing: boolean }) {
  return <form action={sendNewsletterEditionAction} className="mt-6 border border-[#ff9a3d]/35 bg-[#ff9a3d]/[0.06] p-6"><input type="hidden" name="editionId" value={editionId} /><input type="hidden" name="expectedVersion" value={version} /><h2 className="text-xl font-black text-white">{continuing ? "Continue delivery" : "Confirm delivery"}</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">Only subscribers still confirmed at delivery time are eligible. Starting freezes this snapshot. Provider uncertainty stops delivery and requires reconciliation; it is never blindly retried.</p><label className="mt-5 flex items-start gap-3 text-sm text-white"><input type="checkbox" name="confirmation" value="SEND" required className="mt-1" />{continuing ? "I understand this processes the next bounded group without retrying completed recipients." : "I reviewed the snapshot and understand this sends email to every currently eligible confirmed subscriber."}</label><div className="mt-5"><SendButton continuing={continuing} /></div></form>;
}
