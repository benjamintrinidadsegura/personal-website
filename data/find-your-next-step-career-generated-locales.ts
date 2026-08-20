import type { Locale } from "@/lib/i18n/config";
import type { CareerNextStepMode, CareerQualificationScope } from "@/types/find-your-next-step";

type ExtendedLocale = Exclude<Locale, "de" | "en">;

export type CareerGeneratedCopy = {
  and: string;
  title: string;
  description: string;
  selected: (selected: number, maximum: number) => string;
  one: string;
  exact: (count: number) => string;
  range: (minimum: number, maximum: number) => string;
  maximum: (count: number) => string;
  incomplete: string;
  whyOne: (signal: string) => string;
  whyTwo: (first: string, second: string) => string;
  summaryTwo: (first: string, second: string) => string;
  summaryOne: (signal: string) => string;
  summaryOpen: string;
  contextTwo: (first: string, second: string) => string;
  contextOne: (signal: string) => string;
  constraint: (value: string) => string;
  qualification: Record<CareerQualificationScope, string>;
  jobHybrid: string;
  jobTwo: (first: string, second: string) => string;
  jobOpen: string;
  jobPrimary: (direction: string) => string;
  jobAdditional: (direction: string) => string;
  next: Record<CareerNextStepMode, {
    title: string;
    generic: string;
    withDirections: (first: string, second?: string) => string;
  }>;
};

export const careerGeneratedCopy: Record<ExtendedLocale, CareerGeneratedCopy> = {
  es: {
    and: "y", title: "Tu mapa profesional", description: "Una instantánea local de posibles espacios de exploración profesional; no es una evaluación de tu persona ni una decisión sobre una profesión.",
    selected: (n, m) => `${n} de ${m} seleccionadas`, one: "Elige una respuesta.", exact: (n) => `Elige exactamente ${n} respuestas.`, range: (a, b) => `Elige entre ${a} y ${b} respuestas.`, maximum: (n) => `Puedes elegir como máximo ${n} respuestas.`, incomplete: "Responde a todas las preguntas antes de abrir tu mapa profesional.",
    whyOne: (a) => `En tus elecciones destaca especialmente este punto de conexión: ${a}.`, whyTwo: (a, b) => `Tus elecciones reflejan especialmente ${a} y ${b}.`,
    summaryTwo: (a, b) => `Tus elecciones te acercan sobre todo a un trabajo que combine estas actividades: ${a} y ${b}.`, summaryOne: (a) => `Tus elecciones muestran con cautela interés por esta actividad: ${a}.`, summaryOpen: "Tus elecciones abren varias pistas profesionales sin que domine claramente un único patrón de actividad.", contextTwo: (a, b) => `En ese contexto parecen importantes ${a} y ${b}.`, contextOne: (a) => `${a} aparece como un punto de conexión recurrente.`, constraint: (v) => `Conviene integrar esta condición desde el comienzo de la exploración: ${v}.`,
    qualification: { short: "Has elegido un marco breve de cualificación.", "several-months": "Para ti son realistas varios meses de cualificación.", "formal-open": "También puedes considerar vías de cualificación más largas.", undecided: "Tu marco de cualificación sigue abierto." },
    jobHybrid: "Este puesto conecta dos de tus pistas de exploración más visibles.", jobTwo: (a, b) => `Este puesto toca las pistas visibles «${a}» y «${b}».`, jobOpen: "Este título es un término de búsqueda abierto para seguir investigando.", jobPrimary: (d) => `Este término concreta tu pista visible «${d}».`, jobAdditional: (d) => `Este término abre una búsqueda concreta dentro de la pista adicional «${d}».`,
    next: {
      conversation: { title: "Habla sobre puestos concretos", generic: "Elige dos actividades de tus respuestas y habla con alguien que las conozca en su trabajo cotidiano.", withDirections: (a, b) => `Habla con alguien de «${a}»${b ? ` y con alguien de «${b}»` : ""}. Pregunta por tareas, ritmo, acceso y aspectos difíciles.` },
      "role-comparison": { title: "Compara tareas reales, no solo títulos", generic: "Compara seis descripciones de puestos y marca actividades, condiciones y requisitos de acceso recurrentes.", withDirections: (a, b) => `Compara puestos de «${a}»${b ? ` y «${b}»` : ""} por sus tareas, condiciones y requisitos reales.` },
      "mini-project": { title: "Prueba un miniproyecto", generic: "Simula dos actividades elegidas durante 45 minutos cada una y anota interés, energía y preguntas abiertas.", withDirections: (a, b) => `Diseña una prueba breve para «${a}»${b ? ` y otra para «${b}»` : ""}; después compara lo observado.` },
      "skill-test": { title: "Pon a prueba una habilidad recurrente", generic: "Elige una actividad que aparezca varias veces y realiza un pequeño ejercicio práctico.", withDirections: (a, b) => `Prueba una tarea práctica típica de «${a}»${b ? ` y otra de «${b}»` : ""}; observa curiosidad y deseo de aprender.` },
      "work-observation": { title: "Observa un flujo de trabajo real", generic: "Pide a alguien que te muestre un flujo de trabajo habitual y observa tareas, interrupciones, contactos y condiciones.", withDirections: (a, b) => `Observa el trabajo cotidiano en «${a}»${b ? ` y en «${b}»` : ""} y compara tareas, contacto, concentración y ritmo.` },
    },
  },
  tr: {
    and: "ve", title: "Kariyer haritan", description: "Olası kariyer keşif alanlarının yerel bir anlık görüntüsü; kişiliğinin değerlendirmesi ya da meslek kararı değildir.",
    selected: (n, m) => `${m} yanıttan ${n} seçildi`, one: "Bir yanıt seç.", exact: (n) => `Tam olarak ${n} yanıt seç.`, range: (a, b) => `${a} ile ${b} arasında yanıt seç.`, maximum: (n) => `En fazla ${n} yanıt seçebilirsin.`, incomplete: "Kariyer haritanı açmadan önce tüm soruları yanıtla.",
    whyOne: (a) => `Seçimlerinde özellikle şu bağlantı noktası öne çıkıyor: ${a}.`, whyTwo: (a, b) => `Seçimlerin özellikle ${a} ve ${b} öğelerini yansıtıyor.`, summaryTwo: (a, b) => `Seçimlerin seni özellikle şu faaliyetleri birleştiren işlere çekiyor: ${a} ve ${b}.`, summaryOne: (a) => `Seçimlerin bu faaliyete yönelik temkinli bir ilgi gösteriyor: ${a}.`, summaryOpen: "Seçimlerin, tek bir faaliyet örüntüsü açıkça baskın olmadan birkaç kariyer izi açıyor.", contextTwo: (a, b) => `Bu bağlamda ${a} ve ${b} önemli görünüyor.`, contextOne: (a) => `${a} yinelenen bir bağlantı noktası olarak görünüyor.`, constraint: (v) => `Keşfinde bu koşulu en baştan hesaba kat: ${v}.`,
    qualification: { short: "Kısa bir nitelik geliştirme kapsamı seçtin.", "several-months": "Birkaç aylık nitelik geliştirme senin için gerçekçi.", "formal-open": "Daha uzun eğitim yollarını da değerlendirebilirsin.", undecided: "Nitelik geliştirme kapsamın açık kalıyor." },
    jobHybrid: "Bu rol, en görünür keşif izlerinden ikisini birleştiriyor.", jobTwo: (a, b) => `Bu rol «${a}» ve «${b}» izlerine temas ediyor.`, jobOpen: "Bu unvan daha fazla araştırma için açık bir arama terimidir.", jobPrimary: (d) => `Bu arama terimi görünür «${d}» izini somutlaştırıyor.`, jobAdditional: (d) => `Bu arama terimi ek «${d}» izi içinde somut bir araştırma açıyor.`,
    next: {
      conversation: { title: "Somut roller hakkında konuş", generic: "Yanıtlarından iki faaliyet seç ve ikisini de işinde tanıyan biriyle konuş.", withDirections: (a, b) => `«${a}» alanından biriyle${b ? ` ve «${b}» alanından biriyle` : ""} konuş; görevleri, ritmi, girişi ve zor yanları sor.` },
      "role-comparison": { title: "Unvanları değil gerçek görevleri karşılaştır", generic: "Altı iş ilanını karşılaştır; yinelenen faaliyetleri, koşulları ve giriş gerekliliklerini işaretle.", withDirections: (a, b) => `«${a}»${b ? ` ve «${b}»` : ""} rollerini gerçek görev, koşul ve giriş gereklilikleri üzerinden karşılaştır.` },
      "mini-project": { title: "Küçük bir proje dene", generic: "Seçtiğin iki faaliyeti 45'er dakika canlandır; ilgini, enerjini ve açık sorularını not et.", withDirections: (a, b) => `«${a}» için${b ? ` ve «${b}» için` : ""} kısa birer deneme tasarla; sonra gözlemlerini karşılaştır.` },
      "skill-test": { title: "Yinelenen bir beceriyi sına", generic: "Yanıtlarında yinelenen bir faaliyeti seç ve küçük bir uygulama yap.", withDirections: (a, b) => `«${a}»${b ? ` ve «${b}»` : ""} alanından tipik birer görevi sına; merakını ve öğrenme isteğini gözle.` },
      "work-observation": { title: "Gerçek bir iş akışını gözlemle", generic: "Birinden tipik bir iş akışını göstermesini iste; görevleri, kesintileri, teması ve koşulları izle.", withDirections: (a, b) => `«${a}»${b ? ` ve «${b}»` : ""} alanındaki günlük işi gözlemle; görev, temas, odak ve ritmi karşılaştır.` },
    },
  },
  pl: {
    and: "i", title: "Twoja mapa zawodowa", description: "Lokalny obraz możliwych obszarów poszukiwań zawodowych — nie ocena Ciebie ani decyzja o zawodzie.",
    selected: (n, m) => `Wybrano ${n} z ${m}`, one: "Wybierz jedną odpowiedź.", exact: (n) => `Wybierz dokładnie ${n} odpowiedzi.`, range: (a, b) => `Wybierz od ${a} do ${b} odpowiedzi.`, maximum: (n) => `Możesz wybrać najwyżej ${n} odpowiedzi.`, incomplete: "Odpowiedz na wszystkie pytania przed otwarciem mapy zawodowej.",
    whyOne: (a) => `W Twoich wyborach szczególnie wyróżnia się ten punkt zaczepienia: ${a}.`, whyTwo: (a, b) => `Twoje wybory szczególnie odzwierciedlają ${a} i ${b}.`, summaryTwo: (a, b) => `Twoje wybory kierują Cię ku pracy łączącej te działania: ${a} i ${b}.`, summaryOne: (a) => `Twoje wybory ostrożnie wskazują zainteresowanie tym działaniem: ${a}.`, summaryOpen: "Twoje wybory otwierają kilka ścieżek zawodowych, bez wyraźnej dominacji jednego wzorca działań.", contextTwo: (a, b) => `W tym kontekście ważne wydają się ${a} i ${b}.`, contextOne: (a) => `${a} pojawia się jako powtarzający punkt zaczepienia.`, constraint: (v) => `Od początku uwzględnij w dalszym sprawdzaniu ten warunek: ${v}.`,
    qualification: { short: "Wybrany zakres nauki jest krótki.", "several-months": "Realne jest dla Ciebie kilka miesięcy nauki.", "formal-open": "Możesz też rozważyć dłuższe ścieżki kształcenia.", undecided: "Zakres nauki pozostaje otwarty." },
    jobHybrid: "Ta rola łączy dwie szczególnie widoczne ścieżki poszukiwań.", jobTwo: (a, b) => `Ta rola dotyka widocznych ścieżek „${a}” i „${b}”.`, jobOpen: "Ta nazwa jest otwartym hasłem do dalszych poszukiwań.", jobPrimary: (d) => `To hasło konkretyzuje widoczną ścieżkę „${d}”.`, jobAdditional: (d) => `To hasło otwiera konkretne poszukiwania w dodatkowej ścieżce „${d}”.`,
    next: {
      conversation: { title: "Porozmawiaj o konkretnych rolach", generic: "Wybierz dwa działania z odpowiedzi i porozmawiaj z osobą, która zna je z pracy.", withDirections: (a, b) => `Porozmawiaj z osobą z obszaru „${a}”${b ? ` i z obszaru „${b}”` : ""}; zapytaj o zadania, rytm, wejście i trudności.` },
      "role-comparison": { title: "Porównaj realne zadania, nie same nazwy", generic: "Porównaj sześć opisów stanowisk i zaznacz powtarzające się działania, warunki oraz wymagania wejścia.", withDirections: (a, b) => `Porównaj role z obszaru „${a}”${b ? ` i „${b}”` : ""} przez realne zadania, warunki i wymagania.` },
      "mini-project": { title: "Wypróbuj mały projekt", generic: "Zasymuluj dwa wybrane działania po 45 minut i zanotuj zainteresowanie, energię oraz pytania.", withDirections: (a, b) => `Zaprojektuj krótką próbę dla „${a}”${b ? ` i dla „${b}”` : ""}, a potem porównaj obserwacje.` },
      "skill-test": { title: "Sprawdź powtarzającą się umiejętność", generic: "Wybierz powtarzające się działanie i wykonaj małe ćwiczenie praktyczne.", withDirections: (a, b) => `Sprawdź typowe zadanie z „${a}”${b ? ` i z „${b}”` : ""}; obserwuj ciekawość i chęć nauki.` },
      "work-observation": { title: "Obserwuj prawdziwy przebieg pracy", generic: "Poproś kogoś o pokazanie typowego przebiegu pracy; zwróć uwagę na zadania, przerwy, kontakt i warunki.", withDirections: (a, b) => `Obserwuj codzienną pracę w „${a}”${b ? ` i w „${b}”` : ""}; porównaj zadania, kontakt, skupienie i rytm.` },
    },
  },
  el: {
    and: "και", title: "Ο επαγγελματικός σου χάρτης", description: "Ένα τοπικό στιγμιότυπο πιθανών χώρων επαγγελματικής διερεύνησης — όχι αξιολόγηση του προσώπου σου ούτε απόφαση επαγγέλματος.",
    selected: (n, m) => `Επιλέχθηκαν ${n} από ${m}`, one: "Επίλεξε μία απάντηση.", exact: (n) => `Επίλεξε ακριβώς ${n} απαντήσεις.`, range: (a, b) => `Επίλεξε από ${a} έως ${b} απαντήσεις.`, maximum: (n) => `Μπορείς να επιλέξεις έως ${n} απαντήσεις.`, incomplete: "Απάντησε σε όλες τις ερωτήσεις πριν ανοίξεις τον επαγγελματικό χάρτη.",
    whyOne: (a) => `Στις επιλογές σου ξεχωρίζει ιδιαίτερα αυτό το σημείο σύνδεσης: ${a}.`, whyTwo: (a, b) => `Οι επιλογές σου αντανακλούν ιδιαίτερα ${a} και ${b}.`, summaryTwo: (a, b) => `Οι επιλογές σου σε ελκύουν κυρίως προς εργασία που συνδυάζει: ${a} και ${b}.`, summaryOne: (a) => `Οι επιλογές σου δείχνουν προσεκτικά ενδιαφέρον για αυτή τη δραστηριότητα: ${a}.`, summaryOpen: "Οι επιλογές σου ανοίγουν πολλές επαγγελματικές πορείες χωρίς να κυριαρχεί σαφώς ένα μοτίβο δραστηριότητας.", contextTwo: (a, b) => `Σε αυτό το πλαίσιο φαίνονται σημαντικά ${a} και ${b}.`, contextOne: (a) => `${a} εμφανίζεται ως επαναλαμβανόμενο σημείο σύνδεσης.`, constraint: (v) => `Η περαιτέρω διερεύνηση πρέπει να λάβει εξαρχής υπόψη αυτή τη συνθήκη: ${v}.`,
    qualification: { short: "Επίλεξες σύντομο εύρος κατάρτισης.", "several-months": "Αρκετοί μήνες κατάρτισης είναι ρεαλιστικοί για εσένα.", "formal-open": "Μπορείς να εξετάσεις και μακρύτερες διαδρομές κατάρτισης.", undecided: "Το εύρος κατάρτισης παραμένει ανοιχτό." },
    jobHybrid: "Αυτός ο ρόλος συνδέει δύο από τις πιο ορατές πορείες διερεύνησης.", jobTwo: (a, b) => `Αυτός ο ρόλος αγγίζει τις ορατές πορείες «${a}» και «${b}».`, jobOpen: "Αυτός ο τίτλος είναι ανοιχτός όρος για περαιτέρω αναζήτηση.", jobPrimary: (d) => `Αυτός ο όρος κάνει πιο συγκεκριμένη την ορατή πορεία «${d}».`, jobAdditional: (d) => `Αυτός ο όρος ανοίγει συγκεκριμένη έρευνα στην πρόσθετη πορεία «${d}».`,
    next: {
      conversation: { title: "Συζήτησε συγκεκριμένους ρόλους", generic: "Επίλεξε δύο δραστηριότητες από τις απαντήσεις και μίλησε με κάποιον που τις γνωρίζει από την εργασία του.", withDirections: (a, b) => `Μίλησε με κάποιον από «${a}»${b ? ` και από «${b}»` : ""}· ρώτησε για καθήκοντα, ρυθμό, είσοδο και δυσκολίες.` },
      "role-comparison": { title: "Σύγκρινε πραγματικά καθήκοντα, όχι μόνο τίτλους", generic: "Σύγκρινε έξι περιγραφές θέσεων και σημείωσε επαναλαμβανόμενες δραστηριότητες, συνθήκες και απαιτήσεις.", withDirections: (a, b) => `Σύγκρινε ρόλους από «${a}»${b ? ` και «${b}»` : ""} με βάση πραγματικά καθήκοντα, συνθήκες και απαιτήσεις.` },
      "mini-project": { title: "Δοκίμασε ένα μικρό έργο", generic: "Προσομοίωσε δύο επιλεγμένες δραστηριότητες για 45 λεπτά και σημείωσε ενδιαφέρον, ενέργεια και ερωτήματα.", withDirections: (a, b) => `Σχεδίασε μια σύντομη δοκιμή για «${a}»${b ? ` και μία για «${b}»` : ""} και σύγκρινε τις παρατηρήσεις.` },
      "skill-test": { title: "Δοκίμασε μια επαναλαμβανόμενη δεξιότητα", generic: "Επίλεξε επαναλαμβανόμενη δραστηριότητα και κάνε μια μικρή πρακτική άσκηση.", withDirections: (a, b) => `Δοκίμασε τυπικό καθήκον από «${a}»${b ? ` και από «${b}»` : ""}· παρατήρησε περιέργεια και διάθεση μάθησης.` },
      "work-observation": { title: "Παρατήρησε μια πραγματική ροή εργασίας", generic: "Ζήτησε από κάποιον να δείξει μια τυπική ροή εργασίας και παρατήρησε καθήκοντα, διακοπές, επαφή και συνθήκες.", withDirections: (a, b) => `Παρατήρησε την καθημερινή εργασία σε «${a}»${b ? ` και «${b}»` : ""} και σύγκρινε καθήκοντα, επαφή, συγκέντρωση και ρυθμό.` },
    },
  },
  ru: {
    and: "и", title: "Твоя карьерная карта", description: "Локальный снимок возможных пространств для карьерного исследования — не оценка тебя и не решение о профессии.",
    selected: (n, m) => `Выбрано ${n} из ${m}`, one: "Выбери один ответ.", exact: (n) => `Выбери ровно ${n} ответа.`, range: (a, b) => `Выбери от ${a} до ${b} ответов.`, maximum: (n) => `Можно выбрать не больше ${n} ответов.`, incomplete: "Ответь на все вопросы, прежде чем открыть карьерную карту.",
    whyOne: (a) => `В твоих ответах особенно заметна эта точка опоры: ${a}.`, whyTwo: (a, b) => `Твои ответы особенно отражают ${a} и ${b}.`, summaryTwo: (a, b) => `Тебя особенно привлекает работа, где сочетаются эти занятия: ${a} и ${b}.`, summaryOne: (a) => `Твои ответы осторожно указывают на интерес к этому занятию: ${a}.`, summaryOpen: "Твои ответы открывают несколько карьерных путей без явного доминирования одного вида занятий.", contextTwo: (a, b) => `В этом контексте важны ${a} и ${b}.`, contextOne: (a) => `${a} выглядит как повторяющаяся точка опоры.`, constraint: (v) => `В дальнейшем исследовании стоит сразу учитывать это условие: ${v}.`,
    qualification: { short: "Ты выбрал/выбрала короткий объём подготовки.", "several-months": "Для тебя реалистичны несколько месяцев подготовки.", "formal-open": "Можно рассматривать и более долгие пути подготовки.", undecided: "Объём подготовки пока остаётся открытым." },
    jobHybrid: "Эта роль соединяет два особенно заметных направления исследования.", jobTwo: (a, b) => `Эта роль касается заметных направлений «${a}» и «${b}».`, jobOpen: "Это название — открытый поисковый запрос для дальнейшего исследования.", jobPrimary: (d) => `Этот запрос конкретизирует заметное направление «${d}».`, jobAdditional: (d) => `Этот запрос открывает конкретный поиск в дополнительном направлении «${d}».`,
    next: {
      conversation: { title: "Поговори о конкретных ролях", generic: "Выбери два занятия из ответов и поговори с человеком, который знает их по своей работе.", withDirections: (a, b) => `Поговори с человеком из «${a}»${b ? ` и из «${b}»` : ""}; спроси о задачах, ритме, входе и сложностях.` },
      "role-comparison": { title: "Сравни реальные задачи, а не только названия", generic: "Сравни шесть описаний вакансий и отметь повторяющиеся занятия, условия и требования для входа.", withDirections: (a, b) => `Сравни роли из «${a}»${b ? ` и «${b}»` : ""} по реальным задачам, условиям и требованиям.` },
      "mini-project": { title: "Попробуй небольшой проект", generic: "Сымитируй два выбранных занятия по 45 минут и отметь интерес, энергию и открытые вопросы.", withDirections: (a, b) => `Составь короткую пробу для «${a}»${b ? ` и для «${b}»` : ""}, а затем сравни наблюдения.` },
      "skill-test": { title: "Проверь повторяющийся навык", generic: "Выбери повторяющееся занятие и выполни небольшое практическое упражнение.", withDirections: (a, b) => `Попробуй типичную задачу из «${a}»${b ? ` и из «${b}»` : ""}; наблюдай любопытство и желание учиться.` },
      "work-observation": { title: "Понаблюдай за реальным рабочим процессом", generic: "Попроси показать обычный рабочий процесс и наблюдай задачи, перерывы, общение и условия.", withDirections: (a, b) => `Наблюдай повседневную работу в «${a}»${b ? ` и в «${b}»` : ""}; сравни задачи, общение, концентрацию и ритм.` },
    },
  },
};
