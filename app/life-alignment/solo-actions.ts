"use server";

import { getRelationshipModule, isRelationshipModuleId } from "@/data/life-alignment-relationship";
import { buildRelationshipSoloResult, normalizeRelationshipAnswers } from "@/lib/life-alignment-relationship";
import { getLocale } from "@/lib/i18n/server";
import type { RelationshipSoloResult } from "@/types/life-alignment-relationship";

export async function buildSoloRelationshipResultAction(moduleId: unknown, serializedAnswers: unknown): Promise<RelationshipSoloResult | null> {
  if (!isRelationshipModuleId(moduleId) || typeof serializedAnswers !== "string" || serializedAnswers.length > 32_000) return null;
  try {
    const definition = getRelationshipModule(moduleId);
    const answers = normalizeRelationshipAnswers(definition, JSON.parse(serializedAnswers));
    return answers ? buildRelationshipSoloResult(moduleId, answers, await getLocale()) : null;
  } catch {
    return null;
  }
}
