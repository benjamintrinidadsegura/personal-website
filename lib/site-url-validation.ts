const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

/** Validate a canonical origin without reading deployment configuration. */
export function parseSiteUrl(value: string | undefined): URL | null {
  const candidate = value?.trim();
  if (!candidate) return null;

  try {
    const url = new URL(candidate);
    const localHttp = url.protocol === "http:" && LOCAL_HOSTS.has(url.hostname);
    if (
      (url.protocol !== "https:" && !localHttp)
      || url.username !== ""
      || url.password !== ""
      || (!localHttp && url.port !== "")
      || url.pathname !== "/"
      || url.search !== ""
      || url.hash !== ""
    ) return null;
    return new URL(url.origin);
  } catch {
    return null;
  }
}
