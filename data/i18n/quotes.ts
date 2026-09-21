import type { Locale } from "@/lib/i18n/config";

export interface QuoteDictionary {
  dailyEyebrow: string;
  dailyTitle: string;
  dailyBody: string;
  reminderEyebrow: string;
  fynsEyebrow: string;
  another: string;
  share: string;
  original: string;
  dialogTitle: string;
  preview: string;
  format: string;
  formats: { story: string; portrait: string; square: string };
  copy: string;
  copied: string;
  copyFailed: string;
  nativeShare: string;
  shareFailed: string;
  screenshotMode: string;
  screenshotHint: string;
  exitScreenshot: string;
  close: string;
}

export const quoteDictionaries: Record<Locale, QuoteDictionary> = {
  de: { dailyEyebrow: "Quote of the Day", dailyTitle: "Ein Satz für heute.", dailyBody: "Jeden Tag ein BTS-originaler Gedanke. Gleiches Datum, gleicher Satz — bis du bewusst weitergehst.", reminderEyebrow: "Dein Reminder", fynsEyebrow: "Dein Satz", another: "Anderes Zitat", share: "Teilen", original: "BTS Original", dialogTitle: "Quote Share Card", preview: "Vorschau", format: "Format", formats: { story: "9:16 Story", portrait: "4:5 Feed", square: "1:1 Quadrat" }, copy: "Zitat kopieren", copied: "Kopiert", copyFailed: "Kopieren ist nicht verfügbar.", nativeShare: "Teilen", shareFailed: "Teilen ist nicht verfügbar. Nutze Kopieren oder Screenshot-Modus.", screenshotMode: "Screenshot-Modus", screenshotHint: "Saubere Ansicht für Instagram, TikTok und andere Apps. Escape beendet den Modus.", exitScreenshot: "Screenshot-Modus beenden", close: "Schließen" },
  en: { dailyEyebrow: "Quote of the Day", dailyTitle: "One sentence for today.", dailyBody: "One original BTS thought each day. Same date, same line — until you choose to explore.", reminderEyebrow: "Your Reminder", fynsEyebrow: "Your Quote", another: "Another quote", share: "Share", original: "BTS Original", dialogTitle: "Quote Share Card", preview: "Preview", format: "Format", formats: { story: "9:16 Story", portrait: "4:5 Feed", square: "1:1 Square" }, copy: "Copy quote", copied: "Copied", copyFailed: "Copying is unavailable.", nativeShare: "Share", shareFailed: "Sharing is unavailable. Use copy or screenshot mode.", screenshotMode: "Screenshot mode", screenshotHint: "Clean capture view for Instagram, TikTok and other apps. Press Escape to leave.", exitScreenshot: "Exit screenshot mode", close: "Close" },
  es: { dailyEyebrow: "Cita del día", dailyTitle: "Una frase para hoy.", dailyBody: "Cada día, un pensamiento original de BTS. Misma fecha, misma frase, hasta que decidas explorar.", reminderEyebrow: "Tu recordatorio", fynsEyebrow: "Tu frase", another: "Otra frase", share: "Compartir", original: "Original de BTS", dialogTitle: "Tarjeta para compartir", preview: "Vista previa", format: "Formato", formats: { story: "Story 9:16", portrait: "Feed 4:5", square: "Cuadrado 1:1" }, copy: "Copiar frase", copied: "Copiada", copyFailed: "No se puede copiar.", nativeShare: "Compartir", shareFailed: "No se puede compartir. Usa copiar o el modo captura.", screenshotMode: "Modo captura", screenshotHint: "Vista limpia para Instagram, TikTok y otras apps. Pulsa Escape para salir.", exitScreenshot: "Salir del modo captura", close: "Cerrar" },
  tr: { dailyEyebrow: "Günün Sözü", dailyTitle: "Bugün için bir cümle.", dailyBody: "Her gün BTS'e ait özgün bir düşünce. Aynı tarih, aynı cümle; sen keşfetmeyi seçene kadar.", reminderEyebrow: "Hatırlatıcın", fynsEyebrow: "Senin Sözün", another: "Başka bir söz", share: "Paylaş", original: "BTS Özgün", dialogTitle: "Söz Paylaşım Kartı", preview: "Önizleme", format: "Biçim", formats: { story: "9:16 Hikâye", portrait: "4:5 Akış", square: "1:1 Kare" }, copy: "Sözü kopyala", copied: "Kopyalandı", copyFailed: "Kopyalama kullanılamıyor.", nativeShare: "Paylaş", shareFailed: "Paylaşım kullanılamıyor. Kopyalamayı veya ekran görüntüsü modunu kullan.", screenshotMode: "Ekran görüntüsü modu", screenshotHint: "Instagram, TikTok ve diğer uygulamalar için temiz görünüm. Çıkmak için Escape'e bas.", exitScreenshot: "Ekran görüntüsü modundan çık", close: "Kapat" },
  pl: { dailyEyebrow: "Cytat dnia", dailyTitle: "Jedno zdanie na dziś.", dailyBody: "Codziennie jedna autorska myśl BTS. Ta sama data, to samo zdanie — dopóki nie wybierzesz dalszego odkrywania.", reminderEyebrow: "Twoje przypomnienie", fynsEyebrow: "Twój cytat", another: "Inny cytat", share: "Udostępnij", original: "Oryginał BTS", dialogTitle: "Karta cytatu", preview: "Podgląd", format: "Format", formats: { story: "Relacja 9:16", portrait: "Post 4:5", square: "Kwadrat 1:1" }, copy: "Kopiuj cytat", copied: "Skopiowano", copyFailed: "Kopiowanie jest niedostępne.", nativeShare: "Udostępnij", shareFailed: "Udostępnianie jest niedostępne. Użyj kopiowania lub trybu zrzutu.", screenshotMode: "Tryb zrzutu ekranu", screenshotHint: "Czysty widok dla Instagrama, TikToka i innych aplikacji. Escape kończy tryb.", exitScreenshot: "Wyjdź z trybu zrzutu", close: "Zamknij" },
  el: { dailyEyebrow: "Απόφθεγμα της ημέρας", dailyTitle: "Μία πρόταση για σήμερα.", dailyBody: "Κάθε μέρα μία πρωτότυπη σκέψη BTS. Ίδια ημερομηνία, ίδια φράση — μέχρι να επιλέξεις να εξερευνήσεις.", reminderEyebrow: "Η υπενθύμισή σου", fynsEyebrow: "Η φράση σου", another: "Άλλη φράση", share: "Κοινοποίηση", original: "Πρωτότυπο BTS", dialogTitle: "Κάρτα κοινοποίησης", preview: "Προεπισκόπηση", format: "Μορφή", formats: { story: "Story 9:16", portrait: "Feed 4:5", square: "Τετράγωνο 1:1" }, copy: "Αντιγραφή φράσης", copied: "Αντιγράφηκε", copyFailed: "Η αντιγραφή δεν είναι διαθέσιμη.", nativeShare: "Κοινοποίηση", shareFailed: "Η κοινοποίηση δεν είναι διαθέσιμη. Χρησιμοποίησε αντιγραφή ή λειτουργία στιγμιότυπου.", screenshotMode: "Λειτουργία στιγμιότυπου", screenshotHint: "Καθαρή προβολή για Instagram, TikTok και άλλες εφαρμογές. Πάτησε Escape για έξοδο.", exitScreenshot: "Έξοδος από τη λειτουργία στιγμιότυπου", close: "Κλείσιμο" },
  ru: { dailyEyebrow: "Цитата дня", dailyTitle: "Одна фраза на сегодня.", dailyBody: "Каждый день — одна авторская мысль BTS. Одна дата, одна фраза, пока ты сам не решишь продолжить.", reminderEyebrow: "Твоё напоминание", fynsEyebrow: "Твоя фраза", another: "Другая цитата", share: "Поделиться", original: "Оригинал BTS", dialogTitle: "Карточка с цитатой", preview: "Предпросмотр", format: "Формат", formats: { story: "История 9:16", portrait: "Лента 4:5", square: "Квадрат 1:1" }, copy: "Скопировать цитату", copied: "Скопировано", copyFailed: "Копирование недоступно.", nativeShare: "Поделиться", shareFailed: "Поделиться не удалось. Используй копирование или режим снимка.", screenshotMode: "Режим снимка", screenshotHint: "Чистый вид для Instagram, TikTok и других приложений. Нажми Escape, чтобы выйти.", exitScreenshot: "Выйти из режима снимка", close: "Закрыть" },
};
