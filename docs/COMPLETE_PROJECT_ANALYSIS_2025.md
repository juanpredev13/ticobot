# Análisis Completo del Proyecto TicoBot

**Fecha:** 2025-12-20  
**Versión:** 0.1.0  
**Estado:** En desarrollo activo

---

## 📋 Tabla de Contenidos

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura General](#arquitectura-general)
3. [Estructura del Proyecto](#estructura-del-proyecto)
4. [Stack Tecnológico](#stack-tecnológico)
5. [Componentes Principales](#componentes-principales)
6. [Flujos de Datos](#flujos-de-datos)
7. [Base de Datos](#base-de-datos)
8. [API Endpoints](#api-endpoints)
9. [Frontend](#frontend)
10. [Sistema RAG](#sistema-rag)
11. [Pipeline de Ingestión](#pipeline-de-ingestión)
12. [Configuración y Despliegue](#configuración-y-despliegue)
13. [Scripts y Utilidades](#scripts-y-utilidades)
14. [Estado Actual y Mejoras Recientes](#estado-actual-y-mejoras-recientes)

---

## 🎯 Resumen Ejecutivo

**TicoBot** es una plataforma inteligente para analizar los Planes de Gobierno 2026 de Costa Rica publicados oficialmente por el Tribunal Supremo de Elecciones (TSE). La plataforma permite a los ciudadanos:

- **Explorar** contenido de planes de gobierno de todos los partidos políticos
- **Comparar** propuestas entre diferentes partidos lado a lado
- **Hacer preguntas** fundamentadas en documentos PDF oficiales usando IA
- **Evaluar** diferentes proveedores de LLM, bases de datos vectoriales y pipelines RAG

### Características Principales

- 🤖 **Soporte Multi-LLM**: Cambiar entre OpenAI, Claude, Gemini y modelos locales Ollama
- 🔍 **Búsqueda Semántica**: Encontrar contenido relevante en todos los planes de gobierno
- 💬 **Chat con RAG**: Preguntas y respuestas interactivas con contexto de documentos oficiales
- 📊 **Comparador de Propuestas**: Comparar propuestas de partidos lado a lado con clasificación automática de estados
- 🔄 **Arquitectura Modular**: Intercambiar proveedores sin cambiar lógica de negocio
- 📈 **Dashboard Admin**: Monitorear estado del sistema y gestionar datos
- ⚡ **Caché Inteligente**: Resultados de comparación en caché para solicitudes más rápidas

---

## 🏗️ Arquitectura General

### Patrón Arquitectónico

El proyecto sigue **Clean Architecture** con patrón **Ports & Adapters**:

```
┌─────────────────────────────────────────┐
│      Presentation Layer                  │
│  (HTTP API, Next.js UI Components)      │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│      Application Layer                  │
│  (Use Cases: Ingest, Search, Chat)      │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│      Domain Layer                       │
│  (Entities, Ports/Interfaces)           │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│      Infrastructure Layer                │
│  (Adapters: Supabase, OpenAI, etc.)      │
└─────────────────────────────────────────┘
```

### Monorepo Structure

```
ticobot/
├── backend/          # API y procesamiento de datos
│   ├── src/
│   │   ├── api/      # Rutas Express y middleware
│   │   ├── rag/      # Pipeline RAG completo
│   │   ├── ingest/   # Pipeline de ingesta de PDFs
│   │   ├── providers/# Implementaciones de proveedores
│   │   ├── db/       # Servicios de base de datos
│   │   ├── auth/     # Autenticación y autorización
│   │   └── factory/  # Factory para proveedores
│   ├── scripts/      # Scripts de utilidad (56 archivos)
│   └── supabase/     # Migraciones SQL
├── frontend/         # Aplicación Next.js
│   ├── app/          # App Router de Next.js 16
│   ├── components/   # Componentes React
│   └── lib/          # Utilidades y hooks
├── shared/           # Tipos TypeScript compartidos
└── docs/            # Documentación organizada por fases
```

---

## 💻 Stack Tecnológico

### Backend

- **Runtime**: Node.js 20+ con TypeScript
- **Framework**: Express.js 5.2.1
- **Package Manager**: pnpm 10.22.0
- **Base de Datos**: Supabase (PostgreSQL + pgvector)
- **Autenticación**: JWT + bcrypt
- **Validación**: Zod
- **Documentación API**: Swagger/OpenAPI

### Frontend

- **Framework**: Next.js 16 (App Router)
- **React**: 19.2.1
- **TypeScript**: 5.x
- **Styling**: TailwindCSS 4.1.9
- **UI Components**: Radix UI
- **State Management**: TanStack Query (React Query) 5.90.12
- **Formularios**: React Hook Form + Zod

### Base de Datos y Almacenamiento

- **Principal**: Supabase (PostgreSQL 15+)
- **Vector Store**: pgvector extension
- **Opciones Configurables**: Pinecone, Qdrant, Weaviate

### LLM Providers

- **OpenAI**: GPT-4.1, o1, text-embedding-3-small
- **Anthropic**: Claude 3.5 Sonnet
- **Google**: Gemini Flash, Gemini Pro
- **Local**: Ollama (modelos locales)

### Embedding Providers

- **OpenAI**: text-embedding-3-small (1536 dimensiones)
- **Configurable**: Soporte para otros proveedores

---

## 🧩 Componentes Principales

### Backend

#### 1. API Server (`backend/src/api/server.ts`)
- Servidor Express con CORS configurado
- Middleware de logging y error handling
- Swagger UI en `/api/docs`
- Rutas organizadas por dominio

#### 2. Rutas API (`backend/src/api/routes/`)
- `auth.ts` - Autenticación y registro
- `chat.ts` - Chat con RAG (streaming)
- `compare.ts` - Comparación de propuestas entre partidos
- `documents.ts` - Gestión de documentos
- `ingest.ts` - Pipeline de ingesta de PDFs
- `parties.ts` - Información de partidos políticos
- `candidates.ts` - Información de candidatos
- `search.ts` - Búsqueda semántica

#### 3. Pipeline RAG (`backend/src/rag/`)
- `RAGPipeline.ts` - Orquestador principal
- `QueryEmbedder.ts` - Generación de embeddings
- `SemanticSearcher.ts` - Búsqueda híbrida (vector + keywords)
- `ContextBuilder.ts` - Construcción de contexto
- `ResponseGenerator.ts` - Generación de respuestas con LLM
- `QueryProcessor.ts` - Procesamiento Pre-RAG de queries

#### 4. Pipeline de Ingestión (`backend/src/ingest/`)
- `IngestPipeline.ts` - Pipeline principal
- `PDFDownloader.ts` - Descarga de PDFs desde TSE
- `PDFParser.ts` - Extracción de texto
- `TextCleaner.ts` - Limpieza de texto
- `TextChunker.ts` - División en chunks semánticos
- `EmbeddingGenerator.ts` - Generación de embeddings

#### 5. Proveedores (`backend/src/providers/`)
- `ProviderFactory.ts` - Factory para instanciar proveedores
- Implementaciones para LLM, Embeddings, Vector Stores

#### 6. Servicios de Base de Datos (`backend/src/db/`)
- `PartiesService.ts` - Gestión de partidos
- `ComparisonsCacheService.ts` - Caché de comparaciones
- `SupabaseVectorStore.ts` - Almacén vectorial

### Frontend

#### 1. Páginas Principales (`frontend/app/`)
- `/` - Página de inicio con búsqueda
- `/compare` - Comparador de propuestas
- `/chat` - Chat interactivo con RAG
- `/documents` - Explorador de documentos
- `/party/[id]` - Página de partido
- `/candidate/[id]` - Página de candidato
- `/admin` - Dashboard administrativo

#### 2. Componentes (`frontend/components/`)
- `ui/` - Componentes base (Radix UI)
- `admin/` - Componentes del dashboard
- `auth/` - Componentes de autenticación
- Componentes específicos: `party-card`, `entity-grid`, etc.

#### 3. Hooks (`frontend/lib/hooks/`)
- `use-chat.ts` - Hook para chat con streaming
- `use-compare.ts` - Hook para comparaciones
- `use-parties.ts` - Hook para partidos
- `use-documents.ts` - Hook para documentos
- `use-auth.ts` - Hook para autenticación

#### 4. Servicios API (`frontend/lib/api/services/`)
- Cliente API centralizado
- Servicios por dominio (chat, compare, parties, etc.)

---

## 🔄 Flujos de Datos

### 1. Flujo de Ingestión de PDFs

```
TSE Website
    ↓
PDFDownloader → Descarga PDF
    ↓
PDFParser → Extrae texto
    ↓
TextCleaner → Limpia texto
    ↓
TextChunker → Divide en chunks
    ↓
EmbeddingGenerator → Genera embeddings
    ↓
SupabaseVectorStore → Almacena en DB
```

### 2. Flujo de Búsqueda/Chat

```
Usuario → Query
    ↓
QueryEmbedder → Embedding del query
    ↓
SemanticSearcher → Búsqueda híbrida
    ↓
ContextBuilder → Construye contexto
    ↓
ResponseGenerator → Genera respuesta con LLM
    ↓
Usuario ← Respuesta
```

### 3. Flujo de Comparación

```
Usuario → Tema + Partidos seleccionados
    ↓
ComparisonsCacheService → ¿Existe en caché?
    ↓ (si no)
RAGPipeline.compareParties → Para cada partido:
    - Buscar chunks relevantes
    - Generar respuesta
    - Determinar estado (completa/parcial/poco_clara/sin_informacion)
    ↓
ComparisonsCacheService → Guardar en caché
    ↓
Frontend ← Resultados
```

---

## 🗄️ Base de Datos

### Esquema Principal

#### Tabla: `parties`
- `id` (UUID) - Identificador único
- `name` (TEXT) - Nombre del partido
- `abbreviation` (TEXT) - Abreviación (PLN, PUSC, etc.)
- `slug` (TEXT) - Slug único (pln, pusc, etc.)
- `founded_year` (INTEGER)
- `ideology` (TEXT[])
- `colors` (JSONB) - Colores primario y secundario
- `logo_url` (TEXT)
- `description` (TEXT)
- `website` (TEXT)
- `social_media` (JSONB)
- `current_representation` (JSONB)

#### Tabla: `documents`
- `id` (UUID) - Identificador único
- `document_id` (TEXT) - ID del documento (ej: "pln-2026")
- `title` (TEXT)
- `party_id` (UUID) - Referencia a parties.id
- `party_name` (TEXT)
- `url` (TEXT) - URL del PDF en TSE
- `file_path` (TEXT)
- `page_count` (INTEGER)
- `file_size_bytes` (BIGINT)
- `downloaded_at` (TIMESTAMPTZ)
- `parsed_at` (TIMESTAMPTZ)
- `metadata` (JSONB)

#### Tabla: `chunks`
- `id` (UUID) - Identificador único
- `document_id` (UUID) - Referencia a documents.id
- `chunk_index` (INTEGER)
- `content` (TEXT) - Contenido del chunk
- `embedding` (vector(1536)) - Embedding vectorial
- `token_count` (INTEGER)
- `char_count` (INTEGER)
- `metadata` (JSONB) - Metadatos adicionales
- `search_vector` (tsvector) - Para búsqueda full-text

#### Tabla: `comparisons_cache`
- `id` (UUID) - Identificador único
- `topic` (TEXT) - Tema de comparación
- `party_ids` (TEXT[]) - Array de slugs de partidos
- `comparisons` (JSONB) - Resultados de comparación
- `created_at` (TIMESTAMPTZ)
- `expires_at` (TIMESTAMPTZ) - NULL = nunca expira
- `metadata` (JSONB)

#### Tabla: `candidates`
- `id` (UUID)
- `party_id` (UUID) - Referencia a parties.id
- `name` (TEXT)
- `position` (TEXT) - Cargo (ej: "Candidato a Presidente")
- `photo_url` (TEXT)
- `biography` (TEXT)
- `metadata` (JSONB)

### Funciones SQL

1. **`match_chunks`** - Búsqueda por similitud vectorial
2. **`hybrid_search`** - Búsqueda híbrida (vector + full-text)
3. **`chunks_search_vector`** - Construcción de tsvector para búsqueda full-text

---

## 🌐 API Endpoints

### Autenticación
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Inicio de sesión
- `GET /api/auth/me` - Información del usuario actual

### Documentos
- `GET /api/documents` - Listar documentos
- `GET /api/documents/:id` - Obtener documento específico

### Búsqueda
- `POST /api/search` - Búsqueda semántica

### Chat
- `POST /api/chat` - Chat con RAG (streaming SSE)

### Comparación
- `POST /api/compare` - Comparar propuestas entre partidos

### Partidos
- `GET /api/parties` - Listar partidos (top 5 primero)
- `GET /api/parties/:id` - Obtener partido específico
- `GET /api/parties/slug/:slug` - Obtener por slug

### Candidatos
- `GET /api/candidates` - Listar candidatos
- `GET /api/candidates/:id` - Obtener candidato específico

### Ingestión
- `POST /api/ingest` - Iniciar ingesta de PDF
- `GET /api/ingest/status/:id` - Estado de ingesta

### Health
- `GET /health` - Estado del sistema
- `GET /api/health` - Estado detallado

---

## 🎨 Frontend

### Estructura de Páginas

#### Página Principal (`/`)
- Búsqueda global
- Estadísticas del sistema
- Grid de partidos
- Grid de candidatos

#### Comparador (`/compare`)
- Selector de partidos (top 5 por defecto, todos seleccionados)
- Selector de tema o búsqueda personalizada
- Comparación lado a lado
- Estados de propuestas (completa/parcial/poco_clara/sin_informacion)
- Fuentes y relevancia

#### Chat (`/chat`)
- Interfaz de chat interactivo
- Streaming de respuestas (SSE)
- Selector de modelo LLM
- Historial de conversación

#### Documentos (`/documents`)
- Lista de documentos disponibles
- Filtros por partido
- Vista previa de documentos

#### Admin (`/admin`)
- Dashboard con estadísticas
- Estado de la base de datos
- Gestión de datos

### Estado y Caché

- **TanStack Query**: Caché de queries HTTP
- **Comparisons Cache**: Caché de comparaciones en backend
- **Chat Cache**: Caché de conversaciones

---

## 🧠 Sistema RAG

### Componentes del Pipeline

1. **QueryEmbedder**: Convierte queries en embeddings
2. **SemanticSearcher**: Búsqueda híbrida (70% vector, 30% keywords)
3. **QueryProcessor**: Procesamiento Pre-RAG (extracción de keywords)
4. **ContextBuilder**: Construye contexto desde chunks relevantes
5. **ResponseGenerator**: Genera respuesta usando LLM con contexto

### Búsqueda Híbrida

Combina:
- **Búsqueda Vectorial**: Similitud semántica usando embeddings
- **Búsqueda Full-Text**: Coincidencia de keywords usando PostgreSQL tsvector

Resultado: ~95% de precisión vs ~80% con solo búsqueda vectorial

### Umbrales Adaptativos

El sistema intenta búsquedas con umbrales decrecientes:
1. Primero: `minScore = 0.3`
2. Si no hay resultados: `minScore = 0.2`
3. Si aún no hay: `minScore = 0.1`

Esto asegura encontrar información incluso para temas con baja similitud semántica.

---

## 📥 Pipeline de Ingestión

### Proceso Completo

1. **Descarga**: PDF desde TSE
2. **Parsing**: Extracción de texto con `pdf-parse`
3. **Limpieza**: Normalización y limpieza de texto
4. **Chunking**: División en chunks semánticos (~1000 tokens)
5. **Embedding**: Generación de embeddings para cada chunk
6. **Almacenamiento**: Guardado en Supabase con metadatos

### Metadatos Incluidos

- Información del partido (UUID, nombre, abreviación)
- Información del documento (URL, páginas, tamaño)
- Información del chunk (índice, tokens, caracteres)
- Keywords y entidades extraídas
- Quality score del chunk

---

## ⚙️ Configuración y Despliegue

### Variables de Entorno

#### Backend
- `DATABASE_URL` - URL de Supabase
- `SUPABASE_URL` - URL del proyecto Supabase
- `SUPABASE_KEY` - API key de Supabase
- `LLM_PROVIDER` - Proveedor LLM (openai, anthropic, gemini, ollama)
- `EMBEDDING_PROVIDER` - Proveedor de embeddings
- `VECTOR_STORE` - Almacén vectorial (supabase, pinecone, qdrant)
- `OPENAI_API_KEY` - API key de OpenAI
- `ANTHROPIC_API_KEY` - API key de Anthropic
- `GEMINI_API_KEY` - API key de Google
- `JWT_SECRET` - Secret para JWT
- `PORT` - Puerto del servidor (default: 3001)

#### Frontend
- `NEXT_PUBLIC_API_URL` - URL del backend
- `NEXT_PUBLIC_SUPABASE_URL` - URL de Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - API key pública de Supabase

### Despliegue

- **Railway**: Configurado para monorepo
- **Supabase**: Base de datos y almacenamiento
- **Build**: Scripts de validación y build

---

## 🛠️ Scripts y Utilidades

### Scripts de Diagnóstico (56 scripts en total)

#### Diagnóstico
- `diagnose-pln.ts` - Diagnosticar estado de PLN
- `check-pln-chunks.ts` - Verificar chunks de PLN
- `check-corrupcion-chunks.ts` - Buscar chunks sobre corrupción

#### Ingestión
- `ingest-pln.ts` - Ingerir documento PLN específico
- `reingest-all-plans.ts` - Reingerir todos los planes

#### Cache
- `clear-pln-cache.ts` - Limpiar cache de PLN
- `clear-corrupcion-cache.ts` - Limpiar cache de corrupción
- `query-comparisons-cache.ts` - Consultar cache de comparaciones

#### Testing
- `test-pln-comparison.ts` - Probar comparación de PLN
- `test-corrupcion-search.ts` - Probar búsqueda de corrupción
- `test-compare-api.ts` - Probar API de comparación

#### Utilidades SQL
- `sql-examples-comparison.sql` - Ejemplos SQL para comparaciones
- `sql-review-comparisons-cache.sql` - Queries para revisar cache

---

## 📊 Estado Actual y Mejoras Recientes

### Mejoras Implementadas Recientemente

1. **Fix de Filtrado por Partido**
   - Resolución de UUID desde slug antes de filtrar
   - Soporte para filtrado por UUID en funciones SQL
   - Migración SQL para actualizar funciones de búsqueda

2. **Umbrales Adaptativos**
   - Sistema de umbrales decrecientes para búsqueda
   - Mejora en recall para temas con baja similitud

3. **Top 5 Partidos**
   - Ordenamiento: PLN, CAC, PS, FA, PUSC
   - Selectores limitados a top 5
   - Todos los partidos seleccionados por defecto

4. **Cache Sin Expiración**
   - Comparaciones nunca expiran por defecto
   - Scripts para limpiar cache antiguo

5. **Comparaciones Mejoradas**
   - Soporte para hasta 5 partidos
   - Estados de propuestas automáticos
   - Caché inteligente

### Problemas Conocidos

1. **Respuestas del LLM**: A veces menciona partidos no solicitados
2. **Embeddings**: Algunos temas tienen baja similitud semántica
3. **Cache**: Algunas entradas antiguas pueden tener datos incorrectos

### Próximos Pasos Sugeridos

1. Mejorar prompt engineering para respuestas más precisas
2. Ajustar pesos de búsqueda híbrida según resultados
3. Implementar re-ranking de resultados
4. Agregar más metadatos a chunks para mejor filtrado
5. Optimizar generación de embeddings en batch

---

## 📝 Notas Finales

### Estructura de Documentación

La documentación está organizada en `/docs`:
- `development/` - Guías de desarrollo
- `api/` - Referencia de API
- `phase-one/` - Documentación de Fase 1
- `phase-two/` - Documentación de Fase 2

### Contribución

Ver `CLAUDE.md` para:
- Patrones arquitectónicos
- Flujo de desarrollo
- Formato de commits
- Guías de contribución

---

**Última actualización:** 2025-12-20  
**Mantenido por:** juanpredev  
**Licencia:** MIT


