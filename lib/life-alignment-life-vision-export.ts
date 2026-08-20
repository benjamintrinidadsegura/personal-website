import { lifeUiValue } from "@/data/i18n/life-alignment-ui";
import { getLifeVisionContent } from "@/data/i18n/life-alignment";
import type { Locale } from "@/lib/i18n/config";
import type { LifeVisionResult } from "@/types/life-alignment-life-vision";
export function buildLifeVisionResultText(result: LifeVisionResult, locale: Locale = "de"): string {
    const lines = [
        "LIFE ALIGNMENT · LIFE VISION",
        result.title,
        result.description,
        `${lifeUiValue(locale, "Future frame", "Zukunftsrahmen")}: ${result.horizonLabel}`,
        "",
        lifeUiValue(locale, "DESCRIPTIVE SNAPSHOT", "DESKRIPTIVE MOMENTAUFNAHME"),
        result.visualSnapshot.headline,
        result.visualSnapshot.description,
        result.visualSnapshot.directionSummary,
        result.visualSnapshot.protectionSummary,
        result.visualSnapshot.contextSummary,
        "",
        "FUTURE DIRECTION LANDSCAPE",
        ...result.areas.flatMap((area) => [
            `${area.title}: ${area.emphasisLabel}${area.protected ? (lifeUiValue(locale, " · protected", " · geschützt")) : ""}`,
            ...area.sourceLabels.map((source) => `  ${lifeUiValue(locale, "Source signal", "Herkunftssignal")}: ${source}`),
        ]),
        "",
        lifeUiValue(locale, "PROTECTED CONDITIONS", "GESCHÜTZTE BEDINGUNGEN"),
        ...(result.protectedLabels.length ? result.protectedLabels.map((label) => `- ${label}`) : [lifeUiValue(locale, "- None recorded", "- Keine festgehalten")]),
        "",
        lifeUiValue(locale, "REAL CONDITIONS AND TRADE-OFF", "REALE BEDINGUNGEN UND ABWÄGUNG"),
        ...(result.constraintLabels.length ? result.constraintLabels.map((label) => `- ${label}`) : [lifeUiValue(locale, "- No specific constraint recorded", "- Keine konkrete Grenze festgehalten")]),
        result.tradeoffLabel,
        "",
        lifeUiValue(locale, "EVIDENCE-LINKED OBSERVATIONS", "EVIDENZVERKNÜPFTE BEOBACHTUNGEN"),
        ...result.insights.flatMap((insight) => [insight.title, insight.finding, `${lifeUiValue(locale, "Why", "Warum")}: ${insight.why}`, insight.illustrativeExample, ...insight.evidence.map((item) => `  ${item.label}: ${item.detail}`), ""]),
        lifeUiValue(locale, "POSSIBLE PATHS", "MÖGLICHE WEGE"),
        ...result.actionPaths.flatMap((path) => [path.title, `${lifeUiValue(locale, "Why it may fit", "Warum passend")}: ${path.whyItMayFit}`, `${lifeUiValue(locale, "First step", "Erster Schritt")}: ${path.firstStep}`, `${lifeUiValue(locale, "Trade-off", "Abwägung")}: ${path.tradeoff}`, `${lifeUiValue(locale, "Learning question", "Lernfrage")}: ${path.learningQuestion}`, `${lifeUiValue(locale, "Reversibility", "Reversibilität")}: ${path.reversibility}`, ...path.tools.map((tool) => `  ${lifeUiValue(locale, "Tool", "Hilfe")} – ${tool.title}: ${tool.use}`), ...path.evidence.map((item) => `  ${lifeUiValue(locale, "Basis", "Grundlage")} – ${item.label}: ${item.detail}`), ""]),
        lifeUiValue(locale, "CLOSING ORIENTATION", "ABSCHLIESSENDE ORIENTIERUNG"),
        result.closingOrientation.headline,
        result.closingOrientation.orientation,
        ...result.closingOrientation.questions.map((question) => `- ${question}`),
        ...result.closingOrientation.evidence.map((item) => `  ${lifeUiValue(locale, "Basis", "Grundlage")} – ${item.label}: ${item.detail}`),
        "",
        getLifeVisionContent(locale).disclaimer,
    ];
    return lines.join("\n").slice(0, 16000);
}
export function buildLifeVisionClipboardSummary(result: LifeVisionResult, locale: Locale = "de"): string {
    const lines = [
        `LIFE ALIGNMENT · LIFE VISION · ${lifeUiValue(locale, "REDUCED SHORT VERSION", "REDUZIERTE KURZFASSUNG")}`,
        `${lifeUiValue(locale, "Future frame", "Zukunftsrahmen")}: ${result.horizonLabel}`,
        "",
        lifeUiValue(locale, "Selected directions:", "Gewählte Richtungen:"),
        ...result.areas.map((area) => `- ${area.title}: ${area.emphasisLabel}`),
        "",
        lifeUiValue(locale, "Possible paths selected by me:", "Von mir gewählte mögliche Wege:"),
        ...result.actionPaths.map((path) => `- ${path.title}`),
        "",
        lifeUiValue(locale, "Intentionally omitted: source signals, specific constraints, detailed trade-offs and evidence.", "Bewusst weggelassen: Herkunftssignale, konkrete Grenzen, detaillierte Abwägungen und Evidenz."),
        lifeUiValue(locale, "This short version is a qualitative self-reflection, not a recommendation or advice.", "Diese Kurzfassung ist eine qualitative Selbstreflexion, keine Empfehlung oder Beratung."),
    ];
    return lines.join("\n").slice(0, 1800);
}
