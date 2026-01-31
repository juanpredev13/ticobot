import type React from "react"
import type { Metadata } from "next"
import { Unbounded, Geist } from "next/font/google"
import "./globals.css"
import { ClientProviders } from "@/components/providers/client-providers"
import { AdminLayoutWrapper } from "@/components/admin/admin-layout-wrapper"

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
  keywords: ["Costa Rica", "elecciones", "política", "propuestas", "comparación", "neutral", "transparente"],
  authors: [{ name: "TicoBot" }],
  creator: "TicoBot",
  publisher: "TicoBot",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://ticobot.com"),
  alternates: {
    canonical: "/",
    languages: {
      "es-CR": "/es",
      "en": "/en",
    },
  },
  openGraph: {
    title: "TicoBot - Comparación neutral de propuestas políticas",
    description: "Plataforma de información electoral para Costa Rica. Compara propuestas políticas de forma neutral y transparente.",
    url: "https://ticobot.com",
    siteName: "TicoBot",
    images: [
      {
        url: "/og-image-1200x630.svg",
        width: 1200,
        height: 630,
        alt: "TicoBot - Comparación neutral de propuestas políticas",
      },
      {
        url: "/og-image-square.svg",
        width: 1200,
        height: 1200,
        alt: "TicoBot Logo",
      },
    ],
    locale: "es_CR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TicoBot - Comparación neutral de propuestas políticas",
    description: "Plataforma de información electoral para Costa Rica. Compara propuestas políticas de forma neutral y transparente.",
    images: ["/og-image-1200x630.svg"],
    creator: "@ticobot",
    site: "@ticobot",
  },
  verification: {
    google: "your-google-verification-code",
    yandex: "your-yandex-verification-code",
  },
  icons: {
    icon: [
      {
        url: "/favicon.svg",
        type: "image/svg+xml",
      },
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
        sizes: "32x32",
        type: "image/png",
      },
    ],
    apple: "/apple-icon.png",
  },
  manifest: "/site.webmanifest",
  other: {
    "theme-color": "#6B7280",
    "msapplication-TileColor": "#da532c",
    "msapplication-config": "/browserconfig.xml",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/icon-light-32x32.png" media="(prefers-color-scheme: light)" />
        <link rel="icon" href="/icon-dark-32x32.png" media="(prefers-color-scheme: dark)" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
        <script defer src="https://cloud.umami.is/script.js" data-website-id="d5bd28f4-c23a-49d4-9fb2-46c99a90f463"></script>
      </head>
      <body className={`${unbounded.variable} ${geist.variable} font-sans antialiased`}>
        <ClientProviders>
          <AdminLayoutWrapper>{children}</AdminLayoutWrapper>
        </ClientProviders>
      </body>
    </html>
  )
}
