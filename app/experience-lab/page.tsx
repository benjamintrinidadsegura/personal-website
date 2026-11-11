import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ExperienceLab } from "@/components/experience-lab/experience-lab";
import { createLabCatalog } from "@/data/experience-lab/catalog";
import { labCopy } from "@/data/experience-lab/copy";
import { createLocalizedMetadata } from "@/lib/i18n/metadata";
import { getLocale } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    ...createLocalizedMetadata({
      locale, pathname: "/experience-lab", title: "Experience Lab | BTSHQ",
      description: labCopy[locale].subtitle, alternates: false,
    }),
    robots: { index: false, follow: false, noarchive: true, nosnippet: true, noimageindex: true },
  };
}

export default async function ExperienceLabPage() {
  if (process.env.VERCEL_ENV === "production") notFound();
  const locale = await getLocale();
  return <ExperienceLab catalog={createLabCatalog(locale)} locale={locale} />;
}
