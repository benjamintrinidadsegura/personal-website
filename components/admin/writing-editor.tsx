"use client";

import "@blocknote/ariakit/style.css";

import { BlockNoteView } from "@blocknote/ariakit";
import { filterSuggestionItems } from "@blocknote/core/extensions";
import {
  BasicTextStyleButton,
  CreateLinkButton,
  FormattingToolbar,
  FormattingToolbarController,
  getDefaultReactSlashMenuItems,
  SuggestionMenuController,
  type DefaultReactSuggestionItem,
  type FormattingToolbarProps,
  useCreateBlockNote,
} from "@blocknote/react";
import { useCallback, useEffect } from "react";

import { blockNoteToWritingDocument, writingDocumentToBlockNote, writingEditorSchema } from "@/lib/writing/blocknote-adapter";
import type { WritingDocumentV1 } from "@/types/writing";

const allowedSlashKeys = new Set(["paragraph", "heading_2", "heading_3", "bullet_list", "numbered_list", "quote", "divider"]);

function RestrictedFormattingToolbar(props: FormattingToolbarProps) {
  return (
    <FormattingToolbar {...props}>
      <BasicTextStyleButton basicTextStyle="bold" />
      <BasicTextStyleButton basicTextStyle="italic" />
      <CreateLinkButton />
    </FormattingToolbar>
  );
}

export function WritingEditor({
  initialDocument,
  onChange,
  onInvalid,
}: {
  initialDocument: WritingDocumentV1;
  onChange: (document: WritingDocumentV1) => void;
  onInvalid: (message: string | null) => void;
}) {
  const editor = useCreateBlockNote({
    schema: writingEditorSchema,
    initialContent: writingDocumentToBlockNote(initialDocument),
  });

  useEffect(() => {
    editor.domElement?.setAttribute("aria-label", "Article document");
  }, [editor]);

  const getSlashItems = useCallback(async (query: string) => {
    const allowed = getDefaultReactSlashMenuItems(editor).filter((item) => allowedSlashKeys.has((item as DefaultReactSuggestionItem & { key?: string }).key ?? ""));
    return filterSuggestionItems(allowed, query);
  }, [editor]);

  return (
    <div className="writing-editor min-w-0 overflow-visible rounded-2xl border border-white/10 bg-white/[0.018] transition-colors focus-within:border-[#35d0e5]/55 focus-within:ring-2 focus-within:ring-[#35d0e5]/15">
      <div className="flex min-h-11 items-center gap-1 border-b border-white/[0.07] px-2 sm:px-3" role="toolbar" aria-label="Document history">
        <button type="button" onClick={() => editor.undo()} className="inline-flex size-10 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35d0e5]/70" aria-label="Undo last document change" title="Undo (Ctrl+Z)">
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 7 5 11l4 4"/><path d="M5 11h8a5 5 0 0 1 5 5v1"/></svg>
        </button>
        <button type="button" onClick={() => editor.redo()} className="inline-flex size-10 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35d0e5]/70" aria-label="Redo document change" title="Redo (Ctrl+Shift+Z)">
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m15 7 4 4-4 4"/><path d="M19 11h-8a5 5 0 0 0-5 5v1"/></svg>
        </button>
        <span className="ml-auto pr-1 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-slate-600" aria-hidden="true">/ commands</span>
      </div>
      <BlockNoteView
        editor={editor}
        theme="dark"
        formattingToolbar={false}
        slashMenu={false}
        sideMenu={false}
        filePanel={false}
        tableHandles={false}
        emojiPicker={false}
        comments={false}
        onChange={() => {
          const result = blockNoteToWritingDocument(editor.document);
          if (!result.success) {
            onInvalid(result.message);
            return;
          }
          onInvalid(null);
          onChange(result.data);
        }}
      >
        <FormattingToolbarController formattingToolbar={RestrictedFormattingToolbar} />
        <SuggestionMenuController triggerCharacter="/" getItems={getSlashItems} />
      </BlockNoteView>
    </div>
  );
}
