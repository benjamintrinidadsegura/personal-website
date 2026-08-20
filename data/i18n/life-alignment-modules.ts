import {
  availableLifeAlignmentModules,
  futureLifeAlignmentModules,
  lifeAlignmentHub,
  type AvailableLifeAlignmentModule,
  type FutureLifeAlignmentModule,
} from "@/data/life-alignment-modules";
import type { Locale } from "@/lib/i18n/config";

type AvailableCopy = Pick<AvailableLifeAlignmentModule, "title" | "purpose" | "audience" | "statusLabel" | "privacy" | "duration">;
type ModuleCopy = {
  hub: { title: string; description: string; principle: string };
  available: readonly [AvailableCopy, AvailableCopy, AvailableCopy];
  futurePurpose: readonly [string, string, string, string, string];
  futureAudience: readonly [string, string, string, string, string];
  comingLater: string;
};

const moduleCopy = {
  en: {
    hub: { title: "Alignment from three perspectives.", description: "Life Alignment helps you look deliberately at your current situation, a relationship or your desired direction—qualitatively, context-aware and without a hidden life score.", principle: "Results organise only explicitly selected answers. They evaluate neither your life nor your relationship and leave interpretive authority with the people involved." },
    available: [
      { title: "Self / Personal snapshot", purpose: "Understand how your most important life areas currently shape space, attention and capacity.", audience: "For me", statusLabel: "Available · Beta", privacy: "Local only · current page state only", duration: "5 sections · about 8–12 minutes" },
      { title: "Partner / Relationship", purpose: "Compare two independently answered perspectives and make conversation needs visible without a compatibility verdict.", audience: "For two people on one device", statusLabel: "Available · Beta", privacy: "Local only · independent handover on the same device", duration: "Two perspectives · about 15–20 minutes" },
      { title: "Life Vision", purpose: "Explore desired directions, protected priorities, real constraints and intentionally open possibilities.", audience: "For my future direction", statusLabel: "Available · Beta", privacy: "Local only · current page state only", duration: "6 sections · about 10–14 minutes" },
    ],
    futurePurpose: ["Consider perspectives, responsibilities and room within a family.", "Reflect on closeness, reciprocity and different expectations in friendships.", "Understand career direction in relationship with the rest of life.", "Make collaboration, expectations and sustainable agreements visible within a team.", "Consider entrepreneurial responsibility, personal capacity and direction together."],
    futureAudience: ["For family contexts", "For friendship contexts", "For career contexts", "For teams", "For founder contexts"], comingLater: "Coming later",
  },
  es: {
    hub: { title: "Alineación desde tres perspectivas.", description: "Life Alignment te ayuda a mirar con intención tu situación actual, una relación o la dirección que deseas: de forma cualitativa, atenta al contexto y sin una puntuación oculta de tu vida.", principle: "Los resultados solo ordenan las respuestas elegidas expresamente. No evalúan tu vida ni tu relación; la interpretación sigue en manos de las personas implicadas." },
    available: [
      { title: "Self / Panorama personal", purpose: "Comprende cómo tus ámbitos de vida más importantes ocupan hoy espacio, atención y capacidad.", audience: "Para mí", statusLabel: "Disponible · Beta", privacy: "Solo local · únicamente en el estado de esta página", duration: "5 secciones · unos 8–12 minutos" },
      { title: "Partner / Relación", purpose: "Compara dos perspectivas respondidas por separado y muestra qué convendría conversar, sin emitir un veredicto de compatibilidad.", audience: "Para dos personas en un dispositivo", statusLabel: "Disponible · Beta", privacy: "Solo local · relevo independiente en el mismo dispositivo", duration: "Dos perspectivas · unos 15–20 minutos" },
      { title: "Life Vision", purpose: "Explora direcciones deseadas, prioridades protegidas, límites reales y posibilidades que quieres mantener abiertas.", audience: "Para mi dirección futura", statusLabel: "Disponible · Beta", privacy: "Solo local · únicamente en el estado de esta página", duration: "6 secciones · unos 10–14 minutos" },
    ],
    futurePurpose: ["Considerar perspectivas, responsabilidades y margen dentro de una familia.", "Reflexionar sobre cercanía, reciprocidad y expectativas distintas en la amistad.", "Entender la dirección profesional en relación con el resto de la vida.", "Hacer visibles la colaboración, las expectativas y los acuerdos sostenibles en un equipo.", "Considerar juntas la responsabilidad emprendedora, la capacidad personal y la dirección."],
    futureAudience: ["Para contextos familiares", "Para contextos de amistad", "Para contextos profesionales", "Para equipos", "Para contextos de emprendimiento"], comingLater: "Más adelante",
  },
  tr: {
    hub: { title: "Üç bakış açısından uyum.", description: "Life Alignment; bugünkü durumuna, bir ilişkine ya da istediğin yöne bilinçli biçimde bakmana yardımcı olur: nitel, bağlama duyarlı ve gizli bir yaşam puanı olmadan.", principle: "Sonuçlar yalnızca açıkça seçilen yanıtları düzenler. Yaşamını ya da ilişkini değerlendirmez; yorumlama yetkisi ilgili kişilerde kalır." },
    available: [
      { title: "Self / Kişisel görünüm", purpose: "En önemli yaşam alanlarının bugün alanını, dikkatini ve kapasiteni nasıl şekillendirdiğini gör.", audience: "Kendim için", statusLabel: "Kullanılabilir · Beta", privacy: "Yalnızca yerel · sadece bu sayfanın mevcut durumu", duration: "5 bölüm · yaklaşık 8–12 dakika" },
      { title: "Partner / İlişki", purpose: "Bağımsız yanıtlanan iki bakış açısını karşılaştır ve uyumluluk hükmü vermeden konuşulabilecek noktaları görünür kıl.", audience: "Tek cihazdaki iki kişi için", statusLabel: "Kullanılabilir · Beta", privacy: "Yalnızca yerel · aynı cihazda bağımsız devir", duration: "İki bakış açısı · yaklaşık 15–20 dakika" },
      { title: "Life Vision", purpose: "İstenen yönleri, korunacak öncelikleri, gerçek kısıtları ve bilinçli olarak açık bırakılan olasılıkları keşfet.", audience: "Gelecekteki yönüm için", statusLabel: "Kullanılabilir · Beta", privacy: "Yalnızca yerel · sadece bu sayfanın mevcut durumu", duration: "6 bölüm · yaklaşık 10–14 dakika" },
    ],
    futurePurpose: ["Bir aile içindeki bakış açılarını, sorumlulukları ve hareket alanını ele al.", "Arkadaşlıklarda yakınlığı, karşılıklılığı ve farklı beklentileri düşün.", "Kariyer yönünü yaşamın geri kalanıyla birlikte anla.", "Ekipte iş birliğini, beklentileri ve sürdürülebilir anlaşmaları görünür kıl.", "Girişimcilik sorumluluğunu, kişisel kapasiteyi ve yönü birlikte ele al."],
    futureAudience: ["Aile bağlamları için", "Arkadaşlık bağlamları için", "Kariyer bağlamları için", "Ekipler için", "Kurucu bağlamları için"], comingLater: "Daha sonra",
  },
  pl: {
    hub: { title: "Dopasowanie z trzech perspektyw.", description: "Life Alignment pomaga świadomie spojrzeć na obecną sytuację, relację albo wybrany kierunek — jakościowo, z uwzględnieniem kontekstu i bez ukrytego wyniku punktowego.", principle: "Wyniki porządkują wyłącznie odpowiedzi wybrane wprost. Nie oceniają życia ani relacji, a prawo do interpretacji pozostaje po stronie zaangażowanych osób." },
    available: [
      { title: "Self / Osobisty obraz", purpose: "Zobacz, jak najważniejsze obszary życia wpływają dziś na przestrzeń, uwagę i dostępne zasoby.", audience: "Dla mnie", statusLabel: "Dostępne · Beta", privacy: "Tylko lokalnie · wyłącznie w stanie tej strony", duration: "5 części · około 8–12 minut" },
      { title: "Partner / Relacja", purpose: "Zestaw dwie niezależnie udzielone perspektywy i zobacz tematy do rozmowy bez werdyktu o zgodności.", audience: "Dla dwóch osób przy jednym urządzeniu", statusLabel: "Dostępne · Beta", privacy: "Tylko lokalnie · niezależne przekazanie na tym samym urządzeniu", duration: "Dwie perspektywy · około 15–20 minut" },
      { title: "Life Vision", purpose: "Zbadaj pożądane kierunki, chronione priorytety, realne ograniczenia i świadomie otwarte możliwości.", audience: "Dla mojego przyszłego kierunku", statusLabel: "Dostępne · Beta", privacy: "Tylko lokalnie · wyłącznie w stanie tej strony", duration: "6 części · około 10–14 minut" },
    ],
    futurePurpose: ["Przyjrzyj się perspektywom, odpowiedzialności i przestrzeni w rodzinie.", "Zastanów się nad bliskością, wzajemnością i różnymi oczekiwaniami w przyjaźni.", "Zrozum kierunek kariery w powiązaniu z resztą życia.", "Uwidocznij współpracę, oczekiwania i trwałe ustalenia w zespole.", "Rozpatrz łącznie odpowiedzialność przedsiębiorczą, osobiste zasoby i kierunek."],
    futureAudience: ["Dla kontekstów rodzinnych", "Dla kontekstów przyjaźni", "Dla kontekstów zawodowych", "Dla zespołów", "Dla kontekstów założycielskich"], comingLater: "Później",
  },
  el: {
    hub: { title: "Ευθυγράμμιση από τρεις οπτικές.", description: "Το Life Alignment σε βοηθά να δεις συνειδητά τη σημερινή σου κατάσταση, μια σχέση ή την κατεύθυνση που επιθυμείς — ποιοτικά, με επίγνωση του πλαισίου και χωρίς κρυφή βαθμολογία ζωής.", principle: "Τα αποτελέσματα οργανώνουν μόνο τις απαντήσεις που επιλέχθηκαν ρητά. Δεν αξιολογούν τη ζωή ή τη σχέση σου και αφήνουν την ερμηνεία στους ανθρώπους που συμμετέχουν." },
    available: [
      { title: "Self / Προσωπική εικόνα", purpose: "Κατανόησε πώς οι σημαντικότεροι τομείς της ζωής σου διαμορφώνουν σήμερα τον χώρο, την προσοχή και τις αντοχές σου.", audience: "Για εμένα", statusLabel: "Διαθέσιμο · Beta", privacy: "Μόνο τοπικά · αποκλειστικά στην τρέχουσα κατάσταση της σελίδας", duration: "5 ενότητες · περίπου 8–12 λεπτά" },
      { title: "Partner / Σχέση", purpose: "Σύγκρινε δύο ανεξάρτητες οπτικές και δες τι ίσως χρειάζεται συζήτηση, χωρίς απόφαση συμβατότητας.", audience: "Για δύο άτομα σε μία συσκευή", statusLabel: "Διαθέσιμο · Beta", privacy: "Μόνο τοπικά · ανεξάρτητη παράδοση στην ίδια συσκευή", duration: "Δύο οπτικές · περίπου 15–20 λεπτά" },
      { title: "Life Vision", purpose: "Διερεύνησε επιθυμητές κατευθύνσεις, προστατευμένες προτεραιότητες, πραγματικούς περιορισμούς και σκόπιμα ανοιχτές δυνατότητες.", audience: "Για τη μελλοντική μου κατεύθυνση", statusLabel: "Διαθέσιμο · Beta", privacy: "Μόνο τοπικά · αποκλειστικά στην τρέχουσα κατάσταση της σελίδας", duration: "6 ενότητες · περίπου 10–14 λεπτά" },
    ],
    futurePurpose: ["Εξέτασε οπτικές, ευθύνες και περιθώρια μέσα σε μια οικογένεια.", "Σκέψου την εγγύτητα, την αμοιβαιότητα και τις διαφορετικές προσδοκίες στις φιλίες.", "Κατανόησε την επαγγελματική κατεύθυνση σε σχέση με την υπόλοιπη ζωή.", "Κάνε ορατή τη συνεργασία, τις προσδοκίες και τις βιώσιμες συμφωνίες σε μια ομάδα.", "Εξέτασε μαζί την επιχειρηματική ευθύνη, την προσωπική ικανότητα και την κατεύθυνση."],
    futureAudience: ["Για οικογενειακά πλαίσια", "Για πλαίσια φιλίας", "Για επαγγελματικά πλαίσια", "Για ομάδες", "Για πλαίσια ιδρυτών"], comingLater: "Αργότερα",
  },
  ru: {
    hub: { title: "Согласованность с трёх точек зрения.", description: "Life Alignment помогает осознанно взглянуть на нынешнюю ситуацию, отношения или желаемое направление — качественно, с учётом контекста и без скрытой оценки жизни.", principle: "Результаты упорядочивают только явно выбранные ответы. Они не оценивают вашу жизнь или отношения; право на интерпретацию остаётся у участвующих людей." },
    available: [
      { title: "Self / Личный обзор", purpose: "Поймите, как важнейшие сферы жизни сейчас влияют на ваше пространство, внимание и силы.", audience: "Для меня", statusLabel: "Доступно · Beta", privacy: "Только локально · лишь в текущем состоянии страницы", duration: "5 разделов · около 8–12 минут" },
      { title: "Partner / Отношения", purpose: "Сопоставьте две независимо заполненные перспективы и увидьте темы для разговора без вердикта о совместимости.", audience: "Для двух людей на одном устройстве", statusLabel: "Доступно · Beta", privacy: "Только локально · независимая передача на том же устройстве", duration: "Две перспективы · около 15–20 минут" },
      { title: "Life Vision", purpose: "Исследуйте желаемые направления, защищаемые приоритеты, реальные ограничения и намеренно открытые возможности.", audience: "Для моего будущего направления", statusLabel: "Доступно · Beta", privacy: "Только локально · лишь в текущем состоянии страницы", duration: "6 разделов · около 10–14 минут" },
    ],
    futurePurpose: ["Рассмотрите взгляды, ответственность и пространство внутри семьи.", "Осмыслите близость, взаимность и разные ожидания в дружбе.", "Поймите карьерное направление в связи с остальной жизнью.", "Сделайте заметными сотрудничество, ожидания и устойчивые договорённости в команде.", "Рассмотрите вместе предпринимательскую ответственность, личные силы и направление."],
    futureAudience: ["Для семейного контекста", "Для дружеского контекста", "Для карьерного контекста", "Для команд", "Для основателей"], comingLater: "Позже",
  },
} as const satisfies Record<Exclude<Locale, "de">, ModuleCopy>;

export function getLifeAlignmentHubContent(locale: Locale) {
  const copy = moduleCopy[locale as keyof typeof moduleCopy];
  if (!copy) return { hub: lifeAlignmentHub, available: availableLifeAlignmentModules, future: futureLifeAlignmentModules };
  return {
    hub: { ...lifeAlignmentHub, ...copy.hub },
    available: availableLifeAlignmentModules.map((module, index) => ({ ...module, ...copy.available[index] })) as unknown as readonly AvailableLifeAlignmentModule[],
    future: futureLifeAlignmentModules.map((module, index) => ({ ...module, purpose: copy.futurePurpose[index], audience: copy.futureAudience[index], statusLabel: copy.comingLater })) as readonly FutureLifeAlignmentModule[],
  };
}
