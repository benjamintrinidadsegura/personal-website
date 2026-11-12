import Image from "next/image";
import type { LabItem } from "@/lib/experience-lab/search";
import styles from "./experience-lab.module.css";

/** Presentation only: existing approved assets or diagrams, never invented publications/contributions. */
export function IslandVisual({ item }: { item: LabItem }) {
  if (item.kind === "person" && item.image) return <span className={styles.portraitWindow} aria-hidden="true">
    <Image src={item.image.src} alt="" width={1280} height={720} unoptimized className={styles.portrait} />
  </span>;
  if (item.kind === "project") return <span className={styles.projectMark} aria-hidden="true">GOAT<span>RECRUTAINER</span><i>GR</i></span>;
  if (item.kind === "world") return <span className={styles.globe} aria-hidden="true">
    <svg viewBox="0 0 120 100"><ellipse cx="60" cy="50" rx="49" ry="43" /><ellipse cx="60" cy="50" rx="26" ry="43" /><path d="M12 50H108M20 28Q60 43 100 28M20 72Q60 58 100 72M60 7V93" /><path className={styles.land} d="M28 26 39 19 48 25 44 36 35 39 31 50 24 42ZM45 48 56 53 61 64 54 81 47 75 43 60ZM68 24 85 21 97 33 86 43 78 40 74 56 63 51 63 37ZM78 65 91 63 99 74 87 81 76 75Z" /></svg>
    <i /><i />
  </span>;
  if (item.kind === "community") return <span className={styles.echoVisual} aria-hidden="true"><i /><i /><b>echo</b><span>↗</span></span>;
  if (item.kind === "writing") return <span className={styles.editorialMark} aria-hidden="true">Aa<span>—</span></span>;
  if (item.kind === "idea") return <span className={styles.ideaMark} aria-hidden="true"><i /><i /><span>✦</span></span>;
  if (item.id === "career") return <span className={styles.toolScene} aria-hidden="true"><Image src="/images/find-your-next-step/context-scenes/career-exploration.webp" alt="" fill sizes="240px" /><span>↗</span></span>;
  return <span className={styles.toolVisual} aria-hidden="true">
    <svg viewBox="0 0 120 80">{item.id === "relationship"
      ? <><circle cx="43" cy="40" r="26" /><circle cx="77" cy="40" r="26" /><path d="M53 19Q80 40 53 61" /></>
      : <><circle cx="60" cy="40" r="32" /><path d="M60 1V79M21 40H99M43 57 52 32 78 21 68 48Z" /><circle cx="60" cy="40" r="4" /></>}</svg>
  </span>;
}
