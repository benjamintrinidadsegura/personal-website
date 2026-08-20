import type { NextStepJourney } from "@/types/find-your-next-step";
import type { Locale } from "@/lib/i18n/config";

export const findYourNextStep = {
  id: "tool-find-your-next-step",
  href: "/find-your-next-step",
  name: "Find Your Next Step",
  status: "Beta",
  eyebrow: "Human Context First",
  headline: "Dein nächster Schritt beginnt nicht mit einer fertigen Antwort.",
  introduction:
    "Find Your Next Step soll dir helfen, dich selbst, deine Situation und mögliche Richtungen klarer zu sehen – ohne dir vorzugeben, wie du leben oder entscheiden sollst.",
  principleTitle: "Keine richtige Lebensentscheidung. Eine passendere nächste Bewegung.",
  principleText:
    "Das Tool nimmt dir Entscheidungen nicht ab. Es soll Kontext sichtbar machen, Fragen ordnen und dir helfen, einen nächsten Schritt zu erkennen, der zu dir und deiner Situation passt.",
  pathsTitle: "Beginne dort, wo deine Frage gerade lebt.",
  pathsDescription:
    "Vier Ausgangspunkte für unterschiedliche Situationen – verbunden durch denselben Gedanken: Erst verstehen, dann weitergehen.",
  helpSteps: [
    {
      number: "01",
      title: "Verstehen",
      description: "Wahrnehmen, was dich, deine Situation oder deine Idee gerade wirklich prägt.",
    },
    {
      number: "02",
      title: "Einordnen",
      description: "Zusammenhänge sichtbar machen, ohne Menschen in schnelle Schubladen zu stecken.",
    },
    {
      number: "03",
      title: "Weitergehen",
      description: "Aus Klarheit einen nächsten Schritt ableiten, der realistisch und persönlich stimmig ist.",
    },
  ],
  developmentTitle: "Ein Fundament, das bewusst offen bleibt.",
  developmentText:
    "FYNS V1 verbindet vier eigenständige funktionale Betas: Self-Reflection, Career, Problem und Idea. Alle vier arbeiten mit deinen Angaben im aktuellen Seitenzustand und lassen ihre Einordnung bewusst revidierbar.",
  privacyText:
    "Antworten in allen vier Journeys bleiben ausschließlich im aktuellen Seitenzustand und werden weder gespeichert noch übertragen. Ein Neuladen oder Verlassen der Seite löscht sie. Nutzerkonten oder eine Datenbank sind dafür nicht im Einsatz.",
  closingText: "Du musst noch nicht die ganze Richtung kennen. Ein ehrlicher nächster Schritt reicht.",
  discovery: {
    category: "Orientation Tool",
    tags: ["Human Context First", "Orientierung", "Nächster Schritt"],
    keywords: ["Persönliche Richtung", "Situation klären", "Entscheidung vorbereiten"],
  },
} as const;

export const nextStepJourneys: readonly NextStepJourney[] = [
  {
    id: "tool-find-your-next-step-self",
    slug: "self",
    href: "/find-your-next-step/self",
    number: "01",
    title: "Wer bin ich?",
    description:
      "Eine strukturierte Selbstreflexion, die Muster in deinen Werten, Bedürfnissen, deiner Energie und hilfreichen Bedingungen sichtbar macht – ohne dich in einen Typ zu pressen.",
    expectations: [
      "Ruhige Fragen statt schneller Schubladen",
      "15 Entscheidungen über Alltag, Energie und hilfreiche Bedingungen",
      "Ein nachvollziehbares Reflexionsbild ohne Persönlichkeits-Score",
      "Kombinationen von Bedürfnissen statt vermeintlicher Widersprüche",
    ],
    analysisAreas: [
      "Persönliche Prioritäten und Werte",
      "Entscheidungen und Gestaltungsspielraum",
      "Energie, Aufmerksamkeit und Regeneration",
      "Soziale Verbindung und Rückmeldung",
      "Verlässlichkeit und Umgang mit Veränderung",
      "Selbst beobachtete Stärken",
    ],
    status: "Beta",
    accent: "#35d0e5",
    discovery: {
      category: "Find Your Next Step",
      tags: ["Selbstverständnis", "Selbstreflexion", "Persönliche Entwicklung"],
      keywords: ["Stärken", "Werte", "Arbeitsweise", "Bedürfnisse", "Energie", "Entscheidungen", "Regeneration"],
    },
  },
  {
    id: "tool-find-your-next-step-career",
    slug: "career",
    href: "/find-your-next-step/career",
    number: "02",
    title: "Welcher Job passt zu mir?",
    description:
      "Eine interaktive Career Map, die mehrere berufliche Richtungen mit nachvollziehbaren Gründen, realistischen Bedingungen und konkreten Erkundungsschritten sichtbar macht.",
    expectations: [
      "Orientierung vor konkreter Stellensuche",
      "14 Entscheidungen über Tätigkeiten, Wirkung, Arbeitsweise und Lebensrealität",
      "Mehrere berufliche Richtungen statt eines einzigen vermeintlich richtigen Berufs",
      "Nachvollziehbare Evidenz, Bedingungen und ein konkreter Erkundungsschritt",
    ],
    analysisAreas: [
      "Tätigkeiten und gewünschte Wirkung",
      "Motivatoren und Lernbewegung",
      "Menschenkontakt, Fokus und Zusammenarbeit",
      "Struktur, Autonomie und Arbeitsrhythmus",
      "Feste Bedingungen und Präferenzen",
      "Realistischer Qualifizierungsrahmen",
    ],
    status: "Beta",
    accent: "#ff9a3d",
    discovery: {
      title: "FYNS · Berufliche Passung",
      category: "Find Your Next Step",
      tags: ["Berufliche Orientierung", "Berufliche Passung", "Karriererichtung"],
      keywords: ["Berufliche Richtung", "Career Map", "Arbeitsumfeld", "Tätigkeiten", "Arbeitsweise"],
    },
  },
  {
    id: "tool-find-your-next-step-problem",
    slug: "problem",
    href: "/find-your-next-step/problem",
    number: "03",
    title: "Ich habe ein Problem – was kann ich tun?",
    description:
      "Eine strukturierte Journey, die eine schwierige Situation eingrenzt, Handlungsmöglichkeiten sichtbar macht und einen tragfähigen nächsten Schritt vorbereitet.",
    expectations: [
      "Eine ruhige Eingrenzung des Problemfelds",
      "Wenige strukturierte Fragen zu deiner Situation",
      "Mögliche nächste Schritte statt pauschaler Lösungen",
      "Hinweise auf passende Anlaufstellen, wenn sie sinnvoll sind",
    ],
    analysisAreas: [
      "Problemfeld und Kontext",
      "Aktuelle Belastung und Dringlichkeit",
      "Bereits versuchte Schritte",
      "Eigene Handlungsmöglichkeiten",
      "Unterstützung und mögliche Anlaufstellen",
    ],
    status: "Beta",
    accent: "#b8a5ff",
    discovery: {
      category: "Find Your Next Step",
      tags: ["Situationsklärung", "Handlungsmöglichkeiten", "Orientierung"],
      keywords: ["Problem einordnen", "Situation strukturieren", "Nächste Schritte", "Anlaufstellen"],
    },
    professionalBoundary:
      "Diese Orientierung ersetzt keine professionelle medizinische, psychologische, rechtliche oder andere fachliche Beratung. Sie hilft dabei, eine Situation zu ordnen und mögliche nächste Anlaufpunkte bewusster zu erkennen.",
  },
  {
    id: "tool-find-your-next-step-idea",
    slug: "idea",
    href: "/find-your-next-step/idea",
    number: "04",
    title: "Ich habe eine Idee – wie setze ich sie um?",
    description:
      "Eine strukturierte Journey, die aus einer unscharfen Idee ein kleines, überprüfbares Lernexperiment entwickelt – ausgehend von Problem, Zielgruppe, Nutzen und Machbarkeit.",
    expectations: [
      "Die Idee in verständliche Teile zerlegen",
      "Problem, Zielgruppe und Nutzen schärfen",
      "Annahmen und Machbarkeit realistisch einordnen",
      "Einen ersten umsetzbaren nächsten Schritt formulieren",
    ],
    analysisAreas: [
      "Ausgangsidee und Motivation",
      "Problem und Zielgruppe",
      "Nutzen und Unterschiede zu bestehenden Lösungen",
      "Ressourcen und Machbarkeit",
      "Erste Tests und nächste Schritte",
    ],
    status: "Beta",
    accent: "#77e5b5",
    discovery: {
      category: "Find Your Next Step",
      tags: ["Ideenentwicklung", "Konzept", "Zielgruppe", "Machbarkeit"],
      keywords: ["Idee strukturieren", "Umsetzungsplan", "Idee konkretisieren", "Nächste Schritte"],
    },
  },
];

export function getNextStepJourney(slug: string) {
  return nextStepJourneys.find((journey) => journey.slug === slug);
}

const findYourNextStepEnglish = {
  headline: "Your next step does not begin with a ready-made answer.",
  introduction:
    "Find Your Next Step helps you see yourself, your situation and possible directions more clearly — without telling you how to live or what to decide.",
  principleTitle: "Not the right life decision. A more fitting next move.",
  principleText:
    "The tool does not make decisions for you. It makes context visible, brings questions into focus and helps you recognise a next step that fits you and your situation.",
  pathsTitle: "Start where your question lives right now.",
  pathsDescription:
    "Four starting points for different situations, connected by the same principle: understand first, then move forward.",
  helpSteps: [
    { number: "01", title: "Understand", description: "Notice what is genuinely shaping you, your situation or your idea right now." },
    { number: "02", title: "Make sense of it", description: "Make connections visible without forcing people into quick categories." },
    { number: "03", title: "Move forward", description: "Turn clarity into a realistic next step that feels personally coherent." },
  ],
  developmentTitle: "A foundation designed to remain open.",
  developmentText:
    "FYNS V1 brings together four distinct functional betas: Self-Reflection, Career, Problem and Idea. All four work with your answers only in the current page state and keep every interpretation open to revision.",
  privacyText:
    "Answers in all four journeys stay exclusively in the current page state. They are neither stored nor transmitted. Reloading or leaving the page deletes them. No user account or database is involved.",
  closingText: "You do not need to know the whole direction yet. One honest next step is enough.",
  discovery: {
    category: "Orientation Tool",
    tags: ["Human Context First", "Orientation", "Next step"],
    keywords: ["Personal direction", "Clarify a situation", "Prepare a decision"],
  },
} as const;

const journeyEnglishCopy: Readonly<Record<NextStepJourney["slug"], Pick<
  NextStepJourney,
  "title" | "description" | "expectations" | "analysisAreas" | "discovery" | "professionalBoundary"
>>> = {
  self: {
    title: "Who am I?",
    description: "A structured self-reflection that makes patterns in your values, needs, energy and helpful conditions visible — without pressing you into a type.",
    expectations: ["Calm questions instead of quick labels", "15 choices about daily life, energy and helpful conditions", "A traceable reflection without a personality score", "Combinations of needs rather than supposed contradictions"],
    analysisAreas: ["Personal priorities and values", "Decisions and room to shape things", "Energy, attention and recovery", "Social connection and feedback", "Reliability and dealing with change", "Self-observed strengths"],
    discovery: { category: "Find Your Next Step", tags: ["Self-understanding", "Self-reflection", "Personal development"], keywords: ["Strengths", "Values", "Ways of working", "Needs", "Energy", "Decisions", "Recovery"] },
  },
  career: {
    title: "What kind of work could fit me?",
    description: "An interactive Career Map that opens several professional directions with traceable reasons, realistic conditions and concrete exploration steps.",
    expectations: ["Orientation before a specific job search", "14 choices about activities, impact, ways of working and real-life conditions", "Several professional directions instead of one supposedly right career", "Traceable evidence, conditions and a concrete exploration step"],
    analysisAreas: ["Activities and desired impact", "Motivators and learning direction", "Contact with people, focus and collaboration", "Structure, autonomy and working rhythm", "Firm conditions and preferences", "A realistic qualification scope"],
    discovery: { title: "FYNS · Career fit", category: "Find Your Next Step", tags: ["Career orientation", "Career fit", "Career direction"], keywords: ["Professional direction", "Career Map", "Work environment", "Activities", "Ways of working"] },
  },
  problem: {
    title: "I have a problem — what can I do?",
    description: "A structured journey that narrows down a difficult situation, makes possible actions visible and prepares a manageable next step.",
    expectations: ["A calm way to narrow down the problem area", "A small set of structured questions about your situation", "Possible next steps rather than blanket solutions", "Pointers towards appropriate support when useful"],
    analysisAreas: ["Problem area and context", "Current pressure and urgency", "Steps already attempted", "Your own scope for action", "Support and possible points of contact"],
    discovery: { category: "Find Your Next Step", tags: ["Clarifying a situation", "Possible actions", "Orientation"], keywords: ["Make sense of a problem", "Structure a situation", "Next steps", "Sources of support"] },
    professionalBoundary: "This orientation is not a substitute for professional medical, psychological, legal or other specialist advice. It helps you structure a situation and identify possible sources of support more deliberately.",
  },
  idea: {
    title: "I have an idea — how do I move it forward?",
    description: "A structured journey that turns a vague idea into a small, testable learning experiment grounded in the problem, people, value and feasibility.",
    expectations: ["Break the idea into understandable parts", "Sharpen the problem, people and value", "Assess assumptions and feasibility realistically", "Formulate a first manageable next step"],
    analysisAreas: ["Starting idea and motivation", "Problem and intended audience", "Value and differences from existing alternatives", "Resources and feasibility", "First tests and next steps"],
    discovery: { category: "Find Your Next Step", tags: ["Idea development", "Concept", "Audience", "Feasibility"], keywords: ["Structure an idea", "Implementation plan", "Make an idea concrete", "Next steps"] },
  },
};

const extendedFynsCopy = {
  es: {
    headline: "Tu siguiente paso no empieza con una respuesta prefabricada.", introduction: "Find Your Next Step te ayuda a ver con más claridad quién eres, tu situación y las direcciones posibles, sin decirte cómo vivir ni qué decidir.", principleTitle: "No existe la decisión vital correcta. Sí un siguiente movimiento que encaje mejor.", principleText: "La herramienta no decide por ti. Hace visible el contexto, ordena las preguntas y te ayuda a reconocer un paso que encaje contigo y con tu situación.", pathsTitle: "Empieza donde vive hoy tu pregunta.", pathsDescription: "Cuatro puntos de partida para situaciones distintas, unidos por la misma idea: primero comprender, después avanzar.", helpSteps: [{ number: "01", title: "Comprender", description: "Percibe qué te está marcando de verdad a ti, a tu situación o a tu idea." }, { number: "02", title: "Dar sentido", description: "Haz visibles las relaciones sin encasillar a nadie con rapidez." }, { number: "03", title: "Avanzar", description: "Convierte la claridad en un paso realista y coherente para ti." }], developmentTitle: "Una base pensada para seguir abierta.", developmentText: "FYNS V1 reúne cuatro betas funcionales independientes: Self-Reflection, Career, Problem e Idea. Todas trabajan con tus respuestas solo en el estado actual de la página y mantienen sus interpretaciones abiertas a revisión.", privacyText: "Las respuestas de los cuatro recorridos permanecen únicamente en el estado actual de la página. No se guardan ni se transmiten. Al recargar o salir se eliminan. No intervienen una cuenta ni una base de datos.", closingText: "No necesitas conocer aún todo el rumbo. Basta un siguiente paso honesto.", discovery: { category: "Herramienta de orientación", tags: ["Human Context First", "Orientación", "Siguiente paso"], keywords: ["Dirección personal", "Aclarar una situación", "Preparar una decisión"] },
  },
  tr: {
    headline: "Sonraki adımın hazır bir yanıtla başlamaz.", introduction: "Find Your Next Step; nasıl yaşaman veya neye karar vermen gerektiğini söylemeden kendini, durumunu ve olası yönleri daha net görmene yardımcı olur.", principleTitle: "Tek bir doğru hayat kararı değil. Sana daha uygun bir sonraki hareket.", principleText: "Araç senin yerine karar vermez. Bağlamı görünür kılar, soruları düzenler ve sana ve durumuna uyan bir sonraki adımı fark etmene yardımcı olur.", pathsTitle: "Sorunun bugün bulunduğu yerden başla.", pathsDescription: "Farklı durumlar için dört başlangıç noktası, aynı ilkeyle bağlı: önce anla, sonra ilerle.", helpSteps: [{ number: "01", title: "Anla", description: "Şu anda seni, durumunu veya fikrini gerçekten neyin şekillendirdiğini fark et." }, { number: "02", title: "Anlamlandır", description: "İnsanları hızlı kategorilere sıkıştırmadan bağlantıları görünür kıl." }, { number: "03", title: "İlerle", description: "Netliği gerçekçi ve sana uyan bir sonraki adıma dönüştür." }], developmentTitle: "Bilinçli olarak açık kalmak üzere kurulan bir temel.", developmentText: "FYNS V1 dört ayrı işlevsel betayı bir araya getirir: Self-Reflection, Career, Problem ve Idea. Dördü de yanıtlarınla yalnızca mevcut sayfa durumunda çalışır ve her yorumu gözden geçirilebilir tutar.", privacyText: "Dört yolculuktaki yanıtlar yalnızca mevcut sayfa durumunda kalır. Kaydedilmez veya aktarılmaz. Sayfayı yenilemek ya da terk etmek yanıtları siler. Kullanıcı hesabı veya veritabanı kullanılmaz.", closingText: "Yönün tamamını henüz bilmek zorunda değilsin. Dürüst bir sonraki adım yeter.", discovery: { category: "Yön bulma aracı", tags: ["Human Context First", "Yönelim", "Sonraki adım"], keywords: ["Kişisel yön", "Durumu netleştirme", "Karara hazırlanma"] },
  },
  pl: {
    headline: "Twój kolejny krok nie zaczyna się od gotowej odpowiedzi.", introduction: "Find Your Next Step pomaga wyraźniej zobaczyć siebie, swoją sytuację i możliwe kierunki — bez mówienia Ci, jak żyć ani co postanowić.", principleTitle: "Nie jedna właściwa decyzja życiowa. Raczej kolejny ruch, który lepiej pasuje.", principleText: "Narzędzie nie podejmuje decyzji za Ciebie. Uwidacznia kontekst, porządkuje pytania i pomaga rozpoznać krok pasujący do Ciebie i Twojej sytuacji.", pathsTitle: "Zacznij tam, gdzie dziś znajduje się Twoje pytanie.", pathsDescription: "Cztery punkty wyjścia dla różnych sytuacji, połączone jedną zasadą: najpierw zrozum, potem rusz dalej.", helpSteps: [{ number: "01", title: "Zrozum", description: "Zauważ, co naprawdę kształtuje teraz Ciebie, Twoją sytuację lub pomysł." }, { number: "02", title: "Uporządkuj", description: "Pokaż zależności bez szybkiego zamykania ludzi w kategoriach." }, { number: "03", title: "Rusz dalej", description: "Przełóż jasność na realistyczny krok, który jest spójny z Tobą." }], developmentTitle: "Fundament zaprojektowany tak, by pozostać otwarty.", developmentText: "FYNS V1 łączy cztery niezależne funkcjonalne wersje beta: Self-Reflection, Career, Problem i Idea. Wszystkie pracują z odpowiedziami wyłącznie w bieżącym stanie strony i pozostawiają każdą interpretację otwartą na zmianę.", privacyText: "Odpowiedzi ze wszystkich czterech ścieżek pozostają wyłącznie w bieżącym stanie strony. Nie są zapisywane ani przesyłane. Odświeżenie lub opuszczenie strony je usuwa. Nie używamy tu konta ani bazy danych.", closingText: "Nie musisz jeszcze znać całego kierunku. Wystarczy jeden uczciwy kolejny krok.", discovery: { category: "Narzędzie orientacji", tags: ["Human Context First", "Orientacja", "Kolejny krok"], keywords: ["Osobisty kierunek", "Uporządkowanie sytuacji", "Przygotowanie decyzji"] },
  },
  el: {
    headline: "Το επόμενο βήμα σου δεν ξεκινά με μια έτοιμη απάντηση.", introduction: "Το Find Your Next Step σε βοηθά να δεις καθαρότερα τον εαυτό σου, την κατάστασή σου και τις πιθανές κατευθύνσεις, χωρίς να σου λέει πώς να ζήσεις ή τι να αποφασίσεις.", principleTitle: "Όχι η μία σωστή απόφαση ζωής. Μια επόμενη κίνηση που σου ταιριάζει καλύτερα.", principleText: "Το εργαλείο δεν αποφασίζει για εσένα. Κάνει το πλαίσιο ορατό, βάζει τις ερωτήσεις σε τάξη και σε βοηθά να αναγνωρίσεις ένα βήμα που ταιριάζει σε εσένα και στην κατάστασή σου.", pathsTitle: "Ξεκίνησε από εκεί όπου βρίσκεται σήμερα η ερώτησή σου.", pathsDescription: "Τέσσερα σημεία εκκίνησης για διαφορετικές καταστάσεις, ενωμένα από την ίδια αρχή: πρώτα κατανόηση, μετά κίνηση.", helpSteps: [{ number: "01", title: "Κατανόησε", description: "Παρατήρησε τι διαμορφώνει πραγματικά τώρα εσένα, την κατάστασή σου ή την ιδέα σου." }, { number: "02", title: "Βάλε σε πλαίσιο", description: "Κάνε τις συνδέσεις ορατές χωρίς να κλείνεις τους ανθρώπους σε γρήγορες κατηγορίες." }, { number: "03", title: "Προχώρα", description: "Μετέτρεψε τη σαφήνεια σε ένα ρεαλιστικό επόμενο βήμα που σου ταιριάζει." }], developmentTitle: "Ένα θεμέλιο σχεδιασμένο να παραμένει ανοιχτό.", developmentText: "Το FYNS V1 συνδέει τέσσερις ανεξάρτητες λειτουργικές beta: Self-Reflection, Career, Problem και Idea. Και οι τέσσερις δουλεύουν με τις απαντήσεις σου μόνο στην τρέχουσα κατάσταση της σελίδας και κρατούν κάθε ερμηνεία ανοιχτή σε αναθεώρηση.", privacyText: "Οι απαντήσεις και στις τέσσερις διαδρομές μένουν μόνο στην τρέχουσα κατάσταση της σελίδας. Δεν αποθηκεύονται ούτε μεταδίδονται. Η ανανέωση ή η έξοδος τις διαγράφει. Δεν χρησιμοποιείται λογαριασμός ή βάση δεδομένων.", closingText: "Δεν χρειάζεται να γνωρίζεις ακόμη όλη την κατεύθυνση. Αρκεί ένα ειλικρινές επόμενο βήμα.", discovery: { category: "Εργαλείο προσανατολισμού", tags: ["Human Context First", "Προσανατολισμός", "Επόμενο βήμα"], keywords: ["Προσωπική κατεύθυνση", "Αποσαφήνιση κατάστασης", "Προετοιμασία απόφασης"] },
  },
  ru: {
    headline: "Твой следующий шаг начинается не с готового ответа.", introduction: "Find Your Next Step помогает яснее увидеть себя, свою ситуацию и возможные направления, не указывая, как жить и что решать.", principleTitle: "Не единственно правильное жизненное решение. А следующий шаг, который лучше тебе подходит.", principleText: "Инструмент не принимает решения за тебя. Он делает контекст видимым, помогает упорядочить вопросы и заметить шаг, который подходит тебе и твоей ситуации.", pathsTitle: "Начни там, где сегодня находится твой вопрос.", pathsDescription: "Четыре исходные точки для разных ситуаций, объединённые одной идеей: сначала понять, затем двигаться дальше.", helpSteps: [{ number: "01", title: "Понять", description: "Заметь, что действительно формирует сейчас тебя, твою ситуацию или идею." }, { number: "02", title: "Осмыслить", description: "Сделай связи видимыми, не загоняя людей в поспешные категории." }, { number: "03", title: "Двигаться дальше", description: "Преврати ясность в реалистичный следующий шаг, который тебе подходит." }], developmentTitle: "Основа, которая намеренно остаётся открытой.", developmentText: "FYNS V1 объединяет четыре самостоятельные функциональные бета-версии: Self-Reflection, Career, Problem и Idea. Все они работают с ответами только в текущем состоянии страницы и оставляют любую интерпретацию открытой для пересмотра.", privacyText: "Ответы во всех четырёх маршрутах остаются только в текущем состоянии страницы. Они не сохраняются и не передаются. При обновлении или выходе со страницы ответы исчезают. Учётная запись и база данных не используются.", closingText: "Тебе пока не обязательно знать весь путь. Достаточно одного честного следующего шага.", discovery: { category: "Инструмент для поиска направления", tags: ["Human Context First", "Ориентир", "Следующий шаг"], keywords: ["Личное направление", "Прояснить ситуацию", "Подготовить решение"] },
  },
} as const;

function translatedJourney(locale: Exclude<Locale, "de" | "en">, slug: NextStepJourney["slug"]): Pick<NextStepJourney, "title" | "description" | "expectations" | "analysisAreas" | "discovery" | "professionalBoundary"> {
  const copy = {
    es: {
      self: ["¿Quién soy?", "Una reflexión estructurada que muestra patrones en tus valores, necesidades, energía y condiciones útiles, sin convertirte en un tipo."], career: ["¿Qué trabajo podría encajar conmigo?", "Un Career Map interactivo que abre varias direcciones profesionales con razones comprensibles, condiciones realistas y pasos concretos de exploración."], problem: ["Tengo un problema, ¿qué puedo hacer?", "Un recorrido estructurado que acota una situación difícil, hace visibles posibles acciones y prepara un siguiente paso manejable."], idea: ["Tengo una idea, ¿cómo la hago avanzar?", "Un recorrido estructurado que convierte una idea difusa en un pequeño experimento de aprendizaje verificable."],
    },
    tr: {
      self: ["Ben kimim?", "Değerlerin, ihtiyaçların, enerjin ve yararlı koşullarındaki örüntüleri seni bir tipe sıkıştırmadan görünür kılan yapılandırılmış bir öz değerlendirme."], career: ["Hangi iş bana uygun olabilir?", "Anlaşılır nedenler, gerçekçi koşullar ve somut keşif adımlarıyla birden fazla mesleki yön açan etkileşimli bir Career Map."], problem: ["Bir sorunum var; ne yapabilirim?", "Zor bir durumu sınırlandıran, olası eylemleri görünür kılan ve uygulanabilir bir sonraki adımı hazırlayan yapılandırılmış bir yolculuk."], idea: ["Bir fikrim var; nasıl ilerletebilirim?", "Belirsiz bir fikri küçük ve sınanabilir bir öğrenme deneyine dönüştüren yapılandırılmış bir yolculuk."],
    },
    pl: {
      self: ["Kim jestem?", "Uporządkowana autorefleksja, która pokazuje wzorce w Twoich wartościach, potrzebach, energii i pomocnych warunkach — bez zamykania Cię w typie."], career: ["Jaka praca mogłaby do mnie pasować?", "Interaktywna Career Map, która pokazuje kilka kierunków zawodowych wraz z czytelnymi powodami, realistycznymi warunkami i konkretnymi krokami do sprawdzenia."], problem: ["Mam problem — co mogę zrobić?", "Uporządkowana ścieżka, która pomaga zawęzić trudną sytuację, zobaczyć możliwe działania i przygotować wykonalny kolejny krok."], idea: ["Mam pomysł — jak ruszyć z nim dalej?", "Uporządkowana ścieżka, która zamienia niejasny pomysł w mały, możliwy do sprawdzenia eksperyment uczący."],
    },
    el: {
      self: ["Ποιος/ποια είμαι;", "Ένας δομημένος αναστοχασμός που κάνει ορατά μοτίβα στις αξίες, τις ανάγκες, την ενέργεια και τις βοηθητικές συνθήκες, χωρίς να σε περιορίζει σε έναν τύπο."], career: ["Ποια εργασία θα μπορούσε να μου ταιριάζει;", "Ένα διαδραστικό Career Map που ανοίγει πολλές επαγγελματικές κατευθύνσεις με κατανοητούς λόγους, ρεαλιστικές συνθήκες και συγκεκριμένα βήματα διερεύνησης."], problem: ["Έχω ένα πρόβλημα — τι μπορώ να κάνω;", "Μια δομημένη διαδρομή που περιορίζει μια δύσκολη κατάσταση, κάνει ορατές πιθανές ενέργειες και προετοιμάζει ένα διαχειρίσιμο επόμενο βήμα."], idea: ["Έχω μια ιδέα — πώς να την προχωρήσω;", "Μια δομημένη διαδρομή που μετατρέπει μια ασαφή ιδέα σε ένα μικρό, ελέγξιμο πείραμα μάθησης."],
    },
    ru: {
      self: ["Кто я?", "Структурированное самоосмысление, которое показывает закономерности в твоих ценностях, потребностях, энергии и полезных условиях, не сводя тебя к типу."], career: ["Какая работа могла бы мне подойти?", "Интерактивная Career Map, которая показывает несколько профессиональных направлений с понятными основаниями, реалистичными условиями и конкретными шагами для исследования."], problem: ["У меня проблема — что я могу сделать?", "Структурированный маршрут, который помогает очертить сложную ситуацию, увидеть возможные действия и подготовить посильный следующий шаг."], idea: ["У меня есть идея — как продвинуть её дальше?", "Структурированный маршрут, который превращает расплывчатую идею в небольшой проверяемый учебный эксперимент."],
    },
  } as const;
  const [title, description] = copy[locale][slug];
  const base = journeyEnglishCopy[slug];
  return { ...base, title, description };
}

const findYourNextStepByLocale = {
  de: findYourNextStep,
  en: { ...findYourNextStep, ...findYourNextStepEnglish },
  es: { ...findYourNextStep, ...extendedFynsCopy.es },
  tr: { ...findYourNextStep, ...extendedFynsCopy.tr },
  pl: { ...findYourNextStep, ...extendedFynsCopy.pl },
  el: { ...findYourNextStep, ...extendedFynsCopy.el },
  ru: { ...findYourNextStep, ...extendedFynsCopy.ru },
} as const;

const journeyCopyByLocale: Record<Locale, (journey: NextStepJourney) => NextStepJourney> = {
  de: (journey) => journey,
  en: (journey) => ({ ...journey, ...journeyEnglishCopy[journey.slug] }),
  es: (journey) => ({ ...journey, ...translatedJourney("es", journey.slug) }),
  tr: (journey) => ({ ...journey, ...translatedJourney("tr", journey.slug) }),
  pl: (journey) => ({ ...journey, ...translatedJourney("pl", journey.slug) }),
  el: (journey) => ({ ...journey, ...translatedJourney("el", journey.slug) }),
  ru: (journey) => ({ ...journey, ...translatedJourney("ru", journey.slug) }),
};

export function getFindYourNextStep(locale: Locale) { return findYourNextStepByLocale[locale]; }

export function getNextStepJourneys(locale: Locale): readonly NextStepJourney[] {
  return nextStepJourneys.map(journeyCopyByLocale[locale]);
}

export function getLocalizedNextStepJourney(slug: string, locale: Locale) {
  return getNextStepJourneys(locale).find((journey) => journey.slug === slug);
}
