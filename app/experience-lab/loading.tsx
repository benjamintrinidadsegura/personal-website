import { getErrorDictionary } from "@/data/i18n/errors";
import { getLocale } from "@/lib/i18n/server";

/** Reserve the Lab viewport while the real server response streams. No timed reveal. */
export default async function LabLoading() {
  const locale = await getLocale();
  return <div role="status" data-navigation-loading
    className="mx-auto flex min-h-screen max-w-[90rem] items-start px-5 pt-32 font-mono text-sm text-slate-400 sm:px-8">
    {getErrorDictionary(locale).loading}
  </div>;
}
