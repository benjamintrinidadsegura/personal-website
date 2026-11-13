import { getDiscoveryUiCopy } from "@/data/i18n/discovery";
import { locales } from "@/lib/i18n/config";
import { publishedSpotlights } from "@/data/spotlights";
import { normalizeDiscoveryText } from "@/lib/discovery";
import { localizeHref, stripLocalePrefix } from "@/lib/i18n/routing";
import type { Locale } from "@/lib/i18n/config";
import type { DiscoveryItem, DiscoveryMatch, DiscoveryStatus } from "@/types/discovery";

export type UniverseKind = "project" | "writing" | "tool" | "person" | "world" | "community" | "page";
export type UniverseItem = { id:string; kind:UniverseKind; title:string; summary:string; topics:readonly string[]; keywords:readonly string[]; language:Locale; href:string; status:DiscoveryStatus; image?:{src:string;alt:string} };
export type UniverseMatch = { item:UniverseItem; score:number; matchedTopics:readonly string[]; presentation?:"match"|"suggestion"|"related" };
// Editorial references only. All copy, availability, hrefs and ranking come from Discovery.
const welcomeOrder = ["person-evgeny-vinokurov", "tool-life-alignment", "project-goatrecrutainer", "page-world-map", "tool-echowall", "tool-find-your-next-step"];
export function universeItem(item:DiscoveryItem, locale:Locale): UniverseItem | null {
  if (!item.href || /[?%\\\s]/u.test(item.href)) return null;
  const path = stripLocalePrefix(item.href.split("#")[0]);
  // Explicit public navigation families, never authentication, invitation or session paths.
  if (!/^\/(?:$|writing(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)?$|projects\/[a-z0-9-]+$|people(?:\/[a-z0-9-]+)?$|world$|echowall$|about(?:\/(?:nerd-corner|how-my-brain-works))?$|find-your-next-step(?:\/(?:self|career|problem|idea))?$|life-alignment(?:\/(?:self|partner|life-vision|family|friendship|career|team|founder))?$|tools\/(?:personal-advantage|money-profile)$)/u.test(path)) return null;
  // A public project description may exist before its product launches.
  // This exception never applies to unpublished articles or unavailable tools.
  if (item.status !== "Live" && item.status !== "Beta" && !path.startsWith("/projects/")) return null;
  if (path.startsWith("/writing/") && item.status !== "Live") return null;
  const profileSlug=path.match(/^\/people\/([a-z0-9-]+)$/u)?.[1];
  const person=profileSlug?publishedSpotlights.find(person=>person.slug===profileSlug):undefined;
  if (profileSlug && !person) return null;
  const kind: UniverseKind = path.startsWith("/writing/") ? "writing" : person ? "person" : item.group === "Projects" ? "project" : path === "/world" ? "world" : path === "/echowall" ? "community" : item.group === "Tools" ? "tool" : "page";
  return { id:item.id, kind, title:item.title, summary:item.description, topics:[...item.tags], keywords:item.keywords, language:item.contentLanguage ?? locale, href:item.href, status:item.status, ...(person ? {image:person.cover} : {}) };
}
export function publicUniverse(items:readonly DiscoveryItem[], locale:Locale): UniverseItem[] {
  // Keep indexed aliases until ranking: deduplicating earlier can discard the
  // strongest title match merely because an earlier format shares its href.
  const writingTargets=new Map(items.flatMap(item=>{
    const path=item.href?stripLocalePrefix(item.href.split("#")[0]):"";
    return item.status==="Live" && item.contentLanguage && /^\/writing\/[a-z0-9-]+$/u.test(path)
      ? [[path,{href:localizeHref(item.href!,item.contentLanguage),language:item.contentLanguage}] as const] : [];
  }));
  return items.flatMap(item=>{
    const path=item.href?stripLocalePrefix(item.href.split("#")[0]):"";
    const canonical=writingTargets.get(path);
    // Pulse/format references reuse the current published record's real language.
    const content=universeItem(canonical?{...item,href:canonical.href,contentLanguage:canonical.language}:item,locale);
    return content?[content]:[];
  });
}
function uniqueDestinations(matches:UniverseMatch[]):UniverseMatch[] {
  const seen=new Set<string>();
  return matches.filter(({item})=>{if(seen.has(item.href))return false;seen.add(item.href);return true;});
}
export function universeMatches(items:readonly UniverseItem[], matches:readonly DiscoveryMatch[], query:string): UniverseMatch[] {
  if (query.trim()) return uniqueDestinations(matches.flatMap(match => {const item=items.find(item=>item.id===match.item.id);return item?[{item,score:match.score,presentation:match.presentation,matchedTopics:match.reasons.map(reason=>reason.displayValue)}]:[];}));
  const sorted=[...items].sort((a,b)=>{
    const position=(item:UniverseItem)=>item.kind==="writing"?5:welcomeOrder.includes(item.id)?welcomeOrder.indexOf(item.id):100;
    return position(a)-position(b);
  });
  return uniqueDestinations(sorted.map(item=>({item,score:0,presentation:"suggestion" as const,matchedTopics:[]})));
}
const genericTopics = new Set([
  "page", "tool", "writing", "format", "interview",
  ...locales.flatMap(locale=>Object.values(getDiscoveryUiCopy(locale).groups)),
].map(normalizeDiscoveryText));
export function sharedUniverseTopics(item:UniverseItem, other:UniverseItem):string[] {
  const topics=new Set(item.topics.map(normalizeDiscoveryText));
  return other.topics.filter(topic=>topics.has(normalizeDiscoveryText(topic)) && !genericTopics.has(normalizeDiscoveryText(topic)));
}
export function relatedUniverseItems(item:UniverseItem, items:readonly UniverseItem[], limit=2):UniverseItem[] {
  return items.filter(other=>other.id!==item.id && other.href!==item.href).map(other=>({item:other,count:sharedUniverseTopics(item,other).length}))
    .filter(other=>other.count>0).sort((a,b)=>b.count-a.count).slice(0,Math.max(0,limit)).map(other=>other.item);
}
