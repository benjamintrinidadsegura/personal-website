import type { Locale } from "@/lib/i18n/config";

export type ShareFileDictionary = {
  preparing: string;
  shareViaDevice: string;
  downloadImage: string;
  copyImage: string;
  imageCopied: string;
  imageDownloaded: string;
  imageFailed: string;
  actionFailed: string;
  deviceHint: string;
  fallbackHint: string;
};

export const shareFileDictionaries: Record<Locale, ShareFileDictionary> = {
  de: { preparing: "Bild wird vorbereitet…", shareViaDevice: "Über Gerät teilen", downloadImage: "Bild speichern", copyImage: "Bild kopieren", imageCopied: "Bild kopiert.", imageDownloaded: "Download angefordert. Prüfe die Downloads deines Browsers.", imageFailed: "Das Bild konnte nicht vorbereitet werden. Nutze Text, Link oder Screenshot-Modus.", actionFailed: "Diese Aktion hat nicht funktioniert. Versuche Bild speichern, Link kopieren oder Screenshot-Modus.", deviceHint: "Dein Gerät zeigt die verfügbaren Apps. BTS wählt kein Ziel für dich.", fallbackHint: "Dateifreigabe ist hier nicht verfügbar. Speichere oder kopiere das Bild." },
  en: { preparing: "Preparing image…", shareViaDevice: "Share via device", downloadImage: "Save image", copyImage: "Copy image", imageCopied: "Image copied.", imageDownloaded: "Download requested. Check your browser downloads.", imageFailed: "The image could not be prepared. Use text, link, or Screenshot Mode.", actionFailed: "That action did not work. Try Save image, Copy link, or Screenshot Mode.", deviceHint: "Your device shows the available apps. BTS does not choose a destination for you.", fallbackHint: "File sharing is unavailable here. Save or copy the image instead." },
  es: { preparing: "Preparando imagen…", shareViaDevice: "Compartir desde el dispositivo", downloadImage: "Guardar imagen", copyImage: "Copiar imagen", imageCopied: "Imagen copiada.", imageDownloaded: "Descarga solicitada. Comprueba las descargas del navegador.", imageFailed: "No se pudo preparar la imagen. Usa texto, enlace o el modo captura.", actionFailed: "La acción falló. Prueba Guardar imagen, Copiar enlace o el modo captura.", deviceHint: "Tu dispositivo muestra las apps disponibles. BTS no elige el destino.", fallbackHint: "Aquí no se pueden compartir archivos. Guarda o copia la imagen." },
  tr: { preparing: "Görsel hazırlanıyor…", shareViaDevice: "Cihaz üzerinden paylaş", downloadImage: "Görseli kaydet", copyImage: "Görseli kopyala", imageCopied: "Görsel kopyalandı.", imageDownloaded: "İndirme istendi. Tarayıcı indirmelerini kontrol et.", imageFailed: "Görsel hazırlanamadı. Metin, bağlantı veya ekran görüntüsü modunu kullan.", actionFailed: "İşlem başarısız oldu. Görseli kaydetmeyi, bağlantıyı kopyalamayı veya ekran görüntüsü modunu dene.", deviceHint: "Cihazın kullanılabilir uygulamaları gösterir. Hedefi BTS seçmez.", fallbackHint: "Dosya paylaşımı burada kullanılamıyor. Görseli kaydet veya kopyala." },
  pl: { preparing: "Przygotowywanie obrazu…", shareViaDevice: "Udostępnij przez urządzenie", downloadImage: "Zapisz obraz", copyImage: "Kopiuj obraz", imageCopied: "Obraz skopiowany.", imageDownloaded: "Żądanie pobrania wysłane. Sprawdź pobrane pliki w przeglądarce.", imageFailed: "Nie udało się przygotować obrazu. Użyj tekstu, linku lub trybu zrzutu.", actionFailed: "Ta czynność nie powiodła się. Spróbuj zapisać obraz, skopiować link lub użyć trybu zrzutu.", deviceHint: "Urządzenie pokaże dostępne aplikacje. BTS nie wybiera miejsca docelowego.", fallbackHint: "Udostępnianie plików jest tu niedostępne. Zapisz lub skopiuj obraz." },
  el: { preparing: "Προετοιμασία εικόνας…", shareViaDevice: "Κοινοποίηση μέσω συσκευής", downloadImage: "Αποθήκευση εικόνας", copyImage: "Αντιγραφή εικόνας", imageCopied: "Η εικόνα αντιγράφηκε.", imageDownloaded: "Ζητήθηκε λήψη. Έλεγξε τις λήψεις του προγράμματος περιήγησης.", imageFailed: "Η εικόνα δεν μπόρεσε να ετοιμαστεί. Χρησιμοποίησε κείμενο, σύνδεσμο ή λειτουργία στιγμιότυπου.", actionFailed: "Η ενέργεια απέτυχε. Δοκίμασε αποθήκευση εικόνας, αντιγραφή συνδέσμου ή λειτουργία στιγμιότυπου.", deviceHint: "Η συσκευή σου εμφανίζει τις διαθέσιμες εφαρμογές. Το BTS δεν επιλέγει προορισμό.", fallbackHint: "Η κοινοποίηση αρχείων δεν είναι διαθέσιμη εδώ. Αποθήκευσε ή αντέγραψε την εικόνα." },
  ru: { preparing: "Подготовка изображения…", shareViaDevice: "Поделиться через устройство", downloadImage: "Сохранить изображение", copyImage: "Копировать изображение", imageCopied: "Изображение скопировано.", imageDownloaded: "Запрошена загрузка. Проверьте загрузки браузера.", imageFailed: "Не удалось подготовить изображение. Используйте текст, ссылку или режим снимка.", actionFailed: "Действие не удалось. Попробуйте сохранить изображение, скопировать ссылку или использовать режим снимка.", deviceHint: "Устройство покажет доступные приложения. BTS не выбирает получателя.", fallbackHint: "Обмен файлами здесь недоступен. Сохраните или скопируйте изображение." },
};

export function getShareFileDictionary(locale: Locale): ShareFileDictionary {
  return shareFileDictionaries[locale];
}
