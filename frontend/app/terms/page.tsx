import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export const metadata = {
  title: "Términos de Servicio | TicoBot",
  description: "Términos y condiciones de uso de la plataforma TicoBot",
}

export default function TermsPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 md:py-12">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-primary mb-4 inline-block"
        >
          ← Volver al inicio
        </Link>
        <h1 className="text-4xl font-bold tracking-tight mb-2">
          Términos de Servicio
        </h1>
        <p className="text-muted-foreground">
          Última actualización: Diciembre 11, 2025
        </p>
      </div>

      <Card>
        <CardContent className="prose prose-slate dark:prose-invert max-w-none pt-6">
          {/* Introduction */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Introducción</h2>
            <p className="mb-4">
              Bienvenido a TicoBot, una plataforma de análisis y consulta de planes de gobierno
              para las elecciones de Costa Rica 2026. Al acceder y utilizar este sitio web,
              aceptas cumplir con estos Términos de Servicio y todas las leyes y regulaciones
              aplicables en Costa Rica.
            </p>
            <p>
              Si no estás de acuerdo con alguno de estos términos, por favor no utilices
              nuestra plataforma.
            </p>
          </section>

          <Separator className="my-6" />

          {/* Service Description */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Descripción del Servicio</h2>
            <p className="mb-4">
              TicoBot es una herramienta educativa e informativa que proporciona:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Acceso a planes de gobierno oficiales publicados por el TSE (Tribunal Supremo de Elecciones)</li>
              <li>Búsqueda y análisis de propuestas políticas mediante inteligencia artificial</li>
              <li>Comparación entre partidos políticos y candidatos</li>
              <li>Chat interactivo para consultas sobre planes de gobierno</li>
              <li>Información educativa sobre el proceso electoral costarricense</li>
            </ul>
            <p>
              <strong>Importante:</strong> TicoBot es una plataforma independiente y no está
              afiliada con ningún partido político, candidato, o el Tribunal Supremo de Elecciones.
            </p>
          </section>

          <Separator className="my-6" />

          {/* User Accounts */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Cuentas de Usuario</h2>

            <h3 className="text-xl font-semibold mb-3">3.1 Creación de Cuenta</h3>
            <p className="mb-4">
              Para acceder a ciertas funcionalidades, puedes crear una cuenta proporcionando
              un correo electrónico válido y una contraseña segura. Eres responsable de:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Mantener la confidencialidad de tu contraseña</li>
              <li>Todas las actividades realizadas desde tu cuenta</li>
              <li>Notificarnos inmediatamente sobre cualquier uso no autorizado</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">3.2 Requisitos de Edad</h3>
            <p className="mb-4">
              Debes tener al menos 13 años para crear una cuenta. Si eres menor de 18 años,
              debes contar con el consentimiento de tus padres o tutores legales.
            </p>
          </section>

          <Separator className="my-6" />

          {/* Usage Rights */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Uso Permitido</h2>
            <p className="mb-4">Al utilizar TicoBot, te comprometes a:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Usar la plataforma únicamente para fines informativos y educativos</li>
              <li>No distribuir información falsa o engañosa</li>
              <li>Respetar los derechos de propiedad intelectual</li>
              <li>No intentar acceder a áreas restringidas del sistema</li>
              <li>No usar bots, scrapers o herramientas automatizadas sin autorización</li>
              <li>No realizar ingeniería inversa o intentar extraer el código fuente</li>
            </ul>
          </section>

          <Separator className="my-6" />

          {/* Prohibited Uses */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Usos Prohibidos</h2>
            <p className="mb-4">Está estrictamente prohibido usar TicoBot para:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Difundir propaganda política o realizar campañas electorales</li>
              <li>Manipular o tergiversar información de planes de gobierno</li>
              <li>Acosar, amenazar o intimidar a otros usuarios</li>
              <li>Publicar contenido ilegal, difamatorio u obsceno</li>
              <li>Interferir con el funcionamiento normal de la plataforma</li>
              <li>Violar leyes electorales de Costa Rica</li>
            </ul>
          </section>

          <Separator className="my-6" />

          {/* Content and IP */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Contenido y Propiedad Intelectual</h2>

            <h3 className="text-xl font-semibold mb-3">6.1 Planes de Gobierno</h3>
            <p className="mb-4">
              Los planes de gobierno son documentos públicos del Tribunal Supremo de Elecciones
              de Costa Rica. TicoBot facilita el acceso a estos documentos, pero no reclama
              propiedad sobre ellos.
            </p>

            <h3 className="text-xl font-semibold mb-3">6.2 Contenido de la Plataforma</h3>
            <p className="mb-4">
              El diseño, código, análisis generados por IA, y otros elementos de TicoBot están
              protegidos por derechos de autor. No puedes copiar, modificar o distribuir nuestro
              contenido sin autorización expresa.
            </p>

            <h3 className="text-xl font-semibold mb-3">6.3 Atribución</h3>
            <p className="mb-4">
              Al compartir información obtenida de TicoBot, debes dar crédito apropiado y
              mencionar que la fuente original son los documentos oficiales del TSE.
            </p>
          </section>

          <Separator className="my-6" />

          {/* AI Disclaimer */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Descargo de Responsabilidad sobre IA</h2>
            <p className="mb-4">
              TicoBot utiliza inteligencia artificial para analizar y responder preguntas sobre
              planes de gobierno. Es importante entender que:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Las respuestas de la IA son generadas automáticamente y pueden contener errores</li>
              <li>Siempre debes verificar la información en los documentos originales del TSE</li>
              <li>La IA no proporciona asesoramiento político, legal o electoral</li>
              <li>Las interpretaciones de la IA no representan opiniones oficiales de partidos políticos</li>
              <li>TicoBot no garantiza la exactitud, completitud o actualidad de las respuestas</li>
            </ul>
            <p className="font-semibold text-orange-600 dark:text-orange-400">
              ⚠️ Recomendamos siempre consultar las fuentes oficiales del TSE para decisiones electorales importantes.
            </p>
          </section>

          <Separator className="my-6" />

          {/* Neutrality */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Neutralidad Política</h2>
            <p className="mb-4">
              TicoBot se compromete a mantener neutralidad política absoluta:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>No favorecemos ni promovemos ningún partido político o candidato</li>
              <li>Presentamos la información de manera objetiva e imparcial</li>
              <li>Todos los partidos registrados tienen igual representación en la plataforma</li>
              <li>No aceptamos financiamiento de partidos políticos o candidatos</li>
            </ul>
          </section>

          <Separator className="my-6" />

          {/* Liability */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Limitación de Responsabilidad</h2>
            <p className="mb-4">
              En la máxima medida permitida por la ley costarricense:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>TicoBot se proporciona "tal cual" sin garantías de ningún tipo</li>
              <li>No somos responsables por decisiones electorales basadas en nuestra plataforma</li>
              <li>No garantizamos disponibilidad ininterrumpida del servicio</li>
              <li>No somos responsables por errores en documentos del TSE que hayamos indexado</li>
              <li>No somos responsables por daños indirectos o consecuentes</li>
            </ul>
          </section>

          <Separator className="my-6" />

          {/* Data and Privacy */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Datos y Privacidad</h2>
            <p className="mb-4">
              El manejo de tus datos personales está regido por nuestra{" "}
              <Link href="/privacy" className="text-primary hover:underline">
                Política de Privacidad
              </Link>
              , que forma parte integral de estos Términos de Servicio.
            </p>
          </section>

          <Separator className="my-6" />

          {/* Changes */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Modificaciones</h2>
            <p className="mb-4">
              Nos reservamos el derecho de modificar estos Términos de Servicio en cualquier momento.
              Los cambios significativos serán notificados mediante:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Aviso en la plataforma</li>
              <li>Correo electrónico a usuarios registrados</li>
              <li>Actualización de la fecha de "Última actualización"</li>
            </ul>
            <p>
              El uso continuado de la plataforma después de los cambios constituye tu aceptación
              de los nuevos términos.
            </p>
          </section>

          <Separator className="my-6" />

          {/* Termination */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. Terminación</h2>
            <p className="mb-4">
              Podemos suspender o terminar tu acceso a TicoBot en cualquier momento si:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Violas estos Términos de Servicio</li>
              <li>Proporcionas información falsa durante el registro</li>
              <li>Realizas actividades que perjudiquen a otros usuarios o a la plataforma</li>
              <li>Usas la plataforma para fines ilegales</li>
            </ul>
            <p>
              Puedes eliminar tu cuenta en cualquier momento desde la configuración de tu perfil.
            </p>
          </section>

          <Separator className="my-6" />

          {/* Governing Law */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">13. Ley Aplicable</h2>
            <p className="mb-4">
              Estos Términos de Servicio se rigen por las leyes de la República de Costa Rica.
              Cualquier disputa será resuelta en los tribunales competentes de San José, Costa Rica.
            </p>
            <p>
              Cumplimos con:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Ley de Protección de la Persona frente al tratamiento de sus datos personales (Ley 8968)</li>
              <li>Código Electoral de Costa Rica</li>
              <li>Regulaciones del Tribunal Supremo de Elecciones</li>
            </ul>
          </section>

          <Separator className="my-6" />

          {/* Contact */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">14. Contacto</h2>
            <p className="mb-4">
              Para preguntas sobre estos Términos de Servicio, contáctanos en:
            </p>
            <div className="bg-muted p-4 rounded-lg">
              <p className="mb-2">
                <strong>Email:</strong>{" "}
                <a href="mailto:legal@ticobot.cr" className="text-primary hover:underline">
                  legal@ticobot.cr
                </a>
              </p>
              <p className="mb-2">
                <strong>Sitio web:</strong>{" "}
                <a href="https://ticobot.cr" className="text-primary hover:underline">
                  https://ticobot.cr
                </a>
              </p>
              <p>
                <strong>Ubicación:</strong> San José, Costa Rica
              </p>
            </div>
          </section>

          <Separator className="my-6" />

          {/* Acceptance */}
          <section className="mb-8 bg-primary/5 p-6 rounded-lg border-l-4 border-primary">
            <h2 className="text-2xl font-semibold mb-4">Aceptación de Términos</h2>
            <p className="mb-4">
              Al crear una cuenta o utilizar TicoBot, confirmas que:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Has leído y comprendido estos Términos de Servicio</li>
              <li>Aceptas estar sujeto a estos términos y nuestra Política de Privacidad</li>
              <li>Tienes la capacidad legal para aceptar estos términos</li>
              <li>Usarás la plataforma de manera responsable y ética</li>
            </ul>
          </section>

          {/* Footer Links */}
          <div className="mt-12 pt-6 border-t flex flex-wrap gap-4 justify-center text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:text-primary">
              Política de Privacidad
            </Link>
            <span>•</span>
            <Link href="/help" className="hover:text-primary">
              Centro de Ayuda
            </Link>
            <span>•</span>
            <Link href="/" className="hover:text-primary">
              Volver al Inicio
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
