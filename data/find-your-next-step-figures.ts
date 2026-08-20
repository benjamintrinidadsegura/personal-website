export type FynsContextSceneKey = "overview" | "self" | "career" | "problem" | "idea";

export interface FynsContextScene {
  key: FynsContextSceneKey;
  src: string;
  eyebrow: string;
  title: string;
  description: string;
  alt: string;
}

export const fynsContextScenes: Record<FynsContextSceneKey, FynsContextScene> = {
  overview: {
    key: "overview",
    src: "/images/find-your-next-step/context-scenes/cast-anchor.webp",
    eyebrow: "Context Scenes",
    title: "Menschen in Situationen, nicht Menschen als Typen.",
    description:
      "Die wiederkehrenden Figuren begleiten unterschiedliche Momente des Nachdenkens. Ihre Rollen wechseln – deine eigenen Worte und deine Einordnung bleiben entscheidend.",
    alt: "Vier Erwachsene betrachten gemeinsam Notizen und einfache Modelle an einem Tisch.",
  },
  self: {
    key: "self",
    src: "/images/find-your-next-step/context-scenes/self-reflection.webp",
    eyebrow: "Eine mögliche Situation",
    title: "Innehalten, vergleichen, neu einordnen.",
    description:
      "Reflexion kann allein oder mit Unterstützung stattfinden. Die Szene illustriert einen Moment – sie beschreibt weder dich noch dein Ergebnis.",
    alt: "Vier Erwachsene reflektieren in einem Atelier mit Notizkarten; eine Person vergleicht Karten, eine schenkt Tee ein und zwei besprechen eine Pinnwand.",
  },
  career: {
    key: "career",
    src: "/images/find-your-next-step/context-scenes/career-exploration.webp",
    eyebrow: "Eine mögliche Situation",
    title: "Optionen prüfen, bevor sie zu Festlegungen werden.",
    description:
      "Berufliche Richtung entsteht oft durch kleine Erkundungen, Gespräche und echte Bedingungen – nicht durch die Zuordnung zu einer Figur.",
    alt: "Vier Erwachsene vergleichen Optionen und testen kleine Modelle in einer Werkstatt.",
  },
  problem: {
    key: "problem",
    src: "/images/find-your-next-step/context-scenes/problem-navigation.webp",
    eyebrow: "Eine mögliche Situation",
    title: "Ein Hindernis aus mehreren Blickwinkeln betrachten.",
    description:
      "Ein Problem muss nicht auf einmal gelöst werden. Die Szene zeigt Unterstützung und einen kleinen nächsten Schritt, nicht die eine richtige Lösung.",
    alt: "Vier Erwachsene untersuchen gemeinsam eine ins Stocken geratene Konstruktion und skizzieren einen nächsten Versuch.",
  },
  idea: {
    key: "idea",
    src: "/images/find-your-next-step/context-scenes/idea-experiment.webp",
    eyebrow: "Eine mögliche Situation",
    title: "Eine Idee klein genug machen, um etwas zu lernen.",
    description:
      "Annahmen dürfen sich verändern. Die Szene steht für gemeinsames Testen – nicht für einen Gründertyp oder eine Vorhersage über Erfolg.",
    alt: "Vier Erwachsene beobachten und besprechen ein kleines Experiment mit einem frühen Prototyp.",
  },
};

export function getFynsContextScene(key: FynsContextSceneKey) {
  return fynsContextScenes[key];
}

type FynsSceneCopy = Readonly<Record<FynsContextSceneKey, Pick<FynsContextScene, "eyebrow" | "title" | "description" | "alt">>>;

const englishSceneCopy: FynsSceneCopy = {
  overview: {
    eyebrow: "Context Scenes",
    title: "People in situations, not people as types.",
    description: "The recurring figures accompany different moments of reflection. Their roles change; your own words and interpretation remain decisive.",
    alt: "Four adults looking at notes and simple models together around a table.",
  },
  self: {
    eyebrow: "One possible situation",
    title: "Pause, compare and reconsider.",
    description: "Reflection can happen alone or with support. The scene illustrates a moment; it describes neither you nor your result.",
    alt: "Four adults reflecting with note cards in a studio; one compares cards, one pours tea and two discuss a pinboard.",
  },
  career: {
    eyebrow: "One possible situation",
    title: "Explore options before they become commitments.",
    description: "Professional direction often emerges through small explorations, conversations and real conditions — not by matching yourself to a figure.",
    alt: "Four adults comparing options and testing small models in a workshop.",
  },
  problem: {
    eyebrow: "One possible situation",
    title: "Look at an obstacle from several angles.",
    description: "A problem does not have to be solved all at once. The scene shows support and a small next step, not the one right solution.",
    alt: "Four adults examining a stalled construction together and sketching a next attempt.",
  },
  idea: {
    eyebrow: "One possible situation",
    title: "Make an idea small enough to learn from it.",
    description: "Assumptions are allowed to change. The scene represents testing together — not a founder type or a prediction of success.",
    alt: "Four adults observing and discussing a small experiment with an early prototype.",
  },
};

const extendedSceneCopy: Record<Exclude<Locale, "de" | "en">, FynsSceneCopy> = {
  es: {
    overview: { eyebrow: "Escenas de contexto", title: "Personas en situaciones, no personas como tipos.", description: "Las figuras recurrentes acompañan distintos momentos de reflexión. Sus papeles cambian; tus propias palabras y tu interpretación siguen siendo decisivas.", alt: "Cuatro personas adultas observan juntas notas y modelos sencillos alrededor de una mesa." },
    self: { eyebrow: "Una situación posible", title: "Parar, comparar y volver a situarse.", description: "La reflexión puede hacerse a solas o con apoyo. La escena ilustra un momento; no te describe a ti ni a tu resultado.", alt: "Cuatro personas adultas reflexionan con tarjetas en un estudio; una compara tarjetas, otra sirve té y dos conversan ante un panel." },
    career: { eyebrow: "Una situación posible", title: "Explorar opciones antes de convertirlas en compromisos.", description: "La dirección profesional suele surgir de pequeñas exploraciones, conversaciones y condiciones reales, no de identificarte con una figura.", alt: "Cuatro personas adultas comparan opciones y prueban pequeños modelos en un taller." },
    problem: { eyebrow: "Una situación posible", title: "Mirar un obstáculo desde varios ángulos.", description: "Un problema no tiene que resolverse de una vez. La escena muestra apoyo y un pequeño paso siguiente, no una única solución correcta.", alt: "Cuatro personas adultas examinan juntas una construcción detenida y dibujan un siguiente intento." },
    idea: { eyebrow: "Una situación posible", title: "Hacer una idea lo bastante pequeña como para aprender.", description: "Las suposiciones pueden cambiar. La escena representa una prueba compartida, no un tipo de fundador ni una predicción de éxito.", alt: "Cuatro personas adultas observan y comentan un pequeño experimento con un prototipo inicial." },
  },
  tr: {
    overview: { eyebrow: "Bağlam sahneleri", title: "Tipler değil, durumların içindeki insanlar.", description: "Tekrarlanan figürler farklı düşünme anlarına eşlik eder. Rolleri değişir; belirleyici olan senin sözlerin ve yorumundur.", alt: "Dört yetişkin bir masanın çevresinde notlara ve basit modellere birlikte bakıyor." },
    self: { eyebrow: "Olası bir durum", title: "Dur, karşılaştır ve yeniden değerlendir.", description: "Düşünme tek başına ya da destekle gerçekleşebilir. Sahne yalnızca bir anı gösterir; seni veya sonucunu tanımlamaz.", alt: "Dört yetişkin bir stüdyoda not kartlarıyla düşünüyor; biri kartları karşılaştırıyor, biri çay koyuyor, ikisi panoyu konuşuyor." },
    career: { eyebrow: "Olası bir durum", title: "Seçenekler karara dönüşmeden önce onları araştır.", description: "Mesleki yön çoğu zaman küçük araştırmalar, görüşmeler ve gerçek koşullarla belirir; kendini bir figürle eşleştirerek değil.", alt: "Dört yetişkin bir atölyede seçenekleri karşılaştırıyor ve küçük modelleri deniyor." },
    problem: { eyebrow: "Olası bir durum", title: "Bir engele birkaç açıdan bak.", description: "Bir sorun tek seferde çözülmek zorunda değildir. Sahne tek doğru çözümü değil, desteği ve küçük bir sonraki adımı gösterir.", alt: "Dört yetişkin durmuş bir yapıyı birlikte inceliyor ve sonraki denemeyi çiziyor." },
    idea: { eyebrow: "Olası bir durum", title: "Bir fikri öğrenebilecek kadar küçült.", description: "Varsayımlar değişebilir. Sahne bir kurucu tipini veya başarı tahminini değil, birlikte sınamayı temsil eder.", alt: "Dört yetişkin erken bir prototiple yapılan küçük bir deneyi gözlemliyor ve konuşuyor." },
  },
  pl: {
    overview: { eyebrow: "Sceny kontekstowe", title: "Ludzie w sytuacjach, nie ludzie jako typy.", description: "Powracające postacie towarzyszą różnym chwilom namysłu. Ich role się zmieniają; decydujące pozostają Twoje słowa i interpretacja.", alt: "Cztery dorosłe osoby wspólnie oglądają notatki i proste modele przy stole." },
    self: { eyebrow: "Jedna z możliwych sytuacji", title: "Zatrzymaj się, porównaj i spójrz ponownie.", description: "Refleksja może odbywać się samodzielnie albo przy wsparciu. Scena pokazuje chwilę; nie opisuje Ciebie ani Twojego wyniku.", alt: "Cztery dorosłe osoby pracują z kartami w pracowni; jedna porównuje karty, jedna nalewa herbatę, a dwie rozmawiają przy tablicy." },
    career: { eyebrow: "Jedna z możliwych sytuacji", title: "Sprawdź możliwości, zanim staną się zobowiązaniami.", description: "Kierunek zawodowy często wyłania się z małych prób, rozmów i realnych warunków — nie z dopasowania siebie do postaci.", alt: "Cztery dorosłe osoby porównują możliwości i testują małe modele w pracowni." },
    problem: { eyebrow: "Jedna z możliwych sytuacji", title: "Spójrz na przeszkodę z kilku stron.", description: "Problemu nie trzeba rozwiązać od razu. Scena pokazuje wsparcie i mały kolejny krok, a nie jedyne właściwe rozwiązanie.", alt: "Cztery dorosłe osoby wspólnie oglądają zatrzymaną konstrukcję i szkicują kolejną próbę." },
    idea: { eyebrow: "Jedna z możliwych sytuacji", title: "Zmniejsz pomysł tak, aby można było się z niego czegoś nauczyć.", description: "Założenia mogą się zmieniać. Scena przedstawia wspólne testowanie, nie typ założyciela ani prognozę sukcesu.", alt: "Cztery dorosłe osoby obserwują i omawiają mały eksperyment z wczesnym prototypem." },
  },
  el: {
    overview: { eyebrow: "Σκηνές πλαισίου", title: "Άνθρωποι μέσα σε καταστάσεις, όχι άνθρωποι ως τύποι.", description: "Οι επαναλαμβανόμενες φιγούρες συνοδεύουν διαφορετικές στιγμές αναστοχασμού. Οι ρόλοι τους αλλάζουν· τα δικά σου λόγια και η ερμηνεία σου παραμένουν καθοριστικά.", alt: "Τέσσερις ενήλικες κοιτούν μαζί σημειώσεις και απλά μοντέλα γύρω από ένα τραπέζι." },
    self: { eyebrow: "Μία πιθανή κατάσταση", title: "Σταμάτησε, σύγκρινε και επανεξέτασε.", description: "Ο αναστοχασμός μπορεί να γίνει μόνος σου ή με υποστήριξη. Η σκηνή δείχνει μια στιγμή· δεν περιγράφει ούτε εσένα ούτε το αποτέλεσμά σου.", alt: "Τέσσερις ενήλικες αναστοχάζονται με κάρτες σε ένα εργαστήριο· ένας συγκρίνει κάρτες, ένας σερβίρει τσάι και δύο συζητούν μπροστά σε πίνακα." },
    career: { eyebrow: "Μία πιθανή κατάσταση", title: "Διερεύνησε επιλογές πριν γίνουν δεσμεύσεις.", description: "Η επαγγελματική κατεύθυνση συχνά προκύπτει από μικρές διερευνήσεις, συζητήσεις και πραγματικές συνθήκες — όχι από την ταύτιση με μια φιγούρα.", alt: "Τέσσερις ενήλικες συγκρίνουν επιλογές και δοκιμάζουν μικρά μοντέλα σε ένα εργαστήριο." },
    problem: { eyebrow: "Μία πιθανή κατάσταση", title: "Δες ένα εμπόδιο από πολλές πλευρές.", description: "Ένα πρόβλημα δεν χρειάζεται να λυθεί μονομιάς. Η σκηνή δείχνει υποστήριξη και ένα μικρό επόμενο βήμα, όχι τη μία σωστή λύση.", alt: "Τέσσερις ενήλικες εξετάζουν μαζί μια κατασκευή που έχει σταματήσει και σχεδιάζουν την επόμενη δοκιμή." },
    idea: { eyebrow: "Μία πιθανή κατάσταση", title: "Κάνε μια ιδέα αρκετά μικρή ώστε να μάθεις από αυτή.", description: "Οι παραδοχές μπορούν να αλλάζουν. Η σκηνή συμβολίζει την κοινή δοκιμή — όχι έναν τύπο ιδρυτή ή μια πρόβλεψη επιτυχίας.", alt: "Τέσσερις ενήλικες παρατηρούν και συζητούν ένα μικρό πείραμα με ένα πρώιμο πρωτότυπο." },
  },
  ru: {
    overview: { eyebrow: "Контекстные сцены", title: "Люди в ситуациях, а не люди как типы.", description: "Повторяющиеся персонажи сопровождают разные моменты размышления. Их роли меняются; решающими остаются твои слова и твоя интерпретация.", alt: "Четверо взрослых вместе рассматривают заметки и простые модели за столом." },
    self: { eyebrow: "Одна из возможных ситуаций", title: "Остановиться, сравнить и посмотреть заново.", description: "Размышлять можно самостоятельно или с поддержкой. Сцена показывает один момент; она не описывает ни тебя, ни твой результат.", alt: "Четверо взрослых работают с карточками в студии; один сравнивает карточки, другой наливает чай, двое обсуждают доску." },
    career: { eyebrow: "Одна из возможных ситуаций", title: "Исследовать варианты до того, как они станут обязательствами.", description: "Профессиональное направление часто проявляется через небольшие пробы, разговоры и реальные условия, а не через отождествление себя с персонажем.", alt: "Четверо взрослых сравнивают варианты и испытывают небольшие модели в мастерской." },
    problem: { eyebrow: "Одна из возможных ситуаций", title: "Посмотреть на препятствие с разных сторон.", description: "Проблему не обязательно решать сразу целиком. Сцена показывает поддержку и небольшой следующий шаг, а не единственно правильное решение.", alt: "Четверо взрослых вместе изучают остановившуюся конструкцию и набрасывают следующую попытку." },
    idea: { eyebrow: "Одна из возможных ситуаций", title: "Уменьшить идею до масштаба, в котором можно чему-то научиться.", description: "Предположения могут меняться. Сцена означает совместную проверку, а не тип основателя или прогноз успеха.", alt: "Четверо взрослых наблюдают и обсуждают небольшой эксперимент с ранним прототипом." },
  },
};

const sceneCopyByLocale: Record<Locale, FynsSceneCopy> = {
  de: fynsContextScenes,
  en: englishSceneCopy,
  ...extendedSceneCopy,
};

export function getLocalizedFynsContextScene(key: FynsContextSceneKey, locale: Locale): FynsContextScene {
  return { ...fynsContextScenes[key], ...sceneCopyByLocale[locale][key] };
}
import type { Locale } from "@/lib/i18n/config";
