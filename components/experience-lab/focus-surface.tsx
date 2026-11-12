import Link from "next/link";
import { focusCopy } from "@/data/experience-lab/focus-copy";
import { labCopy } from "@/data/experience-lab/copy";
import { labContext,sharedLabTopics } from "@/lib/experience-lab/context";
import type { LabItem,LabKind,LabMatch } from "@/lib/experience-lab/search";
import { localeDetails,type Locale } from "@/lib/i18n/config";
import styles from "./experience-lab.module.css";

export function FocusSurface({match,query,kind,locale,related,onBack,onRefine,onSelect}:{
 match:LabMatch;query:string;kind:LabKind|"all";locale:Locale;related:readonly LabItem[];
 onBack:()=>void;onRefine:()=>void;onSelect:(id:string)=>void;
}) {
 const {item}=match,copy=labCopy[locale],focus=focusCopy[locale],evidence=labContext(match,query);
 return <section id="lab-detail" tabIndex={-1} aria-labelledby="lab-detail-title" className={styles.focusSurface} onKeyDown={event=>{if(event.key==="Escape"){event.preventDefault();onBack();}}}>
   <div className={styles.focusToolbar}><button type="button" onClick={onBack}>← {focus.back}</button><button type="button" onClick={onRefine}>{focus.changeSearch} ↗</button></div>
   <div className={styles.focusHeader}>
    <p className={styles.eyebrow}>{focus.focus} / {item.source==="demo"?copy.demo:copy.kinds[item.kind]}</p>
    <h2 id="lab-detail-title" lang={item.language}>{item.title}</h2>
   </div>
   <div className={styles.focusBody}>
   <p lang={item.language} className={styles.summary}>{item.summary}</p>
   <p className={styles.source}>{item.source==="demo"?copy.demo:copy.public} · {copy.source} {localeDetails[item.language].languageName}</p>
   {item.source==="public"?<Link className={styles.open} href={item.href} prefetch={false}>{copy.open}<span aria-hidden="true">↗</span></Link>:null}
   <details className={styles.focusNotes}><summary>{focus.why}</summary>
   <div className={styles.context} aria-labelledby="lab-context-title">
    <h3 id="lab-context-title">{focus.why}</h3>
    <p>{evidence.searched?focus.search:focus.neutral}</p>
    {evidence.topics.length?<dl><dt>{focus.topics}</dt><dd>{evidence.topics.join(" · ")}</dd></dl>:null}
    {kind!=="all"?<dl><dt>{focus.category}</dt><dd>{copy.kinds[kind]}</dd></dl>:null}
   </div>
   {related.length?<aside className={styles.related} aria-labelledby="lab-related-title"><h3 id="lab-related-title">{copy.related}</h3>
    {related.map(other=><button key={other.id} type="button" onClick={()=>onSelect(other.id)}>
     <span><small>{focus.shared} · {sharedLabTopics(item,other).join(" · ")}</small><strong lang={other.language}>{other.title}</strong></span><span aria-hidden="true">↗</span>
    </button>)}
   </aside>:null}
   </details>
   <p className={styles.focusHint}>{focus.hint}</p>
   </div>
 </section>;
}
