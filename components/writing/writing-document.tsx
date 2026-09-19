import type { ReactNode } from "react";

import { ShareThoughtTrigger } from "@/components/writing/share/share-thought-trigger";
import type { WritingShareDictionary } from "@/data/i18n/writing-share";
import { isSafeWritingLink, writingBlockToPlainText } from "@/lib/writing/document";
import type {
  WritingDocumentBlock,
  WritingDocumentV1,
  WritingInlineContent,
  WritingShareContext,
  WritingShareSource,
} from "@/types/writing";

function renderInline(content: WritingInlineContent[]): ReactNode[] {
  return content.map((item, index) => {
    if (item.type === "link") {
      const external = /^https?:/iu.test(item.href);
      return isSafeWritingLink(item.href) ? (
        <a key={`link-${index}`} href={item.href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined} className="font-bold text-[#35d0e5] underline decoration-[#35d0e5]/40 underline-offset-4 hover:decoration-[#35d0e5]">
          {renderInline(item.content)}
        </a>
      ) : null;
    }
    let value: ReactNode = item.text;
    if (item.styles?.italic) value = <em>{value}</em>;
    if (item.styles?.bold) value = <strong>{value}</strong>;
    return <span key={`text-${index}`}>{value}</span>;
  });
}

function thoughtSource(context: WritingShareContext, block: WritingDocumentBlock): WritingShareSource | null {
  const text = writingBlockToPlainText(block).trim();
  if (!text || text.length < 32) return null;
  const anchor = block.id ? `writing-thought-${block.id}` : null;
  return {
    ...context,
    blockId: block.id,
    canonicalUrl: context.canonicalUrl && anchor ? `${context.canonicalUrl}#${anchor}` : context.canonicalUrl,
    text,
  };
}

function ShareAction({ block, context, copy, featured = false }: { block: WritingDocumentBlock; context?: WritingShareContext; copy?: WritingShareDictionary; featured?: boolean }) {
  if (!context || !copy) return null;
  const source = thoughtSource(context, block);
  return source ? <ShareThoughtTrigger copy={copy} featured={featured} source={source} /> : null;
}

function renderBlocks(
  blocks: WritingDocumentBlock[],
  keyPrefix: string,
  context?: WritingShareContext,
  copy?: WritingShareDictionary,
): ReactNode[] {
  const rendered: ReactNode[] = [];
  let index = 0;
  while (index < blocks.length) {
    const block = blocks[index];
    const key = block.id ?? `${keyPrefix}-${index}`;
    const anchor = block.id ? `writing-thought-${block.id}` : undefined;
    if (block.type === "bulletListItem" || block.type === "numberedListItem") {
      const listType = block.type;
      const items: WritingDocumentBlock[] = [];
      while (blocks[index]?.type === listType) {
        items.push(blocks[index]);
        index += 1;
      }
      const children = items.map((item, itemIndex) => (
        <li key={item.id ?? `${key}-item-${itemIndex}`}>
          {item.type !== "divider" ? renderInline(item.content) : null}
          {item.children?.length ? <div className="mt-3">{renderBlocks(item.children, `${key}-child-${itemIndex}`, context, copy)}</div> : null}
        </li>
      ));
      rendered.push(listType === "bulletListItem"
        ? <ul key={key} className="ml-6 list-disc space-y-3 marker:text-[#35d0e5]">{children}</ul>
        : <ol key={key} className="ml-6 list-decimal space-y-3 marker:font-bold marker:text-[#35d0e5]">{children}</ol>);
      continue;
    }

    const nested = block.children?.length ? <div className="mt-5 border-l border-white/10 pl-5">{renderBlocks(block.children, `${key}-child`, context, copy)}</div> : null;
    if (block.type === "paragraph") rendered.push(
      <div id={anchor} key={key} className={`writing-thought group/thought relative ${index === 0 ? "writing-opening-thought" : ""}`}>
        <p className="whitespace-pre-wrap">{renderInline(block.content)}</p>
        {nested}
        <ShareAction block={block} context={context} copy={copy} />
      </div>,
    );
    if (block.type === "shareable") rendered.push(
      <div id={anchor} key={key} className="writing-thought writing-shareable-thought group/thought relative">
        <p className="whitespace-pre-wrap">{renderInline(block.content)}</p>
        {nested}
        <ShareAction block={block} context={context} copy={copy} featured />
      </div>,
    );
    if (block.type === "keyThought") rendered.push(
      <aside id={anchor} key={key} className="writing-key-thought group/thought relative" aria-label={copy?.keyThought ?? "Key thought"}>
        <span aria-hidden="true" className="writing-editorial-label">{copy?.keyThought ?? "Key thought"}</span>
        <p className="whitespace-pre-wrap">{renderInline(block.content)}</p>
        {nested}
        <ShareAction block={block} context={context} copy={copy} featured />
      </aside>,
    );
    if (block.type === "pullQuote") rendered.push(
      <figure id={anchor} key={key} className="writing-pull-quote group/thought relative">
        <blockquote className="whitespace-pre-wrap">{renderInline(block.content)}</blockquote>
        {nested}
        <ShareAction block={block} context={context} copy={copy} featured />
      </figure>,
    );
    if (block.type === "heading" && block.level === 2) rendered.push(<div key={key} className="writing-section-moment"><span aria-hidden="true" className="writing-editorial-label">{copy?.section ?? "Section"} / {String(index + 1).padStart(2, "0")}</span><h2>{renderInline(block.content)}</h2>{nested}</div>);
    if (block.type === "heading" && block.level === 3) rendered.push(<div key={key}><h3 className="pt-5 text-2xl font-black leading-tight text-white sm:text-3xl">{renderInline(block.content)}</h3>{nested}</div>);
    if (block.type === "quote") rendered.push(<div key={key}><blockquote className="border-l-2 border-[#ff9a3d] pl-5 font-bold italic text-slate-200 sm:pl-7">{renderInline(block.content)}</blockquote>{nested}</div>);
    if (block.type === "divider") rendered.push(<div key={key}><hr className="writing-editorial-divider" />{nested}</div>);
    index += 1;
  }
  return rendered;
}

export function WritingDocument({
  document,
  shareContext,
  shareCopy,
}: {
  document: WritingDocumentV1;
  shareContext?: WritingShareContext;
  shareCopy?: WritingShareDictionary;
}) {
  return (
    <div className="writing-document text-[1.08rem] leading-[1.9] text-slate-300 [overflow-wrap:anywhere] sm:text-[1.23rem] sm:leading-[1.92]">
      {renderBlocks(document.blocks, "writing-block", shareContext, shareCopy)}
    </div>
  );
}
