import "server-only";

import { getWritingTranslationProvider } from "@/lib/writing/openai-translation-provider";
import { generateWritingTranslationsWithProvider } from "@/lib/writing/translation-generation-core";
import type { WritingTranslationDatabase } from "@/lib/writing/translation-generation-core";
import type {
  WritingLanguage,
  WritingTranslationGenerationResult,
  WritingTranslationProvider,
} from "@/types/writing";

export async function generateWritingTranslations({
  articleId,
  database,
  provider = getWritingTranslationProvider(),
  sourceLocale,
  sourceRevision,
  targetLocales,
}: {
  articleId: string;
  database: WritingTranslationDatabase;
  provider?: WritingTranslationProvider | null;
  sourceLocale: WritingLanguage;
  sourceRevision: number;
  targetLocales?: readonly WritingLanguage[];
}): Promise<WritingTranslationGenerationResult[]> {
  return generateWritingTranslationsWithProvider({ articleId, database, provider, sourceLocale, sourceRevision, targetLocales });
}

export type { WritingTranslationDatabase };
