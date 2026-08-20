import type { Locale } from "@/lib/i18n/config";

export const accountTitles = {
  de: "BTS-Konto",
  en: "BTS Account",
  es: "Cuenta BTS",
  tr: "BTS Hesabı",
  pl: "Konto BTS",
  el: "Λογαριασμός BTS",
  ru: "Аккаунт BTS",
} as const satisfies Record<Locale, string>;

type AccountCopy = {
  email: string;
  description: string;
  introduction: string;
  password: string;
  checking: string;
  login: string;
  loginFailure: string;
  profileSaveFailure: string;
  profileInvalid: string;
};

export const accountDictionaries = {
  de: { email: "E-Mail-Adresse", description: "Bei einem bestehenden bts.online-Konto anmelden.", introduction: "Melde dich bei deinem bestehenden bts.online-Konto an.", password: "Passwort", checking: "Wird geprüft…", login: "Einloggen", loginFailure: "Anmeldung nicht möglich.", profileSaveFailure: "Der Anzeigename konnte nicht gespeichert werden.", profileInvalid: "Verwende 2 bis 40 gültige Zeichen und keine reservierten Kennzeichnungen." },
  en: { email: "Email address", description: "Log in to an existing bts.online account.", introduction: "Log in to your existing bts.online account.", password: "Password", checking: "Checking…", login: "Log in", loginFailure: "Unable to log in.", profileSaveFailure: "Display name could not be saved.", profileInvalid: "Use 2 to 40 valid characters and avoid reserved labels." },
  es: { email: "Dirección de correo", description: "Inicia sesión en una cuenta existente de bts.online.", introduction: "Inicia sesión en tu cuenta de bts.online.", password: "Contraseña", checking: "Comprobando…", login: "Iniciar sesión", loginFailure: "No se pudo iniciar sesión.", profileSaveFailure: "No se pudo guardar el nombre visible.", profileInvalid: "Utiliza entre 2 y 40 caracteres válidos y evita las etiquetas reservadas." },
  tr: { email: "E-posta adresi", description: "Mevcut bir bts.online hesabına giriş yap.", introduction: "Mevcut bts.online hesabına giriş yap.", password: "Parola", checking: "Kontrol ediliyor…", login: "Giriş yap", loginFailure: "Giriş yapılamadı.", profileSaveFailure: "Görünen ad kaydedilemedi.", profileInvalid: "2–40 geçerli karakter kullan ve ayrılmış etiketlerden kaçın." },
  pl: { email: "Adres e-mail", description: "Zaloguj się do istniejącego konta bts.online.", introduction: "Zaloguj się do swojego konta bts.online.", password: "Hasło", checking: "Sprawdzanie…", login: "Zaloguj się", loginFailure: "Nie udało się zalogować.", profileSaveFailure: "Nie udało się zapisać wyświetlanej nazwy.", profileInvalid: "Użyj od 2 do 40 prawidłowych znaków i unikaj zastrzeżonych oznaczeń." },
  el: { email: "Διεύθυνση email", description: "Συνδέσου σε υπάρχοντα λογαριασμό bts.online.", introduction: "Συνδέσου στον λογαριασμό σου στο bts.online.", password: "Κωδικός πρόσβασης", checking: "Έλεγχος…", login: "Σύνδεση", loginFailure: "Η σύνδεση δεν ήταν δυνατή.", profileSaveFailure: "Το εμφανιζόμενο όνομα δεν μπόρεσε να αποθηκευτεί.", profileInvalid: "Χρησιμοποίησε 2–40 έγκυρους χαρακτήρες και απόφυγε τις δεσμευμένες ενδείξεις." },
  ru: { email: "Адрес электронной почты", description: "Войдите в существующий аккаунт bts.online.", introduction: "Войдите в свой аккаунт bts.online.", password: "Пароль", checking: "Проверка…", login: "Войти", loginFailure: "Не удалось войти.", profileSaveFailure: "Не удалось сохранить отображаемое имя.", profileInvalid: "Используйте от 2 до 40 допустимых символов и избегайте зарезервированных обозначений." },
} as const satisfies Record<Locale, AccountCopy>;

export function getAccountDictionary(locale: Locale): AccountCopy {
  return accountDictionaries[locale];
}
