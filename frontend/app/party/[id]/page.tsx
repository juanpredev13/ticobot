"use client"

import { use } from "react"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ExternalLink, Users, Calendar, MapPin, Award, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { usePartyBySlug, usePartyCandidates } from "@/lib/hooks"

export default function PartyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: partyData, isLoading: partyLoading, isError: partyError } = usePartyBySlug(id)
  const { data: candidatesData, isLoading: candidatesLoading } = usePartyCandidates(
    partyData?.party.id || '',
    !!partyData?.party.id
  )

  // Loading state
  if (partyLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="mb-6 h-10 w-32" />
          <div className="mb-8">
            <Skeleton className="mb-4 h-20 w-full" />
            <Skeleton className="h-6 w-3/4" />
          </div>
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (partyError || !partyData?.party) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Card className="border-destructive">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <AlertCircle className="mb-4 size-12 text-destructive" />
              <h3 className="mb-2 text-lg font-semibold">Error al cargar el partido</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                No se pudo cargar la información del partido
              </p>
              <Button variant="outline" asChild>
                <Link href="/">Volver a inicio</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const party = partyData.party
  const candidates = candidatesData?.candidates || []
  const abbreviation = party.abbreviation || party.slug.toUpperCase()

  return (
    <div className="min-h-screen bg-background">
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
                <div 
                  className="flex size-20 items-center justify-center rounded-xl"
                  style={{ backgroundColor: party.colors.primary + '20' }}
                >
                  <span className="text-3xl font-bold" style={{ color: party.colors.primary }}>
                    {abbreviation.charAt(0)}
                  </span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold">{party.name}</h1>
                  <p className="mt-1 text-lg text-muted-foreground">{abbreviation}</p>
                </div>
              </div>
              {party.description && (
                <p className="max-w-3xl text-pretty leading-relaxed text-muted-foreground">
                  {party.description}
                </p>
              )}
            </div>
            {party.ideology && party.ideology.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {party.ideology.map((ideology) => (
                <Badge key={ideology} variant="secondary">
                  {ideology}
                </Badge>
              ))}
            </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {party.founded_year && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10">
                  <Calendar className="size-6 text-primary" />
                </div>
                <div>
                    <div className="text-2xl font-bold">{party.founded_year}</div>
                  <div className="text-sm text-muted-foreground">Año de fundación</div>
                </div>
              </div>
            </CardContent>
          </Card>
          )}
          {party.current_representation?.deputies !== undefined && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-lg bg-teal-500/10">
                  <Users className="size-6 text-teal-600" />
                </div>
                <div>
                    <div className="text-2xl font-bold">{party.current_representation.deputies}</div>
                  <div className="text-sm text-muted-foreground">Diputados actuales</div>
                </div>
              </div>
            </CardContent>
          </Card>
          )}
          {party.current_representation?.mayors !== undefined && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-lg bg-blue-500/10">
                  <MapPin className="size-6 text-blue-600" />
                </div>
                <div>
                    <div className="text-2xl font-bold">{party.current_representation.mayors}</div>
                  <div className="text-sm text-muted-foreground">Alcaldías</div>
                </div>
              </div>
            </CardContent>
          </Card>
          )}
          {party.founded_year && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-lg bg-amber-500/10">
                  <Award className="size-6 text-amber-600" />
                </div>
                <div>
                    <div className="text-2xl font-bold">
                      {new Date().getFullYear() - party.founded_year}
                    </div>
                  <div className="text-sm text-muted-foreground">Años de historia</div>
                </div>
              </div>
            </CardContent>
          </Card>
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            {/* Candidates Section */}
            <Card>
              <CardHeader>
                <CardTitle>Candidatos actuales</CardTitle>
                <CardDescription>Representantes del {abbreviation} para las elecciones 2026</CardDescription>
              </CardHeader>
              <CardContent>
                {candidatesLoading ? (
                  <div className="space-y-4">
                    {[...Array(2)].map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : (
                <div className="space-y-4">
                  {candidates.map((candidate) => (
                    <Link
                      key={candidate.id}
                        href={`/candidate/${candidate.slug}`}
                      className="group flex items-center gap-4 rounded-lg border border-border p-4 transition-all hover:border-primary hover:shadow-md"
                    >
                        {candidate.photo_url ? (
                          <div className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
                            <img
                              src={candidate.photo_url}
                              alt={candidate.name}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                // Fallback to initials if image fails to load
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML = `<span class="text-2xl font-bold text-muted-foreground">${candidate.name.split(" ")[0].charAt(0)}${candidate.name.split(" ")[1]?.charAt(0) || ''}</span>`;
                                }
                              }}
                            />
                          </div>
                        ) : (
                      <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-muted">
                        <span className="text-2xl font-bold text-muted-foreground">
                          {candidate.name.split(" ")[0].charAt(0)}
                          {candidate.name.split(" ")[1]?.charAt(0)}
                        </span>
                      </div>
                        )}
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
                )}
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
                  <Link href={`/compare?party=${party.slug}`}>
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
                {party.founded_year && (
                <div>
                  <div className="mb-1 font-medium">Fundación</div>
                    <div className="text-muted-foreground">{party.founded_year}</div>
                </div>
                )}
                {party.ideology && party.ideology.length > 0 && (
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
                )}
                {party.current_representation && (
                <div>
                  <div className="mb-1 font-medium">Representación actual</div>
                  <div className="text-muted-foreground">
                      {party.current_representation.deputies} diputados • {party.current_representation.mayors} alcaldías
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
