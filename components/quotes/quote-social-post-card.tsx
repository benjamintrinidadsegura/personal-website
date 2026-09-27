import { SocialPostCard } from "@/components/sharing/social-post-card";
import { siteConfig } from "@/data/site";
import { quoteSocialPostTextFit } from "@/lib/sharing/quote-social-post-fit";
import type { SelectedQuote } from "@/types/quote";
import type { WritingShareFormat } from "@/types/writing";

export function QuoteSocialPostCard({ format, originalLabel, quote, surfaceLabel }: { format: WritingShareFormat; originalLabel: string; quote: SelectedQuote; surfaceLabel: string }) {
  const textFit = quoteSocialPostTextFit(quote.text, format);
  const attribution = quote.origin === "bts-original" ? originalLabel : quote.attribution;

  return (
    <SocialPostCard
      attribution={attribution}
      domain={siteConfig.domain}
      format={format}
      identityName="BTS"
      kind="quote"
      metadata={[]}
      referenceTitle={quote.source}
      scale={textFit.scale}
      source={surfaceLabel}
      text={`“${quote.text}”`}
      textFit={textFit}
    />
  );
}
