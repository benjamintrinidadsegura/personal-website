import type { Metadata } from "next";
import Link from "next/link";

import { getGlobalDictionary } from "@/data/i18n/global";
import { getPrivacyDictionary, lifeAlignmentHistoryPrivacyCopy, lifeAlignmentLocalPrivacyCopy, relationshipAlignmentPrivacyCopy, writingTranslationPrivacyCopy } from "@/data/i18n/privacy";
import { privacyReleaseCopy, type PrivacyReleaseCopy } from "@/data/i18n/privacy-release";
import { legalOperator } from "@/data/legal";
import { siteConfig } from "@/data/site";
import { createLocalizedMetadata } from "@/lib/i18n/metadata";
import type { Locale } from "@/lib/i18n/config";
import { localizeHref } from "@/lib/i18n/routing";
import { getLocale } from "@/lib/i18n/server";
import { newsletterControllerAddress } from "@/lib/newsletter/config";

const personalAdvantagePrivacyCopy: Record<Locale, string> = {
  de: "Personal Advantage Mapping speichert ausschließlich versionierte, strukturierte Fortschritts- und Ergebnisdaten im lokalen Speicher dieses Browsers. Optionale Freitexte bleiben nur im Arbeitsspeicher der aktuellen Seite und werden nicht dauerhaft gespeichert. Antworten werden weder an BTS noch an ein Konto, Analytics oder einen KI-Anbieter gesendet. Ein Neustart löscht den lokalen Stand; das Löschen der Browserdaten ebenfalls. One-Pager und Share Cards enthalten nur ausdrücklich ausgewählte, abgeleitete Zusammenfassungen – niemals Rohantworten, Freitexte, Details zu Einschränkungen oder private Zugangsdaten.",
  en: "Personal Advantage Mapping stores versioned structured progress and result data only in this browser's local storage. Optional free text remains in current-page memory and is not persisted. Answers are not sent to BTS, an account, analytics or an AI provider. Starting over clears the local state; clearing browser data does too. The One-Pager and Share Cards contain only explicitly selected derived summaries—never raw answers, free text, constraint details or private access information.",
  es: "Personal Advantage Mapping guarda el progreso estructurado y versionado solo en el almacenamiento local de este navegador. El texto libre opcional no se conserva. Las respuestas no se envían a BTS, cuentas, analítica ni proveedores de IA. One-Pager y Share Cards solo incluyen resúmenes derivados elegidos expresamente.",
  tr: "Personal Advantage Mapping sürümlenmiş yapılandırılmış ilerleme ve sonuç verilerini yalnızca bu tarayıcının yerel depolamasında tutar. İsteğe bağlı serbest metin kalıcı değildir. Yanıtlar BTS'ye, bir hesaba, analitiğe veya yapay zekâ sağlayıcısına gönderilmez.",
  pl: "Personal Advantage Mapping przechowuje wersjonowane, ustrukturyzowane dane postępu i wyniku wyłącznie lokalnie w tej przeglądarce. Opcjonalny tekst nie jest utrwalany. Odpowiedzi nie trafiają do BTS, konta, analityki ani dostawcy AI.",
  el: "Το Personal Advantage Mapping αποθηκεύει τα δομημένα δεδομένα προόδου και αποτελέσματος μόνο τοπικά σε αυτό το πρόγραμμα περιήγησης. Το προαιρετικό ελεύθερο κείμενο δεν διατηρείται και οι απαντήσεις δεν αποστέλλονται σε BTS, λογαριασμό, analytics ή πάροχο AI.",
  ru: "Personal Advantage Mapping хранит версионированные структурированные данные прогресса и результата только локально в этом браузере. Необязательный свободный текст не сохраняется. Ответы не отправляются BTS, в аккаунт, аналитику или поставщику ИИ.",
};

const moneyProfilePrivacyCopy: Record<Locale, string> = {
  de: "Money Profile fragt nicht nach Einkommen, Kontoständen, Vermögen, Schuldenbeträgen, Kreditwürdigkeit, Anlagen oder Bankzugängen. Versionierte strukturierte Antworten und Fortschritt bleiben ausschließlich im lokalen Speicher dieses Browsers; es gibt keine Konto-Synchronisierung, Bankverbindung, Laufzeit-KI oder Drittanbieter-Persistenz. Share Cards enthalten nur ausdrücklich ausgewählte, abgeleitete Zusammenfassungen. Ergebnis-Feedback ist optional, wird getrennt von den Antworten an das private BTS-Feedback-Postfach gesendet und darf keine sensiblen Finanzinformationen enthalten. Money Profile ist keine Finanz-, Anlage-, Steuer-, Kredit- oder Schuldberatung.",
  en: "Money Profile does not ask for income, balances, net worth, debt amounts, credit scores, investments or bank access. Versioned structured answers and progress stay only in this browser's local storage; there is no account sync, bank connection, runtime AI or third-party persistence. Share Cards contain only explicitly selected derived summaries. Result feedback is optional, is sent to the private BTS feedback inbox separately from answers, and must not include sensitive financial information. Money Profile is not financial, investment, tax, credit or debt advice.",
  es: "Money Profile no solicita ingresos, saldos, patrimonio, importes de deuda, puntuaciones de crédito, inversiones ni acceso bancario. Las respuestas y el progreso versionados permanecen solo en el almacenamiento local. No hay sincronización, conexión bancaria, IA en ejecución ni persistencia de terceros. Los comentarios sobre el resultado son opcionales y se envían por separado al buzón privado de BTS.",
  tr: "Money Profile gelir, bakiye, net servet, borç tutarı, kredi puanı, yatırım veya banka erişimi sormaz. Sürümlenmiş yanıtlar ve ilerleme yalnızca bu tarayıcının yerel depolamasında kalır. Sonuç geri bildirimi isteğe bağlıdır ve yanıtlardan ayrı olarak özel BTS posta kutusuna gönderilir.",
  pl: "Money Profile nie pyta o dochód, saldo, majątek, kwoty zadłużenia, scoring, inwestycje ani dostęp do banku. Wersjonowane odpowiedzi i postęp pozostają wyłącznie lokalnie w przeglądarce. Opinia o wyniku jest opcjonalna i trafia do prywatnej skrzynki BTS oddzielnie od odpowiedzi.",
  el: "Το Money Profile δεν ζητά εισόδημα, υπόλοιπα, καθαρή αξία, ποσά χρέους, πιστωτικό σκορ, επενδύσεις ή τραπεζική πρόσβαση. Οι απαντήσεις και η πρόοδος μένουν μόνο τοπικά. Η ανατροφοδότηση αποτελέσματος είναι προαιρετική και αποστέλλεται χωριστά στο ιδιωτικό inbox του BTS.",
  ru: "Money Profile не запрашивает доход, баланс, капитал, суммы долгов, кредитный рейтинг, инвестиции или доступ к банку. Версионированные ответы и прогресс остаются только локально в браузере. Отзыв о результате необязателен и отправляется в приватный ящик BTS отдельно от ответов.",
};

const resultFeedbackPrivacyCopy: Record<Locale, string> = {
  de: "Optionales Ergebnis-Feedback speichert nur das gewählte Produkt, die Passungsantwort, eine optionale Nutzenkategorie, die Sprache und einen optionalen begrenzten Kommentar. Assessment-Antworten, vollständige Ergebnisse, Stressdetails und Finanzdaten werden nicht angehängt; Feedback verändert das aktuelle Ergebnis niemals.",
  en: "Optional result feedback stores only the selected product, fit response, optional usefulness category, locale and optional bounded comment. Assessment answers, full results, stress details and financial data are not attached, and feedback never changes the current result.",
  es: "Los comentarios opcionales guardan solo el producto, la respuesta de ajuste, una categoría de utilidad opcional, el idioma y un comentario breve opcional. No se adjuntan respuestas, resultados completos, detalles de estrés ni datos financieros; el resultado no cambia.",
  tr: "İsteğe bağlı sonuç geri bildirimi yalnızca ürünü, uyum yanıtını, isteğe bağlı yararlılık kategorisini, dili ve sınırlı yorumu saklar. Değerlendirme yanıtları, tam sonuç, stres ayrıntıları ve finansal veriler eklenmez; mevcut sonuç değişmez.",
  pl: "Opcjonalna opinia zapisuje tylko produkt, ocenę dopasowania, opcjonalną kategorię użyteczności, język i ograniczony komentarz. Odpowiedzi, pełny wynik, szczegóły stresu i dane finansowe nie są dołączane, a wynik się nie zmienia.",
  el: "Η προαιρετική ανατροφοδότηση αποθηκεύει μόνο το προϊόν, την απάντηση αντιστοίχισης, προαιρετική κατηγορία χρησιμότητας, γλώσσα και περιορισμένο σχόλιο. Δεν επισυνάπτονται απαντήσεις, πλήρες αποτέλεσμα, στοιχεία άγχους ή οικονομικά δεδομένα και το αποτέλεσμα δεν αλλάζει.",
  ru: "Необязательный отзыв хранит только продукт, оценку соответствия, необязательную категорию пользы, язык и ограниченный комментарий. Ответы, полный результат, детали стресса и финансовые данные не прикрепляются; текущий результат не меняется.",
};

const nerdCornerPrivacyCopy: Record<Locale, { title: string; body: string }> = {
  de: { title: "Nerd Corner / kuratierter Geschmack", body: "Nerd Corner ist öffentlich sichtbarer, redaktionell ausgewählter persönlicher Inhalt. Beim Laden externer Artworks ruft der Browser Mediendateien direkt von media.themoviedb.org (TMDB) und images.igdb.com (IGDB) ab. Dabei können technisch notwendige Verbindungsdaten wie IP-Adresse und Request-Header an den jeweiligen Anbieter übermittelt werden. Nerd Corner setzt dafür keine zusätzlichen Cookies, fügt kein Anbieter-Tracking hinzu und führt keine Laufzeit-API-Abfragen bei diesen Anbietern aus. Spotify wird nicht eingebunden; der Streamory-Hinweis führt nur zur internen Projektseite." },
  en: { title: "Nerd Corner / curated taste", body: "Nerd Corner is publicly visible, editorially selected personal content. When external artwork loads, the browser requests media files directly from media.themoviedb.org (TMDB) and images.igdb.com (IGDB). These necessary requests can disclose ordinary connection data such as the IP address and request headers to the respective provider. Nerd Corner does not set additional cookies, add provider tracking or make runtime provider API calls for this artwork. Spotify is not embedded, and the Streamory handoff links only to the internal project page." },
  es: { title: "Nerd Corner / gustos seleccionados", body: "Nerd Corner es contenido personal público y seleccionado editorialmente. Al cargar imágenes externas, el navegador solicita archivos multimedia directamente a media.themoviedb.org (TMDB) e images.igdb.com (IGDB). Estas solicitudes necesarias pueden transmitir al proveedor correspondiente datos de conexión habituales, como la dirección IP y las cabeceras de la solicitud. Nerd Corner no instala cookies adicionales, no añade seguimiento del proveedor ni realiza llamadas de ejecución a sus API para estas imágenes. Spotify no se integra y la referencia a Streamory solo lleva a la página interna del proyecto." },
  tr: { title: "Nerd Corner / seçilmiş zevkler", body: "Nerd Corner herkese açık, editoryal olarak seçilmiş kişisel içeriktir. Harici görseller yüklenirken tarayıcı medya dosyalarını doğrudan media.themoviedb.org (TMDB) ve images.igdb.com (IGDB) adreslerinden ister. Bu gerekli istekler IP adresi ve istek başlıkları gibi olağan bağlantı verilerini ilgili sağlayıcıya iletebilir. Nerd Corner bu görseller için ek çerez ayarlamaz, sağlayıcı takibi eklemez veya çalışma zamanında sağlayıcı API çağrısı yapmaz. Spotify yerleştirilmez; Streamory yönlendirmesi yalnızca dahili proje sayfasına gider." },
  pl: { title: "Nerd Corner / wybrane gusta", body: "Nerd Corner to publicznie widoczna, redakcyjnie wybrana treść osobista. Podczas ładowania zewnętrznych grafik przeglądarka pobiera pliki multimedialne bezpośrednio z media.themoviedb.org (TMDB) i images.igdb.com (IGDB). Te niezbędne żądania mogą przekazać odpowiedniemu dostawcy zwykłe dane połączenia, takie jak adres IP i nagłówki żądania. Nerd Corner nie ustawia z tego powodu dodatkowych cookies, nie dodaje śledzenia dostawcy ani nie wykonuje wywołań API dostawcy w czasie działania. Spotify nie jest osadzany, a odnośnik Streamory prowadzi tylko do wewnętrznej strony projektu." },
  el: { title: "Nerd Corner / επιλεγμένες προτιμήσεις", body: "Το Nerd Corner είναι δημόσιο, επιλεγμένο προσωπικό περιεχόμενο. Όταν φορτώνονται εξωτερικά γραφικά, το πρόγραμμα περιήγησης ζητά αρχεία πολυμέσων απευθείας από τα media.themoviedb.org (TMDB) και images.igdb.com (IGDB). Αυτά τα αναγκαία αιτήματα μπορούν να διαβιβάσουν στον αντίστοιχο πάροχο συνήθη δεδομένα σύνδεσης, όπως τη διεύθυνση IP και τις κεφαλίδες αιτήματος. Το Nerd Corner δεν ορίζει πρόσθετα cookies, δεν προσθέτει παρακολούθηση παρόχου και δεν πραγματοποιεί κλήσεις API παρόχου κατά την εκτέλεση για αυτά τα γραφικά. Το Spotify δεν ενσωματώνεται και η αναφορά στο Streamory οδηγεί μόνο στην εσωτερική σελίδα του έργου." },
  ru: { title: "Nerd Corner / избранные вкусы", body: "Nerd Corner — публичный личный контент, отобранный редакционно. При загрузке внешних изображений браузер запрашивает медиафайлы напрямую с media.themoviedb.org (TMDB) и images.igdb.com (IGDB). Эти необходимые запросы могут передавать соответствующему провайдеру обычные данные соединения, например IP-адрес и заголовки запроса. Nerd Corner не устанавливает для этого дополнительные cookies, не добавляет отслеживание провайдера и не выполняет API-вызовы провайдера во время работы. Spotify не встраивается, а переход Streamory ведёт только на внутреннюю страницу проекта." },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const copy = getPrivacyDictionary(locale);
  return createLocalizedMetadata({ locale, pathname: "/privacy", title: copy.title, description: copy.description });
}

function PrivacySections({ sections }: { sections: [string, PrivacyReleaseCopy["sections"][keyof PrivacyReleaseCopy["sections"]]][] }) {
  return sections.map(([id, section]) => (
    <section key={id} id={id} aria-labelledby={`${id}-privacy-title`} className="scroll-mt-28 border-b border-white/15 py-14 last:border-b-0">
      <h2 id={`${id}-privacy-title`} className="text-3xl font-black text-white">{section.title}</h2>
      {section.body.map((paragraph) => <p key={paragraph} className="mt-5 leading-7 text-slate-300">{paragraph}</p>)}
    </section>
  ));
}

export default async function PrivacyPage() {
  const locale = await getLocale();
  const copy = getPrivacyDictionary(locale);
  const releaseCopy = privacyReleaseCopy[locale];
  const globalCopy = getGlobalDictionary(locale);
  const configuredNewsletterControllerAddress = newsletterControllerAddress();
  const sections = Object.entries(releaseCopy.sections);

  return (
    <article className="px-5 pb-24 pt-28 sm:px-8 sm:pt-36">
      <div className="mx-auto max-w-4xl">
        <nav aria-label={globalCopy.breadcrumbNavigation} className="font-mono text-xs text-slate-400">
          <Link href={localizeHref("/", locale)} className="inline-flex min-h-11 items-center hover:text-white">Digital HQ</Link> / <span aria-current="page" className="text-[#35d0e5]">{copy.breadcrumb}</span>
        </nav>
        <header className="border-b border-white/15 py-14">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#35d0e5]">{copy.eyebrow}</p>
          <h1 className="mt-5 break-words text-5xl font-black text-white sm:text-7xl">{copy.heading}</h1>
          <p role="note" className="mt-8 border-l-2 border-[#ff9a3d] pl-5 text-sm leading-6 text-slate-400">{copy.legalNotice}</p>
          <aside aria-labelledby="privacy-status-title" className="mt-8 border border-[#ff9a3d]/35 bg-[#ff9a3d]/[0.045] p-6 sm:p-8">
            <h2 id="privacy-status-title" className="text-xl font-black text-white">{releaseCopy.statusTitle}</h2>
            <p className="mt-3 leading-7 text-slate-300">{releaseCopy.statusBody}</p>
            <address className="mt-5 not-italic leading-7 text-slate-200">
              <strong className="text-white">{legalOperator.name}</strong><br />
              {legalOperator.address.street}<br />
              {legalOperator.address.postalCode} {legalOperator.address.city}<br />
              {legalOperator.address.country}<br />
              <a className="break-all text-[#35d0e5] underline underline-offset-4" href={`mailto:${legalOperator.email}`}>{legalOperator.email}</a>
            </address>
          </aside>
        </header>

        <PrivacySections sections={sections.slice(0, 3)} />

        <section id="writing-translations" aria-labelledby="writing-translations-privacy-title" className="scroll-mt-28 border-b border-white/15 py-14">
          <h2 id="writing-translations-privacy-title" className="text-3xl font-black text-white">{writingTranslationPrivacyCopy[locale].title}</h2>
          <p className="mt-5 leading-7 text-slate-300">{writingTranslationPrivacyCopy[locale].body}</p>
        </section>

        <section id="nerd-corner" aria-labelledby="nerd-corner-privacy-title" className="scroll-mt-28 border-b border-white/15 py-14">
          <h2 id="nerd-corner-privacy-title" className="text-3xl font-black text-white">{nerdCornerPrivacyCopy[locale].title}</h2>
          <p className="mt-5 leading-7 text-slate-300">{nerdCornerPrivacyCopy[locale].body}</p>
        </section>

        <section id="life-alignment" aria-labelledby="life-alignment-privacy-title" className="scroll-mt-28 border-b border-white/15 py-14">
          <h2 id="life-alignment-privacy-title" className="text-3xl font-black text-white">Life Alignment</h2>
          <p className="mt-5 leading-7 text-slate-300">{lifeAlignmentLocalPrivacyCopy[locale]}</p>
          <p className="mt-5 leading-7 text-slate-300">{copy.life.partner}</p>
          <p className="mt-5 leading-7 text-slate-300">{relationshipAlignmentPrivacyCopy[locale]}</p>
          <p className="mt-5 leading-7 text-slate-300">{lifeAlignmentHistoryPrivacyCopy[locale]}</p>
          <p className="mt-5 leading-7 text-slate-300">{copy.life.export}</p>
        </section>

        <section id="personal-advantage" aria-labelledby="personal-advantage-privacy-title" className="scroll-mt-28 border-b border-white/15 py-14">
          <h2 id="personal-advantage-privacy-title" className="text-3xl font-black text-white">Personal Advantage Mapping</h2>
          <p className="mt-5 leading-7 text-slate-300">{personalAdvantagePrivacyCopy[locale]}</p>
        </section>

        <section id="money-profile" aria-labelledby="money-profile-privacy-title" className="scroll-mt-28 border-b border-white/15 py-14">
          <h2 id="money-profile-privacy-title" className="text-3xl font-black text-white">Money Profile</h2>
          <p className="mt-5 leading-7 text-slate-300">{moneyProfilePrivacyCopy[locale]}</p>
        </section>

        <PrivacySections sections={sections.slice(3, 7)} />

        <section id="feedback" aria-labelledby="feedback-privacy-title" className="scroll-mt-28 border-b border-white/15 py-14">
          <h2 id="feedback-privacy-title" className="text-3xl font-black text-white">{copy.feedback.title}</h2>
          <p className="mt-5 leading-7 text-slate-300">{copy.feedback.storage}</p>
          <p className="mt-5 leading-7 text-slate-300">{copy.feedback.access}</p>
          <p className="mt-5 leading-7 text-slate-300">{copy.feedback.retention}</p>
          <p className="mt-5 leading-7 text-slate-300">{resultFeedbackPrivacyCopy[locale]}</p>
        </section>

        <section id="newsletter" aria-labelledby="newsletter-privacy-title" className="scroll-mt-28 border-b border-white/15 py-14">
          <h2 id="newsletter-privacy-title" className="text-3xl font-black text-white">Newsletter</h2>
          {configuredNewsletterControllerAddress ? <>
            <p className="mt-5 leading-7 text-slate-300">{copy.newsletter.controller}: {siteConfig.name}, <span className="whitespace-pre-line">{configuredNewsletterControllerAddress}</span>. {copy.newsletter.contact}: <a className="text-[#35d0e5] underline underline-offset-4" href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>.</p>
            <p className="mt-5 leading-7 text-slate-300">{copy.newsletter.storage}</p>
            <p className="mt-5 leading-7 text-slate-300">{copy.newsletter.provider}</p>
            <p className="mt-5 leading-7 text-slate-300">{copy.newsletter.retention}</p>
          </> : <div role="status" className="mt-6 border-l-2 border-[#ff9a3d] p-6"><p className="font-bold text-white">{copy.newsletter.disabledTitle}</p><p className="mt-2 leading-7 text-slate-400">{releaseCopy.newsletterDisabledBody}</p></div>}
        </section>

        <PrivacySections sections={sections.slice(7)} />
      </div>
    </article>
  );
}
