"use client";

import { usePathname } from "next/navigation";

import { getGlobalDictionary } from "@/data/i18n/global";
import { getWritingTranslationSlug } from "@/data/writing-localization";
import { localeDetails, locales } from "@/lib/i18n/config";
import { getLanguageSwitchTarget, getLocalizedPathname, stripLocalePrefix } from "@/lib/i18n/routing";
import { useLocale } from "@/components/i18n/locale-context";
import { startNavigationFeedback } from "@/components/navigation/navigation-feedback";

export function LanguageSwitcher({ mobile = false, onNavigate }: { mobile?: boolean; onNavigate?: () => void }) {
  const locale = useLocale();
  const pathname = usePathname();
  const copy = getGlobalDictionary(locale);
  const switchTarget = (candidate: (typeof locales)[number]) => {
    const unprefixed = stripLocalePrefix(pathname);
    const writingMatch = unprefixed.match(/^\/writing\/([^/]+)$/u);
    if (writingMatch) {
      const translationSlug = getWritingTranslationSlug(writingMatch[1], candidate);
      if (translationSlug) return getLocalizedPathname(`/writing/${translationSlug}`, candidate);
    }
    return getLanguageSwitchTarget(pathname, candidate);
  };

  return (
    <nav aria-label={copy.languageNavigation} className={mobile ? "mt-6 border-t border-white/10 px-3 pt-6" : "hidden shrink-0 lg:block"}>
      <label className="sr-only" htmlFor={mobile ? "mobile-language-selector" : "desktop-language-selector"}>{copy.languageNavigation}</label>
      <select
        id={mobile ? "mobile-language-selector" : "desktop-language-selector"}
        value={locale}
        aria-label={copy.languageNavigation}
        onChange={(event) => {
          const candidate = event.currentTarget.value as (typeof locales)[number];
          startNavigationFeedback();
          onNavigate?.();
          window.location.assign(`${switchTarget(candidate)}${window.location.search}${window.location.hash}`);
        }}
        className={`max-w-full cursor-pointer rounded-full border border-white/15 bg-[#061521] px-3 font-mono text-xs font-black text-white transition hover:border-[#35d0e5]/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#35d0e5] ${mobile ? "min-h-11 w-full" : "min-h-9 w-[8.75rem]"}`}
      >
        {locales.map((candidate) => (
          <option key={candidate} value={candidate} lang={localeDetails[candidate].htmlLang}>
            {localeDetails[candidate].languageName}
          </option>
        ))}
      </select>
    </nav>
  );
}
