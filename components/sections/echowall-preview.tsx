import Link from "next/link";

import { EchoList } from "@/components/echowall/echo-list";
import { SectionHeading } from "@/components/ui/section-heading";
import { getApprovedEchoes } from "@/lib/echowall/queries";

export async function EchoWallPreview() {
  const result = await getApprovedEchoes(3);

  return (
    <section id="echowall" aria-labelledby="echowall-preview-title" className="section-lines border-t border-white/10 px-5 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-[90rem]">
        <div id="echowall-preview-title">
          <SectionHeading
            eyebrow="EchoWall / Community Signal"
            title="Signals from the people around this HQ."
            description="Gedanken, Feedback, Reaktionen und Nachrichten — kuratiert, moderiert und mit Raum für die Menschen hinter dem Signal."
          />
        </div>

        {result.status === "data" ? (
          <div className="mt-14"><EchoList echoes={result.echoes} variant="preview" /></div>
        ) : result.status === "empty" ? (
          <div className="mt-14 border-l-2 border-[#35d0e5] bg-white/[0.025] p-7 sm:p-9">
            <h3 className="text-2xl font-black text-white">The wall is still quiet.</h3>
            <p className="mt-4 max-w-2xl leading-7 text-slate-300">Die ersten Echos werden gerade gesammelt und moderiert. Du kannst bereits eine Nachricht hinterlassen und Teil der entstehenden Community-Wand werden.</p>
          </div>
        ) : (
          <div className="mt-14 border-l-2 border-[#ff9a3d] bg-[#ff9a3d]/[0.035] p-7 sm:p-9">
            <h3 className="text-2xl font-black text-white">EchoWall is taking a short pause.</h3>
            <p className="mt-4 max-w-2xl leading-7 text-slate-300">Die öffentlichen Echos können gerade nicht geladen werden. Die EchoWall-Seite bleibt erreichbar.</p>
          </div>
        )}

        <div className="mt-10 flex flex-wrap gap-4">
          <Link href="/echowall" className="inline-flex min-h-11 items-center rounded-full bg-[#35d0e5] px-6 py-3 font-black text-[#041018] transition hover:-translate-y-0.5 hover:bg-[#73e3f1] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#35d0e5] motion-reduce:transform-none">Explore EchoWall <span aria-hidden="true" className="ml-2">→</span></Link>
          <Link href="/echowall#leave-an-echo" className="inline-flex min-h-11 items-center rounded-full border border-white/20 px-6 py-3 font-black text-white transition hover:border-[#ff9a3d] hover:text-[#ffb36d] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ff9a3d]">Leave an echo</Link>
        </div>
      </div>
    </section>
  );
}
