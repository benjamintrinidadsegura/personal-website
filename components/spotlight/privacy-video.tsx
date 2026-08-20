"use client";

import { useState } from "react";
import { useLocale } from "@/components/i18n/locale-context";
import type { Locale } from "@/lib/i18n/config";

const privacyCopy: Record<Locale, { consent: string; load: string; short: string; direct: string; external: string }> = {
  de: { consent: "Erst nach deiner Auswahl wird eine Verbindung zu YouTube hergestellt. Das Video startet nicht automatisch.", load: "Video laden", short: "Datenschutzbewusst: YouTube wird erst nach deinem Klick eingebettet.", direct: "Direkt auf YouTube ansehen", external: "externer Link, öffnet in neuem Tab" },
  en: { consent: "YouTube connects only after you choose. The video will not start automatically.", load: "Load video", short: "Privacy-aware: YouTube is embedded only after your click.", direct: "Watch directly on YouTube", external: "external link, opens in a new tab" },
  es: { consent: "Solo se establecerá conexión con YouTube cuando lo elijas. El vídeo no empezará automáticamente.", load: "Cargar vídeo", short: "Privacidad: YouTube solo se integra después de tu clic.", direct: "Ver directamente en YouTube", external: "enlace externo, se abre en una pestaña nueva" },
  tr: { consent: "YouTube bağlantısı yalnızca sen seçtikten sonra kurulur. Video otomatik başlamaz.", load: "Videoyu yükle", short: "Gizlilik odaklı: YouTube yalnızca tıklamandan sonra gömülür.", direct: "Doğrudan YouTube’da izle", external: "harici bağlantı, yeni sekmede açılır" },
  pl: { consent: "Połączenie z YouTube powstanie dopiero po twojej decyzji. Film nie uruchomi się automatycznie.", load: "Załaduj film", short: "Z myślą o prywatności: YouTube jest osadzany dopiero po kliknięciu.", direct: "Obejrzyj bezpośrednio na YouTube", external: "link zewnętrzny, otwiera się w nowej karcie" },
  el: { consent: "Η σύνδεση με το YouTube γίνεται μόνο αφού επιλέξεις. Το βίντεο δεν ξεκινά αυτόματα.", load: "Φόρτωσε το βίντεο", short: "Με σεβασμό στην ιδιωτικότητα: το YouTube ενσωματώνεται μόνο μετά το κλικ.", direct: "Δες το απευθείας στο YouTube", external: "εξωτερικός σύνδεσμος, ανοίγει σε νέα καρτέλα" },
  ru: { consent: "Соединение с YouTube устанавливается только после вашего выбора. Видео не запускается автоматически.", load: "Загрузить видео", short: "С учётом приватности: YouTube встраивается только после нажатия.", direct: "Смотреть прямо на YouTube", external: "внешняя ссылка, откроется в новой вкладке" },
};

interface PrivacyVideoProps {
  youtubeId: string;
  title: string;
  duration: string;
  url: string;
}

export function PrivacyVideo({ youtubeId, title, duration, url }: PrivacyVideoProps) {
  const [consented, setConsented] = useState(false);
  const copy = privacyCopy[useLocale()];

  return (
    <div className="overflow-hidden border border-white/15 bg-[#03111d]">
      <div className="aspect-video">
        {consented ? (
          <iframe
            className="h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${youtubeId}`}
            title={title}
            allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
          />
        ) : (
          <div className="relative grid h-full place-items-center overflow-hidden p-6 text-center sm:p-10">
            <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_72%_30%,rgba(53,208,229,0.18),transparent_32%),radial-gradient(circle_at_25%_75%,rgba(255,122,0,0.12),transparent_28%)]" />
            <div className="relative max-w-2xl">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#ff9a3d]">YouTube / {duration}</p>
              <p className="mt-4 text-xl font-black leading-snug text-white sm:text-3xl">{title}</p>
              <p className="mt-4 text-sm leading-6 text-slate-400">{copy.consent}</p>
              <button
                type="button"
                onClick={() => setConsented(true)}
                className="mt-7 min-h-12 rounded-full bg-[#35d0e5] px-6 py-3 font-black text-[#041018] transition hover:-translate-y-0.5 hover:bg-[#73e3f1]"
              >
                {copy.load}
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-col justify-between gap-3 border-t border-white/10 px-5 py-4 text-sm text-slate-400 sm:flex-row sm:items-center">
        <span>{copy.short}</span>
        <a href={url} target="_blank" rel="noopener noreferrer" className="font-bold text-white hover:text-[#35d0e5]">
          {copy.direct} ↗<span className="sr-only"> ({copy.external})</span>
        </a>
      </div>
    </div>
  );
}
