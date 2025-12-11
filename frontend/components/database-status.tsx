"use client"

import { useEffect, useState } from "react"
import { Database, FileText, Package } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface Document {
  id: string
  document_id: string
  title: string
  party_id: string
  party_name: string
  page_count: number
  file_size_bytes: number
  created_at: string
}

interface ChunkStats {
  party_id: string
  party_name: string
  chunk_count: number
  has_embeddings: boolean
}

export function DatabaseStatus() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [chunkStats, setChunkStats] = useState<ChunkStats[]>([])
  const [loading, setLoading] = useState(true)
  const [totalChunks, setTotalChunks] = useState(0)

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch documents
      const docsRes = await fetch('http://localhost:3001/api/documents')
      const docsData = await docsRes.json()
      setDocuments(docsData.documents || [])

      // Fetch chunks for each document to build stats
      const stats: Record<string, ChunkStats> = {}
      let totalChunkCount = 0

      for (const doc of docsData.documents || []) {
        try {
          const chunksRes = await fetch(`http://localhost:3001/api/documents/${doc.id}/chunks?limit=1`)
          const chunksData = await chunksRes.json()

          const chunkCount = chunksData.pagination?.total || 0
          totalChunkCount += chunkCount

          if (!stats[doc.party_id]) {
            stats[doc.party_id] = {
              party_id: doc.party_id,
              party_name: doc.party_name,
              chunk_count: 0,
              has_embeddings: false
            }
          }

          stats[doc.party_id].chunk_count += chunkCount

          // Check if has embeddings (if there's at least one chunk, assume it has embeddings)
          if (chunkCount > 0 && chunksData.chunks?.[0]?.embedding) {
            stats[doc.party_id].has_embeddings = true
          }
        } catch (error) {
          console.error(`Error fetching chunks for ${doc.id}:`, error)
        }
      }

      setChunkStats(Object.values(stats).sort((a, b) => b.chunk_count - a.chunk_count))
      setTotalChunks(totalChunkCount)
    } catch (error) {
      console.error('Error fetching database status:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Cargando estado de la base de datos...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Documentos</CardTitle>
            <FileText className="size-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documents.length}</div>
            <p className="text-xs text-muted-foreground">Partidos políticos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Chunks</CardTitle>
            <Package className="size-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalChunks.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Fragmentos indexados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Partidos con Data</CardTitle>
            <Database className="size-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {chunkStats.filter(s => s.chunk_count > 0).length}/{documents.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalChunks === 0 ? 'Sin datos ingestados' : 'Con chunks ingestados'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chunks by Party Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Estado de Ingesta por Partido</CardTitle>
              <CardDescription>Chunks y embeddings por partido político</CardDescription>
            </div>
            <Button onClick={fetchData} variant="outline" size="sm">
              Actualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Partido</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead className="text-right">Chunks</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {chunkStats.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No hay datos ingestados. Ejecuta la ingesta primero.
                  </TableCell>
                </TableRow>
              ) : (
                chunkStats.map((stat) => (
                  <TableRow key={stat.party_id}>
                    <TableCell className="font-medium">{stat.party_id}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{stat.party_name}</TableCell>
                    <TableCell className="text-right font-mono">{stat.chunk_count.toLocaleString()}</TableCell>
                    <TableCell>
                      {stat.chunk_count > 0 ? (
                        <Badge variant="secondary" className="bg-teal-500/10 text-teal-700 dark:text-teal-400">
                          ✓ Ingestado
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-slate-500/10 text-slate-700 dark:text-slate-400">
                          Pendiente
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Documentos en Base de Datos</CardTitle>
          <CardDescription>Metadata de documentos (no indica si tienen chunks)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Partido</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead className="text-right">Páginas</TableHead>
                  <TableHead className="text-right">Tamaño</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.party_id}</TableCell>
                    <TableCell className="text-sm">{doc.title}</TableCell>
                    <TableCell className="text-right">{doc.page_count || '-'}</TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {doc.file_size_bytes ? `${(doc.file_size_bytes / 1024 / 1024).toFixed(1)} MB` : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {totalChunks === 0 && (
        <Card className="border-amber-500/50 bg-amber-500/10">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Database className="size-5 text-amber-500 mt-0.5" />
              <div>
                <p className="font-medium text-amber-700 dark:text-amber-400">
                  Base de datos vacía
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  No hay chunks ingestados. Ejecuta el script de ingesta para procesar los documentos:
                </p>
                <code className="block mt-2 bg-background/50 px-3 py-2 rounded text-xs">
                  pnpm tsx src/scripts/ingestTop5.ts
                </code>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
