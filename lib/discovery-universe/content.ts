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
  if (!/^\/(?:$|writing(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)?$|projects\/[a-z0-9-]+$|people(?:\/[a-z0-9-]+)?$|world$|community$|echowall$|about(?:\/(?:nerd-corner|how-my-brain-works))?$|find-your-next-step(?:\/(?:self|career|problem|idea))?$|life-alignment(?:\/(?:self|partner|life-vision|family|friendship|career|team|founder))?$|tools\/(?:personal-advantage|money-profile)$)/u.test(path)) return null;
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
/** A small editorial entry collection, never a ranked or invented search result.
 * Resolve references against the current public catalog and published Writing read. */
// Additional editorial references reuse existing public records, never duplicate content.
const perspectiveReferences = [...welcomeOrder, "tool-personal-advantage", "tool-money-profile",
  "person-kiki-radicke", "person-kevin-schweisfurth", "pulse-people-kiki-radicke", "pulse-people-kevin-schweisfurth",
  "pulse-people-johanna-geisler", "pulse-people-melanie-kleinhenz", "pulse-people-amr-medhat", "project-ratecom", "project-hobbyswap",
  "project-streamory", "project-byc", "page-writing", "page-brain-manual", "page-about",
  "tool-life-alignment-family", "tool-life-alignment-friendship", "tool-life-alignment-career",
  "tool-life-alignment-team", "tool-life-alignment-founder"];
export const curatedEntryLimit = 7;
export function curatedUniverseMatches(matches: readonly UniverseMatch[], latestWritingId?: string, round = 0, entryId = ""): UniverseMatch[] {
  const resolved = uniqueDestinations(matches.map(match=>({...match,score:0,presentation:"suggestion" as const,matchedTopics:[]})));
  const initialReferences = [...(latestWritingId ? [`writing-${latestWritingId}`] : []), ...welcomeOrder, "tool-personal-advantage"];
  const resolve = (ids:readonly string[]) => ids.flatMap(id=>{const match=resolved.find(match=>match.item.id===id);return match?[match]:[];});
  const pool = uniqueDestinations([...resolve(perspectiveReferences),...resolved.filter(match=>match.item.kind==="writing")]);
  const cycle = Number.isSafeInteger(round) && round > 0 ? round : 0;
  let selection:UniverseMatch[];
  if (!cycle) selection=resolve(initialReferences);
  else {
    const order:UniverseKind[]=["person","project","tool","world","community","writing","page"];
    const buckets=order.map(kind=>pool.filter(match=>match.item.kind===kind)).filter(bucket=>bucket.length);
    selection=buckets.map(bucket=>bucket[(cycle-1)%bucket.length]);
    // Fill sparse categories only from actual available public records.
    const remaining=pool.filter(match=>!selection.some(chosen=>chosen.item.href===match.item.href));
    const start=remaining.length ? (cycle-1)%remaining.length : 0;
    selection.push(...remaining.slice(start),...remaining.slice(0,start));
    selection=selection.slice(0,curatedEntryLimit);
    const offset=cycle%Math.max(1,selection.length);
    selection=[...selection.slice(offset),...selection.slice(0,offset)];
  }
  // A complete-list selection may be outside the editorial references. It is
  // admitted only from the current validated catalog, retaining the seven-entry cap.
  const chosen=resolved.find(match=>match.item.id===entryId);
  return uniqueDestinations([...(chosen?[chosen]:[]),...selection]).slice(0,curatedEntryLimit);
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
