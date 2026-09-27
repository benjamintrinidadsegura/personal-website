import Image from "next/image";
import type { CSSProperties } from "react";

import type { QuoteSocialPostFit } from "@/lib/sharing/quote-social-post-fit";
import type { WritingShareFormat } from "@/types/writing";

type SocialPostScale = "short" | "medium" | "long";

export function SocialPostCard({
  articleTitle,
  attribution,
  domain,
  format,
  identityName,
  kind,
  metadata,
  progression,
  referenceLabel,
  referenceTitle,
  scale,
  source,
  text,
  textFit,
}: {
  articleTitle?: string;
  attribution?: string;
  domain: string;
  format: WritingShareFormat;
  identityName: string;
  kind: "article" | "thought" | "quote";
  metadata: readonly string[];
  progression?: string | null;
  referenceLabel?: string;
  referenceTitle?: string;
  scale: SocialPostScale;
  source: string;
  text: string;
  textFit?: QuoteSocialPostFit;
}) {
  const fitStyle = textFit ? {
    "--social-post-quote-attribution-gap": textFit.attributionGap,
    "--social-post-quote-body-spacing": textFit.bodySpacing,
    "--social-post-quote-line-height": textFit.lineHeight,
    "--social-post-quote-size": textFit.fontSize,
  } as CSSProperties : undefined;

  return (
    <div aria-hidden="true" className="writing-share-card social-post-card" data-format={format} data-post-kind={kind} data-scale={scale} data-style="social-post" data-text-fit={textFit?.density} style={fitStyle}>
      <div className="social-post-canvas">
        <article className="social-post-surface">
          <header className="social-post-identity">
            <span className="social-post-avatar"><Image aria-hidden="true" alt="" src="/icons/bts-app-icon-192.png" width={192} height={192} sizes="112px" loading="eager" unoptimized /></span>
            <div className="social-post-identity-copy">
              <p className="social-post-name">{identityName}</p>
              <p className="social-post-source"><span>{source}</span></p>
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
            {metadata.length > 0 ? <div className="social-post-metadata">{metadata.map((item, index) => <span key={`${item}-${index}`}>{index > 0 ? <i aria-hidden="true">·</i> : null}{item}</span>)}</div> : <span aria-hidden="true" />}
            <span className="social-post-domain">{domain}</span>
          </footer>
        </article>
      </div>
    </div>
  );
}
