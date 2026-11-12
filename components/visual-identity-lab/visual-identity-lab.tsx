import Link from "next/link";
import Image from "next/image";
import { identityContent,identityCopy,identityDirections,type IdentityDirection } from "@/data/visual-identity-lab";
import type { Locale } from "@/lib/i18n/config";
import { localizeHref } from "@/lib/i18n/routing";
import styles from "./visual-identity-lab.module.css";

export function VisualIdentityLab({locale,direction}:{locale:Locale;direction:IdentityDirection}){
 const copy=identityCopy[locale],content=identityContent(locale),index=identityDirections.findIndex(item=>item.id===direction);
 return <article className={styles.lab} data-identity={direction} aria-labelledby="identity-title">
  <header className={styles.reviewBar}><span className={styles.edition}>BTSHQ <span>/ VISUAL IDENTITY 6.0</span></span>
   <nav aria-label={copy.directions}>{identityDirections.map(item=><Link key={item.id} prefetch={false} href={localizeHref("/experience-lab/identity?direction="+item.id,locale)} aria-current={item.id===direction?"page":undefined}><b>{item.id.toUpperCase()}</b><span>{item.name}</span></Link>)}</nav>
  </header>
  <section className={styles.scene} data-identity-scene aria-label={identityDirections[index].name}>
   {direction==="b"?<div className={styles.material} aria-hidden="true"/>:null}
   {direction==="c"?<svg className={styles.connections} aria-hidden="true" viewBox="0 0 1000 760" preserveAspectRatio="none"><path d="M500 380C380 380 355 315 240 315M500 380C670 380 670 160 800 160M500 380C650 380 650 610 800 610M500 380C500 510 460 590 460 660"/></svg>:null}
   <div className={styles.heading}><p className={styles.eyebrow}>{copy.intro}</p><h1 id="identity-title">{copy.headlines[index].split("\n").map((line,i)=><span key={i}>{line}</span>)}</h1></div>
   {content.person?<div className={styles.person}>
    <span className={styles.photo}><svg aria-hidden="true" viewBox="164 78 254 258" preserveAspectRatio="xMidYMid slice"><image href={content.person.image} x="0" y="0" width="1280" height="720"/></svg></span>
    <Link prefetch={false} href={content.person.href} aria-label={copy.people+" · "+content.person.name} className={styles.personCaption}><small>Career Spotlight</small><strong lang={content.person.language}>{content.person.name}</strong><span aria-hidden="true">↗</span></Link>
   </div>:null}
   <div className={styles.searchAnchor} data-identity-search><div className={styles.lens} role="img" aria-label={copy.staticSearch+": "+copy.search}>
    <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/></svg><span>{copy.search}</span><span className={styles.lensMark} aria-hidden="true">BTS</span>
   </div><p className={styles.searchNote}>{copy.staticSearch}</p></div>
   {direction==="c"?<>
    <Link prefetch={false} className={styles.world} href={content.world}><span className={styles.atlas}><Image src="/images/experience-lab/world-atlas.svg" alt="" width={500} height={300} unoptimized/></span><span className={styles.objectLabel}><strong>{copy.world}</strong><span aria-hidden="true">↗</span></span></Link>
    <Link prefetch={false} className={styles.tool} href={content.tool}><span className={styles.toolImage}><Image src="/images/find-your-next-step/context-scenes/self-reflection.webp" alt="" fill sizes="(max-width: 600px) 180px, 440px"/></span><span className={styles.objectLabel}><small>{copy.tools}</small><strong>Personal Advantage</strong><span aria-hidden="true">↗</span></span></Link>
    <Link prefetch={false} className={styles.writing} href={content.writing}><small>{copy.writing}</small><strong>Writing</strong><span aria-hidden="true">↗</span></Link>
   </>:<nav className={styles.index} aria-label={copy.perspective}>
    <Link prefetch={false} href={content.writing}><small>{copy.writing}</small><strong>Writing</strong><span aria-hidden="true">↗</span></Link>
    <Link prefetch={false} href={content.tool}><small>{copy.tools}</small><strong>Personal Advantage</strong><span aria-hidden="true">↗</span></Link>
    {content.project?<Link prefetch={false} href={content.project.href}><small>{copy.projects}</small><strong>{content.project.name}</strong><span aria-hidden="true">↗</span></Link>:null}
   </nav>}
  </section>
  <footer className={styles.reviewNote}><p>{copy.note}</p><Link prefetch={false} href={localizeHref("/",locale)}>BTSHQ ↗</Link></footer>
 </article>;
}
