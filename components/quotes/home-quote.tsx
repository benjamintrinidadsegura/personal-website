import { QuoteExperience } from "@/components/quotes/quote-experience";

export function HomeQuote({ dateKey }: { dateKey: string }) {
  return (
    <div className="section-lines px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <QuoteExperience context={{ surface: "daily", dateKey }} variant="daily" safeSharePath="/" />
      </div>
    </div>
  );
}
