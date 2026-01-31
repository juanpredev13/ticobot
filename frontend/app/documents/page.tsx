"use client"

import { useState, useMemo } from "react"
import { Search, Grid3X3, List, Download, FileText, Filter, X, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { useDocuments } from "@/lib/hooks"

type Document = {
  id: string
  title: string
  party: string
  candidate?: string
  pages: number
  fileSize: string
  date: string
  year: number
  status: "indexed" | "pending" | "failed"
  category: string
  url: string
  aiUsagePercentage: number
}



const PARTIES = [
  "Partido Liberación Nacional",
  "Partido Acción Ciudadana",
  "Frente Amplio",
  "Restauración Nacional",
  "Partido Unidad Social Cristiana",
  "Liberal Progresista",
  "Nueva República",
  "Partido Integración Nacional",
]

export default function DocumentsPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedParties, setSelectedParties] = useState<string[]>([])
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [showFilters, setShowFilters] = useState(false)

  // Fetch documents from API
  const { data, isLoading, isError, error, refetch } = useDocuments()

  const handlePartyToggle = (party: string) => {
    setSelectedParties((prev) => (prev.includes(party) ? prev.filter((p) => p !== party) : [...prev, party]))
  }

  const clearFilters = () => {
    setSelectedParties([])
    setSelectedStatus("all")
    setSearchQuery("")
  }

  // Get unique parties from documents
  const uniqueParties = useMemo(() => {
    if (!data?.documents) return []
    const parties = new Set(data.documents.map((doc) => doc.party))
    return Array.from(parties).sort()
  }, [data])

  // Map API documents to component format and apply filters
  const filteredDocuments = useMemo(() => {
    if (!data?.documents) return []

    return data.documents
      .map((doc) => ({
        id: doc.id,
        title: doc.title,
        party: doc.party,
        candidate: undefined, // Not in API response
        pages: 0, // Not in API response
        fileSize: '0 MB', // Not in API response
        date: doc.downloadedAt || doc.processedAt || new Date().toISOString(),
        year: 2026,
        status: (doc.processedAt ? 'indexed' : 'pending') as Document['status'],
        category: 'Plan de Gobierno',
        url: doc.url,
        aiUsagePercentage: doc.processedAt ? 100 : 0,
      }))
      .filter((doc) => {
        const matchesSearch =
          searchQuery === '' ||
          doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.party.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesParty = selectedParties.length === 0 || selectedParties.includes(doc.party)
        const matchesStatus = selectedStatus === 'all' || doc.status === selectedStatus

        return matchesSearch && matchesParty && matchesStatus
      })
  }, [data, searchQuery, selectedParties, selectedStatus])

  const getStatusBadge = (status: Document["status"]) => {
    switch (status) {
      case "indexed":
        return (
          <Badge variant="secondary" className="bg-teal-500/10 text-teal-700 dark:text-teal-400">
            Indexado
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="secondary" className="bg-amber-500/10 text-amber-700 dark:text-amber-400">
            Pendiente
          </Badge>
        )
      case "failed":
        return (
          <Badge variant="destructive" className="bg-red-500/10 text-red-700 dark:text-red-400">
            Fallido
          </Badge>
        )
    }
  }

  const getAIUsageBadge = (percentage: number) => {
    const getColor = () => {
      if (percentage === 100) return "bg-teal-500/10 text-teal-700 dark:text-teal-400"
      if (percentage >= 50) return "bg-blue-500/10 text-blue-700 dark:text-blue-400"
      if (percentage > 0) return "bg-amber-500/10 text-amber-700 dark:text-amber-400"
      return "bg-slate-500/10 text-slate-700 dark:text-slate-400"
    }

    return (
      <Badge variant="secondary" className={getColor()}>
        IA: {percentage}%
      </Badge>
    )
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-bold">Explorador de documentos</h1>
            <p className="text-muted-foreground">Navega y descarga los documentos oficiales de los partidos políticos</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="flex flex-col">
                <CardHeader>
                  <Skeleton className="mb-3 size-12 rounded-lg" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Show error state
  if (isError) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Card className="border-destructive">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <AlertCircle className="mb-4 size-12 text-destructive" />
              <h3 className="mb-2 text-lg font-semibold">Error al cargar documentos</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                {error instanceof Error ? error.message : 'Ocurrió un error al cargar los documentos'}
              </p>
              <Button onClick={() => refetch()}>Reintentar</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const totalDocuments = data?.documents.length || 0
  const indexedCount = filteredDocuments.filter((d) => d.status === 'indexed').length

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">Explorador de documentos</h1>
          <p className="text-muted-foreground">Navega y descarga los documentos oficiales de los partidos políticos</p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="py-4">
            <CardContent>
              <div className="text-2xl font-bold">{totalDocuments}</div>
              <div className="text-sm text-muted-foreground">Total documentos</div>
            </CardContent>
          </Card>
          <Card className="py-4">
            <CardContent>
              <div className="text-2xl font-bold">{indexedCount}</div>
              <div className="text-sm text-muted-foreground">Indexados</div>
            </CardContent>
          </Card>
          <Card className="py-4">
            <CardContent>
              <div className="text-2xl font-bold">{uniqueParties.length}</div>
              <div className="text-sm text-muted-foreground">Partidos</div>
            </CardContent>
          </Card>
          <Card className="py-4">
            <CardContent>
              <div className="text-2xl font-bold">{data?.pagination.total || 0}</div>
              <div className="text-sm text-muted-foreground">Total en sistema</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and View Controls */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 gap-2">
            <div className="relative flex-1 sm:max-w-md">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar documentos o partidos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="gap-2">
              <Filter className="size-4" />
              Filtros
              {(selectedParties.length > 0 || selectedStatus !== "all") && (
                <Badge variant="secondary" className="ml-1 size-5 rounded-full p-0">
                  {selectedParties.length + (selectedStatus !== "all" ? 1 : 0)}
                </Badge>
              )}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="indexed">Indexados</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="failed">Fallidos</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex rounded-lg border border-border">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon-sm"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="size-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon-sm"
                onClick={() => setViewMode("list")}
              >
                <List className="size-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Filtros</CardTitle>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Limpiar
                  </Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => setShowFilters(false)}>
                    <X className="size-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="mb-3 text-sm font-medium">Partidos políticos</h4>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {uniqueParties.map((party) => (
                      <div key={party} className="flex items-center gap-2">
                        <Checkbox
                          id={party}
                          checked={selectedParties.includes(party)}
                          onCheckedChange={() => handlePartyToggle(party)}
                        />
                        <label
                          htmlFor={party}
                          className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {party}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Count */}
        <div className="mb-4 text-sm text-muted-foreground">
          Mostrando {filteredDocuments.length} de {totalDocuments} documentos
        </div>

        {/* Documents Grid/List */}
        {viewMode === "grid" ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredDocuments.map((doc) => (
              <Card key={doc.id} className="flex flex-col">
                <CardHeader>
                  <div className="mb-3 flex size-12 items-center justify-center rounded-lg bg-muted">
                    <FileText className="size-6 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-base">{doc.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {doc.party}
                    {doc.candidate && ` • ${doc.candidate}`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Páginas:</span>
                      <span className="font-medium">{doc.pages}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tamaño:</span>
                      <span className="font-medium">{doc.fileSize}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fecha:</span>
                      <span className="font-medium">
                        {new Date(doc.date).toLocaleDateString("es-CR", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {getStatusBadge(doc.status)}
                    {getAIUsageBadge(doc.aiUsagePercentage)}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" size="sm" className="w-full bg-transparent" asChild>
                    <a href={doc.url} target="_blank" rel="noopener noreferrer">
                      <Download className="size-4" />
                      Descargar PDF
                    </a>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDocuments.map((doc) => (
              <Card key={doc.id}>
                <CardContent className="flex items-center justify-between p-6">
                  <div className="flex flex-1 items-center gap-4">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <FileText className="size-6 text-muted-foreground" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <h3 className="font-semibold">{doc.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {doc.party}
                        {doc.candidate && ` • ${doc.candidate}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="hidden text-sm sm:block">
                      <span className="text-muted-foreground">Páginas: </span>
                      <span className="font-medium">{doc.pages}</span>
                    </div>
                    <div className="hidden text-sm md:block">
                      <span className="text-muted-foreground">Tamaño: </span>
                      <span className="font-medium">{doc.fileSize}</span>
                    </div>
                    <div className="hidden text-sm lg:block">
                      {new Date(doc.date).toLocaleDateString("es-CR", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(doc.status)}
                      {getAIUsageBadge(doc.aiUsagePercentage)}
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href={doc.url} target="_blank" rel="noopener noreferrer">
                        <Download className="size-4" />
                        Descargar
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {filteredDocuments.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="mb-4 size-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">No se encontraron documentos</h3>
              <p className="mb-4 text-sm text-muted-foreground">Intenta ajustar tus filtros o búsqueda</p>
              <Button variant="outline" onClick={clearFilters}>
                Limpiar filtros
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
