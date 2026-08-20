"use client";

import { useEffect, useMemo, useReducer, useRef } from "react";

import { JourneyDock } from "@/components/find-your-next-step/journey-dock";
import { FynsResultActions } from "@/components/find-your-next-step/result-actions";
import { useLocale } from "@/components/i18n/locale-context";
import { getProblemIntro, getProblemQuestions, getProblemSections } from "@/data/find-your-next-step-problem";
import {
  buildProblemResultText,
  buildProblemShareText,
  getProblemResultDisclaimer,
} from "@/lib/find-your-next-step-problem-export";
import type { Locale } from "@/lib/i18n/config";
import {
  buildProblemResult,
  formatProblemSelectionCount,
  initialProblemState,
  problemJourneyReducer,
} from "@/lib/find-your-next-step-problem";
import type {
  ProblemEvidence,
  ProblemQuestion,
  ProblemResult,
  ProblemResultStatement,
} from "@/types/find-your-next-step-problem";

const problemResultTitle: Record<Locale, string> = {
  de: "FYNS – Problem – Situationsskizze", en: "FYNS – Problem – Situation sketch", es: "FYNS – Problema – Esbozo de la situación", tr: "FYNS – Sorun – Durum taslağı", pl: "FYNS – Problem – Szkic sytuacji", el: "FYNS – Πρόβλημα – Περίγραμμα κατάστασης", ru: "FYNS – Проблема – Набросок ситуации",
};

const problemUi = {
  de: { evidence: "Worauf basiert das?", summary: "Zusammenfassung", improvement: "Woran du eine kleine Verbesserung erkennen würdest", situation: "Was die Situation gerade prägt", resources: "Ressourcen und Grenzen", questions: "Fragen zum Mitnehmen", smallNext: "Dein nächster kleiner Schritt", snapshot: "Deine lokale Momentaufnahme", boundary: "Wichtige Grenze", context: "Prüfe die Quelle deiner Annahmen selbst.", contextText: "Welche Grenze besteht heute tatsächlich – und welche könnte aus Gewohnheit, Erwartungen anderer oder einer älteren Erfahrung stammen? Was du wirklich willst, was du glaubst tun zu sollen und worüber du noch unsicher bist, darf auseinanderfallen. FYNS leitet diese Herkunft nicht aus deinen Antworten ab; deine Einordnung bleibt maßgeblich.", edit: "Antworten anpassen", editText: "Öffne einen Abschnitt erneut. Deine übrigen Angaben bleiben erhalten und die Skizze wird danach neu erzeugt.", restart: "Neu starten", discardTitle: "Alle aktuellen Angaben verwerfen?", discardText: "Dieser Schritt kann nach dem Bestätigen nicht rückgängig gemacht werden.", keep: "Behalten", discard: "Angaben verwerfen", can: "Wobei sie helfen kann", cannot: "Was sie nicht leisten kann", danger: "Bei unmittelbarer Gefahr", local: "Nur für diesen Moment", start: "Situationsklärung starten", incomplete: "Deine Situationsskizze ist noch nicht vollständig.", backQuestions: "Zurück zu den Fragen", clarification: "Klärung", selected: "Ausgewählt", progress: "Steuerung und Fortschritt der Situationsklärung", update: "Skizze aktualisieren", view: "Skizze ansehen", next: "Weiter", backSketch: "Zurück zur Skizze", backIntro: "Zurück zur Einführung", back: "Zurück" },
  en: { evidence: "What is this based on?", summary: "Summary", improvement: "What would show you a small improvement", situation: "What is shaping the situation right now", resources: "Resources and boundaries", questions: "Questions to carry with you", smallNext: "Your next small step", snapshot: "Your local snapshot", boundary: "Important boundary", context: "Examine the source of your assumptions yourself.", contextText: "Which boundary genuinely exists today, and which might come from habit, other people’s expectations or an older experience? What you want, what you believe you should want and what remains uncertain do not have to align. FYNS does not infer where these ideas come from; your interpretation remains decisive.", edit: "Adjust answers", editText: "Reopen a section. Your other answers remain in place and the sketch is then rebuilt.", restart: "Start again", discardTitle: "Discard all current answers?", discardText: "This cannot be undone after you confirm.", keep: "Keep answers", discard: "Discard answers", can: "What it can help with", cannot: "What it cannot do", danger: "If there is immediate danger", local: "Only for this moment", start: "Start reviewing the situation", incomplete: "Your situation sketch is not complete yet.", backQuestions: "Back to the questions", clarification: "Review", selected: "Selected", progress: "Controls and progress for the situation review", update: "Update sketch", view: "View sketch", next: "Continue", backSketch: "Back to sketch", backIntro: "Back to introduction", back: "Back" },
  es: { evidence: "¿En qué se basa?", summary: "Resumen", improvement: "Cómo reconocerías una pequeña mejora", situation: "Qué está marcando la situación ahora", resources: "Recursos y límites", questions: "Preguntas para llevarte", smallNext: "Tu siguiente paso pequeño", snapshot: "Tu instantánea local", boundary: "Límite importante", context: "Examina por tu cuenta el origen de tus supuestos.", contextText: "¿Qué límite existe realmente hoy y cuál podría venir de la costumbre, de las expectativas ajenas o de una experiencia anterior? Lo que quieres, lo que crees que deberías querer y aquello sobre lo que aún dudas no tienen por qué coincidir. FYNS no deduce ese origen de tus respuestas; tu criterio sigue siendo decisivo.", edit: "Ajustar respuestas", editText: "Vuelve a abrir una sección. Las demás respuestas se conservan y después se genera de nuevo el esquema.", restart: "Empezar de nuevo", discardTitle: "¿Descartar todas las respuestas actuales?", discardText: "No podrás deshacerlo después de confirmar.", keep: "Conservar respuestas", discard: "Descartar respuestas", can: "En qué puede ayudarte", cannot: "Lo que no puede hacer", danger: "Si hay peligro inmediato", local: "Solo para este momento", start: "Empezar a revisar la situación", incomplete: "Tu esquema de la situación aún no está completo.", backQuestions: "Volver a las preguntas", clarification: "Revisión", selected: "Seleccionado", progress: "Controles y progreso de la revisión de la situación", update: "Actualizar esquema", view: "Ver esquema", next: "Continuar", backSketch: "Volver al esquema", backIntro: "Volver a la introducción", back: "Atrás" },
  tr: { evidence: "Bu neye dayanıyor?", summary: "Özet", improvement: "Küçük bir iyileşmeyi nasıl fark ederdin?", situation: "Şu anda durumu şekillendirenler", resources: "Kaynaklar ve sınırlar", questions: "Yanında götürebileceğin sorular", smallNext: "Sonraki küçük adımın", snapshot: "Yerel anlık görünümün", boundary: "Önemli sınır", context: "Varsayımlarının kaynağını kendin incele.", contextText: "Hangi sınır bugün gerçekten var, hangisi alışkanlıktan, başkalarının beklentilerinden ya da eski bir deneyimden geliyor olabilir? Gerçekte istediğin, istemen gerektiğini düşündüğün ve hâlâ emin olmadığın şeyler birbiriyle aynı olmak zorunda değil. FYNS bu kaynağı yanıtlarından çıkarmaz; yorumun belirleyicidir.", edit: "Yanıtları düzenle", editText: "Bir bölümü yeniden aç. Diğer yanıtların korunur ve taslak yeniden oluşturulur.", restart: "Yeniden başla", discardTitle: "Mevcut yanıtların tümü silinsin mi?", discardText: "Onayladıktan sonra bu işlem geri alınamaz.", keep: "Yanıtları koru", discard: "Yanıtları sil", can: "Neye yardımcı olabilir?", cannot: "Neyi yapamaz?", danger: "Acil tehlike varsa", local: "Yalnızca bu an için", start: "Durumu gözden geçirmeye başla", incomplete: "Durum taslağın henüz tamamlanmadı.", backQuestions: "Sorulara dön", clarification: "İnceleme", selected: "Seçildi", progress: "Durum inceleme kontrolleri ve ilerlemesi", update: "Taslağı güncelle", view: "Taslağı gör", next: "Devam et", backSketch: "Taslağa dön", backIntro: "Girişe dön", back: "Geri" },
  pl: { evidence: "Na czym to się opiera?", summary: "Podsumowanie", improvement: "Po czym poznasz małą poprawę", situation: "Co obecnie kształtuje sytuację", resources: "Zasoby i granice", questions: "Pytania, które warto zabrać ze sobą", smallNext: "Twój kolejny mały krok", snapshot: "Twoja lokalna migawka", boundary: "Ważna granica", context: "Samodzielnie przyjrzyj się źródłu swoich założeń.", contextText: "Która granica naprawdę istnieje dzisiaj, a która może wynikać z przyzwyczajenia, oczekiwań innych osób lub starszego doświadczenia? To, czego chcesz, to, czego Twoim zdaniem powinno się chcieć, oraz to, czego jeszcze nie wiesz, nie musi być tym samym. FYNS nie wywnioskuje źródła z odpowiedzi — Twoja interpretacja pozostaje najważniejsza.", edit: "Dostosuj odpowiedzi", editText: "Otwórz ponownie jedną sekcję. Pozostałe odpowiedzi zostaną zachowane, a szkic powstanie ponownie.", restart: "Zacznij od nowa", discardTitle: "Usunąć wszystkie obecne odpowiedzi?", discardText: "Po potwierdzeniu nie będzie można tego cofnąć.", keep: "Zachowaj odpowiedzi", discard: "Usuń odpowiedzi", can: "W czym może pomóc", cannot: "Czego nie może zrobić", danger: "W razie bezpośredniego zagrożenia", local: "Tylko na ten moment", start: "Zacznij porządkować sytuację", incomplete: "Twój szkic sytuacji nie jest jeszcze kompletny.", backQuestions: "Wróć do pytań", clarification: "Porządkowanie", selected: "Wybrano", progress: "Sterowanie i postęp porządkowania sytuacji", update: "Aktualizuj szkic", view: "Zobacz szkic", next: "Dalej", backSketch: "Wróć do szkicu", backIntro: "Wróć do wprowadzenia", back: "Wstecz" },
  el: { evidence: "Σε τι βασίζεται;", summary: "Σύνοψη", improvement: "Πώς θα αναγνώριζες μια μικρή βελτίωση", situation: "Τι διαμορφώνει την κατάσταση τώρα", resources: "Πόροι και όρια", questions: "Ερωτήσεις που αξίζει να κρατήσεις", smallNext: "Το επόμενο μικρό βήμα σου", snapshot: "Η τοπική στιγμιαία εικόνα σου", boundary: "Σημαντικό όριο", context: "Εξέτασε εσύ την προέλευση των παραδοχών σου.", contextText: "Ποιο όριο υπάρχει πραγματικά σήμερα και ποιο μπορεί να προέρχεται από συνήθεια, από τις προσδοκίες άλλων ή από μια παλαιότερη εμπειρία; Αυτό που θέλεις, αυτό που νομίζεις ότι θα έπρεπε να θέλεις και όσα ακόμη δεν ξέρεις δεν χρειάζεται να συμπίπτουν. Το FYNS δεν συμπεραίνει αυτή την προέλευση από τις απαντήσεις σου· η δική σου ερμηνεία παραμένει καθοριστική.", edit: "Προσαρμογή απαντήσεων", editText: "Άνοιξε ξανά μια ενότητα. Οι άλλες απαντήσεις διατηρούνται και το σχεδιάγραμμα δημιουργείται ξανά.", restart: "Ξεκίνα ξανά", discardTitle: "Να διαγραφούν όλες οι τρέχουσες απαντήσεις;", discardText: "Δεν αναιρείται μετά την επιβεβαίωση.", keep: "Διατήρηση απαντήσεων", discard: "Διαγραφή απαντήσεων", can: "Σε τι μπορεί να βοηθήσει", cannot: "Τι δεν μπορεί να κάνει", danger: "Σε περίπτωση άμεσου κινδύνου", local: "Μόνο για αυτή τη στιγμή", start: "Έναρξη εξέτασης της κατάστασης", incomplete: "Το σχεδιάγραμμα της κατάστασής σου δεν έχει ολοκληρωθεί ακόμη.", backQuestions: "Πίσω στις ερωτήσεις", clarification: "Εξέταση", selected: "Επιλέχθηκε", progress: "Χειριστήρια και πρόοδος εξέτασης της κατάστασης", update: "Ενημέρωση σχεδιαγράμματος", view: "Προβολή σχεδιαγράμματος", next: "Συνέχεια", backSketch: "Πίσω στο σχεδιάγραμμα", backIntro: "Πίσω στην εισαγωγή", back: "Πίσω" },
  ru: { evidence: "На чём это основано?", summary: "Краткий итог", improvement: "Как ты заметишь небольшое улучшение", situation: "Что сейчас формирует ситуацию", resources: "Ресурсы и границы", questions: "Вопросы, которые стоит взять с собой", smallNext: "Твой следующий небольшой шаг", snapshot: "Текущая локальная картина", boundary: "Важная граница", context: "Самостоятельно проверь источник своих предположений.", contextText: "Какая граница действительно существует сегодня, а какая может быть связана с привычкой, ожиданиями других людей или прошлым опытом? То, чего ты хочешь, то, чего, по твоему мнению, следует хотеть, и то, в чём ты пока не уверен, не обязано совпадать. FYNS не делает вывод об источнике по твоим ответам — решающей остаётся твоя интерпретация.", edit: "Изменить ответы", editText: "Открой раздел снова. Остальные ответы сохранятся, а схема будет создана заново.", restart: "Начать заново", discardTitle: "Удалить все текущие ответы?", discardText: "После подтверждения это действие нельзя отменить.", keep: "Сохранить ответы", discard: "Удалить ответы", can: "Чем это может помочь", cannot: "Чего это не может", danger: "При непосредственной опасности", local: "Только для этого момента", start: "Начать разбирать ситуацию", incomplete: "Схема твоей ситуации ещё не завершена.", backQuestions: "Вернуться к вопросам", clarification: "Разбор", selected: "Выбрано", progress: "Управление и ход разбора ситуации", update: "Обновить схему", view: "Открыть схему", next: "Продолжить", backSketch: "Вернуться к схеме", backIntro: "Вернуться к введению", back: "Назад" },
} as const satisfies Record<Locale, Record<string, string>>;

function selectionInstruction(question: ProblemQuestion, locale: Locale): string {
  const textRange = { de: (n: number) => `10 bis ${n} Zeichen`, en: (n: number) => `10 to ${n} characters`, es: (n: number) => `De 10 a ${n} caracteres`, tr: (n: number) => `10–${n} karakter`, pl: (n: number) => `Od 10 do ${n} znaków`, el: (n: number) => `10 έως ${n} χαρακτήρες`, ru: (n: number) => `От 10 до ${n} символов` } as const;
  const one = { de: "Wähle eine Antwort.", en: "Choose one answer.", es: "Elige una respuesta.", tr: "Bir yanıt seç.", pl: "Wybierz jedną odpowiedź.", el: "Επίλεξε μία απάντηση.", ru: "Выбери один ответ." } as const;
  const exact = { de: (n: number) => `Wähle genau ${n} Antworten.`, en: (n: number) => `Choose exactly ${n} answers.`, es: (n: number) => `Elige exactamente ${n} respuestas.`, tr: (n: number) => `Tam olarak ${n} yanıt seç.`, pl: (n: number) => `Wybierz dokładnie ${n} odpowiedzi.`, el: (n: number) => `Επίλεξε ακριβώς ${n} απαντήσεις.`, ru: (n: number) => `Выбери ровно ${n} ответа.` } as const;
  const range = { de: (a: number,b: number) => `Wähle ${a} bis ${b} Antworten.`, en: (a: number,b: number) => `Choose between ${a} and ${b} answers.`, es: (a: number,b: number) => `Elige entre ${a} y ${b} respuestas.`, tr: (a: number,b: number) => `${a} ile ${b} arasında yanıt seç.`, pl: (a: number,b: number) => `Wybierz od ${a} do ${b} odpowiedzi.`, el: (a: number,b: number) => `Επίλεξε από ${a} έως ${b} απαντήσεις.`, ru: (a: number,b: number) => `Выбери от ${a} до ${b} ответов.` } as const;
  if (question.format === "text") return textRange[locale](question.maxLength ?? 280);
  if (question.minSelections === question.maxSelections) {
    return question.minSelections === 1 ? one[locale] : exact[locale](question.minSelections);
  }
  return range[locale](question.minSelections, question.maxSelections);
}

function EvidenceDetails({ evidence }: { evidence: readonly ProblemEvidence[] }) {
  const locale = useLocale();
  return (
    <details className="mt-5 border-t border-white/10 pt-4 text-sm text-slate-400">
      <summary className="min-h-11 cursor-pointer list-none rounded-lg py-3 font-bold text-[#d1c7ff] marker:content-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b8a5ff]">
        {problemUi[locale].evidence} <span aria-hidden="true">+</span>
      </summary>
      <ul className="mt-2 grid gap-2">
        {evidence.slice(0, 3).map((item) => (
          <li key={`${item.questionId}-${item.optionId}`} className="border-l border-[#b8a5ff]/45 pl-4 leading-6 text-slate-300">
            „{item.answer}“
          </li>
        ))}
      </ul>
    </details>
  );
}

function ResultCard({ statement }: { statement: ProblemResultStatement }) {
  return (
    <article className="rounded-[1.5rem] border border-white/10 bg-white/[0.025] p-6 sm:p-7">
      <h4 className="text-lg font-black text-white">{statement.title}</h4>
      <p className="mt-4 leading-7 text-slate-300">{statement.text}</p>
      <EvidenceDetails evidence={statement.evidence} />
    </article>
  );
}

function ProblemPrintDocument({ result }: { result: ProblemResult }) {
  const locale = useLocale();
  const ui = problemUi[locale];
  return (
    <article className="fyns-print-document hidden" data-fyns-print-document="problem">
      <header className="fyns-print-header">
        <p className="fyns-print-brand">bts.online / FYNS / Problem</p>
        <h1>{result.title}</h1>
        <section className="fyns-print-summary" aria-labelledby="problem-print-summary-title">
          <h2 id="problem-print-summary-title">{ui.summary}</h2>
          {result.summary.map((sentence) => <p key={sentence}>{sentence}</p>)}
        </section>
        <p className="fyns-print-description">{result.description}</p>
      </header>

      <section className="fyns-print-section" aria-labelledby="problem-print-boundary-title">
        <h2 id="problem-print-boundary-title">{result.boundary.title}</h2>
        <p>{result.boundary.text}</p>
      </section>
      {result.userNote ? (
        <section className="fyns-print-section" aria-labelledby="problem-print-note-title">
          <h2 id="problem-print-note-title">{ui.improvement}</h2>
          <p>{result.userNote}</p>
        </section>
      ) : null}
      <section className="fyns-print-section" aria-labelledby="problem-print-situation-title">
        <h2 id="problem-print-situation-title">{ui.situation}</h2>
        <div className="fyns-print-stack">
          {result.situation.map(({ id, title, text }) => <article key={id} className="fyns-print-block"><h3>{title}</h3><p>{text}</p></article>)}
        </div>
      </section>
      <section className="fyns-print-section" aria-labelledby="problem-print-resources-title">
        <h2 id="problem-print-resources-title">{ui.resources}</h2>
        <div className="fyns-print-stack">
          {result.resources.map(({ id, title, text }) => <article key={id} className="fyns-print-block"><h3>{title}</h3><p>{text}</p></article>)}
        </div>
      </section>
      <section className="fyns-print-section" aria-labelledby="problem-print-questions-title">
        <h2 id="problem-print-questions-title">{ui.questions}</h2>
        <ol>{result.questionsToCarry.map((question) => <li key={question}>{question}</li>)}</ol>
      </section>
      <section className="fyns-print-section fyns-print-next-step" aria-labelledby="problem-print-next-title">
        <p className="fyns-print-label">{ui.smallNext}</p>
        <h2 id="problem-print-next-title">{result.nextStep.title}</h2>
        <p>{result.nextStep.text}</p>
      </section>
      <p className="fyns-print-disclaimer">{getProblemResultDisclaimer(locale)}</p>
    </article>
  );
}

function ResultView({
  result,
  dispatch,
  headingRef,
  restartPending,
}: {
  result: ProblemResult;
  dispatch: React.Dispatch<Parameters<typeof problemJourneyReducer>[1]>;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  restartPending: boolean;
}) {
  const locale = useLocale();
  const ui = problemUi[locale];
  const problemSections = getProblemSections(locale);
  const copyText = buildProblemResultText(result, locale);
  const shareText = buildProblemShareText(result, locale);
  const urgent = result.boundary.level === "urgent";
  return (
    <>
      <section aria-labelledby="problem-result-title" className="py-16 sm:py-24" data-fyns-screen-result>
        <div className="grid gap-10 border-b border-white/15 pb-14 lg:grid-cols-[1.05fr_0.8fr] lg:items-end">
          <div>
            <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[#d1c7ff]">{ui.snapshot}</p>
            <h2 ref={headingRef} tabIndex={-1} style={{ outline: "none" }} id="problem-result-title" className="mt-5 text-4xl font-black text-white outline-none sm:text-6xl">
              {result.title}
            </h2>
            <div className="mt-7 grid gap-3 text-lg font-bold leading-8 text-slate-200">
              {result.summary.map((sentence) => <p key={sentence}>{sentence}</p>)}
            </div>
          </div>
          <p className="border-l border-[#b8a5ff] pl-7 leading-7 text-slate-300">{result.description}</p>
        </div>

        <aside
          aria-labelledby="problem-boundary-title"
          className={`mt-10 rounded-[1.5rem] border p-6 sm:p-8 ${urgent ? "border-[#ff9a3d]/55 bg-[#ff9a3d]/[0.07]" : "border-[#b8a5ff]/30 bg-[#b8a5ff]/[0.04]"}`}
        >
          <p className={`font-mono text-xs font-black uppercase tracking-[0.2em] ${urgent ? "text-[#ffb36d]" : "text-[#d1c7ff]"}`}>{ui.boundary}</p>
          <h3 id="problem-boundary-title" className="mt-4 text-2xl font-black text-white">{result.boundary.title}</h3>
          <p className="mt-4 max-w-4xl font-bold leading-7 text-slate-200">{result.boundary.text}</p>
        </aside>

        {result.userNote ? (
          <section aria-labelledby="problem-user-note-title" className="mt-14 border-l-2 border-[#b8a5ff] pl-6 sm:pl-8">
            <h3 id="problem-user-note-title" className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[#d1c7ff]">{ui.improvement}</h3>
            <p className="mt-4 max-w-4xl text-xl font-black leading-8 text-white">„{result.userNote}“</p>
          </section>
        ) : null}

        <div className="mt-16 grid gap-16">
          <section aria-labelledby="problem-situation-title">
            <h3 id="problem-situation-title" className="text-3xl font-black text-white sm:text-5xl">{ui.situation}</h3>
            <div className="mt-7 grid gap-5 lg:grid-cols-3">{result.situation.map((statement) => <ResultCard key={statement.id} statement={statement} />)}</div>
          </section>
          <section aria-labelledby="problem-resources-title">
            <h3 id="problem-resources-title" className="text-3xl font-black text-white sm:text-5xl">{ui.resources}</h3>
            <div className="mt-7 grid gap-5 lg:grid-cols-3">{result.resources.map((statement) => <ResultCard key={statement.id} statement={statement} />)}</div>
          </section>
          <section aria-labelledby="problem-questions-title" className="rounded-[1.75rem] border border-white/10 bg-white/[0.025] p-7 sm:p-10">
            <h3 id="problem-questions-title" className="text-2xl font-black text-white sm:text-4xl">{ui.questions}</h3>
            <ol className="mt-7 grid gap-5">
              {result.questionsToCarry.map((question, index) => (
                <li key={question} className="flex gap-4 border-b border-white/10 pb-5 text-lg font-bold leading-8 text-slate-200 last:border-0 last:pb-0">
                  <span className="font-mono text-xs text-[#d1c7ff]">{String(index + 1).padStart(2, "0")}</span>{question}
                </li>
              ))}
            </ol>
          </section>
          <section aria-labelledby="problem-next-title" className="rounded-[1.75rem] border border-[#b8a5ff]/40 bg-[linear-gradient(135deg,rgba(184,165,255,0.11),rgba(255,255,255,0.02))] p-7 sm:p-10">
            <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[#d1c7ff]">{ui.smallNext}</p>
            <h3 id="problem-next-title" className="mt-5 text-3xl font-black text-white sm:text-5xl">{result.nextStep.title}</h3>
            <p className="mt-6 max-w-4xl text-lg font-bold leading-8 text-slate-200">{result.nextStep.text}</p>
            <EvidenceDetails evidence={result.nextStep.evidence} />
          </section>
        </div>

        <aside aria-labelledby="problem-human-context-title" className="mt-16 border-y border-white/10 py-10">
          <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[#d1c7ff]">Human Context Check</p>
          <h3 id="problem-human-context-title" className="mt-4 text-2xl font-black text-white sm:text-4xl">{ui.context}</h3>
          <p className="mt-5 max-w-4xl leading-7 text-slate-300">{ui.contextText}</p>
        </aside>

        <FynsResultActions accent="#b8a5ff" copyText={copyText} shareTitle={problemResultTitle[locale]} shareText={shareText} printTitle={problemResultTitle[locale]} />

        <section aria-labelledby="problem-edit-title" className="mt-20 border-t border-white/15 pt-14">
          <div className="grid gap-8 lg:grid-cols-[0.65fr_1fr]">
            <div><h3 id="problem-edit-title" className="text-2xl font-black text-white">{ui.edit}</h3><p className="mt-4 leading-7 text-slate-400">{ui.editText}</p></div>
            <ol className="grid gap-3 sm:grid-cols-2">
              {problemSections.map((section, index) => <li key={section.id}><button type="button" onClick={() => dispatch({ type: "edit-section", sectionId: section.id })} className="flex min-h-14 w-full items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.025] px-5 py-4 text-left font-bold text-slate-200 hover:border-[#b8a5ff]/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b8a5ff]"><span className="font-mono text-xs text-[#d1c7ff]">{String(index + 1).padStart(2, "0")}</span>{section.title}</button></li>)}
            </ol>
          </div>
        </section>

        <div className="mt-12 border-t border-white/10 pt-10">
          {!restartPending ? (
            <button type="button" onClick={() => dispatch({ type: "request-restart" })} className="min-h-12 rounded-full border border-white/15 px-6 py-3 font-bold text-slate-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#b8a5ff]">{ui.restart}</button>
          ) : (
            <div className="max-w-2xl rounded-2xl border border-[#ff9a3d]/30 bg-[#ff9a3d]/[0.04] p-6">
              <p className="font-bold text-white">{ui.discardTitle}</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">{ui.discardText}</p>
              <div className="mt-5 flex flex-wrap gap-3"><button type="button" onClick={() => dispatch({ type: "cancel-restart" })} className="min-h-11 rounded-full border border-white/15 px-5 py-2 font-bold text-slate-200">{ui.keep}</button><button type="button" onClick={() => dispatch({ type: "confirm-restart" })} className="min-h-11 rounded-full bg-[#ff9a3d] px-5 py-2 font-black text-[#241204]">{ui.discard}</button></div>
            </div>
          )}
        </div>
      </section>
      <ProblemPrintDocument result={result} />
    </>
  );
}

export function ProblemJourney() {
  const locale = useLocale();
  const ui = problemUi[locale];
  const problemIntro = getProblemIntro(locale);
  const problemQuestions = getProblemQuestions(locale);
  const problemSections = getProblemSections(locale);
  const [state, dispatch] = useReducer(
    (current: typeof initialProblemState, action: Parameters<typeof problemJourneyReducer>[1]) => problemJourneyReducer(current, action, locale),
    initialProblemState,
  );
  const headingRef = useRef<HTMLHeadingElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const initialRender = useRef(true);
  const question = problemQuestions[state.questionIndex];
  const resultState = useMemo(() => buildProblemResult(state.answers, locale), [locale, state.answers]);

  useEffect(() => {
    if (initialRender.current) { initialRender.current = false; return; }
    headingRef.current?.focus();
  }, [state.phase, state.questionIndex]);
  useEffect(() => {
    if (state.validationMessage) { errorRef.current?.focus(); errorRef.current?.scrollIntoView({ block: "center" }); }
  }, [state.validationMessage]);

  if (state.phase === "intro") {
    return (
      <section aria-labelledby="problem-intro-title" className="py-16 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-[1fr_0.82fr]">
          <div><p className="font-mono text-xs font-black uppercase tracking-[0.24em] text-[#d1c7ff]">{problemIntro.eyebrow}</p><h2 ref={headingRef} tabIndex={-1} style={{ outline: "none" }} id="problem-intro-title" className="mt-6 text-3xl font-black text-white outline-none sm:text-5xl">{problemIntro.title}</h2><p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">{problemIntro.description}</p><p className="mt-8 font-mono text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{problemIntro.duration}</p></div>
          <div className="grid gap-5">
            <div className="rounded-[1.5rem] border border-[#b8a5ff]/25 bg-[#b8a5ff]/[0.04] p-6"><h3 className="font-black text-white">{ui.can}</h3><ul className="mt-5 grid gap-3 text-sm leading-6 text-slate-300">{problemIntro.canDo.map((item) => <li key={item} className="border-l border-[#b8a5ff]/50 pl-4">{item}</li>)}</ul></div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.025] p-6"><h3 className="font-black text-white">{ui.cannot}</h3><ul className="mt-5 grid gap-3 text-sm leading-6 text-slate-400">{problemIntro.cannotDo.map((item) => <li key={item} className="border-l border-white/15 pl-4">{item}</li>)}</ul></div>
          </div>
        </div>
        <aside className="mt-10 rounded-[1.5rem] border border-[#ff9a3d]/45 bg-[#ff9a3d]/[0.06] p-6 sm:p-8"><p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[#ffb36d]">{ui.danger}</p><p className="mt-4 max-w-4xl font-bold leading-7 text-white">{problemIntro.urgentBoundary}</p></aside>
        <div className="mt-8 border-l-2 border-[#b8a5ff] bg-[#b8a5ff]/[0.035] p-6"><p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[#d1c7ff]">{ui.local}</p><p className="mt-4 max-w-4xl font-bold leading-7 text-white">{problemIntro.privacy}</p></div>
        <button type="button" onClick={() => dispatch({ type: "start" })} className="mt-10 min-h-14 rounded-full bg-[#b8a5ff] px-7 py-4 font-black text-[#110d24] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#b8a5ff]">{ui.start} <span aria-hidden="true">→</span></button>
      </section>
    );
  }

  if (state.phase === "result") {
    if (resultState.status !== "complete") return <section className="py-20"><h2 ref={headingRef} tabIndex={-1} className="text-3xl font-black text-white outline-none">{ui.incomplete}</h2><button type="button" onClick={() => dispatch({ type: "edit-section", sectionId: problemSections[0].id })} className="mt-8 min-h-12 rounded-full bg-[#b8a5ff] px-6 py-3 font-black text-[#110d24]">{ui.backQuestions}</button></section>;
    return <ResultView result={resultState.result} dispatch={dispatch} headingRef={headingRef} restartPending={state.restartPending} />;
  }

  const values = state.answers[question.id] ?? [];
  const sectionQuestions = problemQuestions.filter(({ sectionId }) => sectionId === question.sectionId);
  const currentSectionIndex = problemSections.findIndex(({ id }) => id === question.sectionId);
  const currentQuestionNumber = sectionQuestions.findIndex(({ id }) => id === question.id) + 1;
  const lastInSection = sectionQuestions.at(-1)?.id === question.id;
  const lastInJourney = state.questionIndex === problemQuestions.length - 1;
  const nextLabel = state.editingSectionId && lastInSection ? ui.update : lastInJourney ? ui.view : ui.next;
  const backLabel = state.editingSectionId && sectionQuestions[0]?.id === question.id ? ui.backSketch : state.questionIndex === 0 ? ui.backIntro : ui.back;
  const guidanceId = `${question.id}-guidance`;
  const errorId = `${question.id}-error`;

  return (
    <section className="pb-[calc(12rem+env(safe-area-inset-bottom))] pt-14 sm:pt-20 lg:pb-[calc(8.5rem+env(safe-area-inset-bottom))]">
      <form className="mx-auto max-w-4xl py-12 sm:py-16" aria-labelledby={`${question.id}-title`} onSubmit={(event) => { event.preventDefault(); dispatch({ type: "continue" }); }}>
        <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-slate-500">{problemSections[currentSectionIndex]?.title} · {ui.clarification} {String(state.questionIndex + 1).padStart(2, "0")}</p>
        <h2 ref={headingRef} tabIndex={-1} style={{ outline: "none" }} id={`${question.id}-title`} className="mt-5 text-3xl font-black leading-tight text-white outline-none sm:text-5xl">{question.prompt}</h2>
        {question.context ? <p className="mt-5 max-w-3xl text-lg leading-7 text-slate-400">{question.context}</p> : null}

        {question.format === "text" ? (
          <div className="mt-10">
            <div id={guidanceId} className="flex justify-between gap-4 text-sm text-slate-400"><label htmlFor={question.id}>{selectionInstruction(question, locale)}</label><span className="font-mono text-xs">{(values[0] ?? "").length} / {question.maxLength}</span></div>
            <textarea id={question.id} name={question.id} value={values[0] ?? ""} maxLength={question.maxLength} rows={5} aria-describedby={`${guidanceId}${state.validationMessage ? ` ${errorId}` : ""}`} onChange={(event) => dispatch({ type: "set-text", questionId: question.id, value: event.target.value })} className="mt-4 w-full resize-y rounded-2xl border border-white/15 bg-white/[0.03] p-5 text-lg leading-8 text-white focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#b8a5ff]" />
          </div>
        ) : (
          <fieldset aria-describedby={`${guidanceId}${state.validationMessage ? ` ${errorId}` : ""}`} className="mt-10">
            <legend className="sr-only">{question.prompt}</legend>
            <div id={guidanceId} className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-400"><span>{selectionInstruction(question, locale)}</span><span className="ml-auto inline-flex min-h-8 items-center rounded-full border border-[#b8a5ff]/40 bg-[#b8a5ff]/[0.06] px-3 py-1 font-mono text-xs font-bold text-[#d1c7ff]">{formatProblemSelectionCount(values.length, question.maxSelections, locale)}</span></div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {question.options.map((option) => {
                const selected = values.includes(option.id);
                const inputType = question.format === "single" ? "radio" : "checkbox";
                return <label key={option.id} className="group relative cursor-pointer"><input type={inputType} name={question.id} value={option.id} checked={selected} onChange={() => dispatch({ type: "toggle-option", questionId: question.id, optionId: option.id })} className="peer sr-only" /><span className={`flex min-h-20 items-start justify-between gap-4 rounded-2xl border px-5 py-5 transition peer-focus-visible:outline-2 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-[#b8a5ff] ${selected ? "border-[#b8a5ff]/70 bg-[#b8a5ff]/[0.1] text-white" : "border-white/10 bg-white/[0.025] text-slate-300 group-hover:border-white/25"}`}><span className="font-bold leading-6">{option.label}</span><span aria-hidden="true" className={`grid h-6 w-6 shrink-0 place-items-center border text-xs font-black ${inputType === "radio" ? "rounded-full" : "rounded-md"} ${selected ? "border-[#b8a5ff] bg-[#b8a5ff] text-[#110d24]" : "border-white/25 text-transparent"}`}>✓</span>{selected ? <span className="sr-only">{ui.selected}</span> : null}</span></label>;
              })}
            </div>
          </fieldset>
        )}
        {state.validationMessage ? <p ref={errorRef} id={errorId} tabIndex={-1} role="alert" className="mt-5 border-l-2 border-[#ff9a3d] pl-4 font-bold text-[#ffb36d] outline-none">{state.validationMessage}</p> : null}
        <JourneyDock locale={locale} sections={problemSections} currentSectionIndex={currentSectionIndex} globalQuestionNumber={state.questionIndex + 1} totalQuestionCount={problemQuestions.length} localQuestionNumber={currentQuestionNumber} localQuestionCount={sectionQuestions.length} accent="#b8a5ff" accessibleLabel={ui.progress} backLabel={backLabel} nextLabel={nextLabel} onBack={() => dispatch({ type: "back" })} />
      </form>
    </section>
  );
}
