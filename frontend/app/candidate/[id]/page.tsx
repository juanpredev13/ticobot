"use client"

import { use } from "react"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Calendar, MapPin, GraduationCap, Briefcase, Target, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useCandidateBySlug } from "@/lib/hooks"
import { SiteHeader } from "@/components/site-header"

export default function CandidatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data, isLoading, isError } = useCandidateBySlug(id)

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="mb-6 h-10 w-32" />
          <div className="mb-8">
            <Skeleton className="mb-4 h-32 w-full" />
          </div>
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-8 lg:col-span-2">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-48" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-24 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="space-y-6">
              {[...Array(2)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-32" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-32 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (isError || !data?.candidate) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="container mx-auto px-4 py-8">
          <Card className="border-destructive">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <AlertCircle className="mb-4 size-12 text-destructive" />
              <h3 className="mb-2 text-lg font-semibold">Error al cargar el candidato</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                No se pudo cargar la información del candidato
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

  const candidate = data.candidate
  const party = data.party
  const abbreviation = party?.abbreviation || party?.slug.toUpperCase() || ''

  const age = candidate.birth_date
    ? new Date().getFullYear() - new Date(candidate.birth_date).getFullYear()
    : null

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        {party && (
          <Button variant="ghost" size="sm" asChild className="mb-6">
            <Link href={`/party/${party.slug}`}>
              <ArrowLeft className="mr-2 size-4" />
              Volver a {abbreviation}
            </Link>
          </Button>
        )}

        {/* Candidate Header */}
        <div className="mb-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start">
            <div className="flex size-32 shrink-0 items-center justify-center rounded-2xl bg-muted">
              <span className="text-5xl font-bold text-muted-foreground">
                {candidate.name.split(" ")[0].charAt(0)}
                {candidate.name.split(" ")[1]?.charAt(0)}
              </span>
            </div>
            <div className="flex-1">
              {party && (
                <div className="mb-2">
                  <Link
                    href={`/party/${party.slug}`}
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
                  >
                    <span className="font-medium">{abbreviation}</span>
                    <span>•</span>
                    <span>{party.name}</span>
                  </Link>
                </div>
              )}
              <h1 className="mb-2 text-3xl font-bold">{candidate.name}</h1>
              <p className="mb-4 text-lg text-muted-foreground">{candidate.position}</p>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {age !== null && (
                  <div className="flex items-center gap-2">
                    <Calendar className="size-4" />
                    <span>{age} años</span>
                  </div>
                )}
                {candidate.birth_place && (
                  <div className="flex items-center gap-2">
                    <MapPin className="size-4" />
                    <span>{candidate.birth_place}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            {/* Biography */}
            {candidate.biography && (
              <Card>
                <CardHeader>
                  <CardTitle>Biografía</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="leading-relaxed text-muted-foreground">{candidate.biography}</p>
                </CardContent>
              </Card>
            )}

            {/* Education */}
            {candidate.education && candidate.education.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <GraduationCap className="size-5 text-primary" />
                    <CardTitle>Formación académica</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {candidate.education.map((edu, index) => (
                      <li key={index} className="flex gap-2 text-sm leading-relaxed">
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                        <span className="text-muted-foreground">{edu}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Professional Experience */}
            {candidate.professional_experience && candidate.professional_experience.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Briefcase className="size-5 text-primary" />
                    <CardTitle>Experiencia profesional</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {candidate.professional_experience.map((exp, index) => (
                      <li key={index} className="flex gap-2 text-sm leading-relaxed">
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                        <span className="text-muted-foreground">{exp}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Political Experience */}
            {candidate.political_experience && candidate.political_experience.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Target className="size-5 text-primary" />
                    <CardTitle>Trayectoria política</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {candidate.political_experience.map((exp, index) => (
                      <li key={index} className="flex gap-2 text-sm leading-relaxed">
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                        <span className="text-muted-foreground">{exp}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Proposals */}
            {candidate.proposals && candidate.proposals.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Propuestas principales</CardTitle>
                  <CardDescription>Ejes de campaña del candidato</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {candidate.proposals.map((proposal, index) => (
                    <div key={index} className="space-y-2">
                      <Badge variant="secondary">{proposal.topic}</Badge>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {proposal.description}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            {party && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Más información</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start bg-transparent" asChild>
                    <Link href={`/party/${party.slug}`}>Ver perfil de {abbreviation}</Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent" asChild>
                    <Link href={`/compare?party=${party.slug}`}>Comparar propuestas</Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent" asChild>
                    <Link href="/documents">Ver documentos del partido</Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Personal Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Datos personales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                {candidate.birth_date && (
                  <div>
                    <div className="mb-1 font-medium">Fecha de nacimiento</div>
                    <div className="text-muted-foreground">
                      {new Date(candidate.birth_date).toLocaleDateString("es-CR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                )}
                {candidate.birth_place && (
                  <div>
                    <div className="mb-1 font-medium">Lugar de nacimiento</div>
                    <div className="text-muted-foreground">{candidate.birth_place}</div>
                  </div>
                )}
                {party && (
                  <div>
                    <div className="mb-1 font-medium">Partido político</div>
                    <Link href={`/party/${party.slug}`} className="text-primary hover:underline">
                      {party.name}
                    </Link>
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
