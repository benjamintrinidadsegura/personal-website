import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectDetail } from "@/components/projects/project-detail";
import { getLocalizedProject } from "@/data/i18n/projects";
import { projects } from "@/data/projects";
import { createLocalizedMetadata } from "@/lib/i18n/metadata";
import { getLocale } from "@/lib/i18n/server";

interface ProjectPageProps { params: Promise<{ slug: string }> }

export function generateStaticParams() { return projects.map(({ slug }) => ({ slug })); }

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const locale = await getLocale();
  const project = getLocalizedProject((await params).slug, locale);
  return project ? createLocalizedMetadata({
    locale,
    pathname: `/projects/${project.slug}`,
    title: `${project.name} | Benjamin Trinidad Segura`,
    description: project.description,
  }) : {};
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const locale = await getLocale();
  const project = getLocalizedProject((await params).slug, locale);
  if (!project) notFound();
  return <ProjectDetail project={project} locale={locale} />;
}
