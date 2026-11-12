import { projects } from "@/data/projects";
import { getLocalizedPublishedSpotlights } from "@/data/i18n/people";
import { localizeHref } from "@/lib/i18n/routing";
import type { Locale } from "@/lib/i18n/config";

export const identityDirections = [
  {id:"a",name:"Cinematic Blue"},
  {id:"b",name:"Liquid Glass Editorial"},
  {id:"c",name:"Spatial Discovery"},
] as const;
export type IdentityDirection = (typeof identityDirections)[number]["id"];
export function identityDirection(value:unknown):IdentityDirection {
  return value==="b"||value==="c"?value:"a";
}
type Copy = {headlines:readonly[string,string,string];intro:string;search:string;staticSearch:string;study:string;directions:string;people:string;writing:string;tools:string;projects:string;world:string;perspective:string;note:string};
export const identityCopy:Record<Locale,Copy> = {
 en:{headlines:["A world of\npossibility.","Human by\ndesign.","Find a new\npoint of view."],intro:"One universe. Your perspective. Your journey.",search:"Where will your curiosity take you?",staticSearch:"Static search study · no live search",study:"Visual identity study",directions:"Design directions",people:"People",writing:"Writing",tools:"Tools",projects:"Projects",world:"World Map",perspective:"Different paths. A shared curiosity.",note:"Static design prototype. Existing public destinations; no adaptive results or data collection."},
 de:{headlines:["Eine Welt.\nDein Blick.","Nah am\nMenschen.","Entdecke neue\nPerspektiven."],intro:"Ein Universum. Deine Perspektive. Dein Weg.",search:"Wohin führt dich deine Neugier?",staticSearch:"Statische Suchstudie · keine Live-Suche",study:"Studie zur visuellen Identität",directions:"Gestaltungsrichtungen",people:"Menschen",writing:"Writing",tools:"Tools",projects:"Projekte",world:"World Map",perspective:"Verschiedene Wege. Gemeinsame Neugier.",note:"Statischer Designprototyp. Bestehende öffentliche Ziele; keine adaptiven Ergebnisse oder Datenerfassung."},
 es:{headlines:["Un mundo.\nTu mirada.","Humano por\nnaturaleza.","Descubre otra\nperspectiva."],intro:"Un universo. Tu perspectiva. Tu camino.",search:"¿Adónde te llevará tu curiosidad?",staticSearch:"Estudio visual · sin búsqueda en vivo",study:"Estudio de identidad visual",directions:"Direcciones de diseño",people:"Personas",writing:"Writing",tools:"Herramientas",projects:"Proyectos",world:"World Map",perspective:"Caminos distintos. Una curiosidad común.",note:"Prototipo de diseño estático. Destinos públicos existentes; sin resultados adaptativos ni recopilación de datos."},
 tr:{headlines:["Bir dünya.\nSenin bakışın.","Özünde\ninsan var.","Yeni bir bakış\nkeşfet."],intro:"Bir evren. Senin bakışın. Senin yolculuğun.",search:"Merakın seni nereye götürecek?",staticSearch:"Statik arama tasarımı · canlı arama yok",study:"Görsel kimlik çalışması",directions:"Tasarım yönleri",people:"İnsanlar",writing:"Writing",tools:"Araçlar",projects:"Projeler",world:"World Map",perspective:"Farklı yollar. Ortak bir merak.",note:"Statik tasarım prototipi. Mevcut herkese açık hedefler; uyarlanabilir sonuç veya veri toplama yok."},
 pl:{headlines:["Jeden świat.\nTwoje spojrzenie.","Człowiek\nw centrum.","Odkryj nową\nperspektywę."],intro:"Jeden wszechświat. Twoja perspektywa. Twoja droga.",search:"Dokąd zaprowadzi Cię ciekawość?",staticSearch:"Statyczny projekt · bez wyszukiwania",study:"Studium identyfikacji wizualnej",directions:"Kierunki projektu",people:"Ludzie",writing:"Writing",tools:"Narzędzia",projects:"Projekty",world:"World Map",perspective:"Różne drogi. Wspólna ciekawość.",note:"Statyczny prototyp projektu. Istniejące publiczne strony; bez wyników adaptacyjnych i zbierania danych."},
 el:{headlines:["Ένας κόσμος.\nΗ ματιά σου.","Για τον\nάνθρωπο.","Μια νέα\nοπτική γωνία."],intro:"Ένα σύμπαν. Η οπτική σου. Το ταξίδι σου.",search:"Πού θα σε οδηγήσει η περιέργεια;",staticSearch:"Στατική μελέτη · χωρίς ζωντανή αναζήτηση",study:"Μελέτη οπτικής ταυτότητας",directions:"Σχεδιαστικές κατευθύνσεις",people:"Άνθρωποι",writing:"Writing",tools:"Εργαλεία",projects:"Έργα",world:"World Map",perspective:"Διαφορετικοί δρόμοι. Κοινή περιέργεια.",note:"Στατικό πρωτότυπο. Υπάρχοντες δημόσιοι προορισμοί· χωρίς προσαρμοστικά αποτελέσματα ή συλλογή δεδομένων."},
 ru:{headlines:["Один мир.\nТвой взгляд.","Человек\nв основе.","Открой новую\nточку зрения."],intro:"Одна вселенная. Твой взгляд. Твой путь.",search:"Куда приведёт твоё любопытство?",staticSearch:"Статичный макет · без живого поиска",study:"Исследование визуального стиля",directions:"Направления дизайна",people:"Люди",writing:"Writing",tools:"Инструменты",projects:"Проекты",world:"World Map",perspective:"Разные пути. Общее любопытство.",note:"Статичный дизайн-прототип. Существующие публичные страницы; без адаптивных результатов и сбора данных."},
};
/** Existing public references only. No publication query, generated record or search adapter. */
export function identityContent(locale:Locale){
 const person=getLocalizedPublishedSpotlights(locale).find(item=>item.slug==="evgeny-vinokurov");
 const project=projects.find(item=>item.slug==="goatrecrutainer");
 return {
  person:person?.cover?{name:person.fullName,image:person.cover.src,href:localizeHref("/people/"+person.slug,locale),language:person.language}:null,
  project:project?{name:project.name,href:localizeHref("/projects/"+project.slug,locale)}:null,
  writing:localizeHref("/writing",locale),tool:localizeHref("/tools/personal-advantage",locale),world:localizeHref("/world",locale),
 };
}
