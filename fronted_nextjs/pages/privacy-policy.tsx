import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Política de Privacidad</h1>
          <p className="text-gray-600 mb-8">Última actualización: 24 de enero de 2026</p>

          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. Información que recopilamos</h2>
            <p className="text-gray-700 mb-4">
              FocusLearn recopila la siguiente información cuando te registras o inicias sesión:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Nombre completo</li>
              <li>Dirección de correo electrónico</li>
              <li>Información de perfil proporcionada por servicios de terceros (Google, Facebook)</li>
              <li>Datos de atención y concentración durante las sesiones de estudio</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. Uso de la información</h2>
            <p className="text-gray-700 mb-4">
              Utilizamos tu información para:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Proporcionar y mejorar nuestros servicios educativos</li>
              <li>Personalizar tu experiencia de aprendizaje</li>
              <li>Monitorear y analizar patrones de atención durante las sesiones de estudio</li>
              <li>Enviar notificaciones sobre tu progreso académico</li>
              <li>Comunicarnos contigo sobre actualizaciones del servicio</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. Autenticación de terceros</h2>
            <p className="text-gray-700 mb-4">
              Cuando inicias sesión con Google o Facebook, recibimos información básica de tu perfil 
              (nombre, correo electrónico, foto de perfil) de acuerdo con las políticas de privacidad 
              de estos servicios. No almacenamos tus contraseñas de Google o Facebook.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. Protección de datos</h2>
            <p className="text-gray-700 mb-4">
              Implementamos medidas de seguridad para proteger tu información personal, incluyendo:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Encriptación de datos sensibles</li>
              <li>Autenticación segura mediante tokens</li>
              <li>Acceso restringido a la información personal</li>
              <li>Monitoreo regular de vulnerabilidades de seguridad</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. Compartir información</h2>
            <p className="text-gray-700 mb-4">
              No vendemos, alquilamos ni compartimos tu información personal con terceros, excepto:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Con docentes y administradores de tu institución educativa para fines académicos</li>
              <li>Cuando sea requerido por ley o proceso legal</li>
              <li>Para proteger nuestros derechos, privacidad, seguridad o propiedad</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">6. Tus derechos</h2>
            <p className="text-gray-700 mb-4">
              Tienes derecho a:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Acceder a tu información personal</li>
              <li>Corregir datos inexactos</li>
              <li>Solicitar la eliminación de tu cuenta y datos</li>
              <li>Oponerte al procesamiento de tus datos</li>
              <li>Exportar tus datos en un formato legible</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">7. Cookies y tecnologías similares</h2>
            <p className="text-gray-700 mb-4">
              Utilizamos cookies y tecnologías similares para mejorar tu experiencia, incluyendo:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Cookies de sesión para mantener tu inicio de sesión</li>
              <li>Cookies de preferencias para recordar tu configuración</li>
              <li>Análisis de uso para mejorar nuestro servicio</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">8. Menores de edad</h2>
            <p className="text-gray-700 mb-4">
              Nuestro servicio está diseñado para estudiantes y puede ser utilizado por menores de edad 
              bajo la supervisión de instituciones educativas. Si eres menor de 18 años, asegúrate de 
              tener el consentimiento de tus padres o tutores para usar FocusLearn.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">9. Cambios a esta política</h2>
            <p className="text-gray-700 mb-4">
              Podemos actualizar esta política de privacidad ocasionalmente. Te notificaremos sobre 
              cambios significativos publicando la nueva política en esta página y actualizando la 
              fecha de "última actualización".
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">10. Contacto</h2>
            <p className="text-gray-700 mb-4">
              Si tienes preguntas sobre esta política de privacidad, contáctanos en:
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
