import { SocialPostCard } from "@/components/sharing/social-post-card";
import type { WritingShareDictionary } from "@/data/i18n/writing-share";
import { writingSocialPostTitleFontSize, writingSocialPostLayout } from "@/lib/writing/carousel-layout";
import { writingShareTextScale } from "@/lib/writing/share-segmentation";
import type { WritingCarouselBlock, WritingShareFormat, WritingShareSource } from "@/types/writing";

export function WritingSocialPostCard({ blocks, cardIndex, cardTotal, copy, format, source, text }: { blocks?: WritingCarouselBlock[]; cardIndex: number; cardTotal: number; copy: WritingShareDictionary; format: WritingShareFormat; source: WritingShareSource; text: string }) {
  const progression = cardTotal > 1 ? `${String(cardIndex + 1).padStart(2, "0")} / ${String(cardTotal).padStart(2, "0")}` : null;
  const firstSlide = cardIndex === 0;
  const readingTime = (format === "story" || firstSlide) && source.readingMinutes ? copy.readingTime.replace("{minutes}", String(source.readingMinutes)) : null;

  return (
    <SocialPostCard
      writingCard
      articleTitleFontSize={writingSocialPostTitleFontSize(source.articleTitle, source.language, format)}
      writingSlideIndex={cardIndex}
      writingSlideTotal={cardTotal}
      articleTitle={source.kind === "article" && firstSlide ? source.articleTitle : undefined}
      writingLayout={writingSocialPostLayout(format, cardIndex, source.language, source.articleTitle, source.kind === "article", blocks)}
      articleBlocks={blocks?.length ? blocks : [{ kind: "paragraph", separatorBefore: "", text }]}
      domain={source.domain}
      format={format}
      identityName={source.authorName}
      kind={source.kind === "article" ? "article" : "thought"}
      metadata={[readingTime].filter((item): item is string => Boolean(item))}
      progression={progression}
      referenceLabel={source.kind === "article" ? undefined : copy.fromArticle}
      referenceTitle={source.kind === "article" ? undefined : source.articleTitle}
      scale={writingShareTextScale(text, "socialPost", source.language)}
      source={copy.sourceLabel}
      text={source.kind === "article" ? text : `“${text}”`}
      titleScale={source.kind === "article" ? writingShareTextScale(source.articleTitle, "socialPost", source.language) : undefined}
    />
  );
}
