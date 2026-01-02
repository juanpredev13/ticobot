# Ejecutar Queries SQL en Supabase Remoto

Hay varias formas de ejecutar queries SQL en Supabase remoto:

## Opción 1: Script TypeScript (Recomendado)

Usa el script `query-comparisons-cache.ts` que ejecuta queries usando el cliente de Supabase:

```bash
# Desde el directorio backend:
cd backend

# Ver todas las opciones
pnpm tsx scripts/query-comparisons-cache.ts

# Ejecutar queries específicos
pnpm tsx scripts/query-comparisons-cache.ts 1      # Ver todas las entradas
pnpm tsx scripts/query-comparisons-cache.ts 2      # Contar entradas
pnpm tsx scripts/query-comparisons-cache.ts stats  # Estadísticas
pnpm tsx scripts/query-comparisons-cache.ts party:pln  # Entradas de PLN
```

## Opción 2: Supabase Dashboard (Más fácil para queries complejos)

1. Ve a https://app.supabase.com
2. Selecciona tu proyecto
3. Ve a **SQL Editor** en el menú lateral
4. Copia y pega los queries del archivo `sql-review-comparisons-cache.sql`
5. Ejecuta los queries individualmente

## Opción 3: PostgreSQL Client (psql)

Conecta directamente usando `psql`:

```bash
# Obtén la connection string de Supabase Dashboard → Settings → Database
# Formato: postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres

psql "postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres"
```

Luego ejecuta los queries:

```sql
-- Ver todas las entradas
SELECT id, topic, party_ids, created_at 
FROM comparisons_cache 
ORDER BY created_at DESC;
```

## Opción 4: Supabase CLI

Si tienes la CLI configurada:

```bash
# Conectar a la base de datos remota
supabase db remote connect

# O ejecutar un query específico
supabase db execute "SELECT COUNT(*) FROM comparisons_cache;"
```

## Variables de Entorno Necesarias

Para el script TypeScript, asegúrate de tener estas variables en tu `.env`:

```env
SUPABASE_URL=https://[PROJECT-REF].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[TU_SERVICE_ROLE_KEY]
```

## Queries Disponibles

### Básicos
- **Query 1**: Ver todas las entradas del cache
- **Query 2**: Contar total de entradas
- **Query 3**: Entradas agrupadas por tema
- **Query 4**: Entradas agrupadas por combinación de partidos

### Estado del Cache
- **Query 5**: Ver entradas expiradas
- **Query 6**: Ver entradas que nunca expiran
- **Query 7**: Top 10 temas más consultados

### Específicos
- **Query 12**: Entradas de un partido específico (`party:pln`)
- **Stats**: Estadísticas completas del cache

## Notas

- El script TypeScript tiene limitaciones: no puede ejecutar queries con `GROUP BY` complejos directamente, así que algunos queries hacen el agrupamiento en memoria
- Para queries más complejos (como los que usan `jsonb_pretty`), usa el **Supabase Dashboard** o **psql**
- El archivo `sql-review-comparisons-cache.sql` contiene todos los queries en SQL puro para usar en el dashboard o psql

