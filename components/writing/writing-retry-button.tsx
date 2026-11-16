"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { writingRecoveryCopy } from "@/data/i18n/writing-recovery";
import type { Locale } from "@/lib/i18n/config";

export function WritingRetryButton({ locale, reset }: { locale: Locale; reset?: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const copy = writingRecoveryCopy[locale];
  return <button type="button" disabled={pending} aria-busy={pending} onClick={() => startTransition(() => { router.refresh(); reset?.(); })}
    className="mt-6 inline-flex min-h-11 items-center rounded-full border border-[#35d0e5]/60 px-5 py-2 text-sm font-bold text-[#8eeaf5] hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#35d0e5] disabled:opacity-60">
    {pending ? copy.retrying : copy.retry}
  </button>;
}
