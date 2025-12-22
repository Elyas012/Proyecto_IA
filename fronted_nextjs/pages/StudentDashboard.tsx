import { useState, useRef, useEffect, useCallback } from "react";
import api from '../lib/api';
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
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { StudentReport } from "./StudentReport";
import WebcamCapture from "../components/WebcamCapture";
import CourseMaterials from "../components/CourseMaterials";
import { Toaster, toast } from 'sonner';
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

interface UserProfile {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  user_code?: string;
}

interface PomodoroMetrics {
  total_events: number;
  auto_pauses: number;
  effective_seconds: number;
}

interface StudentDashboardProps {
  onLogout?: () => void;
}

interface PomodoroBackendStatus {
  status: 'idle' | 'working' | 'paused' | 'break_distracted';
  time_remaining_in_current_phase: number;
  is_distracted_during_pause: boolean;
  work_duration_minutes: number;
  pause_duration_minutes: number;
}

export function StudentDashboard({ onLogout }: StudentDashboardProps) {
  const [currentView, setCurrentView] = useState<ViewType>("classes");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFeaturesExtracted, setIsFeaturesExtracted] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState(0);
  const isFeaturesExtractedRef = useRef<boolean>(false);

  useEffect(() => {
    isFeaturesExtractedRef.current = isFeaturesExtracted;
  }, [isFeaturesExtracted]);

  const [attentionLevel, setAttentionLevel] = useState<AttentionLevel>("high");
  const [attentionScore, setAttentionScore] = useState(85);
  const [showLowAttentionAlert, setShowLowAttentionAlert] = useState(false);
  const [showMediumAttentionAlert, setShowMediumAttentionAlert] = useState(false);
  const [consecutiveLow, setConsecutiveLow] = useState(0);
  const lastReportedRef = useRef<number | null>(null);
  const [attentionHistory, setAttentionHistory] = useState<AttentionData[]>([
    { time: "0s", attention: 85 },
  ]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [pomodoroMetrics, setPomodoroMetrics] = useState<PomodoroMetrics | null>(null);
  const [autoPauseTriggered, setAutoPauseTriggered] = useState(false);
  
  const [pomodoroSession, setPomodoroSession] = useState(1);
  const [pomodoroPhase, setPomodoroPhase] = useState<PomodoroPhase>("trabajo");
  const [pomodoroTimeLeft, setPomodoroTimeLeft] = useState(25 * 60);
  const [isPomodoroActive, setIsPomodoroActive] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [backendPomodoroStatus, setBackendPomodoroStatus] = useState<PomodoroBackendStatus | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const loadUser = async () => {
    try {
      const resp = await api.get('/auth/me/');
      setUser(resp.data);
    } catch (err) {
      console.warn('No authenticated user (me) or error', err);
      setUser(null);
    }
  };

  const loadPomodoroMetrics = async () => {
    try {
      const resp = await api.get('/student/pomodoro-metrics/');
      setPomodoroMetrics(resp.data);
    } catch (err) {
      console.warn('Could not load pomodoro metrics', err);
      setPomodoroMetrics(null);
    }
  };

  const loadCourses = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        toast.warning('No token presente. Inicia sesión o pega un token en la opción correspondiente.');
        throw new Error('No auth token');
      }
      const response = await api.get('/student/courses/');
      setCourses(response.data);
    } catch (error) {
      console.error('Error loading courses:', error);
      toast.error('No autenticado o error al cargar cursos. Inicia sesión o pega un token.');
      setCourses([]);
    }
  };

  const handleFeaturesExtracted = useCallback((ready: boolean) => {
    console.log('📦 Features extracted:', ready);
    setIsFeaturesExtracted(ready);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    setToken(token);
    if (token) {
      loadUser();
      loadCourses();
      loadPomodoroMetrics();
    }
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;

    const fetchPomodoroStatus = async () => {
      if (!isPomodoroActive || !selectedCourse || !token) {
        return;
      }

      try {
        const response = await api.get(`/student/pomodoro-status/?class_session_id=${selectedCourse.id}`);
        const data: PomodoroBackendStatus = response.data;
        setBackendPomodoroStatus(data);

        if (data.status === 'working') {
          if (pomodoroPhase !== 'trabajo') setPomodoroPhase('trabajo');
          setPomodoroTimeLeft(data.time_remaining_in_current_phase);
        } else if (data.status === 'paused' || data.status === 'break_distracted') {
          if (pomodoroPhase === 'trabajo') {
            if (pomodoroSession % 4 === 0) {
              setPomodoroPhase('descanso-largo');
            } else {
              setPomodoroPhase('descanso-corto');
            }
          }
          if (data.is_distracted_during_pause && (pomodoroPhase === 'descanso-corto' || pomodoroPhase === 'descanso-largo')) {
            toast.error('🛑 Distracción detectada durante el descanso. La pausa se ha reiniciado.');
            setPomodoroTimeLeft(data.pause_duration_minutes * 60);
          } else {
            setPomodoroTimeLeft(data.time_remaining_in_current_phase);
          }
        } else if (data.status === 'idle') {
          setIsPomodoroActive(false);
          setPomodoroTimeLeft(0);
          setPomodoroPhase('trabajo');
        }
      } catch (error) {
        console.error('Error fetching pomodoro status:', error);
      }
    };

    if (isPomodoroActive && selectedCourse && token) {
      fetchPomodoroStatus(); 
      interval = setInterval(fetchPomodoroStatus, 5000);
    } else {
      if (interval) clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPomodoroActive, selectedCourse, token, pomodoroPhase, pomodoroSession]);

  const attentionScoreRef = useRef<number>(attentionScore);
  useEffect(() => {
    attentionScoreRef.current = attentionScore;
    console.log('📊 attentionScoreRef updated to:', attentionScore);
  }, [attentionScore]);

  useEffect(() => {
    if (!isAnalyzing || !isFeaturesExtracted) return;
    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = `${String(now.getSeconds()).padStart(2, '0')}s`;
      setAttentionHistory(prev => {
        const newHistory = [...prev, { time: timeStr, attention: Math.round(attentionScoreRef.current) }];
        return newHistory.slice(-40);
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [isAnalyzing, isFeaturesExtracted]);

  useEffect(() => {
    if (!isAnalyzing || !isFeaturesExtracted) {
      setAttentionHistory([]);
    }
  }, [isAnalyzing, isFeaturesExtracted]);

  // Temporizador Pomodoro - VERSIÓN CORREGIDA
useEffect(() => {
  if (!isPomodoroActive || !isFeaturesExtracted || !selectedCourse || !backendPomodoroStatus) return;
  
  const interval = setInterval(() => {
    setPomodoroTimeLeft(prev => {
      const currentStatus = backendPomodoroStatus.status;
      const currentAttention = attentionScoreRef.current;
      
      // Si backend está idle o break_distracted, sincroniza con backend
      if (currentStatus === 'idle' || currentStatus === 'break_distracted') {
        return backendPomodoroStatus.time_remaining_in_current_phase;
      }
      
      // Solo decrementa si la atención es >= 50
      const shouldDecrement = currentAttention >= 50;
      
      // En fase de trabajo
      if (currentStatus === 'working') {
        if (prev <= 1) {
          // ✅ Timer finished, transición a descanso
          const nextSession = pomodoroSession;
          console.log('🏁 Sesión completada:', nextSession);
          
          // Determinar tipo de descanso
          if (nextSession % 4 === 0) {
            console.log('🎉 Descanso largo (5 min) después de 4 sesiones');
            setPomodoroPhase('descanso-largo');
            setPomodoroTimeLeft(5 * 60); // 5 minutos
          } else {
            console.log('☕ Descanso corto (2 min)');
            setPomodoroPhase('descanso-corto');
            setPomodoroTimeLeft(2 * 60); // 2 minutos
          }
          
          // Notificar al backend
          api.post('/student/pomodoro-events/', { 
            class_session_id: selectedCourse.id, 
            event_type: 'auto_pause', 
            reason: 'work_session_ended',
            session_number: nextSession
          }).catch(error => console.error('Error posting auto_pause event:', error));
          
          return nextSession % 4 === 0 ? (5 * 60) : (2 * 60);
        }
        // Solo decrementa si hay buena atención, sino mantiene el tiempo
        return shouldDecrement ? prev - 1 : prev;
      }
      
      // En fase de pausa (descanso)
      if (currentStatus === 'paused') {
        if (prev <= 1) {
          // ✅ Descanso terminado, incrementar sesión y volver a trabajo
          const newSession = pomodoroSession + 1;
          console.log('🚀 Iniciando sesión:', newSession);
          
          setPomodoroSession(newSession); // ✅ Incrementar AQUÍ
          setPomodoroPhase('trabajo');
          setPomodoroTimeLeft(25 * 60); // 25 minutos de trabajo
          
          // Notificar al backend
          api.post('/student/pomodoro-events/', { 
            class_session_id: selectedCourse.id, 
            event_type: 'start', 
            reason: 'pause_ended',
            session_number: newSession
          }).catch(error => console.error('Error posting start event:', error));
          
          return 25 * 60;
        }
        // Durante la pausa, siempre decrementa
        return prev - 1;
      }
      
      return prev;
    });
  }, 1000);

  return () => clearInterval(interval);
}, [isPomodoroActive, isFeaturesExtracted, selectedCourse, backendPomodoroStatus, pomodoroSession]);
// ✅ IMPORTANTE: Agregar pomodoroSession a las dependencias

  const formatPomodoroTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const getPhaseName = (): string => {
    if (pomodoroPhase === "trabajo") return "Sesión de Trabajo";
    if (pomodoroPhase === "descanso-corto") return "Descanso Corto";
    return "Descanso Largo";
  };

  const toggleCamera = async () => {
    if (isCameraActive) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setIsCameraActive(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      streamRef.current = stream;

      if (videoRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        videoRef.current.srcObject = stream as any;
      }

      setIsCameraActive(true);
    } catch (err) {
      console.error("Error activando cámara:", err);
      toast.error("No se pudo activar la cámara");
    }
  };

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
    setExtractionProgress(10);
    
    const progressInterval = setInterval(() => {
      setExtractionProgress(p => Math.min(90, p + 10));
      if (isFeaturesExtractedRef.current) {
        setExtractionProgress(100);
        clearInterval(progressInterval);
        setTimeout(() => {
          alert("✅ Features extraídos exitosamente!");
        }, 300);
      }
    }, 500);
    
    setTimeout(() => {
      if (!isFeaturesExtractedRef.current) {
        console.log('🔥 FORCE FEATURES READY');
        setIsFeaturesExtracted(true);
      }
    }, 5000);
  };

  const stopAnalysis = () => {
    setIsAnalyzing(false);
    setIsFeaturesExtracted(false);
    setExtractionProgress(0);
  };

  // ✅ CRITICAL: useCallback para prevenir re-montaje de WebcamCapture
const handleAttentionUpdate = useCallback((score: number, level: 'high' | 'medium' | 'low') => {
  console.log('🔥🔥🔥 handleAttentionUpdate CALLED:', { 
    score, 
    level,
    timestamp: new Date().toLocaleTimeString() 
  });
  
  setAttentionScore(score);
  console.log('✅✅✅ setAttentionScore executed with:', score);
  
  // ✅ CAMBIO: Pausa SOLO si score <= 30% POR 5-10 SEGUNDOS (usaremos 7s como promedio)
  if (score <= 30) {
    setConsecutiveLow(prev => {
      const val = prev + 1;
      
      // ✅ PAUSA AUTOMÁTICA: SOLO 0-30% POR 7 SEGUNDOS CONSECUTIVOS
      if (val >= 7 && pomodoroPhase === 'trabajo' && isPomodoroActive) {
        console.log('⏸️ PAUSA AUTOMÁTICA: 7 segundos de baja atención');
        
        // Determinar tipo de descanso según la sesión actual
        const isLongBreak = pomodoroSession % 4 === 0;
        const breakDuration = isLongBreak ? (5 * 60) : (2 * 60); // 5 min o 2 min
        
        setPomodoroPhase(isLongBreak ? 'descanso-largo' : 'descanso-corto');
        setPomodoroTimeLeft(breakDuration);
        setAutoPauseTriggered(true);
        setTimeout(() => setAutoPauseTriggered(false), 5000);
        
        // Record auto-pause event to backend
        if (selectedCourse && isAnalyzing) {
          api.post('/student/pomodoro-events/', { 
            class_session_id: selectedCourse.id, 
            event_type: 'auto_pause', 
            reason: 'low_attention_7s',
            distraction_count: val,
            session_number: pomodoroSession
          }).catch(() => {});
        }
        
        toast(`🛑 Pausa automática: ${val}s de baja atención. ${isLongBreak ? 'Descanso largo (5 min)' : 'Descanso corto (2 min)'}`, {
          action: {
            label: 'OK',
            onClick: () => {},
          },
        });
        return 0; // Reset contador
      }
      
      // Lógica pausa durante descanso (mantiene igual)
      if ((pomodoroPhase === 'descanso-corto' || pomodoroPhase === 'descanso-largo') && 
          isPomodoroActive && selectedCourse && isAnalyzing) {
        api.post('/student/feature-records/', { 
          class_session_id: selectedCourse.id, 
          features: { attentionScore: score }, 
          attention_score: score 
        }).catch(() => {});
        toast.warning('⚠️ Distracción durante pausa.');
      }

      return val;
    });
  } else {
    // ✅ RESET: Si score > 30%, contador = 0
    setConsecutiveLow(0);
    setShowLowAttentionAlert(false);
    setShowMediumAttentionAlert(false);
  }
  
  // Alertas (mantiene igual)
  if (score < 40) {
    setAttentionLevel('low');
    setShowLowAttentionAlert(true);
    setShowMediumAttentionAlert(false);
  } else if (score < 70) {
    setAttentionLevel('medium');
    setShowLowAttentionAlert(false);
    setShowMediumAttentionAlert(true);
  } else {
    setAttentionLevel('high');
    setShowLowAttentionAlert(false);
    setShowMediumAttentionAlert(false);
  }

  // Record attention
  const now = Date.now();
  if (selectedCourse && isAnalyzing && 
      (!lastReportedRef.current || (now - lastReportedRef.current) > 1000)) {
    lastReportedRef.current = now;
    api.post('/student/record-attention/', { 
      class_session_id: selectedCourse.id, 
      attention_score: score,
      raw_features: [], 
      duration_seconds: 1 
    }).catch(() => {});
  }
}, [pomodoroPhase, isPomodoroActive, selectedCourse, isAnalyzing, pomodoroSession]);
// ✅ Agregar pomodoroSession a las dependencias

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
    setCurrentView("classes");
  };

  const togglePomodoro = async () => {
    if (!selectedCourse) {
      toast.error('Selecciona un curso para iniciar el Pomodoro.');
      return;
    }
    const newPomodoroActiveState = !isPomodoroActive;
    setIsPomodoroActive(newPomodoroActiveState);

    try {
      if (newPomodoroActiveState) {
        await api.post('/student/pomodoro-events/', { class_session_id: selectedCourse.id, event_type: 'start', reason: 'manual_start' });
        toast.success('Pomodoro iniciado!');
      } else {
        await api.post('/student/pomodoro-events/', { class_session_id: selectedCourse.id, event_type: 'manual_pause', reason: 'manual_pause_request' });
        toast.info('Pomodoro pausado.');
      }
    } catch (error) {
      console.error('Error toggling pomodoro:', error);
      toast.error('Error al cambiar el estado del Pomodoro.');
      setIsPomodoroActive(!newPomodoroActiveState);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50">
      <Toaster position="top-right" />
      <div className="flex">
        <aside className="w-64 min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-6 shadow-xl">
          <div className="mb-8">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-cyan-500 bg-clip-text text-transparent">FocusLearn</h2>
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

        <main className="flex-1 p-8">
          {currentView === "dashboard" && (
            <div>
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Bienvenido, {user ? (user.first_name ? `${user.first_name} ${user.last_name || ''}` : (user.username || user.email)) : 'Estudiante'}</h1>
                <p className="text-gray-600">Selecciona un curso para comenzar</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="border-l-4 border-l-cyan-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-gray-600">Eventos Pomodoro</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-3xl font-bold text-cyan-600">{pomodoroMetrics ? pomodoroMetrics.total_events : '—'}</span>
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Totales</p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-gray-600">Pausas Automáticas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-3xl font-bold text-green-600">{pomodoroMetrics ? pomodoroMetrics.auto_pauses : '—'}</span>
                      <BookOpen className="w-5 h-5 text-green-600" />
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Registradas</p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-gray-600">Tiempo Efectivo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-3xl font-bold text-blue-600">{pomodoroMetrics ? `${(pomodoroMetrics.effective_seconds / 3600).toFixed(1)}h` : '—'}</span>
                      <Clock className="w-5 h-5 text-blue-600" />
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Horas registradas</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Cursos Disponibles</CardTitle>
                  <CardDescription>Selecciona un curso para iniciar la sesión de monitoreo</CardDescription>
                </CardHeader>
                <CardContent>
                  {courses.length === 0 ? (
                    <div className="p-4">
                      <Alert className="border-cyan-300 bg-cyan-50">
                        <AlertCircle className="h-4 w-4 text-cyan-600" />
                        <AlertDescription className="text-cyan-700">
                          No se encontraron cursos. Inicia sesión para ver tus cursos.
                        </AlertDescription>
                      </Alert>
                      <div className="mt-4 flex gap-2">
                        <Button onClick={() => setCurrentView('profile')}>Iniciar Sesión / Perfil</Button>
                      </div>
                    </div>
                  ) : (
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
                              <p className="font-semibold text-gray-900">{course.name}</p>
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
                  )}
                </CardContent>
              </Card>

              {!selectedCourse && (
                <Alert className="border-cyan-300 bg-cyan-50 mb-8">
                  <AlertCircle className="h-4 w-4 text-cyan-600" />
                  <AlertDescription className="text-cyan-700">
                    <strong>Instrucciones:</strong> Selecciona un curso para comenzar. Luego ve a "Mis Clases" para activar la cámara e iniciar el análisis de atención.
                  </AlertDescription>
                </Alert>
              )}

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

          {currentView === "classes" && (
            <div>
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Sala de Clase Virtual</h1>
                <p className="text-gray-600">
                  {selectedCourse 
                    ? `Configuración y análisis - ${selectedCourse.name}`
                    : "Activa tu cámara y selecciona un curso para comenzar"
                  }
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Video en Vivo</CardTitle>
                      <CardDescription>Tu cámara - Configuración de análisis</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
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
                                    <p className="text-2xl font-bold text-white">
                                      {formatPomodoroTime(pomodoroTimeLeft)}
                                    </p>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={togglePomodoro}
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
                          className="block w-full h-full object-cover"
                          autoPlay
                          muted
                          playsInline
                        />
                        
                        {isCameraActive && (
                          <WebcamCapture
                            videoRef={videoRef}
                            isAnalyzing={isAnalyzing}
                            isCameraActive={isCameraActive}
                            onFeaturesExtracted={handleFeaturesExtracted}
                            onAttentionUpdate={handleAttentionUpdate}
                            classSessionId={selectedCourse?.id ?? null}
                          />
                        )}
                        
                        {!isCameraActive && (
                          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                            <div className="text-center text-white">
                              <CameraOff className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                              <p className="text-xl">Cámara desactivada</p>
                              <p className="text-sm text-gray-400 mt-2">Activa tu cámara para comenzar</p>
                            </div>
                          </div>
                        )}
                        
                        {isCameraActive && !streamRef.current && (
                          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-cyan-900 to-cyan-700">
                            <div className="text-center text-white">
                              <Camera className="w-16 h-16 mx-auto mb-4 animate-pulse" />
                              <p className="text-xl mb-2">Cámara Activada (Modo Simulación)</p>
                              <p className="text-sm text-cyan-200">Sistema de análisis activo</p>
                            </div>
                          </div>
                        )}
                        
                        {isCameraActive && isAnalyzing && !isFeaturesExtracted && (
                          <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                            <div className="text-center text-white">
                              <Brain className="w-16 h-16 mx-auto mb-4 animate-pulse" />
                              <p className="text-xl mb-4">Extrayendo features...</p>
                              <Progress value={extractionProgress} className="w-64 mx-auto" />
                              <p className="text-sm mt-2">{extractionProgress}%</p>
                              <div className="mt-6 space-y-2 text-left max-w-xs mx-auto">
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

                  {selectedCourse && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6"
                    >
                      <CourseMaterials courseId={selectedCourse.id} />
                    </motion.div>
                  )}
                </div>

                <div className="space-y-6">
                  {!selectedCourse ? (
                    <Card className="border-2 border-cyan-300 bg-gradient-to-br from-cyan-50 to-cyan-100">
                      <CardContent className="p-6 text-center">
                        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-orange-500" />
                        <h3 className="font-semibold text-gray-900 mb-2">No tienes una clase escogida</h3>
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
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Información de la Sesión</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Clase:</span>
                            <span className="font-medium text-gray-900">{selectedCourse.name}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Profesor:</span>
                            <span className="font-medium text-gray-900">{selectedCourse.professor}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Horario:</span>
                            <span className="font-medium text-gray-900">{selectedCourse.time}</span>
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
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="w-full mt-2"
                            onClick={async () => {
                              if (!selectedCourse) return;
                              try {
                                const res = await api.get('/student/pomodoro-metrics/');
                                const d = res.data;
                                toast(`📊 Eventos: ${d.total_events} · Pausas auto: ${d.auto_pauses} · Tiempo efectivo: ${Math.round(d.effective_seconds/60)} min`);
                              } catch (e) {
                                toast.error('Error al obtener métricas');
                              }
                            }}
                          >
                            Ver métricas
                          </Button>
                        </CardContent>
                      </Card>

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
                                <div className={`text-5xl font-bold mb-2 ${getAttentionColor()}`}>
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

                      {showMediumAttentionAlert && isFeaturesExtracted && (
                        <Alert className="border-yellow-400 bg-yellow-50 animate-pulse">
                          <AlertCircle className="h-4 w-4 text-yellow-600" />
                          <AlertDescription className="text-yellow-700">
                            ⚠️ Nivel de atención moderado — Mantén el enfoque
                          </AlertDescription>
                        </Alert>
                      )}

                      {autoPauseTriggered && (
                        <Alert className="border-cyan-400 bg-cyan-50">
                          <AlertCircle className="h-4 w-4 text-cyan-600" />
                          <AlertDescription className="text-cyan-700">
                            🔔 Pausa adelantada automáticamente por distracción sostenida
                          </AlertDescription>
                        </Alert>
                      )}
                    </>
                  )}

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

          {currentView === "stats" && (
            <div>
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Estadísticas</h1>
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

          {currentView === "report" && (
            <StudentReport onBack={() => setCurrentView("dashboard")} />
          )}

          {currentView === "profile" && (
            <div>
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Mi Perfil</h1>
                <p className="text-gray-600">Información de tu cuenta</p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Información Personal</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Nombre Completo</label>
                    <p className="text-gray-900">{user ? (user.first_name ? `${user.first_name} ${user.last_name || ''}` : user.username) : '—'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email</label>
                    <p className="text-gray-900">{user ? user.email : '—'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">ID de Usuario</label>
                    <p className="text-gray-900">{user ? (user.user_code || `USR${String(user.id).padStart(3, '0')}`) : '—'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Rol</label>
                    <Badge>{user ? (user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Estudiante') : '—'}</Badge>
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
