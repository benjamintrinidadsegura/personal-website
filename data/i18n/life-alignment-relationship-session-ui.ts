import type { Locale } from "@/lib/i18n/config";

type SessionStatus = "active" | "accepted" | "completed" | "expired" | "revoked" | "invited" | "joined" | "in-progress" | "withdrawn" | "draft" | "awaiting-acknowledgement" | "finalized" | "none";

type SessionUiCopy = {
  invitedBy: (name: string) => string;
  storedPrivate: string; stopAnytime: string; displayName: string; displayNameHelp: string;
  consentLead: string; consentBody: string; accept: string; decline: string;
  expired: string; revoked: string; unavailable: string; privateLabel: string; privateStateBody: string;
  otherParticipant: string; deleteParticipation: string; revokeInvite: string;
  sharedTitle: string; sharedEvidence: string; round: string; sharedAlignment: string;
  finalizedAgreements: string; agreementLegal: string; agreementDescription: string;
  addItem: string; saveDraft: string; acknowledge: (revision: number) => string;
  state: string; revision: string; editResets: string;
  status: Record<SessionStatus, string>;
};

const copy: Record<Locale, SessionUiCopy> = {
  de: {
    invitedBy: (name) => `${name} lädt dich ein, zuerst unabhängig zu reflektieren. Danach kann eine gemeinsame Interpretation entstehen.`,
    storedPrivate: "Deine strukturierten Antworten und deine Einwilligung werden nur für diese private Sitzung gespeichert. Sie sind nicht öffentlich, indexiert, für Marketing genutzt oder durch KI verarbeitet.",
    stopAnytime: "Du kannst jederzeit aufhören. Vor der gemeinsamen Finalisierung kannst du deine Teilnahme löschen; finalisierte gemeinsame Historie wird nicht einseitig umgeschrieben.",
    displayName: "Anzeigename", displayNameHelp: "2–40 Zeichen. E-Mail oder rechtlicher Name sind nicht erforderlich.",
    consentLead: "Ich möchte teilnehmen.", consentBody: "Ich verstehe, was beim Antworten privat bleibt und was nach beiden Abschlüssen in das abgeleitete gemeinsame Ergebnis eingeht. Dies ist nur eine Teilnahme-, keine Marketingeinwilligung.",
    accept: "Annehmen und beginnen", decline: "Ablehnen und verlassen", expired: "Diese private Einladung ist abgelaufen.", revoked: "Diese private Einladung ist nicht mehr aktiv.", unavailable: "Diese private Einladung ist nicht verfügbar.",
    privateLabel: "Privates Life Alignment", privateStateBody: "Über diesen Link sind keine privaten Sitzungsinformationen verfügbar. Bitte die einladende Person gegebenenfalls um eine neue Einladung.",
    otherParticipant: "Andere Person", deleteParticipation: "Meine Teilnahme löschen", revokeInvite: "Einladung widerrufen",
    sharedTitle: "Was zwischen euch sichtbar wird", sharedEvidence: "Rohantworten bleiben privat; diese Hinweise werden aus den abgeschlossenen Antwortsets und ihrer angegebenen Bedeutung abgeleitet.",
    round: "Runde", sharedAlignment: "Gemeinsames Alignment", finalizedAgreements: "Finalisierte Vereinbarungen", agreementLegal: "Dies sind gemeinsame Notizen, kein Rechtsvertrag.",
    agreementDescription: "Haltet 1–5 kurze gemeinsame Zusagen fest. Sie sind optionale persönliche Notizen, keine Rechtsverträge. Founder-Absprachen zu Anteilen, Gehalt oder Governance gehören in geeignete Dokumente außerhalb von Life Alignment.",
    addItem: "Punkt hinzufügen", saveDraft: "Entwurf speichern", acknowledge: (revision) => `Revision ${revision} bestätigen`, state: "Status", revision: "Revision", editResets: "Bearbeiten setzt frühere Bestätigungen zurück.",
    status: { active: "aktiv", accepted: "angenommen", completed: "abgeschlossen", expired: "abgelaufen", revoked: "widerrufen", invited: "eingeladen", joined: "beigetreten", "in-progress": "in Bearbeitung", withdrawn: "zurückgezogen", draft: "Entwurf", "awaiting-acknowledgement": "wartet auf Bestätigung", finalized: "finalisiert", none: "keine" },
  },
  en: {
    invitedBy: (name) => `${name} invited you to reflect independently before a shared interpretation becomes available.`,
    storedPrivate: "Your structured answers and consent are stored only for this private session. They are not public, indexed, used for marketing or processed by AI.",
    stopAnytime: "You may stop at any time. Before shared finalization, you can delete your participation; finalized shared history is not rewritten unilaterally.",
    displayName: "Display name", displayNameHelp: "2–40 characters. No email or legal name is required.", consentLead: "I choose to participate.", consentBody: "I understand what remains private while answering and what becomes part of the derived shared result after both people finish. This is participation consent only, not marketing consent.",
    accept: "Accept and begin", decline: "Decline and leave", expired: "This private invitation has expired.", revoked: "This private invitation is no longer active.", unavailable: "This private invitation is unavailable.", privateLabel: "Private Life Alignment", privateStateBody: "No private session information is available from this link. Ask the inviter for a new invitation if appropriate.",
    otherParticipant: "Other participant", deleteParticipation: "Delete my participation", revokeInvite: "Revoke invitation", sharedTitle: "What becomes visible between you", sharedEvidence: "Raw answers remain private; these insights are derived from the completed answer sets and their stated importance.",
    round: "Round", sharedAlignment: "Shared Alignment", finalizedAgreements: "Finalized Agreements", agreementLegal: "These are shared notes, not a legal contract.", agreementDescription: "Add 1–5 concise shared commitments. They are optional personal notes, not legal contracts. Founder equity, salary or governance notes require proper documentation outside Life Alignment.",
    addItem: "Add item", saveDraft: "Save draft", acknowledge: (revision) => `Acknowledge revision ${revision}`, state: "State", revision: "Revision", editResets: "Editing resets previous acknowledgements.",
    status: { active: "active", accepted: "accepted", completed: "completed", expired: "expired", revoked: "revoked", invited: "invited", joined: "joined", "in-progress": "in progress", withdrawn: "withdrawn", draft: "draft", "awaiting-acknowledgement": "awaiting acknowledgement", finalized: "finalized", none: "none" },
  },
  es: {
    invitedBy: (name) => `${name} te invita a reflexionar por separado antes de que aparezca una interpretación compartida.`,
    storedPrivate: "Tus respuestas estructuradas y tu consentimiento se guardan solo para esta sesión privada. No son públicos, indexados, usados para marketing ni procesados por IA.", stopAnytime: "Puedes detenerte cuando quieras. Antes de la finalización compartida puedes eliminar tu participación; el historial finalizado no se reescribe unilateralmente.",
    displayName: "Nombre visible", displayNameHelp: "2–40 caracteres. No hace falta correo ni nombre legal.", consentLead: "Elijo participar.", consentBody: "Entiendo qué permanece privado y qué pasa al resultado compartido derivado cuando ambas personas terminan. Es consentimiento de participación, no de marketing.",
    accept: "Aceptar y comenzar", decline: "Rechazar y salir", expired: "Esta invitación privada ha caducado.", revoked: "Esta invitación privada ya no está activa.", unavailable: "Esta invitación privada no está disponible.", privateLabel: "Life Alignment privado", privateStateBody: "Este enlace no ofrece información privada de la sesión. Pide una nueva invitación si procede.",
    otherParticipant: "Otra persona", deleteParticipation: "Eliminar mi participación", revokeInvite: "Revocar invitación", sharedTitle: "Lo que se hace visible entre vosotros", sharedEvidence: "Las respuestas originales siguen privadas; estos hallazgos se derivan de los conjuntos completos y su importancia indicada.",
    round: "Ronda", sharedAlignment: "Alignment compartido", finalizedAgreements: "Acuerdos finalizados", agreementLegal: "Son notas compartidas, no un contrato legal.", agreementDescription: "Añadid entre 1 y 5 compromisos breves. Son notas personales opcionales, no contratos. Participaciones, salario o gobernanza entre founders requieren documentación adecuada fuera de Life Alignment.",
    addItem: "Añadir punto", saveDraft: "Guardar borrador", acknowledge: (revision) => `Confirmar revisión ${revision}`, state: "Estado", revision: "Revisión", editResets: "Editar reinicia las confirmaciones anteriores.",
    status: { active: "activa", accepted: "aceptada", completed: "completada", expired: "caducada", revoked: "revocada", invited: "invitada", joined: "incorporada", "in-progress": "en curso", withdrawn: "retirada", draft: "borrador", "awaiting-acknowledgement": "esperando confirmación", finalized: "finalizada", none: "ninguno" },
  },
  tr: {
    invitedBy: (name) => `${name}, ortak yorum açılmadan önce bağımsız düşünmen için seni davet etti.`, storedPrivate: "Yapılandırılmış yanıtların ve onayın yalnızca bu özel oturum için saklanır; herkese açık değildir, dizine eklenmez, pazarlamada veya yapay zekâda kullanılmaz.", stopAnytime: "İstediğin zaman durabilirsin. Ortak sonuç kesinleşmeden katılımını silebilirsin; kesinleşen ortak geçmiş tek taraflı değiştirilmez.",
    displayName: "Görünen ad", displayNameHelp: "2–40 karakter. E-posta veya yasal ad gerekmez.", consentLead: "Katılmayı seçiyorum.", consentBody: "Yanıtlarken neyin gizli kaldığını ve iki kişi bitirince türetilen ortak sonuca neyin girdiğini anlıyorum. Bu yalnızca katılım onayıdır, pazarlama onayı değildir.",
    accept: "Kabul et ve başla", decline: "Reddet ve ayrıl", expired: "Bu özel davetin süresi doldu.", revoked: "Bu özel davet artık etkin değil.", unavailable: "Bu özel davet kullanılamıyor.", privateLabel: "Özel Life Alignment", privateStateBody: "Bu bağlantıdan özel oturum bilgisi alınamaz. Uygunsa davet eden kişiden yeni bir davet iste.",
    otherParticipant: "Diğer katılımcı", deleteParticipation: "Katılımımı sil", revokeInvite: "Daveti iptal et", sharedTitle: "Aranızda görünür olanlar", sharedEvidence: "Ham yanıtlar gizli kalır; bu içgörüler tamamlanan yanıt setlerinden ve belirtilen önemden türetilir.",
    round: "Tur", sharedAlignment: "Ortak Alignment", finalizedAgreements: "Kesinleşen anlaşmalar", agreementLegal: "Bunlar ortak notlardır, hukuki sözleşme değildir.", agreementDescription: "1–5 kısa ortak taahhüt ekleyin. Bunlar isteğe bağlı kişisel notlardır, hukuki sözleşme değildir. Kurucu payı, maaş veya yönetişim notları Life Alignment dışında uygun biçimde belgelenmelidir.",
    addItem: "Madde ekle", saveDraft: "Taslağı kaydet", acknowledge: (revision) => `${revision}. revizyonu onayla`, state: "Durum", revision: "Revizyon", editResets: "Düzenleme önceki onayları sıfırlar.",
    status: { active: "etkin", accepted: "kabul edildi", completed: "tamamlandı", expired: "süresi doldu", revoked: "iptal edildi", invited: "davet edildi", joined: "katıldı", "in-progress": "devam ediyor", withdrawn: "çekildi", draft: "taslak", "awaiting-acknowledgement": "onay bekliyor", finalized: "kesinleşti", none: "yok" },
  },
  pl: {
    invitedBy: (name) => `${name} zaprasza Cię do niezależnej refleksji, zanim pojawi się wspólna interpretacja.`, storedPrivate: "Twoje uporządkowane odpowiedzi i zgoda są przechowywane tylko dla tej prywatnej sesji. Nie są publiczne, indeksowane, używane marketingowo ani przetwarzane przez AI.", stopAnytime: "Możesz przerwać w dowolnej chwili. Przed wspólną finalizacją możesz usunąć udział; sfinalizowana historia nie jest jednostronnie przepisywana.",
    displayName: "Nazwa wyświetlana", displayNameHelp: "2–40 znaków. E-mail ani pełne dane nie są wymagane.", consentLead: "Decyduję się uczestniczyć.", consentBody: "Rozumiem, co pozostaje prywatne oraz co trafia do wspólnego wyniku po ukończeniu obu części. To zgoda na udział, nie na marketing.",
    accept: "Zaakceptuj i zacznij", decline: "Odrzuć i wyjdź", expired: "To prywatne zaproszenie wygasło.", revoked: "To prywatne zaproszenie nie jest już aktywne.", unavailable: "To prywatne zaproszenie jest niedostępne.", privateLabel: "Prywatne Life Alignment", privateStateBody: "Ten link nie udostępnia prywatnych informacji sesji. W razie potrzeby poproś o nowe zaproszenie.",
    otherParticipant: "Druga osoba", deleteParticipation: "Usuń mój udział", revokeInvite: "Cofnij zaproszenie", sharedTitle: "Co staje się widoczne między Wami", sharedEvidence: "Surowe odpowiedzi pozostają prywatne; wnioski wynikają z ukończonych zestawów i wskazanej ważności.",
    round: "Runda", sharedAlignment: "Wspólny Alignment", finalizedAgreements: "Sfinalizowane ustalenia", agreementLegal: "To wspólne notatki, nie umowa prawna.", agreementDescription: "Dodajcie 1–5 krótkich wspólnych zobowiązań. To opcjonalne notatki, nie umowy. Udziały, wynagrodzenie i zasady founderskie wymagają właściwej dokumentacji poza Life Alignment.",
    addItem: "Dodaj punkt", saveDraft: "Zapisz szkic", acknowledge: (revision) => `Potwierdź wersję ${revision}`, state: "Stan", revision: "Wersja", editResets: "Edycja zeruje wcześniejsze potwierdzenia.",
    status: { active: "aktywne", accepted: "przyjęte", completed: "ukończone", expired: "wygasłe", revoked: "cofnięte", invited: "zaproszona", joined: "dołączona", "in-progress": "w toku", withdrawn: "wycofana", draft: "szkic", "awaiting-acknowledgement": "czeka na potwierdzenie", finalized: "sfinalizowane", none: "brak" },
  },
  el: {
    invitedBy: (name) => `${name} σε προσκαλεί να αναστοχαστείς ανεξάρτητα πριν εμφανιστεί κοινή ερμηνεία.`, storedPrivate: "Οι δομημένες απαντήσεις και η συναίνεσή σου αποθηκεύονται μόνο για αυτή την ιδιωτική συνεδρία. Δεν είναι δημόσιες, δεν ευρετηριάζονται και δεν χρησιμοποιούνται για μάρκετινγκ ή AI.", stopAnytime: "Μπορείς να σταματήσεις οποτεδήποτε. Πριν την κοινή οριστικοποίηση μπορείς να διαγράψεις τη συμμετοχή σου· το οριστικοποιημένο κοινό ιστορικό δεν αλλάζει μονομερώς.",
    displayName: "Εμφανιζόμενο όνομα", displayNameHelp: "2–40 χαρακτήρες. Δεν απαιτείται email ή νομικό όνομα.", consentLead: "Επιλέγω να συμμετάσχω.", consentBody: "Κατανοώ τι μένει ιδιωτικό και τι εντάσσεται στο κοινό αποτέλεσμα όταν ολοκληρώσουν και οι δύο. Είναι συναίνεση συμμετοχής, όχι μάρκετινγκ.",
    accept: "Αποδοχή και έναρξη", decline: "Απόρριψη και έξοδος", expired: "Η ιδιωτική πρόσκληση έληξε.", revoked: "Η ιδιωτική πρόσκληση δεν είναι πλέον ενεργή.", unavailable: "Η ιδιωτική πρόσκληση δεν είναι διαθέσιμη.", privateLabel: "Ιδιωτικό Life Alignment", privateStateBody: "Δεν υπάρχουν ιδιωτικές πληροφορίες συνεδρίας σε αυτόν τον σύνδεσμο. Ζήτησε νέα πρόσκληση αν χρειάζεται.",
    otherParticipant: "Άλλο άτομο", deleteParticipation: "Διαγραφή συμμετοχής", revokeInvite: "Ανάκληση πρόσκλησης", sharedTitle: "Τι γίνεται ορατό ανάμεσά σας", sharedEvidence: "Οι αρχικές απαντήσεις μένουν ιδιωτικές· τα ευρήματα παράγονται από τα ολοκληρωμένα σύνολα και τη δηλωμένη σημασία.",
    round: "Γύρος", sharedAlignment: "Κοινό Alignment", finalizedAgreements: "Οριστικοποιημένες συμφωνίες", agreementLegal: "Είναι κοινές σημειώσεις, όχι νομική σύμβαση.", agreementDescription: "Προσθέστε 1–5 σύντομες κοινές δεσμεύσεις. Είναι προαιρετικές σημειώσεις, όχι συμβάσεις. Μετοχές, αμοιβές ή διακυβέρνηση founders χρειάζονται κατάλληλη τεκμηρίωση εκτός Life Alignment.",
    addItem: "Προσθήκη σημείου", saveDraft: "Αποθήκευση πρόχειρου", acknowledge: (revision) => `Επιβεβαίωση αναθεώρησης ${revision}`, state: "Κατάσταση", revision: "Αναθεώρηση", editResets: "Η επεξεργασία μηδενίζει προηγούμενες επιβεβαιώσεις.",
    status: { active: "ενεργή", accepted: "αποδεκτή", completed: "ολοκληρωμένη", expired: "έληξε", revoked: "ανακλήθηκε", invited: "προσκλήθηκε", joined: "συμμετέχει", "in-progress": "σε εξέλιξη", withdrawn: "αποσύρθηκε", draft: "πρόχειρο", "awaiting-acknowledgement": "αναμένει επιβεβαίωση", finalized: "οριστικοποιημένη", none: "καμία" },
  },
  ru: {
    invitedBy: (name) => `${name} приглашает вас сначала ответить независимо, после чего станет доступна общая интерпретация.`, storedPrivate: "Ваши структурированные ответы и согласие хранятся только для этой приватной сессии. Они не публикуются, не индексируются, не используются в маркетинге и не обрабатываются ИИ.", stopAnytime: "Можно остановиться в любой момент. До общей финализации можно удалить участие; финализированная общая история не переписывается односторонне.",
    displayName: "Отображаемое имя", displayNameHelp: "2–40 символов. Email и официальное имя не требуются.", consentLead: "Я выбираю участие.", consentBody: "Я понимаю, что остаётся приватным и что войдёт в общий результат после завершения обеих частей. Это согласие на участие, а не на маркетинг.",
    accept: "Принять и начать", decline: "Отклонить и выйти", expired: "Срок приватного приглашения истёк.", revoked: "Приватное приглашение больше не активно.", unavailable: "Приватное приглашение недоступно.", privateLabel: "Приватный Life Alignment", privateStateBody: "По этой ссылке нет приватных данных сессии. При необходимости попросите новое приглашение.",
    otherParticipant: "Другой участник", deleteParticipation: "Удалить моё участие", revokeInvite: "Отозвать приглашение", sharedTitle: "Что становится видимым между вами", sharedEvidence: "Исходные ответы остаются приватными; выводы получены из завершённых наборов и указанной важности.",
    round: "Раунд", sharedAlignment: "Общий Alignment", finalizedAgreements: "Финализированные договорённости", agreementLegal: "Это общие заметки, а не юридический договор.", agreementDescription: "Добавьте 1–5 кратких общих обязательств. Это необязательные заметки, не договоры. Доли, зарплата и управление founders требуют отдельных надлежащих документов.",
    addItem: "Добавить пункт", saveDraft: "Сохранить черновик", acknowledge: (revision) => `Подтвердить редакцию ${revision}`, state: "Статус", revision: "Редакция", editResets: "Изменение сбрасывает прежние подтверждения.",
    status: { active: "активно", accepted: "принято", completed: "завершено", expired: "истекло", revoked: "отозвано", invited: "приглашён", joined: "присоединился", "in-progress": "в процессе", withdrawn: "отозвано участие", draft: "черновик", "awaiting-acknowledgement": "ожидает подтверждения", finalized: "финализировано", none: "нет" },
  },
};

export function relationshipSessionUi(locale: Locale): SessionUiCopy { return copy[locale]; }

export function assertRelationshipSessionUiCompleteness(): void {
  for (const locale of Object.keys(copy) as Locale[]) {
    const value = copy[locale];
    for (const [key, item] of Object.entries(value)) {
      if (typeof item === "string" && !item.trim()) throw new Error(`${locale}: missing relationship session UI ${key}`);
    }
    if (Object.values(value.status).some((label) => !label.trim())) throw new Error(`${locale}: missing relationship status label`);
  }
}
