import { permanentRedirect } from "next/navigation";

export default function LegacyCareerSpotlightPage() {
  permanentRedirect("/people");
}
