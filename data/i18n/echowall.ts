import type { Locale } from "@/lib/i18n/config";

const de = {
  page: {
    description: "Gedanken, Feedback, Reaktionen und Nachrichten aus der Community von bts.online — kuratiert und moderiert.",
    eyebrow: "EchoWall / Signal aus der Community",
    title: "Hinterlasse ein\nEcho.",
    intro: "Ein Ort für Gedanken, Feedback, Reaktionen und Nachrichten von Menschen, die bts.online besuchen und mitgestalten.",
    moderationLabel: "Bewusst moderiert",
    moderationTitle: "Jedes Signal wird geprüft, bevor es öffentlich wird.",
    moderationBody: "Jedes Echo wird vor der Veröffentlichung geprüft. Beiträge erscheinen nicht unmittelbar öffentlich.",
    wallLabel: "Öffentliche Wand / kuratiert",
    wallTitle: "Echos, die weitergetragen werden dürfen.",
    wallBody: "Hier erscheinen ausschließlich geprüfte und freigegebene Beiträge — in der Reihenfolge ihrer Veröffentlichung.",
    emptyTitle: "Die Wand ist noch still.",
    emptyBody: "Die ersten Echos werden gesammelt und moderiert. Du kannst bereits eine Nachricht hinterlassen und Teil der entstehenden Community-Wand werden.",
    first: "Das erste Echo hinterlassen",
    unavailableTitle: "Die öffentliche Wand ist vorübergehend nicht verfügbar.",
    unavailableBody: "Öffentliche Echos können gerade nicht geladen werden. Eine neue Nachricht kannst du weiterhin über das Formular einreichen.",
    signalLabel: "Ein Signal hinterlassen",
    signalAside: "Persönlich, respektvoll und bewusst kurz. Dein Echo wird nicht sofort veröffentlicht.",
    formTitle: "Bring deine Stimme an die Wand.",
    formBody: "Teile einen Gedanken, eine Reaktion, Feedback oder eine Nachricht. Alle Einreichungen werden vor einer möglichen Veröffentlichung moderiert.",
    privacyTitle: "Was nach dem Absenden passiert.",
    privacyLabel: "Datenschutz / Moderation",
    privacyBody: "Dein Echo wird gespeichert und moderiert. Es erscheint nur nach einer Freigabe. Eine optionale E-Mail-Adresse bleibt privat. Eine spätere Löschung kann über die einmalige Löschreferenz oder eine verifizierte E-Mail-Adresse angefragt werden.",
    back: "Zurück zum Digital HQ",
  },
  form: {
    unavailableTitle: "Einreichungen sind vorübergehend nicht verfügbar.",
    unavailableBody: "Das Formular konnte nicht sicher vorbereitet werden. Bitte versuche es später erneut.",
    receivedLabel: "Einreichung erhalten",
    receivedTitle: "Dein Echo hat die Wand erreicht.",
    receivedBody: "Deine Nachricht wurde gespeichert und wartet auf Moderation. Sie erscheint erst nach einer Freigabe öffentlich.",
    deletionReference: "Deine einmalige Löschreferenz",
    deletionHelp: "Bitte sicher speichern und nicht öffentlich teilen. Diese Referenz wird später für eine Löschanfrage benötigt und kann nicht erneut angezeigt werden.",
    copy: "Referenz kopieren",
    copied: "Referenz kopiert.",
    copyFailed: "Kopieren nicht möglich. Bitte markiere die Referenz manuell.",
    another: "Ein weiteres Echo hinterlassen",
    displayName: "Anzeigename",
    required: "erforderlich",
    displayHelp: "Dein Name oder ein frei gewähltes Pseudonym, 2–40 Zeichen.",
    category: "Kategorie",
    optional: "optional",
    categoryHelp: "Hilft dabei, dein Echo später einzuordnen.",
    noCategory: "Keine Kategorie",
    categories: { thought: "Gedanke", feedback: "Feedback", reaction: "Reaktion", message: "Nachricht" },
    message: "Nachricht",
    messageHelp: "10–500 Zeichen, nur Klartext. Links sind nicht erlaubt.",
    email: "E-Mail-Adresse",
    privateOptional: "optional und privat",
    emailHelp: "Wird nicht öffentlich angezeigt und nur getrennt vom Echo gespeichert.",
    consent: "Ich stimme zu, dass mein Echo zur Prüfung gespeichert und nach einer Freigabe mit meinem angegebenen Anzeigenamen öffentlich auf bts.online veröffentlicht werden darf. Eine optionale E-Mail-Adresse bleibt privat.",
    consentHelp: "Eine spätere Löschung kann über die einmalige Löschreferenz oder eine verifizierte E-Mail-Adresse angefragt werden.",
    submitting: "Wird gesendet…",
    submit: "Echo senden",
    errors: {
      INVALID_INPUT: "Bitte überprüfe deine Eingaben.", INVALID_REQUEST: "Die Anfrage konnte nicht verarbeitet werden.", INVALID_FORM_TOKEN: "Das Formular ist abgelaufen. Bitte lade die Seite neu.", SUBMISSION_TOO_FAST: "Das Formular wurde zu schnell abgeschickt. Bitte warte einen Moment.", RATE_LIMITED: "Zu viele Einreichungen. Bitte versuche es später erneut.", DUPLICATE: "Diese Nachricht wurde kürzlich bereits übermittelt.", SERVICE_UNAVAILABLE: "EchoWall ist derzeit nicht verfügbar. Bitte versuche es später erneut.",
    },
  },
} as const;

type Widen<T> = { [K in keyof T]: T[K] extends string ? string : T[K] extends Record<string, unknown> ? Widen<T[K]> : T[K] };
export type EchoDictionary = Widen<typeof de>;

const en: EchoDictionary = {
  page: {
    description: "Thoughts, feedback, reactions and messages from the bts.online community — curated and moderated.",
    eyebrow: "EchoWall / Community signal",
    title: "Leave an\necho.",
    intro: "A place for thoughts, feedback, reactions and messages from people who visit and help shape bts.online.",
    moderationLabel: "Moderated by design",
    moderationTitle: "Every signal is reviewed before it becomes public.",
    moderationBody: "Every echo is reviewed before publication. Submissions never appear publicly straight away.",
    wallLabel: "Public wall / curated",
    wallTitle: "Echoes worth carrying forward.",
    wallBody: "Only reviewed and approved submissions appear here, in publication order.",
    emptyTitle: "The wall is still quiet.",
    emptyBody: "The first echoes are being collected and moderated. You can already leave a message and become part of the emerging community wall.",
    first: "Leave the first echo",
    unavailableTitle: "The public wall is temporarily unavailable.",
    unavailableBody: "Public echoes cannot be loaded right now. You can still submit a new message through the form.",
    signalLabel: "Leave a signal",
    signalAside: "Personal, respectful and deliberately brief. Your echo will not be published immediately.",
    formTitle: "Add your voice to the wall.",
    formBody: "Share a thought, a reaction, feedback or a message. Every submission is moderated before it may be published.",
    privacyTitle: "What happens after submission.",
    privacyLabel: "Privacy / moderation",
    privacyBody: "Your echo is stored and moderated. It appears only after approval. An optional email address remains private. You can later request deletion with the one-time deletion reference or a verified email address.",
    back: "Back to the Digital HQ",
  },
  form: {
    unavailableTitle: "Submissions are temporarily unavailable.",
    unavailableBody: "The form could not be prepared securely. Please try again later.",
    receivedLabel: "Submission received",
    receivedTitle: "Your echo reached the wall.",
    receivedBody: "Your message has been stored and is waiting for moderation. It will appear publicly only after approval.",
    deletionReference: "Your one-time deletion reference",
    deletionHelp: "Store this securely and do not share it publicly. You will need it for a future deletion request, and it cannot be shown again.",
    copy: "Copy reference",
    copied: "Reference copied.",
    copyFailed: "Could not copy. Please select the reference manually.",
    another: "Leave another echo",
    displayName: "Display name",
    required: "required",
    displayHelp: "Your name or a chosen pseudonym, 2–40 characters.",
    category: "Category",
    optional: "optional",
    categoryHelp: "Helps place your echo in context later.",
    noCategory: "No category",
    categories: { thought: "Thought", feedback: "Feedback", reaction: "Reaction", message: "Message" },
    message: "Message",
    messageHelp: "10–500 characters, plain text only. Links are not allowed.",
    email: "Email address",
    privateOptional: "optional and private",
    emailHelp: "Never shown publicly and stored separately from the echo.",
    consent: "I agree that my echo may be stored for review and, after approval, published publicly on bts.online with the display name I provided. An optional email address remains private.",
    consentHelp: "You can later request deletion with the one-time deletion reference or a verified email address.",
    submitting: "Submitting…",
    submit: "Submit echo",
    errors: {
      INVALID_INPUT: "Please review your entries.", INVALID_REQUEST: "The request could not be processed.", INVALID_FORM_TOKEN: "The form has expired. Reload the page and try again.", SUBMISSION_TOO_FAST: "The form was submitted too quickly. Please wait a moment.", RATE_LIMITED: "Too many submissions. Please try again later.", DUPLICATE: "This message was submitted recently already.", SERVICE_UNAVAILABLE: "EchoWall is currently unavailable. Please try again later.",
    },
  },
};

const es: EchoDictionary = {
  page: { description: "Ideas, comentarios, reacciones y mensajes de la comunidad de bts.online, seleccionados y moderados.", eyebrow: "EchoWall / Señal de la comunidad", title: "Deja un\neco.", intro: "Un espacio para ideas, comentarios, reacciones y mensajes de quienes visitan y ayudan a dar forma a bts.online.", moderationLabel: "Moderación consciente", moderationTitle: "Cada señal se revisa antes de hacerse pública.", moderationBody: "Cada eco se revisa antes de publicarse. Las aportaciones nunca aparecen de inmediato.", wallLabel: "Muro público / seleccionado", wallTitle: "Ecos que merece la pena compartir.", wallBody: "Aquí solo aparecen aportaciones revisadas y aprobadas, por orden de publicación.", emptyTitle: "El muro sigue en silencio.", emptyBody: "Los primeros ecos se están recopilando y moderando. Ya puedes dejar un mensaje y formar parte del muro que está naciendo.", first: "Dejar el primer eco", unavailableTitle: "El muro público no está disponible temporalmente.", unavailableBody: "Ahora mismo no se pueden cargar los ecos públicos. Aun así, puedes enviar un mensaje nuevo mediante el formulario.", signalLabel: "Dejar una señal", signalAside: "Personal, respetuosa y deliberadamente breve. Tu eco no se publicará de inmediato.", formTitle: "Suma tu voz al muro.", formBody: "Comparte una idea, una reacción, un comentario o un mensaje. Cada aportación se modera antes de una posible publicación.", privacyLabel: "Privacidad / moderación", privacyTitle: "Qué ocurre después de enviarlo.", privacyBody: "Tu eco se guarda y modera. Solo aparece tras su aprobación. El correo opcional permanece privado. Después puedes solicitar su eliminación con la referencia única o un correo verificado.", back: "Volver al Digital HQ" },
  form: { unavailableTitle: "Los envíos no están disponibles temporalmente.", unavailableBody: "El formulario no se pudo preparar de forma segura. Inténtalo más tarde.", receivedLabel: "Envío recibido", receivedTitle: "Tu eco ha llegado al muro.", receivedBody: "Tu mensaje se ha guardado y espera moderación. Solo aparecerá públicamente después de su aprobación.", deletionReference: "Tu referencia única de eliminación", deletionHelp: "Guárdala de forma segura y no la compartas públicamente. La necesitarás para una futura solicitud de eliminación y no volverá a mostrarse.", copy: "Copiar referencia", copied: "Referencia copiada.", copyFailed: "No se pudo copiar. Selecciona la referencia manualmente.", another: "Dejar otro eco", displayName: "Nombre visible", required: "obligatorio", displayHelp: "Tu nombre o un seudónimo, entre 2 y 40 caracteres.", category: "Categoría", optional: "opcional", categoryHelp: "Ayuda a situar tu eco en contexto.", noCategory: "Sin categoría", categories: { thought: "Idea", feedback: "Comentario", reaction: "Reacción", message: "Mensaje" }, message: "Mensaje", messageHelp: "Entre 10 y 500 caracteres, solo texto. No se permiten enlaces.", email: "Dirección de correo", privateOptional: "opcional y privada", emailHelp: "No se muestra públicamente y se guarda por separado del eco.", consent: "Acepto que mi eco se guarde para revisión y, tras aprobarse, se publique en bts.online con el nombre visible que he indicado. El correo opcional permanece privado.", consentHelp: "Después puedes solicitar su eliminación con la referencia única o un correo verificado.", submitting: "Enviando…", submit: "Enviar eco", errors: { INVALID_INPUT: "Revisa los datos introducidos.", INVALID_REQUEST: "No se pudo procesar la solicitud.", INVALID_FORM_TOKEN: "El formulario ha caducado. Recarga la página.", SUBMISSION_TOO_FAST: "El formulario se envió demasiado rápido. Espera un momento.", RATE_LIMITED: "Demasiados envíos. Inténtalo más tarde.", DUPLICATE: "Este mensaje ya se envió hace poco.", SERVICE_UNAVAILABLE: "EchoWall no está disponible ahora mismo. Inténtalo más tarde." } },
};

const tr: EchoDictionary = {
  page: { description: "bts.online topluluğundan düşünceler, geri bildirimler, tepkiler ve mesajlar — seçilmiş ve moderasyondan geçmiş.", eyebrow: "EchoWall / Topluluk sinyali", title: "Bir yankı\nbırak.", intro: "bts.online’ı ziyaret eden ve şekillendirmeye katkı sunan insanların düşünceleri, geri bildirimleri, tepkileri ve mesajları için bir alan.", moderationLabel: "Özenli moderasyon", moderationTitle: "Her sinyal herkese açılmadan önce incelenir.", moderationBody: "Her yankı yayımlanmadan önce incelenir. Gönderiler hiçbir zaman anında görünmez.", wallLabel: "Herkese açık duvar / seçilmiş", wallTitle: "İleri taşımaya değer yankılar.", wallBody: "Burada yalnızca incelenip onaylanan gönderiler, yayımlanma sırasıyla görünür.", emptyTitle: "Duvar hâlâ sessiz.", emptyBody: "İlk yankılar toplanıyor ve inceleniyor. Şimdiden bir mesaj bırakıp oluşan topluluk duvarının parçası olabilirsin.", first: "İlk yankıyı bırak", unavailableTitle: "Herkese açık duvar geçici olarak kullanılamıyor.", unavailableBody: "Yankılar şu anda yüklenemiyor. Form üzerinden yeni bir mesaj göndermeye devam edebilirsin.", signalLabel: "Bir sinyal bırak", signalAside: "Kişisel, saygılı ve bilinçli biçimde kısa. Yankın hemen yayımlanmaz.", formTitle: "Sesini duvara ekle.", formBody: "Bir düşünce, tepki, geri bildirim veya mesaj paylaş. Her gönderi yayımlanmadan önce moderasyondan geçer.", privacyLabel: "Gizlilik / moderasyon", privacyTitle: "Gönderdikten sonra ne olur?", privacyBody: "Yankın saklanır ve incelenir. Yalnızca onaydan sonra görünür. İsteğe bağlı e-posta adresin gizli kalır. Daha sonra tek kullanımlık silme referansı veya doğrulanmış e-posta ile silme talep edebilirsin.", back: "Digital HQ’ya dön" },
  form: { unavailableTitle: "Gönderimler geçici olarak kullanılamıyor.", unavailableBody: "Form güvenli biçimde hazırlanamadı. Daha sonra yeniden dene.", receivedLabel: "Gönderim alındı", receivedTitle: "Yankın duvara ulaştı.", receivedBody: "Mesajın saklandı ve moderasyon bekliyor. Yalnızca onaydan sonra herkese açık görünür.", deletionReference: "Tek kullanımlık silme referansın", deletionHelp: "Bunu güvenle sakla ve herkese açık paylaşma. İleride silme talebi için gerekecek ve yeniden gösterilemez.", copy: "Referansı kopyala", copied: "Referans kopyalandı.", copyFailed: "Kopyalanamadı. Referansı elle seç.", another: "Başka bir yankı bırak", displayName: "Görünen ad", required: "zorunlu", displayHelp: "Adın veya seçtiğin bir takma ad, 2–40 karakter.", category: "Kategori", optional: "isteğe bağlı", categoryHelp: "Yankını daha sonra bağlamına yerleştirmeye yardımcı olur.", noCategory: "Kategori yok", categories: { thought: "Düşünce", feedback: "Geri bildirim", reaction: "Tepki", message: "Mesaj" }, message: "Mesaj", messageHelp: "10–500 karakter, yalnızca düz metin. Bağlantılara izin verilmez.", email: "E-posta adresi", privateOptional: "isteğe bağlı ve gizli", emailHelp: "Herkese açık gösterilmez ve yankıdan ayrı saklanır.", consent: "Yankımın incelenmek üzere saklanmasını ve onaydan sonra verdiğim görünen adla bts.online’da herkese açık yayımlanmasını kabul ediyorum. İsteğe bağlı e-posta adresim gizli kalır.", consentHelp: "Daha sonra tek kullanımlık silme referansı veya doğrulanmış e-posta ile silme talep edebilirsin.", submitting: "Gönderiliyor…", submit: "Yankıyı gönder", errors: { INVALID_INPUT: "Girdilerini kontrol et.", INVALID_REQUEST: "Talep işlenemedi.", INVALID_FORM_TOKEN: "Formun süresi doldu. Sayfayı yenile.", SUBMISSION_TOO_FAST: "Form çok hızlı gönderildi. Bir an bekle.", RATE_LIMITED: "Çok fazla gönderim yapıldı. Daha sonra yeniden dene.", DUPLICATE: "Bu mesaj kısa süre önce zaten gönderildi.", SERVICE_UNAVAILABLE: "EchoWall şu anda kullanılamıyor. Daha sonra yeniden dene." } },
};

const pl: EchoDictionary = {
  page: { description: "Myśli, opinie, reakcje i wiadomości społeczności bts.online — wybrane i moderowane.", eyebrow: "EchoWall / Sygnał społeczności", title: "Zostaw\necho.", intro: "Miejsce na myśli, opinie, reakcje i wiadomości osób, które odwiedzają i współtworzą bts.online.", moderationLabel: "Świadoma moderacja", moderationTitle: "Każdy sygnał jest sprawdzany przed publikacją.", moderationBody: "Każde echo jest sprawdzane przed publikacją. Wpisy nigdy nie pojawiają się od razu.", wallLabel: "Publiczna ściana / wybrane", wallTitle: "Echa, które warto przekazać dalej.", wallBody: "Pojawiają się tu tylko sprawdzone i zatwierdzone wpisy, w kolejności publikacji.", emptyTitle: "Ściana jest jeszcze cicha.", emptyBody: "Pierwsze echa są zbierane i moderowane. Możesz już zostawić wiadomość i stać się częścią powstającej ściany społeczności.", first: "Zostaw pierwsze echo", unavailableTitle: "Publiczna ściana jest chwilowo niedostępna.", unavailableBody: "Nie można teraz wczytać publicznych wpisów. Nadal możesz przesłać nową wiadomość przez formularz.", signalLabel: "Zostaw sygnał", signalAside: "Osobiście, z szacunkiem i świadomie krótko. Twoje echo nie zostanie opublikowane od razu.", formTitle: "Dodaj swój głos do ściany.", formBody: "Podziel się myślą, reakcją, opinią lub wiadomością. Każdy wpis przechodzi moderację przed ewentualną publikacją.", privacyLabel: "Prywatność / moderacja", privacyTitle: "Co dzieje się po wysłaniu?", privacyBody: "Echo jest zapisywane i moderowane. Pojawi się dopiero po zatwierdzeniu. Opcjonalny e-mail pozostaje prywatny. Później możesz poprosić o usunięcie za pomocą jednorazowego kodu lub zweryfikowanego adresu.", back: "Wróć do Digital HQ" },
  form: { unavailableTitle: "Wysyłanie jest chwilowo niedostępne.", unavailableBody: "Nie udało się bezpiecznie przygotować formularza. Spróbuj ponownie później.", receivedLabel: "Wpis otrzymany", receivedTitle: "Twoje echo dotarło do ściany.", receivedBody: "Wiadomość została zapisana i czeka na moderację. Pojawi się publicznie dopiero po zatwierdzeniu.", deletionReference: "Jednorazowy kod usunięcia", deletionHelp: "Przechowuj go bezpiecznie i nie udostępniaj publicznie. Będzie potrzebny do przyszłej prośby o usunięcie i nie zostanie pokazany ponownie.", copy: "Kopiuj kod", copied: "Kod skopiowany.", copyFailed: "Nie udało się skopiować. Zaznacz kod ręcznie.", another: "Zostaw kolejne echo", displayName: "Wyświetlana nazwa", required: "wymagane", displayHelp: "Twoje imię lub wybrany pseudonim, 2–40 znaków.", category: "Kategoria", optional: "opcjonalne", categoryHelp: "Pomaga później umieścić echo w kontekście.", noCategory: "Bez kategorii", categories: { thought: "Myśl", feedback: "Opinia", reaction: "Reakcja", message: "Wiadomość" }, message: "Wiadomość", messageHelp: "10–500 znaków, tylko zwykły tekst. Linki są niedozwolone.", email: "Adres e-mail", privateOptional: "opcjonalny i prywatny", emailHelp: "Nie jest pokazywany publicznie i jest przechowywany oddzielnie od echa.", consent: "Zgadzam się na zapisanie mojego echa do sprawdzenia i, po zatwierdzeniu, publiczne opublikowanie go na bts.online z podaną nazwą. Opcjonalny adres e-mail pozostaje prywatny.", consentHelp: "Później możesz poprosić o usunięcie za pomocą jednorazowego kodu lub zweryfikowanego adresu.", submitting: "Wysyłanie…", submit: "Wyślij echo", errors: { INVALID_INPUT: "Sprawdź wprowadzone dane.", INVALID_REQUEST: "Nie udało się przetworzyć żądania.", INVALID_FORM_TOKEN: "Formularz wygasł. Odśwież stronę.", SUBMISSION_TOO_FAST: "Formularz wysłano zbyt szybko. Odczekaj chwilę.", RATE_LIMITED: "Zbyt wiele zgłoszeń. Spróbuj ponownie później.", DUPLICATE: "Ta wiadomość została już niedawno wysłana.", SERVICE_UNAVAILABLE: "EchoWall jest teraz niedostępny. Spróbuj ponownie później." } },
};

const el: EchoDictionary = {
  page: { description: "Σκέψεις, σχόλια, αντιδράσεις και μηνύματα από την κοινότητα του bts.online — επιλεγμένα και με διαχείριση.", eyebrow: "EchoWall / Σήμα κοινότητας", title: "Άφησε μια\nηχώ.", intro: "Ένας χώρος για σκέψεις, σχόλια, αντιδράσεις και μηνύματα από όσους επισκέπτονται και βοηθούν να διαμορφωθεί το bts.online.", moderationLabel: "Συνειδητή διαχείριση", moderationTitle: "Κάθε σήμα ελέγχεται πριν δημοσιοποιηθεί.", moderationBody: "Κάθε ηχώ ελέγχεται πριν τη δημοσίευση. Οι υποβολές δεν εμφανίζονται ποτέ αμέσως.", wallLabel: "Δημόσιος τοίχος / επιλεγμένα", wallTitle: "Ηχώ που αξίζει να ταξιδέψει.", wallBody: "Εδώ εμφανίζονται μόνο ελεγμένες και εγκεκριμένες υποβολές, με σειρά δημοσίευσης.", emptyTitle: "Ο τοίχος είναι ακόμη ήσυχος.", emptyBody: "Οι πρώτες ηχώ συλλέγονται και ελέγχονται. Μπορείς ήδη να αφήσεις μήνυμα και να γίνεις μέρος του τοίχου που δημιουργείται.", first: "Άφησε την πρώτη ηχώ", unavailableTitle: "Ο δημόσιος τοίχος δεν είναι προσωρινά διαθέσιμος.", unavailableBody: "Οι δημόσιες ηχώ δεν μπορούν να φορτωθούν τώρα. Μπορείς ακόμη να στείλεις νέο μήνυμα μέσω της φόρμας.", signalLabel: "Άφησε ένα σήμα", signalAside: "Προσωπικό, με σεβασμό και συνειδητά σύντομο. Η ηχώ σου δεν δημοσιεύεται αμέσως.", formTitle: "Πρόσθεσε τη φωνή σου στον τοίχο.", formBody: "Μοιράσου μια σκέψη, αντίδραση, σχόλιο ή μήνυμα. Κάθε υποβολή ελέγχεται πριν από πιθανή δημοσίευση.", privacyLabel: "Ιδιωτικότητα / διαχείριση", privacyTitle: "Τι συμβαίνει μετά την υποβολή;", privacyBody: "Η ηχώ αποθηκεύεται και ελέγχεται. Εμφανίζεται μόνο μετά την έγκριση. Το προαιρετικό email παραμένει ιδιωτικό. Αργότερα μπορείς να ζητήσεις διαγραφή με τον μοναδικό κωδικό ή επαληθευμένο email.", back: "Επιστροφή στο Digital HQ" },
  form: { unavailableTitle: "Οι υποβολές δεν είναι προσωρινά διαθέσιμες.", unavailableBody: "Η φόρμα δεν μπόρεσε να προετοιμαστεί με ασφάλεια. Δοκίμασε ξανά αργότερα.", receivedLabel: "Η υποβολή παραλήφθηκε", receivedTitle: "Η ηχώ σου έφτασε στον τοίχο.", receivedBody: "Το μήνυμά σου αποθηκεύτηκε και περιμένει έλεγχο. Θα εμφανιστεί δημόσια μόνο μετά την έγκριση.", deletionReference: "Ο μοναδικός κωδικός διαγραφής", deletionHelp: "Φύλαξέ τον με ασφάλεια και μην τον κοινοποιήσεις δημόσια. Θα χρειαστεί για μελλοντικό αίτημα διαγραφής και δεν μπορεί να εμφανιστεί ξανά.", copy: "Αντιγραφή κωδικού", copied: "Ο κωδικός αντιγράφηκε.", copyFailed: "Η αντιγραφή απέτυχε. Επίλεξε τον κωδικό χειροκίνητα.", another: "Άφησε άλλη μια ηχώ", displayName: "Εμφανιζόμενο όνομα", required: "υποχρεωτικό", displayHelp: "Το όνομά σου ή ένα ψευδώνυμο, 2–40 χαρακτήρες.", category: "Κατηγορία", optional: "προαιρετικό", categoryHelp: "Βοηθά να ενταχθεί αργότερα η ηχώ σου στο κατάλληλο πλαίσιο.", noCategory: "Χωρίς κατηγορία", categories: { thought: "Σκέψη", feedback: "Σχόλιο", reaction: "Αντίδραση", message: "Μήνυμα" }, message: "Μήνυμα", messageHelp: "10–500 χαρακτήρες, μόνο απλό κείμενο. Δεν επιτρέπονται σύνδεσμοι.", email: "Διεύθυνση email", privateOptional: "προαιρετική και ιδιωτική", emailHelp: "Δεν εμφανίζεται δημόσια και αποθηκεύεται ξεχωριστά από την ηχώ.", consent: "Συμφωνώ να αποθηκευτεί η ηχώ μου για έλεγχο και, μετά την έγκριση, να δημοσιευτεί στο bts.online με το εμφανιζόμενο όνομα που έδωσα. Το προαιρετικό email παραμένει ιδιωτικό.", consentHelp: "Αργότερα μπορείς να ζητήσεις διαγραφή με τον μοναδικό κωδικό ή επαληθευμένο email.", submitting: "Υποβολή…", submit: "Αποστολή ηχούς", errors: { INVALID_INPUT: "Έλεγξε τα στοιχεία σου.", INVALID_REQUEST: "Το αίτημα δεν μπόρεσε να επεξεργαστεί.", INVALID_FORM_TOKEN: "Η φόρμα έχει λήξει. Ανανέωσε τη σελίδα.", SUBMISSION_TOO_FAST: "Η φόρμα υποβλήθηκε πολύ γρήγορα. Περίμενε λίγο.", RATE_LIMITED: "Έγιναν πάρα πολλές υποβολές. Δοκίμασε ξανά αργότερα.", DUPLICATE: "Αυτό το μήνυμα υποβλήθηκε ήδη πρόσφατα.", SERVICE_UNAVAILABLE: "Το EchoWall δεν είναι διαθέσιμο τώρα. Δοκίμασε ξανά αργότερα." } },
};

const ru: EchoDictionary = {
  page: { description: "Мысли, отзывы, реакции и сообщения сообщества bts.online — отобранные и прошедшие модерацию.", eyebrow: "EchoWall / Сигнал сообщества", title: "Оставьте\nотклик.", intro: "Место для мыслей, отзывов, реакций и сообщений людей, которые посещают bts.online и помогают ему развиваться.", moderationLabel: "Осознанная модерация", moderationTitle: "Каждый сигнал проверяется до публикации.", moderationBody: "Каждый отклик проверяется до публикации. Сообщения никогда не появляются сразу.", wallLabel: "Публичная стена / отобрано", wallTitle: "Отклики, которые стоит передать дальше.", wallBody: "Здесь появляются только проверенные и одобренные сообщения — в порядке публикации.", emptyTitle: "На стене пока тихо.", emptyBody: "Первые отклики собираются и проходят модерацию. Вы уже можете оставить сообщение и стать частью растущей стены сообщества.", first: "Оставить первый отклик", unavailableTitle: "Публичная стена временно недоступна.", unavailableBody: "Сейчас не удаётся загрузить публичные отклики. Вы всё равно можете отправить новое сообщение через форму.", signalLabel: "Оставить сигнал", signalAside: "Лично, уважительно и намеренно кратко. Ваш отклик не будет опубликован сразу.", formTitle: "Добавьте свой голос на стену.", formBody: "Поделитесь мыслью, реакцией, отзывом или сообщением. Каждая запись проходит модерацию перед возможной публикацией.", privacyLabel: "Конфиденциальность / модерация", privacyTitle: "Что произойдёт после отправки?", privacyBody: "Отклик сохраняется и проходит модерацию. Он появится только после одобрения. Необязательный адрес остаётся закрытым. Позже можно запросить удаление по одноразовому коду или подтверждённому адресу.", back: "Назад в Digital HQ" },
  form: { unavailableTitle: "Отправка временно недоступна.", unavailableBody: "Не удалось безопасно подготовить форму. Повторите попытку позже.", receivedLabel: "Сообщение получено", receivedTitle: "Ваш отклик дошёл до стены.", receivedBody: "Сообщение сохранено и ожидает модерации. Оно станет публичным только после одобрения.", deletionReference: "Одноразовый код удаления", deletionHelp: "Храните его безопасно и не публикуйте. Он понадобится для будущего запроса на удаление и больше не будет показан.", copy: "Копировать код", copied: "Код скопирован.", copyFailed: "Не удалось скопировать. Выделите код вручную.", another: "Оставить ещё один отклик", displayName: "Отображаемое имя", required: "обязательно", displayHelp: "Ваше имя или выбранный псевдоним, 2–40 символов.", category: "Категория", optional: "необязательно", categoryHelp: "Помогает позднее поместить отклик в контекст.", noCategory: "Без категории", categories: { thought: "Мысль", feedback: "Отзыв", reaction: "Реакция", message: "Сообщение" }, message: "Сообщение", messageHelp: "10–500 символов, только обычный текст. Ссылки запрещены.", email: "Адрес электронной почты", privateOptional: "необязательно и конфиденциально", emailHelp: "Не показывается публично и хранится отдельно от отклика.", consent: "Я согласен, чтобы мой отклик сохранили для проверки и после одобрения опубликовали на bts.online с указанным отображаемым именем. Необязательный адрес остаётся закрытым.", consentHelp: "Позже можно запросить удаление по одноразовому коду или подтверждённому адресу.", submitting: "Отправка…", submit: "Отправить отклик", errors: { INVALID_INPUT: "Проверьте введённые данные.", INVALID_REQUEST: "Не удалось обработать запрос.", INVALID_FORM_TOKEN: "Срок действия формы истёк. Обновите страницу.", SUBMISSION_TOO_FAST: "Форма отправлена слишком быстро. Подождите немного.", RATE_LIMITED: "Слишком много сообщений. Повторите попытку позже.", DUPLICATE: "Это сообщение уже было недавно отправлено.", SERVICE_UNAVAILABLE: "EchoWall сейчас недоступен. Повторите попытку позже." } },
};

export const echoDictionaries = { de, en, es, tr, pl, el, ru } as const satisfies Record<Locale, EchoDictionary>;
export function getEchoDictionary(locale: Locale): EchoDictionary { return echoDictionaries[locale]; }
