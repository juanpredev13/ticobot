import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Shield, Eye, Lock, Database, UserCheck, Globe } from "lucide-react"

export const metadata = {
  title: "Política de Privacidad | TicoBot",
  description: "Cómo TicoBot recopila, usa y protege tu información personal",
}

export default function PrivacyPage() {
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
          Política de Privacidad
        </h1>
        <p className="text-muted-foreground">
          Última actualización: Diciembre 11, 2025
        </p>
      </div>

      {/* Key Points */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card className="p-4">
          <Shield className="h-8 w-8 text-primary mb-2" />
          <h3 className="font-semibold mb-1">Protección de Datos</h3>
          <p className="text-sm text-muted-foreground">
            Cumplimos con la Ley 8968 de Costa Rica
          </p>
        </Card>
        <Card className="p-4">
          <Lock className="h-8 w-8 text-primary mb-2" />
          <h3 className="font-semibold mb-1">Datos Encriptados</h3>
          <p className="text-sm text-muted-foreground">
            Tu información está protegida con encriptación
          </p>
        </Card>
        <Card className="p-4">
          <Eye className="h-8 w-8 text-primary mb-2" />
          <h3 className="font-semibold mb-1">Transparencia</h3>
          <p className="text-sm text-muted-foreground">
            Control total sobre tus datos personales
          </p>
        </Card>
      </div>

      <Card>
        <CardContent className="prose prose-slate dark:prose-invert max-w-none pt-6">
          {/* Introduction */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Introducción</h2>
            <p className="mb-4">
              En TicoBot, respetamos tu privacidad y nos comprometemos a proteger tus datos personales.
              Esta Política de Privacidad explica cómo recopilamos, usamos, compartimos y protegemos
              tu información cuando utilizas nuestra plataforma de análisis de planes de gobierno.
            </p>
            <p className="mb-4">
              Cumplimos con la <strong>Ley de Protección de la Persona frente al tratamiento de sus
              datos personales (Ley 8968)</strong> de Costa Rica y sus regulaciones relacionadas.
            </p>
            <div className="bg-primary/10 p-4 rounded-lg border-l-4 border-primary">
              <p className="font-semibold mb-2">📋 Resumen Ejecutivo</p>
              <ul className="text-sm space-y-1 mb-0">
                <li>✓ Solo recopilamos datos necesarios para el servicio</li>
                <li>✓ Nunca vendemos tu información personal</li>
                <li>✓ No compartimos datos con partidos políticos</li>
                <li>✓ Puedes eliminar tu cuenta en cualquier momento</li>
                <li>✓ Usamos cookies solo para funcionalidad esencial</li>
              </ul>
            </div>
          </section>

          <Separator className="my-6" />

          {/* Information We Collect */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Database className="h-6 w-6" />
              2. Información que Recopilamos
            </h2>

            <h3 className="text-xl font-semibold mb-3">2.1 Información que Proporcionas</h3>
            <p className="mb-4">Cuando creas una cuenta, recopilamos:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Correo electrónico:</strong> Para autenticación y comunicación</li>
              <li><strong>Contraseña:</strong> Almacenada de forma encriptada (bcrypt)</li>
              <li><strong>Nombre (opcional):</strong> Para personalizar tu experiencia</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">2.2 Información de Uso</h3>
            <p className="mb-4">Automáticamente recopilamos:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Consultas realizadas:</strong> Preguntas que haces sobre planes de gobierno</li>
              <li><strong>Páginas visitadas:</strong> Para mejorar la navegación</li>
              <li><strong>Tiempo de uso:</strong> Para analíticas de la plataforma</li>
              <li><strong>Partidos consultados:</strong> Para entender intereses (anónimamente agregados)</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">2.3 Información Técnica</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Dirección IP (para seguridad y prevención de abuso)</li>
              <li>Tipo de navegador y dispositivo</li>
              <li>Sistema operativo</li>
              <li>Ubicación general (país/ciudad, no GPS)</li>
              <li>Cookies de sesión (ver sección 7)</li>
            </ul>

            <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <p className="font-semibold text-green-800 dark:text-green-200 mb-2">
                ✓ NO Recopilamos
              </p>
              <ul className="text-sm text-green-700 dark:text-green-300 space-y-1 mb-0">
                <li>• Preferencias políticas explícitas</li>
                <li>• Información financiera o bancaria</li>
                <li>• Número de teléfono o dirección física</li>
                <li>• Datos biométricos</li>
                <li>• Información de redes sociales</li>
              </ul>
            </div>
          </section>

          <Separator className="my-6" />

          {/* How We Use Information */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Cómo Usamos tu Información</h2>
            <p className="mb-4">Utilizamos tus datos para:</p>

            <h3 className="text-xl font-semibold mb-3">3.1 Prestación del Servicio</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Autenticar tu identidad y mantener tu sesión segura</li>
              <li>Procesar y responder tus consultas sobre planes de gobierno</li>
              <li>Personalizar tu experiencia en la plataforma</li>
              <li>Guardar tu historial de búsquedas (si estás autenticado)</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">3.2 Mejora de la Plataforma</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Analizar patrones de uso para mejorar funcionalidades</li>
              <li>Detectar y corregir errores técnicos</li>
              <li>Desarrollar nuevas características basadas en necesidades de usuarios</li>
              <li>Optimizar el rendimiento de la IA</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">3.3 Comunicación</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Enviarte notificaciones sobre actualizaciones importantes</li>
              <li>Responder a tus solicitudes de soporte</li>
              <li>Informarte sobre cambios en términos o políticas</li>
              <li>Enviarte boletines educativos (con tu consentimiento)</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">3.4 Seguridad y Cumplimiento</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Prevenir fraude y abuso de la plataforma</li>
              <li>Proteger contra ataques cibernéticos</li>
              <li>Cumplir con obligaciones legales en Costa Rica</li>
              <li>Investigar violaciones de nuestros Términos de Servicio</li>
            </ul>
          </section>

          <Separator className="my-6" />

          {/* Data Sharing */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Globe className="h-6 w-6" />
              4. Compartir Información
            </h2>
            <p className="mb-4 font-semibold text-primary">
              NO VENDEMOS NI ALQUILAMOS TU INFORMACIÓN PERSONAL A TERCEROS
            </p>

            <h3 className="text-xl font-semibold mb-3">4.1 Compartimos Información Solo Con:</h3>

            <div className="mb-4">
              <h4 className="font-semibold mb-2">Proveedores de Servicios Esenciales:</h4>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Hosting:</strong> Supabase (PostgreSQL + Storage)
                  <br />
                  <span className="text-sm text-muted-foreground">
                    Para almacenamiento seguro de datos
                  </span>
                </li>
                <li>
                  <strong>IA y Análisis:</strong> OpenAI, Anthropic
                  <br />
                  <span className="text-sm text-muted-foreground">
                    Para procesar tus consultas (datos anonimizados)
                  </span>
                </li>
                <li>
                  <strong>Analíticas:</strong> Plausible Analytics (opcional)
                  <br />
                  <span className="text-sm text-muted-foreground">
                    Para métricas agregadas sin tracking personal
                  </span>
                </li>
              </ul>
            </div>

            <h3 className="text-xl font-semibold mb-3">4.2 NO Compartimos Con:</h3>
            <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg border border-red-200 dark:border-red-800 mb-4">
              <ul className="text-sm text-red-700 dark:text-red-300 space-y-1 mb-0">
                <li>✗ Partidos políticos o candidatos</li>
                <li>✗ Empresas de marketing o publicidad</li>
                <li>✗ Redes de afiliados</li>
                <li>✗ Data brokers o agregadores de datos</li>
                <li>✗ Gobiernos extranjeros</li>
              </ul>
            </div>

            <h3 className="text-xl font-semibold mb-3">4.3 Excepciones Legales</h3>
            <p className="mb-4">
              Podemos divulgar información si es requerido por ley o para:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Cumplir con órdenes judiciales en Costa Rica</li>
              <li>Proteger nuestros derechos legales</li>
              <li>Prevenir actividades ilegales o daño a personas</li>
              <li>Cooperar con autoridades electorales (TSE)</li>
            </ul>
          </section>

          <Separator className="my-6" />

          {/* Data Security */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Lock className="h-6 w-6" />
              5. Seguridad de Datos
            </h2>
            <p className="mb-4">
              Implementamos múltiples capas de seguridad para proteger tu información:
            </p>

            <h3 className="text-xl font-semibold mb-3">5.1 Medidas Técnicas</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>
                <strong>Encriptación:</strong> HTTPS/TLS 1.3 para todas las comunicaciones
              </li>
              <li>
                <strong>Contraseñas:</strong> Hasheadas con bcrypt (factor 12)
              </li>
              <li>
                <strong>Tokens JWT:</strong> Para autenticación segura
              </li>
              <li>
                <strong>Rate Limiting:</strong> Protección contra ataques de fuerza bruta
              </li>
              <li>
                <strong>Firewall:</strong> Protección contra ataques DDoS
              </li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">5.2 Medidas Organizacionales</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Acceso restringido a datos personales (solo personal autorizado)</li>
              <li>Auditorías de seguridad periódicas</li>
              <li>Capacitación en protección de datos para el equipo</li>
              <li>Procedimientos de respuesta a incidentes</li>
              <li>Respaldos encriptados diarios</li>
            </ul>

            <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <p className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                ⚠️ Importante
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-0">
                Ningún sistema es 100% seguro. Si detectas actividad sospechosa en tu cuenta,
                cámbiatu contraseña inmediatamente y contáctanos.
              </p>
            </div>
          </section>

          <Separator className="my-6" />

          {/* Data Retention */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Retención de Datos</h2>
            <p className="mb-4">Conservamos tu información mientras:</p>

            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>
                <strong>Cuenta Activa:</strong> Mientras tu cuenta esté activa
              </li>
              <li>
                <strong>Cuenta Eliminada:</strong> 30 días después de la eliminación (para recuperación)
              </li>
              <li>
                <strong>Logs de Sistema:</strong> 90 días (para seguridad y depuración)
              </li>
              <li>
                <strong>Datos Analíticos Agregados:</strong> Indefinidamente (anonimizados)
              </li>
              <li>
                <strong>Obligaciones Legales:</strong> Según lo requiera la ley costarricense
              </li>
            </ul>

            <p className="mb-4">
              <strong>Eliminación Permanente:</strong> Puedes solicitar la eliminación permanente
              inmediata contactándonos. Procederemos dentro de 15 días hábiles.
            </p>
          </section>

          <Separator className="my-6" />

          {/* Cookies */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Cookies y Tecnologías Similares</h2>

            <h3 className="text-xl font-semibold mb-3">7.1 Cookies Esenciales</h3>
            <p className="mb-4">Usamos cookies necesarias para el funcionamiento:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>
                <strong>Sesión:</strong> Para mantener tu login activo
              </li>
              <li>
                <strong>Preferencias:</strong> Para recordar configuraciones (idioma, tema)
              </li>
              <li>
                <strong>Seguridad:</strong> Para prevenir ataques CSRF
              </li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">7.2 Cookies Analíticas (Opcional)</h3>
            <p className="mb-4">
              Con tu consentimiento, usamos cookies para analíticas que no identifican personas.
              Puedes rechazarlas en cualquier momento.
            </p>

            <h3 className="text-xl font-semibold mb-3">7.3 NO Usamos</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Cookies de publicidad o marketing</li>
              <li>Cookies de terceros para tracking</li>
              <li>Pixels de redes sociales</li>
            </ul>
          </section>

          <Separator className="my-6" />

          {/* Your Rights */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <UserCheck className="h-6 w-6" />
              8. Tus Derechos (Ley 8968)
            </h2>
            <p className="mb-4">
              Según la legislación costarricense, tienes derecho a:
            </p>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-2">✓ Acceso</h4>
                <p className="text-sm text-muted-foreground">
                  Solicitar una copia de todos tus datos personales
                </p>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-2">✓ Rectificación</h4>
                <p className="text-sm text-muted-foreground">
                  Corregir datos inexactos o incompletos
                </p>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-2">✓ Eliminación</h4>
                <p className="text-sm text-muted-foreground">
                  Eliminar tu cuenta y datos asociados
                </p>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-2">✓ Portabilidad</h4>
                <p className="text-sm text-muted-foreground">
                  Exportar tus datos en formato legible
                </p>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-2">✓ Oposición</h4>
                <p className="text-sm text-muted-foreground">
                  Oponerte a ciertos usos de tus datos
                </p>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-2">✓ Revocación</h4>
                <p className="text-sm text-muted-foreground">
                  Revocar consentimientos otorgados
                </p>
              </div>
            </div>

            <p className="mb-4">
              <strong>Cómo ejercer tus derechos:</strong>
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Desde tu perfil de usuario (para cambios básicos)</li>
              <li>
                Enviando email a{" "}
                <a href="mailto:privacidad@ticobot.cr" className="text-primary hover:underline">
                  privacidad@ticobot.cr
                </a>
              </li>
              <li>Responderemos en un máximo de 10 días hábiles</li>
            </ul>
          </section>

          <Separator className="my-6" />

          {/* Children */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Protección de Menores</h2>
            <p className="mb-4">
              TicoBot no está dirigido a menores de 13 años. Si tienes entre 13 y 17 años,
              necesitas el consentimiento de tus padres o tutores para usar nuestra plataforma.
            </p>
            <p className="mb-4">
              Si descubrimos que hemos recopilado datos de un menor sin consentimiento apropiado,
              eliminaremos esa información inmediatamente.
            </p>
            <p>
              Si eres padre o tutor y crees que tu hijo nos ha proporcionado información personal,
              contáctanos para que podamos eliminarla.
            </p>
          </section>

          <Separator className="my-6" />

          {/* International */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Transferencias Internacionales</h2>
            <p className="mb-4">
              Algunos de nuestros proveedores de servicios (como OpenAI, Anthropic, Supabase)
              pueden estar ubicados fuera de Costa Rica. Cuando transferimos datos internacionalmente:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Solo lo hacemos con proveedores que garantizan protección adecuada</li>
              <li>Implementamos salvaguardas contractuales (cláusulas de protección de datos)</li>
              <li>Los datos se encriptan durante la transferencia</li>
              <li>Cumplimos con estándares internacionales (ej. GDPR como referencia)</li>
            </ul>
          </section>

          <Separator className="my-6" />

          {/* Changes */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Cambios a esta Política</h2>
            <p className="mb-4">
              Podemos actualizar esta Política de Privacidad ocasionalmente. Te notificaremos sobre
              cambios significativos mediante:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Email a tu dirección registrada</li>
              <li>Aviso destacado en la plataforma</li>
              <li>Actualización de la fecha de "Última actualización"</li>
            </ul>
            <p>
              Te recomendamos revisar esta política periódicamente. El uso continuado después
              de cambios constituye tu aceptación.
            </p>
          </section>

          <Separator className="my-6" />

          {/* Contact */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. Contacto y Quejas</h2>

            <h3 className="text-xl font-semibold mb-3">Responsable de Datos</h3>
            <div className="bg-muted p-4 rounded-lg mb-4">
              <p className="mb-2">
                <strong>TicoBot</strong>
              </p>
              <p className="mb-2">
                Email:{" "}
                <a href="mailto:privacidad@ticobot.cr" className="text-primary hover:underline">
                  privacidad@ticobot.cr
                </a>
              </p>
              <p className="mb-2">
                Ubicación: San José, Costa Rica
              </p>
              <p>
                Tiempo de respuesta: 10 días hábiles
              </p>
            </div>

            <h3 className="text-xl font-semibold mb-3">Autoridad de Protección de Datos</h3>
            <p className="mb-4">
              Si no estás satisfecho con nuestra respuesta, puedes presentar una queja ante:
            </p>
            <div className="bg-muted p-4 rounded-lg">
              <p className="mb-2">
                <strong>Agencia de Protección de Datos de los Habitantes (PRODHAB)</strong>
              </p>
              <p className="mb-2">
                Sitio web:{" "}
                <a
                  href="https://www.prodhab.go.cr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  www.prodhab.go.cr
                </a>
              </p>
              <p>
                Teléfono: 2527-8585
              </p>
            </div>
          </section>

          <Separator className="my-6" />

          {/* Summary */}
          <section className="mb-8 bg-primary/5 p-6 rounded-lg border-l-4 border-primary">
            <h2 className="text-2xl font-semibold mb-4">Resumen de Compromisos</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">✓ Sí Hacemos:</h4>
                <ul className="text-sm space-y-1">
                  <li>• Proteger tus datos con seguridad de nivel empresarial</li>
                  <li>• Ser transparentes sobre el uso de datos</li>
                  <li>• Darte control total sobre tu información</li>
                  <li>• Cumplir con leyes costarricenses</li>
                  <li>• Respetar tu privacidad en todo momento</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">✗ No Hacemos:</h4>
                <ul className="text-sm space-y-1">
                  <li>• Vender tus datos personales</li>
                  <li>• Compartir con partidos políticos</li>
                  <li>• Usar tracking invasivo</li>
                  <li>• Publicidad dirigida</li>
                  <li>• Perfilar para manipulación política</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Footer Links */}
          <div className="mt-12 pt-6 border-t flex flex-wrap gap-4 justify-center text-sm text-muted-foreground">
            <Link href="/terms" className="hover:text-primary">
              Términos de Servicio
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
