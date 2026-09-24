import type { MoneyProfileUiCopy } from "@/data/money-profile-locales";
import type { MoneyProfileResult } from "@/types/money-profile";
import type { WritingShareFormat } from "@/types/writing";

export type MoneyShareSection = "profile" | "meaning" | "strength" | "reminder";

export function MoneyProfileShareCard({ copy, format, result, sections }: { copy: MoneyProfileUiCopy; format: WritingShareFormat; result: MoneyProfileResult; sections: ReadonlySet<MoneyShareSection> }) {
  const label = result.secondaryProfile && result.primaryProfile ? `${result.primaryProfile.label} × ${result.secondaryProfile.label}` : result.primaryProfile?.label ?? result.baseline.headline;
  return (
    <div aria-hidden="true" className="writing-share-card personal-advantage-share-card money-profile-share-card" data-format={format}>
      <div className="writing-share-card-safe-area">
        <header className="writing-share-card-header"><span className="writing-share-card-marker">BTS.ONLINE / MONEY PROFILE</span><span className="writing-share-card-progress">{copy.onePager}</span></header>
        <div className="personal-advantage-share-content">
          <span aria-hidden="true" className="personal-advantage-share-motif"><i /><i /><i /></span>
          {sections.has("profile") ? <><p className="personal-advantage-share-eyebrow">{copy.profile}</p><p className="personal-advantage-share-label">{label}</p><p className="personal-advantage-share-synthesis">{result.baseline.description}</p></> : null}
          {sections.has("meaning") ? <div className="personal-advantage-share-block"><p>{copy.meaning}</p><strong>{result.meanings.map(({ label: meaning }) => meaning).join(" · ")}</strong></div> : null}
          {sections.has("strength") ? <div className="personal-advantage-share-block"><p>{copy.atMyBest}</p><strong>{result.playbook.atMyBest}</strong></div> : null}
          {sections.has("reminder") ? <div className="personal-advantage-share-block"><p>{copy.myNextMove}</p><strong>{result.playbook.myNextMove}</strong></div> : null}
        </div>
        <footer className="writing-share-card-footer"><div><p className="writing-share-card-author">Money Profile</p><p className="writing-share-card-title">A map of patterns — not a financial score.</p></div><p className="writing-share-card-domain">bts.online</p></footer>
      </div>
    </div>
  );
}
