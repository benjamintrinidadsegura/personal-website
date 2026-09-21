import { QuoteExperience } from "@/components/quotes/quote-experience";

export function HomeQuote({ dateKey }: { dateKey: string }) {
  return (
    <div id="quote" className="home-quote-stage section-lines relative overflow-hidden px-5 py-20 sm:px-8 sm:py-28">
      <div aria-hidden="true" className="home-quote-orbit" />
      <div className="relative mx-auto max-w-6xl">
        <QuoteExperience context={{ surface: "daily", dateKey }} variant="daily" safeSharePath="/" />
      </div>
    </div>
  );
}
