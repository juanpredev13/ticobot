"use client"

import { usePathname } from "next/navigation"
import { SiteHeader } from "@/components/site-header"
import { BottomMobileNav } from "@/components/bottom-mobile-nav"
import { SiteFooter } from "@/components/site-footer"

export function AdminLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdminRoute = pathname?.startsWith("/admin")

  if (isAdminRoute) {
    return <>{children}</>
  }

  return (
    <>
      <SiteHeader />
      <div className="min-h-screen flex flex-col">
        <main className="flex-1 pb-16 md:pb-0">{children}</main>
        <SiteFooter />
      </div>
      <BottomMobileNav />
    </>
  )
}

