import { lifeUiValue } from "@/data/i18n/life-alignment-ui";
import type { PartnerComparisonResult } from "@/types/life-alignment-partner";
import type { Locale } from "@/lib/i18n/config";
const FULL_LIMIT = 16000;
const CLIPBOARD_LIMIT = 1600;
function bounded(text: string, limit: number): string {
    return text.length <= limit ? text : `${text.slice(0, limit - 1).trimEnd()}…`;
}
export function buildPartnerResultText(result: PartnerComparisonResult, locale: Locale = "de"): string {
    const findings = result.findings.map((finding) => {
        const perspectiveOrder = [...new Set(finding.evidence.map(({ participant }) => participant))];
        const evidence = finding.evidence.map((item) => {
            const perspective = perspectiveOrder.length === 1 ? (lifeUiValue(locale, "One released perspective", "Eine freigegebene Perspektive")) : perspectiveOrder.indexOf(item.participant) === 0 ? (lifeUiValue(locale, "One perspective", "Eine Perspektive")) : (lifeUiValue(locale, "The other perspective", "Die andere Perspektive"));
            return `  - ${perspective}: ${item.label}`;
        }).join("\n");
        const steps = finding.possibleNextSteps.map((step, index) => `  ${index + 1}. ${step}`).join("\n");
        const examples = finding.everydayExamples.map((example) => `  - ${example}`).join("\n");
        return `${finding.categoryLabel}\n${finding.headline}\n${finding.explanation}\n${lifeUiValue(locale, "In everyday life", "Im Alltag")}: ${finding.everydayTranslation}\n${lifeUiValue(locale, "Possible examples — not claims about your everyday life", "Mögliche Beispiele – keine Aussagen über euren Alltag")}:\n${examples}\n${lifeUiValue(locale, "Possible next steps", "Mögliche nächste Schritte")}:\n${steps}\n${lifeUiValue(locale, "What you might learn", "Was ihr lernen könntet")}: ${finding.whatCouldBeLearned}\n${lifeUiValue(locale, "Boundary of this reading", "Grenze dieser Lesart")}: ${finding.boundary}\n${lifeUiValue(locale, "Answer basis", "Antwortgrundlage")}:\n${evidence}`;
    }).join("\n\n");
    const paths = result.paths.map((path) => `${path.title}\n${lifeUiValue(locale, "Why this path is visible", "Warum dieser Weg sichtbar ist")}: ${path.why}\n${lifeUiValue(locale, "Possible approach", "Möglicher Ansatz")}: ${path.approach}\n${lifeUiValue(locale, "What you might learn", "Was ihr lernen könntet")}: ${path.whatCouldBeLearned}\nTrade-off: ${path.tradeoffs}\n${lifeUiValue(locale, "Reversibility", "Reversibilität")}: ${path.reversibility}`).join("\n\n");
    const experiments = result.experiments.map((experiment) => `${experiment.title}\n${experiment.steps.map((step, index) => `${index + 1}. ${step}`).join("\n")}\n${lifeUiValue(locale, "What you might learn", "Was ihr lernen könntet")}: ${experiment.whatCouldBeLearned}`).join("\n\n");
    const sharedOverview = result.sharedOverview.map((signal) => `${signal.label}\n${signal.headline}\n${signal.explanation}`).join("\n\n");
    return bounded(`Life Alignment · Partner / Relationship\n${result.title}\n\n${lifeUiValue(locale, "SHARED RELATIONSHIP CONTEXT", "GEMEINSAMER BEZIEHUNGSKONTEXT")}\n${sharedOverview}\n\n${lifeUiValue(locale, "CONCRETE SIGNALS", "KONKRETE HINWEISE")}\n${findings}\n\n${lifeUiValue(locale, "THREE REVERSIBLE EXPLORATIONS", "DREI REVERSIBLE ERKUNDUNGEN")}\n${experiments}\n\n${lifeUiValue(locale, "POSSIBLE PATHS", "MÖGLICHE WEGE")}\n${paths}\n\n${lifeUiValue(locale, "The neutral perspective labels come from the two sequentially released passes. They are not technical anonymisation.", "Die neutralen Perspektivbezeichnungen stammen aus den zwei nacheinander freigegebenen Durchgängen. Sie sind keine technische Anonymisierung.")}\n\n${result.disclaimer}\n\n${lifeUiValue(locale, "Created locally. Not stored or transmitted.", "Lokal erstellt. Nicht gespeichert oder übertragen.")}`, FULL_LIMIT);
}
export function buildPartnerClipboardSummary(result: PartnerComparisonResult, locale: Locale = "de"): string {
    const safeFindings = result.findings.filter((finding) => !finding.dimensionIds.some((dimensionId) => result.sensitiveDimensionIds.includes(dimensionId)));
    const safeOverview = result.sharedOverview.filter((signal) => !signal.dimensionIds.some((dimensionId) => result.sensitiveDimensionIds.includes(dimensionId)));
    const overview = safeOverview.slice(0, 4).map(({ label, headline }) => `- ${label}: ${headline}`).join("\n");
    const insights = safeFindings.slice(0, 3).map(({ headline }) => `- ${headline}`).join("\n");
    const paths = result.paths.slice(0, 4).map(({ title }) => `- ${title}`).join("\n");
    const sensitiveNote = result.sensitiveDimensionIds.length ? (lifeUiValue(locale, "\nSensitive topics and personal evidence were intentionally omitted.", "\nSensible Themen und persönliche Einzelnachweise wurden bewusst ausgelassen.")) : (lifeUiValue(locale, "\nPersonal evidence was intentionally omitted.", "\nPersönliche Einzelnachweise wurden bewusst ausgelassen."));
    return bounded(`Life Alignment · Partner / Relationship\n${lifeUiValue(locale, "Data-minimised shared short version", "Datensparsame gemeinsame Kurzfassung")}\n\n${lifeUiValue(locale, "Qualitative shared overview", "Qualitative gemeinsame Übersicht")}:\n${overview || (lifeUiValue(locale, "- No shared overview can be derived from non-sensitive topics.", "- Aus den nicht-sensiblen Themen ist keine gemeinsame Übersicht ableitbar."))}\n\n${lifeUiValue(locale, "Concrete signals", "Konkrete Hinweise")}:\n${insights || (lifeUiValue(locale, "- No non-sensitive signals for this short version.", "- Keine nicht-sensiblen Hinweise für diese Kurzfassung."))}\n\n${lifeUiValue(locale, "Possible, freely chosen paths", "Mögliche, frei wählbare Wege")}:\n${paths || (lifeUiValue(locale, "- Leave the result open for now", "- Das Ergebnis zunächst offenlassen"))}${sensitiveNote}\n\n${lifeUiValue(locale, "No compatibility measurement, no A:B ranking and no recommendation about who is right. Created locally only; not stored.", "Keine Kompatibilitätsmessung, kein A:B-Vergleich und keine Empfehlung, wer recht hat. Nur lokal erstellt; nicht gespeichert.")}`, CLIPBOARD_LIMIT);
}
