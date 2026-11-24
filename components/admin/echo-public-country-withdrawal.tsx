"use client";

import { useState, useTransition } from "react";
import { withdrawEchoPublicCountry } from "@/app/admin/echowall/actions";

const feedback = {
  removed: "The public country flag was removed.",
  absent: "There is no public country flag on this echo.",
  unavailable: "The flag could not be removed. Check your moderator session and try again.",
};

export function EchoPublicCountryWithdrawal({ echoId }: { echoId: string }) {
  const [status, setStatus] = useState<keyof typeof feedback | null>(null);
  const [pending, startTransition] = useTransition();
  const finished = status === "removed" || status === "absent";

  function confirm() {
    startTransition(async () => {
      try {
        setStatus((await withdrawEchoPublicCountry(echoId)).status);
      } catch {
        setStatus("unavailable");
      }
    });
  }

  return <details className="mt-4 border-t border-white/10 pt-3">
    <summary className="min-h-11 w-fit cursor-pointer py-3 text-sm font-bold text-slate-200">Remove public country flag</summary>
    <p className="text-sm text-slate-300">Confirm the withdrawal request for this echo. The message and the separate country statistics choice stay intact.</p>
    <form action={confirm}>
      <button type="submit" disabled={pending || finished} className="mt-3 min-h-11 rounded-full border border-white/20 px-4 font-bold text-white disabled:opacity-60">
        {pending ? "Removing…" : "Confirm flag removal"}
      </button>
    </form>
    <p className="mt-2 text-sm text-slate-200" role="status">{status ? feedback[status] : ""}</p>
  </details>;
}
