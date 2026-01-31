"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { Send, Loader2, MessageSquare, FileText, ExternalLink, Trash2, StopCircle } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getUsageStatus, incrementChatUsage, canSendMessage, type UsageStatus } from "@/lib/usage-tracker"
import { UsageBanner } from "@/components/usage-banner"
import { AuthDialog } from "@/components/auth-dialog"
import { useChat, useChatStream, useUser, useParties } from "@/lib/hooks"
import { PageErrorBoundary } from "@/components/page-error-boundary"
import type { ChatResponse } from "@/lib/api/types"
import { createPartyColorMap, getPartyPrimaryColor } from "@/lib/utils/party-colors"

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  sources?: Array<{
    title: string
    content: string
    score: number
    metadata?: {
      page?: number
      party?: string
      document?: string
    }
  }>
  timestamp: Date
}

type AuthMode = "signup" | "signin"

const SUGGESTED_QUESTIONS = [
  "¿Qué proponen el PLN y el FA sobre educación?",
  "¿Cuáles son las propuestas del PUSC y CAC para salud?",
  "¿Cómo abordan el PUSC y el PLN la seguridad?",
  "¿Qué proponen el FA y PS sobre cambio climático?",
  "¿Qué planes tienen el PUSC y FA para la economía?",
]

function ChatContent() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [conversationId, setConversationId] = useState<string>("")
  const [streamingEnabled, setStreamingEnabled] = useState(true)
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [authMode, setAuthMode] = useState<AuthMode>("signup")
  const [usageStatus, setUsageStatus] = useState<UsageStatus | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)
  const inputContainerRef = useRef<HTMLDivElement>(null)

  // React Query hooks
  const { data: user, isLoading: userLoading } = useUser()
  const chatMutation = useChat()
  const { startStream, stopStream, isStreaming, streamedContent, sources: streamSources, reset: resetStream } = useChatStream()
  const { data: partiesData } = useParties()

  // Create party color map
  const partyColorMap = createPartyColorMap(partiesData?.parties || [])

  const isAuthenticated = !!user
  const isLoading = chatMutation.isPending || isStreaming

  useEffect(() => {
    setUsageStatus(getUsageStatus(isAuthenticated))
  }, [isAuthenticated])

  useEffect(() => {
    // Always focus input on page load
    const focusInput = () => {
      if (inputRef.current) {
        inputRef.current.focus({ preventScroll: true })
      }
    }

    // Wait for page to fully render
    requestAnimationFrame(() => {
      setTimeout(focusInput, 200)
    })
  }, [])

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
    const query = inputValue
    setInputValue("")

    incrementChatUsage(isAuthenticated)
    setUsageStatus(getUsageStatus(isAuthenticated))

    if (streamingEnabled) {
      // Use streaming chat
      resetStream()

      // Add placeholder for streaming message
      const streamMessageId = (Date.now() + 1).toString()
      setMessages((prev) => [
        ...prev,
        {
          id: streamMessageId,
          role: "assistant",
          content: "",
          timestamp: new Date(),
        },
      ])

      await startStream({
        query,
        conversationId: conversationId || undefined,
      })
    } else {
      // Use normal chat
      chatMutation.mutate(
        {
          query,
          conversationId: conversationId || undefined,
        },
        {
          onSuccess: (data: ChatResponse) => {
            // Update conversation ID
            setConversationId(data.conversationId)

            // Map sources to Message format
            const mappedSources = data.sources?.map(source => ({
              title: source.document || source.documentId || 'Documento',
              content: source.excerpt || '',
              score: source.score || 0,
              metadata: {
                party: source.party || '',
                page: source.page ? (typeof source.page === 'number' ? source.page : parseInt(source.page)) : undefined,
                document: source.document || source.documentId || '',
              }
            })) || []

            // Add assistant message
            const assistantMessage: Message = {
              id: (Date.now() + 1).toString(),
              role: "assistant",
              content: data.answer,
              sources: mappedSources,
              timestamp: new Date(),
            }
            setMessages((prev) => [...prev, assistantMessage])
          },
        }
      )
    }
  }

  // Update streaming content and sources in real-time
  useEffect(() => {
    if (streamedContent && isStreaming) {
      setMessages((prev) => {
        const updated = [...prev]
        const lastMessage = updated[updated.length - 1]
        if (lastMessage && lastMessage.role === "assistant") {
          lastMessage.content = streamedContent
        }
        return updated
      })
    }
  }, [streamedContent, isStreaming])

  // Update sources when stream completes
  useEffect(() => {
    if (!isStreaming && streamSources && streamSources.length > 0) {
      setMessages((prev) => {
        const updated = [...prev]
        const lastMessage = updated[updated.length - 1]
        if (lastMessage && lastMessage.role === "assistant") {
          // Map sources to Message format
          lastMessage.sources = streamSources.map(source => ({
            title: source.document || source.documentId || 'Documento',
            content: source.excerpt || '',
            score: source.score || 0,
            metadata: {
              party: source.party || '',
              page: source.page ? (typeof source.page === 'number' ? source.page : parseInt(source.page)) : undefined,
              document: source.document || source.documentId || '',
            }
          }))
        }
        return updated
      })
    }
  }, [isStreaming, streamSources])

  const handleSuggestedQuestion = (question: string) => {
    setInputValue(question)
    setTimeout(() => {
      // Trigger send with the question
      const event = new KeyboardEvent("keydown", { key: "Enter" })
      inputRef.current?.dispatchEvent(event)
      // Or directly call handleSendMessage after setting input
      handleSendMessage()
    }, 100)
  }

  const handleClearHistory = () => {
    setMessages([])
    setConversationId("")
  }

  const handleAuthSuccess = () => {
    setShowAuthDialog(false)
    setUsageStatus(getUsageStatus(true))
  }

  const handleUpgrade = () => {
    setShowAuthDialog(true)
    setAuthMode("signup")
  }

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      <div className="container mx-auto px-4 py-4 md:py-8 flex-1 flex flex-col overflow-hidden">
        {/* Page Title */}
        <div className="mb-4 md:mb-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl md:text-3xl font-bold">Asistente de preguntas</h1>
              <p className="text-muted-foreground text-sm hidden md:block">
                Pregunta sobre propuestas políticas y obtén respuestas con fuentes verificadas
              </p>
            </div>
            <div className="flex items-center gap-3">
              {messages.length > 0 && (
                <Button variant="outline" size="sm" onClick={handleClearHistory}>
                  <Trash2 className="size-4" />
                  <span className="hidden md:inline ml-1">Limpiar</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {usageStatus && (
          <div className="mb-4 hidden md:block flex-shrink-0">
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

        <div className="flex-1 flex flex-col lg:grid lg:grid-cols-[1fr_380px] gap-6 min-h-0 overflow-hidden">
          {/* Chat Area */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <Card className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <CardContent className="flex-1 flex flex-col p-0 min-h-0 overflow-hidden">
                {/* Messages */}
                <div
                  className="flex-1 space-y-6 overflow-y-auto p-4 md:p-6"
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
                          {/* Message Bubble - Skip empty assistant messages (streaming placeholder) */}
                          {(message.role === "user" || message.content) && (
                          <div
                            className={`rounded-lg p-4 ${
                              message.role === "user"
                                ? "bg-primary text-primary-foreground"
                                : "border border-border bg-card"
                            }`}
                          >
                            {message.role === "user" ? (
                              <p className="text-sm leading-relaxed">{message.content}</p>
                            ) : (
                            <div className="prose prose-sm max-w-none dark:prose-invert">
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  h2: ({ node, ...props }) => (
                                    <h2 className="mt-6 mb-3 text-lg font-semibold text-foreground border-b border-border pb-2" {...props} />
                                  ),
                                  h3: ({ node, ...props }) => (
                                    <h3 className="mt-4 mb-2 text-base font-semibold text-foreground" {...props} />
                                  ),
                                  p: ({ node, ...props }) => (
                                    <p className="mb-3 text-sm leading-relaxed text-foreground" {...props} />
                                  ),
                                  ul: ({ node, ...props }) => (
                                    <ul className="mb-3 ml-4 list-disc space-y-1 text-sm" {...props} />
                                  ),
                                  li: ({ node, ...props }) => (
                                    <li className="text-foreground" {...props} />
                                  ),
                                  strong: ({ node, ...props }) => (
                                    <strong className="font-semibold text-foreground" {...props} />
                                  ),
                                }}
                              >
                                {message.content}
                              </ReactMarkdown>
                            </div>
                            )}
                          </div>
                          )}

                          {/* Sources (only for assistant messages) */}
                          {message.role === "assistant" && message.sources && message.sources.length > 0 && (
                            <div className="mt-3 space-y-2">
                              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                <FileText className="size-3.5" />
                                Fuentes consultadas
                              </div>
                              <div className="space-y-2">
                                {message.sources.map((source, index) => {
                                  const partyColor = getPartyPrimaryColor(source.metadata?.party, partyColorMap)
                                  return (
                                    <div key={index} className="rounded-lg border border-border bg-muted/30 p-3">
                                      <div className="mb-1 flex items-start justify-between gap-2">
                                        <div>
                                          <div className="text-xs font-semibold">{source.title}</div>
                                          {source.metadata?.party && (
                                            <div className="mt-1 flex items-center gap-2">
                                              <div 
                                                className="size-2 rounded-full"
                                                style={{ backgroundColor: partyColor }}
                                              />
                                              <span className="text-xs text-muted-foreground">
                                                {source.metadata.party}
                                                {source.metadata.page && `, pág. ${source.metadata.page}`}
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                        <Badge variant="secondary" className="shrink-0 text-xs">
                                          {(source.score * 100).toFixed(0)}%
                                        </Badge>
                                      </div>
                                      <p className="mb-2 text-xs leading-relaxed text-muted-foreground line-clamp-3">
                                        {source.content}
                                      </p>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}

                          {/* Timestamp - Hide for empty streaming messages */}
                          {(message.role === "user" || message.content) && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            {message.timestamp.toLocaleTimeString("es-CR", { hour: "2-digit", minute: "2-digit" })}
                          </div>
                          )}
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
                <div ref={inputContainerRef} className="flex-shrink-0 border-t border-border bg-muted/30 p-4">
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
                    {isStreaming ? (
                      <Button onClick={stopStream} variant="destructive" size="icon">
                        <StopCircle className="size-4" />
                      </Button>
                    ) : (
                      <Button
                        onClick={handleSendMessage}
                        disabled={!inputValue.trim() || isLoading || (usageStatus?.limitReached ?? false)}
                        size="icon"
                      >
                        {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                      </Button>
                    )}
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground hidden md:block">
                    Presiona Enter para enviar
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Hidden on mobile */}
          <div className="hidden lg:block space-y-6 overflow-y-auto">
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
                <div className="mt-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 p-3 border border-amber-200 dark:border-amber-800">
                  <p className="text-amber-800 dark:text-amber-200 font-medium text-xs">
                    Recomendación: Para obtener respuestas más completas y detalladas, pregunta por 2 o 3 partidos específicos en cada consulta.
                  </p>
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
    <PageErrorBoundary>
      <Suspense
        fallback={
          <div className="min-h-screen bg-background flex items-center justify-center">
            <Loader2 className="size-8 animate-spin" />
          </div>
        }
      >
        <ChatContent />
      </Suspense>
    </PageErrorBoundary>
  )
}
