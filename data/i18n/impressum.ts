import type { Locale } from "@/lib/i18n/config";

export type ImprintCopy = {
  title: string;
  description: string;
  breadcrumb: string;
  eyebrow: string;
  heading: string;
  intro: string;
  operatorTitle: string;
  operatorStatus: string;
  addressLabel: string;
  country: string;
  contactLabel: string;
  editorialTitle: string;
  editorialBody: string;
  languageNoticeTitle: string;
  germanReference: string;
};

export const imprintCopy = {
  de: {
    title: "Impressum | btshq.online",
    description: "Anbieterkennzeichnung und Kontakt für btshq.online.",
    breadcrumb: "Impressum",
    eyebrow: "Rechtliche Angaben / btshq.online",
    heading: "Impressum",
    intro: "Angaben gemäß § 5 DDG für das persönliche Digital HQ btshq.online.",
    operatorTitle: "Diensteanbieter",
    operatorStatus: "Betrieben als Privatperson",
    addressLabel: "Ladungsfähige Anschrift",
    country: "Deutschland",
    contactLabel: "Elektronischer Kontakt",
    editorialTitle: "Redaktionelle Verantwortung",
    editorialBody: "Verantwortlich für journalistisch-redaktionelle Inhalte, soweit § 18 Abs. 2 MStV anwendbar:",
    languageNoticeTitle: "Sprachhinweis",
    germanReference: "Die deutsche Fassung ist die maßgebliche Version. Übersetzungen dienen der besseren Verständlichkeit.",
  },
  en: {
    title: "Legal notice | btshq.online", description: "Provider identification and contact details for btshq.online.", breadcrumb: "Legal notice", eyebrow: "Legal information / btshq.online", heading: "Legal notice", intro: "Provider information under section 5 of the German Digital Services Act (DDG) for the personal Digital HQ btshq.online.", operatorTitle: "Service provider", operatorStatus: "Operated as a private individual", addressLabel: "Serviceable postal address", country: "Germany", contactLabel: "Electronic contact", editorialTitle: "Editorial responsibility", editorialBody: "Responsible for journalistic-editorial content where section 18(2) MStV applies:", languageNoticeTitle: "Language note", germanReference: "The German version is authoritative. Translations are provided to improve understanding.",
  },
  es: {
    title: "Aviso legal | btshq.online", description: "Identificación y contacto del responsable de btshq.online.", breadcrumb: "Aviso legal", eyebrow: "Información legal / btshq.online", heading: "Aviso legal", intro: "Información del prestador conforme al artículo 5 de la ley alemana DDG para el Digital HQ personal btshq.online.", operatorTitle: "Prestador del servicio", operatorStatus: "Gestionado como persona privada", addressLabel: "Dirección válida a efectos de notificación", country: "Alemania", contactLabel: "Contacto electrónico", editorialTitle: "Responsabilidad editorial", editorialBody: "Responsable del contenido periodístico-editorial cuando sea aplicable el artículo 18(2) MStV:", languageNoticeTitle: "Nota sobre el idioma", germanReference: "La versión alemana es la versión autorizada. Las traducciones facilitan la comprensión.",
  },
  tr: {
    title: "Yasal bildirim | btshq.online", description: "btshq.online hizmet sağlayıcısı ve iletişim bilgileri.", breadcrumb: "Yasal bildirim", eyebrow: "Yasal bilgiler / btshq.online", heading: "Yasal bildirim", intro: "Kişisel Digital HQ btshq.online için Alman DDG § 5 uyarınca hizmet sağlayıcı bilgileri.", operatorTitle: "Hizmet sağlayıcı", operatorStatus: "Özel kişi olarak işletilmektedir", addressLabel: "Tebligata elverişli posta adresi", country: "Almanya", contactLabel: "Elektronik iletişim", editorialTitle: "Editoryal sorumluluk", editorialBody: "MStV § 18(2) uygulanabildiği ölçüde gazetecilik ve editoryal içerikten sorumlu kişi:", languageNoticeTitle: "Dil notu", germanReference: "Almanca sürüm esas sürümdür. Çeviriler daha iyi anlaşılmasını sağlamak amacıyla sunulur.",
  },
  pl: {
    title: "Nota prawna | btshq.online", description: "Dane usługodawcy i kontakt dla btshq.online.", breadcrumb: "Nota prawna", eyebrow: "Informacje prawne / btshq.online", heading: "Nota prawna", intro: "Dane usługodawcy zgodnie z § 5 niemieckiej ustawy DDG dla osobistego Digital HQ btshq.online.", operatorTitle: "Usługodawca", operatorStatus: "Prowadzone przez osobę prywatną", addressLabel: "Adres do doręczeń", country: "Niemcy", contactLabel: "Kontakt elektroniczny", editorialTitle: "Odpowiedzialność redakcyjna", editorialBody: "Osoba odpowiedzialna za treści dziennikarsko-redakcyjne, o ile zastosowanie ma § 18 ust. 2 MStV:", languageNoticeTitle: "Informacja językowa", germanReference: "Wersja niemiecka jest wersją miarodajną. Tłumaczenia służą lepszemu zrozumieniu treści.",
  },
  el: {
    title: "Νομικές πληροφορίες | btshq.online", description: "Στοιχεία παρόχου και επικοινωνίας για το btshq.online.", breadcrumb: "Νομικές πληροφορίες", eyebrow: "Νομικά στοιχεία / btshq.online", heading: "Νομικές πληροφορίες", intro: "Στοιχεία παρόχου σύμφωνα με το § 5 του γερμανικού DDG για το προσωπικό Digital HQ btshq.online.", operatorTitle: "Πάροχος υπηρεσίας", operatorStatus: "Λειτουργεί από ιδιώτη", addressLabel: "Ταχυδρομική διεύθυνση επίδοσης", country: "Γερμανία", contactLabel: "Ηλεκτρονική επικοινωνία", editorialTitle: "Συντακτική ευθύνη", editorialBody: "Υπεύθυνος για δημοσιογραφικό-συντακτικό περιεχόμενο, όπου εφαρμόζεται το § 18(2) MStV:", languageNoticeTitle: "Γλωσσική σημείωση", germanReference: "Η γερμανική έκδοση είναι η επίσημη έκδοση. Οι μεταφράσεις παρέχονται για καλύτερη κατανόηση.",
  },
  ru: {
    title: "Правовая информация | btshq.online", description: "Данные поставщика услуги и контакты btshq.online.", breadcrumb: "Правовая информация", eyebrow: "Правовые сведения / btshq.online", heading: "Правовая информация", intro: "Сведения о поставщике согласно § 5 немецкого закона DDG для личного Digital HQ btshq.online.", operatorTitle: "Поставщик услуги", operatorStatus: "Управляется частным лицом", addressLabel: "Адрес для вручения корреспонденции", country: "Германия", contactLabel: "Электронная связь", editorialTitle: "Редакционная ответственность", editorialBody: "Ответственный за журналистские и редакционные материалы, если применим § 18(2) MStV:", languageNoticeTitle: "Языковое примечание", germanReference: "Немецкая версия является основной. Переводы помогают лучше понять содержание.",
  },
} as const satisfies Record<Locale, ImprintCopy>;
