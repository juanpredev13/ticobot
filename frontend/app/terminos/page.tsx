import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Términos y Condiciones - TicoBot",
  description: "Términos y condiciones del uso de TicoBot - Plataforma de comparación neutral de propuestas políticas",
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-card rounded-lg border p-8 shadow-sm">
          <h1 className="text-3xl font-bold mb-6 text-foreground">Términos y Condiciones</h1>
          
          <div className="prose prose-gray max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">1. Propósito del Proyecto</h2>
              <p className="text-muted-foreground leading-relaxed">
                TicoBot es una plataforma educativa y de investigación diseñada para aplicar conocimientos en 
                inteligencia artificial y desarrollo web. El sitio tiene como objetivo principal proporcionar 
                herramientas para el análisis y comparación neutral de propuestas políticas en Costa Rica.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">2. Naturaleza Educativa</h2>
              <p className="text-muted-foreground leading-relaxed">
                Este proyecto es desarrollado con fines educativos y de aprendizaje. Las respuestas 
                generadas por la IA son utilizadas para demostrar capacidades tecnológicas y no deben 
                considerarse asesoramiento político oficial o recomendaciones de voto.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">3. Uso de la Plataforma</h2>
              <div className="space-y-2 text-muted-foreground">
                <p>• Los usuarios pueden realizar hasta 10 consultas diarias en el plan gratuito</p>
                <p>• El contenido generado es para fines informativos y educativos</p>
                <p>• Se requiere registro para acceder a funcionalidades completas</p>
                <p>• Los usuarios son responsables del uso que hagan de la información</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">4. Limitaciones y Responsabilidades</h2>
              <p className="text-muted-foreground leading-relaxed">
                TicoBot es una plataforma en desarrollo para demostrar aplicaciones de IA. 
                Las respuestas generadas pueden contener imprecisiones o no reflejar la información 
                más actualizada. Los usuarios deben verificar la información con fuentes oficiales 
                antes de tomar decisiones basadas en el contenido proporcionado.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">5. Privacidad y Datos</h2>
              <div className="space-y-2 text-muted-foreground">
                <p>• Recopilamos información mínima necesaria para el registro (email, nombre)</p>
                <p>• Las consultas pueden ser analizadas para mejorar la calidad del servicio</p>
                <p>• No compartimos información personal con terceros sin consentimiento</p>
                <p>• Implementamos medidas de seguridad estándar para proteger los datos</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">6. Propiedad Intelectual</h2>
              <p className="text-muted-foreground leading-relaxed">
                El código fuente, diseño y funcionalidades de TicoBot son propiedad intelectual 
                del proyecto. El contenido generado por la IA puede ser utilizado por los usuarios 
                bajo su responsabilidad, pero la plataforma y sus tecnologías permanecen protegidas.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">7. Modificaciones del Servicio</h2>
              <p className="text-muted-foreground leading-relaxed">
                Como proyecto educativo en desarrollo, TicoBot se reserva el derecho de modificar, 
                suspender o descontinuar cualquier aspecto del servicio en cualquier momento, 
                incluyendo límites de uso, funcionalidades y términos de servicio.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">8. Contacto</h2>
              <p className="text-muted-foreground leading-relaxed">
                Para preguntas sobre estos términos, reporte de problemas o información adicional, 
                los usuarios pueden contactarnos a través de los canales proporcionados en la plataforma.
              </p>
            </section>

            <div className="mt-8 pt-6 border-t text-center text-sm text-muted-foreground">
              <p>Última actualización: Enero 2026</p>
              <p className="mt-2">Al usar TicoBot, aceptas estos términos y condiciones.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}