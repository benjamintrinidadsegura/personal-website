import type { Locale } from "@/lib/i18n/config";

type ErrorCopy = {
  interrupted: string;
  viewTitle: string;
  viewBody: string;
  retry: string;
  globalTitle: string;
  globalBody: string;
  loading: string;
  notFound: string;
  missingTitle: string;
  missingBody: string;
  home: string;
};

export const errorDictionaries = {
  de: { interrupted: "Vorübergehend unterbrochen", viewTitle: "Diese Ansicht konnte nicht geladen werden.", viewBody: "Deine Eingaben werden nicht an einen Fehlerdienst gesendet. Du kannst die Ansicht sicher erneut versuchen.", retry: "Erneut versuchen", globalTitle: "bts.online konnte nicht geladen werden.", globalBody: "Bitte versuche es noch einmal.", loading: "Kontext wird geladen…", notFound: "Nicht gefunden", missingTitle: "Dieser Kontext fehlt.", missingBody: "Die gesuchte Seite existiert nicht oder ist nicht öffentlich verfügbar.", home: "Zum Digital HQ" },
  en: { interrupted: "Temporarily interrupted", viewTitle: "This view could not be loaded.", viewBody: "Your input is not sent to an error service. You can safely try the view again.", retry: "Try again", globalTitle: "bts.online could not be loaded.", globalBody: "Please try again.", loading: "Loading context…", notFound: "Not found", missingTitle: "This context is missing.", missingBody: "The page you were looking for does not exist or is not publicly available.", home: "Go to the Digital HQ" },
  es: { interrupted: "Interrupción temporal", viewTitle: "No se pudo cargar esta vista.", viewBody: "Tus datos no se envían a ningún servicio de errores. Puedes volver a intentarlo con seguridad.", retry: "Intentar de nuevo", globalTitle: "No se pudo cargar bts.online.", globalBody: "Inténtalo de nuevo.", loading: "Cargando contexto…", notFound: "No encontrado", missingTitle: "Falta este contexto.", missingBody: "La página que buscas no existe o no está disponible públicamente.", home: "Ir al Digital HQ" },
  tr: { interrupted: "Geçici kesinti", viewTitle: "Bu görünüm yüklenemedi.", viewBody: "Girdilerin bir hata hizmetine gönderilmez. Görünümü güvenle yeniden deneyebilirsin.", retry: "Yeniden dene", globalTitle: "bts.online yüklenemedi.", globalBody: "Lütfen yeniden dene.", loading: "Bağlam yükleniyor…", notFound: "Bulunamadı", missingTitle: "Bu bağlam eksik.", missingBody: "Aradığın sayfa yok veya herkese açık değil.", home: "Digital HQ’ya git" },
  pl: { interrupted: "Chwilowa przerwa", viewTitle: "Nie udało się wczytać tego widoku.", viewBody: "Twoje dane nie są wysyłane do usługi raportowania błędów. Możesz bezpiecznie spróbować ponownie.", retry: "Spróbuj ponownie", globalTitle: "Nie udało się wczytać bts.online.", globalBody: "Spróbuj ponownie.", loading: "Wczytywanie kontekstu…", notFound: "Nie znaleziono", missingTitle: "Brakuje tego kontekstu.", missingBody: "Szukana strona nie istnieje lub nie jest publicznie dostępna.", home: "Przejdź do Digital HQ" },
  el: { interrupted: "Προσωρινή διακοπή", viewTitle: "Αυτή η προβολή δεν μπόρεσε να φορτωθεί.", viewBody: "Τα στοιχεία σου δεν αποστέλλονται σε υπηρεσία σφαλμάτων. Μπορείς να δοκιμάσεις ξανά με ασφάλεια.", retry: "Δοκίμασε ξανά", globalTitle: "Το bts.online δεν μπόρεσε να φορτωθεί.", globalBody: "Δοκίμασε ξανά.", loading: "Φόρτωση πλαισίου…", notFound: "Δεν βρέθηκε", missingTitle: "Αυτό το πλαίσιο λείπει.", missingBody: "Η σελίδα που αναζητάς δεν υπάρχει ή δεν είναι δημόσια διαθέσιμη.", home: "Μετάβαση στο Digital HQ" },
  ru: { interrupted: "Временный сбой", viewTitle: "Не удалось загрузить этот экран.", viewBody: "Введённые данные не отправляются в сервис ошибок. Можно безопасно повторить попытку.", retry: "Попробовать снова", globalTitle: "Не удалось загрузить bts.online.", globalBody: "Попробуйте снова.", loading: "Загрузка контекста…", notFound: "Не найдено", missingTitle: "Этого контекста не хватает.", missingBody: "Искомая страница не существует или не доступна публично.", home: "Перейти в Digital HQ" },
} as const satisfies Record<Locale, ErrorCopy>;

export function getErrorDictionary(locale: Locale): ErrorCopy {
  return errorDictionaries[locale];
}
