import type { Locale } from "@/lib/i18n/config";

export interface FynsCharacterShareDictionary {
  trigger: string;
  dialogTitle: string;
  preview: string;
  format: string;
  formats: { story: string; portrait: string; square: string };
  character: string;
  supporting: string;
  copy: string;
  copied: string;
  copyFailed: string;
  nativeShare: string;
  shareFailed: string;
  screenshotMode: string;
  screenshotHint: string;
  exitScreenshot: string;
  close: string;
  privatePreview: string;
}

export const fynsCharacterShareCopy: Record<Locale, FynsCharacterShareDictionary> = {
  de: { trigger: "Character teilen", dialogTitle: "Deine FYNS Character Card", preview: "Vorschau", format: "Format", formats: { story: "9:16 Story", portrait: "4:5 Feed", square: "1:1 Quadrat" }, character: "Dein Character", supporting: "Prägt dich ebenfalls", copy: "Text kopieren", copied: "Kopiert", copyFailed: "Kopieren ist nicht verfügbar.", nativeShare: "Teilen", shareFailed: "Teilen ist nicht verfügbar. Nutze Kopieren oder Screenshot-Modus.", screenshotMode: "Screenshot-Modus", screenshotHint: "Saubere Ansicht für Instagram, TikTok und andere Apps. Escape beendet den Modus.", exitScreenshot: "Screenshot-Modus beenden", close: "Schließen", privatePreview: "Private Vorschau — Antworten und interne Ergebnisdaten werden nicht geteilt." },
  en: { trigger: "Share Character", dialogTitle: "Your FYNS Character Card", preview: "Preview", format: "Format", formats: { story: "9:16 Story", portrait: "4:5 Feed", square: "1:1 Square" }, character: "Your Character", supporting: "Also shapes how you operate", copy: "Copy text", copied: "Copied", copyFailed: "Copying is unavailable.", nativeShare: "Share", shareFailed: "Sharing is unavailable. Use copy or Screenshot Mode.", screenshotMode: "Screenshot Mode", screenshotHint: "Clean capture view for Instagram, TikTok and other apps. Press Escape to leave.", exitScreenshot: "Exit Screenshot Mode", close: "Close", privatePreview: "Private preview — answers and internal result data are not shared." },
  es: { trigger: "Compartir Character", dialogTitle: "Tu tarjeta de Character FYNS", preview: "Vista previa", format: "Formato", formats: { story: "Story 9:16", portrait: "Feed 4:5", square: "Cuadrado 1:1" }, character: "Tu Character", supporting: "También influye en tu forma de actuar", copy: "Copiar texto", copied: "Copiado", copyFailed: "No se puede copiar.", nativeShare: "Compartir", shareFailed: "No se puede compartir. Usa copiar o el modo captura.", screenshotMode: "Modo captura", screenshotHint: "Vista limpia para Instagram, TikTok y otras apps. Pulsa Escape para salir.", exitScreenshot: "Salir del modo captura", close: "Cerrar", privatePreview: "Vista privada: no se comparten respuestas ni datos internos del resultado." },
  tr: { trigger: "Character'ı paylaş", dialogTitle: "FYNS Character kartın", preview: "Önizleme", format: "Biçim", formats: { story: "9:16 Hikâye", portrait: "4:5 Akış", square: "1:1 Kare" }, character: "Senin Character'ın", supporting: "Hareket etme biçimini de şekillendiriyor", copy: "Metni kopyala", copied: "Kopyalandı", copyFailed: "Kopyalama kullanılamıyor.", nativeShare: "Paylaş", shareFailed: "Paylaşım kullanılamıyor. Kopyalamayı veya ekran görüntüsü modunu kullan.", screenshotMode: "Ekran görüntüsü modu", screenshotHint: "Instagram, TikTok ve diğer uygulamalar için temiz görünüm. Çıkmak için Escape'e bas.", exitScreenshot: "Ekran görüntüsü modundan çık", close: "Kapat", privatePreview: "Özel önizleme — yanıtlar ve dahili sonuç verileri paylaşılmaz." },
  pl: { trigger: "Udostępnij Character", dialogTitle: "Twoja karta Character FYNS", preview: "Podgląd", format: "Format", formats: { story: "Relacja 9:16", portrait: "Post 4:5", square: "Kwadrat 1:1" }, character: "Twój Character", supporting: "Także kształtuje Twój sposób działania", copy: "Kopiuj tekst", copied: "Skopiowano", copyFailed: "Kopiowanie jest niedostępne.", nativeShare: "Udostępnij", shareFailed: "Udostępnianie jest niedostępne. Użyj kopiowania lub trybu zrzutu.", screenshotMode: "Tryb zrzutu ekranu", screenshotHint: "Czysty widok dla Instagrama, TikToka i innych aplikacji. Escape kończy tryb.", exitScreenshot: "Wyjdź z trybu zrzutu", close: "Zamknij", privatePreview: "Prywatny podgląd — odpowiedzi i wewnętrzne dane wyniku nie są udostępniane." },
  el: { trigger: "Κοινοποίηση Character", dialogTitle: "Η κάρτα FYNS Character σου", preview: "Προεπισκόπηση", format: "Μορφή", formats: { story: "Story 9:16", portrait: "Feed 4:5", square: "Τετράγωνο 1:1" }, character: "Το Character σου", supporting: "Διαμορφώνει επίσης τον τρόπο που λειτουργείς", copy: "Αντιγραφή κειμένου", copied: "Αντιγράφηκε", copyFailed: "Η αντιγραφή δεν είναι διαθέσιμη.", nativeShare: "Κοινοποίηση", shareFailed: "Η κοινοποίηση δεν είναι διαθέσιμη. Χρησιμοποίησε αντιγραφή ή λειτουργία στιγμιότυπου.", screenshotMode: "Λειτουργία στιγμιότυπου", screenshotHint: "Καθαρή προβολή για Instagram, TikTok και άλλες εφαρμογές. Πάτησε Escape για έξοδο.", exitScreenshot: "Έξοδος από τη λειτουργία στιγμιότυπου", close: "Κλείσιμο", privatePreview: "Ιδιωτική προεπισκόπηση — οι απαντήσεις και τα εσωτερικά δεδομένα αποτελέσματος δεν κοινοποιούνται." },
  ru: { trigger: "Поделиться Character", dialogTitle: "Твоя карточка FYNS Character", preview: "Предпросмотр", format: "Формат", formats: { story: "История 9:16", portrait: "Лента 4:5", square: "Квадрат 1:1" }, character: "Твой Character", supporting: "Это тоже влияет на то, как ты действуешь", copy: "Копировать текст", copied: "Скопировано", copyFailed: "Копирование недоступно.", nativeShare: "Поделиться", shareFailed: "Поделиться не удалось. Используй копирование или режим снимка.", screenshotMode: "Режим снимка", screenshotHint: "Чистый вид для Instagram, TikTok и других приложений. Нажми Escape, чтобы выйти.", exitScreenshot: "Выйти из режима снимка", close: "Закрыть", privatePreview: "Приватный предпросмотр — ответы и внутренние данные результата не передаются." },
};
