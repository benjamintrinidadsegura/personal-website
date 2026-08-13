const COMBINING_MARKS = /[\u0300-\u036f]/gu;

export function createWritingSlugBase(title: string): string {
  const slug = title
    .normalize("NFKD")
    .replace(COMBINING_MARKS, "")
    .replace(/ß/gu, "ss")
    .toLocaleLowerCase("de-DE")
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-+|-+$/gu, "")
    .slice(0, 80)
    .replace(/-+$/gu, "");

  return slug || "writing";
}

export function writingSlugCandidate(base: string, collisionIndex: number): string {
  return collisionIndex <= 1 ? base : `${base}-${collisionIndex}`;
}
