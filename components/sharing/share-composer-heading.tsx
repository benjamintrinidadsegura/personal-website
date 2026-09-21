import { ShareIcon } from "@/components/sharing/share-icon";

export function ShareComposerHeading({
  closeLabel,
  headingId,
  onClose,
  product,
  title,
}: {
  closeLabel: string;
  headingId: string;
  onClose: () => void;
  product: string;
  title: string;
}) {
  return (
    <header className="writing-share-composer-header">
      <div>
        <p className="bts-share-identity">
          <ShareIcon />
          <span>BTS.ONLINE / {product}</span>
        </p>
        <h2 id={headingId} className="mt-2 text-2xl font-black text-white sm:text-3xl">{title}</h2>
      </div>
      <button type="button" onClick={onClose} className="writing-share-close" aria-label={closeLabel}>×</button>
    </header>
  );
}
