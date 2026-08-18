import type { MetadataRoute } from "next"

/** Manifesto do PWA. O painel admin é instalável na tela inicial. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sniper Trader — Painel",
    short_name: "Sniper Admin",
    description: "Painel administrativo: permissionamento, métricas e alertas.",
    start_url: "/admin",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#020401",
    theme_color: "#020401",
    icons: [
      { src: "/logo.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon.png", sizes: "256x256", type: "image/png", purpose: "any" },
    ],
  }
}
