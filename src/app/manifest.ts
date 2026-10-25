import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Flyerwatch",
    short_name: "Flyerwatch",
    description: "Compare this week's grocery flyer prices near you.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f6f3",
    theme_color: "#18233a",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
