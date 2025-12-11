# Testing Guide: Parties and Candidates System

Esta guía te ayudará a probar el flujo completo del sistema de partidos y candidatos implementado en la Fase 3.5.

## Prerrequisitos

1. **Base de datos configurada**
   - Supabase corriendo (local o remoto)
   - Variables de entorno configuradas en `backend/.env`:
     - `SUPABASE_URL`
     - `SUPABASE_SERVICE_ROLE_KEY`

2. **Backend corriendo**
   ```bash
   cd backend
   pnpm dev
   ```

3. **Frontend corriendo**
   ```bash
   cd frontend
   pnpm dev
   ```

## Paso 1: Ejecutar la Migración SQL

La migración debe estar en `backend/supabase/migrations/20251211120000_create_parties_candidates.sql`

### Opción A: Usando Supabase CLI (Recomendado)

```bash
cd backend
npx supabase db push
```

### Opción B: Manualmente en Supabase Dashboard

1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **SQL Editor**
4. Crea una nueva query
5. Copia y pega el contenido de `backend/supabase/migrations/20251211120000_create_parties_candidates.sql`
6. Ejecuta la query

### Verificar Migración

```sql
-- Verificar que las tablas existen
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('parties', 'candidates');

-- Verificar estructura de parties
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'parties';

-- Verificar estructura de candidates
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'candidates';
```

## Paso 2: Ejecutar el Script de Seeding

```bash
cd backend
pnpm tsx src/scripts/seed-parties-candidates.ts
```

**Salida esperada:**
```
🌱 Seeding Parties and Candidates

📋 Seeding parties...

✅ Created party: Partido Liberación Nacional (pln)
   📋 Seeding 1 candidate(s) for Partido Liberación Nacional...
   ✅ Created candidate: José María Figueres Olsen (jose-maria-figueres)

==================================================
📊 Summary:
   Parties created: 1
   Parties skipped: 0
   Candidates created: 1
   Candidates skipped: 0
   Errors: 0
==================================================

✨ Seeding completed successfully!
```

### Verificar Datos en Base de Datos

```sql
-- Ver partidos
SELECT id, name, slug, abbreviation FROM parties;

-- Ver candidatos
SELECT id, name, slug, position, party_id FROM candidates;

-- Ver relación partido-candidato
SELECT 
  p.name as party_name,
  c.name as candidate_name,
  c.position
FROM parties p
JOIN candidates c ON c.party_id = p.id;
```

## Paso 3: Probar Endpoints API

### 3.1 Listar Partidos

```bash
curl http://localhost:3001/api/parties
```

**Respuesta esperada:**
```json
{
  "parties": [
    {
      "id": "...",
      "name": "Partido Liberación Nacional",
      "slug": "pln",
      "abbreviation": "PLN",
      ...
    }
  ],
  "pagination": {
    "total": 1,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

### 3.2 Obtener Partido por Slug

```bash
curl http://localhost:3001/api/parties/slug/pln
```

**Respuesta esperada:**
```json
{
  "party": {
    "id": "...",
    "name": "Partido Liberación Nacional",
    "slug": "pln",
    ...
  }
}
```

### 3.3 Obtener Candidatos de un Partido

```bash
# Primero obtener el ID del partido
PARTY_ID=$(curl -s http://localhost:3001/api/parties/slug/pln | jq -r '.party.id')
curl http://localhost:3001/api/parties/$PARTY_ID/candidates
```

**Respuesta esperada:**
```json
{
  "party": { ... },
  "candidates": [
    {
      "id": "...",
      "name": "José María Figueres Olsen",
      "slug": "jose-maria-figueres",
      ...
    }
  ]
}
```

### 3.4 Listar Candidatos

```bash
curl http://localhost:3001/api/candidates
```

### 3.5 Obtener Candidato por Slug

```bash
curl http://localhost:3001/api/candidates/slug/jose-maria-figueres
```

**Respuesta esperada:**
```json
{
  "candidate": {
    "id": "...",
    "name": "José María Figueres Olsen",
    "slug": "jose-maria-figueres",
    ...
  },
  "party": {
    "id": "...",
    "name": "Partido Liberación Nacional",
    ...
  }
}
```

## Paso 4: Probar Frontend

### 4.1 Página de Partido

1. Abre el navegador en `http://localhost:3000`
2. Navega a `/party/pln` (o usa el slug del partido)
3. Verifica que:
   - ✅ Se muestra la información del partido
   - ✅ Se muestran las estadísticas (fundación, diputados, alcaldías)
   - ✅ Se muestran los candidatos del partido
   - ✅ Los enlaces funcionan correctamente

### 4.2 Página de Candidato

1. Navega a `/candidate/jose-maria-figueres` (o usa el slug del candidato)
2. Verifica que:
   - ✅ Se muestra la información del candidato
   - ✅ Se muestra la biografía
   - ✅ Se muestran educación, experiencia profesional y política
   - ✅ Se muestran las propuestas
   - ✅ El enlace de vuelta al partido funciona

### 4.3 Estados de Carga

1. Abre las herramientas de desarrollador (F12)
2. Ve a la pestaña Network
3. Recarga la página del partido
4. Verifica que:
   - ✅ Se muestran skeleton loaders mientras carga
   - ✅ Los datos se cargan correctamente
   - ✅ No hay errores en la consola

### 4.4 Manejo de Errores

1. Intenta acceder a un partido que no existe: `/party/no-existe`
2. Verifica que:
   - ✅ Se muestra un mensaje de error apropiado
   - ✅ Hay un botón para volver a inicio

## Paso 5: Verificar Integración Completa

### 5.1 Flujo Completo

1. **Desde la página principal:**
   - Busca o navega a un partido
   - Haz clic en el partido
   - Verifica que se carga la página del partido

2. **Desde la página del partido:**
   - Haz clic en un candidato
   - Verifica que se carga la página del candidato
   - Haz clic en "Volver a [PARTY]"
   - Verifica que regresa a la página del partido

3. **Navegación:**
   - Verifica que todos los enlaces funcionan
   - Verifica que los slugs se usan correctamente en las URLs

### 5.2 Verificar React Query Cache

1. Abre las herramientas de desarrollador
2. Ve a la pestaña React Query DevTools (si está instalado)
3. Navega entre páginas
4. Verifica que:
   - ✅ Los datos se cachean correctamente
   - ✅ Las queries se invalidan cuando es necesario
   - ✅ No hay queries duplicadas

## Checklist de Verificación

### Backend
- [ ] Migración SQL ejecutada exitosamente
- [ ] Tablas `parties` y `candidates` creadas
- [ ] Script de seeding ejecutado sin errores
- [ ] Datos insertados correctamente en la base de datos
- [ ] Endpoint `GET /api/parties` funciona
- [ ] Endpoint `GET /api/parties/slug/:slug` funciona
- [ ] Endpoint `GET /api/parties/:id/candidates` funciona
- [ ] Endpoint `GET /api/candidates` funciona
- [ ] Endpoint `GET /api/candidates/slug/:slug` funciona
- [ ] Endpoint `GET /api/candidates/:id` funciona

### Frontend
- [ ] Página `/party/[slug]` carga correctamente
- [ ] Página `/candidate/[slug]` carga correctamente
- [ ] Estados de loading funcionan
- [ ] Estados de error funcionan
- [ ] Navegación entre páginas funciona
- [ ] Datos se muestran correctamente
- [ ] Enlaces funcionan correctamente
- [ ] No hay errores en la consola del navegador

### Integración
- [ ] Flujo completo partido → candidato funciona
- [ ] Flujo completo candidato → partido funciona
- [ ] Cache de React Query funciona correctamente
- [ ] Los slugs se usan correctamente en las URLs

## Troubleshooting

### Error: "Table parties does not exist"
- **Solución:** Ejecuta la migración SQL primero

### Error: "Party not found" en el frontend
- **Solución:** Verifica que el script de seeding se ejecutó correctamente
- Verifica que estás usando el slug correcto en la URL

### Error: "Network error" o "Failed to fetch"
- **Solución:** Verifica que el backend está corriendo en el puerto correcto
- Verifica la variable `NEXT_PUBLIC_API_URL` en el frontend

### Los datos no se muestran
- **Solución:** Verifica la consola del navegador para errores
- Verifica que los datos existen en la base de datos
- Verifica que los endpoints API devuelven datos correctamente

### Errores de CORS
- **Solución:** Verifica que el backend tiene CORS habilitado
- Verifica que `NEXT_PUBLIC_API_URL` apunta al backend correcto

## Próximos Pasos

Una vez que todo funcione correctamente:

1. Agregar más partidos y candidatos al script de seeding
2. Implementar funcionalidad de creación/edición (si es necesario)
3. Agregar tests unitarios e integración
4. Optimizar queries y cache
5. Agregar paginación en el frontend si hay muchos partidos/candidatos

