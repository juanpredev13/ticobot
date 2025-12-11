import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  description?: string
  footer?: React.ReactNode
}

export function AuthLayout({ children, title, description, footer }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      {/* Logo/Brand */}
      <Link href="/" className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Tico<span className="text-primary">Bot</span>
        </h1>
      </Link>

      {/* Auth Card */}
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">
            {title}
          </CardTitle>
          {description && (
            <CardDescription className="text-base">
              {description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>

      {/* Footer */}
      {footer && (
        <div className="mt-6 text-center text-sm text-muted-foreground">
          {footer}
        </div>
      )}

      {/* Bottom Links */}
      <div className="mt-8 flex gap-4 text-xs text-muted-foreground">
        <Link href="/privacy" className="hover:text-foreground transition-colors">
          Privacidad
        </Link>
        <span>•</span>
        <Link href="/terms" className="hover:text-foreground transition-colors">
          Términos
        </Link>
        <span>•</span>
        <Link href="/help" className="hover:text-foreground transition-colors">
          Ayuda
        </Link>
      </div>
    </div>
  )
}
