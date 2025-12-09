import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { Badge } from "../components/ui/badge";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Separator } from "../components/ui/separator";
import { 
  LayoutDashboard, 
  Video, 
  BarChart3, 
  User, 
  Camera, 
  CameraOff, 
  AlertCircle,
  CheckCircle,
  Activity,
  Clock,
  TrendingUp,
  BookOpen,
  LogOut,
  FileText,
  Eye,
  Smile,
  Brain,
  PlayCircle
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { StudentReport } from "./StudentReport";
import { motion } from "framer-motion";


type ViewType = "dashboard" | "classes" | "stats" | "profile" | "report";
type AttentionLevel = "high" | "medium" | "low";
type PomodoroPhase = "trabajo" | "descanso-corto" | "descanso-largo";

interface AttentionData {
  time: string;
  attention: number;
}

interface Course {
  id: string;
  name: string;
  professor: string;
  time: string;
  status: "active" | "upcoming" | "completed";
}

interface StudentDashboardProps {
  onLogout?: () => void;
}

export function StudentDashboard({ onLogout }: StudentDashboardProps) {
  const [currentView, setCurrentView] = useState<ViewType>("classes");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFeaturesExtracted, setIsFeaturesExtracted] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [attentionLevel, setAttentionLevel] = useState<AttentionLevel>("high");
  const [attentionScore, setAttentionScore] = useState(85);
  const [showLowAttentionAlert, setShowLowAttentionAlert] = useState(false);
  const [attentionHistory, setAttentionHistory] = useState<AttentionData[]>([
    { time: "0s", attention: 85 },
  ]);
  
  // Estados para Pomodoro
  const [pomodoroSession, setPomodoroSession] = useState(1);
  const [pomodoroPhase, setPomodoroPhase] = useState<PomodoroPhase>("trabajo");
  const [pomodoroTimeLeft, setPomodoroTimeLeft] = useState(25 * 60);
  const [isPomodoroActive, setIsPomodoroActive] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Cargar cursos del estudiante desde la API
  useEffect(() => {
    const loadCourses = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await axios.get('http://localhost:8000/api/student/courses/', {
          headers: { 'Authorization': `Token ${token}` }
        });
        setCourses(response.data);
      } catch (error) {
        console.error('Error loading courses:', error);
        // Fallback a cursos estáticos si hay error
        setCourses([
          {
            id: "1",
            name: "Algoritmos y Estructuras de Datos",
            professor: "Prof. María García",
            time: "10:00 AM",
            status: "active"
          },
          {
            id: "2",
            name: "Bases de Datos",
            professor: "Prof. Carlos Ruiz",
            time: "2:00 PM",
            status: "upcoming"
          },
          {
            id: "3",
            name: "Inteligencia Artificial",
            professor: "Prof. Ana Martínez",
            time: "4:00 PM",
            status: "upcoming"
          }
        ]);
      }
    };
    loadCourses();
  }, []);

  // Simulación de análisis de atención
  useEffect(() => {
    if (!isAnalyzing || !isFeaturesExtracted) return;

    const interval = setInterval(() => {
      // Simulamos cambios aleatorios en el nivel de atención
      const newScore = Math.max(20, Math.min(100, attentionScore + (Math.random() - 0.5) * 30));
      setAttentionScore(Math.round(newScore));

      // Determinar nivel de atención
      let level: AttentionLevel = "high";
      if (newScore < 40) {
        level = "low";
        setShowLowAttentionAlert(true);
      } else if (newScore < 70) {
        level = "medium";
      } else {
        setShowLowAttentionAlert(false);
      }
      setAttentionLevel(level);

      // Actualizar historial
      const now = new Date();
      const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      setAttentionHistory(prev => {
        const newHistory = [...prev, { time: timeStr, attention: Math.round(newScore) }];
        return newHistory.slice(-20); // Mantener solo los últimos 20 puntos
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isAnalyzing, isFeaturesExtracted, attentionScore]);

  // Temporizador Pomodoro
  useEffect(() => {
    if (!isPomodoroActive || !isFeaturesExtracted) return;

    const interval = setInterval(() => {
      setPomodoroTimeLeft(prev => {
        if (prev <= 1) {
          // Cambiar de fase
          if (pomodoroPhase === "trabajo") {
            // Después de 4 sesiones de trabajo, descanso largo
            if (pomodoroSession % 4 === 0) {
              setPomodoroPhase("descanso-largo");
              return 15 * 60; // 15 minutos
            } else {
              setPomodoroPhase("descanso-corto");
              return 5 * 60; // 5 minutos
            }
          } else {
            // Volver a trabajo
            setPomodoroPhase("trabajo");
            setPomodoroSession(prev => prev + 1);
            return 25 * 60; // 25 minutos
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPomodoroActive, isFeaturesExtracted, pomodoroPhase, pomodoroSession]);

  // Formatear tiempo en MM:SS
  const formatPomodoroTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Obtener nombre de la fase
  const getPhaseName = (): string => {
    if (pomodoroPhase === "trabajo") return "Sesión de Trabajo";
    if (pomodoroPhase === "descanso-corto") return "Descanso Corto";
    return "Descanso Largo";
  };

  // Activar/desactivar cámara
  const toggleCamera = async () => {
    if (isCameraActive) {
      // Desactivar cámara
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setIsCameraActive(false);
      setIsAnalyzing(false);
      setIsFeaturesExtracted(false);
      setExtractionProgress(0);
    } else {
      // Simulación: activar cámara sin acceso real
      setIsCameraActive(true);
      
      // Opcional: Intentar acceder a la cámara real (pero no es obligatorio)
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 1280, height: 720 },
          audio: false 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        streamRef.current = stream;
      } catch (error) {
        console.log("No se pudo acceder a la cámara real, usando simulación");
        // No mostramos error, solo activamos el modo simulación
      }
    }
  };

  // Iniciar análisis y extracción de features
  const startAnalysis = () => {
    if (!isCameraActive) {
      alert("Primero debes activar la cámara");
      return;
    }
    
    if (!selectedCourse) {
      alert("Primero debes seleccionar un curso desde el Dashboard");
      return;
    }

    setIsAnalyzing(true);
    
    // Simular extracción de features (ojos, boca, etc.)
    let progress = 0;
    const extractionInterval = setInterval(() => {
      progress += 10;
      setExtractionProgress(progress);
      
      if (progress >= 100) {
        clearInterval(extractionInterval);
        setIsFeaturesExtracted(true);
        // Mostrar notificación de éxito
        setTimeout(() => {
          alert("✅ Features extraídos exitosamente!\n\n- Detección de ojos\n- Detección de boca\n- Análisis de expresión facial\n- Postura corporal\n\nPuedes continuar con la clase.");
        }, 500);
      }
    }, 500);
  };

  const stopAnalysis = () => {
    setIsAnalyzing(false);
    setIsFeaturesExtracted(false);
    setExtractionProgress(0);
  };

  const getAttentionColor = () => {
    if (attentionLevel === "high") return "text-green-600";
    if (attentionLevel === "medium") return "text-yellow-600";
    return "text-red-600";
  };

  const getAttentionBgColor = () => {
    if (attentionLevel === "high") return "bg-green-100 border-green-300";
    if (attentionLevel === "medium") return "bg-yellow-100 border-yellow-300";
    return "bg-red-100 border-red-300";
  };

  const handleSelectCourse = (course: Course) => {
    setSelectedCourse(course);
    setCurrentView("classes"); // Redirigir a "Mis Clases"
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-6 shadow-xl">
          <div className="mb-8">
            <h2 className="bg-gradient-to-r from-cyan-400 to-cyan-500 bg-clip-text text-transparent">FocusLearn</h2>
            <p className="text-gray-400 text-sm mt-1">Panel Estudiante</p>
          </div>

          <nav className="space-y-2">
            <button
              onClick={() => setCurrentView("dashboard")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                currentView === "dashboard" 
                  ? "bg-cyan-500 text-white" 
                  : "text-gray-300 hover:bg-gray-800"
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setCurrentView("classes")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                currentView === "classes" 
                  ? "bg-cyan-500 text-white" 
                  : "text-gray-300 hover:bg-gray-800"
              }`}
            >
              <Video className="w-5 h-5" />
              <span>Mis Clases</span>
              {selectedCourse && (
                <Badge className="ml-auto bg-cyan-600 text-white">1</Badge>
              )}
            </button>

            <button
              onClick={() => setCurrentView("stats")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                currentView === "stats" 
                  ? "bg-cyan-500 text-white" 
                  : "text-gray-300 hover:bg-gray-800"
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              <span>Estadísticas</span>
            </button>

            <button
              onClick={() => setCurrentView("report")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                currentView === "report" 
                  ? "bg-cyan-500 text-white" 
                  : "text-gray-300 hover:bg-gray-800"
              }`}
            >
              <FileText className="w-5 h-5" />
              <span>Mi Reporte</span>
            </button>

            <button
              onClick={() => setCurrentView("profile")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                currentView === "profile" 
                  ? "bg-cyan-500 text-white" 
                  : "text-gray-300 hover:bg-gray-800"
              }`}
            >
              <User className="w-5 h-5" />
              <span>Mi Perfil</span>
            </button>
          </nav>

          <div className="mt-auto pt-8">
            <Separator className="mb-4 bg-gray-700" />
            <button 
              onClick={onLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {/* Dashboard View */}
          {currentView === "dashboard" && (
            <div>
              <div className="mb-8">
                <h1 className="text-gray-900 mb-2">Bienvenido, Estudiante</h1>
                <p className="text-gray-600">Selecciona un curso para comenzar</p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="border-l-4 border-l-cyan-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-gray-600">Atención Promedio</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-cyan-600">82%</span>
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Esta semana</p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-gray-600">Clases Atendidas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-green-600">12/15</span>
                      <BookOpen className="w-5 h-5 text-green-600" />
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Este mes</p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-gray-600">Tiempo Total</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-blue-600">24.5h</span>
                      <Clock className="w-5 h-5 text-blue-600" />
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Este mes</p>
                  </CardContent>
                </Card>
              </div>

              {/* Cursos Disponibles */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Cursos Disponibles</CardTitle>
                  <CardDescription>Selecciona un curso para iniciar la sesión de monitoreo</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {courses.map((course) => (
                      <motion.div
                        key={course.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                          selectedCourse?.id === course.id
                            ? "bg-gradient-to-r from-cyan-50 to-cyan-100 border-cyan-300 shadow-md"
                            : course.status === "active"
                            ? "bg-gradient-to-r from-green-50 to-green-100 border-green-200"
                            : "bg-gray-50 border-gray-200"
                        }`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${
                            selectedCourse?.id === course.id
                              ? "bg-cyan-500"
                              : course.status === "active"
                              ? "bg-green-500"
                              : "bg-gray-400"
                          }`}>
                            <BookOpen className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-gray-900">{course.name}</p>
                            <p className="text-sm text-gray-600">{course.professor} - {course.time}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {course.status === "active" && (
                            <Badge className="bg-green-600">En vivo</Badge>
                          )}
                          {selectedCourse?.id === course.id ? (
                            <Badge className="bg-cyan-600">Seleccionado</Badge>
                          ) : (
                            <Button onClick={() => handleSelectCourse(course)}>
                              Seleccionar
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Instrucciones */}
              {!selectedCourse && (
                <Alert className="border-cyan-300 bg-cyan-50">
                  <AlertCircle className="h-4 w-4 text-cyan-600" />
                  <AlertDescription className="text-cyan-700">
                    <strong>Instrucciones:</strong> Selecciona un curso para comenzar. Luego ve a "Mis Clases" para activar la cámara e iniciar el análisis de atención.
                  </AlertDescription>
                </Alert>
              )}

              {/* Quick Access to Report */}
              <Card className="border-2 border-cyan-200 bg-gradient-to-br from-cyan-50 to-cyan-100">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-orange-600" />
                    <CardTitle>Reporte Individual</CardTitle>
                  </div>
                  <CardDescription className="text-gray-700">
                    Consulta tu historial de atención
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 mb-4">
                    Revisa gráficos detallados, análisis temporal y recomendaciones personalizadas para mejorar tu desempeño.
                  </p>
                  <Button 
                    onClick={() => setCurrentView("report")}
                    className="w-full"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Ver mi reporte completo
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Classes View - Video Analysis */}
          {currentView === "classes" && (
            <div>
              <div className="mb-8">
                <h1 className="text-gray-900 mb-2">Sala de Clase Virtual</h1>
                <p className="text-gray-600">
                  {selectedCourse 
                    ? `Configuración y análisis - ${selectedCourse.name}`
                    : "Activa tu cámara y selecciona un curso para comenzar"
                  }
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Video Section */}
                <div className="lg:col-span-2 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Video en Vivo</CardTitle>
                      <CardDescription>Tu cámara - Configuración de análisis</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                        {/* Temporizador Pomodoro - Arriba de la cámara */}
                        {isCameraActive && isFeaturesExtracted && (
                          <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute top-4 right-4 z-10"
                          >
                            <Card className="bg-gradient-to-br from-cyan-500 to-cyan-600 border-cyan-700 shadow-lg">
                              <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                  <Clock className="w-6 h-6 text-white" />
                                  <div>
                                    <p className="text-sm text-cyan-100">
                                      {getPhaseName()} #{pomodoroSession}
                                    </p>
                                    <p className="text-2xl text-white">
                                      {formatPomodoroTime(pomodoroTimeLeft)}
                                    </p>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => setIsPomodoroActive(!isPomodoroActive)}
                                    className="ml-2"
                                  >
                                    {isPomodoroActive ? "Pausar" : "Iniciar"}
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        )}
                        
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover"
                        />
                        {!isCameraActive && (
                          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                            <div className="text-center text-white">
                              <CameraOff className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                              <p>Cámara desactivada</p>
                              <p className="text-sm text-gray-400 mt-2">Activa tu cámara para comenzar</p>
                            </div>
                          </div>
                        )}
                        
                        {/* Indicador de modo simulación cuando la cámara está activa pero sin video real */}
                        {isCameraActive && !streamRef.current && (
                          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-cyan-900 to-cyan-700">
                            <div className="text-center text-white">
                              <Camera className="w-16 h-16 mx-auto mb-4 animate-pulse" />
                              <p className="text-xl mb-2">Cámara Activada (Modo Simulación)</p>
                              <p className="text-sm text-cyan-200">Sistema de análisis activo</p>
                            </div>
                          </div>
                        )}
                        
                        {/* Overlay de estado */}
                        {isCameraActive && isAnalyzing && !isFeaturesExtracted && (
                          <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                            <div className="text-center text-white">
                              <Brain className="w-16 h-16 mx-auto mb-4 animate-pulse" />
                              <p className="mb-4">Extrayendo features...</p>
                              <Progress value={extractionProgress} className="w-64 mx-auto" />
                              <p className="text-sm mt-2">{extractionProgress}%</p>
                              <div className="mt-6 space-y-2 text-left">
                                <div className="flex items-center gap-2">
                                  <Eye className={`w-4 h-4 ${extractionProgress >= 25 ? 'text-green-400' : 'text-gray-400'}`} />
                                  <span className={extractionProgress >= 25 ? 'text-green-400' : 'text-gray-400'}>
                                    Detección de ojos
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Smile className={`w-4 h-4 ${extractionProgress >= 50 ? 'text-green-400' : 'text-gray-400'}`} />
                                  <span className={extractionProgress >= 50 ? 'text-green-400' : 'text-gray-400'}>
                                    Detección de boca
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Activity className={`w-4 h-4 ${extractionProgress >= 75 ? 'text-green-400' : 'text-gray-400'}`} />
                                  <span className={extractionProgress >= 75 ? 'text-green-400' : 'text-gray-400'}>
                                    Análisis de expresión facial
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <User className={`w-4 h-4 ${extractionProgress >= 100 ? 'text-green-400' : 'text-gray-400'}`} />
                                  <span className={extractionProgress >= 100 ? 'text-green-400' : 'text-gray-400'}>
                                    Postura corporal
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Badge cuando está listo */}
                        {isCameraActive && isFeaturesExtracted && (
                          <div className="absolute top-4 left-4">
                            <Badge className="bg-green-500">
                              <Activity className="w-3 h-3 mr-1" />
                              Analizando en vivo
                            </Badge>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-4 mt-4">
                        <Button
                          onClick={toggleCamera}
                          variant={isCameraActive ? "destructive" : "default"}
                          className="flex-1"
                        >
                          {isCameraActive ? (
                            <>
                              <CameraOff className="w-4 h-4 mr-2" />
                              Desactivar Cámara
                            </>
                          ) : (
                            <>
                              <Camera className="w-4 h-4 mr-2" />
                              Activar Cámara
                            </>
                          )}
                        </Button>

                        <Button
                          onClick={isAnalyzing ? stopAnalysis : startAnalysis}
                          variant={isFeaturesExtracted ? "secondary" : "default"}
                          className="flex-1"
                          disabled={!isCameraActive || !selectedCourse}
                        >
                          {isAnalyzing ? (
                            <>
                              <PlayCircle className="w-4 h-4 mr-2" />
                              {isFeaturesExtracted ? "Detener Análisis" : "Procesando..."}
                            </>
                          ) : (
                            <>
                              <PlayCircle className="w-4 h-4 mr-2" />
                              Iniciar Análisis
                            </>
                          )}
                        </Button>
                      </div>

                      {/* Mensaje de advertencia si no hay curso */}
                      {!selectedCourse && (
                        <Alert className="mt-4 border-cyan-300 bg-cyan-50">
                          <AlertCircle className="h-4 w-4 text-cyan-600" />
                          <AlertDescription className="text-cyan-700">
                            Puedes activar la cámara, pero necesitas seleccionar un curso para iniciar el análisis.
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>

                  {/* Real-time Chart */}
                  {isFeaturesExtracted && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card>
                        <CardHeader>
                          <CardTitle>Gráfico de Atención en Tiempo Real</CardTitle>
                          <CardDescription>Últimos 40 segundos</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={200}>
                            <AreaChart data={attentionHistory}>
                              <defs>
                                <linearGradient id="colorAttention" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#ff6b35" stopOpacity={0.8}/>
                                  <stop offset="95%" stopColor="#ff6b35" stopOpacity={0.1}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                              <XAxis 
                                dataKey="time" 
                                tick={{ fontSize: 12 }}
                                stroke="#6b7280"
                              />
                              <YAxis 
                                domain={[0, 100]}
                                tick={{ fontSize: 12 }}
                                stroke="#6b7280"
                              />
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: '#fff',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '8px'
                                }}
                              />
                              <Area 
                                type="monotone" 
                                dataKey="attention" 
                                stroke="#ff6b35" 
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorAttention)"
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </div>

                {/* Right Sidebar */}
                <div className="space-y-6">
                  {/* Mensaje cuando no hay curso seleccionado */}
                  {!selectedCourse ? (
                    <Card className="border-2 border-cyan-300 bg-gradient-to-br from-cyan-50 to-cyan-100">
                      <CardContent className="p-6 text-center">
                        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-orange-500" />
                        <h3 className="text-gray-900 mb-2">No tienes una clase escogida</h3>
                        <p className="text-sm text-gray-700 mb-4">
                          Para iniciar el análisis de atención, primero debes seleccionar un curso desde el Dashboard.
                        </p>
                        <Button 
                          onClick={() => setCurrentView("dashboard")}
                          className="w-full"
                        >
                          <BookOpen className="w-4 h-4 mr-2" />
                          Ir a Cursos
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      {/* Session Info */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Información de la Sesión</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Clase:</span>
                            <span className="text-gray-900">{selectedCourse.name}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Profesor:</span>
                            <span className="text-gray-900">{selectedCourse.professor}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Horario:</span>
                            <span className="text-gray-900">{selectedCourse.time}</span>
                          </div>
                          <Separator />
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Estado Cámara:</span>
                            <Badge variant={isCameraActive ? "default" : "secondary"}>
                              {isCameraActive ? "Activa" : "Inactiva"}
                            </Badge>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Features:</span>
                            <Badge variant={isFeaturesExtracted ? "default" : "secondary"}>
                              {isFeaturesExtracted ? "Extraídos" : "Pendiente"}
                            </Badge>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Análisis:</span>
                            <Badge variant={isFeaturesExtracted ? "default" : "secondary"}>
                              {isFeaturesExtracted ? "En progreso" : "No iniciado"}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Attention Level Card - Solo si features están extraídos */}
                      {isFeaturesExtracted && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                        >
                          <Card className={`border-2 ${getAttentionBgColor()}`}>
                            <CardHeader>
                              <CardTitle className="text-sm">Nivel de Atención</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-center">
                                <div className={`text-5xl mb-2 ${getAttentionColor()}`}>
                                  {attentionScore}%
                                </div>
                                <Badge 
                                  variant={attentionLevel === "high" ? "default" : "secondary"}
                                  className={`${
                                    attentionLevel === "high" 
                                      ? "bg-green-600" 
                                      : attentionLevel === "medium" 
                                      ? "bg-yellow-600" 
                                      : "bg-red-600"
                                  } text-white`}
                                >
                                  {attentionLevel === "high" && "Atento"}
                                  {attentionLevel === "medium" && "Moderado"}
                                  {attentionLevel === "low" && "Distraído"}
                                </Badge>
                              </div>
                              <Progress 
                                value={attentionScore} 
                                className="mt-4 h-3"
                              />
                            </CardContent>
                          </Card>
                        </motion.div>
                      )}

                      {/* Low Attention Alert */}
                      {showLowAttentionAlert && isFeaturesExtracted && (
                        <Alert className="border-red-500 bg-red-50 animate-pulse">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          <AlertDescription className="text-red-700">
                            ⚠️ <strong>Nivel de atención bajo</strong>
                            <br />
                            Intenta concentrarte en la clase
                          </AlertDescription>
                        </Alert>
                      )}
                    </>
                  )}

                  {/* Tips Card */}
                  <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200">
                    <CardHeader>
                      <CardTitle className="text-sm">💡 Consejos</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-gray-700">
                      <p>• Mantén la cámara encendida</p>
                      <p>• Evita distracciones externas</p>
                      <p>• Mantén contacto visual</p>
                      <p>• Toma notas activamente</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {/* Stats View */}
          {currentView === "stats" && (
            <div>
              <div className="mb-8">
                <h1 className="text-gray-900 mb-2">Estadísticas</h1>
                <p className="text-gray-600">Tu rendimiento académico</p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Próximamente</CardTitle>
                  <CardDescription>Estadísticas detalladas de tu desempeño</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Esta sección estará disponible pronto con gráficos detallados de tu progreso.</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Report View */}
          {currentView === "report" && (
            <StudentReport onBack={() => setCurrentView("dashboard")} />
          )}

          {/* Profile View */}
          {currentView === "profile" && (
            <div>
              <div className="mb-8">
                <h1 className="text-gray-900 mb-2">Mi Perfil</h1>
                <p className="text-gray-600">Información de tu cuenta</p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Información Personal</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-600">Nombre Completo</label>
                    <p className="text-gray-900">Juan Pérez</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Email</label>
                    <p className="text-gray-900">estudiante@espe.edu.ec</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">ID de Usuario</label>
                    <p className="text-gray-900">EST001</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Rol</label>
                    <Badge>Estudiante</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}