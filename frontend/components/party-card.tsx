import Link from "next/link"
import type { Party, Candidate } from "@/lib/api/services/parties"

interface PartyCardProps {
  party: Party
  candidate?: Candidate
}

export function PartyCard({ party, candidate }: PartyCardProps) {
  const primaryColor = party.colors?.primary || '#6b7280'
  const secondaryColor = party.colors?.secondary || '#9ca3af'

  return (
    <Link
      href={`/party/${party.slug}`}
      className="group block rounded-lg border border-border bg-card transition-all hover:shadow-lg"
    >
      {/* Información del partido y candidato */}
      <div className="p-4 overflow-hidden">
        {/* Nombre del partido con bandera */}
        <div className="mb-4 flex flex-col items-center justify-center gap-2">
          <h3 className="text-center font-semibold group-hover:text-primary">{party.name}</h3>
          {/* Bandera con colores del partido */}
          <div
            className="h-1 w-full rounded-sm"
            style={{
              background: `linear-gradient(to right, ${primaryColor} 0%, ${primaryColor} 50%, ${secondaryColor} 50%, ${secondaryColor} 100%)`
            }}
          />
        </div>

        {/* Candidato presidencial */}
        {candidate && (
          <div className="flex flex-col items-center gap-3">
            {candidate.photo_url ? (
              <div className="relative flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-border bg-muted">
                <img
                  src={candidate.photo_url}
                  alt={candidate.name}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `<span class="text-xl font-bold text-muted-foreground">${candidate.name.split(" ")[0].charAt(0)}${candidate.name.split(" ")[1]?.charAt(0) || ''}</span>`;
                    }
                  }}
                />
              </div>
            ) : (
              <div className="flex size-24 shrink-0 items-center justify-center rounded-full border-2 border-border bg-muted">
                <span className="text-xl font-bold text-muted-foreground">
                  {candidate.name.split(" ")[0].charAt(0)}
                  {candidate.name.split(" ")[1]?.charAt(0) || ''}
                </span>
              </div>
            )}
            <div className="text-center">
              <p className="font-medium">{candidate.name}</p>
              <p className="text-xs text-muted-foreground">Candidato a Presidente</p>
            </div>
          </div>
        )}

        {!candidate && (
          <p className="text-xs text-muted-foreground">Ver propuestas y documentos</p>
        )}
      </div>
    </Link>
  )
}
