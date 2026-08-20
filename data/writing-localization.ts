import type { WritingLanguage } from "@/types/writing";

export type WritingLocalization = {
  language: WritingLanguage;
  translations?: Partial<Record<WritingLanguage, string>>;
};

/**
 * Editorial language ownership without a database migration. Published legacy
 * articles are conservatively treated as German until a slug is registered.
 * Paired variants point at each other explicitly; no translation is inferred.
 */
export const writingLocalizationRegistry = {} as const satisfies Record<string, WritingLocalization>;

export function getWritingLocalization(slug: string): WritingLocalization {
  return writingLocalizationRegistry[slug as keyof typeof writingLocalizationRegistry]
    ?? { language: "de" };
}

export function getWritingTranslationSlug(slug: string, targetLanguage: WritingLanguage): string | null {
  const localization = getWritingLocalization(slug);
  if (localization.language === targetLanguage) return slug;
  const translationSlug = localization.translations?.[targetLanguage];
  if (!translationSlug) return null;
  const translation = getWritingLocalization(translationSlug);
  return translation.language === targetLanguage ? translationSlug : null;
}
