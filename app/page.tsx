import { HomeViews } from "@/components/home/home-views";
import { DiscoverHome } from "@/components/home/discover-home";
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
import { getPublishedWritingResult } from "@/lib/writing/queries";
import { getLocale } from "@/lib/i18n/server";
import { homeViewBootstrap } from "@/lib/home-view";

export const revalidate = 300;

export default async function Home() {
  const locale = await getLocale();
  const publishedWritingResult = await getPublishedWritingResult(locale, { consumer: "home" });
  const publishedWriting = publishedWritingResult.data;
  const dateKey = new Date().toISOString().slice(0, 10);
  return (
    <HomeViews bootstrap={<script dangerouslySetInnerHTML={{ __html: homeViewBootstrap }} />}
      discover={<DiscoverHome locale={locale} publishedWritingResult={publishedWritingResult} dateKey={dateKey} />}
      explore={<>
      <Hero anchorId="explore-home" />
      <HomeQuote dateKey={dateKey} />
      <HqPulse publishedWriting={publishedWriting} />
      <CurrentlyBuilding />
      <Writing publishedWriting={publishedWriting} publishedWritingStatus={publishedWritingResult.status} />
      <Interviews />
      <EchoWallPreview />
      <About />
      <Feedback />
      <Contact />
    </>} />
  );
}
