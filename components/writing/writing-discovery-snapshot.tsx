"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useDiscovery } from "@/components/discovery/discovery-context";
import type { DiscoveryItem } from "@/types/discovery";
import type { PublicWritingSummary } from "@/types/writing";
import type { Locale } from "@/lib/i18n/config";

/** Enrich an already interactive provider without remounting search or resetting its state. */
export function WritingDiscoverySnapshot({ locale, items, status, latest, retryable }: {
  locale: Locale; items: DiscoveryItem[]; status: "data" | "unavailable"; latest?: PublicWritingSummary; retryable: boolean;
}) {
  const { setWritingSnapshot } = useDiscovery();
  const router = useRouter();
  const pathname = usePathname();
  const attempted = useRef<string | null>(null);
  useEffect(() => { setWritingSnapshot({ locale, items, status, latest }); }, [locale, items, status, latest, setWritingSnapshot]);
  useEffect(() => {
    const key = `${locale}:${pathname}`;
    if (status !== "unavailable" || !retryable || attempted.current === key) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      if (document.visibilityState !== "visible" || timer !== undefined || attempted.current === key) return;
      timer = setTimeout(() => {
        timer = undefined;
        if (document.visibilityState !== "visible") return;
        attempted.current = key;
        router.refresh();
      }, 1000);
    };
    document.addEventListener("visibilitychange", schedule);
    schedule();
    return () => { if (timer !== undefined) clearTimeout(timer); document.removeEventListener("visibilitychange", schedule); };
  }, [locale, pathname, retryable, router, status]);
  return null;
}
