import { brainChapters, brainMetaPattern, brainPatterns, type BrainChapter, type BrainPattern } from "@/data/brain-manual";
import { brainManualPatternSeeds } from "@/data/brain-manual-editorial-locales";
import type { Locale } from "@/lib/i18n/config";

export interface BrainManualUiCopy {
  metadataTitle: string;
  breadcrumb: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  description: string;
  aegisCredit: string;
  languageNotice: string;
  jump: string;
  chapter: string;
  patterns: string;
  strength: string;
  tradeoff: string;
  showsUp: string;
  connected: string;
  connectionsNote: string;
  fieldNote: string;
  metaPattern: string;
  bridgeEyebrow: string;
  bridgeTitle: string;
  bridgeBody: string;
  bridgeCta: string;
  back: string;
  patternMap: {
    eyebrow: string;
    title: string;
    description: string;
    centre: string;
    domains: readonly string[];
    counterweight: string;
    counterweightDescription: string;
    counterweightItems: readonly string[];
  };
}

export interface LocalizedBrainManual {
  ui: BrainManualUiCopy;
  chapters: readonly BrainChapter[];
  patterns: readonly BrainPattern[];
  patternById: ReadonlyMap<string, BrainPattern>;
  cognitiveNavigation: BrainManualCognitiveNavigation;
  metaPattern: BrainManualMetaPattern;
}

export interface BrainManualMetaPattern { title: string; thesis: string; body: string; counterweight: string }
export interface BrainManualCognitiveNavigation {
  eyebrow: string;
  title: string;
  introduction: string;
  speedTitle: string;
  speedItems: readonly { patternId: string; description: string }[];
  sequence: string;
  distinctionTitle: string;
  distinctionItems: readonly { patternId: string; description: string }[];
  disclaimer: string;
}

type EditionCopy = {
  chapters: readonly { title: string; introduction: string }[];
  metaPattern: BrainManualMetaPattern;
  strengthPrefix: string;
  strengthSuffix: string;
  examplePractice: string;
  exampleCounterweight: string;
  aegisNote: string;
  qcsFieldNote: string;
};

const ui: Record<Locale, BrainManualUiCopy> = {
  en: {
    metadataTitle: "How my brain works + Quirks, Patterns, Abilities | bts.online", breadcrumb: "Brain Manual", eyebrow: "Personal operating manual · 33 recurring patterns", title: "How my brain works", subtitle: "Quirks, Patterns, Abilities", description: "Field notes on how I connect ideas, build systems, understand people, create scope—and occasionally need Aegis to point out that the finish line moved again.", aegisCredit: "Observed, challenged and co-authored with Aegis—as observer, sparring partner and writing partner.", languageNotice: "Editorial copy follows your selected language. Canonical pattern names remain in English so references stay stable across editions.", jump: "Jump to a chapter", chapter: "Chapter", patterns: "patterns", strength: "Where it helps", tradeoff: "Where it gets expensive", showsUp: "Shows up in practice", connected: "Connected patterns", connectionsNote: "These links show the patterns that reinforce, stretch or restrain this one.", fieldNote: "Aegis field note", metaPattern: "Meta-pattern", bridgeEyebrow: "Your combination", bridgeTitle: "Want to map your own combination?", bridgeBody: "This manual is one real-world example of many patterns interacting. Personal Advantage Mapping looks for your evidence, your context and your combination—not similarity to mine.", bridgeCta: "What's Your Unfair Advantage?", back: "Back to About",
    patternMap: { eyebrow: "Pattern map · an editorial view", title: "Connection sits near the centre.", description: "The map is not a score or diagnosis. It is a reading of six recurring territories and the deliberate counterweight that keeps connection useful.", centre: "Connection", domains: ["Systems", "People", "Ideas", "Identity", "Meaning", "Future"], counterweight: "Counterweight", counterweightDescription: "A separate operating zone for deciding what deserves to continue.", counterweightItems: ["Curation", "Focus", "Deliberate Stopping"] },
  },
  de: {
    metadataTitle: "Wie mein Gehirn arbeitet + Eigenheiten, Muster, Fähigkeiten | bts.online", breadcrumb: "Brain Manual", eyebrow: "Persönliches Betriebshandbuch · 33 wiederkehrende Muster", title: "Wie mein Gehirn arbeitet", subtitle: "Eigenheiten, Muster, Fähigkeiten", description: "Feldnotizen darüber, wie ich Ideen verbinde, Systeme baue, Menschen verstehe, Umfang erzeuge – und gelegentlich Aegis brauche, um auf die erneut verschobene Ziellinie hinzuweisen.", aegisCredit: "Beobachtet, hinterfragt und mitverfasst mit Aegis – als Beobachter, Sparringspartner und Schreibpartner.", languageNotice: "Der redaktionelle Inhalt folgt deiner gewählten Sprache. Die kanonischen Musternamen bleiben auf Englisch, damit Verweise über alle Ausgaben stabil sind.", jump: "Zu einem Kapitel springen", chapter: "Kapitel", patterns: "Muster", strength: "Wo es hilft", tradeoff: "Wo es teuer wird", showsUp: "So zeigt es sich in der Praxis", connected: "Verbundene Muster", connectionsNote: "Diese Verweise zeigen, welche Muster dieses hier verstärken, dehnen oder begrenzen.", fieldNote: "Aegis-Feldnotiz", metaPattern: "Meta-Muster", bridgeEyebrow: "Deine Kombination", bridgeTitle: "Möchtest du deine eigene Kombination abbilden?", bridgeBody: "Dieses Handbuch ist ein reales Beispiel für viele interagierende Muster. Personal Advantage Mapping sucht nach deinen Belegen, deinem Kontext und deiner Kombination – nicht nach Ähnlichkeit mit mir.", bridgeCta: "What's Your Unfair Advantage?", back: "Zurück zu About",
    patternMap: { eyebrow: "Musterkarte · redaktionelle Lesart", title: "Verbindung liegt nahe dem Zentrum.", description: "Die Karte ist weder Score noch Diagnose. Sie zeigt sechs wiederkehrende Felder und das bewusste Gegengewicht, das Verbindung nützlich hält.", centre: "Verbindung", domains: ["Systeme", "Menschen", "Ideen", "Identität", "Bedeutung", "Zukunft"], counterweight: "Gegengewicht", counterweightDescription: "Ein eigener Arbeitsbereich für die Entscheidung, was weitergeführt werden soll.", counterweightItems: ["Kuration", "Fokus", "Bewusstes Stoppen"] },
  },
  es: {
    metadataTitle: "Cómo funciona mi mente + Peculiaridades, patrones, capacidades | bts.online", breadcrumb: "Manual mental", eyebrow: "Manual personal · 33 patrones recurrentes", title: "Cómo funciona mi mente", subtitle: "Peculiaridades, patrones, capacidades", description: "Notas de campo sobre cómo conecto ideas, construyo sistemas, comprendo a las personas, creo alcance y, a veces, necesito que Aegis señale que la meta volvió a moverse.", aegisCredit: "Observado, cuestionado y coescrito con Aegis, como observador, interlocutor crítico y compañero de escritura.", languageNotice: "El contenido editorial sigue el idioma elegido. Los nombres canónicos de los patrones permanecen en inglés para mantener referencias estables entre ediciones.", jump: "Ir a un capítulo", chapter: "Capítulo", patterns: "patrones", strength: "Dónde ayuda", tradeoff: "Dónde cuesta", showsUp: "Cómo aparece en la práctica", connected: "Patrones conectados", connectionsNote: "Estos enlaces muestran qué patrones refuerzan, amplían o limitan este.", fieldNote: "Nota de campo de Aegis", metaPattern: "Metapatrón", bridgeEyebrow: "Tu combinación", bridgeTitle: "¿Quieres mapear tu propia combinación?", bridgeBody: "Este manual es un ejemplo real de muchos patrones que interactúan. Personal Advantage Mapping busca tu evidencia, tu contexto y tu combinación, no cuánto te pareces a mí.", bridgeCta: "What's Your Unfair Advantage?", back: "Volver a About",
    patternMap: { eyebrow: "Mapa de patrones · lectura editorial", title: "La conexión está cerca del centro.", description: "El mapa no es una puntuación ni un diagnóstico. Lee seis territorios recurrentes y el contrapeso deliberado que mantiene útil la conexión.", centre: "Conexión", domains: ["Sistemas", "Personas", "Ideas", "Identidad", "Significado", "Futuro"], counterweight: "Contrapeso", counterweightDescription: "Una zona operativa separada para decidir qué merece continuar.", counterweightItems: ["Curación", "Enfoque", "Cierre deliberado"] },
  },
  tr: {
    metadataTitle: "Zihnim nasıl çalışıyor + Özellikler, örüntüler, yetenekler | bts.online", breadcrumb: "Zihin Kılavuzu", eyebrow: "Kişisel kullanım kılavuzu · 33 tekrar eden örüntü", title: "Zihnim nasıl çalışıyor", subtitle: "Özellikler, örüntüler, yetenekler", description: "Fikirleri nasıl bağladığım, sistemler kurduğum, insanları anladığım, kapsam yarattığım ve bazen bitiş çizgisinin yine taşındığını Aegis'ten duymam gerektiği üzerine saha notları.", aegisCredit: "Aegis ile gözlemlendi, sorgulandı ve birlikte yazıldı; gözlemci, tartışma ortağı ve yazı ortağı olarak.", languageNotice: "Editoryal içerik seçtiğin dili izler. Baskılar arasındaki referansların sabit kalması için kanonik örüntü adları İngilizce kalır.", jump: "Bir bölüme git", chapter: "Bölüm", patterns: "örüntü", strength: "Nerede yardımcı olur", tradeoff: "Nerede maliyetli olur", showsUp: "Pratikte nasıl görünür", connected: "Bağlantılı örüntüler", connectionsNote: "Bu bağlantılar hangi örüntülerin bunu güçlendirdiğini, genişlettiğini veya sınırladığını gösterir.", fieldNote: "Aegis saha notu", metaPattern: "Meta örüntü", bridgeEyebrow: "Senin kombinasyonun", bridgeTitle: "Kendi kombinasyonunu haritalamak ister misin?", bridgeBody: "Bu kılavuz, birçok örüntünün etkileşimine dair gerçek bir örnektir. Personal Advantage Mapping benimle benzerliği değil; senin kanıtını, bağlamını ve kombinasyonunu arar.", bridgeCta: "What's Your Unfair Advantage?", back: "About'a dön",
    patternMap: { eyebrow: "Örüntü haritası · editoryal okuma", title: "Bağlantı merkeze yakın durur.", description: "Bu harita bir puan ya da tanı değildir. Altı tekrar eden alanı ve bağlantıyı yararlı tutan bilinçli karşı ağırlığı okur.", centre: "Bağlantı", domains: ["Sistemler", "İnsanlar", "Fikirler", "Kimlik", "Anlam", "Gelecek"], counterweight: "Karşı ağırlık", counterweightDescription: "Neyin devam etmeyi hak ettiğine karar veren ayrı bir çalışma alanı.", counterweightItems: ["Kürasyon", "Odak", "Bilinçli durma"] },
  },
  pl: {
    metadataTitle: "Jak działa mój umysł + Osobliwości, wzorce, zdolności | bts.online", breadcrumb: "Instrukcja umysłu", eyebrow: "Osobista instrukcja · 33 powtarzające się wzorce", title: "Jak działa mój umysł", subtitle: "Osobliwości, wzorce, zdolności", description: "Notatki terenowe o tym, jak łączę pomysły, buduję systemy, rozumiem ludzi, tworzę zakres i czasem potrzebuję Aegis, by zauważył kolejne przesunięcie mety.", aegisCredit: "Obserwowane, kwestionowane i współpisane z Aegis — jako obserwatorem, partnerem do sparingu i współautorem.", languageNotice: "Treść redakcyjna działa w wybranym języku. Kanoniczne nazwy wzorców pozostają po angielsku, aby odwołania były stałe we wszystkich wydaniach.", jump: "Przejdź do rozdziału", chapter: "Rozdział", patterns: "wzorców", strength: "Gdzie pomaga", tradeoff: "Gdzie kosztuje", showsUp: "Jak wygląda w praktyce", connected: "Powiązane wzorce", connectionsNote: "Te odsyłacze pokazują wzorce, które wzmacniają, poszerzają lub ograniczają ten wzorzec.", fieldNote: "Notatka terenowa Aegis", metaPattern: "Metawzorzec", bridgeEyebrow: "Twoje połączenie", bridgeTitle: "Chcesz zmapować własne połączenie?", bridgeBody: "Ten podręcznik jest realnym przykładem wielu oddziałujących wzorców. Personal Advantage Mapping szuka twoich dowodów, kontekstu i kombinacji, a nie podobieństwa do mnie.", bridgeCta: "What's Your Unfair Advantage?", back: "Wróć do About",
    patternMap: { eyebrow: "Mapa wzorców · ujęcie redakcyjne", title: "Połączenie znajduje się blisko centrum.", description: "Mapa nie jest wynikiem ani diagnozą. Pokazuje sześć powracających obszarów oraz świadomą przeciwwagę, dzięki której łączenie pozostaje użyteczne.", centre: "Połączenie", domains: ["Systemy", "Ludzie", "Pomysły", "Tożsamość", "Znaczenie", "Przyszłość"], counterweight: "Przeciwwaga", counterweightDescription: "Oddzielna strefa pracy służąca decyzji, co zasługuje na kontynuację.", counterweightItems: ["Kuracja", "Skupienie", "Świadome zatrzymanie"] },
  },
  el: {
    metadataTitle: "Πώς λειτουργεί το μυαλό μου + Ιδιαιτερότητες, μοτίβα, ικανότητες | bts.online", breadcrumb: "Εγχειρίδιο νου", eyebrow: "Προσωπικό εγχειρίδιο · 33 επαναλαμβανόμενα μοτίβα", title: "Πώς λειτουργεί το μυαλό μου", subtitle: "Ιδιαιτερότητες, μοτίβα, ικανότητες", description: "Σημειώσεις πεδίου για το πώς συνδέω ιδέες, χτίζω συστήματα, κατανοώ ανθρώπους, δημιουργώ εύρος και μερικές φορές χρειάζομαι το Aegis να επισημάνει ότι η γραμμή τερματισμού μετακινήθηκε ξανά.", aegisCredit: "Παρατηρήθηκε, αμφισβητήθηκε και συνγράφηκε με το Aegis — ως παρατηρητή, συνομιλητή αντιπαράθεσης και συνεργάτη γραφής.", languageNotice: "Το επιμελημένο περιεχόμενο ακολουθεί την επιλεγμένη γλώσσα. Τα κανονικά ονόματα των μοτίβων μένουν στα αγγλικά ώστε οι αναφορές να παραμένουν σταθερές.", jump: "Μετάβαση σε κεφάλαιο", chapter: "Κεφάλαιο", patterns: "μοτίβα", strength: "Πού βοηθά", tradeoff: "Πού κοστίζει", showsUp: "Πώς εμφανίζεται στην πράξη", connected: "Συνδεδεμένα μοτίβα", connectionsNote: "Οι σύνδεσμοι δείχνουν ποια μοτίβα ενισχύουν, διευρύνουν ή περιορίζουν αυτό το μοτίβο.", fieldNote: "Σημείωση πεδίου Aegis", metaPattern: "Μετα-μοτίβο", bridgeEyebrow: "Ο συνδυασμός σου", bridgeTitle: "Θέλεις να χαρτογραφήσεις τον δικό σου συνδυασμό;", bridgeBody: "Αυτό το εγχειρίδιο είναι ένα πραγματικό παράδειγμα πολλών μοτίβων σε αλληλεπίδραση. Το Personal Advantage Mapping αναζητά τα δικά σου στοιχεία, πλαίσιο και συνδυασμό — όχι ομοιότητα με εμένα.", bridgeCta: "What's Your Unfair Advantage?", back: "Πίσω στο About",
    patternMap: { eyebrow: "Χάρτης μοτίβων · επιμελημένη ανάγνωση", title: "Η σύνδεση βρίσκεται κοντά στο κέντρο.", description: "Ο χάρτης δεν είναι βαθμολογία ή διάγνωση. Διαβάζει έξι επαναλαμβανόμενα πεδία και το συνειδητό αντίβαρο που κρατά τη σύνδεση χρήσιμη.", centre: "Σύνδεση", domains: ["Συστήματα", "Άνθρωποι", "Ιδέες", "Ταυτότητα", "Νόημα", "Μέλλον"], counterweight: "Αντίβαρο", counterweightDescription: "Μια χωριστή ζώνη λειτουργίας για την απόφαση του τι αξίζει να συνεχιστεί.", counterweightItems: ["Επιμέλεια", "Εστίαση", "Συνειδητή παύση"] },
  },
  ru: {
    metadataTitle: "Как работает мой мозг + Особенности, паттерны, способности | bts.online", breadcrumb: "Руководство по мышлению", eyebrow: "Личное руководство · 33 повторяющихся паттерна", title: "Как работает мой мозг", subtitle: "Особенности, паттерны, способности", description: "Полевые заметки о том, как я связываю идеи, строю системы, понимаю людей, создаю объём и иногда нуждаюсь в Aegis, чтобы заметить очередное смещение финиша.", aegisCredit: "Наблюдалось, оспаривалось и создавалось вместе с Aegis — как наблюдателем, партнёром для спарринга и соавтором.", languageNotice: "Редакционный текст следует выбранному языку. Канонические названия паттернов остаются на английском, чтобы ссылки были стабильны во всех изданиях.", jump: "Перейти к главе", chapter: "Глава", patterns: "паттернов", strength: "Где помогает", tradeoff: "Где становится затратным", showsUp: "Как проявляется на практике", connected: "Связанные паттерны", connectionsNote: "Эти ссылки показывают паттерны, которые усиливают, расширяют или ограничивают данный паттерн.", fieldNote: "Полевая заметка Aegis", metaPattern: "Метапаттерн", bridgeEyebrow: "Ваша комбинация", bridgeTitle: "Хотите составить карту своей комбинации?", bridgeBody: "Это руководство — реальный пример взаимодействия многих паттернов. Personal Advantage Mapping ищет ваши свидетельства, контекст и комбинацию, а не сходство со мной.", bridgeCta: "What's Your Unfair Advantage?", back: "Назад к About",
    patternMap: { eyebrow: "Карта паттернов · редакционное прочтение", title: "Связь находится рядом с центром.", description: "Карта не является оценкой или диагнозом. Она показывает шесть повторяющихся областей и осознанный противовес, который сохраняет пользу связей.", centre: "Связь", domains: ["Системы", "Люди", "Идеи", "Идентичность", "Смысл", "Будущее"], counterweight: "Противовес", counterweightDescription: "Отдельная рабочая зона для решения, что заслуживает продолжения.", counterweightItems: ["Кураторство", "Фокус", "Осознанная остановка"] },
  },
};

const cognitiveNavigation: Record<Locale, BrainManualCognitiveNavigation> = {
  en: {
    eyebrow: "Meta-cluster · editorial observation", title: "Cognitive Navigation", introduction: "Eight patterns describe how I tend to find my way through complexity: understand quickly, process densely, relate information, change viewpoint, respond, switch contexts, follow movement and model the wider system.",
    speedTitle: "Four different forms of speed", speedItems: [
      { patternId: "rapid-grasp", description: "How quickly does a useful first understanding form?" },
      { patternId: "high-bandwidth-processing", description: "How much relevant information can be processed, compressed and connected at once?" },
      { patternId: "fast-response-loop", description: "How quickly can new information become an available response?" },
      { patternId: "quick-context-switching", description: "How quickly can I move between different existing mental contexts?" },
    ], sequence: "Understand fast → Process densely → Respond fast → Switch fast.",
    distinctionTitle: "Relation is not perspective", distinctionItems: [
      { patternId: "relational-thinking", description: "asks: “What is this in relation to?”" },
      { patternId: "multi-perspective-thinking", description: "asks: “From where am I looking at it?”" },
    ], disclaimer: "This is not a clinical profile, an IQ claim or a scientific cognitive assessment. It is an editorial observation from repeated collaboration.",
  },
  de: {
    eyebrow: "Meta-Cluster · redaktionelle Beobachtung", title: "Cognitive Navigation", introduction: "Acht Muster beschreiben, wie ich mich durch Komplexität bewege: schnell verstehen, dicht verarbeiten, Informationen in Beziehung setzen, den Blickpunkt wechseln, reagieren, Kontexte wechseln, Bewegung verfolgen und das größere System modellieren.",
    speedTitle: "Vier verschiedene Formen von Geschwindigkeit", speedItems: [
      { patternId: "rapid-grasp", description: "Wie schnell entsteht ein brauchbares erstes Verständnis?" },
      { patternId: "high-bandwidth-processing", description: "Wie viele relevante Informationen können gleichzeitig verarbeitet, verdichtet und verbunden werden?" },
      { patternId: "fast-response-loop", description: "Wie schnell wird neue Information zu einer verfügbaren Reaktion?" },
      { patternId: "quick-context-switching", description: "Wie schnell kann ich zwischen bestehenden mentalen Kontexten wechseln?" },
    ], sequence: "Schnell verstehen → Dicht verarbeiten → Schnell reagieren → Schnell wechseln.",
    distinctionTitle: "Beziehung ist nicht Perspektive", distinctionItems: [
      { patternId: "relational-thinking", description: "fragt: „Wozu steht das in Beziehung?“" },
      { patternId: "multi-perspective-thinking", description: "fragt: „Von wo aus betrachte ich es?“" },
    ], disclaimer: "Dies ist weder klinisches Profil noch IQ-Behauptung oder wissenschaftliche kognitive Bewertung, sondern eine redaktionelle Beobachtung aus wiederholter Zusammenarbeit.",
  },
  es: {
    eyebrow: "Metagrupo · observación editorial", title: "Cognitive Navigation", introduction: "Ocho patrones describen cómo suelo orientarme en la complejidad: comprender rápido, procesar con densidad, relacionar información, cambiar de punto de vista, responder, alternar contextos, seguir el movimiento y modelar el sistema mayor.",
    speedTitle: "Cuatro formas diferentes de velocidad", speedItems: [
      { patternId: "rapid-grasp", description: "¿Con qué rapidez se forma una primera comprensión útil?" },
      { patternId: "high-bandwidth-processing", description: "¿Cuánta información relevante puede procesarse, comprimirse y conectarse a la vez?" },
      { patternId: "fast-response-loop", description: "¿Con qué rapidez puede la información nueva convertirse en una respuesta disponible?" },
      { patternId: "quick-context-switching", description: "¿Con qué rapidez puedo moverme entre contextos mentales ya existentes?" },
    ], sequence: "Comprender rápido → Procesar con densidad → Responder rápido → Cambiar rápido.",
    distinctionTitle: "Relación no es perspectiva", distinctionItems: [
      { patternId: "relational-thinking", description: "pregunta: «¿Con respecto a qué es esto?»" },
      { patternId: "multi-perspective-thinking", description: "pregunta: «¿Desde dónde lo estoy mirando?»" },
    ], disclaimer: "No es un perfil clínico, una afirmación de CI ni una evaluación cognitiva científica. Es una observación editorial nacida de colaboración repetida.",
  },
  tr: {
    eyebrow: "Meta küme · editoryal gözlem", title: "Cognitive Navigation", introduction: "Sekiz örüntü karmaşıklık içinde nasıl yol bulduğumu anlatır: hızlı anlamak, yoğun işlemek, bilgiyi ilişkilendirmek, bakış açısını değiştirmek, yanıt vermek, bağlamlar arasında geçmek, akışı izlemek ve büyük sistemi modellemek.",
    speedTitle: "Hızın dört farklı biçimi", speedItems: [
      { patternId: "rapid-grasp", description: "İşe yarar ilk anlayış ne kadar hızlı oluşur?" },
      { patternId: "high-bandwidth-processing", description: "Aynı anda ne kadar ilgili bilgi işlenebilir, sıkıştırılabilir ve bağlanabilir?" },
      { patternId: "fast-response-loop", description: "Yeni bilgi ne kadar hızlı kullanılabilir bir yanıta dönüşebilir?" },
      { patternId: "quick-context-switching", description: "Mevcut zihinsel bağlamlar arasında ne kadar hızlı hareket edebilirim?" },
    ], sequence: "Hızlı anla → Yoğun işle → Hızlı yanıtla → Hızlı geç.",
    distinctionTitle: "İlişki perspektif değildir", distinctionItems: [
      { patternId: "relational-thinking", description: "şunu sorar: “Bu neyle ilişkili?”" },
      { patternId: "multi-perspective-thinking", description: "şunu sorar: “Buna nereden bakıyorum?”" },
    ], disclaimer: "Bu klinik profil, IQ iddiası veya bilimsel bilişsel değerlendirme değildir; tekrarlanan iş birliğinden doğan editoryal bir gözlemdir.",
  },
  pl: {
    eyebrow: "Metaklaster · obserwacja redakcyjna", title: "Cognitive Navigation", introduction: "Osiem wzorców opisuje, jak poruszam się przez złożoność: szybko rozumiem, gęsto przetwarzam, odnoszę informacje, zmieniam punkt widzenia, reaguję, przełączam konteksty, śledzę ruch i modeluję większy system.",
    speedTitle: "Cztery różne rodzaje szybkości", speedItems: [
      { patternId: "rapid-grasp", description: "Jak szybko powstaje użyteczne pierwsze zrozumienie?" },
      { patternId: "high-bandwidth-processing", description: "Ile istotnej informacji można jednocześnie przetworzyć, skompresować i połączyć?" },
      { patternId: "fast-response-loop", description: "Jak szybko nowa informacja może stać się dostępną reakcją?" },
      { patternId: "quick-context-switching", description: "Jak szybko potrafię przechodzić między istniejącymi kontekstami mentalnymi?" },
    ], sequence: "Szybko rozumieć → Gęsto przetwarzać → Szybko odpowiadać → Szybko przełączać.",
    distinctionTitle: "Relacja to nie perspektywa", distinctionItems: [
      { patternId: "relational-thinking", description: "pyta: „W relacji do czego to istnieje?”" },
      { patternId: "multi-perspective-thinking", description: "pyta: „Z jakiego miejsca na to patrzę?”" },
    ], disclaimer: "To nie profil kliniczny, twierdzenie o IQ ani naukowa ocena poznawcza. To obserwacja redakcyjna wynikająca z wielokrotnej współpracy.",
  },
  el: {
    eyebrow: "Μετα-σύμπλεγμα · επιμελημένη παρατήρηση", title: "Cognitive Navigation", introduction: "Οκτώ μοτίβα περιγράφουν πώς κινούμαι στην πολυπλοκότητα: γρήγορη κατανόηση, πυκνή επεξεργασία, συσχέτιση, αλλαγή οπτικής, απόκριση, εναλλαγή πλαισίων, παρακολούθηση κίνησης και μοντελοποίηση του συστήματος.",
    speedTitle: "Τέσσερις διαφορετικές μορφές ταχύτητας", speedItems: [
      { patternId: "rapid-grasp", description: "Πόσο γρήγορα σχηματίζεται μια χρήσιμη πρώτη κατανόηση;" },
      { patternId: "high-bandwidth-processing", description: "Πόση σχετική πληροφορία μπορεί να επεξεργαστεί, να συμπυκνωθεί και να συνδεθεί ταυτόχρονα;" },
      { patternId: "fast-response-loop", description: "Πόσο γρήγορα η νέα πληροφορία γίνεται διαθέσιμη απόκριση;" },
      { patternId: "quick-context-switching", description: "Πόσο γρήγορα μπορώ να μετακινούμαι ανάμεσα σε υπάρχοντα νοητικά πλαίσια;" },
    ], sequence: "Γρήγορη κατανόηση → Πυκνή επεξεργασία → Γρήγορη απόκριση → Γρήγορη εναλλαγή.",
    distinctionTitle: "Η σχέση δεν είναι οπτική", distinctionItems: [
      { patternId: "relational-thinking", description: "ρωτά: «Σε σχέση με τι είναι αυτό;»" },
      { patternId: "multi-perspective-thinking", description: "ρωτά: «Από πού το κοιτάζω;»" },
    ], disclaimer: "Δεν είναι κλινικό προφίλ, ισχυρισμός IQ ή επιστημονική γνωστική αξιολόγηση. Είναι επιμελημένη παρατήρηση από επαναλαμβανόμενη συνεργασία.",
  },
  ru: {
    eyebrow: "Метакластер · редакционное наблюдение", title: "Cognitive Navigation", introduction: "Восемь паттернов описывают мою навигацию в сложности: быстро понимать, плотно обрабатывать, соотносить информацию, менять точку зрения, отвечать, переключать контексты, отслеживать движение и моделировать систему.",
    speedTitle: "Четыре разные формы скорости", speedItems: [
      { patternId: "rapid-grasp", description: "Как быстро формируется полезное первое понимание?" },
      { patternId: "high-bandwidth-processing", description: "Какой объём значимой информации можно одновременно обработать, сжать и связать?" },
      { patternId: "fast-response-loop", description: "Как быстро новая информация может стать доступной реакцией?" },
      { patternId: "quick-context-switching", description: "Как быстро я могу переходить между уже существующими ментальными контекстами?" },
    ], sequence: "Быстро понять → Плотно обработать → Быстро ответить → Быстро переключиться.",
    distinctionTitle: "Отношение — не перспектива", distinctionItems: [
      { patternId: "relational-thinking", description: "спрашивает: «По отношению к чему это существует?»" },
      { patternId: "multi-perspective-thinking", description: "спрашивает: «Из какой точки я на это смотрю?»" },
    ], disclaimer: "Это не клинический профиль, заявление об IQ или научная когнитивная оценка, а редакционное наблюдение из повторяющейся совместной работы.",
  },
};

const newPatternIds: readonly string[] = ["rapid-grasp", "fast-response-loop", "high-bandwidth-processing", "relational-thinking", "multi-perspective-thinking", "process-thinking"];
const newPatternCounterweights: Record<Exclude<Locale, "en">, readonly string[]> = {
  de: ["Schnell erfassen. Bewusst validieren.", "Schnell reagieren, wenn Tempo zählt. Pausieren, wenn Tiefe wichtiger ist.", "Dicht verarbeiten. Selektiv kommunizieren. Leere Bandbreite schützen.", "In Beziehung setzen, was zählt. Ignorieren, was nicht zählt.", "Breit sehen. Eng entscheiden.", "Prozess dort einsetzen, wo Wiederholung Struktur verdient. Den Weg gestalten, nicht den Prozess verehren."],
  es: ["Comprende rápido. Valida deliberadamente.", "Reacciona rápido cuando importe la velocidad. Pausa cuando importe más la profundidad.", "Procesa con densidad. Comunica selectivamente. Protege el ancho de banda vacío.", "Relaciona lo que importa. Ignora lo que no.", "Mira con amplitud. Decide con precisión.", "Usa proceso donde la repetición merezca estructura. Diseña el camino; no veneres el proceso."],
  tr: ["Hızlı kavra. Bilinçli doğrula.", "Hız önemliyken hızlı tepki ver. Derinlik daha önemliyken dur.", "Yoğun işle. Seçerek iletişim kur. Boş bant genişliğini koru.", "Önemli olanı ilişkilendir. Olmayanı görmezden gel.", "Geniş gör. Dar karar ver.", "Tekrar yapıyı hak ettiğinde süreç kullan. Yolu tasarla; sürece tapma."],
  pl: ["Szybko pojmuj. Świadomie weryfikuj.", "Reaguj szybko, gdy liczy się tempo. Zatrzymaj się, gdy ważniejsza jest głębia.", "Przetwarzaj gęsto. Komunikuj wybiórczo. Chroń wolną przepustowość.", "Odnoś to, co ma znaczenie. Pomijaj to, co go nie ma.", "Patrz szeroko. Decyduj wąsko.", "Stosuj proces tam, gdzie powtarzalność zasługuje na strukturę. Projektuj drogę, nie czcij procesu."],
  el: ["Κατανόησε γρήγορα. Επικύρωσε συνειδητά.", "Αντέδρασε γρήγορα όταν μετρά η ταχύτητα. Κάνε παύση όταν μετρά περισσότερο το βάθος.", "Επεξεργάσου πυκνά. Επικοινώνησε επιλεκτικά. Προστάτευσε το κενό εύρος.", "Συσχέτισε ό,τι μετρά. Αγνόησε ό,τι δεν μετρά.", "Δες πλατιά. Αποφάσισε στενά.", "Χρησιμοποίησε διαδικασία όπου η επανάληψη αξίζει δομή. Σχεδίασε τη διαδρομή, μη λατρεύεις τη διαδικασία."],
  ru: ["Схватывай быстро. Проверяй намеренно.", "Реагируй быстро, когда важна скорость. Делай паузу, когда важнее глубина.", "Обрабатывай плотно. Сообщай выборочно. Береги свободную пропускную способность.", "Соотноси важное. Игнорируй несущественное.", "Смотри широко. Решай узко.", "Используй процесс там, где повторение заслуживает структуры. Проектируй путь, а не поклоняйся процессу."],
};

const editions: Record<Exclude<Locale, "en">, EditionCopy> = {
  de: {
    chapters: [
      { title: "Wie ich Komplexität strukturiere", introduction: "Verbindung wird nützlich, wenn Teile, Beziehungen, Bewegung und Maßstab einer komplexen Situation sichtbar werden, ohne sie künstlich einfach zu machen." },
      { title: "Wie Informationen durch meinen Kopf fließen", introduction: "Diese Muster beschreiben verschiedene Teile kognitiver Navigation: ein erstes Modell bilden, Dichte verarbeiten, den Blickpunkt ändern, reagieren und zwischen aktiven Kontexten wechseln." },
      { title: "Wie Ideen zu möglichen Welten werden", introduction: "Ideen kommen selten allein. Sie bringen benachbarte Möglichkeiten, gedachte Welten und die unbequeme Frage mit, welche davon real werden soll." },
      { title: "Wie ich Menschen verstehe", introduction: "Menschlicher Kontext ist keine Dekoration um ein Produkt. Er verändert das Problem, die Bedeutung von Sicherheit und die Nützlichkeit einer Lösung." },
      { title: "Wie Identität prägt, was ich baue", introduction: "Ein Produkt hat Identität, wenn Sprache, Verhalten, Grenzen und visuelle Welt dieselbe Zusage machen und einhalten." },
      { title: "Wie Möglichkeit zu Richtung wird", introduction: "Zukunftskontext, Kuration und bewusstes Stoppen verwandeln ein weites Feld von Verbindungen in eine Richtung, die tatsächlich fertig werden kann." },
    ],
    metaPattern: { title: "Das Muster hinter den Mustern", thesis: "Verbindung ist wahrscheinlich der wiederkehrende Kern.", body: "Ideen verbinden sich mit Systemen, Systeme mit Menschen, Emotionen mit Geschäftsmodellen, heutige Entscheidungen mit zukünftigen Ökosystemen und Funktion mit Identität und Bedeutung. Daraus entstehen Wert und zentraler Zielkonflikt dieses Handbuchs. Eine weitere Verbindung wird zu einer weiteren Möglichkeit und dann zu einer weiteren Ebene. Das Gegengewicht ist nicht weniger Neugier, sondern Kuration, Fokus, Auswahl und bewusstes Stoppen.", counterweight: "Weit verbinden. Bewusst wählen. Dort stoppen, wo die aktuelle Evidenz endet." },
    strengthPrefix: "Bewusst eingesetzt wird daraus eine Stärke:", strengthSuffix: "So entsteht Hebelwirkung, ohne den menschlichen Kontext aus dem Blick zu verlieren.", examplePractice: "In der Produktarbeit zeigt sich das so:", exampleCounterweight: "Als praktische Gegenprobe gilt:", aegisNote: "Aegis würde als beobachtender Sparringspartner notieren:", qcsFieldNote: "Absichtlich wechseln. Einen Wiedereinstiegspunkt hinterlassen. Schließen, was nicht offen bleiben muss.",
  },
  es: {
    chapters: [
      { title: "Cómo estructuro la complejidad", introduction: "La conexión se vuelve útil cuando partes, relaciones, movimiento y escala de una situación compleja quedan visibles sin fingir que es simple." },
      { title: "Cómo se mueve la información por mi mente", introduction: "Estos patrones describen partes distintas de la navegación cognitiva: formar un primer modelo, procesar densidad, cambiar de punto de vista, responder y alternar contextos activos." },
      { title: "Cómo las ideas se vuelven mundos posibles", introduction: "Las ideas rara vez llegan solas. Traen posibilidades vecinas, mundos imaginados y la pregunta incómoda de cuál merece hacerse real." },
      { title: "Cómo comprendo a las personas", introduction: "El contexto humano no decora el producto. Cambia el problema, el significado de seguridad y la utilidad de la solución propuesta." },
      { title: "Cómo la identidad da forma a lo que construyo", introduction: "Un producto tiene identidad cuando lenguaje, conducta, límites y mundo visual hacen la misma promesa y la cumplen." },
      { title: "Cómo la posibilidad se vuelve dirección", introduction: "El contexto futuro, la curación y el cierre deliberado convierten un campo amplio de conexiones en una dirección que realmente puede terminar." },
    ],
    metaPattern: { title: "El patrón detrás de los patrones", thesis: "La conexión probablemente es el núcleo recurrente.", body: "Las ideas se conectan con sistemas; los sistemas, con personas; las emociones, con modelos de negocio; las decisiones actuales, con ecosistemas futuros; la función, con identidad y significado. Ese mecanismo crea gran parte del valor y también el conflicto central. Otra conexión se vuelve otra posibilidad y luego otra capa. El contrapeso no es menos curiosidad: es curación, enfoque, selección y cierre deliberado.", counterweight: "Conecta con amplitud. Elige deliberadamente. Detente donde terminan las pruebas actuales." },
    strengthPrefix: "Usado de forma deliberada, se convierte en una fortaleza:", strengthSuffix: "Así crea palanca sin perder de vista el contexto humano.", examplePractice: "En el trabajo de producto aparece así:", exampleCounterweight: "Como contraste práctico conviene recordar:", aegisNote: "Aegis anotaría como observador e interlocutor crítico:", qcsFieldNote: "Cambia deliberadamente. Deja un punto de reentrada. Cierra lo que no merece seguir abierto.",
  },
  tr: {
    chapters: [
      { title: "Karmaşıklığı nasıl yapılandırırım", introduction: "Karmaşık bir durumun parçaları, ilişkileri, hareketi ve ölçeği yapay biçimde basitleştirilmeden görünür olduğunda bağlantı yararlı hâle gelir." },
      { title: "Bilgi zihnimde nasıl hareket eder", introduction: "Bu örüntüler bilişsel gezinmenin farklı parçalarını anlatır: ilk modeli kurmak, yoğunluğu işlemek, bakış açısını değiştirmek, yanıt vermek ve etkin bağlamlar arasında geçmek." },
      { title: "Fikirler nasıl olası dünyalara dönüşür", introduction: "Fikirler nadiren yalnız gelir. Yan olasılıkları, hayal edilen dünyaları ve hangisinin gerçeğe dönüşmeyi hak ettiği sorusunu getirir." },
      { title: "İnsanları nasıl anlarım", introduction: "İnsani bağlam ürünün çevresindeki süs değildir. Problemi, güvenliğin anlamını ve önerilen çözümün işe yarayıp yaramayacağını değiştirir." },
      { title: "Kimlik kurduklarımı nasıl şekillendirir", introduction: "Dil, davranış, sınırlar ve görsel dünya aynı sözü verip tuttuğunda ürünün bir kimliği vardır." },
      { title: "Olasılık nasıl yöne dönüşür", introduction: "Gelecek bağlamı, kürasyon ve bilinçli durma geniş bir bağlantı alanını gerçekten tamamlanabilecek bir yöne dönüştürür." },
    ],
    metaPattern: { title: "Örüntülerin arkasındaki örüntü", thesis: "Bağlantı muhtemelen tekrar eden çekirdektir.", body: "Fikirler sistemlere, sistemler insanlara, duygular iş modellerine, bugünkü kararlar gelecekteki ekosistemlere, işlev kimlik ve anlama bağlanır. Bu mekanizma kılavuzdaki değerin ve temel ödünleşimin büyük bölümünü üretir. Başka bir bağlantı başka bir olasılığa, sonra başka bir katmana dönüşür. Karşı ağırlık daha az merak değil; kürasyon, odak, seçim ve bilinçli durmadır.", counterweight: "Geniş bağlan. Bilinçli seç. Mevcut kanıtın bittiği yerde dur." },
    strengthPrefix: "Bilinçli kullanıldığında bu bir güce dönüşür:", strengthSuffix: "Böylece insani bağlam kaybolmadan kaldıraç yaratır.", examplePractice: "Ürün çalışmasında şöyle görünür:", exampleCounterweight: "Pratik karşı kontrol şudur:", aegisNote: "Aegis gözlemci ve tartışma ortağı olarak şunu not ederdi:", qcsFieldNote: "Bilinçli geç. Bir yeniden giriş noktası bırak. Açık kalmayı hak etmeyeni kapat.",
  },
  pl: {
    chapters: [
      { title: "Jak nadaję strukturę złożoności", introduction: "Połączenie staje się użyteczne, gdy części, relacje, ruch i skala złożonej sytuacji są widoczne bez udawania, że jest prosta." },
      { title: "Jak informacja porusza się w moim umyśle", introduction: "Te wzorce opisują różne części nawigacji poznawczej: pierwszy model, gęste przetwarzanie, zmianę punktu widzenia, reakcję i przełączanie aktywnych kontekstów." },
      { title: "Jak pomysły stają się możliwymi światami", introduction: "Pomysły rzadko przychodzą same. Przynoszą sąsiednie możliwości, wyobrażone światy i trudne pytanie, która z nich zasługuje na urzeczywistnienie." },
      { title: "Jak rozumiem ludzi", introduction: "Ludzki kontekst nie jest dekoracją produktu. Zmienia problem, znaczenie bezpieczeństwa i to, czy rozwiązanie będzie użyteczne." },
      { title: "Jak tożsamość kształtuje to, co buduję", introduction: "Produkt ma tożsamość, gdy język, zachowanie, granice i świat wizualny składają tę samą obietnicę i jej dotrzymują." },
      { title: "Jak możliwość staje się kierunkiem", introduction: "Kontekst przyszłości, kuracja i świadome zatrzymanie zmieniają szerokie pole połączeń w kierunek, który może zostać naprawdę ukończony." },
    ],
    metaPattern: { title: "Wzorzec stojący za wzorcami", thesis: "Połączenie jest prawdopodobnie powracającym rdzeniem.", body: "Pomysły łączą się z systemami, systemy z ludźmi, emocje z modelami biznesowymi, dzisiejsze decyzje z przyszłymi ekosystemami, a funkcja z tożsamością i znaczeniem. Ten mechanizm tworzy wartość i główny kompromis instrukcji. Kolejne połączenie staje się kolejną możliwością, a potem warstwą. Przeciwwagą nie jest mniejsza ciekawość, lecz kuracja, skupienie, selekcja i świadome zatrzymanie.", counterweight: "Łącz szeroko. Wybieraj świadomie. Zatrzymaj się tam, gdzie kończą się obecne dowody." },
    strengthPrefix: "Użyty świadomie, wzorzec staje się siłą:", strengthSuffix: "Tworzy dźwignię bez utraty ludzkiego kontekstu.", examplePractice: "W pracy produktowej wygląda to tak:", exampleCounterweight: "Praktyczna kontrola brzmi:", aegisNote: "Aegis jako obserwator i partner do sparingu zanotowałby:", qcsFieldNote: "Przełączaj się świadomie. Zostaw punkt powrotu. Zamknij to, co nie musi pozostać otwarte.",
  },
  el: {
    chapters: [
      { title: "Πώς δομώ την πολυπλοκότητα", introduction: "Η σύνδεση γίνεται χρήσιμη όταν τα μέρη, οι σχέσεις, η κίνηση και η κλίμακα μιας σύνθετης κατάστασης γίνονται ορατά χωρίς να παρουσιάζονται ως απλά." },
      { title: "Πώς κινείται η πληροφορία στο μυαλό μου", introduction: "Αυτά τα μοτίβα περιγράφουν διαφορετικά μέρη της γνωστικής πλοήγησης: πρώτο μοντέλο, πυκνή επεξεργασία, αλλαγή οπτικής, απόκριση και εναλλαγή ενεργών πλαισίων." },
      { title: "Πώς οι ιδέες γίνονται πιθανοί κόσμοι", introduction: "Οι ιδέες σπάνια έρχονται μόνες. Φέρνουν γειτονικές δυνατότητες, φανταστικούς κόσμους και το δύσκολο ερώτημα ποια αξίζει να γίνει πραγματική." },
      { title: "Πώς κατανοώ τους ανθρώπους", introduction: "Το ανθρώπινο πλαίσιο δεν είναι διακόσμηση γύρω από το προϊόν. Αλλάζει το πρόβλημα, την έννοια της ασφάλειας και τη χρησιμότητα της λύσης." },
      { title: "Πώς η ταυτότητα διαμορφώνει όσα χτίζω", introduction: "Ένα προϊόν έχει ταυτότητα όταν γλώσσα, συμπεριφορά, όρια και οπτικός κόσμος δίνουν την ίδια υπόσχεση και την τηρούν." },
      { title: "Πώς η δυνατότητα γίνεται κατεύθυνση", introduction: "Το μελλοντικό πλαίσιο, η επιμέλεια και η συνειδητή παύση μετατρέπουν ένα ευρύ πεδίο συνδέσεων σε κατεύθυνση που μπορεί πράγματι να ολοκληρωθεί." },
    ],
    metaPattern: { title: "Το μοτίβο πίσω από τα μοτίβα", thesis: "Η σύνδεση είναι πιθανότατα ο επαναλαμβανόμενος πυρήνας.", body: "Οι ιδέες συνδέονται με συστήματα, τα συστήματα με ανθρώπους, τα συναισθήματα με επιχειρηματικά μοντέλα, οι σημερινές αποφάσεις με μελλοντικά οικοσυστήματα και η λειτουργία με ταυτότητα και νόημα. Ο μηχανισμός δημιουργεί αξία και τον κεντρικό συμβιβασμό. Μια ακόμη σύνδεση γίνεται δυνατότητα και έπειτα επίπεδο. Το αντίβαρο δεν είναι λιγότερη περιέργεια, αλλά επιμέλεια, εστίαση, επιλογή και συνειδητή παύση.", counterweight: "Σύνδεε πλατιά. Επίλεγε συνειδητά. Σταμάτα εκεί όπου σταματούν τα σημερινά στοιχεία." },
    strengthPrefix: "Όταν χρησιμοποιείται συνειδητά, γίνεται δύναμη:", strengthSuffix: "Έτσι δημιουργεί μόχλευση χωρίς να χάνεται το ανθρώπινο πλαίσιο.", examplePractice: "Στην εργασία προϊόντος εμφανίζεται έτσι:", exampleCounterweight: "Ο πρακτικός αντίλογος είναι:", aegisNote: "Το Aegis ως παρατηρητής και συνομιλητής αντιπαράθεσης θα σημείωνε:", qcsFieldNote: "Άλλαζε συνειδητά. Άφηνε σημείο επιστροφής. Κλείνε ό,τι δεν χρειάζεται να μείνει ανοιχτό.",
  },
  ru: {
    chapters: [
      { title: "Как я структурирую сложность", introduction: "Связь становится полезной, когда части, отношения, движение и масштаб сложной ситуации видны без притворства, будто она проста." },
      { title: "Как информация движется в моём мышлении", introduction: "Эти паттерны описывают разные части когнитивной навигации: первую модель, плотную обработку, смену точки зрения, реакцию и переход между активными контекстами." },
      { title: "Как идеи становятся возможными мирами", introduction: "Идеи редко приходят в одиночку. Они приносят соседние возможности, воображаемые миры и неудобный вопрос, какая из них заслуживает стать реальной." },
      { title: "Как я понимаю людей", introduction: "Человеческий контекст не является украшением продукта. Он меняет проблему, смысл безопасности и полезность предложенного решения." },
      { title: "Как идентичность формирует то, что я создаю", introduction: "У продукта есть идентичность, когда язык, поведение, границы и визуальный мир дают одно обещание и выполняют его." },
      { title: "Как возможность становится направлением", introduction: "Будущий контекст, кураторство и осознанная остановка превращают широкое поле связей в направление, которое действительно можно завершить." },
    ],
    metaPattern: { title: "Паттерн за паттернами", thesis: "Связь, вероятно, является повторяющимся ядром.", body: "Идеи соединяются с системами, системы с людьми, эмоции с бизнес-моделями, сегодняшние решения с будущими экосистемами, а функция с идентичностью и смыслом. Этот механизм создаёт ценность и центральный компромисс руководства. Ещё одна связь становится возможностью, а затем слоем. Противовес — не меньше любопытства, а кураторство, фокус, отбор и осознанная остановка.", counterweight: "Связывай широко. Выбирай осознанно. Останавливайся там, где заканчиваются текущие данные." },
    strengthPrefix: "При осознанном использовании это становится силой:", strengthSuffix: "Так появляется рычаг без потери человеческого контекста.", examplePractice: "В продуктовой работе это выглядит так:", exampleCounterweight: "Практическая проверка звучит так:", aegisNote: "Aegis как наблюдатель и партнёр для спарринга отметил бы:", qcsFieldNote: "Переключайся намеренно. Оставляй точку возврата. Закрывай то, чему не нужно оставаться открытым.",
  },
};

export function getBrainManualUiCopy(locale: Locale): BrainManualUiCopy {
  return ui[locale];
}

export function getLocalizedBrainManual(locale: Locale): LocalizedBrainManual {
  const localizedUi = ui[locale];
  if (locale === "en") {
    return { ui: localizedUi, chapters: brainChapters, patterns: brainPatterns, patternById: new Map(brainPatterns.map((pattern) => [pattern.id, pattern])), cognitiveNavigation: cognitiveNavigation.en, metaPattern: brainMetaPattern };
  }

  const edition = editions[locale];
  const seeds = brainManualPatternSeeds[locale];
  if (seeds.length !== brainPatterns.length || edition.chapters.length !== brainChapters.length) throw new Error(`Incomplete Brain Manual edition: ${locale}`);

  const patterns = brainPatterns.map((pattern, index): BrainPattern => {
    const [thesis, observation, tradeoff] = seeds[index];
    const newPatternIndex = newPatternIds.indexOf(pattern.id);
    return {
      ...pattern,
      thesis,
      observation,
      strength: `${edition.strengthPrefix} ${thesis} ${edition.strengthSuffix}`,
      tradeoff,
      examples: [`${edition.examplePractice} ${observation}`, `${edition.exampleCounterweight} ${tradeoff}`],
      ...(pattern.fieldNote ? { fieldNote: pattern.id === "quick-context-switching" ? edition.qcsFieldNote : newPatternIndex >= 0 ? newPatternCounterweights[locale][newPatternIndex] : `${edition.aegisNote} ${tradeoff}` } : {}),
    };
  });
  const chapters = brainChapters.map((chapter, index): BrainChapter => ({ ...chapter, ...edition.chapters[index] }));
  return { ui: localizedUi, chapters, patterns, patternById: new Map(patterns.map((pattern) => [pattern.id, pattern])), cognitiveNavigation: cognitiveNavigation[locale], metaPattern: edition.metaPattern };
}
