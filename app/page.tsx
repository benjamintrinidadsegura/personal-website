import "@/app/community.css";
import { CommunityNav } from "@/components/community/community-nav";
import { Suspense } from "react";
import { AdaptiveUniverse } from "@/components/home/universe/adaptive-universe";
import { DailyWelcome } from "@/components/home/daily-welcome";
import { HomeViews } from "@/components/home/home-views";
import { DiscoverHome, DiscoverWritingFeature } from "@/components/home/discover-home";
import { About } from "@/components/sections/about";
import { Contact } from "@/components/sections/contact";
import { CurrentlyBuilding } from "@/components/sections/currently-building";
import { EchoWallPreview } from "@/components/sections/echowall-preview";
import { Feedback } from "@/components/sections/feedback";
import { Hero } from "@/components/sections/hero";
import { HqPulse } from "@/components/sections/hq-pulse";
import { HomeQuote } from "@/components/quotes/home-quote";
import { Interviews } from "@/components/sections/interviews";
import { Writing } from "@/components/sections/writing";
import { getPublishedWritingResult, type PublishedWritingReadResult } from "@/lib/writing/queries";
import { getLocale } from "@/lib/i18n/server";
import { homeViewBootstrap } from "@/lib/home-view";
import { writingRecoveryCopy } from "@/data/i18n/writing-recovery";
import type { Locale } from "@/lib/i18n/config";

export const revalidate = 300;

type WritingRead = Promise<PublishedWritingReadResult>;
async function PublishedFeature({ read, locale }: { read: WritingRead; locale: Locale }) {
  return <DiscoverWritingFeature locale={locale} result={await read} />;
}
async function PublishedPulse({ read }: { read: WritingRead }) {
  return <HqPulse publishedWriting={(await read).data} />;
}
async function PublishedSection({ read }: { read: WritingRead }) {
  const result = await read;
  return <Writing publishedWriting={result.data} publishedWritingStatus={result.status} />;
}

export default async function Home() {
  const locale = await getLocale();
  const writingRead = getPublishedWritingResult(locale, { consumer: "home" });
  const dateKey = new Date().toISOString().slice(0, 10);
  return (
    <>
    <DailyWelcome dateKey={dateKey} />
    <HomeViews bootstrap={<script dangerouslySetInnerHTML={{ __html: homeViewBootstrap }} />}
      discover={<><AdaptiveUniverse /><DiscoverHome locale={locale} dateKey={dateKey} writingFeature={
        <Suspense fallback={<DiscoverWritingFeature locale={locale} />}><PublishedFeature read={writingRead} locale={locale} /></Suspense>
      } /><div className="mx-auto max-w-5xl px-5"><CommunityNav locale={locale} /></div></>}
      explore={<>
      <Hero anchorId="explore-home" />
      <HomeQuote dateKey={dateKey} />
      <Suspense fallback={<HqPulse publishedWriting={[]} />}><PublishedPulse read={writingRead} /></Suspense>
      <CurrentlyBuilding />
      <Suspense fallback={<section id="writing" aria-busy="true" className="px-5 py-20 sm:px-8"><p className="text-slate-300">{writingRecoveryCopy[locale].loadingTitle}</p></section>}><PublishedSection read={writingRead} /></Suspense>
      <Interviews />
      <div className="mx-auto max-w-5xl px-5"><CommunityNav locale={locale} /></div>
      <EchoWallPreview />
      <About />
      <Feedback />
      <Contact />
    </>} />
    </>
  );
}
