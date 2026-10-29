import type { ConnectionReason, ContentReference } from "@/data/contextual-journeys";
import type { Locale } from "@/lib/i18n/config";

type ContextualCopy = { title: string; kinds: Record<ContentReference["kind"], string>; reasons: Record<ConnectionReason, string> };

export const contextualCopy: Record<Locale, ContextualCopy> = {
  de: {
    title: "Ein Gedanke führt zum nächsten.",
    kinds: { writing: "Writing", project: "Projekt", person: "Gespräch", experience: "Erlebnis", world: "World Map" },
    reasons: {
      understood: "Eine zweite Perspektive auf Verstehen und Verstandenwerden.", beyondCv: "Der Mensch hinter dem Lebenslauf.",
      recruiting: "Ein Gespräch über Menschen und Recruiting.", careerReflection: "Von Karrieregeschichten zur eigenen beruflichen Richtung.",
      mapContext: "Der veröffentlichte geografische Kontext zu diesem Gespräch.", conversationProject: "Das Projekt hinter diesen Gesprächen.",
    },
  },
  en: {
    title: "One thought leads to another.",
    kinds: { writing: "Writing", project: "Project", person: "Conversation", experience: "Experience", world: "World Map" },
    reasons: {
      understood: "Another angle on understanding and being understood.", beyondCv: "The person behind the CV.",
      recruiting: "A conversation about people and recruiting.", careerReflection: "From career stories to your own career direction.",
      mapContext: "The published geographical context for this conversation.", conversationProject: "The project behind these conversations.",
    },
  },
  es: {
    title: "Una idea lleva a otra.",
    kinds: { writing: "Writing", project: "Proyecto", person: "Conversación", experience: "Experiencia", world: "World Map" },
    reasons: {
      understood: "Otra perspectiva sobre comprender y ser comprendido.", beyondCv: "La persona detrás del currículum.",
      recruiting: "Una conversación sobre personas y selección de talento.", careerReflection: "De historias profesionales a tu propio rumbo laboral.",
      mapContext: "El contexto geográfico publicado de esta conversación.", conversationProject: "El proyecto detrás de estas conversaciones.",
    },
  },
  tr: {
    title: "Bir düşünce diğerine kapı açar.",
    kinds: { writing: "Yazı", project: "Proje", person: "Sohbet", experience: "Deneyim", world: "World Map" },
    reasons: {
      understood: "Anlamak ve anlaşılmak üzerine başka bir bakış.", beyondCv: "Özgeçmişin arkasındaki insan.",
      recruiting: "İnsanlar ve işe alım üzerine bir sohbet.", careerReflection: "Kariyer hikâyelerinden kendi mesleki yönüne.",
      mapContext: "Bu sohbetin yayımlanmış coğrafi bağlamı.", conversationProject: "Bu sohbetlerin arkasındaki proje.",
    },
  },
  pl: {
    title: "Jedna myśl prowadzi do kolejnej.",
    kinds: { writing: "Tekst", project: "Projekt", person: "Rozmowa", experience: "Doświadczenie", world: "World Map" },
    reasons: {
      understood: "Inne spojrzenie na rozumienie i bycie rozumianym.", beyondCv: "Człowiek za życiorysem.",
      recruiting: "Rozmowa o ludziach i rekrutacji.", careerReflection: "Od historii zawodowych do własnego kierunku kariery.",
      mapContext: "Opublikowany kontekst geograficzny tej rozmowy.", conversationProject: "Projekt stojący za tymi rozmowami.",
    },
  },
  el: {
    title: "Μια σκέψη οδηγεί στην επόμενη.",
    kinds: { writing: "Κείμενο", project: "Έργο", person: "Συζήτηση", experience: "Εμπειρία", world: "World Map" },
    reasons: {
      understood: "Μια άλλη οπτική στο να καταλαβαίνεις και να σε καταλαβαίνουν.", beyondCv: "Ο άνθρωπος πίσω από το βιογραφικό.",
      recruiting: "Μια συζήτηση για ανθρώπους και προσλήψεις.", careerReflection: "Από ιστορίες σταδιοδρομίας στη δική σου επαγγελματική κατεύθυνση.",
      mapContext: "Το δημοσιευμένο γεωγραφικό πλαίσιο αυτής της συζήτησης.", conversationProject: "Το έργο πίσω από αυτές τις συζητήσεις.",
    },
  },
  ru: {
    title: "Одна мысль ведёт к другой.",
    kinds: { writing: "Текст", project: "Проект", person: "Разговор", experience: "Опыт", world: "World Map" },
    reasons: {
      understood: "Другой взгляд на понимание и желание быть понятым.", beyondCv: "Человек за резюме.",
      recruiting: "Разговор о людях и подборе персонала.", careerReflection: "От карьерных историй к собственному профессиональному направлению.",
      mapContext: "Опубликованный географический контекст этого разговора.", conversationProject: "Проект, стоящий за этими разговорами.",
    },
  },
};
