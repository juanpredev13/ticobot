"use client"

import { useState, useEffect, useMemo } from "react"
import { Search, X, FileText, ExternalLink, Plus, Loader2, AlertCircle, CheckCircle2, AlertTriangle, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCompareProposals, useParties } from "@/lib/hooks"
import { ProposalState } from "@/lib/api/services/compare"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { createPartyColorMap, getPartyPrimaryColor, getPartySecondaryColor } from "@/lib/utils/party-colors"
import { CompareLoading } from "@/components/compare-loading"

const TOPICS = ["Educación", "Salud", "Empleo", "Seguridad", "Ambiente", "Economía", "Infraestructura", "Corrupción"]

/**
 * Get icon for proposal state
 */
function getStateIcon(state: ProposalState) {
  switch (state) {
    case ProposalState.COMPLETA:
      return <CheckCircle2 className="size-4 text-green-600" />
    case ProposalState.PARCIAL:
      return <AlertCircle className="size-4 text-yellow-600" />
    case ProposalState.POCO_CLARA:
      return <AlertTriangle className="size-4 text-orange-600" />
    case ProposalState.SIN_INFORMACION:
      return <HelpCircle className="size-4 text-gray-400" />
    default:
      return <HelpCircle className="size-4 text-gray-400" />
  }
}

/**
 * Get badge variant for proposal state
 */
function getStateBadgeVariant(state: ProposalState): "default" | "secondary" | "destructive" | "outline" {
  switch (state) {
    case ProposalState.COMPLETA:
      return "default"
    case ProposalState.PARCIAL:
      return "secondary"
    case ProposalState.POCO_CLARA:
      return "outline"
    case ProposalState.SIN_INFORMACION:
      return "outline"
    default:
      return "outline"
  }
}

/**
 * Calculate topic coverage based on sources and answer length
 * Returns a label and color for the coverage level
 */
function getTopicCoverage(sourcesCount: number, answerLength: number): {
  label: string;
  level: "alta" | "media" | "baja";
  color: string;
} {
  // Score based on sources (0-50 points) and answer length (0-50 points)
  const sourcesScore = Math.min(sourcesCount * 15, 45); // 3 sources = 45 points
  const lengthScore = Math.min(answerLength / 40, 55); // ~2200 chars = 55 points
  const totalScore = sourcesScore + lengthScore;

  if (totalScore >= 70) {
    return { label: "Cobertura amplia", level: "alta", color: "text-green-600" };
  } else if (totalScore >= 40) {
    return { label: "Cobertura moderada", level: "media", color: "text-yellow-600" };
  } else {
    return { label: "Cobertura limitada", level: "baja", color: "text-orange-600" };
  }
}

export default function ComparePage() {
  const [selectedParties, setSelectedParties] = useState<string[]>([])
  const [selectedTopic, setSelectedTopic] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [customTopic, setCustomTopic] = useState<string>("")

  // Fetch parties list
  const { data: partiesData, isLoading: partiesLoading } = useParties()
  // Limit to top 5 parties only
  const parties = (partiesData?.parties || []).slice(0, 5)
  
  // Create party color map
  const partyColorMap = createPartyColorMap(parties)

  // Compare mutation
  const compareMutation = useCompareProposals()

  // Track if component is mounted to avoid hydration issues
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Initialize with all top 5 parties if available
  useEffect(() => {
    if (isMounted && parties.length > 0 && selectedParties.length === 0) {
      const allParties = parties.map(p => p.slug)
      setSelectedParties(allParties)
    }
  }, [isMounted, parties, selectedParties.length])

  // Auto-compare when topic or parties change
  useEffect(() => {
    if (isMounted && selectedParties.length > 0 && (selectedTopic || customTopic)) {
      const topic = customTopic || selectedTopic
      handleCompare(topic)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted, selectedParties, selectedTopic])

  const handleCompare = async (topic: string) => {
    if (!topic || selectedParties.length === 0) return

    compareMutation.mutate({
      topic,
      partyIds: selectedParties,
      topKPerParty: 3,
    })
  }

  const addParty = (partyId: string) => {
    if (selectedParties.length < 5 && !selectedParties.includes(partyId)) {
      setSelectedParties([...selectedParties, partyId])
    }
  }

  const removeParty = (partyId: string) => {
    if (selectedParties.length > 1) {
      setSelectedParties(selectedParties.filter((id) => id !== partyId))
    }
  }

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setCustomTopic(searchQuery)
      setSelectedTopic("")
      handleCompare(searchQuery)
    }
  }

  const handleTopicSelect = (topic: string) => {
    setSelectedTopic(topic)
    setCustomTopic("")
    setSearchQuery("")
  }

  const availableParties = useMemo(() => 
    parties.filter((p) => !selectedParties.includes(p.slug)),
    [parties, selectedParties]
  )
  const comparisonData = compareMutation.data
  const isLoading = (compareMutation.isPending || partiesLoading) && isMounted
  const hasError = compareMutation.isError

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      <div className="container mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">Comparación de propuestas</h1>
          <p className="text-muted-foreground">Compara las propuestas de hasta 5 partidos políticos lado a lado</p>
        </div>

        {/* Controls Section */}
        <div className="mb-8 space-y-4">
          {/* Topic Search */}
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar tema o palabra clave (ej: educación superior, salud mental, empleo juvenil)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearch()
                  }
                }}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} disabled={!searchQuery.trim() || isLoading}>
              {isLoading && isMounted ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Search className="mr-2 size-4" />
              )}
              Buscar
            </Button>
            <Select value={selectedTopic} onValueChange={handleTopicSelect}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Temas comunes" />
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
                onClick={() => handleTopicSelect(topic)}
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
                const party = parties.find((p) => p.slug === partyId)
                return (
                  <Badge key={partyId} variant="secondary" className="gap-1">
                    {party?.abbreviation || party?.name || partyId}
                    {selectedParties.length > 1 && (
                      <button onClick={() => removeParty(partyId)} className="ml-1 hover:text-destructive">
                        <X className="size-3" />
                      </button>
                    )}
                  </Badge>
                )
              })}
              {selectedParties.length < 5 && availableParties.length > 0 && (
                <Select onValueChange={addParty}>
                  <SelectTrigger className="h-6 w-[200px] text-xs">
                    <Plus className="mr-1 size-3" />
                    <SelectValue placeholder="Añadir partido" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableParties.map((party) => (
                      <SelectItem key={party.slug} value={party.slug}>
                        <div className="flex flex-col">
                          <span className="font-medium">{party.abbreviation || party.slug.toUpperCase()}</span>
                          <span className="text-xs text-muted-foreground">{party.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Error Message */}
          {hasError && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="size-4" />
                <span>Error al comparar propuestas. Por favor, intenta de nuevo.</span>
              </div>
            </div>
          )}
        </div>

        {/* Comparison Grid */}
        {(() => {
          if (!isMounted) {
            return (
              <div className="flex items-center justify-center py-12">
                <div className="text-muted-foreground">Cargando...</div>
              </div>
            )
          }
          
          if (isLoading) {
            return (
              <CompareLoading
                partiesCount={selectedParties.length}
                topic={customTopic || selectedTopic || "propuestas"}
              />
            )
          }
          
          if (comparisonData) {
            return (
              <>
                <div className="mb-4">
                  <h2 className="text-xl font-semibold">
                    Comparación: {comparisonData.topic}
                  </h2>
                </div>
            <div className="grid gap-6 lg:grid-cols-2">
              {comparisonData.comparisons.map((comparison) => {
                const primaryColor = getPartyPrimaryColor(comparison.party, partyColorMap);
                const secondaryColor = getPartySecondaryColor(comparison.party, partyColorMap);

                return (
                  <Card key={comparison.party} className="flex flex-col overflow-hidden">
                    {/* Barra de colores del partido */}
                    <div
                      className="h-2 w-full"
                      style={{
                        background: `linear-gradient(to right, ${primaryColor} 0%, ${primaryColor} 50%, ${secondaryColor} 50%, ${secondaryColor} 100%)`
                      }}
                    />
                <CardHeader className="border-b border-border pt-4">
                  <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">{comparison.partyName}</CardTitle>
                            {getStateIcon(comparison.state)}
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {comparison.partyAbbreviation || comparison.party}
                          </p>
                          <div className="mt-2 flex items-center gap-2 flex-wrap">
                            <Badge variant={getStateBadgeVariant(comparison.state)} className="text-xs">
                              {comparison.stateLabel}
                            </Badge>
                            {comparison.state !== ProposalState.SIN_INFORMACION && (
                              <span className={`text-xs font-medium ${getTopicCoverage(comparison.sources.length, comparison.answer.length).color}`}>
                                {getTopicCoverage(comparison.sources.length, comparison.answer.length).label}
                              </span>
                            )}
                          </div>
                    </div>
                    {selectedParties.length > 1 && (
                          <Button variant="ghost" size="icon" onClick={() => removeParty(comparison.party)} className="size-8">
                        <X className="size-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-1 pt-6">
                      {comparison.state === ProposalState.SIN_INFORMACION ? (
                        <div className="flex h-full items-center justify-center py-12 text-center">
                          <div className="space-y-2">
                            <HelpCircle className="mx-auto size-8 text-muted-foreground" />
                            <div className="text-sm text-muted-foreground">
                              No se encontró información sobre este tema en el plan de gobierno de este partido.
                            </div>
                          </div>
                        </div>
                      ) : (
                    <div className="space-y-4">
                          {/* Answer/Summary */}
                      <div>
                            <h4 className="mb-2 text-sm font-semibold text-muted-foreground">Propuesta</h4>
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  h1: ({ children }) => <h3 className="text-base font-bold mt-4 mb-2">{children}</h3>,
                                  h2: ({ children }) => <h3 className="text-base font-bold mt-4 mb-2">{children}</h3>,
                                  h3: ({ children }) => <h4 className="text-sm font-semibold mt-3 mb-1">{children}</h4>,
                                  h4: ({ children }) => <h5 className="text-sm font-medium mt-2 mb-1">{children}</h5>,
                                  p: ({ children }) => <p className="text-sm leading-relaxed mb-2">{children}</p>,
                                  ul: ({ children }) => <ul className="list-disc list-inside text-sm space-y-1 mb-2">{children}</ul>,
                                  ol: ({ children }) => <ol className="list-decimal list-inside text-sm space-y-1 mb-2">{children}</ol>,
                                  li: ({ children }) => <li className="text-sm">{children}</li>,
                                  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                                }}
                              >
                                {comparison.answer}
                              </ReactMarkdown>
                            </div>
                      </div>

                          {/* Sources */}
                          {comparison.sources.length > 0 && (
                      <div className="rounded-lg border border-border bg-muted/30 p-4">
                        <div className="mb-3 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                          <FileText className="size-3.5" />
                                Referencias del Plan de Gobierno
                              </div>
                              <div className="space-y-3">
                                {comparison.sources.map((source, index) => (
                                  <div key={`${source.documentId || index}-${index}`} className="flex gap-3 p-2 rounded-md bg-background/50 border border-border/50">
                                    <div className="flex-shrink-0 flex flex-col items-center justify-center min-w-[50px] px-2 py-1 bg-primary/10 rounded text-center">
                                      <span className="text-[10px] text-muted-foreground uppercase">Pág.</span>
                                      <span className="text-sm font-semibold text-primary">
                                        {source.pageRange
                                          ? (source.pageRange.start === source.pageRange.end
                                              ? source.pageRange.start
                                              : `${source.pageRange.start}-${source.pageRange.end}`)
                                          : source.pageNumber || '—'}
                                      </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                        "{source.content}"
                                      </p>
                                    </div>
                                  </div>
                                ))}
                        </div>
                              {comparison.sources[0]?.documentId && (
                                <Button variant="outline" size="sm" className="mt-3 h-8 text-xs bg-transparent" asChild>
                                  <Link href={`/documents`} target="_blank" rel="noopener noreferrer">
                            Ver documento completo
                            <ExternalLink className="ml-2 size-3" />
                          </Link>
                        </Button>
                              )}
                      </div>
                          )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
            </>
            )
          }
          
          return (
            <div className="flex items-center justify-center py-12 text-center">
              <div className="space-y-2">
                <Search className="mx-auto size-8 text-muted-foreground" />
                <div className="text-sm text-muted-foreground">
                  Selecciona un tema y al menos un partido para comenzar la comparación
                </div>
              </div>
            </div>
          )
        })()}

        {/* Help Text */}
        <div className="mt-8 rounded-lg border border-border bg-muted/30 p-6">
          <h3 className="mb-2 font-semibold">¿Cómo usar la comparación?</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
              <span>Selecciona un tema de interés usando los botones o busca un tema personalizado</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
              <span>Añade hasta 5 partidos para comparar sus propuestas lado a lado</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
              <span>Los estados indican la calidad de la información: Completa, Parcial, Poco clara, o Sin información</span>
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
