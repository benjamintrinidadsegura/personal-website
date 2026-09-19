/* eslint-disable @next/next/no-assign-module-variable */
import Link from "next/link";

import { joinRelationshipInviteAction } from "@/app/life-alignment/actions";
import { relationshipSessionUi } from "@/data/i18n/life-alignment-relationship-session-ui";
import { getRelationshipModule, relationshipText } from "@/data/life-alignment-relationship";
import { relationshipUi } from "@/data/i18n/life-alignment-relationship-ui";
import { getLocale } from "@/lib/i18n/server";
import { getRelationshipInviteLanding } from "@/lib/life-alignment-relationship-server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Private Life Alignment invitation | bts.online", robots: { index: false, follow: false } };

export default async function RelationshipInvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const locale = await getLocale();
  const invite = await getRelationshipInviteLanding(token);
  const copy = relationshipSessionUi(locale);
  if (!invite || invite.status !== "valid") return <PrivateState title={invite?.status === "expired" ? copy.expired : invite?.status === "revoked" ? copy.revoked : copy.unavailable} label={copy.privateLabel} body={copy.privateStateBody}/>;
  const module = getRelationshipModule(invite.moduleId);
  return <article className="section-lines min-h-screen px-5 pb-24 pt-28 sm:px-8 sm:pt-36"><div className="mx-auto max-w-3xl"><header className="rounded-[2rem] border border-[#74d8c8]/35 bg-[#061824] p-7 sm:p-12"><p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[#74d8c8]">{relationshipUi(locale,"privateInvite")} · {relationshipUi(locale,"validSevenDays")}</p><h1 className="mt-6 text-4xl font-black text-white sm:text-6xl">{relationshipText(module.title,locale)}</h1><p className="mt-5 text-lg leading-8 text-slate-300">{copy.invitedBy(invite.inviterDisplayName)}</p><ul className="mt-7 grid gap-3 text-sm leading-6 text-slate-300"><li>• {relationshipUi(locale,"answersPrivate")}</li><li>• {relationshipUi(locale,"sharedAfterBoth")}</li><li>• {copy.storedPrivate}</li><li>• {copy.stopAnytime}</li></ul></header><form action={joinRelationshipInviteAction} className="mt-8 rounded-[2rem] border border-white/10 p-7 sm:p-10"><input type="hidden" name="token" value={token}/><label className="block"><span className="font-black text-white">{copy.displayName}</span><span className="mt-1 block text-sm text-slate-400">{copy.displayNameHelp}</span><input name="displayName" minLength={2} maxLength={40} required autoComplete="nickname" className="mt-3 min-h-12 w-full rounded-xl border border-white/15 bg-[#03101a] px-4 text-white outline-none focus:border-[#74d8c8]"/></label><label className="mt-7 flex cursor-pointer items-start gap-4"><input type="checkbox" name="consent" value="yes" required className="mt-1 size-5 accent-[#74d8c8]"/><span className="leading-7 text-slate-200"><strong className="text-white">{copy.consentLead}</strong> {copy.consentBody}</span></label><div className="mt-8 flex flex-wrap gap-3"><button type="submit" className="min-h-12 rounded-full bg-[#74d8c8] px-6 font-black text-[#04151d]">{copy.accept}</button><Link href="/life-alignment" className="inline-flex min-h-12 items-center rounded-full border border-white/20 px-6 font-bold text-white">{copy.decline}</Link></div></form></div></article>;
}

function PrivateState({ title, label, body }: { title: string; label: string; body: string }) { return <article className="section-lines min-h-screen px-5 pb-24 pt-36"><div className="mx-auto max-w-2xl rounded-[2rem] border border-white/10 bg-[#061824] p-8"><p className="font-mono text-xs font-black uppercase tracking-[0.18em] text-slate-500">{label}</p><h1 className="mt-5 text-4xl font-black text-white">{title}</h1><p className="mt-5 leading-7 text-slate-400">{body}</p></div></article>; }
