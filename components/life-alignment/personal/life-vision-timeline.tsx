"use client";

import { useEffect, useMemo, useState } from "react";

import { useLocale } from "@/components/i18n/locale-context";
import { QuoteExperience } from "@/components/quotes/quote-experience";
import { appendLifeVisionRound, compareLifeVisionRounds, stableLifeVisionAreas, type LifeVisionRoundSnapshot } from "@/lib/life-alignment-longitudinal";
import type { LifeVisionResult } from "@/types/life-alignment-life-vision";

const KEY = "bts.life-alignment.life-vision-history.v1";
function safeHistory(): LifeVisionRoundSnapshot[] {
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(value) ? value.filter((item): item is LifeVisionRoundSnapshot => Boolean(item && typeof item === "object" && Number.isInteger((item as LifeVisionRoundSnapshot).roundNumber) && Array.isArray((item as LifeVisionRoundSnapshot).areas))).slice(-20) : [];
  } catch { return []; }
}

export function LifeVisionTimeline({ result }: { result: LifeVisionResult }) {
  const locale = useLocale();
  const [history, setHistory] = useState<LifeVisionRoundSnapshot[]>([]);
  const signature = useMemo(() => JSON.stringify(result.areas.map(({ id, emphasis, protected: isProtected }) => ({ id, emphasis, protected: isProtected })).sort((a, b) => a.id.localeCompare(b.id))), [result]);
  useEffect(() => {
    const current = safeHistory();
    const next = appendLifeVisionRound(current, result);
    window.localStorage.setItem(KEY, JSON.stringify(next));
    const update = window.setTimeout(() => setHistory(next), 0);
    return () => window.clearTimeout(update);
  }, [result.areas, signature]);
  const copy = {
    de: ["Alignment Timeline", "Private, abgeleitete Richtungssignale in diesem Browser. Keine Rohantworten, keine öffentliche Freigabe.", "Eine Momentaufnahme. Veränderungen werden ab Runde 2 beschrieben.", "Richtungen verändert", "über drei Runden stabil"],
    en: ["Alignment Timeline", "Private derived direction signals in this browser. No raw answers and no public sharing.", "One snapshot. Change is described from round 2 onward.", "directions changed", "stable across three rounds"],
    es: ["Cronología de Alignment", "Señales privadas derivadas en este navegador. Sin respuestas originales ni publicación.", "Una instantánea. El cambio se describe desde la ronda 2.", "direcciones cambiadas", "estable durante tres rondas"],
    tr: ["Alignment Zaman Çizelgesi", "Bu tarayıcıda özel, türetilmiş yön sinyalleri. Ham yanıt veya herkese açık paylaşım yok.", "Bir anlık görünüm. Değişim 2. turdan itibaren açıklanır.", "değişen yön", "üç tur boyunca sabit"],
    pl: ["Oś czasu Alignment", "Prywatne, wyprowadzone sygnały kierunku w tej przeglądarce. Bez surowych odpowiedzi i publikacji.", "Jeden obraz chwili. Zmiany opisujemy od rundy 2.", "zmienione kierunki", "stabilne przez trzy rundy"],
    el: ["Χρονογραμμή Alignment", "Ιδιωτικά παραγόμενα σήματα κατεύθυνσης σε αυτό το πρόγραμμα περιήγησης. Χωρίς αρχικές απαντήσεις ή δημόσια κοινοποίηση.", "Ένα στιγμιότυπο. Η αλλαγή περιγράφεται από τον γύρο 2.", "κατευθύνσεις άλλαξαν", "σταθερό σε τρεις γύρους"],
    ru: ["Хронология Alignment", "Приватные производные сигналы направления в этом браузере. Без исходных ответов и публикации.", "Один снимок. Изменения описываются со второго раунда.", "направления изменились", "стабильно три раунда"],
  }[locale];
  const latest = history.at(-1); const previous = history.at(-2);
  const changed = latest && previous ? compareLifeVisionRounds(previous, latest) : [];
  const stableThree = stableLifeVisionAreas(history);
  return <section className="border-t border-white/15 py-16"><h2 className="text-4xl font-black text-white">{copy[0]}</h2><p className="mt-4 max-w-3xl leading-7 text-slate-400">{copy[1]}</p><ol className="mt-8 grid gap-4">{history.map((round) => <li key={round.roundNumber} className="rounded-2xl border border-white/10 p-5"><strong className="text-white">Round {round.roundNumber}</strong><span className="ml-3 text-sm text-slate-400">{new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(round.completedAt))}</span>{round.roundNumber === latest?.roundNumber && changed.length ? <p className="mt-2 text-sm text-[#9dd9c5]">{changed.length} {copy[3]}</p> : null}</li>)}</ol>{history.length < 2 ? <p className="mt-5 text-slate-400">{copy[2]}</p> : null}{stableThree.length ? <p className="mt-5 text-sm text-[#9dd9c5]">{stableThree.length} {copy[4]}</p> : null}<div className="mt-10"><QuoteExperience context={{ surface: "life-alignment", themes: ["meaning", "clarity"], lifeAlignment: { moduleId: "life-vision" } }} safeSharePath="/life-alignment/life-vision" /></div></section>;
}
