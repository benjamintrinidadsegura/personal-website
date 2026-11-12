import Image from "next/image";
import type { LabItem } from "@/lib/experience-lab/search";
import styles from "./experience-lab.module.css";

/** Real local visuals and original diagrams; no invented publication, person or product screenshot. */
export function IslandVisual({ item, featured = false }: { item: LabItem; featured?: boolean }) {
  let visual;
  if (item.kind === "person" && item.image) {
    visual = <span className={styles.portraitStory}>
      <svg viewBox="164 78 254 258" preserveAspectRatio="xMidYMid slice"><image href={item.image.src} x="0" y="0" width="1280" height="720" /></svg>
    </span>;
  } else if (item.kind === "project") {
    visual = <span className={styles.projectArt}><i /><i /><span className={styles.wordmark}>
      {item.title === "GOATRECRUTAINER" ? <>GOAT<small>RECRUTAINER</small></> : item.title}
    </span></span>;
  } else if (item.kind === "world") {
    visual = <span className={styles.worldArt}><Image src="/images/experience-lab/world-atlas.svg" alt="" fill unoptimized loading={featured ? "eager" : "lazy"} /></span>;
  } else if (item.kind === "community") {
    visual = <span className={styles.echoArt}><b>echo</b><i /><i /></span>;
  } else if (item.kind === "writing") {
    visual = <span className={styles.editorialArt}><b>“</b><span>{item.topics[0]}</span></span>;
  } else if (item.kind === "idea") {
    visual = <span className={styles.ideaArt}><b>?</b><i /><i /></span>;
  } else {
    const src = item.id === "career" ? "/images/find-your-next-step/context-scenes/career-exploration.webp"
      : item.id === "relationship" ? "/images/life-alignment/context-scenes/partner.webp"
      : "/images/find-your-next-step/context-scenes/self-reflection.webp";
    visual = <Image src={src} alt="" fill sizes="(min-width: 1200px) 480px, 320px" loading={featured ? "eager" : "lazy"} className={styles.sceneImage} />;
  }
  return <span className={styles.art} data-lab-visual aria-hidden="true"><span className={styles.artContent}>{visual}</span></span>;
}
