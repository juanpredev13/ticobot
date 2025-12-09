"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/compare?search=${encodeURIComponent(searchQuery.trim())}`)
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
            Compara propuestas políticas de forma neutral
          </h1>

          <p className="mb-8 text-pretty text-lg text-muted-foreground md:text-xl">
            TicoBot te ayuda a comparar las propuestas de los partidos políticos en Costa Rica. Información verificada,
            imparcial y basada en documentos oficiales.
          </p>

          {/* Search Bar */}
          <div className="mx-auto mb-12 max-w-2xl">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="¿Qué propuestas quieres comparar? Ej: educación, salud, empleo..."
                  className="h-12 pl-10 pr-4"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </div>
              <Button size="lg" className="h-12 px-6" onClick={handleSearch}>
                Buscar
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
              <div className="mb-2 text-3xl font-bold">12</div>
              <div className="text-sm text-muted-foreground">Partidos registrados</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-3xl font-bold">150+</div>
              <div className="text-sm text-muted-foreground">Documentos analizados</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-3xl font-bold">100%</div>
              <div className="text-sm text-muted-foreground">Información verificada</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-3xl font-bold">Neutral</div>
              <div className="text-sm text-muted-foreground">Sin sesgo político</div>
            </div>
          </div>
        </div>
      </section>

      {/* Party Grid Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold">Partidos políticos disponibles</h2>
          <p className="text-muted-foreground">Selecciona los partidos que quieres comparar</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[
            "Partido Liberación Nacional",
            "Partido Unidad Social Cristiana",
            "Partido Acción Ciudadana",
            "Frente Amplio",
            "Restauración Nacional",
            "Liberal Progresista",
            "Nueva República",
            "Partido Integración Nacional",
          ].map((party, index) => (
            <Link
              key={index}
              href={index === 0 ? "/party/pln" : `/compare?party=${index}`}
              className="group rounded-lg border border-border bg-card p-6 transition-all hover:border-primary hover:shadow-lg"
            >
              <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-muted">
                <span className="text-lg font-bold text-muted-foreground">{party.charAt(0)}</span>
              </div>
              <h3 className="mb-2 font-semibold group-hover:text-primary">{party}</h3>
              <p className="text-sm text-muted-foreground">Ver propuestas y documentos</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Candidates Section */}
      <section className="container mx-auto px-4 py-16 border-t border-border">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold">Candidatos principales</h2>
          <p className="text-muted-foreground">Conoce a los candidatos y sus propuestas</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[
            {
              name: "José María Figueres Olsen",
              party: "Partido Liberación Nacional",
              position: "Candidato a Presidente",
              id: "jose-maria-figueres",
            },
            {
              name: "Fabricio Alvarado Muñoz",
              party: "Nueva República",
              position: "Candidato a Presidente",
              id: "fabricio-alvarado",
            },
            {
              name: "Carlos Alvarado Quesada",
              party: "Partido Acción Ciudadana",
              position: "Candidato a Presidente",
              id: "carlos-alvarado",
            },
            {
              name: "Rodrigo Chaves Robles",
              party: "Partido Progreso Social Democrático",
              position: "Candidato a Presidente",
              id: "rodrigo-chaves",
            },
          ].map((candidate, index) => (
            <Link
              key={index}
              href={`/candidate/${candidate.id}`}
              className="group rounded-lg border border-border bg-card p-6 transition-all hover:border-primary hover:shadow-lg"
            >
              <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
                <span className="text-xl font-bold text-muted-foreground">
                  {candidate.name.split(" ")[0].charAt(0)}
                  {candidate.name.split(" ")[2]?.charAt(0) || candidate.name.split(" ")[1].charAt(0)}
                </span>
              </div>
              <h3 className="mb-1 font-semibold group-hover:text-primary">{candidate.name}</h3>
              <p className="mb-2 text-sm font-medium text-primary">{candidate.party}</p>
              <p className="text-sm text-muted-foreground">{candidate.position}</p>
            </Link>
          ))}
        </div>
      </section>

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
