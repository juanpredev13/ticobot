export type BlogPost = {
  id: string
  title: string
  excerpt: string
  content: string
  author: {
    name: string
    role: string
  }
  publishedDate: string
  category: string
  readTime: number
  featured: boolean
  coverImage?: string
  tags: string[]
}

export const BLOG_CATEGORIES = [
  "Análisis Electoral",
  "Educación Cívica",
  "Metodología",
  "Actualidad Política",
  "Transparencia",
]

export const BLOG_DATA: BlogPost[] = [
  {
    id: "como-comparar-propuestas-politicas",
    title: "Cómo comparar propuestas políticas de manera efectiva",
    excerpt:
      "Una guía práctica para entender y comparar las propuestas de los partidos políticos utilizando fuentes verificadas y metodología neutral.",
    content: `
# Cómo comparar propuestas políticas de manera efectiva

Comparar propuestas políticas puede parecer abrumador, especialmente durante las temporadas electorales cuando la información es abundante y a veces contradictoria. En TicoBot, creemos que una comparación efectiva debe basarse en hechos verificables y una metodología clara.

## 1. Identifica tus temas de interés

Antes de comparar, define cuáles son los temas que más te importan: educación, salud, empleo, seguridad, ambiente, etc. Esto te ayudará a enfocarte en la información relevante para ti.

## 2. Busca fuentes primarias

Siempre que sea posible, consulta los documentos oficiales de los partidos políticos. Los planes de gobierno, propuestas electorales y manifiestos son las fuentes más confiables para entender las posiciones de cada partido.

## 3. Compara punto por punto

No te quedes solo con el eslogan o la promesa general. Analiza:
- ¿Qué proponen específicamente?
- ¿Cómo planean implementarlo?
- ¿Qué recursos requiere?
- ¿Qué precedentes existen?

## 4. Verifica la coherencia

Revisa si las propuestas son coherentes con:
- La historia del partido
- Las acciones previas de sus líderes
- El contexto presupuestario del país
- Las leyes y regulaciones vigentes

## 5. Usa herramientas neutras

Plataformas como TicoBot te permiten comparar propuestas lado a lado, con citas directas de documentos oficiales. Esto elimina el sesgo y te da el control sobre tu análisis.

## Conclusión

Una comparación efectiva requiere tiempo y dedicación, pero es fundamental para tomar decisiones informadas. Recuerda que el objetivo no es encontrar el partido "perfecto", sino aquel cuyas propuestas se alinean mejor con tus valores y prioridades.
    `,
    author: {
      name: "Equipo TicoBot",
      role: "Análisis Electoral",
    },
    publishedDate: "2024-11-15",
    category: "Educación Cívica",
    readTime: 5,
    featured: true,
    tags: ["comparación", "metodología", "análisis"],
  },
  {
    id: "metodologia-analisis-documentos",
    title: "Nuestra metodología para analizar documentos políticos",
    excerpt:
      "Descubre cómo TicoBot procesa, verifica y presenta la información de los documentos oficiales de los partidos políticos.",
    content: `
# Nuestra metodología para analizar documentos políticos

En TicoBot, la transparencia de nuestros procesos es tan importante como la información que proporcionamos. Aquí explicamos cómo analizamos los documentos políticos.

## Recopilación de documentos

Recopilamos únicamente documentos oficiales:
- Planes de gobierno registrados ante el TSE
- Propuestas publicadas en sitios web oficiales
- Manifiestos y declaraciones formales
- Entrevistas y debates oficiales

## Procesamiento con IA

Utilizamos inteligencia artificial para:
1. Extraer propuestas específicas de documentos extensos
2. Categorizar información por temas
3. Identificar citas relevantes
4. Detectar contradicciones o inconsistencias

## Verificación humana

Cada análisis de IA es revisado por nuestro equipo para:
- Confirmar la precisión de las citas
- Verificar el contexto adecuado
- Asegurar neutralidad en la presentación
- Eliminar interpretaciones sesgadas

## Actualización continua

Los partidos pueden actualizar sus propuestas durante la campaña. Nosotros:
- Monitoreamos cambios en documentos oficiales
- Actualizamos nuestra base de datos mensualmente
- Indicamos la fecha de última actualización
- Mantenemos un registro de cambios significativos

## Compromiso con la neutralidad

Nuestro equipo incluye personas de diferentes ideologías políticas para asegurar que:
- No se favorezca a ningún partido
- Todas las propuestas reciban el mismo tratamiento
- Las comparaciones sean justas y balanceadas
- La información sea accesible por igual

## Código abierto

Nuestra metodología está documentada y disponible para escrutinio público. Creemos en la transparencia total de nuestros procesos.
    `,
    author: {
      name: "Equipo TicoBot",
      role: "Metodología",
    },
    publishedDate: "2024-11-10",
    category: "Metodología",
    readTime: 7,
    featured: true,
    tags: ["metodología", "transparencia", "IA"],
  },
  {
    id: "importancia-voto-informado",
    title: "La importancia del voto informado en democracia",
    excerpt:
      "Reflexiones sobre cómo el acceso a información neutral y verificada fortalece nuestra democracia y mejora la toma de decisiones.",
    content: `
# La importancia del voto informado en democracia

La democracia no termina en el acto de votar; comienza con la información que tenemos para tomar esa decisión.

## Más allá de las emociones

Las campañas políticas están diseñadas para generar emociones: esperanza, miedo, entusiasmo, indignación. Estas emociones son válidas, pero no deben ser la única base para decidir nuestro voto.

Un voto informado considera:
- Propuestas concretas
- Viabilidad de implementación
- Historial de los candidatos
- Coherencia ideológica
- Recursos necesarios

## El desafío de la información

Vivimos en una era de sobrecarga informativa. Cada día recibimos cientos de mensajes políticos a través de:
- Redes sociales
- Medios tradicionales
- WhatsApp y grupos de chat
- Publicidad política
- Amigos y familia

No toda esta información es precisa, neutral o verificada.

## Herramientas para decidir mejor

Plataformas como TicoBot existen para facilitar el acceso a información verificada:
- Documentos oficiales en un solo lugar
- Comparaciones neutrales sin sesgo
- Citas con fuentes verificables
- Análisis basados en hechos

## Tu responsabilidad cívica

Informarte antes de votar es parte de tu responsabilidad como ciudadano. No porque sea una obligación legal, sino porque tus decisiones afectan:
- El futuro de tu comunidad
- Las oportunidades de las próximas generaciones
- La dirección del país
- La calidad de vida de millones

## Conclusión

Un voto informado es un voto poderoso. Es la diferencia entre elegir por impulso y elegir por convicción. Es el fundamento de una democracia saludable.
    `,
    author: {
      name: "Equipo TicoBot",
      role: "Educación Cívica",
    },
    publishedDate: "2024-11-05",
    category: "Educación Cívica",
    readTime: 6,
    featured: false,
    tags: ["democracia", "ciudadanía", "educación"],
  },
  {
    id: "cambios-propuestas-2026",
    title: "Principales cambios en las propuestas para las elecciones 2026",
    excerpt:
      "Un análisis de cómo han evolucionado las propuestas políticas en Costa Rica y qué nuevos temas dominan el debate electoral.",
    content: `
# Principales cambios en las propuestas para las elecciones 2026

Las elecciones de 2026 presentan un panorama político distinto al de ciclos anteriores. Nuevos desafíos y prioridades están moldeando las propuestas de los partidos.

## Nuevos temas prioritarios

### Transformación digital
Casi todos los partidos incluyen propuestas sobre:
- Gobierno digital
- Educación tecnológica
- Ciberseguridad
- Teletrabajo

### Crisis climática
El cambio climático ya no es un tema secundario:
- Energías renovables
- Protección de recursos hídricos
- Adaptación a eventos extremos
- Economía circular

### Salud mental
Por primera vez, varios partidos proponen:
- Programas de salud mental en CCSS
- Prevención de suicidio
- Atención a burnout laboral
- Apoyo psicológico en escuelas

## Evolución de temas tradicionales

### Seguridad
Más allá de "mano dura":
- Prevención basada en evidencia
- Reinserción social
- Inteligencia policial
- Justicia restaurativa

### Economía
Enfoque en inclusión:
- Empleo para jóvenes
- Apoyo a emprendimientos
- Economía social y solidaria
- Reducción de desigualdad

## Propuestas innovadoras

Algunos partidos están experimentando con:
- Renta básica universal
- Semana laboral de 4 días
- Cannabis medicinal
- Reforma educativa integral

## Lo que sigue igual

A pesar de los cambios, algunos temas permanecen:
- Lucha contra la corrupción
- Mejora del sistema de salud
- Infraestructura vial
- Educación de calidad

## Conclusión

El panorama electoral de 2026 refleja un país en transformación. Las propuestas son más diversas, específicas y orientadas a desafíos contemporáneos. Como votantes, debemos evaluar no solo qué prometen, sino cómo planean lograrlo.
    `,
    author: {
      name: "Equipo TicoBot",
      role: "Análisis Electoral",
    },
    publishedDate: "2024-10-28",
    category: "Análisis Electoral",
    readTime: 8,
    featured: false,
    tags: ["elecciones 2026", "propuestas", "análisis"],
  },
]

export function getBlogPostById(id: string): BlogPost | undefined {
  return BLOG_DATA.find((post) => post.id === id)
}

export function getBlogPostsByCategory(category: string): BlogPost[] {
  return BLOG_DATA.filter((post) => post.category === category)
}

export function getFeaturedPosts(): BlogPost[] {
  return BLOG_DATA.filter((post) => post.featured)
}
