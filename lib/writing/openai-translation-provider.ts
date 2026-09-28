import "server-only";

import {
  DEFAULT_WRITING_TRANSLATION_MODEL,
  extractOpenAIResponseText,
  OPENAI_RESPONSES_ENDPOINT,
  resolveOpenAIWritingTranslation,
  WRITING_TRANSLATION_MAX_INPUT_BYTES,
} from "@/lib/writing/openai-translation-leaf-contract";
import type { OpenAIWritingTranslationRequestBody } from "@/lib/writing/openai-translation-leaf-contract";
import type {
  WritingTranslationFailureCode,
  WritingTranslationPayload,
  WritingTranslationProvider,
  WritingTranslationRequest,
} from "@/types/writing";

const REQUEST_TIMEOUT_MS = 90_000;
const MAX_ATTEMPTS = 2;

type Environment = Readonly<Record<string, string | undefined>>;

export class WritingTranslationProviderError extends Error {
  readonly code: WritingTranslationFailureCode;
  readonly transient: boolean;

  constructor(code: WritingTranslationFailureCode, transient = false) {
    super(`Writing translation failed (${code}).`);
    this.name = "WritingTranslationProviderError";
    this.code = code;
    this.transient = transient;
  }
}

export function writingTranslationProviderConfiguration(
  environment: Environment = process.env,
): { configured: boolean; model: typeof DEFAULT_WRITING_TRANSLATION_MODEL } {
  const model = environment.WRITING_TRANSLATION_MODEL?.trim() || DEFAULT_WRITING_TRANSLATION_MODEL;
  return {
    configured: Boolean(environment.OPENAI_API_KEY?.trim()) && model === DEFAULT_WRITING_TRANSLATION_MODEL,
    model: DEFAULT_WRITING_TRANSLATION_MODEL,
  };
}

function providerFailure(status: number): WritingTranslationProviderError {
  if (status === 429) return new WritingTranslationProviderError("rate_limit", true);
  if (status === 408 || status >= 500) return new WritingTranslationProviderError("timeout_network", true);
  return new WritingTranslationProviderError("authentication_provider");
}

async function retryDelay(attempt: number, signal: AbortSignal): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const cleanup = () => signal.removeEventListener("abort", stop);
    const stop = () => {
      clearTimeout(timer);
      cleanup();
      reject(new WritingTranslationProviderError("timeout_network", true));
    };
    const timer = setTimeout(() => {
      cleanup();
      resolve();
    }, attempt * 250);
    signal.addEventListener("abort", stop, { once: true });
    if (signal.aborted) stop();
  });
}

class OpenAIWritingTranslationProvider implements WritingTranslationProvider {
  readonly id = "openai-responses-gpt-6-luna";

  constructor(
    private readonly apiKey: string,
    private readonly fetchImplementation: typeof fetch = fetch,
  ) {}

  private async execute(
    body: OpenAIWritingTranslationRequestBody,
    signal: AbortSignal,
  ): Promise<string | null> {
    if (new TextEncoder().encode(JSON.stringify(body.input)).byteLength > WRITING_TRANSLATION_MAX_INPUT_BYTES) {
      throw new WritingTranslationProviderError("content_too_large");
    }

    let finalFailure = new WritingTranslationProviderError("timeout_network", true);
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      const controller = new AbortController();
      const abort = () => controller.abort();
      signal.addEventListener("abort", abort, { once: true });
      const timeout = setTimeout(abort, REQUEST_TIMEOUT_MS);
      try {
        const response = await this.fetchImplementation(OPENAI_RESPONSES_ENDPOINT, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        if (!response.ok) throw providerFailure(response.status);
        const raw: unknown = await response.json();
        return extractOpenAIResponseText(raw);
      } catch (error) {
        finalFailure = error instanceof WritingTranslationProviderError
          ? error
          : new WritingTranslationProviderError("timeout_network", true);
        if (!finalFailure.transient || attempt === MAX_ATTEMPTS || signal.aborted) throw finalFailure;
      } finally {
        clearTimeout(timeout);
        signal.removeEventListener("abort", abort);
      }
      await retryDelay(attempt, signal);
    }
    throw finalFailure;
  }

  async translate(request: WritingTranslationRequest, signal: AbortSignal): Promise<WritingTranslationPayload> {
    const translated = await resolveOpenAIWritingTranslation(
      request,
      (body) => this.execute(body, signal),
    );
    if (!translated) throw new WritingTranslationProviderError("invalid_structured_response");
    return translated;
  }
}

export function getWritingTranslationProvider(environment: Environment = process.env): WritingTranslationProvider | null {
  const configuration = writingTranslationProviderConfiguration(environment);
  const apiKey = environment.OPENAI_API_KEY?.trim();
  if (!configuration.configured || !apiKey) return null;
  return new OpenAIWritingTranslationProvider(apiKey);
}
