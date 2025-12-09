import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ExternalLink, Users, Calendar, MapPin, Award } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getPartyById, getCandidatesByPartyId } from "@/lib/data/parties"

export default function PartyPage({ params }: { params: { id: string } }) {
  const party = getPartyById(params.id)
  const candidates = getCandidatesByPartyId(params.id)

  if (!party) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}

      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button variant="ghost" size="sm" asChild className="mb-6">
          <Link href="/">
            <ArrowLeft className="mr-2 size-4" />
            Volver a inicio
          </Link>
        </Button>

        {/* Party Header */}
        <div className="mb-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="flex-1">
              <div className="mb-4 flex items-center gap-4">
                <div className="flex size-20 items-center justify-center rounded-xl bg-muted">
                  <span className="text-3xl font-bold text-muted-foreground">{party.abbr.charAt(0)}</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold">{party.name}</h1>
                  <p className="mt-1 text-lg text-muted-foreground">{party.abbr}</p>
                </div>
              </div>
              <p className="max-w-3xl text-pretty leading-relaxed text-muted-foreground">{party.description}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {party.ideology.map((ideology) => (
                <Badge key={ideology} variant="secondary">
                  {ideology}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10">
                  <Calendar className="size-6 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{party.founded}</div>
                  <div className="text-sm text-muted-foreground">Año de fundación</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-lg bg-teal-500/10">
                  <Users className="size-6 text-teal-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{party.currentRepresentation.deputies}</div>
                  <div className="text-sm text-muted-foreground">Diputados actuales</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-lg bg-blue-500/10">
                  <MapPin className="size-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{party.currentRepresentation.mayors}</div>
                  <div className="text-sm text-muted-foreground">Alcaldías</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-lg bg-amber-500/10">
                  <Award className="size-6 text-amber-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{new Date().getFullYear() - party.founded}</div>
                  <div className="text-sm text-muted-foreground">Años de historia</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            {/* History Section */}
            <Card>
              <CardHeader>
                <CardTitle>Historia del partido</CardTitle>
                <CardDescription>Momentos clave en la trayectoria del {party.abbr}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {party.history.map((event, index) => (
                    <div
                      key={index}
                      className="relative pl-8 before:absolute before:left-2 before:top-2 before:size-2 before:rounded-full before:bg-primary after:absolute after:left-[9px] after:top-4 after:h-[calc(100%+0.5rem)] after:w-px after:bg-border last:after:hidden"
                    >
                      <div className="mb-1 font-semibold text-primary">{event.year}</div>
                      <p className="text-sm leading-relaxed text-muted-foreground">{event.event}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Candidates Section */}
            <Card>
              <CardHeader>
                <CardTitle>Candidatos actuales</CardTitle>
                <CardDescription>Representantes del {party.abbr} para las elecciones 2026</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {candidates.map((candidate) => (
                    <Link
                      key={candidate.id}
                      href={`/candidate/${candidate.id}`}
                      className="group flex items-center gap-4 rounded-lg border border-border p-4 transition-all hover:border-primary hover:shadow-md"
                    >
                      <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-muted">
                        <span className="text-2xl font-bold text-muted-foreground">
                          {candidate.name.split(" ")[0].charAt(0)}
                          {candidate.name.split(" ")[1]?.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold group-hover:text-primary">{candidate.name}</h3>
                        <p className="text-sm text-muted-foreground">{candidate.position}</p>
                      </div>
                      <ExternalLink className="size-5 text-muted-foreground group-hover:text-primary" />
                    </Link>
                  ))}
                  {candidates.length === 0 && (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      No hay candidatos registrados para este partido
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Acciones rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start bg-transparent" asChild>
                  <Link href={`/compare?party=${party.id}`}>
                    <ExternalLink className="mr-2 size-4" />
                    Comparar propuestas
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent" asChild>
                  <Link href="/documents">
                    <ExternalLink className="mr-2 size-4" />
                    Ver documentos
                  </Link>
                </Button>
                {party.website && (
                  <Button variant="outline" className="w-full justify-start bg-transparent" asChild>
                    <a href={party.website} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 size-4" />
                      Sitio web oficial
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Party Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Información general</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <div className="mb-1 font-medium">Fundación</div>
                  <div className="text-muted-foreground">{party.founded}</div>
                </div>
                <div>
                  <div className="mb-1 font-medium">Ideología</div>
                  <div className="flex flex-wrap gap-1">
                    {party.ideology.map((ideology) => (
                      <Badge key={ideology} variant="secondary" className="text-xs">
                        {ideology}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="mb-1 font-medium">Representación actual</div>
                  <div className="text-muted-foreground">
                    {party.currentRepresentation.deputies} diputados • {party.currentRepresentation.mayors} alcaldías
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
