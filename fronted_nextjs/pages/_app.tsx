import { useState } from "react";
import { Navbar } from "../components/Navbar";
import { Button } from "../components/ui/button";
import { ImageWithFallback } from "../components/Figma/ImageWithFallback";
import { Eye, Activity, BarChart3, Camera, Brain, Clock, Users, GraduationCap, Shield, CheckCircle, ChevronDown, ChevronUp, TrendingUp, Zap, Award } from "lucide-react";
import { Auth } from "../pages/Auth";
import { StudentDashboard } from "../pages/StudentDashboard";
import { TeacherDashboard } from "../pages/TeacherDashboard";
import { AdminDashboard } from "../pages/AdminDashboard";
import { motion } from "framer-motion";
import '../styles/globals.css';
import type { AppProps } from 'next/app';

export default function App() {
  const [currentPage, setCurrentPage] = useState<"home" | "auth" | "student-dashboard" | "teacher-dashboard" | "admin-dashboard">("home");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  if (currentPage === "auth") {
    return <Auth onLoginSuccess={(role) => {
      if (role === "Estudiante") {
        setCurrentPage("student-dashboard");
      } else if (role === "Docente") {
        setCurrentPage("teacher-dashboard");
      } else if (role === "Administrador") {
        setCurrentPage("admin-dashboard");
      }
    }} onBack={() => setCurrentPage("home")} />;
  }

  if (currentPage === "student-dashboard") {
    return <StudentDashboard />;
  }

  if (currentPage === "teacher-dashboard") {
    return <TeacherDashboard />;
  }

  if (currentPage === "admin-dashboard") {
    return <AdminDashboard />;
  }

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onAuthClick={() => setCurrentPage("auth")} />
      
      {/* Hero Section */}
      <section id="inicio" className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-50 via-white to-gray-50 -z-10" />
        
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-block mb-4 px-4 py-2 bg-cyan-100 rounded-full"
              >
              </motion.div>
              
              <h1 className="bg-gradient-to-r from-cyan-500 to-cyan-600 bg-clip-text text-transparent mb-4">
                Monitoreo Inteligente de Atención Estudiantil
              </h1>
              <p className="text-gray-600 mb-6">
                Sistema web avanzado que utiliza visión por computadora para detectar 
                y analizar en tiempo real el nivel de distracción de estudiantes de 
                educación superior, mejorando la calidad del aprendizaje.
              </p>
              
              {/* Stats */}
              <motion.div 
                className="grid grid-cols-3 gap-4 mb-8"
                variants={staggerContainer}
                initial="initial"
                animate="animate"
              >
                <motion.div variants={fadeInUp} className="text-center p-4 bg-white rounded-lg shadow-sm">
                  <p className="text-cyan-600">5,000+</p>
                  <p className="text-gray-600">Estudiantes</p>
                </motion.div>
                <motion.div variants={fadeInUp} className="text-center p-4 bg-white rounded-lg shadow-sm">
                  <p className="text-cyan-600">95%</p>
                  <p className="text-gray-600">Precisión</p>
                </motion.div>
                <motion.div variants={fadeInUp} className="text-center p-4 bg-white rounded-lg shadow-sm">
                  <p className="text-cyan-600">24/7</p>
                  <p className="text-gray-600">Monitoreo</p>
                </motion.div>
              </motion.div>
              
              <div className="flex flex-wrap gap-4">
                <Button size="lg" onClick={() => setCurrentPage("auth")}>
                  Comenzar ahora
                </Button>
                <Button size="lg" variant="outline">
                  <a href="#video-demo" className="flex items-center gap-2">
                    Ver demostración
                  </a>
                </Button>
              </div>
            </motion.div>
            
            <motion.div 
              className="rounded-lg overflow-hidden shadow-2xl"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <ImageWithFallback 
                src="https://images.unsplash.com/photo-1620069105786-c42c8b55b328?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkZW50JTIwY29tcHV0ZXIlMjBmb2N1c2VkfGVufDF8fHx8MTc2MTI2OTEzMXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Estudiante concentrado"
                className="w-full h-full object-cover"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Real-time Stats Banner */}
      <section className="py-6 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-cyan-500 to-cyan-600">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-white text-center">
            <div>
              <div className="flex items-center justify-center gap-2 mb-1">
                <TrendingUp className="w-5 h-5" />
                <p className="text-white">320</p>
              </div>
              <p className="text-cyan-100">Sesiones activas</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-2 mb-1">
                <Users className="w-5 h-5" />
                <p className="text-white">45</p>
              </div>
              <p className="text-cyan-100">Instituciones</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-2 mb-1">
                <Award className="w-5 h-5" />
                <p className="text-white">98%</p>
              </div>
              <p className="text-cyan-100">Satisfacción</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-2 mb-1">
                <Zap className="w-5 h-5" />
                <p className="text-white">Real-time</p>
              </div>
              <p className="text-cyan-100">Análisis instantáneo</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits by Role Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-gray-900 mb-4">
              Beneficios para Todos
            </h2>
            <p className="text-gray-600">
              Una solución completa adaptada a cada rol
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <motion.div 
              className="p-8 rounded-xl bg-gradient-to-br from-cyan-50 to-cyan-100 border border-cyan-200 hover:shadow-xl transition-all duration-300"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cyan-500 text-white mb-4">
                <GraduationCap className="w-8 h-8" />
              </div>
              <h3 className="text-gray-900 mb-3">
                Para Estudiantes
              </h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-cyan-500 flex-shrink-0 mt-0.5" />
                  <span>Autoevaluación de atención en tiempo real</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-cyan-500 flex-shrink-0 mt-0.5" />
                  <span>Reportes personalizados de rendimiento</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-cyan-500 flex-shrink-0 mt-0.5" />
                  <span>Recomendaciones para mejorar concentración</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-cyan-500 flex-shrink-0 mt-0.5" />
                  <span>Historial de progreso académico</span>
                </li>
              </ul>
            </motion.div>
            
            <motion.div 
              className="p-8 rounded-xl bg-gradient-to-br from-cyan-50 to-cyan-100 border border-cyan-200 hover:shadow-xl transition-all duration-300"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cyan-500 text-white mb-4">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-gray-900 mb-3">
                Para Docentes
              </h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-cyan-500 flex-shrink-0 mt-0.5" />
                  <span>Monitoreo de atención grupal en vivo</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-cyan-500 flex-shrink-0 mt-0.5" />
                  <span>Identificación de momentos críticos</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-cyan-500 flex-shrink-0 mt-0.5" />
                  <span>Estadísticas detalladas por clase</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-cyan-500 flex-shrink-0 mt-0.5" />
                  <span>Optimización de metodologías</span>
                </li>
              </ul>
            </motion.div>
            
            <motion.div 
              className="p-8 rounded-xl bg-gradient-to-br from-cyan-50 to-cyan-100 border border-cyan-200 hover:shadow-xl transition-all duration-300"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cyan-500 text-white mb-4">
                <Shield className="w-8 h-8" />
              </div>
              <h3 className="text-gray-900 mb-3">
                Para Administradores
              </h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-cyan-500 flex-shrink-0 mt-0.5" />
                  <span>Dashboard con métricas institucionales</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-cyan-500 flex-shrink-0 mt-0.5" />
                  <span>Gestión centralizada de usuarios</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-cyan-500 flex-shrink-0 mt-0.5" />
                  <span>Reportes ejecutivos automatizados</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-cyan-500 flex-shrink-0 mt-0.5" />
                  <span>Control de calidad educativa</span>
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-gray-900 mb-4">
              Características del Sistema
            </h2>
            <p className="text-gray-600">
              Tecnología de vanguardia para el análisis del comportamiento estudiantil
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <motion.div 
              className="text-center p-6 bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-300"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ y: -5 }}
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cyan-100 text-cyan-600 mb-4">
                <Camera className="w-8 h-8" />
              </div>
              <h3 className="text-gray-900 mb-2">
                Visión por Computadora
              </h3>
              <p className="text-gray-600">
                Detección facial y análisis de expresiones en tiempo real mediante algoritmos de IA avanzados
              </p>
            </motion.div>
            
            <motion.div 
              className="text-center p-6 bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-300"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ y: -5 }}
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cyan-100 text-cyan-600 mb-4">
                <Activity className="w-8 h-8" />
              </div>
              <h3 className="text-gray-900 mb-2">
                Análisis en Tiempo Real
              </h3>
              <p className="text-gray-600">
                Monitoreo continuo del nivel de atención y detección instantánea de señales de distracción
              </p>
            </motion.div>
            
            <motion.div 
              className="text-center p-6 bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-300"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{ y: -5 }}
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cyan-100 text-cyan-600 mb-4">
                <BarChart3 className="w-8 h-8" />
              </div>
              <h3 className="text-gray-900 mb-2">
                Reportes Detallados
              </h3>
              <p className="text-gray-600">
                Estadísticas completas y visualizaciones de datos para evaluar patrones de atención
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Video Demo Section */}
      <section id="video-demo" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-gray-900 mb-4">
              Ve FocusLearn en Acción
            </h2>
            <p className="text-gray-600">
              Descubre cómo funciona nuestro sistema en tiempo real
            </p>
          </motion.div>
          
          <motion.div 
            className="relative aspect-video bg-gray-900 rounded-xl overflow-hidden shadow-2xl"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <ImageWithFallback 
              src="https://images.unsplash.com/photo-1551434678-e076c223a692?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1920"
              alt="Video demo"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40">
              <button className="w-20 h-20 rounded-full bg-cyan-500 text-white flex items-center justify-center hover:bg-cyan-600 transition-colors shadow-xl hover:scale-110 transform duration-200">
                <svg className="w-10 h-10 ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-gray-900 mb-4">
              ¿Cómo Funciona?
            </h2>
            <p className="text-gray-600">
              Proceso simple y eficiente de monitoreo
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <motion.div 
              className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 hover:border-cyan-600 transition-all duration-300"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ y: -5 }}
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 text-white mb-4">
                <Eye className="w-6 h-6" />
              </div>
              <h3 className="text-gray-900 mb-3">
                1. Captura Visual
              </h3>
              <p className="text-gray-600">
                El sistema captura imágenes de los estudiantes mediante cámaras en el aula o dispositivos personales
              </p>
            </motion.div>
            
            <motion.div 
              className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 hover:border-cyan-600 transition-all duration-300"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ y: -5 }}
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 text-white mb-4">
                <Brain className="w-6 h-6" />
              </div>
              <h3 className="text-gray-900 mb-3">
                2. Análisis con IA
              </h3>
              <p className="text-gray-600">
                Algoritmos de aprendizaje automático analizan gestos, expresiones faciales y postura corporal
              </p>
            </motion.div>
            
            <motion.div 
              className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 hover:border-cyan-600 transition-all duration-300"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{ y: -5 }}
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 text-white mb-4">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-gray-900 mb-3">
                3. Generación de Métricas
              </h3>
              <p className="text-gray-600">
                Se generan reportes con niveles de atención, momentos críticos y recomendaciones
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Technologies Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-gray-900 mb-4">
              Tecnologías de Vanguardia
            </h2>
            <p className="text-gray-600">
              Powered by the best AI and computer vision technologies
            </p>
          </motion.div>
          
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="text-center p-6 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="text-gray-700 mb-2">TensorFlow</div>
              <p className="text-gray-500">Deep Learning</p>
            </div>
            <div className="text-center p-6 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="text-gray-700 mb-2">OpenCV</div>
              <p className="text-gray-500">Computer Vision</p>
            </div>
            <div className="text-center p-6 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="text-gray-700 mb-2">PyTorch</div>
              <p className="text-gray-500">Neural Networks</p>
            </div>
            <div className="text-center p-6 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="text-gray-700 mb-2">React</div>
              <p className="text-gray-500">Frontend</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-gray-900 mb-4">
              Lo que dicen nuestros usuarios
            </h2>
            <p className="text-gray-600">
              Testimonios de instituciones que confían en FocusLearn
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <motion.div 
              className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-orange-500">★</span>
                ))}
              </div>
              <p className="text-gray-600 mb-4">
                "FocusLearn ha revolucionado la forma en que entendemos la atención de nuestros estudiantes. 
                Los reportes son increíblemente detallados y accionables."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white">
                  DR
                </div>
                <div>
                  <p className="text-gray-900">Dr. Roberto Martínez</p>
                  <p className="text-gray-500">Universidad Nacional</p>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-orange-500">★</span>
                ))}
              </div>
              <p className="text-gray-600 mb-4">
                "Como docente, ahora puedo identificar en tiempo real cuándo mis estudiantes necesitan un descanso 
                o un cambio de actividad. Es una herramienta invaluable."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white">
                  MC
                </div>
                <div>
                  <p className="text-gray-900">Mtra. Carmen López</p>
                  <p className="text-gray-500">ESPE</p>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-orange-500">★</span>
                ))}
              </div>
              <p className="text-gray-600 mb-4">
                "Me ayudó a identificar mis patrones de distracción y mejorar mi concentración. 
                Mis calificaciones han mejorado notablemente desde que uso el sistema."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white">
                  AS
                </div>
                <div>
                  <p className="text-gray-900">Ana Sofía Torres</p>
                  <p className="text-gray-500">Estudiante de Ingeniería</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
{/* CTA Banner */}
<section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-cyan-500 to-cyan-600">
  <div className="max-w-4xl mx-auto text-center">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-dark mb-4">
        ¿Listo para transformar tu experiencia educativa?
      </h2>
      <p className="text-cyan-100 mb-8">
        Únete a las instituciones que ya están mejorando la calidad educativa con FocusLearn
      </p>
      <div className="flex flex-wrap gap-4 justify-center">
        <Button 
          size="lg" 
          className="bg-white text-cyan-600 hover:bg-gray-100"
          onClick={() => setCurrentPage("auth")}
        >
          Comenzar gratis
        </Button>
        <Button 
          size="lg" 
          variant="outline" 
          className="bg-white text-cyan-600 hover:bg-gray-100"
        >
          <a href="#contacto">Contactar ventas</a>
        </Button>
      </div>
    </motion.div>
  </div>
</section>

      {/* FAQ Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-gray-900 mb-4">
              Preguntas Frecuentes
            </h2>
            <p className="text-gray-600">
              Resolvemos tus dudas sobre FocusLearn
            </p>
          </motion.div>
          
          <div className="space-y-4">
            {[
              {
                question: "¿Cómo garantizan la privacidad de los estudiantes?",
                answer: "FocusLearn cumple con todas las regulaciones de protección de datos. Los datos faciales no se almacenan, solo se procesan métricas anonimizadas. Además, cada estudiante debe dar su consentimiento explícito antes de usar el sistema."
              },
              {
                question: "¿Qué nivel de precisión tiene el sistema?",
                answer: "Nuestro sistema tiene una precisión del 95% en la detección de niveles de atención. Utilizamos modelos de deep learning entrenados con millones de imágenes y constantemente mejoramos nuestros algoritmos."
              },
              {
                question: "¿Funciona con clases virtuales y presenciales?",
                answer: "Sí, FocusLearn está diseñado para funcionar tanto en aulas físicas como en entornos de aprendizaje virtual, adaptándose a las necesidades de educación híbrida."
              },
              {
                question: "¿Qué requisitos técnicos necesito?",
                answer: "Solo necesitas una cámara web funcional y conexión a internet. El sistema es compatible con cualquier navegador moderno y no requiere instalación de software adicional."
              },
              {
                question: "¿Ofrecen soporte técnico y capacitación?",
                answer: "Sí, proporcionamos soporte técnico 24/7 y capacitación completa para docentes y administradores. También ofrecemos documentación detallada y tutoriales en video."
              }
            ].map((faq, index) => (
              <motion.div 
                key={index}
                className="border border-gray-200 rounded-lg overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <button
                  className="w-full px-6 py-4 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  <span className="text-gray-900">{faq.question}</span>
                  {openFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-orange-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                {openFaq === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="px-6 py-4 bg-gray-50 border-t border-gray-200"
                  >
                    <p className="text-gray-600">{faq.answer}</p>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="acerca" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="rounded-lg overflow-hidden shadow-xl">
              <ImageWithFallback 
                src="https://images.unsplash.com/photo-1643199021309-9d387abc8002?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjbGFzc3Jvb20lMjBsZWN0dXJlJTIwdW5pdmVyc2l0eXxlbnwxfHx8fDE3NjEyNjkxMzF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Aula universitaria"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h2 className="text-gray-900 mb-6">
                Acerca del Sistema
              </h2>
              <p className="text-gray-600 mb-4">
                FocusLearn es un sistema web innovador que emplea tecnología de visión por 
                computadora para detectar y analizar el nivel de distracción de estudiantes 
                de educación superior durante las clases presenciales y virtuales.
              </p>
              <p className="text-gray-600 mb-4">
                Mediante algoritmos avanzados de aprendizaje automático, nuestro sistema 
                identifica patrones de comportamiento, expresiones faciales, movimientos 
                oculares y posturas corporales que indican diferentes niveles de atención 
                o distracción.
              </p>
              <p className="text-gray-600 mb-6">
                Esta información permite a docentes e instituciones educativas tomar 
                decisiones informadas para mejorar las metodologías de enseñanza, 
                adaptar el contenido y aumentar el engagement estudiantil.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
                  <p className="bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">95%</p>
                  <p className="text-gray-700">Precisión</p>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
                  <p className="bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">Tiempo Real</p>
                  <p className="text-gray-700">Análisis</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contacto" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-gray-900 mb-4">
              Contacto
            </h2>
            <p className="text-gray-600">
              ¿Interesado en implementar FocusLearn? Contáctanos
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-gray-900 mb-4">
                Información de contacto
              </h3>
              <div className="space-y-3 text-gray-600">
                <p>
                  <strong>Email:</strong> contacto@focuslearn.com
                </p>
                <p>
                  <strong>Teléfono:</strong> +52 (55) 1234-5678
                </p>
                <p>
                  <strong>Horario:</strong> Lunes a Viernes, 9:00 AM - 6:00 PM
                </p>
                <p>
                  <strong>Soporte técnico:</strong> soporte@focuslearn.com
                </p>
              </div>
            </div>
            
            <div>
              <h3 className="text-gray-900 mb-4">
                Solicita una demostración
              </h3>
              <form className="space-y-4">
                <input 
                  type="text" 
                  placeholder="Nombre completo" 
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <input 
                  type="email" 
                  placeholder="Email institucional" 
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <input 
                  type="text" 
                  placeholder="Institución educativa" 
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <textarea 
                  placeholder="Cuéntanos sobre tus necesidades" 
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <Button className="w-full">
                  Solicitar demostración
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-900 to-black text-white py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-400">
            © 2025 <span className="bg-gradient-to-r from-cyan-500 to-cyan-600 bg-clip-text text-transparent">FocusLearn</span>. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}