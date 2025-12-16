"use client"

import { usePathname } from "next/navigation"
import { SiteHeader } from "@/components/site-header"
import { BottomMobileNav } from "@/components/bottom-mobile-nav"

export function AdminLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdminRoute = pathname?.startsWith("/admin")

  if (isAdminRoute) {
    return <>{children}</>
  }

  return (
    <>
      <SiteHeader />
      <div className="pb-16 md:pb-0">{children}</div>
      <BottomMobileNav />
    </>
  )
}

