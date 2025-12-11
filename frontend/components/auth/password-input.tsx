"use client"

import { useState, forwardRef } from "react"
import { Eye, EyeOff } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface PasswordInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  showStrengthIndicator?: boolean
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, showStrengthIndicator = false, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false)
    const [strength, setStrength] = useState(0)

    const calculateStrength = (password: string): number => {
      if (!password) return 0

      let score = 0

      // Length criteria
      if (password.length >= 8) score++
      if (password.length >= 12) score++

      // Character variety
      if (/[a-z]/.test(password)) score++ // lowercase
      if (/[A-Z]/.test(password)) score++ // uppercase
      if (/[0-9]/.test(password)) score++ // numbers
      if (/[^a-zA-Z0-9]/.test(password)) score++ // special chars

      // Return normalized score (0-4)
      return Math.min(score, 4)
    }

    const getStrengthLabel = (strength: number): string => {
      switch (strength) {
        case 0:
          return ""
        case 1:
          return "Muy débil"
        case 2:
          return "Débil"
        case 3:
          return "Buena"
        case 4:
          return "Fuerte"
        default:
          return ""
      }
    }

    const getStrengthColor = (strength: number): string => {
      switch (strength) {
        case 1:
          return "bg-red-500"
        case 2:
          return "bg-orange-500"
        case 3:
          return "bg-yellow-500"
        case 4:
          return "bg-green-500"
        default:
          return "bg-gray-200"
      }
    }

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      if (showStrengthIndicator) {
        setStrength(calculateStrength(value))
      }
      props.onChange?.(e)
    }

    return (
      <div className="space-y-2">
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            className={cn("pr-10", className)}
            ref={ref}
            {...props}
            onChange={handlePasswordChange}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="sr-only">
              {showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            </span>
          </Button>
        </div>

        {/* Password Strength Indicator */}
        {showStrengthIndicator && props.value && (
          <div className="space-y-1">
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-colors",
                    level <= strength
                      ? getStrengthColor(strength)
                      : "bg-gray-200 dark:bg-gray-700"
                  )}
                />
              ))}
            </div>
            {strength > 0 && (
              <p className="text-xs text-muted-foreground">
                Contraseña: {getStrengthLabel(strength)}
              </p>
            )}
          </div>
        )}
      </div>
    )
  }
)

PasswordInput.displayName = "PasswordInput"
