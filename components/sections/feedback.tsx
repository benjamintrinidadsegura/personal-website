import { issueFeedbackFormToken } from "@/app/feedback/actions";
import { FeedbackForm } from "@/components/feedback/feedback-form";
import { getFeedbackCopy } from "@/data/i18n/feedback";
import { getLocale } from "@/lib/i18n/server";

export async function Feedback() {
  const locale = await getLocale();
  const copy = getFeedbackCopy(locale);
  const formToken = await issueFeedbackFormToken();

  return (
    <section id="feedback" aria-labelledby="feedback-title" className="scroll-mt-24 border-t border-white/10 bg-[#05131f] px-5 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto grid max-w-[90rem] gap-10 lg:grid-cols-[0.58fr_1fr] lg:gap-16">
        <header className="lg:sticky lg:top-32 lg:self-start">
          <p className="font-mono text-xs font-black uppercase tracking-[0.3em] text-[#ff9a3d]">{copy.eyebrow}</p>
          <h2 id="feedback-title" className="mt-6 max-w-xl text-5xl font-black leading-[0.96] tracking-[-0.04em] text-white sm:text-7xl">{copy.title}</h2>
          <p className="mt-7 max-w-xl text-lg leading-8 text-slate-300">{copy.introduction}</p>
        </header>
        <FeedbackForm formToken={formToken} copy={copy} />
      </div>
    </section>
  );
}
