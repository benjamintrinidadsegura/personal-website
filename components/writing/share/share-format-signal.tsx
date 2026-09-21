import { ShareIcon } from "@/components/sharing/share-icon";
import type { WritingShareDictionary } from "@/data/i18n/writing-share";

export function ShareFormatSignal({
  className = "",
  copy,
  detailed = false,
}: {
  className?: string;
  copy: WritingShareDictionary;
  detailed?: boolean;
}) {
  return (
    <div className={`writing-share-format-signal ${detailed ? "writing-share-format-signal-detailed" : ""} ${className}`}>
      <p className="writing-share-format-heading">
        <ShareIcon />
        <span>{copy.dialogTitle}</span>
      </p>
      <div className="writing-share-format-options" aria-label={copy.format}>
        <span data-ratio="story">{copy.formats.story}</span>
        <span data-ratio="portrait">{copy.formats.portrait}</span>
        <span data-ratio="square">{copy.formats.square}</span>
      </div>
      {detailed ? <p className="writing-share-format-screenshot">{copy.screenshotMode}</p> : null}
    </div>
  );
}
