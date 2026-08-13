"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { publishWritingAction, saveWritingAction } from "@/app/admin/writing/actions";
import { WritingDocument } from "@/components/writing/writing-document";
import { legacyBodyToWritingDocument } from "@/lib/writing/document";
import {
  suggestedWritingTopics,
  type AdminWritingArticle,
  type WritingActionState,
  type WritingContentType,
  type WritingDocumentV1,
  type WritingField,
} from "@/types/writing";

const WritingEditor = dynamic(() => import("@/components/admin/writing-editor").then((module) => module.WritingEditor), {
  ssr: false,
  loading: () => <div className="min-h-80 animate-pulse rounded-2xl border border-white/10 bg-white/[0.025] p-6 text-slate-400">Loading editor...</div>,
});

type SavePhase = "saved" | "dirty" | "waiting" | "saving" | "failed" | "conflict";
type Snapshot = {
  title: string;
  deck: string;
  excerpt: string;
  contentType: WritingContentType;
  topics: string[];
  document: WritingDocumentV1;
};

const AUTOSAVE_DELAY_MS = 1_200;
const UNSAVED_CHANGES_MESSAGE = "You have unsaved Writing changes. Leave this page?";

type BrowserNavigation = EventTarget;
type BrowserNavigationEvent = Event & {
  canIntercept?: boolean;
  downloadRequest?: string | null;
  hashChange?: boolean;
};

function toFormData(articleId: string, updatedAt: string, snapshot: Snapshot): FormData {
  const data = new FormData();
  data.set("articleId", articleId);
  data.set("expectedUpdatedAt", updatedAt);
  data.set("title", snapshot.title);
  data.set("deck", snapshot.deck);
  data.set("excerpt", snapshot.excerpt);
  data.set("contentType", snapshot.contentType);
  data.set("bodyJson", JSON.stringify(snapshot.document));
  snapshot.topics.forEach((topic) => data.append("topics", topic));
  return data;
}

export function WritingForm({ article }: { article: AdminWritingArticle }) {
  const initialDocument = useMemo(() => article.bodyJson ?? legacyBodyToWritingDocument(article.body), [article.body, article.bodyJson]);
  const [snapshot, setSnapshot] = useState<Snapshot>({ title: article.title, deck: article.deck, excerpt: article.excerpt, contentType: article.contentType, topics: article.topics, document: initialDocument });
  const [phase, setPhase] = useState<SavePhase>("saved");
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [feedback, setFeedback] = useState<WritingActionState>(null);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const expectedUpdatedAtRef = useRef(article.updatedAt);
  const snapshotRef = useRef(snapshot);
  const generationRef = useRef(0);
  const savedGenerationRef = useRef(0);
  const savePromiseRef = useRef<Promise<WritingActionState> | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const confirmedNavigationRef = useRef(false);

  const isDirty = phase !== "saved";
  const hasUnsavedChanges = phase !== "saved";

  const markChanged = useCallback((update: (current: Snapshot) => Snapshot) => {
    const next = update(snapshotRef.current);
    snapshotRef.current = next;
    setSnapshot(next);
    generationRef.current += 1;
    setFeedback(null);
    setPhase((current) => current === "conflict" ? "conflict" : article.status === "draft" ? "waiting" : "dirty");
  }, [article.status]);

  const runDraftSave = useCallback(async (): Promise<WritingActionState> => {
    if (article.status !== "draft" || editorError) return { ok: false, code: "validation", message: editorError ?? "Published articles do not autosave." };
    if (savePromiseRef.current) {
      await savePromiseRef.current;
      if (generationRef.current <= savedGenerationRef.current) return { ok: true, message: "Draft saved.", updatedAt: expectedUpdatedAtRef.current };
    }

    const generation = generationRef.current;
    const formData = toFormData(article.id, expectedUpdatedAtRef.current, snapshotRef.current);
    setPhase("saving");
    const request = saveWritingAction(null, formData);
    savePromiseRef.current = request;
    const result = await request;
    if (savePromiseRef.current === request) savePromiseRef.current = null;
    setFeedback(result);
    if (result?.ok && result.updatedAt) {
      expectedUpdatedAtRef.current = result.updatedAt;
      savedGenerationRef.current = Math.max(savedGenerationRef.current, generation);
      if (generationRef.current === generation) setPhase("saved");
      else setPhase("waiting");
    } else {
      setPhase(result?.code === "conflict" ? "conflict" : "failed");
    }
    return result;
  }, [article.id, article.status, editorError]);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (article.status !== "draft" || phase !== "waiting" || editorError) return;
    timerRef.current = setTimeout(() => { void runDraftSave(); }, AUTOSAVE_DELAY_MS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [article.status, editorError, phase, runDraftSave, snapshot]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;

    let bypassReset: ReturnType<typeof setTimeout> | null = null;
    const allowConfirmedNavigation = () => {
      confirmedNavigationRef.current = true;
      if (bypassReset) clearTimeout(bypassReset);
      bypassReset = setTimeout(() => { confirmedNavigationRef.current = false; }, 0);
    };
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (confirmedNavigationRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    const guardLinks = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || !(event.target instanceof Element)) return;
      const link = event.target.closest<HTMLAnchorElement>("a[href]");
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
      const target = new URL(link.href, window.location.href);
      const current = new URL(window.location.href);
      if (target.origin === current.origin && target.pathname === current.pathname && target.search === current.search && target.hash !== current.hash) return;
      if (!window.confirm(UNSAVED_CHANGES_MESSAGE)) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      allowConfirmedNavigation();
    };
    const navigation = (window as Window & { navigation?: BrowserNavigation }).navigation;
    const guardNavigation = (event: Event) => {
      if (confirmedNavigationRef.current) return;
      const navigationEvent = event as BrowserNavigationEvent;
      if (!event.cancelable || navigationEvent.canIntercept === false || navigationEvent.downloadRequest || navigationEvent.hashChange) return;
      if (!window.confirm(UNSAVED_CHANGES_MESSAGE)) {
        event.preventDefault();
        return;
      }
      allowConfirmedNavigation();
    };
    const guardedUrl = window.location.href;
    const guardedState = window.history.state;
    const guardHistory = (event: PopStateEvent) => {
      if (confirmedNavigationRef.current) return;
      if (window.confirm(UNSAVED_CHANGES_MESSAGE)) {
        allowConfirmedNavigation();
        return;
      }
      event.stopImmediatePropagation();
      window.history.pushState(guardedState, "", guardedUrl);
    };
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", guardLinks, true);
    if (navigation) navigation.addEventListener("navigate", guardNavigation);
    else window.addEventListener("popstate", guardHistory, true);
    return () => {
      if (bypassReset) clearTimeout(bypassReset);
      confirmedNavigationRef.current = false;
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", guardLinks, true);
      if (navigation) navigation.removeEventListener("navigate", guardNavigation);
      else window.removeEventListener("popstate", guardHistory, true);
    };
  }, [hasUnsavedChanges]);

  const submitPublished = async () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setPublishing(true);
    if (savePromiseRef.current) await savePromiseRef.current;
    const result = await publishWritingAction(null, toFormData(article.id, expectedUpdatedAtRef.current, snapshotRef.current));
    setFeedback(result);
    if (result?.ok && result.updatedAt) {
      expectedUpdatedAtRef.current = result.updatedAt;
      savedGenerationRef.current = generationRef.current;
      setPhase("saved");
    } else setPhase(result?.code === "conflict" ? "conflict" : "failed");
    setPublishing(false);
  };

  const fieldError = (field: WritingField) => feedback && !feedback.ok ? feedback.fieldErrors?.[field] : undefined;
  const fieldClass = "mt-2 min-h-12 w-full rounded-lg border border-white/15 bg-[#04111b] px-4 py-3 text-white outline-none focus-visible:border-[#35d0e5] focus-visible:ring-2 focus-visible:ring-[#35d0e5]/30";
  const statusLabel = article.status === "published" && isDirty ? "Unpublished changes" : phase === "saving" ? "Saving..." : phase === "waiting" || phase === "dirty" ? "Unsaved changes" : phase === "failed" ? "Save failed" : phase === "conflict" ? "Conflict" : "Saved";
  const settingsSummary = [snapshot.contentType === "essay" ? "Essay" : "Note", ...snapshot.topics].join(" · ");

  return (
    <div className="mt-4">
      <div className="sticky top-20 z-20 mb-6 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-[#061521]/95 p-2 shadow-[0_12px_40px_rgba(0,0,0,0.18)] backdrop-blur sm:gap-3 sm:p-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2 px-1" aria-live="polite">
          <span className={`rounded-full border px-3 py-1 font-mono text-xs font-black uppercase tracking-[0.14em] ${article.status === "published" ? "border-emerald-300/40 text-emerald-300" : "border-[#ffb36d]/40 text-[#ffb36d]"}`}>{article.status}</span>
          <span className={`text-sm ${phase === "failed" || phase === "conflict" ? "font-bold text-[#ffb36d]" : article.status === "published" && isDirty ? "font-bold text-[#ffb36d]" : "text-slate-400"}`}>{statusLabel}</span>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
          <div role="group" aria-label="Editor view" className="flex min-w-0 flex-1 rounded-full border border-white/15 p-1 sm:flex-none">
            {(["edit", "preview"] as const).map((view) => <button key={view} type="button" aria-pressed={mode === view} onClick={() => setMode(view)} className={`min-h-10 flex-1 rounded-full px-3 text-sm font-bold capitalize transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35d0e5]/70 sm:flex-none sm:px-4 ${mode === view ? "bg-white text-[#041018]" : "text-slate-300 hover:bg-white/[0.06]"}`}>{view}</button>)}
          </div>
          {article.status === "draft" ? <button type="button" onClick={() => void runDraftSave()} disabled={phase === "saving" || publishing || !!editorError} className="min-h-11 rounded-full border border-white/20 px-4 text-sm font-bold text-white transition hover:border-[#35d0e5]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35d0e5]/70 disabled:opacity-50">{phase === "failed" ? "Retry save" : "Save Draft"}</button> : null}
          <button type="button" onClick={() => void submitPublished()} disabled={publishing || !!editorError} aria-label={article.status === "published" ? "Update published article" : "Publish article"} className="min-h-11 rounded-full bg-[#35d0e5] px-4 text-sm font-black text-[#041018] transition hover:bg-[#64dcea] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 disabled:opacity-50 sm:px-5">{publishing ? "Publishing..." : article.status === "published" ? <><span className="sm:hidden">Update</span><span className="hidden sm:inline">Update Published</span></> : "Publish"}</button>
        </div>
      </div>

      {feedback && !feedback.ok ? <div role="alert" className="mb-7 border-l-2 border-[#ff9a3d] p-4 text-[#ffcfaa]">{feedback.message}</div> : null}
      {feedback?.ok && feedback.slug ? <div role="status" className="mb-7 border-l-2 border-[#35d0e5] p-4 text-slate-200">{feedback.message} <a href={`/writing/${feedback.slug}`} className="font-bold text-[#35d0e5] underline">Open public article</a></div> : null}

      {mode === "preview" ? (
        <section aria-label="Private article preview" className="mx-auto max-w-[72ch] rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-10">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#35d0e5]">Private preview</p>
          <h2 className="mt-6 break-words text-4xl font-black text-white sm:text-6xl">{snapshot.title || "Untitled draft"}</h2>
          {snapshot.deck ? <p className="mt-5 text-xl font-bold leading-8 text-slate-200">{snapshot.deck}</p> : null}
          {snapshot.excerpt ? <p className="mt-6 border-l border-[#ff9a3d] pl-5 text-slate-400">{snapshot.excerpt}</p> : null}
          <div className="mt-10"><WritingDocument document={snapshot.document} /></div>
        </section>
      ) : (
        <div className="mx-auto max-w-4xl space-y-7">
          <section aria-labelledby="writing-main-fields" className="space-y-5">
            <h2 id="writing-main-fields" className="sr-only">Article</h2>
            <div><label htmlFor="writing-title" className="sr-only">Title</label><input id="writing-title" value={snapshot.title} placeholder="Article title" onChange={(event) => markChanged((current) => ({ ...current, title: event.target.value }))} maxLength={160} className="min-h-14 w-full border-b border-white/10 bg-transparent px-0 py-2 text-3xl font-black leading-tight text-white outline-none placeholder:text-slate-600 focus-visible:border-[#35d0e5]/70 sm:text-5xl" aria-invalid={!!fieldError("title")} />{fieldError("title") ? <p className="mt-2 text-sm text-[#ffb16a]">{fieldError("title")}</p> : null}</div>
            <div><label htmlFor="writing-deck" className="sr-only">Deck / subtitle</label><textarea id="writing-deck" value={snapshot.deck} placeholder="Deck or subtitle" onChange={(event) => markChanged((current) => ({ ...current, deck: event.target.value }))} maxLength={240} rows={2} className="min-h-20 w-full resize-y border-b border-white/10 bg-transparent px-0 py-3 text-lg font-medium leading-8 text-slate-200 outline-none placeholder:text-slate-600 focus-visible:border-[#35d0e5]/70 sm:text-xl" aria-invalid={!!fieldError("deck")} />{fieldError("deck") ? <p className="mt-2 text-sm text-[#ffb16a]">{fieldError("deck")}</p> : null}</div>
            <div><div className="mb-3 flex flex-wrap items-baseline justify-between gap-2"><p className="font-bold text-white">Document</p><p className="text-xs text-slate-500">Use / for blocks · select text to format</p></div><WritingEditor initialDocument={snapshot.document} onInvalid={setEditorError} onChange={(document) => markChanged((current) => ({ ...current, document }))} />{editorError || fieldError("bodyJson") ? <p role="alert" className="mt-3 text-sm text-[#ffb16a]">{editorError ?? fieldError("bodyJson")}</p> : null}</div>
          </section>

          <details className="group rounded-2xl border border-white/[0.08] bg-white/[0.015] p-4 sm:p-5">
            <summary className="flex min-h-11 cursor-pointer list-none items-center gap-3 rounded-lg text-white outline-none focus-visible:ring-2 focus-visible:ring-[#35d0e5]/60 [&::-webkit-details-marker]:hidden"><span className="whitespace-nowrap font-black">Article settings</span><span className="min-w-0 truncate text-sm text-slate-500">{settingsSummary}</span><svg aria-hidden="true" viewBox="0 0 20 20" className="ml-auto size-4 shrink-0 text-slate-500 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m5 7.5 5 5 5-5"/></svg></summary>
            <div className="mt-5 grid gap-6 border-t border-white/[0.07] pt-5 sm:grid-cols-2">
              <div><label htmlFor="writing-content-type" className="font-bold text-white">Content Type</label><select id="writing-content-type" value={snapshot.contentType} onChange={(event) => markChanged((current) => ({ ...current, contentType: event.target.value as WritingContentType }))} className={fieldClass}><option value="essay">Essay</option><option value="note">Note</option></select></div>
              <fieldset><legend className="font-bold text-white">Topics</legend><div className="mt-3 flex flex-wrap gap-3">{suggestedWritingTopics.map((topic) => <label key={topic} className="flex min-h-11 items-center gap-2 rounded-full border border-white/15 px-4 text-sm text-slate-200"><input type="checkbox" checked={snapshot.topics.includes(topic)} onChange={(event) => markChanged((current) => ({ ...current, topics: event.target.checked ? [...current.topics, topic] : current.topics.filter((value) => value !== topic) }))} className="h-4 w-4 accent-[#35d0e5]" />{topic}</label>)}</div>{fieldError("topics") ? <p className="mt-2 text-sm text-[#ffb16a]">{fieldError("topics")}</p> : null}</fieldset>
              <div className="sm:col-span-2"><label htmlFor="writing-excerpt" className="font-bold text-white">Excerpt / Teaser</label><textarea id="writing-excerpt" value={snapshot.excerpt} onChange={(event) => markChanged((current) => ({ ...current, excerpt: event.target.value }))} maxLength={320} rows={4} className={fieldClass} aria-invalid={!!fieldError("excerpt")} />{fieldError("excerpt") ? <p className="mt-2 text-sm text-[#ffb16a]">{fieldError("excerpt")}</p> : null}</div>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
