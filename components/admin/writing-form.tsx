"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { publishWritingAction, saveWritingAction } from "@/app/admin/writing/actions";
import type { WritingEditorHandle } from "@/components/admin/writing-editor";
import { useLocale } from "@/components/i18n/locale-context";
import { WritingDocument } from "@/components/writing/writing-document";
import { writingNewsletterCopy } from "@/data/i18n/writing-newsletter";
import { getWritingShareDictionary } from "@/data/i18n/writing-share";
import { siteConfig } from "@/data/site";
import { getLocalizedPathname } from "@/lib/i18n/routing";
import type { WritingEditorState } from "@/lib/writing/blocknote-adapter";
import { legacyBodyToWritingDocument, writingDocumentToPlainText } from "@/lib/writing/document";
import { readWritingRecovery, removeWritingRecovery, withWritingRecoveryLock, writeWritingRecovery, type WritingRecoveryCandidate, type WritingRecoveryEntry, type WritingRecoveryFields } from "@/lib/writing/draft-recovery";
import { isWritingSnapshotDirty, writingNavigationLeavesDocument, writingSnapshotFingerprint } from "@/lib/writing/dirty-state";
import { writingNewsletterStatusQuery } from "@/lib/newsletter/preparation";
import { deriveWritingTeaser } from "@/lib/writing/teaser";
import { parseWritingInput } from "@/lib/writing/validation";
import {
  suggestedWritingTopics,
  writingLanguages,
  type AdminWritingArticle,
  type WritingActionState,
  type WritingContentType,
  type WritingDocumentV1,
  type WritingField,
  type WritingLanguage,
  type WritingShareContext,
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
  sourceLocale: WritingLanguage;
  topics: string[];
  document: WritingDocumentV1;
};

const AUTOSAVE_DELAY_MS = 1_200;
const UNSAVED_CHANGES_MESSAGE = "You have unsaved Writing changes. Leave this page?";

type BrowserNavigation = EventTarget;
type BrowserNavigationEvent = Event & {
  canIntercept?: boolean;
  destination?: { url?: string };
  downloadRequest?: string | null;
  hashChange?: boolean;
};

const writingFieldLabels: Record<WritingField, string> = {
  title: "Title",
  deck: "Deck / subtitle",
  excerpt: "Excerpt / teaser",
  bodyJson: "Document",
  contentType: "Content type",
  sourceLocale: "Source language",
  topics: "Topics",
};
const publicationSettingsFields: WritingField[] = ["contentType", "topics", "excerpt", "sourceLocale"];

function recoveryFields(snapshot: Snapshot): WritingRecoveryFields {
  const { title, deck, excerpt, contentType, sourceLocale, topics } = snapshot;
  return { title, deck, excerpt, contentType, sourceLocale, topics };
}

function toFormData(articleId: string, updatedAt: string, snapshot: Snapshot): FormData {
  const data = new FormData();
  data.set("articleId", articleId);
  data.set("expectedUpdatedAt", updatedAt);
  data.set("title", snapshot.title);
  data.set("deck", snapshot.deck);
  data.set("excerpt", snapshot.excerpt);
  data.set("contentType", snapshot.contentType);
  data.set("sourceLocale", snapshot.sourceLocale);
  data.set("bodyJson", JSON.stringify(snapshot.document));
  snapshot.topics.forEach((topic) => data.append("topics", topic));
  return data;
}

export function WritingForm({ article }: { article: AdminWritingArticle }) {
  const locale = useLocale();
  const newsletterCopy = writingNewsletterCopy[locale];
  const initialDocument = useMemo(() => article.bodyJson ?? legacyBodyToWritingDocument(article.body), [article.body, article.bodyJson]);
  const [snapshot, setSnapshot] = useState<Snapshot>({ title: article.title, deck: article.deck, excerpt: article.excerpt, contentType: article.contentType, sourceLocale: article.sourceLocale, topics: article.topics, document: initialDocument });
  const [persistedFingerprint, setPersistedFingerprint] = useState(() => writingSnapshotFingerprint({ title: article.title, deck: article.deck, excerpt: article.excerpt, contentType: article.contentType, sourceLocale: article.sourceLocale, topics: article.topics, document: initialDocument }));
  const [phase, setPhase] = useState<SavePhase>("saved");
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [feedback, setFeedback] = useState<WritingActionState>(null);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [editorReady, setEditorReady] = useState(false);
  const [recoveryLoaded, setRecoveryLoaded] = useState(false);
  const [recoveries, setRecoveries] = useState<WritingRecoveryCandidate[]>([]);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const [recoveryPaused, setRecoveryPaused] = useState(false);
  const [recoveryChoiceRequired, setRecoveryChoiceRequired] = useState(false);
  const [serverUpdatedAt, setServerUpdatedAt] = useState(article.updatedAt);
  const [publishing, setPublishing] = useState(false);
  const [prepareNewsletter, setPrepareNewsletter] = useState(false);
  const [lastAction, setLastAction] = useState<"save" | "publish" | null>(null);
  const expectedUpdatedAtRef = useRef(article.updatedAt);
  const sourceRevisionRef = useRef(article.sourceRevision);
  const snapshotRef = useRef(snapshot);
  const currentFingerprintRef = useRef(writingSnapshotFingerprint(snapshot));
  const persistedFingerprintRef = useRef(persistedFingerprint);
  const generationRef = useRef(0);
  const savedGenerationRef = useRef(0);
  const savePromiseRef = useRef<Promise<WritingActionState> | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const confirmedNavigationRef = useRef(false);
  const publishingRef = useRef(false);
  const settingsRef = useRef<HTMLDetailsElement | null>(null);
  const editorHandleRef = useRef<WritingEditorHandle | null>(null);
  const editorStateRef = useRef<WritingEditorState | null>(null);
  const editorErrorRef = useRef<string | null>(null);
  const recoveryOwnerRef = useRef<string | null>(null);
  const ownRecoveryRef = useRef<WritingRecoveryCandidate | null>(null);
  const restoredRecoveryRef = useRef<WritingRecoveryCandidate | null>(null);
  const recoveryPausedRef = useRef(false);
  const recoveryChoiceRequiredRef = useRef(false);

  const isDirty = !!editorError || isWritingSnapshotDirty(writingSnapshotFingerprint(snapshot), persistedFingerprint);
  const hasUnsavedChanges = isDirty;

  // Called only inside the cross-tab recovery lock, including explicit restore.
  const storeCurrentDraft = useCallback(() => {
    const owner = recoveryOwnerRef.current;
    const editorState = editorStateRef.current;
    if (!owner || !editorState) return false;
    const fields = recoveryFields(snapshotRef.current);
    const entry: WritingRecoveryEntry = { version: 1, articleId: article.id, owner, capturedAt: Date.now(), baseUpdatedAt: expectedUpdatedAtRef.current, fields, raw: editorState.raw };
    try {
      const result = writeWritingRecovery(window.localStorage, entry);
      if (result.ok) {
        ownRecoveryRef.current = { entry, token: JSON.stringify(entry) };
        setRecoveryError(null);
      } else setRecoveryError(result.message);
      return result.ok;
    } catch {
      setRecoveryError("Local recovery is unavailable. Download a recovery copy before leaving.");
      return false;
    }
  }, [article.id]);

  const cacheCurrentDraft = useCallback(async () => {
    try { return await withWritingRecoveryLock(storeCurrentDraft); }
    catch {
      setRecoveryError("Local recovery is unavailable. Download a recovery copy before leaving.");
      return false;
    }
  }, [storeCurrentDraft]);

  useEffect(() => {
    let active = true;
    const initialization = window.setTimeout(async () => {
      // A fresh owner per mount protects every previous tab/reload's recovery copy.
      recoveryOwnerRef.current = window.crypto.randomUUID();
      try {
        const result = await withWritingRecoveryLock(() => readWritingRecovery(window.localStorage, article.id));
        if (!active) return;
        setRecoveries(result.candidates);
        setRecoveryError(result.error);
        const needsChoice = result.candidates.length > 0 || !!result.error;
        recoveryChoiceRequiredRef.current = needsChoice;
        recoveryPausedRef.current = needsChoice;
        setRecoveryChoiceRequired(needsChoice);
        setRecoveryPaused(needsChoice);
      } catch {
        if (!active) return;
        setRecoveryError("Local recovery storage is unavailable. Download a recovery copy before leaving.");
      }
      setRecoveryLoaded(true);
      if (editorErrorRef.current || isWritingSnapshotDirty(currentFingerprintRef.current, persistedFingerprintRef.current)) cacheCurrentDraft();
    }, 0);
    return () => { active = false; window.clearTimeout(initialization); };
  }, [article.id, cacheCurrentDraft]);

  const markChanged = useCallback((update: (current: Snapshot) => Snapshot) => {
    const next = update(snapshotRef.current);
    const nextFingerprint = writingSnapshotFingerprint(next);
    snapshotRef.current = next;
    if (nextFingerprint === currentFingerprintRef.current) return;
    currentFingerprintRef.current = nextFingerprint;
    setSnapshot(next);
    generationRef.current += 1;
    setFeedback(null);
    setLastAction(null);
    setPhase((current) => current === "saving" && savePromiseRef.current ? "saving" : !editorErrorRef.current && !isWritingSnapshotDirty(nextFingerprint, persistedFingerprintRef.current) ? "saved" : current === "conflict" ? "conflict" : article.status === "draft" ? "waiting" : "dirty");
    cacheCurrentDraft();
  }, [article.status, cacheCurrentDraft]);

  const onEditorStateChange = useCallback((state: WritingEditorState) => {
    const previousFingerprint = currentFingerprintRef.current;
    editorStateRef.current = state;
    editorErrorRef.current = state.validation.success ? null : state.validation.message;
    setEditorError(editorErrorRef.current);
    if (state.validation.success) markChanged((current) => ({ ...current, document: state.validation.success ? state.validation.data : current.document }));
    else {
      generationRef.current += 1;
      setFeedback(null);
      setLastAction(null);
    }
    setPhase((current) => current === "saving" && savePromiseRef.current ? "saving" : current === "conflict" ? "conflict" : !editorErrorRef.current && !isWritingSnapshotDirty(currentFingerprintRef.current, persistedFingerprintRef.current) ? "saved" : article.status === "draft" ? "waiting" : "dirty");
    // Always back up the actual raw document, even when canonical parsing failed.
    // markChanged already backs up changed canonical content once.
    if (!state.validation.success || currentFingerprintRef.current === previousFingerprint) void cacheCurrentDraft();
  }, [article.status, cacheCurrentDraft, markChanged]);

  const onEditorReady = useCallback((handle: WritingEditorHandle | null) => {
    editorHandleRef.current = handle;
    setEditorReady(!!handle);
    if (!handle) return;
    const state = handle.capture();
    editorStateRef.current = state;
    editorErrorRef.current = state.validation.success ? null : state.validation.message;
    setEditorError(editorErrorRef.current);
    if (!state.validation.success || isWritingSnapshotDirty(currentFingerprintRef.current, persistedFingerprintRef.current)) cacheCurrentDraft();
  }, [cacheCurrentDraft]);

  const currentEditorIsValid = useCallback(() => {
    const handle = editorHandleRef.current;
    if (!handle) return false;
    const state = handle.capture();
    if (JSON.stringify(state.raw) !== JSON.stringify(editorStateRef.current?.raw)
      || (state.validation.success ? null : state.validation.message) !== editorErrorRef.current) onEditorStateChange(state);
    return state.validation.success && !recoveryChoiceRequiredRef.current;
  }, [onEditorStateChange]);

  const finishRecoverySave = useCallback(async (savedRaw: unknown) => {
    try {
      const cleaned = await withWritingRecoveryLock(() => {
        // Recheck after acquiring the lock: typing may continue while it is queued.
        if (editorErrorRef.current || isWritingSnapshotDirty(currentFingerprintRef.current, persistedFingerprintRef.current) || JSON.stringify(editorStateRef.current?.raw) !== JSON.stringify(savedRaw)) return false;
        for (const candidate of [ownRecoveryRef.current, restoredRecoveryRef.current]) {
          if (!candidate) continue;
          const result = removeWritingRecovery(window.localStorage, candidate);
          if (!result.ok) setRecoveryError(result.message);
          else setRecoveries((current) => current.filter((item) => item.token !== candidate.token));
        }
        ownRecoveryRef.current = null;
        restoredRecoveryRef.current = null;
        recoveryPausedRef.current = false;
        setRecoveryPaused(false);
        return true;
      });
      if (!cleaned) await cacheCurrentDraft();
    } catch {
      setRecoveryError("Saved to the server, but the local recovery copy could not be removed.");
    }
  }, [cacheCurrentDraft]);

  const runDraftSave = useCallback(async (manual = false): Promise<WritingActionState> => {
    if (article.status !== "draft" || publishingRef.current || !currentEditorIsValid() || (!manual && recoveryPausedRef.current)) return { ok: false, code: "validation", message: editorErrorRef.current ?? "Review local recovery and the current editor before saving." };
    if (savePromiseRef.current) {
      while (savePromiseRef.current) await savePromiseRef.current;
      // The editor may have become invalid while the previous save was in flight.
      if (!currentEditorIsValid()) return { ok: false, code: "validation", message: editorErrorRef.current ?? "The editor is not ready to save." };
      if (!isWritingSnapshotDirty(currentFingerprintRef.current, persistedFingerprintRef.current)) return { ok: true, message: "Draft saved.", updatedAt: expectedUpdatedAtRef.current };
    }

    const generation = generationRef.current;
    const savingSnapshot = snapshotRef.current;
    const savingRaw = editorStateRef.current?.raw;
    const formData = toFormData(article.id, expectedUpdatedAtRef.current, savingSnapshot);
    const draftInput = parseWritingInput(formData, "draft");
    if (!draftInput.success) {
      const result: WritingActionState = { ok: false, code: "validation", message: "Fix the current draft before saving.", fieldErrors: draftInput.fieldErrors };
      setFeedback(result);
      setPhase("failed");
      return result;
    }
    const savedSnapshot = { ...savingSnapshot, title: draftInput.data.title, deck: draftInput.data.deck, excerpt: draftInput.data.excerpt, topics: draftInput.data.topics, document: draftInput.data.bodyJson };
    const savingFingerprint = writingSnapshotFingerprint(savedSnapshot);
    setLastAction("save");
    setPhase("saving");
    const request = (async (): Promise<WritingActionState> => {
      try { return await saveWritingAction(null, formData); }
      catch { return { ok: false, code: "error", message: "Draft save failed. Your local content is retained; retry when the connection is available." }; }
    })();
    savePromiseRef.current = request;
    const result = await request;
    if (savePromiseRef.current === request) savePromiseRef.current = null;
    setFeedback(result);
    if (result?.ok && result.updatedAt) {
      expectedUpdatedAtRef.current = result.updatedAt;
      setServerUpdatedAt(result.updatedAt);
      if (result.sourceRevision) sourceRevisionRef.current = result.sourceRevision;
      savedGenerationRef.current = Math.max(savedGenerationRef.current, generation);
      // Reconcile only the saved topics. Never replace newer editor content or
      // a topic selection that changed while this request was in flight.
      if (JSON.stringify(snapshotRef.current.topics) === JSON.stringify(savingSnapshot.topics)
        && JSON.stringify(savedSnapshot.topics) !== JSON.stringify(savingSnapshot.topics)) {
        const next = { ...snapshotRef.current, topics: savedSnapshot.topics };
        snapshotRef.current = next;
        currentFingerprintRef.current = writingSnapshotFingerprint(next);
        setSnapshot(next);
      }
      // Server text normalization must also describe the actual saved state.
      // Reconcile each field only if it has not been edited during this save.
      for (const field of ["title", "deck", "excerpt"] as const) {
        if (snapshotRef.current[field] === savingSnapshot[field] && savedSnapshot[field] !== savingSnapshot[field]) {
          const next = { ...snapshotRef.current, [field]: savedSnapshot[field] };
          snapshotRef.current = next;
          currentFingerprintRef.current = writingSnapshotFingerprint(next);
          setSnapshot(next);
        }
      }
      persistedFingerprintRef.current = savingFingerprint;
      setPersistedFingerprint(savingFingerprint);
      if (!editorErrorRef.current && !isWritingSnapshotDirty(currentFingerprintRef.current, savingFingerprint)) setPhase("saved");
      else setPhase("waiting");
      await finishRecoverySave(savingRaw);
    } else {
      setPhase(result?.code === "conflict" ? "conflict" : "failed");
    }
    return result;
  }, [article.id, article.status, currentEditorIsValid, finishRecoverySave]);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (article.status !== "draft" || phase !== "waiting" || editorError) return;
    if (!editorReady || !recoveryLoaded || recoveryPaused || publishing || savePromiseRef.current) return;
    timerRef.current = setTimeout(() => { void runDraftSave(); }, AUTOSAVE_DELAY_MS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [article.status, editorError, editorReady, recoveryLoaded, recoveryPaused, publishing, phase, runDraftSave, snapshot]);

  useEffect(() => {
    // Install while clean too: an invalid raw edit is guarded synchronously via
    // refs, even before React has rendered its unsaved/validation indicators.

    let bypassReset: ReturnType<typeof setTimeout> | null = null;
    const allowConfirmedNavigation = () => {
      confirmedNavigationRef.current = true;
      if (bypassReset) clearTimeout(bypassReset);
      bypassReset = setTimeout(() => { confirmedNavigationRef.current = false; }, 1_500);
    };
    const stillDirty = () => !!editorErrorRef.current || isWritingSnapshotDirty(currentFingerprintRef.current, persistedFingerprintRef.current);
    const beforeUnload = (event: BeforeUnloadEvent) => {
      currentEditorIsValid();
      if (confirmedNavigationRef.current || !stillDirty()) return;
      event.preventDefault();
      event.returnValue = "";
    };
    const guardLinks = (event: MouseEvent) => {
      currentEditorIsValid();
      if (!stillDirty()) return;
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || !(event.target instanceof Element)) return;
      const link = event.target.closest<HTMLAnchorElement>("a[href]");
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
      if (!writingNavigationLeavesDocument(window.location.href, link.href)) return;
      if (!window.confirm(UNSAVED_CHANGES_MESSAGE)) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      allowConfirmedNavigation();
    };
    const navigation = (window as Window & { navigation?: BrowserNavigation }).navigation;
    const guardNavigation = (event: Event) => {
      currentEditorIsValid();
      if (confirmedNavigationRef.current || !stillDirty()) return;
      const navigationEvent = event as BrowserNavigationEvent;
      if (!event.cancelable || navigationEvent.canIntercept === false || navigationEvent.downloadRequest || navigationEvent.hashChange) return;
      if (!navigationEvent.destination?.url || !writingNavigationLeavesDocument(window.location.href, navigationEvent.destination.url)) return;
      if (!window.confirm(UNSAVED_CHANGES_MESSAGE)) {
        event.preventDefault();
        return;
      }
      allowConfirmedNavigation();
    };
    const guardedUrl = window.location.href;
    const guardedState = window.history.state;
    const guardHistory = (event: PopStateEvent) => {
      currentEditorIsValid();
      if (confirmedNavigationRef.current || !stillDirty() || !writingNavigationLeavesDocument(guardedUrl, window.location.href)) return;
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
  }, [hasUnsavedChanges, currentEditorIsValid]);

  const downloadRecovery = (candidate?: WritingRecoveryCandidate) => {
    const state = editorHandleRef.current?.capture() ?? editorStateRef.current;
    if (!state) return;
    const fields = recoveryFields(snapshotRef.current);
    const entry: WritingRecoveryEntry = candidate?.entry ?? { version: 1, articleId: article.id, owner: recoveryOwnerRef.current ?? "download", capturedAt: Date.now(), baseUpdatedAt: expectedUpdatedAtRef.current, fields, raw: state.raw };
    const url = URL.createObjectURL(new Blob([JSON.stringify(entry, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `writing-recovery-${article.id}.json`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
  };

  const continueWithCurrent = () => {
    recoveryChoiceRequiredRef.current = false;
    recoveryPausedRef.current = false;
    setRecoveryChoiceRequired(false);
    setRecoveryPaused(false);
  };

  const restoreRecovery = async (candidate: WritingRecoveryCandidate) => {
    try {
      await withWritingRecoveryLock(() => {
        if (!editorHandleRef.current || savePromiseRef.current || publishingRef.current) return;
        const live = editorHandleRef.current.capture();
        if (JSON.stringify(live.raw) !== JSON.stringify(editorStateRef.current?.raw)) onEditorStateChange(live);
        const changed = !!editorErrorRef.current || isWritingSnapshotDirty(currentFingerprintRef.current, persistedFingerprintRef.current);
        if (changed && !window.confirm("Replace the current local editor content with this recovery copy? Current changes will be kept in a separate local copy. Nothing is saved to the server until you explicitly save.")) return;
        if (changed) {
          storeCurrentDraft();
          // Do not replace unsaved content if its backup could not be written.
          let backedUp = false;
          try { backedUp = readWritingRecovery(window.localStorage, article.id).candidates.some((copy) => copy.token === ownRecoveryRef.current?.token); }
          catch { /* Keep the current editor untouched if storage cannot be verified. */ }
          if (!backedUp || !ownRecoveryRef.current
            || JSON.stringify(ownRecoveryRef.current.entry.raw) !== JSON.stringify(editorStateRef.current?.raw)
            || JSON.stringify(ownRecoveryRef.current.entry.fields) !== JSON.stringify(recoveryFields(snapshotRef.current))) {
            setRecoveryError("Current changes could not be backed up. Download them before restoring another version.");
            return;
          }
          const previous = ownRecoveryRef.current;
          if (previous) setRecoveries((current) => [previous, ...current.filter((item) => item.token !== previous.token)]);
          // Preserve the replaced local version in its own slot, including metadata.
          recoveryOwnerRef.current = window.crypto.randomUUID();
          ownRecoveryRef.current = null;
        }
        recoveryPausedRef.current = true;
        setRecoveryPaused(true);
        try {
          if (!editorHandleRef.current.restore(candidate.entry.raw)) {
            setRecoveryError("This copy contains nodes incompatible with the current editor. It was kept intact; no content was replaced.");
            return;
          }
          restoredRecoveryRef.current = candidate;
          onEditorStateChange(editorHandleRef.current.capture());
          markChanged((current) => ({ ...current, ...candidate.entry.fields }));
          recoveryChoiceRequiredRef.current = false;
          setRecoveryChoiceRequired(false);
          setMode("edit");
          setFeedback(null);
        } catch {
          setRecoveryError("Recovery could not be loaded. The recovery copy was kept intact.");
        }
      });
    } catch {
      setRecoveryError("Safe local recovery is unavailable. Download the current draft before restoring another version.");
    }
  };

  const discardRecovery = async (candidate: WritingRecoveryCandidate) => {
    if (!window.confirm("Delete this local recovery copy permanently? The server article and current editor will not be changed.")) return;
    try {
      const result = await withWritingRecoveryLock(() => removeWritingRecovery(window.localStorage, candidate));
      if (!result.ok) { setRecoveryError(result.message); return; }
      setRecoveries((current) => current.filter((item) => item.token !== candidate.token));
      // Continue only through the explicit current-version selection.
    } catch { setRecoveryError("The local recovery copy could not be removed."); }
  };

  const submitPublished = async () => {
    if (publishingRef.current || !currentEditorIsValid()) return;
    publishingRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    setPublishing(true);
    if (savePromiseRef.current) await savePromiseRef.current;
    if (!currentEditorIsValid()) {
      publishingRef.current = false;
      setPublishing(false);
      return;
    }
    setLastAction("publish");
    const publishingSnapshot = snapshotRef.current;
    const publishingGeneration = generationRef.current;
    const publishingRaw = editorStateRef.current?.raw;
    const formData = toFormData(article.id, expectedUpdatedAtRef.current, publishingSnapshot);
    if (prepareNewsletter) formData.set("prepareNewsletter", "on");
    const localValidation = parseWritingInput(formData, "publish");
    if (!localValidation.success) {
      setFeedback({ ok: false, code: "validation", message: "Complete the publication details before publishing.", fieldErrors: localValidation.fieldErrors });
      setPublishing(false);
      publishingRef.current = false;
      return;
    }
    const publishedSnapshot = { ...publishingSnapshot, title: localValidation.data.title, deck: localValidation.data.deck, excerpt: localValidation.data.excerpt, topics: localValidation.data.topics, document: localValidation.data.bodyJson };
    const publishingFingerprint = writingSnapshotFingerprint(publishedSnapshot);
    let result: WritingActionState;
    try { result = await publishWritingAction(null, formData); }
    catch { result = { ok: false, code: "error", message: "Publishing failed. Your local content is retained; retry when the connection is available." }; }
    setFeedback(result);
    if (result?.ok && result.updatedAt) {
      expectedUpdatedAtRef.current = result.updatedAt;
      setServerUpdatedAt(result.updatedAt);
      if (result.sourceRevision) sourceRevisionRef.current = result.sourceRevision;
      savedGenerationRef.current = Math.max(savedGenerationRef.current, publishingGeneration);
      let reconciled = snapshotRef.current;
      for (const field of ["title", "deck", "excerpt", "topics"] as const) {
        if (JSON.stringify(reconciled[field]) === JSON.stringify(publishingSnapshot[field])) reconciled = { ...reconciled, [field]: publishedSnapshot[field] };
      }
      snapshotRef.current = reconciled;
      currentFingerprintRef.current = writingSnapshotFingerprint(reconciled);
      setSnapshot(reconciled);
      persistedFingerprintRef.current = publishingFingerprint;
      setPersistedFingerprint(publishingFingerprint);
      let newerChangesRemain = !!editorErrorRef.current || isWritingSnapshotDirty(currentFingerprintRef.current, publishingFingerprint);
      setPhase(newerChangesRemain ? "dirty" : "saved");
      await finishRecoverySave(publishingRaw);
      // Recovery may wait for another tab. Re-read the live editor before
      // allowing navigation to bypass the unsaved-content guard.
      newerChangesRemain = !currentEditorIsValid() || isWritingSnapshotDirty(currentFingerprintRef.current, publishingFingerprint);
      setPhase(newerChangesRemain ? "dirty" : "saved");
      if (result.slug && !newerChangesRemain) {
        confirmedNavigationRef.current = true;
        const query = writingNewsletterStatusQuery(result.newsletterPreparation);
        const pathname = getLocalizedPathname(`/writing/${result.slug}`, publishingSnapshot.sourceLocale);
        window.location.assign(`${pathname}${query ? `?${query}` : ""}`);
        return;
      }
    } else if (result?.code !== "validation") setPhase(result?.code === "conflict" ? "conflict" : "failed");
    setPublishing(false);
    publishingRef.current = false;
  };

  const draftValidation = useMemo(() => parseWritingInput(toFormData(article.id, article.updatedAt, snapshot), "draft"), [article.id, article.updatedAt, snapshot]);
  const publicationValidation = useMemo(() => parseWritingInput(toFormData(article.id, article.updatedAt, snapshot), "publish"), [article.id, article.updatedAt, snapshot]);
  const publicationIssues = publicationValidation.success ? [] : Object.entries(publicationValidation.fieldErrors) as Array<[WritingField, string]>;
  const settingsRequirementCount = publicationIssues.filter(([field]) => publicationSettingsFields.includes(field)).length;
  const publicationIssueCount = publicationIssues.length + (editorError ? 1 : 0);
  const draftReady = editorReady && recoveryLoaded && !editorError && !recoveryChoiceRequired && draftValidation.success;
  const publicationReady = editorReady && recoveryLoaded && !editorError && !recoveryChoiceRequired && publicationIssues.length === 0;
  const teaserSuggestion = useMemo(() => deriveWritingTeaser(snapshot.deck, snapshot.document), [snapshot.deck, snapshot.document]);
  const fieldError = (field: WritingField) => feedback && !feedback.ok ? feedback.fieldErrors?.[field] : undefined;
  const validationErrors = useMemo(() => feedback && !feedback.ok && feedback.code === "validation"
    ? Object.entries(feedback.fieldErrors ?? {}) as Array<[WritingField, string]>
    : [], [feedback]);
  const hasSettingsErrors = validationErrors.some(([field]) => field === "contentType" || field === "topics" || field === "excerpt" || field === "sourceLocale");
  useEffect(() => {
    if (lastAction !== "publish" || validationErrors.length === 0) return;
    if (hasSettingsErrors) settingsRef.current?.setAttribute("open", "");
    const firstField = validationErrors[0]?.[0];
    const selectorByField: Record<WritingField, string> = {
      title: "#writing-title",
      deck: "#writing-deck",
      excerpt: "#writing-excerpt",
      bodyJson: '.writing-editor [contenteditable="true"]',
      contentType: "#writing-content-type",
      topics: "[data-writing-topics] input",
      sourceLocale: "#writing-source-locale",
    };
    window.requestAnimationFrame(() => document.querySelector<HTMLElement>(selectorByField[firstField])?.focus());
  }, [hasSettingsErrors, lastAction, validationErrors]);
  const fieldClass = "mt-2 min-h-12 w-full rounded-lg border border-white/15 bg-[#04111b] px-4 py-3 text-white outline-none focus-visible:border-[#35d0e5] focus-visible:ring-2 focus-visible:ring-[#35d0e5]/30";
  const publishBlocked = lastAction === "publish" && feedback && !feedback.ok && feedback.code === "validation";
  const statusLabel = !editorReady ? "Loading editor..." : editorError ? "Unsaved content — document blocked" : recoveryChoiceRequired ? "Recovery review required" : publishBlocked ? "Publish blocked" : article.status === "published" && isDirty ? "Unpublished changes" : phase === "saving" ? "Saving..." : phase === "waiting" || phase === "dirty" ? "Unsaved changes" : phase === "failed" ? "Save failed" : phase === "conflict" ? "Conflict" : !writingDocumentToPlainText(snapshot.document) ? "Empty document — no article text saved" : "Saved";
  const settingsSummary = settingsRequirementCount > 0
    ? `${settingsRequirementCount} ${settingsRequirementCount === 1 ? "detail" : "details"} required before publishing`
    : [snapshot.contentType === "essay" ? "Essay" : "Note", snapshot.sourceLocale.toUpperCase(), ...snapshot.topics, publicationReady ? "Publish ready" : "Document needs attention"].join(" · ");
  const previewShareContext: WritingShareContext = {
    articleId: article.id,
    articleSlug: article.slug,
    articleTitle: snapshot.title || "Untitled draft",
    authorName: siteConfig.name,
    canonicalUrl: null,
    domain: siteConfig.domain,
    language: snapshot.sourceLocale,
  };

  return (
    <div className="mt-4">
      <div className="sticky top-20 z-20 mb-6 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-[#061521]/95 p-2 shadow-[0_12px_40px_rgba(0,0,0,0.18)] backdrop-blur sm:gap-3 sm:p-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2 px-1" aria-live="polite">
          <span className={`rounded-full border px-3 py-1 font-mono text-xs font-black uppercase tracking-[0.14em] ${article.status === "published" ? "border-emerald-300/40 text-emerald-300" : "border-[#ffb36d]/40 text-[#ffb36d]"}`}>{article.status}</span>
          <span className={`text-sm ${phase === "failed" || phase === "conflict" ? "font-bold text-[#ffb36d]" : article.status === "published" && isDirty ? "font-bold text-[#ffb36d]" : "text-slate-400"}`}>{statusLabel}</span>
          <span data-draft-readiness className={`rounded-full border px-2.5 py-1 font-mono text-[10px] font-black uppercase tracking-[0.11em] ${draftReady ? "border-emerald-300/25 text-emerald-200" : "border-[#ff9a3d]/35 text-[#ffcfaa]"}`}>{draftReady ? "Draft-save ready" : "Draft needs attention"}</span>
          <span data-publication-readiness className={`rounded-full border px-2.5 py-1 font-mono text-[10px] font-black uppercase tracking-[0.11em] ${publicationReady ? "border-[#35d0e5]/35 text-[#9debf4]" : "border-[#ff9a3d]/35 text-[#ffcfaa]"}`}>{publicationReady ? "Publish ready" : publicationIssueCount > 0 ? `Publish needs ${publicationIssueCount} ${publicationIssueCount === 1 ? "detail" : "details"}` : "Publish needs review"}</span>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
          <div role="group" aria-label="Editor view" className="flex min-w-0 flex-1 rounded-full border border-white/15 p-1 sm:flex-none">
            {(["edit", "preview"] as const).map((view) => <button key={view} type="button" aria-pressed={mode === view} onClick={() => { currentEditorIsValid(); setMode(view); }} className={`min-h-10 flex-1 rounded-full px-3 text-sm font-bold capitalize transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35d0e5]/70 sm:flex-none sm:px-4 ${mode === view ? "bg-white text-[#041018]" : "text-slate-300 hover:bg-white/[0.06]"}`}>{view}</button>)}
          </div>
          {article.status === "draft" ? <button type="button" onClick={() => void runDraftSave(true)} disabled={phase === "saving" || publishing || !draftReady} className="min-h-11 rounded-full border border-white/20 px-4 text-sm font-bold text-white transition hover:border-[#35d0e5]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35d0e5]/70 disabled:opacity-50">{phase === "failed" ? "Retry save" : "Save Draft"}</button> : null}
          <button type="button" onClick={() => void submitPublished()} disabled={publishing || !editorReady || !recoveryLoaded || recoveryChoiceRequired || !!editorError} aria-label={article.status === "published" ? "Update published article" : "Publish article"} className="min-h-11 rounded-full bg-[#35d0e5] px-4 text-sm font-black text-[#041018] transition hover:bg-[#64dcea] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 disabled:opacity-50 sm:px-5">{publishing ? "Publishing..." : article.status === "published" ? <><span className="sm:hidden">Update</span><span className="hidden sm:inline">Update Published</span></> : "Publish"}</button>
        </div>
      </div>

      {editorReady ? <div className="mx-auto mb-5 max-w-4xl text-sm text-slate-400"><button type="button" onClick={() => downloadRecovery()} className="min-h-11 underline underline-offset-4">Download current recovery copy</button><p className="text-xs">Private local recovery: 8 copies / 2 MiB in this browser. Valid copies expire after 24 hours and are removed on the next Studio visit. Unreadable copies are kept for review. Shared devices can access browser-local drafts.</p></div> : null}
      {recoveries.length > 0 || recoveryChoiceRequired || recoveryPaused || recoveryError ? <section aria-label="Local draft recovery" className="mx-auto mb-7 max-w-4xl rounded-xl border border-[#ffb36d]/30 p-4 text-sm text-slate-200">
        <p className="font-bold">Local draft recovery</p>
        {recoveryChoiceRequired ? <p className="mt-2">Choose a recovery copy or continue with the current server version. Nothing is restored or autosaved automatically.</p> : recoveryPaused ? <p className="mt-2">Autosave is paused: review the current document, then explicitly Save Draft or Update/Publish.</p> : null}
        {recoveries.map((candidate) => <div key={candidate.entry.owner} className="mt-3 border-t border-white/10 pt-3">
          <p>{candidate.entry.fields.title || "Untitled draft"} · {new Date(candidate.entry.capturedAt).toLocaleString()}</p>
          {candidate.entry.baseUpdatedAt !== serverUpdatedAt ? <p className="mt-1 text-[#ffcfaa]">This copy is based on a different server revision. Restoring changes only this editor; the current server article remains untouched until you explicitly save.</p> : null}
          <div className="mt-2 flex flex-wrap gap-4"><button type="button" disabled={!editorReady || phase === "saving" || publishing} onClick={() => restoreRecovery(candidate)} className="min-h-11 font-bold underline">Restore this copy locally</button><button type="button" onClick={() => downloadRecovery(candidate)} className="min-h-11 underline">Download copy</button><button type="button" onClick={() => discardRecovery(candidate)} className="min-h-11 underline">Delete this copy</button></div>
        </div>)}
        {recoveryChoiceRequired ? <button type="button" onClick={continueWithCurrent} className="mt-3 min-h-11 font-bold underline">Continue with current version; keep recovery copies</button> : null}
        {recoveryError ? <p role="alert" className="mt-3 text-[#ffcfaa]">{recoveryError}</p> : null}
      </section> : null}

      {feedback && !feedback.ok ? (
        <div role="alert" className="mb-7 border-l-2 border-[#ff9a3d] p-4 text-[#ffcfaa]">
          <p className="font-bold">{validationErrors.length > 0 ? "Fix these fields before continuing:" : feedback.message}</p>
          {validationErrors.length > 0 ? <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-6">{validationErrors.map(([field, message]) => <li key={field}><strong>{writingFieldLabels[field]}:</strong> {message}</li>)}</ul> : null}
        </div>
      ) : null}
      {feedback?.ok && feedback.slug ? <div role="status" className="mb-7 border-l-2 border-[#35d0e5] p-4 text-slate-200">{feedback.message} <a href={`/writing/${feedback.slug}`} className="font-bold text-[#35d0e5] underline">Open public article</a></div> : null}

      {mode === "preview" ? (
        <section aria-label="Private article preview" className="mx-auto max-w-[72ch] rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-10">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#35d0e5]">Private preview</p>
          {editorError ? <p role="alert" className="mt-4 border-l-2 border-[#ff9a3d] p-4 text-[#ffcfaa]">Preview unavailable for the current document. {editorError} Return to Edit to review it. A previous valid version is not shown as your current article.</p> : null}
          <h2 className="mt-6 break-words text-4xl font-black text-white sm:text-6xl">{snapshot.title || "Untitled draft"}</h2>
          {snapshot.deck ? <p className="mt-5 text-xl font-bold leading-8 text-slate-200">{snapshot.deck}</p> : null}
          {snapshot.excerpt ? <p className="mt-6 border-l border-[#ff9a3d] pl-5 text-slate-400">{snapshot.excerpt}</p> : null}
          {!editorError && editorReady ? <div className="mt-10"><WritingDocument document={snapshot.document} shareContext={previewShareContext} shareCopy={getWritingShareDictionary("en")} /></div> : null}
        </section>
      ) : null}
        <div hidden={mode !== "edit"} className="mx-auto max-w-4xl space-y-7">
          <section aria-labelledby="writing-main-fields" className="space-y-5">
            <h2 id="writing-main-fields" className="sr-only">Article</h2>
            <div><label htmlFor="writing-title" className="sr-only">Title</label><input id="writing-title" value={snapshot.title} placeholder="Article title" onChange={(event) => markChanged((current) => ({ ...current, title: event.target.value }))} maxLength={160} className="min-h-14 w-full border-b border-white/10 bg-transparent px-0 py-2 text-3xl font-black leading-tight text-white outline-none placeholder:text-slate-600 focus-visible:border-[#35d0e5]/70 sm:text-5xl" aria-invalid={!!fieldError("title")} />{fieldError("title") ? <p className="mt-2 text-sm text-[#ffb16a]">{fieldError("title")}</p> : null}</div>
            <div><label htmlFor="writing-deck" className="sr-only">Deck / subtitle</label><textarea id="writing-deck" value={snapshot.deck} placeholder="Deck or subtitle" onChange={(event) => markChanged((current) => ({ ...current, deck: event.target.value }))} maxLength={240} rows={2} className="min-h-20 w-full resize-y border-b border-white/10 bg-transparent px-0 py-3 text-lg font-medium leading-8 text-slate-200 outline-none placeholder:text-slate-600 focus-visible:border-[#35d0e5]/70 sm:text-xl" aria-invalid={!!fieldError("deck")} />{fieldError("deck") ? <p className="mt-2 text-sm text-[#ffb16a]">{fieldError("deck")}</p> : null}</div>
            <div><div className="mb-3 flex flex-wrap items-baseline justify-between gap-2"><p className="font-bold text-white">Document</p><p className="max-w-xl text-xs leading-5 text-slate-500">Use / for blocks or mark Key Thoughts, Pull Quotes, and Shareable passages for stronger share cards.</p></div><WritingEditor initialDocument={snapshot.document} onReady={onEditorReady} onStateChange={onEditorStateChange} />{editorError || fieldError("bodyJson") ? <p role="alert" className="mt-3 text-sm text-[#ffb16a]">{editorError ?? fieldError("bodyJson")}</p> : null}</div>
          </section>

          <details ref={settingsRef} className="writing-article-settings group rounded-2xl border border-white/[0.08] bg-white/[0.015] p-4 sm:p-5">
            <summary className="flex min-h-11 cursor-pointer list-none items-center gap-3 rounded-lg text-white outline-none focus-visible:ring-2 focus-visible:ring-[#35d0e5]/60 [&::-webkit-details-marker]:hidden"><span className="whitespace-nowrap font-black">Article settings</span><span className={`min-w-0 truncate text-sm ${settingsRequirementCount > 0 ? "font-bold text-[#ffbf82]" : "text-slate-500"}`}>{settingsSummary}</span><svg aria-hidden="true" viewBox="0 0 20 20" className="ml-auto size-4 shrink-0 text-slate-500 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m5 7.5 5 5 5-5"/></svg></summary>
            <div className="mt-5 grid gap-6 border-t border-white/[0.07] pt-5 sm:grid-cols-2">
              <div><label htmlFor="writing-content-type" className="font-bold text-white">Content Type</label><p className="mt-1 text-xs text-slate-500">Required to publish.</p><select id="writing-content-type" value={snapshot.contentType} onChange={(event) => markChanged((current) => ({ ...current, contentType: event.target.value as WritingContentType }))} className={fieldClass} aria-invalid={!!fieldError("contentType")}><option value="essay">Essay</option><option value="note">Note</option></select></div>
              <div><label htmlFor="writing-source-locale" className="font-bold text-white">Source language</label><p className="mt-1 text-xs text-slate-500">The language of the original article. Locked after first publication.</p><select id="writing-source-locale" value={snapshot.sourceLocale} disabled={article.status === "published"} onChange={(event) => markChanged((current) => ({ ...current, sourceLocale: event.target.value as WritingLanguage }))} className={fieldClass} aria-invalid={!!fieldError("sourceLocale")}>{writingLanguages.map((language) => <option key={language} value={language}>{language.toUpperCase()}</option>)}</select>{fieldError("sourceLocale") ? <p className="mt-2 text-sm text-[#ffb16a]">{fieldError("sourceLocale")}</p> : null}</div>
              <fieldset data-writing-topics><legend className="font-bold text-white">Topics</legend><p className="mt-1 text-xs text-slate-500">Choose at least one before publishing.</p><div className="mt-3 flex flex-wrap gap-3">{suggestedWritingTopics.map((topic) => <label key={topic} className="flex min-h-11 items-center gap-2 rounded-full border border-white/15 px-4 text-sm text-slate-200"><input type="checkbox" checked={snapshot.topics.includes(topic)} onChange={(event) => markChanged((current) => ({ ...current, topics: event.target.checked ? [...current.topics, topic] : current.topics.filter((value) => value !== topic) }))} className="h-4 w-4 accent-[#35d0e5]" />{topic}</label>)}</div>{fieldError("topics") ? <p className="mt-2 text-sm text-[#ffb16a]">{fieldError("topics")}</p> : null}</fieldset>
              <div className="sm:col-span-2"><label htmlFor="writing-excerpt" className="font-bold text-white">Excerpt / Teaser</label><p className="mt-1 text-xs text-slate-500">Required to publish · 10–320 characters · shown on Writing previews and article share cards.</p>{teaserSuggestion && teaserSuggestion !== snapshot.excerpt ? <div data-teaser-suggestion className="mt-4 rounded-xl border border-[#35d0e5]/25 bg-[#35d0e5]/[0.045] p-4"><p className="font-mono text-[10px] font-black uppercase tracking-[0.14em] text-[#8eeaf5]">Suggested from your article</p><p className="mt-2 text-sm leading-6 text-slate-300">{teaserSuggestion}</p><button type="button" onClick={() => markChanged((current) => ({ ...current, excerpt: teaserSuggestion }))} className="mt-3 min-h-11 rounded-full border border-[#35d0e5]/45 px-4 text-sm font-black text-white hover:border-[#35d0e5]">Use this teaser</button></div> : null}<textarea id="writing-excerpt" value={snapshot.excerpt} placeholder="A concise reason to open the full story" onChange={(event) => markChanged((current) => ({ ...current, excerpt: event.target.value }))} maxLength={320} rows={4} className={fieldClass} aria-invalid={!!fieldError("excerpt")} />{fieldError("excerpt") ? <p className="mt-2 text-sm text-[#ffb16a]">{fieldError("excerpt")}</p> : null}</div>
            </div>
          </details>
        </div>

      <section data-final-publish-control className="mx-auto mt-8 flex max-w-4xl flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:flex-row sm:items-center sm:justify-between">
        <label data-newsletter-preparation className="flex min-h-11 items-start gap-3 text-sm text-slate-200">
          <input type="checkbox" checked={prepareNewsletter} disabled={publishing} onChange={(event) => setPrepareNewsletter(event.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-[#35d0e5]" />
          <span><span className="font-black text-white">{newsletterCopy.prepare}</span><span className="mt-1 block max-w-xl text-xs leading-5 text-slate-500">{newsletterCopy.prepareHint}</span></span>
        </label>
        <button type="button" onClick={() => void submitPublished()} disabled={publishing || !editorReady || !recoveryLoaded || recoveryChoiceRequired || !!editorError} aria-label={article.status === "published" ? "Update published article" : "Publish article"} className="min-h-11 shrink-0 rounded-full bg-[#35d0e5] px-5 text-sm font-black text-[#041018] transition hover:bg-[#64dcea] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 disabled:opacity-50">{publishing ? "Publishing..." : article.status === "published" ? "Update Published" : "Publish"}</button>
      </section>
    </div>
  );
}
