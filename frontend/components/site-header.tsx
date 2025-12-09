"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"

export function SiteHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()

  const navItems = [
    { href: "/", label: "Inicio" },
    { href: "/compare", label: "Comparar" },
    { href: "/quiz", label: "Quiz Político" },
    { href: "/chat?focus=true", label: "Preguntas" },
    { href: "/documents", label: "Documentos" },
    { href: "/blog", label: "Blog" },
  ]

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href)
  }

  return (
    <>
      <header className="sticky top-0 z-40 px-4 pt-4 md:px-6 md:pt-5">
        <div className="container mx-auto">
          <div
            className="flex items-center justify-between rounded-full px-4 py-2.5 md:px-6 md:py-3 shadow-xl"
            style={{
              background: "rgba(255, 255, 255, 0.15)",
              WebkitBackdropFilter: "blur(24px) saturate(180%)",
              backdropFilter: "blur(24px) saturate(180%)",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.4)",
            }}
          >
            <Link href="/" className="flex items-center gap-2">
              <div
                className="flex size-9 items-center justify-center rounded-lg"
                style={{
                  background: "rgba(20, 184, 166, 0.9)",
                  boxShadow: "0 4px 12px rgba(20, 184, 166, 0.3)",
                }}
              >
                <span className="text-base font-bold text-white">TB</span>
              </div>
              <span className="text-lg font-semibold text-slate-800">TicoBot</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden items-center gap-6 lg:gap-8 md:flex">
              {navItems.slice(1).map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm font-medium transition-all duration-200 ${
                    isActive(item.href) ? "text-primary" : "text-slate-700 hover:text-slate-900"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Desktop CTA Button with glass effect */}
            <Link
              href="/chat?focus=true"
              className="hidden md:inline-flex px-5 py-2 text-sm font-medium rounded-full transition-all duration-200 hover:scale-105"
              style={{
                background: "rgba(20, 184, 166, 0.9)",
                color: "white",
                boxShadow: "0 4px 16px rgba(20, 184, 166, 0.3)",
              }}
            >
              Hacer pregunta
            </Link>

            {/* Mobile hamburger */}
            <button
              className="flex md:hidden flex-col gap-1.5 p-2 rounded-lg transition-colors z-50"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
              style={{
                background: isMenuOpen ? "rgba(0, 0, 0, 0.05)" : "transparent",
              }}
            >
              <span
                className={`block h-0.5 w-6 bg-slate-700 transition-all duration-300 ${isMenuOpen ? "rotate-45 translate-y-2" : ""}`}
              />
              <span
                className={`block h-0.5 w-6 bg-slate-700 transition-all duration-300 ${isMenuOpen ? "opacity-0" : ""}`}
              />
              <span
                className={`block h-0.5 w-6 bg-slate-700 transition-all duration-300 ${isMenuOpen ? "-rotate-45 -translate-y-2" : ""}`}
              />
            </button>
          </div>
        </div>
      </header>

      <div
        className={`md:hidden fixed inset-0 z-30 transition-all duration-300 ${
          isMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      >
        <div
          className="absolute inset-0"
          style={{
            background: "rgba(255, 255, 255, 0.7)",
            WebkitBackdropFilter: "blur(32px) saturate(180%)",
            backdropFilter: "blur(32px) saturate(180%)",
          }}
        />

        {/* Menu content */}
        <nav className="relative h-full pt-24 px-6 pb-28 flex flex-col">
          <div className="flex flex-col gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-5 rounded-2xl text-xl font-medium transition-all duration-200`}
                style={{
                  background: isActive(item.href) ? "rgba(20, 184, 166, 0.15)" : "transparent",
                  color: isActive(item.href) ? "rgb(20, 184, 166)" : "rgb(51, 65, 85)",
                }}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="mt-auto pt-8 flex flex-col gap-4 mb-4" style={{ borderTop: "1px solid rgba(0, 0, 0, 0.1)" }}>
            <Link
              href="/compare"
              className="w-full py-5 px-4 rounded-2xl text-center text-lg font-medium transition-all duration-200"
              style={{
                background: "rgba(20, 184, 166, 0.9)",
                color: "white",
                boxShadow: "0 4px 16px rgba(20, 184, 166, 0.3)",
              }}
              onClick={() => setIsMenuOpen(false)}
            >
              Comparar partidos
            </Link>
            <Link
              href="/chat?focus=true"
              className="w-full py-5 px-4 rounded-2xl text-center text-lg font-medium transition-all duration-200"
              style={{
                background: "rgba(20, 184, 166, 0.15)",
                color: "rgb(20, 184, 166)",
                border: "1px solid rgba(20, 184, 166, 0.3)",
              }}
              onClick={() => setIsMenuOpen(false)}
            >
              Hacer una pregunta
            </Link>
          </div>
        </nav>
      </div>
    </>
  )
}

export default SiteHeader
