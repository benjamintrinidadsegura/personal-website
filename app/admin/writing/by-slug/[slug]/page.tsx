import { notFound, redirect } from "next/navigation";

import { requireAdminPage } from "@/lib/admin/authorization";
import { getPublishedWritingBySlug } from "@/lib/writing/queries";

export const metadata = { title: "Edit Writing | BTS Studio", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function EditWritingBySlugPage({ params }: { params: Promise<{ slug: string }> }) {
  await requireAdminPage(true);

  const slug = (await params).slug;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(slug) || slug.length > 96) notFound();

  const article = await getPublishedWritingBySlug(slug);
  if (!article) notFound();
  redirect(`/admin/writing/${article.id}`);
}
