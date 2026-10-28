export const PUBLIC_WRITING_READ_TIMEOUT_MS = 2_500;

export type PublicWritingReadFailure = { kind: "timeout" | "exception"; error: unknown };

export async function withPublicWritingReadDeadline<T, F>(
  read: (signal: AbortSignal) => Promise<T>,
  fallback: F,
  timeoutMs = PUBLIC_WRITING_READ_TIMEOUT_MS,
  onFailure?: (failure: PublicWritingReadFailure) => void,
): Promise<T | F> {
  const controller = new AbortController();
  let timedOut = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
      reject(new Error("PUBLIC_WRITING_READ_TIMEOUT"));
    }, timeoutMs);
  });

  try {
    return await Promise.race([read(controller.signal), timeout]);
  } catch (error) {
    try { onFailure?.({ kind: timedOut ? "timeout" : "exception", error }); } catch { /* Preserve the fallback if diagnostics fail. */ }
    return fallback;
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}
