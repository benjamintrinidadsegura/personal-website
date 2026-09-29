import type { Locale } from "@/lib/i18n/config";
import { PUBLIC_CANONICAL_SOURCE_URL } from "@/data/site";

export type AiSummaryCopy = {
  eyebrow: string;
  headline: string;
  description: string;
  assistantLabel: string;
  promptLabel: string;
  prompt: string;
  copyAction: string;
  copied: string;
  providerCopied: string;
  providerPrepared: string;
  copyError: string;
  otherAssistant: string;
};

export type AiSummaryAssistantLaunch =
  | { kind: "copy-open"; officialUrl: string }
  | {
    kind: "prefill";
    officialUrl: string;
    prefill: {
      baseUrl: string;
      promptParameter: "q";
      platform: "desktop";
    };
  };

export type AiSummaryAssistant = {
  id: string;
  name: string;
  launch: AiSummaryAssistantLaunch;
  logo?: {
    src: string;
    width: number;
    height: number;
  };
};

export const aiSummaryAssistants = Object.freeze([
  { id: "openai", name: "ChatGPT", launch: { kind: "copy-open", officialUrl: "https://chatgpt.com/" }, logo: { src: "/brand/ai/openai.svg", width: 24, height: 24 } },
  { id: "claude", name: "Claude", launch: { kind: "prefill", officialUrl: "https://claude.ai/new", prefill: { baseUrl: "claude://claude.ai/new", promptParameter: "q", platform: "desktop" } }, logo: { src: "/brand/ai/claude.ico", width: 32, height: 32 } },
  { id: "gemini", name: "Gemini", launch: { kind: "copy-open", officialUrl: "https://gemini.google.com/app" }, logo: { src: "/brand/ai/gemini.png", width: 512, height: 512 } },
  { id: "perplexity", name: "Perplexity", launch: { kind: "copy-open", officialUrl: "https://www.perplexity.ai/" }, logo: { src: "/brand/ai/perplexity.ico", width: 32, height: 32 } },
  { id: "microsoft-copilot", name: "Microsoft Copilot", launch: { kind: "copy-open", officialUrl: "https://copilot.microsoft.com/" }, logo: { src: "/brand/ai/microsoft-copilot.svg", width: 120, height: 120 } },
  { id: "grok", name: "Grok", launch: { kind: "copy-open", officialUrl: "https://grok.com/" }, logo: { src: "/brand/ai/grok.svg", width: 512, height: 512 } },
  { id: "meta-ai", name: "Meta AI", launch: { kind: "copy-open", officialUrl: "https://www.meta.ai/" }, logo: { src: "/brand/ai/meta-ai.ico", width: 32, height: 32 } },
  { id: "deepseek", name: "DeepSeek", launch: { kind: "copy-open", officialUrl: "https://chat.deepseek.com/" } },
  { id: "mistral", name: "Mistral", launch: { kind: "copy-open", officialUrl: "https://chat.mistral.ai/" }, logo: { src: "/brand/ai/mistral.svg", width: 183, height: 183 } },
  { id: "you-com", name: "You.com", launch: { kind: "copy-open", officialUrl: "https://you.com/" }, logo: { src: "/brand/ai/you-com.ico", width: 32, height: 32 } },
] as const satisfies readonly AiSummaryAssistant[]);

export const aiSummaryDictionaries: Readonly<Record<Locale, AiSummaryCopy>> = Object.freeze({
  de: {
    eyebrow: "AI / Suche / Quelle",
    headline: "Lass dir btshq.online von deiner AI zusammenfassen",
    description: "Wähle deinen bevorzugten AI-Assistenten und nutze einen vorbereiteten Prompt, um Benjamin, seine Projekte und aktuelle Produktarbeit kompakt zusammenfassen zu lassen.",
    assistantLabel: "Mit deinem bevorzugten AI-Assistenten nutzen",
    promptLabel: "Vorbereiteter Prompt",
    prompt: "Fasse btshq.online zusammen: Wer ist Benjamin Trinidad Segura, woran arbeitet er, welche Projekte baut er und welche öffentlich dokumentierte Produktarbeit ist aktuell relevant? Nutze {siteUrl} als primäre Quelle und nenne nach Möglichkeit die relevanten btshq.online-Seiten als Quellen. Ergänze keine Aussagen, die durch diese Quellen nicht belegt sind.",
    copyAction: "Prompt kopieren",
    copied: "Prompt kopiert.",
    providerCopied: "Prompt kopiert – in {provider} einfügen und absenden.",
    providerPrepared: "Prompt in {provider} vorbereitet – nur noch prüfen und absenden. Falls nichts geöffnet wurde, {provider} erneut auswählen; der kopierte Prompt wird dann im Web geöffnet.",
    copyError: "Kopieren nicht möglich. Markiere den Prompt und kopiere ihn manuell.",
    otherAssistant: "Andere AI",
  },
  en: {
    eyebrow: "AI / Search / Source",
    headline: "Have your AI summarize btshq.online",
    description: "Choose your preferred AI assistant and use a prepared prompt for a concise summary of Benjamin, his projects and current public product work.",
    assistantLabel: "Use with your preferred AI assistant",
    promptLabel: "Prepared prompt",
    prompt: "Summarize btshq.online: who Benjamin Trinidad Segura is, what he is currently working on, which projects he is building, and what current public product work is documented. Use {siteUrl} as the primary source and cite the relevant btshq.online pages where possible. Do not add claims that these sources do not support.",
    copyAction: "Copy prompt",
    copied: "Prompt copied.",
    providerCopied: "Prompt copied — paste it into {provider} and send it.",
    providerPrepared: "Prompt prepared in {provider} — review and send it. If nothing opened, choose {provider} again; the copied prompt will then open on the web.",
    copyError: "Could not copy. Select the prompt and copy it manually.",
    otherAssistant: "Other AI",
  },
  es: {
    eyebrow: "IA / Búsqueda / Fuente",
    headline: "Haz que tu IA resuma btshq.online",
    description: "Elige tu asistente de IA preferido y usa un prompt preparado para obtener un resumen conciso de Benjamin, sus proyectos y el trabajo público de producto actual.",
    assistantLabel: "Úsalo con tu asistente de IA preferido",
    promptLabel: "Prompt preparado",
    prompt: "Resume btshq.online: quién es Benjamin Trinidad Segura, en qué trabaja actualmente, qué proyectos está creando y qué trabajo público de producto está documentado ahora. Usa {siteUrl} como fuente principal y cita, cuando sea posible, las páginas relevantes de btshq.online. No añadas afirmaciones que estas fuentes no respalden.",
    copyAction: "Copiar prompt",
    copied: "Prompt copiado.",
    providerCopied: "Prompt copiado: pégalo en {provider} y envíalo.",
    providerPrepared: "Prompt preparado en {provider}: revísalo y envíalo. Si no se abrió nada, vuelve a elegir {provider}; el prompt copiado se abrirá entonces en la web.",
    copyError: "No se pudo copiar. Selecciona el prompt y cópialo manualmente.",
    otherAssistant: "Otra IA",
  },
  tr: {
    eyebrow: "Yapay zekâ / Arama / Kaynak",
    headline: "btshq.online’ı yapay zekâ asistanına özetlet",
    description: "Tercih ettiğin yapay zekâ asistanını seç ve Benjamin’i, projelerini ve güncel herkese açık ürün çalışmalarını kısaca özetlemek için hazır promptu kullan.",
    assistantLabel: "Tercih ettiğin yapay zekâ asistanıyla kullan",
    promptLabel: "Hazır prompt",
    prompt: "btshq.online’ı özetle: Benjamin Trinidad Segura kimdir, şu anda neler üzerinde çalışıyor, hangi projeleri geliştiriyor ve güncel olarak hangi herkese açık ürün çalışmaları belgeleniyor? Ana kaynak olarak {siteUrl} adresini kullan ve mümkün olduğunda ilgili btshq.online sayfalarını kaynak olarak göster. Bu kaynakların desteklemediği iddialar ekleme.",
    copyAction: "Promptu kopyala",
    copied: "Prompt kopyalandı.",
    providerCopied: "Prompt kopyalandı — {provider} içine yapıştırıp gönder.",
    providerPrepared: "Prompt {provider} içinde hazırlandı — kontrol edip gönder. Hiçbir şey açılmadıysa {provider} seçeneğini yeniden seç; kopyalanan prompt bu kez web'de açılır.",
    copyError: "Prompt kopyalanamadı. Metni seçip elle kopyala.",
    otherAssistant: "Diğer yapay zekâ",
  },
  pl: {
    eyebrow: "AI / Wyszukiwanie / Źródło",
    headline: "Poproś swoją AI o podsumowanie btshq.online",
    description: "Wybierz preferowanego asystenta AI i użyj gotowego promptu, aby otrzymać zwięzłe podsumowanie Benjamina, jego projektów i aktualnej publicznej pracy nad produktami.",
    assistantLabel: "Użyj z preferowanym asystentem AI",
    promptLabel: "Gotowy prompt",
    prompt: "Podsumuj btshq.online: kim jest Benjamin Trinidad Segura, nad czym obecnie pracuje, jakie projekty tworzy i jaka aktualna, publicznie opisana praca nad produktami jest istotna. Użyj {siteUrl} jako głównego źródła i w miarę możliwości przytocz odpowiednie strony btshq.online. Nie dodawaj twierdzeń, których te źródła nie potwierdzają.",
    copyAction: "Kopiuj prompt",
    copied: "Prompt skopiowany.",
    providerCopied: "Prompt skopiowany — wklej go do {provider} i wyślij.",
    providerPrepared: "Prompt przygotowany w {provider} — sprawdź go i wyślij. Jeśli nic się nie otworzyło, wybierz {provider} ponownie; skopiowany prompt otworzy się wtedy w przeglądarce.",
    copyError: "Nie udało się skopiować. Zaznacz prompt i skopiuj go ręcznie.",
    otherAssistant: "Inna AI",
  },
  el: {
    eyebrow: "AI / Αναζήτηση / Πηγή",
    headline: "Ζήτησε από τον AI βοηθό σου να συνοψίσει το btshq.online",
    description: "Επίλεξε τον AI βοηθό που προτιμάς και χρησιμοποίησε ένα έτοιμο prompt για μια σύντομη σύνοψη του Benjamin, των έργων του και της τρέχουσας δημόσιας δουλειάς του σε προϊόντα.",
    assistantLabel: "Χρησιμοποίησέ το με τον AI βοηθό που προτιμάς",
    promptLabel: "Έτοιμο prompt",
    prompt: "Συνόψισε το btshq.online: ποιος είναι ο Benjamin Trinidad Segura, πάνω σε τι εργάζεται τώρα, ποια έργα δημιουργεί και ποια τρέχουσα δημόσια τεκμηριωμένη δουλειά σε προϊόντα είναι σχετική. Χρησιμοποίησε το {siteUrl} ως κύρια πηγή και, όπου είναι δυνατό, παράθεσε τις σχετικές σελίδες του btshq.online. Μην προσθέσεις ισχυρισμούς που δεν υποστηρίζονται από αυτές τις πηγές.",
    copyAction: "Αντιγραφή prompt",
    copied: "Το prompt αντιγράφηκε.",
    providerCopied: "Το prompt αντιγράφηκε — επικόλλησέ το στο {provider} και στείλε το.",
    providerPrepared: "Το prompt προετοιμάστηκε στο {provider} — έλεγξέ το και στείλε το. Αν δεν άνοιξε τίποτα, επίλεξε ξανά το {provider}· το αντιγραμμένο prompt θα ανοίξει τότε στον ιστό.",
    copyError: "Η αντιγραφή απέτυχε. Επίλεξε το prompt και αντέγραψέ το χειροκίνητα.",
    otherAssistant: "Άλλο AI",
  },
  ru: {
    eyebrow: "ИИ / Поиск / Источник",
    headline: "Попросите своего ИИ-ассистента кратко рассказать о btshq.online",
    description: "Выберите предпочитаемого ИИ-ассистента и используйте готовый промпт, чтобы получить краткое описание Бенджамина, его проектов и актуальной публичной работы над продуктами.",
    assistantLabel: "Используйте с предпочитаемым ИИ-ассистентом",
    promptLabel: "Готовый промпт",
    prompt: "Кратко расскажи о btshq.online: кто такой Benjamin Trinidad Segura, над чем он сейчас работает, какие проекты создаёт и какая актуальная публично задокументированная работа над продуктами заслуживает внимания. Используй {siteUrl} как основной источник и по возможности укажи соответствующие страницы btshq.online. Не добавляй утверждений, которые не подтверждаются этими источниками.",
    copyAction: "Копировать промпт",
    copied: "Промпт скопирован.",
    providerCopied: "Промпт скопирован — вставьте его в {provider} и отправьте.",
    providerPrepared: "Промпт подготовлен в {provider} — проверьте и отправьте его. Если ничего не открылось, выберите {provider} ещё раз: скопированный промпт откроется в браузере.",
    copyError: "Не удалось скопировать. Выделите промпт и скопируйте его вручную.",
    otherAssistant: "Другой ИИ",
  },
});

export function getAiSummaryCopy(locale: Locale): AiSummaryCopy {
  const copy = aiSummaryDictionaries[locale];
  return { ...copy, prompt: copy.prompt.replace("{siteUrl}", PUBLIC_CANONICAL_SOURCE_URL) };
}
