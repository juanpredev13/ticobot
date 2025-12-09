import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupButton,
  InputGroupText,
} from "@/components/ui/input-group"
import { ButtonGroup, ButtonGroupText } from "@/components/ui/button-group"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty"
import { Spinner } from "@/components/ui/spinner"
import { Search, Download, Filter, FileText, Users, AlertCircle, CheckCircle2, XCircle, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function ComponentLibraryPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white dark:bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Biblioteca de Componentes TicoBot</h1>
              <p className="text-muted-foreground mt-1">Sistema de diseño neutral y accesible</p>
            </div>
            <Link href="/">
              <Button variant="outline">Volver al Inicio</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 space-y-16">
        {/* Color Palette */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Paleta de Colores Neutral</h2>
          <p className="text-muted-foreground mb-6">
            Colores diseñados para mantener neutralidad política con soporte completo para modo oscuro.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="h-24 rounded-lg bg-primary border" />
              <p className="text-sm font-medium">Primary</p>
              <p className="text-xs text-muted-foreground">Azul-gris neutral</p>
            </div>
            <div className="space-y-2">
              <div className="h-24 rounded-lg bg-accent border" />
              <p className="text-sm font-medium">Accent</p>
              <p className="text-xs text-muted-foreground">Teal neutral</p>
            </div>
            <div className="space-y-2">
              <div className="h-24 rounded-lg bg-secondary border" />
              <p className="text-sm font-medium">Secondary</p>
              <p className="text-xs text-muted-foreground">Azul muy claro</p>
            </div>
            <div className="space-y-2">
              <div className="h-24 rounded-lg bg-destructive border" />
              <p className="text-sm font-medium">Destructive</p>
              <p className="text-xs text-muted-foreground">Rojo/naranja</p>
            </div>
          </div>
        </section>

        {/* Typography */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Tipografía</h2>
          <p className="text-muted-foreground mb-6">
            Inter de Google Fonts con soporte completo para caracteres españoles.
          </p>
          <div className="space-y-4">
            <div>
              <h1 className="text-5xl font-semibold mb-2">Título Principal H1</h1>
              <p className="text-xs text-muted-foreground">48px / 3rem (semibold)</p>
            </div>
            <div>
              <h2 className="text-4xl font-semibold mb-2">Título Secundario H2</h2>
              <p className="text-xs text-muted-foreground">36px / 2.25rem (semibold)</p>
            </div>
            <div>
              <h3 className="text-2xl font-medium mb-2">Título Terciario H3</h3>
              <p className="text-xs text-muted-foreground">24px / 1.5rem (medium)</p>
            </div>
            <div>
              <p className="text-base mb-2">Texto del cuerpo con caracteres españoles: á, é, í, ó, ú, ñ, ¿, ¡</p>
              <p className="text-xs text-muted-foreground">16px / 1rem (regular)</p>
            </div>
          </div>
        </section>

        {/* Buttons */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Botones</h2>
          <p className="text-muted-foreground mb-6">
            Componentes de botón con múltiples variantes y tamaños para diferentes contextos.
          </p>

          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-medium mb-4">Variantes</h3>
              <div className="flex flex-wrap gap-3">
                <Button variant="default">Comparar Propuestas</Button>
                <Button variant="secondary">Explorar Documentos</Button>
                <Button variant="outline">Filtrar Resultados</Button>
                <Button variant="ghost">Cancelar</Button>
                <Button variant="destructive">Eliminar</Button>
                <Button variant="link">Ver Más</Button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Tamaños</h3>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm">Pequeño</Button>
                <Button size="default">Por Defecto</Button>
                <Button size="lg">Grande</Button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Con Iconos</h3>
              <div className="flex flex-wrap gap-3">
                <Button>
                  <Search className="mr-2" />
                  Buscar
                </Button>
                <Button variant="outline">
                  <Download className="mr-2" />
                  Descargar PDF
                </Button>
                <Button variant="secondary">
                  <Filter className="mr-2" />
                  Filtrar
                </Button>
                <Button size="icon" variant="ghost">
                  <FileText />
                </Button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Estados</h3>
              <div className="flex flex-wrap gap-3">
                <Button disabled>Deshabilitado</Button>
                <Button>
                  <Spinner className="mr-2" />
                  Cargando...
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Badges */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Insignias</h2>
          <p className="text-muted-foreground mb-6">
            Etiquetas para mostrar estado, categorías o información destacada.
          </p>
          <div className="flex flex-wrap gap-3">
            <Badge>Indexado</Badge>
            <Badge variant="secondary">Pendiente</Badge>
            <Badge variant="destructive">Error</Badge>
            <Badge variant="outline">2026</Badge>
            <Badge className="bg-accent text-accent-foreground">Nuevo</Badge>
          </div>
        </section>

        {/* Cards */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Tarjetas</h2>
          <p className="text-muted-foreground mb-6">
            Contenedores para agrupar información relacionada con estructura consistente.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Partido Liberación Nacional</CardTitle>
                <CardDescription>Candidata: Laura Chinchilla Miranda</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">Plan de gobierno para las elecciones presidenciales 2026.</p>
                <div className="flex gap-2 mt-4">
                  <Badge>Indexado</Badge>
                  <Badge variant="outline">156 páginas</Badge>
                </div>
              </CardContent>
              <CardFooter className="justify-between">
                <Button variant="outline" size="sm">
                  <FileText className="mr-2 h-4 w-4" />
                  Ver Detalles
                </Button>
                <Button size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Descargar
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>Comparación Realizada</CardTitle>
                    <CardDescription>Última consulta hace 5 minutos</CardDescription>
                  </div>
                  <Badge variant="secondary">
                    <Users className="mr-1 h-3 w-3" />4 partidos
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Tema: Educación Pública</p>
                  <p className="text-sm text-muted-foreground">
                    Comparación de propuestas entre PLN, PAC, PUSC y FA sobre política educativa.
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" size="sm" className="ml-auto">
                  Ver Comparación
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          </div>
        </section>

        {/* Form Components */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Componentes de Formulario</h2>
          <p className="text-muted-foreground mb-6">
            Elementos de entrada con estados de validación y accesibilidad integrada.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <Field>
                <FieldLabel htmlFor="search">Buscar Propuesta</FieldLabel>
                <FieldDescription>Ingrese palabras clave para buscar en los planes de gobierno</FieldDescription>
                <Input id="search" placeholder="ej: educación, salud, economía" />
              </Field>

              <Field>
                <FieldLabel htmlFor="party">Seleccionar Partido</FieldLabel>
                <Select>
                  <SelectTrigger id="party">
                    <SelectValue placeholder="Seleccione un partido..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pln">Partido Liberación Nacional</SelectItem>
                    <SelectItem value="pac">Partido Acción Ciudadana</SelectItem>
                    <SelectItem value="pusc">Partido Unidad Social Cristiana</SelectItem>
                    <SelectItem value="fa">Frente Amplio</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="comments">Comentarios</FieldLabel>
                <Textarea id="comments" placeholder="Escriba sus comentarios aquí..." rows={4} />
              </Field>
            </div>

            <div className="space-y-6">
              <Field>
                <div className="flex items-center space-x-2">
                  <Checkbox id="terms" />
                  <FieldLabel htmlFor="terms" className="!mb-0">
                    Acepto los términos y condiciones
                  </FieldLabel>
                </div>
              </Field>

              <Field>
                <FieldLabel>Preferencia de Visualización</FieldLabel>
                <RadioGroup defaultValue="grid">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="grid" id="grid" />
                    <Label htmlFor="grid">Vista de Cuadrícula</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="list" id="list" />
                    <Label htmlFor="list">Vista de Lista</Label>
                  </div>
                </RadioGroup>
              </Field>

              <Field orientation="horizontal">
                <FieldLabel htmlFor="notifications">Notificaciones</FieldLabel>
                <Switch id="notifications" />
              </Field>
            </div>
          </div>
        </section>

        {/* Input Groups */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Grupos de Entrada</h2>
          <p className="text-muted-foreground mb-6">
            Combinaciones de entrada con iconos, botones y texto complementario.
          </p>

          <div className="space-y-4 max-w-md">
            <InputGroup>
              <InputGroupAddon>
                <Search className="h-4 w-4" />
              </InputGroupAddon>
              <InputGroupInput placeholder="Buscar en planes de gobierno..." />
            </InputGroup>

            <InputGroup>
              <InputGroupInput placeholder="URL del documento PDF" />
              <InputGroupAddon align="inline-end">
                <InputGroupButton>
                  <Download className="h-4 w-4" />
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>

            <InputGroup>
              <InputGroupAddon>
                <InputGroupText>Partido:</InputGroupText>
              </InputGroupAddon>
              <InputGroupInput placeholder="Nombre del partido político" />
            </InputGroup>
          </div>
        </section>

        {/* Button Groups */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Grupos de Botones</h2>
          <p className="text-muted-foreground mb-6">
            Agrupaciones de botones relacionados con orientación horizontal o vertical.
          </p>

          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium mb-3">Horizontal</h3>
              <ButtonGroup>
                <Button variant="outline">2 Partidos</Button>
                <Button variant="outline">3 Partidos</Button>
                <Button variant="outline">4 Partidos</Button>
              </ButtonGroup>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-3">Con Texto</h3>
              <ButtonGroup>
                <ButtonGroupText>Comparar:</ButtonGroupText>
                <Button variant="outline">PLN</Button>
                <Button variant="outline">PAC</Button>
                <Button variant="outline">PUSC</Button>
              </ButtonGroup>
            </div>
          </div>
        </section>

        {/* Empty States */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Estados Vacíos</h2>
          <p className="text-muted-foreground mb-6">Mensajes informativos cuando no hay contenido o resultados.</p>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="pt-6">
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Search />
                    </EmptyMedia>
                    <EmptyTitle>No se encontraron resultados</EmptyTitle>
                    <EmptyDescription>
                      Intente ajustar sus criterios de búsqueda o seleccione diferentes partidos para comparar.
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <Button>Limpiar Filtros</Button>
                  </EmptyContent>
                </Empty>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <FileText />
                    </EmptyMedia>
                    <EmptyTitle>Sin comparaciones guardadas</EmptyTitle>
                    <EmptyDescription>
                      Aún no ha realizado ninguna comparación. Comience seleccionando partidos para comparar.
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <Button>Comparar Ahora</Button>
                  </EmptyContent>
                </Empty>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Status Indicators */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Indicadores de Estado</h2>
          <p className="text-muted-foreground mb-6">
            Elementos visuales para comunicar estado del sistema y retroalimentación.
          </p>

          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Indexación Exitosa</p>
                    <p className="text-xs text-muted-foreground">Documento procesado</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/20">
                    <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Advertencia</p>
                    <p className="text-xs text-muted-foreground">Revisar configuración</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/20">
                    <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Error de Sistema</p>
                    <p className="text-xs text-muted-foreground">Contactar soporte</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Loading States */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Estados de Carga</h2>
          <p className="text-muted-foreground mb-6">Indicadores visuales durante procesos asíncronos.</p>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Con Spinner</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Spinner />
                  <span className="text-sm text-muted-foreground">Cargando propuestas...</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Con Botón</CardTitle>
              </CardHeader>
              <CardContent>
                <Button disabled>
                  <Spinner className="mr-2" />
                  Procesando Comparación...
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Accessibility Features */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Características de Accesibilidad</h2>
          <p className="text-muted-foreground mb-6">Cumplimiento WCAG 2.1 Level AA para todos los componentes.</p>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Navegación por Teclado</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tab</span>
                  <span>Navegar elementos</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Enter / Space</span>
                  <span>Activar elemento</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Escape</span>
                  <span>Cerrar modal/dropdown</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Arrow Keys</span>
                  <span>Navegar en listas</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contraste de Color</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Texto Normal</span>
                  <Badge variant="outline">4.5:1</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Texto Grande</span>
                  <Badge variant="outline">3:1</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Elementos UI</span>
                  <Badge variant="outline">3:1</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Indicadores de Foco</span>
                  <Badge className="bg-ring">Visible</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Design Principles */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Principios de Diseño</h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Neutralidad Política</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Tratamiento visual equitativo para todos los partidos. Colores neutrales sin asociaciones partidarias.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Español Nativo</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Textos escritos en español costarricense natural, no traducidos. Soporte completo para acentos.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Accesibilidad</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  WCAG 2.1 Level AA. Navegación por teclado, lectores de pantalla, alto contraste incluidos.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Responsive</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Diseño móvil primero. Táctil-amigable con objetivos de 44×44px mínimo en todos los dispositivos.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  )
}
