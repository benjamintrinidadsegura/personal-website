import { lifeAlignmentScene } from "@/data/life-alignment";
import { lifeVisionScene } from "@/data/life-alignment-life-vision";
import { partnerScene } from "@/data/life-alignment-partner";

export type LifeAlignmentModuleId =
  | "self"
  | "partner"
  | "life-vision"
  | "family"
  | "friendship"
  | "career"
  | "team"
  | "founder";

export type LifeAlignmentModuleMode = "ME" | "WE" | "WHERE I AM GOING";

type LifeAlignmentModuleBase = {
  id: LifeAlignmentModuleId;
  title: string;
  shortTitle: string;
  purpose: string;
  audience: string;
  statusLabel: string;
};

export type AvailableLifeAlignmentModule = LifeAlignmentModuleBase & {
  status: "available";
  mode: LifeAlignmentModuleMode;
  href: `/life-alignment/${"self" | "partner" | "life-vision"}`;
  privacy: string;
  duration: string;
  scene: {
    src: string;
    alt: string;
  };
};

export type FutureLifeAlignmentModule = LifeAlignmentModuleBase & {
  status: "coming-later";
  mode: null;
  href: null;
  privacy: null;
  duration: null;
  scene: null;
};

export type LifeAlignmentModule = AvailableLifeAlignmentModule | FutureLifeAlignmentModule;

export const lifeAlignmentHub = {
  href: "/life-alignment",
  eyebrow: "Human Context · Life Alignment",
  title: "Ausrichtung aus drei Perspektiven.",
  description:
    "Life Alignment hilft dir, deine heutige Situation, eine Beziehung oder deine gewünschte Richtung bewusst zu betrachten – qualitativ, kontextsensibel und ohne versteckten Lebensscore.",
  principle:
    "Die Ergebnisse ordnen nur ausdrücklich gewählte Antworten. Sie bewerten weder dein Leben noch deine Beziehung und lassen die Deutungshoheit bei den beteiligten Menschen.",
} as const;

export const lifeAlignmentModules = [
  {
    id: "self",
    title: "Self / Persönliche Momentaufnahme",
    shortTitle: "Self",
    mode: "ME",
    purpose: "Verstehe, wie deine wichtigsten Lebensbereiche heute Raum, Aufmerksamkeit und Kapazität prägen.",
    audience: "Für mich",
    status: "available",
    statusLabel: "Verfügbar · Beta",
    href: "/life-alignment/self",
    privacy: "Local-only · nur im aktuellen Seitenzustand",
    duration: "5 Abschnitte · etwa 8–12 Minuten",
    scene: { src: lifeAlignmentScene.src, alt: lifeAlignmentScene.alt },
  },
  {
    id: "partner",
    title: "Partner / Relationship",
    shortTitle: "Partner",
    mode: "WE",
    purpose: "Vergleicht zwei unabhängig beantwortete Perspektiven und macht Gesprächsbedarf sichtbar, ohne Kompatibilitätsurteil.",
    audience: "Für zwei Menschen auf einem Gerät",
    status: "available",
    statusLabel: "Verfügbar · Beta",
    href: "/life-alignment/partner",
    privacy: "Local-only · unabhängige Übergabe auf demselben Gerät",
    duration: "Zwei Perspektiven · etwa 15–20 Minuten",
    scene: { src: partnerScene.src, alt: partnerScene.alt },
  },
  {
    id: "life-vision",
    title: "Life Vision",
    shortTitle: "Life Vision",
    mode: "WHERE I AM GOING",
    purpose: "Erkunde gewünschte Richtungen, geschützte Prioritäten, reale Grenzen und bewusst offene Möglichkeiten.",
    audience: "Für meine zukünftige Richtung",
    status: "available",
    statusLabel: "Verfügbar · Beta",
    href: "/life-alignment/life-vision",
    privacy: "Local-only · nur im aktuellen Seitenzustand",
    duration: "6 Abschnitte · etwa 10–14 Minuten",
    scene: { src: lifeVisionScene.src, alt: lifeVisionScene.alt },
  },
  {
    id: "family",
    title: "Family",
    shortTitle: "Family",
    mode: null,
    purpose: "Perspektiven, Verantwortung und Spielräume innerhalb einer Familie betrachten.",
    audience: "Für Familienkontexte",
    status: "coming-later",
    statusLabel: "Kommt später",
    href: null,
    privacy: null,
    duration: null,
    scene: null,
  },
  {
    id: "friendship",
    title: "Friendship",
    shortTitle: "Friendship",
    mode: null,
    purpose: "Nähe, Gegenseitigkeit und unterschiedliche Erwartungen in Freundschaften reflektieren.",
    audience: "Für Freundschaftskontexte",
    status: "coming-later",
    statusLabel: "Kommt später",
    href: null,
    privacy: null,
    duration: null,
    scene: null,
  },
  {
    id: "career",
    title: "Career",
    shortTitle: "Career",
    mode: null,
    purpose: "Berufliche Richtung im Zusammenspiel mit dem übrigen Leben verstehen.",
    audience: "Für berufliche Kontexte",
    status: "coming-later",
    statusLabel: "Kommt später",
    href: null,
    privacy: null,
    duration: null,
    scene: null,
  },
  {
    id: "team",
    title: "Team",
    shortTitle: "Team",
    mode: null,
    purpose: "Zusammenarbeit, Erwartungen und tragfähige Vereinbarungen im Team sichtbar machen.",
    audience: "Für Teams",
    status: "coming-later",
    statusLabel: "Kommt später",
    href: null,
    privacy: null,
    duration: null,
    scene: null,
  },
  {
    id: "founder",
    title: "Founder",
    shortTitle: "Founder",
    mode: null,
    purpose: "Unternehmerische Verantwortung, persönliche Kapazität und Richtung gemeinsam betrachten.",
    audience: "Für Founder-Kontexte",
    status: "coming-later",
    statusLabel: "Kommt später",
    href: null,
    privacy: null,
    duration: null,
    scene: null,
  },
] as const satisfies readonly LifeAlignmentModule[];

export const availableLifeAlignmentModules = lifeAlignmentModules.filter(
  (module): module is (typeof lifeAlignmentModules)[number] & AvailableLifeAlignmentModule => module.status === "available",
);

export const futureLifeAlignmentModules = lifeAlignmentModules.filter(
  (module): module is (typeof lifeAlignmentModules)[number] & FutureLifeAlignmentModule => module.status === "coming-later",
);
