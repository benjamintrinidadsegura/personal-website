import { communityCopy } from "./community";
import type { Locale } from "@/lib/i18n/config";

const reach = {
  de: ["Globale Reichweite", "Besucherstatistik"], en: ["Visitor statistics"], es: ["Alcance global", "Estadísticas de visitas"],
  tr: ["Küresel erişim", "Ziyaretçi istatistikleri"], pl: ["Globalny zasięg", "Statystyki odwiedzin"],
  el: ["Παγκόσμια απήχηση", "Στατιστικά επισκέψεων"], ru: ["Глобальный охват", "Статистика посещений"],
} satisfies Record<Locale, string[]>;

const world = {
  de: ["Weltkarte", "Karte der Verbindungen"], en: [], es: ["Mapa mundial", "Mapa de conexiones"],
  tr: ["Dünya haritası", "Bağlantı haritası"], pl: ["Mapa świata", "Mapa połączeń"],
  el: ["Παγκόσμιος χάρτης", "Χάρτης συνδέσεων"], ru: ["Карта мира", "Карта связей"],
} satisfies Record<Locale, string[]>;

export function communityProductAliases(id: string, locale: Locale): string[] | undefined {
  switch (id) {
    case "page-community": return ["BTSHQ Community", "Community", communityCopy[locale].community];
    case "page-global-reach": return ["Global Reach", ...reach[locale]];
    case "page-world-map": return ["World Map", "Connection Map", ...world[locale]];
    case "tool-echowall": return ["EchoWall", "Echo Wall"];
  }
}
