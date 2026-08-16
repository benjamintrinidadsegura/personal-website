import { ContextCanvas } from "@/components/discovery/context-canvas";
import { About } from "@/components/sections/about";
import { Contact } from "@/components/sections/contact";
import { CurrentlyBuilding } from "@/components/sections/currently-building";
import { EchoWallPreview } from "@/components/sections/echowall-preview";
import { Hero } from "@/components/sections/hero";
import { HqPulse } from "@/components/sections/hq-pulse";
import { Interviews } from "@/components/sections/interviews";
import { Now } from "@/components/sections/now";
import { Writing } from "@/components/sections/writing";
import { getPublishedWriting } from "@/lib/writing/queries";

export const revalidate = 300;

export default async function Home() {
  const publishedWriting = await getPublishedWriting();
  return (
    <ContextCanvas>
      <Hero />
      <Now />
      <HqPulse publishedWriting={publishedWriting} />
      <CurrentlyBuilding />
      <Writing publishedWriting={publishedWriting} />
      <Interviews />
      <EchoWallPreview />
      <About />
      <Contact />
    </ContextCanvas>
  );
}
