import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { verifyAdminAuthorization } from "@/lib/admin/authorization";

export const metadata = { title: "Admin Login | bts.online", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const authorization = await verifyAdminAuthorization(false);
  if (authorization) redirect(authorization.aal === "aal2" ? "/admin/echowall" : "/admin/mfa");
  return <main className="flex min-h-svh items-center px-5 py-20"><section className="mx-auto w-full max-w-lg border border-white/15 bg-white/[0.025] p-7 sm:p-10"><p className="font-mono text-xs uppercase tracking-[0.22em] text-[#35d0e5]">Restricted area</p><h1 className="mt-5 text-4xl font-black text-white">EchoWall moderation</h1><p className="mt-4 leading-7 text-slate-400">Anmeldung ausschließlich für freigeschaltete Administratoren.</p><AdminLoginForm /></section></main>;
}
