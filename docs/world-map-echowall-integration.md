# World Map V2 × EchoWall 2.0 integration

## Source and scope

The candidate starts directly at the verified Homepage & Search integration,
`5d9b3566b15a2e1b2d8995fb331b4c46684edb79`. Its application already includes
the adaptive homepage, collision correction, semantic relevance and five added
Life Alignment references. Those implementations are preserved.

Selected Map/EchoWall work is reused from
`d2e259e2b5307bd5e549f053e34ca5d7e26d1298`. The entire Living World branch is
not merged. Its old homepage, header, general motion changes and warm palette
are excluded. New shared styling is scoped to `.living-world` on `/world` and
`/echowall`, in Navy, blue and ice blue. No dependency or public route is added.

## World Map

The canonical Spotlight adapter, publication checks, approved public location
provenance, relationships and destinations remain unchanged. Current data has
six published people, five city/region contexts plus one country-level context,
two current countries and one real relationship category (Interviews). Empty categories are not advertised.
Origin is kept distinct from current public context. No new personal contact
channel or location claim is created.

Filters can combine genuinely supported categories as an inclusive union.
The dropdown appears only when there are multiple supported categories; it
selects a single category, while category buttons can combine them. Neither
payment nor category selection changes editorial ordering. Shape and glyph
remain available alongside category colors.

The map geometry, labels and pins share an aspect-fitted coordinate plane.
Recentering uses the same fit in both dimensions, including narrow screens.
Text-list destinations remain usable without map interaction. Selection focuses
the context heading; Escape/close returns to the opener when it still exists,
otherwise to the map. The close control is outside the scrolling context body,
so scrolling to long descriptions or story links cannot scroll it away. The
context is a non-modal aside and does not trap keyboard focus.

## EchoWall and country capability

Moderation, honeypot, signed/aged form token, origin checks, HMAC separation,
rate limits, duplicate/replay protection and private email handling remain.
Hydrated submissions preserve controlled draft fields on errors and focus the
invalid field or error summary. Successful submission means pending review,
never immediate public approval.

`ECHOWALL_COUNTRY_CONTEXT_ENABLED` is server-only and defaults to **off**.
Country is optional, starts empty, is explicitly selected, and is never inferred
from IP, language, GPS or browser settings. Copy explains that the selected
country becomes public beside an approved contribution. An additional unchecked
choice controls inclusion in the country summary. Clearing the country clears
that choice. Supported ISO codes and names cover all seven locales.

The additive SQL under `supabase/pending-migrations/` remains **unapplied remotely**
and outside the pinned Production migration chain. The service-only, security-
invoker wrapper invokes the existing submission RPC and updates only its new
pending row in the same transaction. Invalid country data rolls back the whole
submission. Original table grants/RLS and moderation transitions remain.

With the switch off, readers select only legacy columns and submissions use
the legacy RPC. If explicitly enabled before the columns exist, the public
reader falls back to its existing approved projection and hides country input.
A country submission whose RPC is unavailable fails explicitly; it never
silently retries without the contributor's declaration.

Country totals count distinct eligible approved contribution IDs among at most
50 recent public echoes. Groups below three are suppressed. These are neither
unique people nor website visitors; the threshold is no anonymity guarantee.
Existing `approved-echoes` cache/tag behavior remains: 300-second revalidation,
and tag invalidation by authorized moderation. Publication/withdrawal propagation
in an actual hosted country-enabled deployment is not established by local tests.

World Map links to the contribution section; EchoWall links back to World Map.
Country summaries are separate from personal relationship pins and never create
an implied relationship. Unavailable optional country data does not break the
map; unavailable EchoWall reads retain their explicit recovery presentation.

## Analytics boundaries

`lib/analytics/public-page-view.ts` is an unused preparation interface, not a
collector. It accepts only exact localized public editorial index paths and
drops query/fragment data. Assessment, invitation, account, API and unknown
detail paths are excluded. No provider, SDK, beacon, runtime activation or
measurement is introduced. Country page views, EchoWall contributions and
World Map relationships have separate types and presentation. Reach stays
explicitly inactive, without guessed numbers.

## Verification and release boundaries

Local PostgreSQL 17 tests used a dedicated container with no network or ports,
synthetic identities and an explicit rolled-back fixture transaction. They
exercise grants/RLS, old/new RPCs, validation, replay, moderation and non-public
deleted recovery. No remote Supabase project or data is used.

The engineering review package contains exact test/build logs, the known eleven
baseline failures, real responsive browser geometry, local submission recovery,
Axe results and clearly labeled synthetic component screenshots. Synthetic SSR
states do not prove a country-enabled hosted end-to-end submission. Physical
touch/iOS, browser reduced-motion emulation, full screenreader review and real-
time clips remain unverified/unavailable in this environment. No blanket WCAG
or legal compliance claim follows from automated checks.

The country switch and analytics must stay off in any separately approved Preview.
Before any later country activation, obtain separate schema/wording/retention
approval, verify backups, apply/review only the approved migration, validate
actual grants, moderation invalidation and a country-enabled end-to-end flow.
This task performs no remote migration, push or deployment.

Local rollback is the preserved `5d9b3566…` parent. A later application rollback
does not require dropping additive columns or deleting declarations; any schema
removal needs its own reviewed retention and recovery plan. Before a future
Production release, freshly verify its deployment/rollback identity and access.
