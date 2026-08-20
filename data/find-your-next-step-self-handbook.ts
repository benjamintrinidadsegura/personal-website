import type {
  SelfReflectionDimensionId,
  SelfReflectionEvidenceRole,
} from "@/types/find-your-next-step";
import { getSelfReflectionDimensions } from "@/data/find-your-next-step-self";
import type { Locale } from "@/lib/i18n/config";

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

function patternLabel(dimensions: readonly SelfReflectionDimensionId[], locale: Locale): string {
  const copy = getSelfReflectionDimensions(locale);
  return dimensions.map((dimension) => copy[dimension].label).join(" · ");
}

function localizedText(kind: SelfHandbookTextKind, label: string, locale: Locale): string {
  const lower = label.toLocaleLowerCase({ de: "de-DE", en: "en-GB", es: "es", tr: "tr", pl: "pl", el: "el", ru: "ru" }[locale]);
  const templates: Record<Locale, Record<SelfHandbookTextKind, string>> = {
    de: { decision: `Gibt diese Option genug Raum für ${lower}?`, environment: `Das Umfeld schafft bewusst praktischen Raum für ${lower}.`, energySupport: `Plane einen begrenzten Moment, der ${lower} aktiv unterstützt.`, energyWatchout: `Beobachte, ob zu wenig Raum für ${lower} mit der Zeit Energie kostet.`, work: `Gestalte einen Arbeitsblock so, dass ${lower} darin einen klaren Platz hat.`, learning: `Wähle eine kleine Lernfrage, die Praxis und ${lower} verbindet.` },
    en: { decision: `Would this option give enough room for ${lower}?`, environment: `The environment makes deliberate, practical room for ${lower}.`, energySupport: `Plan one bounded moment that actively supports ${lower}.`, energyWatchout: `Observe whether too little room for ${lower} drains your energy over time.`, work: `Shape one work block so that ${lower} has a clear place in it.`, learning: `Choose one small learning question that combines practice with ${lower}.` },
    es: { decision: `¿Esta opción deja suficiente espacio para ${lower}?`, environment: `El entorno crea un espacio práctico y deliberado para ${lower}.`, energySupport: `Planifica un momento limitado que apoye activamente ${lower}.`, energyWatchout: `Observa si dejar poco espacio para ${lower} consume tu energía con el tiempo.`, work: `Organiza un bloque de trabajo para que ${lower} tenga un lugar claro.`, learning: `Elige una pequeña pregunta de aprendizaje que una la práctica con ${lower}.` },
    tr: { decision: `Bu seçenek ${lower} için yeterli alan sağlıyor mu?`, environment: `Ortam, ${lower} için bilinçli ve pratik alan yaratır.`, energySupport: `${lower} özelliğini etkin biçimde destekleyen sınırlı bir an planla.`, energyWatchout: `${lower} için çok az alanın zamanla enerjini azaltıp azaltmadığını gözlemle.`, work: `Bir çalışma bloğunu ${lower} için net bir yer olacak şekilde düzenle.`, learning: `Uygulamayla ${lower} özelliğini birleştiren küçük bir öğrenme sorusu seç.` },
    pl: { decision: `Czy ta opcja daje dość miejsca na: ${lower}?`, environment: `Otoczenie świadomie i praktycznie tworzy miejsce na: ${lower}.`, energySupport: `Zaplanuj ograniczony moment, który aktywnie wspiera: ${lower}.`, energyWatchout: `Obserwuj, czy zbyt mało miejsca na ${lower} z czasem odbiera Ci energię.`, work: `Ułóż jeden blok pracy tak, aby ${lower} miało w nim jasne miejsce.`, learning: `Wybierz małe pytanie uczące, które łączy praktykę z obszarem: ${lower}.` },
    el: { decision: `Αφήνει αυτή η επιλογή αρκετό χώρο για «${label}»;`, environment: `Το περιβάλλον δημιουργεί σκόπιμο και πρακτικό χώρο για «${label}».`, energySupport: `Σχεδίασε μία οριοθετημένη στιγμή που υποστηρίζει ενεργά το «${label}».`, energyWatchout: `Παρατήρησε αν ο πολύ λίγος χώρος για «${label}» αφαιρεί ενέργεια με τον χρόνο.`, work: `Διαμόρφωσε ένα τμήμα εργασίας ώστε το «${label}» να έχει σαφή θέση.`, learning: `Επίλεξε ένα μικρό ερώτημα μάθησης που συνδέει την πράξη με το «${label}».` },
    ru: { decision: `Даёт ли этот вариант достаточно места для фактора «${label}»?`, environment: `Среда намеренно и практически создаёт место для фактора «${label}».`, energySupport: `Запланируй один ограниченный момент, который активно поддерживает «${label}».`, energyWatchout: `Наблюдай, не отнимает ли со временем энергию недостаток места для «${label}».`, work: `Организуй один рабочий блок так, чтобы у фактора «${label}» было ясное место.`, learning: `Выбери небольшой учебный вопрос, соединяющий практику с фактором «${label}».` },
  };
  return templates[locale][kind];
}

function buildLocalizedPatterns(locale: Exclude<Locale, "de">): readonly SelfHandbookPatternDefinition[] {
  return selfHandbookPatterns.map((pattern) => ({ ...pattern, label: patternLabel(pattern.dimensions, locale) }));
}

const handbookPatternFactories: Record<Locale, () => readonly SelfHandbookPatternDefinition[]> = {
  de: () => selfHandbookPatterns, en: () => buildLocalizedPatterns("en"), es: () => buildLocalizedPatterns("es"), tr: () => buildLocalizedPatterns("tr"), pl: () => buildLocalizedPatterns("pl"), el: () => buildLocalizedPatterns("el"), ru: () => buildLocalizedPatterns("ru"),
};

export function getSelfHandbookPatterns(locale: Locale): readonly SelfHandbookPatternDefinition[] { return handbookPatternFactories[locale](); }

const handbookFollowUp: Record<Exclude<Locale, "de">, (label: string) => string> = {
  en: (label) => `What would be one small, observable sign that ${label.toLocaleLowerCase("en-GB")} is supported well enough?`,
  es: (label) => `¿Qué pequeña señal observable mostraría que ${label.toLocaleLowerCase("es")} tiene suficiente apoyo?`,
  tr: (label) => `${label.toLocaleLowerCase("tr")} yeterince desteklendiğinde hangi küçük ve gözlenebilir işareti görürdün?`,
  pl: (label) => `Jaki mały, zauważalny znak pokaże, że obszar „${label}” ma wystarczające wsparcie?`,
  el: (label) => `Ποια μικρή, παρατηρήσιμη ένδειξη θα έδειχνε ότι το «${label}» υποστηρίζεται αρκετά;`,
  ru: (label) => `Какой небольшой наблюдаемый признак покажет, что «${label}» поддерживается достаточно?`,
};

function buildLocalizedTextDefinitions(locale: Exclude<Locale, "de">): readonly SelfHandbookTextDefinition[] {
  const patterns = new Map(getSelfHandbookPatterns(locale).map((pattern) => [pattern.id, pattern]));
  return selfHandbookTextDefinitions.map((definition) => {
    const pattern = patterns.get(definition.patternId);
    const dimensions = [...(pattern?.dimensions ?? []), ...(definition.requiredDimensions ?? [])];
    const label = patternLabel([...new Set(dimensions)], locale);
    const followUp = handbookFollowUp[locale](label);
    return {
      ...definition,
      text: localizedText(definition.kind, label, locale),
      sourceLabel: definition.sourceLabel ? label : undefined,
      followUp: definition.followUp ? { ...definition.followUp, text: followUp } : undefined,
    };
  });
}

const handbookTextFactories: Record<Locale, () => readonly SelfHandbookTextDefinition[]> = {
  de: () => selfHandbookTextDefinitions, en: () => buildLocalizedTextDefinitions("en"), es: () => buildLocalizedTextDefinitions("es"), tr: () => buildLocalizedTextDefinitions("tr"), pl: () => buildLocalizedTextDefinitions("pl"), el: () => buildLocalizedTextDefinitions("el"), ru: () => buildLocalizedTextDefinitions("ru"),
};

export function getSelfHandbookTextDefinitions(locale: Locale): readonly SelfHandbookTextDefinition[] { return handbookTextFactories[locale](); }

type ActivityLocaleCopy = { title: string; properties: string[]; why: string; example: (index: number) => { activity: string; why: string } };

const activityCopyFactory: Record<Exclude<Locale, "de">, (label: string) => ActivityLocaleCopy> = {
  en: (label) => ({ title: `Activities with ${label}`, properties: [`lets ${label.toLocaleLowerCase("en-GB")} become observable`, "can be tried on a small scale", "leaves the interpretation with you"], why: `This direction combines ${label.toLocaleLowerCase("en-GB")} without presenting it as a fixed hobby or aptitude recommendation.`, example: (index) => ({ activity: `${label} practice ${index + 1}`, why: `A bounded example in which you can observe how ${label.toLocaleLowerCase("en-GB")} feels in practice.` }) }),
  es: (label) => ({ title: `Actividades con ${label}`, properties: [`hace observable ${label.toLocaleLowerCase("es")}`, "puede probarse a pequeña escala", "deja la interpretación en tus manos"], why: `Esta dirección combina ${label.toLocaleLowerCase("es")} sin convertirlo en una afición fija ni una recomendación de aptitud.`, example: (index) => ({ activity: `Práctica ${index + 1} · ${label}`, why: `Un ejemplo limitado para observar cómo se siente ${label.toLocaleLowerCase("es")} en la práctica.` }) }),
  tr: (label) => ({ title: `${label} içeren faaliyetler`, properties: [`${label.toLocaleLowerCase("tr")} gözlenebilir olur`, "küçük ölçekte denenebilir", "yorumlama sende kalır"], why: `Bu yön ${label.toLocaleLowerCase("tr")} birleşimini sabit hobi veya yetenek önerisi olarak sunmaz.`, example: (index) => ({ activity: `${label} denemesi ${index + 1}`, why: `${label.toLocaleLowerCase("tr")} özelliğinin pratikte nasıl hissettirdiğini görebileceğin sınırlı bir örnek.` }) }),
  pl: (label) => ({ title: `Działania wspierające: ${label}`, properties: [`pozwala zaobserwować: ${label.toLocaleLowerCase("pl")}`, "można sprawdzić w małej skali", "pozostawia interpretację po Twojej stronie"], why: `Ten kierunek łączy ${label.toLocaleLowerCase("pl")} bez przedstawiania go jako stałego hobby lub rekomendacji predyspozycji.`, example: (index) => ({ activity: `${label} · próba ${index + 1}`, why: `Ograniczony przykład, w którym sprawdzisz, jak ${label.toLocaleLowerCase("pl")} działa w praktyce.` }) }),
  el: (label) => ({ title: `Δραστηριότητες με «${label}»`, properties: [`κάνει το «${label}» παρατηρήσιμο`, "δοκιμάζεται σε μικρή κλίμακα", "αφήνει την ερμηνεία σε εσένα"], why: `Αυτή η κατεύθυνση συνδυάζει το «${label}» χωρίς να το παρουσιάζει ως σταθερό χόμπι ή σύσταση καταλληλότητας.`, example: (index) => ({ activity: `${label} · δοκιμή ${index + 1}`, why: `Οριοθετημένο παράδειγμα για να παρατηρήσεις πώς λειτουργεί το «${label}» στην πράξη.` }) }),
  ru: (label) => ({ title: `Занятия с фактором «${label}»`, properties: [`позволяет наблюдать «${label}»`, "можно проверить в небольшом масштабе", "оставляет интерпретацию за тобой"], why: `Это направление соединяет «${label}», не превращая его в фиксированное хобби или рекомендацию способностей.`, example: (index) => ({ activity: `${label} · проба ${index + 1}`, why: `Ограниченный пример, позволяющий заметить, как «${label}» ощущается на практике.` }) }),
};

function buildLocalizedActivityDefinitions(locale: Exclude<Locale, "de">): readonly SelfHandbookActivityDefinition[] {
  const patterns = new Map(getSelfHandbookPatterns(locale).map((pattern) => [pattern.id, pattern]));
  return selfHandbookActivityDefinitions.map((definition) => {
    const label = patterns.get(definition.patternId)?.label ?? definition.id;
    const copy = activityCopyFactory[locale](label);
    return {
      ...definition,
      title: copy.title, properties: copy.properties, why: copy.why,
      examples: definition.examples.map((example, index) => ({ ...example, ...copy.example(index) })),
    };
  });
}

const handbookActivityFactories: Record<Locale, () => readonly SelfHandbookActivityDefinition[]> = {
  de: () => selfHandbookActivityDefinitions, en: () => buildLocalizedActivityDefinitions("en"), es: () => buildLocalizedActivityDefinitions("es"), tr: () => buildLocalizedActivityDefinitions("tr"), pl: () => buildLocalizedActivityDefinitions("pl"), el: () => buildLocalizedActivityDefinitions("el"), ru: () => buildLocalizedActivityDefinitions("ru"),
};

export function getSelfHandbookActivityDefinitions(locale: Locale): readonly SelfHandbookActivityDefinition[] { return handbookActivityFactories[locale](); }

type ExperimentLocaleCopy = { title: string; action: string; work: string; energy: string; activity: string; observe: string };

const experimentCopyFactory: Record<Exclude<Locale, "de">, (label: string) => ExperimentLocaleCopy> = {
  en: (label) => ({ title: `A small test for ${label}`, action: `Choose one ordinary situation and deliberately create a little more room for ${label.toLocaleLowerCase("en-GB")}.`, work: "One task within the next seven days", energy: "Two short trials within one week", activity: "One small activity within the next seven days", observe: `What changes, and what remains difficult, when ${label.toLocaleLowerCase("en-GB")} is supported more deliberately?` }),
  es: (label) => ({ title: `Una pequeña prueba de ${label}`, action: `Elige una situación cotidiana y crea deliberadamente algo más de espacio para ${label.toLocaleLowerCase("es")}.`, work: "Una tarea en los próximos siete días", energy: "Dos pruebas breves en una semana", activity: "Una actividad pequeña en los próximos siete días", observe: `¿Qué cambia y qué sigue siendo difícil cuando apoyas con más intención ${label.toLocaleLowerCase("es")}?` }),
  tr: (label) => ({ title: `${label} için küçük bir deneme`, action: `Gündelik bir durum seç ve ${label.toLocaleLowerCase("tr")} için bilinçli olarak biraz daha alan yarat.`, work: "Önümüzdeki yedi günde bir görev", energy: "Bir hafta içinde iki kısa deneme", activity: "Önümüzdeki yedi günde küçük bir faaliyet", observe: `${label.toLocaleLowerCase("tr")} daha bilinçli desteklendiğinde ne değişiyor, ne zor kalıyor?` }),
  pl: (label) => ({ title: `Mała próba: ${label}`, action: `Wybierz zwykłą sytuację i świadomie stwórz trochę więcej miejsca na ${label.toLocaleLowerCase("pl")}.`, work: "Jedno zadanie w ciągu siedmiu dni", energy: "Dwie krótkie próby w ciągu tygodnia", activity: "Jedna mała aktywność w ciągu siedmiu dni", observe: `Co się zmienia, a co pozostaje trudne, gdy świadomiej wspierasz ${label.toLocaleLowerCase("pl")}?` }),
  el: (label) => ({ title: `Μικρή δοκιμή για «${label}»`, action: `Επίλεξε μια συνηθισμένη κατάσταση και δημιούργησε σκόπιμα λίγο περισσότερο χώρο για «${label}».`, work: "Ένα έργο μέσα στις επόμενες επτά ημέρες", energy: "Δύο σύντομες δοκιμές μέσα σε μία εβδομάδα", activity: "Μία μικρή δραστηριότητα μέσα στις επόμενες επτά ημέρες", observe: `Τι αλλάζει και τι παραμένει δύσκολο όταν το «${label}» υποστηρίζεται πιο συνειδητά;` }),
  ru: (label) => ({ title: `Небольшая проба для «${label}»`, action: `Выбери обычную ситуацию и намеренно создай немного больше места для фактора «${label}».`, work: "Одна задача в ближайшие семь дней", energy: "Две короткие пробы за неделю", activity: "Одно небольшое занятие в ближайшие семь дней", observe: `Что меняется, а что остаётся трудным, когда «${label}» поддерживается более осознанно?` }),
};

function buildLocalizedExperimentDefinitions(locale: Exclude<Locale, "de">): readonly SelfHandbookExperimentDefinition[] {
  const patterns = new Map(getSelfHandbookPatterns(locale).map((pattern) => [pattern.id, pattern]));
  return selfHandbookExperimentDefinitions.map((definition) => {
    const label = patterns.get(definition.patternId)?.label ?? definition.id;
    const copy = experimentCopyFactory[locale](label);
    return {
      ...definition,
      title: copy.title, action: copy.action,
      scope: definition.area === "work" ? copy.work : definition.area === "energy" ? copy.energy : copy.activity,
      observe: copy.observe,
    };
  });
}

const handbookExperimentFactories: Record<Locale, () => readonly SelfHandbookExperimentDefinition[]> = {
  de: () => selfHandbookExperimentDefinitions, en: () => buildLocalizedExperimentDefinitions("en"), es: () => buildLocalizedExperimentDefinitions("es"), tr: () => buildLocalizedExperimentDefinitions("tr"), pl: () => buildLocalizedExperimentDefinitions("pl"), el: () => buildLocalizedExperimentDefinitions("el"), ru: () => buildLocalizedExperimentDefinitions("ru"),
};

export function getSelfHandbookExperimentDefinitions(locale: Locale): readonly SelfHandbookExperimentDefinition[] { return handbookExperimentFactories[locale](); }
