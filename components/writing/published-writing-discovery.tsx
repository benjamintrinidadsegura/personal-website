import { WritingDiscoverySnapshot } from "@/components/writing/writing-discovery-snapshot";
import { createDiscoveryItemsWithWriting } from "@/data/discovery-index";
import { getPublishedWritingResult, isPublishedWritingRetryable } from "@/lib/writing/queries";
import type { Locale } from "@/lib/i18n/config";

export async function PublishedWritingDiscovery({ locale }: { locale: Locale }) {
  const result = await getPublishedWritingResult(locale, { consumer: "discovery_index" });
  const retryable = result.status === "unavailable" && await isPublishedWritingRetryable(locale);
  return <WritingDiscoverySnapshot locale={locale} items={createDiscoveryItemsWithWriting(result.data)} status={result.status} latest={result.data[0]} retryable={retryable} />;
}
