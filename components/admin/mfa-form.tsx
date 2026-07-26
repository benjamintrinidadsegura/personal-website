"use client";

import { useActionState, useState } from "react";
import { enrollMfaAction, verifyMfaAction, type MfaActionState } from "@/app/admin/actions";

export function MfaForm({ existingFactorId }: { existingFactorId: string | null }) {
  const [enrollment, setEnrollment] = useState<MfaActionState>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [state, verify, pending] = useActionState<MfaActionState, FormData>(verifyMfaAction, null);
  const factorId = existingFactorId ?? enrollment?.factorId ?? null;
  async function enroll() { setEnrolling(true); setEnrollment(await enrollMfaAction()); setEnrolling(false); }
  return <div className="mt-10">
    {!factorId ? <button type="button" onClick={enroll} disabled={enrolling} className="min-h-12 rounded-full border border-[#35d0e5]/60 px-6 font-black text-white">{enrolling ? "Bereite vor…" : "Authenticator einrichten"}</button> : null}
    {enrollment?.qrCode ? <figure className="mt-7">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={enrollment.qrCode} alt="QR-Code zur Einrichtung der Zwei-Faktor-Authentifizierung" width={219} height={219} className="h-auto w-full max-w-[219px] bg-white p-3" />
      <figcaption className="mt-3 max-w-sm text-sm text-slate-400">Scanne den QR-Code ausschließlich mit deiner Authenticator-App.</figcaption>
    </figure> : null}
    {factorId ? <form action={verify} className="mt-8 space-y-5"><input type="hidden" name="factorId" value={factorId} /><div><label htmlFor="code" className="block text-sm font-bold text-white">Sechsstelliger Code</label><input id="code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" minLength={6} maxLength={6} required className="mt-2 min-h-12 w-full max-w-xs rounded-lg border border-white/15 bg-[#04111b] px-4 text-white" /></div>{state?.message ? <p role="alert" className="text-sm text-[#ffb16a]">{state.message}</p> : null}<button disabled={pending} className="min-h-12 rounded-full bg-[#35d0e5] px-7 font-black text-[#041018]">{pending ? "Bestätige…" : "Verify MFA"}</button></form> : null}
    {enrollment?.message && !enrollment.factorId ? <p role="alert" className="mt-5 text-sm text-[#ffb16a]">{enrollment.message}</p> : null}
  </div>;
}
