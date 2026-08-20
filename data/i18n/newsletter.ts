import type { Locale } from "@/lib/i18n/config";

const de = {
  email: {
    subject: "Bestätige dein bts.online Newsletter-Abonnement",
    heading: "Bestätige dein Abonnement.",
    body: "Neue Texte und gelegentliche Updates aus dem Digital HQ. Kein fester Rhythmus, kein Spam.",
    action: "Prüfen und bestätigen",
    confirmLabel: "Bestätigen",
    expiresPrefix: "Dieser Link läuft ab am",
    ignore: "Falls du das nicht angefragt hast, ignoriere diese E-Mail.",
  },
  page: {
    description: "Neue Texte und gelegentliche Updates aus dem Digital HQ — bewusst und per Double-Opt-in.",
    eyebrow: "Writing / Direkter Kanal",
    title: "Notizen aus dem\nDigital HQ.",
    subscribeTitle: "Bewusst abonnieren.",
    subscribeBody: "Eine E-Mail-Adresse, ein klarer Bestätigungsschritt und ein Abmeldelink in jeder Ausgabe. Die Newsletter-Einwilligung ist vom BTS Account getrennt.",
  },
  form: {
    preparingTitle: "Der Newsletter wird vorbereitet.",
    preparingBody: "Anmeldungen öffnen, sobald Versand und Datenschutzkonfiguration vollständig sind.",
    inboxTitle: "Prüfe dein Postfach.",
    inboxBody: "Wenn diese Adresse berechtigt ist, ist eine Bestätigungs-E-Mail unterwegs. Das Abonnement beginnt erst nach der Bestätigung.",
    email: "E-Mail-Adresse",
    required: "erforderlich",
    emailHelp: "Wird nur für diesen Newsletter verwendet und nicht mit dem BTS Account verknüpft.",
    privacyPrefix: "Double-Opt-in ist erforderlich. Lies die",
    privacyLink: "Datenschutzinformationen zum Newsletter",
    requesting: "Wird angefragt…",
    request: "Abonnement anfragen",
    errors: {
      INVALID_INPUT: "Bitte prüfe das Anmeldeformular.",
      INVALID_REQUEST: "Die Anmeldung konnte nicht angenommen werden.",
      INVALID_FORM_TOKEN: "Dieses Formular ist abgelaufen. Lade die Seite neu und versuche es erneut.",
      SUBMISSION_TOO_FAST: "Bitte nimm dir vor dem Absenden einen Moment Zeit.",
      RATE_LIMITED: "Zu viele Anfragen. Bitte versuche es später erneut.",
      SERVICE_UNAVAILABLE: "Die Newsletter-Anmeldung ist vorübergehend nicht verfügbar.",
    },
  },
  confirm: {
    eyebrow: "Newsletter / Bestätigung",
    title: "Abonnement bestätigen.",
    body: "Dieser Schritt schließt das Double-Opt-in ab. Erst danach darf der Newsletter an diese Adresse gesendet werden.",
    invalid: "Dieser Bestätigungslink ist ungültig oder unvollständig.",
    already: "Bereits bestätigt.",
    success: "Abonnement bestätigt.",
    successBody: "Neue Texte und gelegentliche Updates aus dem Digital HQ können jetzt per E-Mail ankommen.",
    explore: "Writing entdecken",
    unavailable: "Die Bestätigung ist vorübergehend nicht verfügbar. Bitte versuche es später erneut.",
    expired: "Dieser Bestätigungslink ist ungültig oder abgelaufen.",
    pending: "Wird bestätigt…",
    action: "Abonnement bestätigen",
  },
  unsubscribe: {
    eyebrow: "Newsletter / Abmeldung",
    title: "Newsletter abbestellen.",
    body: "Der Abmeldelink gilt nur für das zugehörige Newsletter-Abonnement.",
    invalid: "Dieser Abmeldelink ist ungültig oder unvollständig.",
    already: "Bereits abgemeldet.",
    success: "Du bist abgemeldet.",
    successBody: "An dieses Abonnement werden keine weiteren Newsletter-Ausgaben gesendet.",
    unavailable: "Die Abmeldung ist vorübergehend nicht verfügbar. Bitte versuche es später erneut.",
    badLink: "Dieser Abmeldelink ist ungültig.",
    pending: "Wird abgemeldet…",
    action: "Abmelden",
  },
} as const;

type Widen<T> = { [K in keyof T]: T[K] extends string ? string : T[K] extends Record<string, unknown> ? Widen<T[K]> : T[K] };
export type NewsletterDictionary = Widen<typeof de>;

const en: NewsletterDictionary = {
  email: {
    subject: "Confirm your bts.online newsletter subscription",
    heading: "Confirm your subscription.",
    body: "New Writing and occasional updates from the Digital HQ. No fixed schedule, no spam.",
    action: "Review and confirm",
    confirmLabel: "Confirm",
    expiresPrefix: "This link expires",
    ignore: "If you did not request this, ignore this email.",
  },
  page: {
    description: "New writing and occasional Digital HQ updates — deliberate and double-opt-in.",
    eyebrow: "Writing / Direct channel",
    title: "Notes from the\nDigital HQ.",
    subscribeTitle: "Subscribe deliberately.",
    subscribeBody: "One email address, a clear confirmation step, and an unsubscribe link in every edition. Newsletter consent is separate from BTS Account.",
  },
  form: {
    preparingTitle: "The newsletter is being prepared.",
    preparingBody: "Subscriptions will open after delivery and privacy configuration is complete.",
    inboxTitle: "Check your inbox.",
    inboxBody: "If this address is eligible, a confirmation email is on its way. The subscription starts only after confirmation.",
    email: "Email address",
    required: "required",
    emailHelp: "Used only for this newsletter. It is not linked to BTS Account.",
    privacyPrefix: "Double opt-in is required. Read the",
    privacyLink: "newsletter privacy information",
    requesting: "Requesting…",
    request: "Request subscription",
    errors: {
      INVALID_INPUT: "Please review the subscription form.",
      INVALID_REQUEST: "The subscription request could not be accepted.",
      INVALID_FORM_TOKEN: "This form has expired. Reload the page and try again.",
      SUBMISSION_TOO_FAST: "Please take a moment before submitting.",
      RATE_LIMITED: "Too many requests were made. Please try again later.",
      SERVICE_UNAVAILABLE: "Newsletter subscription is temporarily unavailable.",
    },
  },
  confirm: {
    eyebrow: "Newsletter / Confirmation",
    title: "Confirm your subscription.",
    body: "This step completes double opt-in. The newsletter may be sent to this address only after confirmation.",
    invalid: "This confirmation link is invalid or incomplete.",
    already: "Already confirmed.",
    success: "Subscription confirmed.",
    successBody: "New Writing and occasional Digital HQ updates can now arrive by email.",
    explore: "Explore Writing",
    unavailable: "Confirmation is temporarily unavailable. Please try again later.",
    expired: "This confirmation link is invalid or has expired.",
    pending: "Confirming…",
    action: "Confirm subscription",
  },
  unsubscribe: {
    eyebrow: "Newsletter / Unsubscribe",
    title: "Unsubscribe from the newsletter.",
    body: "The unsubscribe link applies only to its associated newsletter subscription.",
    invalid: "This unsubscribe link is invalid or incomplete.",
    already: "Already unsubscribed.",
    success: "You are unsubscribed.",
    successBody: "No further newsletter editions will be sent to this subscription.",
    unavailable: "Unsubscribe is temporarily unavailable. Please try again later.",
    badLink: "This unsubscribe link is invalid.",
    pending: "Unsubscribing…",
    action: "Unsubscribe",
  },
};

const es: NewsletterDictionary = {
  email: { subject: "Confirma tu suscripción al newsletter de bts.online", heading: "Confirma tu suscripción.", body: "Nuevos textos y actualizaciones ocasionales desde el Digital HQ. Sin calendario fijo y sin spam.", action: "Revisar y confirmar", confirmLabel: "Confirmar", expiresPrefix: "Este enlace caduca el", ignore: "Si no lo solicitaste, ignora este correo." },
  page: { description: "Nuevos textos y actualizaciones ocasionales del Digital HQ, con intención y doble confirmación.", eyebrow: "Writing / Canal directo", title: "Notas desde el\nDigital HQ.", subscribeTitle: "Suscríbete con intención.", subscribeBody: "Una dirección de correo, un paso claro de confirmación y un enlace para darse de baja en cada edición. El consentimiento del newsletter es independiente de BTS Account." },
  form: { preparingTitle: "El newsletter está en preparación.", preparingBody: "Las suscripciones se abrirán cuando la entrega y la configuración de privacidad estén listas.", inboxTitle: "Revisa tu bandeja de entrada.", inboxBody: "Si la dirección cumple los requisitos, recibirás un correo de confirmación. La suscripción solo comienza después de confirmarla.", email: "Dirección de correo", required: "obligatorio", emailHelp: "Se utiliza únicamente para este newsletter y no se vincula a BTS Account.", privacyPrefix: "Se requiere doble confirmación. Consulta la", privacyLink: "información de privacidad del newsletter", requesting: "Enviando…", request: "Solicitar suscripción", errors: { INVALID_INPUT: "Revisa el formulario de suscripción.", INVALID_REQUEST: "No se pudo aceptar la solicitud de suscripción.", INVALID_FORM_TOKEN: "Este formulario ha caducado. Recarga la página e inténtalo de nuevo.", SUBMISSION_TOO_FAST: "Tómate un momento antes de enviarlo.", RATE_LIMITED: "Se han realizado demasiadas solicitudes. Inténtalo más tarde.", SERVICE_UNAVAILABLE: "La suscripción al newsletter no está disponible temporalmente." } },
  confirm: { eyebrow: "Newsletter / Confirmación", title: "Confirma tu suscripción.", body: "Este paso completa la doble confirmación. El newsletter solo podrá enviarse a esta dirección después de confirmarla.", invalid: "Este enlace de confirmación no es válido o está incompleto.", already: "Ya está confirmada.", success: "Suscripción confirmada.", successBody: "Ya puedes recibir por correo nuevos textos y actualizaciones ocasionales del Digital HQ.", explore: "Explorar Writing", unavailable: "La confirmación no está disponible temporalmente. Inténtalo más tarde.", expired: "Este enlace de confirmación no es válido o ha caducado.", pending: "Confirmando…", action: "Confirmar suscripción" },
  unsubscribe: { eyebrow: "Newsletter / Baja", title: "Darse de baja del newsletter.", body: "El enlace de baja solo se aplica a la suscripción asociada.", invalid: "Este enlace de baja no es válido o está incompleto.", already: "La baja ya estaba registrada.", success: "Te has dado de baja.", successBody: "No se enviarán más ediciones a esta suscripción.", unavailable: "La baja no está disponible temporalmente. Inténtalo más tarde.", badLink: "Este enlace de baja no es válido.", pending: "Procesando la baja…", action: "Darse de baja" },
};

const tr: NewsletterDictionary = {
  email: { subject: "bts.online bülten aboneliğini doğrula", heading: "Aboneliğini doğrula.", body: "Digital HQ’dan yeni yazılar ve ara sıra güncellemeler. Sabit bir takvim yok, spam yok.", action: "İncele ve doğrula", confirmLabel: "Doğrula", expiresPrefix: "Bu bağlantının son kullanma tarihi", ignore: "Bu talebi sen göndermediysen bu e-postayı yok say." },
  page: { description: "Digital HQ’dan yeni yazılar ve ara sıra güncellemeler — bilinçli ve çift onaylı.", eyebrow: "Yazılar / Doğrudan kanal", title: "Digital HQ’dan\nnotlar.", subscribeTitle: "Bilinçli biçimde abone ol.", subscribeBody: "Bir e-posta adresi, açık bir doğrulama adımı ve her sayıda abonelikten çıkma bağlantısı. Bülten onayı BTS Account’tan ayrıdır." },
  form: { preparingTitle: "Bülten hazırlanıyor.", preparingBody: "Gönderim ve gizlilik yapılandırması tamamlandığında abonelikler açılacak.", inboxTitle: "Gelen kutunu kontrol et.", inboxBody: "Bu adres uygunsa doğrulama e-postası yolda. Abonelik ancak doğrulamadan sonra başlar.", email: "E-posta adresi", required: "zorunlu", emailHelp: "Yalnızca bu bülten için kullanılır ve BTS Account ile ilişkilendirilmez.", privacyPrefix: "Çift onay gereklidir.", privacyLink: "Bülten gizlilik bilgilerini oku", requesting: "Talep gönderiliyor…", request: "Abonelik talep et", errors: { INVALID_INPUT: "Abonelik formunu kontrol et.", INVALID_REQUEST: "Abonelik talebi kabul edilemedi.", INVALID_FORM_TOKEN: "Bu formun süresi doldu. Sayfayı yenileyip yeniden dene.", SUBMISSION_TOO_FAST: "Göndermeden önce lütfen bir an bekle.", RATE_LIMITED: "Çok fazla talep gönderildi. Daha sonra yeniden dene.", SERVICE_UNAVAILABLE: "Bülten aboneliği geçici olarak kullanılamıyor." } },
  confirm: { eyebrow: "Bülten / Doğrulama", title: "Aboneliğini doğrula.", body: "Bu adım çift onayı tamamlar. Bülten bu adrese ancak doğrulamadan sonra gönderilebilir.", invalid: "Bu doğrulama bağlantısı geçersiz veya eksik.", already: "Zaten doğrulandı.", success: "Abonelik doğrulandı.", successBody: "Digital HQ’dan yeni yazılar ve güncellemeler artık e-postayla gelebilir.", explore: "Yazıları keşfet", unavailable: "Doğrulama geçici olarak kullanılamıyor. Daha sonra yeniden dene.", expired: "Bu doğrulama bağlantısı geçersiz veya süresi dolmuş.", pending: "Doğrulanıyor…", action: "Aboneliği doğrula" },
  unsubscribe: { eyebrow: "Bülten / Abonelikten çıkma", title: "Bülten aboneliğini sonlandır.", body: "Abonelikten çıkma bağlantısı yalnızca ilişkili bülten aboneliği için geçerlidir.", invalid: "Bu abonelikten çıkma bağlantısı geçersiz veya eksik.", already: "Abonelik zaten sonlandırılmış.", success: "Abonelikten çıktın.", successBody: "Bu aboneliğe başka bülten sayısı gönderilmeyecek.", unavailable: "Abonelikten çıkma işlemi geçici olarak kullanılamıyor. Daha sonra yeniden dene.", badLink: "Bu abonelikten çıkma bağlantısı geçersiz.", pending: "Abonelik sonlandırılıyor…", action: "Abonelikten çık" },
};

const pl: NewsletterDictionary = {
  email: { subject: "Potwierdź subskrypcję newslettera bts.online", heading: "Potwierdź subskrypcję.", body: "Nowe teksty i okazjonalne wiadomości z Digital HQ. Bez sztywnego harmonogramu i bez spamu.", action: "Sprawdź i potwierdź", confirmLabel: "Potwierdź", expiresPrefix: "Ten link wygasa", ignore: "Jeśli to nie Ty wysłałeś tę prośbę, zignoruj wiadomość." },
  page: { description: "Nowe teksty i okazjonalne wiadomości z Digital HQ — świadomie i z podwójnym potwierdzeniem.", eyebrow: "Teksty / Bezpośredni kanał", title: "Notatki z\nDigital HQ.", subscribeTitle: "Subskrybuj świadomie.", subscribeBody: "Jeden adres e-mail, jasny krok potwierdzenia i link do rezygnacji w każdym wydaniu. Zgoda na newsletter jest oddzielona od BTS Account." },
  form: { preparingTitle: "Newsletter jest przygotowywany.", preparingBody: "Subskrypcje zostaną otwarte po zakończeniu konfiguracji wysyłki i prywatności.", inboxTitle: "Sprawdź skrzynkę odbiorczą.", inboxBody: "Jeśli ten adres spełnia warunki, wiadomość potwierdzająca jest w drodze. Subskrypcja rozpocznie się dopiero po potwierdzeniu.", email: "Adres e-mail", required: "wymagane", emailHelp: "Używany wyłącznie do tego newslettera i niepowiązany z BTS Account.", privacyPrefix: "Wymagane jest podwójne potwierdzenie. Przeczytaj", privacyLink: "informacje o prywatności newslettera", requesting: "Wysyłanie…", request: "Poproś o subskrypcję", errors: { INVALID_INPUT: "Sprawdź formularz subskrypcji.", INVALID_REQUEST: "Nie udało się przyjąć prośby o subskrypcję.", INVALID_FORM_TOKEN: "Ten formularz wygasł. Odśwież stronę i spróbuj ponownie.", SUBMISSION_TOO_FAST: "Odczekaj chwilę przed wysłaniem.", RATE_LIMITED: "Wysłano zbyt wiele żądań. Spróbuj ponownie później.", SERVICE_UNAVAILABLE: "Subskrypcja newslettera jest chwilowo niedostępna." } },
  confirm: { eyebrow: "Newsletter / Potwierdzenie", title: "Potwierdź subskrypcję.", body: "Ten krok kończy podwójne potwierdzenie. Newsletter może trafić na ten adres dopiero po potwierdzeniu.", invalid: "Ten link potwierdzający jest nieprawidłowy lub niekompletny.", already: "Subskrypcja jest już potwierdzona.", success: "Subskrypcja potwierdzona.", successBody: "Nowe teksty i wiadomości z Digital HQ mogą już przychodzić e-mailem.", explore: "Odkryj teksty", unavailable: "Potwierdzenie jest chwilowo niedostępne. Spróbuj ponownie później.", expired: "Ten link potwierdzający jest nieprawidłowy lub wygasł.", pending: "Potwierdzanie…", action: "Potwierdź subskrypcję" },
  unsubscribe: { eyebrow: "Newsletter / Rezygnacja", title: "Zrezygnuj z newslettera.", body: "Link do rezygnacji dotyczy wyłącznie powiązanej subskrypcji.", invalid: "Ten link do rezygnacji jest nieprawidłowy lub niekompletny.", already: "Subskrypcja została już anulowana.", success: "Subskrypcja anulowana.", successBody: "Na ten adres nie będą wysyłane kolejne wydania newslettera.", unavailable: "Rezygnacja jest chwilowo niedostępna. Spróbuj ponownie później.", badLink: "Ten link do rezygnacji jest nieprawidłowy.", pending: "Anulowanie subskrypcji…", action: "Zrezygnuj" },
};

const el: NewsletterDictionary = {
  email: { subject: "Επιβεβαίωσε τη συνδρομή σου στο newsletter του bts.online", heading: "Επιβεβαίωσε τη συνδρομή σου.", body: "Νέα κείμενα και περιστασιακές ενημερώσεις από το Digital HQ. Χωρίς σταθερό πρόγραμμα και χωρίς ανεπιθύμητα μηνύματα.", action: "Έλεγχος και επιβεβαίωση", confirmLabel: "Επιβεβαίωση", expiresPrefix: "Αυτός ο σύνδεσμος λήγει", ignore: "Αν δεν έκανες εσύ αυτό το αίτημα, αγνόησε το μήνυμα." },
  page: { description: "Νέα κείμενα και περιστασιακές ενημερώσεις από το Digital HQ — συνειδητά και με διπλή επιβεβαίωση.", eyebrow: "Κείμενα / Άμεσο κανάλι", title: "Σημειώσεις από το\nDigital HQ.", subscribeTitle: "Επίλεξε συνειδητά τη συνδρομή.", subscribeBody: "Μία διεύθυνση email, ένα σαφές βήμα επιβεβαίωσης και σύνδεσμος διαγραφής σε κάθε τεύχος. Η συγκατάθεση για το newsletter είναι ξεχωριστή από το BTS Account." },
  form: { preparingTitle: "Το newsletter προετοιμάζεται.", preparingBody: "Οι εγγραφές θα ανοίξουν όταν ολοκληρωθούν οι ρυθμίσεις αποστολής και απορρήτου.", inboxTitle: "Έλεγξε τα εισερχόμενά σου.", inboxBody: "Αν η διεύθυνση πληροί τις προϋποθέσεις, το email επιβεβαίωσης είναι καθ’ οδόν. Η συνδρομή ξεκινά μόνο μετά την επιβεβαίωση.", email: "Διεύθυνση email", required: "υποχρεωτικό", emailHelp: "Χρησιμοποιείται μόνο για αυτό το newsletter και δεν συνδέεται με το BTS Account.", privacyPrefix: "Απαιτείται διπλή επιβεβαίωση. Διάβασε τις", privacyLink: "πληροφορίες απορρήτου του newsletter", requesting: "Αποστολή αιτήματος…", request: "Αίτημα συνδρομής", errors: { INVALID_INPUT: "Έλεγξε τη φόρμα συνδρομής.", INVALID_REQUEST: "Το αίτημα συνδρομής δεν μπόρεσε να γίνει δεκτό.", INVALID_FORM_TOKEN: "Η φόρμα έχει λήξει. Ανανέωσε τη σελίδα και δοκίμασε ξανά.", SUBMISSION_TOO_FAST: "Περίμενε λίγο πριν την υποβολή.", RATE_LIMITED: "Έγιναν πάρα πολλά αιτήματα. Δοκίμασε ξανά αργότερα.", SERVICE_UNAVAILABLE: "Η εγγραφή στο newsletter δεν είναι προσωρινά διαθέσιμη." } },
  confirm: { eyebrow: "Newsletter / Επιβεβαίωση", title: "Επιβεβαίωσε τη συνδρομή σου.", body: "Αυτό το βήμα ολοκληρώνει τη διπλή επιβεβαίωση. Το newsletter μπορεί να σταλεί σε αυτή τη διεύθυνση μόνο μετά την επιβεβαίωση.", invalid: "Ο σύνδεσμος επιβεβαίωσης είναι άκυρος ή ελλιπής.", already: "Έχει ήδη επιβεβαιωθεί.", success: "Η συνδρομή επιβεβαιώθηκε.", successBody: "Νέα κείμενα και ενημερώσεις από το Digital HQ μπορούν πλέον να φτάνουν μέσω email.", explore: "Ανακάλυψε τα κείμενα", unavailable: "Η επιβεβαίωση δεν είναι προσωρινά διαθέσιμη. Δοκίμασε ξανά αργότερα.", expired: "Ο σύνδεσμος επιβεβαίωσης είναι άκυρος ή έχει λήξει.", pending: "Επιβεβαίωση…", action: "Επιβεβαίωση συνδρομής" },
  unsubscribe: { eyebrow: "Newsletter / Διαγραφή", title: "Διαγραφή από το newsletter.", body: "Ο σύνδεσμος διαγραφής ισχύει μόνο για τη συγκεκριμένη συνδρομή.", invalid: "Ο σύνδεσμος διαγραφής είναι άκυρος ή ελλιπής.", already: "Η διαγραφή έχει ήδη γίνει.", success: "Η συνδρομή σου διαγράφηκε.", successBody: "Δεν θα σταλούν άλλα τεύχη σε αυτή τη συνδρομή.", unavailable: "Η διαγραφή δεν είναι προσωρινά διαθέσιμη. Δοκίμασε ξανά αργότερα.", badLink: "Ο σύνδεσμος διαγραφής είναι άκυρος.", pending: "Διαγραφή συνδρομής…", action: "Διαγραφή" },
};

const ru: NewsletterDictionary = {
  email: { subject: "Подтвердите подписку на рассылку bts.online", heading: "Подтвердите подписку.", body: "Новые тексты и редкие новости из Digital HQ. Без жёсткого графика и без спама.", action: "Проверить и подтвердить", confirmLabel: "Подтвердить", expiresPrefix: "Срок действия ссылки истекает", ignore: "Если вы не отправляли этот запрос, проигнорируйте письмо." },
  page: { description: "Новые тексты и редкие новости из Digital HQ — осознанно и с двойным подтверждением.", eyebrow: "Тексты / Прямой канал", title: "Заметки из\nDigital HQ.", subscribeTitle: "Подпишитесь осознанно.", subscribeBody: "Один адрес, понятный шаг подтверждения и ссылка для отписки в каждом выпуске. Согласие на рассылку не связано с BTS Account." },
  form: { preparingTitle: "Рассылка готовится.", preparingBody: "Подписка откроется после завершения настройки доставки и конфиденциальности.", inboxTitle: "Проверьте входящие.", inboxBody: "Если адрес соответствует требованиям, письмо с подтверждением уже в пути. Подписка начнётся только после подтверждения.", email: "Адрес электронной почты", required: "обязательно", emailHelp: "Используется только для этой рассылки и не связывается с BTS Account.", privacyPrefix: "Требуется двойное подтверждение. Прочитайте", privacyLink: "информацию о конфиденциальности рассылки", requesting: "Отправка…", request: "Запросить подписку", errors: { INVALID_INPUT: "Проверьте форму подписки.", INVALID_REQUEST: "Не удалось принять запрос на подписку.", INVALID_FORM_TOKEN: "Срок действия формы истёк. Обновите страницу и попробуйте снова.", SUBMISSION_TOO_FAST: "Подождите немного перед отправкой.", RATE_LIMITED: "Слишком много запросов. Повторите попытку позже.", SERVICE_UNAVAILABLE: "Подписка на рассылку временно недоступна." } },
  confirm: { eyebrow: "Рассылка / Подтверждение", title: "Подтвердите подписку.", body: "Этот шаг завершает двойное подтверждение. Рассылку можно отправлять на этот адрес только после подтверждения.", invalid: "Ссылка подтверждения недействительна или неполна.", already: "Уже подтверждено.", success: "Подписка подтверждена.", successBody: "Новые тексты и новости из Digital HQ теперь могут приходить по электронной почте.", explore: "Открыть тексты", unavailable: "Подтверждение временно недоступно. Повторите попытку позже.", expired: "Ссылка подтверждения недействительна или истекла.", pending: "Подтверждение…", action: "Подтвердить подписку" },
  unsubscribe: { eyebrow: "Рассылка / Отписка", title: "Отписаться от рассылки.", body: "Ссылка для отписки относится только к связанной с ней подписке.", invalid: "Ссылка для отписки недействительна или неполна.", already: "Подписка уже отменена.", success: "Вы отписались.", successBody: "Новые выпуски больше не будут отправляться по этой подписке.", unavailable: "Отписка временно недоступна. Повторите попытку позже.", badLink: "Ссылка для отписки недействительна.", pending: "Отмена подписки…", action: "Отписаться" },
};

export const newsletterDictionaries = { de, en, es, tr, pl, el, ru } as const satisfies Record<Locale, NewsletterDictionary>;
export function getNewsletterDictionary(locale: Locale): NewsletterDictionary { return newsletterDictionaries[locale]; }
