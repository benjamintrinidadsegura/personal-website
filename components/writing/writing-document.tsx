import type { ReactNode } from "react";

import { isSafeWritingLink } from "@/lib/writing/document";
import type { WritingDocumentBlock, WritingDocumentV1, WritingInlineContent } from "@/types/writing";

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

function renderBlocks(blocks: WritingDocumentBlock[], keyPrefix: string): ReactNode[] {
  const rendered: ReactNode[] = [];
  let index = 0;
  while (index < blocks.length) {
    const block = blocks[index];
    const key = `${keyPrefix}-${index}`;
    if (block.type === "bulletListItem" || block.type === "numberedListItem") {
      const listType = block.type;
      const items: WritingDocumentBlock[] = [];
      while (blocks[index]?.type === listType) {
        items.push(blocks[index]);
        index += 1;
      }
      const children = items.map((item, itemIndex) => (
        <li key={`${key}-item-${itemIndex}`}>
          {item.type !== "divider" ? renderInline(item.content) : null}
          {item.children?.length ? <div className="mt-3">{renderBlocks(item.children, `${key}-child-${itemIndex}`)}</div> : null}
        </li>
      ));
      rendered.push(listType === "bulletListItem"
        ? <ul key={key} className="ml-6 list-disc space-y-3 marker:text-[#35d0e5]">{children}</ul>
        : <ol key={key} className="ml-6 list-decimal space-y-3 marker:font-bold marker:text-[#35d0e5]">{children}</ol>);
      continue;
    }

    const nested = block.children?.length ? <div className="mt-4 border-l border-white/10 pl-5">{renderBlocks(block.children, `${key}-child`)}</div> : null;
    if (block.type === "paragraph") rendered.push(<div key={key}><p className="whitespace-pre-wrap">{renderInline(block.content)}</p>{nested}</div>);
    if (block.type === "heading" && block.level === 2) rendered.push(<div key={key}><h2 className="pt-7 text-3xl font-black leading-tight text-white sm:text-4xl">{renderInline(block.content)}</h2>{nested}</div>);
    if (block.type === "heading" && block.level === 3) rendered.push(<div key={key}><h3 className="pt-4 text-2xl font-black leading-tight text-white sm:text-3xl">{renderInline(block.content)}</h3>{nested}</div>);
    if (block.type === "quote") rendered.push(<div key={key}><blockquote className="border-l-2 border-[#ff9a3d] pl-5 font-bold italic text-slate-200 sm:pl-7">{renderInline(block.content)}</blockquote>{nested}</div>);
    if (block.type === "divider") rendered.push(<div key={key}><hr className="my-10 border-0 border-t border-white/15" />{nested}</div>);
    index += 1;
  }
  return rendered;
}

export function WritingDocument({ document }: { document: WritingDocumentV1 }) {
  return (
    <div className="writing-document space-y-7 text-lg leading-8 text-slate-300 [overflow-wrap:anywhere] sm:text-xl sm:leading-9">
      {renderBlocks(document.blocks, "writing-block")}
    </div>
  );
}
