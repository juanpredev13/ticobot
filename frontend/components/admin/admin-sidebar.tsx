"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Database,
  Activity,
  FileText,
  Settings,
  AlertTriangle,
  BarChart3,
  Upload,
  Logs,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Base de Datos",
    href: "/admin/database",
    icon: Database,
  },
  {
    title: "Estado del Sistema",
    href: "/admin/system",
    icon: Activity,
  },
  {
    title: "Ingesta",
    href: "/admin/ingestion",
    icon: Upload,
  },
  {
    title: "Documentos",
    href: "/admin/documents",
    icon: FileText,
  },
  {
    title: "Estadísticas",
    href: "/admin/analytics",
    icon: BarChart3,
  },
  {
    title: "Alertas",
    href: "/admin/alerts",
    icon: AlertTriangle,
    badge: 2,
  },
  {
    title: "Logs",
    href: "/admin/logs",
    icon: Logs,
  },
  {
    title: "Configuración",
    href: "/admin/settings",
    icon: Settings,
  },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-background">
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="border-b p-6">
          <h2 className="text-lg font-semibold">Panel Admin</h2>
          <p className="text-xs text-muted-foreground">TicoBot</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href))

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="size-5" />
                <span className="flex-1">{item.title}</span>
                {item.badge && (
                  <span className="flex size-5 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="border-t p-4">
          <div className="rounded-lg bg-muted p-3">
            <p className="text-xs font-medium">Sistema</p>
            <p className="text-xs text-muted-foreground">Versión 1.0.0</p>
          </div>
        </div>
      </div>
    </aside>
  )
}

