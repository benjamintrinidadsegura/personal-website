import type { Locale } from "@/lib/i18n/config";

const de = {
  siteDescription: "Persönliche Website von Benjamin Trinidad Segura über Recruiting, Projekte, Geschichten, Karriere und Communities.",
  skipLink: "Zum Inhalt springen",
  breadcrumbNavigation: "Navigationspfad",
  homeLabel: "bts.online – Startseite",
  mainNavigation: "Hauptnavigation",
  mobileNavigation: "Mobile Navigation",
  hqNavigation: "Durch das HQ navigieren",
  menuOpen: "Menü öffnen",
  menuClose: "Menü schließen",
  languageNavigation: "Sprache wählen",
  switchTo: "Sprache wechseln zu",
  accountMenuOpen: "Kontomenü öffnen",
  footerNavigation: "Fußnavigation",
  nav: {
    home: "Home",
    about: "Über mich",
    projects: "Projekte",
    allProjects: "Alle Projekte",
    insights: "Einblicke",
    pulse: "Pulse",
    writing: "Writing",
    people: "People / Interviews",
    worldMap: "World Map",
    tools: "Tools",
    partners: "Partner",
    contact: "Kontakt",
  },
  account: { login: "Einloggen", logout: "Ausloggen", verifyStudio: "Für BTS Studio verifizieren", editArticle: "Artikel bearbeiten", echoWallModeration: "EchoWall moderieren" },
  footer: { owner: "Das Digital HQ von Benjamin Trinidad Segura", signal: "Geschichten. Karrieren. Communities.", contact: "Kontakt & Social", privacy: "Datenschutz", evolving: "Immer in Bewegung" },
} as const;

type WidenStrings<T> = {
  [Key in keyof T]: T[Key] extends string
    ? string
    : T[Key] extends Record<string, unknown>
      ? WidenStrings<T[Key]>
      : T[Key];
};

type GlobalDictionary = WidenStrings<typeof de>;

const en: GlobalDictionary = {
  siteDescription: "Benjamin Trinidad Segura’s personal website for recruiting, projects, stories, careers and communities.",
  skipLink: "Skip to content",
  breadcrumbNavigation: "Breadcrumb",
  homeLabel: "bts.online – Home",
  mainNavigation: "Main navigation",
  mobileNavigation: "Mobile navigation",
  hqNavigation: "Navigate the HQ",
  menuOpen: "Open menu",
  menuClose: "Close menu",
  languageNavigation: "Choose language",
  switchTo: "Switch language to",
  accountMenuOpen: "Open account menu",
  footerNavigation: "Footer navigation",
  nav: {
    home: "Home",
    about: "About",
    projects: "Projects",
    allProjects: "All projects",
    insights: "Insights",
    pulse: "Pulse",
    writing: "Writing",
    people: "People / Interviews",
    worldMap: "World Map",
    tools: "Tools",
    partners: "Partners",
    contact: "Contact",
  },
  account: { login: "Log in", logout: "Log out", verifyStudio: "Verify to access BTS Studio", editArticle: "Edit this article", echoWallModeration: "Moderate EchoWall" },
  footer: { owner: "Benjamin Trinidad Segura’s Digital HQ", signal: "Stories. Careers. Communities.", contact: "Contact & Social", privacy: "Privacy", evolving: "Always evolving" },
};

const es: GlobalDictionary = {
  siteDescription: "La web personal de Benjamin Trinidad Segura sobre selección de talento, proyectos, historias, carreras y comunidades.",
  skipLink: "Saltar al contenido", breadcrumbNavigation: "Ruta de navegación", homeLabel: "bts.online – Inicio",
  mainNavigation: "Navegación principal", mobileNavigation: "Navegación móvil", hqNavigation: "Recorre el HQ", menuOpen: "Abrir menú", menuClose: "Cerrar menú",
  languageNavigation: "Elegir idioma", switchTo: "Cambiar idioma a", accountMenuOpen: "Abrir menú de cuenta", footerNavigation: "Navegación del pie",
  nav: { home: "Inicio", about: "Sobre mí", projects: "Proyectos", allProjects: "Todos los proyectos", insights: "Perspectivas", pulse: "Pulse", writing: "Writing", people: "Personas / Entrevistas", worldMap: "Mapa mundial", tools: "Herramientas", partners: "Colaboraciones", contact: "Contacto" },
  account: { login: "Iniciar sesión", logout: "Cerrar sesión", verifyStudio: "Verificar acceso a BTS Studio", editArticle: "Editar este artículo", echoWallModeration: "Moderar EchoWall" },
  footer: { owner: "El Digital HQ de Benjamin Trinidad Segura", signal: "Historias. Trayectorias. Comunidades.", contact: "Contacto y redes", privacy: "Privacidad", evolving: "Siempre en evolución" },
};

const tr: GlobalDictionary = {
  siteDescription: "Benjamin Trinidad Segura’nın işe alım, projeler, hikâyeler, kariyerler ve topluluklar üzerine kişisel web sitesi.",
  skipLink: "İçeriğe geç", breadcrumbNavigation: "Gezinti yolu", homeLabel: "bts.online – Ana sayfa",
  mainNavigation: "Ana gezinme", mobileNavigation: "Mobil gezinme", hqNavigation: "HQ içinde gezin", menuOpen: "Menüyü aç", menuClose: "Menüyü kapat",
  languageNavigation: "Dil seç", switchTo: "Dili şuna değiştir", accountMenuOpen: "Hesap menüsünü aç", footerNavigation: "Alt bilgi gezinmesi",
  nav: { home: "Ana sayfa", about: "Hakkımda", projects: "Projeler", allProjects: "Tüm projeler", insights: "İçgörüler", pulse: "Pulse", writing: "Yazılar", people: "İnsanlar / Röportajlar", worldMap: "Dünya Haritası", tools: "Araçlar", partners: "İş ortakları", contact: "İletişim" },
  account: { login: "Giriş yap", logout: "Çıkış yap", verifyStudio: "BTS Studio erişimini doğrula", editArticle: "Bu yazıyı düzenle", echoWallModeration: "EchoWall moderasyonu" },
  footer: { owner: "Benjamin Trinidad Segura’nın Digital HQ’su", signal: "Hikâyeler. Kariyerler. Topluluklar.", contact: "İletişim ve sosyal medya", privacy: "Gizlilik", evolving: "Sürekli gelişiyor" },
};

const pl: GlobalDictionary = {
  siteDescription: "Osobista strona Benjamina Trinidada Segury o rekrutacji, projektach, historiach, karierze i społecznościach.",
  skipLink: "Przejdź do treści", breadcrumbNavigation: "Okruszki nawigacyjne", homeLabel: "bts.online – Strona główna",
  mainNavigation: "Główna nawigacja", mobileNavigation: "Nawigacja mobilna", hqNavigation: "Poruszaj się po HQ", menuOpen: "Otwórz menu", menuClose: "Zamknij menu",
  languageNavigation: "Wybierz język", switchTo: "Zmień język na", accountMenuOpen: "Otwórz menu konta", footerNavigation: "Nawigacja w stopce",
  nav: { home: "Strona główna", about: "O mnie", projects: "Projekty", allProjects: "Wszystkie projekty", insights: "Perspektywy", pulse: "Pulse", writing: "Teksty", people: "Ludzie / Wywiady", worldMap: "Mapa świata", tools: "Narzędzia", partners: "Partnerzy", contact: "Kontakt" },
  account: { login: "Zaloguj się", logout: "Wyloguj się", verifyStudio: "Potwierdź dostęp do BTS Studio", editArticle: "Edytuj ten artykuł", echoWallModeration: "Moderacja EchoWall" },
  footer: { owner: "Digital HQ Benjamina Trinidada Segury", signal: "Historie. Kariery. Społeczności.", contact: "Kontakt i social media", privacy: "Prywatność", evolving: "W ciągłym rozwoju" },
};

const el: GlobalDictionary = {
  siteDescription: "Η προσωπική ιστοσελίδα του Benjamin Trinidad Segura για την προσέλκυση ταλέντων, τα έργα, τις ιστορίες, τη σταδιοδρομία και τις κοινότητες.",
  skipLink: "Μετάβαση στο περιεχόμενο", breadcrumbNavigation: "Διαδρομή πλοήγησης", homeLabel: "bts.online – Αρχική",
  mainNavigation: "Κύρια πλοήγηση", mobileNavigation: "Πλοήγηση για κινητά", hqNavigation: "Πλοήγηση στο HQ", menuOpen: "Άνοιγμα μενού", menuClose: "Κλείσιμο μενού",
  languageNavigation: "Επιλογή γλώσσας", switchTo: "Αλλαγή γλώσσας σε", accountMenuOpen: "Άνοιγμα μενού λογαριασμού", footerNavigation: "Πλοήγηση υποσέλιδου",
  nav: { home: "Αρχική", about: "Σχετικά", projects: "Έργα", allProjects: "Όλα τα έργα", insights: "Οπτικές", pulse: "Pulse", writing: "Κείμενα", people: "Άνθρωποι / Συνεντεύξεις", worldMap: "Παγκόσμιος χάρτης", tools: "Εργαλεία", partners: "Συνεργασίες", contact: "Επικοινωνία" },
  account: { login: "Σύνδεση", logout: "Αποσύνδεση", verifyStudio: "Επαλήθευση πρόσβασης στο BTS Studio", editArticle: "Επεξεργασία άρθρου", echoWallModeration: "Διαχείριση EchoWall" },
  footer: { owner: "Το Digital HQ του Benjamin Trinidad Segura", signal: "Ιστορίες. Σταδιοδρομίες. Κοινότητες.", contact: "Επικοινωνία και κοινωνικά δίκτυα", privacy: "Απόρρητο", evolving: "Σε συνεχή εξέλιξη" },
};

const ru: GlobalDictionary = {
  siteDescription: "Личный сайт Benjamin Trinidad Segura о рекрутинге, проектах, историях, карьере и сообществах.",
  skipLink: "Перейти к содержанию", breadcrumbNavigation: "Навигационная цепочка", homeLabel: "bts.online – Главная",
  mainNavigation: "Основная навигация", mobileNavigation: "Мобильная навигация", hqNavigation: "Навигация по HQ", menuOpen: "Открыть меню", menuClose: "Закрыть меню",
  languageNavigation: "Выбрать язык", switchTo: "Сменить язык на", accountMenuOpen: "Открыть меню аккаунта", footerNavigation: "Навигация в подвале",
  nav: { home: "Главная", about: "Обо мне", projects: "Проекты", allProjects: "Все проекты", insights: "Перспективы", pulse: "Pulse", writing: "Тексты", people: "Люди / Интервью", worldMap: "Карта мира", tools: "Инструменты", partners: "Партнёры", contact: "Контакты" },
  account: { login: "Войти", logout: "Выйти", verifyStudio: "Подтвердить доступ к BTS Studio", editArticle: "Редактировать статью", echoWallModeration: "Модерация EchoWall" },
  footer: { owner: "Digital HQ Benjamin Trinidad Segura", signal: "Истории. Карьеры. Сообщества.", contact: "Контакты и соцсети", privacy: "Конфиденциальность", evolving: "Постоянно развивается" },
};

export const globalDictionaries = { de, en, es, tr, pl, el, ru } as const satisfies Record<Locale, GlobalDictionary>;

export function getGlobalDictionary(locale: Locale): GlobalDictionary {
  return globalDictionaries[locale];
}
