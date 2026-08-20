import type { Locale } from "@/lib/i18n/config";

type HomeCopy = {
  hero: {
    role: string;
    claim: string;
    introduction: string;
    explore: string;
    connect: string;
    signalLabel: string;
    lastSignal: string;
    signals: readonly string[];
    signalAriaLabel: string;
  };
  now: { eyebrow: string; description: string; labels: readonly string[]; items: readonly string[] };
  homeAbout: { eyebrow: string; title: string; connection: string; cta: string; principle: string };
  contact: {
    eyebrow: string;
    title: string;
    introduction: string;
    goat: string;
    ratecom: string;
    intersections: string;
    socialEyebrow: string;
    socialTitle: string;
    socialDescription: string;
    external: string;
    externalLabel: string;
    bookingTitle: string;
    bookingDescription: string;
    bookingUnavailable: string;
    projectsAriaLabel: string;
    bookingEyebrow: string;
    bookingAction: string;
  };
  interviews: {
    eyebrow: string;
    title: string;
    description: string;
    quoteLabel: string;
    formats: readonly { title: string; description: string; focus: string }[];
    countTitle: string;
    countDescription: string;
    cta: string;
    guidingQuestion: string;
  };
  writing: {
    eyebrow: string;
    title: string;
    description: string;
    readingTime: (minutes: number) => string;
    read: string;
    preview: string;
    explore: string;
  };
  echo: {
    eyebrow: string;
    title: string;
    description: string;
    emptyTitle: string;
    emptyDescription: string;
    unavailableTitle: string;
    unavailableDescription: string;
    explore: string;
    leave: string;
  };
};

const dictionaries: Record<Locale, HomeCopy> = {
  de: {
    hero: {
      role: "Recruiter. Builder. Storyteller. Community Creator.",
      claim: "Stories, Careers & Communities — rund um Menschen, die eine Bühne verdienen.",
      introduction: "Ich verbinde Recruiting, Unternehmertum, Storytelling und Community Building. bts.online ist mein wachsendes digitales Zuhause für Projekte, Menschen, Gedanken und Ideen.",
      explore: "Das HQ entdecken",
      connect: "Kontakt aufnehmen",
      signalLabel: "HQ-Signal / Live",
      lastSignal: "Letztes Signal · Jetzt",
      signals: ["Im Aufbau", "In der Nähe von Frankfurt", "Öffentlich entwickelt", "Immer in Bewegung"],
      signalAriaLabel: "HQ-Signal",
    },
    now: {
      eyebrow: "Live-Übertragung",
      description: "Was mich gerade beschäftigt, was ich aufbaue und worauf ich meinen Fokus lege.",
      labels: ["Im Aufbau", "In Entwicklung", "Im Neuaufbau", "In Erkundung"],
      items: [
        "bts.online als lebendes Digital HQ",
        "GOATRECRUTAINER und neue Content-Formate",
        "RateCom als unabhängige Recruiting-Bewertungsplattform",
        "Recruiting, KI, Storytelling und digitale Communities",
      ],
    },
    homeAbout: {
      eyebrow: "Über mich / Positionierung",
      title: "Fehlenden Kontext sichtbar machen.",
      connection: "bts.online macht den Zusammenhang sichtbar: Recruiting-Arbeit, Gespräche, Produkte und Reflexionswerkzeuge als unterschiedliche Antworten auf dieselbe Frage — welcher Kontext fehlt, bevor eine Entscheidung wirklich zum Menschen passen kann?",
      cta: "Positionierung & Arbeit im Zusammenhang",
      principle: "Prinzip",
    },
    contact: {
      eyebrow: "Offener Kanal / Kontakt",
      title: "Lass uns etwas Sinnvolles aufbauen.",
      introduction: "Für Recruiting-Projekte, Interviews, kreative Kooperationen, Plattformideen oder Gespräche über Arbeit, Menschen und Entwicklung.",
      goat: "GOATRECRUTAINER entdecken",
      ratecom: "RateCom entdecken",
      intersections: "Mögliche Schnittstellen",
      socialEyebrow: "Social-Präsenz",
      socialTitle: "Folge der Arbeit dort, wo sie stattfindet.",
      socialDescription: "Karrieregeschichten und GOATRECRUTAINER-Formate auf TikTok, Instagram und YouTube — Benjamins professionelles Profil auf LinkedIn.",
      external: "Extern ↗",
      externalLabel: "externe Website, öffnet in neuem Tab",
      bookingTitle: "Ein Gespräch mit Kontext.",
      bookingDescription: "Die Terminbuchung wird hier freigeschaltet, sobald der öffentliche Buchungslink verifiziert ist.",
      bookingUnavailable: "Öffentlicher Link in Verifizierung — noch keine Buchung möglich.",
      projectsAriaLabel: "Projekte im Digital HQ",
      bookingEyebrow: "Termin",
      bookingAction: "Gespräch buchen",
    },
    interviews: {
      eyebrow: "Interviews / Human Archive",
      title: "Unter jedem Lebenslauf liegt eine Geschichte.",
      description: "Gesprächsformate über Herkunft, Arbeit, Wendepunkte und das, was Menschen antreibt — ohne erfundene Heldenreise.",
      quoteLabel: "Die wiederkehrende Leitfrage",
      formats: [
        { title: "Career Spotlight", description: "Menschen, Karrierewege und die Geschichten hinter Lebensläufen.", focus: "Karriere · Herkunft · Entscheidungen" },
        { title: "Service Spotlight", description: "Gründer, Unternehmen, Dienstleistungen und die Menschen hinter Angeboten.", focus: "Unternehmertum · Service · Haltung" },
        { title: "Personal Conversations", description: "Offene Gespräche über Wendepunkte, Ambitionen, Identität und Entwicklung.", focus: "Identität · Wandel · Zukunft" },
      ],
      countTitle: "Sechs Gespräche. Sechs eigenständige Perspektiven.",
      countDescription: "Career und Service Spotlight gemeinsam entdecken – mit Video, Kapiteln und redaktionellen Takeaways.",
      cta: "People / Spotlight",
      guidingQuestion: "Was aus deiner Kindheit muss man wissen, um dich und deinen Lebenslauf zu verstehen?",
    },
    writing: {
      eyebrow: "Writing / Field Notes",
      title: "Gedanken, die bleiben dürfen. Fragen, die wir teilen sollten.",
      description: "Ein digitales Magazin für Gedanken über Arbeit, Identität, Mut und die Geschichten, die wir über uns selbst erzählen.",
      readingTime: (minutes) => `${minutes} Min. Lesezeit`,
      read: "Artikel lesen",
      preview: "Vorschau",
      explore: "Writing entdecken",
    },
    echo: {
      eyebrow: "EchoWall / Community-Signal",
      title: "Signale von den Menschen rund um dieses HQ.",
      description: "Gedanken, Feedback, Reaktionen und Nachrichten — kuratiert, moderiert und mit Raum für die Menschen hinter dem Signal.",
      emptyTitle: "Die Wand ist noch still.",
      emptyDescription: "Die ersten Echos werden gerade gesammelt und moderiert. Du kannst bereits eine Nachricht hinterlassen und Teil der entstehenden Community-Wand werden.",
      unavailableTitle: "EchoWall macht eine kurze Pause.",
      unavailableDescription: "Die öffentlichen Echos können gerade nicht geladen werden. Die EchoWall-Seite bleibt erreichbar.",
      explore: "EchoWall entdecken",
      leave: "Ein Echo hinterlassen",
    },
  },
  en: {
    hero: {
      role: "Recruiter. Builder. Storyteller. Community Creator.",
      claim: "Stories, Careers & Communities — built around people who deserve a stage.",
      introduction: "I bring together recruiting, entrepreneurship, storytelling and community building. bts.online is my growing digital home for projects, people, thoughts and ideas.",
      explore: "Explore the HQ",
      connect: "Let’s connect",
      signalLabel: "HQ Signal / Live",
      lastSignal: "Last signal · Now",
      signals: ["Currently building", "Based near Frankfurt", "Building in public", "Always evolving"],
      signalAriaLabel: "HQ signal",
    },
    now: {
      eyebrow: "Live transmission",
      description: "What I am thinking about, building and focusing on right now.",
      labels: ["Building", "Developing", "Rebuilding", "Exploring"],
      items: [
        "bts.online as a living Digital HQ",
        "GOATRECRUTAINER and new content formats",
        "RateCom as an independent recruiting review platform",
        "Recruiting, AI, storytelling and digital communities",
      ],
    },
    homeAbout: {
      eyebrow: "About / Positioning",
      title: "Make the missing context visible.",
      connection: "bts.online makes the relationship visible: recruiting work, conversations, products and reflection tools are different responses to the same question — what context is missing before a decision can genuinely fit the person?",
      cta: "Explore the positioning and the work",
      principle: "Principle",
    },
    contact: {
      eyebrow: "Open channel / Contact",
      title: "Let’s build something meaningful.",
      introduction: "For recruiting projects, interviews, creative collaborations, platform ideas or conversations about work, people and development.",
      goat: "Explore GOATRECRUTAINER",
      ratecom: "Explore RateCom",
      intersections: "Possible intersections",
      socialEyebrow: "Social presence",
      socialTitle: "Follow the work where it lives.",
      socialDescription: "Career stories and GOATRECRUTAINER formats on TikTok, Instagram and YouTube — and Benjamin’s professional profile on LinkedIn.",
      external: "External ↗",
      externalLabel: "external website, opens in a new tab",
      bookingTitle: "A conversation with context.",
      bookingDescription: "Booking will become available here once a public booking link has been verified.",
      bookingUnavailable: "Public link under verification — booking is not available yet.",
      projectsAriaLabel: "Projects in the Digital HQ",
      bookingEyebrow: "Booking",
      bookingAction: "Book a meeting",
    },
    interviews: {
      eyebrow: "Interviews / Human Archive",
      title: "Every résumé has a story beneath it.",
      description: "Conversation formats about origins, work, turning points and what drives people — without inventing a hero’s journey.",
      quoteLabel: "The recurring guiding question",
      formats: [
        { title: "Career Spotlight", description: "People, career paths and the stories behind CVs.", focus: "Career · Origins · Decisions" },
        { title: "Service Spotlight", description: "Founders, organisations, services and the people behind their offers.", focus: "Entrepreneurship · Service · Principles" },
        { title: "Personal Conversations", description: "Open conversations about turning points, ambition, identity and development.", focus: "Identity · Change · Future" },
      ],
      countTitle: "Six conversations. Six perspectives of their own.",
      countDescription: "Explore Career and Service Spotlight together — with video, chapters and editorial takeaways.",
      cta: "People / Spotlight",
      guidingQuestion: "What from your childhood do we need to know to understand you and your CV?",
    },
    writing: {
      eyebrow: "Writing / Field Notes",
      title: "Thoughts worth keeping, questions worth sharing.",
      description: "A digital magazine for thoughts about work, identity, courage and the stories we tell about ourselves.",
      readingTime: (minutes) => `${minutes} min read`,
      read: "Read article",
      preview: "Preview",
      explore: "Explore Writing",
    },
    echo: {
      eyebrow: "EchoWall / Community Signal",
      title: "Signals from the people around this HQ.",
      description: "Thoughts, feedback, reactions and messages — curated, moderated and with room for the people behind each signal.",
      emptyTitle: "The wall is still quiet.",
      emptyDescription: "The first echoes are being collected and moderated. You can already leave a message and become part of the emerging community wall.",
      unavailableTitle: "EchoWall is taking a short pause.",
      unavailableDescription: "Public echoes cannot be loaded right now. The EchoWall page remains available.",
      explore: "Explore EchoWall",
      leave: "Leave an echo",
    },
  },
  es: {
    hero: { role: "Recruiter. Creador. Narrador. Impulsor de comunidades.", claim: "Historias, carreras y comunidades en torno a personas que merecen un escenario.", introduction: "Conecto recruiting, emprendimiento, narrativa y creación de comunidades. bts.online es mi hogar digital en crecimiento para proyectos, personas, reflexiones e ideas.", explore: "Explorar el HQ", connect: "Hablemos", signalLabel: "Señal del HQ / En vivo", lastSignal: "Última señal · Ahora", signals: ["En construcción", "Cerca de Fráncfort", "Desarrollo abierto", "Siempre evolucionando"], signalAriaLabel: "Señal del HQ" },
    now: { eyebrow: "Transmisión en vivo", description: "Lo que ocupa mi atención, lo que estoy creando y dónde pongo el foco ahora.", labels: ["Construyendo", "Desarrollando", "Reconstruyendo", "Explorando"], items: ["bts.online como un Digital HQ vivo", "GOATRECRUTAINER y nuevos formatos de contenido", "RateCom como plataforma independiente de evaluación del recruiting", "Recruiting, IA, narrativa y comunidades digitales"] },
    homeAbout: { eyebrow: "Sobre mí / Posicionamiento", title: "Hacer visible el contexto que falta.", connection: "bts.online muestra el hilo que une el trabajo de recruiting, las conversaciones, los productos y las herramientas de reflexión: distintas respuestas a una misma pregunta — ¿qué contexto falta antes de que una decisión pueda encajar de verdad con la persona?", cta: "Ver el posicionamiento y el trabajo", principle: "Principio" },
    contact: { eyebrow: "Canal abierto / Contacto", title: "Construyamos algo con sentido.", introduction: "Para proyectos de recruiting, entrevistas, colaboraciones creativas, ideas de plataforma o conversaciones sobre trabajo, personas y desarrollo.", goat: "Explorar GOATRECRUTAINER", ratecom: "Explorar RateCom", intersections: "Puntos de encuentro", socialEyebrow: "Presencia social", socialTitle: "Sigue el trabajo allí donde sucede.", socialDescription: "Historias profesionales y formatos de GOATRECRUTAINER en TikTok, Instagram y YouTube; y el perfil profesional de Benjamin en LinkedIn.", external: "Externo ↗", externalLabel: "sitio web externo, se abre en una pestaña nueva", bookingTitle: "Una conversación con contexto.", bookingDescription: "La reserva estará disponible aquí cuando se haya verificado un enlace público.", bookingUnavailable: "Enlace público en verificación — todavía no es posible reservar.", projectsAriaLabel: "Proyectos del Digital HQ", bookingEyebrow: "Reserva", bookingAction: "Reservar una conversación" },
    interviews: { eyebrow: "Entrevistas / Archivo humano", title: "Detrás de cada currículum hay una historia.", description: "Conversaciones sobre origen, trabajo, puntos de inflexión y lo que mueve a las personas, sin inventar un viaje heroico.", quoteLabel: "La pregunta que vuelve", formats: [{ title: "Career Spotlight", description: "Personas, trayectorias y las historias detrás de los currículums.", focus: "Carrera · Origen · Decisiones" }, { title: "Service Spotlight", description: "Fundadores, organizaciones, servicios y las personas que hay detrás.", focus: "Emprendimiento · Servicio · Convicciones" }, { title: "Personal Conversations", description: "Conversaciones abiertas sobre giros, ambición, identidad y desarrollo.", focus: "Identidad · Cambio · Futuro" }], countTitle: "Seis conversaciones. Seis perspectivas propias.", countDescription: "Descubre Career y Service Spotlight juntos, con vídeo, capítulos y claves editoriales.", cta: "People / Spotlight", guidingQuestion: "¿Qué debemos saber de tu infancia para comprenderte a ti y a tu currículum?" },
    writing: { eyebrow: "Writing / Notas de campo", title: "Ideas que merece la pena conservar. Preguntas que conviene compartir.", description: "Una revista digital sobre trabajo, identidad, valentía y las historias que nos contamos.", readingTime: (minutes) => `${minutes} min de lectura`, read: "Leer artículo", preview: "Vista previa", explore: "Explorar Writing" },
    echo: { eyebrow: "EchoWall / Señal de comunidad", title: "Señales de las personas que rodean este HQ.", description: "Reflexiones, comentarios, reacciones y mensajes: seleccionados, moderados y con espacio para quien hay detrás de cada señal.", emptyTitle: "La pared aún está en silencio.", emptyDescription: "Los primeros ecos se están recopilando y moderando. Ya puedes dejar un mensaje y formar parte de esta pared comunitaria que empieza a crecer.", unavailableTitle: "EchoWall hace una breve pausa.", unavailableDescription: "Ahora mismo no se pueden cargar los ecos públicos. La página de EchoWall sigue disponible.", explore: "Explorar EchoWall", leave: "Dejar un eco" },
  },
  tr: {
    hero: { role: "Recruiter. Üreten. Hikâye anlatan. Topluluk kuran.", claim: "Sahneyi hak eden insanların etrafında şekillenen hikâyeler, kariyerler ve topluluklar.", introduction: "İşe alım, girişimcilik, hikâye anlatıcılığı ve topluluk kurmayı bir araya getiriyorum. bts.online; projeler, insanlar, düşünceler ve fikirler için büyüyen dijital evim.", explore: "HQ’yu keşfet", connect: "İletişime geç", signalLabel: "HQ Sinyali / Canlı", lastSignal: "Son sinyal · Şimdi", signals: ["İnşa ediliyor", "Frankfurt yakınında", "Herkese açık geliştiriliyor", "Sürekli dönüşüyor"], signalAriaLabel: "HQ sinyali" },
    now: { eyebrow: "Canlı yayın", description: "Şu anda aklımda olanlar, inşa ettiklerim ve odağımı verdiğim alanlar.", labels: ["İnşa ediliyor", "Geliştiriliyor", "Yeniden kuruluyor", "Keşfediliyor"], items: ["Yaşayan bir Digital HQ olarak bts.online", "GOATRECRUTAINER ve yeni içerik formatları", "Bağımsız bir işe alım değerlendirme platformu olarak RateCom", "İşe alım, yapay zekâ, hikâye anlatıcılığı ve dijital topluluklar"] },
    homeAbout: { eyebrow: "Hakkımda / Konumlandırma", title: "Eksik bağlamı görünür kıl.", connection: "bts.online bağlantıyı görünür kılar: işe alım çalışmaları, sohbetler, ürünler ve düşünme araçları aynı soruya verilen farklı yanıtlardır — bir kararın insana gerçekten uygun olabilmesi için hangi bağlam eksik?", cta: "Konumlandırmayı ve çalışmaları keşfet", principle: "İlke" },
    contact: { eyebrow: "Açık kanal / İletişim", title: "Birlikte anlamlı bir şey inşa edelim.", introduction: "İşe alım projeleri, röportajlar, yaratıcı iş birlikleri, platform fikirleri veya iş, insan ve gelişim üzerine sohbetler için.", goat: "GOATRECRUTAINER’ı keşfet", ratecom: "RateCom’u keşfet", intersections: "Olası kesişimler", socialEyebrow: "Sosyal varlık", socialTitle: "Çalışmayı gerçekleştiği yerde takip et.", socialDescription: "TikTok, Instagram ve YouTube’da kariyer hikâyeleri ve GOATRECRUTAINER formatları; LinkedIn’de Benjamin’in profesyonel profili.", external: "Harici ↗", externalLabel: "harici web sitesi, yeni sekmede açılır", bookingTitle: "Bağlamı olan bir sohbet.", bookingDescription: "Herkese açık rezervasyon bağlantısı doğrulandığında burada randevu alınabilecek.", bookingUnavailable: "Herkese açık bağlantı doğrulanıyor — henüz rezervasyon yapılamıyor.", projectsAriaLabel: "Digital HQ projeleri", bookingEyebrow: "Randevu", bookingAction: "Görüşme planla" },
    interviews: { eyebrow: "Röportajlar / İnsan arşivi", title: "Her özgeçmişin altında bir hikâye var.", description: "Köken, iş, dönüm noktaları ve insanları harekete geçiren şeyler üzerine; uydurulmuş kahramanlık anlatıları olmadan sohbetler.", quoteLabel: "Tekrarlanan temel soru", formats: [{ title: "Career Spotlight", description: "İnsanlar, kariyer yolları ve özgeçmişlerin arkasındaki hikâyeler.", focus: "Kariyer · Köken · Kararlar" }, { title: "Service Spotlight", description: "Kurucular, kuruluşlar, hizmetler ve tekliflerin arkasındaki insanlar.", focus: "Girişimcilik · Hizmet · Yaklaşım" }, { title: "Personal Conversations", description: "Dönüm noktaları, hedefler, kimlik ve gelişim üzerine açık sohbetler.", focus: "Kimlik · Değişim · Gelecek" }], countTitle: "Altı sohbet. Kendine özgü altı bakış.", countDescription: "Career ve Service Spotlight’ı video, bölümler ve editoryal çıkarımlarla birlikte keşfet.", cta: "People / Spotlight", guidingQuestion: "Seni ve özgeçmişini anlamamız için çocukluğundan neyi bilmemiz gerekir?" },
    writing: { eyebrow: "Writing / Saha notları", title: "Saklamaya değer düşünceler. Paylaşmaya değer sorular.", description: "İş, kimlik, cesaret ve kendimiz hakkında anlattığımız hikâyeler üzerine dijital bir dergi.", readingTime: (minutes) => `${minutes} dk okuma`, read: "Makaleyi oku", preview: "Ön izleme", explore: "Writing’i keşfet" },
    echo: { eyebrow: "EchoWall / Topluluk sinyali", title: "Bu HQ’nun çevresindeki insanlardan sinyaller.", description: "Düşünceler, geri bildirimler, tepkiler ve mesajlar — seçilmiş, denetlenmiş ve her sinyalin arkasındaki insana yer açan.", emptyTitle: "Duvar şimdilik sessiz.", emptyDescription: "İlk yankılar toplanıyor ve denetleniyor. Şimdiden bir mesaj bırakıp oluşan topluluk duvarının parçası olabilirsin.", unavailableTitle: "EchoWall kısa bir mola veriyor.", unavailableDescription: "Herkese açık yankılar şu anda yüklenemiyor. EchoWall sayfası erişilebilir olmaya devam ediyor.", explore: "EchoWall’u keşfet", leave: "Bir yankı bırak" },
  },
  pl: {
    hero: { role: "Rekruter. Twórca. Narrator. Budowniczy społeczności.", claim: "Historie, kariery i społeczności skupione wokół ludzi, którzy zasługują na swoją scenę.", introduction: "Łączę rekrutację, przedsiębiorczość, storytelling i budowanie społeczności. bts.online to mój rozwijający się cyfrowy dom dla projektów, ludzi, przemyśleń i pomysłów.", explore: "Odkryj HQ", connect: "Skontaktujmy się", signalLabel: "Sygnał HQ / Na żywo", lastSignal: "Ostatni sygnał · Teraz", signals: ["W budowie", "W pobliżu Frankfurtu", "Budowane publicznie", "W ciągłym ruchu"], signalAriaLabel: "Sygnał HQ" },
    now: { eyebrow: "Transmisja na żywo", description: "To, czym teraz się zajmuję, co buduję i na czym skupiam uwagę.", labels: ["Buduję", "Rozwijam", "Przebudowuję", "Odkrywam"], items: ["bts.online jako żywe Digital HQ", "GOATRECRUTAINER i nowe formaty treści", "RateCom jako niezależna platforma ocen doświadczeń rekrutacyjnych", "Rekrutacja, AI, storytelling i społeczności cyfrowe"] },
    homeAbout: { eyebrow: "O mnie / Pozycjonowanie", title: "Uwidaczniać brakujący kontekst.", connection: "bts.online pokazuje wspólny wątek: praca rekrutacyjna, rozmowy, produkty i narzędzia refleksji odpowiadają na jedno pytanie — jakiego kontekstu brakuje, zanim decyzja naprawdę będzie pasować do człowieka?", cta: "Poznaj pozycjonowanie i pracę", principle: "Zasada" },
    contact: { eyebrow: "Otwarty kanał / Kontakt", title: "Zbudujmy coś, co ma znaczenie.", introduction: "W sprawie projektów rekrutacyjnych, wywiadów, kreatywnej współpracy, pomysłów na platformy lub rozmów o pracy, ludziach i rozwoju.", goat: "Odkryj GOATRECRUTAINER", ratecom: "Odkryj RateCom", intersections: "Możliwe punkty styku", socialEyebrow: "Obecność społecznościowa", socialTitle: "Śledź pracę tam, gdzie się dzieje.", socialDescription: "Historie zawodowe i formaty GOATRECRUTAINER na TikToku, Instagramie i YouTubie oraz profil zawodowy Benjamina na LinkedIn.", external: "Zewnętrzne ↗", externalLabel: "zewnętrzna witryna, otwiera się w nowej karcie", bookingTitle: "Rozmowa z kontekstem.", bookingDescription: "Rezerwacja będzie dostępna po zweryfikowaniu publicznego linku.", bookingUnavailable: "Publiczny link jest weryfikowany — rezerwacja nie jest jeszcze dostępna.", projectsAriaLabel: "Projekty w Digital HQ", bookingEyebrow: "Spotkanie", bookingAction: "Umów rozmowę" },
    interviews: { eyebrow: "Wywiady / Archiwum ludzkich historii", title: "Pod każdym CV kryje się historia.", description: "Rozmowy o pochodzeniu, pracy, punktach zwrotnych i tym, co napędza ludzi — bez wymyślania bohaterskiej opowieści.", quoteLabel: "Powracające pytanie przewodnie", formats: [{ title: "Career Spotlight", description: "Ludzie, ścieżki zawodowe i historie kryjące się za CV.", focus: "Kariera · Pochodzenie · Decyzje" }, { title: "Service Spotlight", description: "Założyciele, organizacje, usługi i ludzie stojący za ofertami.", focus: "Przedsiębiorczość · Usługa · Postawa" }, { title: "Personal Conversations", description: "Otwarte rozmowy o punktach zwrotnych, ambicji, tożsamości i rozwoju.", focus: "Tożsamość · Zmiana · Przyszłość" }], countTitle: "Sześć rozmów. Sześć odrębnych perspektyw.", countDescription: "Odkryj razem Career i Service Spotlight — z wideo, rozdziałami i redakcyjnymi wnioskami.", cta: "People / Spotlight", guidingQuestion: "Co z twojego dzieciństwa musimy wiedzieć, żeby zrozumieć ciebie i twoje CV?" },
    writing: { eyebrow: "Writing / Notatki terenowe", title: "Myśli, które warto zachować. Pytania, którymi warto się dzielić.", description: "Cyfrowy magazyn o pracy, tożsamości, odwadze i historiach, które opowiadamy sami o sobie.", readingTime: (minutes) => `${minutes} min czytania`, read: "Czytaj artykuł", preview: "Podgląd", explore: "Odkryj Writing" },
    echo: { eyebrow: "EchoWall / Sygnał społeczności", title: "Sygnały od ludzi skupionych wokół tego HQ.", description: "Myśli, opinie, reakcje i wiadomości — wybrane, moderowane i pozostawiające miejsce dla człowieka stojącego za sygnałem.", emptyTitle: "Na ścianie jest jeszcze cicho.", emptyDescription: "Pierwsze echa są zbierane i moderowane. Już teraz możesz zostawić wiadomość i współtworzyć powstającą ścianę społeczności.", unavailableTitle: "EchoWall ma krótką przerwę.", unavailableDescription: "Publicznych ech nie można teraz załadować. Strona EchoWall pozostaje dostępna.", explore: "Odkryj EchoWall", leave: "Zostaw echo" },
  },
  el: {
    hero: { role: "Recruiter. Δημιουργός. Αφηγητής. Χτίζω κοινότητες.", claim: "Ιστορίες, σταδιοδρομίες και κοινότητες γύρω από ανθρώπους που αξίζουν χώρο να ακουστούν.", introduction: "Συνδέω το recruiting, την επιχειρηματικότητα, την αφήγηση και τη δημιουργία κοινοτήτων. Το bts.online είναι το ψηφιακό μου σπίτι που εξελίσσεται, για έργα, ανθρώπους, σκέψεις και ιδέες.", explore: "Εξερεύνησε το HQ", connect: "Ας μιλήσουμε", signalLabel: "Σήμα HQ / Ζωντανά", lastSignal: "Τελευταίο σήμα · Τώρα", signals: ["Υπό κατασκευή", "Κοντά στη Φρανκφούρτη", "Ανοιχτή ανάπτυξη", "Σε συνεχή εξέλιξη"], signalAriaLabel: "Σήμα HQ" },
    now: { eyebrow: "Ζωντανή μετάδοση", description: "Τι με απασχολεί, τι χτίζω και πού στρέφω την προσοχή μου αυτή την περίοδο.", labels: ["Χτίζεται", "Αναπτύσσεται", "Ξαναχτίζεται", "Διερευνάται"], items: ["Το bts.online ως ζωντανό Digital HQ", "GOATRECRUTAINER και νέες μορφές περιεχομένου", "Το RateCom ως ανεξάρτητη πλατφόρμα αξιολόγησης εμπειριών recruiting", "Recruiting, ΤΝ, αφήγηση και ψηφιακές κοινότητες"] },
    homeAbout: { eyebrow: "Σχετικά / Τοποθέτηση", title: "Να γίνεται ορατό το πλαίσιο που λείπει.", connection: "Το bts.online αποκαλύπτει τη σύνδεση: η δουλειά στο recruiting, οι συζητήσεις, τα προϊόντα και τα εργαλεία αναστοχασμού απαντούν με διαφορετικούς τρόπους στην ίδια ερώτηση — ποιο πλαίσιο λείπει πριν μια απόφαση ταιριάξει πραγματικά στον άνθρωπο;", cta: "Δες την τοποθέτηση και τη δουλειά", principle: "Αρχή" },
    contact: { eyebrow: "Ανοιχτό κανάλι / Επικοινωνία", title: "Ας χτίσουμε κάτι με ουσία.", introduction: "Για έργα recruiting, συνεντεύξεις, δημιουργικές συνεργασίες, ιδέες πλατφορμών ή συζητήσεις για την εργασία, τους ανθρώπους και την εξέλιξη.", goat: "Εξερεύνησε το GOATRECRUTAINER", ratecom: "Εξερεύνησε το RateCom", intersections: "Πιθανά σημεία σύνδεσης", socialEyebrow: "Κοινωνική παρουσία", socialTitle: "Ακολούθησε τη δουλειά εκεί όπου συμβαίνει.", socialDescription: "Ιστορίες σταδιοδρομίας και μορφές GOATRECRUTAINER στο TikTok, το Instagram και το YouTube — και το επαγγελματικό προφίλ του Benjamin στο LinkedIn.", external: "Εξωτερικό ↗", externalLabel: "εξωτερικός ιστότοπος, ανοίγει σε νέα καρτέλα", bookingTitle: "Μια συζήτηση με πλαίσιο.", bookingDescription: "Η κράτηση θα ενεργοποιηθεί εδώ όταν επαληθευτεί ο δημόσιος σύνδεσμος.", bookingUnavailable: "Ο δημόσιος σύνδεσμος επαληθεύεται — η κράτηση δεν είναι ακόμη διαθέσιμη.", projectsAriaLabel: "Έργα στο Digital HQ", bookingEyebrow: "Ραντεβού", bookingAction: "Κλείσε μια συζήτηση" },
    interviews: { eyebrow: "Συνεντεύξεις / Ανθρώπινο αρχείο", title: "Πίσω από κάθε βιογραφικό υπάρχει μια ιστορία.", description: "Συζητήσεις για την καταγωγή, την εργασία, τις καμπές και όσα κινητοποιούν τους ανθρώπους — χωρίς επινοημένες ηρωικές αφηγήσεις.", quoteLabel: "Η ερώτηση που επιστρέφει", formats: [{ title: "Career Spotlight", description: "Άνθρωποι, επαγγελματικές διαδρομές και οι ιστορίες πίσω από τα βιογραφικά.", focus: "Σταδιοδρομία · Καταγωγή · Αποφάσεις" }, { title: "Service Spotlight", description: "Ιδρυτές, οργανισμοί, υπηρεσίες και οι άνθρωποι πίσω από τις προτάσεις.", focus: "Επιχειρηματικότητα · Υπηρεσία · Στάση" }, { title: "Personal Conversations", description: "Ανοιχτές συζητήσεις για καμπές, φιλοδοξίες, ταυτότητα και εξέλιξη.", focus: "Ταυτότητα · Αλλαγή · Μέλλον" }], countTitle: "Έξι συζητήσεις. Έξι ξεχωριστές οπτικές.", countDescription: "Ανακάλυψε μαζί τα Career και Service Spotlight — με βίντεο, κεφάλαια και συντακτικά συμπεράσματα.", cta: "People / Spotlight", guidingQuestion: "Τι χρειάζεται να γνωρίζουμε από την παιδική σου ηλικία για να καταλάβουμε εσένα και το βιογραφικό σου;" },
    writing: { eyebrow: "Writing / Σημειώσεις πεδίου", title: "Σκέψεις που αξίζει να μείνουν. Ερωτήματα που αξίζει να μοιραστούμε.", description: "Ένα ψηφιακό περιοδικό για την εργασία, την ταυτότητα, το θάρρος και τις ιστορίες που λέμε για τον εαυτό μας.", readingTime: (minutes) => `${minutes} λεπτά ανάγνωσης`, read: "Διάβασε το άρθρο", preview: "Προεπισκόπηση", explore: "Εξερεύνησε το Writing" },
    echo: { eyebrow: "EchoWall / Σήμα κοινότητας", title: "Σήματα από τους ανθρώπους γύρω από αυτό το HQ.", description: "Σκέψεις, σχόλια, αντιδράσεις και μηνύματα — επιμελημένα, ελεγχόμενα και με χώρο για τον άνθρωπο πίσω από κάθε σήμα.", emptyTitle: "Ο τοίχος είναι ακόμη ήσυχος.", emptyDescription: "Οι πρώτες αντηχήσεις συλλέγονται και ελέγχονται. Μπορείς ήδη να αφήσεις ένα μήνυμα και να γίνεις μέρος του τοίχου της κοινότητας που σχηματίζεται.", unavailableTitle: "Το EchoWall κάνει μια μικρή παύση.", unavailableDescription: "Οι δημόσιες αναρτήσεις δεν μπορούν να φορτωθούν τώρα. Η σελίδα EchoWall παραμένει διαθέσιμη.", explore: "Εξερεύνησε το EchoWall", leave: "Άφησε ένα μήνυμα" },
  },
  ru: {
    hero: { role: "Рекрутер. Создатель. Рассказчик. Организатор сообществ.", claim: "Истории, карьеры и сообщества вокруг людей, которым важно дать сцену.", introduction: "Я соединяю рекрутинг, предпринимательство, сторителлинг и развитие сообществ. bts.online — мой растущий цифровой дом для проектов, людей, мыслей и идей.", explore: "Исследовать HQ", connect: "Связаться", signalLabel: "Сигнал HQ / В эфире", lastSignal: "Последний сигнал · Сейчас", signals: ["В процессе создания", "Недалеко от Франкфурта", "Открытая разработка", "Постоянно развивается"], signalAriaLabel: "Сигнал HQ" },
    now: { eyebrow: "Прямой эфир", description: "То, над чем я сейчас думаю, что создаю и чему уделяю внимание.", labels: ["Создаю", "Развиваю", "Перестраиваю", "Исследую"], items: ["bts.online как живой Digital HQ", "GOATRECRUTAINER и новые форматы контента", "RateCom как независимая платформа отзывов о рекрутинге", "Рекрутинг, ИИ, сторителлинг и цифровые сообщества"] },
    homeAbout: { eyebrow: "Обо мне / Позиционирование", title: "Делать видимым недостающий контекст.", connection: "bts.online показывает общую связь: работа в рекрутинге, разговоры, продукты и инструменты для размышления по-разному отвечают на один вопрос — какого контекста не хватает, прежде чем решение действительно сможет подойти человеку?", cta: "Открыть позиционирование и работу", principle: "Принцип" },
    contact: { eyebrow: "Открытый канал / Контакт", title: "Давайте создадим что-то значимое.", introduction: "Для рекрутинговых проектов, интервью, творческого сотрудничества, идей платформ или разговоров о работе, людях и развитии.", goat: "Открыть GOATRECRUTAINER", ratecom: "Открыть RateCom", intersections: "Возможные точки пересечения", socialEyebrow: "Социальные площадки", socialTitle: "Следите за работой там, где она происходит.", socialDescription: "Карьерные истории и форматы GOATRECRUTAINER в TikTok, Instagram и YouTube, а также профессиональный профиль Benjamin в LinkedIn.", external: "Внешний ресурс ↗", externalLabel: "внешний сайт, откроется в новой вкладке", bookingTitle: "Разговор с контекстом.", bookingDescription: "Запись станет доступна после проверки публичной ссылки.", bookingUnavailable: "Публичная ссылка проверяется — запись пока недоступна.", projectsAriaLabel: "Проекты в Digital HQ", bookingEyebrow: "Встреча", bookingAction: "Запланировать разговор" },
    interviews: { eyebrow: "Интервью / Архив человеческих историй", title: "За каждым резюме стоит история.", description: "Разговоры о происхождении, работе, поворотных моментах и о том, что движет людьми — без выдуманной героической линии.", quoteLabel: "Главный повторяющийся вопрос", formats: [{ title: "Career Spotlight", description: "Люди, карьерные пути и истории, стоящие за резюме.", focus: "Карьера · Происхождение · Решения" }, { title: "Service Spotlight", description: "Основатели, организации, услуги и люди, стоящие за предложениями.", focus: "Предпринимательство · Сервис · Подход" }, { title: "Personal Conversations", description: "Открытые разговоры о поворотных моментах, стремлениях, идентичности и развитии.", focus: "Идентичность · Изменения · Будущее" }], countTitle: "Шесть разговоров. Шесть самостоятельных взглядов.", countDescription: "Исследуйте Career и Service Spotlight вместе — с видео, главами и редакционными выводами.", cta: "People / Spotlight", guidingQuestion: "Что нам нужно знать о вашем детстве, чтобы понять вас и ваше резюме?" },
    writing: { eyebrow: "Writing / Полевые заметки", title: "Мысли, которые стоит сохранить. Вопросы, которыми стоит поделиться.", description: "Цифровой журнал о работе, идентичности, смелости и историях, которые мы рассказываем о себе.", readingTime: (minutes) => `${minutes} мин чтения`, read: "Читать статью", preview: "Предпросмотр", explore: "Открыть Writing" },
    echo: { eyebrow: "EchoWall / Сигнал сообщества", title: "Сигналы от людей вокруг этого HQ.", description: "Мысли, отзывы, реакции и сообщения — отобранные, модерируемые и оставляющие место для человека за каждым сигналом.", emptyTitle: "На стене пока тихо.", emptyDescription: "Первые отклики собираются и проходят модерацию. Вы уже можете оставить сообщение и стать частью формирующейся стены сообщества.", unavailableTitle: "EchoWall ненадолго остановилась.", unavailableDescription: "Сейчас публичные отклики не загружаются. Страница EchoWall остаётся доступной.", explore: "Открыть EchoWall", leave: "Оставить отклик" },
  },
};

export function getHomeCopy(locale: Locale): HomeCopy {
  return dictionaries[locale];
}
