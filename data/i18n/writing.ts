import type { Locale } from "@/lib/i18n/config";
import type { WritingContentType } from "@/types/writing";

type WritingTaxonomy = {
  contentTypes: Record<WritingContentType, string>;
  topics: Record<string, string>;
};

export const writingTaxonomies = {
  de: { contentTypes: { essay: "Essay", note: "Notiz" }, topics: { People: "Menschen", Work: "Arbeit", Building: "Aufbauen", Life: "Leben", Ideas: "Ideen" } },
  en: { contentTypes: { essay: "Essay", note: "Note" }, topics: { People: "People", Work: "Work", Building: "Building", Life: "Life", Ideas: "Ideas" } },
  es: { contentTypes: { essay: "Ensayo", note: "Nota" }, topics: { People: "Personas", Work: "Trabajo", Building: "Construcción", Life: "Vida", Ideas: "Ideas" } },
  tr: { contentTypes: { essay: "Deneme", note: "Not" }, topics: { People: "İnsanlar", Work: "İş", Building: "Üretmek", Life: "Hayat", Ideas: "Fikirler" } },
  pl: { contentTypes: { essay: "Esej", note: "Notatka" }, topics: { People: "Ludzie", Work: "Praca", Building: "Tworzenie", Life: "Życie", Ideas: "Pomysły" } },
  el: { contentTypes: { essay: "Δοκίμιο", note: "Σημείωση" }, topics: { People: "Άνθρωποι", Work: "Εργασία", Building: "Δημιουργία", Life: "Ζωή", Ideas: "Ιδέες" } },
  ru: { contentTypes: { essay: "Эссе", note: "Заметка" }, topics: { People: "Люди", Work: "Работа", Building: "Создание", Life: "Жизнь", Ideas: "Идеи" } },
} as const satisfies Record<Locale, WritingTaxonomy>;

export function localizeWritingTopic(topic: string, locale: Locale): string {
  const topics: Record<string, string> = writingTaxonomies[locale].topics;
  return topics[topic] ?? topic;
}

const de = {
  page: {
    description: "Essays und Notizen über Menschen, Arbeit, Aufbauen, Leben und Ideen.",
    eyebrow: "Writing / Field Notes",
    title: "Gedanken,\ndie bleiben.",
    introduction: "Gedanken über Arbeit, Identität, Mut und die Geschichten, die wir über uns selbst erzählen.",
    featured: "Ausgewählter Text",
    readArticle: "Artikel lesen",
    firstTitle: "Der erste Text nimmt Form an.",
    firstBody: "Die ersten Essays und Notizen werden im BTS Studio vorbereitet.",
    latest: "Neueste Texte",
    readingTime: "Min. Lesezeit",
  },
  article: {
    breadcrumb: "Breadcrumb",
    contentLabel: "Artikelinhalt",
    back: "Zurück zu Writing",
    minRead: "Min. Lesezeit",
    sourceNotice: "Dieser Artikel ist nur in seiner Originalsprache veröffentlicht. Navigation und Systemfunktionen folgen deiner gewählten Sprache.",
    availableIn: "Artikel verfügbar auf",
  },
  discussion: {
    eyebrow: "Diskussion",
    title: "Den Gedanken weiterführen.",
    principle: "Widerspruch ist willkommen. Respektlosigkeit nicht.",
    unavailableTitle: "Kommentare sind vorübergehend nicht verfügbar.",
    unavailableBody: "Der Artikel bleibt verfügbar, während der Diskussionsdienst wiederhergestellt wird.",
    emptyTitle: "Noch keine Kommentare.",
    emptyBody: "Beginne die Diskussion mit einer durchdachten Antwort.",
    closedTitle: "Diskussion geschlossen.",
    closedBody: "Bestehende Kommentare bleiben sichtbar, neue Kommentare werden jedoch nicht angenommen.",
    submissionUnavailable: "Kommentare können vorübergehend nicht eingereicht werden.",
    publishedComments: "Veröffentlichte Kommentare",
    deleted: "Kommentar von der schreibenden Person gelöscht.",
    guest: "Gast",
    author: "Autor",
    edited: "bearbeitet",
    secureUnavailable: "Das sichere Einreichen von Kommentaren ist vorübergehend nicht verfügbar.",
    secureAccountUnavailable: "Sicheres Kommentieren mit Konto ist vorübergehend nicht verfügbar.",
    publishedTitle: "Kommentar veröffentlicht.",
    publishedBody: "Danke, dass du dich an der Diskussion beteiligst.",
    displayName: "Anzeigename",
    required: "erforderlich",
    displayNameHelp: "Wird mit einem Gast-Hinweis angezeigt. Gleiche Namen bedeuten nicht, dass es dieselbe Person ist.",
    comment: "Kommentar",
    plainTextHelp: "Klartext mit Absatzumbrüchen. Kein Markdown oder Rich-Text.",
    respect: "Sei direkt und respektvoll. Widerspruch ist willkommen; Belästigung und persönliche Angriffe nicht.",
    publishing: "Wird veröffentlicht…",
    publish: "Kommentar veröffentlichen",
    commentingAs: "Du kommentierst als",
    accountIdentity: "Deine Kontoidentität wurde von bts.online verifiziert. Sei direkt und respektvoll.",
    profileTitle: "Wie möchtest du auf bts.online erscheinen?",
    profileBody: "Dein Anzeigename kennzeichnet deine BTS-Account-Kommentare. Er muss nicht eindeutig sein.",
    profileSaved: "Anzeigename gespeichert.",
    profileHelp: "2–40 Zeichen. Namen dürfen mehrfach vorkommen, offizielle Kennzeichnungen sind reserviert.",
    saving: "Wird gespeichert…",
    saveDisplayName: "Anzeigename speichern",
    editTitle: "Deinen Kommentar bearbeiten",
    save: "Speichern",
    cancel: "Abbrechen",
    edit: "Bearbeiten",
    delete: "Löschen",
    deleteTitle: "Deinen Kommentar löschen?",
    deleteBody: "Das kann nicht rückgängig gemacht werden. Falls später Antworten existieren, bleibt ein Löschhinweis sichtbar.",
    deleting: "Wird gelöscht…",
    updated: "Kommentar aktualisiert.",
    deletedStatus: "Kommentar gelöscht.",
    errors: {
      INVALID_INPUT: "Bitte prüfe deinen Kommentar.",
      INVALID_REQUEST: "Die Anfrage konnte nicht verifiziert werden.",
      INVALID_FORM_TOKEN: "Dieses Formular ist abgelaufen. Lade die Seite neu und versuche es noch einmal.",
      SUBMISSION_TOO_FAST: "Bitte nimm dir vor dem Absenden einen Moment Zeit.",
      RATE_LIMITED: "Zu viele Kommentare wurden eingereicht. Bitte versuche es später erneut.",
      DUPLICATE: "Dieser Kommentar wurde vor Kurzem bereits eingereicht.",
      ARTICLE_UNAVAILABLE: "Dieser Artikel ist nicht für Diskussionen verfügbar.",
      DISCUSSION_CLOSED: "Diese Diskussion wurde geschlossen.",
      DISCUSSION_DISABLED: "Kommentare sind für diesen Artikel deaktiviert.",
      PROFILE_REQUIRED: "Für diese Aktion wird dein Kontoprofil benötigt.",
      SERVICE_UNAVAILABLE: "Kommentare sind vorübergehend nicht verfügbar. Bitte versuche es später erneut.",
      UNAUTHORIZED: "Melde dich erneut an, bevor du diesen Kommentar verwaltest.",
      UNAVAILABLE: "Dieser Kommentar kann nicht mehr geändert werden.",
      STALE: "Der Kommentar wurde seit dem Laden verändert. Lade die Seite neu und versuche es erneut.",
      NO_CHANGE: "Nimm vor dem Speichern eine Änderung vor.",
      COOLDOWN: "Bitte warte einen Moment, bevor du den Kommentar erneut bearbeitest.",
    },
  },
  newsletter: {
    eyebrow: "Newsletter / Aus dem HQ",
    title: "Den roten Faden behalten.",
    details: "Newsletter ansehen",
  },
} as const;

type Widen<T> = { [K in keyof T]: T[K] extends string ? string : T[K] extends Record<string, unknown> ? Widen<T[K]> : T[K] };
export type WritingDictionary = Widen<typeof de>;

const en: WritingDictionary = {
  page: {
    description: "Essays and notes about people, work, building, life and ideas.",
    eyebrow: "Writing / Field Notes",
    title: "Thoughts\nworth keeping.",
    introduction: "Thoughts on work, identity, courage and the stories we tell about ourselves.",
    featured: "Featured writing",
    readArticle: "Read article",
    firstTitle: "The first piece is taking shape.",
    firstBody: "The first essays and notes are being prepared in BTS Studio.",
    latest: "Latest writing",
    readingTime: "min read",
  },
  article: {
    breadcrumb: "Breadcrumb",
    contentLabel: "Article content",
    back: "Back to Writing",
    minRead: "min read",
    sourceNotice: "This article is published only in its original language. Navigation and system controls follow your chosen language.",
    availableIn: "Article available in",
  },
  discussion: {
    eyebrow: "Discussion",
    title: "Continue the thought.",
    principle: "Disagreement is welcome. Disrespect isn’t.",
    unavailableTitle: "Comments are temporarily unavailable.",
    unavailableBody: "The article remains available while the discussion service recovers.",
    emptyTitle: "No comments yet.",
    emptyBody: "Start the discussion with a thoughtful response.",
    closedTitle: "Discussion closed.",
    closedBody: "Existing comments remain visible, but new comments are not being accepted.",
    submissionUnavailable: "Comment submission is temporarily unavailable.",
    publishedComments: "Published comments",
    deleted: "Comment deleted by author.",
    guest: "Guest",
    author: "Author",
    edited: "edited",
    secureUnavailable: "Secure comment submission is temporarily unavailable.",
    secureAccountUnavailable: "Secure account commenting is temporarily unavailable.",
    publishedTitle: "Comment published.",
    publishedBody: "Thank you for joining the discussion.",
    displayName: "Display name",
    required: "required",
    displayNameHelp: "Shown with a Guest label. Matching names do not imply the same person.",
    comment: "Comment",
    plainTextHelp: "Plain text with paragraph breaks. No Markdown or rich-text formatting.",
    respect: "Be direct and respectful. Disagreement is welcome; harassment and personal attacks are not.",
    publishing: "Publishing…",
    publish: "Publish comment",
    commentingAs: "Commenting as",
    accountIdentity: "Your account identity is verified by bts.online. Be direct and respectful.",
    profileTitle: "How should you appear on bts.online?",
    profileBody: "Your display name identifies your BTS Account comments. It does not need to be unique.",
    profileSaved: "Display name saved.",
    profileHelp: "2–40 characters. Names may be shared, but official labels are reserved.",
    saving: "Saving…",
    saveDisplayName: "Save display name",
    editTitle: "Edit your comment",
    save: "Save",
    cancel: "Cancel",
    edit: "Edit",
    delete: "Delete",
    deleteTitle: "Delete your comment?",
    deleteBody: "This cannot be undone. If replies exist later, a deleted marker will remain.",
    deleting: "Deleting…",
    updated: "Comment updated.",
    deletedStatus: "Comment deleted.",
    errors: {
      INVALID_INPUT: "Please review your comment.",
      INVALID_REQUEST: "The request could not be verified.",
      INVALID_FORM_TOKEN: "This form has expired. Reload the page and try again.",
      SUBMISSION_TOO_FAST: "Please take a moment before submitting.",
      RATE_LIMITED: "Too many comments were submitted. Please try again later.",
      DUPLICATE: "This comment was recently submitted already.",
      ARTICLE_UNAVAILABLE: "This article is not available for discussion.",
      DISCUSSION_CLOSED: "This discussion has been closed.",
      DISCUSSION_DISABLED: "Comments are disabled for this article.",
      PROFILE_REQUIRED: "Your account profile is required for this action.",
      SERVICE_UNAVAILABLE: "Comments are temporarily unavailable. Please try again later.",
      UNAUTHORIZED: "Sign in again before managing this comment.",
      UNAVAILABLE: "This comment can no longer be changed.",
      STALE: "This comment changed since the page loaded. Reload and try again.",
      NO_CHANGE: "Make a change before saving.",
      COOLDOWN: "Please wait a moment before editing this comment again.",
    },
  },
  newsletter: {
    eyebrow: "Newsletter / From the HQ",
    title: "Keep the thread going.",
    details: "Newsletter details",
  },
};

const es: WritingDictionary = {
  page: { description: "Ensayos y notas sobre personas, trabajo, creación, vida e ideas.", eyebrow: "Writing / Notas de campo", title: "Ideas que\nmerecen quedarse.", introduction: "Reflexiones sobre trabajo, identidad, valentía y las historias que nos contamos sobre nosotros mismos.", featured: "Texto destacado", readArticle: "Leer artículo", firstTitle: "El primer texto está tomando forma.", firstBody: "Los primeros ensayos y notas se están preparando en BTS Studio.", latest: "Últimos textos", readingTime: "min de lectura" },
  article: { breadcrumb: "Ruta de navegación", contentLabel: "Contenido del artículo", back: "Volver a Writing", minRead: "min de lectura", sourceNotice: "Este artículo solo está publicado en su idioma original. La navegación y las funciones del sistema siguen el idioma elegido.", availableIn: "Artículo disponible en" },
  discussion: { eyebrow: "Conversación", title: "Continuar la idea.", principle: "El desacuerdo es bienvenido. La falta de respeto, no.", unavailableTitle: "Los comentarios no están disponibles temporalmente.", unavailableBody: "El artículo sigue disponible mientras se restablece el servicio de conversación.", emptyTitle: "Aún no hay comentarios.", emptyBody: "Inicia la conversación con una respuesta reflexiva.", closedTitle: "Conversación cerrada.", closedBody: "Los comentarios existentes siguen visibles, pero no se aceptan comentarios nuevos.", submissionUnavailable: "No se pueden enviar comentarios temporalmente.", publishedComments: "Comentarios publicados", deleted: "Comentario eliminado por quien lo escribió.", guest: "Invitado", author: "Autor", edited: "editado", secureUnavailable: "El envío seguro de comentarios no está disponible temporalmente.", secureAccountUnavailable: "Los comentarios seguros con cuenta no están disponibles temporalmente.", publishedTitle: "Comentario publicado.", publishedBody: "Gracias por participar en la conversación.", displayName: "Nombre visible", required: "obligatorio", displayNameHelp: "Se muestra con la etiqueta Invitado. Que dos nombres coincidan no significa que sean la misma persona.", comment: "Comentario", plainTextHelp: "Texto sin formato con saltos de párrafo. Sin Markdown ni formato enriquecido.", respect: "Sé directo y respetuoso. El desacuerdo es bienvenido; el acoso y los ataques personales, no.", publishing: "Publicando…", publish: "Publicar comentario", commentingAs: "Comentas como", accountIdentity: "bts.online ha verificado la identidad de tu cuenta. Sé directo y respetuoso.", profileTitle: "¿Cómo quieres aparecer en bts.online?", profileBody: "Tu nombre visible identifica los comentarios de tu BTS Account. No tiene que ser único.", profileSaved: "Nombre visible guardado.", profileHelp: "Entre 2 y 40 caracteres. Los nombres pueden repetirse; las etiquetas oficiales están reservadas.", saving: "Guardando…", saveDisplayName: "Guardar nombre visible", editTitle: "Editar tu comentario", save: "Guardar", cancel: "Cancelar", edit: "Editar", delete: "Eliminar", deleteTitle: "¿Eliminar tu comentario?", deleteBody: "No se puede deshacer. Si más adelante hay respuestas, quedará visible una marca de eliminación.", deleting: "Eliminando…", updated: "Comentario actualizado.", deletedStatus: "Comentario eliminado.", errors: { INVALID_INPUT: "Revisa tu comentario.", INVALID_REQUEST: "No se pudo verificar la solicitud.", INVALID_FORM_TOKEN: "Este formulario ha caducado. Recarga la página e inténtalo de nuevo.", SUBMISSION_TOO_FAST: "Tómate un momento antes de enviarlo.", RATE_LIMITED: "Se han enviado demasiados comentarios. Inténtalo más tarde.", DUPLICATE: "Este comentario ya se envió hace poco.", ARTICLE_UNAVAILABLE: "Este artículo no está disponible para conversar.", DISCUSSION_CLOSED: "Esta conversación está cerrada.", DISCUSSION_DISABLED: "Los comentarios están desactivados para este artículo.", PROFILE_REQUIRED: "Se necesita tu perfil de cuenta para esta acción.", SERVICE_UNAVAILABLE: "Los comentarios no están disponibles temporalmente. Inténtalo más tarde.", UNAUTHORIZED: "Vuelve a iniciar sesión antes de gestionar este comentario.", UNAVAILABLE: "Este comentario ya no se puede modificar.", STALE: "El comentario cambió desde que cargaste la página. Recarga e inténtalo de nuevo.", NO_CHANGE: "Haz un cambio antes de guardar.", COOLDOWN: "Espera un momento antes de volver a editar el comentario." } },
  newsletter: { eyebrow: "Newsletter / Desde el HQ", title: "Mantén el hilo.", details: "Ver el newsletter" },
};

const tr: WritingDictionary = {
  page: { description: "İnsanlar, iş, üretmek, yaşam ve fikirler üzerine denemeler ve notlar.", eyebrow: "Yazılar / Saha notları", title: "Kalmaya değer\ndüşünceler.", introduction: "İş, kimlik, cesaret ve kendimiz hakkında anlattığımız hikâyeler üzerine düşünceler.", featured: "Öne çıkan yazı", readArticle: "Yazıyı oku", firstTitle: "İlk yazı şekilleniyor.", firstBody: "İlk denemeler ve notlar BTS Studio’da hazırlanıyor.", latest: "Son yazılar", readingTime: "dk okuma" },
  article: { breadcrumb: "Gezinti yolu", contentLabel: "Yazı içeriği", back: "Yazılara dön", minRead: "dk okuma", sourceNotice: "Bu yazı yalnızca özgün dilinde yayımlandı. Gezinme ve sistem işlevleri seçtiğin dili izler.", availableIn: "Yazının mevcut olduğu dil" },
  discussion: { eyebrow: "Tartışma", title: "Düşünceyi sürdür.", principle: "Fikir ayrılığına yer var. Saygısızlığa yok.", unavailableTitle: "Yorumlar geçici olarak kullanılamıyor.", unavailableBody: "Tartışma hizmeti yeniden çalışana kadar yazı erişilebilir kalacak.", emptyTitle: "Henüz yorum yok.", emptyBody: "Düşünülmüş bir yanıtla tartışmayı başlat.", closedTitle: "Tartışma kapalı.", closedBody: "Mevcut yorumlar görünür kalır, ancak yeni yorum kabul edilmez.", submissionUnavailable: "Yorum gönderimi geçici olarak kullanılamıyor.", publishedComments: "Yayımlanan yorumlar", deleted: "Yorum, yazan kişi tarafından silindi.", guest: "Konuk", author: "Yazar", edited: "düzenlendi", secureUnavailable: "Güvenli yorum gönderimi geçici olarak kullanılamıyor.", secureAccountUnavailable: "Hesapla güvenli yorum yapma geçici olarak kullanılamıyor.", publishedTitle: "Yorum yayımlandı.", publishedBody: "Tartışmaya katıldığın için teşekkürler.", displayName: "Görünen ad", required: "zorunlu", displayNameHelp: "Konuk etiketiyle gösterilir. Aynı adlar aynı kişi anlamına gelmez.", comment: "Yorum", plainTextHelp: "Paragraf sonları içeren düz metin. Markdown veya zengin metin yok.", respect: "Açık ve saygılı ol. Fikir ayrılığına yer var; taciz ve kişisel saldırılara yok.", publishing: "Yayımlanıyor…", publish: "Yorumu yayımla", commentingAs: "Yorum yaptığın ad", accountIdentity: "Hesap kimliğin bts.online tarafından doğrulandı. Açık ve saygılı ol.", profileTitle: "bts.online’da nasıl görünmek istersin?", profileBody: "Görünen adın BTS Account yorumlarını tanımlar. Benzersiz olmak zorunda değildir.", profileSaved: "Görünen ad kaydedildi.", profileHelp: "2–40 karakter. Adlar paylaşılabilir; resmî etiketler ayrılmıştır.", saving: "Kaydediliyor…", saveDisplayName: "Görünen adı kaydet", editTitle: "Yorumunu düzenle", save: "Kaydet", cancel: "İptal", edit: "Düzenle", delete: "Sil", deleteTitle: "Yorumun silinsin mi?", deleteBody: "Bu işlem geri alınamaz. Daha sonra yanıtlar varsa silindi işareti görünür kalır.", deleting: "Siliniyor…", updated: "Yorum güncellendi.", deletedStatus: "Yorum silindi.", errors: { INVALID_INPUT: "Yorumunu kontrol et.", INVALID_REQUEST: "Talep doğrulanamadı.", INVALID_FORM_TOKEN: "Bu formun süresi doldu. Sayfayı yenileyip yeniden dene.", SUBMISSION_TOO_FAST: "Göndermeden önce bir an bekle.", RATE_LIMITED: "Çok fazla yorum gönderildi. Daha sonra yeniden dene.", DUPLICATE: "Bu yorum kısa süre önce zaten gönderildi.", ARTICLE_UNAVAILABLE: "Bu yazı tartışmaya açık değil.", DISCUSSION_CLOSED: "Bu tartışma kapatıldı.", DISCUSSION_DISABLED: "Bu yazıda yorumlar devre dışı.", PROFILE_REQUIRED: "Bu işlem için hesap profilin gerekiyor.", SERVICE_UNAVAILABLE: "Yorumlar geçici olarak kullanılamıyor. Daha sonra yeniden dene.", UNAUTHORIZED: "Bu yorumu yönetmeden önce yeniden giriş yap.", UNAVAILABLE: "Bu yorum artık değiştirilemez.", STALE: "Sayfa açıldığından beri yorum değişti. Yenileyip yeniden dene.", NO_CHANGE: "Kaydetmeden önce bir değişiklik yap.", COOLDOWN: "Yorumu yeniden düzenlemeden önce biraz bekle." } },
  newsletter: { eyebrow: "Bülten / HQ’dan", title: "Bağlantıyı sürdür.", details: "Bülten ayrıntıları" },
};

const pl: WritingDictionary = {
  page: { description: "Eseje i notatki o ludziach, pracy, tworzeniu, życiu i pomysłach.", eyebrow: "Teksty / Notatki terenowe", title: "Myśli, które\nwarto zachować.", introduction: "Myśli o pracy, tożsamości, odwadze i historiach, które opowiadamy o sobie.", featured: "Wyróżniony tekst", readArticle: "Czytaj artykuł", firstTitle: "Pierwszy tekst nabiera kształtu.", firstBody: "Pierwsze eseje i notatki powstają w BTS Studio.", latest: "Najnowsze teksty", readingTime: "min czytania" },
  article: { breadcrumb: "Okruszki nawigacyjne", contentLabel: "Treść artykułu", back: "Wróć do tekstów", minRead: "min czytania", sourceNotice: "Ten artykuł opublikowano wyłącznie w języku oryginału. Nawigacja i funkcje systemowe działają w wybranym języku.", availableIn: "Artykuł dostępny w języku" },
  discussion: { eyebrow: "Dyskusja", title: "Rozwiń tę myśl.", principle: "Różnica zdań jest mile widziana. Brak szacunku — nie.", unavailableTitle: "Komentarze są chwilowo niedostępne.", unavailableBody: "Artykuł pozostaje dostępny, gdy usługa dyskusji wraca do działania.", emptyTitle: "Nie ma jeszcze komentarzy.", emptyBody: "Rozpocznij dyskusję przemyślaną odpowiedzią.", closedTitle: "Dyskusja zamknięta.", closedBody: "Dotychczasowe komentarze pozostają widoczne, ale nowe nie są przyjmowane.", submissionUnavailable: "Dodawanie komentarzy jest chwilowo niedostępne.", publishedComments: "Opublikowane komentarze", deleted: "Komentarz usunięty przez autora.", guest: "Gość", author: "Autor", edited: "edytowano", secureUnavailable: "Bezpieczne dodawanie komentarzy jest chwilowo niedostępne.", secureAccountUnavailable: "Bezpieczne komentowanie z kontem jest chwilowo niedostępne.", publishedTitle: "Komentarz opublikowany.", publishedBody: "Dziękujemy za udział w dyskusji.", displayName: "Wyświetlana nazwa", required: "wymagane", displayNameHelp: "Wyświetlana z etykietą Gość. Takie same nazwy nie oznaczają tej samej osoby.", comment: "Komentarz", plainTextHelp: "Zwykły tekst z podziałem na akapity. Bez Markdown i formatowania rozszerzonego.", respect: "Pisz wprost i z szacunkiem. Różnica zdań jest mile widziana; nękanie i ataki osobiste — nie.", publishing: "Publikowanie…", publish: "Opublikuj komentarz", commentingAs: "Komentujesz jako", accountIdentity: "Tożsamość Twojego konta została zweryfikowana przez bts.online. Pisz wprost i z szacunkiem.", profileTitle: "Jak chcesz być widoczny na bts.online?", profileBody: "Wyświetlana nazwa identyfikuje komentarze z BTS Account. Nie musi być unikalna.", profileSaved: "Wyświetlana nazwa zapisana.", profileHelp: "2–40 znaków. Nazwy mogą się powtarzać; oficjalne oznaczenia są zastrzeżone.", saving: "Zapisywanie…", saveDisplayName: "Zapisz wyświetlaną nazwę", editTitle: "Edytuj komentarz", save: "Zapisz", cancel: "Anuluj", edit: "Edytuj", delete: "Usuń", deleteTitle: "Usunąć komentarz?", deleteBody: "Tej operacji nie można cofnąć. Jeśli pojawią się odpowiedzi, pozostanie widoczna informacja o usunięciu.", deleting: "Usuwanie…", updated: "Komentarz zaktualizowany.", deletedStatus: "Komentarz usunięty.", errors: { INVALID_INPUT: "Sprawdź komentarz.", INVALID_REQUEST: "Nie udało się zweryfikować żądania.", INVALID_FORM_TOKEN: "Formularz wygasł. Odśwież stronę i spróbuj ponownie.", SUBMISSION_TOO_FAST: "Odczekaj chwilę przed wysłaniem.", RATE_LIMITED: "Wysłano zbyt wiele komentarzy. Spróbuj ponownie później.", DUPLICATE: "Ten komentarz został już niedawno wysłany.", ARTICLE_UNAVAILABLE: "Ten artykuł nie jest dostępny do dyskusji.", DISCUSSION_CLOSED: "Ta dyskusja została zamknięta.", DISCUSSION_DISABLED: "Komentarze pod tym artykułem są wyłączone.", PROFILE_REQUIRED: "Do tej czynności potrzebny jest profil konta.", SERVICE_UNAVAILABLE: "Komentarze są chwilowo niedostępne. Spróbuj ponownie później.", UNAUTHORIZED: "Zaloguj się ponownie, zanim zaczniesz zarządzać komentarzem.", UNAVAILABLE: "Tego komentarza nie można już zmienić.", STALE: "Komentarz zmienił się od wczytania strony. Odśwież i spróbuj ponownie.", NO_CHANGE: "Wprowadź zmianę przed zapisaniem.", COOLDOWN: "Odczekaj chwilę przed kolejną edycją komentarza." } },
  newsletter: { eyebrow: "Newsletter / Z HQ", title: "Nie zgub głównego wątku.", details: "Szczegóły newslettera" },
};

const el: WritingDictionary = {
  page: { description: "Δοκίμια και σημειώσεις για ανθρώπους, εργασία, δημιουργία, ζωή και ιδέες.", eyebrow: "Κείμενα / Σημειώσεις πεδίου", title: "Σκέψεις που\nαξίζει να μείνουν.", introduction: "Σκέψεις για την εργασία, την ταυτότητα, το θάρρος και τις ιστορίες που λέμε για τον εαυτό μας.", featured: "Επιλεγμένο κείμενο", readArticle: "Διάβασε το άρθρο", firstTitle: "Το πρώτο κείμενο παίρνει μορφή.", firstBody: "Τα πρώτα δοκίμια και οι σημειώσεις ετοιμάζονται στο BTS Studio.", latest: "Νεότερα κείμενα", readingTime: "λεπτά ανάγνωσης" },
  article: { breadcrumb: "Διαδρομή πλοήγησης", contentLabel: "Περιεχόμενο άρθρου", back: "Επιστροφή στα κείμενα", minRead: "λεπτά ανάγνωσης", sourceNotice: "Το άρθρο έχει δημοσιευτεί μόνο στην πρωτότυπη γλώσσα του. Η πλοήγηση και οι λειτουργίες του συστήματος ακολουθούν τη γλώσσα που επέλεξες.", availableIn: "Το άρθρο είναι διαθέσιμο στα" },
  discussion: { eyebrow: "Συζήτηση", title: "Συνέχισε τη σκέψη.", principle: "Η διαφωνία είναι ευπρόσδεκτη. Η ασέβεια όχι.", unavailableTitle: "Τα σχόλια δεν είναι προσωρινά διαθέσιμα.", unavailableBody: "Το άρθρο παραμένει διαθέσιμο όσο αποκαθίσταται η υπηρεσία συζήτησης.", emptyTitle: "Δεν υπάρχουν ακόμη σχόλια.", emptyBody: "Ξεκίνα τη συζήτηση με μια προσεγμένη απάντηση.", closedTitle: "Η συζήτηση έκλεισε.", closedBody: "Τα υπάρχοντα σχόλια παραμένουν ορατά, αλλά δεν γίνονται δεκτά νέα.", submissionUnavailable: "Η υποβολή σχολίων δεν είναι προσωρινά διαθέσιμη.", publishedComments: "Δημοσιευμένα σχόλια", deleted: "Το σχόλιο διαγράφηκε από τον συντάκτη του.", guest: "Επισκέπτης", author: "Συντάκτης", edited: "επεξεργασμένο", secureUnavailable: "Η ασφαλής υποβολή σχολίων δεν είναι προσωρινά διαθέσιμη.", secureAccountUnavailable: "Ο ασφαλής σχολιασμός με λογαριασμό δεν είναι προσωρινά διαθέσιμος.", publishedTitle: "Το σχόλιο δημοσιεύτηκε.", publishedBody: "Ευχαριστούμε για τη συμμετοχή στη συζήτηση.", displayName: "Εμφανιζόμενο όνομα", required: "υποχρεωτικό", displayNameHelp: "Εμφανίζεται με την ένδειξη Επισκέπτης. Ίδια ονόματα δεν σημαίνουν το ίδιο πρόσωπο.", comment: "Σχόλιο", plainTextHelp: "Απλό κείμενο με αλλαγές παραγράφων. Χωρίς Markdown ή εμπλουτισμένη μορφοποίηση.", respect: "Μίλα άμεσα και με σεβασμό. Η διαφωνία είναι ευπρόσδεκτη· η παρενόχληση και οι προσωπικές επιθέσεις όχι.", publishing: "Δημοσίευση…", publish: "Δημοσίευση σχολίου", commentingAs: "Σχολιάζεις ως", accountIdentity: "Η ταυτότητα του λογαριασμού σου έχει επαληθευτεί από το bts.online. Μίλα άμεσα και με σεβασμό.", profileTitle: "Πώς θέλεις να εμφανίζεσαι στο bts.online;", profileBody: "Το εμφανιζόμενο όνομα προσδιορίζει τα σχόλια του BTS Account σου. Δεν χρειάζεται να είναι μοναδικό.", profileSaved: "Το εμφανιζόμενο όνομα αποθηκεύτηκε.", profileHelp: "2–40 χαρακτήρες. Τα ονόματα μπορεί να επαναλαμβάνονται· οι επίσημες ενδείξεις είναι δεσμευμένες.", saving: "Αποθήκευση…", saveDisplayName: "Αποθήκευση ονόματος", editTitle: "Επεξεργασία σχολίου", save: "Αποθήκευση", cancel: "Ακύρωση", edit: "Επεξεργασία", delete: "Διαγραφή", deleteTitle: "Να διαγραφεί το σχόλιό σου;", deleteBody: "Η ενέργεια δεν αναιρείται. Αν υπάρξουν απαντήσεις, θα παραμείνει ορατή ένδειξη διαγραφής.", deleting: "Διαγραφή…", updated: "Το σχόλιο ενημερώθηκε.", deletedStatus: "Το σχόλιο διαγράφηκε.", errors: { INVALID_INPUT: "Έλεγξε το σχόλιό σου.", INVALID_REQUEST: "Το αίτημα δεν μπόρεσε να επαληθευτεί.", INVALID_FORM_TOKEN: "Η φόρμα έχει λήξει. Ανανέωσε τη σελίδα και δοκίμασε ξανά.", SUBMISSION_TOO_FAST: "Περίμενε λίγο πριν την υποβολή.", RATE_LIMITED: "Υποβλήθηκαν πάρα πολλά σχόλια. Δοκίμασε ξανά αργότερα.", DUPLICATE: "Αυτό το σχόλιο υποβλήθηκε ήδη πρόσφατα.", ARTICLE_UNAVAILABLE: "Αυτό το άρθρο δεν είναι διαθέσιμο για συζήτηση.", DISCUSSION_CLOSED: "Αυτή η συζήτηση έχει κλείσει.", DISCUSSION_DISABLED: "Τα σχόλια είναι απενεργοποιημένα για αυτό το άρθρο.", PROFILE_REQUIRED: "Απαιτείται το προφίλ λογαριασμού σου για αυτή την ενέργεια.", SERVICE_UNAVAILABLE: "Τα σχόλια δεν είναι προσωρινά διαθέσιμα. Δοκίμασε ξανά αργότερα.", UNAUTHORIZED: "Συνδέσου ξανά πριν διαχειριστείς το σχόλιο.", UNAVAILABLE: "Αυτό το σχόλιο δεν μπορεί πλέον να αλλάξει.", STALE: "Το σχόλιο άλλαξε από τότε που φορτώθηκε η σελίδα. Ανανέωσε και δοκίμασε ξανά.", NO_CHANGE: "Κάνε μια αλλαγή πριν την αποθήκευση.", COOLDOWN: "Περίμενε λίγο πριν επεξεργαστείς ξανά το σχόλιο." } },
  newsletter: { eyebrow: "Newsletter / Από το HQ", title: "Κράτησε το νήμα.", details: "Πληροφορίες newsletter" },
};

const ru: WritingDictionary = {
  page: { description: "Эссе и заметки о людях, работе, создании нового, жизни и идеях.", eyebrow: "Тексты / Полевые заметки", title: "Мысли, которые\nстоит сохранить.", introduction: "Мысли о работе, идентичности, смелости и историях, которые мы рассказываем о себе.", featured: "Избранный текст", readArticle: "Читать статью", firstTitle: "Первый текст обретает форму.", firstBody: "Первые эссе и заметки готовятся в BTS Studio.", latest: "Новые тексты", readingTime: "мин чтения" },
  article: { breadcrumb: "Навигационная цепочка", contentLabel: "Содержание статьи", back: "Назад к текстам", minRead: "мин чтения", sourceNotice: "Статья опубликована только на языке оригинала. Навигация и системные функции работают на выбранном вами языке.", availableIn: "Статья доступна на языке" },
  discussion: { eyebrow: "Обсуждение", title: "Продолжить мысль.", principle: "Несогласие приветствуется. Неуважение — нет.", unavailableTitle: "Комментарии временно недоступны.", unavailableBody: "Статья остаётся доступной, пока сервис обсуждений восстанавливается.", emptyTitle: "Комментариев пока нет.", emptyBody: "Начните обсуждение с вдумчивого ответа.", closedTitle: "Обсуждение закрыто.", closedBody: "Существующие комментарии видны, но новые больше не принимаются.", submissionUnavailable: "Отправка комментариев временно недоступна.", publishedComments: "Опубликованные комментарии", deleted: "Комментарий удалён автором.", guest: "Гость", author: "Автор", edited: "изменено", secureUnavailable: "Безопасная отправка комментариев временно недоступна.", secureAccountUnavailable: "Безопасные комментарии через аккаунт временно недоступны.", publishedTitle: "Комментарий опубликован.", publishedBody: "Спасибо за участие в обсуждении.", displayName: "Отображаемое имя", required: "обязательно", displayNameHelp: "Показывается с отметкой «Гость». Совпадающие имена не означают одного человека.", comment: "Комментарий", plainTextHelp: "Обычный текст с разделением на абзацы. Без Markdown и расширенного форматирования.", respect: "Говорите прямо и уважительно. Несогласие приветствуется; травля и личные нападки — нет.", publishing: "Публикация…", publish: "Опубликовать комментарий", commentingAs: "Вы комментируете как", accountIdentity: "Личность вашего аккаунта подтверждена bts.online. Говорите прямо и уважительно.", profileTitle: "Как вы хотите отображаться на bts.online?", profileBody: "Отображаемое имя обозначает комментарии вашего BTS Account. Оно не обязано быть уникальным.", profileSaved: "Отображаемое имя сохранено.", profileHelp: "2–40 символов. Имена могут повторяться; официальные обозначения зарезервированы.", saving: "Сохранение…", saveDisplayName: "Сохранить имя", editTitle: "Редактировать комментарий", save: "Сохранить", cancel: "Отмена", edit: "Изменить", delete: "Удалить", deleteTitle: "Удалить комментарий?", deleteBody: "Это действие нельзя отменить. Если позже появятся ответы, останется отметка об удалении.", deleting: "Удаление…", updated: "Комментарий обновлён.", deletedStatus: "Комментарий удалён.", errors: { INVALID_INPUT: "Проверьте комментарий.", INVALID_REQUEST: "Не удалось проверить запрос.", INVALID_FORM_TOKEN: "Срок действия формы истёк. Обновите страницу и попробуйте снова.", SUBMISSION_TOO_FAST: "Подождите немного перед отправкой.", RATE_LIMITED: "Отправлено слишком много комментариев. Повторите попытку позже.", DUPLICATE: "Этот комментарий уже был недавно отправлен.", ARTICLE_UNAVAILABLE: "Эта статья недоступна для обсуждения.", DISCUSSION_CLOSED: "Обсуждение закрыто.", DISCUSSION_DISABLED: "Комментарии к этой статье отключены.", PROFILE_REQUIRED: "Для этого действия требуется профиль аккаунта.", SERVICE_UNAVAILABLE: "Комментарии временно недоступны. Повторите попытку позже.", UNAUTHORIZED: "Войдите снова, прежде чем управлять комментарием.", UNAVAILABLE: "Этот комментарий больше нельзя изменить.", STALE: "Комментарий изменился после загрузки страницы. Обновите её и попробуйте снова.", NO_CHANGE: "Внесите изменение перед сохранением.", COOLDOWN: "Подождите немного перед повторным редактированием комментария." } },
  newsletter: { eyebrow: "Рассылка / Из HQ", title: "Не теряйте главную нить.", details: "О рассылке" },
};

export const writingDictionaries = { de, en, es, tr, pl, el, ru } as const satisfies Record<Locale, WritingDictionary>;
export function getWritingDictionary(locale: Locale): WritingDictionary { return writingDictionaries[locale]; }
