import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.a
          href="/"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="inline-flex items-center gap-2 text-cyan-600 hover:text-cyan-700 mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          Volver al inicio
        </motion.a>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-lg p-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Términos de Servicio</h1>
          <p className="text-gray-600 mb-8">Última actualización: 24 de enero de 2026</p>

          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. Aceptación de términos</h2>
            <p className="text-gray-700 mb-4">
              Al acceder y utilizar FocusLearn, aceptas estar sujeto a estos Términos de Servicio y 
              todas las leyes y regulaciones aplicables. Si no estás de acuerdo con alguno de estos 
              términos, no debes usar este servicio.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. Descripción del servicio</h2>
            <p className="text-gray-700 mb-4">
              FocusLearn es una plataforma educativa que utiliza inteligencia artificial para monitorear 
              y mejorar la atención y concentración de los estudiantes durante sus sesiones de estudio.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. Requisitos de cuenta</h2>
            <p className="text-gray-700 mb-4">
              Para utilizar FocusLearn, debes:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Proporcionar información precisa y completa durante el registro</li>
              <li>Mantener la seguridad de tu cuenta y contraseña</li>
              <li>Notificarnos inmediatamente sobre cualquier uso no autorizado de tu cuenta</li>
              <li>Ser responsable de toda la actividad que ocurra bajo tu cuenta</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. Uso aceptable</h2>
            <p className="text-gray-700 mb-4">
              Te comprometes a NO:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Usar el servicio para cualquier propósito ilegal</li>
              <li>Intentar obtener acceso no autorizado a cualquier parte del servicio</li>
              <li>Interferir con el funcionamiento del servicio</li>
              <li>Compartir contenido inapropiado, ofensivo o ilegal</li>
              <li>Suplantar a otra persona o entidad</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. Propiedad intelectual</h2>
            <p className="text-gray-700 mb-4">
              Todo el contenido, características y funcionalidad de FocusLearn son propiedad exclusiva 
              de sus creadores y están protegidos por leyes de propiedad intelectual.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">6. Privacidad y datos</h2>
            <p className="text-gray-700 mb-4">
              El uso de datos personales está regido por nuestra Política de Privacidad. Al usar 
              FocusLearn, aceptas la recopilación y uso de información de acuerdo con dicha política.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">7. Monitoreo de atención</h2>
            <p className="text-gray-700 mb-4">
              Al usar la función de monitoreo de atención, autorizas el uso de tu cámara web para 
              analizar patrones de atención. Los datos se utilizan únicamente con fines educativos 
              y no se comparten con terceros sin tu consentimiento.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">8. Limitación de responsabilidad</h2>
            <p className="text-gray-700 mb-4">
              FocusLearn se proporciona "tal cual" sin garantías de ningún tipo. No garantizamos que:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>El servicio será ininterrumpido o libre de errores</li>
              <li>Los resultados obtenidos sean completamente precisos</li>
              <li>Los defectos se corrijan inmediatamente</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">9. Modificaciones del servicio</h2>
            <p className="text-gray-700 mb-4">
              Nos reservamos el derecho de modificar o discontinuar el servicio (o cualquier parte del mismo) 
              en cualquier momento sin previo aviso.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">10. Terminación</h2>
            <p className="text-gray-700 mb-4">
              Podemos terminar o suspender tu acceso inmediatamente, sin previo aviso, por cualquier 
              motivo, incluyendo la violación de estos Términos de Servicio.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">11. Cambios a los términos</h2>
            <p className="text-gray-700 mb-4">
              Nos reservamos el derecho de actualizar estos términos en cualquier momento. Te notificaremos 
              sobre cambios significativos publicando los nuevos términos en esta página.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">12. Contacto</h2>
            <p className="text-gray-700 mb-4">
              Si tienes preguntas sobre estos Términos de Servicio, contáctanos en:
            </p>
            <ul className="list-none mb-4 text-gray-700">
              <li>Email: matiastonato48@gmail.com</li>
              <li>Aplicación: FocusLearn</li>
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
