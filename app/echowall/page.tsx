import type { Metadata } from "next";
import Link from "next/link";

import { EchoForm } from "@/components/echowall/echo-form";
import { EchoList } from "@/components/echowall/echo-list";
import { issueEchoFormToken } from "@/app/echowall/actions";
import { getApprovedEchoes } from "@/lib/echowall/queries";

const description = "Gedanken, Feedback, Reaktionen und Nachrichten aus der Community von bts.online – kuratiert und moderiert.";

export const metadata: Metadata = {
  title: "EchoWall | bts.online",
  description,
  alternates: { canonical: "/echowall" },
  openGraph: {
    type: "website",
    locale: "de_DE",
    url: "/echowall",
    siteName: "bts.online",
    title: "EchoWall | bts.online",
    description,
    images: [{ url: "/og.png", width: 1732, height: 909, alt: "Benjamin Trinidad Segura – Digital HQ" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "EchoWall | bts.online",
    description,
    images: ["/og.png"],
  },
};

export const dynamic = "force-dynamic";

export default async function EchoWallPage() {
  const [echoResult, formToken] = await Promise.all([
    getApprovedEchoes(50),
    issueEchoFormToken(),
  ]);

  return (
    <article className="relative overflow-hidden px-5 pb-24 pt-28 sm:px-8 sm:pt-36">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-[52rem] bg-[radial-gradient(circle_at_72%_18%,rgba(53,208,229,0.14),transparent_25rem),radial-gradient(circle_at_16%_34%,rgba(255,122,0,0.07),transparent_22rem)]" />
      <div className="relative mx-auto max-w-[90rem]">
        <nav aria-label="Breadcrumb" className="font-mono text-xs text-slate-400">
          <ol className="flex flex-wrap items-center gap-2">
            <li><Link href="/" className="transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#35d0e5]">Digital HQ</Link></li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-[#35d0e5]">EchoWall</li>
          </ol>
        </nav>

        <header className="grid min-h-[68svh] items-center gap-12 border-b border-white/15 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:py-24">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#35d0e5]">EchoWall / Community Signal</p>
            <h1 className="mt-7 text-[clamp(3.5rem,10vw,8.5rem)] font-black leading-[0.86] tracking-[-0.055em] text-white">Leave an<br />echo.</h1>
            <p className="mt-8 max-w-3xl text-xl font-black leading-snug text-white sm:text-3xl">Ein Ort für Gedanken, Feedback, Reaktionen und Nachrichten von Menschen, die bts.online besuchen und mitgestalten.</p>
          </div>
          <aside className="border-l border-[#ff9a3d] pl-7">
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#ff9a3d]">Moderated by design</p>
            <p className="mt-6 text-2xl font-black leading-snug text-white sm:text-3xl">Every signal is reviewed before it becomes public.</p>
            <p className="mt-6 leading-7 text-slate-400">Jedes Echo wird vor der Veröffentlichung geprüft. Beiträge erscheinen nicht unmittelbar öffentlich.</p>
          </aside>
        </header>

        <section aria-labelledby="public-wall-title" className="border-b border-white/15 py-20 sm:py-24">
          <div className="grid gap-8 lg:grid-cols-[0.38fr_1fr]">
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#35d0e5]">Public wall / curated</p>
            <div><h2 id="public-wall-title" className="text-4xl font-black text-white sm:text-6xl">Echoes worth carrying forward.</h2><p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">Hier erscheinen ausschließlich geprüfte und freigegebene Beiträge — in der Reihenfolge ihrer Veröffentlichung.</p></div>
          </div>

          {echoResult.status === "data" ? (
            <div className="mt-14"><EchoList echoes={echoResult.echoes} /></div>
          ) : echoResult.status === "empty" ? (
            <div className="mt-14 border-l-2 border-[#35d0e5] bg-white/[0.025] p-7 sm:p-10">
              <h3 className="text-3xl font-black text-white">The wall is still quiet.</h3>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">Die ersten Echos werden gerade gesammelt und moderiert. Du kannst bereits eine Nachricht hinterlassen und Teil der entstehenden Community-Wand werden.</p>
              <a href="#leave-an-echo" className="mt-7 inline-flex min-h-11 items-center rounded-full border border-[#35d0e5]/50 px-5 py-3 font-black text-white transition hover:border-[#35d0e5] hover:text-[#35d0e5] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#35d0e5]">Leave the first echo <span aria-hidden="true" className="ml-2">↓</span></a>
            </div>
          ) : (
            <div className="mt-14 border-l-2 border-[#ff9a3d] bg-[#ff9a3d]/[0.035] p-7 sm:p-10" role="status">
              <h3 className="text-3xl font-black text-white">The public wall is temporarily unavailable.</h3>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">Öffentliche Echos können gerade nicht geladen werden. Eine neue Nachricht kannst du weiterhin über das Formular einreichen.</p>
            </div>
          )}
        </section>

        <section id="leave-an-echo" aria-labelledby="form-title" className="scroll-mt-24 border-b border-white/15 py-20 sm:py-24">
          <div className="grid gap-12 lg:grid-cols-[0.38fr_1fr]">
            <div><p className="font-mono text-xs uppercase tracking-[0.22em] text-[#ff9a3d]">Leave a signal</p><p className="mt-5 max-w-xs leading-7 text-slate-400">Persönlich, respektvoll und bewusst kurz. Dein Echo wird nicht sofort veröffentlicht.</p></div>
            <div>
              <h2 id="form-title" className="text-4xl font-black text-white sm:text-6xl">Add your voice to the wall.</h2>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">Teile einen Gedanken, eine Reaktion, Feedback oder eine Nachricht. Alle Einreichungen werden vor einer möglichen Veröffentlichung moderiert.</p>
              <div className="mt-12"><EchoForm formToken={formToken} /></div>
            </div>
          </div>
        </section>

        <section aria-labelledby="privacy-note-title" className="grid gap-8 border-b border-white/15 py-14 lg:grid-cols-[0.38fr_1fr]">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#35d0e5]">Privacy / moderation</p>
          <div><h2 id="privacy-note-title" className="text-2xl font-black text-white">What happens after submission.</h2><p className="mt-4 max-w-3xl leading-7 text-slate-300">Dein Echo wird gespeichert und moderiert. Es erscheint nur nach einer Freigabe. Eine optionale E-Mail-Adresse bleibt privat. Eine spätere Löschung kann über die einmalige Löschreferenz oder eine verifizierte E-Mail-Adresse angefragt werden.</p></div>
        </section>

        <div className="mt-12">
          <Link href="/" className="inline-flex min-h-11 items-center rounded-full border border-white/15 px-5 py-3 font-bold text-slate-200 transition hover:border-[#35d0e5]/50 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#35d0e5]">← Back to Digital HQ</Link>
        </div>
      </div>
    </article>
  );
}
