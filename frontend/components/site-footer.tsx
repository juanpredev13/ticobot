"use client"

import Link from "next/link"

export function SiteFooter() {
  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
          <p>© 2026 TicoBot. Todos los derechos reservados.</p>
          <p className="flex items-center gap-2">
            Hecho por{" "}
            <Link
              href="https://juanpre.dev/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground hover:text-primary transition-colors"
            >
              juanpre.dev
            </Link>
          </p>
        </div>
      </div>
    </footer>
  )
}