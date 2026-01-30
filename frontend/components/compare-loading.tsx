"use client"

import { useState, useEffect } from "react"
import { FileText, Search, Brain, Sparkles, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface CompareLoadingProps {
  partiesCount: number
  topic: string
}

const ANALYSIS_STEPS = [
  {
    id: "search",
    icon: Search,
    label: "Buscando en documentos",
    description: "Localizando información relevante en los planes de gobierno...",
  },
  {
    id: "extract",
    icon: FileText,
    label: "Extrayendo contenido",
    description: "Identificando propuestas relacionadas con el tema...",
  },
  {
    id: "analyze",
    icon: Brain,
    label: "Analizando propuestas",
    description: "Procesando y comparando la información de cada partido...",
  },
  {
    id: "generate",
    icon: Sparkles,
    label: "Generando comparación",
    description: "Preparando el resumen comparativo...",
  },
]

export function CompareLoading({ partiesCount, topic }: CompareLoadingProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [dots, setDots] = useState("")

  // Animate dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."))
    }, 500)
    return () => clearInterval(interval)
  }, [])

  // Progress through steps
  useEffect(() => {
    // Estimate ~30 seconds per party, distribute across 4 steps
    const totalTime = partiesCount * 30 * 1000 // ms
    const stepTime = totalTime / ANALYSIS_STEPS.length

    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < ANALYSIS_STEPS.length - 1) {
          return prev + 1
        }
        return prev
      })
    }, stepTime)

    // Progress bar updates more frequently
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev < 95) {
          // Slow down as we approach 95%
          const increment = prev < 50 ? 2 : prev < 80 ? 1 : 0.5
          return Math.min(95, prev + increment)
        }
        return prev
      })
    }, 1000)

    return () => {
      clearInterval(stepInterval)
      clearInterval(progressInterval)
    }
  }, [partiesCount])

  const CurrentIcon = ANALYSIS_STEPS[currentStep].icon

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      {/* Main Animation Container */}
      <div className="relative mb-8">
        {/* Animated rings */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="size-32 rounded-full border-2 border-primary/20 animate-ping" style={{ animationDuration: "2s" }} />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="size-24 rounded-full border-2 border-primary/30 animate-ping" style={{ animationDuration: "1.5s", animationDelay: "0.5s" }} />
        </div>

        {/* Center icon */}
        <div className="relative z-10 flex size-20 items-center justify-center rounded-full bg-primary/10 border-2 border-primary">
          <CurrentIcon className="size-8 text-primary animate-pulse" />
        </div>

        {/* Floating document icons */}
        {Array.from({ length: partiesCount }).map((_, i) => (
          <div
            key={i}
            className="absolute size-8 rounded-lg bg-background border border-border shadow-sm flex items-center justify-center animate-bounce"
            style={{
              top: `${20 + Math.sin((i * 2 * Math.PI) / partiesCount) * 50}%`,
              left: `${50 + Math.cos((i * 2 * Math.PI) / partiesCount) * 60}%`,
              transform: "translate(-50%, -50%)",
              animationDelay: `${i * 0.2}s`,
              animationDuration: "1.5s",
            }}
          >
            <FileText className="size-4 text-muted-foreground" />
          </div>
        ))}
      </div>

      {/* Topic being analyzed */}
      <div className="mb-6 text-center">
        <h3 className="text-lg font-semibold text-foreground">
          Analizando: {topic}
        </h3>
        <p className="text-sm text-muted-foreground">
          {partiesCount} {partiesCount === 1 ? "partido" : "partidos"} seleccionados
        </p>
      </div>

      {/* Current step */}
      <div className="mb-6 text-center max-w-md">
        <p className="text-base font-medium text-foreground">
          {ANALYSIS_STEPS[currentStep].label}{dots}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {ANALYSIS_STEPS[currentStep].description}
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-md mb-6">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-1000 ease-out rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">
          {Math.round(progress)}% completado
        </p>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-2">
        {ANALYSIS_STEPS.map((step, index) => {
          const StepIcon = step.icon
          const isCompleted = index < currentStep
          const isCurrent = index === currentStep

          return (
            <div
              key={step.id}
              className={cn(
                "flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300",
                isCompleted && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                isCurrent && "bg-primary/10 text-primary border border-primary/30",
                !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
              )}
            >
              {isCompleted ? (
                <CheckCircle2 className="size-3.5" />
              ) : (
                <StepIcon className={cn("size-3.5", isCurrent && "animate-pulse")} />
              )}
              <span className="hidden sm:inline">{step.label.split(" ")[0]}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
