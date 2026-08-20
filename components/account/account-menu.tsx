"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { startTransition, useCallback, useEffect, useRef, useState } from "react";

import { logoutAction, refreshAccountStateAction } from "@/app/account/actions";
import { useLocale, useLocalizedHref } from "@/components/i18n/locale-context";
import { getGlobalDictionary } from "@/data/i18n/global";
import { accountTitles } from "@/data/i18n/account";
import type { AccountState } from "@/lib/account/state";
import { stripLocalePrefix } from "@/lib/i18n/routing";

type AccountMenuProps = {
  initialState: AccountState;
  mobile?: boolean;
  active?: boolean;
  open?: boolean;
  setOpen?: (open: boolean) => void;
  onNavigate?: () => void;
  onOpening?: () => void;
};

function AccountContents({
  account,
  mobile,
  onNavigate,
}: {
  account: AccountState;
  mobile: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const locale = useLocale();
  const href = useLocalizedHref();
  const copy = getGlobalDictionary(locale);
  const articleMatch = stripLocalePrefix(pathname).match(/^\/writing\/([a-z0-9]+(?:-[a-z0-9]+)*)$/u);
  const itemClass = mobile
    ? "flex min-h-11 w-full items-center rounded-xl px-3 py-2 text-left font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white focus-visible:outline-2 focus-visible:outline-[#35d0e5]"
    : "flex min-h-11 w-full items-center rounded-xl px-4 py-2.5 text-left text-sm font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white focus-visible:outline-2 focus-visible:outline-[#35d0e5]";

  if (account.kind === "anonymous") {
    return <Link className={itemClass} href={href("/account/login")} onClick={onNavigate}>{copy.account.login}</Link>;
  }

  return (
    <>
      {account.kind === "admin" ? (
        <div className="border-b border-white/10 pb-2">
          <p className="px-4 pb-1 pt-2 font-mono text-[10px] font-black uppercase tracking-[0.2em] text-[#35d0e5]">BTS Studio</p>
          {account.aal === "aal1" ? (
            <Link className={itemClass} href="/admin/mfa" onClick={onNavigate}>{copy.account.verifyStudio}</Link>
          ) : (
            <>
              {articleMatch ? <Link className={`${itemClass} text-[#35d0e5]`} href={`/admin/writing/by-slug/${articleMatch[1]}`} onClick={onNavigate}>{copy.account.editArticle}</Link> : null}
              <Link className={itemClass} href="/admin" onClick={onNavigate}>BTS Studio</Link>
              <Link className={itemClass} href="/admin/writing" onClick={onNavigate}>Writing</Link>
              <Link className={itemClass} href="/admin/echowall" onClick={onNavigate}>{copy.account.echoWallModeration}</Link>
            </>
          )}
        </div>
      ) : null}
      <form action={logoutAction} className="pt-2">
        <button className={itemClass}>{copy.account.logout}</button>
      </form>
    </>
  );
}

export function AccountMenu({
  initialState,
  mobile = false,
  active = false,
  open = false,
  setOpen,
  onNavigate,
  onOpening,
}: AccountMenuProps) {
  const locale = useLocale();
  const copy = getGlobalDictionary(locale);
  const [account, setAccount] = useState(initialState);
  const wrapper = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const wasActive = useRef(false);

  const refreshState = useCallback(() => {
    setAccount((current) => current.kind === "anonymous" ? current : { kind: "authenticated" });
    startTransition(async () => {
      try {
        setAccount(await refreshAccountStateAction());
      } catch {
        setAccount({ kind: "anonymous" });
      }
    });
  }, []);

  const close = useCallback((returnFocus = false) => {
    setOpen?.(false);
    if (returnFocus) window.requestAnimationFrame(() => trigger.current?.focus());
  }, [setOpen]);

  useEffect(() => {
    if (!mobile || !active || wasActive.current) {
      wasActive.current = active;
      return;
    }
    wasActive.current = true;
    refreshState();
  }, [active, mobile, refreshState]);

  useEffect(() => {
    if (mobile || !open) return;
    menu.current?.querySelector<HTMLElement>("a[href], button:not([disabled])")?.focus();

    const handlePointerDown = (event: PointerEvent) => {
      if (!wrapper.current?.contains(event.target as Node)) close();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      close(true);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [close, mobile, open]);

  if (mobile) {
    return (
      <section aria-labelledby="mobile-account-title" className="mt-6 border-t border-white/10 pt-6">
        <p id="mobile-account-title" className="px-3 font-mono text-xs font-black uppercase tracking-[0.25em] text-[#35d0e5]">{accountTitles[locale]}</p>
        <div className="mt-3 grid gap-1">
          <AccountContents account={account} mobile onNavigate={onNavigate} />
        </div>
      </section>
    );
  }

  return (
    <div ref={wrapper} className="relative hidden lg:block">
      <button
        ref={trigger}
        type="button"
        className="grid h-10 w-10 place-items-center rounded-full border border-white/15 text-[#35d0e5] transition hover:border-[#35d0e5]/50 hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#35d0e5]"
        aria-label={copy.accountMenuOpen}
        aria-expanded={open}
        aria-controls="desktop-account-menu"
        onClick={() => {
          if (open) {
            close();
            return;
          }
          onOpening?.();
          refreshState();
          setOpen?.(true);
        }}
      >
        <span aria-hidden="true" className="relative block h-5 w-5 rounded-full border border-current before:absolute before:left-1/2 before:top-1 before:h-1.5 before:w-1.5 before:-translate-x-1/2 before:rounded-full before:bg-current after:absolute after:bottom-1 after:left-1/2 after:h-1.5 after:w-3 after:-translate-x-1/2 after:rounded-t-full after:border-x after:border-t after:border-current" />
      </button>
      <div
        ref={menu}
        id="desktop-account-menu"
        hidden={!open}
        className="absolute right-0 top-full mt-3 w-64 rounded-2xl border border-white/10 bg-[#071824]/95 p-2 shadow-2xl backdrop-blur-xl"
      >
        <p className="px-4 pb-2 pt-2 text-sm font-black text-white">{accountTitles[locale]}</p>
        <AccountContents account={account} mobile={false} onNavigate={() => close()} />
      </div>
    </div>
  );
}
