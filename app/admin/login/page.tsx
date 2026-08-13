import { redirect } from "next/navigation";

export const metadata = { title: "BTS Account | bts.online", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function AdminLoginPage() {
  redirect("/account/login");
}
