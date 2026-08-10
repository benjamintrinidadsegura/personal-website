import type {
  SelfReflectionDimensionId,
  SelfReflectionEvidenceRole,
} from "@/types/find-your-next-step";

export type SelfHandbookTextKind =
  | "decision"
  | "environment"
  | "energySupport"
  | "energyWatchout"
  | "work"
  | "learning";

export type SelfHandbookExperimentArea = "work" | "energy" | "activity";

export interface SelfHandbookPatternDefinition {
  id: string;
  label: string;
  dimensions: readonly SelfReflectionDimensionId[];
}

export interface SelfHandbookTextDefinition {
  id: string;
  kind: SelfHandbookTextKind;
  semanticKey: string;
  patternId: string;
  roles: readonly SelfReflectionEvidenceRole[];
  text: string;
  suppresses?: readonly string[];
  requiredDimensions?: readonly SelfReflectionDimensionId[];
  sourceLabel?: string;
  followUp?: {
    id: string;
    semanticKey: string;
    text: string;
  };
}

export interface SelfHandbookActivityExampleDefinition {
  id: string;
  activity: string;
  why: string;
}

export interface SelfHandbookActivityDefinition {
  id: string;
  semanticKey: string;
  patternId: string;
  roles: readonly SelfReflectionEvidenceRole[];
  title: string;
  properties: readonly string[];
  why: string;
  examples: readonly SelfHandbookActivityExampleDefinition[];
}

export interface SelfHandbookExperimentDefinition {
  id: string;
  semanticKey: string;
  patternId: string;
  roles: readonly SelfReflectionEvidenceRole[];
  area: SelfHandbookExperimentArea;
  title: string;
  action: string;
  scope?: string;
  observe: string;
  suppresses?: readonly string[];
}

const decisionRoles = ["priority", "decision", "work", "synthesis"] as const;
const environmentRoles = ["condition", "synthesis"] as const;
const workRoles = ["work", "decision", "condition", "synthesis"] as const;
const positiveRoles = ["priority", "work", "decision", "energyGain", "condition", "synthesis"] as const;
const gainRoles = ["energyGain"] as const;
const drainRoles = ["energyDrain"] as const;

export const selfHandbookPatterns: readonly SelfHandbookPatternDefinition[] = [
  { id: "single-agency", label: "Entscheidungsspielraum", dimensions: ["agency"] },
  { id: "single-orientation", label: "Orientierung", dimensions: ["orientation"] },
  { id: "single-reliability", label: "Verlässlichkeit", dimensions: ["reliability"] },
  { id: "single-depth", label: "Vertiefung", dimensions: ["depth"] },
  { id: "single-variety", label: "Abwechslung", dimensions: ["variety"] },
  { id: "single-connection", label: "Verbindung", dimensions: ["connection"] },
  { id: "single-recovery", label: "Rückzug und Erholung", dimensions: ["recovery"] },
  { id: "single-growth", label: "Entwicklung", dimensions: ["growth"] },
  { id: "single-purpose", label: "Sinn und Beitrag", dimensions: ["purpose"] },
  { id: "single-feedback", label: "Rückmeldung", dimensions: ["feedback"] },
  { id: "pair-orientation-agency", label: "Klare Richtung · eigener Weg", dimensions: ["orientation", "agency"] },
  { id: "pair-reliability-variety", label: "Verlässliche Basis · neue Impulse", dimensions: ["reliability", "variety"] },
  { id: "pair-depth-recovery", label: "Vertiefung · Erholung", dimensions: ["depth", "recovery"] },
  { id: "pair-depth-connection", label: "Vertiefung · Verbindung", dimensions: ["depth", "connection"] },
  { id: "pair-growth-recovery", label: "Entwicklung · Erholung", dimensions: ["growth", "recovery"] },
  { id: "pair-connection-growth", label: "Verbindung · Entwicklung", dimensions: ["connection", "growth"] },
  { id: "pair-purpose-feedback", label: "Sinn und Beitrag · Rückmeldung", dimensions: ["purpose", "feedback"] },
] as const;

export const selfHandbookTextDefinitions: readonly SelfHandbookTextDefinition[] = [
  {
    id: "decision-orientation-agency",
    kind: "decision",
    semanticKey: "decision-direction-freedom",
    patternId: "pair-orientation-agency",
    roles: decisionRoles,
    text: "Ist die Richtung klar genug – und habe ich beim Weg dorthin genügend Spielraum?",
    suppresses: ["decision-orientation", "decision-agency"],
    followUp: {
      id: "decision-orientation-agency-boundaries",
      semanticKey: "decision-direction-freedom-boundaries",
      text: "Welche wenigen Eckpunkte müssten feststehen, damit ich den restlichen Weg selbst gestalten kann?",
    },
  },
  {
    id: "decision-depth-connection",
    kind: "decision",
    semanticKey: "decision-reflect-connect",
    patternId: "pair-depth-connection",
    roles: decisionRoles,
    text: "Kann ich mir zuerst eigene Denkzeit nehmen und danach gezielt passende Perspektiven einholen?",
    suppresses: ["decision-depth", "decision-connection"],
    followUp: {
      id: "decision-depth-connection-timing",
      semanticKey: "decision-reflect-connect-timing",
      text: "An welchem Punkt würde Austausch meine eigene Vertiefung ergänzen, statt sie zu unterbrechen?",
    },
  },
  { id: "decision-agency", kind: "decision", semanticKey: "decision-agency", patternId: "single-agency", roles: decisionRoles, text: "Kann ich Vorgehen oder Reihenfolge an den entscheidenden Stellen mitgestalten?" },
  { id: "decision-orientation", kind: "decision", semanticKey: "decision-orientation", patternId: "single-orientation", roles: decisionRoles, text: "Sind Ziel, Prioritäten und Entscheidungskriterien klar genug?" },
  { id: "decision-reliability", kind: "decision", semanticKey: "decision-reliability", patternId: "single-reliability", roles: decisionRoles, text: "Welche Eckpunkte sind wirklich verlässlich, bevor ich mich festlege?" },
  { id: "decision-depth", kind: "decision", semanticKey: "decision-depth", patternId: "single-depth", roles: decisionRoles, text: "Bekomme ich genug ununterbrochene Zeit, um mich ernsthaft einzuarbeiten?" },
  { id: "decision-variety", kind: "decision", semanticKey: "decision-variety", patternId: "single-variety", roles: decisionRoles, text: "Bietet die Option genug neue Impulse oder bewussten Wechsel?" },
  { id: "decision-connection", kind: "decision", semanticKey: "decision-connection", patternId: "single-connection", roles: decisionRoles, text: "Gibt es die Art von Austausch, die mir bei dieser Entscheidung tatsächlich hilft?" },
  { id: "decision-recovery", kind: "decision", semanticKey: "decision-recovery", patternId: "single-recovery", roles: decisionRoles, text: "Lässt diese Option realistisch Raum für Rückzug und Erholung?" },
  { id: "decision-growth", kind: "decision", semanticKey: "decision-growth", patternId: "single-growth", roles: decisionRoles, text: "Kann ich dabei etwas lernen oder eine erreichbare Herausforderung erproben?" },
  { id: "decision-purpose", kind: "decision", semanticKey: "decision-purpose", patternId: "single-purpose", roles: decisionRoles, text: "Ist für mich erkennbar, wozu mein Beitrag dient oder was er bewirkt?" },
  { id: "decision-feedback", kind: "decision", semanticKey: "decision-feedback", patternId: "single-feedback", roles: decisionRoles, text: "Gibt es passende Zeitpunkte für ehrliche, hilfreiche Rückmeldung?" },

  {
    id: "environment-orientation-agency",
    kind: "environment",
    semanticKey: "environment-direction-freedom",
    patternId: "pair-orientation-agency",
    roles: environmentRoles,
    text: "Ziel und Grenzen sind vorab benannt; der konkrete Weg bleibt gestaltbar.",
    suppresses: ["environment-orientation", "environment-agency"],
  },
  {
    id: "environment-reliability-variety",
    kind: "environment",
    semanticKey: "environment-anchor-variety",
    patternId: "pair-reliability-variety",
    roles: environmentRoles,
    text: "Einige Eckpunkte bleiben verlässlich, während wechselnde Aufgaben oder neue Impulse bewusst Platz bekommen.",
    suppresses: ["environment-reliability", "environment-variety"],
  },
  {
    id: "environment-depth-recovery",
    kind: "environment",
    semanticKey: "environment-focus-recovery",
    patternId: "pair-depth-recovery",
    roles: environmentRoles,
    text: "Ungestörte Zeitfenster und echte Phasen ohne neue Anforderungen sind konkret eingeplant.",
    suppresses: ["environment-depth", "environment-recovery"],
  },
  {
    id: "environment-depth-connection",
    kind: "environment",
    semanticKey: "environment-focus-exchange",
    patternId: "pair-depth-connection",
    roles: environmentRoles,
    text: "Fokuszeit und gezielte Austauschmomente haben jeweils einen erkennbaren Platz.",
    suppresses: ["environment-depth", "environment-connection"],
  },
  {
    id: "environment-growth-recovery",
    kind: "environment",
    semanticKey: "environment-growth-recovery",
    patternId: "pair-growth-recovery",
    roles: environmentRoles,
    text: "Neue Herausforderungen bleiben begrenzt genug, damit Erholung nicht nur als Restzeit übrig bleibt.",
    suppresses: ["environment-growth", "environment-recovery"],
  },
  {
    id: "environment-connection-growth",
    kind: "environment",
    semanticKey: "environment-connection-growth",
    patternId: "pair-connection-growth",
    roles: environmentRoles,
    text: "Es gibt erreichbare Menschen oder Formate, in denen gemeinsames Lernen tatsächlich stattfinden kann.",
    suppresses: ["environment-connection", "environment-growth"],
  },
  {
    id: "environment-purpose-feedback",
    kind: "environment",
    semanticKey: "environment-impact-feedback",
    patternId: "pair-purpose-feedback",
    roles: environmentRoles,
    text: "Die beabsichtigte Wirkung ist nachvollziehbar und Rückmeldung dazu hat einen konkreten Zeitpunkt.",
    suppresses: ["environment-purpose", "environment-feedback"],
  },
  { id: "environment-agency", kind: "environment", semanticKey: "environment-agency", patternId: "single-agency", roles: environmentRoles, text: "Wichtige Schritte oder ihre Reihenfolge können innerhalb des Rahmens mitgestaltet werden." },
  { id: "environment-orientation", kind: "environment", semanticKey: "environment-orientation", patternId: "single-orientation", roles: environmentRoles, text: "Ziel, Prioritäten und Grenzen sind vor dem Start verständlich benannt." },
  { id: "environment-reliability", kind: "environment", semanticKey: "environment-reliability", patternId: "single-reliability", roles: environmentRoles, text: "Wenige feste Eckpunkte machen erkennbar, worauf Verlass ist." },
  { id: "environment-depth", kind: "environment", semanticKey: "environment-depth", patternId: "single-depth", roles: environmentRoles, text: "Längere Zeitfenster sind vor Unterbrechungen geschützt." },
  { id: "environment-variety", kind: "environment", semanticKey: "environment-variety", patternId: "single-variety", roles: environmentRoles, text: "Neue Impulse oder Themenwechsel können bewusst gewählt werden, statt nur zufällig zu entstehen." },
  { id: "environment-connection", kind: "environment", semanticKey: "environment-connection", patternId: "single-connection", roles: environmentRoles, text: "Passende Ansprechpersonen und Austauschmomente sind erreichbar." },
  { id: "environment-recovery", kind: "environment", semanticKey: "environment-recovery", patternId: "single-recovery", roles: environmentRoles, text: "Rückzug und Erholung sind als echte Zeiträume vorgesehen." },
  { id: "environment-growth", kind: "environment", semanticKey: "environment-growth", patternId: "single-growth", roles: environmentRoles, text: "Eine erreichbare Herausforderung und Zeit zum Lernen gehören zum Rahmen." },
  { id: "environment-purpose", kind: "environment", semanticKey: "environment-purpose", patternId: "single-purpose", roles: environmentRoles, text: "Der Zusammenhang zwischen Aufgabe, Beitrag und möglicher Wirkung ist sichtbar." },
  { id: "environment-feedback", kind: "environment", semanticKey: "environment-feedback", patternId: "single-feedback", roles: environmentRoles, text: "Wenige konkrete Zeitpunkte für hilfreiche Rückmeldung sind vereinbart." },

  { id: "energy-support-depth-recovery", kind: "energySupport", semanticKey: "energy-support-focus-recovery", patternId: "pair-depth-recovery", roles: gainRoles, text: "Schütze einen ununterbrochenen Fokusblock und plane danach eine Phase ohne neue Anforderungen ein.", suppresses: ["energy-support-depth", "energy-support-recovery"] },
  { id: "energy-support-growth-recovery", kind: "energySupport", semanticKey: "energy-support-growth-recovery", patternId: "pair-growth-recovery", roles: gainRoles, text: "Begrenze eine neue Herausforderung und reserviere direkt danach verlässliche Erholungszeit.", suppresses: ["energy-support-growth", "energy-support-recovery"] },
  { id: "energy-support-orientation-agency", kind: "energySupport", semanticKey: "energy-support-direction-freedom", patternId: "pair-orientation-agency", roles: gainRoles, text: "Halte die Richtung fest und entscheide den konkreten Weg erst während der Umsetzung.", suppresses: ["energy-support-orientation", "energy-support-agency"] },
  { id: "energy-support-agency", kind: "energySupport", semanticKey: "energy-support-agency", patternId: "single-agency", roles: gainRoles, text: "Plane einen Punkt ein, an dem du Vorgehen oder Reihenfolge selbst festlegst." },
  { id: "energy-support-orientation", kind: "energySupport", semanticKey: "energy-support-orientation", patternId: "single-orientation", roles: gainRoles, text: "Halte vor dem Start Ziel und wichtigste Priorität in einem Satz fest." },
  { id: "energy-support-reliability", kind: "energySupport", semanticKey: "energy-support-reliability", patternId: "single-reliability", roles: gainRoles, text: "Lege wenige verlässliche Eckpunkte fest, bevor weitere Details offenbleiben." },
  { id: "energy-support-depth", kind: "energySupport", semanticKey: "energy-support-depth", patternId: "single-depth", roles: gainRoles, text: "Schütze ein Zeitfenster, in dem keine neue Aufgabe und kein Themenwechsel dazukommt." },
  { id: "energy-support-variety", kind: "energySupport", semanticKey: "energy-support-variety", patternId: "single-variety", roles: gainRoles, text: "Plane einen bewussten Themen-, Orts- oder Aktivitätswechsel ein." },
  { id: "energy-support-connection", kind: "energySupport", semanticKey: "energy-support-connection", patternId: "single-connection", roles: gainRoles, text: "Verabrede einen Austausch, bei dem ein ehrliches Gespräch tatsächlich Platz hat." },
  { id: "energy-support-recovery", kind: "energySupport", semanticKey: "energy-support-recovery", patternId: "single-recovery", roles: gainRoles, text: "Reserviere eine Phase, in der keine neue Anforderung hinzukommt." },
  { id: "energy-support-growth", kind: "energySupport", semanticKey: "energy-support-growth", patternId: "single-growth", roles: gainRoles, text: "Wähle eine kleine neue Herausforderung, die sich in einem überschaubaren Schritt erproben lässt." },
  { id: "energy-support-purpose", kind: "energySupport", semanticKey: "energy-support-purpose", patternId: "single-purpose", roles: gainRoles, text: "Mache vor einer Aufgabe sichtbar, welchen konkreten Beitrag sie leisten soll." },
  { id: "energy-support-feedback", kind: "energySupport", semanticKey: "energy-support-feedback", patternId: "single-feedback", roles: gainRoles, text: "Lege einen passenden Zeitpunkt für ehrliche und hilfreiche Resonanz fest." },

  { id: "energy-watchout-depth-recovery", kind: "energyWatchout", semanticKey: "energy-watchout-focus-recovery", patternId: "pair-depth-recovery", roles: drainRoles, text: "Beobachte, ob viele Unterbrechungen zusammen mit fehlendem Rückzug dich eher Kraft kosten.", suppresses: ["energy-watchout-depth", "energy-watchout-recovery"] },
  { id: "energy-watchout-growth-recovery", kind: "energyWatchout", semanticKey: "energy-watchout-growth-recovery", patternId: "pair-growth-recovery", roles: drainRoles, text: "Achte darauf, ob neue Anforderungen Erholungszeit dauerhaft verdrängen.", suppresses: ["energy-watchout-growth", "energy-watchout-recovery"] },
  { id: "energy-watchout-orientation-agency", kind: "energyWatchout", semanticKey: "energy-watchout-direction-freedom", patternId: "pair-orientation-agency", roles: drainRoles, text: "Beobachte, ob eine unklare Richtung zusammen mit engen Vorgaben dich eher Kraft kostet.", suppresses: ["energy-watchout-orientation", "energy-watchout-agency"] },
  { id: "energy-watchout-agency", kind: "energyWatchout", semanticKey: "energy-watchout-agency", patternId: "single-agency", roles: drainRoles, text: "Achte darauf, ob sehr enge Vorgaben ohne eigenen Gestaltungsspielraum dich eher Kraft kosten." },
  { id: "energy-watchout-orientation", kind: "energyWatchout", semanticKey: "energy-watchout-orientation", patternId: "single-orientation", roles: drainRoles, text: "Beobachte, wie sich unklare Erwartungen oder wechselnde Prioritäten auf deine verbleibende Energie auswirken." },
  { id: "energy-watchout-reliability", kind: "energyWatchout", semanticKey: "energy-watchout-reliability", patternId: "single-reliability", roles: drainRoles, text: "Achte darauf, ob viele kurzfristige Änderungen ohne verlässliche Basis dich eher Kraft kosten." },
  { id: "energy-watchout-depth", kind: "energyWatchout", semanticKey: "energy-watchout-depth", patternId: "single-depth", roles: drainRoles, text: "Beobachte, ob häufige Unterbrechungen längere Phasen deiner Aufmerksamkeit zerlegen." },
  { id: "energy-watchout-variety", kind: "energyWatchout", semanticKey: "energy-watchout-variety", patternId: "single-variety", roles: drainRoles, text: "Achte darauf, ob lange Gleichförmigkeit ohne neue Impulse dich eher Kraft kostet." },
  { id: "energy-watchout-connection", kind: "energyWatchout", semanticKey: "energy-watchout-connection", patternId: "single-connection", roles: drainRoles, text: "Beobachte, ob lange Phasen ohne passenden Austausch für dich auf Dauer anstrengender wirken." },
  { id: "energy-watchout-recovery", kind: "energyWatchout", semanticKey: "energy-watchout-recovery", patternId: "single-recovery", roles: drainRoles, text: "Achte darauf, ob dauernde Erreichbarkeit echten Rückzug verdrängt." },
  { id: "energy-watchout-growth", kind: "energyWatchout", semanticKey: "energy-watchout-growth", patternId: "single-growth", roles: drainRoles, text: "Beobachte, ob lange Phasen ohne Lern- oder Entwicklungsspielraum dich eher Kraft kosten." },
  { id: "energy-watchout-purpose", kind: "energyWatchout", semanticKey: "energy-watchout-purpose", patternId: "single-purpose", roles: drainRoles, text: "Achte darauf, ob Aufgaben ohne erkennbare Bedeutung für dich auf Dauer schwerer zu tragen sind." },
  { id: "energy-watchout-feedback", kind: "energyWatchout", semanticKey: "energy-watchout-feedback", patternId: "single-feedback", roles: drainRoles, text: "Beobachte, ob lange Phasen ohne hilfreiche Resonanz mehr Kraft verlangen." },

  { id: "work-orientation-agency", kind: "work", semanticKey: "work-direction-freedom", patternId: "pair-orientation-agency", roles: workRoles, text: "Definiere zuerst Ziel und zwei Grenzen. Lass anschließend offen, in welcher Reihenfolge du die einzelnen Schritte erledigst.", suppresses: ["work-orientation", "work-agency"] },
  { id: "work-reliability-variety", kind: "work", semanticKey: "work-anchor-variety", patternId: "pair-reliability-variety", roles: workRoles, text: "Setze wenige feste Eckpunkte und plane dazwischen bewusst unterschiedliche Aufgaben oder Vorgehensweisen ein.", suppresses: ["work-reliability", "work-variety"] },
  { id: "work-depth-recovery", kind: "work", semanticKey: "work-focus-recovery", patternId: "pair-depth-recovery", roles: workRoles, text: "Bündele anspruchsvolle Arbeit in einem geschützten Block und plane den Übergang in eine echte Pause direkt mit.", suppresses: ["work-depth", "work-recovery"] },
  { id: "work-depth-connection", kind: "work", semanticKey: "work-focus-exchange", patternId: "pair-depth-connection", roles: workRoles, text: "Durchdenke ein Thema zunächst in Ruhe und hole danach Rückmeldung zu einer klar benannten offenen Frage ein.", suppresses: ["work-depth", "work-connection"] },
  { id: "work-growth-recovery", kind: "work", semanticKey: "work-growth-recovery", patternId: "pair-growth-recovery", roles: workRoles, text: "Begrenze eine neue Herausforderung auf einen erreichbaren Schritt und reserviere danach Zeit ohne neue Lernanforderung.", suppresses: ["work-growth", "work-recovery"] },
  { id: "work-connection-growth", kind: "work", semanticKey: "work-connection-growth", patternId: "pair-connection-growth", roles: workRoles, text: "Wähle eine konkrete Lernfrage und bearbeite sie in einem Austausch, bei dem beide Seiten etwas ausprobieren können.", suppresses: ["work-connection", "work-growth"] },
  { id: "work-purpose-feedback", kind: "work", semanticKey: "work-impact-feedback", patternId: "pair-purpose-feedback", roles: workRoles, text: "Formuliere vor dem Start die gewünschte Wirkung und vereinbare einen Punkt, an dem du Resonanz genau dazu einholst.", suppresses: ["work-purpose", "work-feedback"] },
  { id: "work-agency", kind: "work", semanticKey: "work-agency", patternId: "single-agency", roles: workRoles, text: "Markiere vor dem Start, welche Entscheidungen feststehen und welche du während der Umsetzung selbst treffen kannst." },
  { id: "work-orientation", kind: "work", semanticKey: "work-orientation", patternId: "single-orientation", roles: workRoles, text: "Schreibe Ziel, wichtigste Priorität und ein Abschlusskriterium auf, bevor du die ersten Schritte planst." },
  { id: "work-reliability", kind: "work", semanticKey: "work-reliability", patternId: "single-reliability", roles: workRoles, text: "Lege zwei verlässliche Eckpunkte fest und entscheide weitere Details erst, wenn sie tatsächlich relevant werden." },
  { id: "work-depth", kind: "work", semanticKey: "work-depth", patternId: "single-depth", roles: workRoles, text: "Bündele eine anspruchsvolle Aufgabe in einem ununterbrochenen Zeitfenster mit klarer Start- und Endgrenze." },
  { id: "work-variety", kind: "work", semanticKey: "work-variety", patternId: "single-variety", roles: workRoles, text: "Wechsle bewusst nach einem abgeschlossenen Teilstück die Aufgabe oder Perspektive, statt ungeplant zu springen." },
  { id: "work-connection", kind: "work", semanticKey: "work-connection", patternId: "single-connection", roles: workRoles, text: "Plane einen Austausch mit einer konkreten Frage, statt Zusammenarbeit nur allgemein vorzusehen." },
  { id: "work-recovery", kind: "work", semanticKey: "work-recovery", patternId: "single-recovery", roles: workRoles, text: "Setze das Ende eines intensiven Blocks im Voraus und halte die anschließende Pause frei von neuen Aufgaben." },
  { id: "work-growth", kind: "work", semanticKey: "work-growth", patternId: "single-growth", roles: workRoles, text: "Formuliere eine kleine Lernfrage für die Aufgabe und prüfe sie an einem konkreten Arbeitsschritt." },
  { id: "work-purpose", kind: "work", semanticKey: "work-purpose", patternId: "single-purpose", roles: workRoles, text: "Benenne vor dem Start, für wen oder wofür das Ergebnis einen Unterschied machen soll." },
  { id: "work-feedback", kind: "work", semanticKey: "work-feedback", patternId: "single-feedback", roles: workRoles, text: "Lege vorab fest, zu welchem Zwischenstand du welche Art von Rückmeldung einholen möchtest." },

  { id: "learning-growth-agency", kind: "learning", semanticKey: "learning-self-directed", patternId: "single-growth", requiredDimensions: ["agency"], sourceLabel: "Entwicklung · Entscheidungsspielraum", roles: positiveRoles, text: "Setze dir eine klare Lernfrage und wähle selbst, mit welchem kleinen Praxisversuch du sie beantwortest." },
  { id: "learning-growth-depth", kind: "learning", semanticKey: "learning-depth", patternId: "single-growth", requiredDimensions: ["depth"], sourceLabel: "Entwicklung · Vertiefung", roles: positiveRoles, text: "Begrenze ein Lernthema so, dass du es in wenigen ruhigen Einheiten gründlich bearbeiten kannst." },
  { id: "learning-growth-feedback", kind: "learning", semanticKey: "learning-feedback", patternId: "single-growth", requiredDimensions: ["feedback"], sourceLabel: "Entwicklung · Rückmeldung", roles: positiveRoles, text: "Erprobe einen kleinen Lernschritt und hole anschließend Rückmeldung zu genau diesem Ergebnis ein." },
  { id: "learning-growth-variety", kind: "learning", semanticKey: "learning-variety", patternId: "single-growth", requiredDimensions: ["variety"], sourceLabel: "Entwicklung · Abwechslung", roles: positiveRoles, text: "Nutze unterschiedliche Lernimpulse, wähle aber jeweils nur einen davon für einen konkreten Praxistest aus." },
  { id: "learning-growth-connection", kind: "learning", semanticKey: "learning-connection", patternId: "single-growth", requiredDimensions: ["connection"], sourceLabel: "Entwicklung · Verbindung", roles: positiveRoles, text: "Bearbeite eine konkrete Lernfrage gemeinsam und vergleicht anschließend, was ihr jeweils ausprobiert habt." },
  { id: "learning-growth-recovery", kind: "learning", semanticKey: "learning-recovery", patternId: "single-growth", requiredDimensions: ["recovery"], sourceLabel: "Entwicklung · Erholung", roles: positiveRoles, text: "Plane eine begrenzte Lernphase und direkt danach Zeit ohne weiteren neuen Input." },
] as const;

export const selfHandbookActivityDefinitions: readonly SelfHandbookActivityDefinition[] = [
  {
    id: "activity-master",
    semanticKey: "activity-master",
    patternId: "pair-depth-recovery",
    roles: positiveRoles,
    title: "Etwas vertiefen und meistern",
    properties: ["begrenztes Thema", "wiederholte Vertiefung", "eigener Rhythmus"],
    why: "Aktivitäten, bei denen du ein klar begrenztes Thema wiederholt vertiefen und Fortschritt im eigenen Rhythmus beobachten kannst, könnten einen Versuch wert sein.",
    examples: [
      { id: "example-chess-go", activity: "Schach oder Go", why: "Eine klar begrenzte Aufgabe lässt sich über viele ruhige Durchgänge weiter vertiefen." },
      { id: "example-instrument", activity: "Ein Instrument üben", why: "Kurze wiederkehrende Einheiten machen Entwicklung beobachtbar, ohne ständig neue Reize zu verlangen." },
      { id: "example-programming-project", activity: "Ein kleines Programmierprojekt", why: "Ein abgegrenztes Vorhaben kann Schritt für Schritt durchdrungen und aufgebaut werden." },
    ],
  },
  {
    id: "activity-quiet-focus",
    semanticKey: "activity-quiet-focus",
    patternId: "pair-growth-recovery",
    roles: positiveRoles,
    title: "Ruhig fokussieren",
    properties: ["wenig Unterbrechung", "überschaubare Herausforderung", "Ruhephasen"],
    why: "Aktivitäten mit einer überschaubaren Herausforderung und ausreichend ruhigen Phasen könnten Entwicklung ermöglichen, ohne dauernd neuen Input zu verlangen.",
    examples: [
      { id: "example-research-reading", activity: "Ein Lese- oder Rechercheprojekt", why: "Du kannst eine eigene Frage in begrenzten ruhigen Einheiten verfolgen." },
      { id: "example-model-building", activity: "Modellbau oder ein größeres Puzzle", why: "Die Tätigkeit verbindet eine sichtbare Aufgabe mit ruhiger schrittweiser Annäherung." },
      { id: "example-nature-observation", activity: "Naturbeobachtung", why: "Aufmerksamkeit kann bei einem begrenzten Gegenstand bleiben, ohne dass ständig Neues hinzukommt." },
    ],
  },
  {
    id: "activity-discover-vary",
    semanticKey: "activity-discover-vary",
    patternId: "pair-reliability-variety",
    roles: positiveRoles,
    title: "Entdecken und variieren",
    properties: ["verlässlicher Rahmen", "neue Eindrücke", "bewusster Wechsel"],
    why: "Formate mit einem einfachen verlässlichen Rahmen und wechselnden Eindrücken könnten neue Impulse geben, ohne beliebig zu werden.",
    examples: [
      { id: "example-geocaching", activity: "Geocaching", why: "Die Suche gibt einen klaren Rahmen, während Ort und konkrete Aufgabe wechseln." },
      { id: "example-photo-walk", activity: "Fotowalks mit wechselnden Themen", why: "Ein festes Format lässt sich jeweils mit einem neuen Blickwinkel verbinden." },
      { id: "example-rotating-workshops", activity: "Kurze Workshops zu wechselnden Themen", why: "Jeder Termin bleibt überschaubar und bringt zugleich einen neuen praktischen Impuls." },
    ],
  },
  {
    id: "activity-focus-exchange",
    semanticKey: "activity-focus-exchange",
    patternId: "pair-depth-connection",
    roles: positiveRoles,
    title: "Fokus und Austausch verbinden",
    properties: ["eigene Vorbereitung", "gezielter Austausch", "gemeinsame Vertiefung"],
    why: "Aktivitäten mit eigener Vertiefungszeit und klaren gemeinsamen Austauschpunkten könnten beide Seiten des Musters verbinden.",
    examples: [
      { id: "example-book-club", activity: "Ein Buchclub mit eigener Vorbereitung", why: "Ruhige Beschäftigung mit dem Thema mündet in einen gezielten gemeinsamen Termin." },
      { id: "example-strategy-group", activity: "Eine Strategie-Spielgruppe", why: "Eigene Denkphasen und Austausch über unterschiedliche Wege wechseln sich ab." },
      { id: "example-peer-review", activity: "Ein kleines Peer-Review-Projekt", why: "Du arbeitest zunächst selbstständig und besprichst anschließend ein konkretes Ergebnis." },
    ],
  },
  {
    id: "activity-learn-together",
    semanticKey: "activity-learn-together",
    patternId: "pair-connection-growth",
    roles: positiveRoles,
    title: "Gemeinsam lernen",
    properties: ["Austausch", "praktisches Lernen", "gemeinsame Entwicklung"],
    why: "Aktivitäten, bei denen Lernen durch gemeinsamen Versuch und Austausch entsteht, könnten einen Versuch wert sein.",
    examples: [
      { id: "example-language-tandem", activity: "Ein Sprachtandem", why: "Beide Seiten lernen aktiv und erhalten direkte Resonanz im Gespräch." },
      { id: "example-study-circle", activity: "Ein Lernkreis", why: "Eine konkrete Frage kann aus mehreren Perspektiven bearbeitet und praktisch geprüft werden." },
      { id: "example-maker-workshop", activity: "Ein Maker- oder Coding-Workshop", why: "Gemeinsames Ausprobieren verbindet neue Fähigkeiten mit unmittelbarem Austausch." },
    ],
  },
  {
    id: "activity-contribute",
    semanticKey: "activity-contribute",
    patternId: "pair-purpose-feedback",
    roles: positiveRoles,
    title: "Verbinden und beitragen",
    properties: ["sichtbarer Beitrag", "Resonanz", "gemeinsames Vorhaben"],
    why: "Aktivitäten mit einem erkennbaren Beitrag und Rückmeldung auf die Wirkung könnten besonders nachvollziehbar erlebbar sein.",
    examples: [
      { id: "example-mentoring", activity: "Mentoring", why: "Der eigene Beitrag ist konkret und Resonanz entsteht im direkten Austausch." },
      { id: "example-volunteering", activity: "Ein Vereins- oder Ehrenamtsprojekt", why: "Ein gemeinsames Vorhaben macht Wirkung und Rückmeldung im Alltag sichtbar." },
      { id: "example-open-source-docs", activity: "Dokumentation für ein Open-Source-Projekt", why: "Ein klarer Beitrag kann anderen unmittelbar helfen und konkrete Rückmeldungen erhalten." },
    ],
  },
  {
    id: "activity-build-organize",
    semanticKey: "activity-build-organize",
    patternId: "pair-orientation-agency",
    roles: positiveRoles,
    title: "Planen und etwas aufbauen",
    properties: ["klares Ziel", "eigener Weg", "sichtbares Ergebnis"],
    why: "Aktivitäten mit einer klaren Richtung und Freiheit bei der Umsetzung könnten Raum geben, einen eigenen Weg zu einem sichtbaren Ergebnis zu entwickeln.",
    examples: [
      { id: "example-small-event", activity: "Ein kleines Event organisieren", why: "Das Ziel steht fest, während Ablauf und Umsetzung selbst gestaltet werden können." },
      { id: "example-upcycling", activity: "Ein Upcycling- oder Bauprojekt", why: "Ein konkretes Ergebnis gibt Orientierung, der praktische Weg bleibt offen." },
      { id: "example-project-coordination", activity: "Ein überschaubares Community-Projekt koordinieren", why: "Ein gemeinsames Ziel lässt sich mit selbst gewählten Schritten strukturieren." },
    ],
  },
  {
    id: "activity-expression-feedback",
    semanticKey: "activity-expression-feedback",
    patternId: "pair-purpose-feedback",
    roles: positiveRoles,
    title: "Ausdruck mit Resonanz",
    properties: ["eigener Ausdruck", "erkennbare Aussage", "hilfreiche Rückmeldung"],
    why: "Formate, in denen ein eigener Ausdruck eine erkennbare Aussage trägt und Resonanz erhält, könnten einen Versuch wert sein.",
    examples: [
      { id: "example-writing-group", activity: "Eine Schreibgruppe", why: "Ein eigener Text kann eine Aussage entwickeln und gezielte Rückmeldung erhalten." },
      { id: "example-photo-series", activity: "Eine Fotografie-Serie mit Feedback", why: "Ein selbst gesetztes Thema verbindet Ausdruck mit konkreter Resonanz." },
      { id: "example-choir-improv", activity: "Chor, Jam oder Impro-Workshop", why: "Ausdruck entsteht in einem gemeinsamen Rahmen und wird unmittelbar beantwortet." },
    ],
  },
] as const;

export const selfHandbookExperimentDefinitions: readonly SelfHandbookExperimentDefinition[] = [
  { id: "experiment-direction-freedom", semanticKey: "experiment-direction-freedom", patternId: "pair-orientation-agency", roles: workRoles, area: "work", title: "Ziel fest, Weg offen", action: "Nimm eine größere Aufgabe. Definiere nur Ziel und zwei feste Eckpunkte und entscheide den konkreten Weg während der Umsetzung.", scope: "Eine Aufgabe innerhalb der nächsten sieben Tage", observe: "Fällt dir diese Kombination aus Klarheit und Spielraum leichter als ein vollständig vorgegebener Ablauf?", suppresses: ["experiment-orientation", "experiment-agency"] },
  { id: "experiment-anchor-variety", semanticKey: "experiment-anchor-variety", patternId: "pair-reliability-variety", roles: workRoles, area: "work", title: "Feste Anker, bewusster Wechsel", action: "Lege für drei Tage zwei feste Eckpunkte fest und plane dazwischen jeweils einen bewusst anderen Aufgaben- oder Themenblock.", scope: "Drei Tage", observe: "Wirkt der Rahmen zugleich verlässlich und frisch genug, oder braucht eine Seite mehr Raum?", suppresses: ["experiment-reliability", "experiment-variety"] },
  { id: "experiment-focus-recovery", semanticKey: "experiment-focus-recovery", patternId: "pair-depth-recovery", roles: gainRoles, area: "energy", title: "Fokus mit echtem Übergang", action: "Teste zweimal einen ununterbrochenen Fokusblock und halte die Zeit danach frei von neuen Anforderungen.", scope: "Zwei Durchgänge von jeweils 45–90 Minuten plus Pause", observe: "Wie verändern sich Aufmerksamkeit und verbleibende Energie gegenüber einem Tag mit häufigen Wechseln?", suppresses: ["experiment-depth", "experiment-recovery"] },
  { id: "experiment-focus-exchange", semanticKey: "experiment-focus-exchange", patternId: "pair-depth-connection", roles: workRoles, area: "work", title: "Erst denken, dann austauschen", action: "Notiere deine Gedanken zu einer offenen Frage zunächst allein und besprich danach nur die wichtigsten zwei offenen Punkte mit einer Person.", scope: "Eine Entscheidung oder Aufgabe", observe: "Hilft dir diese Reihenfolge mehr als sofortiger Austausch oder vollständiges Alleinarbeiten?", suppresses: ["experiment-depth", "experiment-connection"] },
  { id: "experiment-growth-recovery", semanticKey: "experiment-growth-recovery", patternId: "pair-growth-recovery", roles: gainRoles, area: "energy", title: "Kleine Herausforderung, freie Pause", action: "Wähle eine neue, klar begrenzte Herausforderung und plane die anschließende Zeit bewusst ohne weiteren Lerninput.", scope: "Ein Versuch innerhalb einer Woche", observe: "Bleibt die Herausforderung interessant, wenn Erholung von Anfang an Teil des Versuchs ist?", suppresses: ["experiment-growth", "experiment-recovery"] },
  { id: "experiment-learn-together", semanticKey: "experiment-learn-together", patternId: "pair-connection-growth", roles: positiveRoles, area: "activity", title: "Eine Sache gemeinsam lernen", action: "Wähle mit einer anderen Person eine kleine Lernfrage und probiert jeweils einen konkreten Lösungsweg aus.", scope: "Ein Termin von 30–60 Minuten", observe: "Hilft der gemeinsame Vergleich dir, schneller zu verstehen oder motivierter weiterzumachen?", suppresses: ["experiment-connection", "experiment-growth"] },
  { id: "experiment-impact-feedback", semanticKey: "experiment-impact-feedback", patternId: "pair-purpose-feedback", roles: positiveRoles, area: "activity", title: "Wirkung benennen, Resonanz einholen", action: "Formuliere vor einer kleinen Aufgabe, welche Wirkung du erreichen möchtest, und bitte anschließend eine betroffene Person um Rückmeldung genau dazu.", scope: "Eine kleine Aufgabe in den nächsten sieben Tagen", observe: "Wird die Aufgabe greifbarer, wenn Beitrag und Resonanz konkret verbunden sind?", suppresses: ["experiment-purpose", "experiment-feedback"] },
  { id: "experiment-agency", semanticKey: "experiment-agency", patternId: "single-agency", roles: workRoles, area: "work", title: "Eine Entscheidung bewusst offenlassen", action: "Lege bei einer Aufgabe fest, welchen Schritt du erst während der Umsetzung selbst entscheiden möchtest.", scope: "Eine Aufgabe", observe: "Erzeugt dieser offene Entscheidungspunkt hilfreichen Spielraum oder eher zusätzliche Unklarheit?" },
  { id: "experiment-orientation", semanticKey: "experiment-orientation", patternId: "single-orientation", roles: workRoles, area: "work", title: "Ein Satz vor dem Start", action: "Formuliere vor einer Aufgabe Ziel, wichtigste Priorität und Abschlusskriterium in jeweils einem kurzen Satz.", scope: "Eine Aufgabe", observe: "Fällt dir der Einstieg oder das Abgrenzen unwichtiger Schritte dadurch leichter?" },
  { id: "experiment-reliability", semanticKey: "experiment-reliability", patternId: "single-reliability", roles: workRoles, area: "work", title: "Zwei verlässliche Eckpunkte", action: "Plane für drei Tage nur zwei feste Eckpunkte und lasse alle anderen Details bewusst flexibel.", scope: "Drei Tage", observe: "Welche Eckpunkte geben tatsächlich Halt, ohne unnötig viel festzulegen?" },
  { id: "experiment-depth", semanticKey: "experiment-depth", patternId: "single-depth", roles: workRoles, area: "work", title: "Ein geschützter Fokusblock", action: "Bearbeite eine klar begrenzte Aufgabe in einem ununterbrochenen Zeitfenster und bündele Rückfragen bis danach.", scope: "Ein Block von 45–90 Minuten", observe: "Verändert der Schutz vor Wechseln, wie gründlich oder leicht du vorankommst?" },
  { id: "experiment-variety", semanticKey: "experiment-variety", patternId: "single-variety", roles: positiveRoles, area: "activity", title: "Ein neuer Impuls im festen Rahmen", action: "Behalte den Rahmen einer vertrauten Aktivität bei und verändere bewusst genau einen Aspekt, etwa Ort, Thema oder Methode.", scope: "Zwei Durchgänge", observe: "Reicht der kleine Wechsel für neue Energie, oder wäre mehr beziehungsweise weniger Variation stimmiger?" },
  { id: "experiment-connection", semanticKey: "experiment-connection", patternId: "single-connection", roles: positiveRoles, area: "activity", title: "Ein gezielter Austausch", action: "Verabrede ein kurzes Gespräch zu genau einer Frage, die dich gerade beschäftigt.", scope: "20–30 Minuten", observe: "Hilft dir der gezielte Austausch mehr als ein offenes Gespräch ohne konkreten Fokus?" },
  { id: "experiment-recovery", semanticKey: "experiment-recovery", patternId: "single-recovery", roles: gainRoles, area: "energy", title: "Pause ohne neue Anforderungen", action: "Halte nach einer fordernden Phase eine Pause frei von Nachrichten, neuen Aufgaben und zusätzlichem Input.", scope: "Zwei Pausen innerhalb einer Woche", observe: "Fühlt sich diese Form des Rückzugs anders an als eine Pause mit weiterem Input?" },
  { id: "experiment-growth", semanticKey: "experiment-growth", patternId: "single-growth", roles: positiveRoles, area: "activity", title: "Ein kleines Lernprojekt", action: "Wähle eine Frage, die sich mit einem einzigen praktischen Versuch statt mit einem vollständigen Lernplan erkunden lässt.", scope: "Ein Versuch innerhalb einer Woche", observe: "Macht der kleine Praxisschritt den Einstieg leichter und möchtest du danach weiterlernen?" },
  { id: "experiment-purpose", semanticKey: "experiment-purpose", patternId: "single-purpose", roles: positiveRoles, area: "activity", title: "Den Beitrag vorher benennen", action: "Schreibe vor einer Aufgabe einen Satz dazu auf, wem oder was das Ergebnis dienen soll.", scope: "Eine Aufgabe", observe: "Verändert die sichtbare Verbindung zur Wirkung, wie du die Aufgabe angehst?" },
  { id: "experiment-feedback", semanticKey: "experiment-feedback", patternId: "single-feedback", roles: positiveRoles, area: "activity", title: "Eine präzise Rückmeldung", action: "Bitte zu einem kleinen Zwischenstand um Rückmeldung zu genau einer vorher formulierten Frage.", scope: "Ein Zwischenstand", observe: "Ist diese gezielte Resonanz hilfreicher als allgemeines Feedback?" },
] as const;
