export type Party = {
  id: string
  name: string
  abbr: string
  founded: number
  ideology: string[]
  colors: {
    primary: string
    secondary: string
  }
  logo?: string
  description: string
  website?: string
  socialMedia?: {
    twitter?: string
    facebook?: string
    instagram?: string
  }
  history: {
    year: number
    event: string
  }[]
  currentRepresentation: {
    deputies: number
    mayors: number
  }
}

export type Candidate = {
  id: string
  name: string
  partyId: string
  position: string
  photo?: string
  birthDate: string
  birthPlace: string
  education: string[]
  professionalExperience: string[]
  politicalExperience: string[]
  proposals: {
    topic: string
    description: string
  }[]
  biography: string
}

export const PARTIES_DATA: Party[] = [
  {
    id: "pln",
    name: "Partido Liberación Nacional",
    abbr: "PLN",
    founded: 1951,
    ideology: ["Socialdemocracia", "Progresismo", "Centro-izquierda"],
    colors: {
      primary: "#006633",
      secondary: "#FFFFFF",
    },
    description:
      "El Partido Liberación Nacional es una organización política costarricense de ideología socialdemócrata, fundada por José Figueres Ferrer en 1951.",
    website: "https://www.pln.cr",
    history: [
      {
        year: 1951,
        event: "Fundación del partido por José Figueres Ferrer tras la Guerra Civil de 1948",
      },
      {
        year: 1953,
        event: "Primera victoria electoral con José Figueres Ferrer como presidente",
      },
      {
        year: 1974,
        event: "Daniel Oduber Quirós gana la presidencia e impulsa reformas sociales importantes",
      },
      {
        year: 1986,
        event: "Óscar Arias Sánchez es elegido presidente y más tarde gana el Premio Nobel de la Paz",
      },
      {
        year: 2014,
        event: "Luis Guillermo Solís gana la presidencia en segunda ronda electoral",
      },
    ],
    currentRepresentation: {
      deputies: 17,
      mayors: 23,
    },
  },
]

export const CANDIDATES_DATA: Candidate[] = [
  {
    id: "jose-maria-figueres",
    name: "José María Figueres Olsen",
    partyId: "pln",
    position: "Candidato a Presidente",
    birthDate: "1954-12-24",
    birthPlace: "San José, Costa Rica",
    education: [
      "Bachillerato en Ingeniería Industrial - Academia Militar de West Point, Estados Unidos",
      "Maestría en Administración Pública - Universidad de Harvard, Estados Unidos",
    ],
    professionalExperience: [
      "Consultor internacional en temas de desarrollo sostenible y gobernanza",
      "Presidente del Foro Económico Mundial para América Latina",
      "Director de varias empresas tecnológicas y de sostenibilidad",
    ],
    politicalExperience: [
      "Presidente de Costa Rica (1994-1998)",
      "Ministro de Agricultura y Ganadería (1992-1994)",
      "Diputado de la Asamblea Legislativa",
    ],
    biography:
      "José María Figueres Olsen es hijo del tres veces presidente José Figueres Ferrer, fundador del PLN. Durante su presidencia (1994-1998), impulsó la modernización del Estado y la integración de Costa Rica en la economía global. Es reconocido internacionalmente por su trabajo en desarrollo sostenible y ha sido asesor de organismos multilaterales.",
    proposals: [
      {
        topic: "Educación",
        description:
          "Implementación de tecnología en todas las aulas, programa nacional de inglés desde preescolar, y aumento del presupuesto educativo al 8% del PIB",
      },
      {
        topic: "Economía",
        description:
          "Atracción de inversión extranjera en sectores tecnológicos, apoyo a PYMES con financiamiento accesible, y modernización de la infraestructura productiva",
      },
      {
        topic: "Salud",
        description:
          "Digitalización completa del expediente médico, reducción de tiempos de espera en 50%, y programas de prevención de enfermedades crónicas",
      },
      {
        topic: "Ambiente",
        description:
          "Compromiso de carbono neutralidad para 2030, protección de áreas protegidas, e incentivos para energías renovables",
      },
    ],
  },
]

export function getPartyById(id: string): Party | undefined {
  return PARTIES_DATA.find((party) => party.id === id)
}

export function getCandidateById(id: string): Candidate | undefined {
  return CANDIDATES_DATA.find((candidate) => candidate.id === id)
}

export function getCandidatesByPartyId(partyId: string): Candidate[] {
  return CANDIDATES_DATA.filter((candidate) => candidate.partyId === partyId)
}
