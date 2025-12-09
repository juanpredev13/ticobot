# Guía de Uso de TanStack Query en TicoBot

## Tabla de Contenidos
1. [Introducción](#introducción)
2. [Conceptos Básicos](#conceptos-básicos)
3. [Query Keys](#query-keys)
4. [Queries (Lectura de Datos)](#queries-lectura-de-datos)
5. [Mutations (Modificación de Datos)](#mutations-modificación-de-datos)
6. [Error Handling](#error-handling)
7. [Loading States](#loading-states)
8. [Cache Invalidation](#cache-invalidation)
9. [Optimistic Updates](#optimistic-updates)
10. [Patrones Comunes](#patrones-comunes)
11. [Ejemplos Prácticos](#ejemplos-prácticos)
12. [Troubleshooting](#troubleshooting)

---

## Introducción

TanStack Query (anteriormente React Query) es una librería para manejo de estado asíncrono en React. En TicoBot, la usamos para:

- **Fetching de datos** del backend
- **Caching inteligente** para reducir llamadas API
- **Sincronización automática** entre UI y servidor
- **Estados de loading y error** manejados automáticamente
- **Optimistic updates** para mejor UX

**Versión instalada:** `@tanstack/react-query` v5.90.12

---

## Conceptos Básicos

### ¿Qué es una Query?

Una **query** es una solicitud para LEER datos del servidor. En TicoBot:
- `useDocuments()` - Obtener lista de documentos
- `useDocument(id)` - Obtener un documento específico
- `useSearch(request)` - Buscar en documentos

### ¿Qué es una Mutation?

Una **mutation** es una solicitud para MODIFICAR datos en el servidor. En TicoBot:
- `useLogin()` - Iniciar sesión
- `useChat()` - Enviar mensaje al chat
- `useSearchMutation()` - Realizar búsqueda (POST)

### Query vs Mutation

| Aspecto | Query | Mutation |
|---------|-------|----------|
| Propósito | Leer datos | Modificar datos |
| Hook | `useQuery` | `useMutation` |
| Método HTTP | GET | POST, PUT, DELETE, PATCH |
| Caching | Automático | No (pero invalida queries) |
| Re-fetching | Automático | Manual |
| Ejemplo | Cargar documentos | Enviar mensaje de chat |

---

## Query Keys

### ¿Qué son los Query Keys?

Los **query keys** son identificadores únicos para cada query. TanStack Query los usa para:
- Cachear resultados
- Invalidar cache cuando sea necesario
- Compartir datos entre componentes

### Estructura Jerárquica

En TicoBot, usamos un sistema centralizado en `/lib/hooks/query-keys.ts`:

```typescript
// ✅ CORRECTO: Estructura jerárquica
export const documentKeys = {
  all: ['documents'] as const,                    // ['documents']
  lists: () => [...documentKeys.all, 'list'],     // ['documents', 'list']
  list: (params) => [...documentKeys.lists(), params], // ['documents', 'list', {...}]
  details: () => [...documentKeys.all, 'detail'], // ['documents', 'detail']
  detail: (id) => [...documentKeys.details(), id] // ['documents', 'detail', '123']
};
```

### Beneficios de Centralizar Query Keys

1. **Consistencia** - Todos usan las mismas keys
2. **Invalidación fácil** - `queryClient.invalidateQueries({ queryKey: documentKeys.all })`
3. **Autocompletado** - TypeScript sugiere keys disponibles
4. **Refactoring seguro** - Cambio en un solo lugar

### Ejemplo de Uso

```typescript
import { documentKeys } from '@/lib/hooks';

// En tu hook
export function useDocuments(params?: DocumentListRequest) {
  return useQuery({
    queryKey: documentKeys.list(params), // ✅ Usa factory centralizado
    queryFn: () => documentsService.list(params),
  });
}

// Invalidar cache
queryClient.invalidateQueries({ queryKey: documentKeys.all }); // Todos los documents
queryClient.invalidateQueries({ queryKey: documentKeys.lists() }); // Solo las listas
```

---

## Queries (Lectura de Datos)

### Anatomía de un Query Hook

```typescript
import { useQuery } from '@tanstack/react-query';
import { documentsService } from '@/lib/api/services';
import { documentKeys } from '@/lib/hooks/query-keys';

export function useDocuments(params?: DocumentListRequest) {
  return useQuery({
    // 1. Query Key - Identificador único
    queryKey: documentKeys.list(params),

    // 2. Query Function - Función que obtiene datos
    queryFn: () => documentsService.list(params),

    // 3. Opciones
    staleTime: 5 * 60 * 1000,  // 5 minutos - Datos considerados "frescos"
    gcTime: 10 * 60 * 1000,    // 10 minutos - Garbage collection
    enabled: true,              // Ejecutar automáticamente
    retry: 1,                   // Reintentar 1 vez en error
  });
}
```

### Usar un Query en un Componente

```typescript
import { useDocuments } from '@/lib/hooks';

export function DocumentsPage() {
  const { data, isLoading, isError, error, refetch } = useDocuments({ page: 1 });

  if (isLoading) {
    return <div>Cargando...</div>;
  }

  if (isError) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div>
      {data.documents.map(doc => (
        <div key={doc.id}>{doc.title}</div>
      ))}
      <button onClick={() => refetch()}>Recargar</button>
    </div>
  );
}
```

### Propiedades Retornadas por useQuery

```typescript
const {
  // Datos
  data,              // Resultado de queryFn (undefined si loading/error)

  // Estados
  isLoading,         // true si primera carga
  isFetching,        // true si haciendo fetch (incluye refetch)
  isError,           // true si hubo error
  isSuccess,         // true si datos cargados correctamente

  // Error
  error,             // Objeto de error si isError === true

  // Métodos
  refetch,           // Función para re-ejecutar query
} = useQuery({...});
```

### Queries Condicionales

```typescript
// Solo ejecutar query cuando tenemos un ID
export function useDocument(id: string, enabled = true) {
  return useQuery({
    queryKey: documentKeys.detail(id),
    queryFn: () => documentsService.getById(id),
    enabled: enabled && !!id,  // Solo ejecutar si enabled=true Y id existe
  });
}

// Uso
const { data } = useDocument(documentId, isAuthenticated);
```

### Queries Dependientes

```typescript
// Segundo query depende del primero
export function DocumentWithChunks({ id }: { id: string }) {
  // 1. Primero cargamos el documento
  const { data: document, isSuccess } = useDocument(id);

  // 2. Solo cargamos chunks cuando documento está listo
  const { data: chunks } = useDocumentChunks(id, isSuccess);

  return (
    <div>
      <h1>{document?.title}</h1>
      {chunks?.map(chunk => <div key={chunk.id}>{chunk.content}</div>)}
    </div>
  );
}
```

---

## Mutations (Modificación de Datos)

### Anatomía de un Mutation Hook

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { chatService } from '@/lib/api/services';
import { toast } from '@/lib/toast';

export function useChat() {
  const queryClient = useQueryClient();

  return useMutation({
    // 1. Mutation Function - Ejecuta la operación
    mutationFn: (request: ChatRequest) => chatService.ask(request),

    // 2. onSuccess - Se ejecuta cuando tiene éxito
    onSuccess: (data, variables, context) => {
      toast.success('Mensaje enviado');
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: chatKeys.all });
    },

    // 3. onError - Se ejecuta en caso de error
    onError: (error, variables, context) => {
      toast.error('Error al enviar mensaje');
    },

    // 4. onMutate - Se ejecuta ANTES de mutationFn (optimistic updates)
    onMutate: async (variables) => {
      // Para optimistic updates
      return { /* context data */ };
    },

    // 5. Opciones
    retry: 1,  // Reintentar 1 vez
  });
}
```

### Usar una Mutation en un Componente

```typescript
import { useChat } from '@/lib/hooks';

export function ChatInput() {
  const [message, setMessage] = useState('');
  const chatMutation = useChat();

  const handleSend = () => {
    chatMutation.mutate(
      { query: message },
      {
        onSuccess: (data) => {
          console.log('Respuesta:', data);
          setMessage('');
        },
      }
    );
  };

  return (
    <div>
      <input value={message} onChange={(e) => setMessage(e.target.value)} />
      <button
        onClick={handleSend}
        disabled={chatMutation.isPending}
      >
        {chatMutation.isPending ? 'Enviando...' : 'Enviar'}
      </button>
      {chatMutation.isError && (
        <div>Error: {chatMutation.error.message}</div>
      )}
    </div>
  );
}
```

### Propiedades Retornadas por useMutation

```typescript
const {
  // Estado
  isPending,       // true mientras se ejecuta
  isSuccess,       // true si completó exitosamente
  isError,         // true si hubo error

  // Datos
  data,            // Resultado de mutationFn
  error,           // Error si isError === true

  // Métodos
  mutate,          // Ejecutar mutation (fire-and-forget)
  mutateAsync,     // Ejecutar mutation (retorna Promise)
  reset,           // Resetear estado de mutation
} = useMutation({...});
```

### Diferencia entre mutate y mutateAsync

```typescript
// 1. mutate - Fire and forget (callbacks)
chatMutation.mutate(request, {
  onSuccess: (data) => console.log(data),
  onError: (error) => console.error(error),
});

// 2. mutateAsync - Retorna Promise (async/await)
try {
  const data = await chatMutation.mutateAsync(request);
  console.log(data);
} catch (error) {
  console.error(error);
}
```

---

## Error Handling

### Niveles de Error Handling

#### 1. Error Handling en Query

```typescript
export function useDocuments() {
  return useQuery({
    queryKey: documentKeys.all,
    queryFn: () => documentsService.list(),
    retry: (failureCount, error) => {
      // No reintentar en errores 4xx
      if (error instanceof APIError && error.statusCode < 500) {
        return false;
      }
      // Reintentar hasta 2 veces en errores 5xx
      return failureCount < 2;
    },
  });
}
```

#### 2. Error Handling en Componente

```typescript
export function DocumentsPage() {
  const { data, isError, error, refetch } = useDocuments();

  if (isError) {
    return (
      <div className="error-container">
        <p>Error: {error.message}</p>
        <button onClick={() => refetch()}>Reintentar</button>
      </div>
    );
  }

  return <div>{/* render data */}</div>;
}
```

#### 3. Error Handling con Toast

```typescript
import { toast } from '@/lib/toast';

export function useLogin() {
  return useMutation({
    mutationFn: authService.login,
    onError: (error) => {
      const message = error instanceof APIError
        ? error.message
        : 'Error al iniciar sesión';
      toast.error(message);
    },
  });
}
```

#### 4. Error Boundary (React-level)

```typescript
import { PageErrorBoundary } from '@/components/page-error-boundary';

export function ChatPage() {
  return (
    <PageErrorBoundary fallbackMessage="Error en el chat">
      <ChatInterface />
    </PageErrorBoundary>
  );
}
```

### Tipos de Errores en TicoBot

```typescript
import { APIError } from '@/lib/api/client';

// APIError incluye:
error.message;      // Mensaje de error
error.statusCode;   // Código HTTP (404, 500, etc.)
error.response;     // Respuesta completa del servidor

// Ejemplo de manejo
if (error instanceof APIError) {
  if (error.statusCode === 401) {
    // Redirigir a login
  } else if (error.statusCode === 429) {
    toast.error('Límite de solicitudes excedido');
  } else {
    toast.error(error.message);
  }
}
```

---

## Loading States

### Estados de Loading en Queries

```typescript
export function DocumentsPage() {
  const { data, isLoading, isFetching } = useDocuments();

  // isLoading - Primera carga (sin datos en cache)
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div>
      {/* isFetching - Refetch en background (datos en cache existen) */}
      {isFetching && <div className="loading-indicator">Actualizando...</div>}

      {data.documents.map(doc => <DocumentCard key={doc.id} {...doc} />)}
    </div>
  );
}
```

### Loading States en Mutations

```typescript
export function ChatInput() {
  const chatMutation = useChat();

  return (
    <button
      onClick={handleSend}
      disabled={chatMutation.isPending}
    >
      {chatMutation.isPending ? (
        <>
          <Spinner />
          Enviando...
        </>
      ) : (
        'Enviar'
      )}
    </button>
  );
}
```

### Skeleton Loaders

```typescript
import { Skeleton } from '@/components/ui/skeleton';

export function DocumentsPage() {
  const { data, isLoading } = useDocuments();

  if (isLoading) {
    return (
      <div className="grid gap-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <Skeleton className="h-32" />
          </Card>
        ))}
      </div>
    );
  }

  return <div>{/* render data */}</div>;
}
```

---

## Cache Invalidation

### ¿Cuándo Invalidar Cache?

Invalida cache cuando los datos en el servidor cambian:

```typescript
export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => documentsService.delete(id),
    onSuccess: () => {
      // Invalidar lista de documentos
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
      toast.success('Documento eliminado');
    },
  });
}
```

### Estrategias de Invalidación

#### 1. Invalidar Todo un Dominio

```typescript
// Invalida TODAS las queries de documents
queryClient.invalidateQueries({ queryKey: documentKeys.all });
```

#### 2. Invalidar Queries Específicas

```typescript
// Solo invalida listas de documents
queryClient.invalidateQueries({ queryKey: documentKeys.lists() });

// Solo invalida un document específico
queryClient.invalidateQueries({ queryKey: documentKeys.detail(id) });
```

#### 3. Invalidar Múltiples Dominios

```typescript
export function useLogout() {
  return useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      // Invalidar datos de usuario
      queryClient.invalidateQueries({ queryKey: authKeys.all });
      // Invalidar datos que requieren autenticación
      queryClient.invalidateQueries({ queryKey: chatKeys.all });
    },
  });
}
```

### Remove vs Invalidate

```typescript
// invalidateQueries - Marca como stale, refetch automático
queryClient.invalidateQueries({ queryKey: documentKeys.all });

// removeQueries - Elimina completamente del cache
queryClient.removeQueries({ queryKey: authKeys.user() });

// clear - Elimina TODO el cache (usar con cuidado)
queryClient.clear(); // ⚠️ Muy agresivo, evitar
```

---

## Optimistic Updates

### ¿Qué son Optimistic Updates?

Actualizar la UI ANTES de que el servidor responda, para mejor UX.

### Implementación Básica

```typescript
export function useLikeDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => documentsService.like(id),

    // 1. onMutate - Ejecuta ANTES de mutationFn
    onMutate: async (id) => {
      // Cancelar queries en progreso para evitar conflictos
      await queryClient.cancelQueries({ queryKey: documentKeys.detail(id) });

      // Guardar valor anterior (para rollback)
      const previousDocument = queryClient.getQueryData(documentKeys.detail(id));

      // Actualizar cache optimistamente
      queryClient.setQueryData(documentKeys.detail(id), (old: Document) => ({
        ...old,
        likes: old.likes + 1,
        isLiked: true,
      }));

      // Retornar contexto para rollback
      return { previousDocument };
    },

    // 2. onError - Rollback si falla
    onError: (err, id, context) => {
      if (context?.previousDocument) {
        queryClient.setQueryData(
          documentKeys.detail(id),
          context.previousDocument
        );
      }
      toast.error('Error al dar like');
    },

    // 3. onSuccess - Sincronizar con servidor
    onSuccess: (data, id) => {
      // Actualizar con datos reales del servidor
      queryClient.setQueryData(documentKeys.detail(id), data);
    },

    // 4. onSettled - Siempre ejecuta (éxito o error)
    onSettled: (data, error, id) => {
      // Invalidar para asegurar sincronización
      queryClient.invalidateQueries({ queryKey: documentKeys.detail(id) });
    },
  });
}
```

### Ejemplo: Optimistic Chat Message

```typescript
export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: chatService.send,

    onMutate: async (message) => {
      await queryClient.cancelQueries({ queryKey: chatKeys.history() });

      const previousMessages = queryClient.getQueryData(chatKeys.history());

      // Agregar mensaje con ID temporal
      queryClient.setQueryData(chatKeys.history(), (old: Message[]) => [
        ...old,
        {
          id: `temp-${Date.now()}`,
          content: message.content,
          role: 'user',
          timestamp: new Date(),
          status: 'sending',
        },
      ]);

      return { previousMessages };
    },

    onError: (err, variables, context) => {
      // Rollback
      queryClient.setQueryData(chatKeys.history(), context.previousMessages);
      toast.error('Error al enviar mensaje');
    },

    onSuccess: (data) => {
      // Reemplazar mensaje temporal con real
      queryClient.setQueryData(chatKeys.history(), (old: Message[]) =>
        old.map(msg =>
          msg.status === 'sending' ? { ...msg, ...data, status: 'sent' } : msg
        )
      );
    },
  });
}
```

---

## Patrones Comunes

### 1. Prefetching (Pre-cargar datos)

```typescript
import { usePrefetchDocument } from '@/lib/hooks';

export function DocumentCard({ id, title }: Document) {
  const prefetch = usePrefetchDocument();

  return (
    <Card onMouseEnter={() => prefetch(id)}>
      <h3>{title}</h3>
    </Card>
  );
}

// Hook de prefetch
export function usePrefetchDocument() {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: documentKeys.detail(id),
      queryFn: () => documentsService.getById(id),
      staleTime: 10 * 60 * 1000,
    });
  };
}
```

### 2. Infinite Queries (Scroll infinito)

```typescript
import { useInfiniteQuery } from '@tanstack/react-query';

export function useDocumentsInfinite() {
  return useInfiniteQuery({
    queryKey: documentKeys.lists(),
    queryFn: ({ pageParam = 1 }) => documentsService.list({ page: pageParam }),
    getNextPageParam: (lastPage) => lastPage.pagination.nextPage ?? undefined,
    initialPageParam: 1,
  });
}

// Uso en componente
export function DocumentsList() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useDocumentsInfinite();

  return (
    <div>
      {data.pages.map(page =>
        page.documents.map(doc => <DocumentCard key={doc.id} {...doc} />)
      )}

      {hasNextPage && (
        <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
          {isFetchingNextPage ? 'Cargando...' : 'Cargar más'}
        </button>
      )}
    </div>
  );
}
```

### 3. Dependent Queries (Queries Encadenadas)

```typescript
export function useDocumentWithAuthor(docId: string) {
  // 1. Cargar documento
  const { data: document } = useDocument(docId);

  // 2. Cargar autor solo cuando tengamos el documento
  const { data: author } = useQuery({
    queryKey: ['author', document?.authorId],
    queryFn: () => authorsService.getById(document.authorId),
    enabled: !!document?.authorId,
  });

  return { document, author };
}
```

### 4. Parallel Queries (Queries en Paralelo)

```typescript
export function DashboardPage() {
  // Todas estas queries se ejecutan en paralelo
  const documents = useDocuments();
  const stats = useStatistics();
  const health = useHealth();

  // Esperar a que todas terminen
  if (documents.isLoading || stats.isLoading || health.isLoading) {
    return <Loading />;
  }

  return (
    <div>
      <Stats data={stats.data} />
      <HealthStatus status={health.data} />
      <DocumentsList documents={documents.data} />
    </div>
  );
}
```

### 5. Background Refetching

```typescript
export function useHealthMonitor() {
  return useQuery({
    queryKey: healthKeys.check(),
    queryFn: healthService.check,
    refetchInterval: 30 * 1000,  // Refetch cada 30 segundos
    refetchIntervalInBackground: true,  // Incluso si tab está en background
  });
}
```

---

## Ejemplos Prácticos

### Ejemplo 1: Lista de Documentos con Búsqueda

```typescript
export function DocumentsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error } = useDocuments({
    search,
    page
  });

  if (isLoading) {
    return <DocumentsSkeleton />;
  }

  if (isError) {
    return (
      <ErrorCard
        message={error.message}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div>
      <SearchInput value={search} onChange={setSearch} />

      <div className="grid gap-4">
        {data.documents.map(doc => (
          <DocumentCard key={doc.id} {...doc} />
        ))}
      </div>

      <Pagination
        current={page}
        total={data.pagination.totalPages}
        onChange={setPage}
      />
    </div>
  );
}
```

### Ejemplo 2: Chat con Streaming

```typescript
export function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');

  const chatMutation = useChat();

  const handleSend = () => {
    // Agregar mensaje del usuario
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    // Enviar a API
    chatMutation.mutate(
      { query: input },
      {
        onSuccess: (data) => {
          // Agregar respuesta del bot
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: data.answer,
            sources: data.sources,
          }]);
        },
      }
    );
  };

  return (
    <div className="chat-container">
      <MessageList messages={messages} />

      <ChatInput
        value={input}
        onChange={setInput}
        onSend={handleSend}
        disabled={chatMutation.isPending}
      />

      {chatMutation.isPending && <TypingIndicator />}
    </div>
  );
}
```

### Ejemplo 3: Login con Optimistic Updates

```typescript
export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const loginMutation = useLogin();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      await loginMutation.mutateAsync({ email, password });
      router.push('/dashboard');
    } catch (error) {
      // Error ya mostrado por toast en onError
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />
      <Input
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />
      <Button
        type="submit"
        disabled={loginMutation.isPending}
      >
        {loginMutation.isPending ? 'Iniciando sesión...' : 'Iniciar sesión'}
      </Button>
    </form>
  );
}
```

---

## Troubleshooting

### Problema 1: Query no se ejecuta

**Síntoma:** `data` permanece undefined y `isLoading` es false.

**Causas comunes:**
- `enabled` está en false
- Query key cambió inesperadamente
- Error en queryFn que no se está manejando

**Solución:**
```typescript
const { data, isLoading, fetchStatus } = useDocuments();

console.log({
  isLoading,      // false si está disabled
  fetchStatus,    // 'idle' si está disabled, 'fetching' si ejecutando
});

// Verificar enabled
const { data } = useDocuments({ enabled: true }); // ✅
```

### Problema 2: Re-renders excesivos

**Síntoma:** Componente se re-renderiza muchas veces.

**Causas:**
- Query key no estable (nuevo objeto cada render)
- No usar queryKeys factory

**Solución:**
```typescript
// ❌ MAL - Crea nuevo objeto cada render
const { data } = useQuery({
  queryKey: ['documents', { page: 1 }],  // Nuevo objeto cada vez
  // ...
});

// ✅ BIEN - Usa factory que retorna array estable
const { data } = useQuery({
  queryKey: documentKeys.list({ page: 1 }),  // Estable
  // ...
});
```

### Problema 3: Cache no se invalida

**Síntoma:** Datos viejos después de mutation.

**Causas:**
- Query key no coincide
- Invalidación no en onSuccess

**Solución:**
```typescript
// ✅ Invalidar en onSuccess
export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: documentsService.delete,
    onSuccess: () => {
      // Asegurar que query key coincide
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
    },
  });
}
```

### Problema 4: Mutation no retorna datos

**Síntoma:** `data` es undefined después de mutation exitosa.

**Causa:** Backend no retorna datos en respuesta.

**Solución:**
```typescript
// Asegurar que backend retorna datos
export const deleteDocument = async (id: string) => {
  const response = await api.delete(`/documents/${id}`);
  return response; // ✅ Retornar respuesta
};

// O setear manualmente
onSuccess: (_, id) => {
  queryClient.setQueryData(documentKeys.detail(id), null);
},
```

### Problema 5: Error de TypeScript con query keys

**Síntoma:** `Type 'readonly ["documents"]' is not assignable to type 'string[]'`

**Causa:** No usar `as const` en query keys.

**Solución:**
```typescript
// ❌ MAL
export const documentKeys = {
  all: ['documents'],  // Type: string[]
};

// ✅ BIEN
export const documentKeys = {
  all: ['documents'] as const,  // Type: readonly ["documents"]
};
```

---

## Recursos Adicionales

### Documentación Oficial
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [React Query Best Practices](https://tkdodo.eu/blog/practical-react-query)

### En TicoBot
- `/frontend/lib/hooks/` - Todos los hooks de queries
- `/frontend/lib/api/services/` - Servicios API
- `/frontend/lib/hooks/query-keys.ts` - Query keys centralizados
- `/frontend/components/providers/query-provider.tsx` - Configuración global

### Próximos Pasos
- Implementar testing de queries
- Agregar metrics de performance
- Configurar cache persistence
- Agregar error tracking (Sentry)

---

**Última actualización:** Diciembre 2024
**Autor:** Claude Code + Juan (TicoBot Team)
**Versión:** 1.0.0