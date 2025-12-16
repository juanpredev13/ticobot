# Chatbot para Preguntas sobre Candidatos

## ✅ Estado Actual

El documento `partidos_candidatos_2026.pdf` ha sido ingerido exitosamente y está disponible para consultas del chatbot.

### Documento Indexado
- **Document ID**: `partidos-candidatos-2026`
- **Party ID**: `PARTIDOS`
- **Chunks**: 1 chunk con embedding
- **Contenido**: Lista de partidos políticos con sus candidatos presidenciales

### Contenido del Documento
El documento contiene una tabla con:
- Partido político
- Candidato presidencial
- Colores del partido

Ejemplo del contenido:
```
Partido | Candidato | Colores
Coalición Agenda Ciudadana | PACADN Claudia Dobles | ...
Unidos Podemos | Natalia Díaz Quintana | ...
Pueblo Soberano | Laura Fernández Delgado | ...
Unidad Social Cristiana | Juan Carlos Hidalgo | ...
Liberación Nacional | Álvaro Ramos Chaves | ...
```

## 🔧 Cambios Realizados

### 1. System Prompt Mejorado
Se actualizó el system prompt en `ResponseGenerator.ts` para que el chatbot entienda mejor las preguntas sobre candidatos:

**Nuevas capacidades**:
- ✅ Responde preguntas sobre candidatos presidenciales
- ✅ Identifica qué partido tiene qué candidato
- ✅ Proporciona listas de candidatos
- ✅ Parsea correctamente tablas de candidatos

**Ejemplos de preguntas que ahora puede responder**:
- "¿Cuál es el candidato del PLN?"
- "¿Quién es el candidato de [partido]?"
- "¿Qué partido tiene a [nombre] como candidato?"
- "Lista de candidatos"

## 📝 Cómo Funciona

### Flujo RAG para Preguntas sobre Candidatos

1. **Usuario pregunta**: "¿Cuál es el candidato del PLN?"
2. **Query Embedding**: Se genera el embedding de la pregunta
3. **Búsqueda Semántica**: El sistema busca chunks relevantes en la base de datos
4. **Retrieval**: Encuentra el chunk del documento `partidos-candidatos-2026`
5. **Context Building**: Construye el contexto con la información del chunk
6. **LLM Generation**: El LLM genera la respuesta usando el contexto
7. **Respuesta**: "El candidato del Partido Liberación Nacional (PLN) es Álvaro Ramos Chaves."

### Búsqueda Híbrida

El sistema usa **búsqueda híbrida** que combina:
- **Vector Search**: Búsqueda semántica por similitud
- **Keyword Search**: Búsqueda por palabras clave (PostgreSQL full-text search)

Esto asegura que preguntas como "candidato PLN" encuentren el documento correcto.

## 🧪 Cómo Probar

### 1. Iniciar el Backend
```bash
cd backend
pnpm dev
```

### 2. Probar con cURL
```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "question": "¿Cuál es el candidato del PLN?",
    "topK": 5
  }'
```

### 3. Probar desde el Frontend
1. Abre la aplicación en el navegador
2. Ve a la sección de Chat
3. Pregunta: "¿Cuál es el candidato del PLN?"
4. El chatbot debería responder con el nombre del candidato

### 4. Ejemplos de Preguntas para Probar

```bash
# Pregunta simple
"¿Cuál es el candidato del PLN?"

# Pregunta con nombre de partido completo
"¿Quién es el candidato del Partido Liberación Nacional?"

# Pregunta inversa
"¿Qué partido tiene a Álvaro Ramos Chaves como candidato?"

# Lista completa
"¿Cuáles son todos los candidatos presidenciales?"

# Pregunta sobre partido específico
"¿Quién es el candidato de Unidos Podemos?"
```

## 🔍 Verificación

### Verificar que el Documento Está Indexado

```bash
cd backend
pnpm tsx scripts/check-candidatos-document.ts
```

Este script verifica:
- ✅ Que el documento existe en la base de datos
- ✅ Que tiene chunks con embeddings
- ✅ Que el contenido es correcto

## 📊 Metadata del Documento

El documento tiene la siguiente metadata:
- **document_id**: `partidos-candidatos-2026`
- **party_id**: `PARTIDOS`
- **party_name**: `PARTIDOS`
- **title**: `Plan de Gobierno PARTIDOS 2026`

**Nota**: El `party_id` es `PARTIDOS` porque es un documento general que contiene información de todos los partidos, no de un partido específico.

## 🎯 Mejoras Futuras

### Posibles Mejoras
1. **Extracción Estructurada**: Extraer candidatos a una tabla separada en la BD
2. **Búsqueda por Nombre**: Permitir búsqueda directa por nombre de candidato
3. **Metadata Enriquecida**: Agregar más información sobre cada candidato
4. **Filtros Mejorados**: Permitir filtrar por partido al buscar candidatos

## ⚠️ Limitaciones Actuales

1. **Formato del Documento**: El documento es una tabla simple, puede ser difícil de parsear para el LLM
2. **Información Limitada**: Solo contiene nombre del candidato y partido, no biografía u otras info
3. **Búsqueda Exacta**: Si el nombre del partido no coincide exactamente, puede no encontrar resultados

## 🚀 Uso en Producción

El chatbot ya está listo para responder preguntas sobre candidatos. Solo asegúrate de:

1. ✅ El documento está ingerido (ya hecho)
2. ✅ El backend está corriendo
3. ✅ El frontend puede hacer llamadas a `/api/chat`
4. ✅ Los embeddings están generados (ya hecho)

¡El sistema está listo para usar!

