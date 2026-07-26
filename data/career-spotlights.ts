import type { CareerSpotlightEntry } from "@/types/content";

export const careerSpotlightConfig = {
  title: "Career Spotlight",
  description: "Menschen, Karrierewege und die Geschichten hinter Lebensläufen.",
  introduction: "Ein Lebenslauf zeigt Stationen. Career Spotlight zeigt den Menschen dahinter.",
  guidingQuestion: "Was aus deiner Kindheit muss man wissen, um dich und deinen Lebenslauf zu verstehen?",
  topics: ["Herkunft", "Wendepunkte", "Entscheidungen", "Rückschläge", "Entwicklung", "Potenzial"],
} as const;

export const careerSpotlights: CareerSpotlightEntry[] = [
  {
    slug: "evgeny-vinokurov",
    name: "Evgeny Vinokurov",
    professionalContext: "Management Consultant in Financial Services",
    teaser:
      "Evgeny Vinokurov spricht über seine Kindheit in Sibirien, den frühen Weg nach Deutschland, Tanzen als sicheren Ort und die Disziplin, Zweifel und Entscheidungen hinter einem von außen sichtbaren Erfolg.",
    status: "published",
    title: "Evgeny Vinokurov: Der Mensch hinter dem Erfolg",
    subtitle:
      "Über Kindheit in Sibirien, Tanzen als sicheren Ort, den Preis von Leistung und Entscheidungen, die einen Lebensweg verändern.",
    editionLabel: "Portrait, Teil 1",
    cover: {
      src: "/images/career-spotlight/evgeny-vinokurov/cover.jpg",
      alt: "Cover des Career Spotlights mit einem Porträt von Evgeny Vinokurov und einer Tanzszene auf dunklem Hintergrund.",
    },
    introduction: [
      "Ein Lebenslauf kann Rollen, Stationen und Erfolge aufzählen. Er erzählt aber nur selten, was ein Mensch auf dem Weg dorthin zurücklassen, lernen oder neu entscheiden musste.",
      "Evgeny Vinokurovs Geschichte beginnt in Sibirien. Mit 14 Jahren kam er ohne seine Eltern nach Deutschland und begann hier einen neuen Abschnitt seines Lebens. Der Tanz, der ihn seit seinem sechsten Lebensjahr begleitet, wurde für ihn zugleich Ausdrucksraum, Leistungssport und ein Ort, an dem er nach eigener Aussage vollständig er selbst sein konnte.",
      "Im Career Spotlight spricht Evgeny über Herkunft, Ehrgeiz und Disziplin – aber auch über Überlastung, Leere nach erreichten Zielen und Entscheidungen, die sich erst im Rückblick vollständig verstehen lassen.",
    ],
    guidingAnswer:
      "Evgeny beschreibt eine Kindheit in einfachen Verhältnissen in Sibirien, in der er früh lernen musste, sich zu behaupten. Mit 14 Jahren kam er ohne seine Eltern in eine Gastfamilie nach Deutschland. Erst später verstand er, wie wichtig die gemeinsame Zeit im Elternhaus für die eigene Entwicklung sein kann und was ihm durch den frühen Abschied gefehlt hatte.",
    featuredStatement:
      "Tanzen wurde für Evgeny zu einem Ort, an dem er sich vollständig sicher fühlte, Emotionen verarbeiten und ganz er selbst sein konnte.",
    sections: [
      {
        title: "Herkunft und ein früher Neuanfang",
        body: [
          "Evgeny wuchs in einfachen Verhältnissen in Sibirien auf. Er erinnert sich an ein Umfeld, in dem er früh lernen musste, sich zu behaupten, beschreibt seine Kindheit zugleich aber als frei und insgesamt gut. Vieles spielte sich draußen ab, gemeinsam mit anderen Kindern und ohne die ständige Begleitung, die heute selbstverständlich erscheint.",
          "Mit 14 Jahren kam er ohne seine Eltern nach Deutschland und lebte in einer Gastfamilie. Was sich zunächst wie Freiheit und ein aufregender Neubeginn anfühlte, bewertete er einige Jahre später anders: Ihm wurde bewusst, dass er einen wichtigen Abschnitt gemeinsamer Entwicklung im Elternhaus nicht erlebt hatte.",
        ],
      },
      {
        title: "Tanzen als sicherer Ort",
        body: [
          "Mit sechs Jahren brachte seine Mutter ihn zum ersten Tanzunterricht. Musik, Bewegung und die künstlerische Seite faszinierten ihn – auch wenn der Weg zum Training nicht immer leichtfiel. Sobald er dort war, fühlte es sich richtig an.",
          "Im Tanzen fand Evgeny einen Raum für Gefühle, die an anderer Stelle kaum Platz hatten. Bewegung und Rollen ermöglichten ihm, Emotionen auszudrücken und zu verarbeiten. Mit ungefähr neun Jahren wurde aus dem Hobby eine Leidenschaft und aus wachsendem Einsatz entstand neue Motivation.",
        ],
      },
      {
        title: "Was Erfolg tatsächlich kostet",
        body: [
          "Erfolg kostet für Evgeny vor allem Zeit und Disziplin. Disziplin bedeutet für ihn, die notwendige Arbeit auch dann zu wiederholen, wenn die Motivation gerade fehlt. Training, Wiederholung und Kontinuität bestimmten über lange Zeit seinen Alltag.",
          "Hinter dem sichtbaren Moment auf einer Bühne stehen körperliche Belastung, Reisen, Enttäuschungen und Zeit, die an anderer Stelle fehlt. Hinzu kommt ein Umfeld, in dem Leistung und Erscheinung fortlaufend beobachtet und bewertet werden. Das Ergebnis ist sichtbar; der Weg dorthin bleibt es meist nicht.",
        ],
      },
      {
        title: "Wenn das erreichte Ziel plötzlich leer wirkt",
        body: [
          "Evgeny kennt das Gefühl, nach einer Phase intensiver Arbeit trotz eines erreichten Ziels leer zu sein. Wer lange auf einen einzelnen Endpunkt hinarbeitet, hat sich nicht automatisch damit beschäftigt, was danach kommen soll.",
          "Dann beginnt die Suche nach neuer Motivation und einer nächsten Richtung. Unterschiedliche Lebens- und Arbeitswelten helfen ihm dabei, Abstand zu gewinnen: Der Wechsel der Perspektive schafft einen Kontrast, in dem der Kopf anders arbeiten und zur Ruhe kommen kann.",
        ],
      },
      {
        title: "Entscheidungen, Loyalität und Selbstbestimmung",
        body: [
          "Eine seiner schwersten Entscheidungen war es, seine Tanzkarriere zu beenden. Rückblickend beschreibt Evgeny eine Spannung zwischen seiner Intuition und einem rationalen Lebensentwurf, den er für sich konstruiert hatte, ohne innerlich vollständig bereit zu sein.",
          "Auch frühere Entscheidungen aus Loyalität betrachtet er heute differenzierter. Seine zentrale Erkenntnis ist nicht, andere Menschen auszublenden, sondern sich bei grundlegenden Entscheidungen nicht selbst zu verlassen. Persönliche Entwicklung bedeutet für ihn deshalb auch, alte Entscheidungen neu zu bewerten und künftig stärker bei sich zu bleiben.",
        ],
      },
    ],
    questions: [
      {
        question: "Was aus deiner Kindheit muss man wissen, um dich und deinen Lebenslauf zu verstehen?",
        answer:
          "Evgeny beschreibt einfache Verhältnisse und eine Kindheit in Sibirien, in der er früh lernen musste, sich zu behaupten. Mit 14 Jahren kam er ohne seine Eltern in eine Gastfamilie nach Deutschland. Erst später verstand er, welche gemeinsame Entwicklungszeit mit seinen Eltern dadurch fehlte.",
      },
      {
        question: "Was hat dich am Tanzen fasziniert?",
        answer:
          "Für Evgeny verbindet Tanzen Musik, körperliche Bewegung, Kunst und Emotion. Es wurde für ihn zu einem sicheren Ort, an dem er Gefühle verarbeiten und vollständig er selbst sein konnte.",
      },
      {
        question: "Was kostet Erfolg wirklich?",
        answer:
          "Vor allem Zeit und Disziplin. Für Evgeny bedeutet Disziplin, die erforderliche Arbeit auch dann zu wiederholen, wenn man sie gerade nicht machen möchte. Hinzu kommen körperliche Belastung und Zeit, die an anderer Stelle fehlt.",
      },
      {
        question: "Hast du dich jemals leer gefühlt, obwohl du erfolgreich warst?",
        answer:
          "Ja. Evgeny beschreibt, wie intensive Arbeit auf ein Ziel hin mental und körperlich auslaugen kann. Wenn das Ziel erreicht ist, kann zunächst Orientierung fehlen, weil die gesamte Aufmerksamkeit zuvor auf diesem einen Endpunkt lag.",
      },
      {
        question: "Was würdest du deinem jüngeren Ich sagen?",
        answer:
          "Bei grundlegenden Entscheidungen würde Evgeny seinem jüngeren Ich raten, sich selbst nicht zu verlassen. Diese Haltung versteht er nicht als Egoismus, sondern als Konsequenz aus Situationen, in denen er viel Energie in andere Menschen investiert und gegen die eigenen Bedürfnisse entschieden hat.",
      },
    ],
    takeaways: [
      "Herkunft prägt einen Lebensweg, legt ihn aber nicht abschließend fest.",
      "Tanzen war für Evgeny nicht nur Leistung, sondern auch ein sicherer Raum für Ausdruck und Emotion.",
      "Erfolg entsteht für ihn durch Zeit, Disziplin, Wiederholung und Kontinuität.",
      "Ein erreichtes Ziel kann neben Freude auch Leere und die Frage nach dem nächsten Weg auslösen.",
      "Persönliche Entwicklung bedeutet für ihn auch, frühere Entscheidungen neu zu bewerten und künftig stärker bei sich selbst zu bleiben.",
    ],
    youtubeUrl: "https://www.youtube.com/watch?v=yVlu0Ep4ZEo",
    spotifyUrl: "https://open.spotify.com/episode/02CK87gA5pxJzTtTX2sQUi?si=msW1H8JqR_2l_lNuuMYFPw",
    seo: {
      title: "Evgeny Vinokurov | Career Spotlight",
      description:
        "Evgeny Vinokurov spricht im Career Spotlight über seine Kindheit in Sibirien, den Weg nach Deutschland, Tanzen, Disziplin und die Entscheidungen hinter seinem beruflichen und persönlichen Weg.",
    },
  },
];

export function getPublishedCareerSpotlight(slug: string) {
  return careerSpotlights.find((entry) => entry.slug === slug && entry.status === "published");
}
