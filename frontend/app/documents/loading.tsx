import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"

export default function DocumentsLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header Skeleton */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-32" />
            <div className="hidden gap-6 md:flex">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Page Header Skeleton */}
        <div className="mb-8">
          <Skeleton className="mb-2 h-9 w-80" />
          <Skeleton className="h-5 w-96" />
        </div>

        {/* Stats Skeleton */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="py-4">
              <CardContent>
                <Skeleton className="mb-2 h-8 w-16" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search Controls Skeleton */}
        <div className="mb-6 flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Grid Skeleton */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="mb-3 size-12 rounded-lg" />
                <Skeleton className="mb-2 h-5 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </CardContent>
              <CardFooter>
                <Skeleton className="h-9 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
