"use client"

import type { UsageStatus } from "@/lib/usage-tracker"
import { AlertCircle, CheckCircle, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"

type UsageBannerProps = {
  status: UsageStatus
  onUpgrade: () => void
}

export function UsageBanner({ status, onUpgrade }: UsageBannerProps) {
  if (status.limitReached) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
          <div className="flex-1">
            <h3 className="font-semibold text-destructive">Límite de conversaciones alcanzado</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Has usado todas tus {status.totalAllowed} conversaciones gratuitas.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (status.needsAuth) {
    return (
      <div className="rounded-lg border border-primary/50 bg-primary/10 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Zap className="mt-0.5 size-5 shrink-0 text-primary" />
            <div>
              <h3 className="font-semibold">Has usado tus 3 conversaciones gratuitas</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Crea una cuenta para obtener 10 conversaciones adicionales totalmente gratis
              </p>
            </div>
          </div>
          <Button onClick={onUpgrade} size="sm" className="shrink-0">
            Crear cuenta
          </Button>
        </div>
      </div>
    )
  }

  const isLowOnChats = status.chatsRemaining <= 2

  return (
    <div
      className={`rounded-lg border p-3 ${
        isLowOnChats ? "border-yellow-500/50 bg-yellow-500/10" : "border-border bg-muted/30"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle className="size-4 shrink-0 text-primary" />
          <span className="text-muted-foreground">
            {status.tier === "anonymous" ? (
              <>
                <span className="font-semibold text-foreground">{status.chatsRemaining}</span> de {status.totalAllowed}{" "}
                conversaciones gratuitas restantes
              </>
            ) : (
              <>
                <span className="font-semibold text-foreground">{status.chatsRemaining}</span> conversaciones restantes
              </>
            )}
          </span>
        </div>
        {status.tier === "anonymous" && status.chatsRemaining > 0 && (
          <Button onClick={onUpgrade} variant="outline" size="sm">
            Obtener más
          </Button>
        )}
      </div>
    </div>
  )
}
