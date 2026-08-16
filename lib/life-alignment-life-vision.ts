import {
  lifeVisionAreas,
  lifeVisionConstraintOptions,
  lifeVisionEmphasisOptions,
  lifeVisionHorizonOptions,
  lifeVisionProtectionOptions,
  lifeVisionSections,
  lifeVisionSourceOptions,
  lifeVisionTradeoffOptions,
} from "@/data/life-alignment-life-vision";
import type {
  LifeVisionAction,
  LifeVisionActionPath,
  LifeVisionAnswers,
  LifeVisionAreaId,
  LifeVisionAreaResult,
  LifeVisionEvidence,
  LifeVisionExplorationMode,
  LifeVisionInsight,
  LifeVisionJourneyState,
  LifeVisionResult,
  LifeVisionSignal,
  LifeVisionSource,
} from "@/types/life-alignment-life-vision";

function lowerFirst(value: string): string {
  return value.length > 0 ? `${value[0].toLocaleLowerCase("de-DE")}${value.slice(1)}` : value;
}

export const initialLifeVisionAnswers: LifeVisionAnswers = {
  horizon: null,
  selectedAreaIds: [],
  emphasisByArea: {},
  protectedAreaIds: [],
  protectionIds: [],
  sourcesByArea: {},
  constraintIds: [],
  competingAreaIds: [],
  tradeoffStance: null,
  explorationModes: [],
};

export const initialLifeVisionState: LifeVisionJourneyState = {
  phase: "intro",
  sectionIndex: 0,
  answers: initialLifeVisionAnswers,
  validationMessage: null,
  restartPending: false,
};

export function formatLifeVisionSelectionCount(selected: number, min: number, max: number): string {
  const state = selected >= min && selected <= max ? "gültige Auswahl" : min === max ? `${min} benötigt` : `${min}–${max} benötigt`;
  return `${selected} von ${max} ausgewählt · ${state}`;
}

export function getLifeVisionAreaTitle(areaId: LifeVisionAreaId): string {
  return lifeVisionAreas.find(({ id }) => id === areaId)?.title ?? "Lebensbereich";
}

export function validateLifeVisionSection(sectionIndex: number, answers: LifeVisionAnswers): string | null {
  if (sectionIndex === 0) {
    if (!answers.horizon) return "Wähle einen Zukunftsrahmen aus.";
    if (answers.selectedAreaIds.length < 3 || answers.selectedAreaIds.length > 6) return "Wähle drei bis sechs relevante Lebensbereiche aus.";
    return null;
  }
  if (sectionIndex === 1) {
    return answers.selectedAreaIds.every((areaId) => Boolean(answers.emphasisByArea[areaId]))
      ? null
      : "Wähle für jeden Lebensbereich eine Richtung – auch ‚noch unsicher‘ oder ‚bewusst offen‘ ist eine vollständige Antwort.";
  }
  if (sectionIndex === 2) {
    if (answers.protectedAreaIds.length < 1 || answers.protectedAreaIds.length > 3) return "Markiere ein bis drei Lebensbereiche, die nicht beiläufig geopfert werden sollen.";
    if (answers.protectedAreaIds.some((areaId) => !answers.selectedAreaIds.includes(areaId))) return "Geschützte Prioritäten müssen zu deinen gewählten Lebensbereichen gehören.";
    if (answers.protectionIds.length < 1 || answers.protectionIds.length > 3) return "Wähle ein bis drei Bedingungen aus, die in deiner Zukunft tragfähig bleiben sollen.";
    return null;
  }
  if (sectionIndex === 3) {
    for (const areaId of answers.selectedAreaIds) {
      const sources = answers.sourcesByArea[areaId] ?? [];
      if (sources.length < 1 || sources.length > 2) return "Wähle für jeden Lebensbereich ein oder zwei Herkunftssignale aus.";
      if (sources.includes("uncertain") && sources.length > 1) return "‚Noch unsicher‘ kann bei einem Lebensbereich nur allein gewählt werden.";
    }
    return null;
  }
  if (sectionIndex === 4) {
    if (answers.constraintIds.length < 1 || answers.constraintIds.length > 3) return "Wähle eine bis drei reale Bedingungen aus.";
    if (answers.constraintIds.includes("none") && answers.constraintIds.length > 1) return "‚Keine konkrete Grenze‘ kann nur allein gewählt werden.";
    if (answers.competingAreaIds.length !== 0 && answers.competingAreaIds.length !== 2) return "Wähle genau zwei möglicherweise konkurrierende Richtungen oder keine.";
    if (answers.competingAreaIds.some((areaId) => !answers.selectedAreaIds.includes(areaId))) return "Konkurrierende Richtungen müssen zu deinen gewählten Lebensbereichen gehören.";
    if (!answers.tradeoffStance) return "Ordne ein, wie du heute zu dieser möglichen Abwägung stehst.";
    return null;
  }
  if (answers.explorationModes.length < 2 || answers.explorationModes.length > 4) return "Wähle zwei bis vier Arten der Erkundung aus, die für dich passen könnten.";
  return null;
}

export function firstInvalidLifeVisionSection(answers: LifeVisionAnswers): number | null {
  for (let index = 0; index < lifeVisionSections.length; index += 1) {
    if (validateLifeVisionSection(index, answers)) return index;
  }
  return null;
}

function areaEvidence(area: LifeVisionAreaResult): LifeVisionEvidence[] {
  return [
    { label: "Gewünschte Richtung", detail: `${area.title}: ${area.emphasisLabel}` },
    ...area.sourceLabels.map((detail) => ({ label: "Von dir gewähltes Herkunftssignal", detail })),
  ];
}

function makeAreaResult(answers: LifeVisionAnswers, areaId: LifeVisionAreaId): LifeVisionAreaResult {
  const emphasis = answers.emphasisByArea[areaId] ?? "uncertain";
  const protectedArea = answers.protectedAreaIds.includes(areaId);
  const competing = answers.competingAreaIds.includes(areaId);
  const constrained = !answers.constraintIds.includes("none") && emphasis !== "similar";
  const signals: LifeVisionSignal[] = [];
  if (emphasis === "intentionally-open") signals.push("open");
  else if (emphasis === "uncertain") signals.push("uncertain");
  else signals.push("direction");
  if (protectedArea) signals.push("protected");
  if (competing) signals.push("competing");
  if (constrained) signals.push("constrained");
  if (competing && answers.tradeoffStance === "accept-for-now") signals.push("accepted");
  return {
    id: areaId,
    title: getLifeVisionAreaTitle(areaId),
    emphasis,
    emphasisLabel: lifeVisionEmphasisOptions[emphasis].label,
    protected: protectedArea,
    sourceLabels: (answers.sourcesByArea[areaId] ?? []).map((source) => lifeVisionSourceOptions[source]),
    signals,
  };
}

function buildInsights(answers: LifeVisionAnswers, areas: readonly LifeVisionAreaResult[]): LifeVisionInsight[] {
  const changedAreas = areas.filter(({ emphasis }) => emphasis === "less" || emphasis === "more" || emphasis === "different");
  const steadyAreas = areas.filter(({ emphasis }) => emphasis === "similar");
  const protectedAreas = areas.filter(({ protected: isProtected }) => isProtected);
  const openAreas = areas.filter(({ emphasis }) => emphasis === "intentionally-open" || emphasis === "uncertain");
  const reducedAreas = areas.filter(({ emphasis }) => emphasis === "less");
  const towardAreas = areas.filter(({ emphasis }) => emphasis === "more" || emphasis === "different");
  const insights: LifeVisionInsight[] = [{
    id: "direction-shape",
    title: "Deine Zukunftsrichtung besteht aus Veränderung und bewusster Kontinuität.",
    finding: changedAreas.length
      ? `${changedAreas.map(({ title, emphasisLabel }) => `${title} (${emphasisLabel})`).join(", ")} soll${changedAreas.length === 1 ? "" : "en"} sich nach deiner Auswahl bewegen.${steadyAreas.length ? ` ${steadyAreas.map(({ title }) => title).join(", ")} darf in ähnlicher Form bestehen bleiben.` : ""}`
      : "Du hast derzeit keine Richtung als ‚mehr‘, ‚weniger‘ oder ‚anders‘ markiert; Kontinuität und Offenheit prägen diese Landschaft.",
    why: "Diese Beobachtung fasst nur deine gewählten Richtungsangaben zusammen und leitet daraus kein bevorzugtes Zukunftsbild ab.",
    illustrativeExample: changedAreas[0]
      ? `Nur als Illustration, nicht als Aussage über deinen Alltag: „${changedAreas[0].title} anders“ könnte eine andere Wochenstruktur bedeuten – oder etwas ganz anderes. Deine konkrete Bedeutung bleibt offen.`
      : "Nur als Illustration, nicht als Aussage über deinen Alltag: Kontinuität könnte bedeuten, einen funktionierenden Rhythmus bewusst beizubehalten, statt Veränderung um ihrer selbst willen zu suchen.",
    evidence: areas.map((area) => ({ label: "Gewünschte Richtung", detail: `${area.title}: ${area.emphasisLabel}` })),
  }];

  if (protectedAreas.length) {
    insights.push({
      id: "protected-directions",
      title: "Veränderung hat von dir benannte Schutzbedingungen.",
      finding: `${protectedAreas.map(({ title }) => title).join(", ")} soll${protectedAreas.length === 1 ? "" : "en"} bei zukünftigen Entscheidungen nicht beiläufig verdrängt werden.`,
      why: "Das ist kein allgemeines Ideal, sondern folgt aus deinen markierten Prioritäten und Schutzbedingungen.",
      illustrativeExample: `Nur als Illustration, nicht als Aussage über deinen Alltag: Eine neue Möglichkeit könnte attraktiv sein und trotzdem angepasst werden, wenn sie ${lowerFirst(lifeVisionProtectionOptions[answers.protectionIds[0]] ?? "")} dauerhaft untergraben würde.`,
      evidence: [
        ...protectedAreas.flatMap(areaEvidence),
        ...answers.protectionIds.map((id) => ({ label: "Geschützte Bedingung", detail: lifeVisionProtectionOptions[id] })),
      ],
    });
  }

  if (answers.competingAreaIds.length === 2) {
    const competing = answers.competingAreaIds.map((id) => areas.find((area) => area.id === id)).filter((area): area is LifeVisionAreaResult => Boolean(area));
    insights.push({
      id: "competing-directions",
      title: "Zwei gewünschte Richtungen verdienen eine gemeinsame Betrachtung.",
      finding: `${competing[0]?.title} und ${competing[1]?.title} wurden von dir als möglicherweise konkurrierend markiert.`,
      why: `Deine heutige Einordnung lautet: ${lifeVisionTradeoffOptions[answers.tradeoffStance ?? "uncertain"]}`,
      illustrativeExample: `Nur als Illustration, nicht als Aussage über deinen Alltag: Mehr Raum für ${competing[0]?.title} könnte in einer bestimmten Woche weniger verfügbare Zeit für ${competing[1]?.title} bedeuten; in einer anderen Gestaltung muss das nicht so sein.`,
      evidence: competing.flatMap(areaEvidence),
    });
  }

  const protectedMovement = protectedAreas.filter(({ emphasis }) => emphasis === "more" || emphasis === "different");
  if (protectedMovement.length) {
    insights.push({
      id: "protected-movement",
      title: "Ein gewünschter Schritt ist zugleich eine Schutzaufgabe.",
      finding: `${protectedMovement.map(({ title }) => title).join(", ")} soll${protectedMovement.length === 1 ? "" : "en"} sich bewegen und wurde${protectedMovement.length === 1 ? "" : "n"} zugleich als geschützt markiert. Veränderung darf hier auf Tragfähigkeit geprüft werden, nicht nur auf Tempo.`,
      why: "Dieses Muster entsteht nur dort, wo du für denselben Bereich eine Bewegung und Schutz markiert hast.",
      illustrativeExample: `Nur als Illustration, nicht als Aussage über deinen Alltag: „Mehr ${protectedMovement[0].title}“ könnte zuerst ein kleines verlässliches Zeitfenster bedeuten, statt sofort eine große Verpflichtung einzugehen.`,
      evidence: protectedMovement.flatMap(areaEvidence),
    });
  }

  if (reducedAreas.length && towardAreas.length) {
    insights.push({
      id: "possible-redistribution",
      title: "Weniger an einer Stelle könnte Spielraum an anderer Stelle schaffen – muss es aber nicht.",
      finding: `${reducedAreas.map(({ title }) => title).join(", ")} soll${reducedAreas.length === 1 ? "" : "en"} weniger Raum erhalten; ${towardAreas.map(({ title }) => title).join(", ")} soll${towardAreas.length === 1 ? "" : "en"} mehr oder anders werden.`,
      why: "Die Verbindung ist eine prüfbare Möglichkeit aus deinen Richtungen, keine Annahme, dass Zeit oder Energie automatisch übertragbar sind.",
      illustrativeExample: `Nur als Illustration, nicht als Aussage über deinen Alltag: Eine entfallene regelmäßige Aufgabe in „${reducedAreas[0].title}“ könnte Raum für „${towardAreas[0].title}“ freigeben – oder zunächst nur Erholung ermöglichen.`,
      evidence: [...reducedAreas, ...towardAreas].flatMap(areaEvidence),
    });
  }

  const influenced = areas.filter((area) => {
    const sources = answers.sourcesByArea[area.id] ?? [];
    return sources.some((source) => source === "social" || source === "inherited" || source === "constraint-driven");
  });
  if (influenced.length) {
    insights.push({
      id: "context-influence",
      title: "Einige Richtungen stehen sichtbar in einem größeren Kontext.",
      finding: `${influenced.map(({ title }) => title).join(", ")} ${influenced.length === 1 ? "enthält" : "enthalten"} nach deiner Einordnung soziale, übernommene oder bedingungsgetriebene Einflüsse.`,
      why: "Das macht die Richtungen weder falsch noch unecht. Es zeigt nur, wo eigene Wünsche und Kontext gemeinsam betrachtet werden sollten.",
      illustrativeExample: `Nur als Illustration, nicht als Aussage über deinen Alltag: Bei „${influenced[0].title}“ könnte eine vertraute Erwartung und ein eigener Wunsch dasselbe Ziel unterstützen – oder erst im Vergleich unterscheidbar werden.`,
      evidence: influenced.flatMap(areaEvidence),
    });
  }

  if (openAreas.length) {
    insights.push({
      id: "open-directions",
      title: "Nicht jede Richtung muss schon feststehen.",
      finding: `${openAreas.map(({ title }) => title).join(", ")} ${openAreas.length === 1 ? "bleibt" : "bleiben"} ausdrücklich offen oder unsicher.`,
      why: "Offenheit wird hier als deine vollständige Antwort behandelt, nicht als fehlendes Ergebnis.",
      illustrativeExample: `Nur als Illustration, nicht als Aussage über deinen Alltag: Für „${openAreas[0].title}“ könnten zwei verschiedene Möglichkeiten zunächst nebeneinander notiert werden, ohne jetzt eine davon auszuwählen.`,
      evidence: openAreas.flatMap(areaEvidence),
    });
  }

  const openWithInfluence = openAreas.filter((area) => {
    const sources = answers.sourcesByArea[area.id] ?? [];
    return sources.includes("social") || sources.includes("inherited") || sources.includes("uncertain");
  });
  if (openWithInfluence.length) {
    insights.push({
      id: "open-and-context",
      title: "Offenheit und Herkunftssignale können gemeinsam erkundet werden.",
      finding: `${openWithInfluence.map(({ title }) => title).join(", ")} ${openWithInfluence.length === 1 ? "ist" : "sind"} offen oder unsicher und ${openWithInfluence.length === 1 ? "trägt" : "tragen"} zugleich ein soziales, übernommenes oder unsicheres Herkunftssignal.`,
      why: "Du hast beide Signale für denselben Bereich gewählt. Das spricht für Klärung vor Festlegung, nicht gegen die Richtung.",
      illustrativeExample: `Nur als Illustration, nicht als Aussage über deinen Alltag: Eine kurze Notiz „Was würde ich wählen, wenn niemand darauf reagiert?“ könnte für „${openWithInfluence[0].title}“ einen Unterschied sichtbar machen – oder bestätigen, dass Umfeld und eigener Wunsch übereinstimmen.`,
      evidence: openWithInfluence.flatMap(areaEvidence),
    });
  }

  if (changedAreas.length && !answers.constraintIds.includes("none")) {
    insights.push({
      id: "direction-and-constraints",
      title: "Gewünschte Veränderung trifft auf reale Bedingungen.",
      finding: `${changedAreas.map(({ title }) => title).join(", ")} soll${changedAreas.length === 1 ? "" : "en"} sich verändern, während du konkrete Grenzen benannt hast.`,
      why: "Die Landschaft trennt gewünschte Richtung und heutigen Spielraum, damit eine Grenze nicht als persönliches Versagen erscheint.",
      illustrativeExample: `Nur als Illustration, nicht als Aussage über deinen Alltag: Wenn ${lowerFirst(lifeVisionConstraintOptions[answers.constraintIds[0]]).replace(/\.$/u, "")}, könnte ein erster Schritt zu „${changedAreas[0].title}“ zunächst darin bestehen, eine Voraussetzung zu klären statt sofort etwas umzustellen.`,
      evidence: [
        ...changedAreas.map((area) => ({ label: "Gewünschte Veränderung", detail: `${area.title}: ${area.emphasisLabel}` })),
        ...answers.constraintIds.map((id) => ({ label: "Reale Bedingung", detail: lifeVisionConstraintOptions[id] })),
      ],
    });
  }
  return insights;
}

function pathEvidence(mode: LifeVisionExplorationMode, answers: LifeVisionAnswers, areas: readonly LifeVisionAreaResult[]): LifeVisionEvidence[] {
  const changing = areas.filter(({ emphasis }) => emphasis === "less" || emphasis === "more" || emphasis === "different");
  const open = areas.filter(({ emphasis }) => emphasis === "uncertain" || emphasis === "intentionally-open");
  const influenced = areas.filter((area) => (answers.sourcesByArea[area.id] ?? []).some((source) => source !== "intrinsic"));
  const evidence: LifeVisionEvidence[] = [];
  const preferredArea = mode === "explore-alternatives" || mode === "gather-information" ? open[0] ?? changing[0] : changing[0] ?? open[0];
  if (preferredArea) evidence.push({ label: "Gewählte Richtung", detail: `${preferredArea.title}: ${preferredArea.emphasisLabel}` });
  else if (areas[0]) evidence.push({ label: "Gewählte Kontinuität", detail: `${areas[0].title}: ${areas[0].emphasisLabel}` });
  if (["reduce-load", "gather-information", "conversation", "boundary", "build-capacity", "external-support"].includes(mode) && answers.constraintIds[0]) evidence.push({ label: "Heutige Bedingung", detail: lifeVisionConstraintOptions[answers.constraintIds[0]] });
  if (["direct-change", "boundary", "accept-for-now", "reversible-experiment"].includes(mode) && answers.protectionIds[0]) evidence.push({ label: "Geschützte Bedingung", detail: lifeVisionProtectionOptions[answers.protectionIds[0]] });
  if (["conversation", "external-support"].includes(mode) && influenced[0]) evidence.push(...areaEvidence(influenced[0]).slice(1));
  if (mode === "accept-for-now") evidence.push({ label: "Deine Einordnung", detail: lifeVisionTradeoffOptions[answers.tradeoffStance ?? "uncertain"] });
  return evidence;
}

const pathCopy: Readonly<Record<LifeVisionExplorationMode, Omit<LifeVisionActionPath, "mode" | "evidence">>> = {
  "direct-change": { title: "Eine kleine direkte Veränderung", whyItMayFit: "Du hast diesen Weg selbst gewählt; er kann eine deiner Richtungsangaben im Alltag prüfbar machen, ohne daraus schon eine dauerhafte Entscheidung abzuleiten.", firstStep: "Wähle eine kleine, klar begrenzte Veränderung in einem Bereich und lege fest, wann du sie wieder ansiehst.", tradeoff: "Eine direkte Verschiebung kann Kapazität aus einem anderen Bereich beanspruchen.", learningQuestion: "Was wurde durch die Veränderung tatsächlich leichter, schwerer oder klarer?", reversibility: "Begrenze den Versuch zeitlich und behalte eine einfache Rückkehrmöglichkeit.", tools: [{ title: "Vorher–Nachher-Notiz", use: "Notiere vor und nach dem Versuch je einen Satz zu Wirkung und Aufwand." }] },
  "reduce-load": { title: "Belastung innerhalb des heutigen Rahmens reduzieren", whyItMayFit: "Benannte Grenzen können bedeuten, dass Entlastung vor zusätzlichem Wachstum hilfreicher ist.", firstStep: "Suche eine kleine wiederkehrende Belastung, die vereinfacht, seltener oder vorübergehend pausiert werden könnte.", tradeoff: "Entlastung kann Erwartungen anderer berühren oder etwas langsamer machen.", learningQuestion: "Entsteht wirklich nutzbare Kapazität – und wohin fließt sie, wenn du sie nicht sofort verplanst?", reversibility: "Teste die Reduktion für einen festen Zeitraum, bevor du sie dauerhaft machst.", tools: [{ title: "Belastungsfilter", use: "Prüfe eine Aufgabe mit drei Fragen: nötig, jetzt nötig, von mir nötig?" }] },
  "gather-information": { title: "Eine Annahme durch Information ersetzen", whyItMayFit: "Ein Teil deines Spielraums kann davon abhängen, was tatsächlich möglich oder erforderlich ist.", firstStep: "Formuliere eine konkrete offene Frage und kläre nur die Information, die deine nächste Entscheidung verändert.", tradeoff: "Mehr Information schafft nicht immer sofort Eindeutigkeit und kostet etwas Zeit.", learningQuestion: "Welche Annahme wurde bestätigt, widerlegt oder kleiner – und welche Frage bleibt entscheidend?", reversibility: "Informationsgewinn verpflichtet dich noch zu keiner Entscheidung.", tools: [{ title: "Eine-Frage-Blatt", use: "Halte Frage, verlässliche Quelle und entscheidungsrelevante Antwort auf einer Seite fest." }] },
  conversation: { title: "Eine Richtung in einem Gespräch klären", whyItMayFit: "Deine Zukunft berührt möglicherweise Beziehungen, Verpflichtungen oder Entscheidungen anderer.", firstStep: "Bitte um ein erkundendes Gespräch und benenne sowohl deinen Wunsch als auch die Bedingung, die du verstehen möchtest.", tradeoff: "Ein Gespräch kann unterschiedliche Erwartungen sichtbar machen, ohne sie sofort zu lösen.", learningQuestion: "Was ist nach dem Gespräch ausdrücklich geklärt, weiterhin verschieden oder noch offen?", reversibility: "Vereinbart zunächst nur einen nächsten Prüfpunkt statt einer endgültigen Zusage.", tools: [{ title: "Gesprächsskizze", use: "Drei Zeilen: Was ich beobachte, was mir wichtig ist, was ich verstehen möchte." }] },
  boundary: { title: "Eine Grenze neu verhandeln", whyItMayFit: "Mehr Raum für eine Priorität kann eine klarere Begrenzung an anderer Stelle brauchen.", firstStep: "Identifiziere eine einzelne Erwartung oder Zusage, deren Umfang du konkret besprechen könntest.", tradeoff: "Eine neue Grenze kann bei dir oder anderen Enttäuschung und Anpassungsbedarf auslösen.", learningQuestion: "Schützt die Grenze das Benannte, ohne mehr Nebenwirkungen zu erzeugen als erwartet?", reversibility: "Beginne mit einer befristeten oder situationsbezogenen Grenze.", tools: [{ title: "Grenzsatz", use: "Formuliere: Das kann ich leisten; das nicht; dann prüfen wir erneut." }] },
  "build-capacity": { title: "Vor einer Veränderung Kapazität aufbauen", whyItMayFit: "Du hast diesen Weg selbst gewählt; er kann prüfen, ob eine praktische Voraussetzung vor der eigentlichen Veränderung hilfreich ist – auch wenn du noch keinen eindeutigen Engpass benannt hast.", firstStep: "Wähle eine Voraussetzung – Zeit, Energie, Wissen oder finanzielle Stabilität – und definiere einen kleinen Aufbau-Schritt.", tradeoff: "Vorbereitung verlangsamt sichtbare Veränderung, kann sie aber tragfähiger machen.", learningQuestion: "Ist diese Voraussetzung wirklich der Engpass oder wird nach dem ersten Schritt etwas anderes sichtbar?", reversibility: "Prüfe nach dem ersten Schritt, ob diese Voraussetzung tatsächlich entscheidend ist.", tools: [{ title: "Voraussetzungs-Check", use: "Notiere gewünschte Richtung, vermuteten Engpass und den kleinsten überprüfbaren Aufbau-Schritt." }] },
  "explore-alternatives": { title: "Mehrere Möglichkeiten offen erkunden", whyItMayFit: "Bewusst offene oder unsichere Richtungen profitieren möglicherweise von Vergleich statt Festlegung.", firstStep: "Skizziere zwei oder drei deutlich verschiedene Möglichkeiten und kläre bei jeder nur die wichtigste unbekannte Bedingung.", tradeoff: "Offenheit erhält Möglichkeiten, kann aber vorübergehend mehr Ungewissheit bedeuten.", learningQuestion: "Welche Möglichkeit verdient weitere Prüfung – und welche lässt sich ohne Verlust loslassen?", reversibility: "Die Erkundung enthält ausdrücklich noch keine Verpflichtung.", tools: [{ title: "Drei-Möglichkeiten-Blatt", use: "Je Möglichkeit: reizvoll, schwierig, wichtigste offene Frage." }] },
  "accept-for-now": { title: "Eine Abwägung für jetzt bewusst akzeptieren", whyItMayFit: "Nicht jede Spannung muss im gewählten Zeitraum gelöst werden.", firstStep: "Benenne, was du vorerst akzeptierst, was dadurch geschützt wird und wann du die Entscheidung erneut prüfen willst.", tradeoff: "Akzeptanz erhält Stabilität, lässt aber einen gewünschten Teil vorerst kleiner oder offen.", learningQuestion: "Fühlt sich die Abwägung mit Abstand weiterhin bewusst gewählt an oder nur vertagt?", reversibility: "Setze einen realistischen Zeitpunkt zur erneuten Betrachtung.", tools: [{ title: "Review-Termin", use: "Halte Entscheidung, geschützten Grund und konkreten Prüftermin fest." }] },
  "reversible-experiment": { title: "Einen kleinen reversiblen Versuch starten", whyItMayFit: "Ein begrenzter Test kann erfahrbar machen, wie eine gewünschte Richtung im Alltag wirkt.", firstStep: "Teste eine konkrete Veränderung klein genug, dass du sie ohne große Folgekosten beenden kannst.", tradeoff: "Ein kurzer Versuch bildet langfristige Bedingungen nur teilweise ab.", learningQuestion: "Welche beobachtbare Wirkung spricht für Fortsetzen, Anpassen oder Beenden?", reversibility: "Lege vorab Dauer, Abbruchbedingung und Rückkehr zum bisherigen Zustand fest.", tools: [{ title: "Versuchskarte", use: "Notiere Dauer, Veränderung, Beobachtungsfrage, Abbruchbedingung und Rückweg." }] },
  "external-support": { title: "Geeignete Unterstützung prüfen", whyItMayFit: "Einige Grenzen oder weitreichende Entscheidungen lassen sich mit passender Unterstützung verantwortlicher erkunden.", firstStep: "Kläre zuerst, welche Art von Unterstützung du brauchst und woran du ihre Eignung und Aktualität prüfen würdest.", tradeoff: "Unterstützung kann Zeit, Geld oder Offenheit erfordern und ersetzt nicht deine Entscheidung.", learningQuestion: "Welche konkrete Frage soll Unterstützung klären, und woran erkennst du passende Zuständigkeit?", reversibility: "Ein unverbindliches Erstgespräch oder eine Informationssuche ist noch keine längerfristige Bindung.", tools: [{ title: "Anforderungsnotiz", use: "Notiere Thema, gewünschte Hilfe, Qualifikationskriterium und eine Frage für den Erstkontakt." }] },
};

function buildActionPaths(answers: LifeVisionAnswers, areas: readonly LifeVisionAreaResult[]): LifeVisionActionPath[] {
  return answers.explorationModes.map((mode) => ({ mode, ...pathCopy[mode], evidence: pathEvidence(mode, answers, areas) }));
}

function joinAreaTitles(areas: readonly LifeVisionAreaResult[], fallback: string): string {
  return areas.length ? areas.map(({ title }) => title).join(", ") : fallback;
}

function buildVisualSnapshot(answers: LifeVisionAnswers, areas: readonly LifeVisionAreaResult[]) {
  const toward = areas.filter(({ emphasis }) => emphasis === "more" || emphasis === "different");
  const reduce = areas.filter(({ emphasis }) => emphasis === "less");
  const open = areas.filter(({ emphasis }) => emphasis === "uncertain" || emphasis === "intentionally-open");
  const protectedAreas = areas.filter(({ protected: isProtected }) => isProtected);
  const hasConstraints = !answers.constraintIds.includes("none");
  return {
    headline: toward.length && protectedAreas.length
      ? "Bewegung mit ausdrücklich geschützten Bedingungen"
      : open.length
        ? "Eine Richtung mit bewusst erhaltenem Möglichkeitsraum"
        : "Eine Richtung aus Veränderung und Kontinuität",
    description: `Für ${lowerFirst(lifeVisionHorizonOptions[answers.horizon!].label)} zeigt deine Auswahl keine Zielvorgabe, sondern eine Konfiguration, die du prüfen und verändern kannst.`,
    directionSummary: `Hin zu oder anders: ${joinAreaTitles(toward, "nichts ausdrücklich markiert")}. Weniger: ${joinAreaTitles(reduce, "nichts ausdrücklich markiert")}. Offen: ${joinAreaTitles(open, "nichts ausdrücklich markiert")}.`,
    protectionSummary: `Geschützt: ${joinAreaTitles(protectedAreas, "kein Bereich markiert")}. Tragende Bedingungen: ${answers.protectionIds.map((id) => lifeVisionProtectionOptions[id]).join("; ")}.`,
    contextSummary: hasConstraints
      ? `Die gewünschten Richtungen stehen neben ${answers.constraintIds.map((id) => lifeVisionConstraintOptions[id]).join(" ")}`
      : "Du hast derzeit keine konkrete Grenze festgehalten; das ist keine Aussage darüber, ob später Bedingungen sichtbar werden.",
  };
}

function buildDirectionMap(answers: LifeVisionAnswers, areas: readonly LifeVisionAreaResult[]) {
  const lane = (id: "protect" | "move-toward" | "reduce" | "keep-open", title: string, description: string, predicate: (area: LifeVisionAreaResult) => boolean) => ({
    id,
    title,
    description,
    areaIds: areas.filter(predicate).map(({ id: areaId }) => areaId),
  });
  return {
    lanes: [
      lane("protect", "Schützen", "Soll bei Veränderung nicht beiläufig verdrängt werden.", ({ protected: isProtected }) => isProtected),
      lane("move-toward", "Hin zu / anders", "Soll mehr Raum oder eine andere Form bekommen.", ({ emphasis }) => emphasis === "more" || emphasis === "different"),
      lane("reduce", "Weniger", "Soll weniger Raum oder Druck einnehmen.", ({ emphasis }) => emphasis === "less"),
      lane("keep-open", "Erhalten / offen halten", "Soll ähnlich bleiben oder bewusst noch nicht festgelegt werden.", ({ emphasis }) => emphasis === "similar" || emphasis === "uncertain" || emphasis === "intentionally-open"),
    ],
    constraintLabels: answers.constraintIds.filter((id) => id !== "none").map((id) => lifeVisionConstraintOptions[id]),
    tradeoffLabel: lifeVisionTradeoffOptions[answers.tradeoffStance!],
    sourceSignals: areas.map((area) => ({ areaTitle: area.title, labels: area.sourceLabels })),
  };
}

function buildClosingOrientation(answers: LifeVisionAnswers, areas: readonly LifeVisionAreaResult[], actionPaths: readonly LifeVisionActionPath[]) {
  const firstPath = actionPaths[0];
  const protectedArea = areas.find(({ protected: isProtected }) => isProtected);
  const openArea = areas.find(({ emphasis }) => emphasis === "uncertain" || emphasis === "intentionally-open");
  const evidence: LifeVisionEvidence[] = [
    ...(firstPath?.evidence ?? []),
    ...(protectedArea ? [{ label: "Geschützter Bereich", detail: protectedArea.title }] : []),
    { label: "Deine Abwägung", detail: lifeVisionTradeoffOptions[answers.tradeoffStance!] },
  ];
  return {
    headline: "Eine Orientierung zum Mitnehmen, kein fertiger Plan.",
    orientation: firstPath
      ? `Wenn du etwas weiterverfolgen möchtest, könntest du mit „${firstPath.title}“ beginnen – weil du diesen Weg selbst ausgewählt hast. Die übrigen Wege bleiben gleichberechtigte Alternativen.`
      : "Du musst aus dieser Reflexion noch keine Handlung ableiten.",
    questions: [
      protectedArea ? `Woran würdest du erkennen, dass ${protectedArea.title} bei einem nächsten Schritt tatsächlich geschützt bleibt?` : "Was soll bei einem nächsten Schritt unbedingt tragfähig bleiben?",
      openArea ? `Welche Information würde bei ${openArea.title} hilfreiche Klarheit schaffen, ohne Offenheit vorschnell zu beenden?` : "Welche kleine Beobachtung könnte deine gewählte Richtung bestätigen oder verändern?",
      "Wann möchtest du diese Momentaufnahme erneut ansehen – und was darf bis dahin bewusst ungeklärt bleiben?",
    ],
    evidence,
  };
}

export function buildLifeVisionResult(answers: LifeVisionAnswers): { status: "incomplete"; sectionIndex: number; message: string } | { status: "complete"; result: LifeVisionResult } {
  const invalidSection = firstInvalidLifeVisionSection(answers);
  if (invalidSection !== null) return { status: "incomplete", sectionIndex: invalidSection, message: validateLifeVisionSection(invalidSection, answers) ?? "Vervollständige deine Auswahl." };
  const areas = answers.selectedAreaIds.map((areaId) => makeAreaResult(answers, areaId));
  const competingAreas = areas.filter(({ id }) => answers.competingAreaIds.includes(id));
  const actionPaths = buildActionPaths(answers, areas);
  return {
    status: "complete",
    result: {
      title: "Deine Future Direction Landscape",
      description: "Eine erklärbare Darstellung deiner gewählten Zukunftsrichtungen, geschützten Prioritäten, offenen Fragen und heutigen Bedingungen. Du bestimmst, was davon für dich trägt.",
      horizonLabel: lifeVisionHorizonOptions[answers.horizon!].label,
      areas,
      protectedLabels: answers.protectionIds.map((id) => lifeVisionProtectionOptions[id]),
      constraintLabels: answers.constraintIds.filter((id) => id !== "none").map((id) => lifeVisionConstraintOptions[id]),
      competingAreas,
      tradeoffLabel: lifeVisionTradeoffOptions[answers.tradeoffStance!],
      visualSnapshot: buildVisualSnapshot(answers, areas),
      directionMap: buildDirectionMap(answers, areas),
      insights: buildInsights(answers, areas),
      actionPaths,
      closingOrientation: buildClosingOrientation(answers, areas, actionPaths),
    },
  };
}

function toggle<T>(values: readonly T[], value: T, max: number): readonly T[] {
  if (values.includes(value)) return values.filter((item) => item !== value);
  return values.length >= max ? values : [...values, value];
}

export function lifeVisionReducer(state: LifeVisionJourneyState, action: LifeVisionAction): LifeVisionJourneyState {
  if (action.type === "start") return { ...state, phase: "journey", validationMessage: null };
  if (action.type === "request-restart") return { ...state, restartPending: true };
  if (action.type === "cancel-restart") return { ...state, restartPending: false };
  if (action.type === "confirm-restart") return initialLifeVisionState;
  if (action.type === "edit-section") return { ...state, phase: "journey", sectionIndex: action.sectionIndex, validationMessage: null, restartPending: false };
  if (action.type === "back") return state.sectionIndex === 0 ? { ...state, phase: "intro", validationMessage: null } : { ...state, sectionIndex: state.sectionIndex - 1, validationMessage: null };
  if (action.type === "continue") {
    const message = validateLifeVisionSection(state.sectionIndex, state.answers);
    if (message) return { ...state, validationMessage: message };
    if (state.sectionIndex === lifeVisionSections.length - 1) return { ...state, phase: "result", validationMessage: null };
    return { ...state, sectionIndex: state.sectionIndex + 1, validationMessage: null };
  }

  let answers = state.answers;
  if (action.type === "set-horizon") answers = { ...answers, horizon: action.value };
  if (action.type === "toggle-area") {
    const selectedAreaIds = toggle(answers.selectedAreaIds, action.areaId, 6);
    const stillSelected = selectedAreaIds.includes(action.areaId);
    answers = {
      ...answers,
      selectedAreaIds,
      protectedAreaIds: stillSelected ? answers.protectedAreaIds : answers.protectedAreaIds.filter((id) => id !== action.areaId),
      competingAreaIds: stillSelected ? answers.competingAreaIds : answers.competingAreaIds.filter((id) => id !== action.areaId),
    };
  }
  if (action.type === "set-emphasis") answers = { ...answers, emphasisByArea: { ...answers.emphasisByArea, [action.areaId]: action.value } };
  if (action.type === "toggle-protected-area") answers = { ...answers, protectedAreaIds: toggle(answers.protectedAreaIds, action.areaId, 3) };
  if (action.type === "toggle-protection") answers = { ...answers, protectionIds: toggle(answers.protectionIds, action.protectionId, 3) };
  if (action.type === "toggle-source") {
    const current = answers.sourcesByArea[action.areaId] ?? [];
    let next: readonly LifeVisionSource[];
    if (action.value === "uncertain") next = current.includes("uncertain") ? [] : ["uncertain"];
    else next = toggle(current.filter((source) => source !== "uncertain"), action.value, 2);
    answers = { ...answers, sourcesByArea: { ...answers.sourcesByArea, [action.areaId]: next } };
  }
  if (action.type === "toggle-constraint") {
    const current = answers.constraintIds;
    const constraintIds = action.constraintId === "none"
      ? current.includes("none") ? [] : ["none"] as const
      : toggle(current.filter((id) => id !== "none"), action.constraintId, 3);
    answers = { ...answers, constraintIds };
  }
  if (action.type === "toggle-competing-area") answers = { ...answers, competingAreaIds: toggle(answers.competingAreaIds, action.areaId, 2) };
  if (action.type === "set-tradeoff") answers = { ...answers, tradeoffStance: action.value };
  if (action.type === "toggle-exploration") answers = { ...answers, explorationModes: toggle(answers.explorationModes, action.value, 4) };
  return { ...state, answers, validationMessage: null };
}
