'use client'

/**
 * Global Error Boundary
 * 
 * This component handles errors that occur in the root layout.
 * It does NOT use any client providers to avoid build-time errors.
 * 
 * See: https://nextjs.org/docs/app/api-reference/file-conventions/error-handling
 */

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="es">
      <body>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '2rem',
          textAlign: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>
            Algo salió mal
          </h1>
          <p style={{ marginBottom: '2rem', color: '#666' }}>
            Ha ocurrido un error inesperado. Por favor, intenta recargar la página.
          </p>
          <button
            onClick={reset}
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              backgroundColor: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
            }}
          >
            Intentar de nuevo
          </button>
          {process.env.NODE_ENV === 'development' && error.digest && (
            <p style={{ marginTop: '2rem', fontSize: '0.875rem', color: '#999' }}>
              Error ID: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  )
}

