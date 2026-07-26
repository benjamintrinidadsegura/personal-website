import { About } from "@/components/sections/about";
import { Contact } from "@/components/sections/contact";
import { CurrentlyBuilding } from "@/components/sections/currently-building";
import { EchoWallPreview } from "@/components/sections/echowall-preview";
import { Hero } from "@/components/sections/hero";
import { HqPulse } from "@/components/sections/hq-pulse";
import { Interviews } from "@/components/sections/interviews";
import { Now } from "@/components/sections/now";
import { Writing } from "@/components/sections/writing";

export const revalidate = 300;

export default function Home() {
  return (
    <>
      <Hero />
      <Now />
      <HqPulse />
      <CurrentlyBuilding />
      <Writing />
      <Interviews />
      <EchoWallPreview />
      <About />
      <Contact />
    </>
  );
}
