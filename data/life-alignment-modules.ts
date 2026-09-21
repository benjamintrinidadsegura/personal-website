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
  href: `/life-alignment/${"self" | "partner" | "friendship" | "founder" | "family" | "team" | "career" | "life-vision"}`;
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
    privacy: "Local-only · bis zu 20 abgeleitete Momentaufnahmen in diesem Browser",
    duration: "5 Abschnitte · etwa 8–12 Minuten",
    scene: { src: lifeAlignmentScene.src, alt: lifeAlignmentScene.alt },
  },
  {
    id: "partner",
    title: "Partner / Relationship",
    shortTitle: "Partner",
    mode: "WE",
    purpose: "Vergleicht zwei unabhängig beantwortete Perspektiven und macht Gesprächsbedarf sichtbar, ohne Kompatibilitätsurteil.",
    audience: "Solo oder für zwei Menschen in einer privaten Einladungssitzung",
    status: "available",
    statusLabel: "Verfügbar · V1.1",
    href: "/life-alignment/partner",
    privacy: "Solo lokal · Einladungen in privater Sitzung; bestehender Shared-Device-Ablauf bleibt verfügbar",
    duration: "6 Abschnitte · 18 Fragen",
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
    mode: "WE",
    purpose: "Perspektiven, Verantwortung und Spielräume innerhalb einer Familie betrachten.",
    audience: "Für Familienkontexte",
    status: "available",
    statusLabel: "Verfügbar · V1",
    href: "/life-alignment/family",
    privacy: "Solo lokal · Einladungen in privater Zwei-Personen-Sitzung",
    duration: "4 Abschnitte · 14 Fragen",
    scene: { src: lifeAlignmentScene.src, alt: lifeAlignmentScene.alt },
  },
  {
    id: "friendship",
    title: "Friendship",
    shortTitle: "Friendship",
    mode: "WE",
    purpose: "Nähe, Gegenseitigkeit und unterschiedliche Erwartungen in Freundschaften reflektieren.",
    audience: "Für Freundschaftskontexte",
    status: "available",
    statusLabel: "Verfügbar · V1.1",
    href: "/life-alignment/friendship",
    privacy: "Solo lokal · Einladungen in privater Sitzung",
    duration: "5 Abschnitte · 16 Fragen",
    scene: { src: lifeAlignmentScene.src, alt: lifeAlignmentScene.alt },
  },
  {
    id: "career",
    title: "Career",
    shortTitle: "Career",
    mode: "ME",
    purpose: "Berufliche Richtung im Zusammenspiel mit dem übrigen Leben verstehen.",
    audience: "Für berufliche Kontexte",
    status: "available",
    statusLabel: "Verfügbar · V1",
    href: "/life-alignment/career",
    privacy: "Local-only · private Momentaufnahmen in diesem Browser",
    duration: "8 Themen · etwa 8–12 Minuten",
    scene: { src: lifeAlignmentScene.src, alt: lifeAlignmentScene.alt },
  },
  {
    id: "team",
    title: "Team",
    shortTitle: "Team",
    mode: "WE",
    purpose: "Zusammenarbeit, Erwartungen und tragfähige Vereinbarungen im Team sichtbar machen.",
    audience: "Für Teams",
    status: "available",
    statusLabel: "Verfügbar · V1",
    href: "/life-alignment/team",
    privacy: "Solo lokal · Einladungen in privater Zwei-Personen-Sitzung",
    duration: "4 Abschnitte · 14 Fragen",
    scene: { src: lifeAlignmentScene.src, alt: lifeAlignmentScene.alt },
  },
  {
    id: "founder",
    title: "Founder",
    shortTitle: "Founder",
    mode: "WE",
    purpose: "Unternehmerische Verantwortung, persönliche Kapazität und Richtung gemeinsam betrachten.",
    audience: "Für Founder-Kontexte",
    status: "available",
    statusLabel: "Verfügbar · V1.1",
    href: "/life-alignment/founder",
    privacy: "Solo lokal · Einladungen in privater Sitzung",
    duration: "7 Abschnitte · 30 Fragen",
    scene: { src: lifeAlignmentScene.src, alt: lifeAlignmentScene.alt },
  },
] as const satisfies readonly LifeAlignmentModule[];

export const availableLifeAlignmentModules: readonly AvailableLifeAlignmentModule[] = (lifeAlignmentModules as readonly LifeAlignmentModule[]).filter(
  (module): module is AvailableLifeAlignmentModule => module.status === "available",
);

export const futureLifeAlignmentModules: readonly FutureLifeAlignmentModule[] = (lifeAlignmentModules as readonly LifeAlignmentModule[]).filter(
  (module): module is FutureLifeAlignmentModule => module.status === "coming-later",
);
