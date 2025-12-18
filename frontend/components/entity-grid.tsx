import { Loader2 } from "lucide-react"

interface EntityGridProps<T> {
  title: string
  description: string
  isLoading: boolean
  items: T[]
  renderItem: (item: T) => React.ReactNode
  skeletonCount?: number
  className?: string
}

export function EntityGrid<T extends { id: string | number }>({
  title,
  description,
  isLoading,
  items,
  renderItem,
  skeletonCount = 8,
  className = "",
}: EntityGridProps<T>) {
  return (
    <section className={`container mx-auto px-4 py-16 ${className}`}>
      <div className="mb-12 text-center">
        <h2 className="mb-4 text-3xl font-bold">{title}</h2>
        <p className="text-muted-foreground">{description}</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: skeletonCount }, (_, i) => (
            <div
              key={`skeleton-${i}`}
              className="rounded-lg border border-border bg-card p-6"
            >
              <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-muted">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
              <div className="mb-2 h-5 w-3/4 rounded bg-muted" />
              <div className="h-4 w-1/2 rounded bg-muted" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <div key={item.id}>{renderItem(item)}</div>
          ))}
        </div>
      )}
    </section>
  )
}
