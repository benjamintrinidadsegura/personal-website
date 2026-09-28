# Writing newsletter preparation

Writing publication remains the primary operation. The final Writing control offers an explicit, localized checkbox that defaults off. When it is off, publish behavior is unchanged. When it is on, the server first completes `publish_writing_article_v3` and only then calls `prepare_writing_newsletter_edition`.

The preparation RPC reuses the existing `newsletter_editions` snapshot model. An article-scoped transaction lock makes retries idempotent. An existing draft is returned unchanged so manually edited draft subject, preheader, introduction, and snapshot content are not overwritten. If the article has only a sending, sent, or failed edition, that existing state is returned and no new edition is created. Only an article with no edition receives a new internal draft.

Preparation never creates deliveries, starts sending, contacts subscribers, or calls a provider. Newsletter Studio remains the only place where an administrator can explicitly start delivery.

If preparation fails after publication, the published article remains available and the public redirect still occurs. A status visible only to an AAL2 administrator offers a retry action that calls preparation directly without republishing. Created and existing editions link back to their protected Newsletter Studio page.
