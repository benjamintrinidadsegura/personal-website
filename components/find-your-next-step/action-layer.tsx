"use client";

import { useMemo, useState } from "react";
import type { CSSProperties } from "react";

import { useLocale } from "@/components/i18n/locale-context";
import { fynsActionUi } from "@/data/fyns-action-locales";
import { selectFynsActionSet } from "@/lib/fyns-actions";
import type { FynsActionContext, FynsActionState, SelectedFynsAction } from "@/types/fyns-action";

type ActionLayerContext = Omit<FynsActionContext, "locale" | "excludeIds" | "excludeFamilies">;

export function FynsActionLayer({ context, accent }: { context: ActionLayerContext; accent: string }) {
  const locale = useLocale();
  const ui = fynsActionUi[locale];
  const [round, setRound] = useState(0);
  const [seenIds, setSeenIds] = useState<string[]>([]);
  const [seenFamilies, setSeenFamilies] = useState<string[]>([]);
  const [states, setStates] = useState<Record<string, FynsActionState>>({});
  const contextKey = JSON.stringify(context);
  const actions = useMemo(() => selectFynsActionSet({
    ...context,
    locale,
    seed: `${context.seed ?? "result"}:round-${round}`,
    excludeIds: seenIds,
    excludeFamilies: seenFamilies,
  }, 3), [contextKey, locale, round, seenFamilies, seenIds]); // eslint-disable-line react-hooks/exhaustive-deps

  if (actions.length === 0) return null;
  const featured = actions[0]!;

  const setActionState = (id: string, state: FynsActionState) => {
    setStates((current) => ({ ...current, [id]: state }));
  };
  const another = () => {
    setSeenIds((current) => [...current, featured.id]);
    setSeenFamilies((current) => [...current, featured.semanticFamily]);
    setRound((current) => current + 1);
  };

  return (
    <section
      aria-labelledby="fyns-action-layer-title"
      data-fyns-action-layer
      style={{ "--fyns-action-accent": accent } as CSSProperties}
      className="mt-16 rounded-[2rem] border border-[var(--fyns-action-accent)]/35 bg-[linear-gradient(145deg,color-mix(in_srgb,var(--fyns-action-accent)_10%,transparent),rgba(255,255,255,0.015))] p-5 sm:p-9"
    >
      <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[var(--fyns-action-accent)]">{ui.eyebrow}</p>
      <h3 id="fyns-action-layer-title" className="mt-4 max-w-3xl text-3xl font-black text-white sm:text-5xl">{ui.title}</h3>
      <p className="mt-5 max-w-3xl leading-7 text-slate-300">{ui.description}</p>

      <div className="mt-9 rounded-[1.5rem] border border-[var(--fyns-action-accent)]/40 bg-[#04111b]/70 p-5 sm:p-8" aria-live="polite">
        <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] font-black uppercase tracking-[0.16em]">
          <span className="rounded-full bg-[var(--fyns-action-accent)] px-3 py-1.5 text-[#041018]">{ui.nextMove}</span>
          <span className="rounded-full border border-white/15 px-3 py-1.5 text-slate-300">{ui.horizons[featured.horizon]}</span>
          <span className="rounded-full border border-white/15 px-3 py-1.5 text-slate-300">{ui.kinds[featured.kind]}</span>
        </div>
        <h4 className="mt-5 text-2xl font-black text-white sm:text-3xl">{featured.title}</h4>
        <p className="mt-4 max-w-3xl text-base font-bold leading-7 text-slate-200 sm:text-lg">{featured.body}</p>
        <ActionControls action={featured} state={states[featured.id] ?? "not-started"} setState={setActionState} />
        <button type="button" onClick={another} className="mt-5 min-h-11 rounded-full border border-white/20 px-5 py-2.5 font-bold text-slate-200 transition hover:border-[var(--fyns-action-accent)]/70 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[var(--fyns-action-accent)]">{ui.another}</button>
      </div>

      {actions.length > 1 ? (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {actions.slice(1).map((action) => (
            <article key={action.id} className="rounded-[1.25rem] border border-white/10 bg-white/[0.025] p-5 sm:p-6">
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[var(--fyns-action-accent)]">{ui.horizons[action.horizon]} · {ui.kinds[action.kind]}</p>
              <h4 className="mt-3 text-xl font-black text-white">{action.title}</h4>
              <p className="mt-3 leading-7 text-slate-300">{action.body}</p>
              <ActionControls action={action} state={states[action.id] ?? "not-started"} setState={setActionState} compact />
            </article>
          ))}
        </div>
      ) : null}
      <p className="mt-6 text-xs leading-5 text-slate-500">{ui.privateNote}</p>
    </section>
  );

  function ActionControls({ action, state, setState, compact = false }: { action: SelectedFynsAction; state: FynsActionState; setState: (id: string, state: FynsActionState) => void; compact?: boolean }) {
    return (
      <div className={compact ? "mt-5" : "mt-7"}>
        {state === "not-started" ? (
          <button type="button" onClick={() => setState(action.id, "trying")} className="min-h-11 rounded-full bg-[var(--fyns-action-accent)] px-5 py-2.5 font-black text-[#041018] transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[var(--fyns-action-accent)]">{ui.start}</button>
        ) : null}
        {state === "trying" ? (
          <div className="rounded-xl border-l-2 border-[var(--fyns-action-accent)] bg-white/[0.025] p-4">
            <p className="font-bold text-white">{ui.started}</p>
            <button type="button" onClick={() => setState(action.id, "reflected")} className="mt-3 min-h-11 rounded-full border border-white/20 px-4 py-2 font-bold text-slate-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--fyns-action-accent)]">{ui.reflect}</button>
          </div>
        ) : null}
        {state === "reflected" ? (
          <div className="rounded-xl border-l-2 border-[var(--fyns-action-accent)] bg-white/[0.025] p-4">
            <p className="font-black text-white">{ui.reflected}</p>
            <p className="mt-2 font-bold leading-6 text-slate-200">{action.reflection}</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">{ui.reflectionTitle}</p>
            <button type="button" onClick={() => setState(action.id, "not-started")} className="mt-3 min-h-11 rounded-full border border-white/15 px-4 py-2 text-sm font-bold text-slate-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--fyns-action-accent)]">{ui.reset}</button>
          </div>
        ) : null}
      </div>
    );
  }
}
