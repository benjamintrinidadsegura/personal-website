"use client";

import { useEffect, useMemo, useReducer, useRef } from "react";
import type { CSSProperties } from "react";

import { JourneyDock } from "@/components/find-your-next-step/journey-dock";
import { FynsResultActions } from "@/components/find-your-next-step/result-actions";
import { getIdeaIntro, getIdeaQuestions, getIdeaSections } from "@/data/find-your-next-step-idea";
import { ideaGeneratedCopy } from "@/data/find-your-next-step-idea-locales";
import { useLocale } from "@/components/i18n/locale-context";
import {
  buildIdeaResult,
  formatIdeaSelectionCount,
  ideaJourneyReducer,
  ideaSectionProgress,
  initialIdeaState,
  selectedIdeaOptions,
} from "@/lib/find-your-next-step-idea";
import {
  buildIdeaResultText,
  buildIdeaShareText,
  getIdeaResultDisclaimer,
} from "@/lib/find-your-next-step-idea-export";
import type { Locale } from "@/lib/i18n/config";
import type { IdeaChoiceQuestion, IdeaQuestion, IdeaResult, IdeaSectionId } from "@/types/find-your-next-step-idea";

const IDEA_ACCENT = "#77e5b5";

const ideaSnapshotLabels: Record<Locale, { idea: string; problem: string; audience: string; value: string }> = {
  de: { idea: "Idee", problem: "Problem", audience: "Menschen", value: "Möglicher Nutzen" }, en: { idea: "Idea", problem: "Problem", audience: "People", value: "Possible value" },
  es: ideaGeneratedCopy.es.labels, tr: ideaGeneratedCopy.tr.labels, pl: ideaGeneratedCopy.pl.labels, el: ideaGeneratedCopy.el.labels, ru: ideaGeneratedCopy.ru.labels,
};
const ideaResultTitle: Record<Locale, string> = {
  de: "FYNS – Idea – Arbeitskarte", en: "FYNS – Idea – Working map", es: `FYNS – Idea – ${ideaGeneratedCopy.es.title}`, tr: `FYNS – Fikir – ${ideaGeneratedCopy.tr.title}`, pl: `FYNS – Pomysł – ${ideaGeneratedCopy.pl.title}`, el: `FYNS – Ιδέα – ${ideaGeneratedCopy.el.title}`, ru: `FYNS – Идея – ${ideaGeneratedCopy.ru.title}`,
};

const ideaUi = {
  de: { can: "Was diese Journey kann", cannot: "Was sie nicht behauptet", start: "Ideenklärung starten", selected: "Ausgewählt", step: "Schritt", update: "Ergebnis aktualisieren", view: "Arbeitskarte ansehen", next: "Weiter", max: "Maximal", characters: "Zeichen", draft: "Deine vorläufige Formulierung", selection: "Deine Auswahl", progress: "Steuerung und Fortschritt der Ideenklärung", backResult: "Zurück zum Ergebnis", back: "Zurück", snapshot: "Dein heutiger Arbeitsstand", knownOpen: "Bekannt und bewusst offen", known: "Derzeit als bekannt markiert", open: "Bewusst offen", experiment: "Erster Lernversuch", nextStep: "Nächster Schritt", workingMap: "Deine Arbeitskarte", basis: "Worauf diese Karte beruht", assumptions: "Priorisierte Annahmen", constraints: "Grenzen für den Versuch", meaningfulNext: "Dein nächster sinnvoller Schritt", hint: "Vom Plan zum kleinen Hinweis", authority: "Deine interpretative Autorität", edit: "Antworten anpassen", editText: "Öffne einen Abschnitt erneut. Alle anderen Eingaben bleiben im aktuellen Seitenzustand erhalten.", restart: "Neu starten", discardTitle: "Alle aktuellen Eingaben verwerfen?", discardText: "Dieser Schritt kann nach dem Bestätigen nicht rückgängig gemacht werden.", keep: "Behalten", discard: "Eingaben verwerfen", incomplete: "Deine Arbeitskarte ist noch nicht vollständig.", first: "Zur ersten Frage" },
  en: { can: "What this journey can do", cannot: "What it does not claim", start: "Start clarifying the idea", selected: "Selected", step: "Step", update: "Update result", view: "View working map", next: "Continue", max: "Maximum", characters: "characters", draft: "Your provisional wording", selection: "Your selection", progress: "Controls and progress for idea clarification", backResult: "Back to result", back: "Back", snapshot: "Your current working view", knownOpen: "Known and deliberately open", known: "Currently marked as known", open: "Deliberately open", experiment: "First learning experiment", nextStep: "Next step", workingMap: "Your working map", basis: "What this map is based on", assumptions: "Prioritised assumptions", constraints: "Boundaries for the experiment", meaningfulNext: "Your next meaningful step", hint: "From a plan to a small indication", authority: "Your interpretive authority", edit: "Adjust answers", editText: "Reopen a section. All other input remains in the current page state.", restart: "Start again", discardTitle: "Discard all current input?", discardText: "This cannot be undone after you confirm.", keep: "Keep input", discard: "Discard input", incomplete: "Your working map is not complete yet.", first: "Back to the first question" },
  es: { can: "Lo que puede hacer este recorrido", cannot: "Lo que no pretende afirmar", start: "Empezar a aclarar la idea", selected: "Seleccionado", step: "Paso", update: "Actualizar resultado", view: "Ver mapa de trabajo", next: "Continuar", max: "Máximo", characters: "caracteres", draft: "Tu formulación provisional", selection: "Tu selección", progress: "Controles y progreso para aclarar la idea", backResult: "Volver al resultado", back: "Atrás", snapshot: "Tu visión de trabajo actual", knownOpen: "Conocido y deliberadamente abierto", known: "Marcado ahora como conocido", open: "Deliberadamente abierto", experiment: "Primer experimento de aprendizaje", nextStep: "Siguiente paso", workingMap: "Tu mapa de trabajo", basis: "En qué se basa este mapa", assumptions: "Supuestos prioritarios", constraints: "Límites del experimento", meaningfulNext: "Tu siguiente paso con sentido", hint: "Del plan a una pequeña señal", authority: "Tu criterio interpretativo", edit: "Ajustar respuestas", editText: "Vuelve a abrir una sección. El resto de tus datos permanece en el estado actual de la página.", restart: "Empezar de nuevo", discardTitle: "¿Descartar todos los datos actuales?", discardText: "No podrás deshacerlo después de confirmar.", keep: "Conservar datos", discard: "Descartar datos", incomplete: "Tu mapa de trabajo aún no está completo.", first: "Volver a la primera pregunta" },
  tr: { can: "Bu yolculuğun yapabilecekleri", cannot: "İddia etmedikleri", start: "Fikri netleştirmeye başla", selected: "Seçildi", step: "Adım", update: "Sonucu güncelle", view: "Çalışma haritasını gör", next: "Devam et", max: "En fazla", characters: "karakter", draft: "Geçici ifaden", selection: "Seçimin", progress: "Fikir netleştirme kontrolleri ve ilerlemesi", backResult: "Sonuca dön", back: "Geri", snapshot: "Şu anki çalışma görünümün", knownOpen: "Bilinen ve bilinçli olarak açık bırakılan", known: "Şimdilik biliniyor olarak işaretlenen", open: "Bilinçli olarak açık", experiment: "İlk öğrenme deneyi", nextStep: "Sonraki adım", workingMap: "Çalışma haritan", basis: "Bu haritanın dayanağı", assumptions: "Öncelikli varsayımlar", constraints: "Deneyin sınırları", meaningfulNext: "Senin için anlamlı sonraki adım", hint: "Plandan küçük bir işarete", authority: "Yorumlama yetkisi sende", edit: "Yanıtları düzenle", editText: "Bir bölümü yeniden aç. Diğer girdilerin sayfanın mevcut durumunda kalır.", restart: "Yeniden başla", discardTitle: "Mevcut girdilerin tümü silinsin mi?", discardText: "Onayladıktan sonra bu işlem geri alınamaz.", keep: "Girdileri koru", discard: "Girdileri sil", incomplete: "Çalışma haritan henüz tamamlanmadı.", first: "İlk soruya dön" },
  pl: { can: "W czym ta ścieżka może pomóc", cannot: "Czego nie próbuje rozstrzygać", start: "Zacznij porządkować pomysł", selected: "Wybrano", step: "Krok", update: "Aktualizuj wynik", view: "Zobacz mapę roboczą", next: "Dalej", max: "Maksimum", characters: "znaków", draft: "Twoje robocze sformułowanie", selection: "Twój wybór", progress: "Sterowanie i postęp porządkowania pomysłu", backResult: "Wróć do wyniku", back: "Wstecz", snapshot: "Twój obecny obraz roboczy", knownOpen: "Wiadome i świadomie otwarte", known: "Obecnie oznaczone jako wiadome", open: "Świadomie otwarte", experiment: "Pierwszy eksperyment uczący", nextStep: "Następny krok", workingMap: "Twoja mapa robocza", basis: "Na czym opiera się ta mapa", assumptions: "Założenia do sprawdzenia w pierwszej kolejności", constraints: "Granice eksperymentu", meaningfulNext: "Twój kolejny sensowny krok", hint: "Od planu do małej wskazówki", authority: "To Ty interpretujesz", edit: "Dostosuj odpowiedzi", editText: "Otwórz ponownie jedną sekcję. Pozostałe dane zostaną zachowane w bieżącym stanie strony.", restart: "Zacznij od nowa", discardTitle: "Usunąć wszystkie obecne dane?", discardText: "Po potwierdzeniu nie będzie można tego cofnąć.", keep: "Zachowaj dane", discard: "Usuń dane", incomplete: "Twoja mapa robocza nie jest jeszcze kompletna.", first: "Wróć do pierwszego pytania" },
  el: { can: "Τι μπορεί να κάνει αυτή η διαδρομή", cannot: "Τι δεν ισχυρίζεται", start: "Ξεκίνησε την αποσαφήνιση της ιδέας", selected: "Επιλέχθηκε", step: "Βήμα", update: "Ενημέρωση αποτελέσματος", view: "Προβολή χάρτη εργασίας", next: "Συνέχεια", max: "Μέγιστο", characters: "χαρακτήρες", draft: "Η προσωρινή σου διατύπωση", selection: "Η επιλογή σου", progress: "Χειριστήρια και πρόοδος αποσαφήνισης ιδέας", backResult: "Πίσω στο αποτέλεσμα", back: "Πίσω", snapshot: "Η τωρινή εικόνα εργασίας σου", knownOpen: "Γνωστό και σκόπιμα ανοιχτό", known: "Σημειωμένο τώρα ως γνωστό", open: "Σκόπιμα ανοιχτό", experiment: "Πρώτο πείραμα μάθησης", nextStep: "Επόμενο βήμα", workingMap: "Ο χάρτης εργασίας σου", basis: "Σε τι βασίζεται αυτός ο χάρτης", assumptions: "Υποθέσεις προτεραιότητας", constraints: "Όρια του πειράματος", meaningfulNext: "Το επόμενο ουσιαστικό βήμα σου", hint: "Από το σχέδιο σε μια μικρή ένδειξη", authority: "Η ερμηνεία ανήκει σε εσένα", edit: "Προσαρμογή απαντήσεων", editText: "Άνοιξε ξανά μια ενότητα. Όλες οι άλλες καταχωρίσεις παραμένουν στην τρέχουσα κατάσταση της σελίδας.", restart: "Ξεκίνα ξανά", discardTitle: "Να διαγραφούν όλες οι τρέχουσες καταχωρίσεις;", discardText: "Δεν αναιρείται μετά την επιβεβαίωση.", keep: "Διατήρηση", discard: "Διαγραφή", incomplete: "Ο χάρτης εργασίας σου δεν έχει ολοκληρωθεί ακόμη.", first: "Πίσω στην πρώτη ερώτηση" },
  ru: { can: "Чем может помочь этот маршрут", cannot: "Чего он не утверждает", start: "Начать прояснять идею", selected: "Выбрано", step: "Шаг", update: "Обновить результат", view: "Открыть рабочую карту", next: "Продолжить", max: "Максимум", characters: "символов", draft: "Твоя предварительная формулировка", selection: "Твой выбор", progress: "Управление и ход прояснения идеи", backResult: "Вернуться к результату", back: "Назад", snapshot: "Текущая рабочая картина", knownOpen: "Известное и намеренно открытое", known: "Сейчас отмечено как известное", open: "Намеренно оставлено открытым", experiment: "Первый учебный эксперимент", nextStep: "Следующий шаг", workingMap: "Твоя рабочая карта", basis: "На чём основана эта карта", assumptions: "Приоритетные предположения", constraints: "Границы эксперимента", meaningfulNext: "Твой следующий осмысленный шаг", hint: "От плана к небольшой подсказке", authority: "Право интерпретации остаётся за тобой", edit: "Изменить ответы", editText: "Открой раздел снова. Остальные данные сохранятся в текущем состоянии страницы.", restart: "Начать заново", discardTitle: "Удалить все текущие данные?", discardText: "После подтверждения это действие нельзя отменить.", keep: "Сохранить данные", discard: "Удалить данные", incomplete: "Твоя рабочая карта ещё не завершена.", first: "Вернуться к первому вопросу" },
} as const satisfies Record<Locale, Record<string, string>>;

function selectionInstruction(question: IdeaChoiceQuestion, locale: Locale): string {
  const one = { de: "Wähle eine Antwort.", en: "Choose one answer.", es: "Elige una respuesta.", tr: "Bir yanıt seç.", pl: "Wybierz jedną odpowiedź.", el: "Επίλεξε μία απάντηση.", ru: "Выбери один ответ." } as const;
  const exact = { de: (n: number) => `Wähle genau ${n} Antworten.`, en: (n: number) => `Choose exactly ${n} answers.`, es: (n: number) => `Elige exactamente ${n} respuestas.`, tr: (n: number) => `Tam olarak ${n} yanıt seç.`, pl: (n: number) => `Wybierz dokładnie ${n} odpowiedzi.`, el: (n: number) => `Επίλεξε ακριβώς ${n} απαντήσεις.`, ru: (n: number) => `Выбери ровно ${n} ответа.` } as const;
  const range = { de: (a: number,b: number) => `Wähle ${a} bis ${b} Antworten.`, en: (a: number,b: number) => `Choose between ${a} and ${b} answers.`, es: (a: number,b: number) => `Elige entre ${a} y ${b} respuestas.`, tr: (a: number,b: number) => `${a} ile ${b} arasında yanıt seç.`, pl: (a: number,b: number) => `Wybierz od ${a} do ${b} odpowiedzi.`, el: (a: number,b: number) => `Επίλεξε από ${a} έως ${b} απαντήσεις.`, ru: (a: number,b: number) => `Выбери от ${a} до ${b} ответов.` } as const;
  if (question.minSelections === question.maxSelections) {
    return question.minSelections === 1 ? one[locale] : exact[locale](question.minSelections);
  }
  return range[locale](question.minSelections, question.maxSelections);
}

function Intro({ onStart }: { onStart: () => void }) {
  const locale = useLocale();
  const ideaIntro = getIdeaIntro(locale);
  const ui = ideaUi[locale];
  return (
    <section aria-labelledby="idea-intro-title" className="py-16 sm:py-24">
      <div className="grid gap-10 lg:grid-cols-[0.7fr_1fr] lg:items-start">
        <div>
          <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[#77e5b5]">{ideaIntro.eyebrow}</p>
          <h2 id="idea-intro-title" className="mt-6 text-3xl font-black leading-tight text-white sm:text-5xl">{ideaIntro.title}</h2>
          <p className="mt-6 text-lg leading-8 text-slate-300">{ideaIntro.description}</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <section aria-labelledby="idea-can-title" className="rounded-[1.5rem] border border-[#77e5b5]/25 bg-[#77e5b5]/[0.04] p-6">
            <h3 id="idea-can-title" className="font-black text-white">{ui.can}</h3>
            <ul className="mt-5 grid gap-3 text-sm leading-6 text-slate-300">
              {ideaIntro.canDo.map((item) => <li key={item} className="border-l border-[#77e5b5]/45 pl-4">{item}</li>)}
            </ul>
          </section>
          <section aria-labelledby="idea-cannot-title" className="rounded-[1.5rem] border border-white/10 bg-white/[0.025] p-6">
            <h3 id="idea-cannot-title" className="font-black text-white">{ui.cannot}</h3>
            <ul className="mt-5 grid gap-3 text-sm leading-6 text-slate-400">
              {ideaIntro.cannotDo.map((item) => <li key={item} className="border-l border-white/15 pl-4">{item}</li>)}
            </ul>
          </section>
        </div>
      </div>
      <div className="mt-10 max-w-4xl border-l-2 border-[#77e5b5] pl-6">
        <p className="font-bold leading-7 text-white">{ideaIntro.authority}</p>
        <p className="mt-3 leading-7 text-slate-400">{ideaIntro.privacy}</p>
        <p className="mt-2 font-mono text-xs uppercase tracking-[0.16em] text-slate-500">{ideaIntro.duration}</p>
      </div>
      <button
        type="button"
        onClick={onStart}
        className="mt-10 inline-flex min-h-14 items-center rounded-full bg-[#77e5b5] px-7 py-4 font-black text-[#041018] transition motion-safe:hover:-translate-y-0.5 hover:brightness-110 motion-reduce:transform-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#77e5b5]"
      >
        {ui.start} <span aria-hidden="true" className="ml-3">→</span>
      </button>
    </section>
  );
}

function ChoiceInput({
  question,
  selectedIds,
  onToggle,
}: {
  question: IdeaChoiceQuestion;
  selectedIds: readonly string[];
  onToggle: (optionId: string) => void;
}) {
  const locale = useLocale();
  const inputType = question.format === "single" ? "radio" : "checkbox";
  return (
    <div className="mt-7 grid gap-3">
      {question.options.map((option) => {
        const selected = selectedIds.includes(option.id);
        return (
          <label key={option.id} className="group block cursor-pointer">
            <input
              className="peer sr-only"
              type={inputType}
              name={question.id}
              checked={selected}
              onChange={() => onToggle(option.id)}
            />
            <span className={`flex min-h-20 items-start justify-between gap-4 rounded-2xl border px-5 py-5 text-left transition peer-focus-visible:outline-2 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-[#77e5b5] ${selected ? "border-[#77e5b5]/75 bg-[#77e5b5]/[0.095] text-white" : "border-white/10 bg-white/[0.025] text-slate-300 group-hover:border-white/25 group-hover:text-white"}`}>
              <span className="font-bold leading-7">{option.label}</span>
              <span aria-hidden="true" className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center border text-xs font-black ${inputType === "radio" ? "rounded-full" : "rounded-md"} ${selected ? "border-[#77e5b5] bg-[#77e5b5] text-[#041018]" : "border-white/25 text-transparent"}`}>✓</span>
              {selected ? <span className="sr-only">{ideaUi[locale].selected}</span> : null}
            </span>
          </label>
        );
      })}
    </div>
  );
}

function QuestionView({
  question,
  answer,
  selectedIds,
  validationMessage,
  headingRef,
  errorRef,
  onText,
  onToggle,
  onSubmit,
  onBack,
  questionIndex,
  editing,
}: {
  question: IdeaQuestion;
  answer: string;
  selectedIds: readonly string[];
  validationMessage: string | null;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  errorRef: React.RefObject<HTMLParagraphElement | null>;
  onText: (value: string) => void;
  onToggle: (optionId: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  questionIndex: number;
  editing: boolean;
}) {
  const locale = useLocale();
  const ui = ideaUi[locale];
  const ideaSections = getIdeaSections(locale);
  const ideaQuestions = getIdeaQuestions(locale);
  const { currentSectionIndex, sectionQuestions, localQuestionNumber } = ideaSectionProgress(questionIndex, locale);
  const currentSection = ideaSections[currentSectionIndex];
  const guidanceId = `${question.id}-guidance`;
  const errorId = `${question.id}-error`;
  const selectedCount = selectedIds.length;
  const nextLabel = editing && localQuestionNumber === sectionQuestions.length
    ? ui.update
    : questionIndex === ideaQuestions.length - 1
      ? ui.view
      : ui.next;

  return (
    <form
      className="mx-auto max-w-4xl py-12 pb-[calc(12rem+env(safe-area-inset-bottom))] sm:py-16 lg:pb-[calc(8.5rem+env(safe-area-inset-bottom))]"
      aria-labelledby={`${question.id}-title`}
      onSubmit={(event) => { event.preventDefault(); onSubmit(); }}
    >
      <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[#77e5b5]">{currentSection.title} · {ui.step} {localQuestionNumber}</p>
      <h2 ref={headingRef} tabIndex={-1} style={{ outline: "none" }} id={`${question.id}-title`} className="mt-5 scroll-mb-[calc(12rem+env(safe-area-inset-bottom))] text-3xl font-black leading-tight text-white outline-none sm:text-5xl lg:scroll-mb-[calc(8.5rem+env(safe-area-inset-bottom))]">
        {question.prompt}
      </h2>
      <p id={guidanceId} className="mt-5 max-w-3xl leading-7 text-slate-400">
        {question.context} {question.format === "short-text" ? `${ui.max} ${question.maxLength} ${ui.characters}.` : selectionInstruction(question, locale)}
      </p>

      <fieldset aria-describedby={`${guidanceId}${validationMessage ? ` ${errorId}` : ""}`} className="mt-10">
        <legend className="flex w-full items-center gap-4 text-sm font-bold text-slate-300">
          <span>{question.format === "short-text" ? ui.draft : ui.selection}</span>
          <span className="ml-auto inline-flex min-h-8 shrink-0 items-center rounded-full border border-[#77e5b5]/40 bg-[#77e5b5]/[0.065] px-3 py-1 font-mono text-xs font-bold text-[#a8f2d2]">
            {question.format === "short-text"
              ? `${answer.length} / ${question.maxLength}`
              : formatIdeaSelectionCount(selectedCount, question.maxSelections, locale)}
          </span>
        </legend>
        {question.format === "short-text" ? (
          <textarea
            value={answer}
            maxLength={question.maxLength}
            rows={5}
            placeholder={question.placeholder}
            onChange={(event) => onText(event.currentTarget.value)}
            className="mt-7 w-full resize-y rounded-2xl border border-white/15 bg-[#04111b] p-5 text-lg leading-8 text-white placeholder:text-slate-600 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#77e5b5]"
          />
        ) : (
          <ChoiceInput question={question} selectedIds={selectedIds} onToggle={onToggle} />
        )}
      </fieldset>

      {validationMessage ? (
        <p ref={errorRef} tabIndex={-1} style={{ outline: "none" }} id={errorId} role="alert" className="mt-5 scroll-mb-[calc(12rem+env(safe-area-inset-bottom))] border-l-2 border-[#ff9a3d] pl-4 font-bold text-[#ffb36d] outline-none lg:scroll-mb-[calc(8.5rem+env(safe-area-inset-bottom))]">
          {validationMessage}
        </p>
      ) : null}

      <JourneyDock
        locale={locale}
        sections={ideaSections}
        currentSectionIndex={currentSectionIndex}
        globalQuestionNumber={questionIndex + 1}
        totalQuestionCount={ideaQuestions.length}
        localQuestionNumber={localQuestionNumber}
        localQuestionCount={sectionQuestions.length}
        accent={IDEA_ACCENT}
        accessibleLabel={ui.progress}
        backLabel={editing && localQuestionNumber === 1 ? ui.backResult : ui.back}
        nextLabel={nextLabel}
        onBack={onBack}
      />
    </form>
  );
}

function ResultPrintDocument({ result }: { result: IdeaResult }) {
  const locale = useLocale();
  const ui = ideaUi[locale];
  const snapshotLabels = ideaSnapshotLabels[locale];
  const printStyle = {
    "--fyns-print-accent": IDEA_ACCENT,
    "--fyns-print-accent-text": "#207853",
  } as CSSProperties;
  return (
    <article className="fyns-print-document hidden" data-fyns-print-document="idea" style={printStyle}>
      <header className="fyns-print-header">
        <p className="fyns-print-brand">bts.online / FYNS / Idea</p>
        <h1>{result.title}</h1>
        <p className="fyns-print-description">{result.description}</p>
      </header>
      <section className="fyns-print-section" aria-labelledby="idea-print-snapshot-title">
        <h2 id="idea-print-snapshot-title">{ui.snapshot}</h2>
        <div className="fyns-print-stack">
          {(["idea", "problem", "audience", "value"] as const).map((key) => (
            <article key={key} className="fyns-print-block">
              <p className="fyns-print-label">{snapshotLabels[key]}</p>
              <p>{result.snapshot[key]}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="fyns-print-section" aria-labelledby="idea-print-open-title">
        <h2 id="idea-print-open-title">{ui.knownOpen}</h2>
        <p>{result.evidenceStatus}</p>
        <h3>{ui.known}</h3>
        <ul className="fyns-print-list">{result.known.map((item) => <li key={item}>{item}</li>)}</ul>
        <h3>{ui.open}</h3>
        <ul className="fyns-print-list">{result.uncertain.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>
      <section className="fyns-print-section" aria-labelledby="idea-print-experiment-title">
        <h2 id="idea-print-experiment-title">{ui.experiment}</h2>
        <p>{result.experiment.method}</p>
        <p>{result.experiment.observe}</p>
        <p className="fyns-print-note">{result.experiment.boundary}</p>
      </section>
      <section className="fyns-print-section fyns-print-next-step" aria-labelledby="idea-print-next-title">
        <h2 id="idea-print-next-title">{ui.nextStep}</h2>
        <p>{result.nextStep}</p>
      </section>
      <p className="fyns-print-disclaimer">{getIdeaResultDisclaimer(locale)}</p>
    </article>
  );
}

function ResultList({ title, items, muted = false }: { title: string; items: readonly string[]; muted?: boolean }) {
  return (
    <section className={`rounded-[1.5rem] border p-6 sm:p-8 ${muted ? "border-white/10 bg-white/[0.025]" : "border-[#77e5b5]/25 bg-[#77e5b5]/[0.035]"}`}>
      <h3 className="text-2xl font-black text-white">{title}</h3>
      <ul className="mt-6 grid gap-4">
        {items.map((item) => <li key={item} className={`border-l pl-4 leading-7 ${muted ? "border-white/20 text-slate-400" : "border-[#77e5b5]/50 text-slate-200"}`}>{item}</li>)}
      </ul>
    </section>
  );
}

function ResultView({
  result,
  restartPending,
  resultHeadingRef,
  onEdit,
  onRestartRequest,
  onRestartCancel,
  onRestartConfirm,
}: {
  result: IdeaResult;
  restartPending: boolean;
  resultHeadingRef: React.RefObject<HTMLHeadingElement | null>;
  onEdit: (sectionId: IdeaSectionId) => void;
  onRestartRequest: () => void;
  onRestartCancel: () => void;
  onRestartConfirm: () => void;
}) {
  const locale = useLocale();
  const ui = ideaUi[locale];
  const ideaSections = getIdeaSections(locale);
  const snapshotLabels = ideaSnapshotLabels[locale];
  const copyText = useMemo(() => buildIdeaResultText(result, locale), [locale, result]);
  const shareText = useMemo(() => buildIdeaShareText(result, locale), [locale, result]);
  return (
    <section aria-labelledby="idea-result-title" className="py-16 sm:py-24" data-fyns-screen-result>
      <ResultPrintDocument result={result} />
      <div className="max-w-4xl">
        <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[#77e5b5]">{ui.workingMap}</p>
        <h2 ref={resultHeadingRef} tabIndex={-1} style={{ outline: "none" }} id="idea-result-title" className="mt-5 text-4xl font-black leading-tight text-white outline-none sm:text-6xl">
          {result.title}
        </h2>
        <p className="mt-6 text-lg leading-8 text-slate-300">{result.description}</p>
      </div>

      <section aria-labelledby="idea-snapshot-title" className="mt-14">
        <h3 id="idea-snapshot-title" className="text-3xl font-black text-white sm:text-5xl">{ui.snapshot}</h3>
        <dl className="mt-8 grid gap-4 md:grid-cols-2">
          {(["idea", "problem", "audience", "value"] as const).map((key) => (
            <div key={key} className="rounded-[1.25rem] border border-white/10 bg-white/[0.025] p-6">
              <dt className="font-mono text-xs font-black uppercase tracking-[0.18em] text-[#a8f2d2]">{snapshotLabels[key]}</dt>
              <dd className="mt-4 font-bold leading-7 text-white">{result.snapshot[key]}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="mt-12 rounded-[1.5rem] border border-[#77e5b5]/25 bg-[#77e5b5]/[0.035] p-6 sm:p-8">
        <p className="font-mono text-xs font-black uppercase tracking-[0.18em] text-[#a8f2d2]">{ui.basis}</p>
        <p className="mt-4 font-bold leading-7 text-white">{result.evidenceStatus}</p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ResultList title={ui.known} items={result.known} />
        <ResultList title={ui.open} items={result.uncertain} muted />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ResultList title={ui.assumptions} items={result.assumptions} muted />
        <ResultList title={ui.constraints} items={result.constraints} muted />
      </div>

      <section aria-labelledby="idea-experiment-title" className="mt-12 rounded-[1.75rem] border border-[#77e5b5]/35 bg-[linear-gradient(135deg,rgba(119,229,181,0.1),rgba(255,255,255,0.02))] p-7 sm:p-10">
        <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[#a8f2d2]">{ui.experiment}</p>
        <h3 id="idea-experiment-title" className="mt-5 text-3xl font-black text-white sm:text-5xl">{result.experiment.title}</h3>
        <p className="mt-6 text-lg font-bold leading-8 text-slate-200">{result.experiment.method}</p>
        <p className="mt-4 leading-7 text-slate-300">{result.experiment.observe}</p>
        <p className="mt-6 border-l-2 border-[#ff9a3d] pl-5 text-sm leading-6 text-[#ffcfaa]">{result.experiment.boundary}</p>
      </section>

      <section aria-labelledby="idea-next-title" className="mt-6 rounded-[1.75rem] border border-[#77e5b5]/35 p-7 sm:p-10">
        <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[#a8f2d2]">{ui.meaningfulNext}</p>
        <h3 id="idea-next-title" className="mt-5 text-3xl font-black text-white sm:text-5xl">{ui.hint}</h3>
        <p className="mt-6 text-lg font-bold leading-8 text-slate-200">{result.nextStep}</p>
      </section>

      <aside aria-label={ui.authority} className="mt-8 border-l-2 border-[#b8a5ff] pl-6 leading-7 text-slate-300">
        {result.authorityNote}
      </aside>

      <FynsResultActions
        accent={IDEA_ACCENT}
        copyText={copyText}
        shareTitle={ideaResultTitle[locale]}
        shareText={shareText}
        printTitle={ideaResultTitle[locale]}
      />

      <section aria-labelledby="idea-edit-title" className="mt-20 border-t border-white/15 pt-14">
        <div className="grid gap-8 lg:grid-cols-[0.65fr_1fr]">
          <div>
            <h3 id="idea-edit-title" className="text-2xl font-black text-white">{ui.edit}</h3>
            <p className="mt-4 max-w-md leading-7 text-slate-400">{ui.editText}</p>
          </div>
          <ol className="grid gap-3 sm:grid-cols-2">
            {ideaSections.map((section, index) => (
              <li key={section.id}>
                <button type="button" onClick={() => onEdit(section.id)} className="flex min-h-14 w-full items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.025] px-5 py-4 text-left font-bold text-slate-200 transition hover:border-[#77e5b5]/45 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#77e5b5]">
                  <span className="font-mono text-xs text-[#a8f2d2]">{String(index + 1).padStart(2, "0")}</span>
                  {section.title}
                </button>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <div className="mt-12 border-t border-white/10 pt-10">
        {!restartPending ? (
          <button type="button" onClick={onRestartRequest} className="inline-flex min-h-12 items-center rounded-full border border-white/15 px-6 py-3 font-bold text-slate-300 transition hover:border-[#77e5b5]/60 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#77e5b5]">{ui.restart}</button>
        ) : (
          <div className="max-w-2xl rounded-2xl border border-[#ff9a3d]/30 bg-[#ff9a3d]/[0.04] p-6">
            <p className="font-bold text-white">{ui.discardTitle}</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">{ui.discardText}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button type="button" onClick={onRestartCancel} className="min-h-11 rounded-full border border-white/15 px-5 py-2 font-bold text-slate-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#77e5b5]">{ui.keep}</button>
              <button type="button" onClick={onRestartConfirm} className="min-h-11 rounded-full bg-[#ff9a3d] px-5 py-2 font-black text-[#241204] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff9a3d]">{ui.discard}</button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export function IdeaJourney() {
  const locale = useLocale();
  const ui = ideaUi[locale];
  const ideaQuestions = getIdeaQuestions(locale);
  const [state, dispatch] = useReducer((current: typeof initialIdeaState, action: Parameters<typeof ideaJourneyReducer>[1]) => ideaJourneyReducer(current, action, locale), initialIdeaState);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const resultHeadingRef = useRef<HTMLHeadingElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (state.phase === "journey") headingRef.current?.focus();
    if (state.phase === "result") resultHeadingRef.current?.focus();
  }, [state.phase, state.questionIndex]);

  useEffect(() => {
    if (state.validationMessage) {
      errorRef.current?.focus();
      errorRef.current?.scrollIntoView({ block: "center" });
    }
  }, [state.validationMessage]);

  if (state.phase === "intro") return <Intro onStart={() => dispatch({ type: "start" })} />;

  if (state.phase === "result") {
    const built = buildIdeaResult(state.answers, locale);
    if (built.status === "complete") {
      return (
        <ResultView
          result={built.result}
          restartPending={state.restartPending}
          resultHeadingRef={resultHeadingRef}
          onEdit={(sectionId) => dispatch({ type: "edit-section", sectionId })}
          onRestartRequest={() => dispatch({ type: "request-restart" })}
          onRestartCancel={() => dispatch({ type: "cancel-restart" })}
          onRestartConfirm={() => dispatch({ type: "confirm-restart" })}
        />
      );
    }
    return (
      <section className="py-20" aria-labelledby="idea-incomplete-title">
        <h2 id="idea-incomplete-title" className="text-3xl font-black text-white">{ui.incomplete}</h2>
        <button type="button" onClick={() => dispatch({ type: "start" })} className="mt-8 min-h-12 rounded-full bg-[#77e5b5] px-6 font-black text-[#041018]">{ui.first}</button>
      </section>
    );
  }

  const question = ideaQuestions[state.questionIndex];
  const rawAnswer = state.answers[question.id];
  const answer = typeof rawAnswer === "string" ? rawAnswer : "";
  const selectedIds = question.format === "short-text"
    ? []
    : selectedIdeaOptions(question, state.answers).map(({ id }) => id);

  return (
    <QuestionView
      question={question}
      answer={answer}
      selectedIds={selectedIds}
      validationMessage={state.validationMessage}
      headingRef={headingRef}
      errorRef={errorRef}
      onText={(value) => dispatch({ type: "set-text", questionId: question.id, value })}
      onToggle={(optionId) => dispatch({ type: "toggle-option", questionId: question.id, optionId })}
      onSubmit={() => dispatch({ type: "continue" })}
      onBack={() => dispatch({ type: "back" })}
      questionIndex={state.questionIndex}
      editing={state.editingSectionId !== null}
    />
  );
}
