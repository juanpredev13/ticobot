"use client"

import { useState } from "react"
import {
  Activity,
  Cpu,
  HardDrive,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Upload,
  RefreshCw,
  Eye,
  EyeOff,
  Settings,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { SiteHeader } from "@/components/site-header" // Import global SiteHeader
import { DatabaseStatus } from "@/components/database-status"

type SystemStatus = "healthy" | "warning" | "critical"
type IngestionStatus = "processing" | "completed" | "failed"
type LogSeverity = "info" | "warning" | "error" | "critical"

const MOCK_SYSTEM_HEALTH = {
  apiStatus: "healthy" as SystemStatus,
  cpuUsage: 45,
  memoryUsage: 62,
  storageUsage: 38,
  uptime: "7d 14h 32m",
  lastCheck: new Date(),
}

const MOCK_INGESTION_JOBS = [
  {
    id: "1",
    document: "Plan de Gobierno 2024-2028 - PLN",
    status: "completed" as IngestionStatus,
    progress: 100,
    startTime: "2025-01-15 14:23:10",
    duration: "2m 45s",
    pagesProcessed: 156,
  },
  {
    id: "2",
    document: "Propuesta Electoral 2024 - PAC",
    status: "processing" as IngestionStatus,
    progress: 67,
    startTime: "2025-01-15 15:10:00",
    duration: "1m 20s",
    pagesProcessed: 59,
  },
  {
    id: "3",
    document: "Agenda Legislativa 2024 - Nueva República",
    status: "failed" as IngestionStatus,
    progress: 23,
    startTime: "2025-01-15 14:50:30",
    duration: "45s",
    pagesProcessed: 18,
  },
]

const MOCK_ERROR_LOGS = [
  {
    id: "1",
    timestamp: "2025-01-15 15:12:45",
    severity: "error" as LogSeverity,
    message: "Failed to extract text from page 45 in document Nueva_Republica_2024.pdf",
    component: "PDF Parser",
  },
  {
    id: "2",
    timestamp: "2025-01-15 14:58:20",
    severity: "warning" as LogSeverity,
    message: "Vector DB connection timeout - retrying (attempt 2/3)",
    component: "Vector Store",
  },
  {
    id: "3",
    timestamp: "2025-01-15 14:45:10",
    severity: "critical" as LogSeverity,
    message: "LLM API rate limit exceeded - requests queued",
    component: "AI Provider",
  },
  {
    id: "4",
    timestamp: "2025-01-15 14:30:05",
    severity: "info" as LogSeverity,
    message: "Successfully indexed 156 pages from PLN document",
    component: "Ingestion Service",
  },
]

const MOCK_USAGE_STATS = {
  totalQueries: 1247,
  queriesLastHour: 34,
  totalTokensUsed: 2456789,
  estimatedCost: 24.57,
  avgResponseTime: "2.3s",
  successRate: 98.5,
}

const MOCK_ALERTS = [
  {
    id: "1",
    type: "critical" as LogSeverity,
    message: "Vector database approaching storage limit (85% used)",
    timestamp: "2025-01-15 15:00:00",
  },
  {
    id: "2",
    type: "warning" as LogSeverity,
    message: "High API usage detected - approaching monthly quota",
    timestamp: "2025-01-15 14:30:00",
  },
]

export default function AdminPage() {
  const [pdfUrl, setPdfUrl] = useState("")
  const [batchUrls, setBatchUrls] = useState("")
  const [llmProvider, setLlmProvider] = useState("openai")
  const [vectorProvider, setVectorProvider] = useState("pinecone")
  const [showApiKeys, setShowApiKeys] = useState(false)
  const [openaiKey, setOpenaiKey] = useState("sk-proj-xxx...xxx")
  const [pineconeKey, setPineconeKey] = useState("pc-xxx...xxx")
  const [isProcessing, setIsProcessing] = useState(false)

  const handleTriggerIngestion = () => {
    setIsProcessing(true)
    setTimeout(() => setIsProcessing(false), 2000)
  }

  const handleBatchIngestion = () => {
    setIsProcessing(true)
    setTimeout(() => setIsProcessing(false), 3000)
  }

  const getStatusIcon = (status: SystemStatus) => {
    switch (status) {
      case "healthy":
        return <CheckCircle2 className="size-5 text-teal-500" />
      case "warning":
        return <AlertTriangle className="size-5 text-amber-500" />
      case "critical":
        return <XCircle className="size-5 text-red-500" />
    }
  }

  const getIngestionBadge = (status: IngestionStatus) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="secondary" className="bg-teal-500/10 text-teal-700 dark:text-teal-400">
            Completado
          </Badge>
        )
      case "processing":
        return (
          <Badge variant="secondary" className="bg-blue-500/10 text-blue-700 dark:text-blue-400">
            Procesando
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

  const getSeverityBadge = (severity: LogSeverity) => {
    switch (severity) {
      case "info":
        return (
          <Badge variant="secondary" className="bg-slate-500/10 text-slate-700 dark:text-slate-400">
            Info
          </Badge>
        )
      case "warning":
        return (
          <Badge variant="secondary" className="bg-amber-500/10 text-amber-700 dark:text-amber-400">
            Warning
          </Badge>
        )
      case "error":
        return (
          <Badge variant="destructive" className="bg-orange-500/10 text-orange-700 dark:text-orange-400">
            Error
          </Badge>
        )
      case "critical":
        return (
          <Badge variant="destructive" className="bg-red-500/10 text-red-700 dark:text-red-400">
            Critical
          </Badge>
        )
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <SiteHeader /> {/* Using global SiteHeader */}
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">Panel de administración</h1>
          <p className="text-muted-foreground">Monitoreo del sistema, gestión de documentos y configuración</p>
        </div>

        {/* System Alerts */}
        {MOCK_ALERTS.length > 0 && (
          <div className="mb-6 space-y-3">
            {MOCK_ALERTS.map((alert) => (
              <div
                key={alert.id}
                className={`flex items-center gap-3 rounded-lg border p-4 ${
                  alert.type === "critical" ? "border-red-500/50 bg-red-500/10" : "border-amber-500/50 bg-amber-500/10"
                }`}
              >
                <AlertTriangle
                  className={`size-5 shrink-0 ${alert.type === "critical" ? "text-red-500" : "text-amber-500"}`}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">{alert.message}</p>
                  <p className="text-xs text-muted-foreground">{alert.timestamp}</p>
                </div>
                {getSeverityBadge(alert.type)}
              </div>
            ))}
          </div>
        )}

        {/* Database Status - Real Data */}
        <div className="mb-8">
          <h2 className="mb-4 text-xl font-semibold">Estado de la Base de Datos</h2>
          <DatabaseStatus />
        </div>

        {/* System Health Metrics */}
        <div className="mb-8">
          <h2 className="mb-4 text-xl font-semibold">Estado del sistema</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">API Status</CardTitle>
                {getStatusIcon(MOCK_SYSTEM_HEALTH.apiStatus)}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Online</div>
                <p className="text-xs text-muted-foreground">Uptime: {MOCK_SYSTEM_HEALTH.uptime}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
                <Cpu className="size-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{MOCK_SYSTEM_HEALTH.cpuUsage}%</div>
                <Progress value={MOCK_SYSTEM_HEALTH.cpuUsage} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Memory</CardTitle>
                <Activity className="size-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{MOCK_SYSTEM_HEALTH.memoryUsage}%</div>
                <Progress value={MOCK_SYSTEM_HEALTH.memoryUsage} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Storage</CardTitle>
                <HardDrive className="size-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{MOCK_SYSTEM_HEALTH.storageUsage}%</div>
                <Progress value={MOCK_SYSTEM_HEALTH.storageUsage} className="mt-2" />
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left Column */}
          <div className="space-y-8">
            {/* Ingestion Status */}
            <div>
              <h2 className="mb-4 text-xl font-semibold">Estado de ingesta</h2>
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {MOCK_INGESTION_JOBS.map((job) => (
                      <div key={job.id} className="space-y-2">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium">{job.document}</p>
                              {getIngestionBadge(job.status)}
                            </div>
                            <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="size-3" />
                                {job.startTime}
                              </span>
                              <span>{job.duration}</span>
                              <span>{job.pagesProcessed} páginas</span>
                            </div>
                          </div>
                        </div>
                        {job.status === "processing" && (
                          <div className="space-y-1">
                            <Progress value={job.progress} />
                            <p className="text-xs text-muted-foreground">{job.progress}% completado</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Usage Statistics */}
            <div>
              <h2 className="mb-4 text-xl font-semibold">Estadísticas de uso</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Consultas totales</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{MOCK_USAGE_STATS.totalQueries.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">+{MOCK_USAGE_STATS.queriesLastHour} última hora</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Tokens usados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{(MOCK_USAGE_STATS.totalTokensUsed / 1000000).toFixed(2)}M</div>
                    <p className="text-xs text-muted-foreground">${MOCK_USAGE_STATS.estimatedCost} costo estimado</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Tiempo respuesta</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{MOCK_USAGE_STATS.avgResponseTime}</div>
                    <p className="text-xs text-muted-foreground">Promedio</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Tasa de éxito</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{MOCK_USAGE_STATS.successRate}%</div>
                    <p className="text-xs text-muted-foreground">Consultas exitosas</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Manual Re-ingestion Panel */}
            <div>
              <h2 className="mb-4 text-xl font-semibold">Re-ingesta manual</h2>
              <Card>
                <CardHeader>
                  <CardTitle>Procesar documento</CardTitle>
                  <CardDescription>Ingresa la URL de un PDF para procesarlo e indexarlo</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="pdf-url">URL del PDF</Label>
                    <Input
                      id="pdf-url"
                      placeholder="https://ejemplo.com/documento.pdf"
                      value={pdfUrl}
                      onChange={(e) => setPdfUrl(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleTriggerIngestion} disabled={!pdfUrl || isProcessing} className="w-full">
                    {isProcessing ? (
                      <>
                        <RefreshCw className="animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        <Upload />
                        Iniciar ingesta
                      </>
                    )}
                  </Button>

                  <div className="border-t pt-4">
                    <Label htmlFor="batch-urls">Ingesta por lotes (una URL por línea)</Label>
                    <Textarea
                      id="batch-urls"
                      placeholder="https://ejemplo.com/doc1.pdf&#10;https://ejemplo.com/doc2.pdf&#10;https://ejemplo.com/doc3.pdf"
                      value={batchUrls}
                      onChange={(e) => setBatchUrls(e.target.value)}
                      rows={4}
                      className="mt-2"
                    />
                    <Button
                      onClick={handleBatchIngestion}
                      disabled={!batchUrls || isProcessing}
                      variant="outline"
                      className="mt-2 w-full bg-transparent"
                    >
                      <Upload />
                      Ingesta por lotes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Provider Configuration */}
            <div>
              <h2 className="mb-4 text-xl font-semibold">Configuración de proveedores</h2>
              <Card>
                <CardHeader>
                  <CardTitle>Proveedores de IA</CardTitle>
                  <CardDescription>Configura los servicios de LLM y base de datos vectorial</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* LLM Provider */}
                  <div className="space-y-2">
                    <Label htmlFor="llm-provider">Proveedor LLM</Label>
                    <Select value={llmProvider} onValueChange={setLlmProvider}>
                      <SelectTrigger id="llm-provider">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="openai">OpenAI (GPT-4)</SelectItem>
                        <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                        <SelectItem value="google">Google (Gemini)</SelectItem>
                        <SelectItem value="xai">xAI (Grok)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Vector DB Provider */}
                  <div className="space-y-2">
                    <Label htmlFor="vector-provider">Base de datos vectorial</Label>
                    <Select value={vectorProvider} onValueChange={setVectorProvider}>
                      <SelectTrigger id="vector-provider">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pinecone">Pinecone</SelectItem>
                        <SelectItem value="weaviate">Weaviate</SelectItem>
                        <SelectItem value="qdrant">Qdrant</SelectItem>
                        <SelectItem value="milvus">Milvus</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* API Keys Management */}
                  <div className="border-t pt-4">
                    <div className="mb-3 flex items-center justify-between">
                      <Label>API Keys</Label>
                      <Button variant="ghost" size="sm" onClick={() => setShowApiKeys(!showApiKeys)}>
                        {showApiKeys ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        {showApiKeys ? "Ocultar" : "Mostrar"}
                      </Button>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="openai-key" className="text-xs text-muted-foreground">
                          OpenAI API Key
                        </Label>
                        <Input
                          id="openai-key"
                          type={showApiKeys ? "text" : "password"}
                          value={openaiKey}
                          onChange={(e) => setOpenaiKey(e.target.value)}
                          className="font-mono text-xs"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="pinecone-key" className="text-xs text-muted-foreground">
                          Pinecone API Key
                        </Label>
                        <Input
                          id="pinecone-key"
                          type={showApiKeys ? "text" : "password"}
                          value={pineconeKey}
                          onChange={(e) => setPineconeKey(e.target.value)}
                          className="font-mono text-xs"
                        />
                      </div>
                    </div>

                    <Button variant="outline" className="mt-4 w-full bg-transparent">
                      <Settings />
                      Guardar configuración
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Error Logs */}
            <div>
              <h2 className="mb-4 text-xl font-semibold">Registro de errores</h2>
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Severidad</TableHead>
                        <TableHead>Mensaje</TableHead>
                        <TableHead>Componente</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {MOCK_ERROR_LOGS.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-xs text-muted-foreground">{log.timestamp}</TableCell>
                          <TableCell>{getSeverityBadge(log.severity)}</TableCell>
                          <TableCell className="text-sm">{log.message}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{log.component}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
