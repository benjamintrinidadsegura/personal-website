/** Editorial references only. Titles, copy and publication truth live in their existing sources. */
export type ContentReference =
  | { kind: "writing"; slug: string }
  | { kind: "project"; slug: string }
  | { kind: "person"; id: string }
  | { kind: "experience"; id: string }
  | { kind: "world"; personId: string };

export type ConnectionReason = "understood" | "beyondCv" | "recruiting" | "careerReflection" | "mapContext" | "conversationProject";
export type ContextualReference = { to: ContentReference; reason: ConnectionReason };
type EditorialJourney = { from: ContentReference; next: readonly ContextualReference[] };

// The two public essays discuss mutual understanding and interview expectations.
// These are thematic reading suggestions, never claims of endorsement/collaboration.
export const contextualJourneys: readonly EditorialJourney[] = [
  {
    from: { kind: "writing", slug: "versteh-mich-richtig" },
    next: [
      { to: { kind: "writing", slug: "vielleicht-hoffen-die-anderen-genauso-wie-du" }, reason: "understood" },
      { to: { kind: "project", slug: "goatrecrutainer" }, reason: "beyondCv" },
      { to: { kind: "person", id: "person-kiki-radicke" }, reason: "recruiting" },
    ],
  },
  {
    from: { kind: "writing", slug: "vielleicht-hoffen-die-anderen-genauso-wie-du" },
    next: [
      { to: { kind: "writing", slug: "versteh-mich-richtig" }, reason: "understood" },
      { to: { kind: "project", slug: "goatrecrutainer" }, reason: "beyondCv" },
      { to: { kind: "person", id: "person-kiki-radicke" }, reason: "recruiting" },
    ],
  },
  {
    from: { kind: "project", slug: "goatrecrutainer" },
    next: [
      { to: { kind: "experience", id: "tool-find-your-next-step-career" }, reason: "careerReflection" },
      { to: { kind: "person", id: "person-evgeny-vinokurov" }, reason: "beyondCv" },
    ],
  },
  // All six are existing published GOATRECRUTAINER conversations. Map eligibility
  // is still checked by the canonical adapter at render time, not asserted here.
  // Preserve a direct path to another conversation: career paths across borders,
  // people-centred recruiting, or independent work and professional visibility.
  ...([
    ["person-evgeny-vinokurov", "person-amr-medhat", "beyondCv"],
    ["person-kiki-radicke", "person-melanie-kleinhenz", "recruiting"],
    ["person-johanna-geisler", "person-kiki-radicke", "recruiting"],
    ["person-kevin-schweisfurth", "person-johanna-geisler", "beyondCv"],
    ["person-amr-medhat", "person-evgeny-vinokurov", "beyondCv"],
    ["person-melanie-kleinhenz", "person-kiki-radicke", "recruiting"],
  ] as const).map(([id, peerId, reason]): EditorialJourney => ({
    from: { kind: "person", id },
    next: [
      { to: { kind: "world", personId: id }, reason: "mapContext" },
      { to: { kind: "project", slug: "goatrecrutainer" }, reason: "conversationProject" },
      { to: { kind: "person", id: peerId }, reason },
    ],
  })),
];
