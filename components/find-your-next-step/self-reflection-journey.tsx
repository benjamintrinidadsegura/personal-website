"use client";

import { useEffect, useMemo, useReducer, useRef } from "react";

import {
  getSelfReflectionIntro,
  getSelfReflectionQuestions,
  getSelfReflectionSections,
} from "@/data/find-your-next-step-self";
import { useLocale } from "@/components/i18n/locale-context";
import {
  buildSelfReflectionResult,
  formatSelfReflectionSelectionCount,
  initialSelfReflectionState,
  selfReflectionJourneyReducer,
} from "@/lib/find-your-next-step-self";
import { JourneyDock } from "@/components/find-your-next-step/journey-dock";
import { HumanContextReflection } from "@/components/find-your-next-step/human-context-reflection";
import { FynsResultActions } from "@/components/find-your-next-step/result-actions";
import {
  FynsResultRecovery,
  FynsResultSupplementFallback,
} from "@/components/find-your-next-step/result-recovery";
import { SelfHandbookView } from "@/components/find-your-next-step/self-handbook";
import { SelfProfileIdentityView } from "@/components/find-your-next-step/self-profile-identity";
import { buildSelfHandbook } from "@/lib/find-your-next-step-self-handbook";
import type { SelfHandbook } from "@/lib/find-your-next-step-self-handbook";
import { buildSelfProfileIdentity } from "@/lib/find-your-next-step-self-profile";
import type { SelfProfileIdentityResult } from "@/lib/find-your-next-step-self-profile";
import {
  buildSelfResultText,
  buildSelfShareText,
  SELF_RESULT_DISCLAIMER,
  SELF_RESULT_DISCLAIMER_EN,
} from "@/lib/find-your-next-step-self-export";
import type { Locale } from "@/lib/i18n/config";
import { selfGeneratedCopy } from "@/data/find-your-next-step-self-locales";
import type {
  SelfReflectionQuestion,
  SelfReflectionResult,
  SelfReflectionResultStatement,
  SelfReflectionTensionResult,
  SelfReflectionVisibility,
} from "@/types/find-your-next-step";

const selfUi = {
  de: { based: "Worauf basiert das?", chosen: "Auf diesen von dir gewählten Antworten:", clear: "Besonders klar sichtbar", multiple: "Mehrfach sichtbar", contextual: "Kontextabhängiger Hinweis", contextualText: "Dieses Muster zeigt sich in mehreren Antworten, scheint laut deiner Auswahl aber von Situation und Aufgabe abzuhängen.", summary: "Zusammenfassung", tensions: "Spannungsfelder", reflection: "Deine Reflexion · Nicht gespeichert", noContradiction: "Kein Widerspruch · eine Kombination", tensionText: "Mehrere Bedingungen können gleichzeitig wichtig sein. Genau diese Verbindung kann einen hilfreichen persönlichen Kontext beschreiben.", profileUnavailable: "Die zusätzliche Profil-Linse ist gerade nicht verfügbar.", handbookUnavailable: "Das persönliche Handbuch ist gerade nicht verfügbar.", edit: "Antworten anpassen", editText: "Öffne einen Abschnitt erneut. Deine übrigen Antworten bleiben erhalten und das Ergebnis wird danach neu erzeugt.", later: "Später anschlussfähig", laterText: "Diese Reflexion könnte später helfen, Arbeitsumfelder und berufliche Richtungen bewusster einzuordnen. In dieser Beta findet noch keine automatische Weiterleitung oder berufliche Empfehlung statt.", restart: "Neu starten", discardTitle: "Alle aktuellen Antworten verwerfen?", discardText: "Dieser Schritt kann nach dem Bestätigen nicht rückgängig gemacht werden.", keep: "Behalten", discard: "Antworten verwerfen", can: "Wobei sie helfen kann", cannot: "Was sie nicht leisten kann", local: "Nur für diesen Moment", start: "Reflexion starten", coreUnavailable: "Dein Kernergebnis konnte gerade nicht aufgebaut werden.", coreMessage: "Deine Antworten bleiben im aktuellen Seitenzustand erhalten. Kehre zu den Fragen zurück und versuche es nach einer kleinen Anpassung erneut.", incomplete: "Deine Reflexion ist noch nicht vollständig.", incompleteMessage: "Beantworte die noch offenen Fragen, bevor FYNS dein Ergebnis erneut aufbaut.", backQuestions: "Zurück zu den Fragen", update: "Ergebnis aktualisieren", view: "Ergebnis ansehen", next: "Weiter", backResult: "Zurück zum Ergebnis", backIntro: "Zurück zur Einführung", back: "Zurück", decision: "Reflexionsentscheidung", selected: "Ausgewählt", progress: "Steuerung und Fortschritt der Reflexion" },
  en: { based: "What is this based on?", chosen: "On these answers you selected:", clear: "Especially clearly visible", multiple: "Visible several times", contextual: "Context-dependent note", contextualText: "This pattern appears in several answers, but your selection suggests that it depends on the situation and task.", summary: "Summary", tensions: "Tensions", reflection: "Your reflection · Not stored", noContradiction: "Not a contradiction · a combination", tensionText: "Several conditions can matter at the same time. That connection itself may describe a useful personal context.", profileUnavailable: "The additional profile lens is not available right now.", handbookUnavailable: "The personal handbook is not available right now.", edit: "Adjust answers", editText: "Reopen a section. Your other answers remain in place and the result is then rebuilt.", later: "Designed to connect later", laterText: "This reflection may later help you assess work environments and career directions more deliberately. In this beta there is no automatic hand-off or career recommendation.", restart: "Start again", discardTitle: "Discard all current answers?", discardText: "This cannot be undone after you confirm.", keep: "Keep answers", discard: "Discard answers", can: "What it can help with", cannot: "What it cannot do", local: "Only for this moment", start: "Start reflection", coreUnavailable: "Your core result could not be built right now.", coreMessage: "Your answers remain in the current page state. Return to the questions and try again after making a small adjustment.", incomplete: "Your reflection is not complete yet.", incompleteMessage: "Answer the remaining questions before FYNS rebuilds your result.", backQuestions: "Back to the questions", update: "Update result", view: "View result", next: "Continue", backResult: "Back to result", backIntro: "Back to introduction", back: "Back", decision: "Reflection choice", selected: "Selected", progress: "Controls and progress for the reflection" },
  es: { based: "¿En qué se basa?", chosen: "En estas respuestas que elegiste:", clear: "Especialmente visible", multiple: "Visible varias veces", contextual: "Indicación dependiente del contexto", contextualText: "Este patrón aparece en varias respuestas, pero tu selección sugiere que depende de la situación y la tarea.", summary: "Resumen", tensions: "Tensiones", reflection: "Tu reflexión · No se guarda", noContradiction: "No es una contradicción · es una combinación", tensionText: "Varias condiciones pueden importar al mismo tiempo. Esa relación puede describir un contexto personal útil.", profileUnavailable: "La lente de perfil adicional no está disponible ahora.", handbookUnavailable: "El manual personal no está disponible ahora.", edit: "Ajustar respuestas", editText: "Vuelve a abrir una sección. Las demás respuestas se conservan y después se genera de nuevo el resultado.", later: "Preparado para conectar más adelante", laterText: "Esta reflexión puede ayudarte más adelante a valorar con mayor intención entornos de trabajo y rumbos profesionales. En esta beta no hay derivación automática ni recomendación profesional.", restart: "Empezar de nuevo", discardTitle: "¿Descartar todas las respuestas actuales?", discardText: "No podrás deshacerlo después de confirmar.", keep: "Conservar respuestas", discard: "Descartar respuestas", can: "En qué puede ayudarte", cannot: "Lo que no puede hacer", local: "Solo para este momento", start: "Empezar la reflexión", coreUnavailable: "No se ha podido construir ahora tu resultado principal.", coreMessage: "Tus respuestas permanecen en el estado actual de la página. Vuelve a las preguntas e inténtalo tras hacer un pequeño ajuste.", incomplete: "Tu reflexión aún no está completa.", incompleteMessage: "Responde a las preguntas pendientes antes de que FYNS vuelva a crear el resultado.", backQuestions: "Volver a las preguntas", update: "Actualizar resultado", view: "Ver resultado", next: "Continuar", backResult: "Volver al resultado", backIntro: "Volver a la introducción", back: "Atrás", decision: "Elección de reflexión", selected: "Seleccionado", progress: "Controles y progreso de la reflexión" },
  tr: { based: "Bu neye dayanıyor?", chosen: "Seçtiğin şu yanıtlara:", clear: "Özellikle belirgin", multiple: "Birden çok kez görülüyor", contextual: "Bağlama bağlı işaret", contextualText: "Bu örüntü birden fazla yanıtta görülüyor; ancak seçimin, duruma ve göreve bağlı olduğunu düşündürüyor.", summary: "Özet", tensions: "Gerilim alanları", reflection: "Yansıman · Kaydedilmez", noContradiction: "Çelişki değil · bir birleşim", tensionText: "Birden fazla koşul aynı anda önemli olabilir. Bu bağ, sana yararlı bir kişisel bağlamı tarif edebilir.", profileUnavailable: "Ek profil merceği şu anda kullanılamıyor.", handbookUnavailable: "Kişisel el kitabı şu anda kullanılamıyor.", edit: "Yanıtları düzenle", editText: "Bir bölümü yeniden aç. Diğer yanıtların korunur ve sonuç yeniden oluşturulur.", later: "Sonradan bağlanmaya hazır", laterText: "Bu yansıma daha sonra çalışma ortamlarını ve kariyer yönlerini daha bilinçli değerlendirmeni destekleyebilir. Bu beta sürümünde otomatik aktarım veya kariyer önerisi yoktur.", restart: "Yeniden başla", discardTitle: "Mevcut yanıtların tümü silinsin mi?", discardText: "Onayladıktan sonra bu işlem geri alınamaz.", keep: "Yanıtları koru", discard: "Yanıtları sil", can: "Neye yardımcı olabilir?", cannot: "Neyi yapamaz?", local: "Yalnızca bu an için", start: "Yansımaya başla", coreUnavailable: "Temel sonucun şu anda oluşturulamadı.", coreMessage: "Yanıtların sayfanın mevcut durumunda kalır. Sorulara dön, küçük bir düzenleme yapıp tekrar dene.", incomplete: "Yansıman henüz tamamlanmadı.", incompleteMessage: "FYNS sonucunu yeniden oluşturmadan önce kalan soruları yanıtla.", backQuestions: "Sorulara dön", update: "Sonucu güncelle", view: "Sonucu gör", next: "Devam et", backResult: "Sonuca dön", backIntro: "Girişe dön", back: "Geri", decision: "Yansıma seçimi", selected: "Seçildi", progress: "Yansıma kontrolleri ve ilerlemesi" },
  pl: { based: "Na czym to się opiera?", chosen: "Na tych wybranych przez Ciebie odpowiedziach:", clear: "Szczególnie wyraźne", multiple: "Widoczne wielokrotnie", contextual: "Wskazówka zależna od kontekstu", contextualText: "Ten wzorzec pojawia się w kilku odpowiedziach, ale Twój wybór sugeruje, że zależy od sytuacji i zadania.", summary: "Podsumowanie", tensions: "Napięcia", reflection: "Twoja refleksja · Nie zapisujemy jej", noContradiction: "To nie sprzeczność · to połączenie", tensionText: "Kilka warunków może mieć znaczenie jednocześnie. Właśnie to połączenie może opisywać ważny osobisty kontekst.", profileUnavailable: "Dodatkowa soczewka profilu jest teraz niedostępna.", handbookUnavailable: "Osobisty podręcznik jest teraz niedostępny.", edit: "Dostosuj odpowiedzi", editText: "Otwórz ponownie jedną sekcję. Pozostałe odpowiedzi zostaną zachowane, a wynik powstanie ponownie.", later: "Gotowe do późniejszego połączenia", laterText: "Ta refleksja może później pomóc Ci świadomiej oceniać środowiska pracy i kierunki zawodowe. W tej wersji beta nie ma automatycznego przejścia ani rekomendacji zawodowej.", restart: "Zacznij od nowa", discardTitle: "Usunąć wszystkie obecne odpowiedzi?", discardText: "Po potwierdzeniu nie będzie można tego cofnąć.", keep: "Zachowaj odpowiedzi", discard: "Usuń odpowiedzi", can: "W czym może pomóc", cannot: "Czego nie może zrobić", local: "Tylko na ten moment", start: "Zacznij refleksję", coreUnavailable: "Nie udało się teraz zbudować głównego wyniku.", coreMessage: "Odpowiedzi pozostają w bieżącym stanie strony. Wróć do pytań, wprowadź małą zmianę i spróbuj ponownie.", incomplete: "Twoja refleksja nie jest jeszcze kompletna.", incompleteMessage: "Odpowiedz na pozostałe pytania, zanim FYNS ponownie zbuduje wynik.", backQuestions: "Wróć do pytań", update: "Aktualizuj wynik", view: "Zobacz wynik", next: "Dalej", backResult: "Wróć do wyniku", backIntro: "Wróć do wprowadzenia", back: "Wstecz", decision: "Wybór do refleksji", selected: "Wybrano", progress: "Sterowanie i postęp refleksji" },
  el: { based: "Σε τι βασίζεται;", chosen: "Στις απαντήσεις που επέλεξες:", clear: "Ιδιαίτερα ευδιάκριτο", multiple: "Εμφανίζεται επανειλημμένα", contextual: "Ένδειξη που εξαρτάται από το πλαίσιο", contextualText: "Αυτό το μοτίβο εμφανίζεται σε αρκετές απαντήσεις, όμως η επιλογή σου δείχνει ότι εξαρτάται από την κατάσταση και το έργο.", summary: "Σύνοψη", tensions: "Πεδία έντασης", reflection: "Ο αναστοχασμός σου · Δεν αποθηκεύεται", noContradiction: "Δεν είναι αντίφαση · είναι συνδυασμός", tensionText: "Πολλές συνθήκες μπορούν να έχουν σημασία ταυτόχρονα. Αυτή η σύνδεση μπορεί να περιγράφει ένα χρήσιμο προσωπικό πλαίσιο.", profileUnavailable: "Ο πρόσθετος φακός προφίλ δεν είναι διαθέσιμος τώρα.", handbookUnavailable: "Το προσωπικό εγχειρίδιο δεν είναι διαθέσιμο τώρα.", edit: "Προσαρμογή απαντήσεων", editText: "Άνοιξε ξανά μια ενότητα. Οι άλλες απαντήσεις διατηρούνται και το αποτέλεσμα δημιουργείται ξανά.", later: "Έτοιμο να συνδεθεί αργότερα", laterText: "Αυτός ο αναστοχασμός μπορεί αργότερα να σε βοηθήσει να εξετάζεις πιο συνειδητά εργασιακά περιβάλλοντα και επαγγελματικές κατευθύνσεις. Σε αυτή την έκδοση beta δεν υπάρχει αυτόματη παραπομπή ή επαγγελματική σύσταση.", restart: "Ξεκίνα ξανά", discardTitle: "Να διαγραφούν όλες οι τρέχουσες απαντήσεις;", discardText: "Δεν αναιρείται μετά την επιβεβαίωση.", keep: "Διατήρηση απαντήσεων", discard: "Διαγραφή απαντήσεων", can: "Σε τι μπορεί να βοηθήσει", cannot: "Τι δεν μπορεί να κάνει", local: "Μόνο για αυτή τη στιγμή", start: "Έναρξη αναστοχασμού", coreUnavailable: "Δεν ήταν δυνατή η δημιουργία του βασικού αποτελέσματός σου τώρα.", coreMessage: "Οι απαντήσεις σου παραμένουν στην τρέχουσα κατάσταση της σελίδας. Επίστρεψε στις ερωτήσεις, κάνε μια μικρή αλλαγή και δοκίμασε ξανά.", incomplete: "Ο αναστοχασμός σου δεν έχει ολοκληρωθεί ακόμη.", incompleteMessage: "Απάντησε στις υπόλοιπες ερωτήσεις πριν το FYNS δημιουργήσει ξανά το αποτέλεσμα.", backQuestions: "Πίσω στις ερωτήσεις", update: "Ενημέρωση αποτελέσματος", view: "Προβολή αποτελέσματος", next: "Συνέχεια", backResult: "Πίσω στο αποτέλεσμα", backIntro: "Πίσω στην εισαγωγή", back: "Πίσω", decision: "Επιλογή αναστοχασμού", selected: "Επιλέχθηκε", progress: "Χειριστήρια και πρόοδος αναστοχασμού" },
  ru: { based: "На чём это основано?", chosen: "На выбранных тобой ответах:", clear: "Особенно отчётливо", multiple: "Проявляется неоднократно", contextual: "Зависит от контекста", contextualText: "Этот паттерн встречается в нескольких ответах, но твой выбор показывает, что он зависит от ситуации и задачи.", summary: "Краткий итог", tensions: "Зоны напряжения", reflection: "Твоё осмысление · Не сохраняется", noContradiction: "Не противоречие · сочетание", tensionText: "Несколько условий могут быть важны одновременно. Именно эта связь может описывать полезный личный контекст.", profileUnavailable: "Дополнительная линза профиля сейчас недоступна.", handbookUnavailable: "Личное руководство сейчас недоступно.", edit: "Изменить ответы", editText: "Открой раздел снова. Остальные ответы сохранятся, а результат будет создан заново.", later: "Можно связать позже", laterText: "Позже это осмысление может помочь тебе внимательнее оценивать рабочую среду и карьерные направления. В этой бета-версии нет автоматического перехода или карьерной рекомендации.", restart: "Начать заново", discardTitle: "Удалить все текущие ответы?", discardText: "После подтверждения это действие нельзя отменить.", keep: "Сохранить ответы", discard: "Удалить ответы", can: "Чем это может помочь", cannot: "Чего это не может", local: "Только для этого момента", start: "Начать осмысление", coreUnavailable: "Сейчас не удалось сформировать основной результат.", coreMessage: "Ответы остаются в текущем состоянии страницы. Вернись к вопросам, внеси небольшое изменение и попробуй ещё раз.", incomplete: "Осмысление ещё не завершено.", incompleteMessage: "Ответь на оставшиеся вопросы, прежде чем FYNS заново сформирует результат.", backQuestions: "Вернуться к вопросам", update: "Обновить результат", view: "Открыть результат", next: "Продолжить", backResult: "Вернуться к результату", backIntro: "Вернуться к введению", back: "Назад", decision: "Выбор для осмысления", selected: "Выбрано", progress: "Управление и ход осмысления" },
} as const satisfies Record<Locale, Record<string, string>>;

const selfSelectionCopy: Record<Locale, { one: string; exact: (count: number) => string; range: (minimum: number, maximum: number) => string; unranked: string }> = {
  de: { one: "Wähle eine Antwort.", exact: (n) => `Wähle genau ${n} Antworten.`, range: (a, b) => `Wähle ${a} bis ${b} Antworten.`, unranked: "Die Auswahl wird nicht in eine Reihenfolge gebracht." },
  en: { one: "Choose one answer.", exact: (n) => `Choose exactly ${n} answers.`, range: (a, b) => `Choose between ${a} and ${b} answers.`, unranked: "Your choices are not ranked." },
  es: { one: selfGeneratedCopy.es.one, exact: selfGeneratedCopy.es.exact, range: selfGeneratedCopy.es.range, unranked: "La selección no establece un orden." },
  tr: { one: selfGeneratedCopy.tr.one, exact: selfGeneratedCopy.tr.exact, range: selfGeneratedCopy.tr.range, unranked: "Seçimler sıralanmaz." },
  pl: { one: selfGeneratedCopy.pl.one, exact: selfGeneratedCopy.pl.exact, range: selfGeneratedCopy.pl.range, unranked: "Wybór nie tworzy rankingu." },
  el: { one: selfGeneratedCopy.el.one, exact: selfGeneratedCopy.el.exact, range: selfGeneratedCopy.el.range, unranked: "Οι επιλογές δεν κατατάσσονται." },
  ru: { one: selfGeneratedCopy.ru.one, exact: selfGeneratedCopy.ru.exact, range: selfGeneratedCopy.ru.range, unranked: "Выбор не образует рейтинг." },
};
const selfDisclaimer: Record<Locale, string> = { de: SELF_RESULT_DISCLAIMER, en: SELF_RESULT_DISCLAIMER_EN, es: "Esta reflexión sirve para orientarte y no es un diagnóstico psicológico.", tr: "Bu yansıma yön bulmaya yardımcı olur; psikolojik tanı değildir.", pl: "Ta refleksja służy orientacji i nie jest diagnozą psychologiczną.", el: "Αυτός ο αναστοχασμός βοηθά στον προσανατολισμό και δεν αποτελεί ψυχολογική διάγνωση.", ru: "Это осмысление служит ориентиром и не является психологическим диагнозом." };
const selfResultTitle: Record<Locale, string> = { de: "FYNS – Self – Ergebnis", en: "FYNS – Self – Result", es: `FYNS – Self – ${selfGeneratedCopy.es.title}`, tr: `FYNS – Self – ${selfGeneratedCopy.tr.title}`, pl: `FYNS – Self – ${selfGeneratedCopy.pl.title}`, el: `FYNS – Self – ${selfGeneratedCopy.el.title}`, ru: `FYNS – Self – ${selfGeneratedCopy.ru.title}` };

const resultVisibilityStyles: Record<
  SelfReflectionVisibility,
  { badge: string; card: string }
> = {
  clear: {
    badge: "border-2 border-[#35d0e5]/65 bg-[#35d0e5]/[0.11] font-black text-[#73e3f1]",
    card: "border-l-2 border-l-[#35d0e5]/70 border-t border-t-[#35d0e5]/30 bg-[#35d0e5]/[0.045]",
  },
  multiple: {
    badge: "border border-[#9aaabd]/45 bg-[#9aaabd]/[0.065] font-bold text-slate-300",
    card: "border-l border-l-[#9aaabd]/45 border-t border-t-[#9aaabd]/20 bg-[#9aaabd]/[0.025]",
  },
};

function selectionInstruction(question: SelfReflectionQuestion, locale: Locale): string {
  const copy = selfSelectionCopy[locale];
  const instruction = question.minSelections === question.maxSelections
    ? question.minSelections === 1 ? copy.one : copy.exact(question.minSelections)
    : copy.range(question.minSelections, question.maxSelections);
  return question.format === "priority"
    ? `${instruction} ${copy.unranked}`
    : instruction;
}

type SafeSelfResultState = ReturnType<typeof buildSelfReflectionResult> | { status: "unavailable" };

function safelyBuildSelfResult(...args: Parameters<typeof buildSelfReflectionResult>): SafeSelfResultState {
  try {
    return buildSelfReflectionResult(...args);
  } catch {
    return { status: "unavailable" };
  }
}

function safelyBuildSelfHandbook(...args: Parameters<typeof buildSelfHandbook>): SelfHandbook | null {
  try {
    return buildSelfHandbook(...args);
  } catch {
    return null;
  }
}

function safelyBuildSelfProfile(
  ...args: Parameters<typeof buildSelfProfileIdentity>
): SelfProfileIdentityResult | null {
  try {
    return buildSelfProfileIdentity(...args);
  } catch {
    return null;
  }
}

function EvidenceDetails({ evidence }: Pick<SelfReflectionResultStatement, "evidence">) {
  const locale = useLocale();
  const ui = selfUi[locale];
  return (
    <details className="mt-5 border-t border-white/10 pt-4 text-sm text-slate-400">
      <summary className="min-h-11 cursor-pointer list-none rounded-lg py-3 font-bold text-[#73e3f1] marker:content-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#35d0e5]">
        {ui.based} <span aria-hidden="true">+</span>
      </summary>
      <p className="mt-2 leading-6">{ui.chosen}</p>
      <ul className="mt-3 grid gap-2">
        {evidence.slice(0, 3).map((item) => (
          <li key={`${item.questionId}-${item.optionId}`} className="border-l border-[#35d0e5]/40 pl-4 leading-6 text-slate-300">
            „{item.answer}“
          </li>
        ))}
      </ul>
    </details>
  );
}

function ResultStatement({ statement }: { statement: SelfReflectionResultStatement }) {
  const locale = useLocale();
  const ui = selfUi[locale];
  const visibilityStyles = statement.visibility ? resultVisibilityStyles[statement.visibility] : null;

  return (
    <article className={`${visibilityStyles?.card ?? "border-l border-t border-white/10 bg-[#061521]/70"} p-6 sm:p-7`}>
      {statement.dimensionLabel ? (
        <div className="flex flex-wrap items-center gap-3">
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-[#35d0e5]">
            {statement.dimensionLabel}
          </p>
          {statement.visibility ? (
            <span className={`rounded-full px-2.5 py-1 text-[10px] uppercase tracking-wider ${visibilityStyles?.badge}`}>
              {statement.visibility === "clear" ? ui.clear : ui.multiple}
            </span>
          ) : null}
        </div>
      ) : null}
      <p className={`${statement.dimensionLabel ? "mt-5" : ""} text-lg font-bold leading-7 text-white`}>
        {statement.text}
      </p>
      {statement.contextual ? (
        <div className="mt-4 border-l-2 border-[#b8a5ff]/65 bg-[#b8a5ff]/[0.055] px-4 py-3">
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#b8a5ff]">
            {ui.contextual}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            {ui.contextualText}
          </p>
        </div>
      ) : null}
      <EvidenceDetails evidence={statement.evidence} />
    </article>
  );
}

function TensionCard({ tension }: { tension: SelfReflectionTensionResult }) {
  return (
    <article className="rounded-[1.5rem] border border-[#ff9a3d]/25 bg-[#ff9a3d]/[0.035] p-6 sm:p-8">
      <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-[#ffb36d]">{tension.title}</p>
      <p className="mt-5 text-lg font-bold leading-8 text-white">{tension.text}</p>
      <EvidenceDetails evidence={tension.evidence} />
    </article>
  );
}

function SelfPrintDocument({ result }: { result: SelfReflectionResult }) {
  const locale = useLocale();
  const ui = selfUi[locale];
  return (
    <article className="fyns-print-document hidden" data-fyns-print-document="self">
      <header className="fyns-print-header">
        <p className="fyns-print-brand">bts.online / FYNS / Self</p>
        <h1>{result.title}</h1>
        <section className="fyns-print-summary" aria-labelledby="self-print-summary-title">
          <h2 id="self-print-summary-title">{ui.summary}</h2>
          {result.summary.map((sentence, index) => <p key={`${index}-${sentence}`}>{sentence}</p>)}
        </section>
        <p className="fyns-print-description">{result.description}</p>
      </header>

      {result.sections
        .filter((section) => section.statements.length > 0)
        .map((section) => (
          <section key={section.id} className="fyns-print-section" aria-labelledby={`self-print-section-${section.id}`}>
            <h2 id={`self-print-section-${section.id}`}>{section.title}</h2>
            <div className="fyns-print-stack">
              {section.statements.map((statement) => (
                <article key={statement.id} className="fyns-print-block">
                  {statement.dimensionLabel ? <p className="fyns-print-label">{statement.dimensionLabel}</p> : null}
                  <p>{statement.text}</p>
                  {statement.contextual ? (
                    <p className="fyns-print-note">
                      {ui.contextual}: {ui.contextualText}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        ))}

      {result.tensions.length > 0 ? (
        <section className="fyns-print-section" aria-labelledby="self-print-tensions-title">
          <h2 id="self-print-tensions-title">{ui.tensions}</h2>
          <div className="fyns-print-stack">
            {result.tensions.slice(0, 2).map((tension) => (
              <article key={tension.id} className="fyns-print-block">
                <h3>{tension.title}</h3>
                <p>{tension.text}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <p className="fyns-print-disclaimer">{selfDisclaimer[locale]}</p>
    </article>
  );
}

function ResultView({
  result,
  handbook,
  profileIdentity,
  dispatch,
  headingRef,
  restartPending,
}: {
  result: SelfReflectionResult;
  handbook: SelfHandbook | null;
  profileIdentity: SelfProfileIdentityResult | null;
  dispatch: React.Dispatch<Parameters<typeof selfReflectionJourneyReducer>[1]>;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  restartPending: boolean;
}) {
  const locale = useLocale();
  const ui = selfUi[locale];
  const selfReflectionSections = getSelfReflectionSections(locale);
  const copyText = buildSelfResultText(result, locale);
  const shareText = buildSelfShareText(result, locale);

  return (
    <>
    <section aria-labelledby="self-result-title" className="py-16 sm:py-24" data-fyns-screen-result>
      <div className="grid gap-8 border-b border-white/15 pb-14 lg:grid-cols-[1fr_0.72fr] lg:items-end">
        <div>
          <p className="font-mono text-xs font-black uppercase tracking-[0.25em] text-[#35d0e5]">{ui.reflection}</p>
          <h2
            ref={headingRef}
            tabIndex={-1}
            style={{ outline: "none" }}
            id="self-result-title"
            className="mt-6 max-w-4xl text-[clamp(2.5rem,7vw,5.8rem)] font-black leading-[0.92] tracking-[-0.05em] text-white outline-none"
          >
            {result.title}
          </h2>
          <div className="mt-7 max-w-3xl space-y-3 text-lg font-bold leading-8 text-slate-200 sm:text-xl sm:leading-9">
            {result.summary.map((sentence, index) => (
              <p key={`${index}-${sentence}`}>{sentence}</p>
            ))}
          </div>
        </div>
        <p className="border-l border-[#35d0e5] pl-7 text-base leading-7 text-slate-300 sm:pl-9">
          {result.description}
        </p>
      </div>

      <HumanContextReflection accent="#35d0e5" titleId="self-human-context-title" />

      {profileIdentity ? (
        <SelfProfileIdentityView identity={profileIdentity} />
      ) : (
        <FynsResultSupplementFallback
          accent="#35d0e5"
          titleId="self-profile-unavailable-title"
          title={ui.profileUnavailable}
        />
      )}

      <div className="mt-14 grid gap-16">
        {result.sections.map((section) => (
          <section key={section.id} aria-labelledby={`result-section-${section.id}`}>
            <h3 id={`result-section-${section.id}`} className="max-w-3xl text-2xl font-black text-white sm:text-4xl">
              {section.title}
            </h3>
            <div className="mt-7 grid gap-4 lg:grid-cols-3">
              {section.statements.map((statement) => (
                <ResultStatement key={statement.id} statement={statement} />
              ))}
            </div>
          </section>
        ))}

        {result.tensions.length > 0 ? (
          <section aria-labelledby="self-tensions-title">
            <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[#ff9a3d]">{ui.noContradiction}</p>
            <h3 id="self-tensions-title" className="mt-4 max-w-3xl text-2xl font-black text-white sm:text-4xl">{ui.tensions}</h3>
            <p className="mt-4 max-w-3xl leading-7 text-slate-400">{ui.tensionText}</p>
            <div className="mt-7 grid gap-5 lg:grid-cols-2">
              {result.tensions.map((tension) => <TensionCard key={tension.id} tension={tension} />)}
            </div>
          </section>
        ) : null}
      </div>

      {handbook ? (
        <SelfHandbookView handbook={handbook} />
      ) : (
        <FynsResultSupplementFallback
          accent="#35d0e5"
          titleId="self-handbook-unavailable-title"
          title={ui.handbookUnavailable}
        />
      )}

      <FynsResultActions
        accent="#35d0e5"
        copyText={copyText}
        shareTitle={selfResultTitle[locale]}
        shareText={shareText}
        printTitle={selfResultTitle[locale]}
      />

      <section aria-labelledby="edit-answers-title" className="mt-20 border-t border-white/15 pt-14">
        <div className="grid gap-8 lg:grid-cols-[0.65fr_1fr]">
          <div>
            <h3 id="edit-answers-title" className="text-2xl font-black text-white">{ui.edit}</h3>
            <p className="mt-4 max-w-md leading-7 text-slate-400">{ui.editText}</p>
          </div>
          <ol className="grid gap-3 sm:grid-cols-2">
            {selfReflectionSections.map((section, index) => (
              <li key={section.id}>
                <button
                  type="button"
                  onClick={() => dispatch({ type: "edit-section", sectionId: section.id })}
                  className="flex min-h-14 w-full items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.025] px-5 py-4 text-left font-bold text-slate-200 transition hover:border-[#35d0e5]/45 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#35d0e5]"
                >
                  <span className="font-mono text-xs text-[#35d0e5]">{String(index + 1).padStart(2, "0")}</span>
                  {section.title}
                </button>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <aside className="mt-14 rounded-[1.5rem] border border-white/10 bg-white/[0.025] p-6 sm:p-8">
        <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[#35d0e5]">{ui.later}</p>
        <p className="mt-4 max-w-3xl leading-7 text-slate-300">{ui.laterText}</p>
      </aside>

      <div className="mt-12 border-t border-white/10 pt-10">
        {!restartPending ? (
          <button
            type="button"
            onClick={() => dispatch({ type: "request-restart" })}
            className="inline-flex min-h-12 items-center rounded-full border border-white/15 px-6 py-3 font-bold text-slate-300 transition hover:border-[#ff9a3d]/60 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ff9a3d]"
          >
            {ui.restart}
          </button>
        ) : (
          <div className="max-w-2xl rounded-2xl border border-[#ff9a3d]/30 bg-[#ff9a3d]/[0.04] p-6">
            <p className="font-bold text-white">{ui.discardTitle}</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">{ui.discardText}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button type="button" onClick={() => dispatch({ type: "cancel-restart" })} className="min-h-11 rounded-full border border-white/15 px-5 py-2 font-bold text-slate-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#35d0e5]">
                {ui.keep}
              </button>
              <button type="button" onClick={() => dispatch({ type: "confirm-restart" })} className="min-h-11 rounded-full bg-[#ff9a3d] px-5 py-2 font-black text-[#241204] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff9a3d]">
                {ui.discard}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
    <SelfPrintDocument result={result} />
    </>
  );
}

export function SelfReflectionJourney() {
  const locale = useLocale();
  const ui = selfUi[locale];
  const selfReflectionIntro = getSelfReflectionIntro(locale);
  const selfReflectionQuestions = getSelfReflectionQuestions(locale);
  const selfReflectionSections = getSelfReflectionSections(locale);
  const [state, dispatch] = useReducer(
    (current: typeof initialSelfReflectionState, action: Parameters<typeof selfReflectionJourneyReducer>[1]) => selfReflectionJourneyReducer(current, action, locale),
    initialSelfReflectionState,
  );
  const headingRef = useRef<HTMLHeadingElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const initialRender = useRef(true);
  const question = selfReflectionQuestions[state.questionIndex];
  const resultState = useMemo(() => safelyBuildSelfResult(state.answers, locale), [locale, state.answers]);
  const handbook = useMemo(() => safelyBuildSelfHandbook(state.answers, locale), [locale, state.answers]);
  const profileIdentity = useMemo(() =>
    resultState.status === "complete"
      ? safelyBuildSelfProfile(state.answers, resultState.result, locale)
      : null,
  [locale, resultState, state.answers]);

  useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [state.phase, state.questionIndex]);

  useEffect(() => {
    if (state.validationMessage) {
      errorRef.current?.focus();
      errorRef.current?.scrollIntoView({ block: "center" });
    }
  }, [state.validationMessage]);

  if (state.phase === "intro") {
    return (
      <section aria-labelledby="self-intro-title" className="py-16 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-[1fr_0.82fr] lg:items-start">
          <div>
            <p className="font-mono text-xs font-black uppercase tracking-[0.24em] text-[#35d0e5]">{selfReflectionIntro.eyebrow}</p>
            <h2 ref={headingRef} tabIndex={-1} style={{ outline: "none" }} id="self-intro-title" className="mt-6 max-w-4xl text-3xl font-black leading-tight text-white outline-none sm:text-5xl">
              {selfReflectionIntro.title}
            </h2>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">{selfReflectionIntro.description}</p>
            <p className="mt-8 font-mono text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{selfReflectionIntro.duration}</p>
          </div>
          <div className="grid gap-5">
            <div className="rounded-[1.5rem] border border-[#35d0e5]/20 bg-[#35d0e5]/[0.035] p-6 sm:p-7">
              <h3 className="font-black text-white">{ui.can}</h3>
              <ul className="mt-5 grid gap-3 text-sm leading-6 text-slate-300">
                {selfReflectionIntro.canDo.map((item) => <li key={item} className="border-l border-[#35d0e5]/50 pl-4">{item}</li>)}
              </ul>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.025] p-6 sm:p-7">
              <h3 className="font-black text-white">{ui.cannot}</h3>
              <ul className="mt-5 grid gap-3 text-sm leading-6 text-slate-400">
                {selfReflectionIntro.cannotDo.map((item) => <li key={item} className="border-l border-white/15 pl-4">{item}</li>)}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 border-l-2 border-[#ff9a3d] bg-[#ff9a3d]/[0.035] p-6 sm:p-8">
          <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[#ffb36d]">{ui.local}</p>
          <p className="mt-4 max-w-3xl font-bold leading-7 text-white">{selfReflectionIntro.privacy}</p>
        </div>

        <button
          type="button"
          onClick={() => dispatch({ type: "start" })}
          className="mt-10 inline-flex min-h-14 items-center rounded-full bg-[#35d0e5] px-7 py-4 font-black text-[#041018] transition motion-safe:hover:-translate-y-0.5 hover:bg-[#73e3f1] motion-reduce:transform-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#35d0e5]"
        >
          {ui.start} <span aria-hidden="true" className="ml-3">→</span>
        </button>
      </section>
    );
  }

  if (state.phase === "result") {
    if (resultState.status === "unavailable") {
      return (
        <FynsResultRecovery
          accent="#35d0e5"
          titleId="self-result-unavailable-title"
          title={ui.coreUnavailable}
          message={ui.coreMessage}
          actionLabel={ui.backQuestions}
          onAction={() => dispatch({ type: "edit-section", sectionId: selfReflectionSections[0].id })}
          headingRef={headingRef}
        />
      );
    }
    if (resultState.status !== "complete") {
      return (
        <FynsResultRecovery
          accent="#35d0e5"
          titleId="incomplete-result-title"
          title={ui.incomplete}
          message={ui.incompleteMessage}
          actionLabel={ui.backQuestions}
          onAction={() => dispatch({ type: "edit-section", sectionId: selfReflectionSections[0].id })}
          headingRef={headingRef}
        />
      );
    }
    return <ResultView result={resultState.result} handbook={handbook} profileIdentity={profileIdentity} dispatch={dispatch} headingRef={headingRef} restartPending={state.restartPending} />;
  }

  const selectedOptionIds = state.answers[question.id] ?? [];
  const sectionQuestions = selfReflectionQuestions.filter(({ sectionId }) => sectionId === question.sectionId);
  const currentSection = selfReflectionSections.find(({ id }) => id === question.sectionId);
  const currentSectionIndex = selfReflectionSections.findIndex(({ id }) => id === question.sectionId);
  const currentQuestionNumber = sectionQuestions.findIndex(({ id }) => id === question.id) + 1;
  const lastInSection = sectionQuestions.at(-1)?.id === question.id;
  const lastInJourney = state.questionIndex === selfReflectionQuestions.length - 1;
  const nextLabel = state.editingSectionId && lastInSection
    ? ui.update
    : lastInJourney
      ? ui.view
      : ui.next;
  const backLabel = state.editingSectionId && sectionQuestions[0]?.id === question.id
    ? ui.backResult
    : state.questionIndex === 0
      ? ui.backIntro
      : ui.back;
  const guidanceId = `${question.id}-guidance`;
  const errorId = `${question.id}-error`;

  return (
    <section className="pb-[calc(12rem+env(safe-area-inset-bottom))] pt-14 sm:pt-20 lg:pb-[calc(8.5rem+env(safe-area-inset-bottom))]">
      <form
        className="mx-auto max-w-4xl py-12 sm:py-16"
        aria-labelledby={`${question.id}-title`}
        onSubmit={(event) => {
          event.preventDefault();
          dispatch({ type: "continue" });
        }}
      >
        <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-slate-500">
          {currentSection?.title} · {ui.decision} {String(state.questionIndex + 1).padStart(2, "0")}
        </p>
        <h2 ref={headingRef} tabIndex={-1} style={{ outline: "none" }} id={`${question.id}-title`} className="mt-5 scroll-mb-[calc(12rem+env(safe-area-inset-bottom))] text-3xl font-black leading-tight text-white outline-none sm:text-5xl lg:scroll-mb-[calc(8.5rem+env(safe-area-inset-bottom))]">
          {question.prompt}
        </h2>
        {question.context ? <p className="mt-5 max-w-3xl text-base leading-7 text-slate-400 sm:text-lg">{question.context}</p> : null}

        <fieldset aria-describedby={`${guidanceId}${state.validationMessage ? ` ${errorId}` : ""}`} className="mt-10">
          <legend className="sr-only">{question.prompt}</legend>
          <div id={guidanceId} className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-400">
            <span>{selectionInstruction(question, locale)}</span>
            <span className="ml-auto inline-flex min-h-8 shrink-0 items-center rounded-full border border-[#ff9a3d]/35 bg-[#ff9a3d]/[0.055] px-3 py-1 font-mono text-xs font-bold text-[#ffb36d]">
              {formatSelfReflectionSelectionCount(selectedOptionIds.length, question.maxSelections, locale)}
            </span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {question.options.map((option) => {
              const selected = selectedOptionIds.includes(option.id);
              const inputType = question.format === "single" ? "radio" : "checkbox";
              return (
                <label key={option.id} className="group relative cursor-pointer">
                  <input
                    type={inputType}
                    name={question.id}
                    value={option.id}
                    checked={selected}
                    onChange={() => dispatch({ type: "toggle-option", questionId: question.id, optionId: option.id })}
                    className="peer sr-only scroll-mb-[calc(12rem+env(safe-area-inset-bottom))] lg:scroll-mb-[calc(8.5rem+env(safe-area-inset-bottom))]"
                  />
                  <span className={`flex min-h-20 items-start justify-between gap-4 rounded-2xl border px-5 py-5 text-left transition peer-focus-visible:outline-2 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-[#35d0e5] ${selected ? "border-[#35d0e5]/70 bg-[#35d0e5]/[0.09] text-white" : "border-white/10 bg-white/[0.025] text-slate-300 group-hover:border-white/25 group-hover:text-white"}`}>
                    <span className="font-bold leading-6">{option.label}</span>
                    <span aria-hidden="true" className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center border text-xs font-black ${inputType === "radio" ? "rounded-full" : "rounded-md"} ${selected ? "border-[#35d0e5] bg-[#35d0e5] text-[#041018]" : "border-white/25 text-transparent"}`}>
                      ✓
                    </span>
                    {selected ? <span className="sr-only">{ui.selected}</span> : null}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {state.validationMessage ? (
          <p ref={errorRef} tabIndex={-1} style={{ outline: "none" }} id={errorId} role="alert" className="mt-5 scroll-mb-[calc(12rem+env(safe-area-inset-bottom))] border-l-2 border-[#ff9a3d] pl-4 font-bold text-[#ffb36d] outline-none lg:scroll-mb-[calc(8.5rem+env(safe-area-inset-bottom))]">
            {state.validationMessage}
          </p>
        ) : null}

        <JourneyDock
          locale={locale}
          sections={selfReflectionSections}
          currentSectionIndex={currentSectionIndex}
          globalQuestionNumber={state.questionIndex + 1}
          totalQuestionCount={selfReflectionQuestions.length}
          localQuestionNumber={currentQuestionNumber}
          localQuestionCount={sectionQuestions.length}
          accent="#35d0e5"
          accessibleLabel={ui.progress}
          backLabel={backLabel}
          nextLabel={nextLabel}
          onBack={() => dispatch({ type: "back" })}
        />
      </form>
    </section>
  );
}
