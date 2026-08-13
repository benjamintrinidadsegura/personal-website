import { isIP } from "node:net";

import {
  createContextHash,
  createFormToken,
  isAllowedRequestOrigin,
  verifyFormToken,
} from "@/lib/security/submission";

export { isAllowedRequestOrigin };

export function commentTokenPurpose(articleId: string): string {
  return `writing-comment:${articleId}`;
}

export function createCommentFormToken(articleId: string, secret: string, now = Date.now()): string {
  return createFormToken(secret, now, commentTokenPurpose(articleId));
}

export function verifyCommentFormToken(
  articleId: string,
  token: string,
  secret: string,
  now = Date.now(),
) {
  return verifyFormToken(token, secret, now, commentTokenPurpose(articleId));
}

function ipv6Prefix(value: string): string | null {
  const withoutZone = value.split("%")[0].toLowerCase();
  if (isIP(withoutZone) !== 6) return null;
  const halves = withoutZone.split("::");
  if (halves.length > 2) return null;
  const left = halves[0] ? halves[0].split(":") : [];
  const right = halves[1] ? halves[1].split(":") : [];
  const missing = 8 - left.length - right.length;
  if (missing < 0) return null;
  const groups = [...left, ...Array.from({ length: missing }, () => "0"), ...right]
    .map((group) => group.padStart(4, "0"));
  return groups.slice(0, 4).join(":");
}

export function reduceNetworkIdentifier(value: string): string | null {
  const trimmed = value.trim();
  if (isIP(trimmed) === 4) return trimmed.split(".").slice(0, 3).join(".");
  const mappedIpv4 = trimmed.includes(".") ? trimmed.split(":").at(-1) : null;
  if (mappedIpv4 && isIP(mappedIpv4) === 4) return mappedIpv4.split(".").slice(0, 3).join(".");
  const prefix = ipv6Prefix(trimmed);
  return prefix ? `${prefix}::/64` : null;
}

export function createCommentNetworkHash(value: string, secret: string): string | null {
  const reduced = reduceNetworkIdentifier(value);
  return reduced ? createContextHash("writing-comment-network-v1", reduced, secret) : null;
}

export function createCommentMessageHash(articleId: string, body: string, secret: string): string {
  return createContextHash("writing-comment-message-v1", `${articleId}:${body}`, secret);
}
