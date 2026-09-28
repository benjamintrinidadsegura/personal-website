# Writing translation architecture

Writing keeps one canonical `writing_articles` row and one stable slug. The row stores the source locale and a monotonically increasing source revision. `writing_article_translations` stores one variant per non-source locale with `pending`, `translated`, `stale`, or `failed` status; the source itself is exposed as `source` in the Studio status query.

Public rendering selects a translation only when its status is `translated` and its `source_revision` equals the article’s current revision. Missing, failed, and stale variants fall back to the source document. Only the source and current translated variants receive localized canonical/hreflang/sitemap entries. The share carousel receives the already selected public document, so pagination runs after locale selection.

The import boundary accepts only `title`, `deck`, `excerpt`, and the existing safe `bodyJson` document shape. It derives plain text server-side and rejects unknown fields, control characters, invalid structure, and oversized input.

## Provider and privacy gate

The approved server-only adapter uses the OpenAI Responses API with `gpt-6-luna`, `reasoning.effort: none`, no tools, no web access, no response storage, and strict Structured Outputs. It resolves to `null` unless both the server credential and the exact approved model configuration are present.

The provider translates keyed semantic text leaves rather than documents. Stable ids are derived locally from block identity and exact structural paths. The response contains only translated top-level copy and `{id, text}` pairs. BTS then rehydrates those values into a deep clone of the source document, retaining all block types, ids, order, nesting, inline types, styles, link destinations, document metadata, and whitespace boundaries locally. Exact id-set validation makes cross-node redistribution and provider-authored structure impossible.

Only complete locales can reach `complete_writing_translation_generation`. Valid first-pass leaves can be retained for bounded targeted repair of invalid or missing leaves, but neither first-pass nor repair output is persisted partially. The Privacy page describes the resulting server-side Writing-to-OpenAI data flow; newsletter subscriber data, assessment/profile data, admin credentials, and analytics are outside it.
