"use client";

import { useLocale } from "@/components/i18n/locale-context";
import { selfProfileUiCopy } from "@/data/find-your-next-step-self-ui-locales";
import type { SelfProfileIdentityResult } from "@/lib/find-your-next-step-self-profile";

function CompactProfileState({
  identity,
}: {
  identity: Extract<SelfProfileIdentityResult, { status: "mixed" | "none" }>;
}) {
  const locale = useLocale();
  const ui = selfProfileUiCopy[locale];
  const mixed = identity.status === "mixed";
  const title = mixed ? ui.varied : ui.open;
  const titleId = mixed ? "self-profile-mixed-title" : "self-profile-none-title";

  return (
    <section
      aria-labelledby={titleId}
      data-self-profile-identity
      data-self-profile-status={identity.status}
      className="mt-14 border-y border-white/10 bg-white/[0.018] py-9 sm:mt-16 sm:py-11"
    >
      <div className="max-w-3xl border-l-2 border-[#35d0e5]/55 pl-5 sm:pl-7">
        <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[#73e3f1]">
          {ui.lens}
        </p>
        <h3 id={titleId} className="mt-4 text-2xl font-black leading-tight text-white sm:text-3xl">
          {title}
        </h3>
        <p className="mt-4 text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
          {identity.message}
        </p>
        <p className="mt-5 border-t border-white/10 pt-4 text-sm leading-6 text-slate-500">
          {ui.disclaimer}
        </p>
      </div>
    </section>
  );
}

export function SelfProfileIdentityView({
  identity,
}: {
  identity: SelfProfileIdentityResult;
}) {
  const locale = useLocale();
  const ui = selfProfileUiCopy[locale];
  if (identity.status !== "profile") return <CompactProfileState identity={identity} />;

  const description = identity.contextual
    ? identity.definition.contextualDescription
    : identity.definition.description;

  return (
    <section
      aria-labelledby="self-profile-title"
      data-self-profile-identity
      data-self-profile-status="profile"
      className="mt-14 border-y border-[#35d0e5]/30 bg-[#35d0e5]/[0.03] py-11 sm:mt-16 sm:py-14"
    >
      <div className="grid gap-11 lg:grid-cols-[1.05fr_0.72fr] lg:gap-16">
        <div className="min-w-0">
          <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[#73e3f1]">
            {ui.lens}
          </p>
          {identity.contextual ? (
            <p className="mt-4 border-l-2 border-[#35d0e5] pl-4 text-sm font-bold leading-6 text-slate-200">
              {ui.contextual}
            </p>
          ) : null}
          <h3
            id="self-profile-title"
            className="mt-5 max-w-3xl break-words text-4xl font-black leading-[0.98] tracking-[-0.035em] text-white sm:text-5xl"
          >
            {identity.definition.name}
          </h3>
          <p className="mt-4 max-w-2xl text-xl font-black leading-8 text-[#9cebf4] sm:text-2xl">
            {identity.definition.tagline}
          </p>
          <p className="mt-7 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
            {description}
          </p>
        </div>

        <div className="min-w-0 border-t border-[#35d0e5]/25 pt-8 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
          <p className="font-mono text-xs font-black uppercase tracking-[0.18em] text-[#73e3f1]">
            {ui.signals}
          </p>
          <ul className="mt-5 divide-y divide-[#35d0e5]/20 border-y border-[#35d0e5]/20">
            {identity.definition.signatureSignals.map((signal) => (
              <li key={signal} className="py-4 font-bold leading-7 text-slate-100 first:pt-0 last:pb-0">
                {signal}
              </li>
            ))}
          </ul>

          <div className="mt-9">
            <h4 className="text-lg font-black text-white">{ui.why}</h4>
            <p className="mt-3 text-sm leading-6 text-slate-400">{identity.why}</p>
          </div>

          {identity.secondarySignals.length > 0 ? (
            <div className="mt-9 border-t border-white/10 pt-7">
              <h4 className="text-lg font-black text-white">{ui.secondary}</h4>
              <ul className="mt-4 grid gap-4">
                {identity.secondarySignals.map((signal) => (
                  <li key={signal.dimension} className="border-l border-[#35d0e5]/45 pl-4">
                    <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#73e3f1]">
                      {signal.label}{signal.contextual ? ` · ${ui.contextualSuffix}` : ""}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{signal.text}</p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>

      <p className="mt-10 max-w-4xl border-t border-white/10 pt-5 text-sm leading-6 text-slate-500">
        {ui.disclaimer}
      </p>
    </section>
  );
}
