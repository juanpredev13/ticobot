"use client"

import { useState, useEffect } from "react"
import { FileText, Search, Brain, Sparkles, CheckCircle2, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface CompareLoadingProps {
  partiesCount: number
  topic: string
}

const ANALYSIS_STEPS = [
  { id: "search", icon: Search, label: "Buscando" },
  { id: "extract", icon: FileText, label: "Extrayendo" },
  { id: "analyze", icon: Brain, label: "Analizando" },
  { id: "generate", icon: Sparkles, label: "Generando" },
]

export function CompareLoading({ partiesCount, topic }: CompareLoadingProps) {
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    const stepTime = (partiesCount * 8 * 1000) / ANALYSIS_STEPS.length

    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev < ANALYSIS_STEPS.length - 1 ? prev + 1 : prev))
    }, stepTime)

    return () => clearInterval(interval)
  }, [partiesCount])

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <Loader2 className="size-10 text-primary animate-spin mb-6" />

      <h3 className="text-lg font-semibold text-foreground mb-2">
        {ANALYSIS_STEPS[currentStep].label}: {topic}
      </h3>
      <p className="text-sm text-muted-foreground mb-6">
        {partiesCount} {partiesCount === 1 ? "partido" : "partidos"}
      </p>

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
                "flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
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
              <span className="hidden sm:inline">{step.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
