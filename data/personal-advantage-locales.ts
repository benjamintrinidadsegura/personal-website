import type { Locale } from "@/lib/i18n/config";

export interface PersonalAdvantageUiCopy {
  metadataDescription: string;
  method: string;
  tagline: string;
  intro: string;
  expectation: readonly string[];
  beforeTitle: string;
  principles: readonly string[];
  privacyTitle: string;
  privacyBody: string;
  privacyPoints: readonly string[];
  privacyLink: string;
  languageNotice: string;
  start: string;
  resumeTitle: string;
  resumeBody: string;
  continue: string;
  startOver: string;
  resetConfirm: string;
  cancel: string;
  localNotice: string;
  progressLabel: string;
  back: string;
  next: string;
  skip: string;
  skipped: string;
  chooseOne: string;
  chooseSeveral: string;
  selected: string;
  textOptional: string;
  textNotPersisted: string;
  remaining: string;
  probesEyebrow: string;
  probesTitle: string;
  probesBody: string;
  calibrationEyebrow: string;
  calibrationTitle: string;
  calibrationBody: string;
  veryTrue: string;
  sometimesTrue: string;
  notReally: string;
  connecting: string;
  gotIt: string;
  revealBody: string;
  reveal: string;
  coreAdvantage: string;
  confidence: Record<"emerging" | "supported" | "strong-pattern", string>;
  recognize: string;
  why: string;
  stack: string;
  core: string;
  amplifier: string;
  supporting: string;
  evidence: string;
  combinations: string;
  hidden: string;
  powerful: string;
  killers: string;
  shadow: string;
  counterweight: string;
  multiplier: string;
  portfolio: string;
  playbook: string;
  showsUp: string;
  tryThis: string;
  watchFor: string;
  experimentTitle: string;
  experimentBody: string;
  onePager: string;
  myAdvantage: string;
  myStack: string;
  putMeHere: string;
  myHiddenEdge: string;
  remember: string;
  share: string;
  shareTitle: string;
  shareBody: string;
  shareChoices: Record<"advantage" | "stack" | "hidden" | "shadow" | "reminder", string>;
  format: string;
  formats: Record<"story" | "portrait" | "square", string>;
  screenshot: string;
  exitScreenshot: string;
  copyText: string;
  copied: string;
  copyFailed: string;
  close: string;
  privateShare: string;
  hypothesis: string;
  retake: string;
  exploreBrain: string;
}

const en: PersonalAdvantageUiCopy = {
  metadataDescription: "A deep, combination-based self-reflection that maps how capability, experience, access, energy and context reinforce one another.", method: "Personal Advantage Mapping", tagline: "Find the combination that makes you unusually useful.", intro: "Your advantage probably isn't one spectacular skill. It may be the way your thinking, learned capability, lived experience, energy and other people's reliance combine.", expectation: ["~20–30 min", "Deep assessment", "Personal Advantage Map"], beforeTitle: "This one goes deeper.", principles: ["We're not trying to put you into a type.", "Be specific when you can. Real situations beat idealised self-images.", "Don't optimise your answers. There is no universally best stack.", "Skip anything you do not want to answer."], privacyTitle: "Some questions get personal.", privacyBody: "The assessment can ask about experience, skills, access, constraints, working patterns and energy. Depth does not require telling BTS everything.", privacyPoints: ["Progress is stored only in this browser.", "Optional free text is not persisted and is never scored.", "No answers are sent to AI, analytics, a server or an account.", "Sharing is explicit and uses a safe summary—never raw responses."], privacyLink: "Read the full privacy explanation", languageNotice: "The canonical V1 assessment and result content is currently authored in English. Functional controls follow your selected language; no machine-translated psychological-like claims are inserted silently.", start: "Map my advantage", resumeTitle: "Welcome back.", resumeBody: "You have private progress stored in this browser.", continue: "Continue", startOver: "Start over", resetConfirm: "Clear this browser-local assessment and begin again?", cancel: "Cancel", localNotice: "Stored only in this browser. Clearing browser data removes it.", progressLabel: "Assessment chapter progress", back: "Back", next: "Continue", skip: "Skip this question", skipped: "Skipped", chooseOne: "Choose one", chooseSeveral: "Choose any that genuinely repeat", selected: "selected", textOptional: "Optional note", textNotPersisted: "This note stays in page memory only and is not restored after a refresh.", remaining: "approximately remaining", probesEyebrow: "08 / Connecting unlikely dots", probesTitle: "Do the parts actually interact?", probesBody: "These probes are generated from the combinations currently leading in your evidence. They are not the same for every person.", calibrationEyebrow: "09 / Connecting the dots", calibrationTitle: "A few leading hypotheses", calibrationBody: "This isn't choosing your result. It helps calibrate what the evidence already suggests.", veryTrue: "Very true", sometimesTrue: "Sometimes true", notReally: "Not really me", connecting: "Connecting the dots.", gotIt: "We've got it.", revealBody: "One combination explains more of your answers than any individual strength on its own.", reveal: "Show me my advantage", coreAdvantage: "Your Core Advantage", confidence: { emerging: "Emerging — worth testing, not declaring", supported: "Supported pattern", "strong-pattern": "Strong pattern" }, recognize: "You might recognize this in moments like…", why: "Why these parts matter together", stack: "Your Advantage Stack", core: "Core component", amplifier: "Amplifier", supporting: "Supporting asset", evidence: "Evidence behind the map", combinations: "Distinctive combinations", hidden: "You may be underusing this", powerful: "Where this becomes powerful", killers: "This advantage gets weaker when…", shadow: "Every advantage can overfire", counterweight: "Counterweight", multiplier: "One thing could multiply this", portfolio: "Advantage Portfolio", playbook: "Personal Playbook", showsUp: "Where this shows up", tryThis: "Try this", watchFor: "Watch for this", experimentTitle: "Don't believe the test. Test the test.", experimentBody: "Choose one evidence-based experiment. The map creates hypotheses; real life tests them.", onePager: "Personal Advantage One-Pager", myAdvantage: "My Unfair Advantage", myStack: "My Stack", putMeHere: "Put me here", myHiddenEdge: "My hidden edge", remember: "Remember", share: "Share my Advantage", shareTitle: "Choose what leaves this private result", shareBody: "Only the selected safe summary is composed. Raw answers, free text, constraints and access details never enter the card.", shareChoices: { advantage: "My Advantage", stack: "My Stack", hidden: "My Hidden Edge", shadow: "My Shadow / Counterweight", reminder: "My Reminder" }, format: "Format", formats: { story: "9:16 Story", portrait: "4:5 Portrait", square: "1:1 Square" }, screenshot: "Screenshot mode", exitScreenshot: "Exit screenshot mode", copyText: "Copy text + link", copied: "Copied", copyFailed: "Copying is not available. Select the summary manually.", close: "Close", privateShare: "Private evidence remains on this device. Native share targets are controlled by your operating system after you choose them.", hypothesis: "This isn't a verdict. Your Advantage Map is a hypothesis built from patterns in your answers. The useful part starts when you notice whether it holds up in real life.", retake: "Retake later", exploreBrain: "See Benjamin's Brain Manual",
};

function localized(overrides: Partial<PersonalAdvantageUiCopy>): PersonalAdvantageUiCopy { return { ...en, ...overrides, confidence: { ...en.confidence, ...overrides.confidence }, shareChoices: { ...en.shareChoices, ...overrides.shareChoices }, formats: { ...en.formats, ...overrides.formats } }; }

const dictionaries: Record<Locale, PersonalAdvantageUiCopy> = {
  en,
  de: localized({ metadataDescription: "Eine tiefe, kombinationsbasierte Selbstreflexion darüber, wie Fähigkeiten, Erfahrung, Zugang, Energie und Kontext einander verstärken.", tagline: "Finde die Kombination, die dich ungewöhnlich nützlich macht.", intro: "Dein Vorteil ist wahrscheinlich nicht die eine spektakuläre Fähigkeit. Er kann daraus entstehen, wie Denken, erlernte Fähigkeiten, Erfahrung, Energie und das Vertrauen anderer zusammenwirken.", expectation: ["~20–30 Min.", "Tiefgehende Reflexion", "Personal Advantage Map"], beforeTitle: "Diese Reflexion geht tiefer.", principles: ["Wir versuchen nicht, dich in einen Typ einzuordnen.", "Sei konkret, wenn du kannst. Reale Situationen sind hilfreicher als ideale Selbstbilder.", "Optimiere deine Antworten nicht. Es gibt keinen universell besten Stack.", "Überspringe alles, was du nicht beantworten möchtest."], privacyTitle: "Einige Fragen werden persönlich.", privacyBody: "Die Reflexion kann nach Erfahrungen, Fähigkeiten, Zugang, Einschränkungen, Arbeitsmustern und Energie fragen. Tiefe verlangt nicht, BTS alles zu erzählen.", privacyPoints: ["Fortschritt bleibt ausschließlich in diesem Browser.", "Optionale Freitexte werden nicht gespeichert und nie bewertet.", "Keine Antworten gehen an KI, Analytics, Server oder Account.", "Teilen ist ausdrücklich und nutzt nur eine sichere Zusammenfassung."], privacyLink: "Vollständige Datenschutzerklärung", languageNotice: "Die kanonischen V1-Fragen und Ergebnisinhalte sind derzeit auf Englisch verfasst. Bedienelemente folgen deiner Sprache; nuancierte Inhalte werden nicht still maschinell übersetzt.", start: "Meinen Vorteil abbilden", resumeTitle: "Willkommen zurück.", resumeBody: "In diesem Browser ist privater Fortschritt gespeichert.", continue: "Fortsetzen", startOver: "Neu beginnen", resetConfirm: "Diese browserlokale Reflexion löschen und neu beginnen?", cancel: "Abbrechen", localNotice: "Nur in diesem Browser gespeichert. Das Löschen von Browserdaten entfernt den Fortschritt.", progressLabel: "Kapitel-Fortschritt", back: "Zurück", next: "Weiter", skip: "Diese Frage überspringen", skipped: "Übersprungen", chooseOne: "Eine Option wählen", chooseSeveral: "Wähle, was sich wirklich wiederholt", selected: "ausgewählt", textOptional: "Optionale Notiz", textNotPersisted: "Diese Notiz bleibt nur im Arbeitsspeicher der Seite und wird nach Neuladen nicht wiederhergestellt.", remaining: "ungefähr verbleibend", probesEyebrow: "08 / Unwahrscheinliche Punkte verbinden", probesTitle: "Wirken die Teile wirklich zusammen?", probesBody: "Diese Fragen entstehen aus den aktuell führenden Kombinationen und sind nicht für jede Person gleich.", calibrationEyebrow: "09 / Punkte verbinden", calibrationTitle: "Einige führende Hypothesen", calibrationBody: "Du wählst nicht dein Ergebnis. Du kalibrierst, was die Evidenz bereits nahelegt.", veryTrue: "Trifft sehr zu", sometimesTrue: "Trifft manchmal zu", notReally: "Passt nicht wirklich", connecting: "Wir verbinden die Punkte.", gotIt: "Wir haben es.", revealBody: "Eine Kombination erklärt mehr deiner Antworten als jede einzelne Stärke für sich.", reveal: "Meinen Vorteil zeigen", coreAdvantage: "Dein Core Advantage", confidence: { emerging: "Im Entstehen — testen, nicht erklären", supported: "Gestütztes Muster", "strong-pattern": "Starkes Muster" }, recognize: "Du könntest das in solchen Momenten erkennen…", why: "Warum diese Teile gemeinsam zählen", stack: "Dein Advantage Stack", core: "Kernkomponente", amplifier: "Verstärker", supporting: "Unterstützendes Asset", evidence: "Evidenz hinter der Map", combinations: "Charakteristische Kombinationen", hidden: "Das könntest du noch zu wenig nutzen", powerful: "Wo das besonders wirksam wird", killers: "Dieser Vorteil wird schwächer, wenn…", shadow: "Jeder Vorteil kann übersteuern", counterweight: "Gegengewicht", multiplier: "Eine Sache könnte das vervielfachen", portfolio: "Advantage Portfolio", playbook: "Persönliches Playbook", showsUp: "Wo es sich zeigt", tryThis: "Probiere das", watchFor: "Achte darauf", experimentTitle: "Glaube dem Test nicht. Teste den Test.", experimentBody: "Wähle ein evidenzbasiertes Experiment. Die Map liefert Hypothesen; das echte Leben prüft sie.", onePager: "Personal Advantage One-Pager", myAdvantage: "Mein Unfair Advantage", myStack: "Mein Stack", putMeHere: "Hier bin ich nützlich", myHiddenEdge: "Mein verborgener Hebel", remember: "Merken", share: "Meinen Advantage teilen", shareTitle: "Wähle, was dieses private Ergebnis verlässt", shareBody: "Nur die gewählte sichere Zusammenfassung wird erstellt. Rohantworten, Freitext, Einschränkungen und Zugangsdaten gelangen nie in die Karte.", shareChoices: { advantage: "Mein Advantage", stack: "Mein Stack", hidden: "Mein verborgener Hebel", shadow: "Mein Shadow / Gegengewicht", reminder: "Meine Erinnerung" }, format: "Format", formats: { story: "9:16 Story", portrait: "4:5 Portrait", square: "1:1 Quadrat" }, screenshot: "Screenshot-Modus", exitScreenshot: "Screenshot-Modus beenden", copyText: "Text + Link kopieren", copied: "Kopiert", copyFailed: "Kopieren ist nicht verfügbar.", close: "Schließen", privateShare: "Private Evidenz bleibt auf diesem Gerät. Nach deiner Auswahl kontrolliert das Betriebssystem die Ziel-App.", hypothesis: "Das ist kein Urteil. Deine Advantage Map ist eine Hypothese aus Mustern deiner Antworten. Nützlich wird sie, wenn du im echten Leben prüfst, ob sie trägt.", retake: "Später neu durchführen", exploreBrain: "Benjamins Brain Manual ansehen" }),
  es: localized({ tagline: "Encuentra la combinación que te hace inusualmente útil.", privacyTitle: "Algunas preguntas son personales.", languageNotice: "El contenido canónico V1 está redactado actualmente en inglés. Los controles siguen tu idioma; no se insertan traducciones automáticas silenciosas.", start: "Mapear mi ventaja", resumeTitle: "Qué bueno verte de nuevo.", continue: "Continuar", startOver: "Empezar de nuevo", back: "Atrás", next: "Continuar", skip: "Saltar esta pregunta", close: "Cerrar", share: "Compartir mi ventaja", screenshot: "Modo captura", exitScreenshot: "Salir del modo captura" }),
  tr: localized({ tagline: "Seni alışılmadık biçimde faydalı kılan kombinasyonu bul.", privacyTitle: "Bazı sorular kişisel olabilir.", languageNotice: "Kanonik V1 içerik şu anda İngilizce yazılmıştır. İşlevsel kontroller dilini izler; sessiz makine çevirisi eklenmez.", start: "Avantajımı haritala", resumeTitle: "Tekrar hoş geldin.", continue: "Devam et", startOver: "Baştan başla", back: "Geri", next: "Devam", skip: "Bu soruyu atla", close: "Kapat", share: "Avantajımı paylaş", screenshot: "Ekran görüntüsü modu", exitScreenshot: "Ekran görüntüsü modundan çık" }),
  pl: localized({ tagline: "Znajdź połączenie, które czyni cię wyjątkowo użyteczną lub użytecznym.", privacyTitle: "Niektóre pytania są osobiste.", languageNotice: "Kanoniczna treść V1 jest obecnie napisana po angielsku. Elementy obsługi są w twoim języku; nie dodajemy po cichu tłumaczeń maszynowych.", start: "Zmapuj moją przewagę", resumeTitle: "Witaj ponownie.", continue: "Kontynuuj", startOver: "Zacznij od nowa", back: "Wstecz", next: "Dalej", skip: "Pomiń to pytanie", close: "Zamknij", share: "Udostępnij moją przewagę", screenshot: "Tryb zrzutu", exitScreenshot: "Wyjdź z trybu zrzutu" }),
  el: localized({ tagline: "Βρες τον συνδυασμό που σε κάνει ασυνήθιστα χρήσιμο.", privacyTitle: "Μερικές ερωτήσεις είναι προσωπικές.", languageNotice: "Το κανονικό περιεχόμενο V1 είναι προς το παρόν γραμμένο στα αγγλικά. Τα λειτουργικά στοιχεία ακολουθούν τη γλώσσα σου χωρίς σιωπηλή μηχανική μετάφραση.", start: "Χαρτογράφησε το πλεονέκτημά μου", resumeTitle: "Καλώς επέστρεψες.", continue: "Συνέχεια", startOver: "Από την αρχή", back: "Πίσω", next: "Συνέχεια", skip: "Παράλειψη ερώτησης", close: "Κλείσιμο", share: "Κοινοποίηση πλεονεκτήματος", screenshot: "Λειτουργία στιγμιότυπου", exitScreenshot: "Έξοδος από στιγμιότυπο" }),
  ru: localized({ tagline: "Найдите сочетание, которое делает вас необычно полезным.", privacyTitle: "Некоторые вопросы личные.", languageNotice: "Канонический контент V1 пока написан на английском. Элементы управления соответствуют выбранному языку; скрытый машинный перевод не используется.", start: "Составить карту преимущества", resumeTitle: "С возвращением.", continue: "Продолжить", startOver: "Начать заново", back: "Назад", next: "Продолжить", skip: "Пропустить вопрос", close: "Закрыть", share: "Поделиться преимуществом", screenshot: "Режим снимка", exitScreenshot: "Выйти из режима снимка" }),
};

export function getPersonalAdvantageUiCopy(locale: Locale): PersonalAdvantageUiCopy { return dictionaries[locale]; }
