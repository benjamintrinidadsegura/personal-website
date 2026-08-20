import Link from "next/link";

import { EchoList } from "@/components/echowall/echo-list";
import { SectionHeading } from "@/components/ui/section-heading";
import { getApprovedEchoes } from "@/lib/echowall/queries";
import { getHomeCopy } from "@/data/i18n/home";
import { localizeHref } from "@/lib/i18n/routing";
import { getLocale } from "@/lib/i18n/server";

export async function EchoWallPreview() {
  const [result, locale] = await Promise.all([getApprovedEchoes(3), getLocale()]);
  const copy = getHomeCopy(locale).echo;

  return (
    <section id="echowall" aria-labelledby="echowall-preview-title" className="section-lines border-t border-white/10 px-5 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-[90rem]">
        <div id="echowall-preview-title">
          <SectionHeading
            eyebrow={copy.eyebrow}
            title={copy.title}
            description={copy.description}
          />
        </div>

        {result.status === "data" ? (
          <div className="mt-14"><EchoList echoes={result.echoes} variant="preview" /></div>
        ) : result.status === "empty" ? (
          <div className="mt-14 border-l-2 border-[#35d0e5] bg-white/[0.025] p-7 sm:p-9">
            <h3 className="text-2xl font-black text-white">{copy.emptyTitle}</h3>
            <p className="mt-4 max-w-2xl leading-7 text-slate-300">{copy.emptyDescription}</p>
          </div>
        ) : (
          <div className="mt-14 border-l-2 border-[#ff9a3d] bg-[#ff9a3d]/[0.035] p-7 sm:p-9">
            <h3 className="text-2xl font-black text-white">{copy.unavailableTitle}</h3>
            <p className="mt-4 max-w-2xl leading-7 text-slate-300">{copy.unavailableDescription}</p>
          </div>
        )}

        <div className="mt-10 flex flex-wrap gap-4">
          <Link href={localizeHref("/echowall", locale)} className="inline-flex min-h-11 items-center rounded-full bg-[#35d0e5] px-6 py-3 font-black text-[#041018] transition hover:-translate-y-0.5 hover:bg-[#73e3f1] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#35d0e5] motion-reduce:transform-none">{copy.explore} <span aria-hidden="true" className="ml-2">→</span></Link>
          <Link href={localizeHref("/echowall#leave-an-echo", locale)} className="inline-flex min-h-11 items-center rounded-full border border-white/20 px-6 py-3 font-black text-white transition hover:border-[#ff9a3d] hover:text-[#ffb36d] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ff9a3d]">{copy.leave}</Link>
        </div>
      </div>
    </section>
  );
}
