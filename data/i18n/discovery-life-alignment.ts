import { availableLifeAlignmentModules, type LifeAlignmentModule } from "@/data/life-alignment-modules";
import type { Locale } from "@/lib/i18n/config";
import type { DiscoveryItem } from "@/types/discovery";

const additionalModuleIds = ["family", "friendship", "career", "team", "founder"] as const;
type AdditionalModuleId = typeof additionalModuleIds[number];
type PublicModuleCopy = { title: string; description: string; aliases: string[] };

/**
 * Compact public search projection of the existing route/hub titles and descriptions.
 * Tests compare every locale with the existing hub so copy drift is visible.
 * Keep question catalogs, answers and invitation/session state out of the global index.
 * Aliases are only the module's literal name in each supported language.
 */
const moduleCopy: Record<Locale, Record<AdditionalModuleId, PublicModuleCopy>> = {
  "de": {
    "family": {
      "title": "Family Alignment",
      "description": "Nähe, Fürsorge, Verantwortung und Grenzen zwischen zwei Familienmitgliedern verstehen – ohne Familienform oder Hierarchie vorauszusetzen.",
      "aliases": [
        "Familie"
      ]
    },
    "friendship": {
      "title": "Friendship Alignment",
      "description": "Unsichtbare Erwartungen an Kontakt, Unterstützung und Verlässlichkeit sichtbar machen.",
      "aliases": [
        "Freundschaft"
      ]
    },
    "career": {
      "title": "Career Alignment",
      "description": "Eine persönliche Momentaufnahme dessen, was dir in der Arbeit wichtig ist, was heute trägt und was Aufmerksamkeit verdient.",
      "aliases": [
        "Karriere"
      ]
    },
    "team": {
      "title": "Team Alignment",
      "description": "Arbeitsweisen zwischen zwei Teammitgliedern klären – ohne Leistungsscore, Überwachung oder Persönlichkeitsranking.",
      "aliases": [
        "Team"
      ]
    },
    "founder": {
      "title": "Founder Alignment",
      "description": "Menschliche, strategische, operative und Governance-Erwartungen vor schwierigen Entscheidungen klären.",
      "aliases": [
        "Founder",
        "Gründer"
      ]
    }
  },
  "en": {
    "family": {
      "title": "Family Alignment",
      "description": "Understand closeness, care, responsibility and boundaries between two family members without assuming a family structure or hierarchy.",
      "aliases": [
        "Family"
      ]
    },
    "friendship": {
      "title": "Friendship Alignment",
      "description": "Make invisible expectations around contact, support and reliability visible.",
      "aliases": [
        "Friendship"
      ]
    },
    "career": {
      "title": "Career Alignment",
      "description": "A personal snapshot of what matters in work, what currently supports you and what deserves attention.",
      "aliases": [
        "Career"
      ]
    },
    "team": {
      "title": "Team Alignment",
      "description": "Clarify working preferences between two teammates without performance scoring, surveillance or personality ranking.",
      "aliases": [
        "Team"
      ]
    },
    "founder": {
      "title": "Founder Alignment",
      "description": "Clarify human, strategic, operating and governance expectations before difficult decisions.",
      "aliases": [
        "Founder"
      ]
    }
  },
  "es": {
    "family": {
      "title": "Alineación familiar",
      "description": "Comprender cercanía, cuidado, responsabilidad y límites entre dos familiares sin presuponer una estructura o jerarquía.",
      "aliases": [
        "Familia"
      ]
    },
    "friendship": {
      "title": "Alineación de amistad",
      "description": "Hacer visibles expectativas sobre contacto, apoyo y fiabilidad.",
      "aliases": [
        "Amistad"
      ]
    },
    "career": {
      "title": "Alineación profesional",
      "description": "Una imagen personal de lo que importa en el trabajo, lo que hoy te sostiene y lo que merece atención.",
      "aliases": [
        "Carrera"
      ]
    },
    "team": {
      "title": "Alineación de equipo",
      "description": "Aclarar preferencias de trabajo entre dos compañeros sin evaluar rendimiento, vigilar ni clasificar personalidades.",
      "aliases": [
        "Equipo"
      ]
    },
    "founder": {
      "title": "Alineación de fundadores",
      "description": "Aclarar expectativas humanas, estratégicas, operativas y de gobierno antes de decisiones difíciles.",
      "aliases": [
        "Fundador"
      ]
    }
  },
  "tr": {
    "family": {
      "title": "Aile Uyumu",
      "description": "Aile yapısı veya hiyerarşi varsaymadan iki aile üyesi arasındaki yakınlık, özen, sorumluluk ve sınırları anlamak.",
      "aliases": [
        "Aile"
      ]
    },
    "friendship": {
      "title": "Arkadaşlık Uyumu",
      "description": "İletişim, destek ve güvenilirliğe dair görünmeyen beklentileri görünür kılın.",
      "aliases": [
        "Arkadaşlık"
      ]
    },
    "career": {
      "title": "Kariyer Uyumu",
      "description": "İşte senin için önemli olanı, bugün seni destekleyeni ve dikkat isteyen alanları gösteren kişisel bir görünüm.",
      "aliases": [
        "Kariyer"
      ]
    },
    "team": {
      "title": "Takım Uyumu",
      "description": "Performans puanı, gözetim veya kişilik sıralaması olmadan iki ekip arkadaşının çalışma tercihlerini netleştirmek.",
      "aliases": [
        "Ekip"
      ]
    },
    "founder": {
      "title": "Kurucu Uyumu",
      "description": "Zor kararlardan önce insani, stratejik, operasyonel ve yönetişim beklentilerini netleştirin.",
      "aliases": [
        "Kurucu"
      ]
    }
  },
  "pl": {
    "family": {
      "title": "Family Alignment",
      "description": "Zrozumieć bliskość, troskę, odpowiedzialność i granice między dwiema osobami z rodziny, bez zakładania struktury ani hierarchii.",
      "aliases": [
        "Rodzina"
      ]
    },
    "friendship": {
      "title": "Friendship Alignment",
      "description": "Uwidocznij oczekiwania dotyczące kontaktu, wsparcia i niezawodności.",
      "aliases": [
        "Przyjaźń"
      ]
    },
    "career": {
      "title": "Career Alignment",
      "description": "Osobisty obraz tego, co jest ważne w pracy, co dziś wspiera i co wymaga uwagi.",
      "aliases": [
        "Kariera"
      ]
    },
    "team": {
      "title": "Team Alignment",
      "description": "Wyjaśnić preferencje pracy między dwiema osobami w zespole bez oceny wyników, nadzoru ani rankingu osobowości.",
      "aliases": [
        "Zespół"
      ]
    },
    "founder": {
      "title": "Founder Alignment",
      "description": "Wyjaśnij oczekiwania ludzkie, strategiczne, operacyjne i zarządcze przed trudnymi decyzjami.",
      "aliases": [
        "Założyciel"
      ]
    }
  },
  "el": {
    "family": {
      "title": "Οικογενειακή ευθυγράμμιση",
      "description": "Κατανόηση εγγύτητας, φροντίδας, ευθύνης και ορίων μεταξύ δύο μελών οικογένειας χωρίς υπόθεση δομής ή ιεραρχίας.",
      "aliases": [
        "Οικογένεια"
      ]
    },
    "friendship": {
      "title": "Ευθυγράμμιση φιλίας",
      "description": "Κάνε ορατές τις προσδοκίες για επαφή, στήριξη και αξιοπιστία.",
      "aliases": [
        "Φιλία"
      ]
    },
    "career": {
      "title": "Επαγγελματική ευθυγράμμιση",
      "description": "Μια προσωπική εικόνα του τι έχει σημασία στην εργασία, τι σε στηρίζει τώρα και τι αξίζει προσοχή.",
      "aliases": [
        "Καριέρα"
      ]
    },
    "team": {
      "title": "Ευθυγράμμιση ομάδας",
      "description": "Διευκρίνιση τρόπων εργασίας μεταξύ δύο μελών ομάδας χωρίς βαθμολόγηση απόδοσης, επιτήρηση ή κατάταξη προσωπικότητας.",
      "aliases": [
        "Ομάδα"
      ]
    },
    "founder": {
      "title": "Ευθυγράμμιση ιδρυτών",
      "description": "Διευκρίνισε ανθρώπινες, στρατηγικές, λειτουργικές και διοικητικές προσδοκίες πριν από δύσκολες αποφάσεις.",
      "aliases": [
        "Ιδρυτής"
      ]
    }
  },
  "ru": {
    "family": {
      "title": "Согласование в семье",
      "description": "Понять близость, заботу, ответственность и границы между двумя членами семьи без предположений о структуре или иерархии.",
      "aliases": [
        "Семья"
      ]
    },
    "friendship": {
      "title": "Согласование дружбы",
      "description": "Сделать видимыми ожидания о контакте, поддержке и надёжности.",
      "aliases": [
        "Дружба"
      ]
    },
    "career": {
      "title": "Карьерное согласование",
      "description": "Личный обзор того, что важно в работе, что сейчас поддерживает и чему стоит уделить внимание.",
      "aliases": [
        "Карьера"
      ]
    },
    "team": {
      "title": "Согласование в команде",
      "description": "Прояснить рабочие предпочтения двух коллег без оценки эффективности, наблюдения или рейтинга личности.",
      "aliases": [
        "Команда"
      ]
    },
    "founder": {
      "title": "Согласование основателей",
      "description": "Прояснить человеческие, стратегические, операционные и управленческие ожидания до сложных решений.",
      "aliases": [
        "Основатель"
      ]
    }
  }
};

function isAdditionalModuleId(id: string): id is AdditionalModuleId {
  return additionalModuleIds.some((moduleId) => moduleId === id);
}

export function createAdditionalLifeAlignmentDiscoveryItems(
  locale: Locale = "de",
  modules: readonly LifeAlignmentModule[] = availableLifeAlignmentModules,
): DiscoveryItem[] {
  return modules.flatMap((module): DiscoveryItem[] => {
    if (!isAdditionalModuleId(module.id) || module.status !== "available"
      || module.href !== `/life-alignment/${module.id}`) return [];
    const copy = moduleCopy[locale][module.id];
    return [{
      id: `tool-life-alignment-${module.id}`,
      group: "Tools",
      title: copy.title,
      description: copy.description,
      category: "Life Alignment",
      tags: ["Life Alignment", module.mode],
      keywords: [...new Set([module.shortTitle, ...moduleCopy.de[module.id].aliases, ...copy.aliases])],
      status: "Beta",
      href: module.href,
    }];
  });
}
