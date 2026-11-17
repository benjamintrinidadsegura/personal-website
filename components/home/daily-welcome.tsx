"use client";

import Link from "next/link";
import { useDiscovery } from "@/components/discovery/discovery-context";
import { useCallback, useLayoutEffect, useRef, useSyncExternalStore } from "react";
import { useLocale } from "@/components/i18n/locale-context";
import { QuoteExperience } from "@/components/quotes/quote-experience";
import { adaptiveHomeCopy } from "@/data/i18n/adaptive-home";
import { welcomeGate } from "@/lib/home-welcome";
import { localizeHref } from "@/lib/i18n/routing";
import { acquireScrollLock } from "@/lib/scroll-lock";
import type { PublicWritingSummary } from "@/types/writing";
import styles from "./daily-welcome.module.css";

const eventName = "btshq:welcome-change";
const storage = () => window.localStorage;
const subscribe = (listener: () => void) => {
  window.addEventListener(eventName, listener); window.addEventListener("storage", listener); window.addEventListener("hashchange", listener);
  return () => { window.removeEventListener(eventName, listener); window.removeEventListener("storage", listener); window.removeEventListener("hashchange", listener); };
};
const snapshot = () => welcomeGate.visible(storage, window.location.hash);
const serverSnapshot = () => false;

/** One compact native modal; sharing keeps its own nested native dialog. */
export function DailyWelcome({ dateKey, article: suppliedArticle }: { dateKey: string; article?: PublicWritingSummary }) {
  const { latestWriting } = useDiscovery();
  const article = suppliedArticle ?? latestWriting;
  const locale = useLocale(), copy = adaptiveHomeCopy[locale];
  const visible = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const panel = useRef<HTMLDialogElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const dismiss = useCallback((restore = true) => {
    const ownedFocus = panel.current?.contains(document.activeElement);
    if (panel.current?.open) panel.current.close();
    welcomeGate.dismiss(storage);
    window.dispatchEvent(new Event(eventName));
    if (restore && ownedFocus) {
      const previous = previousFocus.current;
      const target = previous?.isConnected && previous !== document.body ? previous
        : document.querySelector<HTMLInputElement>("#home-view-explore:checked") ?? document.getElementById("universe-search");
      target?.focus({ preventScroll: true });
    }
  }, []);
  useLayoutEffect(() => {
    const dialog = panel.current;
    if (!visible || !dialog) return;
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const releaseScroll = acquireScrollLock();
    dialog.showModal();
    return () => { if (dialog.open) dialog.close(); releaseScroll(); };
  }, [visible]);
  if (!visible) return null;
  return <dialog ref={panel} aria-modal="true" aria-labelledby="welcome-title" className={styles.welcome} data-daily-welcome
    onCancel={event => { if (event.target === event.currentTarget && !event.defaultPrevented) { event.preventDefault(); dismiss(); } }}>
    <header className={styles.header}><h2 id="welcome-title">{copy.welcome}</h2><button type="button" aria-label={copy.close} onClick={() => dismiss()}>×</button></header>
    <div className={styles.body}>
      <QuoteExperience key={locale + dateKey} context={{ surface:"daily", dateKey }} variant="daily" presentation="compact" description="" safeSharePath="/" />
      <nav aria-labelledby="welcome-next" className={styles.next}><h3 id="welcome-next">{copy.next}</h3><ul>
        {article ? <li><Link href={localizeHref(`/writing/${article.slug}`, article.language)} onClick={() => dismiss(false)}><small>{copy.latest}</small><strong lang={article.language}>{article.title}</strong><span lang={article.language}>{article.excerpt}</span><span aria-hidden="true">↗</span></Link></li> : null}
        <li><Link href={localizeHref("/find-your-next-step", locale)} onClick={() => dismiss(false)}><strong>Find Your Next Step</strong><span>{copy.fyns}</span><span aria-hidden="true">↗</span></Link></li>
        <li><Link href={localizeHref("/life-alignment", locale)} onClick={() => dismiss(false)}><strong>Life Alignment</strong><span>{copy.alignment}</span><span aria-hidden="true">↗</span></Link></li>
      </ul></nav>
    </div>
    <footer className={styles.footer}><button type="button" onClick={() => dismiss()}>{copy.thanks} <span aria-hidden="true">↗</span></button></footer>
  </dialog>;
}
