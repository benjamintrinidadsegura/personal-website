"use client";

import Image from "next/image";
import { useState } from "react";
import type { CSSProperties, RefObject } from "react";

import { useLocale } from "@/components/i18n/locale-context";
import {
  fynsCharacterConstellationCopy,
  getFynsCharacterArtwork,
} from "@/data/find-your-next-step-characters";
import {
  createFynsResultFigureModel,
  defaultFynsFigureRepresentation,
  fynsFigureRepresentations,
  getLocalizedFynsContextScene,
  getFynsResultFigureCopy,
} from "@/data/find-your-next-step-figures";
import type {
  FynsFigureRepresentation,
  FynsResultFigureJourney,
} from "@/data/find-your-next-step-figures";
import type {
  FynsCharacterConstellation,
  FynsVisibleCharacter,
} from "@/lib/find-your-next-step-constellation";

function CharacterEvidence({ character, dominant = false }: { character: FynsVisibleCharacter; dominant?: boolean }) {
  const locale = useLocale();
  const copy = fynsCharacterConstellationCopy[locale];

  return (
    <article
      data-fyns-character={character.id}
      data-fyns-character-role={dominant ? "dominant" : "supporting"}
      className={dominant
        ? "border-l-4 border-[var(--fyns-figure-accent)] bg-white/[0.045] p-6 sm:p-8"
        : "border-l border-white/20 bg-white/[0.022] p-5 sm:p-6"}
    >
      {dominant ? (
        <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[var(--fyns-figure-accent)]">{copy.dominant}</p>
      ) : null}
      <h4 className={`${dominant ? "mt-3 text-3xl sm:text-4xl" : "text-xl"} font-black text-white`}>{character.name}</h4>
      <p className="mt-2 font-bold text-slate-300">{character.subtitle}</p>
      <dl className={`mt-6 grid gap-5 ${dominant ? "sm:grid-cols-2" : ""}`}>
        {[
          [copy.why, character.why],
          [copy.contribution, character.contribution],
          [copy.conditions, character.conditions],
          [copy.friction, character.friction],
          [copy.notice, character.notice],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="font-mono text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">{label}</dt>
            <dd className="mt-2 text-sm leading-6 text-slate-200">{value}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

function ConstellationDetails({ constellation }: { constellation: FynsCharacterConstellation }) {
  const locale = useLocale();
  const copy = fynsCharacterConstellationCopy[locale];
  const applicationItems = [
    [copy.environments, constellation.application.environments],
    [copy.energy, constellation.application.energy],
    [copy.friction, constellation.application.friction],
    [copy.needs, constellation.application.needs],
    [copy.reflection, constellation.application.reflection],
    [copy.experiment, constellation.application.experiment],
  ].filter((item): item is [string, string] => Boolean(item[1]));

  return (
    <div className="border-t border-white/10 p-6 sm:p-8 lg:p-10">
      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <CharacterEvidence character={constellation.dominant} dominant />
        {constellation.supporting.length > 0 ? (
          <section aria-labelledby="fyns-supporting-facets-title" className="min-w-0">
            <h3 id="fyns-supporting-facets-title" className="font-mono text-xs font-black uppercase tracking-[0.18em] text-slate-400">{copy.supporting}</h3>
            <div className="mt-4 grid gap-4">
              {constellation.supporting.map((character) => <CharacterEvidence key={character.id} character={character} />)}
            </div>
          </section>
        ) : null}
      </div>

      {constellation.combination ? (
        <section aria-labelledby="fyns-constellation-combination-title" className="mt-10 border-y border-white/10 py-8">
          <p className="font-mono text-xs font-black uppercase tracking-[0.18em] text-[var(--fyns-figure-accent)]">{copy.combination}</p>
          <h3 id="fyns-constellation-combination-title" className="mt-3 text-2xl font-black text-white sm:text-3xl">{constellation.combination.title}</h3>
          <dl className="mt-6 grid gap-6 lg:grid-cols-3">
            {[
              [copy.evidence, constellation.combination.evidence],
              [copy.interpretation, constellation.combination.interpretation],
              [copy.possibility, constellation.combination.possibility],
            ].map(([label, value]) => (
              <div key={label} className="border-l border-[var(--fyns-figure-accent)] pl-4">
                <dt className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">{label}</dt>
                <dd className="mt-2 text-sm leading-6 text-slate-200">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      <section aria-labelledby="fyns-constellation-synthesis-title" className="mt-10 grid gap-8 lg:grid-cols-[0.68fr_1fr]">
        <div>
          <p className="font-mono text-xs font-black uppercase tracking-[0.18em] text-[var(--fyns-figure-accent)]">{copy.synthesis}</p>
          <h3 id="fyns-constellation-synthesis-title" className="mt-4 text-2xl font-black leading-tight text-white sm:text-3xl">{copy.currentFacet(constellation.dominant.name)}</h3>
        </div>
        <div className="border-l-2 border-white/15 pl-5">
          <p className="text-base leading-8 text-slate-300">{constellation.synthesis}</p>
          {Object.values(constellation.relationships).some(Boolean) ? (
            <dl className="mt-6 grid gap-4">
              {[
                [copy.interpretation, constellation.relationships.reinforcement],
                [copy.conditions, constellation.relationships.condition],
                [copy.possibility, constellation.relationships.application],
              ].filter((item): item is [string, string] => Boolean(item[1])).map(([label, value]) => (
                <div key={label} className="border-t border-white/10 pt-3">
                  <dt className="font-mono text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">{label}</dt>
                  <dd className="mt-2 text-sm leading-6 text-slate-200">{value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      </section>

      {constellation.tensions.length > 0 ? (
        <section aria-labelledby="fyns-constellation-tensions-title" className="mt-10">
          <h3 id="fyns-constellation-tensions-title" className="font-mono text-xs font-black uppercase tracking-[0.18em] text-[#ffb36d]">{copy.tensions}</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {constellation.tensions.map((tension) => (
              <article key={tension.id} className="border-l-2 border-[#ff9a3d]/70 bg-[#ff9a3d]/[0.035] p-5">
                <h4 className="font-black text-white">{tension.title}</h4>
                <p className="mt-2 text-sm leading-6 text-slate-300">{tension.text}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {applicationItems.length > 0 ? (
        <section aria-labelledby="fyns-constellation-application-title" className="mt-10 border-t border-white/10 pt-8">
          <h3 id="fyns-constellation-application-title" className="text-2xl font-black text-white">{copy.application}</h3>
          <dl className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {applicationItems.map(([label, value]) => (
              <div key={label} className="border-t border-white/15 pt-4">
                <dt className="font-mono text-[10px] font-black uppercase tracking-[0.15em] text-[var(--fyns-figure-accent)]">{label}</dt>
                <dd className="mt-2 text-sm leading-6 text-slate-200">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}
    </div>
  );
}

export function FynsResultFigure({
  journey,
  accent,
  headingId,
  headingRef,
  title,
  description,
  summary = [],
  semanticIds,
  constellation,
  representation: controlledRepresentation,
  onRepresentationChange,
}: {
  journey: FynsResultFigureJourney;
  accent: string;
  headingId: string;
  headingRef: RefObject<HTMLHeadingElement | null>;
  title: string;
  description: string;
  summary?: readonly string[];
  semanticIds: readonly string[];
  constellation?: FynsCharacterConstellation | null;
  representation?: FynsFigureRepresentation;
  onRepresentationChange?: (representation: FynsFigureRepresentation) => void;
}) {
  const locale = useLocale();
  const copy = getFynsResultFigureCopy(locale);
  const constellationCopy = fynsCharacterConstellationCopy[locale];
  const [localRepresentation, setLocalRepresentation] = useState(defaultFynsFigureRepresentation);
  const representation = controlledRepresentation ?? localRepresentation;
  const setRepresentation = (nextRepresentation: FynsFigureRepresentation) => {
    setLocalRepresentation(nextRepresentation);
    onRepresentationChange?.(nextRepresentation);
  };
  const model = createFynsResultFigureModel({ journey, representation, semanticIds });
  const contextScene = getLocalizedFynsContextScene(journey, locale);
  const characterArtwork = constellation
    ? [constellation.dominant, ...constellation.supporting].map((character) => ({
      character,
      src: getFynsCharacterArtwork(character.id, representation),
    }))
    : [];
  const hasCompleteCharacterArtwork = characterArtwork.length > 0
    && characterArtwork.every(({ src }) => Boolean(src));
  const visualStatus = constellation
    ? hasCompleteCharacterArtwork ? "complete" : "artwork-unavailable"
    : "context-scene";
  const representationDisabled = Boolean(constellation) && !hasCompleteCharacterArtwork;
  const selectedLabel = copy.options[representation];
  const style = { "--fyns-figure-accent": accent } as CSSProperties;

  return (
    <section
      data-fyns-result-figure={journey}
      data-fyns-character-constellation={constellation ? "true" : undefined}
      data-fyns-figure-model={model.id}
      data-fyns-figure-representation={representation}
      data-fyns-visual-status={visualStatus}
      style={style}
      className="overflow-hidden rounded-[1.75rem] border border-white/12 bg-[linear-gradient(145deg,rgba(255,255,255,0.055),rgba(4,16,24,0.88))] shadow-[0_28px_90px_rgba(0,0,0,0.22)]"
    >
      <div className="grid md:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] md:items-start">
        <div
          role="img"
          aria-label={hasCompleteCharacterArtwork && constellation
            ? `${copy.visualLabel(selectedLabel)} ${constellationCopy.currentFacet(constellation.dominant.name)}`
            : contextScene.alt}
          className="relative aspect-[4/3] min-h-0 overflow-hidden border-b border-white/10 md:h-[32rem] md:aspect-auto md:border-b-0 md:border-r lg:h-[34rem]"
        >
          <Image
            src={model.src}
            alt=""
            width={1600}
            height={900}
            sizes="(min-width: 1024px) 52vw, (min-width: 768px) 55vw, 100vw"
            style={{ objectPosition: model.objectPosition }}
            className="h-full w-full scale-[1.035] object-cover"
          />
          <div aria-hidden="true" className={`absolute inset-0 ${constellation ? "bg-[linear-gradient(180deg,rgba(4,16,24,0.58),rgba(4,16,24,0.48)_42%,rgba(4,16,24,0.9))] backdrop-blur-[1px]" : "bg-[linear-gradient(180deg,rgba(4,16,24,0.12),rgba(4,16,24,0.08)_42%,rgba(4,16,24,0.82))]"}`} />
          {constellation && hasCompleteCharacterArtwork ? (
            <>
              <ol aria-hidden="true" className="absolute inset-0 z-10">
                {characterArtwork.slice(1).map(({ character, src }, index) => src ? (
                  <li
                    key={character.id}
                    data-fyns-visual-supporting={character.id}
                    className={`absolute overflow-hidden rounded-[1.25rem] border border-white/25 bg-[#f7f1e7] opacity-90 shadow-[0_18px_42px_rgba(0,0,0,0.42)] ${index === 0 ? "bottom-[7%] left-[4%] h-[54%] w-[30%] -rotate-3" : index === 1 ? "right-[4%] bottom-[7%] h-[54%] w-[30%] rotate-3" : "top-[4%] left-[7%] h-[38%] w-[28%] rotate-2"}`}
                  >
                    <Image src={src} alt="" fill sizes="(min-width: 768px) 15vw, 28vw" className="object-cover" />
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#07151f] to-transparent px-2 pb-2 pt-8 text-center text-[10px] font-black text-white sm:text-xs">{character.name}</span>
                  </li>
                ) : null)}
              </ol>
              {characterArtwork[0]?.src ? (
                <div aria-hidden="true" data-fyns-visual-dominant={constellation.dominant.id} className="absolute inset-x-[27%] bottom-[3%] z-20 h-[76%] overflow-hidden rounded-[1.5rem] border-2 border-[var(--fyns-figure-accent)] bg-[#f7f1e7] shadow-[0_28px_58px_rgba(0,0,0,0.58)]">
                  <Image src={characterArtwork[0].src} alt="" fill priority sizes="(min-width: 768px) 24vw, 46vw" className="object-cover" />
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#07151f] via-[#07151f]/75 to-transparent px-3 pb-3 pt-12 text-center text-sm font-black text-white sm:text-base">{constellation.dominant.name}</span>
                </div>
              ) : null}
            </>
          ) : (
            <div aria-hidden="true" className="absolute inset-x-5 bottom-5 flex items-center gap-2">
              {model.semanticIds.map((semanticId, index) => (
                <span key={semanticId} data-fyns-semantic-id={semanticId} className="block h-2 rounded-full border border-white/30 bg-[var(--fyns-figure-accent)] shadow-[0_0_18px_var(--fyns-figure-accent)]" style={{ width: `${2.25 + index * 1.25}rem`, opacity: 1 - index * 0.18 }} />
              ))}
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-col justify-center p-6 sm:p-8 lg:p-10">
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-[var(--fyns-figure-accent)]">{constellation ? constellationCopy.eyebrow : copy.eyebrow}</p>
          <h2
            ref={headingRef}
            tabIndex={-1}
            style={{ outline: "none" }}
            id={headingId}
            className="mt-5 scroll-mt-24 break-words text-[clamp(2.15rem,4.2vw,4.35rem)] font-black leading-[0.94] tracking-[-0.045em] text-white outline-none [overflow-wrap:anywhere]"
          >
            {constellation ? constellation.dominant.name : title}
          </h2>
          {constellation ? (
            <>
              <p className="mt-4 text-lg font-black leading-7 text-slate-200">{constellationCopy.currentFacet(constellation.dominant.name)}</p>
              <p className="mt-3 text-sm font-bold text-slate-500">{title}</p>
            </>
          ) : null}
          {summary.length > 0 ? (
            <div className="mt-6 grid gap-2 text-base font-bold leading-7 text-slate-200">
              {summary.map((sentence, index) => <p key={`${index}-${sentence}`}>{sentence}</p>)}
            </div>
          ) : null}
          <p className="mt-6 border-l-2 border-[var(--fyns-figure-accent)] pl-5 text-sm leading-7 text-slate-300">{description}</p>

          <fieldset className="mt-7 border-t border-white/10 pt-6">
            <legend className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-slate-300">{copy.legend}</legend>
            <div className="mt-4 grid grid-cols-1 gap-2 min-[420px]:grid-cols-3">
              {fynsFigureRepresentations.map((candidate) => {
                const selected = representation === candidate;
                return (
                  <label key={candidate} className="group cursor-pointer">
                    <input type="radio" name={`fyns-${journey}-figure-representation`} value={candidate} checked={selected} disabled={representationDisabled} onChange={() => setRepresentation(candidate)} className="peer sr-only" />
                    <span className={`flex min-h-12 items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm font-bold transition peer-focus-visible:outline-2 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-[var(--fyns-figure-accent)] ${representationDisabled ? "cursor-not-allowed border-white/10 bg-white/[0.015] text-slate-600" : selected ? "border-[var(--fyns-figure-accent)] bg-white/[0.08] text-white" : "border-white/10 bg-white/[0.025] text-slate-400 group-hover:border-white/25 group-hover:text-white"}`}>
                      <span>{copy.options[candidate]}</span>
                      <span aria-hidden="true" className={`h-2.5 w-2.5 shrink-0 rounded-full border ${selected ? "border-[var(--fyns-figure-accent)] bg-[var(--fyns-figure-accent)]" : "border-white/25"}`} />
                    </span>
                  </label>
                );
              })}
            </div>
            <p className="mt-4 text-xs leading-5 text-slate-500">{copy.explanation}</p>
            {representationDisabled ? <p className="mt-3 text-xs leading-5 text-[#ffb36d]" role="status">{constellationCopy.artworkUnavailable}</p> : null}
          </fieldset>
        </div>
      </div>

      {constellation ? <ConstellationDetails constellation={constellation} /> : null}
    </section>
  );
}
