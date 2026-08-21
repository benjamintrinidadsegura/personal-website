import { getSelfReflectionDimensions, selfReflectionDimensions } from "@/data/find-your-next-step-self";
import type { SelfReflectionDimensionId } from "@/types/find-your-next-step";
import type { Locale } from "@/lib/i18n/config";

export type SelfProfileId =
  | "profile-own-course"
  | "profile-moving-anchor"
  | "profile-quiet-depth"
  | "profile-depth-in-dialogue"
  | "profile-growth-with-space"
  | "profile-shared-momentum"
  | "profile-impact-echo"
  | "profile-grounded-impact";

export interface SelfProfileDefinition {
  id: SelfProfileId;
  name: string;
  tagline: string;
  dimensions: readonly [SelfReflectionDimensionId, SelfReflectionDimensionId];
  description: string;
  contextualDescription: string;
  signatureSignals: readonly string[];
  tensionId?: string;
  coVisibleOnly?: boolean;
}

export const selfProfileDefinitions: readonly SelfProfileDefinition[] = [
  {
    id: "profile-own-course",
    name: "Eigener Kurs",
    tagline: "Richtung erkennen, den Weg mitgestalten.",
    dimensions: ["orientation", "agency"],
    tensionId: "orientation-agency",
    description:
      "In deiner Momentaufnahme scheint eine erkennbare Richtung besonders dann hilfreich zu werden, wenn der konkrete Weg nicht vollständig vorgegeben ist. Ziele, Prioritäten oder klare Grenzen können Orientierung geben, ohne jede Entscheidung vorwegzunehmen. Gleichzeitig taucht der Wunsch auf, Vorgehen, Reihenfolge oder Lösung selbst mitzugestalten. Diese Profil-Linse beschreibt deshalb kein Entweder-oder zwischen Klarheit und Freiheit. Eher wirkt es, als könne Klarheit einen verlässlichen Rahmen schaffen, innerhalb dessen eigene Entscheidungen möglich bleiben. Wenn du dich darin wiedererkennst, könnte gerade diese Verbindung erklären, warum weder völlige Offenheit noch ein eng festgelegter Ablauf allein stimmig wirken. Der Name „Eigener Kurs“ verdichtet damit ein Muster, in dem Richtung Halt geben darf, während Verantwortung für den Weg bei dir mit Raum, Urteil und Beweglichkeit verbunden bleibt.",
    contextualDescription:
      "Je nach Situation erinnert dein Muster an „Eigener Kurs“. Eine erkennbare Richtung und eigener Gestaltungsspielraum tauchen beide deutlich auf, ihre passende Gewichtung scheint jedoch von Aufgabe und Umfeld abzuhängen. In manchen Momenten können Ziele, Prioritäten oder klare Grenzen den nötigen Halt geben. In anderen kann entscheidend sein, Vorgehen, Reihenfolge oder Lösung selbst festzulegen. Diese Profil-Linse beschreibt deshalb keinen festen Arbeits- oder Lebensstil. Sie macht sichtbar, dass Klarheit und Freiheit in deiner Momentaufnahme miteinander verbunden sind, ohne immer gleich verteilt zu sein. Wenn du dich darin wiedererkennst, kann die entscheidende Frage weniger lauten, welche Seite grundsätzlich wichtiger ist. Interessanter ist, wann ein klarer Rahmen trägt und wann zusätzlicher Spielraum nötig wird, damit sich der Weg weiterhin wie ein eigener anfühlt.",
    signatureSignals: [
      "Eine erkennbare Richtung kann Halt geben.",
      "Der konkrete Weg darf trotzdem offen bleiben.",
      "Klarheit und Mitgestaltung müssen kein Gegensatz sein.",
    ],
  },
  {
    id: "profile-moving-anchor",
    name: "Beweglicher Anker",
    tagline: "Eine feste Basis, die Bewegung erlaubt.",
    dimensions: ["reliability", "variety"],
    tensionId: "reliability-variety",
    description:
      "In deiner Momentaufnahme wirken Verlässlichkeit und neue Impulse nicht wie Gegensätze. Wiedererkennbare Abläufe, planbare Eckpunkte oder eine tragfähige Grundlage können Ruhe schaffen. Gerade auf dieser Basis scheint zugleich Platz für wechselnde Themen, andere Perspektiven oder bewusst neue Erfahrungen wichtig zu werden. Die Profil-Linse „Beweglicher Anker“ beschreibt daher keine Vorliebe für starre Ordnung und auch keine Suche nach ständigem Wandel. Sie verdichtet ein Muster, in dem Stabilität Bewegung ermöglichen kann, statt sie zu verhindern. Wenn du dich darin wiedererkennst, liegt das Stimmige möglicherweise in der Dosierung: genug Verlässlichkeit, damit nicht alles gleichzeitig unsicher wird, und genug Abwechslung, damit der Rahmen lebendig bleibt. Der Anker steht dabei nicht für Stillstand. Er markiert einige feste Punkte, von denen aus Erkundung, Wechsel und Anpassung leichter möglich werden können.",
    contextualDescription:
      "Je nach Situation erinnert dein Ergebnis an einen „Beweglichen Anker“. Verlässlichkeit und Abwechslung zeigen sich beide, doch welche Seite gerade stärker trägt, scheint von Aufgabe, Tempo und Umfeld abzuhängen. Manchmal können planbare Eckpunkte oder ein vertrauter Rhythmus den nötigen Halt geben. In anderen Situationen können neue Impulse, wechselnde Perspektiven oder ein bewusster Themenwechsel wichtiger werden. Diese Profil-Linse macht daraus keinen unveränderlichen Stil. Sie beschreibt eine situationsabhängige Verbindung, in der Stabilität und Bewegung einander unterstützen können, ohne immer gleichzeitig gleich viel Raum zu erhalten. Wenn du dich darin wiedererkennst, könnte es hilfreicher sein, nach dem passenden Verhältnis zu fragen als nach einer festen Präferenz. Ein kleiner verlässlicher Kern kann genügen, damit Veränderung interessant bleibt, ohne dass der gesamte Rahmen jedes Mal neu entstehen muss.",
    signatureSignals: [
      "Einige feste Punkte können Sicherheit geben.",
      "Neue Impulse dürfen den Rahmen lebendig halten.",
      "Stabilität kann Bewegung ermöglichen, statt sie zu stoppen.",
    ],
  },
  {
    id: "profile-quiet-depth",
    name: "Ruhige Tiefe",
    tagline: "Vertiefung, die Raum zum Auftanken lässt.",
    dimensions: ["depth", "recovery"],
    description:
      "In deiner Momentaufnahme scheinen Vertiefung und Erholung eng zusammenzugehören. Längere, ununterbrochene Aufmerksamkeit kann es ermöglichen, ein Thema wirklich zu durchdringen, statt nur an seiner Oberfläche zu bleiben. Gleichzeitig wirkt echte Zeit ohne neue Anforderungen bedeutsam, damit Konzentration nicht einfach in dauernde Anspannung übergeht. Die Profil-Linse „Ruhige Tiefe“ beschreibt deshalb weder Rückzug als Selbstzweck noch Fokus als endlose Leistungsphase. Sie verdichtet einen Rhythmus: eintauchen können, bei einer Sache bleiben und anschließend wieder Abstand gewinnen. Wenn du dich darin wiedererkennst, könnte die Qualität einer Aufgabe nicht nur davon abhängen, wie interessant sie ist. Ebenso wichtig kann sein, ob sie geschützte Aufmerksamkeit und einen klaren Übergang in Erholung zulässt. Tiefe wird in diesem Muster nicht durch pausenlose Intensität getragen, sondern durch ausreichend Ruhe auf beiden Seiten des Fokus.",
    contextualDescription:
      "Je nach Situation erinnert dein Muster an „Ruhige Tiefe“. Vertiefung und Erholung sind beide sichtbar, scheinen aber nicht in jeder Aufgabe dieselbe Rolle zu spielen. Manche Themen können längere, ununterbrochene Aufmerksamkeit einladen. In anderen Momenten kann Abstand wichtiger werden, bevor erneuter Fokus überhaupt hilfreich ist. Diese Profil-Linse beschreibt daher keinen festen Rückzugsstil und keine dauerhafte Vorliebe für Alleinarbeit. Sie macht eine situationsabhängige Beziehung sichtbar: Aufmerksamkeit kann besonders tragfähig werden, wenn echte Unterbrechung und Regeneration ebenfalls möglich bleiben. Wenn du dich darin wiedererkennst, könnte es sich lohnen, nicht nur auf die Länge eines Fokusblocks zu achten. Ebenso aufschlussreich ist, welche Art von Übergang danach entsteht und ob die nächste Anforderung sofort folgt oder zunächst wieder innerer und äußerer Raum verfügbar wird.",
    signatureSignals: [
      "Ungestörte Zeit kann echte Vertiefung ermöglichen.",
      "Erholung darf ein geplanter Teil des Rhythmus sein.",
      "Tiefe muss nicht aus pausenloser Intensität entstehen.",
    ],
  },
  {
    id: "profile-depth-in-dialogue",
    name: "Tiefe im Austausch",
    tagline: "Erst durchdringen, dann bewusst verbinden.",
    dimensions: ["depth", "connection"],
    tensionId: "depth-connection",
    description:
      "In deiner Momentaufnahme scheinen eigene Vertiefung und bewusster Austausch einander zu ergänzen. Zeit, einen Gedanken zunächst in Ruhe zu verfolgen, kann Klarheit schaffen und offene Fragen sichtbar machen. Verbindung bekommt anschließend eine besondere Qualität, wenn sie nicht jede Denkphase unterbricht, sondern an einem passenden Punkt neue Perspektiven eröffnet. Die Profil-Linse „Tiefe im Austausch“ beschreibt damit weder einen Rückzugstyp noch eine ständige Suche nach Gespräch. Sie verdichtet eine mögliche Reihenfolge und Beziehung: erst genügend Raum, um etwas selbst zu durchdringen, dann gezielt mit anderen weiterdenken. Wenn du dich darin wiedererkennst, könnte nicht die Menge an Kontakt entscheidend sein, sondern sein Zeitpunkt und seine Tiefe. Austausch wirkt in diesem Muster besonders wertvoll, wenn bereits ein eigener Gedanke vorhanden ist und das Gespräch ihn prüfen, erweitern oder in eine neue Richtung bewegen kann.",
    contextualDescription:
      "Je nach Situation erinnert dein Ergebnis an „Tiefe im Austausch“. Eigene Denkzeit und Verbindung mit anderen zeigen sich beide, doch ihr passender Zeitpunkt scheint von Thema und Aufgabe abzuhängen. Manchmal kann es hilfreich sein, einen Gedanken zunächst ungestört zu verfolgen. In anderen Momenten kann früher Austausch verhindern, dass eine offene Frage unnötig lange allein bleibt. Diese Profil-Linse ordnet dich deshalb weder Rückzug noch Geselligkeit fest zu. Sie beschreibt eine situationsabhängige Bewegung zwischen Durchdringen und Verbinden. Wenn du dich darin wiedererkennst, könnte die relevante Frage lauten, wann ein Gespräch wirklich weiterführt und wann es zunächst mehr eigenen Raum braucht. Verbindung gewinnt dabei nicht automatisch durch Häufigkeit. Sie kann besonders wertvoll werden, wenn sie zum richtigen Zeitpunkt eine bereits gewachsene Perspektive prüft, ergänzt oder bewusst öffnet.",
    signatureSignals: [
      "Eigene Denkzeit kann einem Thema Tiefe geben.",
      "Gezielter Austausch kann neue Perspektiven öffnen.",
      "Der richtige Zeitpunkt verbindet Fokus und Nähe.",
    ],
  },
  {
    id: "profile-growth-with-space",
    name: "Wachstum mit Atemraum",
    tagline: "Neues wagen, ohne Erholung zu verdrängen.",
    dimensions: ["growth", "recovery"],
    tensionId: "growth-recovery",
    description:
      "In deiner Momentaufnahme scheint Entwicklung besonders dann tragfähig zu werden, wenn Erholung nicht erst nachträglich übrig bleiben muss. Neue Herausforderungen, Lernschritte oder ungewohnte Erfahrungen können Bewegung erzeugen und Interesse wachhalten. Gleichzeitig taucht der Wunsch nach Zeiten auf, in denen kein weiterer Input verarbeitet oder kein nächster Schritt geleistet werden muss. Die Profil-Linse „Wachstum mit Atemraum“ beschreibt deshalb keinen Gegensatz zwischen Neugier und Pause. Sie verdichtet einen Rhythmus, in dem Entwicklung Raum bekommt, ohne Regeneration dauerhaft zu verdrängen. Wenn du dich darin wiedererkennst, könnte eine Herausforderung nicht allein durch ihre Größe oder Neuheit passend werden. Ebenso bedeutsam kann sein, ob sie begrenzbar bleibt und ob danach wieder freie Aufmerksamkeit entsteht. Wachstum wirkt in diesem Muster weniger wie pausenlose Steigerung und mehr wie eine Folge aus Erkunden, Verarbeiten und erneutem Öffnen.",
    contextualDescription:
      "Je nach Situation erinnert dein Muster an „Wachstum mit Atemraum“. Entwicklung und Erholung zeigen sich beide deutlich, ihre passende Gewichtung scheint jedoch mit Phase und Anforderung zu wechseln. Manchmal kann eine neue Herausforderung genau die Bewegung bringen, die gerade fehlt. In anderen Momenten kann freie Zeit ohne zusätzlichen Lern- oder Veränderungsdruck wichtiger werden. Diese Profil-Linse macht daraus keine feste Belastbarkeitsaussage. Sie beschreibt eine situationsabhängige Verbindung, in der Neugier und Regeneration beide einen legitimen Platz haben. Wenn du dich darin wiedererkennst, könnte es hilfreich sein, Entwicklung nicht nur über den nächsten Schritt zu betrachten. Ebenso aufschlussreich ist, ob genug Raum zum Verarbeiten vorhanden ist und ob eine Pause tatsächlich frei bleibt. Atemraum bedeutet in diesem Muster nicht Stillstand, sondern kann Teil eines tragfähigen Lernrhythmus sein.",
    signatureSignals: [
      "Neue Herausforderungen können Bewegung erzeugen.",
      "Erholung darf Entwicklung von Anfang an begleiten.",
      "Wachstum kann aus Erkunden und Verarbeiten entstehen.",
    ],
  },
  {
    id: "profile-shared-momentum",
    name: "Gemeinsamer Aufbruch",
    tagline: "Entwicklung gewinnt im Austausch an Bewegung.",
    dimensions: ["connection", "growth"],
    coVisibleOnly: true,
    description:
      "Eine mögliche Linse auf dein Ergebnis ist „Gemeinsamer Aufbruch“. Austausch und Entwicklung zeigen sich beide klar in mehreren Bereichen deiner Momentaufnahme. Die Kombination wurde jedoch nicht direkt als gemeinsames Muster gewählt. Deshalb beschreibt dieser Name eine vorsichtige redaktionelle Lesart und keine ebenso stark belegte Verbindung wie bei einem ausdrücklich gewählten Pair. Sichtbar ist, dass Verbindung mit anderen wiederkehrt und dass Lernen, Entwicklung oder neue Herausforderungen ebenfalls Raum einnehmen. Zusammengedacht kann daraus ein Muster entstehen, in dem Bewegung durch gemeinsame Fragen, geteilte Erfahrungen oder das Ausprobieren mit anderen an Qualität gewinnt. Wenn du dich darin wiedererkennst, könnte Entwicklung besonders lebendig wirken, sobald sie nicht nur im eigenen Kopf stattfindet. Wichtig bleibt: Beide Signale sind belastbar sichtbar; ihre Verbindung ist eine mögliche Interpretation, keine zusätzliche Feststellung über deine Persönlichkeit.",
    contextualDescription:
      "Je nach Situation bietet „Gemeinsamer Aufbruch“ eine mögliche Linse auf dein Ergebnis. Austausch und Entwicklung zeigen sich beide klar, ihre Verbindung wurde jedoch nicht direkt als gemeinsames Antwortmuster gewählt. Zudem hängt mindestens eines der Signale laut deiner Auswahl von Aufgabe oder Umfeld ab. Der Name bleibt deshalb eine besonders vorsichtige Lesart. In manchen Situationen kann gemeinsames Fragen, Lernen oder Ausprobieren Bewegung schaffen. In anderen kann Entwicklung stärker für sich stattfinden oder Verbindung einem anderen Zweck dienen. Wenn du dich darin wiedererkennst, kann die Linse helfen, diese Momente bewusster zu beobachten, ohne daraus einen festen Stil abzuleiten. Belastbar sichtbar sind die beiden einzelnen Signale. Ob und wann sie sich tatsächlich zu einem gemeinsamen Aufbruch verbinden, bleibt eine offene, situationsbezogene Hypothese deiner aktuellen Momentaufnahme.",
    signatureSignals: [
      "Austausch zeigt sich als wiederkehrendes Signal.",
      "Entwicklung und neue Herausforderungen sind klar sichtbar.",
      "Ihre Verbindung bleibt eine mögliche, transparente Lesart.",
    ],
  },
  {
    id: "profile-impact-echo",
    name: "Wirkung mit Echo",
    tagline: "Beitrag wird greifbar, wenn Resonanz zurückkommt.",
    dimensions: ["purpose", "feedback"],
    description:
      "In deiner Momentaufnahme scheinen Sinn und Resonanz miteinander verbunden zu sein. Ein Beitrag kann besonders greifbar werden, wenn seine beabsichtigte Wirkung erkennbar ist und Rückmeldung zeigt, was tatsächlich angekommen ist. Dabei geht es nicht um ständige Bestätigung oder um eine moralische Bewertung von Aufgaben. Die Profil-Linse „Wirkung mit Echo“ verdichtet vielmehr ein Muster, in dem Bedeutung und hilfreiche Rückmeldung gemeinsam Orientierung geben können. Wenn du dich darin wiedererkennst, reicht möglicherweise weder eine abstrakte gute Absicht noch Feedback ohne Bezug zum eigentlichen Zweck. Stimmiger kann die Verbindung sein: wissen, wofür etwas geschieht, und an passenden Punkten erfahren, wie es gewirkt hat. Das Echo steht dabei nicht für Applaus. Es meint konkrete Resonanz, die einen Beitrag einordnen, schärfen oder für den nächsten Schritt verständlicher machen kann.",
    contextualDescription:
      "Je nach Situation erinnert dein Ergebnis an „Wirkung mit Echo“. Sinn und Rückmeldung zeigen sich beide, doch wie eng sie zusammengehören, scheint von Aufgabe und Umfeld abzuhängen. Manchmal kann ein klarer Zweck genügen, um einen Beitrag einzuordnen. In anderen Momenten kann erst konkrete Resonanz verständlich machen, was tatsächlich angekommen ist. Diese Profil-Linse beschreibt daher weder ein dauerhaftes Bedürfnis nach Bestätigung noch eine moralische Einordnung deiner Entscheidungen. Sie macht eine situationsabhängige Verbindung sichtbar: Bedeutung kann durch Rückmeldung greifbarer werden, während Feedback durch einen klaren Zweck an Relevanz gewinnt. Wenn du dich darin wiedererkennst, könnte die interessante Frage sein, wann ein Echo wirklich hilfreich ist und worauf es sich beziehen sollte. Nicht jede Rückmeldung trägt gleich viel, und nicht jeder sinnvolle Beitrag wird sofort sichtbar.",
    signatureSignals: [
      "Ein erkennbarer Zweck kann einem Beitrag Richtung geben.",
      "Konkrete Resonanz kann Wirkung verständlicher machen.",
      "Bedeutung und Feedback können einander schärfen.",
    ],
  },
  {
    id: "profile-grounded-impact",
    name: "Wirkung mit Bodenhaftung",
    tagline: "Bedeutung, die auf einer tragfähigen Basis steht.",
    dimensions: ["purpose", "reliability"],
    tensionId: "purpose-reliability",
    description:
      "In deiner Momentaufnahme scheint ein sinnvoller Beitrag besonders dann zu tragen, wenn auch seine Grundlage verlässlich wirkt. Bedeutung bleibt dabei nicht nur eine große Idee. Sie verbindet sich mit realistischen Bedingungen, nachvollziehbaren Abläufen oder einem Rahmen, der länger als einen kurzen Impuls Bestand haben kann. Die Profil-Linse „Wirkung mit Bodenhaftung“ beschreibt weder besondere Tugend noch eine Bewertung dessen, was für andere wichtig sein sollte. Sie verdichtet ein Muster, in dem persönlicher Sinn und praktische Tragfähigkeit gemeinsam auftreten. Wenn du dich darin wiedererkennst, könnte ein Vorhaben nicht allein deshalb stimmig werden, weil sein Ziel überzeugt. Ebenso entscheidend kann sein, ob Zeit, Struktur und Verantwortung dazu passen. Bodenhaftung bremst Wirkung in diesem Bild nicht. Sie kann ermöglichen, dass ein bedeutsamer Beitrag verlässlich verfolgt wird und nicht an einem dauerhaft unsicheren Fundament hängen bleibt.",
    contextualDescription:
      "Je nach Situation erinnert dein Muster an „Wirkung mit Bodenhaftung“. Bedeutung und Verlässlichkeit zeigen sich beide, doch ihre Verbindung scheint nicht in jedem Vorhaben gleich wichtig zu sein. Manchmal kann der erkennbare Zweck im Vordergrund stehen. In anderen Situationen können realistische Bedingungen, planbare Eckpunkte oder eine tragfähige Grundlage zuerst geklärt werden müssen. Diese Profil-Linse macht daraus weder eine moralische Eigenschaft noch eine feste Vorliebe für Sicherheit. Sie beschreibt eine situationsabhängige Beziehung zwischen dem Wofür und dem praktischen Rahmen. Wenn du dich darin wiedererkennst, könnte es aufschlussreich sein, wann eine Idee allein genug Bewegung erzeugt und wann ihre Umsetzung erst durch verlässliche Bedingungen glaubwürdig wird. Bodenhaftung meint dabei nicht geringe Ambition, sondern die Möglichkeit, Bedeutung unter konkreten Bedingungen tatsächlich weiterzutragen.",
    signatureSignals: [
      "Ein erkennbarer Zweck kann Bedeutung schaffen.",
      "Tragfähige Bedingungen können Umsetzung ermöglichen.",
      "Wirkung und Verlässlichkeit dürfen gemeinsam zählen.",
    ],
  },
] as const;

export const selfProfileSecondaryCopy: Readonly<
  Record<SelfReflectionDimensionId, string>
> = {
  agency: "Eigener Gestaltungsspielraum taucht zusätzlich als wiederkehrender Akzent auf.",
  orientation: "Eine erkennbare Richtung zeigt sich zusätzlich als hilfreicher Orientierungspunkt.",
  reliability: "Verlässliche Eckpunkte färben die Momentaufnahme zusätzlich.",
  depth: "Längere, ununterbrochene Vertiefung ist zusätzlich sichtbar.",
  variety: "Neue Impulse und bewusster Wechsel setzen einen zusätzlichen Akzent.",
  connection: "Bewusster Austausch mit anderen taucht zusätzlich an mehreren Stellen auf.",
  recovery: "Raum für Rückzug und Erholung ist zusätzlich sichtbar.",
  growth: "Lernen und Entwicklung bilden einen zusätzlichen Akzent.",
  purpose: "Ein erkennbarer Sinn oder Beitrag färbt die Momentaufnahme zusätzlich.",
  feedback: "Hilfreiche Resonanz taucht zusätzlich als Orientierungspunkt auf.",
  making: "Konkretes Gestalten taucht zusätzlich als wiederkehrender Akzent auf.",
  care: "Praktische Unterstützung für andere ist zusätzlich sichtbar.",
  expression: "Eigener Ausdruck setzt einen zusätzlichen Akzent.",
  harmony: "Konstruktive Balance zwischen Bedürfnissen ist zusätzlich sichtbar.",
  effectiveness: "Sichtbarer Fortschritt und Wirksamkeit setzen einen zusätzlichen Akzent.",
};

const profileNamesEn: Readonly<Record<SelfProfileId, { name: string; tagline: string }>> = {
  "profile-own-course": { name: "Your own course", tagline: "See the direction, help shape the path." },
  "profile-moving-anchor": { name: "A moving anchor", tagline: "A firm base that allows movement." },
  "profile-quiet-depth": { name: "Quiet depth", tagline: "Depth with room to recharge." },
  "profile-depth-in-dialogue": { name: "Depth in dialogue", tagline: "Explore first, then connect deliberately." },
  "profile-growth-with-space": { name: "Growth with breathing room", tagline: "Try something new without displacing recovery." },
  "profile-shared-momentum": { name: "Shared momentum", tagline: "Growth gathers movement through exchange." },
  "profile-impact-echo": { name: "Impact with an echo", tagline: "Contribution becomes tangible when a response returns." },
  "profile-grounded-impact": { name: "Grounded impact", tagline: "Meaning supported by a sustainable foundation." },
};

const profileNamesExtended: Record<Exclude<Locale, "de" | "en">, readonly { name: string; tagline: string }[]> = {
  es: [
    { name: "Rumbo propio", tagline: "Reconocer la dirección y participar en el camino." }, { name: "Ancla móvil", tagline: "Una base estable que permite moverse." }, { name: "Profundidad tranquila", tagline: "Concentración que da espacio a lo esencial." }, { name: "Profundidad en diálogo", tagline: "Pensar a fondo y avanzar mediante el intercambio." }, { name: "Crecimiento con espacio", tagline: "Probar algo nuevo sin desplazar la recuperación." }, { name: "Impulso compartido", tagline: "El desarrollo cobra movimiento en el intercambio." }, { name: "Impacto con eco", tagline: "La contribución se vuelve tangible cuando hay respuesta." }, { name: "Impacto con base", tagline: "Sentido apoyado en una base sostenible." },
  ],
  tr: [
    { name: "Kendi rotan", tagline: "Yönü gör, yolu biçimlendirmeye katıl." }, { name: "Hareketli çapa", tagline: "Harekete izin veren sağlam bir temel." }, { name: "Sessiz derinlik", tagline: "Önemli olana alan açan odak." }, { name: "Diyalogda derinlik", tagline: "Derin düşün, etkileşimle ilerle." }, { name: "Alan bırakan gelişim", tagline: "Dinlenmeyi dışlamadan yeniyi dene." }, { name: "Paylaşılan ivme", tagline: "Gelişim etkileşimle hareket kazanır." }, { name: "Yankı bulan etki", tagline: "Karşılık geldiğinde katkı somutlaşır." }, { name: "Sağlam zeminde etki", tagline: "Sürdürülebilir bir temelin taşıdığı anlam." },
  ],
  pl: [
    { name: "Własny kurs", tagline: "Rozpoznawać kierunek i współtworzyć drogę." }, { name: "Ruchoma kotwica", tagline: "Stała podstawa, która pozwala się poruszać." }, { name: "Cicha głębia", tagline: "Skupienie, które robi miejsce na to, co ważne." }, { name: "Głębia w dialogu", tagline: "Myśleć głęboko i iść naprzód dzięki wymianie." }, { name: "Rozwój z przestrzenią", tagline: "Próbować nowego bez wypierania regeneracji." }, { name: "Wspólny impet", tagline: "Rozwój nabiera ruchu dzięki wymianie." }, { name: "Wpływ z echem", tagline: "Wkład staje się namacalny, gdy wraca odpowiedź." }, { name: "Wpływ z oparciem", tagline: "Znaczenie wsparte trwałą podstawą." },
  ],
  el: [
    { name: "Δική σου πορεία", tagline: "Αναγνώρισε την κατεύθυνση και συνδιαμόρφωσε τη διαδρομή." }, { name: "Κινητή άγκυρα", tagline: "Μια σταθερή βάση που επιτρέπει κίνηση." }, { name: "Ήσυχο βάθος", tagline: "Συγκέντρωση που αφήνει χώρο στο ουσιώδες." }, { name: "Βάθος στον διάλογο", tagline: "Σκέψη σε βάθος και πρόοδος μέσα από την ανταλλαγή." }, { name: "Ανάπτυξη με χώρο", tagline: "Δοκίμασε κάτι νέο χωρίς να παραμερίζεις την ανάκαμψη." }, { name: "Κοινή ορμή", tagline: "Η ανάπτυξη αποκτά κίνηση μέσα από την ανταλλαγή." }, { name: "Επίδραση με απόηχο", tagline: "Η συνεισφορά γίνεται απτή όταν επιστρέφει ανταπόκριση." }, { name: "Γειωμένη επίδραση", tagline: "Νόημα που στηρίζεται σε βιώσιμη βάση." },
  ],
  ru: [
    { name: "Свой курс", tagline: "Видеть направление и участвовать в выборе пути." }, { name: "Подвижный якорь", tagline: "Надёжная основа, которая позволяет двигаться." }, { name: "Тихая глубина", tagline: "Сосредоточенность, освобождающая место для важного." }, { name: "Глубина в диалоге", tagline: "Думать глубоко и продвигаться через обмен." }, { name: "Развитие с пространством", tagline: "Пробовать новое, не вытесняя восстановление." }, { name: "Общий импульс", tagline: "Развитие набирает движение через взаимодействие." }, { name: "Влияние с откликом", tagline: "Вклад становится ощутимым, когда возвращается отклик." }, { name: "Устойчивое влияние", tagline: "Смысл, опирающийся на надёжную основу." },
  ],
};

function extendedProfileDescription(definition: SelfProfileDefinition, locale: Exclude<Locale, "de" | "en">, contextual: boolean): string {
  const dimensions = getSelfReflectionDimensions(locale);
  const first = dimensions[definition.dimensions[0]].label;
  const second = dimensions[definition.dimensions[1]].label;
  const index = selfProfileDefinitions.findIndex(({ id }) => id === definition.id);
  const name = profileNamesExtended[locale][index].name;
  const copy = {
    es: contextual
      ? `Según la situación, tu instantánea se parece a «${name}». ${first} y ${second} aparecen en tus respuestas, pero el equilibrio útil entre ambas puede depender de la tarea, la fase o el entorno. A veces una de estas condiciones ofrece el apoyo más importante y, en otro momento, la otra necesita más espacio. Esta lente no describe una forma fija de trabajar o vivir. Hace visible una conexión dependiente del contexto y deja la interpretación en tus manos. Si te reconoces en ella, la pregunta útil no es qué lado importa siempre más, sino cuándo ayuda cada condición y cómo se ve un equilibrio practicable en una situación concreta.`
      : `En tu instantánea actual, ${first} y ${second} parecen estar conectadas de forma significativa. La lente «${name}» no convierte esta combinación en un tipo, una aptitud o una identidad permanente. Ofrece una forma breve de observar cómo ambas condiciones pueden apoyarse en el trabajo y la vida cotidiana. Si te reconoces en ella, lo útil no es solo el nombre, sino la pregunta práctica que abre: ¿qué tarea, ritmo o entorno da suficiente espacio a las dos señales? Tus respuestas siguen siendo una instantánea y tú decides dónde encaja esta interpretación, dónde no y qué puede cambiar con el tiempo.`,
    tr: contextual
      ? `Duruma bağlı olarak anlık görüntün «${name}» örüntüsünü andırıyor. ${first} ve ${second} yanıtlarında görünür; ancak aralarındaki yararlı denge göreve, döneme veya çevreye bağlı olabilir. Bir anda bir koşul daha önemli destek sunarken başka bir anda diğerine daha çok alan gerekebilir. Bu mercek sabit bir çalışma ya da yaşam biçimini anlatmaz. Bağlama bağlı bir ilişkiyi görünür kılar ve yorumu sana bırakır. Kendini burada görüyorsan yararlı soru, hangi tarafın her zaman daha önemli olduğu değil; her koşulun ne zaman yardımcı olduğu ve somut bir durumda uygulanabilir dengenin nasıl göründüğüdür.`
      : `Mevcut anlık görüntünde ${first} ve ${second} anlamlı biçimde bağlantılı görünüyor. «${name}» merceği bu birleşimi bir tipe, uygunluğa veya kalıcı kimliğe dönüştürmez. İki koşulun işte ve günlük yaşamda birbirini nasıl destekleyebileceğini fark etmek için kısa bir bakış sunar. Kendini burada görüyorsan yararlı olan yalnızca ad değil, açtığı pratik sorudur: hangi görev, ritim veya çevre iki sinyale de yeterli alan veriyor? Yanıtların bir anlık görüntü olarak kalır; bu yorumun nerede uyduğuna, nerede uymadığına ve daha sonra neyin değişebileceğine sen karar verirsin.`,
    pl: contextual
      ? `W zależności od sytuacji Twój obraz przypomina „${name}”. ${first} i ${second} są widoczne w odpowiedziach, ale użyteczna równowaga między nimi może zależeć od zadania, etapu lub otoczenia. Czasem jedna z tych potrzeb daje ważniejsze oparcie, a innym razem więcej miejsca potrzebuje druga. Ta soczewka nie opisuje stałego sposobu pracy ani życia. Pokazuje zależne od kontekstu połączenie i pozostawia interpretację w Twoich rękach. Jeśli się w niej rozpoznajesz, użyteczne pytanie nie brzmi, która strona jest zawsze ważniejsza, lecz kiedy każda z potrzeb pomaga i jak wygląda możliwa równowaga w konkretnej sytuacji.`
      : `W obecnym obrazie ${first} i ${second} wydają się znacząco połączone. Soczewka „${name}” nie zmienia tej kombinacji w typ, predyspozycję ani trwałą tożsamość. Daje zwięzły sposób zauważenia, jak obie potrzeby mogą wspierać się w pracy i codzienności. Jeśli się w niej rozpoznajesz, wartość kryje się nie tylko w nazwie, lecz w praktycznym pytaniu: jakie zadanie, rytm lub otoczenie daje wystarczająco dużo miejsca obu sygnałom? Odpowiedzi pozostają chwilowym obrazem, a Ty decydujesz, gdzie ta interpretacja pasuje, gdzie nie i co może później się zmienić.`,
    el: contextual
      ? `Ανάλογα με την κατάσταση, το στιγμιότυπό σου μοιάζει με το «${name}». ${first} και ${second} εμφανίζονται στις απαντήσεις, όμως η χρήσιμη ισορροπία τους μπορεί να εξαρτάται από το έργο, τη φάση ή το περιβάλλον. Κάποιες φορές η μία συνθήκη προσφέρει τη σημαντικότερη στήριξη και άλλοτε η άλλη χρειάζεται περισσότερο χώρο. Αυτός ο φακός δεν περιγράφει σταθερό τρόπο εργασίας ή ζωής. Κάνει ορατή μια σύνδεση που εξαρτάται από το πλαίσιο και αφήνει την ερμηνεία σε εσένα. Αν αναγνωρίζεσαι, το χρήσιμο ερώτημα δεν είναι ποια πλευρά είναι πάντα σημαντικότερη, αλλά πότε βοηθά κάθε συνθήκη και πώς μοιάζει μια εφαρμόσιμη ισορροπία σε συγκεκριμένη κατάσταση.`
      : `Στο σημερινό σου στιγμιότυπο, ${first} και ${second} φαίνεται να συνδέονται ουσιαστικά. Ο φακός «${name}» δεν μετατρέπει αυτόν τον συνδυασμό σε τύπο, καταλληλότητα ή μόνιμη ταυτότητα. Προσφέρει έναν σύντομο τρόπο να παρατηρήσεις πώς οι δύο συνθήκες μπορούν να αλληλοστηρίζονται στην εργασία και την καθημερινότητα. Αν αναγνωρίζεσαι, χρήσιμο δεν είναι μόνο το όνομα αλλά το πρακτικό ερώτημα που ανοίγει: ποιο έργο, ρυθμός ή περιβάλλον δίνει αρκετό χώρο και στα δύο σήματα; Οι απαντήσεις παραμένουν στιγμιότυπο και εσύ αποφασίζεις πού ταιριάζει η ερμηνεία, πού όχι και τι μπορεί να αλλάξει αργότερα.`,
    ru: contextual
      ? `В зависимости от ситуации твой снимок напоминает «${name}». ${first} и ${second} видны в ответах, но полезный баланс между ними может зависеть от задачи, этапа или окружения. Иногда одна из потребностей даёт более важную поддержку, а в другой момент больше пространства требуется второй. Эта линза не описывает постоянный способ работать или жить. Она показывает связь, зависящую от контекста, и оставляет интерпретацию за тобой. Если ты узнаёшь себя, полезно спрашивать не о том, какая сторона всегда важнее, а о том, когда помогает каждая потребность и как выглядит осуществимый баланс в конкретной ситуации.`
      : `В нынешнем снимке ${first} и ${second} выглядят осмысленно связанными. Линза «${name}» не превращает это сочетание в тип, оценку способностей или постоянную идентичность. Она помогает коротко заметить, как обе потребности могут поддерживать друг друга в работе и повседневной жизни. Если ты узнаёшь себя, полезно не только название, но и практический вопрос: какая задача, ритм или среда дают достаточно места обоим сигналам? Ответы остаются снимком текущего момента, и ты решаешь, где эта интерпретация подходит, где нет и что со временем может измениться.`,
  } as const;
  return copy[locale];
}

function englishProfileDescription(definition: SelfProfileDefinition, contextual: boolean): string {
  const dimensions = getSelfReflectionDimensions("en");
  const first = dimensions[definition.dimensions[0]];
  const second = dimensions[definition.dimensions[1]];
  const name = profileNamesEn[definition.id].name;
  if (contextual) {
    return `Depending on the situation, your snapshot resembles “${name}”. ${first.label} and ${second.label} both appear in your answers, but their useful balance seems to depend on the task, phase or environment. At one moment, ${first.label.toLocaleLowerCase("en-GB")} may provide the more important support; at another, ${second.label.toLocaleLowerCase("en-GB")} may need more room. This profile lens therefore does not describe a fixed way of working or living. It makes a context-dependent connection visible and keeps your own interpretation in charge. If you recognise yourself in it, the useful question is not which side is always more important, but when each condition helps and what a workable balance looks like in a concrete situation.`;
  }
  return `In your current snapshot, ${first.label} and ${second.label} appear to be meaningfully connected. ${first.copy.importance ?? first.label} ${second.copy.importance ?? second.label} The profile lens “${name}” does not turn that combination into a type, aptitude or permanent identity. It offers a concise way to notice how both conditions may support each other in work and everyday life. If you recognise yourself in it, the useful part is not the name alone, but the practical question it opens: what kind of task, rhythm or environment gives both signals enough room? Your answers remain a snapshot, and you retain the authority to decide where this interpretation fits, where it does not, and what may have changed later.`;
}

function buildExtendedProfileDefinitions(locale: Exclude<Locale, "de" | "en">): readonly SelfProfileDefinition[] {
  const dimensions = getSelfReflectionDimensions(locale);
  return selfProfileDefinitions.map((definition, index) => ({
    ...definition,
    ...profileNamesExtended[locale][index],
    description: extendedProfileDescription(definition, locale, false),
    contextualDescription: extendedProfileDescription(definition, locale, true),
    signatureSignals: [
      `${dimensions[definition.dimensions[0]].label} · 1`,
      `${dimensions[definition.dimensions[1]].label} · 2`,
      `${profileNamesExtended[locale][index].tagline}`,
    ],
  }));
}

function buildEnglishProfileDefinitions(): readonly SelfProfileDefinition[] {
  const dimensions = getSelfReflectionDimensions("en");
  return selfProfileDefinitions.map((definition) => ({
    ...definition,
    ...profileNamesEn[definition.id],
    description: englishProfileDescription(definition, false),
    contextualDescription: englishProfileDescription(definition, true),
    signatureSignals: [
      `${dimensions[definition.dimensions[0]].label} is visible as a recurring signal.`,
      `${dimensions[definition.dimensions[1]].label} is visible as a recurring signal.`,
      "Their combination remains an orientation, not a fixed identity.",
    ],
  }));
}

const selfProfileDefinitionFactories: Record<Locale, () => readonly SelfProfileDefinition[]> = {
  de: () => selfProfileDefinitions,
  en: buildEnglishProfileDefinitions,
  es: () => buildExtendedProfileDefinitions("es"),
  tr: () => buildExtendedProfileDefinitions("tr"),
  pl: () => buildExtendedProfileDefinitions("pl"),
  el: () => buildExtendedProfileDefinitions("el"),
  ru: () => buildExtendedProfileDefinitions("ru"),
};

export function getSelfProfileDefinitions(locale: Locale): readonly SelfProfileDefinition[] {
  return selfProfileDefinitionFactories[locale]();
}

const secondarySignalSuffix: Record<Exclude<Locale, "de">, string> = {
  en: "also appears as a recurring secondary signal.",
  es: "también aparece como señal secundaria recurrente.",
  tr: "yinelenen ikincil bir sinyal olarak da görünüyor.",
  pl: "pojawia się też jako powtarzający sygnał dodatkowy.",
  el: "εμφανίζεται επίσης ως επαναλαμβανόμενο δευτερεύον σήμα.",
  ru: "также появляется как повторяющийся дополнительный сигнал.",
};

function buildSecondaryCopy(locale: Exclude<Locale, "de">): Readonly<Record<SelfReflectionDimensionId, string>> {
  const dimensions = getSelfReflectionDimensions(locale);
  const suffix = secondarySignalSuffix[locale];
  return Object.fromEntries((Object.keys(dimensions) as SelfReflectionDimensionId[]).map((dimension) => [dimension, `${dimensions[dimension].label} ${suffix}`])) as Readonly<Record<SelfReflectionDimensionId, string>>;
}

const selfProfileSecondaryFactories: Record<Locale, () => Readonly<Record<SelfReflectionDimensionId, string>>> = {
  de: () => selfProfileSecondaryCopy,
  en: () => buildSecondaryCopy("en"),
  es: () => buildSecondaryCopy("es"),
  tr: () => buildSecondaryCopy("tr"),
  pl: () => buildSecondaryCopy("pl"),
  el: () => buildSecondaryCopy("el"),
  ru: () => buildSecondaryCopy("ru"),
};

export function getSelfProfileSecondaryCopy(locale: Locale) {
  return selfProfileSecondaryFactories[locale]();
}

function countWords(value: string): number {
  return value.trim().split(/\s+/u).filter(Boolean).length;
}

export function validateSelfProfileData(): string[] {
  const errors: string[] = [];
  const knownDimensions = new Set(Object.keys(selfReflectionDimensions));
  const ids = new Set<string>();
  const names = new Set<string>();
  const pairs = new Set<string>();
  const prohibitedCopy = /\b(?:du bist|du brauchst|menschen wie du|persönlichkeitstyp|talentprofil|eignungsprofil|diagnose|geeignet für|talent für|berufsprofil|leader|navigator|strategist|connector|innovator|männlich|weiblich|mann|frau|adhs|autismus|depression|trauma|neurodivergenz|nervensystem|hochbegabt|intelligent|kreativ begabt)\b/iu;

  if (selfProfileDefinitions.length !== 8) errors.push("Self Profile must define exactly eight profiles.");

  for (const definition of selfProfileDefinitions) {
    if (ids.has(definition.id)) errors.push(`Duplicate Self Profile id: ${definition.id}`);
    ids.add(definition.id);

    const normalizedName = definition.name.trim().toLocaleLowerCase("de-DE");
    if (names.has(normalizedName)) errors.push(`Duplicate Self Profile name: ${definition.name}`);
    names.add(normalizedName);

    if (definition.dimensions.length !== 2) errors.push(`Invalid Self Profile dimension count: ${definition.id}`);
    if (new Set(definition.dimensions).size !== 2) errors.push(`Duplicate Self Profile dimension: ${definition.id}`);
    for (const dimension of definition.dimensions) {
      if (!knownDimensions.has(dimension)) errors.push(`Unknown Self Profile dimension: ${definition.id}:${dimension}`);
    }

    const pairKey = [...definition.dimensions].sort().join("+");
    if (pairs.has(pairKey)) errors.push(`Duplicate Self Profile pair: ${pairKey}`);
    pairs.add(pairKey);

    const values = [
      definition.name,
      definition.tagline,
      definition.description,
      definition.contextualDescription,
      ...definition.signatureSignals,
    ];
    if (values.some((value) => !value.trim())) errors.push(`Empty Self Profile copy: ${definition.id}`);
    if (values.some((value) => prohibitedCopy.test(value))) errors.push(`Prohibited Self Profile copy: ${definition.id}`);

    const descriptionWords = countWords(definition.description);
    if (descriptionWords < 100 || descriptionWords > 180) errors.push(`Invalid Self Profile description length: ${definition.id}:${descriptionWords}`);
    const contextualWords = countWords(definition.contextualDescription);
    if (contextualWords < 100 || contextualWords > 180) errors.push(`Invalid contextual Self Profile description length: ${definition.id}:${contextualWords}`);
    if (definition.signatureSignals.length < 2 || definition.signatureSignals.length > 4) {
      errors.push(`Invalid Self Profile signature count: ${definition.id}`);
    }

    if (definition.coVisibleOnly && definition.id !== "profile-shared-momentum") {
      errors.push(`Unexpected co-visible Self Profile: ${definition.id}`);
    }
  }

  if (!selfProfileDefinitions.find(({ id }) => id === "profile-shared-momentum")?.coVisibleOnly) {
    errors.push("Shared Momentum must remain co-visible only.");
  }

  return errors;
}
