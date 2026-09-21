import type { CSSProperties } from "react";

import type { FynsCharacterPresentation } from "@/data/find-your-next-step-characters";
import type { WritingShareFormat } from "@/types/writing";

export function FynsCharacterShareCard({
  character,
  characterLabel,
  format,
  supportingLabel,
  supportingNames,
}: {
  character: FynsCharacterPresentation;
  characterLabel: string;
  format: WritingShareFormat;
  supportingLabel: string;
  supportingNames: readonly string[];
}) {
  return (
    <div
      aria-hidden="true"
      className="writing-share-card fyns-character-share-card"
      data-character={character.id}
      data-format={format}
      data-motif={character.motif}
      style={{ "--fyns-character-accent": character.accent } as CSSProperties}
    >
      <div className="writing-share-card-safe-area">
        <header className="writing-share-card-header">
          <span className="writing-share-card-marker">BTS.ONLINE / FYNS</span>
          <span className="writing-share-card-progress">{characterLabel}</span>
        </header>
        <div className="fyns-character-share-content">
          <span className="fyns-share-motif" aria-hidden="true"><span /><span /><span /></span>
          <p className="fyns-character-share-name">{character.name}</p>
          <p className="fyns-character-share-subtitle">{character.subtitle}</p>
          <p className="fyns-character-share-identity">{character.identityStatement}</p>
        </div>
        <footer className="writing-share-card-footer">
          <div className="min-w-0">
            {supportingNames.length > 0 ? <><p className="writing-share-card-title">{supportingLabel}</p><p className="writing-share-card-author">{supportingNames.join(" · ")}</p></> : null}
          </div>
          <p className="writing-share-card-domain">bts.online</p>
        </footer>
      </div>
    </div>
  );
}
