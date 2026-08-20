import { cache } from "react";
import { headers } from "next/headers";

import { defaultLocale, isLocale, localeHeaderName, type Locale } from "@/lib/i18n/config";

export const getLocale = cache(async (): Promise<Locale> => {
  const value = (await headers()).get(localeHeaderName);
  return isLocale(value) ? value : defaultLocale;
});
