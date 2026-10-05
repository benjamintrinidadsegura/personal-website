import { getPersonalAdvantageDisplayLabels, type PersonalAdvantageUiCopy } from "@/data/personal-advantage-locales";
import type { Locale } from "@/lib/i18n/config";
import type { PersonalAdvantageMap } from "@/types/personal-advantage";
import type { WritingShareFormat } from "@/types/writing";

export type AdvantageShareSection = "advantage" | "stack" | "hidden" | "shadow" | "reminder";

export function PersonalAdvantageShareCard({ copy, format, locale = "en", map, sections }: { copy: PersonalAdvantageUiCopy; format: WritingShareFormat; locale?: Locale; map: PersonalAdvantageMap; sections: ReadonlySet<AdvantageShareSection> }) {
  const labels = getPersonalAdvantageDisplayLabels(locale);
  const hidden = map.hiddenAdvantages[0];
  return (
    <div aria-hidden="true" className="writing-share-card personal-advantage-share-card" data-format={format}>
      <div className="writing-share-card-safe-area">
        <header className="writing-share-card-header"><span className="writing-share-card-marker">BTSHQ.ONLINE / {labels.brand.toUpperCase()}</span><span className="writing-share-card-progress">{copy.onePager}</span></header>
        <div className="personal-advantage-share-content">
          <span aria-hidden="true" className="personal-advantage-share-motif"><i /><i /><i /></span>
          {sections.has("advantage") ? <><p className="personal-advantage-share-eyebrow">{copy.myAdvantage}</p><p className="personal-advantage-share-label">{map.coreAdvantage.label}</p><p className="personal-advantage-share-synthesis">{map.coreAdvantage.synthesis}</p></> : null}
          {sections.has("stack") ? <div className="personal-advantage-share-block"><p>{copy.myStack}</p><strong>{map.stack.slice(0, 5).map(({ label }) => label).join(" × ")}</strong></div> : null}
          {sections.has("hidden") && hidden ? <div className="personal-advantage-share-block"><p>{copy.myHiddenEdge}</p><strong>{hidden.label}</strong></div> : null}
          {sections.has("shadow") ? <div className="personal-advantage-share-block"><p>{copy.counterweight}</p><strong>{map.counterweights[0]}</strong></div> : null}
          {sections.has("reminder") ? <div className="personal-advantage-share-block"><p>{copy.remember}</p><strong>{map.reminder}</strong></div> : null}
        </div>
        <footer className="writing-share-card-footer"><div><p className="writing-share-card-author">{copy.method}</p><p className="writing-share-card-title">{labels.shareFooter}</p></div><p className="writing-share-card-domain">btshq.online</p></footer>
      </div>
    </div>
  );
}
