import {
  authoritySourceOptions,
  capacityEffectOptions,
  currentEmphasisOptions,
  desiredDirectionOptions,
  entanglementOptions,
  experimentOptions,
  lifeAlignmentSections,
  lifeAlignmentSnapshotCopy,
  lifeAreas,
  lifeConstraintOptions,
  tradeoffOptions,
} from "@/data/life-alignment";
import { getSelfAlignmentContent } from "@/data/i18n/life-alignment";
import type { Locale } from "@/lib/i18n/config";
import { localizeLifeAlignmentResult } from "@/lib/life-alignment-localization";
import { lifeUiValue } from "@/data/i18n/life-alignment-ui";
import type {
  AlignmentSignal,
  LifeAlignmentAction,
  LifeAlignmentActionPath,
  LifeAlignmentAnswers,
  LifeAlignmentAreaResult,
  LifeAlignmentClosingOrientation,
  LifeAlignmentEvidence,
  LifeAlignmentInsight,
  LifeAlignmentJourneyState,
  LifeAlignmentMicroTool,
  LifeAlignmentResult,
  LifeAlignmentSnapshotGroup,
  LifeAreaId,
} from "@/types/life-alignment";

const CONTROL_OR_BIDI = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u061C\u200E\u200F\u202A-\u202E\u2066-\u2069]/u;
const CUSTOM_IDS = ["custom-1", "custom-2"] as const;
const STARTER_IDS = new Set(lifeAreas.map(({ id }) => id));

export const initialLifeAlignmentAnswers: LifeAlignmentAnswers = {
  selectedAreaIds: [],
  customLabels: { "custom-1": "", "custom-2": "" },
  priorityAreaIds: [],
  areas: {},
  constraints: [],
  focusAreaId: null,
  tradeoffStatus: null,
  authoritySources: [],
  entanglementStatus: null,
  focusIntention: "",
  experimentMode: null,
};

export const initialLifeAlignmentState: LifeAlignmentJourneyState = {
  phase: "intro",
  sectionIndex: 0,
  answers: initialLifeAlignmentAnswers,
  validationMessage: null,
  restartPending: false,
};

export function normalizeLifeAlignmentText(value: string): string {
  return value.normalize("NFC").trim().replace(/\s+/gu, " ");
}

export function validCustomAreaLabel(value: string): boolean {
  const normalized = normalizeLifeAlignmentText(value);
  const length = Array.from(normalized).length;
  return length >= 2 && length <= 40 && !CONTROL_OR_BIDI.test(normalized);
}

export function validFocusIntention(value: string): boolean {
  const normalized = normalizeLifeAlignmentText(value);
  if (!normalized) return true;
  const length = Array.from(normalized).length;
  return length >= 12 && length <= 240 && !CONTROL_OR_BIDI.test(normalized);
}

export function formatLifeAlignmentSelectionCount(
  selectedCount: number,
  minSelections: number,
  maxSelections: number,
  verb: "ausgewählt" | "markiert" = "ausgewählt",
  locale: Locale = "de",
): string {
  const words = {
    de: { of: "von", selected: "ausgewählt", marked: "markiert", valid: "gültige Auswahl", required: "benötigt" },
    en: { of: "of", selected: "selected", marked: "marked", valid: "valid selection", required: "required" },
    es: { of: "de", selected: "seleccionados", marked: "marcados", valid: "selección válida", required: "necesarios" },
    tr: { of: "/", selected: "seçili", marked: "işaretli", valid: "geçerli seçim", required: "gerekli" },
    pl: { of: "z", selected: "wybrano", marked: "zaznaczono", valid: "prawidłowy wybór", required: "wymagane" },
    el: { of: "από", selected: "επιλεγμένα", marked: "σημειωμένα", valid: "έγκυρη επιλογή", required: "απαιτούνται" },
    ru: { of: "из", selected: "выбрано", marked: "отмечено", valid: "допустимый выбор", required: "требуется" },
  } satisfies Record<Locale, Record<string, string>>;
  const copy = words[locale];
  const requirement = selectedCount >= minSelections && selectedCount <= maxSelections ? copy.valid : `${minSelections === maxSelections ? minSelections : `${minSelections}–${maxSelections}`} ${copy.required}`;
  return `${selectedCount} ${copy.of} ${maxSelections} ${verb === "markiert" ? copy.marked : copy.selected} · ${requirement}`;
}

export function getLifeAreaTitle(answers: LifeAlignmentAnswers, areaId: LifeAreaId, locale: Locale = "de"): string {
  if (areaId === "custom-1" || areaId === "custom-2") {
    return normalizeLifeAlignmentText(answers.customLabels[areaId]) || lifeUiValue(locale, "Custom life area", "Eigener Lebensbereich");
  }
  return getSelfAlignmentContent(locale).areas.find(({ id }) => id === areaId)?.title ?? lifeUiValue(locale, "Life area", "Lebensbereich");
}

function validAreaId(answers: LifeAlignmentAnswers, areaId: LifeAreaId): boolean {
  return STARTER_IDS.has(areaId as Exclude<LifeAreaId, "custom-1" | "custom-2">)
    || CUSTOM_IDS.includes(areaId as (typeof CUSTOM_IDS)[number]) && validCustomAreaLabel(answers.customLabels[areaId as "custom-1" | "custom-2"]);
}

export function validateLifeAlignmentSection(sectionIndex: number, answers: LifeAlignmentAnswers, locale: Locale = "de"): string | null {
  const message = (english: string, german: string) => lifeUiValue(locale, english, german);
  const selected = [...new Set(answers.selectedAreaIds)];
  if (sectionIndex === 0) {
    if (selected.length < 4 || selected.length > 6) return message("Select four to six life areas.", "Wähle vier bis sechs Lebensbereiche aus.");
    if (selected.some((areaId) => !validAreaId(answers, areaId))) return message("Check the name of your custom life area.", "Prüfe die Bezeichnung deines eigenen Lebensbereichs.");
    const priorities = [...new Set(answers.priorityAreaIds)];
    if (priorities.length < 1 || priorities.length > 3) return message("Mark one to three areas that are especially important right now.", "Markiere ein bis drei Bereiche, die gerade besonders wichtig sind.");
    if (priorities.some((areaId) => !selected.includes(areaId))) return message("Priorities must belong to your selected life areas.", "Prioritäten müssen zu deinen ausgewählten Lebensbereichen gehören.");
    return null;
  }

  if (sectionIndex === 1) {
    return answers.selectedAreaIds.every((areaId) => {
      const answer = answers.areas[areaId];
      return Boolean(answer?.currentEmphasis && answer.capacityEffect);
    }) ? null : message("For every selected area, describe its current space and effect on your capacity.", "Ordne für jeden ausgewählten Bereich den heutigen Raum und seine Wirkung ein.");
  }

  if (sectionIndex === 2) {
    return answers.selectedAreaIds.every((areaId) => Boolean(answers.areas[areaId]?.desiredDirection))
      ? null
      : message("Choose a desired direction for every area, including ‘still uncertain’ when that fits.", "Wähle für jeden Bereich eine gewünschte Richtung oder bewusst ‚noch unsicher‘.");
  }

  if (sectionIndex === 3) {
    const constraints = [...new Set(answers.constraints)];
    if (constraints.length < 1 || constraints.length > 3) return message("Select one to three current conditions.", "Wähle eine bis drei heutige Bedingungen aus.");
    if (constraints.includes("none") && constraints.length > 1) return message("‘No specific constraint’ can only be selected by itself.", "‚Keine konkrete Grenze‘ kann nur allein gewählt werden.");
    if (!answers.tradeoffStatus) return message("Describe how you relate to a possible tension today.", "Ordne ein, wie du heute zu einer möglichen Spannung stehst.");
    return null;
  }

  if (!answers.focusAreaId || !answers.selectedAreaIds.includes(answers.focusAreaId)) return message("Choose one area for further reflection.", "Wähle einen Bereich für deine weitere Reflexion.");
  if (answers.authoritySources.length < 1 || answers.authoritySources.length > 2) return message("Select one or two source signals.", "Wähle ein oder zwei Herkunftssignale aus.");
  if (answers.authoritySources.includes("uncertain") && answers.authoritySources.length > 1) return message("‘Still uncertain’ can only be selected by itself here.", "‚Noch unsicher‘ kann hier nur allein gewählt werden.");
  if (!answers.entanglementStatus) return message("Describe whether the connected assumption or constraint still applies today.", "Ordne ein, ob die verbundene Annahme oder Grenze heute noch besteht.");
  if (!validFocusIntention(answers.focusIntention)) return message("Use 12 to 240 valid characters for the optional note, or leave it empty.", "Nutze für deine optionale Notiz 12 bis 240 gültige Zeichen – oder lasse sie leer.");
  if (!answers.experimentMode) return message("Choose a small next mode; changing nothing yet is also available.", "Wähle einen kleinen nächsten Modus – auch ‚noch nichts verändern‘ ist möglich.");
  return null;
}

export function getFirstInvalidLifeAlignmentSection(answers: LifeAlignmentAnswers, locale: Locale = "de"): number | null {
  for (let index = 0; index < lifeAlignmentSections.length; index += 1) {
    if (validateLifeAlignmentSection(index, answers, locale)) return index;
  }
  return null;
}

function areaSignal(
  areaId: LifeAreaId,
  answers: LifeAlignmentAnswers,
): AlignmentSignal {
  const area = answers.areas[areaId];
  if (!area?.currentEmphasis || !area.capacityEffect || !area.desiredDirection) return "uncertain";
  if (area.capacityEffect === "unclear" || area.desiredDirection === "uncertain" || area.currentEmphasis === "unclear") return "uncertain";
  if (areaId === answers.focusAreaId && answers.tradeoffStatus === "accepted-now") return "accepted";
  if (
    areaId === answers.focusAreaId
    && answers.tradeoffStatus === "currently-fixed"
    && answers.constraints.some((constraint) => constraint !== "none" && constraint !== "uncertain")
  ) return "constrained";
  if (area.capacityEffect === "supportive" && area.desiredDirection === "keep") return "supportive";
  if (area.capacityEffect === "mixed" || area.capacityEffect === "draining" || area.desiredDirection !== "keep") return "tension";
  return "steady";
}

const signalLabels: Readonly<Record<AlignmentSignal, string>> = {
  supportive: "Unterstützt dich derzeit",
  tension: "Gewünschte Veränderung oder Spannung",
  constrained: "Veränderungswunsch unter realen Grenzen",
  accepted: "Bewusste Abwägung für jetzt",
  uncertain: "Bleibt bewusst offen",
  steady: "Derzeit ohne deutlichen Veränderungswunsch",
};

function buildAreaResult(answers: LifeAlignmentAnswers, areaId: LifeAreaId): LifeAlignmentAreaResult {
  const answer = answers.areas[areaId];
  if (!answer?.currentEmphasis || !answer.capacityEffect || !answer.desiredDirection) {
    throw new Error(`Incomplete Life Alignment area: ${areaId}`);
  }
  const signal = areaSignal(areaId, answers);
  return {
    id: areaId,
    title: getLifeAreaTitle(answers, areaId),
    importantNow: answers.priorityAreaIds.includes(areaId),
    currentEmphasis: answer.currentEmphasis,
    currentLabel: currentEmphasisOptions[answer.currentEmphasis].label,
    capacityEffect: answer.capacityEffect,
    capacityLabel: capacityEffectOptions[answer.capacityEffect].label,
    desiredDirection: answer.desiredDirection,
    directionLabel: desiredDirectionOptions[answer.desiredDirection].label,
    signal,
    signalLabel: signalLabels[signal],
  };
}

function isHighStakesArea(areaId: LifeAreaId): boolean {
  return lifeAreas.some((area) => area.id === areaId && area.highStakes === true);
}

function areaEvidence(area: LifeAlignmentAreaResult, source: string, detail: string): LifeAlignmentEvidence {
  return { areaId: area.id, source: `${area.title} · ${source}`, detail };
}

function buildSnapshot(areas: readonly LifeAlignmentAreaResult[]): readonly LifeAlignmentSnapshotGroup[] {
  const groupForSignal: Readonly<Record<AlignmentSignal, LifeAlignmentSnapshotGroup["id"]>> = {
    supportive: "support",
    tension: "change",
    constrained: "change",
    accepted: "change",
    uncertain: "open",
    steady: "steady",
  };
  return (["support", "change", "open", "steady"] as const).map((id) => ({
    id,
    ...lifeAlignmentSnapshotCopy[id],
    areas: areas.filter((area) => groupForSignal[area.signal] === id),
  }));
}

function buildInsights(
  areas: readonly LifeAlignmentAreaResult[],
  answers: LifeAlignmentAnswers,
): readonly LifeAlignmentInsight[] {
  const insights: LifeAlignmentInsight[] = [];
  const support = areas.find((area) => area.signal === "supportive");
  const pressure = areas.find((area) =>
    area.id !== support?.id
    && (area.capacityEffect === "draining" || area.capacityEffect === "mixed")
    && area.desiredDirection !== "keep",
  );

  if (support && pressure) {
    insights.push({
      id: "support-and-pressure",
      eyebrow: "Tragfähigkeit und Veränderung",
      title: `${support.title} kann Halt geben, während ${pressure.title} Bewegung verlangt.`,
      explanation: `Du beschreibst ${support.title} als unterstützend und in seiner heutigen Richtung passend. Gleichzeitig kostet ${pressure.title} Kapazität oder wirkt gemischt, und du möchtest dort nicht einfach so weitermachen.`,
      everydayInterpretation: "Im Alltag kann das heißen: Das Tragende muss nicht ebenfalls optimiert werden. Es kann der verlässliche Teil sein, von dem aus du eine andere Stelle vorsichtig veränderst.",
      evidence: [
        areaEvidence(support, "Wirkung", support.capacityLabel),
        areaEvidence(support, "Gewünschte Richtung", support.directionLabel),
        areaEvidence(pressure, "Wirkung", pressure.capacityLabel),
        areaEvidence(pressure, "Gewünschte Richtung", pressure.directionLabel),
      ],
    });
  }

  const expansion = areas.filter((area) => area.desiredDirection === "more");
  const capacityConstraintIds = answers.constraints.filter((id) => ["time-attention", "energy-capacity", "care-responsibility", "income-commitment"].includes(id));
  if (expansion.length >= 2 && capacityConstraintIds.length > 0) {
    const firstTwo = expansion.slice(0, 2);
    insights.push({
      id: "competing-capacity",
      eyebrow: "Mehrere Wünsche, dieselbe Kapazität",
      title: `${firstTwo[0].title} und ${firstTwo[1].title} sollen beide mehr Raum bekommen.`,
      explanation: "Mindestens zwei Bereiche wünschen mehr Raum, während du eine reale Zeit-, Energie-, Fürsorge- oder finanzielle Grenze markiert hast. Das macht die Wünsche nicht unvereinbar, aber wahrscheinlich nicht gleichzeitig beliebig erweiterbar.",
      everydayInterpretation: "Im Alltag teilen sich zusätzliche Vorhaben oft dasselbe freie Zeitfenster, dieselbe Energie am Abend oder dasselbe Budget. Eine Reihenfolge oder ein kleiner Tausch kann ehrlicher sein als zwei neue Zusagen zugleich.",
      evidence: [
        ...firstTwo.map((area) => areaEvidence(area, "Gewünschte Richtung", area.directionLabel)),
        ...capacityConstraintIds.slice(0, 2).map((id) => ({ source: "Gegenwärtige Bedingung", detail: lifeConstraintOptions[id] })),
      ],
    });
  }

  const more = areas.find((area) => area.desiredDirection === "more");
  const less = areas.find((area) => area.desiredDirection === "less");
  if (more && less) {
    insights.push({
      id: "redistribution",
      eyebrow: "Mögliche Verschiebung",
      title: `Deine gewünschte Bewegung verbindet mehr ${more.title} mit weniger ${less.title}.`,
      explanation: "Die beiden Richtungen können als mögliche Umverteilung gelesen werden – nicht als Forderung, beide sofort oder im gleichen Umfang zu verändern.",
      everydayInterpretation: "Mehr Raum entsteht im Alltag selten aus einem leeren Kalender. Eine einzelne Verpflichtung, Gewohnheit oder Erwartung kleiner zu machen, kann konkreter sein als allgemein ‚mehr Zeit‘ finden zu wollen.",
      evidence: [
        areaEvidence(more, "Gewünschte Richtung", more.directionLabel),
        areaEvidence(less, "Gewünschte Richtung", less.directionLabel),
      ],
    });
  }

  const importantReduction = areas.find((area) => area.importantNow && ["less", "different"].includes(area.desiredDirection));
  if (importantReduction) {
    insights.push({
      id: "priority-is-not-more",
      eyebrow: "Priorität ohne Vergrößerung",
      title: `${importantReduction.title} ist wichtig – und soll nicht einfach mehr werden.`,
      explanation: "Du hast den Bereich als besonders wichtig markiert und zugleich weniger oder eine andere Form gewählt. Wichtigkeit bedeutet in deinen Antworten also Aufmerksamkeit, nicht automatisch Ausbau.",
      everydayInterpretation: "Das kann praktisch bedeuten, Reibung zu reduzieren, eine Erwartung zu klären oder die Form zu verändern – statt noch einen Termin oder ein Ziel hinzuzufügen.",
      evidence: [
        areaEvidence(importantReduction, "Priorität", "Von dir als besonders wichtig markiert"),
        areaEvidence(importantReduction, "Gewünschte Richtung", importantReduction.directionLabel),
      ],
    });
  }

  const uncertain = areas.filter((area) => area.signal === "uncertain");
  if (uncertain.length > 0) {
    insights.push({
      id: "declared-uncertainty",
      eyebrow: "Bewusst offen",
      title: `Bei ${uncertain.map(({ title }) => title).join(" und ")} ist Beobachten derzeit aussagekräftiger als Festlegen.`,
      explanation: "Mindestens eine deiner Angaben zu heutigem Raum, Wirkung oder gewünschter Richtung ist ausdrücklich unklar oder unsicher. Das Ergebnis behandelt diese Offenheit als Information, nicht als Lücke, die automatisch geschlossen werden muss.",
      everydayInterpretation: "Eine Woche lang konkrete Situationen zu bemerken kann hier nützlicher sein als eine schnelle Grundsatzentscheidung. Achte darauf, wann der Bereich auftaucht und was davor oder danach mit deiner Kapazität passiert.",
      evidence: uncertain.slice(0, 2).map((area) => areaEvidence(area, "Einordnung", `${area.currentLabel}; ${area.capacityLabel}; ${area.directionLabel}`)),
    });
  }

  const focus = areas.find((area) => area.id === answers.focusAreaId);
  const explicitConstraints = answers.constraints.filter((id) => id !== "none");
  if (focus && explicitConstraints.length > 0 && ["currently-fixed", "explore-change"].includes(answers.tradeoffStatus ?? "")) {
    insights.push({
      id: "focus-under-constraints",
      eyebrow: "Wunsch unter realen Bedingungen",
      title: `Bei ${focus.title} bestehen Veränderungswunsch und heutige Grenze gleichzeitig.`,
      explanation: "Du hast diesen Bereich als Fokus gewählt, eine Veränderung oder Erkundung markiert und mindestens eine gegenwärtige Bedingung benannt. Die Grenze widerlegt den Wunsch nicht; sie bestimmt, wie klein, langsam oder indirekt ein nächster Schritt sein sollte.",
      everydayInterpretation: "Im Alltag kann ein sinnvoller Schritt zunächst eine Information, ein Gespräch oder ein geschütztes Mini-Zeitfenster sein – nicht sofort die Veränderung des ganzen Bereichs.",
      evidence: [
        areaEvidence(focus, "Gewünschte Richtung", focus.directionLabel),
        { source: "Heutige Einordnung", detail: answers.tradeoffStatus ? tradeoffOptions[answers.tradeoffStatus] : "" },
        ...explicitConstraints.slice(0, 2).map((id) => ({ source: "Gegenwärtige Bedingung", detail: lifeConstraintOptions[id] })),
      ],
    });
  }

  if (insights.length === 0) {
    const focusFallback = focus ?? areas[0];
    insights.push({
      id: "descriptive-focus",
      eyebrow: "Dein gewählter Fokus",
      title: `${focusFallback.title} ist der Bereich, den du genauer betrachten möchtest.`,
      explanation: "Deine Antworten ergeben keine starke bereichsübergreifende Spannung. Der gewählte Fokus bleibt dennoch ein sinnvoller Ort für eine konkrete Beobachtung.",
      everydayInterpretation: "Du musst keine Krise finden, damit Reflexion nützlich ist. Ein einzelner Moment, der gut funktioniert oder unnötig Reibung erzeugt, kann bereits genug Information liefern.",
      evidence: [areaEvidence(focusFallback, "Einordnung", `${focusFallback.currentLabel}; ${focusFallback.capacityLabel}; ${focusFallback.directionLabel}`)],
    });
  }

  return insights.slice(0, 5);
}

function buildActionPaths(
  areas: readonly LifeAlignmentAreaResult[],
  answers: LifeAlignmentAnswers,
  experiment: LifeAlignmentResult["experiment"],
): readonly LifeAlignmentActionPath[] {
  const paths: LifeAlignmentActionPath[] = [];
  const focus = areas.find((area) => area.id === answers.focusAreaId) ?? areas[0];
  const constrained = answers.constraints.some((id) => ["time-attention", "energy-capacity", "care-responsibility", "income-commitment"].includes(id));
  const sourceNeedsClarifying = answers.authoritySources.some((source) => ["social", "inherited", "uncertain"].includes(source));
  const needsLess = areas.find((area) => area.desiredDirection === "less" || area.capacityEffect === "draining");

  paths.push({
    id: "chosen-experiment",
    title: "Den gewählten Versuch bewusst klein halten",
    why: `Du hast für ${focus.title} bereits einen passenden Erkundungsmodus gewählt. Er kann konkrete Alltagshinweise liefern, ohne eine große Entscheidung vorwegzunehmen.`,
    firstStep: experiment.action,
    example: "Zum Beispiel: Begrenze den Versuch auf einen Termin, ein Gespräch oder ein kurzes Zeitfenster und entscheide erst danach, ob du ihn wiederholen möchtest.",
    learning: "Du könntest erkennen, ob die gewünschte Richtung im Alltag tatsächlich entlastet, trägt oder einen bislang unsichtbaren Trade-off erzeugt.",
    tradeoff: "Ein kleiner Versuch liefert nur begrenzte Evidenz. Das ist beabsichtigt: Er soll eine Annahme prüfen, nicht dein ganzes Leben beweisen.",
    reversible: answers.experimentMode !== "conversation",
    evidence: [
      areaEvidence(focus, "Fokus", "Von dir für die weitere Reflexion gewählt"),
      { source: "Gewählter Modus", detail: experiment.title },
    ],
  });

  if (needsLess) {
    paths.push({
      id: "reduce-load",
      title: "Belastung in der heutigen Situation reduzieren",
      why: `${needsLess.title} soll weniger Raum bekommen oder kostet derzeit Kapazität. Eine Entlastung kann deshalb passender sein als ein zusätzliches Vorhaben.`,
      firstStep: "Benenne genau eine wiederkehrende Aufgabe, Erwartung oder Unterbrechung in diesem Bereich. Prüfe, ob sie kleiner, seltener, gebündelt oder klarer begrenzt werden kann.",
      example: "Zum Beispiel: Eine Benachrichtigung ausschalten, einen wiederkehrenden Termin kürzen oder eine Zuständigkeit für eine Woche klarer abgrenzen.",
      learning: "Du könntest erkennen, ob die Belastung vor allem aus dem Bereich selbst oder aus seiner heutigen Organisation entsteht.",
      tradeoff: "Weniger Belastung kann bedeuten, eine Erwartung nicht vollständig zu erfüllen oder etwas vorerst liegen zu lassen.",
      reversible: true,
      evidence: [
        areaEvidence(needsLess, "Wirkung", needsLess.capacityLabel),
        areaEvidence(needsLess, "Gewünschte Richtung", needsLess.directionLabel),
      ],
    });
  }

  if (constrained) {
    paths.push({
      id: "create-capacity",
      title: "Zuerst praktische Kapazität schaffen",
      why: "Du hast eine reale Zeit-, Energie-, Fürsorge- oder finanzielle Grenze benannt. Direkte Veränderung kann dadurch zu groß sein, bevor etwas Spielraum entsteht.",
      firstStep: "Trenne eine Bedingung in: heute nicht bewegbar, verhandelbar oder noch ungeklärt. Bearbeite nur den kleinsten verhandelbaren oder klärbaren Teil.",
      example: "Zum Beispiel: Nicht den gesamten Wochenplan ändern, sondern klären, ob ein einzelnes Zeitfenster, Budgetdetail oder eine Zuständigkeit verhandelbar ist.",
      learning: "Du könntest erkennen, welcher Teil der Begrenzung tatsächlich fest ist und wo bereits kleiner praktischer Spielraum besteht.",
      tradeoff: "Kapazität zuerst zu schaffen ist langsamer und kann den eigentlichen Wunsch zeitweise in den Hintergrund rücken.",
      reversible: true,
      evidence: answers.constraints.filter((id) => id !== "none").slice(0, 2).map((id) => ({ source: "Gegenwärtige Bedingung", detail: lifeConstraintOptions[id] })),
    });
  }

  if (sourceNeedsClarifying) {
    paths.push({
      id: "clarify-source",
      title: "Eigenen Wunsch und übernommene Erwartung auseinanderhalten",
      why: "Du hast soziale, übernommene oder unsichere Herkunftssignale markiert. Vor einer Veränderung kann es helfen, den eigenen Anteil genauer zu hören.",
      firstStep: "Formuliere zwei kurze Sätze: ‚Ich möchte …, weil …‘ und ‚Andere erwarten …, weil …‘. Markiere, was in beiden Sätzen tatsächlich von dir bestätigt wird.",
      example: "Zum Beispiel: ‚Ich möchte beruflich sichtbarer sein‘ neben ‚In meinem Umfeld gilt Aufstieg als Erfolg‘ – ohne sofort entscheiden zu müssen, welcher Satz stärker wiegt.",
      learning: "Du könntest erkennen, welche Teile der Richtung auch ohne äußere Bestätigung Bedeutung für dich behalten.",
      tradeoff: "Mehr Klarheit kann zunächst Ambivalenz sichtbar machen, statt sie sofort aufzulösen.",
      reversible: true,
      evidence: answers.authoritySources.map((source) => ({ source: "Herkunftssignal", detail: authoritySourceOptions[source] })),
    });
  }

  if (answers.constraints.includes("uncertain") || answers.entanglementStatus === "unsure") {
    paths.push({
      id: "gather-information",
      title: "Erst fehlende Information sammeln",
      why: "Du hast eine Grenze oder ihre heutige Bedeutung als unsicher eingeordnet. Eine kleine Faktenklärung kann den tatsächlichen Spielraum verändern.",
      firstStep: "Notiere eine konkrete Frage, deren Antwort deinen Spielraum wirklich verändern würde. Kläre nur diese Frage bei einer verlässlichen Quelle oder betroffenen Person.",
      example: "Zum Beispiel: Eine konkrete Frist, Regel, Kostenhöhe oder verfügbare Unterstützung klären, statt die gesamte Zukunft zu planen.",
      learning: "Du könntest erkennen, ob die angenommene Grenze kleiner, größer oder schlicht anders ist als bisher gedacht.",
      tradeoff: "Mehr Information schafft nicht automatisch eine leichte Entscheidung und kann neue Bedingungen sichtbar machen.",
      reversible: true,
      evidence: [
        ...(answers.constraints.includes("uncertain") ? [{ source: "Gegenwärtige Bedingung", detail: lifeConstraintOptions.uncertain }] : []),
        ...(answers.entanglementStatus === "unsure" ? [{ source: "Aktualität der Annahme", detail: entanglementOptions.unsure }] : []),
      ],
    });
  }

  if (paths.length < 3) {
    paths.push({
      id: "observe-before-changing",
      title: "Noch nicht verändern, sondern genauer beobachten",
      why: "Eine heutige Momentaufnahme zeigt Richtung, aber noch keinen vollständigen Alltag. Beobachtung kann das Bild konkretisieren, ohne Handlungsdruck zu erzeugen.",
      firstStep: `Notiere bei zwei konkreten Situationen rund um ${focus.title}: Was geschah, was kostete oder gab Kapazität, und was hättest du in diesem Moment anders gebraucht?`,
      example: "Zum Beispiel: Einmal direkt nach einem guten Moment und einmal nach einem anstrengenden Moment drei kurze Stichpunkte notieren.",
      learning: "Du könntest erkennen, welche konkreten Bedingungen den Bereich unterstützen oder erschweren, statt nur ein allgemeines Gefühl festzuhalten.",
      tradeoff: "Beobachtung lässt die heutige Situation zunächst bestehen und kann sich langsamer anfühlen als direkte Veränderung.",
      reversible: true,
      evidence: [areaEvidence(focus, "Heutige Einordnung", `${focus.currentLabel}; ${focus.capacityLabel}`)],
    });
  }

  if (paths.length < 3) {
    const stableArea = areas.find((area) => area.signal === "supportive" || area.signal === "steady") ?? areas[0];
    paths.push({
      id: "protect-what-works",
      title: "Bewusst schützen, was bereits trägt",
      why: `${stableArea.title} muss nicht verändert werden, nur weil du andere Bereiche erkundest. Eine tragende Bedingung ausdrücklich zu schützen kann Veränderung realistischer machen.`,
      firstStep: "Benenne eine konkrete Bedingung, die in diesem Bereich heute hilfreich ist, und behandle sie beim nächsten kleinen Versuch als Schutzgrenze.",
      example: "Zum Beispiel: Einen verlässlichen Termin, eine Erholungszeit oder eine unterstützende Vereinbarung nicht für das neue Vorhaben aufgeben.",
      learning: "Du könntest erkennen, ob die Veränderung möglich ist, ohne eine bestehende Quelle von Stabilität unnötig zu schwächen.",
      tradeoff: "Etwas Tragendes zu schützen begrenzt den verfügbaren Spielraum für andere Wünsche – genau dadurch wird die Abwägung sichtbar.",
      reversible: true,
      evidence: [areaEvidence(stableArea, "Heutige Einordnung", `${stableArea.capacityLabel}; ${stableArea.directionLabel}`)],
    });
  }

  return paths.slice(0, 4);
}

function buildMicroTools(
  areas: readonly LifeAlignmentAreaResult[],
  answers: LifeAlignmentAnswers,
): readonly LifeAlignmentMicroTool[] {
  const focus = areas.find((area) => area.id === answers.focusAreaId) ?? areas[0];
  const tools: LifeAlignmentMicroTool[] = [
    {
      id: "two-moment-note",
      title: "Zwei-Momente-Notiz",
      duration: "2 × 2 Minuten",
      purpose: `Macht die Wirkung von ${focus.title} an konkreten Alltagssituationen prüfbar.`,
      steps: [
        "Notiere einen Moment, in dem der Bereich unerwartet gut getragen hat.",
        "Notiere einen Moment, in dem er mehr Kapazität gekostet hat als erwartet.",
        "Vergleiche nur die Bedingungen davor und danach – nicht deinen Wert oder deine Leistung.",
      ],
      prompt: "Welche kleine Bedingung unterscheidet die beiden Momente?",
    },
  ];

  if (answers.constraints.some((id) => id !== "none")) {
    tools.push({
      id: "constraint-sort",
      title: "Grenzen-Sortierung",
      duration: "5 Minuten",
      purpose: "Trennt reale Fixpunkte von verhandelbaren oder noch ungeklärten Annahmen.",
      steps: [
        "Schreibe eine markierte Bedingung in einem sachlichen Satz auf.",
        "Ordne sie für heute ein: nicht bewegbar, verhandelbar oder ungeklärt.",
        "Notiere nur für ‚verhandelbar‘ oder ‚ungeklärt‘ einen nächsten Mini-Schritt.",
      ],
      prompt: "Welcher Teil der Grenze ist Tatsache – und welcher Teil ist noch eine Annahme?",
    });
  }

  if (areas.some((area) => area.desiredDirection === "more") && areas.some((area) => area.desiredDirection === "less")) {
    tools.push({
      id: "space-trade",
      title: "Ein ehrlicher Raumtausch",
      duration: "5 Minuten",
      purpose: "Übersetzt ‚mehr‘ und ‚weniger‘ in eine kleine, sichtbare Verschiebung.",
      steps: [
        "Wähle einen Bereich mit ‚mehr‘ und einen mit ‚weniger‘.",
        "Benenne eine kleine Einheit: ein Termin, ein Zeitfenster, eine Aufgabe oder eine Erwartung.",
        "Prüfe, ob diese Einheit einmalig getauscht werden kann, ohne eine dauerhafte Entscheidung daraus zu machen.",
      ],
      prompt: "Was müsste konkret etwas kleiner werden, damit das Gewünschte einmal Platz bekommt?",
    });
  }

  if (answers.authoritySources.some((source) => ["social", "inherited", "uncertain"].includes(source))) {
    tools.push({
      id: "source-check",
      title: "Mein Wunsch / ihre Erwartung",
      duration: "4 Minuten",
      purpose: "Macht unterschiedliche Quellen einer Richtung sichtbar, ohne eine davon vorschnell abzuwerten.",
      steps: [
        "Vervollständige: ‚Wenn niemand zuschauen würde, würde ich …‘",
        "Vervollständige: ‚Ich glaube, andere erwarten von mir …‘",
        "Unterstreiche, was du nach dem Vergleich selbst bejahst.",
      ],
      prompt: "Welcher Teil der Richtung fühlt sich auch ohne äußere Bestätigung noch stimmig an?",
    });
  }

  if (tools.length < 3) {
    tools.push({
      id: "minimum-version",
      title: "Die kleinste brauchbare Version",
      duration: "3 Minuten",
      purpose: "Verkleinert einen Wunsch, ohne seine Bedeutung kleinzureden.",
      steps: [
        `Formuliere, was du bei ${focus.title} eigentlich ermöglichen möchtest.`,
        "Streiche alles, was für einen einmaligen Versuch nicht notwendig ist.",
        "Behalte eine Handlung, die in den heutigen Rahmen passt und leicht beendet werden kann.",
      ],
      prompt: "Was wäre klein genug für diese Woche und trotzdem groß genug, um etwas zu lernen?",
    });
  }

  return tools.slice(0, 3);
}

function buildClosingOrientation(answers: LifeAlignmentAnswers): LifeAlignmentClosingOrientation {
  const body = answers.tradeoffStatus === "accepted-now"
    ? "Du hast eine Abwägung für jetzt bewusst akzeptiert. Das ist kein Scheitern an Veränderung, sondern eine aktuelle Entscheidung, die später erneut betrachtet werden darf."
    : answers.tradeoffStatus === "currently-fixed"
      ? "Du möchtest Veränderung und siehst zugleich einen derzeit festen Rahmen. Beides darf wahr sein; der nächste sinnvolle Schritt kann zunächst Schutz, Information oder Kapazität sein."
      : answers.tradeoffStatus === "uncertain"
        ? "Deine Einordnung darf offen bleiben. Du brauchst aus dieser Momentaufnahme heute keine klare Lebensentscheidung abzuleiten."
        : "Du möchtest Veränderung vorsichtig erkunden. Ein kleiner, beobachtbarer Schritt reicht aus, um die Momentaufnahme mit Alltagserfahrung zu ergänzen.";
  return {
    title: "Nimm eine Richtung mit – nicht die Pflicht, alles zu lösen.",
    body,
    reminders: [
      "Das Ergebnis beschreibt deine heutigen Antworten, nicht eine feste Wahrheit über dein Leben.",
      "Tragende Bereiche dürfen einfach tragend bleiben; nicht alles braucht gleichzeitig Arbeit.",
      "Wenn sich Bedingungen verändern, darf auch deine Deutung anders ausfallen.",
    ],
  };
}

export function buildLifeAlignmentResult(answers: LifeAlignmentAnswers, locale: Locale = "de"):
  | { status: "incomplete"; sectionIndex: number; message: string }
  | { status: "complete"; result: LifeAlignmentResult } {
  const invalidSection = getFirstInvalidLifeAlignmentSection(answers, locale);
  if (invalidSection !== null) {
    return { status: "incomplete", sectionIndex: invalidSection, message: validateLifeAlignmentSection(invalidSection, answers, locale) ?? lifeUiValue(locale, "The reflection is not complete yet.", "Die Reflexion ist noch nicht vollständig.") };
  }

  const areas = answers.selectedAreaIds.map((areaId) => buildAreaResult(answers, areaId));
  const focus = areas.find(({ id }) => id === answers.focusAreaId);
  if (!focus || !answers.tradeoffStatus || !answers.entanglementStatus || !answers.experimentMode) {
    return { status: "incomplete", sectionIndex: 4, message: "Der Fokus ist noch nicht vollständig." };
  }

  const supportiveAreas = areas.filter(({ signal }) => signal === "supportive");
  const drainingAreas = areas.filter(({ capacityEffect }) => capacityEffect === "draining");
  const tensionAreas = areas.filter(({ signal }) => ["tension", "constrained", "accepted"].includes(signal));
  const uncertainAreas = areas.filter(({ signal }) => signal === "uncertain");
  const summary: string[] = [];
  if (supportiveAreas.length > 0) summary.push(`${supportiveAreas.map(({ title }) => title).join(" und ")} ${supportiveAreas.length === 1 ? "wirkt" : "wirken"} in deiner heutigen Momentaufnahme unterstützend.`);
  if (tensionAreas.length > 0) summary.push(`${tensionAreas.map(({ title }) => title).join(" und ")} ${tensionAreas.length === 1 ? "zeigt" : "zeigen"} eine gewünschte Veränderung, Spannung oder bewusste Abwägung.`);
  if (uncertainAreas.length > 0) summary.push(`Bei ${uncertainAreas.map(({ title }) => title).join(" und ")} bleibt deine Richtung bewusst offen.`);
  if (summary.length === 0) summary.push("Deine ausgewählten Bereiche ergeben heute kein eindeutiges Unterstützungs- oder Spannungssignal – auch das ist eine mögliche Momentaufnahme.");

  const experimentDefinition = experimentOptions[answers.experimentMode];
  const constraints = answers.constraints.filter((id) => id !== "none").map((id) => lifeConstraintOptions[id]);
  const focusIntention = normalizeLifeAlignmentText(answers.focusIntention) || null;
  const experiment: LifeAlignmentResult["experiment"] = {
    title: `${experimentDefinition.label}: ${focus.title}`,
    action: experimentDefinition.action,
    observe: experimentDefinition.observe,
    boundary: "Behandle den Versuch als freiwillige, reversible Erkundung. Er ersetzt keine fachliche Beratung und muss keine Entscheidung auslösen.",
  };
  const result: LifeAlignmentResult = {
    title: "Deine Life-Alignment-Momentaufnahme",
    description: "Eine qualitative Ordnung deiner eigenen Angaben – keine Bewertung deines Lebens und kein objektives Maß für Ausrichtung.",
    summary: summary.slice(0, 3),
    areas,
    supportiveAreas,
    drainingAreas,
    tensionAreas,
    uncertainAreas,
    constraints,
    focus,
    tradeoffLabel: tradeoffOptions[answers.tradeoffStatus],
    authorityLabels: answers.authoritySources.map((source) => authoritySourceOptions[source]),
    entanglementLabel: entanglementOptions[answers.entanglementStatus],
    focusIntention,
    experiment,
    snapshot: buildSnapshot(areas),
    insights: buildInsights(areas, answers),
    actionPaths: buildActionPaths(areas, answers, experiment),
    tools: buildMicroTools(areas, answers),
    closing: buildClosingOrientation(answers),
    highStakesBoundary: isHighStakesArea(focus.id),
  };
  return { status: "complete", result: localizeLifeAlignmentResult(result, answers, locale) };
}

function withoutArea(answers: LifeAlignmentAnswers, areaId: LifeAreaId): LifeAlignmentAnswers {
  const areas = { ...answers.areas };
  delete areas[areaId];
  return {
    ...answers,
    selectedAreaIds: answers.selectedAreaIds.filter((id) => id !== areaId),
    priorityAreaIds: answers.priorityAreaIds.filter((id) => id !== areaId),
    areas,
    focusAreaId: answers.focusAreaId === areaId ? null : answers.focusAreaId,
  };
}

export function lifeAlignmentReducer(state: LifeAlignmentJourneyState, action: LifeAlignmentAction, locale: Locale = "de"): LifeAlignmentJourneyState {
  if (action.type === "confirm-restart") return initialLifeAlignmentState;
  if (action.type === "request-restart") return { ...state, restartPending: true };
  if (action.type === "cancel-restart") return { ...state, restartPending: false };
  if (action.type === "start") return { ...state, phase: "journey", sectionIndex: 0, validationMessage: null, restartPending: false };
  if (action.type === "edit-section") return { ...state, phase: "journey", sectionIndex: action.sectionIndex, validationMessage: null, restartPending: false };

  if (action.type === "toggle-area") {
    const selected = state.answers.selectedAreaIds.includes(action.areaId);
    const answers = selected
      ? withoutArea(state.answers, action.areaId)
      : { ...state.answers, selectedAreaIds: [...state.answers.selectedAreaIds, action.areaId] };
    return { ...state, answers, validationMessage: null };
  }
  if (action.type === "set-custom-label") {
    let answers: LifeAlignmentAnswers = { ...state.answers, customLabels: { ...state.answers.customLabels, [action.areaId]: action.value } };
    if (!normalizeLifeAlignmentText(action.value)) answers = withoutArea(answers, action.areaId);
    return { ...state, answers, validationMessage: null };
  }
  if (action.type === "toggle-priority") {
    const exists = state.answers.priorityAreaIds.includes(action.areaId);
    const priorityAreaIds = exists
      ? state.answers.priorityAreaIds.filter((id) => id !== action.areaId)
      : [...state.answers.priorityAreaIds, action.areaId];
    return { ...state, answers: { ...state.answers, priorityAreaIds }, validationMessage: null };
  }
  if (action.type === "set-area-answer") {
    const current = state.answers.areas[action.areaId] ?? {};
    return {
      ...state,
      answers: { ...state.answers, areas: { ...state.answers.areas, [action.areaId]: { ...current, [action.field]: action.value } } },
      validationMessage: null,
    };
  }
  if (action.type === "toggle-constraint") {
    const current = state.answers.constraints;
    let constraints: LifeAlignmentAnswers["constraints"];
    if (action.constraintId === "none") constraints = current.includes("none") ? [] : ["none"];
    else constraints = current.includes(action.constraintId)
      ? current.filter((id) => id !== action.constraintId)
      : [...current.filter((id) => id !== "none"), action.constraintId];
    return { ...state, answers: { ...state.answers, constraints }, validationMessage: null };
  }
  if (action.type === "set-focus") return { ...state, answers: { ...state.answers, focusAreaId: action.areaId }, validationMessage: null };
  if (action.type === "set-tradeoff") return { ...state, answers: { ...state.answers, tradeoffStatus: action.value }, validationMessage: null };
  if (action.type === "toggle-authority") {
    const current = state.answers.authoritySources;
    const authoritySources: LifeAlignmentAnswers["authoritySources"] = action.value === "uncertain"
      ? current.includes("uncertain") ? [] : ["uncertain"]
      : current.includes(action.value)
        ? current.filter((value) => value !== action.value)
        : [...current.filter((value) => value !== "uncertain"), action.value];
    return { ...state, answers: { ...state.answers, authoritySources }, validationMessage: null };
  }
  if (action.type === "set-entanglement") return { ...state, answers: { ...state.answers, entanglementStatus: action.value }, validationMessage: null };
  if (action.type === "set-focus-intention") return { ...state, answers: { ...state.answers, focusIntention: action.value }, validationMessage: null };
  if (action.type === "set-experiment") return { ...state, answers: { ...state.answers, experimentMode: action.value }, validationMessage: null };
  if (action.type === "back") {
    if (state.phase !== "journey") return state;
    return state.sectionIndex === 0
      ? { ...state, phase: "intro", validationMessage: null }
      : { ...state, sectionIndex: state.sectionIndex - 1, validationMessage: null };
  }
  if (action.type === "continue") {
    if (state.phase !== "journey") return state;
    const validationMessage = validateLifeAlignmentSection(state.sectionIndex, state.answers, locale);
    if (validationMessage) return { ...state, validationMessage };
    if (state.sectionIndex === lifeAlignmentSections.length - 1) return { ...state, phase: "result", validationMessage: null };
    return { ...state, sectionIndex: state.sectionIndex + 1, validationMessage: null };
  }
  return state;
}
