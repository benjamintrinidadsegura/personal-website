export const echoPageSize = 12;
const maxPage = 1000000;

export function parseEchoFeed(search: { q?: string | string[]; page?: string | string[]; sort?: string | string[] }, popularEnabled: boolean) {
  const keyword = typeof search.q === "string" ? Array.from(search.q.trim()).slice(0, 40).join("") : "";
  const number = typeof search.page === "string" && /^\d{1,7}$/u.test(search.page) ? Number(search.page) : 1;
  return { keyword, page: Math.max(1, Math.min(number, maxPage)), popular: popularEnabled && search.sort === "popular" };
}

export function echoFeedUrl(pathname: string, query: ReturnType<typeof parseEchoFeed>) {
  const params = new URLSearchParams();
  if (query.keyword) params.set("q", query.keyword);
  if (query.popular) params.set("sort", "popular");
  if (query.page > 1) params.set("page", String(query.page));
  return params.size ? `${pathname}?${params}` : pathname;
}
