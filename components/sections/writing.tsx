import Link from "next/link";
import { writingEntries } from "@/data/writing";
import { getHomeCopy } from "@/data/i18n/home";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { getPublishedWriting } from "@/lib/writing/queries";
import type { PublicWritingSummary } from "@/types/writing";
import { localizeHref } from "@/lib/i18n/routing";
import { getLocale } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n/config";

type HomeWritingPlaceholder = { title: string; excerpt: string; category: string; state: string };

const placeholdersByLocale: Record<Locale, readonly HomeWritingPlaceholder[]> = {
  de: writingEntries,
  en: [{ title: "Passion", excerpt: "Why people should not permanently lose their talents in work that leaves them unfulfilled.", category: "Work & Potential", state: "Coming to bts.online" }, { title: "Acceptance", excerpt: "Thoughts on ADHD, overthinking, self-understanding and living with your own story.", category: "Identity & Development", state: "Coming to bts.online" }, { title: "Starting before you are ready", excerpt: "Why progress often begins when we stop waiting for the perfect moment.", category: "Building in Public", state: "Coming to bts.online" }],
  es: [{ title: "Pasión", excerpt: "Por qué nadie debería perder su talento durante años en un trabajo que no le aporta sentido.", category: "Trabajo y potencial", state: "Próximamente en bts.online" }, { title: "Aceptar", excerpt: "Reflexiones sobre TDAH, sobrepensar, comprenderse y convivir con la propia historia.", category: "Identidad y desarrollo", state: "Próximamente en bts.online" }, { title: "Empezar antes de estar listo", excerpt: "Por qué el progreso suele comenzar cuando dejamos de esperar el momento perfecto.", category: "Desarrollo abierto", state: "Próximamente en bts.online" }],
  tr: [{ title: "Tutku", excerpt: "İnsanların yeteneklerini kendilerini tatmin etmeyen bir işte kalıcı olarak kaybetmemesi üzerine.", category: "İş ve potansiyel", state: "Yakında bts.online’da" }, { title: "Kabul", excerpt: "DEHB, fazla düşünme, kendini anlama ve kendi hikâyenle yaşama üzerine düşünceler.", category: "Kimlik ve gelişim", state: "Yakında bts.online’da" }, { title: "Hazır olmadan başlamak", excerpt: "İlerlemenin neden çoğu zaman kusursuz anı beklemeyi bıraktığımızda başladığı üzerine.", category: "Açık geliştirme", state: "Yakında bts.online’da" }],
  pl: [{ title: "Pasja", excerpt: "Dlaczego ludzie nie powinni na stałe tracić talentów w pracy, która nie daje im spełnienia.", category: "Praca i potencjał", state: "Wkrótce na bts.online" }, { title: "Akceptacja", excerpt: "Myśli o ADHD, nadmiernym analizowaniu, rozumieniu siebie i życiu z własną historią.", category: "Tożsamość i rozwój", state: "Wkrótce na bts.online" }, { title: "Zacząć, zanim będziesz gotowy", excerpt: "Dlaczego postęp często zaczyna się, gdy przestajemy czekać na idealny moment.", category: "Budowanie publicznie", state: "Wkrótce na bts.online" }],
  el: [{ title: "Πάθος", excerpt: "Γιατί οι άνθρωποι δεν πρέπει να χάνουν τα ταλέντα τους σε δουλειά που δεν τους γεμίζει.", category: "Εργασία και δυνατότητες", state: "Σύντομα στο bts.online" }, { title: "Αποδοχή", excerpt: "Σκέψεις για ΔΕΠΥ, υπερανάλυση, αυτοκατανόηση και ζωή με τη δική μας ιστορία.", category: "Ταυτότητα και εξέλιξη", state: "Σύντομα στο bts.online" }, { title: "Να ξεκινάς πριν είσαι έτοιμος", excerpt: "Γιατί η πρόοδος συχνά αρχίζει όταν σταματάμε να περιμένουμε την τέλεια στιγμή.", category: "Ανοιχτή ανάπτυξη", state: "Σύντομα στο bts.online" }],
  ru: [{ title: "Увлечённость", excerpt: "Почему людям не стоит надолго терять свои таланты в работе, которая не приносит удовлетворения.", category: "Работа и потенциал", state: "Скоро на bts.online" }, { title: "Принятие", excerpt: "Размышления о СДВГ, избыточном анализе, понимании себя и жизни со своей историей.", category: "Идентичность и развитие", state: "Скоро на bts.online" }, { title: "Начать до полной готовности", excerpt: "Почему движение часто начинается, когда мы перестаём ждать идеального момента.", category: "Открытая разработка", state: "Скоро на bts.online" }],
};

export async function Writing({ publishedWriting }: { publishedWriting?: readonly PublicWritingSummary[] }) {
  const locale = await getLocale();
  const copy = getHomeCopy(locale).writing;
  const published = (publishedWriting ?? await getPublishedWriting()).slice(0, 3);
  const placeholders = placeholdersByLocale[locale];
  return (
    <section id="writing" aria-labelledby="writing-title" className="border-t border-white/10 bg-[#081a28] px-5 py-24 sm:px-8 sm:py-32">
      <Reveal className="mx-auto max-w-[90rem]">
        <div id="writing-title"><SectionHeading eyebrow={copy.eyebrow} title={copy.title} description={copy.description} /></div>
        <div className="mt-16 border-t border-white/15">
          {(published.length ? published : placeholders).map((entry, index) => {
            const isPublished = "slug" in entry;
            const content = <article className="group grid gap-5 border-b border-white/15 py-9 transition hover:bg-white/[0.025] sm:px-4 lg:grid-cols-[5rem_0.65fr_1.1fr_0.45fr] lg:items-center">
              <span className="font-mono text-sm text-[#35d0e5]">0{index + 1}</span>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#ff9a3d]">{isPublished ? `${entry.contentType} · ${entry.topics.join(" · ")}` : entry.category}</p>
              <div><h3 className="text-2xl font-black text-white sm:text-3xl">{entry.title}</h3><p className="mt-3 max-w-2xl leading-7 text-slate-300">{entry.excerpt}</p></div>
              <div className="lg:text-right"><span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">{isPublished ? copy.readingTime(entry.readingMinutes) : entry.state}</span><p className="mt-3 font-bold text-[#35d0e5]">{isPublished ? copy.read : copy.preview} <span aria-hidden="true">→</span></p></div>
            </article>;
            return isPublished ? <Link key={entry.id} href={localizeHref(`/writing/${entry.slug}`, locale)} className="block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#35d0e5]">{content}</Link> : <div key={entry.title}>{content}</div>;
          })}
        </div>
        <Link href={localizeHref("/writing", locale)} className="mt-10 inline-flex min-h-11 items-center rounded-full border border-white/20 px-6 font-black text-white transition hover:border-[#35d0e5]">{copy.explore} →</Link>
      </Reveal>
    </section>
  );
}
