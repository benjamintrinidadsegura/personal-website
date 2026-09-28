import Image from "next/image";
import type { CSSProperties } from "react";

import type { QuoteSocialPostFit } from "@/lib/sharing/quote-social-post-fit";
import { carouselExportLength, carouselLayoutByFormat, carouselTypographyByComposition } from "@/lib/writing/carousel-layout";
import type { WritingCarouselBlock, WritingShareFormat } from "@/types/writing";

type SocialPostScale = "short" | "medium" | "long";

export function SocialPostCard({
  articleTitle,
  articleBodyHeight,
  articleBlocks,
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
  titleScale,
}: {
  articleTitle?: string;
  articleBodyHeight?: number;
  articleBlocks?: WritingCarouselBlock[];
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
  titleScale?: SocialPostScale;
}) {
  const layout = carouselLayoutByFormat[format];
  const typography = carouselTypographyByComposition.socialPost;
  const fitStyle = {
    "--social-post-body-zone-max-height": carouselExportLength(articleBodyHeight ?? layout.bodyHeight),
    "--social-post-footer-zone-min-height": carouselExportLength(layout.footerHeight),
    "--social-post-header-zone-min-height": carouselExportLength(layout.headerHeight),
    "--social-post-indicator-zone-width": carouselExportLength(layout.indicatorWidth),
    "--social-post-title-zone-max-height": carouselExportLength(layout.titleMaxHeight),
    "--writing-carousel-safe-margin": carouselExportLength(layout.safeMargin),
    "--writing-carousel-title-body-gap": carouselExportLength(layout.titleBodyGap),
    "--writing-carousel-body-font-size": carouselExportLength(typography.bodyFontSize),
    "--writing-carousel-body-line-height": carouselExportLength(typography.bodyLineHeight),
    "--writing-carousel-body-weight": typography.bodyWeight,
    "--writing-carousel-heading-font-size": carouselExportLength(typography.headingFontSize),
    "--writing-carousel-heading-line-height": carouselExportLength(typography.headingLineHeight),
    "--writing-carousel-heading-weight": typography.headingWeight,
    "--writing-carousel-block-gap": carouselExportLength(typography.blockGap),
    "--writing-carousel-heading-gap": carouselExportLength(typography.headingGap),
    "--writing-carousel-list-gap": carouselExportLength(typography.listGap),
    "--writing-carousel-quote-gap": carouselExportLength(typography.quoteGap),
    ...(textFit ? {
      "--social-post-quote-attribution-gap": textFit.attributionGap,
      "--social-post-quote-body-spacing": textFit.bodySpacing,
      "--social-post-quote-line-height": textFit.lineHeight,
      "--social-post-quote-size": textFit.fontSize,
    } : {}),
  } as CSSProperties;

  return (
    <div aria-hidden="true" className="writing-share-card social-post-card" data-format={format} data-post-kind={kind} data-scale={scale} data-style="social-post" data-text-fit={textFit?.density} data-title-scale={titleScale} style={fitStyle}>
      <div className="social-post-canvas">
        <article className="social-post-surface">
          <header className="social-post-identity" data-zone="identity">
            <span className="social-post-avatar"><Image aria-hidden="true" alt="" src="/icons/bts-app-icon-192.png" width={192} height={192} sizes="112px" loading="eager" unoptimized /></span>
            <div className="social-post-identity-copy">
              <p className="social-post-name">{identityName}</p>
              <p className="social-post-source"><span>{source}</span></p>
            </div>
            {progression ? <span className="social-post-progress" data-zone="indicator">{progression}</span> : null}
          </header>

          {articleTitle ? <div className="social-post-title-zone" data-zone="title"><p className="social-post-article-title">{articleTitle}</p></div> : null}
          <div className="social-post-body" data-zone="body">
            {articleBlocks?.length ? <div className="social-post-article-content">{articleBlocks.map((block, index) => {
              const className = `social-post-article-block social-post-article-${block.kind}`;
              if (block.kind === "heading") return <h2 key={`${index}:${block.text}`} className={className}>{block.text}</h2>;
              if (block.kind === "quote") return <blockquote key={`${index}:${block.text}`} className={className}>{block.text}</blockquote>;
              if (block.kind === "listItem") return <p key={`${index}:${block.text}`} className={className}><span aria-hidden="true">•</span>{block.text}</p>;
              return <p key={`${index}:${block.text}`} className={className}>{block.text}</p>;
            })}</div> : <p className="social-post-text">{text}</p>}
            {referenceTitle ? (
              <div className="social-post-reference">
                {referenceLabel ? <span>{referenceLabel}</span> : null}
                <strong>{referenceTitle}</strong>
              </div>
            ) : null}
            {attribution ? <p className="social-post-attribution">{attribution}</p> : null}
          </div>

          <footer className="social-post-footer" data-zone="footer">
            {metadata.length > 0 ? <div className="social-post-metadata">{metadata.map((item, index) => <span key={`${item}-${index}`}>{index > 0 ? <i aria-hidden="true">·</i> : null}{item}</span>)}</div> : <span aria-hidden="true" />}
            <span className="social-post-domain">{domain}</span>
          </footer>
        </article>
      </div>
    </div>
  );
}
