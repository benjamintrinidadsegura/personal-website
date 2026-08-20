import type { Locale } from "@/lib/i18n/config";
import type { ProjectArea, ProjectStatus } from "@/types/content";

type ProjectPageCopy = {
  back: string;
  status: string;
  externalWebsite: string;
  visionEyebrow: string;
  visionTitle: string;
  valuesEyebrow: string;
  valuesTitle: string;
  areasEyebrow: string;
  areasTitle: string;
  exploreFormat: string;
  growingPlatform: string;
  servicesTitle: string;
  reachEyebrow: string;
  reachTitle: string;
  region: string;
  plannedEyebrow: string;
  plannedTitle: string;
  detailLabels: readonly [string, string, string, string];
  detailTitles: readonly [string, string, string, string];
  projectStatusLabel: string;
  mediaEyebrow: string;
  ecosystemNote: string;
  defaultContactCta: string;
  openProjectLabel: string;
  enterProject: string;
  sectionTitle: string;
  sectionDescription: string;
  statusLabels: Record<ProjectStatus, string>;
  areaStatusLabels: Record<NonNullable<ProjectArea["status"]>, string>;
};

const dictionaries: Record<Locale, ProjectPageCopy> = {
  de: {
    back: "← Zurück zum Digital HQ",
    status: "Status",
    externalWebsite: "Externe Website ↗",
    visionEyebrow: "Projektvision",
    visionTitle: "Was daraus werden kann.",
    valuesEyebrow: "Markenwerte",
    valuesTitle: "Was die Arbeit leitet.",
    areasEyebrow: "Formate & Bereiche",
    areasTitle: "Eine Marke. Mehrere Wege, Wirkung zu schaffen.",
    exploreFormat: "Format entdecken",
    growingPlatform: "Teil der wachsenden Plattform",
    servicesTitle: "Flexible Recruiting-Unterstützung.",
    reachEyebrow: "Erfahrung & Reichweite",
    reachTitle: "Branchen und Region.",
    region: "Region",
    plannedEyebrow: "Geplanter Kern",
    plannedTitle: "Geplante Kernelemente.",
    detailLabels: ["01 / Ausgangslage", "02 / Richtung", "03 / Signal", "04 / Als Nächstes"],
    detailTitles: ["Das Problem", "Das Ziel", "Aktueller Stand", "Nächste Schritte"],
    projectStatusLabel: "Projektstatus",
    mediaEyebrow: "Medien & Projektupdates",
    ecosystemNote: "Dieses Projekt ist Teil des wachsenden bts.online-Ökosystems.",
    defaultContactCta: "Gespräch beginnen",
    openProjectLabel: "Projektseite öffnen",
    enterProject: "Projekt öffnen",
    sectionTitle: "Ein wachsendes Ökosystem, kein fertiges Portfolio.",
    sectionDescription: "Sechs Ideen mit eigener Energie — verbunden durch Recruiting, Community, Content und den Wunsch, Erfahrung in etwas Nützliches zu verwandeln.",
    statusLabels: {
      Active: "Aktiv",
      "Active / Growing": "Aktiv / im Wachstum",
      Concept: "Konzept",
      "In Development": "In Entwicklung",
      Rebuild: "Neuaufbau",
      "Digital HQ": "Digital HQ",
    },
    areaStatusLabels: { Available: "Verfügbar", "In development": "In Entwicklung", "Coming soon": "Demnächst" },
  },
  en: {
    back: "← Back to the Digital HQ",
    status: "Status",
    externalWebsite: "External website ↗",
    visionEyebrow: "Project vision",
    visionTitle: "What this could become.",
    valuesEyebrow: "Brand values",
    valuesTitle: "What guides the work.",
    areasEyebrow: "Formats & areas",
    areasTitle: "One brand. Multiple ways to create impact.",
    exploreFormat: "Explore format",
    growingPlatform: "Part of the growing platform",
    servicesTitle: "Flexible recruiting support.",
    reachEyebrow: "Experience & reach",
    reachTitle: "Industries and region.",
    region: "Region",
    plannedEyebrow: "Planned core",
    plannedTitle: "Planned core elements.",
    detailLabels: ["01 / Starting point", "02 / Direction", "03 / Signal", "04 / Next"],
    detailTitles: ["The problem", "The goal", "Current state", "Next steps"],
    projectStatusLabel: "Project status",
    mediaEyebrow: "Media & project updates",
    ecosystemNote: "This project is part of the growing bts.online ecosystem.",
    defaultContactCta: "Start a conversation",
    openProjectLabel: "Open project page",
    enterProject: "Enter project",
    sectionTitle: "A growing ecosystem, not a finished portfolio.",
    sectionDescription: "Six ideas with energy of their own — connected by recruiting, community, content and a desire to turn experience into something useful.",
    statusLabels: {
      Active: "Active",
      "Active / Growing": "Active / Growing",
      Concept: "Concept",
      "In Development": "In Development",
      Rebuild: "Rebuild",
      "Digital HQ": "Digital HQ",
    },
    areaStatusLabels: { Available: "Available", "In development": "In development", "Coming soon": "Coming soon" },
  },
  es: {
    back: "← Volver al Digital HQ", status: "Estado", externalWebsite: "Sitio web externo ↗", visionEyebrow: "Visión del proyecto", visionTitle: "En qué puede convertirse.", valuesEyebrow: "Valores de marca", valuesTitle: "Lo que guía el trabajo.", areasEyebrow: "Formatos y áreas", areasTitle: "Una marca. Varias formas de generar impacto.", exploreFormat: "Explorar formato", growingPlatform: "Parte de la plataforma en crecimiento", servicesTitle: "Apoyo flexible en recruiting.", reachEyebrow: "Experiencia y alcance", reachTitle: "Sectores y región.", region: "Región", plannedEyebrow: "Núcleo previsto", plannedTitle: "Elementos centrales previstos.", detailLabels: ["01 / Punto de partida", "02 / Dirección", "03 / Señal", "04 / Próximo paso"], detailTitles: ["El problema", "El objetivo", "Estado actual", "Próximos pasos"], projectStatusLabel: "Estado del proyecto", mediaEyebrow: "Medios y novedades", ecosystemNote: "Este proyecto forma parte del ecosistema bts.online en crecimiento.", defaultContactCta: "Iniciar una conversación", openProjectLabel: "Abrir página del proyecto", enterProject: "Abrir proyecto", sectionTitle: "Un ecosistema en crecimiento, no un portafolio terminado.", sectionDescription: "Seis ideas con energía propia, conectadas por el recruiting, la comunidad, el contenido y el deseo de convertir experiencia en algo útil.", statusLabels: { Active: "Activo", "Active / Growing": "Activo / En crecimiento", Concept: "Concepto", "In Development": "En desarrollo", Rebuild: "Reconstrucción", "Digital HQ": "Digital HQ" }, areaStatusLabels: { Available: "Disponible", "In development": "En desarrollo", "Coming soon": "Próximamente" },
  },
  tr: {
    back: "← Digital HQ’ya dön", status: "Durum", externalWebsite: "Harici web sitesi ↗", visionEyebrow: "Proje vizyonu", visionTitle: "Neye dönüşebilir.", valuesEyebrow: "Marka değerleri", valuesTitle: "Çalışmaya yön verenler.", areasEyebrow: "Formatlar ve alanlar", areasTitle: "Tek marka. Etki yaratmanın birden fazla yolu.", exploreFormat: "Formatı keşfet", growingPlatform: "Büyüyen platformun parçası", servicesTitle: "Esnek işe alım desteği.", reachEyebrow: "Deneyim ve erişim", reachTitle: "Sektörler ve bölge.", region: "Bölge", plannedEyebrow: "Planlanan temel", plannedTitle: "Planlanan temel unsurlar.", detailLabels: ["01 / Başlangıç", "02 / Yön", "03 / Sinyal", "04 / Sıradaki"], detailTitles: ["Sorun", "Hedef", "Mevcut durum", "Sonraki adımlar"], projectStatusLabel: "Proje durumu", mediaEyebrow: "Medya ve proje güncellemeleri", ecosystemNote: "Bu proje büyüyen bts.online ekosisteminin bir parçası.", defaultContactCta: "Bir sohbet başlat", openProjectLabel: "Proje sayfasını aç", enterProject: "Projeyi aç", sectionTitle: "Bitmiş bir portföy değil, büyüyen bir ekosistem.", sectionDescription: "Kendi enerjisine sahip altı fikir; işe alım, topluluk, içerik ve deneyimi faydaya dönüştürme isteğiyle birbirine bağlı.", statusLabels: { Active: "Aktif", "Active / Growing": "Aktif / Büyüyor", Concept: "Konsept", "In Development": "Geliştiriliyor", Rebuild: "Yeniden kuruluyor", "Digital HQ": "Digital HQ" }, areaStatusLabels: { Available: "Kullanılabilir", "In development": "Geliştiriliyor", "Coming soon": "Yakında" },
  },
  pl: {
    back: "← Wróć do Digital HQ", status: "Status", externalWebsite: "Witryna zewnętrzna ↗", visionEyebrow: "Wizja projektu", visionTitle: "Czym może się stać.", valuesEyebrow: "Wartości marki", valuesTitle: "Co prowadzi tę pracę.", areasEyebrow: "Formaty i obszary", areasTitle: "Jedna marka. Wiele sposobów tworzenia wartości.", exploreFormat: "Odkryj format", growingPlatform: "Część rozwijającej się platformy", servicesTitle: "Elastyczne wsparcie rekrutacji.", reachEyebrow: "Doświadczenie i zasięg", reachTitle: "Branże i region.", region: "Region", plannedEyebrow: "Planowany rdzeń", plannedTitle: "Planowane główne elementy.", detailLabels: ["01 / Punkt wyjścia", "02 / Kierunek", "03 / Sygnał", "04 / Dalej"], detailTitles: ["Problem", "Cel", "Aktualny stan", "Kolejne kroki"], projectStatusLabel: "Status projektu", mediaEyebrow: "Materiały i aktualizacje", ecosystemNote: "Ten projekt jest częścią rozwijającego się ekosystemu bts.online.", defaultContactCta: "Rozpocznij rozmowę", openProjectLabel: "Otwórz stronę projektu", enterProject: "Otwórz projekt", sectionTitle: "Rozwijający się ekosystem, nie skończone portfolio.", sectionDescription: "Sześć pomysłów z własną energią — połączonych rekrutacją, społecznością, treścią i pragnieniem przekuwania doświadczeń w coś użytecznego.", statusLabels: { Active: "Aktywny", "Active / Growing": "Aktywny / Rozwija się", Concept: "Koncepcja", "In Development": "W rozwoju", Rebuild: "Przebudowa", "Digital HQ": "Digital HQ" }, areaStatusLabels: { Available: "Dostępne", "In development": "W rozwoju", "Coming soon": "Wkrótce" },
  },
  el: {
    back: "← Πίσω στο Digital HQ", status: "Κατάσταση", externalWebsite: "Εξωτερικός ιστότοπος ↗", visionEyebrow: "Όραμα έργου", visionTitle: "Σε τι μπορεί να εξελιχθεί.", valuesEyebrow: "Αξίες μάρκας", valuesTitle: "Τι καθοδηγεί τη δουλειά.", areasEyebrow: "Μορφές και τομείς", areasTitle: "Μία μάρκα. Πολλοί τρόποι να δημιουργεί αξία.", exploreFormat: "Εξερεύνησε τη μορφή", growingPlatform: "Μέρος της πλατφόρμας που μεγαλώνει", servicesTitle: "Ευέλικτη υποστήριξη recruiting.", reachEyebrow: "Εμπειρία και εμβέλεια", reachTitle: "Κλάδοι και περιοχή.", region: "Περιοχή", plannedEyebrow: "Σχεδιασμένος πυρήνας", plannedTitle: "Σχεδιασμένα βασικά στοιχεία.", detailLabels: ["01 / Αφετηρία", "02 / Κατεύθυνση", "03 / Σήμα", "04 / Επόμενο"], detailTitles: ["Το πρόβλημα", "Ο στόχος", "Τρέχουσα κατάσταση", "Επόμενα βήματα"], projectStatusLabel: "Κατάσταση έργου", mediaEyebrow: "Υλικό και ενημερώσεις έργου", ecosystemNote: "Αυτό το έργο είναι μέρος του αναπτυσσόμενου οικοσυστήματος bts.online.", defaultContactCta: "Ξεκίνα μια συζήτηση", openProjectLabel: "Άνοιγμα σελίδας έργου", enterProject: "Άνοιξε το έργο", sectionTitle: "Ένα οικοσύστημα που μεγαλώνει, όχι ένα τελειωμένο portfolio.", sectionDescription: "Έξι ιδέες με δική τους ενέργεια — συνδεδεμένες από το recruiting, την κοινότητα, το περιεχόμενο και την επιθυμία να γίνει η εμπειρία χρήσιμη.", statusLabels: { Active: "Ενεργό", "Active / Growing": "Ενεργό / Αναπτύσσεται", Concept: "Ιδέα", "In Development": "Σε ανάπτυξη", Rebuild: "Επανασχεδιασμός", "Digital HQ": "Digital HQ" }, areaStatusLabels: { Available: "Διαθέσιμο", "In development": "Σε ανάπτυξη", "Coming soon": "Σύντομα" },
  },
  ru: {
    back: "← Вернуться в Digital HQ", status: "Статус", externalWebsite: "Внешний сайт ↗", visionEyebrow: "Видение проекта", visionTitle: "Во что это может вырасти.", valuesEyebrow: "Ценности бренда", valuesTitle: "Что направляет эту работу.", areasEyebrow: "Форматы и направления", areasTitle: "Один бренд. Несколько способов создавать пользу.", exploreFormat: "Открыть формат", growingPlatform: "Часть растущей платформы", servicesTitle: "Гибкая поддержка рекрутинга.", reachEyebrow: "Опыт и охват", reachTitle: "Отрасли и регион.", region: "Регион", plannedEyebrow: "Планируемая основа", plannedTitle: "Планируемые ключевые элементы.", detailLabels: ["01 / Отправная точка", "02 / Направление", "03 / Сигнал", "04 / Дальше"], detailTitles: ["Проблема", "Цель", "Текущее состояние", "Следующие шаги"], projectStatusLabel: "Статус проекта", mediaEyebrow: "Материалы и обновления", ecosystemNote: "Этот проект входит в растущую экосистему bts.online.", defaultContactCta: "Начать разговор", openProjectLabel: "Открыть страницу проекта", enterProject: "Открыть проект", sectionTitle: "Растущая экосистема, а не завершённое портфолио.", sectionDescription: "Шесть самостоятельных идей, связанных рекрутингом, сообществом, контентом и стремлением превращать опыт во что-то полезное.", statusLabels: { Active: "Активно", "Active / Growing": "Активно / Растёт", Concept: "Концепция", "In Development": "В разработке", Rebuild: "Перестройка", "Digital HQ": "Digital HQ" }, areaStatusLabels: { Available: "Доступно", "In development": "В разработке", "Coming soon": "Скоро" },
  },
};

export function getProjectPageCopy(locale: Locale): ProjectPageCopy {
  return dictionaries[locale];
}
