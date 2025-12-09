"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Info } from "lucide-react"
import Link from "next/link"

type Answer = {
  text: string
  economicImpact: number
  socialImpact: number
  candidateIds: string[]
}

type Question = {
  id: number
  text: string
  answers: Answer[]
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    text: "¿Apoya que la iglesia tenga un papel activo en el gobierno?",
    answers: [
      { text: "Totalmente a favor", economicImpact: 0, socialImpact: -5, candidateIds: ["1", "2"] },
      { text: "Algo a favor", economicImpact: 0, socialImpact: -3, candidateIds: ["3"] },
      { text: "Neutral", economicImpact: 0, socialImpact: 0, candidateIds: ["4", "5"] },
      { text: "Algo en contra", economicImpact: 0, socialImpact: 3, candidateIds: ["6", "7"] },
      { text: "Totalmente en contra", economicImpact: 0, socialImpact: 5, candidateIds: ["8", "9", "10"] },
    ],
  },
  {
    id: 2,
    text: "¿El Estado debe controlar sectores estratégicos de la economía?",
    answers: [
      { text: "Totalmente a favor", economicImpact: -5, socialImpact: 0, candidateIds: ["8", "9"] },
      { text: "Algo a favor", economicImpact: -3, socialImpact: 0, candidateIds: ["10", "11"] },
      { text: "Neutral", economicImpact: 0, socialImpact: 0, candidateIds: ["4", "5"] },
      { text: "Algo en contra", economicImpact: 3, socialImpact: 0, candidateIds: ["3", "6"] },
      { text: "Totalmente en contra", economicImpact: 5, socialImpact: 0, candidateIds: ["1", "2"] },
    ],
  },
  {
    id: 3,
    text: "¿Está de acuerdo con el matrimonio entre personas del mismo sexo?",
    answers: [
      { text: "Totalmente a favor", economicImpact: 0, socialImpact: 5, candidateIds: ["8", "9", "10"] },
      { text: "Algo a favor", economicImpact: 0, socialImpact: 3, candidateIds: ["6", "7"] },
      { text: "Neutral", economicImpact: 0, socialImpact: 0, candidateIds: ["4", "5"] },
      { text: "Algo en contra", economicImpact: 0, socialImpact: -3, candidateIds: ["3"] },
      { text: "Totalmente en contra", economicImpact: 0, socialImpact: -5, candidateIds: ["1", "2"] },
    ],
  },
]

const CANDIDATES = [
  { id: "1", name: "JM", color: "#ef4444", x: 30, y: -35 },
  { id: "2", name: "FA", color: "#f59e0b", x: 25, y: -30 },
  { id: "3", name: "LS", color: "#10b981", x: 15, y: -15 },
  { id: "4", name: "CA", color: "#3b82f6", x: 0, y: 0 },
  { id: "5", name: "JC", color: "#8b5cf6", x: -5, y: 5 },
  { id: "6", name: "RC", color: "#ec4899", x: -15, y: 20 },
  { id: "7", name: "MV", color: "#14b8a6", x: -20, y: 25 },
  { id: "8", name: "EA", color: "#f97316", x: -30, y: 30 },
  { id: "9", name: "PM", color: "#06b6d4", x: -25, y: 35 },
  { id: "10", name: "GR", color: "#84cc16", x: -35, y: 28 },
]

export default function QuizPage() {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [userPosition, setUserPosition] = useState({ x: 0, y: 0 })
  const [showResults, setShowResults] = useState(false)

  const progress = ((currentQuestion + 1) / QUESTIONS.length) * 100

  const handleAnswer = (answer: Answer) => {
    const newAnswers = [...answers, answer]
    setAnswers(newAnswers)

    // Calculate new user position
    const totalEconomic = newAnswers.reduce((sum, a) => sum + a.economicImpact, 0)
    const totalSocial = newAnswers.reduce((sum, a) => sum + a.socialImpact, 0)

    setUserPosition({
      x: totalEconomic * 2,
      y: totalSocial * 2,
    })

    if (currentQuestion < QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      setShowResults(true)
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
      const newAnswers = answers.slice(0, -1)
      setAnswers(newAnswers)

      // Recalculate position
      const totalEconomic = newAnswers.reduce((sum, a) => sum + a.economicImpact, 0)
      const totalSocial = newAnswers.reduce((sum, a) => sum + a.socialImpact, 0)

      setUserPosition({
        x: totalEconomic * 2,
        y: totalSocial * 2,
      })
    }
  }

  const handleReset = () => {
    setCurrentQuestion(0)
    setAnswers([])
    setUserPosition({ x: 0, y: 0 })
    setShowResults(false)
  }

  const question = QUESTIONS[currentQuestion]

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Posición Política</h1>
              <p className="text-muted-foreground flex items-center gap-2">
                Descubre dónde te posicionas comparado con los candidatos principales.
                <Info className="size-4" />
              </p>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="rounded" defaultChecked />
              <span>Mostrar candidatos en el gráfico</span>
            </label>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[500px_1fr]">
          {/* Political Compass */}
          <Card className="p-6">
            <div className="relative aspect-square bg-gradient-to-br from-red-50 via-blue-50 to-yellow-50 rounded-lg border-2 border-border">
              {/* Quadrant labels */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 text-xs font-medium text-slate-700">
                Socialmente Conservador
              </div>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs font-medium text-slate-700">
                Socialmente Progresivo
              </div>
              <div className="absolute left-2 top-1/2 -translate-y-1/2 -rotate-90 text-xs font-medium text-slate-700">
                Económicamente Izquierda
              </div>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 rotate-90 text-xs font-medium text-slate-700">
                Económicamente Derecha
              </div>

              {/* Axes */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-px bg-slate-300" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-px h-full bg-slate-300" />
              </div>

              {/* Candidates */}
              {CANDIDATES.map((candidate) => (
                <div
                  key={candidate.id}
                  className="absolute size-8 rounded-full border-2 border-white shadow-md flex items-center justify-center text-xs font-bold text-white transition-transform hover:scale-110"
                  style={{
                    backgroundColor: candidate.color,
                    left: `calc(50% + ${candidate.x}%)`,
                    top: `calc(50% - ${candidate.y}%)`,
                    transform: "translate(-50%, -50%)",
                  }}
                  title={candidate.name}
                >
                  {candidate.name}
                </div>
              ))}

              {/* User Position */}
              {answers.length > 0 && (
                <div
                  className="absolute size-10 rounded-full bg-slate-900 border-4 border-white shadow-lg flex items-center justify-center transition-all duration-300"
                  style={{
                    left: `calc(50% + ${userPosition.x}%)`,
                    top: `calc(50% - ${userPosition.y}%)`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <div className="size-3 rounded-full bg-white" />
                </div>
              )}
            </div>

            {/* Candidate Legend */}
            <div className="mt-4 grid grid-cols-5 gap-2">
              {CANDIDATES.map((candidate) => (
                <button
                  key={candidate.id}
                  className="size-10 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-xs font-bold text-white hover:scale-110 transition-transform"
                  style={{ backgroundColor: candidate.color }}
                  title={candidate.name}
                >
                  {candidate.name}
                </button>
              ))}
            </div>

            {/* User Position Indicator */}
            {answers.length > 0 && (
              <div className="mt-4 flex items-center gap-2 text-sm">
                <div className="size-4 rounded-full bg-slate-900" />
                <span className="font-medium">Tu posición</span>
              </div>
            )}
          </Card>

          {/* Questions Panel */}
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">PROGRESO</div>
                  <div className="text-3xl font-bold">{Math.round(progress)}%</div>
                </div>
                <Button variant="outline" onClick={handleReset}>
                  Repetir Quiz
                </Button>
              </div>
              <Progress value={progress} className="h-2" />
            </Card>

            {!showResults ? (
              <Card className="p-6">
                <div className="mb-6">
                  <div className="text-sm font-medium text-muted-foreground mb-2">
                    PREGUNTA {question.id} DE {QUESTIONS.length}
                  </div>
                  <h2 className="text-xl font-bold mb-2">{question.text}</h2>
                  <p className="text-sm text-muted-foreground">
                    Así respondieron los candidatos y cómo se puntúa cada opción.
                  </p>
                </div>

                <div className="space-y-3">
                  {question.answers.map((answer, index) => (
                    <button
                      key={index}
                      onClick={() => handleAnswer(answer)}
                      className="w-full p-4 rounded-lg border-2 border-border bg-card hover:border-primary hover:bg-accent transition-all text-left group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium group-hover:text-primary">{answer.text}</span>
                        <span className="text-xs text-muted-foreground">
                          {answer.economicImpact !== 0 &&
                            `Económico ${answer.economicImpact > 0 ? "+" : ""}${answer.economicImpact} `}
                          {answer.socialImpact !== 0 &&
                            `Social ${answer.socialImpact > 0 ? "+" : ""}${answer.socialImpact}`}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        {answer.candidateIds.map((id) => {
                          const candidate = CANDIDATES.find((c) => c.id === id)
                          return (
                            <div
                              key={id}
                              className="size-6 rounded-full border border-white flex items-center justify-center text-[10px] font-bold text-white"
                              style={{ backgroundColor: candidate?.color }}
                            >
                              {candidate?.name}
                            </div>
                          )
                        })}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between mt-6">
                  <Button variant="outline" onClick={handlePrevious} disabled={currentQuestion === 0}>
                    Anterior
                  </Button>

                  <div className="flex gap-1">
                    {QUESTIONS.map((_, index) => (
                      <div
                        key={index}
                        className={`size-2 rounded-full transition-colors ${
                          index < currentQuestion ? "bg-primary" : index === currentQuestion ? "bg-primary" : "bg-muted"
                        }`}
                      />
                    ))}
                  </div>

                  <div className="w-24" />
                </div>
              </Card>
            ) : (
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4">Resultados del Quiz</h2>
                <p className="text-muted-foreground mb-6">
                  Has completado todas las preguntas. Tu posición política ha sido marcada en el gráfico con un punto
                  negro.
                </p>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Tu posición:</h3>
                    <p className="text-sm">
                      <span className="font-medium">Económica:</span>{" "}
                      {userPosition.x > 5 ? "Derecha" : userPosition.x < -5 ? "Izquierda" : "Centro"}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Social:</span>{" "}
                      {userPosition.y > 5 ? "Progresivo" : userPosition.y < -5 ? "Conservador" : "Moderado"}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={handleReset}>Reintentar Quiz</Button>
                    <Button variant="outline" asChild>
                      <Link href="/compare">Ver Comparación Detallada</Link>
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
