"use client";

import Image from "next/image";
import { useId, useState } from "react";

import { aiSummaryAssistants, type AiSummaryAssistant, type AiSummaryCopy } from "@/data/i18n/ai-summary";

type ClipboardWriter = Pick<Clipboard, "writeText">;
type DestinationOpener = (destination: string) => void;
type RenderedAssistant = AiSummaryAssistant | { id: "other-ai"; name: string; launch: { kind: "copy-only" } };
type PrefillLaunch = Extract<AiSummaryAssistant["launch"], { kind: "prefill" }>;
type StatusState = { kind: "idle" | "copied" | "provider" | "prefill" | "error"; message: string };

export async function writeAiSummaryPrompt(prompt: string, clipboard?: ClipboardWriter): Promise<void> {
  const writer = clipboard ?? (typeof navigator === "undefined" ? undefined : navigator.clipboard);
  if (!writer?.writeText) throw new Error("Clipboard API unavailable");
  await writer.writeText(prompt);
}

export function formatProviderStatus(template: string, provider: string): string {
  return template.replaceAll("{provider}", provider);
}

export function buildAssistantPrefillUrl(launch: PrefillLaunch, prompt: string): string {
  return `${launch.prefill.baseUrl}?${launch.prefill.promptParameter}=${encodeURIComponent(prompt)}`;
}

export function supportsAssistantPrefill(launch: PrefillLaunch, userAgent: string): boolean {
  if (launch.prefill.platform !== "desktop") return false;
  if (/Android|iPhone|iPad|iPod|Mobile/iu.test(userAgent)) return false;
  return /Windows NT|Macintosh|Mac OS X|X11|Linux/iu.test(userAgent);
}

export function openAssistantDestination(destination: string): void {
  window.open(destination, "_blank", "noopener,noreferrer");
}

export function openAssistantPrefill(launch: PrefillLaunch, prompt: string): void {
  window.location.assign(buildAssistantPrefillUrl(launch, prompt));
}

export async function copyPromptAndOpenDestination(prompt: string, destination: string, clipboard?: ClipboardWriter, opener: DestinationOpener = openAssistantDestination): Promise<void> {
  const copyOperation = writeAiSummaryPrompt(prompt, clipboard);
  try {
    opener(destination);
  } catch (error) {
    await copyOperation;
    throw error;
  }
  await copyOperation;
}

export function AiSummaryCard({ copy }: { copy: AiSummaryCopy }) {
  const headingId = useId();
  const promptId = useId();
  const statusId = useId();
  const [status, setStatus] = useState<StatusState>({ kind: "idle", message: "" });
  const [prefillAttempted, setPrefillAttempted] = useState<string | null>(null);
  const assistants: readonly RenderedAssistant[] = [...aiSummaryAssistants, { id: "other-ai", name: copy.otherAssistant, launch: { kind: "copy-only" } }];

  async function copyPrompt() {
    try {
      await writeAiSummaryPrompt(copy.prompt);
      setStatus({ kind: "copied", message: copy.copied });
    } catch {
      setStatus({ kind: "error", message: copy.copyError });
    }
  }

  async function launchAssistant(assistant: RenderedAssistant) {
    if (assistant.launch.kind === "copy-only") {
      await copyPrompt();
      return;
    }

    if (assistant.launch.kind === "prefill" && supportsAssistantPrefill(assistant.launch, navigator.userAgent) && prefillAttempted !== assistant.id) {
      setPrefillAttempted(assistant.id);
      const copyOperation = writeAiSummaryPrompt(copy.prompt);
      let prefillOpened = false;
      try {
        openAssistantPrefill(assistant.launch, copy.prompt);
        prefillOpened = true;
      } catch {
        await copyOperation.catch(() => undefined);
        // A rejected prefill protocol falls through to copy + official web.
      }
      if (prefillOpened) {
        try {
          await copyOperation;
          setStatus({ kind: "prefill", message: formatProviderStatus(copy.providerPrepared, assistant.name) });
        } catch {
          setStatus({ kind: "error", message: copy.copyError });
        }
        return;
      }
    }

    try {
      await copyPromptAndOpenDestination(copy.prompt, assistant.launch.officialUrl);
      setStatus({ kind: "provider", message: formatProviderStatus(copy.providerCopied, assistant.name) });
    } catch {
      setStatus({ kind: "error", message: copy.copyError });
    }
  }

  return (
    <section id="ai-summary" aria-labelledby={headingId} className="min-w-0 rounded-[1.5rem] border border-[#35d0e5]/25 bg-[#061521]/85 p-5 shadow-[0_24px_70px_rgba(0,0,0,.24)] backdrop-blur-sm sm:p-6">
      <p className="font-mono text-[10px] font-black uppercase tracking-[0.24em] text-[#35d0e5]">{copy.eyebrow}</p>
      <h2 id={headingId} className="mt-3 break-words text-2xl font-black leading-tight tracking-[-0.025em] text-white">{copy.headline}</h2>
      <p className="mt-3 text-sm leading-6 text-slate-300">{copy.description}</p>

      <p className="mt-5 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">{copy.assistantLabel}</p>
      <ul aria-label={copy.assistantLabel} className="mt-3 flex min-w-0 flex-wrap gap-2">
        {assistants.map((assistant) => (
          <li key={assistant.id} data-ai-provider={assistant.id} className="max-w-full">
            <button
              type="button"
              aria-label={assistant.name}
              aria-describedby={statusId}
              onClick={() => void launchAssistant(assistant)}
              className="inline-flex min-h-8 max-w-full items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-2.5 py-1.5 text-xs font-bold text-slate-300 transition hover:border-[#35d0e5]/45 hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35d0e5] focus-visible:ring-offset-2 focus-visible:ring-offset-[#061521] motion-reduce:transition-none"
            >
              {"logo" in assistant && assistant.logo ? (
                <span aria-hidden="true" className="flex size-5 shrink-0 items-center justify-center">
                  <Image
                    src={assistant.logo.src}
                    alt=""
                    width={assistant.logo.width}
                    height={assistant.logo.height}
                    unoptimized
                    className="max-h-5 max-w-5 object-contain"
                  />
                </span>
              ) : null}
              <span className="min-w-0 break-words">{assistant.name}</span>
            </button>
          </li>
        ))}
      </ul>

      <details className="group mt-5 min-w-0 rounded-2xl border border-white/10 bg-black/20 p-4">
        <summary className="min-h-6 cursor-pointer list-none font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#ffad63] marker:hidden">
          {copy.promptLabel} <span aria-hidden="true" className="ml-1 inline-block transition group-open:rotate-45 motion-reduce:transition-none">+</span>
        </summary>
        <p id={promptId} className="mt-3 select-text break-words text-sm leading-6 text-slate-300">{copy.prompt}</p>
      </details>

      <div className="mt-4 flex min-w-0 flex-col items-start gap-2 sm:flex-row sm:items-center">
        <button type="button" onClick={() => void copyPrompt()} aria-describedby={statusId} className="inline-flex min-h-11 max-w-full items-center justify-center rounded-full bg-[#35d0e5] px-5 py-2.5 text-sm font-black text-[#041018] transition hover:bg-[#73e3f1] motion-reduce:transition-none">
          {status.kind === "copied" ? copy.copied : copy.copyAction}
        </button>
        <p id={statusId} role="status" aria-live="polite" aria-atomic="true" className={`min-h-5 text-xs leading-5 ${status.kind === "error" ? "text-[#ffad63]" : "text-emerald-300"}`}>
          {status.message}
        </p>
      </div>
    </section>
  );
}
