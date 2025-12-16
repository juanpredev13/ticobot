# Análisis de Datos del Admin Dashboard

## 📊 Resumen

Este documento analiza qué datos en el admin dashboard son **reales** (vienen de la API/base de datos) y cuáles son **mock** (datos de ejemplo).

## ✅ Datos REALES

### 1. DatabaseStatus Component
**Ubicación**: `frontend/components/database-status.tsx`

**Datos reales obtenidos de la API**:
- ✅ **Total Documentos**: De `/api/documents`
- ✅ **Total Chunks**: Suma de chunks de todos los documentos
- ✅ **Partidos con Data**: Conteo de partidos que tienen chunks
- ✅ **Estado de Ingesta por Partido**: Tabla con chunks por partido
- ✅ **Documentos en Base de Datos**: Lista completa de documentos con metadata

**Endpoints utilizados**:
- `GET /api/documents` - Lista de documentos
- `GET /api/documents/:id/chunks?limit=1` - Chunks por documento (para contar)

**Estado**: ✅ **FUNCIONAL** - Usa datos reales de la base de datos

---

## ❌ Datos MOCK (No implementados)

### 1. System Health Metrics
**Ubicación**: `frontend/app/admin/page.tsx` (líneas 33-40)

**Datos mock**:
```typescript
const MOCK_SYSTEM_HEALTH = {
  apiStatus: "healthy",
  cpuUsage: 45,
  memoryUsage: 62,
  storageUsage: 38,
  uptime: "7d 14h 32m",
  lastCheck: new Date(),
}
```

**Lo que debería ser**:
- API Status: De `/health` endpoint (✅ existe)
- CPU Usage: No implementado (requiere métricas del servidor)
- Memory Usage: No implementado (requiere métricas del servidor)
- Storage Usage: No implementado (requiere métricas del servidor)
- Uptime: No implementado (requiere métricas del servidor)

**Endpoint necesario**: `GET /api/admin/health` (❌ no existe)

---

### 2. Ingestion Jobs Status
**Ubicación**: `frontend/app/admin/page.tsx` (líneas 42-70)

**Datos mock**:
```typescript
const MOCK_INGESTION_JOBS = [
  {
    id: "1",
    document: "Plan de Gobierno 2024-2028 - PLN",
    status: "completed",
    progress: 100,
    startTime: "2025-01-15 14:23:10",
    duration: "2m 45s",
    pagesProcessed: 156,
  },
  // ...
]
```

**Lo que debería ser**:
- Estado de trabajos de ingesta en tiempo real
- Progreso de ingesta actual
- Historial de ingestas

**Endpoint necesario**: `GET /api/admin/ingestion` (❌ no existe)

**Nota**: Existe `POST /api/ingest` para iniciar ingesta, pero no hay endpoint para consultar estado.

---

### 3. Error Logs
**Ubicación**: `frontend/app/admin/page.tsx` (líneas 72-101)

**Datos mock**:
```typescript
const MOCK_ERROR_LOGS = [
  {
    id: "1",
    timestamp: "2025-01-15 15:12:45",
    severity: "error",
    message: "Failed to extract text from page 45...",
    component: "PDF Parser",
  },
  // ...
]
```

**Lo que debería ser**:
- Logs reales del sistema
- Errores de ingesta
- Warnings y errores de la API

**Endpoint necesario**: `GET /api/admin/logs` (❌ no existe)

---

### 4. Usage Statistics
**Ubicación**: `frontend/app/admin/page.tsx` (líneas 103-110)

**Datos mock**:
```typescript
const MOCK_USAGE_STATS = {
  totalQueries: 1247,
  queriesLastHour: 34,
  totalTokensUsed: 2456789,
  estimatedCost: 24.57,
  avgResponseTime: "2.3s",
  successRate: 98.5,
}
```

**Lo que debería ser**:
- Total de consultas realizadas
- Consultas por hora
- Tokens usados (de LLM)
- Costo estimado
- Tiempo promedio de respuesta
- Tasa de éxito

**Endpoint necesario**: `GET /api/admin/stats` (❌ no existe)

**Nota**: Esto requeriría tracking de consultas y métricas de uso.

---

### 5. System Alerts
**Ubicación**: `frontend/app/admin/page.tsx` (líneas 112-125)

**Datos mock**:
```typescript
const MOCK_ALERTS = [
  {
    id: "1",
    type: "critical",
    message: "Vector database approaching storage limit (85% used)",
    timestamp: "2025-01-15 15:00:00",
  },
  // ...
]
```

**Lo que debería ser**:
- Alertas críticas del sistema
- Warnings de recursos
- Notificaciones de errores

**Endpoint necesario**: `GET /api/admin/alerts` (❌ no existe)

---

## 🔧 Endpoints Existentes vs Necesarios

### ✅ Endpoints Existentes
- `GET /health` - Health check básico
- `GET /api/documents` - Lista de documentos
- `GET /api/documents/:id/chunks` - Chunks de un documento
- `POST /api/ingest` - Iniciar ingesta
- `POST /api/ingest/bulk` - Ingesta por lotes

### ❌ Endpoints Faltantes para Admin
- `GET /api/admin/health` - Health detallado con métricas
- `GET /api/admin/ingestion` - Estado de trabajos de ingesta
- `GET /api/admin/logs` - Logs del sistema
- `GET /api/admin/stats` - Estadísticas de uso
- `GET /api/admin/alerts` - Alertas del sistema

---

## 📝 Recomendaciones

### Prioridad Alta
1. **Implementar `/api/admin/ingestion`**
   - Consultar estado de trabajos de ingesta
   - Historial de ingestas
   - Progreso en tiempo real

2. **Implementar `/api/admin/stats`**
   - Tracking de consultas
   - Métricas de tokens
   - Costos estimados

### Prioridad Media
3. **Implementar `/api/admin/logs`**
   - Sistema de logging centralizado
   - Filtros por severidad
   - Búsqueda de logs

4. **Implementar `/api/admin/health`**
   - Métricas del servidor (CPU, Memory)
   - Estado de servicios
   - Uptime

### Prioridad Baja
5. **Implementar `/api/admin/alerts`**
   - Sistema de alertas
   - Notificaciones automáticas
   - Thresholds configurables

---

## 🎯 Estado Actual

| Componente | Estado | Datos |
|------------|--------|-------|
| Database Status | ✅ Real | Documentos y chunks de la BD |
| System Health | ❌ Mock | CPU, Memory, Storage, Uptime |
| Ingestion Jobs | ❌ Mock | Estado de trabajos |
| Error Logs | ❌ Mock | Logs del sistema |
| Usage Stats | ❌ Mock | Consultas, tokens, costos |
| System Alerts | ❌ Mock | Alertas críticas |

---

## 📌 Notas

- El componente `DatabaseStatus` es el único que usa datos reales
- Todos los demás componentes usan datos mock
- No hay sistema de tracking de métricas implementado
- No hay sistema de logging centralizado
- Los endpoints de admin no están implementados

