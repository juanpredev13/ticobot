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
  other: [
    {
      name: "theme-color",
      content: "#6B7280",
    },
    {
      name: "msapplication-TileColor",
      content: "#da532c",
    },
    {
      name: "msapplication-config",
      content: "/browserconfig.xml",
    },
  ],
  openGraph: {
    title: "TicoBot - Comparación neutral de propuestas políticas",
    description: "Plataforma de información electoral para Costa Rica. Compara propuestas políticas de forma neutral y transparente.",
    url: "https://ticobot.com",
    siteName: "TicoBot",
    images: [
      {
        url: "/og-image-1200x630.png",
        width: 1200,
        height: 630,
        alt: "TicoBot - Comparación neutral de propuestas políticas",
      },
      {
        url: "/og-image-square.png",
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
    images: ["/og-image-1200x630.png"],
    creator: "@ticobot",
    site: "@ticobot",
  },
  app: {
    name: "TicoBot",
    url: "https://ticobot.com",
  },
  verification: {
    google: "your-google-verification-code",
    yandex: "your-yandex-verification-code",
  },
  icons: {
    icon: [
      {
        url: "/favicon.ico",
        sizes: "any",
      },
      {
        url: "/icon-16x16.png",
        sizes: "16x16",
        type: "image/png",
      },
      {
        url: "/icon-32x32.png",
        sizes: "32x32",
        type: "image/png",
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
      {
        url: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: [
      {
        url: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
      {
        url: "/apple-icon-57x57.png",
        sizes: "57x57",
        type: "image/png",
      },
      {
        url: "/apple-icon-72x72.png",
        sizes: "72x72",
        type: "image/png",
      },
      {
        url: "/apple-icon-76x76.png",
        sizes: "76x76",
        type: "image/png",
      },
      {
        url: "/apple-icon-114x114.png",
        sizes: "114x114",
        type: "image/png",
      },
      {
        url: "/apple-icon-120x120.png",
        sizes: "120x120",
        type: "image/png",
      },
      {
        url: "/apple-icon-144x144.png",
        sizes: "144x144",
        type: "image/png",
      },
      {
        url: "/apple-icon-152x152.png",
        sizes: "152x152",
        type: "image/png",
      },
      {
        url: "/apple-icon-180x180.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    other: [
      {
        rel: "mask-icon",
        url: "/safari-pinned-tab.svg",
        color: "#5bbad5",
      },
      {
        rel: "manifest",
        url: "/site.webmanifest",
      },
    ],
  },
  manifest: "/site.webmanifest",
  other: [
    {
      name: "theme-color",
      content: "#6B7280",
    },
    {
      name: "msapplication-TileColor",
      content: "#da532c",
    },
    {
      name: "msapplication-config",
      content: "/browserconfig.xml",
    },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
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
