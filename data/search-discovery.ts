import type { Locale } from "@/lib/i18n/config";

export type DiscoverySurfaceId = "personal-advantage" | "money-profile";

interface DiscoveryPrimerCopy {
  question: string;
  answer: string;
  boundary: string;
  relatedTitle: string;
  related: readonly { href: string; label: string }[];
}

interface DiscoverySurfaceDefinition {
  path: string;
  applicationCategory: string;
  copy: Record<Locale, DiscoveryPrimerCopy>;
}

export const canonicalIntentClusters = [
  {
    id: "strengths-and-personal-advantage",
    questions: [
      "What are my strongest abilities?",
      "How do I find my unfair advantage?",
      "What makes me unusually useful?",
    ],
    canonicalPath: "/tools/personal-advantage",
  },
  {
    id: "money-behaviour",
    questions: [
      "What kind of money person am I?",
      "Why do I make these money decisions?",
      "What changes in my money behaviour under stress?",
    ],
    canonicalPath: "/tools/money-profile",
  },
  {
    id: "life-direction-and-alignment",
    questions: [
      "How do I figure out what I really want?",
      "Does my current life fit my priorities?",
      "Which parts of my life feel out of alignment?",
    ],
    canonicalPath: "/life-alignment",
  },
  {
    id: "career-and-next-step",
    questions: [
      "Which career direction fits me?",
      "How do I choose a useful next step?",
      "How can I connect my strengths with work?",
    ],
    canonicalPath: "/find-your-next-step",
  },
  {
    id: "thinking-and-working-patterns",
    questions: [
      "How can I understand how I think and work?",
      "Which working patterns help or hinder me?",
      "What kind of environment fits how I work?",
    ],
    canonicalPath: "/about/how-my-brain-works",
  },
] as const;

export const discoverySurfaces: Record<DiscoverySurfaceId, DiscoverySurfaceDefinition> = {
  "personal-advantage": {
    path: "/tools/personal-advantage",
    applicationCategory: "LifestyleApplication",
    copy: {
      de: {
        question: "Wie finde ich meinen persönlichen Vorteil?",
        answer: "Suche nicht nur nach einer einzelnen außergewöhnlichen Stärke. Achte auf die wiederkehrende Kombination aus Fähigkeiten, Erfahrung, Energie, Zugang und Situationen, in denen andere auf dich zählen. Ein tragfähiger persönlicher Vorteil ist ein Muster, das du im echten Leben überprüfen kannst.",
        boundary: "Diese strukturierte Selbstreflexion formuliert Hypothesen. Sie ist kein wissenschaftlich validierter Persönlichkeitstest und keine psychologische oder medizinische Diagnose.",
        relatedTitle: "Den Kontext weiter erkunden",
        related: [
          { href: "/about/how-my-brain-works", label: "Ein konkretes Brain Manual ansehen" },
          { href: "/find-your-next-step", label: "Stärken mit einem nächsten Schritt verbinden" },
        ],
      },
      en: {
        question: "How do I find my unfair advantage?",
        answer: "Do not look only for one spectacular strength. Look for a repeated combination of ability, experience, energy, access and situations in which other people rely on you. A useful personal advantage is a pattern you can test in real life.",
        boundary: "This structured self-reflection produces hypotheses. It is not a scientifically validated personality assessment or a psychological or medical diagnosis.",
        relatedTitle: "Explore the context further",
        related: [
          { href: "/about/how-my-brain-works", label: "See a concrete Brain Manual" },
          { href: "/find-your-next-step", label: "Connect strengths with a next step" },
        ],
      },
      es: {
        question: "¿Cómo puedo encontrar mi ventaja personal?",
        answer: "No busques solo una fortaleza espectacular. Observa la combinación que se repite entre capacidades, experiencia, energía, acceso y situaciones en las que otras personas confían en ti. Una ventaja personal útil es un patrón que puedes comprobar en la vida real.",
        boundary: "Esta autorreflexión estructurada formula hipótesis. No es una evaluación de personalidad validada científicamente ni un diagnóstico psicológico o médico.",
        relatedTitle: "Seguir explorando el contexto",
        related: [
          { href: "/about/how-my-brain-works", label: "Ver un Brain Manual concreto" },
          { href: "/find-your-next-step", label: "Conectar fortalezas con un próximo paso" },
        ],
      },
      tr: {
        question: "Kişisel avantajımı nasıl bulabilirim?",
        answer: "Yalnızca tek bir olağanüstü gücü arama. Yetenek, deneyim, enerji, erişim ve başkalarının sana güvendiği durumların tekrar eden birleşimine bak. Yararlı bir kişisel avantaj, gerçek hayatta sınayabileceğin bir örüntüdür.",
        boundary: "Bu yapılandırılmış öz değerlendirme hipotezler üretir. Bilimsel olarak doğrulanmış bir kişilik değerlendirmesi ya da psikolojik veya tıbbi tanı değildir.",
        relatedTitle: "Bağlamı daha ileri keşfet",
        related: [
          { href: "/about/how-my-brain-works", label: "Somut bir Brain Manual gör" },
          { href: "/find-your-next-step", label: "Güçlü yönleri bir sonraki adımla birleştir" },
        ],
      },
      pl: {
        question: "Jak znaleźć swoją osobistą przewagę?",
        answer: "Nie szukaj wyłącznie jednej spektakularnej mocnej strony. Zwróć uwagę na powtarzalne połączenie umiejętności, doświadczenia, energii, dostępu i sytuacji, w których inni na tobie polegają. Użyteczna osobista przewaga to wzorzec, który możesz sprawdzić w prawdziwym życiu.",
        boundary: "Ta uporządkowana autorefleksja tworzy hipotezy. Nie jest naukowo zwalidowanym badaniem osobowości ani diagnozą psychologiczną lub medyczną.",
        relatedTitle: "Poznaj szerszy kontekst",
        related: [
          { href: "/about/how-my-brain-works", label: "Zobacz konkretny Brain Manual" },
          { href: "/find-your-next-step", label: "Połącz mocne strony z następnym krokiem" },
        ],
      },
      el: {
        question: "Πώς μπορώ να βρω το προσωπικό μου πλεονέκτημα;",
        answer: "Μην αναζητάς μόνο μία εντυπωσιακή δύναμη. Παρατήρησε τον επαναλαμβανόμενο συνδυασμό ικανοτήτων, εμπειρίας, ενέργειας, πρόσβασης και καταστάσεων στις οποίες οι άλλοι βασίζονται σε εσένα. Ένα χρήσιμο προσωπικό πλεονέκτημα είναι ένα μοτίβο που μπορείς να δοκιμάσεις στην πραγματική ζωή.",
        boundary: "Αυτή η δομημένη αυτοπαρατήρηση διατυπώνει υποθέσεις. Δεν είναι επιστημονικά επικυρωμένη αξιολόγηση προσωπικότητας ούτε ψυχολογική ή ιατρική διάγνωση.",
        relatedTitle: "Εξερεύνησε περισσότερο το πλαίσιο",
        related: [
          { href: "/about/how-my-brain-works", label: "Δες ένα συγκεκριμένο Brain Manual" },
          { href: "/find-your-next-step", label: "Σύνδεσε τα δυνατά σημεία με ένα επόμενο βήμα" },
        ],
      },
      ru: {
        question: "Как найти своё личное преимущество?",
        answer: "Не ищите только одну выдающуюся сильную сторону. Обратите внимание на повторяющееся сочетание способностей, опыта, энергии, доступа и ситуаций, в которых другие на вас полагаются. Полезное личное преимущество — это закономерность, которую можно проверить в реальной жизни.",
        boundary: "Эта структурированная саморефлексия формулирует гипотезы. Это не научно валидированная оценка личности и не психологический или медицинский диагноз.",
        relatedTitle: "Исследовать контекст дальше",
        related: [
          { href: "/about/how-my-brain-works", label: "Посмотреть конкретный Brain Manual" },
          { href: "/find-your-next-step", label: "Связать сильные стороны со следующим шагом" },
        ],
      },
    },
  },
  "money-profile": {
    path: "/tools/money-profile",
    applicationCategory: "LifestyleApplication",
    copy: {
      de: {
        question: "Welcher Geldtyp bin ich?",
        answer: "Ein Geldprofil wird nicht durch Einkommen oder Kontostand bestimmt. Hilfreicher ist es, wiederkehrende Muster zu beobachten: welche Bedeutung Geld für dich hat, wie du entscheidest, was sich unter Stress verändert und welche kleinen Strukturen dir helfen könnten.",
        boundary: "Das Money Profile ist Selbstreflexion über finanzielles Verhalten — keine Finanz-, Anlage-, Steuer-, Kredit- oder Schuldberatung und kein diagnostischer Test.",
        relatedTitle: "Das größere Bild betrachten",
        related: [
          { href: "/life-alignment", label: "Geld im Kontext deiner Prioritäten betrachten" },
          { href: "/find-your-next-step", label: "Einen passenden nächsten Schritt strukturieren" },
        ],
      },
      en: {
        question: "What kind of money person am I?",
        answer: "A money profile is not determined by income or account balance. It is more useful to notice recurring patterns: what money means to you, how you make decisions, what changes under stress and which small structures might help.",
        boundary: "Money Profile is financial-behaviour self-reflection—not financial, investment, tax, credit or debt advice, and not a diagnostic assessment.",
        relatedTitle: "See the wider picture",
        related: [
          { href: "/life-alignment", label: "Put money in the context of your priorities" },
          { href: "/find-your-next-step", label: "Structure a fitting next step" },
        ],
      },
      es: {
        question: "¿Qué tipo de relación tengo con el dinero?",
        answer: "Un perfil de dinero no lo determinan tus ingresos ni el saldo de tu cuenta. Es más útil observar patrones recurrentes: qué significa el dinero para ti, cómo decides, qué cambia bajo estrés y qué pequeñas estructuras podrían ayudarte.",
        boundary: "Money Profile es una autorreflexión sobre conducta financiera, no asesoramiento financiero, de inversión, fiscal, crediticio o de deudas, ni una evaluación diagnóstica.",
        relatedTitle: "Ver el panorama más amplio",
        related: [
          { href: "/life-alignment", label: "Situar el dinero dentro de tus prioridades" },
          { href: "/find-your-next-step", label: "Estructurar un próximo paso adecuado" },
        ],
      },
      tr: {
        question: "Parayla ilişkim nasıl?",
        answer: "Bir para profili gelir veya hesap bakiyesiyle belirlenmez. Tekrarlayan örüntüleri fark etmek daha yararlıdır: paranın senin için ne ifade ettiği, nasıl karar verdiğin, stres altında neyin değiştiği ve hangi küçük yapıların yardımcı olabileceği.",
        boundary: "Money Profile finansal davranış üzerine öz değerlendirmedir; finans, yatırım, vergi, kredi veya borç tavsiyesi ve tanısal bir değerlendirme değildir.",
        relatedTitle: "Daha geniş tabloyu gör",
        related: [
          { href: "/life-alignment", label: "Parayı önceliklerin bağlamında ele al" },
          { href: "/find-your-next-step", label: "Sana uyan bir sonraki adımı yapılandır" },
        ],
      },
      pl: {
        question: "Jaki mam sposób podejścia do pieniędzy?",
        answer: "Profil podejścia do pieniędzy nie zależy od dochodu ani salda konta. Bardziej pomocne jest zauważenie powtarzalnych wzorców: co znaczą dla ciebie pieniądze, jak podejmujesz decyzje, co zmienia się pod wpływem stresu i jakie małe struktury mogą pomóc.",
        boundary: "Money Profile służy autorefleksji nad zachowaniami finansowymi — nie jest poradą finansową, inwestycyjną, podatkową, kredytową ani dotyczącą zadłużenia i nie stanowi diagnozy.",
        relatedTitle: "Zobacz szerszy obraz",
        related: [
          { href: "/life-alignment", label: "Umieść pieniądze w kontekście swoich priorytetów" },
          { href: "/find-your-next-step", label: "Uporządkuj pasujący następny krok" },
        ],
      },
      el: {
        question: "Ποια είναι η σχέση μου με τα χρήματα;",
        answer: "Ένα προφίλ χρήματος δεν καθορίζεται από το εισόδημα ή το υπόλοιπο λογαριασμού. Είναι πιο χρήσιμο να παρατηρείς επαναλαμβανόμενα μοτίβα: τι σημαίνουν τα χρήματα για εσένα, πώς αποφασίζεις, τι αλλάζει υπό πίεση και ποιες μικρές δομές μπορεί να βοηθήσουν.",
        boundary: "Το Money Profile είναι αυτοπαρατήρηση οικονομικής συμπεριφοράς — όχι χρηματοοικονομική, επενδυτική, φορολογική, πιστωτική ή συμβουλή χρέους και όχι διαγνωστική αξιολόγηση.",
        relatedTitle: "Δες τη μεγαλύτερη εικόνα",
        related: [
          { href: "/life-alignment", label: "Δες τα χρήματα στο πλαίσιο των προτεραιοτήτων σου" },
          { href: "/find-your-next-step", label: "Οργάνωσε ένα επόμενο βήμα που σου ταιριάζει" },
        ],
      },
      ru: {
        question: "Как я отношусь к деньгам?",
        answer: "Денежный профиль определяется не доходом и не балансом счёта. Полезнее замечать повторяющиеся закономерности: что для вас значат деньги, как вы принимаете решения, что меняется под давлением и какие небольшие структуры могут помочь.",
        boundary: "Money Profile — это саморефлексия о финансовом поведении, а не финансовая, инвестиционная, налоговая, кредитная или долговая консультация и не диагностическая оценка.",
        relatedTitle: "Увидеть более широкую картину",
        related: [
          { href: "/life-alignment", label: "Рассмотреть деньги в контексте своих приоритетов" },
          { href: "/find-your-next-step", label: "Выстроить подходящий следующий шаг" },
        ],
      },
    },
  },
};

export function getDiscoverySurface(id: DiscoverySurfaceId, locale: Locale) {
  const surface = discoverySurfaces[id];
  return { ...surface, copy: surface.copy[locale] };
}
