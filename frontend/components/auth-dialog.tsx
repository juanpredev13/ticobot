"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Loader2, Mail, Lock, User, CheckCircle } from "lucide-react"

type AuthMode = "signup" | "signin"

type AuthDialogProps = {
  mode: AuthMode
  onSuccess: () => void
  onModeChange: (mode: AuthMode) => void
}

export function AuthDialog({ mode, onSuccess, onModeChange }: AuthDialogProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    // Simulate authentication
    setTimeout(() => {
      if (mode === "signup") {
        // Store mock user data
        localStorage.setItem("ticobot_user", JSON.stringify({ email, name }))
        localStorage.setItem("ticobot_auth", "true")
      } else {
        // Validate credentials (mock)
        const stored = localStorage.getItem("ticobot_user")
        if (stored) {
          localStorage.setItem("ticobot_auth", "true")
        } else {
          setError("No se encontró una cuenta con este correo")
          setIsLoading(false)
          return
        }
      }
      setIsLoading(false)
      onSuccess()
    }, 1000)
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{mode === "signup" ? "Crear cuenta" : "Iniciar sesión"}</CardTitle>
        <CardDescription>
          {mode === "signup"
            ? "Crea una cuenta para obtener 10 conversaciones adicionales"
            : "Inicia sesión para continuar usando TicoBot"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="name">Nombre completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Juan Pérez"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                required
                minLength={6}
              />
            </div>
          </div>

          {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

          {mode === "signup" && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
              <div className="flex items-start gap-2 text-sm">
                <CheckCircle className="mt-0.5 size-4 shrink-0 text-primary" />
                <div>
                  <p className="font-medium text-foreground">Obtendrás 10 conversaciones adicionales</p>
                  <p className="text-muted-foreground">Total: 13 conversaciones gratuitas</p>
                </div>
              </div>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
            {mode === "signup" ? "Crear cuenta" : "Iniciar sesión"}
          </Button>

          <div className="text-center text-sm">
            {mode === "signup" ? (
              <span className="text-muted-foreground">
                ¿Ya tienes cuenta?{" "}
                <button type="button" onClick={() => onModeChange("signin")} className="text-primary hover:underline">
                  Inicia sesión
                </button>
              </span>
            ) : (
              <span className="text-muted-foreground">
                ¿No tienes cuenta?{" "}
                <button type="button" onClick={() => onModeChange("signup")} className="text-primary hover:underline">
                  Regístrate
                </button>
              </span>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
