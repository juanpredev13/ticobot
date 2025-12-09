import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Calendar, MapPin, GraduationCap, Briefcase, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getCandidateById, getPartyById } from "@/lib/data/parties"
import { SiteHeader } from "@/components/site-header" // Import global SiteHeader

export default function CandidatePage({ params }: { params: { id: string } }) {
  const candidate = getCandidateById(params.id)
  const party = candidate ? getPartyById(candidate.partyId) : null

  if (!candidate || !party) {
    notFound()
  }

  const age = new Date().getFullYear() - new Date(candidate.birthDate).getFullYear()

  return (
    <div className="min-h-screen bg-background">
      {/* Global Site Header */}
      <SiteHeader />

      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button variant="ghost" size="sm" asChild className="mb-6">
          <Link href={`/party/${party.id}`}>
            <ArrowLeft className="mr-2 size-4" />
            Volver a {party.abbr}
          </Link>
        </Button>

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
              <div className="mb-2">
                <Link
                  href={`/party/${party.id}`}
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
                >
                  <span className="font-medium">{party.abbr}</span>
                  <span>•</span>
                  <span>{party.name}</span>
                </Link>
              </div>
              <h1 className="mb-2 text-3xl font-bold">{candidate.name}</h1>
              <p className="mb-4 text-lg text-muted-foreground">{candidate.position}</p>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="size-4" />
                  <span>{age} años</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="size-4" />
                  <span>{candidate.birthPlace}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            {/* Biography */}
            <Card>
              <CardHeader>
                <CardTitle>Biografía</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="leading-relaxed text-muted-foreground">{candidate.biography}</p>
              </CardContent>
            </Card>

            {/* Education */}
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

            {/* Professional Experience */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Briefcase className="size-5 text-primary" />
                  <CardTitle>Experiencia profesional</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {candidate.professionalExperience.map((exp, index) => (
                    <li key={index} className="flex gap-2 text-sm leading-relaxed">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                      <span className="text-muted-foreground">{exp}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Political Experience */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Target className="size-5 text-primary" />
                  <CardTitle>Trayectoria política</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {candidate.politicalExperience.map((exp, index) => (
                    <li key={index} className="flex gap-2 text-sm leading-relaxed">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                      <span className="text-muted-foreground">{exp}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Proposals */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Propuestas principales</CardTitle>
                <CardDescription>Ejes de campaña del candidato</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {candidate.proposals.map((proposal, index) => (
                  <div key={index} className="space-y-2">
                    <Badge variant="secondary">{proposal.topic}</Badge>
                    <p className="text-sm leading-relaxed text-muted-foreground">{proposal.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Más información</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start bg-transparent" asChild>
                  <Link href={`/party/${party.id}`}>Ver perfil de {party.abbr}</Link>
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent" asChild>
                  <Link href={`/compare?party=${party.id}`}>Comparar propuestas</Link>
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent" asChild>
                  <Link href="/documents">Ver documentos del partido</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Personal Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Datos personales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <div className="mb-1 font-medium">Fecha de nacimiento</div>
                  <div className="text-muted-foreground">
                    {new Date(candidate.birthDate).toLocaleDateString("es-CR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                </div>
                <div>
                  <div className="mb-1 font-medium">Lugar de nacimiento</div>
                  <div className="text-muted-foreground">{candidate.birthPlace}</div>
                </div>
                <div>
                  <div className="mb-1 font-medium">Partido político</div>
                  <Link href={`/party/${party.id}`} className="text-primary hover:underline">
                    {party.name}
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
