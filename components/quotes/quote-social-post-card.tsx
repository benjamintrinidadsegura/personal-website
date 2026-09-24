import { SocialPostCard } from "@/components/sharing/social-post-card";
import { siteConfig } from "@/data/site";
import type { SelectedQuote } from "@/types/quote";
import type { WritingShareFormat } from "@/types/writing";

export function QuoteSocialPostCard({ format, originalLabel, quote, surfaceLabel }: { format: WritingShareFormat; originalLabel: string; quote: SelectedQuote; surfaceLabel: string }) {
  const scale = quote.text.length > 170 ? "long" : quote.text.length > 105 ? "medium" : "short";
  const attribution = quote.origin === "bts-original" ? originalLabel : quote.attribution;

  return (
    <SocialPostCard
      attribution={attribution}
      avatarLabel="BTS"
      domain={siteConfig.domain}
      format={format}
      handle={`@${siteConfig.domain}`}
      identityName="BTS"
      kind="quote"
      metadata={[surfaceLabel]}
      referenceTitle={quote.source}
      scale={scale}
      source={surfaceLabel}
      text={`“${quote.text}”`}
    />
  );
}
