/* eslint-disable @next/next/no-assign-module-variable */
import Link from "next/link";
import { redirect } from "next/navigation";

import { getRelationshipModule, relationshipText } from "@/data/life-alignment-relationship";
import { relationshipSessionUi } from "@/data/i18n/life-alignment-relationship-session-ui";
import { getAuthenticatedAlignmentUserId } from "@/lib/life-alignment-relationship-server";
import { listRelationshipSessions } from "@/lib/life-alignment-relationship-dashboard";
import type { Locale } from "@/lib/i18n/config";
import { localizeHref } from "@/lib/i18n/routing";
import { getLocale } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Private Alignment sessions | bts.online", robots: { index: false, follow: false } };

const copy: Record<Locale, { title: string; intro: string; empty: string; unavailable: string; open: string; invite: string; counterpart: string; result: string; back: string }> = {
  de: { title: "Deine privaten Sessions", intro: "Nur grobe Statusangaben – keine Antworten der anderen Person.", empty: "Noch keine Invite Session.", unavailable: "Sessions sind gerade nicht verfügbar.", open: "Session öffnen", invite: "Einladung", counterpart: "Andere Person", result: "Gemeinsames Ergebnis", back: "Zurück zu Life Alignment" },
  en: { title: "Your private sessions", intro: "Coarse status only — never the other person’s answers.", empty: "No Invite Session yet.", unavailable: "Sessions are not available right now.", open: "Open session", invite: "Invite", counterpart: "Other person", result: "Shared result", back: "Back to Life Alignment" },
  es: { title: "Tus sesiones privadas", intro: "Solo estados generales; nunca las respuestas de la otra persona.", empty: "Todavía no hay sesiones de invitación.", unavailable: "Las sesiones no están disponibles ahora.", open: "Abrir sesión", invite: "Invitación", counterpart: "Otra persona", result: "Resultado compartido", back: "Volver a Life Alignment" },
  tr: { title: "Özel oturumların", intro: "Yalnızca genel durum; diğer kişinin yanıtları asla gösterilmez.", empty: "Henüz davet oturumu yok.", unavailable: "Oturumlara şu anda erişilemiyor.", open: "Oturumu aç", invite: "Davet", counterpart: "Diğer kişi", result: "Ortak sonuç", back: "Life Alignment'a dön" },
  pl: { title: "Twoje prywatne sesje", intro: "Tylko ogólny status — nigdy odpowiedzi drugiej osoby.", empty: "Nie ma jeszcze sesji z zaproszeniem.", unavailable: "Sesje są teraz niedostępne.", open: "Otwórz sesję", invite: "Zaproszenie", counterpart: "Druga osoba", result: "Wspólny wynik", back: "Wróć do Life Alignment" },
  el: { title: "Οι ιδιωτικές συνεδρίες σου", intro: "Μόνο γενική κατάσταση — ποτέ οι απαντήσεις του άλλου ατόμου.", empty: "Δεν υπάρχει ακόμη συνεδρία πρόσκλησης.", unavailable: "Οι συνεδρίες δεν είναι διαθέσιμες τώρα.", open: "Άνοιγμα συνεδρίας", invite: "Πρόσκληση", counterpart: "Άλλο άτομο", result: "Κοινό αποτέλεσμα", back: "Πίσω στο Life Alignment" },
  ru: { title: "Ваши приватные сессии", intro: "Только общий статус — ответы другого человека никогда не показываются.", empty: "Сессий по приглашению пока нет.", unavailable: "Сессии сейчас недоступны.", open: "Открыть сессию", invite: "Приглашение", counterpart: "Другой участник", result: "Общий результат", back: "Назад к Life Alignment" },
};

export default async function RelationshipSessionsPage() {
  const locale = await getLocale();
  if (!await getAuthenticatedAlignmentUserId()) redirect(localizeHref("/account/login", locale));
  const sessions = await listRelationshipSessions();
  const text = copy[locale];
  const status = relationshipSessionUi(locale).status;
  return <main className="section-lines min-h-screen px-5 pb-24 pt-28 text-white sm:px-8 sm:pt-36"><div className="mx-auto max-w-5xl"><Link href={localizeHref("/life-alignment", locale)} className="font-mono text-xs font-black uppercase tracking-[0.16em] text-[#74d8c8]">← {text.back}</Link><header className="border-b border-white/15 py-14"><p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[#74d8c8]">Life Alignment · Private</p><h1 className="mt-5 text-5xl font-black tracking-[-0.04em] sm:text-7xl">{text.title}</h1><p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">{text.intro}</p></header>{sessions === null ? <p role="alert" className="py-14 text-[#ffd5a1]">{text.unavailable}</p> : sessions.length === 0 ? <p className="py-14 text-slate-300">{text.empty}</p> : <ul className="grid gap-5 py-12">{sessions.map((session) => { const module = getRelationshipModule(session.moduleId); return <li key={session.sessionId} className="rounded-[1.5rem] border border-white/15 bg-white/[0.03] p-6 sm:p-8"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-mono text-xs font-black uppercase tracking-[0.15em] text-[#74d8c8]">{relationshipText(module.title, locale)}</p><dl className="mt-4 grid gap-2 text-sm text-slate-300 sm:grid-cols-3"><div><dt className="text-slate-500">{text.invite}</dt><dd>{status[session.inviteStatus]}</dd></div><div><dt className="text-slate-500">{text.counterpart}</dt><dd>{status[session.counterpartStatus]}</dd></div><div><dt className="text-slate-500">{text.result}</dt><dd>{session.sharedResultAvailable ? "✓" : "—"}</dd></div></dl></div><Link href={localizeHref(`/life-alignment/session/${session.sessionId}`, locale)} className="inline-flex min-h-11 items-center rounded-full border border-[#74d8c8]/50 px-5 font-black text-[#74d8c8]">{text.open}</Link></div></li>; })}</ul>}</div></main>;
}
