import { SocialPostCard } from "@/components/sharing/social-post-card";
import type { WritingShareDictionary } from "@/data/i18n/writing-share";
import { availableCarouselBodyHeight } from "@/lib/writing/carousel-layout";
import { writingShareTextScale } from "@/lib/writing/share-segmentation";
import type { WritingCarouselBlock, WritingShareFormat, WritingShareSource } from "@/types/writing";

export function WritingSocialPostCard({ blocks, cardIndex, cardTotal, copy, format, source, text }: { blocks?: WritingCarouselBlock[]; cardIndex: number; cardTotal: number; copy: WritingShareDictionary; format: WritingShareFormat; source: WritingShareSource; text: string }) {
  const progression = cardTotal > 1 ? `${String(cardIndex + 1).padStart(2, "0")} / ${String(cardTotal).padStart(2, "0")}` : null;
  const firstSlide = cardIndex === 0;
  const readingTime = firstSlide && source.readingMinutes ? copy.readingTime.replace("{minutes}", String(source.readingMinutes)) : null;

  return (
    <SocialPostCard
      articleTitle={source.kind === "article" && firstSlide ? source.articleTitle : undefined}
      articleBodyHeight={source.kind === "article" ? availableCarouselBodyHeight(format, cardIndex, source.language, source.articleTitle, true) : undefined}
      articleBlocks={source.kind === "article" ? blocks?.length ? blocks : [{ kind: "paragraph", separatorBefore: "", text }] : undefined}
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
