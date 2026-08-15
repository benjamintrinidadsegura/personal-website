export type FynsContextSceneKey = "overview" | "self" | "career" | "problem" | "idea";

export interface FynsContextScene {
  key: FynsContextSceneKey;
  src: string;
  eyebrow: string;
  title: string;
  description: string;
  alt: string;
}

export const fynsContextScenes: Record<FynsContextSceneKey, FynsContextScene> = {
  overview: {
    key: "overview",
    src: "/images/find-your-next-step/context-scenes/cast-anchor.webp",
    eyebrow: "Context Scenes",
    title: "Menschen in Situationen, nicht Menschen als Typen.",
    description:
      "Die wiederkehrenden Figuren begleiten unterschiedliche Momente des Nachdenkens. Ihre Rollen wechseln – deine eigenen Worte und deine Einordnung bleiben entscheidend.",
    alt: "Vier Erwachsene betrachten gemeinsam Notizen und einfache Modelle an einem Tisch.",
  },
  self: {
    key: "self",
    src: "/images/find-your-next-step/context-scenes/self-reflection.webp",
    eyebrow: "Eine mögliche Situation",
    title: "Innehalten, vergleichen, neu einordnen.",
    description:
      "Reflexion kann allein oder mit Unterstützung stattfinden. Die Szene illustriert einen Moment – sie beschreibt weder dich noch dein Ergebnis.",
    alt: "Vier Erwachsene reflektieren in einem Atelier mit Notizkarten; eine Person vergleicht Karten, eine schenkt Tee ein und zwei besprechen eine Pinnwand.",
  },
  career: {
    key: "career",
    src: "/images/find-your-next-step/context-scenes/career-exploration.webp",
    eyebrow: "Eine mögliche Situation",
    title: "Optionen prüfen, bevor sie zu Festlegungen werden.",
    description:
      "Berufliche Richtung entsteht oft durch kleine Erkundungen, Gespräche und echte Bedingungen – nicht durch die Zuordnung zu einer Figur.",
    alt: "Vier Erwachsene vergleichen Optionen und testen kleine Modelle in einer Werkstatt.",
  },
  problem: {
    key: "problem",
    src: "/images/find-your-next-step/context-scenes/problem-navigation.webp",
    eyebrow: "Eine mögliche Situation",
    title: "Ein Hindernis aus mehreren Blickwinkeln betrachten.",
    description:
      "Ein Problem muss nicht auf einmal gelöst werden. Die Szene zeigt Unterstützung und einen kleinen nächsten Schritt, nicht die eine richtige Lösung.",
    alt: "Vier Erwachsene untersuchen gemeinsam eine ins Stocken geratene Konstruktion und skizzieren einen nächsten Versuch.",
  },
  idea: {
    key: "idea",
    src: "/images/find-your-next-step/context-scenes/idea-experiment.webp",
    eyebrow: "Eine mögliche Situation",
    title: "Eine Idee klein genug machen, um etwas zu lernen.",
    description:
      "Annahmen dürfen sich verändern. Die Szene steht für gemeinsames Testen – nicht für einen Gründertyp oder eine Vorhersage über Erfolg.",
    alt: "Vier Erwachsene beobachten und besprechen ein kleines Experiment mit einem frühen Prototyp.",
  },
};

export function getFynsContextScene(key: FynsContextSceneKey) {
  return fynsContextScenes[key];
}
