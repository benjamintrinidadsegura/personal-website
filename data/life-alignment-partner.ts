import type {
  PartnerActionPathId,
  PartnerCertainty,
  PartnerConstraint,
  PartnerDesiredDirection,
  PartnerDifferenceStance,
  PartnerDimensionDefinition,
  PartnerExpectationClarity,
  PartnerExperience,
  PartnerFindingCategory,
  PartnerImportance,
} from "@/types/life-alignment-partner";

export const partnerModule = {
  id: "partner",
  href: "/life-alignment/partner",
  name: "Partner / Relationship",
  eyebrow: "Life Alignment · Für zwei Menschen",
  title: "Zwei Perspektiven – erst unabhängig, dann gemeinsam sichtbar.",
  description: "Eine qualitative Gegenüberstellung von Beziehungserfahrungen, Erwartungen und heutigen Bedingungen. Kein Kompatibilitätstest und keine Entscheidung darüber, wer recht hat.",
  duration: "Zwei unabhängige Durchgänge · etwa 15–20 Minuten",
  privacy: "Alle Angaben bleiben im Arbeitsspeicher dieser Seite. Es gibt kein Konto, keine Einladung, keine Übertragung und keine Speicherung. Ein Neuladen beendet die Sitzung.",
} as const;

export const partnerScene = {
  src: "/images/life-alignment/context-scenes/partner.webp",
  eyebrow: "Human Context · Zwei eigenständige Perspektiven",
  title: "Erst für sich nachdenken, dann gemeinsam hinschauen.",
  description:
    "Die Szene zeigt eine gleichberechtigte Alltagssituation. Sie schreibt weder eine Beziehungsform noch Rollen oder eine richtige Lösung vor.",
  alt: "Zwei Menschen reflektieren an einem gemeinsamen Tisch zunächst jeweils für sich und wenden sich anschließend ihren Perspektiven zu.",
} as const;

export const partnerSections = [
  { id: "dimensions", title: "Themen wählen" },
  { id: "experience", title: "Heute erleben" },
  { id: "expectations", title: "Richtung und Kontext" },
  { id: "review", title: "Prüfen und freigeben" },
] as const;

export const partnerDimensions: readonly PartnerDimensionDefinition[] = [
  { id: "connection", title: "Nähe und Verbundenheit", description: "Emotionale Nähe, Zugewandtheit und das Gefühl, miteinander verbunden zu sein.", examples: ["einander nach einem anstrengenden Tag bewusst zuhören", "Verbundenheit über Distanz oder unterschiedliche Tagesrhythmen halten", "Zuneigung so zeigen, dass sie für die andere Person ankommt"] },
  { id: "communication", title: "Kommunikation", description: "Wie Informationen, Gefühle, Bedürfnisse und schwierige Themen miteinander geteilt werden.", examples: ["eine Planänderung rechtzeitig mitteilen", "ein Missverständnis ansprechen, ohne sofort eine Lösung zu verlangen", "bei Nachrichten und Antworten unterschiedliche Rhythmen klären"] },
  { id: "reliability", title: "Verlässlichkeit", description: "Absprachen, Erreichbarkeit und das Vertrauen darauf, dass Vereinbartes trägt.", examples: ["eine Zusage einhalten oder frühzeitig neu verhandeln", "in einer belastenden Woche realistisch erreichbar sein", "klar benennen, worauf sich die andere Person verlassen kann"] },
  { id: "shared-time", title: "Gemeinsame Zeit", description: "Wie viel und welche Art von Zeit bewusst miteinander verbracht wird.", examples: ["Alltagszeit und bewusst geplante Zeit unterscheiden", "gemeinsame Momente trotz Schichtarbeit, Distanz oder Sorgearbeit finden", "entscheiden, wann Zusammensein und wann Erholung allein hilfreicher ist"] },
  { id: "autonomy", title: "Eigenständigkeit und Freiraum", description: "Persönlicher Raum, eigene Interessen und Entscheidungen innerhalb der Beziehung.", examples: ["Zeit mit eigenen Freundschaften oder Interessen schützen", "Entscheidungen mitteilen, gemeinsam abstimmen oder allein treffen", "Rückzug brauchen, ohne Verbundenheit grundsätzlich infrage zu stellen"] },
  { id: "responsibilities", title: "Verantwortung im Alltag", description: "Aufgaben, Fürsorge, mentale Last und praktische Zuständigkeiten.", examples: ["Termine, Haushalt oder organisatorische Arbeit sichtbar verteilen", "Sorge für Kinder, Angehörige, Tiere oder Gesundheit einplanen", "bei unterschiedlicher Kapazität Aufgaben vorübergehend neu ordnen"] },
  { id: "finances", title: "Geld und finanzielle Absprachen", description: "Ausgaben, Sicherheit, Verantwortung und Transparenz rund um Geld.", examples: ["gemeinsame und getrennte Ausgaben nachvollziehbar vereinbaren", "mit ungleichen Einkommen oder finanziellen Verpflichtungen umgehen", "eine größere Ausgabe oder ein Sicherheitsbedürfnis besprechen"], sensitive: true },
  { id: "physical-intimacy", title: "Körperliche Nähe und Intimität", description: "Körperliche Zuwendung, Grenzen und Wünsche – ohne Annahmen darüber, was richtig sein sollte.", examples: ["Formen körperlicher Nähe ausdrücklich statt vorausgesetzt abstimmen", "ein Nein, Vielleicht oder Heute-nicht ohne Druck respektieren", "über unterschiedliche Wünsche sprechen, ohne Anspruch auf Zustimmung"], sensitive: true },
] as const;

export const partnerExperienceOptions: Readonly<Record<PartnerExperience, string>> = {
  "less-than-needed": "Erhält aus meiner Sicht weniger Raum, als ich brauche",
  workable: "Fühlt sich für mich derzeit tragfähig an",
  "more-than-needed": "Nimmt aus meiner Sicht mehr Raum ein, als ich brauche",
  mixed: "Ich erlebe unterstützende und schwierige Seiten zugleich",
  unclear: "Ich kann mein heutiges Erleben noch nicht klar einordnen",
};

export const partnerDirectionOptions: Readonly<Record<PartnerDesiredDirection, string>> = {
  less: "Davon wünsche ich mir weniger",
  similar: "Das darf im Wesentlichen ähnlich bleiben",
  more: "Davon wünsche ich mir mehr",
  different: "Ich wünsche mir eine andere Form",
  open: "Meine gewünschte Richtung ist noch offen",
};

export const partnerImportanceOptions: Readonly<Record<PartnerImportance, string>> = {
  important: "Für mich gerade wichtig",
  somewhat: "Bedeutsam, aber nicht vorrangig",
  "not-central": "Für mich derzeit nicht zentral",
};

export const partnerCertaintyOptions: Readonly<Record<PartnerCertainty, string>> = {
  clear: "Ich bin mir dieser Einordnung eher sicher",
  unsure: "Ich bin mir noch unsicher",
};

export const partnerExpectationClarityOptions: Readonly<Record<PartnerExpectationClarity, string>> = {
  "current-confirmed": "Wir haben unsere heutigen Erwartungen dazu aktuell bestätigt",
  assumed: "Ich nehme derzeit nur an, was die andere Person erwartet",
  "discussed-before-current-unclear": "Wir haben früher darüber gesprochen; ob das noch gilt, ist unklar",
  "currently-unclear": "Unsere heutigen Erwartungen dazu sind nicht geklärt",
  "intentionally-open": "Wir lassen die Erwartung dazu derzeit bewusst offen",
};

export const partnerDifferenceStanceOptions: Readonly<Record<PartnerDifferenceStance, string>> = {
  discuss: "Eine mögliche Differenz möchte ich besprechen",
  acceptable: "Eine Differenz darf für mich bestehen bleiben",
  uncertain: "Ich weiß noch nicht, wie ich mit einer Differenz umgehen möchte",
};

export const partnerConstraintOptions: Readonly<Record<PartnerConstraint, string>> = {
  none: "Ich sehe derzeit keine konkrete Einschränkung",
  capacity: "Zeit, Energie oder Belastbarkeit begrenzen den Spielraum",
  practical: "Praktische oder finanzielle Bedingungen begrenzen den Spielraum",
  external: "Andere Verantwortungen oder Menschen entscheiden wesentlich mit",
  unclear: "Ich bin noch unsicher, was den Spielraum begrenzt",
};

export const partnerFindingLabels: Readonly<Record<PartnerFindingCategory, string>> = {
  "shared-ground": "Gemeinsamer Boden",
  "different-expectations": "Unterschiedliche Erwartungen",
  "direction-difference": "Unterschiedliche Richtung",
  uncertainty: "Unsicherheit oder fehlende Information",
  "accepted-difference": "Akzeptierte Differenz",
  "present-constraint": "Gegenwärtige Bedingung",
  "worth-discussing": "Klärung könnte hilfreich sein",
  "not-assessed-by-both": "Noch nicht gemeinsam betrachtet",
};

export const partnerPathCopy: Readonly<Record<PartnerActionPathId, { title: string; approach: string; tradeoffs: string; reversibility: string; whatCouldBeLearned: string }>> = {
  "clarify-expectation": { title: "Eine Erwartung klären", approach: "Formuliert nacheinander, was jede Person konkret erwartet, und prüft erst danach, was tatsächlich gemeinsam vereinbart ist.", tradeoffs: "Mehr Klarheit kann eine bisher angenehme Mehrdeutigkeit auflösen; sie verpflichtet euch noch nicht zu einer Einigung.", reversibility: "Das Gespräch sammelt Informationen und trifft noch keine dauerhafte Entscheidung.", whatCouldBeLearned: "Ob ihr tatsächlich Unterschiedliches erwartet oder bisher nur unterschiedliche Beispiele und Wörter verwendet." },
  conversation: { title: "Ein ruhiges Gespräch anbieten", approach: "Wählt nur dann ein Thema, wenn beide sprechen möchten. Gebt beiden Perspektiven gleich viel Raum und prüft zunächst nur, ob ihr einander richtig verstanden habt.", tradeoffs: "Ein Gespräch braucht Zeit, freiwillige Beteiligung und ausreichend Sicherheit; eine Pause oder ein Nein ist eine vollständige Antwort.", reversibility: "Ihr könnt das Thema nach einem begrenzten Gespräch bewusst offenlassen oder das Gespräch jederzeit beenden.", whatCouldBeLearned: "Welche Erfahrung, Sorge oder Hoffnung hinter der jeweiligen Einordnung steht – ohne dass daraus sofort eine Einigung folgen muss." },
  "practical-arrangement": { title: "Eine praktische Absprache aushandeln", approach: "Übersetzt eine unterschiedliche Erwartung in eine kleine, beobachtbare Absprache für den Alltag.", tradeoffs: "Eine konkrete Regel schafft Klarheit, kann sich aber zunächst unnatürlich oder zu eng anfühlen.", reversibility: "Vereinbart von Anfang an einen kurzen Prüfzeitpunkt und eine einfache Rückkehr zum vorherigen Zustand.", whatCouldBeLearned: "Ob eine konkrete Form beiden hilft und welche unbeabsichtigten Kosten sie im Alltag erzeugt." },
  boundary: { title: "Eine Grenze deutlicher machen", approach: "Benennt, was jede Person geben kann, was nicht und woran eine Grenze im Alltag erkennbar wird.", tradeoffs: "Eine klare Grenze kann enttäuschen und zugleich Druck oder unausgesprochene Erwartungen verringern.", reversibility: "Die Formulierung kann nach neuer Information gemeinsam angepasst werden; die aktuelle Grenze gilt bis dahin.", whatCouldBeLearned: "Welche Spannung durch Unklarheit entsteht und welche tatsächlich trotz klarer Grenze bestehen bleibt." },
  "gather-information": { title: "Fehlende Information sammeln", approach: "Klärt eine offene Tatsache oder bittet um ein konkretes Beispiel, bevor ihr eine Differenz bewertet.", tradeoffs: "Das verzögert eine Lösung, schützt aber davor, Annahmen wie Tatsachen zu behandeln.", reversibility: "Information zu sammeln verändert noch keine Vereinbarung.", whatCouldBeLearned: "Welche Annahme bestätigt wird, welche sich verändert und welche Frage danach noch offen ist." },
  "reversible-change": { title: "Eine kleine Veränderung ausprobieren", approach: "Testet für einen begrenzten Zeitraum eine kleine andere Form und beobachtet getrennt, was sie erleichtert oder erschwert.", tradeoffs: "Ein Versuch kann kurzfristig Aufwand erzeugen und muss nicht für beide gleich hilfreich sein.", reversibility: "Legt Dauer, Stoppsignal und Rückkehrmöglichkeit vor dem Versuch fest.", whatCouldBeLearned: "Wie die Veränderung auf Nähe, Druck, Kapazität und praktische Abläufe für beide wirkt." },
  "accept-difference": { title: "Eine Differenz bewusst stehen lassen", approach: "Benennt die Differenz als bekannt und prüft, welche gegenseitige Rücksicht trotzdem nötig ist.", tradeoffs: "Akzeptanz spart Lösungsdruck, darf aber nicht dazu dienen, Grenzen oder fehlende Zustimmung zu übergehen.", reversibility: "Ihr könnt die Einordnung neu öffnen, wenn sich Wirkung oder Umstände verändern.", whatCouldBeLearned: "Ob die Differenz mit klarer Rücksicht tragfähig ist oder weiterhin einseitige Kosten verursacht." },
  "leave-open": { title: "Das Thema vorerst offenlassen", approach: "Haltet fest, welche Frage noch offen ist und woran ihr erkennen würdet, dass ein späteres Gespräch hilfreich wäre.", tradeoffs: "Eine Pause schützt Kapazität, lässt die zugrunde liegende Unsicherheit aber bestehen.", reversibility: "Offenlassen ist ausdrücklich keine endgültige Entscheidung.", whatCouldBeLearned: "Ob Abstand Klarheit bringt und welches Signal einen passenden Zeitpunkt zum erneuten Öffnen markiert." },
  "external-support": { title: "Angemessene externe Unterstützung erwägen", approach: "Prüft gemeinsam, welche Art neutraler oder professioneller Unterstützung zum Thema und zu eurer Sicherheit passen könnte.", tradeoffs: "Unterstützung kostet Zeit, Geld oder Überwindung und ersetzt nicht die Zustimmung beider Personen.", reversibility: "Ein erstes Informationsgespräch verpflichtet euch nicht zur Fortsetzung. Dieses Tool empfiehlt keine konkrete Stelle.", whatCouldBeLearned: "Welche Gesprächsbedingungen oder fachlichen Perspektiven euch allein fehlen und welche Art Unterstützung passen könnte." },
};

export const PARTNER_DISCLAIMER = "Diese Gegenüberstellung ordnet nur eure ausdrücklich freigegebenen Antworten. Sie misst keine Kompatibilität, diagnostiziert niemanden und entscheidet nicht, welche Perspektive richtig ist. Bei Angst, Kontrolle, Gewalt oder fehlender Sicherheit ist ein gemeinsames Gespräch nicht automatisch der passende nächste Schritt.";
