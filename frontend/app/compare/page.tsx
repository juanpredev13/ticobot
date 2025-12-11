"use client"

import { useState } from "react"
import { Search, X, FileText, ExternalLink, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

const PARTIES = [
  { id: "pln", name: "Partido Liberación Nacional", abbr: "PLN" },
  { id: "pusc", name: "Partido Unidad Social Cristiana", abbr: "PUSC" },
  { id: "pac", name: "Partido Acción Ciudadana", abbr: "PAC" },
  { id: "fa", name: "Frente Amplio", abbr: "FA" },
  { id: "prn", name: "Restauración Nacional", abbr: "PRN" },
  { id: "plp", name: "Liberal Progresista", abbr: "PLP" },
  { id: "pnr", name: "Nueva República", abbr: "PNR" },
  { id: "pin", name: "Partido Integración Nacional", abbr: "PIN" },
]

const TOPICS = ["Educación", "Salud", "Empleo", "Seguridad", "Ambiente", "Economía", "Infraestructura", "Corrupción"]

// Mock data for demonstration
const MOCK_PROPOSALS = {
  Educación: {
    pln: {
      summary: "Propuesta de reforma educativa integral con énfasis en tecnología y bilingüismo.",
      points: [
        "Implementación de tecnología en todas las aulas para 2026",
        "Programa nacional de inglés desde preescolar",
        "Aumento del presupuesto educativo al 8% del PIB",
      ],
      source: "Plan de Gobierno 2024-2028, página 45-52",
      documentUrl: "#",
    },
    pac: {
      summary: "Enfoque en educación pública de calidad y acceso universal.",
      points: [
        "Fortalecimiento de la educación pública gratuita",
        "Capacitación continua para docentes",
        "Infraestructura educativa en zonas rurales",
      ],
      source: "Propuesta Electoral 2024, sección 3.1",
      documentUrl: "#",
    },
    fa: {
      summary: "Transformación del sistema educativo hacia la equidad social.",
      points: [
        "Eliminación de las pruebas estandarizadas",
        "Educación sexual integral obligatoria",
        "Becas universales para estudiantes de bajos recursos",
      ],
      source: "Programa Político 2024-2028, capítulo 2",
      documentUrl: "#",
    },
  },
  Salud: {
    pln: {
      summary: "Modernización del sistema de salud con enfoque preventivo.",
      points: [
        "Digitalización completa del expediente médico",
        "Reducción de tiempos de espera en 50%",
        "Programas de prevención de enfermedades crónicas",
      ],
      source: "Plan de Gobierno 2024-2028, página 78-85",
      documentUrl: "#",
    },
    pac: {
      summary: "Fortalecimiento de la CCSS y atención primaria.",
      points: [
        "Aumento de presupuesto para la CCSS",
        "Más centros de atención primaria",
        "Contratación de 2000 profesionales de salud",
      ],
      source: "Propuesta Electoral 2024, sección 4.2",
      documentUrl: "#",
    },
  },
}

export default function ComparePage() {
  const [selectedParties, setSelectedParties] = useState<string[]>(["pln", "pac"])
  const [selectedTopic, setSelectedTopic] = useState<string>("Educación")
  const [searchQuery, setSearchQuery] = useState<string>("")

  const addParty = (partyId: string) => {
    if (selectedParties.length < 4 && !selectedParties.includes(partyId)) {
      setSelectedParties([...selectedParties, partyId])
    }
  }

  const removeParty = (partyId: string) => {
    if (selectedParties.length > 1) {
      setSelectedParties(selectedParties.filter((id) => id !== partyId))
    }
  }

  const availableParties = PARTIES.filter((p) => !selectedParties.includes(p.id))

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      {/* Header */}

      <div className="container mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">Comparación de propuestas</h1>
          <p className="text-muted-foreground">Compara las propuestas de hasta 4 partidos políticos lado a lado</p>
        </div>

        {/* Controls Section */}
        <div className="mb-8 space-y-4">
          {/* Topic Search */}
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar tema o palabra clave..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedTopic} onValueChange={setSelectedTopic}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Seleccionar tema" />
              </SelectTrigger>
              <SelectContent>
                {TOPICS.map((topic) => (
                  <SelectItem key={topic} value={topic}>
                    {topic}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Topic Pills */}
          <div className="flex flex-wrap gap-2">
            {TOPICS.map((topic) => (
              <Badge
                key={topic}
                variant={selectedTopic === topic ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedTopic(topic)}
              >
                {topic}
              </Badge>
            ))}
          </div>

          {/* Party Selection */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Comparando:</span>
            <div className="flex flex-wrap gap-2">
              {selectedParties.map((partyId) => {
                const party = PARTIES.find((p) => p.id === partyId)
                return (
                  <Badge key={partyId} variant="secondary" className="gap-1">
                    {party?.abbr}
                    {selectedParties.length > 1 && (
                      <button onClick={() => removeParty(partyId)} className="ml-1 hover:text-destructive">
                        <X className="size-3" />
                      </button>
                    )}
                  </Badge>
                )
              })}
              {selectedParties.length < 4 && availableParties.length > 0 && (
                <Select onValueChange={addParty}>
                  <SelectTrigger className="h-6 w-[140px] text-xs">
                    <Plus className="mr-1 size-3" />
                    <SelectValue placeholder="Añadir partido" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableParties.map((party) => (
                      <SelectItem key={party.id} value={party.id}>
                        {party.abbr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </div>

        {/* Comparison Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {selectedParties.map((partyId) => {
            const party = PARTIES.find((p) => p.id === partyId)
            const proposal = (MOCK_PROPOSALS as any)[selectedTopic]?.[partyId]

            return (
              <Card key={partyId} className="flex flex-col">
                <CardHeader className="border-b border-border bg-muted/50">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{party?.name}</CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">{party?.abbr}</p>
                    </div>
                    {selectedParties.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => removeParty(partyId)} className="size-8">
                        <X className="size-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-1 pt-6">
                  {proposal ? (
                    <div className="space-y-4">
                      {/* Summary */}
                      <div>
                        <h4 className="mb-2 text-sm font-semibold text-muted-foreground">Resumen</h4>
                        <p className="text-sm leading-relaxed">{proposal.summary}</p>
                      </div>

                      {/* Key Points */}
                      <div>
                        <h4 className="mb-2 text-sm font-semibold text-muted-foreground">Puntos clave</h4>
                        <ul className="space-y-2">
                          {proposal.points.map((point: string, index: number) => (
                            <li key={index} className="flex gap-2 text-sm leading-relaxed">
                              <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Source Citation */}
                      <div className="rounded-lg border border-border bg-muted/30 p-4">
                        <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                          <FileText className="size-3.5" />
                          Fuente
                        </div>
                        <p className="mb-2 text-sm">{proposal.source}</p>
                        <Button variant="outline" size="sm" className="h-8 text-xs bg-transparent" asChild>
                          <Link href={proposal.documentUrl} target="_blank" rel="noopener noreferrer">
                            Ver documento completo
                            <ExternalLink className="ml-2 size-3" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-full items-center justify-center py-12 text-center">
                      <div className="text-sm text-muted-foreground">No hay información disponible para este tema</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Help Text */}
        <div className="mt-8 rounded-lg border border-border bg-muted/30 p-6">
          <h3 className="mb-2 font-semibold">¿Cómo usar la comparación?</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
              <span>Selecciona un tema de interés usando los botones o el buscador</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
              <span>Añade hasta 4 partidos para comparar sus propuestas lado a lado</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
              <span>Revisa las fuentes originales haciendo clic en "Ver documento completo"</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
