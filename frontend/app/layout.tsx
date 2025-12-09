import type React from "react"
import type { Metadata } from "next"
import { Unbounded, Geist } from "next/font/google"
import "./globals.css"
import { SiteHeader } from "@/components/site-header"
import { BottomMobileNav } from "@/components/bottom-mobile-nav"

const unbounded = Unbounded({
  subsets: ["latin"],
  variable: "--font-unbounded",
  display: "swap",
})

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
})

export const metadata: Metadata = {
  title: "TicoBot - Comparación neutral de propuestas políticas",
  description:
    "Plataforma de información electoral para Costa Rica. Compara propuestas políticas de forma neutral y transparente.",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className={`${unbounded.variable} ${geist.variable} font-sans antialiased`}>
        <SiteHeader />
        <div className="pb-16 md:pb-0">{children}</div>
        <BottomMobileNav />
      </body>
    </html>
  )
}
