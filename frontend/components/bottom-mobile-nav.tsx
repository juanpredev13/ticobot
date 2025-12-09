"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const CompareIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
    />
  </svg>
)

const ChatIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
    />
  </svg>
)

const DocumentIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    />
  </svg>
)

export function BottomMobileNav() {
  const pathname = usePathname()

  const navItems = [
    { href: "/documents", label: "Docs", icon: DocumentIcon },
    { href: "/chat", label: "Chat", icon: ChatIcon, isCenter: true },
    { href: "/compare", label: "Comparar", icon: CompareIcon },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden px-4 pb-4">
      <nav
        className="rounded-full border border-white/20 shadow-lg"
        style={{
          background: "rgba(255, 255, 255, 0.15)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.4)",
        }}
      >
        <div className="flex items-center justify-around h-16 px-6">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            if (item.isCenter) {
              return (
                <Link key={item.href} href={item.href} className="flex flex-col items-center justify-center -mt-10">
                  <div
                    className="flex items-center justify-center w-14 h-14 rounded-full shadow-lg mb-1 transition-all duration-300 hover:scale-110"
                    style={{
                      backgroundColor: isActive ? "#14b8a6" : "#0f766e",
                      boxShadow: "0 4px 20px rgba(20, 184, 166, 0.4)",
                    }}
                  >
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-xs font-medium" style={{ color: "#14b8a6" }}>
                    {item.label}
                  </span>
                </Link>
              )
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center gap-1 transition-all duration-300 hover:scale-110"
                style={{
                  color: isActive ? "#14b8a6" : "#64748b",
                }}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
