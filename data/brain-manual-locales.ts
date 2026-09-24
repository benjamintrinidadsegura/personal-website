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
  metaPattern: BrainManualMetaPattern;
}

export interface BrainManualMetaPattern { title: string; thesis: string; body: string; counterweight: string }

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
    metadataTitle: "How my brain works + Quirks, Patterns, Abilities | bts.online", breadcrumb: "Brain Manual", eyebrow: "Personal operating manual · 27 recurring patterns", title: "How my brain works", subtitle: "Quirks, Patterns, Abilities", description: "Field notes on how I connect ideas, build systems, understand people, create scope—and occasionally need Aegis to point out that the finish line moved again.", aegisCredit: "Observed, challenged and co-authored with Aegis—as observer, sparring partner and writing partner.", languageNotice: "Editorial copy follows your selected language. Canonical pattern names remain in English so references stay stable across editions.", jump: "Jump to a chapter", chapter: "Chapter", patterns: "patterns", strength: "Where it helps", tradeoff: "Where it gets expensive", showsUp: "Shows up in practice", connected: "Connected patterns", connectionsNote: "These links show the patterns that reinforce, stretch or restrain this one.", fieldNote: "Aegis field note", metaPattern: "Meta-pattern", bridgeEyebrow: "Your combination", bridgeTitle: "Want to map your own combination?", bridgeBody: "This manual is one real-world example of many patterns interacting. Personal Advantage Mapping looks for your evidence, your context and your combination—not similarity to mine.", bridgeCta: "What's Your Unfair Advantage?", back: "Back to About",
    patternMap: { eyebrow: "Pattern map · an editorial view", title: "Connection sits near the centre.", description: "The map is not a score or diagnosis. It is a reading of six recurring territories and the deliberate counterweight that keeps connection useful.", centre: "Connection", domains: ["Systems", "People", "Ideas", "Identity", "Meaning", "Future"], counterweight: "Counterweight", counterweightDescription: "A separate operating zone for deciding what deserves to continue.", counterweightItems: ["Curation", "Focus", "Deliberate Stopping"] },
  },
  de: {
    metadataTitle: "Wie mein Gehirn arbeitet + Eigenheiten, Muster, Fähigkeiten | bts.online", breadcrumb: "Brain Manual", eyebrow: "Persönliches Betriebshandbuch · 27 wiederkehrende Muster", title: "Wie mein Gehirn arbeitet", subtitle: "Eigenheiten, Muster, Fähigkeiten", description: "Feldnotizen darüber, wie ich Ideen verbinde, Systeme baue, Menschen verstehe, Umfang erzeuge – und gelegentlich Aegis brauche, um auf die erneut verschobene Ziellinie hinzuweisen.", aegisCredit: "Beobachtet, hinterfragt und mitverfasst mit Aegis – als Beobachter, Sparringspartner und Schreibpartner.", languageNotice: "Der redaktionelle Inhalt folgt deiner gewählten Sprache. Die kanonischen Musternamen bleiben auf Englisch, damit Verweise über alle Ausgaben stabil sind.", jump: "Zu einem Kapitel springen", chapter: "Kapitel", patterns: "Muster", strength: "Wo es hilft", tradeoff: "Wo es teuer wird", showsUp: "So zeigt es sich in der Praxis", connected: "Verbundene Muster", connectionsNote: "Diese Verweise zeigen, welche Muster dieses hier verstärken, dehnen oder begrenzen.", fieldNote: "Aegis-Feldnotiz", metaPattern: "Meta-Muster", bridgeEyebrow: "Deine Kombination", bridgeTitle: "Möchtest du deine eigene Kombination abbilden?", bridgeBody: "Dieses Handbuch ist ein reales Beispiel für viele interagierende Muster. Personal Advantage Mapping sucht nach deinen Belegen, deinem Kontext und deiner Kombination – nicht nach Ähnlichkeit mit mir.", bridgeCta: "What's Your Unfair Advantage?", back: "Zurück zu About",
    patternMap: { eyebrow: "Musterkarte · redaktionelle Lesart", title: "Verbindung liegt nahe dem Zentrum.", description: "Die Karte ist weder Score noch Diagnose. Sie zeigt sechs wiederkehrende Felder und das bewusste Gegengewicht, das Verbindung nützlich hält.", centre: "Verbindung", domains: ["Systeme", "Menschen", "Ideen", "Identität", "Bedeutung", "Zukunft"], counterweight: "Gegengewicht", counterweightDescription: "Ein eigener Arbeitsbereich für die Entscheidung, was weitergeführt werden soll.", counterweightItems: ["Kuration", "Fokus", "Bewusstes Stoppen"] },
  },
  es: {
    metadataTitle: "Cómo funciona mi mente + Peculiaridades, patrones, capacidades | bts.online", breadcrumb: "Manual mental", eyebrow: "Manual personal · 27 patrones recurrentes", title: "Cómo funciona mi mente", subtitle: "Peculiaridades, patrones, capacidades", description: "Notas de campo sobre cómo conecto ideas, construyo sistemas, comprendo a las personas, creo alcance y, a veces, necesito que Aegis señale que la meta volvió a moverse.", aegisCredit: "Observado, cuestionado y coescrito con Aegis, como observador, interlocutor crítico y compañero de escritura.", languageNotice: "El contenido editorial sigue el idioma elegido. Los nombres canónicos de los patrones permanecen en inglés para mantener referencias estables entre ediciones.", jump: "Ir a un capítulo", chapter: "Capítulo", patterns: "patrones", strength: "Dónde ayuda", tradeoff: "Dónde cuesta", showsUp: "Cómo aparece en la práctica", connected: "Patrones conectados", connectionsNote: "Estos enlaces muestran qué patrones refuerzan, amplían o limitan este.", fieldNote: "Nota de campo de Aegis", metaPattern: "Metapatrón", bridgeEyebrow: "Tu combinación", bridgeTitle: "¿Quieres mapear tu propia combinación?", bridgeBody: "Este manual es un ejemplo real de muchos patrones que interactúan. Personal Advantage Mapping busca tu evidencia, tu contexto y tu combinación, no cuánto te pareces a mí.", bridgeCta: "What's Your Unfair Advantage?", back: "Volver a About",
    patternMap: { eyebrow: "Mapa de patrones · lectura editorial", title: "La conexión está cerca del centro.", description: "El mapa no es una puntuación ni un diagnóstico. Lee seis territorios recurrentes y el contrapeso deliberado que mantiene útil la conexión.", centre: "Conexión", domains: ["Sistemas", "Personas", "Ideas", "Identidad", "Significado", "Futuro"], counterweight: "Contrapeso", counterweightDescription: "Una zona operativa separada para decidir qué merece continuar.", counterweightItems: ["Curación", "Enfoque", "Cierre deliberado"] },
  },
  tr: {
    metadataTitle: "Zihnim nasıl çalışıyor + Özellikler, örüntüler, yetenekler | bts.online", breadcrumb: "Zihin Kılavuzu", eyebrow: "Kişisel kullanım kılavuzu · 27 tekrar eden örüntü", title: "Zihnim nasıl çalışıyor", subtitle: "Özellikler, örüntüler, yetenekler", description: "Fikirleri nasıl bağladığım, sistemler kurduğum, insanları anladığım, kapsam yarattığım ve bazen bitiş çizgisinin yine taşındığını Aegis'ten duymam gerektiği üzerine saha notları.", aegisCredit: "Aegis ile gözlemlendi, sorgulandı ve birlikte yazıldı; gözlemci, tartışma ortağı ve yazı ortağı olarak.", languageNotice: "Editoryal içerik seçtiğin dili izler. Baskılar arasındaki referansların sabit kalması için kanonik örüntü adları İngilizce kalır.", jump: "Bir bölüme git", chapter: "Bölüm", patterns: "örüntü", strength: "Nerede yardımcı olur", tradeoff: "Nerede maliyetli olur", showsUp: "Pratikte nasıl görünür", connected: "Bağlantılı örüntüler", connectionsNote: "Bu bağlantılar hangi örüntülerin bunu güçlendirdiğini, genişlettiğini veya sınırladığını gösterir.", fieldNote: "Aegis saha notu", metaPattern: "Meta örüntü", bridgeEyebrow: "Senin kombinasyonun", bridgeTitle: "Kendi kombinasyonunu haritalamak ister misin?", bridgeBody: "Bu kılavuz, birçok örüntünün etkileşimine dair gerçek bir örnektir. Personal Advantage Mapping benimle benzerliği değil; senin kanıtını, bağlamını ve kombinasyonunu arar.", bridgeCta: "What's Your Unfair Advantage?", back: "About'a dön",
    patternMap: { eyebrow: "Örüntü haritası · editoryal okuma", title: "Bağlantı merkeze yakın durur.", description: "Bu harita bir puan ya da tanı değildir. Altı tekrar eden alanı ve bağlantıyı yararlı tutan bilinçli karşı ağırlığı okur.", centre: "Bağlantı", domains: ["Sistemler", "İnsanlar", "Fikirler", "Kimlik", "Anlam", "Gelecek"], counterweight: "Karşı ağırlık", counterweightDescription: "Neyin devam etmeyi hak ettiğine karar veren ayrı bir çalışma alanı.", counterweightItems: ["Kürasyon", "Odak", "Bilinçli durma"] },
  },
  pl: {
    metadataTitle: "Jak działa mój umysł + Osobliwości, wzorce, zdolności | bts.online", breadcrumb: "Instrukcja umysłu", eyebrow: "Osobista instrukcja · 27 powtarzających się wzorców", title: "Jak działa mój umysł", subtitle: "Osobliwości, wzorce, zdolności", description: "Notatki terenowe o tym, jak łączę pomysły, buduję systemy, rozumiem ludzi, tworzę zakres i czasem potrzebuję Aegis, by zauważył kolejne przesunięcie mety.", aegisCredit: "Obserwowane, kwestionowane i współpisane z Aegis — jako obserwatorem, partnerem do sparingu i współautorem.", languageNotice: "Treść redakcyjna działa w wybranym języku. Kanoniczne nazwy wzorców pozostają po angielsku, aby odwołania były stałe we wszystkich wydaniach.", jump: "Przejdź do rozdziału", chapter: "Rozdział", patterns: "wzorców", strength: "Gdzie pomaga", tradeoff: "Gdzie kosztuje", showsUp: "Jak wygląda w praktyce", connected: "Powiązane wzorce", connectionsNote: "Te odsyłacze pokazują wzorce, które wzmacniają, poszerzają lub ograniczają ten wzorzec.", fieldNote: "Notatka terenowa Aegis", metaPattern: "Metawzorzec", bridgeEyebrow: "Twoje połączenie", bridgeTitle: "Chcesz zmapować własne połączenie?", bridgeBody: "Ten podręcznik jest realnym przykładem wielu oddziałujących wzorców. Personal Advantage Mapping szuka twoich dowodów, kontekstu i kombinacji, a nie podobieństwa do mnie.", bridgeCta: "What's Your Unfair Advantage?", back: "Wróć do About",
    patternMap: { eyebrow: "Mapa wzorców · ujęcie redakcyjne", title: "Połączenie znajduje się blisko centrum.", description: "Mapa nie jest wynikiem ani diagnozą. Pokazuje sześć powracających obszarów oraz świadomą przeciwwagę, dzięki której łączenie pozostaje użyteczne.", centre: "Połączenie", domains: ["Systemy", "Ludzie", "Pomysły", "Tożsamość", "Znaczenie", "Przyszłość"], counterweight: "Przeciwwaga", counterweightDescription: "Oddzielna strefa pracy służąca decyzji, co zasługuje na kontynuację.", counterweightItems: ["Kuracja", "Skupienie", "Świadome zatrzymanie"] },
  },
  el: {
    metadataTitle: "Πώς λειτουργεί το μυαλό μου + Ιδιαιτερότητες, μοτίβα, ικανότητες | bts.online", breadcrumb: "Εγχειρίδιο νου", eyebrow: "Προσωπικό εγχειρίδιο · 27 επαναλαμβανόμενα μοτίβα", title: "Πώς λειτουργεί το μυαλό μου", subtitle: "Ιδιαιτερότητες, μοτίβα, ικανότητες", description: "Σημειώσεις πεδίου για το πώς συνδέω ιδέες, χτίζω συστήματα, κατανοώ ανθρώπους, δημιουργώ εύρος και μερικές φορές χρειάζομαι το Aegis να επισημάνει ότι η γραμμή τερματισμού μετακινήθηκε ξανά.", aegisCredit: "Παρατηρήθηκε, αμφισβητήθηκε και συνγράφηκε με το Aegis — ως παρατηρητή, συνομιλητή αντιπαράθεσης και συνεργάτη γραφής.", languageNotice: "Το επιμελημένο περιεχόμενο ακολουθεί την επιλεγμένη γλώσσα. Τα κανονικά ονόματα των μοτίβων μένουν στα αγγλικά ώστε οι αναφορές να παραμένουν σταθερές.", jump: "Μετάβαση σε κεφάλαιο", chapter: "Κεφάλαιο", patterns: "μοτίβα", strength: "Πού βοηθά", tradeoff: "Πού κοστίζει", showsUp: "Πώς εμφανίζεται στην πράξη", connected: "Συνδεδεμένα μοτίβα", connectionsNote: "Οι σύνδεσμοι δείχνουν ποια μοτίβα ενισχύουν, διευρύνουν ή περιορίζουν αυτό το μοτίβο.", fieldNote: "Σημείωση πεδίου Aegis", metaPattern: "Μετα-μοτίβο", bridgeEyebrow: "Ο συνδυασμός σου", bridgeTitle: "Θέλεις να χαρτογραφήσεις τον δικό σου συνδυασμό;", bridgeBody: "Αυτό το εγχειρίδιο είναι ένα πραγματικό παράδειγμα πολλών μοτίβων σε αλληλεπίδραση. Το Personal Advantage Mapping αναζητά τα δικά σου στοιχεία, πλαίσιο και συνδυασμό — όχι ομοιότητα με εμένα.", bridgeCta: "What's Your Unfair Advantage?", back: "Πίσω στο About",
    patternMap: { eyebrow: "Χάρτης μοτίβων · επιμελημένη ανάγνωση", title: "Η σύνδεση βρίσκεται κοντά στο κέντρο.", description: "Ο χάρτης δεν είναι βαθμολογία ή διάγνωση. Διαβάζει έξι επαναλαμβανόμενα πεδία και το συνειδητό αντίβαρο που κρατά τη σύνδεση χρήσιμη.", centre: "Σύνδεση", domains: ["Συστήματα", "Άνθρωποι", "Ιδέες", "Ταυτότητα", "Νόημα", "Μέλλον"], counterweight: "Αντίβαρο", counterweightDescription: "Μια χωριστή ζώνη λειτουργίας για την απόφαση του τι αξίζει να συνεχιστεί.", counterweightItems: ["Επιμέλεια", "Εστίαση", "Συνειδητή παύση"] },
  },
  ru: {
    metadataTitle: "Как работает мой мозг + Особенности, паттерны, способности | bts.online", breadcrumb: "Руководство по мышлению", eyebrow: "Личное руководство · 27 повторяющихся паттернов", title: "Как работает мой мозг", subtitle: "Особенности, паттерны, способности", description: "Полевые заметки о том, как я связываю идеи, строю системы, понимаю людей, создаю объём и иногда нуждаюсь в Aegis, чтобы заметить очередное смещение финиша.", aegisCredit: "Наблюдалось, оспаривалось и создавалось вместе с Aegis — как наблюдателем, партнёром для спарринга и соавтором.", languageNotice: "Редакционный текст следует выбранному языку. Канонические названия паттернов остаются на английском, чтобы ссылки были стабильны во всех изданиях.", jump: "Перейти к главе", chapter: "Глава", patterns: "паттернов", strength: "Где помогает", tradeoff: "Где становится затратным", showsUp: "Как проявляется на практике", connected: "Связанные паттерны", connectionsNote: "Эти ссылки показывают паттерны, которые усиливают, расширяют или ограничивают данный паттерн.", fieldNote: "Полевая заметка Aegis", metaPattern: "Метапаттерн", bridgeEyebrow: "Ваша комбинация", bridgeTitle: "Хотите составить карту своей комбинации?", bridgeBody: "Это руководство — реальный пример взаимодействия многих паттернов. Personal Advantage Mapping ищет ваши свидетельства, контекст и комбинацию, а не сходство со мной.", bridgeCta: "What's Your Unfair Advantage?", back: "Назад к About",
    patternMap: { eyebrow: "Карта паттернов · редакционное прочтение", title: "Связь находится рядом с центром.", description: "Карта не является оценкой или диагнозом. Она показывает шесть повторяющихся областей и осознанный противовес, который сохраняет пользу связей.", centre: "Связь", domains: ["Системы", "Люди", "Идеи", "Идентичность", "Смысл", "Будущее"], counterweight: "Противовес", counterweightDescription: "Отдельная рабочая зона для решения, что заслуживает продолжения.", counterweightItems: ["Кураторство", "Фокус", "Осознанная остановка"] },
  },
};

const editions: Record<Exclude<Locale, "en">, EditionCopy> = {
  de: {
    chapters: [
      { title: "Wie ich Dinge verbinde", introduction: "Der größte Teil dieses Handbuchs beginnt hier: Ein Detail wird mit einem Muster, das Muster mit einem System und das System wieder mit den Menschen darin verbunden." },
      { title: "Wie Ideen entstehen", introduction: "Ideen kommen selten allein. Sie bringen benachbarte Möglichkeiten, gedachte Welten und die unbequeme Frage mit, welche davon real werden soll." },
      { title: "Wie ich Menschen verstehe", introduction: "Menschlicher Kontext ist keine Dekoration um ein Produkt. Er verändert das Problem, die Bedeutung von Sicherheit und die Nützlichkeit einer Lösung." },
      { title: "Wie Identität prägt, was ich baue", introduction: "Ein Produkt hat Identität, wenn Sprache, Verhalten, Grenzen und visuelle Welt dieselbe Zusage machen und einhalten." },
      { title: "Wie ich Komplexität halte", introduction: "Komplexität wird handhabbar, wenn Spannung sichtbar bleiben darf, Kontext rekonstruierbar ist und Auswahl Möglichkeit in Richtung verwandelt." },
      { title: "Was mich immer wieder in Schwierigkeiten bringt", introduction: "Derselbe Verbindungsinstinkt, der Tiefe erzeugt, kann die Ziellinie verschieben. Dieses Kapitel braucht nur ein Muster." },
    ],
    metaPattern: { title: "Das Muster hinter den Mustern", thesis: "Verbindung ist wahrscheinlich der wiederkehrende Kern.", body: "Ideen verbinden sich mit Systemen, Systeme mit Menschen, Emotionen mit Geschäftsmodellen, heutige Entscheidungen mit zukünftigen Ökosystemen und Funktion mit Identität und Bedeutung. Daraus entstehen Wert und zentraler Zielkonflikt dieses Handbuchs. Eine weitere Verbindung wird zu einer weiteren Möglichkeit und dann zu einer weiteren Ebene. Das Gegengewicht ist nicht weniger Neugier, sondern Kuration, Fokus, Auswahl und bewusstes Stoppen.", counterweight: "Weit verbinden. Bewusst wählen. Dort stoppen, wo die aktuelle Evidenz endet." },
    strengthPrefix: "Bewusst eingesetzt wird daraus eine Stärke:", strengthSuffix: "So entsteht Hebelwirkung, ohne den menschlichen Kontext aus dem Blick zu verlieren.", examplePractice: "In der Produktarbeit zeigt sich das so:", exampleCounterweight: "Als praktische Gegenprobe gilt:", aegisNote: "Aegis würde als beobachtender Sparringspartner notieren:", qcsFieldNote: "Absichtlich wechseln. Einen Wiedereinstiegspunkt hinterlassen. Schließen, was nicht offen bleiben muss.",
  },
  es: {
    chapters: [
      { title: "Cómo conecto las cosas", introduction: "La mayor parte del manual empieza aquí: conecto un detalle con un patrón, el patrón con un sistema y el sistema con las personas que viven dentro." },
      { title: "Cómo suceden las ideas", introduction: "Las ideas rara vez llegan solas. Traen posibilidades vecinas, mundos imaginados y la pregunta incómoda de cuál merece hacerse real." },
      { title: "Cómo comprendo a las personas", introduction: "El contexto humano no decora el producto. Cambia el problema, el significado de seguridad y la utilidad de la solución propuesta." },
      { title: "Cómo la identidad da forma a lo que construyo", introduction: "Un producto tiene identidad cuando lenguaje, conducta, límites y mundo visual hacen la misma promesa y la cumplen." },
      { title: "Cómo sostengo la complejidad", introduction: "La complejidad se vuelve manejable cuando la tensión sigue visible, el contexto puede reconstruirse y la selección convierte posibilidad en dirección." },
      { title: "Lo que sigue metiéndome en problemas", introduction: "El mismo instinto de conexión que crea profundidad puede mover la meta. Este capítulo necesita un solo patrón." },
    ],
    metaPattern: { title: "El patrón detrás de los patrones", thesis: "La conexión probablemente es el núcleo recurrente.", body: "Las ideas se conectan con sistemas; los sistemas, con personas; las emociones, con modelos de negocio; las decisiones actuales, con ecosistemas futuros; la función, con identidad y significado. Ese mecanismo crea gran parte del valor y también el conflicto central. Otra conexión se vuelve otra posibilidad y luego otra capa. El contrapeso no es menos curiosidad: es curación, enfoque, selección y cierre deliberado.", counterweight: "Conecta con amplitud. Elige deliberadamente. Detente donde terminan las pruebas actuales." },
    strengthPrefix: "Usado de forma deliberada, se convierte en una fortaleza:", strengthSuffix: "Así crea palanca sin perder de vista el contexto humano.", examplePractice: "En el trabajo de producto aparece así:", exampleCounterweight: "Como contraste práctico conviene recordar:", aegisNote: "Aegis anotaría como observador e interlocutor crítico:", qcsFieldNote: "Cambia deliberadamente. Deja un punto de reentrada. Cierra lo que no merece seguir abierto.",
  },
  tr: {
    chapters: [
      { title: "Şeyleri nasıl bağlarım", introduction: "Kılavuzun çoğu burada başlar: ayrıntıyı örüntüye, örüntüyü sisteme, sistemi de içindeki insanlara bağlama eğilimi." },
      { title: "Fikirler nasıl ortaya çıkar", introduction: "Fikirler nadiren yalnız gelir. Yan olasılıkları, hayal edilen dünyaları ve hangisinin gerçeğe dönüşmeyi hak ettiği sorusunu getirir." },
      { title: "İnsanları nasıl anlarım", introduction: "İnsani bağlam ürünün çevresindeki süs değildir. Problemi, güvenliğin anlamını ve önerilen çözümün işe yarayıp yaramayacağını değiştirir." },
      { title: "Kimlik kurduklarımı nasıl şekillendirir", introduction: "Dil, davranış, sınırlar ve görsel dünya aynı sözü verip tuttuğunda ürünün bir kimliği vardır." },
      { title: "Karmaşıklığı nasıl taşırım", introduction: "Gerilim görünür kalabildiğinde, bağlam yeniden kurulabildiğinde ve seçim olasılığı yöne çevirdiğinde karmaşıklık yönetilebilir olur." },
      { title: "Başımı tekrar tekrar derde sokan şey", introduction: "Derinlik yaratan bağlantı içgüdüsü bitiş çizgisini de taşıyabilir. Bu bölüm tek bir örüntüye ihtiyaç duyar." },
    ],
    metaPattern: { title: "Örüntülerin arkasındaki örüntü", thesis: "Bağlantı muhtemelen tekrar eden çekirdektir.", body: "Fikirler sistemlere, sistemler insanlara, duygular iş modellerine, bugünkü kararlar gelecekteki ekosistemlere, işlev kimlik ve anlama bağlanır. Bu mekanizma kılavuzdaki değerin ve temel ödünleşimin büyük bölümünü üretir. Başka bir bağlantı başka bir olasılığa, sonra başka bir katmana dönüşür. Karşı ağırlık daha az merak değil; kürasyon, odak, seçim ve bilinçli durmadır.", counterweight: "Geniş bağlan. Bilinçli seç. Mevcut kanıtın bittiği yerde dur." },
    strengthPrefix: "Bilinçli kullanıldığında bu bir güce dönüşür:", strengthSuffix: "Böylece insani bağlam kaybolmadan kaldıraç yaratır.", examplePractice: "Ürün çalışmasında şöyle görünür:", exampleCounterweight: "Pratik karşı kontrol şudur:", aegisNote: "Aegis gözlemci ve tartışma ortağı olarak şunu not ederdi:", qcsFieldNote: "Bilinçli geç. Bir yeniden giriş noktası bırak. Açık kalmayı hak etmeyeni kapat.",
  },
  pl: {
    chapters: [
      { title: "Jak łączę rzeczy", introduction: "Większość instrukcji zaczyna się tutaj: od łączenia detalu z wzorcem, wzorca z systemem, a systemu z ludźmi wewnątrz." },
      { title: "Jak powstają pomysły", introduction: "Pomysły rzadko przychodzą same. Przynoszą sąsiednie możliwości, wyobrażone światy i trudne pytanie, która z nich zasługuje na urzeczywistnienie." },
      { title: "Jak rozumiem ludzi", introduction: "Ludzki kontekst nie jest dekoracją produktu. Zmienia problem, znaczenie bezpieczeństwa i to, czy rozwiązanie będzie użyteczne." },
      { title: "Jak tożsamość kształtuje to, co buduję", introduction: "Produkt ma tożsamość, gdy język, zachowanie, granice i świat wizualny składają tę samą obietnicę i jej dotrzymują." },
      { title: "Jak utrzymuję złożoność", introduction: "Złożoność staje się możliwa do opanowania, gdy napięcie pozostaje widoczne, kontekst można odtworzyć, a selekcja zmienia możliwość w kierunek." },
      { title: "To, co wciąż wpędza mnie w kłopoty", introduction: "Ten sam instynkt łączenia, który tworzy głębię, potrafi przesuwać metę. Ten rozdział potrzebuje tylko jednego wzorca." },
    ],
    metaPattern: { title: "Wzorzec stojący za wzorcami", thesis: "Połączenie jest prawdopodobnie powracającym rdzeniem.", body: "Pomysły łączą się z systemami, systemy z ludźmi, emocje z modelami biznesowymi, dzisiejsze decyzje z przyszłymi ekosystemami, a funkcja z tożsamością i znaczeniem. Ten mechanizm tworzy wartość i główny kompromis instrukcji. Kolejne połączenie staje się kolejną możliwością, a potem warstwą. Przeciwwagą nie jest mniejsza ciekawość, lecz kuracja, skupienie, selekcja i świadome zatrzymanie.", counterweight: "Łącz szeroko. Wybieraj świadomie. Zatrzymaj się tam, gdzie kończą się obecne dowody." },
    strengthPrefix: "Użyty świadomie, wzorzec staje się siłą:", strengthSuffix: "Tworzy dźwignię bez utraty ludzkiego kontekstu.", examplePractice: "W pracy produktowej wygląda to tak:", exampleCounterweight: "Praktyczna kontrola brzmi:", aegisNote: "Aegis jako obserwator i partner do sparingu zanotowałby:", qcsFieldNote: "Przełączaj się świadomie. Zostaw punkt powrotu. Zamknij to, co nie musi pozostać otwarte.",
  },
  el: {
    chapters: [
      { title: "Πώς συνδέω τα πράγματα", introduction: "Το μεγαλύτερο μέρος του εγχειριδίου αρχίζει εδώ: συνδέω μια λεπτομέρεια με μοτίβο, το μοτίβο με σύστημα και το σύστημα με τους ανθρώπους μέσα του." },
      { title: "Πώς γεννιούνται οι ιδέες", introduction: "Οι ιδέες σπάνια έρχονται μόνες. Φέρνουν γειτονικές δυνατότητες, φανταστικούς κόσμους και το δύσκολο ερώτημα ποια αξίζει να γίνει πραγματική." },
      { title: "Πώς κατανοώ τους ανθρώπους", introduction: "Το ανθρώπινο πλαίσιο δεν είναι διακόσμηση γύρω από το προϊόν. Αλλάζει το πρόβλημα, την έννοια της ασφάλειας και τη χρησιμότητα της λύσης." },
      { title: "Πώς η ταυτότητα διαμορφώνει όσα χτίζω", introduction: "Ένα προϊόν έχει ταυτότητα όταν γλώσσα, συμπεριφορά, όρια και οπτικός κόσμος δίνουν την ίδια υπόσχεση και την τηρούν." },
      { title: "Πώς κρατώ την πολυπλοκότητα", introduction: "Η πολυπλοκότητα γίνεται διαχειρίσιμη όταν η ένταση μένει ορατή, το πλαίσιο ανακατασκευάζεται και η επιλογή μετατρέπει δυνατότητα σε κατεύθυνση." },
      { title: "Αυτό που συνεχίζει να με βάζει σε μπελάδες", introduction: "Το ίδιο ένστικτο σύνδεσης που δημιουργεί βάθος μπορεί να μετακινεί τον τερματισμό. Αυτό το κεφάλαιο χρειάζεται μόνο ένα μοτίβο." },
    ],
    metaPattern: { title: "Το μοτίβο πίσω από τα μοτίβα", thesis: "Η σύνδεση είναι πιθανότατα ο επαναλαμβανόμενος πυρήνας.", body: "Οι ιδέες συνδέονται με συστήματα, τα συστήματα με ανθρώπους, τα συναισθήματα με επιχειρηματικά μοντέλα, οι σημερινές αποφάσεις με μελλοντικά οικοσυστήματα και η λειτουργία με ταυτότητα και νόημα. Ο μηχανισμός δημιουργεί αξία και τον κεντρικό συμβιβασμό. Μια ακόμη σύνδεση γίνεται δυνατότητα και έπειτα επίπεδο. Το αντίβαρο δεν είναι λιγότερη περιέργεια, αλλά επιμέλεια, εστίαση, επιλογή και συνειδητή παύση.", counterweight: "Σύνδεε πλατιά. Επίλεγε συνειδητά. Σταμάτα εκεί όπου σταματούν τα σημερινά στοιχεία." },
    strengthPrefix: "Όταν χρησιμοποιείται συνειδητά, γίνεται δύναμη:", strengthSuffix: "Έτσι δημιουργεί μόχλευση χωρίς να χάνεται το ανθρώπινο πλαίσιο.", examplePractice: "Στην εργασία προϊόντος εμφανίζεται έτσι:", exampleCounterweight: "Ο πρακτικός αντίλογος είναι:", aegisNote: "Το Aegis ως παρατηρητής και συνομιλητής αντιπαράθεσης θα σημείωνε:", qcsFieldNote: "Άλλαζε συνειδητά. Άφηνε σημείο επιστροφής. Κλείνε ό,τι δεν χρειάζεται να μείνει ανοιχτό.",
  },
  ru: {
    chapters: [
      { title: "Как я связываю вещи", introduction: "Большая часть руководства начинается здесь: с привычки связывать деталь с паттерном, паттерн с системой, а систему с людьми внутри неё." },
      { title: "Как возникают идеи", introduction: "Идеи редко приходят в одиночку. Они приносят соседние возможности, воображаемые миры и неудобный вопрос, какая из них заслуживает стать реальной." },
      { title: "Как я понимаю людей", introduction: "Человеческий контекст не является украшением продукта. Он меняет проблему, смысл безопасности и полезность предложенного решения." },
      { title: "Как идентичность формирует то, что я создаю", introduction: "У продукта есть идентичность, когда язык, поведение, границы и визуальный мир дают одно обещание и выполняют его." },
      { title: "Как я удерживаю сложность", introduction: "Сложность становится управляемой, когда напряжение остаётся видимым, контекст восстанавливается, а отбор превращает возможность в направление." },
      { title: "То, что снова и снова создаёт мне проблемы", introduction: "Тот же инстинкт связи, который создаёт глубину, может двигать финиш. Этой главе нужен только один паттерн." },
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
    return { ui: localizedUi, chapters: brainChapters, patterns: brainPatterns, patternById: new Map(brainPatterns.map((pattern) => [pattern.id, pattern])), metaPattern: brainMetaPattern };
  }

  const edition = editions[locale];
  const seeds = brainManualPatternSeeds[locale];
  if (seeds.length !== brainPatterns.length || edition.chapters.length !== brainChapters.length) throw new Error(`Incomplete Brain Manual edition: ${locale}`);

  const patterns = brainPatterns.map((pattern, index): BrainPattern => {
    const [thesis, observation, tradeoff] = seeds[index];
    return {
      ...pattern,
      thesis,
      observation,
      strength: `${edition.strengthPrefix} ${thesis} ${edition.strengthSuffix}`,
      tradeoff,
      examples: [`${edition.examplePractice} ${observation}`, `${edition.exampleCounterweight} ${tradeoff}`],
      ...(pattern.fieldNote ? { fieldNote: pattern.id === "quick-context-switching" ? edition.qcsFieldNote : `${edition.aegisNote} ${tradeoff}` } : {}),
    };
  });
  const chapters = brainChapters.map((chapter, index): BrainChapter => ({ ...chapter, ...edition.chapters[index] }));
  return { ui: localizedUi, chapters, patterns, patternById: new Map(patterns.map((pattern) => [pattern.id, pattern])), metaPattern: edition.metaPattern };
}
