import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { VisualIdentityLab } from "@/components/visual-identity-lab/visual-identity-lab";
import { identityDirection } from "@/data/visual-identity-lab";
import { getLocale } from "@/lib/i18n/server";
import { createLocalizedMetadata } from "@/lib/i18n/metadata";

export async function generateMetadata():Promise<Metadata>{
 const locale=await getLocale();
 return {...createLocalizedMetadata({locale,pathname:"/experience-lab/identity",title:"Visual Identity Lab 6.0 | BTSHQ",description:"Three static BTSHQ art direction studies.",alternates:false}),robots:{index:false,follow:false,noarchive:true,nosnippet:true,noimageindex:true}};
}
export default async function IdentityPage(props:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const allowed=process.env.VERCEL_ENV?["preview","development"].includes(process.env.VERCEL_ENV):process.env.NODE_ENV!=="production";
 if(!allowed)notFound();
 const locale=await getLocale();
 const query=await props.searchParams;
 return <VisualIdentityLab locale={locale} direction={identityDirection(query.direction)}/>;
}
