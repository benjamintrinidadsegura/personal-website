import { ShareThoughtTrigger } from "@/components/writing/share/share-thought-trigger";
import type { WritingShareDictionary } from "@/data/i18n/writing-share";
import type { WritingShareContext } from "@/types/writing";

export function ArticleBody({ body, shareContext, shareCopy }: { body: string; shareContext?: WritingShareContext; shareCopy?: WritingShareDictionary }) {
  const paragraphs = body.split(/\n{2,}/u).map((paragraph) => paragraph.trim()).filter(Boolean);

  return (
    <div className="writing-document text-[1.08rem] leading-[1.9] text-slate-300 [overflow-wrap:anywhere] sm:text-[1.23rem] sm:leading-[1.92]">
      {paragraphs.map((paragraph, index) => (
        <div key={`${index}-${paragraph.slice(0, 24)}`} className={`writing-thought group/thought relative ${index === 0 ? "writing-opening-thought" : ""}`}>
          <p className="whitespace-pre-line">{paragraph}</p>
          {shareContext && shareCopy && paragraph.length >= 32 ? <ShareThoughtTrigger copy={shareCopy} source={{ ...shareContext, text: paragraph }} /> : null}
        </div>
      ))}
    </div>
  );
}
