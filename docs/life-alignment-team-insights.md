# Team Solo: evidence-linked interpretation v1

## Product boundary

Only Team Solo changes. The question registry, scale endpoints, required/optional completion rules, private invitation flow, shared result classification and all other domain calculations remain unchanged. The new interpretation is deterministic, in page memory, with no transport, logging, persistence, AI or provider dependency. `team-solo-insights-v1` labels this **Solo** presentation; it does not replace the persisted shared engine version. Team Solo exposes no compatibility or performance score.

The previous Solo renderer used the same expectation, clarification and experiment for every answer. It did not use the answer's value. The new Team result connects supported answers, offers optional small experiments, and exposes exact supporting questions, directions and importance in a native disclosure. Screen and print use the same interpretation. Evidence is collapsed on screen and included in print. It is never added to public quote/share payloads.

## Rules and evidence

Low means values 1–2; high means 4–5. Value 3 is not directional evidence. Importance chooses presentation order, never changes a preference's meaning or establishes severity. No empirical/clinical validation is claimed.

| Pattern | Actual supporting Team inputs | Practical connection | Limit |
| --- | --- | --- | --- |
| owned-flexible | autonomy: individual responsibility; information: open/flexible | Clear responsibility can coexist with flexible updates; define the handoff signal | The autonomy item measures responsibility, not general freedom |
| explicit | information and reliability: explicit/predictable | Make plan changes visible rather than assuming more documentation is always better | Not a measure of ambiguity tolerance |
| collaborative | collaboration: togetherness; decisions: shared | Agree when consultation closes and action begins | No claim of collaboration skill or team agreement |
| shared-execution | decisions: shared; ownership: individual | Separate voice in a decision from ownership of implementation | These are not inherently contradictory preferences |
| individual | collaboration: individual space; ownership: individual responsibility | Name interfaces while preserving room for individual work | No diagnosis of introversion, independence or isolation |
| gradual | feedback and conflict: deliberate/gradual | A pause needs a way to return to the topic | Does not establish conflict avoidance |
| direct | feedback and conflict: fast/direct | Check whether timing suits the other person | Does not establish empathy, bluntness or another person's pace |
| feedback-repair | feedback: fast/direct; conflict: deliberate/gradual | Routine feedback and difficult repair may need different conditions | Context-dependent preference, not a contradiction/error |
| speed-quality | pace: fast/direct; quality: quality-first | Clarify scope or pace if time becomes constrained | No claim that speed and quality are inherently incompatible |
| pressure-shift | ordinary and optional pressure answer **for the same dimension** on opposite sides | Agree how behaviour changes when that context changes | Does not predict stress behaviour; it is a stated hypothetical preference |

Pressure reversals suppress ordinary-condition combinations that use the reversed item. Multiple reversals share one interpretation with all supporting pairs. At most three distinct patterns are shown, with pressure changes first, then stated importance and conditional tensions. The open-context section acknowledges answers not covered by the selected rules; absence of a pattern is not evidence that an area is resolved.

## Insufficient evidence

`buildTeamSoloInsights` accepts validated partial Team evidence for provisional use and tests; it is not a new partial-submission workflow. Final submission still requires all ten required answers. Four pressure scenarios remain optional. Missing required answers show a provisional label and the actual missing questions. Midpoints may mean balance, uncertainty or context dependence; this scale cannot tell which. Unanswered scenarios are not inferred. A limited result offers a concrete-situation reflection and leaves unsupported insight/action sections absent.

## Domain review

| Existing mode | Finding | This sprint |
| --- | --- | --- |
| Team Solo | Value-independent repeated copy; no multi-answer interpretation | Fixed |
| Team/We (two-person invite) | Shared generic category templates; distinct two-person evidence and versioned storage | No change; separate domain-specific interpretation review |
| Founder Solo | Same repeated Solo template across business, capital, governance and crisis items | No Team wording applied; needs Founder-domain review |
| Family/Friendship/modern Partner Solo | Same repeated template; relationship-specific semantics | No Team rules applied; separate review |
| Career (PersonalAlignmentJourney) | Current alignment vs importance creates tensions/next reflection and browser-local longitudinal snapshots | Different engine and persistence contract; no change, review depth separately |
| Self | Already synthesizes cross-area support, tension, constraints and experiments | Preserved; existing source-characterization test is CRLF-sensitive baseline debt |
| Life Vision | Separate timeline, evidence and scenario outputs | Preserved; no workplace rules applied |
| Legacy shared-device Partner | Separate two-person local comparison | Preserved |

Reusable concepts: typed evidence, localization, native disclosure, explicit context limits and a per-domain deterministic interpreter. The Team pattern rules are deliberately not a generic assessment framework. Other modules are not declared complete.

## Verification and rollback

Use `tests/life-alignment-team-insights.test.tsx` and the existing Life Alignment, security and privacy suites. Synthetic fixtures map requested profiles to the actual questionnaire and explicitly mark unmeasured constructs. Full-suite baseline failures must be reported separately. Real Founder satisfaction, psychometric validation, real screenreader/iOS coverage and hosted acceptance require independent evidence.

For a future release rollback, revert this one commit or restore the previously verified application deployment. No data migration or cleanup is involved. Do not erase saved/shared sessions or change shared interpretation versions. This local commit alone does not authorize push or deployment.
