export const PUBLIC_WRITING_READ_TIMEOUT_MS = 2_500;

export async function withPublicWritingReadDeadline<T, F>(
  read: (signal: AbortSignal) => Promise<T>,
  fallback: F,
  timeoutMs = PUBLIC_WRITING_READ_TIMEOUT_MS,
): Promise<T | F> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new Error("PUBLIC_WRITING_READ_TIMEOUT"));
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
