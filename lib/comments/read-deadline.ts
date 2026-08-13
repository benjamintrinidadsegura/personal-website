export const COMMENTS_READ_TIMEOUT_MS = 2_500;

export async function withCommentsReadDeadline<T, F>(
  read: (signal: AbortSignal) => Promise<T>,
  fallback: F,
  timeoutMs = COMMENTS_READ_TIMEOUT_MS,
): Promise<T | F> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new Error("WRITING_COMMENTS_READ_TIMEOUT"));
    }, timeoutMs);
  });

  try {
    return await Promise.race([read(controller.signal), timeout]);
  } catch {
    return fallback;
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}
