import { lifeUiValue } from "@/data/i18n/life-alignment-ui";
import type { LifeAlignmentResult } from "@/types/life-alignment";
import type { Locale } from "@/lib/i18n/config";
export const LIFE_ALIGNMENT_DISCLAIMER = "Diese Momentaufnahme ordnet deine eigenen Angaben. Sie ist keine Bewertung deines Lebens und keine medizinische, psychologische, rechtliche, finanzielle oder sonstige fachliche Beratung.";
function withinLimit(blocks: readonly string[], finalBlock: string, limit: number): string {
    const included: string[] = [];
    for (const block of blocks) {
        const normalized = block.trim();
        if (!normalized)
            continue;
        if ([...included, normalized, finalBlock].join("\n\n").length <= limit)
            included.push(normalized);
    }
    return [...included, finalBlock].join("\n\n");
}
export function buildLifeAlignmentResultText(result: LifeAlignmentResult, locale: Locale = "de"): string {
    const landscape = result.areas.map((area) => `- ${area.title}: ${area.currentLabel}; ${area.capacityLabel}; ${lifeUiValue(locale, "desired direction", "gewünschte Richtung")}: ${area.directionLabel}; ${area.signalLabel}.`);
    const insights = result.insights.map((insight) => `- ${insight.title}\n  ${insight.explanation}\n  ${lifeUiValue(locale, "In everyday life", "Im Alltag")}: ${insight.everydayInterpretation}`);
    const paths = result.actionPaths.map((path) => `- ${path.title}\n  ${lifeUiValue(locale, "Why", "Warum")}: ${path.why}\n  ${lifeUiValue(locale, "First step", "Erster Schritt")}: ${path.firstStep}\n  ${lifeUiValue(locale, "Example", "Beispiel")}: ${path.example}\n  ${lifeUiValue(locale, "Learning opportunity", "Lernmöglichkeit")}: ${path.learning}\n  Trade-off: ${path.tradeoff}\n  ${lifeUiValue(locale, "Reversible", "Umkehrbar")}: ${path.reversible ? (lifeUiValue(locale, "yes", "ja")) : (lifeUiValue(locale, "not fully", "nicht vollständig"))}.`);
    return withinLimit([
        `Life Alignment · bts.online\n${result.title}`,
        [lifeUiValue(locale, "Snapshot:", "Momentaufnahme:"), ...result.summary].join("\n"),
        ["Alignment Landscape:", ...landscape].join("\n"),
        [lifeUiValue(locale, "Relationships across areas:", "Bereichsübergreifende Zusammenhänge:"), ...insights].join("\n"),
        result.constraints.length > 0 ? [lifeUiValue(locale, "Current conditions:", "Gegenwärtige Bedingungen:"), ...result.constraints.map((item) => `- ${item}`)].join("\n") : "",
        [lifeUiValue(locale, "Selected focus:", "Gewählter Fokus:"), result.focus.title, result.tradeoffLabel].join("\n"),
        [lifeUiValue(locale, "Source and your interpretation:", "Quelle und eigene Deutung:"), ...result.authorityLabels.map((item) => `- ${item}`), result.entanglementLabel].join("\n"),
        result.focusIntention ? `${lifeUiValue(locale, "What you want to protect or make possible", "Was du schützen oder ermöglichen möchtest")}:\n${result.focusIntention}` : "",
        [lifeUiValue(locale, "Small next experiment:", "Kleiner nächster Versuch:"), result.experiment.title, result.experiment.action, `${lifeUiValue(locale, "Observation question", "Beobachtungsfrage")}: ${result.experiment.observe}`, result.experiment.boundary].join("\n"),
        [lifeUiValue(locale, "Possible paths:", "Mögliche Wege:"), ...paths].join("\n"),
        [lifeUiValue(locale, "Small tools:", "Kleine Werkzeuge:"), ...result.tools.map((tool) => `- ${tool.title} (${tool.duration}): ${tool.prompt}`)].join("\n"),
        [result.closing.title, result.closing.body, ...result.closing.reminders.map((item) => `- ${item}`)].join("\n"),
    ], lifeUiValue(locale, "This snapshot organises your own answers. It is not an evaluation of your life or medical, psychological, legal, financial or other professional advice.", LIFE_ALIGNMENT_DISCLAIMER), 6000);
}
export function buildLifeAlignmentClipboardSummary(result: LifeAlignmentResult, locale: Locale = "de"): string {
    return withinLimit([
        `Life Alignment · bts.online\n${result.title}`,
        result.summary.slice(0, 3).join(" "),
        `${lifeUiValue(locale, "Focus", "Fokus")}: ${result.focus.title}. ${result.tradeoffLabel}`,
        `${lifeUiValue(locale, "Possible experiment", "Möglicher Versuch")}: ${result.experiment.title}. ${result.experiment.action}`,
    ], lifeUiValue(locale, "Private short version without your free-text note or detailed conditions. No evaluation or professional advice.", "Private Kurzfassung ohne deine freie Notiz oder detaillierte Bedingungen. Keine Bewertung oder fachliche Beratung."), 1200);
}
