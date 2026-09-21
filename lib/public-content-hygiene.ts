import type { PublicEcho } from "@/types/echowall";
import type { PublicWritingComment } from "@/types/comments";
import type { PublicWritingSummary } from "@/types/writing";

const exactSyntheticMarkers = new Set([
  "archive recovery test message",
  "development only",
  "development-only",
  "fixture",
  "qa",
  "synthetic",
  "test",
  "writing test updated",
]);

const syntheticLabel = /^(?:qa|test|fixture|synthetic|development[- ]only)(?:[_:#-].+|\s+(?:content|data|entry|message|record|updated))$/u;
const recoveryTest = /^(?:archive\s+)?recovery\s+test(?:\s+message)?$/u;

function normalizeMarker(value: unknown): string {
  return typeof value === "string"
    ? value.normalize("NFKC").trim().toLocaleLowerCase("en-US").replace(/\s+/gu, " ")
    : "";
}

export function isKnownPublicSyntheticValue(value: unknown): boolean {
  const normalized = normalizeMarker(value);
  return normalized.length > 0 && (
    exactSyntheticMarkers.has(normalized)
    || syntheticLabel.test(normalized)
    || recoveryTest.test(normalized)
  );
}

export function isPublicWritingReady(article: Pick<PublicWritingSummary, "deck" | "excerpt" | "slug" | "title">): boolean {
  return ![article.title, article.deck, article.excerpt, article.slug.replaceAll("-", " ")]
    .some(isKnownPublicSyntheticValue);
}

export function isPublicEchoReady(echo: Pick<PublicEcho, "displayName" | "message">): boolean {
  return ![echo.displayName, echo.message].some(isKnownPublicSyntheticValue);
}

export function isPublicCommentReady(comment: PublicWritingComment): boolean {
  return comment.deletion === "author"
    || ![comment.displayName, comment.body].some(isKnownPublicSyntheticValue);
}
