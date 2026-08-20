import {
  aboutPositioning,
  aboutProjectEvidence,
  ownerStories,
  redThreadExamples,
  values,
} from "@/data/about";
import { getLocalizedProject } from "@/data/i18n/projects";
import type { Locale } from "@/lib/i18n/config";

const germanPositioning = {
  ...aboutPositioning,
  primary: "Menschlichere Systeme entwickeln, indem fehlender Kontext sichtbar wird.",
  alternative: "Menschen — und ihrem Kontext — eine Bühne geben.",
};

const germanValueTitles = [
  "Kontext vor Kategorien",
  "Veränderung vor Funktionen",
  "Verstehen, nicht vermessen",
  "Die Deutung bleibt beim Menschen",
] as const;

const germanValues = values.map((value, index) => ({ ...value, title: germanValueTitles[index] }));

const germanProjectStatus: Record<string, string> = {
  "Active / Growing": "Aktiv / im Wachstum",
  Rebuild: "Neuaufbau",
};

const germanOwnerStories = ownerStories.map((story, index) => ({
  ...story,
  label: index === 0 ? "Benjamin spricht / Quelle aus erster Person" : "KI-Perspektive / Sekundärquelle",
  ...("disclaimer" in story ? {
    disclaimer: "KI-generierte Perspektive und KI-gestützte Interpretation — keine objektive Wahrheit, keine psychologische Beurteilung oder Diagnose. Sie basiert auf ausgewähltem Schreib- und Gesprächskontext, ersetzt keine professionelle Einschätzung und lässt die Deutungshoheit vollständig bei Benjamin.",
  } : {}),
  sourceLanguage: "de" as const,
}));

const englishPositioning = {
  ...aboutPositioning,
  explanation: "I develop recruiting formats, products and reflection tools that make visible what CVs, labels, rankings or individual answers leave out. The aim is not to sort people into more precise boxes, but to help them — and the systems around them — make decisions that fit better.",
};

const englishValues = [
  { title: "Context before categories", description: "A CV, label or result can be a starting point. It must not be mistaken for the whole person." },
  { title: "Change before features", description: "The first product question is: what should become meaningfully different for the person afterwards? Features come second." },
  { title: "Understand, don’t measure", description: "Reflection can create structure and reveal differences without turning them into a score for a person, a life or a relationship." },
  { title: "The person keeps authority", description: "Systems can offer patterns and questions. Interpretation remains with the person whose life or experience is being considered." },
];

const englishRedThread = [
  { signal: "CV & job title", missing: "Origins, turning points, decisions and potential", change: "The story behind a professional chapter becomes visible.", href: "/people", linkLabel: "People / Spotlight" },
  { signal: "Employer communication", missing: "The lived recruiting, onboarding and offboarding experience", change: "RateCom explores how that perspective could become more transparent.", href: "/projects/ratecom", linkLabel: "RateCom" },
  { signal: "Selection & preference", missing: "Why something fits, which conditions apply and what remains open", change: "FYNS organises reasons and realistic steps for exploration instead of giving a finished answer.", href: "/find-your-next-step", linkLabel: "Find Your Next Step" },
  { signal: "Score & type", missing: "The present situation, priorities, relationships, limits and direction", change: "Life Alignment creates a revisable snapshot, not a diagnosis.", href: "/life-alignment", linkLabel: "Life Alignment" },
];

function englishProjectEvidence() {
  const goatrec = getLocalizedProject("goatrecrutainer", "en");
  const ratecom = getLocalizedProject("ratecom", "en");
  const digitalHq = getLocalizedProject("bts-online", "en");
  if (!goatrec || !ratecom || !digitalHq) throw new Error("Missing canonical About project");
  return [
    { name: goatrec.name, href: `/projects/${goatrec.slug}`, status: goatrec.status, problem: goatrec.problem, change: "People, career paths and services gain room to tell their stories clearly and in their own voices.", connection: "Recruiting, storytelling and People / Spotlight become one shared practice here.", externalUrl: goatrec.externalUrl },
    { name: ratecom.name, href: `/projects/${ratecom.slug}`, status: ratecom.status, problem: ratecom.problem, change: "The concept explores how lived candidate- and employee-journey perspectives could become visible more independently.", connection: "Currently a rebuild — the direction towards transparency is documented, not presented as a finished platform.", externalUrl: ratecom.externalUrl },
    { name: digitalHq.name, href: `/projects/${digitalHq.slug}`, status: digitalHq.status, problem: digitalHq.problem, change: "Projects, conversations, writing and tools become readable as one connected, searchable public system.", connection: "The relationship itself becomes part of the product, rather than a loose portfolio." },
    { name: "Find Your Next Step", href: "/find-your-next-step", status: "4 journeys · Beta", problem: "Questions about direction are quickly met with generic recommendations or a supposedly correct answer.", change: "FYNS makes the situation, preferences, conditions and intelligible next steps visible.", connection: "Context supports orientation; the decision remains with the person." },
    { name: "Life Alignment", href: "/life-alignment", status: "3 perspectives · Beta", problem: "Reflection on life and relationships can reduce people to scores, types or a supposedly correct direction.", change: "Life Alignment organises present conditions, priorities, tensions and desired directions qualitatively.", connection: "Understanding rather than measuring — explicitly without diagnosis and with interpretive authority remaining human." },
  ];
}

const englishOwnerStories = [
  {
    ...ownerStories[0],
    title: "Introducing GOATRECRUTAINER",
    label: "Benjamin speaks / First-person source",
    description: "Benjamin describes GOATRECRUTAINER as work centred on visibility: giving people, organisations and their stories an authentic, emotional and intelligible stage.",
    context: [
      "Recruiting and careers are only part of it. The focus is on potential, personal development, storytelling and new ways to reach and inspire talent.",
      "This introduction is Benjamin’s own public account of his mission and way of working. It is the strongest direct source on this page — not an external assessment.",
    ],
    sourceLanguage: "de" as const,
  },
  {
    ...ownerStories[1],
    title: "A second look at recurring patterns",
    label: "AI perspective / Secondary source",
    description: "An AI-generated interpretation based on Benjamin’s old blogs, projects, ideas, setbacks and selected conversational context spanning more than ten years.",
    context: [
      "The perspective becomes useful where it identifies motives that can then be checked against Benjamin’s own words and real projects — including community, visibility, development and the search for a connecting pattern.",
      "It is neither a neutral outside observation nor an authoritative identity. The system offers patterns and questions; it does not decide who he is. Benjamin decides what rings true, what has changed and what should be discarded.",
    ],
    disclaimer: "AI-generated perspective and AI-assisted interpretation — not objective truth, a psychological assessment or a diagnosis. It is based on selected writing and conversational context, does not replace professional assessment and leaves interpretive authority entirely with Benjamin.",
    sourceLanguage: "de" as const,
  },
];

type ExtendedLocale = Exclude<Locale, "de" | "en">;

type PositioningCopy = Omit<typeof aboutPositioning, "primary" | "explanation" | "alternative"> & {
  primary: string;
  explanation: string;
  alternative: string;
};

const extendedPositioning: Record<ExtendedLocale, PositioningCopy> = {
  es: { ...aboutPositioning, primary: "Diseñar sistemas más humanos haciendo visible el contexto que falta.", explanation: "Desarrollo formatos de recruiting, productos y herramientas de reflexión que muestran lo que los currículums, las etiquetas, los rankings o una respuesta aislada dejan fuera. No para clasificar mejor a las personas, sino para que ellas y los sistemas que las rodean puedan tomar decisiones que encajen mejor.", alternative: "Dar un escenario a las personas — y a su contexto." },
  tr: { ...aboutPositioning, primary: "Eksik bağlamı görünür kılarak daha insani sistemler geliştirmek.", explanation: "Özgeçmişlerin, etiketlerin, sıralamaların ya da tek bir yanıtın dışarıda bıraktıklarını görünür kılan işe alım formatları, ürünler ve düşünme araçları geliştiriyorum. Amaç insanları daha ayrıntılı kutulara ayırmak değil; onların ve çevrelerindeki sistemlerin daha uygun kararlar almasına yardımcı olmak.", alternative: "İnsanlara — ve bağlamlarına — bir sahne açmak." },
  pl: { ...aboutPositioning, primary: "Tworzyć bardziej ludzkie systemy, uwidaczniając brakujący kontekst.", explanation: "Tworzę formaty rekrutacyjne, produkty i narzędzia refleksji, które pokazują to, czego nie ujawniają CV, etykiety, rankingi ani pojedyncze odpowiedzi. Nie po to, by dokładniej szufladkować ludzi, lecz by oni i otaczające ich systemy mogli podejmować lepiej dopasowane decyzje.", alternative: "Dawać ludziom — i ich kontekstowi — przestrzeń, by byli widoczni." },
  el: { ...aboutPositioning, primary: "Να δημιουργούμε πιο ανθρώπινα συστήματα, κάνοντας ορατό το πλαίσιο που λείπει.", explanation: "Αναπτύσσω μορφές recruiting, προϊόντα και εργαλεία αναστοχασμού που κάνουν ορατά όσα αφήνουν έξω τα βιογραφικά, οι ετικέτες, οι κατατάξεις ή μια μεμονωμένη απάντηση. Όχι για να ταξινομήσουμε τους ανθρώπους σε ακριβέστερα κουτιά, αλλά για να μπορούν οι ίδιοι και τα συστήματα γύρω τους να παίρνουν αποφάσεις που ταιριάζουν καλύτερα.", alternative: "Να δίνουμε χώρο στους ανθρώπους — και στο πλαίσιό τους — να φανούν." },
  ru: { ...aboutPositioning, primary: "Создавать более человечные системы, делая видимым недостающий контекст.", explanation: "Я разрабатываю рекрутинговые форматы, продукты и инструменты для размышления, которые показывают то, чего не рассказывают резюме, ярлыки, рейтинги или отдельный ответ. Не чтобы точнее раскладывать людей по категориям, а чтобы они и окружающие их системы могли принимать более подходящие решения.", alternative: "Давать людям — и их контексту — пространство быть увиденными." },
};

const extendedValues: Record<ExtendedLocale, typeof englishValues> = {
  es: [{ title: "Contexto antes que categorías", description: "Un currículum, una etiqueta o un resultado pueden ser un punto de partida. No son la persona entera." }, { title: "Cambio antes que funciones", description: "La primera pregunta de producto es qué debería cambiar de forma significativa para la persona. Las funciones vienen después." }, { title: "Comprender, no medir", description: "Reflexionar puede ordenar y mostrar diferencias sin convertirlas en una puntuación de una persona, una vida o una relación." }, { title: "La autoridad permanece en la persona", description: "Los sistemas pueden ofrecer patrones y preguntas. La interpretación corresponde a quien vive esa experiencia." }],
  tr: [{ title: "Kategorilerden önce bağlam", description: "Özgeçmiş, etiket veya sonuç bir başlangıç olabilir; insanın tamamı sanılmamalıdır." }, { title: "Özelliklerden önce değişim", description: "İlk ürün sorusu, insan için anlamlı biçimde neyin değişmesi gerektiğidir. Özellikler sonra gelir." }, { title: "Ölçmek değil, anlamak", description: "Düşünme; insanı, hayatı ya da ilişkiyi puana çevirmeden yapı kurabilir ve farkları gösterebilir." }, { title: "Yorum yetkisi insanda kalır", description: "Sistemler desenler ve sorular sunabilir. Yorum, hayatı veya deneyimi söz konusu olan kişiye aittir." }],
  pl: [{ title: "Kontekst przed kategoriami", description: "CV, etykieta lub wynik mogą być punktem wyjścia. Nie wolno mylić ich z całym człowiekiem." }, { title: "Zmiana przed funkcjami", description: "Pierwsze pytanie produktowe brzmi: co powinno znacząco zmienić się dla człowieka? Funkcje są później." }, { title: "Rozumieć, nie mierzyć", description: "Refleksja może porządkować i ujawniać różnice bez zamieniania człowieka, życia czy relacji w wynik." }, { title: "Prawo do interpretacji zostaje przy człowieku", description: "Systemy mogą proponować wzorce i pytania. Interpretacja należy do osoby, której życie lub doświadczenie rozważamy." }],
  el: [{ title: "Πλαίσιο πριν από κατηγορίες", description: "Ένα βιογραφικό, μια ετικέτα ή ένα αποτέλεσμα μπορούν να είναι αφετηρία. Δεν πρέπει να θεωρούνται ολόκληρος ο άνθρωπος." }, { title: "Αλλαγή πριν από λειτουργίες", description: "Η πρώτη ερώτηση προϊόντος είναι τι πρέπει να αλλάξει ουσιαστικά για τον άνθρωπο. Οι λειτουργίες έπονται." }, { title: "Κατανόηση, όχι μέτρηση", description: "Ο αναστοχασμός μπορεί να οργανώνει και να αποκαλύπτει διαφορές χωρίς να μετατρέπει άνθρωπο, ζωή ή σχέση σε βαθμολογία." }, { title: "Η ερμηνεία μένει στον άνθρωπο", description: "Τα συστήματα μπορούν να προτείνουν μοτίβα και ερωτήσεις. Η ερμηνεία ανήκει στον άνθρωπο του οποίου η ζωή ή εμπειρία εξετάζεται." }],
  ru: [{ title: "Контекст до категорий", description: "Резюме, ярлык или результат могут быть отправной точкой. Их нельзя принимать за всего человека." }, { title: "Изменение до функций", description: "Первый продуктовый вопрос: что должно осмысленно измениться для человека? Функции идут следом." }, { title: "Понимать, а не измерять", description: "Рефлексия может структурировать и показывать различия, не превращая человека, жизнь или отношения в балл." }, { title: "Право на интерпретацию остаётся у человека", description: "Системы могут предлагать закономерности и вопросы. Интерпретация остаётся у человека, о чьей жизни или опыте идёт речь." }],
};

const extendedRedThread: Record<ExtendedLocale, typeof englishRedThread> = {
  es: [{ signal: "CV y cargo", missing: "Origen, giros, decisiones y potencial", change: "Se vuelve visible la historia detrás de una etapa profesional.", href: "/people", linkLabel: "People / Spotlight" }, { signal: "Comunicación de empleador", missing: "La experiencia vivida de recruiting, incorporación y salida", change: "RateCom explora cómo hacer esa perspectiva más transparente.", href: "/projects/ratecom", linkLabel: "RateCom" }, { signal: "Elección y preferencia", missing: "Por qué algo encaja, qué condiciones existen y qué sigue abierto", change: "FYNS ordena motivos y pasos realistas de exploración en lugar de dar una respuesta cerrada.", href: "/find-your-next-step", linkLabel: "Find Your Next Step" }, { signal: "Puntuación y tipo", missing: "Situación actual, prioridades, relaciones, límites y dirección", change: "Life Alignment crea una instantánea revisable, no un diagnóstico.", href: "/life-alignment", linkLabel: "Life Alignment" }],
  tr: [{ signal: "Özgeçmiş ve unvan", missing: "Köken, dönüm noktaları, kararlar ve potansiyel", change: "Mesleki bir dönemin arkasındaki hikâye görünür olur.", href: "/people", linkLabel: "People / Spotlight" }, { signal: "İşveren iletişimi", missing: "Yaşanan işe alım, işe başlangıç ve ayrılma deneyimi", change: "RateCom bu perspektifin nasıl daha şeffaf olabileceğini araştırır.", href: "/projects/ratecom", linkLabel: "RateCom" }, { signal: "Seçim ve tercih", missing: "Neden uyduğu, hangi koşulların geçerli olduğu ve neyin açık kaldığı", change: "FYNS hazır cevap yerine nedenleri ve gerçekçi keşif adımlarını düzenler.", href: "/find-your-next-step", linkLabel: "Find Your Next Step" }, { signal: "Puan ve tip", missing: "Bugünkü durum, öncelikler, ilişkiler, sınırlar ve yön", change: "Life Alignment tanı değil, yeniden değerlendirilebilir bir anlık görüntü sunar.", href: "/life-alignment", linkLabel: "Life Alignment" }],
  pl: [{ signal: "CV i stanowisko", missing: "Pochodzenie, punkty zwrotne, decyzje i potencjał", change: "Historia stojąca za etapem zawodowym staje się widoczna.", href: "/people", linkLabel: "People / Spotlight" }, { signal: "Komunikacja pracodawcy", missing: "Rzeczywiste doświadczenie rekrutacji, wdrożenia i odejścia", change: "RateCom bada, jak ta perspektywa może stać się bardziej przejrzysta.", href: "/projects/ratecom", linkLabel: "RateCom" }, { signal: "Wybór i preferencja", missing: "Dlaczego coś pasuje, jakie są warunki i co pozostaje otwarte", change: "FYNS porządkuje powody i realistyczne kroki badania zamiast dawać gotową odpowiedź.", href: "/find-your-next-step", linkLabel: "Find Your Next Step" }, { signal: "Wynik i typ", missing: "Obecna sytuacja, priorytety, relacje, granice i kierunek", change: "Life Alignment tworzy obraz, który można rewidować, a nie diagnozę.", href: "/life-alignment", linkLabel: "Life Alignment" }],
  el: [{ signal: "Βιογραφικό και τίτλος", missing: "Καταγωγή, καμπές, αποφάσεις και δυνατότητες", change: "Η ιστορία πίσω από ένα επαγγελματικό κεφάλαιο γίνεται ορατή.", href: "/people", linkLabel: "People / Spotlight" }, { signal: "Επικοινωνία εργοδότη", missing: "Η βιωμένη εμπειρία recruiting, ένταξης και αποχώρησης", change: "Το RateCom διερευνά πώς αυτή η οπτική μπορεί να γίνει πιο διαφανής.", href: "/projects/ratecom", linkLabel: "RateCom" }, { signal: "Επιλογή και προτίμηση", missing: "Γιατί κάτι ταιριάζει, ποιες συνθήκες ισχύουν και τι μένει ανοιχτό", change: "Το FYNS οργανώνει λόγους και ρεαλιστικά βήματα διερεύνησης αντί για μια έτοιμη απάντηση.", href: "/find-your-next-step", linkLabel: "Find Your Next Step" }, { signal: "Βαθμολογία και τύπος", missing: "Παρούσα κατάσταση, προτεραιότητες, σχέσεις, όρια και κατεύθυνση", change: "Το Life Alignment δημιουργεί μια αναθεωρήσιμη εικόνα, όχι διάγνωση.", href: "/life-alignment", linkLabel: "Life Alignment" }],
  ru: [{ signal: "Резюме и должность", missing: "Происхождение, поворотные моменты, решения и потенциал", change: "История за профессиональным этапом становится видимой.", href: "/people", linkLabel: "People / Spotlight" }, { signal: "Коммуникация работодателя", missing: "Реальный опыт рекрутинга, адаптации и ухода", change: "RateCom исследует, как сделать эту перспективу прозрачнее.", href: "/projects/ratecom", linkLabel: "RateCom" }, { signal: "Выбор и предпочтение", missing: "Почему что-то подходит, какие условия действуют и что остаётся открытым", change: "FYNS упорядочивает причины и реалистичные шаги исследования вместо готового ответа.", href: "/find-your-next-step", linkLabel: "Find Your Next Step" }, { signal: "Балл и тип", missing: "Нынешняя ситуация, приоритеты, отношения, ограничения и направление", change: "Life Alignment создаёт пересматриваемый снимок, а не диагноз.", href: "/life-alignment", linkLabel: "Life Alignment" }],
};

const extendedStoryCopy: Record<ExtendedLocale, readonly [
  { title: string; label: string; description: string; context: readonly [string, string] },
  { title: string; label: string; description: string; context: readonly [string, string]; disclaimer: string },
]> = {
  es: [{ title: "Presentación de GOATRECRUTAINER", label: "Benjamin habla / Fuente en primera persona", description: "Benjamin presenta GOATRECRUTAINER como un trabajo de visibilidad: dar a personas, organizaciones y sus historias un escenario auténtico, emocional y comprensible.", context: ["Recruiting y carrera son solo una parte. El foco está en el potencial, el desarrollo personal, la narrativa y nuevas formas de llegar e inspirar talento.", "Es la descripción pública de Benjamin sobre su misión y su forma de trabajar: la fuente directa más sólida de esta página, no una evaluación externa."] }, { title: "Una segunda mirada a los patrones recurrentes", label: "Perspectiva de IA / Fuente secundaria", description: "Una interpretación generada por IA a partir de antiguos blogs, proyectos, ideas, reveses y contexto de conversaciones de más de diez años.", context: ["La perspectiva resulta útil cuando identifica motivos que pueden contrastarse con palabras y proyectos reales de Benjamin: comunidad, visibilidad, desarrollo y búsqueda de un hilo común.", "No es una observación neutral ni una identidad autorizada. El sistema plantea patrones y preguntas; Benjamin decide qué reconoce, qué ha cambiado y qué descarta."], disclaimer: "Perspectiva generada y asistida por IA: no es una verdad objetiva, evaluación psicológica ni diagnóstico. Se basa en textos y conversaciones seleccionados, no sustituye una evaluación profesional y deja la interpretación por completo en manos de Benjamin." }],
  tr: [{ title: "GOATRECRUTAINER tanıtımı", label: "Benjamin anlatıyor / Birinci el kaynak", description: "Benjamin, GOATRECRUTAINER’ı görünürlük üzerine bir çalışma olarak anlatıyor: insanlara, kuruluşlara ve hikâyelerine sahici, duygusal ve anlaşılır bir sahne açmak.", context: ["İşe alım ve kariyer bunun yalnızca bir parçası. Odakta potansiyel, kişisel gelişim, hikâye anlatıcılığı ve yeteneklere ulaşmanın yeni yolları var.", "Bu, Benjamin’in misyonu ve çalışma biçimi hakkındaki kendi kamusal anlatımıdır; sayfadaki en güçlü doğrudan kaynak, dışarıdan bir değerlendirme değildir."] }, { title: "Tekrarlanan desenlere ikinci bir bakış", label: "Yapay zekâ perspektifi / İkincil kaynak", description: "Benjamin’in on yılı aşkın eski blogları, projeleri, fikirleri, aksilikleri ve seçilmiş sohbet bağlamına dayanan yapay zekâ üretimi yorum.", context: ["Perspektif; topluluk, görünürlük, gelişim ve birleştirici desen arayışı gibi nedenleri belirleyip bunları Benjamin’in sözleri ve gerçek projeleriyle sınadığında yararlı olur.", "Tarafsız dış gözlem ya da yetkili kimlik tanımı değildir. Sistem desenler ve sorular sunar; neyin doğru geldiğine, değiştiğine ya da bırakılacağına Benjamin karar verir."], disclaimer: "Yapay zekâ üretimi ve destekli perspektif; nesnel gerçek, psikolojik değerlendirme veya tanı değildir. Seçilmiş yazı ve sohbet bağlamına dayanır, profesyonel değerlendirme yerine geçmez ve yorum yetkisini bütünüyle Benjamin’de bırakır." }],
  pl: [{ title: "Przedstawienie GOATRECRUTAINER", label: "Benjamin mówi / Źródło pierwszoosobowe", description: "Benjamin opisuje GOATRECRUTAINER jako pracę nad widocznością: dawanie ludziom, organizacjom i ich historiom autentycznej, emocjonalnej i zrozumiałej sceny.", context: ["Rekrutacja i kariera to tylko część. W centrum są potencjał, rozwój osobisty, storytelling i nowe sposoby docierania do talentów.", "To własny publiczny opis misji i sposobu pracy Benjamina — najsilniejsze bezpośrednie źródło na tej stronie, nie zewnętrzna ocena."] }, { title: "Drugie spojrzenie na powracające wzorce", label: "Perspektywa AI / Źródło wtórne", description: "Interpretacja wygenerowana przez AI na podstawie dawnych blogów, projektów, pomysłów, niepowodzeń i wybranego kontekstu rozmów z ponad dziesięciu lat.", context: ["Perspektywa jest użyteczna, gdy wskazuje motywy, które można sprawdzić w słowach i realnych projektach Benjamina: społeczność, widoczność, rozwój i poszukiwanie wspólnego wzorca.", "Nie jest neutralną obserwacją ani autorytatywną tożsamością. System oferuje wzorce i pytania; Benjamin decyduje, co jest trafne, co się zmieniło i co odrzucić."], disclaimer: "Perspektywa wygenerowana i wsparta przez AI — nie obiektywna prawda, ocena psychologiczna ani diagnoza. Opiera się na wybranych tekstach i rozmowach, nie zastępuje profesjonalnej oceny i pozostawia pełne prawo interpretacji Benjaminowi." }],
  el: [{ title: "Παρουσίαση του GOATRECRUTAINER", label: "Ο Benjamin μιλά / Πηγή πρώτου προσώπου", description: "Ο Benjamin περιγράφει το GOATRECRUTAINER ως δουλειά πάνω στην ορατότητα: να δίνει σε ανθρώπους, οργανισμούς και ιστορίες μια αυθεντική, συναισθηματική και κατανοητή σκηνή.", context: ["Το recruiting και η σταδιοδρομία είναι μόνο ένα μέρος. Στο κέντρο βρίσκονται οι δυνατότητες, η προσωπική εξέλιξη, η αφήγηση και νέοι τρόποι προσέγγισης ταλέντων.", "Αυτή είναι η δημόσια περιγραφή του Benjamin για την αποστολή και τον τρόπο εργασίας του — η ισχυρότερη άμεση πηγή στη σελίδα, όχι εξωτερική αξιολόγηση."] }, { title: "Μια δεύτερη ματιά στα επαναλαμβανόμενα μοτίβα", label: "Οπτική ΤΝ / Δευτερογενής πηγή", description: "Ερμηνεία από ΤΝ με βάση παλιά ιστολόγια, έργα, ιδέες, αποτυχίες και επιλεγμένο πλαίσιο συζητήσεων άνω των δέκα ετών.", context: ["Η οπτική είναι χρήσιμη όταν εντοπίζει κίνητρα που μπορούν να ελεγχθούν απέναντι στα λόγια και τα πραγματικά έργα του Benjamin: κοινότητα, ορατότητα, εξέλιξη και αναζήτηση κοινού νήματος.", "Δεν είναι ουδέτερη εξωτερική παρατήρηση ούτε αυθεντία για την ταυτότητά του. Το σύστημα προτείνει μοτίβα και ερωτήσεις· ο Benjamin αποφασίζει τι ισχύει, τι άλλαξε και τι απορρίπτεται."], disclaimer: "Οπτική παραγόμενη και υποστηριζόμενη από ΤΝ — όχι αντικειμενική αλήθεια, ψυχολογική αξιολόγηση ή διάγνωση. Βασίζεται σε επιλεγμένα κείμενα και συζητήσεις, δεν αντικαθιστά επαγγελματική αξιολόγηση και αφήνει πλήρως την ερμηνεία στον Benjamin." }],
  ru: [{ title: "Знакомство с GOATRECRUTAINER", label: "Benjamin говорит / Источник от первого лица", description: "Benjamin описывает GOATRECRUTAINER как работу над видимостью: дать людям, организациям и их историям аутентичную, эмоциональную и понятную сцену.", context: ["Рекрутинг и карьера — лишь часть. В центре находятся потенциал, личное развитие, сторителлинг и новые способы привлекать и вдохновлять таланты.", "Это собственное публичное описание миссии и подхода Benjamin — самый сильный прямой источник на странице, а не внешняя оценка."] }, { title: "Второй взгляд на повторяющиеся закономерности", label: "Перспектива ИИ / Вторичный источник", description: "Интерпретация, созданная ИИ на основе старых блогов, проектов, идей, неудач и выбранного контекста разговоров более чем за десять лет.", context: ["Перспектива полезна, когда находит мотивы, которые можно сверить со словами и реальными проектами Benjamin: сообщество, видимость, развитие и поиск общей линии.", "Это не нейтральное внешнее наблюдение и не авторитетное определение личности. Система предлагает закономерности и вопросы; Benjamin решает, что откликается, что изменилось и что стоит отбросить."], disclaimer: "Перспектива создана и поддержана ИИ — это не объективная истина, психологическая оценка или диагноз. Она основана на выбранных текстах и разговорах, не заменяет профессиональную оценку и полностью оставляет право интерпретации Benjamin." }],
};

function extendedProjectEvidence(locale: ExtendedLocale) {
  const canonical = ["goatrecrutainer", "ratecom", "bts-online"] as const;
  const projects = canonical.map((slug) => getLocalizedProject(slug, locale));
  if (projects.some((project) => !project)) throw new Error("Missing canonical About project");
  const copy = {
    es: [
      ["Las personas, las trayectorias y los servicios ganan espacio para contar su historia con claridad y voz propia.", "Recruiting, narrativa y People / Spotlight se convierten aquí en una práctica compartida."],
      ["El concepto explora cómo hacer más visibles e independientes las perspectivas vividas del recorrido de candidatos y empleados.", "Actualmente es una reconstrucción: la dirección hacia la transparencia está documentada, no se presenta como una plataforma terminada."],
      ["Proyectos, conversaciones, Writing y herramientas pueden leerse como un sistema público conectado y localizable.", "La relación entre las piezas se convierte en parte del producto, no en un portafolio suelto."],
      ["FYNS hace visibles la situación, las preferencias, las condiciones y próximos pasos comprensibles.", "El contexto orienta; la decisión permanece en la persona."],
      ["Life Alignment ordena cualitativamente condiciones, prioridades, tensiones y direcciones deseadas.", "Comprender en lugar de medir, sin diagnóstico y con la interpretación en manos humanas."],
    ],
    tr: [
      ["İnsanlar, kariyer yolları ve hizmetler hikâyelerini açıkça ve kendi sesleriyle anlatacak alan bulur.", "İşe alım, hikâye anlatıcılığı ve People / Spotlight burada ortak bir uygulamaya dönüşür."],
      ["Konsept, aday ve çalışan yolculuğunda yaşanan perspektiflerin nasıl daha bağımsız görünür olabileceğini araştırır.", "Şu anda yeniden kuruluyor; şeffaflık yönü belgeleniyor, bitmiş bir platform gibi sunulmuyor."],
      ["Projeler, sohbetler, Writing ve araçlar bağlantılı, aranabilir bir kamusal sistem olarak okunabilir.", "Parçalar arasındaki bağ, dağınık bir portföy yerine ürünün kendisine dönüşür."],
      ["FYNS durumu, tercihleri, koşulları ve anlaşılır sonraki adımları görünür kılar.", "Bağlam yön verir; karar insanda kalır."],
      ["Life Alignment bugünkü koşulları, öncelikleri, gerilimleri ve istenen yönleri niteliksel olarak düzenler.", "Ölçmek yerine anlamak; tanı koymadan ve yorum yetkisini insanda bırakarak."],
    ],
    pl: [
      ["Ludzie, ścieżki zawodowe i usługi zyskują przestrzeń, by opowiadać swoje historie jasno i własnym głosem.", "Rekrutacja, storytelling i People / Spotlight stają się tu wspólną praktyką."],
      ["Koncepcja bada, jak niezależniej uwidaczniać realne doświadczenia kandydatów i pracowników.", "Obecnie trwa przebudowa — kierunek ku przejrzystości jest udokumentowany, nie przedstawiany jako gotowa platforma."],
      ["Projekty, rozmowy, Writing i narzędzia tworzą połączony, przeszukiwalny system publiczny.", "Sama relacja między elementami staje się częścią produktu, zamiast luźnego portfolio."],
      ["FYNS uwidacznia sytuację, preferencje, warunki i zrozumiałe kolejne kroki.", "Kontekst pomaga się orientować; decyzja zostaje przy człowieku."],
      ["Life Alignment jakościowo porządkuje obecne warunki, priorytety, napięcia i pożądane kierunki.", "Rozumienie zamiast mierzenia — bez diagnozy i z ludzkim prawem do interpretacji."],
    ],
    el: [
      ["Άνθρωποι, επαγγελματικές διαδρομές και υπηρεσίες αποκτούν χώρο να πουν καθαρά την ιστορία τους με τη δική τους φωνή.", "Το recruiting, η αφήγηση και το People / Spotlight γίνονται εδώ κοινή πρακτική."],
      ["Η ιδέα διερευνά πώς οι βιωμένες οπτικές υποψηφίων και εργαζομένων μπορούν να γίνουν πιο ανεξάρτητα ορατές.", "Βρίσκεται σε επανασχεδιασμό — η κατεύθυνση προς τη διαφάνεια τεκμηριώνεται, δεν παρουσιάζεται ως ολοκληρωμένη πλατφόρμα."],
      ["Έργα, συζητήσεις, Writing και εργαλεία διαβάζονται ως ένα συνδεδεμένο, αναζητήσιμο δημόσιο σύστημα.", "Η μεταξύ τους σχέση γίνεται μέρος του προϊόντος, αντί για ένα ασύνδετο portfolio."],
      ["Το FYNS κάνει ορατά την κατάσταση, τις προτιμήσεις, τις συνθήκες και κατανοητά επόμενα βήματα.", "Το πλαίσιο υποστηρίζει τον προσανατολισμό· η απόφαση μένει στον άνθρωπο."],
      ["Το Life Alignment οργανώνει ποιοτικά παρούσες συνθήκες, προτεραιότητες, εντάσεις και επιθυμητές κατευθύνσεις.", "Κατανόηση αντί για μέτρηση — χωρίς διάγνωση και με ανθρώπινη εξουσία ερμηνείας."],
    ],
    ru: [
      ["Люди, карьерные пути и услуги получают пространство, чтобы ясно рассказывать свои истории собственным голосом.", "Рекрутинг, сторителлинг и People / Spotlight становятся здесь общей практикой."],
      ["Концепция исследует, как независимо показывать реальный опыт кандидатов и сотрудников.", "Сейчас идёт перестройка: направление к прозрачности документируется, а не выдаётся за готовую платформу."],
      ["Проекты, разговоры, Writing и инструменты складываются в связанную, доступную для поиска публичную систему.", "Связь между частями становится частью продукта вместо разрозненного портфолио."],
      ["FYNS делает видимыми ситуацию, предпочтения, условия и понятные следующие шаги.", "Контекст помогает ориентироваться; решение остаётся у человека."],
      ["Life Alignment качественно упорядочивает нынешние условия, приоритеты, напряжения и желаемые направления.", "Понимание вместо измерения — без диагноза и с правом человека на интерпретацию."],
    ],
  }[locale];
  const toolProblems: Record<ExtendedLocale, readonly [string, string]> = {
    es: ["Las preguntas de orientación suelen recibir recomendaciones genéricas o una supuesta respuesta correcta.", "Reflexionar sobre la vida y las relaciones puede reducir a las personas a puntuaciones, tipos o una dirección supuestamente correcta."],
    tr: ["Yön soruları çoğu zaman genel tavsiye ya da sözde doğru bir yanıtla karşılanır.", "Hayat ve ilişki üzerine düşünme, insanları puanlara, tiplere veya sözde doğru bir yöne indirgeyebilir."],
    pl: ["Pytania o kierunek szybko spotykają się z ogólnymi radami lub rzekomo poprawną odpowiedzią.", "Refleksja nad życiem i relacjami może sprowadzać ludzi do wyników, typów lub rzekomo właściwego kierunku."],
    el: ["Τα ερωτήματα προσανατολισμού συχνά απαντώνται με γενικές συστάσεις ή μια υποτιθέμενα σωστή απάντηση.", "Ο αναστοχασμός για ζωή και σχέσεις μπορεί να μειώσει τους ανθρώπους σε βαθμολογίες, τύπους ή μια υποτιθέμενα σωστή κατεύθυνση."],
    ru: ["На вопросы о направлении часто отвечают общими рекомендациями или якобы правильным решением.", "Размышления о жизни и отношениях могут сводить людей к баллам, типам или якобы правильному направлению."],
  };
  const [goatrec, ratecom, digitalHq] = projects;
  return [
    { name: goatrec!.name, href: `/projects/${goatrec!.slug}`, status: goatrec!.status, problem: goatrec!.problem, change: copy[0][0], connection: copy[0][1], externalUrl: goatrec!.externalUrl },
    { name: ratecom!.name, href: `/projects/${ratecom!.slug}`, status: ratecom!.status, problem: ratecom!.problem, change: copy[1][0], connection: copy[1][1], externalUrl: ratecom!.externalUrl },
    { name: digitalHq!.name, href: `/projects/${digitalHq!.slug}`, status: digitalHq!.status, problem: digitalHq!.problem, change: copy[2][0], connection: copy[2][1] },
    { name: "Find Your Next Step", href: "/find-your-next-step", status: "4 journeys · Beta", problem: toolProblems[locale][0], change: copy[3][0], connection: copy[3][1] },
    { name: "Life Alignment", href: "/life-alignment", status: "3 perspectives · Beta", problem: toolProblems[locale][1], change: copy[4][0], connection: copy[4][1] },
  ];
}

function getGermanAboutContent() {
  return {
    positioning: germanPositioning,
    values: germanValues,
    redThreadExamples,
    projectEvidence: aboutProjectEvidence.map((project) => ({ ...project, status: germanProjectStatus[project.status] ?? project.status })),
    ownerStories: germanOwnerStories,
  };
}

function getEnglishAboutContent() {
  return {
    positioning: englishPositioning,
    values: englishValues,
    redThreadExamples: englishRedThread,
    projectEvidence: englishProjectEvidence(),
    ownerStories: englishOwnerStories,
  };
}

function getExtendedAboutContent(locale: ExtendedLocale) {
  const storyCopy = extendedStoryCopy[locale];
  return {
    positioning: extendedPositioning[locale],
    values: extendedValues[locale],
    redThreadExamples: extendedRedThread[locale],
    projectEvidence: extendedProjectEvidence(locale),
    ownerStories: ownerStories.map((story, index) => ({ ...story, ...storyCopy[index], sourceLanguage: "de" as const })),
  };
}

const aboutContentProviders = {
  de: getGermanAboutContent,
  en: getEnglishAboutContent,
  es: () => getExtendedAboutContent("es"),
  tr: () => getExtendedAboutContent("tr"),
  pl: () => getExtendedAboutContent("pl"),
  el: () => getExtendedAboutContent("el"),
  ru: () => getExtendedAboutContent("ru"),
} satisfies Record<Locale, () => unknown>;

export function getAboutContent(locale: Locale) {
  return aboutContentProviders[locale]();
}

type AboutPageCopy = {
  title: string;
  description: string;
  breadcrumb: string;
  heroEyebrow: string;
  heroLineOne: string;
  heroLineTwo: string;
  primaryPositioning: string;
  fieldsLabel: string;
  redThread: string;
  redThreadTitle: string;
  redThreadParagraphs: readonly string[];
  signal: string;
  missing: string;
  change: string;
  thinking: string;
  thinkingTitle: string;
  thinkingDescription: string;
  principle: string;
  journey: string;
  journeyTitle: string;
  journeyParagraphs: readonly string[];
  temporalHonesty: string;
  temporalNote: string;
  work: string;
  workTitle: string;
  workDescription: string;
  humanProblem: string;
  changePursued: string;
  openProject: string;
  publicWebsite: string;
  publishedConversations: string;
  peopleTitle: string;
  peopleDescription: string;
  peopleQuestion: string;
  peopleCta: string;
  sources: string;
  sourcesTitle: string;
  sourcesDescription: string;
  sourceOrder: string;
  originalVideoTitle: string;
  perspectiveBoundary: string;
  currently: string;
  currentSignal: string;
  currentDescription: string;
  paths: string;
  pathsTitle: string;
  pathItems: readonly { label: string; note: string; href: string }[];
  contactEyebrow: string;
  contactTitle: string;
  contactDescription: string;
  contactCta: string;
};

const pageCopy: Record<Locale, AboutPageCopy> = {
  de: {
    title: "Benjamin Trinidad Segura — Über mich & Arbeit | bts.online",
    description: "Benjamin Trinidad Segura verbindet Recruiting, Talent Acquisition, Storytelling und Product Thinking, um fehlenden menschlichen Kontext sichtbar zu machen.",
    breadcrumb: "Über mich",
    heroEyebrow: "Über mich / Benjamin Trinidad Segura",
    heroLineOne: "Fehlenden",
    heroLineTwo: "Kontext sichtbar machen.",
    primaryPositioning: "Zentrale Positionierung",
    fieldsLabel: "Arbeitsfelder",
    redThread: "Der rote Faden",
    redThreadTitle: "Die Projekte kamen zuerst. Das Muster wurde später klarer.",
    redThreadParagraphs: ["Systeme müssen vereinfachen. Schwierig wird es, wenn ein dünnes Signal für den ganzen Menschen gehalten wird: ein Titel für eine Laufbahn, eine Bewertung für eine Erfahrung, eine Auswahl für einen Wunsch.", "Human Context meint das, was eine Entscheidung verändert, sobald es sichtbar wird: Herkunft und Erfahrung, Motive und Unsicherheit, Beziehungen, reale Grenzen und die Bedingungen, unter denen etwas tatsächlich passt."],
    signal: "Das Signal", missing: "Was fehlen kann", change: "Die menschliche Veränderung",
    thinking: "Wie ich denke", thinkingTitle: "Vier Arbeitsprinzipien. Keine Persönlichkeitswerte.", thinkingDescription: "Sie sind aus wiederkehrenden Entscheidungen in den veröffentlichten Formaten und Produkten abgeleitet — nicht als fertige Philosophie rückwirkend über jedes frühere Projekt gelegt.", principle: "Prinzip",
    journey: "Von Recruiting zu Produkten", journeyTitle: "Nicht vom Jobtitel zur nächsten Schublade.",
    journeyParagraphs: ["Recruiting und Talent Acquisition bilden einen wichtigen Ausgangspunkt: Kandidat:innen, Unternehmen, Anforderungen, Prozesse und die Frage, warum zwei Seiten wirklich zueinander passen. GOATRECRUTAINER erweitert diese Arbeit um Storytelling, Interviews, Community und die Idee, Menschen eine Bühne zu geben.", "Die späteren digitalen Produkte bearbeiten andere Situationen, stellen aber eine verwandte Frage: Was soll für den Menschen sinnvoll anders werden — und welchen Kontext braucht es dafür? FYNS ordnet mögliche nächste Schritte. Life Alignment macht heutige Bedingungen und gewünschte Richtung besprechbar. bts.online hält die Beziehungen zwischen diesen Arbeiten sichtbar."],
    temporalHonesty: "Zeitliche Ehrlichkeit", temporalNote: "Das ist eine heutige Synthese aus sichtbarer Arbeit — keine Behauptung, dass jedes Projekt von Anfang an nach einem fertigen „Human Context“-System entworfen wurde.",
    work: "Die Arbeit als Beleg", workTitle: "Fünf Arbeiten. Fünf unterschiedliche Kontexte.", workDescription: "Nicht als Werbewand, sondern als prüfbare Verbindung zwischen Problem, angestrebter Veränderung und aktuellem Stand.", humanProblem: "Menschliches Problem", changePursued: "Angestrebte Veränderung", openProject: "Projektkontext öffnen", publicWebsite: "Öffentliche Website",
    publishedConversations: "veröffentlichte Gespräche · Career + Service", peopleTitle: "Ein Titel benennt eine Rolle. Ein Gespräch zeigt einen Menschen.", peopleDescription: "Career Spotlight und Service Spotlight fragen nach Herkunft, Entscheidungen, Arbeit, Ambition und Erfahrung hinter dem sichtbaren Profil. Die Gespräche sind älter als diese heutige Positionierung; rückblickend zeigen sie denselben Impuls: Menschen nicht auf die kürzeste verfügbare Beschreibung zu reduzieren.", peopleQuestion: "„Was aus deiner Kindheit muss man wissen, um dich und deinen Lebenslauf zu verstehen?“", peopleCta: "People / Spotlight entdecken",
    sources: "Quellenebenen", sourcesTitle: "Eigene Worte zuerst. Interpretation danach.", sourcesDescription: "Die beiden Videos haben bewusst unterschiedliches Gewicht: direkte Selbstbeschreibung auf der einen, klar begrenzte AI-assisted Perspektive auf der anderen Seite.", sourceOrder: "Quellenreihenfolge", originalVideoTitle: "Originaltitel des Videos", perspectiveBoundary: "Grenze der Perspektive",
    currently: "Aktuell", currentSignal: "Das aktuelle Signal.", currentDescription: "Aus derselben kanonischen Now-Quelle wie auf der Startseite — kein zweiter, still veraltender Status.",
    paths: "Weiter ins HQ", pathsTitle: "Der Kontext endet nicht auf dieser Seite.", pathItems: [{ label: "Projekte", note: "Produkte, Plattformen und Konzepte", href: "/#building" }, { label: "People / Spotlight", note: "Gespräche hinter Rollen und Lebensläufen", href: "/people" }, { label: "Writing", note: "Field Notes, Essays und Gedanken", href: "/writing" }, { label: "Tools", note: "FYNS und Life Alignment ausprobieren", href: "/find-your-next-step" }],
    contactEyebrow: "Kontakt", contactTitle: "Kontext wird im Gespräch nützlich.", contactDescription: "Für Recruiting, Interviews, Produkte, Partnerschaften oder Ideen, die mehr als eine Kurzbeschreibung brauchen.", contactCta: "Kontaktwege öffnen",
  },
  en: {
    title: "Benjamin Trinidad Segura — About & Work | bts.online",
    description: "Benjamin Trinidad Segura brings together recruiting, talent acquisition, storytelling and product thinking to make missing human context visible.",
    breadcrumb: "About",
    heroEyebrow: "About / Benjamin Trinidad Segura",
    heroLineOne: "Make the missing",
    heroLineTwo: "context visible.",
    primaryPositioning: "Primary positioning",
    fieldsLabel: "Fields of work",
    redThread: "The red thread",
    redThreadTitle: "The projects came first. The pattern became clearer later.",
    redThreadParagraphs: ["Systems have to simplify. It becomes difficult when a thin signal is mistaken for the whole person: a title for a career, a rating for an experience, a selection for a desire.", "Human Context means what changes a decision once it becomes visible: origins and experience, motives and uncertainty, relationships, real constraints and the conditions under which something actually fits."],
    signal: "The signal", missing: "What may be missing", change: "The human change",
    thinking: "How I think", thinkingTitle: "Four working principles. Not personality scores.", thinkingDescription: "They are drawn from recurring decisions in the published formats and products — not retrofitted over every earlier project as a finished philosophy.", principle: "Principle",
    journey: "From recruiting to products", journeyTitle: "Not from one job title to the next box.",
    journeyParagraphs: ["Recruiting and talent acquisition are an important starting point: candidates, organisations, requirements, processes and the question of why two sides genuinely fit. GOATRECRUTAINER extends that work through storytelling, interviews, community and the idea of giving people a stage.", "The later digital products address different situations but ask a related question: what should become meaningfully different for the person — and what context is needed? FYNS organises possible next steps. Life Alignment makes present conditions and desired direction discussable. bts.online keeps the relationships between this work visible."],
    temporalHonesty: "Temporal honesty", temporalNote: "This is a present-day synthesis of visible work — not a claim that every project was designed around a finished ‘Human Context’ system from the beginning.",
    work: "The work as evidence", workTitle: "Five pieces of work. Five different contexts.", workDescription: "Not as an advertising wall, but as a traceable link between a problem, the change being pursued and the current state.", humanProblem: "Human problem", changePursued: "Change pursued", openProject: "Open project context", publicWebsite: "Public website",
    publishedConversations: "published conversations · Career + Service", peopleTitle: "A title names a role. A conversation reveals a person.", peopleDescription: "Career Spotlight and Service Spotlight ask about the origins, decisions, work, ambition and experience behind the visible profile. The conversations predate this positioning; in retrospect they show the same impulse: not reducing people to the shortest description available.", peopleQuestion: "“What from your childhood do we need to know to understand you and your CV?”", peopleCta: "Explore People / Spotlight",
    sources: "Source layers", sourcesTitle: "Own words first. Interpretation second.", sourcesDescription: "The two videos deliberately carry different weight: a direct self-description on one side and a clearly bounded AI-assisted perspective on the other.", sourceOrder: "Source order", originalVideoTitle: "Original video title", perspectiveBoundary: "Perspective boundary",
    currently: "Currently", currentSignal: "The current signal.", currentDescription: "Drawn from the same canonical Now source as the homepage — not a second status that can quietly become outdated.",
    paths: "Continue through the HQ", pathsTitle: "The context does not end on this page.", pathItems: [{ label: "Projects", note: "Products, platforms and concepts", href: "/#building" }, { label: "People / Spotlight", note: "Conversations behind roles and CVs", href: "/people" }, { label: "Writing", note: "Field Notes, essays and thoughts", href: "/writing" }, { label: "Tools", note: "Try FYNS and Life Alignment", href: "/find-your-next-step" }],
    contactEyebrow: "Contact", contactTitle: "Context becomes useful in conversation.", contactDescription: "For recruiting, interviews, products, partnerships or ideas that need more than a short description.", contactCta: "Open contact options",
  },
  es: {
    title: "Benjamin Trinidad Segura — Sobre mí y trabajo | bts.online", description: "Benjamin Trinidad Segura conecta recruiting, adquisición de talento, narrativa y pensamiento de producto para hacer visible el contexto humano que falta.", breadcrumb: "Sobre mí", heroEyebrow: "Sobre mí / Benjamin Trinidad Segura", heroLineOne: "Hacer visible el", heroLineTwo: "contexto que falta.", primaryPositioning: "Posicionamiento central", fieldsLabel: "Ámbitos de trabajo", redThread: "El hilo conductor", redThreadTitle: "Los proyectos llegaron primero. El patrón se aclaró después.", redThreadParagraphs: ["Los sistemas necesitan simplificar. El problema aparece cuando una señal limitada se toma por la persona entera: un título por una trayectoria, una puntuación por una experiencia, una elección por un deseo.", "Human Context es aquello que cambia una decisión cuando se vuelve visible: origen y experiencia, motivos e incertidumbre, relaciones, límites reales y las condiciones en las que algo encaja de verdad."], signal: "La señal", missing: "Lo que puede faltar", change: "El cambio humano", thinking: "Cómo pienso", thinkingTitle: "Cuatro principios de trabajo. No puntuaciones de personalidad.", thinkingDescription: "Surgen de decisiones recurrentes en formatos y productos publicados; no son una filosofía terminada aplicada a posteriori a cada proyecto anterior.", principle: "Principio", journey: "Del recruiting a los productos", journeyTitle: "No pasar de un cargo a la siguiente casilla.", journeyParagraphs: ["El recruiting y la adquisición de talento son un punto de partida importante: candidatos, organizaciones, necesidades, procesos y la pregunta de por qué dos partes encajan de verdad. GOATRECRUTAINER amplía ese trabajo con narrativa, entrevistas, comunidad y la idea de dar espacio a las personas.", "Los productos digitales posteriores abordan situaciones distintas, pero comparten una pregunta: ¿qué debería cambiar de forma significativa para la persona y qué contexto hace falta? FYNS ordena posibles próximos pasos. Life Alignment permite hablar de la situación actual y la dirección deseada. bts.online mantiene visibles las relaciones entre estos trabajos."], temporalHonesty: "Honestidad temporal", temporalNote: "Es una síntesis actual del trabajo visible, no la afirmación de que cada proyecto naciera de un sistema ‘Human Context’ ya terminado.", work: "El trabajo como evidencia", workTitle: "Cinco trabajos. Cinco contextos distintos.", workDescription: "No como escaparate publicitario, sino como vínculo comprobable entre un problema, el cambio buscado y el estado actual.", humanProblem: "Problema humano", changePursued: "Cambio buscado", openProject: "Abrir contexto del proyecto", publicWebsite: "Sitio web público", publishedConversations: "conversaciones publicadas · Career + Service", peopleTitle: "Un título nombra un rol. Una conversación muestra a una persona.", peopleDescription: "Career Spotlight y Service Spotlight preguntan por el origen, las decisiones, el trabajo, la ambición y la experiencia detrás del perfil visible. Las conversaciones son anteriores a este posicionamiento; vistas hoy, muestran el mismo impulso: no reducir a las personas a la descripción más breve disponible.", peopleQuestion: "«¿Qué debemos saber de tu infancia para comprenderte a ti y a tu currículum?»", peopleCta: "Explorar People / Spotlight", sources: "Capas de fuente", sourcesTitle: "Primero las palabras propias. Después, la interpretación.", sourcesDescription: "Los dos vídeos tienen deliberadamente un peso distinto: una descripción directa en primera persona y una perspectiva asistida por IA con límites claros.", sourceOrder: "Orden de fuentes", originalVideoTitle: "Título original del vídeo", perspectiveBoundary: "Límite de la perspectiva", currently: "Ahora", currentSignal: "La señal actual.", currentDescription: "Procede de la misma fuente Now canónica que la página de inicio, no de un segundo estado que pueda quedarse obsoleto en silencio.", paths: "Seguir por el HQ", pathsTitle: "El contexto no termina en esta página.", pathItems: [{ label: "Proyectos", note: "Productos, plataformas y conceptos", href: "/#building" }, { label: "People / Spotlight", note: "Conversaciones detrás de roles y currículums", href: "/people" }, { label: "Writing", note: "Notas de campo, ensayos y pensamientos", href: "/writing" }, { label: "Herramientas", note: "Probar FYNS y Life Alignment", href: "/find-your-next-step" }], contactEyebrow: "Contacto", contactTitle: "El contexto se vuelve útil en la conversación.", contactDescription: "Para recruiting, entrevistas, productos, colaboraciones o ideas que necesitan más que una descripción breve.", contactCta: "Abrir opciones de contacto",
  },
  tr: {
    title: "Benjamin Trinidad Segura — Hakkımda ve çalışmalar | bts.online", description: "Benjamin Trinidad Segura, eksik insan bağlamını görünür kılmak için işe alım, yetenek kazanımı, hikâye anlatıcılığı ve ürün düşüncesini birleştiriyor.", breadcrumb: "Hakkımda", heroEyebrow: "Hakkımda / Benjamin Trinidad Segura", heroLineOne: "Eksik bağlamı", heroLineTwo: "görünür kıl.", primaryPositioning: "Temel konumlandırma", fieldsLabel: "Çalışma alanları", redThread: "Ortak çizgi", redThreadTitle: "Önce projeler geldi. Desen sonra netleşti.", redThreadParagraphs: ["Sistemler sadeleştirmek zorundadır. Sorun, sınırlı bir sinyal bütün insan sanıldığında başlar: bir unvan kariyerin, bir puan deneyimin, bir seçim isteğin tamamıymış gibi.", "Human Context, görünür olduğunda kararı değiştiren şeydir: köken ve deneyim, nedenler ve belirsizlik, ilişkiler, gerçek sınırlar ve bir şeyin gerçekten uyduğu koşullar."], signal: "Sinyal", missing: "Eksik olabilecekler", change: "İnsani değişim", thinking: "Nasıl düşünüyorum", thinkingTitle: "Dört çalışma ilkesi. Kişilik puanı değil.", thinkingDescription: "Yayımlanmış format ve ürünlerde tekrar eden kararlardan çıkarıldılar; eski her projenin üzerine sonradan yerleştirilmiş tamamlanmış bir felsefe değiller.", principle: "İlke", journey: "İşe alımdan ürünlere", journeyTitle: "Bir unvandan başka bir kutuya değil.", journeyParagraphs: ["İşe alım ve yetenek kazanımı önemli bir başlangıç noktası: adaylar, kuruluşlar, ihtiyaçlar, süreçler ve iki tarafın neden gerçekten uyduğu sorusu. GOATRECRUTAINER bu çalışmayı hikâye anlatıcılığı, röportajlar, topluluk ve insanlara alan açma fikriyle genişletiyor.", "Sonraki dijital ürünler farklı durumları ele alıyor ama aynı soruya yaklaşıyor: insan için anlamlı biçimde ne değişmeli ve bunun için hangi bağlam gerekli? FYNS olası sonraki adımları düzenler. Life Alignment bugünkü koşulları ve istenen yönü konuşulabilir kılar. bts.online bu çalışmalar arasındaki bağları görünür tutar."], temporalHonesty: "Zamansal dürüstlük", temporalNote: "Bu, görünür çalışmaların bugünkü bir sentezidir; her projenin en baştan tamamlanmış bir ‘Human Context’ sistemiyle tasarlandığı iddiası değildir.", work: "Kanıt olarak çalışmalar", workTitle: "Beş çalışma. Beş farklı bağlam.", workDescription: "Bir reklam duvarı olarak değil; sorun, hedeflenen değişim ve güncel durum arasında izlenebilir bir bağ olarak.", humanProblem: "İnsani sorun", changePursued: "Hedeflenen değişim", openProject: "Proje bağlamını aç", publicWebsite: "Herkese açık web sitesi", publishedConversations: "yayımlanmış sohbet · Career + Service", peopleTitle: "Bir unvan rolü söyler. Bir sohbet insanı gösterir.", peopleDescription: "Career Spotlight ve Service Spotlight, görünen profilin ardındaki kökeni, kararları, işi, hedefleri ve deneyimi sorar. Bu sohbetler bugünkü konumlandırmadan daha eski; geriye baktığımızda aynı isteği gösteriyor: insanları en kısa tanıma indirgememek.", peopleQuestion: "“Seni ve özgeçmişini anlamamız için çocukluğundan neyi bilmemiz gerekir?”", peopleCta: "People / Spotlight’ı keşfet", sources: "Kaynak katmanları", sourcesTitle: "Önce kendi sözleri. Sonra yorum.", sourcesDescription: "İki video bilinçli olarak farklı ağırlık taşır: bir yanda doğrudan öz anlatım, diğer yanda sınırları açıkça belirtilmiş yapay zekâ destekli perspektif.", sourceOrder: "Kaynak sırası", originalVideoTitle: "Videonun özgün başlığı", perspectiveBoundary: "Perspektifin sınırı", currently: "Şu anda", currentSignal: "Güncel sinyal.", currentDescription: "Ana sayfadaki aynı kanonik Now kaynağından gelir; sessizce eskiyebilecek ikinci bir durum değildir.", paths: "HQ’da devam et", pathsTitle: "Bağlam bu sayfada bitmiyor.", pathItems: [{ label: "Projeler", note: "Ürünler, platformlar ve konseptler", href: "/#building" }, { label: "People / Spotlight", note: "Rollerin ve özgeçmişlerin ardındaki sohbetler", href: "/people" }, { label: "Writing", note: "Saha notları, denemeler ve düşünceler", href: "/writing" }, { label: "Araçlar", note: "FYNS ve Life Alignment’ı dene", href: "/find-your-next-step" }], contactEyebrow: "İletişim", contactTitle: "Bağlam, sohbette işe yarar.", contactDescription: "Kısa bir tanımdan fazlasını gerektiren işe alım, röportaj, ürün, ortaklık ve fikirler için.", contactCta: "İletişim seçeneklerini aç",
  },
  pl: {
    title: "Benjamin Trinidad Segura — O mnie i pracy | bts.online", description: "Benjamin Trinidad Segura łączy rekrutację, pozyskiwanie talentów, storytelling i myślenie produktowe, aby uwidaczniać brakujący ludzki kontekst.", breadcrumb: "O mnie", heroEyebrow: "O mnie / Benjamin Trinidad Segura", heroLineOne: "Uwidaczniać", heroLineTwo: "brakujący kontekst.", primaryPositioning: "Główne pozycjonowanie", fieldsLabel: "Obszary pracy", redThread: "Wspólny wątek", redThreadTitle: "Najpierw były projekty. Wzorzec stał się wyraźny później.", redThreadParagraphs: ["Systemy muszą upraszczać. Problem zaczyna się, gdy wąski sygnał bierze się za całego człowieka: stanowisko za karierę, ocenę za doświadczenie, wybór za pragnienie.", "Human Context oznacza to, co zmienia decyzję, gdy staje się widoczne: pochodzenie i doświadczenie, motywacje i niepewność, relacje, realne ograniczenia oraz warunki, w których coś naprawdę pasuje."], signal: "Sygnał", missing: "Czego może brakować", change: "Ludzka zmiana", thinking: "Jak myślę", thinkingTitle: "Cztery zasady pracy. Nie skala osobowości.", thinkingDescription: "Wynikają z powtarzających się decyzji w opublikowanych formatach i produktach — nie są gotową filozofią dopisaną po czasie do każdego wcześniejszego projektu.", principle: "Zasada", journey: "Od rekrutacji do produktów", journeyTitle: "Nie od stanowiska do kolejnej szufladki.", journeyParagraphs: ["Rekrutacja i pozyskiwanie talentów są ważnym punktem wyjścia: kandydaci, organizacje, wymagania, procesy i pytanie, dlaczego dwie strony naprawdę do siebie pasują. GOATRECRUTAINER rozszerza tę pracę o storytelling, wywiady, społeczność i ideę dawania ludziom przestrzeni.", "Późniejsze produkty cyfrowe dotyczą innych sytuacji, lecz stawiają podobne pytanie: co powinno znacząco zmienić się dla człowieka i jaki kontekst jest potrzebny? FYNS porządkuje możliwe kolejne kroki. Life Alignment pozwala rozmawiać o obecnych warunkach i pożądanym kierunku. bts.online pokazuje relacje między tymi pracami."], temporalHonesty: "Uczciwość wobec czasu", temporalNote: "To dzisiejsza synteza widocznej pracy — nie twierdzenie, że każdy projekt od początku powstał wokół gotowego systemu „Human Context”.", work: "Praca jako dowód", workTitle: "Pięć prac. Pięć różnych kontekstów.", workDescription: "Nie jako ściana reklamowa, lecz jako możliwe do prześledzenia połączenie problemu, zamierzonej zmiany i obecnego stanu.", humanProblem: "Ludzki problem", changePursued: "Zamierzona zmiana", openProject: "Otwórz kontekst projektu", publicWebsite: "Publiczna witryna", publishedConversations: "opublikowanych rozmów · Career + Service", peopleTitle: "Tytuł nazywa rolę. Rozmowa pokazuje człowieka.", peopleDescription: "Career Spotlight i Service Spotlight pytają o pochodzenie, decyzje, pracę, ambicje i doświadczenie za widocznym profilem. Rozmowy powstały przed tym pozycjonowaniem; z dzisiejszej perspektywy widać ten sam impuls: nie sprowadzać ludzi do najkrótszego dostępnego opisu.", peopleQuestion: "„Co z twojego dzieciństwa musimy wiedzieć, żeby zrozumieć ciebie i twoje CV?”", peopleCta: "Odkryj People / Spotlight", sources: "Warstwy źródeł", sourcesTitle: "Najpierw własne słowa. Potem interpretacja.", sourcesDescription: "Oba filmy celowo mają inną wagę: z jednej strony bezpośredni opis siebie, z drugiej jasno ograniczona perspektywa wsparta przez AI.", sourceOrder: "Kolejność źródeł", originalVideoTitle: "Oryginalny tytuł filmu", perspectiveBoundary: "Granica perspektywy", currently: "Teraz", currentSignal: "Aktualny sygnał.", currentDescription: "Pochodzi z tego samego kanonicznego źródła Now co strona główna — to nie drugi status, który może po cichu się zdezaktualizować.", paths: "Dalej przez HQ", pathsTitle: "Kontekst nie kończy się na tej stronie.", pathItems: [{ label: "Projekty", note: "Produkty, platformy i koncepcje", href: "/#building" }, { label: "People / Spotlight", note: "Rozmowy za rolami i CV", href: "/people" }, { label: "Writing", note: "Notatki terenowe, eseje i myśli", href: "/writing" }, { label: "Narzędzia", note: "Wypróbuj FYNS i Life Alignment", href: "/find-your-next-step" }], contactEyebrow: "Kontakt", contactTitle: "Kontekst staje się użyteczny w rozmowie.", contactDescription: "Dla rekrutacji, wywiadów, produktów, partnerstw i pomysłów, które potrzebują więcej niż krótkiego opisu.", contactCta: "Otwórz możliwości kontaktu",
  },
  el: {
    title: "Benjamin Trinidad Segura — Σχετικά και δουλειά | bts.online", description: "Ο Benjamin Trinidad Segura συνδέει το recruiting, το talent acquisition, την αφήγηση και την προϊοντική σκέψη για να κάνει ορατό το ανθρώπινο πλαίσιο που λείπει.", breadcrumb: "Σχετικά", heroEyebrow: "Σχετικά / Benjamin Trinidad Segura", heroLineOne: "Να γίνεται ορατό", heroLineTwo: "το πλαίσιο που λείπει.", primaryPositioning: "Κεντρική τοποθέτηση", fieldsLabel: "Πεδία εργασίας", redThread: "Το κοινό νήμα", redThreadTitle: "Πρώτα ήρθαν τα έργα. Το μοτίβο ξεκαθάρισε αργότερα.", redThreadParagraphs: ["Τα συστήματα χρειάζεται να απλοποιούν. Η δυσκολία αρχίζει όταν ένα περιορισμένο σήμα θεωρείται ολόκληρος ο άνθρωπος: ένας τίτλος αντί για μια διαδρομή, μια βαθμολογία αντί για μια εμπειρία, μια επιλογή αντί για μια επιθυμία.", "Human Context είναι ό,τι αλλάζει μια απόφαση μόλις γίνει ορατό: καταγωγή και εμπειρία, κίνητρα και αβεβαιότητα, σχέσεις, πραγματικοί περιορισμοί και οι συνθήκες στις οποίες κάτι πράγματι ταιριάζει."], signal: "Το σήμα", missing: "Τι μπορεί να λείπει", change: "Η ανθρώπινη αλλαγή", thinking: "Πώς σκέφτομαι", thinkingTitle: "Τέσσερις αρχές εργασίας. Όχι βαθμολογίες προσωπικότητας.", thinkingDescription: "Προκύπτουν από επαναλαμβανόμενες αποφάσεις σε δημοσιευμένες μορφές και προϊόντα — δεν είναι μια έτοιμη φιλοσοφία που τοποθετήθηκε εκ των υστέρων πάνω σε κάθε παλιότερο έργο.", principle: "Αρχή", journey: "Από το recruiting στα προϊόντα", journeyTitle: "Όχι από έναν τίτλο στην επόμενη κατηγορία.", journeyParagraphs: ["Το recruiting και το talent acquisition είναι σημαντική αφετηρία: υποψήφιοι, οργανισμοί, απαιτήσεις, διαδικασίες και το ερώτημα γιατί δύο πλευρές ταιριάζουν πραγματικά. Το GOATRECRUTAINER επεκτείνει αυτή τη δουλειά με αφήγηση, συνεντεύξεις, κοινότητα και την ιδέα να δίνει χώρο στους ανθρώπους.", "Τα μεταγενέστερα ψηφιακά προϊόντα αφορούν διαφορετικές καταστάσεις, αλλά θέτουν παρόμοιο ερώτημα: τι χρειάζεται να αλλάξει ουσιαστικά για τον άνθρωπο και ποιο πλαίσιο απαιτείται; Το FYNS οργανώνει πιθανά επόμενα βήματα. Το Life Alignment κάνει συζητήσιμες τις παρούσες συνθήκες και την επιθυμητή κατεύθυνση. Το bts.online κρατά ορατές τις σχέσεις ανάμεσα σε αυτές τις δουλειές."], temporalHonesty: "Ειλικρίνεια στον χρόνο", temporalNote: "Αυτή είναι μια σημερινή σύνθεση της ορατής δουλειάς — όχι ισχυρισμός ότι κάθε έργο σχεδιάστηκε εξαρχής γύρω από ένα ολοκληρωμένο σύστημα «Human Context».", work: "Η δουλειά ως τεκμήριο", workTitle: "Πέντε έργα. Πέντε διαφορετικά πλαίσια.", workDescription: "Όχι ως διαφημιστικός τοίχος, αλλά ως ανιχνεύσιμη σύνδεση ανάμεσα στο πρόβλημα, την επιδιωκόμενη αλλαγή και την τρέχουσα κατάσταση.", humanProblem: "Ανθρώπινο πρόβλημα", changePursued: "Επιδιωκόμενη αλλαγή", openProject: "Άνοιξε το πλαίσιο του έργου", publicWebsite: "Δημόσιος ιστότοπος", publishedConversations: "δημοσιευμένες συζητήσεις · Career + Service", peopleTitle: "Ένας τίτλος ονομάζει έναν ρόλο. Μια συζήτηση αποκαλύπτει έναν άνθρωπο.", peopleDescription: "Τα Career Spotlight και Service Spotlight ρωτούν για την καταγωγή, τις αποφάσεις, τη δουλειά, τη φιλοδοξία και την εμπειρία πίσω από το ορατό προφίλ. Οι συζητήσεις προϋπήρχαν αυτής της τοποθέτησης· εκ των υστέρων δείχνουν την ίδια πρόθεση: να μη μειώνουμε τους ανθρώπους στη συντομότερη διαθέσιμη περιγραφή.", peopleQuestion: "«Τι χρειάζεται να γνωρίζουμε από την παιδική σου ηλικία για να καταλάβουμε εσένα και το βιογραφικό σου;»", peopleCta: "Εξερεύνησε το People / Spotlight", sources: "Επίπεδα πηγών", sourcesTitle: "Πρώτα τα δικά τους λόγια. Μετά η ερμηνεία.", sourcesDescription: "Τα δύο βίντεο έχουν σκόπιμα διαφορετικό βάρος: άμεση αυτοπεριγραφή από τη μία και σαφώς οριοθετημένη οπτική με υποστήριξη ΤΝ από την άλλη.", sourceOrder: "Σειρά πηγών", originalVideoTitle: "Πρωτότυπος τίτλος βίντεο", perspectiveBoundary: "Όριο της οπτικής", currently: "Τώρα", currentSignal: "Το τρέχον σήμα.", currentDescription: "Προέρχεται από την ίδια κανονική πηγή Now με την αρχική σελίδα — όχι από μια δεύτερη κατάσταση που μπορεί να παλιώσει αθόρυβα.", paths: "Συνέχισε στο HQ", pathsTitle: "Το πλαίσιο δεν τελειώνει σε αυτή τη σελίδα.", pathItems: [{ label: "Έργα", note: "Προϊόντα, πλατφόρμες και ιδέες", href: "/#building" }, { label: "People / Spotlight", note: "Συζητήσεις πίσω από ρόλους και βιογραφικά", href: "/people" }, { label: "Writing", note: "Σημειώσεις, δοκίμια και σκέψεις", href: "/writing" }, { label: "Εργαλεία", note: "Δοκίμασε FYNS και Life Alignment", href: "/find-your-next-step" }], contactEyebrow: "Επικοινωνία", contactTitle: "Το πλαίσιο γίνεται χρήσιμο μέσα στη συζήτηση.", contactDescription: "Για recruiting, συνεντεύξεις, προϊόντα, συνεργασίες ή ιδέες που χρειάζονται περισσότερα από μια σύντομη περιγραφή.", contactCta: "Άνοιξε τους τρόπους επικοινωνίας",
  },
  ru: {
    title: "Benjamin Trinidad Segura — Обо мне и работе | bts.online", description: "Benjamin Trinidad Segura соединяет рекрутинг, поиск талантов, сторителлинг и продуктовое мышление, чтобы делать видимым недостающий человеческий контекст.", breadcrumb: "Обо мне", heroEyebrow: "Обо мне / Benjamin Trinidad Segura", heroLineOne: "Делать видимым", heroLineTwo: "недостающий контекст.", primaryPositioning: "Основное позиционирование", fieldsLabel: "Направления работы", redThread: "Общая линия", redThreadTitle: "Сначала появились проекты. Общий узор стал понятен позже.", redThreadParagraphs: ["Системам приходится упрощать. Проблема начинается, когда ограниченный сигнал принимают за всего человека: должность — за карьеру, оценку — за опыт, выбор — за желание.", "Human Context — это то, что меняет решение, когда становится видимым: происхождение и опыт, мотивы и неопределённость, отношения, реальные ограничения и условия, в которых что-то действительно подходит."], signal: "Сигнал", missing: "Чего может не хватать", change: "Изменение для человека", thinking: "Как я думаю", thinkingTitle: "Четыре рабочих принципа. Не оценки личности.", thinkingDescription: "Они вытекают из повторяющихся решений в опубликованных форматах и продуктах, а не являются готовой философией, задним числом наложенной на каждый прежний проект.", principle: "Принцип", journey: "От рекрутинга к продуктам", journeyTitle: "Не из одной должности в следующую ячейку.", journeyParagraphs: ["Рекрутинг и поиск талантов — важная отправная точка: кандидаты, организации, требования, процессы и вопрос, почему две стороны действительно подходят друг другу. GOATRECRUTAINER расширяет эту работу через сторителлинг, интервью, сообщество и идею давать людям пространство быть услышанными.", "Более поздние цифровые продукты работают с другими ситуациями, но задают близкий вопрос: что должно осмысленно измениться для человека и какой контекст для этого нужен? FYNS упорядочивает возможные следующие шаги. Life Alignment помогает обсуждать нынешние условия и желаемое направление. bts.online сохраняет видимыми связи между этими работами."], temporalHonesty: "Честность во времени", temporalNote: "Это сегодняшнее обобщение видимой работы, а не утверждение, что каждый проект изначально создавался вокруг готовой системы «Human Context».", work: "Работа как подтверждение", workTitle: "Пять работ. Пять разных контекстов.", workDescription: "Не рекламная витрина, а прослеживаемая связь между проблемой, желаемым изменением и текущим состоянием.", humanProblem: "Человеческая проблема", changePursued: "Желаемое изменение", openProject: "Открыть контекст проекта", publicWebsite: "Публичный сайт", publishedConversations: "опубликованных разговоров · Career + Service", peopleTitle: "Должность называет роль. Разговор показывает человека.", peopleDescription: "Career Spotlight и Service Spotlight спрашивают о происхождении, решениях, работе, стремлениях и опыте за видимым профилем. Эти разговоры появились раньше нынешнего позиционирования; теперь в них виден тот же импульс: не сводить человека к самому короткому доступному описанию.", peopleQuestion: "«Что нам нужно знать о вашем детстве, чтобы понять вас и ваше резюме?»", peopleCta: "Открыть People / Spotlight", sources: "Уровни источников", sourcesTitle: "Сначала собственные слова. Затем интерпретация.", sourcesDescription: "Два видео намеренно имеют разный вес: прямое описание от первого лица с одной стороны и чётко ограниченная перспектива с поддержкой ИИ с другой.", sourceOrder: "Порядок источников", originalVideoTitle: "Оригинальное название видео", perspectiveBoundary: "Граница перспективы", currently: "Сейчас", currentSignal: "Текущий сигнал.", currentDescription: "Он берётся из того же канонического источника Now, что и на главной странице, а не из второго статуса, который может незаметно устареть.", paths: "Продолжить по HQ", pathsTitle: "Контекст не заканчивается на этой странице.", pathItems: [{ label: "Проекты", note: "Продукты, платформы и концепции", href: "/#building" }, { label: "People / Spotlight", note: "Разговоры за ролями и резюме", href: "/people" }, { label: "Writing", note: "Полевые заметки, эссе и мысли", href: "/writing" }, { label: "Инструменты", note: "Попробовать FYNS и Life Alignment", href: "/find-your-next-step" }], contactEyebrow: "Контакт", contactTitle: "Контекст становится полезным в разговоре.", contactDescription: "Для рекрутинга, интервью, продуктов, партнёрств и идей, которым нужно больше, чем краткое описание.", contactCta: "Открыть способы связи",
  },
};

export function getAboutPageCopy(locale: Locale): AboutPageCopy {
  return pageCopy[locale];
}
