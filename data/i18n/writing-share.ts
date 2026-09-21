import type { Locale } from "@/lib/i18n/config";

export type WritingShareDictionary = {
  trigger: string;
  articleTrigger: string;
  dialogTitle: string;
  selectedArticle: string;
  selectedThought: string;
  format: string;
  formats: { story: string; portrait: string; square: string };
  variant: string;
  variants: { editorial: string; marginNote: string; statement: string };
  previous: string;
  next: string;
  cardProgress: string;
  screenshotMode: string;
  screenshotHint: string;
  exitScreenshot: string;
  copyLink: string;
  copyText: string;
  manualCopy: string;
  copied: string;
  clipboardFailed: string;
  share: string;
  shareFailed: string;
  close: string;
  tooLong: string;
  privatePreview: string;
  sourceLabel: string;
  moreContext: string;
  keyThought: string;
  section: string;
};

export const writingShareDictionaries = {
  de: {
    trigger: "Diesen Gedanken teilen", articleTrigger: "Diese Geschichte teilen", dialogTitle: "Share Card erstellen", selectedArticle: "Ausgewählte Geschichte", selectedThought: "Ausgewählter Gedanke", format: "Format",
    formats: { story: "9:16 Story", portrait: "4:5 Feed", square: "1:1 Quadrat" }, variant: "Variante",
    variants: { editorial: "Editorial", marginNote: "Randnotiz", statement: "Statement" }, previous: "Zurück", next: "Weiter",
    cardProgress: "Karte {current} von {total}", screenshotMode: "Screenshot-Modus", screenshotHint: "Saubere Ansicht zum Aufnehmen. Escape beendet den Screenshot-Modus.",
    exitScreenshot: "Screenshot-Modus beenden", copyLink: "Link kopieren", copyText: "Text + Link kopieren", manualCopy: "Text zum manuellen Kopieren", copied: "Kopiert", clipboardFailed: "Kopieren ist nicht verfügbar. Wähle den Text unten aus.",
    share: "Teilen", shareFailed: "Teilen ist nicht verfügbar. Nutze Link kopieren oder den Screenshot-Modus.", close: "Schließen",
    tooLong: "Dieser Gedanke ist zu lang für eine Share Card. Wähle einen kürzeren Abschnitt.", privatePreview: "Private Vorschau — es wird kein öffentlicher Link erstellt.",
    sourceLabel: "Writing", moreContext: "Mehr Kontext", keyThought: "Kerngedanke", section: "Abschnitt",
  },
  en: {
    trigger: "Share this thought", articleTrigger: "Share this story", dialogTitle: "Create share card", selectedArticle: "Selected story", selectedThought: "Selected thought", format: "Format",
    formats: { story: "9:16 Story", portrait: "4:5 Feed", square: "1:1 Square" }, variant: "Variant",
    variants: { editorial: "Editorial", marginNote: "Margin Note", statement: "Statement" }, previous: "Previous", next: "Next",
    cardProgress: "Card {current} of {total}", screenshotMode: "Screenshot mode", screenshotHint: "Clean capture view. Press Escape to leave screenshot mode.",
    exitScreenshot: "Exit screenshot mode", copyLink: "Copy link", copyText: "Copy text + link", manualCopy: "Text for manual copying", copied: "Copied", clipboardFailed: "Copying is unavailable. Select the text below instead.",
    share: "Share", shareFailed: "Sharing is unavailable. Use Copy link or Screenshot mode.", close: "Close",
    tooLong: "This thought is too long for a share card. Choose a shorter section.", privatePreview: "Private preview — no public link will be created.",
    sourceLabel: "Writing", moreContext: "More context", keyThought: "Key thought", section: "Section",
  },
  es: {
    trigger: "Compartir esta idea", articleTrigger: "Compartir esta historia", dialogTitle: "Crear tarjeta para compartir", selectedArticle: "Historia seleccionada", selectedThought: "Idea seleccionada", format: "Formato",
    formats: { story: "9:16 Historia", portrait: "4:5 Feed", square: "1:1 Cuadrado" }, variant: "Variante",
    variants: { editorial: "Editorial", marginNote: "Nota al margen", statement: "Declaración" }, previous: "Anterior", next: "Siguiente",
    cardProgress: "Tarjeta {current} de {total}", screenshotMode: "Modo captura", screenshotHint: "Vista limpia para capturar. Pulsa Escape para salir.",
    exitScreenshot: "Salir del modo captura", copyLink: "Copiar enlace", copyText: "Copiar texto y enlace", manualCopy: "Texto para copiar manualmente", copied: "Copiado", clipboardFailed: "No se puede copiar. Selecciona el texto de abajo.",
    share: "Compartir", shareFailed: "No se puede compartir. Usa Copiar enlace o el modo captura.", close: "Cerrar",
    tooLong: "Esta idea es demasiado larga para una tarjeta. Elige una sección más corta.", privatePreview: "Vista previa privada: no se creará ningún enlace público.",
    sourceLabel: "Writing", moreContext: "Más contexto", keyThought: "Idea clave", section: "Sección",
  },
  tr: {
    trigger: "Bu düşünceyi paylaş", articleTrigger: "Bu hikâyeyi paylaş", dialogTitle: "Paylaşım kartı oluştur", selectedArticle: "Seçilen hikâye", selectedThought: "Seçilen düşünce", format: "Biçim",
    formats: { story: "9:16 Hikâye", portrait: "4:5 Akış", square: "1:1 Kare" }, variant: "Varyant",
    variants: { editorial: "Editoryal", marginNote: "Kenar Notu", statement: "İfade" }, previous: "Önceki", next: "Sonraki",
    cardProgress: "Kart {current} / {total}", screenshotMode: "Ekran görüntüsü modu", screenshotHint: "Temiz çekim görünümü. Çıkmak için Escape tuşuna bas.",
    exitScreenshot: "Ekran görüntüsü modundan çık", copyLink: "Bağlantıyı kopyala", copyText: "Metni ve bağlantıyı kopyala", manualCopy: "Elle kopyalanacak metin", copied: "Kopyalandı", clipboardFailed: "Kopyalama kullanılamıyor. Aşağıdaki metni seç.",
    share: "Paylaş", shareFailed: "Paylaşım kullanılamıyor. Bağlantıyı kopyala veya ekran görüntüsü modunu kullan.", close: "Kapat",
    tooLong: "Bu düşünce paylaşım kartı için çok uzun. Daha kısa bir bölüm seç.", privatePreview: "Özel önizleme — herkese açık bağlantı oluşturulmaz.",
    sourceLabel: "Writing", moreContext: "Daha fazla bağlam", keyThought: "Ana düşünce", section: "Bölüm",
  },
  pl: {
    trigger: "Udostępnij tę myśl", articleTrigger: "Udostępnij tę historię", dialogTitle: "Utwórz kartę do udostępnienia", selectedArticle: "Wybrana historia", selectedThought: "Wybrana myśl", format: "Format",
    formats: { story: "9:16 Relacja", portrait: "4:5 Aktualności", square: "1:1 Kwadrat" }, variant: "Wariant",
    variants: { editorial: "Redakcyjny", marginNote: "Notatka na marginesie", statement: "Stwierdzenie" }, previous: "Wstecz", next: "Dalej",
    cardProgress: "Karta {current} z {total}", screenshotMode: "Tryb zrzutu ekranu", screenshotHint: "Czysty widok do przechwycenia. Naciśnij Escape, aby wyjść.",
    exitScreenshot: "Wyjdź z trybu zrzutu", copyLink: "Kopiuj link", copyText: "Kopiuj tekst i link", manualCopy: "Tekst do ręcznego skopiowania", copied: "Skopiowano", clipboardFailed: "Kopiowanie jest niedostępne. Zaznacz tekst poniżej.",
    share: "Udostępnij", shareFailed: "Udostępnianie jest niedostępne. Skopiuj link lub użyj trybu zrzutu.", close: "Zamknij",
    tooLong: "Ta myśl jest zbyt długa na kartę. Wybierz krótszy fragment.", privatePreview: "Prywatny podgląd — publiczny link nie zostanie utworzony.",
    sourceLabel: "Writing", moreContext: "Więcej kontekstu", keyThought: "Kluczowa myśl", section: "Sekcja",
  },
  el: {
    trigger: "Μοιράσου αυτή τη σκέψη", articleTrigger: "Μοιράσου αυτή την ιστορία", dialogTitle: "Δημιουργία κάρτας κοινοποίησης", selectedArticle: "Επιλεγμένη ιστορία", selectedThought: "Επιλεγμένη σκέψη", format: "Μορφή",
    formats: { story: "9:16 Ιστορία", portrait: "4:5 Ροή", square: "1:1 Τετράγωνο" }, variant: "Παραλλαγή",
    variants: { editorial: "Editorial", marginNote: "Σημείωση περιθωρίου", statement: "Δήλωση" }, previous: "Προηγούμενο", next: "Επόμενο",
    cardProgress: "Κάρτα {current} από {total}", screenshotMode: "Λειτουργία στιγμιότυπου", screenshotHint: "Καθαρή προβολή για λήψη. Πάτησε Escape για έξοδο.",
    exitScreenshot: "Έξοδος από τη λειτουργία στιγμιότυπου", copyLink: "Αντιγραφή συνδέσμου", copyText: "Αντιγραφή κειμένου και συνδέσμου", manualCopy: "Κείμενο για μη αυτόματη αντιγραφή", copied: "Αντιγράφηκε", clipboardFailed: "Η αντιγραφή δεν είναι διαθέσιμη. Επίλεξε το κείμενο παρακάτω.",
    share: "Κοινοποίηση", shareFailed: "Η κοινοποίηση δεν είναι διαθέσιμη. Αντέγραψε τον σύνδεσμο ή χρησιμοποίησε τη λειτουργία στιγμιότυπου.", close: "Κλείσιμο",
    tooLong: "Αυτή η σκέψη είναι πολύ μεγάλη για κάρτα. Επίλεξε μικρότερο απόσπασμα.", privatePreview: "Ιδιωτική προεπισκόπηση — δεν θα δημιουργηθεί δημόσιος σύνδεσμος.",
    sourceLabel: "Writing", moreContext: "Περισσότερο πλαίσιο", keyThought: "Βασική σκέψη", section: "Ενότητα",
  },
  ru: {
    trigger: "Поделиться этой мыслью", articleTrigger: "Поделиться этой историей", dialogTitle: "Создать карточку", selectedArticle: "Выбранная история", selectedThought: "Выбранная мысль", format: "Формат",
    formats: { story: "9:16 История", portrait: "4:5 Лента", square: "1:1 Квадрат" }, variant: "Вариант",
    variants: { editorial: "Редакционный", marginNote: "Заметка на полях", statement: "Высказывание" }, previous: "Назад", next: "Далее",
    cardProgress: "Карточка {current} из {total}", screenshotMode: "Режим снимка", screenshotHint: "Чистый вид для снимка. Нажмите Escape, чтобы выйти.",
    exitScreenshot: "Выйти из режима снимка", copyLink: "Копировать ссылку", copyText: "Копировать текст и ссылку", manualCopy: "Текст для ручного копирования", copied: "Скопировано", clipboardFailed: "Копирование недоступно. Выберите текст ниже.",
    share: "Поделиться", shareFailed: "Поделиться не удалось. Скопируйте ссылку или используйте режим снимка.", close: "Закрыть",
    tooLong: "Эта мысль слишком длинная для карточки. Выберите более короткий фрагмент.", privatePreview: "Приватный предпросмотр — публичная ссылка не будет создана.",
    sourceLabel: "Writing", moreContext: "Больше контекста", keyThought: "Ключевая мысль", section: "Раздел",
  },
} as const satisfies Record<Locale, WritingShareDictionary>;

export function getWritingShareDictionary(locale: Locale): WritingShareDictionary {
  return writingShareDictionaries[locale];
}
