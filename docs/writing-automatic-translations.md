# Automatic Writing translations

Writing keeps one canonical article row and one explicit source locale. After a successful source publication, a post-response server task requests the six other supported locales without delaying the public redirect or optional Newsletter draft preparation. Source publication is never rolled back by translation failure.

The server-only provider calls the OpenAI Responses API with `gpt-6-luna`, `reasoning.effort: none`, no tools, no web access, and a strict JSON Schema response. Article content is treated as untrusted translation data. BTS owns the complete document structure: the provider receives only the top-level copy plus deterministic keyed text-leaf units with bounded neighboring context. It never receives authority to return blocks, inline structure, styles, identifiers, nesting, or link destinations.

Each unit id combines its source block id (when present) with its exact block/inline path. Provider output is accepted only when the target locale and id set are exact, every non-empty source leaf has a meaningful non-empty translation, intentionally empty leaves remain empty, textual URLs and protected BTS terms are preserved, and existing Writing validation passes. The final document is a local deep clone of the source with only text values replaced; source leading/trailing whitespace boundaries are restored locally.

If the first response contains only a bounded subset of invalid, duplicate, or missing units, valid units remain in memory and the provider receives at most two targeted repair requests containing only those units. Unknown ids, invalid top-level copy, or an incomplete result after the repair limit fail the locale. Nothing is persisted until the entire locale validates.

Generation uses at most three concurrent locale tasks. Each individual provider request has at most two attempts for transient transport failures, while semantic repair is separately bounded to two targeted requests. Database claim tokens serialize `(article_id, source_revision, target_locale)`, expire after ten minutes, and prevent duplicate persistence or stale completion. Locale failures are isolated and store only a bounded generic failure code. Existing public queries expose only a `translated` row whose source revision matches the current article; all other states fall back to the current source.

Manual Generate missing, Retry failed, Regenerate stale, Preview, and structured import controls remain inside the AAL2-protected Writing Studio. No public translation endpoint exists. Newsletter delivery is not part of this workflow.

Required server configuration:

```dotenv
OPENAI_API_KEY=
WRITING_TRANSLATION_MODEL=gpt-6-luna
```

The key must be configured in the approved server environment, never a browser variable or chat message. The model setting is optional; absence defaults to `gpt-6-luna`, while any other configured value fails closed.
