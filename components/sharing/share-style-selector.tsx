import { shareCardStyles, type ShareCardStyle } from "@/types/sharing";

export function ShareStyleSelector({
  label,
  labels,
  onChange,
  value,
}: {
  label: string;
  labels: Record<ShareCardStyle, string>;
  onChange: (value: ShareCardStyle) => void;
  value: ShareCardStyle;
}) {
  return (
    <fieldset>
      <legend className="writing-share-control-label">{label}</legend>
      <div className="writing-share-choice-grid writing-share-choice-grid-styles">
        {shareCardStyles.map((style) => (
          <button key={style} type="button" aria-pressed={value === style} onClick={() => onChange(style)} className="writing-share-choice">
            {labels[style]}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
