import { Spinner } from "@/components/ui/spinner"

export default function ComponentsLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        <Spinner className="h-8 w-8 mx-auto" />
        <p className="text-sm text-muted-foreground">Cargando componentes...</p>
      </div>
    </div>
  )
}
