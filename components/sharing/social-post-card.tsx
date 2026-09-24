import type { WritingShareFormat } from "@/types/writing";

type SocialPostScale = "short" | "medium" | "long";

export function SocialPostCard({
  articleTitle,
  attribution,
  avatarLabel,
  domain,
  format,
  handle,
  identityName,
  kind,
  metadata,
  progression,
  referenceLabel,
  referenceTitle,
  scale,
  source,
  text,
}: {
  articleTitle?: string;
  attribution?: string;
  avatarLabel: string;
  domain: string;
  format: WritingShareFormat;
  handle: string;
  identityName: string;
  kind: "article" | "thought" | "quote";
  metadata: readonly string[];
  progression?: string | null;
  referenceLabel?: string;
  referenceTitle?: string;
  scale: SocialPostScale;
  source: string;
  text: string;
}) {
  return (
    <div aria-hidden="true" className="writing-share-card social-post-card" data-format={format} data-post-kind={kind} data-scale={scale} data-style="social-post">
      <div className="social-post-canvas">
        <div className="social-post-canvas-heading"><span>BTS.ONLINE</span><i aria-hidden="true" /></div>
        <article className="social-post-surface">
          <header className="social-post-identity">
            <span className="social-post-avatar"><span>{avatarLabel}</span></span>
            <div className="social-post-identity-copy">
              <p className="social-post-name">{identityName}</p>
              <p className="social-post-handle"><span>{handle}</span><span aria-hidden="true"> · </span><span>{source}</span></p>
            </div>
            {progression ? <span className="social-post-progress">{progression}</span> : null}
          </header>

          <div className="social-post-body">
            {articleTitle ? <p className="social-post-article-title">{articleTitle}</p> : null}
            <p className={articleTitle ? "social-post-article-teaser" : "social-post-text"}>{text}</p>
            {referenceTitle ? (
              <div className="social-post-reference">
                {referenceLabel ? <span>{referenceLabel}</span> : null}
                <strong>{referenceTitle}</strong>
              </div>
            ) : null}
            {attribution ? <p className="social-post-attribution">{attribution}</p> : null}
          </div>

          <footer className="social-post-footer">
            <div className="social-post-metadata">
              {metadata.map((item, index) => <span key={`${item}-${index}`}>{index > 0 ? <i aria-hidden="true">·</i> : null}{item}</span>)}
            </div>
            <span className="social-post-domain">{domain}</span>
          </footer>
        </article>
        <div className="social-post-canvas-footer"><i aria-hidden="true" /><span>{domain}</span></div>
      </div>
    </div>
  );
}
