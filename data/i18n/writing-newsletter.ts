import type { Locale } from "@/lib/i18n/config";

type WritingNewsletterCopy = {
  prepare: string;
  prepareHint: string;
  prepared: string;
  reused: string;
  sending: string;
  sent: string;
  failedEdition: string;
  preparationFailed: string;
  open: string;
  retry: string;
};

export const writingNewsletterCopy: Record<Locale, WritingNewsletterCopy> = {
  de: {
    prepare: "Newsletter vorbereiten",
    prepareHint: "Erstellt oder verwendet nur einen Entwurf. Es wird nichts versendet.",
    prepared: "Newsletter-Entwurf vorbereitet.",
    reused: "Vorhandener Newsletter-Entwurf wird weiterverwendet.",
    sending: "Der vorhandene Newsletter wird bereits versendet. Kein neuer Entwurf wurde erstellt.",
    sent: "Für diesen Artikel wurde bereits ein Newsletter versendet. Kein neuer Entwurf wurde erstellt.",
    failedEdition: "Eine vorhandene Newsletter-Ausgabe ist fehlgeschlagen. Kein neuer Entwurf wurde erstellt.",
    preparationFailed: "Der Artikel wurde veröffentlicht, aber der Newsletter-Entwurf konnte nicht vorbereitet werden.",
    open: "Newsletter öffnen",
    retry: "Newsletter-Vorbereitung erneut versuchen",
  },
  en: {
    prepare: "Prepare newsletter",
    prepareHint: "Creates or reuses a draft only. Nothing is sent.",
    prepared: "Newsletter draft prepared.",
    reused: "The existing newsletter draft was reused.",
    sending: "The existing newsletter is already sending. No new draft was created.",
    sent: "A newsletter was already sent for this article. No new draft was created.",
    failedEdition: "An existing newsletter edition failed. No new draft was created.",
    preparationFailed: "The article was published, but newsletter preparation failed.",
    open: "Open newsletter",
    retry: "Retry newsletter preparation",
  },
  es: {
    prepare: "Preparar newsletter",
    prepareHint: "Solo crea o reutiliza un borrador. No se envía nada.",
    prepared: "Borrador del newsletter preparado.",
    reused: "Se reutilizó el borrador existente del newsletter.",
    sending: "El newsletter existente ya se está enviando. No se creó otro borrador.",
    sent: "Ya se envió un newsletter para este artículo. No se creó otro borrador.",
    failedEdition: "Una edición existente del newsletter ha fallado. No se creó otro borrador.",
    preparationFailed: "El artículo se publicó, pero no se pudo preparar el borrador del newsletter.",
    open: "Abrir newsletter",
    retry: "Reintentar la preparación del newsletter",
  },
  tr: {
    prepare: "Bülteni hazırla",
    prepareHint: "Yalnızca bir taslak oluşturur veya mevcut taslağı kullanır. Hiçbir şey gönderilmez.",
    prepared: "Bülten taslağı hazırlandı.",
    reused: "Mevcut bülten taslağı yeniden kullanıldı.",
    sending: "Mevcut bülten zaten gönderiliyor. Yeni taslak oluşturulmadı.",
    sent: "Bu yazı için daha önce bir bülten gönderildi. Yeni taslak oluşturulmadı.",
    failedEdition: "Mevcut bir bülten gönderimi başarısız oldu. Yeni taslak oluşturulmadı.",
    preparationFailed: "Yazı yayımlandı, ancak bülten taslağı hazırlanamadı.",
    open: "Bülteni aç",
    retry: "Bülten hazırlığını yeniden dene",
  },
  pl: {
    prepare: "Przygotuj newsletter",
    prepareHint: "Tworzy lub wykorzystuje tylko szkic. Nic nie zostanie wysłane.",
    prepared: "Szkic newslettera został przygotowany.",
    reused: "Wykorzystano istniejący szkic newslettera.",
    sending: "Istniejący newsletter jest już wysyłany. Nie utworzono nowego szkicu.",
    sent: "Newsletter dla tego artykułu został już wysłany. Nie utworzono nowego szkicu.",
    failedEdition: "Istniejąca wysyłka newslettera nie powiodła się. Nie utworzono nowego szkicu.",
    preparationFailed: "Artykuł został opublikowany, ale nie udało się przygotować szkicu newslettera.",
    open: "Otwórz newsletter",
    retry: "Ponów przygotowanie newslettera",
  },
  el: {
    prepare: "Προετοιμασία ενημερωτικού δελτίου",
    prepareHint: "Δημιουργεί ή επαναχρησιμοποιεί μόνο ένα προσχέδιο. Δεν αποστέλλεται τίποτα.",
    prepared: "Το προσχέδιο του ενημερωτικού δελτίου είναι έτοιμο.",
    reused: "Χρησιμοποιήθηκε ξανά το υπάρχον προσχέδιο του ενημερωτικού δελτίου.",
    sending: "Το υπάρχον ενημερωτικό δελτίο αποστέλλεται ήδη. Δεν δημιουργήθηκε νέο προσχέδιο.",
    sent: "Έχει ήδη σταλεί ενημερωτικό δελτίο για αυτό το άρθρο. Δεν δημιουργήθηκε νέο προσχέδιο.",
    failedEdition: "Μια υπάρχουσα αποστολή ενημερωτικού δελτίου απέτυχε. Δεν δημιουργήθηκε νέο προσχέδιο.",
    preparationFailed: "Το άρθρο δημοσιεύτηκε, αλλά η προετοιμασία του ενημερωτικού δελτίου απέτυχε.",
    open: "Άνοιγμα ενημερωτικού δελτίου",
    retry: "Νέα προσπάθεια προετοιμασίας",
  },
  ru: {
    prepare: "Подготовить рассылку",
    prepareHint: "Создаёт или повторно использует только черновик. Ничего не отправляется.",
    prepared: "Черновик рассылки подготовлен.",
    reused: "Использован существующий черновик рассылки.",
    sending: "Существующая рассылка уже отправляется. Новый черновик не создан.",
    sent: "Для этой статьи рассылка уже отправлена. Новый черновик не создан.",
    failedEdition: "Существующая рассылка завершилась ошибкой. Новый черновик не создан.",
    preparationFailed: "Статья опубликована, но подготовить черновик рассылки не удалось.",
    open: "Открыть рассылку",
    retry: "Повторить подготовку рассылки",
  },
};
