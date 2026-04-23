import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Moneyy MVP",
    short_name: "Moneyy",
    description: "Учет личных расходов",
    start_url: "/",
    display: "standalone",
    background_color: "#06070a",
    theme_color: "#0a0b0f",
    lang: "ru",
    icons: [
      {
        src: "/icons/icon-192.svg",
        sizes: "192x192",
        type: "image/svg+xml"
      },
      {
        src: "/icons/icon-512.svg",
        sizes: "512x512",
        type: "image/svg+xml"
      }
    ]
  };
}
