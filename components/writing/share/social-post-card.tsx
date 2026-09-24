import { SocialPostCard } from "@/components/sharing/social-post-card";
import type { WritingShareDictionary } from "@/data/i18n/writing-share";
import { writingShareTextScale } from "@/lib/writing/share-segmentation";
import type { WritingShareFormat, WritingShareSource } from "@/types/writing";

export function WritingSocialPostCard({ cardIndex, cardTotal, copy, format, source, text }: { cardIndex: number; cardTotal: number; copy: WritingShareDictionary; format: WritingShareFormat; source: WritingShareSource; text: string }) {
  const progression = cardTotal > 1 ? `${String(cardIndex + 1).padStart(2, "0")} / ${String(cardTotal).padStart(2, "0")}` : null;
  const readingTime = source.readingMinutes ? copy.readingTime.replace("{minutes}", String(source.readingMinutes)) : null;

  return (
    <SocialPostCard
      articleTitle={source.kind === "article" ? source.articleTitle : undefined}
      avatarLabel="BT"
      domain={source.domain}
      format={format}
      handle={`@${source.domain}`}
      identityName={source.authorName}
      kind={source.kind === "article" ? "article" : "thought"}
      metadata={[copy.sourceLabel, readingTime].filter((item): item is string => Boolean(item))}
      progression={progression}
      referenceLabel={source.kind === "article" ? undefined : copy.fromArticle}
      referenceTitle={source.kind === "article" ? undefined : source.articleTitle}
      scale={writingShareTextScale(text, "socialPost", source.language)}
      source={copy.sourceLabel}
      text={source.kind === "article" ? text : `“${text}”`}
    />
  );
}
