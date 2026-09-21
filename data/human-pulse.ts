import { getHomeCopy } from "@/data/i18n/home";
import type { Locale } from "@/lib/i18n/config";
import { isSafeLocalPathname } from "@/lib/i18n/routing";
import {
  openLoopStatuses,
  openLoopTypes,
  type HumanPulseContent,
  type HumanPulseEntry,
  type OpenLoop,
} from "@/types/hq-pulse";

/**
 * Human meaning stays deliberately editorial. Existing Now copy supplies the
 * accepted Right Now / On My Mind content; Next and Open Loop copy has one
 * locale-complete authoring location here.
 */
export const humanPulseEditorial: Readonly<{
  next: Record<Locale, HumanPulseEntry | null>;
  openLoops: Record<Locale, readonly OpenLoop[]>;
}> = {
  next: {
    de: {
      id: "next",
      label: "Als Nächstes",
      text: "Dinge bauen, die ich selbst gerne hätte. Festhalten, was ich dabei lerne. Und Menschen kennenlernen, denen ich sonst nie begegnet wäre.",
    },
    en: {
      id: "next",
      label: "Next",
      text: "Keep building the things I wish existed, write down what I learn along the way, and meet more of the people I wouldn't have met otherwise.",
    },
    es: {
      id: "next",
      label: "Siguiente",
      text: "Seguir construyendo las cosas que me gustaría que existieran, escribir lo que aprendo por el camino y conocer a más personas a las que, de otro modo, nunca habría conocido.",
    },
    tr: {
      id: "next",
      label: "Sırada",
      text: "Var olmasını istediğim şeyleri inşa etmeye devam etmek, yol boyunca öğrendiklerimi yazmak ve başka türlü tanışamayacağım daha fazla insanla tanışmak.",
    },
    pl: {
      id: "next",
      label: "Dalej",
      text: "Nadal budować rzeczy, które chciałbym zobaczyć w świecie, zapisywać po drodze to, czego się uczę, i poznawać więcej osób, których inaczej nigdy bym nie spotkał.",
    },
    el: {
      id: "next",
      label: "Επόμενο",
      text: "Να συνεχίσω να χτίζω όσα θα ήθελα να υπάρχουν, να καταγράφω όσα μαθαίνω στην πορεία και να γνωρίζω περισσότερους ανθρώπους που αλλιώς δεν θα είχα γνωρίσει.",
    },
    ru: {
      id: "next",
      label: "Дальше",
      text: "Продолжать создавать то, что мне самому хотелось бы видеть, записывать то, чему я учусь по пути, и знакомиться с людьми, которых иначе я бы не встретил.",
    },
  },
  openLoops: {
    de: [
      {
        id: "team-up-build-together",
        type: "team-up",
        status: "active",
        title: "Etwas gemeinsam bauen",
        context: "Ich freue mich über Menschen, die ungewöhnliche Dinge bauen, Gewohntes hinterfragen und Ideen Wirklichkeit werden lassen wollen.",
        order: 1,
        cta: { label: "Lass uns reden", href: "/#contact" },
      },
      {
        id: "interview-tell-story",
        type: "interview",
        status: "active",
        title: "Erzähl mir deine Geschichte",
        context: "Ich suche Menschen mit spannenden Lebenswegen, Perspektiven und Erfahrungen für Gespräche und Interviews auf bts.online.",
        order: 2,
        cta: { label: "Melde dich", href: "/#contact" },
      },
      {
        id: "feedback-challenge-idea",
        type: "feedback",
        status: "active",
        title: "Hinterfrage eine Idee",
        context: "Siehst du auf bts.online etwas, das besser, ungewöhnlicher, klarer oder nützlicher sein könnte? Sag es mir ehrlich.",
        order: 3,
        cta: { label: "Teile deine Perspektive", href: "/#contact" },
      },
      {
        id: "expertise-help-teach-me",
        type: "expertise-help",
        status: "active",
        title: "Weißt du etwas, das ich nicht weiß?",
        context: "Vieles, was ich heute gerne baue, begann damit, dass mir jemand eine neue Perspektive, Fähigkeit oder ein Stück Wissen gezeigt hat.",
        order: 4,
        cta: { label: "Bring mir etwas bei", href: "/#contact" },
      },
    ],
    en: [
      {
        id: "team-up-build-together",
        type: "team-up",
        status: "active",
        title: "Build something together",
        context: "I'm always interested in meeting people who like building unusual things, challenging assumptions and turning ideas into something real.",
        order: 1,
        cta: { label: "Let's talk", href: "/#contact" },
      },
      {
        id: "interview-tell-story",
        type: "interview",
        status: "active",
        title: "Tell me your story",
        context: "I'm looking for people with interesting paths, perspectives and experiences for conversations and interviews on bts.online.",
        order: 2,
        cta: { label: "Reach out", href: "/#contact" },
      },
      {
        id: "feedback-challenge-idea",
        type: "feedback",
        status: "active",
        title: "Challenge an idea",
        context: "See something on bts.online that could be better, stranger, clearer or more useful? I genuinely want to hear it.",
        order: 3,
        cta: { label: "Share your perspective", href: "/#contact" },
      },
      {
        id: "expertise-help-teach-me",
        type: "expertise-help",
        status: "active",
        title: "Know something I don't?",
        context: "Some of the best things I've built started with someone showing me a perspective, skill or piece of knowledge I didn't have yet.",
        order: 4,
        cta: { label: "Teach me something", href: "/#contact" },
      },
    ],
    es: [
      {
        id: "team-up-build-together",
        type: "team-up",
        status: "active",
        title: "Construyamos algo juntos",
        context: "Siempre me interesa conocer a personas a las que les gusta construir cosas poco comunes, cuestionar supuestos y convertir ideas en algo real.",
        order: 1,
        cta: { label: "Hablemos", href: "/#contact" },
      },
      {
        id: "interview-tell-story",
        type: "interview",
        status: "active",
        title: "Cuéntame tu historia",
        context: "Busco personas con recorridos, perspectivas y experiencias interesantes para conversaciones y entrevistas en bts.online.",
        order: 2,
        cta: { label: "Ponte en contacto", href: "/#contact" },
      },
      {
        id: "feedback-challenge-idea",
        type: "feedback",
        status: "active",
        title: "Cuestiona una idea",
        context: "¿Ves algo en bts.online que podría ser mejor, más extraño, más claro o más útil? De verdad quiero saberlo.",
        order: 3,
        cta: { label: "Comparte tu perspectiva", href: "/#contact" },
      },
      {
        id: "expertise-help-teach-me",
        type: "expertise-help",
        status: "active",
        title: "¿Sabes algo que yo no?",
        context: "Algunas de las mejores cosas que he construido comenzaron cuando alguien me mostró una perspectiva, una habilidad o un conocimiento que todavía no tenía.",
        order: 4,
        cta: { label: "Enséñame algo", href: "/#contact" },
      },
    ],
    tr: [
      {
        id: "team-up-build-together",
        type: "team-up",
        status: "active",
        title: "Birlikte bir şey inşa edelim",
        context: "Sıra dışı şeyler inşa etmeyi, varsayımları sorgulamayı ve fikirleri gerçeğe dönüştürmeyi seven insanlarla tanışmak her zaman ilgimi çekiyor.",
        order: 1,
        cta: { label: "Konuşalım", href: "/#contact" },
      },
      {
        id: "interview-tell-story",
        type: "interview",
        status: "active",
        title: "Hikâyeni anlat",
        context: "bts.online'daki sohbetler ve röportajlar için ilginç yolculukları, bakış açıları ve deneyimleri olan insanları arıyorum.",
        order: 2,
        cta: { label: "İletişime geç", href: "/#contact" },
      },
      {
        id: "feedback-challenge-idea",
        type: "feedback",
        status: "active",
        title: "Bir fikri sorgula",
        context: "bts.online'da daha iyi, daha sıra dışı, daha net veya daha faydalı olabilecek bir şey görüyor musun? Bunu gerçekten duymak istiyorum.",
        order: 3,
        cta: { label: "Bakış açını paylaş", href: "/#contact" },
      },
      {
        id: "expertise-help-teach-me",
        type: "expertise-help",
        status: "active",
        title: "Benim bilmediğim bir şey biliyor musun?",
        context: "İnşa ettiğim en iyi şeylerden bazıları, birinin bana henüz sahip olmadığım bir bakış açısı, beceri ya da bilgi göstermesiyle başladı.",
        order: 4,
        cta: { label: "Bana bir şey öğret", href: "/#contact" },
      },
    ],
    pl: [
      {
        id: "team-up-build-together",
        type: "team-up",
        status: "active",
        title: "Zbudujmy coś razem",
        context: "Zawsze chętnie poznaję ludzi, którzy lubią budować nietypowe rzeczy, podważać założenia i zmieniać pomysły w coś realnego.",
        order: 1,
        cta: { label: "Porozmawiajmy", href: "/#contact" },
      },
      {
        id: "interview-tell-story",
        type: "interview",
        status: "active",
        title: "Opowiedz mi swoją historię",
        context: "Szukam osób z interesującymi drogami, perspektywami i doświadczeniami do rozmów i wywiadów na bts.online.",
        order: 2,
        cta: { label: "Odezwij się", href: "/#contact" },
      },
      {
        id: "feedback-challenge-idea",
        type: "feedback",
        status: "active",
        title: "Podważ pomysł",
        context: "Widzisz na bts.online coś, co mogłoby być lepsze, dziwniejsze, jaśniejsze albo bardziej użyteczne? Naprawdę chcę o tym usłyszeć.",
        order: 3,
        cta: { label: "Podziel się perspektywą", href: "/#contact" },
      },
      {
        id: "expertise-help-teach-me",
        type: "expertise-help",
        status: "active",
        title: "Wiesz coś, czego ja nie wiem?",
        context: "Niektóre z najlepszych rzeczy, które zbudowałem, zaczęły się od tego, że ktoś pokazał mi perspektywę, umiejętność lub wiedzę, której jeszcze nie miałem.",
        order: 4,
        cta: { label: "Naucz mnie czegoś", href: "/#contact" },
      },
    ],
    el: [
      {
        id: "team-up-build-together",
        type: "team-up",
        status: "active",
        title: "Ας χτίσουμε κάτι μαζί",
        context: "Με ενδιαφέρει πάντα να γνωρίζω ανθρώπους που τους αρέσει να χτίζουν ασυνήθιστα πράγματα, να αμφισβητούν παραδοχές και να μετατρέπουν ιδέες σε κάτι πραγματικό.",
        order: 1,
        cta: { label: "Ας μιλήσουμε", href: "/#contact" },
      },
      {
        id: "interview-tell-story",
        type: "interview",
        status: "active",
        title: "Πες μου την ιστορία σου",
        context: "Αναζητώ ανθρώπους με ενδιαφέρουσες διαδρομές, οπτικές και εμπειρίες για συζητήσεις και συνεντεύξεις στο bts.online.",
        order: 2,
        cta: { label: "Επικοινώνησε", href: "/#contact" },
      },
      {
        id: "feedback-challenge-idea",
        type: "feedback",
        status: "active",
        title: "Αμφισβήτησε μια ιδέα",
        context: "Βλέπεις κάτι στο bts.online που θα μπορούσε να γίνει καλύτερο, πιο παράξενο, πιο ξεκάθαρο ή πιο χρήσιμο; Θέλω ειλικρινά να το ακούσω.",
        order: 3,
        cta: { label: "Μοιράσου την οπτική σου", href: "/#contact" },
      },
      {
        id: "expertise-help-teach-me",
        type: "expertise-help",
        status: "active",
        title: "Ξέρεις κάτι που δεν ξέρω;",
        context: "Μερικά από τα καλύτερα πράγματα που έχτισα ξεκίνησαν όταν κάποιος μου έδειξε μια οπτική, μια δεξιότητα ή μια γνώση που δεν είχα ακόμη.",
        order: 4,
        cta: { label: "Μάθε μου κάτι", href: "/#contact" },
      },
    ],
    ru: [
      {
        id: "team-up-build-together",
        type: "team-up",
        status: "active",
        title: "Создадим что-нибудь вместе",
        context: "Мне всегда интересно знакомиться с людьми, которым нравится создавать необычные вещи, ставить под сомнение привычные представления и превращать идеи во что-то реальное.",
        order: 1,
        cta: { label: "Давайте поговорим", href: "/#contact" },
      },
      {
        id: "interview-tell-story",
        type: "interview",
        status: "active",
        title: "Расскажи мне свою историю",
        context: "Я ищу людей с интересными путями, взглядами и опытом для бесед и интервью на bts.online.",
        order: 2,
        cta: { label: "Связаться", href: "/#contact" },
      },
      {
        id: "feedback-challenge-idea",
        type: "feedback",
        status: "active",
        title: "Оспорь идею",
        context: "Видишь на bts.online что-то, что могло бы стать лучше, необычнее, понятнее или полезнее? Я искренне хочу об этом услышать.",
        order: 3,
        cta: { label: "Поделись своим взглядом", href: "/#contact" },
      },
      {
        id: "expertise-help-teach-me",
        type: "expertise-help",
        status: "active",
        title: "Знаешь что-то, чего не знаю я?",
        context: "Некоторые из лучших вещей, которые я создал, начались с того, что кто-то показал мне взгляд, навык или знание, которых у меня тогда ещё не было.",
        order: 4,
        cta: { label: "Научи меня чему-нибудь", href: "/#contact" },
      },
    ],
  },
};

function validDate(value: string | undefined): boolean {
  return value === undefined || !Number.isNaN(Date.parse(value));
}

export function isSafeOpenLoopHref(href: string): boolean {
  if (isSafeLocalPathname(href)) return true;
  try {
    return new URL(href).protocol === "https:";
  } catch {
    return false;
  }
}

export function validateOpenLoops(openLoops: readonly OpenLoop[]): void {
  const ids = new Set<string>();
  for (const loop of openLoops) {
    if (!loop.id.trim() || ids.has(loop.id)) throw new Error(`Invalid or duplicate Open Loop id: ${loop.id}`);
    ids.add(loop.id);
    if (!openLoopTypes.includes(loop.type)) throw new Error(`Unsupported Open Loop type: ${loop.type}`);
    if (!openLoopStatuses.includes(loop.status)) throw new Error(`Unsupported Open Loop status: ${loop.status}`);
    if (!loop.title.trim() || !loop.context.trim()) throw new Error(`Open Loop ${loop.id} requires title and context`);
    if (!Number.isInteger(loop.order) || loop.order < 0) throw new Error(`Open Loop ${loop.id} has invalid order`);
    if (!validDate(loop.publishedAt)) throw new Error(`Open Loop ${loop.id} has invalid publishedAt`);
    if (loop.cta && (!loop.cta.label.trim() || !isSafeOpenLoopHref(loop.cta.href))) {
      throw new Error(`Open Loop ${loop.id} has an unsafe CTA`);
    }
  }
}

export function selectActiveOpenLoops(openLoops: readonly OpenLoop[]): OpenLoop[] {
  validateOpenLoops(openLoops);
  return openLoops
    .filter(({ status }) => status === "active")
    .sort((left, right) => left.order - right.order || left.id.localeCompare(right.id, "en"));
}

export function getHumanPulseContent(locale: Locale): HumanPulseContent {
  const now = getHomeCopy(locale).now;
  if (now.items.length < 4 || now.labels.length < 4) throw new Error("Human Pulse requires the four accepted Now entries");

  return {
    rightNow: now.items.slice(0, 3).map((text, index) => ({
      id: `right-now-${index + 1}`,
      label: now.labels[index] ?? "",
      text,
    })),
    onMyMind: {
      id: "on-my-mind",
      label: now.labels[3] ?? "",
      text: now.items[3] ?? "",
    },
    next: humanPulseEditorial.next[locale],
    openLoops: selectActiveOpenLoops(humanPulseEditorial.openLoops[locale]),
  };
}
