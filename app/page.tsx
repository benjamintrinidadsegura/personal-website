import { ContextCanvas } from "@/components/discovery/context-canvas";
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

export const revalidate = 300;

export default async function Home() {
  const publishedWritingResult = await getPublishedWritingResult();
  const publishedWriting = publishedWritingResult.data;
  return (
    <ContextCanvas>
      <Hero />
      <HomeQuote dateKey={new Date().toISOString().slice(0, 10)} />
      <HqPulse publishedWriting={publishedWriting} />
      <CurrentlyBuilding />
      <Writing publishedWriting={publishedWriting} publishedWritingStatus={publishedWritingResult.status} />
      <Interviews />
      <EchoWallPreview />
      <About />
      <Feedback />
      <Contact />
    </ContextCanvas>
  );
}
