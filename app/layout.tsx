import type { Metadata, Viewport } from "next"
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google"
import { Toaster } from "@/components/Toaster"
import "./globals.css"

const sans = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
  weight: ["400", "500", "600", "700", "800"],
})

const display = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
  weight: ["500", "600", "700"],
})

const mono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
  weight: ["400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: "Sniper Trader",
  description: "Central de automação de operações na corretora.",
  // Necessário para o painel funcionar como app instalado no iOS.
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Sniper Admin" },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  themeColor: "#0a0b0d",
  width: "device-width",
  initialScale: 1,
  // Respeita a área segura do notch quando instalado na tela inicial.
  viewportFit: "cover",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${sans.variable} ${display.variable} ${mono.variable}`}>
      <body>
        <div className="app-shell">{children}</div>
        <Toaster />
      </body>
    </html>
  )
}
