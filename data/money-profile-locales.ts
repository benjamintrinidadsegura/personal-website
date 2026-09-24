import type { Locale } from "@/lib/i18n/config";

export interface MoneyProfileUiCopy {
  publicTitle: string;
  subtitle: string;
  metadataDescription: string;
  duration: string;
  depth: string;
  noData: string;
  cta: string;
  resume: string;
  startAgain: string;
  beforeTitle: string;
  trustIntro: string;
  noAskTitle: string;
  noAsk: readonly string[];
  patternsTitle: string;
  patterns: readonly string[];
  noBank: string;
  noAi: string;
  safetyBoundary: string;
  privacyLink: string;
  localNotice: string;
  contentLanguageNotice: string;
  progress: string;
  remaining: string;
  back: string;
  next: string;
  skip: string;
  skipped: string;
  startOver: string;
  resetConfirm: string;
  chooseOne: string;
  chooseSeveral: string;
  selected: string;
  calibrationEyebrow: string;
  calibrationTitle: string;
  calibrationBody: string;
  veryTrue: string;
  partly: string;
  notReally: string;
  connecting: string;
  revealTitle: string;
  revealBody: string;
  reveal: string;
  profile: string;
  meaning: string;
  baseline: string;
  underStress: string;
  works: string;
  blindSpots: string;
  tradeOffs: string;
  triggers: string;
  helps: string;
  playbook: string;
  nextSteps: string;
  experiment: string;
  onePager: string;
  share: string;
  retake: string;
  closing: string;
  boundaryShort: string;
  confidence: Record<"clear-pattern" | "mixed-profile" | "context-dependent" | "money-map", string>;
  atMyBest: string;
  watchFor: string;
  whatHelps: string;
  myNextMove: string;
  shareTitle: string;
  shareBody: string;
  shareChoices: Record<"profile" | "meaning" | "strength" | "reminder", string>;
  format: string;
  formats: Record<"story" | "portrait" | "square", string>;
  copyText: string;
  copied: string;
  copyFailed: string;
  screenshot: string;
  exitScreenshot: string;
  close: string;
  privateShare: string;
}

const sharedEnglish = {
  profile: "Profile", meaning: "Meaning", baseline: "Baseline", underStress: "Under Stress", works: "What already works", blindSpots: "Blind spots", tradeOffs: "Trade-offs", triggers: "Triggers", helps: "What tends to help", playbook: "Money Playbook", nextSteps: "Small next steps", experiment: "Try one thing", onePager: "My Money Profile One-Pager", share: "Share", retake: "Retake", atMyBest: "At my best", watchFor: "Watch for", whatHelps: "What helps me", myNextMove: "My next move",
  confidence: { "clear-pattern": "Clear pattern", "mixed-profile": "Mixed profile", "context-dependent": "Context-dependent", "money-map": "Money map — no forced type" },
  shareChoices: { profile: "My Money Profile", meaning: "My Money Meaning", strength: "My Money Strength", reminder: "My reminder / next move" },
  formats: { story: "Story · 9:16", portrait: "Portrait · 4:5", square: "Square · 1:1" },
} as const;

const dictionaries: Record<Locale, MoneyProfileUiCopy> = {
  de: {
    publicTitle: "Welcher Geldtyp bist du?", subtitle: "Verstehe, wie du mit Geld umgehst – und was dir wirklich helfen könnte.", metadataDescription: "Tiefe, nicht wertende Reflexion über Geldmuster, Stressreaktionen und kleine passende nächste Schritte.", duration: "Ca. 12–18 Min.", depth: "Tiefe Reflexion", noData: "Keine Finanzdaten erforderlich", cta: "Mein Money Profile erkunden", resume: "Fortsetzen", startAgain: "Neu beginnen", beforeTitle: "Bevor du beginnst", trustIntro: "Hier geht es nicht darum, wie viel Geld du hast. Es geht um Muster, Bedeutungen und Veränderungen unter Stress.", noAskTitle: "Wir fragen nicht nach", noAsk: ["Einkommen, Kontostand oder Vermögen", "Schuldenbeträgen oder Kreditwürdigkeit", "Anlagen oder Bankzugang"], patternsTitle: "Wir betrachten", patterns: ["was Geld für dich bedeutet", "wie du Entscheidungen triffst", "was sich unter Stress verändert", "welche kleinen Strukturen besser passen könnten"], noBank: "Keine Bankverbindung.", noAi: "Keine KI-Auswertung zur Laufzeit.", safetyBoundary: "Selbstreflexion über finanzielles Verhalten – keine Finanz-, Anlage-, Steuer-, Kredit- oder Schuldberatung.", privacyLink: "Datenschutz ansehen", localNotice: "Lokal auf diesem Gerät gespeichert", contentLanguageNotice: "Die funktionale Oberfläche ist lokalisiert. Die nuancierten Fragen und Ergebnisdeutungen bleiben in V1 bewusst englische Originaltexte; redaktionelle Muttersprachler-Prüfung folgt vor Release.", progress: "Fortschritt", remaining: "verbleibend", back: "Zurück", next: "Weiter", skip: "Überspringen", skipped: "Übersprungen", startOver: "Neu starten", resetConfirm: "Lokalen Fortschritt löschen und neu beginnen?", chooseOne: "Wähle eine Antwort", chooseSeveral: "Wähle mehrere Antworten", selected: "ausgewählt", calibrationEyebrow: "Kalibrierung", calibrationTitle: "Passt das zu dir?", calibrationBody: "Diese Hypothesen stammen nur aus deinen bisherigen Antworten. Sie können eine knappe Deutung verfeinern, aber keine Evidenz erfinden.", veryTrue: "Trifft sehr zu", partly: "Teilweise", notReally: "Nicht wirklich", connecting: "Muster verbinden", revealTitle: "Dein Money Profile ist bereit.", revealBody: "Kein Urteil und kein Finanzscore – eine Karte deiner Antworten und kleiner Dinge, die du testen kannst.", reveal: "Ergebnis ansehen", closing: "Das ist kein Urteil darüber, wie gut du mit Geld bist. Es ist eine Karte von Mustern in deinen Antworten – und einigen kleinen Dingen, die einen Versuch wert sind.", boundaryShort: "Money Profile ist keine Finanz-, Anlage-, Steuer-, Kredit- oder Schuldberatung.", ...sharedEnglish, shareTitle: "Sicheren Inhalt wählen", shareBody: "Du entscheidest, was auf der abgeleiteten Karte erscheint. Stressdetails und private Reibung bleiben standardmäßig außen vor.", format: "Format", copyText: "Text und Link kopieren", copied: "Kopiert", copyFailed: "Kopieren fehlgeschlagen", screenshot: "Screenshot-Modus", exitScreenshot: "Screenshot-Modus verlassen", close: "Schließen", privateShare: "Nur abgeleitete Zusammenfassung. Keine Rohantworten, Beträge oder privaten Stressdetails.",
  },
  en: {
    publicTitle: "What's Your Money Profile?", subtitle: "Understand how you relate to money — and what might actually help.", metadataDescription: "Deep, non-judgmental reflection on money patterns, stress responses and small next steps that may fit.", duration: "About 12–18 min", depth: "Deep reflection", noData: "No financial data required", cta: "Explore my Money Profile", resume: "Resume", startAgain: "Start again", beforeTitle: "Before you begin", trustIntro: "This isn't a test of how much money you have. It looks at patterns, meaning and what changes under stress.", noAskTitle: "We won't ask for", noAsk: ["income, account balances or net worth", "debt amounts or credit scores", "investments or a bank connection"], patternsTitle: "We are looking at", patterns: ["what money means to you", "how you make decisions", "what changes under stress", "which small structures might fit you better"], noBank: "No bank connection.", noAi: "No runtime AI.", safetyBoundary: "Structured financial-behaviour self-reflection — not financial, investment, tax, credit or debt advice.", privacyLink: "Read the privacy details", localNotice: "Saved locally on this device", contentLanguageNotice: "Questions and interpretative content use the English canonical V1 editorial source.", progress: "Progress", remaining: "remaining", back: "Back", next: "Next", skip: "Skip", skipped: "Skipped", startOver: "Start over", resetConfirm: "Delete local progress and start again?", chooseOne: "Choose one", chooseSeveral: "Choose more than one", selected: "selected", calibrationEyebrow: "Calibration", calibrationTitle: "Does this sound like you?", calibrationBody: "These hypotheses come only from evidence in your answers. They can refine a close interpretation, never manufacture evidence.", veryTrue: "Very true", partly: "Partly", notReally: "Not really", connecting: "Connecting your patterns", revealTitle: "Your Money Profile is ready.", revealBody: "Not a verdict and not a financial score — a map of your answers and a few small things worth testing.", reveal: "See my result", closing: "This isn't a verdict on how good you are with money. It's a map of patterns in your answers — and a few small things worth testing.", boundaryShort: "Money Profile is not financial, investment, tax, credit or debt advice.", ...sharedEnglish, shareTitle: "Choose safe content", shareBody: "You decide what appears on the derived card. Stress details and private friction stay off by default.", format: "Format", copyText: "Copy text and link", copied: "Copied", copyFailed: "Copy failed", screenshot: "Screenshot Mode", exitScreenshot: "Exit Screenshot Mode", close: "Close", privateShare: "Derived summary only. No raw answers, amounts or private stress details.",
  },
  es: {
    publicTitle: "¿Cuál es tu perfil con el dinero?", subtitle: "Comprende cómo te relacionas con el dinero y qué podría ayudarte de verdad.", metadataDescription: "Reflexión profunda y sin juicios sobre patrones de dinero, estrés y pequeños próximos pasos.", duration: "Aprox. 12–18 min", depth: "Reflexión profunda", noData: "No se requieren datos financieros", cta: "Explorar mi Money Profile", resume: "Continuar", startAgain: "Empezar de nuevo", beforeTitle: "Antes de empezar", trustIntro: "No es una prueba de cuánto dinero tienes. Observa patrones, significados y cambios bajo estrés.", noAskTitle: "No preguntaremos por", noAsk: ["ingresos, saldos o patrimonio", "deudas o puntuación crediticia", "inversiones o conexión bancaria"], patternsTitle: "Observamos", patterns: ["qué significa el dinero para ti", "cómo decides", "qué cambia bajo estrés", "qué pequeñas estructuras podrían encajar"], noBank: "Sin conexión bancaria.", noAi: "Sin IA en tiempo de ejecución.", safetyBoundary: "Autorreflexión sobre conducta financiera; no es asesoramiento financiero, fiscal, crediticio, de inversión o deuda.", privacyLink: "Ver privacidad", localNotice: "Guardado localmente en este dispositivo", contentLanguageNotice: "La interfaz funcional está localizada. Las preguntas y interpretaciones matizadas conservan el original editorial inglés de V1; la revisión nativa llegará antes del lanzamiento.", progress: "Progreso", remaining: "restantes", back: "Atrás", next: "Siguiente", skip: "Omitir", skipped: "Omitida", startOver: "Reiniciar", resetConfirm: "¿Borrar el progreso local y empezar de nuevo?", chooseOne: "Elige una", chooseSeveral: "Elige varias", selected: "seleccionadas", calibrationEyebrow: "Calibración", calibrationTitle: "¿Te representa?", calibrationBody: "Estas hipótesis proceden solo de tus respuestas; no pueden inventar evidencia.", veryTrue: "Muy cierto", partly: "En parte", notReally: "No realmente", connecting: "Conectando patrones", revealTitle: "Tu Money Profile está listo.", revealBody: "No es un veredicto ni una puntuación financiera: es un mapa para probar.", reveal: "Ver resultado", closing: "No es un veredicto sobre lo bien que gestionas el dinero, sino un mapa de patrones y pequeños experimentos.", boundaryShort: "Money Profile no es asesoramiento financiero, fiscal, crediticio, de inversión o deuda.", ...sharedEnglish, shareTitle: "Elegir contenido seguro", shareBody: "Tú decides qué aparece. El estrés y las fricciones privadas no se comparten por defecto.", format: "Formato", copyText: "Copiar texto y enlace", copied: "Copiado", copyFailed: "No se pudo copiar", screenshot: "Modo captura", exitScreenshot: "Salir del modo captura", close: "Cerrar", privateShare: "Solo resumen derivado; sin respuestas, importes ni detalles privados.",
  },
  tr: {
    publicTitle: "Para Profilin Ne?", subtitle: "Parayla nasıl ilişki kurduğunu ve sana gerçekten neyin yardımcı olabileceğini anla.", metadataDescription: "Para örüntüleri, stres tepkileri ve uygun küçük adımlar üzerine yargısız derin düşünme.", duration: "Yaklaşık 12–18 dk", depth: "Derin düşünme", noData: "Finansal veri gerekmez", cta: "Money Profile'ımı keşfet", resume: "Devam et", startAgain: "Yeniden başla", beforeTitle: "Başlamadan önce", trustIntro: "Bu, ne kadar paran olduğunu ölçen bir test değil. Örüntülere, anlama ve stres altındaki değişime bakar.", noAskTitle: "Şunları sormayacağız", noAsk: ["gelir, hesap bakiyesi veya net servet", "borç tutarı veya kredi puanı", "yatırım veya banka bağlantısı"], patternsTitle: "Şunlara bakıyoruz", patterns: ["paranın senin için anlamına", "nasıl karar verdiğine", "stres altında neyin değiştiğine", "hangi küçük yapıların uyabileceğine"], noBank: "Banka bağlantısı yok.", noAi: "Çalışma anında yapay zekâ yok.", safetyBoundary: "Finansal davranış öz değerlendirmesidir; finans, yatırım, vergi, kredi veya borç tavsiyesi değildir.", privacyLink: "Gizliliği oku", localNotice: "Bu cihazda yerel olarak saklanır", contentLanguageNotice: "İşlevsel arayüz yerelleştirilmiştir. İncelikli soru ve yorumlar V1'de İngilizce editoryal kaynağı korur; ana dil incelemesi yayından önce yapılacaktır.", progress: "İlerleme", remaining: "kaldı", back: "Geri", next: "İleri", skip: "Atla", skipped: "Atlandı", startOver: "Baştan başla", resetConfirm: "Yerel ilerleme silinsin ve yeniden başlansın mı?", chooseOne: "Birini seç", chooseSeveral: "Birden fazla seç", selected: "seçildi", calibrationEyebrow: "Kalibrasyon", calibrationTitle: "Bu sana benziyor mu?", calibrationBody: "Bu varsayımlar yalnızca yanıtlarından gelir ve kanıt üretemez.", veryTrue: "Çok doğru", partly: "Kısmen", notReally: "Pek değil", connecting: "Örüntüler bağlanıyor", revealTitle: "Money Profile'ın hazır.", revealBody: "Bir hüküm veya finans puanı değil; denenecek küçük şeylerin haritası.", reveal: "Sonucu gör", closing: "Bu, parayla ne kadar iyi olduğuna dair bir hüküm değil; yanıtlarındaki örüntülerin haritasıdır.", boundaryShort: "Money Profile finans, yatırım, vergi, kredi veya borç tavsiyesi değildir.", ...sharedEnglish, shareTitle: "Güvenli içeriği seç", shareBody: "Kartta neyin görüneceğine sen karar verirsin; özel stres ayrıntıları varsayılan olarak paylaşılmaz.", format: "Biçim", copyText: "Metin ve bağlantıyı kopyala", copied: "Kopyalandı", copyFailed: "Kopyalanamadı", screenshot: "Ekran Görüntüsü Modu", exitScreenshot: "Ekran Görüntüsü Modundan çık", close: "Kapat", privateShare: "Yalnızca türetilmiş özet; ham yanıt, tutar veya özel stres ayrıntısı yok.",
  },
  pl: {
    publicTitle: "Jaki jest Twój profil pieniędzy?", subtitle: "Zrozum swoją relację z pieniędzmi i to, co naprawdę może Ci pomóc.", metadataDescription: "Głęboka, nieoceniająca refleksja nad wzorcami pieniędzy, stresem i małymi krokami.", duration: "Około 12–18 min", depth: "Głęboka refleksja", noData: "Bez danych finansowych", cta: "Poznaj mój Money Profile", resume: "Kontynuuj", startAgain: "Zacznij od nowa", beforeTitle: "Zanim zaczniesz", trustIntro: "To nie jest test zasobności. Przyglądamy się wzorcom, znaczeniu i zmianom pod wpływem stresu.", noAskTitle: "Nie pytamy o", noAsk: ["dochód, saldo ani majątek", "kwoty zadłużenia ani scoring", "inwestycje ani połączenie z bankiem"], patternsTitle: "Przyglądamy się", patterns: ["co znaczą dla Ciebie pieniądze", "jak podejmujesz decyzje", "co zmienia stres", "jakie małe struktury mogą pasować"], noBank: "Bez połączenia z bankiem.", noAi: "Bez AI w czasie działania.", safetyBoundary: "Refleksja nad zachowaniami finansowymi; nie porada finansowa, inwestycyjna, podatkowa, kredytowa ani zadłużeniowa.", privacyLink: "Zobacz prywatność", localNotice: "Zapis lokalny na tym urządzeniu", contentLanguageNotice: "Interfejs funkcjonalny jest zlokalizowany. Niuanse pytań i interpretacji zachowują angielski tekst kanoniczny V1; redakcja native-speaker nastąpi przed wydaniem.", progress: "Postęp", remaining: "pozostało", back: "Wstecz", next: "Dalej", skip: "Pomiń", skipped: "Pominięto", startOver: "Od początku", resetConfirm: "Usunąć lokalny postęp i zacząć od nowa?", chooseOne: "Wybierz jedną", chooseSeveral: "Wybierz kilka", selected: "wybrano", calibrationEyebrow: "Kalibracja", calibrationTitle: "Czy to brzmi jak Ty?", calibrationBody: "Hipotezy wynikają wyłącznie z odpowiedzi i nie mogą tworzyć dowodów.", veryTrue: "Bardzo trafne", partly: "Częściowo", notReally: "Raczej nie", connecting: "Łączenie wzorców", revealTitle: "Twój Money Profile jest gotowy.", revealBody: "To nie werdykt ani wynik kondycji finansowej, lecz mapa do sprawdzenia.", reveal: "Zobacz wynik", closing: "To nie ocena tego, jak dobrze radzisz sobie z pieniędzmi, lecz mapa wzorców w odpowiedziach.", boundaryShort: "Money Profile nie jest poradą finansową, inwestycyjną, podatkową, kredytową ani zadłużeniową.", ...sharedEnglish, shareTitle: "Wybierz bezpieczną treść", shareBody: "Ty wybierasz zawartość; prywatne szczegóły stresu pozostają domyślnie ukryte.", format: "Format", copyText: "Kopiuj tekst i link", copied: "Skopiowano", copyFailed: "Kopiowanie nie powiodło się", screenshot: "Tryb zrzutu", exitScreenshot: "Wyjdź z trybu zrzutu", close: "Zamknij", privateShare: "Tylko podsumowanie; bez surowych odpowiedzi, kwot i prywatnych szczegółów.",
  },
  el: {
    publicTitle: "Ποιο είναι το προφίλ σου με τα χρήματα;", subtitle: "Κατανόησε τη σχέση σου με τα χρήματα και τι μπορεί πραγματικά να βοηθήσει.", metadataDescription: "Βαθιά, μη επικριτική αναστοχαστική εμπειρία για μοτίβα χρημάτων, άγχος και μικρά βήματα.", duration: "Περίπου 12–18 λεπτά", depth: "Βαθύς αναστοχασμός", noData: "Δεν απαιτούνται οικονομικά δεδομένα", cta: "Εξερεύνηση του Money Profile μου", resume: "Συνέχεια", startAgain: "Νέα αρχή", beforeTitle: "Πριν ξεκινήσεις", trustIntro: "Δεν είναι τεστ για το πόσα χρήματα έχεις. Εξετάζει μοτίβα, νόημα και αλλαγές υπό πίεση.", noAskTitle: "Δεν ρωτάμε για", noAsk: ["εισόδημα, υπόλοιπα ή καθαρή αξία", "ποσά χρέους ή πιστωτικό σκορ", "επενδύσεις ή σύνδεση τράπεζας"], patternsTitle: "Εξετάζουμε", patterns: ["τι σημαίνουν τα χρήματα για εσένα", "πώς αποφασίζεις", "τι αλλάζει υπό πίεση", "ποιες μικρές δομές ίσως ταιριάζουν"], noBank: "Χωρίς σύνδεση τράπεζας.", noAi: "Χωρίς AI κατά τη λειτουργία.", safetyBoundary: "Αναστοχασμός οικονομικής συμπεριφοράς· όχι οικονομική, επενδυτική, φορολογική, πιστωτική ή συμβουλή χρέους.", privacyLink: "Δες το απόρρητο", localNotice: "Τοπική αποθήκευση σε αυτή τη συσκευή", contentLanguageNotice: "Η λειτουργική διεπαφή είναι μεταφρασμένη. Οι λεπτές ερωτήσεις και ερμηνείες διατηρούν το αγγλικό κανονικό κείμενο V1· έλεγχος φυσικού ομιλητή θα γίνει πριν την κυκλοφορία.", progress: "Πρόοδος", remaining: "απομένουν", back: "Πίσω", next: "Επόμενο", skip: "Παράλειψη", skipped: "Παραλείφθηκε", startOver: "Από την αρχή", resetConfirm: "Διαγραφή τοπικής προόδου και νέα αρχή;", chooseOne: "Επίλεξε ένα", chooseSeveral: "Επίλεξε περισσότερα", selected: "επιλέχθηκαν", calibrationEyebrow: "Βαθμονόμηση", calibrationTitle: "Σου ταιριάζει;", calibrationBody: "Οι υποθέσεις προέρχονται μόνο από τις απαντήσεις και δεν δημιουργούν στοιχεία.", veryTrue: "Πολύ αληθινό", partly: "Εν μέρει", notReally: "Όχι πραγματικά", connecting: "Σύνδεση μοτίβων", revealTitle: "Το Money Profile σου είναι έτοιμο.", revealBody: "Όχι ετυμηγορία ή οικονομικό σκορ, αλλά χάρτης για δοκιμή.", reveal: "Δες το αποτέλεσμα", closing: "Δεν είναι κρίση για το πόσο καλά τα πας με τα χρήματα, αλλά χάρτης μοτίβων στις απαντήσεις.", boundaryShort: "Το Money Profile δεν είναι οικονομική, επενδυτική, φορολογική, πιστωτική ή συμβουλή χρέους.", ...sharedEnglish, shareTitle: "Επίλεξε ασφαλές περιεχόμενο", shareBody: "Εσύ αποφασίζεις τι εμφανίζεται· οι ιδιωτικές λεπτομέρειες άγχους μένουν εκτός.", format: "Μορφή", copyText: "Αντιγραφή κειμένου και συνδέσμου", copied: "Αντιγράφηκε", copyFailed: "Αποτυχία αντιγραφής", screenshot: "Λειτουργία στιγμιότυπου", exitScreenshot: "Έξοδος από στιγμιότυπο", close: "Κλείσιμο", privateShare: "Μόνο παράγωγη σύνοψη· χωρίς απαντήσεις, ποσά ή ιδιωτικές λεπτομέρειες.",
  },
  ru: {
    publicTitle: "Каков ваш денежный профиль?", subtitle: "Поймите свои отношения с деньгами и что действительно может помочь.", metadataDescription: "Глубокая, неосуждающая рефлексия о денежных паттернах, стрессе и небольших шагах.", duration: "Около 12–18 мин", depth: "Глубокая рефлексия", noData: "Финансовые данные не нужны", cta: "Изучить мой Money Profile", resume: "Продолжить", startAgain: "Начать заново", beforeTitle: "Перед началом", trustIntro: "Это не тест на количество денег. Он рассматривает паттерны, смысл и изменения под стрессом.", noAskTitle: "Мы не спрашиваем", noAsk: ["доход, баланс или капитал", "суммы долгов или кредитный рейтинг", "инвестиции или подключение банка"], patternsTitle: "Мы рассматриваем", patterns: ["что для вас значат деньги", "как вы принимаете решения", "что меняется под стрессом", "какие небольшие структуры могут подойти"], noBank: "Без подключения банка.", noAi: "Без ИИ во время работы.", safetyBoundary: "Рефлексия о финансовом поведении; не финансовая, инвестиционная, налоговая, кредитная или долговая консультация.", privacyLink: "О приватности", localNotice: "Хранится локально на этом устройстве", contentLanguageNotice: "Функциональный интерфейс локализован. Нюансированные вопросы и интерпретации сохраняют английский канонический текст V1; редактура носителем языка запланирована до релиза.", progress: "Прогресс", remaining: "осталось", back: "Назад", next: "Далее", skip: "Пропустить", skipped: "Пропущено", startOver: "Начать заново", resetConfirm: "Удалить локальный прогресс и начать заново?", chooseOne: "Выберите один вариант", chooseSeveral: "Выберите несколько", selected: "выбрано", calibrationEyebrow: "Калибровка", calibrationTitle: "Это похоже на вас?", calibrationBody: "Гипотезы основаны только на ответах и не могут создавать доказательства.", veryTrue: "Очень похоже", partly: "Отчасти", notReally: "Не совсем", connecting: "Связываем паттерны", revealTitle: "Ваш Money Profile готов.", revealBody: "Не приговор и не финансовый рейтинг, а карта для проверки.", reveal: "Посмотреть результат", closing: "Это не оценка того, насколько хорошо вы обращаетесь с деньгами, а карта паттернов в ответах.", boundaryShort: "Money Profile не является финансовой, инвестиционной, налоговой, кредитной или долговой консультацией.", ...sharedEnglish, shareTitle: "Выберите безопасное содержание", shareBody: "Вы решаете, что попадёт на карточку; личные детали стресса скрыты по умолчанию.", format: "Формат", copyText: "Копировать текст и ссылку", copied: "Скопировано", copyFailed: "Не удалось скопировать", screenshot: "Режим снимка", exitScreenshot: "Выйти из режима снимка", close: "Закрыть", privateShare: "Только итоговая сводка; без ответов, сумм и личных деталей.",
  },
};

export function getMoneyProfileUiCopy(locale: Locale): MoneyProfileUiCopy {
  return dictionaries[locale];
}
