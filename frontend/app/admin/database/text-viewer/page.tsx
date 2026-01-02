'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Hash,
} from 'lucide-react';

interface Document {
  id: string;
  title: string;
  party_id: string;
  partyName: string;
  partyAbbreviation: string;
  page_count: number;
  created_at: string;
}

interface Chunk {
  id: string;
  content: string;
  chunk_index: number;
  party_id: string;
  party_name: string;
  length: number;
  hasEmbedding: boolean;
  hasEncodingIssues: boolean;
  hasExcessiveWhitespace: boolean;
  whitespaceRatio: number;
}

interface ChunksResponse {
  chunks: Chunk[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

async function fetchDocuments(): Promise<Document[]> {
  const response = await api.get<{ success: boolean; data: Document[] }>('/api/text-viewer/documents');
  return response.data;
}

async function fetchChunks(documentId: string, page: number): Promise<ChunksResponse> {
  const response = await api.get<{ success: boolean; data: ChunksResponse }>(
    `/api/text-viewer/documents/${documentId}/chunks?page=${page}&limit=20`
  );
  return response.data;
}

async function fetchFullText(documentId: string): Promise<{ fullText: string; chunkCount: number; totalLength: number }> {
  const response = await api.get<{ success: boolean; data: { fullText: string; chunkCount: number; totalLength: number } }>(
    `/api/text-viewer/documents/${documentId}/full-text`
  );
  return response.data;
}

export default function TextViewerPage() {
  const [selectedDocument, setSelectedDocument] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'chunks' | 'full'>('chunks');

  const { data: documents, isLoading: documentsLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: fetchDocuments,
  });

  const { data: chunksData, isLoading: chunksLoading, error: chunksError } = useQuery({
    queryKey: ['chunks', selectedDocument, currentPage],
    queryFn: () => {
      console.log('Fetching chunks for document:', selectedDocument, 'page:', currentPage);
      return fetchChunks(selectedDocument, currentPage);
    },
    enabled: !!selectedDocument && viewMode === 'chunks',
    retry: 1,
  });

  const { data: fullTextData, isLoading: fullTextLoading } = useQuery({
    queryKey: ['full-text', selectedDocument],
    queryFn: () => fetchFullText(selectedDocument),
    enabled: !!selectedDocument && viewMode === 'full',
  });

  const selectedDoc = documents?.find(d => d.id === selectedDocument);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Visor de Texto Extraído</h1>
        <p className="text-muted-foreground">
          Inspecciona el contenido extraído de los PDFs para verificar la calidad antes del reingest
        </p>
      </div>

      {/* Document Selector */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Seleccionar Documento</CardTitle>
          <CardDescription>Elige un documento para inspeccionar su contenido extraído</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Documento</label>
              <Select value={selectedDocument} onValueChange={setSelectedDocument}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un documento..." />
                </SelectTrigger>
                <SelectContent>
                  {documents?.map((doc) => (
                    <SelectItem key={doc.id} value={doc.id}>
                      [{doc.partyAbbreviation}] {doc.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Modo de Vista</label>
              <Select value={viewMode} onValueChange={(v) => setViewMode(v as 'chunks' | 'full')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="chunks">Por Chunks</SelectItem>
                  <SelectItem value="full">Texto Completo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedDoc && (
            <div className="flex flex-wrap gap-2 rounded-lg border bg-muted/50 p-4">
              <Badge variant="secondary">
                <FileText className="mr-1 size-3" />
                {selectedDoc.page_count} páginas
              </Badge>
              <Badge variant="secondary">
                {selectedDoc.partyAbbreviation}
              </Badge>
              {viewMode === 'chunks' && chunksData && (
                <Badge variant="secondary">
                  <Hash className="mr-1 size-3" />
                  {chunksData.pagination.total} chunks
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chunks View */}
      {viewMode === 'chunks' && selectedDocument && (
        <Card>
          <CardHeader>
            <CardTitle>Chunks del Documento</CardTitle>
            <CardDescription>
              Revisión de chunks individuales con indicadores de calidad
            </CardDescription>
          </CardHeader>
          <CardContent>
            {chunksError ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <AlertTriangle className="mx-auto mb-2 size-8 text-red-500" />
                  <div className="mb-2 text-lg font-medium">Error al cargar chunks</div>
                  <p className="text-sm text-muted-foreground">
                    {chunksError instanceof Error ? chunksError.message : 'Error desconocido'}
                  </p>
                  <pre className="mt-2 text-xs text-muted-foreground">
                    {JSON.stringify(chunksError, null, 2)}
                  </pre>
                </div>
              </div>
            ) : chunksLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="mb-2 text-lg font-medium">Cargando chunks...</div>
                  <p className="text-sm text-muted-foreground">Esto puede tomar unos segundos</p>
                </div>
              </div>
            ) : chunksData && chunksData.chunks.length > 0 ? (
              <>
                <div className="space-y-4">
                  {chunksData.chunks.map((chunk) => (
                    <div
                      key={chunk.id}
                      className={`rounded-lg border p-4 ${
                        chunk.hasEncodingIssues || chunk.hasExcessiveWhitespace
                          ? 'border-amber-500/50 bg-amber-500/5'
                          : 'border-border'
                      }`}
                    >
                      <div className="mb-2 flex items-start justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="font-mono text-xs">
                            #{chunk.chunk_index}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {chunk.length} caracteres
                          </span>
                          {chunk.hasEmbedding && (
                            <span title="Tiene embedding">
                              <CheckCircle2 className="size-4 text-teal-500" />
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {chunk.hasEncodingIssues && (
                            <Badge variant="destructive" className="text-xs">
                              <AlertTriangle className="mr-1 size-3" />
                              Encoding
                            </Badge>
                          )}
                          {chunk.hasExcessiveWhitespace && (
                            <Badge className="bg-amber-500/10 text-amber-700 text-xs">
                              Whitespace {chunk.whitespaceRatio}%
                            </Badge>
                          )}
                          {chunk.length < 50 && (
                            <Badge className="bg-orange-500/10 text-orange-700 text-xs">
                              Muy corto
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="rounded bg-muted/50 p-3 font-mono text-xs">
                        <pre className="whitespace-pre-wrap break-words">{chunk.content}</pre>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Página {chunksData.pagination.page} de {chunksData.pagination.totalPages}
                    ({chunksData.pagination.total} chunks totales)
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="size-4" />
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => p + 1)}
                      disabled={currentPage >= chunksData.pagination.totalPages}
                    >
                      Siguiente
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                No hay chunks disponibles para este documento
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Full Text View */}
      {viewMode === 'full' && selectedDocument && (
        <Card>
          <CardHeader>
            <CardTitle>Texto Completo</CardTitle>
            <CardDescription>
              Visualización del texto completo extraído del documento
            </CardDescription>
          </CardHeader>
          <CardContent>
            {fullTextLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="mb-2 text-lg font-medium">Cargando texto completo...</div>
                  <p className="text-sm text-muted-foreground">Esto puede tomar unos segundos</p>
                </div>
              </div>
            ) : fullTextData ? (
              <>
                <div className="mb-4 flex gap-2">
                  <Badge variant="secondary">
                    {fullTextData.chunkCount} chunks
                  </Badge>
                  <Badge variant="secondary">
                    {fullTextData.totalLength.toLocaleString()} caracteres
                  </Badge>
                  <Badge variant="secondary">
                    {Math.round(fullTextData.totalLength / 1024)} KB
                  </Badge>
                </div>
                <div className="max-h-[600px] overflow-y-auto rounded-lg border bg-muted/50 p-4 font-mono text-xs">
                  <pre className="whitespace-pre-wrap break-words">{fullTextData.fullText}</pre>
                </div>
              </>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                No hay texto disponible para este documento
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* No document selected */}
      {!selectedDocument && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Eye className="mb-4 size-12 text-muted-foreground/50" />
            <p className="text-lg font-medium">Selecciona un documento para comenzar</p>
            <p className="text-sm text-muted-foreground">
              Elige un documento arriba para inspeccionar su contenido extraído
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
