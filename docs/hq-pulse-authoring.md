# HQ Pulse authoring

HQ Pulse keeps two authorities separate:

- Automatic facts come from the existing public Writing, Projects, People,
  World Map, and Discovery sources through `data/hq-pulse.ts`.
- Human meaning comes from `data/human-pulse.ts`.

`Right Now` and `On My Mind` reuse the accepted, locale-complete `now` copy in
`data/i18n/home.ts`. `Next` and Open Loops are edited once per locale in
`humanPulseEditorial` inside `data/human-pulse.ts`; missing locale entries are a
TypeScript error.

Open Loops use one of six types (`idea`, `feedback`, `collaboration`,
`interview`, `team-up`, `expertise-help`) and one lifecycle state (`active`,
`closed`, `archived`). Only active entries appear publicly. CTA destinations
must be a safe internal route or an `https` URL. Ordinary editorial changes do
not require changes to adapters or presentation components.

Do not add inferred focus, intent, deadlines, private contact data, or test
fixtures to the production editorial source.
