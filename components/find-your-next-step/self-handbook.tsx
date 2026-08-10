import type {
  SelfHandbook,
  SelfHandbookItem,
  SelfHandbookSource,
} from "@/lib/find-your-next-step-self-handbook";

function SourceLine({ source }: { source: SelfHandbookSource }) {
  const strength = source.contextual
    ? "Kontextabhängig"
    : source.visibility === "clear"
      ? "Besonders klar sichtbar"
      : "Mehrfach sichtbar";

  return (
    <p className="mt-3 text-xs font-bold leading-5 text-slate-400">
      <span className="text-[#73e3f1]">Ausgangsmuster: {source.label}</span>
      <span aria-hidden="true"> · </span>
      <span>{strength}</span>
    </p>
  );
}

function ChapterHeading({ number, title, id }: { number: string; title: string; id: string }) {
  return (
    <div className="grid gap-2 border-b border-white/10 pb-5 sm:grid-cols-[3rem_1fr] sm:items-end">
      <p className="font-mono text-xs font-black tracking-[0.2em] text-[#35d0e5]" aria-hidden="true">{number}</p>
      <h4 id={id} className="text-2xl font-black text-white sm:text-3xl">{title}</h4>
    </div>
  );
}

function CompactItemList({ items }: { items: readonly SelfHandbookItem[] }) {
  return (
    <ul className="divide-y divide-white/10 border-y border-white/10">
      {items.map((item) => (
        <li key={item.id} className="py-5 first:pt-0 last:pb-0 sm:py-6">
          <p className="font-bold leading-7 text-slate-100">{item.text}</p>
          <SourceLine source={item.source} />
        </li>
      ))}
    </ul>
  );
}

function hasHandbookContent(handbook: SelfHandbook): boolean {
  return Object.values(handbook).some((items) => items.length > 0);
}

export function SelfHandbookView({ handbook }: { handbook: SelfHandbook }) {
  const hasEnergy = handbook.energySupports.length > 0 || handbook.energyWatchouts.length > 0;
  const hasEnvironmentChapter = handbook.environmentChecklist.length > 0 || hasEnergy;
  const hasLearningChapter = handbook.learningIdeas.length > 0
    || handbook.activitySuggestions.length > 0
    || handbook.experiments.length > 0;
  const hasContent = hasHandbookContent(handbook);

  return (
    <section
      aria-labelledby="self-handbook-title"
      data-self-handbook
      className="mt-20 border-y border-[#35d0e5]/25 bg-[#35d0e5]/[0.025] py-12 sm:mt-24 sm:py-16"
    >
      <div className="border-l-2 border-[#35d0e5] pl-5 sm:pl-8">
        <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[#35d0e5]">
          Dein persönlicher Spickzettel
        </p>
        <h3 id="self-handbook-title" className="mt-4 max-w-4xl text-3xl font-black leading-tight text-white sm:text-5xl">
          Dein persönliches Handbuch
        </h3>
        <p className="mt-5 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
          Wenn du dich in deinem Ergebnis wiedererkennst, kannst du die folgenden Punkte als Hypothesen für deinen Alltag verwenden – nicht als feste Regeln.
        </p>
      </div>

      {!hasContent ? (
        <div className="mt-9 max-w-3xl border-l border-white/20 pl-5 sm:pl-8">
          <p className="font-bold leading-7 text-slate-200">
            Deine Antworten ergeben diesmal kein ausreichend verdichtetes Muster für konkrete Alltagshypothesen.
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Deshalb ergänzt FYNS an dieser Stelle bewusst keine allgemeinen Tipps.
          </p>
        </div>
      ) : (
        <div className="mt-12 grid gap-16 sm:mt-16 sm:gap-20">
          {handbook.decisionQuestions.length >= 2 ? (
            <section aria-labelledby="self-handbook-decisions">
              <ChapterHeading number="01" title="Entscheiden" id="self-handbook-decisions" />
              <div className="mt-7 grid gap-6 lg:grid-cols-[0.58fr_1fr] lg:items-start">
                <div>
                  <p className="font-mono text-xs font-black uppercase tracking-[0.18em] text-[#73e3f1]">Decision Compass</p>
                  <p className="mt-3 max-w-md leading-7 text-slate-400">
                    Nimm dir vor einer Entscheidung eine Minute und prüfe nur die Fragen, die gerade wirklich relevant sind.
                  </p>
                </div>
                <ol className="divide-y divide-[#35d0e5]/20 border-y border-[#35d0e5]/25">
                  {handbook.decisionQuestions.map((item, index) => (
                    <li key={item.id} className="grid gap-3 py-5 sm:grid-cols-[2rem_1fr] sm:py-6">
                      <span className="font-mono text-xs font-black text-[#35d0e5]" aria-hidden="true">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <p className="text-lg font-black leading-7 text-white">{item.text}</p>
                        <SourceLine source={item.source} />
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </section>
          ) : null}

          {handbook.workStrategies.length > 0 ? (
            <section aria-labelledby="self-handbook-work">
              <ChapterHeading number="02" title="Arbeiten" id="self-handbook-work" />
              <div className="mt-7 grid gap-6 lg:grid-cols-[0.58fr_1fr] lg:items-start">
                <p className="max-w-md leading-7 text-slate-400">
                  Kleine Strategien, mit denen du vorhandene Muster in einer konkreten Aufgabe testen kannst.
                </p>
                <CompactItemList items={handbook.workStrategies} />
              </div>
            </section>
          ) : null}

          {hasEnvironmentChapter ? (
            <section aria-labelledby="self-handbook-energy-environment">
              <ChapterHeading number="03" title="Energie & Umfeld" id="self-handbook-energy-environment" />
              <div className="mt-7 grid gap-10 lg:grid-cols-2 lg:gap-12">
                {handbook.environmentChecklist.length > 0 ? (
                  <div>
                    <h5 className="text-lg font-black text-white">Darauf könntest du im Umfeld achten</h5>
                    <p className="mt-3 text-sm leading-6 text-slate-400">
                      Nutze die Punkte, um Arbeitsplatz, Projekt, Team oder Alltag konkret zu prüfen.
                    </p>
                    <div className="mt-6"><CompactItemList items={handbook.environmentChecklist} /></div>
                  </div>
                ) : null}

                {hasEnergy ? (
                  <div className="grid content-start gap-9">
                    {handbook.energySupports.length > 0 ? (
                      <section aria-labelledby="self-handbook-energy-supports">
                        <h5 id="self-handbook-energy-supports" className="text-lg font-black text-white">
                          Davon könnte mehr hilfreich sein
                        </h5>
                        <div className="mt-6"><CompactItemList items={handbook.energySupports} /></div>
                      </section>
                    ) : null}
                    {handbook.energyWatchouts.length > 0 ? (
                      <section aria-labelledby="self-handbook-energy-watchouts">
                        <h5 id="self-handbook-energy-watchouts" className="text-lg font-black text-white">
                          Darauf könntest du achten
                        </h5>
                        <div className="mt-6"><CompactItemList items={handbook.energyWatchouts} /></div>
                      </section>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </section>
          ) : null}

          {hasLearningChapter ? (
            <section aria-labelledby="self-handbook-learning">
              <ChapterHeading number="04" title="Lernen & Ausprobieren" id="self-handbook-learning" />
              <div className="mt-8 grid gap-14 sm:gap-16">
                {handbook.learningIdeas.length > 0 ? (
                  <section aria-labelledby="self-handbook-learning-ideas" className="grid gap-6 lg:grid-cols-[0.58fr_1fr] lg:items-start">
                    <div>
                      <h5 id="self-handbook-learning-ideas" className="text-lg font-black text-white">Lernen & Entwicklung</h5>
                      <p className="mt-3 max-w-md text-sm leading-6 text-slate-400">
                        Keine Lerntypen – nur kleine Lernwege aus den sichtbaren Mustern.
                      </p>
                    </div>
                    <CompactItemList items={handbook.learningIdeas} />
                  </section>
                ) : null}

                {handbook.activitySuggestions.length > 0 ? (
                  <section aria-labelledby="self-handbook-activities">
                    <h5 id="self-handbook-activities" className="text-xl font-black text-white sm:text-2xl">
                      Aktivitäten zum Erkunden
                    </h5>
                    <p className="mt-3 max-w-3xl leading-7 text-slate-400">
                      Das sind Erkundungsideen, keine Aussagen über Eignung. Entscheidend sind die Eigenschaften der Aktivität.
                    </p>
                    <ul className="mt-7 divide-y divide-white/10 border-y border-white/10">
                      {handbook.activitySuggestions.map((activity) => (
                        <li key={activity.id} className="py-7 first:pt-0 last:pb-0 sm:py-9">
                          <article className="grid gap-5 lg:grid-cols-[0.72fr_1fr] lg:gap-10">
                            <div>
                              <h5 className="text-lg font-black text-white sm:text-xl">{activity.title}</h5>
                              <p className="mt-3 leading-7 text-slate-300">{activity.why}</p>
                              <p className="mt-3 text-xs leading-5 text-slate-500">
                                Eigenschaften: {activity.properties.join(" · ")}
                              </p>
                              <SourceLine source={activity.source} />
                            </div>
                            <div>
                              <p className="font-mono text-xs font-black uppercase tracking-[0.16em] text-[#73e3f1]">Zum Ausprobieren</p>
                              <ul className="mt-4 grid gap-3 text-sm font-bold leading-6 text-slate-200 sm:grid-cols-2">
                                {activity.examples.map((example) => (
                                  <li key={example.id} className="border-l border-[#35d0e5]/40 pl-4">{example.activity}</li>
                                ))}
                              </ul>
                              <details className="mt-5 border-t border-white/10 pt-3 text-sm text-slate-400">
                                <summary className="min-h-11 cursor-pointer rounded-lg py-3 font-bold text-[#73e3f1] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#35d0e5]">
                                  Warum diese Beispiele?
                                </summary>
                                <ul className="mt-3 grid gap-4">
                                  {activity.examples.map((example) => (
                                    <li key={`${example.id}-reason`} className="leading-6">
                                      <strong className="text-slate-200">{example.activity}:</strong> {example.why}
                                    </li>
                                  ))}
                                </ul>
                              </details>
                            </div>
                          </article>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                {handbook.experiments.length > 0 ? (
                  <section aria-labelledby="self-handbook-experiments">
                    <p className="font-mono text-xs font-black uppercase tracking-[0.18em] text-[#35d0e5]">Kleine reale Tests</p>
                    <h5 id="self-handbook-experiments" className="mt-3 text-2xl font-black text-white sm:text-3xl">Probier das aus</h5>
                    <ol className="mt-7 grid gap-5 lg:grid-cols-3">
                      {handbook.experiments.map((experiment, index) => (
                        <li key={experiment.id} className="border-l-2 border-[#35d0e5] bg-[#35d0e5]/[0.045] p-5 sm:p-6">
                          <article>
                            <p className="font-mono text-xs font-black text-[#35d0e5]">VERSUCH {String(index + 1).padStart(2, "0")}</p>
                            <h5 className="mt-3 text-lg font-black text-white">{experiment.title}</h5>
                            <p className="mt-3 text-sm leading-6 text-slate-400">{experiment.framing}</p>
                            <p className="mt-5 font-bold leading-7 text-slate-100">{experiment.action}</p>
                            {experiment.scope ? (
                              <p className="mt-4 text-sm leading-6 text-slate-400"><strong className="text-slate-200">Umfang:</strong> {experiment.scope}</p>
                            ) : null}
                            <p className="mt-4 text-sm leading-6 text-slate-300"><strong className="text-white">Beobachte:</strong> {experiment.observe}</p>
                            <SourceLine source={experiment.source} />
                          </article>
                        </li>
                      ))}
                    </ol>
                  </section>
                ) : null}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </section>
  );
}
