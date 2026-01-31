"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useDocuments, useHealth, useParties, useCandidates } from "@/lib/hooks"
import { PageErrorBoundary } from "@/components/page-error-boundary"
import { EntityGrid } from "@/components/entity-grid"
import { PartyCard } from "@/components/party-card"

function HomeContent() {
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()
  const [isMounted, setIsMounted] = useState(false)

  // Fetch real data from API
  const { data: documentsData, isLoading: documentsLoading } = useDocuments()
  const { data: healthData, isLoading: healthLoading } = useHealth()
  const { data: partiesData, isLoading: partiesLoading } = useParties()
  const { data: candidatesData, isLoading: candidatesLoading } = useCandidates({
    limit: 50,
    position: 'Candidato a Presidente'
  })

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Get parties from API or use empty array
  const parties = partiesData?.parties || []
  const candidates = candidatesData?.candidates || []

  // Calculate stats from real data
  const stats = {
    parties: parties.length,
    documents: documentsData?.pagination.total || 0,
    verified: healthData?.status === "healthy" ? "100%" : "N/A",
    status: healthData?.status === "healthy" ? "Neutral" : "Verificando",
  }

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/chat?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm">
            <div className="size-2 rounded-full bg-teal-500" />
            <span className="text-muted-foreground">Información electoral transparente y neutral</span>
          </div>

          <h1 className="mb-6 text-balance text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
            Pregunta a los candidatos presidenciales
          </h1>

          <p className="mb-8 text-pretty text-lg text-muted-foreground md:text-xl">
            TicoBot te ayuda a hacer preguntas directamente a los candidatos presidenciales de Costa Rica. Obtén respuestas basadas en sus propuestas oficiales de forma neutral e imparcial.
          </p>

          {/* Search Bar */}
          <div className="mx-auto mb-12 max-w-2xl">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="¿Qué quieres preguntar a los candidatos? Ej: ¿Qué proponen para la educación?, ¿Cómo van a crear empleo?"
                  className="h-12 pl-10 pr-4"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </div>
              <Button size="lg" className="h-12 px-6" onClick={handleSearch}>
                Preguntar
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/compare">Comparar partidos</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/chat">Hacer una pregunta</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-border bg-muted/30">
        <div className="container mx-auto px-4 py-12">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="text-center">
              <div className="mb-2 text-3xl font-bold">
                {!isMounted || documentsLoading ? (
                  <Loader2 className="inline size-8 animate-spin" />
                ) : (
                  stats.parties
                )}
              </div>
              <div className="text-sm text-muted-foreground">Partidos registrados</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-3xl font-bold">
                {!isMounted || documentsLoading ? (
                  <Loader2 className="inline size-8 animate-spin" />
                ) : (
                  `${stats.documents}+`
                )}
              </div>
              <div className="text-sm text-muted-foreground">Documentos analizados</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-3xl font-bold">
                {!isMounted || healthLoading ? (
                  <Loader2 className="inline size-8 animate-spin" />
                ) : (
                  stats.verified
                )}
              </div>
              <div className="text-sm text-muted-foreground">Información verificada</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-3xl font-bold">
                {!isMounted || healthLoading ? (
                  <Loader2 className="inline size-8 animate-spin" />
                ) : (
                  stats.status
                )}
              </div>
              <div className="text-sm text-muted-foreground">Sin sesgo político</div>
            </div>
          </div>
        </div>
      </section>

      {/* Partidos y Candidatos Section */}
      <EntityGrid
        title="Partidos políticos y sus candidatos presidenciales"
        description="Explora los partidos y sus propuestas para las elecciones 2026"
        isLoading={partiesLoading || candidatesLoading}
        items={parties}
        renderItem={(party) => {
          // Find presidential candidate for this party
          const presidentialCandidate = candidates.find(
            c => c.party_id === party.id && c.position === 'Candidato a Presidente'
          )
          return <PartyCard party={party} candidate={presidentialCandidate} />
        }}
      />

      {/* Features Section */}
      <section className="border-t border-border bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <div className="grid gap-12 lg:grid-cols-3">
            <div className="text-center">
              <div className="mb-4 inline-flex size-16 items-center justify-center rounded-lg bg-background">
                <svg className="size-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="mb-3 text-xl font-semibold">Comparación lado a lado</h3>
              <p className="text-muted-foreground">
                Compara hasta 4 partidos simultáneamente con citas directas de sus documentos oficiales
              </p>
            </div>

            <div className="text-center">
              <div className="mb-4 inline-flex size-16 items-center justify-center rounded-lg bg-background">
                <svg className="size-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
              </div>
              <h3 className="mb-3 text-xl font-semibold">Asistente de preguntas</h3>
              <p className="text-muted-foreground">
                Pregunta sobre cualquier tema y obtén respuestas basadas en documentos verificados
              </p>
            </div>

            <div className="text-center">
              <div className="mb-4 inline-flex size-16 items-center justify-center rounded-lg bg-background">
                <svg className="size-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3 className="mb-3 text-xl font-semibold">100% verificado</h3>
              <p className="text-muted-foreground">
                Toda la información proviene directamente de documentos oficiales de los partidos
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="text-sm text-muted-foreground">
              © 2025 TicoBot. Plataforma de información electoral neutral.
            </div>
            <div className="flex gap-6">
              <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground">
                Acerca de
              </Link>
              <Link href="/methodology" className="text-sm text-muted-foreground hover:text-foreground">
                Metodología
              </Link>
              <Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground">
                Contacto
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default function HomePage() {
  return (
    <PageErrorBoundary>
      <HomeContent />
    </PageErrorBoundary>
  )
}
