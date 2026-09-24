const PUBLIC_ORIGIN = "https://bts.online";
const LOCALE_PREFIX = /^\/(?:de|en|es|tr|pl|el|ru)(?=\/|$)/u;
const PUBLIC_PATH = /^\/(?:writing(?:\/[a-z0-9-]+)?|find-your-next-step(?:\/[a-z0-9-]+)?|life-alignment(?:\/[a-z0-9-]+){0,2}|tools\/(?:personal-advantage|money-profile))\/?$/u;
const THOUGHT_ANCHOR = /^#writing-thought-[A-Za-z0-9_-]+$/u;

/** Only public, query-free BTS routes may leave the site through a web-share URL. */
export function canonicalBtsShareUrl(input: string | null | undefined): string | null {
  if (!input || /[\s\\%?]/u.test(input) || input.includes("..") || input.startsWith("//")) return null;
  try {
    const url = new URL(input, PUBLIC_ORIGIN);
    if (url.origin !== PUBLIC_ORIGIN || url.username || url.password || url.search) return null;
    const localePrefix = url.pathname.match(LOCALE_PREFIX)?.[0];
    const publicPath = url.pathname.replace(LOCALE_PREFIX, "") || "/";
    if (publicPath !== "/" && !PUBLIC_PATH.test(publicPath)) return null;
    if (url.hash && (!publicPath.startsWith("/writing/") || !THOUGHT_ANCHOR.test(url.hash))) return null;
    if (localePrefix === "/de") url.pathname = publicPath;
    return url.toString();
  } catch {
    return null;
  }
}

function concisePublicContext(value: string): string {
  const compact = value.replace(/\s+/gu, " ").trim();
  const characters = Array.from(compact);
  return characters.length > 220 ? `${characters.slice(0, 217).join("").trimEnd()}…` : compact;
}

export function webShareDestinations(input: { text: string; url: string | null | undefined }): { whatsapp: string; linkedin: string; source: string } | null {
  const source = canonicalBtsShareUrl(input.url);
  if (!source) return null;
  const message = [concisePublicContext(input.text), source].filter(Boolean).join("\n");
  const whatsapp = new URL("https://wa.me/");
  whatsapp.searchParams.set("text", message);
  const linkedin = new URL("https://www.linkedin.com/sharing/share-offsite/");
  linkedin.searchParams.set("url", source);
  return { whatsapp: whatsapp.toString(), linkedin: linkedin.toString(), source };
}
