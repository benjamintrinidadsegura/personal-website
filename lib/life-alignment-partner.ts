import {
  partnerCertaintyOptions,
  partnerConstraintOptions,
  partnerDimensions,
  partnerDirectionOptions,
  partnerDifferenceStanceOptions,
  partnerExpectationClarityOptions,
  partnerExperienceOptions,
  partnerFindingLabels,
  partnerImportanceOptions,
  partnerPathCopy,
} from "@/data/life-alignment-partner";
import type {
  PartnerActionPath,
  PartnerActionPathId,
  PartnerComparisonFinding,
  PartnerComparisonResult,
  PartnerComparisonTrack,
  PartnerConversationTool,
  PartnerDimensionAnswer,
  PartnerDimensionId,
  PartnerEvidenceReference,
  PartnerFindingCategory,
  PartnerJourneyAction,
  PartnerJourneyState,
  PartnerExperiment,
  PartnerParticipantAnswers,
  PartnerParticipantId,
  PartnerSharedContextSignal,
} from "@/types/life-alignment-partner";
import { PARTNER_DISCLAIMER } from "@/data/life-alignment-partner";
import type { Locale } from "@/lib/i18n/config";
import { localizePartnerComparisonResult } from "@/lib/life-alignment-localization";
import { lifeUiValue } from "@/data/i18n/life-alignment-ui";

const MIN_DIMENSIONS = 3;
const MAX_DIMENSIONS = 6;
const FINDING_CATEGORY_ORDER: readonly PartnerFindingCategory[] = [
  "shared-ground",
  "different-expectations",
  "direction-difference",
  "uncertainty",
  "accepted-difference",
  "present-constraint",
  "worth-discussing",
  "not-assessed-by-both",
];

export const initialPartnerParticipantAnswers: PartnerParticipantAnswers = {
  selectedDimensionIds: [],
  sensitiveOptIns: [],
  dimensions: {},
  comparisonConsent: false,
};

export const initialPartnerJourneyState: PartnerJourneyState = {
  phase: "intro",
  sectionIndex: 0,
  participants: { a: initialPartnerParticipantAnswers, b: initialPartnerParticipantAnswers },
  participantASealed: false,
  validationMessage: null,
  restartPending: false,
};

export function formatPartnerSelectionCount(selected: number, locale: Locale = "de"): string {
  const words = {
    de: ["von", "ausgewählt", "gültige Auswahl", "benötigt"], en: ["of", "selected", "valid selection", "required"], es: ["de", "seleccionados", "selección válida", "necesarios"], tr: ["/", "seçili", "geçerli seçim", "gerekli"], pl: ["z", "wybrano", "prawidłowy wybór", "wymagane"], el: ["από", "επιλεγμένα", "έγκυρη επιλογή", "απαιτούνται"], ru: ["из", "выбрано", "допустимый выбор", "требуется"],
  } satisfies Record<Locale, readonly [string, string, string, string]>;
  const copy = words[locale];
  const validity = selected >= MIN_DIMENSIONS && selected <= MAX_DIMENSIONS ? copy[2] : `${MIN_DIMENSIONS}–${MAX_DIMENSIONS} ${copy[3]}`;
  return `${selected} ${copy[0]} ${MAX_DIMENSIONS} ${copy[1]} · ${validity}`;
}

export function activePartnerParticipant(state: PartnerJourneyState): PartnerParticipantId | null {
  if (state.phase === "participant-a") return "a";
  if (state.phase === "participant-b") return "b";
  return null;
}

export function validatePartnerSection(sectionIndex: number, answers: PartnerParticipantAnswers, locale: Locale = "de"): string | null {
  const message = (english: string, german: string) => lifeUiValue(locale, english, german);
  const selected = [...new Set(answers.selectedDimensionIds)];
  if (sectionIndex === 0) {
    if (selected.length < MIN_DIMENSIONS || selected.length > MAX_DIMENSIONS) return message("Select three to six topics for your own perspective.", "Wähle drei bis sechs Themen für deine eigene Perspektive aus.");
    const invalidSensitive = selected.some((id) => partnerDimensions.find((dimension) => dimension.id === id)?.sensitive && !answers.sensitiveOptIns.includes(id));
    return invalidSensitive ? message("Include a sensitive topic only after explicit opt-in.", "Beziehe ein sensibles Thema nur nach ausdrücklicher Zustimmung ein.") : null;
  }

  if (sectionIndex === 1) {
    return selected.every((id) => {
      const answer = answers.dimensions[id];
      return Boolean(answer?.experience && answer.importance && answer.certainty);
    }) ? null : message("For every selected topic, describe your current experience, its importance and your certainty.", "Ordne für jedes gewählte Thema dein heutiges Erleben, seine Bedeutung und deine Sicherheit ein.");
  }

  if (sectionIndex === 2) {
    return selected.every((id) => {
      const answer = answers.dimensions[id];
      return Boolean(answer?.desiredDirection && answer.expectationClarity && answer.differenceStance && answer.constraint);
    }) ? null : message("For every selected topic, describe direction, expectation, possible difference and current room.", "Ordne für jedes gewählte Thema Richtung, Erwartung, mögliche Differenz und heutigen Spielraum ein.");
  }

  if (!answers.comparisonConsent) return message("Confirm that these structured answers may be included in the shared comparison.", "Bestätige erst, dass diese strukturierten Antworten in die gemeinsame Gegenüberstellung einfließen dürfen.");
  return null;
}

export function firstInvalidPartnerSection(answers: PartnerParticipantAnswers, locale: Locale = "de"): number | null {
  for (let sectionIndex = 0; sectionIndex < 4; sectionIndex += 1) {
    if (validatePartnerSection(sectionIndex, answers, locale)) return sectionIndex;
  }
  return null;
}

function updateParticipant(state: PartnerJourneyState, participantId: PartnerParticipantId, answers: PartnerParticipantAnswers): PartnerJourneyState {
  return { ...state, participants: { ...state.participants, [participantId]: answers }, validationMessage: null };
}

function toggleInList<T>(items: readonly T[], item: T): readonly T[] {
  return items.includes(item) ? items.filter((candidate) => candidate !== item) : [...items, item];
}

export function partnerJourneyReducer(state: PartnerJourneyState, action: PartnerJourneyAction, locale: Locale = "de"): PartnerJourneyState {
  if (action.type === "start") return state.phase === "intro" ? { ...state, phase: "participant-a", sectionIndex: 0 } : state;
  if (action.type === "request-restart") return { ...state, restartPending: true };
  if (action.type === "cancel-restart") return { ...state, restartPending: false };
  if (action.type === "confirm-restart") return initialPartnerJourneyState;
  if (action.type === "begin-participant-b") return state.phase === "handoff" && state.participantASealed
    ? { ...state, phase: "participant-b", sectionIndex: 0, validationMessage: null }
    : state;

  const participantId = activePartnerParticipant(state);
  if (!participantId) return state;
  const answers = state.participants[participantId];

  if (action.type === "toggle-sensitive-opt-in") {
    const definition = partnerDimensions.find(({ id }) => id === action.dimensionId);
    if (!definition?.sensitive) return state;
    const optedIn = answers.sensitiveOptIns.includes(action.dimensionId);
    const next: PartnerParticipantAnswers = {
      ...answers,
      sensitiveOptIns: toggleInList(answers.sensitiveOptIns, action.dimensionId),
      selectedDimensionIds: optedIn ? answers.selectedDimensionIds.filter((id) => id !== action.dimensionId) : answers.selectedDimensionIds,
      dimensions: optedIn ? Object.fromEntries(Object.entries(answers.dimensions).filter(([id]) => id !== action.dimensionId)) : answers.dimensions,
      comparisonConsent: false,
    };
    return updateParticipant(state, participantId, next);
  }

  if (action.type === "toggle-dimension") {
    const definition = partnerDimensions.find(({ id }) => id === action.dimensionId);
    if (!definition || definition.sensitive && !answers.sensitiveOptIns.includes(action.dimensionId)) return state;
    const alreadySelected = answers.selectedDimensionIds.includes(action.dimensionId);
    if (!alreadySelected && answers.selectedDimensionIds.length >= MAX_DIMENSIONS) return state;
    const dimensions = alreadySelected
      ? Object.fromEntries(Object.entries(answers.dimensions).filter(([id]) => id !== action.dimensionId))
      : answers.dimensions;
    return updateParticipant(state, participantId, {
      ...answers,
      selectedDimensionIds: toggleInList(answers.selectedDimensionIds, action.dimensionId),
      dimensions,
      comparisonConsent: false,
    });
  }

  if (action.type === "set-dimension-answer") {
    if (!answers.selectedDimensionIds.includes(action.dimensionId)) return state;
    const dimension = { ...answers.dimensions[action.dimensionId], [action.field]: action.value } as PartnerDimensionAnswer;
    return updateParticipant(state, participantId, {
      ...answers,
      dimensions: { ...answers.dimensions, [action.dimensionId]: dimension },
      comparisonConsent: false,
    });
  }

  if (action.type === "set-comparison-consent") {
    return updateParticipant(state, participantId, { ...answers, comparisonConsent: action.value });
  }

  if (action.type === "back") {
    if (state.sectionIndex === 0) return state;
    return { ...state, sectionIndex: state.sectionIndex - 1, validationMessage: null };
  }

  if (action.type === "continue") {
    const validationMessage = validatePartnerSection(state.sectionIndex, answers, locale);
    if (validationMessage) return { ...state, validationMessage };
    return state.sectionIndex < 3 ? { ...state, sectionIndex: state.sectionIndex + 1, validationMessage: null } : state;
  }

  if (action.type === "seal-participant-a") {
    if (participantId !== "a") return state;
    const invalid = firstInvalidPartnerSection(answers);
    if (invalid !== null) return { ...state, sectionIndex: invalid, validationMessage: validatePartnerSection(invalid, answers) };
    return { ...state, phase: "handoff", sectionIndex: 0, participantASealed: true, validationMessage: null };
  }

  if (action.type === "finish-participant-b") {
    if (participantId !== "b" || !state.participantASealed) return state;
    const invalid = firstInvalidPartnerSection(answers);
    if (invalid !== null) return { ...state, sectionIndex: invalid, validationMessage: validatePartnerSection(invalid, answers) };
    return { ...state, phase: "result", sectionIndex: 0, validationMessage: null };
  }

  return state;
}

function evidence(participant: PartnerParticipantId, dimensionId: PartnerDimensionId, field: keyof PartnerDimensionAnswer | "selected", label: string): PartnerEvidenceReference {
  return { participant, dimensionId, field, label };
}

function dimensionTitle(dimensionId: PartnerDimensionId): string {
  return partnerDimensions.find(({ id }) => id === dimensionId)?.title ?? dimensionId;
}

function dimensionList(dimensionIds: readonly PartnerDimensionId[]): string {
  const titles = dimensionIds.map(dimensionTitle);
  if (titles.length <= 1) return titles[0] ?? "diesem Thema";
  return `${titles.slice(0, -1).join(", ")} und ${titles.at(-1)}`;
}

function everydayExampleList(dimensionIds: readonly PartnerDimensionId[]): readonly string[] {
  const dimensions = dimensionIds.map((id) => partnerDimensions.find((dimension) => dimension.id === id)).filter((dimension) => dimension !== undefined);
  if (dimensions.length === 1) return dimensions[0].examples;
  return dimensions.slice(0, 3).map(({ examples }) => examples[0]);
}

const findingGuidance: Readonly<Record<PartnerFindingCategory, { whatCouldBeLearned: string; boundary: string }>> = {
  "shared-ground": {
    whatCouldBeLearned: "Ob ihr mit derselben Richtung auch dasselbe konkrete Verhalten meint und welche kleine Form für beide tragfähig wäre.",
    boundary: "Eine gemeinsame Richtung ist noch keine vollständige Vereinbarung und verpflichtet niemanden zu einer bestimmten Umsetzung.",
  },
  "different-expectations": {
    whatCouldBeLearned: "Ob die Erwartungen tatsächlich verschieden sind oder nur mit unterschiedlichen Beispielen und Worten beschrieben wurden.",
    boundary: "Klarheit verpflichtet euch weder zur Einigung noch dazu, eine Erwartung zu erfüllen.",
  },
  "direction-difference": {
    whatCouldBeLearned: "Welche konkreten Alltagssituationen hinter den verschiedenen Richtungswörtern stehen und wo eine echte Spannung beginnt.",
    boundary: "Eine Differenz muss nicht sofort gelöst oder durch einen Kompromiss eingeebnet werden.",
  },
  uncertainty: {
    whatCouldBeLearned: "Welche Information heute fehlt, welche frühere Annahme noch gilt und was bewusst offenbleiben soll.",
    boundary: "Offenheit ist ein zulässiges Ergebnis. Ein Gespräch oder eine Entscheidung ist nicht erforderlich.",
  },
  "accepted-difference": {
    whatCouldBeLearned: "Ob die Differenz mit klarer Rücksicht für beide tragfähig bleibt oder weiterhin einseitige Kosten erzeugt.",
    boundary: "Akzeptanz ersetzt keine Zustimmung zu einem konkreten Verhalten und hebt persönliche Grenzen nicht auf.",
  },
  "present-constraint": {
    whatCouldBeLearned: "Welcher Teil der Begrenzung heute fest ist, welcher verhandelbar bleibt und welche kleinere Form realistisch wäre.",
    boundary: "Ein Wunsch erzeugt keine Pflicht, vorhandene Kapazität oder praktische Sicherheit zu übergehen.",
  },
  "worth-discussing": {
    whatCouldBeLearned: "Ob hinter der sichtbaren Differenz verschiedene Erwartungen, verschiedene Beispiele oder tatsächlich konkurrierende Bedürfnisse stehen.",
    boundary: "Klärung ist nur eine Option. Pausieren, offenlassen oder nicht gemeinsam sprechen ist ebenfalls zulässig.",
  },
  "not-assessed-by-both": {
    whatCouldBeLearned: "Ob das Thema für eine gemeinsame Betrachtung relevant, heute zu sensibel oder bewusst außerhalb dieser Reflexion bleiben soll.",
    boundary: "Die unterschiedliche Themenwahl erlaubt keine Aussage über Interesse, Nähe, Vermeidung oder die Qualität eurer Beziehung.",
  },
};

function completeAnswer(answer: PartnerDimensionAnswer): Required<PartnerDimensionAnswer> {
  return answer as Required<PartnerDimensionAnswer>;
}

function trackPerspective(answer: PartnerDimensionAnswer) {
  const complete = completeAnswer(answer);
  return {
    experience: complete.experience,
    experienceLabel: partnerExperienceOptions[complete.experience],
    desiredDirection: complete.desiredDirection,
    directionLabel: partnerDirectionOptions[complete.desiredDirection],
    importance: complete.importance,
    importanceLabel: partnerImportanceOptions[complete.importance],
    certainty: complete.certainty,
    certaintyLabel: partnerCertaintyOptions[complete.certainty],
    expectationClarity: complete.expectationClarity,
    expectationClarityLabel: partnerExpectationClarityOptions[complete.expectationClarity],
    differenceStance: complete.differenceStance,
    differenceStanceLabel: partnerDifferenceStanceOptions[complete.differenceStance],
    constraint: complete.constraint,
    constraintLabel: partnerConstraintOptions[complete.constraint],
  };
}

function buildTracks(participants: Readonly<Record<PartnerParticipantId, PartnerParticipantAnswers>>): readonly PartnerComparisonTrack[] {
  return partnerDimensions.flatMap((dimension) => {
    const a = participants.a.selectedDimensionIds.includes(dimension.id) ? participants.a.dimensions[dimension.id] : undefined;
    const b = participants.b.selectedDimensionIds.includes(dimension.id) ? participants.b.dimensions[dimension.id] : undefined;
    if (!a && !b) return [];
    return [{
      dimensionId: dimension.id,
      dimensionTitle: dimension.title,
      sensitive: Boolean(dimension.sensitive),
      participantA: a ? trackPerspective(a) : null,
      participantB: b ? trackPerspective(b) : null,
    }];
  });
}

function directionEvidence(track: PartnerComparisonTrack): readonly PartnerEvidenceReference[] {
  return (["a", "b"] as const).flatMap((participant) => {
    const perspective = participant === "a" ? track.participantA : track.participantB;
    return perspective ? [evidence(participant, track.dimensionId, "desiredDirection", perspective.directionLabel)] : [];
  });
}

function makeSynthesizedFinding({ id, category, tracks, headline, explanation, everydayTranslation, questions, possibleNextSteps, evidence: references }: {
  id: string;
  category: PartnerFindingCategory;
  tracks: readonly PartnerComparisonTrack[];
  headline: string;
  explanation: string;
  everydayTranslation: string;
  questions: readonly string[];
  possibleNextSteps: readonly [string, string, string];
  evidence: readonly PartnerEvidenceReference[];
}): PartnerComparisonFinding {
  const dimensionIds = tracks.map(({ dimensionId }) => dimensionId);
  return {
    id,
    category,
    categoryLabel: partnerFindingLabels[category],
    headline,
    explanation,
    everydayTranslation,
    everydayExamples: everydayExampleList(dimensionIds),
    dimensionIds,
    questions,
    possibleNextSteps,
    ...findingGuidance[category],
    evidence: references,
  };
}

function hasUncertainty(track: PartnerComparisonTrack): boolean {
  if (!track.participantA || !track.participantB) return true;
  return [track.participantA, track.participantB].some((perspective) => perspective.certainty === "unsure" || perspective.desiredDirection === "open" || ["currently-unclear", "discussed-before-current-unclear"].includes(perspective.expectationClarity));
}

function directionsDiffer(track: PartnerComparisonTrack): boolean {
  return Boolean(track.participantA && track.participantB && track.participantA.desiredDirection !== "open" && track.participantB.desiredDirection !== "open" && track.participantA.desiredDirection !== track.participantB.desiredDirection);
}

function isConversationPriority(track: PartnerComparisonTrack): boolean {
  if (!directionsDiffer(track) || !track.participantA || !track.participantB) return false;
  const important = [track.participantA, track.participantB].some(({ importance }) => importance === "important");
  const explicitlyDiscuss = [track.participantA, track.participantB].some(({ differenceStance }) => differenceStance === "discuss");
  const notCurrent = [track.participantA, track.participantB].some(({ expectationClarity }) => expectationClarity !== "current-confirmed" && expectationClarity !== "intentionally-open");
  return important && (explicitlyDiscuss || notCurrent);
}

function buildSynthesizedFindings(tracks: readonly PartnerComparisonTrack[]): readonly PartnerComparisonFinding[] {
  const overlap = tracks.filter((track) => track.participantA && track.participantB);
  const conversation = overlap.filter(isConversationPriority);
  const shared = overlap.filter((track) => track.participantA!.desiredDirection === track.participantB!.desiredDirection && track.participantA!.desiredDirection !== "open");
  const remainingDifferences = overlap.filter((track) => directionsDiffer(track) && !conversation.includes(track));
  const constrained = overlap.filter((track) => [track.participantA!, track.participantB!].some(({ constraint }) => constraint !== "none") && [track.participantA!, track.participantB!].some(({ desiredDirection }) => desiredDirection !== "similar"));
  const uncertain = overlap.filter(hasUncertainty);
  const accepted = overlap.filter((track) => directionsDiffer(track) && [track.participantA!, track.participantB!].some(({ differenceStance }) => differenceStance === "acceptable"));
  const oneSided = tracks.filter((track) => !track.participantA || !track.participantB);
  const findings: PartnerComparisonFinding[] = [];

  if (conversation.length) findings.push(makeSynthesizedFinding({
    id: "conversation-priorities",
    category: "worth-discussing",
    tracks: conversation,
    headline: `Bei ${dimensionList(conversation.map(({ dimensionId }) => dimensionId))} treffen wichtige, unterschiedliche Richtungen auf noch nicht gemeinsam bestätigte Erwartungen.`,
    explanation: "Diese Kombination macht ein Gespräch konkreter als eine allgemeine Aussage über gute oder schlechte Kommunikation: Mindestens eine Person nennt das Thema wichtig, eure Richtungen unterscheiden sich und mindestens eine aktuelle Erwartung ist angenommen, unklar oder ausdrücklich gesprächsbedürftig.",
    everydayTranslation: "Nehmt nicht das ganze Beziehungsthema auf einmal. Ein einzelner beobachtbarer Moment macht Wünsche, Grenzen und Erwartungen oft verständlicher als eine Aussage über die gesamte Beziehung.",
    questions: ["Was erwartest du in einem konkreten solchen Moment – und woran könnte ich das erkennen?", "Was davon ist ein Wunsch, was eine Grenze und was heute nur eine Annahme?"],
    possibleNextSteps: ["Eine heutige Erwartung mit einem konkreten Beispiel aktualisieren.", "Das Werkzeug „Sprechen · Spiegeln · Korrigieren“ für genau ein Thema nutzen.", "Eine kleine praktische Absprache mit festem Prüfzeitpunkt testen."],
    evidence: conversation.flatMap((track) => [
      ...directionEvidence(track),
      ...(["a", "b"] as const).flatMap((participant) => {
        const perspective = participant === "a" ? track.participantA! : track.participantB!;
        return [
          evidence(participant, track.dimensionId, "importance", perspective.importanceLabel),
          evidence(participant, track.dimensionId, "expectationClarity", perspective.expectationClarityLabel),
        ];
      }),
    ]),
  }));

  if (shared.length) findings.push(makeSynthesizedFinding({
    id: "shared-directions",
    category: "shared-ground",
    tracks: shared,
    headline: `Bei ${dimensionList(shared.map(({ dimensionId }) => dimensionId))} nennt ihr dieselbe gewünschte Richtung.`,
    explanation: "Das ist ein brauchbarer gemeinsamer Ausgangspunkt. Es bedeutet noch nicht, dass ihr dasselbe konkrete Verhalten meint oder heute gleich viel Kapazität dafür habt.",
    everydayTranslation: "Prüft die gemeinsame Richtung an einem konkreten Alltagssignal. Dasselbe Richtungswort kann für euch unterschiedliche Situationen oder Formen meinen.",
    questions: ["Woran würden wir beide in einer gewöhnlichen Woche erkennen, dass diese Richtung mehr Raum erhält?", "Welche kleine Form wäre für beide hilfreich, ohne daraus eine dauerhafte Pflicht zu machen?"],
    possibleNextSteps: ["Je ein beobachtbares Zeichen für die gemeinsame Richtung nennen.", "Die kleinste freiwillige Version einmal ausprobieren.", "Bewusst festhalten, dass heute noch keine Veränderung nötig ist."],
    evidence: shared.flatMap(directionEvidence),
  }));

  if (remainingDifferences.length) findings.push(makeSynthesizedFinding({
    id: "other-direction-differences",
    category: "direction-difference",
    tracks: remainingDifferences,
    headline: `Eure gewünschten Richtungen unterscheiden sich bei ${dimensionList(remainingDifferences.map(({ dimensionId }) => dimensionId))}.`,
    explanation: "Eine Differenz beschreibt zwei gültige Perspektiven. Sie sagt weder, dass die Beziehung nicht passt, noch welche Person nachgeben sollte.",
    everydayTranslation: "Übersetzt „mehr“, „weniger“ oder „anders“ zuerst in beobachtbare Situationen. Oft wird erst dann klar, ob ihr wirklich Unterschiedliches wollt oder nur andere Beispiele im Kopf habt.",
    questions: ["Welches konkrete Verhalten steckt für jede Person hinter der gewählten Richtung?", "Welche Teile der Wünsche könnten gleichzeitig Platz haben, welche stehen tatsächlich in Spannung?"],
    possibleNextSteps: ["Die Richtungswörter getrennt in konkrete Alltagssituationen übersetzen.", "Überschneidungen und echte Gegensätze sichtbar markieren.", "Eine Differenz bewusst offenlassen oder mit einer reversiblen Absprache erkunden."],
    evidence: remainingDifferences.flatMap(directionEvidence),
  }));

  if (constrained.length) findings.push(makeSynthesizedFinding({
    id: "direction-meets-constraints",
    category: "present-constraint",
    tracks: constrained,
    headline: `Bei ${dimensionList(constrained.map(({ dimensionId }) => dimensionId))} steht mindestens ein Veränderungswunsch neben einer realen heutigen Begrenzung.`,
    explanation: "Die Begrenzung wird nicht als mangelndes Interesse gedeutet. Hilfreich ist, Wunsch, verfügbare Kapazität und praktische Abhängigkeiten getrennt zu benennen.",
    everydayTranslation: "Fragt bei einem konkreten Moment nicht nur „Was wollen wir?“, sondern auch „Was ist diese Woche realistisch möglich?“. So bleibt eine reale Grenze sichtbar, ohne den Wunsch abzuwerten.",
    questions: ["Welche Begrenzung ist heute tatsächlich fix, und welche beruht noch auf einer Annahme?", "Welche kleinere Form würde den Wunsch anerkennen, ohne vorhandene Kapazität zu übergehen?"],
    possibleNextSteps: ["Wunsch und heutige Grenze in zwei getrennten Sätzen benennen.", "Eine fehlende praktische Information klären.", "Eine kleinere kapazitätsgerechte Version mit Stoppsignal testen."],
    evidence: constrained.flatMap((track) => (["a", "b"] as const).flatMap((participant) => {
      const perspective = participant === "a" ? track.participantA! : track.participantB!;
      return perspective.constraint === "none" ? [] : [evidence(participant, track.dimensionId, "constraint", perspective.constraintLabel)];
    })),
  }));

  if (uncertain.length) findings.push(makeSynthesizedFinding({
    id: "open-information",
    category: "uncertainty",
    tracks: uncertain,
    headline: `Bei ${dimensionList(uncertain.map(({ dimensionId }) => dimensionId))} fehlt noch Sicherheit oder eine aktuelle gemeinsame Klärung.`,
    explanation: "Offenheit und Unsicherheit sind Informationen. Das Ergebnis ergänzt keine vermutete Absicht der anderen Person und behandelt frühere Gespräche nicht automatisch als heute gültige Vereinbarung.",
    everydayTranslation: "Ein hilfreicher nächster Schritt kann darin bestehen, nur zu aktualisieren, was heute noch gilt – ohne im selben Gespräch schon eine Lösung zu verlangen.",
    questions: ["Was weiß ich aus einem aktuellen Gespräch, und was nehme ich nur an?", "Welche eine Information würde meine Einordnung verändern oder klarer machen?"],
    possibleNextSteps: ["Nur den heutigen Stand einer Erwartung erfragen.", "Ein konkretes Beispiel sammeln, ohne es sofort zu bewerten.", "Die Frage mit einem vereinbarten späteren Zeitpunkt bewusst offenlassen."],
    evidence: uncertain.flatMap((track) => (["a", "b"] as const).flatMap((participant) => {
      const perspective = participant === "a" ? track.participantA! : track.participantB!;
      const references: PartnerEvidenceReference[] = [];
      if (perspective.certainty === "unsure") references.push(evidence(participant, track.dimensionId, "certainty", perspective.certaintyLabel));
      if (perspective.desiredDirection === "open") references.push(evidence(participant, track.dimensionId, "desiredDirection", perspective.directionLabel));
      if (["currently-unclear", "discussed-before-current-unclear"].includes(perspective.expectationClarity)) references.push(evidence(participant, track.dimensionId, "expectationClarity", perspective.expectationClarityLabel));
      return references;
    })),
  }));

  if (accepted.length) findings.push(makeSynthesizedFinding({
    id: "accepted-differences",
    category: "accepted-difference",
    tracks: accepted,
    headline: `Bei ${dimensionList(accepted.map(({ dimensionId }) => dimensionId))} markiert mindestens eine Person eine mögliche Differenz als akzeptabel.`,
    explanation: "Nicht jede Differenz muss gelöst werden. Akzeptanz ist dennoch keine Zustimmung zu einem konkreten Verhalten und darf Grenzen oder Auswirkungen auf die andere Person nicht unsichtbar machen.",
    everydayTranslation: "Benennt, was verschieden bleiben darf, und ergänzt eine konkrete Rücksicht, die verhindert, dass eine Person die Kosten allein trägt.",
    questions: ["Was genau darf verschieden bleiben?", "Welche Rücksicht oder Grenze braucht es, damit diese Differenz für beide tragfähig ist?"],
    possibleNextSteps: ["Benennen, welcher Teil ausdrücklich verschieden bleiben darf.", "Eine notwendige Rücksicht oder Grenze vereinbaren.", "Nach einem festgelegten Zeitraum prüfen, ob die Kosten weiterhin für beide tragfähig sind."],
    evidence: accepted.flatMap((track) => (["a", "b"] as const).flatMap((participant) => {
      const perspective = participant === "a" ? track.participantA! : track.participantB!;
      return perspective.differenceStance === "acceptable" ? [evidence(participant, track.dimensionId, "differenceStance", perspective.differenceStanceLabel)] : [];
    })),
  }));

  if (oneSided.length) findings.push(makeSynthesizedFinding({
    id: "not-assessed-by-both",
    category: "not-assessed-by-both",
    tracks: oneSided,
    headline: `${dimensionList(oneSided.map(({ dimensionId }) => dimensionId))} wurde nicht von beiden Personen eingeschätzt.`,
    explanation: "Daraus wird bewusst weder Übereinstimmung noch Differenz abgeleitet. Die unterschiedliche Themenwahl kann selbst eine hilfreiche Frage sein, muss aber keine Bedeutung haben.",
    everydayTranslation: "Falls ihr möchtet, könnt ihr später nur klären, ob das Thema für die andere Person nicht relevant, zu sensibel oder heute einfach nicht ausgewählt war.",
    questions: ["Möchten wir dieses Thema überhaupt gemeinsam öffnen?", "Welche Antwort – auch ein Nein oder Noch-nicht – braucht dabei Respekt?"],
    possibleNextSteps: ["Die unterschiedliche Auswahl ohne Deutung zur Kenntnis nehmen.", "Um freiwillige Zustimmung bitten, das Thema später zu öffnen.", "Das Thema vollständig außerhalb dieser gemeinsamen Auswertung lassen."],
    evidence: oneSided.flatMap((track) => {
      const participant = track.participantA ? "a" : "b";
      return [evidence(participant, track.dimensionId, "selected", "Thema für die eigene Perspektive ausgewählt")];
    }),
  }));

  return findings;
}

function uniqueDimensionIds(dimensionIds: readonly PartnerDimensionId[]): readonly PartnerDimensionId[] {
  return [...new Set(dimensionIds)];
}

function buildSharedOverview(tracks: readonly PartnerComparisonTrack[], findings: readonly PartnerComparisonFinding[]): readonly PartnerSharedContextSignal[] {
  const overlap = tracks.filter((track) => track.participantA && track.participantB);
  const shared = overlap.filter((track) => track.participantA!.desiredDirection === track.participantB!.desiredDirection && track.participantA!.desiredDirection !== "open");
  const different = overlap.filter((track) => directionsDiffer(track) || track.participantA!.experience !== track.participantB!.experience);
  const open = tracks.filter(hasUncertainty);
  const constrained = tracks.filter((track) => [track.participantA, track.participantB].some((perspective) => perspective && perspective.constraint !== "none"));
  const conversationDimensionIds = uniqueDimensionIds(findings.filter(({ category }) => ["worth-discussing", "different-expectations", "direction-difference"].includes(category)).flatMap(({ dimensionIds }) => dimensionIds));
  const oneSided = tracks.filter((track) => !track.participantA || !track.participantB);
  const signals: PartnerSharedContextSignal[] = [];

  if (overlap.length) signals.push({
    id: "shared-ground",
    label: "Gemeinsame Basis",
    headline: shared.length ? `Bei ${dimensionList(shared.map(({ dimensionId }) => dimensionId))} erscheint eine gemeinsame gewünschte Richtung.` : "Mindestens ein Bereich wurde von euch beiden betrachtet.",
    explanation: shared.length ? "Das ist ein möglicher Ausgangspunkt. Ob ihr damit dieselben Alltagssituationen meint, bleibt bewusst eine offene Frage." : "Eine gemeinsame Betrachtung ist noch keine Übereinstimmung, schafft aber eine ausdrückliche Grundlage für die weiteren Hinweise.",
    dimensionIds: (shared.length ? shared : overlap).map(({ dimensionId }) => dimensionId),
  });

  if (different.length) signals.push({
    id: "different-perspectives",
    label: "Unterschiedliche Blickwinkel",
    headline: `Bei ${dimensionList(different.map(({ dimensionId }) => dimensionId))} erscheinen unterschiedliche Erfahrungen oder gewünschte Richtungen.`,
    explanation: "Das beschreibt zwei freigegebene Blickwinkel. Es ist kein Urteil darüber, wer recht hat oder wie gut eure Beziehung ist.",
    dimensionIds: different.map(({ dimensionId }) => dimensionId),
  });

  if (open.length) signals.push({
    id: "open-questions",
    label: "Noch nicht gemeinsam geklärt",
    headline: `Bei ${dimensionList(open.map(({ dimensionId }) => dimensionId))} bleiben Richtung, Erwartung oder gemeinsame Einordnung offen.`,
    explanation: "Offenheit kann auf fehlende Information, Unsicherheit, bewusste Nicht-Festlegung oder unterschiedliche Themenwahl zurückgehen. Das Ergebnis ergänzt keine Ursache.",
    dimensionIds: open.map(({ dimensionId }) => dimensionId),
  });

  if (constrained.length) signals.push({
    id: "current-constraints",
    label: "Aktuelle Bedingungen",
    headline: `Bei ${dimensionList(constrained.map(({ dimensionId }) => dimensionId))} beeinflusst mindestens eine heutige Begrenzung den Spielraum.`,
    explanation: "Zeit, Energie, praktische Bedingungen oder andere Verantwortungen werden als Kontext behandelt – nicht als mangelndes Interesse.",
    dimensionIds: constrained.map(({ dimensionId }) => dimensionId),
  });

  if (conversationDimensionIds.length) signals.push({
    id: "conversation-opportunities",
    label: "Mögliche Klärung",
    headline: `Bei ${dimensionList(conversationDimensionIds)} könnte eine freiwillige Klärung zusätzliche Information bringen.`,
    explanation: "Das ist keine Aufforderung, sofort zu sprechen. Pausieren, allein weiterdenken, Unterstützung erwägen oder etwas offenlassen bleiben gleichwertige Möglichkeiten.",
    dimensionIds: conversationDimensionIds,
  });

  if (oneSided.length) signals.push({
    id: "not-yet-explored-together",
    label: "Noch nicht gemeinsam betrachtet",
    headline: `${dimensionList(oneSided.map(({ dimensionId }) => dimensionId))} ${oneSided.length === 1 ? "war" : "waren"} nur Teil eines der beiden Durchgänge.`,
    explanation: "Daraus wird weder Desinteresse noch Vermeidung abgeleitet. Das Thema darf außerhalb dieser gemeinsamen Reflexion bleiben.",
    dimensionIds: oneSided.map(({ dimensionId }) => dimensionId),
  });

  return signals;
}

function path(id: PartnerActionPathId, findings: readonly PartnerComparisonFinding[], why: string): PartnerActionPath {
  return { id, ...partnerPathCopy[id], why, evidenceFindingIds: findings.map(({ id: findingId }) => findingId) };
}

function buildActionPaths(findings: readonly PartnerComparisonFinding[]): readonly PartnerActionPath[] {
  const by = (categories: readonly PartnerFindingCategory[]) => findings.filter(({ category }) => categories.includes(category));
  const paths: PartnerActionPath[] = [];
  const expectation = by(["different-expectations", "direction-difference"]);
  const uncertainty = by(["uncertainty", "not-assessed-by-both"]);
  const discussion = by(["worth-discussing"]);
  const accepted = by(["accepted-difference"]);
  const constrained = by(["present-constraint"]);
  const shared = by(["shared-ground"]);

  if (expectation.length || discussion.length) paths.push(path("clarify-expectation", [...expectation, ...discussion], "Eure Antworten zeigen unterschiedliche, angenommene oder ausdrücklich gesprächsbedürftige Erwartungen."));
  if (discussion.length || expectation.length) paths.push(path("conversation", [...discussion, ...expectation], "Mindestens ein Ergebnis wurde ausdrücklich als Gesprächsgegenstand sichtbar."));
  if ((expectation.length || discussion.length) && constrained.length) paths.push(path("practical-arrangement", [...expectation, ...discussion, ...constrained], "Eine wichtige Richtungs- oder Erwartungsdifferenz trifft auf einen ausdrücklich genannten begrenzten Spielraum."));
  if (uncertainty.length) paths.push(path("gather-information", uncertainty, "Offene Richtungen, Unsicherheit oder nur einseitig eingeschätzte Themen lassen noch keine gemeinsame Schlussfolgerung zu."));
  if (accepted.length) paths.push(path("accept-difference", accepted, "Mindestens eine Differenz wurde ausdrücklich als möglicherweise akzeptabel markiert."));
  if (shared.length) paths.push(path("reversible-change", shared, "Eine gemeinsam genannte Richtung bietet einen möglichen Ausgangspunkt für einen kleinen, begrenzten Versuch."));
  if (paths.length < 3) paths.push(path("leave-open", findings.slice(0, 3), "Die Gegenüberstellung muss nicht sofort in eine Entscheidung oder Veränderung führen."));
  if ((discussion.length || expectation.length) && paths.length < 6) paths.push(path("external-support", [...discussion, ...expectation], "Falls ein Thema allein schwer oder nicht sicher besprechbar ist, kann eine passende neutrale Unterstützung erwogen werden."));
  return paths.slice(0, 6);
}

function buildExperiments(findings: readonly PartnerComparisonFinding[]): readonly PartnerExperiment[] {
  const conversation = findings.filter(({ category }) => ["worth-discussing", "direction-difference", "different-expectations"].includes(category));
  const constraints = findings.filter(({ category }) => category === "present-constraint");
  const shared = findings.filter(({ category }) => category === "shared-ground");
  const open = findings.filter(({ category }) => ["uncertainty", "not-assessed-by-both"].includes(category));
  const first = conversation.length ? conversation : shared.length ? shared : findings.slice(0, 1);
  const second = constraints.length ? constraints : open.length ? open : findings.slice(0, 1);
  return [
    { id: "one-moment", title: "Ein konkreter Moment statt das ganze Thema", why: "Abstrakte Richtungswörter werden brauchbarer, wenn beide dieselbe Alltagssituation beschreiben.", steps: ["Wählt gemeinsam nur einen der sichtbaren Themenbereiche.", "Jede Person beschreibt einen konkreten Moment aus der letzten oder nächsten Woche – ohne die Absicht der anderen zu deuten.", "Vergleicht, welches Bedürfnis, welche Grenze und welche Erwartung darin jeweils sichtbar werden."], observationQuestion: "Ist eure Differenz nach dem konkreten Beispiel kleiner, präziser oder unverändert?", whatCouldBeLearned: "Ob ihr vor allem verschiedene Wörter, verschiedene Situationen oder tatsächlich konkurrierende Bedürfnisse meint.", stopBoundary: "Beendet den Versuch, wenn eine Person Druck, Abwertung oder fehlende Sicherheit erlebt. Eine Lösung ist nicht erforderlich.", evidenceFindingIds: first.map(({ id }) => id) },
    { id: "capacity-version", title: "Die kleinste kapazitätsgerechte Version", why: constraints.length ? "Eure Antworten verbinden gewünschte Bewegung mit ausdrücklich genanntem begrenztem Spielraum." : "Eine kleine Version prüft eine Richtung, ohne daraus sofort eine dauerhafte Pflicht zu machen.", steps: ["Formuliert die gewünschte Richtung als beobachtbares Verhalten.", "Verkleinert es so weit, dass Zeit, Energie und andere Verantwortungen realistisch berücksichtigt sind.", "Testet es einmal und entscheidet erst danach, ob ihr es wiederholen, verändern oder verwerfen möchtet."], observationQuestion: "Welche Wirkung hatte die kleine Version für jede Person, und welche Kosten wurden sichtbar?", whatCouldBeLearned: "Welche kleine Form bereits hilfreich ist, wo reale Kapazitätsgrenzen liegen und welche Kosten vorher übersehen wurden.", stopBoundary: "Der Versuch braucht die Zustimmung beider und darf ohne Rechtfertigung beendet werden.", evidenceFindingIds: second.map(({ id }) => id) },
    { id: "expectation-update", title: "Eine Erwartung auf den heutigen Stand bringen", why: "Aktuell bestätigte, nur angenommene und bewusst offene Erwartungen sind unterschiedliche Ausgangslagen.", steps: ["Jede Person vervollständigt: „Heute erwarte oder erhoffe ich …“", "Die andere Person spiegelt nur zurück, was sie verstanden hat.", "Markiert gemeinsam: bestätigt, verschieden, bewusst offen oder noch nicht besprechbar."], observationQuestion: "Welche bisherige Annahme ist jetzt bestätigt, verändert oder weiterhin offen?", whatCouldBeLearned: "Welche frühere Absprache noch gilt, welche Erwartung nur angenommen war und was ihr bewusst offenhalten möchtet.", stopBoundary: "Aktualisieren bedeutet nicht zustimmen. Keine Erwartung wird allein durch Aussprechen verbindlich.", evidenceFindingIds: [...conversation, ...open].slice(0, 3).map(({ id }) => id).length ? [...conversation, ...open].slice(0, 3).map(({ id }) => id) : findings.slice(0, 1).map(({ id }) => id) },
  ];
}

function buildConversationTools(findings: readonly PartnerComparisonFinding[]): readonly PartnerConversationTool[] {
  const relevant = findings.filter(({ category }) => ["worth-discussing", "direction-difference", "uncertainty", "present-constraint"].includes(category));
  const evidenceIds = (relevant.length ? relevant : findings).slice(0, 4).map(({ id }) => id);
  return [
    { id: "speaker-listener", title: "Sprechen · Spiegeln · Korrigieren", usefulWhen: "Wenn ihr zuerst verstehen möchtet, was hinter zwei unterschiedlichen Antworten steckt – und beide gerade sprechen möchten.", steps: ["Eine Person beginnt mit: „Wenn ich an [konkrete Situation] denke, wünsche ich mir …“ und spricht höchstens zwei Minuten.", "Die andere spiegelt nur: „Ich habe verstanden, dass du … meinst. Stimmt das?“ Die erste Person korrigiert ausschließlich das Verständnis.", "Dann könnt ihr die Rollen wechseln. Erst danach entscheidet jede Person für sich, ob ihr weiterreden, pausieren oder das Thema offenlassen möchtet."], closingQuestion: "Was verstehe ich jetzt genauer, auch wenn ich es anders erlebe?", safetyBoundary: "Jede Person darf pausieren oder stoppen; keine Einigung ist erforderlich. Bei Angst, Kontrolle, Drohung oder Gewalt ist dieses Werkzeug nicht als gemeinsamer Gesprächsrahmen gedacht.", evidenceFindingIds: evidenceIds },
    { id: "request-boundary-offer", title: "Wunsch · Grenze · mögliches Angebot", usefulWhen: "Wenn ein Wunsch und eine gegenwärtige Begrenzung gleichzeitig sichtbar sind und beide freiwillig klären möchten, was heute möglich ist.", steps: ["Eine Person beginnt: „Wenn ich an [konkrete Situation] denke, wäre mir wichtig …“", "Danach folgt die Grenze: „Aktuell kann ich realistisch … / aktuell kann oder möchte ich nicht …“", "Die andere fragt: „Was davon ist für dich ein Wunsch, was eine Grenze und was noch offen?“ Erst dann kann jede ein freiwilliges Angebot machen; kein Angebot ist ebenfalls zulässig."], closingQuestion: "Gibt es eine kleine Vereinbarung, der beide frei zustimmen – oder lassen wir die Frage heute offen?", safetyBoundary: "Ein Wunsch erzeugt keinen Anspruch; eine Grenze wird nicht verhandelt, bis die Person selbst sie zur Verhandlung öffnet. Jede Person kann das Werkzeug beenden.", evidenceFindingIds: evidenceIds },
  ];
}

export function buildPartnerComparisonResult(participants: Readonly<Record<PartnerParticipantId, PartnerParticipantAnswers>>, participantASealed = true, locale: Locale = "de"): { status: "incomplete"; participant: PartnerParticipantId; sectionIndex: number; message: string } | { status: "complete"; result: PartnerComparisonResult } {
  for (const participant of ["a", "b"] as const) {
    const sectionIndex = firstInvalidPartnerSection(participants[participant], locale);
    if (sectionIndex !== null || participant === "a" && !participantASealed) {
      const invalidSection = sectionIndex ?? 3;
      return { status: "incomplete", participant, sectionIndex: invalidSection, message: validatePartnerSection(invalidSection, participants[participant], locale) ?? lifeUiValue(locale, "Person A must seal their answers first.", "Person A muss ihre Antworten zuerst versiegeln.") };
    }
  }

  const tracks = buildTracks(participants);
  const findings = buildSynthesizedFindings(tracks);
  const findingsByCategory = FINDING_CATEGORY_ORDER.reduce<Record<PartnerFindingCategory, readonly PartnerComparisonFinding[]>>((groups, category) => {
    groups[category] = findings.filter((finding) => finding.category === category);
    return groups;
  }, {
    "shared-ground": [],
    "different-expectations": [],
    "direction-difference": [],
    uncertainty: [],
    "accepted-difference": [],
    "present-constraint": [],
    "worth-discussing": [],
    "not-assessed-by-both": [],
  });
  const sensitiveDimensionIds = partnerDimensions.filter(({ id, sensitive }) => sensitive && (participants.a.selectedDimensionIds.includes(id) || participants.b.selectedDimensionIds.includes(id))).map(({ id }) => id);
  const overlap = tracks.filter((track) => track.participantA && track.participantB);
  const metrics = {
    topicsSelectedByA: participants.a.selectedDimensionIds.length,
    topicsSelectedByB: participants.b.selectedDimensionIds.length,
    topicsAssessedByBoth: overlap.length,
    sharedDirections: overlap.filter((track) => track.participantA!.desiredDirection === track.participantB!.desiredDirection && track.participantA!.desiredDirection !== "open").length,
    differingDirections: overlap.filter(directionsDiffer).length,
    openOrUncertainTopics: tracks.filter(hasUncertainty).length,
    topicsWithPresentConstraints: overlap.filter((track) => [track.participantA!, track.participantB!].some(({ constraint }) => constraint !== "none")).length,
  };
  const result: PartnerComparisonResult = {
      title: "Was zwischen euch sichtbar wird",
      description: "Eine gemeinsame, qualitative Orientierung aus euren ausdrücklich freigegebenen Antworten – insight-first, ohne Kompatibilitätswert, Gewinnerseite oder versteckte Bewertung.",
      sharedOverview: buildSharedOverview(tracks, findings),
      metrics,
      tracks,
      findings,
      findingsByCategory,
      paths: buildActionPaths(findings),
      experiments: buildExperiments(findings),
      conversationTools: buildConversationTools(findings),
      sensitiveDimensionIds,
      disclaimer: PARTNER_DISCLAIMER,
  };
  return { status: "complete", result: localizePartnerComparisonResult(result, participants, locale) };
}
