"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Send, Loader2, MessageSquare, FileText, ExternalLink, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getUsageStatus, incrementChatUsage, canSendMessage, type UsageStatus } from "@/lib/usage-tracker"
import { UsageBanner } from "@/components/usage-banner"
import { AuthDialog } from "@/components/auth-dialog"

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  sources?: Array<{
    party: string
    document: string
    page: number
    excerpt: string
    url: string
  }>
  timestamp: Date
}

type AuthMode = "signup" | "signin"

const SUGGESTED_QUESTIONS = [
  "¿Qué proponen los partidos sobre educación?",
  "¿Cuáles son las propuestas de salud?",
  "¿Qué planes tienen para el empleo?",
  "¿Cómo abordan la seguridad ciudadana?",
]

const MOCK_RESPONSE = {
  content:
    "Los partidos políticos presentan diversas propuestas sobre educación. El PLN propone implementar tecnología en todas las aulas para 2026 y un programa nacional de inglés desde preescolar. El PAC enfatiza el fortalecimiento de la educación pública gratuita y la capacitación continua para docentes. El Frente Amplio propone la eliminación de las pruebas estandarizadas y educación sexual integral obligatoria.",
  sources: [
    {
      party: "Partido Liberación Nacional",
      document: "Plan de Gobierno 2024-2028",
      page: 45,
      excerpt: "Implementación de tecnología en todas las aulas para 2026 y programa nacional de inglés...",
      url: "#",
    },
    {
      party: "Partido Acción Ciudadana",
      document: "Propuesta Electoral 2024",
      page: 23,
      excerpt: "Fortalecimiento de la educación pública gratuita con énfasis en la capacitación docente...",
      url: "#",
    },
    {
      party: "Frente Amplio",
      document: "Programa Político 2024-2028",
      page: 18,
      excerpt: "Transformación del sistema educativo hacia la equidad social, eliminando pruebas...",
      url: "#",
    },
  ],
}

function ChatContent() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [usageStatus, setUsageStatus] = useState<UsageStatus | null>(null)
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [authMode, setAuthMode] = useState<AuthMode>("signup")
  const [userName, setUserName] = useState<string | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)
  const inputContainerRef = useRef<HTMLDivElement>(null)
  const searchParams = useSearchParams()

  useEffect(() => {
    const checkAuth = () => {
      const isAuth = localStorage.getItem("ticobot_auth") === "true"
      setIsAuthenticated(isAuth)

      if (isAuth) {
        const user = localStorage.getItem("ticobot_user")
        if (user) {
          const userData = JSON.parse(user)
          setUserName(userData.name)
        }
      }

      setUsageStatus(getUsageStatus(isAuth))
    }

    checkAuth()
  }, [])

  useEffect(() => {
    if (searchParams.get("focus") === "true") {
      const scrollAndFocus = () => {
        if (inputContainerRef.current && inputRef.current) {
          // Use scrollIntoView for better mobile support
          inputContainerRef.current.scrollIntoView({
            behavior: "smooth",
            block: "center",
          })

          // Focus after scroll animation completes
          setTimeout(() => {
            if (inputRef.current) {
              // For mobile, we need to trigger a click-like focus
              inputRef.current.focus({ preventScroll: true })

              // On iOS, we may need to trigger the keyboard manually
              inputRef.current.click()
            }
          }, 600)
        }
      }

      // Wait for page to fully render
      requestAnimationFrame(() => {
        setTimeout(scrollAndFocus, 200)
      })
    }
  }, [searchParams])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    if (!canSendMessage(isAuthenticated)) {
      if (!isAuthenticated) {
        setShowAuthDialog(true)
        setAuthMode("signup")
      }
      return
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsLoading(true)

    incrementChatUsage(isAuthenticated)
    setUsageStatus(getUsageStatus(isAuthenticated))

    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: MOCK_RESPONSE.content,
        sources: MOCK_RESPONSE.sources,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
      setIsLoading(false)
    }, 1500)
  }

  const handleSuggestedQuestion = (question: string) => {
    setInputValue(question)
    setTimeout(() => {
      handleSendMessageWithQuestion(question)
    }, 100)
  }

  const handleSendMessageWithQuestion = async (question: string) => {
    if (!question.trim() || isLoading) return

    if (!canSendMessage(isAuthenticated)) {
      if (!isAuthenticated) {
        setShowAuthDialog(true)
        setAuthMode("signup")
      }
      return
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: question,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsLoading(true)

    incrementChatUsage(isAuthenticated)
    setUsageStatus(getUsageStatus(isAuthenticated))

    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: MOCK_RESPONSE.content,
        sources: MOCK_RESPONSE.sources,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
      setIsLoading(false)
    }, 1500)
  }

  const handleClearHistory = () => {
    setMessages([])
  }

  const handleAuthSuccess = () => {
    setIsAuthenticated(true)
    setShowAuthDialog(false)
    const user = localStorage.getItem("ticobot_user")
    if (user) {
      const userData = JSON.parse(user)
      setUserName(userData.name)
    }
    setUsageStatus(getUsageStatus(true))
  }

  const handleLogout = () => {
    localStorage.removeItem("ticobot_auth")
    localStorage.removeItem("ticobot_user")
    setIsAuthenticated(false)
    setUserName(null)
    setUsageStatus(getUsageStatus(false))
  }

  const handleUpgrade = () => {
    setShowAuthDialog(true)
    setAuthMode("signup")
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-bold">Asistente de preguntas</h1>
              <p className="text-muted-foreground">
                Pregunta sobre propuestas políticas y obtén respuestas con fuentes verificadas
              </p>
            </div>
            {messages.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleClearHistory}>
                <Trash2 className="size-4" />
                Limpiar
              </Button>
            )}
          </div>
        </div>

        {usageStatus && (
          <div className="mb-6">
            <UsageBanner status={usageStatus} onUpgrade={handleUpgrade} />
          </div>
        )}

        {showAuthDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="absolute -right-2 -top-2 z-10"
                onClick={() => setShowAuthDialog(false)}
              >
                ✕
              </Button>
              <AuthDialog mode={authMode} onSuccess={handleAuthSuccess} onModeChange={setAuthMode} />
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          {/* Chat Area */}
          <div className="flex flex-col">
            <Card className="flex flex-1 flex-col">
              <CardContent className="flex flex-1 flex-col p-0">
                {/* Messages */}
                <div
                  className="flex-1 space-y-6 overflow-y-auto p-6"
                  style={{ minHeight: "500px", maxHeight: "calc(100vh - 400px)" }}
                >
                  {messages.length === 0 ? (
                    // Empty State
                    <div className="flex h-full flex-col items-center justify-center text-center">
                      <div className="mb-6 flex size-16 items-center justify-center rounded-full bg-muted">
                        <MessageSquare className="size-8 text-muted-foreground" />
                      </div>
                      <h3 className="mb-2 text-lg font-semibold">Haz tu primera pregunta</h3>
                      <p className="mb-6 text-sm text-muted-foreground">
                        Pregunta sobre cualquier tema político y obtén respuestas basadas en documentos verificados
                      </p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {SUGGESTED_QUESTIONS.map((question, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            onClick={() => handleSuggestedQuestion(question)}
                          >
                            {question}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div className={`max-w-[85%] ${message.role === "user" ? "ml-auto" : ""}`}>
                          {/* Message Bubble */}
                          <div
                            className={`rounded-lg p-4 ${
                              message.role === "user"
                                ? "bg-primary text-primary-foreground"
                                : "border border-border bg-card"
                            }`}
                          >
                            <p className="text-sm leading-relaxed">{message.content}</p>
                          </div>

                          {/* Sources (only for assistant messages) */}
                          {message.role === "assistant" && message.sources && message.sources.length > 0 && (
                            <div className="mt-3 space-y-2">
                              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                <FileText className="size-3.5" />
                                Fuentes consultadas
                              </div>
                              <div className="space-y-2">
                                {message.sources.map((source, index) => (
                                  <div key={index} className="rounded-lg border border-border bg-muted/30 p-3">
                                    <div className="mb-1 flex items-start justify-between gap-2">
                                      <div>
                                        <div className="text-xs font-semibold">{source.party}</div>
                                        <div className="text-xs text-muted-foreground">
                                          {source.document}, pág. {source.page}
                                        </div>
                                      </div>
                                      <Badge variant="secondary" className="shrink-0 text-xs">
                                        p. {source.page}
                                      </Badge>
                                    </div>
                                    <p className="mb-2 text-xs leading-relaxed text-muted-foreground">
                                      {source.excerpt}
                                    </p>
                                    <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                                      <a href={source.url} target="_blank" rel="noopener noreferrer">
                                        Ver documento
                                        <ExternalLink className="ml-1 size-3" />
                                      </a>
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Timestamp */}
                          <div className="mt-2 text-xs text-muted-foreground">
                            {message.timestamp.toLocaleTimeString("es-CR", { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                      </div>
                    ))
                  )}

                  {/* Loading Indicator */}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-4">
                        <Loader2 className="size-4 animate-spin text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Analizando documentos...</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input Area */}
                <div ref={inputContainerRef} className="border-t border-border bg-muted/30 p-4">
                  <div className="flex gap-2">
                    <Input
                      ref={inputRef}
                      placeholder="Escribe tu pregunta aquí..."
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage()
                        }
                      }}
                      disabled={isLoading || (usageStatus?.limitReached ?? false)}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!inputValue.trim() || isLoading || (usageStatus?.limitReached ?? false)}
                      size="icon"
                    >
                      {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                    </Button>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Presiona Enter para enviar • Shift + Enter para nueva línea
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Suggested Questions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Preguntas sugeridas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {SUGGESTED_QUESTIONS.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestedQuestion(question)}
                    className="w-full rounded-lg border border-border bg-card p-3 text-left text-sm transition-all hover:border-primary hover:bg-muted"
                  >
                    {question}
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Chat History */}
            {messages.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Historial de chat</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {messages
                    .filter((m) => m.role === "user")
                    .slice(-5)
                    .reverse()
                    .map((message) => (
                      <div key={message.id} className="rounded-lg border border-border bg-muted/30 p-3">
                        <p className="line-clamp-2 text-sm">{message.content}</p>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {message.timestamp.toLocaleDateString("es-CR", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    ))}
                </CardContent>
              </Card>
            )}

            {/* Help Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">¿Cómo funciona?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="flex gap-2">
                  <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
                  <span>Haz preguntas en lenguaje natural sobre propuestas políticas</span>
                </div>
                <div className="flex gap-2">
                  <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
                  <span>Las respuestas se basan en documentos oficiales verificados</span>
                </div>
                <div className="flex gap-2">
                  <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
                  <span>Cada respuesta incluye las fuentes consultadas con páginas específicas</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="size-8 animate-spin" />
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  )
}
