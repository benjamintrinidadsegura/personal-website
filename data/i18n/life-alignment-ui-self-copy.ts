import type { AddedLifeLocale } from "@/data/i18n/life-alignment-extra";

type SelfCopyRow = readonly [
  source: string,
  es: string,
  tr: string,
  pl: string,
  el: string,
  ru: string,
];

const lifeAlignmentUiSelfCopyEntries = [
  ["Open", "Abrir", "Aç", "Otwórz", "Άνοιγμα", "Открыть"],
  ["For whom", "Para quién", "Kim için", "Dla kogo", "Για ποιον", "Для кого"],
  ["Privacy", "Privacidad", "Gizlilik", "Prywatność", "Ιδιωτικότητα", "Конфиденциальность"],
  ["Scope", "Alcance", "Kapsam", "Zakres", "Έκταση", "Объём"],
  ["Open perspective", "Abrir perspectiva", "Bakış açısını aç", "Otwórz perspektywę", "Άνοιγμα οπτικής", "Открыть перспективу"],
  ["Breadcrumb", "Ruta de navegación", "Sayfa yolu", "Okruszki nawigacji", "Διαδρομή πλοήγησης", "Навигационная цепочка"],
  ["Three perspectives", "Tres perspectivas", "Üç bakış açısı", "Trzy perspektywy", "Τρεις οπτικές", "Три перспективы"],
  ["Choose the perspective that fits your question.", "Elige la perspectiva que mejor encaje con tu pregunta.", "Soruna uyan bakış açısını seç.", "Wybierz perspektywę pasującą do Twojego pytania.", "Επίλεξε την οπτική που ταιριάζει στο ερώτημά σου.", "Выберите перспективу, которая подходит вашему вопросу."],
  ["The three modules share a stance, but not the same questions or results.", "Los tres módulos comparten una misma postura, pero no las mismas preguntas ni los mismos resultados.", "Üç modül aynı yaklaşımı paylaşır; ancak soruları ve sonuçları aynı değildir.", "Trzy moduły łączy wspólne podejście, ale nie te same pytania ani wyniki.", "Οι τρεις ενότητες μοιράζονται την ίδια στάση, όχι όμως τις ίδιες ερωτήσεις ή τα ίδια αποτελέσματα.", "Три модуля основаны на общем подходе, но задают разные вопросы и дают разные результаты."],
  ["Part of the product family", "Parte de la familia de productos", "Ürün ailesinin bir parçası", "Część rodziny produktów", "Μέρος της οικογένειας προϊόντων", "Часть семейства продуктов"],
  ["More contexts will follow later.", "Más adelante se añadirán otros contextos.", "Daha sonra başka bağlamlar eklenecek.", "Z czasem pojawią się kolejne konteksty.", "Αργότερα θα προστεθούν περισσότερα πλαίσια.", "Позже появятся и другие контексты."],
  ["These perspectives are part of the committed direction for Life Alignment. Their journeys are intentionally not available in V1.", "Estas perspectivas forman parte de la dirección prevista para Life Alignment. Sus recorridos no están disponibles deliberadamente en la V1.", "Bu bakış açıları Life Alignment için belirlenen yönün bir parçasıdır. Yolculukları V1 sürümünde bilinçli olarak sunulmuyor.", "Te perspektywy należą do przyjętego kierunku rozwoju Life Alignment. Ich ścieżki celowo nie są dostępne w wersji V1.", "Αυτές οι οπτικές αποτελούν μέρος της δεσμευμένης κατεύθυνσης του Life Alignment. Οι διαδρομές τους σκόπιμα δεν διατίθενται στην έκδοση V1.", "Эти перспективы входят в выбранное направление развития Life Alignment. В версии V1 соответствующие сценарии намеренно недоступны."],
  ["Future Life Alignment modules", "Futuros módulos de Life Alignment", "Gelecekteki Life Alignment modülleri", "Przyszłe moduły Life Alignment", "Μελλοντικές ενότητες Life Alignment", "Будущие модули Life Alignment"],
  ["Shared stance", "Postura compartida", "Ortak yaklaşım", "Wspólne podejście", "Κοινή στάση", "Общий подход"],
  ["Understand, don't measure.", "Comprender, no medir.", "Ölçmek değil, anlamak.", "Rozumieć, nie mierzyć.", "Κατανόηση, όχι μέτρηση.", "Понять, а не измерить."],
  ["No life or compatibility score", "Sin puntuación de vida ni de compatibilidad", "Yaşam veya uyumluluk puanı yok", "Bez oceny życia ani dopasowania", "Χωρίς βαθμολογία ζωής ή συμβατότητας", "Без оценки жизни или совместимости"],
  ["No diagnosis or correct answer", "Sin diagnóstico ni respuesta correcta", "Tanı veya doğru yanıt yok", "Bez diagnozy i poprawnej odpowiedzi", "Χωρίς διάγνωση ή σωστή απάντηση", "Без диагноза и правильного ответа"],
  ["Answers remain in the current local page state", "Las respuestas permanecen en el estado local actual de la página", "Yanıtlar sayfanın mevcut yerel durumunda kalır", "Odpowiedzi pozostają w bieżącym lokalnym stanie strony", "Οι απαντήσεις παραμένουν στην τρέχουσα τοπική κατάσταση της σελίδας", "Ответы остаются только в текущем локальном состоянии страницы"],
  ["Select four to six life areas for this snapshot, then mark one to three that deserve particular attention right now.", "Selecciona entre cuatro y seis ámbitos de vida para este panorama y marca después entre uno y tres que merezcan especial atención ahora.", "Bu görünüm için dört ila altı yaşam alanı seç; ardından şu anda özellikle dikkat gerektiren bir ila üçünü işaretle.", "Wybierz od czterech do sześciu obszarów życia do tego obrazu, a następnie zaznacz od jednego do trzech, które wymagają teraz szczególnej uwagi.", "Επίλεξε τέσσερις έως έξι τομείς ζωής για αυτή την εικόνα και έπειτα σημείωσε έναν έως τρεις που χρειάζονται ιδιαίτερη προσοχή τώρα.", "Выберите для этого обзора от четырёх до шести сфер жизни, а затем отметьте от одной до трёх, которым сейчас стоит уделить особое внимание."],
  ["Life areas", "Ámbitos de vida", "Yaşam alanları", "Obszary życia", "Τομείς ζωής", "Сферы жизни"],
  ["Custom life area", "Ámbito de vida propio", "Kendi yaşam alanın", "Własny obszar życia", "Δικός σου τομέας ζωής", "Своя сфера жизни"],
  ["e.g. spirituality", "p. ej., espiritualidad", "örn. maneviyat", "np. duchowość", "π.χ. πνευματικότητα", "например, духовность"],
  ["Include in snapshot", "Incluir en el panorama", "Görünüme ekle", "Uwzględnij w obrazie", "Συμπερίληψη στην εικόνα", "Включить в обзор"],
  ["What is especially important right now?", "¿Qué es especialmente importante ahora?", "Şu anda özellikle önemli olan ne?", "Co jest teraz szczególnie ważne?", "Τι είναι ιδιαίτερα σημαντικό αυτή τη στιγμή;", "Что сейчас особенно важно?"],
  ["Important does not automatically mean problematic. Mark one to three selected areas.", "Importante no significa necesariamente problemático. Marca entre uno y tres de los ámbitos seleccionados.", "Önemli olması, mutlaka sorunlu olduğu anlamına gelmez. Seçtiğin alanlardan bir ila üçünü işaretle.", "Ważne nie znaczy automatycznie problematyczne. Zaznacz od jednego do trzech wybranych obszarów.", "Σημαντικό δεν σημαίνει αυτομάτως προβληματικό. Σημείωσε έναν έως τρεις από τους επιλεγμένους τομείς.", "Важное не обязательно означает проблемное. Отметьте от одной до трёх выбранных сфер."],
  ["Describe every selected area twice: how much space does it take, and how does it affect your available capacity?", "Describe cada ámbito seleccionado de dos maneras: ¿cuánto espacio ocupa y cómo afecta a tu capacidad disponible?", "Seçtiğin her alanı iki açıdan anlat: Ne kadar yer kaplıyor ve kullanılabilir kapasiteni nasıl etkiliyor?", "Opisz każdy wybrany obszar na dwa sposoby: ile zajmuje miejsca i jak wpływa na dostępne zasoby?", "Περίγραψε κάθε επιλεγμένο τομέα με δύο τρόπους: πόσο χώρο καταλαμβάνει και πώς επηρεάζει τη διαθέσιμη αντοχή σου;", "Опишите каждую выбранную сферу с двух сторон: сколько места она занимает и как влияет на доступный запас сил?"],
  ["How much space does this area receive now?", "¿Cuánto espacio recibe ahora este ámbito?", "Bu alan şu anda ne kadar yer alıyor?", "Ile miejsca ma teraz ten obszar?", "Πόσο χώρο λαμβάνει τώρα αυτός ο τομέας;", "Сколько места сейчас занимает эта сфера?"],
  ["How does this area affect your capacity today?", "¿Cómo afecta hoy este ámbito a tu capacidad?", "Bu alan bugün kapasiteni nasıl etkiliyor?", "Jak ten obszar wpływa dziś na Twoje zasoby?", "Πώς επηρεάζει αυτός ο τομέας τη σημερινή σου αντοχή;", "Как эта сфера влияет сегодня на ваш запас сил?"],
  ["A direction can mean more, less, similar or simply different. Uncertainty is also a complete answer.", "Una dirección puede significar más, menos, algo parecido o simplemente algo distinto. La incertidumbre también es una respuesta completa.", "Bir yön; daha fazla, daha az, benzer ya da yalnızca farklı anlamına gelebilir. Belirsizlik de eksiksiz bir yanıttır.", "Kierunek może oznaczać więcej, mniej, podobnie albo po prostu inaczej. Niepewność także jest pełną odpowiedzią.", "Μια κατεύθυνση μπορεί να σημαίνει περισσότερο, λιγότερο, παρόμοια ή απλώς διαφορετικά. Η αβεβαιότητα είναι επίσης ολοκληρωμένη απάντηση.", "Направление может означать больше, меньше, примерно так же или просто иначе. Неопределённость — тоже полноценный ответ."],
  ["Select up to three real conditions that most shape your available room today. This is context, not an excuse or evaluation.", "Selecciona hasta tres condiciones reales que más determinan tu margen disponible hoy. Es contexto, no una excusa ni una evaluación.", "Bugünkü hareket alanını en çok belirleyen en fazla üç gerçek koşulu seç. Bunlar bir mazeret veya değerlendirme değil, bağlamdır.", "Wybierz maksymalnie trzy realne warunki, które dziś najbardziej kształtują Twoje pole działania. To kontekst, nie wymówka ani ocena.", "Επίλεξε έως τρεις πραγματικές συνθήκες που διαμορφώνουν περισσότερο το διαθέσιμο περιθώριό σου σήμερα. Είναι πλαίσιο, όχι δικαιολογία ή αξιολόγηση.", "Выберите до трёх реальных условий, которые сегодня сильнее всего определяют ваше поле возможностей. Это контекст, а не оправдание или оценка."],
  ["Current conditions", "Condiciones actuales", "Bugünkü koşullar", "Obecne warunki", "Σημερινές συνθήκες", "Нынешние условия"],
  ["How do you relate to a possible tension today?", "¿Cómo te sitúas hoy ante una posible tensión?", "Bugün olası bir gerilimle nasıl ilişki kuruyorsun?", "Jak odnosisz się dziś do możliwego napięcia?", "Πώς τοποθετείσαι σήμερα απέναντι σε μια πιθανή ένταση;", "Как вы сегодня относитесь к возможному противоречию?"],
  ["You do not need to justify a constraint.", "No necesitas justificar una limitación.", "Bir kısıtı gerekçelendirmek zorunda değilsin.", "Nie musisz uzasadniać ograniczenia.", "Δεν χρειάζεται να δικαιολογήσεις έναν περιορισμό.", "Вам не нужно оправдывать ограничение."],
  ["The snapshot keeps a wish for change separate from the room actually available today.", "El panorama mantiene separado el deseo de cambio del margen realmente disponible hoy.", "Görünüm, değişim isteğini bugün gerçekten var olan hareket alanından ayrı tutar.", "Obraz oddziela pragnienie zmiany od pola działania, które jest dziś rzeczywiście dostępne.", "Η εικόνα διατηρεί την επιθυμία για αλλαγή χωριστά από το περιθώριο που είναι πραγματικά διαθέσιμο σήμερα.", "Обзор отделяет желание перемен от пространства, которое действительно доступно сегодня."],
  ["Choose a focus, describe your own interpretation and select a small voluntary next mode.", "Elige un foco, describe tu propia interpretación y selecciona una pequeña forma voluntaria de continuar.", "Bir odak seç, kendi yorumunu anlat ve küçük, gönüllü bir sonraki adım biçimi belirle.", "Wybierz punkt uwagi, opisz własną interpretację i wybierz mały, dobrowolny sposób dalszego działania.", "Επίλεξε ένα σημείο εστίασης, περίγραψε τη δική σου ερμηνεία και διάλεξε έναν μικρό, εθελοντικό τρόπο συνέχειας.", "Выберите фокус, опишите собственное понимание и определите небольшой добровольный способ продолжить."],
  ["One focus for this snapshot", "Un foco para este panorama", "Bu görünüm için tek bir odak", "Jeden punkt uwagi dla tego obrazu", "Ένα σημείο εστίασης για αυτή την εικόνα", "Один фокус для этого обзора"],
  ["Marked by you as especially important.", "Marcado por ti como especialmente importante.", "Senin tarafından özellikle önemli olarak işaretlendi.", "Obszar oznaczony przez Ciebie jako szczególnie ważny.", "Το σημείωσες ως ιδιαίτερα σημαντικό.", "Вы отметили это как особенно важное."],
  ["Where might this direction come from?", "¿De dónde podría proceder esta dirección?", "Bu yön nereden geliyor olabilir?", "Skąd może wynikać ten kierunek?", "Από πού μπορεί να προέρχεται αυτή η κατεύθυνση;", "Откуда может исходить это направление?"],
  ["Does the connected assumption or constraint still apply?", "¿Sigue siendo válida la suposición o limitación asociada?", "Bununla bağlantılı varsayım veya kısıt hâlâ geçerli mi?", "Czy związane z tym założenie lub ograniczenie nadal obowiązuje?", "Ισχύει ακόμη η σχετική παραδοχή ή ο περιορισμός;", "Связанное с этим предположение или ограничение всё ещё актуально?"],
  ["What would you like to protect or make possible?", "¿Qué te gustaría proteger o hacer posible?", "Neyi korumak veya mümkün kılmak istersin?", "Co chcesz ochronić lub umożliwić?", "Τι θα ήθελες να προστατεύσεις ή να καταστήσεις δυνατό;", "Что вы хотели бы защитить или сделать возможным?"],
  ["optional", "opcional", "isteğe bağlı", "opcjonalne", "προαιρετικό", "необязательно"],
  ["12–240 characters if you want to record something. This note stays local and is intentionally omitted from the clipboard summary.", "Entre 12 y 240 caracteres si quieres anotar algo. Esta nota permanece en local y se omite deliberadamente del resumen copiado al portapapeles.", "Bir şey kaydetmek istersen 12–240 karakter kullan. Bu not yerel kalır ve pano özetine bilinçli olarak eklenmez.", "Jeśli chcesz coś zapisać, użyj od 12 do 240 znaków. Ta notatka pozostaje lokalna i celowo nie trafia do podsumowania kopiowanego do schowka.", "Αν θέλεις να καταγράψεις κάτι, χρησιμοποίησε 12–240 χαρακτήρες. Αυτή η σημείωση παραμένει τοπικά και σκόπιμα παραλείπεται από τη σύνοψη του προχείρου.", "Если хотите что-то записать, используйте от 12 до 240 символов. Эта заметка остаётся локальной и намеренно не включается в сводку для буфера обмена."],
  ["Which small next mode fits?", "¿Qué pequeña forma de continuar encaja?", "Hangi küçük ilerleme biçimi uygun?", "Jaki mały sposób dalszego działania pasuje?", "Ποιος μικρός τρόπος συνέχειας ταιριάζει;", "Какой небольшой способ продолжить подходит?"],
  ["None of these steps is an obligation. ‘Change nothing yet’ is an equal option.", "Ninguno de estos pasos es una obligación. «No cambiar nada todavía» es una opción igual de válida.", "Bu adımların hiçbiri zorunlu değil. “Henüz hiçbir şeyi değiştirme” seçeneği de diğerleriyle eşittir.", "Żaden z tych kroków nie jest obowiązkiem. „Na razie niczego nie zmieniaj” jest równie ważną opcją.", "Κανένα από αυτά τα βήματα δεν είναι υποχρεωτικό. Το «Μην αλλάξεις τίποτα ακόμη» είναι ισότιμη επιλογή.", "Ни один из этих шагов не обязателен. «Пока ничего не менять» — равноценный вариант."],
  ["Start over", "Empezar de nuevo", "Baştan başla", "Zacznij od nowa", "Από την αρχή", "Начать заново"],
  ["Discard all answers in this snapshot?", "¿Descartar todas las respuestas de este panorama?", "Bu görünümdeki tüm yanıtlar silinsin mi?", "Odrzucić wszystkie odpowiedzi w tym obrazie?", "Να απορριφθούν όλες οι απαντήσεις αυτής της εικόνας;", "Удалить все ответы из этого обзора?"],
  ["This cannot be undone.", "Esta acción no se puede deshacer.", "Bu işlem geri alınamaz.", "Tej czynności nie można cofnąć.", "Αυτή η ενέργεια δεν αναιρείται.", "Это действие нельзя отменить."],
  ["Keep", "Conservar", "Koru", "Zachowaj", "Διατήρηση", "Сохранить"],
  ["Yes, start over", "Sí, empezar de nuevo", "Evet, baştan başla", "Tak, zacznij od nowa", "Ναι, από την αρχή", "Да, начать заново"],
  ["This snapshot organises your own answers. It is not an evaluation of your life or medical, psychological, legal, financial or other professional advice.", "Este panorama organiza tus propias respuestas. No es una evaluación de tu vida ni asesoramiento médico, psicológico, jurídico, financiero o profesional de otro tipo.", "Bu görünüm kendi yanıtlarını düzenler. Yaşamının bir değerlendirmesi değildir; tıbbi, psikolojik, hukuki, mali veya başka bir profesyonel danışmanlık sunmaz.", "Ten obraz porządkuje Twoje własne odpowiedzi. Nie jest oceną Twojego życia ani poradą medyczną, psychologiczną, prawną, finansową czy inną profesjonalną poradą.", "Αυτή η εικόνα οργανώνει τις δικές σου απαντήσεις. Δεν αποτελεί αξιολόγηση της ζωής σου ούτε ιατρική, ψυχολογική, νομική, οικονομική ή άλλη επαγγελματική συμβουλή.", "Этот обзор упорядочивает ваши собственные ответы. Он не оценивает вашу жизнь и не является медицинской, психологической, юридической, финансовой или иной профессиональной консультацией."],
  ["Private qualitative snapshot", "Panorama cualitativo privado", "Özel nitel görünüm", "Prywatny obraz jakościowy", "Ιδιωτική ποιοτική εικόνα", "Личный качественный обзор"],
  ["Qualitative signals", "Señales cualitativas", "Nitel sinyaller", "Sygnały jakościowe", "Ποιοτικά σήματα", "Качественные сигналы"],
  ["What becomes visible in your snapshot.", "Lo que se hace visible en tu panorama.", "Görünümünde belirginleşenler.", "Co staje się widoczne w Twoim obrazie.", "Τι γίνεται ορατό στην εικόνα σου.", "Что становится заметно в вашем обзоре."],
  ["What supports you at present", "Lo que te sostiene ahora", "Şu anda seni destekleyenler", "Co wspiera Cię obecnie", "Τι σε στηρίζει αυτή τη στιγμή", "Что поддерживает вас сейчас"],
  ["What currently uses capacity", "Lo que consume capacidad actualmente", "Şu anda kapasite kullananlar", "Co obecnie zużywa Twoje zasoby", "Τι καταναλώνει τώρα την αντοχή σου", "Что сейчас расходует ваши силы"],
  ["Desired shifts and tensions", "Cambios deseados y tensiones", "İstenen değişimler ve gerilimler", "Pożądane zmiany i napięcia", "Επιθυμητές μετατοπίσεις και εντάσεις", "Желаемые перемены и противоречия"],
  ["What remains intentionally open", "Lo que permanece abierto de forma deliberada", "Bilinçli olarak açık bırakılanlar", "Co celowo pozostaje otwarte", "Τι παραμένει σκόπιμα ανοιχτό", "Что намеренно остаётся открытым"],
  ["Consciously accepted trade-off", "Renuncia aceptada conscientemente", "Bilinçli olarak kabul edilen ödünleşme", "Świadomie przyjęty kompromis", "Συνειδητά αποδεκτός συμβιβασμός", "Осознанно принятый компромисс"],
  ["Real context", "Contexto real", "Gerçek bağlam", "Realny kontekst", "Πραγματικό πλαίσιο", "Реальный контекст"],
  ["Edit conditions", "Editar condiciones", "Koşulları düzenle", "Edytuj warunki", "Επεξεργασία συνθηκών", "Изменить условия"],
  ["Available room is not unlimited.", "El margen disponible no es ilimitado.", "Kullanılabilir alan sınırsız değildir.", "Dostępne pole działania nie jest nieograniczone.", "Το διαθέσιμο περιθώριο δεν είναι απεριόριστο.", "Доступное пространство не безгранично."],
  ["You recorded no specific constraint for today.", "No has registrado ninguna limitación concreta para hoy.", "Bugün için belirli bir kısıt kaydetmedin.", "Nie wskazano żadnego konkretnego ograniczenia na dziś.", "Δεν κατέγραψες συγκεκριμένο περιορισμό για σήμερα.", "Вы не указали конкретных ограничений на сегодня."],
  ["Your selected focus", "El foco que has elegido", "Seçtiğin odak", "Wybrany przez Ciebie punkt uwagi", "Το σημείο εστίασης που επέλεξες", "Выбранный вами фокус"],
  ["Edit focus", "Editar foco", "Odağı düzenle", "Edytuj punkt uwagi", "Επεξεργασία εστίασης", "Изменить фокус"],
  ["Your current interpretation", "Tu interpretación actual", "Bugünkü yorumun", "Twoja obecna interpretacja", "Η σημερινή σου ερμηνεία", "Ваше нынешнее понимание"],
  ["Source and your interpretation", "Origen y tu interpretación", "Kaynak ve senin yorumun", "Źródło i Twoja interpretacja", "Προέλευση και δική σου ερμηνεία", "Источник и ваше понимание"],
  ["For far-reaching decisions", "Para decisiones de gran alcance", "Geniş kapsamlı kararlar için", "Przy daleko idących decyzjach", "Για αποφάσεις με σημαντικές συνέπειες", "Для решений с серьёзными последствиями"],
  ["Do not use this reflection alone for medical, psychological, legal, financial or other consequential decisions. Check concrete risks and conditions with suitable qualified professionals.", "No utilices únicamente esta reflexión para tomar decisiones médicas, psicológicas, jurídicas, financieras o de otra índole con consecuencias importantes. Consulta los riesgos y condiciones concretos con profesionales debidamente cualificados.", "Tıbbi, psikolojik, hukuki, mali veya başka önemli sonuçları olan kararları yalnızca bu düşünmeye dayanarak verme. Somut riskleri ve koşulları uygun niteliklere sahip uzmanlarla değerlendir.", "Nie opieraj decyzji medycznych, psychologicznych, prawnych, finansowych ani innych brzemiennych w skutki wyłącznie na tej refleksji. Konkretne ryzyka i warunki skonsultuj z odpowiednio wykwalifikowanymi specjalistami.", "Μη βασίζεσαι μόνο σε αυτόν τον αναστοχασμό για ιατρικές, ψυχολογικές, νομικές, οικονομικές ή άλλες αποφάσεις με σημαντικές συνέπειες. Έλεγξε τους συγκεκριμένους κινδύνους και τις συνθήκες με κατάλληλα καταρτισμένους επαγγελματίες.", "Не принимайте медицинские, психологические, юридические, финансовые или другие значимые решения, опираясь только на это размышление. Обсудите конкретные риски и условия с подходящими квалифицированными специалистами."],
  ["Small next experiment", "Pequeño experimento siguiente", "Küçük bir sonraki deneme", "Mały kolejny eksperyment", "Μικρό επόμενο πείραμα", "Небольшой следующий эксперимент"],
  ["Observation question", "Pregunta de observación", "Gözlem sorusu", "Pytanie obserwacyjne", "Ερώτηση παρατήρησης", "Вопрос для наблюдения"],
  ["Printable Life Alignment snapshot", "Panorama de Life Alignment para imprimir", "Yazdırılabilir Life Alignment görünümü", "Obraz Life Alignment do wydruku", "Εκτυπώσιμη εικόνα Life Alignment", "Обзор Life Alignment для печати"],
  ["Snapshot", "Panorama", "Görünüm", "Obraz", "Εικόνα", "Обзор"],
  ["desired direction", "dirección deseada", "istenen yön", "pożądany kierunek", "επιθυμητή κατεύθυνση", "желаемое направление"],
  ["Relationships", "Relaciones", "İlişkiler", "Relacje", "Σχέσεις", "Связи"],
  ["In everyday life", "En la vida cotidiana", "Gündelik yaşamda", "W codzienności", "Στην καθημερινότητα", "В повседневности"],
  ["Focus", "Foco", "Odak", "Punkt uwagi", "Εστίαση", "Фокус"],
  ["Possible paths", "Caminos posibles", "Olası yollar", "Możliwe drogi", "Πιθανές διαδρομές", "Возможные пути"],
  ["First step", "Primer paso", "İlk adım", "Pierwszy krok", "Πρώτο βήμα", "Первый шаг"],
  ["What you might learn", "Lo que podrías aprender", "Neler öğrenebileceğin", "Czego możesz się dowiedzieć", "Τι μπορεί να μάθεις", "Что можно узнать"],
  ["Small tools", "Pequeñas herramientas", "Küçük araçlar", "Małe narzędzia", "Μικρά εργαλεία", "Небольшие инструменты"],
  ["Begin reflection", "Comenzar la reflexión", "Düşünmeye başla", "Rozpocznij refleksję", "Έναρξη αναστοχασμού", "Начать размышление"],
  ["Private by design", "Privado por diseño", "Tasarım gereği özel", "Prywatność w założeniu", "Ιδιωτικό από τον σχεδιασμό", "Конфиденциальность по замыслу"],
  ["No account. No storage. No life score.", "Sin cuenta. Sin almacenamiento. Sin puntuación de vida.", "Hesap yok. Kayıt yok. Yaşam puanı yok.", "Bez konta. Bez zapisu. Bez oceny życia.", "Χωρίς λογαριασμό. Χωρίς αποθήκευση. Χωρίς βαθμολογία ζωής.", "Без аккаунта. Без сохранения. Без оценки жизни."],
  ["How it works", "Cómo funciona", "Nasıl işliyor", "Jak to działa", "Πώς λειτουργεί", "Как это работает"],
  ["Five sections, one present-day snapshot.", "Cinco secciones, un panorama del presente.", "Beş bölüm, bugüne ait tek bir görünüm.", "Pięć części, jeden obraz obecnej sytuacji.", "Πέντε ενότητες, μία εικόνα της σημερινής κατάστασης.", "Пять разделов — один обзор нынешней ситуации."],
  ["Back", "Atrás", "Geri", "Wstecz", "Πίσω", "Назад"],
  ["View snapshot", "Ver panorama", "Görünümü aç", "Pokaż obraz", "Δες την εικόνα", "Показать обзор"],
  ["Continue", "Continuar", "Devam", "Dalej", "Συνέχεια", "Продолжить"],
  ["The shape of your present-day snapshot.", "La forma de tu panorama actual.", "Bugünkü görünümünün biçimi.", "Kształt obrazu Twojej obecnej sytuacji.", "Η μορφή της εικόνας της σημερινής σου κατάστασης.", "Структура обзора вашей нынешней ситуации."],
  ["Every area appears exactly once. The groups describe your answers; they are neither levels nor a ranking.", "Cada ámbito aparece exactamente una vez. Los grupos describen tus respuestas; no son niveles ni una clasificación.", "Her alan yalnızca bir kez görünür. Gruplar yanıtlarını açıklar; seviye veya sıralama değildir.", "Każdy obszar pojawia się dokładnie raz. Grupy opisują Twoje odpowiedzi; nie są poziomami ani rankingiem.", "Κάθε τομέας εμφανίζεται ακριβώς μία φορά. Οι ομάδες περιγράφουν τις απαντήσεις σου· δεν είναι επίπεδα ούτε κατάταξη.", "Каждая сфера показана ровно один раз. Группы описывают ваши ответы; это не уровни и не рейтинг."],
  ["Edit current situation", "Editar situación actual", "Bugünkü durumu düzenle", "Edytuj obecną sytuację", "Επεξεργασία σημερινής κατάστασης", "Изменить нынешнюю ситуацию"],
  ["Qualitative groups of your selected life areas", "Grupos cualitativos de los ámbitos de vida seleccionados", "Seçtiğin yaşam alanlarının nitel grupları", "Jakościowe grupy wybranych obszarów życia", "Ποιοτικές ομάδες των επιλεγμένων τομέων ζωής", "Качественные группы выбранных сфер жизни"],
  ["Important now", "Importante ahora", "Şu anda önemli", "Ważne teraz", "Σημαντικό τώρα", "Важно сейчас"],
  ["No area belongs to this group today.", "Hoy no hay ningún ámbito en este grupo.", "Bugün bu gruba ait bir alan yok.", "Dziś żaden obszar nie należy do tej grupy.", "Κανένας τομέας δεν ανήκει σήμερα σε αυτή την ομάδα.", "Сегодня к этой группе не относится ни одна сфера."],
  ["Area by area", "Ámbito por ámbito", "Alan alan", "Obszar po obszarze", "Τομέας προς τομέα", "Сфера за сферой"],
  ["The details show the three explicit answers behind every placement.", "Los detalles muestran las tres respuestas explícitas que explican cada ubicación.", "Ayrıntılar, her yerleşimin arkasındaki üç açık yanıtı gösterir.", "Szczegóły pokazują trzy bezpośrednie odpowiedzi stojące za każdym przypisaniem.", "Οι λεπτομέρειες δείχνουν τις τρεις ρητές απαντήσεις πίσω από κάθε τοποθέτηση.", "В подробностях показаны три прямых ответа, на которых основано каждое размещение."],
  ["Current space", "Espacio actual", "Bugünkü alan", "Obecna przestrzeń", "Σημερινός χώρος", "Нынешнее место"],
  ["Effect", "Efecto", "Etki", "Wpływ", "Επίδραση", "Влияние"],
  ["Desired direction", "Dirección deseada", "İstenen yön", "Pożądany kierunek", "Επιθυμητή κατεύθυνση", "Желаемое направление"],
  ["Only on your initiative", "Solo por iniciativa propia", "Yalnızca senin isteğinle", "Tylko z Twojej inicjatywy", "Μόνο με δική σου πρωτοβουλία", "Только по вашей инициативе"],
  ["Take your snapshot with you", "Llévate tu panorama", "Görünümünü yanında götür", "Zabierz swój obraz ze sobą", "Πάρε την εικόνα σου μαζί σου", "Сохраните свой обзор для себя"],
  ["The result is not stored. Copying intentionally creates a reduced short version without your free-text note or detailed conditions.", "El resultado no se guarda. Al copiar se crea deliberadamente una versión breve y reducida, sin tu nota de texto libre ni las condiciones detalladas.", "Sonuç saklanmaz. Kopyalama işlemi, serbest metin notunu ve ayrıntılı koşulları içermeyen bilinçli olarak kısaltılmış bir sürüm oluşturur.", "Wynik nie jest zapisywany. Kopiowanie celowo tworzy skróconą wersję bez notatki tekstowej i szczegółowych warunków.", "Το αποτέλεσμα δεν αποθηκεύεται. Η αντιγραφή δημιουργεί σκόπιμα μια σύντομη, περιορισμένη έκδοση χωρίς τη σημείωση ελεύθερου κειμένου ή τις λεπτομερείς συνθήκες.", "Результат не сохраняется. При копировании намеренно создаётся сокращённая версия без вашей текстовой заметки и подробных условий."],
  ["Copy private short version", "Copiar versión breve privada", "Özel kısa sürümü kopyala", "Kopiuj prywatną krótką wersję", "Αντιγραφή ιδιωτικής σύντομης έκδοσης", "Скопировать личную краткую версию"],
  ["Private short version copied.", "Se ha copiado la versión breve privada.", "Özel kısa sürüm kopyalandı.", "Skopiowano prywatną krótką wersję.", "Η ιδιωτική σύντομη έκδοση αντιγράφηκε.", "Личная краткая версия скопирована."],
  ["Text for manual copying", "Texto para copiar manualmente", "Elle kopyalanacak metin", "Tekst do ręcznego skopiowania", "Κείμενο για χειροκίνητη αντιγραφή", "Текст для копирования вручную"],
  ["What becomes visible between the areas.", "Lo que se hace visible entre los distintos ámbitos.", "Alanlar arasında görünür hâle gelenler.", "Co staje się widoczne pomiędzy obszarami.", "Τι γίνεται ορατό ανάμεσα στους τομείς.", "Что становится заметно во взаимосвязи сфер."],
  ["These observations connect only your explicit answers. Each one shows its basis.", "Estas observaciones relacionan únicamente tus respuestas explícitas. Cada una muestra en qué se basa.", "Bu gözlemler yalnızca açıkça verdiğin yanıtları birbirine bağlar. Her biri dayanağını gösterir.", "Te obserwacje łączą wyłącznie Twoje bezpośrednie odpowiedzi. Każda pokazuje swoją podstawę.", "Αυτές οι παρατηρήσεις συνδέουν μόνο τις ρητές απαντήσεις σου. Καθεμία δείχνει τη βάση της.", "Эти наблюдения связывают только ваши прямые ответы. Для каждого указано основание."],
  ["In everyday life this might mean", "En la vida cotidiana, esto podría significar", "Gündelik yaşamda bu şu anlama gelebilir", "W codziennym życiu może to oznaczać", "Στην καθημερινότητα αυτό μπορεί να σημαίνει", "В повседневной жизни это может означать"],
  ["Several possible paths", "Varios caminos posibles", "Birkaç olası yol", "Kilka możliwych dróg", "Αρκετές πιθανές διαδρομές", "Несколько возможных путей"],
  ["What you might try from here.", "Lo que podrías probar a partir de aquí.", "Buradan sonra deneyebileceklerin.", "Czego możesz spróbować dalej.", "Τι μπορείς να δοκιμάσεις από εδώ και πέρα.", "Что можно попробовать дальше."],
  ["No path is objectively right. Choose only what fits the room available today.", "Ningún camino es objetivamente correcto. Elige solo lo que encaje con el margen disponible hoy.", "Hiçbir yol nesnel olarak doğru değildir. Yalnızca bugünkü hareket alanına uyanı seç.", "Żadna droga nie jest obiektywnie właściwa. Wybierz tylko to, co mieści się w dostępnym dziś polu działania.", "Καμία διαδρομή δεν είναι αντικειμενικά σωστή. Επίλεξε μόνο ό,τι ταιριάζει στο περιθώριο που διαθέτεις σήμερα.", "Ни один путь не является объективно правильным. Выбирайте только то, что соответствует доступным сегодня возможностям."],
  ["Possibility", "Posibilidad", "Olasılık", "Możliwość", "Δυνατότητα", "Возможность"],
  ["Why this path may fit", "Por qué podría encajar este camino", "Bu yol neden uygun olabilir", "Dlaczego ta droga może pasować", "Γιατί μπορεί να ταιριάζει αυτή η διαδρομή", "Почему этот путь может подойти"],
  ["A first step", "Un primer paso", "İlk adım", "Pierwszy krok", "Ένα πρώτο βήμα", "Первый шаг"],
  ["Concrete example", "Ejemplo concreto", "Somut örnek", "Konkretny przykład", "Συγκεκριμένο παράδειγμα", "Конкретный пример"],
  ["Possible trade-off", "Posible renuncia", "Olası ödünleşme", "Możliwy kompromis", "Πιθανός συμβιβασμός", "Возможный компромисс"],
  ["Reversibility", "Reversibilidad", "Geri alınabilirlik", "Odwracalność", "Αναστρεψιμότητα", "Обратимость"],
  ["Yes—designed as a small experiment and easy to stop.", "Sí: está concebido como un pequeño experimento que se puede detener fácilmente.", "Evet—küçük bir deneme olarak tasarlandı ve kolayca durdurulabilir.", "Tak — zostało pomyślane jako mały eksperyment, który łatwo przerwać.", "Ναι — έχει σχεδιαστεί ως μικρό πείραμα που σταματά εύκολα.", "Да — это небольшой эксперимент, который легко прекратить."],
  ["Not fully—a conversation cannot be undone, but it can remain open and free of decision pressure.", "No del todo: una conversación no se puede deshacer, pero puede permanecer abierta y libre de presión para decidir.", "Tam olarak değil—bir konuşma geri alınamaz; ancak açık ve karar baskısından uzak kalabilir.", "Nie w pełni — rozmowy nie można cofnąć, ale może pozostać otwarta i wolna od presji podjęcia decyzji.", "Όχι πλήρως — μια συζήτηση δεν αναιρείται, αλλά μπορεί να παραμείνει ανοιχτή και χωρίς πίεση για απόφαση.", "Не полностью — разговор нельзя отменить, но его можно оставить открытым, без давления принять решение."],
  ["From statement to your own observation.", "De la afirmación a tu propia observación.", "İfadeden kendi gözlemine.", "Od stwierdzenia do własnej obserwacji.", "Από τη διατύπωση στη δική σου παρατήρηση.", "От утверждения к собственному наблюдению."],
  ["There is nothing to submit or store. Use only the tool that makes your question more concrete.", "No hay nada que enviar ni guardar. Utiliza únicamente la herramienta que haga más concreta tu pregunta.", "Gönderilecek veya saklanacak bir şey yok. Yalnızca sorunu daha somut hâle getiren aracı kullan.", "Nie ma tu niczego do wysłania ani zapisania. Użyj tylko narzędzia, które pomoże skonkretyzować Twoje pytanie.", "Δεν υπάρχει τίποτα για υποβολή ή αποθήκευση. Χρησιμοποίησε μόνο το εργαλείο που κάνει την ερώτησή σου πιο συγκεκριμένη.", "Здесь ничего не нужно отправлять или сохранять. Используйте только тот инструмент, который делает ваш вопрос конкретнее."],
  ["To take with you", "Para llevarte", "Yanında götürmek için", "Na dalszą drogę", "Για να πάρεις μαζί σου", "Что взять с собой"],
  ["The module hub could not be displayed.", "No se ha podido mostrar la página de módulos.", "Modül merkezi görüntülenemedi.", "Nie udało się wyświetlić strony modułów.", "Δεν ήταν δυνατή η εμφάνιση της κεντρικής σελίδας ενοτήτων.", "Не удалось отобразить страницу модулей."],
  ["You can reload the overview and then select Self, Partner or Life Vision.", "Puedes volver a cargar la vista general y seleccionar después Self, Partner o Life Vision.", "Genel görünümü yeniden yükleyip ardından Self, Partner veya Life Vision seçeneğini seçebilirsin.", "Możesz ponownie wczytać stronę przeglądu, a następnie wybrać Self, Partner lub Life Vision.", "Μπορείς να επαναφορτώσεις την επισκόπηση και έπειτα να επιλέξεις Self, Partner ή Life Vision.", "Можно перезагрузить обзор, а затем выбрать Self, Partner или Life Vision."],
  ["Try again", "Reintentar", "Yeniden dene", "Spróbuj ponownie", "Δοκίμασε ξανά", "Повторить"],
  ["The snapshot could not be displayed.", "No se ha podido mostrar el panorama.", "Görünüm görüntülenemedi.", "Nie udało się wyświetlić obrazu.", "Δεν ήταν δυνατή η εμφάνιση της εικόνας.", "Не удалось отобразить обзор."],
  ["Your answers existed only in the current page state. You can reload this section or start again.", "Tus respuestas solo existían en el estado actual de la página. Puedes volver a cargar esta sección o empezar de nuevo.", "Yanıtların yalnızca sayfanın mevcut durumundaydı. Bu bölümü yeniden yükleyebilir veya baştan başlayabilirsin.", "Twoje odpowiedzi istniały wyłącznie w bieżącym stanie strony. Możesz ponownie wczytać tę część lub zacząć od nowa.", "Οι απαντήσεις σου υπήρχαν μόνο στην τρέχουσα κατάσταση της σελίδας. Μπορείς να επαναφορτώσεις αυτή την ενότητα ή να ξεκινήσεις από την αρχή.", "Ваши ответы существовали только в текущем состоянии страницы. Можно перезагрузить этот раздел или начать заново."],
  ["Life area", "Ámbito de vida", "Yaşam alanı", "Obszar życia", "Τομέας ζωής", "Сфера жизни"],
  ["Select four to six life areas.", "Selecciona entre cuatro y seis ámbitos de vida.", "Dört ila altı yaşam alanı seç.", "Wybierz od czterech do sześciu obszarów życia.", "Επίλεξε τέσσερις έως έξι τομείς ζωής.", "Выберите от четырёх до шести сфер жизни."],
  ["Check the name of your custom life area.", "Comprueba el nombre de tu ámbito de vida propio.", "Kendi yaşam alanının adını kontrol et.", "Sprawdź nazwę własnego obszaru życia.", "Έλεγξε το όνομα του δικού σου τομέα ζωής.", "Проверьте название своей сферы жизни."],
  ["Mark one to three areas that are especially important right now.", "Marca entre uno y tres ámbitos que sean especialmente importantes ahora.", "Şu anda özellikle önemli olan bir ila üç alanı işaretle.", "Zaznacz od jednego do trzech obszarów, które są teraz szczególnie ważne.", "Σημείωσε έναν έως τρεις τομείς που είναι ιδιαίτερα σημαντικοί αυτή τη στιγμή.", "Отметьте от одной до трёх сфер, которые сейчас особенно важны."],
  ["Priorities must belong to your selected life areas.", "Las prioridades deben pertenecer a los ámbitos de vida que has seleccionado.", "Öncelikler seçtiğin yaşam alanlarına ait olmalıdır.", "Priorytety muszą należeć do wybranych obszarów życia.", "Οι προτεραιότητες πρέπει να ανήκουν στους τομείς ζωής που επέλεξες.", "Приоритеты должны относиться к выбранным сферам жизни."],
  ["For every selected area, describe its current space and effect on your capacity.", "Para cada ámbito seleccionado, describe el espacio que ocupa ahora y su efecto sobre tu capacidad.", "Seçtiğin her alan için bugünkü yerini ve kapasiten üzerindeki etkisini belirt.", "Dla każdego wybranego obszaru opisz jego obecną przestrzeń i wpływ na Twoje zasoby.", "Για κάθε επιλεγμένο τομέα, περίγραψε τον χώρο που καταλαμβάνει τώρα και την επίδρασή του στην αντοχή σου.", "Для каждой выбранной сферы опишите, сколько места она сейчас занимает и как влияет на ваш запас сил."],
  ["Choose a desired direction for every area, including ‘still uncertain’ when that fits.", "Elige una dirección deseada para cada ámbito, incluida la opción «aún no está claro» cuando encaje.", "Her alan için istediğin yönü seç; uygunsa “henüz belirsiz” seçeneğini de kullanabilirsin.", "Wybierz pożądany kierunek dla każdego obszaru, w tym „jeszcze nie wiem”, jeśli ta odpowiedź pasuje.", "Επίλεξε την επιθυμητή κατεύθυνση για κάθε τομέα, μαζί με το «ακόμη αβέβαιο» όταν ταιριάζει.", "Выберите желаемое направление для каждой сферы, включая «пока неясно», если этот ответ подходит."],
  ["Select one to three current conditions.", "Selecciona entre una y tres condiciones actuales.", "Bir ila üç güncel koşul seç.", "Wybierz od jednego do trzech obecnych warunków.", "Επίλεξε μία έως τρεις σημερινές συνθήκες.", "Выберите от одного до трёх нынешних условий."],
  ["‘No specific constraint’ can only be selected by itself.", "«Ninguna limitación concreta» solo puede seleccionarse por sí sola.", "“Belirli bir kısıt yok” yalnızca tek başına seçilebilir.", "„Brak konkretnego ograniczenia” można wybrać tylko samodzielnie.", "Το «Κανένας συγκεκριμένος περιορισμός» μπορεί να επιλεγεί μόνο του.", "Вариант «Нет конкретных ограничений» можно выбрать только отдельно."],
  ["Describe how you relate to a possible tension today.", "Describe cómo te sitúas hoy ante una posible tensión.", "Bugün olası bir gerilimle nasıl ilişki kurduğunu belirt.", "Opisz, jak odnosisz się dziś do możliwego napięcia.", "Περίγραψε πώς τοποθετείσαι σήμερα απέναντι σε μια πιθανή ένταση.", "Опишите, как вы сегодня относитесь к возможному противоречию."],
  ["Choose one area for further reflection.", "Elige un ámbito para seguir reflexionando.", "Daha ayrıntılı düşünmek için bir alan seç.", "Wybierz jeden obszar do dalszej refleksji.", "Επίλεξε έναν τομέα για περαιτέρω αναστοχασμό.", "Выберите одну сферу для дальнейшего размышления."],
  ["Select one or two source signals.", "Selecciona una o dos señales de origen.", "Bir veya iki kaynak sinyali seç.", "Wybierz jeden lub dwa sygnały źródłowe.", "Επίλεξε ένα ή δύο σήματα προέλευσης.", "Выберите один или два сигнала происхождения."],
  ["‘Still uncertain’ can only be selected by itself here.", "Aquí, «aún no está claro» solo puede seleccionarse por sí sola.", "“Henüz belirsiz” burada yalnızca tek başına seçilebilir.", "Opcję „jeszcze nie wiem” można tutaj wybrać tylko samodzielnie.", "Το «ακόμη αβέβαιο» μπορεί εδώ να επιλεγεί μόνο του.", "Вариант «Пока неясно» здесь можно выбрать только отдельно."],
  ["Describe whether the connected assumption or constraint still applies today.", "Describe si la suposición o limitación asociada sigue siendo válida hoy.", "Bağlantılı varsayımın veya kısıtın bugün hâlâ geçerli olup olmadığını belirt.", "Opisz, czy związane z tym założenie lub ograniczenie nadal obowiązuje.", "Περίγραψε αν η σχετική παραδοχή ή ο περιορισμός εξακολουθεί να ισχύει σήμερα.", "Опишите, остаётся ли сегодня актуальным связанное с этим предположение или ограничение."],
  ["Use 12 to 240 valid characters for the optional note, or leave it empty.", "Usa entre 12 y 240 caracteres válidos para la nota opcional o déjala vacía.", "İsteğe bağlı not için 12 ila 240 geçerli karakter kullan veya alanı boş bırak.", "W opcjonalnej notatce użyj od 12 do 240 prawidłowych znaków albo pozostaw ją pustą.", "Χρησιμοποίησε 12 έως 240 έγκυρους χαρακτήρες για την προαιρετική σημείωση ή άφησέ την κενή.", "Используйте для необязательной заметки от 12 до 240 допустимых символов или оставьте её пустой."],
  ["Choose a small next mode; changing nothing yet is also available.", "Elige una pequeña forma de continuar; también puedes no cambiar nada todavía.", "Küçük bir sonraki ilerleme biçimi seç; henüz hiçbir şeyi değiştirmemek de bir seçenektir.", "Wybierz mały kolejny sposób działania; możesz też na razie niczego nie zmieniać.", "Επίλεξε έναν μικρό τρόπο συνέχειας· μπορείς επίσης να μην αλλάξεις τίποτα ακόμη.", "Выберите небольшой способ продолжить; пока ничего не менять — тоже допустимый вариант."],
  ["The reflection is not complete yet.", "La reflexión aún no está completa.", "Düşünme henüz tamamlanmadı.", "Refleksja nie jest jeszcze kompletna.", "Ο αναστοχασμός δεν έχει ακόμη ολοκληρωθεί.", "Размышление ещё не завершено."],
  ["Why", "Por qué", "Neden", "Dlaczego", "Γιατί", "Почему"],
  ["Example", "Ejemplo", "Örnek", "Przykład", "Παράδειγμα", "Пример"],
  ["Learning opportunity", "Oportunidad de aprendizaje", "Öğrenme fırsatı", "Możliwość nauki", "Ευκαιρία μάθησης", "Возможность узнать новое"],
  ["Reversible", "Reversible", "Geri alınabilir", "Odwracalne", "Αναστρέψιμο", "Обратимо"],
  ["yes", "sí", "evet", "tak", "ναι", "да"],
  ["not fully", "no del todo", "tam olarak değil", "nie w pełni", "όχι πλήρως", "не полностью"],
  ["Snapshot:", "Panorama:", "Görünüm:", "Obraz:", "Εικόνα:", "Обзор:"],
  ["Relationships across areas:", "Relaciones entre ámbitos:", "Alanlar arası ilişkiler:", "Relacje między obszarami:", "Σχέσεις μεταξύ τομέων:", "Связи между сферами:"],
  ["Current conditions:", "Condiciones actuales:", "Güncel koşullar:", "Obecne warunki:", "Σημερινές συνθήκες:", "Нынешние условия:"],
  ["Selected focus:", "Foco seleccionado:", "Seçilen odak:", "Wybrany punkt uwagi:", "Επιλεγμένη εστίαση:", "Выбранный фокус:"],
  ["Source and your interpretation:", "Origen y tu interpretación:", "Kaynak ve senin yorumun:", "Źródło i Twoja interpretacja:", "Προέλευση και δική σου ερμηνεία:", "Источник и ваше понимание:"],
  ["What you want to protect or make possible", "Lo que quieres proteger o hacer posible", "Korumak veya mümkün kılmak istediğin şey", "Co chcesz ochronić lub umożliwić", "Τι θέλεις να προστατεύσεις ή να καταστήσεις δυνατό", "Что вы хотите защитить или сделать возможным"],
  ["Small next experiment:", "Pequeño experimento siguiente:", "Küçük bir sonraki deneme:", "Mały kolejny eksperyment:", "Μικρό επόμενο πείραμα:", "Небольшой следующий эксперимент:"],
  ["Possible paths:", "Caminos posibles:", "Olası yollar:", "Możliwe drogi:", "Πιθανές διαδρομές:", "Возможные пути:"],
  ["Small tools:", "Pequeñas herramientas:", "Küçük araçlar:", "Małe narzędzia:", "Μικρά εργαλεία:", "Небольшие инструменты:"],
  ["Possible experiment", "Posible experimento", "Olası deneme", "Możliwy eksperyment", "Πιθανό πείραμα", "Возможный эксперимент"],
  ["Private short version without your free-text note or detailed conditions. No evaluation or professional advice.", "Versión breve privada sin tu nota de texto libre ni las condiciones detalladas. Sin evaluación ni asesoramiento profesional.", "Serbest metin notun veya ayrıntılı koşulların olmadan özel kısa sürüm. Değerlendirme veya profesyonel danışmanlık içermez.", "Prywatna krótka wersja bez notatki tekstowej i szczegółowych warunków. Bez oceny i profesjonalnej porady.", "Ιδιωτική σύντομη έκδοση χωρίς τη σημείωση ελεύθερου κειμένου ή τις λεπτομερείς συνθήκες. Χωρίς αξιολόγηση ή επαγγελματική συμβουλή.", "Личная краткая версия без текстовой заметки и подробных условий. Без оценки и профессиональных рекомендаций."],
] as const satisfies readonly SelfCopyRow[];

export type LifeAlignmentUiSelfSource =
  (typeof lifeAlignmentUiSelfCopyEntries)[number][0];

export type LifeAlignmentUiSelfCopy = Record<
  LifeAlignmentUiSelfSource,
  string
>;

export const lifeAlignmentUiSelfSourceStrings = lifeAlignmentUiSelfCopyEntries.map(
  ([source]) => source,
) as readonly LifeAlignmentUiSelfSource[];

function copyColumn(column: 1 | 2 | 3 | 4 | 5): LifeAlignmentUiSelfCopy {
  return Object.fromEntries(
    lifeAlignmentUiSelfCopyEntries.map((row) => [row[0], row[column]]),
  ) as LifeAlignmentUiSelfCopy;
}

export const lifeAlignmentUiSelfCopy = {
  es: copyColumn(1),
  tr: copyColumn(2),
  pl: copyColumn(3),
  el: copyColumn(4),
  ru: copyColumn(5),
} satisfies Record<AddedLifeLocale, LifeAlignmentUiSelfCopy>;

const templateTokenPattern = /\{\{[^{}]+\}\}|\$\{[^{}]+\}|\{[^{}]+\}|%[sdif]/g;

function templateTokens(value: string): readonly string[] {
  return value.match(templateTokenPattern) ?? [];
}

export function assertLifeAlignmentUiSelfCopyCompleteness(): void {
  const sources = new Set(lifeAlignmentUiSelfSourceStrings);
  if (sources.size !== lifeAlignmentUiSelfSourceStrings.length) {
    throw new Error("Life Alignment self UI source strings must be unique.");
  }

  for (const [locale, copy] of Object.entries(lifeAlignmentUiSelfCopy)) {
    const keys = Object.keys(copy);
    if (keys.length !== sources.size || keys.some((key) => !sources.has(key as LifeAlignmentUiSelfSource))) {
      throw new Error(`Life Alignment self UI copy is incomplete for ${locale}.`);
    }

    for (const source of lifeAlignmentUiSelfSourceStrings) {
      const translated = copy[source];
      if (!translated.trim()) {
        throw new Error(`Life Alignment self UI copy is blank for ${locale}: ${source}`);
      }
      if (templateTokens(source).join("\u0000") !== templateTokens(translated).join("\u0000")) {
        throw new Error(`Life Alignment self UI template tokens differ for ${locale}: ${source}`);
      }
    }
  }
}

assertLifeAlignmentUiSelfCopyCompleteness();
