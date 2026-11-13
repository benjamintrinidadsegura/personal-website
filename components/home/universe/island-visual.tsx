import Image from "next/image";
import type { UniverseItem } from "@/lib/discovery-universe/content";
import styles from "./universe.module.css";

/** Real local visuals and original diagrams; no invented publication, person or product screenshot. */
export function IslandVisual({ item, featured = false }: { item: UniverseItem; featured?: boolean }) {
  let visual;
  if (item.kind === "person" && item.image) {
    visual = <span className={styles.portraitStory}>
      {item.href.endsWith("/people/evgeny-vinokurov") ? <svg viewBox="164 78 254 258" preserveAspectRatio="xMidYMid slice"><image href={item.image.src} x="0" y="0" width="1280" height="720" /></svg> : <Image src={item.image.src} alt="" fill sizes="180px" loading={featured ? "eager" : "lazy"} className={styles.sceneImage} />}
    </span>;
  } else if (item.kind === "project") {
    visual = <span className={styles.projectArt} data-project-context>
      <span className={styles.projectTopics}>{item.topics.slice(0, 2).join(" · ")}</span>
      <span className={styles.projectDescription} lang={item.language}>{item.summary}</span>
    </span>;
  } else if (item.kind === "world") {
    visual = <span className={styles.worldArt}><Image src="/images/experience-lab/world-atlas.svg" alt="" fill unoptimized loading={featured ? "eager" : "lazy"} /></span>;
  } else if (item.kind === "community") {
    visual = <span className={styles.echoArt}><b>echo</b><i /><i /></span>;
  } else if (item.kind === "writing") {
    visual = <span className={styles.editorialArt}><b>“</b><span>{item.topics[0]}</span></span>;
  } else if (item.kind === "page") {
    visual = <span className={styles.ideaArt}><b>?</b><i /><i /></span>;
  } else {
    const src = item.id === "tool-find-your-next-step-career" ? "/images/find-your-next-step/context-scenes/career-exploration.webp"
      : item.id === "tool-life-alignment-partner" ? "/images/life-alignment/context-scenes/partner.webp"
      : "/images/find-your-next-step/context-scenes/self-reflection.webp";
    visual = <Image src={src} alt="" fill sizes="(min-width: 1200px) 480px, 320px" loading={featured ? "eager" : "lazy"} className={styles.sceneImage} />;
  }
  return <span className={styles.art} data-universe-visual aria-hidden="true"><span className={styles.artContent}>{visual}</span></span>;
}
