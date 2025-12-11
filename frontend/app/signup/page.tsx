"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AuthLayout } from "@/components/auth/auth-layout"
import { PasswordInput } from "@/components/auth/password-input"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useRegister, useUser } from "@/lib/hooks/use-auth"
import { Spinner } from "@/components/ui/spinner"

export default function SignupPage() {
  const router = useRouter()
  const { data: user, isLoading: isLoadingUser } = useUser(false)
  const registerMutation = useRegister()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [passwordConfirm, setPasswordConfirm] = useState("")
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [errors, setErrors] = useState<{
    email?: string
    password?: string
    passwordConfirm?: string
    terms?: string
  }>({})

  // Redirect if already logged in
  useEffect(() => {
    if (user && !isLoadingUser) {
      router.push("/")
    }
  }, [user, isLoadingUser, router])

  const validateForm = (): boolean => {
    const newErrors: {
      email?: string
      password?: string
      passwordConfirm?: string
      terms?: string
    } = {}

    // Email validation
    if (!email) {
      newErrors.email = "El correo es requerido"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Correo inválido"
    }

    // Password validation
    if (!password) {
      newErrors.password = "La contraseña es requerida"
    } else if (password.length < 8) {
      newErrors.password = "La contraseña debe tener al menos 8 caracteres"
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/.test(password)) {
      newErrors.password =
        "La contraseña debe contener mayúsculas, minúsculas y números"
    }

    // Password confirmation
    if (!passwordConfirm) {
      newErrors.passwordConfirm = "Confirma tu contraseña"
    } else if (password !== passwordConfirm) {
      newErrors.passwordConfirm = "Las contraseñas no coinciden"
    }

    // Terms acceptance
    if (!acceptTerms) {
      newErrors.terms = "Debes aceptar los términos y condiciones"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      await registerMutation.mutateAsync({ email, password })
      // Success handled by mutation's onSuccess
      router.push("/")
    } catch (error) {
      // Error handled by mutation's onError (toast)
      console.error("Signup error:", error)
    }
  }

  const isLoading = registerMutation.isPending || isLoadingUser

  return (
    <AuthLayout
      title="Crear Cuenta"
      description="Crea tu cuenta para acceder a análisis detallados de planes de gobierno"
      footer={
        <p>
          ¿Ya tienes una cuenta?{" "}
          <Link
            href="/login"
            className="font-medium text-primary hover:underline"
          >
            Iniciar sesión
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Field */}
        <div className="space-y-2">
          <Label htmlFor="email">Correo electrónico</Label>
          <Input
            id="email"
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (errors.email) setErrors({ ...errors, email: undefined })
            }}
            disabled={isLoading}
            className={errors.email ? "border-red-500" : ""}
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email}</p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <PasswordInput
            id="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              if (errors.password) setErrors({ ...errors, password: undefined })
            }}
            disabled={isLoading}
            showStrengthIndicator
            className={errors.password ? "border-red-500" : ""}
          />
          {errors.password && (
            <p className="text-sm text-red-500">{errors.password}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Mínimo 8 caracteres con mayúsculas, minúsculas y números
          </p>
        </div>

        {/* Confirm Password Field */}
        <div className="space-y-2">
          <Label htmlFor="passwordConfirm">Confirmar Contraseña</Label>
          <PasswordInput
            id="passwordConfirm"
            placeholder="••••••••"
            value={passwordConfirm}
            onChange={(e) => {
              setPasswordConfirm(e.target.value)
              if (errors.passwordConfirm)
                setErrors({ ...errors, passwordConfirm: undefined })
            }}
            disabled={isLoading}
            className={errors.passwordConfirm ? "border-red-500" : ""}
          />
          {errors.passwordConfirm && (
            <p className="text-sm text-red-500">{errors.passwordConfirm}</p>
          )}
        </div>

        {/* Terms Acceptance */}
        <div className="space-y-2">
          <div className="flex items-start space-x-2">
            <Checkbox
              id="terms"
              checked={acceptTerms}
              onCheckedChange={(checked) => {
                setAcceptTerms(checked as boolean)
                if (errors.terms) setErrors({ ...errors, terms: undefined })
              }}
              disabled={isLoading}
              className={errors.terms ? "border-red-500" : ""}
            />
            <Label
              htmlFor="terms"
              className="text-sm font-normal leading-tight cursor-pointer"
            >
              Acepto los{" "}
              <Link
                href="/terms"
                className="text-primary hover:underline"
                target="_blank"
              >
                Términos de Servicio
              </Link>{" "}
              y{" "}
              <Link
                href="/privacy"
                className="text-primary hover:underline"
                target="_blank"
              >
                Política de Privacidad
              </Link>
            </Label>
          </div>
          {errors.terms && (
            <p className="text-sm text-red-500 pl-6">{errors.terms}</p>
          )}
        </div>

        {/* Submit Button */}
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Spinner className="mr-2" />
              Creando cuenta...
            </>
          ) : (
            "Crear Cuenta"
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground mt-6">
          Al crear una cuenta, aceptas recibir actualizaciones sobre planes de
          gobierno y elecciones en Costa Rica
        </p>
      </form>
    </AuthLayout>
  )
}
