import type { Locale } from "@/lib/i18n/config";

export const echoCountryDisplayCopy = {
  de: ["Land suchen", "Meine Flagge erscheint nach Freigabe öffentlich neben meinem Namen. Das Land ist eine freiwillige Zuordnung.", "Einreichungen sind deaktiviert.", "Veröffentlichte Echos kannst du weiterhin lesen."],
  en: ["Find a country", "After approval, my flag appears publicly beside my display name. The country is a voluntary association.", "Submissions are disabled.", "You can still read published Echoes."],
  es: ["Buscar un país", "Tras la aprobación, mi bandera aparecerá junto a mi nombre público. La asociación con el país es voluntaria.", "Los envíos están desactivados.", "Puedes seguir leyendo los ecos publicados."],
  tr: ["Ülke ara", "Onaydan sonra bayrağım görünen adımın yanında herkese gösterilir. Ülke seçimi gönüllüdür.", "Gönderimler kapalı.", "Yayımlanmış Echo mesajlarını okumaya devam edebilirsin."],
  pl: ["Znajdź kraj", "Po zatwierdzeniu flaga będzie publicznie widoczna obok mojej nazwy. Wskazanie kraju jest dobrowolne.", "Dodawanie wpisów jest wyłączone.", "Nadal możesz czytać opublikowane wpisy."],
  el: ["Αναζήτηση χώρας", "Μετά την έγκριση, η σημαία μου εμφανίζεται δημόσια δίπλα στο όνομά μου. Η επιλογή χώρας είναι προαιρετική.", "Οι υποβολές είναι απενεργοποιημένες.", "Μπορείς να διαβάζεις τις δημοσιευμένες αναρτήσεις."],
  ru: ["Найти страну", "После одобрения флаг будет виден рядом с моим именем. Указание страны добровольно.", "Отправка отключена.", "Опубликованные отклики по-прежнему доступны."],
} satisfies Record<Locale, readonly [string, string, string, string]>;