// Force dynamic rendering to avoid static generation issues with React Query
export const dynamic = 'force-dynamic'

export default function NotFound() {
  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h2>404 - Página No Encontrada</h2>
      <p>Lo sentimos, la página que buscas no existe.</p>
      <a href="/" style={{ color: '#0070f3', textDecoration: 'underline' }}>
        Volver al inicio
      </a>
    </div>
  )
}
