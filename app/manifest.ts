import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "bts.online Digital HQ",
    short_name: "BTS",
    description: "The Digital HQ of Benjamin Trinidad Segura.",
    start_url: "/",
    display: "standalone",
    background_color: "#04111b",
    theme_color: "#04111b",
    icons: [
      {
        src: "/icons/bts-app-icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/bts-app-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
